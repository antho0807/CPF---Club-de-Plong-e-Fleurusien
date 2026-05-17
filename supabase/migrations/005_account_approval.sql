-- ============================================================
-- Migration 005 — Approbation des comptes membres
-- ============================================================

-- 1. Colonne status sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CONSTRAINT profiles_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Trigger handle_new_user — expliciter status = 'pending'
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'membre',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper : vrai si l'utilisateur a le statut 'approved'
CREATE OR REPLACE FUNCTION is_approved(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Events — restreindre la lecture aux comptes approuvés
DROP POLICY IF EXISTS "events_read_all" ON public.events;
CREATE POLICY "events_read_all"
  ON public.events FOR SELECT
  USING (is_approved(auth.uid()));

-- 5. Dive sites — restreindre la lecture aux comptes approuvés
DROP POLICY IF EXISTS "sites_read_all" ON public.dive_sites;
CREATE POLICY "sites_read_all"
  ON public.dive_sites FOR SELECT
  USING (is_approved(auth.uid()));

-- 6. CA members — restreindre la lecture aux comptes approuvés
DROP POLICY IF EXISTS "ca_read_all" ON public.ca_members;
CREATE POLICY "ca_read_all"
  ON public.ca_members FOR SELECT
  USING (is_approved(auth.uid()));

-- 7. Profiles — admin access uniquement si admin approuvé
DROP POLICY IF EXISTS "profiles_read_admin" ON public.profiles;
CREATE POLICY "profiles_read_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moniteur')
        AND p.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "profiles_all_admin" ON public.profiles;
CREATE POLICY "profiles_all_admin"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'approved'
    )
  );

-- ============================================================
-- APRÈS AVOIR APPLIQUÉ CETTE MIGRATION :
-- Approuver les comptes existants (admin en priorité) :
--
--   UPDATE public.profiles SET status = 'approved' WHERE role = 'admin';
--
-- Puis approuver les autres membres au cas par cas via l'interface
-- admin, ou en masse si la base existante est de confiance :
--
--   UPDATE public.profiles SET status = 'approved'
--   WHERE role IN ('moniteur', 'membre');
-- ============================================================
