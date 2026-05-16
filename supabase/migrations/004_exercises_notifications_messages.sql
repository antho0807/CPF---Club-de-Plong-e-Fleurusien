-- ============================================================
-- Migration 004 — Exercices, notifications in-app, messages
-- ============================================================

-- ── 1. NOTIFICATIONS IN-APP ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type        text CHECK (type IN (
                'registration_pending',
                'registration_confirmed',
                'registration_refused',
                'exercise_validated',
                'exercise_refused',
                'new_message'
              )) NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  data        jsonb DEFAULT '{}',
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_insert_any" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));


-- ── 2. EXERCICES PAR ÉVÉNEMENT ───────────────────────────────
CREATE TABLE IF NOT EXISTS event_exercises (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  description text,
  min_brevet  text CHECK (min_brevet IN (
                'non_brevet','1_etoile','2_etoiles','3_etoiles',
                '4_etoiles','moniteur_club','moniteur_federal','instructeur'
              )),
  order_index int DEFAULT 0 NOT NULL,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE event_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_read_all" ON event_exercises
  FOR SELECT USING (true);

CREATE POLICY "exercises_write_staff" ON event_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'moniteur')
    )
  );


-- ── 3. PROGRESSION DES MEMBRES (par exercice) ────────────────
CREATE TABLE IF NOT EXISTS member_exercise_progress (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id   uuid REFERENCES event_exercises(id) ON DELETE CASCADE NOT NULL,
  member_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status        text CHECK (status IN ('pending','in_progress','done','validated','refused'))
                  DEFAULT 'pending' NOT NULL,
  notes         text,
  validated_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at  timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE(exercise_id, member_id)
);

ALTER TABLE member_exercise_progress ENABLE ROW LEVEL SECURITY;

-- Un membre voit sa propre progression ; moniteur/admin voient tout
CREATE POLICY "progress_read" ON member_exercise_progress
  FOR SELECT USING (
    member_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
    )
  );

CREATE POLICY "progress_insert_self" ON member_exercise_progress
  FOR INSERT WITH CHECK (member_id = (SELECT auth.uid()));

-- Le membre peut modifier son propre statut (pending → in_progress → done)
-- Le moniteur peut valider/refuser
CREATE POLICY "progress_update" ON member_exercise_progress
  FOR UPDATE USING (
    member_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
    )
  );


-- ── 4. MESSAGES PAR ÉVÉNEMENT ─────────────────────────────────
CREATE TABLE IF NOT EXISTS event_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  sender_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Visible aux inscrits confirmés et aux moniteurs/admins
CREATE POLICY "messages_read" ON event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_id = event_messages.event_id
        AND member_id = (SELECT auth.uid())
        AND status = 'confirmed'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
    )
  );

CREATE POLICY "messages_insert" ON event_messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM event_registrations
        WHERE event_id = event_messages.event_id
          AND member_id = (SELECT auth.uid())
          AND status = 'confirmed'
      ) OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'moniteur')
      )
    )
  );
