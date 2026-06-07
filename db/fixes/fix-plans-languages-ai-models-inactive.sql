-- =====================================================
-- FIX VIETNAMESE ENCODING - PLANS, LANGUAGES, AI MODELS (INACTIVE)
-- =====================================================
-- Script này sửa encoding tiếng Việt cho:
-- 1. Subscription Plans (description và features JSONB)
-- 2. Languages (đã đúng, chỉ kiểm tra)
-- 3. AI Models (Inactive tab)

SET client_encoding TO 'UTF8';

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================

-- Free Plan
UPDATE public.subscription_plans 
SET 
  description = E'Gói miễn phí cho người dùng mới',
  features = '["5 mục tiêu", "10 thói quen", "Nhật ký cơ bản", "1 workspace"]'::jsonb
WHERE slug = 'free';

-- Pro Plan
UPDATE public.subscription_plans 
SET 
  description = E'Gói Pro cho người dùng cá nhân',
  features = '["Không giới hạn mục tiêu", "Không giới hạn thói quen", "AI Coach", "3 workspaces", "Xuất báo cáo"]'::jsonb
WHERE slug = 'pro';

-- Business Plan
UPDATE public.subscription_plans 
SET 
  description = E'Gói dành cho đội nhóm',
  features = '["Tất cả tính năng Pro", "10 workspaces", "Quản lý team", "API access", "Hỗ trợ ưu tiên"]'::jsonb
WHERE slug = 'business';

-- Enterprise Plan
UPDATE public.subscription_plans 
SET 
  description = E'Gói doanh nghiệp tùy chỉnh',
  features = '["Tất cả tính năng Business", "Không giới hạn workspaces", "SSO/SAML", "Dedicated support", "Custom integrations"]'::jsonb
WHERE slug = 'enterprise';

-- SuperAd Plan (nếu có)
UPDATE public.subscription_plans 
SET 
  description = E'Gói VIP dành cho quản trị viên',
  features = '["Tất cả tính năng", "Không giới hạn", "Quyền truy cập đầy đủ"]'::jsonb
WHERE slug = 'superad';

-- =====================================================
-- 2. ADMIN LANGUAGES (Kiểm tra và đảm bảo đúng)
-- =====================================================

-- Vietnamese
UPDATE public.admin_languages 
SET native_name = E'Tiếng Việt'
WHERE code = 'vi' AND native_name != E'Tiếng Việt';

-- English (đảm bảo không bị ảnh hưởng)
UPDATE public.admin_languages 
SET native_name = 'English'
WHERE code = 'en' AND native_name != 'English';

-- =====================================================
-- 3. AI MODELS (INACTIVE TAB)
-- =====================================================

-- Google Gemini 2.5 Flash (Inactive)
UPDATE public.admin_ai_models 
SET description = E'Model nhanh và cân bằng, phù hợp cho các tác vụ đa năng. Context: 1M tokens.'
WHERE model_id = 'google/gemini-2.5-flash';

-- OpenAI GPT-5 Mini (Inactive)
UPDATE public.admin_ai_models 
SET description = E'Model chi phí thấp, hiệu suất cao, phù hợp cho các tác vụ đơn giản. Context: 128k tokens.'
WHERE model_id = 'openai/gpt-5-mini';

-- =====================================================
-- HOÀN THÀNH
-- =====================================================
-- Script đã cập nhật:
-- ✅ Subscription Plans (5 plans: free, pro, business, enterprise, superad)
-- ✅ Admin Languages (vi, en)
-- ✅ AI Models Inactive (2 models: google/gemini-2.5-flash, openai/gpt-5-mini)
-- =====================================================

RESET client_encoding;

