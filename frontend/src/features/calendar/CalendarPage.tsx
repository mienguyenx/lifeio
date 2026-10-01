import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDays, addMonths, addWeeks, format, max as maxDate, min as minDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Fab, Page, PageHeader, SearchToggle, SegmentedTabs } from '@/components/lio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import type { Task } from '@/types/lifeos';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { HabitDetailModal } from '@/features/habits/components/HabitDetailModal';
import { useCalendar } from './hooks/useCalendar';
import type { CalendarItem, CalendarItemType, CalendarView, EventDraft } from './types/calendar.types';
import { ALL_TYPES, WEEKDAYS, dayLabel, fromKey, key, periodLabel, rangeOf, sortItems, todayKey } from './utils/calendar.utils';
import { MonthView } from './components/MonthView';
import { TimeGridView } from './components/TimeGridView';
import { AgendaView } from './components/AgendaView';
import { MiniCalendar } from './components/MiniCalendar';
import { FocusCard, QuickAddBox, QuoteCard, TodayPanel } from './components/CalendarSidePanel';
import { CalendarFilters } from './components/CalendarFilters';
import { EventModal } from './components/EventModal';
import { EventDetail } from './components/EventDetail';
import { EventRow } from './components/EventChip';

const VIEW_KEY = 'lifeos.calendar.view';
const VIEWS: { id: CalendarView; label: string; short: string }[] = [
  { id: 'month', label: 'Tháng', short: 'Tháng' },
  { id: 'week', label: 'Tuần', short: 'Tuần' },
  { id: 'day', label: 'Ngày', short: 'Ngày' },
  { id: 'agenda', label: 'Danh sách', short: 'DS' },
];

