from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.crustdata_client import CrustdataClient
from app.schemas import AnalysisAccepted, AnalysisRequest, AnalysisStatusResponse, ErrorResponse
from app.services.orchestrator import AnalysisOrchestrator
from app.storage import AnalysisRepository


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    repository = AnalysisRepository(settings.database_path)
    repository.initialize()
    client = CrustdataClient(settings.crustdata_api_key, timeout=settings.request_timeout_seconds, max_concurrency=settings.max_concurrent_requests)
    app.state.repository, app.state.orchestrator, app.state.client = repository, AnalysisOrchestrator(repository, client, settings), client
    yield
    await client.close()


app = FastAPI(title="PartnerPilot API", version="0.1.0", lifespan=lifespan)
settings = get_settings()
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list or [], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["content-type"])


@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": "request_error", "message": str(exc.detail)}})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "partnerpilot"}


@app.post("/api/analyze", response_model=AnalysisAccepted, status_code=202, responses={422: {"model": ErrorResponse}})
async def analyze(request: AnalysisRequest) -> AnalysisAccepted:
    analysis_id = app.state.orchestrator.create(request)
    app.state.orchestrator.enqueue(analysis_id)
    return AnalysisAccepted(analysis_id=analysis_id, status="queued")


def _analysis_or_404(analysis_id: str) -> dict[str, Any]:
    result = app.state.repository.get(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return result


@app.get("/api/analyze/{analysis_id}", response_model=AnalysisStatusResponse)
async def get_analysis(analysis_id: str) -> dict[str, Any]:
    item = _analysis_or_404(analysis_id)
    return {"analysis_id": item["id"], "status": item["status"], "stage": item["stage"], "progress": item["progress"], "created_at": item["created_at"], "updated_at": item["updated_at"], "warnings": item["warnings"], "errors": item["errors"], "report": item["report"]}


@app.get("/api/analyze/{analysis_id}/partners")
async def partners(analysis_id: str) -> dict[str, Any]:
    item = _analysis_or_404(analysis_id)
    return {"analysis_id": analysis_id, "status": item["status"], "partners": (item["report"] or {}).get("company_profiles", []), "decision_makers": (item["report"] or {}).get("decision_makers", [])}


@app.get("/api/analyze/{analysis_id}/portfolio")
async def portfolio(analysis_id: str) -> dict[str, Any]:
    item = _analysis_or_404(analysis_id)
    return {"analysis_id": analysis_id, "status": item["status"], "portfolio": (item["report"] or {}).get("selected_complementary_portfolio")}


@app.get("/api/analyze/{analysis_id}/activation")
async def activation(analysis_id: str) -> dict[str, Any]:
    item = _analysis_or_404(analysis_id)
    report = item["report"] or {}
    return {"analysis_id": analysis_id, "status": item["status"], "activation": report.get("activation_roadmap", []), "proposals": report.get("partner_activation_proposals", [])}
