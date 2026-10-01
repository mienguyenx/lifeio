import { useState, type DragEvent } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityIcon } from '@/components/icons/LifeIcon';
import type { BoardColumnId, Task } from '../types/task.types';
import { BOARD_COLUMNS, columnOf, formatDue, isOverdue, sortTasks, subtaskProgress } from '../utils/task.utils';
import { AreaChip, PriorityChip, TaskMenu, type TaskItemActions } from './TaskItem';

function BoardCard({ task, dragging, onDragStart, onDragEnd, ...a }: {
  task: Task; dragging: boolean; onDragStart: (e: DragEvent) => void; onDragEnd: () => void;
} & TaskItemActions) {
  const sp = subtaskProgress(task);
  const due = formatDue(task);
  const done = task.status === 'done';
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => a.onOpen(task)}
      className={cn(
        'group rounded-[18px] bg-card border border-border/70 p-3.5 shadow-soft cursor-grab active:cursor-grabbing hover:shadow-card hover:-translate-y-0.5 transition-all',
        dragging && 'opacity-40 rotate-1',
      )}
    >
      <div className="flex items-start gap-2">
        <PriorityIcon priority={task.priority} size={16} variant="filled" className="mt-0.5 shrink-0" />
        <p className={cn('flex-1 text-[13.5px] font-semibold leading-snug', done && 'line-through text-muted-foreground')}>{task.title}</p>
        <div className="-mr-1.5 -mt-1"><TaskMenu task={task} {...a} /></div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <AreaChip area={task.area} />
        <PriorityChip priority={task.priority} />
      </div>
      {(due || sp.total > 0) && (
        <div className="flex items-center justify-between mt-3 text-[11.5px] text-muted-foreground">
          <span className={cn(isOverdue(task) && 'text-[#E5484D] font-semibold')}>{due}</span>
          {sp.total > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" />{sp.done}/{sp.total}</span>}
        </div>
      )}
      {sp.total > 0 && (
        <div className="h-1 rounded-full bg-secondary mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${sp.pct}%` }} />
        </div>
      )}
    </div>
  );
}

/** Kanban — HTML5 drag & drop between Cần làm / Đang làm / Hoàn thành. */
export function TaskBoard({ tasks, onAddIn, ...a }: { tasks: Task[]; onAddIn: (col: BoardColumnId) => void } & TaskItemActions) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<BoardColumnId | null>(null);

  const drop = (col: BoardColumnId, id?: string) => {
    const t = tasks.find((x) => x.id === (id || dragId));
    if (t && columnOf(t) !== col) a.onStatus(t, col);
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {BOARD_COLUMNS.map((c) => {
        const list = sortTasks(tasks.filter((t) => columnOf(t) === c.id));
        return (
          <section
            key={c.id}
            onDragOver={(e) => { e.preventDefault(); setOverCol(c.id); }}
            onDragLeave={() => setOverCol((o) => (o === c.id ? null : o))}
            onDrop={(e) => { e.preventDefault(); drop(c.id, e.dataTransfer.getData('text/plain')); }}
            className={cn('rounded-[24px] p-3 min-h-[240px] transition-all', c.tint, overCol === c.id && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background')}
          >
            <header className="flex items-center gap-2 px-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.accent }} />
              <h3 className="text-[14px] font-bold">{c.label}</h3>
              <span className="text-[12px] text-muted-foreground">({list.length})</span>
              <button onClick={() => onAddIn(c.id)} className="ml-auto h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-primary" aria-label={`Thêm vào ${c.label}`}>
                <Plus className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-2.5">
              {list.map((t) => (
                <BoardCard
                  key={t.id}
                  task={t}
                  dragging={dragId === t.id}
                  onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); }}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  {...a}
                />
              ))}
              {list.length === 0 && (
                <div className="rounded-[18px] border-2 border-dashed border-border/80 py-8 text-center text-[12.5px] text-muted-foreground">
                  Kéo thả công việc vào đây
                </div>
              )}
            </div>
            <button onClick={() => onAddIn(c.id)} className="w-full mt-2.5 h-9 rounded-full text-[13px] font-semibold text-primary hover:bg-card/80 inline-flex items-center justify-center gap-1.5">
              <Plus className="h-4 w-4" />Thêm việc
            </button>
          </section>
        );
      })}
    </div>
  );
}
