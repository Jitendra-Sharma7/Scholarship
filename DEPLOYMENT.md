# Deployment Runbook — Global Scholarship Hub

Everything needed to take this project from a local checkout to a running, verifiable
production deployment, plus the routine operating commands afterwards.

Read section 0 before running anything: several project-specific constraints make
standard Next.js deploy advice wrong for this codebase.

---

## 0. Project facts that change how you deploy

These were verified against the current source. Each one breaks a common default.

| Fact | Consequence |
| --- | --- |
| `prisma/migrations/` does **not** exist. `prisma migrate dev` fails with `P3014` (shadow database permissions) and `prisma migrate deploy` has no migrations to apply. | Schema changes ship via `prisma db push`. There is no migration history to replay. |
| `src/app/sitemap.ts` and `src/app/robots.ts` read `NEXT_PUBLIC_SITE_URL` at runtime; `src/app/layout.tsx:27` reads it at **build** time for `metadataBase`. | The var must be correct at build time *and* present at runtime, or canonical/OG URLs and the sitemap emit the wrong origin. |
| `/api/public/*` (`src/lib/api-gate.ts`) allows only loopback callers unless `PUBLIC_API_KEY` is set. | Without `PUBLIC_API_KEY`, every external API consumer and the verification scripts get `404`. |
| `verify:auth`, `verify:crud`, `verify:forms` **delete the rows they create**, but only protects the admin seeded with `drdo.india2021@gmail.com`. | Never point `npm run verify` at production. Staging only. |
| `npm run seed` is idempotent but **resets `publishStatus` to the legacy value and sets `url: null` on seeded country records.** | Do not re-seed a live database. Seed empty databases only. |
| Rate limiting (`src/lib/rate-limit.ts`) is in-process memory. | One replica only until a shared store is added. Do not scale horizontally. |
| `src` contains **no filesystem writes** — the media admin feature stores metadata only. | No persistent volume is required for uploads. Nothing writes to disk. |
| Verification scripts read `process.env.BASE`, except `verify:links.mjs` which reads `BASE_URL`. | Set **both** when verifying a remote deployment. |
| `next.config.ts` sets no `output`, so the app runs with a full `node_modules` and `next start`. | The Dockerfile below follows suit; do not add `output: "standalone"` without re-copying the Prisma engines. |
| Local toolchain is Node `v24.19.0`, npm `11.17.0`. `@types/node` is `^20`. | Node 20 or newer is fine; 22 LTS recommended. |

---

## 1. Architecture

```
                    ┌───────────────────────────┐
   Cloudflare  ───► │  nginx  :443 / :80         │
   (DNS + proxy)     │  TLS, gzip/brotli, cache  │
                    └─────────────┬─────────────┘
                                  │  proxy to 127.0.0.1:3000
                    ┌─────────────▼─────────────┐
                    │  Next.js 16 (node)        │
                    │  systemd / Docker         │
                    └─────────────┬─────────────┘
                                  │  5432
                    ┌─────────────▼─────────────┐
                    │  PostgreSQL 16            │
                    │  local socket or 127.0.0.1 │
                    └───────────────────────────┘
```

Single app replica. A CDN in front is optional but recommended, because static
pages are served with `s-maxage=31536000` and `/scholarships` is `no-store`.

---

**Keep production on 3000.** The container port, the nginx upstream and the
compose mapping below all use 3000 because nothing outside the host reaches it.
Only a local checkout moves its port, and it does so through `PORT` in `.env`.

## 2. Prerequisites

On the host (Ubuntu 24.04 example):

```bash
# system packages
sudo apt-get update && sudo apt-get install -y git curl nginx rsync postgresql-16

# Node 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install 22 && nvm alias default 22
node -v    # v22.x

# PostgreSQL
sudo systemctl enable --now postgresql
sudo -u postgres createuser gsh
sudo -u postgres psql -c "CREATE DATABASE global_scholarships OWNER gsh;"
sudo -u postgres psql -c "CREATE DATABASE global_scholarships_staging OWNER gsh;"
sudo -u postgres psql -c "ALTER USER gsh WITH PASSWORD 'use-a-real-password';"
```

Accounts and domains you need before starting:

- A domain with an `A` record to the host IP.
- A deploy key or personal access token for the Git host you will push the repository to.
- A SendGrid / Postmark / SES account for SMTP (contact form and password reset).
- Google and/or Apple OAuth client credentials. Without them the buttons fail honestly; the app does not fake a login.
- A Telegram bot token if you enable deadline alerts in admin settings (optional).

