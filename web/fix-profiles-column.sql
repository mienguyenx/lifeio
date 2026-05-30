-- =====================================================
-- FIX PROFILES COLUMN MISMATCH
-- =====================================================
-- Bảng profiles có cột 'full_name' nhưng function đang dùng 'name'
-- Sửa function để dùng đúng cột

-- Option 1: Thêm cột 'name' nếu chưa có
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Option 2: Sửa function để dùng 'full_name' thay vì 'name'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Thử insert vào profiles với error handling
  BEGIN
    -- Kiểm tra xem cột nào tồn tại
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'profiles' 
               AND column_name = 'full_name') THEN
      -- Dùng full_name nếu có
      INSERT INTO public.profiles (id, email, full_name)
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
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    ELSE
      -- Dùng name nếu không có full_name
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
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error nhưng không fail trigger
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    -- Vẫn return NEW để không block user creation
  END;
  
  RETURN NEW;
END;
$$;

-- Đồng bộ dữ liệu: copy full_name sang name nếu có cả 2 cột
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'profiles' 
             AND column_name = 'full_name')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'name') THEN
    UPDATE public.profiles 
    SET name = COALESCE(full_name, name)
    WHERE name IS NULL AND full_name IS NOT NULL;
  END IF;
END $$;

