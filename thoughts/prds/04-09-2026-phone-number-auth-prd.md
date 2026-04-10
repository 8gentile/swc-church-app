# Phone Number Auth — Product Requirements Document (PRD)

**Version:** v1.0  
**Last Updated:** April 2026  
**Author:** Nicholas Gentile  
**Status:** Draft  
**Parent PRD:** `thoughts/prds/04-03-2026-swc-church-app-prd.md` (§6 — Authentication & identity)

---

# 1. Summary

Add **phone number signup and sign-in** as a first-class alternative to email. The phone number becomes the **canonical identity anchor** — a single phone number can be associated with multiple emails, social accounts, and provider links. Email remains supported but is secondary; **phone is gold**.

---

# 2. Motivation

## Why phone-first for a church app

- **Universality:** Every congregant has a phone number. Not everyone checks email regularly or uses a Google/Apple account.
- **Friction reduction:** Typing a phone number + 6-digit code is faster than email + password, especially on mobile — aligns with the "remove friction" philosophy (main PRD §15).
- **Identity consolidation:** Church members often have multiple email addresses (personal, work, family). A phone number is a stable, unique anchor across all of them. Staff can look up one phone number and see every associated email and account linkage.
- **Downstream value:** Phone numbers unlock SMS-based engagement later — service reminders, event notifications, prayer chain opt-in — without requiring a separate contact collection step.

## What "phone is gold" means

The phone number is the **primary key of personhood** in this system. It is:

- **Unique:** One phone number → one identity. No two user records share a phone.
- **Canonical:** When merging, deduplicating, or resolving "who is this person?", phone wins.
- **One-to-many with emails:** A single phone-anchored identity can have N associated email addresses (via Better Auth account linking or explicit user action).
- **Durable:** People change emails far more often than phone numbers. A phone-first model reduces orphaned accounts.

## The Breeze email constraint

**Email is not optional for full app functionality.** The existing Breeze ChMS integration (`src/server/breeze.ts`) is built entirely around email as the lookup key:

- **`findPersonByEmail(email)`** — the sole mechanism for matching an app user to a Breeze person record.
- **`createPerson(first, last, email)`** — creates new Breeze records using email as the required identifier.
- **`/api/breeze/checkin`** — requires email to find-or-create a person, then add attendance.
- **`/api/breeze/my-signups`** — requires email to look up which events a person is signed up for.

This means: **a phone-only user (no email) cannot check in to events, cannot sign up for events, and cannot see their signups.** The Breeze API does not support phone-number-based person lookup in any practical way.

### Design implication

Phone number is gold for **identity** — it's how we know who someone is across sessions, devices, and email changes. But email is the **bridge to Breeze** — it's the key that unlocks church operations (event signup, attendance tracking, and future ChMS features).

The system must **collect both**. The question is sequencing:

1. **Phone gets you in the door** (fastest signup) → then we **require email before Breeze-dependent actions** (event check-in, signup).
2. Or: phone signup immediately **prompts for email** as a second step before reaching the home screen.

Option 1 is recommended — it preserves the low-friction onboarding while making the email ask contextual ("to sign up for this event, we need your email").

---

# 3. Scope

## In scope (this feature)

1. **Phone number sign-up** — new users can create an account with phone number + SMS OTP.
2. **Email collection flow** — phone-only users are prompted to add an email (a) at signup as an optional second step, or (b) just-in-time when they attempt a Breeze-dependent action (event check-in/signup). Email is not required to browse the app, but is **required to interact with Breeze**.
3. **Phone number sign-in** — returning users authenticate via phone + OTP (passwordless) or phone + password.
4. **Phone field on user record** — `phoneNumber` (E.164) and `phoneNumberVerified` added to the `user` table.
5. **Association model** — a verified phone number can link to multiple email addresses over time; linking is additive (adding an email never removes the phone).
6. **Signup flow UI** — new route/method for phone entry, OTP input screen, optional email prompt, seamless session creation.
7. **Login screen update** — "Continue with Phone" option alongside "Continue with Email" (and social providers when configured).
8. **Profile: phone display** — settings/edit-profile shows the user's verified phone number and linked email(s).
9. **SMS delivery integration** — pluggable `sendOTP` implementation (Twilio, AWS SNS, or Better Auth Infrastructure SMS service).
10. **Breeze gating** — event check-in and signup flows check for a verified email before calling Breeze APIs; if missing, prompt the user to add one inline.

