import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Fab, Page, PageHeader, SearchToggle } from '@/components/lio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskReminder } from '@/hooks/useTaskReminder';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { LifeArea } from '@/types/lifeos';
import type { BoardColumnId, Task, TaskDraft, TaskPriority, TaskTab, TaskView } from './types/task.types';
import { useTasks } from './hooks/useTasks';
import { todayKey } from './utils/task.utils';
import { TaskStats } from './components/TaskStats';
import { TaskFilterPopover, TaskTabs, ViewSwitcher } from './components/TaskFilter';
import { TaskList } from './components/TaskList';
import { TaskBoard } from './components/TaskBoard';
import { TaskCalendar } from './components/TaskCalendar';
import { TaskQuickAdd } from './components/TaskQuickAdd';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskEmptyState } from './components/TaskEmptyState';
import { TaskSidePanel } from './components/TaskSidePanel';
import type { TaskItemActions } from './components/TaskItem';

const VIEW_KEY = 'lifeos.tasks.view';
const MOBILE_TABS: TaskTab[] = ['today', 'upcoming', 'overdue', 'completed', 'all'];

export default function TasksPage() {
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  useTaskReminder();
  const autoArchive = useLifeOSStore((s) => s.autoArchiveOldTasks);
  useEffect(() => { autoArchive(); }, [autoArchive]);

  const [view, setViewState] = useState<TaskView>(() => (params.get('view') as TaskView) || (localStorage.getItem(VIEW_KEY) as TaskView) || 'list');
  const setView = (v: TaskView) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };
  const [tab, setTab] = useState<TaskTab>(isMobile ? 'today' : 'all');
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
    if (params.get('new') === '1') {
      openQuick();
      params.delete('new');
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
    return <TaskList tasks={api.filtered} mobile={isMobile} {...actions} />;
  })();

  const modals = (
    <>
      <TaskQuickAdd open={quickOpen} onOpenChange={setQuickOpen} initial={quickInitial} onCreate={api.createTask} />
      <TaskDetailModal task={detailTask} open={!!detailTask} onOpenChange={(o) => !o && setDetailId(null)} api={api} onFocus={onFocus} />
    </>
  );

  // ─────────────── Mobile ───────────────
  if (isMobile) {
    return (
      <Page className="space-y-4">
        <PageHeader className="mb-0" title="Công việc" subtitle={`${api.counts.today} việc hôm nay · ${api.counts.overdue} quá hạn`}
          actions={<SearchToggle value={search} onChange={setSearch} placeholder="Tìm công việc…" />} />
        <div className="flex items-center justify-between gap-2">
          <ViewSwitcher view={view} onView={setView} />
          <TaskFilterPopover area={area} priority={priority} onArea={setArea} onPriority={setPriority} />
        </div>
        {view === 'list' && <TaskTabs tab={tab} onTab={setTab} counts={api.counts} tabs={MOBILE_TABS} className="-mx-4 px-4" />}
        {content}
        <Fab onClick={() => openQuick()} label="Thêm công việc" />
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
