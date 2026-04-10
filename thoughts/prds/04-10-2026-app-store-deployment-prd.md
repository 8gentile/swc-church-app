# App Store Deployment — iOS & Android

**Version:** v1.0  
**Last Updated:** April 10, 2026  
**Author:** Nicholas Gentile  
**Status:** Draft  

---

## 1. Goal

Publish the SWC Church App to the Apple App Store (iOS) and Google Play Store (Android) as a free, publicly available app. Use EAS Build + EAS Submit (already scaffolded in the repo) for cloud-based native builds and automated store submission. Establish a repeatable release pipeline so future updates are a single command.

---

## 2. Current State

| Item | Status |
|------|--------|
| `app.config.ts` | Exists — Expo config with iOS/Android sections, EAS project ID |
| `eas.json` | Exists — development, preview, production profiles |
| Bundle IDs | Placeholder `dev.tamagui.takeout.*` — must change to church-specific IDs |
| App name | Placeholder `Takeout` — must change to `SWC Church` (or similar) |
| Assets | Placeholder icon/splash — need church-branded versions |
| EAS project | Linked (`9c6754b4-...`) — may need new project for church org |
| Native prebuild | `one prebuild` script exists |

---

## 3. Pre-Submission Checklist

### 3.1 Branding & Identity

| Item | Value | Notes |
|------|-------|-------|
| App name | `SWC Church` (or `Stroudsburg Wesleyan`) | Display name on home screen |
| Bundle ID (iOS) | `org.stroudsburgwesleyan.app` | Reverse-domain, registered in Apple Developer |
| Package name (Android) | `org.stroudsburgwesleyan.app` | Must match Play Console listing |
| App slug | `swc-church` | URL-safe, used by EAS |
| Version | `1.0.0` | Semantic versioning, first public release |

### 3.2 App Icon

| Platform | Spec |
|----------|------|
| iOS | 1024x1024 PNG, no alpha/transparency, no rounded corners (system applies mask) |
| Android (adaptive) | Foreground: 512x512 PNG with transparent padding; Background: solid color or 512x512 image |
| Both | Church logo/branding, legible at 60x60 |

Deliverables:
- `assets/icon.png` — 1024x1024 app icon
- `assets/adaptive-icon.png` — 512x512 foreground for Android adaptive icon
- `assets/splash-icon.png` — splash screen logo (transparent PNG)
- Adaptive icon background color in `app.config.ts` (current: `#e6dac1`)

### 3.3 Splash Screen

Already configured in `app.config.ts` via `expo-splash-screen`. Update:
- `image` → church logo asset
- `backgroundColor` → church brand color

### 3.4 Screenshots (required for both stores)

| Platform | Sizes needed |
|----------|-------------|
| iOS | 6.9" (iPhone 16 Pro Max): 1320x2868; 6.7" (iPhone 15 Plus): 1290x2796; Optional: 5.5" (iPhone 8 Plus), iPad |
| Android | Min 2 screenshots, 320-3840px per side, 16:9 or 9:16 |

Recommended screenshots (4-6 per platform):
1. Sermons tab (video list)
2. Live sermon playing
3. Events tab (upcoming events with sign-up checkboxes)
4. About/Info tab
5. Give tab (or CTA)
6. Event detail sheet

Use a device frame tool (e.g. screenshots.pro, Figma device frames) for polished framing.

---

## 4. App Config Changes

Update `app.config.ts` for production:

```typescript
const appName = 'SWC Church'
const appId = 'swc-church'

const getBundleId = () => {
  if (APP_VARIANT === 'development') return 'org.stroudsburgwesleyan.app.dev'
  if (APP_VARIANT === 'preview') return 'org.stroudsburgwesleyan.app.preview'
  return 'org.stroudsburgwesleyan.app'
}
```

Additional changes:
- `slug`: `'swc-church'`
- `owner`: new Expo org or personal account for the church
- `scheme`: `'swc-church'` (deep linking)
- `version`: `'1.0.0'`
- `primaryColor`: church brand color
- Remove unused permissions (Camera, Microphone, Photo Library — not used in church app MVP)
- Update `infoPlist` descriptions to reference "SWC Church" instead of generic `$(PRODUCT_NAME)` where needed
- `ios.supportsTablet`: decide — church tablets in lobby? If no, keep `false`

