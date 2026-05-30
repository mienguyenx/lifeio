-- ===========================================
-- Script bổ sung các bảng còn thiếu cho External Supabase
-- Chạy an toàn trên database đã tồn tại
-- ===========================================

-- 1. Tạo bảng subscription_plans nếu chưa có
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_period TEXT NOT NULL DEFAULT 'monthly',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    allowed_user_ids UUID[] DEFAULT '{}'::uuid[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tạo bảng workspaces nếu chưa có
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    max_members INTEGER DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tạo bảng workspace_members nếu chưa có
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    invited_by UUID REFERENCES public.profiles(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- 4. Tạo bảng workspace_invitations nếu chưa có
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tạo bảng user_subscriptions nếu chưa có
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tạo bảng admin_settings nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tạo bảng system_logs nếu chưa có
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Tạo bảng email_logs nếu chưa có
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    template_type TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_by UUID,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tạo bảng feature_flags nếu chưa có
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    environment TEXT NOT NULL DEFAULT 'all',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tạo bảng admin_ai_models nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'lovable',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    max_tokens INTEGER DEFAULT 4096,
    temperature NUMERIC DEFAULT 0.7,
    capabilities TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Tạo bảng admin_ai_prompts nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    prompt_key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT,
    variables TEXT[] DEFAULT '{}'::text[],
    model_id UUID REFERENCES public.admin_ai_models(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Tạo bảng admin_templates nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Tạo bảng admin_themes nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    colors JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Tạo bảng admin_languages nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    flag TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    translation_progress INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Tạo bảng admin_translations nếu chưa có (bảng lưu bản dịch)
CREATE TABLE IF NOT EXISTS public.admin_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code TEXT NOT NULL,
    namespace TEXT NOT NULL DEFAULT 'common',
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(language_code, namespace, key)
);

-- 16. Tạo bảng admin_plugins nếu chưa có
CREATE TABLE IF NOT EXISTS public.admin_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    description TEXT,
    author TEXT,
    icon TEXT DEFAULT 'puzzle',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_system BOOLEAN NOT NULL DEFAULT false,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    hooks TEXT[] DEFAULT '{}'::text[],
    permissions TEXT[] DEFAULT '{}'::text[],
    sidebar_item BOOLEAN DEFAULT false,
    dashboard_widget BOOLEAN DEFAULT false,
    admin_page BOOLEAN DEFAULT false,
    entry_point TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    changelog JSONB DEFAULT '[]'::jsonb,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Tạo bảng plugin_hooks nếu chưa có
CREATE TABLE IF NOT EXISTS public.plugin_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL REFERENCES public.admin_plugins(id) ON DELETE CASCADE,
    hook_name TEXT NOT NULL,
    handler_key TEXT NOT NULL,
    priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Tạo bảng user_plugin_settings nếu chưa có
CREATE TABLE IF NOT EXISTS public.user_plugin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES public.admin_plugins(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, plugin_id)
);

-- ===========================================
-- Enable RLS
-- ===========================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plugin_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies (xóa cũ nếu có rồi tạo mới)
-- ===========================================

-- subscription_plans
DROP POLICY IF EXISTS "Everyone can view active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- workspaces
DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can manage workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
CREATE POLICY "Users can view own workspaces" ON public.workspaces FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners can manage workspaces" ON public.workspaces FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins can view all workspaces" ON public.workspaces FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- workspace_members
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owners can manage members" ON public.workspace_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

-- workspace_invitations
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.workspace_invitations;
CREATE POLICY "Owners can manage invitations" ON public.workspace_invitations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

-- user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_settings
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
CREATE POLICY "Admins can view settings" ON public.admin_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert settings" ON public.admin_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- system_logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.system_logs;
CREATE POLICY "Admins can view logs" ON public.system_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert logs" ON public.system_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- email_logs
DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;
CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- feature_flags
DROP POLICY IF EXISTS "Admins can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can delete feature flags" ON public.feature_flags;
CREATE POLICY "Admins can view feature flags" ON public.feature_flags FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert feature flags" ON public.feature_flags FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update feature flags" ON public.feature_flags FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete feature flags" ON public.feature_flags FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- admin_ai_models
DROP POLICY IF EXISTS "Users can view active AI models" ON public.admin_ai_models;
DROP POLICY IF EXISTS "Admins can manage AI models" ON public.admin_ai_models;
CREATE POLICY "Users can view active AI models" ON public.admin_ai_models FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage AI models" ON public.admin_ai_models FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_ai_prompts
DROP POLICY IF EXISTS "Users can view active AI prompts" ON public.admin_ai_prompts;
DROP POLICY IF EXISTS "Admins can manage AI prompts" ON public.admin_ai_prompts;
CREATE POLICY "Users can view active AI prompts" ON public.admin_ai_prompts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage AI prompts" ON public.admin_ai_prompts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_templates
DROP POLICY IF EXISTS "Users can view active templates" ON public.admin_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.admin_templates;
CREATE POLICY "Users can view active templates" ON public.admin_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON public.admin_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_themes
DROP POLICY IF EXISTS "Users can view active themes" ON public.admin_themes;
DROP POLICY IF EXISTS "Admins can manage themes" ON public.admin_themes;
CREATE POLICY "Users can view active themes" ON public.admin_themes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage themes" ON public.admin_themes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_languages
DROP POLICY IF EXISTS "Users can view active languages" ON public.admin_languages;
DROP POLICY IF EXISTS "Admins can manage languages" ON public.admin_languages;
CREATE POLICY "Users can view active languages" ON public.admin_languages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage languages" ON public.admin_languages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_translations
DROP POLICY IF EXISTS "Everyone can view translations" ON public.admin_translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.admin_translations;
CREATE POLICY "Everyone can view translations" ON public.admin_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage translations" ON public.admin_translations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- admin_plugins
DROP POLICY IF EXISTS "Users can view active plugins" ON public.admin_plugins;
DROP POLICY IF EXISTS "Admins can manage plugins" ON public.admin_plugins;
CREATE POLICY "Users can view active plugins" ON public.admin_plugins FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plugins" ON public.admin_plugins FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- plugin_hooks
DROP POLICY IF EXISTS "Users can view active hooks" ON public.plugin_hooks;
DROP POLICY IF EXISTS "Admins can manage plugin hooks" ON public.plugin_hooks;
CREATE POLICY "Users can view active hooks" ON public.plugin_hooks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plugin hooks" ON public.plugin_hooks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- user_plugin_settings
DROP POLICY IF EXISTS "Users can manage own plugin settings" ON public.user_plugin_settings;
DROP POLICY IF EXISTS "Admins can view all plugin settings" ON public.user_plugin_settings;
CREATE POLICY "Users can manage own plugin settings" ON public.user_plugin_settings FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all plugin settings" ON public.user_plugin_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- Thêm dữ liệu mẫu cho Plans
-- ===========================================
INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, is_default, sort_order)
SELECT 'Free', 'free', 'Gói miễn phí cho người dùng mới', 0,
    '["5 mục tiêu", "10 thói quen", "Nhật ký cơ bản", "1 workspace"]'::jsonb,
    '{"goals": 5, "habits": 10, "workspaces": 1}'::jsonb,
    true, 0
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'free');

INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, sort_order)
SELECT 'Pro', 'pro', 'Gói Pro cho người dùng cá nhân', 9.99,
    '["Không giới hạn mục tiêu", "Không giới hạn thói quen", "AI Coach", "3 workspaces", "Xuất báo cáo"]'::jsonb,
    '{"goals": -1, "habits": -1, "workspaces": 3}'::jsonb,
    1
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'pro');

INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, sort_order)
SELECT 'Business', 'business', 'Gói dành cho đội nhóm', 29.99,
    '["Tất cả tính năng Pro", "10 workspaces", "Quản lý team", "API access", "Hỗ trợ ưu tiên"]'::jsonb,
    '{"goals": -1, "habits": -1, "workspaces": 10, "team_members": 25}'::jsonb,
    2
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'business');

INSERT INTO public.subscription_plans (name, slug, description, price, features, limits, sort_order)
SELECT 'Enterprise', 'enterprise', 'Gói doanh nghiệp tùy chỉnh', 99.99,
    '["Tất cả tính năng Business", "Không giới hạn workspaces", "SSO/SAML", "Dedicated support", "Custom integrations"]'::jsonb,
    '{"goals": -1, "habits": -1, "workspaces": -1, "team_members": -1}'::jsonb,
    3
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'enterprise');

-- ===========================================
-- Thêm dữ liệu mẫu cho AI Models
-- ===========================================
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_default, capabilities)
SELECT 'Gemini 2.5 Flash', 'google/gemini-2.5-flash', 'lovable', 'Model nhanh và cân bằng', true, 
    ARRAY['text', 'reasoning', 'multimodal']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'google/gemini-2.5-flash');

INSERT INTO public.admin_ai_models (name, model_id, provider, description, capabilities)
SELECT 'GPT-5 Mini', 'openai/gpt-5-mini', 'lovable', 'Model chi phí thấp, hiệu suất cao',
    ARRAY['text', 'reasoning', 'multimodal']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'openai/gpt-5-mini');

-- ===========================================
-- Thêm dữ liệu mẫu cho Languages
-- ===========================================
INSERT INTO public.admin_languages (code, name, native_name, flag, is_active, translation_progress)
SELECT 'vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.admin_languages WHERE code = 'vi');

INSERT INTO public.admin_languages (code, name, native_name, flag, is_active, translation_progress)
SELECT 'en', 'English', 'English', '🇺🇸', true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.admin_languages WHERE code = 'en');

-- ===========================================
-- Thêm dữ liệu mẫu cho Themes
-- ===========================================
INSERT INTO public.admin_themes (name, description, colors, is_active, is_default)
SELECT 'Default', 'Theme mặc định của hệ thống', 
    '{"primary": "222.2 47.4% 11.2%", "secondary": "210 40% 96.1%", "accent": "210 40% 96.1%"}'::jsonb,
    true, true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_themes WHERE name = 'Default');

-- ===========================================
-- TRANSLATIONS - COMMON NAMESPACE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Navigation
('vi', 'common', 'nav.dashboard', 'Tổng quan'),
('vi', 'common', 'nav.goals', 'Mục tiêu'),
('vi', 'common', 'nav.habits', 'Thói quen'),
('vi', 'common', 'nav.tasks', 'Công việc'),
('vi', 'common', 'nav.journal', 'Nhật ký'),
('vi', 'common', 'nav.notes', 'Ghi chú'),
('vi', 'common', 'nav.lifewheel', 'Bánh xe cuộc sống'),
('vi', 'common', 'nav.weeklyreview', 'Đánh giá tuần'),
('vi', 'common', 'nav.settings', 'Cài đặt'),
('vi', 'common', 'nav.profile', 'Hồ sơ'),
('vi', 'common', 'nav.admin', 'Quản trị'),
('vi', 'common', 'nav.logout', 'Đăng xuất'),
('vi', 'common', 'nav.login', 'Đăng nhập'),
('vi', 'common', 'nav.register', 'Đăng ký'),
('vi', 'common', 'nav.today', 'Hôm nay'),
('vi', 'common', 'nav.ai_coach', 'AI Coach'),
('vi', 'common', 'nav.trash', 'Thùng rác'),

-- Actions
('vi', 'common', 'action.save', 'Lưu'),
('vi', 'common', 'action.cancel', 'Hủy'),
('vi', 'common', 'action.delete', 'Xóa'),
('vi', 'common', 'action.edit', 'Sửa'),
('vi', 'common', 'action.add', 'Thêm'),
('vi', 'common', 'action.create', 'Tạo mới'),
('vi', 'common', 'action.update', 'Cập nhật'),
('vi', 'common', 'action.search', 'Tìm kiếm'),
('vi', 'common', 'action.filter', 'Lọc'),
('vi', 'common', 'action.export', 'Xuất'),
('vi', 'common', 'action.import', 'Nhập'),
('vi', 'common', 'action.copy', 'Sao chép'),
('vi', 'common', 'action.share', 'Chia sẻ'),
('vi', 'common', 'action.archive', 'Lưu trữ'),
('vi', 'common', 'action.restore', 'Khôi phục'),
('vi', 'common', 'action.confirm', 'Xác nhận'),
('vi', 'common', 'action.close', 'Đóng'),
('vi', 'common', 'action.back', 'Quay lại'),
('vi', 'common', 'action.next', 'Tiếp theo'),
('vi', 'common', 'action.previous', 'Trước đó'),
('vi', 'common', 'action.submit', 'Gửi'),
('vi', 'common', 'action.reset', 'Đặt lại'),
('vi', 'common', 'action.refresh', 'Làm mới'),
('vi', 'common', 'action.view', 'Xem'),
('vi', 'common', 'action.download', 'Tải xuống'),
('vi', 'common', 'action.upload', 'Tải lên'),

-- Status
('vi', 'common', 'status.active', 'Hoạt động'),
('vi', 'common', 'status.inactive', 'Không hoạt động'),
('vi', 'common', 'status.pending', 'Đang chờ'),
('vi', 'common', 'status.completed', 'Hoàn thành'),
('vi', 'common', 'status.failed', 'Thất bại'),
('vi', 'common', 'status.processing', 'Đang xử lý'),
('vi', 'common', 'status.draft', 'Bản nháp'),
('vi', 'common', 'status.published', 'Đã xuất bản'),
('vi', 'common', 'status.archived', 'Đã lưu trữ'),
('vi', 'common', 'status.deleted', 'Đã xóa'),
('vi', 'common', 'status.todo', 'Cần làm'),
('vi', 'common', 'status.in_progress', 'Đang làm'),
('vi', 'common', 'status.done', 'Xong'),
('vi', 'common', 'status.deferred', 'Hoãn lại'),

-- Priority
('vi', 'common', 'priority.low', 'Thấp'),
('vi', 'common', 'priority.medium', 'Trung bình'),
('vi', 'common', 'priority.high', 'Cao'),
('vi', 'common', 'priority.urgent', 'Khẩn cấp'),

-- Time
('vi', 'common', 'time.today', 'Hôm nay'),
('vi', 'common', 'time.yesterday', 'Hôm qua'),
('vi', 'common', 'time.tomorrow', 'Ngày mai'),
('vi', 'common', 'time.this_week', 'Tuần này'),
('vi', 'common', 'time.last_week', 'Tuần trước'),
('vi', 'common', 'time.next_week', 'Tuần sau'),
('vi', 'common', 'time.this_month', 'Tháng này'),
('vi', 'common', 'time.last_month', 'Tháng trước'),
('vi', 'common', 'time.this_year', 'Năm nay'),
('vi', 'common', 'time.all_time', 'Toàn bộ'),

-- Messages
('vi', 'common', 'message.loading', 'Đang tải...'),
('vi', 'common', 'message.saving', 'Đang lưu...'),
('vi', 'common', 'message.saved', 'Đã lưu'),
('vi', 'common', 'message.error', 'Có lỗi xảy ra'),
('vi', 'common', 'message.success', 'Thành công'),
('vi', 'common', 'message.warning', 'Cảnh báo'),
('vi', 'common', 'message.info', 'Thông tin'),
('vi', 'common', 'message.confirm_delete', 'Bạn có chắc muốn xóa?'),
('vi', 'common', 'message.no_data', 'Không có dữ liệu'),
('vi', 'common', 'message.no_results', 'Không tìm thấy kết quả'),
('vi', 'common', 'message.required_field', 'Trường bắt buộc'),
('vi', 'common', 'message.invalid_email', 'Email không hợp lệ'),
('vi', 'common', 'message.password_mismatch', 'Mật khẩu không khớp'),
('vi', 'common', 'message.session_expired', 'Phiên đã hết hạn'),
('vi', 'common', 'message.unauthorized', 'Không có quyền truy cập'),
('vi', 'common', 'message.offline', 'Không có kết nối mạng'),
('vi', 'common', 'message.online', 'Đã kết nối'),

-- Form Labels
('vi', 'common', 'form.name', 'Tên'),
('vi', 'common', 'form.email', 'Email'),
('vi', 'common', 'form.password', 'Mật khẩu'),
('vi', 'common', 'form.confirm_password', 'Xác nhận mật khẩu'),
('vi', 'common', 'form.title', 'Tiêu đề'),
('vi', 'common', 'form.description', 'Mô tả'),
('vi', 'common', 'form.content', 'Nội dung'),
('vi', 'common', 'form.date', 'Ngày'),
('vi', 'common', 'form.time', 'Giờ'),
('vi', 'common', 'form.due_date', 'Hạn chót'),
('vi', 'common', 'form.start_date', 'Ngày bắt đầu'),
('vi', 'common', 'form.end_date', 'Ngày kết thúc'),
('vi', 'common', 'form.category', 'Danh mục'),
('vi', 'common', 'form.tags', 'Thẻ'),
('vi', 'common', 'form.notes', 'Ghi chú'),
('vi', 'common', 'form.area', 'Lĩnh vực'),
('vi', 'common', 'form.priority', 'Ưu tiên'),
('vi', 'common', 'form.status', 'Trạng thái'),
('vi', 'common', 'form.progress', 'Tiến độ'),

-- Life Areas
('vi', 'common', 'area.health', 'Sức khỏe'),
('vi', 'common', 'area.relationships', 'Mối quan hệ'),
('vi', 'common', 'area.career', 'Sự nghiệp'),
('vi', 'common', 'area.finance', 'Tài chính'),
('vi', 'common', 'area.personal', 'Cá nhân'),
('vi', 'common', 'area.fun', 'Giải trí'),
('vi', 'common', 'area.environment', 'Môi trường'),
('vi', 'common', 'area.spirituality', 'Tâm linh'),
('vi', 'common', 'area.learning', 'Học tập'),
('vi', 'common', 'area.contribution', 'Đóng góp')

ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - COMMON NAMESPACE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Navigation
('en', 'common', 'nav.dashboard', 'Dashboard'),
('en', 'common', 'nav.goals', 'Goals'),
('en', 'common', 'nav.habits', 'Habits'),
('en', 'common', 'nav.tasks', 'Tasks'),
('en', 'common', 'nav.journal', 'Journal'),
('en', 'common', 'nav.notes', 'Notes'),
('en', 'common', 'nav.lifewheel', 'Life Wheel'),
('en', 'common', 'nav.weeklyreview', 'Weekly Review'),
('en', 'common', 'nav.settings', 'Settings'),
('en', 'common', 'nav.profile', 'Profile'),
('en', 'common', 'nav.admin', 'Admin'),
('en', 'common', 'nav.logout', 'Logout'),
('en', 'common', 'nav.login', 'Login'),
('en', 'common', 'nav.register', 'Register'),
('en', 'common', 'nav.today', 'Today'),
('en', 'common', 'nav.ai_coach', 'AI Coach'),
('en', 'common', 'nav.trash', 'Trash'),

-- Actions
('en', 'common', 'action.save', 'Save'),
('en', 'common', 'action.cancel', 'Cancel'),
('en', 'common', 'action.delete', 'Delete'),
('en', 'common', 'action.edit', 'Edit'),
('en', 'common', 'action.add', 'Add'),
('en', 'common', 'action.create', 'Create'),
('en', 'common', 'action.update', 'Update'),
('en', 'common', 'action.search', 'Search'),
('en', 'common', 'action.filter', 'Filter'),
('en', 'common', 'action.export', 'Export'),
('en', 'common', 'action.import', 'Import'),
('en', 'common', 'action.copy', 'Copy'),
('en', 'common', 'action.share', 'Share'),
('en', 'common', 'action.archive', 'Archive'),
('en', 'common', 'action.restore', 'Restore'),
('en', 'common', 'action.confirm', 'Confirm'),
('en', 'common', 'action.close', 'Close'),
('en', 'common', 'action.back', 'Back'),
('en', 'common', 'action.next', 'Next'),
('en', 'common', 'action.previous', 'Previous'),
('en', 'common', 'action.submit', 'Submit'),
('en', 'common', 'action.reset', 'Reset'),
('en', 'common', 'action.refresh', 'Refresh'),
('en', 'common', 'action.view', 'View'),
('en', 'common', 'action.download', 'Download'),
('en', 'common', 'action.upload', 'Upload'),

-- Status
('en', 'common', 'status.active', 'Active'),
('en', 'common', 'status.inactive', 'Inactive'),
('en', 'common', 'status.pending', 'Pending'),
('en', 'common', 'status.completed', 'Completed'),
('en', 'common', 'status.failed', 'Failed'),
('en', 'common', 'status.processing', 'Processing'),
('en', 'common', 'status.draft', 'Draft'),
('en', 'common', 'status.published', 'Published'),
('en', 'common', 'status.archived', 'Archived'),
('en', 'common', 'status.deleted', 'Deleted'),
('en', 'common', 'status.todo', 'To Do'),
('en', 'common', 'status.in_progress', 'In Progress'),
('en', 'common', 'status.done', 'Done'),
('en', 'common', 'status.deferred', 'Deferred'),

-- Priority
('en', 'common', 'priority.low', 'Low'),
('en', 'common', 'priority.medium', 'Medium'),
('en', 'common', 'priority.high', 'High'),
('en', 'common', 'priority.urgent', 'Urgent'),

-- Time
('en', 'common', 'time.today', 'Today'),
('en', 'common', 'time.yesterday', 'Yesterday'),
('en', 'common', 'time.tomorrow', 'Tomorrow'),
('en', 'common', 'time.this_week', 'This Week'),
('en', 'common', 'time.last_week', 'Last Week'),
('en', 'common', 'time.next_week', 'Next Week'),
('en', 'common', 'time.this_month', 'This Month'),
('en', 'common', 'time.last_month', 'Last Month'),
('en', 'common', 'time.this_year', 'This Year'),
('en', 'common', 'time.all_time', 'All Time'),

-- Messages
('en', 'common', 'message.loading', 'Loading...'),
('en', 'common', 'message.saving', 'Saving...'),
('en', 'common', 'message.saved', 'Saved'),
('en', 'common', 'message.error', 'An error occurred'),
('en', 'common', 'message.success', 'Success'),
('en', 'common', 'message.warning', 'Warning'),
('en', 'common', 'message.info', 'Information'),
('en', 'common', 'message.confirm_delete', 'Are you sure you want to delete?'),
('en', 'common', 'message.no_data', 'No data available'),
('en', 'common', 'message.no_results', 'No results found'),
('en', 'common', 'message.required_field', 'This field is required'),
('en', 'common', 'message.invalid_email', 'Invalid email address'),
('en', 'common', 'message.password_mismatch', 'Passwords do not match'),
('en', 'common', 'message.session_expired', 'Session expired'),
('en', 'common', 'message.unauthorized', 'Unauthorized access'),
('en', 'common', 'message.offline', 'You are offline'),
('en', 'common', 'message.online', 'Connected'),

-- Form Labels
('en', 'common', 'form.name', 'Name'),
('en', 'common', 'form.email', 'Email'),
('en', 'common', 'form.password', 'Password'),
('en', 'common', 'form.confirm_password', 'Confirm Password'),
('en', 'common', 'form.title', 'Title'),
('en', 'common', 'form.description', 'Description'),
('en', 'common', 'form.content', 'Content'),
('en', 'common', 'form.date', 'Date'),
('en', 'common', 'form.time', 'Time'),
('en', 'common', 'form.due_date', 'Due Date'),
('en', 'common', 'form.start_date', 'Start Date'),
('en', 'common', 'form.end_date', 'End Date'),
('en', 'common', 'form.category', 'Category'),
('en', 'common', 'form.tags', 'Tags'),
('en', 'common', 'form.notes', 'Notes'),
('en', 'common', 'form.area', 'Area'),
('en', 'common', 'form.priority', 'Priority'),
('en', 'common', 'form.status', 'Status'),
('en', 'common', 'form.progress', 'Progress'),

-- Life Areas
('en', 'common', 'area.health', 'Health'),
('en', 'common', 'area.relationships', 'Relationships'),
('en', 'common', 'area.career', 'Career'),
('en', 'common', 'area.finance', 'Finance'),
('en', 'common', 'area.personal', 'Personal'),
('en', 'common', 'area.fun', 'Fun & Recreation'),
('en', 'common', 'area.environment', 'Environment'),
('en', 'common', 'area.spirituality', 'Spirituality'),
('en', 'common', 'area.learning', 'Learning'),
('en', 'common', 'area.contribution', 'Contribution')

ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ADMIN NAMESPACE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Admin Navigation
('vi', 'admin', 'nav.dashboard', 'Bảng điều khiển'),
('vi', 'admin', 'nav.users', 'Người dùng'),
('vi', 'admin', 'nav.workspaces', 'Workspaces'),
('vi', 'admin', 'nav.plans', 'Gói dịch vụ'),
('vi', 'admin', 'nav.templates', 'Mẫu'),
('vi', 'admin', 'nav.themes', 'Giao diện'),
('vi', 'admin', 'nav.languages', 'Ngôn ngữ'),
('vi', 'admin', 'nav.ai_models', 'AI Models'),
('vi', 'admin', 'nav.ai_prompts', 'AI Prompts'),
('vi', 'admin', 'nav.plugins', 'Plugins'),
('vi', 'admin', 'nav.settings', 'Cài đặt'),
('vi', 'admin', 'nav.logs', 'Nhật ký hệ thống'),
('vi', 'admin', 'nav.email_logs', 'Nhật ký email'),
('vi', 'admin', 'nav.feature_flags', 'Feature Flags'),
('vi', 'admin', 'nav.analytics', 'Phân tích'),
('vi', 'admin', 'nav.data_management', 'Quản lý dữ liệu'),

-- Admin Dashboard
('vi', 'admin', 'dashboard.title', 'Bảng điều khiển quản trị'),
('vi', 'admin', 'dashboard.total_users', 'Tổng người dùng'),
('vi', 'admin', 'dashboard.active_users', 'Người dùng hoạt động'),
('vi', 'admin', 'dashboard.new_users_today', 'Người dùng mới hôm nay'),
('vi', 'admin', 'dashboard.total_workspaces', 'Tổng workspaces'),
('vi', 'admin', 'dashboard.system_health', 'Tình trạng hệ thống'),
('vi', 'admin', 'dashboard.recent_activity', 'Hoạt động gần đây'),

-- Users Management
('vi', 'admin', 'users.title', 'Quản lý người dùng'),
('vi', 'admin', 'users.search_placeholder', 'Tìm theo tên hoặc email...'),
('vi', 'admin', 'users.role', 'Vai trò'),
('vi', 'admin', 'users.role.admin', 'Quản trị viên'),
('vi', 'admin', 'users.role.moderator', 'Điều phối viên'),
('vi', 'admin', 'users.role.user', 'Người dùng'),
('vi', 'admin', 'users.last_login', 'Đăng nhập lần cuối'),
('vi', 'admin', 'users.created_at', 'Ngày tạo'),
('vi', 'admin', 'users.subscription', 'Gói đăng ký'),
('vi', 'admin', 'users.actions', 'Thao tác'),

-- Plans Management
('vi', 'admin', 'plans.title', 'Quản lý gói dịch vụ'),
('vi', 'admin', 'plans.add_plan', 'Thêm gói mới'),
('vi', 'admin', 'plans.edit_plan', 'Sửa gói'),
('vi', 'admin', 'plans.plan_name', 'Tên gói'),
('vi', 'admin', 'plans.price', 'Giá'),
('vi', 'admin', 'plans.billing_period', 'Chu kỳ thanh toán'),
('vi', 'admin', 'plans.features', 'Tính năng'),
('vi', 'admin', 'plans.limits', 'Giới hạn'),
('vi', 'admin', 'plans.subscribers', 'Số người đăng ký'),

-- Templates Management
('vi', 'admin', 'templates.title', 'Quản lý mẫu'),
('vi', 'admin', 'templates.add_template', 'Thêm mẫu mới'),
('vi', 'admin', 'templates.type', 'Loại mẫu'),
('vi', 'admin', 'templates.type.goals', 'Mục tiêu'),
('vi', 'admin', 'templates.type.habits', 'Thói quen'),
('vi', 'admin', 'templates.type.tasks', 'Công việc'),
('vi', 'admin', 'templates.type.journal', 'Nhật ký'),
('vi', 'admin', 'templates.usage_count', 'Số lần sử dụng'),

-- Themes Management
('vi', 'admin', 'themes.title', 'Quản lý giao diện'),
('vi', 'admin', 'themes.add_theme', 'Thêm giao diện mới'),
('vi', 'admin', 'themes.colors', 'Màu sắc'),
('vi', 'admin', 'themes.set_default', 'Đặt làm mặc định'),

-- Languages Management
('vi', 'admin', 'languages.title', 'Quản lý ngôn ngữ'),
('vi', 'admin', 'languages.add_language', 'Thêm ngôn ngữ mới'),
('vi', 'admin', 'languages.code', 'Mã ngôn ngữ'),
('vi', 'admin', 'languages.native_name', 'Tên bản địa'),
('vi', 'admin', 'languages.flag', 'Cờ'),
('vi', 'admin', 'languages.translation_progress', 'Tiến độ dịch'),
('vi', 'admin', 'languages.manage_translations', 'Quản lý bản dịch'),

-- AI Management
('vi', 'admin', 'ai.models_title', 'Quản lý AI Models'),
('vi', 'admin', 'ai.prompts_title', 'Quản lý AI Prompts'),
('vi', 'admin', 'ai.add_model', 'Thêm model mới'),
('vi', 'admin', 'ai.add_prompt', 'Thêm prompt mới'),
('vi', 'admin', 'ai.model_id', 'Model ID'),
('vi', 'admin', 'ai.provider', 'Nhà cung cấp'),
('vi', 'admin', 'ai.max_tokens', 'Max Tokens'),
('vi', 'admin', 'ai.temperature', 'Temperature'),
('vi', 'admin', 'ai.capabilities', 'Khả năng'),
('vi', 'admin', 'ai.prompt_key', 'Prompt Key'),
('vi', 'admin', 'ai.system_prompt', 'System Prompt'),
('vi', 'admin', 'ai.user_prompt', 'User Prompt Template'),
('vi', 'admin', 'ai.variables', 'Biến'),

-- Plugins Management
('vi', 'admin', 'plugins.title', 'Quản lý Plugins'),
('vi', 'admin', 'plugins.install', 'Cài đặt'),
('vi', 'admin', 'plugins.uninstall', 'Gỡ cài đặt'),
('vi', 'admin', 'plugins.configure', 'Cấu hình'),
('vi', 'admin', 'plugins.version', 'Phiên bản'),
('vi', 'admin', 'plugins.author', 'Tác giả'),

-- Settings
('vi', 'admin', 'settings.title', 'Cài đặt hệ thống'),
('vi', 'admin', 'settings.general', 'Cài đặt chung'),
('vi', 'admin', 'settings.email', 'Cài đặt email'),
('vi', 'admin', 'settings.security', 'Bảo mật'),
('vi', 'admin', 'settings.backup', 'Sao lưu'),

-- Logs
('vi', 'admin', 'logs.title', 'Nhật ký hệ thống'),
('vi', 'admin', 'logs.level', 'Mức độ'),
('vi', 'admin', 'logs.level.info', 'Thông tin'),
('vi', 'admin', 'logs.level.warning', 'Cảnh báo'),
('vi', 'admin', 'logs.level.error', 'Lỗi'),
('vi', 'admin', 'logs.message', 'Nội dung'),
('vi', 'admin', 'logs.timestamp', 'Thời gian'),
('vi', 'admin', 'logs.user', 'Người dùng')

ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ADMIN NAMESPACE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Admin Navigation
('en', 'admin', 'nav.dashboard', 'Dashboard'),
('en', 'admin', 'nav.users', 'Users'),
('en', 'admin', 'nav.workspaces', 'Workspaces'),
('en', 'admin', 'nav.plans', 'Plans'),
('en', 'admin', 'nav.templates', 'Templates'),
('en', 'admin', 'nav.themes', 'Themes'),
('en', 'admin', 'nav.languages', 'Languages'),
('en', 'admin', 'nav.ai_models', 'AI Models'),
('en', 'admin', 'nav.ai_prompts', 'AI Prompts'),
('en', 'admin', 'nav.plugins', 'Plugins'),
('en', 'admin', 'nav.settings', 'Settings'),
('en', 'admin', 'nav.logs', 'System Logs'),
('en', 'admin', 'nav.email_logs', 'Email Logs'),
('en', 'admin', 'nav.feature_flags', 'Feature Flags'),
('en', 'admin', 'nav.analytics', 'Analytics'),
('en', 'admin', 'nav.data_management', 'Data Management'),

-- Admin Dashboard
('en', 'admin', 'dashboard.title', 'Admin Dashboard'),
('en', 'admin', 'dashboard.total_users', 'Total Users'),
('en', 'admin', 'dashboard.active_users', 'Active Users'),
('en', 'admin', 'dashboard.new_users_today', 'New Users Today'),
('en', 'admin', 'dashboard.total_workspaces', 'Total Workspaces'),
('en', 'admin', 'dashboard.system_health', 'System Health'),
('en', 'admin', 'dashboard.recent_activity', 'Recent Activity'),

