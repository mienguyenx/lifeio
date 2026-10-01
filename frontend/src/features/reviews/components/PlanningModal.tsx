import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type BucketListItem, type LifeArea, type QuarterlyFocus, type YearlyGoalItem } from '@/types/lifeos';
import { BUCKET_CATEGORIES } from '../utils/reviews.utils';

export type PlanDraft = { theme: string; mantra: string; reflections: string; yearlyGoals: YearlyGoalItem[]; bucketList: BucketListItem[]; quarterlyFocus: QuarterlyFocus[] };
export const EMPTY_QUARTERS = (): QuarterlyFocus[] => [1, 2, 3, 4].map((q) => ({ quarter: q as 1 | 2 | 3 | 4, focus: [] }));
const MODAL = 'sm:max-w-[600px] rounded-[28px] max-h-[92vh] overflow-y-auto';
const selCls = 'h-11 rounded-2xl bg-card w-[132px] shrink-0';
const addBtn = 'h-11 w-11 shrink-0 grid place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40';
const chip = 'flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2 text-[13px]';

export function PlanningModal({ open, onOpenChange, year, initial, isEdit, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; year: number; initial: PlanDraft; isEdit: boolean; onSubmit: (d: PlanDraft) => boolean }) {
  const [d, setD] = useState(initial);
  const [g, setG] = useState<{ title: string; area: LifeArea }>({ title: '', area: 'career' });
  const [b, setB] = useState({ title: '', category: 'other' });
  const [q, setQ] = useState<Record<number, string>>({});
  useEffect(() => { if (open) { setD(initial); setG({ title: '', area: 'career' }); setB({ title: '', category: 'other' }); setQ({}); } }, [open, initial]);
  const set = (p: Partial<PlanDraft>) => setD((x) => ({ ...x, ...p }));
  const addGoal = () => { if (!g.title.trim()) return; set({ yearlyGoals: [...d.yearlyGoals, { id: crypto.randomUUID(), title: g.title.trim(), area: g.area, status: 'planned', progress: 0 }] }); setG({ ...g, title: '' }); };
  const addBucket = () => { if (!b.title.trim()) return; set({ bucketList: [...d.bucketList, { id: crypto.randomUUID(), title: b.title.trim(), category: b.category, completed: false }] }); setB({ ...b, title: '' }); };
  const addQ = (n: number) => { const t = q[n]?.trim(); if (!t) return; set({ quarterlyFocus: d.quarterlyFocus.map((x) => (x.quarter === n ? { ...x, focus: [...x.focus, t] } : x)) }); setQ({ ...q, [n]: '' }); };
  const enter = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); fn(); } };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={isEdit ? `Sửa kế hoạch ${year}` : `Lập kế hoạch ${year}`} className={MODAL}>
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); if (onSubmit(d)) onOpenChange(false); }}>
        <Field label="✨ Chủ đề năm *"><input autoFocus value={d.theme} onChange={(e) => set({ theme: e.target.value })} placeholder="VD: Năm của sự tập trung" className={fieldCls} /></Field>
        <Field label="Mantra / Khẩu hiệu"><input value={d.mantra} onChange={(e) => set({ mantra: e.target.value })} placeholder="VD: Hành động nhỏ, kết quả lớn" className={fieldCls} /></Field>

        <Field label={`🎯 Goals năm (${d.yearlyGoals.length})`}>
          {d.yearlyGoals.length > 0 && <ul className="space-y-1.5 mb-2">{d.yearlyGoals.map((x) => { const a = LIFE_AREAS.find((y) => y.id === x.area); return (
            <li key={x.id} className={chip}><span>{a?.icon}</span><span className="flex-1 min-w-0 truncate">{x.title}</span><button type="button" onClick={() => set({ yearlyGoals: d.yearlyGoals.filter((y) => y.id !== x.id) })} aria-label="Xóa"><X className="h-4 w-4 text-muted-foreground" /></button></li>
          ); })}</ul>}
          <div className="flex gap-2">
            <Select value={g.area} onValueChange={(v) => setG({ ...g, area: v as LifeArea })}><SelectTrigger className={selCls}><SelectValue /></SelectTrigger><SelectContent>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent></Select>
            <input value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} onKeyDown={enter(addGoal)} placeholder="Tên goal..." className={cn(fieldCls, 'flex-1 min-w-0')} />
            <button type="button" onClick={addGoal} disabled={!g.title.trim()} className={addBtn} aria-label="Thêm goal"><Plus className="h-4 w-4" /></button>
          </div>
        </Field>

        <Field label={`📍 Bucket list (${d.bucketList.length})`}>
          {d.bucketList.length > 0 && <ul className="space-y-1.5 mb-2">{d.bucketList.map((x) => { const c = BUCKET_CATEGORIES.find((y) => y.id === (x.category || 'other')); return (
            <li key={x.id} className={chip}><span>{c?.icon}</span><span className="flex-1 min-w-0 truncate">{x.title}</span><button type="button" onClick={() => set({ bucketList: d.bucketList.filter((y) => y.id !== x.id) })} aria-label="Xóa"><X className="h-4 w-4 text-muted-foreground" /></button></li>
          ); })}</ul>}
          <div className="flex gap-2">
            <Select value={b.category} onValueChange={(v) => setB({ ...b, category: v })}><SelectTrigger className={selCls}><SelectValue /></SelectTrigger><SelectContent>{BUCKET_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select>
            <input value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} onKeyDown={enter(addBucket)} placeholder="Mục tiêu..." className={cn(fieldCls, 'flex-1 min-w-0')} />
            <button type="button" onClick={addBucket} disabled={!b.title.trim()} className={addBtn} aria-label="Thêm bucket"><Plus className="h-4 w-4" /></button>
          </div>
        </Field>

        <Field label="📅 Focus theo quý">
          <div className="grid sm:grid-cols-2 gap-2">
            {d.quarterlyFocus.map((x) => (
              <div key={x.quarter} className="rounded-2xl border border-border/70 p-2.5 min-w-0">
                <p className="text-[12px] font-bold mb-1.5">Q{x.quarter}</p>
                {x.focus.map((f, i) => <div key={i} className="flex items-center gap-1.5 text-[12.5px] py-0.5"><span className="flex-1 min-w-0 truncate">• {f}</span><button type="button" onClick={() => set({ quarterlyFocus: d.quarterlyFocus.map((y) => (y.quarter === x.quarter ? { ...y, focus: y.focus.filter((_, j) => j !== i) } : y)) })} aria-label="Xóa"><X className="h-3.5 w-3.5 text-muted-foreground" /></button></div>)}
                <div className="flex gap-1.5 mt-1"><input value={q[x.quarter] ?? ''} onChange={(e) => setQ({ ...q, [x.quarter]: e.target.value })} onKeyDown={enter(() => addQ(x.quarter))} placeholder={`Focus Q${x.quarter}...`} className="h-9 flex-1 min-w-0 rounded-xl border border-border bg-card px-2.5 text-[12.5px] focus:outline-none focus:ring-4 focus:ring-primary/10" /><button type="button" onClick={() => addQ(x.quarter)} className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-secondary" aria-label="Thêm"><Plus className="h-3.5 w-3.5" /></button></div>
              </div>
            ))}
          </div>
        </Field>
        <Field label="Suy ngẫm"><textarea rows={3} value={d.reflections} onChange={(e) => set({ reflections: e.target.value })} placeholder="Những suy nghĩ và định hướng..." className={areaCls} /></Field>
        <FormActions onCancel={() => onOpenChange(false)} submitLabel={isEdit ? 'Cập nhật' : 'Tạo kế hoạch'} />
      </form>
    </AdaptiveModal>
  );
}
