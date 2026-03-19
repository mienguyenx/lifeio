import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'purpose':
        systemPrompt = `Bạn là một life coach chuyên nghiệp. Hãy gợi ý MỤC ĐÍCH SỐNG (life purpose statement) cho người dùng.
Trả về JSON với format: { "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }
Mỗi suggestion là một câu ngắn gọn, truyền cảm hứng về mục đích sống (30-50 từ).`;
        userPrompt = context?.bio 
          ? `Dựa trên thông tin: "${context.bio}", hãy gợi ý 3 mục đích sống phù hợp.`
          : `Hãy gợi ý 3 mục đích sống phổ biến và ý nghĩa cho một người đang tìm kiếm hướng đi trong cuộc sống.`;
        break;

      case 'vision':
        systemPrompt = `Bạn là một life coach chuyên nghiệp. Hãy gợi ý TẦM NHÌN CUỘC SỐNG (life vision) cho người dùng.
Trả về JSON với format: { "suggestions": [{"statement": "...", "timeframe": "5-year"}] }
Timeframe có thể là: 1-year, 5-year, 10-year, lifetime.`;
        userPrompt = context?.purpose 
          ? `Dựa trên mục đích sống: "${context.purpose}", hãy gợi ý 3 tầm nhìn cụ thể cho các khung thời gian khác nhau.`
          : `Hãy gợi ý 3 tầm nhìn cuộc sống cho các khung thời gian khác nhau (1 năm, 5 năm, 10 năm).`;
        break;

      case 'values':
        systemPrompt = `Bạn là một life coach chuyên nghiệp. Hãy gợi ý GIÁ TRỊ CỐT LÕI (core values) cho người dùng.
Trả về JSON với format: { "suggestions": [{"name": "Tên giá trị", "description": "Mô tả ngắn", "icon": "emoji"}] }
Emoji phù hợp: 💪 ❤️ 🎯 ⭐ 🔥 💎 🌟 🚀 💡 🎨 📚 🏆 🌱 ⚡ 🎭 🤝 💼 🧘 🏠`;
        userPrompt = context?.purpose 
          ? `Dựa trên mục đích: "${context.purpose}", hãy gợi ý 5 giá trị cốt lõi phù hợp với mô tả và emoji.`
          : `Hãy gợi ý 5 giá trị cốt lõi phổ biến và quan trọng với mô tả và emoji phù hợp.`;
        break;

      case 'roles':
        systemPrompt = `Bạn là một life coach chuyên nghiệp. Hãy gợi ý VAI TRÒ TRONG CUỘC SỐNG (life roles) cho người dùng.
Trả về JSON với format: { "suggestions": [{"name": "Tên vai trò", "description": "Mô tả trách nhiệm", "icon": "emoji"}] }
Emoji phù hợp: 👨‍👩‍👧‍👦 👨‍💼 👨‍🏫 👨‍⚕️ 🧑‍💻 👨‍🎓 🏋️ 🎨 📚 🤝 💼 🏠 ❤️`;
        userPrompt = context?.bio 
          ? `Dựa trên: "${context.bio}", hãy gợi ý 5 vai trò cuộc sống quan trọng với mô tả trách nhiệm.`
          : `Hãy gợi ý 5 vai trò cuộc sống phổ biến (như Con, Cha/Mẹ, Nhân viên, Bạn, ...) với mô tả trách nhiệm.`;
        break;

      case 'traits':
        systemPrompt = `Bạn là một life coach chuyên nghiệp. Hãy gợi ý ĐIỂM MẠNH và ĐIỂM YẾU phổ biến để người dùng tự đánh giá.
Trả về JSON với format: { "strengths": [{"name": "...", "description": "..."}], "weaknesses": [{"name": "...", "description": "..."}] }`;
        userPrompt = `Hãy gợi ý 4 điểm mạnh và 4 điểm yếu phổ biến mà người ta thường có, với mô tả ngắn gọn để người dùng tự nhận diện bản thân.`;
        break;

      case 'milestone':
        systemPrompt = `Bạn là một life coach chuyên nghiệp. Hãy gợi ý CỘT MỐC CUỘC ĐỜI quan trọng để người dùng ghi nhận.
Trả về JSON với format: { "suggestions": [{"title": "...", "description": "...", "area": "career|health|relationships|..."}] }
Area có thể là: health, relationships, career, finance, personal, fun, environment, spirituality, learning, contribution.`;
        userPrompt = `Hãy gợi ý 5 loại cột mốc cuộc đời quan trọng mà mọi người thường ghi nhận, với mô tả và lĩnh vực liên quan.`;
        break;

      default:
        throw new Error(`Unknown suggestion type: ${type}`);
    }

    console.log(`Generating suggestions for type: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch {
      suggestions = { suggestions: [] };
    }

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in vision-values-suggest:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
