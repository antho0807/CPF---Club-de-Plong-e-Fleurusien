-- ============================================================
-- Migration 011 — Table member_objectives (refonte objectifs LIFRAS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_objectives (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  objective_key text NOT NULL,
  completed    boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  validated_by uuid REFERENCES public.profiles(id),
  notes        text,
  UNIQUE(user_id, objective_key)
);

ALTER TABLE public.member_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obj_select_own"  ON public.member_objectives FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "obj_insert_own"  ON public.member_objectives FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "obj_update_own"  ON public.member_objectives FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "obj_delete_own"  ON public.member_objectives FOR DELETE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "obj_read_admin"  ON public.member_objectives FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));
CREATE POLICY "obj_update_admin" ON public.member_objectives FOR UPDATE
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));
