import { useState } from 'react';
import { format, parseISO, differenceInDays, isPast, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  CheckCircle2, Circle, Plus, Trash2, Calendar, AlertTriangle, 
  Target, Edit2, Save, X, Flag, TrendingUp, Clock, Bell, BellOff, ListTodo, BarChart3, Sparkles, Link2, Users, Flame
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { LIFE_AREAS, type LifeArea, type Goal, type GoalActivity } from '@/types/lifeos';
import { GoalTasksSection } from './GoalTasksSection';
import { GoalProgressChart } from './GoalProgressChart';
import { VisionBoardCard } from './VisionBoardCard';
import { GoalDependencies } from './GoalDependencies';
import { GoalSharing } from './GoalSharing';
import { GoalCollaborationCard } from './GoalCollaborationCard';
import { GoalLinkedItems } from './GoalLinkedItems';
import { toast } from 'sonner';

interface GoalDetailModalProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalDetailModal({ goal: goalProp, open, onOpenChange }: GoalDetailModalProps) {
  const goals = useLifeOSStore((s) => s.goals);
  
  // Use synced store for all CRUD operations
  const { updateGoal, deleteGoal, toggleMilestone } = useSyncedStore();
  
  // Get the latest goal from store to ensure UI updates
  const goal = goalProp ? goals.find(g => g.id === goalProp.id) ?? goalProp : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: goalProp.title,
    description: goalProp.description || '',
    area: goalProp.area,
    targetDate: goalProp.targetDate || '',
  });
  const [newMilestone, setNewMilestone] = useState('');

  if (!goal) return null;

  const area = LIFE_AREAS.find((a) => a.id === goal.area);
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  
  // Date calculations
  const hasTargetDate = !!goal.targetDate;
  const targetDate = hasTargetDate ? parseISO(goal.targetDate!) : null;
  const daysRemaining = targetDate ? differenceInDays(targetDate, new Date()) : null;
  const isOverdue = targetDate ? isPast(targetDate) && goal.progress < 100 : false;
  const isApproaching = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

  // Time stats
  const daysSinceStart = differenceInDays(new Date(), parseISO(goal.createdAt));
  const progressPerDay = daysSinceStart > 0 ? (goal.progress / daysSinceStart).toFixed(1) : '0';

  // Activity tracking for streaks
  const recordActivity = (type: GoalActivity['type'], description?: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const activities = goal.activities || [];
    
    // Check if we already have activity today
    const todayActivity = activities.find(a => a.date === today);
    
    const newActivity: GoalActivity = {
      date: today,
      type,
      description,
    };
    
    // Calculate streak
    let newStreak = goal.currentStreak || 0;
    const lastActivity = goal.lastActivityDate;
    
    if (!todayActivity) {
      // This is first activity today
      if (lastActivity) {
        const lastDate = parseISO(lastActivity);
        if (isYesterday(lastDate)) {
          // Continue streak
          newStreak += 1;
        } else if (!isToday(lastDate)) {
          // Streak broken, start new
          newStreak = 1;
        }
      } else {
        // First ever activity
        newStreak = 1;
      }
    }
    
    const bestStreak = Math.max(goal.bestStreak || 0, newStreak);
    
    updateGoal(goal.id, {
      activities: [...activities, newActivity],
      lastActivityDate: new Date().toISOString(),
      currentStreak: newStreak,
      bestStreak,
    });
  };

  const handleSaveEdit = () => {
    updateGoal(goal.id, {
      title: editForm.title,
      description: editForm.description || undefined,
      area: editForm.area,
      targetDate: editForm.targetDate || undefined,
    });
    recordActivity('note', 'Cập nhật thông tin goal');
    setIsEditing(false);
    toast.success('Đã cập nhật goal');
  };

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return;
    const newMilestones = [
      ...goal.milestones,
      { id: crypto.randomUUID(), title: newMilestone.trim(), completed: false }
    ];
    // Recalculate progress
    const completedCount = newMilestones.filter((m) => m.completed).length;
    const progress = newMilestones.length > 0 ? Math.round((completedCount / newMilestones.length) * 100) : 0;
    updateGoal(goal.id, { milestones: newMilestones, progress });
    recordActivity('milestone', `Thêm milestone: ${newMilestone.trim()}`);
    setNewMilestone('');
    toast.success('Đã thêm milestone');
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    const newMilestones = goal.milestones.filter((m) => m.id !== milestoneId);
    const completedCount = newMilestones.filter((m) => m.completed).length;
    const progress = newMilestones.length > 0 ? Math.round((completedCount / newMilestones.length) * 100) : 0;
    updateGoal(goal.id, { milestones: newMilestones, progress });
    toast.success('Đã xóa milestone');
  };

  const handleCompleteGoal = () => {
    updateGoal(goal.id, { 
      completedAt: new Date().toISOString(),
      progress: 100,
      milestones: goal.milestones.map(m => ({ ...m, completed: true, completedAt: m.completedAt || new Date().toISOString() }))
    });
    toast.success('🎉 Chúc mừng! Goal đã hoàn thành!');
    onOpenChange(false);
  };

  const handleReopenGoal = () => {
    updateGoal(goal.id, { completedAt: undefined });
    toast.success('Goal đã được mở lại');
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
    onOpenChange(false);
    toast.success('Đã xóa goal');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg pr-8">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
            <span className="truncate">{isEditing ? 'Chỉnh sửa Goal' : 'Chi tiết Goal'}</span>
          </DialogTitle>
          {!isEditing && !goal.completedAt && (
            <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-10 top-2.5" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 shrink-0 border-b">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-max h-10 bg-transparent p-0 gap-1">
                <TabsTrigger value="overview" className="text-sm px-3 data-[state=active]:bg-secondary rounded-md">Tổng quan</TabsTrigger>
                <TabsTrigger value="milestones" className="text-sm px-3 data-[state=active]:bg-secondary rounded-md">Milestones</TabsTrigger>
                <TabsTrigger value="tasks" className="text-sm px-3 data-[state=active]:bg-secondary rounded-md">Tasks & Habits</TabsTrigger>
                <TabsTrigger value="dependencies" className="text-sm px-2 data-[state=active]:bg-secondary rounded-md">
                  <Link2 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="collaboration" className="text-sm px-2 data-[state=active]:bg-secondary rounded-md">
                  <Users className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="chart" className="text-sm px-2 data-[state=active]:bg-secondary rounded-md">
                  <BarChart3 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="vision" className="text-sm px-2 data-[state=active]:bg-secondary rounded-md">
                  <Sparkles className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-sm px-3 data-[state=active]:bg-secondary rounded-md">Thống kê</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-0">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label>Tiêu đề</Label>
                  <Input 
                    value={editForm.title} 
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Textarea 
                    value={editForm.description} 
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Lĩnh vực</Label>
                  <Select value={editForm.area} onValueChange={(v) => setEditForm({ ...editForm, area: v as LifeArea })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIFE_AREAS.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ngày mục tiêu</Label>
                  <Input 
                    type="date" 
                    value={editForm.targetDate} 
                    onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    <Save className="w-4 h-4 mr-2" /> Lưu
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" /> Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress header */}
                <div className="flex items-start gap-3">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                    <svg className="w-14 h-14 md:w-16 md:h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" stroke="hsl(var(--secondary))" strokeWidth="5" fill="none" />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke={goal.completedAt ? "hsl(var(--success))" : `hsl(var(--${area?.color}))`}
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${(goal.progress / 100) * 175.9} 175.9`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm md:text-base font-bold">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-bold line-clamp-2">{goal.title}</h2>
                    <div className="flex items-center gap-1 md:gap-1.5 mt-1 flex-wrap">
                      <Badge 
                        variant="secondary"
                        className="text-[10px] md:text-xs"
                        style={{ backgroundColor: `hsl(var(--${area?.color}) / 0.2)`, color: `hsl(var(--${area?.color}))` }}
                      >
                        {area?.icon} {area?.name}
                      </Badge>
                      {goal.completedAt ? (
                        <Badge variant="default" className="bg-success text-[10px] md:text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Hoàn thành
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-[10px] md:text-xs">
                          <AlertTriangle className="w-3 h-3 mr-0.5" /> Quá hạn
                        </Badge>
                      ) : isApproaching ? (
                        <Badge variant="outline" className="text-warning border-warning text-[10px] md:text-xs">
                          <Clock className="w-3 h-3 mr-0.5" /> {daysRemaining} ngày
                        </Badge>
                      ) : hasTargetDate && (
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          <Calendar className="w-3 h-3 mr-0.5" /> {daysRemaining} ngày
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {goal.description && (
                  <Card>
                    <CardContent className="p-3 md:p-4">
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                <Card>
                  <CardContent className="p-3 md:p-4 space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Ngày tạo</span>
                      <span>{format(parseISO(goal.createdAt), 'dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    {hasTargetDate && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Ngày mục tiêu</span>
                        <span className={cn(isOverdue && "text-destructive")}>{format(targetDate!, 'dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                    )}
                    {goal.completedAt && (
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Ngày hoàn thành</span>
                        <span className="text-success">{format(parseISO(goal.completedAt), 'dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  {!goal.completedAt ? (
                    <Button onClick={handleCompleteGoal} size="sm" className="flex-1 bg-success hover:bg-success/90 text-xs md:text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-1 md:mr-2" /> Hoàn thành
                    </Button>
                  ) : (
                    <Button onClick={handleReopenGoal} variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
                      <Flag className="w-4 h-4 mr-1 md:mr-2" /> Mở lại Goal
                    </Button>
                  )}
                  <GoalSharing goal={goal} />
                  <Button variant="destructive" size="icon" className="h-8 w-8 md:h-9 md:w-9 shrink-0" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="space-y-4 mt-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>{completedMilestones}/{goal.milestones.length} milestones hoàn thành</span>
            </div>

            {/* Add milestone */}
            {!goal.completedAt && (
              <div className="flex gap-2">
                <Input 
                  placeholder="Thêm milestone mới..." 
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                />
                <Button size="icon" onClick={handleAddMilestone}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Milestones list */}
            <div className="space-y-2">
              {goal.milestones.map((milestone, index) => (
                <Card key={milestone.id} className={cn(milestone.completed && "opacity-60")}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <button
                      onClick={() => toggleMilestone(goal.id, milestone.id)}
                      className="shrink-0"
                      disabled={!!goal.completedAt}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <span className={cn("text-sm", milestone.completed && "line-through")}>{milestone.title}</span>
                      {milestone.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Hoàn thành: {format(parseISO(milestone.completedAt), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                    {!goal.completedAt && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {goal.milestones.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có milestone nào. Thêm milestone để theo dõi tiến độ!
                </p>
              )}
            </div>
          </TabsContent>

            {/* Tasks Tab - Now includes linked Habits */}
            <TabsContent value="tasks" className="space-y-4 mt-0">
              <GoalLinkedItems goalId={goal.id} />
              <GoalTasksSection goal={goal} />
            </TabsContent>

            {/* Collaboration Tab */}
            <TabsContent value="collaboration" className="space-y-4 mt-0">
              <GoalCollaborationCard 
                goal={goal} 
                onUpdate={(updates) => updateGoal(goal.id, updates)}
              />
              
              {/* Streak Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-warning" />
                    <h4 className="font-medium">Streak hoạt động</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-warning/10 rounded-lg p-3">
                      <p className="text-2xl font-bold text-warning">{goal.currentStreak || 0}</p>
                      <p className="text-xs text-muted-foreground">Streak hiện tại</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold">{goal.bestStreak || 0}</p>
                      <p className="text-xs text-muted-foreground">Streak tốt nhất</p>
                    </div>
                  </div>
                  {goal.lastActivityDate && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Hoạt động gần nhất: {format(parseISO(goal.lastActivityDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dependencies Tab */}
            <TabsContent value="dependencies" className="space-y-4 mt-0">
              <GoalDependencies goal={goal} />
            </TabsContent>

            {/* Progress Chart Tab */}
            <TabsContent value="chart" className="space-y-4 mt-0">
              <GoalProgressChart goal={goal} />
            </TabsContent>

            {/* Vision Board Tab */}
            <TabsContent value="vision" className="space-y-4 mt-0">
              <VisionBoardCard goal={goal} />
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{progressPerDay}%</p>
                  <p className="text-xs text-muted-foreground">Tiến độ/ngày</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{daysSinceStart}</p>
                  <p className="text-xs text-muted-foreground">Ngày đã trôi qua</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-success mb-2" />
                  <p className="text-2xl font-bold">{completedMilestones}</p>
                  <p className="text-xs text-muted-foreground">Milestone xong</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Circle className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{goal.milestones.length - completedMilestones}</p>
                  <p className="text-xs text-muted-foreground">Milestone còn lại</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress over time visualization */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Tiến độ tổng quan</h4>
                <Progress value={goal.progress} className="h-3" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium text-foreground">{goal.progress}%</span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>

            {/* Estimated completion */}
            {!goal.completedAt && goal.progress > 0 && goal.progress < 100 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Dự đoán hoàn thành</h4>
                  <p className="text-sm text-muted-foreground">
                    Với tốc độ hiện tại ({progressPerDay}%/ngày), bạn sẽ hoàn thành sau khoảng{' '}
                    <span className="font-medium text-foreground">
                      {Math.ceil((100 - goal.progress) / (Number(progressPerDay) || 1))} ngày
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
