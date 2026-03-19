import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateRequest {
  type: 'goals' | 'habits' | 'journal' | 'review';
  prompt?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, category }: TemplateRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
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
}`
    };

    const userPromptBase: Record<string, string> = {
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
Trả về mảng JSON với 3 templates.`
    };

    console.log("AI Template Generate request:", { type, category, promptLength: prompt?.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[type] + "\n\nChỉ trả về JSON array, không có text khác." },
          { role: "user", content: userPromptBase[type] },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const templates = JSON.parse(jsonStr.trim());
      return new Response(JSON.stringify({ templates: Array.isArray(templates) ? templates : [templates] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({
        templates: [],
        raw: content,
        error: "Failed to parse structured response"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI Template Generate error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});