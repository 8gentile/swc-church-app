# Technical plan: DigitalOcean + Caddy production deployment

**Status:** Draft  
**Purpose:** Implementation plan for deploying the SWC Church App to a single DigitalOcean Droplet running Docker Compose with Caddy as the TLS-terminating reverse proxy.

- Product: [PRD](../prds/04-10-2026-digitalocean-caddy-deploy-prd.md)

No design doc required — this PRD has no UX surface.

---

## 1. Goals and success criteria

### 1.1 Deployment goals (from PRD)

- **Single-command deploy**: `docker compose up -d --build` brings the full stack online
- **Automatic HTTPS**: Caddy provisions and renews Let's Encrypt certificates
- **Production-hardened**: strong credentials, no exposed internal ports, SSH-key-only access
- **Automated backups**: nightly Postgres dumps with 14-day retention
- **~$15/month**: Droplet + backups, within a church budget

### 1.2 Engineering success (Definition of Done)

Ship when:

1. `https://app.stroudsburgwesleyan.org` serves the One.js app with valid TLS.
2. Zero sync client connects via WebSocket at `wss://sync.stroudsburgwesleyan.org` and syncs data.
3. The breeze sync worker runs and keeps Breeze data flowing into Postgres.
4. Postgres is not accessible from the internet — Docker network only.
5. A nightly `pg_dump` cron produces `.sql.gz` files and prunes older than 14 days.
6. `docker compose logs` shows healthy output from all services.
7. Restarting the Droplet brings everything back up automatically (`restart: unless-stopped`).

---

## 2. Current repository state (audit)

### 2.1 Docker infrastructure

| File | Status | Notes |
|------|--------|-------|
| `docker-compose.yml` | Exists | Dev-oriented: bind mounts source, exposes ports, weak credentials |
| `Dockerfile.dev` | Exists | Node 24 + Bun + build toolchain, entrypoint runs `bun install` |
| `Dockerfile` | Exists | Multi-stage, but expects pre-built `dist/`; references non-existent `packages/` dir; serves on port 8092 |
| `.dockerignore` | Exists | Excludes `.env*`, `node_modules`, test files — good for prod |
| `.env.docker` | Exists | Dev env vars for Compose `app` service |
| `.env.production.example` | Exists | Documents all production env vars — good template |
| `Caddyfile` | **Missing** | Needs to be created |
| `docker-compose.prod.yml` | **Missing** | Needs to be created |

### 2.2 Existing Dockerfile problems

The root `Dockerfile` has issues that must be fixed for production:

1. **`COPY packages ./packages`** — no `packages/` directory exists in the repo. Build fails.
2. **Requires pre-built `dist/`** — `RUN test -d dist || ... exit 1`. The build step should happen inside Docker for reproducibility.
3. **Port 8092** — dev Compose uses 8081. Need to standardize.
4. **No health check** — Caddy needs to know when the app is ready.

### 2.3 Zero sync URL routing

The client-side Zero URL logic in `src/constants/urls.ts`:

```typescript
// Release build path:
const hostname = process.env.VITE_ZERO_HOSTNAME
return hostname ? `https://${hostname}` : 'https://zero.tamagui.dev'
```

The client connects directly to the Zero server hostname. In production this means:
- `VITE_ZERO_HOSTNAME=sync.stroudsburgwesleyan.org` → client connects to `wss://sync.stroudsburgwesleyan.org`
- Caddy must proxy that subdomain to the `zero` container on port 4848
- Zero server calls back to the app at `ZERO_MUTATE_URL` / `ZERO_QUERY_URL` over the Docker internal network

### 2.4 Build system

| Command | What it does |
|---------|-------------|
| `bun run build` / `one build` | Builds the One.js app into `dist/` |
| `bun run migrate:build` | Compiles migration script to `src/database/migrate-dist.js` |
| `one serve` | Serves the built app from `dist/` |

The production image needs both `bun install` and `one build` to run inside Docker, then `one serve` at runtime.

---

## 3. Architecture decisions

### 3.1 Subdomain vs. path-based routing for Zero

**Decision: Use a subdomain** (`sync.stroudsburgwesleyan.org`)

