# ALLIOME API contract

Base URL: `http://127.0.0.1:8000`. All responses are JSON. Errors use:

```json
{"error": {"code": "request_error", "message": "Analysis not found"}}
```

## `GET /health`

Returns `{"status":"ok","service":"alliome"}`.

## `POST /api/analyze`

Creates an asynchronous analysis and returns HTTP `202` immediately.

```json
{
  "company_name": "Example AI",
  "website": "https://example.com",
  "product_description": "AI document processing and workflow automation",
  "target_market": "India",
  "target_industry": "BFSI",
  "ideal_customer": "Banks and financial institutions",
  "business_goal": "Enter the Indian BFSI market",
  "required_capabilities": [
    "BFSI domain expertise",
    "Enterprise AI implementation",
    "Cloud deployment",
    "Enterprise data integration",
    "Enterprise distribution"
  ],
  "partner_types": ["System integrators", "BFSI technology partners"],
  "max_candidates": 20,
  "max_partners": 3
}
```

Response:

```json
{"analysis_id":"UUID","status":"queued"}
```

`max_candidates` is 1–50; `max_partners` is 1–6. `website`, if present, must begin with `http://` or `https://`.

## `GET /api/analyze/{analysis_id}`

Poll this endpoint until status is `completed`, `partial`, `failed`, or `cancelled`.

```json
{
  "analysis_id": "UUID",
  "status": "partial",
  "stage": "completed",
  "progress": 100,
  "created_at": "2026-11-06T00:00:00+00:00",
  "updated_at": "2026-11-06T00:00:03+00:00",
  "warnings": [{"code":"configuration_missing","message":"CRUSTDATA_API_KEY is not configured"}],
  "errors": [],
  "report": {"executive_summary": {}}
}
```

The final `report` includes stable sections: `executive_summary`, `customer_objective_and_assumptions`, `capability_map`, `candidate_universe`, `investigated_shortlist`, `company_profiles`, `decision_makers`, `score_breakdowns`, `evidence_ledger`, `selected_complementary_portfolio`, `capability_coverage_and_gaps`, `joint_solution_blueprint`, `partner_activation_proposals`, `activation_roadmap`, `warnings_and_limitations`, and `run_metadata`. `capability_coverage_and_gaps` separates `verified_coverage_percent` from `inferred_coverage_percent`; consumers must not present an inferred keyword match as verified capability coverage.

## Detail endpoints

| Endpoint | Response payload |
|---|---|
| `GET /api/analyze/{id}/partners` | `analysis_id`, `status`, `partners`, `decision_makers` |
| `GET /api/analyze/{id}/portfolio` | `analysis_id`, `status`, `portfolio` |
| `GET /api/analyze/{id}/activation` | `analysis_id`, `status`, `activation`, `proposals` |

All four analysis endpoints return a structured 404 error for an unknown ID. Consumers should display warnings and evidence status rather than treating partial output as verified.
