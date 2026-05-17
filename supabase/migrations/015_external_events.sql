-- ============================================================
-- Migration 015 — Événements externes (LIFRAS + partenaires)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.external_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  content     text,
  url         text,
  source      text DEFAULT 'LIFRAS',
  event_date  date,
  location    text,
  active      boolean DEFAULT true NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.external_events ENABLE ROW LEVEL SECURITY;

-- Tous les membres peuvent lire
CREATE POLICY "ext_events_select_all"
  ON public.external_events FOR SELECT
  USING (active = true AND is_approved((SELECT auth.uid())));

-- Admins peuvent tout faire
CREATE POLICY "ext_events_all_admin"
  ON public.external_events FOR ALL
  USING (get_user_role((SELECT auth.uid())) = 'admin');
