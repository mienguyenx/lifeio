import { format, parseISO, subDays } from 'date-fns';
import type { HealthLog } from '@/hooks/sync/useHealthSync';
import type { Tint } from '@/components/lio';

export type MetricId = HealthLog['type'];
export interface MetricDef {
  id: MetricId; name: string; unit: string; emoji: string; tint: Tint; color: string;
  /** Mức tham chiếu lấy từ “Mẹo sức khỏe” của trang cũ (8 ly nước, 30 phút tập, ngủ 7-8 tiếng); app chưa có cài đặt mục tiêu riêng. */
  target?: number;
  /** sum = cộng dồn các lần ghi trong ngày; last = lấy lần ghi sau cùng. */
  agg: 'sum' | 'last';
  quick?: number[];
}

export const METRICS: MetricDef[] = [
  { id: 'water', name: 'Nước uống', unit: 'ly', emoji: '💧', tint: 'sky', color: '#3D8BFD', target: 8, agg: 'sum', quick: [1, 2] },
  { id: 'sleep', name: 'Giấc ngủ', unit: 'giờ', emoji: '🌙', tint: 'violet', color: '#6C5CE7', target: 8, agg: 'last', quick: [7, 8] },
  { id: 'exercise', name: 'Vận động', unit: 'phút', emoji: '🏃', tint: 'mint', color: '#22B07D', target: 30, agg: 'sum', quick: [15, 30] },
  { id: 'steps', name: 'Bước chân', unit: 'bước', emoji: '👟', tint: 'orange', color: '#FF7A45', target: 5000, agg: 'sum', quick: [1000, 5000] },
  { id: 'weight', name: 'Cân nặng', unit: 'kg', emoji: '⚖️', tint: 'amber', color: '#E8961C', agg: 'last' },
  { id: 'mood', name: 'Tâm trạng', unit: '/5', emoji: '😊', tint: 'rose', color: '#F2557A', agg: 'last' },
];
export const metricOf = (id: string) => METRICS.find((m) => m.id === id) ?? METRICS[0];

/** Giữ nguyên từ trang cũ. */
export const HEALTH_TIPS = [
  { icon: '💧', text: 'Uống 8 ly nước mỗi ngày để giữ cơ thể khỏe mạnh' },
  { icon: '🏃', text: 'Tập thể dục ít nhất 30 phút mỗi ngày' },
  { icon: '😴', text: 'Ngủ đủ 7-8 tiếng mỗi đêm' },
  { icon: '🥗', text: 'Ăn nhiều rau xanh và trái cây' },
  { icon: '🧘', text: 'Dành 10 phút thiền định mỗi ngày' },
];
export const QUICK_LOG_PRESETS = [
  { label: '1 ly nước', type: 'water' as MetricId, value: 1 },
  { label: '30 phút tập', type: 'exercise' as MetricId, value: 30 },
  { label: '8 giờ ngủ', type: 'sleep' as MetricId, value: 8 },
  { label: '5000 bước', type: 'steps' as MetricId, value: 5000 },
];
export const MOOD_EMOJI = ['😢', '😕', '😐', '🙂', '😄'];

export const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');
export const fmt = (m: MetricDef, v: number | null | undefined) =>
  v === null || v === undefined ? '–' : m.id === 'steps' ? v.toLocaleString('vi-VN') : m.id === 'mood' ? `${MOOD_EMOJI[Math.round(v) - 1] ?? ''} ${v}` : `${+v.toFixed(1)}`;

/** Giá trị của 1 chỉ số trong 1 ngày (null = chưa ghi). */
export function valueOn(logs: HealthLog[], m: MetricDef, day: string): number | null {
  const list = logs.filter((l) => l.type === m.id && l.date === day);
  if (!list.length) return null;
  return m.agg === 'sum' ? list.reduce((a, l) => a + l.value, 0) : list[list.length - 1].value;
}
/** Giá trị gần nhất (cho cân nặng). */
export function latest(logs: HealthLog[], id: MetricId, upTo?: string) {
  const list = logs.filter((l) => l.type === id && (!upTo || l.date <= upTo)).sort((a, b) => a.date.localeCompare(b.date));
  return list[list.length - 1];
}
export const pctOf = (m: MetricDef, v: number | null) => (m.target && v ? Math.min(100, Math.round((v / m.target) * 100)) : 0);

export function series(logs: HealthLog[], m: MetricDef, days: number, end = new Date()) {
  return Array.from({ length: days }, (_, i) => { const d = dayKey(subDays(end, days - 1 - i)); return { d, v: valueOn(logs, m, d) }; });
}

/** Chuỗi ngày liên tiếp có ít nhất 1 ghi nhận (hôm nay chưa ghi vẫn giữ chuỗi). */
export function streak(logs: HealthLog[]) {
  const days = new Set(logs.map((l) => l.date));
  let d = new Date(); let n = 0;
  if (!days.has(dayKey(d))) d = subDays(d, 1);
  while (days.has(dayKey(d))) { n++; d = subDays(d, 1); }
  return n;
}

export const dateLabel = (d: string) => format(parseISO(d), 'dd/MM/yyyy');

/** Gợi ý tạo từ dữ liệu 7 ngày gần nhất (quy tắc đơn giản, không gọi AI). */
export function insights(logs: HealthLog[]) {
  const out: { icon: string; tint: Tint; title: string; desc: string }[] = [];
  const avg = (m: MetricDef) => { const s = series(logs, m, 7).map((x) => x.v).filter((v): v is number => v !== null); return s.length ? { v: s.reduce((a, b) => a + b, 0) / s.length, n: s.length } : null; };
  const w = avg(metricOf('water')); if (w) out.push(w.v < 8 ? { icon: '💧', tint: 'sky', title: 'Tăng lượng nước', desc: `Trung bình ${w.v.toFixed(1)} ly/ngày — thêm ${Math.ceil(8 - w.v)} ly để đạt 8 ly.` } : { icon: '💧', tint: 'sky', title: 'Uống nước tốt', desc: `Bạn duy trì ${w.v.toFixed(1)} ly/ngày. Tuyệt vời!` });
  const s = avg(metricOf('sleep')); if (s) out.push(s.v < 7 ? { icon: '🌙', tint: 'violet', title: 'Cải thiện giấc ngủ', desc: `Trung bình ${s.v.toFixed(1)} giờ — thử đi ngủ sớm hơn 30 phút.` } : { icon: '🌙', tint: 'violet', title: 'Giấc ngủ ổn định', desc: `Trung bình ${s.v.toFixed(1)} giờ/đêm trong 7 ngày.` });
  const e = avg(metricOf('exercise')); if (e) out.push(e.v < 30 ? { icon: '🏃', tint: 'mint', title: 'Vận động thêm', desc: `${e.n}/7 ngày có tập, TB ${Math.round(e.v)} phút. Mục tiêu 30 phút/ngày.` } : { icon: '🏃', tint: 'mint', title: 'Duy trì vận động', desc: `TB ${Math.round(e.v)} phút/ngày — giữ vững nhé!` });
  const ws = logs.filter((l) => l.type === 'weight').sort((a, b) => a.date.localeCompare(b.date));
  if (ws.length > 1) { const d = ws[ws.length - 1].value - ws[0].value; out.push({ icon: '⚖️', tint: 'amber', title: Math.abs(d) < 1 ? 'Cân nặng ổn định' : d < 0 ? 'Cân nặng giảm' : 'Cân nặng tăng', desc: `${d > 0 ? '+' : ''}${d.toFixed(1)} kg kể từ ${dateLabel(ws[0].date)}.` }); }
  return out.slice(0, 4);
}
