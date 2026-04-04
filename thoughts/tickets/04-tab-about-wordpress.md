# Ticket 04 — About tab: WordPress page (service times, description, location)

**Status:** Draft  
**Depends on:** Ticket 01 (route + `WORDPRESS_ORIGIN`); reuses rendering approach from Ticket 03 where possible  
**Plan:** [`../plans/04-04-2026-church-app-prototype-technical-plan.md`](../plans/04-04-2026-church-app-prototype-technical-plan.md) (Phase 3)  
**PRD:** [`../prds/04-03-2026-swc-church-app-prd.md`](../prds/04-03-2026-swc-church-app-prd.md) §5.5, §7.2

## Summary

Implement the **About** tab from WordPress: service times, church description, and location-style content, driven by **`WORDPRESS_ABOUT_PAGE_ID`** or **`WORDPRESS_ABOUT_PAGE_SLUG`** (config only—no hardcoded Stroudsburg ids in source).

## Scope

- **Fetch:** `GET /wp/v2/pages/{id}` or `GET /wp/v2/pages?slug=...` per config.
- **UI:** Single scrollable column (`PageContainer`, ~960px max), consistent with Events tab typography and spacing.
- **Reuse:** Share WordPress fetch helpers and HTML/text rendering components with Ticket 03 to avoid duplication (extract shared module if not already done).
- **Links:** Any `mailto:`, maps, or external HTTPS links open in the appropriate external target (browser / maps app)—not trapped in a webview.
- **States:** Loading, error, empty; retry.

## Out of scope

- Events content (Ticket 03).
- Custom maps SDK or embedded map beyond link-out.

## Acceptance criteria

- [ ] About tab displays the configured WordPress page for the tenant.
- [ ] Content is readable on phone and wide web viewports.
- [ ] Config keys for About (`WORDPRESS_ABOUT_PAGE_ID` and/or slug) are documented in `.env.production.example` and read via church config.
- [ ] External links behave like PRD (browser / system handlers).

## Estimate

**S–M** (faster if Ticket 03 established shared WordPress UI)
