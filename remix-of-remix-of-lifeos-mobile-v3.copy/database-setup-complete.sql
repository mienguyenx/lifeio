-- =====================================================
-- LIFEOS - COMPLETE DATABASE SETUP FOR LOCAL SUPABASE
-- Chạy script này trong Supabase Studio SQL Editor hoặc psql
-- Version: 1.0 - For Local Supabase
-- =====================================================
-- 
-- Script này tạo đầy đủ database schema cho LifeOS:
-- ✅ 50+ tables
-- ✅ 12 enums
-- ✅ Security functions
-- ✅ Triggers
-- ✅ RLS policies
-- ✅ Sample data
--
-- CÁCH CHẠY:
-- 1. Mở Supabase Studio: http://localhost:54323
-- 2. Vào tab SQL Editor
-- 3. Copy và paste toàn bộ script này
-- 4. Click Run
--
-- HOẶC dùng psql:
-- docker exec -i supabase_db_Supabase psql -U postgres -d postgres < database-setup-complete.sql
-- =====================================================

-- =====================================================
-- PHẦN 1: CREATE ENUMS (An toàn - bỏ qua nếu đã có)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.life_area AS ENUM ('health', 'relationships', 'career', 'finance', 'personal', 'fun', 'environment', 'spirituality', 'learning', 'contribution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'deferred', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_status AS ENUM ('active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.habit_frequency AS ENUM ('daily', 'weekly', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_status AS ENUM ('active', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_type AS ENUM ('21-day', '30-day', '66-day');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collaborator_role AS ENUM ('viewer', 'editor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pomodoro_phase AS ENUM ('work', 'break', 'long_break');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.recurring_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.trait_type AS ENUM ('strength', 'weakness');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vision_timeframe AS ENUM ('1-year', '5-year', '10-year', 'lifetime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- PHẦN 2: CORE USER TABLES
-- =====================================================

-- Profiles (cập nhật nếu đã có, tạo mới nếu chưa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      name TEXT,
      avatar_url TEXT,
      bio TEXT,
      phone TEXT,
      birthday DATE,
      timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
      life_purpose TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- Thêm các cột còn thiếu nếu table đã tồn tại
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_purpose TEXT;
    -- Đổi tên cột nếu cần
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles RENAME COLUMN full_name TO name;
      END IF;
    END $$;
  END IF;
END $$;

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pomodoro_work_duration INTEGER DEFAULT 25,
  pomodoro_break_duration INTEGER DEFAULT 5,
  pomodoro_long_break_duration INTEGER DEFAULT 15,
  pomodoro_sessions_before_long_break INTEGER DEFAULT 4,
  trash_enabled BOOLEAN DEFAULT true,
  trash_auto_cleanup_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PHẦN 3: GOALS & RELATED TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area public.life_area NOT NULL,
  target_date DATE,
  progress INTEGER DEFAULT 0,
  priority public.task_priority DEFAULT 'medium',
  status public.goal_status DEFAULT 'active',
  is_focused BOOLEAN DEFAULT false,
  focused_at TIMESTAMPTZ,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 7,
  last_reminded TIMESTAMPTZ,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT,
  push_enabled BOOLEAN DEFAULT false,
  push_deadline BOOLEAN DEFAULT false,
  push_weekly BOOLEAN DEFAULT false,
  dependencies UUID[],
  dependents UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  task_id UUID
);

CREATE TABLE IF NOT EXISTS public.goal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role public.collaborator_role DEFAULT 'viewer',
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.goal_vision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL,
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PHẦN 4: TASKS & SUBTASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area public.life_area,
  priority public.task_priority DEFAULT 'medium',
  status public.task_status DEFAULT 'todo',
  due_date DATE,
  position INTEGER,
  tags TEXT[],
  goal_id UUID REFERENCES public.goals(id),
  milestone_id UUID,
  estimated_pomodoros INTEGER,
  completed_pomodoros INTEGER DEFAULT 0,
  recurring_frequency public.recurring_frequency,
  recurring_interval INTEGER,
  recurring_week_days INTEGER[],
  recurring_end_date DATE,
  reminder_minutes INTEGER, -- Minutes before deadline to remind
  reminder_time TIME, -- Specific time (HH:mm) to remind user
  last_reminded TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- =====================================================
-- PHẦN 5: HABITS & RELATED
-- =====================================================

CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  area public.life_area NOT NULL,
  frequency public.habit_frequency DEFAULT 'daily',
  custom_days INTEGER[],
  target_days INTEGER,
  target_per_day INTEGER DEFAULT 1,
  target_unit TEXT,
  icon TEXT,
  color TEXT,
  goal_id UUID REFERENCES public.goals(id),
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  completed_dates TEXT[],
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER DEFAULT 1,
  completion_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habit_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  challenge_type public.challenge_type NOT NULL,
  start_date DATE NOT NULL,
  status public.challenge_status DEFAULT 'active',
  completed_days INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.habit_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  habit_ids UUID[],
  start_date DATE NOT NULL,
  duration_days INTEGER DEFAULT 30,
  target_rate INTEGER DEFAULT 90,
  status public.challenge_status DEFAULT 'active',
  winner_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PHẦN 6: JOURNAL & NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER,
  energy INTEGER,
  gratitude TEXT[],
  tags TEXT[],
  areas public.life_area[],
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  area public.life_area,
  tags TEXT[],
  color TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- =====================================================
-- PHẦN 7: LIFE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  intention TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.life_wheel_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  overall_rating INTEGER,
  highlight TEXT,
  lowlight TEXT,
  wins TEXT[],
  challenges TEXT[],
  lessons_learned TEXT[],
  next_week_focus TEXT[],
  gratitude TEXT[],
  area_ratings JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trait_type public.trait_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.life_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  timeframe public.vision_timeframe,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.life_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.life_role_goals (
  role_id UUID NOT NULL REFERENCES public.life_roles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, goal_id)
);

CREATE TABLE IF NOT EXISTS public.life_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  area public.life_area,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PHẦN 8: POMODORO & CHAT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id),
  phase public.pomodoro_phase NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.saved_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PHẦN 9: ADMIN & SUBSCRIPTION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  allowed_user_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PHẦN 10: WORKSPACE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PHẦN 11: ADMIN SETTINGS & LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  template_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_by UUID,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PHẦN 12: AI MODELS & PROMPTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'lovable',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  max_tokens INTEGER DEFAULT 4096,
  temperature NUMERIC DEFAULT 0.7,
  capabilities TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prompt_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  variables TEXT[] DEFAULT '{}'::text[],
  model_id UUID REFERENCES public.admin_ai_models(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PHẦN 13: TEMPLATES, THEMES, LANGUAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  flag TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  translation_progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  namespace TEXT NOT NULL DEFAULT 'common',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(language_code, namespace, key)
);

-- =====================================================
-- PHẦN 14: PLUGINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  author TEXT,
  icon TEXT DEFAULT 'puzzle',
  category TEXT DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  hooks TEXT[] DEFAULT '{}'::text[],
  permissions TEXT[] DEFAULT '{}'::text[],
  sidebar_item BOOLEAN DEFAULT false,
  dashboard_widget BOOLEAN DEFAULT false,
  admin_page BOOLEAN DEFAULT false,
  entry_point TEXT,
  repository_url TEXT,
  documentation_url TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES public.admin_plugins(id) ON DELETE CASCADE,
  hook_name TEXT NOT NULL,
  handler_key TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_plugin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plugin_id UUID NOT NULL REFERENCES public.admin_plugins(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

-- =====================================================
-- PHẦN 15: SECURITY FUNCTIONS
-- =====================================================

-- Function kiểm tra role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function lấy role của user
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function assign role cho user mới
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- PHẦN 16: TRIGGERS
-- =====================================================

-- Trigger tạo profile khi user đăng ký
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger assign role khi user đăng ký  
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- PHẦN 17: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_vision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_wheel_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_role_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plugin_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHẦN 18: RLS POLICIES - USER DATA
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- User Roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- User Settings
DROP POLICY IF EXISTS "Users can CRUD own settings" ON public.user_settings;
CREATE POLICY "Users can CRUD own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "Users can CRUD own goals" ON public.goals;
DROP POLICY IF EXISTS "Public goals are viewable" ON public.goals;
CREATE POLICY "Users can CRUD own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public goals are viewable" ON public.goals FOR SELECT USING (is_public = true);

-- Goal related tables
DROP POLICY IF EXISTS "Users can CRUD own goal milestones" ON public.goal_milestones;
CREATE POLICY "Users can CRUD own goal milestones" ON public.goal_milestones FOR ALL
USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own goal activities" ON public.goal_activities;
CREATE POLICY "Users can CRUD own goal activities" ON public.goal_activities FOR ALL
USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_activities.goal_id AND goals.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own goal collaborators" ON public.goal_collaborators;
CREATE POLICY "Users can CRUD own goal collaborators" ON public.goal_collaborators FOR ALL
USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_collaborators.goal_id AND goals.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own vision items" ON public.goal_vision_items;
CREATE POLICY "Users can CRUD own vision items" ON public.goal_vision_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_vision_items.goal_id AND goals.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own goal progress" ON public.goal_progress_history;
CREATE POLICY "Users can CRUD own goal progress" ON public.goal_progress_history FOR ALL
USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_progress_history.goal_id AND goals.user_id = auth.uid()));

-- Tasks
DROP POLICY IF EXISTS "Users can CRUD own tasks" ON public.tasks;
CREATE POLICY "Users can CRUD own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own subtasks" ON public.subtasks;
CREATE POLICY "Users can CRUD own subtasks" ON public.subtasks FOR ALL
USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own task tags" ON public.task_tags;
CREATE POLICY "Users can CRUD own task tags" ON public.task_tags FOR ALL USING (auth.uid() = user_id);

-- Habits
DROP POLICY IF EXISTS "Users can CRUD own habits" ON public.habits;
CREATE POLICY "Users can CRUD own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own habit completions" ON public.habit_completions;
CREATE POLICY "Users can CRUD own habit completions" ON public.habit_completions FOR ALL
USING (EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own habit challenges" ON public.habit_challenges;
CREATE POLICY "Users can CRUD own habit challenges" ON public.habit_challenges FOR ALL
USING (EXISTS (SELECT 1 FROM public.habits WHERE habits.id = habit_challenges.habit_id AND habits.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own competitions" ON public.habit_competitions;
CREATE POLICY "Users can CRUD own competitions" ON public.habit_competitions FOR ALL USING (auth.uid() = user_id);

-- Journal & Notes
DROP POLICY IF EXISTS "Users can CRUD own journal entries" ON public.journal_entries;
CREATE POLICY "Users can CRUD own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own journal tags" ON public.journal_tags;
CREATE POLICY "Users can CRUD own journal tags" ON public.journal_tags FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own notes" ON public.notes;
CREATE POLICY "Users can CRUD own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own note tags" ON public.note_tags;
CREATE POLICY "Users can CRUD own note tags" ON public.note_tags FOR ALL USING (auth.uid() = user_id);

-- Life Management
DROP POLICY IF EXISTS "Users can CRUD own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can CRUD own daily intentions" ON public.daily_intentions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own life wheel scores" ON public.life_wheel_scores;
CREATE POLICY "Users can CRUD own life wheel scores" ON public.life_wheel_scores FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can CRUD own weekly reviews" ON public.weekly_reviews FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own values" ON public.personal_values;
CREATE POLICY "Users can CRUD own values" ON public.personal_values FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own traits" ON public.personal_traits;
CREATE POLICY "Users can CRUD own traits" ON public.personal_traits FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own visions" ON public.life_visions;
CREATE POLICY "Users can CRUD own visions" ON public.life_visions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own roles" ON public.life_roles;
CREATE POLICY "Users can CRUD own roles" ON public.life_roles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own role goals" ON public.life_role_goals;
CREATE POLICY "Users can CRUD own role goals" ON public.life_role_goals FOR ALL
USING (EXISTS (SELECT 1 FROM public.life_roles WHERE life_roles.id = life_role_goals.role_id AND life_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can CRUD own milestones" ON public.life_milestones;
CREATE POLICY "Users can CRUD own milestones" ON public.life_milestones FOR ALL USING (auth.uid() = user_id);

-- Pomodoro & Chat
DROP POLICY IF EXISTS "Users can CRUD own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can CRUD own pomodoro sessions" ON public.pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own conversations" ON public.saved_conversations;
CREATE POLICY "Users can CRUD own conversations" ON public.saved_conversations FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own chat messages" ON public.chat_messages;
CREATE POLICY "Users can CRUD own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PHẦN 19: RLS POLICIES - ADMIN TABLES
-- =====================================================

-- Subscription Plans
DROP POLICY IF EXISTS "Everyone can view active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- User Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Workspaces
DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can manage workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
CREATE POLICY "Users can view own workspaces" ON public.workspaces FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners can manage workspaces" ON public.workspaces FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins can view all workspaces" ON public.workspaces FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Workspace Members
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owners can manage members" ON public.workspace_members FOR ALL
USING (EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

-- Workspace Invitations
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.workspace_invitations;
CREATE POLICY "Owners can manage invitations" ON public.workspace_invitations FOR ALL
USING (EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

-- Admin Settings
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
CREATE POLICY "Admins can view settings" ON public.admin_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert settings" ON public.admin_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- System & Email Logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.system_logs;
CREATE POLICY "Admins can view logs" ON public.system_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert logs" ON public.system_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;
CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Feature Flags
DROP POLICY IF EXISTS "Admins can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can delete feature flags" ON public.feature_flags;
CREATE POLICY "Admins can view feature flags" ON public.feature_flags FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert feature flags" ON public.feature_flags FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update feature flags" ON public.feature_flags FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete feature flags" ON public.feature_flags FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- AI Models & Prompts
DROP POLICY IF EXISTS "Users can view active AI models" ON public.admin_ai_models;
DROP POLICY IF EXISTS "Admins can manage AI models" ON public.admin_ai_models;
CREATE POLICY "Users can view active AI models" ON public.admin_ai_models FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage AI models" ON public.admin_ai_models FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view active AI prompts" ON public.admin_ai_prompts;
DROP POLICY IF EXISTS "Admins can manage AI prompts" ON public.admin_ai_prompts;
CREATE POLICY "Users can view active AI prompts" ON public.admin_ai_prompts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage AI prompts" ON public.admin_ai_prompts FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Templates, Themes, Languages
DROP POLICY IF EXISTS "Users can view active templates" ON public.admin_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.admin_templates;
CREATE POLICY "Users can view active templates" ON public.admin_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON public.admin_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view active themes" ON public.admin_themes;
DROP POLICY IF EXISTS "Admins can manage themes" ON public.admin_themes;
CREATE POLICY "Users can view active themes" ON public.admin_themes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage themes" ON public.admin_themes FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view active languages" ON public.admin_languages;
DROP POLICY IF EXISTS "Admins can manage languages" ON public.admin_languages;
CREATE POLICY "Users can view active languages" ON public.admin_languages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage languages" ON public.admin_languages FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Translations
DROP POLICY IF EXISTS "Everyone can view translations" ON public.admin_translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.admin_translations;
CREATE POLICY "Everyone can view translations" ON public.admin_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage translations" ON public.admin_translations FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Plugins
DROP POLICY IF EXISTS "Users can view active plugins" ON public.admin_plugins;
DROP POLICY IF EXISTS "Admins can manage plugins" ON public.admin_plugins;
CREATE POLICY "Users can view active plugins" ON public.admin_plugins FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plugins" ON public.admin_plugins FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view active hooks" ON public.plugin_hooks;
DROP POLICY IF EXISTS "Admins can manage plugin hooks" ON public.plugin_hooks;
CREATE POLICY "Users can view active hooks" ON public.plugin_hooks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plugin hooks" ON public.plugin_hooks FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can manage own plugin settings" ON public.user_plugin_settings;
DROP POLICY IF EXISTS "Admins can view all plugin settings" ON public.user_plugin_settings;
CREATE POLICY "Users can manage own plugin settings" ON public.user_plugin_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all plugin settings" ON public.user_plugin_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =====================================================
-- PHẦN 20: SAMPLE DATA
-- =====================================================

-- Subscription Plans
INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, is_default, sort_order)
SELECT 'Free', 'free', 'Gói miễn phí cho người dùng mới', 0,
    '["5 mục tiêu", "10 thói quen", "Nhật ký cơ bản", "1 workspace"]'::jsonb,
    '{"goals": 5, "habits": 10, "workspaces": 1}'::jsonb,
    true, 0
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'free');

INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, sort_order)
SELECT 'Pro', 'pro', 'Gói Pro cho người dùng cá nhân', 9.99,
    '["Không giới hạn mục tiêu", "Không giới hạn thói quen", "AI Coach", "3 workspaces", "Xuất báo cáo"]'::jsonb,
    '{"goals": -1, "habits": -1, "workspaces": 3}'::jsonb,
    1
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'pro');

INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, sort_order)
SELECT 'Business', 'business', 'Gói dành cho đội nhóm', 29.99,
    '["Tất cả tính năng Pro", "10 workspaces", "Quản lý team", "API access", "Hỗ trợ ưu tiên"]'::jsonb,
    '{"goals": -1, "habits": -1, "workspaces": 10, "team_members": 25}'::jsonb,
    2
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'business');

-- AI Models
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_default, capabilities)
SELECT 'Gemini 2.5 Flash', 'google/gemini-2.5-flash', 'lovable', 'Model nhanh và cân bằng', true, 
    ARRAY['text', 'reasoning', 'multimodal']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'google/gemini-2.5-flash');

