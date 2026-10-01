import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarItem } from '../types/calendar.types';
import { TYPE_META, WEEKDAYS, fromMin, key, layoutDay, toMin } from '../utils/calendar.utils';
import { EventChip } from './EventChip';

/** Lưới giờ cho chế độ Tuần (7 cột) và Ngày (1 cột). */
export function TimeGridView({ days, byDate, onOpen, onAdd, onDropTask, compact }: {
  days: Date[]; byDate: Record<string, CalendarItem[]>;
  onOpen: (i: CalendarItem) => void; onAdd: (k: string, time?: string) => void;
  onDropTask: (taskId: string, k: string, time?: string) => void; compact?: boolean;
}) {
  const H = compact ? 44 : 56;
  const scroller = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { scroller.current?.scrollTo({ top: 6.5 * H }); }, [H]);

  const keys = days.map(key);
  const today = key(now);
  const allDay = useMemo(() => keys.map((k) => (byDate[k] || []).filter((i) => !i.start)), [keys.join(), byDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const timed = useMemo(() => keys.map((k) => layoutDay(byDate[k] || [])), [keys.join(), byDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasAllDay = allDay.some((l) => l.length);
  const gutter = compact ? 'grid-cols-[34px_repeat(var(--n),minmax(0,1fr))]' : 'grid-cols-[56px_repeat(var(--n),minmax(0,1fr))]';
  const style = { ['--n' as string]: days.length } as React.CSSProperties;
  const slotTime = (e: React.MouseEvent | React.DragEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const m = Math.max(0, Math.min(23 * 60 + 30, Math.floor(((e.clientY - r.top) / H) * 2) * 30));
    return fromMin(m);
  };

  return (
    <div className="rounded-[22px] bg-card border border-border/60 shadow-soft overflow-hidden flex flex-col">
      {/* Header */}
      <div className={cn('grid border-b border-border/60', gutter)} style={style}>
        <div />
        {days.map((d, i) => {
          const k = keys[i];
          return (
            <div key={k} className="py-2 flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground">{WEEKDAYS[(d.getDay() + 6) % 7]}</span>
              <span className={cn('h-8 w-8 grid place-items-center rounded-full text-[14px] font-bold', k === today && 'bg-primary text-primary-foreground shadow-soft')}>{format(d, 'd')}</span>
            </div>
          );
        })}
      </div>
      {/* All-day */}
      {hasAllDay && (
        <div className={cn('grid border-b border-border/60 bg-secondary/20', gutter)} style={style}>
          <div className="text-[10px] text-muted-foreground px-1 py-1.5 text-right">{compact ? '' : 'Cả ngày'}</div>
          {allDay.map((list, i) => (
            <div key={keys[i]} className="p-1 space-y-0.5 border-l border-border/40 max-h-[84px] overflow-y-auto no-scrollbar">
              {list.map((it) => <EventChip key={it.id} item={it} compact onClick={() => onOpen(it)} draggable={it.type === 'task'} />)}
            </div>
          ))}
        </div>
      )}
      {/* Grid */}
      <div ref={scroller} className="relative overflow-y-auto" style={{ maxHeight: compact ? 520 : 640 }}>
        <div className={cn('grid relative', gutter)} style={{ ...style, height: 24 * H }}>
          <div className="relative">
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="absolute right-1.5 -translate-y-1/2 text-[10.5px] text-muted-foreground tabular-nums" style={{ top: h * H }}>{h === 0 ? '' : compact ? h : `${String(h).padStart(2, '0')}:00`}</span>
            ))}
          </div>
          {keys.map((k, i) => (
            <div
              key={k}
              className={cn('relative border-l border-border/40', k === today && 'bg-lavender/25 dark:bg-primary/5')}
              onClick={(e) => onAdd(k, slotTime(e))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onDropTask(id, k, slotTime(e)); }}
            >
              {Array.from({ length: 24 }, (_, h) => <div key={h} className="absolute inset-x-0 border-t border-border/40" style={{ top: h * H }} />)}
              {timed[i].map(({ item, s, e, lane, lanes }) => {
                const m = TYPE_META[item.type];
                const h = Math.max(((e - s) / 60) * H, 22);
                return (
                  <button
                    key={item.id}
                    draggable={item.type === 'task'}
                    onDragStart={(ev) => { ev.dataTransfer.setData('text/plain', item.refId); ev.dataTransfer.effectAllowed = 'move'; }}
                    onClick={(ev) => { ev.stopPropagation(); onOpen(item); }}
                    className={cn('absolute py-1 text-left overflow-hidden border-l-[3px] hover:brightness-[0.97] hover:shadow-soft transition-all', compact ? 'rounded-md px-1' : 'rounded-xl px-1.5')}
                    style={{ top: (s / 60) * H + 1, height: h - 2, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)`, background: m.tint, borderColor: m.color }}
                    title={`${item.start}${item.end ? '–' + item.end : ''} · ${item.title}`}
                  >
                    <p className={cn('font-semibold leading-tight text-foreground/85 truncate', compact ? 'text-[10px]' : 'text-[11.5px]', item.completed && item.type === 'task' && 'line-through opacity-70')}>{item.title}</p>
                    {!compact && h > 34 && <p className="text-[10.5px] tabular-nums" style={{ color: m.color }}>{item.start}{item.end ? ` – ${item.end}` : ''}</p>}
                  </button>
                );
              })}
              {k === today && (
                <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top: (toMin(format(now, 'HH:mm')) / 60) * H }}>
                  <div className="relative h-[2px] bg-[#F2557A]"><span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-[#F2557A]" /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
