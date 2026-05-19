-- ============================================================
-- Migration 025 — Espace CA : réunions, votes, documents
-- ============================================================

-- ─── Réunions CA ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ca_meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  meeting_date timestamptz NOT NULL,
  location text,
  agenda text,
  minutes text,                        -- PV (compte-rendu)
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ca_meeting_attendees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid REFERENCES public.ca_meetings(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  present boolean NOT NULL DEFAULT false,
  UNIQUE (meeting_id, member_id)
);

-- ─── Validations / Votes CA ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ca_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  meeting_id uuid REFERENCES public.ca_meetings(id) ON DELETE SET NULL,
  deadline timestamptz,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  quorum_required int DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ca_vote_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id uuid REFERENCES public.ca_votes(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  response text NOT NULL CHECK (response IN ('yes', 'no', 'abstain')),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (vote_id, member_id)
);

-- ─── Documents CA ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ca_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'autre'
    CHECK (category IN ('pv', 'statuts', 'contrat', 'finance', 'rapport', 'autre')),
  storage_path text NOT NULL,        -- chemin dans le bucket ca-documents
  file_name text NOT NULL,
  file_size int,
  meeting_id uuid REFERENCES public.ca_meetings(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ─── RLS sur toutes les nouvelles tables ─────────────────────

ALTER TABLE public.ca_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_vote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_documents ENABLE ROW LEVEL SECURITY;

-- Meetings
CREATE POLICY "ca_meetings_select" ON public.ca_meetings FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_meetings_insert" ON public.ca_meetings FOR INSERT WITH CHECK (is_ca_member());
CREATE POLICY "ca_meetings_update" ON public.ca_meetings FOR UPDATE USING (is_ca_member());
CREATE POLICY "ca_meetings_delete" ON public.ca_meetings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- Meeting attendees
CREATE POLICY "ca_attendees_select" ON public.ca_meeting_attendees FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_attendees_insert" ON public.ca_meeting_attendees FOR INSERT WITH CHECK (is_ca_member());
CREATE POLICY "ca_attendees_update" ON public.ca_meeting_attendees FOR UPDATE USING (is_ca_member());
CREATE POLICY "ca_attendees_delete" ON public.ca_meeting_attendees FOR DELETE USING (is_ca_member());

-- Votes
CREATE POLICY "ca_votes_select" ON public.ca_votes FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_votes_insert" ON public.ca_votes FOR INSERT WITH CHECK (is_ca_member());
CREATE POLICY "ca_votes_update" ON public.ca_votes FOR UPDATE USING (is_ca_member());
CREATE POLICY "ca_votes_delete" ON public.ca_votes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- Vote responses
CREATE POLICY "ca_vote_resp_select" ON public.ca_vote_responses FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_vote_resp_insert" ON public.ca_vote_responses FOR INSERT
  WITH CHECK (member_id = (SELECT auth.uid()) AND is_ca_member());
CREATE POLICY "ca_vote_resp_update" ON public.ca_vote_responses FOR UPDATE
  USING (member_id = (SELECT auth.uid()));

-- Documents
CREATE POLICY "ca_docs_meta_select" ON public.ca_documents FOR SELECT USING (is_ca_member());
CREATE POLICY "ca_docs_meta_insert" ON public.ca_documents FOR INSERT WITH CHECK (is_ca_member());
CREATE POLICY "ca_docs_meta_delete" ON public.ca_documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- ─── Triggers d'audit sur les nouvelles tables ───────────────

CREATE TRIGGER ca_audit_meetings
  AFTER INSERT OR UPDATE OR DELETE ON public.ca_meetings
  FOR EACH ROW EXECUTE FUNCTION log_ca_action();

CREATE TRIGGER ca_audit_votes
  AFTER INSERT OR UPDATE OR DELETE ON public.ca_votes
  FOR EACH ROW EXECUTE FUNCTION log_ca_action();

CREATE TRIGGER ca_audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.ca_documents
  FOR EACH ROW EXECUTE FUNCTION log_ca_action();
