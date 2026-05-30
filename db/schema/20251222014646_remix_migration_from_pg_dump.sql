CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: challenge_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challenge_status AS ENUM (
    'active',
    'completed',
    'failed'
);


--
-- Name: challenge_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challenge_type AS ENUM (
    '21-day',
    '30-day',
    '66-day'
);


--
-- Name: collaborator_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collaborator_role AS ENUM (
    'viewer',
    'editor'
);


--
-- Name: goal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.goal_status AS ENUM (
    'active',
    'paused',
    'archived'
);


--
-- Name: habit_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.habit_frequency AS ENUM (
    'daily',
    'weekly',
    'custom'
);


--
-- Name: life_area; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.life_area AS ENUM (
    'health',
    'relationships',
    'career',
    'finance',
    'personal',
    'fun',
    'environment',
    'spirituality',
    'learning',
    'contribution'
);


--
-- Name: pomodoro_phase; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pomodoro_phase AS ENUM (
    'work',
    'break',
    'long_break'
);


--
-- Name: recurring_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recurring_frequency AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


--
-- Name: task_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_priority AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_status AS ENUM (
    'todo',
    'in_progress',
    'deferred',
    'done'
);


--
-- Name: trait_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trait_type AS ENUM (
    'strength',
    'weakness'
);


--
-- Name: vision_timeframe; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vision_timeframe AS ENUM (
    '1-year',
    '5-year',
    '10-year',
    'lifetime'
);


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users (excluding the new one)
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_ai_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_ai_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    model_id text NOT NULL,
    provider text DEFAULT 'lovable'::text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    max_tokens integer DEFAULT 4096,
    temperature numeric(3,2) DEFAULT 0.7,
    capabilities text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_ai_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_ai_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    prompt_key text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    system_prompt text NOT NULL,
    user_prompt_template text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    variables text[] DEFAULT '{}'::text[],
    model_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_languages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    native_name text NOT NULL,
    flag text,
    is_active boolean DEFAULT false NOT NULL,
    translation_progress integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_plugins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_plugins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    version text DEFAULT '1.0.0'::text NOT NULL,
    description text,
    author text,
    icon text DEFAULT 'puzzle'::text,
    category text DEFAULT 'general'::text,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    hooks text[] DEFAULT '{}'::text[],
    permissions text[] DEFAULT '{}'::text[],
    entry_point text,
    admin_page boolean DEFAULT false,
    sidebar_item boolean DEFAULT false,
    dashboard_widget boolean DEFAULT false,
    is_active boolean DEFAULT false NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    installed_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    repository_url text,
    documentation_url text,
    changelog jsonb DEFAULT '[]'::jsonb
);


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    description text,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_templates_type_check CHECK ((type = ANY (ARRAY['goals'::text, 'habits'::text, 'journal'::text, 'review'::text])))
);


--
-- Name: admin_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    colors jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    conversation_id uuid,
    user_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: daily_intentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_intentions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    intention text NOT NULL,
    reflection text,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    to_email text NOT NULL,
    to_name text,
    subject text NOT NULL,
    template_type text,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    environment text DEFAULT 'all'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_flags_environment_check CHECK ((environment = ANY (ARRAY['all'::text, 'development'::text, 'production'::text])))
);


--
-- Name: goal_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_activities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    goal_id uuid NOT NULL,
    date date NOT NULL,
    activity_type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT goal_activities_activity_type_check CHECK ((activity_type = ANY (ARRAY['progress'::text, 'milestone'::text, 'note'::text, 'task'::text])))
);


--
-- Name: goal_collaborators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_collaborators (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    goal_id uuid NOT NULL,
    email text NOT NULL,
    name text,
    role public.collaborator_role DEFAULT 'viewer'::public.collaborator_role,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone
);


--
-- Name: goal_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_milestones (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    goal_id uuid NOT NULL,
    title text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    task_id uuid
);


