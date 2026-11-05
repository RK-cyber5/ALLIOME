from __future__ import annotations

from itertools import combinations
from typing import Any


def optimize(companies: list[dict[str, Any]], scores: list[dict[str, Any]], capabilities: list[dict[str, Any]], max_partners: int) -> dict[str, Any]:
    score_by_id = {score["company_id"]: score for score in scores}
    def value(selection: tuple[dict[str, Any], ...]) -> float:
        coverage_counts = {cap["canonical_name"]: 0 for cap in capabilities}
        for company in selection:
            for key, covered in score_by_id[company["id"]]["coverage"].items():
                coverage_counts[key] += int(covered)
        covered_weight = sum(cap["importance_weight"] for cap in capabilities if coverage_counts[cap["canonical_name"]])
        redundant_weight = sum(cap["importance_weight"] * (coverage_counts[cap["canonical_name"]] - 1) for cap in capabilities if coverage_counts[cap["canonical_name"]] > 1)
        avg_strategic = sum(score_by_id[company["id"]]["strategic_fit"] for company in selection) / len(selection)
        avg_evidence = sum(score_by_id[company["id"]]["evidence_confidence"] for company in selection) / len(selection)
        return covered_weight * 60 + avg_strategic * .25 + avg_evidence * .15 - redundant_weight * 15

    possible = [choice for size in range(1, min(max_partners, len(companies)) + 1) for choice in combinations(companies, size)]
    selected = list(max(possible, key=lambda choice: (value(choice), tuple(sorted(company["id"] for company in choice))))) if possible else []
    covered: set[str] = set()
    rationale: list[dict[str, Any]] = []
    for winner in selected:
        winner_score = score_by_id[winner["id"]]
        new = [cap["name"] for cap in capabilities if winner_score["coverage"].get(cap["canonical_name"]) and cap["canonical_name"] not in covered]
        overlap = [cap["name"] for cap in capabilities if winner_score["coverage"].get(cap["canonical_name"]) and cap["canonical_name"] in covered]
        covered.update(cap["canonical_name"] for cap in capabilities if winner_score["coverage"].get(cap["canonical_name"]))
        rationale.append({"company_id": winner["id"], "new_capabilities": new, "overlap": overlap, "selection_value": round(value(tuple(selected)), 2)})
    all_capabilities = {cap["canonical_name"]: cap["name"] for cap in capabilities}
    total_weight = sum(cap["importance_weight"] for cap in capabilities) or 1
    inferred_weight = sum(cap["importance_weight"] for cap in capabilities if cap["canonical_name"] in covered)
    verified_covered = set()
    for company in selected:
        score = score_by_id[company["id"]]
        for capability in capabilities:
            key = capability["canonical_name"]
            if score["coverage_evidence"][key]["status"] == "supported":
                verified_covered.add(key)
    verified_weight = sum(cap["importance_weight"] for cap in capabilities if cap["canonical_name"] in verified_covered)
    uncovered = [name for key, name in all_capabilities.items() if key not in verified_covered]
    inferred_only = [name for key, name in all_capabilities.items() if key in covered and key not in verified_covered]
    return {
        "selected_partner_ids": [company["id"] for company in selected],
        "selection_rationale": rationale,
        "capability_to_partner": {cap["name"]: [company["id"] for company in selected if score_by_id[company["id"]]["coverage"].get(cap["canonical_name"])] for cap in capabilities},
        "weighted_capability_coverage": round(100 * verified_weight / total_weight, 2),
        "inferred_weighted_capability_coverage": round(100 * inferred_weight / total_weight, 2),
        "uncovered_capabilities": uncovered,
        "inferred_but_unverified_capabilities": inferred_only,
        "redundancy_warnings": [item for item in rationale if item["overlap"]],
        "alternative_partner_ids": [company["id"] for company in companies if company not in selected][:3],
        "portfolio_confidence": round(sum(score_by_id[c["id"]]["evidence_confidence"] for c in selected) / len(selected), 2) if selected else 0,
        "limitations": (["Some required capabilities have no supported coverage."] if uncovered else []) + (["No supported candidates were returned by the provider."] if not selected else []),
    }
