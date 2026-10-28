"""Rules for saving and editing samples (kept separate from the web routes so they are easy to test)."""

from __future__ import annotations

from typing import Any

from . import db, storage


class SampleError(Exception):
    """A problem the user can fix (shown as a message in the app)."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def _clean(fields: dict[str, Any]) -> dict[str, Any]:
    """Trims text and checks required values."""
    out = dict(fields)
    for key in ("pen", "pig_id", "description"):
        if key in out and out[key] is not None:
            out[key] = str(out[key]).strip()

    if "pen" in out and not out["pen"]:
        raise SampleError("Pen # is required.")
    if "pig_id" in out and not out["pig_id"]:
        raise SampleError("Pig ID # is required.")
    if "sample_no" in out and (out["sample_no"] is None or int(out["sample_no"]) < 1):
        raise SampleError("Sample # must be 1 or more.")
    if "final_score" in out and out["final_score"] not in (0, 1, 2, 3):
        raise SampleError("Fecal score must be 0, 1, 2 or 3.")
    if out.get("ai_score") not in (None, 0, 1, 2, 3):
        raise SampleError("AI score must be 0, 1, 2 or 3.")
    if "project_id" in out and db.get_project(int(out["project_id"])) is None:
        raise SampleError("That project doesn't exist.", 404)
    return out


def _duplicate_message(sample: dict[str, Any]) -> str:
    return (
        f"Pen {sample['pen']} #{sample['sample_no']} on trial day {sample['trial_day']} "
        "is already saved in this project. Check the Sample #."
    )


def create_sample(fields: dict[str, Any], image: bytes, crop: bytes | None) -> dict[str, Any]:
    """Saves a new sample and its photos. Nothing is kept if any step fails."""
    if not image:
        raise SampleError("The photo is missing.")
    data = _clean(fields)
    dup = db.find_duplicate(data["project_id"], data["pen"], data["sample_no"], data["trial_day"])
    if dup:
        raise SampleError(_duplicate_message(dup), 409)

    data.setdefault("ai_score", None)
    data.setdefault("model_version", None)
    data.setdefault("description", "")

    written: list[str] = []
    try:
        with db.connect() as conn:
            sample_id = db.insert_sample(conn, data)
            image_path = storage.save_image(data["project_id"], sample_id, "full", image)
            written.append(image_path)
            crop_path = None
            if crop:
                crop_path = storage.save_image(data["project_id"], sample_id, "crop", crop)
                written.append(crop_path)
            db.set_sample_images(conn, sample_id, image_path, crop_path)
    except Exception:
        for path in written:
            storage.delete_image(path)
        raise

    sample = db.get_sample(sample_id)
    assert sample is not None
    return sample


def update_sample(sample_id: int, changes: dict[str, Any]) -> dict[str, Any]:
    current = db.get_sample(sample_id)
    if current is None:
        raise SampleError("Sample not found.", 404)

    changes = {k: v for k, v in changes.items() if v is not None}
    data = _clean(changes)
    merged = {**current, **data}
    dup = db.find_duplicate(
        merged["project_id"], merged["pen"], merged["sample_no"], merged["trial_day"], exclude_id=sample_id
    )
    if dup:
        raise SampleError(_duplicate_message(dup), 409)

    if "project_id" in data and data["project_id"] != current["project_id"]:
        image_path, crop_path = storage.move_images(current, data["project_id"])
        with db.connect() as conn:
            db.set_sample_images(conn, sample_id, image_path, crop_path)

    updated = db.update_sample(sample_id, data)
    assert updated is not None
    return updated


def delete_sample(sample_id: int) -> None:
    sample = db.delete_sample(sample_id)
    if sample is None:
        raise SampleError("Sample not found.", 404)
    for key in ("image_path", "crop_path"):
        storage.delete_thumbnail(sample.get(key))
        storage.delete_image(sample.get(key))


def delete_project(project_id: int) -> int:
    """Deletes a project with all its samples and photos. Returns how many samples were removed."""
    if db.get_project(project_id) is None:
        raise SampleError("Project not found.", 404)
    project_samples = db.list_samples(project_id)
    for s in project_samples:
        delete_sample(s["id"])
    db.delete_project(project_id)
    storage.delete_project_folder(project_id)
    return len(project_samples)


def to_public(sample: dict[str, Any]) -> dict[str, Any]:
    """What the app receives for each sample."""
    out = {k: v for k, v in sample.items() if k not in ("image_path", "crop_path")}
    out["edited"] = sample["ai_score"] is not None and sample["ai_score"] != sample["final_score"]
    out["label"] = f"Pen {sample['pen']} #{sample['sample_no']}"
    out["image_url"] = f"/api/samples/{sample['id']}/image/full" if sample.get("image_path") else None
    out["crop_url"] = f"/api/samples/{sample['id']}/image/crop" if sample.get("crop_path") else None
    # Small preview: the template crop when there is one, otherwise the full photo.
    out["thumb_url"] = f"/api/samples/{sample['id']}/image/thumb" if sample.get("image_path") else None
    return out
