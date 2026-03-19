-- =====================================================
-- FIX VIETNAMESE ENCODING - AI MODELS (COMPLETE)
-- =====================================================
-- Script này sửa encoding tiếng Việt cho TẤT CẢ AI Models
-- Chạy từng UPDATE statement để đảm bảo encoding UTF-8 đúng

SET client_encoding TO 'UTF8';

-- =====================================================
-- GEMINI MODELS - Dòng Gemini 3
-- =====================================================

UPDATE public.admin_ai_models 
SET description = E'Mô hình mạnh mẽ nhất hiện nay. Tối ưu cho các tác vụ lập trình phức tạp, suy luận đa bước và xử lý đa phương thức (văn bản, hình ảnh, video, âm thanh). Context: 1M-2M tokens.'
WHERE model_id = 'gemini-3-pro-preview';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản cân bằng giữa tốc độ và trí thông minh, phù hợp cho các ứng dụng cần phản hồi nhanh nhưng vẫn yêu cầu khả năng xử lý của thế hệ thứ 3. Context: 1M tokens.'
WHERE model_id = 'gemini-3-flash-preview';

-- =====================================================
-- GEMINI MODELS - Dòng Gemini 2.5
-- =====================================================

UPDATE public.admin_ai_models 
SET description = E'Mô hình "thông minh" chủ lực, hỗ trợ cửa sổ ngữ cảnh lên tới 2 triệu token. Đặc biệt mạnh về khả năng "Deep Think" (suy luận sâu). Context: 2M tokens.'
WHERE model_id = 'gemini-2.5-pro';

UPDATE public.admin_ai_models 
SET description = E'Tốc độ cực nhanh, giá rẻ, phù hợp để xử lý dữ liệu lớn hoặc làm trợ lý hội thoại thời gian thực. Context: 1M tokens.'
WHERE model_id = 'gemini-2.5-flash';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản siêu nhẹ, tối ưu hóa tối đa về chi phí và độ trễ cho các tác vụ đơn giản như phân loại văn bản hoặc tóm tắt ngắn. Context: 1M tokens.'
WHERE model_id = 'gemini-2.5-flash-lite';

-- =====================================================
-- GEMINI MODELS - Dòng Gemini 2.0
-- =====================================================

UPDATE public.admin_ai_models 
SET description = E'Model mới nhất của Google, nhanh gấp 3 lần Gemini 1.5 Pro, hỗ trợ đa phương thức. Context: 1M tokens.'
WHERE model_id = 'gemini-2.0-flash-exp';

-- =====================================================
-- PERPLEXITY MODELS - Sonar Models
-- =====================================================

UPDATE public.admin_ai_models 
SET description = E'Flagship model cho query phức tạp, tích hợp web search tự động. Phù hợp cho chat completions và grounded answers. Context: 200k tokens.'
WHERE model_id = 'sonar-pro';

UPDATE public.admin_ai_models 
SET description = E'Base model cho general queries, tích hợp web search tự động. Phù hợp cho chat completions và grounded answers. Context: 128k tokens.'
WHERE model_id = 'sonar';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản nhẹ, nhanh cho task đơn giản. Tích hợp web search tự động. Context: 128k tokens.'
WHERE model_id = 'sonar-small';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản trung bình, cân bằng giữa tốc độ và chất lượng. Tích hợp web search tự động. Context: 128k tokens.'
WHERE model_id = 'sonar-medium';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản nhẹ với internet access, phù hợp cho real-time search. Context: 128k tokens.'
WHERE model_id = 'sonar-small-online';

UPDATE public.admin_ai_models 
SET description = E'Chuyên về reasoning và logic, tích hợp web search tự động. Phù hợp cho các tác vụ yêu cầu suy luận phức tạp. Context: 128k tokens.'
WHERE model_id = 'sonar-reasoning';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản Pro chuyên về reasoning và logic, tích hợp web search tự động. Phù hợp cho các tác vụ yêu cầu suy luận phức tạp. Context: 200k tokens.'
WHERE model_id = 'sonar-reasoning-pro';

UPDATE public.admin_ai_models 
SET description = E'Chuyên dụng cho nghiên cứu sâu, tích hợp web search tự động. Phù hợp cho các tác vụ nghiên cứu và phân tích chuyên sâu. Context: 200k tokens.'
WHERE model_id = 'sonar-deep-research';

UPDATE public.admin_ai_models 
SET description = E'Phiên bản trung bình với internet access, phù hợp cho real-time search. Context: 128k tokens.'
WHERE model_id = 'sonar-medium-online';

-- =====================================================
-- PERPLEXITY MODELS - Llama 3.1 Sonar
-- =====================================================

UPDATE public.admin_ai_models 
SET description = E'Model Perplexity mạnh mẽ cho chat, tích hợp web search tự động. Context: 128k tokens.'
WHERE model_id = 'llama-3.1-sonar-large-128k-chat';

UPDATE public.admin_ai_models 
SET description = E'Model Perplexity mạnh mẽ với khả năng tìm kiếm online, phù hợp cho real-time search. Context: 128k tokens.'
WHERE model_id = 'llama-3.1-sonar-large-128k-online';

UPDATE public.admin_ai_models 
SET description = E'Model Perplexity nhỏ gọn cho chat, tích hợp web search tự động. Context: 128k tokens.'
WHERE model_id = 'llama-3.1-sonar-small-128k-chat';

UPDATE public.admin_ai_models 
SET description = E'Model Perplexity nhỏ gọn với khả năng tìm kiếm online, phù hợp cho real-time search. Context: 128k tokens.'
WHERE model_id = 'llama-3.1-sonar-small-128k-online';

-- =====================================================
-- PERPLEXITY MODELS - PPLX Models
-- =====================================================

UPDATE public.admin_ai_models 
SET description = E'Model nhỏ với internet access, phù hợp cho các tác vụ đơn giản cần real-time search. Context: 128k tokens.'
WHERE model_id = 'pplx-7b-online';

UPDATE public.admin_ai_models 
SET description = E'Model lớn với internet access, phù hợp cho các tác vụ phức tạp cần real-time search. Context: 128k tokens.'
WHERE model_id = 'pplx-70b-online';

UPDATE public.admin_ai_models 
SET description = E'Model nhỏ cho conversational, không có web search. Phù hợp cho chat và completion. Context: 128k tokens.'
WHERE model_id = 'pplx-7b-chat';

UPDATE public.admin_ai_models 
SET description = E'Model lớn cho conversational, không có web search. Phù hợp cho chat và completion. Context: 128k tokens.'
WHERE model_id = 'pplx-70b-chat';

RESET client_encoding;

