# Final submission checklist (TestFlight & Play internal testing)

Use this document when you are ready to plug in **real production values** and ship the **Capacitor shell** against your deployed Next.js app.  
**Code/config source of truth:** `src/lib/site-config.ts`, `.env.example`, `capacitor.constants.ts`, [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md).

---

## 1. Required environment variables (hosting + local)

Set these in **Vercel** (or your Node host) for **Production** (and **Preview** if you test previews with real auth).

| Variable | Required for launch? | Purpose |
|----------|----------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical HTTPS origin, **no trailing slash** (auth links, invites, metadata, Open Graph, legal URLs, Capacitor WebView if `CAPACITOR_SERVER_URL` unset) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional override | If set to a valid email, footer/policies use it; otherwise the app uses `DEFAULT_PUBLIC_SUPPORT_EMAIL` (`support@badwr.app`) from `site-config.ts` |

**Optional (features / email / native):**

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Ask AI |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Group invite / transactional email via Resend |
| `NEXT_PUBLIC_PILLAR_WEEK_TIMEZONE` | Weekly pillar reset (default America/Chicago in code paths that use it) |
| `CAPACITOR_SERVER_URL` | Overrides WebView URL for native builds (e.g. staging); else same as `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` |
| `CAPACITOR_APP_ID` | Must match native **bundle id** / **applicationId** after you change it |
| `CAPACITOR_APP_NAME` | Native shell display name override |

Copy from `.env.example` into `.env.local` for development; mirror Production on the host.

---

## 2. Legal values to finalize (`src/lib/site-config.ts`)

Before **public** App Store / Play production (and ideally before wide internal testing if policies are visible):

| Item | Constant / location | Action |
|------|---------------------|--------|
| Last updated date | `LEGAL_DOCUMENTS_LAST_UPDATED` | Set when you publish policy changes |
| Operating entity | `PLACEHOLDER_LEGAL_ENTITY` | Replace with counsel-reviewed operator identity |
| Privacy templates | `LEGAL_DOC_PLACEHOLDERS.privacy` | Replace every `TODO — Legal:` string |
| Terms templates | `LEGAL_DOC_PLACEHOLDERS.terms` | Replace every `TODO — Legal:` string |

The `/privacy` and `/terms` pages **only** read from these exports — edit **`site-config.ts`**, not the page bodies, for legal copy.

---

## 3. Branding / app name

| Item | Where | Action |
|------|--------|--------|
| Short name (tabs, OG, manifest short) | `APP_SHORT_NAME` in `site-config.ts` | e.g. BADWR |
| Product name | `APP_NAME` / `APP_MARKETING_NAME` | `BADWR` |
| Tagline & meta description | `APP_TAGLINE`, `APP_DESCRIPTION`, `APP_LANDING_HERO_BLURB` | Store listings can align with these |
| Theme colors (PWA / browser UI) | `THEME_COLOR_LIGHT`, `THEME_COLOR_DARK`, `BRAND_OG` in `site-config.ts` | Optional visual polish |
| Capacitor defaults | `capacitor.constants.ts` → `DEFAULT_CAPACITOR_APP_ID`, `DEFAULT_CAPACITOR_APP_NAME` | Must stay aligned with **Xcode** + **Android** when you rebrand |
| Native IDs | `ios/...` bundle identifier, `android/app/build.gradle` `applicationId` | Must match `appId` after changes |

---

## 4. Support email & production domain

