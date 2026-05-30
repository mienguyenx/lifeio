-- =====================================================
-- CLEANUP AI MODELS - XÓA CÁC MODEL ĐÃ BỊ LOẠI BỎ
-- =====================================================
-- Script này xóa hoặc disable các model Gemini 1.5 đã bị Google loại bỏ
-- Chạy sau khi đã cập nhật models mới

-- =====================================================
-- XÓA CÁC MODEL GEMINI 1.5 (ĐÃ BỊ GOOGLE LOẠI BỎ)
-- =====================================================

-- Xóa Gemini 1.5 Flash (đã bị loại bỏ)
DELETE FROM public.admin_ai_models 
WHERE model_id = 'gemini-1.5-flash';

-- Xóa Gemini 1.5 Pro (đã bị loại bỏ)
DELETE FROM public.admin_ai_models 
WHERE model_id = 'gemini-1.5-pro';

-- =====================================================
-- VÔ HIỆU HÓA CÁC MODEL CŨ KHÁC (nếu cần)
-- =====================================================

-- Disable các model cũ không còn được hỗ trợ
UPDATE public.admin_ai_models 
SET is_active = false, is_default = false
WHERE model_id IN (
  'google/gemini-2.5-flash',  -- Model cũ với prefix google/
  'openai/gpt-5-mini'          -- Model cũ
);

-- =====================================================
-- ĐẢM BẢO CHỈ CÓ 1 DEFAULT MODEL
-- =====================================================

-- Nếu có nhiều default models, chỉ giữ Gemini 2.5 Flash làm default
UPDATE public.admin_ai_models 
SET is_default = false
WHERE is_default = true 
  AND model_id != 'gemini-2.5-flash'
  AND EXISTS (SELECT 1 FROM public.admin_ai_models WHERE model_id = 'gemini-2.5-flash' AND is_active = true);

-- =====================================================
-- HOÀN THÀNH
-- =====================================================
-- Script đã:
-- ✅ Xóa Gemini 1.5 Flash (đã bị Google loại bỏ)
-- ✅ Xóa Gemini 1.5 Pro (đã bị Google loại bỏ)
-- ✅ Disable các model cũ không còn được hỗ trợ
-- ✅ Đảm bảo chỉ có 1 default model (Gemini 2.5 Flash)
-- =====================================================

