// Giọng nói AI: TTS / STT qua ElevenLabs và Fish Audio với XOAY VÒNG NHIỀU API KEY.
//
// Key được admin thêm ở Admin → API Keys (provider `elevenlabs` / `fish_audio`).
// Mỗi lần gọi chọn một key "khỏe" theo chiến lược trong admin_settings
// (`voice_ai`): xoay vòng đều (LRU), ưu tiên key chính, hoặc ít dùng nhất.
// Key lỗi (sai key, hết hạn mức, rate limit, lỗi máy chủ) bị tạm nghỉ
// (cooldown) và hệ thống tự thử key kế tiếp, rồi sang provider còn lại.

import { pool } from '../db';
import { HttpError } from './errors';

export type VoiceProvider = 'elevenlabs' | 'fish_audio';
export const VOICE_PROVIDERS: VoiceProvider[] = ['elevenlabs', 'fish_audio'];
export type Rotation = 'round_robin' | 'primary_first' | 'least_used';

export interface VoiceSettings {
  tts_provider: 'auto' | VoiceProvider | 'browser';
  stt_provider: 'auto' | VoiceProvider | 'gemini';
  rotation: Rotation;
  /** Khi provider được chọn hết key khỏe, thử provider còn lại. */
  fallback_other: boolean;
  elevenlabs: { voice_id: string; model_id: string; stability: number; similarity_boost: number; speed: number };
  fish_audio: { reference_id: string; model: string; speed: number };
  /** Số phút tạm nghỉ khi key bị giới hạn tốc độ (429). */
  rate_limit_cooldown_min: number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  tts_provider: 'auto',
  stt_provider: 'auto',
  rotation: 'round_robin',
  fallback_other: true,
  elevenlabs: { voice_id: 'JBFqnCBsd6RMkjVDRZzb', model_id: 'eleven_flash_v2_5', stability: 0.5, similarity_boost: 0.75, speed: 1 },
  fish_audio: { reference_id: '', model: 's1', speed: 1 },
  rate_limit_cooldown_min: 2,
};

const SETTINGS_KEY = 'voice_ai';
let settingsCache: { at: number; value: VoiceSettings } | null = null;

function mergeSettings(v: Partial<VoiceSettings> | null | undefined): VoiceSettings {
  const d = DEFAULT_VOICE_SETTINGS;
  return {
    ...d,
    ...(v ?? {}),
    elevenlabs: { ...d.elevenlabs, ...(v?.elevenlabs ?? {}) },
    fish_audio: { ...d.fish_audio, ...(v?.fish_audio ?? {}) },
  };
}

export async function getVoiceSettings(): Promise<VoiceSettings> {
  if (settingsCache && Date.now() - settingsCache.at < 30_000) return settingsCache.value;
  let value = DEFAULT_VOICE_SETTINGS;
  try {
    const { rows } = await pool.query<{ value: Partial<VoiceSettings> }>(`SELECT value FROM "admin_settings" WHERE key = $1 LIMIT 1`, [SETTINGS_KEY]);
    value = mergeSettings(rows[0]?.value);
  } catch {
    value = DEFAULT_VOICE_SETTINGS;
  }
  settingsCache = { at: Date.now(), value };
  return value;
}

