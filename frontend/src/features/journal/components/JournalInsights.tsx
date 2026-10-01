import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Empty, ProgressBar, SectionTitle, SegmentedTabs, Surface } from '@/components/lio';
import { JournalAnalyticsChart } from '@/components/journal/JournalAnalyticsChart';
import { JournalStreakCard } from '@/components/journal/JournalStreakCard';
import { LIFE_AREAS, type JournalEntry, type JournalTag } from '@/types/lifeos';
import { MOODS, moodOf } from '../utils/journal.utils';

const PERIODS = [{ id: '7', label: '7 ngày' }, { id: '30', label: '30 ngày' }, { id: '90', label: '90 ngày' }] as const;
type P = (typeof PERIODS)[number]['id'];

export function JournalInsights({ entries, tags }: { entries: JournalEntry[]; tags: JournalTag[] }) {
  const [p, setP] = useState<P>('30');
  const days = Number(p);
  const since = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const inRange = useMemo(() => entries.filter((e) => e.date >= since), [entries, since]);

  const series = useMemo(() => Array.from({ length: days }, (_, i) => {
    const d = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    const list = inRange.filter((e) => e.date === d);
    return { d, mood: list.length ? +(list.reduce((s, e) => s + e.mood, 0) / list.length).toFixed(1) : null, energy: list.length ? +(list.reduce((s, e) => s + e.energy, 0) / list.length).toFixed(1) : null };
  }), [inRange, days]);
  const avg = inRange.length ? inRange.reduce((s, e) => s + e.mood, 0) / inRange.length : 0;
  const dist = MOODS.map((m) => ({ ...m, n: inRange.filter((e) => e.mood === m.value).length })).reverse();
  const topTags = tags.map((t) => ({ t, n: inRange.filter((e) => e.tags?.includes(t.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
  const topAreas = LIFE_AREAS.map((a) => ({ a, n: inRange.filter((e) => e.areas?.includes(a.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-[16px] font-bold">Thống kê & Insights</h2>
        <SegmentedTabs items={PERIODS as unknown as { id: P; label: string }[]} value={p} onChange={setP} size="sm" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Surface className="p-5">
          <SectionTitle title="Tâm trạng theo thời gian" action={<span className="text-[13px] font-bold">{avg ? avg.toFixed(1) : '–'}<span className="text-muted-foreground font-medium"> / 5</span></span>} />
          <div className="h-[220px]">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: -24, right: 8, top: 8 }}>
                <defs><linearGradient id="jm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C6CF2" stopOpacity={0.3} /><stop offset="1" stopColor="#7C6CF2" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="d" tickFormatter={(d) => format(new Date(d), 'd/M')} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v) => moodOf(v)?.emoji ?? ''} tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number, n) => [v, n === 'mood' ? 'Tâm trạng' : 'Năng lượng']} labelFormatter={(d) => format(new Date(d), 'dd/MM/yyyy')} contentStyle={{ borderRadius: 14, fontSize: 12 }} />
                <Area type="monotone" dataKey="mood" stroke="#6C5CE7" strokeWidth={2.5} fill="url(#jm)" connectNulls dot={{ r: 2.5 }} />
                <Area type="monotone" dataKey="energy" stroke="#FFB020" strokeWidth={1.5} strokeDasharray="4 3" fill="none" connectNulls dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-[11.5px] text-muted-foreground mt-1"><span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#6C5CE7]" />Tâm trạng</span><span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#FFB020]" />Năng lượng</span></div>
        </Surface>
        <Surface className="p-5">
          <SectionTitle title="Cảm xúc phổ biến" hint={`${inRange.length} bài`} />
          <ul className="space-y-2.5">
            {dist.map((m) => (
              <li key={m.value} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="text-[17px]">{m.emoji}</span><span className="w-[78px] font-medium">{m.label}</span>
                <ProgressBar value={inRange.length ? (m.n / inRange.length) * 100 : 0} color={m.color} className="flex-1" height={7} />
                <span className="w-9 text-right tabular-nums text-muted-foreground">{inRange.length ? Math.round((m.n / inRange.length) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="p-5">
          <SectionTitle title="Chủ đề thường viết" />
          {topTags.length === 0 ? <Empty>Chưa có bài viết gắn thẻ trong kỳ.</Empty> : (
            <ul className="space-y-2">{topTags.map(({ t, n }) => (
              <li key={t.id} className="flex items-center justify-between rounded-2xl px-3 py-2" style={{ background: `hsl(${t.color} / 0.1)` }}>
                <span className="text-[13px] font-semibold" style={{ color: `hsl(${t.color})` }}>{t.name}</span><span className="text-[12.5px] font-bold tabular-nums">{n}</span>
              </li>))}
            </ul>
          )}
        </Surface>
        <Surface className="p-5">
          <SectionTitle title="Lĩnh vực được nhắc đến" />
          {topAreas.length === 0 ? <Empty>Chưa có bài viết gắn lĩnh vực trong kỳ.</Empty> : (
            <ul className="space-y-2.5">{topAreas.map(({ a, n }) => (
              <li key={a.id} className="flex items-center gap-2.5 text-[12.5px]">
                <span>{a.icon}</span><span className="w-[84px] font-medium truncate">{a.name}</span>
                <ProgressBar value={(n / topAreas[0].n) * 100} color={`hsl(var(--area-${a.id}))`} className="flex-1" height={7} />
                <span className="w-6 text-right tabular-nums text-muted-foreground">{n}</span>
              </li>))}
            </ul>
          )}
        </Surface>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <JournalAnalyticsChart entries={entries} />
        <JournalStreakCard entries={entries} />
      </div>
    </div>
  );
}
