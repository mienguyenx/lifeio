import { useEffect, useRef, useState } from 'react';
import { CalendarDays, FileText, ImagePlus, Link2, Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { JournalTemplatesModal } from '@/components/journal/JournalTemplatesModal';
import { LIFE_AREAS, type JournalTag, type LifeArea } from '@/types/lifeos';
import { EMPTY_DRAFT, type JournalDraft } from '../utils/journal.utils';
import { EnergyPicker, MoodPicker } from './JournalMoodPicker';

const fieldCls = 'h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[14px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10';
const Label = ({ children }: { children: React.ReactNode }) => <p className="text-[12.5px] font-semibold text-muted-foreground mb-1.5">{children}</p>;

/** Nhật ký không có trường tiêu đề riêng: ô "Tiêu đề" được lưu là dòng đầu của nội dung. */
const split = (content: string) => {
  const i = content.indexOf('\n');
  return i === -1 ? { title: content, body: '' } : { title: content.slice(0, i), body: content.slice(i + 1).replace(/^\n/, '') };
};

interface Props {
  open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial?: JournalDraft;
  tags: JournalTag[]; onManageTags: () => void; onSubmit: (d: JournalDraft) => void;
}

export function JournalEditor({ open, onOpenChange, mode, initial, tags, onManageTags, onSubmit }: Props) {
  const [d, setD] = useState<JournalDraft>(EMPTY_DRAFT());
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState(''); const [showUrl, setShowUrl] = useState(false);
  const [templates, setTemplates] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const init = initial ?? EMPTY_DRAFT();
    setD(init); const s = split(init.content); setTitle(s.title); setBody(s.body); setImageUrl(''); setShowUrl(false);
  }, [open, initial]);

  const set = <K extends keyof JournalDraft>(k: K, v: JournalDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const content = [title.trim(), body.trim()].filter(Boolean).join('\n');

  const addUrl = () => { const u = imageUrl.trim(); if (u && !d.images.includes(u)) set('images', [...d.images, u]); setImageUrl(''); };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = (ev) => { const url = ev.target?.result as string; if (url) setD((p) => (p.images.includes(url) ? p : { ...p, images: [...p.images, url] })); };
      r.readAsDataURL(file);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!content) return; onSubmit({ ...d, content }); onOpenChange(false); };

  return (
    <>
      <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa nhật ký' : 'Viết nhật ký mới'} className="sm:max-w-[620px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={submit} className="space-y-4 min-w-0">
          <div className="flex items-center gap-2">
            <label className="relative flex-1 min-w-0">
              <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input type="date" value={d.date} onChange={(e) => set('date', e.target.value)} className={cn(fieldCls, 'pl-10')} />
            </label>
            <Button type="button" variant="outline" className="h-11 rounded-full gap-1.5 shrink-0" onClick={() => setTemplates(true)}><FileText className="h-4 w-4" />Mẫu</Button>
          </div>
          <div>
            <Label>Tiêu đề</Label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Hôm nay tôi biết ơn điều gì?" className={fieldCls} />
          </div>
          <textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'Hôm nay bạn cảm thấy như thế nào?\nHãy viết về những suy nghĩ, cảm xúc, trải nghiệm của bạn…'}
            className={cn(fieldCls, 'h-auto py-3 resize-y leading-relaxed min-h-[150px]')} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Tâm trạng hôm nay</Label><MoodPicker value={d.mood} onChange={(v) => set('mood', v)} /></div>
            <div><Label>Năng lượng</Label><EnergyPicker value={d.energy} onChange={(v) => set('energy', v)} /></div>
          </div>
          <div>
            <Label>Điều biết ơn (mỗi dòng một điều)</Label>
            <textarea rows={2} value={d.gratitude} onChange={(e) => set('gratitude', e.target.value)} placeholder="Gia đình luôn ủng hộ tôi…" className={cn(fieldCls, 'h-auto py-2.5 resize-none')} />
          </div>
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
            <Label>Hình ảnh</Label>
            {d.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {d.images.map((src) => (
                  <div key={src.slice(0, 64) + src.length} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => set('images', d.images.filter((x) => x !== src))} className="absolute right-1 top-1 h-6 w-6 grid place-items-center rounded-full bg-black/50 text-white" aria-label="Xóa ảnh"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <Button type="button" variant="outline" className="h-10 rounded-full gap-1.5" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" />Thêm ảnh</Button>
              <Button type="button" variant="outline" className="h-10 rounded-full gap-1.5" onClick={() => setShowUrl((v) => !v)}><Link2 className="h-4 w-4" />Từ URL</Button>
            </div>
            {showUrl && (
              <div className="flex gap-2 mt-2">
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} placeholder="https://…" className={fieldCls} />
                <Button type="button" className="h-11 rounded-2xl" onClick={addUrl}>Thêm</Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!content}>{mode === 'edit' ? 'Lưu thay đổi' : 'Lưu nhật ký'}</Button>
          </div>
        </form>
      </AdaptiveModal>
      <JournalTemplatesModal open={templates} onOpenChange={setTemplates} onSelectTemplate={(c, g) => { const s = split(c); setTitle(s.title); setBody(s.body); set('gratitude', g); }} />
    </>
  );
}
