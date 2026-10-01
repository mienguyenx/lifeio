import { format, isSameMonth } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarItem } from '../types/calendar.types';
import { TYPE_META, WEEKDAYS, key, rangeOf } from '../utils/calendar.utils';
import { EventChip } from './EventChip';

export function MonthView({ anchor, selected, byDate, onSelect, onOpen, onAdd, onDropTask, mobile }: {
  anchor: Date; selected: string; byDate: Record<string, CalendarItem[]>;
  onSelect: (k: string) => void; onOpen: (i: CalendarItem) => void; onAdd: (k: string) => void;
  onDropTask: (taskId: string, k: string) => void; mobile?: boolean;
}) {
  const { days } = rangeOf('month', anchor);
  const today = key(new Date());
  return (
    <div className="rounded-[22px] bg-card border border-border/60 shadow-soft overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAYS.map((d) => <div key={d} className="py-2.5 text-center text-[11.5px] font-semibold text-muted-foreground">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const k = key(d); const list = byDate[k] || []; const inMonth = isSameMonth(d, anchor);
          const max = mobile ? 0 : 3;
          return (
            <div
              key={k}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(k)}
              onDoubleClick={() => onAdd(k)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onDropTask(id, k); }}
              className={cn(
                'group relative text-left border-border/50 transition-colors cursor-pointer',
                mobile ? 'min-h-[54px] p-1' : 'min-h-[112px] p-1.5',
                i % 7 !== 6 && 'border-r', i < days.length - 7 && 'border-b',
                !inMonth && 'bg-secondary/30', k === selected && 'bg-lavender/60 dark:bg-primary/10',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'h-6 min-w-6 px-1 grid place-items-center rounded-full text-[12px] font-semibold',
                  !inMonth && 'text-muted-foreground/50', k === today && 'bg-primary text-primary-foreground',
                )}>{format(d, 'd')}</span>
                {!mobile && (
                  <button onClick={(e) => { e.stopPropagation(); onAdd(k); }} className="opacity-0 group-hover:opacity-100 h-5 w-5 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground" aria-label="Thêm"><Plus className="h-3.5 w-3.5" /></button>
                )}
              </div>
              {mobile ? (
                list.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                    {[...new Set(list.map((x) => x.type))].slice(0, 4).map((t) => <span key={t} className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_META[t].color }} />)}
                  </div>
                )
              ) : (
                <div className="mt-1 space-y-0.5">
                  {list.slice(0, max).map((it) => <EventChip key={it.id} item={it} compact onClick={() => onOpen(it)} draggable={it.type === 'task'} />)}
                  {list.length > max && <p className="text-[10.5px] font-semibold text-muted-foreground px-1">+{list.length - max} mục khác</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
