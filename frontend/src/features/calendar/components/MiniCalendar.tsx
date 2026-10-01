import { useState } from 'react';
import { addMonths, format, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WEEKDAYS, cap, key, rangeOf } from '../utils/calendar.utils';
import { vi } from 'date-fns/locale';

export function MiniCalendar({ selected, onSelect, marks }: { selected: Date; onSelect: (d: Date) => void; marks: Set<string> }) {
  const [month, setMonth] = useState(selected);
  const { days } = rangeOf('month', month);
  const today = key(new Date()); const sel = key(selected);
  return (
    <div className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13.5px] font-bold">{cap(format(month, 'MMMM yyyy', { locale: vi }))}</p>
        <div className="flex">
          <button className="h-7 w-7 grid place-items-center rounded-full hover:bg-secondary" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="h-4 w-4" /></button>
          <button className="h-7 w-7 grid place-items-center rounded-full hover:bg-secondary" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10.5px] font-semibold text-muted-foreground mb-1">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const k = key(d);
          return (
            <button key={k} onClick={() => onSelect(d)} className={cn(
              'relative mx-auto h-8 w-8 rounded-full text-[12px] font-medium transition-colors',
              !isSameMonth(d, month) && 'text-muted-foreground/40',
              k === sel ? 'bg-primary text-primary-foreground font-bold' : k === today ? 'text-primary font-bold bg-lavender dark:bg-primary/15' : 'hover:bg-secondary',
            )}>
              {format(d, 'd')}
              {marks.has(k) && k !== sel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary/70" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
