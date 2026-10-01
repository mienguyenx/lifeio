import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { HeroBanner, MascotCard, Page, PageHeader, ProgressRing, SegmentedTabs, StatTile } from '@/components/lio';
import { AreaScoreGrid, ImproveList } from './components/InsightAreas';
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
  const [tab, setTab] = useState<'overview' | 'trends' | 'areas' | 'improve'>('overview');
  const overall = data.hasWheel ? Math.round((data.ranked.reduce((a, x) => a + x.v, 0) / data.ranked.length) * 10) : null;

  const side = (
    <div className="space-y-4 min-w-0">
      <div className="[&>div]:rounded-[22px] [&>div]:shadow-soft [&>div]:border-border/60"><AIImprovementSuggestions /></div>
      <Button className="w-full h-11 rounded-full shadow-soft" onClick={() => navigate('/ai-chat')}><MessageCircle className="h-4 w-4 mr-1.5" />Chat với AI Coach</Button>
      <MascotCard mascot="ori" pose="idea" title="Mẹo nhỏ" quote="“Dữ liệu giúp bạn thấy tiến bộ. Insight giúp bạn tạo ra tương lai tốt hơn.”" />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Tổng quan" subtitle="Hiểu rõ bản thân, nhìn thấy tiến trình, sống tốt hơn mỗi ngày"
        actions={!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setCoach(true)}><Sparkles className="h-4 w-4 mr-1.5" />Phân tích AI</Button>} />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs value={tab} onChange={setTab} items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'trends', label: 'Xu hướng' }, { id: 'areas', label: 'Lĩnh vực' }, { id: 'improve', label: 'Cải thiện' }]} />
      </div>
      {tab === 'overview' && (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="explore" title={<>{greet()}{data.user.name ? `, ${data.user.name}` : ''}! 👋</>} subtitle="“Những nỗ lực nhỏ mỗi ngày tạo nên kết quả lớn.”"
            action={isMobile ? <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setCoach(true)}><Sparkles className="h-4 w-4 mr-1.5" />Phân tích AI</Button> : undefined}
            aside={overall !== null ? <button onClick={() => setTab('areas')} className="hidden sm:flex absolute z-10 right-[180px] top-1/2 -translate-y-1/2 flex-col items-center gap-1"><ProgressRing value={overall} size={96} stroke={10} label={<span className="text-center leading-none">{overall}<span className="block text-[10px] font-medium text-muted-foreground mt-0.5">/100</span></span>} /><span className="text-[11.5px] font-semibold text-muted-foreground">Điểm tổng thể</span></button> : undefined} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon="module/tasks" tint="violet" value={<>{tiles.tasks.done}<span className="text-[14px] text-muted-foreground">/{tiles.tasks.total}</span></>} label="Việc hôm nay" hint={<Delta v={tiles.tasks.delta} />} onClick={() => navigate('/tasks')} />
            <StatTile icon="module/habits" tint="mint" value={<>{tiles.habits.done}<span className="text-[14px] text-muted-foreground">/{tiles.habits.total}</span></>} label="Thói quen hôm nay" hint={<Delta v={tiles.habits.delta} />} onClick={() => navigate('/habits')} />
            <StatTile icon="module/goals" tint="rose" value={<>{tiles.goals.done}<span className="text-[14px] text-muted-foreground">/{tiles.goals.total}</span></>} label="Mục tiêu đã đạt" hint={<span className="text-primary">{tiles.goals.active} đang làm · TB {tiles.goals.avg}%</span>} onClick={() => navigate('/goals')} />
            <StatTile icon="module/journal" tint="sky" value={tiles.journal.week} label="Nhật ký 7 ngày" hint={<Delta v={tiles.journal.delta} />} onClick={() => navigate('/journal')} />
          </div>
          <WeeklyProgress week={data.week} />
          <div className="space-y-4 [&>*]:rounded-[22px]"><WeeklyReviewReminder /><MonthlyReviewReminder /><YearlyReviewReminder /></div>
          <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
            <DashboardGoalsProgress />
            <DashboardRecentActivity />
            <DashboardUpcoming />
          </div>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      )}
      {tab === 'trends' && (
        <div className="space-y-4">
          <TrendsCard days={data.days} />
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            <WeeklyProgress week={data.week} />
            <ProductiveHours hours={data.hours} />
          </div>
        </div>
      )}
      {tab === 'areas' && (
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] items-start">
          <LifeAreasCard data={data} />
          <AreaScoreGrid data={data} />
        </div>
      )}
      {tab === 'improve' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="space-y-4 min-w-0"><ImproveList data={data} /></div>
          <div className="[&>div]:rounded-[22px] [&>div]:shadow-soft [&>div]:border-border/60 min-w-0"><AIImprovementSuggestions /></div>
        </div>
      )}
      <AdaptiveModal open={coach} onOpenChange={setCoach} title="AI Coach — Phân tích" className="sm:max-w-[560px] rounded-[28px] max-h-[90vh] overflow-y-auto">
        <div className="min-w-0"><DashboardAICoach onClose={() => setCoach(false)} /></div>
      </AdaptiveModal>
    </Page>
  );
}
