import { format, isToday as dateFnsIsToday, isTomorrow, isPast, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { cn } from '@/lib/utils';
import { getTodayStart, isToday, isBeforeToday, parseDateInTimezone } from '@/utils/dateUtils';

export default function DashboardUpcoming() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);

  // Use timezone-aware date utilities (GMT+7)
  const now = getTodayStart();
  const weekFromNow = addDays(now, 7);

  // Get upcoming/overdue tasks
  const upcomingTasks = tasks
    .filter((t) => !t.deletedAt && t.status !== 'done' && t.dueDate)
    .map((t) => ({
      ...t,
      dueDate: new Date(t.dueDate!),
      type: 'task' as const
    }))
    .filter((t) => t.dueDate <= weekFromNow)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Get goals with approaching deadlines - use timezone-aware date parsing
  const upcomingGoals = goals
    .filter((g) => !g.deletedAt && g.progress < 100 && g.targetDate)
    .map((g) => ({
      ...g,
      dueDate: parseDateInTimezone(g.targetDate!) || new Date(g.targetDate!),
      type: 'goal' as const
    }))
    .filter((g) => g.dueDate <= weekFromNow)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const allUpcoming = [...upcomingTasks, ...upcomingGoals]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 10);

  const getDateLabel = (date: Date) => {
    if (isPast(date) && !isToday(date)) return 'Quá hạn';
    if (isToday(date)) return 'Hôm nay';
    if (isTomorrow(date)) return 'Ngày mai';
    return format(date, 'EEEE, dd/MM', { locale: vi });
  };

  const getDateColor = (date: Date) => {
    if (isPast(date) && !isToday(date)) return 'text-destructive';
    if (isToday(date)) return 'text-warning';
    return 'text-muted-foreground';
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-destructive/20 text-destructive',
    high: 'bg-warning/20 text-warning',
    medium: 'bg-primary/20 text-primary',
    low: 'bg-muted text-muted-foreground'
  };

  // Determine if we need scroll (more than 4 items)
  const needsScroll = allUpcoming.length > 4;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Sắp tới & Quá hạn
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {allUpcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 px-4">
            Không có deadline trong 7 ngày tới
          </p>
        ) : needsScroll ? (
          <ScrollArea className="h-[280px] px-4">
            <div className="space-y-3 py-2">
              {allUpcoming.map((item) => {
                const isOverdue = isPast(item.dueDate) && !isToday(item.dueDate);
                
                return (
                  <div 
                    key={`${item.type}-${item.id}`} 
                    className={cn(
                      "p-2 rounded-lg border",
                      isOverdue && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {item.type === 'task' ? 'Task' : 'Goal'}
                          </Badge>
                          {item.type === 'task' && (item as any).priority && (
                            <Badge 
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                priorityColors[(item as any).priority] || priorityColors.medium
                              )}
                            >
                              {(item as any).priority}
                            </Badge>
                          )}
                          <span className={cn("text-[10px] flex items-center gap-1", getDateColor(item.dueDate))}>
                            <Clock className="w-3 h-3" />
                            {getDateLabel(item.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-3 py-2 px-4">
            {allUpcoming.map((item) => {
              const isOverdue = isPast(item.dueDate) && !isToday(item.dueDate);
              
              return (
                <div 
                  key={`${item.type}-${item.id}`} 
                  className={cn(
                    "p-2 rounded-lg border",
                    isOverdue && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isOverdue && (
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.type === 'task' ? 'Task' : 'Goal'}
                        </Badge>
                        {item.type === 'task' && (item as any).priority && (
                          <Badge 
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              priorityColors[(item as any).priority] || priorityColors.medium
                            )}
                          >
                            {(item as any).priority}
                          </Badge>
                        )}
                        <span className={cn("text-[10px] flex items-center gap-1", getDateColor(item.dueDate))}>
                          <Clock className="w-3 h-3" />
                          {getDateLabel(item.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