--
-- Name: goal_progress_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_progress_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    goal_id uuid NOT NULL,
    date date NOT NULL,
    progress integer NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: goal_vision_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_vision_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    goal_id uuid NOT NULL,
    item_type text NOT NULL,
    content text NOT NULL,
    author text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT goal_vision_items_item_type_check CHECK ((item_type = ANY (ARRAY['image'::text, 'quote'::text])))
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    area public.life_area NOT NULL,
    target_date date,
    progress integer DEFAULT 0,
    priority public.task_priority DEFAULT 'medium'::public.task_priority,
    status public.goal_status DEFAULT 'active'::public.goal_status,
    is_focused boolean DEFAULT false,
    focused_at timestamp with time zone,
    reminder_days integer DEFAULT 7,
    reminder_enabled boolean DEFAULT false,
    last_reminded timestamp with time zone,
    current_streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    last_activity_date date,
    is_public boolean DEFAULT false,
    share_code text,
    push_enabled boolean DEFAULT false,
    push_deadline boolean DEFAULT false,
    push_weekly boolean DEFAULT false,
    dependencies uuid[],
    dependents uuid[],
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    archived_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT goals_progress_check CHECK (((progress >= 0) AND (progress <= 100)))
);


--
-- Name: habit_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_challenges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    habit_id uuid NOT NULL,
    challenge_type public.challenge_type NOT NULL,
    start_date date NOT NULL,
    completed_days integer DEFAULT 0,
    status public.challenge_status DEFAULT 'active'::public.challenge_status,
    completed_at timestamp with time zone
);


--
-- Name: habit_competitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_competitions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    habit_ids uuid[],
    target_rate integer DEFAULT 90,
    duration_days integer DEFAULT 30,
    start_date date NOT NULL,
    status public.challenge_status DEFAULT 'active'::public.challenge_status,
    winner_id uuid,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: habit_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_completions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    habit_id uuid NOT NULL,
    date date NOT NULL,
    count integer DEFAULT 1,
    notes text,
    completion_time time without time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: habits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habits (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    area public.life_area NOT NULL,
    frequency public.habit_frequency DEFAULT 'daily'::public.habit_frequency,
    custom_days integer[],
    target_per_day integer DEFAULT 1,
    target_unit text,
    streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    completed_dates text[],
    reminder_time time without time zone,
    reminder_enabled boolean DEFAULT false,
    color text,
    icon text,
    goal_id uuid,
    target_days integer,
    created_at timestamp with time zone DEFAULT now(),
    archived_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    content text NOT NULL,
    mood integer,
    energy integer,
    areas public.life_area[],
    gratitude text[],
    tags uuid[],
    images text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT journal_entries_energy_check CHECK (((energy >= 1) AND (energy <= 5))),
    CONSTRAINT journal_entries_mood_check CHECK (((mood >= 1) AND (mood <= 5)))
);


--
-- Name: journal_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_tags (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL
);


--
-- Name: life_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.life_milestones (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    date date,
    area public.life_area,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: life_role_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.life_role_goals (
    role_id uuid NOT NULL,
    goal_id uuid NOT NULL
);


--
-- Name: life_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.life_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: life_visions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.life_visions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    statement text NOT NULL,
    timeframe public.vision_timeframe,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: life_wheel_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.life_wheel_scores (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    scores jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: note_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note_tags (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    tags uuid[],
    area public.life_area,
    is_pinned boolean DEFAULT false,
    is_favorite boolean DEFAULT false,
    color text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    archived_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: personal_traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_traits (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    trait_type public.trait_type NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: personal_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_values (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    priority integer,
    icon text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_values_priority_check CHECK (((priority >= 1) AND (priority <= 5)))
);


--
-- Name: plugin_hooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plugin_hooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plugin_id uuid NOT NULL,
    hook_name text NOT NULL,
    priority integer DEFAULT 10,
    handler_key text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pomodoro_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid,
    phase public.pomodoro_phase NOT NULL,
    duration integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text,
    avatar_url text,
    email text,
    phone text,
    birthday date,
    timezone text DEFAULT 'Asia/Ho_Chi_Minh'::text,
    bio text,
    life_purpose text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: saved_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    billing_period text DEFAULT 'monthly'::text NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    allowed_user_ids uuid[] DEFAULT '{}'::uuid[]
);


--
-- Name: subtasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subtasks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    task_id uuid NOT NULL,
    title text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone
);


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT system_logs_level_check CHECK ((level = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])))
);


