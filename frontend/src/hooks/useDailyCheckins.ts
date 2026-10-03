/**
 * Check-in sáng / review tối đồng bộ máy chủ (bảng daily_checkins) — làm ở thiết bị nào
 * thì thiết bị khác cũng không hỏi lại. Cache localStorage để hiện ngay & khi offline.
 * status 'skipped' = người dùng chọn "Bỏ qua hôm nay".
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { CheckinKind } from '@/lib/checkinWindow';

export interface MorningData { mainGoal?: string; top3Tasks?: string[]; avoidItem?: string }
export interface EveningData { completedWell?: string; gratitude?: string; couldImprove?: string; tomorrowFocus?: string; tasksDone?: number; habitsDone?: number }
export interface CheckinRecord { date: string; kind: CheckinKind; status: 'done' | 'skipped'; energy?: number | null; data: MorningData & EveningData; updatedAt?: string }

const key = (date: string, kind: CheckinKind) => `${date}:${kind}`;

interface S {
  rows: Record<string, CheckinRecord>;
  loadedFor?: string;
  set: (r: CheckinRecord) => void;
  merge: (rs: CheckinRecord[], userId: string) => void;
}
const useCheckinStore = create<S>()(persist((set) => ({
  rows: {},
  set: (r) => set((s) => ({ rows: { ...s.rows, [key(r.date, r.kind)]: r } })),
  merge: (rs, userId) => set((s) => {
    const rows = { ...s.rows };
    for (const r of rs) rows[key(r.date, r.kind)] = r;
    // giữ gọn: chỉ 30 ngày gần nhất
    const keys = Object.keys(rows).sort().slice(0, -60);
    for (const k of keys) delete rows[k];
    return { rows, loadedFor: userId };
  }),
}), { name: 'lio-daily-checkins' }));

interface Row { date: string; kind: CheckinKind; status: 'done' | 'skipped'; energy: number | null; data: CheckinRecord['data'] | null; updated_at: string }

export function useDailyCheckins() {
  const { user } = useAuth();
  const rows = useCheckinStore((s) => s.rows);
  const loadedFor = useCheckinStore((s) => s.loadedFor);

  useEffect(() => {
    if (!user || loadedFor === user.id) return;
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
    supabase.from('daily_checkins').select('date, kind, status, energy, data, updated_at').gte('date', since)
      .then(({ data, error }) => {
        if (error || !Array.isArray(data)) return;
        useCheckinStore.getState().merge((data as unknown as Row[]).map((r) => ({ date: String(r.date).slice(0, 10), kind: r.kind, status: r.status, energy: r.energy, data: r.data || {}, updatedAt: r.updated_at })), user.id);
      }, () => {});
  }, [user, loadedFor]);

  const get = (date: string, kind: CheckinKind) => rows[key(date, kind)];

  const save = async (rec: CheckinRecord) => {
    useCheckinStore.getState().set({ ...rec, updatedAt: new Date().toISOString() });
    // Giữ tương thích các nơi đang đọc morningCheckins / eveningReviews (gợi ý, review tuần tự soạn).
    if (rec.status === 'done') {
      const st = useLifeOSStore.getState();
      const energy = (Math.min(5, Math.max(1, rec.energy || 3)) as 1 | 2 | 3 | 4 | 5);
      if (rec.kind === 'morning') {
        const ex = st.morningCheckins.find((c) => c.date === rec.date);
        const v = { date: rec.date, mainGoal: rec.data.mainGoal || '', top3Tasks: rec.data.top3Tasks || [], avoidItem: rec.data.avoidItem, energyLevel: energy };
        if (ex) st.updateMorningCheckin(ex.id, v); else st.addMorningCheckin(v);
      } else {
        const ex = st.eveningReviews.find((c) => c.date === rec.date);
        const v = { date: rec.date, completedWell: rec.data.completedWell || '', couldImprove: rec.data.couldImprove || '', gratitude: rec.data.gratitude || '', tomorrowFocus: rec.data.tomorrowFocus, energyLevel: energy };
        if (ex) st.updateEveningReview(ex.id, v); else st.addEveningReview(v);
      }
    }
    if (!user) return true;
    const { error } = await supabase.from('daily_checkins').upsert(
      { date: rec.date, kind: rec.kind, status: rec.status, energy: rec.energy ?? null, data: rec.data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,kind' },
    );
    return !error;
  };

  return { get, save, rows };
}
