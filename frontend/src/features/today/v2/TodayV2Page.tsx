import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Flame, Moon, Play, Plus, Sun, Sunrise, Sunset } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Page, PageHeader, SectionTitle, SegmentedTabs, Surface, Empty, ProgressBar } from '@/components/lio';
import { AISuggestionsCard } from '@/components/ai/AISuggestionsCard';
import { HabitRescueCard } from '@/components/today/HabitRescueCard';
import { EveningReview } from '@/components/today/EveningReview';
import { TodayAddTaskModal } from '@/components/today/TodayAddTaskModal';
import { TodayAddHabitModal } from '@/components/today/TodayAddHabitModal';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import type { Habit, Task } from '@/types/lifeos';
import { useTodayModel, type TodayModel } from './useTodayModel';
import { Check0, Collapse, HabitLine, HealthMini, IntentionLine, TaskLine, TodayHello, WeekCard } from './parts';

/* ═════════════ Phương án 1 — “Việc tiếp theo + 1 danh sách” ═════════════ */

function NextUpCard({ m }: { m: TodayModel }) {
  const running = usePomodoroStore((s) => s.isRunning);
  const next = m.openTasks[0];
  if (m.hour >= 19 && m.userPreferences?.eveningReviewEnabled !== false) {
    const ev = <EveningReview />;
    if (ev) return ev;
  }
  return (
    <Surface className="p-4 space-y-3">
      <IntentionLine m={m} />
      {running ? (
        <div className="flex items-center gap-3 rounded-[18px] bg-primary/10 px-3.5 py-3">
          <Clock className="w-5 h-5 text-primary" /><span className="flex-1 text-[13.5px] font-semibold text-primary">Đang trong phiên tập trung…</span>
        </div>
      ) : next ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[18px] bg-gradient-to-r from-primary to-[#8B7CF6] text-primary-foreground px-4 py-3.5 shadow-soft">
          <span className="min-w-0 flex-1 w-full">
            <span className="block text-[11px] font-semibold opacity-80 uppercase tracking-wide">Việc tiếp theo{m.overdueTasks.includes(next) && ' · quá hạn'}</span>
            <span className="block text-[15px] font-bold truncate">{next.title}</span>
          </span>
          <span className="flex gap-2 shrink-0">
            <Button size="sm" variant="secondary" className="h-9 flex-1 sm:flex-none rounded-full bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => { m.doneTask(next.id); toast.success('Xong! 🎉'); }}>Xong</Button>
            <Button size="sm" className="h-9 flex-1 sm:flex-none rounded-full bg-white text-primary hover:bg-white/90" onClick={() => m.focusTask(next.id)}><Play className="w-3.5 h-3.5 mr-1" />Bắt đầu Focus</Button>
          </span>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground px-1">Không còn việc nào cho hôm nay. Thêm việc mới hoặc nghỉ ngơi nhé ✨</p>
      )}
    </Surface>
  );
}

