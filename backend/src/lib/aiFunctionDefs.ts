// Prompt + tool definitions for the AI helper endpoints, ported verbatim from the
// legacy Supabase Edge Functions (ai-template-generate, ai-translate,
// vision-values-suggest, ai-theme-suggest) so output shapes stay identical.

/* ----------------------------- ai-template-generate ----------------------------- */

export const TEMPLATE_SYSTEM_PROMPTS: Record<string, string> = {
  goals: `Bạn là AI chuyên tạo Goal Templates cho ứng dụng quản lý mục tiêu cá nhân.
Mỗi template phải có cấu trúc JSON sau:
{
  "title": "Tên mục tiêu mẫu",
  "description": "Mô tả chi tiết mục tiêu",
  "area": "health|career|finance|relationships|personal|learning|fun|environment|spirituality|contribution",
  "milestones": [
    { "title": "Milestone 1", "description": "Mô tả" },
    { "title": "Milestone 2", "description": "Mô tả" }
  ],
  "suggested_duration_days": 90,
  "priority": "high|medium|low",
  "tips": ["Tip 1", "Tip 2"]
}`,
  habits: `Bạn là AI chuyên tạo Habit Templates cho ứng dụng theo dõi thói quen.
Mỗi template phải có cấu trúc JSON sau:
{
  "name": "Tên thói quen",
  "description": "Mô tả và lợi ích của thói quen",
  "area": "health|career|finance|relationships|personal|learning|fun|environment|spirituality|contribution",
  "frequency": "daily|weekly|custom",
  "target_per_day": 1,
  "target_unit": "lần|phút|trang|...",
  "suggested_time": "morning|afternoon|evening|night",
  "difficulty": "easy|medium|hard",
  "benefits": ["Lợi ích 1", "Lợi ích 2"],
  "tips": ["Mẹo 1", "Mẹo 2"]
}`,
  journal: `Bạn là AI chuyên tạo Journal Templates cho ứng dụng nhật ký cá nhân.
Mỗi template phải có cấu trúc JSON sau:
{
  "title": "Tên template nhật ký",
  "description": "Mô tả mục đích của template",
  "prompts": [
    { "question": "Câu hỏi gợi ý 1", "placeholder": "Gợi ý trả lời..." },
    { "question": "Câu hỏi gợi ý 2", "placeholder": "Gợi ý trả lời..." }
  ],
  "mood_tracking": true,
  "gratitude_section": true,
  "suggested_areas": ["health", "relationships"],
  "best_for": "Mô tả ai nên dùng template này"
}`,
  review: `Bạn là AI chuyên tạo Weekly Review Templates cho ứng dụng đánh giá tuần.
Mỗi template phải có cấu trúc JSON sau:
{
  "title": "Tên template đánh giá",
  "description": "Mô tả mục đích",
  "sections": [
    {
      "title": "Tên section",
      "type": "text|rating|list|checklist",
      "prompt": "Câu hỏi hoặc hướng dẫn",
      "options": []
    }
  ],
  "rating_scale": 10,
  "focus_areas": ["health", "career"],
  "estimated_time_minutes": 15
}`,
};

export function buildTemplateUserPrompt(type: string, category?: string, prompt?: string): string {
  const base: Record<string, string> = {
    goals: `Tạo 3 Goal Templates ${category ? `cho category "${category}"` : 'đa dạng cho các lĩnh vực cuộc sống'}.
${prompt ? `Yêu cầu thêm: ${prompt}` : ''}
Đảm bảo mỗi template thực tế, có thể đạt được và có milestones rõ ràng.
Trả về mảng JSON với 3 templates.`,
    habits: `Tạo 3 Habit Templates ${category ? `cho category "${category}"` : 'cho các thói quen lành mạnh phổ biến'}.
${prompt ? `Yêu cầu thêm: ${prompt}` : ''}
Tập trung vào các thói quen dễ bắt đầu nhưng có tác động lớn.
Trả về mảng JSON với 3 templates.`,
    journal: `Tạo 3 Journal Templates ${category ? `cho mục đích "${category}"` : 'cho các phong cách viết nhật ký khác nhau'}.
${prompt ? `Yêu cầu thêm: ${prompt}` : ''}
Bao gồm các câu hỏi gợi mở giúp người dùng suy ngẫm sâu.
Trả về mảng JSON với 3 templates.`,
    review: `Tạo 3 Weekly Review Templates ${category ? `cho "${category}"` : 'cho các phong cách đánh giá tuần khác nhau'}.
${prompt ? `Yêu cầu thêm: ${prompt}` : ''}
Cân bằng giữa tổng kết thành tựu và lập kế hoạch tuần tới.
Trả về mảng JSON với 3 templates.`,
  };
  return base[type] ?? base.goals;
}

