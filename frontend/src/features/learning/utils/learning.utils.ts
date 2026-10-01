import type { Book, Course } from '@/hooks/sync/useLearningSync';
import type { Tint } from '@/components/lio';

export type ItemKind = 'course' | 'book';
export type ItemStatus = 'todo' | 'active' | 'done';
/** Mục học tập hợp nhất (khóa học + sách) để hiển thị chung một danh sách. */
export interface LearningItem {
  kind: ItemKind; id: string; title: string; sub: string; icon: string; done: number; total: number; unit: string;
  pct: number; status: ItemStatus; category?: string; rating?: number; startedAt?: string; completedAt?: string; raw: Course | Book;
}

/** Giữ nguyên từ trang cũ. */
export const LEARNING_CATEGORIES = [
  { id: 'programming', name: 'Lập trình', icon: '💻', color: '#6C5CE7' },
  { id: 'language', name: 'Ngôn ngữ', icon: '🌐', color: '#3D8BFD' },
  { id: 'design', name: 'Thiết kế', icon: '🎨', color: '#F2557A' },
  { id: 'business', name: 'Kinh doanh', icon: '📊', color: '#E8961C' },
  { id: 'personal', name: 'Phát triển bản thân', icon: '🧠', color: '#22B07D' },
  { id: 'other', name: 'Khác', icon: '📦', color: '#9AA3B2' },
];
export const BOOK_COLOR = '#FF7A45';
export const categoryOf = (id?: string) => LEARNING_CATEGORIES.find((c) => c.id === id) ?? LEARNING_CATEGORIES[LEARNING_CATEGORIES.length - 1];
export const LEARNING_TIPS = [
  { icon: '📚', text: 'Học ít nhất 30 phút mỗi ngày để duy trì thói quen' },
  { icon: '🎯', text: 'Đặt mục tiêu cụ thể cho từng khóa học' },
  { icon: '📝', text: 'Ghi chú lại những điểm quan trọng' },
  { icon: '🔄', text: 'Ôn tập định kỳ để nhớ lâu hơn' },
  { icon: '💡', text: 'Thực hành ngay sau khi học lý thuyết' },
];
export const BOOK_RECOMMENDATIONS = [
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'Deep Work', author: 'Cal Newport' },
  { title: 'The Psychology of Money', author: 'Morgan Housel' },
];
export const STATUS_META: Record<ItemStatus, { course: string; book: string; tint: Tint; color: string }> = {
  todo: { course: 'Chưa bắt đầu', book: 'Muốn đọc', tint: 'amber', color: '#E8961C' },
  active: { course: 'Đang học', book: 'Đang đọc', tint: 'sky', color: '#3D8BFD' },
  done: { course: 'Hoàn thành', book: 'Đã đọc', tint: 'mint', color: '#22B07D' },
};
const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

export function fromCourse(c: Course): LearningItem {
  const cat = categoryOf(c.category);
  return { kind: 'course', id: c.id, title: c.title, sub: cat.name, icon: cat.icon, done: c.completedLessons, total: c.totalLessons, unit: 'bài', pct: pct(c.completedLessons, c.totalLessons),
    status: c.status === 'completed' ? 'done' : c.status === 'in_progress' ? 'active' : 'todo', category: c.category, startedAt: c.startedAt, completedAt: c.completedAt, raw: c };
}
export function fromBook(b: Book): LearningItem {
  return { kind: 'book', id: b.id, title: b.title, sub: b.author, icon: '📖', done: b.currentPage, total: b.totalPages, unit: 'trang', pct: pct(b.currentPage, b.totalPages),
    status: b.status === 'completed' ? 'done' : b.status === 'reading' ? 'active' : 'todo', rating: b.rating, startedAt: b.startedAt, completedAt: b.completedAt, raw: b };
}

/** Trạng thái tự suy ra từ tiến độ — giống logic trang cũ. */
export const courseStatus = (done: number, total: number): Course['status'] => (done >= total ? 'completed' : done > 0 ? 'in_progress' : 'not_started');
export const bookStatus = (page: number, total: number): Book['status'] => (page >= total ? 'completed' : page > 0 ? 'reading' : 'want_to_read');

export function learningInsights(items: LearningItem[]) {
  const out: { icon: string; tint: Tint; title: string; desc: string }[] = [];
  const active = items.filter((i) => i.status === 'active');
  const near = active.filter((i) => i.pct >= 70).sort((a, b) => b.pct - a.pct)[0];
  if (near) out.push({ icon: '🏁', tint: 'mint', title: 'Sắp về đích', desc: `“${near.title}” đã đạt ${near.pct}% — còn ${near.total - near.done} ${near.unit}.` });
  const stalled = items.filter((i) => i.status === 'todo');
  if (stalled.length) out.push({ icon: '🚀', tint: 'amber', title: 'Bắt đầu tài liệu mới', desc: `Bạn có ${stalled.length} mục chưa bắt đầu. Chọn 1 mục để khởi động tuần này.` });
  if (active.length > 3) out.push({ icon: '🎯', tint: 'violet', title: 'Tập trung hơn', desc: `Đang theo ${active.length} mục cùng lúc — ưu tiên 2–3 mục để học sâu hơn.` });
  const done = items.filter((i) => i.status === 'done').length;
  if (done) out.push({ icon: '🏆', tint: 'sky', title: 'Thành quả', desc: `Bạn đã hoàn thành ${done} khóa học / cuốn sách. Tuyệt vời!` });
  return out.slice(0, 3);
}
