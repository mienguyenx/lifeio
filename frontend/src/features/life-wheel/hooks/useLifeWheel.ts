import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { wheelDesc } from '@/lib/lifeWheel';
import { getTodayDateString } from '@/utils/dateUtils';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { avgOf } from '../utils/wheel.utils';

export function useLifeWheel() {
  const raw = useLifeOSStore((s) => s.lifeWheelScores);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journal = useLifeOSStore((s) => s.journalEntries);
  const user = useLifeOSStore((s) => s.user);
  const clearHistory = useLifeOSStore((s) => s.clearLifeWheelHistory);
  const { addLifeWheelScore, deleteLifeWheelScore } = useSyncedStore();

  const history = useMemo(() => wheelDesc(raw), [raw]);
  const latest = history[0], prev = history[1];
  const avg = latest ? avgOf(latest.scores) : null;
  const prevAvg = prev ? avgOf(prev.scores) : null;

  /** Số mục liên kết theo lĩnh vực (giống trang “10 lĩnh vực”). */
  const linked = useMemo(() => {
    const today = getTodayDateString();
    return Object.fromEntries(LIFE_AREAS.map((a) => [a.id, {
      goals: goals.filter((g) => g.area === a.id && !g.deletedAt && !g.completedAt).length,
      habits: habits.filter((h) => h.area === a.id && !h.archivedAt && !h.deletedAt).length,
      tasks: tasks.filter((t) => t.area === a.id && !t.archived && !t.deletedAt && t.status !== 'done').length,
      overdue: tasks.filter((t) => t.area === a.id && !t.archived && !t.deletedAt && t.status !== 'done' && t.dueDate && t.dueDate < today).length,
      journal: journal.filter((j) => j.areas?.includes(a.id)).length,
    }])) as Record<LifeArea, { goals: number; habits: number; tasks: number; overdue: number; journal: number }>;
  }, [goals, habits, tasks, journal]);

  const save = useCallback((scores: Record<LifeArea, number>) => { addLifeWheelScore(scores); toast.success('Đã lưu!', { description: 'Điểm Life Wheel đã được cập nhật.' }); }, [addLifeWheelScore]);
  const remove = useCallback((id: string) => { deleteLifeWheelScore(id); toast.success('Đã xóa!', { description: 'Bản ghi đã được xóa.' }); }, [deleteLifeWheelScore]);
  const clear = useCallback(() => { clearHistory(); toast.success('Đã xóa lịch sử!', { description: 'Chỉ giữ lại bản ghi mới nhất.' }); }, [clearHistory]);

  return { history, latest, prev, avg, prevAvg, linked, user, save, remove, clear };
}
export type WheelApi = ReturnType<typeof useLifeWheel>;
