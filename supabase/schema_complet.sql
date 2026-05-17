-- ============================================================
-- CPF — Club de Plongée Fleurusien
-- SCHÉMA COMPLET — migrations 001→006 consolidées
-- Idempotent : safe sur DB vierge OU existante
-- ============================================================

-- ─── 1. EXTENSIONS ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 2. TABLES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id             uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name      text NOT NULL,
  email          text UNIQUE NOT NULL,
  phone          text,
  date_naissance date,
  lifras_number  text UNIQUE,
  brevet_level   text CHECK (brevet_level IN (
                   'non_brevet','1_etoile','2_etoiles','3_etoiles',
                   '4_etoiles','moniteur_club','moniteur_federal','instructeur'
                 )),
  role           text CHECK (role IN ('admin','moniteur','membre')) DEFAULT 'membre' NOT NULL,
  is_active      boolean DEFAULT true NOT NULL,
  notes          text,
  created_at     timestamptz DEFAULT now() NOT NULL
);

-- Colonne status (migration 005) — ajoutée après pour être idempotent
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_status_check' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('pending','approved','rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS member_documents (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type         text CHECK (type IN (
                 'carte_lifras','certificat_medical','caci','autre'
               )) NOT NULL,
  file_url     text NOT NULL,
  storage_path text,
  filename     text,
  expiry_date  date,
  uploaded_at  timestamptz DEFAULT now() NOT NULL,
  uploaded_by  uuid REFERENCES profiles(id),
  notes        text
);
ALTER TABLE member_documents ADD COLUMN IF NOT EXISTS storage_path text;

CREATE TABLE IF NOT EXISTS dive_sites (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name                text NOT NULL,
  site_type           text CHECK (site_type IN (
                        'piscine','mer','lac','carriere','fosse'
                      )) NOT NULL,
  address             text,
  gps_lat             float,
  gps_lng             float,
  country             text DEFAULT 'BE' NOT NULL,
  max_depth           int,
  visibility_avg      int,
  description         text,
  safety_rules        text,
  access_instructions text,
  facilities          text,
  emergency_contacts  text,
  min_brevet          text CHECK (min_brevet IN (
                        'non_brevet','1_etoile','2_etoiles','3_etoiles',
                        '4_etoiles','moniteur_club','moniteur_federal','instructeur'
                      )),
  photos              text[],
  created_by          uuid REFERENCES profiles(id),
  created_at          timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title                 text NOT NULL,
  event_type            text CHECK (event_type IN (
                          'entrainement_piscine','sortie_mer','sortie_lac','sortie_carriere',
                          'formation','reunion','competition','autre'
                        )) NOT NULL,
  date_start            timestamptz NOT NULL,
  date_end              timestamptz,
  registration_deadline timestamptz,
  location_id           uuid REFERENCES dive_sites(id),
  organizer_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  max_participants      int,
  min_brevet            text CHECK (min_brevet IN (
                          'non_brevet','1_etoile','2_etoiles','3_etoiles',
                          '4_etoiles','moniteur_club','moniteur_federal','instructeur'
                        )),
  description           text,
  meeting_point         text,
  carpooling_info       text,
  equipment_needed      text,
  created_by            uuid REFERENCES profiles(id),
  is_cancelled          boolean DEFAULT false NOT NULL,
  cancel_reason         text,
  created_at            timestamptz DEFAULT now() NOT NULL
);
-- Colonnes ajoutées en migration 003 (idempotent)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS event_registrations (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  member_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  registered_at timestamptz DEFAULT now() NOT NULL,
  status        text DEFAULT 'pending' NOT NULL,
  UNIQUE(event_id, member_id)
);
-- Mise à jour de la contrainte status (migration 003)
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;
ALTER TABLE event_registrations
  ADD CONSTRAINT event_registrations_status_check
  CHECK (status IN ('pending','confirmed','waitlist','cancelled','refused'));
