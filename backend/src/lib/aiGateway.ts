// Thin client for an OpenAI-compatible chat-completions gateway.
// Default target is Gemini's OpenAI-compatible endpoint, but it can be repointed
// (via AI_GATEWAY_URL) to Lovable, OpenAI, or any compatible provider.
//
// Replaces the Supabase Edge Functions that previously called these providers
// directly. AI provider keys now live in the backend environment (server-side),
// so they are never exposed to the browser.

import { env } from '../env';
import { pool } from '../db';
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
}

export class AiNotConfiguredError extends HttpError {
  constructor() {
    super(
      503,
      'AI gateway is not configured. Set AI_GATEWAY_API_KEY (or GEMINI_API_KEY / LOVABLE_API_KEY) in the backend environment.',
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

interface GatewayConfig {
  url: string;
  apiKey: string;
  model: string;
}

/** OpenAI-compatible chat endpoints for providers admins can add under Admin → API Keys. */
const PROVIDER_ENDPOINTS: Record<string, { base: string; model: string }> = {
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  'openai-compatible': { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openrouter: { base: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.5-flash' },
  groq: { base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  together: { base: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  deepseek: { base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  mistral: { base: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
  xai: { base: 'https://api.x.ai/v1', model: 'grok-3-mini' },
  perplexity: { base: 'https://api.perplexity.ai', model: 'sonar' },
};

let cachedDbConfig: { at: number; value: GatewayConfig | null } | null = null;

/**
 * Resolve which gateway to call: the backend environment wins; otherwise fall
 * back to the primary active key an admin saved in the `api_keys` table, so AI
 * can be switched on from the admin UI without redeploying.
 */
export async function resolveGateway(): Promise<GatewayConfig> {
  const envKey = getGatewayApiKey();
  if (envKey) return { url: env.AI_GATEWAY_URL, apiKey: envKey, model: env.AI_MODEL };
  if (cachedDbConfig && Date.now() - cachedDbConfig.at < 30_000) {
    if (cachedDbConfig.value) return cachedDbConfig.value;
    throw new AiNotConfiguredError();
  }
  let value: GatewayConfig | null = null;
  try {
    const { rows } = await pool.query<{ provider: string; api_key: string; metadata: Record<string, string> | null }>(
      `SELECT provider, api_key, metadata FROM "api_keys"
        WHERE is_active = true AND provider = ANY($1)
        ORDER BY is_primary DESC, (provider = 'gemini') DESC, updated_at DESC LIMIT 1`,
      [Object.keys(PROVIDER_ENDPOINTS)],
    );
    const row = rows[0];
    if (row) {
      const def = PROVIDER_ENDPOINTS[row.provider];
      const base = (row.metadata?.base_url || def.base).replace(/\/+$/, '');
      value = {
        url: base.endsWith('/chat/completions') ? base : `${base}/chat/completions`,
        apiKey: row.api_key,
        model: row.metadata?.model || def.model,
      };
    }
  } catch {
    value = null; // table missing or DB error — treat as not configured
  }
  cachedDbConfig = { at: Date.now(), value };
  if (!value) throw new AiNotConfiguredError();
  return value;
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
    return new HttpError(502, 'AI gateway rejected the configured API key.');
  }
  return new HttpError(502, `AI gateway error (${status}): ${bodyText.slice(0, 300)}`);
}

/**
 * Non-streaming chat completion. Returns the assistant message content (and the
 * raw response so callers can read tool_calls when using function calling).
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<{ content: string; raw: OpenAIChatResponse }> {
  const gw = await resolveGateway();

  const body: Record<string, unknown> = {
    model: options.model || gw.model,
    messages: options.messages,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.tools) body.tools = options.tools;
  if (options.toolChoice) body.tool_choice = options.toolChoice;

  const resp = await fetch(gw.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gw.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw mapGatewayError(resp.status, text);
  }

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
  const gw = await resolveGateway();

  const resp = await fetch(gw.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gw.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || gw.model,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw mapGatewayError(resp.status, text);
  }
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
