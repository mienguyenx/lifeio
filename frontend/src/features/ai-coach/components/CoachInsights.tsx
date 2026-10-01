import { useMemo } from 'react';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { Empty, ProgressBar, SectionTitle, StatTile, Surface } from '@/components/lio';
import { GroupedBars, StatStrip } from '@/components/lio/charts';
import { LIFE_AREAS } from '@/types/lifeos';
import { MOODS } from '@/features/journal/utils/journal.utils';
import type { CoachApi } from '../hooks/useCoach';

/** Tab “Phân tích” — chỉ dùng số liệu mà AI Coach đã nhận kèm (dailyStats + userContext) và lịch sử trò chuyện đã lưu. */
export function CoachInsights({ api, onPrompt }: { api: CoachApi; onPrompt: (p: string) => void }) {
  const { today, saved, suggestions, messages } = api;
  const scores = today.scores as Record<string, number> | undefined;
  const areas = scores ? LIFE_AREAS.map((a) => ({ a, v: scores[a.id] ?? 0 })).sort((x, y) => y.v - x.v) : [];
  const balance = areas.length ? areas.reduce((s, x) => s + x.v, 0) / areas.length : 0;
  const mood = today.avgMood ? MOODS[Math.round(today.avgMood) - 1] : undefined;
  const allMsgs = saved.reduce((s, c) => s + c.messages.length, 0) + messages.length;
  const favs = [...saved.flatMap((c) => c.messages), ...messages].filter((m) => m.isFavorite).length;
  const weekly = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const ws = startOfWeek(subWeeks(new Date(), 7 - i), { weekStartsOn: 1 });
    const we = startOfWeek(subWeeks(new Date(), 6 - i), { weekStartsOn: 1 });
    return { label: format(ws, 'd/M'), n: saved.filter((c) => { const d = new Date(c.createdAt); return d >= ws && d < we; }).length };
  }), [saved]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon="module/life-areas" tint="violet" value={balance ? `${balance.toFixed(1)}/10` : '–'} label="Điểm cân bằng" hint={today.lowArea ? `Thấp nhất: ${today.lowArea.a.name}` : 'Chưa chấm Life Wheel'} />
        <StatTile icon="module/goals" tint="mint" value={`${today.avgGoal}%`} label="Tiến độ mục tiêu" hint={`${today.activeGoals.length} đang thực hiện`} />
        <StatTile icon="module/habits" tint="sky" value={`${today.habitsDone}/${today.habitsTotal}`} label="Thói quen hôm nay" />
        <StatTile icon={<span className="text-[22px]">{mood?.emoji ?? '🙂'}</span>} tint="amber" value={today.avgMood ? today.avgMood.toFixed(1) : '–'} label="Tâm trạng 7 ngày" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <SectionTitle title="Phân tích dữ liệu cuộc sống" hint="Theo Life Wheel gần nhất" />
          {areas.length === 0 ? <Empty>Chấm điểm Bánh xe cuộc sống để AI Coach hiểu bạn hơn.</Empty> : (
            <ul className="space-y-2.5">{areas.map(({ a, v }) => (
              <li key={a.id} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="w-[110px] font-medium truncate">{a.icon} {a.name}</span>
                <ProgressBar value={v * 10} color={`hsl(var(--area-${a.id}))`} className="flex-1" height={6} />
                <span className="w-8 text-right font-semibold tabular-nums">{v}</span>
              </li>))}
            </ul>
          )}
          {today.lowArea && (
            <button onClick={() => onPrompt(`Lĩnh vực ${today.lowArea!.a.name} của tôi đang thấp nhất (${today.lowArea!.v}/10). Tôi nên làm gì để cải thiện?`)}
              className="mt-4 w-full h-10 rounded-full bg-secondary hover:bg-secondary/70 text-[12.5px] font-semibold">Hỏi AI Coach cách cải thiện {today.lowArea.a.name}</button>
          )}
        </Surface>
        <div className="space-y-4">
          <Surface className="p-5">
            <SectionTitle title="Kế hoạch được đề xuất" hint="Bấm để hỏi AI Coach" />
            {suggestions.length === 0 ? <Empty>Bạn đã hoàn thành mọi thứ hôm nay 🎉</Empty> : (
              <ul className="space-y-2">{suggestions.map((s) => (
                <li key={s.title}><button onClick={() => onPrompt(s.prompt)} className="w-full flex items-center gap-3 rounded-2xl bg-secondary/50 hover:bg-secondary px-3 py-2.5 text-left">
                  <span className="text-[18px]">{s.emoji}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-semibold truncate">{s.title}</span><span className="block text-[11px] text-muted-foreground truncate">{s.desc}</span></span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button></li>))}
              </ul>
            )}
          </Surface>
          <Surface className="p-5">
            <SectionTitle title="Thống kê sử dụng AI Coach" hint="8 tuần gần đây" />
            <GroupedBars data={weekly} series={[{ key: 'n', name: 'Cuộc trò chuyện đã lưu', color: '#7C6CF2' }]} height={150} />
            <StatStrip items={[{ label: 'Đã lưu', value: saved.length }, { label: 'Tin nhắn', value: allMsgs }, { label: 'Yêu thích', value: favs }]} />
          </Surface>
        </div>
      </div>
    </div>
  );
}