export async function saveVoiceSettings(input: Partial<VoiceSettings>): Promise<VoiceSettings> {
  const value = sanitizeSettings(input);
  await pool.query(
    `INSERT INTO "admin_settings" (key, value, description) VALUES ($1, $2::jsonb, 'Cấu hình giọng nói AI (ElevenLabs / Fish Audio)')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [SETTINGS_KEY, JSON.stringify(value)],
  );
  settingsCache = { at: Date.now(), value };
  return value;
}

const num = (v: unknown, def: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const oneOf = <T extends string>(v: unknown, list: readonly T[], def: T): T => (list.includes(v as T) ? (v as T) : def);

function sanitizeSettings(v: Partial<VoiceSettings>): VoiceSettings {
  const m = mergeSettings(v);
  return {
    tts_provider: oneOf(m.tts_provider, ['auto', 'elevenlabs', 'fish_audio', 'browser'] as const, 'auto'),
    stt_provider: oneOf(m.stt_provider, ['auto', 'elevenlabs', 'fish_audio', 'gemini'] as const, 'auto'),
    rotation: oneOf(m.rotation, ['round_robin', 'primary_first', 'least_used'] as const, 'round_robin'),
    fallback_other: m.fallback_other !== false,
    elevenlabs: {
      voice_id: String(m.elevenlabs.voice_id || DEFAULT_VOICE_SETTINGS.elevenlabs.voice_id).trim().slice(0, 64),
      model_id: String(m.elevenlabs.model_id || DEFAULT_VOICE_SETTINGS.elevenlabs.model_id).trim().slice(0, 64),
      stability: num(m.elevenlabs.stability, 0.5, 0, 1),
      similarity_boost: num(m.elevenlabs.similarity_boost, 0.75, 0, 1),
      speed: num(m.elevenlabs.speed, 1, 0.7, 1.2),
    },
    fish_audio: {
      reference_id: String(m.fish_audio.reference_id || '').trim().slice(0, 64),
      model: String(m.fish_audio.model || 's1').trim().slice(0, 32),
      speed: num(m.fish_audio.speed, 1, 0.5, 2),
    },
    rate_limit_cooldown_min: num(m.rate_limit_cooldown_min, 2, 0, 1440),
  };
}

/* ------------------------------------------------------------------ *
 * Kho key + xoay vòng
 * ------------------------------------------------------------------ */

export interface VoiceKey {
  id: string;
  provider: VoiceProvider;
  name: string;
  api_key: string;
  is_active: boolean;
  is_primary: boolean;
  usage_count: number;
  today: number;
  month: number;
  limit_per_day: number | null;
  limit_per_month: number | null;
  last_used_at: string | null;
  last_error: string | null;
  error_count: number;
  metadata: Record<string, unknown> | null;
}

const KEY_SELECT = `SELECT id, provider, name, api_key, is_active, is_primary, usage_count, limit_per_day, limit_per_month,
    last_used_at, last_error, error_count, metadata,
    CASE WHEN last_used_at::date = CURRENT_DATE THEN current_usage_today ELSE 0 END AS today,
    CASE WHEN date_trunc('month', last_used_at) = date_trunc('month', now()) THEN current_usage_month ELSE 0 END AS month
  FROM "api_keys"`;

export async function listVoiceKeys(provider?: VoiceProvider, onlyActive = false): Promise<VoiceKey[]> {
  const where: string[] = [`provider = ANY($1)`];
  if (onlyActive) where.push('is_active = true');
  const { rows } = await pool.query<VoiceKey>(`${KEY_SELECT} WHERE ${where.join(' AND ')} ORDER BY created_at`, [provider ? [provider] : VOICE_PROVIDERS]);
  return rows;
}

export function cooldownOf(k: VoiceKey): { until: number; reason: string } | null {
  const until = Date.parse(String(k.metadata?.cooldown_until ?? ''));
  if (!Number.isFinite(until) || until <= Date.now()) return null;
  return { until, reason: String(k.metadata?.cooldown_reason ?? '') };
}

/** Lý do key không dùng được lúc này (null = khỏe). */
export function unavailableReason(k: VoiceKey, chars = 0): string | null {
  if (!k.is_active) return 'Đang tắt';
  const cd = cooldownOf(k);
  if (cd) return cd.reason || 'Đang tạm nghỉ';
  if (k.limit_per_day && k.today >= k.limit_per_day) return 'Hết giới hạn ngày';
  if (k.limit_per_month && k.month >= k.limit_per_month) return 'Hết giới hạn tháng';
  const used = Number(k.metadata?.quota_used);
  const limit = Number(k.metadata?.quota_limit);
  if (Number.isFinite(used) && Number.isFinite(limit) && limit > 0 && used + chars > limit) return 'Hết ký tự trong gói';
  return null;
}

function orderKeys(keys: VoiceKey[], rotation: Rotation): VoiceKey[] {
  const lru = (a: VoiceKey, b: VoiceKey) => (a.last_used_at ? Date.parse(a.last_used_at) : 0) - (b.last_used_at ? Date.parse(b.last_used_at) : 0);
  const sorted = [...keys];
  if (rotation === 'primary_first') sorted.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || lru(a, b));
  else if (rotation === 'least_used') sorted.sort((a, b) => a.today - b.today || a.month - b.month || lru(a, b));
  else sorted.sort((a, b) => lru(a, b) || Number(b.is_primary) - Number(a.is_primary));
  return sorted;
}

/** Key sẽ được dùng ở lượt gọi kế tiếp — để admin xem trước. */
export function nextKey(keys: VoiceKey[], rotation: Rotation): VoiceKey | null {
  return orderKeys(keys.filter((k) => !unavailableReason(k)), rotation)[0] ?? null;
}

// Đảm bảo hai request đồng thời không lấy trùng một key khi xoay vòng.
const inflight = new Map<string, number>();

async function markSuccess(k: VoiceKey, chars: number) {
  await pool.query(
    `UPDATE "api_keys" SET
       usage_count = usage_count + 1,
       current_usage_today = CASE WHEN last_used_at::date = CURRENT_DATE THEN current_usage_today + 1 ELSE 1 END,
       current_usage_month = CASE WHEN date_trunc('month', last_used_at) = date_trunc('month', now()) THEN current_usage_month + 1 ELSE 1 END,
       last_used_at = now(),
       metadata = (COALESCE(metadata, '{}'::jsonb) - 'cooldown_until' - 'cooldown_reason')
         || CASE WHEN $2::int > 0 AND (metadata ? 'quota_used') THEN jsonb_build_object('quota_used', COALESCE((metadata->>'quota_used')::numeric, 0) + $2::int) ELSE '{}'::jsonb END
     WHERE id = $1`,
    [k.id, chars],
  );
}

async function markFailure(k: VoiceKey, message: string, cooldownMs: number, reason: string) {
  const until = cooldownMs > 0 ? new Date(Date.now() + cooldownMs).toISOString() : null;
  await pool.query(
    `UPDATE "api_keys" SET error_count = error_count + 1, last_error = $2, last_used_at = now(),
       metadata = CASE WHEN $3::text IS NULL THEN COALESCE(metadata, '{}'::jsonb)
                  ELSE COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cooldown_until', $3::text, 'cooldown_reason', $4::text) END
     WHERE id = $1`,
    [k.id, message.slice(0, 500), until, reason],
  );
}

export async function resetKeyHealth(id: string) {
  await pool.query(
    `UPDATE "api_keys" SET error_count = 0, last_error = NULL, metadata = COALESCE(metadata, '{}'::jsonb) - 'cooldown_until' - 'cooldown_reason' WHERE id = $1 AND provider = ANY($2)`,
    [id, VOICE_PROVIDERS],
  );
}

/** Lỗi từ provider → có nên đổi key không, và nghỉ bao lâu. */
class ProviderError extends Error {
  constructor(message: string, public status: number, public rotate: boolean, public cooldownMs: number, public reason: string) {
    super(message);
  }
}

/** Rút gọn thông báo lỗi JSON của provider (detail.message / message). */
function errorText(body: string): string {
  try {
    const j = JSON.parse(body) as { detail?: { message?: string; status?: string } | string; message?: string; error?: string };
    const d = typeof j.detail === 'string' ? j.detail : j.detail?.message || j.detail?.status;
    return String(d || j.message || j.error || body).slice(0, 300);
  } catch {
    return body.slice(0, 300);
  }
}

function classify(provider: VoiceProvider, status: number, body: string, rateLimitMin: number): ProviderError {
  const text = errorText(body);
  const low = body.toLowerCase();
  const H = 3600_000;
  if (/quota|credit|insufficient|balance|exceed/.test(low) && status !== 400) return new ProviderError(`${provider} hết hạn mức: ${text}`, status, true, 6 * H, 'Hết hạn mức');
  if (status === 401 || status === 403) return new ProviderError(`${provider} từ chối key (${status}): ${text}`, status, true, 24 * H, 'Key không hợp lệ');
  if (status === 402) return new ProviderError(`${provider} hết tín dụng: ${text}`, status, true, 6 * H, 'Hết tín dụng');
  if (status === 429) return new ProviderError(`${provider} giới hạn tốc độ: ${text}`, status, true, rateLimitMin * 60_000, 'Giới hạn tốc độ');
  if (status >= 500 || status === 0) return new ProviderError(`${provider} lỗi máy chủ (${status}): ${text}`, status, true, 30_000, 'Lỗi máy chủ');
  return new ProviderError(`${provider} lỗi yêu cầu (${status}): ${text}`, status, false, 0, '');
}

export class VoiceNotConfiguredError extends HttpError {
  constructor(what: string) {
    super(503, `${what} chưa được cấu hình — thêm API key ElevenLabs hoặc Fish Audio trong Admin → API Keys.`);
  }
}

/**
 * Chạy `call` với key khỏe theo thứ tự xoay vòng; lỗi đổi-key-được thì đánh dấu
 * key đó tạm nghỉ và thử key kế tiếp. Trả về kết quả + key đã dùng.
 */
async function withRotation<T>(
  providers: VoiceProvider[],
  chars: number,
  call: (k: VoiceKey, provider: VoiceProvider) => Promise<T>,
  opts: { keyId?: string } = {},
): Promise<{ result: T; key: VoiceKey; tried: number }> {
  const settings = await getVoiceSettings();
  const errors: string[] = [];
  let tried = 0;
  let sawKey = false;
  for (const provider of providers) {
    let keys = await listVoiceKeys(provider, true);
    if (opts.keyId) keys = keys.filter((k) => k.id === opts.keyId);
    if (keys.length) sawKey = true;
    const usable = orderKeys(opts.keyId ? keys : keys.filter((k) => !unavailableReason(k, chars)), settings.rotation)
      // key đang được request khác dùng xếp sau cùng
      .sort((a, b) => (inflight.get(a.id) ?? 0) - (inflight.get(b.id) ?? 0));
    for (const k of usable) {
      tried++;
      inflight.set(k.id, (inflight.get(k.id) ?? 0) + 1);
      // Đặt last_used_at ngay để request song song chọn key khác.
      k.last_used_at = new Date().toISOString();
      try {
        const result = await call(k, provider);
        await markSuccess(k, provider === 'elevenlabs' ? chars : 0).catch(() => undefined);
        return { result, key: k, tried };
      } catch (e) {
        const pe = e instanceof ProviderError ? e : new ProviderError(`${provider} không kết nối được: ${(e as Error).message}`, 0, true, 30_000, 'Lỗi kết nối');
        await markFailure(k, pe.message, opts.keyId ? 0 : pe.cooldownMs, pe.reason).catch(() => undefined);
        errors.push(`${k.name}: ${pe.message}`);
        if (!pe.rotate || opts.keyId) throw new HttpError(502, pe.message);
      } finally {
        const n = (inflight.get(k.id) ?? 1) - 1;
        if (n <= 0) inflight.delete(k.id); else inflight.set(k.id, n);
      }
    }
  }
  if (!sawKey) throw new VoiceNotConfiguredError('Giọng nói AI');
  throw new HttpError(503, errors.length ? `Tất cả key giọng nói đều lỗi hoặc hết hạn mức. ${errors.slice(-3).join(' | ')}` : 'Tất cả key giọng nói đang tạm nghỉ hoặc đã hết hạn mức.');
}

function providerOrder(pref: string, fallback: boolean): VoiceProvider[] {
  if (pref === 'elevenlabs' || pref === 'fish_audio') {
    return fallback ? [pref, ...VOICE_PROVIDERS.filter((p) => p !== pref)] : [pref];
  }
  return [...VOICE_PROVIDERS];
}

async function readError(resp: Response) {
  try { return await resp.text(); } catch { return ''; }
}

/* ------------------------------------------------------------------ *
 * TTS
 * ------------------------------------------------------------------ */

export interface TtsOptions {
  text: string;
  provider?: VoiceProvider;
  voice?: string;
  language?: string;
  keyId?: string;
}

export async function synthesize(opts: TtsOptions): Promise<{ audio: Buffer; contentType: string; provider: VoiceProvider; keyName: string; tried: number }> {
  const settings = await getVoiceSettings();
  if (!opts.provider && settings.tts_provider === 'browser') throw new HttpError(503, 'Admin đã chọn dùng giọng đọc của trình duyệt.');
  const order = opts.provider ? [opts.provider] : providerOrder(settings.tts_provider, settings.fallback_other);
  const text = opts.text.trim();
  const { result, key, tried } = await withRotation(order, text.length, async (k, provider) => {
    const meta = (k.metadata ?? {}) as Record<string, string>;
    if (provider === 'elevenlabs') {
      const s = settings.elevenlabs;
      const voice = opts.voice || meta.voice_id || s.voice_id;
      const model = meta.model || s.model_id;
      const body: Record<string, unknown> = {
        text,
        model_id: model,
        voice_settings: { stability: s.stability, similarity_boost: s.similarity_boost, speed: s.speed },
      };
      if (/v2_5|flash|turbo|v3/.test(model) && opts.language) body.language_code = opts.language;
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': k.api_key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45_000),
      });
      if (!resp.ok) throw classify(provider, resp.status, await readError(resp), settings.rate_limit_cooldown_min);
      return { audio: Buffer.from(await resp.arrayBuffer()), contentType: resp.headers.get('content-type') || 'audio/mpeg' };
    }
    const s = settings.fish_audio;
    const ref = opts.voice || meta.voice_id || s.reference_id;
    const resp = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${k.api_key}`, 'Content-Type': 'application/json', model: meta.model || s.model },
      body: JSON.stringify({
        text,
        format: 'mp3',
        mp3_bitrate: 128,
        normalize: true,
        latency: 'normal',
        ...(ref ? { reference_id: ref } : {}),
        ...(s.speed !== 1 ? { prosody: { speed: s.speed } } : {}),
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!resp.ok) throw classify(provider, resp.status, await readError(resp), settings.rate_limit_cooldown_min);
    return { audio: Buffer.from(await resp.arrayBuffer()), contentType: resp.headers.get('content-type') || 'audio/mpeg' };
  }, { keyId: opts.keyId });
  return { ...result, provider: key.provider, keyName: key.name, tried };
}

