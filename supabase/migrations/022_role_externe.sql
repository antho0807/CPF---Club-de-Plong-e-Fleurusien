-- ============================================================
-- Migration 022 — Rôle "externe"
-- Membre externe : accès calendrier uniquement (identification)
-- ============================================================

-- Étendre la contrainte role pour inclure 'externe'
DO $$
BEGIN
  EXECUTE (
    SELECT 'ALTER TABLE public.profiles DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'moniteur', 'membre', 'externe'));

-- Mettre à jour get_user_role pour inclure le nouveau rôle
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
