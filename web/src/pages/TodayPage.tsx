import { useState, useEffect } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getTodayDateString, getTodayStart } from '@/utils/dateUtils';
import { Plus, Flame, CheckCircle2, Play, Target, Sparkles, BookOpen, Calendar, ChevronRight, Lightbulb, Zap, Smile, Frown, Meh, CalendarIcon, ListTodo, Heart, PenLine, Clock, Send, Star, TrendingUp } from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, LifeArea } from '@/types/lifeos';
import { Link } from 'react-router-dom';
import { AISuggestionsCard } from '@/components/ai/AISuggestionsCard';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HabitDetailModal } from '@/components/habits/HabitDetailModal';
import type { Habit } from '@/types/lifeos';
import { ProgressRing } from '@/components/today/ProgressRing';
import { TodayAddTaskModal } from '@/components/today/TodayAddTaskModal';
import { TodayAddHabitModal } from '@/components/today/TodayAddHabitModal';
import { TodayAddJournalModal } from '@/components/today/TodayAddJournalModal';
import { TodayFocusCard } from '@/components/today/TodayFocusCard';
import { MorningCheckin } from '@/components/today/MorningCheckin';
import { EveningReview } from '@/components/today/EveningReview';
import { HabitRescueCard } from '@/components/today/HabitRescueCard';
import { AIDailyBriefing } from '@/components/today/AIDailyBriefing';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { RecommendationsCard } from '@/components/today/RecommendationsCard';
import { usePreferencesSync } from '@/hooks/sync/usePreferencesSync';
// Motivational quotes
const QUOTES = [
  { text: "Hành trình ngàn dặm bắt đầu từ một bước chân", author: "Lão Tử" },
  { text: "Thành công là tổng của những nỗ lực nhỏ, lặp đi lặp lại ngày này qua ngày khác", author: "Robert Collier" },
  { text: "Bạn không cần phải tuyệt vời để bắt đầu, nhưng bạn cần bắt đầu để trở nên tuyệt vời", author: "Zig Ziglar" },
  { text: "Mỗi ngày mới là một cơ hội mới để trở thành phiên bản tốt hơn của chính mình", author: "Unknown" },
  { text: "Kỷ luật là cầu nối giữa mục tiêu và thành tựu", author: "Jim Rohn" },
];

// Quick habit suggestions for new users
const QUICK_HABIT_SUGGESTIONS = [
  { name: 'Uống 2L nước', area: 'health' as const, icon: '💧' },
  { name: 'Đọc sách 15 phút', area: 'learning' as const, icon: '📚' },
  { name: 'Tập thể dục 30 phút', area: 'health' as const, icon: '🏃' },
  { name: 'Thiền 10 phút', area: 'health' as const, icon: '🧘' },
  { name: 'Ghi journal', area: 'personal' as const, icon: '📝' },
  { name: 'Ngủ trước 23h', area: 'health' as const, icon: '😴' },
  { name: 'Không điện thoại 1h', area: 'personal' as const, icon: '📵' },
  { name: 'Học ngoại ngữ 20 phút', area: 'learning' as const, icon: '🌍' },
  { name: 'Gọi điện người thân', area: 'relationships' as const, icon: '📞' },
  { name: 'Tiết kiệm tiền', area: 'finance' as const, icon: '💰' },
];

