import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SegmentedTabs, SectionTitle, StatTile, Surface } from '@/components/lio';
import { GoalAnalyticsCard } from '@/components/goals/GoalAnalyticsCard';
import { GoalPerformanceComparison } from '@/components/goals/GoalPerformanceComparison';
import { GoalStreaksCard } from '@/components/goals/GoalStreaksCard';
import { GoalNotificationsCard } from '@/components/goals/GoalNotificationsCard';
import { LIFE_AREAS, type Goal } from '@/types/lifeos';
import type { GoalsApi } from '../hooks/useGoals';

const PERIODS = [{ id: '30', label: '30 ngày' }, { id: '90', label: '90 ngày' }, { id: '365', label: '1 năm' }] as const;
type P = (typeof PERIODS)[number]['id'];

/** Tiến độ TB theo thời gian, tính từ progressHistory có sẵn. */
function progressSeries(goals: Goal[], days: number) {
  const step = days > 90 ? 7 : days > 30 ? 3 : 1;
  const out: { d: string; v: number }[] = [];
  for (let i = days - 1; i >= 0; i -= step) {
    const day = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const live = goals.filter((g) => g.createdAt.slice(0, 10) <= day);
    if (!live.length) { out.push({ d: day, v: 0 }); continue; }
    const vals = live.map((g) => {
      const h = (g.progressHistory || []).filter((e) => e.date.slice(0, 10) <= day);
      if (h.length) return h[h.length - 1].progress;
      return g.completedAt && g.completedAt.slice(0, 10) <= day ? 100 : day >= format(new Date(), 'yyyy-MM-dd') ? g.progress : 0;
    });
    out.push({ d: day, v: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) });
  }
  return out;
}

export function GoalInsights({ api }: { api: GoalsApi }) {
  const [p, setP] = useState<P>('30');
  const { goals, stats } = api;
  const series = useMemo(() => progressSeries(goals, Number(p)), [goals, p]);
  const delta = series.length > 1 ? series[series.length - 1].v - series[0].v : 0;
  const dist = useMemo(() => LIFE_AREAS.map((a) => ({ id: a.id, name: a.name, value: goals.filter((g) => g.area === a.id).length })).filter((x) => x.value), [goals]);
  const msRate = stats.milestones ? Math.round((stats.milestonesDone / stats.milestones) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-[16px] font-bold">Thống kê mục tiêu</h2>
        <SegmentedTabs items={PERIODS as unknown as { id: P; label: string }[]} value={p} onChange={setP} size="sm" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon="module/goals" tint="violet" value={stats.active} label="Đang tiến triển" />
        <StatTile icon="status/success" tint="mint" value={`${msRate}%`} label="Tỷ lệ hoàn thành mốc" />
        <StatTile icon="module/tasks" tint="orange" value={stats.linkedTasksDone} label="Nhiệm vụ liên kết đã xong" />
        <StatTile icon="module/insights" tint="amber" value={`${stats.avgProgress}%`} label="Tiến độ trung bình" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Surface className="p-5">
          <SectionTitle title="Tiến độ theo thời gian" action={<span className={delta >= 0 ? 'text-[12px] font-bold text-[#22B07D]' : 'text-[12px] font-bold text-destructive'}>{delta >= 0 ? '+' : ''}{delta}% trong kỳ</span>} />
          <div className="h-[230px]">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
                <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C6CF2" stopOpacity={0.35} /><stop offset="1" stopColor="#7C6CF2" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="d" tickFormatter={(d) => format(new Date(d), 'd/M')} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Tiến độ TB']} labelFormatter={(d) => format(new Date(d), 'dd/MM/yyyy')} contentStyle={{ borderRadius: 14, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#6C5CE7" strokeWidth={2.5} fill="url(#gp)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>
        <Surface className="p-5">
          <SectionTitle title="Phân bổ theo lĩnh vực" />
          {dist.length === 0 ? <p className="text-[13px] text-muted-foreground">Chưa có mục tiêu.</p> : (
            <div className="flex items-center gap-4">
              <div className="relative h-[170px] w-[170px] shrink-0">
                <ResponsiveContainer>
                  <PieChart><Pie data={dist} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">{dist.map((d) => <Cell key={d.id} fill={`hsl(var(--area-${d.id}))`} />)}</Pie></PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-[22px] font-extrabold leading-none">{goals.length}</p><p className="text-[11px] text-muted-foreground">Mục tiêu</p></div></div>
              </div>
              <ul className="flex-1 space-y-1.5 min-w-0">
                {dist.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: `hsl(var(--area-${d.id}))` }} />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-muted-foreground tabular-nums">{Math.round((d.value / goals.length) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Surface>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 [&_.rounded-lg]:rounded-[22px]">
        <GoalAnalyticsCard goals={goals} />
        <GoalPerformanceComparison goals={goals} />
        <GoalStreaksCard goals={goals} />
        <GoalNotificationsCard goals={goals} />
      </div>
    </div>
  );
}
