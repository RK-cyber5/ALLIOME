#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
command -v bun >/dev/null || { echo "Install Bun 1.3.4+ first" >&2; exit 1; }
command -v uv >/dev/null || { echo "Install uv first" >&2; exit 1; }
( cd "$ROOT/frontend" && bun install && bun install --frozen-lockfile && bun run db:generate && bun run build )
( cd "$ROOT/backend" && uv lock && uv sync --all-groups && uv run python -m pytest -q )
echo "SUCCESS: lockfiles regenerated, frontend production build passed, and backend tests passed. Review and commit frontend/bun.lock and backend/uv.lock."