type PlanTab = 'all' | 'tasks' | 'habits';
function PlanList({ m, onAddTask, onAddHabit }: { m: TodayModel; onAddTask: () => void; onAddHabit: () => void }) {
  const [tab, setTab] = useState<PlanTab>('all');
  const [showDone, setShowDone] = useState(false);
  const habitsOpen = m.todayHabits.filter((h) => !m.habitDone(h));
  const doneCount = m.doneTasksToday.length + m.doneHabits.length;
  const showT = tab !== 'habits', showH = tab !== 'tasks';
  const Group = ({ label, tone, children }: { label: string; tone?: string; children: React.ReactNode }) => (
    <div><p className={cn('px-2.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground', tone)}>{label}</p>{children}</div>
  );
  return (
    <Surface className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <SegmentedTabs size="sm" value={tab} onChange={setTab} items={[
          { id: 'all', label: 'Tất cả', count: m.openTasks.length + habitsOpen.length },
          { id: 'tasks', label: 'Việc', count: m.openTasks.length },
          { id: 'habits', label: 'Thói quen', count: habitsOpen.length },
        ]} />
        <Button size="sm" variant="ghost" className="h-8 rounded-full text-primary" onClick={tab === 'habits' ? onAddHabit : onAddTask}><Plus className="w-4 h-4 sm:mr-0.5" /><span className="hidden sm:inline">Thêm</span></Button>
      </div>
      {showT && m.overdueTasks.length > 0 && <Group label={`Quá hạn · ${m.overdueTasks.length}`} tone="text-destructive">{m.overdueTasks.map((t) => <TaskLine key={t.id} task={t} m={m} overdue />)}</Group>}
      {showT && m.todayTasks.length > 0 && <Group label={`Việc hôm nay · ${m.todayTasks.length}`}>{m.todayTasks.map((t) => <TaskLine key={t.id} task={t} m={m} />)}</Group>}
      {showH && habitsOpen.length > 0 && <Group label={`Thói quen · ${m.doneHabits.length}/${m.todayHabits.length}`}>{habitsOpen.map((h) => <HabitLine key={h.id} habit={h} m={m} />)}</Group>}
      {(showT ? m.openTasks.length : 0) + (showH ? habitsOpen.length : 0) === 0 && <div className="py-6"><Empty>Đã xong hết 🎉</Empty></div>}
      {doneCount > 0 && (
        <div className="mt-1 border-t border-border/60 pt-1">
          <button onClick={() => setShowDone((s) => !s)} className="w-full text-left px-2.5 py-2 text-[12px] font-semibold text-muted-foreground">{showDone ? 'Ẩn' : 'Hiện'} {doneCount} mục đã xong</button>
          {showDone && <>{showT && m.doneTasksToday.map((t) => <TaskLine key={t.id} task={t} m={m} compact />)}{showH && m.doneHabits.map((h) => <HabitLine key={h.id} habit={h} m={m} />)}</>}
        </div>
      )}
    </Surface>
  );
}

function PlanA({ m, isMobile, add }: { m: TodayModel; isMobile: boolean; add: Adders }) {
  const extras = <><WeekCard m={m} /><HabitRescueCard />{m.userPreferences?.showAISuggestions !== false && <AISuggestionsCard compact />}</>;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div className="space-y-4 min-w-0">
        <TodayHello m={m} />
        <NextUpCard m={m} />
        {isMobile && <HealthMini m={m} />}
        <PlanList m={m} onAddTask={add.task} onAddHabit={add.habit} />
        {isMobile && <Collapse title="Tuần này & gợi ý">{extras}</Collapse>}
      </div>
      {!isMobile && <aside className="space-y-4 xl:sticky xl:top-4">
        <Surface className="p-4"><SectionTitle title="Sức khỏe hôm nay" /><HealthMini m={m} cols={2} /></Surface>
        {extras}
      </aside>}
    </div>
  );
}

/* ═════════════ Phương án 2 — “3 việc chính + theo buổi” ═════════════ */

