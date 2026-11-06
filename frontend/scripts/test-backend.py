"""
ALLIOME frontend integration TEST HARNESS — NOT part of the application.

A minimal FastAPI server that implements the documented API contract
(see src/lib/api/types.ts) so the frontend's live-mode integration can be
verified end-to-end without Person 1's real backend.

It exists ONLY to answer: does the frontend correctly submit, poll, render
and handle every documented status against a real HTTP server?

Run:  python3 scripts/test-backend.py   (serves http://localhost:8000)
"""

import asyncio
import time
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ALLIOME contract test harness")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nine documented stages, each advancing every ~1.5s in this harness.
STAGES = [
    ("analysing_company", "Analysing company & product"),
    ("compiling_capability_gaps", "Compiling capability gaps"),
    ("discovering_partners", "Discovering partner companies"),
    ("investigating_capabilities", "Investigating business capabilities"),
    ("identifying_decision_makers", "Identifying decision-makers"),
    ("collecting_evidence", "Collecting evidence"),
    ("evaluating_fit", "Evaluating individual partner fit"),
    ("optimising_portfolio", "Optimising the portfolio"),
    ("generating_activation", "Generating activation plans"),
]
STAGE_SECONDS = 1.5

RUNS: dict[str, dict] = {}
LOCK = asyncio.Lock()


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z"


def _stages(run: dict) -> list[dict]:
    elapsed = time.time() - run["created"]
    out = []
    for i, (key, label) in enumerate(STAGES):
        start = i * STAGE_SECONDS
        end = (i + 1) * STAGE_SECONDS
        if elapsed >= end:
            status = "completed"
        elif elapsed >= start:
            status = "running"
        else:
            status = "pending"
        out.append(
            {
                "key": key,
                "label": label,
                "status": status,
                "started_at": run["created_iso"] if elapsed >= start else None,
                "completed_at": run["created_iso"] if elapsed >= end else None,
                "detail": f"{key.replace('_', ' ')} — harness detail {i + 1}" if status == "completed" else None,
            }
        )
    return out


