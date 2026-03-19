-- =====================================================
-- SAMPLE AI PROMPTS - CÁC PROMPT MẪU CHO HỆ THỐNG
-- =====================================================
-- Script này thêm các prompt mẫu cho các tính năng AI
-- Chạy script này sau khi đã có table admin_ai_prompts và admin_ai_models

-- Lấy model IDs (giả sử các model đã được tạo)
DO $$
DECLARE
  gemini_flash_id UUID;
  gemini_pro_id UUID;
  perplexity_online_id UUID;
BEGIN
  -- Lấy ID của các model
  SELECT id INTO gemini_flash_id FROM public.admin_ai_models WHERE model_id = 'gemini-2.0-flash-exp' LIMIT 1;
  SELECT id INTO gemini_pro_id FROM public.admin_ai_models WHERE model_id = 'gemini-1.5-pro' LIMIT 1;
  SELECT id INTO perplexity_online_id FROM public.admin_ai_models WHERE model_id = 'llama-3.1-sonar-large-128k-online' LIMIT 1;
  
  -- Nếu không tìm thấy, dùng NULL (prompt sẽ không gắn với model cụ thể)
  IF gemini_flash_id IS NULL THEN
    SELECT id INTO gemini_flash_id FROM public.admin_ai_models WHERE provider = 'gemini' AND is_active = true LIMIT 1;
  END IF;
  IF perplexity_online_id IS NULL THEN
    SELECT id INTO perplexity_online_id FROM public.admin_ai_models WHERE provider = 'perplexity' AND is_active = true LIMIT 1;
  END IF;

  -- =====================================================
  -- TRANSLATION PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Dịch văn bản',
    'translate_text',
    'translation',
    'Dịch văn bản giữa các ngôn ngữ',
    'Bạn là một chuyên gia dịch thuật. Nhiệm vụ của bạn là dịch văn bản một cách chính xác, tự nhiên và giữ nguyên ý nghĩa. Hãy dịch văn bản sau đây sang {target_language}.',
    'Văn bản cần dịch:\n{text}\n\nNgôn ngữ đích: {target_language}',
    ARRAY['text', 'target_language'],
    gemini_flash_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'translate_text');

  -- =====================================================
  -- NOTE CREATION PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Tạo ghi chú từ văn bản',
    'create_note_from_text',
    'notes',
    'Tạo ghi chú có cấu trúc từ văn bản được chọn',
    'Bạn là trợ lý thông minh giúp tạo ghi chú. Hãy phân tích văn bản và tạo một ghi chú có cấu trúc với tiêu đề, nội dung chính, và các điểm quan trọng.',
    'Văn bản được chọn:\n{selected_text}\n\nHãy tạo một ghi chú có cấu trúc từ văn bản này.',
    ARRAY['selected_text'],
    gemini_flash_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'create_note_from_text');

  -- =====================================================
  -- HABIT SUGGESTION PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Gợi ý thói quen',
    'suggest_habits',
    'habits',
    'Gợi ý thói quen dựa trên mục tiêu và lĩnh vực cuộc sống',
    'Bạn là chuyên gia phát triển bản thân. Hãy gợi ý các thói quen phù hợp dựa trên mục tiêu và lĩnh vực cuộc sống của người dùng. Mỗi thói quen nên có tên rõ ràng, mô tả ngắn gọn, và lợi ích cụ thể.',
    'Lĩnh vực cuộc sống: {life_area}\nMục tiêu: {goal}\n\nHãy gợi ý 3-5 thói quen phù hợp để đạt được mục tiêu này.',
    ARRAY['life_area', 'goal'],
    gemini_pro_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'suggest_habits');

  -- =====================================================
  -- TASK BREAKDOWN PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Phân tích công việc',
    'breakdown_task',
    'tasks',
    'Phân tích công việc lớn thành các bước nhỏ',
    'Bạn là chuyên gia quản lý dự án. Hãy phân tích công việc lớn thành các bước nhỏ, cụ thể và có thể thực hiện được. Mỗi bước nên có mô tả rõ ràng và ước tính thời gian.',
    'Công việc cần phân tích:\n{task_description}\n\nHãy chia công việc này thành các bước nhỏ, cụ thể.',
    ARRAY['task_description'],
    gemini_flash_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'breakdown_task');

  -- =====================================================
  -- JOURNAL PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Gợi ý viết nhật ký',
    'journal_prompt',
    'journal',
    'Gợi ý câu hỏi hoặc chủ đề để viết nhật ký',
    'Bạn là chuyên gia tâm lý và phát triển bản thân. Hãy gợi ý các câu hỏi hoặc chủ đề phù hợp để người dùng viết nhật ký, giúp họ suy ngẫm và phát triển bản thân.',
    'Lĩnh vực: {life_area}\nTâm trạng hiện tại: {mood}\n\nHãy gợi ý 3-5 câu hỏi hoặc chủ đề để viết nhật ký.',
    ARRAY['life_area', 'mood'],
    gemini_pro_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'journal_prompt');

  -- =====================================================
  -- GOAL REFINEMENT PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Tinh chỉnh mục tiêu',
    'refine_goal',
    'goals',
    'Giúp tinh chỉnh và làm rõ mục tiêu',
    'Bạn là chuyên gia đặt mục tiêu. Hãy giúp người dùng tinh chỉnh mục tiêu của họ theo nguyên tắc SMART (Specific, Measurable, Achievable, Relevant, Time-bound).',
    'Mục tiêu ban đầu: {goal_description}\nLĩnh vực: {life_area}\n\nHãy giúp tinh chỉnh mục tiêu này theo nguyên tắc SMART.',
    ARRAY['goal_description', 'life_area'],
    gemini_pro_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'refine_goal');

  -- =====================================================
  -- WEEKLY REVIEW PROMPTS
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Câu hỏi đánh giá tuần',
    'weekly_review_questions',
    'review',
    'Gợi ý câu hỏi cho đánh giá tuần',
    'Bạn là chuyên gia phát triển bản thân. Hãy gợi ý các câu hỏi sâu sắc để người dùng đánh giá tuần của họ, bao gồm thành tựu, thách thức, và bài học rút ra.',
    'Tuần vừa qua, người dùng đã:\n- Hoàn thành {tasks_completed} công việc\n- Thực hiện {habits_completed} thói quen\n- Tiến độ mục tiêu: {goals_progress}\n\nHãy gợi ý 5-7 câu hỏi để đánh giá tuần này.',
    ARRAY['tasks_completed', 'habits_completed', 'goals_progress'],
    gemini_pro_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'weekly_review_questions');

  -- =====================================================
  -- WEB SEARCH PROMPTS (Perplexity)
  -- =====================================================
  
  INSERT INTO public.admin_ai_prompts (name, prompt_key, category, description, system_prompt, user_prompt_template, variables, model_id, is_active)
  SELECT 
    'Tìm kiếm thông tin',
    'web_search',
    'search',
    'Tìm kiếm thông tin trên web và tóm tắt',
    'Bạn là trợ lý tìm kiếm thông minh. Hãy tìm kiếm thông tin trên web và cung cấp câu trả lời chính xác, có nguồn tham khảo.',
    'Câu hỏi: {query}\n\nHãy tìm kiếm và cung cấp thông tin chi tiết về chủ đề này.',
    ARRAY['query'],
    perplexity_online_id,
    true
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_prompts WHERE prompt_key = 'web_search');

END $$;

