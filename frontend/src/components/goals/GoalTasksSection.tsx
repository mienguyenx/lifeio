import { useState } from 'react';
import { Plus, CheckCircle2, Circle, ListTodo, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { Goal, Task } from '@/types/lifeos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface GoalTasksSectionProps {
  goal: Goal;
}

export function GoalTasksSection({ goal }: GoalTasksSectionProps) {
  const tasks = useLifeOSStore((s) => s.tasks);
  
  // Use synced store for operations that need to sync to Supabase
  const { addTask, updateTask, updateGoal, toggleMilestone } = useSyncedStore();

  // Get tasks linked to this goal
  const linkedTasks = tasks.filter(t => t.goalId === goal.id);
  const completedTasks = linkedTasks.filter(t => t.status === 'done');
  const pendingTasks = linkedTasks.filter(t => t.status !== 'done');

  // Create task from milestone
  const handleCreateTaskFromMilestone = (milestone: { id: string; title: string; completed: boolean; taskId?: string }) => {
    if (milestone.taskId) {
      toast.info('Milestone này đã có task liên kết');
      return;
    }

    const newTaskId = crypto.randomUUID();
    
    // Create task
    addTask({
      title: milestone.title,
      description: `Task cho milestone của goal: ${goal.title}`,
      area: goal.area,
      priority: 'medium',
      status: 'todo',
      dueDate: goal.targetDate,
      goalId: goal.id,
      milestoneId: milestone.id,
    });

    // Update milestone with taskId (we need to update the goal's milestones)
    const updatedMilestones = goal.milestones.map(m => 
      m.id === milestone.id ? { ...m, taskId: newTaskId } : m
    );
    updateGoal(goal.id, { milestones: updatedMilestones });

    toast.success('Đã tạo task từ milestone');
  };

  // Create tasks from all milestones
  const handleCreateAllTasks = () => {
    const milestonesWithoutTasks = goal.milestones.filter(m => !m.taskId && !m.completed);
    
    if (milestonesWithoutTasks.length === 0) {
      toast.info('Tất cả milestones đã có task hoặc đã hoàn thành');
      return;
    }

    milestonesWithoutTasks.forEach(milestone => {
      addTask({
        title: milestone.title,
        description: `Task cho milestone của goal: ${goal.title}`,
        area: goal.area,
        priority: 'medium',
        status: 'todo',
        dueDate: goal.targetDate,
        goalId: goal.id,
        milestoneId: milestone.id,
      });
    });

    toast.success(`Đã tạo ${milestonesWithoutTasks.length} tasks từ milestones`);
  };

  // Complete task and sync with milestone
  const handleCompleteTask = (task: Task) => {
    updateTask(task.id, { 
      status: task.status === 'done' ? 'todo' : 'done',
      completedAt: task.status === 'done' ? undefined : new Date().toISOString()
    });

    // If task is linked to a milestone, sync completion
    if (task.milestoneId && task.status !== 'done') {
      const milestone = goal.milestones.find(m => m.id === task.milestoneId);
      if (milestone && !milestone.completed) {
        toggleMilestone(goal.id, task.milestoneId);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListTodo className="w-4 h-4" />
          <span>{completedTasks.length}/{linkedTasks.length} tasks hoàn thành</span>
        </div>
        {!goal.completedAt && goal.milestones.some(m => !m.taskId && !m.completed) && (
          <Button size="sm" variant="outline" onClick={handleCreateAllTasks}>
            <Plus className="w-4 h-4 mr-1" />
            Tạo tất cả Tasks
          </Button>
        )}
      </div>

      {/* Milestones to Tasks */}
      {!goal.completedAt && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Milestones → Tasks</p>
          {goal.milestones.map(milestone => {
            const linkedTask = tasks.find(t => t.milestoneId === milestone.id);
            
            return (
              <Card key={milestone.id} className={cn(milestone.completed && "opacity-60")}>
                <CardContent className="p-3 flex items-center gap-3">
                  {milestone.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-sm flex-1", milestone.completed && "line-through")}>
                    {milestone.title}
                  </span>
                  {linkedTask ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Task: {linkedTask.status === 'done' ? '✅' : '🔄'}
                    </Badge>
                  ) : !milestone.completed && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleCreateTaskFromMilestone(milestone)}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Tạo Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tasks liên kết</p>
          {linkedTasks.map(task => (
            <Card key={task.id} className={cn(task.status === 'done' && "opacity-60")}>
              <CardContent className="p-3 flex items-center gap-3">
                <button onClick={() => handleCompleteTask(task)}>
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                <span className={cn("text-sm flex-1", task.status === 'done' && "line-through")}>
                  {task.title}
                </span>
                <Badge 
                  variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {task.priority}
                </Badge>
              </CardContent>
            </Card>
          ))}
          
          <Link to="/tasks">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Xem tất cả trong Tasks
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {linkedTasks.length === 0 && goal.milestones.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Thêm milestones để tạo tasks liên kết
        </p>
      )}
    </div>
  );
}
