-- ============================================================
-- Migration 014 — Avatars, contacts urgence, historique plongées
-- ============================================================

-- 1. Colonnes avatars + contacts urgence sur profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url              text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_relation text;

-- 2. Table historique des plongées
CREATE TABLE IF NOT EXISTS public.dive_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id    uuid REFERENCES public.events(id) ON DELETE SET NULL,
  dive_date   date NOT NULL,
  site_name   text,
  event_type  text,
  max_depth   numeric,
  role        text DEFAULT 'plongeur',
  status      text DEFAULT 'confirmed',
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.dive_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dh_select_own"   ON public.dive_history FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "dh_insert_own"   ON public.dive_history FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "dh_update_own"   ON public.dive_history FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "dh_read_admin"   ON public.dive_history FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));

-- 3. Fix RLS regs_update_organizer (avec WITH CHECK)
DROP POLICY IF EXISTS "regs_update_organizer" ON public.event_registrations;
CREATE POLICY "regs_update_organizer"
  ON public.event_registrations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_registrations.event_id AND e.created_by = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_registrations.event_id AND e.created_by = (SELECT auth.uid()))
  );

-- 4. Bucket avatars : créer manuellement dans Supabase Dashboard > Storage
-- ou via : INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Policies storage avatars
CREATE POLICY "avatar_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_insert_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
CREATE POLICY "avatar_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
CREATE POLICY "avatar_delete_own" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
