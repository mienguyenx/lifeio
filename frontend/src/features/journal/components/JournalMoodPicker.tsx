import { cn } from '@/lib/utils';
import { ENERGIES, MOODS, type Level } from '../utils/journal.utils';

export function MoodPicker({ value, onChange }: { value: Level; onChange: (v: Level) => void }) {
  return (
    <div className="flex gap-1.5">
      {MOODS.map((m) => (
        <button key={m.value} type="button" title={m.label} onClick={() => onChange(m.value as Level)}
          className={cn('h-11 flex-1 rounded-2xl text-[22px] grid place-items-center border transition-all', value === m.value ? 'scale-105 shadow-soft' : 'border-transparent bg-secondary/60 grayscale-[40%] opacity-70 hover:opacity-100')}
          style={value === m.value ? { background: `${m.color}22`, borderColor: m.color } : undefined}>{m.emoji}</button>
      ))}
    </div>
  );
}

/** Năng lượng — dạng cột tăng dần như tham chiếu. */
export function EnergyPicker({ value, onChange }: { value: Level; onChange: (v: Level) => void }) {
  return (
    <div className="flex items-end gap-1.5 h-11 rounded-2xl bg-secondary/60 px-3 py-2">
      {ENERGIES.map((e) => (
        <button key={e.value} type="button" title={e.label} onClick={() => onChange(e.value as Level)} className="flex-1 h-full flex items-end" aria-label={e.label}>
          <span className={cn('w-full rounded-md transition-all', e.value <= value ? 'bg-primary' : 'bg-primary/15')} style={{ height: `${30 + e.value * 14}%` }} />
        </button>
      ))}
      <span className="ml-1 text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap w-[72px] text-right">{ENERGIES[value - 1].label}</span>
    </div>
  );
}