Rationale:
- The Zero client in `urls.ts` already expects a standalone hostname via `VITE_ZERO_HOSTNAME`
- Path-based routing (`/zero/*`) would require Caddy `handle_path` stripping, and the Zero server may not expect to be served under a prefix — risk of broken WebSocket upgrade paths
- Two A records pointing to the same IP is trivial; Caddy handles multi-domain TLS automatically
- Cleaner separation of concerns: app traffic vs. sync traffic

### 3.2 Build inside Docker vs. pre-build

**Decision: Build inside Docker (multi-stage)**

Rationale:
- The existing `Dockerfile` requires `dist/` to exist before `docker build`, which couples the host environment to the build
- Multi-stage builds are reproducible: `bun install` → `one build` → slim runtime image
- No need to install bun/node on the Droplet host — Docker handles everything
- Trade-off: slower builds (~2-3 min), but acceptable for a manual deploy workflow

### 3.3 Compose override strategy

**Decision: `docker-compose.prod.yml` as an override file**

Use `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` to layer production overrides on top of the dev Compose file. This avoids duplicating the full Compose config and keeps dev and prod in sync.

The override file will:
- Replace the `app` service's `build.dockerfile` with `Dockerfile.prod`
- Remove bind mounts and port mappings from `app`, `zero`, and `pgdb`
- Add the `caddy` service
- Set `restart: unless-stopped` on all services
- Switch `env_file` to `.env.production`
- Override Postgres credentials

### 3.4 Port standardization

**Decision: Use port 8081 everywhere**

The dev Compose already uses 8081. The existing `Dockerfile` uses 8092 (from the Takeout template). Standardize on 8081 in the new `Dockerfile.prod` to avoid confusion. Caddy proxies to `app:8081` internally.

### 3.5 Postgres: Dockerized vs. managed

**Decision: Dockerized Postgres for v1**

Rationale:
- Managed DO Database costs $15/mo on top of the Droplet — doubles the budget
- The existing `pgvector/pgvector:pg16` image with WAL-level logical replication is already configured
- Daily `pg_dump` + DO weekly snapshots provide sufficient backup coverage for a church app
- Upgrade path: migrate to managed Postgres later if needed, by dumping and restoring

---

## 4. Manual prerequisites (your tasks)

These are things only you can do — account creation, API key collection, and DNS changes. Complete these **before or in parallel with** the code work in Phase 1–3.

### 4.1 DigitalOcean account

- [ ] Create a DigitalOcean account at [cloud.digitalocean.com](https://cloud.digitalocean.com) (or use existing)
- [ ] Add a payment method
- [ ] Upload your SSH public key to the DO dashboard (Settings → Security → SSH Keys)

### 4.2 Provision the Droplet

- [ ] Create a Droplet: Ubuntu 24.04 LTS, Basic $12/mo (2 vCPU / 2 GB / 50 GB SSD), NYC1 region, SSH key auth
- [ ] Enable weekly backups ($2.40/mo)
- [ ] Enable monitoring (free)
- [ ] Create a Cloud Firewall: inbound 22 (SSH), 80 (HTTP), 443 (HTTPS) only — apply to the Droplet
- [ ] Note the Droplet's public IPv4 address

### 4.3 Server setup

SSH into the Droplet and run the initial hardening:

```bash
ssh root@<droplet-ip>

# Create deploy user
adduser --disabled-password deploy
usermod -aG sudo deploy
cp -r ~/.ssh /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/.ssh

# Harden SSH — edit /etc/ssh/sshd_config:
#   PermitRootLogin no
#   PasswordAuthentication no
#   PubkeyAuthentication yes
systemctl restart sshd

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Install fail2ban
apt install -y fail2ban
systemctl enable fail2ban

# Enable unattended security upgrades
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 4.4 GitHub deploy key

```bash
# As deploy user on the Droplet
su - deploy
ssh-keygen -t ed25519 -C "swc-droplet-deploy" -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub
```

- [ ] Add the public key as a **deploy key** (read-only) on the GitHub repo: Settings → Deploy keys → Add

### 4.5 DNS records

Add two A records in the church's DNS provider (whoever manages `stroudsburgwesleyan.org`):

| Type | Name | Value |
|------|------|-------|
| A | `app` | `<droplet-ipv4>` |
| A | `sync` | `<droplet-ipv4>` |

Caddy will automatically obtain TLS certificates once DNS propagates (usually < 5 minutes).

### 4.6 Collect production secrets

You'll need these values to fill in `.env.production` on the Droplet:

| Secret | Where to get it |
|--------|-----------------|
| `BREEZE_API_KEY` | Breeze ChMS dashboard → Extensions → API |
| `BREEZE_SUBDOMAIN` | `stroudsburgwesleyan` (already known) |
| `YOUTUBE_API_KEY` | Google Cloud Console → Credentials (restrict to YouTube Data API v3) |
| `POSTMARK_SERVER_TOKEN` | Postmark dashboard → Server → API Tokens |
| `ENGAGE_GIVE_URL` | Already in `.env.production.example` |
| `WORDPRESS_ORIGIN` | Already in `.env.production.example` |

The remaining secrets (`POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `ZERO_ADMIN_PASSWORD`) are generated on the Droplet:

