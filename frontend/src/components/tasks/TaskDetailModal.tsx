import { useState } from 'react';
import { Plus, Trash2, Play, CalendarIcon, Clock, X, Tag, Bell, Repeat, RefreshCw, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Task, type LifeArea, type RecurringSettings } from '@/types/lifeos';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task: taskProp, open, onOpenChange }: TaskDetailModalProps) {
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const taskTags = useLifeOSStore((s) => s.taskTags);
  
  // Use synced store for operations that need to sync to Supabase
  const { 
    updateTask, 
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTaskTag 
  } = useSyncedStore();
  const startPomodoro = usePomodoroStore((s) => s.start);

  // Filter active goals for linking
  const activeGoals = goals.filter(g => !g.deletedAt && g.progress < 100);

  const [newSubtask, setNewSubtask] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  // Get the latest task from store to ensure UI updates
  const task = taskProp ? tasks.find(t => t.id === taskProp.id) ?? taskProp : null;

  if (!task) return null;

  const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const currentTags = task.tags || [];

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  const handleStartPomodoro = () => {
    startPomodoro(task.id);
    updateTask(task.id, { status: 'in_progress' });
    onOpenChange(false);
  };

  const handleSaveEdit = () => {
    if (Object.keys(editedTask).length > 0) {
      updateTask(task.id, editedTask);
    }
    setIsEditing(false);
    setEditedTask({});
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    if (newStatus === 'done') {
      updateTask(task.id, { status: newStatus, completedAt: new Date().toISOString() });
    } else {
      updateTask(task.id, { status: newStatus, completedAt: undefined });
    }
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onOpenChange(false);
  };

  const handleToggleTag = (tagId: string) => {
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    updateTask(task.id, { tags: newTags });
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) return;
    const colors = ['0 84% 60%', '217 91% 60%', '142 71% 45%', '271 91% 65%', '25 95% 53%'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newTagId = await addTaskTag(newTagName.trim(), color);
    updateTask(task.id, { tags: [...currentTags, newTagId] });
    setNewTagName('');
  };

  const handleRecurringChange = (frequency: RecurringSettings['frequency'] | 'none') => {
    if (frequency === 'none') {
      updateTask(task.id, { recurring: undefined });
    } else {
      updateTask(task.id, { recurring: { frequency, interval: 1 } });
    }
  };

  const handleReminderChange = (minutes: string) => {
    const value = minutes === 'none' ? undefined : parseInt(minutes);
    updateTask(task.id, { reminderMinutes: value });
  };

  const priorityColors = {
    high: 'text-destructive',
    medium: 'text-warning',
    low: 'text-success',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-2 pr-6">
            {isEditing ? (
              <Input
                value={editedTask.title ?? task.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="text-lg font-semibold"
              />
            ) : (
              <span className={cn(task.status === 'done' && 'line-through text-muted-foreground')}>
                {task.title}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Chi tiết</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Status & Priority */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={task.status} onValueChange={(v) => handleStatusChange(v as Task['status'])}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">📋 Todo</SelectItem>
                  <SelectItem value="in_progress">⏳ Đang làm</SelectItem>
                  <SelectItem value="deferred">⏸️ Tạm hoãn</SelectItem>
                  <SelectItem value="done">✅ Hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              {isEditing ? (
                <Select
                  value={editedTask.priority ?? task.priority}
                  onValueChange={(v) => setEditedTask({ ...editedTask, priority: v as Task['priority'] })}
                >
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Cao</SelectItem>
                    <SelectItem value="medium">🟡 TB</SelectItem>
                    <SelectItem value="low">🟢 Thấp</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={cn('h-9 px-3', priorityColors[task.priority])}>
                  {task.priority === 'high' ? '🔴 Cao' : task.priority === 'medium' ? '🟡 TB' : '🟢 Thấp'}
                </Badge>
              )}

              {isEditing ? (
                <Select
                  value={editedTask.area ?? task.area ?? 'none'}
                  onValueChange={(v) => setEditedTask({ ...editedTask, area: v === 'none' ? undefined : v as LifeArea })}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Chọn lĩnh vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    {LIFE_AREAS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.icon} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : area ? (
                <Badge
                  variant="secondary"
                  className="h-9 px-3"
                  style={{
                    backgroundColor: `hsl(var(--area-${task.area}) / 0.2)`,
                    color: `hsl(var(--area-${task.area}))`,
                  }}
                >
                  {area.icon} {area.name}
                </Badge>
              ) : null}
            </div>

            {/* Goal Link */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Target className="w-3 h-3" /> Liên kết Goal
              </Label>
              <Select
                value={task.goalId ?? 'none'}
                onValueChange={(v) => updateTask(task.id, { 
                  goalId: v === 'none' ? undefined : v,
                  milestoneId: v === 'none' ? undefined : task.milestoneId 
                })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn goal liên kết" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không liên kết</SelectItem>
                  {activeGoals.map((goal) => {
                    const goalArea = LIFE_AREAS.find((a) => a.id === goal.area);
                    return (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goalArea?.icon} {goal.title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {task.goalId && (() => {
                const linkedGoal = goals.find(g => g.id === task.goalId);
                if (!linkedGoal) return null;
                return (
                  <div className="mt-2 p-2 rounded-lg bg-secondary/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{linkedGoal.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {linkedGoal.progress}%
                      </Badge>
                    </div>
                    {linkedGoal.milestones.length > 0 && (
                      <Select
                        value={task.milestoneId ?? 'none'}
                        onValueChange={(v) => updateTask(task.id, { milestoneId: v === 'none' ? undefined : v })}
                      >
                        <SelectTrigger className="h-7 mt-2 text-xs">
                          <SelectValue placeholder="Chọn milestone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không chọn milestone</SelectItem>
                          {linkedGoal.milestones.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.completed ? '✅' : '⬜'} {m.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Tag className="w-3 h-3" /> Tags
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {taskTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={currentTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all"
                    style={currentTags.includes(tag.id) ? { backgroundColor: `hsl(${tag.color})` } : {}}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Tag mới..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                    className="h-6 w-24 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleAddNewTag}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Due Date & Pomodoros */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedTask.dueDate ?? task.dueDate ?? ''}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value || undefined })}
                    className="h-8 w-auto"
                  />
                ) : task.dueDate ? (
                  <span>{format(parseISO(task.dueDate), 'dd/MM/yyyy', { locale: vi })}</span>
                ) : (
                  <span className="text-muted-foreground">Chưa đặt</span>
                )}
              </div>
              {task.estimatedPomodoros && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>🍅 {task.completedPomodoros}/{task.estimatedPomodoros}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground">Mô tả</Label>
              {isEditing ? (
                <Textarea
                  value={editedTask.description ?? task.description ?? ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value || undefined })}
                  placeholder="Thêm mô tả..."
                  className="mt-1 min-h-[80px]"
                />
              ) : (
                <p className="text-sm mt-1 text-muted-foreground">{task.description || 'Chưa có mô tả'}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Subtasks {subtasks.length > 0 && <span className="text-muted-foreground">({completedSubtasks}/{subtasks.length})</span>}
              </Label>
            </div>
            
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-secondary/50">
                  <Checkbox checked={subtask.completed} onCheckedChange={() => toggleSubtask(task.id, subtask.id)} />
                  <span className={cn('flex-1 text-sm', subtask.completed && 'line-through text-muted-foreground')}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Thêm subtask mới..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  className="h-9"
                />
                <Button size="sm" onClick={handleAddSubtask}>
                  <Plus className="w-4 h-4 mr-1" /> Thêm
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Recurring */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Repeat className="w-4 h-4" /> Lặp lại
              </Label>
              <Select
                value={task.recurring?.frequency ?? 'none'}
                onValueChange={(v) => handleRecurringChange(v as RecurringSettings['frequency'] | 'none')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tần suất lặp lại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không lặp lại</SelectItem>
                  <SelectItem value="daily">Hàng ngày</SelectItem>
                  <SelectItem value="weekly">Hàng tuần</SelectItem>
                  <SelectItem value="monthly">Hàng tháng</SelectItem>
                </SelectContent>
              </Select>
              {task.recurring && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Task sẽ tự động tạo lại khi hoàn thành
                </p>
              )}
            </div>

            {/* Reminder */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" /> Nhắc nhở trước deadline
              </Label>
              <Select
                value={task.reminderMinutes?.toString() ?? 'none'}
                onValueChange={handleReminderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thời gian nhắc nhở" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không nhắc nhở</SelectItem>
                  <SelectItem value="15">15 phút trước</SelectItem>
                  <SelectItem value="30">30 phút trước</SelectItem>
                  <SelectItem value="60">1 giờ trước</SelectItem>
                  <SelectItem value="120">2 giờ trước</SelectItem>
                  <SelectItem value="1440">1 ngày trước</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Time picker for specific reminder time */}
              {task.reminderMinutes && task.dueDate && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Giờ nhắc nhở cụ thể (tùy chọn)</Label>
                  <Input
                    type="time"
                    value={task.reminderTime || ''}
                    onChange={(e) => {
                      const time = e.target.value || undefined;
                      updateTask(task.id, { reminderTime: time });
                    }}
                    className="h-9"
                    placeholder="HH:mm"
                  />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                    {task.reminderTime ? (
                      <>
                        Sẽ nhắc nhở vào {task.reminderTime} ngày {format(parseISO(task.dueDate), 'dd/MM', { locale: vi })}
                      </>
                    ) : (
                      <>
                  Sẽ nhắc nhở vào{' '}
                  {format(
                    new Date(new Date(task.dueDate).getTime() - task.reminderMinutes * 60000),
                    'HH:mm dd/MM',
                    { locale: vi }
                        )}
                      </>
                  )}
                </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t mt-4">
          {task.status !== 'done' && (
            <Button onClick={handleStartPomodoro} size="sm" className="gap-1">
              <Play className="w-4 h-4" /> Pomodoro
            </Button>
          )}

          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditedTask({}); }}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>Lưu</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </Button>
          )}

          <Button variant="destructive" size="icon" className="ml-auto h-8 w-8" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
