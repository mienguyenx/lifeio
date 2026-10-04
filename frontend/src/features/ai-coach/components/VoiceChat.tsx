import { useCallback, useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Mascot } from '@/components/brand/Mascot';
import type { CoachApi } from '../hooks/useCoach';
import { CANCEL_RE, CONFIRM_RE, describeAction, needsConfirm, type AssistantAction } from '../voice/assistant';
import { speak, stopSpeaking, useElapsed, useVoiceInput, voiceSupport } from '../voice/speech';
import { ActionCards } from './ActionCards';

type Phase = 'listening' | 'thinking' | 'speaking' | 'paused' | 'transcribing';
const AUTO_KEY = 'lifeos.voice.autoConfirm';
const SPEAKER_KEY = 'lifeos.voice.speaker';

const STATUS: Record<Phase, string> = {
  listening: 'Đang nghe…',
  transcribing: 'Đang chép lời…',
  thinking: 'Đang suy nghĩ…',
  speaking: 'Đang trả lời…',
  paused: 'Chạm vào micro để nói',
};

const HINTS = [
  '“Nhắc tôi gọi cho mẹ lúc 6 giờ chiều mai”',
  '“Tạo thói quen uống 8 ly nước mỗi ngày”',
  '“Hôm nay tôi đã đi bộ rồi”',
  '“Chi 50 nghìn ăn trưa”',
  '“Gợi ý cách ngủ ngon hơn”',
];

/**
 * Voice Chat (Module 15 — mobile “Voice Chat”): hội thoại rảnh tay với AI Coach.
 * Nghe → gửi (lệnh hoặc câu hỏi) → đọc phản hồi → nghe tiếp. Lệnh tạo dữ liệu
 * hiện thẻ xác nhận; nói “đồng ý”/“hủy” để xác nhận bằng giọng nói.
 */
