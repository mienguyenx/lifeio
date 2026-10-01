import { cn } from '@/lib/utils';
import type { CalendarItemType } from '../types/calendar.types';
import { ALL_TYPES, TYPE_META } from '../utils/calendar.utils';

/** Bộ lọc theo nguồn dữ liệu — đồng thời là chú giải màu. */
export function CalendarFilters({ active, onToggle, counts, className }: {
  active: CalendarItemType[]; onToggle: (t: CalendarItemType) => void; counts: Partial<Record<CalendarItemType, number>>; className?: string;
}) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto no-scrollbar', className)}>
      {ALL_TYPES.map((t) => {
        const m = TYPE_META[t]; const on = active.includes(t);
        return (
          <button key={t} onClick={() => onToggle(t)} className={cn('h-8 pl-2.5 pr-3 rounded-full inline-flex items-center gap-1.5 text-[12.5px] font-semibold border whitespace-nowrap transition-all', on ? 'bg-card border-border/70 shadow-soft' : 'border-transparent opacity-50 hover:opacity-80')}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
            {m.label}
            {!!counts[t] && <span className="text-muted-foreground font-medium">{counts[t]}</span>}
          </button>
        );
      })}
    </div>
  );
}