/* --------------------------------- ai-translate --------------------------------- */

export interface TranslateParams {
  type: 'translate' | 'batch-translate' | 'detect-language' | 'suggest-translations' | 'improve-translation';
  content: string | Record<string, string> | { original: string; translation: string };
  sourceLanguage?: string;
  targetLanguage?: string;
  context?: string;
}

export const TRANSLATE_JSON_TYPES = ['batch-translate', 'detect-language', 'suggest-translations', 'improve-translation'];

export function buildTranslatePrompts(params: TranslateParams): { systemPrompt: string; userPrompt: string } {
  const { type, content, sourceLanguage, targetLanguage, context } = params;
  switch (type) {
    case 'translate':
      return {
        systemPrompt: `You are a professional translator specializing in app/software localization. 
Translate the given content accurately while:
- Preserving technical terms and placeholders (like {name}, {{count}}, etc.)
- Maintaining the same tone and formality level
- Adapting cultural references appropriately
- Keeping the translation concise for UI elements
Return ONLY the translated text, nothing else.`,
        userPrompt: `Translate the following from ${sourceLanguage} to ${targetLanguage}:

"${content}"

${context ? `Context: ${context}` : ''}`,
      };
    case 'batch-translate':
      return {
        systemPrompt: `You are a professional translator for app localization.
Translate each key-value pair accurately while preserving:
- All placeholders like {name}, {{count}}, %s, etc.
- The same tone and formality
- Technical terms

Return a valid JSON object with the same keys but translated values.`,
        userPrompt: `Translate the following JSON from ${sourceLanguage} to ${targetLanguage}:

${JSON.stringify(content, null, 2)}

Return ONLY the JSON object with translated values.`,
      };
    case 'detect-language':
      return {
        systemPrompt: `You are a language detection expert. Identify the language of the given text.
Return ONLY a JSON object with: { "language": "language name", "code": "ISO 639-1 code", "confidence": 0.0-1.0 }`,
        userPrompt: `Detect the language of: "${content}"`,
      };
    case 'suggest-translations':
      return {
        systemPrompt: `You are a localization expert. Suggest multiple translation variants for the given text.
Consider different contexts, formality levels, and regional variations.
Return a JSON array of objects: [{ "translation": "text", "context": "when to use", "formality": "formal/informal/neutral" }]`,
        userPrompt: `Suggest translation variants from ${sourceLanguage} to ${targetLanguage} for:

"${content}"

${context ? `Context: ${context}` : ''}

Provide 3-5 different options.`,
      };
    case 'improve-translation': {
      const c = content as { original: string; translation: string };
      return {
        systemPrompt: `You are a translation quality expert. Review and improve the given translation.
Check for:
- Accuracy and faithfulness to the original
- Natural flow in the target language
- Cultural appropriateness
- UI/UX suitability (conciseness, clarity)

Return JSON: { "improved": "improved translation", "issues": ["list of issues found"], "suggestions": ["improvement suggestions"] }`,
        userPrompt: `Original (${sourceLanguage}): "${c.original}"
Current translation (${targetLanguage}): "${c.translation}"

${context ? `Context: ${context}` : ''}`,
      };
    }
    default:
      throw new Error(`Unknown translation type: ${type}`);
  }
}

/* ----------------------------- vision-values-suggest ---------------------------- */

