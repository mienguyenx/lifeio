// Ghi chú bằng giọng nói: nói → AI biên tập (tiêu đề, Markdown, thẻ, lĩnh vực, việc cần làm) → xem lại → lưu.
// Chế độ "ghi thêm" nối nội dung vào cuối một ghi chú có sẵn.
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Loader2, Mic, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Mascot } from '@/components/brand/Mascot';
import { Field, fieldCls } from '@/components/lio/form';
import { MarkdownEditor } from '@/components/notes/MarkdownEditor';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { voiceSupport } from '@/features/ai-coach/voice/speech';
import { LIFE_AREAS, type LifeArea, type Note } from '@/types/lifeos';
import { cn } from '@/lib/utils';
import { structureVoiceNote, useLongDictation, type VoiceNoteTask } from './voiceNote';

const AI_KEY = 'lifeos.notes.voiceAi';
const TAG_COLORS = ['262 83% 58%', '199 89% 48%', '142 76% 36%', '25 95% 53%', '330 81% 60%'];
const PRIORITY = { high: { label: 'Cao', cls: 'bg-[#FFE4EA] text-[#E0445E]' }, medium: { label: 'Vừa', cls: 'bg-[#FFF4DB] text-[#B7791F]' }, low: { label: 'Thấp', cls: 'bg-[#E6F1FF] text-[#2F7BF6]' } } as const;
type Phase = 'record' | 'processing' | 'review';