-- Users Management
('en', 'admin', 'users.title', 'User Management'),
('en', 'admin', 'users.search_placeholder', 'Search by name or email...'),
('en', 'admin', 'users.role', 'Role'),
('en', 'admin', 'users.role.admin', 'Administrator'),
('en', 'admin', 'users.role.moderator', 'Moderator'),
('en', 'admin', 'users.role.user', 'User'),
('en', 'admin', 'users.last_login', 'Last Login'),
('en', 'admin', 'users.created_at', 'Created At'),
('en', 'admin', 'users.subscription', 'Subscription'),
('en', 'admin', 'users.actions', 'Actions'),

-- Plans Management
('en', 'admin', 'plans.title', 'Plan Management'),
('en', 'admin', 'plans.add_plan', 'Add New Plan'),
('en', 'admin', 'plans.edit_plan', 'Edit Plan'),
('en', 'admin', 'plans.plan_name', 'Plan Name'),
('en', 'admin', 'plans.price', 'Price'),
('en', 'admin', 'plans.billing_period', 'Billing Period'),
('en', 'admin', 'plans.features', 'Features'),
('en', 'admin', 'plans.limits', 'Limits'),
('en', 'admin', 'plans.subscribers', 'Subscribers'),

-- Templates Management
('en', 'admin', 'templates.title', 'Template Management'),
('en', 'admin', 'templates.add_template', 'Add New Template'),
('en', 'admin', 'templates.type', 'Template Type'),
('en', 'admin', 'templates.type.goals', 'Goals'),
('en', 'admin', 'templates.type.habits', 'Habits'),
('en', 'admin', 'templates.type.tasks', 'Tasks'),
('en', 'admin', 'templates.type.journal', 'Journal'),
('en', 'admin', 'templates.usage_count', 'Usage Count'),

-- Themes Management
('en', 'admin', 'themes.title', 'Theme Management'),
('en', 'admin', 'themes.add_theme', 'Add New Theme'),
('en', 'admin', 'themes.colors', 'Colors'),
('en', 'admin', 'themes.set_default', 'Set as Default'),

-- Languages Management
('en', 'admin', 'languages.title', 'Language Management'),
('en', 'admin', 'languages.add_language', 'Add New Language'),
('en', 'admin', 'languages.code', 'Language Code'),
('en', 'admin', 'languages.native_name', 'Native Name'),
('en', 'admin', 'languages.flag', 'Flag'),
('en', 'admin', 'languages.translation_progress', 'Translation Progress'),
('en', 'admin', 'languages.manage_translations', 'Manage Translations'),

-- AI Management
('en', 'admin', 'ai.models_title', 'AI Models Management'),
('en', 'admin', 'ai.prompts_title', 'AI Prompts Management'),
('en', 'admin', 'ai.add_model', 'Add New Model'),
('en', 'admin', 'ai.add_prompt', 'Add New Prompt'),
('en', 'admin', 'ai.model_id', 'Model ID'),
('en', 'admin', 'ai.provider', 'Provider'),
('en', 'admin', 'ai.max_tokens', 'Max Tokens'),
('en', 'admin', 'ai.temperature', 'Temperature'),
('en', 'admin', 'ai.capabilities', 'Capabilities'),
('en', 'admin', 'ai.prompt_key', 'Prompt Key'),
('en', 'admin', 'ai.system_prompt', 'System Prompt'),
('en', 'admin', 'ai.user_prompt', 'User Prompt Template'),
('en', 'admin', 'ai.variables', 'Variables'),

-- Plugins Management
('en', 'admin', 'plugins.title', 'Plugin Management'),
('en', 'admin', 'plugins.install', 'Install'),
('en', 'admin', 'plugins.uninstall', 'Uninstall'),
('en', 'admin', 'plugins.configure', 'Configure'),
('en', 'admin', 'plugins.version', 'Version'),
('en', 'admin', 'plugins.author', 'Author'),

-- Settings
('en', 'admin', 'settings.title', 'System Settings'),
('en', 'admin', 'settings.general', 'General Settings'),
('en', 'admin', 'settings.email', 'Email Settings'),
('en', 'admin', 'settings.security', 'Security'),
('en', 'admin', 'settings.backup', 'Backup'),

