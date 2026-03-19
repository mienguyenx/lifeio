-- =====================================================
-- FIX VIETNAMESE ENCODING - AI MODELS
-- =====================================================
-- Script này sửa encoding tiếng Việt cho tất cả AI Models
-- Sử dụng E'' string literal để đảm bảo UTF-8 encoding đúng

SET client_encoding TO 'UTF8';

-- =====================================================
-- GEMINI MODELS - Dòng Gemini 3 (Mới nhất)
-- =====================================================

-- Gemini 3 Pro
UPDATE public.admin_ai_models 
SET description = E'Mô hình mạnh mẽ nhất hiện nay. Tối ưu cho các tác vụ lập trình phức tạp, suy luận đa bước và xử lý đa phương thức (văn bản, hình ảnh, video, âm thanh). Context: 1M-2M tokens.'
WHERE model_id = 'gemini-3-pro-preview';

-- Gemini 3 Flash
UPDATE public.admin_ai_models 
SET description = E'Phiên bản cân bằng giữa tốc độ và trí thông minh, phù hợp cho các ứng dụng cần phản hồi nhanh nhưng vẫn yêu cầu khả năng xử lý của thế hệ thứ 3. Context: 1M tokens.'
WHERE model_id = 'gemini-3-flash-preview';

-- =====================================================
-- GEMINI MODELS - Dòng Gemini 2.5 (Ổn định & Hiệu quả)
-- =====================================================

-- Gemini 2.5 Pro
UPDATE public.admin_ai_models 
SET description = E'Mô hình "thông minh" chủ lực, hỗ trợ cửa sổ ngữ cảnh lên tới 2 triệu token. Đặc biệt mạnh về khả năng "Deep Think" (suy luận sâu). Context: 2M tokens.'
WHERE model_id = 'gemini-2.5-pro';

-- Gemini 2.5 Flash
UPDATE public.admin_ai_models 
SET description = E'Tốc độ cực nhanh, giá rẻ, phù hợp để xử lý dữ liệu lớn hoặc làm trợ lý hội thoại thời gian thực. Context: 1M tokens.'
WHERE model_id = 'gemini-2.5-flash';

-- Gemini 2.5 Flash-Lite
UPDATE public.admin_ai_models 
SET description = E'Phiên bản siêu nhẹ, tối ưu hóa tối đa về chi phí và độ trễ cho các tác vụ đơn giản như phân loại văn bản hoặc tóm tắt ngắn. Context: 1M tokens.'
WHERE model_id = 'gemini-2.5-flash-lite';

-- Gemini 2.0 Flash
UPDATE public.admin_ai_models 
SET description = E'Model mới nhất của Google, nhanh gấp 3 lần Gemini 1.5 Pro, hỗ trợ đa phương thức. Context: 1M tokens.'
WHERE model_id = 'gemini-2.0-flash-exp';

-- =====================================================
-- PERPLEXITY MODELS - Sonar Models
-- =====================================================

-- Sonar Pro
UPDATE public.admin_ai_models 
SET description = E'Flagship model cho query phức tạp, tích hợp web search tự động. Phù hợp cho chat completions và grounded answers. Context: 200k tokens.'
WHERE model_id = 'sonar-pro';

-- Sonar
UPDATE public.admin_ai_models 
SET description = E'Base model cho general queries, tích hợp web search tự động. Phù hợp cho chat completions và grounded answers. Context: 128k tokens.'
WHERE model_id = 'sonar';

-- Sonar Small
UPDATE public.admin_ai_models 
SET description = E'Phiên bản nhẹ, nhanh cho task đơn giản. Tích hợp web search tự động. Context: 128k tokens.'
WHERE model_id = 'sonar-small';

-- Sonar Medium
UPDATE public.admin_ai_models 
SET description = E'Phiên bản trung bình, cân bằng giữa tốc độ và chất lượng. Tích hợp web search tự động. Context: 128k tokens.'
WHERE model_id = 'sonar-medium';

