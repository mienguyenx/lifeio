import { CheckCircle2, Flame, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';

interface HabitCardCompactProps {
  habit: Habit;
  todayStr: string;
  onToggle: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
}

export function HabitCardCompact({ 
  habit, 
  todayStr, 
  onToggle, 
  onIncrement, 
  onDecrement, 
  onClick 
}: HabitCardCompactProps) {
  const target = habit.targetPerDay || 1;
  const todayCompletion = habit.completions?.find(c => c.date === todayStr);
  const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
  const isCompletedToday = todayCount >= target;
  const area = LIFE_AREAS.find((a) => a.id === habit.area);

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-pointer hover:bg-accent/50',
        isCompletedToday && 'border-success/50 bg-success/5'
      )}
      onClick={onClick}
    >
      {/* Toggle Button */}
      {target > 1 ? (
        <div 
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            // Bấm vào vùng này mở modal
            onClick();
          }}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all cursor-pointer',
              isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
            )}
            style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
            title="Bấm để mở chi tiết và điều chỉnh"
          >
            {isCompletedToday ? <CheckCircle2 className="w-5 h-5" /> : `${todayCount}/${target}`}
          </div>
        </div>
      ) : (
        <button
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 transition-all touch-manipulation',
            isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
          )}
          style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isCompletedToday ? <CheckCircle2 className="w-5 h-5" /> : (habit.icon || area?.icon)}
        </button>
      )}

      {/* Name */}
      <span className={cn(
        'flex-1 font-medium truncate',
        isCompletedToday && 'text-muted-foreground line-through'
      )}>
        {habit.name}
      </span>

      {/* Streak Badge */}
      {habit.streak > 0 && (
        <div className="flex items-center gap-1 text-streak bg-streak/10 px-2 py-0.5 rounded-full">
          <Flame className="w-3 h-3" />
          <span className="text-xs font-bold">{habit.streak}</span>
        </div>
      )}
    </div>
  );
}
