import type { LifeWheelScore } from '@/types/lifeos';

/** lifeWheelScores trong store: bản mới được thêm vào ĐẦU mảng (store.addLifeWheelScore) và tải từ DB theo date desc.
 *  Dùng các helper này thay vì đoán vị trí trong mảng. */
export const wheelDesc = (scores: LifeWheelScore[]) =>
  [...scores].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
export const latestWheel = (scores: LifeWheelScore[]) => wheelDesc(scores)[0];
export const previousWheel = (scores: LifeWheelScore[]) => wheelDesc(scores)[1];
export const wheelAvg = (s?: LifeWheelScore) => {
  if (!s) return null;
  const v = Object.values(s.scores);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
