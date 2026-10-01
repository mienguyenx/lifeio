import { LIFE_AREAS, type LifeArea, type LifeWheelScore } from '@/types/lifeos';
import type { Tint } from '@/components/lio';

/** Giữ nguyên từ trang cũ. */
export const DEFAULT_TARGETS: Record<LifeArea, number> = { health: 8, relationships: 8, career: 7, finance: 7, personal: 8, fun: 7, environment: 7, spirituality: 6, learning: 7, contribution: 6 };
export const LIFE_WHEEL_TIPS = [
  { icon: '🎯', text: 'Đánh giá định kỳ mỗi tuần để theo dõi tiến trình' },
  { icon: '⚖️', text: 'Cân bằng là mục tiêu - không cần tất cả đạt 10' },
  { icon: '🔍', text: 'Tập trung cải thiện 2-3 lĩnh vực yếu nhất' },
  { icon: '📈', text: 'Theo dõi xu hướng quan trọng hơn điểm tuyệt đối' },
  { icon: '🎉', text: 'Ghi nhận những tiến bộ nhỏ mỗi ngày' },
];
/** Từ components/lifewheel/LifeWheelInsights (trang cũ). */
export const IMPROVEMENT_TIPS: Record<LifeArea, string[]> = {
  health: ['Tập thể dục 30 phút mỗi ngày', 'Ngủ đủ 7-8 tiếng', 'Uống đủ 2L nước/ngày'],
  relationships: ['Dành thời gian cho người thân', 'Gọi điện/nhắn tin bạn bè', 'Tham gia hoạt động nhóm'],
  career: ['Học kỹ năng mới', 'Networking với đồng nghiệp', 'Đặt mục tiêu nghề nghiệp rõ ràng'],
  finance: ['Theo dõi chi tiêu hàng ngày', 'Tiết kiệm 20% thu nhập', 'Học về đầu tư cơ bản'],
  personal: ['Thiền 10 phút mỗi ngày', 'Viết nhật ký', 'Đọc sách phát triển bản thân'],
  fun: ['Dành 1 ngày/tuần cho sở thích', 'Thử điều mới mỗi tháng', 'Xem phim/nghe nhạc thư giãn'],
  environment: ['Dọn dẹp không gian sống', 'Trang trí phòng làm việc', 'Giữ môi trường xanh sạch'],
  spirituality: ['Thiền định hoặc cầu nguyện', 'Tham gia hoạt động từ thiện', 'Kết nối với thiên nhiên'],
  learning: ['Đọc 15 phút/ngày', 'Học online course', 'Viết blog chia sẻ kiến thức'],
  contribution: ['Tình nguyện 1 lần/tháng', 'Mentoring người khác', 'Đóng góp cho cộng đồng'],
};
export const areaColor = (id: string, a = 1) => (a === 1 ? `hsl(var(--area-${id}))` : `hsl(var(--area-${id}) / ${a})`);
export const DEFAULT_SCORES = LIFE_AREAS.reduce((acc, a) => ({ ...acc, [a.id]: 5 }), {} as Record<LifeArea, number>);
export const avgOf = (s?: Record<string, number>) => { if (!s) return 0; const v = LIFE_AREAS.map((a) => s[a.id] ?? 0); return v.reduce((a, b) => a + b, 0) / v.length; };
export const ranked = (s: Record<LifeArea, number>) => [...LIFE_AREAS].map((a) => ({ ...a, score: s[a.id] ?? 0 })).sort((a, b) => b.score - a.score);
export const balanceLabel = (avg: number) => (avg >= 8 ? 'Cuộc sống rất cân bằng!' : avg >= 6.5 ? 'Bạn đang có một cuộc sống cân bằng khá tốt!' : avg >= 5 ? 'Cuộc sống đang ở mức ổn' : 'Hãy chăm sóc bản thân nhiều hơn nhé');

export function wheelInsights(latest?: LifeWheelScore, prev?: LifeWheelScore) {
  const out: { icon: string; tint: Tint; title: string; desc: string }[] = [];
  if (!latest) return out;
  const r = ranked(latest.scores);
  const low = r[r.length - 1];
  out.push({ icon: low.icon, tint: 'rose', title: `Ưu tiên: ${low.name} (${low.score}/10)`, desc: IMPROVEMENT_TIPS[low.id][0] + '.' });
  if (prev) {
    const ch = r.map((a) => ({ ...a, d: a.score - (prev.scores[a.id] ?? 0) })).sort((a, b) => b.d - a.d);
    if (ch[0].d > 0) out.push({ icon: '📈', tint: 'mint', title: `${ch[0].name} tiến bộ`, desc: `+${ch[0].d} điểm so với lần đánh giá trước.` });
    const worst = ch[ch.length - 1];
    if (worst.d < 0) out.push({ icon: '📉', tint: 'amber', title: `${worst.name} giảm`, desc: `${worst.d} điểm — thử: ${IMPROVEMENT_TIPS[worst.id][1].toLowerCase()}.` });
  }
  const spread = r[0].score - low.score;
  if (spread >= 4) out.push({ icon: '⚖️', tint: 'violet', title: 'Chênh lệch lớn', desc: `${r[0].name} và ${low.name} cách nhau ${spread} điểm — cân bằng lại nhé.` });
  return out.slice(0, 3);
}
