import { ChevronLeft, ChevronRight, Heart, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { AreaChip } from '@/components/lio';
import { LIFE_AREAS, type JournalEntry, type JournalTag } from '@/types/lifeos';
import { energyOf, longDate, moodOf, titleOf } from '../utils/journal.utils';
import { TagPill } from './JournalCard';

interface Props { entry: JournalEntry | null; onOpenChange: (o: boolean) => void; tagOf: (id: string) => JournalTag | undefined; onEdit: () => void; onDelete: () => void; onPrev?: () => void; onNext?: () => void }

export function JournalReader({ entry, onOpenChange, tagOf, onEdit, onDelete, onPrev, onNext }: Props) {
  const [zoom, setZoom] = useState<string | null>(null);
  useEffect(() => {
    if (!entry) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' && onPrev) onPrev(); if (e.key === 'ArrowRight' && onNext) onNext(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [entry, onPrev, onNext]);
  if (!entry) return null;
  const mood = moodOf(entry.mood); const energy = energyOf(entry.energy);
  const lines = entry.content.split('\n');
  const first = lines.findIndex((l) => l.trim());
  const body = lines.slice(first + 1).join('\n').trim();
  const tags = (entry.tags || []).map(tagOf).filter(Boolean) as JournalTag[];
  return (
    <AdaptiveModal open={!!entry} onOpenChange={onOpenChange} title="Chi tiết nhật ký" className="sm:max-w-[620px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <article className="space-y-4 min-w-0">
        {entry.images?.[0] && <button type="button" onClick={() => setZoom(entry.images![0])} className="block w-full"><img src={entry.images[0]} alt="" className="w-full h-[200px] sm:h-[240px] object-cover rounded-[20px]" /></button>}
        <div>
          <h2 className="text-[20px] font-extrabold leading-tight">{titleOf(entry)}</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1">{longDate(entry.date)}{entry.createdAt && ` · ${new Date(entry.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {mood && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: `${mood.color}1f`, color: mood.color }}>{mood.emoji} {mood.label}</span>}
          {energy && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold">{energy.emoji} {energy.label}</span>}
          {tags.map((t) => <TagPill key={t.id} tag={t} />)}
          {(entry.areas || []).map((a) => <AreaChip key={a} area={a} label={LIFE_AREAS.find((x) => x.id === a)?.name ?? a} />)}
        </div>
        {body && <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{body}</p>}
        {!!entry.gratitude?.length && (
          <div className="rounded-[20px] bg-[#FFF1F4] dark:bg-[#F2557A]/10 p-4">
            <p className="text-[13px] font-bold mb-2 inline-flex items-center gap-1.5"><Heart className="h-4 w-4 text-[#F2557A]" />Điều biết ơn</p>
            <ul className="space-y-1 text-[13.5px]">{entry.gratitude.map((g, i) => <li key={i}>• {g}</li>)}</ul>
          </div>
        )}
        {(entry.images?.length ?? 0) > 1 && (
          <div className="grid grid-cols-3 gap-2">{entry.images!.slice(1).map((src, i) => <button key={i} type="button" onClick={() => setZoom(src)}><img src={src} alt="" className="aspect-square w-full object-cover rounded-xl" /></button>)}</div>
        )}
        {(onPrev || onNext) && (
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <Button variant="ghost" size="sm" className="rounded-full gap-1" disabled={!onPrev} onClick={onPrev}><ChevronLeft className="h-4 w-4" />Bài mới hơn</Button>
            <Button variant="ghost" size="sm" className="rounded-full gap-1" disabled={!onNext} onClick={onNext}>Bài cũ hơn<ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" className="h-11 rounded-full gap-1.5 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" />Xóa</Button>
          <Button className="h-11 rounded-full gap-1.5 shadow-soft" onClick={onEdit}><Pencil className="h-4 w-4" />Chỉnh sửa</Button>
        </div>
      </article>
      {zoom && (
        <button type="button" onClick={() => setZoom(null)} className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4" aria-label="Đóng ảnh">
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </button>
      )}
    </AdaptiveModal>
  );
}
