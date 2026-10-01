import { format, parseISO, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { JournalEntry, LifeArea } from '@/types/lifeos';

export const MOODS = [
  { value: 1, emoji: '😢', label: 'Rất tệ', color: '#F2557A' },
  { value: 2, emoji: '😕', label: 'Tệ', color: '#FF9B63' },
  { value: 3, emoji: '😐', label: 'Bình thường', color: '#FFC63D' },
  { value: 4, emoji: '🙂', label: 'Tốt', color: '#57D3AE' },
  { value: 5, emoji: '😄', label: 'Rất tốt', color: '#6C5CE7' },
] as const;
export const ENERGIES = [
  { value: 1, emoji: '🔋', label: 'Kiệt sức' }, { value: 2, emoji: '🪫', label: 'Mệt' }, { value: 3, emoji: '⚡', label: 'Bình thường' },
  { value: 4, emoji: '💪', label: 'Năng lượng' }, { value: 5, emoji: '🚀', label: 'Tràn đầy' },
] as const;
export type Level = 1 | 2 | 3 | 4 | 5;
export const moodOf = (v?: number) => MOODS.find((m) => m.value === v);
export const energyOf = (v?: number) => ENERGIES.find((m) => m.value === v);

export const todayKey = () => format(new Date(), 'yyyy-MM-dd');
/** Nhật ký không có trường tiêu đề — dòng đầu của nội dung đóng vai trò tiêu đề. */
export const titleOf = (e: Pick<JournalEntry, 'content'>) => e.content.split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '').slice(0, 80) || 'Nhật ký';
export const excerptOf = (e: Pick<JournalEntry, 'content'>) => {
  const lines = e.content.split('\n').filter((l) => l.trim());
  return (lines.length > 1 ? lines.slice(1).join(' ') : lines[0] || '').slice(0, 160);
};
export const dateLabel = (d: string) => format(parseISO(d), 'dd/MM/yyyy');
export const longDate = (d: string) => { const s = format(parseISO(d), "EEEE, d 'tháng' M, yyyy", { locale: vi }); return s.charAt(0).toUpperCase() + s.slice(1); };

export function journalStats(entries: JournalEntry[]) {
  const days = new Set(entries.map((e) => e.date));
  let streak = 0; let d = new Date();
  if (!days.has(format(d, 'yyyy-MM-dd'))) d = subDays(d, 1); // hôm nay chưa viết vẫn giữ chuỗi
  while (days.has(format(d, 'yyyy-MM-dd'))) { streak++; d = subDays(d, 1); }
  const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
  const moods = entries.filter((e) => e.mood);
  const energies = entries.filter((e) => e.energy);
  return {
    total: entries.length,
    streak,
    avgMood: moods.length ? moods.reduce((s, e) => s + e.mood, 0) / moods.length : 0,
    avgEnergy: energies.length ? energies.reduce((s, e) => s + e.energy, 0) / energies.length : 0,
    pct30: Math.round((last30.filter((k) => days.has(k)).length / 30) * 100),
    last7: entries.filter((e) => e.date >= last30[6]).length,
    writtenToday: days.has(last30[0]),
  };
}

export interface JournalDraft {
  date: string;
  content: string;
  mood: Level;
  energy: Level;
  areas: LifeArea[];
  gratitude: string;
  tags: string[];
  images: string[];
}
export const EMPTY_DRAFT = (): JournalDraft => ({ date: todayKey(), content: '', mood: 3, energy: 3, areas: [], gratitude: '', tags: [], images: [] });
export const draftFromEntry = (e: JournalEntry): JournalDraft => ({
  date: e.date, content: e.content, mood: e.mood, energy: e.energy, areas: e.areas || [], gratitude: (e.gratitude || []).join('\n'), tags: e.tags || [], images: e.images || [],
});
export const entryFromDraft = (d: JournalDraft) => ({
  date: d.date, content: d.content, mood: d.mood, energy: d.energy,
  areas: d.areas.length ? d.areas : undefined,
  gratitude: d.gratitude.trim() ? d.gratitude.split('\n').filter(Boolean) : undefined,
  tags: d.tags.length ? d.tags : undefined,
  images: d.images.length ? d.images : undefined,
});
