"""Bounded, credential-safe Crustdata REST validation for PartnerPilot."""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.config import Settings
from app.crustdata_client import CrustdataClient, CrustdataError


def company_summaries(data: object) -> list[dict[str, object]]:
    if not isinstance(data, dict):
        return []
    records = data.get("companies") or data.get("results") or data.get("data") or []
    summaries = []
    for record in records:
        basic = record.get("basic_info") or record
        summaries.append({"id": record.get("crustdata_company_id") or basic.get("crustdata_company_id"), "name": basic.get("name"), "domain": basic.get("primary_domain")})
    return summaries


async def main() -> None:
    settings = Settings()
    client = CrustdataClient(settings.crustdata_api_key, timeout=settings.request_timeout_seconds, max_concurrency=1)
    try:
        credits = await client.credits()
        identity = await client.identify_companies({"domains": ["tcs.com"]})
        search = await client.search_companies({"filters": {"op": "and", "conditions": [{"field": "locations.country", "type": "=", "value": "India"}, {"field": "taxonomy.professional_network_industry", "type": "=", "value": "Financial Services"}]}, "fields": ["basic_info.name", "basic_info.primary_domain", "basic_info.description", "locations"], "limit": 1})
        matches = identity[0].get("matches", []) if isinstance(identity, list) and identity else []
        first = matches[0].get("company_data", {}).get("basic_info", {}) if matches else {}
        shape = {key: type(value).__name__ for key, value in search.items()} if isinstance(search, dict) else {"response": type(search).__name__}
        print(json.dumps({"authenticated": True, "credit_balance": (credits.get("account") or {}).get("credits") if isinstance(credits, dict) else None, "identity": {"id": first.get("crustdata_company_id"), "name": first.get("name"), "domain": first.get("primary_domain")}, "search_shape": shape, "search_results": company_summaries(search)}, indent=2))
    except CrustdataError as exc:
        print(json.dumps({"authenticated": False, "error": {"code": exc.code, "status_code": exc.status_code, "message": exc.message, "provider_body": (exc.metadata or {}).get("provider_body")}}, indent=2))
        raise SystemExit(1)
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
