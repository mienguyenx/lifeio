import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BookOpen, CalendarCheck, CheckCircle2, Flame, Target, Timer, type LucideIcon } from 'lucide-react';
import type { CalendarItem, CalendarItemType, CalendarView, EventDraft } from '../types/calendar.types';

export const key = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayKey = () => key(new Date());
export const fromKey = (k: string) => parseISO(k);
export const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const TYPE_META: Record<CalendarItemType, { label: string; color: string; tint: string; icon: LucideIcon; module: string }> = {
  task: { label: 'Công việc', color: '#6C5CE7', tint: '#F0EDFF', icon: CheckCircle2, module: 'Công việc' },
  habit: { label: 'Thói quen', color: '#22B07D', tint: '#E4F7EF', icon: Flame, module: 'Thói quen' },
  journal: { label: 'Nhật ký', color: '#E8961C', tint: '#FFF4DE', icon: BookOpen, module: 'Nhật ký' },
  pomodoro: { label: 'Focus', color: '#F2557A', tint: '#FFEAF0', icon: Timer, module: 'Focus' },
  review: { label: 'Review', color: '#3D8BFD', tint: '#E8F1FF', icon: CalendarCheck, module: 'Review' },
  goal: { label: 'Mục tiêu', color: '#12A594', tint: '#E0F6F3', icon: Target, module: 'Mục tiêu' },
};
/** Nền nhạt theo màu loại, tự hợp cả sáng & tối (trộn với màu thẻ của theme). */
export const tintBg = (color: string, pct = 16) => `color-mix(in srgb, ${color} ${pct}%, hsl(var(--card)))`;

export const ALL_TYPES = Object.keys(TYPE_META) as CalendarItemType[];

export const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + (m || 0); };
export const fromMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Khoảng ngày hiển thị cho từng chế độ xem. */
export function rangeOf(view: CalendarView, anchor: Date): { start: Date; end: Date; days: Date[] } {
  let start: Date, end: Date;
  if (view === 'month') { start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }); end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }); }
  else if (view === 'week') { start = startOfWeek(anchor, { weekStartsOn: 1 }); end = endOfWeek(anchor, { weekStartsOn: 1 }); }
  else if (view === 'day') { start = anchor; end = anchor; }
  else { start = anchor; end = addDays(anchor, 29); }
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return { start, end, days };
}

export function periodLabel(view: CalendarView, anchor: Date) {
  if (view === 'month') return cap(format(anchor, 'MMMM yyyy', { locale: vi }));
  if (view === 'day') return cap(format(anchor, "EEEE, d 'tháng' M", { locale: vi }));
  const { start, end } = rangeOf(view, anchor);
  return `${format(start, 'd/M')} – ${format(end, 'd/M/yyyy')}`;
}
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const dayLabel = (k: string) => cap(format(fromKey(k), "EEEE, d/M", { locale: vi }));

export const sortItems = (a: CalendarItem, b: CalendarItem) =>
  (a.start ? toMin(a.start) : -1) - (b.start ? toMin(b.start) : -1) || a.title.localeCompare(b.title);

/** Xếp làn cho các khối chồng giờ trong 1 ngày. */
export function layoutDay(items: CalendarItem[], defaultMin = 30) {
  const timed = items.filter((i) => i.start).map((i) => {
    const s = toMin(i.start!); const e = i.end ? Math.max(toMin(i.end), s + 15) : s + defaultMin;
    return { item: i, s, e, lane: 0, lanes: 1 };
  }).sort((a, b) => a.s - b.s || b.e - a.e);
  let cluster: typeof timed = []; let clusterEnd = -1;
  const flush = () => { const n = Math.max(1, ...cluster.map((c) => c.lane + 1)); cluster.forEach((c) => (c.lanes = n)); cluster = []; };
  for (const t of timed) {
    if (t.s >= clusterEnd && cluster.length) flush();
    const used = new Set(cluster.filter((c) => c.e > t.s).map((c) => c.lane));
    let lane = 0; while (used.has(lane)) lane++;
    t.lane = lane; cluster.push(t); clusterEnd = Math.max(clusterEnd, t.e);
  }
  flush();
  return timed;
}

export const EMPTY_DRAFT = (date: string, time = ''): EventDraft => ({
  kind: 'event', title: '', description: '', date, time: time || '09:00', allDay: false,
  repeat: 'none', area: undefined, priority: 'medium', reminderMinutes: 0, goalId: '',
});
