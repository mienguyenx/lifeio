import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, Lightbulb, Minus, Plus, Target } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mascot } from '@/components/brand/Mascot';
import { useAdminTemplates, useUpdateTemplate } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Goal, type LifeArea } from '@/types/lifeos';
import type { HabitFormValue } from '../types/habit.types';
import { EMPTY_FORM, WEEKDAY_SHORT } from '../utils/habit.utils';

const ICONS = ['💧', '📚', '🏃', '🧘', '🗣️', '🥗', '😴', '💪', '✍️', '🎯', '🌿', '☀️', '🍎', '🚴', '🎵', '💊', '🧠', '💰', '❤️', '🙏'];
const COLORS = ['', '#6D5DF2', '#5B9CF6', '#57D3AE', '#FFC63D', '#FF9B63', '#FF6B78', '#F472B6'];
const UNITS = ['lần', 'ly', 'phút', 'trang', 'km', 'bước'];

const input = 'h-11 w-full rounded-2xl bg-card border border-border px-3.5 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all';
const Label = ({ children }: { children: React.ReactNode }) => <p className="text-[13px] font-semibold mb-2">{children}</p>;
const pill = (on: boolean) => cn('h-10 rounded-full text-[13px] font-semibold border transition-all', on ? 'bg-primary text-primary-foreground border-primary shadow-soft' : 'border-border text-muted-foreground hover:bg-secondary');