export function VoiceChat({ api, open, onOpenChange }: { api: CoachApi; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>('paused');
  const [speaker, setSpeaker] = useState(() => localStorage.getItem(SPEAKER_KEY) !== '0');
  const [autoConfirm, setAutoConfirm] = useState(() => localStorage.getItem(AUTO_KEY) === '1');
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');
  const [actionIds, setActionIds] = useState<string[]>([]);
  const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
  const openRef = useRef(open); openRef.current = open;
  const speakerRef = useRef(speaker); speakerRef.current = speaker;
  const empties = useRef(0);
  const sessionStart = useRef<number | null>(null);

  const actions = api.messages.flatMap((m) => (m.actions ?? []) as AssistantAction[]).filter((a) => actionIds.includes(a.id));

  const listenRef = useRef<() => void>(() => {});
  const say = useCallback((text: string, then?: () => void) => {
    setReply(text);
    if (!speakerRef.current || !text) { setPhase('paused'); then?.(); return; }
    setPhase('speaking');
    speak(text.length > 700 ? text.slice(0, 700) : text, { onEnd: () => { if (openRef.current) then?.(); } });
  }, []);
  const thenListen = useCallback(() => { if (openRef.current) listenRef.current(); }, []);

  const handle = useCallback(async (text: string) => {
    if (!openRef.current) return;
    if (!text) {
      empties.current += 1;
      if (empties.current >= 2) { setPhase('paused'); return; }
      listenRef.current(); return;
    }
    empties.current = 0;
    setHeard(text);
    const pending = api.pendingActions().filter((a) => actionIds.includes(a.id));
    if (pending.length && text.split(/\s+/).length <= 6) {
      if (CONFIRM_RE.test(text)) { const done = await api.confirmAll(pending.map((a) => a.id)); say(done.length ? `Xong! ${done.join('. ')}.` : 'Mình chưa lưu được, thử lại nhé.', thenListen); return; }
      if (CANCEL_RE.test(text)) { api.dismissAll(); say('Đã hủy. Bạn cần gì nữa không?', thenListen); return; }
    }
    setPhase('thinking'); setReply('');
    const r = await api.send(text, { voice: true });
    if (!openRef.current) return;
    if (r.actions?.length) {
      setActionIds((ids) => [...ids, ...r.actions!.map((a) => a.id)]);
      const list = r.actions.map((a) => describeAction(a).spoken).join(', ');
      const safe = r.actions.filter((a) => !needsConfirm(a));
      if (autoConfirm && safe.length) {
        const done = await api.confirmAll(safe.map((a) => a.id));
        const risky = r.actions.filter(needsConfirm).map((a) => describeAction(a).spoken).join(', ');
        say(done.length ? `Đã lưu ${safe.map((a) => describeAction(a).spoken).join(', ')}.${risky ? ` Còn ${risky} — nói “đồng ý” để xác nhận.` : ''}` : 'Mình chưa lưu được, thử lại nhé.', thenListen);
      } else {
        say(`Mình sẽ tạo ${list}. Nói “đồng ý” để lưu, hoặc “hủy”.`, thenListen);
      }
      return;
    }
    say(r.reply, thenListen);
  }, [actionIds, api, autoConfirm, say, thenListen]);

  const voice = useVoiceInput({
    onFinal: (t) => { void handle(t); },
    onError: (m) => { toast.error(m); setPhase('paused'); },
  });
  listenRef.current = () => { stopSpeaking(); void voice.start(); };
  useEffect(() => { if (voice.state === 'listening') setPhase('listening'); else if (voice.state === 'transcribing') setPhase('transcribing'); }, [voice.state]);

  // Mở → bắt đầu nghe ngay; đóng → dừng mọi thứ.
  useEffect(() => {
    if (open) {
      sessionStart.current = Date.now(); empties.current = 0; setHeard(''); setReply(''); setActionIds([]);
      const t = window.setTimeout(() => listenRef.current(), 250);
      return () => window.clearTimeout(t);
    }
    voice.cancel(); stopSpeaking(); setPhase('paused');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const elapsed = useElapsed(open ? sessionStart.current : null);
  const busy = phase === 'thinking' || phase === 'transcribing';
  const toggleMic = () => {
    if (phase === 'listening') { voice.stop(); return; }
    if (phase === 'speaking') { stopSpeaking(); }
    if (!busy) listenRef.current();
  };
  const toggleSpeaker = () => { const v = !speaker; setSpeaker(v); localStorage.setItem(SPEAKER_KEY, v ? '1' : '0'); if (!v) stopSpeaking(); };
  const toggleAuto = () => { const v = !autoConfirm; setAutoConfirm(v); localStorage.setItem(AUTO_KEY, v ? '1' : '0'); };
  const support = voiceSupport();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:h-[min(720px,92dvh)] sm:rounded-[32px] overflow-hidden flex flex-col bg-gradient-to-b from-[#EFEBFF] via-[#F7F3FF] to-[#FFF0F6] dark:from-[#1f1a33] dark:via-[#191528] dark:to-[#22172a] shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="w-9" />
            <DialogPrimitive.Title className="text-[16px] font-bold">Voice Chat</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Đóng" className="h-9 w-9 rounded-full grid place-items-center hover:bg-card/70"><X className="h-5 w-5" /></DialogPrimitive.Close>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 flex flex-col items-center">
            <button onClick={toggleMic} aria-label={phase === 'listening' ? 'Dừng nghe' : 'Bắt đầu nói'} className="relative mt-6 mb-4 h-52 w-52 shrink-0 grid place-items-center rounded-full focus:outline-none">
              {phase === 'listening' && <>
                <span className="absolute inset-0 rounded-full bg-primary/15 animate-ping [animation-duration:1.8s]" />
                <span className="absolute inset-4 rounded-full bg-primary/15 animate-ping [animation-duration:1.8s] [animation-delay:.4s]" />
              </>}
              {phase === 'speaking' && <span className="absolute inset-2 rounded-full bg-[#F2557A]/15 animate-pulse" />}
              <span className="absolute inset-6 rounded-full bg-card/90 dark:bg-card shadow-card" />
              <Mascot name="ori" pose={busy ? 'learn' : phase === 'speaking' ? 'idea' : 'default'} size={132} float={phase !== 'paused'} className="relative" />
            </button>

            <p className="text-[17px] font-bold">{STATUS[phase]}</p>
            <p className="text-[13px] tabular-nums text-muted-foreground mt-0.5">{elapsed}</p>
            {busy && <span className="mt-2 flex gap-1">{[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>}

            <div className="w-full mt-5 space-y-3 min-w-0">
              {(voice.interim || heard) && (
                <p className="ml-auto max-w-[88%] w-fit rounded-[20px] rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-[14px] break-words">{voice.interim || heard}</p>
              )}
              {reply && phase !== 'thinking' && (
                <p className="max-w-[92%] w-fit rounded-[20px] rounded-bl-md bg-card border border-border/60 shadow-soft px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">{reply.replace(/[*#`]/g, '')}</p>
              )}
              {!!actions.length && (
                <ActionCards compact actions={actions} onConfirm={(id) => void api.confirmAction(id)} onDismiss={api.dismissAction} onConfirmAll={() => void api.confirmAll(actions.filter((a) => a.status === 'pending').map((a) => a.id))} />
              )}
              {!heard && !voice.interim && !reply && (
                <p className="text-center text-[13px] text-muted-foreground px-4">Thử nói: <span className="italic">{hint}</span></p>
              )}
              {!support.native && !support.recorder && (
                <p className="text-center text-[12.5px] text-destructive px-4">Trình duyệt này chưa hỗ trợ micro. Hãy dùng Chrome, Edge hoặc Safari.</p>
              )}
            </div>
          </div>

          <div className="px-6 pb-5 pt-2">
            <label className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground mb-4 cursor-pointer select-none">
              <input type="checkbox" checked={autoConfirm} onChange={toggleAuto} className="h-3.5 w-3.5 accent-[hsl(var(--primary))]" />
              Tự lưu lệnh không cần xác nhận
            </label>
            <div className="flex items-end justify-around">
              <Ctl label={phase === 'listening' ? 'Dừng' : 'Nói'} onClick={toggleMic} active={phase === 'listening'} disabled={busy}>
                {phase === 'listening' ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Ctl>
              <Ctl label="Kết thúc" onClick={() => onOpenChange(false)} danger><PhoneOff className="h-6 w-6" /></Ctl>
              <Ctl label={speaker ? 'Loa bật' : 'Loa tắt'} onClick={toggleSpeaker} active={speaker}>
                {speaker ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Ctl>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Ctl({ label, onClick, children, danger, active, disabled }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} className="flex flex-col items-center gap-1.5 disabled:opacity-50">
      <span className={cn('grid place-items-center rounded-full shadow-soft transition-colors',
        danger ? 'h-16 w-16 bg-[#F2557A] text-white' : 'h-12 w-12 bg-card text-foreground',
        active && !danger && 'bg-primary text-primary-foreground')}>{children}</span>
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
