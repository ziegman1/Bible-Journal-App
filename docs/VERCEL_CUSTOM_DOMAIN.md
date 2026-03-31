# Vercel: domain and project alignment (BADWR)

Production canonical origin: **https://www.badwr.app** (set `NEXT_PUBLIC_SITE_URL` to this on Vercel Production, no trailing slash).

## Common issue

If the **custom domain** is attached to **Vercel project A** but deployments from this repo go to **project B**, the live site at www.badwr.app will not update when you push.

**Fix:** In Vercel → this repo’s linked project → **Settings → Domains**, ensure **www.badwr.app** (and apex if used) point at the project that receives your Git deployments.

## Verify

After deploy, open **https://www.badwr.app** and confirm the build you expect (e.g. check `NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID` if exposed in your build for debugging).
