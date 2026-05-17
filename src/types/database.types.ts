export type BrevetLevel =
  | 'non_brevet'
  | '1_etoile'
  | '2_etoiles'
  | '3_etoiles'
  | '4_etoiles'
  | 'moniteur_club'
  | 'moniteur_federal'
  | 'instructeur'

export type UserRole = 'admin' | 'moniteur' | 'membre'

export type AccountStatus = 'pending' | 'approved' | 'rejected'

export type DocumentType = 'carte_lifras' | 'certificat_medical' | 'caci' | 'autre'

export type EventType =
  | 'entrainement_piscine'
  | 'sortie_mer'
  | 'sortie_lac'
  | 'sortie_carriere'
  | 'formation'
  | 'reunion'
  | 'competition'
  | 'autre'

export type SiteType = 'piscine' | 'mer' | 'lac' | 'carriere' | 'fosse'

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'refused'
export type ExerciseProgressStatus = 'pending' | 'in_progress' | 'done' | 'validated' | 'refused'
export type NotificationType =
  | 'registration_pending'
  | 'registration_confirmed'
  | 'registration_refused'
  | 'exercise_validated'
  | 'exercise_refused'
  | 'new_message'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  date_naissance: string | null
  lifras_number: string | null
  brevet_level: BrevetLevel | null
  role: UserRole
  status: AccountStatus
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface MemberDocument {
  id: string
  member_id: string
  type: DocumentType
  file_url: string
  storage_path: string | null  // Chemin dans le bucket Storage (requis pour signed URLs et suppression)
  filename: string | null
  expiry_date: string | null
  uploaded_at: string
  uploaded_by: string | null
  notes: string | null
}

export interface DiveSite {
  id: string
  name: string
  site_type: SiteType
  address: string | null
  gps_lat: number | null
  gps_lng: number | null
  country: string
  max_depth: number | null
  visibility_avg: number | null
  description: string | null
  safety_rules: string | null
  access_instructions: string | null
  facilities: string | null
  emergency_contacts: string | null
  min_brevet: BrevetLevel | null
  photos: string[] | null
  created_by: string | null
  created_at: string
}

export interface Event {
  id: string
  title: string
  event_type: EventType
  date_start: string
  date_end: string | null
  registration_deadline: string | null
  organizer_id: string | null
  location_id: string | null
  max_participants: number | null
  min_brevet: BrevetLevel | null
  description: string | null
  meeting_point: string | null
  carpooling_info: string | null
  equipment_needed: string | null
  created_by: string | null
  is_cancelled: boolean
  cancel_reason: string | null
  created_at: string
  // Joined
  dive_sites?: DiveSite
  event_registrations?: EventRegistration[]
}

export interface EventRegistration {
  id: string
  event_id: string
  member_id: string
  registered_at: string
  status: RegistrationStatus
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface EventExercise {
  id: string
  event_id: string
  title: string
  description: string | null
  min_brevet: BrevetLevel | null
  order_index: number
  created_by: string | null
  created_at: string
}

export interface MemberExerciseProgress {
  id: string
  exercise_id: string
  member_id: string
  status: ExerciseProgressStatus
  notes: string | null
  validated_by: string | null
  validated_at: string | null
  created_at: string
}

export interface EventMessage {
  id: string
  event_id: string
  sender_id: string
  content: string
  created_at: string
  // Joined
  profiles?: Pick<Profile, 'id' | 'full_name'>
}

export interface CAMember {
  id: string
  full_name: string
  role: string
  email: string | null
  phone: string | null
  order_index: number
}

export type MedicalStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing'

export interface ComplianceStatus {
  medical: MedicalStatus
  expiryDate: Date | null
  documentType: DocumentType | null
}
