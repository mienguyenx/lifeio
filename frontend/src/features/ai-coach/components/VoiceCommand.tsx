import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AudioLines, Check, Mic, RotateCcw, Square, Volume2, VolumeX, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Surface, TINTS } from '@/components/lio';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { askAssistant, describeAction, needsConfirm, useExecuteAction, type AssistantAction } from '../voice/assistant';
import { speak, stopSpeaking, useVoiceInput, voiceSupport } from '../voice/speech';
import { useCoach } from '../hooks/useCoach';
import { openVoiceChat } from './GlobalVoiceChat';

const OPEN = 'lifeos:voice-command';
const RELEASE = 'lifeos:voice-command-release';

/** Mở lệnh giọng nói. `hold` = nhấn giữ để nói (thả tay → gửi). */
export const openVoiceCommand = (opts: { hold?: boolean } = {}) => window.dispatchEvent(new CustomEvent(OPEN, { detail: opts }));
/** Thả nút nhấn-giữ → dừng nghe và gửi. */
export const releaseVoiceCommand = () => window.dispatchEvent(new Event(RELEASE));

type Phase = 'listening' | 'thinking' | 'result' | 'chat' | 'error';
const SPEAKER_KEY = 'lifeos.voice.speaker';
const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { status: 408 })), ms))]);
type Row = AssistantAction & { message?: string; undo?: () => Promise<void>; view?: string };

const EXAMPLES = ['“Dời việc nộp báo cáo sang thứ 6”', '“Uống 2 ly nước”', '“Chi 45 nghìn ăn trưa”', '“Bắt đầu tập trung 25 phút”', '“Nhắc tôi gọi mẹ 8 giờ tối mai”', '“Tối qua ngủ 7 tiếng”'];

/**
 * Lệnh giọng nói nhanh (push-to-talk) dùng ở mọi trang: nói → AI hiểu → thực
 * hiện ngay các lệnh an toàn kèm “Hoàn tác”; lệnh rủi ro (xoá, số tiền lớn,
 * khớp tên không chắc) chờ xác nhận. Gắn một lần trong AppLayout.
 */
export function GlobalVoiceCommand() {
  const [open, setOpen] = useState(false);
  const [hold, setHold] = useState(false);
  const [session, setSession] = useState(0);
  useEffect(() => {
    const on = (e: Event) => { setHold(!!(e as CustomEvent<{ hold?: boolean }>).detail?.hold); setOpen(true); setSession((n) => n + 1); };
    const key = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) { e.preventDefault(); setHold(false); setOpen(true); setSession((n) => n + 1); }
    };
    window.addEventListener(OPEN, on);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener(OPEN, on); window.removeEventListener('keydown', key); };
  }, []);
  // Portal ra body: header desktop có backdrop-blur (tạo containing block cho position:fixed).
  return open ? createPortal(<VoiceCommandPanel session={session} hold={hold} onClose={() => setOpen(false)} />, document.body) : null;
}

