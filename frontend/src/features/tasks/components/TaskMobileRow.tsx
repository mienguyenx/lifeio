import { memo, useRef, useState } from 'react';
import { CalendarClock, Check, ChevronDown, ListChecks, Play, Plus, Repeat, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { PRIORITY_META, areaMeta, formatDue, isDone, isOverdue, subtaskProgress } from '../utils/task.utils';
import type { TaskItemActions } from './TaskItem';

export interface TaskMobileExtra {
  onSubToggle: (t: Task, subId: string) => void;
  onSubAdd: (t: Task, title: string) => void;
  onPostpone: (t: Task) => void;
}

const ACTION_W = 168; // độ rộng vùng nút khi vuốt trái
const COMPLETE_AT = 96; // vuốt phải quá ngưỡng → hoàn thành

/** Vòng check màu theo ưu tiên (kiểu Todoist): đỏ = cao, cam = vừa, xám xanh = thấp. */
function PriorityCheck({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const done = isDone(task);
  const c = PRIORITY_META[task.priority].dot;
  return (
    <button type="button" role="checkbox" aria-checked={done} aria-label={done ? 'Bỏ hoàn thành' : 'Hoàn thành'}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="relative shrink-0 h-[26px] w-[26px] -m-0.5 grid place-items-center active:scale-90 transition-transform">
      <span className={cn('h-[22px] w-[22px] rounded-full border-2 grid place-items-center transition-colors', done && 'border-transparent')}
        style={done ? { background: '#22B07D' } : { borderColor: c, background: `${c}14` }}>
        {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Dòng công việc trên mobile: vuốt phải = xong, vuốt trái = Mai / Focus / Xoá, mở rộng checklist tại chỗ. */
export const TaskMobileRow = memo(function TaskMobileRow({ task, extra, ...a }: { task: Task; extra: TaskMobileExtra } & TaskItemActions) {
  const done = isDone(task), overdue = isOverdue(task), due = formatDue(task), sp = subtaskProgress(task), area = areaMeta(task.area);
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sub, setSub] = useState('');
  const start = useRef<{ x: number; y: number; base: number; lock?: 'x' | 'y' } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; start.current = { x: t.clientX, y: t.clientY, base: open ? -ACTION_W : 0 }; };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = start.current; if (!s) return;
    const t = e.touches[0], mx = t.clientX - s.x, my = t.clientY - s.y;
    if (!s.lock) { if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; s.lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'; }
    if (s.lock !== 'x') return;
    setDx(Math.max(-ACTION_W - 24, Math.min(done ? 0 : 140, s.base + mx)));
  };
  const onTouchEnd = () => {
    const s = start.current; start.current = null;
    if (!s || s.lock !== 'x') return;
    if (dx >= COMPLETE_AT) { setDx(0); setOpen(false); navigator.vibrate?.(12); a.onToggle(task); return; }
    const willOpen = dx < -ACTION_W / 2;
    setOpen(willOpen); setDx(willOpen ? -ACTION_W : 0);
  };
  const close = () => { setOpen(false); setDx(0); };
  const act = (fn: () => void) => () => { close(); fn(); };

  return (
    <div className="relative overflow-hidden">
      {/* Nền khi vuốt */}
      {(dx !== 0 || open) && <div className="absolute inset-0 flex">
        <div className={cn('flex-1 flex items-center pl-5 text-white text-[13px] font-bold transition-colors', dx >= COMPLETE_AT ? 'bg-[#22B07D]' : 'bg-[#22B07D]/70')}>
          {dx > 0 && <><Check className="h-5 w-5 mr-1.5" strokeWidth={3} />Hoàn thành</>}
        </div>
        <div className="absolute right-0 inset-y-0 flex" style={{ width: ACTION_W }}>
          <button onClick={act(() => extra.onPostpone(task))} className="flex-1 bg-[#4D9DFF] text-white text-[11px] font-semibold flex flex-col items-center justify-center gap-1"><CalendarClock className="h-4 w-4" />Mai</button>
          <button onClick={act(() => a.onFocus(task))} className="flex-1 bg-primary text-white text-[11px] font-semibold flex flex-col items-center justify-center gap-1"><Play className="h-4 w-4" />Focus</button>
          <button onClick={act(() => a.onDelete(task))} className="flex-1 bg-[#E5484D] text-white text-[11px] font-semibold flex flex-col items-center justify-center gap-1"><Trash2 className="h-4 w-4" />Xoá</button>
        </div>
      </div>}

      {/* Nội dung */}
      <div style={{ transform: `translateX(${dx}px)`, transition: start.current ? 'none' : 'transform .22s ease' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        className="relative bg-card">
        <div role="button" tabIndex={0} onClick={() => (open ? close() : a.onOpen(task))} onKeyDown={(e) => e.key === 'Enter' && a.onOpen(task)}
          className="flex items-start gap-3 px-4 py-3 active:bg-secondary/40">
          <div className="pt-0.5"><PriorityCheck task={task} onToggle={() => a.onToggle(task)} /></div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-[14.5px] font-semibold leading-snug line-clamp-2', done && 'line-through text-muted-foreground')}>{task.title}</p>
            {(due || area || sp.total > 0 || task.recurring) && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[12px] text-muted-foreground">
                {due && <span className={cn('inline-flex items-center gap-1', overdue && 'text-[#E5484D] font-semibold')}><CalendarClock className="h-3 w-3" />{due}</span>}
                {sp.total > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }} className={cn('inline-flex items-center gap-1 rounded-full px-1.5 -mx-0.5 font-semibold', sp.done === sp.total ? 'text-[#22B07D]' : 'text-foreground/70', expanded && 'bg-secondary')}>
                    <ListChecks className="h-3 w-3" />{sp.done}/{sp.total}<ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
                  </button>
                )}
                {area && <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(var(--area-${task.area}))` }} />{area.name}</span>}
                {task.recurring && <Repeat className="h-3 w-3" aria-label="Lặp lại" />}
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="pl-[52px] pr-4 pb-3 -mt-1 space-y-0.5">
            {task.subtasks.map((s) => (
              <button key={s.id} onClick={() => extra.onSubToggle(task, s.id)} className="w-full flex items-center gap-2.5 py-1.5 text-left">
                <span className={cn('h-[18px] w-[18px] rounded-md border-2 grid place-items-center shrink-0', s.completed ? 'bg-primary border-primary text-white' : 'border-[#D5D8E2] dark:border-white/20')}>
                  {s.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={cn('text-[13px] leading-snug', s.completed && 'line-through text-muted-foreground')}>{s.title}</span>
              </button>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); if (sub.trim()) { extra.onSubAdd(task, sub.trim()); setSub(''); } }} className="flex items-center gap-2.5 py-1">
              <Plus className="h-[18px] w-[18px] text-primary shrink-0" />
              <input value={sub} onChange={(e) => setSub(e.target.value)} enterKeyHint="done" placeholder="Thêm mục con…" className="flex-1 min-w-0 h-8 bg-transparent text-[13px] focus:outline-none placeholder:text-muted-foreground" />
            </form>
          </div>
        )}
      </div>
    </div>
  );
});

/** Gợi ý vuốt (hiện 1 lần). */
export function SwipeHint({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-lavender/60 dark:bg-primary/10 px-3.5 py-2.5 text-[12px] text-primary">
      <span className="flex-1"><b>Mẹo:</b> vuốt phải để hoàn thành, vuốt trái để dời sang mai, Focus hoặc xoá.</span>
      <button onClick={onClose} className="font-bold">OK</button>
    </div>
  );
}
