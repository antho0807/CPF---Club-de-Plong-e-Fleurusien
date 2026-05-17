-- ============================================================
-- Migration 016 — RLS organizer : update events + select registrations
-- ============================================================

-- 1. Organisateur peut modifier/annuler son propre événement
DROP POLICY IF EXISTS "events_update_moniteur" ON public.events;
DROP POLICY IF EXISTS "events_update"           ON public.events;

CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  USING (
    get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur')
    OR created_by = (SELECT auth.uid())
  );

-- 2. Organisateur peut voir les inscriptions à son événement
DROP POLICY IF EXISTS "regs_select_organizer" ON public.event_registrations;

CREATE POLICY "regs_select_organizer"
  ON public.event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND e.created_by = (SELECT auth.uid())
    )
  );