function VoiceCommandPanel({ session, hold, onClose }: { session: number; hold: boolean; onClose: () => void }) {
  const exec = useExecuteAction();
  const coach = useCoach();
  const navigate = useNavigate();
  /** Mỗi lượt nghe chỉ gửi một lần (trình duyệt có thể báo kết thúc hai lần → tạo trùng). */
  const sent = useRef(false);
  const [phase, setPhase] = useState<Phase>('listening');
  const [reply, setReply] = useState('');
  const [speaker, setSpeaker] = useState(() => localStorage.getItem(SPEAKER_KEY) !== '0');
  const speakerRef = useRef(speaker); speakerRef.current = speaker;
  const say = (t: string) => { setReply(t); if (speakerRef.current && t) speak(t.length > 600 ? t.slice(0, 600) : t); };
  const [heard, setHeard] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [example] = useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);
  const released = useRef(false);
  const touched = useRef(false);
  const rowsRef = useRef<Row[]>([]); rowsRef.current = rows;

  const patch = (id: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const run = useCallback(async (a: Row): Promise<string> => {
    try {
      const r = await exec(a);
      patch(a.id, { status: 'done', message: r.message, undo: r.undo, view: r.view });
      return r.message;
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Không thực hiện được';
      patch(a.id, { status: 'failed', message: m });
      return `Lỗi: ${m}`;
    }
  }, [exec]);

  const handle = useCallback(async (text: string) => {
    if (sent.current) return;
    sent.current = true;
    if (!text) { setPhase('error'); setNote('Mình chưa nghe thấy gì. Giữ nút lâu hơn một chút, nói xong rồi mới thả tay nhé.'); return; }
    setHeard(text); setPhase('thinking'); setReply('');
    try {
      const r = await withTimeout(askAssistant(text), 25000);
      if (r.mode === 'actions' && r.actions.length) {
        const list: Row[] = r.actions;
        setRows(list); setPhase('result');
        const done: string[] = [];
        for (const a of list) if (!needsConfirm(a)) done.push(await run(a));
        const waiting = list.length - done.length;
        say([done.join('. '), waiting ? `${waiting === 1 ? 'Còn 1 lệnh' : `Còn ${waiting} lệnh`} cần bạn bấm Lưu để xác nhận` : ''].filter(Boolean).join('. ') + '.');
        return;
      }
      if (r.mode === 'unresolved') { setPhase('error'); setNote(`${r.message}. Thử nói rõ tên hơn nhé.`); say(`${r.message}.`); return; }
      // Không phải lệnh → hỏi AI Coach và đọc câu trả lời luôn.
      setPhase('chat');
      const c = await withTimeout(coach.send(text, { voice: true }), 45000);
      say(c.reply || 'Mình chưa có câu trả lời, thử hỏi lại nhé.');
    } catch (e) {
      const st = (e as { status?: number }).status;
      setPhase('error');
      setNote(st === 503 ? 'AI chưa được cấu hình (Admin → AI Providers).' : st === 408 ? 'Trợ lý phản hồi quá lâu, thử lại nhé.' : st ? `Trợ lý báo lỗi (${st}), thử lại nhé.` : 'Không kết nối được trợ lý, kiểm tra mạng rồi thử lại nhé.');
    }
  }, [run, coach]); // eslint-disable-line react-hooks/exhaustive-deps

  const voice = useVoiceInput({
    silenceMs: hold ? 20000 : 1500,
    keepAlive: hold,
    onFinal: (t) => { void handle(t); },
    onError: (m) => { setPhase('error'); setNote(m); },
  });

  // Mỗi lần mở (hoặc nhấn giữ lại) → nghe mới.
  useEffect(() => {
    released.current = false; touched.current = false; sent.current = false;
    setRows([]); setHeard(''); setNote(''); setReply(''); setPhase('listening');
    stopSpeaking();
    voice.cancel();
    const t = window.setTimeout(() => { void voice.start(); }, 60);
    return () => window.clearTimeout(t);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thả nút nhấn-giữ → gửi (kể cả khi thả trước lúc micro kịp bật).
  useEffect(() => {
    const on = () => { released.current = true; if (voice.state === 'listening') voice.stop(); };
    window.addEventListener(RELEASE, on);
    return () => window.removeEventListener(RELEASE, on);
  }, [voice]);
  useEffect(() => { if (hold && released.current && voice.state === 'listening') voice.stop(); }, [hold, voice, voice.state]);

  const close = useCallback(() => {
    voice.cancel(); stopSpeaking();
    const undoable = rowsRef.current.filter((r) => r.status === 'done' && r.undo);
    if (undoable.length) {
      toast.success(undoable.length === 1 ? undoable[0].message! : `Đã thực hiện ${undoable.length} lệnh`, {
        action: { label: 'Hoàn tác', onClick: () => { void Promise.all(undoable.map((r) => r.undo!())).then(() => toast('Đã hoàn tác')); } },
      });
    }
    onClose();
  }, [onClose, voice]);

  // Xong hết & không cần xác nhận → tự đóng sau vài giây (trừ khi người dùng chạm vào).
  const settled = phase === 'result' && rows.length > 0 && rows.every((r) => r.status !== 'pending');
  useEffect(() => {
    if (!settled) return;
    const t = window.setTimeout(() => { if (!touched.current) close(); }, 9000);
    return () => window.clearTimeout(t);
  }, [settled, close]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [close]);

  const again = () => { touched.current = true; sent.current = false; stopSpeaking(); setRows([]); setHeard(''); setNote(''); setReply(''); setPhase('listening'); void voice.start(); };
  const toggleSpeaker = () => { const v = !speaker; setSpeaker(v); localStorage.setItem(SPEAKER_KEY, v ? '1' : '0'); if (!v) stopSpeaking(); };
  const undo = async (r: Row) => { touched.current = true; if (!r.undo) return; await r.undo(); patch(r.id, { status: 'undone' }); };
  const listening = phase === 'listening';
  const support = voiceSupport();

  return (
    <div className="fixed z-[60] inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] md:inset-x-0 md:bottom-8 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full md:w-[420px] animate-in fade-in-0 slide-in-from-bottom-4"
        onPointerDown={() => { touched.current = true; }} role="dialog" aria-label="Lệnh giọng nói">
        <Surface className="p-3.5 shadow-2xl border-border/80">
          <div className="flex items-start gap-3">
            <button onClick={listening ? () => voice.stop() : again} aria-label={listening ? 'Dừng nghe' : 'Nói lại'}
              className={cn('relative h-12 w-12 shrink-0 rounded-full grid place-items-center text-primary-foreground shadow-fab bg-gradient-to-br from-[#8B7CF6] to-primary', phase === 'thinking' && 'opacity-80')}>
              {listening && <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping [animation-duration:1.6s]" />}
              {listening ? <Square className="h-4 w-4 relative fill-current" /> : <Mic className="h-5 w-5 relative" />}
            </button>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {listening ? (hold ? 'Đang nghe · thả tay (hoặc chạm ■) để gửi' : 'Đang nghe · nói xong sẽ tự gửi') : phase === 'thinking' ? 'Đang hiểu lệnh…' : phase === 'chat' && !reply ? 'Đang hỏi AI Coach…' : 'Bạn đã nói'}
              </p>
              <p className={cn('text-[14.5px] font-semibold leading-snug break-words mt-0.5', !(voice.interim || heard) && 'text-muted-foreground font-medium')}>
                {voice.interim || heard || (listening ? <>Thử: <span className="italic">{example}</span></> : '')}
              </p>
              {listening && <span className="mt-1.5 flex items-end gap-[3px] h-4" aria-hidden>{[0, 120, 240, 360, 480, 600, 720].map((d) => <span key={d} className="w-[3px] h-full rounded-full bg-primary/70 animate-[lioWave_0.9s_ease-in-out_infinite]" style={{ animationDelay: `${d}ms` }} />)}</span>}
              {phase === 'thinking' && <span className="mt-1.5 flex gap-1">{[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>}
              {!support.native && !support.recorder && <p className="text-[12px] text-destructive mt-1">Trình duyệt này chưa hỗ trợ micro.</p>}
            </div>
            <button onClick={toggleSpeaker} aria-label={speaker ? 'Tắt đọc phản hồi' : 'Bật đọc phản hồi'} title={speaker ? 'Đang đọc phản hồi' : 'Không đọc phản hồi'} className="h-8 w-8 -mt-0.5 rounded-full grid place-items-center text-muted-foreground hover:bg-secondary shrink-0">{speaker ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
            <button onClick={close} aria-label="Đóng" className="h-8 w-8 -mr-1 -mt-0.5 rounded-full grid place-items-center text-muted-foreground hover:bg-secondary shrink-0"><X className="h-4 w-4" /></button>
          </div>

          {reply && (
            <div className="mt-3 flex items-start gap-2">
              <span className="h-7 w-7 rounded-full bg-lavender dark:bg-primary/15 grid place-items-center shrink-0 text-[13px]">✨</span>
              <p className="flex-1 min-w-0 rounded-[16px] rounded-tl-md bg-secondary/60 px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-44 overflow-y-auto">{reply.replace(/[*#`]/g, '')}</p>
            </div>
          )}
          {phase === 'chat' && !reply && <span className="mt-3 flex gap-1 pl-2">{[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>}

          {!!rows.length && (
            <div className="mt-3 space-y-1.5">
              {rows.map((r) => <ResultRow key={r.id} row={r} onConfirm={() => { touched.current = true; void run(r); }} onDismiss={() => patch(r.id, { status: 'dismissed' })} onUndo={() => void undo(r)} onView={r.view ? () => { navigate(r.view!); close(); } : undefined} />)}
            </div>
          )}

          {(phase === 'error' || (phase === 'chat' && reply)) && (
            <div className={cn('mt-3', phase === 'error' && 'rounded-[16px] bg-secondary/60 px-3 py-2.5')}>
              {phase === 'error' && <p className="text-[13px]">{note}</p>}
              <div className="mt-2 flex gap-2">
                <button onClick={again} className="h-8 px-3 rounded-full bg-card border border-border text-[12.5px] font-semibold flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Nói lại</button>
                {phase === 'chat' && <button onClick={() => { onClose(); setTimeout(openVoiceChat, 120); }} className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-[12.5px] font-semibold flex items-center gap-1.5"><AudioLines className="h-3.5 w-3.5" />Trò chuyện tiếp</button>}
              </div>
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

function ResultRow({ row, onConfirm, onDismiss, onUndo, onView }: { row: Row; onConfirm: () => void; onDismiss: () => void; onUndo: () => void; onView?: () => void }) {
  const d = describeAction(row);
  const off = row.status === 'dismissed' || row.status === 'undone';
  return (
    <div className={cn('flex items-center gap-2.5 rounded-[16px] px-2.5 py-2 bg-secondary/40', off && 'opacity-55')}>
      <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[d.tint].bg)}><LifeIcon name={d.icon as LifeIconName} size={19} variant="duotone" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{d.kind}</span>
        <span className={cn('block text-[13.5px] font-semibold leading-snug truncate', off && 'line-through')}>{d.title}</span>
        {!!d.meta.length && <span className="block text-[11.5px] text-muted-foreground truncate">{d.meta.join(' · ')}</span>}
        {row.status === 'failed' && <span className="block text-[11.5px] text-destructive">{row.message}</span>}
      </span>
      {row.status === 'pending' ? (
        <span className="flex gap-1 shrink-0">
          <button onClick={onDismiss} aria-label="Bỏ qua" className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:bg-card"><X className="h-4 w-4" /></button>
          <button onClick={onConfirm} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold flex items-center gap-1 shadow-soft', row.type === 'delete_task' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground')}><Check className="h-3.5 w-3.5" />{row.type === 'delete_task' ? 'Xoá' : 'Lưu'}</button>
        </span>
      ) : row.status === 'done' ? (
        <span className="flex items-center gap-0.5 shrink-0">
          <span className="h-6 w-6 rounded-full grid place-items-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" aria-label="Đã xong"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
          {onView && <button onClick={onView} className="h-8 px-2.5 rounded-full text-[12px] font-semibold bg-card border border-border/70 hover:bg-secondary">Xem</button>}
          {row.undo && <button onClick={onUndo} aria-label="Hoàn tác" title="Hoàn tác" className="h-8 w-8 rounded-full text-primary hover:bg-card grid place-items-center"><RotateCcw className="h-3.5 w-3.5" /></button>}
        </span>
      ) : (
        <span className="text-[11.5px] font-medium text-muted-foreground shrink-0 pr-1">{row.status === 'undone' ? 'Đã hoàn tác' : row.status === 'failed' ? 'Lỗi' : 'Đã bỏ'}</span>
      )}
    </div>
  );
}
