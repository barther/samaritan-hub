export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assistance_requests: {
        Row: {
          approved_amount: number | null
          children_names_ages: string | null
          circumstances: string | null
          client_id: string | null
          consent_given: boolean | null
          created_at: string
          created_by: string | null
          employer_self: string | null
          employer_self_contact: string | null
          employer_self_phone: string | null
          employer_spouse: string | null
          employer_spouse_contact: string | null
          employer_spouse_phone: string | null
          employment_status: string | null
          govt_aid_disability: boolean | null
          govt_aid_other: string | null
          govt_aid_ss: boolean | null
          govt_aid_unemployment: boolean | null
          govt_aid_workers_comp: boolean | null
          help_requested: string | null
          household_size: number | null
          housing_status: string | null
          id: string
          income_range: string | null
          interaction_id: string | null
          lease_in_name: boolean | null
          marital_status: string | null
          other_assistance_sources: string | null
          outcome_category: string | null
          previous_assistance_count: number | null
          referral_source: string | null
          rent_paid_3mo: boolean | null
          requested_amount: number | null
          spouse_email: string | null
          spouse_name: string | null
          spouse_phone: string | null
          success_achieved: boolean | null
          transportation_access: boolean | null
          triage_completed_at: string | null
          triaged_by_user_id: string | null
          unemployed_self: boolean | null
          unemployed_spouse: boolean | null
          updated_at: string
          utility_in_name: boolean | null
          veteran_self: boolean | null
          veteran_spouse: boolean | null
        }
        Insert: {
          approved_amount?: number | null
          children_names_ages?: string | null
          circumstances?: string | null
          client_id?: string | null
          consent_given?: boolean | null
          created_at?: string
          created_by?: string | null
          employer_self?: string | null
          employer_self_contact?: string | null
          employer_self_phone?: string | null
          employer_spouse?: string | null
          employer_spouse_contact?: string | null
          employer_spouse_phone?: string | null
          employment_status?: string | null
          govt_aid_disability?: boolean | null
          govt_aid_other?: string | null
          govt_aid_ss?: boolean | null
          govt_aid_unemployment?: boolean | null
          govt_aid_workers_comp?: boolean | null
          help_requested?: string | null
          household_size?: number | null
          housing_status?: string | null
          id?: string
          income_range?: string | null
          interaction_id?: string | null
          lease_in_name?: boolean | null
          marital_status?: string | null
          other_assistance_sources?: string | null
          outcome_category?: string | null
          previous_assistance_count?: number | null
          referral_source?: string | null
          rent_paid_3mo?: boolean | null
          requested_amount?: number | null
          spouse_email?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
          success_achieved?: boolean | null
          transportation_access?: boolean | null
          triage_completed_at?: string | null
          triaged_by_user_id?: string | null
          unemployed_self?: boolean | null
          unemployed_spouse?: boolean | null
          updated_at?: string
          utility_in_name?: boolean | null
          veteran_self?: boolean | null
          veteran_spouse?: boolean | null
        }
        Update: {
          approved_amount?: number | null
          children_names_ages?: string | null
          circumstances?: string | null
          client_id?: string | null
          consent_given?: boolean | null
          created_at?: string
          created_by?: string | null
          employer_self?: string | null
          employer_self_contact?: string | null
          employer_self_phone?: string | null
          employer_spouse?: string | null
          employer_spouse_contact?: string | null
          employer_spouse_phone?: string | null
          employment_status?: string | null
          govt_aid_disability?: boolean | null
          govt_aid_other?: string | null
          govt_aid_ss?: boolean | null
          govt_aid_unemployment?: boolean | null
          govt_aid_workers_comp?: boolean | null
          help_requested?: string | null
          household_size?: number | null
          housing_status?: string | null
          id?: string
          income_range?: string | null
          interaction_id?: string | null
          lease_in_name?: boolean | null
          marital_status?: string | null
          other_assistance_sources?: string | null
          outcome_category?: string | null
          previous_assistance_count?: number | null
          referral_source?: string | null
          rent_paid_3mo?: boolean | null
          requested_amount?: number | null
          spouse_email?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
          success_achieved?: boolean | null
          transportation_access?: boolean | null
          triage_completed_at?: string | null
          triaged_by_user_id?: string | null
          unemployed_self?: boolean | null
          unemployed_spouse?: boolean | null
          updated_at?: string
          utility_in_name?: boolean | null
          veteran_self?: boolean | null
          veteran_spouse?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assistance_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_requests_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_alerts: {
        Row: {
          alert_type: string
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_merges: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          merged_by: string | null
          merged_from_client_ids: string[]
          merged_into_client_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          merged_by?: string | null
          merged_from_client_ids?: string[]
          merged_into_client_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          merged_by?: string | null
          merged_from_client_ids?: string[]
          merged_into_client_id?: string
        }
        Relationships: []
      }
      client_relationships: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          related_client_id: string
          relationship_notes: string | null
          relationship_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          related_client_id: string
          relationship_notes?: string | null
          relationship_type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          related_client_id?: string
          relationship_notes?: string | null
          relationship_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          assistance_count: number | null
          city: string | null
          county: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          flagged_for_review: boolean | null
          id: string
          last_assistance_date: string | null
          last_name: string
          notes: string | null
          phone: string | null
          preferred_name: string | null
          review_reason: string | null
          risk_level: string | null
          state: string | null
          total_assistance_received: number | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assistance_count?: number | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          flagged_for_review?: boolean | null
          id?: string
          last_assistance_date?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          review_reason?: string | null
          risk_level?: string | null
          state?: string | null
          total_assistance_received?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assistance_count?: number | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          flagged_for_review?: boolean | null
          id?: string
          last_assistance_date?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          review_reason?: string | null
          risk_level?: string | null
          state?: string | null
          total_assistance_received?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      disbursements: {
        Row: {
          amount: number
          assistance_request_id: string | null
          assistance_type: Database["public"]["Enums"]["assistance_type"]
          check_number: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          disbursement_date: string
          id: string
          interaction_id: string | null
          notes: string | null
          payment_method: string | null
          recipient_name: string
        }
        Insert: {
          amount: number
          assistance_request_id?: string | null
          assistance_type: Database["public"]["Enums"]["assistance_type"]
          check_number?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          disbursement_date?: string
          id?: string
          interaction_id?: string | null
          notes?: string | null
          payment_method?: string | null
          recipient_name: string
        }
        Update: {
          amount?: number
          assistance_request_id?: string | null
          assistance_type?: Database["public"]["Enums"]["assistance_type"]
          check_number?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          disbursement_date?: string
          id?: string
          interaction_id?: string | null
          notes?: string | null
          payment_method?: string | null
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "disbursements_assistance_request_id_fkey"
            columns: ["assistance_request_id"]
            isOneToOne: false
            referencedRelation: "assistance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursements_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          donation_date: string
          donor_email: string | null
          donor_name: string | null
          id: string
          notes: string | null
          source: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          donation_date?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          notes?: string | null
          source: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          donation_date?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          notes?: string | null
          source?: string
        }
        Relationships: []
      }
      grant_reports: {
        Row: {
          avg_assistance_per_client: number | null
          created_at: string
          created_by: string | null
          demographics: Json | null
          id: string
          narrative_summary: string | null
          outcomes: Json | null
          repeat_client_percentage: number | null
          report_period_end: string
          report_period_start: string
          total_assistance_amount: number
          total_clients_served: number
          unique_families_helped: number
        }
        Insert: {
          avg_assistance_per_client?: number | null
          created_at?: string
          created_by?: string | null
          demographics?: Json | null
          id?: string
          narrative_summary?: string | null
          outcomes?: Json | null
          repeat_client_percentage?: number | null
          report_period_end: string
          report_period_start: string
          total_assistance_amount?: number
          total_clients_served?: number
          unique_families_helped?: number
        }
        Update: {
          avg_assistance_per_client?: number | null
          created_at?: string
          created_by?: string | null
          demographics?: Json | null
          id?: string
          narrative_summary?: string | null
          outcomes?: Json | null
          repeat_client_percentage?: number | null
          report_period_end?: string
          report_period_start?: string
          total_assistance_amount?: number
          total_clients_served?: number
          unique_families_helped?: number
        }
        Relationships: []
      }
      interactions: {
        Row: {
          approved_amount: number | null
          assigned_to: string | null
          assistance_type: Database["public"]["Enums"]["assistance_type"] | null
          channel: Database["public"]["Enums"]["interaction_channel"]
          client_id: string | null
          contact_name: string
          created_at: string
          created_by: string | null
          details: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          impact_notes: string | null
          occurred_at: string
          outcome: string | null
          requested_amount: number | null
          status: Database["public"]["Enums"]["interaction_status"]
          success_rating: number | null
          summary: string
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          assigned_to?: string | null
          assistance_type?:
            | Database["public"]["Enums"]["assistance_type"]
            | null
          channel: Database["public"]["Enums"]["interaction_channel"]
          client_id?: string | null
          contact_name: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          impact_notes?: string | null
          occurred_at?: string
          outcome?: string | null
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["interaction_status"]
          success_rating?: number | null
          summary: string
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          assigned_to?: string | null
          assistance_type?:
            | Database["public"]["Enums"]["assistance_type"]
            | null
          channel?: Database["public"]["Enums"]["interaction_channel"]
          client_id?: string | null
          contact_name?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          impact_notes?: string | null
          occurred_at?: string
          outcome?: string | null
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["interaction_status"]
          success_rating?: number | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_public_stats: {
        Row: {
          families_all_time: number
          families_count: number
          id: string
          month: number
          month_label: string
          people_all_time: number
          people_count: number
          updated_at: string
          year: number
        }
        Insert: {
          families_all_time?: number
          families_count?: number
          id?: string
          month: number
          month_label: string
          people_all_time?: number
          people_count?: number
          updated_at?: string
          year: number
        }
        Update: {
          families_all_time?: number
          families_count?: number
          id?: string
          month?: number
          month_label?: string
          people_all_time?: number
          people_count?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_intake: {
        Row: {
          address: string
          assistance_request_id: string | null
          city: string
          client_id: string | null
          county: string | null
          created_at: string
          email: string
          first_name: string
          help_needed: string
          id: string
          interaction_id: string | null
          ip_address: string | null
          last_name: string
          notes: string | null
          phone: string
          processed_at: string | null
          processed_by: string | null
          source: string
          state: string
          status: string
          user_agent: string | null
          viewed_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          assistance_request_id?: string | null
          city: string
          client_id?: string | null
          county?: string | null
          created_at?: string
          email: string
          first_name: string
          help_needed: string
          id?: string
          interaction_id?: string | null
          ip_address?: string | null
          last_name: string
          notes?: string | null
          phone: string
          processed_at?: string | null
          processed_by?: string | null
          source?: string
          state?: string
          status?: string
          user_agent?: string | null
          viewed_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          assistance_request_id?: string | null
          city?: string
          client_id?: string | null
          county?: string | null
          created_at?: string
          email?: string
          first_name?: string
          help_needed?: string
          id?: string
          interaction_id?: string | null
          ip_address?: string | null
          last_name?: string
          notes?: string | null
          phone?: string
          processed_at?: string | null
          processed_by?: string | null
          source?: string
          state?: string
          status?: string
          user_agent?: string | null
          viewed_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      staging_clients: {
        Row: {
          address: string | null
          city: string | null
          county: string | null
          created_at: string
          created_by: string | null
          email: string | null
          error: string | null
          first_name: string | null
          id: string
          last_name: string | null
          matched_client_id: string | null
          notes: string | null
          phone: string | null
          row_no: number | null
          source: string
          state: string | null
          status: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          error?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_client_id?: string | null
          notes?: string | null
          phone?: string | null
          row_no?: number | null
          source: string
          state?: string | null
          status?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          error?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_client_id?: string | null
          notes?: string | null
          phone?: string | null
          row_no?: number | null
          source?: string
          state?: string | null
          status?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      staging_disbursements: {
        Row: {
          amount: number | null
          assistance_type: string | null
          check_number: string | null
          client_email: string | null
          client_first_name: string | null
          client_last_name: string | null
          client_phone: string | null
          created_at: string
          created_by: string | null
          disbursement_date: string | null
          error: string | null
          id: string
          matched_client_id: string | null
          notes: string | null
          payment_method: string | null
          recipient_name: string | null
          row_no: number | null
          source: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          assistance_type?: string | null
          check_number?: string | null
          client_email?: string | null
          client_first_name?: string | null
          client_last_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          disbursement_date?: string | null
          error?: string | null
          id?: string
          matched_client_id?: string | null
          notes?: string | null
          payment_method?: string | null
          recipient_name?: string | null
          row_no?: number | null
          source: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          assistance_type?: string | null
          check_number?: string | null
          client_email?: string | null
          client_first_name?: string | null
          client_last_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          disbursement_date?: string | null
          error?: string | null
          id?: string
          matched_client_id?: string | null
          notes?: string | null
          payment_method?: string | null
          recipient_name?: string | null
          row_no?: number | null
          source?: string
          status?: string | null
        }
        Relationships: []
      }
      staging_donations: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          donation_date: string | null
          donor_email: string | null
          donor_name: string | null
          error: string | null
          id: string
          notes: string | null
          row_no: number | null
          source: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          donation_date?: string | null
          donor_email?: string | null
          donor_name?: string | null
          error?: string | null
          id?: string
          notes?: string | null
          row_no?: number | null
          source: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          donation_date?: string | null
          donor_email?: string | null
          donor_name?: string | null
          error?: string | null
          id?: string
          notes?: string | null
          row_no?: number | null
          source?: string
          status?: string | null
        }
        Relationships: []
      }
      staging_interactions: {
        Row: {
          approved_amount: number | null
          assistance_type: string | null
          channel: string | null
          client_email: string | null
          client_first_name: string | null
          client_last_name: string | null
          client_phone: string | null
          created_at: string
          created_by: string | null
          details: string | null
          error: string | null
          id: string
          matched_client_id: string | null
          occurred_at: string | null
          requested_amount: number | null
          row_no: number | null
          source: string
          status: string | null
          summary: string | null
        }
        Insert: {
          approved_amount?: number | null
          assistance_type?: string | null
          channel?: string | null
          client_email?: string | null
          client_first_name?: string | null
          client_last_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          error?: string | null
          id?: string
          matched_client_id?: string | null
          occurred_at?: string | null
          requested_amount?: number | null
          row_no?: number | null
          source: string
          status?: string | null
          summary?: string | null
        }
        Update: {
          approved_amount?: number | null
          assistance_type?: string | null
          channel?: string | null
          client_email?: string | null
          client_first_name?: string | null
          client_last_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          error?: string | null
          id?: string
          matched_client_id?: string | null
          occurred_at?: string | null
          requested_amount?: number | null
          row_no?: number | null
          source?: string
          status?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          donor_email: string | null
          donor_name: string | null
          fees_cents: number
          fees_covered: boolean
          id: string
          ip_address: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_cents: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          fees_cents?: number
          fees_covered?: boolean
          id?: string
          ip_address?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_cents?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          fees_cents?: number
          fees_covered?: boolean
          id?: string
          ip_address?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_cents?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      compute_and_upsert_public_stats: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
      }
      get_client_access_logs: {
        Args: { p_client_id?: string; p_days?: number }
        Returns: {
          access_time: string
          access_type: string
          client_id: string
          ip_address: string
          user_agent: string
          user_email: string
        }[]
      }
      get_client_secure: {
        Args: { p_client_id: string }
        Returns: {
          address: string
          assistance_count: number
          city: string
          county: string
          created_at: string
          email: string
          first_name: string
          flagged_for_review: boolean
          id: string
          last_assistance_date: string
          last_name: string
          notes: string
          phone: string
          preferred_name: string
          review_reason: string
          risk_level: string
          state: string
          total_assistance_received: number
          updated_at: string
          zip_code: string
        }[]
      }
      get_client_summary: {
        Args: { p_client_id: string }
        Returns: {
          assistance_count: number
          city: string
          email: string
          first_name: string
          flagged_for_review: boolean
          id: string
          last_assistance_date: string
          last_name: string
          phone: string
          preferred_name: string
          risk_level: string
        }[]
      }
      get_related_clients: {
        Args: { p_client_id: string }
        Returns: {
          client_id: string
          email: string
          first_name: string
          last_interaction_date: string
          last_interaction_summary: string
          last_name: string
          phone: string
          relationship_notes: string
          relationship_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_client_access: {
        Args: { p_access_type?: string; p_client_id: string }
        Returns: undefined
      }
      log_edge_function_usage: {
        Args: { p_action: string; p_details?: Json; p_resource?: string }
        Returns: undefined
      }
      merge_clients: {
        Args: {
          p_duplicate_ids: string[]
          p_merged_data: Json
          p_primary: string
        }
        Returns: string
      }
      org_user: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      verify_user_role: {
        Args: { required_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "viewer"
      assistance_type:
        | "rent"
        | "utilities"
        | "food"
        | "medical"
        | "transportation"
        | "other"
      interaction_channel:
        | "public_form"
        | "phone"
        | "email"
        | "in_person"
        | "text"
      interaction_status: "new" | "in_progress" | "completed" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "viewer"],
      assistance_type: [
        "rent",
        "utilities",
        "food",
        "medical",
        "transportation",
        "other",
      ],
      interaction_channel: [
        "public_form",
        "phone",
        "email",
        "in_person",
        "text",
      ],
      interaction_status: ["new", "in_progress", "completed", "closed"],
    },
  },
} as const
