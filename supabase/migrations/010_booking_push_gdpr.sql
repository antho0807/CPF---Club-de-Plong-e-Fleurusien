-- ============================================================
-- Migration 010 — booking_url + push_subscriptions + gdpr_consent
-- ============================================================

-- 1. Colonne booking_url sur dive_sites
ALTER TABLE public.dive_sites ADD COLUMN IF NOT EXISTS booking_url text;

-- Vodelée (RCAS)
UPDATE public.dive_sites
  SET booking_url = 'https://booking.royalcas.be/index.html'
  WHERE name = 'Carrière de Vodelée';

-- 2. Table push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription  jsonb NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_select_own" ON public.push_subscriptions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "push_insert_own" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "push_update_own" ON public.push_subscriptions FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "push_delete_own" ON public.push_subscriptions FOR DELETE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "push_read_admin" ON public.push_subscriptions FOR SELECT USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));

-- 3. Table gdpr_consent
CREATE TABLE IF NOT EXISTS public.gdpr_consent (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  accepted_at timestamptz DEFAULT now() NOT NULL,
  version     text DEFAULT '1.0' NOT NULL
);

ALTER TABLE public.gdpr_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gdpr_select_own" ON public.gdpr_consent FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "gdpr_insert_own" ON public.gdpr_consent FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "gdpr_read_admin" ON public.gdpr_consent FOR SELECT USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));
