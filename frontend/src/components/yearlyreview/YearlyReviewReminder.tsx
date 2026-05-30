import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Award, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function YearlyReviewReminder() {
  const yearlyReviews = useLifeOSStore((s) => s.yearlyReviews);
  const yearlyPlannings = useLifeOSStore((s) => s.yearlyPlannings);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentYearReview = yearlyReviews.find(r => r.year === currentYear);
  const currentYearPlan = yearlyPlannings.find(p => p.year === currentYear);
  const nextYearPlan = yearlyPlannings.find(p => p.year === currentYear + 1);

  // Show only in November/December
  if (currentMonth < 10) return null;

  // Both review and next year plan exist
  if (currentYearReview && nextYearPlan) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Yearly Review {currentYear} đã hoàn thành!</p>
            <p className="text-xs text-muted-foreground">
              Đánh giá: {currentYearReview.overallRating}/5 • Kế hoạch {currentYear + 1}: {nextYearPlan.theme}
            </p>
          </div>
          <Link to="/yearly-review">
            <Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Reminder to do yearly review
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Award className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Đến lúc nhìn lại năm {currentYear}!</p>
          <p className="text-xs text-muted-foreground">
            {!currentYearReview && 'Viết Yearly Review'}
            {!currentYearReview && !nextYearPlan && ' & '}
            {!nextYearPlan && `Lập kế hoạch ${currentYear + 1}`}
          </p>
        </div>
        <div className="flex gap-1">
          {!currentYearReview && (
            <Link to="/yearly-review">
              <Button variant="outline" size="sm" className="text-xs h-7 px-2">Review</Button>
            </Link>
          )}
          {!nextYearPlan && (
            <Link to="/yearly-planning">
              <Button variant="outline" size="sm" className="text-xs h-7 px-2">Plan</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
