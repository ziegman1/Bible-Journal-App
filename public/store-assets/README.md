# Store & web branding assets

**Pre-submit checklist:** [FINAL_SUBMISSION_CHECKLIST.md](../../FINAL_SUBMISSION_CHECKLIST.md) (repo root).

Replace placeholders in this folder as you finalize branding. The Next.js app also generates dynamic icons from `src/app/icon.tsx`, `src/app/apple-icon.tsx`, and `src/app/opengraph-image.tsx`; you may switch to static files later by adding assets below and updating `metadata` in `src/app/layout.tsx` if needed.

## Web (current stack)

| Asset | Suggested size | Where to use |
|-------|------------------|--------------|
| Favicon | 32×32 (multi-size `.ico` optional) | Browsers tab; Next route `icon` covers PNG |
| Apple touch icon | 180×180 PNG | Home screen; Next route `apple-icon` |
| Open Graph / social | 1200×630 PNG | Link previews; Next route `opengraph-image` |
| PWA maskable icon | 512×512 (with safe zone) | `manifest` — add when you ship installable PWA beyond defaults |

Optional static fallbacks (if you stop using generated routes):

- `public/store-assets/favicon.png` — then reference from metadata
- `public/store-assets/og.png` — social sharing fallback

## Apple App Store screenshots (checklist)

Capture from a **production or staging build** on a clean account after branding is final. Export PNG or JPEG per [Apple’s current specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications).

Typical required set (verify in App Store Connect for your deployment target):

- **6.7" iPhone** (e.g. 1290×2796 portrait): Home / dashboard, journal entry or reader, SOAPS flow, groups or CHAT hub, settings, prayer wheel (if flagship).
- **6.5" / 5.5"** variants if still required for your app record.
- **iPad** sizes if you ship a universal app.

**Suggested screens to capture (this repo’s primary flows):**

1. Marketing or post-login home (`/app`) — dashboard / practice cards  
2. Bible reader (`/app/read/...`)  
3. SOAPS journal (`/app/soaps` or journal hub)  
4. Prayer wheel (`/app/prayer`)  
5. Groups hub (`/app/groups`) or CHAT (`/app/chat`)  
6. Settings / account (`/app/settings`)  
7. Optional: List of 100, process map, share encounter  

Name files clearly, e.g. `ios-67-home.png`, `ios-67-reader.png`.

## Google Play screenshots (checklist)

See [Play Console device art requirements](https://support.google.com/googleplay/android-developer/answer/9866151).

- Phone: feature graphic **1024×500** (separate from screenshots)  
- Phone screenshots: typically 16:9 or 9:16, min short edge often **320px** — use highest quality your listing allows  
- Tablet screenshots if applicable  

Capture the **same seven flows** as iOS where possible for consistency.

## Splash / launch (Capacitor)

Configured in `capacitor.config.ts` (SplashScreen plugin). The WebView loads your **deployed** Next app (`server.url`), not a Next `out/` folder — see [MOBILE_DEPLOYMENT.md](../../MOBILE_DEPLOYMENT.md). Platform projects expect resources under native trees:

- **iOS:** `ios/App/App/Assets.xcassets` — launch storyboard / image set  
- **Android:** `android/app/src/main/res/drawable*` — splash layers  

After changing splash assets, run `npx cap sync`. Replace any bundled placeholder art with your final brand colors and logo (safe area for notches).

## Environment-driven URLs

Production link previews and auth emails use `NEXT_PUBLIC_SITE_URL`. Legal URLs resolve to `{SITE_URL}/privacy` and `{SITE_URL}/terms`. Support mailto uses `NEXT_PUBLIC_SUPPORT_EMAIL` when set (see `.env.example`).