export default function CalendarPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setViewState] = useState<CalendarView>(() => (localStorage.getItem(VIEW_KEY) as CalendarView) || 'week');
  const setView = (v: CalendarView) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };
  const [anchor, setAnchor] = useState(() => fromKey(todayKey()));
  const [types, setTypes] = useState<CalendarItemType[]>(ALL_TYPES);
  const [search, setSearch] = useState('');
  const [addInit, setAddInit] = useState<Partial<EventDraft> | null>(null);
  const [detail, setDetail] = useState<CalendarItem | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [habitSel, setHabitSel] = useState<{ id: string; date: string } | null>(null);

  // Mobile mặc định xem theo ngày
  const effView: CalendarView = view;
  const range = useMemo(() => rangeOf(effView, anchor), [effView, anchor]);
  const month = useMemo(() => rangeOf('month', anchor), [anchor]);
  const loadStart = key(minDate([range.start, month.start]));
  const loadEnd = key(maxDate([range.end, month.end]));
  const cal = useCalendar(loadStart, loadEnd);
  const taskApi = useTasks();
  const habitApi = useHabits();
  const startPomodoro = usePomodoroStore((s) => s.start);

  useEffect(() => {
    if (params.has('add') || params.get('new') === '1') {
      setAddInit({ date: key(anchor) });
      params.delete('add'); params.delete('new'); setParams(params, { replace: true });
    }
  }, [params, setParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cal.items.filter((i) => types.includes(i.type) && (!q || i.title.toLowerCase().includes(q)));
  }, [cal.items, types, search]);
  const byDate = useMemo(() => {
    const m: Record<string, CalendarItem[]> = {};
    filtered.forEach((i) => (m[i.date] ||= []).push(i));
    Object.values(m).forEach((l) => l.sort(sortItems));
    return m;
  }, [filtered]);
  const marks = useMemo(() => new Set(Object.keys(byDate)), [byDate]);

  const sel = key(anchor);
  const selItems = byDate[sel] || [];
  const today = todayKey();
  const todayAll = cal.items.filter((i) => i.date === today && i.type !== 'pomodoro');
  const donePct = todayAll.length ? Math.round((todayAll.filter((i) => i.completed).length / todayAll.length) * 100) : 0;

  const step = (dir: 1 | -1) => setAnchor((a) => effView === 'month' ? addMonths(a, dir) : effView === 'week' ? addWeeks(a, dir) : effView === 'day' ? addDays(a, dir) : addDays(a, dir * 30));
  const goToday = () => setAnchor(fromKey(todayKey()));
  const toggleType = (t: CalendarItemType) => setTypes((p) => (p.includes(t) ? (p.length > 1 ? p.filter((x) => x !== t) : p) : [...p, t]));

  const open = useCallback((i: CalendarItem) => {
    if (i.type === 'task') setTaskId(i.refId);
    else if (i.type === 'habit') setHabitSel({ id: i.refId, date: i.date });
    else setDetail(i);
  }, []);
  const add = (k: string, time?: string) => setAddInit({ date: k, ...(time ? { time } : {}) });
  const drop = (taskId: string, k: string, time?: string) => {
    if (!taskApi.tasks.some((t) => t.id === taskId)) return;
    cal.moveTask(taskId, k, time);
    toast.success('Đã dời lịch', { description: `${dayLabel(k)}${time ? ` · ${time}` : ''}` });
  };
  const onFocus = useCallback((t: Task) => {
    startPomodoro(t.id);
    if (t.status === 'todo') taskApi.setStatus(t, 'in_progress');
    toast.success('Bắt đầu Focus 25 phút', { description: t.title });
  }, [startPomodoro, taskApi]);

  const task = taskApi.tasks.find((t) => t.id === taskId) ?? null;
  const habit = habitSel ? habitApi.habits.find((h) => h.id === habitSel.id) ?? null : null;

  const mainView = (
    effView === 'month' ? (
      <MonthView anchor={anchor} selected={sel} byDate={byDate} mobile={isMobile} onSelect={(k) => setAnchor(fromKey(k))} onOpen={open} onAdd={add} onDropTask={(id, k) => drop(id, k)} />
    ) : effView === 'week' ? (
      <TimeGridView days={range.days} byDate={byDate} compact={isMobile} onOpen={open} onAdd={add} onDropTask={drop} />
    ) : effView === 'day' ? (
      isMobile ? null : <TimeGridView days={range.days} byDate={byDate} onOpen={open} onAdd={add} onDropTask={drop} />
    ) : (
      <AgendaView dayKeys={range.days.map(key)} byDate={byDate} onOpen={open} />
    )
  );

  const viewSwitch = (
    <SegmentedTabs size="sm" full={isMobile} value={effView} onChange={setView} items={VIEWS.map((v) => ({ id: v.id, label: isMobile ? v.short : v.label }))} />
  );

  /** Dải tuần cho mobile (chế độ Ngày/Tuần). */
  const weekStrip = (
    <div className="grid grid-cols-7 gap-1 rounded-[22px] bg-card border border-border/60 shadow-soft p-2">
      {rangeOf('week', anchor).days.map((d, i) => {
        const k = key(d); const on = k === sel;
        return (
          <button key={k} onClick={() => setAnchor(d)} className={cn('flex flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-all', on ? 'bg-primary text-primary-foreground shadow-soft' : k === today ? 'text-primary' : '')}>
            <span className={cn('text-[10.5px] font-semibold', !on && 'text-muted-foreground')}>{WEEKDAYS[i]}</span>
            <span className="text-[15px] font-bold">{format(d, 'd')}</span>
            <span className={cn('h-1 w-1 rounded-full', byDate[k]?.length ? (on ? 'bg-white' : 'bg-primary/70') : 'bg-transparent')} />
          </button>
        );
      })}
    </div>
  );

  return (
    <Page>
      <PageHeader className="mb-4" title="Lịch" subtitle="Lên kế hoạch hôm nay, ngày mai tươi sáng hơn ✨"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm trong lịch..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => add(sel)}><Plus className="h-4 w-4 mr-1.5" />Thêm sự kiện</Button>}
        </>} />

      {/* Toolbar */}
      <div className={cn('flex items-center gap-2 mb-3', isMobile && 'flex-wrap')}>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => step(-1)} aria-label="Trước"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => step(1)} aria-label="Sau"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" className="h-9 rounded-full px-4 ml-1" onClick={goToday}>Hôm nay</Button>
        </div>
        <h2 className={cn('font-bold ml-2 truncate', isMobile ? 'text-[15px]' : 'text-[18px]')}>{periodLabel(effView, anchor)}</h2>
        {!isMobile && <div className="ml-auto">{viewSwitch}</div>}
      </div>
      {isMobile && <div className="mb-3">{viewSwitch}</div>}
      <CalendarFilters active={types} onToggle={toggleType} counts={cal.countBy} className="mb-4 -mx-1 px-1 pb-0.5" />

      {isMobile ? (
        <div className="space-y-4">
          {effView === 'day' && weekStrip}
          {mainView}
          {(effView === 'day' || effView === 'month') && (
            <section className="space-y-2">
              <h3 className="px-1 text-[14px] font-bold">{sel === today ? 'Hôm nay' : dayLabel(sel)} <span className="text-muted-foreground font-medium text-[12px]">· {selItems.length} mục</span></h3>
              {selItems.length ? (
                <div className="space-y-2">
                  {selItems.map((it) => (
                    <div key={it.id} className="flex gap-2.5 items-start">
                      <span className="w-11 shrink-0 pt-3.5 text-right text-[11.5px] font-semibold text-muted-foreground tabular-nums">{it.start || 'Cả ngày'}</span>
                      <div className="flex-1 min-w-0"><EventRow item={it} onClick={() => open(it)} /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-1 text-[13px] text-muted-foreground">Chưa có gì. Bấm + để thêm sự kiện.</p>
              )}
            </section>
          )}
          <Fab onClick={() => add(sel)} label="Thêm sự kiện" />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">{mainView}</div>
          <aside className="space-y-4">
            <MiniCalendar key={format(anchor, 'yyyy-MM')} selected={anchor} onSelect={setAnchor} marks={marks} />
            <TodayPanel title={sel === today ? 'Hôm nay' : dayLabel(sel)} items={selItems} onOpen={open} />
            <QuickAddBox dateLabel={sel === today ? 'hôm nay' : format(anchor, 'd/M')} onAdd={(title) => cal.createEvent({ ...({} as EventDraft), kind: 'todo', title, description: '', date: sel, time: '', allDay: true, repeat: 'none', priority: 'medium', reminderMinutes: 0, goalId: '' })} />
            <FocusCard minutes={cal.focusToday.minutes} sessions={cal.focusToday.sessions} donePct={donePct} />
            <QuoteCard />
          </aside>
        </div>
      )}

      <EventModal open={!!addInit} onOpenChange={(o) => !o && setAddInit(null)} initial={addInit || {}} goals={cal.goals} onCreate={cal.createEvent} />
      <EventDetail item={detail} onOpenChange={(o) => !o && setDetail(null)} />
      <TaskDetailModal task={task} open={!!task} onOpenChange={(o) => !o && setTaskId(null)} api={taskApi} onFocus={onFocus} />
      <HabitDetailModal
        habit={habit}
        open={!!habit}
        onOpenChange={(o) => !o && setHabitSel(null)}
        date={habitSel?.date || today}
        api={habitApi}
        onEdit={() => navigate('/habits')}
        onDelete={(h) => { if (window.confirm(`Chuyển “${h.name}” vào thùng rác?`)) { habitApi.deleteHabit(h.id); setHabitSel(null); toast.success('Đã chuyển vào thùng rác'); } }}
      />
    </Page>
  );
}
