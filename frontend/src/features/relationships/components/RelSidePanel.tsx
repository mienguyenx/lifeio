import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { Empty, InsightCard, MascotCard, ProgressBar, ProgressRing, SectionTitle, Surface } from '@/components/lio';
import type { Contact } from '@/hooks/sync/useRelationshipsSync';
import type { RelApi } from '../hooks/useRelationships';
import { RELATIONSHIP_TIPS, RELATIONSHIP_TYPES, relInsights } from '../utils/relationships.utils';
import { Avatar } from './parts';

export function RelSidePanel({ api, onOpen }: { api: RelApi; onOpen: (c: Contact) => void }) {
  const nav = useNavigate();
  const { contacts, score, birthdays, relGoals } = api;
  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Điểm quan hệ" hint={score === null ? 'Từ Life Wheel' : undefined} />
        <div className="flex items-center gap-4">
          <ProgressRing value={(score ?? 0) * 10} size={92} stroke={10} label={score === null ? '–' : `${score}/10`} />
          <ul className="flex-1 min-w-0 space-y-1.5 text-[12.5px]">
            {RELATIONSHIP_TYPES.map((r) => <li key={r.id} className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.name}</span><span className="font-semibold tabular-nums">{contacts.filter((c) => c.relationship === r.id).length}</span></li>)}
          </ul>
        </div>
      </Surface>
      <InsightCard subtitle="Gợi ý từ dữ liệu liên hệ" items={relInsights(contacts, api.interactions)} onChat={() => nav('/ai-chat')} empty="Thêm liên hệ để nhận gợi ý." />
      <Surface className="p-4">
        <SectionTitle title="Sinh nhật sắp tới" hint="30 ngày tới" />
        {birthdays.length === 0 ? <Empty>Không có sinh nhật nào trong 30 ngày tới.</Empty> : (
          <ul className="space-y-1">{birthdays.slice(0, 5).map(({ c, b }) => (
            <li key={c.id}><button onClick={() => onOpen(c)} className="w-full flex items-center gap-3 rounded-2xl px-1.5 py-1.5 hover:bg-secondary/60 text-left">
              <Avatar c={c} size={34} />
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold truncate">{c.name}</span><span className="block text-[11.5px] text-muted-foreground">{b!.label} · {b!.days === 0 ? 'Hôm nay 🎉' : `còn ${b!.days} ngày`}</span></span>
              <Gift className="h-4 w-4 text-primary" />
            </button></li>
          ))}</ul>
        )}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Mục tiêu quan hệ" action={<button onClick={() => nav('/goals')} className="text-[12px] font-semibold text-primary">Xem tất cả</button>} />
        {relGoals.length === 0 ? <Empty>Chưa có mục tiêu quan hệ.</Empty> : <ul className="space-y-3">{relGoals.slice(0, 4).map((g) => (
          <li key={g.id}><div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold truncate pr-2">{g.title}</span><span className="text-muted-foreground tabular-nums">{g.progress}%</span></div><ProgressBar value={g.progress} color="#F2557A" /></li>
        ))}</ul>}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Mẹo nuôi dưỡng quan hệ" />
        <ul className="space-y-2">{RELATIONSHIP_TIPS.map((t) => <li key={t.text} className="flex gap-2 text-[12.5px]"><span>{t.icon}</span><span className="text-muted-foreground">{t.text}</span></li>)}</ul>
      </Surface>
      <MascotCard mascot="lumi" pose="happy" quote="“Kết nối hôm nay để có một ngày mai tốt đẹp hơn!” 💜" />
    </div>
  );
}
