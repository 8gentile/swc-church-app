# Production Deployment — DigitalOcean + Caddy

**Version:** v1.0  
**Last Updated:** April 10, 2026  
**Author:** Nicholas Gentile  
**Status:** Draft  

---

## 1. Goal

Deploy the SWC Church App to a single DigitalOcean Droplet running Docker Compose with Caddy as the reverse proxy / TLS terminator. The result is a production environment that mirrors the existing dev setup (`docker-compose.yml`) with hardened credentials, automatic HTTPS, backups, and basic monitoring — all for ~$12–24/month.

---

## 2. Architecture Overview

```
Internet
  │
  ▼
┌──────────────────────────────────────────────┐
│  DigitalOcean Droplet  (Ubuntu 24.04 LTS)    │
│                                              │
│  ┌──────────┐      ┌───────────────────────┐ │
│  │  Caddy   │─443──▶  app  (One.js :8081)  │ │
│  │  :80/443 │      └───────────────────────┘ │
│  │          │─443──▶  zero (Zero :4848)      │ │
│  └──────────┘      ┌───────────────────────┐ │
│                    │  pgdb (Postgres :5432) │ │
│                    └───────────────────────┘ │
│                    ┌───────────────────────┐ │
│                    │  migrate (run-once)   │ │
│                    └───────────────────────┘ │
└──────────────────────────────────────────────┘
```

All services run inside Docker Compose on the same host. Caddy is the only container with ports exposed to the internet (80 + 443). Internal services communicate over the Docker bridge network.

---

## 3. Infrastructure

### 3.1 Droplet Spec

| Setting | Value |
|---------|-------|
| Image | Ubuntu 24.04 LTS |
| Plan | Basic, 2 vCPU / 2 GB RAM / 50 GB SSD ($12/mo) — upgrade to 4 GB ($24/mo) if Zero memory pressure is observed |
| Region | NYC1 (or closest to Stroudsburg, PA congregation) |
| Auth | SSH key only (no root password) |
| Backups | Enable DigitalOcean weekly snapshots ($2.40/mo) |
| Firewall | DigitalOcean Cloud Firewall: allow inbound 22 (SSH), 80, 443 only |
| Monitoring | Enable built-in DigitalOcean metrics (free) |

### 3.2 DNS

Point `app.stroudsburgwesleyan.org` (or chosen subdomain) A record to the Droplet's public IPv4. Caddy handles TLS certificate provisioning via Let's Encrypt automatically.

If Zero WebSocket needs its own subdomain (e.g. `sync.stroudsburgwesleyan.org`), add a second A record pointing to the same IP. Otherwise Caddy can route `/zero/` paths to the Zero container.

---

## 4. Docker Compose — Production

Create a `docker-compose.prod.yml` that extends the dev Compose with production overrides. Key differences from dev:

### 4.1 Caddy Service (new)

```yaml
caddy:
  image: caddy:2-alpine
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
    - "443:443/udp"   # HTTP/3
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile:ro
    - caddy_data:/data
    - caddy_config:/config
  depends_on:
    - app
    - zero
```

### 4.2 App Service (production overrides)

- Use a production `Dockerfile.prod` (multi-stage build, `bun run build` then `bun run start`)
- No source volume mount — baked image only
- No `app_node_modules` volume — deps installed at build time
- `restart: unless-stopped`
- `env_file: .env.production`
- Remove port mapping (Caddy handles ingress)

### 4.3 Postgres Service

- Strong credentials from `.env.production` (not `user/password`)
- No host port mapping (only accessible from Docker network)
- `restart: unless-stopped`
- Add resource limits: `deploy.resources.limits.memory: 512M`

### 4.4 Zero Service

- Production env vars (strong `ZERO_ADMIN_PASSWORD`, production DB URLs)
- No host port mapping
- `restart: unless-stopped`

### 4.5 Volumes

```yaml
volumes:
  pgdb_data:
  zero_data:
  caddy_data:
  caddy_config:
```

---

## 5. Caddyfile

```caddyfile
app.stroudsburgwesleyan.org {
    # One.js app (SSR + API routes + static assets)
    reverse_proxy app:8081

    # Zero WebSocket sync
    handle_path /zero/* {
        reverse_proxy zero:4848
    }

    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    log {
        output file /data/access.log {
            roll_size 10mb
            roll_keep 5
        }
    }
}
```

Caddy automatically obtains and renews Let's Encrypt certificates — no certbot, no cron.

---

## 6. Production Dockerfile

Create `Dockerfile.prod` — a multi-stage build:

```
Stage 1: "deps"    — FROM node:24-slim + bun, install production deps
Stage 2: "build"   — copy source, run `bun run build`
Stage 3: "runtime" — slim image, copy built output + node_modules, CMD start
```

Key differences from `Dockerfile.dev`:
- No volume mounts for source code
- Build-time compilation of native modules (no dev toolchain in runtime stage)
- Smaller final image (~200 MB vs ~800 MB dev)
- `NODE_ENV=production`

---

## 7. Environment & Secrets

### 7.1 `.env.production` (on server only, not in repo)

