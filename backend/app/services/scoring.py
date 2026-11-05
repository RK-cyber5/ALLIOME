from __future__ import annotations

from typing import Any


def score_company(company: dict[str, Any], capabilities: list[dict[str, Any]], brief: dict[str, Any]) -> dict[str, Any]:
    text = " ".join(str(company.get(key) or "") for key in ("name", "description", "industries", "country")).lower()
    coverage: dict[str, bool] = {}
    coverage_evidence: dict[str, dict[str, str]] = {}
    for capability in capabilities:
        matched = any(alias in text for alias in capability["search_aliases"])
        coverage[capability["canonical_name"]] = matched
        coverage_evidence[capability["canonical_name"]] = {
            "status": "partially_supported" if matched else "unverified",
            "explanation": "Keyword match in a provider company record; it is a capability inference, not independent capability verification." if matched else "No provider record field supports this capability.",
        }
    total_weight = sum(item["importance_weight"] for item in capabilities) or 1
    covered_weight = sum(item["importance_weight"] for item in capabilities if coverage[item["canonical_name"]])
    industry_fit = 15 if brief["target_industry"].lower() in text else 5
    geography_fit = 10 if brief["target_market"].lower() in text else 4
    strategic = min(100, round(65 * covered_weight / total_weight + industry_fit + geography_fit))
    readiness = min(100, round(35 + (20 if company.get("description") else 0) + (15 if company.get("headcount") else 0) + (15 if company.get("people") else 0)))
    evidence_fields = sum(bool(company.get(key)) for key in ("name", "domain", "description", "industries", "provider_id"))
    confidence = min(100, evidence_fields * 16 + (10 if company.get("source_url") else 0))
    return {
        "company_id": company["id"],
        "strategic_fit": strategic,
        "activation_readiness": readiness,
        "evidence_confidence": confidence,
        "coverage": coverage,
        "coverage_evidence": coverage_evidence,
        "components": {
            "weighted_capability_coverage": round(covered_weight / total_weight * 65, 2),
            "industry_fit": industry_fit,
            "geography_fit": geography_fit,
            "delivery_evidence": 20 if company.get("description") else 0,
            "identity_evidence_fields": evidence_fields,
        },
        "explanation": "Deterministic heuristic; scores are decision support, not verified commercial facts.",
    }