def _status(run: dict) -> str:
    elapsed = time.time() - run["created"]
    done = int(elapsed // STAGE_SECONDS)
    if done >= len(STAGES):
        return "partial" if run.get("force_partial") else "completed"
    return "running" if done >= 1 else "queued"


def _partners_payload(analysis_id: str, brief: dict) -> dict:
    caps = brief.get("required_capabilities", [])
    cap_keys = [c["key"] for c in caps] or ["domain_expertise"]
    cap_names = {c["key"]: c["name"] for c in caps}

    def partner(i: int, fit: int) -> dict:
        pid = f"harness-partner-{i}"
        return {
            "id": pid,
            "name": f"Harness Partner {i}",
            "website": f"https://partner{i}.example.com",
            "hq": "Berlin, Germany",
            "category": "system_integrator",
            "employees": "500-1000",
            "strategic_fit": fit,
            "activation_readiness": max(5, fit - 10),
            "evidence_confidence": "high" if i == 0 else "medium",
            "capabilities": [
                {"key": k, "name": cap_names.get(k, k), "level": "strong" if i == 0 else "moderate"}
                for k in cap_keys
            ],
            "geography": ["Germany", "DACH"],
            "technology_compatibility": {"score": 80 - i * 5, "notes": "Harness note."},
            "decision_makers": [
                {
                    "id": f"{pid}-dm-1",
                    "name": f"Contact {i}",
                    "role": "Partner Alliance Lead",
                    "relevance": "Owns partnership decisions.",
                    "evidence_ids": [f"{pid}-ev-1"],
                    "confidence": "high",
                    "linkedin_url": None,
                }
            ],
            "unknowns": ["Pricing model not established from public sources."],
            "profile": {
                "overview": "Harness-generated partner overview for contract testing.",
                "services": ["Integration", "Managed services"],
                "industry_expertise": [
                    {"industry": "Manufacturing", "detail": "20+ rollouts.", "evidence_ids": [f"{pid}-ev-1"]}
                ],
                "technology": {
                    "stack": ["SAP", "Azure"],
                    "integrations": ["MES", "ERP"],
                    "notes": "Stack from public case studies.",
                    "evidence_ids": [f"{pid}-ev-1"],
                },
                "hiring_momentum": {
                    "summary": "Steady integration-team hiring.",
                    "signals": [{"signal": "8 open integration roles.", "evidence_ids": [f"{pid}-ev-2"]}],
                },
                "partnership_rationale": f"Partner {i} covers the required capabilities with evidence.",
            },
            "evidence": [
                {
                    "id": f"{pid}-ev-1",
                    "title": "Partner case study page",
                    "url": f"https://partner{i}.example.com/cases",
                    "publisher": "partner site",
                    "retrieved_at": _now_iso(),
                    "support": "verified",
                },
                {
                    "id": f"{pid}-ev-2",
                    "title": "Careers page",
                    "url": f"https://partner{i}.example.com/careers",
                    "publisher": "partner site",
                    "retrieved_at": _now_iso(),
                    "support": "unverified",
                },
            ],
        }

    return {
        "analysis_id": analysis_id,
        "partners": [partner(0, 88), partner(1, 79), partner(2, 71)],
        "partial": None,
    }


def _portfolio_payload(analysis_id: str, brief: dict, partners: dict) -> dict:
    caps = brief.get("required_capabilities", [])
    selected_ids = [p["id"] for p in partners["partners"][:2]]
    return {
        "analysis_id": analysis_id,
        "selected": [
            {
                "partner_id": pid,
                "contributions": [
                    {"capability_key": c["key"], "level": "strong" if i == 0 else "moderate"}
                    for c in caps
                ],
                "rationale": f"{pid} contributes complementary coverage.",
            }
            for i, pid in enumerate(selected_ids)
        ],
        "capabilities": caps,
        "coverage": [
            {
                "capability_key": c["key"],
                "partner_id": pid,
                "status": "supported" if i == 0 else "partial",
            }
            for c in caps
            for i, pid in enumerate(selected_ids)
        ],
        "complementarity": {
            "narrative": "Harness portfolio narrative.",
            "vs_top_scores": "Harness vs-top-scores narrative.",
            "redundancies": [],
            "gaps": [{"capability_key": caps[-1]["key"], "note": "No strong contributor found."}] if caps else [],
        },
        "alternatives": [
            {
                "replace_partner_id": selected_ids[-1],
                "alternative_partner_id": partners["partners"][2]["id"],
                "effect": "Swaps coverage emphasis.",
                "coverage_delta": [{"capability_key": caps[0]["key"], "change": "improved", "note": "Harness delta."}]
                if caps
                else [],
            }
        ],
    }


def _activation_payload(analysis_id: str, partners: dict) -> dict:
    return {
        "analysis_id": analysis_id,
        "activations": [
            {
                "partner_id": partners["partners"][0]["id"],
                "rationale": "Harness activation rationale.",
                "partner_benefit": "New revenue stream.",
                "proposed_role": "Implementation & delivery partner",
                "joint_value_proposition": "Harness joint value proposition.",
                "joint_solution": "Harness joint solution.",
                "target_customer_profile": "Mid-size manufacturers.",
                "pilot_scope": "One shared-account engagement, 12 weeks.",
                "commercial_model": "Revenue-share hypothesis.",
                "success_metrics": ["Pilot success criteria met", "Two joint opportunities in 90 days"],
                "technical_dependencies": ["Read access to core systems", "EU cloud deployment"],
                "decision_maker_ids": [f"{partners['partners'][0]['id']}-dm-1"],
                "draft_outreach": "Dear Contact, ... harness draft outreach ...",
                "meeting_agenda": ["Introductions (5 min)", "Demo (10 min)"],
                "roadmap": [
                    {
                        "id": "t1",
                        "title": "Review technical fit",
                        "description": "Joint architecture walkthrough.",
                        "phase": "week_1",
                        "owner": "joint",
                    },
                    {
                        "id": "t2",
                        "title": "Prepare pilot scope",
                        "description": "Shortlist candidate customers.",
                        "phase": "week_2",
                        "owner": "you",
                    },
                ],
            }
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "alliome-contract-test-harness"}


@app.post("/api/analyze")
async def analyze(brief: dict):
    if not isinstance(brief, dict) or "company" not in brief:
        raise HTTPException(status_code=422, detail="Invalid brief payload")
    analysis_id = f"run-{uuid.uuid4().hex[:10]}"
    async with LOCK:
        RUNS[analysis_id] = {
            "id": analysis_id,
            "brief": brief,
            "created": time.time(),
            "created_iso": _now_iso(),
        }
    return {"analysis_id": analysis_id, "status": "queued"}


@app.get("/api/analyze/{analysis_id}")
def get_analysis(analysis_id: str):
    run = RUNS.get(analysis_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
    return {
        "analysis_id": analysis_id,
        "status": _status(run),
        "brief": run["brief"],
        "created_at": run["created_iso"],
        "updated_at": _now_iso(),
        "stages": _stages(run),
        "error": None,
    }


@app.get("/api/analyze/{analysis_id}/partners")
def get_partners(analysis_id: str):
    run = RUNS.get(analysis_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
    return _partners_payload(analysis_id, run["brief"])


@app.get("/api/analyze/{analysis_id}/portfolio")
def get_portfolio(analysis_id: str):
    run = RUNS.get(analysis_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
    return _portfolio_payload(analysis_id, run["brief"], _partners_payload(analysis_id, run["brief"]))


@app.get("/api/analyze/{analysis_id}/activation")
def get_activation(analysis_id: str):
    run = RUNS.get(analysis_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
    return _activation_payload(analysis_id, _partners_payload(analysis_id, run["brief"]))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
