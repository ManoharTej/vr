"""
schemas/schemas.py — Pydantic v2 request/response models for all API routes.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Garment schemas
# ---------------------------------------------------------------------------


class GarmentBase(BaseModel):
    """Fields shared between create and response schemas."""

    name: str = Field(..., description="Human-readable garment name")
    category: str = Field(..., description="top | dress | jacket | tee | kurta")
    type: str = Field(..., description="Style type e.g. Casual, Formal, Party")
    color: str = Field(..., description="Hex colour string e.g. #d85c79")
    occasions: str = Field(..., description="Comma-separated occasion list")
    description: str = Field(..., description="Short marketing description")
    style_notes: Optional[str] = Field(None, description="Optional styling tips")


class GarmentCreate(GarmentBase):
    """Schema used when inserting a new garment (ID is supplied by caller)."""

    id: str = Field(..., description="Unique garment identifier e.g. g1")


class GarmentResponse(GarmentBase):
    """Schema returned to API consumers — includes generated fields."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Upload schemas
# ---------------------------------------------------------------------------


class UploadResponse(BaseModel):
    """Returned after a successful file upload."""

    file_path: str = Field(..., description="Relative path to the saved file")
    filename: str = Field(..., description="Stored filename with UUID prefix")
    message: str = Field(..., description="Human-readable status message")


# ---------------------------------------------------------------------------
# Try-on schemas
# ---------------------------------------------------------------------------


class TryOnRequest(BaseModel):
    """Body payload for the virtual try-on endpoint."""

    garment_id: str = Field(..., description="ID of the garment to apply")
    image_path: Optional[str] = Field(None, description="Optional path to user photo (from /api/upload)")
    color: Optional[str] = Field(None, description="Optional colour override (hex)")
    fashn_api_url: Optional[str] = Field(None, description="Optional Colab / ngrok FASHN VTON endpoint")
    fashn_api_key: Optional[str] = Field(None, description="Optional API key for FASHN VTON")


class TryOnResponse(BaseModel):
    """Result of a virtual try-on request."""

    result_image_path: str = Field(..., description="Path to the composed result image")
    mode: str = Field(..., description="Processing mode: DEMO or AI")
    message: str = Field(..., description="Human-readable result message")
    garment_applied: bool = Field(..., description="Whether the garment was applied")


# ---------------------------------------------------------------------------
# Voice command schemas
# ---------------------------------------------------------------------------


class VoiceCommandRequest(BaseModel):
    """Parsed or raw voice transcript from the client."""

    transcript: str = Field(..., description="Raw voice transcript string")
    current_garment: Optional[str] = Field(
        None, description="Currently selected garment type (context)"
    )
    current_color: Optional[str] = Field(
        None, description="Currently active colour hex (context)"
    )


class VoiceCommandResponse(BaseModel):
    """Structured intent extracted from the voice command."""

    intent: str = Field(
        ..., description="CHANGE_COLOR | CHANGE_GARMENT | NAVIGATE | RESET | UNKNOWN"
    )
    action: str = Field(..., description="Human-readable description of the action")
    garment_type: Optional[str] = Field(None, description="Detected garment type")
    color: Optional[str] = Field(None, description="Detected colour hex")
    message: str = Field(..., description="Friendly response message for the UI")


# ---------------------------------------------------------------------------
# Recommendation schemas
# ---------------------------------------------------------------------------


class RecommendationRequest(BaseModel):
    """Parameters that drive outfit recommendations."""

    occasion: str = Field(
        ..., description="Target occasion e.g. college, office, wedding"
    )
    style_preference: Optional[str] = Field(
        None, description="minimal | bold | classic | traditional"
    )
    weather: Optional[str] = Field(None, description="warm | cool | rainy")


class RecommendationResponse(BaseModel):
    """A complete outfit recommendation returned to the client."""

    title: str = Field(..., description="Short outfit name")
    description: str = Field(..., description="Styling narrative")
    items: list[Any] = Field(..., description="List of outfit component strings")
    garment_type: str = Field(..., description="Primary garment category")
    color: str = Field(..., description="Suggested colour hex")
    occasion: str = Field(..., description="Occasion the recommendation targets")
    accessories: list[Any] = Field(..., description="Recommended accessory strings")
