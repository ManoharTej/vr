"""
routes/recommendations.py — Outfit recommendation endpoint.

Returns a complete outfit suggestion based on occasion, optional style
preference, and optional weather context. Powered by a rule-based engine —
no LLM required.
"""
from fastapi import APIRouter

from schemas.schemas import RecommendationRequest, RecommendationResponse
from services.recommender import get_recommendation

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post(
    "",
    response_model=RecommendationResponse,
    summary="Get an outfit recommendation for a given occasion",
)
def recommend_outfit(request: RecommendationRequest) -> RecommendationResponse:
    """
    Generate an outfit recommendation tailored to the provided context.

    - **occasion**: Required — e.g. `college`, `office`, `party`, `wedding`,
      `date`, `festival`, `birthday`, `casual`, `traditional`, `interview`.
    - **style_preference**: Optional modifier — `minimal`, `bold`, `classic`,
      or `traditional`.
    - **weather**: Optional climate hint — `warm`, `cool`, or `rainy`.

    Supported occasions default to **casual** if an unrecognised value is supplied.
    """
    rec = get_recommendation(
        occasion=request.occasion,
        style_preference=request.style_preference,
        weather=request.weather,
    )

    return RecommendationResponse(**rec)
