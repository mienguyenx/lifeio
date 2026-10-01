
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/brand/EmptyState';
import type { CalendarItem } from '../types/calendar.types';
import { dayLabel, todayKey } from '../utils/calendar.utils';
import { EventRow } from './EventChip';

/** Danh sách theo ngày (Agenda) — dùng cho desktop & mobile. */
export function AgendaView({ dayKeys, byDate, onOpen, emptyText = 'Không có mục nào trong khoảng này' }: {
  dayKeys: string[]; byDate: Record<string, CalendarItem[]>; onOpen: (i: CalendarItem) => void; emptyText?: string;
}) {
  const days = dayKeys.filter((k) => byDate[k]?.length);
  const today = todayKey();
  if (!days.length) return <EmptyState mascot="mochi" pose="rest" compact title={emptyText} description="Thêm sự kiện hoặc việc cần làm để lên kế hoạch nhé." />;
  return (
    <div className="space-y-5">
      {days.map((k) => (
        <section key={k} className="space-y-2">
          <h3 className={cn('px-1 text-[13px] font-bold flex items-center gap-2', k === today ? 'text-primary' : 'text-foreground')}>
            {k === today && <span className="rounded-full bg-primary text-primary-foreground text-[10.5px] px-2 py-0.5">Hôm nay</span>}
            {dayLabel(k)}
            <span className="text-muted-foreground font-medium text-[12px]">· {byDate[k].length} mục</span>
          </h3>
          <div className="space-y-2">{byDate[k].map((it) => <EventRow key={it.id} item={it} onClick={() => onOpen(it)} />)}</div>
        </section>
      ))}
    </div>
  );
}
