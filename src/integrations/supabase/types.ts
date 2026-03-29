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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      capio_st_görans_sjukhus_bins: {
        Row: {
          binid: string
          department: string
          name: string | null
        }
        Insert: {
          binid: string
          department: string
          name?: string | null
        }
        Update: {
          binid?: string
          department?: string
          name?: string | null
        }
        Relationships: []
      }
      capio_st_görans_sjukhus_departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      capio_st_görans_sjukhus_waste: {
        Row: {
          binid: string | null
          drugid: string | null
          expiry_date: string | null
          time: string | null
          volume: number | null
          wasteid: string
        }
        Insert: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid: string
        }
        Update: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid?: string
        }
        Relationships: [
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "capio_st_görans_sjukhus_bins"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "capio_st_görans_sjukhus_bins_view"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["drugid"]
          },
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs_view"
            referencedColumns: ["drugid"]
          },
        ]
      }
      drugs: {
        Row: {
          cost: number | null
          drugid: string
          name: string | null
          strength: number | null
          volume: number | null
        }
        Insert: {
          cost?: number | null
          drugid: string
          name?: string | null
          strength?: number | null
          volume?: number | null
        }
        Update: {
          cost?: number | null
          drugid?: string
          name?: string | null
          strength?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      karolinska_university_hospital_bins: {
        Row: {
          binid: string
          department: string | null
          name: string | null
        }
        Insert: {
          binid: string
          department?: string | null
          name?: string | null
        }
        Update: {
          binid?: string
          department?: string | null
          name?: string | null
        }
        Relationships: []
      }
      karolinska_university_hospital_departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      karolinska_university_hospital_waste: {
        Row: {
          binid: string | null
          drugid: string | null
          expiry_date: string | null
          time: string | null
          volume: number | null
          wasteid: string
        }
        Insert: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid: string
        }
        Update: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid?: string
        }
        Relationships: [
          {
            foreignKeyName: "karolinska_university_hospital_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "karolinska_university_hospital_bins"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "karolinska_university_hospital_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "karolinska_university_hospital_bins_view"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "karolinska_university_hospital_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["drugid"]
          },
          {
            foreignKeyName: "karolinska_university_hospital_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs_view"
            referencedColumns: ["drugid"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          hospital: string
          hospital_name: string
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          hospital?: string
          hospital_name?: string
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          hospital?: string
          hospital_name?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waste_event_annotations: {
        Row: {
          created_at: string
          flag: string | null
          hospital_id: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
          wasteid: string
        }
        Insert: {
          created_at?: string
          flag?: string | null
          hospital_id: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          wasteid: string
        }
        Update: {
          created_at?: string
          flag?: string | null
          hospital_id?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          wasteid?: string
        }
        Relationships: []
      }
    }
    Views: {
      capio_st_görans_sjukhus_bins_view: {
        Row: {
          binid: string | null
          department: string | null
          name: string | null
        }
        Insert: {
          binid?: string | null
          department?: string | null
          name?: string | null
        }
        Update: {
          binid?: string | null
          department?: string | null
          name?: string | null
        }
        Relationships: []
      }
      capio_st_görans_sjukhus_waste_view: {
        Row: {
          binid: string | null
          drugid: string | null
          expiry_date: string | null
          time: string | null
          volume: number | null
          wasteid: string | null
        }
        Insert: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid?: string | null
        }
        Update: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "capio_st_görans_sjukhus_bins"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "capio_st_görans_sjukhus_bins_view"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["drugid"]
          },
          {
            foreignKeyName: "capio_st_görans_sjukhus_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs_view"
            referencedColumns: ["drugid"]
          },
        ]
      }
      drugs_view: {
        Row: {
          cost: number | null
          drugid: string | null
          name: string | null
          strength: number | null
          volume: number | null
        }
        Insert: {
          cost?: number | null
          drugid?: string | null
          name?: string | null
          strength?: number | null
          volume?: number | null
        }
        Update: {
          cost?: number | null
          drugid?: string | null
          name?: string | null
          strength?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      karolinska_university_hospital_bins_view: {
        Row: {
          binid: string | null
          department: string | null
          name: string | null
        }
        Insert: {
          binid?: string | null
          department?: string | null
          name?: string | null
        }
        Update: {
          binid?: string | null
          department?: string | null
          name?: string | null
        }
        Relationships: []
      }
      karolinska_university_hospital_waste_view: {
        Row: {
          binid: string | null
          drugid: string | null
          expiry_date: string | null
          time: string | null
          volume: number | null
          wasteid: string | null
        }
        Insert: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid?: string | null
        }
        Update: {
          binid?: string | null
          drugid?: string | null
          expiry_date?: string | null
          time?: string | null
          volume?: number | null
          wasteid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karolinska_university_hospital_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "karolinska_university_hospital_bins"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "karolinska_university_hospital_waste_binid_fkey"
            columns: ["binid"]
            isOneToOne: false
            referencedRelation: "karolinska_university_hospital_bins_view"
            referencedColumns: ["binid"]
          },
          {
            foreignKeyName: "karolinska_university_hospital_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["drugid"]
          },
          {
            foreignKeyName: "karolinska_university_hospital_waste_drugid_fkey"
            columns: ["drugid"]
            isOneToOne: false
            referencedRelation: "drugs_view"
            referencedColumns: ["drugid"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
