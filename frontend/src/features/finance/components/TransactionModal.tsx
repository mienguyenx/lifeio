import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { SegmentedTabs } from '@/components/lio';
import { categoriesOf, formatVND, type TxType } from '../utils/finance.utils';
import type { TxDraft } from '../hooks/useFinance';

const fieldCls = 'h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[14px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10';
const Label = ({ children }: { children: React.ReactNode }) => <p className="text-[12.5px] font-semibold text-muted-foreground mb-1.5">{children}</p>;

export function TransactionModal({ open, onOpenChange, mode, initial, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial: TxDraft; onSubmit: (d: TxDraft) => void }) {
  const [d, setD] = useState(initial);
  useEffect(() => { if (open) setD(initial); }, [open, initial]);
  const set = <K extends keyof TxDraft>(k: K, v: TxDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const amount = parseFloat(d.amount);
  const valid = amount > 0 && d.description.trim() !== '';
  const cats = categoriesOf(d.type);
  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'} className="sm:max-w-[500px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); if (valid) { onSubmit({ ...d, description: d.description.trim() }); onOpenChange(false); } }}>
        <SegmentedTabs full items={[{ id: 'expense', label: '💸 Chi tiêu' }, { id: 'income', label: '💰 Thu nhập' }]} value={d.type}
          onChange={(t: TxType) => setD((p) => ({ ...p, type: t, category: categoriesOf(t)[0].id }))} />
        <div>
          <Label>Số tiền (VNĐ)</Label>
          <input autoFocus type="number" inputMode="numeric" min="0" step="1000" value={d.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" className={cn(fieldCls, 'text-[18px] font-bold')} />
          {amount > 0 && <p className={cn('text-[12px] mt-1 font-semibold', d.type === 'income' ? 'text-[#22B07D]' : 'text-[#F2557A]')}>{d.type === 'income' ? '+' : '-'}{formatVND(amount)}</p>}
        </div>
        <div>
          <Label>Danh mục</Label>
          <div className="grid grid-cols-4 gap-2">
            {cats.map((c) => (
              <button key={c.id} type="button" onClick={() => set('category', c.id)} className={cn('h-16 rounded-2xl border flex flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold transition-all min-w-0', d.category === c.id ? 'border-primary ring-4 ring-primary/10 text-primary' : 'border-border/70 text-muted-foreground')}>
                <span className="h-7 w-7 rounded-lg grid place-items-center text-[15px]" style={{ background: `${c.color}33` }}>{c.icon}</span><span className="truncate max-w-full px-1">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div><Label>Mô tả</Label><input value={d.description} onChange={(e) => set('description', e.target.value)} placeholder="Ví dụ: Ăn trưa với đồng nghiệp" className={fieldCls} /></div>
        <div><Label>Ngày</Label>
          <label className="relative block"><CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="date" value={d.date} onChange={(e) => set('date', e.target.value)} className={cn(fieldCls, 'pl-10')} /></label>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!valid}>{mode === 'edit' ? 'Cập nhật' : 'Lưu'}</Button>
        </div>
      </form>
    </AdaptiveModal>
  );
}
