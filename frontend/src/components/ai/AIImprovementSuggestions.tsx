import { useState } from 'react';
import { Sparkles, Plus, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { LIFE_AREAS, type LifeArea, type Habit, type Task } from '@/types/lifeos';
import { toast } from 'sonner';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';
import { cn } from '@/lib/utils';

interface AISuggestion {
  habits: Array<{
    name: string;
    description: string;
    frequency: 'daily' | 'weekly';
    area: string;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    area: string;
  }>;
  insights: string;
}

export function AIImprovementSuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addedHabits, setAddedHabits] = useState<string[]>([]);
  const [addedTasks, setAddedTasks] = useState<string[]>([]);

  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const user = useLifeOSStore((s) => s.user);
  
  // Use synced store for operations that need to sync to Supabase
  const { addHabit, addTask } = useSyncedStore();

  // Get latest scores and find lowest areas
  const latestScores = lifeWheelScores[0]?.scores || 
    Object.fromEntries(LIFE_AREAS.map(a => [a.id, 5])) as Record<LifeArea, number>;

  const sortedAreas = LIFE_AREAS
    .map(a => ({ ...a, score: latestScores[a.id] || 5 }))
    .sort((a, b) => a.score - b.score);
  const lowestAreas = sortedAreas.slice(0, 3);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setSuggestions(null);
    setAddedHabits([]);
    setAddedTasks([]);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        functionUrl('ai-suggest'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            type: 'suggest-improvements',
            lowestAreas: lowestAreas.map(a => ({ id: a.id, name: a.name, score: a.score })),
            userContext: {
              lifePurpose: user?.lifePurpose,
              personalValues: user?.personalValues
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Lỗi', { description: error instanceof Error ? error.message : 'Không thể tải gợi ý' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHabit = (habit: AISuggestion['habits'][0]) => {
    const areaId = habit.area as LifeArea;
    const validArea = LIFE_AREAS.find(a => a.id === areaId) ? areaId : 'health';

    const newHabit: Omit<Habit, 'id' | 'createdAt'> = {
      name: habit.name,
      description: habit.description,
      area: validArea,
      frequency: habit.frequency,
      streak: 0,
      completedDates: [],
    };

    addHabit(newHabit);
    setAddedHabits(prev => [...prev, habit.name]);
    toast.success('Đã thêm thói quen', { description: habit.name });
  };

  const handleAddTask = (task: AISuggestion['tasks'][0]) => {
    const areaId = task.area as LifeArea;
    const validArea = LIFE_AREAS.find(a => a.id === areaId) ? areaId : 'personal';

    const newTask: Omit<Task, 'id' | 'createdAt'> = {
      title: task.title,
      description: task.description,
      area: validArea,
      priority: task.priority,
      status: 'todo',
      subtasks: [],
      tags: [],
      completedPomodoros: 0
    };

    addTask(newTask);
    setAddedTasks(prev => [...prev, task.title]);
    toast.success('Đã thêm task', { description: task.title });
  };

  const getAreaInfo = (areaId: string) => {
    return LIFE_AREAS.find(a => a.id === areaId) || { icon: '📌', name: areaId };
  };

  const priorityColors = {
    high: 'bg-destructive/20 text-destructive',
    medium: 'bg-warning/20 text-warning',
    low: 'bg-muted text-muted-foreground'
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">AI Đề xuất cải thiện</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchSuggestions}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">{suggestions ? 'Làm mới' : 'Phân tích'}</span>
          </Button>
        </div>
        <CardDescription>
          Dựa trên điểm Life Wheel, AI sẽ đề xuất habits & tasks phù hợp
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Areas to improve */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Mảng cần cải thiện:</p>
          <div className="flex gap-2 flex-wrap">
            {lowestAreas.map((area) => (
              <Badge key={area.id} variant="secondary" className="text-xs">
                {area.icon} {area.name}: {area.score}/10
              </Badge>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI đang phân tích và đề xuất...</p>
          </div>
        )}

        {!isLoading && !suggestions && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Nhấn "Phân tích" để AI đề xuất habits và tasks giúp cải thiện các mảng yếu
            </p>
            <Button onClick={fetchSuggestions}>
              <Sparkles className="w-4 h-4 mr-2" />
              Bắt đầu phân tích
            </Button>
          </div>
        )}

        {suggestions && (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {/* Insights */}
              {suggestions.insights && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{suggestions.insights}</p>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Habits */}
              {suggestions.habits && suggestions.habits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    🎯 Thói quen đề xuất ({suggestions.habits.length})
                  </h4>
                  <div className="space-y-2">
                    {suggestions.habits.map((habit, i) => {
                      const area = getAreaInfo(habit.area);
                      const isAdded = addedHabits.includes(habit.name);
                      
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "p-3 rounded-lg border",
                            isAdded && "bg-success/10 border-success/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span>{area.icon}</span>
                                <span className="font-medium text-sm">{habit.name}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {habit.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{habit.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isAdded ? "ghost" : "default"}
                              className="shrink-0"
                              onClick={() => handleAddHabit(habit)}
                              disabled={isAdded}
                            >
                              {isAdded ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested Tasks */}
              {suggestions.tasks && suggestions.tasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    ✅ Tasks đề xuất ({suggestions.tasks.length})
                  </h4>
                  <div className="space-y-2">
                    {suggestions.tasks.map((task, i) => {
                      const area = getAreaInfo(task.area);
                      const isAdded = addedTasks.includes(task.title);
                      
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "p-3 rounded-lg border",
                            isAdded && "bg-success/10 border-success/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span>{area.icon}</span>
                                <span className="font-medium text-sm">{task.title}</span>
                                <Badge className={cn("text-[10px]", priorityColors[task.priority])}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isAdded ? "ghost" : "default"}
                              className="shrink-0"
                              onClick={() => handleAddTask(task)}
                              disabled={isAdded}
                            >
                              {isAdded ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
