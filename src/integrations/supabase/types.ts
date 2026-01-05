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
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement?: Json | null
          type?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      curriculum_levels: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_free: boolean | null
          level_number: number
          name: string
          updated_at: string | null
          week_end: number | null
          week_start: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_free?: boolean | null
          level_number: number
          name: string
          updated_at?: string | null
          week_end?: number | null
          week_start?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_free?: boolean | null
          level_number?: number
          name?: string
          updated_at?: string | null
          week_end?: number | null
          week_start?: number | null
        }
        Relationships: []
      }
      curriculum_modules: {
        Row: {
          confusion_breakers: string | null
          created_at: string | null
          display_order: number | null
          estimated_hours: number | null
          exit_condition: string | null
          id: string
          level_id: string | null
          mental_model: string | null
          module_number: number
          name: string
          pattern_id: string | null
          pattern_template: string | null
          subtitle: string | null
          updated_at: string | null
          when_not_to_use: string | null
          why_exists: string | null
        }
        Insert: {
          confusion_breakers?: string | null
          created_at?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          exit_condition?: string | null
          id?: string
          level_id?: string | null
          mental_model?: string | null
          module_number: number
          name: string
          pattern_id?: string | null
          pattern_template?: string | null
          subtitle?: string | null
          updated_at?: string | null
          when_not_to_use?: string | null
          why_exists?: string | null
        }
        Update: {
          confusion_breakers?: string | null
          created_at?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          exit_condition?: string | null
          id?: string
          level_id?: string | null
          mental_model?: string | null
          module_number?: number
          name?: string
          pattern_id?: string | null
          pattern_template?: string | null
          subtitle?: string | null
          updated_at?: string | null
          when_not_to_use?: string | null
          why_exists?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_modules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string | null
          question_id: string | null
          user_id: string
        }
        Insert: {
          challenge_date: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          question_id?: string | null
          user_id: string
        }
        Update: {
          challenge_date?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          question_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_challenges_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_votes: {
        Row: {
          created_at: string
          discussion_id: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          discussion_id: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          discussion_id?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_votes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_best_answer: boolean
          parent_id: string | null
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_best_answer?: boolean
          parent_id?: string | null
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_best_answer?: boolean
          parent_id?: string | null
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_text: string
          created_at: string
          cta_text: string
          cta_url: string
          footer_text: string | null
          heading: string
          id: string
          logo_url: string | null
          primary_color: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          body_text: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          footer_text?: string | null
          heading: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          subject: string
          type: string
          updated_at?: string
        }
        Update: {
          body_text?: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          footer_text?: string | null
          heading?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_results: {
        Row: {
          approach_explained: boolean | null
          attempt_count: number | null
          brute_approach_explained: boolean | null
          code_quality_score: number | null
          code_snapshots: Json | null
          communication_score: number | null
          created_at: string
          evaluation_result: Json | null
          first_keystroke_at: string | null
          flagged: boolean | null
          hints_used: number | null
          id: string
          interview_performance_score: number | null
          is_solved: boolean | null
          paste_detected: boolean | null
          question_id: string
          run_before_submit: boolean | null
          run_count: number | null
          selected_language: string | null
          session_id: string
          skipped: boolean | null
          submission_count: number | null
          submitted_at: string | null
          submitted_code: string | null
          time_spent: number | null
        }
        Insert: {
          approach_explained?: boolean | null
          attempt_count?: number | null
          brute_approach_explained?: boolean | null
          code_quality_score?: number | null
          code_snapshots?: Json | null
          communication_score?: number | null
          created_at?: string
          evaluation_result?: Json | null
          first_keystroke_at?: string | null
          flagged?: boolean | null
          hints_used?: number | null
          id?: string
          interview_performance_score?: number | null
          is_solved?: boolean | null
          paste_detected?: boolean | null
          question_id: string
          run_before_submit?: boolean | null
          run_count?: number | null
          selected_language?: string | null
          session_id: string
          skipped?: boolean | null
          submission_count?: number | null
          submitted_at?: string | null
          submitted_code?: string | null
          time_spent?: number | null
        }
        Update: {
          approach_explained?: boolean | null
          attempt_count?: number | null
          brute_approach_explained?: boolean | null
          code_quality_score?: number | null
          code_snapshots?: Json | null
          communication_score?: number | null
          created_at?: string
          evaluation_result?: Json | null
          first_keystroke_at?: string | null
          flagged?: boolean | null
          hints_used?: number | null
          id?: string
          interview_performance_score?: number | null
          is_solved?: boolean | null
          paste_detected?: boolean | null
          question_id?: string
          run_before_submit?: boolean | null
          run_count?: number | null
          selected_language?: string | null
          session_id?: string
          skipped?: boolean | null
          submission_count?: number | null
          submitted_at?: string | null
          submitted_code?: string | null
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          company_name: string | null
          completed_at: string | null
          created_at: string
          id: string
          mode: string | null
          pattern_id: string | null
          questions: Json
          session_type: string
          started_at: string
          status: string
          time_limit: number
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mode?: string | null
          pattern_id?: string | null
          questions?: Json
          session_type: string
          started_at?: string
          status?: string
          time_limit: number
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mode?: string | null
          pattern_id?: string | null
          questions?: Json
          session_type?: string
          started_at?: string
          status?: string
          time_limit?: number
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_free: boolean
          name: string
          phase: number
          slug: string
          topic_id: string | null
          total_questions: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_free?: boolean
          name: string
          phase?: number
          slug: string
          topic_id?: string | null
          total_questions?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_free?: boolean
          name?: string
          phase?: number
          slug?: string
          topic_id?: string | null
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patterns_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          plan_type: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          plan_type: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          plan_type?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_level: number
          current_streak: number
          curriculum_level: number | null
          github_url: string | null
          id: string
          instagram_url: string | null
          last_freeze_used_at: string | null
          last_solved_at: string | null
          leetcode_url: string | null
          linkedin_url: string | null
          longest_streak: number
          streak_freeze_available: number | null
          subscription_expires_at: string | null
          subscription_status: string
          total_xp: number
          twitter_url: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          curriculum_level?: number | null
          github_url?: string | null
          id: string
          instagram_url?: string | null
          last_freeze_used_at?: string | null
          last_solved_at?: string | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          streak_freeze_available?: number | null
          subscription_expires_at?: string | null
          subscription_status?: string
          total_xp?: number
          twitter_url?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          curriculum_level?: number | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          last_freeze_used_at?: string | null
          last_solved_at?: string | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          streak_freeze_available?: number | null
          subscription_expires_at?: string | null
          subscription_status?: string
          total_xp?: number
          twitter_url?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          approach: string | null
          article_link: string | null
          brute_force: string | null
          companies: string[] | null
          created_at: string
          description: string | null
          difficulty: string
          display_order: number
          hints: Json | null
          id: string
          interview_followups: string[] | null
          is_trap_problem: boolean | null
          leetcode_link: string | null
          optimal_solution: string | null
          pattern_id: string
          practice_tier: string | null
          signal: string | null
          sub_pattern_id: string | null
          title: string
          updated_at: string
          what_fails_if_wrong: string | null
          why_this_approach: string | null
          xp_reward: number
          youtube_link: string | null
        }
        Insert: {
          approach?: string | null
          article_link?: string | null
          brute_force?: string | null
          companies?: string[] | null
          created_at?: string
          description?: string | null
          difficulty: string
          display_order?: number
          hints?: Json | null
          id?: string
          interview_followups?: string[] | null
          is_trap_problem?: boolean | null
          leetcode_link?: string | null
          optimal_solution?: string | null
          pattern_id: string
          practice_tier?: string | null
          signal?: string | null
          sub_pattern_id?: string | null
          title: string
          updated_at?: string
          what_fails_if_wrong?: string | null
          why_this_approach?: string | null
          xp_reward?: number
          youtube_link?: string | null
        }
        Update: {
          approach?: string | null
          article_link?: string | null
          brute_force?: string | null
          companies?: string[] | null
          created_at?: string
          description?: string | null
          difficulty?: string
          display_order?: number
          hints?: Json | null
          id?: string
          interview_followups?: string[] | null
          is_trap_problem?: boolean | null
          leetcode_link?: string | null
          optimal_solution?: string | null
          pattern_id?: string
          practice_tier?: string | null
          signal?: string | null
          sub_pattern_id?: string | null
          title?: string
          updated_at?: string
          what_fails_if_wrong?: string | null
          why_this_approach?: string | null
          xp_reward?: number
          youtube_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_sub_pattern_id_fkey"
            columns: ["sub_pattern_id"]
            isOneToOne: false
            referencedRelation: "sub_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          module_id: string | null
          name: string
          template: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          module_id?: string | null
          name: string
          template?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          module_id?: string | null
          name?: string
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_patterns_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          company_logo_url: string | null
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          linkedin_url: string | null
          name: string
          review: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          company_logo_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          linkedin_url?: string | null
          name: string
          review: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          company_logo_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          linkedin_url?: string | null
          name?: string
          review?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_curriculum_progress: {
        Row: {
          checkpoint_passed: boolean | null
          checkpoint_passed_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          checkpoint_passed?: boolean | null
          checkpoint_passed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          checkpoint_passed?: boolean | null
          checkpoint_passed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          approach_viewed: boolean
          brute_force_viewed: boolean
          created_at: string
          ease_factor: number
          hints_used: number
          id: string
          interval_days: number
          is_revision: boolean
          is_solved: boolean
          next_review_at: string | null
          notes: string | null
          question_id: string
          review_count: number
          solution_viewed: boolean
          solved_at: string | null
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          approach_viewed?: boolean
          brute_force_viewed?: boolean
          created_at?: string
          ease_factor?: number
          hints_used?: number
          id?: string
          interval_days?: number
          is_revision?: boolean
          is_solved?: boolean
          next_review_at?: string | null
          notes?: string | null
          question_id: string
          review_count?: number
          solution_viewed?: boolean
          solved_at?: string | null
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          approach_viewed?: boolean
          brute_force_viewed?: boolean
          created_at?: string
          ease_factor?: number
          hints_used?: number
          id?: string
          interval_days?: number
          is_revision?: boolean
          is_solved?: boolean
          next_review_at?: string | null
          notes?: string | null
          question_id?: string
          review_count?: number
          solution_viewed?: boolean
          solved_at?: string | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
