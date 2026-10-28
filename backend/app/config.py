"""Folder locations used by the backend.

Everything the app saves (database + photos) lives in backend/data/,
so backing up or moving the data means copying that one folder.
"""

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
DATABASE_FILE = DATA_DIR / "fecalscore.db"

# The trained model file will go here later (phase 7).
ML_DIR = BACKEND_DIR / "ml"


def ensure_folders() -> None:
    """Create the data folders the first time the backend starts."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    ML_DIR.mkdir(parents=True, exist_ok=True)