/* ------------------------------------------------------------------ *
 * STT
 * ------------------------------------------------------------------ */

export async function transcribeWithVoiceKeys(audio: Buffer, format: string, language: string): Promise<{ text: string; provider: VoiceProvider } | null> {
  const settings = await getVoiceSettings();
  if (settings.stt_provider === 'gemini') return null;
  const order = providerOrder(settings.stt_provider, settings.fallback_other);
  const active = (await listVoiceKeys(undefined, true)).filter((k) => order.includes(k.provider));
  if (!active.length) return null;
  const mime = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  try {
    const { result, key } = await withRotation(order, 0, async (k, provider) => {
      const form = new FormData();
      const blob = new Blob([new Uint8Array(audio)], { type: mime });
      if (provider === 'elevenlabs') {
        form.append('model_id', 'scribe_v1');
        form.append('file', blob, `audio.${format}`);
        if (language) form.append('language_code', language);
        const resp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': k.api_key }, body: form, signal: AbortSignal.timeout(45_000) });
        if (!resp.ok) throw classify(provider, resp.status, await readError(resp), settings.rate_limit_cooldown_min);
        const d = (await resp.json()) as { text?: string };
        return String(d.text ?? '');
      }
      form.append('audio', blob, `audio.${format}`);
      if (language) form.append('language', language);
      form.append('ignore_timestamps', 'true');
      const resp = await fetch('https://api.fish.audio/v1/asr', { method: 'POST', headers: { Authorization: `Bearer ${k.api_key}` }, body: form, signal: AbortSignal.timeout(45_000) });
      if (!resp.ok) throw classify(provider, resp.status, await readError(resp), settings.rate_limit_cooldown_min);
      const d = (await resp.json()) as { text?: string };
      return String(d.text ?? '');
    });
    return { text: result.trim(), provider: key.provider };
  } catch (e) {
    if (settings.stt_provider === 'auto') return null; // để Gemini chép lời thay
    throw e;
  }
}

