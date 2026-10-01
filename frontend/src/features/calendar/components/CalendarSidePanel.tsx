import { useState } from 'react';
import { Plus, Timer } from 'lucide-react';
import { Mascot } from '@/components/brand/Mascot';
import type { CalendarItem } from '../types/calendar.types';
import { EventRow } from './EventChip';

export function TodayPanel({ title, items, onOpen }: { title: string; items: CalendarItem[]; onOpen: (i: CalendarItem) => void }) {
  return (
    <div className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[14px] font-bold">{title}</p>
        <span className="text-[12px] text-muted-foreground">{items.length} mục</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground py-2">Chưa có gì trong ngày này. Thêm một sự kiện nhé!</p>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">{items.map((it) => <EventRow key={it.id} item={it} onClick={() => onOpen(it)} />)}</div>
      )}
    </div>
  );
}

/** Thêm nhanh: Enter → tạo Task có hạn vào ngày đang chọn. */
export function QuickAddBox({ dateLabel, onAdd }: { dateLabel: string; onAdd: (title: string) => void }) {
  const [v, setV] = useState('');
  const submit = () => { if (v.trim()) { onAdd(v.trim()); setV(''); } };
  return (
    <div className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4">
      <p className="text-[14px] font-bold mb-2.5">Thêm nhanh</p>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={`Thêm vào ${dateLabel}...`}
          className="h-10 flex-1 min-w-0 rounded-full bg-secondary/60 border border-transparent px-4 text-[13px] focus:outline-none focus:bg-card focus:border-primary/40" />
        <button onClick={submit} className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-soft" aria-label="Thêm"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/** Thời gian Focus hôm nay (phiên Pomodoro) + tỉ lệ mục hôm nay đã xong. */
export function FocusCard({ minutes, sessions, donePct }: { minutes: number; sessions: number; donePct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5"><Timer className="h-4 w-4 text-[#F2557A]" />Focus hôm nay</p>
        <p className="text-[24px] font-extrabold tracking-tight mt-0.5">{Math.floor(minutes / 60)}h {minutes % 60}m</p>
        <p className="text-[11.5px] text-muted-foreground">{sessions} phiên tập trung</p>
      </div>
      <div className="relative h-16 w-16 shrink-0" title="Mục hôm nay đã hoàn thành">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-secondary" />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round" stroke="url(#calg)" strokeDasharray={c} strokeDashoffset={c * (1 - donePct / 100)} />
          <defs><linearGradient id="calg"><stop offset="0" stopColor="#7C6CF2" /><stop offset="1" stopColor="#4D9DFF" /></linearGradient></defs>
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[13px] font-bold">{donePct}%</span>
      </div>
    </div>
  );
}

export function QuoteCard() {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-lavender to-[#FFEFF4] dark:from-primary/15 dark:to-[#F2557A]/10 p-4 pr-24 min-h-[104px]">
      <p className="text-[13px] italic font-medium text-primary leading-snug">“Một ngày được lên kế hoạch tốt là một ngày gần hơn tới phiên bản tốt nhất của bạn!”</p>
      <Mascot name="mochi" size={92} className="absolute -right-1 -bottom-2" />
    </div>
  );
}
