# ALLIOME — Frontend / Backend Integration Audit Report

**Scope:** Frontend only. The FastAPI backend is owned by Person 1 (Codex) and developed in the shared repository.
**Status:** Live-backend integration complete and verified end-to-end against a contract-compliant test harness. UI design unchanged.

---

## 1. Architecture (unchanged, now live by default)

All data flows through ONE place — components never fetch directly:

```
UI components/pages
   └── hooks (src/hooks/use-analysis.ts)      loading / error / retry / polling
        └── API service (src/lib/api/client.ts)  base URL config, timeout, error mapping
             ├── live mode (default) → FastAPI backend
             │     GET  /health
             │     POST /api/analyze
             │     GET  /api/analyze/{id}
             │     GET  /api/analyze/{id}/partners
             │     GET  /api/analyze/{id}/portfolio
             │     GET  /api/analyze/{id}/activation
             └── mock mode (explicit opt-in) → src/lib/api/mock-engine.ts
                   (fictional data for local dev & automated tests ONLY,
                    labelled "DEMO DATA" everywhere in the UI)
```

**Configuration** (`.env`, inlined at build time):

| Variable | Default | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_MODE` | `live` | `live` calls FastAPI; `mock` = labelled demo data for dev/tests |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Where Person 1's backend runs |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | `30000` | Per-request timeout |

**Switching is a pure config change — no component code involved.**

---

## 2. Completed integrations (all verified live)

| # | Feature | Endpoint(s) | Status | Verified behaviour |
|---|---|---|---|---|
| 1 | Health check (Settings page) | `GET /health` | ✅ Done | Reachable / unreachable states, 8s fail-fast timeout |
| 2 | New ecosystem — 5-step brief | `POST /api/analyze` | ✅ Done | Real POST, real `analysis_id`, honest error toast when backend down (no simulated success) |
| 3 | Investigation workspace | `GET /api/analyze/{id}` | ✅ Done | 2s polling until terminal, live 9-stage tracker, queued/running/completed/partial/failed/cancelled banners, retry re-submits the same brief |
| 4 | Partner discovery (table + cards) | `GET /api/analyze/{id}/partners` | ✅ Done | Scores, capabilities, evidence confidence from backend; CSV export of backend data |
| 5 | Partner intelligence profile | `GET /api/analyze/{id}/partners` | ✅ Done | 9 sections incl. evidence sources (title/URL/retrieved date/support status), decision-makers, unknowns |
| 6 | Portfolio intelligence | `GET /api/analyze/{id}/portfolio` | ✅ Done | Coverage matrix, node-link graph, complementarity narrative, substitutions — all backend-computed; frontend performs NO authoritative selection |
| 7 | Activation workspace | `GET /api/analyze/{id}/activation` | ✅ Done | Rationale, joint solution, draft outreach (explicitly "not sent"), 30-day roadmap |
| 8 | Executive report | above 3 result endpoints | ✅ Done | Board-ready report assembled from backend results; print/PDF export |
| 9 | Overview metrics | result endpoints | ✅ Done | All stat cards computed from backend responses — no hardcoded numbers |
| 10 | Runtime contract verification | all | ✅ New | Zod schemas (`src/lib/api/validate.ts`) validate every response; drift → precise `contract_mismatch` error naming endpoint + field |

**Error/edge handling implemented:** request timeout (AbortController), network error, HTTP error with backend `detail` message, 404 unknown analysis, partial results (labelled, with reason + missing list), polling gives up after 4 consecutive transient errors or 15 min, per-result retry buttons.

**Verified end-to-end** with a real HTTP server (`scripts/test-backend.py`, a contract-compliant FastAPI harness): submit → poll → completed → discovery / portfolio / activation / reports / partner profile all render backend data. Also verified the failure path: backend down → honest error toast, no navigation, no fake results.

---

## 3. Mock data removal from the final experience

| Item | Before | Now |
|---|---|---|
| Default mode | `mock` | **`live`** — mock requires explicit opt-in |
| Seeded "Aivera" investigation history | Always present, marked active | Only exists in mock mode; live mode starts empty **and strips any persisted demo-flagged entries** from localStorage |
| "Demo data" badges / banners | Rendered in default build | Render **only** in mock mode (`IS_DEMO` gate); zero demo labels in live builds |
| Sidebar "Demo mode" box | Always warning-styled | Live shows "Live backend" (mint); mock shows "Mock mode" |
| Settings "Demo engine controls" | Always visible | Mock mode only; hidden in live builds |
| Topbar "Reset demo data" / "demo account" | Demo wording always | Live: "Clear workspace data", plain "Workspace owner" |
| Overview "Partner signals" | Synthetic feed in demo; live claimed "connected to live API" | Live shows honest **"Signals feed — not available yet"** (no signals endpoint exists in the contract) |
| Retry resubmission | Hardcoded `demo: true` flag | Fixed — flag follows the actual mode |
| `.env` defaults | empty URL + `mock` | `http://localhost:8000` + `live` |

**Integrity rules enforced:** synthetic data is never representable as verified intelligence — mock mode is structurally impossible to reach without an explicit environment variable, and every mock record carries a `demo: true` flag the UI labels. No hardcoded metrics remain in any live path.

---

## 4. API contract assumed by the frontend (must be confirmed with Person 1)

`backend/API.md` was **not available** in this workspace, so the frontend implements the contract documented in `src/lib/api/types.ts` (from the shared Master Prompt). The runtime validators will flag any deviation with an actionable message. **Person 1: please confirm each item below — if any field differs, tell me and I will remap it in the adapter (`client.ts`) without touching the UI.**

