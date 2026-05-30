-- Migration: Add Monthly Reviews, Yearly Plannings, Yearly Reviews tables
-- Date: 2026-05-07

-- ==================== MONTHLY REVIEWS ====================
CREATE TABLE IF NOT EXISTS public.monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'YYYY-MM' format
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

ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own monthly reviews"
  ON public.monthly_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_monthly_reviews_user_month ON public.monthly_reviews(user_id, month);

-- ==================== YEARLY PLANNINGS ====================
CREATE TABLE IF NOT EXISTS public.yearly_plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.yearly_plannings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own yearly plannings"
  ON public.yearly_plannings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_yearly_plannings_user_year ON public.yearly_plannings(user_id, year);

-- ==================== YEARLY REVIEWS ====================
CREATE TABLE IF NOT EXISTS public.yearly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.yearly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own yearly reviews"
  ON public.yearly_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_yearly_reviews_user_year ON public.yearly_reviews(user_id, year);
