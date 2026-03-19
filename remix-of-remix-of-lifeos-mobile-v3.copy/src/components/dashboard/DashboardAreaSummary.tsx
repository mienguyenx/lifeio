import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';

export default function DashboardAreaSummary() {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Get latest scores
  const latestScores = lifeWheelScores[lifeWheelScores.length - 1]?.scores || 
    Object.fromEntries(LIFE_AREAS.map(a => [a.id, 5])) as Record<LifeArea, number>;

  // Calculate activity per area
  const areaData = LIFE_AREAS.map((area) => {
    const areaHabits = habits.filter((h) => !h.deletedAt && !h.archivedAt && h.area === area.id);
    const completedToday = areaHabits.filter((h) => h.completedDates.includes(todayStr)).length;
    
    const areaTasks = tasks.filter((t) => !t.deletedAt && t.area === area.id && t.status !== 'done');
    const areaGoals = goals.filter((g) => !g.deletedAt && g.area === area.id && g.progress < 100);
    
    const score = latestScores[area.id] || 5;
    
    return {
      ...area,
      score,
      habitsTotal: areaHabits.length,
      habitsCompleted: completedToday,
      tasksCount: areaTasks.length,
      goalsCount: areaGoals.length,
      activityLevel: areaHabits.length + areaTasks.length + areaGoals.length
    };
  }).sort((a, b) => b.activityLevel - a.activityLevel);

  // Show top 6 areas with most activity
  const topAreas = areaData.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tổng quan theo Area</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {topAreas.map((area) => (
            <div key={area.id} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{area.icon}</span>
                <span className="text-sm font-medium truncate">{area.name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Điểm</span>
                  <span className="font-semibold">{area.score.toFixed(1)}/10</span>
                </div>
                <Progress value={area.score * 10} className="h-1.5" />
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-center">
                <div>
                  <p className="text-sm font-bold">{area.habitsCompleted}/{area.habitsTotal}</p>
                  <p className="text-[9px] text-muted-foreground">Habits</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{area.tasksCount}</p>
                  <p className="text-[9px] text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{area.goalsCount}</p>
                  <p className="text-[9px] text-muted-foreground">Goals</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
