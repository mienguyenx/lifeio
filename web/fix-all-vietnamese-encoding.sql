-- =====================================================
-- FIX VIETNAMESE ENCODING - TẤT CẢ CÁC BẢNG ADMIN
-- =====================================================
-- Script này sửa encoding tiếng Việt cho tất cả các bảng trong Admin Panel
-- Sử dụng E'' string literal để đảm bảo UTF-8 encoding đúng

SET client_encoding TO 'UTF8';

-- =====================================================
-- 1. ADMIN_LANGUAGES
-- =====================================================

UPDATE public.admin_languages 
SET native_name = E'Tiếng Việt'
WHERE code = 'vi' AND native_name != E'Tiếng Việt';

-- =====================================================
-- 2. ADMIN_THEMES
-- =====================================================

UPDATE public.admin_themes 
SET description = E'Theme mặc định của hệ thống'
WHERE name = 'Default' AND description IS NOT NULL;

-- =====================================================
-- 3. ADMIN_TRANSLATIONS - COMMON NAMESPACE (Tiếng Việt)
-- =====================================================

-- Navigation
UPDATE public.admin_translations 
SET value = E'Tổng quan'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.dashboard';

UPDATE public.admin_translations 
SET value = E'Mục tiêu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.goals';

UPDATE public.admin_translations 
SET value = E'Thói quen'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.habits';

UPDATE public.admin_translations 
SET value = E'Công việc'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.tasks';

UPDATE public.admin_translations 
SET value = E'Nhật ký'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.journal';

UPDATE public.admin_translations 
SET value = E'Ghi chú'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.notes';

UPDATE public.admin_translations 
SET value = E'Bánh xe cuộc sống'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.lifewheel';

UPDATE public.admin_translations 
SET value = E'Đánh giá tuần'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.weeklyreview';

UPDATE public.admin_translations 
SET value = E'Cài đặt'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.settings';

UPDATE public.admin_translations 
SET value = E'Hồ sơ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.profile';

UPDATE public.admin_translations 
SET value = E'Quản trị'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.admin';

UPDATE public.admin_translations 
SET value = E'Đăng xuất'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.logout';

UPDATE public.admin_translations 
SET value = E'Đăng nhập'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.login';

UPDATE public.admin_translations 
SET value = E'Đăng ký'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.register';

UPDATE public.admin_translations 
SET value = E'Hôm nay'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.today';

UPDATE public.admin_translations 
SET value = E'Thùng rác'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'nav.trash';

-- Actions
UPDATE public.admin_translations 
SET value = E'Lưu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.save';

UPDATE public.admin_translations 
SET value = E'Hủy'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.cancel';

UPDATE public.admin_translations 
SET value = E'Xóa'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.delete';

UPDATE public.admin_translations 
SET value = E'Sửa'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.edit';

UPDATE public.admin_translations 
SET value = E'Thêm'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.add';

UPDATE public.admin_translations 
SET value = E'Tạo mới'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.create';

UPDATE public.admin_translations 
SET value = E'Cập nhật'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.update';

UPDATE public.admin_translations 
SET value = E'Tìm kiếm'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.search';

UPDATE public.admin_translations 
SET value = E'Lọc'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.filter';

UPDATE public.admin_translations 
SET value = E'Xuất'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.export';

UPDATE public.admin_translations 
SET value = E'Nhập'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.import';

UPDATE public.admin_translations 
SET value = E'Sao chép'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.copy';

UPDATE public.admin_translations 
SET value = E'Chia sẻ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.share';

UPDATE public.admin_translations 
SET value = E'Lưu trữ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.archive';

UPDATE public.admin_translations 
SET value = E'Khôi phục'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.restore';

UPDATE public.admin_translations 
SET value = E'Xác nhận'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.confirm';

UPDATE public.admin_translations 
SET value = E'Đóng'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.close';

UPDATE public.admin_translations 
SET value = E'Quay lại'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.back';