-- Sonar Small Online
UPDATE public.admin_ai_models 
SET description = E'Phiên bản nhẹ với internet access, phù hợp cho real-time search. Context: 128k tokens.'
WHERE model_id = 'sonar-small-online';

-- Sonar Reasoning
UPDATE public.admin_ai_models 
SET description = E'Chuyên về reasoning và logic, tích hợp web search tự động. Phù hợp cho các tác vụ yêu cầu suy luận phức tạp. Context: 128k tokens.'
WHERE model_id = 'sonar-reasoning';

-- Sonar Reasoning Pro
UPDATE public.admin_ai_models 
SET description = E'Phiên bản Pro chuyên về reasoning và logic, tích hợp web search tự động. Phù hợp cho các tác vụ yêu cầu suy luận phức tạp. Context: 200k tokens.'
WHERE model_id = 'sonar-reasoning-pro';

-- Sonar Deep Research
UPDATE public.admin_ai_models 
SET description = E'Chuyên dụng cho nghiên cứu sâu, tích hợp web search tự động. Phù hợp cho các tác vụ nghiên cứu và phân tích chuyên sâu. Context: 200k tokens.'
WHERE model_id = 'sonar-deep-research';

-- =====================================================
-- PERPLEXITY MODELS - PPLX Models
-- =====================================================

-- PPLX 7B Online
UPDATE public.admin_ai_models 
SET description = E'Model nhỏ với internet access, phù hợp cho các tác vụ đơn giản cần real-time search. Context: 128k tokens.'
WHERE model_id = 'pplx-7b-online';

-- PPLX 70B Online
UPDATE public.admin_ai_models 
SET description = E'Model lớn với internet access, phù hợp cho các tác vụ phức tạp cần real-time search. Context: 128k tokens.'
WHERE model_id = 'pplx-70b-online';

-- PPLX 7B Chat
UPDATE public.admin_ai_models 
SET description = E'Model nhỏ cho conversational, không có web search. Phù hợp cho chat và completion. Context: 128k tokens.'
WHERE model_id = 'pplx-7b-chat';

-- PPLX 70B Chat
UPDATE public.admin_ai_models 
SET description = E'Model lớn cho conversational, không có web search. Phù hợp cho chat và completion. Context: 128k tokens.'
WHERE model_id = 'pplx-70b-chat';

-- =====================================================
-- PERPLEXITY MODELS - Open Source Models
-- =====================================================

-- Mistral 7B Instruct
UPDATE public.admin_ai_models 
SET description = E'Model open-source Mistral 7B cho chat và instruction following. Phù hợp cho conversational và code generation. Context: 32k tokens.'
WHERE model_id = 'mistral-7b-instruct';

-- Llama 2 70B Chat
UPDATE public.admin_ai_models 
SET description = E'Model open-source Llama 2 70B cho chat. Phù hợp cho conversational và general purpose tasks. Context: 32k tokens.'
WHERE model_id = 'llama-2-70b-chat';

-- CodeLlama 34B
UPDATE public.admin_ai_models 
SET description = E'Model open-source CodeLlama 34B chuyên về code generation. Phù hợp cho lập trình và code completion. Context: 16k tokens.'
WHERE model_id = 'codellama-34b';

-- =====================================================
-- HOÀN THÀNH
-- =====================================================
-- Script đã cập nhật description với encoding UTF-8 đúng cho:
-- ✅ Gemini 3 Pro, Gemini 3 Flash
-- ✅ Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite
-- ✅ Gemini 2.0 Flash
-- ✅ Sonar Pro, Sonar, Sonar Small/Medium, Sonar Reasoning, Sonar Deep Research
-- ✅ PPLX 7B/70B Online, PPLX 7B/70B Chat
-- ✅ Mistral 7B, Llama 2 70B, CodeLlama 34B
-- =====================================================

RESET client_encoding;

