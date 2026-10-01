import { memo } from 'react';
import { Image as ImageIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { JournalEntry, JournalTag } from '@/types/lifeos';
import { dateLabel, excerptOf, moodOf, titleOf } from '../utils/journal.utils';

/** Ảnh bìa: ảnh đầu tiên của bài, nếu không có thì gradient theo tâm trạng. */
function Cover({ entry, className }: { entry: JournalEntry; className?: string }) {
  const mood = moodOf(entry.mood);
  const img = entry.images?.[0];
  return (
    <div className={cn('relative overflow-hidden bg-secondary shrink-0', className)}
      style={img ? undefined : { background: `linear-gradient(135deg, ${mood?.color ?? '#7C6CF2'}33, #EFEBFF 70%)` }}>
      {img ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-[34px]">{mood?.emoji ?? '📝'}</span>}
      {(entry.images?.length ?? 0) > 1 && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10.5px] font-semibold text-white"><ImageIcon className="h-3 w-3" />{entry.images!.length}</span>
      )}
    </div>
  );
}

export function TagPill({ tag }: { tag: JournalTag }) {
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `hsl(${tag.color} / 0.14)`, color: `hsl(${tag.color})` }}>{tag.name}</span>;
}

interface Props { entry: JournalEntry; tagOf: (id: string) => JournalTag | undefined; onOpen: () => void; onEdit: () => void; onDelete: () => void; layout?: 'grid' | 'row' }

export const JournalCard = memo(function JournalCard({ entry, tagOf, onOpen, onEdit, onDelete, layout = 'grid' }: Props) {
  const mood = moodOf(entry.mood);
  const tags = (entry.tags || []).map(tagOf).filter(Boolean) as JournalTag[];
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button onClick={(e) => e.stopPropagation()} aria-label="Tùy chọn" className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary shrink-0"><MoreHorizontal className="h-4 w-4" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (layout === 'row') {
    return (
      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        className="flex items-center gap-3 rounded-[20px] bg-card border border-border/60 shadow-soft p-2.5 cursor-pointer active:scale-[0.99] transition-transform">
        <Cover entry={entry} className="h-[68px] w-[68px] rounded-[14px]" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate">{titleOf(entry)}</p>
          <p className="text-[12px] text-muted-foreground line-clamp-1">{excerptOf(entry)}</p>
          <div className="flex items-center gap-1.5 mt-1 min-w-0">
            <span className="text-[11px] text-muted-foreground shrink-0">{dateLabel(entry.date)}</span>
            {mood && <span className="text-[12px]">{mood.emoji}</span>}
            {tags.slice(0, 1).map((t) => <TagPill key={t.id} tag={t} />)}
          </div>
        </div>
        {menu}
      </div>
    );
  }

  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="group flex flex-col rounded-[22px] bg-card border border-border/60 shadow-soft overflow-hidden cursor-pointer transition-all hover:shadow-card hover:-translate-y-0.5">
      <Cover entry={entry} className="h-[132px] w-full" />
      <div className="flex-1 flex flex-col p-3.5 min-w-0">
        <p className="text-[14.5px] font-semibold line-clamp-1">{titleOf(entry)}</p>
        <p className="text-[12.5px] text-muted-foreground line-clamp-2 mt-0.5 min-h-[36px]">{excerptOf(entry)}</p>
        <div className="flex flex-wrap gap-1 mt-2 min-h-[22px]">{tags.slice(0, 2).map((t) => <TagPill key={t.id} tag={t} />)}</div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <span className="text-[11.5px] text-muted-foreground">{dateLabel(entry.date)}</span>
          <span className="flex items-center gap-1">
            {mood && <span title={mood.label} className="text-[15px]">{mood.emoji}</span>}
            {menu}
          </span>
        </div>
      </div>
    </div>
  );
});
