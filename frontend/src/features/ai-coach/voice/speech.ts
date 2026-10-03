import { useCallback, useEffect, useRef, useState } from 'react';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';

/* ------------------------------------------------------------------ *
 * Speech-to-text: Web Speech API (Chrome, Edge, Safari) với fallback
 * ghi âm → WAV 16 kHz → backend /functions/ai-transcribe (Firefox, PWA…)
 * ------------------------------------------------------------------ */

type RecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const voiceSupport = () => ({
  native: !!recognitionCtor(),
  recorder: typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined',
  tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
});

export type VoiceState = 'idle' | 'listening' | 'transcribing';

const ERRORS: Record<string, string> = {
  'not-allowed': 'Bạn cần cho phép LifeOS dùng micro (biểu tượng ổ khóa trên thanh địa chỉ).',
  'service-not-allowed': 'Trình duyệt chặn nhận dạng giọng nói. Hãy thử Chrome/Safari hoặc cấp quyền micro.',
  'audio-capture': 'Không tìm thấy micro trên thiết bị.',
  network: 'Mất kết nối tới dịch vụ nhận dạng giọng nói.',
};

/**
 * Nghe một câu nói. `silenceMs` = tự dừng khi im lặng; `maxMs` = giới hạn.
 * onFinal nhận toàn bộ văn bản khi kết thúc (rỗng nếu không nghe thấy gì).
 */
export function useVoiceInput({ lang = 'vi-VN', silenceMs = 1600, maxMs = 60000, keepAlive = false, onFinal, onError }: {
  lang?: string; silenceMs?: number; maxMs?: number;
  /** Nói dài (VD onboarding): trình duyệt tự ngắt thì nghe tiếp, chỉ dừng khi bấm dừng / im lặng lâu / hết giờ. */
  keepAlive?: boolean;
  onFinal: (text: string) => void; onError?: (message: string) => void;
}) {
  const [state, setState] = useState<VoiceState>('idle');
  const [interim, setInterim] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const media = useRef<{ recorder: MediaRecorder; stream: MediaStream; chunks: Blob[] } | null>(null);
  const timers = useRef<{ silence?: number; max?: number }>({});
  const text = useRef('');
  const stopReq = useRef(false);
  const cb = useRef({ onFinal, onError });
  cb.current = { onFinal, onError };

  const clearTimers = () => { window.clearTimeout(timers.current.silence); window.clearTimeout(timers.current.max); };

  const finish = useCallback((value: string) => {
    clearTimers(); rec.current = null; setInterim(''); setStartedAt(null); setState('idle');
    cb.current.onFinal(value.trim());
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    stopReq.current = true;
    if (rec.current) { try { rec.current.stop(); } catch { finish(text.current); } return; }
    if (media.current && media.current.recorder.state !== 'inactive') media.current.recorder.stop();
  }, [finish]);

  const cancel = useCallback(() => {
    clearTimers();
    stopReq.current = true;
    if (rec.current) { rec.current.onend = null; try { rec.current.abort(); } catch { /* noop */ } rec.current = null; }
    if (media.current) { media.current.recorder.onstop = null; try { media.current.recorder.stop(); } catch { /* noop */ } media.current.stream.getTracks().forEach((t) => t.stop()); media.current = null; }
    setInterim(''); setStartedAt(null); setState('idle');
  }, []);

  const startRecorder = useCallback(async () => {
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { cb.current.onError?.(ERRORS['not-allowed']); return; }
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    media.current = { recorder, stream, chunks };
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      media.current = null;
      setState('transcribing');
      try { finish(await transcribe(new Blob(chunks, { type: recorder.mimeType }), lang)); }
      catch (e) { setState('idle'); setStartedAt(null); cb.current.onError?.(e instanceof Error ? e.message : 'Không chép được lời nói.'); }
    };
    recorder.start();
    setState('listening'); setStartedAt(Date.now());
    timers.current.max = window.setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), maxMs);
  }, [finish, lang, maxMs]);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    text.current = ''; setInterim(''); stopReq.current = false;
    const Ctor = recognitionCtor();
    if (!Ctor) {
      if (voiceSupport().recorder) return startRecorder();
      cb.current.onError?.('Trình duyệt này chưa hỗ trợ nhập bằng giọng nói.');
      return;
    }
    const r = new Ctor();
    r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    let committed = ''; // văn bản của các phiên trước (khi trình duyệt tự ngắt và mình nghe tiếp)
    const began = Date.now();
    const hardStop = () => { stopReq.current = true; try { r.stop(); } catch { /* noop */ } };
    const armSilence = () => { window.clearTimeout(timers.current.silence); timers.current.silence = window.setTimeout(hardStop, silenceMs); };
    r.onresult = (e) => {
      // Dựng lại toàn bộ phiên từ results (không cộng dồn) để tránh lặp chữ — Chrome Android hay trả kết quả tích luỹ.
      const parts: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.trim();
        if (!t) continue;
        const prev = parts[parts.length - 1];
        if (prev && t.toLowerCase().startsWith(prev.toLowerCase())) parts[parts.length - 1] = t; else parts.push(t);
      }
      text.current = `${committed} ${parts.join(' ')}`.replace(/\s+/g, ' ').trim();
      setInterim(text.current);
      armSilence();
    };
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if ((e.error === 'not-allowed' || e.error === 'service-not-allowed') && voiceSupport().recorder) {
        // Một số WebView chặn dịch vụ nhận dạng nhưng vẫn cho ghi âm → dùng fallback.
        r.onend = null; rec.current = null; clearTimers(); setState('idle'); void startRecorder(); return;
      }
      cb.current.onError?.(ERRORS[e.error] ?? 'Không nhận dạng được giọng nói, thử lại nhé.');
    };
    r.onend = () => {
      if (keepAlive && !stopReq.current && Date.now() - began < maxMs) {
        committed = text.current;
        try { r.start(); return; } catch { /* rơi xuống kết thúc */ }
      }
      finish(text.current);
    };
    rec.current = r;
    try { r.start(); } catch { rec.current = null; return; }
    setState('listening'); setStartedAt(Date.now());
    armSilence();
    window.clearTimeout(timers.current.silence);
    timers.current.silence = window.setTimeout(hardStop, silenceMs + 4000); // chờ lâu hơn cho câu đầu
    timers.current.max = window.setTimeout(hardStop, maxMs);
  }, [finish, keepAlive, lang, maxMs, silenceMs, startRecorder, state]);

  useEffect(() => () => cancel(), [cancel]);

  return { state, interim, startedAt, start, stop, cancel, listening: state === 'listening' };
}

