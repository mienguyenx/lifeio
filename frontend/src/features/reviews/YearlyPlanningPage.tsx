import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Circle, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/brand/EmptyState';
import { AreaTile, Empty, HeroBanner, MascotCard, PeriodNav, ProgressBar, ProgressRing, SectionTitle, StatTile, Surface, TINTS } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type YearlyGoalItem, type YearlyPlanning } from '@/types/lifeos';
import { BUCKET_CATEGORIES, GOAL_STATUS } from './utils/reviews.utils';
import { EMPTY_QUARTERS, PlanningModal, type PlanDraft } from './components/PlanningModal';
import { ConfirmDialog, ReviewLayout } from './components/ReviewLayout';
import { EditDelete, TextCard } from './components/ReviewParts';

type View = 'overview' | 'goals' | 'bucket' | 'quarters';

export default function YearlyPlanningPage() {
  const isMobile = useIsMobile();
  const plannings = useLifeOSStore((s) => s.yearlyPlannings);
  const { addYearlyPlanning, updateYearlyPlanning, deleteYearlyPlanning } = useSyncedStore();
  const cur = new Date().getFullYear();
  const [year, setYear] = useState(cur);
  const [view, setView] = useState<View>('overview');
  const [form, setForm] = useState<PlanDraft | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const p = plannings.find((x) => x.year === year);
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const openForm = () => setForm(p ? { theme: p.theme, mantra: p.mantra ?? '', reflections: p.reflections ?? '', yearlyGoals: [...p.yearlyGoals], bucketList: [...p.bucketList], quarterlyFocus: p.quarterlyFocus.length ? [...p.quarterlyFocus] : EMPTY_QUARTERS() }
    : { theme: '', mantra: '', reflections: '', yearlyGoals: [], bucketList: [], quarterlyFocus: EMPTY_QUARTERS() });
  useEffect(() => { if (params.has('add')) { openForm(); params.delete('add'); setParams(params, { replace: true }); } }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (d: PlanDraft) => {
    if (!d.theme.trim()) { toast.error('Vui lòng nhập chủ đề năm'); return false; }
    const data = { year, ...d };
    if (p) { updateYearlyPlanning(p.id, data); toast.success('Đã cập nhật kế hoạch năm!'); } else { addYearlyPlanning(data); toast.success('Đã tạo kế hoạch năm!'); }
    return true;
  };
  const setStatus = (pl: YearlyPlanning, id: string, status: YearlyGoalItem['status']) => updateYearlyPlanning(pl.id, { yearlyGoals: pl.yearlyGoals.map((g) => (g.id === id ? { ...g, status, progress: status === 'completed' ? 100 : g.progress } : g)) });
  const toggleBucket = (pl: YearlyPlanning, id: string) => updateYearlyPlanning(pl.id, { bucketList: pl.bucketList.map((b) => (b.id === id ? { ...b, completed: !b.completed, completedAt: !b.completed ? new Date().toISOString() : undefined } : b)) });

  const gs = useMemo(() => { const yg = p?.yearlyGoals ?? []; return { total: yg.length, completed: yg.filter((g) => g.status === 'completed').length, inProgress: yg.filter((g) => g.status === 'in_progress').length, planned: yg.filter((g) => g.status === 'planned').length }; }, [p]);
  const bs = { total: p?.bucketList.length ?? 0, completed: p?.bucketList.filter((b) => b.completed).length ?? 0 };
  const nav = <PeriodNav label={`Năm ${year}`} onPrev={() => setYear((y) => y - 1)} onNext={() => setYear((y) => y + 1)} onReset={year !== cur && !isMobile ? () => setYear(cur) : undefined} resetLabel="Năm nay" />;
  const others = [...plannings].sort((a, b) => b.year - a.year);

  const goalRow = (pl: YearlyPlanning, g: YearlyGoalItem) => {
    const st = GOAL_STATUS[g.status];
    return (
      <div key={g.id} className="flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 hover:bg-secondary/40">
        <AreaTile area={g.area} size={38} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-[13.5px] font-semibold truncate', g.status === 'completed' && 'line-through text-muted-foreground')}>{g.title}</p>
          <div className="flex items-center gap-2 mt-1"><ProgressBar value={g.progress} color={`hsl(var(--area-${g.area}))`} height={5} className="max-w-[160px]" /><span className="text-[11px] text-muted-foreground tabular-nums">{g.progress}%</span>{g.linkedGoalId && <span className="text-[10.5px] text-primary font-semibold">Liên kết</span>}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className={cn('h-8 pl-3 pr-2 rounded-full text-[12px] font-semibold inline-flex items-center gap-1 shrink-0', TINTS[st.tint].bg)} style={{ color: TINTS[st.tint].fg }}>{st.label}<ChevronDown className="h-3.5 w-3.5" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">{(Object.keys(GOAL_STATUS) as YearlyGoalItem['status'][]).map((k) => <DropdownMenuItem key={k} onClick={() => setStatus(pl, g.id, k)}>{GOAL_STATUS[k].label}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };
  const quarterCard = (pl: YearlyPlanning, n: number) => {
    const q = pl.quarterlyFocus.find((x) => x.quarter === n); const now = year === cur && n === currentQuarter;
    return (
      <Surface key={n} className={cn('p-4', now && 'ring-2 ring-primary/40')}>
        <div className="flex items-center justify-between mb-2"><p className="text-[14px] font-bold">Quý {n}</p>{now && <span className="text-[11px] font-semibold text-primary bg-lavender dark:bg-primary/15 rounded-full px-2.5 py-0.5">Hiện tại</span>}</div>
        {q?.focus.length ? <ul className="space-y-1.5">{q.focus.map((f, i) => <li key={i} className="text-[13px] flex gap-2"><span className="text-primary">🎯</span><span className="min-w-0 break-words">{f}</span></li>)}</ul> : <Empty>Chưa có focus</Empty>}
        {q?.review && <p className="mt-2 text-[12px] text-muted-foreground italic">“{q.review}”</p>}
      </Surface>
    );
  };

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tiến độ năm" />
        <div className="flex items-center gap-4">
          <ProgressRing value={gs.total ? (gs.completed / gs.total) * 100 : 0} size={92} stroke={10} label={gs.total ? `${Math.round((gs.completed / gs.total) * 100)}%` : '–'} />
          <ul className="flex-1 space-y-1.5 text-[12.5px]">
            {[{ l: 'Hoàn thành', v: gs.completed, c: '#22C55E' }, { l: 'Đang làm', v: gs.inProgress, c: '#3B9EFF' }, { l: 'Kế hoạch', v: gs.planned, c: '#7C6CF2' }].map((x) => <li key={x.l} className="flex justify-between"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: x.c }} />{x.l}</span><b className="tabular-nums">{x.v}</b></li>)}
          </ul>
        </div>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Các năm" />
        {others.length === 0 ? <Empty>Chưa có kế hoạch nào.</Empty> : <div className="flex flex-wrap gap-2">{others.map((x) => <button key={x.id} onClick={() => setYear(x.year)} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold', x.year === year ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>{x.year}</button>)}</div>}
      </Surface>
      <MascotCard mascot="ori" pose="explore" quote="“Một năm tuyệt vời bắt đầu từ một kế hoạch rõ ràng.” 🧭" />
    </div>
  );

  const noPlan = <EmptyState mascot="ori" pose="explore" title={`Chưa có kế hoạch cho năm ${year}`} description="Đặt chủ đề năm, mục tiêu theo lĩnh vực, bucket list và focus từng quý." action={<Button className="rounded-full" onClick={openForm}><Plus className="h-4 w-4 mr-1.5" />Lập kế hoạch</Button>} />;

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="ori" pose="explore" title={p ? `✨ ${p.theme}` : `Kế hoạch năm ${year}`} subtitle={p ? (p.mantra ? `“${p.mantra}”` : `Tầm nhìn năm ${year}`) : 'Đặt mục tiêu cho năm mới và phân bổ theo từng lĩnh vực.'} action={nav} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/goals" tint="violet" value={gs.total} label="Goals năm" onClick={() => setView('goals')} />
          <StatTile icon={<span className="text-[22px]">✅</span>} tint="mint" value={gs.completed} label="Hoàn thành" />
          <StatTile icon={<span className="text-[22px]">🚀</span>} tint="sky" value={gs.inProgress} label="Đang làm" />
          <StatTile icon={<span className="text-[22px]">📍</span>} tint="amber" value={`${bs.completed}/${bs.total}`} label="Bucket list" onClick={() => setView('bucket')} />
        </div>
        {!p ? noPlan : (
          <>
            <Surface className="p-4 md:p-5">
              <SectionTitle title="Tiến độ goals theo lĩnh vực" action={<EditDelete onEdit={openForm} onDelete={() => setDelOpen(true)} />} />
              {p.yearlyGoals.length === 0 ? <Empty>Chưa có goals nào.</Empty> : (
                <ul className="space-y-2.5">{LIFE_AREAS.map((a) => {
                  const ag = p.yearlyGoals.filter((g) => g.area === a.id); if (!ag.length) return null;
                  const done = ag.filter((g) => g.status === 'completed').length;
                  return <li key={a.id} className="grid grid-cols-[24px_100px_1fr_44px] items-center gap-2 text-[12.5px]"><span>{a.icon}</span><span className="truncate">{a.name}</span><ProgressBar value={(done / ag.length) * 100} color={`hsl(var(--area-${a.id}))`} height={7} /><span className="text-right text-muted-foreground tabular-nums">{done}/{ag.length}</span></li>;
                })}</ul>
              )}
            </Surface>
            <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((n) => quarterCard(p, n))}</div>
            {p.reflections && <TextCard title="Suy ngẫm" icon="📖" tint="violet" text={p.reflections} />}
          </>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
    </div>
  );

  return (
    <ReviewLayout title="Kế hoạch năm" subtitle="Đặt mục tiêu cho năm mới và phân bổ theo từng lĩnh vực 🧭"
      actions={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openForm}>{p ? <><Pencil className="h-4 w-4 mr-1.5" />Sửa kế hoạch</> : <><Plus className="h-4 w-4 mr-1.5" />Lập kế hoạch</>}</Button>}
      tabs={[{ id: 'overview', label: 'Tổng quan' }, { id: 'goals', label: `Goals (${gs.total})` }, { id: 'bucket', label: `Bucket (${bs.total})` }, { id: 'quarters', label: 'Theo quý' }]} view={view} onView={setView}
      fab={{ label: p ? 'Sửa kế hoạch' : 'Lập kế hoạch', onClick: openForm }}>
      {view === 'overview' && overview}
      {view === 'goals' && (!p ? noPlan : p.yearlyGoals.length === 0 ? <EmptyState mascot="ori" compact title="Chưa có goals năm" description="Nhấn “Sửa kế hoạch” để thêm." /> : (
        <div className="space-y-4">{LIFE_AREAS.filter((a) => p.yearlyGoals.some((g) => g.area === a.id)).map((a) => (
          <Surface key={a.id} className="p-2.5"><p className="px-2.5 pt-1.5 pb-1 text-[12.5px] font-bold text-muted-foreground">{a.icon} {a.name}</p>{p.yearlyGoals.filter((g) => g.area === a.id).map((g) => goalRow(p, g))}</Surface>
        ))}</div>
      ))}
      {view === 'bucket' && (!p ? noPlan : p.bucketList.length === 0 ? <EmptyState mascot="ori" compact title="Chưa có bucket list" description="Nhấn “Sửa kế hoạch” để thêm." /> : (
        <div className="grid gap-4 md:grid-cols-2 items-start">{BUCKET_CATEGORIES.map((c) => {
          const items = p.bucketList.filter((b) => (b.category || 'other') === c.id); if (!items.length) return null;
          return (
            <Surface key={c.id} className="p-3">
              <div className="flex items-center gap-2 px-1.5 pb-2"><span className="h-8 w-8 rounded-xl grid place-items-center" style={{ background: `${c.color}22` }}>{c.icon}</span><p className="text-[14px] font-bold flex-1">{c.label}</p><span className="text-[11.5px] text-muted-foreground tabular-nums">{items.filter((b) => b.completed).length}/{items.length}</span></div>
              {items.map((b) => (
                <button key={b.id} onClick={() => toggleBucket(p, b.id)} className="w-full flex items-center gap-2.5 rounded-2xl px-2 py-2 hover:bg-secondary/50 text-left">
                  {b.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />}
                  <span className={cn('text-[13px] flex-1 min-w-0 break-words', b.completed && 'line-through text-muted-foreground')}>{b.title}</span>
                </button>
              ))}
            </Surface>
          );
        })}</div>
      ))}
      {view === 'quarters' && (!p ? noPlan : <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((n) => quarterCard(p, n))}</div>)}
      {isMobile && view === 'overview' && <div className="mt-5">{side}</div>}
      {form && <PlanningModal open onOpenChange={(o) => !o && setForm(null)} year={year} isEdit={!!p} initial={form} onSubmit={save} />}
      <ConfirmDialog open={delOpen} onOpenChange={setDelOpen} title={`Xóa kế hoạch năm ${year}?`} description="Chủ đề, goals năm, bucket list và focus theo quý sẽ bị xóa. Không thể hoàn tác." onConfirm={() => { if (p) { deleteYearlyPlanning(p.id); toast.success('Đã xóa kế hoạch năm'); } }} />
    </ReviewLayout>
  );
}
