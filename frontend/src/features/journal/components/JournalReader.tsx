import { Heart, Pencil, Trash2 } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { AreaChip } from '@/components/lio';
import { LIFE_AREAS, type JournalEntry, type JournalTag } from '@/types/lifeos';
import { energyOf, longDate, moodOf, titleOf } from '../utils/journal.utils';
import { TagPill } from './JournalCard';

interface Props { entry: JournalEntry | null; onOpenChange: (o: boolean) => void; tagOf: (id: string) => JournalTag | undefined; onEdit: () => void; onDelete: () => void }

export function JournalReader({ entry, onOpenChange, tagOf, onEdit, onDelete }: Props) {
  if (!entry) return null;
  const mood = moodOf(entry.mood); const energy = energyOf(entry.energy);
  const lines = entry.content.split('\n');
  const first = lines.findIndex((l) => l.trim());
  const body = lines.slice(first + 1).join('\n').trim();
  const tags = (entry.tags || []).map(tagOf).filter(Boolean) as JournalTag[];
  return (
    <AdaptiveModal open={!!entry} onOpenChange={onOpenChange} title="Chi tiết nhật ký" className="sm:max-w-[620px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <article className="space-y-4 min-w-0">
        {entry.images?.[0] && <img src={entry.images[0]} alt="" className="w-full h-[200px] sm:h-[240px] object-cover rounded-[20px]" />}
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
          <div className="grid grid-cols-3 gap-2">{entry.images!.slice(1).map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full object-cover rounded-xl" />)}</div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" className="h-11 rounded-full gap-1.5 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" />Xóa</Button>
          <Button className="h-11 rounded-full gap-1.5 shadow-soft" onClick={onEdit}><Pencil className="h-4 w-4" />Chỉnh sửa</Button>
        </div>
      </article>
    </AdaptiveModal>
  );
}
