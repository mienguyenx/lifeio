// AI + email endpoints under /api/v1/functions/*, replacing the Supabase Edge
// Functions the frontend used via `supabase.functions.invoke(...)`. AI provider
// keys live in the backend environment (server-side proxy).

import { Readable } from 'node:stream';
import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, pool } from '../db';
import { profiles } from '../db/schema';
import {
  buildCoachSystemPrompt,
  type CoachUserContext,
} from '../lib/aiCoachPrompt';
import {
  buildTemplateUserPrompt,
  buildThemeRequest,
  buildTranslatePrompts,
  buildVisionValuesPrompts,
  buildSuggestPrompts,
  TEMPLATE_SYSTEM_PROMPTS,
  TRANSLATE_JSON_TYPES,
  type TranslateParams,
  type SuggestParams,
} from '../lib/aiFunctionDefs';
import {
  buildSseFromText,
  chatCompletion,
  chatCompletionStream,
  parseJsonFromContent,
  resolveGateway,
} from '../lib/aiGateway';
import {
  ASSISTANT_TOOLS,
  buildAssistantSystemPrompt,
  parseAssistantActions,
  type AssistantContext,
} from '../lib/aiAssistantTools';
import {
  AI_FEATURES,
  FEATURE_SETTINGS_KEY,
  fetchProviderModels,
  getFeatureConfig,
  getSystemPrompt,
  invalidateAiConfig,
  listProviders,
  resolveFor,
  type FeatureConf,
} from '../lib/aiConfig';
import { generateEmailHtml, sendEmail } from '../lib/email';
import { badRequest, forbidden } from '../lib/errors';
import {
  VOICE_PROVIDERS,
  checkKeyQuota,
  listVoiceKeys,
  resetKeyHealth,
  saveVoiceSettings,
  synthesize,
  transcribeWithVoiceKeys,
  voiceAvailability,
  voicePool,
  type VoiceProvider,
  type VoiceSettings,
} from '../lib/voiceGateway';