export function buildVisionValuesPrompts(
  type: string,
  context?: Record<string, string>,
): { systemPrompt: string; userPrompt: string } {
  switch (type) {
    case 'purpose':
      return {
        systemPrompt: `Bạn là một life coach chuyên nghiệp. Hãy gợi ý MỤC ĐÍCH SỐNG (life purpose statement) cho người dùng.
Trả về JSON với format: { "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }
Mỗi suggestion là một câu ngắn gọn, truyền cảm hứng về mục đích sống (30-50 từ).`,
        userPrompt: context?.bio
          ? `Dựa trên thông tin: "${context.bio}", hãy gợi ý 3 mục đích sống phù hợp.`
          : `Hãy gợi ý 3 mục đích sống phổ biến và ý nghĩa cho một người đang tìm kiếm hướng đi trong cuộc sống.`,
      };
    case 'vision':
      return {
        systemPrompt: `Bạn là một life coach chuyên nghiệp. Hãy gợi ý TẦM NHÌN CUỘC SỐNG (life vision) cho người dùng.
Trả về JSON với format: { "suggestions": [{"statement": "...", "timeframe": "5-year"}] }
Timeframe có thể là: 1-year, 5-year, 10-year, lifetime.`,
        userPrompt: context?.purpose
          ? `Dựa trên mục đích sống: "${context.purpose}", hãy gợi ý 3 tầm nhìn cụ thể cho các khung thời gian khác nhau.`
          : `Hãy gợi ý 3 tầm nhìn cuộc sống cho các khung thời gian khác nhau (1 năm, 5 năm, 10 năm).`,
      };
    case 'values':
      return {
        systemPrompt: `Bạn là một life coach chuyên nghiệp. Hãy gợi ý GIÁ TRỊ CỐT LÕI (core values) cho người dùng.
Trả về JSON với format: { "suggestions": [{"name": "Tên giá trị", "description": "Mô tả ngắn", "icon": "emoji"}] }
Emoji phù hợp: 💪 ❤️ 🎯 ⭐ 🔥 💎 🌟 🚀 💡 🎨 📚 🏆 🌱 ⚡ 🎭 🤝 💼 🧘 🏠`,
        userPrompt: context?.purpose
          ? `Dựa trên mục đích: "${context.purpose}", hãy gợi ý 5 giá trị cốt lõi phù hợp với mô tả và emoji.`
          : `Hãy gợi ý 5 giá trị cốt lõi phổ biến và quan trọng với mô tả và emoji phù hợp.`,
      };
    case 'roles':
      return {
        systemPrompt: `Bạn là một life coach chuyên nghiệp. Hãy gợi ý VAI TRÒ TRONG CUỘC SỐNG (life roles) cho người dùng.
Trả về JSON với format: { "suggestions": [{"name": "Tên vai trò", "description": "Mô tả trách nhiệm", "icon": "emoji"}] }
Emoji phù hợp: 👨‍👩‍👧‍👦 👨‍💼 👨‍🏫 👨‍⚕️ 🧑‍💻 👨‍🎓 🏋️ 🎨 📚 🤝 💼 🏠 ❤️`,
        userPrompt: context?.bio
          ? `Dựa trên: "${context.bio}", hãy gợi ý 5 vai trò cuộc sống quan trọng với mô tả trách nhiệm.`
          : `Hãy gợi ý 5 vai trò cuộc sống phổ biến (như Con, Cha/Mẹ, Nhân viên, Bạn, ...) với mô tả trách nhiệm.`,
      };
    case 'traits':
      return {
        systemPrompt: `Bạn là một life coach chuyên nghiệp. Hãy gợi ý ĐIỂM MẠNH và ĐIỂM YẾU phổ biến để người dùng tự đánh giá.
Trả về JSON với format: { "strengths": [{"name": "...", "description": "..."}], "weaknesses": [{"name": "...", "description": "..."}] }`,
        userPrompt: `Hãy gợi ý 4 điểm mạnh và 4 điểm yếu phổ biến mà người ta thường có, với mô tả ngắn gọn để người dùng tự nhận diện bản thân.`,
      };
    case 'milestone':
      return {
        systemPrompt: `Bạn là một life coach chuyên nghiệp. Hãy gợi ý CỘT MỐC CUỘC ĐỜI quan trọng để người dùng ghi nhận.
Trả về JSON với format: { "suggestions": [{"title": "...", "description": "...", "area": "career|health|relationships|..."}] }
Area có thể là: health, relationships, career, finance, personal, fun, environment, spirituality, learning, contribution.`,
        userPrompt: `Hãy gợi ý 5 loại cột mốc cuộc đời quan trọng mà mọi người thường ghi nhận, với mô tả và lĩnh vực liên quan.`,
      };
    default:
      throw new Error(`Unknown suggestion type: ${type}`);
  }
}

