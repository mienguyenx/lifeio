import { useNavigate } from 'react-router-dom';
import { Empty, InsightCard, MascotCard, ProgressBar, ProgressRing, SectionTitle, Surface } from '@/components/lio';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { WheelApi } from '../hooks/useLifeWheel';
import { LIFE_WHEEL_TIPS, areaColor, ranked, wheelInsights } from '../utils/wheel.utils';

export function WheelSidePanel({ api }: { api: WheelApi }) {
  const nav = useNavigate();
  const { latest, prev, avg, history } = api;
  const r = latest ? ranked(latest.scores) : [];
  const list = (items: typeof r, title: string) => (
    <Surface className="p-4">
      <SectionTitle title={title} />
      {items.length === 0 ? <Empty>Chưa có đánh giá.</Empty> : <ul className="space-y-3">{items.map((a) => (
        <li key={a.id}><div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold truncate pr-2">{a.icon} {a.name}</span><span className="text-muted-foreground tabular-nums">{a.score}/10</span></div><ProgressBar value={a.score * 10} color={areaColor(a.id)} /></li>
      ))}</ul>}
    </Surface>
  );
  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Mức cân bằng" hint={latest ? formatDistanceToNow(new Date(latest.date), { addSuffix: true, locale: vi }) : undefined} />
        <div className="flex items-center gap-4">
          <ProgressRing value={(avg ?? 0) * 10} size={92} stroke={10} label={avg === null ? '–' : avg.toFixed(1)} />
          <ul className="flex-1 min-w-0 space-y-1.5 text-[12.5px]">
            <li className="flex justify-between"><span className="text-muted-foreground">Số lần đánh giá</span><span className="font-semibold tabular-nums">{history.length}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Lĩnh vực ≥ 7</span><span className="font-semibold tabular-nums">{r.filter((a) => a.score >= 7).length}/10</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Lĩnh vực &lt; 5</span><span className="font-semibold tabular-nums">{r.filter((a) => a.score < 5).length}/10</span></li>
          </ul>
        </div>
      </Surface>
      {list(r.slice(-3).reverse(), 'Cần cải thiện')}
      {list(r.slice(0, 3), 'Điểm mạnh')}
      <InsightCard subtitle="Gợi ý từ bánh xe cuộc sống" items={wheelInsights(latest, prev)} onChat={() => nav('/ai-chat')} empty="Đánh giá lần đầu để nhận gợi ý." />
      <Surface className="p-4">
        <SectionTitle title="Mẹo cân bằng" />
        <ul className="space-y-2">{LIFE_WHEEL_TIPS.map((t) => <li key={t.text} className="flex gap-2 text-[12.5px]"><span>{t.icon}</span><span className="text-muted-foreground">{t.text}</span></li>)}</ul>
      </Surface>
      <MascotCard mascot="taro" pose="relax" quote="“Cân bằng không phải là hoàn hảo, mà là chăm sóc đủ mọi mặt.” 🌿" />
    </div>
  );
}