/** Ghi âm → WAV 16 kHz mono → backend chép lời. */
async function transcribe(blob: Blob, lang: string): Promise<string> {
  const wav = await toWav16k(blob);
  const token = await getAccessToken();
  const resp = await fetch(functionUrl('ai-transcribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ audio: await blobToBase64(wav), format: 'wav', language: lang.startsWith('en') ? 'en' : 'vi' }),
  });
  if (resp.status === 503) throw new Error('AI chưa được cấu hình — thêm API key trong Admin → API Keys.');
  if (!resp.ok) throw new Error('Không chép được lời nói, thử lại nhé.');
  const data = (await resp.json()) as { text?: string };
  return data.text ?? '';
}

async function toWav16k(blob: Blob): Promise<Blob> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  void ctx.close();
  const rate = 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * rate), rate);
  const src = offline.createBufferSource(); src.buffer = decoded; src.connect(offline.destination); src.start();
  const pcm = (await offline.startRendering()).getChannelData(0);
  const buf = new ArrayBuffer(44 + pcm.length * 2); const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) { const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Blob([buf], { type: 'audio/wav' });
}

const blobToBase64 = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(b);
});

/* ------------------------------------------------------------------ *
 * Text-to-speech (đọc phản hồi của AI) — speechSynthesis, giọng vi-VN.
 * ------------------------------------------------------------------ */

export function plainForSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[ xX]\]\s*/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>|~]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined && cachedVoice?.lang.startsWith(lang.slice(0, 2))) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2).toLowerCase();
  const same = voices.filter((v) => v.lang.toLowerCase().startsWith(base));
  cachedVoice = same.find((v) => /natural|online|google|premium|enhanced/i.test(v.name)) ?? same[0] ?? null;
  return cachedVoice;
}

/* ---------------- Giọng đọc máy chủ (ElevenLabs / Fish Audio) ---------------- */

