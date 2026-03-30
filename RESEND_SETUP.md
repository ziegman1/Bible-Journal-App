# Resend Email Setup for Group Invites

Group invite emails are sent via [Resend](https://resend.com). Follow these steps to enable email sending.

## 1. Create a Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
3. Copy the API key (starts with `re_`)

## 2. Add Environment Variables

### Local development (.env.local)

```env
RESEND_API_KEY=re_your_api_key_here
# Optional for dev: onboarding@resend.dev works for testing
RESEND_FROM_EMAIL=BADWR <onboarding@resend.dev>
```

### Production (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add:
   - **RESEND_API_KEY** — Your Resend API key (mark as sensitive)
   - **RESEND_FROM_EMAIL** — **Required for production.** Use a verified domain (see step 3)

## 3. Verify Your Domain (Production Only)

`onboarding@resend.dev` works for local development but **fails or is blocked in production**.

For production (e.g. www.logosflow.app):

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g. `logosflow.app`)
3. Add the DNS records Resend provides (SPF, DKIM) to your domain's DNS
4. Wait for verification (usually 5–15 minutes)
5. Set in Vercel:
   ```
   RESEND_FROM_EMAIL=BADWR <invites@logosflow.app>
   ```
   (Use a subdomain like `invites@` or `noreply@`)

## 4. Test the Setup

### Option A: Debug endpoint

Visit (while logged in or in dev):

```
https://www.logosflow.app/api/debug-resend
```

This returns env status. Add `?to=your@email.com` to send a test email:

```
https://www.logosflow.app/api/debug-resend?to=your@email.com
```

### Option B: Send a real invite

1. Create a 3/3rds group
2. Go to Members → Invite by email
3. Enter an email and send
4. If configured correctly, the invitee receives the email. If not, you'll see the error in the toast (e.g. "Resend is not configured for production...")

## Common Issues

| Issue | Solution |
|-------|----------|
| "Missing RESEND_API_KEY" | Add the env var in Vercel. Redeploy after adding. |
| "Resend is not configured for production" | Add RESEND_FROM_EMAIL with a verified domain. |
| Emails work locally but not on Vercel | Use a verified domain for RESEND_FROM_EMAIL. `onboarding@resend.dev` is dev-only. |
| Emails go to spam | Verify your domain (SPF, DKIM) at resend.com/domains. |

## Vercel Integration (Optional)

Resend has a [Vercel integration](https://vercel.com/integrations/resend) that can auto-configure API keys. You still need to verify your domain for production.
