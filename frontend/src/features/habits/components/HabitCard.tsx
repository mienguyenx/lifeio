import { memo } from 'react';
import { AlarmClock, Check, Flame, Plus, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types/lifeos';
import { areaInfo, countOn, FREQUENCY_LABEL, habitColor, habitTint, suggestEmoji, targetOf } from '../utils/habit.utils';

/** Icon hiển thị: nếu đang là icon mặc định của lĩnh vực (vd. 💪 cho "Uống nước") thì đoán lại theo tên. */
export const iconOf = (h: Habit) => {
  const areaIc = areaInfo(h)?.icon;
  if (h.icon && h.icon !== areaIc) return h.icon;
  return suggestEmoji(h.name) ?? h.icon ?? areaIc;
};

export function HabitIcon({ habit, size = 48, className }: { habit: Habit; size?: number; className?: string }) {
  return (
    <span
      className={cn('shrink-0 grid place-items-center rounded-[16px]', className)}
      style={{ width: size, height: size, fontSize: size * 0.48, background: habitTint(habit) }}
      aria-hidden
    >
      {iconOf(habit)}
    </span>
  );
}

export function CheckCircle({ habit, date, onCheck }: { habit: Habit; date: string; onCheck: () => void }) {
  const t = targetOf(habit), n = countOn(habit, date), done = n >= t;
  const r = 15, c = 2 * Math.PI * r;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); navigator.vibrate?.(done ? 5 : 12); onCheck(); }}
      aria-pressed={done}
      aria-label={done ? 'Đã hoàn thành' : t > 1 ? `Thêm 1 (${n}/${t})` : 'Đánh dấu hoàn thành'}
      className={cn(
        'relative h-10 w-10 shrink-0 rounded-full grid place-items-center transition-all active:scale-90 touch-manipulation',
        done ? 'bg-[#22C38E] text-white shadow-[0_8px_16px_-8px_rgba(34,195,142,0.9)]' : 'text-primary hover:bg-lavender/60',
      )}
    >
      {!done && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r={r} fill="none" stroke="#D9DCE5" strokeWidth="2.5" />
          {t > 1 && n > 0 && <circle cx="20" cy="20" r={r} fill="none" stroke={habitColor(habit)} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(c * n) / t} ${c}`} />}
        </svg>
      )}
      {done ? <Check className="h-5 w-5" strokeWidth={3} /> : t > 1 ? <Plus className="h-4 w-4 relative" strokeWidth={2.5} /> : null}
    </button>
  );
}

/** Hàng thói quen theo UI mẫu: icon pastel · tên · tiến độ · thanh màu · nút check tròn. */
export const HabitCard = memo(function HabitCard({ habit, date, goalTitle, onOpen, onCheck }: {
  habit: Habit; date: string; goalTitle?: string; onOpen: () => void; onCheck: () => void;
}) {
  const t = targetOf(habit), n = countOn(habit, date), done = n >= t;
  const pct = Math.min(100, (n / t) * 100);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={cn("group flex items-center gap-3.5 rounded-[22px] bg-card border border-border/60 shadow-soft px-3.5 py-3 cursor-pointer transition-all hover:shadow-card hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", done && 'opacity-70')}
    >
      <HabitIcon habit={habit} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className={cn('text-[14.5px] font-semibold truncate', done && 'line-through decoration-foreground/30')}>{habit.name}</p>
          {habit.streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#FF7A45] shrink-0"><Flame className="h-3 w-3" />{habit.streak}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground min-w-0">
          {t > 1 && <span className={cn('shrink-0 font-semibold tabular-nums', done ? 'text-[#22B07D]' : 'text-foreground/80')}>{n}/{t} {habit.targetUnit || 'lần'}</span>}
          {t === 1 && done && <span className="shrink-0 font-semibold text-[#22B07D]">Đã xong</span>}
          {habit.reminderEnabled && habit.reminderTime && <span className="inline-flex items-center gap-0.5 shrink-0"><AlarmClock className="h-3 w-3" />{habit.reminderTime.slice(0, 5)}</span>}
          {goalTitle ? <span className="inline-flex items-center gap-0.5 min-w-0 truncate"><Target className="h-3 w-3 shrink-0" /><span className="truncate">{goalTitle}</span></span>
            : !done && habit.minimumVersion ? <span className="truncate">Tối thiểu: {habit.minimumVersion}</span>
            : !(habit.reminderEnabled && habit.reminderTime) && t === 1 && !done ? <span className="truncate">{habit.frequency === 'daily' ? areaInfo(habit)?.name : FREQUENCY_LABEL[habit.frequency]}</span> : null}
        </div>
        {t > 1 && (
          <div className="mt-2 h-[6px] rounded-full bg-[#EEF0F5] dark:bg-white/10 overflow-hidden max-w-[220px]">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: done ? '#22C38E' : habitColor(habit) }} />
          </div>
        )}
      </div>
      <CheckCircle habit={habit} date={date} onCheck={onCheck} />
    </div>
  );
});