export default function TodayPage() {
  const user = useLifeOSStore((s) => s.user);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const startPomodoro = usePomodoroStore((s) => s.start);
  const isPomodoroRunning = usePomodoroStore((s) => s.isRunning);
  const dailyIntentions = useLifeOSStore((s) => s.dailyIntentions);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);
  const { loadOnboardingState } = usePreferencesSync();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // On mount: check Supabase for onboarding state (fixes new-browser-profile issue)
  useEffect(() => {
    loadOnboardingState().then((completed) => {
      setOnboardingChecked(true);
    }).catch(() => {
      setOnboardingChecked(true); // fallback to local state on error
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Use synced store for CRUD operations that need to sync to Supabase
  const { 
    addTask, 
    updateTask, 
    addHabit, 
    toggleHabitCompletion, 
    addJournalEntry,
    addDailyIntention,
    completeDailyIntention,
    isSyncEnabled 
  } = useSyncedStore();

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  
  // State cho habit detail modal
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isHabitDetailModalOpen, setIsHabitDetailModalOpen] = useState(false);

  // Use timezone-aware date utilities (GMT+7)
  const todayStr = getTodayDateString();
  const today = getTodayStart();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const todayIntention = dailyIntentions.find((i) => i.date === todayStr);
  const todayQuote = QUOTES[today.getDate() % QUOTES.length];
  
  // Stats
  const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
  const todayHabits = activeHabits.filter((h) => {
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekly') return h.customDays?.includes(today.getDay());
    return h.customDays?.includes(today.getDay());
  });
  const completedHabitsToday = todayHabits.filter((h) => h.completedDates.includes(todayStr));
  
  const activeTasks = tasks.filter((t) => !t.archived && !t.deletedAt);
  // Only show tasks with dueDate = today (not all tasks)
  const todayTasks = activeTasks.filter(
    (t) => t.status !== 'done' && t.dueDate === todayStr
  );
  const overdueTasks = activeTasks.filter(
    (t) => t.status !== 'done' && t.dueDate && parseISO(t.dueDate) < today && t.dueDate !== todayStr
  );
  const completedTasksToday = activeTasks.filter((t) => t.completedAt?.startsWith(todayStr));
  const todayPomodoros = pomodoroSessions.filter(
    (s) => s.completedAt.startsWith(todayStr) && s.phase === 'work'
  );

  // Weekly stats
  const weeklyCompletedTasks = activeTasks.filter((t) => {
    if (!t.completedAt) return false;
    const completedDate = parseISO(t.completedAt);
    return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
  });
  
  const weeklyCompletedHabits = activeHabits.reduce((count, habit) => {
    return count + habit.completedDates.filter(date => {
      const d = parseISO(date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    }).length;
  }, 0);

  const currentWeekReview = weeklyReviews.find(r => r.weekStart === format(weekStart, 'yyyy-MM-dd'));
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthReview = monthlyReviews.find(r => r.month === currentMonthStr);
  const isNearMonthEnd = today.getDate() >= 25;
  const todayJournal = journalEntries.find((j) => j.date === todayStr);
  const topPriorityTask = todayTasks.find(t => t.priority === 'high') || todayTasks[0];

  const hour = today.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const habitProgress = todayHabits.length > 0 
    ? Math.round((completedHabitsToday.length / todayHabits.length) * 100) 
    : 0;

  // Check if user is new
  const isNewUser = activeHabits.length === 0 && activeTasks.length === 0;

  const [intentionInput, setIntentionInput] = useState('');

  const handleQuickHabitSuggestion = (suggestion: typeof QUICK_HABIT_SUGGESTIONS[0]) => {
    addHabit({
      name: suggestion.name,
      area: suggestion.area,
      frequency: 'daily',
    });
    toast.success(`Đã thêm habit "${suggestion.name}"`);
  };

  const handleSetIntention = () => {
    if (!intentionInput.trim()) return;
    addDailyIntention(intentionInput.trim());
    setIntentionInput('');
    toast.success('Đã đặt intention cho hôm nay');
  };

  // Overall day progress
  const totalItems = todayHabits.length + todayTasks.length + overdueTasks.length;
  const completedItems = completedHabitsToday.length + completedTasksToday.length;
  const dayProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-3 md:space-y-4">
      {/* Summary Hero Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Progress Ring */}
            <ProgressRing
              size={100}
              strokeWidth={8}
              progress={dayProgress}
              color={dayProgress >= 80 ? 'hsl(var(--success))' : dayProgress >= 50 ? 'hsl(var(--primary))' : 'hsl(var(--warning))'}
              className="shrink-0"
            >
              <div className="text-center">
                <span className="text-2xl font-bold">{dayProgress}</span>
                <span className="text-[10px] text-muted-foreground block -mt-1">%</span>
              </div>
            </ProgressRing>

            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {format(today, 'EEEE, dd MMMM yyyy', { locale: vi })}
                </p>
                <h1 className="text-lg md:text-xl font-bold truncate">
                  {greeting}, {user.name}!
                </h1>
              </div>

              {/* Mini Stats Row */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-area-health/10 border-area-health/30">
                  <Target className="w-3 h-3 mr-1 text-area-health" />
                  {completedHabitsToday.length}/{todayHabits.length}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-area-career/10 border-area-career/30">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-area-career" />
                  {completedTasksToday.length} done
                </Badge>
                {overdueTasks.length > 0 && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {overdueTasks.length} quá hạn
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-pomodoro-work/10 border-pomodoro-work/30">
                  🍅 {todayPomodoros.length}
                </Badge>
                {isPomodoroRunning && (
                  <Badge variant="secondary" className="animate-pulse text-xs px-2 py-0.5">
                    <Clock className="w-3 h-3 mr-1" /> Focus
                  </Badge>
                )}
              </div>

              {/* Quote */}
              <p className="text-xs text-muted-foreground italic line-clamp-1">
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                "{todayQuote.text}" — {todayQuote.author}
              </p>
            </div>

            {/* Pomodoro Button */}
            <div className="hidden sm:block shrink-0">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => startPomodoro()} size="sm" className="h-9 bg-gradient-to-r from-pomodoro-work to-pomodoro-work/80 hover:from-pomodoro-work/90 hover:to-pomodoro-work/70 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <Play className="w-4 h-4 mr-1" /> Focus
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Bắt đầu Pomodoro 25 phút</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started for New Users */}
      {isNewUser && (
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30 animate-fade-in">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">Chào mừng đến với LifeOS!</h3>
                  <p className="text-sm text-muted-foreground">
                    Bắt đầu bằng cách thêm một habit hoặc task đầu tiên. Chỉ cần 1 phút!
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Thêm nhanh habit phổ biến:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_HABIT_SUGGESTIONS.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs hover-scale"
                        onClick={() => handleQuickHabitSuggestion(suggestion)}
                      >
                        <span className="mr-1">{suggestion.icon}</span>
                        {suggestion.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm">
                    <Link to="/habits">
                      <Target className="w-4 h-4 mr-2" />
                      Tạo Habit
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="sm">
                    <Link to="/tasks">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tạo Task
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Wizard — only show after Supabase check to avoid false positive on new browsers */}
      {onboardingChecked && userPreferences?.onboardingCompleted === false && (
        <OnboardingWizard onComplete={() => {}} />
      )}

      {/* AI Daily Briefing */}
      <AIDailyBriefing />

      {/* Morning Checkin / Evening Review */}
      {userPreferences?.morningCheckinEnabled !== false && <MorningCheckin />}
      {userPreferences?.eveningReviewEnabled !== false && <EveningReview />}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Today Focus Card */}
          {userPreferences?.showTodayFocus !== false && <TodayFocusCard />}

          {/* Intention + Focus Zone */}
          <Card className="border-primary/15">
            <CardContent className="px-3 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-accent shrink-0" />
                {todayIntention ? (
                  <div className="flex-1 flex items-center gap-2">
                    <p className={cn("flex-1 text-sm font-medium", todayIntention.completed && "line-through text-muted-foreground")}>
                      {todayIntention.intention}
                    </p>
                    {!todayIntention.completed && (
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { completeDailyIntention(todayIntention.id); toast.success('Hoàn thành!'); }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <Input placeholder="Điều quan trọng nhất hôm nay?" value={intentionInput} onChange={(e) => setIntentionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetIntention()} className="flex-1 h-8 text-sm" />
                    <Button size="sm" className="h-8 px-2" onClick={handleSetIntention} disabled={!intentionInput.trim()}><Send className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>

              {topPriorityTask && !isPomodoroRunning && (
                <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-muted/50">
                  <Target className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate flex-1 text-sm font-medium">{topPriorityTask.title}</span>
                  <Button size="sm" variant="secondary" className="h-7 px-2 shrink-0" onClick={() => { startPomodoro(topPriorityTask.id); updateTask(topPriorityTask.id, { status: 'in_progress' }); }}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Focus
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <Button 
              size="sm" 
              onClick={() => setShowTaskModal(true)} 
              className="h-11 bg-gradient-to-r from-area-career to-area-career/80 hover:from-area-career/90 hover:to-area-career/70 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <ListTodo className="w-4 h-4 mr-1.5" />
              Task
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowHabitModal(true)} 
              className="h-11 bg-gradient-to-r from-area-health to-area-health/80 hover:from-area-health/90 hover:to-area-health/70 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Heart className="w-4 h-4 mr-1.5" />
              Habit
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowJournalModal(true)} 
              className="h-11 bg-gradient-to-r from-area-personal to-area-personal/80 hover:from-area-personal/90 hover:to-area-personal/70 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <PenLine className="w-4 h-4 mr-1.5" />
              Journal
            </Button>
            <Button 
              size="sm" 
              onClick={() => startPomodoro()} 
              className="h-11 sm:flex hidden bg-gradient-to-r from-pomodoro-work to-pomodoro-work/80 hover:from-pomodoro-work/90 hover:to-pomodoro-work/70 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Play className="w-4 h-4 mr-1.5" />
              Focus
            </Button>
          </div>

          {/* Habits & Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Habits */}
            <Card className="flex flex-col max-h-[360px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-area-health" /> Habits
                  </CardTitle>
                  <Link to="/habits" className="text-xs text-muted-foreground hover:text-primary">Tất cả <ChevronRight className="w-3 h-3 inline" /></Link>
                </div>
                {todayHabits.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={habitProgress} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium">{completedHabitsToday.length}/{todayHabits.length}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-1 flex-1 overflow-y-auto py-2">
                {todayHabits.length === 0 ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center"><Target className="w-5 h-5 text-muted-foreground" /></div>
                    <div><p className="text-sm font-medium">Chưa có habit</p><p className="text-xs text-muted-foreground">Tạo habit để bắt đầu</p></div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowHabitModal(true)}><Plus className="w-3 h-3 mr-1" /> Thêm</Button>
                  </div>
                ) : (
                  todayHabits.map((habit) => {
                    const target = habit.targetPerDay || 1;
                    const todayCompletion = habit.completions?.find(c => c.date === todayStr);
                    const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
                    const isCompleted = todayCount >= target;
                    const area = LIFE_AREAS.find((a) => a.id === habit.area);
                    
                    const handleHabitClick = () => {
                      if (target > 1) {
                        // Với habit có target > 1: mở modal để điều chỉnh với nút +/-
                        setSelectedHabit(habit);
                        setIsHabitDetailModalOpen(true);
                      } else {
                        // Với habit có target <= 1: toggle như cũ
                        toggleHabitCompletion(habit.id, todayStr);
                      }
                    };
                    
                    return (
                      <div 
                        key={habit.id} 
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all hover:bg-secondary', 
                          isCompleted && 'bg-success/10'
                        )} 
                        onClick={handleHabitClick}
                      >
                        <div 
                          className={cn(
                            'w-6 h-6 rounded flex items-center justify-center text-xs shrink-0', 
                            isCompleted ? 'bg-success text-success-foreground' : ''
                          )} 
                          style={{ backgroundColor: isCompleted ? undefined : `hsl(var(--area-${habit.area}) / 0.2)` }}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : area?.icon}
                        </div>
                        <span className={cn('flex-1 text-sm truncate', isCompleted && 'line-through text-muted-foreground')}>
                          {habit.name}
                          {target > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({todayCount}/{target})
                            </span>
                          )}
                        </span>
                        {habit.streak > 0 && (
                          <span className="text-[10px] text-streak flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> {habit.streak}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card className="flex flex-col max-h-[360px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-area-career" /> Tasks
                    {overdueTasks.length > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{overdueTasks.length} quá hạn</Badge>}
                  </CardTitle>
                  <Link to="/tasks" className="text-xs text-muted-foreground hover:text-primary">Tất cả <ChevronRight className="w-3 h-3 inline" /></Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 flex-1 overflow-y-auto py-2">
                {overdueTasks.slice(0, 2).map((task) => {
                  const daysOverdue = task.dueDate ? Math.floor((today.getTime() - parseISO(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  return (
                    <div key={task.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-destructive/5 hover:bg-destructive/10 transition-all group">
                      <button className="w-3.5 h-3.5 rounded-full border-2 border-destructive shrink-0" onClick={() => updateTask(task.id, { status: 'done', completedAt: new Date().toISOString() })} />
                      <div className="flex-1 min-w-0"><p className="text-sm truncate">{task.title}</p><p className="text-[10px] text-destructive">-{daysOverdue}d</p></div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => { startPomodoro(task.id); updateTask(task.id, { status: 'in_progress' }); }}><Play className="w-2.5 h-2.5" /></Button>
                    </div>
                  );
                })}

                {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-muted-foreground" /></div>
                    <div><p className="text-sm font-medium">Không có task</p><p className="text-xs text-muted-foreground">Thêm task để bắt đầu</p></div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowTaskModal(true)}><Plus className="w-3 h-3 mr-1" /> Thêm</Button>
                  </div>
                ) : (
                  todayTasks.map((task) => {
                    const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
                    return (
                      <div key={task.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-secondary transition-all group">
                        <button className={cn('w-3.5 h-3.5 rounded-full border-2 shrink-0', task.priority === 'high' ? 'border-destructive' : task.priority === 'medium' ? 'border-warning' : 'border-muted-foreground')} onClick={() => updateTask(task.id, { status: 'done', completedAt: new Date().toISOString() })} />
                        <div className="flex-1 min-w-0"><p className="text-sm truncate">{task.title}</p>{area && <p className="text-[10px] text-muted-foreground">{area.icon} {area.name}</p>}</div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => { startPomodoro(task.id); updateTask(task.id, { status: 'in_progress' }); }}><Play className="w-2.5 h-2.5" /></Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">

          {/* Weekly */}
          <Card>
            <CardHeader className="py-1.5 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Tuần này</CardTitle>
                <Link to="/weekly-review" className="text-xs text-muted-foreground hover:text-primary">Review <ChevronRight className="w-3 h-3 inline" /></Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 py-1.5 px-3">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Habits</span><span className="font-medium">{weeklyCompletedHabits}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Tasks</span><span className="font-medium">{weeklyCompletedTasks.length}</span></div>
              {currentWeekReview ? (
                <Badge variant="outline" className="text-success border-success w-full justify-center">Đã review</Badge>
              ) : (
                <Button variant="outline" size="sm" className="w-full h-7 text-xs" asChild><Link to="/weekly-review"><TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Weekly Review</Link></Button>
              )}
            </CardContent>
          </Card>

          {/* Monthly */}
          {isNearMonthEnd && (
            <Card className={currentMonthReview ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}>
              <CardContent className="py-2 px-3 flex items-center gap-2">
                <CalendarIcon className={cn('w-4 h-4 shrink-0', currentMonthReview ? 'text-green-500' : 'text-amber-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{currentMonthReview ? `Monthly ✓ (${currentMonthReview.overallRating}/5)` : 'Chưa review tháng này'}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" asChild>
                  <Link to="/monthly-review">{currentMonthReview ? 'Xem' : 'Viết'}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Habit Rescue */}
          <HabitRescueCard />

          {userPreferences?.showAISuggestions !== false && <AISuggestionsCard compact />}

          {/* Recommendations */}
          <RecommendationsCard />

          {/* Life Areas */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Life Areas</CardTitle>
                <Link to="/life-wheel" className="text-xs text-muted-foreground hover:text-primary">Wheel <ChevronRight className="w-3 h-3 inline" /></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-1.5">
                {LIFE_AREAS.slice(0, 10).map((area) => {
                  const total = activeHabits.filter(h => h.area === area.id).length + activeTasks.filter(t => t.area === area.id && t.status !== 'done').length;
                  return (
                    <div key={area.id} className={cn("p-1.5 rounded-md text-center", total > 0 ? "hover:scale-105 cursor-pointer" : "opacity-40")} style={{ backgroundColor: `hsl(var(--area-${area.id}) / 0.15)` }} title={area.name}>
                      <span className="text-sm">{area.icon}</span>
                      {total > 0 && <p className="text-[9px] text-muted-foreground">{total}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="bg-gradient-to-br from-streak/10 to-streak/5 border-streak/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Flame className="w-8 h-8 text-streak" />
              <div>
                <div className="text-2xl font-bold text-streak">{Math.max(0, ...activeHabits.map(h => h.streak))}</div>
                <p className="text-xs text-muted-foreground">Streak cao nhất</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Modal */}
      <TodayAddTaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onAdd={(task) => {
          addTask({
            title: task.title,
            priority: task.priority,
            status: 'todo',
            dueDate: task.dueDate,
            area: task.area,
          });
          toast.success('Đã thêm task mới');
        }}
      />

      {/* Habit Modal */}
      <TodayAddHabitModal
        open={showHabitModal}
        onOpenChange={setShowHabitModal}
        onAdd={(habit) => {
          addHabit(habit);
          toast.success('Đã thêm habit mới');
        }}
      />

      {/* Journal Modal */}
      <TodayAddJournalModal
        open={showJournalModal}
        onOpenChange={setShowJournalModal}
        todayStr={todayStr}
        onAdd={(entry) => {
          addJournalEntry(entry);
          toast.success('Đã lưu journal!');
        }}
      />

      {/* Habit Detail Modal */}
      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          open={isHabitDetailModalOpen}
          onOpenChange={(open) => {
            setIsHabitDetailModalOpen(open);
            if (!open) setSelectedHabit(null);
          }}
        />
      )}
    </div>
  );
}
