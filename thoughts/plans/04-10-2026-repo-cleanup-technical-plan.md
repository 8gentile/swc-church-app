# Technical plan: Tamagui Takeout template cleanup

**Status:** Completed  
**Purpose:** Strip Takeout template boilerplate and rebrand the repository to **SWC Church App**, keeping only what supports the product requirements: auth, server + database backend, iOS + Android native apps, and (post-MVP) web.

- Product: [SWC Church App PRD](../prds/04-03-2026-swc-church-app-prd.md)
- Deployment: [DigitalOcean + Caddy Deploy PRD](../prds/04-10-2026-digitalocean-caddy-deploy-prd.md)
- App Store: [App Store Deployment PRD](../prds/04-10-2026-app-store-deployment-prd.md)
- Shell UX: [App Shell Layout Design](../designs/04-04-2026-app-shell-layout.md)

---

## 1. Goals and success criteria

### 1.1 Why clean up now

The prototype was built on top of the Tamagui Takeout Free template. Now that the product shape is clear — auth, server + Postgres backend, iOS + Android apps — the template's placeholder branding, dead code paths, broken references, and Takeout-specific naming create confusion for developers, CI, and future store submissions. A single focused cleanup pass makes everything that follows (deployment, store submission, feature work) cleaner.

### 1.2 Guiding principles

1. **Keep:** anything that supports auth, server/DB, iOS/Android, or future web.
2. **Remove:** Takeout branding, placeholder/demo screens, dead references, unused template scaffolding.
3. **Fix:** broken paths, env var inconsistencies, CI/Docker mismatches.
4. **Don't break:** the app must still `bun dev`, `bun run backend`, and `bun run prebuild:native` after cleanup.

### 1.3 Success criteria