const withExtra = (base: string, extra: string | null) =>
  extra ? `${base}\n\n--- HƯỚNG DẪN BỔ SUNG (Admin) ---\n${extra}` : base;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function lookupUserEmail(userId: string): Promise<{ email: string | null; name: string | null }> {
  const [row] = await db
    .select({ email: profiles.email, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return { email: row?.email ?? null, name: row?.name ?? null };
}

const functionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // ----------------------------- ai-coach -----------------------------
  // Streams SSE for the chat UI; returns JSON when Accept: application/json
  // (used by the admin "test model" button).
  fastify.post<{
    Body: { messages?: ChatMessage[]; userContext?: CoachUserContext; model?: string };
  }>(
    '/functions/ai-coach',
    { schema: { tags: ['ai'], summary: 'AI Life Coach chat (SSE or JSON)', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { messages, userContext, model } = request.body;
      const normalized: ChatMessage[] = (Array.isArray(messages) ? messages : []).map((m) => ({
        role: m.role,
        content: String(m.content ?? ''),
      }));
      if (normalized.length === 0) throw badRequest('Missing messages');

      const systemPrompt = buildCoachSystemPrompt(userContext, await getSystemPrompt('coach.system'));
      const chatMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...normalized];
      const accept = request.headers.accept || '';
      const wantsJson = accept.includes('application/json');
      const useModel = model || undefined; // undefined → model of the resolved gateway (env or Admin API key)

      if (wantsJson) {
        const { content } = await chatCompletion({ messages: chatMessages, model: useModel, feature: 'coach' });
        return reply.send({ response: content, model: useModel || (await resolveGateway('coach')).model });
      }

      const upstream = await chatCompletionStream({ messages: chatMessages, model: useModel, feature: 'coach' });
      reply.header('Content-Type', 'text/event-stream');
      reply.header('Cache-Control', 'no-cache');
      reply.header('Connection', 'keep-alive');
      if (upstream.body) {
        return reply.send(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]));
      }
      // Fallback: no stream body — synthesize SSE from a non-streaming call.
      const { content } = await chatCompletion({ messages: chatMessages, model: useModel, feature: 'coach' });
      return reply.send(buildSseFromText(content));
    },
  );

  // -------------------------- ai-assistant ---------------------------
  // Voice/text commands → proposed actions (create task/habit/goal/journal/
  // note/transaction, complete task/habit). `mode: 'chat'` means no action was
  // detected and the client should answer conversationally via ai-coach.
  fastify.post<{ Body: { text?: string; context?: AssistantContext } }>(
    '/functions/ai-assistant',
    { schema: { tags: ['ai'], summary: 'Natural-language command → proposed actions', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const text = String(request.body?.text ?? '').trim().slice(0, 2000);
      if (!text) throw badRequest('Missing text');
      const ctx = request.body?.context ?? {};
      const { content, raw } = await chatCompletion({
        messages: [
          { role: 'system', content: withExtra(buildAssistantSystemPrompt(ctx, text), await getSystemPrompt('assistant.system')) },
          { role: 'user', content: text },
        ],
        tools: ASSISTANT_TOOLS,
        toolChoice: 'auto',
        temperature: 0.2,
        feature: 'assistant',
      });
      const { actions, issues } = parseAssistantActions(raw.choices?.[0]?.message?.tool_calls, ctx, text);
      // 'unresolved' = có ý định thao tác nhưng không tìm thấy đối tượng (công việc/thói quen…).
      const mode = actions.length ? 'actions' : issues.length ? 'unresolved' : 'chat';
      return reply.send({ mode, actions, issues, message: actions.length ? content || '' : issues.join('. ') });
    },
  );

  // -------------------------- ai-transcribe --------------------------
  // Speech-to-text fallback for browsers without the Web Speech API (Firefox,
  // some in-app/PWA webviews). The client records audio, converts it to 16 kHz
  // mono WAV and sends it base64-encoded; an audio-capable model (Gemini)
  // transcribes it.
  fastify.post<{ Body: { audio?: string; format?: string; language?: string } }>(
    '/functions/ai-transcribe',
    {
      bodyLimit: 8 * 1024 * 1024,
      schema: { tags: ['ai'], summary: 'Transcribe a short voice recording', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const audio = String(request.body?.audio ?? '');
      const format = String(request.body?.format ?? 'wav').toLowerCase();
      if (!audio) throw badRequest('Missing audio');
      if (!['wav', 'mp3'].includes(format)) throw badRequest('Unsupported audio format');
      // Ưu tiên ElevenLabs Scribe / Fish Audio ASR (xoay vòng key) nếu admin đã thêm key.
      const viaVoice = await transcribeWithVoiceKeys(Buffer.from(audio, 'base64'), format, request.body?.language === 'en' ? 'en' : 'vi');
      if (viaVoice) return reply.send({ text: viaVoice.text, provider: viaVoice.provider });
      const lang = request.body?.language === 'en' ? 'English' : 'tiếng Việt';
      const { content } = await chatCompletion({
        temperature: 0,
        feature: 'transcribe',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `Chép lại chính xác lời nói trong đoạn ghi âm (${lang}). Chỉ trả về văn bản đã chép, có dấu câu, không thêm lời giải thích. Nếu không nghe thấy lời nói, trả về chuỗi rỗng.` },
              { type: 'input_audio', input_audio: { data: audio, format } },
            ],
          },
        ],
      });
      return reply.send({ text: content.trim() });
    },
  );

  // --------------------------- ai-voice-note ---------------------------
  // Biến lời nói (bản chép thô) thành ghi chú gọn gàng: tiêu đề, nội dung Markdown,
  // thẻ gợi ý, lĩnh vực và các việc cần làm rút ra từ lời nói.
  fastify.post<{ Body: { transcript?: string; existingTags?: string[]; mode?: 'note' | 'append'; context?: string; today?: string } }>(
    '/functions/ai-voice-note',
    { schema: { tags: ['ai'], summary: 'Turn a voice transcript into a structured note', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const transcript = String(request.body?.transcript ?? '').trim().slice(0, 20000);
      if (!transcript) throw badRequest('Missing transcript');
      const tags = (Array.isArray(request.body?.existingTags) ? request.body.existingTags : []).map(String).slice(0, 60);
      const today = /^\d{4}-\d{2}-\d{2}$/.test(String(request.body?.today)) ? String(request.body?.today) : new Date().toISOString().slice(0, 10);
      const append = request.body?.mode === 'append';
      const AREAS = ['health', 'relationships', 'career', 'finance', 'personal', 'fun', 'environment', 'spirituality', 'learning', 'contribution'];
      const system = [
        'Bạn là trợ lý biên tập ghi chú của LifeOS. Đầu vào là bản chép lời nói tiếng Việt (có thể thiếu dấu câu, lặp từ, từ đệm như "ờ", "à", "ừm", "kiểu như").',
        'Nhiệm vụ: biên tập lại thành ghi chú rõ ràng, GIỮ NGUYÊN ý và thông tin (tên, số, ngày), không bịa thêm, xưng hô như người nói.',
        '- Sửa chính tả/dấu câu, bỏ từ đệm và câu lặp.',
        '- Nội dung dạng Markdown: đoạn ngắn; nếu có nhiều ý thì dùng gạch đầu dòng; nếu dài thì chia mục bằng "## ". Việc cần làm viết dạng "- [ ] ...".',
        append ? '- Chế độ BỔ SUNG: chỉ trả về phần nội dung mới để nối vào cuối ghi chú hiện có, không lặp lại nội dung cũ, title để rỗng.' : '- Tiêu đề ngắn gọn ≤ 60 ký tự, không có dấu chấm cuối.',
        `- Thẻ: tối đa 3 thẻ ngắn, viết thường, không dấu #. Ưu tiên dùng lại thẻ có sẵn: ${tags.length ? tags.join(', ') : '(chưa có)'}.`,
        `- Lĩnh vực (area): một trong ${AREAS.join(', ')} hoặc null.`,
        `- tasks: các việc cần làm người nói nhắc tới (tối đa 8), mỗi việc {"title", "dueDate": "YYYY-MM-DD" hoặc null, "priority": "low"|"medium"|"high"}. Hôm nay là ${today}; quy đổi "mai", "thứ 6 tuần này"... thành ngày cụ thể.`,
        'Chỉ trả về JSON: {"title": string, "content": string, "tags": string[], "area": string|null, "tasks": [...], "summary": string (1 câu tóm tắt)}',
      ].join('\n');
      const user = (request.body?.context && append ? `Ghi chú hiện có (chỉ để tham khảo ngữ cảnh):\n${String(request.body.context).slice(0, 4000)}\n\n` : '') + `Bản chép lời:\n${transcript}`;
      const { content } = await chatCompletion({ temperature: 0.2, feature: 'voice_note', messages: [{ role: 'system', content: withExtra(system, await getSystemPrompt('voice_note.system')) }, { role: 'user', content: user }] });
      const parsed = parseJsonFromContent<Record<string, unknown> | null>(content, null);
      if (!parsed || typeof parsed !== 'object') return reply.send({ title: '', content: transcript, tags: [], area: null, tasks: [], summary: '', raw: true });
      const str = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
      const tasks = (Array.isArray(parsed.tasks) ? parsed.tasks : []).slice(0, 8).flatMap((t) => {
        const o = (t ?? {}) as Record<string, unknown>;
        const title = str(o.title, 200);
        if (!title) return [];
        const due = str(o.dueDate, 10);
        return [{ title, dueDate: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null, priority: ['low', 'medium', 'high'].includes(String(o.priority)) ? String(o.priority) : 'medium' }];
      });
      return reply.send({
        title: append ? '' : str(parsed.title, 80),
        content: str(parsed.content, 30000) || transcript,
        tags: (Array.isArray(parsed.tags) ? parsed.tags : []).map((t) => str(t, 30).replace(/^#/, '').toLowerCase()).filter(Boolean).slice(0, 3),
        area: AREAS.includes(String(parsed.area)) ? String(parsed.area) : null,
        tasks,
        summary: str(parsed.summary, 300),
      });
    },
  );

  // ------------------------- voice (TTS + key pool) -------------------------
  const requireAdmin = async (userId: string) => {
    const { rowCount } = await pool.query(`SELECT 1 FROM "user_roles" WHERE "user_id" = $1 AND "role" = 'admin' LIMIT 1`, [userId]);
    if (!rowCount) throw forbidden('Admin access required');
  };
  const isVoiceProvider = (p: unknown): p is VoiceProvider => VOICE_PROVIDERS.includes(p as VoiceProvider);

  fastify.get('/functions/voice/status', { schema: { tags: ['ai'], summary: 'Server TTS/STT availability', security: [{ bearerAuth: [] }] } }, async () => voiceAvailability());

  // Đọc văn bản thành giọng nói (mp3) bằng ElevenLabs / Fish Audio, tự xoay vòng key.
  fastify.post<{ Body: { text?: string; provider?: string; voice?: string; language?: string; key_id?: string } }>(
    '/functions/tts',
    { schema: { tags: ['ai'], summary: 'Text-to-speech with rotating ElevenLabs / Fish Audio keys', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const text = String(request.body?.text ?? '').trim().slice(0, 2500);
      if (!text) throw badRequest('Missing text');
      const { provider, voice, language, key_id } = request.body ?? {};
      // Chọn provider/key/giọng cụ thể chỉ dành cho admin (nút “Nghe thử”).
      if (provider || key_id || voice) await requireAdmin(request.user!.id);
      if (provider && !isVoiceProvider(provider)) throw badRequest('Unknown voice provider');
      const out = await synthesize({ text, provider: provider as VoiceProvider | undefined, voice: voice ? String(voice).slice(0, 64) : undefined, language: language === 'en' ? 'en' : 'vi', keyId: key_id ? String(key_id) : undefined });
      return reply
        .header('Content-Type', out.contentType)
        .header('Cache-Control', 'no-store')
        .header('X-Voice-Provider', out.provider)
        .header('X-Voice-Key', encodeURIComponent(out.keyName))
        .header('X-Voice-Tried', String(out.tried))
        .header('Access-Control-Expose-Headers', 'X-Voice-Provider, X-Voice-Key, X-Voice-Tried')
        .send(out.audio);
    },
  );

  fastify.get('/functions/voice/pool', { schema: { tags: ['admin'], summary: 'Voice key pool health', security: [{ bearerAuth: [] }] } }, async (request) => {
    await requireAdmin(request.user!.id);
    return voicePool();
  });

  fastify.put<{ Body: Partial<VoiceSettings> }>('/functions/voice/settings', { schema: { tags: ['admin'], summary: 'Save voice settings', security: [{ bearerAuth: [] }] } }, async (request) => {
    await requireAdmin(request.user!.id);
    await saveVoiceSettings(request.body ?? {});
    return voicePool();
  });

  // Kiểm tra hạn mức/tín dụng một key (id) hoặc tất cả key giọng nói.
  fastify.post<{ Body: { id?: string } }>('/functions/voice/check', { schema: { tags: ['admin'], summary: 'Check voice key quota', security: [{ bearerAuth: [] }] } }, async (request) => {
    await requireAdmin(request.user!.id);
    const keys = (await listVoiceKeys()).filter((k) => !request.body?.id || k.id === request.body.id);
    const results = await Promise.all(keys.map(async (k) => ({ id: k.id, ...(await checkKeyQuota(k)) })));
    return { results, pool: await voicePool() };
  });

  fastify.post<{ Body: { id?: string } }>('/functions/voice/reset', { schema: { tags: ['admin'], summary: 'Clear voice key cooldown/errors', security: [{ bearerAuth: [] }] } }, async (request) => {
    await requireAdmin(request.user!.id);
    if (!request.body?.id) throw badRequest('Missing id');
    await resetKeyHealth(request.body.id);
    return voicePool();
  });

  // ----------------------- ai-template-generate -----------------------
  fastify.post<{ Body: { type: string; prompt?: string; category?: string } }>(
    '/functions/ai-template-generate',
    { schema: { tags: ['ai'], summary: 'Generate goal/habit/journal/review templates', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { type, prompt, category } = request.body;
      const systemPrompt = TEMPLATE_SYSTEM_PROMPTS[type];
      if (!systemPrompt) throw badRequest(`Unknown template type: ${type}`);
      const { content } = await chatCompletion({
        feature: 'templates',
        messages: [
          { role: 'system', content: withExtra(systemPrompt, await getSystemPrompt('templates.system')) + '\n\nChỉ trả về JSON array, không có text khác.' },
          { role: 'user', content: buildTemplateUserPrompt(type, category, prompt) },
        ],
      });
      const parsed = parseJsonFromContent<unknown>(content, null);
      if (parsed === null) {
        return reply.send({ templates: [], raw: content, error: 'Failed to parse structured response' });
      }
      return reply.send({ templates: Array.isArray(parsed) ? parsed : [parsed] });
    },
  );

  // ----------------------------- ai-suggest -----------------------------
  fastify.post<{ Body: SuggestParams }>(
    '/functions/ai-suggest',
    { schema: { tags: ['ai'], summary: 'Suggest habits/tasks to improve low life areas', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { systemPrompt, userPrompt } = buildSuggestPrompts(request.body);
      const { content } = await chatCompletion({
        feature: 'suggest',
        messages: [
          { role: 'system', content: withExtra(systemPrompt, await getSystemPrompt('suggest.system')) },
          { role: 'user', content: userPrompt },
        ],
      });
      const parsed = parseJsonFromContent<Record<string, unknown> | null>(content, null);
      if (parsed === null) {
        return reply.send({ habits: [], tasks: [], insights: content, error: 'Failed to parse structured response' });
      }
      return reply.send(parsed);
    },
  );

  // ----------------------- ai-onboarding-analyze -------------------------
  // Bước 1: AI đọc nhu cầu → phân tích (vấn đề, mong muốn, cách giúp) + 1–2 câu hỏi làm rõ.
  fastify.post<{ Body: { text?: string } }>(
    '/functions/ai-onboarding-analyze',
    { schema: { tags: ['ai'], summary: 'Analyze a new user need before planning', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const text = request.body?.text?.trim();
      if (!text) throw badRequest('Missing text');
      const base = `Bạn là LIO — huấn luyện viên cuộc sống của app LifeOS. Người dùng mới vừa kể họ cần gì. Hãy cho thấy bạn THẬT SỰ hiểu họ: phân tích ngắn, ấm áp, cụ thể theo đúng lời họ (không chung chung, không bịa chi tiết). Tiếng Việt, xưng "mình", gọi "bạn".
Chỉ trả về JSON:
{"summary":"1–2 câu phản chiếu lại tình huống của họ, đồng cảm","painPoints":[{"icon":"1 emoji","title":"≤40 ký tự","detail":"≤90 ký tự: vì sao đây là vấn đề / gốc rễ"}],"goals":["≤50 ký tự — điều họ thật sự muốn đạt"],"approach":["≤80 ký tự — bước LIO sẽ giúp, cụ thể"],"questions":[{"id":"q1","question":"≤60 ký tự","options":["≤25 ký tự", "..."]}]}
Quy tắc: 2–3 painPoints, 1–3 goals, đúng 3 approach (bước nhỏ → lớn), 1–2 questions giúp lên kế hoạch sát hơn (VD thời gian rảnh, mức độ thử thách, hạn chót), mỗi câu 3–4 lựa chọn ngắn.`;
      const { content } = await chatCompletion({
        feature: 'onboarding_plan',
        messages: [
          { role: 'system', content: withExtra(base, await getSystemPrompt('onboarding_analyze.system')) },
          { role: 'user', content: text.slice(0, 2000) },
        ],
        temperature: 0.6,
      });
      type A = { summary?: string; painPoints?: Record<string, unknown>[]; goals?: unknown[]; approach?: unknown[]; questions?: Record<string, unknown>[] };
      const a = parseJsonFromContent<A | null>(content, null) ?? {};
      const str = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
      const painPoints = (Array.isArray(a.painPoints) ? a.painPoints : []).map((x) => ({ icon: str(x?.icon, 8) || '•', title: str(x?.title, 60), detail: str(x?.detail, 140) })).filter((x) => x.title).slice(0, 3);
      const goals = (Array.isArray(a.goals) ? a.goals : []).map((g) => str(g, 70)).filter(Boolean).slice(0, 3);
      const approach = (Array.isArray(a.approach) ? a.approach : []).map((g) => str(g, 110)).filter(Boolean).slice(0, 3);
      const questions = (Array.isArray(a.questions) ? a.questions : [])
        .map((q, i) => ({ id: str(q?.id, 10) || `q${i + 1}`, question: str(q?.question, 90), options: (Array.isArray(q?.options) ? q.options : []).map((o) => str(o, 40)).filter(Boolean).slice(0, 4) }))
        .filter((q) => q.question && q.options.length >= 2).slice(0, 2);
      if (!painPoints.length && !a.summary) throw badRequest('AI không trả về phân tích hợp lệ');
      return reply.send({ summary: str(a.summary, 260), painPoints, goals, approach, questions });
    },
  );

  // ------------------------- ai-onboarding-plan --------------------------
  // Người dùng mới kể nhu cầu → AI gợi ý tính năng (module), việc, thói quen, trọng tâm.
  fastify.post<{ Body: { text?: string; areas?: string[]; analysis?: string; answers?: { question?: string; answer?: string }[] } }>(
    '/functions/ai-onboarding-plan',
    { schema: { tags: ['ai'], summary: 'Personalized onboarding plan from user needs', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { text, areas = [], analysis, answers = [] } = request.body ?? {};
      if (!text?.trim()) throw badRequest('Missing text');
      const answered = (Array.isArray(answers) ? answers : []).filter((x) => x?.question && x?.answer).slice(0, 4)
        .map((x) => `- ${String(x.question).slice(0, 90)} → ${String(x.answer).slice(0, 60)}`).join('\n');
      const MODULES: Record<string, string> = {
        calendar: 'Lịch — sự kiện, lịch hẹn, xem lịch tuần',
        goals: 'Mục tiêu — mục tiêu dài hạn, OKR, theo dõi tiến độ',
        journal: 'Nhật ký — viết nhật ký, cảm xúc, biết ơn',
        notes: 'Ghi chú — ghi chú nhanh, ý tưởng, ghi âm',
        health: 'Sức khỏe — ngủ, nước, cân nặng, vận động',
        finance: 'Tài chính — thu chi, ngân sách, tiết kiệm',
        learning: 'Học tập — khoá học, sách, kỹ năng',
        relationships: 'Quan hệ — gia đình, bạn bè, nhắc liên lạc',
        reviews: 'Review — tổng kết tuần/tháng/năm',
        life_areas: 'Bánh xe cuộc sống — cân bằng 10 lĩnh vực',
        insights: 'Tổng quan — thống kê, hành trình, thành tích',
        decisions: 'Nhật ký quyết định — cân nhắc lựa chọn lớn',
        focus: 'Pomodoro — hẹn giờ tập trung',
      };
      const AREAS = ['health', 'relationships', 'career', 'finance', 'personal', 'fun', 'environment', 'spirituality', 'learning', 'contribution'];
      const base = `Bạn là LIO — trợ lý onboarding của app LifeOS (quản lý cuộc sống). Người dùng mới kể họ đang cần gì. Hãy đề xuất một không gian GỌN, đúng nhu cầu, hành động được ngay. Viết tiếng Việt thân thiện, ngắn.
Tính năng luôn có sẵn (KHÔNG đề xuất): Hôm nay, Công việc, Thói quen, AI Coach.
Tính năng có thể bật thêm (id — mô tả):
${Object.entries(MODULES).map(([k, v]) => `- ${k} — ${v}`).join('\n')}
Lĩnh vực (area): ${AREAS.join(', ')}.
Quy tắc: chỉ chọn 1–4 tính năng thật sự liên quan; 3–5 việc cụ thể (bắt đầu bằng động từ, ≤60 ký tự), việc đầu tiên làm được ngay hôm nay trong ≤15 phút; 1–3 thói quen nhỏ, dễ duy trì; target = số lượng MỖI NGÀY: mặc định 1 lần; chỉ >1 khi đếm được trong ngày (VD 8 cốc nước, 20 phút học) — không dùng target cho tần suất tuần. 1 trọng tâm ngắn (≤50 ký tự). Không bịa thông tin người dùng không nói.
Chỉ trả về JSON:
{"summary":"1 câu tóm tắt nhu cầu","focus":"...","modules":[{"id":"finance","reason":"≤60 ký tự"}],"tasks":[{"title":"...","when":"today|tomorrow|week|none","priority":"high|medium|low","area":"career"}],"habits":[{"name":"...","icon":"1 emoji","area":"health","timeOfDay":"morning|afternoon|evening|anytime","target":1,"unit":"lần"}]}`;
      const { content } = await chatCompletion({
        feature: 'onboarding_plan',
        messages: [
          { role: 'system', content: withExtra(base, await getSystemPrompt('onboarding_plan.system')) },
          { role: 'user', content: `Nhu cầu: ${text.trim().slice(0, 2000)}${analysis ? `\nPhân tích đã thống nhất: ${String(analysis).slice(0, 800)}` : ''}${answered ? `\nNgười dùng trả lời thêm (hãy dùng để chọn hạn, giờ, mức độ thói quen):\n${answered}` : ''}${areas.length ? `\nLĩnh vực quan tâm: ${areas.slice(0, 10).join(', ')}` : ''}` },
        ],
        temperature: 0.5,
      });
      type P = { summary?: string; focus?: string; modules?: { id?: string; reason?: string }[]; tasks?: Record<string, unknown>[]; habits?: Record<string, unknown>[] };
      const p = parseJsonFromContent<P | null>(content, null) ?? {};
      const str = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
      const pick = <T extends string>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);
      const area = (v: unknown) => pick(v, AREAS as readonly string[], 'personal');
      const seen = new Set<string>();
      const modules = (Array.isArray(p.modules) ? p.modules : [])
        .map((m) => ({ id: str(m?.id, 30), reason: str(m?.reason, 90) }))
        .filter((m) => MODULES[m.id] && !seen.has(m.id) && seen.add(m.id)).slice(0, 5);
      const tasks = (Array.isArray(p.tasks) ? p.tasks : [])
        .map((t) => ({ title: str(t?.title, 90), when: pick(t?.when, ['today', 'tomorrow', 'week', 'none'] as const, 'today'), priority: pick(t?.priority, ['high', 'medium', 'low'] as const, 'medium'), area: area(t?.area) }))
        .filter((t) => t.title).slice(0, 6);
      const habits = (Array.isArray(p.habits) ? p.habits : [])
        .map((h) => (h && String(h.unit ?? 'lần').trim() === 'lần' && Number(h.target) > 3 ? { ...h, target: 1 } : h))
        .map((h) => ({ name: str(h?.name, 60), icon: str(h?.icon, 8), area: area(h?.area), timeOfDay: pick(h?.timeOfDay, ['morning', 'afternoon', 'evening', 'anytime'] as const, 'anytime'), target: Math.min(Math.max(Math.round(Number(h?.target) || 1), 1), 100), unit: str(h?.unit, 20) || 'lần' }))
        .filter((h) => h.name).slice(0, 4);
      if (!tasks.length && !habits.length && !modules.length) throw badRequest('AI không trả về gợi ý hợp lệ');
      return reply.send({ summary: str(p.summary, 200), focus: str(p.focus, 80), modules, tasks, habits });
    },
  );

  // ----------------------------- ai-translate -----------------------------
  fastify.post<{ Body: { title?: string; description?: string; existing?: string[]; count?: number } }>(
    '/functions/ai-task-breakdown',
    { schema: { tags: ['ai'], summary: 'Break a task into concrete subtasks', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { title, description, existing = [], count = 5 } = request.body ?? {};
      if (!title?.trim()) throw badRequest('Missing title');
      const n = Math.min(Math.max(+count || 5, 2), 10);
      const base = `Bạn là trợ lý năng suất. Chia một công việc thành ${n} bước con cụ thể, hành động được ngay, mỗi bước bắt đầu bằng động từ, tối đa 80 ký tự, đúng ngôn ngữ của tên công việc, theo thứ tự thực hiện. Không lặp lại các bước đã có. Chỉ trả về JSON dạng {"subtasks":["..."]}.`;
      const { content } = await chatCompletion({
        feature: 'task_breakdown',
        messages: [
          { role: 'system', content: withExtra(base, await getSystemPrompt('task_breakdown.system')) },
          { role: 'user', content: `Công việc: ${title.trim()}${description?.trim() ? `\nMô tả: ${description.trim().slice(0, 1000)}` : ''}${existing.length ? `\nĐã có: ${existing.slice(0, 30).join('; ')}` : ''}` },
        ],
        temperature: 0.4,
      });
      const parsed = parseJsonFromContent<{ subtasks?: unknown } | unknown[] | null>(content, null);
      const arr = Array.isArray(parsed) ? parsed : (parsed as { subtasks?: unknown })?.subtasks;
      const subtasks = (Array.isArray(arr) ? arr : [])
        .map((x) => (typeof x === 'string' ? x : (x as { title?: string })?.title ?? '').trim())
        .filter(Boolean).slice(0, n);
      return reply.send({ subtasks });
    },
  );

  fastify.post<{ Body: TranslateParams }>(
    '/functions/ai-translate',
    { schema: { tags: ['ai'], summary: 'Translate / localize content', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const params = request.body;
      const { systemPrompt, userPrompt } = buildTranslatePrompts(params);
      const { content } = await chatCompletion({
        feature: 'translate',
        messages: [
          { role: 'system', content: withExtra(systemPrompt, await getSystemPrompt('translate.system')) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });
      if (TRANSLATE_JSON_TYPES.includes(params.type)) {
        const parsed = parseJsonFromContent<unknown>(content, null);
        return reply.send({ result: parsed ?? content });
      }
      return reply.send({ result: content.trim() });
    },
  );

  // ------------------------ vision-values-suggest ------------------------
  fastify.post<{ Body: { type: string; context?: Record<string, string> } }>(
    '/functions/vision-values-suggest',
    { schema: { tags: ['ai'], summary: 'Suggest life purpose/vision/values/roles', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { type, context } = request.body;
      const { systemPrompt, userPrompt } = buildVisionValuesPrompts(type, context);
      const { content } = await chatCompletion({
        feature: 'vision',
        messages: [
          { role: 'system', content: withExtra(systemPrompt, await getSystemPrompt('vision.system')) },
          { role: 'user', content: userPrompt },
        ],
      });
      const suggestions = parseJsonFromContent<Record<string, unknown>>(content, { suggestions: [] });
      return reply.send(suggestions);
    },
  );

  // ------------------------- ai-theme-suggest -------------------------
  fastify.post<{ Body: { type: string; prompt?: string } }>(
    '/functions/ai-theme-suggest',
    { schema: { tags: ['ai'], summary: 'Suggest color theme palette/ideas', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { type, prompt } = request.body;
      const themeReq = buildThemeRequest(type);
      const { raw } = await chatCompletion({
        feature: 'theme',
        messages: [
          { role: 'system', content: withExtra(themeReq.systemPrompt, await getSystemPrompt('theme.system')) },
          { role: 'user', content: prompt || 'Create a modern, professional theme' },
        ],
        tools: themeReq.tools,
        toolChoice: themeReq.toolChoice,
      });
      const toolCall = raw.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw badRequest('No tool call in AI response');
      }
      const result = parseJsonFromContent<unknown>(toolCall.function.arguments, {});
      return reply.send(result);
    },
  );


  // ------------------------- AI config (admin) -------------------------
  fastify.get('/functions/ai/status', { schema: { tags: ['ai'], summary: 'Is an AI provider configured', security: [{ bearerAuth: [] }] } }, async () => {
    const gw = await resolveFor('coach');
    return { configured: !!gw, provider: gw?.provider ?? null };
  });

  fastify.post<{ Body: { slug?: string; base_url?: string; models_endpoint?: string; api_key?: string } }>(
    '/functions/ai-providers/models',
    { schema: { tags: ['admin'], summary: 'Fetch model list from a provider (server-side)', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      await requireAdmin(request.user!.id);
      const { slug, ...override } = request.body ?? {};
      if (!slug) throw badRequest('slug required');
      invalidateAiConfig();
      try {
        return await fetchProviderModels(slug, override);
      } catch (e) {
        return reply.code(400).send({ error: (e as Error).message });
      }
    },
  );

  fastify.get('/functions/ai-config/features', { schema: { tags: ['admin'], summary: 'Per-feature AI model config', security: [{ bearerAuth: [] }] } }, async (request) => {
    await requireAdmin(request.user!.id);
    invalidateAiConfig();
    const [config, providers] = await Promise.all([getFeatureConfig(), listProviders()]);
    const { rows: keys } = await pool.query<{ provider: string; n: number }>(`SELECT provider, count(*)::int AS n FROM "api_keys" WHERE is_active = true GROUP BY provider`);
    const keyCount = new Map(keys.map((k) => [k.provider, k.n]));
    const effective: Record<string, { provider: string; model: string; source: string } | null> = {};
    for (const key of ['_default', ...AI_FEATURES.map((f) => f.key)]) {
      const gw = await resolveFor(key);
      effective[key] = gw ? { provider: gw.provider, model: gw.model, source: gw.source } : null;
    }
    return {
      features: AI_FEATURES,
      config,
      providers: providers.map((p) => ({ slug: p.slug, name: p.name, defaultModel: p.defaultModel, keys: keyCount.get(p.slug) ?? 0 })),
      effective,
    };
  });

  fastify.put<{ Body: { config?: Record<string, FeatureConf> } }>(
    '/functions/ai-config/features',
    { schema: { tags: ['admin'], summary: 'Save per-feature AI model config', security: [{ bearerAuth: [] }] } },
    async (request) => {
      await requireAdmin(request.user!.id);
      const clean: Record<string, FeatureConf> = {};
      for (const [k, v] of Object.entries(request.body?.config ?? {})) {
        if (!v?.provider) continue;
        const t = v.temperature == null || Number.isNaN(Number(v.temperature)) ? null : Math.min(2, Math.max(0, Number(v.temperature)));
        clean[k] = { provider: String(v.provider), model: v.model ? String(v.model) : undefined, temperature: t };
      }
      await pool.query(
        `INSERT INTO "admin_settings" (key, value, description) VALUES ($1, $2::jsonb, 'Model AI cho từng tính năng')
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [FEATURE_SETTINGS_KEY, JSON.stringify(clean)],
      );
      invalidateAiConfig();
      return { ok: true, config: clean };
    },
  );

  fastify.post<{ Body: { feature?: string } }>(
    '/functions/ai-config/test',
    { schema: { tags: ['admin'], summary: 'Quick test a feature model', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      await requireAdmin(request.user!.id);
      invalidateAiConfig();
      const feature = request.body?.feature || '_default';
      const started = Date.now();
      try {
        const { content } = await chatCompletion({
          feature,
          messages: [{ role: 'user', content: 'Trả lời đúng một câu ngắn bằng tiếng Việt: "Kết nối OK".' }],
        });
        const gw = await resolveFor(feature);
        return { ok: true, reply: content.trim().slice(0, 200), ms: Date.now() - started, provider: gw?.provider, model: gw?.model };
      } catch (e) {
        return reply.code(200).send({ ok: false, error: (e as Error).message, ms: Date.now() - started });
      }
    },
  );

  // ----------------------------- send-email -----------------------------
  fastify.post<{
    Body: {
      action?: string;
      to?: string | string[];
      subject?: string;
      html?: string;
      text?: string;
      userId?: string;
      userIds?: string[];
      template?: string;
      data?: Record<string, unknown>;
    };
  }>(
    '/functions/send-email',
    { schema: { tags: ['email'], summary: 'Send email (admin)', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const body = request.body;
      const action = body.action || 'send';

      switch (action) {
        case 'send': {
          const { to, subject, html, text } = body;
          if (!to || !subject || !html) throw badRequest('Missing required fields: to, subject, html');
          const result = await sendEmail({ to, subject, html, text });
          return reply.code(result.success ? 200 : 500).send(result);
        }
        case 'send-notification': {
          const { userId, subject, template, data } = body;
          if (!userId) throw badRequest('Missing userId');
          const { email, name } = await lookupUserEmail(userId);
          if (!email) return reply.code(404).send({ error: 'User email not found' });
          const html = generateEmailHtml(template || 'notification', { ...data, userName: name || email });
          const result = await sendEmail({ to: email, subject: subject || 'Notification', html });
          return reply.code(result.success ? 200 : 500).send({ ...result, email });
        }
        case 'send-bulk': {
          const { userIds, subject, template, data } = body;
          if (!userIds?.length) throw badRequest('Missing userIds');
          const results: Array<{ userId: string; email: string; success: boolean; message: string }> = [];
          for (const id of userIds) {
            const { email, name } = await lookupUserEmail(id);
            if (!email) continue;
            const html = generateEmailHtml(template || 'notification', { ...data, userName: name || email });
            const r = await sendEmail({ to: email, subject: subject || 'Notification', html });
            results.push({ userId: id, email, success: r.success, message: r.message });
          }
          return reply.send({
            sent: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
          });
        }
        case 'send-password-reset': {
          // Password reset is handled by POST /auth/request-password-reset (Phase 1).
          return reply.code(400).send({
            error: 'send-password-reset is not available; use the auth password-reset endpoint instead.',
          });
        }
        default:
          throw badRequest(`Unknown action: ${action}`);
      }
    },
  );
};

export default functionRoutes;
