"""Resume a persisted PartnerPilot job after a recoverable implementation failure."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.crustdata_client import CrustdataClient
from app.services.orchestrator import AnalysisOrchestrator
from app.storage import AnalysisRepository


async def main(analysis_id: str) -> None:
    settings = Settings()
    repository = AnalysisRepository(settings.database_path)
    repository.initialize()
    client = CrustdataClient(settings.crustdata_api_key, timeout=settings.request_timeout_seconds, max_concurrency=settings.max_concurrent_requests)
    try:
        await AnalysisOrchestrator(repository, client, settings).run(analysis_id)
        result = repository.get(analysis_id) or {}
        print(json.dumps({"analysis_id": analysis_id, "status": result.get("status"), "stage": result.get("stage"), "progress": result.get("progress"), "warnings": result.get("warnings"), "errors": result.get("errors")}, indent=2))
    finally:
        await client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("analysis_id")
    asyncio.run(main(parser.parse_args().analysis_id))