```bash
openssl rand -hex 32  # → POSTGRES_PASSWORD
openssl rand -hex 32  # → BETTER_AUTH_SECRET
openssl rand -hex 16  # → ZERO_ADMIN_PASSWORD
```

### 4.7 First deploy

Once the code from Phases 1–3 is merged and the above prerequisites are done:

```bash
# As deploy user on the Droplet
ssh deploy@<droplet-ip>

# Clone the repo
GIT_SSH_COMMAND="ssh -i ~/.ssh/deploy_key" \
  git clone git@github.com:<org>/swc-church-app.git /opt/swc-church-app
cd /opt/swc-church-app

# Create .env.production from the template
cp .env.production.example .env.production
# Edit with real values from §4.6 above
chmod 600 .env.production

# Start everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 5. Phased execution plan (code work)

### Phase 0: Fix native app → server URL wiring

**Goal:** Align all server URL references to use consistent env vars, remove Takeout fallbacks, and configure `eas.json` so EAS builds know where to connect.

**This phase blocks everything else** — without it, a production native app would try to call `takeout.tamagui.dev`.

#### 0a. Fix `src/constants/urls.ts`

Current release-build logic:

```typescript
// SERVER_URL — uses VITE_SERVER (undefined everywhere), falls back to takeout.tamagui.dev
url = process.env.VITE_SERVER || 'https://takeout.tamagui.dev'

// ZERO_SERVER_URL — uses VITE_ZERO_HOSTNAME, falls back to zero.tamagui.dev
return hostname ? `https://${hostname}` : 'https://zero.tamagui.dev'
```

Fix to:

```typescript
// SERVER_URL — use ONE_SERVER_URL (same var authFetch uses), fail loudly if missing
const serverUrl = process.env.ONE_SERVER_URL
if (!serverUrl) throw new Error('ONE_SERVER_URL is not set — cannot resolve server URL in release build')
url = serverUrl

// ZERO_SERVER_URL — keep VITE_ZERO_HOSTNAME, but fail loudly instead of falling back to Tamagui
const hostname = process.env.VITE_ZERO_HOSTNAME
if (!hostname) throw new Error('VITE_ZERO_HOSTNAME is not set — cannot resolve Zero sync URL in release build')
return `https://${hostname}`
```

This gives us:
- One env var for the server URL everywhere (`ONE_SERVER_URL`)
- Loud failures if env is misconfigured — no silent fallback to a third-party domain
- `authFetch.ts` already throws on missing `ONE_SERVER_URL`, so behavior is consistent

Also remove the `takeout.tamagui.dev` / `staging.takeout.tamagui.dev` special-cases in the web `location` branch — replace with generic origin-based logic (which the `SERVER_URL` branch already does).

#### 0b. Update `eas.json` with `env` blocks

Current `eas.json` has no `env` blocks at all. Add:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "preview",
        "ONE_SERVER_URL": "https://app.stroudsburgwesleyan.org",
        "VITE_ZERO_HOSTNAME": "sync.stroudsburgwesleyan.org"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_VARIANT": "production",
        "ONE_SERVER_URL": "https://app.stroudsburgwesleyan.org",
        "VITE_ZERO_HOSTNAME": "sync.stroudsburgwesleyan.org"
      }
    }
  }
}
```