ALTER TABLE event_registrations ALTER COLUMN status SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS ca_members (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name   text NOT NULL,
  role        text NOT NULL,
  email       text,
  phone       text,
  order_index int DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type       text CHECK (type IN (
               'registration_pending','registration_confirmed','registration_refused',
               'exercise_validated','exercise_refused','new_message'
             )) NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  data       jsonb DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS member_exercise_progress (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id  uuid REFERENCES event_exercises(id) ON DELETE CASCADE NOT NULL,
  member_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status       text CHECK (status IN (
                 'pending','in_progress','done','validated','refused'
               )) DEFAULT 'pending' NOT NULL,
  notes        text,
  validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE(exercise_id, member_id)
);

CREATE TABLE IF NOT EXISTS event_messages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  sender_id  uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ─── 3. FONCTIONS ────────────────────────────────────────────
-- (après les tables pour que les colonnes existent lors de la compilation)

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_approved(user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = user_id AND status = 'approved'
  );
$$;

-- ─── 4. TRIGGER — profil auto à l'inscription ────────────────

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── 5. STORAGE ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', false)
ON CONFLICT DO NOTHING;

-- ─── 6. ACTIVER RLS ──────────────────────────────────────────

ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dive_sites               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages           ENABLE ROW LEVEL SECURITY;

-- ─── 7. NETTOYAGE — toutes les policies existantes ───────────

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "storage_read_own"   ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_admin" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_select"     ON storage.objects;
DROP POLICY IF EXISTS "storage_insert"     ON storage.objects;
DROP POLICY IF EXISTS "storage_delete"     ON storage.objects;

-- ─── 8. POLICIES : PROFILES ──────────────────────────────────

-- Tout utilisateur lit son propre profil (quel que soit le statut)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- Admin/moniteur APPROUVÉ lit tous les profils
-- Utilise les fonctions SECURITY DEFINER pour éviter la récursion RLS
CREATE POLICY "profiles_read_admin"
  ON profiles FOR SELECT
  USING (
    get_user_role((SELECT auth.uid())) IN ('admin','moniteur')
    AND is_approved((SELECT auth.uid()))
  );

-- Tout utilisateur met à jour son propre profil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Création de son propre profil (trigger handle_new_user)
CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Admin APPROUVÉ : toutes opérations sur tous les profils
CREATE POLICY "profiles_all_admin"
  ON profiles FOR ALL
  USING (
    get_user_role((SELECT auth.uid())) = 'admin'
    AND is_approved((SELECT auth.uid()))
  );

-- ─── 9. POLICIES : MEMBER_DOCUMENTS ──────────────────────────

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

CREATE POLICY "docs_select_admin"
  ON member_documents FOR SELECT
  USING (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

CREATE POLICY "docs_insert_admin"
  ON member_documents FOR INSERT
  WITH CHECK (get_user_role((SELECT auth.uid())) = 'admin');

CREATE POLICY "docs_delete_admin"
  ON member_documents FOR DELETE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- ─── 10. POLICIES : DIVE_SITES ───────────────────────────────

CREATE POLICY "sites_read_all"
  ON dive_sites FOR SELECT
  USING (is_approved((SELECT auth.uid())));

CREATE POLICY "sites_write_moniteur"
  ON dive_sites FOR INSERT
  WITH CHECK (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

CREATE POLICY "sites_update_moniteur"
  ON dive_sites FOR UPDATE
  USING (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

CREATE POLICY "sites_delete_admin"
  ON dive_sites FOR DELETE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- ─── 11. POLICIES : EVENTS ───────────────────────────────────

CREATE POLICY "events_read_all"
  ON events FOR SELECT
  USING (is_approved((SELECT auth.uid())));

CREATE POLICY "events_write_moniteur"
  ON events FOR INSERT
  WITH CHECK (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

CREATE POLICY "events_update_moniteur"
  ON events FOR UPDATE
  USING (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

CREATE POLICY "events_delete_admin"
  ON events FOR DELETE
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- ─── 12. POLICIES : EVENT_REGISTRATIONS ──────────────────────

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
  USING (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

CREATE POLICY "regs_all_admin"
  ON event_registrations FOR ALL
  USING (get_user_role((SELECT auth.uid())) = 'admin');

CREATE POLICY "moniteur_update_registrations"
  ON event_registrations FOR UPDATE
  USING (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

-- ─── 13. POLICIES : CA_MEMBERS ───────────────────────────────

CREATE POLICY "ca_read_all"
  ON ca_members FOR SELECT
  USING (is_approved((SELECT auth.uid())));

CREATE POLICY "ca_write_admin"
  ON ca_members FOR ALL
  USING (get_user_role((SELECT auth.uid())) = 'admin');

-- ─── 14. POLICIES : NOTIFICATIONS ────────────────────────────

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_insert_any"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- ─── 15. POLICIES : EVENT_EXERCISES ──────────────────────────

-- Lecture réservée aux membres approuvés
CREATE POLICY "exercises_read_all"
  ON event_exercises FOR SELECT
  USING (is_approved((SELECT auth.uid())));

CREATE POLICY "exercises_write_staff"
  ON event_exercises FOR ALL
  USING (get_user_role((SELECT auth.uid())) IN ('admin','moniteur'));

-- ─── 16. POLICIES : MEMBER_EXERCISE_PROGRESS ─────────────────

CREATE POLICY "progress_read"
  ON member_exercise_progress FOR SELECT
  USING (
    is_approved((SELECT auth.uid())) AND (
      member_id = (SELECT auth.uid()) OR
      get_user_role((SELECT auth.uid())) IN ('admin','moniteur')
    )
  );

CREATE POLICY "progress_insert_self"
  ON member_exercise_progress FOR INSERT
  WITH CHECK (member_id = (SELECT auth.uid()));

CREATE POLICY "progress_update"
  ON member_exercise_progress FOR UPDATE
  USING (
    member_id = (SELECT auth.uid()) OR
    get_user_role((SELECT auth.uid())) IN ('admin','moniteur')
  );

-- ─── 17. POLICIES : EVENT_MESSAGES ───────────────────────────

-- Lecture : approuvé + (inscrit confirmé OU moniteur/admin)
CREATE POLICY "messages_read"
  ON event_messages FOR SELECT
  USING (
    is_approved((SELECT auth.uid())) AND (
      EXISTS (
        SELECT 1 FROM event_registrations
        WHERE event_id = event_messages.event_id
          AND member_id = (SELECT auth.uid())
          AND status = 'confirmed'
      ) OR
      get_user_role((SELECT auth.uid())) IN ('admin','moniteur')
    )
  );

-- Écriture : idem, plus sender_id = uid
CREATE POLICY "messages_insert"
  ON event_messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT auth.uid()) AND
    is_approved((SELECT auth.uid())) AND (
      EXISTS (
        SELECT 1 FROM event_registrations
        WHERE event_id = event_messages.event_id
          AND member_id = (SELECT auth.uid())
          AND status = 'confirmed'
      ) OR
      get_user_role((SELECT auth.uid())) IN ('admin','moniteur')
    )
  );

-- ─── 18. POLICIES : STORAGE ──────────────────────────────────

CREATE POLICY "storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-documents'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR get_user_role((SELECT auth.uid())) IN ('admin','moniteur')
    )
  );

CREATE POLICY "storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR get_user_role((SELECT auth.uid())) = 'admin'
    )
  );

CREATE POLICY "storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'member-documents'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR get_user_role((SELECT auth.uid())) = 'admin'
    )
  );

-- ─── 19. INDEXES ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_email          ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status         ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active      ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_member_id     ON member_documents(member_id);
CREATE INDEX IF NOT EXISTS idx_documents_type          ON member_documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_expiry        ON member_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_storage_path  ON member_documents(storage_path) WHERE storage_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_date_start       ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_type             ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_registrations_event     ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_member    ON event_registrations(member_id);

-- ============================================================
-- ✅ ÉTAPE FINALE OBLIGATOIRE
--
-- Après avoir exécuté ce script, approuver les comptes existants.
-- Sans ça, TOUT le monde est bloqué en "pending".
--
-- 1. Approuver ton compte admin (priorité absolue) :
--    UPDATE profiles SET status = 'approved' WHERE role = 'admin';
--
-- 2. Approuver tous les membres existants si la base est de confiance :
--    UPDATE profiles SET status = 'approved'
--    WHERE role IN ('moniteur', 'membre');
--
-- 3. Vérifier que ça a fonctionné :
--    SELECT email, role, status FROM profiles ORDER BY role;
-- ============================================================
