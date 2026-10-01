import { useCallback, useMemo } from 'react';
import { addDays, addWeeks, differenceInCalendarWeeks, endOfWeek, format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { useWeeklyAutoDraft } from '@/hooks/useWeeklyAutoDraft';
import type { WeeklyReview } from '@/types/lifeos';
import type { Tint } from '@/components/lio';
import { usePeriodStats } from './usePeriodStats';
import { DEFAULT_AREA_RATINGS, fromLines, toLines } from '../utils/reviews.utils';
import type { ReviewDraft } from '../components/ReviewFormModal';

/** Khóa tuần giữ nguyên công thức trang cũ (toISOString của thứ Hai) để khớp dữ liệu đã lưu. */
const weekKey = (monday: Date) => monday.toISOString().split('T')[0];
const DAY = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function useWeeklyReview(offset: number) {
  const reviews = useLifeOSStore((s) => s.weeklyReviews);
  const clearHistory = useLifeOSStore((s) => s.clearWeeklyReviewHistory);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const sessions = useLifeOSStore((s) => s.pomodoroSessions);
  const journal = useLifeOSStore((s) => s.journalEntries);
  const user = useLifeOSStore((s) => s.user);
  const { addWeeklyReview, updateWeeklyReview, deleteWeeklyReview } = useSyncedStore();

  const ref = offset === 0 ? new Date() : addWeeks(new Date(), offset);
  const weekStart = startOfWeek(ref, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(ref, { weekStartsOn: 1 });
  const key = weekKey(weekStart);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd')), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = reviews.find((r) => r.weekStart === key);
  const previous = reviews.find((r) => r.weekStart === weekKey(subWeeks(weekStart, 1)));
  const stats = usePeriodStats(dates);
  const autoDraft = useWeeklyAutoDraft(dates);
  const sorted = useMemo(() => [...reviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart)), [reviews]);

  /** Biểu đồ ngày + phân tích tuần (từ WeeklyReviewChart / WeeklyReviewInsights cũ). */
  const daily = useMemo(() => dates.map((d, i) => ({
    label: DAY[i],
    habits: habits.reduce((n, h) => n + (h.completedDates.includes(d) ? 1 : 0), 0),
    tasks: tasks.filter((t) => t.completedAt?.startsWith(d)).length,
    pomodoro: sessions.filter((s) => s.phase === 'work' && s.completedAt.startsWith(d)).length,
  })), [dates, habits, tasks, sessions]);
  const insights = useMemo(() => {
    const active = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const rates = active.map((h) => ({ h, rate: Math.round((dates.filter((d) => h.completedDates.includes(d)).length / 7) * 100) })).sort((a, b) => b.rate - a.rate);
    const focusMin = sessions.filter((s) => s.phase === 'work' && dates.some((d) => s.completedAt.startsWith(d))).reduce((n, s) => n + s.duration, 0);
    const best = [...daily].map((d) => ({ ...d, total: d.habits + d.tasks + d.pomodoro })).sort((a, b) => b.total - a.total)[0];
    const js = journal.filter((j) => dates.includes(j.date));
    const out: { icon: string; tint: Tint; title: string; desc: string }[] = [];
    if (rates[0] && rates[0].rate > 0) out.push({ icon: '🔥', tint: 'orange', title: `Thói quen tốt nhất: ${rates[0].h.name}`, desc: `Hoàn thành ${rates[0].rate}% số ngày trong tuần.` });
    const weak = rates.filter((r) => r.rate < 50);
    if (weak.length) out.push({ icon: '⚠️', tint: 'amber', title: `${weak.length} thói quen cần chú ý`, desc: `${weak.slice(0, 3).map((r) => r.h.name).join(', ')} — dưới 50% tuần này.` });
    if (best && best.total > 0) out.push({ icon: '📅', tint: 'sky', title: `Ngày năng suất nhất: ${best.label}`, desc: `${best.habits} thói quen · ${best.tasks} công việc · ${best.pomodoro} pomodoro.` });
    if (focusMin > 0) out.push({ icon: '⏱️', tint: 'rose', title: `${focusMin} phút tập trung`, desc: `Trung bình ${(stats.pomodoroCount / 7).toFixed(1)} pomodoro mỗi ngày.` });
    if (js.length) out.push({ icon: '😊', tint: 'mint', title: `Tâm trạng TB ${(js.reduce((n, j) => n + j.mood, 0) / js.length).toFixed(1)}/5`, desc: `Năng lượng TB ${(js.reduce((n, j) => n + j.energy, 0) / js.length).toFixed(1)}/5 từ ${js.length} trang nhật ký.` });
    return { items: out, habitRate: rates.length ? Math.round(rates.reduce((n, r) => n + r.rate, 0) / rates.length) : 0, focusMin };
  }, [habits, sessions, journal, dates, daily, stats.pomodoroCount]);

  const draftOf = useCallback((r?: WeeklyReview): ReviewDraft => ({
    overallRating: r?.overallRating ?? 3, areaRatings: r?.areaRatings ?? { ...DEFAULT_AREA_RATINGS },
    text: { highlight: r?.highlight ?? '', lowlight: r?.lowlight ?? '', wins: fromLines(r?.wins), challenges: fromLines(r?.challenges), lessonsLearned: fromLines(r?.lessonsLearned), nextWeekFocus: fromLines(r?.nextWeekFocus), gratitude: fromLines(r?.gratitude) },
  }), []);
  const autoDraftValue = useCallback((): ReviewDraft => ({ overallRating: 3, areaRatings: autoDraft.areaRatings, text: { highlight: autoDraft.highlight, lowlight: autoDraft.lowlight, wins: autoDraft.wins, challenges: autoDraft.challenges, lessonsLearned: autoDraft.lessonsLearned, nextWeekFocus: autoDraft.nextWeekFocus, gratitude: autoDraft.gratitude } }), [autoDraft]);

  const save = useCallback((d: ReviewDraft) => {
    const t = d.text;
    const data = { wins: toLines(t.wins), challenges: toLines(t.challenges), lessonsLearned: toLines(t.lessonsLearned), nextWeekFocus: toLines(t.nextWeekFocus), overallRating: d.overallRating, areaRatings: d.areaRatings, gratitude: toLines(t.gratitude), highlight: t.highlight, lowlight: t.lowlight };
    if (current) { updateWeeklyReview(current.id, data); toast.success('Đã cập nhật!', { description: 'Review tuần đã được lưu.' }); }
    else { addWeeklyReview({ weekStart: key, ...data }); toast.success('Đã lưu!', { description: 'Review tuần đã được lưu và cập nhật Wheel of Life.' }); }
  }, [current, key, addWeeklyReview, updateWeeklyReview]);
  const remove = useCallback((id: string) => { deleteWeeklyReview(id); toast.success('Đã xóa!', { description: 'Review đã được xóa.' }); }, [deleteWeeklyReview]);
  const clear = useCallback(() => { clearHistory(); toast.success('Đã xóa tất cả!', { description: 'Toàn bộ lịch sử review đã được xóa.' }); }, [clearHistory]);
  /** Offset tuần của một review đã lưu (chịu được khóa lệch múi giờ của dữ liệu cũ). */
  const offsetOf = (r: WeeklyReview) => differenceInCalendarWeeks(addDays(parseISO(r.weekStart), 1), new Date(), { weekStartsOn: 1 });
  /** Thứ Hai thực của review (để hiển thị). */
  const mondayOf = (r: WeeklyReview) => startOfWeek(addDays(parseISO(r.weekStart), 1), { weekStartsOn: 1 });

  return { reviews: sorted, current, previous, weekStart, weekEnd, dates, stats, daily, insights, user, draftOf, autoDraftValue, save, remove, clear, offsetOf, mondayOf };
}
