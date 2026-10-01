import { useNavigate } from 'react-router-dom';
import { Empty, InsightCard, MascotCard, ProgressBar, ProgressRing, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { TrendArea } from '@/components/lio/charts';
import { moodOf } from '../utils/journal.utils';
import { JOURNAL_RANGES, type JournalPeriod, type JournalRange } from '../hooks/useJournalPeriod';

export function JournalOverview({ period, range, onRange, streak, recent, onTag }: {
  period: JournalPeriod; range: JournalRange; onRange: (r: JournalRange) => void; streak: number; recent: React.ReactNode; onTag: (id: string) => void;
}) {
  const p = period;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <SegmentedTabs items={JOURNAL_RANGES as unknown as { id: JournalRange; label: string }[]} value={range} onChange={onRange} size="sm" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon="module/journal" tint="violet" value={p.list.length} label="Bài viết" />
        <StatTile icon={<span className="text-[22px]">🔥</span>} tint="orange" value={streak} label="Ngày liên tiếp" />
        <StatTile icon={<span className="text-[22px]">{moodOf(Math.round(p.avgMood))?.emoji ?? '🙂'}</span>} tint="amber" value={p.avgMood ? `${p.avgMood.toFixed(1)}/5` : '–'} label="Tâm trạng TB" />
        <StatTile icon="module/insights" tint="mint" value={p.topics} label="Chủ đề chính" />
      </div>
      <Surface className="p-5">
        <SectionTitle title="Biểu đồ tâm trạng" hint={p.avgEnergy ? `Năng lượng TB ${p.avgEnergy.toFixed(1)}/5` : undefined} />
        {p.list.length === 0 ? <Empty>Chưa có bài viết trong kỳ này.</Empty>
          : <TrendArea id="jo-mood" data={p.series} name="Tâm trạng" domain={[1, 5]} tickFormat={(v) => moodOf(v)?.emoji ?? ''} height={210} />}
      </Surface>
      <Surface className="p-5">
        <SectionTitle title="Từ khóa nổi bật" hint="Theo thẻ & lĩnh vực" />
        {p.topTags.length + p.topAreas.length === 0 ? <Empty>Gắn thẻ hoặc lĩnh vực khi viết để thấy chủ đề nổi bật.</Empty> : (
          <div className="flex flex-wrap gap-2">
            {p.topTags.slice(0, 8).map((t) => (
              <button key={t.id} onClick={() => onTag(t.id)} className="h-8 px-3 rounded-full text-[12.5px] font-semibold transition hover:opacity-80" style={{ background: `color-mix(in srgb, ${t.color} 12%, transparent)`, color: t.color }}>{t.name} ({t.n})</button>
            ))}
            {p.topAreas.slice(0, 6).map((a) => (
              <span key={a.id} className="h-8 px-3 rounded-full text-[12.5px] font-medium bg-secondary inline-flex items-center">{a.name} ({a.n})</span>
            ))}
          </div>
        )}
      </Surface>
      {recent}
    </div>
  );
}

export function JournalSidePanel({ period, stats }: { period: JournalPeriod; stats: { writtenToday: boolean; streak: number; total: number } }) {
  const nav = useNavigate();
  const p = period;
  const topics = [...p.topTags, ...p.topAreas].sort((a, b) => b.n - a.n).slice(0, 5);
  const tips: { icon: string; tint?: 'violet' | 'orange' | 'rose' | 'amber' | 'mint' | 'sky'; title: string; desc: string }[] = [];
  if (!stats.writtenToday) tips.push({ icon: '✍️', tint: 'violet', title: 'Viết vài dòng hôm nay', desc: 'Thử câu hỏi: “Hôm nay mình đã học được gì?”' });
  if (stats.streak >= 3) tips.push({ icon: '🔥', tint: 'orange', title: `Chuỗi ${stats.streak} ngày`, desc: 'Giữ nhịp viết đều đặn — bạn đang làm rất tốt!' });
  if (p.list.length && p.gratitudeCount / p.list.length < 0.5) tips.push({ icon: '🙏', tint: 'mint', title: 'Thêm lòng biết ơn', desc: 'Ghi 1–3 điều biết ơn mỗi bài giúp tâm trạng tích cực hơn.' });
  if (p.list.length >= 3 && p.split.negative >= 30) tips.push({ icon: '💜', tint: 'rose', title: 'Tâm trạng chưa tốt', desc: 'Nhiều ngày tiêu cực gần đây — thử trò chuyện với AI Coach nhé.' });
  if (topics[0]) tips.push({ icon: '🎯', tint: 'sky', title: `Chủ đề nổi bật: ${topics[0].name}`, desc: 'Xem lại mục tiêu liên quan và chia nhỏ thành hành động cụ thể.' });
  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tổng quan cảm xúc" hint={`${p.list.length} bài`} />
        <div className="flex items-center gap-4">
          <ProgressRing value={(p.avgMood / 5) * 100} size={92} stroke={10} label={<span className="text-center leading-tight">{p.avgMood ? p.avgMood.toFixed(1) : '–'}<span className="block text-[10px] font-medium text-muted-foreground">/5</span></span>} />
          <ul className="flex-1 space-y-2 text-[12.5px]">
            {[{ l: 'Tích cực', v: p.split.positive, c: '#57D3AE' }, { l: 'Bình thường', v: p.split.neutral, c: '#FFC63D' }, { l: 'Tiêu cực', v: p.split.negative, c: '#F2557A' }].map((x) => (
              <li key={x.l} className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: x.c }} />{x.l}</span><span className="font-semibold tabular-nums">{x.v}%</span></li>
            ))}
          </ul>
        </div>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Chủ đề thường gặp" />
        {topics.length === 0 ? <Empty>Chưa có chủ đề trong kỳ.</Empty> : (
          <ul className="space-y-2.5">{topics.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 text-[12.5px]">
              <span className="w-[96px] font-medium truncate">{t.name}</span>
              <ProgressBar value={(t.n / topics[0].n) * 100} color={t.color} className="flex-1" height={6} />
              <span className="w-6 text-right tabular-nums text-muted-foreground">{t.n}</span>
            </li>))}
          </ul>
        )}
      </Surface>
      <InsightCard title="Gợi ý từ AI Coach" subtitle="Dựa trên nhật ký của bạn" items={tips.slice(0, 4)} onChat={() => nav('/ai-chat')} />
      <MascotCard mascot="ori" pose="learn" quote="“Mỗi dòng chữ hôm nay là phiên bản tốt hơn của ngày mai.” 💜" />
    </div>
  );
}
