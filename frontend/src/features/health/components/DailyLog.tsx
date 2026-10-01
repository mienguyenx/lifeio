import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressBar, Surface, TINTS } from '@/components/lio';
import type { HealthLog } from '@/hooks/sync/useHealthSync';
import { METRICS, MOOD_EMOJI, fmt, latest, pctOf, valueOn, type MetricDef, type MetricId } from '../utils/health.utils';

/** Thẻ ghi nhận theo chỉ số trong ngày đang chọn — bấm “+” để ghi nhanh, bấm thẻ để mở form. */
export function DailyLog({ logs, day, onQuick, onOpen }: { logs: HealthLog[]; day: string; onQuick: (m: MetricDef, v: number) => void; onOpen: (t: MetricId) => void }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {METRICS.map((m) => {
        const v = valueOn(logs, m, day);
        const last = m.id === 'weight' ? latest(logs, 'weight', day) : undefined;
        const prev = last ? latest(logs.filter((l) => l.id !== last.id), 'weight', last.date) : undefined;
        return (
          <Surface key={m.id} className="p-3.5 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card" onClick={() => onOpen(m.id)}>
            <div className="flex items-center gap-2.5">
              <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center text-[18px] shrink-0', TINTS[m.tint].bg)}>{m.emoji}</span>
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] text-muted-foreground">{m.name}</span>
                <span className="block text-[18px] font-extrabold leading-tight tabular-nums truncate">
                  {m.id === 'weight' ? (last ? `${last.value} kg` : '–') : m.id === 'mood' ? (v ? MOOD_EMOJI[v - 1] : '–') : fmt(m, v)}
                  {m.target && <span className="text-[12px] font-medium text-muted-foreground"> / {m.target.toLocaleString('vi-VN')} {m.unit}</span>}
                </span>
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 min-h-[28px]">
              {m.target ? (
                <>
                  <ProgressBar value={pctOf(m, v)} color={m.color} className="flex-1" />
                  <span className="text-[11.5px] font-bold tabular-nums w-9 text-right">{pctOf(m, v)}%</span>
                  {m.quick && <button onClick={(e) => { e.stopPropagation(); onQuick(m, m.quick![0]); }} aria-label={`Thêm ${m.quick[0]} ${m.unit}`} title={`+${m.quick[0]} ${m.unit}`} className="h-7 w-7 rounded-full grid place-items-center border border-border bg-card hover:bg-secondary shrink-0"><Plus className="h-3.5 w-3.5" /></button>}
                </>
              ) : m.id === 'mood' ? (
                <div className="flex gap-1">{MOOD_EMOJI.map((e, i) => <button key={e} onClick={(ev) => { ev.stopPropagation(); onQuick(m, i + 1); }} className={cn('h-7 w-7 rounded-full text-[15px]', v === i + 1 ? 'bg-lavender' : 'opacity-60 hover:opacity-100')}>{e}</button>)}</div>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">{last && prev ? `${last.value - prev.value > 0 ? '+' : ''}${(last.value - prev.value).toFixed(1)} kg so với lần trước` : last ? `Ghi lúc ${last.date.slice(8)}/${last.date.slice(5, 7)}` : 'Chưa có dữ liệu'}</span>
              )}
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
