import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LIFE_AREAS, type Goal } from '@/types/lifeos';
import { FieldLabel, PriorityPicker, fieldCls } from '@/features/tasks/components/TaskFormFields';
import type { EventDraft } from '../types/calendar.types';
import { EMPTY_DRAFT } from '../utils/calendar.utils';

const REPEAT = [
  { v: 'none', l: 'Không lặp lại' }, { v: 'daily', l: 'Hàng ngày' }, { v: 'weekly', l: 'Hàng tuần' }, { v: 'monthly', l: 'Hàng tháng' },
] as const;
const REMIND = [
  { v: 0, l: 'Không nhắc' }, { v: 5, l: 'Trước 5 phút' }, { v: 10, l: 'Trước 10 phút' }, { v: 15, l: 'Trước 15 phút' }, { v: 30, l: 'Trước 30 phút' }, { v: 60, l: 'Trước 1 giờ' },
];

/** Thêm sự kiện — lưu thành Task (cùng dữ liệu với module Công việc). */
export function EventModal({ open, onOpenChange, initial, goals, onCreate }: {
  open: boolean; onOpenChange: (o: boolean) => void; initial: Partial<EventDraft>; goals: Goal[]; onCreate: (d: EventDraft) => Promise<void> | void;
}) {
  const [d, setD] = useState<EventDraft>(EMPTY_DRAFT(''));
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setD({ ...EMPTY_DRAFT(initial.date || ''), ...initial }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const activeGoals = useMemo(() => goals.filter((g) => !g.deletedAt && !g.completedAt), [goals]);
  const isEvent = d.kind === 'event';

  const submit = async () => {
    if (!d.title.trim() || !d.date) return;
    setBusy(true);
    try { await onCreate(d); onOpenChange(false); } finally { setBusy(false); }
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Thêm sự kiện mới" className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 min-w-0">
        <div className="grid grid-cols-2 p-1 rounded-full bg-secondary/70">
          {(['event', 'todo'] as const).map((k) => (
            <button key={k} type="button" onClick={() => set('kind', k)} className={cn('h-9 rounded-full text-[13px] font-semibold transition-all', d.kind === k ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground')}>
              {k === 'event' ? 'Sự kiện' : 'Việc cần làm'}
            </button>
          ))}
        </div>

        <div>
          <FieldLabel>Tiêu đề <span className="text-destructive">*</span></FieldLabel>
          <input autoFocus value={d.title} onChange={(e) => set('title', e.target.value)} placeholder={isEvent ? 'VD: Họp team, Tập thể dục…' : 'VD: Gửi báo cáo tuần'} className={fieldCls} />
        </div>
        <div>
          <FieldLabel>Mô tả</FieldLabel>
          <textarea value={d.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Thêm mô tả (tùy chọn)…" className={cn(fieldCls, 'h-auto py-2.5 resize-none')} />
        </div>

        <div>
          <FieldLabel>Thời gian <span className="text-destructive">*</span></FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <label className="relative">
              <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input type="date" value={d.date} onChange={(e) => set('date', e.target.value)} className={cn(fieldCls, 'pl-10')} />
            </label>
            {isEvent && (
              <label className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input type="time" value={d.time} disabled={d.allDay} onChange={(e) => set('time', e.target.value)} className={cn(fieldCls, 'pl-10 disabled:opacity-40')} />
              </label>
            )}
          </div>
          {isEvent && (
            <label className="mt-2.5 flex items-center gap-2.5 text-[13px] font-medium cursor-pointer w-fit">
              <Switch checked={d.allDay} onCheckedChange={(v) => set('allDay', v)} />Sự kiện cả ngày
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Lặp lại</FieldLabel>
            <Select value={d.repeat} onValueChange={(v) => set('repeat', v as EventDraft['repeat'])}>
              <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{REPEAT.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Nhắc nhở</FieldLabel>
            <Select value={String(d.reminderMinutes)} onValueChange={(v) => set('reminderMinutes', Number(v))} disabled={!isEvent || d.allDay}>
              <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{REMIND.map((r) => <SelectItem key={r.v} value={String(r.v)}>{r.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel>Danh mục (lĩnh vực)</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {LIFE_AREAS.map((a) => {
              const on = d.area === a.id;
              return (
                <button key={a.id} type="button" onClick={() => set('area', on ? undefined : a.id)}
                  className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold border inline-flex items-center gap-1.5 transition-all', on ? 'border-transparent' : 'border-border/70 text-muted-foreground hover:text-foreground')}
                  style={on ? { background: `hsl(var(--area-${a.id}) / 0.16)`, color: `hsl(var(--area-${a.id}))` } : undefined}>
                  <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--area-${a.id}))` }} />{a.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Mức ưu tiên</FieldLabel>
          <PriorityPicker value={d.priority} onChange={(p) => set('priority', p)} />
        </div>

        <div>
          <FieldLabel>Liên kết</FieldLabel>
          <Select value={d.goalId || 'none'} onValueChange={(v) => set('goalId', v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 rounded-2xl bg-card"><span className="flex items-center gap-2 truncate"><Target className="h-4 w-4 text-primary shrink-0" /><SelectValue /></span></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không gắn mục tiêu</SelectItem>
              {activeGoals.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={busy || !d.title.trim() || !d.date}>{isEvent ? 'Tạo sự kiện' : 'Tạo việc cần làm'}</Button>
        </div>
      </form>
    </AdaptiveModal>
  );
}
