import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Pencil, Plus, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/brand/EmptyState';
import { HeroBanner, InsightCard, MascotCard, PeriodNav, SectionTitle, StatTile, Surface, TINTS } from '@/components/lio';
import { GroupedBars, StatStrip } from '@/components/lio/charts';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useWeeklyReview } from './hooks/useWeeklyReview';
import { PROMPT_META, QUICK_QUESTIONS, REFLECTION_PROMPTS, ratingMeta, type PromptKey } from './utils/reviews.utils';
import { ReviewFormModal, type ReviewDraft, type ReviewField } from './components/ReviewFormModal';
import { ReviewHistory } from './components/ReviewHistory';
import { ConfirmDialog, ReviewLayout } from './components/ReviewLayout';
import { AreaRatingsCard, BulletCard, EditDelete, RatingSummary, ScoreCard, TextCard } from './components/ReviewParts';

type View = 'overview' | 'stats' | 'prompts' | 'history';
const FIELDS: ReviewField[] = [
  { key: 'highlight', label: '⭐ Highlight tuần', placeholder: 'Điểm nhấn đáng nhớ nhất', rows: 2, half: true },
  { key: 'lowlight', label: '🌧️ Lowlight tuần', placeholder: 'Điều đáng tiếc nhất', rows: 2, half: true },
  { key: 'wins', label: '🏆 Chiến thắng tuần này', placeholder: 'Những điều bạn đã đạt được (mỗi dòng 1 điều)', prompts: REFLECTION_PROMPTS.wins },
  { key: 'challenges', label: '⚡ Thách thức', placeholder: 'Những khó khăn bạn gặp phải', prompts: REFLECTION_PROMPTS.challenges },
  { key: 'lessonsLearned', label: '💡 Bài học rút ra', placeholder: 'Những điều bạn học được', prompts: REFLECTION_PROMPTS.lessons },
  { key: 'nextWeekFocus', label: '🎯 Focus tuần tới', placeholder: 'Những điều cần tập trung tuần tới', prompts: REFLECTION_PROMPTS.focus },
  { key: 'gratitude', label: '🙏 Biết ơn', placeholder: 'Những điều bạn biết ơn tuần này', rows: 2 },
];
const PROMPT_FIELD: Record<PromptKey, string> = { wins: 'wins', challenges: 'challenges', lessons: 'lessonsLearned', focus: 'nextWeekFocus' };

