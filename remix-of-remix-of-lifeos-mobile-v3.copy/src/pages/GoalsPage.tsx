import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Target, CheckCircle2, Circle, MoreVertical, Trash2, ChevronDown, ChevronUp, Calendar, Clock, AlertTriangle, Eye, Bell, BellOff, Link2, Lock, Focus, Flame, Lightbulb, PanelRightClose, PanelRight } from 'lucide-react';
import { format, parseISO, differenceInDays, isPast, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type Goal } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGoalReminder } from '@/hooks/useGoalReminder';
import { GoalDetailModal } from '@/components/goals/GoalDetailModal';
import { GoalFilters, type GoalSortBy, type GoalSortOrder, type GoalStatusFilter } from '@/components/goals/GoalFilters';
import { GoalAnalyticsCard } from '@/components/goals/GoalAnalyticsCard';
import { GoalTemplatesCard } from '@/components/goals/GoalTemplatesCard';
import { GoalFocusMode } from '@/components/goals/GoalFocusMode';
import { GoalHistoryDialog } from '@/components/goals/GoalHistoryDialog';
import { GoalSidebar } from '@/components/goals/GoalSidebar';
import { GoalStreaksCard } from '@/components/goals/GoalStreaksCard';
import { GoalNotificationsCard } from '@/components/goals/GoalNotificationsCard';
import { GoalPerformanceComparison } from '@/components/goals/GoalPerformanceComparison';
import { toast } from 'sonner';
import { useAdminTemplates, useUpdateTemplate } from '@/hooks/useAdminData';

