import { memo } from 'react';
import { Check, MoreHorizontal, Play, Repeat, Trash2, CalendarClock, ListChecks, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityIcon } from '@/components/icons/LifeIcon';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task, TaskStatus } from '../types/task.types';
import {
  PRIORITY_META, STATUS_META, areaChipStyle, areaMeta, formatDue, isDone, isOverdue, subtaskProgress,
} from '../utils/task.utils';

export function TaskCheck({ task, onToggle, size = 'md' }: { task: Task; onToggle: () => void; size?: 'sm' | 'md' }) {
  const done = isDone(task);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        'shrink-0 rounded-full border-2 grid place-items-center transition-all active:scale-90',
        size === 'sm' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]',
        done
          ? 'bg-[#22B07D] border-[#22B07D] text-white'
          : 'border-[#D5D8E2] dark:border-white/20 hover:border-primary hover:bg-lavender/60',
      )}
    >
      {done && <Check className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={3} />}
    </button>
  );
}

export function PriorityChip({ priority, className }: { priority: Task['priority']; className?: string }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', m.chip, className)}>
      {m.label}
    </span>
  );
}

export function AreaChip({ area, className }: { area?: Task['area']; className?: string }) {
  const a = areaMeta(area);
  if (!a) return null;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', className)} style={areaChipStyle(area)}>
      {a.name}
    </span>
  );
}

export function StatusChip({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status];
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap', m.chip)}>{m.label}</span>;
}

export interface TaskItemActions {
  onOpen: (t: Task) => void;
  onToggle: (t: Task) => void;
  onStatus: (t: Task, s: TaskStatus) => void;
  onFocus: (t: Task) => void;
  onDelete: (t: Task) => void;
}

export function TaskMenu({ task, onStatus, onFocus, onDelete, onOpen }: { task: Task } & Omit<TaskItemActions, 'onToggle'>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Thao tác"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onOpen(task)}><ListChecks className="h-4 w-4 mr-2" />Xem chi tiết</DropdownMenuItem>
        {!isDone(task) && <DropdownMenuItem onClick={() => onFocus(task)}><Play className="h-4 w-4 mr-2" />Bắt đầu Focus</DropdownMenuItem>}
        {task.status !== 'in_progress' && !isDone(task) && (
          <DropdownMenuItem onClick={() => onStatus(task, 'in_progress')}><ArrowRightCircle className="h-4 w-4 mr-2" />Chuyển sang Đang làm</DropdownMenuItem>
        )}
        {task.status !== 'deferred' && !isDone(task) && (
          <DropdownMenuItem onClick={() => onStatus(task, 'deferred')}><CalendarClock className="h-4 w-4 mr-2" />Tạm hoãn</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(task)}>
          <Trash2 className="h-4 w-4 mr-2" />Xoá
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop table row (List view). Grid columns must match TaskList header. */
export const TaskRow = memo(function TaskRow({ task, ...a }: { task: Task } & TaskItemActions) {
  const done = isDone(task);
  const overdue = isOverdue(task);
  const sp = subtaskProgress(task);
  const due = formatDue(task);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => a.onOpen(task)}
      onKeyDown={(e) => e.key === 'Enter' && a.onOpen(task)}
      className="group grid grid-cols-[28px_minmax(0,1fr)_96px_120px_104px_36px] items-center gap-3 px-4 py-3 rounded-2xl hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer transition-colors"
    >
      <TaskCheck task={task} onToggle={() => a.onToggle(task)} />
      <div className="min-w-0 flex items-center gap-2.5">
        <PriorityIcon priority={task.priority} size={18} variant="filled" className="shrink-0" />
        <div className="min-w-0">
          <p className={cn('text-[14px] font-semibold text-foreground truncate', done && 'line-through text-muted-foreground')}>{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground">
            <AreaChip area={task.area} className="px-1.5 py-0 text-[10.5px]" />
            {sp.total > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" />{sp.done}/{sp.total}</span>}
            {task.recurring && <Repeat className="h-3 w-3" aria-label="Lặp lại" />}
          </div>
        </div>
      </div>
      <div><PriorityChip priority={task.priority} /></div>
      <div className={cn('text-[13px] truncate', overdue ? 'text-[#E5484D] font-semibold' : 'text-muted-foreground')}>{due ?? '—'}</div>
      <div><StatusChip status={task.status} /></div>
      <div className="opacity-60 group-hover:opacity-100 transition-opacity"><TaskMenu task={task} {...a} /></div>
    </div>
  );
});

/** Compact card (mobile list, today side lists). */
export const TaskCard = memo(function TaskCard({ task, ...a }: { task: Task } & TaskItemActions) {
  const done = isDone(task);
  const overdue = isOverdue(task);
  const due = formatDue(task);
  const sp = subtaskProgress(task);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => a.onOpen(task)}
      onKeyDown={(e) => e.key === 'Enter' && a.onOpen(task)}
      className="flex items-start gap-3 rounded-2xl bg-card border border-border/70 px-3.5 py-3 shadow-soft active:scale-[0.99] transition-transform"
    >
      <div className="pt-0.5"><TaskCheck task={task} onToggle={() => a.onToggle(task)} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <PriorityIcon priority={task.priority} size={15} variant="filled" className="shrink-0" />
          <p className={cn('text-[14px] font-semibold truncate', done && 'line-through text-muted-foreground')}>{task.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <AreaChip area={task.area} />
          <PriorityChip priority={task.priority} />
          {due && <span className={cn('text-[11.5px]', overdue ? 'text-[#E5484D] font-semibold' : 'text-muted-foreground')}>{due}</span>}
          {sp.total > 0 && <span className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1"><ListChecks className="h-3 w-3" />{sp.done}/{sp.total}</span>}
        </div>
      </div>
      <TaskMenu task={task} {...a} />
    </div>
  );
});
