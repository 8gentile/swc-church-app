# App shell layout (greenfield)

This repo keeps the **Takeout** shell: auth, Zero, Tamagui, header with tabs, and a main column.

## Regions

1. **Bottom bar (`MainBottomBar`)** — Fixed to the bottom on web; in document flow on native. Contains `NavigationTabs` (Home + Profile with icon + label) and the overflow menu (`MainHeaderMenu`: theme, settings shortcut, logout). Implemented in `HomeShell` wrapping all `/home/*` routes.

2. **Optional notice strip** — A thin full-width band (e.g. `Theme` + `PageContainer`) for short-lived messages. Omit in production or drive from CMS.

3. **Main column (feed / home)** — Centered, `maxW` ~960px, `px` for gutters. `HomeShell` adds bottom padding on web so content does not sit under the fixed bar. Primary place for church-specific UI: welcome, announcements, events, links.

4. **Content blocks** — Use Tamagui **tokens** (`$background`, `$color2`, `$borderColor`, `$space`, `rounded`) and **named themes** (`blue`, `dark_blue`, etc.) so light/dark and brand accents stay consistent. Prefer `YStack` / `XStack`, `Separator`, `Paragraph`, `H1`–`H3` from `~/interface/text/Headings` where it matches the design system.

5. **Native** — Same tree inside `ScrollView` with safe-area padding; web uses full-height column.

## What to replace first

- Rename brand in `~/constants/app` (`APP_NAME`, domain, demo user email if needed).
- Swap the home copy and placeholder cards in `app/(app)/home/(tabs)/feed/index.tsx` for real sections (static first, then Zero-backed data).
