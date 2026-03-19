import { useState, useMemo, useEffect } from 'react';
import { Plus, Play, CheckCircle2, Circle, Clock, ListTodo, CheckCheck, Timer, CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, ArrowUpDown, X, Search, Pause, Repeat, Bell, History, Archive, ArchiveRestore, Trash2, Minimize2, Maximize2, ChevronsUpDown, TrendingUp, Lightbulb, Target, ChevronUpIcon, ChevronDownIcon, PanelRight, PanelRightClose } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString, getTodayStart } from '@/utils/dateUtils';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type Task } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { SwipeableCard } from '@/components/mobile/SwipeableCardPointer';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useTaskReminder } from '@/hooks/useTaskReminder';
import { useGoalCompletionNotification } from '@/hooks/useGoalCompletionNotification';
import { ProductivityStats } from '@/components/tasks/ProductivityStats';
import { ProductivityChart } from '@/components/tasks/ProductivityChart';
import { PomodoroStatsCard } from '@/components/pomodoro/PomodoroStatsCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DndKanbanBoard } from '@/components/tasks/DndKanbanBoard';
import { TapInspectorOverlay } from '@/components/debug/TapInspectorOverlay';
import { captureTapInspectorPayload, type TapInspectorPayload } from '@/lib/tapInspector';
import { TaskFilters, type FilterStatus, type FilterPriority, type FilterDueDate, type SortBy } from '@/components/tasks/TaskFilters';
import { TaskFilterSheet } from '@/components/tasks/TaskFilterSheet';
import { useKanbanPreferences } from '@/hooks/useKanbanPreferences';
import { TasksSidebar } from '@/components/tasks/TasksSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminTemplates, useUpdateTemplate } from '@/hooks/useAdminData';

// Types imported from TaskFilters component

