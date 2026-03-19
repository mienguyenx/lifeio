-- =====================================================
-- Script kiểm tra và tạo các bảng Module Area nếu chưa có
-- =====================================================
-- Script này sẽ:
-- 1. Kiểm tra xem các bảng module area có tồn tại không
-- 2. Tạo các bảng nếu chưa có
-- 3. Tạo các enum types nếu chưa có
-- =====================================================

-- Tạo enum types nếu chưa có
DO $$ BEGIN
  CREATE TYPE public.trait_type AS ENUM ('strength', 'weakness');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vision_timeframe AS ENUM ('1-year', '5-year', '10-year', 'lifetime');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.life_area AS ENUM ('health', 'relationships', 'career', 'finance', 'personal', 'fun', 'environment', 'spirituality', 'learning', 'contribution');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tạo bảng personal_values nếu chưa có
CREATE TABLE IF NOT EXISTS public.personal_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng personal_traits nếu chưa có
CREATE TABLE IF NOT EXISTS public.personal_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trait_type public.trait_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng life_visions nếu chưa có
CREATE TABLE IF NOT EXISTS public.life_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  statement TEXT NOT NULL,
  timeframe public.vision_timeframe,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng life_roles nếu chưa có
CREATE TABLE IF NOT EXISTS public.life_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng life_milestones nếu chưa có
CREATE TABLE IF NOT EXISTS public.life_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  area public.life_area,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng life_role_goals nếu chưa có
CREATE TABLE IF NOT EXISTS public.life_role_goals (
  role_id UUID NOT NULL,
  goal_id UUID NOT NULL,
  PRIMARY KEY (role_id, goal_id)
);

-- Thêm foreign key constraints nếu chưa có
-- Kiểm tra và thêm FK cho personal_values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'personal_values_user_id_fkey' 
    AND table_name = 'personal_values'
  ) THEN
    -- Thử reference profiles trước
    BEGIN
      ALTER TABLE public.personal_values 
      ADD CONSTRAINT personal_values_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      -- Nếu không có profiles, thử reference auth.users
      BEGIN
        ALTER TABLE public.personal_values 
        ADD CONSTRAINT personal_values_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK for personal_values.user_id';
      END;
    END;
  END IF;
END $$;

-- Tương tự cho các bảng khác
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'personal_traits_user_id_fkey' 
    AND table_name = 'personal_traits'
  ) THEN
    BEGIN
      ALTER TABLE public.personal_traits 
      ADD CONSTRAINT personal_traits_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE public.personal_traits 
        ADD CONSTRAINT personal_traits_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK for personal_traits.user_id';
      END;
    END;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'life_visions_user_id_fkey' 
    AND table_name = 'life_visions'
  ) THEN
    BEGIN
      ALTER TABLE public.life_visions 
      ADD CONSTRAINT life_visions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE public.life_visions 
        ADD CONSTRAINT life_visions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK for life_visions.user_id';
      END;
    END;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'life_roles_user_id_fkey' 
    AND table_name = 'life_roles'
  ) THEN
    BEGIN
      ALTER TABLE public.life_roles 
      ADD CONSTRAINT life_roles_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE public.life_roles 
        ADD CONSTRAINT life_roles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK for life_roles.user_id';
      END;
    END;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'life_milestones_user_id_fkey' 
    AND table_name = 'life_milestones'
  ) THEN
    BEGIN
      ALTER TABLE public.life_milestones 
      ADD CONSTRAINT life_milestones_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        ALTER TABLE public.life_milestones 
        ADD CONSTRAINT life_milestones_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK for life_milestones.user_id';
      END;
    END;
  END IF;
END $$;

-- Thêm FK cho life_role_goals
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'life_role_goals_role_id_fkey' 
    AND table_name = 'life_role_goals'
  ) THEN
    ALTER TABLE public.life_role_goals 
    ADD CONSTRAINT life_role_goals_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES public.life_roles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'life_role_goals_goal_id_fkey' 
    AND table_name = 'life_role_goals'
  ) THEN
    -- Chỉ thêm nếu bảng goals tồn tại
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
      ALTER TABLE public.life_role_goals 
      ADD CONSTRAINT life_role_goals_goal_id_fkey 
      FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- =====================================================
-- HOÀN THÀNH!
-- =====================================================
-- Các bảng module area đã được kiểm tra và tạo nếu cần
-- Bây giờ bạn có thể chạy các script xóa dữ liệu hoặc tạo history tables
-- =====================================================

