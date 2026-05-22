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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      feedbacks: {
        Row: {
          created_at: string
          free_text: string | null
          id: string
          location: string | null
          photo_url: string | null
          problem_tags: string[]
          rating_atmosphere: number | null
          rating_cleanliness: number | null
          rating_drinks: number | null
          rating_service: number | null
          status: string
        }
        Insert: {
          created_at?: string
          free_text?: string | null
          id?: string
          location?: string | null
          photo_url?: string | null
          problem_tags?: string[]
          rating_atmosphere?: number | null
          rating_cleanliness?: number | null
          rating_drinks?: number | null
          rating_service?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          free_text?: string | null
          id?: string
          location?: string | null
          photo_url?: string | null
          problem_tags?: string[]
          rating_atmosphere?: number | null
          rating_cleanliness?: number | null
          rating_drinks?: number | null
          rating_service?: number | null
          status?: string
        }
        Relationships: []
      }
      promo_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          unit_snapshot: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          unit_snapshot?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          unit_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "promo_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "promo_products"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_orders: {
        Row: {
          created_at: string
          delivered_at: string | null
          handled_by: string | null
          id: string
          internal_note: string | null
          note: string | null
          ordered_by_name: string | null
          ordered_by_role: string | null
          pub_id: string
          requested_for: string | null
          shipped_at: string | null
          status: string
          tracking_carrier: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string | null
          note?: string | null
          ordered_by_name?: string | null
          ordered_by_role?: string | null
          pub_id: string
          requested_for?: string | null
          shipped_at?: string | null
          status?: string
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string | null
          note?: string | null
          ordered_by_name?: string | null
          ordered_by_role?: string | null
          pub_id?: string
          requested_for?: string | null
          shipped_at?: string | null
          status?: string
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          min_order_qty: number
          name_de: string
          name_en: string
          pack_size: number
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          min_order_qty?: number
          name_de: string
          name_en: string
          pack_size?: number
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          min_order_qty?: number
          name_de?: string
          name_en?: string
          pack_size?: number
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      pub_settings: {
        Row: {
          active_users_target: number
          closing_hour: number
          created_at: string
          month: string
          occupancy_targets: Json
          opening_hour: number
          pub_id: string
          rent_monthly: number
          revenue_target_monthly: number
          seats: number
          staff_costs_monthly: number
          updated_at: string
        }
        Insert: {
          active_users_target?: number
          closing_hour?: number
          created_at?: string
          month?: string
          occupancy_targets?: Json
          opening_hour?: number
          pub_id: string
          rent_monthly?: number
          revenue_target_monthly?: number
          seats?: number
          staff_costs_monthly?: number
          updated_at?: string
        }
        Update: {
          active_users_target?: number
          closing_hour?: number
          created_at?: string
          month?: string
          occupancy_targets?: Json
          opening_hour?: number
          pub_id?: string
          rent_monthly?: number
          revenue_target_monthly?: number
          seats?: number
          staff_costs_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
