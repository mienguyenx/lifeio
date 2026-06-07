import { useMemo } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import { 
  Target, Clock, Timer, Lightbulb, TrendingUp, 
  AlertTriangle, Calendar, Flame, BarChart3, Award
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Task, LIFE_AREAS } from '@/types/lifeos';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';

interface TasksSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onQuickFilter: (filter: 'today' | 'overdue' | 'high') => void;
}

const PRODUCTIVITY_TIPS = [
  { icon: '💪', tip: 'Tập trung vào 3 tasks quan trọng nhất mỗi ngày' },
  { icon: '⏰', tip: 'Sử dụng Pomodoro 25 phút để duy trì tập trung' },
  { icon: '📝', tip: 'Chia nhỏ tasks lớn thành subtasks dễ quản lý' },
  { icon: '🎯', tip: 'Review và cập nhật tasks vào cuối ngày' },
];

export function TasksSidebar({ isOpen, onClose, tasks, onQuickFilter }: TasksSidebarProps) {
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();

  // Today's progress
  const todayStats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.archived && !t.deletedAt);
    const todayTasks = activeTasks.filter(t => t.dueDate === todayStr);
    const completedToday = activeTasks.filter(t => t.completedAt?.startsWith(todayStr)).length;
    const total = todayTasks.length || activeTasks.filter(t => t.status !== 'done').length;
    const progress = total > 0 ? Math.round((completedToday / total) * 100) : 0;
    return { completedToday, total, progress };
  }, [tasks, todayStr]);

  // Upcoming deadlines (top tasks by urgency)
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter(t => t.dueDate && !t.archived && t.status !== 'done')
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
      .slice(0, 3)
      .map(t => {
        const dueDate = parseISO(t.dueDate!);
        const daysUntil = differenceInDays(dueDate, today);
        return { ...t, daysUntil };
      });
  }, [tasks, today]);

  // Overdue count
  const overdueCount = useMemo(() => {
    return tasks.filter(t => {
      if (!t.dueDate || t.archived || t.status === 'done') return false;
      return parseISO(t.dueDate) < today;
    }).length;
  }, [tasks, today]);

  // High priority count
  const highPriorityCount = useMemo(() => {
    return tasks.filter(t => t.priority === 'high' && !t.archived && t.status !== 'done').length;
  }, [tasks]);

  // Pomodoro stats
  const pomodoroStats = useMemo(() => {
    const todayPomodoros = pomodoroSessions.filter(
      s => s.completedAt.startsWith(todayStr) && s.phase === 'work'
    );
    const totalMinutes = todayPomodoros.reduce((acc, s) => acc + s.duration, 0);
    return {
      sessions: todayPomodoros.length,
      minutes: totalMinutes,
    };
  }, [pomodoroSessions, todayStr]);

  // Quick stats
  const quickStats = useMemo(() => {
    const inProgress = tasks.filter(t => t.status === 'in_progress' && !t.archived).length;
    const todo = tasks.filter(t => t.status === 'todo' && !t.archived).length;
    const completedThisWeek = tasks.filter(t => {
      if (t.status !== 'done' || !t.completedAt) return false;
      const completedDate = parseISO(t.completedAt);
      return differenceInDays(today, completedDate) <= 7;
    }).length;
    return { inProgress, todo, completedThisWeek };
  }, [tasks, today]);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "hidden xl:block transition-all duration-300 shrink-0",
      isOpen ? "w-72" : "w-0"
    )}>
      {isOpen && (
        <div className="sticky top-4 pl-4 pb-4 space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {/* Help Button */}
          <div className="flex justify-end">
            <ModuleHelpButton module="tasks" />
          </div>

          {/* Progress Today - Large display like Habits */}
          <div className="rounded-xl bg-card border p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tiến độ hôm nay</span>
            </div>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold tracking-tight">
                {todayStats.completedToday}/{todayStats.total}
              </p>
              <p className="text-sm text-muted-foreground mt-1">tasks hoàn thành</p>
            </div>
            <Progress value={todayStats.progress} className="h-2" />
          </div>

          {/* Sắp đến hạn - Like Top Streaks */}
          {upcomingDeadlines.length > 0 && (
            <div className="rounded-xl bg-card border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sắp đến hạn</span>
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.map((task, index) => {
                  const area = task.area ? LIFE_AREAS.find(a => a.id === task.area) : null;
                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm truncate flex-1">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span>{area?.icon || '📋'}</span>
                        <span className="truncate">{task.title}</span>
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "shrink-0 ml-2",
                          task.daysUntil < 0 && "text-destructive border-destructive/30",
                          task.daysUntil === 0 && "text-warning border-warning/30"
                        )}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {task.daysUntil < 0 
                          ? `${Math.abs(task.daysUntil)}d`
                          : task.daysUntil === 0 
                            ? 'Nay'
                            : `${task.daysUntil}d`
                        }
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Filters - Compact */}
          <div className="rounded-xl bg-card border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lọc nhanh</span>
            </div>
            <div className="space-y-2">
              <button 
                className="w-full flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"
                onClick={() => onQuickFilter('today')}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Hôm nay
                </span>
                <span className="text-muted-foreground">{todayStats.total}</span>
              </button>
              <button 
                className={cn(
                  "w-full flex items-center justify-between py-2 text-sm transition-colors",
                  overdueCount > 0 ? "text-destructive hover:text-destructive/80" : "hover:text-primary"
                )}
                onClick={() => onQuickFilter('overdue')}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Quá hạn
                </span>
                <span className={overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {overdueCount}
                </span>
              </button>
              <button 
                className="w-full flex items-center justify-between py-2 text-sm hover:text-primary transition-colors"
                onClick={() => onQuickFilter('high')}
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-warning" />
                  Ưu tiên cao
                </span>
                <span className="text-muted-foreground">{highPriorityCount}</span>
              </button>
            </div>
          </div>

          {/* Pomodoro & Stats Combined */}
          <div className="rounded-xl bg-card border p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thống kê</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  Pomodoro hôm nay
                </span>
                <span className="font-medium">{pomodoroStats.sessions} 🍅</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Đang làm</span>
                <span className="font-medium">{quickStats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Chờ xử lý</span>
                <span className="font-medium">{quickStats.todo}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Hoàn thành tuần này</span>
                <span className="font-medium text-success">{quickStats.completedThisWeek}</span>
              </div>
            </div>
          </div>

          {/* Tips - Like Habits page */}
          <div className="rounded-xl bg-card border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mẹo Productivity</span>
            </div>
            <div className="space-y-3">
              {PRODUCTIVITY_TIPS.map((item, index) => (
                <p key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span>{item.icon}</span>
                  <span>{item.tip}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