Note: `development` profile does NOT set server URLs — it uses the local dev server via `getURL()`.

#### 0c. Set EAS secrets

Sensitive values that must not be in `eas.json` (they'd be committed to git):

```bash
eas secret:create --name BREEZE_API_KEY --value <value> --scope project
eas secret:create --name BREEZE_SUBDOMAIN --value stroudsburgwesleyan --scope project
eas secret:create --name YOUTUBE_API_KEY --value <value> --scope project
eas secret:create --name BETTER_AUTH_SECRET --value <value> --scope project
eas secret:create --name POSTMARK_SERVER_TOKEN --value <value> --scope project
```

Church config vars (not secret but needed at build time for `import.meta.env` / `envPrefix`):

```bash
eas secret:create --name CHURCH_DISPLAY_NAME --value "Stroudsburg Wesleyan Church" --scope project
eas secret:create --name ENGAGE_GIVE_URL --value "https://engage.suran.com/stroudsburg/s/give/gift/all-giving" --scope project
eas secret:create --name YOUTUBE_CHANNEL_ID --value "UCNHOf9LGimGtBWO8XLCqO6g" --scope project
eas secret:create --name WORDPRESS_ORIGIN --value "https://www.stroudsburgwesleyan.org" --scope project
eas secret:create --name WORDPRESS_ABOUT_PAGE_ID --value "2643" --scope project
```

#### 0d. Verify with a preview build

```bash
eas build --platform ios --profile preview
```

Check the build logs to confirm `ONE_SERVER_URL` and `VITE_ZERO_HOSTNAME` are set. Install the preview build and verify it connects to the production server (or a staging server if available).

**Exit criteria:** `urls.ts` no longer references `VITE_SERVER` or Takeout domains. `eas.json` has `env` blocks. A preview build connects to the correct server.

### Phase 1: Production Dockerfile (`Dockerfile.prod`)

**Goal:** A multi-stage Dockerfile that builds the One.js app and produces a slim runtime image.

```dockerfile
# Stage 1: Install production dependencies
FROM oven/bun:1.3.9 AS bun-base

FROM node:24-slim AS deps
COPY --from=bun-base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=bun-base /usr/local/bin/bunx /usr/local/bin/bunx
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
RUN bun rebuild oxc-parser 2>/dev/null || true

# Stage 2: Build the app
FROM deps AS build
COPY . .
RUN bun run build

# Stage 3: Slim runtime
FROM node:24-slim AS runtime
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=bun-base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=bun-base /usr/local/bin/bunx /usr/local/bin/bunx
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/src/database ./src/database
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8081/api/health || exit 1
EXPOSE 8081
ENV NODE_ENV=production
CMD ["bun", "one", "serve", "--port", "8081"]
```

Key notes:
- The `COPY . .` in the build stage uses `.dockerignore` to exclude `.env*`, `node_modules`, etc.
- `src/database/` is copied for the migration scripts (the `migrate` service runs separately but the app may need schema awareness)
- Health check hits `/api/health` — verify this endpoint exists or create it
- `--frozen-lockfile` ensures lockfile integrity

**Exit criteria:** `docker build -f Dockerfile.prod -t swc-app .` succeeds and `docker run -e ... swc-app` serves pages on port 8081.

### Phase 2: Caddyfile

**Goal:** Reverse proxy config with automatic TLS, security headers, and logging.

```caddyfile
app.stroudsburgwesleyan.org {
	encode gzip zstd

	reverse_proxy app:8081

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}

	log {
		output file /data/access.log {
			roll_size 10mb
			roll_keep 5
		}
	}
}

sync.stroudsburgwesleyan.org {
	reverse_proxy zero:4848

	log {
		output file /data/sync-access.log {
			roll_size 10mb
			roll_keep 5
		}
	}
}
```

Notes:
- Caddy handles WebSocket upgrade for the `sync` subdomain transparently — no extra config needed
- Security headers only on the app domain (Zero sync is API-only, headers would interfere with WebSocket)
- The `-Server` directive strips Caddy's server identification header

**Exit criteria:** Caddy starts, obtains certificates for both domains, and proxies requests correctly.

### Phase 3: Production Compose override (`docker-compose.prod.yml`)

**Goal:** Layer production settings on top of the dev Compose file.

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      app:
        condition: service_healthy
      zero:
        condition: service_started

  pgdb:
    ports: !override []
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

  migrate:
    environment:
      - RUN=1
      - ALLOW_MISSING_ENV=1
      - ZERO_UPSTREAM_DB=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgdb:5432/postgres
      - ZERO_CVR_DB=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgdb:5432/zero_cvr
      - ZERO_CHANGE_DB=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgdb:5432/zero_cdb

  zero:
    ports: !override []
    environment:
      ZERO_UPSTREAM_DB: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgdb:5432/postgres
      ZERO_CVR_DB: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgdb:5432/zero_cvr
      ZERO_CHANGE_DB: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgdb:5432/zero_cdb
      ZERO_MUTATE_URL: http://app:8081/api/zero/push
      ZERO_QUERY_URL: http://app:8081/api/zero/pull
      ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD}
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports: !override []
    env_file:
      - .env.production
    volumes: !override []
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

