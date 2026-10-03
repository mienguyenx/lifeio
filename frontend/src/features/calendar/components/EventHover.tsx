import type { ReactElement } from 'react';
import { CalendarDays, Check, Clock } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { LIFE_AREAS } from '@/types/lifeos';
import type { CalendarItem } from '../types/calendar.types';
import { TYPE_META, dayLabel, tintBg } from '../utils/calendar.utils';

const canHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

/** Rê chuột vào mục lịch → thẻ xem nhanh (chỉ thiết bị có chuột; cảm ứng vẫn chạm để mở chi tiết). */
export function EventHover({ item, children, onOpen }: { item: CalendarItem; children: ReactElement; onOpen: () => void }) {
  if (!canHover()) return children;
  const m = TYPE_META[item.type]; const Icon = m.icon; const area = LIFE_AREAS.find((a) => a.id === item.area);
  return (
    <HoverCard openDelay={250} closeDelay={60}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" sideOffset={6} collisionPadding={12} className="w-72 rounded-2xl p-3.5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-2.5">
          <span className="h-9 w-9 rounded-xl grid place-items-center shrink-0" style={{ background: tintBg(m.color, 18), color: m.color }}><Icon className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: m.color }}>{m.label}{item.completed ? ' · Đã xong' : ''}</p>
            <p className={`text-[14px] font-semibold leading-snug break-words line-clamp-3 ${item.completed && item.type === 'task' ? 'line-through text-muted-foreground' : ''}`}>{item.title}</p>
          </div>
          {item.completed && <Check className="h-4 w-4 text-[#22B07D] shrink-0 mt-1" />}
        </div>
        <div className="mt-2.5 space-y-1 text-[12.5px] text-muted-foreground">
          <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{dayLabel(item.date)}</p>
          <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{item.start ? `${item.start}${item.end ? ` – ${item.end}` : ''}` : 'Cả ngày'}</p>
          {(item.meta || area) && <p className="truncate">{[item.meta, area && `${area.icon} ${area.name}`].filter(Boolean).join(' · ')}</p>}
        </div>
        {item.description && <p className="mt-2 rounded-xl bg-secondary/60 px-2.5 py-2 text-[12.5px] leading-relaxed whitespace-pre-line line-clamp-6">{item.description}</p>}
        <button type="button" onClick={onOpen} className="mt-2.5 w-full h-8 rounded-full bg-primary/10 text-primary text-[12.5px] font-semibold hover:bg-primary/15">Mở chi tiết</button>
      </HoverCardContent>
    </HoverCard>
  );
}
