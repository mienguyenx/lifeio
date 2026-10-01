import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';
import { HabitCheckButton, HabitDots, HabitIconTile, HabitProgressBar, StreakPill, getHabitCount } from './HabitVisuals';

interface HabitCardStandardProps {
  habit: Habit;
  todayStr: string;
  last7Days: string[];
  onToggle: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
  onDelete: () => void;
}

export function HabitCardStandard({ habit, todayStr, last7Days, onToggle, onIncrement, onClick, onDelete }: HabitCardStandardProps) {
  const target = habit.targetPerDay || 1;
  const todayCount = getHabitCount(habit, todayStr);
  const done = todayCount >= target;
  const area = LIFE_AREAS.find((a) => a.id === habit.area);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'group rounded-[22px] bg-card border border-border/70 shadow-soft p-4 cursor-pointer transition-all hover:shadow-card hover:-translate-y-0.5',
        done && 'border-[#22B07D]/30',
      )}
    >
      <div className="flex items-center gap-3">
        <HabitIconTile habit={habit} done={done} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className={cn('text-[14.5px] font-semibold truncate', done && 'text-muted-foreground')}>{habit.name}</h3>
            <StreakPill streak={habit.streak} />
          </div>
          <p className="text-[12.5px] text-muted-foreground truncate">
            {target > 1 ? `${todayCount}/${target} ${habit.targetUnit || 'lần'}` : done ? 'Đã hoàn thành' : 'Chưa thực hiện'} · {area?.name}
          </p>
        </div>
        <HabitCheckButton
          done={done}
          count={todayCount}
          target={target}
          onClick={() => (target > 1 ? (done ? onClick() : onIncrement()) : onToggle())}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="h-8 w-8 -mr-1 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Thao tác">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="w-4 h-4 mr-2" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <HabitProgressBar habit={habit} count={todayCount} target={target} className="mt-3" />

      <div className="mt-3 flex items-center justify-between">
        <HabitDots habit={habit} dates={last7Days} todayStr={todayStr} />
        <span className="text-[11.5px] text-muted-foreground">7 ngày</span>
      </div>
    </div>
  );
}
