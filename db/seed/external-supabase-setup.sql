-- =====================================================
-- EXTERNAL SUPABASE SETUP SCRIPT
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.life_area AS ENUM ('health', 'relationships', 'career', 'finance', 'personal', 'fun', 'environment', 'spirituality', 'learning', 'contribution');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'deferred', 'done');
CREATE TYPE public.goal_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE public.habit_frequency AS ENUM ('daily', 'weekly', 'custom');
CREATE TYPE public.challenge_status AS ENUM ('active', 'completed', 'failed');
CREATE TYPE public.challenge_type AS ENUM ('21-day', '30-day', '66-day');
CREATE TYPE public.collaborator_role AS ENUM ('viewer', 'editor');
CREATE TYPE public.pomodoro_phase AS ENUM ('work', 'break', 'long_break');
CREATE TYPE public.recurring_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE public.trait_type AS ENUM ('strength', 'weakness');
CREATE TYPE public.vision_timeframe AS ENUM ('1-year', '5-year', '10-year', 'lifetime');

-- 2. CREATE TABLES
-- =====================================================

-- Profiles table
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

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- User settings table
CREATE TABLE public.user_settings (
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

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area life_area NOT NULL,
  target_date DATE,
  progress INTEGER DEFAULT 0,
  priority task_priority DEFAULT 'medium',
  status goal_status DEFAULT 'active',
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

-- Goal milestones
CREATE TABLE public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  task_id UUID
);

-- Goal activities
CREATE TABLE public.goal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goal progress history
CREATE TABLE public.goal_progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goal collaborators
CREATE TABLE public.goal_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role collaborator_role DEFAULT 'viewer',
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- Goal vision items
CREATE TABLE public.goal_vision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area life_area,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'todo',
  due_date DATE,
  position INTEGER,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES public.goal_milestones(id) ON DELETE SET NULL,
  tags TEXT[],
  estimated_pomodoros INTEGER,
  completed_pomodoros INTEGER DEFAULT 0,
  recurring_frequency recurring_frequency,
  recurring_interval INTEGER,
  recurring_week_days INTEGER[],
  recurring_end_date DATE,
  reminder_minutes INTEGER,
  last_reminded TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Subtasks
CREATE TABLE public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- Task tags
CREATE TABLE public.task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  area life_area NOT NULL,
  icon TEXT,
  color TEXT,
  frequency habit_frequency DEFAULT 'daily',
  custom_days INTEGER[],
  target_days INTEGER,
  target_per_day INTEGER DEFAULT 1,
  target_unit TEXT,
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  completed_dates TEXT[],
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Habit completions
CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER DEFAULT 1,
  completion_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habit challenges
CREATE TABLE public.habit_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  challenge_type challenge_type NOT NULL,
  status challenge_status DEFAULT 'active',
  start_date DATE NOT NULL,
  completed_days INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ
);

-- Habit competitions
CREATE TABLE public.habit_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  habit_ids UUID[],
  start_date DATE NOT NULL,
  duration_days INTEGER DEFAULT 30,
  target_rate INTEGER DEFAULT 90,
  status challenge_status DEFAULT 'active',
  winner_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER,
  energy INTEGER,
  gratitude TEXT[],
  tags TEXT[],
  areas life_area[],
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal tags
CREATE TABLE public.journal_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  area life_area,
  color TEXT,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Note tags
CREATE TABLE public.note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Daily intentions
CREATE TABLE public.daily_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  intention TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Life wheel scores
CREATE TABLE public.life_wheel_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly reviews
CREATE TABLE public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  highlight TEXT,
  lowlight TEXT,
  wins TEXT[],
  challenges TEXT[],
  lessons_learned TEXT[],
  gratitude TEXT[],
  next_week_focus TEXT[],
  overall_rating INTEGER,
  area_ratings JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Personal values
CREATE TABLE public.personal_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Personal traits
CREATE TABLE public.personal_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trait_type trait_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Life visions
CREATE TABLE public.life_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  timeframe vision_timeframe,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Life roles
CREATE TABLE public.life_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Life role goals
CREATE TABLE public.life_role_goals (
  role_id UUID NOT NULL REFERENCES public.life_roles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, goal_id)
);

-- Life milestones
CREATE TABLE public.life_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  area life_area,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pomodoro sessions
CREATE TABLE public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  phase pomodoro_phase NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved conversations
CREATE TABLE public.saved_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for chat_messages.conversation_id
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.saved_conversations(id) ON DELETE SET NULL;

-- 3. CREATE FUNCTIONS
-- =====================================================

-- Has role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
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

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
  );
  RETURN NEW;
END;
$$;

-- Handle new user role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for new user role
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 5. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_vision_items ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_conversations ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- User settings policies
CREATE POLICY "Users can CRUD own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can CRUD own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public goals are viewable" ON public.goals FOR SELECT USING (is_public = true);

-- Goal related tables policies
CREATE POLICY "Users can CRUD own goal milestones" ON public.goal_milestones FOR ALL 
  USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own goal activities" ON public.goal_activities FOR ALL 
  USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_activities.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own goal progress" ON public.goal_progress_history FOR ALL 
  USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_progress_history.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own goal collaborators" ON public.goal_collaborators FOR ALL 
  USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_collaborators.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own vision items" ON public.goal_vision_items FOR ALL 
  USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_vision_items.goal_id AND goals.user_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Users can CRUD own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own subtasks" ON public.subtasks FOR ALL 
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own task tags" ON public.task_tags FOR ALL USING (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can CRUD own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own habit completions" ON public.habit_completions FOR ALL 
  USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own habit challenges" ON public.habit_challenges FOR ALL 
  USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_challenges.habit_id AND habits.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own competitions" ON public.habit_competitions FOR ALL USING (auth.uid() = user_id);

-- Journal policies
CREATE POLICY "Users can CRUD own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own journal tags" ON public.journal_tags FOR ALL USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can CRUD own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own note tags" ON public.note_tags FOR ALL USING (auth.uid() = user_id);

-- Daily intentions policies
CREATE POLICY "Users can CRUD own daily intentions" ON public.daily_intentions FOR ALL USING (auth.uid() = user_id);

-- Life wheel policies
CREATE POLICY "Users can CRUD own life wheel scores" ON public.life_wheel_scores FOR ALL USING (auth.uid() = user_id);

-- Weekly reviews policies
CREATE POLICY "Users can CRUD own weekly reviews" ON public.weekly_reviews FOR ALL USING (auth.uid() = user_id);

-- Personal values/traits policies
CREATE POLICY "Users can CRUD own values" ON public.personal_values FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own traits" ON public.personal_traits FOR ALL USING (auth.uid() = user_id);

-- Life visions/roles policies
CREATE POLICY "Users can CRUD own visions" ON public.life_visions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own roles" ON public.life_roles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own role goals" ON public.life_role_goals FOR ALL 
  USING (EXISTS (SELECT 1 FROM life_roles WHERE life_roles.id = life_role_goals.role_id AND life_roles.user_id = auth.uid()));
CREATE POLICY "Users can CRUD own milestones" ON public.life_milestones FOR ALL USING (auth.uid() = user_id);

-- Pomodoro policies
CREATE POLICY "Users can CRUD own pomodoro sessions" ON public.pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Users can CRUD own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own conversations" ON public.saved_conversations FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
