import { CheckCircle2, Flame, MoreVertical, Minus, Plus, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';

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

export function HabitCardStandard({ 
  habit, 
  todayStr,
  last7Days,
  onToggle, 
  onIncrement, 
  onDecrement, 
  onClick,
  onDelete,
}: HabitCardStandardProps) {
  const target = habit.targetPerDay || 1;
  const todayCompletion = habit.completions?.find(c => c.date === todayStr);
  const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
  const isCompletedToday = todayCount >= target;
  const area = LIFE_AREAS.find((a) => a.id === habit.area);

  const getCompletionCount = (date: string) => {
    const completion = habit.completions?.find(c => c.date === date);
    return completion?.count || (habit.completedDates.includes(date) ? 1 : 0);
  };

  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all cursor-pointer hover:shadow-md',
        isCompletedToday && 'ring-2 ring-success/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Hiển thị trạng thái: target > 1 hiện số đếm (mở modal khi bấm), target <= 1 hiện toggle button */}
          {target > 1 ? (
            <div 
              className="flex flex-col items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                // Bấm vào vùng này mở modal
                onClick();
              }}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all cursor-pointer',
                  isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
                )}
                style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
                title="Bấm để mở chi tiết và điều chỉnh"
              >
                {isCompletedToday ? <CheckCircle2 className="w-6 h-6" /> : `${todayCount}/${target}`}
              </div>
            </div>
          ) : (
            <button
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all touch-manipulation',
                isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
              )}
              style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isCompletedToday ? <CheckCircle2 className="w-6 h-6" /> : (habit.icon || area?.icon)}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{habit.name}</h3>
              {habit.streak > 0 && (
                <div className="flex items-center gap-1 text-streak bg-streak/10 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" />
                  <span className="text-xs font-bold">{habit.streak}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{area?.name}</p>
            
            {/* Target Progress (if has target > 1) */}
            {target > 1 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Hôm nay</span>
                  <span>{todayCount}/{target} {habit.targetUnit || 'lần'}</span>
                </div>
                <Progress value={(todayCount / target) * 100} className="h-1.5" />
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="shrink-0"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

        {/* Mini 7-day progress instead of 30-day heatmap */}
        <div className="mt-3 flex items-center gap-1.5">
          {last7Days.map((date) => {
            const count = getCompletionCount(date);
            const isComplete = count >= target;
            const isPartial = count > 0 && count < target;
            const isToday = date === todayStr;
            return (
              <div
                key={date}
                className={cn(
                  'w-4 h-4 rounded-sm transition-colors',
                  isComplete ? 'bg-success' : isPartial ? 'bg-success/40' : 'bg-secondary',
                  isToday && 'ring-1 ring-primary ring-offset-1 ring-offset-background'
                )}
                title={`${date}: ${count}/${target}`}
              />
            );
          })}
          <span className="text-xs text-muted-foreground ml-1">7 ngày</span>
        </div>
      </CardContent>
    </Card>
  );
}
