import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { Empty, ProgressBar, SectionTitle, SegmentedTabs, Surface } from '@/components/lio';
import { LifeWheelMiniChart } from '@/components/lifewheel/LifeWheelMiniChart';
import type { DayPoint, InsightsData, Metric } from '../hooks/useInsights';

const C = { tasks: '#6C5CE7', habits: '#22C38E', focus: '#FF9B63', mood: '#4D9DFF', journal: '#F2557A', goals: '#FFB020' };
const tip = { borderRadius: 14, fontSize: 12 };

/** Tiến độ tuần — mỗi chỉ số quy về % so với ngày cao nhất trong tuần (thói quen = % hoàn thành, tâm trạng = /5). */
export function WeeklyProgress({ week }: { week: DayPoint[] }) {
  const max = (k: 'tasks' | 'focus') => Math.max(1, ...week.map((p) => p[k]));
  const data = week.map((p) => ({
    day: format(parseISO(p.d), 'EEEEEE', { locale: vi }), raw: p,
    tasks: Math.round((p.tasks / max('tasks')) * 100), habits: p.habitsPct, focus: Math.round((p.focus / max('focus')) * 100), mood: p.mood ? Math.round((p.mood / 5) * 100) : 0,
  }));
  const label: Record<string, string> = { tasks: 'Công việc', habits: 'Thói quen', focus: 'Tập trung', mood: 'Tâm trạng' };
  return (
    <Surface className="p-5 flex flex-col h-full">
      <SectionTitle title="Tiến độ tuần" hint="7 ngày gần nhất" />
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ left: -22, right: 4, top: 6 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tip} formatter={(v: number, n: string, it: { payload: { raw: DayPoint } }) => {
              const r = it.payload.raw;
              const raw = n === 'tasks' ? `${r.tasks} việc` : n === 'habits' ? `${r.habits} thói quen (${r.habitsPct}%)` : n === 'focus' ? `${r.focus} phút` : r.mood ? `${r.mood}/5` : '–';
              return [raw, label[n]];
            }} />
            {(['tasks', 'habits', 'focus', 'mood'] as const).map((k) => <Bar key={k} dataKey={k} fill={C[k]} radius={[5, 5, 2, 2]} maxBarSize={10} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[11.5px] text-muted-foreground">{Object.keys(label).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: C[k as Metric] }} />{label[k]}</span>)}</div>
    </Surface>
  );
}

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: 'tasks', label: 'Việc', unit: 'việc' }, { id: 'habits', label: 'Thói quen', unit: 'lần' }, { id: 'focus', label: 'Focus', unit: 'phút' },
  { id: 'mood', label: 'Tâm trạng', unit: '/5' }, { id: 'journal', label: 'Nhật ký', unit: 'bài' }, { id: 'goals', label: 'Mục tiêu', unit: 'cập nhật' },
];
const PERIODS = [{ id: '7', label: '7 ngày' }, { id: '30', label: '30 ngày' }, { id: '90', label: '90 ngày' }];

