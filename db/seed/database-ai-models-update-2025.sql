-- =====================================================
-- CẬP NHẬT AI MODELS - GEMINI VÀ PERPLEXITY (Tháng 12/2025)
-- =====================================================
-- Script này cập nhật danh sách models theo tài liệu mới nhất
-- Dựa trên: gemini-model.md và perplexity-model.md
-- Chạy script này sau khi đã có table admin_ai_models

-- =====================================================
-- GEMINI MODELS (Google) - Dòng Gemini 3 (Mới nhất)
-- =====================================================

-- Gemini 3 Pro (Mạnh mẽ nhất, đa phương thức, Agent)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 3 Pro',
  'gemini-3-pro-preview',
  'gemini',
  'Mô hình mạnh mẽ nhất hiện nay. Tối ưu cho các tác vụ lập trình phức tạp, suy luận đa bước và xử lý đa phương thức (văn bản, hình ảnh, video, âm thanh). Context: 1M-2M tokens.',
  true,
  false,
  2000000,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'video-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis', 'agent']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-3-pro-preview');

-- Gemini 3 Flash (Cân bằng tốc độ và trí thông minh)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 3 Flash',
  'gemini-3-flash-preview',
  'gemini',
  'Phiên bản cân bằng giữa tốc độ và trí thông minh, phù hợp cho các ứng dụng cần phản hồi nhanh nhưng vẫn yêu cầu khả năng xử lý của thế hệ thứ 3. Context: 1M tokens.',
  true,
  false,
  1000000,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-3-flash-preview');

-- =====================================================
-- GEMINI MODELS - Dòng Gemini 2.5 (Ổn định & Hiệu quả)
-- =====================================================

-- Gemini 2.5 Pro (Suy luận sâu, phân tích dữ liệu)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 2.5 Pro',
  'gemini-2.5-pro',
  'gemini',
  'Mô hình "thông minh" chủ lực, hỗ trợ cửa sổ ngữ cảnh lên tới 2 triệu token. Đặc biệt mạnh về khả năng "Deep Think" (suy luận sâu). Context: 2M tokens.',
  true,
  false,
  2000000,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'analysis', 'deep-think']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-2.5-pro');

-- Gemini 2.5 Flash (Đa năng, giá tốt, độ trễ thấp)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 2.5 Flash',
  'gemini-2.5-flash',
  'gemini',
  'Tốc độ cực nhanh, giá rẻ, phù hợp để xử lý dữ liệu lớn hoặc làm trợ lý hội thoại thời gian thực. Context: 1M tokens.',
  true,
  true, -- Set as default
  1000000,
  0.7,
  ARRAY['chat', 'completion', 'image-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-2.5-flash');

-- Gemini 2.5 Flash-Lite (Rẻ nhất, nhanh nhất cho tác vụ nhẹ)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Gemini 2.5 Flash-Lite',
  'gemini-2.5-flash-lite',
  'gemini',
  'Phiên bản siêu nhẹ, tối ưu hóa tối đa về chi phí và độ trễ cho các tác vụ đơn giản như phân loại văn bản hoặc tóm tắt ngắn. Context: 1M tokens.',
  true,
  false,
  1000000,
  0.7,
  ARRAY['chat', 'completion', 'translation', 'summarization', 'text-classification']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-2.5-flash-lite');

-- =====================================================
-- GEMINI MODELS - Cập nhật models cũ (nếu có)
-- =====================================================

-- Cập nhật Gemini 2.0 Flash nếu đã tồn tại
UPDATE public.admin_ai_models 
SET 
  name = 'Gemini 2.0 Flash',
  description = 'Model mới nhất của Google, nhanh gấp 3 lần Gemini 1.5 Pro, hỗ trợ đa phương thức. Context: 1M tokens.',
  max_tokens = 1000000,
  capabilities = ARRAY['chat', 'completion', 'image-understanding', 'video-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis']
WHERE model_id = 'gemini-2.0-flash-exp';

-- Cập nhật Gemini 1.5 Flash nếu đã tồn tại
UPDATE public.admin_ai_models 
SET 
  description = 'Model nhanh và hiệu quả của Google, hỗ trợ đa phương thức (text, image, video). Context: 1M tokens.',
  max_tokens = 1000000
WHERE model_id = 'gemini-1.5-flash';

-- Cập nhật Gemini 1.5 Pro nếu đã tồn tại
UPDATE public.admin_ai_models 
SET 
  description = 'Model mạnh mẽ của Google cho các tác vụ phức tạp, hỗ trợ đa phương thức. Context: 2M tokens.',
  max_tokens = 2000000
WHERE model_id = 'gemini-1.5-pro';

-- =====================================================
-- PERPLEXITY MODELS (Sonar Series)
-- =====================================================

-- Perplexity Sonar Pro (Flagship model, context 200k)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Pro',
  'sonar-pro',
  'perplexity',
  'Flagship model cho query phức tạp, tích hợp web search tự động. Context: 200k tokens.',
  true,
  false,
  200000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization', 'reasoning', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'sonar-pro');

-- Perplexity Sonar (Base model, context 128k)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar',
  'sonar',
  'perplexity',
  'Base model cho general queries, tích hợp web search tự động. Context: 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization', 'reasoning']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'sonar');

