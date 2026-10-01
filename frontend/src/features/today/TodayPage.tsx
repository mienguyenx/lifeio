import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CheckCircle2, Clock, Flame, Play, Plus, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getTodayDateString, getTodayStart } from '@/utils/dateUtils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { usePreferencesSync } from '@/hooks/sync/usePreferencesSync';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit, type JournalEntry } from '@/types/lifeos';
import { AISuggestionsCard } from '@/components/ai/AISuggestionsCard';
import { HabitDetailModal } from '@/components/habits/HabitDetailModal';
import { TodayAddTaskModal } from '@/components/today/TodayAddTaskModal';
import { TodayAddHabitModal } from '@/components/today/TodayAddHabitModal';
import { TodayAddJournalModal } from '@/components/today/TodayAddJournalModal';
import { TodayFocusCard } from '@/components/today/TodayFocusCard';
import { MorningCheckin } from '@/components/today/MorningCheckin';
import { EveningReview } from '@/components/today/EveningReview';
import { HabitRescueCard } from '@/components/today/HabitRescueCard';
import { AIDailyBriefing } from '@/components/today/AIDailyBriefing';
import { RecommendationsCard } from '@/components/today/RecommendationsCard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { Empty, Fab, HeroBanner, MascotCard, Page, PageHeader, ProgressBar, ProgressRing, SectionTitle, StatTile, Surface, TINTS, type Tint } from '@/components/lio';
import { useHealth } from '@/features/health/hooks/useHealth';
import { metricOf, valueOn } from '@/features/health/utils/health.utils';