---

## 5. EAS Configuration

### 5.1 Update `eas.json`

```json
{
  "cli": {
    "version": ">= 16.19.3",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_VARIANT": "development" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_VARIANT": "preview" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "APP_VARIANT": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "<church-apple-id@stroudsburgwesleyan.org>",
        "ascAppId": "<app-store-connect-app-id>",
        "appleTeamId": "<team-id>"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 5.2 EAS Secrets

Set via `eas secret:create` (not stored in repo):

| Secret | Purpose |
|--------|---------|
| `BREEZE_API_KEY` | Breeze ChMS API key |
| `BREEZE_SUBDOMAIN` | Breeze instance subdomain |
| `ONE_SERVER_URL` | Production server URL |

---

## 6. Store Accounts & Setup

### 6.1 Apple Developer Program

| Item | Details |
|------|---------|
| Account type | Organization (church nonprofit) — $99/year |
| D-U-N-S number | Required for organization accounts; apply at dnb.com (free, takes 5-14 days) |
| Enrollment | developer.apple.com/programs/enroll |
| App Store Connect | Create app listing, set bundle ID, fill metadata |
| Signing | EAS Build handles provisioning profiles and certificates automatically |

If a D-U-N-S number is too slow, enroll as Individual ($99/year) under the pastor/admin's name and transfer to Organization later.

### 6.2 Google Play Console

| Item | Details |
|------|---------|
| Account type | Organization — $25 one-time registration fee |
| Enrollment | play.google.com/console/signup |
| Service account | Create a Google Cloud service account with Play Console API access for automated submission |
| App signing | Google manages the signing key (App Bundle model); EAS uploads AAB |

---

## 7. Store Listing Metadata

### 7.1 Shared Copy

| Field | Value |
|-------|-------|
| App name | SWC Church |
| Short description | Sermons, events, and giving for Stroudsburg Wesleyan Church |
| Full description | Stay connected with Stroudsburg Wesleyan Church. Watch sermons and live streams, browse and sign up for upcoming events, and give — all in one app. |
| Category | Lifestyle (iOS) / Lifestyle (Android) |
| Keywords (iOS) | church, wesleyan, sermons, stroudsburg, events, giving, community |
| Privacy policy URL | Required — host at `stroudsburgwesleyan.org/app-privacy` |
| Support URL | `stroudsburgwesleyan.org/contact` or a church email |
| Marketing URL | `stroudsburgwesleyan.org` |

### 7.2 Content Rating

- Both stores require a content rating questionnaire
- Church app with no user-generated content, no violence, no purchases → rated "Everyone" / "4+"
- iOS: Set `usesNonExemptEncryption: false` (already done in `app.config.ts`)

### 7.3 Privacy Policy

Required by both stores. Must cover:
- What data is collected (email for sign-ups, usage analytics if any)
- How data is stored (server location, encryption)
- Third-party services (Breeze, YouTube, Engage)
- Contact information for data requests

Host as a page on the church WordPress site.

---

## 8. Build & Submit Workflow

### 8.1 First Build (one-time setup)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to Expo account
eas login

# 3. Configure project (link to EAS project)
eas init

# 4. Generate native projects
bun run prebuild:native

# 5. Build for both platforms
eas build --platform ios --profile production
eas build --platform android --profile production

# 6. Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### 8.2 Subsequent Releases

```bash
# Build + submit in one step (version auto-increments via eas.json)
eas build --platform all --profile production --auto-submit
```

### 8.3 Preview / TestFlight

```bash
# iOS TestFlight build
eas build --platform ios --profile preview
eas submit --platform ios --profile production  # TestFlight shares the production profile

