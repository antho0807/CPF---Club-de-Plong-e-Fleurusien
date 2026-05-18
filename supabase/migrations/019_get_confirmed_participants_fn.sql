-- ============================================================
-- Migration 019 — Fonction get_confirmed_participants
-- Permet à un participant confirmé de récupérer la liste
-- des autres participants confirmés d'un event (SECURITY DEFINER
-- pour bypasser la RLS restreinte sur event_registrations).
-- ============================================================

CREATE OR REPLACE FUNCTION get_confirmed_participants(
  p_event_id    uuid,
  p_exclude_user uuid
)
RETURNS TABLE (member_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- L'appelant doit être participant confirmé, organisateur ou admin/moniteur
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.event_registrations
      WHERE event_id = p_event_id
        AND member_id = (SELECT auth.uid())
        AND status = 'confirmed'
    )
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = p_event_id
        AND created_by = (SELECT auth.uid())
    )
    OR get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur')
  ) THEN
    RETURN; -- liste vide si non autorisé
  END IF;

  RETURN QUERY
    SELECT er.member_id
    FROM public.event_registrations er
    WHERE er.event_id = p_event_id
      AND er.status   = 'confirmed'
      AND er.member_id != p_exclude_user;
END;
$$;
