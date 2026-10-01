import { addYears, differenceInCalendarDays, format, parseISO, setYear, startOfDay } from 'date-fns';
import type { Contact, Interaction } from '@/hooks/sync/useRelationshipsSync';
import type { Tint } from '@/components/lio';

export type RelType = Contact['relationship'];
export type InterType = Interaction['type'];

/** Giữ nguyên nhóm & loại tương tác của trang cũ; bổ sung màu để vẽ biểu đồ. */
export const RELATIONSHIP_TYPES: { id: RelType; name: string; icon: string; color: string; tint: Tint }[] = [
  { id: 'family', name: 'Gia đình', icon: '👨‍👩‍👧‍👦', color: '#F2557A', tint: 'rose' },
  { id: 'friend', name: 'Bạn bè', icon: '👋', color: '#3D8BFD', tint: 'sky' },
  { id: 'colleague', name: 'Đồng nghiệp', icon: '💼', color: '#E8961C', tint: 'amber' },
  { id: 'mentor', name: 'Mentor', icon: '🎓', color: '#6C5CE7', tint: 'violet' },
  { id: 'other', name: 'Khác', icon: '👤', color: '#9AA3B2', tint: 'mint' },
];
export const INTERACTION_TYPES: { id: InterType; name: string; icon: string }[] = [
  { id: 'call', name: 'Gọi điện', icon: '📞' },
  { id: 'message', name: 'Nhắn tin', icon: '💬' },
  { id: 'meeting', name: 'Gặp mặt', icon: '🤝' },
  { id: 'video_call', name: 'Video call', icon: '📹' },
  { id: 'other', name: 'Khác', icon: '📝' },
];
export const RELATIONSHIP_TIPS = [
  { icon: '💬', text: 'Chủ động liên lạc với người thân mỗi tuần' },
  { icon: '🎁', text: 'Nhớ những ngày quan trọng của họ' },
  { icon: '👂', text: 'Lắng nghe nhiều hơn là nói' },
  { icon: '🤝', text: 'Luôn giữ lời hứa và đáng tin cậy' },
  { icon: '❤️', text: 'Thể hiện sự biết ơn thường xuyên' },
];
export const relOf = (id: string) => RELATIONSHIP_TYPES.find((r) => r.id === id) ?? RELATIONSHIP_TYPES[4];
export const interOf = (id: string) => INTERACTION_TYPES.find((r) => r.id === id) ?? INTERACTION_TYPES[4];

export const daysSince = (d?: string) => (d ? differenceInCalendarDays(new Date(), parseISO(d)) : null);
export const agoLabel = (d?: string) => {
  const n = daysSince(d);
  if (n === null) return 'Chưa liên lạc';
  if (n <= 0) return 'Hôm nay';
  if (n === 1) return 'Hôm qua';
  if (n < 7) return `${n} ngày trước`;
  if (n < 30) return `${Math.floor(n / 7)} tuần trước`;
  if (n < 365) return `${Math.floor(n / 30)} tháng trước`;
  return `${Math.floor(n / 365)} năm trước`;
};
/** Quy tắc “Cần liên lạc” giữ nguyên trang cũ: quan trọng ≥4 quá 7 ngày, ≥2 quá 30 ngày, hoặc chưa liên lạc. */
export const needsAttention = (c: Contact) => {
  const n = daysSince(c.lastContact);
  if (n === null) return true;
  return (c.importance >= 4 && n > 7) || (c.importance >= 2 && n > 30);
};
/** Sinh nhật kế tiếp (bỏ qua năm sinh). */
export function nextBirthday(b?: string) {
  if (!b) return null;
  const today = startOfDay(new Date());
  let d = setYear(parseISO(b), today.getFullYear());
  if (d < today) d = addYears(d, 1);
  return { date: d, days: differenceInCalendarDays(d, today), label: format(d, 'dd/MM') };
}
export const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

export function relInsights(contacts: Contact[], interactions: Interaction[]) {
  const out: { icon: string; tint: Tint; title: string; desc: string }[] = [];
  const att = contacts.filter(needsAttention).sort((a, b) => b.importance - a.importance);
  if (att[0]) out.push({ icon: '📞', tint: 'rose', title: `Liên lạc với ${att[0].name}`, desc: `${agoLabel(att[0].lastContact)} — mức độ quan trọng ${att[0].importance}/5.` });
  const bd = contacts.map((c) => ({ c, b: nextBirthday(c.birthday) })).filter((x) => x.b && x.b.days <= 14).sort((a, b) => a.b!.days - b.b!.days)[0];
  if (bd) out.push({ icon: '🎂', tint: 'amber', title: `Sinh nhật ${bd.c.name}`, desc: bd.b!.days === 0 ? 'Hôm nay! Gửi lời chúc nhé.' : `Còn ${bd.b!.days} ngày (${bd.b!.label}).` });
  const recent = interactions.filter((i) => (daysSince(i.date) ?? 99) < 30);
  const types = INTERACTION_TYPES.map((t) => ({ t, n: recent.filter((i) => i.type === t.id).length })).sort((a, b) => b.n - a.n);
  if (recent.length) out.push(types[0].t.id === 'meeting' ? { icon: '🤝', tint: 'mint', title: 'Kết nối chất lượng', desc: `Gặp mặt là cách bạn kết nối nhiều nhất (${types[0].n} lần / 30 ngày).` } : { icon: '🤝', tint: 'sky', title: 'Gặp mặt nhiều hơn', desc: `30 ngày qua chủ yếu là ${types[0].t.name.toLowerCase()} — thử hẹn gặp trực tiếp một người thân.` });
  return out.slice(0, 3);
}
