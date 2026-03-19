import { useMemo } from 'react';
import { CheckCircle2, Target, BookOpen, Flame, Calendar, ListTodo } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { type LifeArea, LIFE_AREAS } from '@/types/lifeos';

interface AreaDashboardSectionProps {
  area: LifeArea;
  className?: string;
}

export function AreaDashboardSection({ area, className }: AreaDashboardSectionProps) {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);

  const areaInfo = LIFE_AREAS.find(a => a.id === area);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter data by area
  const areaHabits = useMemo(() => 
    habits.filter(h => h.area === area && !h.deletedAt && !h.archivedAt),
    [habits, area]
  );

  const areaTasks = useMemo(() => 
    tasks.filter(t => t.area === area && !t.deletedAt && t.status !== 'done'),
    [tasks, area]
  );

  const completedTasks = useMemo(() =>
    tasks.filter(t => t.area === area && !t.deletedAt && t.status === 'done').slice(0, 5),
    [tasks, area]
  );

  const areaGoals = useMemo(() => 
    goals.filter(g => g.area === area && !g.deletedAt && !g.completedAt),
    [goals, area]
  );

  const areaJournals = useMemo(() => 
    journalEntries
      .filter(j => j.areas?.includes(area))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [journalEntries, area]
  );

  // Stats
  const stats = useMemo(() => {
    const todayHabitsCompleted = areaHabits.filter(h => h.completedDates.includes(todayStr)).length;
    const totalHabits = areaHabits.length;
    const activeGoals = areaGoals.length;
    const pendingTasks = areaTasks.length;
    
    return { todayHabitsCompleted, totalHabits, activeGoals, pendingTasks };
  }, [areaHabits, areaGoals, areaTasks, todayStr]);

  const getMoodEmoji = (mood: number) => {
    const moods = ['😢', '😔', '😐', '🙂', '😊'];
    return moods[mood - 1] || '😐';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Thói quen hôm nay</span>
            </div>
            <p className="text-xl font-bold">{stats.todayHabitsCompleted}/{stats.totalHabits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Mục tiêu</span>
            </div>
            <p className="text-xl font-bold">{stats.activeGoals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <ListTodo className="w-4 h-4" />
              <span className="text-xs font-medium">Việc cần làm</span>
            </div>
            <p className="text-xl font-bold">{stats.pendingTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Nhật ký</span>
            </div>
            <p className="text-xl font-bold">{areaJournals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Habits, Tasks, Goals, Journal */}
      <Tabs defaultValue="habits" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="habits" className="text-xs sm:text-sm">Thói quen</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs sm:text-sm">Việc làm</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs sm:text-sm">Mục tiêu</TabsTrigger>
          <TabsTrigger value="journal" className="text-xs sm:text-sm">Nhật ký</TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Thói quen {areaInfo?.name} ({areaHabits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areaHabits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Chưa có thói quen nào trong lĩnh vực này
                </p>
              ) : (
                <div className="space-y-2">
                  {areaHabits.map(habit => {
                    const isCompletedToday = habit.completedDates.includes(todayStr);
                    return (
                      <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{habit.icon || areaInfo?.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{habit.name}</p>
                            <p className="text-xs text-muted-foreground">🔥 {habit.streak} ngày</p>
                          </div>
                        </div>
                        <Badge variant={isCompletedToday ? "default" : "secondary"}>
                          {isCompletedToday ? "Đã hoàn thành" : "Chưa làm"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Việc cần làm {areaInfo?.name} ({areaTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areaTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Không có việc cần làm trong lĩnh vực này
                </p>
              ) : (
                <div className="space-y-2">
                  {areaTasks.slice(0, 10).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle2 className={cn(
                          "w-4 h-4 shrink-0",
                          task.status === 'in_progress' ? "text-blue-500" : "text-muted-foreground"
                        )} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              📅 {format(parseISO(task.dueDate), 'dd/MM')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' : 'secondary'
                      } className="text-[10px]">
                        {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Mục tiêu {areaInfo?.name} ({areaGoals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areaGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Chưa có mục tiêu nào trong lĩnh vực này
                </p>
              ) : (
                <div className="space-y-3">
                  {areaGoals.map(goal => (
                    <div key={goal.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{goal.title}</p>
                        <Badge variant="outline">{goal.progress}%</Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      {goal.targetDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          🎯 {format(parseISO(goal.targetDate), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Nhật ký {areaInfo?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areaJournals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Chưa có bài nhật ký nào được gắn thẻ lĩnh vực này
                </p>
              ) : (
                <div className="space-y-2">
                  {areaJournals.map(entry => (
                    <div key={entry.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(entry.date), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                        <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{entry.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
