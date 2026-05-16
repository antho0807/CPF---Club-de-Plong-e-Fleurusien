-- ============================================================
-- Migration 002 — CPF Plongée
-- 1. Ajout de storage_path dans member_documents
-- 2. Correction des politiques RLS dépréciées (auth.role())
-- 3. Ajout de la politique UPDATE pour les inscriptions
-- ============================================================

-- ---------------------------------------------------------------
-- 1. Colonne storage_path
--    Stocke le chemin exact dans le bucket Storage (ex: "uuid/1716900000.pdf")
--    Nécessaire pour : signed URLs, suppression des fichiers, ré-génération
-- ---------------------------------------------------------------
ALTER TABLE member_documents
  ADD COLUMN IF NOT EXISTS storage_path text;

-- Index pour les recherches par chemin
CREATE INDEX IF NOT EXISTS idx_documents_storage_path
  ON member_documents(storage_path)
  WHERE storage_path IS NOT NULL;

-- ---------------------------------------------------------------
-- 2. Correction des politiques RLS dépréciées
--    auth.role() est déprécié → remplacé par (auth.uid() IS NOT NULL)
--    ou le check explicite sur auth.jwt()
-- ---------------------------------------------------------------

-- DIVE_SITES : remplacer auth.role() = 'authenticated'
DROP POLICY IF EXISTS "sites_read_all" ON dive_sites;
CREATE POLICY "sites_read_all"
  ON dive_sites FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

-- EVENTS : même correction
DROP POLICY IF EXISTS "events_read_all" ON events;
CREATE POLICY "events_read_all"
  ON events FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

-- CA_MEMBERS : même correction
DROP POLICY IF EXISTS "ca_read_all" ON ca_members;
CREATE POLICY "ca_read_all"
  ON ca_members FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ---------------------------------------------------------------
-- 3. Correction des politiques profiles conflictuelles
--    La politique profiles_all_admin couvre déjà SELECT/INSERT/UPDATE/DELETE
--    pour les admins, ce qui crée des conflits avec profiles_update_own
--    et profiles_insert_self. On nettoie pour être explicite.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_all_admin" ON profiles;

-- Admin : SELECT sur tous les profils (déjà couvert par profiles_read_admin)
-- Admin : UPDATE sur tous les profils
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- Admin : INSERT (pour créer des profils via la fonction invite)
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (get_user_role((SELECT auth.uid())) = 'admin');

-- Admin : DELETE
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- Correction des références à auth.uid() pour utiliser la forme recommandée
-- (évite l'évaluation répétée par row, améliore les performances)
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_read_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_select_moniteur_admin"
  ON profiles FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- ---------------------------------------------------------------
-- 4. Politiques member_documents — nettoyage des conflits
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "docs_read_own" ON member_documents;
DROP POLICY IF EXISTS "docs_crud_own" ON member_documents;
DROP POLICY IF EXISTS "docs_read_admin" ON member_documents;
DROP POLICY IF EXISTS "docs_all_admin" ON member_documents;

-- Membres : accès à leurs propres documents
CREATE POLICY "docs_select_own"
  ON member_documents FOR SELECT
  USING (member_id = (SELECT auth.uid()));

CREATE POLICY "docs_insert_own"
  ON member_documents FOR INSERT
  WITH CHECK (member_id = (SELECT auth.uid()));

CREATE POLICY "docs_update_own"
  ON member_documents FOR UPDATE
  USING (member_id = (SELECT auth.uid()));

CREATE POLICY "docs_delete_own"
  ON member_documents FOR DELETE
  USING (member_id = (SELECT auth.uid()));

-- Admin/moniteur : lecture de tous les documents
CREATE POLICY "docs_select_admin"
  ON member_documents FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));

-- Admin : écriture sur tous les documents (pour upload au nom d'un membre)
CREATE POLICY "docs_insert_admin"
  ON member_documents FOR INSERT
  WITH CHECK (get_user_role((SELECT auth.uid())) = 'admin');

CREATE POLICY "docs_delete_admin"
  ON member_documents FOR DELETE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- ---------------------------------------------------------------
-- 5. Politiques event_registrations — ajouter UPDATE pour liste d'attente
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "regs_crud_own" ON event_registrations;
DROP POLICY IF EXISTS "regs_read_admin" ON event_registrations;

CREATE POLICY "regs_select_own"
  ON event_registrations FOR SELECT
  USING (member_id = (SELECT auth.uid()));

CREATE POLICY "regs_insert_own"
  ON event_registrations FOR INSERT
  WITH CHECK (member_id = (SELECT auth.uid()));

CREATE POLICY "regs_update_own"
  ON event_registrations FOR UPDATE
  USING (member_id = (SELECT auth.uid()));

CREATE POLICY "regs_delete_own"
  ON event_registrations FOR DELETE
  USING (member_id = (SELECT auth.uid()));

CREATE POLICY "regs_select_admin"
  ON event_registrations FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur'));

CREATE POLICY "regs_all_admin"
  ON event_registrations FOR ALL
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- ---------------------------------------------------------------
-- 6. Correction get_user_role — utiliser SECURITY INVOKER safe pattern
--    Évite la récursivité RLS et améliore les performances
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = user_id LIMIT 1;
$$;

-- ---------------------------------------------------------------
-- 7. Storage policies — améliorer pour inclure admin/moniteur en lecture
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "storage_read_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_admin" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;

-- Lecture : propriétaire du dossier OU admin/moniteur
CREATE POLICY "storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-documents'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR get_user_role((SELECT auth.uid())) IN ('admin', 'moniteur')
    )
  );

-- Upload : uniquement dans son propre dossier
CREATE POLICY "storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR get_user_role((SELECT auth.uid())) = 'admin'
    )
  );

-- Suppression : propriétaire OU admin
CREATE POLICY "storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'member-documents'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR get_user_role((SELECT auth.uid())) = 'admin'
    )
  );
