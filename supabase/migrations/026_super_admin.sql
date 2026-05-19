-- ============================================================
-- Migration 026 — Rôle Gestionnaire (super admin protégé)
-- ============================================================

-- 1. Colonne is_super_admin sur les profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- 2. Désigner le gestionnaire principal par email
UPDATE public.profiles
SET is_super_admin = true, role = 'admin', status = 'approved'
WHERE email = 'anthonycapouet@gmail.com';

-- 3. Fonction de vérification super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND is_super_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Protection RLS : un admin normal NE PEUT PAS modifier un super admin
--    (ni le rétrograder, ni le désactiver, ni changer son rôle)
DO $$
BEGIN
  EXECUTE (
    SELECT 'ALTER TABLE public.profiles DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politique UPDATE renforcée pour profiles
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"        ON public.profiles;

-- Seul le super admin peut modifier d'autres super admins
-- Un admin normal peut modifier les profils NON super admin
-- Chacun peut modifier son propre profil (sauf is_super_admin)
CREATE POLICY "profiles_update_secure"
  ON public.profiles FOR UPDATE
  USING (
    id = (SELECT auth.uid())
    OR is_super_admin()
    OR (
      get_user_role((SELECT auth.uid())) = 'admin'
      AND is_super_admin = false
    )
  )
  WITH CHECK (
    -- Personne ne peut modifier le flag is_super_admin sauf... personne :
    -- ce flag ne peut être changé que via migration SQL directe
    is_super_admin = (SELECT is_super_admin FROM public.profiles WHERE id = profiles.id)
    OR is_super_admin()
  );

-- 5. Le super admin ne peut pas être supprimé via auth.admin.deleteUser depuis l'app
--    (protection au niveau applicatif dans confirm-delete-account)
