# Mobile deployment (Capacitor + this Next.js app)

**Store submission (env, legal, Supabase, TestFlight, Play):** see [FINAL_SUBMISSION_CHECKLIST.md](./FINAL_SUBMISSION_CHECKLIST.md) in the repo root.

## Important: sync with env

`npx cap sync` bakes the resolved `server.url` (or its absence) into `ios/App/App/capacitor.config.json` and `android/app/src/main/assets/capacitor.config.json`. If you run sync **without** `CAPACITOR_SERVER_URL` / `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` in the environment, the native app will **not** get a `server` entry and will only show the `www/` fallback page.

**Use `npm run cap:sync:local`** (loads `.env.local`) before opening Xcode/Android Studio for normal development.

## How the web app is built (source of truth)

- **Build:** `next build` → outputs to **`.next/`** (not `out/`).
- **Runtime:** `next start` on a Node host, or **Vercel** (and similar) with server rendering and hybrid static/dynamic routes.
- There is **no** `output: 'export'` in `next.config.ts`, so there is **no** full static site in `out/` for Capacitor to bundle.

Therefore the native apps **cannot** ship the whole product as offline-only files from a Next export without a major architecture change.

## Capacitor strategy chosen: **remote hosted WebView**

- **`server.url`** points at your **deployed** HTTPS origin (the same place users open in Safari/Chrome).
- The WebView loads your live Next.js deployment (SSR, API routes, middleware, `/auth/callback`, etc.) exactly like the browser.
- **`webDir: "www"`** holds a **small fallback** (`www/index.html`) so `npx cap sync` always has a valid folder to copy. It is **not** a full app bundle.

### Why not `webDir: "out"`?

`out/` is only produced if you add `output: 'export'` and accept static export constraints. That would **change** the current web deployment model and is **not** what this repo uses today. Hard-coding `out/` was incorrect for the present Next.js setup.

## Configuration files

| File | Role |
|------|------|
| `capacitor.config.ts` | Capacitor entry; imports helpers from `capacitor.constants.ts`. |
| `capacitor.constants.ts` | **Single place** for default `appId` / app display name helpers and `server.url` resolution (env). |
| `www/` | Minimal static fallback for sync only. |

### Environment variables (Capacitor CLI / local shell)

| Variable | Purpose |
|----------|---------|
| **`CAPACITOR_SERVER_URL`** | Optional. Overrides the WebView URL (e.g. staging). Example: `https://staging.example.com` |
| **`NEXT_PUBLIC_SITE_URL`** | If `CAPACITOR_SERVER_URL` is unset, Capacitor uses this (same as auth emails / `getPublicSiteBaseUrl()`). |
| **`VERCEL_URL`** | Used on Vercel when neither of the above is set (preview deployments). |
| **`CAPACITOR_APP_ID`** | Optional. Overrides bundle id string in config. **Must still match** Android `applicationId` and iOS `PRODUCT_BUNDLE_IDENTIFIER` after native changes. |
| **`CAPACITOR_APP_NAME`** | Optional. Display name override. |

**Recommended for local dev:** put `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`, run `next dev`, then sync with env loaded so the app loads your dev server (see cleartext note below).

## Commands

From the repo root:

```bash
# Install deps (if needed)
npm install

# Regenerate native copies of www + capacitor.config.json
# Load .env.local so NEXT_PUBLIC_SITE_URL applies (optional but usual locally):
dotenv -e .env.local -- npx cap sync

# Open native IDEs
npx cap open ios
npx cap open android
```

npm scripts in `package.json`:

- `npm run cap:sync` → `npx cap sync` (URL comes from **your shell env** only).
- `npm run cap:sync:local` → loads `.env.local` then syncs (recommended so `NEXT_PUBLIC_SITE_URL` sets `server.url`).
- `npm run mobile:ios` / `npm run mobile:android` → open Xcode / Android Studio.

## Auth (`/auth/callback`) and Supabase

Mobile uses the **same** origin as `server.url`. Ensure **Supabase Auth → URL configuration** includes:

- `https://<your-production-domain>/auth/callback`
- Local dev: `http://localhost:3000/auth/callback` (and the port you use)

Set **`NEXT_PUBLIC_SITE_URL`** on production to your **canonical** HTTPS domain so email links and Capacitor (when not using `CAPACITOR_SERVER_URL`) match.

**iOS:** `http://` dev URLs may require ATS exceptions; production should use **HTTPS**.

**Android:** `cleartext` is set `true` in Capacitor config when `server.url` uses `http://` (local dev).

## App ID / display name

- Default **`appId`** in `capacitor.constants.ts` is **`app.badwr.beadiscipleworthreproducing`** — keep it aligned with Xcode **PRODUCT_BUNDLE_IDENTIFIER**, Android **`applicationId`**, and App Store Connect.
- Default **`appName`** is **BADWR** (home-screen label; full marketing copy lives in the web app).

## Static export (not current architecture)

Shipping a fully **offline** app from Next would require `output: 'export'`, route/feature restrictions, and a different Capacitor `webDir` pointing at the export output. That is **optional future work**, not enabled here, so we do not document `out/` as the Web dir.