export function TrendsCard({ days }: { days: DayPoint[] }) {
  const [m, setM] = useState<Metric>('tasks');
  const [p, setP] = useState('30');
  const meta = METRICS.find((x) => x.id === m)!;
  const data = useMemo(() => days.slice(-Number(p)).map((d) => ({ d: d.d, v: d[m] })), [days, p, m]);
  const vals = data.map((x) => x.v).filter((v): v is number => v !== null);
  const total = vals.reduce((a, b) => a + b, 0);
  const best = data.reduce<{ d: string; v: number } | null>((b, x) => (x.v !== null && (!b || x.v > b.v) ? { d: x.d, v: x.v } : b), null);
  const avg = m === 'mood' ? (vals.length ? total / vals.length : 0) : total / data.length;
  return (
    <Surface className="p-5 min-w-0">
      <SectionTitle title="Xu hướng" action={<SegmentedTabs size="sm" items={PERIODS} value={p} onChange={setP} />} />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-3"><SegmentedTabs size="sm" items={METRICS} value={m} onChange={setM} /></div>
      <div className="h-[210px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: -22, right: 8, top: 8 }}>
            <defs><linearGradient id="tr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C[m]} stopOpacity={0.3} /><stop offset="1" stopColor={C[m]} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="d" tickFormatter={(d) => format(parseISO(d), 'd/M')} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} domain={m === 'mood' ? [1, 5] : [0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tip} labelFormatter={(d) => format(parseISO(d), 'dd/MM/yyyy')} formatter={(v: number) => [`${v} ${meta.unit}`, meta.label]} />
            <Area type="monotone" dataKey="v" stroke={C[m]} strokeWidth={2.5} fill="url(#tr)" connectNulls dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60">
        <Stat label={m === 'mood' ? 'Trung bình' : 'TB mỗi ngày'} value={`${avg.toFixed(1)}`} unit={meta.unit} />
        <Stat label="Ngày tốt nhất" value={best ? `${best.v}` : '–'} unit={best ? meta.unit : ''} hint={best ? format(parseISO(best.d), 'dd/MM') : undefined} />
        <Stat label={m === 'mood' ? 'Số ngày ghi' : 'Tổng'} value={`${m === 'mood' ? vals.length : total}`} unit={m === 'mood' ? 'ngày' : meta.unit} />
      </div>
    </Surface>
  );
}
const Stat = ({ label, value, unit, hint }: { label: string; value: string; unit: string; hint?: string }) => (
  <div className="min-w-0"><p className="text-[11.5px] text-muted-foreground">{label}</p><p className="text-[20px] font-extrabold leading-tight tabular-nums">{value}<span className="text-[12px] font-medium text-muted-foreground ml-1">{unit}</span></p>{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>
);

export function LifeAreasCard({ data }: { data: InsightsData }) {
  const low = data.ranked[data.ranked.length - 1]; const top = data.ranked[0];
  return (
    <Surface className="p-5">
      <SectionTitle title="Lĩnh vực cuộc sống" hint={data.hasWheel && data.wheelDate ? `cập nhật ${format(parseISO(data.wheelDate), 'dd/MM')}` : undefined} action={<Link to="/life-wheel" className="text-[12px] font-semibold text-primary">{data.hasWheel ? 'Đánh giá lại' : 'Đánh giá ngay'}</Link>} />
      <div className="flex justify-center"><LifeWheelMiniChart scores={data.scores} size="md" /></div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
        {data.ranked.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-[12px] min-w-0">
            <span>{a.icon}</span><span className="truncate flex-1">{a.name}</span>
            <ProgressBar value={a.v * 10} color={`hsl(var(--area-${a.id}))`} className="w-10 shrink-0" height={5} />
            <span className="w-5 text-right font-bold tabular-nums">{a.v}</span>
          </li>
        ))}
      </ul>
      {data.hasWheel ? (
        <div className="mt-4 flex gap-2.5 rounded-2xl bg-[#FFF6D9] dark:bg-[#FFC63D]/10 p-3 text-[12.5px]">
          <Lightbulb className="h-4 w-4 text-[#E8961C] shrink-0 mt-0.5" />
          <p><b>{top.name}</b> đang là thế mạnh ({top.v}/10). Hãy dành thêm thời gian cho <b>{low.name}</b> ({low.v}/10) để cân bằng hơn.</p>
        </div>
      ) : <p className="mt-3 text-[12px] text-muted-foreground">Chưa có đánh giá Life Wheel — đang hiển thị điểm mặc định 5.</p>}
    </Surface>
  );
}

export function ProductiveHours({ hours }: { hours: InsightsData['hours'] }) {
  const data = hours.filter((h) => h.h >= 5 && h.h <= 23);
  const peak = data.reduce((b, x) => (x.min > b.min ? x : b), data[0]);
  const total = data.reduce((a, b) => a + b.min, 0);
  return (
    <Surface className="p-5">
      <SectionTitle title="Giờ tập trung hiệu quả" hint="30 ngày" action={total ? <span className="text-[12px] font-semibold text-primary">{peak.h}:00–{peak.h + 1}:00</span> : undefined} />
      {total === 0 ? <Empty>Chưa có phiên Focus nào trong 30 ngày qua — bắt đầu một phiên Pomodoro để xem thống kê.</Empty> : (
        <div className="h-[170px]">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -26, right: 4, top: 6 }}>
              <XAxis dataKey="h" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 10.5 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10.5 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tip} labelFormatter={(h) => `${h}:00 – ${Number(h) + 1}:00`} formatter={(v: number) => [`${v} phút`, 'Tập trung']} />
              <Bar dataKey="min" radius={[5, 5, 2, 2]} maxBarSize={14}>{data.map((d) => <Cell key={d.h} fill={d.h === peak.h ? '#6C5CE7' : '#C9C1FA'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Surface>
  );
}
