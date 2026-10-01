import { useNavigate } from 'react-router-dom';
import { Empty, MascotCard, ProgressBar, ProgressRing, SectionTitle, Surface } from '@/components/lio';
import type { LearningApi } from '../hooks/useLearning';
import { BOOK_RECOMMENDATIONS, LEARNING_TIPS } from '../utils/learning.utils';

export function LearningSidePanel({ api }: { api: LearningApi }) {
  const nav = useNavigate();
  const { items, stats, learningGoals, score } = api;
  const kinds = [
    { l: 'Khóa học', list: items.filter((i) => i.kind === 'course'), c: '#6C5CE7' },
    { l: 'Sách', list: items.filter((i) => i.kind === 'book'), c: '#FF7A45' },
  ];
  const reading = items.filter((i) => i.kind === 'book' && i.status === 'active');
  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tiến độ tổng thể" hint={score !== null ? `Life Wheel: ${score}/10` : undefined} />
        <div className="flex items-center gap-4">
          <ProgressRing value={stats.avg} size={92} stroke={10} />
          <ul className="flex-1 min-w-0 space-y-2 text-[12.5px]">
            {kinds.map((k) => { const v = k.list.length ? Math.round(k.list.reduce((a, i) => a + i.pct, 0) / k.list.length) : 0; return (
              <li key={k.l}><div className="flex justify-between mb-1"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: k.c }} />{k.l} ({k.list.length})</span><span className="font-semibold tabular-nums">{v}%</span></div><ProgressBar value={v} color={k.c} height={5} /></li>); })}
          </ul>
        </div>
      </Surface>
      <MascotCard mascot="ori" pose="learn" quote="“Đầu tư vào tri thức luôn mang lại lợi nhuận cao nhất.” 📚" />
      <Surface className="p-4">
        <SectionTitle title="Mục tiêu học tập" action={<button onClick={() => nav('/goals')} className="text-[12px] font-semibold text-primary">Xem tất cả</button>} />
        {learningGoals.length === 0 ? <Empty>Chưa có mục tiêu học tập. Tạo trong Mục tiêu nhé!</Empty> : (
          <ul className="space-y-3">{learningGoals.slice(0, 4).map((g) => (
            <li key={g.id}><div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold truncate pr-2">{g.title}</span><span className="text-muted-foreground tabular-nums">{g.progress}%</span></div><ProgressBar value={g.progress} /></li>
          ))}</ul>
        )}
      </Surface>
      {reading.length > 0 && (
        <Surface className="p-4">
          <SectionTitle title="Đang đọc" />
          <ul className="space-y-3">{reading.slice(0, 3).map((b) => (
            <li key={b.id}><div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold truncate pr-2">📖 {b.title}</span><span className="text-muted-foreground tabular-nums">{b.pct}%</span></div><ProgressBar value={b.pct} color="#FF7A45" height={5} /></li>
          ))}</ul>
        </Surface>
      )}
      <Surface className="p-4">
        <SectionTitle title="Mẹo học tập" />
        <ul className="space-y-2">{LEARNING_TIPS.map((t) => <li key={t.text} className="flex gap-2 text-[12.5px]"><span>{t.icon}</span><span className="text-muted-foreground">{t.text}</span></li>)}</ul>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Sách gợi ý" />
        <ul className="space-y-2">{BOOK_RECOMMENDATIONS.map((b) => <li key={b.title} className="flex items-center gap-2.5 text-[12.5px]"><span className="h-8 w-8 rounded-[10px] bg-[#FFF1EA] grid place-items-center">📕</span><span className="min-w-0"><span className="block font-semibold truncate">{b.title}</span><span className="block text-muted-foreground">{b.author}</span></span></li>)}</ul>
      </Surface>
    </div>
  );
}