/* ------------------------------- ai-theme-suggest ------------------------------- */

const HSL_COLOR_PROPS = {
  background: { type: 'string', description: 'HSL: Main background color' },
  foreground: { type: 'string', description: 'HSL: Main text color' },
  card: { type: 'string', description: 'HSL: Card background' },
  cardForeground: { type: 'string', description: 'HSL: Card text color' },
  primary: { type: 'string', description: 'HSL: Primary brand color' },
  primaryForeground: { type: 'string', description: 'HSL: Text on primary' },
  secondary: { type: 'string', description: 'HSL: Secondary color' },
  secondaryForeground: { type: 'string', description: 'HSL: Text on secondary' },
  muted: { type: 'string', description: 'HSL: Muted background' },
  mutedForeground: { type: 'string', description: 'HSL: Muted text' },
  accent: { type: 'string', description: 'HSL: Accent color' },
  accentForeground: { type: 'string', description: 'HSL: Text on accent' },
  destructive: { type: 'string', description: 'HSL: Error/danger color' },
  destructiveForeground: { type: 'string', description: 'HSL: Text on destructive' },
  border: { type: 'string', description: 'HSL: Border color' },
  ring: { type: 'string', description: 'HSL: Focus ring color' },
};

const PALETTE_REQUIRED = ['background', 'foreground', 'primary', 'primaryForeground', 'secondary', 'accent', 'destructive', 'border'];

export interface ThemeRequest {
  systemPrompt: string;
  tools: unknown[];
  toolChoice: unknown;
  toolName: string;
}

export function buildThemeRequest(type: string): ThemeRequest {
  if (type === 'palette') {
    return {
      toolName: 'generate_theme_palette',
      systemPrompt: `You are a professional UI/UX designer specializing in color theory and design systems.
Generate a cohesive color palette for a productivity/life management app based on the user's description.
All colors MUST be in HSL format: "H S% L%" (e.g., "250 95% 60%").
Consider accessibility, contrast ratios, and visual harmony.
Generate both light and dark mode variants.`,
      toolChoice: { type: 'function', function: { name: 'generate_theme_palette' } },
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_theme_palette',
            description: 'Generate a complete color palette with light and dark mode',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Theme name' },
                description: { type: 'string', description: 'Brief description of the theme style' },
                light: { type: 'object', properties: HSL_COLOR_PROPS, required: PALETTE_REQUIRED },
                dark: { type: 'object', properties: HSL_COLOR_PROPS, required: PALETTE_REQUIRED },
                fonts: {
                  type: 'object',
                  properties: {
                    heading: { type: 'string', description: 'Google Font name for headings' },
                    body: { type: 'string', description: 'Google Font name for body text' },
                  },
                },
              },
              required: ['name', 'description', 'light', 'dark'],
            },
          },
        },
      ],
    };
  }
  if (type === 'improve') {
    return {
      toolName: 'improve_palette',
      systemPrompt: `You are a professional UI/UX designer. Analyze the given color palette and suggest improvements for better accessibility, visual harmony, and modern aesthetics.
All colors MUST be in HSL format: "H S% L%".`,
      toolChoice: { type: 'function', function: { name: 'improve_palette' } },
      tools: [
        {
          type: 'function',
          function: {
            name: 'improve_palette',
            description: 'Suggest improvements for the color palette',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      colorKey: { type: 'string' },
                      currentValue: { type: 'string' },
                      suggestedValue: { type: 'string' },
                      reason: { type: 'string' },
                    },
                    required: ['colorKey', 'suggestedValue', 'reason'],
                  },
                },
                overallFeedback: { type: 'string' },
              },
              required: ['suggestions', 'overallFeedback'],
            },
          },
        },
      ],
    };
  }
  // default: generate multiple theme ideas
  return {
    toolName: 'generate_theme_ideas',
    systemPrompt: `You are a creative UI/UX designer. Generate 3-5 unique theme ideas for a productivity app based on the user's input.
Each theme should have a distinct personality and use case.`,
    toolChoice: { type: 'function', function: { name: 'generate_theme_ideas' } },
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_theme_ideas',
          description: 'Generate multiple theme concept ideas',
          parameters: {
            type: 'object',
            properties: {
              ideas: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    mood: { type: 'string' },
                    primaryColor: { type: 'string', description: 'HSL format' },
                    accentColor: { type: 'string', description: 'HSL format' },
                  },
                  required: ['name', 'description', 'mood', 'primaryColor', 'accentColor'],
                },
              },
            },
            required: ['ideas'],
          },
        },
      },
    ],
  };
}

