import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { TINTS } from '@/components/lio';
import { METRICS, MOOD_EMOJI, metricOf } from '../utils/health.utils';
import type { HealthDraft } from '../hooks/useHealth';

const fieldCls = 'h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[14px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10';
const Label = ({ children }: { children: React.ReactNode }) => <p className="text-[12.5px] font-semibold text-muted-foreground mb-1.5">{children}</p>;

export function HealthLogModal({ open, onOpenChange, mode, initial, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial: HealthDraft; onSubmit: (d: HealthDraft) => void }) {
  const [d, setD] = useState(initial);
  useEffect(() => { if (open) setD(initial); }, [open, initial]);
  const m = metricOf(d.type);
  const set = <K extends keyof HealthDraft>(k: K, v: HealthDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const valid = d.value !== '' && !Number.isNaN(parseFloat(d.value));
  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa ghi nhận' : 'Ghi nhận sức khỏe'} className="sm:max-w-[500px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); if (valid) { onSubmit(d); onOpenChange(false); } }}>
        <div>
          <Label>Chỉ số</Label>
          <div className="grid grid-cols-3 gap-2">
            {METRICS.map((x) => (
              <button key={x.id} type="button" onClick={() => set('type', x.id)} className={cn('h-16 rounded-2xl border flex flex-col items-center justify-center gap-0.5 text-[12px] font-semibold transition-all', d.type === x.id ? 'border-primary ring-4 ring-primary/10 text-primary' : 'border-border/70 text-muted-foreground')}>
                <span className={cn('h-7 w-7 rounded-lg grid place-items-center text-[15px]', TINTS[x.tint].bg)}>{x.emoji}</span>{x.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Giá trị ({m.unit})</Label>
          {m.id === 'mood' ? (
            <div className="flex gap-1.5">{MOOD_EMOJI.map((e, i) => (
              <button key={e} type="button" onClick={() => set('value', String(i + 1))} className={cn('h-12 flex-1 rounded-2xl text-[22px] border', d.value === String(i + 1) ? 'border-primary bg-lavender' : 'border-transparent bg-secondary/60 opacity-70')}>{e}</button>
            ))}</div>
          ) : (
            <>
              <input autoFocus type="number" inputMode="decimal" step="any" value={d.value} onChange={(e) => set('value', e.target.value)} placeholder={`Nhập ${m.unit}`} className={fieldCls} />
              {m.quick && <div className="flex gap-1.5 mt-2">{m.quick.map((q) => (
                <button key={q} type="button" onClick={() => set('value', String(q))} className="h-8 px-3 rounded-full bg-lavender dark:bg-primary/15 text-primary text-[12px] font-semibold">{q.toLocaleString('vi-VN')} {m.unit}</button>
              ))}</div>}
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Ngày</Label>
            <label className="relative block"><CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="date" value={d.date} onChange={(e) => set('date', e.target.value)} className={cn(fieldCls, 'pl-10')} /></label>
          </div>
          <div><Label>Ghi chú</Label><input value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Tùy chọn…" className={fieldCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!valid}>{mode === 'edit' ? 'Cập nhật' : 'Lưu'}</Button>
        </div>
      </form>
    </AdaptiveModal>
  );
}
