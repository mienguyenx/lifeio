import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { PRIORITY_META, areaChipStyle, dateKey, dueKey, isDone, sortTasks, todayKey } from '../utils/task.utils';
import { TaskCard, type TaskItemActions } from './TaskItem';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function Chip({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen(task); }}
      className={cn('w-full text-left truncate rounded-lg px-1.5 py-[3px] text-[11px] font-semibold border-l-[3px] transition-opacity hover:opacity-80', isDone(task) && 'line-through opacity-60')}
      style={{
        ...(areaChipStyle(task.area) ?? { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }),
        borderLeftColor: PRIORITY_META[task.priority].dot,
      }}
      title={task.title}
    >
      {task.reminderTime && <span className="opacity-70 mr-1">{task.reminderTime}</span>}
      {task.title}
    </button>
  );
}

/** Month calendar. Desktop shows chips in cells; mobile shows dots + agenda for the selected day. */
export function TaskCalendar({ tasks, mobile, onAddOn, ...a }: { tasks: Task[]; mobile?: boolean; onAddOn: (date: string) => void } & TaskItemActions) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(todayKey());

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    sortTasks(tasks).forEach((t) => {
      const k = dueKey(t);
      if (!k) return;
      m.set(k, [...(m.get(k) ?? []), t]);
    });
    return m;
  }, [tasks]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const today = todayKey();
  const agenda = byDay.get(selected) ?? [];

  return (
    <div className={cn(!mobile && 'rounded-[24px] bg-card border border-border/70 shadow-soft p-4')}>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => { setMonth(new Date()); setSelected(today); }} className="h-8 px-3 rounded-full border border-border text-[12.5px] font-semibold hover:bg-secondary">Hôm nay</button>
        <button onClick={() => setMonth((m) => subMonths(m, 1))} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></button>
        <h3 className="text-[16px] font-bold capitalize ml-1">{format(month, 'MMMM yyyy', { locale: vi })}</h3>
      </div>

      <div className="grid grid-cols-7 text-center text-[11.5px] font-semibold text-muted-foreground mb-1.5">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className={cn('grid grid-cols-7', mobile ? 'gap-y-1' : 'gap-1.5')}>
        {days.map((d) => {
          const k = dateKey(d);
          const list = byDay.get(k) ?? [];
          const inMonth = isSameMonth(d, month);
          const isToday = k === today;
          const isSel = k === selected;
          if (mobile) {
            return (
              <button key={k} onClick={() => setSelected(k)} className="flex flex-col items-center gap-1 py-1">
                <span className={cn(
                  'h-9 w-9 grid place-items-center rounded-full text-[13.5px] font-semibold transition-colors',
                  !inMonth && 'text-muted-foreground/40',
                  isToday && !isSel && 'text-primary',
                  isSel && 'bg-primary text-primary-foreground shadow-fab',
                )}>{format(d, 'd')}</span>
                <span className="flex gap-0.5 h-1.5">
                  {list.slice(0, 3).map((t) => <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_META[t.priority].dot }} />)}
                </span>
              </button>
            );
          }
          return (
            <div
              key={k}
              onClick={() => onAddOn(k)}
              className={cn(
                'group min-h-[104px] rounded-2xl border p-1.5 flex flex-col gap-1 cursor-pointer transition-colors',
                inMonth ? 'bg-card border-border/60 hover:border-primary/40' : 'bg-secondary/40 border-transparent',
                isToday && 'border-primary/50 bg-lavender/40 dark:bg-primary/10',
              )}
            >
              <div className="flex items-center justify-between px-1">
                <span className={cn('text-[12.5px] font-semibold', !inMonth && 'text-muted-foreground/50', isToday && 'h-6 w-6 -ml-1 grid place-items-center rounded-full bg-primary text-primary-foreground')}>{format(d, 'd')}</span>
                <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {list.slice(0, 3).map((t) => <Chip key={t.id} task={t} onOpen={a.onOpen} />)}
              {list.length > 3 && <span className="text-[11px] text-muted-foreground px-1">+{list.length - 3} việc</span>}
            </div>
          );
        })}
      </div>

      {mobile && (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold capitalize">{format(parseISO(selected), 'EEEE, d/M', { locale: vi })}</p>
            <button onClick={() => onAddOn(selected)} className="text-[13px] font-semibold text-primary inline-flex items-center gap-1"><Plus className="h-4 w-4" />Thêm</button>
          </div>
          {agenda.length === 0 && <p className="text-[13px] text-muted-foreground py-6 text-center">Không có công việc trong ngày này.</p>}
          {agenda.map((t) => <TaskCard key={t.id} task={t} {...a} />)}
        </div>
      )}
    </div>
  );
}