--
-- Name: task_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_tags (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    area public.life_area,
    priority public.task_priority DEFAULT 'medium'::public.task_priority,
    status public.task_status DEFAULT 'todo'::public.task_status,
    due_date date,
    estimated_pomodoros integer,
    completed_pomodoros integer DEFAULT 0,
    tags uuid[],
    recurring_frequency public.recurring_frequency,
    recurring_interval integer,
    recurring_week_days integer[],
    recurring_end_date date,
    reminder_minutes integer,
    last_reminded timestamp with time zone,
    archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    goal_id uuid,
    milestone_id uuid,
    "position" integer,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: user_plugin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_plugin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plugin_id uuid NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    user_id uuid NOT NULL,
    pomodoro_work_duration integer DEFAULT 25,
    pomodoro_break_duration integer DEFAULT 5,
    pomodoro_long_break_duration integer DEFAULT 15,
    pomodoro_sessions_before_long_break integer DEFAULT 4,
    trash_auto_cleanup_days integer DEFAULT 30,
    trash_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: weekly_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    week_start date NOT NULL,
    wins text[],
    challenges text[],
    lessons_learned text[],
    next_week_focus text[],
    overall_rating integer,
    area_ratings jsonb,
    gratitude text[],
    highlight text,
    lowlight text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT weekly_reviews_overall_rating_check CHECK (((overall_rating >= 1) AND (overall_rating <= 5)))
);


--
-- Name: workspace_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    invited_by uuid NOT NULL,
    token text DEFAULT (gen_random_uuid())::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspace_invitations_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text, 'viewer'::text])))
);


--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    joined_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspace_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'viewer'::text]))),
    CONSTRAINT workspace_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text])))
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    logo_url text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    max_members integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_ai_models admin_ai_models_model_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_models
    ADD CONSTRAINT admin_ai_models_model_id_key UNIQUE (model_id);


--
-- Name: admin_ai_models admin_ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_models
    ADD CONSTRAINT admin_ai_models_pkey PRIMARY KEY (id);


--
-- Name: admin_ai_prompts admin_ai_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_prompts
    ADD CONSTRAINT admin_ai_prompts_pkey PRIMARY KEY (id);


--
-- Name: admin_ai_prompts admin_ai_prompts_prompt_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_prompts
    ADD CONSTRAINT admin_ai_prompts_prompt_key_key UNIQUE (prompt_key);


--
-- Name: admin_languages admin_languages_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_languages
    ADD CONSTRAINT admin_languages_code_key UNIQUE (code);


--
-- Name: admin_languages admin_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_languages
    ADD CONSTRAINT admin_languages_pkey PRIMARY KEY (id);


--
-- Name: admin_plugins admin_plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_plugins
    ADD CONSTRAINT admin_plugins_pkey PRIMARY KEY (id);


--
-- Name: admin_plugins admin_plugins_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_plugins
    ADD CONSTRAINT admin_plugins_slug_key UNIQUE (slug);


--
-- Name: admin_settings admin_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_key_key UNIQUE (key);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_templates admin_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_templates
    ADD CONSTRAINT admin_templates_pkey PRIMARY KEY (id);


--
-- Name: admin_themes admin_themes_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_themes
    ADD CONSTRAINT admin_themes_name_key UNIQUE (name);


