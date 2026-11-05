# ALLIOME backend

ALLIOME converts a B2B market-entry brief into an inspectable, evidence-backed partner portfolio. It is designed for market-entry consultants and ecosystem teams who pay to reduce manual company research, partner qualification, and activation planning.

## Run

Requires Python 3.12+ in the intended deployment environment.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`. Run tests with `pytest -q`.

With a configured `CRUSTDATA_API_KEY`, run the bounded authentication/search smoke test before a live demo:

```powershell
python scripts/live_validate.py
```

It performs a free credit check, a free TCS identity lookup, and one bounded company search. It never prints the API key.

## Runtime modes

- **Live mode** (`DEMO_MODE=false`): uses `CRUSTDATA_API_KEY` server-side. If it is missing or a provider call fails, the job becomes `partial` with a structured warning; it never invents companies.
- **Demo mode** (`DEMO_MODE=true`): supplies one clearly labelled `DEMO DATA` fixture solely for interface demonstrations. It is never mixed silently with live results.

The optional LLM configuration is deliberately not required. The normalization, capability compiler, identity resolution, scoring, portfolio selection, and report generation have deterministic fallbacks.

## Workflow

1. Normalize brief and compile weighted capabilities.
2. Search companies, then deduplicate by canonical ID, domain, then name.
3. Enrich only the first eight candidates carrying canonical IDs.
4. Search senior decision-maker profiles for up to three investigated companies.
5. Record provider facts in an evidence ledger.
6. Score strategic fit, activation readiness, and evidence confidence.
7. Select a complementary portfolio with weighted coverage and overlap penalties.
8. Persist every stage and return a JSON report for polling clients.

## Crustdata usage

The app makes REST calls to `/company/search`, `/company/enrich`, `/person/search`, and `/account/credits` when configured. It uses headers `authorization: Bearer`, `content-type: application/json`, and `x-api-version: 2025-11-01`. The browser never sees credentials.

It classifies 401, 402, 403, 429, timeouts, malformed responses, and 5xx failures. Rate limits are respected with bounded retries for 429/5xx only. Do not use the Codex MCP connector at runtime: that connector is development-only.

## Known limits deliberately retained

- Company search uses a conservative geography filter because an arbitrary natural-language product/industry filter must not be guessed.
- Scores are explainable heuristics, not objective verification.
- Crustdata evidence is provider evidence, not independent website corroboration.
- There is no background worker process; FastAPI owns bounded in-process jobs and SQLite checkpoints, which is appropriate for the hackathon scope.

See [API documentation](../docs/API.md) and [architecture](../docs/ARCHITECTURE.md).
