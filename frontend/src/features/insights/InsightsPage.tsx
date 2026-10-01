import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { HeroBanner, MascotCard, Page, PageHeader, StatTile } from '@/components/lio';
import DashboardAICoach from '@/components/dashboard/DashboardAICoach';
import DashboardRecentActivity from '@/components/dashboard/DashboardRecentActivity';
import DashboardUpcoming from '@/components/dashboard/DashboardUpcoming';
import DashboardGoalsProgress from '@/components/dashboard/DashboardGoalsProgress';
import WeeklyReviewReminder from '@/components/weeklyreview/WeeklyReviewReminder';
import MonthlyReviewReminder from '@/components/monthlyreview/MonthlyReviewReminder';
import YearlyReviewReminder from '@/components/yearlyreview/YearlyReviewReminder';
import { AIImprovementSuggestions } from '@/components/ai/AIImprovementSuggestions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInsights } from './hooks/useInsights';
import { LifeAreasCard, ProductiveHours, TrendsCard, WeeklyProgress } from './components/InsightCharts';

const Delta = ({ v }: { v: number }) => <span className={v >= 0 ? 'text-[#22B07D]' : 'text-destructive'}>{v >= 0 ? '↑' : '↓'} {Math.abs(v)}% vs tuần trước</span>;
const greet = () => { const h = new Date().getHours(); return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; };

export default function InsightsPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const data = useInsights();
  const { tiles } = data;
  const [coach, setCoach] = useState(false);

  return (
    <Page>
      <PageHeader title="Tổng quan" subtitle="Hiểu rõ bản thân, nhìn thấy tiến trình, sống tốt hơn mỗi ngày"
        actions={!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setCoach(true)}><Sparkles className="h-4 w-4 mr-1.5" />Phân tích AI</Button>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="explore" title={<>{greet()}{data.user.name ? `, ${data.user.name}` : ''}! 👋</>} subtitle="“Những nỗ lực nhỏ mỗi ngày tạo nên kết quả lớn.”"
            action={isMobile ? <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setCoach(true)}><Sparkles className="h-4 w-4 mr-1.5" />Phân tích AI</Button> : undefined} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon="module/tasks" tint="violet" value={<>{tiles.tasks.done}<span className="text-[14px] text-muted-foreground">/{tiles.tasks.total}</span></>} label="Việc hôm nay" hint={<Delta v={tiles.tasks.delta} />} onClick={() => navigate('/tasks')} />
            <StatTile icon="module/habits" tint="mint" value={<>{tiles.habits.done}<span className="text-[14px] text-muted-foreground">/{tiles.habits.total}</span></>} label="Thói quen hôm nay" hint={<Delta v={tiles.habits.delta} />} onClick={() => navigate('/habits')} />
            <StatTile icon="module/goals" tint="rose" value={<>{tiles.goals.done}<span className="text-[14px] text-muted-foreground">/{tiles.goals.total}</span></>} label="Mục tiêu đã đạt" hint={<span className="text-primary">{tiles.goals.active} đang làm · TB {tiles.goals.avg}%</span>} onClick={() => navigate('/goals')} />
            <StatTile icon="module/journal" tint="sky" value={tiles.journal.week} label="Nhật ký 7 ngày" hint={<Delta v={tiles.journal.delta} />} onClick={() => navigate('/journal')} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <WeeklyProgress week={data.week} />
            <TrendsCard days={data.days} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            <LifeAreasCard data={data} />
            <div className="space-y-4 min-w-0">
              <ProductiveHours hours={data.hours} />
              <div className="space-y-4 [&>*]:rounded-[22px]"><WeeklyReviewReminder /><MonthlyReviewReminder /><YearlyReviewReminder /></div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
            <DashboardGoalsProgress />
            <DashboardRecentActivity />
            <DashboardUpcoming />
          </div>
        </div>
        <aside className="space-y-4 min-w-0">
          <div className="[&>div]:rounded-[22px] [&>div]:shadow-soft [&>div]:border-border/60"><AIImprovementSuggestions /></div>
          <Button className="w-full h-11 rounded-full shadow-soft" onClick={() => navigate('/ai-chat')}><MessageCircle className="h-4 w-4 mr-1.5" />Chat với AI Coach</Button>
          <MascotCard mascot="ori" pose="idea" title="Mẹo nhỏ" quote="“Dữ liệu giúp bạn thấy tiến bộ. Insight giúp bạn tạo ra tương lai tốt hơn.”" />
        </aside>
      </div>
      <AdaptiveModal open={coach} onOpenChange={setCoach} title="AI Coach — Phân tích" className="sm:max-w-[560px] rounded-[28px] max-h-[90vh] overflow-y-auto">
        <div className="min-w-0"><DashboardAICoach onClose={() => setCoach(false)} /></div>
      </AdaptiveModal>
    </Page>
  );
}
