import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { groupTasks } from '../utils/task.utils';
import { TaskCard, TaskRow, type TaskItemActions } from './TaskItem';
import { TaskMobileRow, type TaskMobileExtra } from './TaskMobileRow';

const GROUP_DOT: Record<string, string> = {
  overdue: '#FF6B78', today: '#6D5DF2', upcoming: '#5B9CF6', someday: '#B5BAC7', done: '#22B07D',
};

/** Desktop: grouped table. Mobile: grouped cards. */
export interface TaskTree {
  /** Tra việc theo id (để hiện tên việc cha). */
  byId: Map<string, Task>;
  /** Mọi việc con của một việc. */
  childrenOf: Map<string, Task[]>;
}

/** Tách việc con có việc cha nằm trong danh sách — chúng sẽ hiện ngay dưới việc cha. */
function nest(list: Task[]) {
  const ids = new Set(list.map((t) => t.id));
  const kids = new Map<string, Task[]>();
  const roots: Task[] = [];
  for (const t of list) {
    if (t.parentId && ids.has(t.parentId)) kids.set(t.parentId, [...(kids.get(t.parentId) ?? []), t]);
    else roots.push(t);
  }
  // việc con chưa xong lên trước
  for (const arr of kids.values()) arr.sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  return { roots, kids };
}

export function TaskList({ tasks, mobile, extra, tree, ...actions }: { tasks: Task[]; mobile?: boolean; extra?: TaskMobileExtra; tree?: TaskTree } & TaskItemActions) {
  const { roots: rootTasks, kids } = nest(tasks);
  const groups = groupTasks(rootTasks);
  const [closedKids, setClosedKids] = useState<Record<string, boolean>>({});
  const info = (t: Task) => {
    const all = tree?.childrenOf.get(t.id) ?? [];
    return {
      parentTitle: t.parentId ? tree?.byId.get(t.parentId)?.title : undefined,
      kids: all.length ? { done: all.filter((c) => c.status === 'done').length, total: all.length } : undefined,
    };
  };
  const renderGroup = (list: Task[]) => {
    const out: JSX.Element[] = [];
    for (const r of list) {
      const ch = kids.get(r.id) ?? [];
      const open = !closedKids[r.id];
      const meta = info(r);
      const toggle = ch.length ? () => setClosedKids((c) => ({ ...c, [r.id]: !c[r.id] })) : undefined;
      out.push(mobile && extra
        ? <TaskMobileRow key={r.id} task={r} extra={extra} {...meta} kidsOpen={open} onToggleKids={toggle} {...actions} />
        : mobile ? <TaskCard key={r.id} task={r} {...actions} /> : <TaskRow key={r.id} task={r} {...meta} kidsOpen={open} onToggleKids={toggle} {...actions} />);
      if (open) for (const c of ch) {
        out.push(mobile && extra
          ? <TaskMobileRow key={c.id} task={c} extra={extra} depth={1} {...info(c)} parentTitle={undefined} {...actions} />
          : mobile ? <TaskCard key={c.id} task={c} {...actions} /> : <TaskRow key={c.id} task={c} depth={1} {...info(c)} parentTitle={undefined} {...actions} />);
      }
    }
    return out;
  };
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: groups.length > 1 });

  return (
    <div className="space-y-4">
      {!mobile && (
        <div className="grid grid-cols-[28px_minmax(0,1fr)_96px_120px_104px_36px] gap-3 px-6 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          <span />
          <span>Công việc</span>
          <span>Ưu tiên</span>
          <span>Hạn</span>
          <span>Trạng thái</span>
          <span />
        </div>
      )}
      {groups.map((g) => {
        const isCollapsed = collapsed[g.id];
        return (
          <section key={g.id} className={cn(!mobile && 'rounded-[24px] bg-card border border-border/70 shadow-soft p-2')}>
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [g.id]: !c[g.id] }))}
              className={cn('w-full flex items-center gap-2 text-left', mobile ? 'px-1 py-2' : 'px-3 py-2.5')}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: GROUP_DOT[g.id] }} />
              <span className="text-[14px] font-bold text-foreground">{g.title}</span>
              {g.subtitle && <span className="text-[13px] text-muted-foreground capitalize">· {g.subtitle}</span>}
              <span className="text-[12px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5 ml-1">{g.tasks.length} việc</span>
              <ChevronDown className={cn('h-4 w-4 ml-auto text-muted-foreground transition-transform', isCollapsed && '-rotate-90')} />
            </button>
            {!isCollapsed && (
              mobile && extra ? (
                <div className="rounded-[20px] bg-card border border-border/60 shadow-soft overflow-hidden divide-y divide-border/50">
                  {renderGroup(g.tasks)}
                </div>
              ) : (
                <div className={mobile ? 'space-y-2.5' : 'divide-y divide-border/50'}>
                  {renderGroup(g.tasks)}
                </div>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}
