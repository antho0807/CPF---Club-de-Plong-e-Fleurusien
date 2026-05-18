-- ============================================================
-- Migration 017 — Espace CA : stocks buvette + trésorerie
-- ============================================================

-- 1. Colonne is_ca sur les profils (membres du Conseil d'Administration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_ca boolean NOT NULL DEFAULT false;

-- 2. Produits buvette / stocks
CREATE TABLE IF NOT EXISTS public.ca_stock_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('boisson', 'snack', 'autre')),
  price decimal(10,2) NOT NULL DEFAULT 0,
  quantity_current int NOT NULL DEFAULT 0,
  quantity_threshold int NOT NULL DEFAULT 5,
  unit text NOT NULL DEFAULT 'unité',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Mouvements de stock (log de toutes les entrées/sorties)
CREATE TABLE IF NOT EXISTS public.ca_stock_movements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.ca_stock_products(id) ON DELETE CASCADE NOT NULL,
  quantity_change int NOT NULL,  -- positif = entrée, négatif = sortie
  reason text NOT NULL CHECK (reason IN ('achat', 'vente', 'perte', 'ajustement')),
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Trésorerie
CREATE TABLE IF NOT EXISTS public.ca_treasury (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  amount decimal(10,2) NOT NULL,      -- positif = recette, négatif = dépense
  category text NOT NULL CHECK (category IN ('buvette', 'cotisation', 'achat_stock', 'evenement', 'autre')),
  description text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Activation RLS
ALTER TABLE public.ca_stock_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_treasury ENABLE ROW LEVEL SECURITY;

-- 6. Helper : est membre CA ou admin ?
CREATE OR REPLACE FUNCTION is_ca_or_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND (is_ca = true OR role = 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 7. Politiques ca_stock_products
DROP POLICY IF EXISTS "ca_stocks_select" ON public.ca_stock_products;
DROP POLICY IF EXISTS "ca_stocks_insert" ON public.ca_stock_products;
DROP POLICY IF EXISTS "ca_stocks_update" ON public.ca_stock_products;
DROP POLICY IF EXISTS "ca_stocks_delete" ON public.ca_stock_products;

CREATE POLICY "ca_stocks_select" ON public.ca_stock_products FOR SELECT
  USING (is_ca_or_admin((SELECT auth.uid())));

CREATE POLICY "ca_stocks_insert" ON public.ca_stock_products FOR INSERT
  WITH CHECK (is_ca_or_admin((SELECT auth.uid())));

CREATE POLICY "ca_stocks_update" ON public.ca_stock_products FOR UPDATE
  USING (is_ca_or_admin((SELECT auth.uid())));

CREATE POLICY "ca_stocks_delete" ON public.ca_stock_products FOR DELETE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- 8. Politiques ca_stock_movements
DROP POLICY IF EXISTS "ca_movements_select" ON public.ca_stock_movements;
DROP POLICY IF EXISTS "ca_movements_insert" ON public.ca_stock_movements;

CREATE POLICY "ca_movements_select" ON public.ca_stock_movements FOR SELECT
  USING (is_ca_or_admin((SELECT auth.uid())));

CREATE POLICY "ca_movements_insert" ON public.ca_stock_movements FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid()) AND
    is_ca_or_admin((SELECT auth.uid()))
  );

-- 9. Politiques ca_treasury
DROP POLICY IF EXISTS "ca_treasury_select" ON public.ca_treasury;
DROP POLICY IF EXISTS "ca_treasury_insert" ON public.ca_treasury;
DROP POLICY IF EXISTS "ca_treasury_update" ON public.ca_treasury;
DROP POLICY IF EXISTS "ca_treasury_delete" ON public.ca_treasury;

CREATE POLICY "ca_treasury_select" ON public.ca_treasury FOR SELECT
  USING (is_ca_or_admin((SELECT auth.uid())));

CREATE POLICY "ca_treasury_insert" ON public.ca_treasury FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid()) AND
    is_ca_or_admin((SELECT auth.uid()))
  );

CREATE POLICY "ca_treasury_update" ON public.ca_treasury FOR UPDATE
  USING (
    created_by = (SELECT auth.uid()) OR
    get_user_role((SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "ca_treasury_delete" ON public.ca_treasury FOR DELETE
  USING (
    created_by = (SELECT auth.uid()) OR
    get_user_role((SELECT auth.uid())) = 'admin'
  );
