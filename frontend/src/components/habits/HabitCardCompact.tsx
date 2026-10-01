import { cn } from '@/lib/utils';
import type { Habit } from '@/types/lifeos';
import { HabitCheckButton, HabitIconTile, HabitProgressBar, StreakPill, getHabitCount } from './HabitVisuals';

interface HabitCardCompactProps {
  habit: Habit;
  todayStr: string;
  onToggle: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
}

export function HabitCardCompact({ habit, todayStr, onToggle, onIncrement, onClick }: HabitCardCompactProps) {
  const target = habit.targetPerDay || 1;
  const todayCount = getHabitCount(habit, todayStr);
  const done = todayCount >= target;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'flex items-center gap-3 p-3 rounded-[18px] border border-border/70 bg-card shadow-soft transition-all cursor-pointer hover:shadow-card',
        done && 'border-[#22B07D]/30',
      )}
    >
      <HabitIconTile habit={habit} done={done} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[13.5px] font-semibold truncate', done && 'text-muted-foreground')}>{habit.name}</span>
          <StreakPill streak={habit.streak} />
        </div>
        {target > 1 ? (
          <div className="flex items-center gap-2 mt-1">
            <HabitProgressBar habit={habit} count={todayCount} target={target} className="flex-1" />
            <span className="text-[11px] text-muted-foreground tabular-nums">{todayCount}/{target}</span>
          </div>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">{done ? 'Đã hoàn thành' : 'Chưa thực hiện'}</p>
        )}
      </div>
      <HabitCheckButton done={done} count={todayCount} target={target} onClick={() => (target > 1 ? (done ? onClick() : onIncrement()) : onToggle())} />
    </div>
  );
}
