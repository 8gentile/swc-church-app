# SWC Church App

Mobile app for **Stroudsburg Wesleyan Church** — sermons, events, giving, and church info in one place. Built on [Tamagui Takeout Free](https://tamagui.dev/takeout).

Product requirements, design, and implementation plans live in [`thoughts/`](thoughts/).

## Stack

- [One](https://onestack.dev) — Universal React framework (file-based routing)
- [Tamagui](https://tamagui.dev) — Cross-platform UI kit
- [React Native](https://reactnative.dev) — iOS + Android + web
- [Better Auth](https://www.better-auth.com) — Authentication
- [Zero](https://zero.rocicorp.dev) — Real-time sync (local-first)
- [Drizzle ORM](https://orm.drizzle.team) — Database schema + migrations
- [Breeze ChMS](https://www.breezechms.com/) — Church management (events, attendance)

## Prerequisites

- **Docker** — [Install Docker](https://docs.docker.com/get-docker/) (on macOS, [OrbStack](https://orbstack.dev) recommended). Required for full-stack dev.
- **Node.js 24.3.0** — Use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm): `fnm install` / `nvm install` (reads `.nvmrc`).
- **Bun** — [Install Bun](https://bun.sh)
- **iOS** (optional): macOS with Xcode 16+
- **Android** (optional): Android Studio with JDK 17+

## Quick Start

### Docker (recommended — full stack)

```bash
cp .env.production.example .env
# Edit .env: fill in BREEZE_API_KEY, YOUTUBE_API_KEY, etc.

bash scripts/docker-dev.sh
# → Postgres, Zero, app server all start
# → http://localhost:8081
```

| Service | Port | Description |
|---------|------|-------------|
| `pgdb` | 5533 | PostgreSQL 16 (WAL for Zero replication) |
| `migrate` | — | Runs schema migrations then exits |
| `zero` | 4948 | Zero Sync server |
| `app` | **8081** | One.js dev server + Breeze sync worker |

### Without Docker (web-only, no backend)

```bash
bun install
bun dev
```

## Project Structure

```
swc-church-app/
├── app/                   # File-based routing (One router)
│   ├── (app)/
│   │   ├── auth/          # Login, signup screens
│   │   └── home/(tabs)/   # Bottom-tab shell
│   │       ├── sermons/   # YouTube sermon list + player
│   │       ├── events/    # Event list with sign-up (Zero-synced)
│   │       ├── about/     # WordPress service times + church info
│   │       └── ...        # Give = external link (no screen)
│   └── api/
│       ├── auth/          # Better Auth API routes
│       ├── breeze/        # Breeze sync trigger
│       └── zero/          # Zero query/mutation forwarding
├── src/
│   ├── config/            # churchEnv.ts — tenant env var accessors
│   ├── data/              # Zero models, queries, relationships
│   ├── database/          # Drizzle schema + migrations
│   ├── features/
│   │   ├── auth/          # Better Auth client + server
│   │   └── church/        # Sermons, events, about, YouTube, WordPress
│   ├── interface/         # Shared UI components
│   ├── server/            # Breeze API client + sync worker
│   └── tamagui/           # Theme configuration
├── thoughts/              # PRDs, designs, plans, tickets
├── docker-compose.yml     # Dev stack (Postgres, Zero, app)
└── eas.json               # EAS Build profiles (iOS + Android)
```

## Commands

```bash
# Docker dev (recommended)
bash scripts/docker-dev.sh       # start full stack
docker compose logs -f app       # follow app logs
docker compose down              # stop all
docker compose down -v           # stop + fresh DB

# Non-Docker dev
bun dev                          # web dev server only
bun backend                      # docker services only (Postgres + Zero)

# Native
bun ios                          # iOS simulator
bun android                      # Android emulator

# Code quality
bun check                        # type checking
bun lint                         # oxlint
bun lint:fix                     # auto-fix

# Testing
bun test:unit                    # vitest
bun test:integration             # playwright

# Database
bun migrate                      # run migrations
bun zero:generate                # regenerate Zero models after schema changes
```

## Environment Variables

### File structure

- `.env` — Active secrets (gitignored)
- `.env.development` — Dev defaults (committed)
- `.env.docker` — Docker overrides (gitignored)
- `.env.production.example` — Production template (committed)

### Church app variables

| Variable | Purpose |
|----------|---------|
| `CHURCH_DISPLAY_NAME` | App title (defaults to "Stroudsburg Wesleyan Church") |
| `ENGAGE_GIVE_URL` | CDM+ Engage giving portal URL |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `YOUTUBE_CHANNEL_ID` | YouTube channel for sermons |
| `WORDPRESS_ORIGIN` | WordPress site base URL |
| `WORDPRESS_ABOUT_PAGE_ID` | WP page ID for about content |
| `BREEZE_SUBDOMAIN` | Breeze ChMS subdomain (server-only) |
| `BREEZE_API_KEY` | Breeze ChMS API key (server-only) |

### Infrastructure variables

| Variable | Purpose |
|----------|---------|
| `ONE_SERVER_URL` | App server base URL |
| `BETTER_AUTH_SECRET` | Auth session signing secret |
| `BETTER_AUTH_URL` | Auth callback URL |
| `VITE_ZERO_HOSTNAME` | Zero sync server hostname |
| `ZERO_UPSTREAM_DB` | Postgres connection for Zero |

See `.env.production.example` for the complete list.

## Database

PostgreSQL runs in Docker on port **5533** (`docker-compose.yml`):

- Main: `postgresql://user:password@localhost:5533/postgres`
- Zero: `zero_cvr` and `zero_cdb` databases

Schema files:
- `src/database/schema-public.ts` — Public tables (exposed to Zero/client)
- `src/database/schema-private.ts` — Private tables (users, sessions)

## Mobile Apps

For day-to-day UI work, use **web + Chrome DevTools device mode**. Use native targets for device-specific behavior or store builds.

```bash
bun ios          # requires macOS + Xcode 16+
bun android      # requires Android Studio + JDK 17+
```

Native builds use **EAS Build** — see [`eas.json`](eas.json) for profiles.

## License

MIT
