-- =====================================================
-- INSERT ALL TEMPLATES - GOALS, HABITS, JOURNAL, REVIEW
-- =====================================================
-- Script này thêm các templates mẫu cho Goals, Habits, Journal, Review
-- Templates này sẽ được load khi người dùng tạo mới

SET client_encoding TO 'UTF8';

-- Xóa templates cũ nếu có (để tránh duplicate)
DELETE FROM public.admin_templates WHERE type IN ('goals', 'habits', 'journal', 'review');

-- =====================================================
-- GOAL TEMPLATES
-- =====================================================

INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES 
  ('Giảm cân SMART', 'goals', 'Mục tiêu giảm cân theo phương pháp SMART', '{
    "title": "Giảm cân SMART",
    "description": "Mục tiêu giảm cân theo phương pháp SMART",
    "area": "health",
    "milestones": ["Lập kế hoạch ăn uống", "Tập luyện 3 lần/tuần", "Theo dõi cân nặng", "Đạt 50% mục tiêu", "Hoàn thành"],
    "suggested_duration_days": 90,
    "priority": "high",
    "tips": "Theo dõi cân nặng hàng tuần, kết hợp ăn uống và tập luyện"
  }'::jsonb, true, 0),

  ('Tiết kiệm SMART', 'goals', 'Mục tiêu tiết kiệm theo phương pháp SMART', '{
    "title": "Tiết kiệm SMART",
    "description": "Mục tiêu tiết kiệm theo phương pháp SMART",
    "area": "finance",
    "milestones": ["Phân tích chi tiêu", "Lập ngân sách", "Cắt giảm không cần thiết", "Đạt 50% mục tiêu", "Hoàn thành"],
    "suggested_duration_days": 180,
    "priority": "high",
    "tips": "Ghi chép chi tiêu hàng ngày, đặt mục tiêu tiết kiệm cụ thể"
  }'::jsonb, true, 0),

  ('Học kỹ năng mới', 'goals', 'Mục tiêu học và phát triển kỹ năng mới', '{
    "title": "Học kỹ năng mới",
    "description": "Mục tiêu học và phát triển kỹ năng mới",
    "area": "learning",
    "milestones": ["Chọn tài liệu học", "Hoàn thành cơ bản", "Thực hành dự án nhỏ", "Xây dựng portfolio", "Đánh giá"],
    "suggested_duration_days": 90,
    "priority": "medium",
    "tips": "Dành ít nhất 1 giờ mỗi ngày để học, thực hành thường xuyên"
  }'::jsonb, true, 0),

  ('OKR Phát triển sự nghiệp', 'goals', 'Mục tiêu phát triển sự nghiệp theo OKR', '{
    "title": "OKR Phát triển sự nghiệp",
    "description": "Mục tiêu phát triển sự nghiệp theo OKR",
    "area": "career",
    "milestones": ["KR1: Hoàn thành 3 dự án", "KR2: Học 2 kỹ năng mới", "KR3: Nhận feedback tốt", "KR4: Thêm trách nhiệm mới"],
    "suggested_duration_days": 90,
    "priority": "high",
    "tips": "Đặt mục tiêu rõ ràng, đo lường được, có thời hạn cụ thể"
  }'::jsonb, true, 0),

  ('OKR Sức khỏe', 'goals', 'Mục tiêu cải thiện sức khỏe theo OKR', '{
    "title": "OKR Sức khỏe",
    "description": "Mục tiêu cải thiện sức khỏe theo OKR",
    "area": "health",
    "milestones": ["KR1: Tập 12 buổi/tháng", "KR2: Ngủ đủ 7-8 tiếng", "KR3: Uống 2L nước/ngày", "KR4: Khám sức khỏe"],
    "suggested_duration_days": 90,
    "priority": "high",
    "tips": "Theo dõi thói quen hàng ngày, đặt mục tiêu cụ thể và đo lường được"
  }'::jsonb, true, 0),

  ('12-Week Year: Dự án cá nhân', 'goals', 'Hoàn thành dự án cá nhân trong 12 tuần', '{
    "title": "12-Week Year: Dự án cá nhân",
    "description": "Hoàn thành dự án cá nhân trong 12 tuần",
    "area": "personal",
    "milestones": ["Tuần 1-2: Lập kế hoạch", "Tuần 3-6: 50% dự án", "Tuần 7-10: 75% dự án", "Tuần 11-12: Hoàn thành"],
    "suggested_duration_days": 84,
    "priority": "high",
    "tips": "Chia nhỏ công việc, tập trung vào từng giai đoạn"
  }'::jsonb, true, 0),

  ('90 ngày xây dựng thói quen', 'goals', 'Xây dựng thói quen mới trong 90 ngày', '{
    "title": "90 ngày xây dựng thói quen",
    "description": "Xây dựng thói quen mới trong 90 ngày",
    "area": "personal",
    "milestones": ["Ngày 1-21: Bắt đầu cam kết", "Ngày 22-40: Tăng cường độ", "Ngày 41-70: Tự động hóa", "Ngày 71-90: Củng cố"],
    "suggested_duration_days": 90,
    "priority": "medium",
    "tips": "Bắt đầu nhỏ, tăng dần độ khó, theo dõi hàng ngày"
  }'::jsonb, true, 0),

  ('90 ngày cải thiện quan hệ', 'goals', 'Cải thiện mối quan hệ trong 90 ngày', '{
    "title": "90 ngày cải thiện quan hệ",
    "description": "Cải thiện mối quan hệ trong 90 ngày",
    "area": "relationships",
    "milestones": ["Liệt kê 5 mối quan hệ", "Kết nối định kỳ", "10 cuộc gặp mặt", "Tạo kỷ niệm đáng nhớ"],
    "suggested_duration_days": 90,
    "priority": "medium",
    "tips": "Dành thời gian chất lượng, lắng nghe và chia sẻ"
  }'::jsonb, true, 0);

