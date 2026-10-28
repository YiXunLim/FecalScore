"""Database: everything that reads or writes backend/data/fecalscore.db.

Uses SQLite (built into Python), so there is no database server to install.
Each function opens its own connection, which keeps things simple and safe.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    description  TEXT    NOT NULL DEFAULT '',
    created_at   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS samples (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    pen            TEXT    NOT NULL,
    sample_no      INTEGER NOT NULL,
    pig_id         TEXT    NOT NULL,
    trial_day      INTEGER NOT NULL,
    ai_score       INTEGER CHECK (ai_score BETWEEN 0 AND 3),
    final_score    INTEGER NOT NULL CHECK (final_score BETWEEN 0 AND 3),
    description    TEXT    NOT NULL DEFAULT '',
    image_path     TEXT,
    crop_path      TEXT,
    model_version  TEXT,
    captured_at    TEXT    NOT NULL,
    created_at     TEXT    NOT NULL,
    modified_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_samples_project ON samples(project_id);
CREATE INDEX IF NOT EXISTS idx_samples_pen ON samples(project_id, trial_day, pen);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect(db_file: Path | None = None) -> Iterator[sqlite3.Connection]:
    """Opens the database, commits if everything worked, rolls back if not."""
    conn = sqlite3.connect(db_file or config.DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Creates the tables the first time the backend starts."""
    with connect() as conn:
        conn.executescript(SCHEMA)


# ---------------------------------------------------------------- projects


def list_projects() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT p.*,
                   COUNT(s.id) AS sample_count,
                   MAX(COALESCE(s.modified_at, s.created_at)) AS last_sample_at
            FROM projects p
            LEFT JOIN samples s ON s.project_id = p.id
            GROUP BY p.id
            ORDER BY COALESCE(MAX(COALESCE(s.modified_at, s.created_at)), p.created_at) DESC
            """
        ).fetchall()
    return [dict(r) for r in rows]


def get_project(project_id: int) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return dict(row) if row else None


def find_project_by_name(name: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM projects WHERE name = ?", (name.strip(),)).fetchone()
    return dict(row) if row else None


def create_project(name: str, description: str = "") -> dict[str, Any]:
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO projects (name, description, created_at) VALUES (?, ?, ?)",
            (name.strip(), description.strip(), now_iso()),
        )
        new_id = cur.lastrowid
    project = get_project(new_id)  # type: ignore[arg-type]
    assert project is not None
    return project


def delete_project(project_id: int) -> None:
    """Removes the project row (its samples must be deleted first)."""
    with connect() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))


# ---------------------------------------------------------------- samples


def next_sample_number(project_id: int, pen: str, trial_day: int) -> int:
    """Next free sample # for this pen on this trial day (Pen 3 #1, #2, ...)."""
    with connect() as conn:
        row = conn.execute(
            """
            SELECT MAX(sample_no) FROM samples
            WHERE project_id = ? AND pen = ? COLLATE NOCASE AND trial_day = ?
            """,
            (project_id, pen.strip(), trial_day),
        ).fetchone()
    return (row[0] or 0) + 1


def find_duplicate(
    project_id: int, pen: str, sample_no: int, trial_day: int, exclude_id: int | None = None
) -> dict[str, Any] | None:
    """Is there already a sample with the same project, pen, sample # and trial day?"""
    with connect() as conn:
        row = conn.execute(
            """
            SELECT * FROM samples
            WHERE project_id = ? AND pen = ? COLLATE NOCASE AND sample_no = ? AND trial_day = ?
              AND (? IS NULL OR id != ?)
            """,
            (project_id, pen.strip(), sample_no, trial_day, exclude_id, exclude_id),
        ).fetchone()
    return dict(row) if row else None


SAMPLE_SELECT = """
    SELECT s.*, p.name AS project_name
    FROM samples s JOIN projects p ON p.id = s.project_id
"""


def get_sample(sample_id: int) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(SAMPLE_SELECT + " WHERE s.id = ?", (sample_id,)).fetchone()
    return dict(row) if row else None


def list_samples(project_id: int | None = None) -> list[dict[str, Any]]:
    """All samples (newest first), optionally only one project's. Search comes in phase 4."""
    sql = SAMPLE_SELECT
    params: tuple[Any, ...] = ()
    if project_id is not None:
        sql += " WHERE s.project_id = ?"
        params = (project_id,)
    sql += " ORDER BY s.captured_at DESC, s.id DESC"
    with connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def insert_sample(conn: sqlite3.Connection, data: dict[str, Any]) -> int:
    """Adds a sample row (photos are attached afterwards with set_sample_images)."""
    cur = conn.execute(
        """
        INSERT INTO samples (project_id, pen, sample_no, pig_id, trial_day, ai_score, final_score,
                             description, model_version, captured_at, created_at)
        VALUES (:project_id, :pen, :sample_no, :pig_id, :trial_day, :ai_score, :final_score,
                :description, :model_version, :captured_at, :created_at)
        """,
        {**data, "created_at": now_iso()},
    )
    return int(cur.lastrowid)  # type: ignore[arg-type]


def set_sample_images(
    conn: sqlite3.Connection, sample_id: int, image_path: str | None, crop_path: str | None
) -> None:
    conn.execute(
        "UPDATE samples SET image_path = ?, crop_path = ? WHERE id = ?",
        (image_path, crop_path, sample_id),
    )


EDITABLE_FIELDS = {"project_id", "pen", "sample_no", "pig_id", "trial_day", "final_score", "description"}


def update_sample(sample_id: int, changes: dict[str, Any]) -> dict[str, Any] | None:
    """Changes some fields of a sample and records the modified time."""
    fields = {k: v for k, v in changes.items() if k in EDITABLE_FIELDS}
    if fields:
        assignments = ", ".join(f"{k} = :{k}" for k in fields)
        with connect() as conn:
            conn.execute(
                f"UPDATE samples SET {assignments}, modified_at = :modified_at WHERE id = :id",
                {**fields, "modified_at": now_iso(), "id": sample_id},
            )
    return get_sample(sample_id)


def delete_sample(sample_id: int) -> dict[str, Any] | None:
    sample = get_sample(sample_id)
    if sample:
        with connect() as conn:
            conn.execute("DELETE FROM samples WHERE id = ?", (sample_id,))
    return sample
