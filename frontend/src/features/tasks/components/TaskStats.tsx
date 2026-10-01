import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { cn } from '@/lib/utils';
import type { TaskCounts } from '../types/task.types';

interface StatProps { icon: LifeIconName; value: string | number; label: string; tint: string; onClick?: () => void; active?: boolean }

function Stat({ icon, value, label, tint, onClick, active }: StatProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-[20px] bg-card border border-border/70 px-4 py-3.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card',
        active && 'ring-2 ring-primary/30',
      )}
    >
      <span className={cn('h-11 w-11 rounded-[14px] grid place-items-center shrink-0', tint)}>
        <LifeIcon name={icon} size={24} variant="duotone" />
      </span>
      <span className="min-w-0">
        <span className="block text-[22px] leading-none font-bold text-foreground tabular-nums">{value}</span>
        <span className="block text-[12px] text-muted-foreground mt-1 truncate">{label}</span>
      </span>
    </button>
  );
}

export function TaskStats({ counts, onPick, tab }: { counts: TaskCounts; onPick: (t: 'today' | 'overdue' | 'completed' | 'all') => void; tab: string }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat icon="module/tasks" value={counts.today} label="Việc hôm nay" tint="bg-[#FFF1E8] dark:bg-[#FF9B63]/15" onClick={() => onPick('today')} active={tab === 'today'} />
      <Stat icon="priority/high" value={counts.highPriority} label="Ưu tiên cao" tint="bg-[#FFECEE] dark:bg-[#FF6B78]/15" onClick={() => onPick('all')} />
      <Stat icon="status/warning" value={counts.overdue} label="Quá hạn" tint="bg-[#FFF6D9] dark:bg-[#FFC63D]/15" onClick={() => onPick('overdue')} active={tab === 'overdue'} />
      <Stat icon="status/success" value={`${counts.completionRate}%`} label="Hoàn thành hôm nay" tint="bg-[#E6F8F1] dark:bg-[#57D3AE]/15" onClick={() => onPick('completed')} active={tab === 'completed'} />
    </div>
  );
}
