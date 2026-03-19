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
      admin_ai_models: {
        Row: {
          capabilities: string[] | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          max_tokens: number | null
          model_id: string
          name: string
          provider: string
          temperature: number | null
          updated_at: string
        }
        Insert: {
          capabilities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number | null
          model_id: string
          name: string
          provider?: string
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          capabilities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number | null
          model_id?: string
          name?: string
          provider?: string
          temperature?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_ai_prompts: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          model_id: string | null
          name: string
          prompt_key: string
          system_prompt: string
          updated_at: string
          user_prompt_template: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          model_id?: string | null
          name: string
          prompt_key: string
          system_prompt: string
          updated_at?: string
          user_prompt_template?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          model_id?: string | null
          name?: string
          prompt_key?: string
          system_prompt?: string
          updated_at?: string
          user_prompt_template?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_ai_prompts_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "admin_ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_languages: {
        Row: {
          code: string
          created_at: string
          flag: string | null
          id: string
          is_active: boolean
          name: string
          native_name: string
          translation_progress: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          flag?: string | null
          id?: string
          is_active?: boolean
          name: string
          native_name: string
          translation_progress?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string | null
          id?: string
          is_active?: boolean
          name?: string
          native_name?: string
          translation_progress?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_plugins: {
        Row: {
          admin_page: boolean | null
          author: string | null
          category: string | null
          changelog: Json | null
          config: Json
          dashboard_widget: boolean | null
          default_config: Json
          description: string | null
          documentation_url: string | null
          entry_point: string | null
          hooks: string[] | null
          icon: string | null
          id: string
          installed_at: string
          is_active: boolean
          is_system: boolean
          name: string
          permissions: string[] | null
          repository_url: string | null
          sidebar_item: boolean | null
          slug: string
          updated_at: string
          version: string
        }
        Insert: {
          admin_page?: boolean | null
          author?: string | null
          category?: string | null
          changelog?: Json | null
          config?: Json
          dashboard_widget?: boolean | null
          default_config?: Json
          description?: string | null
          documentation_url?: string | null
          entry_point?: string | null
          hooks?: string[] | null
          icon?: string | null
          id?: string
          installed_at?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          permissions?: string[] | null
          repository_url?: string | null
          sidebar_item?: boolean | null
          slug: string
          updated_at?: string
          version?: string
        }
        Update: {
          admin_page?: boolean | null
          author?: string | null
          category?: string | null
          changelog?: Json | null
          config?: Json
          dashboard_widget?: boolean | null
          default_config?: Json
          description?: string | null
          documentation_url?: string | null
          entry_point?: string | null
          hooks?: string[] | null
          icon?: string | null
          id?: string
          installed_at?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          permissions?: string[] | null
          repository_url?: string | null
          sidebar_item?: boolean | null
          slug?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      admin_templates: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      admin_themes: {
        Row: {
          colors: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          colors?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "saved_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_intentions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          intention: string
          reflection: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date: string
          id?: string
          intention: string
          reflection?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          intention?: string
          reflection?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_intentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          template_type: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          template_type?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          template_type?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          environment: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          environment?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          environment?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          date: string
          description: string | null
          goal_id: string
          id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          date: string
          description?: string | null
          goal_id: string
          id?: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          date?: string
          description?: string | null
          goal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_activities_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_collaborators: {
        Row: {
          accepted_at: string | null
          email: string
          goal_id: string
          id: string
          invited_at: string | null
          name: string | null
          role: Database["public"]["Enums"]["collaborator_role"] | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          goal_id: string
          id?: string
          invited_at?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["collaborator_role"] | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          goal_id?: string
          id?: string
          invited_at?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["collaborator_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_collaborators_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          goal_id: string
          id: string
          task_id: string | null
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          goal_id: string
          id?: string
          task_id?: string | null
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          goal_id?: string
          id?: string
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_task_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_progress_history: {
        Row: {
          created_at: string | null
          date: string
          goal_id: string
          id: string
          note: string | null
          progress: number
        }
        Insert: {
          created_at?: string | null
          date: string
          goal_id: string
          id?: string
          note?: string | null
          progress: number
        }
        Update: {
          created_at?: string | null
          date?: string
          goal_id?: string
          id?: string
          note?: string | null
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_vision_items: {
        Row: {
          author: string | null
          content: string
          created_at: string | null
          goal_id: string
          id: string
          item_type: string
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string | null
          goal_id: string
          id?: string
          item_type: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string | null
          goal_id?: string
          id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_vision_items_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          archived_at: string | null
          area: Database["public"]["Enums"]["life_area"]
          best_streak: number | null
          completed_at: string | null
          created_at: string | null
          current_streak: number | null
          deleted_at: string | null
          dependencies: string[] | null
          dependents: string[] | null
          description: string | null
          focused_at: string | null
          id: string
          is_focused: boolean | null
          is_public: boolean | null
          last_activity_date: string | null
          last_reminded: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress: number | null
          push_deadline: boolean | null
          push_enabled: boolean | null
          push_weekly: boolean | null
          reminder_days: number | null
          reminder_enabled: boolean | null
          share_code: string | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area: Database["public"]["Enums"]["life_area"]
          best_streak?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_streak?: number | null
          deleted_at?: string | null
          dependencies?: string[] | null
          dependents?: string[] | null
          description?: string | null
          focused_at?: string | null
          id?: string
          is_focused?: boolean | null
          is_public?: boolean | null
          last_activity_date?: string | null
          last_reminded?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          push_deadline?: boolean | null
          push_enabled?: boolean | null
          push_weekly?: boolean | null
          reminder_days?: number | null
          reminder_enabled?: boolean | null
          share_code?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area?: Database["public"]["Enums"]["life_area"]
          best_streak?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_streak?: number | null
          deleted_at?: string | null
          dependencies?: string[] | null
          dependents?: string[] | null
          description?: string | null
          focused_at?: string | null
          id?: string
          is_focused?: boolean | null
          is_public?: boolean | null
          last_activity_date?: string | null
          last_reminded?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          push_deadline?: boolean | null
          push_enabled?: boolean | null
          push_weekly?: boolean | null
          reminder_days?: number | null
          reminder_enabled?: boolean | null
          share_code?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_challenges: {
        Row: {
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          completed_at: string | null
          completed_days: number | null
          habit_id: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["challenge_status"] | null
        }
        Insert: {
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          completed_at?: string | null
          completed_days?: number | null
          habit_id: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["challenge_status"] | null
        }
        Update: {
          challenge_type?: Database["public"]["Enums"]["challenge_type"]
          completed_at?: string | null
          completed_days?: number | null
          habit_id?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["challenge_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_challenges_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_competitions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_days: number | null
          habit_ids: string[] | null
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["challenge_status"] | null
          target_rate: number | null
          user_id: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_days?: number | null
          habit_ids?: string[] | null
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["challenge_status"] | null
          target_rate?: number | null
          user_id: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_days?: number | null
          habit_ids?: string[] | null
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["challenge_status"] | null
          target_rate?: number | null
          user_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_competitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completion_time: string | null
          count: number | null
          created_at: string | null
          date: string
          habit_id: string
          id: string
          notes: string | null
        }
        Insert: {
          completion_time?: string | null
          count?: number | null
          created_at?: string | null
          date: string
          habit_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          completion_time?: string | null
          count?: number | null
          created_at?: string | null
          date?: string
          habit_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          area: Database["public"]["Enums"]["life_area"]
          best_streak: number | null
          color: string | null
          completed_dates: string[] | null
          created_at: string | null
          custom_days: number[] | null
          deleted_at: string | null
          description: string | null
          frequency: Database["public"]["Enums"]["habit_frequency"] | null
          goal_id: string | null
          icon: string | null
          id: string
          name: string
          reminder_enabled: boolean | null
          reminder_time: string | null
          streak: number | null
          target_days: number | null
          target_per_day: number | null
          target_unit: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area: Database["public"]["Enums"]["life_area"]
          best_streak?: number | null
          color?: string | null
          completed_dates?: string[] | null
          created_at?: string | null
          custom_days?: number[] | null
          deleted_at?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["habit_frequency"] | null
          goal_id?: string | null
          icon?: string | null
          id?: string
          name: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak?: number | null
          target_days?: number | null
          target_per_day?: number | null
          target_unit?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area?: Database["public"]["Enums"]["life_area"]
          best_streak?: number | null
          color?: string | null
          completed_dates?: string[] | null
          created_at?: string | null
          custom_days?: number[] | null
          deleted_at?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["habit_frequency"] | null
          goal_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak?: number | null
          target_days?: number | null
          target_per_day?: number | null
          target_unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          areas: Database["public"]["Enums"]["life_area"][] | null
          content: string
          created_at: string | null
          date: string
          energy: number | null
          gratitude: string[] | null
          id: string
          images: string[] | null
          mood: number | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          areas?: Database["public"]["Enums"]["life_area"][] | null
          content: string
          created_at?: string | null
          date: string
          energy?: number | null
          gratitude?: string[] | null
          id?: string
          images?: string[] | null
          mood?: number | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          areas?: Database["public"]["Enums"]["life_area"][] | null
          content?: string
          created_at?: string | null
          date?: string
          energy?: number | null
          gratitude?: string[] | null
          id?: string
          images?: string[] | null
          mood?: number | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_tags: {
        Row: {
          color: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_milestones: {
        Row: {
          area: Database["public"]["Enums"]["life_area"] | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          area?: Database["public"]["Enums"]["life_area"] | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"] | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_role_goals: {
        Row: {
          goal_id: string
          role_id: string
        }
        Insert: {
          goal_id: string
          role_id: string
        }
        Update: {
          goal_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_role_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_role_goals_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "life_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_roles: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_visions: {
        Row: {
          created_at: string | null
          id: string
          statement: string
          timeframe: Database["public"]["Enums"]["vision_timeframe"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          statement: string
          timeframe?: Database["public"]["Enums"]["vision_timeframe"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          statement?: string
          timeframe?: Database["public"]["Enums"]["vision_timeframe"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_visions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_wheel_scores: {
        Row: {
          created_at: string | null
          date: string
          id: string
          scores: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          scores: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_wheel_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          color: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          archived_at: string | null
          area: Database["public"]["Enums"]["life_area"] | null
          color: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_favorite: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area?: Database["public"]["Enums"]["life_area"] | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area?: Database["public"]["Enums"]["life_area"] | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_traits: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          trait_type: Database["public"]["Enums"]["trait_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          trait_type: Database["public"]["Enums"]["trait_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          trait_type?: Database["public"]["Enums"]["trait_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_traits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_values: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_values_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_hooks: {
        Row: {
          created_at: string
          handler_key: string
          hook_name: string
          id: string
          is_active: boolean | null
          plugin_id: string
          priority: number | null
        }
        Insert: {
          created_at?: string
          handler_key: string
          hook_name: string
          id?: string
          is_active?: boolean | null
          plugin_id: string
          priority?: number | null
        }
        Update: {
          created_at?: string
          handler_key?: string
          hook_name?: string
          id?: string
          is_active?: boolean | null
          plugin_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_hooks_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "admin_plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string | null
          duration: number
          id: string
          phase: Database["public"]["Enums"]["pomodoro_phase"]
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration: number
          id?: string
          phase: Database["public"]["Enums"]["pomodoro_phase"]
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration?: number
          id?: string
          phase?: Database["public"]["Enums"]["pomodoro_phase"]
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pomodoro_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string | null
          email: string | null
          id: string
          life_purpose: string | null
          name: string | null
          phone: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          life_purpose?: string | null
          name?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          life_purpose?: string | null
          name?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          allowed_user_ids: string[] | null
          billing_period: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_default: boolean
          is_hidden: boolean
          limits: Json
          name: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed_user_ids?: string[] | null
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_hidden?: boolean
          limits?: Json
          name: string
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allowed_user_ids?: string[] | null
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_hidden?: boolean
          limits?: Json
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_tags: {
        Row: {
          color: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          area: Database["public"]["Enums"]["life_area"] | null
          completed_at: string | null
          completed_pomodoros: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_pomodoros: number | null
          goal_id: string | null
          id: string
          last_reminded: string | null
          milestone_id: string | null
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          recurring_end_date: string | null
          recurring_frequency:
            | Database["public"]["Enums"]["recurring_frequency"]
            | null
          recurring_interval: number | null
          recurring_week_days: number[] | null
          reminder_minutes: number | null
          reminder_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          area?: Database["public"]["Enums"]["life_area"] | null
          completed_at?: string | null
          completed_pomodoros?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_pomodoros?: number | null
          goal_id?: string | null
          id?: string
          last_reminded?: string | null
          milestone_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurring_end_date?: string | null
          recurring_frequency?:
            | Database["public"]["Enums"]["recurring_frequency"]
            | null
          recurring_interval?: number | null
          recurring_week_days?: number[] | null
          reminder_minutes?: number | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          area?: Database["public"]["Enums"]["life_area"] | null
          completed_at?: string | null
          completed_pomodoros?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_pomodoros?: number | null
          goal_id?: string | null
          id?: string
          last_reminded?: string | null
          milestone_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurring_end_date?: string | null
          recurring_frequency?:
            | Database["public"]["Enums"]["recurring_frequency"]
            | null
          recurring_interval?: number | null
          recurring_week_days?: number[] | null
          reminder_minutes?: number | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "goal_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plugin_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          plugin_id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          plugin_id: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          plugin_id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plugin_settings_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "admin_plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plugin_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          pomodoro_break_duration: number | null
          pomodoro_long_break_duration: number | null
          pomodoro_sessions_before_long_break: number | null
          pomodoro_work_duration: number | null
          trash_auto_cleanup_days: number | null
          trash_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          pomodoro_break_duration?: number | null
          pomodoro_long_break_duration?: number | null
          pomodoro_sessions_before_long_break?: number | null
          pomodoro_work_duration?: number | null
          trash_auto_cleanup_days?: number | null
          trash_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          pomodoro_break_duration?: number | null
          pomodoro_long_break_duration?: number | null
          pomodoro_sessions_before_long_break?: number | null
          pomodoro_work_duration?: number | null
          trash_auto_cleanup_days?: number | null
          trash_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          area_ratings: Json | null
          challenges: string[] | null
          created_at: string | null
          gratitude: string[] | null
          highlight: string | null
          id: string
          lessons_learned: string[] | null
          lowlight: string | null
          next_week_focus: string[] | null
          overall_rating: number | null
          user_id: string
          week_start: string
          wins: string[] | null
        }
        Insert: {
          area_ratings?: Json | null
          challenges?: string[] | null
          created_at?: string | null
          gratitude?: string[] | null
          highlight?: string | null
          id?: string
          lessons_learned?: string[] | null
          lowlight?: string | null
          next_week_focus?: string[] | null
          overall_rating?: number | null
          user_id: string
          week_start: string
          wins?: string[] | null
        }
        Update: {
          area_ratings?: Json | null
          challenges?: string[] | null
          created_at?: string | null
          gratitude?: string[] | null
          highlight?: string | null
          id?: string
          lessons_learned?: string[] | null
          lowlight?: string | null
          next_week_focus?: string[] | null
          overall_rating?: number | null
          user_id?: string
          week_start?: string
          wins?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          max_members: number | null
          name: string
          owner_id: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_members?: number | null
          name: string
          owner_id: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_members?: number | null
          name?: string
          owner_id?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      challenge_status: "active" | "completed" | "failed"
      challenge_type: "21-day" | "30-day" | "66-day"
      collaborator_role: "viewer" | "editor"
      goal_status: "active" | "paused" | "archived"
      habit_frequency: "daily" | "weekly" | "custom"
      life_area:
        | "health"
        | "relationships"
        | "career"
        | "finance"
        | "personal"
        | "fun"
        | "environment"
        | "spirituality"
        | "learning"
        | "contribution"
      pomodoro_phase: "work" | "break" | "long_break"
      recurring_frequency: "daily" | "weekly" | "monthly"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "in_progress" | "deferred" | "done"
      trait_type: "strength" | "weakness"
      vision_timeframe: "1-year" | "5-year" | "10-year" | "lifetime"
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
      app_role: ["admin", "moderator", "user"],
      challenge_status: ["active", "completed", "failed"],
      challenge_type: ["21-day", "30-day", "66-day"],
      collaborator_role: ["viewer", "editor"],
      goal_status: ["active", "paused", "archived"],
      habit_frequency: ["daily", "weekly", "custom"],
      life_area: [
        "health",
        "relationships",
        "career",
        "finance",
        "personal",
        "fun",
        "environment",
        "spirituality",
        "learning",
        "contribution",
      ],
      pomodoro_phase: ["work", "break", "long_break"],
      recurring_frequency: ["daily", "weekly", "monthly"],
      task_priority: ["low", "medium", "high"],
      task_status: ["todo", "in_progress", "deferred", "done"],
      trait_type: ["strength", "weakness"],
      vision_timeframe: ["1-year", "5-year", "10-year", "lifetime"],
    },
  },
} as const
