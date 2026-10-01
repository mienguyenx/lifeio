import { useMemo, useState } from 'react';
import { Mascot } from '@/components/brand/Mascot';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types/lifeos';
import { countOn, dayNum, isDoneOn, lastNDays, rateIn } from '../utils/habit.utils';
import { HabitIcon } from './HabitCard';

const PERIODS = [{ d: 7, l: '7 ngày' }, { d: 30, l: '30 ngày' }, { d: 90, l: '3 tháng' }];

/** Thống kê từ dữ liệu completions/completedDates hiện có. */
export function HabitInsightsChart({ habits, today, onOpen }: { habits: Habit[]; today: string; onOpen: (h: Habit) => void }) {
  const [period, setPeriod] = useState(30);
  const days = useMemo(() => lastNDays(period, today), [period, today]);
  const data = useMemo(() => {
    const daily = days.map((d) => ({ d, pct: habits.length ? Math.round((habits.filter((h) => isDoneOn(h, d)).length / habits.length) * 100) : 0 }));
    const avg = daily.length ? Math.round(daily.reduce((s, x) => s + x.pct, 0) / daily.length) : 0;
    const prevDays = lastNDays(period, days[0]).slice(0, -1);
    const prevAvg = habits.length && prevDays.length ? Math.round(habits.reduce((s, h) => s + rateIn(h, prevDays), 0) / habits.length) : 0;
    const total = habits.reduce((s, h) => s + days.reduce((a, d) => a + countOn(h, d), 0), 0);
    const activeCount = habits.filter((h) => days.some((d) => countOn(h, d) > 0)).length;
    const best = habits.reduce((m, h) => Math.max(m, h.bestStreak || h.streak), 0);
    const top = [...habits].map((h) => ({ h, r: rateIn(h, days) })).sort((a, b) => b.r - a.r);
    return { daily, avg, delta: avg - prevAvg, total, activeCount, best, top };
  }, [habits, days, period]);

  const tiles = [
    { v: `${data.avg}%`, l: 'Tỷ lệ hoàn thành', s: data.delta !== 0 ? `${data.delta > 0 ? '+' : ''}${data.delta}% so với kỳ trước` : undefined, c: 'text-[#22B07D]' },
    { v: data.activeCount, l: `Thói quen hoạt động / ${habits.length}` },
    { v: data.best, l: 'Streak tốt nhất' },
    { v: data.total, l: 'Lượt hoàn thành' },
  ];
  const labelEvery = period === 7 ? 1 : period === 30 ? 7 : 15;

  return (
    <div className="space-y-4">
      <div className="inline-flex p-1 rounded-full bg-secondary/80">
        {PERIODS.map((p) => (
          <button key={p.d} onClick={() => setPeriod(p.d)} className={cn('h-8 px-4 rounded-full text-[12.5px] font-semibold transition-all', period === p.d ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground')}>{p.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4">
            <p className="text-[24px] font-bold leading-none tabular-nums">{t.v}</p>
            <p className="text-[12px] text-muted-foreground mt-1.5">{t.l}</p>
            {t.s && <p className={cn('text-[11.5px] font-semibold mt-1', t.c)}>{t.s}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-[24px] bg-card border border-border/60 shadow-soft p-5">
        <p className="text-[15px] font-bold mb-4">Tỷ lệ hoàn thành theo ngày</p>
        <div className="flex gap-3 h-48">
          <div className="flex flex-col justify-between text-[10.5px] text-muted-foreground pb-5">{['100%', '75%', '50%', '25%', '0%'].map((x) => <span key={x}>{x}</span>)}</div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-end gap-[3px] border-b border-border/60">
              {data.daily.map((x) => (
                <div key={x.d} title={`${x.d}: ${x.pct}%`} className="flex-1 rounded-t-full bg-gradient-to-t from-[#6D5DF2] to-[#9C8FFF] min-h-[3px] transition-all duration-500 hover:opacity-80" style={{ height: `${Math.max(2, x.pct)}%` }} />
              ))}
            </div>
            <div className="flex gap-[3px] h-5 pt-1">
              {data.daily.map((x, i) => <span key={x.d} className="flex-1 text-center text-[10px] text-muted-foreground">{(data.daily.length - 1 - i) % labelEvery === 0 ? `${dayNum(x.d)}/${Number(x.d.slice(5, 7))}` : ''}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="rounded-[24px] bg-card border border-border/60 shadow-soft p-5">
          <p className="text-[15px] font-bold mb-3">Top thói quen</p>
          <div className="space-y-3">
            {data.top.slice(0, 6).map(({ h, r }) => (
              <button key={h.id} onClick={() => onOpen(h)} className="w-full flex items-center gap-3 text-left">
                <HabitIcon habit={h} size={36} className="rounded-[12px]" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[13.5px]"><span className="font-semibold truncate">{h.name}</span><span className="font-bold tabular-nums">{r}%</span></div>
                  <div className="mt-1.5 h-[6px] rounded-full bg-[#EEF0F5] dark:bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#57D3AE] to-[#5B9CF6]" style={{ width: `${r}%` }} /></div>
                </div>
              </button>
            ))}
            {data.top.length === 0 && <p className="text-[13px] text-muted-foreground">Chưa có dữ liệu.</p>}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-lavender to-[#EAF8F2] dark:from-primary/15 dark:to-[#57D3AE]/10 p-5 pr-28 flex items-center">
          <div>
            <p className="text-[15px] font-bold text-primary">{data.avg >= 70 ? 'Bạn đang làm rất tốt!' : 'Mỗi ngày một chút!'}</p>
            <p className="text-[12.5px] text-muted-foreground mt-1">Hãy tiếp tục duy trì những thói quen tuyệt vời này nhé 💜</p>
          </div>
          <Mascot name="taro" pose="relax" size={110} className="absolute -right-1 -bottom-2" />
        </div>
      </div>
    </div>
  );
}
