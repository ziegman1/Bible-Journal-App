# Vercel: two projects (why logosflow didn’t update)

Your **Domains** screenshot is for project **`bible-journal-app`** — that’s where `www.logosflow.app` → Production is correct.

Deployments from this machine were going to a **different** project: **`biblejournalapp`** (no hyphens). That’s what `.vercel/project.json` was linked to.

So: **domains on A, code deploys to B** → hard refresh on logosflow never shows CLI deploys.

## Fix (pick one)

### Option A — Link this repo to `bible-journal-app` (recommended)

From the project root:

```bash
cd "/Users/jeremyziegenhorn/Bible Journal App"
npx vercel link
```

- Same team as in the dashboard (**jeremys-projects-81c771b2**)
- **Link to existing project** → choose **`bible-journal-app`** (the one with logosflow domains)

Then:

```bash
npx vercel --prod
```

Future deploys will hit the same project your domains use.

### Option B — Move domains to `biblejournalapp`

In Vercel: remove `logosflow.app` / `www.logosflow.app` from **`bible-journal-app`**, add them to **`biblejournalapp`**. Only do this if you intend that project to be canonical.

## Verify

After Option A, open **https://www.logosflow.app/app/groups** — you should see **Archived groups**, ⋯ menus, and (on Vercel builds) **Deploy: dpl_…** at the bottom.

## Optional cleanup

If **`biblejournalapp`** was only used by mistake, you can delete that empty/duplicate project in Vercel after linking here to **`bible-journal-app`**.