### 4.1 `POST /api/analyze` — request body (what the frontend sends)

```json
{
  "company": { "name": "", "website": "", "product_name": "", "product_description": "" },
  "target_market": { "geography": "", "industry": "", "ideal_customer": "", "objective": "" },
  "required_capabilities": [ { "key": "", "name": "", "importance": "critical|high|medium|low", "rationale": "" } ],
  "partner_types": ["system_integrator","technology","implementation","consultancy","reseller","referral","cloud"],
  "max_candidates": 12
}
```

Response: `{ "analysis_id": "…", "status": "queued" }`

### 4.2 `GET /api/analyze/{id}` — response skeleton the frontend validates

- `analysis_id: string`, `status: queued|running|completed|partial|failed|cancelled`
- `brief` (echo of the request), `created_at`/`updated_at` (ISO-8601)
- `stages: [{ key, label, status: pending|running|completed|failed|skipped, started_at, completed_at, detail }]`
  — expected stage keys: `analysing_company`, `compiling_capability_gaps`, `discovering_partners`, `investigating_capabilities`, `identifying_decision_makers`, `collecting_evidence`, `evaluating_fit`, `optimising_portfolio`, `generating_activation`
- `error: { code, message, stage? } | null` on failed runs

### 4.3 `GET /api/analyze/{id}/partners`

`{ analysis_id, partners: Partner[], partial: { reason, missing[] } | null }`. Each `Partner`: `id, name, website, hq, category, employees?, strategic_fit (0–100), activation_readiness (0–100), evidence_confidence: high|medium|low, capabilities: [{key,name,level: strong|moderate|emerging}], geography[], technology_compatibility {score, notes}, decision_makers: [{id,name,role,relevance,evidence_ids[],confidence,linkedin_url?}], unknowns[], profile {overview, services[], industry_expertise[], technology, hiring_momentum, partnership_rationale}, evidence: [{id,title,url,publisher,retrieved_at,support: verified|unverified|contradicted}]`.

### 4.4 `GET /api/analyze/{id}/portfolio`

`{ analysis_id, selected: [{partner_id, contributions[], rationale}], capabilities[] (echo), coverage: [{capability_key, partner_id, status: supported|partial|not_established}], complementarity {narrative, vs_top_scores, redundancies[], gaps[]}, alternatives[] }`.

### 4.5 `GET /api/analyze/{id}/activation`

`{ analysis_id, activations: [{partner_id, rationale, partner_benefit, proposed_role, joint_value_proposition, joint_solution, target_customer_profile, pilot_scope, commercial_model, success_metrics[], technical_dependencies[], decision_maker_ids[], draft_outreach, meeting_agenda[], roadmap: [{id,title,description,phase: week_1..week_4, owner: you|partner|joint}]}] }`.

---

## 5. Missing backend capabilities → exact requirements for Person 1

The frontend does NOT simulate any of these. Each shows an honest empty / not-available state until the backend ships it.

| # | Capability | Current frontend behaviour | Requirement for Person 1 |
|---|---|---|---|
| B1 | **List analyses** | Investigations index is browser-local (only runs started in this browser are listed). No fabricated history. | Optional endpoint `GET /api/analyses` → `[{analysis_id, status, brief.company.name, brief.company.product_name, brief.target_market.geography, created_at}]`. I will wire the index to it same-day. |
| B2 | **Partner signals feed** | Overview shows "Signals feed — not available yet". | Optional endpoint `GET /api/analyze/{id}/signals` → `[{id, partner_id, partner_name, type: hiring|content|partnership|leadership|event, text, observed_at, url}]` (schema already typed in `types.ts`). |
| B3 | **Cancel a running analysis** | "Cancelled" status is handled and displayed if returned, but there is no way to request cancellation. | Optional `POST /api/analyze/{id}/cancel`. |
| B4 | **Real Crustdata results** | All partners/scores/evidence are rendered from whatever the backend returns — verified working. | The live backend must return real Crustdata-derived companies, scores, evidence URLs and `retrieved_at` dates. The frontend adds nothing. |
| B5 | **CORS** | Browser calls the backend directly. | Backend must allow the frontend origin (`CORSMiddleware`, `allow_origins=["*"]` is fine for the hackathon). Confirmed working in the harness. |
| B6 | **Contract confirmation** | Runtime validators enforce §4. | Please send / publish `backend/API.md` or an OpenAPI schema; I will diff it against §4 and remap in `client.ts` if anything differs. |

---

## 6. How to run

```bash
# Live mode (default) — frontend
bun install && bun run build && bun run start        # http://localhost:3000
#   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000   (set in .env)

# Backend (Person 1)
uvicorn main:app --port 8000

# Mock mode (local dev / automated tests ONLY — data labelled "DEMO DATA")
NEXT_PUBLIC_API_MODE=mock bun run dev

# Contract test harness (simulates the backend for frontend integration tests)
python3 scripts/test-backend.py                       # http://localhost:8000
```

---

## 7. Remaining blockers / open items

1. **Real backend not yet connected** in this workspace (Person 1's code is developed separately). Everything is wired and verified against the contract harness; the final live demo needs Person 1's server running with real Crustdata processing (see §5 B4).
2. **Contract confirmation pending** — §4 must be diffed against Person 1's actual schemas (§5 B6). The runtime validators make any mismatch immediately visible with the exact endpoint + field name.
3. Optional endpoints B1–B3 would upgrade honest not-available states to full features.

**Bottom line:** every feature the current backend contract supports is connected for real; everything else says so honestly. No synthetic data can appear in a live build.