export default function WeeklyReviewPage() {
  const isMobile = useIsMobile();
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<View>('overview');
  const [form, setForm] = useState<ReviewDraft | null>(null);
  const [del, setDel] = useState<{ id: string; label: string } | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [pIdx, setPIdx] = useState<Record<PromptKey, number>>({ wins: 0, challenges: 0, lessons: 0, focus: 0 });
  const [params, setParams] = useSearchParams();
  const api = useWeeklyReview(offset);
  const { current: r, previous, stats, weekStart, weekEnd } = api;

  const openForm = (extra?: { key: string; text: string }) => {
    const d = api.draftOf(r);
    if (extra) d.text[extra.key] = d.text[extra.key] ? `${d.text[extra.key]}\n${extra.text}` : extra.text;
    setForm(d);
  };
  useEffect(() => { if (params.has('add')) { openForm(); params.delete('add'); setParams(params, { replace: true }); } }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const autoDraft = () => setForm(api.autoDraftValue());

  const range = `${format(weekStart, 'dd/MM')} – ${format(weekEnd, 'dd/MM/yyyy')}`;
  const name = api.user?.name?.split(' ').slice(-1)[0] || 'bạn';
  const m = r ? ratingMeta(r.overallRating) : null;
  const nav = <PeriodNav label={`Tuần ${format(weekStart, 'dd/MM')} – ${format(weekEnd, 'dd/MM')}`} onPrev={() => setOffset((o) => o - 1)} onNext={() => setOffset((o) => o + 1)} nextDisabled={offset >= 0} onReset={offset !== 0 && !isMobile ? () => setOffset(0) : undefined} resetLabel="Tuần này" />;
  const writeBtn = <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => openForm()}>{r ? <><Pencil className="h-4 w-4 mr-1.5" />Sửa review</> : <><Plus className="h-4 w-4 mr-1.5" />Viết review</>}</Button>;
  const draftBtn = !r && offset === 0 && <Button variant="outline" className="h-10 rounded-full px-4 bg-card shadow-soft" onClick={autoDraft}><Wand2 className="h-4 w-4 mr-1.5" />Auto-draft</Button>;

  const side = (
    <div className="space-y-4">
      <RatingSummary items={api.reviews} />
      {previous && previous.nextWeekFocus.length > 0 && <BulletCard title="Focus tuần trước" icon="🎯" tint="violet" kind="focus" items={previous.nextWeekFocus.slice(0, 3)} />}
      <Surface className="p-4">
        <SectionTitle title="Câu hỏi suy ngẫm" />
        <ul className="space-y-2">{QUICK_QUESTIONS.map((q) => (
          <li key={q.text}><button onClick={() => openForm({ key: 'wins', text: q.text })} className="w-full text-left rounded-2xl bg-secondary/50 hover:bg-secondary px-3 py-2 text-[12.5px] flex gap-2"><span>{q.icon}</span><span className="text-muted-foreground">{q.text}</span></button></li>
        ))}</ul>
      </Surface>
      <MascotCard mascot="ori" pose="idea" quote="“Những khoảnh khắc dừng lại để nhìn lại chính là bước đệm cho những bước tiến xa hơn.” 💜" />
    </div>
  );

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="ori" pose="idea" title={r ? `${m!.emoji} Tuần này: ${m!.label}` : `Chào ${name}, cùng nhìn lại tuần nhé!`}
          subtitle={r ? `${r.wins.length} chiến thắng · ${r.lessonsLearned.length} bài học · ${r.nextWeekFocus.length} focus tuần tới` : `Tuần ${range} — dành 10 phút ghi nhận thành tựu và bài học.`} action={nav} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/habits" tint="orange" value={stats.habitChecks} label="Habits hoàn thành" hint={`Tỷ lệ ${api.insights.habitRate}%`} onClick={() => setView('stats')} />
          <StatTile icon="module/tasks" tint="violet" value={stats.tasksCompleted} label="Tasks hoàn thành" onClick={() => setView('stats')} />
          <StatTile icon={<span className="text-[22px]">🍅</span>} tint="rose" value={stats.pomodoroCount} label="Pomodoros" hint={api.insights.focusMin ? `${api.insights.focusMin} phút` : undefined} />
          <StatTile icon={<span className="text-[22px]">⭐</span>} tint="amber" value={api.reviews.length} label="Tổng reviews" onClick={() => setView('history')} />
        </div>
        {!r ? (
          <EmptyState mascot="ori" pose="learn" title="Chưa có review tuần này" description="Nhìn lại tuần qua, rút ra bài học và lên kế hoạch cho tuần mới."
            action={<div className="flex flex-wrap justify-center gap-2">{offset === 0 && <Button variant="outline" className="rounded-full" onClick={autoDraft}><Wand2 className="h-4 w-4 mr-1.5" />Auto-draft</Button>}<Button className="rounded-full" onClick={() => openForm()}><Plus className="h-4 w-4 mr-1.5" />Viết review</Button></div>} />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
              <ScoreCard title="Đánh giá tuần" rating={r.overallRating} action={<EditDelete onEdit={() => openForm()} onDelete={() => setDel({ id: r.id, label: `tuần ${range}` })} />} rows={[
                { icon: '🔥', label: 'Habits hoàn thành', value: `${stats.habitChecks} · ${api.insights.habitRate}%`, pct: api.insights.habitRate, color: '#FF8A3D' },
                { icon: '✅', label: 'Tasks hoàn thành', value: stats.tasksCompleted, pct: stats.tasksCompleted ? Math.min(100, (stats.tasksCompleted / Math.max(stats.tasksCreated, stats.tasksCompleted)) * 100) : 0, color: '#7C6CF2' },
                { icon: '🍅', label: 'Pomodoro', value: stats.pomodoroCount },
                { icon: '😊', label: 'Cảm xúc trung bình', value: stats.avgMood === null ? '–' : `${stats.avgMood.toFixed(1)} / 5` },
              ]} />
              <div className="grid gap-4">
                <TextCard title="Highlight tuần" icon="⭐" tint="amber" text={r.highlight} />
                <TextCard title="Lowlight tuần" icon="🌧️" tint="sky" text={r.lowlight} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <BulletCard title="Chiến thắng tuần này" icon="🏆" tint="amber" items={r.wins} />
              <BulletCard title="Thách thức" icon="⚡" tint="rose" kind="challenges" items={r.challenges} />
              <BulletCard title="Bài học rút ra" icon="💡" tint="sky" kind="lessons" items={r.lessonsLearned} />
              <BulletCard title="Focus tuần tới" icon="🎯" tint="violet" kind="focus" items={r.nextWeekFocus} />
            </div>
            {!!r.gratitude?.length && <BulletCard title="Biết ơn" icon="🙏" tint="mint" kind="gratitude" items={r.gratitude} />}
            <AreaRatingsCard ratings={r.areaRatings} prev={previous?.areaRatings} title="Điểm Life Areas" action={<Link to="/life-wheel" className="text-[12px] font-semibold text-primary">Xem Wheel →</Link>} />
          </>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
    </div>
  );

  const statsView = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <Surface className="p-4 md:p-5">
          <SectionTitle title="Hoạt động theo ngày" hint={isMobile ? undefined : range} action={!isMobile ? nav : undefined} />
          {isMobile && <div className="mb-3">{nav}</div>}
          <GroupedBars data={api.daily} series={[{ key: 'habits', name: 'Habits', color: '#FF8A3D' }, { key: 'tasks', name: 'Tasks', color: '#7C6CF2' }, { key: 'pomodoro', name: 'Pomodoro', color: '#F2557A' }]} height={240} />
        </Surface>
        <StatStrip items={[{ label: 'Tỷ lệ habit', value: `${api.insights.habitRate}%` }, { label: 'Tasks tạo mới', value: stats.tasksCreated }, { label: 'Phút tập trung', value: api.insights.focusMin }, { label: 'Nhật ký', value: stats.journalCount }]} />
      </div>
      <InsightCard subtitle="Phân tích tuần từ dữ liệu của bạn" items={api.insights.items} empty="Chưa đủ dữ liệu trong tuần này." />
    </div>
  );

  const prompts = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(REFLECTION_PROMPTS) as PromptKey[]).map((k) => {
          const meta = PROMPT_META[k]; const q = REFLECTION_PROMPTS[k][pIdx[k] % REFLECTION_PROMPTS[k].length];
          return (
            <Surface key={k} className="p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className={cn('h-8 w-8 rounded-xl grid place-items-center text-[15px]', TINTS[meta.tint].bg)}>{meta.icon}</span>
                <p className="text-[14px] font-bold flex-1">{meta.title}</p>
                <button onClick={() => setPIdx({ ...pIdx, [k]: pIdx[k] + 1 })} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Đổi câu hỏi"><RefreshCw className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <button onClick={() => openForm({ key: PROMPT_FIELD[k], text: `${q}: ` })} className="w-full text-left rounded-2xl bg-secondary/50 hover:bg-secondary px-3.5 py-3 text-[13.5px]">“{q}”</button>
            </Surface>
          );
        })}
      </div>
      <Button variant="outline" className="w-full h-11 rounded-full bg-card" onClick={() => openForm()}><Plus className="h-4 w-4 mr-1.5" />Viết review với gợi ý</Button>
    </div>
  );

  return (
    <ReviewLayout title="Review tuần" subtitle="Nhìn lại tuần qua, rút ra bài học và lên kế hoạch tuần mới ✨"
      actions={<>{draftBtn}{writeBtn}</>}
      tabs={[{ id: 'overview', label: 'Tổng quan' }, { id: 'stats', label: 'Thống kê' }, { id: 'prompts', label: 'Gợi ý' }, { id: 'history', label: 'Lịch sử' }]} view={view} onView={setView}
      fab={{ label: r ? 'Sửa review' : 'Viết review', onClick: () => openForm() }}>
      {view === 'overview' && overview}
      {view === 'stats' && statsView}
      {view === 'prompts' && prompts}
      {view === 'history' && (
        <ReviewHistory unit="tuần" onClearAll={() => setClearOpen(true)}
          items={api.reviews.map((x) => ({ id: x.id, key: x.weekStart, short: format(api.mondayOf(x), 'dd/MM'), title: `Tuần ${format(api.mondayOf(x), 'dd/MM/yyyy')}`, subtitle: `${x.wins.length} chiến thắng · ${x.lessonsLearned.length} bài học${x.highlight ? ` · ${x.highlight}` : ''}`, rating: x.overallRating, search: [...x.wins, ...x.challenges, ...x.lessonsLearned, ...x.nextWeekFocus, x.highlight ?? '', x.lowlight ?? ''].join(' '), active: api.offsetOf(x) === offset }))}
          onOpen={(i) => { const x = api.reviews.find((y) => y.id === i.id)!; setOffset(api.offsetOf(x)); setView('overview'); }}
          onDelete={(i) => setDel({ id: i.id, label: i.title.toLowerCase() })}
          empty={<EmptyState mascot="ori" pose="learn" title="Chưa có review nào" description="Review đầu tiên sẽ xuất hiện ở đây." action={<Button className="rounded-full" onClick={() => openForm()}>Viết review</Button>} />} />
      )}
      {isMobile && view === 'overview' && <div className="mt-5">{side}</div>}

      {form && <ReviewFormModal open onOpenChange={(o) => !o && setForm(null)} title={r ? 'Chỉnh sửa review tuần' : `Review tuần ${format(weekStart, 'dd/MM')}`} ratingLabel="Đánh giá tổng quan tuần này"
        initial={form} fields={FIELDS} prevAreas={previous?.areaRatings} areasLabel="Chấm điểm các mảng cuộc sống (1–10)" areasNote="Điểm này sẽ được cập nhật vào Wheel of Life tự động" onSubmit={api.save} />}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Xóa review này?" description={`Review ${del?.label ?? ''} sẽ bị xóa và không thể hoàn tác.`} onConfirm={() => del && api.remove(del.id)} />
      <ConfirmDialog open={clearOpen} onOpenChange={setClearOpen} title="Xóa toàn bộ lịch sử review?" description="Tất cả review tuần sẽ bị xóa. Không thể hoàn tác." confirmLabel="Xóa tất cả" onConfirm={api.clear} />
    </ReviewLayout>
  );
}