---

## 3. Environment variables

### 3.1 Which are secrets

**Never** place any of these in `NEXT_PUBLIC_*`. The build inlines `NEXT_PUBLIC_*` into
the client bundle, and `npm run verify:bundle` will fail the build if one appears there.

| Variable | Secret | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `postgresql://gsh:PASSWORD@127.0.0.1:5432/global_scholarships` |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32`. Must be identical on every replica or sessions break. |
| `PUBLIC_API_KEY` | yes | Gates `/api/public/*` for non-loopback callers. Required in production. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | password is yes | If unset, the app runs with email delivery disabled and says so. |
| `EMAIL_FROM` | no | Must be a sender on the SMTP account. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | secret is yes | Optional. |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | yes | Optional. `APPLE_PRIVATE_KEY` is PEM with `\n` escapes. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | yes | Optional, admin alerts. |
| `NEXTAUTH_URL` / `APP_URL` | no | The public origin. Keep equal to `NEXT_PUBLIC_SITE_URL`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` / `ADMIN_ROLE` | password is yes | First deploy only, to let the seed create a staff account. Remove `ADMIN_PASSWORD` afterwards. |
| `NEXT_PUBLIC_SITE_URL` | no, **but build-time** | `https://globalscholarshiphub.com`. No trailing slash. |

**Do not put `NODE_ENV` in `.env`.** Next.js sets it itself — `development` for
`next dev`, `production` for `next build` and `next start` — and reads `.env` for every
other command too. A `NODE_ENV=development` line in `.env` therefore reaches
`next build`, which then prerenders with the development React runtime and fails with
`TypeError: Cannot read properties of null (reading 'useContext')` on the first static
page it reaches. This is not hypothetical: it is what this project's local `.env` did.
Set it in the runtime environment instead. The Dockerfile, the compose file and the
systemd unit below all set it correctly, because those are read after the build.

There are exactly two intentional public variables: `NEXT_PUBLIC_SITE_URL` and
`NEXT_PUBLIC_APP_NAME`. Everything else stays server-side.

### 3.2 Generate the secrets

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 32      # PUBLIC_API_KEY
```

### 3.3 Local `.env` for a new environment

```bash
cp .env.example .env
```

```dotenv
DATABASE_URL="postgresql://gsh:PASSWORD@127.0.0.1:5432/global_scholarships"
NEXTAUTH_SECRET="<paste openssl rand -base64 32 output>"
NEXTAUTH_URL="http://localhost:2055"
APP_URL="http://localhost:2055"
NEXT_PUBLIC_SITE_URL="http://localhost:2055"
PORT="2055"
# No NODE_ENV here. See section 3.1.

PUBLIC_API_KEY="<paste openssl rand -hex 32 output>"

SMTP_ENABLED="true"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="Global Scholarship Hub <no-reply@globalscholarshiphub.com>"
EMAIL_FROM="no-reply@globalscholarshiphub.com"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_TEAM_ID=""
APPLE_KEY_ID=""
APPLE_PRIVATE_KEY=""

TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
```

`.env` is gitignored (only `.env.example` is tracked), so a deployment reads env
from the host, not from the repo.

The local development database is named `scholaratlas` — a leftover of the old brand
that is still a valid database name and does not need renaming. The deployment
databases in this runbook are named `global_scholarships`. If you point a new
environment at the local one, the name is not what matters; the credentials and the
schema are.

---

## 4. Option A — Docker Compose on a VPS (recommended)

Most reproducible, and the only option where CI and production run the same image.

### 4.1 `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- dependencies (cached independently of source) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
# NEXT_PUBLIC_SITE_URL is inlined into the client bundle, so it must be a build arg.
FROM base AS builder
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate \
 && npm run build \
 && npm run verify:bundle

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs appuser
COPY --from=deps  --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/.next ./.next
COPY --from=builder --chown=appuser:nodejs /app/public ./public
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/next.config.ts ./next.config.ts
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
```

Notes on the choices:

- `node_modules` is copied from the full `deps` stage, not `standalone`. `next.config.ts`
  sets no `output: "standalone"`, so the runtime genuinely needs the full tree.
- `npx prisma generate` runs before `npm run build`; the build queries the database.
- `verify:bundle` runs in the builder stage so a client-bundle secret fails CI, not production.
- The healthcheck hits `/robots.txt`, which is a static prerender and does not touch the database.

### 4.2 `.dockerignore`

```
node_modules
.next
.git
.env
.env.*
!.env.example
*.log
verify-*.json
Global Scholarships
tsconfig.tsbuildinfo
```

The stray empty `Global Scholarships/` directory in the repo root is ignored rather
than deleting it, since you may have meant to remove it locally.

### 4.3 `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-gsh}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-global_scholarships}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-gsh} -d ${POSTGRES_DB:-global_scholarships}"]
      interval: 10s
      timeout: 5s
      retries: 10
    # Not published to the host: only the app needs it.

  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:?set NEXT_PUBLIC_SITE_URL}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-gsh}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-global_scholarships}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?set NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXT_PUBLIC_SITE_URL}
      APP_URL: ${NEXT_PUBLIC_SITE_URL}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
      PUBLIC_API_KEY: ${PUBLIC_API_KEY:?set PUBLIC_API_KEY}
      SMTP_ENABLED: ${SMTP_ENABLED:-false}
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-}
      EMAIL_FROM: ${EMAIL_FROM:-}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
      APPLE_CLIENT_ID: ${APPLE_CLIENT_ID:-}
      APPLE_TEAM_ID: ${APPLE_TEAM_ID:-}
      APPLE_KEY_ID: ${APPLE_KEY_ID:-}
      APPLE_PRIVATE_KEY: ${APPLE_PRIVATE_KEY:-}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:-}
      TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID:-}
      # Passed through so `docker compose run --rm web npm run db:seed` can create
      # the first admin. Clear ADMIN_PASSWORD from the server .env after that run:
      # while it is set, any re-seed would reset that account's password.
      ADMIN_EMAIL: ${ADMIN_EMAIL:-}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-}
      ADMIN_NAME: ${ADMIN_NAME:-}
      ADMIN_ROLE: ${ADMIN_ROLE:-}
    ports:
      - "127.0.0.1:3000:3000"

volumes:
  pgdata:
```

`127.0.0.1:3000` is deliberate. The port is not public; only nginx reaches it.

### 4.4 Host env file (`.env` on the server, not in git)

```bash
mkdir -p /opt/global-scholarship-hub && cd /opt/global-scholarship-hub
git clone <your-repo-url> .
chmod 600 .env    # created below
```

```dotenv
POSTGRES_USER=gsh
POSTGRES_PASSWORD=<strong db password>
POSTGRES_DB=global_scholarships
NEXT_PUBLIC_SITE_URL=https://globalscholarshiphub.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
PUBLIC_API_KEY=<openssl rand -hex 32>
SMTP_ENABLED=true
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=no-reply@globalscholarshiphub.com
```

### 4.5 First deploy

```bash
# 1. build
docker compose build

# 2. database only first, so schema push has a target
docker compose up -d db
docker compose ps            # wait for "healthy"

# 3. schema
docker compose run --rm web npx prisma db push --skip-generate

# 4. seed ONLY on a brand-new, empty database (see section 7)
docker compose run --rm web npm run db:seed

# 5. optional: import the scholarship dataset
docker compose run --rm web npm run import:scholarships

# 6. start
docker compose up -d web
docker compose ps
docker compose logs -f web
```

On **schema-changing** releases the sequence is different, and destructive changes need
an explicit acknowledgement:

```bash
cp .env.backup-$(date +%F) .env          # env may have gained/lost vars
docker compose run --rm web npm run db:backup
docker compose build
docker compose up -d web                   # old container keeps serving
docker compose exec web npx prisma db push --skip-generate
docker compose exec web npm run db:smoke
docker compose restart web
```

`--accept-data-loss` is **not** part of the normal run. `prisma db push` prompts for it
only when it must drop or rewrite a column; add it only for a change you have already
verified against a copy of production data.

### 4.6 nginx

```bash
sudo cp /opt/global-scholarship-hub/deploy/nginx.conf /etc/nginx/sites-available/global-scholarship-hub
sudo ln -sf /etc/nginx/sites-available/global-scholarship-hub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4.7 TLS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d globalscholarshiphub.com -d www.globalscholarshiphub.com
sudo systemctl enable --now certbot.timer
```

Then confirm the redirect loop and canonical host in the app output:

```bash
curl -sSI https://globalscholarshiphub.com | Select-Object -First 10
```

After changing a real domain, update OAuth callback URLs:
`https://globalscholarshiphub.com/auth/callback/google` and `/auth/callback/apple`.

---

## 5. Option B — Vercel + managed Postgres

Works without touching a server, but you cannot run `prisma db push` or `verify:bundle`
locally against the deployed build, so run the full suite against the preview URL first.

```bash
npm i -g vercel
vercel login
vercel link                                   # creates .vercel/ (gitignored)
vercel env add production DATABASE_URL
vercel env add production NEXTAUTH_SECRET
vercel env add production PUBLIC_API_KEY
vercel env add production NEXTAUTH_URL
vercel env add production APP_URL
vercel env add production NEXT_PUBLIC_SITE_URL
vercel env add production SMTP_HOST
vercel env add production SMTP_PORT
vercel env add production SMTP_USER
vercel env add production SMTP_PASSWORD
vercel env add production EMAIL_FROM
vercel env add production GOOGLE_CLIENT_ID
vercel env add production GOOGLE_CLIENT_SECRET
vercel --prod                                   # triggers the build
```

Vercel auto-detects Prisma. Because the app is stateful (sessions, rate limits) and
`prisma/migrations` does not exist, add a `vercel.json` and an external schema job:

```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

Then, from a machine that can reach the database, once per schema change:

```bash
npx prisma db push --skip-generate
```

Vercel specifics to know:

- The deploy is on `*.vercel.app`; the custom domain must be attached and
  `NEXT_PUBLIC_SITE_URL` must equal it, because `layout.tsx` bakes it in at build.
- Serverless functions are separate instances, so the in-process rate limiter is
  per-instance. Acceptable for public abuse defence, not a security boundary.
- Long-running imports (`import:scholarships`) should run from a laptop, not a build.

---

## 6. Option C — plain Node + systemd

Use this if you want no container runtime.

```bash
sudo useradd --system --home /opt/global-scholarship-hub --shell /usr/sbin/nologin gsh
sudo -u gsh git clone <your-repo-url> /opt/global-scholarship-hub
cd /opt/global-scholarship-hub
sudo -u gsh cp .env.example .env
sudo -u gsh npm ci
sudo -u gsh npx prisma generate
sudo -u gsh npm run build
sudo -u gsh npm run verify:bundle
```

`deploy/global-scholarship-hub.service`:

```ini
[Unit]
Description=Global Scholarship Hub
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=gsh
WorkingDirectory=/opt/global-scholarship-hub
EnvironmentFile=/opt/global-scholarship-hub/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/global-scholarship-hub/.next

[Install]
WantedBy=multi-user.target
```

```bash
sudo cp deploy/global-scholarship-hub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now global-scholarship-hub
sudo systemctl status global-scholarship-hub
sudo journalctl -u global-scholarship-hub -f
```

---

## 7. Data loading rules

| Command | Safe on production? | Why |
| --- | --- | --- |
| `npm run db:push` | Yes | Applies the Prisma schema. The only supported schema path here. |
| `npm run db:seed` | **No** | Idempotent, but resets `publishStatus` and nulls seeded country `url`s. Empty databases only. |
| `npm run import:scholarships` | Only with care | Upserts by URL. Unresolved links are reported. Run once, review the report, then re-seed nothing. |
| `npm run verify` | **No** | Creates and deletes real rows, and POSTs to the public API. Staging only. |
| `npm run clean:test-records` | Yes | Removes only the verification rows it recognises, preserving `drdo.india2021@gmail.com`. |

Sanity check after any data change:

```bash
npm run db:smoke
```

`db:smoke` is read-only. It reports row counts, confirms every published application
URL parses, and confirms an account can reach `/admin`. It exits non-zero on any failed
check, so it is safe to use as a gate.

`db:backup` writes `./backups/gsh-<timestamp>.dump` with `pg_dump --format=custom` and
keeps the newest 14. It needs `pg_dump` on `PATH`; without it the script fails and
prints the `docker compose exec` equivalent rather than pretending to have backed
anything up. `backups/` is gitignored.

### First admin account

`/auth/register` creates a `USER`, and the seed only creates a staff account when
`ADMIN_EMAIL` and `ADMIN_PASSWORD` are both set — otherwise it prints
`admin: skipped` and moves on. So a fresh database has no way into `/admin` until you
supply them for the seed step.

For the first deploy only, add to the server `.env`:

```dotenv
ADMIN_EMAIL="admin@globalscholarshiphub.com"
ADMIN_PASSWORD="<a strong unique password>"
ADMIN_NAME="Site Administrator"
ADMIN_ROLE="SUPER_ADMIN"
```

```bash
docker compose run --rm web npm run db:seed
```

Then **remove `ADMIN_PASSWORD` from the server `.env`** and confirm sign-in before
exposing the site:

```bash
npm run db:smoke    # "an account can reach /admin" must pass
```

`db:smoke` fails on that check while no admin exists, which is the intended signal
rather than a locked-out site. If you skipped the seed entirely, create the account
with Prisma Studio (`npx prisma studio` → User → role `SUPER_ADMIN`) and hash the
password with the library the app uses:

```bash
node -e "const b=require('bcryptjs');b.hash(process.argv[1],12).then(h=>console.log(h))" 'a-strong-password'
```

---

## 8. Post-deploy verification

Run from a machine that can reach the public origin. Set **both** variables, because
`verify:links` reads `BASE_URL` while every other script reads `BASE`.

```powershell
$env:BASE       = "https://globalscholarshiphub.com"
$env:BASE_URL   = "https://globalscholarshiphub.com"
$env:PUBLIC_API_KEY = "<the production key>"

npm run verify:public
npm run verify:forms
npm run verify:links
npm run verify:mobile
npm run verify:content
npm run verify:oauth      # only with real OAuth credentials configured
```

`verify:auth` and `verify:crud` mutate production data. Run them against a **staging**
deployment of the same build:

```powershell
$env:BASE = "https://staging.globalscholarshiphub.com"
npm run verify:auth
npm run verify:crud
```

Local-only checks, run in CI rather than against a deployment:

```bash
npm run verify:bundle     # requires .next from a build; asserts no secret reached the client
npm run verify:speed      # must run against a local server, not a CDN
```

Manual smoke test after each deploy:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://globalscholarshiphub.com/
curl -sS https://globalscholarshiphub.com/robots.txt
curl -sS https://globalscholarshiphub.com/sitemap.xml | head -5
curl -sS https://globalscholarshiphub.com/api/public/health
```

The last call must return JSON, not `404`. A `404` means `PUBLIC_API_KEY` is missing
or mismatched on the running container.

Check the canonical origin made it into the build:

```bash
curl -sS https://globalscholarshiphub.com/ | grep -o '<link rel="canonical"[^>]*>'
```

If it shows `localhost` or the wrong domain, the build was made without
`NEXT_PUBLIC_SITE_URL`; rebuild with the build arg set.

Check that a detail page's canonical agrees with the sitemap, since the two are what a
crawler uses together:

```bash
URL=$(curl -sS https://globalscholarshiphub.com/sitemap.xml | grep -o 'https://[^<]*/scholarships/[^<]*' | head -1)
echo "sitemap: $URL"
curl -sS "$URL" | grep -o '<link rel="canonical"[^>]*>'
```

The canonical must be the same address as the sitemap entry. The slug is the published
address: the cuid form still resolves, and `permanentRedirect` sends it to the slug, so
the two forms can never be indexed as separate pages.

---

## 9. Continuous integration

There is no `.github/` directory yet. Add one so `verify:bundle` and the build gate
every push. The workflow below assumes Docker (Option A) and runs a local
Postgres for the build.

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgres:16
        env:
          POSTGRES_USER: gsh
          POSTGRES_PASSWORD: gsh
          POSTGRES_DB: gsh_ci
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U gsh"
          --health-interval 10s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://gsh:gsh@localhost:5432/gsh_ci
      NEXTAUTH_SECRET: ci-secret-ci-secret-ci-secret-32
      NEXTAUTH_URL: http://localhost:2055
      APP_URL: http://localhost:2055
      NEXT_PUBLIC_SITE_URL: http://localhost:2055
      PORT: "2055"
      PUBLIC_API_KEY: ci-key
      # The functional suite signs in as an admin, so the seed must create one.
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: ci-password
      ADMIN_NAME: Site Administrator
      ADMIN_ROLE: SUPER_ADMIN
      # No NODE_ENV: setting it here would reach `npm run build` and break
      # prerendering exactly as a NODE_ENV line in .env would.
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma db push --skip-generate
      - run: npm run db:seed
      - run: npx prisma generate
      - run: npm run build
      - run: npm run verify:bundle
      - run: npm run lint
      - run: npm run typecheck
      - name: functional suite
        run: |
          npm run start &
          for i in $(seq 1 60); do
            curl -sf http://localhost:2055/robots.txt >/dev/null && break
            sleep 1
          done
          npm run verify
      - name: shutdown
        if: always()
        run: pkill -f "next start" || true
```

