"""
routes/upload.py — File upload endpoint for user photos.

Validates file type and size, saves to the uploads/ directory with a UUID
prefix to avoid filename collisions, and returns the stored path.
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas.schemas import UploadResponse

router = APIRouter(prefix="/upload", tags=["Upload"])

# Directory where user uploads are persisted (relative to the project root)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed MIME types for photo uploads
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Maximum accepted file size: 10 MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("", response_model=UploadResponse, summary="Upload a user photo")
async def upload_photo(file: UploadFile = File(...)) -> UploadResponse:
    """
    Accept a JPEG / PNG / WebP image upload, validate it, and save it to disk.

    - **file**: multipart/form-data file field
    - Returns the stored filename and relative path for use in try-on requests.
    """
    # --- Validate content type -------------------------------------------
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                "Please upload a JPEG, PNG, or WebP image."
            ),
        )

    # --- Read file content and enforce size limit -----------------------
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File size {len(content) / (1024 * 1024):.1f} MB exceeds "
                f"the 10 MB limit."
            ),
        )

    # --- Build unique filename ------------------------------------------
    original_suffix = Path(file.filename or "photo.jpg").suffix.lower() or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{original_suffix}"
    destination = UPLOAD_DIR / unique_name

    # --- Persist to disk -------------------------------------------------
    destination.write_bytes(content)

    # Relative URL path consumed by the frontend (served as /uploads/<name>)
    file_path = f"/uploads/{unique_name}"

    return UploadResponse(
        file_path=file_path,
        filename=unique_name,
        message=f"File '{file.filename}' uploaded successfully.",
    )
