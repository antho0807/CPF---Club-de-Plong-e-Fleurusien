-- ============================================================
-- Migration 018 — Événements récurrents + préférences notifications
-- ============================================================

-- 1. Colonnes récurrence sur events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_rule text;

-- 2. Entraînement piscine récurrent (chaque mardi, sans fin)
INSERT INTO public.events (
  title, event_type, date_start, date_end,
  meeting_point, meeting_time,
  is_recurring, recurrence_rule,
  is_cancelled, created_by
)
SELECT
  'Entraînement piscine',
  'entrainement_piscine',
  '2026-05-19T20:00:00+02:00',
  '2026-05-19T21:30:00+02:00',
  'Piscine de Fleurus, Rue de Fleurjoux 50, 6220 Fleurus',
  '19:45',
  true,
  'FREQ=WEEKLY;BYDAY=TU',
  false,
  (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.events WHERE is_recurring = true AND recurrence_rule = 'FREQ=WEEKLY;BYDAY=TU'
);

-- 3. Préférences de notifications push
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  new_event boolean NOT NULL DEFAULT true,
  event_reminder boolean NOT NULL DEFAULT true,
  registration_update boolean NOT NULL DEFAULT true,
  new_message boolean NOT NULL DEFAULT true,
  account_approved boolean NOT NULL DEFAULT true,
  medical_expiry boolean NOT NULL DEFAULT true,
  club_announcement boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_own" ON public.notification_preferences;
CREATE POLICY "notif_prefs_own" ON public.notification_preferences
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Admin peut lire toutes les préférences (pour vérification avant envoi push)
DROP POLICY IF EXISTS "notif_prefs_admin_read" ON public.notification_preferences;
CREATE POLICY "notif_prefs_admin_read" ON public.notification_preferences
  FOR SELECT USING (get_user_role((SELECT auth.uid())) = 'admin');
