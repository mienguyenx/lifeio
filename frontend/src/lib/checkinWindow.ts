/**
 * Khung giờ check-in sáng / review tối, tính theo giờ dậy & giờ ngủ trong Cá nhân hoá
 * (mặc định 07:00 / 23:00) và giờ GMT+7 như phần còn lại của app.
 *  - Sáng: từ giờ dậy đến 11:00 (dậy muộn thì tới giờ dậy + 4h).
 *  - Tối: từ 3h trước giờ ngủ đến 03:00 sáng hôm sau (thuộc về ngày hôm trước).
 * Ngoài 2 khung này: không hiện gì.
 */
import { getTimezoneOffset } from '@/utils/dateUtils';

export type CheckinKind = 'morning' | 'evening';
export interface CheckinSlot { kind: CheckinKind; date: string; label: string; until: string }

export const toMinutes = (t: string | undefined, fallback: number) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? (+m[1] % 24) * 60 + +m[2] : fallback;
};
const fmt = (min: number) => `${String(Math.floor(((min + 1440) % 1440) / 60)).padStart(2, '0')}:${String(((min % 60) + 60) % 60).padStart(2, '0')}`;
const ymd = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

export function getCheckinSlot(opts: { wakeUpTime?: string; sleepTime?: string; morningEnabled?: boolean; eveningEnabled?: boolean }, now = new Date()): CheckinSlot | null {
  const local = new Date(now.getTime() + getTimezoneOffset() * 60_000); // giờ VN dưới dạng UTC
  const min = local.getUTCHours() * 60 + local.getUTCMinutes();
  const today = ymd(local);
  const yesterday = ymd(new Date(local.getTime() - 86_400_000));
  const wake = toMinutes(opts.wakeUpTime, 7 * 60);
  const sleep = toMinutes(opts.sleepTime, 23 * 60);

  // Tối: [ngủ - 3h, 03:00). Nếu giờ ngủ sau nửa đêm (0–6h) thì kéo đến giờ ngủ + 1h.
  const eveStart = (sleep - 180 + 1440) % 1440;
  const eveEnd = sleep < 6 * 60 ? Math.max(180, sleep + 60) : 180;
  const inEvening = eveStart > eveEnd ? min >= eveStart || min < eveEnd : min >= eveStart && min < eveEnd;
  if (opts.eveningEnabled !== false && inEvening) {
    return { kind: 'evening', date: min < 6 * 60 ? yesterday : today, label: 'Review buổi tối', until: fmt(eveEnd) };
  }
  // Sáng: [dậy, max(11:00, dậy + 4h)) — cho phép mở sớm hơn giờ dậy 1h.
  const mStart = wake - 60;
  const mEnd = Math.max(11 * 60, wake + 240);
  if (opts.morningEnabled !== false && min >= Math.max(0, mStart) && min < mEnd && !inEvening) {
    return { kind: 'morning', date: today, label: 'Check-in buổi sáng', until: fmt(mEnd) };
  }
  return null;
}