| Variable | Notes |
|----------|-------|
| `POSTGRES_USER` | Strong random username |
| `POSTGRES_PASSWORD` | 32+ char random password |
| `BETTER_AUTH_SECRET` | 64 char random secret |
| `BETTER_AUTH_URL` | `https://app.stroudsburgwesleyan.org` |
| `ONE_SERVER_URL` | `https://app.stroudsburgwesleyan.org` |
| `ZERO_UPSTREAM_DB` | `postgresql://<user>:<pass>@pgdb:5432/postgres` |
| `ZERO_CVR_DB` | `postgresql://<user>:<pass>@pgdb:5432/zero_cvr` |
| `ZERO_CHANGE_DB` | `postgresql://<user>:<pass>@pgdb:5432/zero_cdb` |
| `ZERO_ADMIN_PASSWORD` | Strong random password |
| `BREEZE_API_KEY` | Production Breeze API key |
| `BREEZE_SUBDOMAIN` | `stroudsburgwesleyan` |
| `VITE_ZERO_HOSTNAME` | `app.stroudsburgwesleyan.org` |
| `POSTMARK_SERVER_TOKEN` | Production Postmark token |

### 7.2 Secret Management

For v1, `.env.production` lives on the Droplet at `/opt/swc-church-app/.env.production` with `chmod 600`. Not in the git repo. If the team grows, migrate to DigitalOcean Vault or a secrets manager.

---

## 8. Deployment Workflow

### 8.1 Initial Setup (one-time)

1. Provision Droplet, SSH in, install Docker Engine + Docker Compose plugin
2. Clone repo to `/opt/swc-church-app`
3. Create `.env.production` with production secrets
4. Build and start:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
5. Verify HTTPS works, check logs

### 8.2 Subsequent Deploys

```bash
ssh deploy@<droplet-ip> "cd /opt/swc-church-app && \
  git pull origin main && \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app"
```

Only rebuilds the `app` service. Postgres, Zero, and Caddy keep running — zero downtime for the database layer.

### 8.3 Future: CI/CD (optional)

Add a GitHub Actions workflow that SSHs into the Droplet on push to `main` and runs the deploy command above. Or build the Docker image in CI, push to GitHub Container Registry, and pull on the Droplet. Not needed for v1.

---

## 9. Backups

### 9.1 Database Backups

Daily Postgres dump via cron on the host:

```bash
# /etc/cron.d/pg-backup
0 3 * * * root docker exec swc-church-app-pgdb-1 \
  pg_dump -U $POSTGRES_USER postgres | gzip > /opt/backups/pg-$(date +\%Y\%m\%d).sql.gz
```

Retain 14 days of daily dumps. Optionally sync to DigitalOcean Spaces (S3-compatible) for offsite backup (~$5/mo for 250 GB).

### 9.2 Droplet Snapshots

DigitalOcean weekly snapshots ($2.40/mo) provide full-disk recovery.

---

## 10. Monitoring & Alerting

### 10.1 Built-in (free)

- DigitalOcean Monitoring: CPU, memory, disk, bandwidth graphs
- DigitalOcean Alerts: email when CPU > 80% for 5 min, disk > 85%

### 10.2 Application-level (v1 — log-based)

- Caddy access logs (rolled, see Caddyfile)
- `docker compose logs -f app` for application errors
- `[breeze-sync]` log lines already provide sync health visibility

### 10.3 Future (v2)

- Uptime check: DigitalOcean uptime monitoring (free, pings HTTPS endpoint)
- Error tracking: Sentry free tier
- Structured logging: ship to Grafana Cloud free tier or Axiom

---

## 11. Security Checklist

| Item | How |
|------|-----|
| SSH hardening | Key-only auth, disable root login, fail2ban |
| Firewall | DO Cloud Firewall: 22, 80, 443 only |
| TLS | Caddy auto-HTTPS (Let's Encrypt, OCSP stapling) |
| Postgres | No host port, strong credentials, Docker network only |
| Zero admin | Strong `ZERO_ADMIN_PASSWORD`, not exposed externally |
| Secrets | `.env.production` chmod 600, not in git |
| Updates | `unattended-upgrades` for OS security patches |
| Docker | Pin image tags in production Compose (e.g. `node:24.1-slim`, `caddy:2.9-alpine`) |

---

## 12. Cost Summary

| Item | Monthly |
|------|---------|
| Droplet (2 vCPU / 2 GB) | $12.00 |
| DigitalOcean Backups | $2.40 |
| Domain (amortized) | ~$1.00 |
| **Total** | **~$15.40** |

Upgrade path: if load grows, move to 4 GB Droplet ($24/mo) or split Postgres to a managed DigitalOcean Database ($15/mo) for automatic backups and failover.

---

## 13. Tickets

### Ticket 1: Production Dockerfile
Create `Dockerfile.prod` with multi-stage build (deps → build → runtime). Verify the built image starts and serves pages.

### Ticket 2: Production Compose overrides
Create `docker-compose.prod.yml` with Caddy service, production env refs, restart policies, and no exposed ports for internal services.

### Ticket 3: Caddyfile + TLS
Write `Caddyfile` with reverse proxy rules, security headers, and logging. Test locally with `caddy run` before deploying.

### Ticket 4: Droplet provisioning
Provision Droplet, install Docker, configure firewall, clone repo, create `.env.production`, run first deploy.

### Ticket 5: Backup cron
Set up daily `pg_dump` cron + 14-day retention. Optionally configure Spaces sync for offsite.

### Ticket 6: Monitoring & alerts
Enable DO monitoring, set CPU/disk alerts, add uptime check on the HTTPS endpoint.

---

## 14. Open Questions

1. **Domain**: Use `app.stroudsburgwesleyan.org` or a different subdomain? Who controls DNS?
2. **Zero subdomain**: Route WebSocket through path-based proxy (`/zero/*`) or separate subdomain (`sync.stroudsburgwesleyan.org`)?
3. **CI/CD**: Automate deploys from `main` in v1, or keep manual SSH-based deploys?
4. **Managed DB**: Start with Dockerized Postgres or pay for DigitalOcean Managed Database ($15/mo) for automatic backups/failover?