Deploy on merge to `main`, with the previous image as the rollback target:

```yaml
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: |
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh -o StrictHostKeyChecking=accept-new root@${{ secrets.DEPLOY_HOST }} <<'REMOTE'
            set -euo pipefail
            cd /opt/global-scholarship-hub
            git pull --ff-only
            docker compose build
            docker compose up -d db
            docker compose run --rm web npx prisma db push --skip-generate
            docker compose up -d web
            docker image prune -f
          REMOTE
```

Secrets to add under **Settings → Secrets**: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`.

---

## 10. Routine operations

```bash
# deploy an update
git pull --ff-only && docker compose build && docker compose up -d web

# schema change (backup first, never --accept-data-loss by default)
npm run db:backup
docker compose exec web npx prisma db push --skip-generate
docker compose restart web

# logs
docker compose logs -f --tail=200 web
sudo journalctl -u global-scholarship-hub -f      # systemd option

# rollback
docker compose logs --tail=200 web > /tmp/web-failed.log
git checkout <last-good-sha>
docker compose build && docker compose up -d web
# if the schema changed too, restore the dump from the backup taken before it

# restart / stop
docker compose restart web
docker compose down          # keeps pgdata
docker compose down -v       # DESTROYS the database
```

### Backups

```bash
# on the host
docker compose exec -T db pg_dump -U gsh -Fc global_scholarships > backups/gs-$(date +%F).dump