**Important Compose override behavior:**
- `ports: !override []` is not valid YAML — in practice, the override file will need to use the `ports: []` syntax or omit the field and rely on the Dockerfile's `EXPOSE` (which only documents, doesn't publish). The actual approach: **remove `ports` from the dev Compose for `pgdb` and `zero` into a `docker-compose.override.yml`** so they're only present in dev. See §3.3 alternative below.

**Alternative approach (cleaner):** Restructure as:
- `docker-compose.yml` — base services (no ports for pgdb/zero/app)
- `docker-compose.override.yml` — dev-only ports, volumes, build config (auto-loaded by `docker compose up`)
- `docker-compose.prod.yml` — production build, Caddy, restart policies

This way `docker compose up` in dev auto-includes the override, and `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` in prod skips it.

**Exit criteria:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` starts all services; Caddy proxies to app and zero; no internal ports exposed to host.

### Phase 4: Backup cron

**Goal:** Automated daily Postgres dumps with 14-day retention.

Create `/opt/swc-church-app/scripts/backup-pg.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/opt/backups/postgres"
RETENTION_DAYS=14
CONTAINER="swc-church-app-pgdb-1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Source credentials
set -a
source /opt/swc-church-app/.env.production
set +a

docker exec "$CONTAINER" \
  pg_dumpall -U "$POSTGRES_USER" | gzip > "$BACKUP_DIR/pg-$TIMESTAMP.sql.gz"

# Prune old backups
find "$BACKUP_DIR" -name "pg-*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[backup] $(date) — pg-$TIMESTAMP.sql.gz created, old backups pruned"
```

Install cron:

```bash
chmod +x /opt/swc-church-app/scripts/backup-pg.sh

# Run at 3 AM ET daily
echo "0 3 * * * deploy /opt/swc-church-app/scripts/backup-pg.sh >> /var/log/pg-backup.log 2>&1" \
  | sudo tee /etc/cron.d/pg-backup
```

**Exit criteria:** After 24 hours, `/opt/backups/postgres/` contains a `.sql.gz` file. After 15+ days, old files are pruned.

### Phase 5: Monitoring and alerts

**Goal:** Basic observability so you know when things break.

1. **DigitalOcean Alerts** (via dashboard):
   - CPU > 80% sustained 5 min → email
   - Disk > 85% → email
   - Memory > 90% → email

2. **Uptime check**: Add a DO uptime check on `https://app.stroudsburgwesleyan.org/api/health` — alerts if down for 2+ minutes.

3. **Log review**: SSH in periodically and check:
   ```bash
   cd /opt/swc-church-app
   docker compose logs --tail=100 app
   docker compose logs --tail=100 zero
   docker compose logs --tail=100 caddy
   ```

**Exit criteria:** Alerts configured; uptime check pinging successfully.

---

## 6. Configuration and secrets

### 6.1 Environment variable inventory

All variables from `.env.production.example`, plus Compose-level additions:

| Variable | Source | Runtime |
|----------|--------|---------|
| `POSTGRES_USER` | `.env.production` | pgdb, migrate, zero |
| `POSTGRES_PASSWORD` | `.env.production` | pgdb, migrate, zero |
| `BETTER_AUTH_SECRET` | `.env.production` | app |
| `BETTER_AUTH_URL` | `.env.production` | app |
| `ONE_SERVER_URL` | `.env.production` | app |
| `VITE_ZERO_HOSTNAME` | `.env.production` | app (build-time) |
| `VITE_WEB_HOSTNAME` | `.env.production` | app (build-time) |
| `ZERO_UPSTREAM_DB` | Compose override | zero, migrate |
| `ZERO_CVR_DB` | Compose override | zero, migrate |
| `ZERO_CHANGE_DB` | Compose override | zero, migrate |
| `ZERO_ADMIN_PASSWORD` | `.env.production` | zero |
| `BREEZE_API_KEY` | `.env.production` | app |
| `BREEZE_SUBDOMAIN` | `.env.production` | app |
| `YOUTUBE_API_KEY` | `.env.production` | app |
| `POSTMARK_SERVER_TOKEN` | `.env.production` | app |
| Church `ENGAGE_*`, `WORDPRESS_*`, `CHURCH_*` | `.env.production` | app |

### 6.2 `VITE_*` variables are build-time

Variables prefixed with `VITE_` are baked into the client bundle at build time (by Vite). This means:
- `VITE_ZERO_HOSTNAME` must be set **before** `docker build` runs `one build`
- Changing `VITE_ZERO_HOSTNAME` requires a rebuild, not just a restart
- The `Dockerfile.prod` build stage should receive these via `ARG` / `--build-arg`, or they should be set in `.env.production` which is available during `COPY . .` in the build stage

Since `.dockerignore` excludes `.env*`, we need to either:
1. Pass build-time vars as `--build-arg` and use `ARG` + `ENV` in the Dockerfile
2. Create a `.env.build` that is NOT excluded by `.dockerignore`
3. Inline the values in the Compose `build.args` section

**Decision: Use Compose `build.args`** — cleanest approach, keeps secrets in `.env.production` and passes only the build-time subset.

```yaml
# In docker-compose.prod.yml
app:
  build:
    args:
      VITE_ZERO_HOSTNAME: ${VITE_ZERO_HOSTNAME}
      VITE_WEB_HOSTNAME: ${VITE_WEB_HOSTNAME}
```

And in `Dockerfile.prod`:
```dockerfile
# In the build stage
ARG VITE_ZERO_HOSTNAME
ARG VITE_WEB_HOSTNAME
ENV VITE_ZERO_HOSTNAME=$VITE_ZERO_HOSTNAME
ENV VITE_WEB_HOSTNAME=$VITE_WEB_HOSTNAME
```

### 6.3 Secret generation

```bash
# Run these once when creating .env.production
openssl rand -hex 16  # → POSTGRES_USER (or pick a readable name)
openssl rand -hex 32  # → POSTGRES_PASSWORD
openssl rand -hex 32  # → BETTER_AUTH_SECRET
openssl rand -hex 16  # → ZERO_ADMIN_PASSWORD
```

---

## 7. Testing strategy

### 7.1 Local validation (before deploying)

1. **Build test**: `docker build -f Dockerfile.prod -t swc-app-test .` — must succeed
2. **Compose test**: Run the full prod stack locally with a test `.env.production`:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
   ```
   Caddy won't get real certs locally, but the app and Zero should start
3. **Health check**: `curl http://localhost:8081/api/health` returns 200

### 7.2 Post-deploy smoke tests

After DNS is live and Caddy has certificates:

1. `curl -I https://app.stroudsburgwesleyan.org` — returns 200, `strict-transport-security` header present
2. Open in browser — app loads, tabs work, sermons/events render
3. Open browser DevTools → Network → WS — WebSocket to `sync.stroudsburgwesleyan.org` connects
4. Check Zero admin: `curl -u admin:$ZERO_ADMIN_PASSWORD https://sync.stroudsburgwesleyan.org/` (if Zero exposes an admin endpoint)
5. Restart the Droplet: `sudo reboot` — after ~60s, all services should be back and the app accessible

### 7.3 Backup validation

After the first backup cron fires:

```bash
# Verify the backup exists and is valid
ls -la /opt/backups/postgres/
gunzip -t /opt/backups/postgres/pg-*.sql.gz  # integrity check
```

