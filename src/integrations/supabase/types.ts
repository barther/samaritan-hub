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
          govt_aid_disability: boolean | null
          govt_aid_other: string | null
          govt_aid_ss: boolean | null
          govt_aid_unemployment: boolean | null
          govt_aid_workers_comp: boolean | null
          help_requested: string | null
          id: string
          interaction_id: string | null
          lease_in_name: boolean | null
          marital_status: string | null
          other_assistance_sources: string | null
          rent_paid_3mo: boolean | null
          spouse_email: string | null
          spouse_name: string | null
          spouse_phone: string | null
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
          govt_aid_disability?: boolean | null
          govt_aid_other?: string | null
          govt_aid_ss?: boolean | null
          govt_aid_unemployment?: boolean | null
          govt_aid_workers_comp?: boolean | null
          help_requested?: string | null
          id?: string
          interaction_id?: string | null
          lease_in_name?: boolean | null
          marital_status?: string | null
          other_assistance_sources?: string | null
          rent_paid_3mo?: boolean | null
          spouse_email?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
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
          govt_aid_disability?: boolean | null
          govt_aid_other?: string | null
          govt_aid_ss?: boolean | null
          govt_aid_unemployment?: boolean | null
          govt_aid_workers_comp?: boolean | null
          help_requested?: string | null
          id?: string
          interaction_id?: string | null
          lease_in_name?: boolean | null
          marital_status?: string | null
          other_assistance_sources?: string | null
          rent_paid_3mo?: boolean | null
          spouse_email?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
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
      clients: {
        Row: {
          address: string | null
          city: string | null
          county: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      disbursements: {
        Row: {
          amount: number
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
          id: string
          occurred_at: string
          requested_amount: number | null
          status: Database["public"]["Enums"]["interaction_status"]
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
          id?: string
          occurred_at?: string
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["interaction_status"]
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
          id?: string
          occurred_at?: string
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["interaction_status"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_edge_function_usage: {
        Args: { p_action: string; p_details?: Json; p_resource?: string }
        Returns: undefined
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
