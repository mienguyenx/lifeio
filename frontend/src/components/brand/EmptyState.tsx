import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Mascot, MascotName } from './Mascot';

interface EmptyStateProps {
  mascot: MascotName;
  pose?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

/** Trạng thái trống chuẩn LifeOS — mascot + 1 câu + 1 hành động (Visual Spec §14) */
export function EmptyState({ mascot, pose, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center rounded-xl border border-dashed border-border bg-card', compact ? 'gap-2 p-6' : 'gap-3 p-10', className)}>
      <Mascot name={mascot} pose={pose} size={compact ? 72 : 112} />
      <div className="space-y-1 max-w-sm">
        <p className={cn('font-semibold text-foreground', compact ? 'text-card-title' : 'text-section')}>{title}</p>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
