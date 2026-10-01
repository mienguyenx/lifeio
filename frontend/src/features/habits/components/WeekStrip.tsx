import { cn } from '@/lib/utils';
import { WEEKDAY_SHORT, dayNum, weekOf, weekdayOf } from '../utils/habit.utils';

/** Dải 7 ngày (T2→CN) để xem/ghi nhận thói quen theo ngày. */
export function WeekStrip({ selected, today, onSelect, doneRatio }: {
  selected: string; today: string; onSelect: (d: string) => void; doneRatio: (d: string) => number;
}) {
  const days = weekOf(today);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const sel = d === selected, future = d > today, r = doneRatio(d);
        return (
          <button
            key={d}
            disabled={future}
            onClick={() => onSelect(d)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-[18px] py-2 transition-all',
              sel ? 'bg-primary text-primary-foreground shadow-fab' : 'hover:bg-secondary',
              future && 'opacity-40 cursor-not-allowed',
            )}
          >
            <span className={cn('text-[11px] font-semibold', sel ? 'opacity-90' : 'text-muted-foreground')}>{WEEKDAY_SHORT[weekdayOf(d)]}</span>
            <span className="text-[15px] font-bold">{dayNum(d)}</span>
            <span className={cn('h-1.5 w-1.5 rounded-full', r >= 1 ? (sel ? 'bg-white' : 'bg-[#22B07D]') : r > 0 ? (sel ? 'bg-white/60' : 'bg-[#FFB84D]') : 'bg-transparent')} />
          </button>
        );
      })}
    </div>
  );
}