/**
 * Hôm nay (Home) — LIO kit. Toàn bộ dữ liệu & hành động giữ nguyên từ trang cũ (/today/classic):
 * tiến độ ngày, intention, focus, thói quen (multi-target), công việc + quá hạn, check-in sáng/tối,
 * AI briefing, gợi ý, habit rescue, tuần này, nhắc review tháng, lĩnh vực, chuỗi ngày, onboarding.
 * Bổ sung theo Visual Spec §12: 3 thẻ sức khỏe (Nước, Ngủ, Vận động) đọc từ nhật ký sức khỏe sẵn có.
 */
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
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const health = useHealth();
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

  const waterM = metricOf('water'), sleepM = metricOf('sleep'), exM = metricOf('exercise');
  const water = valueOn(health.logs, waterM, todayStr), sleep = valueOn(health.logs, sleepM, todayStr), exercise = valueOn(health.logs, exM, todayStr);
  const bestStreak = Math.max(0, ...activeHabits.map((h) => h.streak));
  const remaining = Math.max(todayTasks.length - completedTasksToday.length, 0);
  const focusMin = todayPomodoros.reduce((a, s) => a + (s.duration || 25), 0);
  const focusTask = (id: string) => { startPomodoro(id); updateTask(id, { status: 'in_progress' }); };
  const doneTask = (id: string) => updateTask(id, { status: 'done', completedAt: new Date().toISOString() });
  const QUICK: { label: string; icon: LifeIconName; tint: Tint; onClick: () => void }[] = [
    { label: 'Công việc', icon: 'module/tasks', tint: 'violet', onClick: () => setShowTaskModal(true) },
    { label: 'Thói quen', icon: 'module/habits', tint: 'mint', onClick: () => setShowHabitModal(true) },
    { label: 'Nhật ký', icon: 'module/journal', tint: 'sky', onClick: () => setShowJournalModal(true) },
    { label: 'Tập trung', icon: 'module/focus', tint: 'rose', onClick: () => startPomodoro() },
  ];

  const habitsCard = (
    <Surface className="p-4 flex flex-col max-h-[420px]">
      <SectionTitle title="Thói quen hôm nay" hint={todayHabits.length ? `${completedHabitsToday.length}/${todayHabits.length}` : undefined}
        action={<Link to="/habits" className="text-[12px] font-semibold text-primary">Xem tất cả</Link>} />
      {todayHabits.length > 0 && <ProgressBar value={habitProgress} color="#22B07D" height={6} className="mb-2" />}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
        {todayHabits.length === 0 ? (
          <div className="py-3 text-center"><Empty>Chưa có thói quen cho hôm nay.</Empty><Button variant="outline" size="sm" className="rounded-full mt-1" onClick={() => setShowHabitModal(true)}><Plus className="w-3.5 h-3.5 mr-1" />Thêm thói quen</Button></div>
        ) : todayHabits.map((habit) => {
          const target = habit.targetPerDay || 1;
          const todayCount = habit.completions?.find((c) => c.date === todayStr)?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
          const isCompleted = todayCount >= target;
          const area = LIFE_AREAS.find((a) => a.id === habit.area);
          const onClick = () => { if (target > 1) { setSelectedHabit(habit); setIsHabitDetailModalOpen(true); } else toggleHabitCompletion(habit.id, todayStr); };
          return (
            <button key={habit.id} onClick={onClick} className={cn('w-full flex items-center gap-3 rounded-[16px] px-2.5 py-2 text-left transition-colors hover:bg-secondary/60', isCompleted && 'bg-[#E8FBF4]/70 dark:bg-success/10')}>
              <span className="h-9 w-9 rounded-[12px] grid place-items-center text-[16px] shrink-0" style={{ background: `hsl(var(--area-${habit.area}) / 0.15)` }}>{area?.icon}</span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[13px] font-semibold truncate', isCompleted && 'line-through text-muted-foreground')}>{habit.name}</span>
                <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {target > 1 && <span className="tabular-nums">{todayCount}/{target}</span>}
                  {target > 1 && <ProgressBar value={(todayCount / target) * 100} height={4} className="w-16" color={`hsl(var(--area-${habit.area}))`} />}
                  {habit.streak > 0 && <span className="inline-flex items-center gap-0.5 text-streak"><Flame className="w-3 h-3" />{habit.streak}</span>}
                </span>
              </span>
              <span className={cn('h-6 w-6 rounded-full border-2 grid place-items-center shrink-0', isCompleted ? 'bg-[#22B07D] border-[#22B07D] text-white' : 'border-border')}>{isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}</span>
            </button>
          );
        })}
      </div>
    </Surface>
  );

  const tasksCard = (
    <Surface className="p-4 flex flex-col max-h-[420px]">
      <SectionTitle title="Nhiệm vụ hôm nay" hint={overdueTasks.length ? <span className="text-destructive font-semibold">{overdueTasks.length} quá hạn</span> : `${todayTasks.length} việc`}
        action={<Link to="/tasks" className="text-[12px] font-semibold text-primary">Xem tất cả</Link>} />
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
        {overdueTasks.slice(0, 2).map((task) => {
          const daysOverdue = task.dueDate ? Math.floor((today.getTime() - parseISO(task.dueDate).getTime()) / 864e5) : 0;
          return (
            <div key={task.id} className="group flex items-center gap-3 rounded-[16px] px-2.5 py-2 bg-destructive/5">
              <button aria-label="Hoàn thành" className="h-5 w-5 rounded-full border-2 border-destructive shrink-0" onClick={() => doneTask(task.id)} />
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold truncate">{task.title}</span><span className="block text-[11px] text-destructive">Quá hạn {daysOverdue} ngày</span></span>
              <button aria-label="Tập trung" onClick={() => focusTask(task.id)} className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:text-primary hover:bg-card"><Play className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
        {todayTasks.length === 0 && overdueTasks.length === 0 ? (
          <div className="py-3 text-center"><Empty>Không có việc nào hạn hôm nay.</Empty><Button variant="outline" size="sm" className="rounded-full mt-1" onClick={() => setShowTaskModal(true)}><Plus className="w-3.5 h-3.5 mr-1" />Thêm việc</Button></div>
        ) : todayTasks.map((task) => {
          const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
          return (
            <div key={task.id} className="group flex items-center gap-3 rounded-[16px] px-2.5 py-2 hover:bg-secondary/60">
              <button aria-label="Hoàn thành" className={cn('h-5 w-5 rounded-full border-2 shrink-0', task.priority === 'high' ? 'border-destructive' : task.priority === 'medium' ? 'border-warning' : 'border-muted-foreground/50')} onClick={() => doneTask(task.id)} />
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold truncate">{task.title}</span>{area && <span className="block text-[11px] text-muted-foreground">{area.icon} {area.name}</span>}</span>
              <button aria-label="Tập trung" onClick={() => focusTask(task.id)} className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:text-primary hover:bg-card"><Play className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
      </div>
    </Surface>
  );

  const side = (
    <div className="space-y-4 min-w-0">
      <Surface className="p-4 flex items-center gap-3 bg-gradient-to-br from-[#FFF1E8] to-card dark:from-streak/10">
        <span className="h-12 w-12 rounded-[15px] grid place-items-center bg-card shadow-soft"><Flame className="w-6 h-6 text-streak" /></span>
        <span><span className="block text-[24px] font-extrabold text-streak leading-none tabular-nums">{bestStreak}</span><span className="block text-[12px] text-muted-foreground mt-1">Chuỗi ngày cao nhất</span></span>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Tuần này" action={<Link to="/weekly-review" className="text-[12px] font-semibold text-primary">Review</Link>} />
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{weeklyCompletedHabits}</p><p className="text-[11px] text-muted-foreground">Lượt thói quen</p></div>
          <div className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{weeklyCompletedTasks.length}</p><p className="text-[11px] text-muted-foreground">Việc xong</p></div>
        </div>
        {currentWeekReview
          ? <p className="mt-3 text-center text-[12.5px] font-semibold text-[#22B07D]">✓ Đã review tuần này</p>
          : <Button variant="outline" className="mt-3 w-full h-9 rounded-full text-[12.5px]" asChild><Link to="/weekly-review?add">Viết Weekly Review</Link></Button>}
        {isNearMonthEnd && (
          <div className={cn('mt-2 flex items-center justify-between rounded-2xl px-3 py-2 text-[12px]', currentMonthReview ? 'bg-[#E8FBF4] dark:bg-success/10' : 'bg-[#FFF6E0] dark:bg-amber-500/10')}>
            <span className="font-semibold">{currentMonthReview ? `Review tháng ✓ (${currentMonthReview.overallRating}/5)` : 'Chưa review tháng này'}</span>
            <Link to={currentMonthReview ? '/monthly-review' : '/monthly-review?add'} className="font-semibold text-primary">{currentMonthReview ? 'Xem' : 'Viết'}</Link>
          </div>
        )}
      </Surface>
      <HabitRescueCard />
      {userPreferences?.showAISuggestions !== false && <AISuggestionsCard compact />}
      <RecommendationsCard />
      <Surface className="p-4">
        <SectionTitle title="Lĩnh vực cuộc sống" action={<Link to="/life-wheel" className="text-[12px] font-semibold text-primary">Bánh xe</Link>} />
        <div className="grid grid-cols-5 gap-1.5">
          {LIFE_AREAS.slice(0, 10).map((area) => {
            const total = activeHabits.filter((h) => h.area === area.id).length + activeTasks.filter((t) => t.area === area.id && t.status !== 'done').length;
            return (
              <button key={area.id} title={area.name} onClick={() => navigate('/area-dashboard')} className={cn('rounded-[12px] py-1.5 text-center transition', total > 0 ? 'hover:scale-105' : 'opacity-40')} style={{ background: `hsl(var(--area-${area.id}) / 0.14)` }}>
                <span className="text-[15px]">{area.icon}</span>{total > 0 && <span className="block text-[10px] text-muted-foreground tabular-nums">{total}</span>}
              </button>
            );
          })}
        </div>
      </Surface>
      <MascotCard mascot="lumi" pose="happy" quote={`“${todayQuote.text}” — ${todayQuote.author}`} />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Hôm nay" subtitle={<span className="first-letter:uppercase inline-block">{format(today, "EEEE, dd 'tháng' M, yyyy", { locale: vi })}</span>}
        actions={!isMobile && <>
          <Button variant="outline" className="h-10 rounded-full px-4 bg-card" onClick={() => setShowTaskModal(true)}><Plus className="h-4 w-4 mr-1.5" />Thêm việc</Button>
          <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => startPomodoro(topPriorityTask?.id)}><Play className="h-4 w-4 mr-1.5" />Bắt đầu tập trung</Button>
        </>} />

      {onboardingChecked && userPreferences?.onboardingCompleted === false && <OnboardingWizard onComplete={() => {}} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="lumi" pose={dayProgress >= 80 ? 'happy' : 'default'} title={<>{greeting}, {user.name}! 👋</>}
            subtitle={<span className="italic">“{todayQuote.text}”</span>}
            action={<div className="flex flex-wrap gap-1.5 text-[12px] font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-soft"><i className="h-1.5 w-1.5 rounded-full bg-mint" />{completedHabitsToday.length}/{todayHabits.length} thói quen</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-soft"><i className="h-1.5 w-1.5 rounded-full bg-peach" />{remaining} việc còn lại</span>
              {overdueTasks.length > 0 && <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-3 py-1">{overdueTasks.length} quá hạn</span>}
              {isPomodoroRunning && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1"><Clock className="w-3.5 h-3.5" />Đang tập trung</span>}
            </div>}
            aside={<div className="hidden sm:flex absolute z-10 right-[180px] top-1/2 -translate-y-1/2 flex-col items-center gap-1">
              <ProgressRing value={dayProgress} size={92} stroke={10} />
              <span className="text-[11.5px] font-semibold text-muted-foreground">Tiến độ ngày</span>
            </div>} />

          {isNewUser && (
            <Surface className="p-5 bg-gradient-to-r from-lavender/70 via-card to-[#E8FBF4]/60 dark:from-primary/10">
              <SectionTitle title="Chào bạn, mình là Lumi! 💜" hint="Bắt đầu bằng một thói quen hoặc công việc đầu tiên — chỉ mất 1 phút." />
              <div className="flex flex-wrap gap-2">
                {QUICK_HABIT_SUGGESTIONS.map((s) => (
                  <button key={s.name} onClick={() => handleQuickHabitSuggestion(s)} className="h-9 px-3.5 rounded-full bg-card border border-border/70 hover:border-primary/40 text-[12.5px] font-medium">{s.icon} {s.name}</button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={() => setShowHabitModal(true)}>Tạo thói quen</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setShowTaskModal(true)}>Tạo công việc</Button>
              </div>
            </Surface>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<span className="text-[22px]">💧</span>} tint="sky" value={<>{water ?? 0}<span className="text-[14px] text-muted-foreground">/{waterM.target} ly</span></>} label="Nước uống" hint={<span className="text-primary">Chạm để +1 ly</span>}
              onClick={() => { health.add('water', 1, todayStr); }} />
            <StatTile icon={<span className="text-[22px]">🌙</span>} tint="violet" value={sleep !== null ? <>{+sleep.toFixed(1)}<span className="text-[14px] text-muted-foreground"> giờ</span></> : '–'} label="Giấc ngủ" onClick={() => navigate('/health?add')} />
            <StatTile icon={<span className="text-[22px]">🏃</span>} tint="mint" value={<>{exercise ?? 0}<span className="text-[14px] text-muted-foreground">/{exM.target}</span></>} label="Vận động" hint="phút hôm nay" onClick={() => navigate('/health?add')} />
            <StatTile icon="module/focus" tint="rose" value={<>{todayPomodoros.length}<span className="text-[14px] text-muted-foreground"> phiên</span></>} label="Tập trung" hint={focusMin ? `${focusMin} phút` : undefined} onClick={() => startPomodoro(topPriorityTask?.id)} />
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {QUICK.map((a) => (
              <button key={a.label} onClick={a.onClick} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 min-h-[72px] sm:min-h-14 rounded-[18px] bg-card border border-border/60 shadow-soft px-2 text-[12px] sm:text-[13px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-card">
                <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[a.tint].bg)}><LifeIcon name={a.icon} size={20} variant="duotone" /></span>
                <span className="truncate">{a.label}</span>
              </button>
            ))}
          </div>

          <Surface className="p-4">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-[12px] grid place-items-center bg-[#FFF6E0] dark:bg-amber-500/10 shrink-0"><Star className="w-4 h-4 text-[#E8961C]" /></span>
              {todayIntention ? (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="min-w-0 flex-1"><span className="block text-[11.5px] text-muted-foreground">Điều quan trọng nhất hôm nay</span><span className={cn('block text-[14px] font-semibold truncate', todayIntention.completed && 'line-through text-muted-foreground')}>{todayIntention.intention}</span></span>
                  {!todayIntention.completed && <Button size="sm" variant="secondary" className="rounded-full" onClick={() => { completeDailyIntention(todayIntention.id); toast.success('Hoàn thành!'); }}><CheckCircle2 className="w-4 h-4 mr-1" />Xong</Button>}
                </div>
              ) : (
                <div className="flex-1 flex gap-2">
                  <input placeholder="Điều quan trọng nhất hôm nay?" value={intentionInput} onChange={(e) => setIntentionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetIntention()}
                    className="h-10 flex-1 min-w-0 rounded-full border border-border bg-card px-4 text-[13.5px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
                  <Button size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={handleSetIntention} disabled={!intentionInput.trim()} aria-label="Đặt intention"><Send className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
            {topPriorityTask && !isPomodoroRunning && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary/50 px-3 py-2">
                <LifeIcon name="module/focus" size={20} variant="duotone" />
                <span className="flex-1 min-w-0"><span className="block text-[11px] text-muted-foreground">Việc ưu tiên tiếp theo</span><span className="block text-[13px] font-semibold truncate">{topPriorityTask.title}</span></span>
                <Button size="sm" className="rounded-full" onClick={() => focusTask(topPriorityTask.id)}><Play className="w-3.5 h-3.5 mr-1" />Focus</Button>
              </div>
            )}
          </Surface>

          <AIDailyBriefing />
          {userPreferences?.morningCheckinEnabled !== false && <MorningCheckin />}
          {userPreferences?.eveningReviewEnabled !== false && <EveningReview />}
          {userPreferences?.showTodayFocus !== false && <TodayFocusCard />}

          <div className="grid gap-4 md:grid-cols-2">{habitsCard}{tasksCard}</div>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && <Fab onClick={() => setShowTaskModal(true)} label="Thêm việc" />}

      <TodayAddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal}
        onAdd={(task) => { addTask({ title: task.title, priority: task.priority, status: 'todo', dueDate: task.dueDate, area: task.area }); toast.success('Đã thêm task mới'); }} />
      <TodayAddHabitModal open={showHabitModal} onOpenChange={setShowHabitModal} onAdd={(habit) => { addHabit(habit); toast.success('Đã thêm habit mới'); }} />
      <TodayAddJournalModal open={showJournalModal} onOpenChange={setShowJournalModal} todayStr={todayStr} onAdd={(entry) => { addJournalEntry({ ...entry, mood: entry.mood as JournalEntry['mood'], energy: entry.energy as JournalEntry['energy'] }); toast.success('Đã lưu journal!'); }} />
      {selectedHabit && (
        <HabitDetailModal habit={selectedHabit} open={isHabitDetailModalOpen} onOpenChange={(open) => { setIsHabitDetailModalOpen(open); if (!open) setSelectedHabit(null); }} />
      )}
    </Page>
  );
}