function Big3({ m, onAdd }: { m: TodayModel; onAdd: () => void }) {
  const top = m.openTasks.slice(0, 3);
  return (
    <Surface className="p-4">
      <SectionTitle title="3 việc chính hôm nay" hint={`${m.doneTasksToday.length} đã xong`} />
      <IntentionLine m={m} className="mb-3" />
      <div className="space-y-2">
        {top.map((t, i) => (
          <div key={t.id} className={cn('flex items-center gap-3 rounded-[18px] px-3 py-3 border', i === 0 ? 'bg-gradient-to-r from-lavender to-card dark:from-primary/15 border-primary/20' : 'bg-card border-border/60')}>
            <span className={cn('h-7 w-7 rounded-[10px] grid place-items-center text-[13px] font-extrabold shrink-0', i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold truncate">{t.title}</span>
              {m.overdueTasks.includes(t) && <span className="text-[11px] font-semibold text-destructive">Quá hạn</span>}
            </span>
            {i === 0 && <button onClick={() => m.focusTask(t.id)} aria-label="Focus" className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"><Play className="w-3.5 h-3.5" /></button>}
            <Check0 round done={false} label="Hoàn thành" onClick={() => { m.doneTask(t.id); toast.success('Xong! 🎉'); }} />
          </div>
        ))}
        {top.length < 3 && <button onClick={onAdd} className="w-full rounded-[18px] border-2 border-dashed border-border px-3 py-3 text-[13px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary">+ Thêm việc chính</button>}
      </div>
    </Surface>
  );
}

function HabitRings({ m, wrap }: { m: TodayModel; wrap?: boolean }) {
  return (
    <Surface className="p-4">
      <SectionTitle title="Thói quen" hint={`${m.doneHabits.length}/${m.todayHabits.length}`} />
      {m.todayHabits.length === 0 ? <Empty>Chưa có thói quen.</Empty> : (
        <div className={cn('flex gap-3', wrap ? 'flex-wrap' : 'overflow-x-auto -mx-1 px-1 pb-1 snap-x')}>
          {m.todayHabits.map((h) => {
            const done = m.habitDone(h);
            return (
              <button key={h.id} onClick={() => m.toggleHabit(h.id)} className="w-[68px] shrink-0 snap-start text-center group">
                <span className={cn('relative mx-auto h-14 w-14 rounded-full grid place-items-center text-[22px] border-[3px] transition-all group-active:scale-90', done ? 'border-[#22B07D] bg-[#E6F8F1] dark:bg-success/15' : 'border-border bg-card')}>
                  {h.icon || '✨'}
                  {h.streak > 0 && <span className="absolute -bottom-1 -right-1 rounded-full bg-card shadow-soft px-1.5 text-[10px] font-bold text-streak inline-flex items-center"><Flame className="w-2.5 h-2.5" />{h.streak}</span>}
                </span>
                <span className={cn('block mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2', done && 'text-muted-foreground line-through')}>{h.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

const SLOTS = [
  { id: 'morning', label: 'Buổi sáng', icon: Sunrise, from: 0, to: 12 },
  { id: 'afternoon', label: 'Buổi chiều', icon: Sun, from: 12, to: 18 },
  { id: 'evening', label: 'Buổi tối', icon: Sunset, from: 18, to: 24 },
] as const;
const hourOf = (t?: string) => (t ? +t.slice(0, 2) : null);

function DaySlots({ m }: { m: TodayModel }) {
  const big = new Set(m.openTasks.slice(0, 3).map((t) => t.id));
  const rest = m.openTasks.filter((t) => !big.has(t.id));
  const items: { h: number | null; el: JSX.Element; done: boolean }[] = [
    ...m.todayHabits.map((h: Habit) => ({ h: hourOf(h.reminderTime), el: <HabitLine key={'h' + h.id} habit={h} m={m} />, done: m.habitDone(h) })),
    ...rest.map((t: Task) => ({ h: hourOf(t.reminderTime), el: <TaskLine key={'t' + t.id} task={t} m={m} overdue={m.overdueTasks.includes(t)} />, done: false })),
  ];
  const anytime = items.filter((i) => i.h == null);
  return (
    <Surface className="p-3 sm:p-4">
      <SectionTitle title="Lịch trình theo buổi" className="px-1" hint={<span className="inline-flex items-center gap-1"><Moon className="w-3 h-3" />theo giờ nhắc</span>} />
      {SLOTS.map((s) => {
        const list = items.filter((i) => i.h != null && i.h >= s.from && i.h < s.to);
        const now = m.hour >= s.from && m.hour < s.to, past = m.hour >= s.to;
        return (
          <div key={s.id} className={cn('rounded-[18px] mb-2 px-1 py-1', now && 'bg-primary/[0.05] ring-1 ring-primary/15')}>
            <div className="flex items-center gap-2 px-2 pt-1.5 pb-1">
              <s.icon className={cn('w-4 h-4', now ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-[12px] font-bold uppercase tracking-wide', now ? 'text-primary' : 'text-muted-foreground')}>{s.label}</span>
              {now && <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold">Bây giờ</span>}
              <span className="ml-auto text-[11px] text-muted-foreground">{list.filter((i) => i.done).length}/{list.length}</span>
            </div>
            {list.length ? <div className={cn(past && 'opacity-70')}>{list.map((i) => i.el)}</div> : now ? <p className="px-2.5 pb-2 text-[12px] text-muted-foreground">Không có lịch — làm “3 việc chính” nhé.</p> : null}
          </div>
        );
      })}
      {anytime.length > 0 && <div className="px-1"><p className="px-2 pt-1.5 pb-1 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Bất kỳ lúc nào</p>{anytime.map((i) => i.el)}</div>}
    </Surface>
  );
}

function PlanB({ m, isMobile, add }: { m: TodayModel; isMobile: boolean; add: Adders }) {
  const extras = <><HabitRescueCard />{m.userPreferences?.showAISuggestions !== false && <AISuggestionsCard compact />}</>;
  if (isMobile) return (
    <div className="space-y-4">
      <TodayHello m={m} />
      <Big3 m={m} onAdd={add.task} />
      <HabitRings m={m} />
      <HealthMini m={m} />
      <DaySlots m={m} />
      <Collapse title="Tuần này & gợi ý"><WeekCard m={m} />{extras}</Collapse>
    </div>
  );
  return (
    <div className="space-y-4">
      <TodayHello m={m} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:grid-cols-[340px_minmax(0,1fr)_300px] items-start">
        <div className="space-y-4 min-w-0"><Big3 m={m} onAdd={add.task} /><HabitRings m={m} wrap /></div>
        <div className="min-w-0"><DaySlots m={m} /></div>
        <aside className="space-y-4 min-w-0 lg:col-span-2 xl:col-span-1">
          <Surface className="p-4"><SectionTitle title="Sức khỏe hôm nay" /><HealthMini m={m} cols={2} /></Surface>
          <WeekCard m={m} />{extras}
        </aside>
      </div>
    </div>
  );
}

/* ═════════════ Trang ═════════════ */
type Adders = { task: () => void; habit: () => void };

export default function TodayV2Page() {
  const m = useTodayModel();
  const isMobile = useIsMobile();
  const [sp, setSp] = useSearchParams();
  const v = sp.get('v') === '2' ? '2' : '1';
  const [taskOpen, setTaskOpen] = useState(false), [habitOpen, setHabitOpen] = useState(false);
  const add: Adders = { task: () => setTaskOpen(true), habit: () => setHabitOpen(true) };
  return (
    <Page>
      <PageHeader title="Hôm nay" subtitle={<SegmentedTabs size="sm" value={v} onChange={(x) => setSp({ v: x })} items={[{ id: '1', label: 'Phương án 1' }, { id: '2', label: 'Phương án 2' }]} />}
        actions={!isMobile && <>
          <Button variant="outline" className="h-10 rounded-full px-4 bg-card" onClick={add.task}><Plus className="h-4 w-4 mr-1.5" />Thêm việc</Button>
          <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => m.focusTask(m.openTasks[0]?.id)}><Play className="h-4 w-4 mr-1.5" />Bắt đầu tập trung</Button>
        </>} />
      {v === '1' ? <PlanA m={m} isMobile={isMobile} add={add} /> : <PlanB m={m} isMobile={isMobile} add={add} />}
      <TodayAddTaskModal open={taskOpen} onOpenChange={setTaskOpen}
        onAdd={(t) => { m.addTask({ title: t.title, priority: t.priority, status: 'todo', dueDate: t.dueDate, area: t.area }); toast.success('Đã thêm việc'); }} />
      <TodayAddHabitModal open={habitOpen} onOpenChange={setHabitOpen} onAdd={(h) => { m.addHabit(h); toast.success('Đã thêm thói quen'); }} />
    </Page>
  );
}