export default function GoalsPage() {
  const goals = useLifeOSStore((s) => s.goals);
  
  // Use synced store for CRUD operations that need to sync to Supabase
  const { addGoal, updateGoal, deleteGoal, toggleMilestone, isSyncEnabled } = useSyncedStore();
  
  const isMobile = useIsMobile();

  // Enable goal reminders
  useGoalReminder();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState<'form' | 'templates'>('form');
  const [newGoal, setNewGoal] = useState({ title: '', description: '', area: 'career' as LifeArea, milestones: '', targetDate: '' });
  
  // Load goal templates from database
  const { data: goalTemplates = [], isLoading: templatesLoading } = useAdminTemplates('goals');
  const updateTemplate = useUpdateTemplate();
  
  // Filter only active templates
  const activeTemplates = goalTemplates.filter(t => t.is_active);
  const [expandedGoals, setExpandedGoals] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openGoalDetail = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailModalOpen(true);
  }, []);

  // Delete confirmation state
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter & Sort state
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<GoalStatusFilter>('all');
  const [sortBy, setSortBy] = useState<GoalSortBy>('progress');
  const [sortOrder, setSortOrder] = useState<GoalSortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar collapse state with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('lifeos.goals.sidebarOpen');
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('lifeos.goals.sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;
    addGoal({
      ...newGoal,
      targetDate: newGoal.targetDate || undefined,
      milestones: newGoal.milestones.split('\n').filter(Boolean),
    });
    setNewGoal({ title: '', description: '', area: 'career', milestones: '', targetDate: '' });
    setIsDialogOpen(false);
    toast.success('Đã thêm goal mới');
  };

  const toggleExpand = (id: string) => {
    setExpandedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const handleCompleteGoal = (goal: Goal) => {
    updateGoal(goal.id, { 
      completedAt: new Date().toISOString(),
      progress: 100,
      milestones: goal.milestones.map(m => ({ ...m, completed: true, completedAt: m.completedAt || new Date().toISOString() }))
    });
    toast.success('🎉 Goal đã hoàn thành!');
  };

  // Filter and sort goals (exclude deleted)
  const filteredAndSortedGoals = useMemo(() => {
    const today = new Date();
    let result = goals.filter(g => !g.deletedAt);

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.title.toLowerCase().includes(query) || 
        g.description?.toLowerCase().includes(query)
      );
    }

    // Apply area filter
    if (filterArea !== 'all') {
      result = result.filter(g => g.area === filterArea);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(g => {
        const isCompleted = !!g.completedAt;
        const targetDate = g.targetDate ? parseISO(g.targetDate) : null;
        const daysRemaining = targetDate ? differenceInDays(targetDate, today) : null;
        const isOverdue = targetDate && isPast(targetDate) && !isCompleted;
        const isApproaching = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && !isCompleted;

        switch (filterStatus) {
          case 'active': return !isCompleted;
          case 'completed': return isCompleted;
          case 'overdue': return isOverdue;
          case 'approaching': return isApproaching;
          default: return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'deadline':
          if (!a.targetDate && !b.targetDate) comparison = 0;
          else if (!a.targetDate) comparison = 1;
          else if (!b.targetDate) comparison = -1;
          else comparison = new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'area':
          comparison = a.area.localeCompare(b.area);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [goals, filterArea, filterStatus, sortBy, sortOrder, searchQuery]);

  const activeFiltersCount = (filterArea !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);
  const handleClearFilters = () => {
    setFilterArea('all');
    setFilterStatus('all');
  };

  const activeGoals = goals.filter((g) => !g.completedAt && !g.deletedAt);
  const completedGoals = goals.filter((g) => g.completedAt && !g.deletedAt);
  const overdueGoals = activeGoals.filter(g => g.targetDate && isPast(parseISO(g.targetDate)));
  const approachingGoals = activeGoals.filter(g => {
    if (!g.targetDate || g.completedAt) return false;
    const days = differenceInDays(parseISO(g.targetDate), new Date());
    return days > 0 && days <= 7;
  });
  const focusedGoals = activeGoals.filter(g => g.isFocused);

  const totalProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length) 
    : 0;
  
  const totalMilestones = activeGoals.reduce((sum, g) => sum + g.milestones.length, 0);
  const completedMilestones = activeGoals.reduce((sum, g) => sum + g.milestones.filter(m => m.completed).length, 0);

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const area = LIFE_AREAS.find((a) => a.id === goal.area);
    const isExpanded = expandedGoals.includes(goal.id);
    const completedMilestones = goal.milestones.filter((m) => m.completed).length;
    
    // Target date calculations
    const hasTargetDate = !!goal.targetDate;
    const targetDate = hasTargetDate ? parseISO(goal.targetDate!) : null;
    const daysRemaining = targetDate ? differenceInDays(targetDate, new Date()) : null;
    const isOverdue = targetDate ? isPast(targetDate) && goal.progress < 100 && !goal.completedAt : false;
    const isApproaching = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isCompleted = !!goal.completedAt;

    // Dependencies check
    const dependencies = goal.dependencies || [];
    const prerequisiteGoals = goals.filter(g => dependencies.includes(g.id));
    const allPrereqsMet = prerequisiteGoals.every(g => g.completedAt);
    const isLocked = dependencies.length > 0 && !allPrereqsMet && !isCompleted;
    const hasDependents = (goal.dependents || []).length > 0;

    // Radix DropdownMenu Trigger has been flaky on some environments; control it explicitly.
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
      <Card className={cn(
        "overflow-hidden transition-all",
        isOverdue && "border-destructive/50",
        isCompleted && "opacity-70",
        isLocked && "border-warning/50 bg-warning/5"
      )}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(goal.id)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Progress Ring */}
              <div 
                className="relative w-14 h-14 shrink-0 cursor-pointer"
                onClick={() => {
                  openGoalDetail(goal);
                }}
              >
                {isLocked ? (
                  <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-warning" />
                  </div>
                ) : (
                  <>
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle cx="28" cy="28" r="24" stroke="hsl(var(--secondary))" strokeWidth="5" fill="none" />
                      <circle
                        cx="28" cy="28" r="24"
                        stroke={isCompleted ? "hsl(var(--success))" : `hsl(var(--${area?.color}))`}
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${(goal.progress / 100) * 150.8} 150.8`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {goal.progress}%
                    </span>
                  </>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="flex-1 cursor-pointer text-left"
                    onClick={() => openGoalDetail(goal)}
                    onPointerUp={(e) => {
                      // Some mobile browsers cancel click on slight scroll; pointerup is more reliable for touch.
                      if (e.pointerType === 'touch') openGoalDetail(goal);
                    }}
                  >
                    <h3 className="font-semibold hover:text-primary transition-colors">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `hsl(var(--${area?.color}) / 0.2)`, color: `hsl(var(--${area?.color}))` }}
                      >
                        {area?.icon} {area?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {completedMilestones}/{goal.milestones.length} milestones
                      </span>
                      {isLocked ? (
                        <Badge variant="outline" className="text-xs text-warning border-warning">
                          <Lock className="w-3 h-3 mr-1" /> Đang khóa
                        </Badge>
                      ) : isCompleted ? (
                        <span className="text-xs flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </span>
                      ) : hasTargetDate && (
                        <span className={cn(
                          "text-xs flex items-center gap-1",
                          isOverdue ? "text-destructive" : isApproaching ? "text-warning" : "text-muted-foreground"
                        )}>
                          {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                          {isOverdue ? 'Quá hạn' : daysRemaining === 0 ? 'Hôm nay' : `${daysRemaining} ngày`}
                        </span>
                      )}
                      {(dependencies.length > 0 || hasDependents) && !isLocked && (
                        <Badge variant="secondary" className="text-xs">
                          <Link2 className="w-3 h-3 mr-1" />
                          {dependencies.length > 0 && `${dependencies.length} prereq`}
                          {dependencies.length > 0 && hasDependents && ' • '}
                          {hasDependents && `${goal.dependents?.length} next`}
                        </Badge>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onPointerDown={(e) => {
                            // Prevent Radix Trigger default toggling; we control open state explicitly.
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen((v) => !v);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={() => {
                          setIsMenuOpen(false);
                          openGoalDetail(goal);
                        }}>
                          <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                        </DropdownMenuItem>
                        {!isCompleted && (
                          <>
                            <DropdownMenuItem onSelect={() => handleCompleteGoal(goal)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Đánh dấu hoàn thành
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                              updateGoal(goal.id, { reminderEnabled: !goal.reminderEnabled });
                              toast.success(goal.reminderEnabled ? 'Đã tắt nhắc nhở' : 'Đã bật nhắc nhở');
                            }}>
                              {goal.reminderEnabled ? (
                                <><BellOff className="w-4 h-4 mr-2" /> Tắt nhắc nhở</>
                              ) : (
                                <><Bell className="w-4 h-4 mr-2" /> Bật nhắc nhở</>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => { setGoalToDelete(goal); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <Progress value={goal.progress} className="h-2" />
                  {hasTargetDate && (
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>Bắt đầu: {format(parseISO(goal.createdAt), 'dd/MM/yyyy')}</span>
                      <span>Đích: {format(targetDate!, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
                
                {goal.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{goal.description}</p>}
              </div>
            </div>

            {/* Milestones */}
            <CollapsibleContent>
              <div className="mt-4 pt-4 border-t space-y-2">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors",
                      milestone.completed && "opacity-60"
                    )}
                    onClick={() => !isCompleted && toggleMilestone(goal.id, milestone.id)}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn("text-sm", milestone.completed && "line-through")}>{milestone.title}</span>
                  </div>
                ))}
                {goal.milestones.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Chưa có milestone - nhấn "Xem chi tiết" để thêm
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    );
  };

  const handleApplyTemplate = (template: typeof goalTemplates[0]) => {
    const content = template.content as {
      title?: string;
      description?: string;
      area?: LifeArea;
      milestones?: string[];
      suggested_duration_days?: number;
      priority?: string;
    };
    
    const durationDays = content.suggested_duration_days || 90;
    const targetDate = format(addDays(new Date(), durationDays), 'yyyy-MM-dd');
    
    setNewGoal({
      title: content.title || template.name,
      description: content.description || template.description || '',
      area: content.area || 'career',
      milestones: (content.milestones || []).join('\n'),
      targetDate,
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

  const AddGoalDialog = (
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setShowTemplates('form'); }}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size={isMobile ? "sm" : "default"}>
                <Plus className="w-4 h-4" />
                {!isMobile && <span className="ml-2">Thêm Goal</span>}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">Thêm Goal mới</p>
            <p className="text-xs text-muted-foreground">Tạo mục tiêu với milestones và deadline</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm Goal mới</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Template view / Form view switcher */}
          {showTemplates === 'templates' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Chọn Template
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates('form')}>
                  ← Quay lại
                </Button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templatesLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Đang tải templates...</div>
                ) : activeTemplates.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Chưa có templates nào</div>
                ) : (
                  activeTemplates.map(template => {
                    const content = template.content as {
                      area?: LifeArea;
                      milestones?: string[];
                      suggested_duration_days?: number;
                    };
                    const area = LIFE_AREAS.find(a => a.id === content.area);
                    const milestones = content.milestones || [];
                    const durationDays = content.suggested_duration_days || 90;

                    return (
                      <div
                        key={template.id}
                        className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{area?.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {milestones.length} milestones • {durationDays} ngày
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
                <Badge variant="secondary">{activeTemplates.length}</Badge>
              </Button>

          <div>
            <Label>Tiêu đề *</Label>
            <Input placeholder="VD: Học IELTS 7.0" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea placeholder="Chi tiết mục tiêu..." value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} />
          </div>
          <div>
            <Label>Lĩnh vực</Label>
            <Select value={newGoal.area} onValueChange={(v) => setNewGoal({ ...newGoal, area: v as LifeArea })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIFE_AREAS.map((area) => (<SelectItem key={area.id} value={area.id}>{area.icon} {area.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ngày mục tiêu hoàn thành</Label>
            <Input 
              type="date" 
              value={newGoal.targetDate} 
              onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} 
            />
          </div>
          <div>
            <Label>Milestones (mỗi dòng 1 milestone)</Label>
            <Textarea
              placeholder="Milestone 1&#10;Milestone 2&#10;Milestone 3"
              value={newGoal.milestones}
              onChange={(e) => setNewGoal({ ...newGoal, milestones: e.target.value })}
              rows={4}
            />
          </div>
          <Button className="w-full" onClick={handleAddGoal}>Thêm Goal</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header with inline stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="min-w-0 shrink-0">
            <h1 className="text-xl md:text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground hidden md:block text-sm">Mục tiêu và milestones</p>
          </div>
          
          {/* Compact Stats - inline with title */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 cursor-default">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold">{activeGoals.length}</span>
                    <span className="text-[10px] text-muted-foreground">active</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>{activeGoals.length} goals đang thực hiện</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info/10 cursor-default">
                    <div className="relative w-4 h-4">
                      <svg className="w-4 h-4 transform -rotate-90">
                        <circle cx="8" cy="8" r="6" stroke="hsl(var(--secondary))" strokeWidth="2" fill="none" />
                        <circle 
                          cx="8" cy="8" r="6" 
                          stroke="hsl(var(--info))" 
                          strokeWidth="2" 
                          fill="none" 
                          strokeDasharray={`${(totalProgress / 100) * 37.7} 37.7`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-info">{totalProgress}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Tiến độ trung bình</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/50 cursor-default">
                    <Circle className="w-3.5 h-3.5 text-foreground/70" />
                    <span className="text-xs font-bold">{completedMilestones}/{totalMilestones}</span>
                    <span className="text-[10px] text-muted-foreground">MS</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>{completedMilestones} / {totalMilestones} milestones hoàn thành</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 cursor-default">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span className="text-xs font-bold text-success">{completedGoals.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>{completedGoals.length} goals hoàn thành</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {focusedGoals.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 cursor-default">
                      <Focus className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="text-xs font-bold text-yellow-600">{focusedGoals.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>{focusedGoals.length} goals đang focus</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {approachingGoals.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 cursor-default">
                      <Clock className="w-3.5 h-3.5 text-warning" />
                      <span className="text-xs font-bold text-warning">{approachingGoals.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>{approachingGoals.length} goals sắp đến hạn (≤7 ngày)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {overdueGoals.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 cursor-default">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      <span className="text-xs font-bold text-destructive">{overdueGoals.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>{overdueGoals.length} goals quá hạn</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
          <GoalFilters
            filterArea={filterArea}
            onFilterAreaChange={setFilterArea}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <GoalHistoryDialog onViewDetail={(goal) => {
            setSelectedGoal(goal);
            setIsDetailModalOpen(true);
          }} />
          {AddGoalDialog}
          {/* Sidebar Toggle Button for Desktop */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="h-8 w-8 hidden lg:flex"
                >
                  {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isSidebarOpen ? 'Thu gọn sidebar' : 'Mở sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Mobile Stats Grid - only on mobile */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold">{activeGoals.length}</p>
            <p className="text-[10px] text-muted-foreground">Đang làm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-info">{totalProgress}%</p>
            <p className="text-[10px] text-muted-foreground">Tiến độ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-success">{completedGoals.length}</p>
            <p className="text-[10px] text-muted-foreground">Xong</p>
          </CardContent>
        </Card>
        <Card className={cn(overdueGoals.length > 0 && "border-destructive/30")}>
          <CardContent className="p-2 text-center">
            <p className={cn("text-lg font-bold", overdueGoals.length > 0 && "text-destructive")}>{overdueGoals.length}</p>
            <p className="text-[10px] text-muted-foreground">Quá hạn</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Goals List */}
        <div className={cn(
          "flex-1 space-y-4 min-w-0 transition-all duration-300",
          !isMobile && isSidebarOpen && "lg:mr-0"
        )}>
          {filteredAndSortedGoals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-lg">
                  {goals.length === 0 ? 'Chưa có goal nào' : 'Không có goal nào phù hợp'}
                </p>
                <p className="text-sm mt-1">
                  {goals.length === 0 ? 'Bắt đầu đặt mục tiêu để theo dõi tiến độ!' : 'Thử điều chỉnh bộ lọc'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "grid gap-4",
              !isMobile && !isSidebarOpen && "lg:grid-cols-2 xl:grid-cols-3",
              !isMobile && isSidebarOpen && "lg:grid-cols-1 xl:grid-cols-2"
            )}>
              {filteredAndSortedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
            </div>
          )}
        </div>

        {/* Sidebar (Desktop/Tablet) */}
        {!isMobile && (
          <div className={cn(
            "hidden lg:block transition-all duration-300 shrink-0",
            isSidebarOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden"
          )}>
            {isSidebarOpen && (
              <GoalSidebar goals={goals} onViewGoal={(goal) => {
                setSelectedGoal(goal);
                setIsDetailModalOpen(true);
              }} />
            )}
          </div>
        )}

      </div>

      {/* Mobile: Compact cards */}
      {isMobile && (
        <div className="space-y-4">
          <GoalFocusMode onViewGoal={(goal) => {
            setSelectedGoal(goal);
            setIsDetailModalOpen(true);
          }} />
          <GoalStreaksCard goals={goals} />
          <GoalPerformanceComparison goals={goals} />
        </div>
      )}

      {/* Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          open={isDetailModalOpen}
          onOpenChange={(open) => {
            setIsDetailModalOpen(open);
            if (!open) {
              setSelectedGoal(null);
            }
          }}
        />
      )}

      {/* Shared Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setGoalToDelete(null);
            setDeleteDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa goal này?</AlertDialogTitle>
            <AlertDialogDescription>
              Goal "{goalToDelete?.title}" sẽ được chuyển vào thùng rác. Bạn có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setGoalToDelete(null); setDeleteDialogOpen(false); }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (goalToDelete) {
                  deleteGoal(goalToDelete.id);
                  setGoalToDelete(null);
                  setDeleteDialogOpen(false);
                  toast.success('Đã chuyển vào thùng rác');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
