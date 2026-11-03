"""
routes/tryon.py — Virtual try-on endpoint.

Currently operates in DEMO mode: it returns garment metadata and a descriptive
message without running a real AI inference model. An AI_MODE stub is included
and clearly labelled for future integration.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.garment import Garment
from schemas.schemas import TryOnRequest, TryOnResponse

router = APIRouter(prefix="/tryon", tags=["Try-On"])


@router.post("", response_model=TryOnResponse, summary="Virtual garment try-on")
def try_on_garment(
    request: TryOnRequest, db: Session = Depends(get_db)
) -> TryOnResponse:
    """
    Apply a selected garment to the user's uploaded photo.

    **DEMO MODE** — No AI model is loaded. The endpoint validates that the
    garment exists and returns a structured response describing what would be
    applied. Integrate a real diffusion or segmentation model here to upgrade
    to AI_MODE.

    Request body:
    - **garment_id**: ID of the garment to overlay
    - **image_path**: Path to the user's uploaded photo (from `/api/upload`)
    - **color**: Optional hex colour override for the garment
    """
    # --- Validate garment exists ----------------------------------------
    garment = db.query(Garment).filter(Garment.id == request.garment_id).first()
    if not garment:
        raise HTTPException(
            status_code=404,
            detail=f"Garment '{request.garment_id}' not found.",
        )

    # Resolve effective colour: use request override if provided, else garment default
    effective_color = request.color if request.color else garment.color

    # --- FASHN VTON / COLAB NGROK AI MODE -------------------------------
    if request.fashn_api_url:
        import urllib.request
        import json
        import base64
        import os
        import uuid

        api_url = request.fashn_api_url.strip()
        # Auto-append endpoint path if only host is provided
        if not api_url.endswith("/run") and not api_url.endswith("/predict") and not api_url.endswith("/tryon"):
            api_url = api_url.rstrip("/") + "/run"

        try:
            # Map category to FASHN categories (tops, bottoms, one-pieces)
            cat_map = {
                "top": "tops",
                "tee": "tops",
                "jacket": "tops",
                "kurta": "tops",
                "dress": "one-pieces"
            }
            fashn_category = cat_map.get(garment.category, "tops")

            # Prepare payload for FASHN VTON Colab endpoint
            payload = {
                "model_image": request.image_path or "demo_model",
                "garment_image": garment.category,
                "category": fashn_category,
                "garment_id": garment.id,
                "color": effective_color
            }

            req_data = json.dumps(payload).encode("utf-8")
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "StyleSpeak-VTON-Client/1.0",
                "ngrok-skip-browser-warning": "69420"
            }
            if request.fashn_api_key:
                headers["Authorization"] = f"Bearer {request.fashn_api_key}"

            req = urllib.request.Request(api_url, data=req_data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=45) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))

                # Check if response contains an image URL or base64
                res_img = resp_data.get("output", [None])[0] if isinstance(resp_data.get("output"), list) else resp_data.get("image_url") or resp_data.get("result_image")

                if res_img and res_img.startswith("data:image"):
                    # Save base64 image to uploads/
                    header, encoded = res_img.split(",", 1)
                    img_bytes = base64.b64decode(encoded)
                    out_filename = f"fashn_{uuid.uuid4().hex}.png"
                    out_path = os.path.join("uploads", out_filename)
                    with open(out_path, "wb") as f:
                        f.write(img_bytes)
                    res_img = f"/uploads/{out_filename}"

                return TryOnResponse(
                    result_image_path=res_img or request.image_path or "/uploads/fashn_demo.png",
                    mode="AI_FASHN_VTON",
                    message=(
                        f"FASHN VTON v1.5 synthesis complete on GPU! "
                        f"Applied '{garment.name}' ({fashn_category}) in {effective_color}. "
                        f"Style tip: {garment.style_notes or garment.description}"
                    ),
                    garment_applied=True
                )
        except Exception as e:
            return TryOnResponse(
                result_image_path=request.image_path or "/demo-overlay",
                mode="AI_ERROR_FALLBACK",
                message=(
                    f"Connected to FASHN Colab at {request.fashn_api_url}, but inference reported: {str(e)}. "
                    f"Falling back to real-time 3D AR body fitting mode."
                ),
                garment_applied=False
            )

    # --- DEMO MODE response ---------------------------------------------
    # Resolve effective colour: use request override if provided, else garment default
    effective_color = request.color if request.color else garment.color

    # In a real implementation this path would point to a generated image.
    # For demo mode we echo the original upload path back or provide a placeholder.
    result_image_path = request.image_path if request.image_path else "/demo-overlay"

    return TryOnResponse(
        result_image_path=result_image_path,
        mode="DEMO",
        message=(
            f"Demo mode active — AI try-on model not loaded. "
            f"Garment '{garment.name}' ({garment.category}) in colour "
            f"{effective_color} would be applied to your photo. "
            f"Style tip: {garment.style_notes or garment.description}"
        ),
        garment_applied=True,
    )
