# Ticket 02 — Sermons tab: YouTube archive, live banner, and player

**Status:** Completed  
**Depends on:** Ticket 01 (routes and config exist)  
**Plan:** [`../plans/04-04-2026-church-app-prototype-technical-plan.md`](../plans/04-04-2026-church-app-prototype-technical-plan.md) (Phase 1)  
**PRD:** [`../prds/04-03-2026-swc-church-app-prd.md`](../prds/04-03-2026-swc-church-app-prd.md) §5.1–5.2, §7.1

## Summary

Implement the **Sermons** tab as the primary engagement surface: paginated **sermon list** from YouTube Data API v3 (uploads playlist via `channels` → `playlistItems`), **embedded player** on detail, optional **LIVE NOW** banner when `search` + `eventType=live` returns a video, plus loading/error/offline handling.

## Scope

- **Dependency:** Add **`react-native-youtube-iframe`** (or agreed alternative) for playback on native + web; verify layout on web (no `100vw` overflow).
- **Env:** Use `VITE_YOUTUBE_API_KEY` and `VITE_YOUTUBE_CHANNEL_ID` (or align with existing `YOUTUBE_*` after Ticket 01’s env pass)—single module for all YouTube calls.
- **API layer** (e.g. `src/features/church/youtube/`):
  - Resolve uploads playlist id via `channels.list` (`contentDetails.relatedPlaylists.uploads`).
  - `playlistItems.list` with pagination (`pageToken`).
  - `search.list` with `eventType=live` (optional: `upcoming`) with **short TTL cache** (1–5 min) to protect quota.
- **UI — list:** Thumbnail, title, published date (newest first); pull-to-refresh on native; refresh affordance on web.
- **UI — live banner:** When live video exists, show banner (“LIVE NOW”, CTA to join) at top of scroll; hidden when none.
- **UI — detail:** Route such as `/home/sermons/[videoId]` with embedded player; back navigation preserved.
- **Errors:** Offline and API failure states per PRD §9 (friendly copy, retry where sensible).

## Out of scope

- WordPress (Tickets 03–04).
- Server-side proxy for API key (document as follow-up hardening).

## Acceptance criteria

- [ ] Sermon list loads for the configured channel when API key is present; items sorted newest-first.
- [ ] Tap row opens detail with working embedded playback (web + native in dev).
- [ ] Live banner appears only when API reports a live stream; tap opens that stream in the player.
- [ ] Pagination or “load more” works without duplicate or skipped items (basic sanity).
- [ ] Loading, empty, error, and offline states are visible and do not throw uncaught rejections.
- [ ] Quota-friendly: live check cached briefly; no redundant hammering on every render.

## Estimate

**L** (API + list + detail + iframe + edge cases)
