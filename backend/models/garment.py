"""
models/garment.py — SQLAlchemy ORM model for a Garment record.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Garment(Base):
    """
    Represents a single garment item stored in the database.

    Occasions are stored as a comma-separated string (e.g. "college,date")
    to keep the schema flat without a separate join table.
    """

    __tablename__ = "garments"

    # Primary key — uses pre-assigned string IDs (e.g. "g1") from seed data
    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)

    # Human-readable garment name
    name: Mapped[str] = mapped_column(String, nullable=False)

    # Broad garment category: top | dress | jacket | tee | kurta
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)

    # Style type: Casual | Formal | Party | Traditional | etc.
    type: Mapped[str] = mapped_column(String, nullable=False)

    # Hex colour code (e.g. "#d85c79")
    color: Mapped[str] = mapped_column(String, nullable=False)

    # Comma-separated list of occasions this garment suits
    occasions: Mapped[str] = mapped_column(String, nullable=False)

    # Short marketing description
    description: Mapped[str] = mapped_column(String, nullable=False)

    # Optional styling tips
    style_notes: Mapped[str | None] = mapped_column(String, nullable=True)

    # Record creation timestamp (UTC)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