---

## 8. Risks, edge cases, and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 2 GB RAM insufficient for app + Zero + Postgres | OOM kills, service restarts | Monitor memory via DO dashboard; upgrade to $24/mo 4 GB Droplet if needed. Postgres `deploy.resources.limits.memory: 512M` prevents it from consuming all RAM. |
| `one build` fails inside Docker | Can't deploy | Test the Docker build locally first. Ensure all native deps (`oxc-parser`) rebuild for linux/amd64. |
| Let's Encrypt rate limits | Can't get certificates | Only hit if you request >5 certs for the same domain in a week. Unlikely. Use Caddy's staging CA for testing. |
| Droplet disk fills up | Services crash | 50 GB is generous. Prune Docker images periodically: `docker system prune -af --filter "until=168h"`. Backup retention is 14 days. DO disk alert at 85%. |
| DNS propagation delay | Caddy cert provisioning fails temporarily | Caddy retries automatically. No action needed — just wait. |
| Zero server memory leak over time | Gradual RAM increase → OOM | `restart: unless-stopped` recovers automatically. Monitor with DO metrics. Report to Rocicorp if persistent. |
| `VITE_*` not available at build time | Client connects to wrong Zero URL | Validated by Compose `build.args` + smoke test. Build will use fallback (`zero.tamagui.dev`) if not set — immediately obvious. |
| Host compromise via SSH | Full data access | SSH key-only + fail2ban + DO Cloud Firewall. Sufficient for church threat model. |

---

## 9. Resolved questions

1. **Health endpoint**: Does not exist yet — create `/api/health+api.ts` returning 200 (with optional Postgres connectivity check). Needed for Docker `HEALTHCHECK` and uptime monitoring.
2. **`packages/` reference**: Leftover from the Takeout template. No `packages/` directory exists — remove from the prod Dockerfile.
3. **Zero version pinning**: Pin to `0.26.2` in production. Bump intentionally when ready, not via floating tag.
4. **Offsite backups**: Start with local-only `pg_dump` + DO weekly snapshots. Add DO Spaces sync later if needed — data volume is tiny for a church of 400.
5. **`breezeSyncWorker`**: Runs inside the `app` process as a background function in the One.js server. No separate container needed.
6. **Git access on Droplet**: Private repo — add a deploy key (read-only SSH key) to the GitHub repo.

---

## 10. Future work (post-scope)

- **CI/CD pipeline**: GitHub Actions workflow that SSHs into the Droplet on push to `main` and runs the deploy command. Or build + push to GHCR and pull on the Droplet.
- **Offsite backups**: Sync `pg_dump` files to DO Spaces via `s3cmd` or `rclone`.
- **Structured logging**: Ship logs to Grafana Cloud free tier or Axiom for searchable, alertable logs.
- **Error tracking**: Sentry free tier for client + server exception monitoring.
- **Managed Postgres**: Migrate to DO Managed Database ($15/mo) if backup/failover requirements grow.
- **Docker image registry**: Push built images to GHCR so deploys are `docker pull` instead of `docker build` on the Droplet (faster deploys, less RAM spike during build).
- **Staging environment**: Second Droplet or branch-based preview deploys for testing before production.
- **Horizontal scaling**: If the church grows significantly, split Zero and the app onto separate Droplets behind a load balancer. Unlikely to be needed.

---

## Suggested PR sequence

| PR | Phase | Description |
|----|-------|-------------|
| **PR 1** | 0 | Fix `urls.ts` (remove Takeout fallbacks, use `ONE_SERVER_URL` consistently), update `eas.json` with `env` blocks. Small, focused, testable with a preview build. **Blocks all other PRs.** |
| **PR 2** | 1–3 | `Dockerfile.prod`, `Caddyfile`, `docker-compose.prod.yml`, health endpoint. Testable locally. |
| **PR 3** | 4–5 | `scripts/backup-pg.sh` and monitoring setup docs. Can land with or after PR 2. |

PR 1 is the **critical path** — without it, any production native build would connect to `takeout.tamagui.dev`. PR 2 produces the deployable server artifacts. Manual prerequisites (§4) are done by you in parallel with PR 1–2. PR 3 is post-deploy hardening.
