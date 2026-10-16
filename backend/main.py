from __future__ import annotations

import asyncio
import uuid
from typing import Any

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.document_processor import DocumentProcessor
from services.ai_engine import VerityEngine

app = FastAPI(title="VERITY API", version="1.0.0", description="Evidence-grounded claim review")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

documents: dict[str, dict[str, str]] = {}
analyses: dict[str, dict[str, Any]] = {}
engine = VerityEngine()
MAX_FILE_BYTES = 20 * 1024 * 1024


class AnalysisRequest(BaseModel):
    report_id: str
    reference_ids: list[str] = Field(min_length=1, max_length=20)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "engine": "openai" if engine.has_api_key else "local"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)) -> dict[str, str]:
    filename = (file.filename or "document").strip()
    if not filename or "." not in filename:
        raise HTTPException(400, "Upload a TXT, Markdown, PDF, or DOCX document.")
    content = await file.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(413, "Files must be 20 MB or smaller.")
    try:
        text = DocumentProcessor.extract_text(content, filename)
    except ValueError as exc:
        raise HTTPException(415, str(exc)) from exc
    if not text.strip():
        raise HTTPException(422, "No readable text was found in this document.")
    document_id = str(uuid.uuid4())
    documents[document_id] = {"filename": filename, "text": text}
    return {"id": document_id, "filename": filename, "text_preview": text[:240]}


@app.post("/api/verify", status_code=202)
async def start_verification(request: AnalysisRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    if request.report_id not in documents:
        raise HTTPException(404, "The primary report has expired. Upload it again.")
    if any(item not in documents for item in request.reference_ids):
        raise HTTPException(404, "One or more evidence files have expired. Upload them again.")
    analysis_id = str(uuid.uuid4())
    analyses[analysis_id] = {"status": "processing", "progress": 0, "claims": [], "error": None}
    background_tasks.add_task(run_pipeline, analysis_id, request)
    return {"analysis_id": analysis_id}


@app.get("/api/analysis/{analysis_id}")
async def get_analysis(analysis_id: str) -> dict[str, Any]:
    result = analyses.get(analysis_id)
    if result is None:
        raise HTTPException(404, "Analysis not found.")
    return result


async def run_pipeline(analysis_id: str, request: AnalysisRequest) -> None:
    state = analyses[analysis_id]
    try:
        report = documents[request.report_id]
        refs = [documents[item] for item in request.reference_ids]
        state["status"] = "Extracting claims"
        claims = await asyncio.to_thread(engine.extract_claims, report["text"])
        if not claims:
            raise ValueError("No factual claims could be extracted from the report.")
        state["progress"] = 15
        results = []
        for index, claim in enumerate(claims):
            state["status"] = f"Verifying claim {index + 1} of {len(claims)}"
            result = await asyncio.to_thread(engine.verify_claim, claim, refs)
            result["id"] = str(index + 1)
            results.append(result)
            state["claims"] = results.copy()
            state["progress"] = 15 + round((index + 1) / len(claims) * 85)
        state["status"] = "completed"
    except Exception as exc:
        state["status"] = "failed"
        state["error"] = str(exc)