-- Perplexity Sonar Small Online (Nhẹ, nhanh, context 128k)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Small Online',
  'llama-3.1-sonar-small-128k-online',
  'perplexity',
  'Phiên bản nhẹ, nhanh cho task đơn giản, tích hợp web search. Context: 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-small-128k-online');

-- Perplexity Sonar Medium Online
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Medium Online',
  'sonar-medium-online',
  'perplexity',
  'Phiên bản trung bình với web search. Context: 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization', 'reasoning']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'sonar-medium-online');

-- Perplexity Sonar Large Online (Mạnh mẽ, context 128k)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Large Online',
  'llama-3.1-sonar-large-128k-online',
  'perplexity',
  'Model mạnh mẽ với khả năng tìm kiếm online, context 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'translation', 'summarization', 'reasoning', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-large-128k-online');

-- Perplexity Sonar Reasoning (Chuyên reasoning và logic)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Reasoning',
  'sonar-reasoning',
  'perplexity',
  'Chuyên reasoning và logic. Context: 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'reasoning', 'analysis', 'logic']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'sonar-reasoning');

-- Perplexity Sonar Reasoning Pro
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Reasoning Pro',
  'sonar-reasoning-pro',
  'perplexity',
  'Chuyên reasoning và logic nâng cao. Context: 200k tokens.',
  true,
  false,
  200000,
  0.7,
  ARRAY['chat', 'completion', 'reasoning', 'analysis', 'logic', 'deep-think']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'sonar-reasoning-pro');

-- Perplexity Sonar Deep Research
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Deep Research',
  'sonar-deep-research',
  'perplexity',
  'Cho nghiên cứu sâu. Context: 200k tokens.',
  true,
  false,
  200000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'reasoning', 'analysis', 'research']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'sonar-deep-research');

-- Perplexity Sonar Small Chat (Không online, context 128k)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Small Chat',
  'llama-3.1-sonar-small-128k-chat',
  'perplexity',
  'Model nhỏ gọn cho chat, không có web search. Context: 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'translation', 'summarization']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-small-128k-chat');

-- Perplexity Sonar Large Chat (Không online, context 128k)
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity Sonar Large Chat',
  'llama-3.1-sonar-large-128k-chat',
  'perplexity',
  'Model mạnh mẽ cho chat, không có web search. Context: 128k tokens.',
  true,
  false,
  128000,
  0.7,
  ARRAY['chat', 'completion', 'translation', 'summarization', 'reasoning', 'analysis', 'creative-writing']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-large-128k-chat');

-- =====================================================
-- PERPLEXITY MODELS - Các model khác (Open-source)
-- =====================================================

-- PPLX 7B Online
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity PPLX 7B Online',
  'pplx-7b-online',
  'perplexity',
  'Model nhỏ với internet access. Context: 32k tokens.',
  true,
  false,
  32000,
  0.7,
  ARRAY['chat', 'completion', 'web-search']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'pplx-7b-online');

-- PPLX 70B Online
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity PPLX 70B Online',
  'pplx-70b-online',
  'perplexity',
  'Model lớn với internet access. Context: 32k tokens.',
  true,
  false,
  32000,
  0.7,
  ARRAY['chat', 'completion', 'web-search', 'reasoning', 'analysis']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'pplx-70b-online');

-- PPLX 7B Chat
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity PPLX 7B Chat',
  'pplx-7b-chat',
  'perplexity',
  'Model nhỏ cho conversational, không search. Context: 32k tokens.',
  true,
  false,
  32000,
  0.7,
  ARRAY['chat', 'completion', 'translation']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'pplx-7b-chat');

-- PPLX 70B Chat
INSERT INTO public.admin_ai_models (name, model_id, provider, description, is_active, is_default, max_tokens, temperature, capabilities)
SELECT 
  'Perplexity PPLX 70B Chat',
  'pplx-70b-chat',
  'perplexity',
  'Model lớn cho conversational, không search. Context: 32k tokens.',
  true,
  false,
  32000,
  0.7,
  ARRAY['chat', 'completion', 'translation', 'summarization', 'reasoning']
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'pplx-70b-chat');

-- =====================================================
-- VÔ HIỆU HÓA MODELS CŨ (nếu có)
-- =====================================================

-- Disable old models nếu đã có models mới
UPDATE public.admin_ai_models 
SET is_active = false, is_default = false
WHERE model_id IN ('google/gemini-2.5-flash', 'openai/gpt-5-mini')
  AND EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-2.5-flash' AND is_active = true);

-- =====================================================
-- HOÀN THÀNH
-- =====================================================
-- Script đã cập nhật:
-- ✅ Gemini 3 Pro, Gemini 3 Flash (mới nhất)
-- ✅ Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite
-- ✅ Cập nhật Gemini 2.0, 1.5 Flash, 1.5 Pro
-- ✅ Perplexity Sonar Pro, Sonar, Sonar Small/Medium/Large Online
-- ✅ Perplexity Sonar Reasoning, Reasoning Pro, Deep Research
-- ✅ Perplexity Sonar Small/Large Chat
-- ✅ Perplexity PPLX 7B/70B Online/Chat
-- =====================================================

