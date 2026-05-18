-- ============================================================
-- Migration 020 — Tout membre approuvé peut voir les inscrits
-- confirmés d'un événement (même s'il n'est pas inscrit lui-même)
-- ============================================================

-- Permet à n'importe quel membre approuvé de lire les inscriptions
-- avec statut 'confirmed' (pas les pending/refused/cancelled).
-- Les admins/moniteurs voient déjà tout via regs_select_admin.
DROP POLICY IF EXISTS "regs_select_confirmed_public" ON public.event_registrations;

CREATE POLICY "regs_select_confirmed_public"
  ON public.event_registrations FOR SELECT
  USING (
    status = 'confirmed'
    AND is_approved((SELECT auth.uid()))
  );
