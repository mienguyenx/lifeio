import { useState, useMemo } from 'react';
import { format, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Award, Trophy, Target, CheckCircle2, Flame,
  BookOpen, Timer, Star, AlertTriangle, Lightbulb, Heart, Plus, Edit2,
  Trash2, TrendingUp, Mail, BarChart3, GraduationCap,
} from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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

export default function YearlyReviewPage() {
  const yearlyReviews = useLifeOSStore((s) => s.yearlyReviews);
  const addYearlyReview = useLifeOSStore((s) => s.addYearlyReview);
  const updateYearlyReview = useLifeOSStore((s) => s.updateYearlyReview);
  const deleteYearlyReview = useLifeOSStore((s) => s.deleteYearlyReview);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);

  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currentReview = yearlyReviews.find((r) => r.year === selectedYear);

  const [formData, setFormData] = useState({
    overallRating: 3 as 1 | 2 | 3 | 4 | 5,
    topAchievements: '', biggestChallenges: '', lessonsLearned: '', gratitude: '',
    letterToFutureSelf: '', wordOfTheYear: '',
    areaRatings: { ...DEFAULT_AREA_RATINGS } as Record<LifeArea, number>,
  });

  // Calculate year stats
  const yearStats = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const effectiveEnd = new Date() < yearEnd ? new Date() : yearEnd;
    const yearDays = eachDayOfInterval({ start: yearStart, end: effectiveEnd });
    const yearDates = yearDays.map((d) => format(d, 'yyyy-MM-dd'));

    const totalTasksCompleted = tasks.filter((t) => t.completedAt && yearDates.some((d) => t.completedAt?.startsWith(d))).length;
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    let totalPossible = 0;
    let totalCompleted = 0;
    activeHabits.forEach((habit) => { totalPossible += yearDays.length; totalCompleted += habit.completedDates.filter((d) => yearDates.includes(d)).length; });
    const avgHabitCompletionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    const goalsCompleted = goals.filter((g) => g.completedAt && yearDates.some((d) => g.completedAt?.startsWith(d))).length;
    const goalsCreated = goals.filter((g) => yearDates.some((d) => g.createdAt.startsWith(d))).length;
    const journalCount = journalEntries.filter((j) => yearDates.some((d) => j.date.startsWith(d))).length;

    const yearPomodoros = pomodoroSessions.filter((s) => s.phase === 'work' && yearDates.some((d) => s.completedAt.startsWith(d)));
    const totalPomodoroMinutes = yearPomodoros.length * (pomodoroSettings.workDuration || 25);

    return { totalTasksCompleted, totalHabitsTracked: activeHabits.length, avgHabitCompletionRate, goalsCompleted, goalsCreated, journalEntries: journalCount, totalPomodoroMinutes, pomodoroCount: yearPomodoros.length };
  }, [tasks, habits, goals, journalEntries, pomodoroSessions, pomodoroSettings, selectedYear]);

  const handleOpenForm = (editing: boolean) => {
    if (editing && currentReview) {
      setFormData({
        overallRating: currentReview.overallRating,
        topAchievements: currentReview.topAchievements.join('\n'), biggestChallenges: currentReview.biggestChallenges.join('\n'),
        lessonsLearned: currentReview.lessonsLearned.join('\n'), gratitude: currentReview.gratitude.join('\n'),
        letterToFutureSelf: currentReview.letterToFutureSelf || '', wordOfTheYear: currentReview.wordOfTheYear || '',
        areaRatings: currentReview.areaRatings || { ...DEFAULT_AREA_RATINGS },
      });
      setIsEditing(true);
    } else {
      setFormData({ overallRating: 3, topAchievements: '', biggestChallenges: '', lessonsLearned: '', gratitude: '', letterToFutureSelf: '', wordOfTheYear: '', areaRatings: { ...DEFAULT_AREA_RATINGS } });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      year: selectedYear, overallRating: formData.overallRating,
      topAchievements: formData.topAchievements.split('\n').filter(Boolean), biggestChallenges: formData.biggestChallenges.split('\n').filter(Boolean),
      lessonsLearned: formData.lessonsLearned.split('\n').filter(Boolean), gratitude: formData.gratitude.split('\n').filter(Boolean),
      letterToFutureSelf: formData.letterToFutureSelf, wordOfTheYear: formData.wordOfTheYear,
      areaRatings: formData.areaRatings,
      stats: { ...yearStats, booksRead: 0, coursesCompleted: 0 },
    };
    if (isEditing && currentReview) { updateYearlyReview(currentReview.id, data); toast.success('Đã cập nhật Yearly Review!'); }
    else { addYearlyReview(data); toast.success('Đã lưu Yearly Review!'); }
    setIsDialogOpen(false);
  };

  const handleDelete = () => { if (currentReview) { deleteYearlyReview(currentReview.id); toast.success('Đã xóa Yearly Review'); setDeleteDialogOpen(false); } };
  const ratingLabel = RATING_OPTIONS.find((r) => r.value === (currentReview?.overallRating || 0));

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            Yearly Review
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Nhìn lại một năm đã qua</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedYear((v) => v - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="text-center min-w-[80px]"><p className="text-xl font-bold">{selectedYear}</p></div>
          <Button variant="outline" size="icon" onClick={() => setSelectedYear((v) => v + 1)} disabled={selectedYear >= currentYear}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Year Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 md:p-4">
          <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
          <p className="text-2xl font-bold">{yearStats.totalTasksCompleted}</p><p className="text-xs text-muted-foreground">Tasks hoàn thành</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <Flame className="w-4 h-4 text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{yearStats.avgHabitCompletionRate}%</p><p className="text-xs text-muted-foreground">Habit TB</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <Trophy className="w-4 h-4 text-yellow-500 mb-1" />
          <p className="text-2xl font-bold">{yearStats.goalsCompleted}/{yearStats.goalsCreated}</p><p className="text-xs text-muted-foreground">Goals xong/tạo</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <Timer className="w-4 h-4 text-red-500 mb-1" />
          <p className="text-2xl font-bold">{formatHours(yearStats.totalPomodoroMinutes)}</p><p className="text-xs text-muted-foreground">Focus ({yearStats.pomodoroCount} Pomo)</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-lg font-bold">{yearStats.journalEntries}</p><p className="text-xs text-muted-foreground">Journal entries</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-purple-500" /></div>
          <div><p className="text-lg font-bold">{yearStats.totalHabitsTracked}</p><p className="text-xs text-muted-foreground">Habits tracked</p></div>
        </CardContent></Card>
      </div>

      {/* Review Content */}
      {currentReview ? (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Tổng kết năm {selectedYear}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenForm(true)}><Edit2 className="w-3 h-3 mr-1" /> Sửa</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="w-3 h-3 mr-1" /> Xóa</Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{ratingLabel?.label.split(' ')[0]}</span>
                <div>
                  <p className={cn("text-2xl font-bold", ratingLabel?.color)}>{ratingLabel?.label.split(' ').slice(1).join(' ')}</p>
                  {currentReview.wordOfTheYear && <Badge variant="secondary" className="mt-1 text-sm">💬 Từ khóa: {currentReview.wordOfTheYear}</Badge>}
                </div>
              </div>

              {currentReview.areaRatings && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                  {LIFE_AREAS.map((area) => {
                    const rating = currentReview.areaRatings?.[area.id] || 5;
                    return (
                      <div key={area.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                        <span className="text-sm">{area.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{area.name}</p>
                          <div className="flex items-center gap-1">
                            <Progress value={rating * 10} className="h-1.5 flex-1" /><span className="text-xs font-bold">{rating}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {currentReview.topAchievements.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Thành tựu nổi bật ({currentReview.topAchievements.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1.5">{currentReview.topAchievements.map((a, i) => <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />{a}</li>)}</ul></CardContent></Card>}
            {currentReview.biggestChallenges.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Thách thức lớn ({currentReview.biggestChallenges.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1.5">{currentReview.biggestChallenges.map((c, i) => <li key={i} className="text-sm flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />{c}</li>)}</ul></CardContent></Card>}
            {currentReview.lessonsLearned.length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> Bài học ({currentReview.lessonsLearned.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1.5">{currentReview.lessonsLearned.map((l, i) => <li key={i} className="text-sm flex items-start gap-2"><Lightbulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />{l}</li>)}</ul></CardContent></Card>}
            {currentReview.gratitude.length > 0 && <Card className="border-pink-500/20"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> Biết ơn ({currentReview.gratitude.length})</CardTitle></CardHeader><CardContent className="pt-0"><ul className="space-y-1.5">{currentReview.gratitude.map((g, i) => <li key={i} className="text-sm flex items-start gap-2"><Heart className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />{g}</li>)}</ul></CardContent></Card>}
          </div>

          {currentReview.letterToFutureSelf && (
            <Card className="border-primary/30 bg-primary/5"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Thư gửi tương lai</CardTitle></CardHeader>
              <CardContent className="pt-0"><p className="text-sm whitespace-pre-wrap italic">{currentReview.letterToFutureSelf}</p></CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="p-12 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Chưa có review cho năm {selectedYear}</h3>
          <p className="text-sm text-muted-foreground mb-4">Nhìn lại một năm đã qua để rút ra bài học và định hướng cho năm mới</p>
          <Button onClick={() => handleOpenForm(false)}><Plus className="w-4 h-4 mr-2" /> Viết Yearly Review</Button>
        </CardContent></Card>
      )}

      {yearlyReviews.length > 0 && (
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lịch sử</CardTitle></CardHeader><CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {yearlyReviews.sort((a, b) => b.year - a.year).map((r) => {
              const rating = RATING_OPTIONS.find((o) => o.value === r.overallRating);
              return <Button key={r.id} variant={r.year === selectedYear ? 'default' : 'outline'} size="sm" className="gap-1" onClick={() => setSelectedYear(r.year)}><span>{rating?.label.split(' ')[0]}</span> {r.year}</Button>;
            })}
          </div>
        </CardContent></Card>
      )}

      {/* Form Dialog */}
      <AdaptiveModal open={isDialogOpen} onOpenChange={setIsDialogOpen} title={isEditing ? 'Chỉnh sửa Yearly Review' : 'Viết Yearly Review'}>
        <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label className="font-medium">Đánh giá tổng quan năm {selectedYear}</Label>
            <div className="flex gap-2 flex-wrap">
              {RATING_OPTIONS.map((o) => <Button key={o.value} type="button" variant={formData.overallRating === o.value ? 'default' : 'outline'} size="sm" onClick={() => setFormData({ ...formData, overallRating: o.value as 1 | 2 | 3 | 4 | 5 })}>{o.label}</Button>)}
            </div>
          </div>
          <div className="space-y-1"><Label>💬 Từ khóa của năm</Label><Input placeholder="VD: Kiên trì, Đột phá, Trưởng thành..." value={formData.wordOfTheYear} onChange={(e) => setFormData({ ...formData, wordOfTheYear: e.target.value })} /></div>
          <Separator />
          <div className="space-y-3">
            <Label className="font-medium">Đánh giá theo lĩnh vực (1-10)</Label>
            {LIFE_AREAS.map((area) => (
              <div key={area.id} className="flex items-center gap-3">
                <span className="w-6 text-center">{area.icon}</span><span className="text-sm w-20 truncate">{area.name}</span>
                <Slider min={1} max={10} step={1} value={[formData.areaRatings[area.id]]} onValueChange={([v]) => setFormData({ ...formData, areaRatings: { ...formData.areaRatings, [area.id]: v } })} className="flex-1" />
                <span className="text-sm font-bold w-6 text-right">{formData.areaRatings[area.id]}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1"><Label>🏆 Thành tựu nổi bật (mỗi dòng 1 mục)</Label><Textarea placeholder="Thăng chức, hoàn thành dự án lớn..." value={formData.topAchievements} onChange={(e) => setFormData({ ...formData, topAchievements: e.target.value })} rows={4} /></div>
          <div className="space-y-1"><Label>⚡ Thách thức lớn</Label><Textarea placeholder="Khó khăn đã vượt qua..." value={formData.biggestChallenges} onChange={(e) => setFormData({ ...formData, biggestChallenges: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>💡 Bài học</Label><Textarea placeholder="Những điều đã học được..." value={formData.lessonsLearned} onChange={(e) => setFormData({ ...formData, lessonsLearned: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>💝 Biết ơn</Label><Textarea placeholder="Những điều biết ơn..." value={formData.gratitude} onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })} rows={3} /></div>
          <div className="space-y-1"><Label>📩 Thư gửi tương lai</Label><Textarea placeholder="Gửi cho bản thân năm sau..." value={formData.letterToFutureSelf} onChange={(e) => setFormData({ ...formData, letterToFutureSelf: e.target.value })} rows={4} /></div>
          <Button className="w-full" onClick={handleSave}>{isEditing ? 'Cập nhật' : 'Lưu Yearly Review'}</Button>
        </div>
      </AdaptiveModal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa review năm {selectedYear}?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
