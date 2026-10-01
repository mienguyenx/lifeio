import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { ArrowLeft, CalendarDays, Lightbulb, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Mascot } from '@/components/brand/Mascot';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { useAdminTemplates, useUpdateTemplate } from '@/hooks/useAdminData';
import { FieldLabel, PriorityPicker, fieldCls } from '@/features/tasks/components/TaskFormFields';
import { EMPTY_GOAL, type GoalFormValue } from '../utils/goal.utils';

/** Tạo / sửa mục tiêu — đúng các trường store hỗ trợ (+ mẫu từ admin templates như trang cũ). */
export function GoalCreateModal({ open, onOpenChange, initial, mode = 'create', onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; initial?: GoalFormValue; mode?: 'create' | 'edit'; onSubmit: (f: GoalFormValue) => void;
}) {
  const [f, setF] = useState<GoalFormValue>(EMPTY_GOAL);
  const [ms, setMs] = useState('');
  const [step, setStep] = useState<'form' | 'templates'>('form');
  const { data: templates = [], isLoading } = useAdminTemplates('goals');
  const updateTemplate = useUpdateTemplate();
  const active = useMemo(() => templates.filter((t) => t.is_active), [templates]);
  useEffect(() => { if (open) { setF(initial ?? EMPTY_GOAL); setMs(''); setStep('form'); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof GoalFormValue>(k: K, v: GoalFormValue[K]) => setF((p) => ({ ...p, [k]: v }));
  const addMs = () => { if (ms.trim()) { set('milestones', [...f.milestones, ms.trim()]); setMs(''); } };

  const applyTemplate = (t: (typeof active)[number]) => {
    const c = t.content as { title?: string; description?: string; area?: LifeArea; milestones?: string[]; suggested_duration_days?: number; priority?: string };
    setF({ ...EMPTY_GOAL, title: c.title || t.name, description: c.description || t.description || '', area: c.area || 'career',
      milestones: c.milestones || [], targetDate: format(addDays(new Date(), c.suggested_duration_days || 90), 'yyyy-MM-dd'),
      priority: (['low', 'medium', 'high'].includes(c.priority || '') ? c.priority : 'medium') as GoalFormValue['priority'] });
    updateTemplate.mutate({ id: t.id, usage_count: (t.usage_count || 0) + 1 });
    setStep('form');
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'} className="sm:max-w-[540px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      {step === 'templates' ? (
        <div className="space-y-2.5 min-w-0">
          <button onClick={() => setStep('form')} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary mb-1"><ArrowLeft className="h-4 w-4" />Quay lại</button>
          {isLoading && <p className="text-center py-6 text-sm text-muted-foreground">Đang tải mẫu…</p>}
          {!isLoading && active.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Chưa có mẫu nào</p>}
          {active.map((t) => {
            const c = t.content as { area?: LifeArea; milestones?: string[]; suggested_duration_days?: number };
            return (
              <button key={t.id} onClick={() => applyTemplate(t)} className="w-full flex items-center gap-3 rounded-2xl border border-border p-3 text-left hover:border-primary/40 hover:bg-lavender/40">
                <span className="h-10 w-10 rounded-[14px] grid place-items-center text-lg shrink-0" style={{ background: `hsl(var(--area-${c.area || 'career'}) / 0.14)` }}>{LIFE_AREAS.find((a) => a.id === c.area)?.icon || '🎯'}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{t.name}</span>
                  <span className="block text-[12px] text-muted-foreground truncate">{(c.milestones || []).length} mốc · {c.suggested_duration_days || 90} ngày{t.description ? ` · ${t.description}` : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) onSubmit(f); }} className="space-y-4 min-w-0">
          {mode === 'create' && (
            <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-lavender to-[#FFEFF4] dark:from-primary/15 dark:to-[#F2557A]/10 p-4 pr-24">
              <p className="text-[13.5px] font-semibold text-primary leading-snug">Biến ước mơ thành kế hoạch, và kế hoạch thành hiện thực ✨</p>
              <button type="button" onClick={() => setStep('templates')} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[12px] font-semibold shadow-soft">
                <Lightbulb className="h-3.5 w-3.5 text-[#E8961C]" />Chọn từ mẫu ({active.length})
              </button>
              <Mascot name="lumi" pose="happy" size={84} className="absolute right-2 -bottom-1" />
            </div>
          )}
          <div>
            <FieldLabel>Tên mục tiêu <span className="text-destructive">*</span></FieldLabel>
            <input autoFocus value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="VD: Đọc 20 cuốn sách trong năm nay" className={fieldCls} />
          </div>
          <div>
            <FieldLabel>Mô tả</FieldLabel>
            <textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Thêm mô tả chi tiết về mục tiêu…" className={cn(fieldCls, 'h-auto py-2.5 resize-none')} />
          </div>
          <div>
            <FieldLabel>Lĩnh vực</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {LIFE_AREAS.map((a) => {
                const on = f.area === a.id;
                return (
                  <button key={a.id} type="button" onClick={() => set('area', a.id)} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold border inline-flex items-center gap-1.5 transition-all', on ? 'border-transparent' : 'border-border/70 text-muted-foreground hover:text-foreground')}
                    style={on ? { background: `hsl(var(--area-${a.id}) / 0.16)`, color: `hsl(var(--area-${a.id}))` } : undefined}>
                    <span>{a.icon}</span>{a.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Ngày mục tiêu</FieldLabel>
              <label className="relative block">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input type="date" value={f.targetDate} onChange={(e) => set('targetDate', e.target.value)} className={cn(fieldCls, 'pl-10')} />
              </label>
            </div>
            <div>
              <FieldLabel>Nhắc trước hạn</FieldLabel>
              <div className="h-11 rounded-2xl border border-border bg-card px-3 flex items-center gap-2">
                <Switch checked={f.reminderEnabled} onCheckedChange={(v) => set('reminderEnabled', v)} />
                <input type="number" min={1} max={60} value={f.reminderDays} disabled={!f.reminderEnabled} onChange={(e) => set('reminderDays', Math.max(1, Number(e.target.value) || 7))} className="w-12 bg-transparent text-[14px] text-center focus:outline-none disabled:opacity-40" />
                <span className="text-[12.5px] text-muted-foreground">ngày</span>
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Mức ưu tiên</FieldLabel>
            <PriorityPicker value={f.priority} onChange={(p) => set('priority', p)} />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-border/70 px-3.5 py-3 cursor-pointer">
            <Switch checked={f.isFocused} onCheckedChange={(v) => set('isFocused', v)} />
            <span><span className="block text-[13.5px] font-semibold">Mục tiêu lớn</span><span className="block text-[12px] text-muted-foreground">Bật Focus mode — hiển thị nổi bật trên trang</span></span>
          </label>
          {mode === 'create' && (
            <div>
              <FieldLabel>Mốc quan trọng ban đầu</FieldLabel>
              <div className="space-y-1.5">
                {f.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-2xl bg-secondary/50 px-3 py-2 text-[13px]">
                    <span className="h-5 w-5 rounded-full border-2 border-primary/40 shrink-0" />
                    <span className="flex-1 truncate">{m}</span>
                    <button type="button" onClick={() => set('milestones', f.milestones.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={ms} onChange={(e) => setMs(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMs(); } }} placeholder="Thêm mốc đầu tiên…" className={fieldCls} />
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-2xl shrink-0" onClick={addMs}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!f.title.trim()}>{mode === 'edit' ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</Button>
          </div>
        </form>
      )}
    </AdaptiveModal>
  );
}