UPDATE public.admin_translations 
SET value = E'Tiếp theo'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.next';

UPDATE public.admin_translations 
SET value = E'Trước đó'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.previous';

UPDATE public.admin_translations 
SET value = E'Gửi'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.submit';

UPDATE public.admin_translations 
SET value = E'Đặt lại'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.reset';

UPDATE public.admin_translations 
SET value = E'Làm mới'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.refresh';

UPDATE public.admin_translations 
SET value = E'Xem'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.view';

UPDATE public.admin_translations 
SET value = E'Tải xuống'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.download';

UPDATE public.admin_translations 
SET value = E'Tải lên'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'action.upload';

-- Status
UPDATE public.admin_translations 
SET value = E'Hoạt động'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.active';

UPDATE public.admin_translations 
SET value = E'Không hoạt động'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.inactive';

UPDATE public.admin_translations 
SET value = E'Đang chờ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.pending';

UPDATE public.admin_translations 
SET value = E'Hoàn thành'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.completed';

UPDATE public.admin_translations 
SET value = E'Thất bại'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.failed';

UPDATE public.admin_translations 
SET value = E'Đang xử lý'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.processing';

UPDATE public.admin_translations 
SET value = E'Bản nháp'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.draft';

UPDATE public.admin_translations 
SET value = E'Đã xuất bản'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.published';

UPDATE public.admin_translations 
SET value = E'Đã lưu trữ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.archived';

UPDATE public.admin_translations 
SET value = E'Đã xóa'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.deleted';

UPDATE public.admin_translations 
SET value = E'Cần làm'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.todo';

UPDATE public.admin_translations 
SET value = E'Đang làm'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.in_progress';

UPDATE public.admin_translations 
SET value = E'Xong'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.done';

UPDATE public.admin_translations 
SET value = E'Hoãn lại'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'status.deferred';

-- Priority
UPDATE public.admin_translations 
SET value = E'Thấp'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'priority.low';

UPDATE public.admin_translations 
SET value = E'Trung bình'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'priority.medium';

UPDATE public.admin_translations 
SET value = E'Cao'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'priority.high';

UPDATE public.admin_translations 
SET value = E'Khẩn cấp'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'priority.urgent';

-- Time
UPDATE public.admin_translations 
SET value = E'Hôm nay'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.today';

UPDATE public.admin_translations 
SET value = E'Hôm qua'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.yesterday';

UPDATE public.admin_translations 
SET value = E'Ngày mai'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.tomorrow';

UPDATE public.admin_translations 
SET value = E'Tuần này'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.this_week';

UPDATE public.admin_translations 
SET value = E'Tuần trước'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.last_week';

UPDATE public.admin_translations 
SET value = E'Tuần sau'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.next_week';

UPDATE public.admin_translations 
SET value = E'Tháng này'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.this_month';

UPDATE public.admin_translations 
SET value = E'Tháng trước'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.last_month';

UPDATE public.admin_translations 
SET value = E'Năm nay'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.this_year';

UPDATE public.admin_translations 
SET value = E'Toàn bộ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'time.all_time';

-- Messages
UPDATE public.admin_translations 
SET value = E'Đang tải...'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.loading';

UPDATE public.admin_translations 
SET value = E'Đang lưu...'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.saving';

UPDATE public.admin_translations 
SET value = E'Đã lưu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.saved';

UPDATE public.admin_translations 
SET value = E'Có lỗi xảy ra'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.error';

UPDATE public.admin_translations 
SET value = E'Thành công'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.success';

UPDATE public.admin_translations 
SET value = E'Cảnh báo'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.warning';

UPDATE public.admin_translations 
SET value = E'Thông tin'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.info';

UPDATE public.admin_translations 
SET value = E'Bạn có chắc muốn xóa?'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.confirm_delete';

UPDATE public.admin_translations 
SET value = E'Không có dữ liệu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.no_data';

