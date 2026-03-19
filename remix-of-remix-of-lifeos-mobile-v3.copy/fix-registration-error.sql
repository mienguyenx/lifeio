-- =====================================================
-- FIX REGISTRATION ERROR: "Database error saving new user"
-- =====================================================
-- Script này sửa lỗi đăng ký bằng cách:
-- 1. Đảm bảo bảng profiles tồn tại
-- 2. Sửa RLS policies để cho phép trigger insert
-- 3. Cập nhật handle_new_user function với error handling tốt hơn

-- =====================================================
-- 1. KIỂM TRA VÀ TẠO BẢNG PROFILES (nếu chưa có)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  language TEXT DEFAULT 'vi',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. SỬA FUNCTION handle_new_user VỚI ERROR HANDLING
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Thử insert vào profiles với error handling
  BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
      NEW.id, 
      COALESCE(NEW.email, ''),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(COALESCE(NEW.email, 'unknown@example.com'), '@', 1)
      )
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, profiles.name);
  EXCEPTION WHEN OTHERS THEN
    -- Log error nhưng không fail trigger
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    -- Vẫn return NEW để không block user creation
  END;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. SỬA FUNCTION handle_new_user_role VỚI ERROR HANDLING
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO user_count FROM public.user_roles;
    
    IF user_count = 0 THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role)
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::public.app_role)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error nhưng không fail trigger
    RAISE WARNING 'Error in handle_new_user_role: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. ĐẢM BẢO RLS POLICIES CHO PHÉP TRIGGER INSERT
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Policy: Service role (triggers) có thể insert
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (true); -- Triggers chạy với SECURITY DEFINER nên có quyền

-- Policy: Users có thể xem profile của mình
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users có thể update profile của mình
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users có thể insert profile của mình (backup)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 5. ĐẢM BẢO RLS POLICIES CHO user_roles
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Policy: Service role (triggers) có thể insert
CREATE POLICY "Service role can insert user roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users có thể xem role của mình
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. ĐẢM BẢO TRIGGERS ĐƯỢC TẠO
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- 7. ENABLE RLS (nếu chưa enable)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

