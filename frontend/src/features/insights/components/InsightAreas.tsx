import { useNavigate } from 'react-router-dom';
import { AreaTile, Empty, ProgressBar, SectionTitle, Surface, TINTS } from '@/components/lio';
import { cn } from '@/lib/utils';
import type { InsightsData } from '../hooks/useInsights';

/** Thẻ điểm từng lĩnh vực (Life Wheel gần nhất, so với lần chấm trước). */
export function AreaScoreGrid({ data }: { data: InsightsData }) {
  const nav = useNavigate();
  if (!data.hasWheel) return <Surface className="p-5"><Empty>Chấm điểm Bánh xe cuộc sống để xem điểm từng lĩnh vực.</Empty></Surface>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-3">
      {data.ranked.map((a) => (
        <button key={a.id} onClick={() => nav('/life-wheel')} className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card">
          <AreaTile area={a.id} size={38} />
          <p className="mt-2.5 text-[13px] font-semibold truncate">{a.name}</p>
          <p className="text-[12px] text-muted-foreground"><b className="text-foreground text-[15px]">{a.v * 10}</b>/100
            {a.delta !== 0 && <span className={cn('ml-1.5 font-semibold', a.delta > 0 ? 'text-[#22B07D]' : 'text-destructive')}>{a.delta > 0 ? '↑' : '↓'} {Math.abs(a.delta)}</span>}</p>
          <ProgressBar value={a.v * 10} color={`hsl(var(--area-${a.id}))`} height={5} className="mt-2" />
        </button>
      ))}
    </div>
  );
}

/** Cơ hội cải thiện: 3 lĩnh vực thấp nhất + chỉ số tuần giảm — chỉ dựa trên dữ liệu useInsights. */
export function ImproveList({ data }: { data: InsightsData }) {
  const nav = useNavigate();
  const low = data.hasWheel ? [...data.ranked].reverse().slice(0, 3) : [];
  const t = data.tiles;
  const drops = [
    t.tasks.delta < 0 && { icon: '✅', tint: 'violet' as const, title: 'Công việc hoàn thành giảm', desc: `${t.tasks.delta}% so với tuần trước`, to: '/tasks' },
    t.habits.delta < 0 && { icon: '🌱', tint: 'mint' as const, title: 'Thói quen giảm', desc: `${t.habits.delta}% so với tuần trước`, to: '/habits' },
    t.journal.delta < 0 && { icon: '✍️', tint: 'sky' as const, title: 'Viết nhật ký ít hơn', desc: `${t.journal.delta}% so với tuần trước`, to: '/journal' },
    t.goals.active > 0 && t.goals.avg < 50 && { icon: '🎯', tint: 'rose' as const, title: 'Mục tiêu tiến chậm', desc: `Tiến độ TB ${t.goals.avg}%`, to: '/goals' },
  ].filter(Boolean) as { icon: string; tint: 'violet' | 'mint' | 'sky' | 'rose'; title: string; desc: string; to: string }[];
  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Surface className="p-5">
        <SectionTitle title="Lĩnh vực cần quan tâm" hint="Điểm thấp nhất" />
        {low.length === 0 ? <Empty>Chấm điểm Bánh xe cuộc sống để thấy lĩnh vực cần cải thiện.</Empty> : (
          <ul className="space-y-2">{low.map((a) => (
            <li key={a.id}><button onClick={() => nav('/life-wheel')} className="w-full flex items-center gap-3 rounded-2xl bg-secondary/50 hover:bg-secondary px-3 py-2.5 text-left">
              <AreaTile area={a.id} size={36} />
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{a.name}</span><span className="block text-[11.5px] text-muted-foreground">{a.v}/10{a.delta ? ` · ${a.delta > 0 ? '+' : ''}${a.delta} so với lần trước` : ''}</span></span>
              <ProgressBar value={a.v * 10} color={`hsl(var(--area-${a.id}))`} height={5} className="w-20" />
            </button></li>))}
          </ul>
        )}
      </Surface>
      <Surface className="p-5">
        <SectionTitle title="Chỉ số cần chú ý" hint="Tuần này" />
        {drops.length === 0 ? <Empty>Mọi chỉ số đều ổn định hoặc tăng — tuyệt vời! 🎉</Empty> : (
          <ul className="space-y-2">{drops.map((d) => (
            <li key={d.title}><button onClick={() => nav(d.to)} className="w-full flex items-center gap-3 rounded-2xl bg-secondary/50 hover:bg-secondary px-3 py-2.5 text-left">
              <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center text-[17px]', TINTS[d.tint].bg)}>{d.icon}</span>
              <span className="min-w-0"><span className="block text-[13px] font-semibold">{d.title}</span><span className="block text-[11.5px] text-muted-foreground">{d.desc}</span></span>
            </button></li>))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