## Out of scope (future)

- SMS-based push notifications or broadcast messaging
- Phone-number-based Breeze person lookup (Breeze API does not support this well; email remains the bridge)
- Phone as 2FA second factor (this PRD treats phone as a primary auth method, not a second factor)
- Phone number porting/transfer between users
- WhatsApp or RCS as OTP delivery channels
- International number restrictions or geo-blocking

---

# 4. Data Model

## 4.1 Phone as the anchor, email as the bridge

```
Phone Number (E.164)  ← GOLD: canonical identity anchor
 └── User Identity (Better Auth `user` row)
      ├── Email A  (e.g. personal gmail)  ← BRIDGE: required for Breeze ChMS
      ├── Email B  (e.g. work email)
      ├── Email C  (e.g. family/shared)
      ├── Google OAuth account
      ├── Apple OAuth account
      └── credential account (password)
```

The phone number lives directly on the `user` row. Emails live on `user.email` (primary/current) and can be extended via account linking (`account` table, `providerId = 'credential'` with different emails). Better Auth's `allowDifferentEmails: true` (already configured) enables this.

**Why both matter:**

- **Phone** answers "who is this person?" — it's the durable, unique anchor for deduplication and identity.
- **Email** answers "how do we connect this person to Breeze?" — it's the lookup key for `findPersonByEmail()`, event check-in, and signup tracking.
- A user with a phone but no email can **browse** the app (sermons, events list, about, give link) but **cannot** check in to events or see their signups.
- A user with both is **fully functional** — phone anchors their identity, email bridges them to Breeze.

## 4.2 Schema changes

### `user` table additions

| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `phoneNumber` | `varchar(20)` | Yes | `null` | E.164 format, e.g. `+15705551234`. Unique when not null. |
| `phoneNumberVerified` | `boolean` | No | `false` | Set `true` after OTP verification. |

These fields are added by the Better Auth `phoneNumber` plugin migration (`npx auth migrate`).

### Constraints

- `phoneNumber` has a **unique** constraint (partial — `WHERE phoneNumber IS NOT NULL`).
- A user can exist with **only** a phone (email gets a synthetic placeholder, see §5.2).
- A user can exist with **only** an email (phone is null — existing behavior unchanged).
- A user can have **both** phone and email (ideal state — full identity).

### `userPublic` / Zero sync considerations

The `userPublic` table (synced via Zero) does **not** expose phone numbers. Phone numbers are PII and belong only in the private `user` table. The public-facing identity remains `name`, `username`, `image`.

---

# 5. Technical Design

## 5.1 Better Auth phone number plugin

Better Auth ships a first-party `phoneNumber` plugin that provides everything needed:

**Server (`authServer.ts`):**

```typescript
import { phoneNumber } from 'better-auth/plugins'

phoneNumber({
  otpLength: 6,
  expiresIn: 300, // 5 minutes
  signUpOnVerification: {
    getTempEmail: (phone) => `${phone.replace('+', '')}@phone.swcapp.local`,
    getTempName: (phone) => phone,
  },
  sendOTP: async ({ phoneNumber, code }, ctx) => {
    // delegate to SMS provider — see §5.3
    await smsProvider.send(phoneNumber, `Your SWC verification code is: ${code}`)
  },
  callbackOnVerification: async ({ phoneNumber, user }, ctx) => {
    // optional: log, trigger welcome, sync to ChMS later
  },
  phoneNumberValidator: (phone) => {
    // E.164 validation — starts with +, 10-15 digits
    return /^\+[1-9]\d{9,14}$/.test(phone)
  },
})
```

**Client (`authClient.ts`):**

```typescript
import { phoneNumberClient } from 'better-auth/client/plugins'

// add to existing createAuthClient plugins array
phoneNumberClient()
```

**Migration:** Run `bunx auth migrate` to add `phoneNumber` and `phoneNumberVerified` columns to the `user` table. The plugin also manages an internal OTP verification table.

## 5.2 Sign-up flow (phone)

### Happy path

1. User taps **"Continue with Phone"** on login screen.
2. → `/auth/signup/phone` — phone number input (with country code picker, default `+1` US).
3. User enters number → client calls `authClient.phoneNumber.sendOtp({ phoneNumber })`.
4. → `/auth/verify-otp` — 6-digit OTP input screen, auto-submit on 6th digit.
5. User enters code → client calls `authClient.phoneNumber.verify({ phoneNumber, code })`.
6. `signUpOnVerification` fires: creates user with `phoneNumber` as verified, synthetic placeholder email (`15705551234@phone.swcapp.local`), and `name` = phone number.
7. Session created → redirect to app home.

