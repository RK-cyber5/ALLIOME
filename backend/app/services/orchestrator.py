from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any

from app.config import Settings
from app.crustdata_client import CrustdataClient, CrustdataError
from app.schemas import AnalysisRequest
from app.services.brief_parser import normalize_brief
from app.services.capability_compiler import compile_capabilities
from app.services.portfolio_optimizer import optimize
from app.services.scoring import score_company
from app.storage import AnalysisRepository


class AnalysisOrchestrator:
    def __init__(self, repository: AnalysisRepository, client: CrustdataClient, settings: Settings):
        self.repository, self.client, self.settings = repository, client, settings
        self.tasks: set[asyncio.Task[Any]] = set()

    def create(self, request: AnalysisRequest) -> str:
        analysis_id = str(uuid.uuid4())
        self.repository.create(analysis_id, request.model_dump())
        return analysis_id

    def enqueue(self, analysis_id: str) -> None:
        task = asyncio.create_task(self.run(analysis_id))
        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)

    async def run(self, analysis_id: str) -> None:
        row = self.repository.get(analysis_id)
        assert row
        completed_report = self.repository.output(analysis_id, "report")
        if completed_report:
            self.repository.update(analysis_id, status="completed", stage="completed", progress=100, report=completed_report, clear_errors=True)
            return
        self.repository.update(analysis_id, status="running", stage="brief", progress=5)
        try:
            brief = self.repository.output(analysis_id, "brief")
            if not brief:
                brief, warnings = normalize_brief(row["request"])
                for warning in warnings:
                    self.repository.update(analysis_id, warning=warning)
                self.repository.checkpoint(analysis_id, "brief", brief)

            capabilities = self.repository.output(analysis_id, "capabilities")
            if not capabilities:
                capabilities = compile_capabilities(brief["required_capabilities"])
                self.repository.checkpoint(analysis_id, "capabilities", capabilities)
            self.repository.update(analysis_id, stage="capability_compiler", progress=15)

            if getattr(self.client, "api_key", None) and self.repository.output(analysis_id, "credits") is None:
                try:
                    self.repository.checkpoint(analysis_id, "credits", await self.client.credits())
                except CrustdataError as exc:
                    self.repository.update(analysis_id, warning={"code": exc.code, "message": f"Credit balance check failed: {exc.message}"})

            self.repository.update(analysis_id, stage="discovery", progress=25)
            candidates = self.repository.output(analysis_id, "candidates")
            if candidates is None:
                candidates, discovery_warnings = await self._discover(brief)
                for warning in discovery_warnings:
                    self.repository.update(analysis_id, warning=warning)
                candidates = await self._resolve_identities(self._deduplicate(candidates))
                self.repository.checkpoint(analysis_id, "candidates", candidates)

            self.repository.update(analysis_id, stage="investigation", progress=45)
            investigated = self.repository.output(analysis_id, "investigated")
            if investigated is None:
                investigated, investigation_warnings = await self._investigate(candidates, brief)
                for warning in investigation_warnings:
                    self.repository.update(analysis_id, warning=warning)
                self.repository.checkpoint(analysis_id, "investigated", investigated)

            self.repository.update(analysis_id, stage="decision_intelligence", progress=70)
            intelligence = self.repository.output(analysis_id, "decision_intelligence")
            if intelligence is None:
                evidence = self._evidence(investigated)
                scores = [score_company(company, capabilities, brief) for company in investigated]
                portfolio = optimize(investigated, scores, capabilities, brief["max_partners"])
                people, people_warnings = await self._decision_makers(investigated)
                for warning in people_warnings:
                    self.repository.update(analysis_id, warning=warning)
                intelligence = {"evidence": evidence, "scores": scores, "portfolio": portfolio, "people": people}
                self.repository.checkpoint(analysis_id, "decision_intelligence", intelligence)
            evidence, scores, portfolio, people = (intelligence["evidence"], intelligence["scores"], intelligence["portfolio"], intelligence["people"])

            report = self._report(analysis_id, brief, capabilities, candidates, investigated, evidence, scores, portfolio, people)
            status = "completed" if investigated else "partial"
            self.repository.update(analysis_id, status=status, stage="completed", progress=100, report=report, clear_errors=True)
            self.repository.checkpoint(analysis_id, "report", report)
        except Exception as exc:  # preserves all earlier checkpoints for recovery/audit
            self.repository.update(analysis_id, status="failed", stage="failed", error={"code": "workflow_failure", "message": str(exc)})

    async def _discover(self, brief: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
        if self.settings.demo_mode:
            return [self._demo_company()], [{"code": "demo_data", "message": "DEMO DATA: synthetic fixture enabled by DEMO_MODE."}]
        filters: dict[str, Any] = {"field": "locations.country", "type": "=", "value": brief["target_market"]}
        if brief["target_industry"].upper() == "BFSI":
            # Exact value confirmed via the free company autocomplete endpoint.
            filters = {"op": "and", "conditions": [filters, {"field": "taxonomy.professional_network_industry", "type": "=", "value": "Financial Services"}]}
        payload = {"filters": filters, "fields": ["basic_info.name", "basic_info.primary_domain", "basic_info.description", "locations"], "limit": min(brief["max_candidates"], 15)}
        try:
            data = await self.client.search_companies(payload)
        except CrustdataError as exc:
            return [], [{"code": exc.code, "message": exc.message}]
        records = data.get("companies") or data.get("results") or data.get("data") or []
        return [self._normalize_company(record, data) for record in records if self._normalize_company(record, data)["name"]], []

    async def _investigate(self, candidates: list[dict[str, Any]], brief: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
        shortlist = candidates[:self.settings.max_investigated_companies]
        if not shortlist or self.settings.demo_mode:
            return shortlist, []
        ids = [company["provider_id"] for company in shortlist if company.get("provider_id") is not None]
        if not ids:
            return shortlist, [{"code": "identity_missing", "message": "Discovery returned no canonical IDs; enrichment was skipped."}]
        try:
            data = await self.client.enrich_companies({"crustdata_company_ids": ids, "fields": ["basic_info", "headcount", "locations", "taxonomy", "people"]})
        except CrustdataError as exc:
            return shortlist, [{"code": exc.code, "message": f"Shortlist enrichment failed: {exc.message}"}]
        enriched = data if isinstance(data, list) else data.get("companies") or data.get("results") or []
        by_id = {str(self._normalize_company(item, data).get("provider_id")): self._normalize_company(item, data) for item in enriched}
        return [{**company, **by_id.get(str(company.get("provider_id")), {})} for company in shortlist], []

    async def _resolve_identities(self, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Resolve only records missing a canonical ID; /company/identify is free."""
        unresolved = [company for company in candidates if company.get("domain") and company.get("provider_id") is None]
        if not unresolved:
            return candidates
        try:
            data = await self.client.identify_companies({"domains": [company["domain"] for company in unresolved[:25]]})
        except CrustdataError:
            return candidates
        matches = data if isinstance(data, list) else data.get("results") or []
        by_domain: dict[str, dict[str, Any]] = {}
        for result in matches:
            first = (result.get("matches") or [None])[0]
            if first and first.get("company_data"):
                by_domain[str(result.get("matched_on", "")).lower()] = self._normalize_company(first["company_data"])
        return [{**company, **by_domain.get(str(company.get("domain", "")).lower(), {})} for company in candidates]

    async def _decision_makers(self, companies: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
        people, warnings = [], []
        for company in companies[:3]:
            if not company.get("provider_id") or self.settings.demo_mode:
                continue
            payload = {"filters": {"op": "and", "conditions": [{"field": "experience.employment_details.current.company_id", "type": "=", "value": company["provider_id"]}, {"field": "experience.employment_details.current.seniority_level", "type": "in", "value": ["Director", "Vice President", "CXO"]}]}, "fields": ["basic_profile.name", "basic_profile.headline", "experience.employment_details.current.name", "experience.employment_details.current.title", "social_handles.professional_network_identifier.profile_url"], "limit": 3}
            try:
                data = await self.client.search_people(payload)
            except CrustdataError as exc:
                warnings.append({"code": exc.code, "message": f"People search for {company['name']} failed: {exc.message}"})
                continue
            for profile in data.get("profiles", []):
                current = ((profile.get("experience") or {}).get("employment_details") or {}).get("current") or []
                people.append({"company_id": company["id"], "provider_person_id": profile.get("crustdata_person_id"), "name": (profile.get("basic_profile") or {}).get("name"), "headline": (profile.get("basic_profile") or {}).get("headline"), "current_roles": current, "profile_url": (((profile.get("social_handles") or {}).get("professional_network_identifier") or {}).get("profile_url")), "source": "Crustdata", "evidence_status": "supported"})
        return people, warnings

    @staticmethod
    def _normalize_company(record: dict[str, Any], envelope: dict[str, Any] | None = None) -> dict[str, Any]:
        company = record.get("company_data") or record
        basic = company.get("basic_info") or company
        provider_id = company.get("crustdata_company_id") or basic.get("crustdata_company_id")
        locations = company.get("locations") or {}
        headquarters = locations.get("headquarters") if isinstance(locations, dict) else None
        country = headquarters.get("country") if isinstance(headquarters, dict) else headquarters if isinstance(headquarters, str) else None
        return {"id": str(provider_id or basic.get("primary_domain") or basic.get("name") or ""), "provider_id": provider_id, "name": basic.get("name") or basic.get("profile_name"), "domain": basic.get("primary_domain"), "description": basic.get("description"), "industries": basic.get("industries") or [], "country": country, "headcount": (company.get("headcount") or {}).get("total") if isinstance(company.get("headcount"), dict) else None, "people": company.get("people"), "source_url": basic.get("website") or basic.get("professional_network_url"), "raw": record, "data_origin": "Crustdata"}

    @staticmethod
    def _deduplicate(companies: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen, unique = set(), []
        for company in companies:
            key = str(company.get("provider_id") or company.get("domain") or company.get("name", "").lower())
            if key and key not in seen:
                seen.add(key)
                unique.append(company)
        return unique

    @staticmethod
    def _evidence(companies: list[dict[str, Any]]) -> list[dict[str, Any]]:
        evidence = []
        for company in companies:
            for field in ("name", "description", "industries", "headcount"):
                value = company.get(field)
                evidence.append({"company_id": company["id"], "claim": f"{field} for {company['name']}", "value": value, "source_provider": "Crustdata", "source_url": company.get("source_url"), "provider_record_id": company.get("provider_id"), "field_path": field, "retrieved_at": datetime.now(timezone.utc).isoformat(), "status": "supported" if value else "unverified", "confidence": 0.8 if value else 0.0, "explanation": "Provider record evidence; not independent website verification."})
        return evidence

    def _report(self, analysis_id: str, brief: dict[str, Any], capabilities: list[dict[str, Any]], candidates: list[dict[str, Any]], investigated: list[dict[str, Any]], evidence: list[dict[str, Any]], scores: list[dict[str, Any]], portfolio: dict[str, Any], people: list[dict[str, Any]]) -> dict[str, Any]:
        selected = [company for company in investigated if company["id"] in portfolio["selected_partner_ids"]]
        activation = []
        phases = [
            ("Days 1-7", "Validate the partnership hypothesis and supported decision-maker path.", "Qualified discovery agenda"),
            ("Days 8-14", "Define a joint customer problem statement and pilot assumptions.", "Draft pilot charter"),
            ("Days 15-21", "Review technical, data, and commercial dependencies internally.", "Feasibility and risk register"),
            ("Days 22-30", "Prepare a decision-ready pilot proposal; do not send outreach automatically.", "Internal activation pack"),
        ]
        for company in selected:
            for period, activity, deliverable in phases:
                activation.append({"partner_id": company["id"], "period": period, "activity": activity, "responsible_role": "Partnership lead", "expected_deliverable": deliverable, "dependencies": ["Internal approval"], "success_measure": "Internal deliverable accepted", "risks": ["No verified partnership pathway"]})
        coverage = {"verified_coverage_percent": portfolio["weighted_capability_coverage"], "inferred_coverage_percent": portfolio["inferred_weighted_capability_coverage"], "gaps": portfolio["uncovered_capabilities"], "inferred_but_unverified": portfolio["inferred_but_unverified_capabilities"]}
        return {"analysis_id": analysis_id, "executive_summary": {"objective": brief["business_goal"], "result": f"{len(candidates)} candidates discovered; {len(investigated)} investigated; {len(selected)} complementary partners selected.", "status_note": "All partnership structures and outreach are proposals, not verified commitments."}, "customer_objective_and_assumptions": brief, "capability_map": capabilities, "candidate_universe": candidates, "investigated_shortlist": investigated, "company_profiles": investigated, "decision_makers": people, "score_breakdowns": scores, "evidence_ledger": evidence, "selected_complementary_portfolio": portfolio, "capability_coverage_and_gaps": coverage, "joint_solution_blueprint": [{"partner_id": c["id"], "proposal_status": "hypothesis", "role": "Complementary delivery or distribution partner", "joint_value_proposition": f"Combine {brief['company_name']}'s product with {c['name']}'s supported capabilities.", "pilot_scope": "Define after partner validation."} for c in selected], "partner_activation_proposals": [{"partner_id": c["id"], "meeting_agenda": ["Validate customer problem", "Review complementary capability", "Scope a pilot"], "outreach_draft": "Draft only — do not send: explore a potential partnership hypothesis.", "status": "proposal"} for c in selected], "activation_roadmap": activation, "warnings_and_limitations": ["Scores are transparent heuristics, not objective facts.", "Crustdata facts are provider evidence, not independent corroboration."] + portfolio["limitations"], "run_metadata": {"provider": "Crustdata REST API", "demo_mode": self.settings.demo_mode, "llm_used": False, "completed_at": datetime.now(timezone.utc).isoformat()}}

    @staticmethod
    def _demo_company() -> dict[str, Any]:
        return {"id": "demo-1", "provider_id": None, "name": "DEMO DATA — Example Integrator", "domain": None, "description": "DEMO DATA: enterprise implementation and data integration fixture.", "industries": ["DEMO DATA"], "country": "India", "headcount": None, "people": None, "source_url": None, "raw": {}, "data_origin": "DEMO DATA"}
