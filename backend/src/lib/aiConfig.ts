// Cấu hình AI do admin quản lý: provider tùy chỉnh (admin_ai_providers), API key
// (api_keys), model cho từng tính năng (admin_settings `ai_feature_models`) và
// thư viện prompt (admin_ai_prompts). Mọi tính năng AI gọi resolveGateway(feature).

import { env } from '../env';
import { pool } from '../db';

export interface AiFeature { key: string; label: string; description: string; promptKey: string; needs?: ('tools' | 'audio' | 'json')[] }

/** Các tính năng AI trong app — admin chọn model riêng cho từng cái. */
export const AI_FEATURES: AiFeature[] = [
  { key: 'coach', label: 'AI Coach (trò chuyện)', description: 'Chat với AI Coach, Voice Chat trả lời câu hỏi', promptKey: 'coach.system' },
  { key: 'assistant', label: 'Trợ lý ra lệnh (giọng nói / chat)', description: 'Hiểu lệnh tạo task, thói quen, mục tiêu, nhật ký, ghi chú, thu chi', promptKey: 'assistant.system', needs: ['tools'] },
  { key: 'voice_note', label: 'Ghi chú giọng nói', description: 'Biên tập lời nói thành ghi chú, thẻ, việc cần làm', promptKey: 'voice_note.system', needs: ['json'] },
  { key: 'transcribe', label: 'Chép lời (dự phòng)', description: 'Chép lời ghi âm khi trình duyệt không hỗ trợ nhận dạng giọng nói', promptKey: 'transcribe.system', needs: ['audio'] },
  { key: 'templates', label: 'Tạo mẫu bằng AI', description: 'Gợi ý mẫu mục tiêu, thói quen, nhật ký, review', promptKey: 'templates.system', needs: ['json'] },
  { key: 'suggest', label: 'Gợi ý cải thiện', description: 'Gợi ý thói quen/việc cho lĩnh vực điểm thấp', promptKey: 'suggest.system', needs: ['json'] },
  { key: 'task_breakdown', label: 'Chia nhỏ công việc', description: 'Tách một công việc thành các mục con (subtask) cụ thể', promptKey: 'task_breakdown.system', needs: ['json'] },
  { key: 'onboarding_plan', label: 'Onboarding cá nhân hoá', description: 'Từ nhu cầu người dùng mới → gợi ý tính năng, việc, thói quen, trọng tâm', promptKey: 'onboarding_plan.system', needs: ['json'] },
  { key: 'translate', label: 'Dịch thuật', description: 'Dịch giao diện / nội dung', promptKey: 'translate.system' },
  { key: 'vision', label: 'Tầm nhìn & giá trị', description: 'Gợi ý tầm nhìn, giá trị sống', promptKey: 'vision.system', needs: ['json'] },
  { key: 'theme', label: 'Gợi ý giao diện', description: 'AI tạo bảng màu/theme', promptKey: 'theme.system', needs: ['tools'] },
];

export interface ProviderConf {
  slug: string; name: string; type: string; base: string; defaultModel: string;
  authType: string; authHeader: string; authPrefix: string; extraHeaders: Record<string, string>;
  modelsEndpoint: string | null; fetchType: string;
}

