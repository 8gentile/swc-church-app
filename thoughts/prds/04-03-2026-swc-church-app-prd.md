# SWC Church App – Product Requirements Document (PRD)

**Version:** v2.1 (Auth intent: identity for signup; no church app DB)  
**Last Updated:** April 2026  
**Author:** Nicholas Gentile  
**Status:** Active  

---

# 1. Product Summary

The SWC Church App is a lightweight React Native mobile application that unifies sermons, live streaming, events, and giving into a single, intuitive experience.

**First implementation** is for **Stroudsburg Wesleyan Church** ([stroudsburgwesleyan.org](https://www.stroudsburgwesleyan.org/)); the product is designed as a **config-driven, white-label shell** so other congregations (e.g. across Wesleyan districts) can reuse the same app with different branding, content endpoints, and store listings — not a one-off hardcoded fork. Verified Stroudsburg reference values (WordPress, **YouTube**, Engage give URL): **§16**. Those settings are **already wired in this repository** — see **§7.5** (`.env`, `.env.production.example`).

The app is intentionally **frontend-only**, acting as a clean interface layer over:

- YouTube (sermons + live streaming)
- WordPress (content + events)
- Breeze (event signups via external links; **no Breeze API in MVP** — **§7.3**)
- Engage (donations via external browser)

**Prototype:** church content is **public**; **login is optional**. The first usable build can be **fully anonymous** (same tabs for everyone). **Sign-in** (OAuth via existing Better Auth) is for **identity** — e.g. **email** for event-signup UX — not a church-owned content database (**§6**).

---

# 2. Core Philosophy

- No backend **for church content** in MVP (YouTube, WordPress, links)
- **Optional authentication** — not required to use the app; when enabled, supports **email-aware** flows (event signup) without building a separate church app DB (**§6**)
- Use best-in-class external systems
- Keep UI simple, fast, and native-feeling
- Optimize for **Sunday usage + weekly engagement**

---

# 3. MVP Scope (Build This First)

## Prototype constraint

- **Anonymous-first:** users can use the app **without** signing in. **Optional** sign-in provides **identity** (e.g. email) for **event signup** and similar — not a requirement for sermons/events browsing. API keys remain build-time secrets (**§6**).

## Users can:

- Watch past sermons
- Join live service (if active)
- View upcoming events
- Sign up for events
- Donate via external link
- Read church info

---

# 4. Navigation (Critical)

## Bottom Tabs (Final)

1. Sermons
2. Events
3. **Give (CENTER TAB)**
4. About

### Notes
- Give tab is centered and visually emphasized
- Give opens **external browser**, NOT webview

---

## 4.1 Tabs ↔ APIs & screens (MVP)

| Tab (order) | In-app **screen**? | What it uses | API / integration |
|-------------|-------------------|----------------|---------------------|
| **1 — Sermons** | Yes | List of sermon videos, embedded player; optional **live** banner when service is live | **YouTube Data API v3** — `channels`, `playlistItems` (uploads), `search` (`eventType=live` / `upcoming`) |
| **2 — Events** | Yes | Events content for the congregation | **WordPress REST API** — Stroudsburg: primarily `GET /wp/v2/pages/3117` (canonical web page [`/events/`](https://www.stroudsburgwesleyan.org/events/)); see **§16**. Sign-up CTAs use **published HTTPS URLs** (often Breeze) in the **external browser** — **no Breeze API** (**§7.3**). |
| **3 — Give** (center) | **No** — tab is a **one-tap action** only | Opens donation / giving URL | **None** — configurable `ENGAGE_GIVE_URL` (or church giving URL) via **Linking** / system browser |
| **4 — About** | Yes | Service times, description, location | **WordPress REST API** — e.g. `GET /wp/v2/pages` with slug or known page IDs (**§7.2**, **§16**) |

**Summary:** Only **YouTube** and **WordPress** expose APIs the app calls in MVP. **Give** is not a screen and not an API — it is an external link. **Breeze** is never an API in MVP (links only).

---

## 4.2 Build phases (prioritized)

Work is ordered so **Sermons (YouTube)** and **Events (WordPress / events page)** land before polish on About and Give wiring.

| Phase | Focus | Deliverables |
|-------|--------|----------------|
| **0 — Shell** | App foundation | React Native + Tamagui, tab navigation (four tabs), env/config for `WORDPRESS_ORIGIN`, `YOUTUBE_*` |
| **1 — Sermons + live (priority)** | YouTube | Sermons list + player; live / upcoming banner using YouTube `search` + `eventType` (**§5.1–5.2**, **§7.1**) |
| **2 — Events (priority)** | WordPress | Events tab: fetch and present content from WordPress (Stroudsburg: **`GET .../wp/v2/pages/3117`** aligned with [`/events/`](https://www.stroudsburgwesleyan.org/events/)); external links for signup (**§5.3**, **§16**) |
| **3 — About** | WordPress | About screen from `GET /wp/v2/pages` (slug/ID per **§16** or config) |
| **4 — Give tab** | Link only | Center tab opens `ENGAGE_GIVE_URL` in system browser — **no new screen** (**§5.4**) |

Detailed task lists and Definition of Done remain in **§10** and **§11** (updated to match this ordering).

---

# 5. Feature Specifications

---

## 5.1 Sermons (Primary Screen)

### Data Source
YouTube Data API

### Requirements
- Fetch videos from channel
- Sort by newest
- Display:
  - Thumbnail
  - Title
  - Date

### Interaction
- Tap → opens embedded YouTube player

### Technical note
Prefer **`playlistItems.list`** on the channel’s **uploads playlist** (from **`channels.list`** → `relatedPlaylists.uploads`) for a stable, ordered sermon archive; **`search.list`** by `channelId` is acceptable with caching (see **§7.1**).

---

## 5.2 Live Streaming (High Priority)

### Behavior
- On app load:
  - Call YouTube API for live broadcast
- If live:
  - Show banner at top:
    - 🔴 LIVE NOW
    - “Join Sunday Service”
  - Clicking opens live player

### API
```
search?part=snippet&channelId=CHANNEL_ID&eventType=live&type=video
```

### Fallback
- If no live → hide banner

---

## 5.3 Events

### Data Source
WordPress REST API (exact collection depends on the site’s plugins — e.g. `tribe_events` or a custom post type; see **§7.2**). For the **Stroudsburg** production site, public REST does **not** expose a dedicated events CPT; the **Events** screen may need to consume the **events page** resource, linked data, or a follow-up integration — see **§16**.

### Requirements
- List events
- Show:
  - Title
  - Date
  - Description

### Interaction
- Tap → event detail
- CTA: “Sign Up”
  - Opens Breeze link (external browser)

---

## 5.4 Give (CENTER TAB)

### Behavior
- **Not a screen:** the Give **tab** triggers a single action — open the configured giving URL in the **system browser**. There is no in-app Give page or webview.
- Opens Engage (or church-configured) donation portal URL

### Critical Requirement
- MUST open in:
  - Native browser (Safari/Chrome)
- NOT inside app (no webview)

### UX Goal
- Always accessible
- One tap to give

---

## 5.5 About

### Data Source
WordPress

### Content
- Service times
- Church description
- Location

---

# 6. Technical Architecture

## Authentication & identity

### What “no DB for the app” means here

- There is **no separate church-app database** for sermons, events, giving, or custom business logic — content and actions stay on **YouTube, WordPress, Breeze, Engage** (**§7**).
- The **Takeout** stack may still use **Postgres** only for **Better Auth** (sessions, users, OAuth accounts). That is **identity infrastructure**, not a “church CMS” — treat it as optional plumbing if you enable sign-in.

### Intended use of sign-in (when enabled)

- **Goal:** have a **logged-in user** with **email** (and name when the IdP provides it) so flows like **event signup** are easier: show “signed in as …”, pre-fill forms where possible, or deep-link to Breeze with fewer manual steps — **without** building a church-specific user table for content.
- **Breeze / Engage** remain **external**; users may still authenticate there in the **browser**. The app’s session mainly supplies **identity context** (email) for UX and any future prefill/query patterns, not a second source of truth for registrations.

### Prototype stance

- **MVP can ship** with **no** required login (anonymous use) — **§3**, **§6** (repository) — while the template keeps **Better Auth** wired for later OAuth (**Google / Apple / Facebook**, etc.).
- **Styling** of auth screens is **last**; **functionality** (social sign-in, session) can be layered when prioritized.

## Frontend
- React Native
- Tamagui UI kit

## Repository stack (Tamagui Takeout Free)

Implementation lives in this **Takeout Free** codebase ([Tamagui Takeout](https://tamagui.dev/takeout)): **One** (universal routing, `app/`), **Tamagui**, React Native for web + iOS + Android, and (in the template) **Better Auth**, **Zero** sync, **Drizzle** / Postgres, and `app/api/*`.

- **MVP / prototype:** Church features use **client-side** calls to YouTube and WordPress plus external links (Give, Breeze) — **§7**. You do **not** need a **church-owned** DB for that slice; **optional** sign-in uses the template’s auth store for **identity** (e.g. email for event signup UX), not for sermon/event **content** (**Authentication & identity** above).
- **Keep the boilerplate:** Auth, Zero, and the backend remain valuable for **§12** (accounts, saved sermons, push, server-side Breeze, analytics). No requirement to delete them for the prototype; env vars for the church tenant are already in **`.env`** / **`.env.production.example`** (**§7.5**).
- **Project entry:** See repository **`README.md`** (section *SWC Church App*) for a template ↔ PRD mapping table.
- **Local dev (immediate):** Run **`bun dev`**, open the app in **Chrome**, use **DevTools → device toolbar** for mobile-ish viewport. No iOS/Android emulator required for layout and most flows; simulators and real devices when validating native-only behavior.

## Libraries
- react-native-youtube-iframe
- axios or fetch

---

## Data Flow (No Backend)

| Feature | Source | Method |
|--------|--------|--------|
| Sermons | YouTube Data API v3 (`playlistItems` / `search`) | Direct |
| Live / upcoming | YouTube Data API v3 (`search` + `eventType`) | Direct |
| Events | WordPress REST (`/wp-json/wp/v2/…`) | Direct |
| Signup | Breeze | External HTTPS (config URLs only in MVP; **no Breeze REST** until a later phase — **§7.3**) |
| Give | `ENGAGE_GIVE_URL` (CDM+ Engage or church giving URL) | External browser — **no in-app API** |

All church-specific hosts and IDs come from **configuration** (see **§7.5**), including **`ENGAGE_GIVE_URL`** for the center Give tab.

---

# 7. API Integration Details

All external identifiers (church YouTube channel, WordPress site, Breeze **signup** URLs, Engage URL, branding) are **configuration-driven** so the same codebase can target another congregation or district without fork-per-church logic. See **§7.5 Church & tenant configuration**. Breeze **API** credentials are not public and are **out of scope** for MVP (**§7.3**).

**Base URLs**

| Provider | Base URL (MVP) |
|----------|----------------|
| YouTube Data API v3 | `https://www.googleapis.com/youtube/v3/` |
| WordPress REST API | `https://{WORDPRESS_ORIGIN}/wp-json/wp/v2/` |
| Engage / Give | **No API** — single configurable URL, `ENGAGE_GIVE_URL` (full `https://…` to CDM+ Engage or other giving portal). Stroudsburg reference: `https://engage.suran.com/stroudsburg/s/give/gift/all-giving` — **§7.4**, **§16.2a** |
| Breeze (MVP) | N/A — configurable **public** HTTPS signup/form links only (no API) |
| Breeze REST (later phase) | `https://{subdomain}.breezechms.com/api/` — **blocked until church provides API access** (**§7.3**) |

---

## 7.1 YouTube Data API v3

Authentication: **API key** query parameter `key` (restrict key by Android/iOS app package + YouTube API in Google Cloud Console).

| Use case | HTTP method | Resource | Notes |
|----------|-------------|----------|--------|
| Resolve uploads playlist (recommended for sermon list) | GET | `channels` | `part=contentDetails`, `id={CHANNEL_ID}` → read `contentDetails.relatedPlaylists.uploads` |
| List sermon videos (paginated) | GET | `playlistItems` | `part=snippet,contentDetails`, `playlistId={UPLOADS_PLAYLIST_ID}`, `maxResults` (e.g. 50), `pageToken` |
| Alternative: search channel for videos | GET | `search` | `part=snippet`, `channelId={CHANNEL_ID}`, `type=video`, `order=date`, `maxResults` — simpler but higher quota cost per call |
| Detect **live** stream | GET | `search` | `part=snippet`, `channelId={CHANNEL_ID}`, `eventType=live`, `type=video` |
| Detect **upcoming** scheduled stream | GET | `search` | Same as live, `eventType=upcoming` (optional banner: “Starting soon”) |

**Example — live detection (conceptual)**

```
GET https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={CHANNEL_ID}&eventType=live&type=video&key={YOUTUBE_API_KEY}
```

**Quota:** Each `search.list` and `playlistItems.list` / `channels.list` call consumes quota units; cache responses briefly (e.g. 1–5 minutes for live/upcoming checks) to stay under limits.

**Config inputs:** `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` (and optionally a cached `UPLOADS_PLAYLIST_ID` if resolved once at startup).

**Stroudsburg — public web (context, not a substitute for `channelId` in API calls):** [@stroudsburgwesleyanchurch8704](https://www.youtube.com/@stroudsburgwesleyanchurch8704) · [Live / upcoming / past streams](https://www.youtube.com/@stroudsburgwesleyanchurch8704/streams). Resolve **`YOUTUBE_CHANNEL_ID`** (the `UC…` id) via `channels.list` with `forHandle=stroudsburgwesleyanchurch8704` or from the channel page source — **§16.1a**.

---

## 7.2 WordPress REST API

Base path: **`/wp-json/wp/v2/`** on the church’s WordPress origin (must be reachable over HTTPS; no auth for public read in typical setups).

| Use case | Endpoint | Query / notes |
|----------|----------|----------------|
| Blog posts / news (if needed) | `GET /posts` | `per_page`, `page`, `_embed` for featured media |
| Static “About” content | `GET /pages` or `GET /pages/{id}` | Often one page slug, e.g. `slug=about` |
| Events | **TBD per site** | Many churches use a plugin CPT, e.g. The Events Calendar exposes `GET /tribe_events` (if REST enabled) or custom routes |
| Media | `GET /media/{id}` | If resolving thumbnails from `_embedded` |

**Config inputs:** `WORDPRESS_ORIGIN` (scheme + host, no trailing slash), optional `WORDPRESS_EVENTS_PATH` (e.g. `tribe_events` or full custom path segment), optional `WORDPRESS_ABOUT_PAGE_ID` or `WORDPRESS_ABOUT_SLUG`, optional `WORDPRESS_EVENTS_PAGE_ID` when events are a **page** rather than a CPT.

### Stroudsburg reference (verified)

Public site: [stroudsburgwesleyan.org](https://www.stroudsburgwesleyan.org/). WordPress does **not** use a global “site ID”; the **origin URL** is the identifier. Discovery: `GET https://www.stroudsburgwesleyan.org/wp-json/`. Core content: `https://www.stroudsburgwesleyan.org/wp-json/wp/v2/`. Concrete page IDs and events caveat: **§16**.

---

## 7.3 Breeze ChMS

### MVP — public links only (no Breeze API)

- **No Breeze REST calls** in the client and **no** server-side Breeze integration in MVP.
- Event signup uses **full HTTPS URLs** that the church already publishes (forms, event registration, etc.), opened in the **system browser** (same pattern as Give). Those URLs typically contain the church’s `*.breezechms.com` hostname, but the app does **not** need a separate “Breeze API” integration to ship.
- **Config inputs:** `BREEZE_EVENT_SIGNUP_BASE_URL` and/or **per-event** URLs (or WordPress-sourced links in post content/meta). Staff can paste links into config or CMS without exposing any API key.

### Why Breeze REST is deferred

- Breeze **REST API access is not public**: it requires an **API key** from the church’s Breeze account (**Extensions** in Breeze), which only **church administrators** can provide.
- Until there is coordination with church leadership and a decision on **backend** or **secure proxy** (keys must never ship in a mobile app), **all Breeze API use is a later phase** — not part of the prototype or MVP build.

### Later phase (after church access + engineering design)

When unblocked, Breeze exposes REST at **`https://{subdomain}.breezechms.com/api/`** (e.g. `/people`, `/events`, `/forms`). **Do not embed API keys in a public client.** Any integration belongs in a **backend or serverless** layer with secrets, plus explicit privacy/compliance review.

---

## 7.4 Engage (donations)

- **No API for MVP.** Single configurable HTTPS URL opened in the external browser.
- **Config input:** `ENGAGE_GIVE_URL` (or branded giving provider URL).
- **Stroudsburg (reference):** [`https://engage.suran.com/stroudsburg/s/give/gift/all-giving`](https://engage.suran.com/stroudsburg/s/give/gift/all-giving) — CDM+ Engage; use as default in docs/env for the first tenant (**§16**).

---

## 7.5 Church & tenant configuration (dynamic, not hardcoded)

The app must **not** hardcode “Stroudsburg” strings, channel IDs, or domains in source. Treat the deployment as a **white-label shell** (same idea as a network “ABC”-style app): one codebase, **per-build or per-environment** configuration.

**Recommended configuration surface (conceptual)**

| Variable | Purpose |
|----------|---------|
| `CHURCH_SLUG` | Internal id (e.g. `stroudsburg-wesleyan`) |
| `CHURCH_DISPLAY_NAME` | UI: “Stroudsburg Wesleyan Church” |
| `BRAND_PRIMARY`, `BRAND_ACCENT`, … | Tamagui tokens / theme overrides |
| `ASSET_LOGO_URL` or bundled asset key | Logo |
| `YOUTUBE_API_KEY` | Google Cloud API key |
| `YOUTUBE_CHANNEL_ID` | Target channel (`UC…` id; Stroudsburg handle context: **§16.1a**) |
| `WORDPRESS_ORIGIN` | `https://…` (Stroudsburg example: `https://www.stroudsburgwesleyan.org`) |
| `WORDPRESS_EVENTS_REST_SEGMENT` | e.g. `tribe_events` or plugin-specific; omit if events come from a **page** (see **§16**) |
| `WORDPRESS_EVENTS_PAGE_ID` | Optional; e.g. Stroudsburg **3117** when using `GET /pages/{id}` for the Events screen |
| `BREEZE_SIGNUP_URL_TEMPLATE` or event-level URLs | As needed |
| `ENGAGE_GIVE_URL` | Donation entry point (Stroudsburg example: `https://engage.suran.com/stroudsburg/s/give/gift/all-giving`) |
| `WORDPRESS_HOME_PAGE_ID` | Optional; Stroudsburg **2403** (static front page) |

**Delivery options:** `.env` / `app.config` for dev; **Expo / RN** `extra` + EAS **build profiles** per congregation; or a small **remote config JSON** (read-only bucket) for non-secret values only — **never** put API keys in remote public JSON.

**Already done in this codebase (implementation):** Stroudsburg-oriented values for **`YOUTUBE_API_KEY`**, **`YOUTUBE_CHANNEL_ID`**, **`WORDPRESS_ORIGIN`**, **`WORDPRESS_EVENTS_PAGE_ID`**, **`WORDPRESS_HOME_PAGE_ID`**, **`ENGAGE_GIVE_URL`**, and optional About placeholders are present in **`.env`** (gitignored — includes secrets such as the YouTube key) and mirrored or templated in **`.env.production.example`** (committed). **`.env.development`** points contributors at `.env` for church-app variables. Follow the same pattern for other tenants: per-environment files, never commit API keys to tracked files.

**Scaling narrative:** Stroudsburg Wesleyan Church is the initial tenant; the same architecture supports other **Wesleyan** (or any) congregations by swapping config, assets, and store listings — not by maintaining separate forks per district.

---

## 7.6 API summary table (MVP)

| Feature | Fetch | Method |
|--------|--------|--------|
| Sermons | YouTube `playlistItems` + `channels` (or `search`) | GET |
| Live / upcoming | YouTube `search` (`eventType`) | GET |
| Events | WordPress REST (CPT/route per site) | GET |
| Event signup | Browser → Breeze URL | External |
| Give | Browser → Engage URL | External |
| About | WordPress `pages` / `posts` | GET |

---

# 8. UI/UX Requirements

- Fast load (<2s target)
- Large tap areas
- Minimal text clutter
- Consistent spacing
- Native feel (not web wrapper)

---

# 9. Edge Cases

- No internet → show fallback message
- YouTube API fails → show cached or empty state
- WordPress fails → hide events section
- Live stream not found → no banner

---

# 10. Build Plan (Execution Order)

Aligned with **§4.2** (Sermons + Events before About + Give wiring).

## Phase 0 — Shell
- Setup React Native app + Tamagui
- Tab navigation (four tabs); placeholder content where needed
- Config: `WORDPRESS_ORIGIN`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `ENGAGE_GIVE_URL`

## Phase 1 — Sermons + live (YouTube) — **priority**
- Sermons list from YouTube Data API v3 (`playlistItems` / `channels` — **§7.1**)
- Embedded video player
- Live (and optionally upcoming) banner via `search` + `eventType` (**§5.2**)

## Phase 2 — Events (WordPress) — **priority**
- Events tab: WordPress REST — Stroudsburg targets events page **`GET /wp/v2/pages/3117`** (web parity: [`/events/`](https://www.stroudsburgwesleyan.org/events/)) — **§16**
- Sign-up / external actions: open configured or extracted URLs in system browser (Breeze links in MVP are URLs only — **§7.3**)

## Phase 3 — About (WordPress)
- About screen: WordPress pages (slug/ID per config — **§7.2**, **§16**)

## Phase 4 — Give (center tab, no screen)
- Wire center tab to `ENGAGE_GIVE_URL`; **external browser only** — **§5.4**

---

# 11. Definition of Done (MVP)

App is complete when:

- Sermons load and play
- Live stream works (banner + player)
- Events tab shows WordPress-backed content and can open external signup/giving links as designed
- Give (center tab) opens the external donation URL — **no in-app Give screen**
- About reflects WordPress content
- App is usable by non-technical users

---

# 12. Future Roadmap

## Phase 2
- Push notifications (live + events)
- Featured content

## Phase 3
- User accounts
- Saved sermons

## Phase 4
- Native backend (optional)

## Breeze API (later — not MVP)
- Requires church-provided API access (Breeze **Extensions**)
- Server-side or proxy only; optional use cases: synced event lists, forms metadata — **only after** stakeholder conversation

## White-label / multi-tenant
- EAS (or CI) build matrix: one binary per church **or** one binary with remote config for non-secret theming (product decision)
- Documented env template per tenant (`WORDPRESS_ORIGIN`, `YOUTUBE_CHANNEL_ID`, etc.); Stroudsburg example rows in **§16**
- Asset packs (logo, splash) per congregation

---

# 13. Success Metrics

- Weekly active users
- Sermon plays
- Live stream joins
- Event signups
- Donation clicks

---

# 14. Open Questions

- Cache strategy for content?
- Webview vs external for Breeze? (PRD: external for Give; align Breeze signup the same way)
- **Breeze REST / API:** **Deferred** — not public; needs church admins; see **§7.3**
- Add homepage later?
- **Stroudsburg events UX:** No `tribe_events` (or similar) in public REST — confirm MVP approach (page `3117` + parsing / manual CMS workflow / Breeze-only list) — see **§16**
- Single multi-tenant app vs **one store listing per church** (branding and App Store policies)

---

# 15. Final Note

This app succeeds if:

It becomes the **default way people engage with the church weekly**.

Not by adding features, but by removing friction.

---

# 16. Reference tenant — Stroudsburg Wesleyan Church

This section records **verified public URLs and REST facts** for Stroudsburg (WordPress, YouTube, Engage) so implementers have concrete context. Other tenants replace these via configuration (**§7.5**); do not hardcode in app source — treat the tables below as **documentation defaults** for the first build.

## 16.1 Identity and discovery

| Item | Value |
|------|--------|
| Public website | `https://www.stroudsburgwesleyan.org/` |
| `WORDPRESS_ORIGIN` | `https://www.stroudsburgwesleyan.org` (no trailing slash) |
| REST discovery (index) | `GET https://www.stroudsburgwesleyan.org/wp-json/` |
| `wp/v2` base | `https://www.stroudsburgwesleyan.org/wp-json/wp/v2/` |

WordPress REST identifies the install by **hostname**, not a separate numeric site id. The index returns site metadata (e.g. `name`: “Stroudsburg Wesleyan Church”, `url`, `page_on_front`).

## 16.1a YouTube — public channel & streams (reference)

These are the canonical **web** URLs for the church’s YouTube presence. The app uses the **YouTube Data API v3** with `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID` (**§7.1**). The **`UC…` channel id** is not the same as the `@handle` URL; for Stroudsburg it is resolved below (also via `channels.list` + `forHandle=stroudsburgwesleyanchurch8704`).

| Config / resource | Value |
|-------------------|--------|
| `YOUTUBE_CHANNEL_ID` | `UCNHOf9LGimGtBWO8XLCqO6g` |
| Channel (@handle) | [`https://www.youtube.com/@stroudsburgwesleyanchurch8704`](https://www.youtube.com/@stroudsburgwesleyanchurch8704) |
| **Streams** (live, upcoming, past broadcasts) | [`https://www.youtube.com/@stroudsburgwesleyanchurch8704/streams`](https://www.youtube.com/@stroudsburgwesleyanchurch8704/streams) |

## 16.2 Useful page IDs (examples)

Resolved via `GET /wp/v2/pages?slug={slug}` or from `GET /wp-json/` (`page_on_front`).

| Page | ID | Slug | Public URL |
|------|-----|------|------------|
| Static front page (home) | **2403** | `wesleyan-church-home` | `/` |
| Events | **3117** | `events` | `/events/` |
| Donate (WordPress marketing page; Give tab uses `ENGAGE_GIVE_URL` below) | **3008** | `donate` | [`/donate/`](https://www.stroudsburgwesleyan.org/donate/) |

## 16.2a Giving — Engage (Give tab)

| Config key | Stroudsburg reference value |
|------------|----------------------------|
| `ENGAGE_GIVE_URL` | [`https://engage.suran.com/stroudsburg/s/give/gift/all-giving`](https://engage.suran.com/stroudsburg/s/give/gift/all-giving) |

The center **Give** tab opens this URL in the **system browser** (not a webview). The WordPress **Donate** page (`/donate/`, id 3008) is separate web content; app giving should follow `ENGAGE_GIVE_URL` unless the church standardizes on one link.

Example calls:

- `GET .../wp/v2/pages/2403` — homepage content (Elementor-heavy HTML in `content.rendered`)
- `GET .../wp/v2/pages/3117` — Events page payload (same note)

## 16.3 Events implementation note (important)

On this host, `GET /wp/v2/types` exposes standard types (`post`, `page`, …) plus theme/builder-related types; there is **no** public `tribe_events` (or similar) collection in the enumerated types. The **Events** tab therefore cannot assume a CPT feed without a plugin change or another data source.

**Plausible MVP paths (product choice):**

- Fetch `GET /wp/v2/pages/3117` and derive UX from structured fields, links in HTML, or a agreed-upon block format; or
- Open the canonical **events** web URL in the external browser for parity; or
- Maintain a minimal curated list in app config until a structured feed exists; or
- Add a thin backend later that parses or syncs events.

Re-validate types and routes if the church enables a new events plugin; use `GET /wp-json/` and `GET /wp/v2/types` as the source of truth.

## 16.4 Related site links (non-API)

The marketing site surfaces [Donate](https://www.stroudsburgwesleyan.org/donate/), [Events](https://www.stroudsburgwesleyan.org/events/), and social links (e.g. YouTube in the footer). Align **`YOUTUBE_CHANNEL_ID`** with the church’s official channel (**§16.1a** — [streams](https://www.youtube.com/@stroudsburgwesleyanchurch8704/streams)). For the in-app **Give** tab, use **`ENGAGE_GIVE_URL`** (**§16.2a**): [CDM+ Engage — all giving](https://engage.suran.com/stroudsburg/s/give/gift/all-giving) — rather than the WordPress Donate page, unless the church asks to unify on a single URL.

