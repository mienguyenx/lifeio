import { eachDayOfInterval, format } from 'date-fns';
import { LIFE_AREAS, type LifeArea, type YearlyGoalItem } from '@/types/lifeos';
import type { Tint } from '@/components/lio';

export type Rating = 1 | 2 | 3 | 4 | 5;
/** Giữ nguyên thang 1–5 của các trang review cũ. */
export const RATING_OPTIONS: { value: Rating; emoji: string; label: string; color: string }[] = [
  { value: 1, emoji: '😢', label: 'Tệ', color: '#F2557A' },
  { value: 2, emoji: '😕', label: 'Chưa tốt', color: '#FF8A3D' },
  { value: 3, emoji: '😐', label: 'Bình thường', color: '#FFB020' },
  { value: 4, emoji: '🙂', label: 'Tốt', color: '#22C55E' },
  { value: 5, emoji: '🌟', label: 'Tuyệt vời', color: '#10B981' },
];
export const ratingMeta = (v?: number) => RATING_OPTIONS.find((r) => r.value === v) ?? RATING_OPTIONS[2];
export const DEFAULT_AREA_RATINGS = LIFE_AREAS.reduce((a, x) => ({ ...a, [x.id]: 5 }), {} as Record<LifeArea, number>);

export const toLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
export const fromLines = (a?: string[]) => (a ?? []).join('\n');

/** Từ components/weeklyreview/ReflectionPrompts (trang cũ). */
export const REFLECTION_PROMPTS = {
  wins: ['Điều gì khiến bạn tự hào nhất tuần này?', 'Bạn đã vượt qua thử thách nào trong tuần?', 'Thói quen nào bạn đã duy trì tốt?', 'Bạn đã học được kỹ năng mới nào?', 'Ai đã giúp đỡ bạn tuần này và bạn cảm thấy thế nào?'],
  challenges: ['Điều gì khó khăn nhất bạn gặp phải?', 'Có khoảnh khắc nào bạn muốn làm khác đi không?', 'Bạn đã procrastinate việc gì và tại sao?', 'Thói quen nào bạn struggle để duy trì?', 'Điều gì khiến bạn stress nhất tuần này?'],
  lessons: ['Nếu có thể quay lại, bạn sẽ làm gì khác?', 'Bạn đã học được gì về bản thân tuần này?', 'Insight nào bạn muốn nhớ mãi?', 'Kinh nghiệm này dạy bạn điều gì cho tương lai?', 'Bạn đã thay đổi suy nghĩ về điều gì?'],
  focus: ['Điều quan trọng nhất cần hoàn thành tuần tới là gì?', 'Bạn muốn cải thiện thói quen nào tuần tới?', 'Mục tiêu nào bạn muốn tiến gần hơn?', 'Bạn sẽ làm gì để có năng lượng tốt hơn?', 'Ai bạn muốn dành thời gian cùng tuần tới?'],
};
export type PromptKey = keyof typeof REFLECTION_PROMPTS;
export const PROMPT_META: Record<PromptKey, { title: string; icon: string; tint: Tint }> = {
  wins: { title: 'Chiến thắng', icon: '🏆', tint: 'amber' },
  challenges: { title: 'Thách thức', icon: '⚡', tint: 'rose' },
  lessons: { title: 'Bài học', icon: '💡', tint: 'sky' },
  focus: { title: 'Focus tuần tới', icon: '🎯', tint: 'violet' },
};
/** Câu hỏi suy ngẫm ở sidebar trang cũ. */
export const QUICK_QUESTIONS = [
  { icon: '🏆', text: 'Điều gì khiến bạn tự hào nhất tuần này?' },
  { icon: '🎯', text: 'Mục tiêu nào bạn đã tiến gần hơn?' },
  { icon: '💡', text: 'Bài học quan trọng nhất bạn học được?' },
  { icon: '🔄', text: 'Điều gì bạn sẽ làm khác đi?' },
];

export const BUCKET_CATEGORIES = [
  { id: 'travel', icon: '✈️', label: 'Du lịch', color: '#3B9EFF' },
  { id: 'experience', icon: '🎭', label: 'Trải nghiệm', color: '#A855F7' },
  { id: 'skill', icon: '📚', label: 'Kỹ năng', color: '#7C6CF2' },
  { id: 'health', icon: '💪', label: 'Sức khỏe', color: '#22C55E' },
  { id: 'relationship', icon: '❤️', label: 'Mối quan hệ', color: '#F2557A' },
  { id: 'career', icon: '💼', label: 'Sự nghiệp', color: '#FF8A3D' },
  { id: 'creative', icon: '🎨', label: 'Sáng tạo', color: '#EC4899' },
  { id: 'other', icon: '✨', label: 'Khác', color: '#9AA3B2' },
] as const;
export const GOAL_STATUS: Record<YearlyGoalItem['status'], { label: string; tint: Tint }> = {
  planned: { label: 'Kế hoạch', tint: 'violet' },
  in_progress: { label: 'Đang làm', tint: 'sky' },
  completed: { label: 'Xong', tint: 'mint' },
  cancelled: { label: 'Hủy', tint: 'rose' },
};

export const pctDelta = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));
export const deltaText = (cur: number, prev: number, unit = '%') => { const d = pctDelta(cur, prev); return `${d > 0 ? '+' : ''}${d}${unit} vs kỳ trước`; };
/** Ngày (yyyy-MM-dd) trong khoảng, cắt tại hôm nay như trang cũ. */
export const datesIn = (start: Date, end: Date, capToday = true) => {
  const e = capToday && new Date() < end ? new Date() : end;
  return e < start ? [] : eachDayOfInterval({ start, end: e }).map((d) => format(d, 'yyyy-MM-dd'));
};
