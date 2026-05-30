import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Calendar, Trophy, Target, CheckCircle2, Flame,
  BookOpen, Timer, TrendingUp, TrendingDown, Minus, Plus, Edit2, Trash2,
  Star, AlertTriangle, Lightbulb, Heart, ArrowRight, BarChart3,
} from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const RATING_OPTIONS = [
  { value: 1, label: '😢 Tệ', color: 'text-red-500' },
  { value: 2, label: '😕 Chưa tốt', color: 'text-orange-500' },
  { value: 3, label: '😐 Bình thường', color: 'text-yellow-500' },
  { value: 4, label: '🙂 Tốt', color: 'text-green-500' },
  { value: 5, label: '🌟 Tuyệt vời', color: 'text-emerald-500' },
];

const DEFAULT_AREA_RATINGS: Record<LifeArea, number> = {
  health: 5, relationships: 5, career: 5, finance: 5, personal: 5,
  fun: 5, environment: 5, spirituality: 5, learning: 5, contribution: 5,
};

export default function MonthlyReviewPage() {
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const addMonthlyReview = useLifeOSStore((s) => s.addMonthlyReview);
  const updateMonthlyReview = useLifeOSStore((s) => s.updateMonthlyReview);
  const deleteMonthlyReview = useLifeOSStore((s) => s.deleteMonthlyReview);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);

  const isMobile = useIsMobile();
  const [monthOffset, setMonthOffset] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedDate = monthOffset === 0 ? new Date() : addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthStr = format(monthStart, 'yyyy-MM');

  const currentReview = monthlyReviews.find((r) => r.month === monthStr);
  const previousReview = monthlyReviews.find((r) => r.month === format(subMonths(monthStart, 1), 'yyyy-MM'));

  const [formData, setFormData] = useState({
    wins: '', challenges: '', lessonsLearned: '', nextMonthFocus: '',
    overallRating: 3 as 1 | 2 | 3 | 4 | 5,
    areaRatings: { ...DEFAULT_AREA_RATINGS } as Record<LifeArea, number>,
    gratitude: '', highlight: '', lowlight: '',
  });

  // Calculate month stats
  const monthStats = useMemo(() => {
    const monthDays = eachDayOfInterval({ start: monthStart, end: new Date() < monthEnd ? new Date() : monthEnd });
    const monthDates = monthDays.map((d) => format(d, 'yyyy-MM-dd'));
    const allMonthDates = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((d) => format(d, 'yyyy-MM-dd'));

    const tasksCompleted = tasks.filter((t) => t.completedAt && monthDates.some((d) => t.completedAt?.startsWith(d))).length;
    const tasksCreated = tasks.filter((t) => monthDates.some((d) => t.createdAt.startsWith(d))).length;

    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    let totalPossible = 0;
    let totalCompleted = 0;
    activeHabits.forEach((habit) => {
      totalPossible += monthDays.length;
      totalCompleted += habit.completedDates.filter((d) => monthDates.includes(d)).length;
    });
    const habitsCompletionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    const activeGoalsCount = goals.filter((g) => !g.deletedAt && !g.completedAt).length;
    const completedGoals = goals.filter((g) => g.completedAt && monthDates.some((d) => g.completedAt?.startsWith(d))).length;
    const journalCount = journalEntries.filter((j) => monthDates.some((d) => j.date.startsWith(d))).length;

    const monthPomodoros = pomodoroSessions.filter((s) => s.phase === 'work' && monthDates.some((d) => s.completedAt.startsWith(d)));
    const pomodoroCount = monthPomodoros.length;
    const pomodoroMinutes = pomodoroCount * (pomodoroSettings.workDuration || 25);

    const monthJournals = journalEntries.filter((j) => monthDates.some((d) => j.date.startsWith(d)));
    const avgMood = monthJournals.length > 0 ? (monthJournals.reduce((sum, j) => sum + j.mood, 0) / monthJournals.length).toFixed(1) : null;
    const monthWeeklyReviews = weeklyReviews.filter((r) => r.weekStart.startsWith(monthStr));

    return { tasksCompleted, tasksCreated, habitsCompletionRate, activeGoalsCount, completedGoals, journalCount, pomodoroCount, pomodoroMinutes, avgMood, weeklyReviewsCount: monthWeeklyReviews.length, daysInMonth: allMonthDates.length };
  }, [tasks, habits, goals, journalEntries, pomodoroSessions, pomodoroSettings, weeklyReviews, monthStart, monthEnd, monthStr]);

  const prevMonthStats = useMemo(() => {
    const prevStart = startOfMonth(subMonths(monthStart, 1));
    const prevEnd = endOfMonth(subMonths(monthStart, 1));
    const prevDates = eachDayOfInterval({ start: prevStart, end: prevEnd }).map((d) => format(d, 'yyyy-MM-dd'));

    const tasksCompleted = tasks.filter((t) => t.completedAt && prevDates.some((d) => t.completedAt?.startsWith(d))).length;
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    let totalPossible = 0;
    let totalCompleted = 0;
    activeHabits.forEach((habit) => { totalPossible += prevDates.length; totalCompleted += habit.completedDates.filter((d) => prevDates.includes(d)).length; });
    const habitsCompletionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const pomodoroCount = pomodoroSessions.filter((s) => s.phase === 'work' && prevDates.some((d) => s.completedAt.startsWith(d))).length;

    return { tasksCompleted, habitsCompletionRate, pomodoroCount };
  }, [tasks, habits, pomodoroSessions, monthStart]);

  const getDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const DeltaBadge = ({ current, previous }: { current: number; previous: number }) => {
    const delta = getDelta(current, previous);
    if (delta === 0) return <Badge variant="secondary" className="text-xs gap-1"><Minus className="w-3 h-3" /> 0%</Badge>;
    if (delta > 0) return <Badge className="bg-green-500/20 text-green-600 text-xs gap-1 border-0"><TrendingUp className="w-3 h-3" /> +{delta}%</Badge>;
    return <Badge className="bg-red-500/20 text-red-600 text-xs gap-1 border-0"><TrendingDown className="w-3 h-3" /> {delta}%</Badge>;
  };

  const handleOpenForm = (editing: boolean) => {
    if (editing && currentReview) {
      setFormData({
        wins: currentReview.wins.join('\n'), challenges: currentReview.challenges.join('\n'),
        lessonsLearned: currentReview.lessonsLearned.join('\n'), nextMonthFocus: currentReview.nextMonthFocus.join('\n'),
        overallRating: currentReview.overallRating, areaRatings: currentReview.areaRatings || { ...DEFAULT_AREA_RATINGS },
        gratitude: currentReview.gratitude?.join('\n') || '', highlight: currentReview.highlight || '', lowlight: currentReview.lowlight || '',
      });
      setIsEditing(true);
    } else {
      setFormData({ wins: '', challenges: '', lessonsLearned: '', nextMonthFocus: '', overallRating: 3, areaRatings: { ...DEFAULT_AREA_RATINGS }, gratitude: '', highlight: '', lowlight: '' });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const reviewData = {
      month: monthStr,
      wins: formData.wins.split('\n').filter(Boolean), challenges: formData.challenges.split('\n').filter(Boolean),
      lessonsLearned: formData.lessonsLearned.split('\n').filter(Boolean), nextMonthFocus: formData.nextMonthFocus.split('\n').filter(Boolean),
      overallRating: formData.overallRating, areaRatings: formData.areaRatings,
      gratitude: formData.gratitude.split('\n').filter(Boolean), highlight: formData.highlight, lowlight: formData.lowlight,
      stats: { tasksCompleted: monthStats.tasksCompleted, tasksCreated: monthStats.tasksCreated, habitsCompletionRate: monthStats.habitsCompletionRate, goalsProgress: {} as Record<string, number>, journalEntries: monthStats.journalCount, pomodoroSessions: monthStats.pomodoroCount, pomodoroMinutes: monthStats.pomodoroMinutes },
    };
    if (isEditing && currentReview) { updateMonthlyReview(currentReview.id, reviewData); toast.success('Đã cập nhật review tháng!'); }
    else { addMonthlyReview(reviewData); toast.success('Đã lưu review tháng!'); }
    setIsDialogOpen(false);
  };

  const handleDelete = () => { if (currentReview) { deleteMonthlyReview(currentReview.id); toast.success('Đã xóa review tháng'); setDeleteDialogOpen(false); } };
  const ratingLabel = RATING_OPTIONS.find((r) => r.value === (currentReview?.overallRating || 0));

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            Monthly Review
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Tổng kết và đánh giá hàng tháng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthOffset((v) => v - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="text-center min-w-[140px]">
            <p className="font-semibold">{format(monthStart, 'MMMM yyyy', { locale: vi })}</p>
            <p className="text-xs text-muted-foreground">{monthStats.daysInMonth} ngày</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setMonthOffset((v) => v + 1)} disabled={monthOffset >= 0}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1"><CheckCircle2 className="w-4 h-4 text-green-500" /><DeltaBadge current={monthStats.tasksCompleted} previous={prevMonthStats.tasksCompleted} /></div>
          <p className="text-2xl font-bold">{monthStats.tasksCompleted}</p><p className="text-xs text-muted-foreground">Tasks hoàn thành</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1"><Flame className="w-4 h-4 text-orange-500" /><DeltaBadge current={monthStats.habitsCompletionRate} previous={prevMonthStats.habitsCompletionRate} /></div>
          <p className="text-2xl font-bold">{monthStats.habitsCompletionRate}%</p><p className="text-xs text-muted-foreground">Habit completion</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1"><Timer className="w-4 h-4 text-red-500" /><DeltaBadge current={monthStats.pomodoroCount} previous={prevMonthStats.pomodoroCount} /></div>
          <p className="text-2xl font-bold">{monthStats.pomodoroCount}</p><p className="text-xs text-muted-foreground">Pomodoro ({monthStats.pomodoroMinutes} phút)</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-2 mb-1"><BookOpen className="w-4 h-4 text-blue-500" /></div>
          <p className="text-2xl font-bold">{monthStats.journalCount}</p>
          <p className="text-xs text-muted-foreground">Journal{monthStats.avgMood && <> • Mood: {monthStats.avgMood}</>}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-purple-500" /></div><div><p className="text-lg font-bold">{monthStats.activeGoalsCount}</p><p className="text-xs text-muted-foreground">Goals đang làm</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-emerald-500" /></div><div><p className="text-lg font-bold">{monthStats.completedGoals}</p><p className="text-xs text-muted-foreground">Goals xong</p></div></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-500" /></div><div><p className="text-lg font-bold">{monthStats.weeklyReviewsCount}</p><p className="text-xs text-muted-foreground">Weekly Reviews</p></div></CardContent></Card>
      </div>

      {/* Review Content or Empty State */}
      {currentReview ? (
        <div className="space-y-4">
          <Card><CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Đánh giá tổng quan</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(true)}><Edit2 className="w-3 h-3 mr-1" /> Sửa</Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="w-3 h-3 mr-1" /> Xóa</Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{ratingLabel?.label.split(' ')[0]}</span>
              <div>
                <p className={cn("text-xl font-bold", ratingLabel?.color)}>{ratingLabel?.label.split(' ').slice(1).join(' ')}</p>
                <p className="text-sm text-muted-foreground">{format(monthStart, 'MMMM yyyy', { locale: vi })}</p>
              </div>
            </div>
            {currentReview.areaRatings && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                {LIFE_AREAS.map((area) => {
                  const rating = currentReview.areaRatings?.[area.id] || 5;
                  const prevRating = previousReview?.areaRatings?.[area.id] || 5;
                  const delta = rating - prevRating;
                  return (
                    <div key={area.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <span className="text-sm">{area.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{area.name}</p>
                        <div className="flex items-center gap-1">
                          <Progress value={rating * 10} className="h-1.5 flex-1" />
                          <span className="text-xs font-bold">{rating}</span>
                          {delta !== 0 && <span className={cn("text-[10px]", delta > 0 ? "text-green-500" : "text-red-500")}>{delta > 0 ? `+${delta}` : delta}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent></Card>

          {/* Highlight & Lowlight */}
          <div className="grid md:grid-cols-2 gap-4">
            {currentReview.highlight && <Card className="border-green-500/30"><CardContent className="p-4"><h3 className="font-medium text-sm text-green-600 mb-2 flex items-center gap-2"><Star className="w-4 h-4" /> Điểm sáng</h3><p className="text-sm">{currentReview.highlight}</p></CardContent></Card>}
            {currentReview.lowlight && <Card className="border-orange-500/30"><CardContent className="p-4"><h3 className="font-medium text-sm text-orange-600 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Cần cải thiện</h3><p className="text-sm">{currentReview.lowlight}</p></CardContent></Card>}
          </div>

          {/* Lists */}
          <div className="grid md:grid-cols-2 gap-4">
            {currentReview.wins.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Thành tựu ({currentReview.wins.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1">{currentReview.wins.map((w, i) => <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />{w}</li>)}</ul></CardContent></Card>}
            {currentReview.challenges.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Thách thức ({currentReview.challenges.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1">{currentReview.challenges.map((c, i) => <li key={i} className="text-sm flex items-start gap-2"><Minus className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />{c}</li>)}</ul></CardContent></Card>}
            {currentReview.lessonsLearned.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> Bài học ({currentReview.lessonsLearned.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1">{currentReview.lessonsLearned.map((l, i) => <li key={i} className="text-sm flex items-start gap-2"><Lightbulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />{l}</li>)}</ul></CardContent></Card>}
            {currentReview.nextMonthFocus.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Focus tháng sau ({currentReview.nextMonthFocus.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1">{currentReview.nextMonthFocus.map((f, i) => <li key={i} className="text-sm flex items-start gap-2"><Target className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />{f}</li>)}</ul></CardContent></Card>}
          </div>

          {currentReview.gratitude && currentReview.gratitude.length > 0 && (
            <Card className="border-pink-500/20"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> Biết ơn</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1">{currentReview.gratitude.map((g, i) => <li key={i} className="text-sm flex items-start gap-2"><Heart className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />{g}</li>)}</ul></CardContent></Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Chưa có review cho tháng này</h3>
          <p className="text-sm text-muted-foreground mb-4">Tổng kết tháng giúp bạn nhìn lại thành tựu, bài học và lập kế hoạch cho tháng tiếp theo</p>
          <Button onClick={() => handleOpenForm(false)}><Plus className="w-4 h-4 mr-2" /> Viết Monthly Review</Button>
        </CardContent></Card>
      )}

      {/* Review History */}
      {monthlyReviews.length > 0 && (
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lịch sử Monthly Review</CardTitle></CardHeader><CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {monthlyReviews.sort((a, b) => b.month.localeCompare(a.month)).map((review) => {
              const isSelected = review.month === monthStr;
              const rating = RATING_OPTIONS.find((r) => r.value === review.overallRating);
              return (
                <Button key={review.id} variant={isSelected ? 'default' : 'outline'} size="sm" className="gap-1" onClick={() => {
                  const [y, m] = review.month.split('-').map(Number);
                  const now = new Date();
                  setMonthOffset((y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()));
                }}>
                  <span>{rating?.label.split(' ')[0]}</span> {format(parseISO(review.month + '-01'), 'MM/yyyy')}
                </Button>
              );
            })}
          </div>
        </CardContent></Card>
      )}

      {/* Form Dialog */}
      <AdaptiveModal open={isDialogOpen} onOpenChange={setIsDialogOpen} title={isEditing ? 'Chỉnh sửa Monthly Review' : 'Viết Monthly Review'}>
        <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label className="font-medium">Đánh giá tổng quan tháng</Label>
            <div className="flex gap-2 flex-wrap">
              {RATING_OPTIONS.map((option) => (
                <Button key={option.value} type="button" variant={formData.overallRating === option.value ? 'default' : 'outline'} size="sm"
                  onClick={() => setFormData({ ...formData, overallRating: option.value as 1 | 2 | 3 | 4 | 5 })}>{option.label}</Button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label className="font-medium">Đánh giá theo lĩnh vực (1-10)</Label>
            {LIFE_AREAS.map((area) => (
              <div key={area.id} className="flex items-center gap-3">
                <span className="w-6 text-center">{area.icon}</span>
                <span className="text-sm w-20 truncate">{area.name}</span>
                <Slider min={1} max={10} step={1} value={[formData.areaRatings[area.id]]} onValueChange={([v]) => setFormData({ ...formData, areaRatings: { ...formData.areaRatings, [area.id]: v } })} className="flex-1" />
                <span className="text-sm font-bold w-6 text-right">{formData.areaRatings[area.id]}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>⭐ Điểm sáng</Label><Textarea placeholder="Thành tựu nổi bật nhất..." value={formData.highlight} onChange={(e) => setFormData({ ...formData, highlight: e.target.value })} rows={2} /></div>
            <div className="space-y-1"><Label>⚠️ Cần cải thiện</Label><Textarea placeholder="Điều gì chưa tốt..." value={formData.lowlight} onChange={(e) => setFormData({ ...formData, lowlight: e.target.value })} rows={2} /></div>
          </div>
          <div className="space-y-1"><Label>🏆 Thành tựu (mỗi dòng 1 mục)</Label><Textarea placeholder="Hoàn thành dự án X..." value={formData.wins} onChange={(e) => setFormData({ ...formData, wins: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>⚡ Thách thức</Label><Textarea placeholder="Khó duy trì thói quen..." value={formData.challenges} onChange={(e) => setFormData({ ...formData, challenges: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>💡 Bài học</Label><Textarea placeholder="Cần lập kế hoạch tốt hơn..." value={formData.lessonsLearned} onChange={(e) => setFormData({ ...formData, lessonsLearned: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>🎯 Focus tháng sau</Label><Textarea placeholder="Tập trung vào..." value={formData.nextMonthFocus} onChange={(e) => setFormData({ ...formData, nextMonthFocus: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>💝 Biết ơn</Label><Textarea placeholder="Biết ơn vì..." value={formData.gratitude} onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })} rows={2} /></div>
          <Button className="w-full" onClick={handleSave}>{isEditing ? 'Cập nhật Review' : 'Lưu Monthly Review'}</Button>
        </div>
      </AdaptiveModal>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa review tháng này?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