-- =====================================================
-- HABIT TEMPLATES
-- =====================================================

INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES 
  ('Thức dậy sớm', 'habits', 'Dậy trước 6h sáng mỗi ngày', '{
    "name": "Thức dậy sớm",
    "description": "Dậy trước 6h sáng",
    "area": "health",
    "frequency": "daily",
    "target_per_day": 1,
    "target_unit": "lần",
    "suggested_time": "06:00",
    "difficulty": "medium",
    "benefits": ["Năng suất cao hơn", "Thời gian cho bản thân", "Tâm trạng tốt hơn"],
    "tips": "Đặt báo thức xa giường, chuẩn bị đồ từ tối hôm trước"
  }'::jsonb, true, 0),

  ('Tập thể dục', 'habits', 'Tập luyện ít nhất 30 phút mỗi ngày', '{
    "name": "Tập thể dục",
    "description": "Tập luyện ít nhất 30 phút",
    "area": "health",
    "frequency": "daily",
    "target_per_day": 1,
    "target_unit": "buổi",
    "suggested_time": "18:00",
    "difficulty": "medium",
    "benefits": ["Sức khỏe tốt hơn", "Năng lượng cao", "Giảm stress"],
    "tips": "Bắt đầu với bài tập nhẹ, tăng dần cường độ"
  }'::jsonb, true, 0),

  ('Đọc sách', 'habits', 'Đọc sách mỗi ngày', '{
    "name": "Đọc sách",
    "description": "Đọc sách mỗi ngày",
    "area": "learning",
    "frequency": "daily",
    "target_per_day": 30,
    "target_unit": "phút",
    "suggested_time": "20:00",
    "difficulty": "easy",
    "benefits": ["Mở rộng kiến thức", "Cải thiện trí nhớ", "Giảm stress"],
    "tips": "Đọc ít nhất 10 trang mỗi ngày, chọn sách phù hợp"
  }'::jsonb, true, 0),

  ('Thiền định', 'habits', 'Thiền và hít thở sâu', '{
    "name": "Thiền định",
    "description": "Thiền và hít thở sâu",
    "area": "health",
    "frequency": "daily",
    "target_per_day": 10,
    "target_unit": "phút",
    "suggested_time": "07:00",
    "difficulty": "easy",
    "benefits": ["Giảm stress", "Tập trung tốt hơn", "Tâm trạng ổn định"],
    "tips": "Bắt đầu với 5 phút, tăng dần thời gian"
  }'::jsonb, true, 0),

  ('Uống nước', 'habits', 'Uống đủ 2L nước/ngày', '{
    "name": "Uống nước",
    "description": "Uống đủ 2L nước/ngày",
    "area": "health",
    "frequency": "daily",
    "target_per_day": 8,
    "target_unit": "ly",
    "suggested_time": "all_day",
    "difficulty": "easy",
    "benefits": ["Da đẹp hơn", "Tiêu hóa tốt", "Năng lượng cao"],
    "tips": "Đặt nhắc nhở, mang chai nước theo người"
  }'::jsonb, true, 0),

  ('Viết nhật ký', 'habits', 'Ghi chép suy nghĩ và cảm xúc', '{
    "name": "Viết nhật ký",
    "description": "Ghi chép suy nghĩ và cảm xúc",
    "area": "personal",
    "frequency": "daily",
    "target_per_day": 1,
    "target_unit": "lần",
    "suggested_time": "21:00",
    "difficulty": "easy",
    "benefits": ["Hiểu bản thân hơn", "Giảm stress", "Ghi nhớ tốt hơn"],
    "tips": "Viết tự do, không cần cấu trúc, 5-10 phút mỗi ngày"
  }'::jsonb, true, 0),

  ('Học ngoại ngữ', 'habits', 'Học từ vựng hoặc ngữ pháp', '{
    "name": "Học ngoại ngữ",
    "description": "Học từ vựng hoặc ngữ pháp",
    "area": "learning",
    "frequency": "daily",
    "target_per_day": 15,
    "target_unit": "phút",
    "suggested_time": "19:00",
    "difficulty": "medium",
    "benefits": ["Mở rộng cơ hội", "Tăng tự tin", "Kích thích não bộ"],
    "tips": "Sử dụng app học ngoại ngữ, học ít nhưng đều đặn"
  }'::jsonb, true, 0),

  ('Không điện thoại trước ngủ', 'habits', 'Không dùng điện thoại 1h trước ngủ', '{
    "name": "Không điện thoại trước ngủ",
    "description": "Không dùng điện thoại 1h trước ngủ",
    "area": "health",
    "frequency": "daily",
    "target_per_day": 1,
    "target_unit": "lần",
    "suggested_time": "21:00",
    "difficulty": "hard",
    "benefits": ["Ngủ ngon hơn", "Giảm mỏi mắt", "Tâm trí thư giãn"],
    "tips": "Đặt điện thoại xa giường, đọc sách thay thế"
  }'::jsonb, true, 0),

  ('Biết ơn', 'habits', 'Liệt kê 3 điều biết ơn mỗi ngày', '{
    "name": "Biết ơn",
    "description": "Liệt kê 3 điều biết ơn",
    "area": "personal",
    "frequency": "daily",
    "target_per_day": 3,
    "target_unit": "điều",
    "suggested_time": "22:00",
    "difficulty": "easy",
    "benefits": ["Hạnh phúc hơn", "Tích cực hơn", "Quan hệ tốt hơn"],
    "tips": "Viết ra giấy hoặc nghĩ trong đầu, có thể là điều nhỏ nhất"
  }'::jsonb, true, 0),

  ('Tiết kiệm', 'habits', 'Ghi chép chi tiêu và tiết kiệm', '{
    "name": "Tiết kiệm",
    "description": "Ghi chép chi tiêu và tiết kiệm",
    "area": "finance",
    "frequency": "daily",
    "target_per_day": 1,
    "target_unit": "lần",
    "suggested_time": "20:00",
    "difficulty": "medium",
    "benefits": ["Quản lý tài chính tốt", "Tiết kiệm được tiền", "An tâm hơn"],
    "tips": "Ghi chép ngay sau khi chi tiêu, phân loại chi tiêu"
  }'::jsonb, true, 0);

