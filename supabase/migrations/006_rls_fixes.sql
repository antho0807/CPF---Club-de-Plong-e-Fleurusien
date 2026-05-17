-- ============================================================
-- Migration 006 — Corrections RLS
-- ============================================================

-- 1. event_exercises — restreindre la lecture aux comptes approuvés
--    (la policy actuelle USING (true) laisse tout utilisateur authentifié lire)
DROP POLICY IF EXISTS "exercises_read_all" ON public.event_exercises;
CREATE POLICY "exercises_read_all"
  ON public.event_exercises FOR SELECT
  USING (is_approved(auth.uid()));

-- 2. member_exercise_progress — idem, restreindre aux approved
--    (la policy existante vérifie déjà member_id ou role, pas le statut)
DROP POLICY IF EXISTS "progress_read" ON public.member_exercise_progress;
CREATE POLICY "progress_read"
  ON public.member_exercise_progress FOR SELECT
  USING (
    is_approved(auth.uid()) AND (
      member_id = (SELECT auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
      )
    )
  );

-- 3. event_messages — restreindre la lecture aux approved
--    (la policy existante vérifie l'inscription ou le rôle, mais pas le statut)
DROP POLICY IF EXISTS "messages_read" ON public.event_messages;
CREATE POLICY "messages_read"
  ON public.event_messages FOR SELECT
  USING (
    is_approved(auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_id = event_messages.event_id
          AND member_id = (SELECT auth.uid())
          AND status = 'confirmed'
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
      )
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.event_messages;
CREATE POLICY "messages_insert"
  ON public.event_messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT auth.uid()) AND
    is_approved(auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_id = event_messages.event_id
          AND member_id = (SELECT auth.uid())
          AND status = 'confirmed'
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
      )
    )
  );
