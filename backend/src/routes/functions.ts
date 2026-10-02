// AI + email endpoints under /api/v1/functions/*, replacing the Supabase Edge
// Functions the frontend used via `supabase.functions.invoke(...)`. AI provider
// keys live in the backend environment (server-side proxy).

import { Readable } from 'node:stream';
import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db';
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
import { generateEmailHtml, sendEmail } from '../lib/email';
import { badRequest } from '../lib/errors';

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

      const systemPrompt = buildCoachSystemPrompt(userContext);
      const chatMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...normalized];
      const accept = request.headers.accept || '';
      const wantsJson = accept.includes('application/json');
      const useModel = model || undefined; // undefined → model of the resolved gateway (env or Admin API key)

      if (wantsJson) {
        const { content } = await chatCompletion({ messages: chatMessages, model: useModel });
        return reply.send({ response: content, model: useModel || (await resolveGateway()).model });
      }

      const upstream = await chatCompletionStream({ messages: chatMessages, model: useModel });
      reply.header('Content-Type', 'text/event-stream');
      reply.header('Cache-Control', 'no-cache');
      reply.header('Connection', 'keep-alive');
      if (upstream.body) {
        return reply.send(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]));
      }
      // Fallback: no stream body — synthesize SSE from a non-streaming call.
      const { content } = await chatCompletion({ messages: chatMessages, model: useModel });
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
          { role: 'system', content: buildAssistantSystemPrompt(ctx) },
          { role: 'user', content: text },
        ],
        tools: ASSISTANT_TOOLS,
        toolChoice: 'auto',
        temperature: 0.2,
      });
      const actions = parseAssistantActions(raw.choices?.[0]?.message?.tool_calls, ctx);
      return reply.send({ mode: actions.length ? 'actions' : 'chat', actions, message: actions.length ? content || '' : '' });
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
      const lang = request.body?.language === 'en' ? 'English' : 'tiếng Việt';
      const { content } = await chatCompletion({
        temperature: 0,
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

  // ----------------------- ai-template-generate -----------------------
  fastify.post<{ Body: { type: string; prompt?: string; category?: string } }>(
    '/functions/ai-template-generate',
    { schema: { tags: ['ai'], summary: 'Generate goal/habit/journal/review templates', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { type, prompt, category } = request.body;
      const systemPrompt = TEMPLATE_SYSTEM_PROMPTS[type];
      if (!systemPrompt) throw badRequest(`Unknown template type: ${type}`);
      const { content } = await chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt + '\n\nChỉ trả về JSON array, không có text khác.' },
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
        messages: [
          { role: 'system', content: systemPrompt },
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

  // ----------------------------- ai-translate -----------------------------
  fastify.post<{ Body: TranslateParams }>(
    '/functions/ai-translate',
    { schema: { tags: ['ai'], summary: 'Translate / localize content', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const params = request.body;
      const { systemPrompt, userPrompt } = buildTranslatePrompts(params);
      const { content } = await chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
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
        messages: [
          { role: 'system', content: systemPrompt },
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
        messages: [
          { role: 'system', content: themeReq.systemPrompt },
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
