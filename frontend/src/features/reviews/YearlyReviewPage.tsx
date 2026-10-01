import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { endOfYear, startOfYear } from 'date-fns';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/brand/EmptyState';
import { HeroBanner, MascotCard, PeriodNav, SectionTitle, StatTile, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import type { YearlyReview } from '@/types/lifeos';
import { usePeriodStats } from './hooks/usePeriodStats';
import { DEFAULT_AREA_RATINGS, datesIn, fromLines, ratingMeta, toLines } from './utils/reviews.utils';
import { ReviewFormModal, type ReviewDraft, type ReviewField } from './components/ReviewFormModal';
import { ReviewHistory } from './components/ReviewHistory';
import { ConfirmDialog, ReviewLayout } from './components/ReviewLayout';
import { AreaRatingsCard, BulletCard, EditDelete, RatingSummary, ScoreCard, TextCard } from './components/ReviewParts';

type View = 'overview' | 'history';
const FIELDS: ReviewField[] = [
  { key: 'wordOfTheYear', label: '💬 Từ khóa của năm', placeholder: 'VD: Kiên trì, Đột phá, Trưởng thành...', input: true },
  { key: 'topAchievements', label: '🏆 Thành tựu nổi bật (mỗi dòng 1 mục)', placeholder: 'Thăng chức, hoàn thành dự án lớn...' },
  { key: 'biggestChallenges', label: '⚡ Thách thức lớn', placeholder: 'Khó khăn đã vượt qua...' },
  { key: 'lessonsLearned', label: '💡 Bài học', placeholder: 'Những điều đã học được...' },
  { key: 'gratitude', label: '💝 Biết ơn', placeholder: 'Những điều biết ơn...' },
  { key: 'letterToFutureSelf', label: '📩 Thư gửi tương lai', placeholder: 'Gửi cho bản thân năm sau...', rows: 4 },
];

export default function YearlyReviewPage() {
  const isMobile = useIsMobile();
  const navTo = useNavigate();
  const reviews = useLifeOSStore((s) => s.yearlyReviews);
  const plannings = useLifeOSStore((s) => s.yearlyPlannings);
  const user = useLifeOSStore((s) => s.user);
  const { addYearlyReview, updateYearlyReview, deleteYearlyReview } = useSyncedStore();
  const cur = new Date().getFullYear();
  const [year, setYear] = useState(cur);
  const [view, setView] = useState<View>('overview');
  const [form, setForm] = useState<ReviewDraft | null>(null);
  const [del, setDel] = useState<YearlyReview | null>(null);
  const [params, setParams] = useSearchParams();

  const dates = useMemo(() => datesIn(startOfYear(new Date(year, 0, 1)), endOfYear(new Date(year, 0, 1))), [year]);
  const s = usePeriodStats(dates);
  const r = reviews.find((x) => x.year === year);
  const prevR = reviews.find((x) => x.year === year - 1);
  const plan = plannings.find((x) => x.year === year);
  const sorted = useMemo(() => [...reviews].sort((a, b) => b.year - a.year), [reviews]);

  const draftOf = (x?: YearlyReview): ReviewDraft => ({ overallRating: x?.overallRating ?? 3, areaRatings: x?.areaRatings ?? { ...DEFAULT_AREA_RATINGS },
    text: { wordOfTheYear: x?.wordOfTheYear ?? '', topAchievements: fromLines(x?.topAchievements), biggestChallenges: fromLines(x?.biggestChallenges), lessonsLearned: fromLines(x?.lessonsLearned), gratitude: fromLines(x?.gratitude), letterToFutureSelf: x?.letterToFutureSelf ?? '' } });
  const openForm = () => setForm(draftOf(r));
  useEffect(() => { if (params.has('add')) { openForm(); params.delete('add'); setParams(params, { replace: true }); } }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (d: ReviewDraft) => {
    const t = d.text;
    const data = { year, overallRating: d.overallRating, topAchievements: toLines(t.topAchievements), biggestChallenges: toLines(t.biggestChallenges), lessonsLearned: toLines(t.lessonsLearned), gratitude: toLines(t.gratitude), letterToFutureSelf: t.letterToFutureSelf, wordOfTheYear: t.wordOfTheYear, areaRatings: d.areaRatings,
      stats: { totalTasksCompleted: s.tasksCompleted, totalHabitsTracked: s.activeHabits, avgHabitCompletionRate: s.habitRate, goalsCompleted: s.goalsCompleted, goalsCreated: s.goalsCreated, journalEntries: s.journalCount, totalPomodoroMinutes: s.pomodoroMinutes, booksRead: 0, coursesCompleted: 0 } };
    if (r) { updateYearlyReview(r.id, data); toast.success('Đã cập nhật Yearly Review!'); } else { addYearlyReview(data); toast.success('Đã lưu Yearly Review!'); }
  };

  const name = user?.name?.split(' ').slice(-1)[0] || 'bạn';
  const m = r ? ratingMeta(r.overallRating) : null;
  const nav = <PeriodNav label={`Năm ${year}`} onPrev={() => setYear((y) => y - 1)} onNext={() => setYear((y) => y + 1)} nextDisabled={year >= cur} onReset={year !== cur && !isMobile ? () => setYear(cur) : undefined} resetLabel="Năm nay" />;

  const side = (
    <div className="space-y-4">
      <RatingSummary items={reviews} />
      <Surface className="p-4">
        <SectionTitle title={`Kế hoạch ${year}`} action={<button onClick={() => navTo('/yearly-planning')} className="text-[12px] font-semibold text-primary">Mở</button>} />
        {plan ? (
          <div className="space-y-2 text-[12.5px]">
            <p className="text-[15px] font-bold">✨ {plan.theme}</p>
            {plan.mantra && <p className="italic text-muted-foreground">“{plan.mantra}”</p>}
            <p className="text-muted-foreground">🎯 {plan.yearlyGoals.filter((g) => g.status === 'completed').length}/{plan.yearlyGoals.length} goals năm · 📍 {plan.bucketList.filter((b) => b.completed).length}/{plan.bucketList.length} bucket list</p>
          </div>
        ) : <p className="text-[12.5px] text-muted-foreground">Chưa lập kế hoạch cho năm {year}.</p>}
      </Surface>
      <MascotCard mascot="ori" pose="explore" quote="“Nhìn lại để biết mình đã đi xa thế nào — và hướng tới đâu tiếp theo.” 🌟" />
    </div>
  );

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="ori" pose="explore" title={r ? `${m!.emoji} Năm ${year}: ${m!.label}` : `Chào ${name}, nhìn lại năm ${year} nhé!`}
          subtitle={r ? (r.wordOfTheYear ? `Từ khóa của năm: “${r.wordOfTheYear}” · ${r.topAchievements.length} thành tựu nổi bật` : `${r.topAchievements.length} thành tựu · ${r.lessonsLearned.length} bài học`) : 'Đánh giá tiến bộ cả năm và định hướng cho tương lai.'} action={nav} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/tasks" tint="violet" value={s.tasksCompleted} label="Tasks hoàn thành" />
          <StatTile icon="module/habits" tint="orange" value={`${s.habitRate}%`} label="Habit completion" hint={`${s.activeHabits} thói quen`} />
          <StatTile icon="module/goals" tint="mint" value={`${s.goalsCompleted}/${s.goalsCreated}`} label="Goals hoàn thành" hint="Tạo trong năm" />
          <StatTile icon={<span className="text-[22px]">🍅</span>} tint="rose" value={`${Math.round(s.pomodoroMinutes / 60)}h`} label="Thời gian tập trung" hint={`${s.pomodoroCount} pomodoro`} />
        </div>
        {!r ? (
          <EmptyState mascot="ori" pose="learn" title={`Chưa có review năm ${year}`} description="Ghi lại thành tựu, bài học, lòng biết ơn và một lá thư gửi bản thân năm sau."
            action={<Button className="rounded-full" onClick={openForm}><Plus className="h-4 w-4 mr-1.5" />Viết review năm</Button>} />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
              <ScoreCard title={`Tổng quan năm ${year}`} rating={r.overallRating} action={<EditDelete onEdit={openForm} onDelete={() => setDel(r)} />} rows={[
                { icon: '🎯', label: 'Goals hoàn thành', value: `${s.goalsCompleted} / ${s.goalsCreated}`, pct: s.goalsCreated ? Math.min(100, (s.goalsCompleted / s.goalsCreated) * 100) : 0, color: '#22C55E' },
                { icon: '🔥', label: 'Habit completion', value: `${s.habitRate}%`, pct: s.habitRate, color: '#FF8A3D' },
                { icon: '📓', label: 'Trang nhật ký', value: s.journalCount },
                { icon: '✅', label: 'Tasks hoàn thành', value: s.tasksCompleted },
              ]} />
              <div className="grid gap-4">
                <TextCard title="Từ khóa của năm" icon="💬" tint="violet" text={r.wordOfTheYear} />
                <TextCard title="Thư gửi tương lai" icon="📩" tint="rose" text={r.letterToFutureSelf} quote />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <BulletCard title="Thành tựu lớn nhất" icon="🏆" tint="amber" items={r.topAchievements} />
              <BulletCard title="Thách thức lớn" icon="⚡" tint="rose" kind="challenges" items={r.biggestChallenges} />
              <BulletCard title="Bài học quan trọng" icon="💡" tint="sky" kind="lessons" items={r.lessonsLearned} />
              <BulletCard title="Biết ơn" icon="💝" tint="mint" kind="gratitude" items={r.gratitude} />
            </div>
            <AreaRatingsCard ratings={r.areaRatings} prev={prevR?.areaRatings} />
          </>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
    </div>
  );

  return (
    <ReviewLayout title="Review năm" subtitle="Nhìn lại cả năm, đánh giá tiến bộ và định hướng tương lai 🌟"
      actions={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openForm}>{r ? <><Pencil className="h-4 w-4 mr-1.5" />Sửa review</> : <><Plus className="h-4 w-4 mr-1.5" />Viết review</>}</Button>}
      tabs={[{ id: 'overview', label: 'Tổng quan' }, { id: 'history', label: 'Lịch sử' }]} view={view} onView={setView}
      fab={{ label: r ? 'Sửa review' : 'Viết review', onClick: openForm }}>
      {view === 'overview' && overview}
      {view === 'history' && (
        <ReviewHistory unit="năm"
          items={sorted.map((x) => ({ id: x.id, key: String(x.year), short: String(x.year), title: `Năm ${x.year}`, subtitle: `${x.wordOfTheYear ? `“${x.wordOfTheYear}” · ` : ''}${x.topAchievements.length} thành tựu · ${x.lessonsLearned.length} bài học`, rating: x.overallRating, search: [x.wordOfTheYear ?? '', ...x.topAchievements, ...x.biggestChallenges, ...x.lessonsLearned, ...x.gratitude, x.letterToFutureSelf ?? ''].join(' '), active: x.year === year }))}
          onOpen={(i) => { setYear(Number(i.key)); setView('overview'); }}
          onDelete={(i) => setDel(reviews.find((x) => x.id === i.id) ?? null)}
          empty={<EmptyState mascot="ori" pose="learn" title="Chưa có review năm nào" description="Review đầu tiên sẽ xuất hiện ở đây." action={<Button className="rounded-full" onClick={openForm}>Viết review</Button>} />} />
      )}
      {isMobile && view === 'overview' && <div className="mt-5">{side}</div>}
      {form && <ReviewFormModal open onOpenChange={(o) => !o && setForm(null)} title={r ? 'Chỉnh sửa review năm' : `Review năm ${year}`} ratingLabel={`Đánh giá tổng quan năm ${year}`}
        initial={form} fields={FIELDS} prevAreas={prevR?.areaRatings} onSubmit={save} />}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Xóa review năm?" description={del ? `Review năm ${del.year} sẽ bị xóa và không thể hoàn tác.` : ''} onConfirm={() => { if (del) { deleteYearlyReview(del.id); toast.success('Đã xóa Yearly Review'); } }} />
    </ReviewLayout>
  );
}
