// Ghi chú bằng giọng nói: biên tập bản chép lời thành ghi chú (AI) + ghi âm dài liên tục.
import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';
import { useVoiceInput } from '@/features/ai-coach/voice/speech';

export interface VoiceNoteTask { title: string; dueDate: string | null; priority: 'low' | 'medium' | 'high' }
export interface VoiceNoteDraft { title: string; content: string; tags: string[]; area: string | null; tasks: VoiceNoteTask[]; summary: string; ai: boolean }

/** Tiêu đề dự phòng: câu đầu tiên, tối đa 60 ký tự. */
export function fallbackTitle(text: string) {
  const first = text.trim().split(/(?<=[.!?…])\s+|\n/)[0] ?? '';
  const t = first.length > 60 ? `${first.slice(0, 57).replace(/\s+\S*$/, '')}…` : first;
  return t.replace(/[.!?]+$/, '') || `Ghi chú giọng nói ${format(new Date(), 'dd/MM HH:mm')}`;
}

/** Gọi AI biên tập; AI chưa cấu hình/lỗi → trả nguyên văn (ai=false) kèm `error`. */
export async function structureVoiceNote(transcript: string, opts: { existingTags?: string[]; mode?: 'note' | 'append'; context?: string } = {}): Promise<VoiceNoteDraft & { error?: string }> {
  const raw: VoiceNoteDraft = { title: opts.mode === 'append' ? '' : fallbackTitle(transcript), content: transcript.trim(), tags: [], area: null, tasks: [], summary: '', ai: false };
  try {
    const token = await getAccessToken();
    const r = await fetch(functionUrl('ai-voice-note'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ transcript, existingTags: opts.existingTags ?? [], mode: opts.mode ?? 'note', context: opts.context, today: format(new Date(), 'yyyy-MM-dd') }),
    });
    if (r.status === 503) return { ...raw, error: 'AI chưa được cấu hình — đã lưu nguyên văn lời nói.' };
    if (!r.ok) return { ...raw, error: 'AI không biên tập được — đã giữ nguyên văn lời nói.' };
    const d = (await r.json()) as Partial<VoiceNoteDraft> & { raw?: boolean };
    return {
      title: d.title || raw.title,
      content: d.content || raw.content,
      tags: d.tags ?? [],
      area: d.area ?? null,
      tasks: d.tasks ?? [],
      summary: d.summary ?? '',
      ai: !d.raw,
    };
  } catch {
    return { ...raw, error: 'Mất kết nối AI — đã giữ nguyên văn lời nói.' };
  }
}

/**
 * Ghi âm dài liên tục: Web Speech tự ngắt khi im lặng/hết phiên (~1 phút) nên
 * hook tự nối lại các đoạn cho tới khi người dùng bấm Xong. Có tạm dừng/tiếp tục.
 */
export function useLongDictation({ onError }: { onError?: (m: string) => void } = {}) {
  const [segments, setSegments] = useState<string[]>([]);
  const [active, setActive] = useState(false); // phiên ghi đang mở (kể cả lúc nối đoạn)
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedBase, setElapsedBase] = useState(0);
  const want = useRef(false);
  const done = useRef<((text: string) => void) | null>(null);
  const segRef = useRef<string[]>([]);
  segRef.current = segments;

  const voice = useVoiceInput({
    silenceMs: 6000,
    maxMs: 150_000, // ghi âm dự phòng gửi WAV lên máy chủ — giữ dưới giới hạn 8 MB
    onError: (m) => { want.current = false; setActive(false); onError?.(m); },
    onFinal: (t) => {
      const next = t ? [...segRef.current, t] : segRef.current;
      if (t) setSegments(next);
      if (want.current) { window.setTimeout(() => startRef.current?.(), 80); return; }
      setActive(false);
      if (done.current) { const cb = done.current; done.current = null; cb(next.join(' ').replace(/\s+/g, ' ').trim()); }
    },
  });
  const startRef = useRef<(() => void) | null>(null);
  startRef.current = () => { void voice.start(); };

  const start = useCallback(() => {
    want.current = true; setActive(true); setPaused(false);
    setStartedAt(Date.now());
    startRef.current?.();
  }, []);
  const pause = useCallback(() => {
    want.current = false; setPaused(true);
    if (startedAt) setElapsedBase((b) => b + (Date.now() - startedAt));
    setStartedAt(null);
    voice.stop();
  }, [startedAt, voice]);
  /** Kết thúc, trả toàn bộ văn bản (đợi đoạn cuối chép xong). */
  const finish = useCallback((cb: (text: string) => void) => {
    want.current = false; setPaused(false);
    if (startedAt) setElapsedBase((b) => b + (Date.now() - startedAt));
    setStartedAt(null);
    if (voice.state === 'idle') { setActive(false); cb(segRef.current.join(' ').replace(/\s+/g, ' ').trim()); return; }
    done.current = cb;
    voice.stop();
  }, [startedAt, voice]);
  const reset = useCallback(() => {
    want.current = false; done.current = null; voice.cancel();
    setSegments([]); setActive(false); setPaused(false); setStartedAt(null); setElapsedBase(0);
  }, [voice]);

  // Đồng hồ tổng (cộng dồn qua các lần tạm dừng)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);
  const ms = elapsedBase + (startedAt ? now - startedAt : 0);
  const s = Math.max(0, Math.floor(ms / 1000));
  const elapsed = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const text = [...segments, voice.interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return { text, segments, setSegments, interim: voice.interim, state: voice.state, active, paused, elapsed, start, pause, finish, reset, listening: voice.listening };
}
