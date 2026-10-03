import { useState, useEffect, type ReactNode } from 'react';
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
import { DailyCheckin } from '@/components/today/DailyCheckin';
import { HabitRescueCard } from '@/components/today/HabitRescueCard';
import { AIDailyBriefing } from '@/components/today/AIDailyBriefing';
import { RecommendationsCard } from '@/components/today/RecommendationsCard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { suggestEmoji } from '@/features/habits/utils/habit.utils';
import { useAuth } from '@/hooks/useAuth';
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
  { text: "Mỗi ngày mới là một cơ hội mới để trở thành phiên bản tốt hơn của chính mình", author: "Khuyết danh" },
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
  const { user: authUser } = useAuth();
  const meta = (authUser?.user_metadata ?? {}) as { name?: string; full_name?: string };
  const displayName = (user.name || meta.name || meta.full_name || '').trim().split(/\s+/).pop() ?? '';
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
  const { isOn } = useEnabledModules();
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

  const hour = new Date().getHours(); // giờ thực (today = 00:00 đầu ngày)
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
    isOn('journal') ? { label: 'Nhật ký', icon: 'module/journal', tint: 'sky', onClick: () => setShowJournalModal(true) }
      : isOn('notes') ? { label: 'Ghi chú', icon: 'module/notes', tint: 'amber', onClick: () => navigate('/notes?add') }
      : { label: 'AI Coach', icon: 'module/ai-coach', tint: 'sky', onClick: () => navigate('/ai-chat') },
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
        <SectionTitle title="Tuần này" action={isOn('reviews') ? <Link to="/weekly-review" className="text-[12px] font-semibold text-primary">Review</Link> : undefined} />
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{weeklyCompletedHabits}</p><p className="text-[11px] text-muted-foreground">Lượt thói quen</p></div>
          <div className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{weeklyCompletedTasks.length}</p><p className="text-[11px] text-muted-foreground">Việc xong</p></div>
        </div>
        {!isOn('reviews') ? null : currentWeekReview
          ? <p className="mt-3 text-center text-[12.5px] font-semibold text-[#22B07D]">✓ Đã review tuần này</p>
          : <Button variant="outline" className="mt-3 w-full h-9 rounded-full text-[12.5px]" asChild><Link to="/weekly-review?add">Viết Weekly Review</Link></Button>}
        {isOn('reviews') && isNearMonthEnd && (
          <div className={cn('mt-2 flex items-center justify-between rounded-2xl px-3 py-2 text-[12px]', currentMonthReview ? 'bg-[#E8FBF4] dark:bg-success/10' : 'bg-[#FFF6E0] dark:bg-amber-500/10')}>
            <span className="font-semibold">{currentMonthReview ? `Review tháng ✓ (${currentMonthReview.overallRating}/5)` : 'Chưa review tháng này'}</span>
            <Link to={currentMonthReview ? '/monthly-review' : '/monthly-review?add'} className="font-semibold text-primary">{currentMonthReview ? 'Xem' : 'Viết'}</Link>
          </div>
        )}
      </Surface>
      <HabitRescueCard />
      {userPreferences?.showAISuggestions !== false && <AISuggestionsCard compact />}
      <RecommendationsCard />
      {isOn('life_areas') && <Surface className="p-4">
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
      </Surface>}
      <MascotCard mascot="lumi" pose="happy" quote={`“${todayQuote.text}” — ${todayQuote.author}`} />
    </div>
  );

  // ---------------- Mobile: 1 màn hình trả lời "Tiếp theo? Hôm nay? Tới đâu?" ----------------
  const dueTasks = [...overdueTasks, ...todayTasks];
  const dueTotal = dueTasks.length + completedTasksToday.length;
  const prio = { high: 3, medium: 2, low: 1 } as const;
  const nextTask = [...dueTasks].sort((a, b) => (prio[b.priority] ?? 0) - (prio[a.priority] ?? 0))[0];
  const slotNow = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const slotOf = (h: Habit) => (!h.reminderTime ? 'any' : +h.reminderTime.slice(0, 2) < 12 ? 'morning' : +h.reminderTime.slice(0, 2) < 17 ? 'afternoon' : 'evening');
  const habitCount = (h: Habit) => h.completions?.find((c) => c.date === todayStr)?.count || (h.completedDates.includes(todayStr) ? 1 : 0);
  const habitDone = (h: Habit) => habitCount(h) >= (h.targetPerDay || 1);
  const habitRow = [...todayHabits].sort((a, b) => {
    const rank = (h: Habit) => (habitDone(h) ? 2 : slotOf(h) === slotNow || slotOf(h) === 'any' ? 0 : 1);
    return rank(a) - rank(b);
  });
  const habitEmoji = (h: Habit) => suggestEmoji(h.name) ?? h.icon ?? LIFE_AREAS.find((a) => a.id === h.area)?.icon ?? '✨';
  const tapHabit = (h: Habit) => { if ((h.targetPerDay || 1) > 1) { setSelectedHabit(h); setIsHabitDetailModalOpen(true); } else toggleHabitCompletion(h.id, todayStr); };
  const moveOverdue = () => { overdueTasks.forEach((t) => updateTask(t.id, { dueDate: todayStr })); toast.success(`Đã dời ${overdueTasks.length} việc sang hôm nay`); };
  const slotLabel = { morning: 'buổi sáng', afternoon: 'buổi chiều', evening: 'buổi tối' }[slotNow];
  const isSunday = today.getDay() === 0;
  const chip = (dot: string, label: ReactNode, cls = 'bg-card/80') => <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[12px] font-semibold shadow-soft whitespace-nowrap', cls)}>{dot && <i className={cn('h-1.5 w-1.5 rounded-full', dot)} />}{label}</span>;
  const taskRow = (task: typeof activeTasks[number], overdue = false) => {
    const area = task.area ? LIFE_AREAS.find((a) => a.id === task.area) : null;
    const days = overdue && task.dueDate ? Math.floor((today.getTime() - parseISO(task.dueDate).getTime()) / 864e5) : 0;
    return (
      <div key={task.id} className="flex items-center gap-3 px-1 py-2.5 border-b border-border/50 last:border-0">
        <button aria-label="Hoàn thành" onClick={() => doneTask(task.id)} className={cn('h-[22px] w-[22px] rounded-full border-2 shrink-0', overdue || task.priority === 'high' ? 'border-destructive' : task.priority === 'medium' ? 'border-warning' : 'border-muted-foreground/40')} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium leading-snug line-clamp-2">{task.title}</span>
          {(overdue || area) && <span className={cn('block text-[11.5px] mt-0.5', overdue ? 'text-destructive' : 'text-muted-foreground')}>{overdue ? `Quá hạn ${days} ngày` : `${area!.icon} ${area!.name}`}</span>}
        </span>
        <button aria-label="Tập trung" onClick={() => focusTask(task.id)} className="h-9 w-9 rounded-full grid place-items-center text-muted-foreground active:bg-secondary shrink-0"><Play className="w-4 h-4" /></button>
      </div>
    );
  };

  const checkin = (
    <DailyCheckin
      summary={{ tasksDone: completedTasksToday.length, tasksTotal: todayTasks.length + completedTasksToday.length, habitsDone: completedHabitsToday.length, habitsTotal: todayHabits.length }}
      suggestions={[...overdueTasks, ...todayTasks].filter((t) => t.status !== 'done').sort((a, b) => (a.priority === 'high' ? -1 : 0) - (b.priority === 'high' ? -1 : 0)).map((t) => t.title)}
    />
  );

  if (isMobile) return (
    <Page>
      {onboardingChecked && userPreferences?.onboardingCompleted === false && <OnboardingWizard onComplete={() => {}} />}
      <div className="space-y-3.5 -mt-1">
        {/* 1. Đầu trang gọn */}
        <section className="rounded-[26px] bg-gradient-to-br from-lavender via-card to-[#FFF1F6] dark:from-primary/15 dark:via-card dark:to-card border border-border/50 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-muted-foreground first-letter:uppercase">{format(today, "EEEE, dd/MM", { locale: vi })}</p>
              <h1 className="text-[22px] font-extrabold leading-tight mt-0.5">{greeting}{displayName ? `, ${displayName}` : ''} 👋</h1>
              {userPreferences?.onboardingFocus && <p className="mt-1 text-[12.5px] text-muted-foreground truncate">🎯 <b className="text-foreground font-semibold">{userPreferences.onboardingFocus}</b></p>}
            </div>
            <ProgressRing value={dayProgress} size={58} stroke={7} />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {chip('bg-peach', <>Việc {completedTasksToday.length}/{dueTotal}</>)}
            {chip('bg-mint', <>Thói quen {completedHabitsToday.length}/{todayHabits.length}</>)}
            {overdueTasks.length > 0 && chip('', `${overdueTasks.length} quá hạn`, 'bg-destructive/10 text-destructive shadow-none')}
            {isPomodoroRunning && chip('', <><Clock className="w-3.5 h-3.5" />Đang tập trung</>, 'bg-primary/10 text-primary shadow-none')}
          </div>
        </section>

        {/* 2. Check-in đúng lúc (sáng/tối theo giờ dậy–ngủ) */}
        {checkin}

        {/* 3. Tiếp theo */}
        <section className="rounded-[24px] bg-primary text-primary-foreground p-4 shadow-soft relative overflow-hidden">
          <span className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <p className="text-[11.5px] font-bold uppercase tracking-wide opacity-80">{todayIntention && !todayIntention.completed ? 'Điều quan trọng nhất' : 'Tiếp theo'}</p>
          {todayIntention && !todayIntention.completed ? (
            <>
              <p className="mt-1 text-[17px] font-bold leading-snug line-clamp-2">{todayIntention.intention}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" className="rounded-full h-9 flex-1" onClick={() => startPomodoro(nextTask?.id)}><Play className="w-3.5 h-3.5 mr-1" />Tập trung</Button>
                <Button size="sm" className="rounded-full h-9 flex-1 bg-white/15 hover:bg-white/25 text-white" onClick={() => { completeDailyIntention(todayIntention.id); toast.success('Hoàn thành!'); }}><CheckCircle2 className="w-4 h-4 mr-1" />Xong</Button>
              </div>
            </>
          ) : nextTask ? (
            <>
              <p className="mt-1 text-[17px] font-bold leading-snug line-clamp-2">{nextTask.title}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" className="rounded-full h-9 flex-1" onClick={() => focusTask(nextTask.id)}><Play className="w-3.5 h-3.5 mr-1" />Bắt đầu 25 phút</Button>
                <Button size="sm" className="rounded-full h-9 flex-1 bg-white/15 hover:bg-white/25 text-white" onClick={() => doneTask(nextTask.id)}><CheckCircle2 className="w-4 h-4 mr-1" />Xong</Button>
              </div>
            </>
          ) : (
            <div className="mt-2 flex gap-2">
              <input placeholder="Điều quan trọng nhất hôm nay?" value={intentionInput} onChange={(e) => setIntentionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetIntention()} className="h-10 flex-1 min-w-0 rounded-full bg-white/15 placeholder:text-white/70 px-4 text-[14px] outline-none" />
              <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shrink-0" onClick={handleSetIntention} disabled={!intentionInput.trim()} aria-label="Đặt"><Send className="w-4 h-4" /></Button>
            </div>
          )}
        </section>

        {/* 3. Thói quen */}
        <Surface className="p-4 pb-3">
          <SectionTitle title="Thói quen" hint={todayHabits.length ? `${completedHabitsToday.length}/${todayHabits.length} · ưu tiên ${slotLabel}` : undefined} action={<Link to="/habits" className="text-[12px] font-semibold text-primary">Tất cả</Link>} />
          {todayHabits.length === 0 ? (
            <button onClick={() => setShowHabitModal(true)} className="w-full h-11 rounded-2xl border border-dashed border-border text-[13px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" />Thêm thói quen đầu tiên</button>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {habitRow.map((h) => {
                const target = h.targetPerDay || 1, cnt = habitCount(h), done = cnt >= target, pct = Math.min(cnt / target, 1);
                return (
                  <button key={h.id} onClick={() => tapHabit(h)} className="w-[64px] shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                    <span className="relative h-[58px] w-[58px] grid place-items-center">
                      <svg viewBox="0 0 58 58" className="absolute inset-0 -rotate-90"><circle cx="29" cy="29" r="26" fill="none" strokeWidth="4" className="stroke-secondary" />{pct > 0 && <circle cx="29" cy="29" r="26" fill="none" strokeWidth="4" strokeLinecap="round" stroke="#22B07D" strokeDasharray={`${pct * 163.4} 163.4`} />}</svg>
                      <span className={cn('h-[46px] w-[46px] rounded-full grid place-items-center text-[22px]', done ? 'bg-[#22B07D]' : 'bg-secondary/70')}>{done ? <CheckCircle2 className="w-6 h-6 text-white" /> : habitEmoji(h)}</span>
                    </span>
                    <span className={cn('text-[11px] font-medium leading-tight text-center line-clamp-2', done && 'text-muted-foreground')}>{h.name}</span>
                    {target > 1 && !done && <span className="text-[10px] text-muted-foreground tabular-nums -mt-1">{cnt}/{target}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </Surface>

        {/* 4. Việc hôm nay */}
        <Surface className="p-4 pb-2">
          <SectionTitle title="Việc hôm nay" hint={dueTasks.length ? `${dueTasks.length} việc` : undefined} action={<Link to="/tasks" className="text-[12px] font-semibold text-primary">Tất cả</Link>} />
          {overdueTasks.length > 0 && (
            <details className="group mb-1 rounded-2xl bg-destructive/[0.06] px-3 py-1">
              <summary className="list-none flex items-center gap-2 py-1.5 cursor-pointer">
                <span className="text-[13px] font-semibold text-destructive flex-1">Quá hạn ({overdueTasks.length})</span>
                <button onClick={(e) => { e.preventDefault(); moveOverdue(); }} className="text-[12px] font-semibold text-primary px-2 h-7 rounded-full bg-card">Dời sang hôm nay</button>
                <span className="text-muted-foreground text-[12px] group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div>{overdueTasks.map((t) => taskRow(t, true))}</div>
            </details>
          )}
          {todayTasks.length === 0 && overdueTasks.length === 0 ? (
            <div className="py-3 text-center"><Empty>Không có việc nào hạn hôm nay 🎉</Empty><Button variant="outline" size="sm" className="rounded-full mt-1" onClick={() => setShowTaskModal(true)}><Plus className="w-3.5 h-3.5 mr-1" />Thêm việc</Button></div>
          ) : <div>{todayTasks.map((t) => taskRow(t))}</div>}
        </Surface>

        {/* 5. Đúng lúc: sáng check-in, tối review, Chủ nhật review tuần */}
        {isSunday && isOn('reviews') && !currentWeekReview && (
          <Link to="/weekly-review?add" className="flex items-center gap-3 rounded-[22px] border border-border/60 bg-card p-3.5">
            <span className="h-10 w-10 rounded-[13px] bg-lavender dark:bg-primary/15 grid place-items-center text-[18px]">🗓️</span>
            <span className="flex-1 min-w-0"><span className="block text-[14px] font-semibold">Nhìn lại tuần này</span><span className="block text-[12px] text-muted-foreground">5 phút để tuần sau tốt hơn</span></span>
            <span className="text-primary text-[13px] font-semibold">Viết</span>
          </Link>
        )}

        {/* 6. Sức khỏe — 1 hàng nhỏ */}
        {isOn('health') && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            <button onClick={() => health.add('water', 1, todayStr)} className="shrink-0 h-12 px-3.5 rounded-2xl bg-card border border-border/60 flex items-center gap-2 text-[13px] font-semibold">💧 {water ?? 0}/{waterM.target} <span className="h-6 w-6 rounded-full bg-[#E8F1FF] text-[#3D8BFD] grid place-items-center"><Plus className="w-3.5 h-3.5" /></span></button>
            <button onClick={() => navigate('/health?add')} className="shrink-0 h-12 px-3.5 rounded-2xl bg-card border border-border/60 flex items-center gap-2 text-[13px] font-semibold">🌙 {sleep !== null ? `${(+sleep.toFixed(1)).toLocaleString('vi-VN')}h` : '–'}</button>
            <button onClick={() => navigate('/health?add')} className="shrink-0 h-12 px-3.5 rounded-2xl bg-card border border-border/60 flex items-center gap-2 text-[13px] font-semibold">🏃 {exercise ?? 0}/{exM.target}′</button>
            <button onClick={() => startPomodoro(nextTask?.id)} className="shrink-0 h-12 px-3.5 rounded-2xl bg-card border border-border/60 flex items-center gap-2 text-[13px] font-semibold">⏱ {todayPomodoros.length} phiên</button>
          </div>
        )}

        {/* 7. Tuần này + gợi ý */}
        <Surface className="p-4">
          <SectionTitle title="Tuần này" action={isOn('reviews') ? <Link to="/weekly-review" className="text-[12px] font-semibold text-primary">Review</Link> : undefined} />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-[#FFF1E8] dark:bg-streak/10 py-2.5"><p className="text-[18px] font-extrabold tabular-nums text-streak">🔥{bestStreak}</p><p className="text-[11px] text-muted-foreground">Chuỗi ngày</p></div>
            <div className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{weeklyCompletedHabits}</p><p className="text-[11px] text-muted-foreground">Lượt thói quen</p></div>
            <div className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{weeklyCompletedTasks.length}</p><p className="text-[11px] text-muted-foreground">Việc xong</p></div>
          </div>
        </Surface>
        <RecommendationsCard />
      </div>

      <TodayAddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal}
        onAdd={(task) => { addTask({ title: task.title, priority: task.priority, status: 'todo', dueDate: task.dueDate, area: task.area }); toast.success('Đã thêm việc mới'); }} />
      <TodayAddHabitModal open={showHabitModal} onOpenChange={setShowHabitModal} onAdd={(habit) => { addHabit(habit); toast.success('Đã thêm thói quen mới'); }} />
      {selectedHabit && (
        <HabitDetailModal habit={selectedHabit} open={isHabitDetailModalOpen} onOpenChange={(open) => { setIsHabitDetailModalOpen(open); if (!open) setSelectedHabit(null); }} />
      )}
      <Fab onClick={() => setShowTaskModal(true)} label="Thêm việc" />
    </Page>
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
          <HeroBanner mascot="lumi" pose={dayProgress >= 80 ? 'happy' : 'default'} title={<>{greeting}{displayName ? `, ${displayName}` : ''}! 👋</>}
            subtitle={userPreferences?.onboardingFocus ? <span>🎯 Trọng tâm: <b>{userPreferences.onboardingFocus}</b></span> : <span className="italic">“{todayQuote.text}”</span>}
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

          {isOn('health') ? (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile icon={<span className="text-[22px]">💧</span>} tint="sky" value={<>{water ?? 0}<span className="text-[14px] text-muted-foreground">/{waterM.target} ly</span></>} label="Nước uống" hint={<span className="text-primary">Chạm để +1 ly</span>}
                onClick={() => { health.add('water', 1, todayStr); }} />
              <StatTile icon={<span className="text-[22px]">🌙</span>} tint="violet" value={sleep !== null ? <>{+sleep.toFixed(1)}<span className="text-[14px] text-muted-foreground"> giờ</span></> : '–'} label="Giấc ngủ" onClick={() => navigate('/health?add')} />
              <StatTile icon={<span className="text-[22px]">🏃</span>} tint="mint" value={<>{exercise ?? 0}<span className="text-[14px] text-muted-foreground">/{exM.target}</span></>} label="Vận động" hint="phút hôm nay" onClick={() => navigate('/health?add')} />
              <StatTile icon="module/focus" tint="rose" value={<>{todayPomodoros.length}<span className="text-[14px] text-muted-foreground"> phiên</span></>} label="Tập trung" hint={focusMin ? `${focusMin} phút` : undefined} onClick={() => startPomodoro(topPriorityTask?.id)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon="module/tasks" tint="violet" value={<>{completedTasksToday.length}<span className="text-[14px] text-muted-foreground">/{completedTasksToday.length + todayTasks.length} việc</span></>} label="Xong hôm nay" onClick={() => navigate('/tasks')} />
              <StatTile icon="module/focus" tint="rose" value={<>{todayPomodoros.length}<span className="text-[14px] text-muted-foreground"> phiên</span></>} label="Tập trung" hint={focusMin ? `${focusMin} phút` : undefined} onClick={() => startPomodoro(topPriorityTask?.id)} />
            </div>
          )}

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
          {checkin}
          {!isMobile && userPreferences?.showTodayFocus !== false && <TodayFocusCard />}

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
