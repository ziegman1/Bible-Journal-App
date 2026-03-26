-- Growth invites: share CHAT (framework) with a friend — public landing via token, no group data exposed.

CREATE TABLE public.chat_growth_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  sender_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sender_name text,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  personal_note text,
  status text NOT NULL DEFAULT 'sent' CHECK (status = ANY (ARRAY['sent'::text, 'opened'::text, 'converted'::text])),
  created_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  account_created_at timestamptz
);

CREATE INDEX chat_growth_invites_token_idx ON public.chat_growth_invites (token);
CREATE INDEX chat_growth_invites_sender_idx ON public.chat_growth_invites (sender_user_id);

ALTER TABLE public.chat_growth_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_growth_invites_insert_own"
  ON public.chat_growth_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_user_id);

CREATE POLICY "chat_growth_invites_select_own"
  ON public.chat_growth_invites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_user_id);

-- Public read: only safe fields via RPC (no direct anon SELECT on table).

CREATE OR REPLACE FUNCTION public.mark_chat_growth_invite_opened(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name text;
  v_note text;
BEGIN
  UPDATE public.chat_growth_invites
  SET
    opened_at = COALESCE(opened_at, now()),
    status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END
  WHERE token = p_token
  RETURNING
    COALESCE(NULLIF(TRIM(sender_name), ''), 'Someone'),
    NULLIF(TRIM(personal_note), '')
  INTO v_sender_name, v_note;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'senderName', v_sender_name,
    'personalNote', v_note
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_chat_growth_invite_opened(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_chat_growth_invite_opened(text) TO anon, authenticated;
