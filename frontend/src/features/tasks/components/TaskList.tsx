import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import { groupTasks } from '../utils/task.utils';
import { TaskCard, TaskRow, type TaskItemActions } from './TaskItem';

const GROUP_DOT: Record<string, string> = {
  overdue: '#FF6B78', today: '#6D5DF2', upcoming: '#5B9CF6', someday: '#B5BAC7', done: '#22B07D',
};

/** Desktop: grouped table. Mobile: grouped cards. */
export function TaskList({ tasks, mobile, ...actions }: { tasks: Task[]; mobile?: boolean } & TaskItemActions) {
  const groups = groupTasks(tasks);
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
              <div className={mobile ? 'space-y-2.5' : 'divide-y divide-border/50'}>
                {g.tasks.map((t) => (mobile ? <TaskCard key={t.id} task={t} {...actions} /> : <TaskRow key={t.id} task={t} {...actions} />))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