### Returning user (phone sign-in)

1. Same flow through steps 1–5.
2. `verify` finds existing user by `phoneNumber` → creates session (no new account).
3. → App home.

### Post-signup email prompt

After phone verification creates the session, the app shows a **soft prompt**:

> "Add your email to sign up for events and track your registrations."
> [Enter email] [Skip for now]

- If the user enters an email → verify it (standard email verification or accept unverified for MVP) → replace the placeholder email on `user.email` → the user is now Breeze-ready.
- If the user skips → they land on the home screen. They can browse freely. When they tap "Sign Up" on an event, the app intercepts with a **just-in-time email prompt** before calling `/api/breeze/checkin`.

### Edge cases

- **Phone already taken:** `verify` returns existing user session — this is intentional (phone = identity). The OTP proves ownership.
- **User later adds email:** Via profile settings or just-in-time prompt → email verification flow. The phone-anchored user now has a real email. The placeholder email is replaced.
- **User has email account, adds phone:** Via profile settings → `authClient.phoneNumber.sendOtp()` then `verify({ ..., updatePhoneNumber: true })`. Phone is now set on the existing user.
- **Merge scenario:** User signed up with email, later verifies the same phone that a phone-only account has → account linking resolution (§5.4).
- **Phone-only user tries event check-in:** Intercepted with "Add your email to sign up for this event" — inline email input, then the check-in proceeds. Email is saved to the user record for future use.

## 5.3 SMS delivery

### Options (pick one per deployment)

| Provider | Pros | Cons |
|----------|------|------|
| **Twilio** | Industry standard, global reach, Verify API handles OTP lifecycle | Cost per message (~$0.0075/SMS US), requires account |
| **AWS SNS** | Cheap, integrates with AWS stack | More setup, less specialized for auth OTP |
| **Better Auth Infrastructure SMS** | Zero config, managed by Better Auth team, pre-built templates | Vendor lock-in, availability TBD |

**Recommendation for MVP:** Twilio Verify — it handles rate limiting, retry, and delivery confirmation. Use the `verifyOTP` hook to delegate verification to Twilio's service rather than storing OTPs locally.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio secret (server-side only) |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service for OTP |
| `SMS_FROM_NUMBER` | Sender phone number (if not using Verify) |

These are **server-only** secrets — never exposed to the client or committed to source.

## 5.4 Account linking strategy

Better Auth's `accountLinking.allowDifferentEmails: true` is already enabled. The phone number plugin extends this:

- **Phone-first user adds email:** The email becomes a linked credential. The phone remains the anchor.
- **Email-first user adds phone:** The phone is set on the existing user record. If another user already has that phone → **conflict resolution** needed (see below).
- **Conflict resolution:** If a phone number is claimed by user A and user B tries to verify it, the system should:
  1. Reject the verification with an error: "This phone number is already associated with another account."
  2. Offer a merge flow (future): "Want to merge these accounts?" — requires confirming ownership of both.

### Association tracking

The `account` table already tracks provider links per user. Phone number lives on `user` directly (not as a separate `account` row) because it is the **identity anchor**, not a "provider." Emails associated via different sign-in methods show up as separate `account` rows with their respective `providerId` values.

To query "all emails for this phone":

```sql
SELECT u.phoneNumber, u.email AS primaryEmail, a.accountId AS linkedEmail
FROM "user" u
LEFT JOIN account a ON a.userId = u.id
WHERE u.phoneNumber = '+15705551234'
  AND a.providerId IN ('credential', 'google', 'apple');
```

---

# 6. UI/UX

## 6.1 Login screen (`/auth/login`)

Current layout:
- "Continue with Email" button
- Social buttons (Google / Apple, when configured)
- Demo mode (when enabled)

**Updated layout:**

```
┌──────────────────────────────┐
│                              │
│     [Church Logo]            │
│     Church Display Name      │
│                              │
│  ┌──────────────────────┐    │
│  │ Continue with Phone  │    │  ← NEW, primary position
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ Continue with Email  │    │
│  └──────────────────────┘    │
│                              │
│  ──── or sign in with ────   │
│                              │
│  [Google]       [Apple]      │
│                              │
└──────────────────────────────┘
```

