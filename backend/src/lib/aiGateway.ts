// Thin client for an OpenAI-compatible chat-completions gateway.
// Default target is Gemini's OpenAI-compatible endpoint, but it can be repointed
// (via AI_GATEWAY_URL) to Lovable, OpenAI, or any compatible provider.
//
// Replaces the Supabase Edge Functions that previously called these providers
// directly. AI provider keys now live in the backend environment (server-side),
// so they are never exposed to the browser.

import { env } from '../env';
import { resolveFor, recordKeyUse, type GatewayConfig } from './aiConfig';
import { HttpError } from './errors';

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'input_audio'; input_audio: { data: string; format: string } };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  tools?: unknown[];
  toolChoice?: unknown;
  /** Tính năng gọi AI (coach, assistant, voice_note…) — dùng model admin gán. */
  feature?: string;
}

export class AiNotConfiguredError extends HttpError {
  constructor() {
    super(
      503,
      'AI chưa được cấu hình: thêm provider + API key ở Admin → AI Providers (hoặc đặt AI_GATEWAY_API_KEY trên máy chủ).',
    );
    this.name = 'AiNotConfiguredError';
  }
}

export function getGatewayApiKey(): string | null {
  return env.AI_GATEWAY_API_KEY || env.GEMINI_API_KEY || env.LOVABLE_API_KEY || null;
}

export function isAiConfigured(): boolean {
  return getGatewayApiKey() !== null;
}

export type { GatewayConfig } from './aiConfig';

/**
 * Resolve which gateway to call for a feature (see aiConfig.resolveFor):
 * model admin gán cho tính năng → env → model mặc định → key bất kỳ.
 */
export async function resolveGateway(feature?: string): Promise<GatewayConfig> {
  const gw = await resolveFor(feature);
  if (!gw) throw new AiNotConfiguredError();
  return gw;
}

export function defaultModel(): string {
  return env.AI_MODEL;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;
    };
  }>;
}

/**
 * Translate an upstream gateway HTTP error into an HttpError that mirrors the
 * status codes the frontend already handles (429 rate limit, 402 payment).
 */
function mapGatewayError(status: number, bodyText: string): HttpError {
  if (status === 429) return new HttpError(429, 'Rate limit exceeded. Please try again later.');
  if (status === 402) return new HttpError(402, 'Payment required. Please add AI credits.');
  if (status === 401 || status === 403) {
    return new HttpError(502, `AI provider từ chối API key (${status}): ${bodyText.slice(0, 200)}`);
  }
  if (status === 404) return new HttpError(502, `Model hoặc endpoint không tồn tại (404): ${bodyText.slice(0, 200)}`);
  return new HttpError(502, `AI gateway error (${status}): ${bodyText.slice(0, 300)}`);
}

/**
 * Non-streaming chat completion. Returns the assistant message content (and the
 * raw response so callers can read tool_calls when using function calling).
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<{ content: string; raw: OpenAIChatResponse }> {
  const gw = await resolveGateway(options.feature);

  const body: Record<string, unknown> = {
    model: options.model || gw.model,
    messages: options.messages,
  };
  const temperature = options.temperature ?? gw.temperature ?? undefined;
  if (temperature !== undefined && temperature !== null) body.temperature = temperature;
  if (options.tools) body.tools = options.tools;
  if (options.toolChoice) body.tool_choice = options.toolChoice;

  const resp = await fetch(gw.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...gw.headers },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    recordKeyUse(gw.keyId, `HTTP ${resp.status}: ${text.slice(0, 300)}`);
    throw mapGatewayError(resp.status, text);
  }
  recordKeyUse(gw.keyId);

  const data = (await resp.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content ?? '';
  return { content, raw: data };
}

/**
 * Streaming chat completion. Returns the raw upstream Response so the route can
 * pipe the SSE body straight through to the browser (the frontend already parses
 * `data: {choices:[{delta:{content}}]}` + `data: [DONE]`).
 */
export async function chatCompletionStream(options: ChatCompletionOptions): Promise<Response> {
  const gw = await resolveGateway(options.feature);
  const temperature = options.temperature ?? gw.temperature ?? undefined;

  const resp = await fetch(gw.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...gw.headers },
    body: JSON.stringify({
      model: options.model || gw.model,
      messages: options.messages,
      stream: true,
      ...(temperature !== undefined && temperature !== null ? { temperature } : {}),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    recordKeyUse(gw.keyId, `HTTP ${resp.status}: ${text.slice(0, 300)}`);
    throw mapGatewayError(resp.status, text);
  }
  recordKeyUse(gw.keyId);
  return resp;
}

/**
 * Extract a JSON value from a model response that may wrap it in ```json fences.
 * Returns `fallback` if parsing fails.
 */
export function parseJsonFromContent<T>(content: string, fallback: T): T {
  let jsonStr = content.trim();
  const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonStr = fenced[1].trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return fallback;
  }
}

/**
 * Build SSE chunks (OpenAI delta format) from a complete text. Used to convert a
 * non-streaming provider response into the SSE stream the chat UI expects.
 */
export function buildSseFromText(fullText: string): string {
  const chunkSize = 18;
  let out = '';
  for (let i = 0; i < fullText.length; i += chunkSize) {
    const part = fullText.slice(i, i + chunkSize);
    out += `data: ${JSON.stringify({ choices: [{ delta: { content: part } }] })}\n\n`;
  }
  out += 'data: [DONE]\n\n';
  return out;
}