/* ------------------------------------------------------------------ *
 * Kiểm tra hạn mức (admin)
 * ------------------------------------------------------------------ */

export async function checkKeyQuota(k: VoiceKey): Promise<{ ok: boolean; message: string }> {
  let patch: Record<string, unknown> = { quota_checked_at: new Date().toISOString() };
  let ok = false;
  let message = '';
  try {
    if (k.provider === 'elevenlabs') {
      const resp = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': k.api_key }, signal: AbortSignal.timeout(15_000) });
      const body = await readError(resp);
      if (resp.ok) {
        const d = JSON.parse(body) as { character_count?: number; character_limit?: number; next_character_count_reset_unix?: number; tier?: string };
        patch = { ...patch, quota_used: d.character_count ?? 0, quota_limit: d.character_limit ?? 0, quota_unit: 'ký tự', plan: d.tier ?? '', quota_reset_at: d.next_character_count_reset_unix ? new Date(d.next_character_count_reset_unix * 1000).toISOString() : null };
        ok = true;
        message = `Còn ${Math.max(0, (d.character_limit ?? 0) - (d.character_count ?? 0)).toLocaleString('vi-VN')} ký tự`;
      } else if (/missing_permissions/.test(body)) {
        // Key bị giới hạn quyền đọc tài khoản — vẫn có thể dùng TTS.
        ok = true;
        message = 'Key không có quyền xem hạn mức (vẫn dùng được TTS)';
      } else {
        message = classify('elevenlabs', resp.status, body, 2).message;
      }
    } else {
      const resp = await fetch('https://api.fish.audio/wallet/self/api-credit', { headers: { Authorization: `Bearer ${k.api_key}` }, signal: AbortSignal.timeout(15_000) });
      const body = await readError(resp);
      if (resp.ok) {
        const d = JSON.parse(body) as { credit?: string | number };
        const credit = Number(d.credit ?? 0);
        patch = { ...patch, credit, quota_unit: 'USD' };
        ok = credit > 0;
        message = `Tín dụng còn ${credit.toLocaleString('vi-VN', { maximumFractionDigits: 4 })} USD`;
      } else {
        message = classify('fish_audio', resp.status, body, 2).message;
      }
    }
  } catch (e) {
    message = `Không kết nối được: ${(e as Error).message}`;
  }
  patch.quota_message = message;
  await pool.query(
    `UPDATE "api_keys" SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb ${ok ? '' : ', last_error = $3, error_count = error_count + 1'} WHERE id = $1`,
    ok ? [k.id, JSON.stringify(patch)] : [k.id, JSON.stringify(patch), message.slice(0, 500)],
  );
  if (ok) await resetKeyHealth(k.id);
  return { ok, message };
}

