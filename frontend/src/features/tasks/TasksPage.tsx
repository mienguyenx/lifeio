import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Maximize2, Plus } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { Page, PageHeader, SearchToggle } from '@/components/lio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { LifeArea } from '@/types/lifeos';
import type { BoardColumnId, Task, TaskDraft, TaskPriority, TaskTab, TaskView } from './types/task.types';
import { useTasks } from './hooks/useTasks';
import { todayKey } from './utils/task.utils';
import { TaskStats } from './components/TaskStats';
import { TaskFilterPopover, TaskTabs, ViewMenu, ViewSwitcher } from './components/TaskFilter';
import { TaskList } from './components/TaskList';
import { TaskBoard } from './components/TaskBoard';
import { TaskCalendar } from './components/TaskCalendar';
import { TaskQuickAdd } from './components/TaskQuickAdd';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskEmptyState } from './components/TaskEmptyState';
import { TaskSidePanel } from './components/TaskSidePanel';
import type { TaskItemActions } from './components/TaskItem';
import { SwipeHint, type TaskMobileExtra } from './components/TaskMobileRow';

const VIEW_KEY = 'lifeos.tasks.view';
const MOBILE_TABS: TaskTab[] = ['today', 'upcoming', 'overdue', 'completed', 'all'];

export default function TasksPage() {
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const autoArchive = useLifeOSStore((s) => s.autoArchiveOldTasks);
  useEffect(() => { autoArchive(); }, [autoArchive]);

  const [view, setViewState] = useState<TaskView>(() => (params.get('view') as TaskView) || (localStorage.getItem(VIEW_KEY) as TaskView) || 'list');
  const setView = (v: TaskView) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };
  const tabParam = params.get('tab') as TaskTab | null;
  const [tab, setTab] = useState<TaskTab>(tabParam || (isMobile ? 'today' : 'all'));
  // Liên kết từ nơi khác (VD lệnh giọng nói “Xem”) → chuyển đúng tab.
  useEffect(() => { if (tabParam) setTab(tabParam); }, [tabParam]);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<LifeArea | 'all'>('all');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');

  // Board & calendar need every status, so they ignore the tab filter.
  const query = useMemo(() => ({ tab, search, area, priority }), [tab, search, area, priority]);
  const api = useTasks(query);
  const boardSource = useMemo(() => {
    const q = search.trim().toLowerCase();
    return api.tasks.filter((t) =>
      (area === 'all' || t.area === area) && (priority === 'all' || t.priority === priority) &&
      (!q || t.title.toLowerCase().includes(q)));
  }, [api.tasks, search, area, priority]);

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickInitial, setQuickInitial] = useState<Partial<TaskDraft> | undefined>();
  const openQuick = useCallback((init?: Partial<TaskDraft>) => { setQuickInitial(init); setQuickOpen(true); }, []);

  useEffect(() => {
    if (params.get('new') === '1' || params.has('add')) {
      openQuick();
      params.delete('new'); params.delete('add');
      setParams(params, { replace: true });
    }
  }, [params, setParams, openQuick]);

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailTask = api.tasks.find((t) => t.id === detailId) ?? null;

  const startPomodoro = usePomodoroStore((s) => s.start);
  const onFocus = useCallback((t: Task) => {
    startPomodoro(t.id);
    if (t.status === 'todo') api.setStatus(t, 'in_progress');
    toast.success('Bắt đầu Focus 25 phút', { description: t.title });
  }, [startPomodoro, api]);

  const actions: TaskItemActions = {
    onOpen: (t) => setDetailId(t.id),
    onToggle: api.toggleTaskCompletion,
    onStatus: api.setStatus,
    onFocus,
    onDelete: api.deleteTask,
  };

  const extra: TaskMobileExtra = {
    onSubToggle: (t, id) => api.toggleSubtaskSmart(t, id),
    onSubAdd: (t, title) => api.addSubtasks(t.id, [title]),
    onPostpone: (t) => { api.updateTask(t.id, { dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd') }); toast('Đã dời sang ngày mai', { description: t.title }); },
  };
  const [quickTitle, setQuickTitle] = useState('');
  const quickDue = tab === 'today' ? todayKey() : tab === 'upcoming' ? format(addDays(new Date(), 1), 'yyyy-MM-dd') : undefined;
  const quickCreate = async () => {
    const title = quickTitle.trim(); if (!title) return;
    setQuickTitle('');
    await api.createTask({ title, priority: 'medium', dueDate: quickDue, repeat: 'none' });
  };
  const [hint, setHint] = useState(() => { try { return !localStorage.getItem('lifeos.tasks.swipeHint'); } catch { return false; } });
  const closeHint = () => { setHint(false); try { localStorage.setItem('lifeos.tasks.swipeHint', '1'); } catch { /* ignore */ } };

  const searching = !!search.trim() || area !== 'all' || priority !== 'all';
  const listEmpty = api.filtered.length === 0;

  const content = (() => {
    if (view === 'board') {
      return <TaskBoard tasks={boardSource} onAddIn={(col: BoardColumnId) => openQuick({ status: col })} {...actions} />;
    }
    if (view === 'calendar') {
      return <TaskCalendar tasks={boardSource} mobile={isMobile} onAddOn={(d) => openQuick({ dueDate: d })} {...actions} />;
    }
    if (listEmpty) {
      return (
        <div className={cn(!isMobile && 'rounded-[24px] bg-card border border-border/70 shadow-soft')}>
          <TaskEmptyState tab={tab} searching={searching} onAdd={() => openQuick()} />
        </div>
      );
    }
    return <TaskList tasks={api.filtered} mobile={isMobile} extra={isMobile ? extra : undefined} tree={{ byId: api.byId, childrenOf: api.childrenOf }} {...actions} />;
  })();

  const modals = (
    <>
      <TaskQuickAdd open={quickOpen} onOpenChange={setQuickOpen} initial={quickInitial} onCreate={api.createTask} />
      <TaskDetailModal task={detailTask} open={!!detailTask} onOpenChange={(o) => !o && setDetailId(null)} api={api} onFocus={onFocus} onOpenTask={setDetailId} />
    </>
  );

  // ─────────────── Mobile ───────────────
  if (isMobile) {
    return (
      <Page className="space-y-3.5">
        <PageHeader className="mb-0" title="Công việc" subtitle={`${api.counts.today} việc hôm nay · ${api.counts.overdue} quá hạn`}
          actions={<>
            <SearchToggle value={search} onChange={setSearch} placeholder="Tìm công việc…" />
            <ViewMenu view={view} onView={setView} />
            <TaskFilterPopover compact area={area} priority={priority} onArea={setArea} onPriority={setPriority} />
          </>} />
        {view === 'list'
          ? <TaskTabs tab={tab} onTab={setTab} counts={{ ...api.counts, today: api.counts.today + api.counts.overdue }} tabs={MOBILE_TABS} className="-mx-4 px-4" />
          : <p className="text-[12.5px] text-muted-foreground">{view === 'board' ? 'Kéo thẻ để đổi trạng thái' : 'Chạm một ngày để thêm việc'}</p>}
        {view === 'list' && (
          <form onSubmit={(e) => { e.preventDefault(); quickCreate(); }} className="flex items-center gap-2 rounded-full bg-card border border-border/70 shadow-soft pl-4 pr-1.5 h-12 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
            <Plus className="h-4 w-4 text-primary shrink-0" />
            <input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} enterKeyHint="done"
              placeholder={tab === 'today' ? 'Thêm việc cho hôm nay…' : tab === 'upcoming' ? 'Thêm việc cho ngày mai…' : 'Thêm việc…'}
              className="flex-1 min-w-0 bg-transparent text-[14px] focus:outline-none placeholder:text-muted-foreground" />
            {quickTitle.trim()
              ? <Button type="submit" size="sm" className="h-9 rounded-full px-4">Thêm</Button>
              : <button type="button" onClick={() => openQuick({ dueDate: quickDue })} aria-label="Mở form đầy đủ" className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Maximize2 className="h-4 w-4" /></button>}
          </form>
        )}
        {view === 'list' && hint && !listEmpty && <SwipeHint onClose={closeHint} />}
        {content}
        {modals}
      </Page>
    );
  }

  // ─────────────── Desktop ───────────────
  const showSide = view === 'list';
  return (
    <Page className="space-y-5">
      <PageHeader className="mb-0" title="Công việc" subtitle="Biến kế hoạch thành tiến bộ mỗi ngày ✨"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm công việc…" />
          <Button onClick={() => openQuick()} className="h-10 rounded-full px-5 shadow-soft"><Plus className="h-4 w-4 mr-1.5" />Thêm việc</Button>
        </>} />

      <TaskStats counts={api.counts} tab={tab} onPick={(t) => { setTab(t); setView('list'); }} />

      <div className="flex flex-wrap items-center gap-3">
        {view === 'list'
          ? <TaskTabs tab={tab} onTab={setTab} counts={api.counts} className="mr-auto" />
          : <p className="mr-auto text-[13px] text-muted-foreground">{view === 'board' ? 'Kéo thả thẻ để đổi trạng thái' : 'Bấm vào một ngày để thêm việc'}</p>}
        <TaskFilterPopover area={area} priority={priority} onArea={setArea} onPriority={setPriority} />
        <ViewSwitcher view={view} onView={setView} />
      </div>

      <div className={cn('grid gap-5 items-start', showSide && 'xl:grid-cols-[minmax(0,1fr)_300px]')}>
        <div className="min-w-0">{content}</div>
        {showSide && <div className="hidden xl:block sticky top-4"><TaskSidePanel tasks={api.tasks} counts={api.counts} onAdd={() => openQuick({ dueDate: todayKey() })} /></div>}
      </div>
      {modals}
    </Page>
  );
}
