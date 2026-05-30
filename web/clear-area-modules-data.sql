-- =====================================================
-- Script xóa dữ liệu module area cho tất cả users
-- =====================================================
-- Script này sẽ xóa tất cả dữ liệu trong các bảng:
-- - personal_values
-- - life_roles
-- - life_visions
-- - personal_traits
-- - life_milestones
--
-- LƯU Ý: Script này sẽ XÓA VĨNH VIỄN tất cả dữ liệu module area
-- Hãy backup database trước khi chạy!
-- =====================================================

-- An toàn: nếu bảng không tồn tại thì bỏ qua (tránh lỗi 42P01)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_role_goals') THEN
    EXECUTE 'DELETE FROM public.life_role_goals';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_roles') THEN
    EXECUTE 'DELETE FROM public.life_roles';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_values') THEN
    EXECUTE 'DELETE FROM public.personal_values';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_visions') THEN
    EXECUTE 'DELETE FROM public.life_visions';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_traits') THEN
    EXECUTE 'DELETE FROM public.personal_traits';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='life_milestones') THEN
    EXECUTE 'DELETE FROM public.life_milestones';
  END IF;
END $$;

-- =====================================================
-- HOÀN THÀNH!
-- =====================================================
-- Tất cả dữ liệu module area đã được xóa
-- =====================================================

