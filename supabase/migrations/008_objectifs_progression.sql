-- ============================================================
-- Migration 008 — Table de progression des objectifs par niveau
-- ============================================================

CREATE TABLE IF NOT EXISTS public.objectifs_progression (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  niveau       text NOT NULL,
  exercice_id  text NOT NULL,
  completed    boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  UNIQUE(user_id, niveau, exercice_id)
);

ALTER TABLE public.objectifs_progression ENABLE ROW LEVEL SECURITY;

-- Chaque membre lit et gère sa propre progression
CREATE POLICY "objectifs_select_own"
  ON public.objectifs_progression FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "objectifs_insert_own"
  ON public.objectifs_progression FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "objectifs_update_own"
  ON public.objectifs_progression FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "objectifs_delete_own"
  ON public.objectifs_progression FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Admin/moniteur peut consulter la progression de tous les membres
CREATE POLICY "objectifs_read_admin"
  ON public.objectifs_progression FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));

CREATE INDEX IF NOT EXISTS idx_objectifs_user_niveau
  ON public.objectifs_progression(user_id, niveau);