--
-- Name: admin_themes admin_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_themes
    ADD CONSTRAINT admin_themes_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: daily_intentions daily_intentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_intentions
    ADD CONSTRAINT daily_intentions_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_name_key UNIQUE (name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: goal_activities goal_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_activities
    ADD CONSTRAINT goal_activities_pkey PRIMARY KEY (id);


--
-- Name: goal_collaborators goal_collaborators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_collaborators
    ADD CONSTRAINT goal_collaborators_pkey PRIMARY KEY (id);


--
-- Name: goal_milestones goal_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_milestones
    ADD CONSTRAINT goal_milestones_pkey PRIMARY KEY (id);


--
-- Name: goal_progress_history goal_progress_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_progress_history
    ADD CONSTRAINT goal_progress_history_pkey PRIMARY KEY (id);


--
-- Name: goal_vision_items goal_vision_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_vision_items
    ADD CONSTRAINT goal_vision_items_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: goals goals_share_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_share_code_key UNIQUE (share_code);


--
-- Name: habit_challenges habit_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_challenges
    ADD CONSTRAINT habit_challenges_pkey PRIMARY KEY (id);


--
-- Name: habit_competitions habit_competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_competitions
    ADD CONSTRAINT habit_competitions_pkey PRIMARY KEY (id);


--
-- Name: habit_completions habit_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_tags journal_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_tags
    ADD CONSTRAINT journal_tags_pkey PRIMARY KEY (id);


--
-- Name: life_milestones life_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_milestones
    ADD CONSTRAINT life_milestones_pkey PRIMARY KEY (id);


--
-- Name: life_role_goals life_role_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_role_goals
    ADD CONSTRAINT life_role_goals_pkey PRIMARY KEY (role_id, goal_id);


--
-- Name: life_roles life_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_roles
    ADD CONSTRAINT life_roles_pkey PRIMARY KEY (id);


--
-- Name: life_visions life_visions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_visions
    ADD CONSTRAINT life_visions_pkey PRIMARY KEY (id);


--
-- Name: life_wheel_scores life_wheel_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_wheel_scores
    ADD CONSTRAINT life_wheel_scores_pkey PRIMARY KEY (id);


--
-- Name: note_tags note_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_tags
    ADD CONSTRAINT note_tags_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: personal_traits personal_traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_traits
    ADD CONSTRAINT personal_traits_pkey PRIMARY KEY (id);


--
-- Name: personal_values personal_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_values
    ADD CONSTRAINT personal_values_pkey PRIMARY KEY (id);


--
-- Name: plugin_hooks plugin_hooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugin_hooks
    ADD CONSTRAINT plugin_hooks_pkey PRIMARY KEY (id);


--
-- Name: plugin_hooks plugin_hooks_plugin_id_hook_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugin_hooks
    ADD CONSTRAINT plugin_hooks_plugin_id_hook_name_key UNIQUE (plugin_id, hook_name);


--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: saved_conversations saved_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_conversations
    ADD CONSTRAINT saved_conversations_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: subtasks subtasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT subtasks_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: task_tags task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_plugin_settings user_plugin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_plugin_settings
    ADD CONSTRAINT user_plugin_settings_pkey PRIMARY KEY (id);


--
-- Name: user_plugin_settings user_plugin_settings_user_id_plugin_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_plugin_settings
    ADD CONSTRAINT user_plugin_settings_user_id_plugin_id_key UNIQUE (user_id, plugin_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: weekly_reviews weekly_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_reviews
    ADD CONSTRAINT weekly_reviews_pkey PRIMARY KEY (id);


--
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id);


--
-- Name: workspace_invitations workspace_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_key UNIQUE (token);


--
-- Name: workspace_invitations workspace_invitations_workspace_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_workspace_id_email_key UNIQUE (workspace_id, email);


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_workspace_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_id_user_id_key UNIQUE (workspace_id, user_id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_slug_key UNIQUE (slug);


--
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at DESC);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_goals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_status ON public.goals USING btree (status);


--
-- Name: idx_goals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_user_id ON public.goals USING btree (user_id);


--
-- Name: idx_habit_completions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habit_completions_date ON public.habit_completions USING btree (date);


--
-- Name: idx_habit_completions_habit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions USING btree (habit_id);


--
-- Name: idx_habits_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habits_area ON public.habits USING btree (area);


--
-- Name: idx_habits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_habits_user_id ON public.habits USING btree (user_id);


--
-- Name: idx_journal_entries_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_date ON public.journal_entries USING btree (date);


--
-- Name: idx_journal_entries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_user_id ON public.journal_entries USING btree (user_id);


--
-- Name: idx_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);


