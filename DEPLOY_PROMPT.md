# Hand-off prompt: deploy Hisaab Portal for client testing

Paste everything below the line into a new Claude Code session started in this folder
(`cd ~/Desktop/hisaab-deploy && claude`).

---

This folder is a copy of the Hisaab Portal project (FastAPI + Postgres backend in `backend/`,
React + Vite frontend in `frontend/`). Read `CLAUDE.md`, `README.md` and `INSTALL.md` first.

**Goal:** put a test build online so the client can open a link, try the app, and ask for changes.
I want the database on **Supabase** and the frontend on **Cloudflare**. This is a testing/staging
environment, not production. Keep my existing GitHub repo and CI working.

**Setup notes for this copy:**
- `node_modules`, `.venv` and build output were not copied. Reinstall them
  (`cd backend && python -m venv .venv && pip install -e .[dev]` or whatever `INSTALL.md` says;
  `cd frontend && npm ci`).
- The copy is on branch `sharyar` at `0e4427a`. `origin/main` already has this plus a merge commit,
  so run `git fetch` and decide with me which branch to deploy from.
- `backend/.env` was copied from my working folder. Don't commit it.

**Facts about the code that affect the deploy (I checked them; verify again before relying on them):**
1. **The backend can't run on Cloudflare.** It's Python/FastAPI with WeasyPrint (PDFs) and
   openpyxl. It needs a real container host. Suggest a free or cheap option that runs
   `backend/Dockerfile` (Render, Railway, Fly.io, Koyeb...), or, as a fallback, running it on my
   machine behind a Cloudflare Tunnel. Give me the pros and cons in plain words and let me pick.
2. **Frontend and API must share one origin.** The frontend calls the relative path `/api/v1`
   (`frontend/src/lib/config.ts`), and the refresh token is an httpOnly cookie with
   `SameSite=Strict` (`backend/app/modules/auth/router.py`). If the frontend is on `*.pages.dev`
   and the API is on another domain, login breaks after the first token refresh. Preferred fix:
   a Cloudflare Pages Function (`frontend/functions/api/[[path]].ts`) that proxies `/api/*` to the
   backend and passes `Set-Cookie` through unchanged. Don't loosen the cookie to `SameSite=None`
   unless you explain why and I agree.
3. **Login rate limit is per IP** (5/min, `backend/app/core/deps.py` reads the first
   `X-Forwarded-For` entry). Behind the proxy, make sure the real client IP gets forwarded
   (e.g. from `CF-Connecting-IP`), or every tester will share one limit.
4. **Supabase connection:** use the direct connection or the *session* pooler (port 5432) with
   `postgresql+psycopg://...?sslmode=require`. The transaction pooler (6543) breaks psycopg
   prepared statements and Alembic. Run `alembic upgrade head`, then `python -m app.bootstrap` for
   the first admin. Ask me whether to load demo data (`python -m app.seed`) for the client.
   The local setup uses a restricted DB role (`deploy/db/init-app-role.sh`); propose the Supabase
   equivalent but don't block on it.
5. **Backend env on the host:** `ENV`, `DATABASE_URL`, a fresh strong `JWT_SECRET`,
   `COOKIE_SECURE=true`, `CORS_ORIGINS=["https://<pages-domain>"]`, `BUSINESS_NAME`,
   `CURRENCY_SYMBOL`, `FIN_YEAR_START_MONTH`, `BOOTSTRAP_ADMIN_*` (strong password, not the demo one).
   Secrets go in the host's or Cloudflare's dashboard and never into git. Only update `.env.example`
   files.
6. **Frontend build on Cloudflare Pages:** root `frontend`, command `npm ci && npm run build`,
   output `dist`, plus `VITE_CURRENCY` / `VITE_LOCALE` if needed. Add an SPA fallback so deep links
   like `/admin/login` work.

**How I want you to work:**
- Make a short plan first. Tell me which accounts and dashboard steps I have to do myself
  (Supabase project, Cloudflare login, backend host signup), and give me exact click-by-click or
  copy-paste steps for those.
- Make code/config changes on a new branch (e.g. `deploy/staging`). Don't touch `main` and don't
  push without asking.
- Don't break local development or the existing `docker-compose` / CI setup.
- When it's live, smoke-test it: open both login pages, log in as admin and as munshi, add one
  challan, open a PDF, check phone width. Then give me:
  - the link for the client,
  - the owner and munshi logins to share,
  - how to redeploy after I make changes,
  - what it costs (free-tier limits, sleep/cold starts).
- Explain things simply. I'm comfortable with the code but new to Supabase and Cloudflare.
