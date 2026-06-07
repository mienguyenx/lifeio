import { useState, useMemo, useEffect, useRef } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Flame, Calendar, TrendingUp, Target, Edit2, Save, Trash2, ChevronLeft, ChevronRight, Plus, Minus, MessageSquare, Archive, ArchiveRestore } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { LIFE_AREAS, type Habit, type LifeArea } from '@/types/lifeos';

interface HabitDetailModalProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HabitDetailModal({ habit: initialHabit, open, onOpenChange }: HabitDetailModalProps) {
  // Get latest habit data from store to ensure UI updates
  const habits = useLifeOSStore((s) => s.habits);
  const habit = useMemo(() => 
    habits.find(h => h.id === initialHabit.id) || initialHabit
  , [habits, initialHabit.id]);
  
  // Use synced store for all CRUD operations
  const { 
    updateHabit, 
    deleteHabit, 
    incrementHabitCompletion, 
    decrementHabitCompletion,
    archiveHabit,
    unarchiveHabit 
  } = useSyncedStore();

  const goals = useLifeOSStore((s) => s.goals);
  
  // Get active goals for linking
  const activeGoals = useMemo(() => 
    goals.filter(g => !g.deletedAt && !g.completedAt), 
    [goals]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: habit.name,
    description: habit.description || '',
    area: habit.area,
    frequency: habit.frequency,
    targetPerDay: habit.targetPerDay || 1,
    targetUnit: habit.targetUnit || '',
    reminderTime: habit.reminderTime || '',
    reminderEnabled: habit.reminderEnabled || false,
    customDays: habit.customDays || [],
    goalId: habit.goalId || '',
    targetDays: habit.targetDays || 30,
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [completionNote, setCompletionNote] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompletion = habit.completions?.find(c => c.date === todayStr);
  const todayCount = todayCompletion?.count || 0;
  const target = habit.targetPerDay || 1;
  const isCompletedToday = todayCount >= target;
  const area = LIFE_AREAS.find((a) => a.id === habit.area);

  // Animation state for counter
  const [countAnimation, setCountAnimation] = useState<'up' | 'down' | null>(null);
  const prevCountRef = useRef(todayCount);

  useEffect(() => {
    if (todayCount !== prevCountRef.current) {
      setCountAnimation(todayCount > prevCountRef.current ? 'up' : 'down');
      prevCountRef.current = todayCount;
      const timer = setTimeout(() => setCountAnimation(null), 300);
      return () => clearTimeout(timer);
    }
  }, [todayCount]);

  // Get completion count for a specific date
  const getCompletionCount = (date: string) => {
    const completion = habit.completions?.find(c => c.date === date);
    return completion?.count || (habit.completedDates.includes(date) ? 1 : 0);
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    const last7Days = last30Days.slice(0, 7);

    const completedLast30 = habit.completedDates.filter(d => last30Days.includes(d)).length;
    const completedLast7 = habit.completedDates.filter(d => last7Days.includes(d)).length;
    const completionRate30 = Math.round((completedLast30 / 30) * 100);
    const completionRate7 = Math.round((completedLast7 / 7) * 100);

    // This month stats
    const thisMonthStart = startOfMonth(now);
    const thisMonthDays = eachDayOfInterval({ start: thisMonthStart, end: now });
    const thisMonthCompleted = thisMonthDays.filter(d => 
      habit.completedDates.includes(d.toISOString().split('T')[0])
    ).length;

    // Total completions (with count)
    const totalCompletionCount = (habit.completions || []).reduce((sum, c) => sum + c.count, 0) || habit.completedDates.length;

    return {
      totalCompleted: habit.completedDates.length,
      totalCompletionCount,
      completedLast30,
      completedLast7,
      completionRate30,
      completionRate7,
      currentStreak: habit.streak,
      bestStreak: habit.bestStreak || habit.streak,
      thisMonthCompleted,
      thisMonthTotal: thisMonthDays.length,
    };
  }, [habit]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: isSameMonth(date, calendarMonth),
      isToday: isToday(date),
      completionCount: getCompletionCount(date.toISOString().split('T')[0]),
    }));
  }, [calendarMonth, habit.completedDates, habit.completions]);

  // Recent completions with notes
  const recentCompletionsWithNotes = useMemo(() => {
    return (habit.completions || [])
      .filter(c => c.notes)
      .filter(c => {
        const dateStr = c.time || c.date;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => {
        const aStr = a.time || a.date;
        const bStr = b.time || b.date;
        const aTime = aStr ? new Date(aStr).getTime() : 0;
        const bTime = bStr ? new Date(bStr).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [habit.completions]);

  const handleSave = () => {
    updateHabit(habit.id, {
      name: editForm.name,
      description: editForm.description || undefined,
      area: editForm.area,
      frequency: editForm.frequency,
      targetPerDay: editForm.targetPerDay > 1 ? editForm.targetPerDay : undefined,
      targetUnit: editForm.targetUnit || undefined,
      reminderTime: editForm.reminderTime || undefined,
      reminderEnabled: editForm.reminderTime ? editForm.reminderEnabled : undefined,
      customDays: editForm.frequency === 'weekly' ? editForm.customDays : undefined,
      goalId: editForm.goalId || undefined,
      targetDays: editForm.goalId ? editForm.targetDays : undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa habit này?')) {
      deleteHabit(habit.id);
      onOpenChange(false);
    }
  };

  const handleIncrement = () => {
    incrementHabitCompletion(habit.id, todayStr, completionNote || undefined);
    setCompletionNote('');
  };

  const handleDecrement = () => {
    decrementHabitCompletion(habit.id, todayStr);
  };

  const handleArchive = () => {
    if (habit.archivedAt) {
      unarchiveHabit(habit.id);
    } else {
      archiveHabit(habit.id);
      onOpenChange(false);
    }
  };

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `hsl(var(--area-${habit.area}) / 0.2)` }}
            >
              {habit.icon || area?.icon}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-xl font-bold"
                />
              ) : (
                <>
                  <span>{habit.name}</span>
                  {habit.streak > 0 && (
                    <Badge variant="secondary" className="ml-2 text-streak">
                      <Flame className="w-3 h-3 mr-1" /> {habit.streak} ngày
                    </Badge>
                  )}
                  {habit.archivedAt && (
                    <Badge variant="outline" className="ml-2">
                      <Archive className="w-3 h-3 mr-1" /> Đã lưu trữ
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-1" /> Lưu
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Tổng quan</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">Lịch</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Thống kê</TabsTrigger>
            {isEditing && <TabsTrigger value="settings" className="flex-1">Cài đặt</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Complete Section with Target Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Hôm nay</p>
                    <p className="text-sm text-muted-foreground">
                      {todayCount}/{target} {habit.targetUnit || 'lần'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDecrement}
                      disabled={todayCount === 0}
                      className="transition-transform active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span 
                      className={cn(
                        "w-12 text-center text-2xl font-bold transition-all duration-200",
                        countAnimation === 'up' && "scale-125 text-success",
                        countAnimation === 'down' && "scale-90 text-muted-foreground"
                      )}
                    >
                      {todayCount}
                    </span>
                    <Button
                      variant={isCompletedToday ? 'secondary' : 'default'}
                      size="icon"
                      onClick={handleIncrement}
                      className="transition-transform active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <Progress value={(todayCount / target) * 100} className="h-2 mb-3" />
                
                {/* Note input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ghi chú (tùy chọn)..."
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleIncrement}
                    disabled={!completionNote.trim()}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" /> Thêm với ghi chú
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Flame className="w-6 h-6 mx-auto text-streak mb-1" />
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Streak hiện tại</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.bestStreak}</p>
                  <p className="text-xs text-muted-foreground">Streak cao nhất</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-success mb-1" />
                  <p className="text-2xl font-bold">{stats.completionRate7}%</p>
                  <p className="text-xs text-muted-foreground">7 ngày qua</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto text-info mb-1" />
                  <p className="text-2xl font-bold">{stats.completionRate30}%</p>
                  <p className="text-xs text-muted-foreground">30 ngày qua</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notes */}
            {recentCompletionsWithNotes.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Ghi chú gần đây
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recentCompletionsWithNotes.map((completion, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {(() => {
                            const date = new Date(completion.date);
                            if (isNaN(date.getTime())) return completion.date;
                            return format(date, 'dd/MM');
                          })()}
                        </span>
                        <span className="flex-1">{completion.notes}</span>
                        {completion.count > 1 && (
                          <Badge variant="secondary" className="text-xs">x{completion.count}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {habit.description && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lĩnh vực</span>
                  <span>{area?.icon} {area?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tần suất</span>
                  <span>
                    {habit.frequency === 'daily' && 'Hàng ngày'}
                    {habit.frequency === 'weekly' && 'Hàng tuần'}
                    {habit.frequency === 'custom' && 'Tùy chỉnh'}
                  </span>
                </div>
                {target > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mục tiêu/ngày</span>
                    <span>{target} {habit.targetUnit || 'lần'}</span>
                  </div>
                )}
                {habit.reminderTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nhắc nhở</span>
                    <span>{habit.reminderTime}</span>
                  </div>
                )}
                {habit.goalId && (() => {
                  const linkedGoal = activeGoals.find(g => g.id === habit.goalId);
                  if (linkedGoal) {
                    const goalArea = LIFE_AREAS.find(a => a.id === linkedGoal.area);
                    return (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Goal liên kết</span>
                        <Badge variant="outline" className="gap-1">
                          <Target className="w-3 h-3" />
                          {goalArea?.icon} {linkedGoal.title}
                        </Badge>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày tạo</span>
                  <span>{(() => {
                    if (!habit.createdAt) return 'N/A';
                    const date = new Date(habit.createdAt);
                    if (isNaN(date.getTime())) return habit.createdAt;
                    return format(date, 'dd/MM/yyyy');
                  })()}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardContent className="p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCalendarMonth(d => subDays(startOfMonth(d), 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">
                    {format(calendarMonth, 'MMMM yyyy', { locale: vi })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCalendarMonth(d => {
                      const next = new Date(d);
                      next.setMonth(next.getMonth() + 1);
                      return next;
                    })}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Week Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                    <div key={day} className="text-center text-xs text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ date, dateStr, isCurrentMonth, isToday: isTodayDate, completionCount }) => {
                    const completionPercent = Math.min((completionCount / target) * 100, 100);
                    const isCompleted = completionCount >= target;
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => incrementHabitCompletion(habit.id, dateStr)}
                        className={cn(
                          'aspect-square rounded-md text-sm flex flex-col items-center justify-center transition-colors relative',
                          !isCurrentMonth && 'text-muted-foreground/30',
                          isCurrentMonth && completionCount === 0 && 'hover:bg-secondary',
                          isCompleted && 'bg-success text-success-foreground',
                          !isCompleted && completionCount > 0 && 'bg-success/40',
                          isTodayDate && !isCompleted && 'ring-2 ring-primary',
                        )}
                      >
                        {date.getDate()}
                        {completionCount > 1 && (
                          <span className="text-[10px] font-bold">x{completionCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Month Stats */}
                <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
                  Tháng này: {stats.thisMonthCompleted}/{stats.thisMonthTotal} ngày ({Math.round(stats.thisMonthCompleted / stats.thisMonthTotal * 100)}%)
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Tổng quan</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng số ngày hoàn thành</span>
                      <span className="font-medium">{stats.totalCompleted}</span>
                    </div>
                    {target > 1 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tổng số lần check-in</span>
                        <span className="font-medium">{stats.totalCompletionCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Streak hiện tại</span>
                      <span className="font-medium text-streak">{stats.currentStreak} ngày</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Streak cao nhất</span>
                      <span className="font-medium">{stats.bestStreak} ngày</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Tỷ lệ hoàn thành</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>7 ngày qua</span>
                        <span>{stats.completedLast7}/7 ({stats.completionRate7}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success transition-all"
                          style={{ width: `${stats.completionRate7}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>30 ngày qua</span>
                        <span>{stats.completedLast30}/30 ({stats.completionRate30}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${stats.completionRate30}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">90 ngày gần nhất</h4>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 90 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (89 - i));
                      // Validate date before using format
                      if (isNaN(date.getTime())) return null;
                      const dateStr = date.toISOString().split('T')[0];
                      const count = getCompletionCount(dateStr);
                      const isCompleted = count >= target;
                      const isPartial = count > 0 && count < target;
                      
                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            'w-3 h-3 rounded-sm',
                            isCompleted ? 'bg-success' : isPartial ? 'bg-success/40' : 'bg-secondary'
                          )}
                          title={`${format(date, 'dd/MM/yyyy')} - ${count}/${target}`}
                        />
                      );
                    }).filter(Boolean)}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-secondary" />
                      <span>Chưa</span>
                    </div>
                    {target > 1 && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-success/40" />
                        <span>Một phần</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-success" />
                      <span>Hoàn thành</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab (only when editing) */}
          {isEditing && (
            <TabsContent value="settings">
              <div className="space-y-4">
                <div>
                  <Label>Mô tả</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Mô tả chi tiết về habit..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Lĩnh vực</Label>
                  <Select 
                    value={editForm.area} 
                    onValueChange={(v) => setEditForm({ ...editForm, area: v as LifeArea })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIFE_AREAS.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.icon} {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tần suất</Label>
                  <Select 
                    value={editForm.frequency} 
                    onValueChange={(v) => setEditForm({ ...editForm, frequency: v as 'daily' | 'weekly' | 'custom' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Hàng ngày</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.frequency === 'weekly' && (
                  <div>
                    <Label>Chọn ngày trong tuần</Label>
                    <div className="flex gap-2 mt-2">
                      {weekDays.map((day, index) => (
                        <button
                          key={day}
                          onClick={() => {
                            const days = editForm.customDays.includes(index)
                              ? editForm.customDays.filter(d => d !== index)
                              : [...editForm.customDays, index];
                            setEditForm({ ...editForm, customDays: days });
                          }}
                          className={cn(
                            'w-10 h-10 rounded-full text-sm font-medium transition-colors',
                            editForm.customDays.includes(index)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mục tiêu/ngày</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editForm.targetPerDay}
                      onChange={(e) => setEditForm({ ...editForm, targetPerDay: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Đơn vị</Label>
                    <Input
                      placeholder="VD: lần, phút, ly..."
                      value={editForm.targetUnit}
                      onChange={(e) => setEditForm({ ...editForm, targetUnit: e.target.value })}
                    />
                  </div>
                </div>

                {/* Goal Linking */}
                <div className="space-y-3 p-3 rounded-lg border border-dashed">
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Liên kết với Goal (tùy chọn)
                  </Label>
                  <Select 
                    value={editForm.goalId || "none"} 
                    onValueChange={(v) => setEditForm({ ...editForm, goalId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn goal để liên kết..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không liên kết</SelectItem>
                      {activeGoals.map((goal) => {
                        const goalArea = LIFE_AREAS.find(a => a.id === goal.area);
                        return (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goalArea?.icon} {goal.title}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {editForm.goalId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Số ngày mục tiêu (để tính progress)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editForm.targetDays}
                        onChange={(e) => setEditForm({ ...editForm, targetDays: parseInt(e.target.value) || 30 })}
                        className="mt-1"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Liên kết habit với goal để tự động tính progress dựa trên số ngày hoàn thành
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Giờ nhắc nhở</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="time"
                      value={editForm.reminderTime}
                      onChange={(e) => setEditForm({ ...editForm, reminderTime: e.target.value })}
                      className="flex-1"
                    />
                    {editForm.reminderTime && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.reminderEnabled}
                          onChange={(e) => setEditForm({ ...editForm, reminderEnabled: e.target.checked })}
                          className="rounded"
                        />
                        Bật
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nhắc nhở khi chưa hoàn thành habit vào giờ đã đặt
                  </p>
                </div>

                {/* Archive Section */}
                <Card className="border-warning/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Lưu trữ</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {habit.archivedAt 
                        ? 'Habit này đang được lưu trữ. Khôi phục để tiếp tục theo dõi.'
                        : 'Lưu trữ habit để ẩn khỏi danh sách chính mà không mất dữ liệu.'}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleArchive}>
                      {habit.archivedAt ? (
                        <><ArchiveRestore className="w-4 h-4 mr-2" /> Khôi phục</>
                      ) : (
                        <><Archive className="w-4 h-4 mr-2" /> Lưu trữ</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-destructive mb-2">Vùng nguy hiểm</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Xóa habit sẽ xóa tất cả lịch sử hoàn thành và không thể khôi phục.
                    </p>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" /> Xóa Habit
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}