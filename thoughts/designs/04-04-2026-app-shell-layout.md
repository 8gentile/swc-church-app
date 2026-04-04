# App shell layout (design)

Companion to the PRD (Navigation, section 4). Describes how the **mobile-first shell** is structured so implementation matches product intent: sermons, events, giving, and about—without inventing a separate information architecture.

---

## Purpose

The shell is the **fixed chrome** around all in-app content: a **bottom tab bar** for primary destinations, a **scrollable main column** above it, and **optional** overflow (menu) for account, theme, and settings. Content is **anonymous-first**; sign-in is optional and does not change tab structure.

Stack today: **One**, **Tamagui**, **Zero** (where needed), **Better Auth** (optional identity). Use Tamagui **tokens** (`$background`, `$color2`, `$borderColor`, `$space`, `rounded`) and **named themes** (`blue`, `dark_blue`, …) so light/dark and future white-label branding stay consistent.

---

## Bottom tab bar (primary navigation)

**Placement:** Fixed to the **bottom** of the viewport on web; in normal layout flow on native. Safe-area insets apply under the bar on notched devices.

**Role:** Holds **icons + short labels** for the four PRD tabs. This is the **only** persistent primary navigation—users always know how to reach sermons, events, give, and about.

| Order | Tab        | Role | Notes |
|-------|------------|------|--------|
| 1 | **Sermons** | Default “home” for engagement | YouTube list + player; live banner when applicable (PRD sections 5.1–5.2). |
| 2 | **Events** | Upcoming / calendar-style entry | WordPress-backed content; sign-up opens **external** links (PRD section 5.3). |
| 3 | **Give** | **Center tab — visually emphasized** | **Not a screen:** single action opens the configured giving URL in the **system browser** (no in-app webview) (PRD section 5.4). |
| 4 | **About** | Church info | Service times, description, location from WordPress (PRD section 5.5). |

**Give (center):** Treat as a **prominent button** in the tab strip (size, color, or FAB-style emphasis per design). Tapping it must **not** push a stack screen for “Give”; it only triggers `Linking` / equivalent.

**Routing:** Map each tab to a stable route (e.g. `/home/sermons`, `/home/events`, `/home/about`) and implement Give as a **tab press handler** that opens the URL and optionally prevents navigation. Exact paths can follow the One router layout you choose; the **four destinations** stay as defined in the PRD.

---

## Main column (above the tabs)

**Behavior:** Each tab owns a **scrollable body** (list, detail, or static content). Max width ~960px on large screens, horizontal padding on phones—same patterns as today’s feed shell.

**Sermons:** List → detail/player; optional **LIVE** banner anchored below the top safe area or top of scroll content when YouTube reports a live broadcast.

**Events / About:** WordPress-driven screens per PRD; external signup/donate links open the **browser**.

**Give:** No dedicated screen—main column for the “current tab” when Give is focused can be a **minimal or empty state**, or the app stays on the previous tab visually; product-wise the only outcome is the external browser opening.

---

## Overflow / secondary (not a fifth tab)

Reserve an icon (e.g. **menu** or **profile**) in the tab bar row **or** top corner for: theme (light/dark), optional **sign-in / account**, link to **settings** / legal, and **logout** when signed in. This matches **identity optional** without competing with the four product tabs.

---

## Native vs web

- **Native:** Tab bar + `ScrollView` (or stack) per screen; respect safe areas.
- **Web:** Fixed bottom bar; main area scrolls; avoid `100vw` hacks that cause horizontal scroll; reserve bottom inset so content does not sit under the bar.

---

## Implementation note (current repo vs PRD)

The codebase may still use a **placeholder** tab set (e.g. Home / Profile) from the Takeout template. **Target state** for SWC is the **four tabs above** and **Give** as center action-only. Migrate routes and `NavigationTabs` when you wire YouTube/WordPress and `ENGAGE_GIVE_URL`.