- `bun dev` starts without errors; tabs render with church content (or placeholders where content isn't wired yet).
- `bun run backend` (docker-compose) starts Postgres, Zero, and the app without errors.
- `bun run prebuild:native` generates iOS/Android projects without Takeout bundle IDs.
- `bun check:all` passes (no new type errors).
- No remaining string literal `"takeout"`, `"Takeout"`, or `"tamagui.dev"` in application source (docs/comments referencing the upstream template are fine).
- CI workflow (`.github/workflows/ci.yml`) passes on push.

---

## 2. Current repository state (audit)

### 2.1 What to keep (supports auth + server + DB + mobile + future web)

| Area | Files / packages | Why keep |
|------|-----------------|----------|
| **Auth** | `src/features/auth/`, `app/api/auth/`, `app/(app)/auth/`, `better-auth`, `@better-auth/expo`, `@take-out/better-auth-utils` | User wants auth |
| **Database** | `src/database/` (schema, migrations, `migrate.ts`), `drizzle-orm`, `drizzle-kit`, `pg` | User wants server + DB backend |
| **Zero sync** | `src/zero/`, `@rocicorp/zero`, `on-zero`, `app/api/zero/` | Real-time sync for mobile clients |
| **Server** | `src/server/`, `src/setupServer.ts`, Breeze integration | Backend logic |
| **Docker** | `docker-compose.yml`, `Dockerfile.dev`, `docker-entrypoint.dev.sh` | Local backend dev |
| **One framework** | `one`, `vxrn`, `app/` file routes | Universal routing (native + future web) |
| **Tamagui** | `tamagui`, `@tamagui/*`, `src/tamagui/` | UI kit |
| **Expo / EAS** | `expo`, `eas.json`, `app.config.ts` | iOS + Android builds |
| **Church features** | `src/features/church/`, `src/config/churchEnv.ts` | Product code |
| **Interface** | `src/interface/` (buttons, dialogs, toast, icons, layouts) | Shared UI |
| **CI** | `.github/workflows/ci.yml`, `.github/actions/install` | Checks + integration tests |
| **Platform splits** | All `*.native.tsx` / `*.native.ts` files | Native behavior |
| **Tests** | `src/test/` (vitest, playwright configs, existing tests) | Quality |
| **Web support infra** | `vite.config.ts` web aliases, `Slot` layouts for web, `MainBottomBar` fixed positioning | Future web (post-MVP) — leave in place |

### 2.2 What to remove

| Item | Location | Reason |
|------|----------|--------|
| **Takeout package name** | `package.json` → `"name": "takeout-free"` | Rebrand to `swc-church-app` |
| **Takeout app identity** | `app.config.ts` → name `Takeout`, bundle IDs `dev.tamagui.takeout.*`, slug, owner | Must be church-specific before any native build |
| **Takeout fallback URLs** | `src/constants/urls.ts` → `takeout.tamagui.dev`, `zero.tamagui.dev` | Dead endpoints; must point to church domain or fail loudly |
| **`VITE_SERVER` env var** | `src/constants/urls.ts` | Unused indirection; align on `ONE_SERVER_URL` (see §3.1) |
| **Takeout Zero publication** | `package.json` → `"ZERO_APP_PUBLICATIONS": "zero_takeout"` | Rename to `zero_swc` or similar |
| **Template docs** | `docs/takeout.md`, `docs/zero.md`, `docs/tamagui.md` | Operator guides for the template, not the church app — remove or move to a `docs/reference/` subfolder |
| **Takeout icon** | `public/takeout-icon.svg` | Template asset |
| **Unused Dockerfile `COPY packages`** | `Dockerfile` line `COPY packages ./packages` | No `packages/` directory exists; build would fail |
| **Missing `scripts/ci/release.ts`** | `package.json` → `"ci"` script | Referenced but doesn't exist; remove or stub |
| **Maestro action** | `.github/actions/install-maestro/` | No maestro test files in repo |
| **Unused template permissions** | `app.config.ts` → Camera, Microphone, Photo Library | Not used in church app MVP (PRD §4); remove to avoid store review friction |
| **Template settings screens** (if purely demo) | `app/(app)/home/(tabs)/settings/` screens like `blocked-users`, `edit-profile` | Evaluate — keep if auth/settings UX is useful; remove if purely Takeout demo |
| **`publishConfig`** | `package.json` → `"publishConfig": { "access": "public" }` | This isn't an npm package |

### 2.3 What to fix

| Issue | Location | Fix |
|-------|----------|-----|
| **URL var inconsistency** | `authFetch.ts` uses `ONE_SERVER_URL`; `urls.ts` uses `VITE_SERVER` (undefined anywhere) | Align both on `ONE_SERVER_URL`; remove `VITE_SERVER` (see §3.1) |
| **CI Node version mismatch** | `.github/actions/install/` uses Node 20.x; `package.json` + `.nvmrc` require 24.3.0 | Update CI to Node 24 |
| **Dockerfile prod stage** | `COPY packages ./packages` copies non-existent dir | Remove the line |
| **`README.md`** | Mix of Takeout template docs and church app docs | Rewrite for church app; keep Takeout attribution in a footnote |
| **`app.config.ts` splash/icon refs** | References `./assets/icon.png`, `adaptive-icon.png` — may not exist | Verify assets exist; add placeholder church assets or document the gap |
| **Docker port inconsistency** | README says Postgres on 5444; `docker-compose.yml` maps 5533 | Align README to 5533 (trust compose) |

---

## 3. Architecture decisions

### 3.1 Server URL consolidation

**Problem:** Three code paths reference the server URL with two different env vars:

| File | Var | Purpose |
|------|-----|---------|
| `src/features/auth/client/authFetch.ts` | `ONE_SERVER_URL` | Auth API base — throws if missing |
| `src/constants/urls.ts` → `SERVER_URL` | `VITE_SERVER` | General API base — falls back to `takeout.tamagui.dev` |
| `src/constants/urls.ts` → `ZERO_SERVER_URL` | `VITE_ZERO_HOSTNAME` | Zero sync — falls back to `zero.tamagui.dev` |

**Decision:** Standardize on `ONE_SERVER_URL` for the app server and `VITE_ZERO_HOSTNAME` for Zero sync. Remove `VITE_SERVER` entirely. Replace Takeout fallback domains with the church production domain (`app.stroudsburgwesleyan.org`) or remove fallbacks so missing config fails loudly in dev.

### 3.2 Template docs disposition

**Decision:** Remove `docs/takeout.md`, `docs/zero.md`, `docs/tamagui.md`. The useful content from these (how to run Zero, how to configure Tamagui) should live in the project `README.md` in a condensed form. The Takeout-specific operator instructions are noise.

### 3.3 Settings screens

**Decision:** Keep the settings infrastructure (`app/(app)/home/(tabs)/settings/`) but remove purely demo screens (`blocked-users` if it's template-only). The settings root, edit-profile, and theme toggle are useful for auth-enabled users. Audit each screen and keep what maps to a real user need.

### 3.4 Naming convention

| Current | New |
|---------|-----|
| `takeout-free` (package.json) | `swc-church-app` |
| `Takeout` (app.config.ts name) | `SWC Church` |
| `dev.tamagui.takeout.*` (bundle IDs) | `org.stroudsburgwesleyan.app.*` |
| `takeout` (slug) | `swc-church` |
| `zero_takeout` (Zero publication) | `zero_swc` |

### 3.5 What NOT to do in this cleanup

- **Don't refactor feature code** — this is branding/naming/dead-code removal, not architecture.
- **Don't add new features** — deployment, store submission, and new church features are separate plans.
- **Don't remove web layout code** — web is post-MVP but should remain functional; leave `Slot` layouts, `MainBottomBar` fixed positioning, Vite web aliases in place.
- **Don't touch Tamagui theme/token config** — theming and branding customization is a separate task.

---

## 4. Phased execution plan (ordered work)

### Phase 1 — Identity & branding (no behavior change)

Rename all Takeout identifiers to church app identifiers. This is the highest-value, lowest-risk change.

**Tasks:**

1. **`package.json`**
   - `"name"` → `"swc-church-app"`
   - Remove `"publishConfig"` block (not an npm package)
   - `"ZERO_APP_PUBLICATIONS"` → `"zero_swc"`

2. **`app.config.ts`**
   - App name → `SWC Church`
   - Slug → `swc-church`
   - Bundle IDs → `org.stroudsburgwesleyan.app` (with `.dev` / `.preview` variants)
   - Owner → church Expo org or personal account
   - Scheme → `swc-church`
   - Remove unused permissions: Camera, Microphone, Photo Library (add back only when needed)
   - Update `infoPlist` descriptions to reference "SWC Church"

3. **`eas.json`**
   - Add `env` blocks for preview and production profiles with `ONE_SERVER_URL` and `VITE_ZERO_HOSTNAME` (per App Store PRD §5.1)

4. **`README.md`**
   - Rewrite for church app: project description, setup instructions, env var table, architecture overview
   - Remove Takeout template instructions
   - Add single-line Takeout attribution: "Built on [Tamagui Takeout Free](https://tamagui.dev/takeout)"
   - Fix Postgres port reference (5533, not 5444)

**Exit criteria:** `bun install` succeeds; no "takeout" in `package.json` or `app.config.ts`; README is church-oriented.

---

### Phase 2 — Dead code & broken references

Remove files and fix references that are objectively broken or unused.

**Tasks:**

1. **Remove template docs**
   - Delete `docs/takeout.md`, `docs/zero.md`, `docs/tamagui.md`

2. **Remove template assets**
   - Delete `public/takeout-icon.svg`

3. **Fix `Dockerfile` (production)**
   - Remove `COPY packages ./packages` line (no `packages/` dir)
   - Verify multi-stage build still works (or mark as TODO for deploy plan)

4. **Fix or remove `scripts/ci/release.ts` reference**
   - The `"ci"` script in `package.json` references `scripts/ci/release.ts` which doesn't exist
   - Remove the script entry if not needed, or create a stub that documents the intended behavior

5. **Remove `.github/actions/install-maestro/`**
   - No maestro tests exist in the repo

6. **Fix CI Node version**
   - Update `.github/actions/install/` to use Node 24.x (matching `engines` and `.nvmrc`)

7. **Audit and clean settings screens**
   - Review `app/(app)/home/(tabs)/settings/` — keep useful screens (root, edit-profile, theme)
   - Remove demo-only screens (e.g. `blocked-users` if it has no real function)

**Exit criteria:** No dead file references; `Dockerfile` doesn't copy non-existent dirs; CI installs correct Node version.

---

### Phase 3 — URL and env var consolidation

Fix the env var inconsistencies identified in §3.1. This is the riskiest phase — touches runtime behavior.

**Tasks:**

1. **`src/constants/urls.ts`**
   - Replace `VITE_SERVER` with `ONE_SERVER_URL` for `SERVER_URL`
   - Replace `takeout.tamagui.dev` fallback with church production domain or throw
   - Replace `zero.tamagui.dev` fallback with church Zero domain or throw
   - Keep `VITE_ZERO_HOSTNAME` for `ZERO_SERVER_URL` (already correct var name)

2. **Update `.env.production.example`**
   - Remove `VITE_SERVER` if present
   - Ensure `ONE_SERVER_URL` and `VITE_ZERO_HOSTNAME` are documented

3. **Update `.env.development`**
   - Ensure it references `ONE_SERVER_URL` (not `VITE_SERVER`)

4. **Verify `authFetch.ts`**
   - Already uses `ONE_SERVER_URL` — confirm no regression after `urls.ts` change

5. **Grep for remaining `takeout.tamagui.dev` or `zero.tamagui.dev`**
   - Replace any other references in source

**Exit criteria:** Single env var (`ONE_SERVER_URL`) for app server across all code paths; no Takeout domain fallbacks in source; `bun dev` works with existing `.env`.

---

### Phase 4 — Sweep and verify

Final pass to catch stragglers and verify everything works end-to-end.

**Tasks:**

1. **Global search for Takeout remnants**
   - `rg -i "takeout" --type ts --type tsx` — replace or remove any remaining references in source
   - `rg "tamagui\.dev" --type ts --type tsx` — catch any other Takeout domain references
   - Acceptable exceptions: comments attributing the template origin, `@tamagui/*` package names

2. **Verify asset references**
   - Check `./assets/icon.png`, `adaptive-icon.png`, `logo.png` exist (or add TODO placeholders)
   - These will be replaced with church branding per the App Store PRD, but builds shouldn't fail

3. **Run validation**
   - `bun check:all` — type checking
   - `bun dev` — app starts, tabs render
   - `bun run backend` — docker-compose starts cleanly
   - `bun run prebuild:native` — generates iOS/Android without Takeout identifiers
   - `bun test:unit` — no regressions

4. **Update `thoughts/` cross-references**
   - Add this cleanup plan to any relevant ticket indexes
   - Ensure deployment PRDs reference the cleaned-up state

**Exit criteria:** All §1.3 success criteria met.

---

## 5. Configuration and secrets

### 5.1 Env var inventory after cleanup

| Variable | Client-visible | Purpose | Change |
|----------|---------------|---------|--------|
| `ONE_SERVER_URL` | Yes (via Metro + Vite) | App server base URL | **Now the single source of truth** (was split with `VITE_SERVER`) |
| `VITE_ZERO_HOSTNAME` | Yes | Zero sync WebSocket hostname | No change |
| `BETTER_AUTH_SECRET` | No (server only) | Auth session signing | No change |
| `BETTER_AUTH_URL` | No (server only) | Auth server URL | No change |
| `VITE_YOUTUBE_API_KEY` | Yes | YouTube Data API key | No change |
| `VITE_YOUTUBE_CHANNEL_ID` | Yes | Target YouTube channel | No change |
| `ENGAGE_GIVE_URL` | Yes (via `VITE_ENGAGE_GIVE_URL`) | Giving URL | No change |
| `WORDPRESS_ORIGIN` | Yes (via `VITE_WORDPRESS_ORIGIN`) | WordPress site | No change |
| `ZERO_APP_PUBLICATIONS` | No (server/compose) | Zero publication name | **Renamed:** `zero_takeout` → `zero_swc` |

### 5.2 Removed

| Variable | Reason |
|----------|--------|
| `VITE_SERVER` | Never defined; replaced by `ONE_SERVER_URL` |

---

## 6. Testing strategy

| Layer | What to verify | How |
|-------|----------------|-----|
| **Type check** | No new type errors from renames | `bun check:all` |
| **Unit** | Existing tests still pass | `bun test:unit` |
| **Dev server** | App boots, tabs render, no console errors | `bun dev` + Chrome DevTools |
| **Backend** | Docker services start, migrations run | `bun run backend` |
| **Native prebuild** | iOS/Android projects generate with correct bundle IDs | `bun run prebuild:native` + inspect `ios/` and `android/` |
| **Integration** | Existing Playwright tests pass | `bun test:integration` (if backend is running) |
| **Manual** | Give tab opens external URL; auth flow works | Click-through in browser and/or simulator |

---

## 7. Risks, edge cases, and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Zero publication rename breaks sync** | Zero clients can't sync if publication name changes without DB migration | Check if `ZERO_APP_PUBLICATIONS` is stored in the DB schema or is runtime-only; if schema-dependent, add a migration |
| **Bundle ID change loses dev builds** | New bundle ID = new app on device; dev builds from old ID orphaned | Expected and acceptable; document in PR description |
| **`ONE_SERVER_URL` missing in dev** | `urls.ts` throws instead of falling back to Takeout domain | Ensure `.env` has `ONE_SERVER_URL=http://localhost:8081` (or whatever the dev server port is) |
| **Docker build breaks** | Removing `COPY packages` might not be the only issue in prod Dockerfile | Full Dockerfile audit is in the deploy plan scope; this cleanup only fixes the obvious breakage |
| **Maestro action removal breaks CI** | If any workflow references the action | Grep workflows for `install-maestro` before deleting |

---

## 8. Open questions

1. **Settings screens:** Which screens under `settings/` are Takeout demo vs. useful for the church app? Need to audit each file individually.
2. **Zero publication name:** Is `ZERO_APP_PUBLICATIONS` tied to a database schema or purely runtime config? If schema-tied, renaming requires a migration.
3. **`@take-out/*` packages:** These provide auth utils, postgres helpers, CLI, hooks, and scripts. They're functional dependencies, not just branding — keep them. But should we track them as a potential migration target if the upstream template diverges from our needs?
4. **Template attribution:** Where/how to credit Tamagui Takeout Free? Single line in README footer is proposed.
5. **Asset placeholders:** Should this plan include creating placeholder church icon/splash assets, or leave that to the App Store deployment plan?

---

## 9. Future work (post-scope)

These are **not** part of this cleanup — each has its own plan or PRD:

- **Server deployment:** [DigitalOcean + Caddy deploy](../plans/04-10-2026-digitalocean-caddy-deploy-technical-plan.md)
- **Store submission:** [App Store PRD](../prds/04-10-2026-app-store-deployment-prd.md)
- **Church branding / theming:** Tamagui token overrides, brand colors, logo — separate task after cleanup
- **Feature work:** Sermons, events, about, give wiring — covered by [prototype plan](../plans/04-04-2026-church-app-prototype-technical-plan.md)
- **Multi-tenant / white-label:** Config-driven branding per congregation (PRD §7.5, §12)

---

## 10. Suggested PR sequence

| PR | Phase | Description | Risk |
|----|-------|-------------|------|
| **PR1** | Phase 1 | Identity & branding: rename package, app config, bundle IDs, README | Low |
| **PR2** | Phase 2 | Dead code removal: template docs, broken refs, CI fixes | Low |
| **PR3** | Phase 3 | URL/env consolidation: `urls.ts` fix, Takeout fallback removal | Medium |
| **PR4** | Phase 4 | Final sweep: grep for remnants, verify all builds | Low |

PRs 1 and 2 are independent and can be done in either order (or merged into one if the diff is small). PR3 depends on PR1 (needs the new domain names). PR4 is the final verification pass.

Alternatively, this entire cleanup is small enough to land as a **single PR** with clear commit boundaries per phase — reviewer can follow commit-by-commit.

---

*End of technical plan.*
