-- ============================================================
-- Migration 024 — Sécurité Espace CA : niveaux RLS + audit log
-- ============================================================

-- ─── NIVEAU 1 : Fonction de vérification CA ────────────────

-- Note : notre colonne s'appelle 'is_ca' (boolean), status 'approved'
CREATE OR REPLACE FUNCTION is_ca_member()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND (role = 'admin' OR is_ca = true)
      AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ─── Renforcement RLS tables CA existantes ──────────────────

-- ca_stock_products : remplacer is_ca_or_admin par is_ca_member
DROP POLICY IF EXISTS "ca_stocks_select" ON public.ca_stock_products;
DROP POLICY IF EXISTS "ca_stocks_insert" ON public.ca_stock_products;
DROP POLICY IF EXISTS "ca_stocks_update" ON public.ca_stock_products;
DROP POLICY IF EXISTS "ca_stocks_delete" ON public.ca_stock_products;

CREATE POLICY "ca_stocks_select" ON public.ca_stock_products FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_stocks_insert" ON public.ca_stock_products FOR INSERT WITH CHECK (is_ca_member());
CREATE POLICY "ca_stocks_update" ON public.ca_stock_products FOR UPDATE USING (is_ca_member());
CREATE POLICY "ca_stocks_delete" ON public.ca_stock_products FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- ca_stock_movements
DROP POLICY IF EXISTS "ca_movements_select" ON public.ca_stock_movements;
DROP POLICY IF EXISTS "ca_movements_insert" ON public.ca_stock_movements;

CREATE POLICY "ca_movements_select" ON public.ca_stock_movements FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_movements_insert" ON public.ca_stock_movements FOR INSERT
  WITH CHECK (created_by = (SELECT auth.uid()) AND is_ca_member());

-- ca_treasury
DROP POLICY IF EXISTS "ca_treasury_select" ON public.ca_treasury;
DROP POLICY IF EXISTS "ca_treasury_insert" ON public.ca_treasury;
DROP POLICY IF EXISTS "ca_treasury_update" ON public.ca_treasury;
DROP POLICY IF EXISTS "ca_treasury_delete" ON public.ca_treasury;

CREATE POLICY "ca_treasury_select" ON public.ca_treasury FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_treasury_insert" ON public.ca_treasury FOR INSERT
  WITH CHECK (created_by = (SELECT auth.uid()) AND is_ca_member());
CREATE POLICY "ca_treasury_update" ON public.ca_treasury FOR UPDATE USING (is_ca_member());
CREATE POLICY "ca_treasury_delete" ON public.ca_treasury FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- ─── NIVEAU 5 : Table d'audit ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.ca_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,          -- INSERT, UPDATE, DELETE
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ca_audit_log ENABLE ROW LEVEL SECURITY;

-- Seul admin peut lire le log d'audit
CREATE POLICY "ca_audit_admin_read" ON public.ca_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- Insertion uniquement par les fonctions internes (trigger SECURITY DEFINER)
CREATE POLICY "ca_audit_insert_trigger" ON public.ca_audit_log FOR INSERT
  WITH CHECK (true);

-- ─── Trigger d'audit ────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_ca_action()
RETURNS trigger AS $$
DECLARE
  rec_id uuid;
  details jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec_id := OLD.id;
    details := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'INSERT' THEN
    rec_id := NEW.id;
    details := jsonb_build_object('new', to_jsonb(NEW));
  ELSE
    rec_id := NEW.id;
    details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.ca_audit_log (user_id, action, table_name, record_id, details)
  VALUES ((SELECT auth.uid()), TG_OP, TG_TABLE_NAME, rec_id, details);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Appliquer les triggers sur les tables CA existantes
DROP TRIGGER IF EXISTS ca_audit_stock_products ON public.ca_stock_products;
CREATE TRIGGER ca_audit_stock_products
  AFTER INSERT OR UPDATE OR DELETE ON public.ca_stock_products
  FOR EACH ROW EXECUTE FUNCTION log_ca_action();

DROP TRIGGER IF EXISTS ca_audit_stock_movements ON public.ca_stock_movements;
CREATE TRIGGER ca_audit_stock_movements
  AFTER INSERT OR UPDATE OR DELETE ON public.ca_stock_movements
  FOR EACH ROW EXECUTE FUNCTION log_ca_action();

DROP TRIGGER IF EXISTS ca_audit_treasury ON public.ca_treasury;
CREATE TRIGGER ca_audit_treasury
  AFTER INSERT OR UPDATE OR DELETE ON public.ca_treasury
  FOR EACH ROW EXECUTE FUNCTION log_ca_action();

-- ─── Bucket ca-documents (privé) ────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('ca-documents', 'ca-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policies Storage
DROP POLICY IF EXISTS "ca_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "ca_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "ca_docs_delete" ON storage.objects;

CREATE POLICY "ca_docs_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'ca-documents' AND is_ca_member());

CREATE POLICY "ca_docs_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ca-documents' AND is_ca_member());

CREATE POLICY "ca_docs_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ca-documents'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
