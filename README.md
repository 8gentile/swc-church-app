# Takeout Free

> **[Takeout Pro](https://tamagui.dev/takeout)** - The full version with more features, templates, and support.

> **⚠️ v2-beta** - This stack is in active development. APIs may change.

A full-stack, cross-platform starter kit for building modern web and mobile
applications with React Native.

## SWC Church App (this repository)

This project builds the **Stroudsburg Wesleyan Church** app on top of Takeout Free—mostly as a **convenient universal shell** (Tamagui + One + React Native for web/iOS/Android). Product requirements, APIs, and phased work are in [`thoughts/prds/04-03-2026-swc-church-app-prd.md`](thoughts/prds/04-03-2026-swc-church-app-prd.md).

**Church-specific config** (`YOUTUBE_*`, `WORDPRESS_*`, `ENGAGE_GIVE_URL`, `BREEZE_*`, etc.) lives in **`.env`** (gitignored) and **`.env.production.example`** — see PRD **§7.5** and **§16**. Events are powered by the **Breeze ChMS API** via server-side proxy routes (`/api/breeze/*`).

| From this template | Church prototype (MVP) | Keep for later scale |
|--------------------|-------------------------|----------------------|
| **Tamagui** | Primary UI / theming | Same — white-label per tenant |
| **One** (`app/` routing) | Tab shell for Sermons / Events / About + Give | Same |
| **React Native + web** | One codebase per PRD | Same |
| **Better Auth**, `app/(app)/auth/*` | **Not used** — PRD: no user login | Accounts, saved content (**PRD §12**) |
| **Zero**, **Drizzle**, Postgres, `bun backend` | **Not required** for client-side YouTube + WordPress | Sync, push, server-side Breeze, analytics |
| **API routes** (`app/api/*`) | Optional; church data is mostly public HTTP APIs | Proxies, secrets, webhooks |

Treat the full stack as **optional infrastructure**: the MVP does not need a backend for sermons or events, but leaving the template intact avoids rework if you add auth, notifications, or a real database later.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** — **24.3.0** (see `package.json` `engines` and **`.nvmrc`**). The dev server (`one dev` → Rolldown) relies on Node’s `util.styleText()` with **array** style arguments; **Node 21 and older** fail at startup with  
  `The argument 'format' must be one of: ... Received [ 'underline', 'gray' ]`.  
  Use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm): `fnm install` / `nvm install` (reads `.nvmrc`), then `fnm use` / `nvm use`.  
  **Check:** run `node -v` in the same terminal — it **must** print `v24.3.0`. If you still see `v21.x` (or anything other than 24.3.0), another `node` (often **Homebrew** `linuxbrew`/`homebrew`) is earlier on `PATH` than nvm; see **Troubleshooting** below.
