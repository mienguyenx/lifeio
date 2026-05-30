import { format, startOfMonth, endOfMonth, isLastDayOfMonth, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarDays, CheckCircle2, ArrowRight, Target, Flame, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function MonthlyReviewReminder() {
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const tasks = useLifeOSStore((s) => s.tasks);
  const habits = useLifeOSStore((s) => s.habits);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthStr = format(monthStart, 'yyyy-MM');
  const daysLeft = differenceInDays(monthEnd, now);
  const isEndOfMonth = daysLeft <= 3;
  const isLastDay = isLastDayOfMonth(now);

  const currentMonthReview = monthlyReviews.find((r) => r.month === monthStr);
  const hasReview = !!currentMonthReview;

  // Quick stats for current month
  const monthDates: string[] = [];
  for (let d = new Date(monthStart); d <= now; d.setDate(d.getDate() + 1)) {
    monthDates.push(format(d, 'yyyy-MM-dd'));
  }

  const tasksCompleted = tasks.filter((t) => t.completedAt && monthDates.some((d) => t.completedAt?.startsWith(d))).length;
  const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
  let totalPossible = 0;
  let totalCompleted = 0;
  activeHabits.forEach((habit) => {
    totalPossible += monthDates.length;
    totalCompleted += habit.completedDates.filter((d) => monthDates.includes(d)).length;
  });
  const habitRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  const pomodoroCount = pomodoroSessions.filter((s) => s.phase === 'work' && monthDates.some((d) => s.completedAt.startsWith(d))).length;

  if (hasReview) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Monthly Review {format(monthStart, 'MM/yyyy')} đã hoàn thành!</p>
            <p className="text-xs text-muted-foreground">Đánh giá: {currentMonthReview?.overallRating}/5</p>
          </div>
          <Link to="/monthly-review">
            <Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!isEndOfMonth) return null;

  return (
    <Card className={cn("border-primary/30", isLastDay && "border-primary bg-primary/5")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Monthly Review
          </CardTitle>
          <Badge variant={isLastDay ? 'default' : 'secondary'} className="text-xs">
            {isLastDay ? 'Hôm nay!' : `Còn ${daysLeft} ngày`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground">
          Tổng kết tháng {format(monthStart, 'MMMM', { locale: vi })} để nhìn lại và lên kế hoạch
        </p>

        {/* Quick Stats Preview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-secondary/50">
            <Target className="w-3 h-3 text-green-500" />
            <span className="text-xs font-medium">{tasksCompleted} tasks</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-secondary/50">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium">{habitRate}% habits</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-secondary/50">
            <Timer className="w-3 h-3 text-red-500" />
            <span className="text-xs font-medium">{pomodoroCount} pomo</span>
          </div>
        </div>

        <Link to="/monthly-review" className="block">
          <Button size="sm" className="w-full gap-2">
            <CalendarDays className="w-3.5 h-3.5" /> Viết Monthly Review
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
