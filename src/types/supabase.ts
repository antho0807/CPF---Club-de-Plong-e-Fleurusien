// Types générés depuis le schéma Supabase du projet CPF
// Équivalent au résultat de : supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          date_naissance: string | null
          lifras_number: string | null
          brevet_level:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          role: 'admin' | 'moniteur' | 'membre' | 'externe'
          status: 'pending' | 'approved' | 'rejected'
          alias: string | null
          is_active: boolean
          is_ca: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          date_naissance?: string | null
          lifras_number?: string | null
          brevet_level?:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          role?: 'admin' | 'moniteur' | 'membre' | 'externe'
          status?: 'pending' | 'approved' | 'rejected'
          alias?: string | null
          is_active?: boolean
          is_ca?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          date_naissance?: string | null
          lifras_number?: string | null
          brevet_level?:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          role?: 'admin' | 'moniteur' | 'membre' | 'externe'
          status?: 'pending' | 'approved' | 'rejected'
          alias?: string | null
          is_active?: boolean
          is_ca?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          new_event: boolean
          event_reminder: boolean
          registration_update: boolean
          new_message: boolean
          account_approved: boolean
          medical_expiry: boolean
          club_announcement: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          new_event?: boolean
          event_reminder?: boolean
          registration_update?: boolean
          new_message?: boolean
          account_approved?: boolean
          medical_expiry?: boolean
          club_announcement?: boolean
          updated_at?: string
        }
        Update: {
          new_event?: boolean
          event_reminder?: boolean
          registration_update?: boolean
          new_message?: boolean
          account_approved?: boolean
          medical_expiry?: boolean
          club_announcement?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ca_stock_products: {
        Row: {
          id: string
          name: string
          category: 'boisson' | 'snack' | 'autre'
          price: number
          quantity_current: number
          quantity_threshold: number
          unit: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'boisson' | 'snack' | 'autre'
          price?: number
          quantity_current?: number
          quantity_threshold?: number
          unit?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          category?: 'boisson' | 'snack' | 'autre'
          price?: number
          quantity_current?: number
          quantity_threshold?: number
          unit?: string
          is_active?: boolean
        }
        Relationships: []
      }
      ca_stock_movements: {
        Row: {
          id: string
          product_id: string
          quantity_change: number
          reason: 'achat' | 'vente' | 'perte' | 'ajustement'
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity_change: number
          reason: 'achat' | 'vente' | 'perte' | 'ajustement'
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      ca_treasury: {
        Row: {
          id: string
          amount: number
          category: 'buvette' | 'cotisation' | 'achat_stock' | 'evenement' | 'autre'
          description: string
          date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          category: 'buvette' | 'cotisation' | 'achat_stock' | 'evenement' | 'autre'
          description: string
          date?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          category?: 'buvette' | 'cotisation' | 'achat_stock' | 'evenement' | 'autre'
          description?: string
          date?: string
        }
        Relationships: []
      }
      ca_meetings: {
        Row: { id: string; title: string; meeting_date: string; location: string | null; agenda: string | null; minutes: string | null; status: 'planned' | 'in_progress' | 'completed' | 'cancelled'; created_by: string | null; created_at: string }
        Insert: { id?: string; title: string; meeting_date: string; location?: string | null; agenda?: string | null; minutes?: string | null; status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'; created_by?: string | null }
        Update: { title?: string; meeting_date?: string; location?: string | null; agenda?: string | null; minutes?: string | null; status?: 'planned' | 'in_progress' | 'completed' | 'cancelled' }
        Relationships: []
      }
      ca_meeting_attendees: {
        Row: { id: string; meeting_id: string; member_id: string; present: boolean }
        Insert: { id?: string; meeting_id: string; member_id: string; present?: boolean }
        Update: { present?: boolean }
        Relationships: []
      }
      ca_votes: {
        Row: { id: string; title: string; description: string | null; meeting_id: string | null; deadline: string | null; status: 'open' | 'closed' | 'cancelled'; quorum_required: number; created_by: string | null; created_at: string }
        Insert: { id?: string; title: string; description?: string | null; meeting_id?: string | null; deadline?: string | null; status?: 'open' | 'closed' | 'cancelled'; quorum_required?: number; created_by?: string | null }
        Update: { title?: string; description?: string | null; status?: 'open' | 'closed' | 'cancelled'; deadline?: string | null }
        Relationships: []
      }
      ca_vote_responses: {
        Row: { id: string; vote_id: string; member_id: string; response: 'yes' | 'no' | 'abstain'; comment: string | null; created_at: string }
        Insert: { id?: string; vote_id: string; member_id: string; response: 'yes' | 'no' | 'abstain'; comment?: string | null }
        Update: { response?: 'yes' | 'no' | 'abstain'; comment?: string | null }
        Relationships: []
      }
      ca_documents: {
        Row: { id: string; title: string; category: 'pv' | 'statuts' | 'contrat' | 'finance' | 'rapport' | 'autre'; storage_path: string; file_name: string; file_size: number | null; meeting_id: string | null; uploaded_by: string | null; created_at: string }
        Insert: { id?: string; title: string; category?: 'pv' | 'statuts' | 'contrat' | 'finance' | 'rapport' | 'autre'; storage_path: string; file_name: string; file_size?: number | null; meeting_id?: string | null; uploaded_by?: string | null }
        Update: { title?: string; category?: 'pv' | 'statuts' | 'contrat' | 'finance' | 'rapport' | 'autre' }
        Relationships: []
      }
      member_documents: {
        Row: {
          id: string
          member_id: string
          type: 'carte_lifras' | 'certificat_medical' | 'caci' | 'autre'
          file_url: string
          storage_path: string | null
          filename: string | null
          expiry_date: string | null
          uploaded_at: string
          uploaded_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          member_id: string
          type: 'carte_lifras' | 'certificat_medical' | 'caci' | 'autre'
          file_url: string
          storage_path?: string | null
          filename?: string | null
          expiry_date?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          notes?: string | null
        }
        Update: {
          member_id?: string
          type?: 'carte_lifras' | 'certificat_medical' | 'caci' | 'autre'
          file_url?: string
          storage_path?: string | null
          filename?: string | null
          expiry_date?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'member_documents_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'member_documents_uploaded_by_fkey'
            columns: ['uploaded_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      dive_sites: {
        Row: {
          id: string
          name: string
          site_type: 'piscine' | 'mer' | 'lac' | 'carriere' | 'fosse'
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
          min_brevet:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          photos: string[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          site_type: 'piscine' | 'mer' | 'lac' | 'carriere' | 'fosse'
          address?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          country?: string
          max_depth?: number | null
          visibility_avg?: number | null
          description?: string | null
          safety_rules?: string | null
          access_instructions?: string | null
          facilities?: string | null
          emergency_contacts?: string | null
          min_brevet?:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          photos?: string[] | null
          created_by?: string | null
        }
        Update: {
          name?: string
          site_type?: 'piscine' | 'mer' | 'lac' | 'carriere' | 'fosse'
          address?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          country?: string
          max_depth?: number | null
          visibility_avg?: number | null
          description?: string | null
          safety_rules?: string | null
          access_instructions?: string | null
          facilities?: string | null
          emergency_contacts?: string | null
          min_brevet?:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          photos?: string[] | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          event_type:
            | 'entrainement_piscine'
            | 'sortie_mer'
            | 'sortie_lac'
            | 'sortie_carriere'
            | 'formation'
            | 'reunion'
            | 'competition'
            | 'autre'
          date_start: string
          date_end: string | null
          registration_deadline: string | null
          organizer_id: string | null
          location_id: string | null
          max_participants: number | null
          min_brevet:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          description: string | null
          meeting_point: string | null
          carpooling_info: string | null
          equipment_needed: string | null
          created_by: string | null
          is_cancelled: boolean
          cancel_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          event_type:
            | 'entrainement_piscine'
            | 'sortie_mer'
            | 'sortie_lac'
            | 'sortie_carriere'
            | 'formation'
            | 'reunion'
            | 'competition'
            | 'autre'
          date_start: string
          date_end?: string | null
          registration_deadline?: string | null
          organizer_id?: string | null
          location_id?: string | null
          max_participants?: number | null
          min_brevet?:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          description?: string | null
          meeting_point?: string | null
          carpooling_info?: string | null
          equipment_needed?: string | null
          created_by?: string | null
          is_cancelled?: boolean
          cancel_reason?: string | null
        }
        Update: {
          title?: string
          event_type?:
            | 'entrainement_piscine'
            | 'sortie_mer'
            | 'sortie_lac'
            | 'sortie_carriere'
            | 'formation'
            | 'reunion'
            | 'competition'
            | 'autre'
          date_start?: string
          registration_deadline?: string | null
          organizer_id?: string | null
          date_end?: string | null
          location_id?: string | null
          max_participants?: number | null
          min_brevet?:
            | 'non_brevet'
            | '1_etoile'
            | '2_etoiles'
            | '3_etoiles'
            | '4_etoiles'
            | 'moniteur_club'
            | 'moniteur_federal'
            | 'instructeur'
            | null
          description?: string | null
          meeting_point?: string | null
          carpooling_info?: string | null
          equipment_needed?: string | null
          is_cancelled?: boolean
          cancel_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'events_location_id_fkey'
            columns: ['location_id']
            referencedRelation: 'dive_sites'
            referencedColumns: ['id']
          },
        ]
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          member_id: string
          registered_at: string
          status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'refused'
        }
        Insert: {
          id?: string
          event_id: string
          member_id: string
          registered_at?: string
          status?: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'refused'
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'refused'
        }
        Relationships: [
          {
            foreignKeyName: 'event_registrations_event_id_fkey'
            columns: ['event_id']
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'registration_pending' | 'registration_confirmed' | 'registration_refused' | 'exercise_validated' | 'exercise_refused' | 'new_message'
          title: string
          body: string
          data: Record<string, unknown>
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'registration_pending' | 'registration_confirmed' | 'registration_refused' | 'exercise_validated' | 'exercise_refused' | 'new_message'
          title: string
          body: string
          data?: Record<string, unknown>
          read_at?: string | null
        }
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
      event_exercises: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          min_brevet: string | null
          order_index: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          min_brevet?: string | null
          order_index?: number
          created_by?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          min_brevet?: string | null
          order_index?: number
        }
        Relationships: []
      }
      member_exercise_progress: {
        Row: {
          id: string
          exercise_id: string
          member_id: string
          status: 'pending' | 'in_progress' | 'done' | 'validated' | 'refused'
          notes: string | null
          validated_by: string | null
          validated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exercise_id: string
          member_id: string
          status?: 'pending' | 'in_progress' | 'done' | 'validated' | 'refused'
          notes?: string | null
          validated_by?: string | null
          validated_at?: string | null
        }
        Update: {
          status?: 'pending' | 'in_progress' | 'done' | 'validated' | 'refused'
          notes?: string | null
          validated_by?: string | null
          validated_at?: string | null
        }
        Relationships: []
      }
      event_messages: {
        Row: {
          id: string
          event_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          sender_id: string
          content: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      objectifs_progression: {
        Row: {
          id: string
          user_id: string
          niveau: string
          exercice_id: string
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          niveau: string
          exercice_id: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription: Record<string, unknown>
          created_at?: string
        }
        Update: {
          subscription?: Record<string, unknown>
        }
        Relationships: []
      }
      gdpr_consent: {
        Row: {
          id: string
          user_id: string
          accepted_at: string
          version: string
        }
        Insert: {
          id?: string
          user_id: string
          accepted_at?: string
          version?: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      ca_members: {
        Row: {
          id: string
          full_name: string
          role: string
          email: string | null
          phone: string | null
          order_index: number
        }
        Insert: {
          id?: string
          full_name: string
          role: string
          email?: string | null
          phone?: string | null
          order_index?: number
        }
        Update: {
          full_name?: string
          role?: string
          email?: string | null
          phone?: string | null
          order_index?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_confirmed_participants: {
        Args: { p_event_id: string; p_exclude_user: string }
        Returns: { member_id: string }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Raccourcis pratiques (alias des types Row)
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
