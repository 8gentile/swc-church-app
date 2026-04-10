# Takeout Free

> **[Takeout Pro](https://tamagui.dev/takeout)** - The full version with more features, templates, and support.

> **⚠️ v2-beta** - This stack is in active development. APIs may change.

A full-stack, cross-platform starter kit for building modern web and mobile
applications with React Native.

## SWC Church App (this repository)

This project builds the **Stroudsburg Wesleyan Church** app on top of Takeout Free—mostly as a **convenient universal shell** (Tamagui + One + React Native for web/iOS/Android). Product requirements, APIs, and phased work are in [`thoughts/prds/04-03-2026-swc-church-app-prd.md`](thoughts/prds/04-03-2026-swc-church-app-prd.md).

**Church-specific config** (`YOUTUBE_*`, `WORDPRESS_*`, `ENGAGE_GIVE_URL`, `BREEZE_*`, etc.) lives in **`.env`** (gitignored) and **`.env.production.example`** — see PRD **§7.5** and **§16**.

| Layer | What it does |
|-------|-------------|
| **Tamagui** | Primary UI / theming (white-label ready) |
| **One** (`app/` routing) | Tab shell — Sermons / Events / About + Give |
| **React Native + web** | Single codebase for web, iOS, Android |
| **Zero Sync + Drizzle + Postgres** | Local-first event data — instant UI, background Breeze sync |
| **Breeze ChMS API** | Server-side integration — event polling, attendance push/pull |
| **Better Auth** | Optional sign-in for event sign-up identity |
| **API routes** (`app/api/*`) | `/api/breeze/*` sync trigger, `/api/zero/*` query/mutation forwarding |

## Prerequisites

Before you begin, ensure you have:

- **Docker** - [Install Docker](https://docs.docker.com/get-docker/) (on macOS, we recommend [OrbStack](https://orbstack.dev) as a faster alternative). Required for the full-stack dev environment.
- **Git** - For version control

For **non-Docker** local dev (web-only, no backend):

- **Node.js** — **24.3.0** (see `package.json` `engines` and **`.nvmrc`**). Use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm): `fnm install` / `nvm install` (reads `.nvmrc`), then `fnm use` / `nvm use`.
- **Bun** - [Install Bun](https://bun.sh)

For **native** simulators/emulators:

- **iOS**: macOS with Xcode 16+
- **Android**: Android Studio with JDK 17+

## Quick Start (Docker — recommended)

The full stack runs in Docker Compose: Postgres, Zero Sync, the One.js app server, and the Breeze background worker — all in one command.

```bash
# 1. Copy secrets into .env (gitignored)
cp .env.production.example .env
# Edit .env and fill in BREEZE_API_KEY, BREEZE_SUBDOMAIN, YouTube keys, etc.

# 2. Start everything
bash scripts/docker-dev.sh
# → Postgres starts, migrations run, Zero connects, app serves on http://localhost:8081
```

**What `docker-dev.sh` does:** runs `docker compose up --build --remove-orphans`, which starts:

| Service | Port (host) | Description |
|---------|-------------|-------------|
| `pgdb` | 5533 | PostgreSQL 16 with WAL for Zero replication |
| `migrate` | — | Runs schema migrations then exits |
| `zero` | 4948 | Zero Sync server (real-time client ↔ Postgres) |
| `app` | **8081** | One.js dev server + Breeze sync worker |

Open **http://localhost:8081** in Chrome. Use **DevTools → device toolbar** (Ctrl+Shift+M) to simulate mobile.

Source code is volume-mounted — edits trigger hot reload automatically.

### Without Docker (web-only, no backend)

For quick UI-only work (sermons, about page — anything that doesn't need events/Breeze):

```bash
bun install
bun dev          # web dev server via scripts/dev.sh
```

### Troubleshooting: `bun dev` fails with `styleText` / `Received [ 'underline', 'gray' ]`

1. Run **`node -v`**. You need **`v24.3.0`**. If nvm says "Now using node v24.3.0" but **`node -v` still shows `v21.x`**, your shell is not using nvm's Node (Homebrew or another install wins on `PATH`).

2. Inspect order: **`which node`** and **`which -a node`**. The first entry should be under **`~/.nvm/versions/node/v24.3.0/bin/node`** (path varies slightly by OS).

3. **Fix (pick one):**
   - Load nvm **after** other PATH changes in **`~/.zshrc`**, or run **`hash -r`** after `nvm use`, then confirm `node -v` again.
   - Temporarily **`brew unlink node`** (Linuxbrew/Homebrew) so nvm's shim is first, or remove the brew `node` package if you rely on nvm.
   - One-shot for this repo:
     `export PATH="$HOME/.nvm/versions/node/v24.3.0/bin:$PATH"`
     (adjust if your nvm root differs), then `node -v` and `bun dev`.

4. **`bun dev` uses whatever `node` is first on `PATH`** when One/Rolldown starts — fixing `node -v` in that same terminal fixes the error.

5. **This repo:** `bun dev` runs **`scripts/dev.sh`**, which prepends **`~/.nvm/versions/node/<.nvmrc>/bin`** to `PATH` when that Node exists, so **Homebrew's `node` no longer wins** over nvm. After `bun install`, try **`bun dev`** again; you should see **`node -v` → v24.3.0** if you run `node -v` from a subshell started by the same pattern (or trust the script).

### Optional: WSL + Android SDK on Windows (only if you use `oa` / emulator from WSL)

Expo / Metro in **WSL** need **`adb`**, but the Android SDK lives on **Windows** under `C:\Users\<WindowsUser>\AppData\Local\Android\Sdk`, and **`adb.exe`** is not named `adb` (Node spawns `adb` → **ENOENT**).

1. On **Windows**, install [Android Studio](https://developer.android.com/studio), open **SDK Manager**, and install **Android SDK Platform-Tools** (and create an **AVD** / emulator if you use one).

2. In the repo, copy **`.env.wsl.example`** → **`.env.wsl.local`** and set **`WSL_WINDOWS_USER`** to your **Windows** profile name (the `C:\Users\<name>` segment — often **not** the same as Linux `whoami`).

3. In **every WSL shell** where you run **`bun dev`** or press **`oa`** (open Android), load the bridge **before** dev:

   ```bash
   cd ~/src/swc-church-app   # your clone path
   source scripts/wsl-android-env.sh
   adb version
   adb devices
   ```

4. Add to **`~/.zshrc`** (optional, adjust path):

   ```bash
   source ~/src/swc-church-app/scripts/wsl-android-env.sh
   ```

5. If **`adb devices`** is still empty while an emulator runs on Windows, use a **Windows** terminal (PowerShell / Windows Terminal) in the project for **`bun dev`** + **`oa`**, or follow [Expo's Android + WSL notes](https://docs.expo.dev/workflow/android-studio-emulator/) and WSL2/adb networking guides — the reliable path is often **dev server on Windows** when the emulator is on Windows.

## Stack

At a high level, the primary technologies used are:

- [One](https://onestack.dev) - Universal React framework
- [Zero](https://zero.rocicorp.dev) - Real-time sync (local-first events + signups)
- [Tamagui](https://tamagui.dev) - Universal UI
- [Better Auth](https://www.better-auth.com) - Authentication
- [Drizzle ORM](https://orm.drizzle.team) - Database schema
- [Breeze ChMS](https://www.breezechms.com/) - Church management (events, attendance)

## Project Structure

```
swc-church-app/
├── app/                   # File-based routing (One router)
│   ├── (app)/
│   │   └── home/(tabs)/   # Bottom-tab shell
│   │       ├── sermons/   # YouTube sermon list + player
│   │       ├── events/    # Event list with sign-up (Zero-synced)
│   │       ├── about/     # WordPress service times + church info
│   │       └── ...        # Give = external link (no screen)
│   └── api/
│       ├── breeze/        # Breeze sync trigger endpoint
│       └── zero/          # Zero query/mutation forwarding
├── src/
│   ├── config/            # churchEnv.ts — tenant env var accessors
│   ├── data/
│   │   ├── models/        # Zero models (eventCache, eventSignup)
│   │   └── queries/       # Zero query definitions
│   ├── database/
│   │   ├── schema-public.ts   # Public tables (events, signups)
│   │   ├── schema-private.ts  # Private tables (users, sessions)
│   │   └── migrations/        # Drizzle migrations
│   ├── features/
│   │   └── church/        # Church-specific modules
│   │       ├── sermons/   # SermonsTabContent, sermon list UI
│   │       ├── events/    # EventsTabContent, sign-up hooks
│   │       ├── about/     # AboutTabContent, WP page rendering
│   │       ├── youtube/   # YouTube API client, hooks, player
│   │       └── wordpress/ # WordPress API client, HTML helpers
│   ├── server/
│   │   ├── breeze.ts          # Breeze REST client + rate limiter
│   │   └── breezeSyncWorker.ts # Background: event poll, signup push, attendance pull
│   ├── interface/         # Reusable UI components
│   └── tamagui/           # Theme configuration
├── thoughts/              # PRDs, design docs, tickets, plans
├── scripts/               # Dev helpers (docker-dev.sh, nvm wrapper, WSL bridge)
├── Dockerfile.dev         # Dev container (Node 24 + Bun + native build deps)
└── docker-compose.yml     # Full dev stack (Postgres, Zero, app)
```

## Common Commands

```bash
# Docker dev (recommended)
bash scripts/docker-dev.sh       # start full stack (Postgres + Zero + app)
docker compose logs -f app       # follow app logs
docker compose restart app       # restart app after config change
docker compose down              # stop all services
docker compose down -v           # stop + remove volumes (fresh DB)

# Non-Docker dev
bun dev                          # start web dev server only
bun backend                      # start docker services (Postgres + Zero only)

# Native
bun ios                          # run iOS simulator
bun android                      # run Android emulator

# Code quality
bun check                        # typescript type checking
bun lint                         # run oxlint
bun lint:fix                     # auto-fix linting issues

# Testing
bun test:unit                    # unit tests
bun test:integration             # integration tests

# Database
bun migrate                      # build and run migrations

# Zero
bun zero:generate                # regenerate Zero models/queries after schema changes
```

## Database

### Local Development

PostgreSQL runs in Docker on port 5533:

- Main database: `postgresql://user:password@localhost:5533/postgres`
- Zero sync databases: `zero_cvr` and `zero_cdb`

Inside Docker, services use `pgdb:5432` (container hostname).

### Schema

- `src/database/schema-public.ts` - Public tables (exposed to Zero/client): `eventCache`, `eventSignup`
- `src/database/schema-private.ts` - Private tables: `user`, `session`, etc.

### Migrations

Update your schema, then run:

```bash
bun migrate
```

## Breeze Sync Architecture

The Breeze background worker (`src/server/breezeSyncWorker.ts`) runs inside the app server process and handles three jobs:

| Job | Interval | Direction | What it does |
|-----|----------|-----------|-------------|
| Event poll | 15 min | Breeze → local | Fetches upcoming events, upserts into `eventCache` |
| Signup push | 30 sec | Local → Breeze | Drains `pending_add`/`pending_remove` signups to Breeze attendance API |
| Attendance pull | 15 min | Breeze → local | Checks existing Breeze attendance, creates `confirmed` signup rows locally |

All Breeze API calls go through a sliding-window rate limiter (18 req/min, 3.5s minimum gap) to stay under Breeze's 20/min hard limit.

User sign-ups are **instant locally** (Zero mutation → Postgres → Zero replica) and sync to Breeze in the background. A 400-signup burst drains in ~47 minutes without any user-facing delay.

## Environment Configuration

### File Structure

- `.env` - Active environment with secrets (gitignored)
- `.env.development` - Development defaults (committed)
- `.env.docker` - Docker-specific overrides (gitignored)
- `.env.local` - Personal overrides (gitignored)
- `.env.production` - Production config (gitignored)
- `.env.production.example` - Production template (committed)

### Church App Variables

| Variable | Tab | Side | Required | Description |
|----------|-----|------|----------|-------------|
| `CHURCH_DISPLAY_NAME` | All | Client | No | App title (defaults to "Stroudsburg Wesleyan Church") |
| `ENGAGE_GIVE_URL` | Give | Client | Yes | CDM+ Engage giving portal URL (opens in system browser) |
| `YOUTUBE_API_KEY` | Sermons | Client | Yes | Google Cloud API key (restrict to YouTube Data API v3) |
| `YOUTUBE_CHANNEL_ID` | Sermons | Client | Yes | YouTube channel ID for sermon uploads + live streams |
| `WORDPRESS_ORIGIN` | About | Client | Yes | WordPress site base URL (e.g. `https://www.stroudsburgwesleyan.org`) |
| `WORDPRESS_ABOUT_PAGE_ID` | About | Client | Yes* | WP page ID for service times / about content |
| `WORDPRESS_ABOUT_PAGE_SLUG` | About | Client | Alt* | Alternative: WP page slug instead of ID |
| `BREEZE_SUBDOMAIN` | Events | Server | Yes | Breeze ChMS subdomain (e.g. `stroudsburgwesleyan`) |
| `BREEZE_API_KEY` | Events | Server | Yes | Breeze ChMS API key (admin secret — never expose to client) |

\* Provide either `WORDPRESS_ABOUT_PAGE_ID` or `WORDPRESS_ABOUT_PAGE_SLUG`.

### Infrastructure Variables

```bash
BETTER_AUTH_SECRET=<secret>     # auth session signing
BETTER_AUTH_URL=<url>           # auth callback URL
ONE_SERVER_URL=<url>            # app server URL
ZERO_UPSTREAM_DB=<conn-string>  # Postgres connection for Zero
```

See `.env.production.example` for complete production configuration.

## Mobile Apps

For day-to-day **church UI** work, prefer **web + Chrome device mode** (see **Quick Start** above). Use native targets when you need real device behavior or store builds.

### iOS

```bash
bun ios          # run in simulator
```

Requires macOS, Xcode 16+, and iOS 17.0+ deployment target.

### Android

```bash
bun android      # run in emulator
```

Requires Android Studio, JDK 17+, and Android SDK 34+. On **WSL**, see **Optional: WSL + Android** above.

## Adding Features

### Data Models

1. Add schema to `src/database/schema-public.ts`
2. Run `bun migrate`
3. Add Zero model to `src/data/models/`
4. Run `bun zero:generate`
5. Use queries in your components

### UI Components

Reusable components live in `src/interface/`. Use components from there rather
than importing directly from Tamagui when possible.

### Icons

This project uses [Phosphor Icons](https://phosphoricons.com/). Icons are in
`src/interface/icons/phosphor/`.

## License

MIT
