# Ticket 03 — Events tab: WordPress events content and external sign-up links

**Status:** Draft  
**Depends on:** Ticket 01 (route + env for `WORDPRESS_ORIGIN`, `WORDPRESS_EVENTS_PAGE_ID`)  
**Plan:** [`../plans/04-04-2026-church-app-prototype-technical-plan.md`](../plans/04-04-2026-church-app-prototype-technical-plan.md) (Phase 2)  
**PRD:** [`../prds/04-03-2026-swc-church-app-prd.md`](../prds/04-03-2026-swc-church-app-prd.md) §5.3, §7.2, §16.3

## Summary

Implement the **Events** tab by fetching the configured WordPress **events page** (Stroudsburg: `GET /wp/v2/pages/3117` — parity with public `/events/`). Present `title` and `content` in-app; ensure **sign-up and other HTTPS CTAs** open in the **system browser** (Breeze and similar—**no Breeze API** in MVP).

## Scope

- **Fetch:** `GET ${WORDPRESS_ORIGIN}/wp-json/wp/v2/pages/${WORDPRESS_EVENTS_PAGE_ID}` (no auth for public read).
- **Rendering:** Choose and implement one approach (document in PR or code comment):
  - Sanitized HTML (e.g. `react-native-render-html` with strict allowlist), **or**
  - Text-first fallback + “View full events” opening canonical site URL in browser, **or**
  - Hybrid (title + excerpt + external link).
- **Links:** Detect `https://` links in content (or use structured blocks if available) and route taps through `Linking.openURL` / external browser—not in-app webview.
- **States:** Loading, error, empty; retry on failure (PRD §9).

## Out of scope

- Breeze REST, server-side scraping, or custom events CPT unless the site exposes it (revisit later).
- About page (Ticket 04).

## Acceptance criteria

- [ ] Events tab shows real content from the configured page id for Stroudsburg (or env-driven tenant).
- [ ] User can read event-related information without signing in.
- [ ] Tapping sign-up / external registration links opens the **external** browser (same pattern as Give).
- [ ] Failure modes (network, 404, parse issues) show a clear message, not a blank screen.

## Notes

PRD §16.3: this host may not expose `tribe_events` in public REST; page-based MVP is expected. If HTML is unusable on small screens, product may prefer opening `/events/` externally—capture that decision in implementation notes.

## Estimate

**M–L** (depends on HTML rendering choice)
