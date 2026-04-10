# Design Polish — Icons & CTA Buttons (PRD)

**Status:** Draft  
**Last Updated:** April 10, 2026  

## 1. Problem

The app's visual language has rough edges that undermine a polished, church-branded feel:

1. **Give icon** — The bottom-bar Give tab uses a generic `HeartIcon`. It does not communicate *giving to the church*; it reads as "favorites" or "likes."
2. **CTA button styling** — Buttons lack a clear, consistent call-to-action hierarchy. Text color is inherited from the theme, which can produce low-contrast combinations (e.g. dark text on a blue background). There is no codified distinction between a primary (filled) CTA and a secondary (outline) CTA.
3. **Phosphor icon consistency** — The project already uses hand-authored Phosphor-style SVG icons (`src/interface/icons/phosphor/`). Two new glyphs are needed (Cross, HandHeart) and should follow the same authoring pattern.

## 2. Goals

| # | Goal | Success metric |
|---|------|----------------|
| G1 | Ship a distinctive **Give icon** that signals generosity in a church context | Cross + HandHeart composite icon renders correctly at 22 px (tab bar) and 26 px (FAB) on web and native |
| G2 | Standardize CTA buttons with two clear variants: **active** (filled) and **outline** | Every CTA in the app uses one of the two variants; no ad-hoc color overrides remain |
| G3 | Guarantee **white text** on filled CTA buttons across light and dark themes | Contrast ratio ≥ 4.5:1 (WCAG AA) for button text on `$blue9` background |
| G4 | Keep the existing Phosphor icon authoring pattern (hand-authored SVG, `useIconProps`, `react-native-svg`) | New icons pass the same props interface (`IconProps`) and render identically on web + native |

## 3. Non-Goals

- Redesigning the overall app layout or tab structure.
- Adding new screens or navigation destinations.
- Changing the external-link behavior of the Give tab.
- Introducing a third-party icon package (icons remain hand-authored SVGs).

## 4. Scope

### 4.1 New Phosphor Icons

Add two new icon components following the existing pattern in `src/interface/icons/phosphor/`:

| Icon | File | Phosphor glyph | Weight |
|------|------|-----------------|--------|
| **Cross** | `CrossIcon.tsx` | `Cross` (Latin cross) | Fill |
| **HandHeart** | `HandHeartIcon.tsx` | `HandHeart` (open palm with small heart) | Fill |

Each component:
- Accepts `IconProps` (`size`, `color`, plus `SvgProps` passthrough).
- Uses `useIconProps` to resolve Tamagui color tokens to an SVG fill.
- Renders via `react-native-svg` (`Svg`, `Path`).
- Uses the standard Phosphor 256×256 viewBox.

### 4.2 Composite Give Icon

Create a **`GiveIcon`** component (`src/interface/icons/GiveIcon.tsx`) that composites CrossIcon and HandHeartIcon into a single glyph:

- **CrossIcon** renders as the full-size background shape (the Latin cross).
- **HandHeartIcon** renders smaller and centered over the cross, creating a layered "giving cross" mark.
- The composite icon accepts the same `IconProps` interface so it is a drop-in replacement anywhere an icon component is expected.
- Both sub-icons share the same `color` / `fill` so the composite reads as a single-tone glyph at small sizes (22–26 px).

The `GiveIcon` replaces `HeartIcon` in `NavigationTabs.tsx` for the Give tab.

### 4.3 CTA Button Variants

Update `src/interface/buttons/Button.tsx` to add two new CTA-specific variants alongside the existing `default`, `outlined`, `transparent`, and `floating`:

#### `cta` variant (filled / active)

| Property | Value | Notes |
|----------|-------|-------|
| Background | `$blue9` | Matches the Give FAB and primary action color already in use |
| Background (hover) | `$blue10` | Slightly darker on hover |
| Background (press) | `$blue11` | Deeper press feedback |
| Text color | `white` | Hard white — not a theme token — to guarantee contrast on all themes |
| Border | none (`borderWidth: 0`) | Clean filled surface |

#### `ctaOutline` variant (outline / secondary)

| Property | Value | Notes |
|----------|-------|-------|
| Background | `transparent` | No fill |
| Border | 1.5 px solid `$blue9` | Thin outline in the same blue |
| Border (hover) | `$blue10` | |
| Border (press) | `$blue11` | |
| Text color | `$blue9` | Blue text matching the outline |
| Text color (hover) | `$blue10` | Track border color |

