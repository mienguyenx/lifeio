-- Port the remaining tables the frontend uses (admin config, workspaces, area
-- modules, reviews, history/audit tables, backups, AI memories ...) from the old
-- Supabase schema (db/backups/db_backup_20251228_184705.sql + db/schema/*).
-- Postgres enums from the old schema are stored as text; auth.users/profiles FKs
-- point at "users". Access control is enforced by backend/src/lib/dbRegistry.ts.
CREATE TABLE IF NOT EXISTS "admin_ai_models" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    model_id text NOT NULL,
    provider text DEFAULT 'lovable'::text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    max_tokens integer DEFAULT 4096,
    temperature numeric DEFAULT 0.7,
    capabilities text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_ai_models_model_id_key UNIQUE (model_id),
    CONSTRAINT admin_ai_models_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_ai_prompts" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    prompt_key text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    description text,
    system_prompt text NOT NULL,
    user_prompt_template text,
    variables text[] DEFAULT '{}'::text[],
    model_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_ai_prompts_pkey PRIMARY KEY (id),
    CONSTRAINT admin_ai_prompts_prompt_key_key UNIQUE (prompt_key),
    CONSTRAINT admin_ai_prompts_model_id_fkey FOREIGN KEY (model_id) REFERENCES admin_ai_models(id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_languages" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    native_name text NOT NULL,
    flag text,
    is_active boolean DEFAULT false NOT NULL,
    translation_progress integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_languages_code_key UNIQUE (code),
    CONSTRAINT admin_languages_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_plugins" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    version text DEFAULT '1.0.0'::text NOT NULL,
    description text,
    author text,
    icon text DEFAULT 'puzzle'::text,
    category text DEFAULT 'general'::text,
    is_active boolean DEFAULT false NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    hooks text[] DEFAULT '{}'::text[],
    permissions text[] DEFAULT '{}'::text[],
    sidebar_item boolean DEFAULT false,
    dashboard_widget boolean DEFAULT false,
    admin_page boolean DEFAULT false,
    entry_point text,
    repository_url text,
    documentation_url text,
    changelog jsonb DEFAULT '[]'::jsonb,
    installed_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_plugins_pkey PRIMARY KEY (id),
    CONSTRAINT admin_plugins_slug_key UNIQUE (slug)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_settings" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_settings_key_key UNIQUE (key),
    CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_templates" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_templates_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_themes" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    colors jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_themes_name_key UNIQUE (name),
    CONSTRAINT admin_themes_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_translations" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    language_code text NOT NULL,
    namespace text DEFAULT 'common'::text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_translations_language_code_namespace_key_key UNIQUE (language_code, namespace, key),
    CONSTRAINT admin_translations_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    name text NOT NULL,
    api_key text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    limit_per_day integer,
    limit_per_month integer,
    current_usage_today integer DEFAULT 0 NOT NULL,
    current_usage_month integer DEFAULT 0 NOT NULL,
    last_used_at timestamp with time zone,
    last_error text,
    error_count integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_keys_pkey PRIMARY KEY (id),
    CONSTRAINT api_keys_provider_name_key UNIQUE (provider, name),
    CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backup_history" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    backup_type text DEFAULT 'google_drive'::text NOT NULL,
    file_name text NOT NULL,
    file_id text,
    file_size bigint,
    status text DEFAULT 'pending'::text NOT NULL,
    progress integer DEFAULT 0,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT backup_history_pkey PRIMARY KEY (id),
    CONSTRAINT backup_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT backup_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backup_progress" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    backup_history_id uuid NOT NULL,
    step text NOT NULL,
    progress integer DEFAULT 0,
    message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT backup_progress_pkey PRIMARY KEY (id),
    CONSTRAINT backup_progress_backup_history_id_fkey FOREIGN KEY (backup_history_id) REFERENCES backup_history(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backup_settings" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT backup_settings_key_key UNIQUE (key),
    CONSTRAINT backup_settings_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid,
    role text NOT NULL,
    content text NOT NULL,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_intentions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    intention text NOT NULL,
    completed boolean DEFAULT false,
    reflection text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT daily_intentions_pkey PRIMARY KEY (id),
    CONSTRAINT daily_intentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_logs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    to_email text NOT NULL,
    to_name text,
    subject text NOT NULL,
    template_type text,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_by uuid,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    environment text DEFAULT 'all'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_flags_name_key UNIQUE (name),
    CONSTRAINT feature_flags_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_transactions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT finance_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT finance_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "google_drive_tokens" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_type text DEFAULT 'Bearer'::text,
    expires_at timestamp with time zone NOT NULL,
    scope text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT google_drive_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT google_drive_tokens_user_id_key UNIQUE (user_id),
    CONSTRAINT google_drive_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health_logs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    value numeric NOT NULL,
    unit text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT health_logs_pkey PRIMARY KEY (id),
    CONSTRAINT health_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_books" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    total_pages integer DEFAULT 0 NOT NULL,
    current_page integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'want_to_read'::text NOT NULL,
    rating integer,
    notes text,
    started_at date,
    completed_at date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT learning_books_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT learning_books_pkey PRIMARY KEY (id),
    CONSTRAINT learning_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_courses" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    total_lessons integer DEFAULT 0 NOT NULL,
    completed_lessons integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    started_at date,
    completed_at date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT learning_courses_pkey PRIMARY KEY (id),
    CONSTRAINT learning_courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_milestones" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    date date,
    area text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_milestones_pkey PRIMARY KEY (id),
    CONSTRAINT life_milestones_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_milestones_history" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    milestone_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_milestones_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'restored'::text, 'completed'::text]))),
    CONSTRAINT life_milestones_history_pkey PRIMARY KEY (id),
    CONSTRAINT life_milestones_history_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES life_milestones(id) ON DELETE CASCADE,
    CONSTRAINT life_milestones_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_roles" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_roles_pkey PRIMARY KEY (id),
    CONSTRAINT life_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_role_goals" (
    role_id uuid NOT NULL,
    goal_id uuid NOT NULL,
    CONSTRAINT life_role_goals_pkey PRIMARY KEY (role_id, goal_id),
    CONSTRAINT life_role_goals_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    CONSTRAINT life_role_goals_role_id_fkey FOREIGN KEY (role_id) REFERENCES life_roles(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_roles_history" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_roles_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'restored'::text, 'activated'::text, 'deactivated'::text]))),
    CONSTRAINT life_roles_history_pkey PRIMARY KEY (id),
    CONSTRAINT life_roles_history_role_id_fkey FOREIGN KEY (role_id) REFERENCES life_roles(id) ON DELETE CASCADE,
    CONSTRAINT life_roles_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_visions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    statement text NOT NULL,
    timeframe text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_visions_pkey PRIMARY KEY (id),
    CONSTRAINT life_visions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_visions_history" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vision_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_visions_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'restored'::text]))),
    CONSTRAINT life_visions_history_pkey PRIMARY KEY (id),
    CONSTRAINT life_visions_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT life_visions_history_vision_id_fkey FOREIGN KEY (vision_id) REFERENCES life_visions(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_wheel_scores" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    scores jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT life_wheel_scores_pkey PRIMARY KEY (id),
    CONSTRAINT life_wheel_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_traits" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    trait_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_traits_pkey PRIMARY KEY (id),
    CONSTRAINT personal_traits_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_traits_history" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trait_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_traits_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'restored'::text]))),
    CONSTRAINT personal_traits_history_pkey PRIMARY KEY (id),
    CONSTRAINT personal_traits_history_trait_id_fkey FOREIGN KEY (trait_id) REFERENCES personal_traits(id) ON DELETE CASCADE,
    CONSTRAINT personal_traits_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_values" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    priority integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_values_pkey PRIMARY KEY (id),
    CONSTRAINT personal_values_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_values_history" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    value_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_values_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'restored'::text]))),
    CONSTRAINT personal_values_history_pkey PRIMARY KEY (id),
    CONSTRAINT personal_values_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT personal_values_history_value_id_fkey FOREIGN KEY (value_id) REFERENCES personal_values(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pomodoro_sessions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid,
    phase text NOT NULL,
    duration integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT pomodoro_sessions_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "relationships_contacts" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    relationship text NOT NULL,
    phone text,
    email text,
    birthday date,
    notes text,
    importance integer DEFAULT 3 NOT NULL,
    last_contact date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT relationships_contacts_importance_check CHECK (((importance >= 1) AND (importance <= 5))),
    CONSTRAINT relationships_contacts_pkey PRIMARY KEY (id),
    CONSTRAINT relationships_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "relationships_interactions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    type text NOT NULL,
    date date NOT NULL,
    duration integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT relationships_interactions_pkey PRIMARY KEY (id),
    CONSTRAINT relationships_interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES relationships_contacts(id) ON DELETE CASCADE,
    CONSTRAINT relationships_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    billing_period text DEFAULT 'monthly'::text NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    allowed_user_ids uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
    CONSTRAINT subscription_plans_slug_key UNIQUE (slug)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_logs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_subscriptions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id),
    CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_reviews" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    week_start date NOT NULL,
    overall_rating integer,
    highlight text,
    lowlight text,
    wins text[],
    challenges text[],
    lessons_learned text[],
    next_week_focus text[],
    gratitude text[],
    area_ratings jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT weekly_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT weekly_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    logo_url text,
    owner_id uuid NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    max_members integer DEFAULT 10,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspaces_pkey PRIMARY KEY (id),
    CONSTRAINT workspaces_slug_key UNIQUE (slug),
    CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_members" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspace_members_pkey PRIMARY KEY (id),
    CONSTRAINT workspace_members_workspace_id_user_id_key UNIQUE (workspace_id, user_id),
    CONSTRAINT workspace_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id),
    CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_invitations" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    token text DEFAULT (gen_random_uuid())::text NOT NULL,
    invited_by uuid NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT workspace_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id),
    CONSTRAINT workspace_invitations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_reviews" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  month TEXT NOT NULL,
  wins TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  lessons_learned TEXT[] DEFAULT '{}',
  next_month_focus TEXT[] DEFAULT '{}',
  overall_rating SMALLINT DEFAULT 3 CHECK (overall_rating BETWEEN 1 AND 5),
  area_ratings JSONB,
  gratitude TEXT[],
  highlight TEXT,
  lowlight TEXT,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "yearly_plannings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  year INTEGER NOT NULL,
  theme TEXT NOT NULL DEFAULT '',
  mantra TEXT,
  yearly_goals JSONB DEFAULT '[]',
  bucket_list JSONB DEFAULT '[]',
  quarterly_focus JSONB DEFAULT '[]',
  reflections TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "yearly_reviews" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  year INTEGER NOT NULL,
  overall_rating SMALLINT DEFAULT 3 CHECK (overall_rating BETWEEN 1 AND 5),
  top_achievements TEXT[] DEFAULT '{}',
  biggest_challenges TEXT[] DEFAULT '{}',
  lessons_learned TEXT[] DEFAULT '{}',
  gratitude TEXT[] DEFAULT '{}',
  letter_to_future_self TEXT,
  word_of_the_year TEXT,
  area_ratings JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "backup_history_user_id_idx" ON "backup_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_user_id_idx" ON "chat_messages" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_intentions_user_id_idx" ON "daily_intentions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_transactions_user_id_idx" ON "finance_transactions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "google_drive_tokens_user_id_idx" ON "google_drive_tokens" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "health_logs_user_id_idx" ON "health_logs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_books_user_id_idx" ON "learning_books" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_courses_user_id_idx" ON "learning_courses" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_milestones_user_id_idx" ON "life_milestones" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_milestones_history_user_id_idx" ON "life_milestones_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_roles_user_id_idx" ON "life_roles" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_roles_history_user_id_idx" ON "life_roles_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_visions_user_id_idx" ON "life_visions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_visions_history_user_id_idx" ON "life_visions_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_wheel_scores_user_id_idx" ON "life_wheel_scores" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_traits_user_id_idx" ON "personal_traits" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_traits_history_user_id_idx" ON "personal_traits_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_values_user_id_idx" ON "personal_values" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_values_history_user_id_idx" ON "personal_values_history" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pomodoro_sessions_user_id_idx" ON "pomodoro_sessions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_contacts_user_id_idx" ON "relationships_contacts" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_interactions_user_id_idx" ON "relationships_interactions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_logs_user_id_idx" ON "system_logs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_subscriptions_user_id_idx" ON "user_subscriptions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_reviews_user_id_idx" ON "weekly_reviews" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_reviews_user_id_idx" ON "monthly_reviews" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "yearly_plannings_user_id_idx" ON "yearly_plannings" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "yearly_reviews_user_id_idx" ON "yearly_reviews" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_ai_providers" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'openai-compatible' NOT NULL,
    base_url text,
    models_endpoint text,
    icon_url text,
    color text,
    auth_type text DEFAULT 'bearer' NOT NULL,
    auth_header text DEFAULT 'Authorization' NOT NULL,
    auth_prefix text DEFAULT 'Bearer' NOT NULL,
    extra_headers jsonb DEFAULT '{}'::jsonb NOT NULL,
    fetch_type text DEFAULT 'api' NOT NULL,
    model_transform jsonb,
    is_active boolean DEFAULT true NOT NULL,
    is_builtin boolean DEFAULT false NOT NULL,
    supports_streaming boolean DEFAULT true NOT NULL,
    supports_tools boolean DEFAULT false NOT NULL,
    description text,
    docs_url text,
    pricing_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_ai_providers_pkey PRIMARY KEY (id),
    CONSTRAINT admin_ai_providers_slug_key UNIQUE (slug)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_memories" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type text DEFAULT 'fact' NOT NULL,
    content text NOT NULL,
    importance text DEFAULT 'medium' NOT NULL,
    source text DEFAULT 'manual' NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_memories_pkey PRIMARY KEY (id),
    CONSTRAINT ai_memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_memories_user_id_idx" ON "ai_memories" ("user_id");