# Android internal testing
eas build --platform android --profile preview
# Upload to Play Console Internal Testing track manually, or:
eas submit --platform android --profile production --track internal
```

---

## 9. Review Process

### 9.1 Apple App Store Review

- **Timeline**: Typically 24-48 hours, sometimes same-day
- **Common rejection reasons for church/content apps**:
  - Missing privacy policy
  - WebView-only app (we're fine — native tabs + native components)
  - Metadata mismatch (screenshots don't match app)
  - Broken links in description
- **Expedited review**: Available for critical fixes via App Store Connect

### 9.2 Google Play Review

- **Timeline**: Typically a few hours to 3 days; first submission can take up to 7 days
- **New developer account**: Google applies extra scrutiny to new accounts; first app may take longer
- **Closed testing requirement**: Google now requires 12+ testers for 14+ days before production access for new developer accounts — plan accordingly

---

## 10. OTA Updates (Post-Launch)

The app has `hot-updater` commented out in `app.config.ts`. Once live, enable OTA updates for JS-only changes (content, styling, bug fixes) without going through store review:

```typescript
// app.config.ts — uncomment when ready
[
  '@hot-updater/react-native',
  {
    channel: APP_VARIANT,
  },
],
```

OTA updates work for:
- Bug fixes in JS/TS code
- UI changes (layouts, styles, copy)
- New API endpoints or data logic

OTA updates do NOT work for:
- New native modules or permissions
- Expo SDK upgrades
- React Native version bumps

These still require a full `eas build` + store submission.

---

## 11. Timeline

| Phase | Task | Duration |
|-------|------|----------|
| **Week 1** | Apple Developer enrollment (D-U-N-S if org), Google Play enrollment | 1-14 days (D-U-N-S bottleneck) |
| **Week 1** | Design app icon, splash, prepare screenshots | 2-3 days |
| **Week 1** | Write privacy policy, publish to church website | 1 day |
| **Week 1-2** | Update `app.config.ts`, `eas.json`, bundle IDs, branding | 1 day |
| **Week 2** | First EAS production build (iOS + Android) | 1 day |
| **Week 2** | TestFlight / Internal Testing distribution to pastor + staff | 1 day |
| **Week 2-3** | Staff testing and feedback | 3-7 days |
| **Week 3** | Submit to App Store + Play Store | 1 day |
| **Week 3** | Store review period | 1-7 days |
| **Week 3-4** | **Public launch** | - |

**Critical path**: Apple Developer org enrollment with D-U-N-S can take up to 14 days. Start this immediately. Everything else can proceed in parallel.

---

## 12. Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Console | $25 | One-time |
| EAS Build (free tier) | $0 | 30 builds/month |
| **Total year 1** | **$124** | |
| **Total year 2+** | **$99** | |

EAS free tier includes 30 builds/month — more than enough for a church app release cadence. Paid tiers available if CI/CD volume grows.

---

## 13. Tickets

### Ticket 1: Store Account Enrollment
Enroll in Apple Developer Program (org) and Google Play Console. Apply for D-U-N-S number. Create service account for Play Console API.

### Ticket 2: App Branding Assets
Design production app icon (1024x1024), adaptive icon foreground, and splash screen logo. Get approval from pastor/staff.

### Ticket 3: App Config & Bundle IDs
Update `app.config.ts` with church name, bundle IDs, branding colors, cleaned-up permissions. Update `eas.json` with submit configuration.

### Ticket 4: Store Listing Content
Write app description, prepare 4-6 screenshots per platform with device frames. Write and publish privacy policy.

### Ticket 5: TestFlight / Internal Testing
Run first EAS build, distribute via TestFlight (iOS) and Play Internal Testing (Android) to pastor and staff for validation.

### Ticket 6: Production Submission
Submit to both stores, respond to any review feedback, coordinate launch announcement with church communications.

---

## 14. Open Questions

1. **App name**: "SWC Church", "Stroudsburg Wesleyan", or something else? Needs to be recognizable to the congregation.
2. **Apple account type**: Organization (needs D-U-N-S, 1-2 weeks) or Individual (faster, transfer later)?
3. **Google Play closed testing**: New accounts require 14 days of closed testing with 12+ testers. Who are the testers? Church staff + small group leaders?
4. **Icon design**: Does the church have a designer, or should we commission one? Budget?
5. **OTA updates**: Enable `hot-updater` for v1 launch, or wait until post-launch stability is confirmed?
6. **Tablet support**: Should `supportsTablet` be enabled for lobby/kiosk use cases?
