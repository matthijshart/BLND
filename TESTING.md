# BLEND — Test Phase

The launch checklist. Work top to bottom: each phase gates the next. Items marked
**⚠ unverified fix** were changed recently but have never run against real
Firebase — they are the reason this document exists.

Throwaway accounts: use `+`-aliases (`you+test1@gmail.com`) so every account
receives real email in one inbox. You need **two** phones (or one phone + one
incognito browser) for every flow past Phase 2 — Blend is a two-person product
and half the bugs found in the audit only occur on the second account.

---

## Phase 0 — Infrastructure (once, before any flow testing)

### 0.1 Validate the security rules against the emulator

The rules have **never been parsed by Firestore itself** — no `firebase-tools`
existed in the environment they were written in. Do not skip this.

```bash
npm i -g firebase-tools     # once
firebase login
npm run emulators           # starts auth + firestore + storage, UI on :4000
```

If the rules contain a syntax error, the emulator refuses to start and prints
the line. That alone is worth the setup.

### 0.2 Deploy rules + indexes to the project

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

- A Vercel deploy does **not** do this. Until it runs, the database has
  whatever rules it had before (possibly none).
- `firestore:indexes` matters too: the new-blend badge query
  (`app/(app)/layout.tsx`) needs a composite index and its error callback is
  empty — a missing index fails silently as a badge that never appears.

### 0.3 The one critical smoke test — ⚠ unverified fix

**Send one chat message immediately after deploying the rules.**

Chat lives in a `dates/{id}/messages` subcollection. The previous rules missed
it entirely and deploying them would have silently killed all chat (PR #16).
The fixed rule uses a `get()` on the parent date — one message sent and one
received proves the whole block. If chat breaks, roll back:
`firebase deploy --only firestore:rules` from the previous commit.

### 0.4 Production data hygiene

- **Seed profiles.** The audit claims stock-photo seed profiles
  (`scripts/seed-profiles.ts`, Unsplash images) exist in the production
  `users` collection and are served to real users as real people. Check the
  Firestore console. Purge or clearly separate them before any real signup.
- Waitlist: confirm reads from a signed-out client are denied (rules say
  `allow read: if false` — try it in the console's rules playground).

---

## Phase 1 — Auth & account lifecycle (one throwaway account)

| # | Test | Expect | |
|---|------|--------|---|
| 1.1 | Sign up with a fresh email | Verification email arrives in inbox | ⚠ unverified fix |
| 1.2 | Sign up, then password-reset a **Google-only** account | Message says "If that email has a password account…" — no false "sent!" | ⚠ unverified fix |
| 1.3 | Refresh mid-onboarding (step 3) | Draft restored, photos not lost | |
| 1.4 | Finish onboarding, press browser **Back** to `/onboarding` | Redirected to `/today`; profile intact; `dateTokens` unchanged in console | ⚠ unverified fix |
| 1.5 | Kill network, open app | Loading resolves; app shows an error state, **not** an eternal pulse | ⚠ unverified fix |
| 1.6 | Under 18 date of birth | Cannot proceed | |

## Phase 2 — Photos (the data-loss fix)

| # | Test | Expect | |
|---|------|--------|---|
| 2.1 | Upload 3 photos | 3 objects appear under `users/{uid}/photos/` with **UUID names**, not `0.jpg` | ⚠ unverified fix |
| 2.2 | Reorder photos, then delete the first | The photo you see disappear is the photo that leaves Storage — verify in console | ⚠ unverified fix |
| 2.3 | Upload an 8 MB+ file / a PDF | Friendly error, no silent failure | |
| 2.4 | Photo of a **legacy account** (pre-fix, named `0.jpg`) still deletes | Delete-by-URL handles old names too | ⚠ unverified fix |

## Phase 3 — The core loop (two accounts)

| # | Test | Expect |
|---|------|--------|
| 3.1 | Open `/today` before 11:00 | Countdown, no profiles |
| 3.2 | After 11:00 (or `scripts/force-batch.ts`) | 8–12 profiles, batch survives refresh |
| 3.3 | A likes B, B likes A | Blend celebration fires **even on the last card of the day** |
| 3.4 | Double-tap like rapidly | One swipe, one match — no duplicates in console |
| 3.5 | Like with network killed | Card returns or error shows — not silently swallowed |

## Phase 4 — Scheduling → meet → chat (two accounts)

| # | Test | Expect | |
|---|------|--------|---|
| 4.1 | A picks slots, B hasn't | A sees waiting state | |
| 4.2 | A and B pick **disjoint** slots | Both see "No overlap yet" + "Pick more times" — not "waiting on other" forever | |
| 4.3 | Overlapping slots, both confirm | Meet at earliest overlap; end time shows **60** minutes after start | ⚠ unverified fix |
| 4.4 | Café assignment | Café is in one of the two users' neighbourhoods | |
| 4.5 | Chat 2h before meet | Opens; messages deliver both ways; day dividers correct | ⚠ rules |
| 4.6 | In devtools, try `sendMessage(dateId, OTHER_UID, …)` | Rejected — senderId is pinned to the caller | ⚠ unverified fix |
| 4.7 | Both answer "second cup" yes | Chat reopens permanently; answers not visible to the other before both answered | |
| 4.8 | Cancel a meet | Other person is informed; state sensible | |

## Phase 5 — Deletion (GDPR — do this with a fresh throwaway)

| # | Test | Expect | |
|---|------|--------|---|
| 5.1 | Delete account with a **fresh login** (<4 min) | Auth user, profile, swipes, matches, dates, **chat messages** and **all Storage photos** gone — verify every one in both consoles | ⚠ unverified fix |
| 5.2 | Delete with an **old session** (wait 5+ min after login) | Clear message: sign in again, **nothing deleted** — and verify nothing was | ⚠ unverified fix |
| 5.3 | After deletion, partner's meet | Their app shows a sane state, no crash on missing profile | |

## Phase 6 — Device pass (real iPhone, PWA installed)

- Safe areas: notch, home indicator, fixed bottom nav
- Keyboard: chat input stays visible; no zoom-on-focus
- Pull-to-refresh doesn't fire mid-swipe on profile cards
- `p/[uid]` share link **while logged out** — with the deployed rules this now
  requires sign-in. Decide whether that's the product you want; it is currently
  the safer default (the page exposes name, age, neighbourhood, photos with no
  noindex).

---

## Known open items (not blockers for testing, decide before launch)

1. **Candidate pool**: unordered `limit(50)` in `lib/daily.ts` — audit expects
   pool exhaustion after ~5 days and invisibility of late signups. Product
   decision on ordering/recycling needed.
2. **App Store listing** copy + category were never revised for the
   repositioning (should not be listed under Dating anymore).
3. Email verification is sent but **not enforced** — deliberate; revisit
   post-launch.