-- =====================================================
-- JOURNAL TEMPLATES
-- =====================================================

INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES 
  ('Nhật ký buổi sáng', 'journal', 'Template cho nhật ký buổi sáng', '{
    "title": "Nhật ký buổi sáng",
    "description": "Template cho nhật ký buổi sáng",
    "prompts": ["Hôm nay tôi cảm thấy thế nào?", "3 điều tôi biết ơn hôm nay", "Mục tiêu quan trọng nhất hôm nay", "Điều gì tôi muốn hoàn thành?"],
    "mood_tracking": true,
    "gratitude_section": true,
    "suggested_areas": ["personal", "career", "health"],
    "best_for": "Bắt đầu ngày mới với tâm trạng tích cực"
  }'::jsonb, true, 0),

  ('Nhật ký buổi tối', 'journal', 'Template cho nhật ký buổi tối', '{
    "title": "Nhật ký buổi tối",
    "description": "Template cho nhật ký buổi tối",
    "prompts": ["Hôm nay tôi đã làm được gì?", "Điều gì tôi học được?", "Điều gì tôi muốn cải thiện?", "Ngày mai tôi sẽ tập trung vào gì?"],
    "mood_tracking": true,
    "gratitude_section": true,
    "suggested_areas": ["personal", "career", "relationships"],
    "best_for": "Tổng kết và suy ngẫm về ngày đã qua"
  }'::jsonb, true, 0),

  ('Nhật ký cảm xúc', 'journal', 'Template để ghi chép cảm xúc', '{
    "title": "Nhật ký cảm xúc",
    "description": "Template để ghi chép cảm xúc",
    "prompts": ["Cảm xúc chính của tôi hôm nay là gì?", "Điều gì khiến tôi cảm thấy như vậy?", "Làm thế nào để quản lý cảm xúc tốt hơn?", "Tôi cần hỗ trợ gì?"],
    "mood_tracking": true,
    "gratitude_section": false,
    "suggested_areas": ["personal", "relationships"],
    "best_for": "Hiểu và quản lý cảm xúc của bản thân"
  }'::jsonb, true, 0),

  ('Nhật ký phát triển bản thân', 'journal', 'Template cho phát triển bản thân', '{
    "title": "Nhật ký phát triển bản thân",
    "description": "Template cho phát triển bản thân",
    "prompts": ["Điểm mạnh của tôi hôm nay là gì?", "Điểm yếu tôi cần cải thiện?", "Bài học quan trọng nhất?", "Hành động cụ thể để phát triển?"],
    "mood_tracking": false,
    "gratitude_section": true,
    "suggested_areas": ["personal", "career", "learning"],
    "best_for": "Tập trung vào phát triển và cải thiện bản thân"
  }'::jsonb, true, 0),

  ('Nhật ký mối quan hệ', 'journal', 'Template để suy ngẫm về mối quan hệ', '{
    "title": "Nhật ký mối quan hệ",
    "description": "Template để suy ngẫm về mối quan hệ",
    "prompts": ["Mối quan hệ quan trọng nhất hôm nay?", "Điều gì tôi đã làm tốt?", "Điều gì tôi muốn cải thiện?", "Làm thế nào để kết nối sâu hơn?"],
    "mood_tracking": true,
    "gratitude_section": true,
    "suggested_areas": ["relationships"],
    "best_for": "Cải thiện và nuôi dưỡng các mối quan hệ"
  }'::jsonb, true, 0);

