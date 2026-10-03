import { CalendarDays, Columns3, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import type { TaskCounts, TaskPriority, TaskTab, TaskView } from '../types/task.types';
import { PRIORITY_META, TAB_LABEL } from '../utils/task.utils';

const TABS: TaskTab[] = ['all', 'today', 'upcoming', 'overdue', 'completed'];

export function TaskTabs({ tab, onTab, counts, tabs = TABS, className }: {
  tab: TaskTab; onTab: (t: TaskTab) => void; counts: TaskCounts; tabs?: TaskTab[]; className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex gap-1.5 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((t) => {
        const active = t === tab;
        const n = counts[t];
        return (
          <button
            key={t}
            role="tab"
            aria-selected={active}
            onClick={() => onTab(t)}
            className={cn(
              'shrink-0 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-all',
              active
                ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.6)]'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {TAB_LABEL[t]}
            <span className={cn('ml-1.5 tabular-nums', active ? 'opacity-80' : 'opacity-60')}>({n})</span>
          </button>
        );
      })}
    </div>
  );
}

const VIEWS: { id: TaskView; label: string; Icon: typeof List }[] = [
  { id: 'list', label: 'Danh sách', Icon: List },
  { id: 'board', label: 'Bảng', Icon: Columns3 },
  { id: 'calendar', label: 'Lịch', Icon: CalendarDays },
];

export function ViewSwitcher({ view, onView, compact }: { view: TaskView; onView: (v: TaskView) => void; compact?: boolean }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-secondary/80 border border-border/60">
      {VIEWS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onView(id)}
          aria-pressed={view === id}
          aria-label={label}
          className={cn(
            compact ? 'h-8 w-8 justify-center' : 'h-8 px-3', 'rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-all',
            view === id ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-3.5 w-3.5'} />{!compact && label}
        </button>
      ))}
    </div>
  );
}

export function TaskSearch({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm công việc…"
        className="h-10 w-full rounded-full bg-secondary/70 border border-transparent pl-10 pr-9 text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full hover:bg-secondary" aria-label="Xoá tìm kiếm">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function TaskFilterPopover({ area, priority, onArea, onPriority, compact }: {
  area: LifeArea | 'all'; priority: TaskPriority | 'all'; compact?: boolean;
  onArea: (a: LifeArea | 'all') => void; onPriority: (p: TaskPriority | 'all') => void;
}) {
  const active = (area !== 'all' ? 1 : 0) + (priority !== 'all' ? 1 : 0);
  const pill = (on: boolean) => cn(
    'h-8 px-3 rounded-full text-[12.5px] font-semibold border transition-colors',
    on ? 'bg-lavender text-primary border-primary/30 dark:bg-primary/15' : 'border-border text-muted-foreground hover:text-foreground',
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="Lọc" className={cn(compact ? 'h-10 w-10 justify-center px-0' : 'h-10 px-3.5', 'rounded-full border border-border bg-card text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-secondary transition-colors', active && 'border-primary/40 text-primary')}>
          <SlidersHorizontal className="h-4 w-4" />{!compact && 'Lọc'}
          {active > 0 && <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] grid place-items-center">{active}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-3xl p-4 space-y-4">
        <div>
          <p className="text-[12px] font-semibold text-muted-foreground mb-2">Mức ưu tiên</p>
          <div className="flex flex-wrap gap-1.5">
            <button className={pill(priority === 'all')} onClick={() => onPriority('all')}>Tất cả</button>
            {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
              <button key={p} className={pill(priority === p)} onClick={() => onPriority(p)}>{PRIORITY_META[p].label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-muted-foreground mb-2">Lĩnh vực</p>
          <div className="flex flex-wrap gap-1.5">
            <button className={pill(area === 'all')} onClick={() => onArea('all')}>Tất cả</button>
            {LIFE_AREAS.map((a) => (
              <button key={a.id} className={pill(area === a.id)} onClick={() => onArea(a.id)}>{a.name}</button>
            ))}
          </div>
        </div>
        {active > 0 && (
          <button className="text-[12.5px] font-semibold text-primary" onClick={() => { onArea('all'); onPriority('all'); }}>Xoá bộ lọc</button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Nút chọn chế độ xem gọn (mobile): 1 icon, chạm mở menu. */
export function ViewMenu({ view, onView }: { view: TaskView; onView: (v: TaskView) => void }) {
  const Cur = VIEWS.find((v) => v.id === view)!.Icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Chế độ xem" className="h-10 w-10 grid place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors"><Cur className="h-4 w-4" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl">
        {VIEWS.map(({ id, label, Icon }) => (
          <DropdownMenuItem key={id} onClick={() => onView(id)} className={cn(view === id && 'text-primary font-semibold')}><Icon className="h-4 w-4 mr-2" />{label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
