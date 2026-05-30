-- =====================================================
-- CẬP NHẬT AI MODELS - GEMINI VÀ PERPLEXITY (2024-2025)
-- =====================================================
-- Script này thêm các model mới nhất từ Gemini và Perplexity
-- Chạy script này sau khi đã có table admin_ai_models

-- =====================================================
-- GEMINI MODELS (Google)
-- =====================================================

-- Gemini 1.5 Flash (Nhanh, đa phương thức)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 1.5 Flash',
  'gemini-1.5-flash',
  'gemini',
  'Model nhanh và hiệu quả của Google, hỗ trợ đa phương thức (text, image, video)',
  true,
  false,
  8192,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'translation', 'summarization', 'reasoning']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-1.5-flash');

-- Gemini 1.5 Pro (Mạnh mẽ, đa phương thức)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 1.5 Pro',
  'gemini-1.5-pro',
  'gemini',
  'Model mạnh mẽ của Google cho các tác vụ phức tạp, hỗ trợ đa phương thức',
  true,
  false,
  8192,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-1.5-pro');

-- Gemini 2.0 Flash (Mới nhất, nhanh gấp 3 lần)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 2.0 Flash',
  'gemini-2.0-flash-exp',
  'gemini',
  'Model mới nhất của Google, nhanh gấp 3 lần Gemini 1.5 Pro, hỗ trợ đa phương thức',
  true,
  true, -- Set as default
  8192,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'video-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-2.0-flash-exp');

-- =====================================================
-- PERPLEXITY MODELS (Sonar Series)
-- =====================================================

-- Perplexity Sonar Small Online (128k context)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Small Online',
  'llama-3.1-sonar-small-128k-online',
  'perplexity',
  'Model Perplexity nhỏ gọn với khả năng tìm kiếm online, context 128k tokens',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization', 'reasoning']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-small-128k-online');

-- Perplexity Sonar Large Online (128k context)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Large Online',
  'llama-3.1-sonar-large-128k-online',
  'perplexity',
  'Model Perplexity mạnh mẽ với khả năng tìm kiếm online, context 128k tokens',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization', 'reasoning', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-large-128k-online');

-- Perplexity Sonar Small Chat (128k context, không online)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Small Chat',
  'llama-3.1-sonar-small-128k-chat',
  'perplexity',
  'Model Perplexity nhỏ gọn cho chat, context 128k tokens',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'translation', 'summarization', 'reasoning']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-small-128k-chat');

-- Perplexity Sonar Large Chat (128k context, không online)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Large Chat',
  'llama-3.1-sonar-large-128k-chat',
  'perplexity',
  'Model Perplexity mạnh mẽ cho chat, context 128k tokens',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'translation', 'summarization', 'reasoning', 'analysis', 'creative-writing']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-large-128k-chat');

-- =====================================================
-- CẬP NHẬT MODEL CŨ (nếu có)
-- =====================================================

-- Disable old models if they exist
UPDATE public.admin_ai_models 
SET is_active = false, is_default = false
WHERE model_id IN ('google/gemini-2.5-flash', 'openai/gpt-5-mini')
  AND EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id IN ('gemini-2.0-flash-exp', 'llama-3.1-sonar-large-128k-online'));