export function VoiceNoteSheet({ open, onOpenChange, appendTo, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; appendTo?: Note | null; onSaved?: (noteTitle: string) => void }) {
  const noteTags = useLifeOSStore((s) => s.noteTags);
  const { addNote, updateNote, addNoteTag, addTask } = useSyncedStore();
  const support = voiceSupport();
  const [phase, setPhase] = useState<Phase>('record');
  const [useAi, setUseAi] = useState(() => localStorage.getItem(AI_KEY) !== '0');
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<{ name: string; on: boolean }[]>([]);
  const [area, setArea] = useState<LifeArea | ''>('');
  const [tasks, setTasks] = useState<(VoiceNoteTask & { on: boolean })[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [saving, setSaving] = useState(false);
  const dict = useLongDictation({ onError: (m) => toast.error(m) });
  const append = !!appendTo;

  // Mở là bắt đầu nghe ngay; đóng thì dọn sạch.
  useEffect(() => {
    if (open) { setPhase('record'); setTranscript(''); setShowRaw(false); dict.reset(); if (support.native || support.recorder) window.setTimeout(dict.start, 250); }
    else dict.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const tagByName = useMemo(() => new Map(noteTags.map((t) => [t.name.toLowerCase(), t])), [noteTags]);

  const process = async (text: string) => {
    if (!text) { toast.info('Chưa nghe thấy gì — thử nói lại nhé.'); dict.reset(); dict.start(); return; }
    const full = [transcript, text].filter(Boolean).join(' ');
    setTranscript(full);
    if (!useAi) {
      setTitle((t) => t || (append ? '' : full.split(/(?<=[.!?…])\s+/)[0].slice(0, 60)));
      setContent((c) => (c ? `${c}\n\n${text}` : text));
      setPhase('review'); return;
    }
    setPhase('processing');
    const d = await structureVoiceNote(full, { existingTags: noteTags.map((t) => t.name), mode: append ? 'append' : 'note', context: appendTo?.content });
    if (d.error) toast.warning(d.error);
    setTitle(append ? '' : d.title); setContent(d.content); setSummary(d.summary);
    setTags(d.tags.map((name) => ({ name, on: true })));
    if (d.area && !append) setArea(d.area as LifeArea);
    setTasks(d.tasks.map((t) => ({ ...t, on: true })));
    setPhase('review');
  };

  const done = () => dict.finish((text) => { dict.reset(); void process(text); });
  const recordMore = () => { setPhase('record'); dict.reset(); dict.start(); };
  const close = () => onOpenChange(false);

  const save = async () => {
    if (!append && !title.trim()) { toast.error('Thêm tiêu đề cho ghi chú'); return; }
    setSaving(true);
    try {
      const tagIds: string[] = [];
      for (const t of tags.filter((x) => x.on)) {
        const ex = tagByName.get(t.name.toLowerCase());
        tagIds.push(ex ? ex.id : await addNoteTag(t.name, TAG_COLORS[tagIds.length % TAG_COLORS.length]));
      }
      if (appendTo) {
        const stamp = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        await updateNote(appendTo.id, { content: `${appendTo.content ? `${appendTo.content.trimEnd()}\n\n` : ''}> 🎙️ Ghi thêm ${stamp}\n\n${content.trim()}`, tags: [...new Set([...(appendTo.tags ?? []), ...tagIds])] });
      } else {
        await addNote({ title: title.trim(), content: content.trim(), tags: tagIds, area: area || undefined, isPinned: false, isFavorite: false });
      }
      const picked = tasks.filter((t) => t.on);
      for (const t of picked) await addTask({ title: t.title, priority: t.priority, status: 'todo', dueDate: t.dueDate ?? undefined, area: (area || appendTo?.area || undefined) as LifeArea | undefined });
      toast.success(`${append ? `Đã ghi thêm vào “${appendTo?.title}”` : `Đã lưu ghi chú “${title.trim()}”`}${picked.length ? ` · ${picked.length} việc cần làm` : ''}`);
      onSaved?.(append ? appendTo!.title : title.trim());
      close();
    } catch {
      toast.error('Không lưu được, thử lại nhé.');
    } finally { setSaving(false); }
  };

  const listening = dict.listening;
  const status = phase === 'processing' ? 'AI đang sắp xếp ý…' : dict.state === 'transcribing' ? 'Đang chép lời…' : dict.paused ? 'Đã tạm dừng' : listening || dict.active ? 'Đang nghe…' : 'Chạm micro để nói';

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={append ? `Ghi thêm bằng giọng nói` : 'Ghi chú bằng giọng nói'} description={append ? `Nối vào cuối “${appendTo?.title}”` : 'Nói tự nhiên — AI sẽ sắp xếp thành ghi chú gọn gàng'}>
      {phase !== 'review' ? (
        <div className="flex flex-col items-center pt-2 pb-1">
          <button type="button" onClick={() => (phase !== 'record' ? undefined : dict.paused || !dict.active ? dict.start() : dict.pause())} aria-label={listening ? 'Tạm dừng' : 'Bắt đầu nói'}
            className="relative h-40 w-40 shrink-0 grid place-items-center rounded-full focus:outline-none">
            {listening && <>
              <span className="absolute inset-0 rounded-full bg-primary/15 animate-ping [animation-duration:1.8s]" />
              <span className="absolute inset-4 rounded-full bg-primary/15 animate-ping [animation-duration:1.8s] [animation-delay:.4s]" />
            </>}
            <span className="absolute inset-4 rounded-full bg-gradient-to-b from-[#EFEBFF] to-[#FFF0F6] dark:from-[#2a2245] dark:to-[#2a1d33] shadow-card" />
            <Mascot name="ori" pose={phase === 'processing' ? 'learn' : 'idea'} size={104} float={listening} className="relative" />
          </button>
          <p className="text-[16px] font-bold mt-2">{status}</p>
          <p className="text-[13px] tabular-nums text-muted-foreground">{dict.elapsed}</p>
          {phase === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" />}

          <div className="w-full mt-4 rounded-2xl border border-border/60 bg-secondary/30 p-3 min-h-[96px] max-h-[220px] overflow-y-auto">
            {transcript && <p className="text-[13.5px] text-muted-foreground mb-1">{transcript}</p>}
            {dict.text ? <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{dict.text}</p>
              : !transcript && <p className="text-[13px] text-muted-foreground">Ví dụ: “Ý tưởng cho buổi họp thứ sáu: làm lại trang chủ, mời anh Nam review, nhớ gửi báo giá trước thứ năm…”</p>}
          </div>
          {!support.native && !support.recorder && <p className="text-[12.5px] text-destructive mt-2 text-center">Trình duyệt này chưa hỗ trợ micro. Hãy dùng Chrome, Edge hoặc Safari.</p>}

          <label className="flex items-center gap-2 text-[12.5px] mt-3 cursor-pointer select-none self-start">
            <Switch checked={useAi} onCheckedChange={(v) => { setUseAi(v); localStorage.setItem(AI_KEY, v ? '1' : '0'); }} aria-label="AI biên tập" disabled={phase !== 'record'} />
            <Sparkles className="h-4 w-4 text-primary" /><span><b>AI biên tập</b> · tiêu đề, định dạng, thẻ & việc cần làm</span>
          </label>

          <div className="grid grid-cols-3 gap-2 w-full mt-4">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={close} disabled={phase === 'processing'}><X className="h-4 w-4 mr-1" />Hủy</Button>
            <Button type="button" variant="outline" className="h-11 rounded-full" disabled={phase !== 'record' || dict.state === 'transcribing'} onClick={() => (dict.paused || !dict.active ? dict.start() : dict.pause())}>
              {dict.paused || !dict.active ? <><Play className="h-4 w-4 mr-1" />Nói</> : <><Pause className="h-4 w-4 mr-1" />Dừng</>}
            </Button>
            <Button type="button" className="h-11 rounded-full shadow-soft" disabled={phase !== 'record' || (!dict.text && !dict.active && !transcript)} onClick={done}><Check className="h-4 w-4 mr-1" />Xong</Button>
          </div>
        </div>
      ) : (
        <form className="space-y-3.5 mt-1" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          {summary && <p className="rounded-2xl bg-primary/[0.07] text-[12.5px] px-3 py-2 flex gap-2"><Sparkles className="h-4 w-4 text-primary shrink-0 mt-px" />{summary}</p>}
          {!append && <Field label="Tiêu đề *"><input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề ghi chú" /></Field>}
          <Field label={append ? 'Nội dung ghi thêm' : 'Nội dung'}><MarkdownEditor value={content} onChange={setContent} minRows={7} voice /></Field>
          {!!tags.length && (
            <Field label="Thẻ gợi ý">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => {
                  const ex = tagByName.get(t.name.toLowerCase());
                  return (
                    <button key={t.name} type="button" onClick={() => setTags(tags.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                      className={cn('rounded-full px-2.5 py-1 text-[12px] font-semibold border transition-all', t.on ? 'text-white border-transparent' : 'border-border text-muted-foreground line-through')}
                      style={t.on ? { backgroundColor: `hsl(${ex?.color ?? TAG_COLORS[i % TAG_COLORS.length]})` } : undefined}>#{t.name}{!ex && t.on && <span className="ml-1 opacity-80 font-normal">· mới</span>}</button>
                  );
                })}
              </div>
            </Field>
          )}
          {!append && (
            <Field label="Lĩnh vực">
              <div className="flex flex-wrap gap-1.5">
                {LIFE_AREAS.map((a) => (
                  <button key={a.id} type="button" onClick={() => setArea(area === a.id ? '' : a.id)} className={cn('rounded-full px-2.5 py-1 text-[12px] font-semibold border transition-colors', area === a.id ? 'bg-primary text-primary-foreground border-transparent' : 'border-border text-muted-foreground hover:bg-secondary')}>{a.icon} {a.name}</button>
                ))}
              </div>
            </Field>
          )}
          {!!tasks.length && (
            <Field label={`Việc cần làm AI tìm thấy (${tasks.filter((t) => t.on).length}/${tasks.length} sẽ tạo task)`}>
              <div className="rounded-2xl border border-border/60 divide-y divide-border/50">
                {tasks.map((t, i) => (
                  <label key={i} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={t.on} onChange={() => setTasks(tasks.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    <span className={cn('flex-1 min-w-0 text-[13px] font-medium truncate', !t.on && 'text-muted-foreground line-through')}>{t.title}</span>
                    {t.dueDate && <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0"><CalendarDays className="h-3 w-3" />{t.dueDate.split('-').reverse().slice(0, 2).join('/')}</span>}
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10.5px] font-bold shrink-0', PRIORITY[t.priority].cls)}>{PRIORITY[t.priority].label}</span>
                  </label>
                ))}
              </div>
            </Field>
          )}
          {transcript && (
            <div>
              <button type="button" onClick={() => setShowRaw(!showRaw)} className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1"><ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showRaw && 'rotate-180')} />Lời nói gốc</button>
              {showRaw && <p className="mt-1.5 rounded-2xl bg-secondary/40 p-3 text-[12.5px] text-muted-foreground whitespace-pre-wrap">{transcript}</p>}
            </div>
          )}
          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full px-4" onClick={recordMore}><Mic className="h-4 w-4 mr-1.5" />Nói tiếp</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={saving || !content.trim()}>{saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}{append ? 'Ghi thêm' : 'Lưu ghi chú'}{tasks.some((t) => t.on) ? ` + ${tasks.filter((t) => t.on).length} việc` : ''}</Button>
          </div>
          <button type="button" onClick={() => { setTranscript(''); setContent(''); setTitle(''); setTags([]); setTasks([]); setSummary(''); recordMore(); }} className="w-full text-[12px] text-muted-foreground flex items-center justify-center gap-1 hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" />Ghi lại từ đầu</button>
        </form>
      )}
    </AdaptiveModal>
  );
}
