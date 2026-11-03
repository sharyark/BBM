#!/usr/bin/env bash
# Client testing from this machine: builds the web app, serves app + API on one address and opens a free
# Cloudflare quick tunnel so anyone can reach it over HTTPS. Uses the database in backend/.env (Supabase).
# Run as `./public.sh`; Ctrl+C stops everything. The public link changes on every start.
# Needs `cloudflared` (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
set -euo pipefail
# Keep the machine awake (no auto-suspend, closing the lid doesn't sleep) only while this script runs;
# normal sleep comes back as soon as it stops.
if [ -z "${HISAAB_AWAKE:-}" ] && command -v systemd-inhibit >/dev/null; then
  export HISAAB_AWAKE=1
  exec systemd-inhibit --what=idle:sleep:handle-lid-switch --who="Hisaab Portal" \
    --why="Serving the public client link" --mode=block "$0" "$@"
fi
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT=$PWD
API_PORT=8100
WEB_PORT=4173

command -v cloudflared >/dev/null || { echo "cloudflared is not installed (see the link at the top of this file)"; exit 1; }
# Vite needs Node 18+; nvm may have an older one first on PATH.
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  if [ -x /usr/bin/node ] && [ "$(/usr/bin/node -p 'process.versions.node.split(".")[0]')" -ge 18 ]; then
    export PATH="/usr/bin:$PATH"
  else
    echo "Node 18 or newer is needed (try: nvm use 18)"; exit 1
  fi
fi
# The PWA build (workbox) needs the global `crypto` that Node exposes by default only from v19.
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 19 ]; then
  export NODE_OPTIONS="${NODE_OPTIONS:-} --experimental-global-webcrypto"
fi

cd "$ROOT/backend"
[ -f .env ] || { echo "backend/.env is missing"; exit 1; }
# A stable signing key for this public instance, so restarts don't log everyone out. Git-ignored.
if [ ! -f .env.public ]; then
  umask 077
  echo "JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')" > .env.public
fi
# shellcheck disable=SC1091
source .venv/bin/activate
set -a; . ./.env.public; set +a
export ENV=prod COOKIE_SECURE=true   # served over HTTPS through the tunnel; prod also blocks demo seeding

echo "==> Migrating database"
alembic upgrade head

echo "==> Building web app"
cd "$ROOT/frontend"
[ -d node_modules ] || npm ci
npm run build >/dev/null || { echo "Web app build failed; run: cd frontend && npm run build"; exit 1; }

cleanup() { echo; echo "==> Stopping"; kill 0 2>/dev/null || true; }
trap cleanup INT TERM EXIT

echo "==> Starting API on 127.0.0.1:$API_PORT"
(cd "$ROOT/backend" && uvicorn app.main:app --host 127.0.0.1 --port "$API_PORT" --proxy-headers --log-level warning) &
echo "==> Starting web app on 127.0.0.1:$WEB_PORT"
# `vite preview` serves the built app and proxies /api to the API, so browser and API share one origin.
VITE_API_PROXY="http://127.0.0.1:$API_PORT" npx vite preview --host 127.0.0.1 --port "$WEB_PORT" --strictPort >/dev/null &

echo "==> Opening Cloudflare tunnel (takes a few seconds)"
cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$WEB_PORT" 2>&1 | while IFS= read -r line; do
  if url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' <<<"$line"); then
    echo
    echo "  Client link:  $url"
    echo "  Owner login:  $url/admin/login"
    echo "  Munshi login: $url/accountant/login"
    echo
    echo "  Keep this terminal open. Ctrl+C stops it."
  fi
done
