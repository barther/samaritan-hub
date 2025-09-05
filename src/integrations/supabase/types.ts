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
      clients: {
        Row: {
          address: string | null
          city: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
