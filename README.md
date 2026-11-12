# ALLIOME

ALLIOME is a full-stack B2B partner discovery and portfolio intelligence application. It contains a Next.js frontend and a FastAPI backend in a two-runtime monorepo.

## Repository layout

- `frontend/` — Next.js 16 / React / TypeScript application. Uses Bun (`frontend/bun.lock`) as its package manager. The included WebSocket example uses Socket.IO client/server packages declared in frontend development dependencies.
- `backend/` — FastAPI service. Production dependencies are in `backend/requirements.txt`; test dependencies are in `backend/requirements-dev.txt`; `backend/pyproject.toml` is the uv project manifest.
- `docs/` — API contract and architecture documentation.

## Backend setup (Python 3.12+ and uv)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Install the pinned backend environment and run tests:

```powershell
uv sync --frozen
uv run pytest -q
```

The committed `backend/uv.lock` keeps backend dependency resolution reproducible.

## Frontend setup (Node.js 20.9+ and Bun 1.4.4+)

```powershell
cd frontend
bun install --frozen-lockfile
bun run db:generate
bun run build
bun run start
```

The standalone Next.js server listens on the configured `PORT` and `HOSTNAME`. For development use `bun run dev`. The frontend API client expects the FastAPI service at `http://127.0.0.1:8000` unless configured otherwise.

## Full-stack validation

Start the backend in one terminal, then start the frontend in another. The frontend production build is `bun run build`; the production start command is `bun run start`. The backend health endpoint is `GET http://127.0.0.1:8000/health`. Live company research requires a buyer/operator-provided `CRUSTDATA_API_KEY`; demo mode uses clearly labelled fixture data.
