"""
routes/voice.py — Voice command parsing endpoint.

Accepts a raw speech transcript and returns a structured intent object that
the frontend can act on (colour change, garment switch, navigation, reset).
"""
from fastapi import APIRouter

from schemas.schemas import VoiceCommandRequest, VoiceCommandResponse
from services.voice_parser import parse_voice_command

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post(
    "/command",
    response_model=VoiceCommandResponse,
    summary="Parse a voice command transcript into a structured intent",
)
def voice_command(request: VoiceCommandRequest) -> VoiceCommandResponse:
    """
    Parse a raw voice transcript and return the detected intent.

    The parser uses pure-Python keyword matching — no external ML library
    is required. Optionally provide `current_garment` and `current_color`
    as context to improve message quality.

    Intent values returned:
    - **CHANGE_COLOR** — user wants to change the garment's colour
    - **CHANGE_GARMENT** — user wants to switch to a different garment type
    - **NAVIGATE** — user wants to go to a different app section
    - **RESET** — user wants to clear the current selection
    - **UNKNOWN** — transcript did not match any known pattern
    """
    result = parse_voice_command(
        transcript=request.transcript,
        current_garment=request.current_garment,
        current_color=request.current_color,
    )

    return VoiceCommandResponse(**result)
