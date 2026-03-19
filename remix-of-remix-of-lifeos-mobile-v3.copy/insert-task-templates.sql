-- =====================================================
-- INSERT TASK TEMPLATES - MẪU CHO TASKS
-- =====================================================
-- Script này thêm các templates mẫu cho tasks vào admin_templates
-- Templates này sẽ được load khi người dùng tạo task mới

SET client_encoding TO 'UTF8';

-- Xóa templates cũ nếu có (để tránh duplicate)
DELETE FROM public.admin_templates WHERE type = 'tasks';

-- =====================================================
-- TASK TEMPLATES - Công việc
-- =====================================================

-- 1. Viết báo cáo
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Viết báo cáo',
  'tasks',
  'Hoàn thành báo cáo công việc',
  '{
    "title": "Viết báo cáo",
    "description": "Hoàn thành báo cáo công việc",
    "area": "career",
    "priority": "high",
    "estimatedPomodoros": 4
  }'::jsonb,
  true,
  0
);

-- 2. Chuẩn bị họp
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Chuẩn bị họp',
  'tasks',
  'Chuẩn bị tài liệu và agenda cho cuộc họp',
  '{
    "title": "Chuẩn bị họp",
    "description": "Chuẩn bị tài liệu và agenda cho cuộc họp",
    "area": "career",
    "priority": "medium",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- 3. Xử lý email
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Xử lý email',
  'tasks',
  'Đọc và trả lời email quan trọng',
  '{
    "title": "Xử lý email",
    "description": "Đọc và trả lời email quan trọng",
    "area": "career",
    "priority": "low",
    "estimatedPomodoros": 1
  }'::jsonb,
  true,
  0
);

-- 4. Học online
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Học online',
  'tasks',
  'Hoàn thành bài học trực tuyến',
  '{
    "title": "Học online",
    "description": "Hoàn thành bài học trực tuyến",
    "area": "learning",
    "priority": "medium",
    "estimatedPomodoros": 3
  }'::jsonb,
  true,
  0
);

-- 5. Lên lịch tập gym
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Lên lịch tập gym',
  'tasks',
  'Lập kế hoạch tập luyện tuần này',
  '{
    "title": "Lên lịch tập gym",
    "description": "Lập kế hoạch tập luyện tuần này",
    "area": "health",
    "priority": "medium",
    "estimatedPomodoros": 1
  }'::jsonb,
  true,
  0
);

-- 6. Cập nhật ngân sách
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Cập nhật ngân sách',
  'tasks',
  'Review chi tiêu và cập nhật ngân sách',
  '{
    "title": "Cập nhật ngân sách",
    "description": "Review chi tiêu và cập nhật ngân sách",
    "area": "finance",
    "priority": "medium",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- 7. Gọi điện gia đình
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Gọi điện gia đình',
  'tasks',
  'Gọi điện hỏi thăm gia đình',
  '{
    "title": "Gọi điện gia đình",
    "description": "Gọi điện hỏi thăm gia đình",
    "area": "relationships",
    "priority": "medium",
    "estimatedPomodoros": 1
  }'::jsonb,
  true,
  0
);

-- 8. Lên kế hoạch tuần
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Lên kế hoạch tuần',
  'tasks',
  'Review tuần qua và lên kế hoạch tuần mới',
  '{
    "title": "Lên kế hoạch tuần",
    "description": "Review tuần qua và lên kế hoạch tuần mới",
    "area": "personal",
    "priority": "high",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- =====================================================
-- TASK TEMPLATES - Thêm các templates mở rộng
-- =====================================================

-- 9. Code review
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Code review',
  'tasks',
  'Review code của đồng nghiệp',
  '{
    "title": "Code review",
    "description": "Review code của đồng nghiệp",
    "area": "career",
    "priority": "medium",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- 10. Thiết kế UI/UX
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Thiết kế UI/UX',
  'tasks',
  'Thiết kế giao diện người dùng',
  '{
    "title": "Thiết kế UI/UX",
    "description": "Thiết kế giao diện người dùng",
    "area": "career",
    "priority": "high",
    "estimatedPomodoros": 4
  }'::jsonb,
  true,
  0
);

-- 11. Đọc sách
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Đọc sách',
  'tasks',
  'Đọc sách phát triển bản thân',
  '{
    "title": "Đọc sách",
    "description": "Đọc sách phát triển bản thân",
    "area": "learning",
    "priority": "medium",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- 12. Nấu ăn lành mạnh
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Nấu ăn lành mạnh',
  'tasks',
  'Chuẩn bị bữa ăn lành mạnh cho tuần',
  '{
    "title": "Nấu ăn lành mạnh",
    "description": "Chuẩn bị bữa ăn lành mạnh cho tuần",
    "area": "health",
    "priority": "medium",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- 13. Đầu tư tài chính
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Đầu tư tài chính',
  'tasks',
  'Nghiên cứu và phân tích cơ hội đầu tư',
  '{
    "title": "Đầu tư tài chính",
    "description": "Nghiên cứu và phân tích cơ hội đầu tư",
    "area": "finance",
    "priority": "high",
    "estimatedPomodoros": 3
  }'::jsonb,
  true,
  0
);

-- 14. Dọn dẹp nhà cửa
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Dọn dẹp nhà cửa',
  'tasks',
  'Dọn dẹp và tổ chức không gian sống',
  '{
    "title": "Dọn dẹp nhà cửa",
    "description": "Dọn dẹp và tổ chức không gian sống",
    "area": "environment",
    "priority": "medium",
    "estimatedPomodoros": 2
  }'::jsonb,
  true,
  0
);

-- 15. Thiền định
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Thiền định',
  'tasks',
  'Thực hành thiền định để tĩnh tâm',
  '{
    "title": "Thiền định",
    "description": "Thực hành thiền định để tĩnh tâm",
    "area": "spirituality",
    "priority": "medium",
    "estimatedPomodoros": 1
  }'::jsonb,
  true,
  0
);

-- 16. Tình nguyện
INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES (
  'Tình nguyện',
  'tasks',
  'Tham gia hoạt động tình nguyện',
  '{
    "title": "Tình nguyện",
    "description": "Tham gia hoạt động tình nguyện",
    "area": "contribution",
    "priority": "medium",
    "estimatedPomodoros": 3
  }'::jsonb,
  true,
  0
);

RESET client_encoding;

