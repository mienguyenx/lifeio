import { useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Flame, CheckCircle2, MoreVertical, Trash2, Target, Calendar, Eye, Archive, Minus, History, Lightbulb, ChevronDown, TrendingUp, Award, BarChart3, PanelRightClose, PanelRight, Brain, Trophy, Flag } from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type Habit } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { getTodayDateString, formatDateInTimezone } from '@/utils/dateUtils';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { HabitDetailModal } from '@/components/habits/HabitDetailModal';
import { HabitFilters, type HabitSortBy, type HabitSortOrder } from '@/components/habits/HabitFilters';
import { ArchivedHabitsSection } from '@/components/habits/ArchivedHabitsSection';
import { HabitPredictionCard } from '@/components/habits/HabitPredictionCard';
import { HabitChallengesCard } from '@/components/habits/HabitChallengesCard';
import { HabitHistoryManager } from '@/components/habits/HabitHistoryManager';
import { HabitCompetitionCard } from '@/components/habits/HabitCompetitionCard';
import { HabitCardCompact } from '@/components/habits/HabitCardCompact';
import { HabitCardStandard } from '@/components/habits/HabitCardStandard';
import { HabitViewModeSelector } from '@/components/habits/HabitViewModeSelector';
import { HabitAreaGroup } from '@/components/habits/HabitAreaGroup';
import { useHabitViewPreferences } from '@/hooks/useHabitViewPreferences';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { toast } from 'sonner';
import { useAdminTemplates, useUpdateTemplate } from '@/hooks/useAdminData';