INSERT INTO public.admin_ai_models (name, model_id, provider, description, capabilities)
SELECT 'GPT-5 Mini', 'openai/gpt-5-mini', 'lovable', 'Model chi phí thấp, hiệu suất cao',
    ARRAY['text', 'reasoning', 'multimodal']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'openai/gpt-5-mini');

-- Languages
INSERT INTO public.admin_languages (code, name, native_name, flag, is_active, translation_progress)
SELECT 'vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.admin_languages WHERE code = 'vi');

INSERT INTO public.admin_languages (code, name, native_name, flag, is_active, translation_progress)
SELECT 'en', 'English', 'English', '🇺🇸', true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.admin_languages WHERE code = 'en');

-- Default Theme
INSERT INTO public.admin_themes (name, description, colors, is_active, is_default)
SELECT 'Default', 'Theme mặc định của hệ thống', 
    '{"primary": "222.2 47.4% 11.2%", "secondary": "210 40% 96.1%", "accent": "210 40% 96.1%"}'::jsonb,
    true, true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_themes WHERE name = 'Default');

-- =====================================================
-- HOÀN THÀNH!
-- =====================================================
-- Script đã tạo đầy đủ:
-- ✅ 50+ bảng dữ liệu
-- ✅ 12 enums
-- ✅ Security functions (has_role, get_user_role)
-- ✅ Triggers cho user mới
-- ✅ RLS policies cho tất cả bảng
-- ✅ Sample data mặc định
--
-- LƯU Ý:
-- - User đầu tiên đăng ký sẽ tự động được assign role 'admin'
-- - Các user sau sẽ được assign role 'user'
-- - Bạn có thể thay đổi role trong bảng user_roles
-- =====================================================

