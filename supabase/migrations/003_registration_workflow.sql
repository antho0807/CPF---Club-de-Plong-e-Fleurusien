-- ============================================================
-- Migration 003 — Workflow d'inscription avec validation
-- Ajoute : deadline d'inscription, statuts pending/refused
-- ============================================================

-- 1. Deadline et organisateur sur les événements
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Mettre à jour la contrainte de statut des inscriptions
ALTER TABLE event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_status_check;

ALTER TABLE event_registrations
  ADD CONSTRAINT event_registrations_status_check
  CHECK (status IN ('pending', 'confirmed', 'waitlist', 'cancelled', 'refused'));

-- 3. Les nouvelles inscriptions passent en "pending" par défaut
ALTER TABLE event_registrations
  ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Politiques RLS supplémentaires pour les inscriptions
-- (les politiques existantes couvrent déjà le SELECT/INSERT de base)

-- Permettre à un admin/moniteur de mettre à jour le statut d'une inscription
CREATE POLICY IF NOT EXISTS "moniteur_update_registrations" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'moniteur')
    )
  );
