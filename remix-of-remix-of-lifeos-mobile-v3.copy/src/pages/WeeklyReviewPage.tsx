import { useState, useEffect, useMemo } from 'react';
import { Plus, Star, Trophy, AlertCircle, Lightbulb, Target, Edit2, X, ChevronLeft, ChevronRight, PieChart, PanelRightClose, PanelRight, CheckCircle2, Clock, Flame, Calendar, TrendingUp, BookOpen, MessageCircle, Wand2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { WeeklyReviewChart } from '@/components/weeklyreview/WeeklyReviewChart';
import { WeeklyReviewInsights } from '@/components/weeklyreview/WeeklyReviewInsights';
import { ReflectionPrompts } from '@/components/weeklyreview/ReflectionPrompts';
import { WeeklyReviewHistory } from '@/components/weeklyreview/WeeklyReviewHistory';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useWeeklyAutoDraft } from '@/hooks/useWeeklyAutoDraft';

const RATING_OPTIONS = [
  { value: 1, label: '😢 Tệ' },
  { value: 2, label: '😕 Chưa tốt' },
  { value: 3, label: '😐 Bình thường' },
  { value: 4, label: '🙂 Tốt' },
  { value: 5, label: '🌟 Tuyệt vời' },
];

const DEFAULT_AREA_RATINGS: Record<LifeArea, number> = {
  health: 5,
  relationships: 5,
  career: 5,
  finance: 5,
  personal: 5,
  fun: 5,
  environment: 5,
  spirituality: 5,
  learning: 5,
  contribution: 5,
};

