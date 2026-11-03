"""
routes/garments.py — CRUD endpoints for garment catalogue browsing.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.garment import Garment
from schemas.schemas import GarmentResponse

router = APIRouter(prefix="/garments", tags=["Garments"])


@router.get("", response_model=list[GarmentResponse], summary="List all garments")
def list_garments(
    category: Optional[str] = Query(
        None,
        description="Filter by category: top | dress | jacket | tee | kurta",
    ),
    occasion: Optional[str] = Query(
        None,
        description="Filter by occasion keyword (e.g. college, party, office)",
    ),
    db: Session = Depends(get_db),
) -> list[Garment]:
    """
    Return the full garment catalogue.

    Optionally filter by:
    - **category** — exact match on the `category` column
    - **occasion** — substring match inside the comma-separated `occasions` field
    """
    query = db.query(Garment)

    if category:
        query = query.filter(Garment.category == category.lower().strip())

    if occasion:
        # SQLite LIKE is case-insensitive for ASCII; good enough here
        query = query.filter(Garment.occasions.like(f"%{occasion.lower().strip()}%"))

    return query.order_by(Garment.name).all()


@router.get(
    "/{garment_id}",
    response_model=GarmentResponse,
    summary="Get a single garment by ID",
)
def get_garment(garment_id: str, db: Session = Depends(get_db)) -> Garment:
    """Return a single garment record, or 404 if not found."""
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(
            status_code=404,
            detail=f"Garment with id '{garment_id}' not found.",
        )
    return garment
