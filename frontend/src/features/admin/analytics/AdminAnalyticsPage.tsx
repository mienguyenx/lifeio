// Module 25 — Admin: Phân tích & Báo cáo (LIO kit)
// Số liệu lấy từ useExtendedAdminStats/useDashboardStats/useAllProfiles có sẵn (bản cũ: /admin/analytics/classic)
import { useMemo, useState } from 'react';
import { BookOpen, Calendar, CheckSquare, FileText, Flag, Gauge, Languages, Notebook, Puzzle, Repeat, Target, Timer, TrendingUp, UserPlus, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroBanner, MascotCard, Page, PageHeader, ProgressBar, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut, TrendArea } from '@/components/lio/charts';
import { useAllProfiles, useDashboardStats, useExtendedAdminStats } from '@/hooks/useAdminData';
import { useIsMobile } from '@/hooks/use-mobile';
import { CountBars, GridHead, GridRow, InfoRow, MiniStat, asProfiles, monthlyCounts } from '../shared';

type View = 'overview' | 'content' | 'engagement';
const COLS = 'minmax(0,1.4fr) 100px minmax(0,1.4fr) 110px';
const fix1 = (a: number, b: number) => (b ? (a / b).toFixed(1) : '0');

export default function AdminAnalyticsPage() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<View>('overview');
  const [months, setMonths] = useState<6 | 12>(6);
  const { data: stats, isLoading } = useExtendedAdminStats();
  const { data: dash } = useDashboardStats();
  const { data: profilesRaw } = useAllProfiles();
  const profiles = useMemo(() => asProfiles(profilesRaw), [profilesRaw]);

  const users = stats?.totalUsers ?? 0;
  const content = [
    { id: 'goals', label: 'Mục tiêu', value: stats?.totalGoals ?? 0, icon: Target, color: '#7C5CFC' },
    { id: 'habits', label: 'Thói quen', value: stats?.totalHabits ?? 0, icon: Repeat, color: '#22B07D' },
    { id: 'tasks', label: 'Công việc', value: stats?.totalTasks ?? 0, icon: CheckSquare, color: '#2F7BF6' },
    { id: 'journal', label: 'Nhật ký', value: stats?.totalJournalEntries ?? 0, icon: FileText, color: '#F0587A' },
    { id: 'notes', label: 'Ghi chú', value: stats?.totalNotes ?? 0, icon: Notebook, color: '#14B8A6' },
    { id: 'reviews', label: 'Review tuần', value: stats?.totalWeeklyReviews ?? 0, icon: Calendar, color: '#F5A524' },
  ];
  const totalContent = (stats?.totalGoals ?? 0) + (stats?.totalHabits ?? 0) + (stats?.totalTasks ?? 0);
  const dataPoints = totalContent + (stats?.totalJournalEntries ?? 0) + (stats?.totalNotes ?? 0);
  const allItems = content.reduce((a, c) => a + c.value, 0);
  const growth = useMemo(() => monthlyCounts(profiles.map((p) => p.created_at), months), [profiles, months]);
  const donut = content.filter((c) => c.value > 0).map((c) => ({ id: c.id, name: c.label, value: c.value, color: c.color }));

  const rate = (label: string, v: number, hint: string, color: string) => (
    <div><div className="flex items-center justify-between text-[12.5px] mb-1"><span className="font-semibold">{label}</span><span className="tabular-nums font-bold">{v}%</span></div><ProgressBar value={v} color={color} height={8} /><p className="text-[11px] text-muted-foreground mt-1">{hint}</p></div>
  );
  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Phân bổ nội dung" hint={`${allItems.toLocaleString()} mục`} />
        {donut.length ? <Donut size={130} data={donut} center={<span><span className="block text-[11px] text-muted-foreground">mục</span><span className="block text-[18px] font-extrabold">{allItems.toLocaleString()}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</p>}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Sức khỏe nền tảng" />
        <InfoRow icon={<Users className="h-4 w-4" />} label="Người dùng đăng ký" value={users.toLocaleString()} />
        <InfoRow icon={<Notebook className="h-4 w-4" />} label="Ghi chú đã tạo" value={(stats?.totalNotes ?? 0).toLocaleString()} />
        <InfoRow icon={<Gauge className="h-4 w-4" />} label="Điểm dữ liệu" value={dataPoints.toLocaleString()} />
        <InfoRow icon={<Puzzle className="h-4 w-4" />} label="Plugin đang bật" value={dash?.system.activePlugins ?? 0} />
        <InfoRow icon={<Flag className="h-4 w-4" />} label="Feature flag bật" value={dash?.system.activeFeatureFlags ?? 0} />
        <InfoRow icon={<Languages className="h-4 w-4" />} label="Ngôn ngữ đang bật" value={dash?.system.activeLanguages ?? 0} />
      </Surface>
      <MascotCard mascot="taro" pose="go" title="Đọc số liệu" quote={`Trung bình mỗi người dùng có ${fix1(totalContent, users)} mục tiêu, thói quen & công việc.`} />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Phân tích & Báo cáo" subtitle="Thống kê sử dụng toàn nền tảng" />
      <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'content', label: 'Nội dung' }, { id: 'engagement', label: 'Tương tác' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="taro" pose="go" title="Bức tranh LifeOS" subtitle={isLoading ? 'Đang tải số liệu...' : `${users.toLocaleString()} người dùng · ${dataPoints.toLocaleString()} điểm dữ liệu · ${fix1(totalContent, users)} mục/người.`} />
          {isLoading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[74px] rounded-[20px]" />)}</div> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile icon={<Users className="h-5 w-5" />} tint="violet" value={users.toLocaleString()} label="Người dùng" hint={`+${dash?.users.newThisMonth ?? 0} / 30 ngày`} />
              <StatTile icon={<UserPlus className="h-5 w-5" />} tint="mint" value={dash?.users.newThisWeek ?? 0} label="Mới tuần này" hint="7 ngày qua" />
              <StatTile icon={<Target className="h-5 w-5" />} tint="amber" value={`${dash?.goals.completionRate ?? 0}%`} label="Mục tiêu xong" hint={`${dash?.goals.completed ?? 0}/${dash?.goals.total ?? 0}`} />
              <StatTile icon={<CheckSquare className="h-5 w-5" />} tint="sky" value={`${dash?.tasks.completionRate ?? 0}%`} label="Việc đã xong" hint={`${dash?.tasks.completed ?? 0}/${dash?.tasks.total ?? 0}`} />
            </div>
          )}

          {view === 'overview' && (<>
            <Surface className="p-4">
              <div className="flex items-center gap-2 mb-1"><SectionTitle title="Người dùng mới theo tháng" hint={`${months} tháng gần nhất`} className="mb-0" /><SegmentedTabs size="sm" className="ml-auto" items={[{ id: '6', label: '6T' }, { id: '12', label: '12T' }]} value={String(months) as '6' | '12'} onChange={(v) => setMonths(Number(v) as 6 | 12)} /></div>
              <TrendArea id="admin-analytics-growth" data={growth} name="Người dùng mới" height={220} color="#7C5CFC" />
            </Surface>
            <Surface className="p-4">
              <SectionTitle title="Nội dung người dùng tạo" hint="số bản ghi" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {content.map((c) => { const I = c.icon; return (
                  <div key={c.id} className="flex items-center gap-2.5 rounded-2xl bg-secondary/40 p-3 min-w-0">
                    <span className="h-9 w-9 rounded-xl grid place-items-center text-white shrink-0" style={{ background: c.color }}><I className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0"><span className="block text-[18px] font-bold leading-none tabular-nums">{c.value.toLocaleString()}</span><span className="block text-[11.5px] text-muted-foreground mt-0.5 truncate">{c.label}</span></span>
                  </div>
                ); })}
              </div>
            </Surface>
          </>)}

          {view === 'content' && (
            <Surface className="p-3 sm:p-4">
              <div className="px-1"><SectionTitle title="Chi tiết theo loại nội dung" hint={`${allItems.toLocaleString()} mục`} /></div>
              {isMobile ? (
                <div className="space-y-3 px-1">{content.map((c) => (
                  <div key={c.id}><div className="flex items-center justify-between text-[13px] mb-1"><span className="font-semibold">{c.label}</span><span className="tabular-nums">{c.value.toLocaleString()} · {fix1(c.value, users)}/người</span></div><ProgressBar value={allItems ? (c.value / allItems) * 100 : 0} color={c.color} /></div>
                ))}</div>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <GridHead cols={COLS}><span>Loại</span><span>Số lượng</span><span>Tỉ trọng</span><span>TB / người</span></GridHead>
                  {content.map((c) => { const I = c.icon; const pct = allItems ? Math.round((c.value / allItems) * 100) : 0; return (
                    <GridRow key={c.id} cols={COLS}>
                      <span className="flex items-center gap-2.5 min-w-0"><span className="h-8 w-8 rounded-xl grid place-items-center text-white shrink-0" style={{ background: c.color }}><I className="h-4 w-4" /></span><span className="text-[13px] font-semibold truncate">{c.label}</span></span>
                      <span className="text-[13px] font-bold tabular-nums">{c.value.toLocaleString()}</span>
                      <span className="flex items-center gap-2"><ProgressBar value={pct} color={c.color} className="flex-1" /><span className="text-[12px] tabular-nums w-9 text-right">{pct}%</span></span>
                      <span className="text-[13px] tabular-nums">{fix1(c.value, users)}</span>
                    </GridRow>
                  ); })}
                </div>
              )}
            </Surface>
          )}

          {view === 'engagement' && (<>
            <Surface className="p-4">
              <SectionTitle title="Trung bình mỗi người dùng" />
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Mục tiêu" value={fix1(stats?.totalGoals ?? 0, users)} />
                <MiniStat label="Thói quen" value={fix1(stats?.totalHabits ?? 0, users)} />
                <MiniStat label="Công việc" value={fix1(stats?.totalTasks ?? 0, users)} />
                <MiniStat label="Nhật ký" value={fix1(stats?.totalJournalEntries ?? 0, users)} />
                <MiniStat label="Ghi chú" value={fix1(stats?.totalNotes ?? 0, users)} />
                <MiniStat label="Pomodoro" value={fix1(dash?.content.pomodoroSessions ?? 0, users)} />
              </div>
            </Surface>
            <Surface className="p-4">
              <SectionTitle title="Tỉ lệ hoàn thành" />
              <div className="space-y-4">
                {rate('Mục tiêu đã hoàn thành', dash?.goals.completionRate ?? 0, `${dash?.goals.completed ?? 0} / ${dash?.goals.total ?? 0} mục tiêu`, '#7C5CFC')}
                {rate('Công việc đã xong', dash?.tasks.completionRate ?? 0, `${dash?.tasks.completed ?? 0} / ${dash?.tasks.total ?? 0} công việc`, '#2F7BF6')}
              </div>
            </Surface>
            <Surface className="p-4">
              <SectionTitle title="Hoạt động tập trung & phản tư" />
              <CountBars items={[
                { label: <span className="inline-flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" />Phiên Pomodoro</span>, value: dash?.content.pomodoroSessions ?? 0, color: '#FF7A45' },
                { label: <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Bài nhật ký</span>, value: stats?.totalJournalEntries ?? 0, color: '#F0587A' },
                { label: <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Review tuần</span>, value: stats?.totalWeeklyReviews ?? 0, color: '#F5A524' },
                { label: <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Người mới 30 ngày</span>, value: dash?.users.newThisMonth ?? 0, color: '#22B07D' },
              ]} />
            </Surface>
          </>)}
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
    </Page>
  );
}
