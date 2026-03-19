import { format, parseISO } from 'date-fns';
import { Play, CheckCircle2, Circle, Repeat, Bell, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, Task } from '@/types/lifeos';
import { useLifeOSStore } from '@/stores/useLifeOSStore';

interface TaskCardStaticProps {
  task: Task;
  isCompactView: boolean;
  onTaskClick: (task: Task) => void;
  onStartPomodoro: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export function TaskCardStatic({
  task,
  isCompactView,
  onTaskClick,
  onStartPomodoro,
  onToggleComplete,
}: TaskCardStaticProps) {
  const goals = useLifeOSStore((s) => s.goals);
  const taskTags = useLifeOSStore((s) => s.taskTags);

  const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
  const linkedGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;
  const isDone = task.status === 'done';
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const tags = (task.tags || [])
    .map((tagId) => taskTags.find((t) => t.id === tagId))
    .filter(Boolean);
  const today = new Date();

  if (isCompactView) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-1.5 rounded border-l-2 bg-card hover:bg-secondary/50 transition-all',
          isDone && 'opacity-60',
          task.priority === 'high'
            ? 'border-l-destructive'
            : task.priority === 'medium'
              ? 'border-l-warning'
              : 'border-l-muted'
        )}
        onClick={() => onTaskClick(task)}
      >
        <button
          className="touch-manipulation shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
        >
          {isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            <Circle
              className={cn(
                'w-3.5 h-3.5',
                task.priority === 'high'
                  ? 'text-destructive'
                  : task.priority === 'medium'
                    ? 'text-warning'
                    : 'text-muted-foreground'
              )}
            />
          )}
        </button>
        <span className={cn('text-xs truncate flex-1', isDone && 'line-through text-muted-foreground')}>
          {task.title}
        </span>
        {task.dueDate && (
          <span
            className={cn(
              'text-[9px] shrink-0',
              parseISO(task.dueDate) < today && !isDone ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {format(parseISO(task.dueDate), 'dd/MM')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="transition-all duration-300 ease-out">
      <Card
        className={cn(
          'hover:shadow-lg border-l-2 select-none',
          'transition-all duration-300 ease-out',
          isDone && 'opacity-60',
          'hover:scale-[1.02]',
          task.priority === 'high'
            ? 'border-l-destructive'
            : task.priority === 'medium'
              ? 'border-l-warning'
              : 'border-l-muted'
        )}
      >
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <button
              className="touch-manipulation shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task);
              }}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Circle
                  className={cn(
                    'w-4 h-4',
                    task.priority === 'high'
                      ? 'text-destructive'
                      : task.priority === 'medium'
                        ? 'text-warning'
                        : 'text-muted-foreground'
                  )}
                />
              )}
            </button>

            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTaskClick(task)}>
              <div className="flex items-center gap-1">
                <p className={cn('font-medium text-sm truncate flex-1', isDone && 'line-through text-muted-foreground')}>
                  {task.title}
                </p>
                <div className="flex items-center gap-0.5 shrink-0">
                  {task.recurring && <Repeat className="w-3 h-3 text-primary" />}
                  {task.reminderMinutes && <Bell className="w-3 h-3 text-warning" />}
                  {subtasks.length > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ✓{completedSubtasks}/{subtasks.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                {area && <span>{area.icon}</span>}
                {task.dueDate && (
                  <span className={cn(parseISO(task.dueDate) < today && !isDone && 'text-destructive font-medium')}>
                    {format(parseISO(task.dueDate), 'dd/MM')}
                  </span>
                )}
                {task.estimatedPomodoros && (
                  <span>
                    🍅{task.completedPomodoros}/{task.estimatedPomodoros}
                  </span>
                )}
                {tags.length > 0 &&
                  tags.slice(0, 1).map(
                    (tag) =>
                      tag && (
                        <span
                          key={tag.id}
                          className="px-1 py-0 rounded text-[9px]"
                          style={{
                            backgroundColor: `hsl(${tag.color})`,
                            color: 'hsl(var(--primary-foreground))',
                          }}
                        >
                          {tag.name}
                        </span>
                      )
                  )}
                {linkedGoal && (
                  <span className="flex items-center gap-1 px-1 py-0 rounded bg-primary/10 text-primary text-[9px]">
                    <Target className="w-2.5 h-2.5" />
                    <span className="max-w-[60px] truncate">{linkedGoal.title}</span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                        <span
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${linkedGoal.progress}%` }}
                        />
                      </span>
                      <span className="text-[8px]">{linkedGoal.progress}%</span>
                    </span>
                  </span>
                )}
              </div>
            </div>

            {!isDone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-pomodoro-work shrink-0 hover:bg-pomodoro-work/10 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartPomodoro(task);
                }}
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
