import { useMemo } from 'react';
import { addMonths, format } from 'date-fns';
import { ProgressBar, SectionTitle, Surface, Empty } from '@/components/lio';
import { Donut, GroupedBars } from '@/components/lio/charts';
import type { RelApi } from '../hooks/useRelationships';
import { INTERACTION_TYPES, RELATIONSHIP_TYPES } from '../utils/relationships.utils';

/** Phân tích: số tương tác 6 tháng, phân loại mối quan hệ, loại tương tác. */
export function RelAnalytics({ api }: { api: RelApi }) {
  const { contacts, interactions } = api;
  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => { const m = format(addMonths(new Date(), i - 5), 'yyyy-MM'); return { label: `T${Number(m.slice(5))}`, count: interactions.filter((x) => x.date.startsWith(m)).length }; }), [interactions]);
  const types = RELATIONSHIP_TYPES.map((r) => ({ id: r.id, name: `${r.icon} ${r.name}`, value: contacts.filter((c) => c.relationship === r.id).length, color: r.color })).filter((x) => x.value);
  const inter = INTERACTION_TYPES.map((t) => ({ ...t, n: interactions.filter((i) => i.type === t.id).length }));
  const max = Math.max(1, ...inter.map((x) => x.n));
  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Surface className="p-5 min-w-0 lg:col-span-2">
        <SectionTitle title="Tương tác theo thời gian" hint="6 tháng gần đây" />
        <GroupedBars data={months} height={210} series={[{ key: 'count', name: 'Tương tác', color: '#6C5CE7' }]} />
      </Surface>
      <Surface className="p-5 min-w-0">
        <SectionTitle title="Phân loại mối quan hệ" />
        {types.length === 0 ? <Empty>Chưa có liên hệ.</Empty> : <Donut size={150} data={types.map((t) => ({ ...t, hint: `${Math.round((t.value / contacts.length) * 100)}%` }))} center={<span><span className="block text-[18px] font-extrabold">{contacts.length}</span><span className="block text-[11px] text-muted-foreground">liên hệ</span></span>} />}
      </Surface>
      <Surface className="p-5 min-w-0">
        <SectionTitle title="Cách bạn kết nối" />
        <ul className="space-y-3">{inter.map((t) => (
          <li key={t.id}><div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold">{t.icon} {t.name}</span><span className="tabular-nums text-muted-foreground">{t.n}</span></div><ProgressBar value={(t.n / max) * 100} /></li>
        ))}</ul>
      </Surface>
    </div>
  );
}
