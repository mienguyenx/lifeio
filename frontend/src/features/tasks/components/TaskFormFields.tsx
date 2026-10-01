import { cn } from '@/lib/utils';
import { PriorityIcon } from '@/components/icons/LifeIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import type { TaskPriority } from '../types/task.types';
import { PRIORITY_META } from '../utils/task.utils';

export const fieldCls =
  'h-11 w-full rounded-2xl bg-card border border-border px-3.5 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] font-semibold text-muted-foreground mb-1.5">{children}</p>;
}

export function PriorityPicker({ value, onChange }: { value: TaskPriority; onChange: (p: TaskPriority) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
        const on = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-pressed={on}
            className={cn(
              'h-10 rounded-full border text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all',
              on ? 'border-primary bg-lavender text-primary shadow-soft dark:bg-primary/15' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary',
            )}
          >
            <PriorityIcon priority={p} size={16} variant={on ? 'filled' : 'outline'} />
            {PRIORITY_META[p].label}
          </button>
        );
      })}
    </div>
  );
}

export function AreaSelect({ value, onChange }: { value?: LifeArea; onChange: (a?: LifeArea) => void }) {
  return (
    <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? undefined : (v as LifeArea))}>
      <SelectTrigger className="h-11 rounded-2xl bg-card border-border"><SelectValue placeholder="Chọn lĩnh vực" /></SelectTrigger>
      <SelectContent className="rounded-2xl">
        <SelectItem value="none">Không có</SelectItem>
        {LIFE_AREAS.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--area-${a.id}))` }} />{a.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
