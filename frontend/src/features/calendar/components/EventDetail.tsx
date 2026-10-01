import { ArrowRight, CalendarDays, Clock, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { LIFE_AREAS } from '@/types/lifeos';
import type { CalendarItem } from '../types/calendar.types';
import { TYPE_META, dayLabel } from '../utils/calendar.utils';

/** Chi tiết cho mục chỉ-đọc (nhật ký, Focus, review, mục tiêu) — chỉnh sửa tại module gốc. */
export function EventDetail({ item, onOpenChange }: { item: CalendarItem | null; onOpenChange: (o: boolean) => void }) {
  if (!item) return null;
  const m = TYPE_META[item.type]; const Icon = m.icon; const area = LIFE_AREAS.find((a) => a.id === item.area);
  return (
    <AdaptiveModal open={!!item} onOpenChange={onOpenChange} title={m.label} className="sm:max-w-[460px] rounded-[28px]">
      <div className="space-y-4 min-w-0">
        <div className="flex items-start gap-3">
          <span className="h-12 w-12 rounded-2xl grid place-items-center shrink-0" style={{ background: m.tint, color: m.color }}><Icon className="h-6 w-6" /></span>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold" style={{ background: m.tint, color: m.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />{m.label}
            </span>
            <h3 className="text-[18px] font-bold leading-snug mt-1 break-words">{item.title}</h3>
          </div>
        </div>
        <div className="space-y-2 text-[13.5px]">
          <p className="flex items-center gap-2.5 text-muted-foreground"><CalendarDays className="h-4 w-4" />{dayLabel(item.date)}</p>
          <p className="flex items-center gap-2.5 text-muted-foreground"><Clock className="h-4 w-4" />{item.start ? `${item.start}${item.end ? ` – ${item.end}` : ''}` : 'Cả ngày'}</p>
          {item.meta && <p className="flex items-center gap-2.5 text-muted-foreground"><Info className="h-4 w-4" />{item.meta}{area ? ` · ${area.icon} ${area.name}` : ''}</p>}
        </div>
        {item.description && <p className="rounded-2xl bg-secondary/50 p-3 text-[13px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{item.description}</p>}
        <Button asChild className="w-full h-11 rounded-full shadow-soft">
          <Link to={item.href}>Mở trong {m.module}<ArrowRight className="h-4 w-4 ml-1.5" /></Link>
        </Button>
      </div>
    </AdaptiveModal>
  );
}