--
-- Name: idx_workspace_invitations_workspace; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspace_invitations_workspace ON public.workspace_invitations USING btree (workspace_id);


--
-- Name: idx_workspace_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspace_members_user ON public.workspace_members USING btree (user_id);


--
-- Name: idx_workspace_members_workspace; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspace_members_workspace ON public.workspace_members USING btree (workspace_id);


--
-- Name: idx_workspaces_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspaces_owner ON public.workspaces USING btree (owner_id);


--
-- Name: admin_languages update_admin_languages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_languages_updated_at BEFORE UPDATE ON public.admin_languages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_settings update_admin_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_templates update_admin_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_templates_updated_at BEFORE UPDATE ON public.admin_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_themes update_admin_themes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_themes_updated_at BEFORE UPDATE ON public.admin_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: feature_flags update_feature_flags_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: life_visions update_life_visions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_life_visions_updated_at BEFORE UPDATE ON public.life_visions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notes update_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_roles update_user_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workspaces update_workspaces_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_ai_prompts admin_ai_prompts_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_prompts
    ADD CONSTRAINT admin_ai_prompts_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.admin_ai_models(id);


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.saved_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: daily_intentions daily_intentions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_intentions
    ADD CONSTRAINT daily_intentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: email_logs email_logs_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id);


--
-- Name: goal_activities goal_activities_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_activities
    ADD CONSTRAINT goal_activities_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goal_collaborators goal_collaborators_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_collaborators
    ADD CONSTRAINT goal_collaborators_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goal_milestones goal_milestones_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_milestones
    ADD CONSTRAINT goal_milestones_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goal_progress_history goal_progress_history_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_progress_history
    ADD CONSTRAINT goal_progress_history_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goal_vision_items goal_vision_items_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_vision_items
    ADD CONSTRAINT goal_vision_items_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: habit_challenges habit_challenges_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_challenges
    ADD CONSTRAINT habit_challenges_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: habit_competitions habit_competitions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_competitions
    ADD CONSTRAINT habit_competitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: habit_completions habit_completions_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: habits habits_goal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_goal_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;


--
-- Name: habits habits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: journal_tags journal_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_tags
    ADD CONSTRAINT journal_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: life_milestones life_milestones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_milestones
    ADD CONSTRAINT life_milestones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: life_role_goals life_role_goals_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_role_goals
    ADD CONSTRAINT life_role_goals_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: life_role_goals life_role_goals_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_role_goals
    ADD CONSTRAINT life_role_goals_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.life_roles(id) ON DELETE CASCADE;


--
-- Name: life_roles life_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_roles
    ADD CONSTRAINT life_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: life_visions life_visions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_visions
    ADD CONSTRAINT life_visions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: life_wheel_scores life_wheel_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.life_wheel_scores
    ADD CONSTRAINT life_wheel_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: goal_milestones milestones_task_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_milestones
    ADD CONSTRAINT milestones_task_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: note_tags note_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_tags
    ADD CONSTRAINT note_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: personal_traits personal_traits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_traits
    ADD CONSTRAINT personal_traits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: personal_values personal_values_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_values
    ADD CONSTRAINT personal_values_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: plugin_hooks plugin_hooks_plugin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugin_hooks
    ADD CONSTRAINT plugin_hooks_plugin_id_fkey FOREIGN KEY (plugin_id) REFERENCES public.admin_plugins(id) ON DELETE CASCADE;


