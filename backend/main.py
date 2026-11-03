"""
main.py — StyleSpeak API entry point.

Responsibilities:
- Initialise the FastAPI application with metadata and CORS middleware.
- Mount static file serving for the uploads directory.
- Register all route modules under the /api prefix.
- On startup: create database tables and seed the garment catalogue if empty.
"""
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models.garment import Garment
from routes import garments, recommendations, tryon, upload, voice

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("stylespeak")

# ---------------------------------------------------------------------------
# Startup / shutdown lifespan
# ---------------------------------------------------------------------------

DATASET_PATH = Path(__file__).parent / "datasets" / "garments.json"
UPLOADS_DIR = Path(__file__).parent / "uploads"


def _seed_garments(db: Session) -> None:
    """
    Insert garment records from garments.json if the table is empty.
    Skips seeding silently if the JSON file is missing.
    """
    count = db.query(Garment).count()
    if count > 0:
        logger.info("Garments table already populated (%d records) — skipping seed.", count)
        return

    if not DATASET_PATH.exists():
        logger.warning("Seed file not found at %s — no garments loaded.", DATASET_PATH)
        return

    with DATASET_PATH.open("r", encoding="utf-8") as fh:
        raw_garments: list[dict] = json.load(fh)

    garment_objects = [Garment(**record) for record in raw_garments]
    db.add_all(garment_objects)
    db.commit()
    logger.info("Seeded %d garments from %s.", len(garment_objects), DATASET_PATH.name)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler (replaces deprecated @app.on_event)."""
    # --- Startup ---------------------------------------------------------
    logger.info("StyleSpeak API starting up…")

    # Create all SQLAlchemy-managed tables (idempotent)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified / created.")

    # Ensure uploads directory exists
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Seed catalogue data
    db: Session = SessionLocal()
    try:
        _seed_garments(db)
    finally:
        db.close()

    logger.info("StyleSpeak API is ready at http://localhost:8000")
    logger.info("Interactive docs: http://localhost:8000/docs")

    yield  # application runs here

    # --- Shutdown --------------------------------------------------------
    logger.info("StyleSpeak API shutting down.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="StyleSpeak API",
    version="1.0.0",
    description=(
        "Backend API for the StyleSpeak fashion app. Provides garment browsing, "
        "photo upload, virtual try-on (demo mode), voice command parsing, and "
        "AI-free outfit recommendations."
    ),
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for local development
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving — uploaded photos available at /uploads/<filename>
# ---------------------------------------------------------------------------

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ---------------------------------------------------------------------------
# Route registration — all routes share the /api prefix
# ---------------------------------------------------------------------------

app.include_router(garments.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(tryon.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get(
    "/api/health",
    tags=["Health"],
    summary="Health check — confirms the API is running",
)
def health_check() -> dict:
    """Return a simple health status payload."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "message": "StyleSpeak API is running",
    }
