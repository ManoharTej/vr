"""
database.py — SQLAlchemy engine, session factory, and base model declaration.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite database file lives next to this module
DATABASE_URL = "sqlite:///./stylespeak.db"

# connect_args is SQLite-specific: allows cross-thread usage (needed by FastAPI)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Each request gets its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that yields a database session and guarantees cleanup.
    Usage:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
