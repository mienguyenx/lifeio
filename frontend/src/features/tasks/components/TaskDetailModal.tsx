import { useEffect, useState } from 'react';
import { CalendarDays, Check, Clock, CornerUpLeft, Play, Repeat, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskStatus } from '../types/task.types';
import { STATUS_META, dueKey, isDone, subtaskProgress } from '../utils/task.utils';
import { AreaSelect, FieldLabel, PriorityPicker, fieldCls } from './TaskFormFields';
import { TaskCheck } from './TaskItem';
import { SubtaskList } from './SubtaskList';
import { ChildTasks } from './ChildTasks';
import type { useTasks } from '../hooks/useTasks';

type Api = ReturnType<typeof useTasks>;

export function TaskDetailModal({ task, open, onOpenChange, api, onFocus, onOpenTask }: {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  api: Api;
  onFocus: (t: Task) => void;
  /** Mở một việc khác trong cùng modal (việc cha / việc con). */
  onOpenTask?: (id: string) => void;
}) {
  const [tab, setTab] = useState<'children' | 'checklist' | 'notes'>('children');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDesc(task.description ?? '');
      // Việc con không có tầng con nữa → mở thẳng Checklist; việc cha có checklist mà chưa có việc con → mở Checklist.
      const hasKids = (api.childrenOf.get(task.id)?.length ?? 0) > 0;
      setTab(task.parentId || (!hasKids && (task.subtasks?.length ?? 0) > 0) ? 'checklist' : 'children');
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;
  const sp = subtaskProgress(task);
  const done = isDone(task);
  const up = (u: Partial<Task>) => api.updateTask(task.id, u);
  const kids = api.childrenOf.get(task.id) ?? [];
  const parent = task.parentId ? api.byId.get(task.parentId) : undefined;
  const tabs = ([
    !task.parentId && ['children', `Việc con (${kids.filter(isDone).length}/${kids.length})`],
    ['checklist', `Checklist (${sp.done}/${sp.total})`],
    ['notes', 'Ghi chú'],
  ].filter(Boolean) as [typeof tab, string][]);

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Chi tiết công việc" className="sm:max-w-[560px] rounded-[28px]">
      <div className="space-y-5">
        {parent && (
          <div className="flex items-center gap-2 -mt-1 text-[12.5px]">
            <button onClick={() => onOpenTask?.(parent.id)} className="min-w-0 inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1.5 font-semibold text-muted-foreground hover:text-foreground">
              <CornerUpLeft className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Thuộc: {parent.title}</span>
            </button>
            <button onClick={() => api.detachChild(task)} className="shrink-0 font-semibold text-primary hover:underline">Tách riêng</button>
          </div>
        )}
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

        {/* Tabs */}
        <div>
          <div className="flex gap-5 border-b border-border">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn('pb-2.5 -mb-px text-[13.5px] font-semibold border-b-2 transition-colors', tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'children' ? (
            <div className="pt-3">
              <ChildTasks parent={task} kids={kids} onToggle={api.toggleTaskCompletion} onOpen={(k) => onOpenTask?.(k.id)} onFocus={onFocus}
                onAdd={(titles) => api.addChildren(task, titles)} />
            </div>
          ) : tab === 'checklist' ? (
            <SubtaskList className="pt-3" items={task.subtasks ?? []}
              onToggle={(id) => api.toggleSubtaskSmart(task, id)}
              onRename={(id, t) => api.updateSubtask(task.id, id, t)}
              onDelete={(id) => api.deleteSubtask(task.id, id)}
              onAdd={(titles) => api.addSubtasks(task.id, titles)}
              onReorder={(ids) => api.reorderSubtasks(task.id, ids)}
              onPromote={task.parentId ? undefined : (id) => api.promoteChecklistItem(task, id)}
              ai={{ title: task.title, description: task.description }} />
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

        {/* Footer */}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => { api.deleteTask(task); onOpenChange(false); }} className="h-12 w-12 shrink-0 grid place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40" aria-label="Xoá công việc">
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
          {!done && (
            <Button variant="secondary" className="h-12 rounded-full flex-1 min-w-0 px-3" onClick={() => { onFocus(task); onOpenChange(false); }}>
              <Play className="h-4 w-4 mr-1.5" />Bắt đầu Focus
            </Button>
          )}
          <Button className="h-12 rounded-full flex-1 min-w-0 px-3" onClick={() => api.toggleTaskCompletion(task)}>
            <Check className="h-4 w-4 mr-1.5" />{done ? 'Mở lại' : 'Hoàn thành'}
          </Button>
        </div>
      </div>
    </AdaptiveModal>
  );
}
