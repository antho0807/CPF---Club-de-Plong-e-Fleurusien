-- ============================================================
-- Migration 023 — Tokens de confirmation de suppression de compte
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

ALTER TABLE public.account_deletion_tokens ENABLE ROW LEVEL SECURITY;

-- Seul l'utilisateur concerné ou un admin peut lire/écrire ses tokens
CREATE POLICY "deletion_token_own" ON public.account_deletion_tokens
  FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR requested_by = (SELECT auth.uid())
    OR get_user_role((SELECT auth.uid())) = 'admin'
  );
