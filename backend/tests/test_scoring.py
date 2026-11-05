from app.services.portfolio_optimizer import optimize
from app.services.scoring import score_company


def test_scoring_and_portfolio_are_deterministic_and_penalize_overlap():
    capabilities = [
        {"name": "Cloud", "canonical_name": "cloud", "importance_weight": 1, "search_aliases": ["cloud"]},
        {"name": "Distribution", "canonical_name": "distribution", "importance_weight": 1, "search_aliases": ["distribution"]},
    ]
    companies = [
        {"id": "a", "name": "A", "description": "cloud", "industries": [], "country": "India", "domain": "a", "provider_id": 1, "source_url": None, "headcount": None, "people": None},
        {"id": "b", "name": "B", "description": "cloud distribution", "industries": [], "country": "India", "domain": "b", "provider_id": 2, "source_url": None, "headcount": None, "people": None},
        {"id": "c", "name": "C", "description": "distribution", "industries": [], "country": "India", "domain": "c", "provider_id": 3, "source_url": None, "headcount": None, "people": None},
    ]
    brief = {"target_industry": "BFSI", "target_market": "India"}
    scores = [score_company(company, capabilities, brief) for company in companies]
    first = optimize(companies, scores, capabilities, 2)
    second = optimize(companies, scores, capabilities, 2)
    assert first == second
    assert first["weighted_capability_coverage"] == 0
    assert first["inferred_weighted_capability_coverage"] == 100
    assert first["uncovered_capabilities"] == ["Cloud", "Distribution"]


def test_portfolio_prefers_complementary_pair_over_best_individual_company():
    capabilities = [{"name": name, "canonical_name": name.lower(), "importance_weight": 1} for name in ("A", "B", "C", "D")]
    companies = [{"id": key, "name": key} for key in ("high", "left", "right")]
    def score(company_id, coverage, strategic, confidence):
        return {"company_id": company_id, "coverage": {key: key in coverage for key in "abcd"}, "coverage_evidence": {key: {"status": "partially_supported" if key in coverage else "unverified"} for key in "abcd"}, "strategic_fit": strategic, "evidence_confidence": confidence}
    scores = [score("high", "ab", 100, 5), score("left", "ac", 70, 90), score("right", "bd", 80, 90)]
    portfolio = optimize(companies, scores, capabilities, 2)
    assert set(portfolio["selected_partner_ids"]) == {"left", "right"}
    assert portfolio["inferred_weighted_capability_coverage"] == 100
    assert portfolio["weighted_capability_coverage"] == 0
    assert set(portfolio["uncovered_capabilities"]) == {"A", "B", "C", "D"}
