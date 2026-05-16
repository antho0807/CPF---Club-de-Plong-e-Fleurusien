-- ============================================================
-- CPF — Club de Plongée Fleurusien
-- Migration initiale — Schéma complet + RLS
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  date_naissance date,
  lifras_number text UNIQUE,
  brevet_level text CHECK (brevet_level IN (
    'non_brevet', '1_etoile', '2_etoiles', '3_etoiles',
    '4_etoiles', 'moniteur_club', 'moniteur_federal', 'instructeur'
  )),
  role text CHECK (role IN ('admin', 'moniteur', 'membre')) DEFAULT 'membre' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'membre'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABLE: member_documents
-- ============================================================
CREATE TABLE member_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN (
    'carte_lifras',
    'certificat_medical',
    'caci',
    'autre'
  )) NOT NULL,
  file_url text NOT NULL,
  filename text,
  expiry_date date,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  notes text
);

-- ============================================================
-- TABLE: dive_sites
-- ============================================================
CREATE TABLE dive_sites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  site_type text CHECK (site_type IN ('piscine', 'mer', 'lac', 'carriere', 'fosse')) NOT NULL,
  address text,
  gps_lat float,
  gps_lng float,
  country text DEFAULT 'BE' NOT NULL,
  max_depth int,
  visibility_avg int,
  description text,
  safety_rules text,
  access_instructions text,
  facilities text,
  emergency_contacts text,
  min_brevet text CHECK (min_brevet IN (
    'non_brevet', '1_etoile', '2_etoiles', '3_etoiles',
    '4_etoiles', 'moniteur_club', 'moniteur_federal', 'instructeur'
  )),
  photos text[],
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- TABLE: events
-- ============================================================
CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  event_type text CHECK (event_type IN (
    'entrainement_piscine',
    'sortie_mer',
    'sortie_lac',
    'sortie_carriere',
    'formation',
    'reunion',
    'competition',
    'autre'
  )) NOT NULL,
  date_start timestamptz NOT NULL,
  date_end timestamptz,
  location_id uuid REFERENCES dive_sites(id),
  max_participants int,
  min_brevet text CHECK (min_brevet IN (
    'non_brevet', '1_etoile', '2_etoiles', '3_etoiles',
    '4_etoiles', 'moniteur_club', 'moniteur_federal', 'instructeur'
  )),
  description text,
  meeting_point text,
  carpooling_info text,
  equipment_needed text,
  created_by uuid REFERENCES profiles(id),
  is_cancelled boolean DEFAULT false NOT NULL,
  cancel_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- TABLE: event_registrations
-- ============================================================
CREATE TABLE event_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  registered_at timestamptz DEFAULT now() NOT NULL,
  status text CHECK (status IN ('confirmed', 'waitlist', 'cancelled')) DEFAULT 'confirmed' NOT NULL,
  UNIQUE(event_id, member_id)
);

-- ============================================================
-- TABLE: ca_members (Conseil d'Administration)
-- ============================================================
CREATE TABLE ca_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  order_index int DEFAULT 0 NOT NULL
);

-- ============================================================
-- SUPABASE STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE dive_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_members ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES policies
-- ============================================================
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_read_admin"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_all_admin"
  ON profiles FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- MEMBER_DOCUMENTS policies
-- ============================================================
CREATE POLICY "docs_read_own"
  ON member_documents FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "docs_crud_own"
  ON member_documents FOR ALL
  USING (member_id = auth.uid());

CREATE POLICY "docs_read_admin"
  ON member_documents FOR SELECT
  USING (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

CREATE POLICY "docs_all_admin"
  ON member_documents FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- DIVE_SITES policies
-- ============================================================
CREATE POLICY "sites_read_all"
  ON dive_sites FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "sites_write_moniteur"
  ON dive_sites FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

CREATE POLICY "sites_update_moniteur"
  ON dive_sites FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

CREATE POLICY "sites_delete_admin"
  ON dive_sites FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- EVENTS policies
-- ============================================================
CREATE POLICY "events_read_all"
  ON events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "events_write_moniteur"
  ON events FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

CREATE POLICY "events_update_moniteur"
  ON events FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

CREATE POLICY "events_delete_admin"
  ON events FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- EVENT_REGISTRATIONS policies
-- ============================================================
CREATE POLICY "regs_crud_own"
  ON event_registrations FOR ALL
  USING (member_id = auth.uid());

CREATE POLICY "regs_read_admin"
  ON event_registrations FOR SELECT
  USING (get_user_role(auth.uid()) IN ('admin', 'moniteur'));

-- ============================================================
-- CA_MEMBERS policies
-- ============================================================
CREATE POLICY "ca_read_all"
  ON ca_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ca_write_admin"
  ON ca_members FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- STORAGE policies
-- ============================================================
CREATE POLICY "storage_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'member-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_read_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-documents'
    AND get_user_role(auth.uid()) IN ('admin', 'moniteur')
  );

CREATE POLICY "storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'member-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR get_user_role(auth.uid()) = 'admin'
    )
  );

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_documents_member_id ON member_documents(member_id);
CREATE INDEX idx_documents_type ON member_documents(type);
CREATE INDEX idx_documents_expiry ON member_documents(expiry_date);
CREATE INDEX idx_events_date_start ON events(date_start);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_member ON event_registrations(member_id);