// ----------------------------- ai-suggest -----------------------------
export interface SuggestArea {
  id: string;
  name?: string;
  score: number;
}

export interface SuggestParams {
  type: string;
  lowestAreas?: SuggestArea[];
  userContext?: { lifePurpose?: string; personalValues?: Array<{ name?: string }> };
}

const SUGGEST_AREA_NAMES: Record<string, string> = {
  health: 'Sức khỏe', emotional: 'Cảm xúc', career: 'Sự nghiệp',
  finance: 'Tài chính', relationships: 'Quan hệ', learning: 'Học tập',
  personal: 'Mục tiêu cá nhân', fun: 'Giải trí', environment: 'Môi trường',
  spirituality: 'Tâm linh', contribution: 'Đóng góp',
};

export function buildSuggestPrompts(params: SuggestParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Bạn là một AI Life Coach chuyên giúp người dùng cải thiện cuộc sống. 
Bạn đưa ra gợi ý CỤ THỂ và CÓ THỂ HÀNH ĐỘNG NGAY.

Trả về JSON với format:
{
  "habits": [
    { "name": "Tên thói quen", "description": "Mô tả ngắn", "frequency": "daily", "area": "area_id" }
  ],
  "tasks": [
    { "title": "Tiêu đề task", "description": "Mô tả", "priority": "high|medium|low", "area": "area_id" }
  ],
  "insights": "Phân tích ngắn về tình trạng hiện tại và lý do đề xuất"
}

Chỉ trả về JSON, không có text khác.`;

  const lowestAreas = params.lowestAreas ?? [];
  const userContext = params.userContext;
  const userPrompt = `Dựa trên các mảng cuộc sống có điểm thấp nhất sau:
${lowestAreas.map((a) => `- ${SUGGEST_AREA_NAMES[a.id] || a.name || a.id} (${a.id}): ${a.score}/10`).join('\n')}

${userContext?.lifePurpose ? `Mục đích sống của người dùng: ${userContext.lifePurpose}` : ''}
${userContext?.personalValues && userContext.personalValues.length > 0 ? `Giá trị cốt lõi: ${userContext.personalValues.map((v) => v.name).join(', ')}` : ''}

Hãy đề xuất:
1. 2-3 thói quen mới phù hợp để cải thiện các mảng này (frequency: daily hoặc weekly)
2. 2-3 tasks cụ thể có thể làm ngay trong tuần này (priority: high/medium/low)
3. Phân tích ngắn gọn về tình trạng và hướng cải thiện

Lưu ý:
- Thói quen phải đơn giản, dễ thực hiện
- Tasks phải cụ thể, có thể hoàn thành trong 1-2 giờ
- Ưu tiên các hành động nhỏ nhưng đều đặn`;

  return { systemPrompt, userPrompt };
}
