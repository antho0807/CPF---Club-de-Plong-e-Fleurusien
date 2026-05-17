-- ============================================================
-- Migration 012 — Policy INSERT events élargie aux P3★+
-- ============================================================

CREATE OR REPLACE FUNCTION get_brevet_level(user_id uuid)
RETURNS text AS $$
  SELECT brevet_level FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "events_insert"             ON public.events;
DROP POLICY IF EXISTS "events_write_moniteur"     ON public.events;
DROP POLICY IF EXISTS "P3+ can insert events"     ON public.events;

-- Admin, moniteur, ou brevet P3★ et supérieur
CREATE POLICY "events_insert" ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur')
  OR get_brevet_level((SELECT auth.uid())) IN ('3_etoiles', '4_etoiles', 'moniteur_club', 'moniteur_federal', 'instructeur')
);
