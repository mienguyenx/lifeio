/** Thành phần form dùng chung cho mọi modal của LIO UI Kit (Module 11+). */
import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const fieldCls = 'h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[14px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10';
export const areaCls = 'w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[14px] leading-relaxed resize-none focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10';

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center justify-between mb-1.5 gap-2"><p className="text-[12.5px] font-semibold text-muted-foreground">{label}</p>{hint}</div>
      {children}
    </div>
  );
}

/** Lưới lựa chọn dạng ô (danh mục, loại…) — giống form Health/Finance. */
export function ChoiceGrid<T extends string>({ items, value, onChange, cols = 3 }: { items: { id: T; label: ReactNode; icon?: ReactNode; color?: string }[]; value: T; onChange: (v: T) => void; cols?: 3 | 4 | 5 }) {
  return (
    <div className={cn('grid gap-2', cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : 'grid-cols-5')}>
      {items.map((x) => (
        <button key={x.id} type="button" onClick={() => onChange(x.id)} className={cn('h-16 min-w-0 rounded-2xl border flex flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold transition-all', value === x.id ? 'border-primary ring-4 ring-primary/10 text-primary' : 'border-border/70 text-muted-foreground')}>
          {x.icon && <span className="h-7 w-7 rounded-lg grid place-items-center text-[15px]" style={{ background: x.color ? `${x.color}26` : 'hsl(var(--secondary))' }}>{x.icon}</span>}
          <span className="truncate max-w-full px-1">{x.label}</span>
        </button>
      ))}
    </div>
  );
}

export function StarRating({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)} className={cn(!onChange && 'cursor-default')} aria-label={`${i} sao`}>
          <Star style={{ width: size, height: size }} className={i <= value ? 'fill-[#FFB020] text-[#FFB020]' : 'text-muted-foreground/30'} />
        </button>
      ))}
    </span>
  );
}

export function FormActions({ onCancel, submitLabel = 'Lưu', disabled }: { onCancel: () => void; submitLabel?: string; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      <Button type="button" variant="outline" className="h-11 rounded-full" onClick={onCancel}>Hủy</Button>
      <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={disabled}>{submitLabel}</Button>
    </div>
  );
}