UPDATE public.admin_translations 
SET value = E'Không tìm thấy kết quả'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.no_results';

UPDATE public.admin_translations 
SET value = E'Trường bắt buộc'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.required_field';

UPDATE public.admin_translations 
SET value = E'Email không hợp lệ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.invalid_email';

UPDATE public.admin_translations 
SET value = E'Mật khẩu không khớp'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.password_mismatch';

UPDATE public.admin_translations 
SET value = E'Phiên đã hết hạn'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.session_expired';

UPDATE public.admin_translations 
SET value = E'Không có quyền truy cập'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.unauthorized';

UPDATE public.admin_translations 
SET value = E'Không có kết nối mạng'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.offline';

UPDATE public.admin_translations 
SET value = E'Đã kết nối'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'message.online';

-- Form Labels
UPDATE public.admin_translations 
SET value = E'Tên'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.name';

UPDATE public.admin_translations 
SET value = E'Email'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.email';

UPDATE public.admin_translations 
SET value = E'Mật khẩu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.password';

UPDATE public.admin_translations 
SET value = E'Xác nhận mật khẩu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.confirm_password';

UPDATE public.admin_translations 
SET value = E'Tiêu đề'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.title';

UPDATE public.admin_translations 
SET value = E'Mô tả'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.description';

UPDATE public.admin_translations 
SET value = E'Nội dung'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.content';

UPDATE public.admin_translations 
SET value = E'Ngày'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.date';

UPDATE public.admin_translations 
SET value = E'Giờ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.time';

UPDATE public.admin_translations 
SET value = E'Hạn chót'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.due_date';

UPDATE public.admin_translations 
SET value = E'Ngày bắt đầu'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.start_date';

UPDATE public.admin_translations 
SET value = E'Ngày kết thúc'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.end_date';

UPDATE public.admin_translations 
SET value = E'Danh mục'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.category';

UPDATE public.admin_translations 
SET value = E'Thẻ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.tags';

UPDATE public.admin_translations 
SET value = E'Ghi chú'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.notes';

UPDATE public.admin_translations 
SET value = E'Lĩnh vực'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.area';

UPDATE public.admin_translations 
SET value = E'Ưu tiên'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.priority';

UPDATE public.admin_translations 
SET value = E'Trạng thái'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.status';

UPDATE public.admin_translations 
SET value = E'Tiến độ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'form.progress';

-- Life Areas
UPDATE public.admin_translations 
SET value = E'Sức khỏe'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.health';

UPDATE public.admin_translations 
SET value = E'Mối quan hệ'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.relationships';

UPDATE public.admin_translations 
SET value = E'Sự nghiệp'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.career';

UPDATE public.admin_translations 
SET value = E'Tài chính'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.finance';

UPDATE public.admin_translations 
SET value = E'Cá nhân'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.personal';

UPDATE public.admin_translations 
SET value = E'Giải trí'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.fun';

UPDATE public.admin_translations 
SET value = E'Môi trường'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.environment';

UPDATE public.admin_translations 
SET value = E'Tâm linh'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.spirituality';

UPDATE public.admin_translations 
SET value = E'Học tập'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.learning';

UPDATE public.admin_translations 
SET value = E'Đóng góp'
WHERE language_code = 'vi' AND namespace = 'common' AND key = 'area.contribution';

-- =====================================================
-- 4. ADMIN_TRANSLATIONS - ADMIN NAMESPACE (Tiếng Việt)
-- =====================================================

-- Admin Navigation
UPDATE public.admin_translations 
SET value = E'Bảng điều khiển'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.dashboard';

UPDATE public.admin_translations 
SET value = E'Người dùng'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.users';

UPDATE public.admin_translations 
SET value = E'Workspaces'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.workspaces';

UPDATE public.admin_translations 
SET value = E'Gói dịch vụ'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.plans';

UPDATE public.admin_translations 
SET value = E'Mẫu'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.templates';

UPDATE public.admin_translations 
SET value = E'Giao diện'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.themes';

