import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addMonths, endOfMonth, format, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/brand/EmptyState';
import { HeroBanner, MascotCard, PeriodNav, SectionTitle, StatTile, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { MonthlyReview } from '@/types/lifeos';
import { usePeriodStats } from './hooks/usePeriodStats';
import { DEFAULT_AREA_RATINGS, datesIn, deltaText, fromLines, ratingMeta, toLines } from './utils/reviews.utils';
import { ReviewFormModal, type ReviewDraft, type ReviewField } from './components/ReviewFormModal';
import { ReviewHistory } from './components/ReviewHistory';
import { ConfirmDialog, ReviewLayout } from './components/ReviewLayout';
import { AreaRatingsCard, BulletCard, EditDelete, RatingSummary, ScoreCard, TextCard } from './components/ReviewParts';

type View = 'overview' | 'history';
const FIELDS: ReviewField[] = [
  { key: 'highlight', label: '⭐ Điểm sáng', placeholder: 'Thành tựu nổi bật nhất...', rows: 2, half: true },
  { key: 'lowlight', label: '⚠️ Cần cải thiện', placeholder: 'Điều gì chưa tốt...', rows: 2, half: true },
  { key: 'wins', label: '🏆 Thành tựu (mỗi dòng 1 mục)', placeholder: 'Hoàn thành dự án X...' },
  { key: 'challenges', label: '⚡ Thách thức', placeholder: 'Khó duy trì thói quen...' },
  { key: 'lessonsLearned', label: '💡 Bài học', placeholder: 'Cần lập kế hoạch tốt hơn...' },
  { key: 'nextMonthFocus', label: '🎯 Focus tháng sau', placeholder: 'Tập trung vào...' },
  { key: 'gratitude', label: '💝 Biết ơn', placeholder: 'Biết ơn vì...', rows: 2 },
];
const monthLabel = (d: Date) => `Tháng ${format(d, 'M/yyyy')}`;

export default function MonthlyReviewPage() {
  const isMobile = useIsMobile();
  const reviews = useLifeOSStore((s) => s.monthlyReviews);
  const weekly = useLifeOSStore((s) => s.weeklyReviews);
  const user = useLifeOSStore((s) => s.user);
  const { addMonthlyReview, updateMonthlyReview, deleteMonthlyReview } = useSyncedStore();
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<View>('overview');
  const [form, setForm] = useState<ReviewDraft | null>(null);
  const [del, setDel] = useState<MonthlyReview | null>(null);
  const [params, setParams] = useSearchParams();

  const monthStart = startOfMonth(offset === 0 ? new Date() : addMonths(new Date(), offset));
  const monthStr = format(monthStart, 'yyyy-MM');
  const prevStart = subMonths(monthStart, 1);
  const dates = useMemo(() => datesIn(monthStart, endOfMonth(monthStart)), [monthStr]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevDates = useMemo(() => datesIn(prevStart, endOfMonth(prevStart), false), [monthStr]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = usePeriodStats(dates);
  const p = usePeriodStats(prevDates);
  const r = reviews.find((x) => x.month === monthStr);
  const prevR = reviews.find((x) => x.month === format(prevStart, 'yyyy-MM'));
  const sorted = useMemo(() => [...reviews].sort((a, b) => b.month.localeCompare(a.month)), [reviews]);
  const weeklyCount = weekly.filter((w) => w.weekStart.startsWith(monthStr)).length;

  const draftOf = (x?: MonthlyReview): ReviewDraft => ({ overallRating: x?.overallRating ?? 3, areaRatings: x?.areaRatings ?? { ...DEFAULT_AREA_RATINGS },
    text: { highlight: x?.highlight ?? '', lowlight: x?.lowlight ?? '', wins: fromLines(x?.wins), challenges: fromLines(x?.challenges), lessonsLearned: fromLines(x?.lessonsLearned), nextMonthFocus: fromLines(x?.nextMonthFocus), gratitude: fromLines(x?.gratitude) } });
  const openForm = () => setForm(draftOf(r));
  useEffect(() => { if (params.has('add')) { openForm(); params.delete('add'); setParams(params, { replace: true }); } }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (d: ReviewDraft) => {
    const t = d.text;
    const data = { month: monthStr, wins: toLines(t.wins), challenges: toLines(t.challenges), lessonsLearned: toLines(t.lessonsLearned), nextMonthFocus: toLines(t.nextMonthFocus), overallRating: d.overallRating, areaRatings: d.areaRatings, gratitude: toLines(t.gratitude), highlight: t.highlight, lowlight: t.lowlight,
      stats: { tasksCompleted: s.tasksCompleted, tasksCreated: s.tasksCreated, habitsCompletionRate: s.habitRate, goalsProgress: {} as Record<string, number>, journalEntries: s.journalCount, pomodoroSessions: s.pomodoroCount, pomodoroMinutes: s.pomodoroMinutes } };
    if (r) { updateMonthlyReview(r.id, data); toast.success('Đã cập nhật review tháng!'); } else { addMonthlyReview(data); toast.success('Đã lưu review tháng!'); }
  };

  const name = user?.name?.split(' ').slice(-1)[0] || 'bạn';
  const m = r ? ratingMeta(r.overallRating) : null;
  const nav = <PeriodNav label={monthLabel(monthStart)} onPrev={() => setOffset((o) => o - 1)} onNext={() => setOffset((o) => o + 1)} nextDisabled={offset >= 0} onReset={offset !== 0 && !isMobile ? () => setOffset(0) : undefined} resetLabel="Tháng này" />;

  const side = (
    <div className="space-y-4">
      <RatingSummary items={reviews} />
      <Surface className="p-4">
        <SectionTitle title="Trong tháng" />
        <ul className="space-y-2 text-[12.5px]">
          {[{ i: '🎯', l: 'Goals đang theo đuổi', v: s.activeGoals }, { i: '🏆', l: 'Goals hoàn thành', v: s.goalsCompleted }, { i: '📝', l: 'Review tuần đã viết', v: weeklyCount }, { i: '📓', l: 'Trang nhật ký', v: s.journalCount }, { i: '😊', l: 'Tâm trạng TB', v: s.avgMood === null ? '–' : `${s.avgMood.toFixed(1)}/5` }].map((x) => (
            <li key={x.l} className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2"><span>{x.i} {x.l}</span><b className="tabular-nums">{x.v}</b></li>
          ))}
        </ul>
      </Surface>
      {prevR && prevR.nextMonthFocus.length > 0 && <BulletCard title="Focus đã đặt tháng trước" icon="🎯" tint="violet" kind="focus" items={prevR.nextMonthFocus.slice(0, 4)} />}
      <MascotCard mascot="ori" pose="default" quote="“Mỗi tháng là một chương — hãy viết chương tiếp theo hay hơn nhé!” 📖" />
    </div>
  );

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="ori" pose="learn" title={r ? `${m!.emoji} ${monthLabel(monthStart)}: ${m!.label}` : `Chào ${name}, tổng kết tháng nào!`}
          subtitle={r ? `${r.wins.length} thành tựu · ${r.challenges.length} thách thức · ${r.nextMonthFocus.length} focus tháng sau` : `${monthLabel(monthStart)} · ${getDaysInMonth(monthStart)} ngày — đánh giá toàn diện và xem tiến bộ từng lĩnh vực.`} action={nav} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/tasks" tint="violet" value={s.tasksCompleted} label="Tasks hoàn thành" hint={deltaText(s.tasksCompleted, p.tasksCompleted)} />
          <StatTile icon="module/habits" tint="orange" value={`${s.habitRate}%`} label="Habit completion" hint={deltaText(s.habitRate, p.habitRate)} />
          <StatTile icon={<span className="text-[22px]">🍅</span>} tint="rose" value={s.pomodoroCount} label={`Pomodoro · ${s.pomodoroMinutes} phút`} hint={deltaText(s.pomodoroCount, p.pomodoroCount)} />
          <StatTile icon="module/journal" tint="sky" value={s.journalCount} label="Nhật ký" hint={s.avgMood === null ? undefined : `Mood ${s.avgMood.toFixed(1)}`} />
        </div>
        {!r ? (
          <EmptyState mascot="ori" pose="learn" title={`Chưa có review ${monthLabel(monthStart).toLowerCase()}`} description="Nhìn lại tháng qua: thành tựu, thách thức, bài học và focus cho tháng sau."
            action={<Button className="rounded-full" onClick={openForm}><Plus className="h-4 w-4 mr-1.5" />Viết review tháng</Button>} />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
              <ScoreCard title="Tổng quan tháng" rating={r.overallRating} action={<EditDelete onEdit={openForm} onDelete={() => setDel(r)} />} rows={[
                { icon: '✅', label: 'Tasks hoàn thành / tạo mới', value: `${s.tasksCompleted} / ${s.tasksCreated}`, pct: s.tasksCompleted ? Math.min(100, (s.tasksCompleted / Math.max(s.tasksCreated, s.tasksCompleted)) * 100) : 0, color: '#7C6CF2' },
                { icon: '🔥', label: 'Habit completion', value: `${s.habitRate}%`, pct: s.habitRate, color: '#FF8A3D' },
                { icon: '🏆', label: 'Goals hoàn thành', value: s.goalsCompleted },
                { icon: '📝', label: 'Review tuần', value: `${weeklyCount} tuần` },
              ]} />
              <div className="grid gap-4">
                <TextCard title="Điểm sáng" icon="⭐" tint="amber" text={r.highlight} />
                <TextCard title="Cần cải thiện" icon="⚠️" tint="rose" text={r.lowlight} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <BulletCard title="Thành tựu nổi bật" icon="🏆" tint="amber" items={r.wins} />
              <BulletCard title="Thách thức chính" icon="⚡" tint="rose" kind="challenges" items={r.challenges} />
              <BulletCard title="Bài học" icon="💡" tint="sky" kind="lessons" items={r.lessonsLearned} />
              <BulletCard title="Focus tháng sau" icon="🎯" tint="violet" kind="focus" items={r.nextMonthFocus} />
            </div>
            {!!r.gratitude?.length && <BulletCard title="Biết ơn" icon="💝" tint="mint" kind="gratitude" items={r.gratitude} />}
            <AreaRatingsCard ratings={r.areaRatings} prev={prevR?.areaRatings} />
          </>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
    </div>
  );

  const offsetOf = (month: string) => { const [y, mo] = month.split('-').map(Number); const now = new Date(); return (y - now.getFullYear()) * 12 + (mo - 1 - now.getMonth()); };
  return (
    <ReviewLayout title="Review tháng" subtitle="Đánh giá toàn diện, xem tiến bộ theo từng lĩnh vực 📅"
      actions={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openForm}>{r ? <><Pencil className="h-4 w-4 mr-1.5" />Sửa review</> : <><Plus className="h-4 w-4 mr-1.5" />Viết review</>}</Button>}
      tabs={[{ id: 'overview', label: 'Tổng quan' }, { id: 'history', label: 'Lịch sử' }]} view={view} onView={setView}
      fab={{ label: r ? 'Sửa review' : 'Viết review', onClick: openForm }}>
      {view === 'overview' && overview}
      {view === 'history' && (
        <ReviewHistory unit="tháng"
          items={sorted.map((x) => ({ id: x.id, key: x.month, short: `T${Number(x.month.slice(5))}`, title: `Tháng ${Number(x.month.slice(5))}/${x.month.slice(0, 4)}`, subtitle: `${x.wins.length} thành tựu · ${x.lessonsLearned.length} bài học${x.highlight ? ` · ${x.highlight}` : ''}`, meta: x.stats ? `${x.stats.tasksCompleted} tasks · ${x.stats.habitsCompletionRate}% habit` : undefined, rating: x.overallRating, search: [...x.wins, ...x.challenges, ...x.lessonsLearned, ...x.nextMonthFocus, x.highlight ?? '', x.lowlight ?? ''].join(' '), active: x.month === monthStr }))}
          onOpen={(i) => { setOffset(offsetOf(i.key)); setView('overview'); }}
          onDelete={(i) => setDel(reviews.find((x) => x.id === i.id) ?? null)}
          empty={<EmptyState mascot="ori" pose="learn" title="Chưa có review tháng nào" description="Review đầu tiên sẽ xuất hiện ở đây." action={<Button className="rounded-full" onClick={openForm}>Viết review</Button>} />} />
      )}
      {isMobile && view === 'overview' && <div className="mt-5">{side}</div>}
      {form && <ReviewFormModal open onOpenChange={(o) => !o && setForm(null)} title={r ? 'Chỉnh sửa review tháng' : `Review ${monthLabel(monthStart).toLowerCase()}`} ratingLabel="Đánh giá tổng quan tháng"
        initial={form} fields={FIELDS} prevAreas={prevR?.areaRatings} onSubmit={save} />}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Xóa review tháng?" description={del ? `Review tháng ${Number(del.month.slice(5))}/${del.month.slice(0, 4)} sẽ bị xóa và không thể hoàn tác.` : ''} onConfirm={() => { if (del) { deleteMonthlyReview(del.id); toast.success('Đã xóa review tháng'); } }} />
    </ReviewLayout>
  );
}
