import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface, SectionTitle, Empty } from '@/components/lio';
import type { JournalEntry } from '@/types/lifeos';
import { longDate, moodOf, titleOf, todayKey } from '../utils/journal.utils';

const WD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function JournalCalendar({ entries, onOpen, onWrite }: { entries: JournalEntry[]; onOpen: (e: JournalEntry) => void; onWrite: (date: string) => void }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(todayKey());
  const byDate = useMemo(() => {
    const m = new Map<string, JournalEntry[]>();
    entries.forEach((e) => m.set(e.date, [...(m.get(e.date) || []), e]));
    return m;
  }, [entries]);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const dayEntries = byDate.get(selected) || [];
  const today = todayKey();

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
      <Surface className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-bold capitalize">{format(month, 'MMMM yyyy', { locale: vi })}</p>
          <div className="flex gap-1">
            <button onClick={() => setMonth((m) => addMonths(m, -1))} className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => { setMonth(startOfMonth(new Date())); setSelected(today); }} className="h-9 px-3 rounded-full text-[12.5px] font-semibold hover:bg-secondary">Hôm nay</button>
            <button onClick={() => setMonth((m) => addMonths(m, 1))} className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-[11.5px] font-semibold text-muted-foreground mb-1">{WD.map((w) => <span key={w} className="py-1">{w}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const k = format(day, 'yyyy-MM-dd'); const list = byDate.get(k) || []; const mood = moodOf(list[0]?.mood);
            return (
              <button key={k} onClick={() => setSelected(k)} className={cn('aspect-square sm:aspect-[1.3] rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[13px] transition-colors',
                !isSameMonth(day, month) && 'opacity-35', selected === k ? 'bg-primary text-primary-foreground shadow-soft' : 'hover:bg-secondary', k === today && selected !== k && 'ring-1 ring-primary/40 text-primary font-bold')}>
                <span className="tabular-nums">{format(day, 'd')}</span>
                <span className="h-1.5 flex gap-0.5">{list.slice(0, 3).map((e) => <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: selected === k ? '#fff' : moodOf(e.mood)?.color }} />)}</span>
                {mood && <span className="sr-only">{mood.label}</span>}
              </button>
            );
          })}
        </div>
      </Surface>
      <Surface className="p-4 sm:p-5">
        <SectionTitle title="Bài viết trong ngày" hint={`${dayEntries.length} bài`} />
        <p className="text-[12.5px] text-muted-foreground -mt-2 mb-3">{longDate(selected)}</p>
        <div className="space-y-2">
          {dayEntries.length === 0 && <Empty>Chưa có nhật ký cho ngày này.</Empty>}
          {dayEntries.map((e) => (
            <button key={e.id} onClick={() => onOpen(e)} className="w-full flex items-center gap-3 rounded-2xl bg-secondary/50 hover:bg-secondary p-3 text-left">
              <span className="text-[22px]">{moodOf(e.mood)?.emoji}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold truncate">{titleOf(e)}</span>
                <span className="block text-[11.5px] text-muted-foreground">{e.createdAt ? new Date(e.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span></span>
            </button>
          ))}
        </div>
        <button onClick={() => onWrite(selected)} className="mt-3 w-full h-11 rounded-2xl bg-lavender dark:bg-primary/15 text-primary text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"><Plus className="h-4 w-4" />Viết nhật ký cho ngày này</button>
      </Surface>
    </div>
  );
}
