from __future__ import annotations

import asyncio

from app.config import Settings
from app.services.orchestrator import AnalysisOrchestrator
from app.storage import AnalysisRepository


class FakeCrustdata:
    def __init__(self):
        self.search_company_calls = 0
        self.enrich_company_calls = 0
        self.search_people_calls = 0
        self.last_company_search_payload = None

    async def search_companies(self, payload: dict):
        self.search_company_calls += 1
        self.last_company_search_payload = payload
        return {"companies": [
            {"basic_info": {"name": "Bank Integration Co", "crustdata_company_id": 11, "primary_domain": "bank.example", "description": "BFSI cloud data integration enterprise AI implementation", "industries": ["BFSI"]}},
            {"basic_info": {"name": "Bank Integration Co", "crustdata_company_id": 11, "primary_domain": "bank.example", "description": "duplicate", "industries": ["BFSI"]}},
            {"basic_info": {"name": "Distribution Co", "crustdata_company_id": 12, "primary_domain": "distribution.example", "description": "enterprise distribution channel partner India", "industries": ["Technology"]}},
        ]}

    async def enrich_companies(self, _: dict):
        self.enrich_company_calls += 1
        return {"companies": [
            {"basic_info": {"name": "Bank Integration Co", "crustdata_company_id": 11, "primary_domain": "bank.example", "description": "BFSI cloud data integration enterprise AI implementation", "industries": ["BFSI"]}, "headcount": {"total": 100}, "people": []},
            {"basic_info": {"name": "Distribution Co", "crustdata_company_id": 12, "primary_domain": "distribution.example", "description": "enterprise distribution channel partner India", "industries": ["Technology"]}, "headcount": {"total": 60}, "people": []},
        ]}

    async def search_people(self, payload: dict):
        self.search_people_calls += 1
        return {"profiles": [{"crustdata_person_id": 99, "basic_profile": {"name": "Real Profile", "headline": "Partnership Director"}, "experience": {"employment_details": {"current": [{"name": "Bank Integration Co", "title": "Partnership Director"}]}}, "social_handles": {"professional_network_identifier": {"profile_url": "https://www.linkedin.com/in/real-profile"}}}]}


def request() -> dict:
    return {"company_name": "Example AI", "website": "https://example.com", "product_description": "AI document processing", "target_market": "India", "target_industry": "BFSI", "ideal_customer": "Banks", "business_goal": "Enter India", "required_capabilities": ["BFSI domain expertise", "Enterprise AI implementation", "Cloud deployment", "Enterprise data integration", "Enterprise distribution"], "partner_types": ["System integrators"], "max_candidates": 20, "max_partners": 2}


def test_complete_analysis_deduplicates_and_builds_report(tmp_path):
    repo = AnalysisRepository(tmp_path / "test.db")
    repo.initialize()
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'test.db'}")
    client = FakeCrustdata()
    orchestrator = AnalysisOrchestrator(repo, client, settings)
    from app.schemas import AnalysisRequest
    analysis_id = orchestrator.create(AnalysisRequest(**request()))
    asyncio.run(orchestrator.run(analysis_id))
    result = repo.get(analysis_id)
    assert result["status"] == "completed"
    assert len(result["report"]["candidate_universe"]) == 2
    assert result["report"]["selected_complementary_portfolio"]["selected_partner_ids"]
    assert result["report"]["decision_makers"][0]["name"] == "Real Profile"
    assert repo.output(analysis_id, "report")["analysis_id"] == analysis_id
    assert "format" not in client.last_company_search_payload
    assert "truncate" not in client.last_company_search_payload
    calls_before_resume = (client.search_company_calls, client.enrich_company_calls, client.search_people_calls)
    asyncio.run(orchestrator.run(analysis_id))
    assert (client.search_company_calls, client.enrich_company_calls, client.search_people_calls) == calls_before_resume
    assert len(result["report"]["activation_roadmap"]) == 4 * len(result["report"]["selected_complementary_portfolio"]["selected_partner_ids"])


def test_missing_credentials_returns_truthful_partial_result(tmp_path):
    repo = AnalysisRepository(tmp_path / "partial.db")
    repo.initialize()
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'partial.db'}")
    from app.crustdata_client import CrustdataClient
    from app.schemas import AnalysisRequest
    client = CrustdataClient(None)
    orchestrator = AnalysisOrchestrator(repo, client, settings)
    analysis_id = orchestrator.create(AnalysisRequest(**request()))
    asyncio.run(orchestrator.run(analysis_id))
    result = repo.get(analysis_id)
    asyncio.run(client.close())
    assert result["status"] == "partial"
    assert any(warning["code"] == "configuration_missing" for warning in result["warnings"])
    assert result["report"]["candidate_universe"] == []


def test_demo_data_is_prominently_marked(tmp_path):
    repo = AnalysisRepository(tmp_path / "demo.db")
    repo.initialize()
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'demo.db'}", demo_mode=True)
    item = AnalysisOrchestrator._demo_company()
    assert settings.demo_mode is True
    assert item["data_origin"] == "DEMO DATA"
    assert item["name"].startswith("DEMO DATA")


def test_identity_resolution_only_calls_free_identify_for_unresolved_domains(tmp_path):
    class IdentityClient:
        api_key = None

        async def identify_companies(self, payload):
            assert payload == {"domains": ["unknown.example"]}
            return [{"matched_on": "unknown.example", "matches": [{"company_data": {"crustdata_company_id": 77, "basic_info": {"name": "Resolved", "primary_domain": "unknown.example"}}}]}]

    repo = AnalysisRepository(tmp_path / "identity.db")
    repo.initialize()
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'identity.db'}")
    orchestrator = AnalysisOrchestrator(repo, IdentityClient(), settings)
    resolved = asyncio.run(orchestrator._resolve_identities([{"id": "unknown.example", "provider_id": None, "domain": "unknown.example", "name": "Unknown"}, {"id": "1", "provider_id": 1, "domain": "known.example", "name": "Known"}]))
    assert resolved[0]["provider_id"] == 77
    assert resolved[1]["provider_id"] == 1


def test_string_headquarters_location_is_normalized():
    company = AnalysisOrchestrator._normalize_company({"basic_info": {"name": "Location Co", "crustdata_company_id": 1}, "locations": {"headquarters": "India"}})
    assert company["country"] == "India"
