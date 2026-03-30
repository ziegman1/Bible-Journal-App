# Bible Journal — Mobile (Capacitor)

**Authoritative guide:** [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) — deployment strategy (remote WebView vs static export), env vars, Supabase redirects, and app ID notes.

**TestFlight / Play internal testing:** [FINAL_SUBMISSION_CHECKLIST.md](./FINAL_SUBMISSION_CHECKLIST.md)

## Quick commands

```bash
npm install
# Prefer loading .env.local so server.url matches NEXT_PUBLIC_SITE_URL:
npm run cap:sync:local
# or: npx cap sync
npm run mobile:ios
npm run mobile:android
```

The native shell loads your **deployed Next.js site** (SSR); see `capacitor.config.ts` and `capacitor.constants.ts`.
