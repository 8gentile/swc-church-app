# Technical plan: Tamagui Takeout → SWC Church App prototype

**Purpose:** Single implementation roadmap to evolve this repository from the **Tamagui Takeout Free** template into the **Stroudsburg Wesleyan Church** anonymous-first prototype described in:

- Product: [`thoughts/prds/04-03-2026-swc-church-app-prd.md`](../prds/04-03-2026-swc-church-app-prd.md)
- Shell UX: [`thoughts/designs/04-04-2026-app-shell-layout.md`](../designs/04-04-2026-app-shell-layout.md)

**Scope:** MVP / prototype only—frontend-heavy, **no church-owned database** for content, **optional** Better Auth identity later. Preserve template infrastructure (Zero, Drizzle, `app/api/*`) where removal would not simplify the church slice.

---

## 1. Goals and success criteria

### 1.1 Product goals (from PRD)

- **Unified shell** for sermons (YouTube), events (WordPress), giving (external Engage URL), and about (WordPress).
- **Anonymous-first:** same four-tab IA for everyone; sign-in is optional for future identity (e.g. email-aware event signup UX).
- **White-label ready:** church-specific hosts, IDs, and URLs come from **configuration** (env / build-time), not hardcoded “Stroudsburg” strings in source.
- **External trust boundaries:** Give and Breeze signup open in the **system browser**, not in-app webviews.

### 1.2 Engineering success (Definition of Done alignment)

Ship when:

1. **Sermons** load from YouTube Data API v3, sort newest-first, tap opens embedded player.
2. **Live** banner when `search` + `eventType=live` returns a video; tap opens live player; hidden when none.
3. **Events** tab shows WordPress-backed content (Stroudsburg: page `3117` / `/events/` parity—see PRD §16).
4. **Sign-up / external CTAs** from events content open **HTTPS URLs** in the system browser.
5. **Give** is the **center tab**, visually emphasized; **one tap** opens `ENGAGE_GIVE_URL` in the system browser—**no Give stack screen**.
6. **About** reflects WordPress page content (slug or ID from config).
7. **Shell** matches the layout design: bottom tabs (four destinations), scrollable main column (~960px max width), overflow for theme/settings/account, safe areas, web fixed bottom bar without horizontal scroll breakage.

---

## 2. Current repository state (audit)

### 2.1 Stack (unchanged at foundation)

| Layer | Technology | Church prototype use |
|-------|------------|----------------------|
| Routing / universal app | **One** (`app/` file routes) | Tab routes + nested stacks for sermon detail, etc. |
| UI | **Tamagui** | Tokens (`$background`, `$color*`, `$space`, themes) per design doc |
| Platforms | React Native + RN Web | Mobile-first; Chrome DevTools for most dev |
| Auth (template) | **Better Auth** | Optional; not required for MVP content |
| Sync / DB (template) | **Zero**, **Drizzle**, Postgres | Not required for YouTube/WordPress MVP |

### 2.2 What the template still shows (must migrate)

| Area | Current | Target (PRD + design) |
|------|---------|------------------------|
| Bottom tabs | **Home** → `/home/feed`, **Profile** → `/home/settings` | **Sermons**, **Events**, **Give (center action)**, **About** |
| Default route | Feed placeholder copy | **Sermons** as default “home” engagement surface |
| Give | N/A | **Not a screen**—tab triggers `Linking.openURL` (native) / `window.open` or equivalent policy on web |
| Config | `.env` / `.env.production.example` partially filled | Complete **client-readable** env strategy for `VITE_*` vars (see §6) |
| Branding | `APP_NAME` etc. in `src/constants/app.ts` | Church display name + assets driven by config/constants |

### 2.3 Relevant files today (edit targets)