export default function TasksPage() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const archiveTask = useLifeOSStore((s) => s.archiveTask);
  const unarchiveTask = useLifeOSStore((s) => s.unarchiveTask);
  const autoArchiveOldTasks = useLifeOSStore((s) => s.autoArchiveOldTasks);
  const reorderTasks = useLifeOSStore((s) => s.reorderTasks);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const taskTags = useLifeOSStore((s) => s.taskTags);
  const startPomodoro = usePomodoroStore((s) => s.start);
  
  // Use synced store for CRUD operations that need to sync to Supabase
  const { addTask, updateTask, deleteTask, isSyncEnabled } = useSyncedStore();
  
  const isMobile = useIsMobile();

  const debugTapEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debugTap');
  }, []);

  const disableDndInitial = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.has('noDnd')) return true;
    try {
      return localStorage.getItem('lifeos.debug.disableDnd') === '1';
    } catch {
      return false;
    }
  }, []);
  const [disableDnd, setDisableDnd] = useState(disableDndInitial);

  const [tapInspectorPayload, setTapInspectorPayload] = useState<TapInspectorPayload | null>(null);

  // Enable task reminders
  useTaskReminder();
  
  // Enable goal completion notification
  useGoalCompletionNotification();

  // Auto-archive old tasks on mount
  useEffect(() => {
    autoArchiveOldTasks();
  }, [autoArchiveOldTasks]);

  // Persist debug setting (only when debugTap is enabled)
  useEffect(() => {
    if (!debugTapEnabled) return;
    try {
      localStorage.setItem('lifeos.debug.disableDnd', disableDnd ? '1' : '0');
    } catch {
      // ignore
    }
  }, [debugTapEnabled, disableDnd]);

  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'history' | 'archived'>('kanban');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Sidebar state with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos.tasks.sidebarOpen');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('lifeos.tasks.sidebarOpen', JSON.stringify(isSidebarOpen));
    } catch {
      // ignore
    }
  }, [isSidebarOpen]);
  
  // Kanban optimization - use preferences hook
  const kanbanPrefs = useKanbanPreferences();
  const [isCompactView, setIsCompactView] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(true);
  const [isPomodoroCollapsed, setIsPomodoroCollapsed] = useState(true);
  
  // Filter & Sort states
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterDueDate, setFilterDueDate] = useState<FilterDueDate>('all');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [sortAsc, setSortAsc] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Delete confirmation state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Pomodoro dialog state
  const [pomodoroDialogOpen, setPomodoroDialogOpen] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [customPomodoroDuration, setCustomPomodoroDuration] = useState<number | ''>('');
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  
  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      setDeleteDialogOpen(false);
      toast.success('Đã chuyển vào thùng rác');
    }
  };

  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    area?: LifeArea;
    priority: 'low' | 'medium' | 'high';
    estimatedPomodoros?: number;
    dueDate?: string;
    goalId?: string;
  }>({ title: '', description: '', priority: 'medium' });
  const [showTemplates, setShowTemplates] = useState<'form' | 'templates'>('form');
  
  // Load task templates from database
  const { data: taskTemplates = [], isLoading: templatesLoading } = useAdminTemplates('tasks');
  const updateTemplate = useUpdateTemplate();
  
  // Filter only active templates
  const activeTemplates = taskTemplates.filter(t => t.is_active);

  const handleApplyTaskTemplate = (template: typeof taskTemplates[0]) => {
    const content = template.content as {
      title?: string;
      description?: string;
      area?: LifeArea;
      priority?: 'low' | 'medium' | 'high';
      estimatedPomodoros?: number;
    };
    
    setNewTask({
      title: content.title || template.name,
      description: content.description || template.description || '',
      area: content.area,
      priority: content.priority || 'medium',
      estimatedPomodoros: content.estimatedPomodoros,
      dueDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    });
    setShowTemplates('form');
    
    // Update usage count (silent update, no toast)
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

  // Use timezone-aware date utilities (GMT+7)
  const todayStr = getTodayDateString();
  const today = getTodayStart();
  const todayPomodoros = pomodoroSessions.filter(s => s.completedAt.startsWith(todayStr) && s.phase === 'work').length;

  // Filter and sort tasks (exclude archived and deleted)
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => !t.archived && !t.deletedAt);

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority === filterPriority);
    }
    if (filterArea !== 'all') {
      result = result.filter(t => t.area === filterArea);
    }
    if (filterGoal !== 'all') {
      if (filterGoal === 'no_goal') {
        result = result.filter(t => !t.goalId);
      } else {
        result = result.filter(t => t.goalId === filterGoal);
      }
    }
    if (filterDueDate !== 'all') {
      result = result.filter(t => {
        if (filterDueDate === 'no_date') return !t.dueDate;
        if (!t.dueDate) return false;
        const dueDate = parseISO(t.dueDate);
        if (filterDueDate === 'overdue') return dueDate < today && t.status !== 'done';
        if (filterDueDate === 'today') return t.dueDate === todayStr;
        if (filterDueDate === 'upcoming') return dueDate > today;
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'position':
          comparison = (a.position ?? 0) - (b.position ?? 0);
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'createdAt':
          comparison = b.createdAt.localeCompare(a.createdAt);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortAsc ? -comparison : comparison;
    });

    return result;
  }, [tasks, filterStatus, filterPriority, filterArea, filterGoal, filterDueDate, sortBy, sortAsc, today, todayStr, searchQuery]);

  // Focus mode: show only important tasks (high priority, due soon, in progress)
  const displayTasks = useMemo(() => {
    if (!kanbanPrefs.focusMode) return filteredAndSortedTasks;
    
    return filteredAndSortedTasks.filter(t => {
      // Always show in-progress tasks
      if (t.status === 'in_progress') return true;
      // Show high priority tasks
      if (t.priority === 'high') return true;
      // Show tasks due today or overdue
      if (t.dueDate) {
        const dueDate = parseISO(t.dueDate);
        if (dueDate <= today) return true;
      }
      return false;
    });
  }, [filteredAndSortedTasks, kanbanPrefs.focusMode, today]);

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterArea !== 'all' || filterGoal !== 'all' || filterDueDate !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterArea('all');
    setFilterGoal('all');
    setFilterDueDate('all');
    setSearchQuery('');
  };

  const handleQuickFilter = (filter: 'today' | 'overdue' | 'high') => {
    clearFilters();
    if (filter === 'today') {
      setFilterDueDate('today');
    } else if (filter === 'overdue') {
      setFilterDueDate('overdue');
    } else if (filter === 'high') {
      setFilterPriority('high');
    }
  };

  // Memoize tab tasks to ensure they update when displayTasks changes
  const todoTasks = useMemo(() => displayTasks.filter((t) => t.status === 'todo'), [displayTasks]);
  const inProgressTasks = useMemo(() => displayTasks.filter((t) => t.status === 'in_progress'), [displayTasks]);
  const deferredTasks = useMemo(() => displayTasks.filter((t) => t.status === 'deferred'), [displayTasks]);
  const doneTasks = useMemo(() => displayTasks.filter((t) => t.status === 'done'), [displayTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề task');
      return;
    }
    
    try {
      await addTask({ ...newTask, status: 'todo' });
      setNewTask({ title: '', description: '', priority: 'medium' });
      setIsDialogOpen(false);
      toast.success('Đã thêm task mới');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Không thể thêm task. Vui lòng thử lại.');
    }
  };

  const handleStartPomodoro = (task: Task) => {
    setPomodoroTask(task);
    setCustomPomodoroDuration('');
    setPomodoroDialogOpen(true);
  };
  
  const confirmStartPomodoro = () => {
    if (pomodoroTask) {
      const duration = customPomodoroDuration || undefined;
      startPomodoro(pomodoroTask.id, duration as number | undefined);
      updateTask(pomodoroTask.id, { status: 'in_progress' });
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setPomodoroDialogOpen(false);
      setPomodoroTask(null);
      toast.success(`Bắt đầu Pomodoro ${duration || pomodoroSettings.workDuration} phút`);
    }
  };

  const handleToggleComplete = (task: Task) => {
    if (task.status === 'done') {
      updateTask(task.id, { status: 'todo', completedAt: undefined });
    } else {
      updateTask(task.id, { status: 'done', completedAt: new Date().toISOString() });
    }
  };

  const AddTaskDialog = (
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setShowTemplates('form'); }}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">Thêm Task mới</p>
            <p className="text-xs text-muted-foreground">Tạo công việc với độ ưu tiên, deadline và liên kết mục tiêu</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm Task mới</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Template view / Form view switcher */}
          {showTemplates === 'templates' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Chọn Template Task
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
                      priority?: 'low' | 'medium' | 'high';
                      estimatedPomodoros?: number;
                    };
                    const area = LIFE_AREAS.find(a => a.id === content.area);
                    const priority = content.priority || 'medium';
                    const pomodoros = content.estimatedPomodoros || 0;

                    return (
                      <div
                        key={template.id}
                        className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                        onClick={() => handleApplyTaskTemplate(template)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{area?.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'} {pomodoros} pomodoros
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
            <Label>Tiêu đề</Label>
            <Input placeholder="VD: Hoàn thành báo cáo" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
          </div>
          <div>
            <Label>Mô tả (tùy chọn)</Label>
            <Textarea placeholder="Chi tiết công việc..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lĩnh vực</Label>
              <Select value={newTask.area || ''} onValueChange={(v) => setNewTask({ ...newTask, area: v as LifeArea || undefined })}>
                <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((area) => (<SelectItem key={area.id} value={area.id}>{area.icon} {area.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ưu tiên</Label>
              <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as 'low' | 'medium' | 'high' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Thấp</SelectItem>
                  <SelectItem value="medium">🟡 Trung bình</SelectItem>
                  <SelectItem value="high">🔴 Cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ngày deadline</Label>
              <Input type="date" value={newTask.dueDate || ''} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value || undefined })} />
            </div>
            <div>
              <Label>Ước tính Pomodoros</Label>
              <Input type="number" min="1" max="20" placeholder="VD: 4" value={newTask.estimatedPomodoros || ''} onChange={(e) => setNewTask({ ...newTask, estimatedPomodoros: e.target.value ? parseInt(e.target.value) : undefined })} />
            </div>
          </div>
          <div>
            <Label>Liên kết Goal</Label>
            <Select value={newTask.goalId ?? 'none'} onValueChange={(v) => setNewTask({ ...newTask, goalId: v === 'none' ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Chọn goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không liên kết</SelectItem>
                {goals.filter(g => !g.deletedAt && g.progress < 100).map((goal) => {
                  const goalArea = LIFE_AREAS.find((a) => a.id === goal.area);
                  return (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goalArea?.icon} {goal.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleAddTask}
          >
            Thêm Task
          </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );


  // Recurring History Component
  const RecurringHistoryView = () => {
    const recurringTasks = tasks.filter(t => t.recurring);
    const completedRecurringTasks = tasks.filter(t => t.status === 'done' && t.recurring);
    
    // Group by title (original task name)
    const groupedHistory = completedRecurringTasks.reduce((acc, task) => {
      const key = task.title;
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <History className="w-4 h-4" />
          <span>Tổng: {completedRecurringTasks.length} task lặp lại đã hoàn thành</span>
        </div>
        
        {Object.entries(groupedHistory).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Repeat className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có task lặp lại nào được hoàn thành</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedHistory).map(([title, completedTasks]) => (
            <Card key={title}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-primary" />
                    <span className="font-medium">{title}</span>
                  </div>
                  <Badge variant="secondary">{completedTasks.length} lần</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {completedTasks.slice(0, 10).map((task) => (
                    <span key={task.id} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                      {task.completedAt ? format(parseISO(task.completedAt), 'dd/MM') : ''}
                    </span>
                  ))}
                  {completedTasks.length > 10 && (
                    <span className="text-xs text-muted-foreground">+{completedTasks.length - 10}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  // Archived Tasks View
  const ArchivedView = () => {
    const archivedTasks = tasks.filter(t => t.archived);
    
    const handleDeleteAllArchived = () => {
      archivedTasks.forEach(task => deleteTask(task.id));
    };
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Archive className="w-4 h-4" />
            <span>Tổng: {archivedTasks.length} task đã lưu trữ</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Task hoàn thành quá 30 ngày sẽ tự động được lưu trữ
            </p>
            {archivedTasks.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1">
                    <Trash2 className="w-3 h-3" />
                    Xóa tất cả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa tất cả task đã lưu trữ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn sắp xóa vĩnh viễn {archivedTasks.length} task đã lưu trữ. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllArchived} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Xóa tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        
        {archivedTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có task nào được lưu trữ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {archivedTasks.map((task) => {
              const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
              return (
                <Card key={task.id} className="opacity-70">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <div>
                          <p className="font-medium text-sm line-through text-muted-foreground">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {area && <span>{area.icon}</span>}
                            {task.completedAt && <span>Hoàn thành: {format(parseISO(task.completedAt), 'dd/MM/yyyy')}</span>}
                            {task.archivedAt && <span>• Lưu trữ: {format(parseISO(task.archivedAt), 'dd/MM/yyyy')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unarchiveTask(task.id)}
                          className="gap-1 text-xs"
                        >
                          <ArchiveRestore className="w-3 h-3" />
                          Khôi phục
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task)}
                          className="text-destructive hover:text-destructive text-xs"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Calendar View Component
  const CalendarView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Pad days to start from Monday
    const startDay = monthStart.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    
    const getTasksForDay = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return tasks.filter(t => t.dueDate === dateStr);
    };

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Padding days */}
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] bg-secondary/20 rounded-lg" />
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[100px] p-2 rounded-lg border transition-colors',
                  isToday ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-secondary/50'
                )}
              >
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isToday && 'text-primary'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-xs p-1 rounded truncate cursor-pointer',
                        task.status === 'done' ? 'bg-success/20 text-success line-through' :
                        task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                        task.priority === 'medium' ? 'bg-warning/20 text-warning' :
                        'bg-secondary'
                      )}
                      onClick={() => handleToggleComplete(task)}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Desktop Layout with view toggle
  if (!isMobile) {
    return (
      <div className="p-4 md:p-6 flex flex-col gap-2 h-full min-h-0 overflow-hidden w-full">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold hidden lg:block">Tasks</h1>
            {/* View Toggle */}
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center bg-secondary rounded-lg p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('kanban')}
                      className="gap-1 h-7 px-2 text-xs"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">Chế độ Kanban</p>
                    <p className="text-xs text-muted-foreground">Quản lý task theo trạng thái với kéo thả</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className="gap-1 h-7 px-2 text-xs"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" /> Calendar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">Chế độ Lịch</p>
                    <p className="text-xs text-muted-foreground">Xem task theo ngày deadline trên lịch</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'history' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('history')}
                      className="gap-1 h-7 px-2 text-xs"
                    >
                      <History className="w-3.5 h-3.5" /> Lịch sử
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">Lịch sử hoàn thành</p>
                    <p className="text-xs text-muted-foreground">Xem các task đã hoàn thành theo thời gian</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'archived' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('archived')}
                      className="gap-1 h-7 px-2 text-xs"
                    >
                      <Archive className="w-3.5 h-3.5" /> Lưu trữ
                      {tasks.filter(t => t.archived).length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{tasks.filter(t => t.archived).length}</Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">Task đã lưu trữ</p>
                    <p className="text-xs text-muted-foreground">Xem và khôi phục task cũ đã lưu trữ</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-pomodoro-work/10 text-pomodoro-work text-xs cursor-help">
                    🍅 {todayPomodoros}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">Pomodoro hôm nay</p>
                  <p className="text-xs text-muted-foreground">Số phiên Pomodoro đã hoàn thành trong ngày</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {AddTaskDialog}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="h-8 px-2 gap-1 hidden xl:flex"
                  >
                    {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{isSidebarOpen ? 'Ẩn Sidebar' : 'Hiện Sidebar'}</p>
                  <p className="text-xs text-muted-foreground">Bật/tắt thanh bên với thống kê và mục tiêu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterPriority={filterPriority}
            onFilterPriorityChange={setFilterPriority}
            filterArea={filterArea}
            onFilterAreaChange={setFilterArea}
            filterGoal={filterGoal}
            onFilterGoalChange={setFilterGoal}
            filterDueDate={filterDueDate}
            onFilterDueDateChange={setFilterDueDate}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortAsc={sortAsc}
            onSortAscChange={setSortAsc}
            activeFiltersCount={[filterStatus !== 'all', filterPriority !== 'all', filterArea !== 'all', filterGoal !== 'all', filterDueDate !== 'all'].filter(Boolean).length}
            onClearFilters={clearFilters}
            goals={goals}
            focusMode={kanbanPrefs.focusMode}
            onFocusModeChange={kanbanPrefs.toggleFocusMode}
          />
          
          {/* Results count & Compact toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredAndSortedTasks.length} / {tasks.filter(t => !t.archived).length}
            </span>
            {viewMode === 'kanban' && (
              <Button
                variant={isCompactView ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCompactView(!isCompactView)}
                className="h-7 gap-1 text-xs"
              >
                <ChevronsUpDown className="w-3 h-3" />
                {isCompactView ? 'Mở rộng' : 'Thu gọn'}
              </Button>
            )}
          </div>
        </div>

        {/* Main content area with sidebar */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
            {/* Productivity Stats */}
            <div className="shrink-0">
              <ProductivityStats />
            </div>

            {/* Collapsible sections - Only in history view */}
            {viewMode === 'history' && (
              <div className="space-y-2">
                {/* Productivity Chart - Collapsible */}
                <div className="border rounded-lg bg-card">
                  <button
                    onClick={() => setIsChartCollapsed(!isChartCollapsed)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Xu hướng hoàn thành
                    </div>
                    {isChartCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {!isChartCollapsed && (
                    <div className="px-3 pb-3">
                      <ProductivityChart />
                    </div>
                  )}
                </div>

                {/* Pomodoro Stats - Collapsible */}
                <div className="border rounded-lg bg-card">
                  <button
                    onClick={() => setIsPomodoroCollapsed(!isPomodoroCollapsed)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Timer className="w-4 h-4 text-primary" />
                      Thống kê Pomodoro
                    </div>
                    {isPomodoroCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {!isPomodoroCollapsed && (
                    <div className="p-3 pt-0">
                      <PomodoroStatsCard />
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'kanban' ? (
              /* Kanban Board with dnd-kit */
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <DndKanbanBoard
                  dndEnabled={!disableDnd}
                  todoTasks={todoTasks}
                  inProgressTasks={inProgressTasks}
                  doneTasks={doneTasks}
                  deferredTasks={deferredTasks}
                  isCompactView={isCompactView}
                  collapsedColumns={kanbanPrefs.collapsedColumns}
                  maxTasks={kanbanPrefs.tasksPerColumn}
                  onToggleCollapse={kanbanPrefs.toggleColumnCollapse}
                  onTaskClick={handleTaskClick}
                  onStartPomodoro={handleStartPomodoro}
                  onToggleComplete={handleToggleComplete}
                />
              </div>
            ) : viewMode === 'calendar' ? (
              /* Calendar View */
              <ScrollArea className="flex-1 min-h-0">
                <CalendarView />
              </ScrollArea>
            ) : viewMode === 'history' ? (
              /* Recurring History View */
              <ScrollArea className="flex-1 min-h-0">
                <RecurringHistoryView />
              </ScrollArea>
            ) : (
              /* Archived View */
              <ScrollArea className="flex-1 min-h-0">
                <ArchivedView />
              </ScrollArea>
            )}
          </div>

          {/* Sidebar */}
          <TasksSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            tasks={tasks}
            onQuickFilter={handleQuickFilter}
          />
        </div>

        <TaskDetailModal
          task={selectedTask} 
          open={isDetailModalOpen} 
          onOpenChange={setIsDetailModalOpen} 
        />

        {/* Pomodoro Duration Dialog (Desktop/Tablet) */}
        <Dialog open={pomodoroDialogOpen} onOpenChange={setPomodoroDialogOpen}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-pomodoro-work" />
                Bắt đầu Pomodoro
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Task: <span className="font-medium text-foreground">{pomodoroTask?.title}</span>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Chọn thời gian</Label>

                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 30, 45, 60, 90].map((mins) => {
                    const isSelected = customPomodoroDuration === mins;
                    const isDefault = mins === pomodoroSettings.workDuration;

                    return (
                      <Button
                        key={mins}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCustomPomodoroDuration(mins)}
                        className={cn(
                          "h-10 relative",
                          isDefault && !isSelected && "border-primary/50 bg-primary/5",
                          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                      >
                        <span className="font-medium">{mins}</span>
                        <span className="ml-1 text-xs opacity-70">phút</span>
                        {isDefault && (
                          <span className="absolute -top-1.5 -right-1.5 bg-primary text-[9px] text-primary-foreground px-1 rounded-full">
                            ⭐
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Hoặc nhập:</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <Input
                      id="custom-duration-desktop"
                      type="number"
                      min={1}
                      max={180}
                      placeholder={`${pomodoroSettings.workDuration}`}
                      value={typeof customPomodoroDuration === 'number' && ![15, 25, 30, 45, 60, 90].includes(customPomodoroDuration) ? customPomodoroDuration : ''}
                      onChange={(e) => setCustomPomodoroDuration(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-16 h-9 text-center"
                    />
                    <span className="text-sm text-muted-foreground">phút</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setPomodoroDialogOpen(false)}>
                  Hủy
                </Button>
                <Button className="flex-1 h-11 gap-2" onClick={confirmStartPomodoro}>
                  <Play className="w-4 h-4" />
                  Bắt đầu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Mobile Layout with Swipe Gestures
  const renderMobileTask = (task: Task) => {
    const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
    const isDone = task.status === 'done';
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(s => s.completed).length;
    const tags = (task.tags || []).map(tagId => taskTags.find(t => t.id === tagId)).filter(Boolean);

    return (
      <SwipeableCard
        key={task.id}
        onSwipeRight={() => !isDone && handleToggleComplete(task)}
        onSwipeLeft={() => handleDeleteTask(task)}
        rightAction="complete"
        leftAction="delete"
        rightLabel="Xong"
        leftLabel="Xóa"
        disabled={isDone}
      >
        <Card 
          className={cn(
            'transition-all border-l-2',
            isDone && 'opacity-60',
            task.priority === 'high' ? 'border-l-destructive' : 
            task.priority === 'medium' ? 'border-l-warning' : 'border-l-muted'
          )}
          onClick={() => handleTaskClick(task)}
        >
          <CardContent className="p-2.5">
            <div className="flex items-center gap-2">
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Circle className={cn('w-4 h-4', task.priority === 'high' ? 'text-destructive' : task.priority === 'medium' ? 'text-warning' : 'text-muted-foreground')} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className={cn('font-medium text-sm truncate flex-1', isDone && 'line-through text-muted-foreground')}>{task.title}</p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {task.recurring && <Repeat className="w-3 h-3 text-primary" />}
                    {task.reminderMinutes && <Bell className="w-3 h-3 text-warning" />}
                    {subtasks.length > 0 && <span className="text-[10px] text-muted-foreground ml-1">✓{completedSubtasks}/{subtasks.length}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                  {area && <span>{area.icon}</span>}
                  {task.dueDate && (
                    <span className={cn(parseISO(task.dueDate) < today && !isDone && 'text-destructive font-medium')}>
                      {format(parseISO(task.dueDate), 'dd/MM')}
                    </span>
                  )}
                  {task.estimatedPomodoros && <span>🍅{task.completedPomodoros}/{task.estimatedPomodoros}</span>}
                  {tags.length > 0 && tags.slice(0, 1).map((tag) => tag && (
                    <span key={tag.id} className="px-1 py-0 rounded text-white text-[9px]" style={{ backgroundColor: `hsl(${tag.color})` }}>{tag.name}</span>
                  ))}
                </div>
              </div>
              {!isDone && (
                <Button
                  data-swipe-ignore="true"
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Bắt đầu Pomodoro"
                  className="h-6 w-6 text-pomodoro-work shrink-0 relative z-10 touch-manipulation pointer-events-auto"
                  onPointerDownCapture={(e) => {
                    e.stopPropagation();
                    if (!debugTapEnabled) return;

                    const payload = captureTapInspectorPayload({
                      x: e.clientX,
                      y: e.clientY,
                      event: e.nativeEvent,
                    });

                    setTapInspectorPayload(payload);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartPomodoro(task);
                  }}
                >
                  <Play className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </SwipeableCard>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {debugTapEnabled && (
        <TapInspectorOverlay
          payload={tapInspectorPayload}
          onClear={() => setTapInspectorPayload(null)}
        />
      )}
      <div className="flex items-center justify-between pt-2 gap-2">
        <h1 className="text-2xl font-bold shrink-0">Tasks</h1>
        <div className="flex items-center gap-2 overflow-x-auto">
          {debugTapEnabled && viewMode === 'kanban' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">Tắt kéo-thả</span>
              <Switch checked={disableDnd} onCheckedChange={setDisableDnd} />
            </div>
          )}
          {/* Pomodoro Count - Mobile */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pomodoro-work/10 text-pomodoro-work shrink-0">
            <span className="font-medium text-xs">🍅 {todayPomodoros}</span>
          </div>
          {/* Mobile Filter Button */}
          <TaskFilterSheet
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterPriority={filterPriority}
            onFilterPriorityChange={setFilterPriority}
            filterArea={filterArea}
            onFilterAreaChange={setFilterArea}
            filterGoal={filterGoal}
            onFilterGoalChange={setFilterGoal}
            filterDueDate={filterDueDate}
            onFilterDueDateChange={setFilterDueDate}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortAsc={sortAsc}
            onSortAscChange={setSortAsc}
            activeFiltersCount={[filterStatus !== 'all', filterPriority !== 'all', filterArea !== 'all', filterGoal !== 'all', filterDueDate !== 'all'].filter(Boolean).length}
            onClearFilters={clearFilters}
            goals={goals}
          />
          {AddTaskDialog}
        </div>
      </div>

      {/* View Mode Toggle - Mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('kanban')}
          className="gap-1 shrink-0"
        >
          <LayoutGrid className="w-3 h-3" /> Tasks
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
          className="gap-1 shrink-0"
        >
          <CalendarIcon className="w-3 h-3" /> Lịch
        </Button>
        <Button
          variant={viewMode === 'history' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('history')}
          className="gap-1 shrink-0"
        >
          <History className="w-3 h-3" /> Lịch sử
        </Button>
        <Button
          variant={viewMode === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('archived')}
          className="gap-1 shrink-0"
        >
          <Archive className="w-3 h-3" /> Lưu trữ
          {tasks.filter(t => t.archived).length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{tasks.filter(t => t.archived).length}</Badge>
          )}
        </Button>
      </div>

      {/* Productivity Stats - Mobile */}
      <ProductivityStats />

      {viewMode === 'kanban' ? (
        <>
          <p className="text-xs text-muted-foreground">
            💡 Vuốt phải để hoàn thành, vuốt trái để xóa
            {hasActiveFilters && ` • ${filteredAndSortedTasks.length}/${tasks.filter(t => !t.archived).length} tasks`}
          </p>

          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todo" className="text-xs">Todo ({todoTasks.length})</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">Làm ({inProgressTasks.length})</TabsTrigger>
              <TabsTrigger value="deferred" className="text-xs">Hoãn ({deferredTasks.length})</TabsTrigger>
              <TabsTrigger value="done" className="text-xs">Xong ({doneTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="todo" className="mt-4 space-y-2">
              {todoTasks.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><Clock className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Không có task nào</p></CardContent></Card>
              ) : todoTasks.map((task) => renderMobileTask(task))}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-4 space-y-2">
              {inProgressTasks.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><p>Chưa có task đang làm</p></CardContent></Card>
              ) : inProgressTasks.map((task) => renderMobileTask(task))}
            </TabsContent>

            <TabsContent value="deferred" className="mt-4 space-y-2">
              {deferredTasks.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><Pause className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Không có task tạm hoãn</p></CardContent></Card>
              ) : deferredTasks.map((task) => renderMobileTask(task))}
            </TabsContent>

            <TabsContent value="done" className="mt-4 space-y-2">
              {doneTasks.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><p>Chưa hoàn thành task nào</p></CardContent></Card>
              ) : doneTasks.map((task) => renderMobileTask(task))}
            </TabsContent>
          </Tabs>
        </>
      ) : viewMode === 'calendar' ? (
        <CalendarView />
      ) : viewMode === 'history' ? (
        <>
          <RecurringHistoryView />
          <div className="mt-6">
            <ProductivityChart />
          </div>
          <div className="mt-4">
            <PomodoroStatsCard />
          </div>
        </>
      ) : (
        <ArchivedView />
      )}

      <TaskDetailModal 
        task={selectedTask} 
        open={isDetailModalOpen} 
        onOpenChange={setIsDetailModalOpen} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setTaskToDelete(null); setDeleteDialogOpen(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa task này?</AlertDialogTitle>
            <AlertDialogDescription>
              Task "{taskToDelete?.title}" sẽ được chuyển vào thùng rác. Bạn có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pomodoro Duration Dialog */}
      <Dialog open={pomodoroDialogOpen} onOpenChange={setPomodoroDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-pomodoro-work" />
              Bắt đầu Pomodoro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Task: <span className="font-medium text-foreground">{pomodoroTask?.title}</span>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Chọn thời gian</Label>
              
              {/* Quick select - 2 rows of 3 */}
              <div className="grid grid-cols-3 gap-2">
                {[15, 25, 30, 45, 60, 90].map((mins) => {
                  const isSelected = customPomodoroDuration === mins;
                  const isDefault = mins === pomodoroSettings.workDuration;
                  
                  return (
                    <Button
                      key={mins}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCustomPomodoroDuration(mins)}
                      className={cn(
                        "h-10 relative",
                        isDefault && !isSelected && "border-primary/50 bg-primary/5",
                        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      <span className="font-medium">{mins}</span>
                      <span className="ml-1 text-xs opacity-70">phút</span>
                      {isDefault && (
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-[9px] text-primary-foreground px-1 rounded-full">
                          ⭐
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {/* Custom input - more compact */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Hoặc nhập:</span>
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    id="custom-duration"
                    type="number"
                    min={1}
                    max={180}
                    placeholder={`${pomodoroSettings.workDuration}`}
                    value={typeof customPomodoroDuration === 'number' && ![15, 25, 30, 45, 60, 90].includes(customPomodoroDuration) ? customPomodoroDuration : ''}
                    onChange={(e) => setCustomPomodoroDuration(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-16 h-9 text-center"
                  />
                  <span className="text-sm text-muted-foreground">phút</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setPomodoroDialogOpen(false)}>
                Hủy
              </Button>
              <Button className="flex-1 h-11 gap-2" onClick={confirmStartPomodoro}>
                <Play className="w-4 h-4" />
                Bắt đầu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
