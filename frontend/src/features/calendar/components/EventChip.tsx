import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarItem } from '../types/calendar.types';
import { TYPE_META } from '../utils/calendar.utils';

/** Nhãn mục lịch (dùng trong tháng / cả ngày / danh sách nhỏ). */
export function EventChip({ item, onClick, compact, draggable, className }: {
  item: CalendarItem; onClick: () => void; compact?: boolean; draggable?: boolean; className?: string;
}) {
  const m = TYPE_META[item.type];
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.refId); e.dataTransfer.effectAllowed = 'move'; }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={`${item.start ? item.start + ' · ' : ''}${item.title}`}
      className={cn('w-full flex items-center gap-1 rounded-md px-1.5 text-left truncate transition-opacity hover:opacity-80', compact ? 'h-[18px] text-[10.5px]' : 'h-6 text-[11.5px]', className)}
      style={{ background: m.tint, color: m.color }}
    >
      {item.completed ? <Check className="h-3 w-3 shrink-0" /> : <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: m.color }} />}
      {item.start && !compact && <span className="font-semibold tabular-nums shrink-0">{item.start}</span>}
      <span className={cn('truncate font-medium text-foreground/80', item.completed && item.type === 'task' && 'line-through opacity-70')}>{item.title}</span>
    </button>
  );
}

/** Thẻ mục lịch dạng hàng (Hôm nay / Agenda / mobile). */
export function EventRow({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  const m = TYPE_META[item.type]; const Icon = m.icon;
  return (
    <button type="button" onClick={onClick} className="w-full flex items-stretch gap-3 rounded-2xl bg-card border border-border/60 shadow-soft p-2.5 pr-3 text-left hover:shadow-card transition-all">
      <span className="w-1 rounded-full shrink-0" style={{ background: m.color }} />
      <span className="h-9 w-9 rounded-xl grid place-items-center shrink-0" style={{ background: m.tint, color: m.color }}><Icon className="h-[18px] w-[18px]" /></span>
      <span className="flex-1 min-w-0">
        <span className={cn('block text-[13.5px] font-semibold truncate', item.completed && item.type === 'task' && 'line-through text-muted-foreground')}>{item.title}</span>
        <span className="block text-[11.5px] text-muted-foreground truncate">
          {item.start ? `${item.start}${item.end ? ` – ${item.end}` : ''}` : 'Cả ngày'} · {m.label}{item.meta ? ` · ${item.meta}` : ''}
        </span>
      </span>
      {item.completed && <Check className="h-4 w-4 self-center shrink-0 text-[#22B07D]" />}
    </button>
  );
}
