-- =====================================================
-- Migration: Add Area Modules Tables
-- Date: 2025-01-22
-- Description: Add database tables for Health, Finance, Learning, and Relationships modules
-- =====================================================

-- Create enum types if not exists
DO $$ BEGIN
  CREATE TYPE public.health_log_type AS ENUM ('weight', 'sleep', 'water', 'exercise', 'mood', 'steps');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.book_status AS ENUM ('want_to_read', 'reading', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.relationship_type AS ENUM ('family', 'friend', 'colleague', 'mentor', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.interaction_type AS ENUM ('call', 'message', 'meeting', 'video_call', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- HEALTH MODULE
-- =====================================================

-- Health logs table
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type public.health_log_type NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for health_logs
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON public.health_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_date ON public.health_logs(date);
CREATE INDEX IF NOT EXISTS idx_health_logs_type ON public.health_logs(type);
CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON public.health_logs(user_id, date);

-- =====================================================
-- FINANCE MODULE
-- =====================================================

-- Finance transactions table
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type public.transaction_type NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for finance_transactions
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_id ON public.finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON public.finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON public.finance_transactions(category);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON public.finance_transactions(user_id, date);

-- =====================================================
-- LEARNING MODULE
-- =====================================================

-- Learning courses table
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  status public.course_status NOT NULL DEFAULT 'not_started',
  started_at DATE,
  completed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Learning books table
CREATE TABLE IF NOT EXISTS public.learning_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  total_pages INTEGER NOT NULL DEFAULT 0,
  current_page INTEGER NOT NULL DEFAULT 0,
  status public.book_status NOT NULL DEFAULT 'want_to_read',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for learning_courses
CREATE INDEX IF NOT EXISTS idx_learning_courses_user_id ON public.learning_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_courses_status ON public.learning_courses(status);
CREATE INDEX IF NOT EXISTS idx_learning_courses_category ON public.learning_courses(category);

-- Indexes for learning_books
CREATE INDEX IF NOT EXISTS idx_learning_books_user_id ON public.learning_books(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_books_status ON public.learning_books(status);

-- =====================================================
-- RELATIONSHIPS MODULE
-- =====================================================

-- Relationships contacts table
CREATE TABLE IF NOT EXISTS public.relationships_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship public.relationship_type NOT NULL,
  phone TEXT,
  email TEXT,
  birthday DATE,
  notes TEXT,
  importance INTEGER NOT NULL DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
  last_contact DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Relationships interactions table
CREATE TABLE IF NOT EXISTS public.relationships_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.relationships_contacts(id) ON DELETE CASCADE,
  type public.interaction_type NOT NULL,
  date DATE NOT NULL,
  duration INTEGER, -- in minutes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for relationships_contacts
CREATE INDEX IF NOT EXISTS idx_relationships_contacts_user_id ON public.relationships_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_contacts_relationship ON public.relationships_contacts(relationship);
CREATE INDEX IF NOT EXISTS idx_relationships_contacts_importance ON public.relationships_contacts(importance);

-- Indexes for relationships_interactions
CREATE INDEX IF NOT EXISTS idx_relationships_interactions_user_id ON public.relationships_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_interactions_contact_id ON public.relationships_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_relationships_interactions_date ON public.relationships_interactions(date);
CREATE INDEX IF NOT EXISTS idx_relationships_interactions_type ON public.relationships_interactions(type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships_interactions ENABLE ROW LEVEL SECURITY;

-- Health logs policies
CREATE POLICY "Users can view their own health logs"
  ON public.health_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health logs"
  ON public.health_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health logs"
  ON public.health_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health logs"
  ON public.health_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Finance transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.finance_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.finance_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.finance_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.finance_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Learning courses policies
CREATE POLICY "Users can view their own courses"
  ON public.learning_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses"
  ON public.learning_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON public.learning_courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON public.learning_courses FOR DELETE
  USING (auth.uid() = user_id);

-- Learning books policies
CREATE POLICY "Users can view their own books"
  ON public.learning_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books"
  ON public.learning_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON public.learning_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON public.learning_books FOR DELETE
  USING (auth.uid() = user_id);

-- Relationships contacts policies
CREATE POLICY "Users can view their own contacts"
  ON public.relationships_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON public.relationships_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.relationships_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.relationships_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Relationships interactions policies
CREATE POLICY "Users can view their own interactions"
  ON public.relationships_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.relationships_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON public.relationships_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON public.relationships_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_health_logs_updated_at
  BEFORE UPDATE ON public.health_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_courses_updated_at
  BEFORE UPDATE ON public.learning_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_books_updated_at
  BEFORE UPDATE ON public.learning_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relationships_contacts_updated_at
  BEFORE UPDATE ON public.relationships_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

