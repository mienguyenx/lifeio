import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, FileText, ImagePlus, Link2, Lightbulb, RefreshCw, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { JournalTemplatesModal } from '@/components/journal/JournalTemplatesModal';
import { compressImage } from '@/lib/imageCompress';
import { LIFE_AREAS, type JournalTag, type LifeArea } from '@/types/lifeos';
import { EMPTY_DRAFT, MOODS, longDate, todayKey, type JournalDraft } from '../utils/journal.utils';
import { EnergyPicker, MoodPicker } from './JournalMoodPicker';

const fieldCls = 'h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[16px] sm:text-[14px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10';
const Label = ({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) => (
  <p className="text-[12.5px] font-semibold text-muted-foreground mb-1.5">{children}{extra && <span className="text-foreground/80"> · {extra}</span>}</p>
);
const DRAFT_KEY = 'lifeos.journal.draft';
const MAX_IMAGES = 6;

/** Câu hỏi gợi ý viết — xoay vòng theo ngày, bấm để chèn vào bài. */
export const JOURNAL_PROMPTS = [
  'Điều gì khiến hôm nay đáng nhớ?',
  'Hôm nay mình biết ơn điều gì nhất?',
  'Mình đã học được điều gì mới?',
  'Điều gì làm mình tốn năng lượng nhất hôm nay?',
  'Khoảnh khắc nào khiến mình mỉm cười?',
  'Nếu làm lại hôm nay, mình sẽ làm khác điều gì?',
  'Mình tự hào về bản thân vì điều gì?',
  'Điều gì đang khiến mình lo lắng? Mình kiểm soát được phần nào?',
  'Ai đã giúp đỡ mình hôm nay?',
  'Một việc nhỏ mình muốn làm tốt hơn vào ngày mai là gì?',
  'Cơ thể mình cảm thấy thế nào hôm nay?',
  'Mình đã tiến gần hơn tới mục tiêu nào?',
];

/** Nhật ký không có trường tiêu đề riêng: ô "Tiêu đề" được lưu là dòng đầu của nội dung. */
const split = (content: string) => {
  const i = content.indexOf('\n');
  return i === -1 ? { title: content, body: '' } : { title: content.slice(0, i), body: content.slice(i + 1).replace(/^\n/, '') };
};
const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

interface Props {
  open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial?: JournalDraft;
  tags: JournalTag[]; onManageTags: () => void; onSubmit: (d: JournalDraft) => void;
}

export function JournalEditor({ open, onOpenChange, mode, initial, tags, onManageTags, onSubmit }: Props) {
  const [d, setD] = useState<JournalDraft>(EMPTY_DRAFT());
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState(''); const [showUrl, setShowUrl] = useState(false);
  const [templates, setTemplates] = useState(false);
  const [more, setMore] = useState(false);
  const [restored, setRestored] = useState(false);
  const [promptSeed, setPromptSeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const snapshot = useRef('');

  useEffect(() => {
    if (!open) return;
    let init = initial ?? EMPTY_DRAFT(); let fromDraft = false;
    if (mode === 'create' && !init.content) {
      try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') as (JournalDraft & { title: string; body: string }) | null;
        if (saved && (saved.title || saved.body)) { init = { ...init, ...saved, date: init.date || saved.date }; fromDraft = true; }
      } catch { /* bỏ qua nháp hỏng */ }
    }
    setD(init);
    const s = fromDraft ? { title: (init as JournalDraft & { title: string }).title, body: (init as JournalDraft & { body: string }).body } : split(init.content);
    setTitle(s.title); setBody(s.body); setImageUrl(''); setShowUrl(false); setRestored(fromDraft);
    setMore(init.tags.length > 0 || init.areas.length > 0 || init.images.length > 0);
    snapshot.current = JSON.stringify([s.title, s.body, init]);
  }, [open, initial, mode]);

  // Tự lưu bản nháp khi viết bài mới — lỡ đóng sheet hay mất mạng vẫn không mất chữ
  useEffect(() => {
    if (!open || mode !== 'create') return;
    const t = setTimeout(() => {
      try {
        if (title.trim() || body.trim()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, images: d.images.filter((x) => !x.startsWith('data:')), title, body }));
        else localStorage.removeItem(DRAFT_KEY);
      } catch { /* hết dung lượng */ }
    }, 400);
    return () => clearTimeout(t);
  }, [open, mode, title, body, d]);

  const set = <K extends keyof JournalDraft>(k: K, v: JournalDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const content = [title.trim(), body.trim()].filter(Boolean).join('\n');
  const words = wordCount(title) + wordCount(body);
  const dirty = JSON.stringify([title, body, d]) !== snapshot.current;

  const prompts = useMemo(() => {
    const day = Number(todayKey().replace(/-/g, '')) + promptSeed * 3;
    return [0, 1, 2].map((i) => JOURNAL_PROMPTS[(day + i * 5) % JOURNAL_PROMPTS.length]);
  }, [promptSeed]);
  const applyPrompt = (q: string) => {
    if (!title.trim()) setTitle(q);
    else setBody((b) => (b.trim() ? `${b.replace(/\s+$/, '')}\n\n${q}\n` : `${q}\n`));
    setTimeout(() => { const el = bodyRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 30);
  };

  const addUrl = () => { const u = imageUrl.trim(); if (u && !d.images.includes(u)) set('images', [...d.images, u].slice(0, MAX_IMAGES)); setImageUrl(''); };
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (fileRef.current) fileRef.current.value = '';
    const room = MAX_IMAGES - d.images.length;
    if (!files.length) return;
    if (room <= 0) { toast.error(`Tối đa ${MAX_IMAGES} ảnh mỗi bài`); return; }
    setBusy(true);
    try {
      const urls = await Promise.all(files.slice(0, room).map((f) => compressImage(f)));
      setD((p) => ({ ...p, images: [...p.images, ...urls.filter((u) => !p.images.includes(u))].slice(0, MAX_IMAGES) }));
      if (files.length > room) toast.message(`Chỉ thêm ${room} ảnh (tối đa ${MAX_IMAGES})`);
    } catch { toast.error('Không đọc được ảnh'); } finally { setBusy(false); }
  };

  const close = (o: boolean) => {
    if (o) return onOpenChange(true);
    if (mode === 'edit' && dirty && !window.confirm('Bỏ các thay đổi chưa lưu?')) return;
    onOpenChange(false);
  };
  const discardDraft = () => { localStorage.removeItem(DRAFT_KEY); const e = { ...EMPTY_DRAFT(), date: d.date }; setD(e); setTitle(''); setBody(''); setRestored(false); };
  const save = () => {
    if (!content) return;
    onSubmit({ ...d, content });
    if (mode === 'create') localStorage.removeItem(DRAFT_KEY);
    onOpenChange(false);
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); save(); };
  const onKey = (e: React.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); save(); } };

  const mood = MOODS.find((m) => m.value === d.mood);
  const isToday = d.date === todayKey();
  const extraCount = d.tags.length + d.areas.length + d.images.length;

  return (
    <>
      <AdaptiveModal open={open} onOpenChange={close} title={mode === 'edit' ? 'Chỉnh sửa nhật ký' : 'Viết nhật ký mới'} className="sm:max-w-[620px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={submit} onKeyDown={onKey} className="space-y-4 min-w-0">
          {restored && (
            <div className="flex items-center gap-2 rounded-2xl bg-lavender/60 dark:bg-primary/10 px-3 py-2 text-[12.5px]">
              <span className="flex-1">Đã khôi phục bản nháp chưa lưu.</span>
              <button type="button" onClick={discardDraft} className="font-semibold text-primary">Bỏ nháp</button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Ô ngày hiển thị kiểu Việt; input date trong suốt phủ lên để mở bộ chọn gốc */}
            <label className={cn(fieldCls, 'relative flex-1 min-w-0 flex items-center gap-2 cursor-pointer')}>
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate text-[14px] font-semibold">{isToday ? `Hôm nay · ${Number(d.date.slice(8))}/${Number(d.date.slice(5, 7))}` : longDate(d.date)}</span>
              <input type="date" value={d.date} max={todayKey()} onChange={(e) => e.target.value && set('date', e.target.value)} aria-label="Ngày viết"
                className="absolute inset-0 opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" />
            </label>
            <Button type="button" variant="outline" className="h-11 rounded-full gap-1.5 shrink-0" onClick={() => setTemplates(true)}><FileText className="h-4 w-4" />Mẫu</Button>
          </div>

          <div>
            <Label>Tiêu đề</Label>
            <input autoFocus={mode === 'create' && !restored} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Một ngày nhiều năng lượng" className={fieldCls} enterKeyHint="next"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); bodyRef.current?.focus(); } }} />
          </div>

          <div>
            <textarea ref={bodyRef} rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'Hôm nay bạn cảm thấy như thế nào?\nHãy viết về những suy nghĩ, cảm xúc, trải nghiệm của bạn…'}
              className={cn(fieldCls, 'h-auto py-3 resize-y leading-relaxed min-h-[150px]')} />
            <div className="mt-2 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 mt-1.5 shrink-0 text-[#FFB020]" />
              <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
                {prompts.map((q) => (
                  <button key={q} type="button" onClick={() => applyPrompt(q)} className="shrink-0 max-w-[240px] truncate h-7 px-3 rounded-full bg-secondary/70 hover:bg-secondary text-[12px] font-medium">{q}</button>
                ))}
              </div>
              <button type="button" onClick={() => setPromptSeed((s) => s + 1)} className="h-7 w-7 shrink-0 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground" aria-label="Đổi gợi ý" title="Đổi gợi ý"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label extra={mood?.label}>Tâm trạng</Label><MoodPicker value={d.mood} onChange={(v) => set('mood', v)} /></div>
            <div><Label>Năng lượng</Label><EnergyPicker value={d.energy} onChange={(v) => set('energy', v)} /></div>
          </div>
          <div>
            <Label>Điều biết ơn (mỗi dòng một điều)</Label>
            <textarea rows={2} value={d.gratitude} onChange={(e) => set('gratitude', e.target.value)} placeholder="Gia đình luôn ủng hộ tôi…" className={cn(fieldCls, 'h-auto py-2.5 resize-none')} />
          </div>

          <button type="button" onClick={() => setMore((v) => !v)} className="w-full flex items-center justify-between rounded-2xl bg-secondary/50 hover:bg-secondary/80 px-3.5 h-11 text-[13px] font-semibold">
            <span>Thẻ, lĩnh vực & hình ảnh{extraCount ? <span className="text-muted-foreground font-medium"> · {extraCount} đã chọn</span> : null}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', more && 'rotate-180')} />
          </button>
          {more && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between"><Label>Thẻ (tags)</Label>
                  <button type="button" onClick={onManageTags} className="text-[12px] font-semibold text-primary inline-flex items-center gap-1 mb-1.5"><Settings2 className="h-3.5 w-3.5" />Quản lý thẻ</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.length === 0 && <span className="text-[12.5px] text-muted-foreground">Chưa có thẻ — bấm “Quản lý thẻ” để tạo.</span>}
                  {tags.map((t) => {
                    const on = d.tags.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => set('tags', toggle(d.tags, t.id))} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold border transition-all', on ? 'border-transparent' : 'border-border/70 text-muted-foreground')}
                        style={on ? { background: `hsl(${t.color} / 0.16)`, color: `hsl(${t.color})` } : undefined}>{t.name}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Lĩnh vực liên quan</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LIFE_AREAS.map((a) => {
                    const on = d.areas.includes(a.id as LifeArea);
                    return (
                      <button key={a.id} type="button" onClick={() => set('areas', toggle(d.areas, a.id as LifeArea))} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold border inline-flex items-center gap-1.5 transition-all', on ? 'border-transparent' : 'border-border/70 text-muted-foreground hover:text-foreground')}
                        style={on ? { background: `hsl(var(--area-${a.id}) / 0.16)`, color: `hsl(var(--area-${a.id}))` } : undefined}><span>{a.icon}</span>{a.name}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label extra={d.images.length ? `${d.images.length}/${MAX_IMAGES}` : undefined}>Hình ảnh</Label>
                {d.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {d.images.map((src, i) => (
                      <div key={src.slice(-48) + i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {i === 0 && d.images.length > 1 && <span className="absolute left-1 bottom-1 rounded-full bg-black/55 text-white text-[10px] font-semibold px-1.5 py-0.5">Ảnh bìa</span>}
                        <button type="button" onClick={() => set('images', d.images.filter((x) => x !== src))} className="absolute right-1 top-1 h-6 w-6 grid place-items-center rounded-full bg-black/50 text-white" aria-label="Xóa ảnh"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                  <Button type="button" variant="outline" className="h-10 rounded-full gap-1.5" disabled={busy || d.images.length >= MAX_IMAGES} onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" />{busy ? 'Đang xử lý…' : 'Thêm ảnh'}</Button>
                  <Button type="button" variant="outline" className="h-10 rounded-full gap-1.5" onClick={() => setShowUrl((v) => !v)}><Link2 className="h-4 w-4" />Từ URL</Button>
                </div>
                {showUrl && (
                  <div className="flex gap-2 mt-2">
                    <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} placeholder="https://…" className={fieldCls} inputMode="url" />
                    <Button type="button" className="h-11 rounded-2xl" onClick={addUrl}>Thêm</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 z-10 -mx-1 px-1 pt-2 pb-1 sm:-mb-6 sm:pb-6 bg-background border-t border-border/50">
            <p className="text-[11.5px] text-muted-foreground mb-2 flex justify-between">
              <span>{words} từ{mode === 'create' && (title || body) ? ' · nháp tự lưu' : ''}</span>
              <span className="hidden sm:inline">Ctrl/⌘ + Enter để lưu</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => close(false)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!content}>{mode === 'edit' ? 'Lưu thay đổi' : 'Lưu nhật ký'}</Button>
            </div>
          </div>
        </form>
      </AdaptiveModal>
      <JournalTemplatesModal open={templates} onOpenChange={setTemplates} onSelectTemplate={(c, g) => { const s = split(c); setTitle(s.title); setBody(s.body); set('gratitude', g); }} />
    </>
  );
}
