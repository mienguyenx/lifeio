import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useLearningSync, type Book, type Course } from '@/hooks/sync/useLearningSync';
import { latestWheel } from '@/lib/lifeWheel';
import { bookStatus, courseStatus, fromBook, fromCourse } from '../utils/learning.utils';

export interface CourseDraft { title: string; description: string; category: string; totalLessons: string }
export interface BookDraft { title: string; author: string; totalPages: string }

/** CRUD + cập nhật tiến độ y như trang cũ (store optimistic → useLearningSync). */
export function useLearning() {
  const courses = useLifeOSStore((s) => s.learningCourses);
  const books = useLifeOSStore((s) => s.learningBooks);
  const goals = useLifeOSStore((s) => s.goals);
  const habits = useLifeOSStore((s) => s.habits);
  const wheel = useLifeOSStore((s) => s.lifeWheelScores);
  const user = useLifeOSStore((s) => s.user);
  const st = useLifeOSStore.getState();
  const sync = useLearningSync();
  const today = () => format(new Date(), 'yyyy-MM-dd');

  const items = useMemo(() => [...courses.map(fromCourse), ...books.map(fromBook)], [courses, books]);
  const learningGoals = useMemo(() => goals.filter((g) => g.area === 'learning' && !g.deletedAt), [goals]);
  const learningHabits = useMemo(() => habits.filter((h) => h.area === 'learning' && !h.deletedAt && !h.archivedAt), [habits]);
  const score = useMemo(() => { const w = latestWheel(wheel); return w ? w.scores.learning ?? null : null; }, [wheel]);
  const stats = useMemo(() => ({
    activeCourses: courses.filter((c) => c.status === 'in_progress').length,
    completedCourses: courses.filter((c) => c.status === 'completed').length,
    readingBooks: books.filter((b) => b.status === 'reading').length,
    completedBooks: books.filter((b) => b.status === 'completed').length,
    /** Ước tính như trang cũ: 0,5 giờ / bài học đã hoàn thành. */
    hours: courses.reduce((a, c) => a + c.completedLessons * 0.5, 0),
    pages: books.reduce((a, b) => a + b.currentPage, 0),
    lessons: courses.reduce((a, c) => a + c.completedLessons, 0),
    avg: items.length ? Math.round(items.reduce((a, i) => a + i.pct, 0) / items.length) : 0,
  }), [courses, books, items]);

  const done = (ok: boolean, msg: string, err = 'Không thể lưu vào database') => (ok ? toast.success(msg) : toast.error(err));

  const addCourse = useCallback(async (d: CourseDraft) => {
    const c: Course = { id: crypto.randomUUID(), title: d.title.trim(), description: d.description.trim() || undefined, category: d.category, totalLessons: parseInt(d.totalLessons), completedLessons: 0, status: 'not_started' };
    st.addLearningCourse(c); done(await sync.saveCourse(c), 'Đã thêm khóa học!');
  }, [st, sync]);
  const addBook = useCallback(async (d: BookDraft) => {
    const b: Book = { id: crypto.randomUUID(), title: d.title.trim(), author: d.author.trim(), totalPages: parseInt(d.totalPages), currentPage: 0, status: 'want_to_read' };
    st.addLearningBook(b); done(await sync.saveBook(b), 'Đã thêm sách!');
  }, [st, sync]);
  const editCourse = useCallback(async (id: string, d: CourseDraft) => {
    const u: Partial<Course> = { title: d.title.trim(), description: d.description.trim() || undefined, category: d.category, totalLessons: parseInt(d.totalLessons) };
    st.updateLearningCourse(id, u); done(await sync.updateCourse(id, u), 'Đã cập nhật khóa học!', 'Không thể cập nhật vào database');
  }, [st, sync]);
  const editBook = useCallback(async (id: string, d: BookDraft) => {
    const u: Partial<Book> = { title: d.title.trim(), author: d.author.trim(), totalPages: parseInt(d.totalPages) };
    st.updateLearningBook(id, u); done(await sync.updateBook(id, u), 'Đã cập nhật sách!', 'Không thể cập nhật vào database');
  }, [st, sync]);
  const removeCourse = useCallback(async (id: string) => { st.deleteLearningCourse(id); done(await sync.deleteCourse(id), 'Đã xóa khóa học!', 'Không thể xóa khỏi database'); }, [st, sync]);
  const removeBook = useCallback(async (id: string) => { st.deleteLearningBook(id); done(await sync.deleteBook(id), 'Đã xóa sách!', 'Không thể xóa khỏi database'); }, [st, sync]);

  const setCourseProgress = useCallback(async (c: Course, n: number) => {
    const status = courseStatus(n, c.totalLessons);
    const u: Partial<Course> = { completedLessons: n, status, startedAt: c.startedAt || (n > 0 ? today() : undefined), completedAt: status === 'completed' ? today() : undefined };
    st.updateLearningCourse(c.id, u); await sync.updateCourse(c.id, u);
  }, [st, sync]);
  const setBookProgress = useCallback(async (b: Book, n: number) => {
    const status = bookStatus(n, b.totalPages);
    const u: Partial<Book> = { currentPage: n, status, startedAt: b.startedAt || (n > 0 ? today() : undefined), completedAt: status === 'completed' ? today() : undefined };
    st.updateLearningBook(b.id, u); await sync.updateBook(b.id, u);
  }, [st, sync]);

  return { courses, books, items, learningGoals, learningHabits, score, stats, user, addCourse, addBook, editCourse, editBook, removeCourse, removeBook, setCourseProgress, setBookProgress };
}
export type LearningApi = ReturnType<typeof useLearning>;
