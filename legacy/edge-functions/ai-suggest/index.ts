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
    const { lowestAreas, type, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `Bạn là một AI Life Coach chuyên giúp người dùng cải thiện cuộc sống. 
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

    let userPrompt = '';

    if (type === 'suggest-improvements') {
      const areaNames: Record<string, string> = {
        health: 'Sức khỏe', emotional: 'Cảm xúc', career: 'Sự nghiệp',
        finance: 'Tài chính', relationships: 'Quan hệ', learning: 'Học tập',
        personal: 'Mục tiêu cá nhân', fun: 'Giải trí', environment: 'Môi trường',
        spirituality: 'Tâm linh', contribution: 'Đóng góp'
      };

      userPrompt = `Dựa trên các mảng cuộc sống có điểm thấp nhất sau:
${lowestAreas.map((a: any) => `- ${areaNames[a.id] || a.name} (${a.id}): ${a.score}/10`).join('\n')}

${userContext?.lifePurpose ? `Mục đích sống của người dùng: ${userContext.lifePurpose}` : ''}
${userContext?.personalValues?.length > 0 ? `Giá trị cốt lõi: ${userContext.personalValues.map((v: any) => v.name).join(', ')}` : ''}

Hãy đề xuất:
1. 2-3 thói quen mới phù hợp để cải thiện các mảng này (frequency: daily hoặc weekly)
2. 2-3 tasks cụ thể có thể làm ngay trong tuần này (priority: high/medium/low)
3. Phân tích ngắn gọn về tình trạng và hướng cải thiện

Lưu ý:
- Thói quen phải đơn giản, dễ thực hiện
- Tasks phải cụ thể, có thể hoàn thành trong 1-2 giờ
- Ưu tiên các hành động nhỏ nhưng đều đặn`;
    }

    console.log("AI Suggest request:", { type, lowestAreas: lowestAreas?.length });

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
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
    
    // Try to parse JSON from response
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const suggestions = JSON.parse(jsonStr.trim());
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback response
      return new Response(JSON.stringify({
        habits: [],
        tasks: [],
        insights: content,
        error: "Failed to parse structured response"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI Suggest error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