export function HabitCreateModal({ open, onOpenChange, initial, mode = 'create', goals, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: HabitFormValue;
  mode?: 'create' | 'edit';
  goals: Goal[];
  onSubmit: (v: HabitFormValue) => void;
}) {
  const [f, setF] = useState<HabitFormValue>(EMPTY_FORM);
  const [step, setStep] = useState<'form' | 'templates'>('form');
  const { data: templates = [], isLoading } = useAdminTemplates('habits');
  const updateTemplate = useUpdateTemplate();
  const activeTemplates = useMemo(() => templates.filter((t) => t.is_active), [templates]);
  const activeGoals = useMemo(() => goals.filter((g) => !g.deletedAt && !g.completedAt), [goals]);

  useEffect(() => { if (open) { setF(initial ?? EMPTY_FORM); setStep('form'); } }, [open, initial]);
  const set = <K extends keyof HabitFormValue>(k: K, v: HabitFormValue[K]) => setF((p) => ({ ...p, [k]: v }));

  const applyTemplate = (t: (typeof templates)[number]) => {
    const c = t.content as { name?: string; description?: string; area?: LifeArea; frequency?: HabitFormValue['frequency']; target_per_day?: number; target_unit?: string };
    const area = c.area || 'health';
    setF({ ...EMPTY_FORM, name: c.name || t.name, description: c.description || t.description || '', area, icon: LIFE_AREAS.find((a) => a.id === area)?.icon ?? '✨', frequency: c.frequency || 'daily', targetPerDay: c.target_per_day || 1, targetUnit: c.target_unit || '' });
    setStep('form');
    updateTemplate.mutate({ id: t.id, usage_count: (t.usage_count || 0) + 1 });
  };

  const submit = () => { if (!f.name.trim()) return; onSubmit(f); onOpenChange(false); };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa thói quen' : 'Thêm thói quen mới'} className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      {step === 'templates' ? (
        <div className="space-y-3">
          <button onClick={() => setStep('form')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary"><ChevronLeft className="h-4 w-4" />Quay lại</button>
          {isLoading && <p className="text-center py-6 text-muted-foreground text-sm">Đang tải mẫu…</p>}
          {!isLoading && activeTemplates.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">Chưa có mẫu nào</p>}
          {activeTemplates.map((t) => {
            const c = t.content as { area?: LifeArea; target_per_day?: number; target_unit?: string };
            return (
              <button key={t.id} onClick={() => applyTemplate(t)} className="w-full flex items-center gap-3 rounded-2xl border border-border p-3 text-left hover:border-primary/40 hover:bg-lavender/40">
                <span className="h-10 w-10 rounded-[14px] grid place-items-center text-lg" style={{ background: `hsl(var(--area-${c.area || 'health'}) / 0.14)` }}>{LIFE_AREAS.find((a) => a.id === c.area)?.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{t.name}</span>
                  <span className="block text-[12px] text-muted-foreground truncate">{c.target_per_day || 1} {c.target_unit || ''}/ngày{t.description ? ` · ${t.description}` : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5 min-w-0">
          {mode === 'create' && (
            <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-lavender to-[#E9FBF4] dark:from-primary/15 dark:to-[#57D3AE]/10 p-4 pr-24">
              <p className="text-[13.5px] font-semibold text-primary leading-snug">Một thói quen tốt là khởi đầu cho một tương lai tuyệt vời! 💜</p>
              <button type="button" disabled={isLoading} onClick={() => setStep('templates')} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[12px] font-semibold shadow-soft">
                <Lightbulb className="h-3.5 w-3.5 text-[#F5A524]" />Chọn từ mẫu ({activeTemplates.length})
              </button>
              <Mascot name="taro" pose="care" size={84} className="absolute right-1 -bottom-2" />
            </div>
          )}

          <div>
            <Label>Tên thói quen</Label>
            <input autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Uống nước" className={input} />
          </div>

          <div>
            <Label>Biểu tượng & màu sắc</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => set('icon', ic)} className={cn('h-11 w-11 shrink-0 rounded-[14px] text-[20px] grid place-items-center border-2 transition-all', f.icon === ic ? 'border-primary bg-lavender dark:bg-primary/15' : 'border-transparent bg-secondary/70 hover:bg-secondary')}>{ic}</button>
              ))}
            </div>
            <div className="flex gap-2.5 mt-3">
              {COLORS.map((c) => (
                <button key={c || 'area'} type="button" onClick={() => set('color', c)} title={c ? c : 'Theo lĩnh vực'}
                  className={cn('h-8 w-8 rounded-full border-2 transition-all', f.color === c ? 'border-foreground scale-110' : 'border-transparent')}
                  style={{ background: c || `conic-gradient(hsl(var(--area-${f.area})) 0 50%, hsl(var(--area-${f.area}) / 0.35) 0)` }} />
              ))}
            </div>
          </div>

          <div>
            <Label>Lĩnh vực cuộc sống</Label>
            <Select value={f.area} onValueChange={(v) => set('area', v as LifeArea)}>
              <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tần suất</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((v) => (
                <button key={v} type="button" onClick={() => set('frequency', v)} className={pill(f.frequency === v)}>{({ daily: 'Hàng ngày', weekly: 'Hàng tuần', custom: 'Tùy chỉnh' })[v]}</button>
              ))}
            </div>
            {f.frequency === 'weekly' && (
              <div className="flex justify-between mt-3">
                {WEEKDAY_SHORT.map((d, i) => (
                  <button key={d} type="button" onClick={() => set('customDays', f.customDays.includes(i) ? f.customDays.filter((x) => x !== i) : [...f.customDays, i])}
                    className={cn('h-10 w-10 rounded-full text-[12.5px] font-semibold transition-colors', f.customDays.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70')}>{d}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Mục tiêu mỗi ngày</Label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => set('targetPerDay', Math.max(1, f.targetPerDay - 1))} className="h-11 w-11 shrink-0 rounded-full border border-border grid place-items-center hover:bg-secondary" aria-label="Giảm"><Minus className="h-4 w-4" /></button>
              <input type="number" min={1} value={f.targetPerDay} onChange={(e) => set('targetPerDay', Math.max(1, parseInt(e.target.value) || 1))} className={cn(input, 'w-20 text-center font-bold')} />
              <button type="button" onClick={() => set('targetPerDay', f.targetPerDay + 1)} className="h-11 w-11 shrink-0 rounded-full border border-border grid place-items-center hover:bg-secondary" aria-label="Tăng"><Plus className="h-4 w-4" /></button>
              <input list="habit-units" value={f.targetUnit} onChange={(e) => set('targetUnit', e.target.value)} placeholder="Đơn vị (ly, phút…)" className={cn(input, 'flex-1')} />
              <datalist id="habit-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
            </div>
          </div>

          <div>
            <Label>Nhắc nhở (tùy chọn)</Label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 h-12">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <input type="time" value={f.reminderTime} onChange={(e) => set('reminderTime', e.target.value)} className="flex-1 bg-transparent text-[14px] focus:outline-none" />
              <Switch checked={f.reminderEnabled} disabled={!f.reminderTime} onCheckedChange={(v) => set('reminderEnabled', v)} />
            </div>
          </div>

          <div>
            <Label>Phiên bản tối thiểu (tùy chọn)</Label>
            <input value={f.minimumVersion} onChange={(e) => set('minimumVersion', e.target.value)} placeholder="VD: Chỉ 5 phút đi bộ vào ngày bận rộn" className={input} />
          </div>

          <div>
            <Label><span className="inline-flex items-center gap-1.5"><Target className="h-4 w-4 text-primary" />Liên kết mục tiêu (tùy chọn)</span></Label>
            <Select value={f.goalId || 'none'} onValueChange={(v) => set('goalId', v === 'none' ? '' : v)}>
              <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="none">Không liên kết</SelectItem>
                {activeGoals.map((g) => <SelectItem key={g.id} value={g.id}>{LIFE_AREAS.find((a) => a.id === g.area)?.icon} {g.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {f.goalId && (
              <div className="flex items-center gap-2 mt-2 text-[12.5px] text-muted-foreground">
                Số ngày mục tiêu
                <input type="number" min={1} value={f.targetDays} onChange={(e) => set('targetDays', parseInt(e.target.value) || 30)} className={cn(input, 'h-9 w-20 text-center')} />
              </div>
            )}
          </div>

          <div>
            <Label>Mô tả (tùy chọn)</Label>
            <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Thêm mô tả để nhắc nhở bản thân…" className={cn(input, 'h-auto py-2.5 resize-none')} />
          </div>

          <Button type="submit" disabled={!f.name.trim()} className="w-full h-12 rounded-full text-[15px]">{mode === 'edit' ? 'Lưu thay đổi' : 'Tạo thói quen'}</Button>
        </form>
      )}
    </AdaptiveModal>
  );
}