export default function WeeklyReviewPage() {
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const clearWeeklyReviewHistory = useLifeOSStore((s) => s.clearWeeklyReviewHistory);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  
  // Use synced store for operations that need to sync to Supabase
  const { addWeeklyReview, updateWeeklyReview, deleteWeeklyReview } = useSyncedStore();
  const isMobile = useIsMobile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Sidebar collapse state with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('lifeos.weeklyreview.sidebarOpen');
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('lifeos.weeklyreview.sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const selectedDate = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const currentWeekReview = weeklyReviews.find((r) => r.weekStart === weekStartStr);
  const previousWeekReview = weeklyReviews.find((r) => {
    const prevWeekStart = subWeeks(weekStart, 1).toISOString().split('T')[0];
    return r.weekStart === prevWeekStart;
  });

  const [newReview, setNewReview] = useState({
    wins: currentWeekReview?.wins.join('\n') || '',
    challenges: currentWeekReview?.challenges.join('\n') || '',
    lessonsLearned: currentWeekReview?.lessonsLearned.join('\n') || '',
    nextWeekFocus: currentWeekReview?.nextWeekFocus.join('\n') || '',
    overallRating: currentWeekReview?.overallRating || 3 as 1 | 2 | 3 | 4 | 5,
    areaRatings: currentWeekReview?.areaRatings || DEFAULT_AREA_RATINGS,
    gratitude: currentWeekReview?.gratitude?.join('\n') || '',
    highlight: currentWeekReview?.highlight || '',
    lowlight: currentWeekReview?.lowlight || '',
  });

  // Calculate week stats
  const getWeekDates = () => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const weekHabitsCompleted = habits.reduce((sum, habit) => {
    return sum + habit.completedDates.filter((d) => weekDates.includes(d)).length;
  }, 0);
  const weekTasksCompleted = tasks.filter((t) => t.completedAt && weekDates.some((d) => t.completedAt?.startsWith(d))).length;
  const weekPomodoros = pomodoroSessions.filter((s) => s.phase === 'work' && weekDates.some((d) => s.completedAt.startsWith(d))).length;

  const autoDraft = useWeeklyAutoDraft(weekDates);

  const handleAutoDraft = () => {
    setNewReview({
      wins: autoDraft.wins,
      challenges: autoDraft.challenges,
      lessonsLearned: autoDraft.lessonsLearned,
      nextWeekFocus: autoDraft.nextWeekFocus,
      overallRating: 3,
      areaRatings: autoDraft.areaRatings,
      gratitude: autoDraft.gratitude,
      highlight: autoDraft.highlight,
      lowlight: autoDraft.lowlight,
    });
    setIsDialogOpen(true);
    toast({ title: 'Auto-draft!', description: 'Đã tạo bản nháp từ dữ liệu tuần này. Hãy chỉnh sửa thêm.' });
  };

  const handleAddReview = () => {
    if (isEditing && currentWeekReview) {
      updateWeeklyReview(currentWeekReview.id, {
        wins: newReview.wins.split('\n').filter(Boolean),
        challenges: newReview.challenges.split('\n').filter(Boolean),
        lessonsLearned: newReview.lessonsLearned.split('\n').filter(Boolean),
        nextWeekFocus: newReview.nextWeekFocus.split('\n').filter(Boolean),
        overallRating: newReview.overallRating,
        areaRatings: newReview.areaRatings,
        gratitude: newReview.gratitude.split('\n').filter(Boolean),
        highlight: newReview.highlight,
        lowlight: newReview.lowlight,
      });
      toast({ title: 'Đã cập nhật!', description: 'Review tuần đã được lưu.' });
    } else {
      addWeeklyReview({
        weekStart: weekStartStr,
        wins: newReview.wins.split('\n').filter(Boolean),
        challenges: newReview.challenges.split('\n').filter(Boolean),
        lessonsLearned: newReview.lessonsLearned.split('\n').filter(Boolean),
        nextWeekFocus: newReview.nextWeekFocus.split('\n').filter(Boolean),
        overallRating: newReview.overallRating,
        areaRatings: newReview.areaRatings,
        gratitude: newReview.gratitude.split('\n').filter(Boolean),
        highlight: newReview.highlight,
        lowlight: newReview.lowlight,
      });
      toast({ title: 'Đã lưu!', description: 'Review tuần đã được lưu và cập nhật Wheel of Life.' });
    }
    setNewReview({ wins: '', challenges: '', lessonsLearned: '', nextWeekFocus: '', overallRating: 3, areaRatings: DEFAULT_AREA_RATINGS, gratitude: '', highlight: '', lowlight: '' });
    setIsDialogOpen(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (currentWeekReview) {
      setNewReview({
        wins: currentWeekReview.wins.join('\n'),
        challenges: currentWeekReview.challenges.join('\n'),
        lessonsLearned: currentWeekReview.lessonsLearned.join('\n'),
        nextWeekFocus: currentWeekReview.nextWeekFocus.join('\n'),
        overallRating: currentWeekReview.overallRating,
        areaRatings: currentWeekReview.areaRatings || DEFAULT_AREA_RATINGS,
        gratitude: currentWeekReview.gratitude?.join('\n') || '',
        highlight: currentWeekReview.highlight || '',
        lowlight: currentWeekReview.lowlight || '',
      });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleSelectPrompt = (category: string, prompt: string) => {
    const categoryMap: Record<string, keyof typeof newReview> = {
      wins: 'wins',
      challenges: 'challenges',
      lessons: 'lessonsLearned',
      focus: 'nextWeekFocus',
    };
    const key = categoryMap[category];
    if (key && key !== 'overallRating') {
      const currentValue = newReview[key] as string;
      setNewReview({
        ...newReview,
        [key]: currentValue ? `${currentValue}\n${prompt}: ` : `${prompt}: `,
      });
    }
  };

  const handleDeleteReview = (id: string) => {
    deleteWeeklyReview(id);
    toast({ title: 'Đã xóa!', description: 'Review đã được xóa.' });
  };

  const handleClearHistory = () => {
    clearWeeklyReviewHistory();
    toast({ title: 'Đã xóa tất cả!', description: 'Toàn bộ lịch sử review đã được xóa.' });
  };

  const ReviewForm = () => (
    <div className="space-y-6 mt-4">
      {/* Life Area Ratings - Core feature per documentation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" /> 
            Chấm điểm các mảng cuộc sống (1-10)
          </Label>
          <Link to="/life-wheel" className="text-xs text-muted-foreground hover:text-primary">
            Xem Wheel of Life →
          </Link>
        </div>
        <div className="grid gap-3">
          {LIFE_AREAS.map((area) => (
            <div key={area.id} className="flex items-center gap-3">
              <span className="text-lg">{area.icon}</span>
              <span className="w-20 text-sm truncate">{area.name}</span>
              <Slider
                value={[newReview.areaRatings[area.id]]}
                onValueChange={([value]) => setNewReview({
                  ...newReview,
                  areaRatings: { ...newReview.areaRatings, [area.id]: value }
                })}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className={cn(
                "w-8 text-center font-bold text-sm",
                newReview.areaRatings[area.id] <= 3 && "text-destructive",
                newReview.areaRatings[area.id] >= 4 && newReview.areaRatings[area.id] <= 6 && "text-warning",
                newReview.areaRatings[area.id] >= 7 && "text-success"
              )}>
                {newReview.areaRatings[area.id]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Điểm này sẽ được cập nhật vào Wheel of Life tự động
        </p>
      </div>

      {/* Overall Rating */}
      <div>
        <Label>Đánh giá tổng quan tuần này</Label>
        <div className="flex gap-2 mt-2">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setNewReview({ ...newReview, overallRating: option.value as any })}
              className={cn(
                "flex-1 p-2 rounded-lg text-center text-sm transition-all",
                newReview.overallRating === option.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
              )}
            >
              {option.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Highlight & Lowlight */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="flex items-center gap-2"><Star className="w-4 h-4 text-warning" /> Highlight tuần</Label>
          <Textarea
            placeholder="Điểm nhấn đáng nhớ nhất"
            value={newReview.highlight}
            onChange={(e) => setNewReview({ ...newReview, highlight: e.target.value })}
            rows={2}
            className="mt-2"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /> Lowlight tuần</Label>
          <Textarea
            placeholder="Điều đáng tiếc nhất"
            value={newReview.lowlight}
            onChange={(e) => setNewReview({ ...newReview, lowlight: e.target.value })}
            rows={2}
            className="mt-2"
          />
        </div>
      </div>

      {/* Wins */}
      <div>
        <Label className="flex items-center gap-2"><Trophy className="w-4 h-4 text-warning" /> Chiến thắng tuần này</Label>
        <Textarea
          placeholder="Những điều bạn đã đạt được (mỗi dòng 1 điều)"
          value={newReview.wins}
          onChange={(e) => setNewReview({ ...newReview, wins: e.target.value })}
          rows={3}
          className="mt-2"
        />
      </div>

      {/* Challenges */}
      <div>
        <Label className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" /> Thách thức</Label>
        <Textarea
          placeholder="Những khó khăn bạn gặp phải"
          value={newReview.challenges}
          onChange={(e) => setNewReview({ ...newReview, challenges: e.target.value })}
          rows={3}
          className="mt-2"
        />
      </div>

      {/* Lessons */}
      <div>
        <Label className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-info" /> Bài học rút ra</Label>
        <Textarea
          placeholder="Những điều bạn học được"
          value={newReview.lessonsLearned}
          onChange={(e) => setNewReview({ ...newReview, lessonsLearned: e.target.value })}
          rows={3}
          className="mt-2"
        />
      </div>

      {/* Gratitude */}
      <div>
        <Label className="flex items-center gap-2">🙏 Biết ơn</Label>
        <Textarea
          placeholder="Những điều bạn biết ơn tuần này (mỗi dòng 1 điều)"
          value={newReview.gratitude}
          onChange={(e) => setNewReview({ ...newReview, gratitude: e.target.value })}
          rows={2}
          className="mt-2"
        />
      </div>

      {/* Next Week Focus */}
      <div>
        <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Focus tuần tới</Label>
        <Textarea
          placeholder="Những điều cần tập trung tuần tới"
          value={newReview.nextWeekFocus}
          onChange={(e) => setNewReview({ ...newReview, nextWeekFocus: e.target.value })}
          rows={3}
          className="mt-2"
        />
      </div>

      <Button className="w-full" onClick={handleAddReview}>
        {isEditing ? 'Cập nhật Review' : 'Lưu Review & Cập nhật Wheel of Life'}
      </Button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Weekly Review</h1>
          <div className="flex items-center gap-2 mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWeekOffset((o) => o - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tuần trước</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-muted-foreground text-sm">
              Tuần {format(weekStart, 'dd/MM', { locale: vi })} - {format(weekEnd, 'dd/MM', { locale: vi })}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0" 
                    onClick={() => setWeekOffset((o) => o + 1)}
                    disabled={weekOffset >= 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tuần sau</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {currentWeekReview && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="w-4 h-4 mr-1" /> Sửa
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-0 shadow-lg">
                  <p className="font-medium">Chỉnh sửa review</p>
                  <p className="text-xs opacity-90">Cập nhật nội dung review tuần này</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!currentWeekReview && weekOffset === 0 && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleAutoDraft}>
                      <Wand2 className="w-4 h-4 mr-2" /> Auto-draft
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gradient-to-r from-accent/90 to-accent text-accent-foreground border-0 shadow-lg">
                    <p className="font-medium">Tạo nháp tự động</p>
                    <p className="text-xs opacity-90">Tổng hợp từ tasks, habits, journal, pomodoro tuần này</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Review
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-0 shadow-lg">
                    <p className="font-medium">Tạo Weekly Review</p>
                    <p className="text-xs opacity-90">Đánh giá tuần, ghi nhận thành tích và bài học</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="h-8 px-2 gap-1 hidden lg:flex"
                >
                  {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSidebarOpen ? 'Ẩn sidebar' : 'Hiện sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AdaptiveModal open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setIsEditing(false);
          }} title={isEditing ? 'Chỉnh sửa Review' : 'Weekly Review'}>
            <ReviewForm />
          </AdaptiveModal>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekHabitsCompleted}</p>
                <p className="text-xs text-muted-foreground">Habits hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekTasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Tasks hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekPomodoros}</p>
                <p className="text-xs text-muted-foreground">Pomodoros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weeklyReviews.length}</p>
                <p className="text-xs text-muted-foreground">Tổng reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Main Content */}
        <div className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          !isMobile && isSidebarOpen && "lg:mr-0"
        )}>
          <Tabs defaultValue="review" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="review">📝 Review</TabsTrigger>
              <TabsTrigger value="stats">📊 Thống kê</TabsTrigger>
              <TabsTrigger value="prompts">💡 Gợi ý</TabsTrigger>
              <TabsTrigger value="history">📋 Lịch sử</TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-4">
              {/* Current Week Review */}
              {currentWeekReview ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Review tuần này</CardTitle>
                      <span className="text-2xl">{RATING_OPTIONS.find((r) => r.value === currentWeekReview.overallRating)?.label.split(' ')[0]}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Area Ratings */}
                    {currentWeekReview.areaRatings && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2"><PieChart className="w-4 h-4 text-primary" /> Điểm Life Areas</h4>
                          <Link to="/life-wheel" className="text-xs text-primary hover:underline">Xem Wheel →</Link>
                        </div>
                        <div className={cn(
                          "grid gap-2",
                          !isMobile && !isSidebarOpen && "grid-cols-5",
                          !isMobile && isSidebarOpen && "grid-cols-2 md:grid-cols-3",
                          isMobile && "grid-cols-2"
                        )}>
                          {LIFE_AREAS.map((area) => (
                            <div key={area.id} className="flex items-center gap-2 bg-secondary/30 rounded-lg px-2 py-1">
                              <span className="text-sm">{area.icon}</span>
                              <span className={cn(
                                "font-bold text-sm",
                                (currentWeekReview.areaRatings?.[area.id] || 5) <= 3 && "text-destructive",
                                (currentWeekReview.areaRatings?.[area.id] || 5) >= 4 && (currentWeekReview.areaRatings?.[area.id] || 5) <= 6 && "text-warning",
                                (currentWeekReview.areaRatings?.[area.id] || 5) >= 7 && "text-success"
                              )}>
                                {currentWeekReview.areaRatings?.[area.id] || 5}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Highlight & Lowlight */}
                    {(currentWeekReview.highlight || currentWeekReview.lowlight) && (
                      <div className="grid grid-cols-2 gap-4">
                        {currentWeekReview.highlight && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-warning" /> Highlight</h4>
                            <p className="text-sm text-muted-foreground">{currentWeekReview.highlight}</p>
                          </div>
                        )}
                        {currentWeekReview.lowlight && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /> Lowlight</h4>
                            <p className="text-sm text-muted-foreground">{currentWeekReview.lowlight}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Wins */}
                    {currentWeekReview.wins.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-warning" /> Chiến thắng</h4>
                        <ul className="space-y-1">
                          {currentWeekReview.wins.map((win, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-success">✓</span> {win}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Challenges */}
                    {currentWeekReview.challenges.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-destructive" /> Thách thức</h4>
                        <ul className="space-y-1">
                          {currentWeekReview.challenges.map((challenge, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {challenge}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Lessons */}
                    {currentWeekReview.lessonsLearned.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-info" /> Bài học</h4>
                        <ul className="space-y-1">
                          {currentWeekReview.lessonsLearned.map((lesson, i) => (
                            <li key={i} className="text-sm text-muted-foreground">💡 {lesson}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Gratitude */}
                    {currentWeekReview.gratitude && currentWeekReview.gratitude.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">🙏 Biết ơn</h4>
                        <ul className="space-y-1">
                          {currentWeekReview.gratitude.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground">❤️ {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Week */}
                    {currentWeekReview.nextWeekFocus.length > 0 && (
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-primary" /> Focus tuần tới</h4>
                        <ul className="space-y-1">
                          {currentWeekReview.nextWeekFocus.map((focus, i) => (
                            <li key={i} className="text-sm">🎯 {focus}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 md:p-12 text-center text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-lg">Chưa có review tuần này</p>
                    <p className="text-sm mt-1">Nhấn nút "Review" để bắt đầu!</p>
                  </CardContent>
                </Card>
              )}

              {/* Past Reviews */}
              {weeklyReviews.filter((r) => r.weekStart !== weekStartStr).length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-muted-foreground text-sm">Reviews trước</h2>
                  <div className={cn(
                    "grid gap-3",
                    !isMobile && !isSidebarOpen && "lg:grid-cols-2",
                    !isMobile && isSidebarOpen && "lg:grid-cols-1"
                  )}>
                    {weeklyReviews
                      .filter((r) => r.weekStart !== weekStartStr)
                      .slice(0, 4)
                      .map((review) => (
                        <Card key={review.id} className="cursor-pointer hover:bg-secondary/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Tuần {format(new Date(review.weekStart), 'dd/MM', { locale: vi })}</span>
                              <span className="text-xl">{RATING_OPTIONS.find((r) => r.value === review.overallRating)?.label.split(' ')[0]}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {review.wins.length} wins • {review.lessonsLearned.length} lessons
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <WeeklyReviewChart
                weekStart={weekStart}
                habits={habits}
                tasks={tasks}
                pomodoroSessions={pomodoroSessions}
              />
              <WeeklyReviewInsights
                weekDates={weekDates}
                habits={habits}
                tasks={tasks}
                pomodoroSessions={pomodoroSessions}
                goals={goals}
                journalEntries={journalEntries}
                previousReview={previousWeekReview}
              />
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <ReflectionPrompts onSelectPrompt={handleSelectPrompt} />
              
              {/* Quick Review Form */}
              <Button className="w-full" variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Viết Review với gợi ý
              </Button>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <WeeklyReviewHistory
                reviews={weeklyReviews}
                onDelete={handleDeleteReview}
                onClearAll={handleClearHistory}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (Desktop/Tablet) */}
        {!isMobile && (
          <div className={cn(
            "hidden lg:block transition-all duration-300 shrink-0",
            isSidebarOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden"
          )}>
            {isSidebarOpen && (
              <div className="space-y-4">
                {/* Quick Start Review */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Bắt đầu nhanh
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {!currentWeekReview && weekOffset === 0 && (
                      <Button 
                        className="w-full" 
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Viết Review tuần này
                      </Button>
                    )}
                    {currentWeekReview && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleEdit}
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Chỉnh sửa Review
                      </Button>
                    )}
                    <Link to="/life-wheel">
                      <Button variant="ghost" className="w-full justify-start">
                        <PieChart className="w-4 h-4 mr-2" /> Xem Wheel of Life
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Câu hỏi gợi ý */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      Câu hỏi suy ngẫm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {[
                      { icon: '🏆', text: 'Điều gì khiến bạn tự hào nhất tuần này?' },
                      { icon: '🎯', text: 'Mục tiêu nào bạn đã tiến gần hơn?' },
                      { icon: '💡', text: 'Bài học quan trọng nhất bạn học được?' },
                      { icon: '🔄', text: 'Điều gì bạn sẽ làm khác đi?' },
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!currentWeekReview) {
                            setNewReview(prev => ({
                              ...prev,
                              wins: prev.wins ? `${prev.wins}\n${prompt.text}` : prompt.text
                            }));
                            setIsDialogOpen(true);
                          }
                        }}
                        className="w-full text-left p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm flex items-start gap-2"
                      >
                        <span>{prompt.icon}</span>
                        <span className="text-muted-foreground">{prompt.text}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Streak & Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Thống kê Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-lg font-bold">{weeklyReviews.length}</p>
                          <p className="text-[10px] text-muted-foreground">Tổng reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10">
                        <TrendingUp className="w-4 h-4 text-yellow-500" />
                        <div>
                          <p className="text-lg font-bold">
                            {weeklyReviews.length > 0 
                              ? (weeklyReviews.reduce((sum, r) => sum + r.overallRating, 0) / weeklyReviews.length).toFixed(1)
                              : '0'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Điểm TB</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Previous Week Focus */}
                {previousWeekReview && previousWeekReview.nextWeekFocus.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Focus tuần trước
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1">
                        {previousWeekReview.nextWeekFocus.slice(0, 3).map((focus, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span>🎯</span> {focus}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sidebar Toggle Button (Desktop) */}
      </div>
    </div>
  );
}