# nightly, keep 14 days
0 3 * * * cd /opt/global-scholarship-hub && docker compose exec -T db pg_dump -U gsh -Fc global_scholarships > backups/gs-$(date +\%F).dump && find backups -name 'gs-*.dump' -mtime +14 -delete

# restore (destructive; stop the app first)
docker compose stop web
docker compose exec -T db pg_restore -U gsh -d global_scholarships --clean --if-exists < backups/gs-YYYY-MM-DD.dump
docker compose up -d web
```

Restoring needs the app stopped: the app and the restore would otherwise write
concurrently. Back up before every `prisma db push`; a restore is the only rollback
for a destructive schema change.

---

## 11. Production checklist

**Before the first deploy**

- [ ] `NEXT_PUBLIC_SITE_URL` set at build time, no trailing slash
- [ ] `NEXTAUTH_SECRET` is 32+ random bytes, identical across replicas
- [ ] `PUBLIC_API_KEY` set, and `/api/public/health` returns JSON externally
- [ ] `DATABASE_URL` points at the production database, not staging
- [ ] PostgreSQL bound to localhost only; port 5432 not in a firewall rule
- [ ] TLS installed, HTTP redirects to HTTPS, `certbot.timer` enabled
- [ ] `.env` is `chmod 600`, owned by the app user, and not in git
- [ ] `npm run verify:bundle` passes on the exact image being deployed
- [ ] `npm run db:smoke` passes, including "an account can reach /admin"
- [ ] An admin account exists. `/auth/register` never grants staff access, so seed the
      first admin explicitly (see section 7) or promote one with Prisma Studio.
- [ ] `/robots.txt` and `/sitemap.xml` show the real domain
- [ ] Canonical link in the homepage HTML shows the real domain
- [ ] OAuth redirect URIs updated to the real domain (or buttons left disabled)
- [ ] SMTP tested end to end via the contact form
- [ ] Backups scheduled and one restore rehearsed
- [ ] Single replica confirmed (in-process rate limiter)

**After every deploy**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://globalscholarshiphub.com/          # 200
curl -sS https://globalscholarshiphub.com/api/public/health                          # JSON
npm run db:smoke
```

**Deliberately absent**

- Phone/SMS OTP is not implemented. Do not enable or advertise it.
- Media records are metadata only; no file is stored anywhere.
- Scholarship verification state is not real. Do not label a scholarship "verified"
  until a verification workflow actually exists.
- `npm run verify` is destructive. Keep it on staging.