--
-- Name: pomodoro_sessions pomodoro_sessions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: pomodoro_sessions pomodoro_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_conversations saved_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_conversations
    ADD CONSTRAINT saved_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: subtasks subtasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subtasks
    ADD CONSTRAINT subtasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: task_tags task_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.goal_milestones(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_plugin_settings user_plugin_settings_plugin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_plugin_settings
    ADD CONSTRAINT user_plugin_settings_plugin_id_fkey FOREIGN KEY (plugin_id) REFERENCES public.admin_plugins(id) ON DELETE CASCADE;


--
-- Name: user_plugin_settings user_plugin_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_plugin_settings
    ADD CONSTRAINT user_plugin_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: weekly_reviews weekly_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_reviews
    ADD CONSTRAINT weekly_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: workspace_invitations workspace_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);


--
-- Name: workspace_invitations workspace_invitations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);


--
-- Name: workspace_members workspace_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspaces workspaces_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: feature_flags Admins can delete feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete feature flags" ON public.feature_flags FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feature_flags Admins can insert feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert feature flags" ON public.feature_flags FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_logs Admins can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert logs" ON public.system_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert settings" ON public.admin_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_ai_models Admins can manage AI models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage AI models" ON public.admin_ai_models USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_ai_prompts Admins can manage AI prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage AI prompts" ON public.admin_ai_prompts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: workspace_invitations Admins can manage all invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all invitations" ON public.workspace_invitations USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: workspace_members Admins can manage all members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all members" ON public.workspace_members USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_subscriptions Admins can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: workspaces Admins can manage all workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all workspaces" ON public.workspaces USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_logs Admins can manage email logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage email logs" ON public.email_logs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_languages Admins can manage languages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage languages" ON public.admin_languages USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.subscription_plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: plugin_hooks Admins can manage plugin hooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plugin hooks" ON public.plugin_hooks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_plugins Admins can manage plugins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plugins" ON public.admin_plugins USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_templates Admins can manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage templates" ON public.admin_templates USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_themes Admins can manage themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage themes" ON public.admin_themes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feature_flags Admins can update feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update feature flags" ON public.feature_flags FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_plugin_settings Admins can view all plugin settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all plugin settings" ON public.user_plugin_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feature_flags Admins can view feature flags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view feature flags" ON public.feature_flags FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_logs Admins can view logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view logs" ON public.system_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view settings" ON public.admin_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscription_plans Everyone can view active plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active plans" ON public.subscription_plans FOR SELECT USING ((is_active = true));


--
-- Name: workspaces Owners can update their workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update their workspaces" ON public.workspaces FOR UPDATE USING ((owner_id = auth.uid()));


--
-- Name: goals Public goals are viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public goals are viewable" ON public.goals FOR SELECT USING ((is_public = true));


--
-- Name: chat_messages Users can CRUD own chat messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own chat messages" ON public.chat_messages USING ((auth.uid() = user_id));


--
-- Name: habit_competitions Users can CRUD own competitions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own competitions" ON public.habit_competitions USING ((auth.uid() = user_id));


--
-- Name: saved_conversations Users can CRUD own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own conversations" ON public.saved_conversations USING ((auth.uid() = user_id));


--
-- Name: daily_intentions Users can CRUD own daily intentions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own daily intentions" ON public.daily_intentions USING ((auth.uid() = user_id));


--
-- Name: goal_activities Users can CRUD own goal activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own goal activities" ON public.goal_activities USING ((EXISTS ( SELECT 1
   FROM public.goals
  WHERE ((goals.id = goal_activities.goal_id) AND (goals.user_id = auth.uid())))));


--
-- Name: goal_collaborators Users can CRUD own goal collaborators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own goal collaborators" ON public.goal_collaborators USING ((EXISTS ( SELECT 1
   FROM public.goals
  WHERE ((goals.id = goal_collaborators.goal_id) AND (goals.user_id = auth.uid())))));