- **Shell:** `src/features/app/HomeShell.tsx`, `MainBottomBar.tsx`, `NavigationTabs.tsx`, `MainHeader.tsx`
- **Home layout:** `app/(app)/home/_layout.tsx`, `app/(app)/home/(tabs)/*`, `(tabs)/_layout.native.tsx`
- **Placeholder home:** `app/(app)/home/(tabs)/feed/index.tsx` → becomes sermons or is replaced by route rename
- **Constants:** `src/constants/app.ts`
- **Env examples:** `.env.production.example`, `.env.development`

### 2.4 Dependencies to add (PRD §6)

- **`react-native-youtube-iframe`** (or agreed alternative) for embedded playback on native + web where supported.
- HTTP: **`@better-fetch/fetch`** already present; plain `fetch` is fine for YouTube/WordPress JSON.
- **WordPress HTML:** plan for rendering `content.rendered` (often HTML-heavy, Elementor on Stroudsburg—PRD §16). Options: `react-native-render-html` (with sanitization), lightweight HTML-to-text for lists, or **open canonical `/events/` in browser** as fallback (product call).

---

## 3. Architecture decisions

### 3.1 Data flow (no backend for church content)

| Feature | Source | Client method |
|---------|--------|----------------|
| Sermon list | YouTube `channels` → uploads playlist → `playlistItems` | `GET` with API key |
| Live / upcoming | YouTube `search` + `eventType` | `GET` with API key + short TTL cache |
| Events | WordPress `GET /wp/v2/pages/{id}` (or CPT when available) | `GET`, no secret for public site |
| About | WordPress `GET /wp/v2/pages` by slug or id | `GET` |
| Give | `ENGAGE_GIVE_URL` | **No API**—`expo-linking` / `Linking` |
| Breeze signup | URLs in content or config | External browser only (no Breeze REST in MVP—PRD §7.3) |

### 3.2 Where the YouTube API key lives

The PRD expects **build-time** configuration. The app already uses **Vite** (`import.meta.env` on client). **Decision to implement:**

- Expose only **`VITE_YOUTUBE_API_KEY`** (and other client-needed vars) via Vite env, **or**
- Add a thin **`app/api/*` proxy** that injects the key server-side so the browser never sees it.

**Recommendation for prototype speed:** direct client calls with **`VITE_YOUTUBE_API_KEY`**, with the key **restricted** in Google Cloud Console (HTTP referrers for web, app identifiers for native builds). Document that moving the key to a proxy is a hardening follow-up.

**Action items:** Add `VITE_YOUTUBE_API_KEY` / `VITE_YOUTUBE_CHANNEL_ID` to `.env.production.example` and load them in a single `src/config/churchEnv.ts` (or similar) that throws clear errors in dev when missing.

### 3.3 Routing model for four tabs + Give-as-action

**Stable routes (example—exact paths can follow One conventions):**

| Tab order | Label | Route | Notes |
|-----------|--------|-------|--------|
| 1 | Sermons | `/home/sermons` (default index) | List + stack detail `/home/sermons/[videoId]` |
| 2 | Events | `/home/events` | Optional detail if needed |
| 3 | Give | **none** | Tab `onPress` → open URL; **do not** `router.push` to a Give page |
| 4 | About | `/home/about` | Single scrollable page |

**Implementation pattern for Give:**

- In `NavigationTabs`, render the center item as a **Pressable** (not `Link`) that calls `Linking.openURL(ENGAGE_GIVE_URL)` and returns `e.preventDefault()` if using a wrapper that navigates.
- **Active state:** when Give is tapped, **do not** switch “active” tab to an empty route; either keep previous tab highlighted or briefly flash Give styling—design doc allows minimal/empty state; simplest is **keep previous tab active** visually.

### 3.4 Overflow / secondary (design doc)

Keep **menu** (`MainHeaderMenu` pattern in `MainBottomBar`): theme (`ThemeSwitch` already present), link to **Settings**, **Sign in** / account when Better Auth is enabled, **Logout** when signed in. This must **not** become a fifth primary tab.

### 3.5 Tamagui and theming

