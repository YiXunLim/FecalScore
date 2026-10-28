"""Photo files: saved in backend/data/images/project_<id>/.

The database stores each photo's path relative to backend/data/images/,
so the whole data folder can be moved or backed up without breaking anything.
"""

from __future__ import annotations

from pathlib import Path

from . import config


def save_image(project_id: int, sample_id: int, kind: str, content: bytes) -> str:
    """Writes one photo and returns its relative path, e.g. 'project_1/12_full.jpg'."""
    relative = f"project_{project_id}/{sample_id}_{kind}.jpg"
    path = config.IMAGES_DIR / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return relative


def image_file(relative: str | None) -> Path | None:
    """Full path of a stored photo, or None if it is missing (or the path is unsafe)."""
    if not relative:
        return None
    path = (config.IMAGES_DIR / relative).resolve()
    if config.IMAGES_DIR.resolve() not in path.parents or not path.is_file():
        return None
    return path


def delete_image(relative: str | None) -> None:
    path = image_file(relative)
    if path:
        path.unlink(missing_ok=True)


def delete_project_folder(project_id: int) -> None:
    """Removes a project's (now empty) photo folder, including any leftover files."""
    folder = config.IMAGES_DIR / f"project_{project_id}"
    if folder.is_dir():
        for f in folder.iterdir():
            if f.is_file():
                f.unlink(missing_ok=True)
        folder.rmdir()


THUMB_SIZE = 320  # longest side, in pixels


def thumbnail_file(relative: str | None) -> Path | None:
    """A small copy of a photo for lists and PDFs. Made the first time it is needed, then reused."""
    source = image_file(relative)
    if not source:
        return None
    thumb = source.with_name(source.stem + "_thumb.jpg")
    if not thumb.exists() or thumb.stat().st_mtime < source.stat().st_mtime:
        from PIL import Image, ImageOps

        with Image.open(source) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((THUMB_SIZE, THUMB_SIZE))
            img.convert("RGB").save(thumb, "JPEG", quality=82)
    return thumb


def delete_thumbnail(relative: str | None) -> None:
    source = image_file(relative)
    if source:
        source.with_name(source.stem + "_thumb.jpg").unlink(missing_ok=True)


def move_images(sample: dict, new_project_id: int) -> tuple[str | None, str | None]:
    """When a sample moves to another project, move its photos into that project's folder."""
    moved: list[str | None] = []
    for kind, key in (("full", "image_path"), ("crop", "crop_path")):
        delete_thumbnail(sample.get(key))  # remade in the new folder when next needed
        old = image_file(sample.get(key))
        if not old:
            moved.append(sample.get(key))
            continue
        relative = f"project_{new_project_id}/{sample['id']}_{kind}.jpg"
        new = config.IMAGES_DIR / relative
        new.parent.mkdir(parents=True, exist_ok=True)
        old.replace(new)
        moved.append(relative)
    return moved[0], moved[1]
