# Deployment

## Vercel (app)

```bash
npm run deploy
```

Vercel **does not** run Supabase SQL. After deploying code, apply any new migrations below.

## Supabase (database)

Run new migrations in the [SQL Editor](https://supabase.com/dashboard/project/_/sql) (or `supabase db push` linked to the project).

### Required for Look Forward “Train” + save (fixes `train_commitment` / schema cache error)

If saving commitments shows: *Could not find the 'train_commitment' column…*, run:

```sql
-- 027_lookforward_train_commitment.sql
ALTER TABLE lookforward_responses
  ADD COLUMN IF NOT EXISTS train_commitment TEXT NOT NULL DEFAULT '';
```

Then wait a minute, or in **Project Settings → Data API** use **Reload schema** if your project exposes it, so PostgREST picks up the column.

### Required for meeting “Group (live)” display names (not “Member”)

```sql
-- 028_profiles_select_for_group_peers.sql
CREATE POLICY "Group peers can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members my_gm
    INNER JOIN public.group_members peer_gm
      ON my_gm.group_id = peer_gm.group_id
    WHERE my_gm.user_id = auth.uid()
      AND peer_gm.user_id = profiles.id
  )
);
```

If that policy already exists, you’ll get a duplicate error—safe to skip.

Full history: `supabase/migrations/`.