- Use **tokens** and **named themes** (`blue`, `dark_blue`, …) per design doc.
- Plan a later **`CHURCH_DISPLAY_NAME`**, `BRAND_PRIMARY` / Tamagui theme overrides—can be Phase 0.5 after shell works.

---

## 4. Phased execution plan (ordered work)

Aligned with PRD §4.2 and §10. Each phase ends with something **demoable** in Chrome (device toolbar) and on native when available.

### Phase 0 — Shell (foundation)

**Objective:** Replace Home/Profile with **Sermons / Events / Give / About**, wire **Give** as external-only center action, preserve **HomeShell** bottom inset + fixed bar on web.

**Tasks**

1. **Routes**
   - Add route files under `app/(app)/home/(tabs)/` for `sermons`, `events`, `about` (and remove or redirect `feed` → `sermons` for bookmarks).
   - Update **`(tabs)/_layout.native.tsx`** (and web `Slot` structure if needed) so native stack includes new screens; mirror PRD navigation.
   - Regenerate or rely on One **typed routes** (`experimental_scriptLoading` / `routes.d.ts` updates on build).

2. **`NavigationTabs.tsx`**
   - Replace `routes` array with four entries: Sermons, Events, Give, About.
   - Icons: pick Phosphor icons consistent with existing imports (e.g. video, calendar, heart/hand, info) or add new icon components under `src/interface/icons/phosphor/`.
   - **Give:** custom row layout—**center** tab wider / `$color` emphasis / FAB-like elevation per design.
   - Wire **href** for three real tabs; Give uses press handler only.

3. **Default route**
   - Ensure initial deep link lands on **Sermons** (`/home/sermons`).

4. **Placeholder content**
   - Each tab: `PageContainer`, max width **960**, padding, scroll—replace copy with “Coming in Phase …” only until wired.

5. **Overflow**
   - Confirm `MainHeaderMenu` still opens from bar; adjust entries to match church settings (hide demo-only Takeout routes if distracting).

6. **Constants / naming**
   - Update `APP_NAME` / marketing strings via env: `VITE_CHURCH_DISPLAY_NAME` (optional in Phase 0).

**Exit criteria**

- Four tabs visible; Give opens **a test URL** in system browser (use `ENGAGE_GIVE_URL` from env).
- No regression: web has no content hidden under fixed bar; native respects safe area.

---

### Phase 1 — Sermons + live (YouTube) — **priority**

**Objective:** Full sermon list + detail player + live/upcoming banner per PRD §5.1–5.2, §7.1.

**Tasks**

1. **Config module**
   - `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` from env (Vite-prefixed for client).
   - Optional: cache **uploads playlist ID** in memory after first `channels.list` to reduce calls.

2. **API client layer** (`src/features/church/youtube/` suggested)
   - `getUploadsPlaylistId(channelId)` → `channels.list?part=contentDetails&id=…`
   - `listPlaylistItems(playlistId, pageToken?)` → `playlistItems.list`
   - `getLiveVideo()` → `search.list` with `eventType=live`
   - Optional: `getUpcomingVideo()` → `eventType=upcoming` for “Starting soon”
   - **Quota / cache:** in-memory or `Map` with **1–5 minute TTL** for live/upcoming; debounce app-focus refreshes.

3. **UI — list**
   - Flat list: thumbnail (use `snippet.thumbnails.medium.url`), title, published date (formatted local time).
   - Loading / error / empty states (PRD §9).
   - Pull-to-refresh on native; refresh on web via button or pull if available.

4. **UI — live banner**
   - When live: sticky region below safe area / top of scroll (design doc)—**“LIVE NOW”**, CTA “Join Sunday Service”, navigates to player with live video id.
   - When not live: render nothing.

5. **UI — detail / player**
   - Route `sermons/[id].tsx` (or query param) embedding **react-native-youtube-iframe** with `videoId`.
   - Web: confirm iframe works with layout; fix `100vw` / overflow issues (design doc §Native vs web).