/** Ảnh chụp kho key cho trang admin (không trả api_key). */
export async function voicePool() {
  const settings = await getVoiceSettings();
  const keys = await listVoiceKeys();
  const next: Record<string, string | null> = {};
  for (const p of VOICE_PROVIDERS) next[p] = nextKey(keys.filter((k) => k.provider === p), settings.rotation)?.id ?? null;
  return {
    settings,
    next,
    keys: keys.map((k) => {
      const cd = cooldownOf(k);
      const m = (k.metadata ?? {}) as Record<string, unknown>;
      return {
        id: k.id, provider: k.provider, name: k.name, is_active: k.is_active, is_primary: k.is_primary,
        usage_count: k.usage_count, today: k.today, month: k.month, limit_per_day: k.limit_per_day, limit_per_month: k.limit_per_month,
        last_used_at: k.last_used_at, last_error: k.last_error, error_count: k.error_count,
        masked: k.api_key.length > 12 ? `${k.api_key.slice(0, 6)}…${k.api_key.slice(-4)}` : '••••••',
        status: unavailableReason(k) ?? 'ok',
        cooldown_until: cd ? new Date(cd.until).toISOString() : null,
        voice_id: (m.voice_id as string) || null, model: (m.model as string) || null,
        quota: { used: m.quota_used ?? null, limit: m.quota_limit ?? null, credit: m.credit ?? null, unit: m.quota_unit ?? null, plan: m.plan ?? null, reset_at: m.quota_reset_at ?? null, checked_at: m.quota_checked_at ?? null, message: m.quota_message ?? null },
      };
    }),
  };
}

export async function voiceAvailability() {
  const settings = await getVoiceSettings();
  const keys = await listVoiceKeys(undefined, true);
  const healthy = keys.filter((k) => !unavailableReason(k));
  const tts = settings.tts_provider !== 'browser' && providerOrder(settings.tts_provider, settings.fallback_other).some((p) => healthy.some((k) => k.provider === p));
  return { tts, stt: settings.stt_provider !== 'gemini' && healthy.length > 0, providers: [...new Set(healthy.map((k) => k.provider))] };
}