UPDATE public.admin_translations 
SET value = E'Ngôn ngữ'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.languages';

UPDATE public.admin_translations 
SET value = E'Nhật ký hệ thống'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.logs';

UPDATE public.admin_translations 
SET value = E'Nhật ký email'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.email_logs';

UPDATE public.admin_translations 
SET value = E'Phân tích'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.analytics';

UPDATE public.admin_translations 
SET value = E'Quản lý dữ liệu'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'nav.data_management';

-- Admin Dashboard
UPDATE public.admin_translations 
SET value = E'Bảng điều khiển quản trị'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'dashboard.title';

UPDATE public.admin_translations 
SET value = E'Tổng người dùng'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'dashboard.total_users';

UPDATE public.admin_translations 
SET value = E'Người dùng hoạt động'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'dashboard.active_users';

UPDATE public.admin_translations 
SET value = E'Người dùng mới hôm nay'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'dashboard.new_users_today';

UPDATE public.admin_translations 
SET value = E'Tổng workspaces'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'dashboard.total_workspaces';

UPDATE public.admin_translations 
SET value = E'Tình trạng hệ thống'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'dashboard.system_health';

-- Admin Users
UPDATE public.admin_translations 
SET value = E'Quản lý người dùng'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'users.title';

UPDATE public.admin_translations 
SET value = E'Tất cả người dùng'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'users.all_users';

UPDATE public.admin_translations 
SET value = E'Người dùng mới'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'users.new_users';

UPDATE public.admin_translations 
SET value = E'Người dùng hoạt động'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'users.active_users';

UPDATE public.admin_translations 
SET value = E'Người dùng không hoạt động'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'users.inactive_users';

-- Admin Templates
UPDATE public.admin_translations 
SET value = E'Mẫu mục tiêu'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'templates.goal_templates';

UPDATE public.admin_translations 
SET value = E'Mẫu thói quen'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'templates.habit_templates';

UPDATE public.admin_translations 
SET value = E'Mẫu nhật ký'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'templates.journal_templates';

UPDATE public.admin_translations 
SET value = E'Mẫu đánh giá tuần'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'templates.review_templates';

-- Admin Languages
UPDATE public.admin_translations 
SET value = E'Tiến độ dịch'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'languages.translation_progress';

UPDATE public.admin_translations 
SET value = E'Quản lý bản dịch'
WHERE language_code = 'vi' AND namespace = 'admin' AND key = 'languages.manage_translations';

-- =====================================================
-- 5. SUBSCRIPTION_PLANS (nếu có tiếng Việt trong JSONB)
-- =====================================================
-- Note: JSONB fields cần được update toàn bộ object

UPDATE public.subscription_plans 
SET description = E'Gói miễn phí cho người dùng mới',
    features = '["5 mục tiêu", "10 thói quen", "Nhật ký cơ bản", "1 workspace"]'::jsonb
WHERE slug = 'free';

UPDATE public.subscription_plans 
SET description = E'Gói Pro cho người dùng cá nhân',
    features = '["Không giới hạn mục tiêu", "Không giới hạn thói quen", "AI Coach", "3 workspaces", "Xuất báo cáo"]'::jsonb
WHERE slug = 'pro';

UPDATE public.subscription_plans 
SET description = E'Gói dành cho đội nhóm',
    features = '["Tất cả tính năng Pro", "10 workspaces", "Quản lý team", "API access", "Hỗ trợ ưu tiên"]'::jsonb
WHERE slug = 'business';

-- =====================================================
-- HOÀN THÀNH
-- =====================================================
-- Script đã sửa encoding cho:
-- ✅ admin_languages (native_name)
-- ✅ admin_themes (description)
-- ✅ admin_translations (common namespace - ~100 keys)
-- ✅ admin_translations (admin namespace - ~20 keys)
-- ✅ subscription_plans (description, features JSONB)
-- =====================================================

RESET client_encoding;

