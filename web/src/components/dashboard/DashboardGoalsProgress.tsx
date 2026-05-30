import { Target, Link, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, Goal } from '@/types/lifeos';

const THRESHOLD = 4;

interface GoalsListProps {
  goals: Goal[];
  getAreaInfo: (areaId: string) => typeof LIFE_AREAS[number] | undefined;
  getLinkedCounts: (goalId: string) => { tasks: number; completedTasks: number; habits: number };
}

function GoalsList({ goals, getAreaInfo, getLinkedCounts }: GoalsListProps) {
  return (
    <div className="space-y-4 py-2">
      {goals.map((goal) => {
        const area = getAreaInfo(goal.area);
        const linked = getLinkedCounts(goal.id);
        
        return (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{goal.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {area && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {area.icon} {area.name}
                    </Badge>
                  )}
                  {(linked.tasks > 0 || linked.habits > 0) && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Link className="w-3 h-3" />
                      {linked.tasks > 0 && (
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          {linked.completedTasks}/{linked.tasks}
                        </span>
                      )}
                      {linked.habits > 0 && (
                        <span>{linked.habits} habits</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-primary shrink-0">
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardGoalsProgress() {
  const goals = useLifeOSStore((s) => s.goals);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);

  const activeGoals = goals
    .filter((g) => !g.deletedAt && g.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);
  
  const needsScroll = activeGoals.length > THRESHOLD;

  const getAreaInfo = (areaId: string) => {
    return LIFE_AREAS.find((a) => a.id === areaId);
  };

  const getLinkedCounts = (goalId: string) => {
    const linkedTasks = tasks.filter((t) => !t.deletedAt && t.goalId === goalId);
    const linkedHabits = habits.filter((h) => !h.deletedAt && !h.archivedAt && h.goalId === goalId);
    const completedTasks = linkedTasks.filter((t) => t.status === 'done');
    
    return {
      tasks: linkedTasks.length,
      completedTasks: completedTasks.length,
      habits: linkedHabits.length
    };
  };

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Mục tiêu đang thực hiện
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có mục tiêu nào đang thực hiện
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Mục tiêu đang thực hiện ({activeGoals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {needsScroll ? (
          <ScrollArea className="h-[280px] px-4">
            <GoalsList goals={activeGoals} getAreaInfo={getAreaInfo} getLinkedCounts={getLinkedCounts} />
          </ScrollArea>
        ) : (
          <div className="px-4 pb-4">
            <GoalsList goals={activeGoals} getAreaInfo={getAreaInfo} getLinkedCounts={getLinkedCounts} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
