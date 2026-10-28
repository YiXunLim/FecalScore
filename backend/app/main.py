"""FecalScore backend.

Start it from the backend folder with:
    uvicorn app.main:app --reload --port 8000

Then open http://127.0.0.1:8000/docs to see and try every endpoint.
"""

import re
from datetime import datetime
from typing import NoReturn, Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from . import db, export, samples, search, storage
from .config import ensure_folders

ensure_folders()
db.init_db()

app = FastAPI(title="FecalScore API", version="0.3.0")


def fail(error: samples.SampleError) -> NoReturn:
    raise HTTPException(status_code=error.status, detail=error.message)


@app.get("/api/health")
def health() -> dict:
    """Simple check that the backend is running."""
    return {"status": "ok"}


# ------------------------------------------------------------------ projects


class ProjectIn(BaseModel):
    name: str
    description: str = ""


@app.get("/api/projects")
def list_projects() -> list[dict]:
    return db.list_projects()


@app.post("/api/projects", status_code=201)
def create_project(body: ProjectIn) -> dict:
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Project name is required.")
    if db.find_project_by_name(name):
        raise HTTPException(409, f'A project called "{name}" already exists.')
    return db.create_project(name, body.description)


@app.get("/api/projects/{project_id}")
def get_project(project_id: int) -> dict:
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found.")
    return project


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int) -> dict:
    """Deletes the project and ALL its samples and photos."""
    try:
        removed = samples.delete_project(project_id)
    except samples.SampleError as e:
        fail(e)
    return {"deleted_samples": removed}


# ------------------------------------------------------------------ samples
# Note: /api/samples/next-number must stay above /api/samples/{sample_id}.


@app.get("/api/samples/next-number")
def next_sample_number(project_id: int, pen: str, trial_day: int) -> dict:
    """Suggests the next Sample # for a pen on a trial day."""
    return {"sample_no": db.next_sample_number(project_id, pen, trial_day)}


def find_samples(
    project_id: Optional[int], q: Optional[str], pen: Optional[str], trial_day: Optional[int], score: Optional[int]
) -> list[dict]:
    """Samples matching the search box and filters (all projects when project_id is empty)."""
    rows = db.list_samples(project_id)
    return search.filter_samples(rows, q=q, pen=pen, trial_day=trial_day, score=score)


@app.get("/api/samples")
def list_samples(
    project_id: Optional[int] = None,
    q: Optional[str] = None,
    pen: Optional[str] = None,
    trial_day: Optional[int] = None,
    score: Optional[int] = None,
) -> list[dict]:
    """List or search samples. See app/search.py for what the search box understands."""
    return [samples.to_public(s) for s in find_samples(project_id, q, pen, trial_day, score)]


EXPORT_TYPES = {
    "csv": ("text/csv", "csv"),
    "xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
    "pdf": ("application/pdf", "pdf"),
}


@app.get("/api/export")
def export_samples(
    request: Request,
    format: str = "csv",
    project_id: Optional[int] = None,
    q: Optional[str] = None,
    pen: Optional[str] = None,
    trial_day: Optional[int] = None,
    score: Optional[int] = None,
) -> Response:
    """Download the matching samples as CSV, Excel (xlsx) or PDF."""
    if format not in EXPORT_TYPES:
        raise HTTPException(400, "Format must be csv, xlsx or pdf.")
    project = db.get_project(project_id) if project_id is not None else None
    if project_id is not None and not project:
        raise HTTPException(404, "Project not found.")

    rows = [{**s, **samples.to_public(s)} for s in find_samples(project_id, q, pen, trial_day, score)]
    title = project["name"] if project else "All projects"
    filters = [f'search "{q}"' if q else "", f"pen {pen}" if pen else "",
               f"day {trial_day}" if trial_day is not None else "", f"score {score}" if score is not None else ""]
    filters = [f for f in filters if f]
    if filters:
        title += " (" + ", ".join(filters) + ")"

    # Address the links in the file should point to (works behind the dev proxy and on the server).
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc)).split(",")[0].strip()
    base_url = f"{proto}://{host}"

    if format == "csv":
        content = export.to_csv(rows, base_url)
    elif format == "xlsx":
        content = export.to_xlsx(rows, base_url, title)
    else:
        content = export.to_pdf(rows, title, show_project=project is None)

    media_type, ext = EXPORT_TYPES[format]
    name = re.sub(r"[^A-Za-z0-9]+", "-", project["name"]).strip("-") if project else "all-projects"
    filename = f"fecalscore_{name}_{datetime.now():%Y-%m-%d}.{ext}"
    return Response(
        content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/samples", status_code=201)
async def create_sample(
    project_id: int = Form(...),
    pen: str = Form(...),
    sample_no: int = Form(...),
    pig_id: str = Form(...),
    trial_day: int = Form(...),
    final_score: int = Form(...),
    captured_at: str = Form(...),
    description: str = Form(""),
    ai_score: Optional[int] = Form(None),
    model_version: Optional[str] = Form(None),
    image: UploadFile = File(...),
    crop: Optional[UploadFile] = File(None),
) -> dict:
    fields = {
        "project_id": project_id,
        "pen": pen,
        "sample_no": sample_no,
        "pig_id": pig_id,
        "trial_day": trial_day,
        "final_score": final_score,
        "captured_at": captured_at,
        "description": description,
        "ai_score": ai_score,
        "model_version": model_version,
    }
    image_bytes = await image.read()
    crop_bytes = await crop.read() if crop is not None else None
    try:
        sample = samples.create_sample(fields, image_bytes, crop_bytes)
    except samples.SampleError as e:
        fail(e)
    return samples.to_public(sample)


@app.get("/api/samples/{sample_id}")
def get_sample(sample_id: int) -> dict:
    sample = db.get_sample(sample_id)
    if not sample:
        raise HTTPException(404, "Sample not found.")
    return samples.to_public(sample)


class SampleUpdate(BaseModel):
    project_id: Optional[int] = None
    pen: Optional[str] = None
    sample_no: Optional[int] = None
    pig_id: Optional[str] = None
    trial_day: Optional[int] = None
    final_score: Optional[int] = None
    description: Optional[str] = None


@app.patch("/api/samples/{sample_id}")
def update_sample(sample_id: int, body: SampleUpdate) -> dict:
    try:
        sample = samples.update_sample(sample_id, body.model_dump())
    except samples.SampleError as e:
        fail(e)
    return samples.to_public(sample)


@app.delete("/api/samples/{sample_id}", status_code=204, response_class=Response)
def delete_sample(sample_id: int):
    try:
        samples.delete_sample(sample_id)
    except samples.SampleError as e:
        fail(e)
    return Response(status_code=204)


@app.get("/api/samples/{sample_id}/image/{kind}")
def sample_image(sample_id: int, kind: str) -> FileResponse:
    """kind is 'full' (whole photo), 'crop' (template area) or 'thumb' (small preview)."""
    sample = db.get_sample(sample_id)
    if not sample or kind not in ("full", "crop", "thumb"):
        raise HTTPException(404, "Photo not found.")
    if kind == "thumb":
        path = storage.thumbnail_file(sample["crop_path"] or sample["image_path"])
    else:
        path = storage.image_file(sample["image_path" if kind == "full" else "crop_path"])
    if not path:
        raise HTTPException(404, "Photo not found.")
    return FileResponse(path, media_type="image/jpeg")


# Coming later:
#   phase 7 -> /api/predict (the ML model)