--
-- Name: goal_milestones Users can CRUD own goal milestones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own goal milestones" ON public.goal_milestones USING ((EXISTS ( SELECT 1
   FROM public.goals
  WHERE ((goals.id = goal_milestones.goal_id) AND (goals.user_id = auth.uid())))));


--
-- Name: goal_progress_history Users can CRUD own goal progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own goal progress" ON public.goal_progress_history USING ((EXISTS ( SELECT 1
   FROM public.goals
  WHERE ((goals.id = goal_progress_history.goal_id) AND (goals.user_id = auth.uid())))));


--
-- Name: goals Users can CRUD own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own goals" ON public.goals USING ((auth.uid() = user_id));


--
-- Name: habit_challenges Users can CRUD own habit challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own habit challenges" ON public.habit_challenges USING ((EXISTS ( SELECT 1
   FROM public.habits
  WHERE ((habits.id = habit_challenges.habit_id) AND (habits.user_id = auth.uid())))));


--
-- Name: habit_completions Users can CRUD own habit completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own habit completions" ON public.habit_completions USING ((EXISTS ( SELECT 1
   FROM public.habits
  WHERE ((habits.id = habit_completions.habit_id) AND (habits.user_id = auth.uid())))));


--
-- Name: habits Users can CRUD own habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own habits" ON public.habits USING ((auth.uid() = user_id));


--
-- Name: journal_entries Users can CRUD own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own journal entries" ON public.journal_entries USING ((auth.uid() = user_id));


--
-- Name: journal_tags Users can CRUD own journal tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own journal tags" ON public.journal_tags USING ((auth.uid() = user_id));


--
-- Name: life_wheel_scores Users can CRUD own life wheel scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own life wheel scores" ON public.life_wheel_scores USING ((auth.uid() = user_id));


--
-- Name: life_milestones Users can CRUD own milestones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own milestones" ON public.life_milestones USING ((auth.uid() = user_id));


--
-- Name: note_tags Users can CRUD own note tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own note tags" ON public.note_tags USING ((auth.uid() = user_id));


--
-- Name: notes Users can CRUD own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own notes" ON public.notes USING ((auth.uid() = user_id));


--
-- Name: pomodoro_sessions Users can CRUD own pomodoro sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own pomodoro sessions" ON public.pomodoro_sessions USING ((auth.uid() = user_id));


--
-- Name: life_role_goals Users can CRUD own role goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own role goals" ON public.life_role_goals USING ((EXISTS ( SELECT 1
   FROM public.life_roles
  WHERE ((life_roles.id = life_role_goals.role_id) AND (life_roles.user_id = auth.uid())))));


--
-- Name: life_roles Users can CRUD own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own roles" ON public.life_roles USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can CRUD own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own settings" ON public.user_settings USING ((auth.uid() = user_id));


--
-- Name: subtasks Users can CRUD own subtasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own subtasks" ON public.subtasks USING ((EXISTS ( SELECT 1
   FROM public.tasks
  WHERE ((tasks.id = subtasks.task_id) AND (tasks.user_id = auth.uid())))));


--
-- Name: task_tags Users can CRUD own task tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own task tags" ON public.task_tags USING ((auth.uid() = user_id));


--
-- Name: tasks Users can CRUD own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own tasks" ON public.tasks USING ((auth.uid() = user_id));


--
-- Name: personal_traits Users can CRUD own traits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own traits" ON public.personal_traits USING ((auth.uid() = user_id));


--
-- Name: personal_values Users can CRUD own values; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own values" ON public.personal_values USING ((auth.uid() = user_id));


--
-- Name: goal_vision_items Users can CRUD own vision items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own vision items" ON public.goal_vision_items USING ((EXISTS ( SELECT 1
   FROM public.goals
  WHERE ((goals.id = goal_vision_items.goal_id) AND (goals.user_id = auth.uid())))));