/** Provider dựng sẵn (dùng khi bảng admin_ai_providers chưa có dòng tương ứng). */
const BUILTIN: Record<string, { name: string; base: string; model: string; type?: string }> = {
  gemini: { name: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', type: 'gemini' },
  'openai-compatible': { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openai: { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.5-flash' },
  groq: { name: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  together: { name: 'Together', base: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  deepseek: { name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  mistral: { name: 'Mistral', base: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
  xai: { name: 'xAI', base: 'https://api.x.ai/v1', model: 'grok-3-mini' },
  perplexity: { name: 'Perplexity', base: 'https://api.perplexity.ai', model: 'sonar' },
  cometapi: { name: 'CometAPI', base: 'https://api.cometapi.com/v1', model: 'gpt-4o-mini' },
};
const NOT_CHAT = new Set(['elevenlabs', 'fish_audio']);

/**
 * Chuẩn hóa base URL kiểu OpenAI: bỏ "/" cuối, bỏ đuôi /chat/completions hoặc /models;
 * nếu chỉ có domain (VD https://api.cometapi.com) thì thêm /v1.
 */
export function normalizeBase(raw: string, type = 'openai-compatible'): string {
  let b = raw.trim().replace(/\/+$/, '').replace(/\/(chat\/completions|models)$/, '');
  if (type === 'gemini' && /generativelanguage\.googleapis\.com$/.test(b)) return `${b}/v1beta/openai`;
  if (type === 'ollama' && !/\/v1$/.test(b)) return `${b}/v1`;
  try {
    const u = new URL(b);
    if (u.pathname === '/' || u.pathname === '') b = `${b}/v1`;
  } catch { /* để nguyên */ }
  return b;
}

interface CacheT { at: number; providers: Map<string, ProviderConf>; features: Record<string, FeatureConf>; prompts: Map<string, string> }
let cache: CacheT | null = null;
export interface FeatureConf { provider?: string; model?: string; temperature?: number | null }
export const FEATURE_SETTINGS_KEY = 'ai_feature_models';

export function invalidateAiConfig() { cache = null; }

let inflight: Promise<CacheT> | null = null;
async function load(): Promise<CacheT> {
  if (cache && Date.now() - cache.at < 30_000) return cache;
  if (!inflight) inflight = doLoad().finally(() => { inflight = null; });
  return inflight;
}

async function doLoad(): Promise<CacheT> {
  let failed = false;
  const providers = new Map<string, ProviderConf>();
  for (const [slug, b] of Object.entries(BUILTIN)) {
    providers.set(slug, { slug, name: b.name, type: b.type ?? 'openai-compatible', base: b.base, defaultModel: b.model, authType: 'bearer', authHeader: 'Authorization', authPrefix: 'Bearer', extraHeaders: {}, modelsEndpoint: '/models', fetchType: 'api' });
  }
  let features: Record<string, FeatureConf> = {};
  const prompts = new Map<string, string>();
  try {
    const { rows } = await pool.query<Record<string, unknown>>(`SELECT * FROM "admin_ai_providers" WHERE is_active = true`);
    for (const r of rows) {
      const slug = String(r.slug);
      const type = String(r.type || 'openai-compatible');
      if (type === 'anthropic' || NOT_CHAT.has(slug)) continue; // chưa hỗ trợ giao thức khác OpenAI
      const builtin = BUILTIN[slug];
      const base = r.base_url ? normalizeBase(String(r.base_url), type) : builtin?.base;
      if (!base) continue;
      providers.set(slug, {
        slug, name: String(r.name || slug), type, base, defaultModel: builtin?.model ?? '',
        // Gemini qua endpoint OpenAI-compatible luôn dùng Bearer
        authType: type === 'gemini' ? 'bearer' : String(r.auth_type || 'bearer'),
        authHeader: type === 'gemini' ? 'Authorization' : String(r.auth_header || 'Authorization'),
        authPrefix: type === 'gemini' ? 'Bearer' : r.auth_prefix == null ? 'Bearer' : String(r.auth_prefix),
        extraHeaders: (r.extra_headers as Record<string, string>) ?? {},
        modelsEndpoint: (r.models_endpoint as string) || null,
        fetchType: String(r.fetch_type || 'api'),
      });
    }
  } catch { failed = true; /* bảng chưa có */ }
  try {
    const { rows } = await pool.query<{ value: Record<string, FeatureConf> }>(`SELECT value FROM "admin_settings" WHERE key = $1`, [FEATURE_SETTINGS_KEY]);
    features = rows[0]?.value ?? {};
  } catch { failed = true; }
  try {
    const { rows } = await pool.query<{ prompt_key: string; system_prompt: string }>(`SELECT prompt_key, system_prompt FROM "admin_ai_prompts" WHERE is_active = true AND category = 'system'`);
    rows.forEach((r) => prompts.set(r.prompt_key, r.system_prompt));
  } catch { /* noop */ }
  // Lỗi đọc DB → chỉ giữ cache 3 giây để thử lại sớm
  const next: CacheT = { at: Date.now() - (failed ? 27_000 : 0), providers, features, prompts };
  cache = next;
  return next;
}

export async function listProviders() { return [...(await load()).providers.values()]; }
export async function getFeatureConfig() { return (await load()).features; }

/** System prompt admin đã sửa trong Thư viện prompt (category = system), nếu có. */
export async function getSystemPrompt(key: string, vars: Record<string, string> = {}): Promise<string | null> {
  const p = (await load()).prompts.get(key);
  if (!p?.trim()) return null;
  return p.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k: string) => vars[k] ?? '');
}

interface KeyRow { id: string; provider: string; api_key: string; metadata: Record<string, string> | null }

async function keyFor(slug: string): Promise<KeyRow | null> {
  const { rows } = await pool.query<KeyRow>(
    `SELECT id, provider, api_key, metadata FROM "api_keys" WHERE is_active = true AND provider = $1
      ORDER BY is_primary DESC, error_count ASC, last_used_at ASC NULLS FIRST LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
}

export interface GatewayConfig {
  url: string; apiKey: string; model: string; headers: Record<string, string>;
  provider: string; keyId: string | null; source: 'feature' | 'env' | 'default-model' | 'any-key'; temperature?: number | null;
}

export function authHeaders(p: Pick<ProviderConf, 'authType' | 'authHeader' | 'authPrefix' | 'extraHeaders'>, key: string): Record<string, string> {
  const h: Record<string, string> = { ...p.extraHeaders };
  if (p.authType === 'none') return h;
  if (p.authType === 'api-key-header') h[p.authHeader || 'x-api-key'] = key;
  else h[p.authHeader || 'Authorization'] = `${p.authPrefix ?? 'Bearer'}${p.authPrefix ? ' ' : ''}${key}`.trim();
  return h;
}

function build(p: ProviderConf, k: KeyRow, model: string | undefined, source: GatewayConfig['source'], temperature?: number | null): GatewayConfig {
  const base = k.metadata?.base_url ? normalizeBase(k.metadata.base_url, p.type) : p.base;
  return {
    url: `${base}/chat/completions`, apiKey: k.api_key, model: model || k.metadata?.model || p.defaultModel,
    headers: authHeaders(p, k.api_key), provider: p.slug, keyId: k.id, source, temperature,
  };
}

/**
 * Chọn provider + model + key cho một tính năng:
 * 1) Model admin gán cho tính năng (hoặc "_default") → 2) biến môi trường →
 * 3) model mặc định trong AI Models → 4) key đầu tiên của provider bất kỳ.
 */
export async function resolveFor(feature?: string): Promise<GatewayConfig | null> {
  const c = await load();
  const tryConf = async (fc: FeatureConf | undefined, source: GatewayConfig['source']) => {
    if (!fc?.provider) return null;
    const p = c.providers.get(fc.provider);
    if (!p) return null;
    const k = await keyFor(p.slug);
    return k ? build(p, k, fc.model, source, fc.temperature) : null;
  };
  const viaFeature = (feature && (await tryConf(c.features[feature], 'feature'))) || (await tryConf(c.features._default, 'feature'));
  if (viaFeature) return viaFeature;

  const envKey = env.AI_GATEWAY_API_KEY || env.GEMINI_API_KEY || env.LOVABLE_API_KEY;
  if (envKey) return { url: env.AI_GATEWAY_URL, apiKey: envKey, model: env.AI_MODEL, headers: { Authorization: `Bearer ${envKey}` }, provider: 'env', keyId: null, source: 'env' };

  try {
    const { rows } = await pool.query<{ provider: string; model_id: string }>(`SELECT provider, model_id FROM "admin_ai_models" WHERE is_active = true ORDER BY is_default DESC, updated_at DESC`);
    for (const m of rows) {
      const r = await tryConf({ provider: m.provider, model: m.model_id }, 'default-model');
      if (r) return r;
    }
  } catch { /* noop */ }

  const { rows } = await pool.query<KeyRow>(
    `SELECT id, provider, api_key, metadata FROM "api_keys" WHERE is_active = true AND provider = ANY($1)
      ORDER BY is_primary DESC, (provider = 'gemini') DESC, updated_at DESC`,
    [[...c.providers.keys()]],
  );
  for (const k of rows) {
    const p = c.providers.get(k.provider);
    if (p && (k.metadata?.model || p.defaultModel)) return build(p, k, undefined, 'any-key');
  }
  return null;
}

/** Ghi nhận lượt dùng / lỗi cho key (không chặn luồng chính). */
export function recordKeyUse(keyId: string | null, error?: string) {
  if (!keyId) return;
  const sql = error
    ? `UPDATE "api_keys" SET error_count = error_count + 1, last_error = $2, last_used_at = now() WHERE id = $1`
    : `UPDATE "api_keys" SET usage_count = usage_count + 1,
         current_usage_today = CASE WHEN last_used_at::date = CURRENT_DATE THEN current_usage_today + 1 ELSE 1 END,
         current_usage_month = CASE WHEN date_trunc('month', last_used_at) = date_trunc('month', now()) THEN current_usage_month + 1 ELSE 1 END,
         last_used_at = now() WHERE id = $1`;
  pool.query(sql, error ? [keyId, error.slice(0, 500)] : [keyId]).catch(() => undefined);
}

/** Lấy danh sách model từ provider (phía máy chủ — không vướng CORS). */
export async function fetchProviderModels(slug: string, override?: { base_url?: string; models_endpoint?: string; api_key?: string }) {
  const c = await load();
  let p = c.providers.get(slug);
  if (!p) {
    // Provider đang tắt vẫn cho lấy model
    const { rows } = await pool.query<Record<string, unknown>>(`SELECT * FROM "admin_ai_providers" WHERE slug = $1`, [slug]);
    const r = rows[0];
    if (!r || !r.base_url) throw new Error('Provider chưa có Base URL');
    const type = String(r.type || 'openai-compatible');
    p = { slug, name: String(r.name), type, base: normalizeBase(String(r.base_url), type), defaultModel: '', authType: String(r.auth_type || 'bearer'), authHeader: String(r.auth_header || 'Authorization'), authPrefix: r.auth_prefix == null ? 'Bearer' : String(r.auth_prefix), extraHeaders: (r.extra_headers as Record<string, string>) ?? {}, modelsEndpoint: (r.models_endpoint as string) || null, fetchType: String(r.fetch_type || 'api') };
  }
  const key = override?.api_key || (await keyFor(slug))?.api_key || '';
  if (!key && p.authType !== 'none') throw new Error('Chưa có API key đang bật cho provider này — thêm ở tab “API key”.');
  const base = override?.base_url ? normalizeBase(override.base_url, p.type) : p.base;
  const headers = p.type === 'gemini' ? { Authorization: `Bearer ${key}` } : authHeaders(p, key);
  const ep = (override?.models_endpoint || p.modelsEndpoint || '/models').trim();
  const candidates = [...new Set([
    /^https?:\/\//.test(ep) ? ep : `${base}${ep.startsWith('/') ? '' : '/'}${ep}`,
    `${base}/models`,
    // base người dùng nhập đã có /v1 + endpoint cũng /v1/models
    `${base.replace(/\/v\d+$/, '')}${ep.startsWith('/') ? '' : '/'}${ep}`,
  ])];
  let lastErr = '';
  for (const url of candidates) {
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
      const text = await r.text();
      if (!r.ok) { lastErr = `HTTP ${r.status} tại ${url}: ${text.slice(0, 160)}`; continue; }
      const data = JSON.parse(text) as { data?: unknown[]; models?: unknown[] } | unknown[];
      const list = (Array.isArray(data) ? data : data.data ?? data.models ?? []) as Record<string, unknown>[];
      if (!Array.isArray(list)) { lastErr = `Không đọc được danh sách model tại ${url}`; continue; }
      return {
        url,
        models: list.map((m) => {
          const id = String(m.id ?? m.name ?? '').replace(/^models\//, '');
          const pricing = m.pricing as Record<string, unknown> | undefined;
          return {
            id, name: String(m.display_name ?? m.displayName ?? m.name ?? id).replace(/^models\//, ''), provider_slug: slug,
            description: typeof m.description === 'string' ? m.description.slice(0, 150) : undefined,
            context_length: Number(m.context_length ?? m.context_window ?? m.inputTokenLimit) || undefined,
            owned_by: m.owned_by ?? undefined,
            pricing: pricing ? { input: Number(pricing.prompt ?? pricing.input ?? 0), output: Number(pricing.completion ?? pricing.output ?? 0) } : undefined,
          };
        }).filter((m) => m.id),
      };
    } catch (e) {
      lastErr = `${url}: ${(e as Error).message}`;
    }
  }
  throw new Error(lastErr || 'Không lấy được model');
}
