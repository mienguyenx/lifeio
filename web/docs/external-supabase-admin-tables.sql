-- =====================================================
-- EXTERNAL SUPABASE - ADMIN TABLES SETUP
-- Run this AFTER running external-supabase-setup.sql
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE public.subscription_plans (
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

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plans" ON public.subscription_plans 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans 
  FOR SELECT USING (is_active = true);

-- =====================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 3. WORKSPACES TABLE
-- =====================================================

CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all workspaces" ON public.workspaces 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can manage own workspaces" ON public.workspaces 
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Members can view their workspaces" ON public.workspaces 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. WORKSPACE MEMBERS TABLE
-- =====================================================

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all members" ON public.workspace_members 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Workspace admins can manage members" ON public.workspace_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );
CREATE POLICY "Members can view other members" ON public.workspace_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id 
      AND wm.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. WORKSPACE INVITATIONS TABLE
-- =====================================================

CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all invitations" ON public.workspace_invitations 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Workspace owners can manage invitations" ON public.workspace_invitations 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = workspace_invitations.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

-- =====================================================
-- 6. ADMIN TABLES (Settings, Logs, etc.)
-- =====================================================

-- Admin Settings
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings" ON public.admin_settings 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert settings" ON public.admin_settings 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.admin_settings 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- System Logs
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON public.system_logs 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert logs" ON public.system_logs 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Email Logs
CREATE TABLE public.email_logs (
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

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email logs" ON public.email_logs 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Feature Flags
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view feature flags" ON public.feature_flags 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert feature flags" ON public.feature_flags 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update feature flags" ON public.feature_flags 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete feature flags" ON public.feature_flags 
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 7. ADMIN AI & TEMPLATES TABLES
-- =====================================================

-- AI Models
CREATE TABLE public.admin_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'lovable',
  description TEXT,
  capabilities TEXT[] DEFAULT '{}'::text[],
  max_tokens INTEGER DEFAULT 4096,
  temperature NUMERIC DEFAULT 0.7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI models" ON public.admin_ai_models 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active AI models" ON public.admin_ai_models 
  FOR SELECT USING (is_active = true);

-- AI Prompts
CREATE TABLE public.admin_ai_prompts (
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

ALTER TABLE public.admin_ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI prompts" ON public.admin_ai_prompts 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active AI prompts" ON public.admin_ai_prompts 
  FOR SELECT USING (is_active = true);

-- Templates
CREATE TABLE public.admin_templates (
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

ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON public.admin_templates 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active templates" ON public.admin_templates 
  FOR SELECT USING (is_active = true);

-- Themes
CREATE TABLE public.admin_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage themes" ON public.admin_themes 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active themes" ON public.admin_themes 
  FOR SELECT USING (is_active = true);

-- Languages
CREATE TABLE public.admin_languages (
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

ALTER TABLE public.admin_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage languages" ON public.admin_languages 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active languages" ON public.admin_languages 
  FOR SELECT USING (is_active = true);

-- Plugins
CREATE TABLE public.admin_plugins (
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
  hooks TEXT[] DEFAULT '{}'::text[],
  permissions TEXT[] DEFAULT '{}'::text[],
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  entry_point TEXT,
  repository_url TEXT,
  documentation_url TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  dashboard_widget BOOLEAN DEFAULT false,
  sidebar_item BOOLEAN DEFAULT false,
  admin_page BOOLEAN DEFAULT false,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plugins" ON public.admin_plugins 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active plugins" ON public.admin_plugins 
  FOR SELECT USING (is_active = true);

-- Plugin Hooks
CREATE TABLE public.plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES public.admin_plugins(id) ON DELETE CASCADE,
  hook_name TEXT NOT NULL,
  handler_key TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plugin_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plugin hooks" ON public.plugin_hooks 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active hooks" ON public.plugin_hooks 
  FOR SELECT USING (is_active = true);

-- User Plugin Settings
CREATE TABLE public.user_plugin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id UUID NOT NULL REFERENCES public.admin_plugins(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

ALTER TABLE public.user_plugin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plugin settings" ON public.user_plugin_settings 
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all plugin settings" ON public.user_plugin_settings 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 8. INSERT SAMPLE SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO public.subscription_plans (name, slug, description, price, currency, billing_period, features, limits, is_active, is_default, sort_order) VALUES
(
  'Free',
  'free',
  'Bắt đầu miễn phí với các tính năng cơ bản',
  0,
  'VND',
  'monthly',
  '[
    "Quản lý 5 mục tiêu",
    "10 thói quen",
    "Nhật ký cơ bản",
    "Bánh xe cuộc sống",
    "Hỗ trợ email"
  ]'::jsonb,
  '{"goals": 5, "habits": 10, "tasks": 50, "notes": 20, "ai_messages": 10}'::jsonb,
  true,
  true,
  0
),
(
  'Pro',
  'pro',
  'Dành cho cá nhân muốn phát triển bản thân toàn diện',
  99000,
  'VND',
  'monthly',
  '[
    "Mục tiêu không giới hạn",
    "Thói quen không giới hạn",
    "AI Coach hỗ trợ 24/7",
    "Phân tích chi tiết",
    "Xuất báo cáo PDF",
    "Đồng bộ đa thiết bị",
    "Hỗ trợ ưu tiên"
  ]'::jsonb,
  '{"goals": -1, "habits": -1, "tasks": -1, "notes": -1, "ai_messages": 500}'::jsonb,
  true,
  false,
  1
),
(
  'Business',
  'business',
  'Dành cho team và doanh nghiệp nhỏ',
  299000,
  'VND',
  'monthly',
  '[
    "Tất cả tính năng Pro",
    "Workspace cho team",
    "Quản lý thành viên",
    "Phân tích team",
    "API tích hợp",
    "SSO & bảo mật nâng cao",
    "Hỗ trợ 24/7"
  ]'::jsonb,
  '{"goals": -1, "habits": -1, "tasks": -1, "notes": -1, "ai_messages": 2000, "team_members": 10}'::jsonb,
  true,
  false,
  2
),
(
  'Enterprise',
  'enterprise',
  'Giải pháp tùy chỉnh cho doanh nghiệp lớn',
  0,
  'VND',
  'yearly',
  '[
    "Tất cả tính năng Business",
    "Không giới hạn thành viên",
    "Tùy chỉnh thương hiệu",
    "Triển khai on-premise",
    "SLA đảm bảo",
    "Account Manager riêng",
    "Training & onboarding"
  ]'::jsonb,
  '{"goals": -1, "habits": -1, "tasks": -1, "notes": -1, "ai_messages": -1, "team_members": -1}'::jsonb,
  true,
  false,
  3
);

-- =====================================================
-- 9. INSERT DEFAULT LANGUAGES
-- =====================================================

INSERT INTO public.admin_languages (code, name, native_name, flag, is_active, translation_progress) VALUES
('vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', true, 100),
('en', 'English', 'English', '🇺🇸', true, 100);

-- =====================================================
-- ADMIN TABLES SETUP COMPLETE!
-- =====================================================
