import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownAZ, ArrowUpAZ, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, FilterChips, IconButton, Page, PageHeader, SearchToggle, SegmentedTabs, StatTile } from '@/components/lio';
import { GoalHistoryDialog } from '@/components/goals/GoalHistoryDialog';
import { useGoalReminder } from '@/hooks/useGoalReminder';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Goal, type LifeArea } from '@/types/lifeos';
import { useGoals } from './hooks/useGoals';
import { formFromGoal, isApproaching, isOverdue, matchesTab, sortGoals, type GoalDeadline, type GoalSortBy, type GoalTab, type GoalFormValue } from './utils/goal.utils';
import { GoalRow } from './components/GoalRow';
import { GoalCreateModal } from './components/GoalCreateModal';
import { GoalDetailModal } from './components/GoalDetailModal';
import { GoalInsights } from './components/GoalInsights';
import { GoalSidePanel } from './components/GoalSidePanel';

type View = 'overview' | 'insights';
const SORTS: { id: GoalSortBy; label: string }[] = [
  { id: 'progress', label: 'Tiến độ' }, { id: 'deadline', label: 'Hạn chót' }, { id: 'created', label: 'Ngày tạo' }, { id: 'title', label: 'Tên' }, { id: 'area', label: 'Lĩnh vực' },
];

export default function GoalsPage() {
  useGoalReminder();
  const isMobile = useIsMobile();
  const api = useGoals();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [tab, setTab] = useState<GoalTab>('all');
  const [deadline, setDeadline] = useState<GoalDeadline>('all');
  const [area, setArea] = useState<LifeArea | 'all'>('all');
  const [sortBy, setSortBy] = useState<GoalSortBy>('progress');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Goal | null>(null);

  useEffect(() => {
    if (params.has('add')) { setEditing(null); setFormOpen(true); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const { goals, stats } = api;
  const lockedOf = useMemo(() => {
    const m = new Map<string, boolean>();
    goals.forEach((g) => { const deps = g.dependencies || []; m.set(g.id, !g.completedAt && deps.length > 0 && !deps.every((id) => goals.find((x) => x.id === id)?.completedAt)); });
    return m;
  }, [goals]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortGoals(goals.filter((g) => matchesTab(g, tab) && (area === 'all' || g.area === area)
      && (deadline === 'all' || (deadline === 'overdue' ? isOverdue(g) : isApproaching(g)))
      && (!q || g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))), sortBy, order)
      .sort((a, b) => Number(!!b.isFocused && !b.completedAt) - Number(!!a.isFocused && !a.completedAt));
  }, [goals, tab, area, deadline, search, sortBy, order]);

  const counts = { all: goals.length, active: stats.active, completed: stats.completed, paused: stats.paused };
  const tabs = [{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'active', label: 'Đang thực hiện', count: counts.active }, { id: 'completed', label: 'Đã hoàn thành', count: counts.completed }, { id: 'paused', label: 'Tạm dừng', count: counts.paused }] as { id: GoalTab; label: string; count: number }[];
  const detail = api.byId(detailId);
  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const submit = (f: GoalFormValue) => { if (editing) api.edit(editing, f); else api.create(f); setFormOpen(false); setEditing(null); };

  const filters = (
    <div className={cn('flex items-center gap-2', isMobile ? 'overflow-x-auto no-scrollbar -mx-1 px-1' : 'ml-auto')}>
      <Select value={area} onValueChange={(v) => setArea(v as LifeArea | 'all')}>
        <SelectTrigger className="h-9 w-[150px] rounded-full bg-card shrink-0"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tất cả lĩnh vực</SelectItem>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={deadline} onValueChange={(v) => setDeadline(v as GoalDeadline)}>
        <SelectTrigger className="h-9 w-[140px] rounded-full bg-card shrink-0"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Mọi thời hạn</SelectItem><SelectItem value="approaching">Sắp đến hạn</SelectItem><SelectItem value="overdue">Quá hạn</SelectItem></SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as GoalSortBy)}>
        <SelectTrigger className="h-9 w-[160px] rounded-full bg-card shrink-0"><SelectValue /></SelectTrigger>
        <SelectContent>{SORTS.map((s) => <SelectItem key={s.id} value={s.id}>Sắp xếp: {s.label}</SelectItem>)}</SelectContent>
      </Select>
      <IconButton label={order === 'asc' ? 'Tăng dần' : 'Giảm dần'} onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')} className="h-9 w-9">
        {order === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
      </IconButton>
    </div>
  );

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/goals" tint="violet" value={stats.total} label="Tổng mục tiêu" onClick={() => setTab('all')} active={tab === 'all'} />
          <StatTile icon="status/syncing" tint="sky" value={stats.active} label="Đang thực hiện" onClick={() => setTab('active')} active={tab === 'active'} />
          <StatTile icon="status/success" tint="mint" value={stats.completed} label="Đã hoàn thành" onClick={() => setTab('completed')} active={tab === 'completed'} />
          <StatTile icon="status/warning" tint="amber" value={stats.paused} label="Tạm dừng" onClick={() => setTab('paused')} active={tab === 'paused'} />
        </div>
        <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'items-center flex-wrap')}>
          <FilterChips items={tabs} value={tab} onChange={setTab} />
          {filters}
        </div>
        {list.length === 0 ? (
          goals.length === 0
            ? <EmptyState mascot="lumi" pose="happy" title="Đặt mục tiêu đầu tiên" description="Biến ước mơ thành kế hoạch — bắt đầu với một mục tiêu nhỏ nhé!" action={<Button className="rounded-full" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm mục tiêu</Button>} />
            : <EmptyState mascot="lumi" compact title="Không có mục tiêu phù hợp" description="Thử đổi bộ lọc hoặc từ khóa nhé." />
        ) : (
          <div className="space-y-2.5">
            {list.map((g) => <GoalRow key={g.id} goal={g} locked={lockedOf.get(g.id)} api={api} onOpen={() => setDetailId(g.id)} onDelete={() => setToDelete(g)} />)}
          </div>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4"><GoalSidePanel api={api} area={area} onArea={setArea} /></aside>}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Mục tiêu"
        subtitle="Mỗi mục tiêu đều bắt đầu từ một bước nhỏ hôm nay ✨"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm kiếm mục tiêu..." />
          <div className="[&>button]:h-10 [&>button]:rounded-full [&>button]:px-4 [&>button]:bg-card [&>button]:shadow-soft">
            <GoalHistoryDialog onViewDetail={(g) => setDetailId(g.id)} />
          </div>
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm mục tiêu</Button>}
        </>}
      />
      <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'insights', label: 'Thống kê' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />
      {view === 'overview' ? overview : <GoalInsights api={api} />}
      {isMobile && <Fab onClick={openCreate} label="Thêm mục tiêu" />}

      <GoalCreateModal open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} mode={editing ? 'edit' : 'create'} initial={editing ? formFromGoal(editing) : undefined} onSubmit={submit} />
      <GoalDetailModal goal={detail} open={!!detail} onOpenChange={(o) => !o && setDetailId(null)} api={api} locked={detail ? lockedOf.get(detail.id) : false}
        onEdit={(g) => { setDetailId(null); setEditing(g); setFormOpen(true); }} onDelete={(g) => setToDelete(g)} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mục tiêu “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Mục tiêu sẽ được chuyển vào thùng rác, bạn có thể khôi phục sau.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) { api.remove(toDelete); if (detailId === toDelete.id) setDetailId(null); } setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