6. **Errors**
   - Offline: friendly message (PRD §9).
   - API failure: retry CTA + empty state; no uncaught promise rejections.

**Exit criteria**

- With valid API key, list populates for Stroudsburg channel; tapping plays video; live banner appears when channel is live (test with known live window or mock in dev).

---

### Phase 2 — Events (WordPress) — **priority**

**Objective:** Events tab backed by WordPress per PRD §5.3, §7.2, **§16.3** (Stroudsburg: page-based, not `tribe_events`).

**Tasks**

1. **Fetch**
   - `GET ${WORDPRESS_ORIGIN}/wp-json/wp/v2/pages/${WORDPRESS_EVENTS_PAGE_ID}` (default **3117** in env example).
   - Parse `title.rendered`, `content.rendered`, `modified` or `date`.

2. **Present**
   - **Challenge:** Elementor HTML is heavy. MVP options (pick one early):
     - **A:** Render sanitized HTML in `ScrollView` via `react-native-render-html` with strict allowlist.
     - **B:** Strip tags for a text-first fallback + “View on website” opening `/events/` in browser.
     - **C:** Hybrid—show title + excerpt + link to full page in browser.

3. **External links**
   - Extract `https://` links from HTML or use known Breeze URLs from config (`BREEZE_SIGNUP_URL_TEMPLATE` or per-event from CMS later).
   - All signup CTAs: `Linking.openURL` in **external** browser (PRD §7.3).

4. **Empty / error**
   - WordPress failure: message + retry (PRD §9).

**Exit criteria**

- Events tab shows real Stroudsburg events page content or an agreed fallback; external links open outside the app.

---

### Phase 3 — About (WordPress)

**Objective:** Service times, description, location from WordPress §5.5.

**Tasks**

1. Config: `WORDPRESS_ABOUT_PAGE_ID` or `WORDPRESS_ABOUT_PAGE_SLUG` (PRD §7.5).
2. Fetch `GET /pages/{id}` or `?slug=…`.
3. Same HTML strategy as Events for consistency.
4. Optional: structured sections if the page uses predictable headings—otherwise single column.

**Exit criteria**

- About matches public site intent; readable on phone and desktop width.

---

### Phase 4 — Give tab (production-hardening)

**Objective:** Center tab exclusively opens **`ENGAGE_GIVE_URL`**; no regressions.

**Tasks**

1. Remove any accidental `Give` screen routes if created during experimentation.
2. Confirm **native** uses `Linking.canOpenURL` when appropriate (iOS/Android).
3. Confirm **web** opens a new tab/window per browser best practice without losing SPA state (or use `location.href` only if product accepts full navigation—prefer `window.open` with noopener).

**Exit criteria**

- Give never mounts a Tamagui “Give page”; always hands off to system browser.

---

## 5. Shell & layout implementation checklist (design doc)

| Requirement | Implementation hint |
|-------------|----------------------|
| Bottom bar fixed on web | Already `position: 'fixed'` in `MainBottomBar` for web—verify z-index under modals |
| Safe area | `useSafeAreaInsets` + `pb` on bar; content `ScrollView` / `HomeShell` bottom reserve |
| Max width ~960px | `PageContainer` + `maxW={960}` on main column (feed already uses 960) |
| Give visual emphasis | Tamagui: `scale`, `bg="$blue10"`, or elevated circle in tab row |
| No `100vw` horizontal scroll | Audit sermon detail and YouTube iframe wrappers |
| Overflow not a 5th tab | Keep menu in `MainHeaderMenu` only |

---

## 6. Configuration and secrets

### 6.1 Variables (conceptual—mirror PRD §7.5)