Both variants must:
- Work in `light` and `dark` base themes without manual overrides.
- Support the standard `size` prop (`$3`, `$4`, `$5`, etc.) for consistent sizing.
- Render `Button.Text` children in the specified text color (white or blue) — this may require setting `color` on the variant or using Tamagui's `textProps`.

### 4.4 Migrate Existing CTAs

Audit and update every in-app button that serves as a call-to-action:

| Screen / Component | Current code | Target |
|--------------------|--------------|--------|
| Sermons — "Watch live" | `<Button size="$3" theme="blue">` | `<Button variant="cta" size="$3">` |
| Sermons — "Retry" / "Load more" | `<Button>` (default variant) | `<Button variant="ctaOutline" size="$3">` (secondary actions) |
| About — "Open in Maps" | `<Button size="$3">` | `<Button variant="ctaOutline" size="$3">` |
| Login — LoginButton | `<Button>` | `<Button variant="cta">` |
| Auth dialogs / forms | Various | Primary submit → `cta`; cancel/back → `ctaOutline` |

After migration, remove any one-off `theme="blue"` or inline color overrides on buttons that are replaced by the new variants.

### 4.5 Button Text Color Guarantee

Regardless of variant, all `Button` text must meet minimum contrast:

- **`cta`**: text is always `white` — enforced in the variant definition, not left to theme inheritance.
- **`ctaOutline`**: text is always `$blue9` — same.
- **`default`**, **`outlined`**, **`transparent`**, **`floating`**: remain theme-driven (no change needed).

If Tamagui's `styled()` variant system does not propagate `color` to child `Button.Text`, use `textProps: { color: '...' }` or wrap with a component theme override to force the correct text color.

## 5. Design References

### 5.1 Give Icon Composition

```
┌─────────────┐
│      │      │
│      │      │   ← CrossIcon (full size, single fill color)
│   ───┼───   │
│      │      │
│    ┌───┐    │
│    │ ♥ │    │   ← HandHeartIcon (scaled ~60%, centered over cross)
│    │🤲 │    │
│    └───┘    │
│      │      │
└─────────────┘
```

At 22–26 px rendered size, the two shapes merge into one readable glyph. Both shapes use the same fill so no multi-color rendering is needed.

### 5.2 Button Variant Visual Summary

```
┌──────────────────────┐
│  ██████████████████  │  ← cta: $blue9 bg, white text
│    Watch live        │
└──────────────────────┘

┌──────────────────────┐
│  ┌────────────────┐  │  ← ctaOutline: transparent bg, $blue9 border + text
│  │  Open in Maps  │  │
│  └────────────────┘  │
└──────────────────────┘
```

## 6. Technical Considerations

- **Icon SVG paths**: Source the `d` attribute paths from [Phosphor Icons](https://phosphoricons.com/) (MIT licensed). Use the **Fill** weight for `Cross` and `HandHeart` to match existing icons (`HeartIcon`, `PlayIcon`, etc.).
- **Composite rendering**: `GiveIcon` can use a `ZStack` or absolute positioning within an `Svg` element to layer the two paths. Prefer a single `<Svg>` with two `<Path>` elements (one for cross, one for hand-heart scaled via `transform`) for best cross-platform rendering.
- **Button variant text color**: Tamagui's `styled()` may need `color` set at the variant level to propagate to `Button.Text`. Test on both web and native to confirm text color inheritance. If needed, override `Button.Text` styling via the component theme system.
- **Theme compatibility**: Both variants must render correctly under `light`, `dark`, `light_blue`, and `dark_blue` theme contexts.

## 7. Out of Scope (Future)

- Animated Give icon (pulse on tap) — could be a follow-up.
- Additional button variants (destructive, success) — add when needed.
- Icon library extraction to a shared package.

## 8. Acceptance Criteria

1. `CrossIcon` and `HandHeartIcon` render at multiple sizes (16, 22, 26, 32 px) with correct proportions on web and native.
2. `GiveIcon` composites both icons into a single readable glyph; it replaces `HeartIcon` in the Give tab.
3. `Button` exposes `variant="cta"` and `variant="ctaOutline"` with the specified color, background, and border values.
4. All existing CTA buttons in the app use one of the two new variants — no remaining `theme="blue"` overrides on `Button`.
5. Button text on `cta` variant is always white; button text on `ctaOutline` variant is always `$blue9`.
6. Light and dark themes both render buttons and icons correctly with no contrast or visibility regressions.