**Phone gets top position** — it is the preferred method. Email remains for users who prefer it.

## 6.2 Phone entry screen (`/auth/signup/phone`)

- Country code picker (flag + `+1` default, dropdown for others)
- Phone number input — numeric keyboard, auto-format as user types
- "Send Code" button → calls `sendOtp`, navigates to OTP screen
- Subtle link: "Use email instead" → navigates to `/auth/signup/email`

## 6.3 OTP verification screen (`/auth/verify-otp`)

- Display: "Enter the code sent to +1 (570) 555-1234"
- 6 individual digit inputs (or single input with spacing)
- Auto-submit when 6th digit entered
- "Resend code" link with cooldown timer (30s → 60s → 120s backoff)
- "Wrong number? Go back" link

## 6.4 Email collection prompt (post-phone-signup)

Shown once after phone signup, before navigating to home:

```
┌──────────────────────────────┐
│                              │
│     You're in!               │
│                              │
│  Add your email to sign up   │
│  for events and track your   │
│  registrations.              │
│                              │
│  ┌──────────────────────┐    │
│  │ your@email.com       │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │    Add Email         │    │
│  └──────────────────────┘    │
│                              │
│       Skip for now →         │
│                              │
└──────────────────────────────┘
```

## 6.5 Just-in-time email gate (event check-in)

When a phone-only user (no real email) taps "Sign Up" on an event:

```
┌──────────────────────────────┐
│                              │
│  To sign up for this event,  │
│  we need your email address. │
│                              │
│  ┌──────────────────────┐    │
│  │ your@email.com       │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  Continue & Sign Up  │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

After entering email → save to user record → proceed with Breeze check-in. The email is remembered for all future Breeze interactions.

## 6.6 Profile / settings

- Show verified phone number (masked: `•••••••1234`, tap to reveal)
- Show linked email address(es)
- "Add phone number" if user signed up with email only
- "Add email" if user signed up with phone only (with note: "Required for event sign-ups")
- "Change phone number" → OTP verification for new number

---

# 7. Security

## 7.1 OTP safeguards

- **Rate limiting:** Max 3 OTP requests per phone number per 10-minute window (server-side).
- **Brute force protection:** Max 3 verification attempts per OTP code (Better Auth built-in). After 3 failures, OTP is invalidated.
- **Expiry:** OTP valid for 5 minutes (300 seconds).
- **Cooldown:** Client enforces increasing resend cooldown (30s, 60s, 120s). Server enforces absolute rate limit.

## 7.2 Phone number privacy

- Phone numbers are **never** synced to Zero / `userPublic`. They exist only in the private `user` table, accessible only server-side.
- Phone numbers are **never** displayed to other users in the app.
- Phone numbers are **masked** in the owner's own settings UI.
- API endpoints that return user data to other users must strip `phoneNumber` from the response.

## 7.3 E.164 normalization

All phone numbers are stored in **E.164 format** (`+{country}{number}`, no spaces, dashes, or parentheses). Normalization happens at input time on the client (before sending to the server) and is validated server-side via `phoneNumberValidator`.

---

# 8. Implementation Plan

## Phase 1 — Backend + plugin wiring

1. Add `phoneNumber()` plugin to `authServer.ts` with `signUpOnVerification` config.
2. Add `phoneNumberClient()` plugin to `authClient.ts`.
3. Run database migration (`bunx auth migrate`).
4. Implement `sendOTP` with Twilio Verify (or stub with console.log for dev).
5. Add Twilio env vars to `.env` and `.env.production.example`.
6. Update `apiHandler.ts` if phone-based sign-up needs the same 422→sign-in replay logic that email uses.

## Phase 2 — UI flows

1. Add `/auth/signup/phone` route — phone number input screen.
2. Add `/auth/verify-otp` route — OTP entry screen (reusable for email magic link codes too).
3. Add `/auth/email-prompt` route — post-phone-signup email collection (§6.4).
4. Update `/auth/login` — add "Continue with Phone" button, reorder.
5. Update `passwordLogin.ts` (or create `phoneLogin.ts`) for the phone OTP flow.
6. Handle native keyboard (numeric) and country code formatting.

## Phase 3 — Breeze email gating

1. Add utility `hasRealEmail(user)` — returns false if `user.email` matches the `@phone.swcapp.local` placeholder pattern.
2. Update `useEventCheckin` — before calling `/api/breeze/checkin`, check `hasRealEmail`. If false, show inline email prompt (§6.5). On submit, save email to user record, then proceed.
3. Update any other Breeze-dependent flows (`my-signups`, etc.) to check for real email.
4. After a phone-only user adds an email via the gate, replace the placeholder email on the `user` record server-side.

## Phase 4 — Profile + linking

1. Update edit-profile to display phone number (currently placeholder "coming soon").
2. Show linked email(s) with "Required for event sign-ups" note if missing.
3. Add "Add phone number" flow for email-only users.
4. Add "Add email" flow for phone-only users.
5. Handle account conflict / merge UX.

## Phase 5 — Production SMS

1. Provision Twilio Verify service.
2. Configure production env vars.
3. Test SMS delivery on real devices (iOS + Android).
4. Monitor delivery rates and costs.

---

# 9. Metrics

| Metric | Why it matters |
|--------|----------------|
| **Phone sign-ups vs email sign-ups** | Validates that phone is preferred |
| **OTP delivery success rate** | SMS reliability |
| **OTP verification success rate** | UX friction indicator |
| **Time to verify** (send → verify) | Flow speed |
| **Post-signup email prompt conversion** | How many phone users add email at the prompt vs skip |
| **Just-in-time email gate conversion** | How many phone-only users add email when hitting event check-in |
| **Phone-only users who never add email** | How many users stay browse-only (never interact with Breeze) |
| **Email-only users who later add phone** | Adoption of phone as anchor |
| **Time from phone signup to email addition** | How long the gap is — informs whether to make the prompt more aggressive |

---

# 10. Open Questions

1. **SMS cost model:** Who pays for Twilio SMS? Per-church billing or platform-level? At ~$0.0075/SMS (US), a 200-member church doing 4 logins/month = ~$6/month — trivial, but needs a decision for multi-tenant.
2. **International numbers:** Support non-US numbers from day one, or US-only MVP? Country code picker implies international, but SMS costs vary significantly.
3. **Placeholder email domain:** `signUpOnVerification` generates a `{phone}@phone.swcapp.local` placeholder. This domain must never be sent to Breeze. The `hasRealEmail()` check prevents this — but should we use a more clearly-fake domain (e.g. `noreply.invalid` per RFC 2606)?
4. **Email verification for Breeze:** When a phone-only user adds an email via the just-in-time prompt, do we need to verify it (send confirmation link) before using it with Breeze? Verification adds friction but prevents typos from creating orphan Breeze records. Recommendation: accept unverified for MVP, verify later.
5. **Password optional:** If a user signs up with phone + OTP only (no password), should they be able to set a password later? Better Auth supports passwordless via OTP — is that sufficient?
6. **Twilio vs Better Auth Infrastructure SMS:** Better Auth's managed SMS service could reduce operational burden. Evaluate availability and pricing before committing to Twilio.
7. **Admin visibility:** Should church admins (via the app's admin plugin) be able to see congregant phone numbers for pastoral care? Privacy implications need discussion with church leadership.
8. **Breeze phone lookup (future):** Breeze profiles do have phone fields. Could we eventually add `findPersonByPhone()` as a fallback when email lookup fails? This would reduce the hard email dependency — but the Breeze API's phone search capabilities are limited and would need testing.

---

# 11. Dependencies

| Dependency | Status |
|------------|--------|
| `better-auth` `phoneNumber` plugin | Available (first-party) |
| `phoneNumberClient` client plugin | Available (first-party) |
| Twilio Verify (or alternative SMS provider) | Requires account setup |
| Database migration for phone fields | Run after plugin is added |
| Edit Profile screen implementation | Currently placeholder — needed for Phase 3 |

---

# 12. Relationship to Main PRD

This feature extends **§6 (Authentication & identity)** of the main PRD:

- Main PRD states auth is for **identity** — phone number strengthens that identity with a more durable, universal anchor.
- Main PRD notes sign-in is **optional** — phone sign-up does not change this; it adds a lower-friction path for users who do sign in.
- Main PRD §12 (Future Roadmap) includes "User accounts" — phone auth is a prerequisite for meaningful account features like saved sermons, notification preferences, and ChMS integration.
- The **white-label** model (§7.5) is unaffected: SMS provider credentials join the per-tenant env config alongside YouTube/WordPress keys.
