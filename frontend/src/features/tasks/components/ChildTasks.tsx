import { useState } from 'react';
import { CalendarClock, ChevronRight, GitBranch, Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Task } from '../types/task.types';
import { PRIORITY_META, formatDue, isDone, isOverdue, subtaskProgress } from '../utils/task.utils';
import { TaskCheck } from './TaskItem';
import { fetchBreakdown, splitLines } from './SubtaskList';

/** Việc con = công việc đầy đủ (hạn, ưu tiên, trạng thái, checklist, Focus riêng) nằm dưới một việc cha. */
export function ChildTasks({ parent, kids, onToggle, onOpen, onAdd, onFocus }: {
  parent: Task;
  kids: Task[];
  onToggle: (t: Task) => void;
  onOpen: (t: Task) => void;
  onAdd: (titles: string[]) => Promise<void> | void;
  onFocus: (t: Task) => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const done = kids.filter(isDone).length;
  const add = () => { const l = splitLines(text); if (l.length) onAdd(l); setText(''); };
  const ai = async () => {
    setBusy(true);
    try {
      const list = await fetchBreakdown(parent.title, parent.description, kids.map((k) => k.title));
      if (!list.length) toast('AI chưa gợi ý được việc con nào'); else setIdeas(list);
    } catch (e) { toast.error('Không gọi được AI', { description: e instanceof Error ? e.message : undefined }); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-1.5">
      {kids.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full bg-[#22B07D] transition-all" style={{ width: `${(done / kids.length) * 100}%` }} /></div>
          <span className="text-[11.5px] font-semibold text-muted-foreground tabular-nums">{done}/{kids.length} xong</span>
        </div>
      )}
      {kids.map((k) => {
        const due = formatDue(k), sp = subtaskProgress(k), od = isOverdue(k);
        return (
          <div key={k.id} role="button" tabIndex={0} onClick={() => onOpen(k)} onKeyDown={(e) => e.key === 'Enter' && onOpen(k)}
            className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2.5 hover:border-primary/30 cursor-pointer transition-colors">
            <TaskCheck task={k} size="sm" onToggle={() => onToggle(k)} />
            <span className="min-w-0 flex-1">
              <span className={cn('block text-[13.5px] font-semibold truncate', isDone(k) && 'line-through text-muted-foreground')}>{k.title}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_META[k.priority].dot }} />{PRIORITY_META[k.priority].label}</span>
                {due && <span className={cn('inline-flex items-center gap-1', od && 'text-[#E5484D] font-semibold')}><CalendarClock className="h-3 w-3" />{due}</span>}
                {sp.total > 0 && <span>☑ {sp.done}/{sp.total}</span>}
                {k.status === 'in_progress' && <span className="text-primary font-semibold">Đang làm</span>}
              </span>
            </span>
            {!isDone(k) && <button type="button" onClick={(e) => { e.stopPropagation(); onFocus(k); }} className="h-8 px-2.5 rounded-full text-[11.5px] font-semibold text-primary hover:bg-primary/10 sm:opacity-0 sm:group-hover:opacity-100">Focus</button>}
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          </div>
        );
      })}
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 focus-within:border-primary/50">
        <Plus className="h-4 w-4 text-primary shrink-0" />
        <input value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="done" placeholder="Thêm việc con…"
          onPaste={(e) => { const l = splitLines(e.clipboardData.getData('text')); if (l.length > 1) { e.preventDefault(); onAdd(l); setText(''); } }}
          className="flex-1 min-w-0 h-10 bg-transparent text-[13.5px] focus:outline-none placeholder:text-muted-foreground" />
        {text.trim() && <Button type="submit" size="sm" variant="soft" className="rounded-full h-8">Thêm</Button>}
      </form>
      {ideas.length > 0 ? (
        <div className="rounded-2xl border border-primary/20 bg-lavender/40 dark:bg-primary/10 p-2.5 space-y-1.5">
          <p className="flex items-center gap-1.5 px-1 text-[12px] font-bold text-primary"><Sparkles className="h-3.5 w-3.5" />AI gợi ý {ideas.length} việc con</p>
          {ideas.map((t, i) => (
            <button key={i} type="button" onClick={() => { onAdd([t]); setIdeas((x) => x.filter((_, j) => j !== i)); }} className="w-full flex items-center gap-2 rounded-xl bg-card px-2.5 py-2 text-left text-[13px] hover:ring-1 hover:ring-primary/30">
              <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" /><span className="flex-1">{t}</span>
            </button>
          ))}
          <div className="flex gap-2 pt-0.5">
            <Button type="button" size="sm" className="h-8 rounded-full flex-1" onClick={() => { onAdd(ideas); setIdeas([]); }}>Tạo tất cả</Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setIdeas([])}>Bỏ qua</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={ai} disabled={busy} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Chia thành việc con bằng AI
        </button>
      )}
    </div>
  );
}
