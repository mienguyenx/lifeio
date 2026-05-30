-- =====================================================
-- Verify Module Area tables exist + row counts (nhanh)
-- =====================================================

-- 1) Liệt kê các bảng module area đang có trong schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'personal_values',
    'personal_traits',
    'life_visions',
    'life_roles',
    'life_milestones',
    'life_role_goals',
    'personal_values_history',
    'personal_traits_history',
    'life_visions_history',
    'life_roles_history',
    'life_milestones_history'
  )
ORDER BY table_name;

-- 2) Đếm số dòng (mỗi bảng 1 dòng) - bảng nào không tồn tại sẽ không hiện
SELECT 'personal_values' AS table_name, COUNT(*)::bigint AS rows FROM public.personal_values
UNION ALL SELECT 'personal_traits', COUNT(*)::bigint FROM public.personal_traits
UNION ALL SELECT 'life_visions', COUNT(*)::bigint FROM public.life_visions
UNION ALL SELECT 'life_roles', COUNT(*)::bigint FROM public.life_roles
UNION ALL SELECT 'life_milestones', COUNT(*)::bigint FROM public.life_milestones
UNION ALL SELECT 'life_role_goals', COUNT(*)::bigint FROM public.life_role_goals
UNION ALL SELECT 'personal_values_history', COUNT(*)::bigint FROM public.personal_values_history
UNION ALL SELECT 'personal_traits_history', COUNT(*)::bigint FROM public.personal_traits_history
UNION ALL SELECT 'life_visions_history', COUNT(*)::bigint FROM public.life_visions_history
UNION ALL SELECT 'life_roles_history', COUNT(*)::bigint FROM public.life_roles_history
UNION ALL SELECT 'life_milestones_history', COUNT(*)::bigint FROM public.life_milestones_history
ORDER BY table_name;


