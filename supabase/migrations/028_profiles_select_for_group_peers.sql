-- Allow group members to read co-members' profile rows (for display_name in meetings, etc.).
-- Without this, SELECT ... FROM profiles WHERE id IN (<meeting participant ids>) only returns
-- the current user's row under RLS, so everyone else appears as "Member".

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
