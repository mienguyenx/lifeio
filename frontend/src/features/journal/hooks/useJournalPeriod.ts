import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { LIFE_AREAS, type JournalEntry, type JournalTag } from '@/types/lifeos';
import { MOODS } from '../utils/journal.utils';

export const JOURNAL_RANGES = [
  { id: '7', label: '7 ngày' }, { id: '30', label: '30 ngày' }, { id: '90', label: '3 tháng' }, { id: '365', label: '1 năm' }, { id: 'all', label: 'Tất cả' },
] as const;
export type JournalRange = (typeof JOURNAL_RANGES)[number]['id'];

const avgOf = (l: JournalEntry[], k: 'mood' | 'energy') => { const x = l.filter((e) => e[k]); return x.length ? x.reduce((s, e) => s + e[k], 0) / x.length : 0; };

/** Dữ liệu tổng hợp theo kỳ (chỉ từ bài viết đã có: mood, energy, tags, areas, gratitude). */
export function useJournalPeriod(entries: JournalEntry[], tags: JournalTag[], range: JournalRange) {
  return useMemo(() => {
    const since = range === 'all' ? '' : format(subDays(new Date(), Number(range) - 1), 'yyyy-MM-dd');
    const list = entries.filter((e) => e.date >= since);
    const monthly = range === '365' || range === 'all';
    let series: { d: string; v: number | null }[];
    if (monthly) {
      const keys = [...new Set(list.map((e) => e.date.slice(0, 7)))].sort();
      series = keys.map((k) => { const l = list.filter((e) => e.date.startsWith(k)); return { d: k, v: +avgOf(l, 'mood').toFixed(1) || null }; });
    } else {
      const n = Number(range);
      series = Array.from({ length: n }, (_, i) => {
        const d = format(subDays(new Date(), n - 1 - i), 'yyyy-MM-dd');
        const l = list.filter((e) => e.date === d);
        return { d, v: l.length ? +avgOf(l, 'mood').toFixed(1) : null };
      });
    }
    const n = list.length || 1;
    const positive = list.filter((e) => e.mood >= 4).length, neutral = list.filter((e) => e.mood === 3).length, negative = list.filter((e) => e.mood && e.mood <= 2).length;
    const topTags = tags.map((t) => ({ id: t.id, name: t.name, color: `hsl(${t.color})`, n: list.filter((e) => e.tags?.includes(t.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    const topAreas = LIFE_AREAS.map((a) => ({ id: a.id, name: `${a.icon} ${a.name}`, color: `hsl(var(--area-${a.id}))`, n: list.filter((e) => e.areas?.includes(a.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    return {
      list, series, avgMood: avgOf(list, 'mood'), avgEnergy: avgOf(list, 'energy'),
      split: { positive: Math.round((positive / n) * 100), neutral: Math.round((neutral / n) * 100), negative: Math.round((negative / n) * 100) },
      dist: MOODS.map((m) => ({ ...m, n: list.filter((e) => e.mood === m.value).length, pct: Math.round((list.filter((e) => e.mood === m.value).length / n) * 100) })).reverse(),
      topTags, topAreas, topics: new Set([...topTags.map((t) => t.id), ...topAreas.map((a) => a.id)]).size,
      gratitudeCount: list.filter((e) => e.gratitude?.length).length,
    };
  }, [entries, tags, range]);
}
export type JournalPeriod = ReturnType<typeof useJournalPeriod>;

