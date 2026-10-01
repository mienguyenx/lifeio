import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useHealthSync, type HealthLog } from '@/hooks/sync/useHealthSync';
import { metricOf, type MetricId } from '../utils/health.utils';

export interface HealthDraft { type: MetricId; value: string; notes: string; date: string }

/** CRUD giống trang cũ: cập nhật store ngay (optimistic) rồi đồng bộ database qua useHealthSync. */
export function useHealth() {
  const logs = useLifeOSStore((s) => s.healthLogs);
  const goals = useLifeOSStore((s) => s.goals);
  const habits = useLifeOSStore((s) => s.habits);
  const wheel = useLifeOSStore((s) => s.lifeWheelScores);
  const user = useLifeOSStore((s) => s.user);
  const { addHealthLog, updateHealthLog, deleteHealthLog } = useLifeOSStore.getState();
  const sync = useHealthSync();

  const sorted = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)), [logs]);
  const healthGoals = useMemo(() => goals.filter((g) => g.area === 'health' && !g.deletedAt), [goals]);
  const healthHabits = useMemo(() => habits.filter((h) => h.area === 'health' && !h.deletedAt && !h.archivedAt), [habits]);
  /** Điểm sức khỏe = điểm “Sức khỏe” trong lần đánh giá Life Wheel gần nhất (thang 10 → %). */
  const score = useMemo(() => { const w = wheel[wheel.length - 1]; return w ? Math.round((w.scores.health ?? 5) * 10) : null; }, [wheel]);

  const add = useCallback(async (type: MetricId, value: number, date: string, notes?: string, label?: string) => {
    const log: HealthLog = { id: crypto.randomUUID(), date, type, value, unit: metricOf(type).unit, notes: notes || undefined };
    addHealthLog(log);
    const ok = await sync.saveHealthLog(log);
    if (!ok) toast.error('Không thể lưu vào database'); else toast.success(label ? `Đã ghi nhận: ${label}` : 'Đã ghi nhận!');
  }, [addHealthLog, sync]);
  const edit = useCallback(async (id: string, d: HealthDraft) => {
    const updates: Partial<HealthLog> = { type: d.type, value: parseFloat(d.value), unit: metricOf(d.type).unit, notes: d.notes || undefined, date: d.date };
    updateHealthLog(id, updates);
    const ok = await sync.updateHealthLog(id, updates);
    if (!ok) toast.error('Không thể cập nhật vào database'); else toast.success('Đã cập nhật!');
  }, [updateHealthLog, sync]);
  const remove = useCallback(async (id: string) => {
    deleteHealthLog(id);
    const ok = await sync.deleteHealthLog(id);
    if (!ok) toast.error('Không thể xóa khỏi database'); else toast.success('Đã xóa!');
  }, [deleteHealthLog, sync]);

  return { logs, sorted, healthGoals, healthHabits, score, user, add, edit, remove };
}
export type HealthApi = ReturnType<typeof useHealth>;
