import { useEffect, useState } from 'react';
import { CalendarDays, Check, Clock, Play, Plus, Repeat, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskStatus } from '../types/task.types';
import { STATUS_META, dueKey, isDone, subtaskProgress } from '../utils/task.utils';
import { AreaSelect, FieldLabel, PriorityPicker, fieldCls } from './TaskFormFields';
import { TaskCheck } from './TaskItem';
import type { useTasks } from '../hooks/useTasks';

type Api = ReturnType<typeof useTasks>;

export function TaskDetailModal({ task, open, onOpenChange, api, onFocus }: {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  api: Api;
  onFocus: (t: Task) => void;
}) {
  const [tab, setTab] = useState<'checklist' | 'notes'>('checklist');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [newSub, setNewSub] = useState('');

  useEffect(() => {
    if (task) { setTitle(task.title); setDesc(task.description ?? ''); }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;
  const sp = subtaskProgress(task);
  const done = isDone(task);
  const up = (u: Partial<Task>) => api.updateTask(task.id, u);

  const addSub = () => {
    const v = newSub.trim();
    if (!v) return;
    api.addSubtask(task.id, v);
    setNewSub('');
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Chi tiết công việc" className="sm:max-w-[560px] rounded-[28px]">
      <div className="space-y-5">
        {/* Title */}
        <div className="flex items-start gap-3">
          <div className="pt-2.5"><TaskCheck task={task} onToggle={() => api.toggleTaskCompletion(task)} /></div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && up({ title: title.trim() })}
            className={cn('flex-1 bg-transparent text-[20px] font-bold leading-tight py-1.5 rounded-xl px-1 -mx-1 focus:outline-none focus:bg-secondary/60', done && 'line-through text-muted-foreground')}
            aria-label="Tên công việc"
          />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Trạng thái</FieldLabel>
            <Select value={task.status} onValueChange={(v) => api.setStatus(task, v as TaskStatus)}>
              <SelectTrigger className="h-11 rounded-2xl bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Lĩnh vực</FieldLabel>
            <AreaSelect value={task.area} onChange={(a) => up({ area: a })} />
          </div>
          <label className="block">
            <FieldLabel><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Ngày</span></FieldLabel>
            <input type="date" value={dueKey(task) ?? ''} onChange={(e) => up({ dueDate: e.target.value || undefined })} className={fieldCls} />
          </label>
          <label className="block">
            <FieldLabel><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Giờ</span></FieldLabel>
            <input type="time" value={task.reminderTime ?? ''} onChange={(e) => up({ reminderTime: e.target.value || undefined })} className={fieldCls} />
          </label>
        </div>
        <div>
          <FieldLabel>Mức ưu tiên</FieldLabel>
          <PriorityPicker value={task.priority} onChange={(p) => up({ priority: p })} />
        </div>
        {task.recurring && (
          <p className="text-[12.5px] text-muted-foreground inline-flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5" />Lặp lại {({ daily: 'hằng ngày', weekly: 'hằng tuần', monthly: 'hằng tháng' } as const)[task.recurring.frequency]}
          </p>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-5 border-b border-border">
            {([['checklist', `Checklist (${sp.done}/${sp.total})`], ['notes', 'Ghi chú']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn('pb-2.5 -mb-px text-[13.5px] font-semibold border-b-2 transition-colors', tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'checklist' ? (
            <div className="pt-3 space-y-1.5">
              {sp.total > 0 && (
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${sp.pct}%` }} />
                </div>
              )}
              {task.subtasks?.map((s) => (
                <div key={s.id} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-secondary/40 hover:bg-secondary/70 transition-colors">
                  <button
                    role="checkbox"
                    aria-checked={s.completed}
                    onClick={() => api.toggleSubtask(task.id, s.id)}
                    className={cn('h-5 w-5 rounded-md border-2 grid place-items-center shrink-0 transition-colors', s.completed ? 'bg-primary border-primary text-white' : 'border-[#D5D8E2] dark:border-white/20 hover:border-primary')}
                  >
                    {s.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>
                  <span className={cn('flex-1 text-[13.5px]', s.completed && 'line-through text-muted-foreground')}>{s.title}</span>
                  <button onClick={() => api.deleteSubtask(task.id, s.id)} className="opacity-0 group-hover:opacity-100 h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-destructive" aria-label="Xoá mục">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <form onSubmit={(e) => { e.preventDefault(); addSub(); }} className="flex items-center gap-2 pt-1">
                <Plus className="h-4 w-4 text-primary ml-3" />
                <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Thêm mục con…" className="flex-1 h-10 bg-transparent text-[13.5px] focus:outline-none placeholder:text-primary/70" />
                {newSub.trim() && <Button type="submit" size="sm" variant="soft" className="rounded-full h-8">Thêm</Button>}
              </form>
            </div>
          ) : (
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={() => desc !== (task.description ?? '') && up({ description: desc || undefined })}
              placeholder="Ghi chú, link, ý tưởng…"
              rows={5}
              className={`${fieldCls} h-auto py-3 mt-3 resize-none`}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => { api.deleteTask(task); onOpenChange(false); }} className="h-12 w-12 shrink-0 grid place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40" aria-label="Xoá công việc">
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
          {!done && (
            <Button variant="secondary" className="h-12 rounded-full flex-1" onClick={() => { onFocus(task); onOpenChange(false); }}>
              <Play className="h-4 w-4 mr-1.5" />Bắt đầu Focus
            </Button>
          )}
          <Button className="h-12 rounded-full flex-1" onClick={() => api.toggleTaskCompletion(task)}>
            <Check className="h-4 w-4 mr-1.5" />{done ? 'Mở lại' : 'Hoàn thành'}
          </Button>
        </div>
      </div>
    </AdaptiveModal>
  );
}
