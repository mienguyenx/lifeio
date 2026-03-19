-- =====================================================
-- FIX handle_new_user TO PROPERLY UPDATE NAME
-- =====================================================
-- Sửa function để cập nhật cả full_name và name từ metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Lấy tên từ metadata (ưu tiên full_name, sau đó name, cuối cùng là email prefix)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, 'unknown@example.com'), '@', 1)
  );
  
  -- Thử insert vào profiles với error handling
  BEGIN
    -- Kiểm tra xem cột nào tồn tại và cập nhật cả hai nếu có
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'profiles' 
               AND column_name = 'full_name') THEN
      -- Có full_name - cập nhật cả full_name và name (nếu có)
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'name') THEN
        -- Có cả hai cột - cập nhật cả hai
        INSERT INTO public.profiles (id, email, full_name, name)
        VALUES (NEW.id, COALESCE(NEW.email, ''), user_name, user_name)
        ON CONFLICT (id) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, profiles.email),
          full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
          name = COALESCE(EXCLUDED.name, profiles.name);
      ELSE
        -- Chỉ có full_name
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (NEW.id, COALESCE(NEW.email, ''), user_name)
        ON CONFLICT (id) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, profiles.email),
          full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
      END IF;
    ELSE
      -- Chỉ có name (không có full_name)
      INSERT INTO public.profiles (id, email, name)
      VALUES (NEW.id, COALESCE(NEW.email, ''), user_name)
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
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

-- Đồng bộ dữ liệu: copy full_name sang name nếu có cả 2 cột và name đang NULL
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
    WHERE (name IS NULL OR name = '') AND full_name IS NOT NULL AND full_name != '';
  END IF;
END $$;

