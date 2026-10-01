import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { InsightCard, MascotCard, ProgressBar, ProgressRing, SectionTitle, Surface, Empty } from '@/components/lio';
import { cn } from '@/lib/utils';
import type { HealthApi } from '../hooks/useHealth';
import { HEALTH_TIPS, METRICS, QUICK_LOG_PRESETS, insights, pctOf, valueOn, dayKey } from '../utils/health.utils';

export function HealthSidePanel({ api, day }: { api: HealthApi; day: string }) {
  const nav = useNavigate();
  const { logs, healthGoals, healthHabits, score } = api;
  const targets = METRICS.filter((m) => m.target);
  const dayPct = Math.round(targets.reduce((a, m) => a + pctOf(m, valueOn(logs, m, day)), 0) / targets.length);
  const today = dayKey(new Date());
  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Điểm sức khỏe" hint={score === null ? 'Từ Life Wheel' : undefined} />
        <div className="flex items-center gap-4">
          <ProgressRing value={score ?? dayPct} size={92} stroke={10} />
          <div className="min-w-0 text-[12.5px] space-y-1">
            <p className="font-semibold">{score === null ? 'Hoàn thành mục tiêu ngày' : 'Theo Life Wheel gần nhất'}</p>
            <p className="text-muted-foreground">{score === null ? 'Hãy đánh giá Life Wheel để có điểm sức khỏe.' : `Hôm nay đạt ${dayPct}% mục tiêu.`}</p>
          </div>
        </div>
      </Surface>
      <InsightCard subtitle="Gợi ý từ 7 ngày gần nhất" items={insights(logs)} onChat={() => nav('/ai-chat')} />
      <Surface className="p-4">
        <SectionTitle title="Ghi nhanh" />
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LOG_PRESETS.map((p) => (
            <button key={p.label} onClick={() => api.add(p.type, p.value, today, undefined, p.label)} className="h-10 rounded-2xl bg-secondary/70 hover:bg-lavender text-[12.5px] font-semibold">
              {METRICS.find((m) => m.id === p.type)?.emoji} {p.label}
            </button>
          ))}
        </div>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Mục tiêu sức khỏe" action={<button onClick={() => nav('/goals')} className="text-[12px] font-semibold text-primary">Xem tất cả</button>} />
        {healthGoals.length === 0 ? <Empty>Chưa có mục tiêu sức khỏe.</Empty> : (
          <ul className="space-y-3">
            {healthGoals.slice(0, 4).map((g) => (
              <li key={g.id}>
                <div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold truncate pr-2">{g.title}</span><span className="text-muted-foreground tabular-nums">{g.progress ?? 0}%</span></div>
                <ProgressBar value={g.progress ?? 0} color="#22B07D" />
              </li>
            ))}
          </ul>
        )}
      </Surface>
      {healthHabits.length > 0 && (
        <Surface className="p-4">
          <SectionTitle title="Thói quen sức khỏe" action={<button onClick={() => nav('/habits')} className="text-[12px] font-semibold text-primary">Mở</button>} />
          <ul className="space-y-1.5">
            {healthHabits.slice(0, 5).map((h) => { const done = h.completedDates.includes(today); return (
              <li key={h.id} className="flex items-center gap-2 text-[13px]">
                {done ? <CheckCircle2 className="h-4 w-4 text-[#22B07D]" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={cn('truncate', done && 'line-through text-muted-foreground')}>{h.name}</span>
              </li>); })}
          </ul>
        </Surface>
      )}
      <Surface className="p-4">
        <SectionTitle title="Mẹo sức khỏe" />
        <ul className="space-y-2">{HEALTH_TIPS.map((t) => <li key={t.text} className="flex gap-2 text-[12.5px]"><span>{t.icon}</span><span className="text-muted-foreground">{t.text}</span></li>)}</ul>
      </Surface>
      <MascotCard mascot="taro" pose="care" quote="Chăm sóc bản thân mỗi ngày một chút — cơ thể sẽ cảm ơn bạn 🌿" />
    </div>
  );
}