- **Bun** - [Install Bun](https://bun.sh)
- **Docker** - [Install Docker](https://docs.docker.com/get-docker/) (on macOS,
  we recommend [OrbStack](https://orbstack.dev) as a faster alternative)
- **Git** - For version control

For **native** simulators/emulators later:

- **iOS**: macOS with Xcode 16+
- **Android**: Android Studio with JDK 17+

## Daily dev (church app — recommended for now)

Keep the loop small: **web + Chrome**, not emulators or WSL/Android wiring.

1. **`bun install`** then **`bun dev`** (uses **`scripts/dev.sh`** so Node **24.3.0** wins over Homebrew — see Troubleshooting).
2. Open the dev URL in **Google Chrome** (default is often **http://localhost:8092** — check the terminal).
3. **Chrome DevTools** → **Toggle device toolbar** (Ctrl+Shift+M / Cmd+Shift+M) → pick a phone size or “Responsive” to approximate mobile layout and touch targets.

That is enough for **layout, navigation, and most church flows** (YouTube/WordPress are HTTP from the browser). Add **`bun backend`** (Docker) only when you need the full Takeout stack (Zero, auth, DB).

Real **iOS / Android** builds and device quirks can wait until you care; see **Mobile Apps** and **WSL + Android** below.

## Quick Start (full template stack)

```bash
bun install
bun backend      # Docker: postgres + zero (skip until you need DB/sync)
bun dev          # web dev server — often http://localhost:8092
```

### Troubleshooting: `bun dev` fails with `styleText` / `Received [ 'underline', 'gray' ]`

1. Run **`node -v`**. You need **`v24.3.0`**. If nvm says “Now using node v24.3.0” but **`node -v` still shows `v21.x`**, your shell is not using nvm’s Node (Homebrew or another install wins on `PATH`).

2. Inspect order: **`which node`** and **`which -a node`**. The first entry should be under **`~/.nvm/versions/node/v24.3.0/bin/node`** (path varies slightly by OS).

3. **Fix (pick one):**
   - Load nvm **after** other PATH changes in **`~/.zshrc`**, or run **`hash -r`** after `nvm use`, then confirm `node -v` again.
   - Temporarily **`brew unlink node`** (Linuxbrew/Homebrew) so nvm’s shim is first, or remove the brew `node` package if you rely on nvm.
   - One-shot for this repo:  
     `export PATH="$HOME/.nvm/versions/node/v24.3.0/bin:$PATH"`  
     (adjust if your nvm root differs), then `node -v` and `bun dev`.

4. **`bun dev` uses whatever `node` is first on `PATH`** when One/Rolldown starts — fixing `node -v` in that same terminal fixes the error.

5. **This repo:** `bun dev` runs **`scripts/dev.sh`**, which prepends **`~/.nvm/versions/node/<.nvmrc>/bin`** to `PATH` when that Node exists, so **Homebrew’s `node` no longer wins** over nvm. After `bun install`, try **`bun dev`** again; you should see **`node -v` → v24.3.0** if you run `node -v` from a subshell started by the same pattern (or trust the script).

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

5. If **`adb devices`** is still empty while an emulator runs on Windows, use a **Windows** terminal (PowerShell / Windows Terminal) in the project for **`bun dev`** + **`oa`**, or follow [Expo’s Android + WSL notes](https://docs.expo.dev/workflow/android-studio-emulator/) and WSL2/adb networking guides — the reliable path is often **dev server on Windows** when the emulator is on Windows.

## Stack

At a high level, the primary technologies used are:

- [One](https://onestack.dev) - Universal React framework
- [Zero](https://zero.rocicorp.dev) - Real-time sync
- [Tamagui](https://tamagui.dev) - Universal UI
- [Better Auth](https://www.better-auth.com) - Authentication
- [Drizzle ORM](https://orm.drizzle.team) - Database schema

## Project Structure

```
swc-church-app/
├── app/                   # File-based routing (One router)
│   ├── (app)/
│   │   └── home/(tabs)/   # Bottom-tab shell
│   │       ├── sermons/   # YouTube sermon list + player
│   │       ├── events/    # Breeze calendar embed
│   │       ├── about/     # WordPress service times + church info
│   │       └── ...        # Give = external link (no screen)
│   └── api/               # API routes (template — not used in MVP)
├── src/
│   ├── config/            # churchEnv.ts — tenant env var accessors
│   ├── features/
│   │   └── church/        # Church-specific modules
│   │       ├── sermons/   # SermonsTabContent, sermon list UI
│   │       ├── events/    # EventsTabContent, calendar embed
│   │       ├── about/     # AboutTabContent, WP page rendering
│   │       ├── youtube/   # YouTube API client, hooks, player
│   │       └── wordpress/ # WordPress API client, HTML helpers
│   ├── interface/         # Reusable UI components
│   └── tamagui/           # Theme configuration
├── thoughts/              # PRDs, design docs, tickets, plans
└── scripts/               # Dev helpers (nvm wrapper, WSL bridge)
```

## Common Commands

```bash
# development
bun dev                      # start web + mobile dev server
bun ios                      # run iOS simulator
bun android                  # run Android emulator
bun backend                  # start docker services

# code quality
bun check                    # typescript type checking
bun lint                     # run oxlint
bun lint:fix                 # auto-fix linting issues

# testing
bun test:unit                # unit tests
bun test:integration         # integration tests

# database
bun migrate                  # build and run migrations

# deployment
bun ci --dry-run             # run full CI pipeline without deploy
bun ci                       # full CI/CD with deployment
```

## Database

### Local Development

PostgreSQL runs in Docker on port 5444:

- Main database: `postgresql://user:password@localhost:5444/postgres`
- Zero sync databases: `zero_cvr` and `zero_cdb`

### Migrations

Update your schema in:

- `src/database/schema-public.ts` - Public tables (exposed to Zero/client)
- `src/database/schema-private.ts` - Private tables

Then run:

```bash
bun migrate
```

## Environment Configuration

### File Structure

- `.env.development` - Development defaults (committed)
- `.env` - Active environment (generated, gitignored)
- `.env.local` - Personal secrets/overrides (gitignored)
- `.env.production` - Production config (gitignored)
- `.env.production.example` - Production template (committed)

### Church App Variables (client-side, via `vite.config.ts` envPrefix)

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

### Infrastructure Variables (template — not needed for church MVP)

```bash
BETTER_AUTH_SECRET=<secret>     # only if using auth
ONE_SERVER_URL=<url>            # only if deploying server
ZERO_UPSTREAM_DB=<conn-string>  # only if using Zero sync
```

See `.env.production.example` for complete production configuration.

## Mobile Apps

For day-to-day **church UI** work, prefer **web + Chrome device mode** (see **Daily dev** above). Use native targets when you need real device behavior or store builds.

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