-- =====================================================
-- REVIEW TEMPLATES
-- =====================================================

INSERT INTO public.admin_templates (name, type, description, content, is_active, usage_count)
VALUES 
  ('Đánh giá tuần - Cơ bản', 'review', 'Template đánh giá tuần cơ bản', '{
    "title": "Đánh giá tuần - Cơ bản",
    "description": "Template đánh giá tuần cơ bản",
    "sections": ["Thành tựu", "Thách thức", "Bài học", "Tuần tới"],
    "rating_scale": 10,
    "focus_areas": ["career", "health", "relationships"],
    "estimated_time_minutes": 15
  }'::jsonb, true, 0),

  ('Đánh giá tuần - Chi tiết', 'review', 'Template đánh giá tuần chi tiết', '{
    "title": "Đánh giá tuần - Chi tiết",
    "description": "Template đánh giá tuần chi tiết",
    "sections": ["Thành tựu", "Thách thức", "Bài học", "Cảm xúc", "Mối quan hệ", "Sức khỏe", "Công việc", "Tuần tới"],
    "rating_scale": 10,
    "focus_areas": ["all"],
    "estimated_time_minutes": 30
  }'::jsonb, true, 0),

  ('Đánh giá tháng', 'review', 'Template đánh giá tháng', '{
    "title": "Đánh giá tháng",
    "description": "Template đánh giá tháng",
    "sections": ["Tổng quan tháng", "Thành tựu lớn", "Thách thức", "Bài học quan trọng", "Mục tiêu tháng tới"],
    "rating_scale": 10,
    "focus_areas": ["all"],
    "estimated_time_minutes": 45
  }'::jsonb, true, 0),

  ('Đánh giá quý', 'review', 'Template đánh giá quý', '{
    "title": "Đánh giá quý",
    "description": "Template đánh giá quý",
    "sections": ["Tổng quan quý", "Thành tựu nổi bật", "Thách thức lớn", "Bài học quan trọng", "Mục tiêu quý tới"],
    "rating_scale": 10,
    "focus_areas": ["all"],
    "estimated_time_minutes": 60
  }'::jsonb, true, 0);

RESET client_encoding;