-- Logs
('en', 'admin', 'logs.title', 'System Logs'),
('en', 'admin', 'logs.level', 'Level'),
('en', 'admin', 'logs.level.info', 'Info'),
('en', 'admin', 'logs.level.warning', 'Warning'),
('en', 'admin', 'logs.level.error', 'Error'),
('en', 'admin', 'logs.message', 'Message'),
('en', 'admin', 'logs.timestamp', 'Timestamp'),
('en', 'admin', 'logs.user', 'User')

ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - GOALS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'goals', 'title', 'Mục tiêu'),
('vi', 'goals', 'add_goal', 'Thêm mục tiêu'),
('vi', 'goals', 'edit_goal', 'Sửa mục tiêu'),
('vi', 'goals', 'delete_goal', 'Xóa mục tiêu'),
('vi', 'goals', 'goal_title', 'Tiêu đề mục tiêu'),
('vi', 'goals', 'goal_description', 'Mô tả mục tiêu'),
('vi', 'goals', 'target_date', 'Ngày hoàn thành'),
('vi', 'goals', 'progress', 'Tiến độ'),
('vi', 'goals', 'status', 'Trạng thái'),
('vi', 'goals', 'status.active', 'Đang thực hiện'),
('vi', 'goals', 'status.paused', 'Tạm dừng'),
('vi', 'goals', 'status.completed', 'Hoàn thành'),
('vi', 'goals', 'status.archived', 'Đã lưu trữ'),
('vi', 'goals', 'priority', 'Ưu tiên'),
('vi', 'goals', 'area', 'Lĩnh vực'),
('vi', 'goals', 'milestones', 'Cột mốc'),
('vi', 'goals', 'add_milestone', 'Thêm cột mốc'),
('vi', 'goals', 'linked_habits', 'Thói quen liên kết'),
('vi', 'goals', 'linked_tasks', 'Công việc liên kết'),
('vi', 'goals', 'streak', 'Chuỗi ngày'),
('vi', 'goals', 'current_streak', 'Chuỗi hiện tại'),
('vi', 'goals', 'best_streak', 'Chuỗi tốt nhất'),
('vi', 'goals', 'focus_mode', 'Chế độ tập trung'),
('vi', 'goals', 'set_focus', 'Đặt làm trọng tâm'),
('vi', 'goals', 'remove_focus', 'Bỏ trọng tâm'),
('vi', 'goals', 'dependencies', 'Phụ thuộc'),
('vi', 'goals', 'dependents', 'Mục tiêu phụ thuộc'),
('vi', 'goals', 'collaborators', 'Cộng tác viên'),
('vi', 'goals', 'add_collaborator', 'Thêm cộng tác viên'),
('vi', 'goals', 'share_goal', 'Chia sẻ mục tiêu'),
('vi', 'goals', 'make_public', 'Công khai'),
('vi', 'goals', 'make_private', 'Riêng tư'),
('vi', 'goals', 'vision_board', 'Bảng tầm nhìn'),
('vi', 'goals', 'add_vision_item', 'Thêm mục tầm nhìn'),
('vi', 'goals', 'reminder', 'Nhắc nhở'),
('vi', 'goals', 'enable_reminder', 'Bật nhắc nhở'),
('vi', 'goals', 'reminder_days', 'Nhắc sau (ngày)'),
('vi', 'goals', 'analytics', 'Phân tích'),
('vi', 'goals', 'progress_history', 'Lịch sử tiến độ'),
('vi', 'goals', 'activity_log', 'Nhật ký hoạt động'),
('vi', 'goals', 'no_goals', 'Chưa có mục tiêu nào'),
('vi', 'goals', 'create_first_goal', 'Tạo mục tiêu đầu tiên'),
('vi', 'goals', 'goal_completed', 'Mục tiêu đã hoàn thành!'),
('vi', 'goals', 'days_remaining', 'ngày còn lại'),
('vi', 'goals', 'overdue', 'Quá hạn'),
('vi', 'goals', 'on_track', 'Đúng tiến độ'),
('vi', 'goals', 'behind_schedule', 'Chậm tiến độ'),
('vi', 'goals', 'filter.all', 'Tất cả'),
('vi', 'goals', 'filter.active', 'Đang thực hiện'),
('vi', 'goals', 'filter.completed', 'Hoàn thành'),
('vi', 'goals', 'filter.focused', 'Trọng tâm'),
('vi', 'goals', 'sort.newest', 'Mới nhất'),
('vi', 'goals', 'sort.oldest', 'Cũ nhất'),
('vi', 'goals', 'sort.deadline', 'Hạn chót'),
('vi', 'goals', 'sort.progress', 'Tiến độ'),
('vi', 'goals', 'sort.priority', 'Ưu tiên')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - GOALS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'goals', 'title', 'Goals'),
('en', 'goals', 'add_goal', 'Add Goal'),
('en', 'goals', 'edit_goal', 'Edit Goal'),
('en', 'goals', 'delete_goal', 'Delete Goal'),
('en', 'goals', 'goal_title', 'Goal Title'),
('en', 'goals', 'goal_description', 'Goal Description'),
('en', 'goals', 'target_date', 'Target Date'),
('en', 'goals', 'progress', 'Progress'),
('en', 'goals', 'status', 'Status'),
('en', 'goals', 'status.active', 'Active'),
('en', 'goals', 'status.paused', 'Paused'),
('en', 'goals', 'status.completed', 'Completed'),
('en', 'goals', 'status.archived', 'Archived'),
('en', 'goals', 'priority', 'Priority'),
('en', 'goals', 'area', 'Life Area'),
('en', 'goals', 'milestones', 'Milestones'),
('en', 'goals', 'add_milestone', 'Add Milestone'),
('en', 'goals', 'linked_habits', 'Linked Habits'),
('en', 'goals', 'linked_tasks', 'Linked Tasks'),
('en', 'goals', 'streak', 'Streak'),
('en', 'goals', 'current_streak', 'Current Streak'),
('en', 'goals', 'best_streak', 'Best Streak'),
('en', 'goals', 'focus_mode', 'Focus Mode'),
('en', 'goals', 'set_focus', 'Set as Focus'),
('en', 'goals', 'remove_focus', 'Remove Focus'),
('en', 'goals', 'dependencies', 'Dependencies'),
('en', 'goals', 'dependents', 'Dependent Goals'),
('en', 'goals', 'collaborators', 'Collaborators'),
('en', 'goals', 'add_collaborator', 'Add Collaborator'),
('en', 'goals', 'share_goal', 'Share Goal'),
('en', 'goals', 'make_public', 'Make Public'),
('en', 'goals', 'make_private', 'Make Private'),
('en', 'goals', 'vision_board', 'Vision Board'),
('en', 'goals', 'add_vision_item', 'Add Vision Item'),
('en', 'goals', 'reminder', 'Reminder'),
('en', 'goals', 'enable_reminder', 'Enable Reminder'),
('en', 'goals', 'reminder_days', 'Remind After (days)'),
('en', 'goals', 'analytics', 'Analytics'),
('en', 'goals', 'progress_history', 'Progress History'),
('en', 'goals', 'activity_log', 'Activity Log'),
('en', 'goals', 'no_goals', 'No goals yet'),
('en', 'goals', 'create_first_goal', 'Create your first goal'),
('en', 'goals', 'goal_completed', 'Goal completed!'),
('en', 'goals', 'days_remaining', 'days remaining'),
('en', 'goals', 'overdue', 'Overdue'),
('en', 'goals', 'on_track', 'On Track'),
('en', 'goals', 'behind_schedule', 'Behind Schedule'),
('en', 'goals', 'filter.all', 'All'),
('en', 'goals', 'filter.active', 'Active'),
('en', 'goals', 'filter.completed', 'Completed'),
('en', 'goals', 'filter.focused', 'Focused'),
('en', 'goals', 'sort.newest', 'Newest'),
('en', 'goals', 'sort.oldest', 'Oldest'),
('en', 'goals', 'sort.deadline', 'Deadline'),
('en', 'goals', 'sort.progress', 'Progress'),
('en', 'goals', 'sort.priority', 'Priority')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - HABITS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'habits', 'title', 'Thói quen'),
('vi', 'habits', 'add_habit', 'Thêm thói quen'),
('vi', 'habits', 'edit_habit', 'Sửa thói quen'),
('vi', 'habits', 'delete_habit', 'Xóa thói quen'),
('vi', 'habits', 'habit_name', 'Tên thói quen'),
('vi', 'habits', 'habit_description', 'Mô tả thói quen'),
('vi', 'habits', 'frequency', 'Tần suất'),
('vi', 'habits', 'frequency.daily', 'Hàng ngày'),
('vi', 'habits', 'frequency.weekly', 'Hàng tuần'),
('vi', 'habits', 'frequency.custom', 'Tùy chỉnh'),
('vi', 'habits', 'target_days', 'Số ngày mục tiêu'),
('vi', 'habits', 'target_per_day', 'Số lần/ngày'),
('vi', 'habits', 'target_unit', 'Đơn vị'),
('vi', 'habits', 'streak', 'Chuỗi ngày'),
('vi', 'habits', 'current_streak', 'Chuỗi hiện tại'),
('vi', 'habits', 'best_streak', 'Chuỗi tốt nhất'),
('vi', 'habits', 'completion_rate', 'Tỷ lệ hoàn thành'),
('vi', 'habits', 'completed_today', 'Đã hoàn thành hôm nay'),
('vi', 'habits', 'mark_complete', 'Đánh dấu hoàn thành'),
('vi', 'habits', 'mark_incomplete', 'Bỏ đánh dấu'),
('vi', 'habits', 'history', 'Lịch sử'),
('vi', 'habits', 'view_history', 'Xem lịch sử'),
('vi', 'habits', 'calendar_view', 'Xem lịch'),
('vi', 'habits', 'list_view', 'Xem danh sách'),
('vi', 'habits', 'compact_view', 'Xem thu gọn'),
('vi', 'habits', 'area', 'Lĩnh vực'),
('vi', 'habits', 'icon', 'Biểu tượng'),
('vi', 'habits', 'color', 'Màu sắc'),
('vi', 'habits', 'reminder', 'Nhắc nhở'),
('vi', 'habits', 'reminder_time', 'Giờ nhắc nhở'),
('vi', 'habits', 'enable_reminder', 'Bật nhắc nhở'),
('vi', 'habits', 'linked_goal', 'Mục tiêu liên kết'),
('vi', 'habits', 'challenge', 'Thử thách'),
('vi', 'habits', 'start_challenge', 'Bắt đầu thử thách'),
('vi', 'habits', 'challenge.21_day', 'Thử thách 21 ngày'),
('vi', 'habits', 'challenge.30_day', 'Thử thách 30 ngày'),
('vi', 'habits', 'challenge.66_day', 'Thử thách 66 ngày'),
('vi', 'habits', 'challenge_progress', 'Tiến độ thử thách'),
('vi', 'habits', 'competition', 'Cuộc thi'),
('vi', 'habits', 'create_competition', 'Tạo cuộc thi'),
('vi', 'habits', 'prediction', 'Dự đoán'),
('vi', 'habits', 'habit_prediction', 'Dự đoán thói quen'),
('vi', 'habits', 'archive_habit', 'Lưu trữ thói quen'),
('vi', 'habits', 'restore_habit', 'Khôi phục thói quen'),
('vi', 'habits', 'archived_habits', 'Thói quen đã lưu trữ'),
('vi', 'habits', 'no_habits', 'Chưa có thói quen nào'),
('vi', 'habits', 'create_first_habit', 'Tạo thói quen đầu tiên'),
('vi', 'habits', 'days_completed', 'ngày hoàn thành'),
('vi', 'habits', 'custom_days', 'Chọn ngày cụ thể'),
('vi', 'habits', 'monday', 'Thứ 2'),
('vi', 'habits', 'tuesday', 'Thứ 3'),
('vi', 'habits', 'wednesday', 'Thứ 4'),
('vi', 'habits', 'thursday', 'Thứ 5'),
('vi', 'habits', 'friday', 'Thứ 6'),
('vi', 'habits', 'saturday', 'Thứ 7'),
('vi', 'habits', 'sunday', 'Chủ nhật'),
('vi', 'habits', 'filter.all', 'Tất cả'),
('vi', 'habits', 'filter.today', 'Hôm nay'),
('vi', 'habits', 'filter.completed', 'Đã hoàn thành'),
('vi', 'habits', 'filter.pending', 'Chưa hoàn thành'),
('vi', 'habits', 'group_by_area', 'Nhóm theo lĩnh vực'),
('vi', 'habits', 'sort.name', 'Theo tên'),
('vi', 'habits', 'sort.streak', 'Theo chuỗi'),
('vi', 'habits', 'sort.completion', 'Theo hoàn thành')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - HABITS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'habits', 'title', 'Habits'),
('en', 'habits', 'add_habit', 'Add Habit'),
('en', 'habits', 'edit_habit', 'Edit Habit'),
('en', 'habits', 'delete_habit', 'Delete Habit'),
('en', 'habits', 'habit_name', 'Habit Name'),
('en', 'habits', 'habit_description', 'Habit Description'),
('en', 'habits', 'frequency', 'Frequency'),
('en', 'habits', 'frequency.daily', 'Daily'),
('en', 'habits', 'frequency.weekly', 'Weekly'),
('en', 'habits', 'frequency.custom', 'Custom'),
('en', 'habits', 'target_days', 'Target Days'),
('en', 'habits', 'target_per_day', 'Times per Day'),
('en', 'habits', 'target_unit', 'Unit'),
('en', 'habits', 'streak', 'Streak'),
('en', 'habits', 'current_streak', 'Current Streak'),
('en', 'habits', 'best_streak', 'Best Streak'),
('en', 'habits', 'completion_rate', 'Completion Rate'),
('en', 'habits', 'completed_today', 'Completed Today'),
('en', 'habits', 'mark_complete', 'Mark Complete'),
('en', 'habits', 'mark_incomplete', 'Mark Incomplete'),
('en', 'habits', 'history', 'History'),
('en', 'habits', 'view_history', 'View History'),
('en', 'habits', 'calendar_view', 'Calendar View'),
('en', 'habits', 'list_view', 'List View'),
('en', 'habits', 'compact_view', 'Compact View'),
('en', 'habits', 'area', 'Life Area'),
('en', 'habits', 'icon', 'Icon'),
('en', 'habits', 'color', 'Color'),
('en', 'habits', 'reminder', 'Reminder'),
('en', 'habits', 'reminder_time', 'Reminder Time'),
('en', 'habits', 'enable_reminder', 'Enable Reminder'),
('en', 'habits', 'linked_goal', 'Linked Goal'),
('en', 'habits', 'challenge', 'Challenge'),
('en', 'habits', 'start_challenge', 'Start Challenge'),
('en', 'habits', 'challenge.21_day', '21-Day Challenge'),
('en', 'habits', 'challenge.30_day', '30-Day Challenge'),
('en', 'habits', 'challenge.66_day', '66-Day Challenge'),
('en', 'habits', 'challenge_progress', 'Challenge Progress'),
('en', 'habits', 'competition', 'Competition'),
('en', 'habits', 'create_competition', 'Create Competition'),
('en', 'habits', 'prediction', 'Prediction'),
('en', 'habits', 'habit_prediction', 'Habit Prediction'),
('en', 'habits', 'archive_habit', 'Archive Habit'),
('en', 'habits', 'restore_habit', 'Restore Habit'),
('en', 'habits', 'archived_habits', 'Archived Habits'),
('en', 'habits', 'no_habits', 'No habits yet'),
('en', 'habits', 'create_first_habit', 'Create your first habit'),
('en', 'habits', 'days_completed', 'days completed'),
('en', 'habits', 'custom_days', 'Select specific days'),
('en', 'habits', 'monday', 'Monday'),
('en', 'habits', 'tuesday', 'Tuesday'),
('en', 'habits', 'wednesday', 'Wednesday'),
('en', 'habits', 'thursday', 'Thursday'),
('en', 'habits', 'friday', 'Friday'),
('en', 'habits', 'saturday', 'Saturday'),
('en', 'habits', 'sunday', 'Sunday'),
('en', 'habits', 'filter.all', 'All'),
('en', 'habits', 'filter.today', 'Today'),
('en', 'habits', 'filter.completed', 'Completed'),
('en', 'habits', 'filter.pending', 'Pending'),
('en', 'habits', 'group_by_area', 'Group by Area'),
('en', 'habits', 'sort.name', 'By Name'),
('en', 'habits', 'sort.streak', 'By Streak'),
('en', 'habits', 'sort.completion', 'By Completion')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TASKS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'tasks', 'title', 'Công việc'),
('vi', 'tasks', 'add_task', 'Thêm công việc'),
('vi', 'tasks', 'edit_task', 'Sửa công việc'),
('vi', 'tasks', 'delete_task', 'Xóa công việc'),
('vi', 'tasks', 'task_title', 'Tiêu đề công việc'),
('vi', 'tasks', 'task_description', 'Mô tả công việc'),
('vi', 'tasks', 'due_date', 'Hạn chót'),
('vi', 'tasks', 'priority', 'Ưu tiên'),
('vi', 'tasks', 'priority.low', 'Thấp'),
('vi', 'tasks', 'priority.medium', 'Trung bình'),
('vi', 'tasks', 'priority.high', 'Cao'),
('vi', 'tasks', 'status', 'Trạng thái'),
('vi', 'tasks', 'status.todo', 'Cần làm'),
('vi', 'tasks', 'status.in_progress', 'Đang làm'),
('vi', 'tasks', 'status.done', 'Hoàn thành'),
('vi', 'tasks', 'status.deferred', 'Hoãn lại'),
('vi', 'tasks', 'area', 'Lĩnh vực'),
('vi', 'tasks', 'tags', 'Thẻ'),
('vi', 'tasks', 'add_tag', 'Thêm thẻ'),
('vi', 'tasks', 'subtasks', 'Công việc con'),
('vi', 'tasks', 'add_subtask', 'Thêm công việc con'),
('vi', 'tasks', 'linked_goal', 'Mục tiêu liên kết'),
('vi', 'tasks', 'linked_milestone', 'Cột mốc liên kết'),
('vi', 'tasks', 'pomodoro', 'Pomodoro'),
('vi', 'tasks', 'estimated_pomodoros', 'Số pomodoro ước tính'),
('vi', 'tasks', 'completed_pomodoros', 'Số pomodoro đã hoàn thành'),
('vi', 'tasks', 'start_pomodoro', 'Bắt đầu Pomodoro'),
('vi', 'tasks', 'recurring', 'Lặp lại'),
('vi', 'tasks', 'recurring.daily', 'Hàng ngày'),
('vi', 'tasks', 'recurring.weekly', 'Hàng tuần'),
('vi', 'tasks', 'recurring.monthly', 'Hàng tháng'),
('vi', 'tasks', 'recurring_interval', 'Khoảng cách lặp'),
('vi', 'tasks', 'recurring_end_date', 'Ngày kết thúc lặp'),
('vi', 'tasks', 'reminder', 'Nhắc nhở'),
('vi', 'tasks', 'reminder_minutes', 'Nhắc trước (phút)'),
('vi', 'tasks', 'kanban_view', 'Xem Kanban'),
('vi', 'tasks', 'list_view', 'Xem danh sách'),
('vi', 'tasks', 'calendar_view', 'Xem lịch'),
('vi', 'tasks', 'column.todo', 'Cần làm'),
('vi', 'tasks', 'column.in_progress', 'Đang làm'),
('vi', 'tasks', 'column.done', 'Hoàn thành'),
('vi', 'tasks', 'column.deferred', 'Hoãn lại'),
('vi', 'tasks', 'archive_task', 'Lưu trữ công việc'),
('vi', 'tasks', 'restore_task', 'Khôi phục công việc'),
('vi', 'tasks', 'archived_tasks', 'Công việc đã lưu trữ'),
('vi', 'tasks', 'no_tasks', 'Chưa có công việc nào'),
('vi', 'tasks', 'create_first_task', 'Tạo công việc đầu tiên'),
('vi', 'tasks', 'overdue', 'Quá hạn'),
('vi', 'tasks', 'due_today', 'Hết hạn hôm nay'),
('vi', 'tasks', 'due_tomorrow', 'Hết hạn ngày mai'),
('vi', 'tasks', 'due_this_week', 'Hết hạn tuần này'),
('vi', 'tasks', 'no_due_date', 'Không có hạn chót'),
('vi', 'tasks', 'filter.all', 'Tất cả'),
('vi', 'tasks', 'filter.today', 'Hôm nay'),
('vi', 'tasks', 'filter.upcoming', 'Sắp tới'),
('vi', 'tasks', 'filter.overdue', 'Quá hạn'),
('vi', 'tasks', 'filter.completed', 'Đã hoàn thành'),
('vi', 'tasks', 'sort.due_date', 'Theo hạn chót'),
('vi', 'tasks', 'sort.priority', 'Theo ưu tiên'),
('vi', 'tasks', 'sort.created', 'Theo ngày tạo'),
('vi', 'tasks', 'sort.name', 'Theo tên'),
('vi', 'tasks', 'productivity', 'Năng suất'),
('vi', 'tasks', 'tasks_completed', 'Công việc hoàn thành'),
('vi', 'tasks', 'completion_rate', 'Tỷ lệ hoàn thành'),
('vi', 'tasks', 'drag_to_move', 'Kéo để di chuyển')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TASKS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'tasks', 'title', 'Tasks'),
('en', 'tasks', 'add_task', 'Add Task'),
('en', 'tasks', 'edit_task', 'Edit Task'),
('en', 'tasks', 'delete_task', 'Delete Task'),
('en', 'tasks', 'task_title', 'Task Title'),
('en', 'tasks', 'task_description', 'Task Description'),
('en', 'tasks', 'due_date', 'Due Date'),
('en', 'tasks', 'priority', 'Priority'),
('en', 'tasks', 'priority.low', 'Low'),
('en', 'tasks', 'priority.medium', 'Medium'),
('en', 'tasks', 'priority.high', 'High'),
('en', 'tasks', 'status', 'Status'),
('en', 'tasks', 'status.todo', 'To Do'),
('en', 'tasks', 'status.in_progress', 'In Progress'),
('en', 'tasks', 'status.done', 'Done'),
('en', 'tasks', 'status.deferred', 'Deferred'),
('en', 'tasks', 'area', 'Life Area'),
('en', 'tasks', 'tags', 'Tags'),
('en', 'tasks', 'add_tag', 'Add Tag'),
('en', 'tasks', 'subtasks', 'Subtasks'),
('en', 'tasks', 'add_subtask', 'Add Subtask'),
('en', 'tasks', 'linked_goal', 'Linked Goal'),
('en', 'tasks', 'linked_milestone', 'Linked Milestone'),
('en', 'tasks', 'pomodoro', 'Pomodoro'),
('en', 'tasks', 'estimated_pomodoros', 'Estimated Pomodoros'),
('en', 'tasks', 'completed_pomodoros', 'Completed Pomodoros'),
('en', 'tasks', 'start_pomodoro', 'Start Pomodoro'),
('en', 'tasks', 'recurring', 'Recurring'),
('en', 'tasks', 'recurring.daily', 'Daily'),
('en', 'tasks', 'recurring.weekly', 'Weekly'),
('en', 'tasks', 'recurring.monthly', 'Monthly'),
('en', 'tasks', 'recurring_interval', 'Repeat Interval'),
('en', 'tasks', 'recurring_end_date', 'Repeat End Date'),
('en', 'tasks', 'reminder', 'Reminder'),
('en', 'tasks', 'reminder_minutes', 'Remind Before (minutes)'),
('en', 'tasks', 'kanban_view', 'Kanban View'),
('en', 'tasks', 'list_view', 'List View'),
('en', 'tasks', 'calendar_view', 'Calendar View'),
('en', 'tasks', 'column.todo', 'To Do'),
('en', 'tasks', 'column.in_progress', 'In Progress'),
('en', 'tasks', 'column.done', 'Done'),
('en', 'tasks', 'column.deferred', 'Deferred'),
('en', 'tasks', 'archive_task', 'Archive Task'),
('en', 'tasks', 'restore_task', 'Restore Task'),
('en', 'tasks', 'archived_tasks', 'Archived Tasks'),
('en', 'tasks', 'no_tasks', 'No tasks yet'),
('en', 'tasks', 'create_first_task', 'Create your first task'),
('en', 'tasks', 'overdue', 'Overdue'),
('en', 'tasks', 'due_today', 'Due Today'),
('en', 'tasks', 'due_tomorrow', 'Due Tomorrow'),
('en', 'tasks', 'due_this_week', 'Due This Week'),
('en', 'tasks', 'no_due_date', 'No Due Date'),
('en', 'tasks', 'filter.all', 'All'),
('en', 'tasks', 'filter.today', 'Today'),
('en', 'tasks', 'filter.upcoming', 'Upcoming'),
('en', 'tasks', 'filter.overdue', 'Overdue'),
('en', 'tasks', 'filter.completed', 'Completed'),
('en', 'tasks', 'sort.due_date', 'By Due Date'),
('en', 'tasks', 'sort.priority', 'By Priority'),
('en', 'tasks', 'sort.created', 'By Created Date'),
('en', 'tasks', 'sort.name', 'By Name'),
('en', 'tasks', 'productivity', 'Productivity'),
('en', 'tasks', 'tasks_completed', 'Tasks Completed'),
('en', 'tasks', 'completion_rate', 'Completion Rate'),
('en', 'tasks', 'drag_to_move', 'Drag to move')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - JOURNAL MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'journal', 'title', 'Nhật ký'),
('vi', 'journal', 'add_entry', 'Thêm bài viết'),
('vi', 'journal', 'edit_entry', 'Sửa bài viết'),
('vi', 'journal', 'delete_entry', 'Xóa bài viết'),
('vi', 'journal', 'entry_content', 'Nội dung'),
('vi', 'journal', 'date', 'Ngày'),
('vi', 'journal', 'mood', 'Tâm trạng'),
('vi', 'journal', 'mood.very_bad', 'Rất tệ'),
('vi', 'journal', 'mood.bad', 'Tệ'),
('vi', 'journal', 'mood.neutral', 'Bình thường'),
('vi', 'journal', 'mood.good', 'Tốt'),
('vi', 'journal', 'mood.very_good', 'Rất tốt'),
('vi', 'journal', 'energy', 'Năng lượng'),
('vi', 'journal', 'energy.very_low', 'Rất thấp'),
('vi', 'journal', 'energy.low', 'Thấp'),
('vi', 'journal', 'energy.medium', 'Trung bình'),
('vi', 'journal', 'energy.high', 'Cao'),
('vi', 'journal', 'energy.very_high', 'Rất cao'),
('vi', 'journal', 'gratitude', 'Biết ơn'),
('vi', 'journal', 'add_gratitude', 'Thêm điều biết ơn'),
('vi', 'journal', 'gratitude_placeholder', 'Hôm nay bạn biết ơn điều gì?'),
('vi', 'journal', 'tags', 'Thẻ'),
('vi', 'journal', 'add_tag', 'Thêm thẻ'),
('vi', 'journal', 'areas', 'Lĩnh vực liên quan'),
('vi', 'journal', 'images', 'Hình ảnh'),
('vi', 'journal', 'add_image', 'Thêm hình ảnh'),
('vi', 'journal', 'templates', 'Mẫu'),
('vi', 'journal', 'use_template', 'Sử dụng mẫu'),
('vi', 'journal', 'save_as_template', 'Lưu làm mẫu'),
('vi', 'journal', 'calendar_view', 'Xem lịch'),
('vi', 'journal', 'list_view', 'Xem danh sách'),
('vi', 'journal', 'streak', 'Chuỗi viết'),
('vi', 'journal', 'current_streak', 'Chuỗi hiện tại'),
('vi', 'journal', 'best_streak', 'Chuỗi tốt nhất'),
('vi', 'journal', 'total_entries', 'Tổng bài viết'),
('vi', 'journal', 'analytics', 'Phân tích'),
('vi', 'journal', 'mood_trends', 'Xu hướng tâm trạng'),
('vi', 'journal', 'energy_trends', 'Xu hướng năng lượng'),
('vi', 'journal', 'word_count', 'Số từ'),
('vi', 'journal', 'average_mood', 'Tâm trạng trung bình'),
('vi', 'journal', 'average_energy', 'Năng lượng trung bình'),
('vi', 'journal', 'no_entries', 'Chưa có bài viết nào'),
('vi', 'journal', 'write_first_entry', 'Viết bài nhật ký đầu tiên'),
('vi', 'journal', 'search_entries', 'Tìm kiếm bài viết...'),
('vi', 'journal', 'filter.all', 'Tất cả'),
('vi', 'journal', 'filter.this_week', 'Tuần này'),
('vi', 'journal', 'filter.this_month', 'Tháng này'),
('vi', 'journal', 'filter.favorites', 'Yêu thích'),
('vi', 'journal', 'filter.with_gratitude', 'Có biết ơn'),
('vi', 'journal', 'sort.newest', 'Mới nhất'),
('vi', 'journal', 'sort.oldest', 'Cũ nhất'),
('vi', 'journal', 'sort.mood', 'Theo tâm trạng'),
('vi', 'journal', 'prompts', 'Gợi ý viết'),
('vi', 'journal', 'get_prompt', 'Lấy gợi ý'),
('vi', 'journal', 'history', 'Lịch sử chỉnh sửa'),
('vi', 'journal', 'view_history', 'Xem lịch sử')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - JOURNAL MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'journal', 'title', 'Journal'),
('en', 'journal', 'add_entry', 'Add Entry'),
('en', 'journal', 'edit_entry', 'Edit Entry'),
('en', 'journal', 'delete_entry', 'Delete Entry'),
('en', 'journal', 'entry_content', 'Content'),
('en', 'journal', 'date', 'Date'),
('en', 'journal', 'mood', 'Mood'),
('en', 'journal', 'mood.very_bad', 'Very Bad'),
('en', 'journal', 'mood.bad', 'Bad'),
('en', 'journal', 'mood.neutral', 'Neutral'),
('en', 'journal', 'mood.good', 'Good'),
('en', 'journal', 'mood.very_good', 'Very Good'),
('en', 'journal', 'energy', 'Energy'),
('en', 'journal', 'energy.very_low', 'Very Low'),
('en', 'journal', 'energy.low', 'Low'),
('en', 'journal', 'energy.medium', 'Medium'),
('en', 'journal', 'energy.high', 'High'),
('en', 'journal', 'energy.very_high', 'Very High'),
('en', 'journal', 'gratitude', 'Gratitude'),
('en', 'journal', 'add_gratitude', 'Add Gratitude'),
('en', 'journal', 'gratitude_placeholder', 'What are you grateful for today?'),
('en', 'journal', 'tags', 'Tags'),
('en', 'journal', 'add_tag', 'Add Tag'),
('en', 'journal', 'areas', 'Related Areas'),
('en', 'journal', 'images', 'Images'),
('en', 'journal', 'add_image', 'Add Image'),
('en', 'journal', 'templates', 'Templates'),
('en', 'journal', 'use_template', 'Use Template'),
('en', 'journal', 'save_as_template', 'Save as Template'),
('en', 'journal', 'calendar_view', 'Calendar View'),
('en', 'journal', 'list_view', 'List View'),
('en', 'journal', 'streak', 'Writing Streak'),
('en', 'journal', 'current_streak', 'Current Streak'),
('en', 'journal', 'best_streak', 'Best Streak'),
('en', 'journal', 'total_entries', 'Total Entries'),
('en', 'journal', 'analytics', 'Analytics'),
('en', 'journal', 'mood_trends', 'Mood Trends'),
('en', 'journal', 'energy_trends', 'Energy Trends'),
('en', 'journal', 'word_count', 'Word Count'),
('en', 'journal', 'average_mood', 'Average Mood'),
('en', 'journal', 'average_energy', 'Average Energy'),
('en', 'journal', 'no_entries', 'No entries yet'),
('en', 'journal', 'write_first_entry', 'Write your first journal entry'),
('en', 'journal', 'search_entries', 'Search entries...'),
('en', 'journal', 'filter.all', 'All'),
('en', 'journal', 'filter.this_week', 'This Week'),
('en', 'journal', 'filter.this_month', 'This Month'),
('en', 'journal', 'filter.favorites', 'Favorites'),
('en', 'journal', 'filter.with_gratitude', 'With Gratitude'),
('en', 'journal', 'sort.newest', 'Newest'),
('en', 'journal', 'sort.oldest', 'Oldest'),
('en', 'journal', 'sort.mood', 'By Mood'),
('en', 'journal', 'prompts', 'Writing Prompts'),
('en', 'journal', 'get_prompt', 'Get Prompt'),
('en', 'journal', 'history', 'Edit History'),
('en', 'journal', 'view_history', 'View History')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - NOTES MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'notes', 'title', 'Ghi chú'),
('vi', 'notes', 'add_note', 'Thêm ghi chú'),
('vi', 'notes', 'edit_note', 'Sửa ghi chú'),
('vi', 'notes', 'delete_note', 'Xóa ghi chú'),
('vi', 'notes', 'note_title', 'Tiêu đề'),
('vi', 'notes', 'note_content', 'Nội dung'),
('vi', 'notes', 'untitled', 'Không có tiêu đề'),
('vi', 'notes', 'tags', 'Thẻ'),
('vi', 'notes', 'add_tag', 'Thêm thẻ'),
('vi', 'notes', 'area', 'Lĩnh vực'),
('vi', 'notes', 'color', 'Màu sắc'),
('vi', 'notes', 'pin_note', 'Ghim ghi chú'),
('vi', 'notes', 'unpin_note', 'Bỏ ghim'),
('vi', 'notes', 'pinned', 'Đã ghim'),
('vi', 'notes', 'favorite', 'Yêu thích'),
('vi', 'notes', 'add_to_favorites', 'Thêm vào yêu thích'),
('vi', 'notes', 'remove_from_favorites', 'Bỏ khỏi yêu thích'),
('vi', 'notes', 'archive_note', 'Lưu trữ ghi chú'),
('vi', 'notes', 'restore_note', 'Khôi phục ghi chú'),
('vi', 'notes', 'archived_notes', 'Ghi chú đã lưu trữ'),
('vi', 'notes', 'markdown_editor', 'Trình soạn thảo Markdown'),
('vi', 'notes', 'preview', 'Xem trước'),
('vi', 'notes', 'editor', 'Soạn thảo'),
('vi', 'notes', 'split_view', 'Xem chia đôi'),
('vi', 'notes', 'bold', 'In đậm'),
('vi', 'notes', 'italic', 'In nghiêng'),
('vi', 'notes', 'heading', 'Tiêu đề'),
('vi', 'notes', 'link', 'Liên kết'),
('vi', 'notes', 'image', 'Hình ảnh'),
('vi', 'notes', 'code', 'Mã'),
('vi', 'notes', 'quote', 'Trích dẫn'),
('vi', 'notes', 'list', 'Danh sách'),
('vi', 'notes', 'ordered_list', 'Danh sách có thứ tự'),
('vi', 'notes', 'task_list', 'Danh sách công việc'),
('vi', 'notes', 'table', 'Bảng'),
('vi', 'notes', 'created_at', 'Ngày tạo'),
('vi', 'notes', 'updated_at', 'Cập nhật lần cuối'),
('vi', 'notes', 'word_count', 'Số từ'),
('vi', 'notes', 'character_count', 'Số ký tự'),
('vi', 'notes', 'no_notes', 'Chưa có ghi chú nào'),
('vi', 'notes', 'create_first_note', 'Tạo ghi chú đầu tiên'),
('vi', 'notes', 'search_notes', 'Tìm kiếm ghi chú...'),
('vi', 'notes', 'filter.all', 'Tất cả'),
('vi', 'notes', 'filter.pinned', 'Đã ghim'),
('vi', 'notes', 'filter.favorites', 'Yêu thích'),
('vi', 'notes', 'filter.archived', 'Đã lưu trữ'),
('vi', 'notes', 'sort.newest', 'Mới nhất'),
('vi', 'notes', 'sort.oldest', 'Cũ nhất'),
('vi', 'notes', 'sort.title', 'Theo tiêu đề'),
('vi', 'notes', 'sort.updated', 'Cập nhật gần đây'),
('vi', 'notes', 'grid_view', 'Xem lưới'),
('vi', 'notes', 'list_view', 'Xem danh sách'),
('vi', 'notes', 'export_note', 'Xuất ghi chú'),
('vi', 'notes', 'export_markdown', 'Xuất Markdown'),
('vi', 'notes', 'export_pdf', 'Xuất PDF')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - NOTES MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'notes', 'title', 'Notes'),
('en', 'notes', 'add_note', 'Add Note'),
('en', 'notes', 'edit_note', 'Edit Note'),
('en', 'notes', 'delete_note', 'Delete Note'),
('en', 'notes', 'note_title', 'Title'),
('en', 'notes', 'note_content', 'Content'),
('en', 'notes', 'untitled', 'Untitled'),
('en', 'notes', 'tags', 'Tags'),
('en', 'notes', 'add_tag', 'Add Tag'),
('en', 'notes', 'area', 'Life Area'),
('en', 'notes', 'color', 'Color'),
('en', 'notes', 'pin_note', 'Pin Note'),
('en', 'notes', 'unpin_note', 'Unpin'),
('en', 'notes', 'pinned', 'Pinned'),
('en', 'notes', 'favorite', 'Favorite'),
('en', 'notes', 'add_to_favorites', 'Add to Favorites'),
('en', 'notes', 'remove_from_favorites', 'Remove from Favorites'),
('en', 'notes', 'archive_note', 'Archive Note'),
('en', 'notes', 'restore_note', 'Restore Note'),
('en', 'notes', 'archived_notes', 'Archived Notes'),
('en', 'notes', 'markdown_editor', 'Markdown Editor'),
('en', 'notes', 'preview', 'Preview'),
('en', 'notes', 'editor', 'Editor'),
('en', 'notes', 'split_view', 'Split View'),
('en', 'notes', 'bold', 'Bold'),
('en', 'notes', 'italic', 'Italic'),
('en', 'notes', 'heading', 'Heading'),
('en', 'notes', 'link', 'Link'),
('en', 'notes', 'image', 'Image'),
('en', 'notes', 'code', 'Code'),
('en', 'notes', 'quote', 'Quote'),
('en', 'notes', 'list', 'List'),
('en', 'notes', 'ordered_list', 'Ordered List'),
('en', 'notes', 'task_list', 'Task List'),
('en', 'notes', 'table', 'Table'),
('en', 'notes', 'created_at', 'Created At'),
('en', 'notes', 'updated_at', 'Last Updated'),
('en', 'notes', 'word_count', 'Word Count'),
('en', 'notes', 'character_count', 'Character Count'),
('en', 'notes', 'no_notes', 'No notes yet'),
('en', 'notes', 'create_first_note', 'Create your first note'),
('en', 'notes', 'search_notes', 'Search notes...'),
('en', 'notes', 'filter.all', 'All'),
('en', 'notes', 'filter.pinned', 'Pinned'),
('en', 'notes', 'filter.favorites', 'Favorites'),
('en', 'notes', 'filter.archived', 'Archived'),
('en', 'notes', 'sort.newest', 'Newest'),
('en', 'notes', 'sort.oldest', 'Oldest'),
('en', 'notes', 'sort.title', 'By Title'),
('en', 'notes', 'sort.updated', 'Recently Updated'),
('en', 'notes', 'grid_view', 'Grid View'),
('en', 'notes', 'list_view', 'List View'),
('en', 'notes', 'export_note', 'Export Note'),
('en', 'notes', 'export_markdown', 'Export Markdown'),
('en', 'notes', 'export_pdf', 'Export PDF')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - LIFE WHEEL MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'lifewheel', 'title', 'Bánh xe cuộc sống'),
('vi', 'lifewheel', 'description', 'Đánh giá sự cân bằng cuộc sống của bạn'),
('vi', 'lifewheel', 'rate_areas', 'Đánh giá các lĩnh vực'),
('vi', 'lifewheel', 'save_assessment', 'Lưu đánh giá'),
('vi', 'lifewheel', 'new_assessment', 'Đánh giá mới'),
('vi', 'lifewheel', 'current_scores', 'Điểm số hiện tại'),
('vi', 'lifewheel', 'average_score', 'Điểm trung bình'),
('vi', 'lifewheel', 'balance_score', 'Điểm cân bằng'),
('vi', 'lifewheel', 'lowest_area', 'Lĩnh vực thấp nhất'),
('vi', 'lifewheel', 'highest_area', 'Lĩnh vực cao nhất'),
('vi', 'lifewheel', 'improvement_needed', 'Cần cải thiện'),
('vi', 'lifewheel', 'doing_well', 'Đang làm tốt'),
('vi', 'lifewheel', 'history', 'Lịch sử đánh giá'),
('vi', 'lifewheel', 'view_history', 'Xem lịch sử'),
('vi', 'lifewheel', 'compare_periods', 'So sánh các thời kỳ'),
('vi', 'lifewheel', 'trends', 'Xu hướng'),
('vi', 'lifewheel', 'view_trends', 'Xem xu hướng'),
('vi', 'lifewheel', 'weekly_trend', 'Xu hướng tuần'),
('vi', 'lifewheel', 'monthly_trend', 'Xu hướng tháng'),
('vi', 'lifewheel', 'yearly_trend', 'Xu hướng năm'),
('vi', 'lifewheel', 'insights', 'Phân tích'),
('vi', 'lifewheel', 'get_insights', 'Xem phân tích'),
('vi', 'lifewheel', 'ai_suggestions', 'Gợi ý từ AI'),
('vi', 'lifewheel', 'linked_goals', 'Mục tiêu liên quan'),
('vi', 'lifewheel', 'create_goal', 'Tạo mục tiêu cho lĩnh vực này'),
('vi', 'lifewheel', 'area.health', 'Sức khỏe'),
('vi', 'lifewheel', 'area.relationships', 'Mối quan hệ'),
('vi', 'lifewheel', 'area.career', 'Sự nghiệp'),
('vi', 'lifewheel', 'area.finance', 'Tài chính'),
('vi', 'lifewheel', 'area.personal', 'Phát triển cá nhân'),
('vi', 'lifewheel', 'area.fun', 'Giải trí'),
('vi', 'lifewheel', 'area.environment', 'Môi trường sống'),
('vi', 'lifewheel', 'area.spirituality', 'Tâm linh'),
('vi', 'lifewheel', 'area.learning', 'Học tập'),
('vi', 'lifewheel', 'area.contribution', 'Đóng góp'),
('vi', 'lifewheel', 'score.1', 'Rất kém'),
('vi', 'lifewheel', 'score.2', 'Kém'),
('vi', 'lifewheel', 'score.3', 'Dưới trung bình'),
('vi', 'lifewheel', 'score.4', 'Trung bình yếu'),
('vi', 'lifewheel', 'score.5', 'Trung bình'),
('vi', 'lifewheel', 'score.6', 'Trên trung bình'),
('vi', 'lifewheel', 'score.7', 'Khá tốt'),
('vi', 'lifewheel', 'score.8', 'Tốt'),
('vi', 'lifewheel', 'score.9', 'Rất tốt'),
('vi', 'lifewheel', 'score.10', 'Xuất sắc'),
('vi', 'lifewheel', 'no_assessments', 'Chưa có đánh giá nào'),
('vi', 'lifewheel', 'start_first_assessment', 'Bắt đầu đánh giá đầu tiên'),
('vi', 'lifewheel', 'last_assessment', 'Đánh giá gần nhất'),
('vi', 'lifewheel', 'change_from_last', 'Thay đổi so với lần trước'),
('vi', 'lifewheel', 'improved', 'Cải thiện'),
('vi', 'lifewheel', 'declined', 'Giảm'),
('vi', 'lifewheel', 'unchanged', 'Không đổi')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - LIFE WHEEL MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'lifewheel', 'title', 'Life Wheel'),
('en', 'lifewheel', 'description', 'Assess your life balance'),
('en', 'lifewheel', 'rate_areas', 'Rate Areas'),
('en', 'lifewheel', 'save_assessment', 'Save Assessment'),
('en', 'lifewheel', 'new_assessment', 'New Assessment'),
('en', 'lifewheel', 'current_scores', 'Current Scores'),
('en', 'lifewheel', 'average_score', 'Average Score'),
('en', 'lifewheel', 'balance_score', 'Balance Score'),
('en', 'lifewheel', 'lowest_area', 'Lowest Area'),
('en', 'lifewheel', 'highest_area', 'Highest Area'),
('en', 'lifewheel', 'improvement_needed', 'Needs Improvement'),
('en', 'lifewheel', 'doing_well', 'Doing Well'),
('en', 'lifewheel', 'history', 'Assessment History'),
('en', 'lifewheel', 'view_history', 'View History'),
('en', 'lifewheel', 'compare_periods', 'Compare Periods'),
('en', 'lifewheel', 'trends', 'Trends'),
('en', 'lifewheel', 'view_trends', 'View Trends'),
('en', 'lifewheel', 'weekly_trend', 'Weekly Trend'),
('en', 'lifewheel', 'monthly_trend', 'Monthly Trend'),
('en', 'lifewheel', 'yearly_trend', 'Yearly Trend'),
('en', 'lifewheel', 'insights', 'Insights'),
('en', 'lifewheel', 'get_insights', 'Get Insights'),
('en', 'lifewheel', 'ai_suggestions', 'AI Suggestions'),
('en', 'lifewheel', 'linked_goals', 'Linked Goals'),
('en', 'lifewheel', 'create_goal', 'Create Goal for this Area'),
('en', 'lifewheel', 'area.health', 'Health'),
('en', 'lifewheel', 'area.relationships', 'Relationships'),
('en', 'lifewheel', 'area.career', 'Career'),
('en', 'lifewheel', 'area.finance', 'Finance'),
('en', 'lifewheel', 'area.personal', 'Personal Growth'),
('en', 'lifewheel', 'area.fun', 'Fun & Recreation'),
('en', 'lifewheel', 'area.environment', 'Physical Environment'),
('en', 'lifewheel', 'area.spirituality', 'Spirituality'),
('en', 'lifewheel', 'area.learning', 'Learning'),
('en', 'lifewheel', 'area.contribution', 'Contribution'),
('en', 'lifewheel', 'score.1', 'Very Poor'),
('en', 'lifewheel', 'score.2', 'Poor'),
('en', 'lifewheel', 'score.3', 'Below Average'),
('en', 'lifewheel', 'score.4', 'Fair'),
('en', 'lifewheel', 'score.5', 'Average'),
('en', 'lifewheel', 'score.6', 'Above Average'),
('en', 'lifewheel', 'score.7', 'Good'),
('en', 'lifewheel', 'score.8', 'Very Good'),
('en', 'lifewheel', 'score.9', 'Excellent'),
('en', 'lifewheel', 'score.10', 'Outstanding'),
('en', 'lifewheel', 'no_assessments', 'No assessments yet'),
('en', 'lifewheel', 'start_first_assessment', 'Start your first assessment'),
('en', 'lifewheel', 'last_assessment', 'Last Assessment'),
('en', 'lifewheel', 'change_from_last', 'Change from Last'),
('en', 'lifewheel', 'improved', 'Improved'),
('en', 'lifewheel', 'declined', 'Declined'),
('en', 'lifewheel', 'unchanged', 'Unchanged')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - WEEKLY REVIEW MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'weeklyreview', 'title', 'Đánh giá tuần'),
('vi', 'weeklyreview', 'description', 'Nhìn lại tuần qua và lên kế hoạch tuần tới'),
('vi', 'weeklyreview', 'start_review', 'Bắt đầu đánh giá'),
('vi', 'weeklyreview', 'continue_review', 'Tiếp tục đánh giá'),
('vi', 'weeklyreview', 'complete_review', 'Hoàn thành đánh giá'),
('vi', 'weeklyreview', 'save_draft', 'Lưu nháp'),
('vi', 'weeklyreview', 'week_of', 'Tuần'),
('vi', 'weeklyreview', 'current_week', 'Tuần này'),
('vi', 'weeklyreview', 'previous_week', 'Tuần trước'),
('vi', 'weeklyreview', 'overall_rating', 'Đánh giá tổng thể'),
('vi', 'weeklyreview', 'rate_your_week', 'Đánh giá tuần của bạn'),
('vi', 'weeklyreview', 'highlight', 'Điểm sáng'),
('vi', 'weeklyreview', 'highlight_placeholder', 'Điều tốt nhất tuần này là gì?'),
('vi', 'weeklyreview', 'lowlight', 'Điểm chưa tốt'),
('vi', 'weeklyreview', 'lowlight_placeholder', 'Điều gì chưa được như ý?'),
('vi', 'weeklyreview', 'wins', 'Thành tựu'),
('vi', 'weeklyreview', 'add_win', 'Thêm thành tựu'),
('vi', 'weeklyreview', 'win_placeholder', 'Bạn đã đạt được gì?'),
('vi', 'weeklyreview', 'challenges', 'Thách thức'),
('vi', 'weeklyreview', 'add_challenge', 'Thêm thách thức'),
('vi', 'weeklyreview', 'challenge_placeholder', 'Bạn gặp khó khăn gì?'),
('vi', 'weeklyreview', 'lessons_learned', 'Bài học'),
('vi', 'weeklyreview', 'add_lesson', 'Thêm bài học'),
('vi', 'weeklyreview', 'lesson_placeholder', 'Bạn học được gì?'),
('vi', 'weeklyreview', 'gratitude', 'Biết ơn'),
('vi', 'weeklyreview', 'add_gratitude', 'Thêm điều biết ơn'),
('vi', 'weeklyreview', 'gratitude_placeholder', 'Bạn biết ơn điều gì tuần này?'),
('vi', 'weeklyreview', 'next_week_focus', 'Trọng tâm tuần tới'),
('vi', 'weeklyreview', 'add_focus', 'Thêm trọng tâm'),
('vi', 'weeklyreview', 'focus_placeholder', 'Bạn muốn tập trung vào gì?'),
('vi', 'weeklyreview', 'area_ratings', 'Đánh giá theo lĩnh vực'),
('vi', 'weeklyreview', 'rate_areas', 'Đánh giá các lĩnh vực'),
('vi', 'weeklyreview', 'history', 'Lịch sử đánh giá'),
('vi', 'weeklyreview', 'view_history', 'Xem lịch sử'),
('vi', 'weeklyreview', 'insights', 'Phân tích'),
('vi', 'weeklyreview', 'weekly_insights', 'Phân tích tuần'),
('vi', 'weeklyreview', 'trends', 'Xu hướng'),
('vi', 'weeklyreview', 'rating_trend', 'Xu hướng đánh giá'),
('vi', 'weeklyreview', 'area_trends', 'Xu hướng theo lĩnh vực'),
('vi', 'weeklyreview', 'reminder', 'Nhắc nhở'),
('vi', 'weeklyreview', 'set_reminder', 'Đặt nhắc nhở'),
('vi', 'weeklyreview', 'reminder_day', 'Ngày nhắc nhở'),
('vi', 'weeklyreview', 'reminder_time', 'Giờ nhắc nhở'),
('vi', 'weeklyreview', 'prompts', 'Câu hỏi gợi ý'),
('vi', 'weeklyreview', 'reflection_prompts', 'Gợi ý suy ngẫm'),
('vi', 'weeklyreview', 'chart', 'Biểu đồ'),
('vi', 'weeklyreview', 'view_chart', 'Xem biểu đồ'),
('vi', 'weeklyreview', 'no_reviews', 'Chưa có đánh giá nào'),
('vi', 'weeklyreview', 'start_first_review', 'Bắt đầu đánh giá tuần đầu tiên'),
('vi', 'weeklyreview', 'review_completed', 'Đánh giá tuần đã hoàn thành!'),
('vi', 'weeklyreview', 'progress_stats', 'Thống kê tiến độ'),
('vi', 'weeklyreview', 'tasks_completed', 'Công việc hoàn thành'),
('vi', 'weeklyreview', 'habits_completed', 'Thói quen hoàn thành'),
('vi', 'weeklyreview', 'goals_progress', 'Tiến độ mục tiêu'),
('vi', 'weeklyreview', 'journal_entries', 'Bài nhật ký')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - WEEKLY REVIEW MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'weeklyreview', 'title', 'Weekly Review'),
('en', 'weeklyreview', 'description', 'Reflect on the past week and plan for the next'),
('en', 'weeklyreview', 'start_review', 'Start Review'),
('en', 'weeklyreview', 'continue_review', 'Continue Review'),
('en', 'weeklyreview', 'complete_review', 'Complete Review'),
('en', 'weeklyreview', 'save_draft', 'Save Draft'),
('en', 'weeklyreview', 'week_of', 'Week of'),
('en', 'weeklyreview', 'current_week', 'This Week'),
('en', 'weeklyreview', 'previous_week', 'Previous Week'),
('en', 'weeklyreview', 'overall_rating', 'Overall Rating'),
('en', 'weeklyreview', 'rate_your_week', 'Rate Your Week'),
('en', 'weeklyreview', 'highlight', 'Highlight'),
('en', 'weeklyreview', 'highlight_placeholder', 'What was the best thing this week?'),
('en', 'weeklyreview', 'lowlight', 'Lowlight'),
('en', 'weeklyreview', 'lowlight_placeholder', 'What didn''t go as planned?'),
('en', 'weeklyreview', 'wins', 'Wins'),
('en', 'weeklyreview', 'add_win', 'Add Win'),
('en', 'weeklyreview', 'win_placeholder', 'What did you accomplish?'),
('en', 'weeklyreview', 'challenges', 'Challenges'),
('en', 'weeklyreview', 'add_challenge', 'Add Challenge'),
('en', 'weeklyreview', 'challenge_placeholder', 'What challenges did you face?'),
('en', 'weeklyreview', 'lessons_learned', 'Lessons Learned'),
('en', 'weeklyreview', 'add_lesson', 'Add Lesson'),
('en', 'weeklyreview', 'lesson_placeholder', 'What did you learn?'),
('en', 'weeklyreview', 'gratitude', 'Gratitude'),
('en', 'weeklyreview', 'add_gratitude', 'Add Gratitude'),
('en', 'weeklyreview', 'gratitude_placeholder', 'What are you grateful for this week?'),
('en', 'weeklyreview', 'next_week_focus', 'Next Week Focus'),
('en', 'weeklyreview', 'add_focus', 'Add Focus'),
('en', 'weeklyreview', 'focus_placeholder', 'What do you want to focus on?'),
('en', 'weeklyreview', 'area_ratings', 'Area Ratings'),
('en', 'weeklyreview', 'rate_areas', 'Rate Areas'),
('en', 'weeklyreview', 'history', 'Review History'),
('en', 'weeklyreview', 'view_history', 'View History'),
('en', 'weeklyreview', 'insights', 'Insights'),
('en', 'weeklyreview', 'weekly_insights', 'Weekly Insights'),
('en', 'weeklyreview', 'trends', 'Trends'),
('en', 'weeklyreview', 'rating_trend', 'Rating Trend'),
('en', 'weeklyreview', 'area_trends', 'Area Trends'),
('en', 'weeklyreview', 'reminder', 'Reminder'),
('en', 'weeklyreview', 'set_reminder', 'Set Reminder'),
('en', 'weeklyreview', 'reminder_day', 'Reminder Day'),
('en', 'weeklyreview', 'reminder_time', 'Reminder Time'),
('en', 'weeklyreview', 'prompts', 'Prompts'),
('en', 'weeklyreview', 'reflection_prompts', 'Reflection Prompts'),
('en', 'weeklyreview', 'chart', 'Chart'),
('en', 'weeklyreview', 'view_chart', 'View Chart'),
('en', 'weeklyreview', 'no_reviews', 'No reviews yet'),
('en', 'weeklyreview', 'start_first_review', 'Start your first weekly review'),
('en', 'weeklyreview', 'review_completed', 'Weekly review completed!'),
('en', 'weeklyreview', 'progress_stats', 'Progress Stats'),
('en', 'weeklyreview', 'tasks_completed', 'Tasks Completed'),
('en', 'weeklyreview', 'habits_completed', 'Habits Completed'),
('en', 'weeklyreview', 'goals_progress', 'Goals Progress'),
('en', 'weeklyreview', 'journal_entries', 'Journal Entries')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - SETTINGS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'settings', 'title', 'Cài đặt'),
('vi', 'settings', 'profile', 'Hồ sơ'),
('vi', 'settings', 'edit_profile', 'Chỉnh sửa hồ sơ'),
('vi', 'settings', 'name', 'Tên'),
('vi', 'settings', 'email', 'Email'),
('vi', 'settings', 'phone', 'Số điện thoại'),
('vi', 'settings', 'birthday', 'Ngày sinh'),
('vi', 'settings', 'bio', 'Tiểu sử'),
('vi', 'settings', 'avatar', 'Ảnh đại diện'),
('vi', 'settings', 'change_avatar', 'Thay đổi ảnh đại diện'),
('vi', 'settings', 'remove_avatar', 'Xóa ảnh đại diện'),
('vi', 'settings', 'timezone', 'Múi giờ'),
('vi', 'settings', 'language', 'Ngôn ngữ'),
('vi', 'settings', 'theme', 'Giao diện'),
('vi', 'settings', 'theme.light', 'Sáng'),
('vi', 'settings', 'theme.dark', 'Tối'),
('vi', 'settings', 'theme.system', 'Theo hệ thống'),
('vi', 'settings', 'notifications', 'Thông báo'),
('vi', 'settings', 'email_notifications', 'Thông báo email'),
('vi', 'settings', 'push_notifications', 'Thông báo đẩy'),
('vi', 'settings', 'reminder_notifications', 'Thông báo nhắc nhở'),
('vi', 'settings', 'weekly_digest', 'Báo cáo tuần'),
('vi', 'settings', 'pomodoro', 'Pomodoro'),
('vi', 'settings', 'pomodoro_settings', 'Cài đặt Pomodoro'),
('vi', 'settings', 'work_duration', 'Thời gian làm việc'),
('vi', 'settings', 'break_duration', 'Thời gian nghỉ ngắn'),
('vi', 'settings', 'long_break_duration', 'Thời gian nghỉ dài'),
('vi', 'settings', 'sessions_before_long_break', 'Số phiên trước nghỉ dài'),
('vi', 'settings', 'auto_start_breaks', 'Tự động bắt đầu nghỉ'),
('vi', 'settings', 'auto_start_pomodoros', 'Tự động bắt đầu pomodoro'),
('vi', 'settings', 'sound_enabled', 'Bật âm thanh'),
('vi', 'settings', 'trash', 'Thùng rác'),
('vi', 'settings', 'trash_settings', 'Cài đặt thùng rác'),
('vi', 'settings', 'trash_enabled', 'Bật thùng rác'),
('vi', 'settings', 'auto_cleanup_days', 'Tự động xóa sau (ngày)'),
('vi', 'settings', 'data', 'Dữ liệu'),
('vi', 'settings', 'export_data', 'Xuất dữ liệu'),
('vi', 'settings', 'import_data', 'Nhập dữ liệu'),
('vi', 'settings', 'backup_data', 'Sao lưu dữ liệu'),
('vi', 'settings', 'restore_data', 'Khôi phục dữ liệu'),
('vi', 'settings', 'delete_all_data', 'Xóa tất cả dữ liệu'),
('vi', 'settings', 'account', 'Tài khoản'),
('vi', 'settings', 'change_password', 'Đổi mật khẩu'),
('vi', 'settings', 'current_password', 'Mật khẩu hiện tại'),
('vi', 'settings', 'new_password', 'Mật khẩu mới'),
('vi', 'settings', 'confirm_password', 'Xác nhận mật khẩu'),
('vi', 'settings', 'logout', 'Đăng xuất'),
('vi', 'settings', 'logout_all_devices', 'Đăng xuất tất cả thiết bị'),
('vi', 'settings', 'delete_account', 'Xóa tài khoản'),
('vi', 'settings', 'delete_account_warning', 'Hành động này không thể hoàn tác'),
('vi', 'settings', 'subscription', 'Gói đăng ký'),
('vi', 'settings', 'current_plan', 'Gói hiện tại'),
('vi', 'settings', 'upgrade_plan', 'Nâng cấp gói'),
('vi', 'settings', 'manage_subscription', 'Quản lý đăng ký'),
('vi', 'settings', 'billing_history', 'Lịch sử thanh toán'),
('vi', 'settings', 'vision_values', 'Tầm nhìn & Giá trị'),
('vi', 'settings', 'life_vision', 'Tầm nhìn cuộc sống'),
('vi', 'settings', 'personal_values', 'Giá trị cá nhân'),
('vi', 'settings', 'life_roles', 'Vai trò cuộc sống'),
('vi', 'settings', 'personal_traits', 'Đặc điểm cá nhân'),
('vi', 'settings', 'strengths', 'Điểm mạnh'),
('vi', 'settings', 'weaknesses', 'Điểm yếu'),
('vi', 'settings', 'life_milestones', 'Cột mốc cuộc sống'),
('vi', 'settings', 'about', 'Giới thiệu'),
('vi', 'settings', 'version', 'Phiên bản'),
('vi', 'settings', 'help', 'Trợ giúp'),
('vi', 'settings', 'feedback', 'Góp ý'),
('vi', 'settings', 'privacy_policy', 'Chính sách bảo mật'),
('vi', 'settings', 'terms_of_service', 'Điều khoản sử dụng'),
('vi', 'settings', 'save_changes', 'Lưu thay đổi'),
('vi', 'settings', 'cancel', 'Hủy'),
('vi', 'settings', 'settings_saved', 'Đã lưu cài đặt!'),
('vi', 'settings', 'settings_error', 'Lỗi khi lưu cài đặt')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - SETTINGS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'settings', 'title', 'Settings'),
('en', 'settings', 'profile', 'Profile'),
('en', 'settings', 'edit_profile', 'Edit Profile'),
('en', 'settings', 'name', 'Name'),
('en', 'settings', 'email', 'Email'),
('en', 'settings', 'phone', 'Phone'),
('en', 'settings', 'birthday', 'Birthday'),
('en', 'settings', 'bio', 'Bio'),
('en', 'settings', 'avatar', 'Avatar'),
('en', 'settings', 'change_avatar', 'Change Avatar'),
('en', 'settings', 'remove_avatar', 'Remove Avatar'),
('en', 'settings', 'timezone', 'Timezone'),
('en', 'settings', 'language', 'Language'),
('en', 'settings', 'theme', 'Theme'),
('en', 'settings', 'theme.light', 'Light'),
('en', 'settings', 'theme.dark', 'Dark'),
('en', 'settings', 'theme.system', 'System'),
('en', 'settings', 'notifications', 'Notifications'),
('en', 'settings', 'email_notifications', 'Email Notifications'),
('en', 'settings', 'push_notifications', 'Push Notifications'),
('en', 'settings', 'reminder_notifications', 'Reminder Notifications'),
('en', 'settings', 'weekly_digest', 'Weekly Digest'),
('en', 'settings', 'pomodoro', 'Pomodoro'),
('en', 'settings', 'pomodoro_settings', 'Pomodoro Settings'),
('en', 'settings', 'work_duration', 'Work Duration'),
('en', 'settings', 'break_duration', 'Break Duration'),
('en', 'settings', 'long_break_duration', 'Long Break Duration'),
('en', 'settings', 'sessions_before_long_break', 'Sessions Before Long Break'),
('en', 'settings', 'auto_start_breaks', 'Auto Start Breaks'),
('en', 'settings', 'auto_start_pomodoros', 'Auto Start Pomodoros'),
('en', 'settings', 'sound_enabled', 'Sound Enabled'),
('en', 'settings', 'trash', 'Trash'),
('en', 'settings', 'trash_settings', 'Trash Settings'),
('en', 'settings', 'trash_enabled', 'Enable Trash'),
('en', 'settings', 'auto_cleanup_days', 'Auto Cleanup After (days)'),
('en', 'settings', 'data', 'Data'),
('en', 'settings', 'export_data', 'Export Data'),
('en', 'settings', 'import_data', 'Import Data'),
('en', 'settings', 'backup_data', 'Backup Data'),
('en', 'settings', 'restore_data', 'Restore Data'),
('en', 'settings', 'delete_all_data', 'Delete All Data'),
('en', 'settings', 'account', 'Account'),
('en', 'settings', 'change_password', 'Change Password'),
('en', 'settings', 'current_password', 'Current Password'),
('en', 'settings', 'new_password', 'New Password'),
('en', 'settings', 'confirm_password', 'Confirm Password'),
('en', 'settings', 'logout', 'Logout'),
('en', 'settings', 'logout_all_devices', 'Logout All Devices'),
('en', 'settings', 'delete_account', 'Delete Account'),
('en', 'settings', 'delete_account_warning', 'This action cannot be undone'),
('en', 'settings', 'subscription', 'Subscription'),
('en', 'settings', 'current_plan', 'Current Plan'),
('en', 'settings', 'upgrade_plan', 'Upgrade Plan'),
('en', 'settings', 'manage_subscription', 'Manage Subscription'),
('en', 'settings', 'billing_history', 'Billing History'),
('en', 'settings', 'vision_values', 'Vision & Values'),
('en', 'settings', 'life_vision', 'Life Vision'),
('en', 'settings', 'personal_values', 'Personal Values'),
('en', 'settings', 'life_roles', 'Life Roles'),
('en', 'settings', 'personal_traits', 'Personal Traits'),
('en', 'settings', 'strengths', 'Strengths'),
('en', 'settings', 'weaknesses', 'Weaknesses'),
('en', 'settings', 'life_milestones', 'Life Milestones'),
('en', 'settings', 'about', 'About'),
('en', 'settings', 'version', 'Version'),
('en', 'settings', 'help', 'Help'),
('en', 'settings', 'feedback', 'Feedback'),
('en', 'settings', 'privacy_policy', 'Privacy Policy'),
('en', 'settings', 'terms_of_service', 'Terms of Service'),
('en', 'settings', 'save_changes', 'Save Changes'),
('en', 'settings', 'cancel', 'Cancel'),
('en', 'settings', 'settings_saved', 'Settings saved!'),
('en', 'settings', 'settings_error', 'Error saving settings')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - AI CHAT MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'aichat', 'title', 'AI Coach'),
('vi', 'aichat', 'description', 'Trò chuyện với AI Coach cá nhân của bạn'),
('vi', 'aichat', 'new_conversation', 'Cuộc trò chuyện mới'),
('vi', 'aichat', 'clear_conversation', 'Xóa cuộc trò chuyện'),
('vi', 'aichat', 'save_conversation', 'Lưu cuộc trò chuyện'),
('vi', 'aichat', 'saved_conversations', 'Cuộc trò chuyện đã lưu'),
('vi', 'aichat', 'delete_conversation', 'Xóa cuộc trò chuyện'),
('vi', 'aichat', 'rename_conversation', 'Đổi tên cuộc trò chuyện'),
('vi', 'aichat', 'type_message', 'Nhập tin nhắn...'),
('vi', 'aichat', 'send_message', 'Gửi tin nhắn'),
('vi', 'aichat', 'ai_thinking', 'AI đang suy nghĩ...'),
('vi', 'aichat', 'ai_typing', 'AI đang nhập...'),
('vi', 'aichat', 'copy_message', 'Sao chép tin nhắn'),
('vi', 'aichat', 'message_copied', 'Đã sao chép tin nhắn'),
('vi', 'aichat', 'regenerate', 'Tạo lại phản hồi'),
('vi', 'aichat', 'favorite', 'Yêu thích'),
('vi', 'aichat', 'unfavorite', 'Bỏ yêu thích'),
('vi', 'aichat', 'favorites', 'Tin nhắn yêu thích'),
('vi', 'aichat', 'context', 'Ngữ cảnh'),
('vi', 'aichat', 'include_context', 'Bao gồm ngữ cảnh'),
('vi', 'aichat', 'goals_context', 'Ngữ cảnh mục tiêu'),
('vi', 'aichat', 'habits_context', 'Ngữ cảnh thói quen'),
('vi', 'aichat', 'tasks_context', 'Ngữ cảnh công việc'),
('vi', 'aichat', 'journal_context', 'Ngữ cảnh nhật ký'),
('vi', 'aichat', 'suggestions', 'Gợi ý'),
('vi', 'aichat', 'quick_actions', 'Thao tác nhanh'),
('vi', 'aichat', 'ask_about_goals', 'Hỏi về mục tiêu'),
('vi', 'aichat', 'ask_about_habits', 'Hỏi về thói quen'),
('vi', 'aichat', 'ask_about_tasks', 'Hỏi về công việc'),
('vi', 'aichat', 'get_motivation', 'Nhận động lực'),
('vi', 'aichat', 'get_advice', 'Nhận lời khuyên'),
('vi', 'aichat', 'plan_day', 'Lên kế hoạch ngày'),
('vi', 'aichat', 'reflect', 'Suy ngẫm'),
('vi', 'aichat', 'brainstorm', 'Brainstorm'),
('vi', 'aichat', 'problem_solve', 'Giải quyết vấn đề'),
('vi', 'aichat', 'no_messages', 'Chưa có tin nhắn'),
('vi', 'aichat', 'start_conversation', 'Bắt đầu cuộc trò chuyện'),
('vi', 'aichat', 'welcome_message', 'Xin chào! Tôi là AI Coach của bạn. Tôi có thể giúp gì cho bạn hôm nay?'),
('vi', 'aichat', 'error_message', 'Có lỗi xảy ra. Vui lòng thử lại.'),
('vi', 'aichat', 'model_select', 'Chọn model AI'),
('vi', 'aichat', 'temperature', 'Nhiệt độ'),
('vi', 'aichat', 'max_tokens', 'Số token tối đa'),
('vi', 'aichat', 'settings', 'Cài đặt AI')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - AI CHAT MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'aichat', 'title', 'AI Coach'),
('en', 'aichat', 'description', 'Chat with your personal AI Coach'),
('en', 'aichat', 'new_conversation', 'New Conversation'),
('en', 'aichat', 'clear_conversation', 'Clear Conversation'),
('en', 'aichat', 'save_conversation', 'Save Conversation'),
('en', 'aichat', 'saved_conversations', 'Saved Conversations'),
('en', 'aichat', 'delete_conversation', 'Delete Conversation'),
('en', 'aichat', 'rename_conversation', 'Rename Conversation'),
('en', 'aichat', 'type_message', 'Type a message...'),
('en', 'aichat', 'send_message', 'Send Message'),
('en', 'aichat', 'ai_thinking', 'AI is thinking...'),
('en', 'aichat', 'ai_typing', 'AI is typing...'),
('en', 'aichat', 'copy_message', 'Copy Message'),
('en', 'aichat', 'message_copied', 'Message copied'),
('en', 'aichat', 'regenerate', 'Regenerate Response'),
('en', 'aichat', 'favorite', 'Favorite'),
('en', 'aichat', 'unfavorite', 'Unfavorite'),
('en', 'aichat', 'favorites', 'Favorite Messages'),
('en', 'aichat', 'context', 'Context'),
('en', 'aichat', 'include_context', 'Include Context'),
('en', 'aichat', 'goals_context', 'Goals Context'),
('en', 'aichat', 'habits_context', 'Habits Context'),
('en', 'aichat', 'tasks_context', 'Tasks Context'),
('en', 'aichat', 'journal_context', 'Journal Context'),
('en', 'aichat', 'suggestions', 'Suggestions'),
('en', 'aichat', 'quick_actions', 'Quick Actions'),
('en', 'aichat', 'ask_about_goals', 'Ask about goals'),
('en', 'aichat', 'ask_about_habits', 'Ask about habits'),
('en', 'aichat', 'ask_about_tasks', 'Ask about tasks'),
('en', 'aichat', 'get_motivation', 'Get motivation'),
('en', 'aichat', 'get_advice', 'Get advice'),
('en', 'aichat', 'plan_day', 'Plan my day'),
('en', 'aichat', 'reflect', 'Reflect'),
('en', 'aichat', 'brainstorm', 'Brainstorm'),
('en', 'aichat', 'problem_solve', 'Problem solve'),
('en', 'aichat', 'no_messages', 'No messages yet'),
('en', 'aichat', 'start_conversation', 'Start a conversation'),
('en', 'aichat', 'welcome_message', 'Hello! I''m your AI Coach. How can I help you today?'),
('en', 'aichat', 'error_message', 'Something went wrong. Please try again.'),
('en', 'aichat', 'model_select', 'Select AI Model'),
('en', 'aichat', 'temperature', 'Temperature'),
('en', 'aichat', 'max_tokens', 'Max Tokens'),
('en', 'aichat', 'settings', 'AI Settings')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - POMODORO MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'pomodoro', 'title', 'Pomodoro'),
('vi', 'pomodoro', 'description', 'Quản lý thời gian với kỹ thuật Pomodoro'),
('vi', 'pomodoro', 'start', 'Bắt đầu'),
('vi', 'pomodoro', 'pause', 'Tạm dừng'),
('vi', 'pomodoro', 'resume', 'Tiếp tục'),
('vi', 'pomodoro', 'stop', 'Dừng'),
('vi', 'pomodoro', 'reset', 'Đặt lại'),
('vi', 'pomodoro', 'skip', 'Bỏ qua'),
('vi', 'pomodoro', 'work', 'Làm việc'),
('vi', 'pomodoro', 'break', 'Nghỉ ngắn'),
('vi', 'pomodoro', 'long_break', 'Nghỉ dài'),
('vi', 'pomodoro', 'session', 'Phiên'),
('vi', 'pomodoro', 'sessions', 'Phiên'),
('vi', 'pomodoro', 'completed_sessions', 'Phiên đã hoàn thành'),
('vi', 'pomodoro', 'total_sessions', 'Tổng số phiên'),
('vi', 'pomodoro', 'today_sessions', 'Phiên hôm nay'),
('vi', 'pomodoro', 'this_week', 'Tuần này'),
('vi', 'pomodoro', 'this_month', 'Tháng này'),
('vi', 'pomodoro', 'minutes', 'phút'),
('vi', 'pomodoro', 'seconds', 'giây'),
('vi', 'pomodoro', 'time_remaining', 'Thời gian còn lại'),
('vi', 'pomodoro', 'work_time', 'Thời gian làm việc'),
('vi', 'pomodoro', 'break_time', 'Thời gian nghỉ'),
('vi', 'pomodoro', 'focus_time', 'Thời gian tập trung'),
('vi', 'pomodoro', 'total_focus_time', 'Tổng thời gian tập trung'),
('vi', 'pomodoro', 'select_task', 'Chọn công việc'),
('vi', 'pomodoro', 'no_task_selected', 'Chưa chọn công việc'),
('vi', 'pomodoro', 'current_task', 'Công việc hiện tại'),
('vi', 'pomodoro', 'estimated_pomodoros', 'Số pomodoro ước tính'),
('vi', 'pomodoro', 'completed_pomodoros', 'Pomodoro đã hoàn thành'),
('vi', 'pomodoro', 'stats', 'Thống kê'),
('vi', 'pomodoro', 'history', 'Lịch sử'),
('vi', 'pomodoro', 'settings', 'Cài đặt'),
('vi', 'pomodoro', 'work_duration', 'Thời gian làm việc'),
('vi', 'pomodoro', 'break_duration', 'Thời gian nghỉ ngắn'),
('vi', 'pomodoro', 'long_break_duration', 'Thời gian nghỉ dài'),
('vi', 'pomodoro', 'sessions_before_long_break', 'Số phiên trước nghỉ dài'),
('vi', 'pomodoro', 'auto_start', 'Tự động bắt đầu'),
('vi', 'pomodoro', 'sound_notification', 'Thông báo âm thanh'),
('vi', 'pomodoro', 'session_completed', 'Phiên đã hoàn thành!'),
('vi', 'pomodoro', 'break_completed', 'Hết giờ nghỉ!'),
('vi', 'pomodoro', 'ready_to_work', 'Sẵn sàng làm việc?'),
('vi', 'pomodoro', 'take_break', 'Nghỉ ngơi thôi!'),
('vi', 'pomodoro', 'productivity', 'Năng suất'),
('vi', 'pomodoro', 'daily_goal', 'Mục tiêu ngày'),
('vi', 'pomodoro', 'weekly_goal', 'Mục tiêu tuần')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - POMODORO MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'pomodoro', 'title', 'Pomodoro'),
('en', 'pomodoro', 'description', 'Manage time with Pomodoro technique'),
('en', 'pomodoro', 'start', 'Start'),
('en', 'pomodoro', 'pause', 'Pause'),
('en', 'pomodoro', 'resume', 'Resume'),
('en', 'pomodoro', 'stop', 'Stop'),
('en', 'pomodoro', 'reset', 'Reset'),
('en', 'pomodoro', 'skip', 'Skip'),
('en', 'pomodoro', 'work', 'Work'),
('en', 'pomodoro', 'break', 'Break'),
('en', 'pomodoro', 'long_break', 'Long Break'),
('en', 'pomodoro', 'session', 'Session'),
('en', 'pomodoro', 'sessions', 'Sessions'),
('en', 'pomodoro', 'completed_sessions', 'Completed Sessions'),
('en', 'pomodoro', 'total_sessions', 'Total Sessions'),
('en', 'pomodoro', 'today_sessions', 'Today''s Sessions'),
('en', 'pomodoro', 'this_week', 'This Week'),
('en', 'pomodoro', 'this_month', 'This Month'),
('en', 'pomodoro', 'minutes', 'minutes'),
('en', 'pomodoro', 'seconds', 'seconds'),
('en', 'pomodoro', 'time_remaining', 'Time Remaining'),
('en', 'pomodoro', 'work_time', 'Work Time'),
('en', 'pomodoro', 'break_time', 'Break Time'),
('en', 'pomodoro', 'focus_time', 'Focus Time'),
('en', 'pomodoro', 'total_focus_time', 'Total Focus Time'),
('en', 'pomodoro', 'select_task', 'Select Task'),
('en', 'pomodoro', 'no_task_selected', 'No task selected'),
('en', 'pomodoro', 'current_task', 'Current Task'),
('en', 'pomodoro', 'estimated_pomodoros', 'Estimated Pomodoros'),
('en', 'pomodoro', 'completed_pomodoros', 'Completed Pomodoros'),
('en', 'pomodoro', 'stats', 'Stats'),
('en', 'pomodoro', 'history', 'History'),
('en', 'pomodoro', 'settings', 'Settings'),
('en', 'pomodoro', 'work_duration', 'Work Duration'),
('en', 'pomodoro', 'break_duration', 'Break Duration'),
('en', 'pomodoro', 'long_break_duration', 'Long Break Duration'),
('en', 'pomodoro', 'sessions_before_long_break', 'Sessions Before Long Break'),
('en', 'pomodoro', 'auto_start', 'Auto Start'),
('en', 'pomodoro', 'sound_notification', 'Sound Notification'),
('en', 'pomodoro', 'session_completed', 'Session completed!'),
('en', 'pomodoro', 'break_completed', 'Break is over!'),
('en', 'pomodoro', 'ready_to_work', 'Ready to work?'),
('en', 'pomodoro', 'take_break', 'Time to take a break!'),
('en', 'pomodoro', 'productivity', 'Productivity'),
('en', 'pomodoro', 'daily_goal', 'Daily Goal'),
('en', 'pomodoro', 'weekly_goal', 'Weekly Goal')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - DASHBOARD MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'dashboard', 'title', 'Dashboard'),
('vi', 'dashboard', 'description', 'Tổng quan về tiến độ và hoạt động'),
('vi', 'dashboard', 'welcome', 'Xin chào'),
('vi', 'dashboard', 'good_morning', 'Chào buổi sáng'),
('vi', 'dashboard', 'good_afternoon', 'Chào buổi chiều'),
('vi', 'dashboard', 'good_evening', 'Chào buổi tối'),
('vi', 'dashboard', 'overview', 'Tổng quan'),
('vi', 'dashboard', 'quick_stats', 'Thống kê nhanh'),
('vi', 'dashboard', 'recent_activity', 'Hoạt động gần đây'),
('vi', 'dashboard', 'upcoming', 'Sắp tới'),
('vi', 'dashboard', 'today_tasks', 'Công việc hôm nay'),
('vi', 'dashboard', 'tasks_completed', 'Công việc hoàn thành'),
('vi', 'dashboard', 'tasks_pending', 'Công việc đang chờ'),
('vi', 'dashboard', 'tasks_overdue', 'Công việc quá hạn'),
('vi', 'dashboard', 'habits_today', 'Thói quen hôm nay'),
('vi', 'dashboard', 'habits_completed', 'Thói quen hoàn thành'),
('vi', 'dashboard', 'habits_streak', 'Streak thói quen'),
('vi', 'dashboard', 'goals_progress', 'Tiến độ mục tiêu'),
('vi', 'dashboard', 'active_goals', 'Mục tiêu đang thực hiện'),
('vi', 'dashboard', 'completed_goals', 'Mục tiêu đã hoàn thành'),
('vi', 'dashboard', 'focus_time', 'Thời gian tập trung'),
('vi', 'dashboard', 'pomodoro_sessions', 'Phiên Pomodoro'),
('vi', 'dashboard', 'journal_streak', 'Streak nhật ký'),
('vi', 'dashboard', 'area_summary', 'Tổng quan theo lĩnh vực'),
('vi', 'dashboard', 'weekly_review', 'Đánh giá tuần'),
('vi', 'dashboard', 'life_wheel', 'Bánh xe cuộc sống'),
('vi', 'dashboard', 'ai_suggestions', 'Gợi ý từ AI'),
('vi', 'dashboard', 'get_ai_suggestions', 'Nhận gợi ý từ AI'),
('vi', 'dashboard', 'no_activity', 'Chưa có hoạt động'),
('vi', 'dashboard', 'no_upcoming', 'Không có gì sắp tới'),
('vi', 'dashboard', 'view_all', 'Xem tất cả'),
('vi', 'dashboard', 'quick_add', 'Thêm nhanh'),
('vi', 'dashboard', 'add_task', 'Thêm công việc'),
('vi', 'dashboard', 'add_goal', 'Thêm mục tiêu'),
('vi', 'dashboard', 'add_habit', 'Thêm thói quen'),
('vi', 'dashboard', 'add_note', 'Thêm ghi chú'),
('vi', 'dashboard', 'write_journal', 'Viết nhật ký'),
('vi', 'dashboard', 'productivity_score', 'Điểm năng suất'),
('vi', 'dashboard', 'today', 'Hôm nay'),
('vi', 'dashboard', 'this_week', 'Tuần này'),
('vi', 'dashboard', 'this_month', 'Tháng này'),
('vi', 'dashboard', 'all_time', 'Tất cả thời gian'),
('vi', 'dashboard', 'trends', 'Xu hướng'),
('vi', 'dashboard', 'insights', 'Insights'),
('vi', 'dashboard', 'notifications', 'Thông báo'),
('vi', 'dashboard', 'reminders', 'Nhắc nhở')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - DASHBOARD MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'dashboard', 'title', 'Dashboard'),
('en', 'dashboard', 'description', 'Overview of progress and activities'),
('en', 'dashboard', 'welcome', 'Hello'),
('en', 'dashboard', 'good_morning', 'Good morning'),
('en', 'dashboard', 'good_afternoon', 'Good afternoon'),
('en', 'dashboard', 'good_evening', 'Good evening'),
('en', 'dashboard', 'overview', 'Overview'),
('en', 'dashboard', 'quick_stats', 'Quick Stats'),
('en', 'dashboard', 'recent_activity', 'Recent Activity'),
('en', 'dashboard', 'upcoming', 'Upcoming'),
('en', 'dashboard', 'today_tasks', 'Today''s Tasks'),
('en', 'dashboard', 'tasks_completed', 'Tasks Completed'),
('en', 'dashboard', 'tasks_pending', 'Tasks Pending'),
('en', 'dashboard', 'tasks_overdue', 'Tasks Overdue'),
('en', 'dashboard', 'habits_today', 'Today''s Habits'),
('en', 'dashboard', 'habits_completed', 'Habits Completed'),
('en', 'dashboard', 'habits_streak', 'Habit Streak'),
('en', 'dashboard', 'goals_progress', 'Goals Progress'),
('en', 'dashboard', 'active_goals', 'Active Goals'),
('en', 'dashboard', 'completed_goals', 'Completed Goals'),
('en', 'dashboard', 'focus_time', 'Focus Time'),
('en', 'dashboard', 'pomodoro_sessions', 'Pomodoro Sessions'),
('en', 'dashboard', 'journal_streak', 'Journal Streak'),
('en', 'dashboard', 'area_summary', 'Area Summary'),
('en', 'dashboard', 'weekly_review', 'Weekly Review'),
('en', 'dashboard', 'life_wheel', 'Life Wheel'),
('en', 'dashboard', 'ai_suggestions', 'AI Suggestions'),
('en', 'dashboard', 'get_ai_suggestions', 'Get AI Suggestions'),
('en', 'dashboard', 'no_activity', 'No activity yet'),
('en', 'dashboard', 'no_upcoming', 'Nothing upcoming'),
('en', 'dashboard', 'view_all', 'View All'),
('en', 'dashboard', 'quick_add', 'Quick Add'),
('en', 'dashboard', 'add_task', 'Add Task'),
('en', 'dashboard', 'add_goal', 'Add Goal'),
('en', 'dashboard', 'add_habit', 'Add Habit'),
('en', 'dashboard', 'add_note', 'Add Note'),
('en', 'dashboard', 'write_journal', 'Write Journal'),
('en', 'dashboard', 'productivity_score', 'Productivity Score'),
('en', 'dashboard', 'today', 'Today'),
('en', 'dashboard', 'this_week', 'This Week'),
('en', 'dashboard', 'this_month', 'This Month'),
('en', 'dashboard', 'all_time', 'All Time'),
('en', 'dashboard', 'trends', 'Trends'),
('en', 'dashboard', 'insights', 'Insights'),
('en', 'dashboard', 'notifications', 'Notifications'),
('en', 'dashboard', 'reminders', 'Reminders')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - PROFILE MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'profile', 'title', 'Hồ sơ'),
('vi', 'profile', 'my_profile', 'Hồ sơ của tôi'),
('vi', 'profile', 'edit_profile', 'Chỉnh sửa hồ sơ'),
('vi', 'profile', 'view_profile', 'Xem hồ sơ'),
('vi', 'profile', 'personal_info', 'Thông tin cá nhân'),
('vi', 'profile', 'name', 'Tên'),
('vi', 'profile', 'email', 'Email'),
('vi', 'profile', 'phone', 'Số điện thoại'),
('vi', 'profile', 'birthday', 'Ngày sinh'),
('vi', 'profile', 'bio', 'Tiểu sử'),
('vi', 'profile', 'avatar', 'Ảnh đại diện'),
('vi', 'profile', 'change_avatar', 'Thay đổi ảnh'),
('vi', 'profile', 'remove_avatar', 'Xóa ảnh'),
('vi', 'profile', 'upload_avatar', 'Tải lên ảnh'),
('vi', 'profile', 'life_purpose', 'Mục đích sống'),
('vi', 'profile', 'life_purpose_placeholder', 'Mục đích sống của bạn là gì?'),
('vi', 'profile', 'vision', 'Tầm nhìn'),
('vi', 'profile', 'life_vision', 'Tầm nhìn cuộc sống'),
('vi', 'profile', 'vision_1_year', 'Tầm nhìn 1 năm'),
('vi', 'profile', 'vision_5_year', 'Tầm nhìn 5 năm'),
('vi', 'profile', 'vision_10_year', 'Tầm nhìn 10 năm'),
('vi', 'profile', 'vision_lifetime', 'Tầm nhìn cả đời'),
('vi', 'profile', 'add_vision', 'Thêm tầm nhìn'),
('vi', 'profile', 'edit_vision', 'Sửa tầm nhìn'),
('vi', 'profile', 'values', 'Giá trị'),
('vi', 'profile', 'personal_values', 'Giá trị cá nhân'),
('vi', 'profile', 'add_value', 'Thêm giá trị'),
('vi', 'profile', 'edit_value', 'Sửa giá trị'),
('vi', 'profile', 'value_name', 'Tên giá trị'),
('vi', 'profile', 'value_description', 'Mô tả giá trị'),
('vi', 'profile', 'value_priority', 'Độ ưu tiên'),
('vi', 'profile', 'roles', 'Vai trò'),
('vi', 'profile', 'life_roles', 'Vai trò cuộc sống'),
('vi', 'profile', 'add_role', 'Thêm vai trò'),
('vi', 'profile', 'edit_role', 'Sửa vai trò'),
('vi', 'profile', 'role_name', 'Tên vai trò'),
('vi', 'profile', 'role_description', 'Mô tả vai trò'),
('vi', 'profile', 'linked_goals', 'Mục tiêu liên kết'),
('vi', 'profile', 'traits', 'Đặc điểm'),
('vi', 'profile', 'personal_traits', 'Đặc điểm cá nhân'),
('vi', 'profile', 'strengths', 'Điểm mạnh'),
('vi', 'profile', 'weaknesses', 'Điểm yếu'),
('vi', 'profile', 'add_trait', 'Thêm đặc điểm'),
('vi', 'profile', 'edit_trait', 'Sửa đặc điểm'),
('vi', 'profile', 'milestones', 'Cột mốc'),
('vi', 'profile', 'life_milestones', 'Cột mốc cuộc sống'),
('vi', 'profile', 'add_milestone', 'Thêm cột mốc'),
('vi', 'profile', 'edit_milestone', 'Sửa cột mốc'),
('vi', 'profile', 'milestone_title', 'Tiêu đề cột mốc'),
('vi', 'profile', 'milestone_date', 'Ngày'),
('vi', 'profile', 'milestone_area', 'Lĩnh vực'),
('vi', 'profile', 'ai_suggestions', 'Gợi ý từ AI'),
('vi', 'profile', 'get_suggestions', 'Nhận gợi ý'),
('vi', 'profile', 'profile_saved', 'Đã lưu hồ sơ!'),
('vi', 'profile', 'profile_error', 'Lỗi khi lưu hồ sơ')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - PROFILE MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'profile', 'title', 'Profile'),
('en', 'profile', 'my_profile', 'My Profile'),
('en', 'profile', 'edit_profile', 'Edit Profile'),
('en', 'profile', 'view_profile', 'View Profile'),
('en', 'profile', 'personal_info', 'Personal Info'),
('en', 'profile', 'name', 'Name'),
('en', 'profile', 'email', 'Email'),
('en', 'profile', 'phone', 'Phone'),
('en', 'profile', 'birthday', 'Birthday'),
('en', 'profile', 'bio', 'Bio'),
('en', 'profile', 'avatar', 'Avatar'),
('en', 'profile', 'change_avatar', 'Change Avatar'),
('en', 'profile', 'remove_avatar', 'Remove Avatar'),
('en', 'profile', 'upload_avatar', 'Upload Avatar'),
('en', 'profile', 'life_purpose', 'Life Purpose'),
('en', 'profile', 'life_purpose_placeholder', 'What is your life purpose?'),
('en', 'profile', 'vision', 'Vision'),
('en', 'profile', 'life_vision', 'Life Vision'),
('en', 'profile', 'vision_1_year', '1 Year Vision'),
('en', 'profile', 'vision_5_year', '5 Year Vision'),
('en', 'profile', 'vision_10_year', '10 Year Vision'),
('en', 'profile', 'vision_lifetime', 'Lifetime Vision'),
('en', 'profile', 'add_vision', 'Add Vision'),
('en', 'profile', 'edit_vision', 'Edit Vision'),
('en', 'profile', 'values', 'Values'),
('en', 'profile', 'personal_values', 'Personal Values'),
('en', 'profile', 'add_value', 'Add Value'),
('en', 'profile', 'edit_value', 'Edit Value'),
('en', 'profile', 'value_name', 'Value Name'),
('en', 'profile', 'value_description', 'Value Description'),
('en', 'profile', 'value_priority', 'Priority'),
('en', 'profile', 'roles', 'Roles'),
('en', 'profile', 'life_roles', 'Life Roles'),
('en', 'profile', 'add_role', 'Add Role'),
('en', 'profile', 'edit_role', 'Edit Role'),
('en', 'profile', 'role_name', 'Role Name'),
('en', 'profile', 'role_description', 'Role Description'),
('en', 'profile', 'linked_goals', 'Linked Goals'),
('en', 'profile', 'traits', 'Traits'),
('en', 'profile', 'personal_traits', 'Personal Traits'),
('en', 'profile', 'strengths', 'Strengths'),
('en', 'profile', 'weaknesses', 'Weaknesses'),
('en', 'profile', 'add_trait', 'Add Trait'),
('en', 'profile', 'edit_trait', 'Edit Trait'),
('en', 'profile', 'milestones', 'Milestones'),
('en', 'profile', 'life_milestones', 'Life Milestones'),
('en', 'profile', 'add_milestone', 'Add Milestone'),
('en', 'profile', 'edit_milestone', 'Edit Milestone'),
('en', 'profile', 'milestone_title', 'Milestone Title'),
('en', 'profile', 'milestone_date', 'Date'),
('en', 'profile', 'milestone_area', 'Area'),
('en', 'profile', 'ai_suggestions', 'AI Suggestions'),
('en', 'profile', 'get_suggestions', 'Get Suggestions'),
('en', 'profile', 'profile_saved', 'Profile saved!'),
('en', 'profile', 'profile_error', 'Error saving profile')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TODAY MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'today', 'title', 'Hôm nay'),
('vi', 'today', 'description', 'Kế hoạch và hoạt động hôm nay'),
('vi', 'today', 'daily_intention', 'Ý định hàng ngày'),
('vi', 'today', 'set_intention', 'Đặt ý định'),
('vi', 'today', 'intention_placeholder', 'Hôm nay tôi sẽ tập trung vào...'),
('vi', 'today', 'reflection', 'Suy ngẫm'),
('vi', 'today', 'add_reflection', 'Thêm suy ngẫm'),
('vi', 'today', 'reflection_placeholder', 'Ngày hôm nay đã diễn ra như thế nào?'),
('vi', 'today', 'mark_complete', 'Đánh dấu hoàn thành'),
('vi', 'today', 'today_tasks', 'Công việc hôm nay'),
('vi', 'today', 'no_tasks', 'Không có công việc nào'),
('vi', 'today', 'add_task', 'Thêm công việc'),
('vi', 'today', 'today_habits', 'Thói quen hôm nay'),
('vi', 'today', 'no_habits', 'Không có thói quen nào'),
('vi', 'today', 'habits_progress', 'Tiến độ thói quen'),
('vi', 'today', 'morning_routine', 'Thói quen buổi sáng'),
('vi', 'today', 'evening_routine', 'Thói quen buổi tối'),
('vi', 'today', 'schedule', 'Lịch trình'),
('vi', 'today', 'timeline', 'Dòng thời gian'),
('vi', 'today', 'reminders', 'Nhắc nhở'),
('vi', 'today', 'no_reminders', 'Không có nhắc nhở'),
('vi', 'today', 'focus_block', 'Khối thời gian tập trung'),
('vi', 'today', 'start_focus', 'Bắt đầu tập trung'),
('vi', 'today', 'mood', 'Tâm trạng'),
('vi', 'today', 'energy', 'Năng lượng'),
('vi', 'today', 'how_are_you', 'Bạn cảm thấy thế nào?'),
('vi', 'today', 'daily_summary', 'Tổng kết ngày'),
('vi', 'today', 'tasks_completed', 'Công việc hoàn thành'),
('vi', 'today', 'habits_completed', 'Thói quen hoàn thành'),
('vi', 'today', 'pomodoros_completed', 'Pomodoro hoàn thành'),
('vi', 'today', 'focus_time', 'Thời gian tập trung'),
('vi', 'today', 'yesterday', 'Hôm qua'),
('vi', 'today', 'tomorrow', 'Ngày mai'),
('vi', 'today', 'previous_day', 'Ngày trước'),
('vi', 'today', 'next_day', 'Ngày sau'),
('vi', 'today', 'back_to_today', 'Về hôm nay')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TODAY MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'today', 'title', 'Today'),
('en', 'today', 'description', 'Today''s plans and activities'),
('en', 'today', 'daily_intention', 'Daily Intention'),
('en', 'today', 'set_intention', 'Set Intention'),
('en', 'today', 'intention_placeholder', 'Today I will focus on...'),
('en', 'today', 'reflection', 'Reflection'),
('en', 'today', 'add_reflection', 'Add Reflection'),
('en', 'today', 'reflection_placeholder', 'How did today go?'),
('en', 'today', 'mark_complete', 'Mark Complete'),
('en', 'today', 'today_tasks', 'Today''s Tasks'),
('en', 'today', 'no_tasks', 'No tasks'),
('en', 'today', 'add_task', 'Add Task'),
('en', 'today', 'today_habits', 'Today''s Habits'),
('en', 'today', 'no_habits', 'No habits'),
('en', 'today', 'habits_progress', 'Habits Progress'),
('en', 'today', 'morning_routine', 'Morning Routine'),
('en', 'today', 'evening_routine', 'Evening Routine'),
('en', 'today', 'schedule', 'Schedule'),
('en', 'today', 'timeline', 'Timeline'),
('en', 'today', 'reminders', 'Reminders'),
('en', 'today', 'no_reminders', 'No reminders'),
('en', 'today', 'focus_block', 'Focus Block'),
('en', 'today', 'start_focus', 'Start Focus'),
('en', 'today', 'mood', 'Mood'),
('en', 'today', 'energy', 'Energy'),
('en', 'today', 'how_are_you', 'How are you feeling?'),
('en', 'today', 'daily_summary', 'Daily Summary'),
('en', 'today', 'tasks_completed', 'Tasks Completed'),
('en', 'today', 'habits_completed', 'Habits Completed'),
('en', 'today', 'pomodoros_completed', 'Pomodoros Completed'),
('en', 'today', 'focus_time', 'Focus Time'),
('en', 'today', 'yesterday', 'Yesterday'),
('en', 'today', 'tomorrow', 'Tomorrow'),
('en', 'today', 'previous_day', 'Previous Day'),
('en', 'today', 'next_day', 'Next Day'),
('en', 'today', 'back_to_today', 'Back to Today')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - FINANCE MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'finance', 'title', 'Tài chính'),
('vi', 'finance', 'description', 'Quản lý tài chính cá nhân'),
('vi', 'finance', 'overview', 'Tổng quan'),
('vi', 'finance', 'income', 'Thu nhập'),
('vi', 'finance', 'expenses', 'Chi tiêu'),
('vi', 'finance', 'balance', 'Số dư'),
('vi', 'finance', 'net_worth', 'Tài sản ròng'),
('vi', 'finance', 'savings', 'Tiết kiệm'),
('vi', 'finance', 'investments', 'Đầu tư'),
('vi', 'finance', 'debts', 'Nợ'),
('vi', 'finance', 'budget', 'Ngân sách'),
('vi', 'finance', 'set_budget', 'Đặt ngân sách'),
('vi', 'finance', 'budget_remaining', 'Ngân sách còn lại'),
('vi', 'finance', 'budget_spent', 'Đã chi tiêu'),
('vi', 'finance', 'over_budget', 'Vượt ngân sách'),
('vi', 'finance', 'under_budget', 'Dưới ngân sách'),
('vi', 'finance', 'transactions', 'Giao dịch'),
('vi', 'finance', 'add_transaction', 'Thêm giao dịch'),
('vi', 'finance', 'edit_transaction', 'Sửa giao dịch'),
('vi', 'finance', 'delete_transaction', 'Xóa giao dịch'),
('vi', 'finance', 'transaction_type', 'Loại giao dịch'),
('vi', 'finance', 'amount', 'Số tiền'),
('vi', 'finance', 'category', 'Danh mục'),
('vi', 'finance', 'date', 'Ngày'),
('vi', 'finance', 'description', 'Mô tả'),
('vi', 'finance', 'recurring', 'Định kỳ'),
('vi', 'finance', 'accounts', 'Tài khoản'),
('vi', 'finance', 'add_account', 'Thêm tài khoản'),
('vi', 'finance', 'categories', 'Danh mục'),
('vi', 'finance', 'add_category', 'Thêm danh mục'),
('vi', 'finance', 'reports', 'Báo cáo'),
('vi', 'finance', 'monthly_report', 'Báo cáo tháng'),
('vi', 'finance', 'yearly_report', 'Báo cáo năm'),
('vi', 'finance', 'expense_by_category', 'Chi tiêu theo danh mục'),
('vi', 'finance', 'income_vs_expense', 'Thu nhập vs Chi tiêu'),
('vi', 'finance', 'trends', 'Xu hướng'),
('vi', 'finance', 'goals', 'Mục tiêu tài chính'),
('vi', 'finance', 'savings_goal', 'Mục tiêu tiết kiệm'),
('vi', 'finance', 'add_goal', 'Thêm mục tiêu'),
('vi', 'finance', 'currency', 'Tiền tệ'),
('vi', 'finance', 'no_transactions', 'Chưa có giao dịch'),
('vi', 'finance', 'coming_soon', 'Sắp ra mắt')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - FINANCE MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'finance', 'title', 'Finance'),
('en', 'finance', 'description', 'Personal finance management'),
('en', 'finance', 'overview', 'Overview'),
('en', 'finance', 'income', 'Income'),
('en', 'finance', 'expenses', 'Expenses'),
('en', 'finance', 'balance', 'Balance'),
('en', 'finance', 'net_worth', 'Net Worth'),
('en', 'finance', 'savings', 'Savings'),
('en', 'finance', 'investments', 'Investments'),
('en', 'finance', 'debts', 'Debts'),
('en', 'finance', 'budget', 'Budget'),
('en', 'finance', 'set_budget', 'Set Budget'),
('en', 'finance', 'budget_remaining', 'Budget Remaining'),
('en', 'finance', 'budget_spent', 'Spent'),
('en', 'finance', 'over_budget', 'Over Budget'),
('en', 'finance', 'under_budget', 'Under Budget'),
('en', 'finance', 'transactions', 'Transactions'),
('en', 'finance', 'add_transaction', 'Add Transaction'),
('en', 'finance', 'edit_transaction', 'Edit Transaction'),
('en', 'finance', 'delete_transaction', 'Delete Transaction'),
('en', 'finance', 'transaction_type', 'Transaction Type'),
('en', 'finance', 'amount', 'Amount'),
('en', 'finance', 'category', 'Category'),
('en', 'finance', 'date', 'Date'),
('en', 'finance', 'description', 'Description'),
('en', 'finance', 'recurring', 'Recurring'),
('en', 'finance', 'accounts', 'Accounts'),
('en', 'finance', 'add_account', 'Add Account'),
('en', 'finance', 'categories', 'Categories'),
('en', 'finance', 'add_category', 'Add Category'),
('en', 'finance', 'reports', 'Reports'),
('en', 'finance', 'monthly_report', 'Monthly Report'),
('en', 'finance', 'yearly_report', 'Yearly Report'),
('en', 'finance', 'expense_by_category', 'Expense by Category'),
('en', 'finance', 'income_vs_expense', 'Income vs Expense'),
('en', 'finance', 'trends', 'Trends'),
('en', 'finance', 'goals', 'Financial Goals'),
('en', 'finance', 'savings_goal', 'Savings Goal'),
('en', 'finance', 'add_goal', 'Add Goal'),
('en', 'finance', 'currency', 'Currency'),
('en', 'finance', 'no_transactions', 'No transactions yet'),
('en', 'finance', 'coming_soon', 'Coming Soon')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - HEALTH MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'health', 'title', 'Sức khỏe'),
('vi', 'health', 'description', 'Theo dõi sức khỏe và thể chất'),
('vi', 'health', 'overview', 'Tổng quan'),
('vi', 'health', 'weight', 'Cân nặng'),
('vi', 'health', 'height', 'Chiều cao'),
('vi', 'health', 'bmi', 'Chỉ số BMI'),
('vi', 'health', 'body_fat', 'Tỉ lệ mỡ cơ thể'),
('vi', 'health', 'muscle_mass', 'Khối lượng cơ'),
('vi', 'health', 'water_intake', 'Lượng nước uống'),
('vi', 'health', 'sleep', 'Giấc ngủ'),
('vi', 'health', 'sleep_hours', 'Số giờ ngủ'),
('vi', 'health', 'sleep_quality', 'Chất lượng giấc ngủ'),
('vi', 'health', 'exercise', 'Tập luyện'),
('vi', 'health', 'workout', 'Bài tập'),
('vi', 'health', 'add_workout', 'Thêm bài tập'),
('vi', 'health', 'workout_duration', 'Thời gian tập'),
('vi', 'health', 'calories_burned', 'Calories đốt'),
('vi', 'health', 'steps', 'Số bước'),
('vi', 'health', 'daily_steps', 'Bước hàng ngày'),
('vi', 'health', 'step_goal', 'Mục tiêu bước'),
('vi', 'health', 'nutrition', 'Dinh dưỡng'),
('vi', 'health', 'calories', 'Calories'),
('vi', 'health', 'protein', 'Protein'),
('vi', 'health', 'carbs', 'Carbs'),
('vi', 'health', 'fat', 'Chất béo'),
('vi', 'health', 'meals', 'Bữa ăn'),
('vi', 'health', 'add_meal', 'Thêm bữa ăn'),
('vi', 'health', 'breakfast', 'Bữa sáng'),
('vi', 'health', 'lunch', 'Bữa trưa'),
('vi', 'health', 'dinner', 'Bữa tối'),
('vi', 'health', 'snack', 'Bữa phụ'),
('vi', 'health', 'mood', 'Tâm trạng'),
('vi', 'health', 'energy', 'Năng lượng'),
('vi', 'health', 'stress', 'Căng thẳng'),
('vi', 'health', 'mental_health', 'Sức khỏe tinh thần'),
('vi', 'health', 'meditation', 'Thiền'),
('vi', 'health', 'mindfulness', 'Chánh niệm'),
('vi', 'health', 'heart_rate', 'Nhịp tim'),
('vi', 'health', 'blood_pressure', 'Huyết áp'),
('vi', 'health', 'medications', 'Thuốc'),
('vi', 'health', 'add_medication', 'Thêm thuốc'),
('vi', 'health', 'doctors_visits', 'Lịch khám bác sĩ'),
('vi', 'health', 'trends', 'Xu hướng'),
('vi', 'health', 'coming_soon', 'Sắp ra mắt')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - HEALTH MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'health', 'title', 'Health'),
('en', 'health', 'description', 'Track health and fitness'),
('en', 'health', 'overview', 'Overview'),
('en', 'health', 'weight', 'Weight'),
('en', 'health', 'height', 'Height'),
('en', 'health', 'bmi', 'BMI'),
('en', 'health', 'body_fat', 'Body Fat'),
('en', 'health', 'muscle_mass', 'Muscle Mass'),
('en', 'health', 'water_intake', 'Water Intake'),
('en', 'health', 'sleep', 'Sleep'),
('en', 'health', 'sleep_hours', 'Sleep Hours'),
('en', 'health', 'sleep_quality', 'Sleep Quality'),
('en', 'health', 'exercise', 'Exercise'),
('en', 'health', 'workout', 'Workout'),
('en', 'health', 'add_workout', 'Add Workout'),
('en', 'health', 'workout_duration', 'Workout Duration'),
('en', 'health', 'calories_burned', 'Calories Burned'),
('en', 'health', 'steps', 'Steps'),
('en', 'health', 'daily_steps', 'Daily Steps'),
('en', 'health', 'step_goal', 'Step Goal'),
('en', 'health', 'nutrition', 'Nutrition'),
('en', 'health', 'calories', 'Calories'),
('en', 'health', 'protein', 'Protein'),
('en', 'health', 'carbs', 'Carbs'),
('en', 'health', 'fat', 'Fat'),
('en', 'health', 'meals', 'Meals'),
('en', 'health', 'add_meal', 'Add Meal'),
('en', 'health', 'breakfast', 'Breakfast'),
('en', 'health', 'lunch', 'Lunch'),
('en', 'health', 'dinner', 'Dinner'),
('en', 'health', 'snack', 'Snack'),
('en', 'health', 'mood', 'Mood'),
('en', 'health', 'energy', 'Energy'),
('en', 'health', 'stress', 'Stress'),
('en', 'health', 'mental_health', 'Mental Health'),
('en', 'health', 'meditation', 'Meditation'),
('en', 'health', 'mindfulness', 'Mindfulness'),
('en', 'health', 'heart_rate', 'Heart Rate'),
('en', 'health', 'blood_pressure', 'Blood Pressure'),
('en', 'health', 'medications', 'Medications'),
('en', 'health', 'add_medication', 'Add Medication'),
('en', 'health', 'doctors_visits', 'Doctor''s Visits'),
('en', 'health', 'trends', 'Trends'),
('en', 'health', 'coming_soon', 'Coming Soon')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - RELATIONSHIPS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'relationships', 'title', 'Quan hệ'),
('vi', 'relationships', 'description', 'Quản lý các mối quan hệ'),
('vi', 'relationships', 'contacts', 'Liên hệ'),
('vi', 'relationships', 'add_contact', 'Thêm liên hệ'),
('vi', 'relationships', 'edit_contact', 'Sửa liên hệ'),
('vi', 'relationships', 'delete_contact', 'Xóa liên hệ'),
('vi', 'relationships', 'contact_name', 'Tên'),
('vi', 'relationships', 'contact_email', 'Email'),
('vi', 'relationships', 'contact_phone', 'Số điện thoại'),
('vi', 'relationships', 'contact_birthday', 'Sinh nhật'),
('vi', 'relationships', 'contact_notes', 'Ghi chú'),
('vi', 'relationships', 'relationship_type', 'Loại quan hệ'),
('vi', 'relationships', 'family', 'Gia đình'),
('vi', 'relationships', 'friend', 'Bạn bè'),
('vi', 'relationships', 'colleague', 'Đồng nghiệp'),
('vi', 'relationships', 'acquaintance', 'Người quen'),
('vi', 'relationships', 'mentor', 'Người hướng dẫn'),
('vi', 'relationships', 'mentee', 'Người được hướng dẫn'),
('vi', 'relationships', 'romantic', 'Tình cảm'),
('vi', 'relationships', 'professional', 'Chuyên nghiệp'),
('vi', 'relationships', 'last_contact', 'Liên hệ gần nhất'),
('vi', 'relationships', 'next_follow_up', 'Theo dõi tiếp theo'),
('vi', 'relationships', 'interactions', 'Tương tác'),
('vi', 'relationships', 'add_interaction', 'Thêm tương tác'),
('vi', 'relationships', 'interaction_type', 'Loại tương tác'),
('vi', 'relationships', 'call', 'Gọi điện'),
('vi', 'relationships', 'message', 'Nhắn tin'),
('vi', 'relationships', 'meeting', 'Gặp mặt'),
('vi', 'relationships', 'email', 'Email'),
('vi', 'relationships', 'social', 'Mạng xã hội'),
('vi', 'relationships', 'gift', 'Quà tặng'),
('vi', 'relationships', 'upcoming_birthdays', 'Sinh nhật sắp tới'),
('vi', 'relationships', 'reminders', 'Nhắc nhở'),
('vi', 'relationships', 'set_reminder', 'Đặt nhắc nhở'),
('vi', 'relationships', 'groups', 'Nhóm'),
('vi', 'relationships', 'add_group', 'Thêm nhóm'),
('vi', 'relationships', 'relationship_strength', 'Độ mạnh quan hệ'),
('vi', 'relationships', 'strong', 'Mạnh'),
('vi', 'relationships', 'moderate', 'Trung bình'),
('vi', 'relationships', 'weak', 'Yếu'),
('vi', 'relationships', 'needs_attention', 'Cần quan tâm'),
('vi', 'relationships', 'no_contacts', 'Chưa có liên hệ'),
('vi', 'relationships', 'coming_soon', 'Sắp ra mắt')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - RELATIONSHIPS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'relationships', 'title', 'Relationships'),
('en', 'relationships', 'description', 'Manage your relationships'),
('en', 'relationships', 'contacts', 'Contacts'),
('en', 'relationships', 'add_contact', 'Add Contact'),
('en', 'relationships', 'edit_contact', 'Edit Contact'),
('en', 'relationships', 'delete_contact', 'Delete Contact'),
('en', 'relationships', 'contact_name', 'Name'),
('en', 'relationships', 'contact_email', 'Email'),
('en', 'relationships', 'contact_phone', 'Phone'),
('en', 'relationships', 'contact_birthday', 'Birthday'),
('en', 'relationships', 'contact_notes', 'Notes'),
('en', 'relationships', 'relationship_type', 'Relationship Type'),
('en', 'relationships', 'family', 'Family'),
('en', 'relationships', 'friend', 'Friend'),
('en', 'relationships', 'colleague', 'Colleague'),
('en', 'relationships', 'acquaintance', 'Acquaintance'),
('en', 'relationships', 'mentor', 'Mentor'),
('en', 'relationships', 'mentee', 'Mentee'),
('en', 'relationships', 'romantic', 'Romantic'),
('en', 'relationships', 'professional', 'Professional'),
('en', 'relationships', 'last_contact', 'Last Contact'),
('en', 'relationships', 'next_follow_up', 'Next Follow-up'),
('en', 'relationships', 'interactions', 'Interactions'),
('en', 'relationships', 'add_interaction', 'Add Interaction'),
('en', 'relationships', 'interaction_type', 'Interaction Type'),
('en', 'relationships', 'call', 'Call'),
('en', 'relationships', 'message', 'Message'),
('en', 'relationships', 'meeting', 'Meeting'),
('en', 'relationships', 'email', 'Email'),
('en', 'relationships', 'social', 'Social Media'),
('en', 'relationships', 'gift', 'Gift'),
('en', 'relationships', 'upcoming_birthdays', 'Upcoming Birthdays'),
('en', 'relationships', 'reminders', 'Reminders'),
('en', 'relationships', 'set_reminder', 'Set Reminder'),
('en', 'relationships', 'groups', 'Groups'),
('en', 'relationships', 'add_group', 'Add Group'),
('en', 'relationships', 'relationship_strength', 'Relationship Strength'),
('en', 'relationships', 'strong', 'Strong'),
('en', 'relationships', 'moderate', 'Moderate'),
('en', 'relationships', 'weak', 'Weak'),
('en', 'relationships', 'needs_attention', 'Needs Attention'),
('en', 'relationships', 'no_contacts', 'No contacts yet'),
('en', 'relationships', 'coming_soon', 'Coming Soon')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - LEARNING MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'learning', 'title', 'Học tập'),
('vi', 'learning', 'description', 'Quản lý việc học và phát triển'),
('vi', 'learning', 'courses', 'Khóa học'),
('vi', 'learning', 'add_course', 'Thêm khóa học'),
('vi', 'learning', 'edit_course', 'Sửa khóa học'),
('vi', 'learning', 'delete_course', 'Xóa khóa học'),
('vi', 'learning', 'course_name', 'Tên khóa học'),
('vi', 'learning', 'course_description', 'Mô tả'),
('vi', 'learning', 'course_provider', 'Nhà cung cấp'),
('vi', 'learning', 'course_url', 'Đường dẫn'),
('vi', 'learning', 'course_progress', 'Tiến độ'),
('vi', 'learning', 'course_status', 'Trạng thái'),
('vi', 'learning', 'not_started', 'Chưa bắt đầu'),
('vi', 'learning', 'in_progress', 'Đang học'),
('vi', 'learning', 'completed', 'Hoàn thành'),
('vi', 'learning', 'paused', 'Tạm dừng'),
('vi', 'learning', 'dropped', 'Bỏ dở'),
('vi', 'learning', 'books', 'Sách'),
('vi', 'learning', 'add_book', 'Thêm sách'),
('vi', 'learning', 'book_title', 'Tên sách'),
('vi', 'learning', 'book_author', 'Tác giả'),
('vi', 'learning', 'pages_read', 'Số trang đã đọc'),
('vi', 'learning', 'total_pages', 'Tổng số trang'),
('vi', 'learning', 'currently_reading', 'Đang đọc'),
('vi', 'learning', 'want_to_read', 'Muốn đọc'),
('vi', 'learning', 'finished', 'Đã đọc xong'),
('vi', 'learning', 'skills', 'Kỹ năng'),
('vi', 'learning', 'add_skill', 'Thêm kỹ năng'),
('vi', 'learning', 'skill_name', 'Tên kỹ năng'),
('vi', 'learning', 'skill_level', 'Trình độ'),
('vi', 'learning', 'beginner', 'Mới bắt đầu'),
('vi', 'learning', 'intermediate', 'Trung cấp'),
('vi', 'learning', 'advanced', 'Nâng cao'),
('vi', 'learning', 'expert', 'Chuyên gia'),
('vi', 'learning', 'certifications', 'Chứng chỉ'),
('vi', 'learning', 'add_certification', 'Thêm chứng chỉ'),
('vi', 'learning', 'certification_name', 'Tên chứng chỉ'),
('vi', 'learning', 'issuing_organization', 'Tổ chức cấp'),
('vi', 'learning', 'issue_date', 'Ngày cấp'),
('vi', 'learning', 'expiry_date', 'Ngày hết hạn'),
('vi', 'learning', 'notes', 'Ghi chú học tập'),
('vi', 'learning', 'add_note', 'Thêm ghi chú'),
('vi', 'learning', 'flashcards', 'Flashcards'),
('vi', 'learning', 'create_deck', 'Tạo bộ thẻ'),
('vi', 'learning', 'study_session', 'Phiên học'),
('vi', 'learning', 'start_studying', 'Bắt đầu học'),
('vi', 'learning', 'learning_goals', 'Mục tiêu học tập'),
('vi', 'learning', 'add_goal', 'Thêm mục tiêu'),
('vi', 'learning', 'study_time', 'Thời gian học'),
('vi', 'learning', 'today_study_time', 'Thời gian học hôm nay'),
('vi', 'learning', 'weekly_study_time', 'Thời gian học tuần này'),
('vi', 'learning', 'no_courses', 'Chưa có khóa học'),
('vi', 'learning', 'coming_soon', 'Sắp ra mắt')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - LEARNING MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'learning', 'title', 'Learning'),
('en', 'learning', 'description', 'Manage learning and development'),
('en', 'learning', 'courses', 'Courses'),
('en', 'learning', 'add_course', 'Add Course'),
('en', 'learning', 'edit_course', 'Edit Course'),
('en', 'learning', 'delete_course', 'Delete Course'),
('en', 'learning', 'course_name', 'Course Name'),
('en', 'learning', 'course_description', 'Description'),
('en', 'learning', 'course_provider', 'Provider'),
('en', 'learning', 'course_url', 'URL'),
('en', 'learning', 'course_progress', 'Progress'),
('en', 'learning', 'course_status', 'Status'),
('en', 'learning', 'not_started', 'Not Started'),
('en', 'learning', 'in_progress', 'In Progress'),
('en', 'learning', 'completed', 'Completed'),
('en', 'learning', 'paused', 'Paused'),
('en', 'learning', 'dropped', 'Dropped'),
('en', 'learning', 'books', 'Books'),
('en', 'learning', 'add_book', 'Add Book'),
('en', 'learning', 'book_title', 'Book Title'),
('en', 'learning', 'book_author', 'Author'),
('en', 'learning', 'pages_read', 'Pages Read'),
('en', 'learning', 'total_pages', 'Total Pages'),
('en', 'learning', 'currently_reading', 'Currently Reading'),
('en', 'learning', 'want_to_read', 'Want to Read'),
('en', 'learning', 'finished', 'Finished'),
('en', 'learning', 'skills', 'Skills'),
('en', 'learning', 'add_skill', 'Add Skill'),
('en', 'learning', 'skill_name', 'Skill Name'),
('en', 'learning', 'skill_level', 'Level'),
('en', 'learning', 'beginner', 'Beginner'),
('en', 'learning', 'intermediate', 'Intermediate'),
('en', 'learning', 'advanced', 'Advanced'),
('en', 'learning', 'expert', 'Expert'),
('en', 'learning', 'certifications', 'Certifications'),
('en', 'learning', 'add_certification', 'Add Certification'),
('en', 'learning', 'certification_name', 'Certification Name'),
('en', 'learning', 'issuing_organization', 'Issuing Organization'),
('en', 'learning', 'issue_date', 'Issue Date'),
('en', 'learning', 'expiry_date', 'Expiry Date'),
('en', 'learning', 'notes', 'Learning Notes'),
('en', 'learning', 'add_note', 'Add Note'),
('en', 'learning', 'flashcards', 'Flashcards'),
('en', 'learning', 'create_deck', 'Create Deck'),
('en', 'learning', 'study_session', 'Study Session'),
('en', 'learning', 'start_studying', 'Start Studying'),
('en', 'learning', 'learning_goals', 'Learning Goals'),
('en', 'learning', 'add_goal', 'Add Goal'),
('en', 'learning', 'study_time', 'Study Time'),
('en', 'learning', 'today_study_time', 'Today''s Study Time'),
('en', 'learning', 'weekly_study_time', 'Weekly Study Time'),
('en', 'learning', 'no_courses', 'No courses yet'),
('en', 'learning', 'coming_soon', 'Coming Soon')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - AUTH MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Login
('vi', 'auth', 'login', 'Đăng nhập'),
('vi', 'auth', 'login_title', 'Đăng nhập vào tài khoản'),
('vi', 'auth', 'login_subtitle', 'Chào mừng bạn trở lại'),
('vi', 'auth', 'login_button', 'Đăng nhập'),
('vi', 'auth', 'logging_in', 'Đang đăng nhập...'),
('vi', 'auth', 'login_success', 'Đăng nhập thành công!'),
('vi', 'auth', 'login_error', 'Đăng nhập thất bại'),
('vi', 'auth', 'no_account', 'Chưa có tài khoản?'),
('vi', 'auth', 'create_account', 'Tạo tài khoản'),
-- Register/Signup
('vi', 'auth', 'register', 'Đăng ký'),
('vi', 'auth', 'signup', 'Đăng ký'),
('vi', 'auth', 'register_title', 'Tạo tài khoản mới'),
('vi', 'auth', 'register_subtitle', 'Bắt đầu hành trình của bạn'),
('vi', 'auth', 'register_button', 'Đăng ký'),
('vi', 'auth', 'registering', 'Đang đăng ký...'),
('vi', 'auth', 'register_success', 'Đăng ký thành công!'),
('vi', 'auth', 'register_error', 'Đăng ký thất bại'),
('vi', 'auth', 'already_have_account', 'Đã có tài khoản?'),
('vi', 'auth', 'sign_in_instead', 'Đăng nhập'),
('vi', 'auth', 'check_email', 'Vui lòng kiểm tra email để xác nhận tài khoản'),
('vi', 'auth', 'email_confirmation_sent', 'Đã gửi email xác nhận'),
-- Form fields
('vi', 'auth', 'email', 'Email'),
('vi', 'auth', 'email_placeholder', 'Nhập email của bạn'),
('vi', 'auth', 'password', 'Mật khẩu'),
('vi', 'auth', 'password_placeholder', 'Nhập mật khẩu'),
('vi', 'auth', 'confirm_password', 'Xác nhận mật khẩu'),
('vi', 'auth', 'confirm_password_placeholder', 'Nhập lại mật khẩu'),
('vi', 'auth', 'name', 'Họ tên'),
('vi', 'auth', 'name_placeholder', 'Nhập họ tên của bạn'),
('vi', 'auth', 'full_name', 'Họ và tên'),
('vi', 'auth', 'remember_me', 'Ghi nhớ đăng nhập'),
('vi', 'auth', 'show_password', 'Hiện mật khẩu'),
('vi', 'auth', 'hide_password', 'Ẩn mật khẩu'),
-- Forgot password
('vi', 'auth', 'forgot_password', 'Quên mật khẩu?'),
('vi', 'auth', 'forgot_password_title', 'Đặt lại mật khẩu'),
('vi', 'auth', 'forgot_password_subtitle', 'Nhập email để nhận link đặt lại mật khẩu'),
('vi', 'auth', 'send_reset_link', 'Gửi link đặt lại'),
('vi', 'auth', 'sending_reset_link', 'Đang gửi...'),
('vi', 'auth', 'reset_link_sent', 'Đã gửi link đặt lại mật khẩu'),
('vi', 'auth', 'check_email_reset', 'Vui lòng kiểm tra email để đặt lại mật khẩu'),
('vi', 'auth', 'back_to_login', 'Quay lại đăng nhập'),
-- Reset password
('vi', 'auth', 'reset_password', 'Đặt lại mật khẩu'),
('vi', 'auth', 'reset_password_title', 'Tạo mật khẩu mới'),
('vi', 'auth', 'reset_password_subtitle', 'Nhập mật khẩu mới cho tài khoản của bạn'),
('vi', 'auth', 'new_password', 'Mật khẩu mới'),
('vi', 'auth', 'new_password_placeholder', 'Nhập mật khẩu mới'),
('vi', 'auth', 'confirm_new_password', 'Xác nhận mật khẩu mới'),
('vi', 'auth', 'update_password', 'Cập nhật mật khẩu'),
('vi', 'auth', 'updating_password', 'Đang cập nhật...'),
('vi', 'auth', 'password_updated', 'Mật khẩu đã được cập nhật!'),
('vi', 'auth', 'password_update_error', 'Lỗi khi cập nhật mật khẩu'),
-- Logout
('vi', 'auth', 'logout', 'Đăng xuất'),
('vi', 'auth', 'logout_confirm', 'Bạn có chắc muốn đăng xuất?'),
('vi', 'auth', 'logging_out', 'Đang đăng xuất...'),
('vi', 'auth', 'logout_success', 'Đã đăng xuất'),
-- Validation errors
('vi', 'auth', 'email_required', 'Vui lòng nhập email'),
('vi', 'auth', 'email_invalid', 'Email không hợp lệ'),
('vi', 'auth', 'password_required', 'Vui lòng nhập mật khẩu'),
('vi', 'auth', 'password_min_length', 'Mật khẩu phải có ít nhất 6 ký tự'),
('vi', 'auth', 'password_too_short', 'Mật khẩu quá ngắn'),
('vi', 'auth', 'password_too_weak', 'Mật khẩu quá yếu'),
('vi', 'auth', 'passwords_not_match', 'Mật khẩu không khớp'),
('vi', 'auth', 'name_required', 'Vui lòng nhập họ tên'),
-- Auth errors
('vi', 'auth', 'invalid_credentials', 'Email hoặc mật khẩu không đúng'),
('vi', 'auth', 'user_not_found', 'Không tìm thấy tài khoản'),
('vi', 'auth', 'email_already_exists', 'Email đã được đăng ký'),
('vi', 'auth', 'email_not_confirmed', 'Vui lòng xác nhận email trước khi đăng nhập'),
('vi', 'auth', 'too_many_requests', 'Quá nhiều yêu cầu. Vui lòng thử lại sau'),
('vi', 'auth', 'network_error', 'Lỗi kết nối. Vui lòng kiểm tra mạng'),
('vi', 'auth', 'session_expired', 'Phiên đăng nhập đã hết hạn'),
('vi', 'auth', 'unauthorized', 'Không có quyền truy cập'),
('vi', 'auth', 'something_went_wrong', 'Đã có lỗi xảy ra. Vui lòng thử lại'),
-- Social login
('vi', 'auth', 'or', 'hoặc'),
('vi', 'auth', 'continue_with', 'Tiếp tục với'),
('vi', 'auth', 'login_with_google', 'Đăng nhập với Google'),
('vi', 'auth', 'login_with_facebook', 'Đăng nhập với Facebook'),
('vi', 'auth', 'login_with_github', 'Đăng nhập với GitHub'),
('vi', 'auth', 'login_with_apple', 'Đăng nhập với Apple'),
-- Terms
('vi', 'auth', 'terms_agree', 'Bằng việc đăng ký, bạn đồng ý với'),
('vi', 'auth', 'terms_of_service', 'Điều khoản sử dụng'),
('vi', 'auth', 'and', 'và'),
('vi', 'auth', 'privacy_policy', 'Chính sách bảo mật'),
-- Email verification
('vi', 'auth', 'verify_email', 'Xác nhận email'),
('vi', 'auth', 'verification_sent', 'Đã gửi email xác nhận'),
('vi', 'auth', 'resend_verification', 'Gửi lại email xác nhận'),
('vi', 'auth', 'email_verified', 'Email đã được xác nhận!'),
-- Two factor
('vi', 'auth', 'two_factor', 'Xác thực 2 bước'),
('vi', 'auth', 'enter_code', 'Nhập mã xác thực'),
('vi', 'auth', 'code_placeholder', 'Nhập mã 6 số'),
('vi', 'auth', 'verify_code', 'Xác nhận mã'),
('vi', 'auth', 'invalid_code', 'Mã không hợp lệ'),
('vi', 'auth', 'code_expired', 'Mã đã hết hạn')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - AUTH MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Login
('en', 'auth', 'login', 'Login'),
('en', 'auth', 'login_title', 'Sign in to your account'),
('en', 'auth', 'login_subtitle', 'Welcome back'),
('en', 'auth', 'login_button', 'Sign In'),
('en', 'auth', 'logging_in', 'Signing in...'),
('en', 'auth', 'login_success', 'Login successful!'),
('en', 'auth', 'login_error', 'Login failed'),
('en', 'auth', 'no_account', 'Don''t have an account?'),
('en', 'auth', 'create_account', 'Create account'),
-- Register/Signup
('en', 'auth', 'register', 'Register'),
('en', 'auth', 'signup', 'Sign Up'),
('en', 'auth', 'register_title', 'Create a new account'),
('en', 'auth', 'register_subtitle', 'Start your journey'),
('en', 'auth', 'register_button', 'Sign Up'),
('en', 'auth', 'registering', 'Signing up...'),
('en', 'auth', 'register_success', 'Registration successful!'),
('en', 'auth', 'register_error', 'Registration failed'),
('en', 'auth', 'already_have_account', 'Already have an account?'),
('en', 'auth', 'sign_in_instead', 'Sign in'),
('en', 'auth', 'check_email', 'Please check your email to confirm your account'),
('en', 'auth', 'email_confirmation_sent', 'Confirmation email sent'),
-- Form fields
('en', 'auth', 'email', 'Email'),
('en', 'auth', 'email_placeholder', 'Enter your email'),
('en', 'auth', 'password', 'Password'),
('en', 'auth', 'password_placeholder', 'Enter your password'),
('en', 'auth', 'confirm_password', 'Confirm Password'),
('en', 'auth', 'confirm_password_placeholder', 'Re-enter your password'),
('en', 'auth', 'name', 'Name'),
('en', 'auth', 'name_placeholder', 'Enter your name'),
('en', 'auth', 'full_name', 'Full Name'),
('en', 'auth', 'remember_me', 'Remember me'),
('en', 'auth', 'show_password', 'Show password'),
('en', 'auth', 'hide_password', 'Hide password'),
-- Forgot password
('en', 'auth', 'forgot_password', 'Forgot password?'),
('en', 'auth', 'forgot_password_title', 'Reset Password'),
('en', 'auth', 'forgot_password_subtitle', 'Enter your email to receive a reset link'),
('en', 'auth', 'send_reset_link', 'Send Reset Link'),
('en', 'auth', 'sending_reset_link', 'Sending...'),
('en', 'auth', 'reset_link_sent', 'Password reset link sent'),
('en', 'auth', 'check_email_reset', 'Please check your email to reset your password'),
('en', 'auth', 'back_to_login', 'Back to login'),
-- Reset password
('en', 'auth', 'reset_password', 'Reset Password'),
('en', 'auth', 'reset_password_title', 'Create New Password'),
('en', 'auth', 'reset_password_subtitle', 'Enter a new password for your account'),
('en', 'auth', 'new_password', 'New Password'),
('en', 'auth', 'new_password_placeholder', 'Enter new password'),
('en', 'auth', 'confirm_new_password', 'Confirm New Password'),
('en', 'auth', 'update_password', 'Update Password'),
('en', 'auth', 'updating_password', 'Updating...'),
('en', 'auth', 'password_updated', 'Password has been updated!'),
('en', 'auth', 'password_update_error', 'Error updating password'),
-- Logout
('en', 'auth', 'logout', 'Logout'),
('en', 'auth', 'logout_confirm', 'Are you sure you want to logout?'),
('en', 'auth', 'logging_out', 'Logging out...'),
('en', 'auth', 'logout_success', 'Logged out successfully'),
-- Validation errors
('en', 'auth', 'email_required', 'Please enter your email'),
('en', 'auth', 'email_invalid', 'Invalid email address'),
('en', 'auth', 'password_required', 'Please enter your password'),
('en', 'auth', 'password_min_length', 'Password must be at least 6 characters'),
('en', 'auth', 'password_too_short', 'Password is too short'),
('en', 'auth', 'password_too_weak', 'Password is too weak'),
('en', 'auth', 'passwords_not_match', 'Passwords do not match'),
('en', 'auth', 'name_required', 'Please enter your name'),
-- Auth errors
('en', 'auth', 'invalid_credentials', 'Invalid email or password'),
('en', 'auth', 'user_not_found', 'Account not found'),
('en', 'auth', 'email_already_exists', 'Email is already registered'),
('en', 'auth', 'email_not_confirmed', 'Please confirm your email before signing in'),
('en', 'auth', 'too_many_requests', 'Too many requests. Please try again later'),
('en', 'auth', 'network_error', 'Network error. Please check your connection'),
('en', 'auth', 'session_expired', 'Session has expired'),
('en', 'auth', 'unauthorized', 'Unauthorized access'),
('en', 'auth', 'something_went_wrong', 'Something went wrong. Please try again'),
-- Social login
('en', 'auth', 'or', 'or'),
('en', 'auth', 'continue_with', 'Continue with'),
('en', 'auth', 'login_with_google', 'Sign in with Google'),
('en', 'auth', 'login_with_facebook', 'Sign in with Facebook'),
('en', 'auth', 'login_with_github', 'Sign in with GitHub'),
('en', 'auth', 'login_with_apple', 'Sign in with Apple'),
-- Terms
('en', 'auth', 'terms_agree', 'By signing up, you agree to our'),
('en', 'auth', 'terms_of_service', 'Terms of Service'),
('en', 'auth', 'and', 'and'),
('en', 'auth', 'privacy_policy', 'Privacy Policy'),
-- Email verification
('en', 'auth', 'verify_email', 'Verify Email'),
('en', 'auth', 'verification_sent', 'Verification email sent'),
('en', 'auth', 'resend_verification', 'Resend verification email'),
('en', 'auth', 'email_verified', 'Email has been verified!'),
-- Two factor
('en', 'auth', 'two_factor', 'Two-Factor Authentication'),
('en', 'auth', 'enter_code', 'Enter verification code'),
('en', 'auth', 'code_placeholder', 'Enter 6-digit code'),
('en', 'auth', 'verify_code', 'Verify Code'),
('en', 'auth', 'invalid_code', 'Invalid code'),
('en', 'auth', 'code_expired', 'Code has expired')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ERRORS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General errors
('vi', 'errors', 'generic', 'Đã có lỗi xảy ra'),
('vi', 'errors', 'unknown', 'Lỗi không xác định'),
('vi', 'errors', 'unexpected', 'Lỗi không mong muốn'),
('vi', 'errors', 'try_again', 'Vui lòng thử lại'),
('vi', 'errors', 'try_again_later', 'Vui lòng thử lại sau'),
('vi', 'errors', 'contact_support', 'Nếu lỗi tiếp tục, vui lòng liên hệ hỗ trợ'),
('vi', 'errors', 'report_error', 'Báo lỗi'),
('vi', 'errors', 'refresh_page', 'Làm mới trang'),
('vi', 'errors', 'go_back', 'Quay lại'),
('vi', 'errors', 'go_home', 'Về trang chủ'),
-- Network errors
('vi', 'errors', 'network', 'Lỗi kết nối mạng'),
('vi', 'errors', 'no_connection', 'Không có kết nối mạng'),
('vi', 'errors', 'connection_lost', 'Mất kết nối'),
('vi', 'errors', 'connection_restored', 'Đã khôi phục kết nối'),
('vi', 'errors', 'offline', 'Bạn đang offline'),
('vi', 'errors', 'online', 'Đã kết nối lại'),
('vi', 'errors', 'slow_connection', 'Kết nối chậm'),
('vi', 'errors', 'timeout', 'Hết thời gian chờ'),
('vi', 'errors', 'request_timeout', 'Yêu cầu đã hết thời gian'),
('vi', 'errors', 'server_unreachable', 'Không thể kết nối đến máy chủ'),
-- Server errors
('vi', 'errors', 'server', 'Lỗi máy chủ'),
('vi', 'errors', 'server_error', 'Lỗi máy chủ nội bộ'),
('vi', 'errors', 'server_busy', 'Máy chủ đang bận'),
('vi', 'errors', 'service_unavailable', 'Dịch vụ tạm thời không khả dụng'),
('vi', 'errors', 'maintenance', 'Hệ thống đang bảo trì'),
('vi', 'errors', 'bad_gateway', 'Lỗi cổng kết nối'),
('vi', 'errors', 'gateway_timeout', 'Hết thời gian cổng kết nối'),
-- HTTP errors
('vi', 'errors', '400', 'Yêu cầu không hợp lệ'),
('vi', 'errors', '401', 'Chưa xác thực'),
('vi', 'errors', '403', 'Không có quyền truy cập'),
('vi', 'errors', '404', 'Không tìm thấy'),
('vi', 'errors', '405', 'Phương thức không được phép'),
('vi', 'errors', '408', 'Hết thời gian yêu cầu'),
('vi', 'errors', '409', 'Xung đột dữ liệu'),
('vi', 'errors', '410', 'Tài nguyên không còn tồn tại'),
('vi', 'errors', '422', 'Dữ liệu không thể xử lý'),
('vi', 'errors', '429', 'Quá nhiều yêu cầu'),
('vi', 'errors', '500', 'Lỗi máy chủ nội bộ'),
('vi', 'errors', '502', 'Lỗi cổng kết nối'),
('vi', 'errors', '503', 'Dịch vụ không khả dụng'),
('vi', 'errors', '504', 'Hết thời gian cổng kết nối'),
-- Data errors
('vi', 'errors', 'data_not_found', 'Không tìm thấy dữ liệu'),
('vi', 'errors', 'data_load_failed', 'Không thể tải dữ liệu'),
('vi', 'errors', 'data_save_failed', 'Không thể lưu dữ liệu'),
('vi', 'errors', 'data_delete_failed', 'Không thể xóa dữ liệu'),
('vi', 'errors', 'data_update_failed', 'Không thể cập nhật dữ liệu'),
('vi', 'errors', 'data_corrupted', 'Dữ liệu bị hỏng'),
('vi', 'errors', 'data_sync_failed', 'Đồng bộ dữ liệu thất bại'),
('vi', 'errors', 'conflict', 'Xung đột dữ liệu'),
('vi', 'errors', 'duplicate', 'Dữ liệu đã tồn tại'),
-- Permission errors
('vi', 'errors', 'unauthorized', 'Không có quyền truy cập'),
('vi', 'errors', 'forbidden', 'Truy cập bị từ chối'),
('vi', 'errors', 'access_denied', 'Truy cập bị từ chối'),
('vi', 'errors', 'session_expired', 'Phiên đăng nhập đã hết hạn'),
('vi', 'errors', 'login_required', 'Vui lòng đăng nhập để tiếp tục'),
('vi', 'errors', 'insufficient_permissions', 'Không đủ quyền hạn'),
-- File errors
('vi', 'errors', 'file_not_found', 'Không tìm thấy tệp'),
('vi', 'errors', 'file_too_large', 'Tệp quá lớn'),
('vi', 'errors', 'file_type_not_allowed', 'Loại tệp không được phép'),
('vi', 'errors', 'upload_failed', 'Tải lên thất bại'),
('vi', 'errors', 'download_failed', 'Tải xuống thất bại'),
('vi', 'errors', 'file_corrupted', 'Tệp bị hỏng'),
('vi', 'errors', 'storage_full', 'Bộ nhớ đầy'),
-- Page errors
('vi', 'errors', 'page_not_found', 'Trang không tồn tại'),
('vi', 'errors', 'page_not_found_message', 'Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển'),
('vi', 'errors', 'page_error', 'Lỗi trang'),
('vi', 'errors', 'something_wrong', 'Đã xảy ra sự cố'),
('vi', 'errors', 'oops', 'Oops!'),
-- Form/Action errors
('vi', 'errors', 'form_error', 'Vui lòng kiểm tra lại thông tin'),
('vi', 'errors', 'submit_failed', 'Gửi không thành công'),
('vi', 'errors', 'action_failed', 'Thao tác thất bại'),
('vi', 'errors', 'operation_failed', 'Thực hiện không thành công'),
('vi', 'errors', 'changes_not_saved', 'Thay đổi chưa được lưu'),
('vi', 'errors', 'unsaved_changes', 'Bạn có thay đổi chưa lưu')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ERRORS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General errors
('en', 'errors', 'generic', 'An error occurred'),
('en', 'errors', 'unknown', 'Unknown error'),
('en', 'errors', 'unexpected', 'Unexpected error'),
('en', 'errors', 'try_again', 'Please try again'),
('en', 'errors', 'try_again_later', 'Please try again later'),
('en', 'errors', 'contact_support', 'If the error persists, please contact support'),
('en', 'errors', 'report_error', 'Report Error'),
('en', 'errors', 'refresh_page', 'Refresh Page'),
('en', 'errors', 'go_back', 'Go Back'),
('en', 'errors', 'go_home', 'Go Home'),
-- Network errors
('en', 'errors', 'network', 'Network error'),
('en', 'errors', 'no_connection', 'No network connection'),
('en', 'errors', 'connection_lost', 'Connection lost'),
('en', 'errors', 'connection_restored', 'Connection restored'),
('en', 'errors', 'offline', 'You are offline'),
('en', 'errors', 'online', 'Back online'),
('en', 'errors', 'slow_connection', 'Slow connection'),
('en', 'errors', 'timeout', 'Request timed out'),
('en', 'errors', 'request_timeout', 'Request has timed out'),
('en', 'errors', 'server_unreachable', 'Cannot reach server'),
-- Server errors
('en', 'errors', 'server', 'Server error'),
('en', 'errors', 'server_error', 'Internal server error'),
('en', 'errors', 'server_busy', 'Server is busy'),
('en', 'errors', 'service_unavailable', 'Service temporarily unavailable'),
('en', 'errors', 'maintenance', 'System is under maintenance'),
('en', 'errors', 'bad_gateway', 'Bad gateway'),
('en', 'errors', 'gateway_timeout', 'Gateway timeout'),
-- HTTP errors
('en', 'errors', '400', 'Bad request'),
('en', 'errors', '401', 'Unauthorized'),
('en', 'errors', '403', 'Access forbidden'),
('en', 'errors', '404', 'Not found'),
('en', 'errors', '405', 'Method not allowed'),
('en', 'errors', '408', 'Request timeout'),
('en', 'errors', '409', 'Data conflict'),
('en', 'errors', '410', 'Resource no longer exists'),
('en', 'errors', '422', 'Unprocessable data'),
('en', 'errors', '429', 'Too many requests'),
('en', 'errors', '500', 'Internal server error'),
('en', 'errors', '502', 'Bad gateway'),
('en', 'errors', '503', 'Service unavailable'),
('en', 'errors', '504', 'Gateway timeout'),
-- Data errors
('en', 'errors', 'data_not_found', 'Data not found'),
('en', 'errors', 'data_load_failed', 'Failed to load data'),
('en', 'errors', 'data_save_failed', 'Failed to save data'),
('en', 'errors', 'data_delete_failed', 'Failed to delete data'),
('en', 'errors', 'data_update_failed', 'Failed to update data'),
('en', 'errors', 'data_corrupted', 'Data is corrupted'),
('en', 'errors', 'data_sync_failed', 'Data sync failed'),
('en', 'errors', 'conflict', 'Data conflict'),
('en', 'errors', 'duplicate', 'Data already exists'),
-- Permission errors
('en', 'errors', 'unauthorized', 'Unauthorized access'),
('en', 'errors', 'forbidden', 'Access forbidden'),
('en', 'errors', 'access_denied', 'Access denied'),
('en', 'errors', 'session_expired', 'Session has expired'),
('en', 'errors', 'login_required', 'Please login to continue'),
('en', 'errors', 'insufficient_permissions', 'Insufficient permissions'),
-- File errors
('en', 'errors', 'file_not_found', 'File not found'),
('en', 'errors', 'file_too_large', 'File is too large'),
('en', 'errors', 'file_type_not_allowed', 'File type not allowed'),
('en', 'errors', 'upload_failed', 'Upload failed'),
('en', 'errors', 'download_failed', 'Download failed'),
('en', 'errors', 'file_corrupted', 'File is corrupted'),
('en', 'errors', 'storage_full', 'Storage is full'),
-- Page errors
('en', 'errors', 'page_not_found', 'Page not found'),
('en', 'errors', 'page_not_found_message', 'The page you are looking for does not exist or has been moved'),
('en', 'errors', 'page_error', 'Page error'),
('en', 'errors', 'something_wrong', 'Something went wrong'),
('en', 'errors', 'oops', 'Oops!'),
-- Form/Action errors
('en', 'errors', 'form_error', 'Please check the form for errors'),
('en', 'errors', 'submit_failed', 'Submit failed'),
('en', 'errors', 'action_failed', 'Action failed'),
('en', 'errors', 'operation_failed', 'Operation failed'),
('en', 'errors', 'changes_not_saved', 'Changes were not saved'),
('en', 'errors', 'unsaved_changes', 'You have unsaved changes')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - VALIDATION MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Required fields
('vi', 'validation', 'required', 'Trường này là bắt buộc'),
('vi', 'validation', 'required_field', 'Vui lòng điền trường này'),
('vi', 'validation', 'field_required', '{field} là bắt buộc'),
('vi', 'validation', 'missing_required', 'Thiếu thông tin bắt buộc'),
('vi', 'validation', 'all_fields_required', 'Vui lòng điền tất cả các trường bắt buộc'),
-- String validation
('vi', 'validation', 'string', 'Phải là chuỗi ký tự'),
('vi', 'validation', 'min_length', 'Tối thiểu {min} ký tự'),
('vi', 'validation', 'max_length', 'Tối đa {max} ký tự'),
('vi', 'validation', 'exact_length', 'Phải có đúng {length} ký tự'),
('vi', 'validation', 'too_short', 'Quá ngắn'),
('vi', 'validation', 'too_long', 'Quá dài'),
('vi', 'validation', 'no_spaces', 'Không được chứa khoảng trắng'),
('vi', 'validation', 'alphanumeric', 'Chỉ được chứa chữ cái và số'),
('vi', 'validation', 'no_special_chars', 'Không được chứa ký tự đặc biệt'),
('vi', 'validation', 'lowercase_only', 'Chỉ được chứa chữ thường'),
('vi', 'validation', 'uppercase_only', 'Chỉ được chứa chữ in hoa'),
-- Number validation
('vi', 'validation', 'number', 'Phải là số'),
('vi', 'validation', 'integer', 'Phải là số nguyên'),
('vi', 'validation', 'positive', 'Phải là số dương'),
('vi', 'validation', 'negative', 'Phải là số âm'),
('vi', 'validation', 'min_value', 'Giá trị tối thiểu là {min}'),
('vi', 'validation', 'max_value', 'Giá trị tối đa là {max}'),
('vi', 'validation', 'between', 'Giá trị phải từ {min} đến {max}'),
('vi', 'validation', 'decimal', 'Phải là số thập phân'),
('vi', 'validation', 'percentage', 'Phải từ 0 đến 100'),
-- Email validation
('vi', 'validation', 'email', 'Email không hợp lệ'),
('vi', 'validation', 'email_format', 'Định dạng email không đúng'),
('vi', 'validation', 'email_domain', 'Tên miền email không hợp lệ'),
-- URL validation
('vi', 'validation', 'url', 'URL không hợp lệ'),
('vi', 'validation', 'url_format', 'Định dạng URL không đúng'),
('vi', 'validation', 'url_protocol', 'URL phải bắt đầu bằng http:// hoặc https://'),
-- Phone validation
('vi', 'validation', 'phone', 'Số điện thoại không hợp lệ'),
('vi', 'validation', 'phone_format', 'Định dạng số điện thoại không đúng'),
('vi', 'validation', 'phone_length', 'Số điện thoại phải có 10-11 chữ số'),
-- Date validation
('vi', 'validation', 'date', 'Ngày không hợp lệ'),
('vi', 'validation', 'date_format', 'Định dạng ngày không đúng'),
('vi', 'validation', 'date_past', 'Ngày phải trong quá khứ'),
('vi', 'validation', 'date_future', 'Ngày phải trong tương lai'),
('vi', 'validation', 'date_before', 'Ngày phải trước {date}'),
('vi', 'validation', 'date_after', 'Ngày phải sau {date}'),
('vi', 'validation', 'date_range', 'Ngày phải từ {start} đến {end}'),
('vi', 'validation', 'invalid_date_range', 'Khoảng thời gian không hợp lệ'),
('vi', 'validation', 'start_before_end', 'Ngày bắt đầu phải trước ngày kết thúc'),
-- Time validation
('vi', 'validation', 'time', 'Thời gian không hợp lệ'),
('vi', 'validation', 'time_format', 'Định dạng thời gian không đúng'),
-- Password validation
('vi', 'validation', 'password', 'Mật khẩu không hợp lệ'),
('vi', 'validation', 'password_min', 'Mật khẩu phải có ít nhất {min} ký tự'),
('vi', 'validation', 'password_max', 'Mật khẩu tối đa {max} ký tự'),
('vi', 'validation', 'password_uppercase', 'Mật khẩu phải có ít nhất 1 chữ in hoa'),
('vi', 'validation', 'password_lowercase', 'Mật khẩu phải có ít nhất 1 chữ thường'),
('vi', 'validation', 'password_number', 'Mật khẩu phải có ít nhất 1 chữ số'),
('vi', 'validation', 'password_special', 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
('vi', 'validation', 'password_match', 'Mật khẩu không khớp'),
('vi', 'validation', 'password_weak', 'Mật khẩu yếu'),
('vi', 'validation', 'password_medium', 'Mật khẩu trung bình'),
('vi', 'validation', 'password_strong', 'Mật khẩu mạnh'),
-- Selection validation
('vi', 'validation', 'select_option', 'Vui lòng chọn một tùy chọn'),
('vi', 'validation', 'select_at_least', 'Vui lòng chọn ít nhất {min} mục'),
('vi', 'validation', 'select_at_most', 'Vui lòng chọn tối đa {max} mục'),
('vi', 'validation', 'invalid_option', 'Tùy chọn không hợp lệ'),
-- File validation
('vi', 'validation', 'file_required', 'Vui lòng chọn tệp'),
('vi', 'validation', 'file_size', 'Kích thước tệp tối đa là {size}'),
('vi', 'validation', 'file_type', 'Loại tệp không được hỗ trợ'),
('vi', 'validation', 'file_extension', 'Định dạng tệp không được phép'),
('vi', 'validation', 'image_required', 'Vui lòng chọn ảnh'),
('vi', 'validation', 'image_size', 'Kích thước ảnh tối đa là {size}'),
('vi', 'validation', 'image_dimensions', 'Kích thước ảnh phải là {width}x{height}'),
('vi', 'validation', 'image_min_dimensions', 'Ảnh tối thiểu {width}x{height}'),
('vi', 'validation', 'image_max_dimensions', 'Ảnh tối đa {width}x{height}'),
-- Unique validation
('vi', 'validation', 'unique', 'Giá trị này đã tồn tại'),
('vi', 'validation', 'already_exists', 'Đã tồn tại'),
('vi', 'validation', 'duplicate_entry', 'Mục trùng lặp'),
-- Match validation
('vi', 'validation', 'match', 'Hai trường không khớp'),
('vi', 'validation', 'not_match', 'Không khớp với {field}'),
('vi', 'validation', 'confirm', 'Vui lòng xác nhận lại'),
-- Pattern validation
('vi', 'validation', 'pattern', 'Định dạng không hợp lệ'),
('vi', 'validation', 'regex', 'Không khớp với mẫu yêu cầu'),
-- Array validation
('vi', 'validation', 'array', 'Phải là mảng'),
('vi', 'validation', 'array_min', 'Phải có ít nhất {min} mục'),
('vi', 'validation', 'array_max', 'Tối đa {max} mục'),
('vi', 'validation', 'array_length', 'Phải có đúng {length} mục'),
-- Boolean validation
('vi', 'validation', 'accepted', 'Trường này phải được chấp nhận'),
('vi', 'validation', 'agree_terms', 'Bạn phải đồng ý với điều khoản'),
-- Custom validation
('vi', 'validation', 'invalid', 'Giá trị không hợp lệ'),
('vi', 'validation', 'invalid_format', 'Định dạng không hợp lệ'),
('vi', 'validation', 'invalid_input', 'Dữ liệu nhập không hợp lệ'),
('vi', 'validation', 'check_input', 'Vui lòng kiểm tra lại thông tin')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - VALIDATION MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Required fields
('en', 'validation', 'required', 'This field is required'),
('en', 'validation', 'required_field', 'Please fill in this field'),
('en', 'validation', 'field_required', '{field} is required'),
('en', 'validation', 'missing_required', 'Missing required information'),
('en', 'validation', 'all_fields_required', 'Please fill in all required fields'),
-- String validation
('en', 'validation', 'string', 'Must be a string'),
('en', 'validation', 'min_length', 'Minimum {min} characters'),
('en', 'validation', 'max_length', 'Maximum {max} characters'),
('en', 'validation', 'exact_length', 'Must be exactly {length} characters'),
('en', 'validation', 'too_short', 'Too short'),
('en', 'validation', 'too_long', 'Too long'),
('en', 'validation', 'no_spaces', 'Cannot contain spaces'),
('en', 'validation', 'alphanumeric', 'Only letters and numbers allowed'),
('en', 'validation', 'no_special_chars', 'Cannot contain special characters'),
('en', 'validation', 'lowercase_only', 'Only lowercase letters allowed'),
('en', 'validation', 'uppercase_only', 'Only uppercase letters allowed'),
-- Number validation
('en', 'validation', 'number', 'Must be a number'),
('en', 'validation', 'integer', 'Must be an integer'),
('en', 'validation', 'positive', 'Must be positive'),
('en', 'validation', 'negative', 'Must be negative'),
('en', 'validation', 'min_value', 'Minimum value is {min}'),
('en', 'validation', 'max_value', 'Maximum value is {max}'),
('en', 'validation', 'between', 'Value must be between {min} and {max}'),
('en', 'validation', 'decimal', 'Must be a decimal number'),
('en', 'validation', 'percentage', 'Must be between 0 and 100'),
-- Email validation
('en', 'validation', 'email', 'Invalid email address'),
('en', 'validation', 'email_format', 'Invalid email format'),
('en', 'validation', 'email_domain', 'Invalid email domain'),
-- URL validation
('en', 'validation', 'url', 'Invalid URL'),
('en', 'validation', 'url_format', 'Invalid URL format'),
('en', 'validation', 'url_protocol', 'URL must start with http:// or https://'),
-- Phone validation
('en', 'validation', 'phone', 'Invalid phone number'),
('en', 'validation', 'phone_format', 'Invalid phone format'),
('en', 'validation', 'phone_length', 'Phone number must be 10-11 digits'),
-- Date validation
('en', 'validation', 'date', 'Invalid date'),
('en', 'validation', 'date_format', 'Invalid date format'),
('en', 'validation', 'date_past', 'Date must be in the past'),
('en', 'validation', 'date_future', 'Date must be in the future'),
('en', 'validation', 'date_before', 'Date must be before {date}'),
('en', 'validation', 'date_after', 'Date must be after {date}'),
('en', 'validation', 'date_range', 'Date must be between {start} and {end}'),
('en', 'validation', 'invalid_date_range', 'Invalid date range'),
('en', 'validation', 'start_before_end', 'Start date must be before end date'),
-- Time validation
('en', 'validation', 'time', 'Invalid time'),
('en', 'validation', 'time_format', 'Invalid time format'),
-- Password validation
('en', 'validation', 'password', 'Invalid password'),
('en', 'validation', 'password_min', 'Password must be at least {min} characters'),
('en', 'validation', 'password_max', 'Password must be at most {max} characters'),
('en', 'validation', 'password_uppercase', 'Password must contain at least 1 uppercase letter'),
('en', 'validation', 'password_lowercase', 'Password must contain at least 1 lowercase letter'),
('en', 'validation', 'password_number', 'Password must contain at least 1 number'),
('en', 'validation', 'password_special', 'Password must contain at least 1 special character'),
('en', 'validation', 'password_match', 'Passwords do not match'),
('en', 'validation', 'password_weak', 'Weak password'),
('en', 'validation', 'password_medium', 'Medium password'),
('en', 'validation', 'password_strong', 'Strong password'),
-- Selection validation
('en', 'validation', 'select_option', 'Please select an option'),
('en', 'validation', 'select_at_least', 'Please select at least {min} items'),
('en', 'validation', 'select_at_most', 'Please select at most {max} items'),
('en', 'validation', 'invalid_option', 'Invalid option'),
-- File validation
('en', 'validation', 'file_required', 'Please select a file'),
('en', 'validation', 'file_size', 'Maximum file size is {size}'),
('en', 'validation', 'file_type', 'File type not supported'),
('en', 'validation', 'file_extension', 'File extension not allowed'),
('en', 'validation', 'image_required', 'Please select an image'),
('en', 'validation', 'image_size', 'Maximum image size is {size}'),
('en', 'validation', 'image_dimensions', 'Image must be {width}x{height}'),
('en', 'validation', 'image_min_dimensions', 'Minimum image size {width}x{height}'),
('en', 'validation', 'image_max_dimensions', 'Maximum image size {width}x{height}'),
-- Unique validation
('en', 'validation', 'unique', 'This value already exists'),
('en', 'validation', 'already_exists', 'Already exists'),
('en', 'validation', 'duplicate_entry', 'Duplicate entry'),
-- Match validation
('en', 'validation', 'match', 'Fields do not match'),
('en', 'validation', 'not_match', 'Does not match {field}'),
('en', 'validation', 'confirm', 'Please confirm again'),
-- Pattern validation
('en', 'validation', 'pattern', 'Invalid format'),
('en', 'validation', 'regex', 'Does not match required pattern'),
-- Array validation
('en', 'validation', 'array', 'Must be an array'),
('en', 'validation', 'array_min', 'Must have at least {min} items'),
('en', 'validation', 'array_max', 'Maximum {max} items'),
('en', 'validation', 'array_length', 'Must have exactly {length} items'),
-- Boolean validation
('en', 'validation', 'accepted', 'This field must be accepted'),
('en', 'validation', 'agree_terms', 'You must agree to the terms'),
-- Custom validation
('en', 'validation', 'invalid', 'Invalid value'),
('en', 'validation', 'invalid_format', 'Invalid format'),
('en', 'validation', 'invalid_input', 'Invalid input'),
('en', 'validation', 'check_input', 'Please check your input')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - SUCCESS MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General success
('vi', 'success', 'generic', 'Thành công!'),
('vi', 'success', 'done', 'Hoàn tất!'),
('vi', 'success', 'completed', 'Đã hoàn thành!'),
('vi', 'success', 'operation_success', 'Thao tác thành công'),
('vi', 'success', 'action_completed', 'Hành động đã hoàn thành'),
('vi', 'success', 'changes_applied', 'Thay đổi đã được áp dụng'),
-- CRUD success
('vi', 'success', 'created', 'Đã tạo thành công!'),
('vi', 'success', 'saved', 'Đã lưu thành công!'),
('vi', 'success', 'updated', 'Đã cập nhật thành công!'),
('vi', 'success', 'deleted', 'Đã xóa thành công!'),
('vi', 'success', 'removed', 'Đã xóa!'),
('vi', 'success', 'added', 'Đã thêm thành công!'),
('vi', 'success', 'copied', 'Đã sao chép!'),
('vi', 'success', 'moved', 'Đã di chuyển!'),
('vi', 'success', 'renamed', 'Đã đổi tên!'),
('vi', 'success', 'duplicated', 'Đã nhân bản!'),
-- Item-specific success
('vi', 'success', 'item_created', '{item} đã được tạo'),
('vi', 'success', 'item_saved', '{item} đã được lưu'),
('vi', 'success', 'item_updated', '{item} đã được cập nhật'),
('vi', 'success', 'item_deleted', '{item} đã được xóa'),
('vi', 'success', 'item_added', '{item} đã được thêm'),
('vi', 'success', 'item_removed', '{item} đã được xóa'),
-- Data success
('vi', 'success', 'data_saved', 'Dữ liệu đã được lưu'),
('vi', 'success', 'data_loaded', 'Dữ liệu đã được tải'),
('vi', 'success', 'data_synced', 'Đã đồng bộ dữ liệu'),
('vi', 'success', 'data_exported', 'Đã xuất dữ liệu'),
('vi', 'success', 'data_imported', 'Đã nhập dữ liệu'),
('vi', 'success', 'backup_created', 'Đã tạo bản sao lưu'),
('vi', 'success', 'backup_restored', 'Đã khôi phục từ bản sao lưu'),
-- File success
('vi', 'success', 'file_uploaded', 'Đã tải lên tệp'),
('vi', 'success', 'file_downloaded', 'Đã tải xuống tệp'),
('vi', 'success', 'file_deleted', 'Đã xóa tệp'),
('vi', 'success', 'image_uploaded', 'Đã tải lên ảnh'),
('vi', 'success', 'avatar_updated', 'Đã cập nhật ảnh đại diện'),
-- User success
('vi', 'success', 'profile_updated', 'Đã cập nhật hồ sơ'),
('vi', 'success', 'settings_saved', 'Đã lưu cài đặt'),
('vi', 'success', 'preferences_saved', 'Đã lưu tùy chọn'),
('vi', 'success', 'password_changed', 'Đã đổi mật khẩu'),
('vi', 'success', 'email_changed', 'Đã đổi email'),
('vi', 'success', 'account_updated', 'Đã cập nhật tài khoản'),
-- Communication success
('vi', 'success', 'email_sent', 'Đã gửi email'),
('vi', 'success', 'message_sent', 'Đã gửi tin nhắn'),
('vi', 'success', 'notification_sent', 'Đã gửi thông báo'),
('vi', 'success', 'invitation_sent', 'Đã gửi lời mời'),
('vi', 'success', 'link_copied', 'Đã sao chép liên kết'),
('vi', 'success', 'text_copied', 'Đã sao chép văn bản'),
('vi', 'success', 'code_copied', 'Đã sao chép mã'),
-- Status success
('vi', 'success', 'status_changed', 'Đã thay đổi trạng thái'),
('vi', 'success', 'marked_complete', 'Đã đánh dấu hoàn thành'),
('vi', 'success', 'marked_incomplete', 'Đã đánh dấu chưa hoàn thành'),
('vi', 'success', 'archived', 'Đã lưu trữ'),
('vi', 'success', 'unarchived', 'Đã bỏ lưu trữ'),
('vi', 'success', 'restored', 'Đã khôi phục'),
('vi', 'success', 'activated', 'Đã kích hoạt'),
('vi', 'success', 'deactivated', 'Đã vô hiệu hóa'),
('vi', 'success', 'enabled', 'Đã bật'),
('vi', 'success', 'disabled', 'Đã tắt'),
-- Feature success
('vi', 'success', 'subscribed', 'Đã đăng ký'),
('vi', 'success', 'unsubscribed', 'Đã hủy đăng ký'),
('vi', 'success', 'connected', 'Đã kết nối'),
('vi', 'success', 'disconnected', 'Đã ngắt kết nối'),
('vi', 'success', 'synced', 'Đã đồng bộ'),
('vi', 'success', 'refreshed', 'Đã làm mới'),
('vi', 'success', 'reset', 'Đã đặt lại'),
-- Sharing success
('vi', 'success', 'shared', 'Đã chia sẻ'),
('vi', 'success', 'published', 'Đã xuất bản'),
('vi', 'success', 'unpublished', 'Đã ẩn'),
('vi', 'success', 'permission_granted', 'Đã cấp quyền'),
('vi', 'success', 'permission_revoked', 'Đã thu hồi quyền')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - SUCCESS MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General success
('en', 'success', 'generic', 'Success!'),
('en', 'success', 'done', 'Done!'),
('en', 'success', 'completed', 'Completed!'),
('en', 'success', 'operation_success', 'Operation successful'),
('en', 'success', 'action_completed', 'Action completed'),
('en', 'success', 'changes_applied', 'Changes applied'),
-- CRUD success
('en', 'success', 'created', 'Created successfully!'),
('en', 'success', 'saved', 'Saved successfully!'),
('en', 'success', 'updated', 'Updated successfully!'),
('en', 'success', 'deleted', 'Deleted successfully!'),
('en', 'success', 'removed', 'Removed!'),
('en', 'success', 'added', 'Added successfully!'),
('en', 'success', 'copied', 'Copied!'),
('en', 'success', 'moved', 'Moved!'),
('en', 'success', 'renamed', 'Renamed!'),
('en', 'success', 'duplicated', 'Duplicated!'),
-- Item-specific success
('en', 'success', 'item_created', '{item} has been created'),
('en', 'success', 'item_saved', '{item} has been saved'),
('en', 'success', 'item_updated', '{item} has been updated'),
('en', 'success', 'item_deleted', '{item} has been deleted'),
('en', 'success', 'item_added', '{item} has been added'),
('en', 'success', 'item_removed', '{item} has been removed'),
-- Data success
('en', 'success', 'data_saved', 'Data has been saved'),
('en', 'success', 'data_loaded', 'Data has been loaded'),
('en', 'success', 'data_synced', 'Data synced successfully'),
('en', 'success', 'data_exported', 'Data exported successfully'),
('en', 'success', 'data_imported', 'Data imported successfully'),
('en', 'success', 'backup_created', 'Backup created successfully'),
('en', 'success', 'backup_restored', 'Backup restored successfully'),
-- File success
('en', 'success', 'file_uploaded', 'File uploaded successfully'),
('en', 'success', 'file_downloaded', 'File downloaded successfully'),
('en', 'success', 'file_deleted', 'File deleted successfully'),
('en', 'success', 'image_uploaded', 'Image uploaded successfully'),
('en', 'success', 'avatar_updated', 'Avatar updated successfully'),
-- User success
('en', 'success', 'profile_updated', 'Profile updated successfully'),
('en', 'success', 'settings_saved', 'Settings saved successfully'),
('en', 'success', 'preferences_saved', 'Preferences saved successfully'),
('en', 'success', 'password_changed', 'Password changed successfully'),
('en', 'success', 'email_changed', 'Email changed successfully'),
('en', 'success', 'account_updated', 'Account updated successfully'),
-- Communication success
('en', 'success', 'email_sent', 'Email sent successfully'),
('en', 'success', 'message_sent', 'Message sent successfully'),
('en', 'success', 'notification_sent', 'Notification sent successfully'),
('en', 'success', 'invitation_sent', 'Invitation sent successfully'),
('en', 'success', 'link_copied', 'Link copied to clipboard'),
('en', 'success', 'text_copied', 'Text copied to clipboard'),
('en', 'success', 'code_copied', 'Code copied to clipboard'),
-- Status success
('en', 'success', 'status_changed', 'Status changed successfully'),
('en', 'success', 'marked_complete', 'Marked as complete'),
('en', 'success', 'marked_incomplete', 'Marked as incomplete'),
('en', 'success', 'archived', 'Archived successfully'),
('en', 'success', 'unarchived', 'Unarchived successfully'),
('en', 'success', 'restored', 'Restored successfully'),
('en', 'success', 'activated', 'Activated successfully'),
('en', 'success', 'deactivated', 'Deactivated successfully'),
('en', 'success', 'enabled', 'Enabled successfully'),
('en', 'success', 'disabled', 'Disabled successfully'),
-- Feature success
('en', 'success', 'subscribed', 'Subscribed successfully'),
('en', 'success', 'unsubscribed', 'Unsubscribed successfully'),
('en', 'success', 'connected', 'Connected successfully'),
('en', 'success', 'disconnected', 'Disconnected successfully'),
('en', 'success', 'synced', 'Synced successfully'),
('en', 'success', 'refreshed', 'Refreshed successfully'),
('en', 'success', 'reset', 'Reset successfully'),
-- Sharing success
('en', 'success', 'shared', 'Shared successfully'),
('en', 'success', 'published', 'Published successfully'),
('en', 'success', 'unpublished', 'Unpublished successfully'),
('en', 'success', 'permission_granted', 'Permission granted'),
('en', 'success', 'permission_revoked', 'Permission revoked')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - CONFIRM MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General confirm
('vi', 'confirm', 'title', 'Xác nhận'),
('vi', 'confirm', 'are_you_sure', 'Bạn có chắc chắn?'),
('vi', 'confirm', 'please_confirm', 'Vui lòng xác nhận'),
('vi', 'confirm', 'confirm_action', 'Xác nhận hành động'),
('vi', 'confirm', 'yes', 'Có'),
('vi', 'confirm', 'no', 'Không'),
('vi', 'confirm', 'ok', 'OK'),
('vi', 'confirm', 'confirm', 'Xác nhận'),
('vi', 'confirm', 'cancel', 'Hủy'),
('vi', 'confirm', 'continue', 'Tiếp tục'),
('vi', 'confirm', 'proceed', 'Thực hiện'),
('vi', 'confirm', 'go_back', 'Quay lại'),
('vi', 'confirm', 'close', 'Đóng'),
-- Delete confirm
('vi', 'confirm', 'delete_title', 'Xác nhận xóa'),
('vi', 'confirm', 'delete_message', 'Bạn có chắc muốn xóa mục này?'),
('vi', 'confirm', 'delete_item', 'Xóa {item}?'),
('vi', 'confirm', 'delete_item_message', 'Bạn có chắc muốn xóa {item}?'),
('vi', 'confirm', 'delete_permanent', 'Xóa vĩnh viễn'),
('vi', 'confirm', 'delete_permanent_message', 'Mục này sẽ bị xóa vĩnh viễn và không thể khôi phục.'),
('vi', 'confirm', 'delete_multiple', 'Xóa {count} mục?'),
('vi', 'confirm', 'delete_multiple_message', 'Bạn có chắc muốn xóa {count} mục đã chọn?'),
('vi', 'confirm', 'delete_all', 'Xóa tất cả?'),
('vi', 'confirm', 'delete_all_message', 'Bạn có chắc muốn xóa tất cả?'),
('vi', 'confirm', 'cannot_undo', 'Hành động này không thể hoàn tác.'),
('vi', 'confirm', 'type_to_confirm', 'Nhập "{text}" để xác nhận'),
-- Discard confirm
('vi', 'confirm', 'discard_title', 'Hủy thay đổi?'),
('vi', 'confirm', 'discard_message', 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?'),
('vi', 'confirm', 'discard_changes', 'Hủy thay đổi'),
('vi', 'confirm', 'save_changes', 'Lưu thay đổi'),
('vi', 'confirm', 'unsaved_changes', 'Thay đổi chưa lưu'),
('vi', 'confirm', 'unsaved_changes_message', 'Bạn có thay đổi chưa lưu. Bạn muốn lưu trước khi rời đi?'),
('vi', 'confirm', 'leave_page', 'Rời khỏi trang?'),
('vi', 'confirm', 'leave_page_message', 'Thay đổi của bạn có thể không được lưu.'),
('vi', 'confirm', 'stay', 'Ở lại'),
('vi', 'confirm', 'leave', 'Rời đi'),
('vi', 'confirm', 'dont_save', 'Không lưu'),
-- Archive confirm
('vi', 'confirm', 'archive_title', 'Lưu trữ?'),
('vi', 'confirm', 'archive_message', 'Bạn có chắc muốn lưu trữ mục này?'),
('vi', 'confirm', 'archive_item', 'Lưu trữ {item}?'),
('vi', 'confirm', 'unarchive_title', 'Bỏ lưu trữ?'),
('vi', 'confirm', 'unarchive_message', 'Bạn có chắc muốn bỏ lưu trữ mục này?'),
-- Restore confirm
('vi', 'confirm', 'restore_title', 'Khôi phục?'),
('vi', 'confirm', 'restore_message', 'Bạn có chắc muốn khôi phục mục này?'),
('vi', 'confirm', 'restore_item', 'Khôi phục {item}?'),
-- Status confirm
('vi', 'confirm', 'status_change', 'Thay đổi trạng thái?'),
('vi', 'confirm', 'status_change_message', 'Bạn có chắc muốn thay đổi trạng thái?'),
('vi', 'confirm', 'activate_title', 'Kích hoạt?'),
('vi', 'confirm', 'activate_message', 'Bạn có chắc muốn kích hoạt mục này?'),
('vi', 'confirm', 'deactivate_title', 'Vô hiệu hóa?'),
('vi', 'confirm', 'deactivate_message', 'Bạn có chắc muốn vô hiệu hóa mục này?'),
-- Logout confirm
('vi', 'confirm', 'logout_title', 'Đăng xuất?'),
('vi', 'confirm', 'logout_message', 'Bạn có chắc muốn đăng xuất?'),
('vi', 'confirm', 'logout_all_title', 'Đăng xuất tất cả thiết bị?'),
('vi', 'confirm', 'logout_all_message', 'Bạn sẽ bị đăng xuất khỏi tất cả các thiết bị.'),
-- Account confirm
('vi', 'confirm', 'delete_account_title', 'Xóa tài khoản?'),
('vi', 'confirm', 'delete_account_message', 'Tài khoản và tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.'),
('vi', 'confirm', 'delete_account_warning', 'Cảnh báo: Đây là hành động vĩnh viễn'),
-- Reset confirm
('vi', 'confirm', 'reset_title', 'Đặt lại?'),
('vi', 'confirm', 'reset_message', 'Bạn có chắc muốn đặt lại về mặc định?'),
('vi', 'confirm', 'reset_settings', 'Đặt lại cài đặt?'),
('vi', 'confirm', 'reset_settings_message', 'Tất cả cài đặt sẽ được khôi phục về mặc định.'),
('vi', 'confirm', 'clear_data', 'Xóa dữ liệu?'),
('vi', 'confirm', 'clear_data_message', 'Tất cả dữ liệu sẽ bị xóa. Hành động này không thể hoàn tác.'),
-- Submit confirm
('vi', 'confirm', 'submit_title', 'Gửi?'),
('vi', 'confirm', 'submit_message', 'Bạn có chắc muốn gửi?'),
('vi', 'confirm', 'publish_title', 'Xuất bản?'),
('vi', 'confirm', 'publish_message', 'Bạn có chắc muốn xuất bản? Mọi người sẽ có thể xem.'),
-- Cancel confirm
('vi', 'confirm', 'cancel_title', 'Hủy?'),
('vi', 'confirm', 'cancel_message', 'Bạn có chắc muốn hủy?'),
('vi', 'confirm', 'cancel_subscription', 'Hủy đăng ký?'),
('vi', 'confirm', 'cancel_subscription_message', 'Bạn có chắc muốn hủy đăng ký? Bạn sẽ mất quyền truy cập các tính năng cao cấp.')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - CONFIRM MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General confirm
('en', 'confirm', 'title', 'Confirm'),
('en', 'confirm', 'are_you_sure', 'Are you sure?'),
('en', 'confirm', 'please_confirm', 'Please confirm'),
('en', 'confirm', 'confirm_action', 'Confirm action'),
('en', 'confirm', 'yes', 'Yes'),
('en', 'confirm', 'no', 'No'),
('en', 'confirm', 'ok', 'OK'),
('en', 'confirm', 'confirm', 'Confirm'),
('en', 'confirm', 'cancel', 'Cancel'),
('en', 'confirm', 'continue', 'Continue'),
('en', 'confirm', 'proceed', 'Proceed'),
('en', 'confirm', 'go_back', 'Go Back'),
('en', 'confirm', 'close', 'Close'),
-- Delete confirm
('en', 'confirm', 'delete_title', 'Confirm Delete'),
('en', 'confirm', 'delete_message', 'Are you sure you want to delete this item?'),
('en', 'confirm', 'delete_item', 'Delete {item}?'),
('en', 'confirm', 'delete_item_message', 'Are you sure you want to delete {item}?'),
('en', 'confirm', 'delete_permanent', 'Delete Permanently'),
('en', 'confirm', 'delete_permanent_message', 'This item will be permanently deleted and cannot be recovered.'),
('en', 'confirm', 'delete_multiple', 'Delete {count} items?'),
('en', 'confirm', 'delete_multiple_message', 'Are you sure you want to delete {count} selected items?'),
('en', 'confirm', 'delete_all', 'Delete all?'),
('en', 'confirm', 'delete_all_message', 'Are you sure you want to delete all?'),
('en', 'confirm', 'cannot_undo', 'This action cannot be undone.'),
('en', 'confirm', 'type_to_confirm', 'Type "{text}" to confirm'),
-- Discard confirm
('en', 'confirm', 'discard_title', 'Discard changes?'),
('en', 'confirm', 'discard_message', 'You have unsaved changes. Are you sure you want to discard them?'),
('en', 'confirm', 'discard_changes', 'Discard Changes'),
('en', 'confirm', 'save_changes', 'Save Changes'),
('en', 'confirm', 'unsaved_changes', 'Unsaved Changes'),
('en', 'confirm', 'unsaved_changes_message', 'You have unsaved changes. Do you want to save before leaving?'),
('en', 'confirm', 'leave_page', 'Leave page?'),
('en', 'confirm', 'leave_page_message', 'Your changes may not be saved.'),
('en', 'confirm', 'stay', 'Stay'),
('en', 'confirm', 'leave', 'Leave'),
('en', 'confirm', 'dont_save', 'Don''t Save'),
-- Archive confirm
('en', 'confirm', 'archive_title', 'Archive?'),
('en', 'confirm', 'archive_message', 'Are you sure you want to archive this item?'),
('en', 'confirm', 'archive_item', 'Archive {item}?'),
('en', 'confirm', 'unarchive_title', 'Unarchive?'),
('en', 'confirm', 'unarchive_message', 'Are you sure you want to unarchive this item?'),
-- Restore confirm
('en', 'confirm', 'restore_title', 'Restore?'),
('en', 'confirm', 'restore_message', 'Are you sure you want to restore this item?'),
('en', 'confirm', 'restore_item', 'Restore {item}?'),
-- Status confirm
('en', 'confirm', 'status_change', 'Change status?'),
('en', 'confirm', 'status_change_message', 'Are you sure you want to change the status?'),
('en', 'confirm', 'activate_title', 'Activate?'),
('en', 'confirm', 'activate_message', 'Are you sure you want to activate this item?'),
('en', 'confirm', 'deactivate_title', 'Deactivate?'),
('en', 'confirm', 'deactivate_message', 'Are you sure you want to deactivate this item?'),
-- Logout confirm
('en', 'confirm', 'logout_title', 'Logout?'),
('en', 'confirm', 'logout_message', 'Are you sure you want to logout?'),
('en', 'confirm', 'logout_all_title', 'Logout from all devices?'),
('en', 'confirm', 'logout_all_message', 'You will be logged out from all devices.'),
-- Account confirm
('en', 'confirm', 'delete_account_title', 'Delete Account?'),
('en', 'confirm', 'delete_account_message', 'Your account and all data will be permanently deleted. This action cannot be undone.'),
('en', 'confirm', 'delete_account_warning', 'Warning: This is a permanent action'),
-- Reset confirm
('en', 'confirm', 'reset_title', 'Reset?'),
('en', 'confirm', 'reset_message', 'Are you sure you want to reset to defaults?'),
('en', 'confirm', 'reset_settings', 'Reset settings?'),
('en', 'confirm', 'reset_settings_message', 'All settings will be restored to default values.'),
('en', 'confirm', 'clear_data', 'Clear data?'),
('en', 'confirm', 'clear_data_message', 'All data will be deleted. This action cannot be undone.'),
-- Submit confirm
('en', 'confirm', 'submit_title', 'Submit?'),
('en', 'confirm', 'submit_message', 'Are you sure you want to submit?'),
('en', 'confirm', 'publish_title', 'Publish?'),
('en', 'confirm', 'publish_message', 'Are you sure you want to publish? Everyone will be able to see.'),
-- Cancel confirm
('en', 'confirm', 'cancel_title', 'Cancel?'),
('en', 'confirm', 'cancel_message', 'Are you sure you want to cancel?'),
('en', 'confirm', 'cancel_subscription', 'Cancel subscription?'),
('en', 'confirm', 'cancel_subscription_message', 'Are you sure you want to cancel your subscription? You will lose access to premium features.')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - LOADING MODULE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Loading states
('vi', 'loading', 'loading', 'Đang tải...'),
('vi', 'loading', 'please_wait', 'Vui lòng đợi...'),
('vi', 'loading', 'loading_data', 'Đang tải dữ liệu...'),
('vi', 'loading', 'loading_content', 'Đang tải nội dung...'),
('vi', 'loading', 'loading_page', 'Đang tải trang...'),
('vi', 'loading', 'loading_more', 'Đang tải thêm...'),
('vi', 'loading', 'refreshing', 'Đang làm mới...'),
('vi', 'loading', 'syncing', 'Đang đồng bộ...'),
('vi', 'loading', 'saving', 'Đang lưu...'),
('vi', 'loading', 'processing', 'Đang xử lý...'),
('vi', 'loading', 'uploading', 'Đang tải lên...'),
('vi', 'loading', 'downloading', 'Đang tải xuống...'),
('vi', 'loading', 'sending', 'Đang gửi...'),
('vi', 'loading', 'connecting', 'Đang kết nối...'),
('vi', 'loading', 'authenticating', 'Đang xác thực...'),
('vi', 'loading', 'verifying', 'Đang xác minh...'),
('vi', 'loading', 'searching', 'Đang tìm kiếm...'),
('vi', 'loading', 'filtering', 'Đang lọc...'),
('vi', 'loading', 'sorting', 'Đang sắp xếp...'),
('vi', 'loading', 'generating', 'Đang tạo...'),
('vi', 'loading', 'calculating', 'Đang tính toán...'),
('vi', 'loading', 'initializing', 'Đang khởi tạo...'),
('vi', 'loading', 'preparing', 'Đang chuẩn bị...'),
('vi', 'loading', 'checking', 'Đang kiểm tra...'),
('vi', 'loading', 'updating', 'Đang cập nhật...'),
('vi', 'loading', 'deleting', 'Đang xóa...'),
('vi', 'loading', 'restoring', 'Đang khôi phục...'),
('vi', 'loading', 'exporting', 'Đang xuất...'),
('vi', 'loading', 'importing', 'Đang nhập...'),
('vi', 'loading', 'compressing', 'Đang nén...'),
('vi', 'loading', 'decompressing', 'Đang giải nén...'),
-- Progress
('vi', 'loading', 'progress', '{percent}% hoàn thành'),
('vi', 'loading', 'step_of', 'Bước {current} / {total}'),
('vi', 'loading', 'almost_done', 'Sắp xong...'),
('vi', 'loading', 'finalizing', 'Đang hoàn tất...'),
('vi', 'loading', 'this_may_take', 'Quá trình này có thể mất vài giây'),
('vi', 'loading', 'do_not_close', 'Vui lòng không đóng trang này')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - LOADING MODULE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Loading states
('en', 'loading', 'loading', 'Loading...'),
('en', 'loading', 'please_wait', 'Please wait...'),
('en', 'loading', 'loading_data', 'Loading data...'),
('en', 'loading', 'loading_content', 'Loading content...'),
('en', 'loading', 'loading_page', 'Loading page...'),
('en', 'loading', 'loading_more', 'Loading more...'),
('en', 'loading', 'refreshing', 'Refreshing...'),
('en', 'loading', 'syncing', 'Syncing...'),
('en', 'loading', 'saving', 'Saving...'),
('en', 'loading', 'processing', 'Processing...'),
('en', 'loading', 'uploading', 'Uploading...'),
('en', 'loading', 'downloading', 'Downloading...'),
('en', 'loading', 'sending', 'Sending...'),
('en', 'loading', 'connecting', 'Connecting...'),
('en', 'loading', 'authenticating', 'Authenticating...'),
('en', 'loading', 'verifying', 'Verifying...'),
('en', 'loading', 'searching', 'Searching...'),
('en', 'loading', 'filtering', 'Filtering...'),
('en', 'loading', 'sorting', 'Sorting...'),
('en', 'loading', 'generating', 'Generating...'),
('en', 'loading', 'calculating', 'Calculating...'),
('en', 'loading', 'initializing', 'Initializing...'),
('en', 'loading', 'preparing', 'Preparing...'),
('en', 'loading', 'checking', 'Checking...'),
('en', 'loading', 'updating', 'Updating...'),
('en', 'loading', 'deleting', 'Deleting...'),
('en', 'loading', 'restoring', 'Restoring...'),
('en', 'loading', 'exporting', 'Exporting...'),
('en', 'loading', 'importing', 'Importing...'),
('en', 'loading', 'compressing', 'Compressing...'),
('en', 'loading', 'decompressing', 'Decompressing...'),
-- Progress
('en', 'loading', 'progress', '{percent}% complete'),
('en', 'loading', 'step_of', 'Step {current} of {total}'),
('en', 'loading', 'almost_done', 'Almost done...'),
('en', 'loading', 'finalizing', 'Finalizing...'),
('en', 'loading', 'this_may_take', 'This may take a few seconds'),
('en', 'loading', 'do_not_close', 'Please do not close this page')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - EMPTY STATES (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General empty states
('vi', 'empty', 'no_data', 'Không có dữ liệu'),
('vi', 'empty', 'no_results', 'Không có kết quả'),
('vi', 'empty', 'no_items', 'Chưa có mục nào'),
('vi', 'empty', 'nothing_here', 'Không có gì ở đây'),
('vi', 'empty', 'nothing_to_show', 'Không có gì để hiển thị'),
('vi', 'empty', 'empty_list', 'Danh sách trống'),
('vi', 'empty', 'no_content', 'Chưa có nội dung'),
-- Search empty
('vi', 'empty', 'no_search_results', 'Không tìm thấy kết quả'),
('vi', 'empty', 'no_matches', 'Không có kết quả phù hợp'),
('vi', 'empty', 'try_different_search', 'Thử tìm kiếm với từ khóa khác'),
('vi', 'empty', 'adjust_filters', 'Thử điều chỉnh bộ lọc'),
('vi', 'empty', 'clear_filters', 'Xóa bộ lọc để xem tất cả'),
-- Module-specific empty
('vi', 'empty', 'no_goals', 'Chưa có mục tiêu nào'),
('vi', 'empty', 'no_tasks', 'Chưa có công việc nào'),
('vi', 'empty', 'no_habits', 'Chưa có thói quen nào'),
('vi', 'empty', 'no_notes', 'Chưa có ghi chú nào'),
('vi', 'empty', 'no_journal', 'Chưa có nhật ký nào'),
('vi', 'empty', 'no_reviews', 'Chưa có đánh giá tuần nào'),
('vi', 'empty', 'no_conversations', 'Chưa có cuộc trò chuyện nào'),
('vi', 'empty', 'no_notifications', 'Không có thông báo'),
('vi', 'empty', 'no_messages', 'Chưa có tin nhắn nào'),
('vi', 'empty', 'no_files', 'Chưa có tệp nào'),
('vi', 'empty', 'no_images', 'Chưa có ảnh nào'),
('vi', 'empty', 'no_tags', 'Chưa có thẻ nào'),
('vi', 'empty', 'no_categories', 'Chưa có danh mục nào'),
('vi', 'empty', 'no_templates', 'Chưa có mẫu nào'),
('vi', 'empty', 'no_activity', 'Chưa có hoạt động nào'),
('vi', 'empty', 'no_history', 'Chưa có lịch sử'),
('vi', 'empty', 'no_recent', 'Không có mục gần đây'),
('vi', 'empty', 'no_favorites', 'Chưa có mục yêu thích nào'),
('vi', 'empty', 'no_archived', 'Không có mục lưu trữ'),
('vi', 'empty', 'no_trash', 'Thùng rác trống'),
-- Action prompts
('vi', 'empty', 'create_first', 'Tạo {item} đầu tiên của bạn'),
('vi', 'empty', 'add_first', 'Thêm {item} đầu tiên'),
('vi', 'empty', 'get_started', 'Bắt đầu nào!'),
('vi', 'empty', 'start_creating', 'Bắt đầu tạo'),
('vi', 'empty', 'add_new', 'Thêm mới'),
('vi', 'empty', 'import_data', 'Nhập dữ liệu')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - EMPTY STATES (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General empty states
('en', 'empty', 'no_data', 'No data'),
('en', 'empty', 'no_results', 'No results'),
('en', 'empty', 'no_items', 'No items yet'),
('en', 'empty', 'nothing_here', 'Nothing here'),
('en', 'empty', 'nothing_to_show', 'Nothing to show'),
('en', 'empty', 'empty_list', 'Empty list'),
('en', 'empty', 'no_content', 'No content yet'),
-- Search empty
('en', 'empty', 'no_search_results', 'No search results'),
('en', 'empty', 'no_matches', 'No matches found'),
('en', 'empty', 'try_different_search', 'Try a different search term'),
('en', 'empty', 'adjust_filters', 'Try adjusting your filters'),
('en', 'empty', 'clear_filters', 'Clear filters to see all'),
-- Module-specific empty
('en', 'empty', 'no_goals', 'No goals yet'),
('en', 'empty', 'no_tasks', 'No tasks yet'),
('en', 'empty', 'no_habits', 'No habits yet'),
('en', 'empty', 'no_notes', 'No notes yet'),
('en', 'empty', 'no_journal', 'No journal entries yet'),
('en', 'empty', 'no_reviews', 'No weekly reviews yet'),
('en', 'empty', 'no_conversations', 'No conversations yet'),
('en', 'empty', 'no_notifications', 'No notifications'),
('en', 'empty', 'no_messages', 'No messages yet'),
('en', 'empty', 'no_files', 'No files yet'),
('en', 'empty', 'no_images', 'No images yet'),
('en', 'empty', 'no_tags', 'No tags yet'),
('en', 'empty', 'no_categories', 'No categories yet'),
('en', 'empty', 'no_templates', 'No templates yet'),
('en', 'empty', 'no_activity', 'No activity yet'),
('en', 'empty', 'no_history', 'No history'),
('en', 'empty', 'no_recent', 'No recent items'),
('en', 'empty', 'no_favorites', 'No favorites yet'),
('en', 'empty', 'no_archived', 'No archived items'),
('en', 'empty', 'no_trash', 'Trash is empty'),
-- Action prompts
('en', 'empty', 'create_first', 'Create your first {item}'),
('en', 'empty', 'add_first', 'Add your first {item}'),
('en', 'empty', 'get_started', 'Let''s get started!'),
('en', 'empty', 'start_creating', 'Start creating'),
('en', 'empty', 'add_new', 'Add new'),
('en', 'empty', 'import_data', 'Import data')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TOOLTIPS & HINTS (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General tooltips
('vi', 'tooltip', 'edit', 'Chỉnh sửa'),
('vi', 'tooltip', 'delete', 'Xóa'),
('vi', 'tooltip', 'save', 'Lưu'),
('vi', 'tooltip', 'cancel', 'Hủy'),
('vi', 'tooltip', 'close', 'Đóng'),
('vi', 'tooltip', 'copy', 'Sao chép'),
('vi', 'tooltip', 'paste', 'Dán'),
('vi', 'tooltip', 'cut', 'Cắt'),
('vi', 'tooltip', 'undo', 'Hoàn tác'),
('vi', 'tooltip', 'redo', 'Làm lại'),
('vi', 'tooltip', 'refresh', 'Làm mới'),
('vi', 'tooltip', 'search', 'Tìm kiếm'),
('vi', 'tooltip', 'filter', 'Lọc'),
('vi', 'tooltip', 'sort', 'Sắp xếp'),
('vi', 'tooltip', 'export', 'Xuất'),
('vi', 'tooltip', 'import', 'Nhập'),
('vi', 'tooltip', 'print', 'In'),
('vi', 'tooltip', 'download', 'Tải xuống'),
('vi', 'tooltip', 'upload', 'Tải lên'),
('vi', 'tooltip', 'share', 'Chia sẻ'),
('vi', 'tooltip', 'settings', 'Cài đặt'),
('vi', 'tooltip', 'help', 'Trợ giúp'),
('vi', 'tooltip', 'info', 'Thông tin'),
('vi', 'tooltip', 'more', 'Thêm'),
('vi', 'tooltip', 'less', 'Thu gọn'),
('vi', 'tooltip', 'expand', 'Mở rộng'),
('vi', 'tooltip', 'collapse', 'Thu gọn'),
('vi', 'tooltip', 'fullscreen', 'Toàn màn hình'),
('vi', 'tooltip', 'exit_fullscreen', 'Thoát toàn màn hình'),
('vi', 'tooltip', 'zoom_in', 'Phóng to'),
('vi', 'tooltip', 'zoom_out', 'Thu nhỏ'),
('vi', 'tooltip', 'previous', 'Trước'),
('vi', 'tooltip', 'next', 'Sau'),
('vi', 'tooltip', 'first', 'Đầu'),
('vi', 'tooltip', 'last', 'Cuối'),
('vi', 'tooltip', 'pin', 'Ghim'),
('vi', 'tooltip', 'unpin', 'Bỏ ghim'),
('vi', 'tooltip', 'favorite', 'Yêu thích'),
('vi', 'tooltip', 'unfavorite', 'Bỏ yêu thích'),
('vi', 'tooltip', 'archive', 'Lưu trữ'),
('vi', 'tooltip', 'unarchive', 'Bỏ lưu trữ'),
('vi', 'tooltip', 'drag_to_reorder', 'Kéo để sắp xếp lại'),
('vi', 'tooltip', 'click_to_edit', 'Nhấp để chỉnh sửa'),
('vi', 'tooltip', 'double_click_edit', 'Nhấp đúp để chỉnh sửa'),
('vi', 'tooltip', 'press_enter', 'Nhấn Enter để xác nhận'),
('vi', 'tooltip', 'press_escape', 'Nhấn Escape để hủy'),
-- Hints
('vi', 'hint', 'required_field', 'Trường bắt buộc'),
('vi', 'hint', 'optional_field', 'Tùy chọn'),
('vi', 'hint', 'max_characters', 'Tối đa {max} ký tự'),
('vi', 'hint', 'min_characters', 'Tối thiểu {min} ký tự'),
('vi', 'hint', 'characters_remaining', 'Còn {count} ký tự'),
('vi', 'hint', 'password_requirements', 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'),
('vi', 'hint', 'drag_drop_files', 'Kéo thả tệp vào đây hoặc nhấp để chọn'),
('vi', 'hint', 'supported_formats', 'Định dạng hỗ trợ: {formats}'),
('vi', 'hint', 'max_file_size', 'Kích thước tối đa: {size}'),
('vi', 'hint', 'use_keyboard', 'Sử dụng phím mũi tên để điều hướng'),
('vi', 'hint', 'auto_save', 'Tự động lưu')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TOOLTIPS & HINTS (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- General tooltips
('en', 'tooltip', 'edit', 'Edit'),
('en', 'tooltip', 'delete', 'Delete'),
('en', 'tooltip', 'save', 'Save'),
('en', 'tooltip', 'cancel', 'Cancel'),
('en', 'tooltip', 'close', 'Close'),
('en', 'tooltip', 'copy', 'Copy'),
('en', 'tooltip', 'paste', 'Paste'),
('en', 'tooltip', 'cut', 'Cut'),
('en', 'tooltip', 'undo', 'Undo'),
('en', 'tooltip', 'redo', 'Redo'),
('en', 'tooltip', 'refresh', 'Refresh'),
('en', 'tooltip', 'search', 'Search'),
('en', 'tooltip', 'filter', 'Filter'),
('en', 'tooltip', 'sort', 'Sort'),
('en', 'tooltip', 'export', 'Export'),
('en', 'tooltip', 'import', 'Import'),
('en', 'tooltip', 'print', 'Print'),
('en', 'tooltip', 'download', 'Download'),
('en', 'tooltip', 'upload', 'Upload'),
('en', 'tooltip', 'share', 'Share'),
('en', 'tooltip', 'settings', 'Settings'),
('en', 'tooltip', 'help', 'Help'),
('en', 'tooltip', 'info', 'Info'),
('en', 'tooltip', 'more', 'More'),
('en', 'tooltip', 'less', 'Less'),
('en', 'tooltip', 'expand', 'Expand'),
('en', 'tooltip', 'collapse', 'Collapse'),
('en', 'tooltip', 'fullscreen', 'Fullscreen'),
('en', 'tooltip', 'exit_fullscreen', 'Exit fullscreen'),
('en', 'tooltip', 'zoom_in', 'Zoom in'),
('en', 'tooltip', 'zoom_out', 'Zoom out'),
('en', 'tooltip', 'previous', 'Previous'),
('en', 'tooltip', 'next', 'Next'),
('en', 'tooltip', 'first', 'First'),
('en', 'tooltip', 'last', 'Last'),
('en', 'tooltip', 'pin', 'Pin'),
('en', 'tooltip', 'unpin', 'Unpin'),
('en', 'tooltip', 'favorite', 'Add to favorites'),
('en', 'tooltip', 'unfavorite', 'Remove from favorites'),
('en', 'tooltip', 'archive', 'Archive'),
('en', 'tooltip', 'unarchive', 'Unarchive'),
('en', 'tooltip', 'drag_to_reorder', 'Drag to reorder'),
('en', 'tooltip', 'click_to_edit', 'Click to edit'),
('en', 'tooltip', 'double_click_edit', 'Double-click to edit'),
('en', 'tooltip', 'press_enter', 'Press Enter to confirm'),
('en', 'tooltip', 'press_escape', 'Press Escape to cancel'),
-- Hints
('en', 'hint', 'required_field', 'Required field'),
('en', 'hint', 'optional_field', 'Optional'),
('en', 'hint', 'max_characters', 'Maximum {max} characters'),
('en', 'hint', 'min_characters', 'Minimum {min} characters'),
('en', 'hint', 'characters_remaining', '{count} characters remaining'),
('en', 'hint', 'password_requirements', 'Password must be at least 8 characters including uppercase, lowercase and numbers'),
('en', 'hint', 'drag_drop_files', 'Drag and drop files here or click to select'),
('en', 'hint', 'supported_formats', 'Supported formats: {formats}'),
('en', 'hint', 'max_file_size', 'Maximum file size: {size}'),
('en', 'hint', 'use_keyboard', 'Use arrow keys to navigate'),
('en', 'hint', 'auto_save', 'Auto-save enabled')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TIME & DATE (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Time units
('vi', 'time', 'second', 'giây'),
('vi', 'time', 'seconds', 'giây'),
('vi', 'time', 'minute', 'phút'),
('vi', 'time', 'minutes', 'phút'),
('vi', 'time', 'hour', 'giờ'),
('vi', 'time', 'hours', 'giờ'),
('vi', 'time', 'day', 'ngày'),
('vi', 'time', 'days', 'ngày'),
('vi', 'time', 'week', 'tuần'),
('vi', 'time', 'weeks', 'tuần'),
('vi', 'time', 'month', 'tháng'),
('vi', 'time', 'months', 'tháng'),
('vi', 'time', 'year', 'năm'),
('vi', 'time', 'years', 'năm'),
-- Relative time
('vi', 'time', 'just_now', 'Vừa xong'),
('vi', 'time', 'ago', 'trước'),
('vi', 'time', 'from_now', 'nữa'),
('vi', 'time', 'seconds_ago', '{count} giây trước'),
('vi', 'time', 'minutes_ago', '{count} phút trước'),
('vi', 'time', 'hours_ago', '{count} giờ trước'),
('vi', 'time', 'days_ago', '{count} ngày trước'),
('vi', 'time', 'weeks_ago', '{count} tuần trước'),
('vi', 'time', 'months_ago', '{count} tháng trước'),
('vi', 'time', 'years_ago', '{count} năm trước'),
('vi', 'time', 'in_seconds', 'trong {count} giây'),
('vi', 'time', 'in_minutes', 'trong {count} phút'),
('vi', 'time', 'in_hours', 'trong {count} giờ'),
('vi', 'time', 'in_days', 'trong {count} ngày'),
('vi', 'time', 'in_weeks', 'trong {count} tuần'),
('vi', 'time', 'in_months', 'trong {count} tháng'),
('vi', 'time', 'in_years', 'trong {count} năm'),
-- Day names
('vi', 'time', 'sunday', 'Chủ Nhật'),
('vi', 'time', 'monday', 'Thứ Hai'),
('vi', 'time', 'tuesday', 'Thứ Ba'),
('vi', 'time', 'wednesday', 'Thứ Tư'),
('vi', 'time', 'thursday', 'Thứ Năm'),
('vi', 'time', 'friday', 'Thứ Sáu'),
('vi', 'time', 'saturday', 'Thứ Bảy'),
('vi', 'time', 'sun', 'CN'),
('vi', 'time', 'mon', 'T2'),
('vi', 'time', 'tue', 'T3'),
('vi', 'time', 'wed', 'T4'),
('vi', 'time', 'thu', 'T5'),
('vi', 'time', 'fri', 'T6'),
('vi', 'time', 'sat', 'T7'),
-- Month names
('vi', 'time', 'january', 'Tháng Một'),
('vi', 'time', 'february', 'Tháng Hai'),
('vi', 'time', 'march', 'Tháng Ba'),
('vi', 'time', 'april', 'Tháng Tư'),
('vi', 'time', 'may', 'Tháng Năm'),
('vi', 'time', 'june', 'Tháng Sáu'),
('vi', 'time', 'july', 'Tháng Bảy'),
('vi', 'time', 'august', 'Tháng Tám'),
('vi', 'time', 'september', 'Tháng Chín'),
('vi', 'time', 'october', 'Tháng Mười'),
('vi', 'time', 'november', 'Tháng Mười Một'),
('vi', 'time', 'december', 'Tháng Mười Hai'),
('vi', 'time', 'jan', 'Th1'),
('vi', 'time', 'feb', 'Th2'),
('vi', 'time', 'mar', 'Th3'),
('vi', 'time', 'apr', 'Th4'),
('vi', 'time', 'may_short', 'Th5'),
('vi', 'time', 'jun', 'Th6'),
('vi', 'time', 'jul', 'Th7'),
('vi', 'time', 'aug', 'Th8'),
('vi', 'time', 'sep', 'Th9'),
('vi', 'time', 'oct', 'Th10'),
('vi', 'time', 'nov', 'Th11'),
('vi', 'time', 'dec', 'Th12'),
-- Common date terms
('vi', 'time', 'today', 'Hôm nay'),
('vi', 'time', 'yesterday', 'Hôm qua'),
('vi', 'time', 'tomorrow', 'Ngày mai'),
('vi', 'time', 'this_week', 'Tuần này'),
('vi', 'time', 'last_week', 'Tuần trước'),
('vi', 'time', 'next_week', 'Tuần sau'),
('vi', 'time', 'this_month', 'Tháng này'),
('vi', 'time', 'last_month', 'Tháng trước'),
('vi', 'time', 'next_month', 'Tháng sau'),
('vi', 'time', 'this_year', 'Năm nay'),
('vi', 'time', 'last_year', 'Năm ngoái'),
('vi', 'time', 'next_year', 'Năm sau'),
('vi', 'time', 'morning', 'Sáng'),
('vi', 'time', 'afternoon', 'Chiều'),
('vi', 'time', 'evening', 'Tối'),
('vi', 'time', 'night', 'Đêm'),
('vi', 'time', 'all_day', 'Cả ngày'),
('vi', 'time', 'start_date', 'Ngày bắt đầu'),
('vi', 'time', 'end_date', 'Ngày kết thúc'),
('vi', 'time', 'due_date', 'Hạn chót'),
('vi', 'time', 'deadline', 'Hạn cuối'),
('vi', 'time', 'overdue', 'Quá hạn'),
('vi', 'time', 'on_time', 'Đúng hạn'),
('vi', 'time', 'early', 'Sớm'),
('vi', 'time', 'late', 'Muộn')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - TIME & DATE (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
-- Time units
('en', 'time', 'second', 'second'),
('en', 'time', 'seconds', 'seconds'),
('en', 'time', 'minute', 'minute'),
('en', 'time', 'minutes', 'minutes'),
('en', 'time', 'hour', 'hour'),
('en', 'time', 'hours', 'hours'),
('en', 'time', 'day', 'day'),
('en', 'time', 'days', 'days'),
('en', 'time', 'week', 'week'),
('en', 'time', 'weeks', 'weeks'),
('en', 'time', 'month', 'month'),
('en', 'time', 'months', 'months'),
('en', 'time', 'year', 'year'),
('en', 'time', 'years', 'years'),
-- Relative time
('en', 'time', 'just_now', 'Just now'),
('en', 'time', 'ago', 'ago'),
('en', 'time', 'from_now', 'from now'),
('en', 'time', 'seconds_ago', '{count} seconds ago'),
('en', 'time', 'minutes_ago', '{count} minutes ago'),
('en', 'time', 'hours_ago', '{count} hours ago'),
('en', 'time', 'days_ago', '{count} days ago'),
('en', 'time', 'weeks_ago', '{count} weeks ago'),
('en', 'time', 'months_ago', '{count} months ago'),
('en', 'time', 'years_ago', '{count} years ago'),
('en', 'time', 'in_seconds', 'in {count} seconds'),
('en', 'time', 'in_minutes', 'in {count} minutes'),
('en', 'time', 'in_hours', 'in {count} hours'),
('en', 'time', 'in_days', 'in {count} days'),
('en', 'time', 'in_weeks', 'in {count} weeks'),
('en', 'time', 'in_months', 'in {count} months'),
('en', 'time', 'in_years', 'in {count} years'),
-- Day names
('en', 'time', 'sunday', 'Sunday'),
('en', 'time', 'monday', 'Monday'),
('en', 'time', 'tuesday', 'Tuesday'),
('en', 'time', 'wednesday', 'Wednesday'),
('en', 'time', 'thursday', 'Thursday'),
('en', 'time', 'friday', 'Friday'),
('en', 'time', 'saturday', 'Saturday'),
('en', 'time', 'sun', 'Sun'),
('en', 'time', 'mon', 'Mon'),
('en', 'time', 'tue', 'Tue'),
('en', 'time', 'wed', 'Wed'),
('en', 'time', 'thu', 'Thu'),
('en', 'time', 'fri', 'Fri'),
('en', 'time', 'sat', 'Sat'),
-- Month names
('en', 'time', 'january', 'January'),
('en', 'time', 'february', 'February'),
('en', 'time', 'march', 'March'),
('en', 'time', 'april', 'April'),
('en', 'time', 'may', 'May'),
('en', 'time', 'june', 'June'),
('en', 'time', 'july', 'July'),
('en', 'time', 'august', 'August'),
('en', 'time', 'september', 'September'),
('en', 'time', 'october', 'October'),
('en', 'time', 'november', 'November'),
('en', 'time', 'december', 'December'),
('en', 'time', 'jan', 'Jan'),
('en', 'time', 'feb', 'Feb'),
('en', 'time', 'mar', 'Mar'),
('en', 'time', 'apr', 'Apr'),
('en', 'time', 'may_short', 'May'),
('en', 'time', 'jun', 'Jun'),
('en', 'time', 'jul', 'Jul'),
('en', 'time', 'aug', 'Aug'),
('en', 'time', 'sep', 'Sep'),
('en', 'time', 'oct', 'Oct'),
('en', 'time', 'nov', 'Nov'),
('en', 'time', 'dec', 'Dec'),
-- Common date terms
('en', 'time', 'today', 'Today'),
('en', 'time', 'yesterday', 'Yesterday'),
('en', 'time', 'tomorrow', 'Tomorrow'),
('en', 'time', 'this_week', 'This week'),
('en', 'time', 'last_week', 'Last week'),
('en', 'time', 'next_week', 'Next week'),
('en', 'time', 'this_month', 'This month'),
('en', 'time', 'last_month', 'Last month'),
('en', 'time', 'next_month', 'Next month'),
('en', 'time', 'this_year', 'This year'),
('en', 'time', 'last_year', 'Last year'),
('en', 'time', 'next_year', 'Next year'),
('en', 'time', 'morning', 'Morning'),
('en', 'time', 'afternoon', 'Afternoon'),
('en', 'time', 'evening', 'Evening'),
('en', 'time', 'night', 'Night'),
('en', 'time', 'all_day', 'All day'),
('en', 'time', 'start_date', 'Start date'),
('en', 'time', 'end_date', 'End date'),
('en', 'time', 'due_date', 'Due date'),
('en', 'time', 'deadline', 'Deadline'),
('en', 'time', 'overdue', 'Overdue'),
('en', 'time', 'on_time', 'On time'),
('en', 'time', 'early', 'Early'),
('en', 'time', 'late', 'Late')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ACCESSIBILITY (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'a11y', 'skip_to_content', 'Chuyển đến nội dung chính'),
('vi', 'a11y', 'skip_to_navigation', 'Chuyển đến điều hướng'),
('vi', 'a11y', 'main_content', 'Nội dung chính'),
('vi', 'a11y', 'navigation', 'Điều hướng'),
('vi', 'a11y', 'menu', 'Menu'),
('vi', 'a11y', 'submenu', 'Menu con'),
('vi', 'a11y', 'open_menu', 'Mở menu'),
('vi', 'a11y', 'close_menu', 'Đóng menu'),
('vi', 'a11y', 'toggle_menu', 'Bật/tắt menu'),
('vi', 'a11y', 'sidebar', 'Thanh bên'),
('vi', 'a11y', 'open_sidebar', 'Mở thanh bên'),
('vi', 'a11y', 'close_sidebar', 'Đóng thanh bên'),
('vi', 'a11y', 'dialog', 'Hộp thoại'),
('vi', 'a11y', 'modal', 'Cửa sổ modal'),
('vi', 'a11y', 'alert', 'Cảnh báo'),
('vi', 'a11y', 'loading', 'Đang tải'),
('vi', 'a11y', 'page_loading', 'Trang đang tải'),
('vi', 'a11y', 'content_loading', 'Nội dung đang tải'),
('vi', 'a11y', 'required', 'Bắt buộc'),
('vi', 'a11y', 'optional', 'Tùy chọn'),
('vi', 'a11y', 'error', 'Lỗi'),
('vi', 'a11y', 'warning', 'Cảnh báo'),
('vi', 'a11y', 'success', 'Thành công'),
('vi', 'a11y', 'info', 'Thông tin'),
('vi', 'a11y', 'selected', 'Đã chọn'),
('vi', 'a11y', 'not_selected', 'Chưa chọn'),
('vi', 'a11y', 'expanded', 'Đã mở rộng'),
('vi', 'a11y', 'collapsed', 'Đã thu gọn'),
('vi', 'a11y', 'checked', 'Đã đánh dấu'),
('vi', 'a11y', 'unchecked', 'Chưa đánh dấu'),
('vi', 'a11y', 'enabled', 'Đã bật'),
('vi', 'a11y', 'disabled', 'Đã tắt'),
('vi', 'a11y', 'opens_in_new_tab', 'Mở trong tab mới'),
('vi', 'a11y', 'external_link', 'Liên kết ngoài'),
('vi', 'a11y', 'current_page', 'Trang hiện tại'),
('vi', 'a11y', 'pagination', 'Phân trang'),
('vi', 'a11y', 'page_of', 'Trang {current} / {total}'),
('vi', 'a11y', 'go_to_page', 'Đi đến trang {page}'),
('vi', 'a11y', 'previous_page', 'Trang trước'),
('vi', 'a11y', 'next_page', 'Trang sau'),
('vi', 'a11y', 'first_page', 'Trang đầu'),
('vi', 'a11y', 'last_page', 'Trang cuối'),
('vi', 'a11y', 'sort_ascending', 'Sắp xếp tăng dần'),
('vi', 'a11y', 'sort_descending', 'Sắp xếp giảm dần'),
('vi', 'a11y', 'table', 'Bảng'),
('vi', 'a11y', 'row', 'Hàng'),
('vi', 'a11y', 'column', 'Cột'),
('vi', 'a11y', 'cell', 'Ô')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ACCESSIBILITY (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'a11y', 'skip_to_content', 'Skip to main content'),
('en', 'a11y', 'skip_to_navigation', 'Skip to navigation'),
('en', 'a11y', 'main_content', 'Main content'),
('en', 'a11y', 'navigation', 'Navigation'),
('en', 'a11y', 'menu', 'Menu'),
('en', 'a11y', 'submenu', 'Submenu'),
('en', 'a11y', 'open_menu', 'Open menu'),
('en', 'a11y', 'close_menu', 'Close menu'),
('en', 'a11y', 'toggle_menu', 'Toggle menu'),
('en', 'a11y', 'sidebar', 'Sidebar'),
('en', 'a11y', 'open_sidebar', 'Open sidebar'),
('en', 'a11y', 'close_sidebar', 'Close sidebar'),
('en', 'a11y', 'dialog', 'Dialog'),
('en', 'a11y', 'modal', 'Modal'),
('en', 'a11y', 'alert', 'Alert'),
('en', 'a11y', 'loading', 'Loading'),
('en', 'a11y', 'page_loading', 'Page is loading'),
('en', 'a11y', 'content_loading', 'Content is loading'),
('en', 'a11y', 'required', 'Required'),
('en', 'a11y', 'optional', 'Optional'),
('en', 'a11y', 'error', 'Error'),
('en', 'a11y', 'warning', 'Warning'),
('en', 'a11y', 'success', 'Success'),
('en', 'a11y', 'info', 'Information'),
('en', 'a11y', 'selected', 'Selected'),
('en', 'a11y', 'not_selected', 'Not selected'),
('en', 'a11y', 'expanded', 'Expanded'),
('en', 'a11y', 'collapsed', 'Collapsed'),
('en', 'a11y', 'checked', 'Checked'),
('en', 'a11y', 'unchecked', 'Unchecked'),
('en', 'a11y', 'enabled', 'Enabled'),
('en', 'a11y', 'disabled', 'Disabled'),
('en', 'a11y', 'opens_in_new_tab', 'Opens in new tab'),
('en', 'a11y', 'external_link', 'External link'),
('en', 'a11y', 'current_page', 'Current page'),
('en', 'a11y', 'pagination', 'Pagination'),
('en', 'a11y', 'page_of', 'Page {current} of {total}'),
('en', 'a11y', 'go_to_page', 'Go to page {page}'),
('en', 'a11y', 'previous_page', 'Previous page'),
('en', 'a11y', 'next_page', 'Next page'),
('en', 'a11y', 'first_page', 'First page'),
('en', 'a11y', 'last_page', 'Last page'),
('en', 'a11y', 'sort_ascending', 'Sort ascending'),
('en', 'a11y', 'sort_descending', 'Sort descending'),
('en', 'a11y', 'table', 'Table'),
('en', 'a11y', 'row', 'Row'),
('en', 'a11y', 'column', 'Column'),
('en', 'a11y', 'cell', 'Cell')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - NOTIFICATIONS (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'notification', 'title', 'Thông báo'),
('vi', 'notification', 'all', 'Tất cả thông báo'),
('vi', 'notification', 'unread', 'Chưa đọc'),
('vi', 'notification', 'read', 'Đã đọc'),
('vi', 'notification', 'mark_as_read', 'Đánh dấu đã đọc'),
('vi', 'notification', 'mark_all_read', 'Đánh dấu tất cả đã đọc'),
('vi', 'notification', 'delete_all', 'Xóa tất cả'),
('vi', 'notification', 'no_notifications', 'Không có thông báo'),
('vi', 'notification', 'new_notification', 'Thông báo mới'),
('vi', 'notification', 'view_all', 'Xem tất cả'),
('vi', 'notification', 'settings', 'Cài đặt thông báo'),
('vi', 'notification', 'enable', 'Bật thông báo'),
('vi', 'notification', 'disable', 'Tắt thông báo'),
('vi', 'notification', 'sound', 'Âm thanh'),
('vi', 'notification', 'desktop', 'Thông báo desktop'),
('vi', 'notification', 'email', 'Thông báo email'),
('vi', 'notification', 'push', 'Thông báo đẩy'),
-- Notification types
('vi', 'notification', 'reminder', 'Nhắc nhở'),
('vi', 'notification', 'task_due', 'Công việc đến hạn'),
('vi', 'notification', 'goal_deadline', 'Mục tiêu đến hạn'),
('vi', 'notification', 'habit_reminder', 'Nhắc nhở thói quen'),
('vi', 'notification', 'streak_at_risk', 'Chuỗi đang có nguy cơ'),
('vi', 'notification', 'achievement', 'Thành tựu'),
('vi', 'notification', 'weekly_review', 'Đánh giá tuần'),
('vi', 'notification', 'system_update', 'Cập nhật hệ thống'),
('vi', 'notification', 'welcome', 'Chào mừng'),
('vi', 'notification', 'tip_of_day', 'Mẹo trong ngày')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - NOTIFICATIONS (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'notification', 'title', 'Notifications'),
('en', 'notification', 'all', 'All notifications'),
('en', 'notification', 'unread', 'Unread'),
('en', 'notification', 'read', 'Read'),
('en', 'notification', 'mark_as_read', 'Mark as read'),
('en', 'notification', 'mark_all_read', 'Mark all as read'),
('en', 'notification', 'delete_all', 'Delete all'),
('en', 'notification', 'no_notifications', 'No notifications'),
('en', 'notification', 'new_notification', 'New notification'),
('en', 'notification', 'view_all', 'View all'),
('en', 'notification', 'settings', 'Notification settings'),
('en', 'notification', 'enable', 'Enable notifications'),
('en', 'notification', 'disable', 'Disable notifications'),
('en', 'notification', 'sound', 'Sound'),
('en', 'notification', 'desktop', 'Desktop notifications'),
('en', 'notification', 'email', 'Email notifications'),
('en', 'notification', 'push', 'Push notifications'),
-- Notification types
('en', 'notification', 'reminder', 'Reminder'),
('en', 'notification', 'task_due', 'Task due'),
('en', 'notification', 'goal_deadline', 'Goal deadline'),
('en', 'notification', 'habit_reminder', 'Habit reminder'),
('en', 'notification', 'streak_at_risk', 'Streak at risk'),
('en', 'notification', 'achievement', 'Achievement'),
('en', 'notification', 'weekly_review', 'Weekly review'),
('en', 'notification', 'system_update', 'System update'),
('en', 'notification', 'welcome', 'Welcome'),
('en', 'notification', 'tip_of_day', 'Tip of the day')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ONBOARDING (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'onboarding', 'welcome', 'Chào mừng đến với LifeOS'),
('vi', 'onboarding', 'welcome_message', 'Hệ thống quản lý cuộc sống toàn diện của bạn'),
('vi', 'onboarding', 'get_started', 'Bắt đầu'),
('vi', 'onboarding', 'skip', 'Bỏ qua'),
('vi', 'onboarding', 'next', 'Tiếp theo'),
('vi', 'onboarding', 'back', 'Quay lại'),
('vi', 'onboarding', 'finish', 'Hoàn thành'),
('vi', 'onboarding', 'step_of', 'Bước {current} / {total}'),
-- Features intro
('vi', 'onboarding', 'goals_title', 'Đặt mục tiêu'),
('vi', 'onboarding', 'goals_desc', 'Xác định và theo dõi các mục tiêu quan trọng trong cuộc sống'),
('vi', 'onboarding', 'habits_title', 'Xây dựng thói quen'),
('vi', 'onboarding', 'habits_desc', 'Tạo thói quen tốt và theo dõi tiến độ hàng ngày'),
('vi', 'onboarding', 'tasks_title', 'Quản lý công việc'),
('vi', 'onboarding', 'tasks_desc', 'Tổ chức và hoàn thành công việc hiệu quả'),
('vi', 'onboarding', 'journal_title', 'Viết nhật ký'),
('vi', 'onboarding', 'journal_desc', 'Ghi lại suy nghĩ và cảm xúc mỗi ngày'),
('vi', 'onboarding', 'ai_title', 'Trợ lý AI'),
('vi', 'onboarding', 'ai_desc', 'Nhận gợi ý và hướng dẫn từ trợ lý thông minh'),
-- Profile setup
('vi', 'onboarding', 'setup_profile', 'Thiết lập hồ sơ'),
('vi', 'onboarding', 'your_name', 'Tên của bạn'),
('vi', 'onboarding', 'your_timezone', 'Múi giờ'),
('vi', 'onboarding', 'your_goals', 'Mục tiêu của bạn là gì?'),
('vi', 'onboarding', 'select_areas', 'Chọn lĩnh vực bạn muốn cải thiện'),
-- Completion
('vi', 'onboarding', 'all_set', 'Hoàn tất!'),
('vi', 'onboarding', 'ready_message', 'Bạn đã sẵn sàng bắt đầu hành trình phát triển bản thân'),
('vi', 'onboarding', 'start_journey', 'Bắt đầu hành trình'),
('vi', 'onboarding', 'take_tour', 'Xem hướng dẫn'),
('vi', 'onboarding', 'explore', 'Khám phá ngay')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - ONBOARDING (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'onboarding', 'welcome', 'Welcome to LifeOS'),
('en', 'onboarding', 'welcome_message', 'Your comprehensive life management system'),
('en', 'onboarding', 'get_started', 'Get Started'),
('en', 'onboarding', 'skip', 'Skip'),
('en', 'onboarding', 'next', 'Next'),
('en', 'onboarding', 'back', 'Back'),
('en', 'onboarding', 'finish', 'Finish'),
('en', 'onboarding', 'step_of', 'Step {current} of {total}'),
-- Features intro
('en', 'onboarding', 'goals_title', 'Set Goals'),
('en', 'onboarding', 'goals_desc', 'Define and track important goals in your life'),
('en', 'onboarding', 'habits_title', 'Build Habits'),
('en', 'onboarding', 'habits_desc', 'Create positive habits and track daily progress'),
('en', 'onboarding', 'tasks_title', 'Manage Tasks'),
('en', 'onboarding', 'tasks_desc', 'Organize and complete tasks efficiently'),
('en', 'onboarding', 'journal_title', 'Write Journal'),
('en', 'onboarding', 'journal_desc', 'Record your thoughts and feelings every day'),
('en', 'onboarding', 'ai_title', 'AI Assistant'),
('en', 'onboarding', 'ai_desc', 'Get suggestions and guidance from smart assistant'),
-- Profile setup
('en', 'onboarding', 'setup_profile', 'Setup Profile'),
('en', 'onboarding', 'your_name', 'Your name'),
('en', 'onboarding', 'your_timezone', 'Your timezone'),
('en', 'onboarding', 'your_goals', 'What are your goals?'),
('en', 'onboarding', 'select_areas', 'Select areas you want to improve'),
-- Completion
('en', 'onboarding', 'all_set', 'All Set!'),
('en', 'onboarding', 'ready_message', 'You are ready to start your personal development journey'),
('en', 'onboarding', 'start_journey', 'Start Journey'),
('en', 'onboarding', 'take_tour', 'Take a Tour'),
('en', 'onboarding', 'explore', 'Explore Now')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - SHORTCUTS (Tiếng Việt)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('vi', 'shortcuts', 'title', 'Phím tắt'),
('vi', 'shortcuts', 'description', 'Các phím tắt để sử dụng nhanh hơn'),
('vi', 'shortcuts', 'show_shortcuts', 'Hiển thị phím tắt'),
('vi', 'shortcuts', 'global', 'Toàn cục'),
('vi', 'shortcuts', 'navigation', 'Điều hướng'),
('vi', 'shortcuts', 'actions', 'Hành động'),
('vi', 'shortcuts', 'editing', 'Chỉnh sửa'),
-- Global shortcuts
('vi', 'shortcuts', 'search', 'Tìm kiếm'),
('vi', 'shortcuts', 'quick_add', 'Thêm nhanh'),
('vi', 'shortcuts', 'command_palette', 'Bảng lệnh'),
('vi', 'shortcuts', 'toggle_sidebar', 'Bật/tắt thanh bên'),
('vi', 'shortcuts', 'toggle_theme', 'Đổi giao diện sáng/tối'),
('vi', 'shortcuts', 'home', 'Về trang chủ'),
('vi', 'shortcuts', 'settings', 'Mở cài đặt'),
-- Navigation shortcuts
('vi', 'shortcuts', 'go_dashboard', 'Đến Dashboard'),
('vi', 'shortcuts', 'go_goals', 'Đến Mục tiêu'),
('vi', 'shortcuts', 'go_habits', 'Đến Thói quen'),
('vi', 'shortcuts', 'go_tasks', 'Đến Công việc'),
('vi', 'shortcuts', 'go_journal', 'Đến Nhật ký'),
('vi', 'shortcuts', 'go_notes', 'Đến Ghi chú'),
-- Action shortcuts
('vi', 'shortcuts', 'save', 'Lưu'),
('vi', 'shortcuts', 'cancel', 'Hủy'),
('vi', 'shortcuts', 'delete', 'Xóa'),
('vi', 'shortcuts', 'edit', 'Chỉnh sửa'),
('vi', 'shortcuts', 'new_item', 'Tạo mới'),
('vi', 'shortcuts', 'duplicate', 'Nhân bản'),
('vi', 'shortcuts', 'archive', 'Lưu trữ'),
('vi', 'shortcuts', 'refresh', 'Làm mới')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- TRANSLATIONS - SHORTCUTS (English)
-- ===========================================
INSERT INTO public.admin_translations (language_code, namespace, key, value) VALUES
('en', 'shortcuts', 'title', 'Keyboard Shortcuts'),
('en', 'shortcuts', 'description', 'Keyboard shortcuts for faster usage'),
('en', 'shortcuts', 'show_shortcuts', 'Show shortcuts'),
('en', 'shortcuts', 'global', 'Global'),
('en', 'shortcuts', 'navigation', 'Navigation'),
('en', 'shortcuts', 'actions', 'Actions'),
('en', 'shortcuts', 'editing', 'Editing'),
-- Global shortcuts
('en', 'shortcuts', 'search', 'Search'),
('en', 'shortcuts', 'quick_add', 'Quick add'),
('en', 'shortcuts', 'command_palette', 'Command palette'),
('en', 'shortcuts', 'toggle_sidebar', 'Toggle sidebar'),
('en', 'shortcuts', 'toggle_theme', 'Toggle light/dark theme'),
('en', 'shortcuts', 'home', 'Go to home'),
('en', 'shortcuts', 'settings', 'Open settings'),
-- Navigation shortcuts
('en', 'shortcuts', 'go_dashboard', 'Go to Dashboard'),
('en', 'shortcuts', 'go_goals', 'Go to Goals'),
('en', 'shortcuts', 'go_habits', 'Go to Habits'),
('en', 'shortcuts', 'go_tasks', 'Go to Tasks'),
('en', 'shortcuts', 'go_journal', 'Go to Journal'),
('en', 'shortcuts', 'go_notes', 'Go to Notes'),
-- Action shortcuts
('en', 'shortcuts', 'save', 'Save'),
('en', 'shortcuts', 'cancel', 'Cancel'),
('en', 'shortcuts', 'delete', 'Delete'),
('en', 'shortcuts', 'edit', 'Edit'),
('en', 'shortcuts', 'new_item', 'Create new'),
('en', 'shortcuts', 'duplicate', 'Duplicate'),
('en', 'shortcuts', 'archive', 'Archive'),
('en', 'shortcuts', 'refresh', 'Refresh')
ON CONFLICT (language_code, namespace, key) DO NOTHING;

-- ===========================================
-- Hoàn thành!
-- ===========================================
