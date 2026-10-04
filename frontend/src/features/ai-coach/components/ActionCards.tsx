import { Check, CheckCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TINTS } from '@/components/lio';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { describeAction, type AssistantAction } from '../voice/assistant';

/** Thẻ xác nhận cho các hành động AI đề xuất (tạo công việc, thói quen…). */
export function ActionCards({ actions, onConfirm, onDismiss, onConfirmAll, compact, className }: {
  actions: AssistantAction[];
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
  onConfirmAll?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const pending = actions.filter((a) => a.status === 'pending').length;
  return (
    <div className={cn('space-y-2 min-w-0', className)}>
      {actions.map((a) => {
        const d = describeAction(a);
        const done = a.status === 'done'; const gone = a.status === 'dismissed' || a.status === 'undone';
        return (
          <div key={a.id} className={cn('flex items-start gap-3 rounded-[18px] border bg-card px-3 py-2.5 shadow-soft transition-opacity', done ? 'border-emerald-300/70 dark:border-emerald-500/40' : 'border-border/70', gone && 'opacity-50')}>
            <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[d.tint].bg)}><LifeIcon name={d.icon as LifeIconName} size={20} variant="duotone" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d.kind}</p>
              <p className={cn('text-[13.5px] font-semibold leading-snug break-words', gone && 'line-through')}>{d.title}</p>
              {!!d.meta.length && !compact && (
                <div className="mt-1 flex flex-wrap gap-1">{d.meta.map((m) => <span key={m} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{m}</span>)}</div>
              )}
            </div>
            {a.status === 'pending' ? (
              <div className="flex shrink-0 gap-1">
                <button onClick={() => onDismiss(a.id)} aria-label="Bỏ qua" title="Bỏ qua" className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                <button onClick={() => onConfirm(a.id)} aria-label="Xác nhận" title="Xác nhận" className="h-8 w-8 rounded-full grid place-items-center bg-primary text-primary-foreground shadow-soft"><Check className="h-4 w-4" /></button>
              </div>
            ) : (
              <span className={cn('shrink-0 text-[11.5px] font-semibold mt-1', done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>{done ? 'Đã lưu ✓' : a.status === 'undone' ? 'Đã hoàn tác' : 'Đã bỏ qua'}</span>
            )}
          </div>
        );
      })}
      {pending > 1 && onConfirmAll && (
        <button onClick={onConfirmAll} className="w-full h-9 rounded-full bg-primary/10 text-primary text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/15"><CheckCheck className="h-4 w-4" />Xác nhận tất cả ({pending})</button>
      )}
    </div>
  );
}