let serverTts: { at: number; on: boolean } | null = null;
/** Máy chủ có key giọng nói khỏe không (cache 2 phút). */
export async function serverTtsAvailable(): Promise<boolean> {
  if (serverTts && Date.now() - serverTts.at < 120_000) return serverTts.on;
  try {
    const token = await getAccessToken();
    const r = await fetch(functionUrl('voice/status'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const d = r.ok ? ((await r.json()) as { tts?: boolean }) : null;
    serverTts = { at: Date.now(), on: !!d?.tts };
  } catch {
    serverTts = { at: Date.now(), on: false };
  }
  return serverTts.on;
}

// Một <audio> dùng chung, "mở khóa" ở lần chạm đầu tiên để iOS/Safari cho phát sau khi tải xong.
let player: HTMLAudioElement | null = null;
/** 50 ms im lặng dạng WAV — dùng để mở khóa phát âm thanh trên iOS. */
function silentWavUrl() {
  const n = 400, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function getPlayer() {
  if (!player && typeof Audio !== 'undefined') player = new Audio();
  return player;
}
if (typeof document !== 'undefined') {
  const unlock = () => {
    const a = getPlayer();
    if (a && !a.src) { a.src = silentWavUrl(); a.play().catch(() => undefined); }
    document.removeEventListener('pointerdown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
}

let speakToken = 0;
let currentUrl: string | null = null;

async function fetchServerTts(text: string, lang: string): Promise<Blob> {
  const token = await getAccessToken();
  const r = await fetch(functionUrl('tts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ text, language: lang.startsWith('en') ? 'en' : 'vi' }),
  });
  if (!r.ok) {
    if (r.status === 503) serverTts = { at: Date.now(), on: false }; // hết key khỏe → dùng giọng trình duyệt
    throw new Error(`tts ${r.status}`);
  }
  return r.blob();
}

function browserSpeak(clean: string, lang: string, rate: number, onEnd?: () => void) {
  if (!voiceSupport().tts) { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  synth.cancel();
  // Chia câu để tránh lỗi Chrome dừng đọc với đoạn dài > ~15s.
  const parts = clean.match(/[^.!?。…\n]+[.!?。…]*/g)?.map((p) => p.trim()).filter(Boolean) ?? [clean];
  const voice = pickVoice(lang);
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = lang; u.rate = rate; if (voice) u.voice = voice;
    if (i === parts.length - 1) { u.onend = () => onEnd?.(); u.onerror = () => onEnd?.(); }
    synth.speak(u);
  });
}

/** Có thể đọc to không (giọng máy chủ hoặc giọng trình duyệt). */
export const canSpeak = () => voiceSupport().tts || !!serverTts?.on || typeof Audio !== 'undefined';

/**
 * Đọc to văn bản: ưu tiên giọng AI của máy chủ (ElevenLabs / Fish Audio, key xoay vòng),
 * lỗi hoặc chưa cấu hình thì dùng speechSynthesis của trình duyệt.
 */
export function speak(text: string, { lang = 'vi-VN', rate = 1.05, onEnd }: { lang?: string; rate?: number; onEnd?: () => void } = {}) {
  stopSpeaking();
  const token = ++speakToken;
  const clean = plainForSpeech(text);
  if (!clean) { onEnd?.(); return; }
  void (async () => {
    if (await serverTtsAvailable()) {
      try {
        const blob = await fetchServerTts(clean.slice(0, 2500), lang);
        if (token !== speakToken) return;
        const a = getPlayer();
        if (!a) throw new Error('no audio');
        const url = URL.createObjectURL(blob);
        currentUrl = url;
        const done = () => {
          a.onended = null; a.onerror = null;
          if (currentUrl === url) { URL.revokeObjectURL(url); currentUrl = null; }
          if (token === speakToken) onEnd?.();
        };
        a.onended = done; a.onerror = done;
        a.src = url;
        await a.play();
        return;
      } catch {
        if (token !== speakToken) return;
      }
    }
    if (token === speakToken) browserSpeak(clean, lang, rate, onEnd);
  })();
}

export function stopSpeaking() {
  speakToken++;
  if (player) { player.onended = null; player.onerror = null; player.pause(); }
  if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null; }
  if (voiceSupport().tts) window.speechSynthesis.cancel();
}

/** Bộ đếm mm:ss từ thời điểm bắt đầu. */
export function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return '00:00';
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