| Variable | Purpose |
|----------|---------|
| `VITE_CHURCH_DISPLAY_NAME` | Optional UI title |
| `VITE_YOUTUBE_API_KEY` | Client-side API key (or proxy later) |
| `VITE_YOUTUBE_CHANNEL_ID` | `UC…` channel id |
| `WORDPRESS_ORIGIN` | `https://host` no trailing slash |
| `VITE_WORDPRESS_ORIGIN` | Duplicate for client if needed—**or** read from single `import.meta.env` pattern consistently |
| `WORDPRESS_EVENTS_PAGE_ID` | e.g. 3117 |
| `WORDPRESS_ABOUT_PAGE_ID` / `SLUG` | About target |
| `VITE_ENGAGE_GIVE_URL` or `ENGAGE_GIVE_URL` | Give tab—ensure **client bundle** can read it |

**Consistency rule:** Audit whether One/Vite exposes only `VITE_*` to the client bundle; align all **runtime-needed** church vars with that rule and update `.env.production.example` + README table.

### 6.2 Git hygiene

- **Never commit** real `YOUTUBE_API_KEY` or secrets—only `.env.production.example` placeholders.
- Stroudsburg **reference IDs** in docs/PRD are fine; **avoid duplicating them as string literals** in TS—read from env with documented defaults in **example env only**.

---

## 7. Testing strategy

| Layer | What to run |
|-------|-------------|
| Unit | Pure functions: URL building, date format, playlist parsing, HTML link extraction |
| Manual | Chrome device toolbar: tabs, Give external, sermon playback, live banner |
| Native | iOS/Android when validating `Linking`, safe areas, YouTube iframe |
| Integration | Existing Playwright auth tests may not apply; add smoke for `/home/sermons` when test env stable |

**Note:** Template `test:integration` may assume auth/backend—scope new tests to church routes behind `VITE_DEMO_MODE` or dedicated test profile.

---

## 8. Risks, edge cases, and mitigations

| Risk | Mitigation |
|------|------------|
| YouTube quota exhaustion | Cache live checks; minimize `search` calls; paginate sermons |
| CORS / browser API restrictions | If blocked, fall back to **server proxy route** under `app/api` |
| WordPress HTML unusable on mobile | Fallback to external browser for full page (PRD §16.3 options) |
| Give tab “active” state confusing | Keep previous tab selected; optional toast “Opening browser…” |
| Template auth/settings confuse testers | README + in-app copy clarify MVP is anonymous |

**PRD §9 edge cases:** implement offline and API error UI on Sermons and Events at least.

---

## 9. Open questions (track during implementation)

From PRD §14 and §16.3—resolve with product owner as needed:

- **Events UX:** HTML render vs browser parity vs curated config list until structured feed exists.
- **Cache strategy** for WordPress and YouTube (TTL, stale-while-revalidate).
- **About page** slug/id final for Stroudsburg.
- **Homepage / announcements** tab—explicitly out of MVP unless added later (PRD §12).

---

## 10. Future work (post-MVP, do not block prototype)

- Push notifications, saved sermons, accounts (PRD §12).
- Breeze REST behind server + church API key (PRD §7.3).
- EAS build matrix / remote config for multi-tenant branding.
- Optional: proxy YouTube key; server-side caching for popular endpoints.

---

## 11. Appendix: reference routes and IDs (Stroudsburg)

**Source of truth:** PRD §16. Use **env** in app code.

| Item | Reference |
|------|-----------|
| WordPress origin | `https://www.stroudsburgwesleyan.org` |
| Events page id | 3117 (`/events/`) |
| YouTube channel id | `UCNHOf9LGimGtBWO8XLCqO6g` |
| Engage Give URL | `https://engage.suran.com/stroudsburg/s/give/gift/all-giving` |

---

## 12. Suggested PR sequence (optional)

1. **PR1 — Phase 0:** Shell + routes + Give external + placeholders.
2. **PR2 — Phase 1:** YouTube feature module + UI.
3. **PR3 — Phase 2:** WordPress Events.
4. **PR4 — Phase 3:** About.
5. **PR5 — Polish:** branding constants, error states, README updates, env template completeness.

This keeps reviews small and demoable after each merge.

---

*End of technical plan.*
