import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListTodo, Clock, CheckCheck, Pause, Minimize2, Maximize2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Task } from '@/types/lifeos';
import { SortableTaskCard } from './SortableTaskCard';

const COLUMN_CONFIG = {
  todo: {
    icon: ListTodo,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-secondary/50',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
  in_progress: {
    icon: Clock,
    iconColor: 'text-warning',
    bgColor: 'bg-warning/10',
    badgeClass: 'bg-warning/20 text-warning',
  },
  done: {
    icon: CheckCheck,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    badgeClass: 'bg-success/20 text-success',
  },
  deferred: {
    icon: Pause,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

interface KanbanColumnDndProps {
  id: string;
  title: string;
  iconType: keyof typeof COLUMN_CONFIG;
  tasks: Task[];
  isCollapsed: boolean;
  isCompactView: boolean;
  isOver: boolean;
  maxTasks?: number;
  onToggleCollapse: (column: string) => void;
  onTaskClick: (task: Task) => void;
  onStartPomodoro: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export function KanbanColumnDnd({
  id,
  title,
  iconType,
  tasks,
  isCollapsed,
  isCompactView,
  isOver,
  maxTasks = 0,
  onToggleCollapse,
  onTaskClick,
  onStartPomodoro,
  onToggleComplete,
}: KanbanColumnDndProps) {
  const { setNodeRef } = useDroppable({ id });
  const config = COLUMN_CONFIG[iconType];
  const Icon = config.icon;
  
  const [showAll, setShowAll] = useState(false);
  const shouldLimit = maxTasks > 0 && tasks.length > maxTasks && !showAll;
  const visibleTasks = shouldLimit ? tasks.slice(0, maxTasks) : tasks;
  const hiddenCount = tasks.length - maxTasks;

  if (isCollapsed) {
    return (
      <div
        className="flex flex-col items-center bg-secondary/30 rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors w-14"
        onClick={() => onToggleCollapse(id)}
      >
        <Icon className={cn('w-5 h-5', config.iconColor)} />
        <Badge className={cn('mt-2 mb-2', config.badgeClass)}>{tasks.length}</Badge>
        <span className="text-xs font-medium [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
          {title}
        </span>
        <Maximize2 className="w-3 h-3 mt-2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full rounded-xl p-2 -m-2 min-w-0 min-h-0 border-2 border-transparent',
        'transition-all duration-300 ease-out',
        isOver && [config.bgColor, 'border-primary/40 shadow-lg shadow-primary/10 scale-[1.02]']
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 mb-3 shrink-0 bg-background z-10 py-1 rounded-lg transition-all duration-200',
          isOver && 'bg-primary/5'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4 shrink-0 transition-transform duration-200',
            config.iconColor,
            isOver && 'scale-110'
          )}
        />
        <h2 className="font-semibold text-sm truncate">{title}</h2>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full shrink-0 transition-all duration-200',
            config.badgeClass,
            isOver && 'scale-110'
          )}
        >
          {tasks.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 ml-auto shrink-0"
          onClick={() => onToggleCollapse(id)}
        >
          <Minimize2 className="w-3 h-3" />
        </Button>
      </div>

      <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className={cn(
          'flex-1 min-h-0 overflow-y-auto overscroll-y-contain pr-1 transition-all duration-200',
          'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40',
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40',
          isCompactView ? 'space-y-1' : 'space-y-2',
          isOver && 'bg-primary/5 rounded-lg p-1 -m-1'
        )}>
          {visibleTasks.length === 0 && tasks.length === 0 ? (
            <Card
              className={cn(
                'border-dashed transition-all duration-300',
                isOver && 'border-primary border-2 bg-primary/5 scale-105'
              )}
            >
              <CardContent className="p-3 text-center text-muted-foreground">
                <p className={cn('text-xs transition-all duration-200', isOver && 'text-primary font-medium')}>
                  {isOver ? '📥 Thả vào đây' : 'Không có task'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {visibleTasks.map(task => (
                <div 
                  key={task.id}
                  className="animate-fade-in"
                >
                  <SortableTaskCard
                    task={task}
                    isCompactView={isCompactView}
                    onTaskClick={onTaskClick}
                    onStartPomodoro={onStartPomodoro}
                    onToggleComplete={onToggleComplete}
                  />
                </div>
              ))}
              
              {/* Show more button */}
              {shouldLimit && hiddenCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll(true)}
                >
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Xem thêm {hiddenCount} tasks
                </Button>
              )}
              
              {/* Collapse button when showing all */}
              {showAll && maxTasks > 0 && tasks.length > maxTasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll(false)}
                >
                  Thu gọn
                </Button>
              )}
            </>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
