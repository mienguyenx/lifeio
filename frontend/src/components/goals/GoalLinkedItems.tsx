import { useState } from 'react';
import { CheckCircle2, Circle, ListTodo, Repeat, Plus, Link2, Unlink, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GoalLinkedItemsProps {
  goalId: string;
}

export function GoalLinkedItems({ goalId }: GoalLinkedItemsProps) {
  const progressData = useGoalProgress(goalId);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  
  // Use synced store for operations that need to sync to Supabase
  const { updateTask, updateHabit } = useSyncedStore();
  
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');

  if (!progressData) return null;

  const { linkedTasks, linkedHabits, completedTasks, totalTasks, habitProgress, calculatedProgress } = progressData;
  
  // Get unlinked tasks and habits
  const unlinkedTasks = tasks.filter(t => !t.goalId && !t.deletedAt && t.status !== 'done');
  const unlinkedHabits = habits.filter(h => !h.goalId && !h.deletedAt && !h.archivedAt);

  const handleLinkTask = () => {
    if (selectedTaskId) {
      updateTask(selectedTaskId, { goalId });
      setSelectedTaskId('');
      toast.success('Đã liên kết task với goal');
    }
  };

  const handleLinkHabit = () => {
    if (selectedHabitId) {
      updateHabit(selectedHabitId, { goalId, targetDays: 30 });
      setSelectedHabitId('');
      toast.success('Đã liên kết habit với goal');
    }
  };

  const handleUnlinkTask = (taskId: string) => {
    updateTask(taskId, { goalId: undefined });
    toast.success('Đã hủy liên kết task');
  };

  const handleUnlinkHabit = (habitId: string) => {
    updateHabit(habitId, { goalId: undefined });
    toast.success('Đã hủy liên kết habit');
  };

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    updateTask(taskId, { 
      status: currentStatus === 'done' ? 'todo' : 'done',
      completedAt: currentStatus !== 'done' ? new Date().toISOString() : undefined
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Tasks & Habits liên kết
          </CardTitle>
          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Liên kết
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Liên kết Task/Habit với Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Link Task */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ListTodo className="w-4 h-4" /> Liên kết Task
                  </label>
                  <div className="flex gap-2">
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn task..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedTasks.length === 0 ? (
                          <SelectItem value="_none" disabled>Không có task nào</SelectItem>
                        ) : (
                          unlinkedTasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleLinkTask} disabled={!selectedTaskId}>
                      Liên kết
                    </Button>
                  </div>
                </div>

                {/* Link Habit */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Repeat className="w-4 h-4" /> Liên kết Habit
                  </label>
                  <div className="flex gap-2">
                    <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn habit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedHabits.length === 0 ? (
                          <SelectItem value="_none" disabled>Không có habit nào</SelectItem>
                        ) : (
                          unlinkedHabits.map((habit) => (
                            <SelectItem key={habit.id} value={habit.id}>
                              {habit.icon || '📌'} {habit.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleLinkHabit} disabled={!selectedHabitId}>
                      Liên kết
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress tổng hợp</span>
            <span className="font-bold text-primary">{calculatedProgress}%</span>
          </div>
          <Progress value={calculatedProgress} className="h-2" />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Tasks: {completedTasks}/{totalTasks}</span>
            <span>•</span>
            <span>Habits: {habitProgress}%</span>
          </div>
        </div>

        {/* Linked Tasks */}
        {linkedTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ListTodo className="w-4 h-4" /> Tasks ({completedTasks}/{totalTasks})
            </h4>
            <div className="space-y-1">
              {linkedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 group"
                >
                  <button
                    onClick={() => handleToggleTask(task.id, task.status)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn("text-sm", task.status === 'done' && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                  </button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={() => handleUnlinkTask(task.id)}
                  >
                    <Unlink className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Habits */}
        {linkedHabits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Repeat className="w-4 h-4" /> Habits
            </h4>
            <div className="space-y-1">
              {linkedHabits.map((habit) => {
                const targetDays = habit.targetDays || 30;
                const progress = Math.min(100, Math.round((habit.completedDates.length / targetDays) * 100));
                return (
                  <div 
                    key={habit.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 group"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{habit.icon || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm block truncate">{habit.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progress} className="h-1 flex-1" />
                          <span className="text-xs text-muted-foreground">{habit.completedDates.length}/{targetDays}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={() => handleUnlinkHabit(habit.id)}
                    >
                      <Unlink className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {linkedTasks.length === 0 && linkedHabits.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Chưa có task/habit nào được liên kết</p>
            <p className="text-xs mt-1">Liên kết để tự động tính progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