--
-- Name: life_visions Users can CRUD own visions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own visions" ON public.life_visions USING ((auth.uid() = user_id));


--
-- Name: weekly_reviews Users can CRUD own weekly reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own weekly reviews" ON public.weekly_reviews USING ((auth.uid() = user_id));


--
-- Name: workspaces Users can create workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK ((owner_id = auth.uid()));


--
-- Name: user_plugin_settings Users can manage own plugin settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own plugin settings" ON public.user_plugin_settings USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: admin_ai_models Users can view active AI models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active AI models" ON public.admin_ai_models FOR SELECT USING ((is_active = true));


--
-- Name: admin_ai_prompts Users can view active AI prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active AI prompts" ON public.admin_ai_prompts FOR SELECT USING ((is_active = true));


--
-- Name: plugin_hooks Users can view active hooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active hooks" ON public.plugin_hooks FOR SELECT USING ((is_active = true));


--
-- Name: admin_languages Users can view active languages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active languages" ON public.admin_languages FOR SELECT USING ((is_active = true));


--
-- Name: admin_plugins Users can view active plugins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active plugins" ON public.admin_plugins FOR SELECT USING ((is_active = true));


--
-- Name: admin_templates Users can view active templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active templates" ON public.admin_templates FOR SELECT USING ((is_active = true));


--
-- Name: admin_themes Users can view active themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active themes" ON public.admin_themes FOR SELECT USING ((is_active = true));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_subscriptions Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workspaces Users can view their workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their workspaces" ON public.workspaces FOR SELECT USING (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.workspace_members
  WHERE ((workspace_members.workspace_id = workspaces.id) AND (workspace_members.user_id = auth.uid()) AND (workspace_members.status = 'active'::text))))));


--
-- Name: workspace_members Users can view workspace members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspace members" ON public.workspace_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.workspace_members wm
  WHERE ((wm.workspace_id = workspace_members.workspace_id) AND (wm.user_id = auth.uid()) AND (wm.status = 'active'::text)))));


--
-- Name: workspace_invitations Workspace admins can manage invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Workspace admins can manage invitations" ON public.workspace_invitations USING ((EXISTS ( SELECT 1
   FROM public.workspace_members wm
  WHERE ((wm.workspace_id = workspace_invitations.workspace_id) AND (wm.user_id = auth.uid()) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text])) AND (wm.status = 'active'::text)))));


--
-- Name: workspace_members Workspace admins can manage members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Workspace admins can manage members" ON public.workspace_members USING ((EXISTS ( SELECT 1
   FROM public.workspace_members wm
  WHERE ((wm.workspace_id = workspace_members.workspace_id) AND (wm.user_id = auth.uid()) AND (wm.role = ANY (ARRAY['owner'::text, 'admin'::text])) AND (wm.status = 'active'::text)))));


--
-- Name: admin_ai_models; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_ai_models ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_ai_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_ai_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_languages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_languages ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_plugins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_plugins ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_themes ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_intentions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_intentions ENABLE ROW LEVEL SECURITY;

--
-- Name: email_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: goal_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goal_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: goal_collaborators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goal_collaborators ENABLE ROW LEVEL SECURITY;

--
-- Name: goal_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: goal_progress_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;

--
-- Name: goal_vision_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goal_vision_items ENABLE ROW LEVEL SECURITY;

--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_competitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_competitions ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: habits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: life_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.life_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: life_role_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.life_role_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: life_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.life_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: life_visions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.life_visions ENABLE ROW LEVEL SECURITY;

--
-- Name: life_wheel_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.life_wheel_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: note_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_traits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personal_traits ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personal_values ENABLE ROW LEVEL SECURITY;

--
-- Name: plugin_hooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plugin_hooks ENABLE ROW LEVEL SECURITY;

--
-- Name: pomodoro_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: subtasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

--
-- Name: system_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: task_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_plugin_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_plugin_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: workspace_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: workspace_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

--
-- Name: workspaces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;