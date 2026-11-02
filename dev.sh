#!/usr/bin/env bash
# Local development: starts Postgres (Docker), the API (:8000) and the web app (:5173).
# Run it as `./dev.sh` (not `source dev.sh`). Ctrl+C stops the API and web app; the DB keeps running.
#   docker compose -f docker-compose.dev.yml down   # to stop the DB too
# If sourced, run in a child bash instead: set -e / Ctrl+C would otherwise close the user's terminal.
if [ "${BASH_SOURCE[0]}" != "$0" ]; then
  bash "${BASH_SOURCE[0]}" "$@"
  return $?
fi
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT=$PWD

cd "$ROOT/backend"
[ -f .env ] || { cp .env.example .env; echo "==> Created backend/.env from .env.example"; }

# Only start the Docker DB (and load demo data) when backend/.env points at a local database.
# A remote DATABASE_URL (e.g. Supabase) is used as-is and never seeded.
DB_URL=$(grep -E '^DATABASE_URL=' .env | tail -1 | cut -d= -f2- || true)
if [ -z "$DB_URL" ] || echo "$DB_URL" | grep -qE '@(localhost|127\.0\.0\.1)(:|/)'; then
  LOCAL_DB=1
  echo "==> Starting local database (Docker)"
  (cd "$ROOT" && docker compose -f docker-compose.dev.yml up -d)
  until (cd "$ROOT" && docker compose -f docker-compose.dev.yml exec -T db pg_isready -U hisaab) >/dev/null 2>&1; do sleep 1; done
else
  LOCAL_DB=0
  echo "==> Using remote database from backend/.env (no Docker, no demo data)"
fi
if [ ! -x .venv/bin/python ]; then
  echo "==> Creating Python environment (first run)"
  python3 -m venv .venv
  .venv/bin/pip install -e ".[dev]"
fi
# shellcheck disable=SC1091
source .venv/bin/activate

echo "==> Migrating database"
alembic upgrade head

if [ "$LOCAL_DB" = 1 ]; then
  echo "==> Loading demo data (skipped if the database already has data)"
  python -m app.seed || true
fi

cleanup() { echo; echo "==> Stopping API and web app"; kill 0 2>/dev/null || true; }
trap cleanup INT TERM EXIT

echo "==> Starting API on http://127.0.0.1:8000"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &

echo "==> Starting web app on http://127.0.0.1:5173"
cd "$ROOT/frontend"
[ -d node_modules ] || npm ci
npm run dev -- --host 127.0.0.1 &

wait
