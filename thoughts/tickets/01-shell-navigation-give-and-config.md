# Ticket 01 — Shell, four-tab navigation, Give (center action), and config foundation

**Status:** Completed  
**Depends on:** — (start here)  
**Plan:** [`../plans/04-04-2026-church-app-prototype-technical-plan.md`](../plans/04-04-2026-church-app-prototype-technical-plan.md) (Phase 0)  
**PRD:** [`../prds/04-03-2026-swc-church-app-prd.md`](../prds/04-03-2026-swc-church-app-prd.md) §4, §5.4, §7.5  
**Design:** [`../designs/04-04-2026-app-shell-layout.md`](../designs/04-04-2026-app-shell-layout.md)

## Summary

Replace the template **Home / Profile** tab model with **Sermons / Events / Give / About**. Implement the **Give** tab as a **center, visually emphasized control** that opens `ENGAGE_GIVE_URL` in the **system browser only** (no Give screen, no webview). Add route files and placeholders for the three in-app tabs; introduce a small **church config** module and env surface so later tickets do not hardcode tenant values.

## Scope

- **Routes:** Add `sermons`, `events`, `about` under the home tabs area; redirect or replace `feed` so default entry is **Sermons** (`/home/sermons` or equivalent One paths). Update native stack layout (`(tabs)/_layout.native.tsx`) if required.
- **`NavigationTabs.tsx`:** Four slots—three `Link`-based tabs + **Give** as `Pressable` + `Linking.openURL` (native) / appropriate web behavior. Center Give: stronger size/color/FAB-style emphasis per design doc.
- **Active tab:** Give must **not** navigate to a stack route; keep “active” highlight on the last real tab (or agreed UX).
- **`MainBottomBar` / `HomeShell`:** No regression—fixed bottom bar on web, safe areas, content not hidden under chrome (~960px main column preserved).
- **`MainHeaderMenu`:** Remains overflow only (theme, settings, auth when relevant)—not a fifth tab. Trim or relabel distracting demo-only entries if needed.
- **Config:** Add `src/config/churchEnv.ts` (or similar) reading `import.meta.env` / documented `VITE_*` keys for `ENGAGE_GIVE_URL`, optional `VITE_CHURCH_DISPLAY_NAME`, and stubs for WordPress/YouTube keys used in follow-on tickets. Update `.env.production.example` for any new `VITE_*` variables.
- **Constants:** Wire display name from env where practical (`src/constants/app.ts` or replace usage gradually).

## Out of scope (later tickets)

- YouTube API, sermon list, player (Ticket 02).
- WordPress content for Events / About (Tickets 03–04).

## Acceptance criteria

- [ ] Bottom bar shows **Sermons | Events | Give | About** in that order; Give is visually distinct (center emphasis).
- [ ] Tapping **Give** opens the configured giving URL in the **external** browser; there is **no** Give route/screen.
- [ ] **Sermons**, **Events**, and **About** each render a scrollable placeholder (PageContainer, max width ~960px) with clear placeholder copy.
- [ ] App default route lands on **Sermons**, not the old feed.
- [ ] `ENGAGE_GIVE_URL` (and new `VITE_*` vars) documented in `.env.production.example`; local dev path documented in a one-line comment or README pointer if needed.
- [ ] Web: no horizontal scroll from shell layout; native: safe area insets respected on tab bar.

## Estimate

**M** (navigation + One routing touchpoints + env plumbing)
