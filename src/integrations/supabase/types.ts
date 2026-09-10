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
      exam_assignments: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          assigned_at: string
          status: "assigned" | "completed"
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          assigned_at?: string
          status?: "assigned" | "completed"
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          assigned_at?: string
          status?: "assigned" | "completed"
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          started_at: string
          submitted_at: string | null
          status: "in_progress" | "submitted" | "auto_submitted"
          score: number
          correct_answers: number
          total_questions: number
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          started_at?: string
          submitted_at?: string | null
          status?: "in_progress" | "submitted" | "auto_submitted"
          score?: number
          correct_answers?: number
          total_questions?: number
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          started_at?: string
          submitted_at?: string | null
          status?: "in_progress" | "submitted" | "auto_submitted"
          score?: number
          correct_answers?: number
          total_questions?: number
        }
        Relationships: []
      }
      exam_attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string | null
          answered_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id?: string | null
          answered_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_id?: string | null
          answered_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          course: string
          duration_minutes: number
          total_marks: number
          passing_marks: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          course: string
          duration_minutes: number
          total_marks: number
          passing_marks: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          course?: string
          duration_minutes?: number
          total_marks?: number
          passing_marks?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          question_text: string
          marks: number
          question_order: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_text: string
          marks?: number
          question_order: number
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_text?: string
          marks?: number
          question_order?: number
          created_at?: string
        }
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          option_order: number
          is_correct: boolean
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          option_order: number
          is_correct?: boolean
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string
          option_order?: number
          is_correct?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          student_id: string | null
          full_name: string
          role: "student" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          student_id?: string | null
          full_name: string
          role: "student" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          full_name?: string
          role?: "student" | "admin"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          batch: string | null
          course: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string | null
          mobile: string
          whatsapp_error: string | null
          whatsapp_status: string
        }
        Insert: {
          batch?: string | null
          course: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          mobile: string
          whatsapp_error?: string | null
          whatsapp_status?: string
        }
        Update: {
          batch?: string | null
          course?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          mobile?: string
          whatsapp_error?: string | null
          whatsapp_status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          student_name: string
          course_name: string
          rating: number
          review_message: string
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_name: string
          course_name: string
          rating: number
          review_message: string
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_name?: string
          course_name?: string
          rating?: number
          review_message?: string
          photo_url?: string | null
          created_at?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