| What | How |
|------|-----|
| **Support** | Optional: set `NEXT_PUBLIC_SUPPORT_EMAIL` to override default `support@badwr.app` (`DEFAULT_PUBLIC_SUPPORT_EMAIL` in `site-config.ts`). |
| **Domain** | Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` on production. Used by `getPublicSiteBaseUrl()` for auth, invites, share footers, legal URLs, metadata base. |

Verify:

```bash
dotenv -e .env.local -- npx tsx scripts/verify-auth-site-config.ts
```

(Uses your `.env.local` to print resolved base URL behavior.)

---

## 5. Icons, splash, screenshots

| Asset | Notes |
|-------|--------|
| **Web favicon / Apple / OG** | Generated routes: `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx` — adjust or replace with static files per `public/store-assets/README.md` |
| **PWA manifest** | `src/app/manifest.ts` — uses `site-config` names & colors |
| **Capacitor splash** | iOS `Assets.xcassets`, Android `drawable*` — see `public/store-assets/README.md` and [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) |
| **App Store screenshots** | Capture against **staging/production** with final branding; sizes per current [Apple screenshot specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications) |
| **Play screenshots + feature graphic** | [Play Console guidance](https://support.google.com/googleplay/android-developer/answer/9866151); feature graphic **1024×500** |

Suggested flows to capture (see `public/store-assets/README.md`): home, reader, SOAPS, prayer, groups/chat, settings, optional List of 100 / process map / share.

---

## 6. App Store Connect (iOS — TestFlight)

Complete **as applicable** for your account (Apple’s UI changes over time):

- [ ] **Bundle ID** matches Xcode / `CAPACITOR_APP_ID` / `DEFAULT_CAPACITOR_APP_ID`
- [ ] **App name**, **subtitle**, **keywords** (align with `APP_MARKETING_NAME` / `APP_SHORT_NAME` if desired)
- [ ] **Privacy Policy URL** → `https://<your-domain>/privacy` (must match live site)
- [ ] **Support URL** or contact (can be `mailto:` or marketing site)
- [ ] **Age rating** questionnaire
- [ ] **App encryption / export compliance** (typically “standard encryption” if HTTPS only)
- [ ] **Sign in with Apple** — only if you use Apple as an auth provider (this app uses Supabase email/password unless you add Apple)
- [ ] **Screenshots** for required device classes
- [ ] **Build** uploaded from Xcode (Archive → Distribute → TestFlight)
- [ ] **Test information** for reviewers (test account if login required)

---

## 7. Google Play Console (Android — internal testing)

- [ ] **Package name** matches Android `applicationId` / Capacitor `appId`
- [ ] **Store listing**: title, short/full description (align with branding)
- [ ] **Privacy policy URL** → `https://<your-domain>/privacy`
- [ ] **Data safety** form (match what you disclose in Privacy Policy after you replace TODOs)
- [ ] **Feature graphic** + **phone** (and tablet if applicable) screenshots
- [ ] **App signing** (Play App Signing)
- [ ] **Internal testing track** + tester list
- [ ] Upload **App Bundle** (.aab) from Android Studio / Gradle

---

## 8. Supabase: URLs to verify

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value to include |
|---------|------------------|
| **Site URL** | Your canonical production origin, e.g. `https://your-domain.com` |
| **Redirect URLs** | At minimum: `https://your-domain.com/auth/callback` |
| | Plus dev: `http://localhost:3000/auth/callback` (and your port if not 3000) |
| | Add **staging** origins if you use them for real auth |
| | If group invites bounce through login, add patterns your app uses (e.g. invite routes) per [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) |

`NEXT_PUBLIC_SITE_URL` on the **deployed** Next app must match the **Site URL** / redirect hosts you expect users to land on after email.

---

## 9. Commands to run before internal mobile testing

Run from **repository root** in this order:

```bash
# 1) Install
npm install

# 2) Quality gate (same as CI expectations)
npx eslint --max-warnings 0
npx tsc --noEmit
npm run build

# 3) Production web deploy (your pipeline — example)
# npx vercel --prod
# Ensure Production env has NEXT_PUBLIC_SITE_URL, Supabase keys, optional SUPPORT_EMAIL.

# 4) Native shell: point WebView at production (or staging)
# Put NEXT_PUBLIC_SITE_URL and optionally CAPACITOR_SERVER_URL in .env.local, then:
npm run cap:sync:local

# 5) Open IDEs, bump versions, archive/upload
npm run mobile:ios
npm run mobile:android
```

**Important:** `npm run cap:sync:local` loads `.env.local` so `server.url` is written into `ios/.../capacitor.config.json` and Android assets. Sync **without** a URL yields only the `www/` fallback — see [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md).

---

## 10. Fail-safe behavior (placeholders)

| Area | Behavior |
|------|----------|
| Support email env unset | Footer and Support use `support@badwr.app` from `site-config.ts` (override with `NEXT_PUBLIC_SUPPORT_EMAIL`) |
| `NEXT_PUBLIC_SITE_URL` unset locally | `getPublicSiteBaseUrl()` may fall back to `VERCEL_URL` or `http://localhost:3000` — **not** valid for production mobile/WebView until set |
| Legal TODOs in `site-config` | Still visible on `/privacy` and `/terms` — **finalize copy before public store listing** |
| Share footers (`share-promo`) | Uses real hostname when `NEXT_PUBLIC_SITE_URL` is a proper URL; else short app name — no hardcoded fake domain |

---

## 11. Related docs

- [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) — Capacitor remote WebView, env, sync commands
- [MOBILE_APP.md](./MOBILE_APP.md) — Quick entry
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — Auth URLs, migrations
- [public/store-assets/README.md](./public/store-assets/README.md) — Screenshots & splash detail
