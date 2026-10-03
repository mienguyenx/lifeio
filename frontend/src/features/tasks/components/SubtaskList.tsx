import { useState, type ClipboardEvent } from 'react';
import { Check, GitBranch, GripVertical, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/integrations/api/httpClient';
import { Button } from '@/components/ui/button';

export interface SubItem { id: string; title: string; completed: boolean }

export interface SubtaskListProps {
  items: SubItem[];
  onToggle?: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAdd: (titles: string[]) => void;
  onReorder: (ids: string[]) => void;
  /** Ngữ cảnh cho nút “Chia nhỏ bằng AI”. */
  ai?: { title: string; description?: string };
  /** Chuyển 1 mục checklist thành việc con. */
  onPromote?: (id: string) => void;
  /** Chế độ nháp (form tạo mới): không có checkbox. */
  draft?: boolean;
  className?: string;
}

/** Gọi AI chia nhỏ một công việc thành các bước. */
export async function fetchBreakdown(title: string, description: string | undefined, existing: string[]): Promise<string[]> {
  const r = await apiFetch<{ subtasks: string[] }>('/functions/ai-task-breakdown', { method: 'POST', body: { title, description, existing } });
  return r.subtasks ?? [];
}

/** Tách văn bản dán vào thành nhiều dòng (bỏ gạch đầu dòng / số thứ tự). */
export function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•+]|\d+[.)]|\[[ x]\])\s*/i, '').trim()).filter(Boolean);
}

function Row({ item, draft, onToggle, onRename, onDelete, onPromote }: { item: SubItem; draft?: boolean } & Pick<SubtaskListProps, 'onToggle' | 'onRename' | 'onDelete' | 'onPromote'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(item.title);
  const commit = () => {
    setEditing(false);
    const t = v.trim();
    if (!t) return onDelete(item.id);
    if (t !== item.title) onRename(item.id, t);
  };
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group flex items-center gap-2 rounded-2xl pl-1 pr-1.5 py-1.5 bg-secondary/40 hover:bg-secondary/70 transition-colors', isDragging && 'relative z-10 shadow-card bg-card')}>
      <button type="button" {...attributes} {...listeners} aria-label="Kéo để sắp xếp" className="h-8 w-6 grid place-items-center text-muted-foreground/60 touch-none cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      {!draft && (
        <button type="button" role="checkbox" aria-checked={item.completed} onClick={() => onToggle?.(item.id)}
          className={cn('h-5 w-5 rounded-md border-2 grid place-items-center shrink-0 transition-colors', item.completed ? 'bg-primary border-primary text-white' : 'border-[#D5D8E2] dark:border-white/20 hover:border-primary')}>
          {item.completed && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
      )}
      {editing ? (
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setV(item.title); setEditing(false); } }}
          className="flex-1 min-w-0 h-8 rounded-lg bg-card px-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
      ) : (
        <button type="button" onClick={() => { setV(item.title); setEditing(true); }} className={cn('flex-1 min-w-0 text-left text-[13.5px] py-1 px-1 break-words', item.completed && 'line-through text-muted-foreground')}>
          {item.title}
        </button>
      )}
      {onPromote && (
        <button type="button" onClick={() => onPromote(item.id)} aria-label="Chuyển thành việc con" title="Chuyển thành việc con"
          className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:text-primary sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity">
          <GitBranch className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" onClick={() => onDelete(item.id)} aria-label="Xoá mục"
        className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Checklist mục con: tick, sửa tên tại chỗ, kéo thả sắp xếp, dán nhiều dòng, chia nhỏ bằng AI. */
export function SubtaskList({ items, onToggle, onRename, onDelete, onAdd, onReorder, onPromote, ai, draft, className }: SubtaskListProps) {
  const [text, setText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = items.map((i) => i.id);
    onReorder(arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))));
  };
  const add = () => { const lines = splitLines(text); if (lines.length) onAdd(lines); setText(''); };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const lines = splitLines(e.clipboardData.getData('text'));
    if (lines.length > 1) { e.preventDefault(); onAdd(lines); setText(''); toast.success(`Đã thêm ${lines.length} mục con`); }
  };
  const runAI = async () => {
    if (!ai?.title.trim()) return toast.error('Nhập tên công việc trước');
    setAiBusy(true);
    try {
      const list = await fetchBreakdown(ai.title, ai.description, items.map((i) => i.title));
      if (!list.length) toast('AI chưa gợi ý được bước nào'); else setIdeas(list);
    } catch (err) {
      toast.error('Không gọi được AI', { description: err instanceof Error ? err.message : undefined });
    } finally { setAiBusy(false); }
  };
  const done = items.filter((i) => i.completed).length;

  return (
    <div className={cn('space-y-1.5', className)}>
      {!draft && items.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / items.length) * 100}%` }} /></div>
          <span className="text-[11.5px] font-semibold text-muted-foreground tabular-nums">{done}/{items.length}</span>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((it) => <Row key={it.id} item={it} draft={draft} onToggle={onToggle} onRename={onRename} onDelete={onDelete} onPromote={onPromote} />)}
        </SortableContext>
      </DndContext>

      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 focus-within:border-primary/50">
        <Plus className="h-4 w-4 text-primary shrink-0" />
        <input value={text} onChange={(e) => setText(e.target.value)} onPaste={onPaste} enterKeyHint="done"
          placeholder="Thêm mục checklist…"
          className="flex-1 min-w-0 h-10 bg-transparent text-[13.5px] focus:outline-none placeholder:text-muted-foreground" />
        {text.trim() && <Button type="submit" size="sm" variant="soft" className="rounded-full h-8">Thêm</Button>}
      </form>

      {ai && (
        ideas.length > 0 ? (
          <div className="rounded-2xl border border-primary/20 bg-lavender/40 dark:bg-primary/10 p-2.5 space-y-1.5">
            <p className="flex items-center gap-1.5 px-1 text-[12px] font-bold text-primary"><Sparkles className="h-3.5 w-3.5" />AI gợi ý {ideas.length} bước</p>
            {ideas.map((t, i) => (
              <button key={i} type="button" onClick={() => { onAdd([t]); setIdeas((x) => x.filter((_, j) => j !== i)); }}
                className="w-full flex items-center gap-2 rounded-xl bg-card px-2.5 py-2 text-left text-[13px] hover:ring-1 hover:ring-primary/30">
                <Plus className="h-3.5 w-3.5 text-primary shrink-0" /><span className="flex-1">{t}</span>
              </button>
            ))}
            <div className="flex gap-2 pt-0.5">
              <Button type="button" size="sm" className="h-8 rounded-full flex-1" onClick={() => { onAdd(ideas); setIdeas([]); }}>Thêm tất cả</Button>
              <Button type="button" size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setIdeas([])}>Bỏ qua</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={runAI} disabled={aiBusy} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-60">
            {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Chia nhỏ bằng AI
          </button>
        )
      )}
    </div>
  );
}