export default function HabitsPage() {
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  
  // Use synced store for CRUD operations that need to sync to Supabase
  const { 
    addHabit, 
    deleteHabit, 
    toggleHabitCompletion, 
    incrementHabitCompletion,
    decrementHabitCompletion,
    isSyncEnabled 
  } = useSyncedStore();
  
  const isMobile = useIsMobile();
  
  // Debounce để tránh race condition khi bấm nhanh
  const processingHabits = useRef<Set<string>>(new Set());
  
  const handleIncrementHabit = useCallback((habitId: string, date: string) => {
    // Kiểm tra xem habit này có đang được xử lý không
    if (processingHabits.current.has(habitId)) {
      return; // Đang xử lý, bỏ qua
    }
    
    // Đánh dấu đang xử lý
    processingHabits.current.add(habitId);
    
    // Thực hiện increment
    incrementHabitCompletion(habitId, date);
    
    // Xóa đánh dấu sau 300ms (đủ thời gian để sync)
    setTimeout(() => {
      processingHabits.current.delete(habitId);
    }, 300);
  }, [incrementHabitCompletion]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('habits-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    const newValue = !isSidebarOpen;
    setIsSidebarOpen(newValue);
    localStorage.setItem('habits-sidebar-open', JSON.stringify(newValue));
  };
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    area: 'health' as LifeArea,
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    targetPerDay: 1,
    targetUnit: '',
    customDays: [] as number[],
    goalId: '' as string,
    targetDays: 30,
  });

  // Get active goals for linking
  const activeGoals = useMemo(() => 
    goals.filter(g => !g.deletedAt && !g.completedAt), 
    [goals]
  );

  // Filter & Sort state
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'daily' | 'weekly' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<HabitSortBy>('streak');
  const [sortOrder, setSortOrder] = useState<HabitSortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail modal state
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showHistoryManager, setShowHistoryManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState<'form' | 'templates'>('form');
  
  // Load habit templates from database
  const { data: habitTemplates = [], isLoading: templatesLoading } = useAdminTemplates('habits');
  const updateTemplate = useUpdateTemplate();
  
  // Filter only active templates
  const activeHabitTemplates = habitTemplates.filter(t => t.is_active);
  
  // Delete confirmation state
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleApplyHabitTemplate = (template: typeof habitTemplates[0]) => {
    const content = template.content as {
      name?: string;
      description?: string;
      area?: LifeArea;
      frequency?: 'daily' | 'weekly' | 'custom';
      target_per_day?: number;
      target_unit?: string;
      suggested_time?: string;
    };
    
    setNewHabit({
      name: content.name || template.name,
      description: content.description || template.description || '',
      area: content.area || 'health',
      frequency: content.frequency || 'daily',
      targetPerDay: content.target_per_day || 1,
      targetUnit: content.target_unit || '',
      customDays: [],
      goalId: '',
      targetDays: 30,
    });
    setShowTemplates('form');
    
    // Update usage count
    updateTemplate.mutate({
      id: template.id,
      usage_count: (template.usage_count || 0) + 1,
    }, {
      onSuccess: () => {
        // Silently update, no toast notification
      },
      onError: (error) => {
        console.error('Failed to update template usage count:', error);
      },
    });
  };

  // Use timezone-aware date utility (GMT+7)
  const todayStr = getTodayDateString();

  // View preferences
  const { viewMode, setViewMode, groupByArea, setGroupByArea } = useHabitViewPreferences();

  // Generate last 30 days for heatmap (timezone-aware)
  const last30Days = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return formatDateInTimezone(date) || date.toISOString().split('T')[0];
  }), []);

  // Generate last 7 days for standard view mini progress (timezone-aware)
  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return formatDateInTimezone(date) || date.toISOString().split('T')[0];
  }), []);

  // Separate active and archived habits (exclude deleted)
  const activeHabits = useMemo(() => habits.filter(h => !h.archivedAt && !h.deletedAt), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archivedAt && !h.deletedAt), [habits]);

  // Filter and sort habits
  const filteredAndSortedHabits = useMemo(() => {
    let result = [...activeHabits];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.name.toLowerCase().includes(query) || 
        h.description?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filterArea !== 'all') {
      result = result.filter(h => h.area === filterArea);
    }
    if (filterFrequency !== 'all') {
      result = result.filter(h => h.frequency === filterFrequency);
    }

    // Calculate completion rates for sorting
    const getCompletionRate = (habit: Habit) => {
      const completed = habit.completedDates.filter(d => last30Days.includes(d)).length;
      return completed / 30;
    };

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'streak':
          comparison = a.streak - b.streak;
          break;
        case 'completion':
          comparison = getCompletionRate(a) - getCompletionRate(b);
          break;
        case 'created':
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (isNaN(aTime) || isNaN(bTime)) {
            comparison = 0;
          } else {
            comparison = aTime - bTime;
          }
          break;
        case 'area':
          comparison = a.area.localeCompare(b.area);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [activeHabits, filterArea, filterFrequency, sortBy, sortOrder, last30Days, searchQuery]);

  // Group habits by area for grouped view
  const habitsByArea = useMemo(() => {
    const grouped: Record<LifeArea, Habit[]> = {} as Record<LifeArea, Habit[]>;
    LIFE_AREAS.forEach(area => {
      const areaHabits = filteredAndSortedHabits.filter(h => h.area === area.id);
      if (areaHabits.length > 0) {
        grouped[area.id as LifeArea] = areaHabits;
      }
    });
    return grouped;
  }, [filteredAndSortedHabits]);

  const activeFiltersCount = (filterArea !== 'all' ? 1 : 0) + (filterFrequency !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setFilterArea('all');
    setFilterFrequency('all');
  };

  const handleAddHabit = () => {
    if (!newHabit.name.trim()) return;
    addHabit({
      name: newHabit.name,
      description: newHabit.description || undefined,
      area: newHabit.area,
      frequency: newHabit.frequency,
      targetPerDay: newHabit.targetPerDay > 1 ? newHabit.targetPerDay : undefined,
      targetUnit: newHabit.targetUnit || undefined,
      customDays: newHabit.frequency === 'weekly' ? newHabit.customDays : undefined,
      goalId: newHabit.goalId || undefined,
      targetDays: newHabit.goalId ? newHabit.targetDays : undefined,
    });
    setNewHabit({
      name: '',
      description: '',
      area: 'health',
      frequency: 'daily',
      targetPerDay: 1,
      targetUnit: '',
      customDays: [],
      goalId: '',
      targetDays: 30,
    });
    setIsDialogOpen(false);
  };

  // Stats (chỉ tính active habits)
  const totalHabits = activeHabits.length;
  const completedToday = activeHabits.filter(h => {
    const target = h.targetPerDay || 1;
    const todayCompletion = h.completions?.find(c => c.date === todayStr);
    const todayCount = todayCompletion?.count || (h.completedDates.includes(todayStr) ? 1 : 0);
    return todayCount >= target;
  }).length;
  const totalStreak = activeHabits.reduce((sum, h) => sum + h.streak, 0);
  const avgCompletion = activeHabits.length > 0 
    ? Math.round((activeHabits.reduce((sum, h) => sum + h.completedDates.filter(d => last30Days.includes(d)).length, 0) / (activeHabits.length * 30)) * 100)
    : 0;

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const AddHabitButton = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" className="rounded-full" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Thêm
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-0 shadow-lg">
          <p className="font-medium">Thêm Habit mới</p>
          <p className="text-xs opacity-90">Tạo thói quen mới để theo dõi hàng ngày</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const AddHabitDialog = (
    <AdaptiveModal open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setShowTemplates('form'); }} title="Thêm Habit mới">
        <div className="space-y-4 mt-4">
          {/* Template view / Form view switcher */}
          {showTemplates === 'templates' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Chọn Template Habit
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates('form')}>
                  ← Quay lại
                </Button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templatesLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Đang tải templates...</div>
                ) : activeHabitTemplates.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Chưa có templates nào</div>
                ) : (
                  activeHabitTemplates.map(template => {
                    const content = template.content as {
                      area?: LifeArea;
                      target_per_day?: number;
                      target_unit?: string;
                    };
                    const area = LIFE_AREAS.find(a => a.id === content.area);
                    const targetPerDay = content.target_per_day || 1;
                    const targetUnit = content.target_unit || '';

                    return (
                      <div
                        key={template.id}
                        className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                        onClick={() => handleApplyHabitTemplate(template)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{area?.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {targetPerDay} {targetUnit}/ngày
                              {template.description && ` • ${template.description}`}
                            </p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" size="sm" className="w-full justify-between" disabled={templatesLoading} onClick={() => setShowTemplates('templates')}>
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Chọn từ Templates
                </span>
                <Badge variant="secondary">{activeHabitTemplates.length}</Badge>
              </Button>

          <div>
            <Label>Tên habit *</Label>
            <Input
              placeholder="VD: Đọc sách 30 phút"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Mô tả chi tiết về habit..."
              value={newHabit.description}
              onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label>Lĩnh vực</Label>
            <Select value={newHabit.area} onValueChange={(v) => setNewHabit({ ...newHabit, area: v as LifeArea })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIFE_AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id}>{area.icon} {area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tần suất</Label>
            <Select value={newHabit.frequency} onValueChange={(v) => setNewHabit({ ...newHabit, frequency: v as 'daily' | 'weekly' | 'custom' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Hàng ngày</SelectItem>
                <SelectItem value="weekly">Hàng tuần</SelectItem>
                <SelectItem value="custom">Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newHabit.frequency === 'weekly' && (
            <div>
              <Label>Chọn ngày trong tuần</Label>
              <div className="flex gap-2 mt-2">
                {weekDays.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const days = newHabit.customDays.includes(index)
                        ? newHabit.customDays.filter(d => d !== index)
                        : [...newHabit.customDays, index];
                      setNewHabit({ ...newHabit, customDays: days });
                    }}
                    className={cn(
                      'w-10 h-10 rounded-full text-sm font-medium transition-colors',
                      newHabit.customDays.includes(index)
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
                value={newHabit.targetPerDay}
                onChange={(e) => setNewHabit({ ...newHabit, targetPerDay: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Đơn vị</Label>
              <Input
                placeholder="VD: lần, phút, ly..."
                value={newHabit.targetUnit}
                onChange={(e) => setNewHabit({ ...newHabit, targetUnit: e.target.value })}
              />
            </div>
          </div>

          {/* Goal Linking */}
          <div className="space-y-3 p-3 rounded-lg border border-dashed">
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Liên kết với Goal (tùy chọn)
            </Label>
            <Select value={newHabit.goalId || "none"} onValueChange={(v) => setNewHabit({ ...newHabit, goalId: v === "none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn goal để liên kết..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không liên kết</SelectItem>
                {activeGoals.map((goal) => {
                  const area = LIFE_AREAS.find(a => a.id === goal.area);
                  return (
                    <SelectItem key={goal.id} value={goal.id}>
                      {area?.icon} {goal.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {newHabit.goalId && (
              <div>
                <Label className="text-xs text-muted-foreground">Số ngày mục tiêu (để tính progress)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newHabit.targetDays}
                  onChange={(e) => setNewHabit({ ...newHabit, targetDays: parseInt(e.target.value) || 30 })}
                  className="mt-1"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Liên kết habit với goal để tự động tính progress dựa trên số ngày hoàn thành
            </p>
          </div>

          <Button className="w-full" onClick={handleAddHabit}>Thêm Habit</Button>
            </div>
          )}
        </div>
    </AdaptiveModal>
  );

  const HabitCard = ({ habit }: { habit: Habit }) => {
    const target = habit.targetPerDay || 1;
    const todayCompletion = habit.completions?.find(c => c.date === todayStr);
    const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
    const isCompletedToday = todayCount >= target;
    const area = LIFE_AREAS.find((a) => a.id === habit.area);
    const completionRate = Math.round((habit.completedDates.filter(d => last30Days.includes(d)).length / 30) * 100);
    
    const getCompletionCount = (date: string) => {
      const completion = habit.completions?.find(c => c.date === date);
      return completion?.count || (habit.completedDates.includes(date) ? 1 : 0);
    };
    
    return (
    <>
      <Card 
        className={cn(
          'overflow-hidden transition-all cursor-pointer hover:shadow-md',
          isCompletedToday && 'ring-2 ring-success/50'
        )}
        onClick={() => {
          // Nếu target > 1, luôn mở modal
          // Nếu target <= 1, toggle completion
          if (target > 1) {
            setSelectedHabit(habit);
            setIsDetailModalOpen(true);
          } else {
            // Toggle cho habit có target <= 1
            if (isCompletedToday) {
              decrementHabitCompletion(habit.id, todayStr);
            } else {
              handleIncrementHabit(habit.id, todayStr);
            }
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Hiển thị trạng thái: target > 1 hiện số đếm, target <= 1 hiện toggle button */}
            {target > 1 ? (
              <div 
                className="flex flex-col items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  // Bấm vào vùng này cũng mở modal
                  setSelectedHabit(habit);
                  setIsDetailModalOpen(true);
                }}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all cursor-pointer',
                    isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
                  )}
                  style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
                  title="Bấm để mở chi tiết và điều chỉnh"
                >
                  {isCompletedToday ? <CheckCircle2 className="w-6 h-6" /> : `${todayCount}/${target}`}
                </div>
              </div>
            ) : (
              <button
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all touch-manipulation',
                  isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
                )}
                style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCompletedToday) {
                    decrementHabitCompletion(habit.id, todayStr);
                  } else {
                    handleIncrementHabit(habit.id, todayStr);
                  }
                }}
              >
                {isCompletedToday ? <CheckCircle2 className="w-6 h-6" /> : (habit.icon || area?.icon)}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{habit.name}</h3>
                {habit.streak > 0 && (
                  <div className="flex items-center gap-1 text-streak bg-streak/10 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" />
                    <span className="text-xs font-bold">{habit.streak}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{area?.name}</p>
                {habit.goalId && (() => {
                  const linkedGoal = goals.find(g => g.id === habit.goalId);
                  if (linkedGoal) {
                    return (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Target className="w-3 h-3" />
                        {linkedGoal.title.length > 15 ? linkedGoal.title.slice(0, 15) + '...' : linkedGoal.title}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </div>
              
              {/* Target Progress (if has target > 1) */}
              {target > 1 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Hôm nay</span>
                    <span>{todayCount}/{target} {habit.targetUnit || 'lần'}</span>
                  </div>
                  <Progress value={(todayCount / target) * 100} className="h-1.5" />
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="shrink-0"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedHabit(habit);
                  setIsDetailModalOpen(true);
                }}>
                  <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onSelect={(e) => {
                    e.preventDefault();
                    setHabitToDelete(habit);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>

          {/* 30-day Heatmap with completion intensity */}
          <div className="mt-4">
            <div className="flex gap-1 flex-wrap">
              {last30Days.map((date) => {
                const count = getCompletionCount(date);
                const isComplete = count >= target;
                const isPartial = count > 0 && count < target;
                return (
                  <div
                    key={date}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-colors',
                      isComplete ? 'bg-success' : isPartial ? 'bg-success/40' : 'bg-secondary'
                    )}
                    title={`${date}: ${count}/${target}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                30 ngày gần nhất • {habit.completedDates.filter(d => last30Days.includes(d)).length}/30 ngày
              </p>
              <span className="text-xs font-medium text-muted-foreground">{completionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
    );
  };

  if (!isMobile) {
    // Find best habit (highest streak)
    const bestHabit = activeHabits.length > 0 
      ? activeHabits.reduce((best, h) => h.streak > best.streak ? h : best, activeHabits[0])
      : null;
    
    // Get top 3 streaks
    const topStreaks = [...activeHabits].sort((a, b) => b.streak - a.streak).slice(0, 3);
    
    // Get habits needing attention (not completed today and streak > 0)
    const needsAttention = activeHabits.filter(h => {
      const todayCompletion = h.completions?.find(c => c.date === todayStr);
      const todayCount = todayCompletion?.count || (h.completedDates.includes(todayStr) ? 1 : 0);
      return todayCount < (h.targetPerDay || 1) && h.streak > 0;
    }).slice(0, 3);

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Habits</h1>
            <p className="text-muted-foreground">Xây dựng thói quen, thay đổi cuộc sống</p>
          </div>
          <div className="flex items-center gap-3">
            <HabitViewModeSelector
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              groupByArea={groupByArea}
              onGroupByAreaChange={setGroupByArea}
            />
            <HabitFilters
              filterArea={filterArea}
              onFilterAreaChange={setFilterArea}
              filterFrequency={filterFrequency}
              onFilterFrequencyChange={setFilterFrequency}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setShowHistoryManager(true)}>
                    <History className="w-4 h-4 mr-1" /> Lịch sử
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Lịch sử Habit</p>
                  <p className="text-xs text-muted-foreground">Xem và chỉnh sửa lịch sử hoàn thành habit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {AddHabitButton}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden xl:flex h-8 px-2 gap-1"
                    onClick={toggleSidebar}
                  >
                    {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{isSidebarOpen ? 'Ẩn Sidebar' : 'Hiện Sidebar'}</p>
                  <p className="text-xs text-muted-foreground">Bật/tắt thanh bên với thống kê và streaks</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* History Manager Modal */}
        <HabitHistoryManager open={showHistoryManager} onOpenChange={setShowHistoryManager} />

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalHabits}</p>
                      <p className="text-xs text-muted-foreground">Tổng habits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedToday}/{totalHabits}</p>
                      <p className="text-xs text-muted-foreground">Hôm nay</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-streak/10 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-streak" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalStreak}</p>
                      <p className="text-xs text-muted-foreground">Tổng streaks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{avgCompletion}%</p>
                      <p className="text-xs text-muted-foreground">30 ngày qua</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter info */}
            {activeFiltersCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Hiển thị {filteredAndSortedHabits.length}/{habits.length} habits
              </p>
            )}

            {/* Habits Grid */}
            {filteredAndSortedHabits.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-lg">
                    {habits.length === 0 ? 'Chưa có habit nào' : 'Không có habit nào phù hợp'}
                  </p>
                  <p className="text-sm mt-1">
                    {habits.length === 0 ? 'Bắt đầu xây dựng thói quen tốt ngay!' : 'Thử điều chỉnh bộ lọc'}
                  </p>
                </CardContent>
              </Card>
            ) : groupByArea ? (
              // Grouped by Area View
              <div className="space-y-4">
                {Object.entries(habitsByArea).map(([area, areaHabits]) => (
                  <HabitAreaGroup key={area} area={area as LifeArea} habits={areaHabits} todayStr={todayStr}>
                    {viewMode === 'compact' ? (
                      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                        {areaHabits.map((habit) => (
                          <HabitCardCompact
                            key={habit.id}
                            habit={habit}
                            todayStr={todayStr}
                            onToggle={() => {
                              const target = habit.targetPerDay || 1;
                              const todayCompletion = habit.completions?.find(c => c.date === todayStr);
                              const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
                              if (todayCount >= target) {
                                decrementHabitCompletion(habit.id, todayStr);
                              } else {
                                handleIncrementHabit(habit.id, todayStr);
                              }
                            }}
                            onIncrement={() => handleIncrementHabit(habit.id, todayStr)}
                            onDecrement={() => decrementHabitCompletion(habit.id, todayStr)}
                            onClick={() => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
                          />
                        ))}
                      </div>
                    ) : viewMode === 'standard' ? (
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                        {areaHabits.map((habit) => (
                          <HabitCardStandard
                            key={habit.id}
                            habit={habit}
                            todayStr={todayStr}
                            last7Days={last7Days}
                            onToggle={() => {
                              const target = habit.targetPerDay || 1;
                              const todayCompletion = habit.completions?.find(c => c.date === todayStr);
                              const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
                              if (todayCount >= target) {
                                decrementHabitCompletion(habit.id, todayStr);
                              } else {
                                handleIncrementHabit(habit.id, todayStr);
                              }
                            }}
                            onIncrement={() => handleIncrementHabit(habit.id, todayStr)}
                            onDecrement={() => decrementHabitCompletion(habit.id, todayStr)}
                            onClick={() => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
                            onDelete={() => { setHabitToDelete(habit); setDeleteDialogOpen(true); }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                        {areaHabits.map((habit) => (
                          <HabitCard 
                            key={habit.id} 
                            habit={habit}
                            onClick={() => {
                              setSelectedHabit(habit);
                              setIsDetailModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </HabitAreaGroup>
                ))}
              </div>
            ) : viewMode === 'compact' ? (
              // Compact View (no grouping)
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                {filteredAndSortedHabits.map((habit) => (
                  <HabitCardCompact
                    key={habit.id}
                    habit={habit}
                    todayStr={todayStr}
                    onToggle={() => {
                      const target = habit.targetPerDay || 1;
                      const todayCompletion = habit.completions?.find(c => c.date === todayStr);
                      const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
                      if (todayCount >= target) {
                        decrementHabitCompletion(habit.id, todayStr);
                      } else {
                        incrementHabitCompletion(habit.id, todayStr);
                      }
                    }}
                    onIncrement={() => incrementHabitCompletion(habit.id, todayStr)}
                    onDecrement={() => decrementHabitCompletion(habit.id, todayStr)}
                    onClick={() => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
                  />
                ))}
              </div>
            ) : viewMode === 'standard' ? (
              // Standard View (no grouping)
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAndSortedHabits.map((habit) => (
                  <HabitCardStandard
                    key={habit.id}
                    habit={habit}
                    todayStr={todayStr}
                    last7Days={last7Days}
                    onToggle={() => {
                      const target = habit.targetPerDay || 1;
                      const todayCompletion = habit.completions?.find(c => c.date === todayStr);
                      const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
                      if (todayCount >= target) {
                        decrementHabitCompletion(habit.id, todayStr);
                      } else {
                        incrementHabitCompletion(habit.id, todayStr);
                      }
                    }}
                    onIncrement={() => incrementHabitCompletion(habit.id, todayStr)}
                    onDecrement={() => decrementHabitCompletion(habit.id, todayStr)}
                    onClick={() => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
                    onDelete={() => { setHabitToDelete(habit); setDeleteDialogOpen(true); }}
                  />
                ))}
              </div>
            ) : (
              // Detailed View (original with full heatmap)
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAndSortedHabits.map((habit) => (
                  <HabitCard 
                    key={habit.id} 
                    habit={habit}
                    onClick={() => {
                      setSelectedHabit(habit);
                      setIsDetailModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Archived Habits Section */}
            <ArchivedHabitsSection 
              archivedHabits={archivedHabits} 
              onViewDetail={(habit) => {
                setSelectedHabit(habit);
                setIsDetailModalOpen(true);
              }}
            />
          </div>

          {/* Sidebar */}
          <div className={cn(
            "hidden xl:block transition-all duration-300",
            isSidebarOpen ? "w-80" : "w-0"
          )}>
            {isSidebarOpen && (
              <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {/* Help Button */}
                <div className="flex justify-end">
                  <ModuleHelpButton module="habits" />
                </div>

                {/* Progress Today */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Tiến độ hôm nay</span>
                    </div>
                    <div className="text-center mb-3">
                      <p className="text-4xl font-bold">{completedToday}/{totalHabits}</p>
                      <p className="text-xs text-muted-foreground">habits hoàn thành</p>
                    </div>
                    <Progress value={totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0} className="h-2" />
                  </CardContent>
                </Card>

                {/* AI Habit Predictor - Collapsible */}
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">AI Dự đoán</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        <HabitPredictionCard habits={habits} compact />
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Habit Challenges - Collapsible */}
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-warning" />
                          <span className="font-medium text-sm">Thử thách</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        <HabitChallengesCard habits={habits} compact />
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Habit Race - Collapsible (closed by default) */}
                <Collapsible>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-streak" />
                          <span className="font-medium text-sm">Cuộc đua Habits</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        <HabitCompetitionCard habits={habits} compact />
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Top Streaks */}
                {topStreaks.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-4 h-4 text-streak" />
                        <span className="font-medium text-sm">Top Streaks</span>
                      </div>
                      <div className="space-y-2">
                        {topStreaks.map((habit, index) => {
                          const area = LIFE_AREAS.find(a => a.id === habit.area);
                          return (
                            <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                              <span className="flex items-center gap-2 truncate">
                                <span className="text-xs">{index + 1}.</span>
                                <span>{area?.icon}</span>
                                <span className="truncate">{habit.name}</span>
                              </span>
                              <Badge variant="outline" className="text-streak shrink-0">
                                <Flame className="w-3 h-3 mr-1" />
                                {habit.streak}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Needs Attention */}
                {needsAttention.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-warning" />
                        <span className="font-medium text-sm">Cần hoàn thành</span>
                      </div>
                      <div className="space-y-2">
                        {needsAttention.map(habit => {
                          const area = LIFE_AREAS.find(a => a.id === habit.area);
                          return (
                            <div 
                              key={habit.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-warning/10 text-sm cursor-pointer hover:bg-warning/20 transition-colors"
                              onClick={() => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span>{area?.icon}</span>
                                <span className="truncate">{habit.name}</span>
                              </span>
                              <Badge variant="outline" className="text-streak shrink-0">
                                {habit.streak} 🔥
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-sm">Mẹo xây dựng Habits</span>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="p-2 rounded-lg bg-muted/50">💪 Bắt đầu nhỏ: 2 phút mỗi ngày</p>
                      <p className="p-2 rounded-lg bg-muted/50">⏰ Gắn với thói quen có sẵn</p>
                      <p className="p-2 rounded-lg bg-muted/50">🎯 Tập trung vào streak, không hoàn hảo</p>
                      <p className="p-2 rounded-lg bg-muted/50">📊 Review tiến độ mỗi tuần</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-info" />
                      <span className="font-medium text-sm">Thống kê</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tổng habits</span>
                        <span className="font-medium">{totalHabits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Đã archive</span>
                        <span className="font-medium">{archivedHabits.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tỉ lệ 30 ngày</span>
                        <span className="font-medium">{avgCompletion}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedHabit && (
          <HabitDetailModal
            habit={selectedHabit}
            open={isDetailModalOpen}
            onOpenChange={(open) => {
              setIsDetailModalOpen(open);
              if (!open) {
                setSelectedHabit(null);
              }
            }}
          />
        )}
      </div>
    );
  }

  // Mobile Layout with Swipe Gestures
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold">Habits</h1>
        <div className="flex items-center gap-2">
          <HabitFilters
            filterArea={filterArea}
            onFilterAreaChange={setFilterArea}
            filterFrequency={filterFrequency}
            onFilterFrequencyChange={setFilterFrequency}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <Button variant="outline" size="icon" onClick={() => setShowHistoryManager(true)}>
            <History className="w-4 h-4" />
          </Button>
          {AddHabitButton}
        </div>
      </div>

      {/* History Manager Modal (Mobile) */}
      <HabitHistoryManager open={showHistoryManager} onOpenChange={setShowHistoryManager} />

      <p className="text-xs text-muted-foreground -mt-4">
        💡 Vuốt phải để hoàn thành, vuốt trái để xóa, nhấn để xem chi tiết
      </p>

      {/* Quick Stats Mobile */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold">{totalHabits}</p>
            <p className="text-[10px] text-muted-foreground">Tổng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-success">{completedToday}</p>
            <p className="text-[10px] text-muted-foreground">Hôm nay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-streak">{totalStreak}</p>
            <p className="text-[10px] text-muted-foreground">Streaks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold">{avgCompletion}%</p>
            <p className="text-[10px] text-muted-foreground">30 ngày</p>
          </CardContent>
        </Card>
      </div>

      {filteredAndSortedHabits.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              {habits.length === 0 ? 'Chưa có habit nào' : 'Không có habit nào phù hợp'}
            </p>
            <p className="text-sm mt-1">
              {habits.length === 0 ? 'Bắt đầu xây dựng thói quen tốt ngay!' : 'Thử điều chỉnh bộ lọc'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedHabits.map((habit) => {
            const target = habit.targetPerDay || 1;
            const todayCompletion = habit.completions?.find(c => c.date === todayStr);
            const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
            const isCompletedToday = todayCount >= target;
            const area = LIFE_AREAS.find((a) => a.id === habit.area);
            
            return (
              <SwipeableCard
                key={habit.id}
                onSwipeRight={() => handleIncrementHabit(habit.id, todayStr)}
                onSwipeLeft={() => { setHabitToDelete(habit); setDeleteDialogOpen(true); }}
                rightAction="complete"
                leftAction="delete"
                rightLabel={target > 1 ? `+1 (${todayCount}/${target})` : 'Hoàn thành'}
                leftLabel="Xóa"
                disabled={false}
              >
                <Card 
                  className={cn('overflow-hidden', isCompletedToday && 'ring-2 ring-success/50')}
                  onClick={() => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0',
                          isCompletedToday ? 'bg-success text-success-foreground' : 'bg-secondary'
                        )}
                        style={{ backgroundColor: isCompletedToday ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
                      >
                        {isCompletedToday ? <CheckCircle2 className="w-6 h-6" /> : target > 1 ? `${todayCount}/${target}` : (habit.icon || area?.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{habit.name}</h3>
                          {habit.streak > 0 && (
                            <div className="flex items-center gap-1 text-streak bg-streak/10 px-2 py-0.5 rounded-full">
                              <Flame className="w-3 h-3" />
                              <span className="text-xs font-bold">{habit.streak}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{area?.name}</p>
                        {/* Mini heatmap */}
                        <div className="flex gap-0.5 mt-2">
                          {last30Days.slice(-14).map((date) => (
                            <div
                              key={date}
                              className={cn(
                                'w-2 h-2 rounded-sm',
                                habit.completedDates.includes(date) ? 'bg-success' : 'bg-secondary'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SwipeableCard>
            );
          })}
        </div>
      )}

      {/* AI, Challenges & Competition Section (Mobile) */}
      <HabitPredictionCard habits={habits} />
      <HabitChallengesCard habits={habits} />
      <HabitCompetitionCard habits={habits} />

      {/* Archived Habits Section (Mobile) */}
      <ArchivedHabitsSection 
        archivedHabits={archivedHabits} 
        onViewDetail={(habit) => {
          setSelectedHabit(habit);
          setIsDetailModalOpen(true);
        }}
      />

      {/* Detail Modal */}
      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          open={isDetailModalOpen}
          onOpenChange={(open) => {
            setIsDetailModalOpen(open);
            if (!open) {
              setSelectedHabit(null);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setHabitToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa habit này?</AlertDialogTitle>
            <AlertDialogDescription>
              Habit "{habitToDelete?.name}" sẽ được chuyển vào thùng rác. Bạn có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setHabitToDelete(null);
              setDeleteDialogOpen(false);
            }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async (e) => {
                e.preventDefault();
                if (habitToDelete) {
                  try {
                    await deleteHabit(habitToDelete.id);
                    setHabitToDelete(null);
                    setDeleteDialogOpen(false);
                    toast.success('Đã chuyển vào thùng rác');
                  } catch (error) {
                    console.error('Error deleting habit:', error);
                    toast.error('Không thể xóa habit. Vui lòng thử lại.');
                  }
                }
              }} 
              className="bg-destructive text-destructive-foreground"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {AddHabitDialog}
    </div>
  );
}