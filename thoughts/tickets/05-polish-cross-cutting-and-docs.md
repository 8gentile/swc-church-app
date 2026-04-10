# Ticket 05 — Polish: cross-cutting UX, env consistency, branding, and documentation

**Status:** Completed  
**Depends on:** Tickets 01–04 (can start some items in parallel once 01 lands)  
**Plan:** [`../plans/04-04-2026-church-app-prototype-technical-plan.md`](../plans/04-04-2026-church-app-prototype-technical-plan.md) §6–9  
**PRD:** [`../prds/04-03-2026-swc-church-app-prd.md`](../prds/04-03-2026-swc-church-app-prd.md) §8–9, §11

## Summary

Close gaps between “features work” and “prototype is demo-ready”: consistent **branding** from config, **env** story is coherent for all client-needed `VITE_*` variables, **edge cases** (offline, API failures) are acceptable across tabs, and **README** / example env files match the church app.

## Scope

- **Env audit:** Ensure every client-needed secret or URL uses a consistent pattern (`VITE_*` where Vite exposes to bundle); align `.env.production.example`, `.env.development` comments, and root **README** “SWC Church App” table.
- **Branding:** `APP_NAME` / church display name from `VITE_CHURCH_DISPLAY_NAME` (or chosen key); optional logo hook (`ASSET_LOGO_URL` or bundled asset) if quick win.
- **Cross-tab UX:** Harmonize empty/error strings; confirm Give and Events external links use the same external-browser policy.
- **Performance / quota:** Verify YouTube caching is sane; optional lightweight WordPress response memoization for session.
- **Accessibility:** Tab labels, live region for live banner if trivial.
- **Docs:** Short “Definition of Done” checklist in README or `thoughts/` pointer; note Google Cloud API key restrictions for web/native.

## Out of scope

- New product features (push, accounts, Breeze API).
- Deleting Zero/Drizzle/auth—template may stay as-is per PRD.

## Acceptance criteria

- [ ] A new contributor can copy `.env.production.example`, fill church vars, and understand which keys are required for sermons/events/about/give.
- [ ] No stray “Takeout” user-facing strings where church name should appear (unless demo mode intentional).
- [ ] Offline or flaky network produces predictable messaging on Sermons and Events (minimum).
- [ ] README church section reflects final tab names and env vars.
- [ ] Optional: manual test checklist recorded (device toolbar + one native smoke).

## Estimate

**M**
