import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { AreaTile, HeroBanner, MascotCard, Page, PageHeader, ProgressBar, ProgressRing, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { getTodayDateString } from '@/utils/dateUtils';

type View = 'all' | 'priority' | 'attention';
const scoreColor = (s: number) => (s >= 7 ? 'text-[#1F9D63]' : s >= 4 ? 'text-[#D9822B]' : 'text-[#E0445E]');

export default function AreaDashboardPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);
  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);
  const [view, setView] = useState<View>('all');
  const todayStr = getTodayDateString();

  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]); }
    return days;
  }, []);

  const areaStats = useMemo(() => LIFE_AREAS.map((area) => {
    const areaHabits = habits.filter((h) => h.area === area.id && !h.archivedAt && !h.deletedAt);
    const areaTasks = tasks.filter((t) => t.area === area.id && !t.archived && !t.deletedAt);
    const areaGoals = goals.filter((g) => g.area === area.id && !g.deletedAt && !g.completedAt);
    const habitCompletions = areaHabits.reduce((sum, h) => sum + h.completedDates.filter((d) => last7Days.includes(d)).length, 0);
    const habitExpected = areaHabits.reduce((sum, h) => sum + (h.frequency === 'daily' ? 7 : h.customDays?.length || 0), 0);
    const habitRate = habitExpected > 0 ? Math.round((habitCompletions / habitExpected) * 100) : -1;
    const completedTasks = areaTasks.filter((t) => t.status === 'done');
    const pendingTasks = areaTasks.filter((t) => t.status !== 'done');
    const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
    const avgGoalProgress = areaGoals.length > 0 ? Math.round(areaGoals.reduce((s, g) => s + g.progress, 0) / areaGoals.length) : -1;
    const latestScore = lifeWheelScores[lifeWheelScores.length - 1];
    const prevScore = lifeWheelScores[lifeWheelScores.length - 2];
    const currentScore = latestScore?.scores[area.id] ?? -1;
    const previousScore = prevScore?.scores[area.id] ?? -1;
    const trend = currentScore >= 0 && previousScore >= 0 ? currentScore - previousScore : 0;
    const bestStreak = areaHabits.reduce((max, h) => Math.max(max, h.streak), 0);
    return { area, habitCount: areaHabits.length, habitRate, taskTotal: areaTasks.length, taskCompleted: completedTasks.length, taskPending: pendingTasks.length, overdueCount: overdueTasks.length, goalCount: areaGoals.length, avgGoalProgress, wheelScore: currentScore, trend, bestStreak };
  }), [habits, tasks, goals, lifeWheelScores, last7Days, todayStr]);

  const priorities = userPreferences?.lifeAreaPriorities || [];
  const sortedStats = [...areaStats].sort((a, b) => {
    const aIdx = priorities.indexOf(a.area.id); const bIdx = priorities.indexOf(b.area.id);
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;
    return (b.wheelScore || 0) - (a.wheelScore || 0);
  });
  const needsAttention = (s: (typeof areaStats)[number]) => (s.wheelScore >= 0 && s.wheelScore < 5) || s.overdueCount > 0 || (s.habitRate >= 0 && s.habitRate < 40);
  const shown = view === 'priority' ? sortedStats.filter((s) => priorities.includes(s.area.id)) : view === 'attention' ? sortedStats.filter(needsAttention) : sortedStats;
  const selected = selectedArea ? areaStats.find((s) => s.area.id === selectedArea) : null;

  const scored = areaStats.filter((s) => s.wheelScore >= 0);
  const avgScore = scored.length ? scored.reduce((s, x) => s + x.wheelScore, 0) / scored.length : -1;
  const totalHabitsRate = (() => { const r = areaStats.filter((s) => s.habitRate >= 0); return r.length ? Math.round(r.reduce((s, x) => s + x.habitRate, 0) / r.length) : -1; })();
  const pendingTotal = areaStats.reduce((s, x) => s + x.taskPending, 0);
  const overdueTotal = areaStats.reduce((s, x) => s + x.overdueCount, 0);
  const goalTotal = areaStats.reduce((s, x) => s + x.goalCount, 0);
  const ranked = [...scored].sort((a, b) => b.wheelScore - a.wheelScore);

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Mạnh nhất & cần cải thiện" />
        {ranked.length === 0 ? (
          <div className="text-[12.5px] text-muted-foreground space-y-3">
            <p>Chấm điểm Bánh xe cuộc sống để thấy lĩnh vực mạnh/yếu.</p>
            <Button size="sm" className="rounded-full" onClick={() => navigate('/life-wheel')}>Chấm điểm ngay</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...ranked.slice(0, 3), ...(ranked.length > 3 ? ranked.slice(-2).reverse() : [])].map((s, i) => (
              <button key={s.area.id} onClick={() => setSelectedArea(s.area.id)} className="w-full flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-secondary/60 text-left">
                <AreaTile area={s.area.id} size={34} />
                <span className="flex-1 text-[13px] font-semibold">{s.area.name}</span>
                <span className={cn('text-[14px] font-extrabold', scoreColor(s.wheelScore))}>{s.wheelScore}</span>
                <span className="text-[10.5px] text-muted-foreground w-12 text-right">{i < 3 ? 'Mạnh' : 'Cải thiện'}</span>
              </button>
            ))}
          </div>
        )}
      </Surface>
      <MascotCard mascot="taro" pose="care" title="Cân bằng là chìa khóa" quote="Chăm một chút cho lĩnh vực yếu nhất mỗi tuần sẽ tạo khác biệt lớn." />
    </div>
  );

  const detail = selected && (
    <Surface className="p-4 sm:p-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <AreaTile area={selected.area.id} size={48} />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-extrabold">{selected.area.name}</p>
          <p className="text-[12px] text-muted-foreground">{priorities.includes(selected.area.id) ? 'Lĩnh vực ưu tiên · ' : ''}Tổng quan 7 ngày gần nhất</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Đóng" onClick={() => setSelectedArea(null)}><X className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl bg-secondary/50 p-3">
          <p className="text-[11.5px] font-semibold text-muted-foreground">Thói quen</p>
          <p className="text-[20px] font-extrabold">{selected.habitCount}</p>
          {selected.habitRate >= 0 && <><ProgressBar value={selected.habitRate} className="mt-1" /><p className="text-[11px] text-muted-foreground mt-1">{selected.habitRate}% tuần này</p></>}
          {selected.bestStreak > 0 && <p className="text-[11px] text-[#F08A24] font-semibold">🔥 Chuỗi tốt nhất {selected.bestStreak} ngày</p>}
        </div>
        <div className="rounded-2xl bg-secondary/50 p-3">
          <p className="text-[11.5px] font-semibold text-muted-foreground">Công việc</p>
          <p className="text-[20px] font-extrabold">{selected.taskCompleted}<span className="text-[13px] text-muted-foreground">/{selected.taskTotal}</span></p>
          <p className="text-[11px] text-muted-foreground">{selected.taskPending} đang chờ</p>
          {selected.overdueCount > 0 && <p className="text-[11px] text-destructive font-semibold">{selected.overdueCount} quá hạn</p>}
        </div>
        <div className="rounded-2xl bg-secondary/50 p-3">
          <p className="text-[11.5px] font-semibold text-muted-foreground">Mục tiêu</p>
          <p className="text-[20px] font-extrabold">{selected.goalCount}</p>
          {selected.avgGoalProgress >= 0 && <><ProgressBar value={selected.avgGoalProgress} color="#22C08A" className="mt-1" /><p className="text-[11px] text-muted-foreground mt-1">TB {selected.avgGoalProgress}%</p></>}
        </div>
        <div className="rounded-2xl bg-secondary/50 p-3">
          <p className="text-[11.5px] font-semibold text-muted-foreground">Bánh xe</p>
          {selected.wheelScore >= 0 ? <>
            <p className={cn('text-[20px] font-extrabold', scoreColor(selected.wheelScore))}>{selected.wheelScore}/10</p>
            {selected.trend !== 0 && <p className={cn('text-[11px] font-semibold', selected.trend > 0 ? 'text-[#1F9D63]' : 'text-[#E0445E]')}>{selected.trend > 0 ? '+' : ''}{selected.trend} so với lần trước</p>}
          </> : <p className="text-[13px] text-muted-foreground mt-1">Chưa chấm</p>}
        </div>
      </div>
      <AreaDashboardSection area={selected.area.id} />
    </Surface>
  );

  return (
    <Page>
      <PageHeader title="10 lĩnh vực cuộc sống" subtitle="Tổng quan từng mảng cuộc sống của bạn 🌈"
        actions={!isMobile && <Button variant="outline" className="h-10 rounded-full px-5" onClick={() => navigate('/life-wheel')}>Bánh xe cuộc sống</Button>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: areaStats.length }, { id: 'priority', label: 'Ưu tiên', count: priorities.length }, { id: 'attention', label: 'Cần chú ý', count: areaStats.filter(needsAttention).length }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="taro" pose="relax" title="Cuộc sống cân bằng hơn mỗi ngày" subtitle={avgScore >= 0 ? `Điểm cân bằng trung bình ${avgScore.toFixed(1)}/10 trên ${scored.length} lĩnh vực.` : 'Chấm điểm Bánh xe cuộc sống để theo dõi sự cân bằng.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => navigate('/life-wheel')}>{avgScore >= 0 ? 'Cập nhật điểm' : 'Chấm điểm ngay'}</Button>}
            aside={avgScore >= 0 && <div className="hidden sm:flex absolute z-10 right-[180px] top-1/2 -translate-y-1/2"><ProgressRing value={avgScore * 10} size={84} label={<span className="text-[16px] font-extrabold">{avgScore.toFixed(1)}</span>} /></div>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon="module/life-areas" tint="violet" value={avgScore >= 0 ? avgScore.toFixed(1) : '—'} label="Điểm cân bằng" hint="trung bình /10" onClick={() => navigate('/life-wheel')} />
            <StatTile icon="module/habits" tint="orange" value={totalHabitsRate >= 0 ? `${totalHabitsRate}%` : '—'} label="Thói quen" hint="tỉ lệ 7 ngày" onClick={() => navigate('/habits')} />
            <StatTile icon="module/tasks" tint="sky" value={pendingTotal} label="Việc đang chờ" hint={overdueTotal ? `${overdueTotal} quá hạn` : 'không quá hạn'} onClick={() => navigate('/tasks')} />
            <StatTile icon="module/goals" tint="mint" value={goalTotal} label="Mục tiêu" hint="đang thực hiện" onClick={() => navigate('/goals')} />
          </div>

          {detail}

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Các lĩnh vực" hint={`${shown.length} lĩnh vực`} /></div>
            {shown.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground px-1 py-4">{view === 'priority' ? 'Bạn chưa chọn lĩnh vực ưu tiên — có thể đặt trong Cá nhân hóa.' : 'Không có lĩnh vực nào cần chú ý. Tuyệt vời! 🎉'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shown.map((s) => {
                  const isPriority = priorities.includes(s.area.id);
                  const active = selectedArea === s.area.id;
                  return (
                    <button key={s.area.id} onClick={() => setSelectedArea(active ? null : s.area.id)}
                      className={cn('flex items-center gap-3 rounded-[18px] border p-3 text-left transition-all', active ? 'border-primary ring-4 ring-primary/10' : 'border-border/60 hover:border-primary/40')}>
                      <AreaTile area={s.area.id} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[14px] font-bold truncate">{s.area.name}</p>
                          {isPriority && <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">Ưu tiên</span>}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground truncate">
                          {[s.habitCount && `${s.habitCount} thói quen${s.habitRate >= 0 ? ` (${s.habitRate}%)` : ''}`, s.taskPending && `${s.taskPending} việc`, s.goalCount && `${s.goalCount} mục tiêu`].filter(Boolean).join(' · ') || 'Chưa có dữ liệu'}
                        </p>
                        <ProgressBar value={s.wheelScore >= 0 ? s.wheelScore * 10 : 0} color={`hsl(var(--area-${s.area.id}))`} className="mt-1.5" />
                      </div>
                      <div className="text-right shrink-0 w-12">
                        {s.wheelScore >= 0 ? <p className={cn('text-[18px] font-extrabold leading-none', scoreColor(s.wheelScore))}>{s.wheelScore}<span className="text-[10px] text-muted-foreground font-medium">/10</span></p> : <p className="text-[11px] text-muted-foreground">—</p>}
                        {s.trend !== 0 && (s.trend > 0 ? <TrendingUp className="h-3.5 w-3.5 text-[#1F9D63] ml-auto mt-1" /> : <TrendingDown className="h-3.5 w-3.5 text-[#E0445E] ml-auto mt-1" />)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Surface>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
    </Page>
  );
}
