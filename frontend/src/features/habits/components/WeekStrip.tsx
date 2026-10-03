import { cn } from '@/lib/utils';
import { WEEKDAY_SHORT, dayNum, weekOf, weekdayOf } from '../utils/habit.utils';

/** Vòng tiến độ nhỏ quanh số ngày — nhìn là biết ngày nào xong hết, ngày nào dở dang. */
function DayRing({ r, sel, children }: { r: number; sel: boolean; children: React.ReactNode }) {
  const R = 17, C = 2 * Math.PI * R;
  const color = r >= 1 ? '#22C38E' : '#FFB84D';
  return (
    <span className="relative grid place-items-center h-10 w-10">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={R} fill="none" stroke={sel ? 'rgba(255,255,255,.35)' : 'hsl(var(--border))'} strokeWidth="3" />
        {r > 0 && <circle cx="20" cy="20" r={R} fill="none" stroke={sel ? '#fff' : color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${C * Math.min(1, r)} ${C}`} className="transition-all duration-500" />}
      </svg>
      <span className="relative text-[14px] font-bold tabular-nums">{children}</span>
    </span>
  );
}

/** Dải 7 ngày (T2→CN) để xem/ghi nhận thói quen theo ngày. */
export function WeekStrip({ selected, today, onSelect, doneRatio }: {
  selected: string; today: string; onSelect: (d: string) => void; doneRatio: (d: string) => number;
}) {
  const days = weekOf(today);
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d) => {
        const sel = d === selected, future = d > today, isToday = d === today;
        return (
          <button
            key={d}
            disabled={future}
            onClick={() => onSelect(d)}
            aria-label={`Ngày ${dayNum(d)}`}
            aria-pressed={sel}
            className={cn(
              'flex flex-col items-center gap-1 rounded-[18px] py-1.5 transition-all',
              sel ? 'bg-primary text-primary-foreground shadow-fab' : 'hover:bg-secondary',
              future && 'opacity-35 cursor-not-allowed',
            )}
          >
            <span className={cn('text-[11px] font-semibold', sel ? 'opacity-90' : isToday ? 'text-primary' : 'text-muted-foreground')}>{isToday ? 'Nay' : WEEKDAY_SHORT[weekdayOf(d)]}</span>
            <DayRing r={future ? 0 : doneRatio(d)} sel={sel}>{dayNum(d)}</DayRing>
          </button>
        );
      })}
    </div>
  );
}
