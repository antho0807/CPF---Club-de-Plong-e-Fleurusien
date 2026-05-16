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
          role: 'admin' | 'moniteur' | 'membre'
          is_active: boolean
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
          role?: 'admin' | 'moniteur' | 'membre'
          is_active?: boolean
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
          role?: 'admin' | 'moniteur' | 'membre'
          is_active?: boolean
          notes?: string | null
        }
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
