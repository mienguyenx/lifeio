-- =====================================================
-- Script xóa dữ liệu module area cho user cụ thể
-- =====================================================
-- Thay thế 'USER_ID_HERE' bằng ID của user cần xóa dữ liệu
-- =====================================================

-- An toàn: nếu bảng không tồn tại thì bỏ qua (tránh lỗi 42P01)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_role_goals')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_roles') THEN
    EXECUTE format(
      'DELETE FROM public.life_role_goals WHERE role_id IN (SELECT id FROM public.life_roles WHERE user_id = %L)',
      'USER_ID_HERE'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_roles') THEN
    EXECUTE format('DELETE FROM public.life_roles WHERE user_id = %L', 'USER_ID_HERE');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_values') THEN
    EXECUTE format('DELETE FROM public.personal_values WHERE user_id = %L', 'USER_ID_HERE');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_visions') THEN
    EXECUTE format('DELETE FROM public.life_visions WHERE user_id = %L', 'USER_ID_HERE');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_traits') THEN
    EXECUTE format('DELETE FROM public.personal_traits WHERE user_id = %L', 'USER_ID_HERE');
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_milestones') THEN
    EXECUTE format('DELETE FROM public.life_milestones WHERE user_id = %L', 'USER_ID_HERE');
  END IF;
END $$;

-- =====================================================
-- HOÀN THÀNH!
-- =====================================================
-- Dữ liệu module area của user đã được xóa
-- =====================================================

