import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Provider = 'gemini' | 'perplexity' | 'lovable';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type APIKeyRow = {
  id: string;
  api_key: string;
  name: string;
};

function inferProviderFromModel(model?: string): Provider | undefined {
  if (!model) return undefined;
  const m = model.toLowerCase();
  if (m.startsWith('gemini')) return 'gemini';
  // Perplexity common ids: sonar*, pplx*, llama-3.1-sonar-*
  if (m.startsWith('sonar') || m.startsWith('pplx') || m.includes('sonar') || m.startsWith('llama-')) return 'perplexity';
  // Lovable gateway models often look like provider/model (e.g. google/gemini-2.5-flash)
  if (m.includes('/')) return 'lovable';
  return undefined;
}

function isRetryableProviderError(status: number, bodyText: string): boolean {
  if (status === 429 || status === 402 || status === 403) return true;
  const t = (bodyText || '').toLowerCase();
  return t.includes('rate limit') || t.includes('quota') || t.includes('payment') || t.includes('insufficient');
}

function buildSseFromText(fullText: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  // Chunk a bit for UX (and to match frontend SSE parser)
  const chunkSize = 18;
  let idx = 0;

  return new ReadableStream({
    start(controller) {
      while (idx < fullText.length) {
        const part = fullText.slice(idx, idx + chunkSize);
        idx += chunkSize;
        const payload = {
          choices: [{ delta: { content: part } }],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sseResponse(stream: ReadableStream<Uint8Array>, status = 200): Response {
  return new Response(stream, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, model: requestedModel, provider: requestedProvider } = await req.json();

    // Frontend behavior:
    // - App chat uses fetch + SSE parsing (`data: {...}\n\n`)
    // - Admin panel uses `supabase.functions.invoke()` and expects JSON
    const accept = req.headers.get('accept') || '';
    const wantsJson = accept.includes('application/json');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY'.toLowerCase());
    if (!supabaseUrl || !supabaseAnonKey) {
      // This should exist in Supabase Edge Functions environment; if not, return explicit error
      return jsonResponse({ error: 'Missing SUPABASE_URL/SUPABASE_ANON_KEY in Edge Function environment.' }, 500);
    }

    // Use anon key + SECURITY DEFINER RPCs to fetch keys and track usage/errors
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          // Forward end-user auth (optional). Not required for SECURITY DEFINER RPCs, but harmless.
          Authorization: req.headers.get('authorization') || '',
        },
      },
    });

    const providerFromModel = inferProviderFromModel(requestedModel);
    const preferredProvider: Provider | undefined =
      requestedProvider || providerFromModel;

    const providersToTry: Provider[] = preferredProvider
      ? [preferredProvider, ...(preferredProvider !== 'gemini' ? ['gemini'] as Provider[] : []), ...(preferredProvider !== 'perplexity' ? ['perplexity'] as Provider[] : []), ...(preferredProvider !== 'lovable' ? ['lovable'] as Provider[] : [])]
      : ['gemini', 'perplexity', 'lovable'];

    // Default models per provider (can be overridden by request body `model`)
    const defaultModelByProvider: Record<Provider, string> = {
      gemini: 'gemini-2.5-flash',
      perplexity: 'sonar',
      lovable: 'google/gemini-2.5-flash',
    };

    // Build system prompt with module context
    let systemPrompt = `Bạn là một AI Life Coach thông minh, thân thiện và hữu ích. Bạn giúp người dùng với việc xây dựng thói quen, đặt mục tiêu, quản lý thời gian và phát triển bản thân. Trả lời bằng tiếng Việt, ngắn gọn và thiết thực.

QUAN TRỌNG: Luôn đưa ra gợi ý CỤ THỂ và CÓ THỂ HÀNH ĐỘNG NGAY. Mỗi gợi ý nên bao gồm:
- Hành động cụ thể
- Thời gian thực hiện (nếu có)
- Lợi ích của hành động đó`;

    // Add module-specific context
    if (userContext?.currentModule && userContext?.moduleContextPrompt) {
      systemPrompt += `\n\n🎯 NGỮ CẢNH HIỆN TẠI: ${userContext.moduleContextPrompt}
Hãy tập trung câu trả lời vào module ${userContext.currentModule} mà người dùng đang sử dụng.`;
    }

    if (userContext) {
      systemPrompt += `\n\n--- THÔNG TIN CÁ NHÂN CỦA NGƯỜI DÙNG ---`;
      
      // Life Wheel Scores Analysis
      if (userContext.lifeWheelScores) {
        const scores = userContext.lifeWheelScores;
        const avgScore = Object.values(scores).reduce((a: number, b: any) => a + Number(b), 0) / Object.keys(scores).length;
        
        // Find lowest and highest areas
        const sortedAreas = Object.entries(scores).sort((a: any, b: any) => a[1] - b[1]);
        const lowestAreas = sortedAreas.slice(0, 3);
        const highestAreas = sortedAreas.slice(-3).reverse();
        
        systemPrompt += `\n\n🎯 ĐIỂM LIFE WHEEL (Bánh Xe Cuộc Đời):`;
        systemPrompt += `\nĐiểm trung bình: ${avgScore.toFixed(1)}/10`;
        systemPrompt += `\n\nCác mảng CẦN CẢI THIỆN (điểm thấp nhất):`;
        lowestAreas.forEach(([area, score]: [string, any]) => {
          systemPrompt += `\n- ${area}: ${score}/10`;
        });
        systemPrompt += `\n\nCác mảng ĐANG TỐT (điểm cao nhất):`;
        highestAreas.forEach(([area, score]: [string, any]) => {
          systemPrompt += `\n- ${area}: ${score}/10`;
        });
      }
      
      // Weekly Review insights
      if (userContext.weeklyReview) {
        const review = userContext.weeklyReview;
        systemPrompt += `\n\n📊 WEEKLY REVIEW GẦN NHẤT:`;
        if (review.wins && review.wins.length > 0) {
          systemPrompt += `\nThắng lợi: ${review.wins.join(', ')}`;
        }
        if (review.challenges && review.challenges.length > 0) {
          systemPrompt += `\nThách thức: ${review.challenges.join(', ')}`;
        }
        if (review.lessonsLearned && review.lessonsLearned.length > 0) {
          systemPrompt += `\nBài học: ${review.lessonsLearned.join(', ')}`;
        }
        if (review.nextWeekFocus && review.nextWeekFocus.length > 0) {
          systemPrompt += `\nTrọng tâm tuần tới: ${review.nextWeekFocus.join(', ')}`;
        }
        if (review.overallRating) {
          systemPrompt += `\nĐánh giá tổng: ${review.overallRating}/5`;
        }
      }
      
      // Daily stats
      if (userContext.dailyStats) {
        const stats = userContext.dailyStats;
        systemPrompt += `\n\n📈 THỐNG KÊ HÔM NAY:`;
        systemPrompt += `\n- Thói quen: ${stats.habitsCompleted}/${stats.habitsTotal} hoàn thành`;
        systemPrompt += `\n- Tasks: ${stats.tasksCompleted} hoàn thành, ${stats.tasksPending} đang chờ`;
        if (stats.overdueTasks > 0) {
          systemPrompt += ` (⚠️ ${stats.overdueTasks} quá hạn)`;
        }
        systemPrompt += `\n- Goals: ${stats.activeGoals} đang thực hiện (${stats.avgGoalProgress}% tiến độ TB)`;
        systemPrompt += `\n- Năng lượng: ${stats.energy}/5, Tâm trạng: ${stats.mood}/5`;
      }
      
      if (userContext.lifePurpose) {
        systemPrompt += `\n\n🎯 Mục đích sống: ${userContext.lifePurpose}`;
      }
      
      if (userContext.visions && userContext.visions.length > 0) {
        systemPrompt += `\n\n🔮 Tầm nhìn cuộc sống:\n${userContext.visions.map((v: any) => `- ${v.title}: ${v.description}`).join('\n')}`;
      }
      
      if (userContext.personalValues && userContext.personalValues.length > 0) {
        systemPrompt += `\n\n💎 Giá trị cốt lõi:\n${userContext.personalValues.map((v: any) => `- ${v.name}: ${v.description}`).join('\n')}`;
      }
      
      if (userContext.lifeRoles && userContext.lifeRoles.length > 0) {
        systemPrompt += `\n\n👤 Vai trò trong cuộc sống:\n${userContext.lifeRoles.map((r: any) => `- ${r.name}: ${r.description}`).join('\n')}`;
      }
      
      if (userContext.traits && userContext.traits.length > 0) {
        systemPrompt += `\n\n✨ Đặc điểm cá nhân:\n${userContext.traits.map((t: any) => `- ${t.name} (${t.type}): ${t.description}`).join('\n')}`;
      }
      
      if (userContext.goals && userContext.goals.length > 0) {
        systemPrompt += `\n\n🎯 Mục tiêu hiện tại:\n${userContext.goals.map((g: any) => `- ${g.title} (${g.progress}%) - ${g.area}`).join('\n')}`;
      }
      
      systemPrompt += `\n\n--- HƯỚNG DẪN TƯ VẤN ---
Dựa trên dữ liệu trên, hãy:
1. ƯU TIÊN các mảng cuộc sống có điểm THẤP NHẤT
2. Đề xuất hành động cụ thể để cải thiện các mảng yếu
3. Tận dụng các mảng mạnh để hỗ trợ các mảng yếu
4. Liên kết với mục tiêu và giá trị cốt lõi của người dùng
5. Nếu có tasks quá hạn, nhắc nhở ưu tiên xử lý`;
    }

    const normalizedMessages: ChatMessage[] = (Array.isArray(messages) ? messages : []).map((m: any) => ({
      role: m.role,
      content: String(m.content ?? ''),
    }));

    if (normalizedMessages.length === 0) {
      return jsonResponse({ error: 'Missing messages' }, 400);
    }

    console.log("AI Coach request with context:", userContext ? "yes" : "no");

    // Helper: fetch an available API key for a provider with exclude/rotation
    const getApiKeyForProvider = async (provider: Exclude<Provider, 'lovable'>, excludeId?: string): Promise<APIKeyRow | null> => {
      const { data, error } = await supabase.rpc('get_api_key_for_provider', {
        _provider: provider,
        _exclude_id: excludeId || null,
      });
      if (error) {
        console.error('get_api_key_for_provider error:', error);
        return null;
      }
      // PostgREST returns array for TABLE return type
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return row as APIKeyRow;
    };

    const recordKeyError = async (keyId: string, errorMessage: string) => {
      try {
        await supabase.rpc('record_api_key_error', { _key_id: keyId, _error_message: errorMessage });
      } catch (e) {
        console.warn('record_api_key_error failed:', e);
      }
    };

    const incrementKeyUsage = async (keyId: string) => {
      try {
        await supabase.rpc('increment_api_key_usage', { _key_id: keyId });
      } catch (e) {
        console.warn('increment_api_key_usage failed:', e);
      }
    };

    // Main provider call - returns either { text } or { stream }
    const callProvider = async (provider: Provider, apiKey: string | null, model: string) => {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey || '',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt + "\n\n" + normalizedMessages.map((m) => `${m.role}: ${m.content}`).join("\n\n") },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        });

        const text = await resp.text();
        return { resp, bodyText: text };
      }

      if (provider === 'perplexity') {
        const url = 'https://api.perplexity.ai/chat/completions';
        const body = {
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...normalizedMessages],
          stream: !wantsJson,
        };
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey || ''}`,
          },
          body: JSON.stringify(body),
        });

        if (!wantsJson) {
          // streaming mode: pass-through body
          return { resp, bodyText: '' };
        }

        const text = await resp.text();
        return { resp, bodyText: text };
      }

      // lovable gateway (fallback only). It still needs env key; not managed in admin panel.
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      const url = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      const body = {
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...normalizedMessages],
        stream: !wantsJson,
      };
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableKey || ''}`,
        },
        body: JSON.stringify(body),
      });

      if (!wantsJson) {
        return { resp, bodyText: '' };
      }
      const text = await resp.text();
      return { resp, bodyText: text };
    };

    // Try providers in order; within each provider (gemini/perplexity) rotate keys on retryable errors
    for (const provider of providersToTry) {
      const modelToUse = requestedModel || defaultModelByProvider[provider];
      console.log('Trying provider:', provider, 'model:', modelToUse);

      if (provider === 'lovable') {
        // No admin-panel key rotation for lovable (kept as last-resort fallback)
        const { resp, bodyText } = await callProvider('lovable', null, modelToUse);
        if (!resp.ok) {
          const errText = bodyText || (await resp.text().catch(() => ''));
          console.error('Lovable gateway error:', resp.status, errText);
          continue;
        }

        if (wantsJson) {
          const data = JSON.parse(bodyText || '{}');
          const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.delta?.content ?? data?.response ?? '';
          return jsonResponse({ response: content, provider: 'lovable', model: modelToUse });
        }

        return sseResponse(resp.body!);
      }

      // provider is gemini or perplexity; rotate via DB keys
      let excludeId: string | undefined;
      const tried = new Set<string>();

      while (true) {
        const keyRow = await getApiKeyForProvider(provider, excludeId);
        if (!keyRow) break;
        if (tried.has(keyRow.id)) break;
        tried.add(keyRow.id);

        const { resp, bodyText } = await callProvider(provider, keyRow.api_key, modelToUse);

        if (!resp.ok) {
          const errText = bodyText || (await resp.text().catch(() => ''));
          console.error(`${provider} error:`, resp.status, errText);
          await recordKeyError(keyRow.id, `${resp.status}: ${errText}`);

          if (isRetryableProviderError(resp.status, errText)) {
            excludeId = keyRow.id;
            continue; // try next key for the same provider
          }

          break; // non-retryable -> move to next provider
        }

        // Success
        await incrementKeyUsage(keyRow.id);

        if (provider === 'perplexity') {
          if (wantsJson) {
            const data = JSON.parse(bodyText || '{}');
            const content = data?.choices?.[0]?.message?.content ?? '';
            return jsonResponse({ response: content, provider, model: modelToUse, key: keyRow.name });
          }
          return sseResponse(resp.body!);
        }

        // Gemini returns JSON; convert to SSE for app, or JSON for admin invoke
        const data = JSON.parse(bodyText || '{}');
        const content =
          data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') ?? '';

        if (wantsJson) {
          return jsonResponse({ response: content, provider, model: modelToUse, key: keyRow.name });
        }

        return sseResponse(buildSseFromText(content));
      }
    }

    return jsonResponse({ error: 'No available AI provider/API key. Please add API keys in Admin > API Keys, or configure LOVABLE_API_KEY as fallback.' }, 500);
  } catch (error) {
    console.error("AI Coach error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
