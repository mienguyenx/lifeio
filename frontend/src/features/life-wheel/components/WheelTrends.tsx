import { useMemo, useState } from 'react';
import { SectionTitle, SegmentedTabs, Surface, Empty } from '@/components/lio';
import { StatStrip, TrendArea } from '@/components/lio/charts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import type { WheelApi } from '../hooks/useLifeWheel';
import { avgOf } from '../utils/wheel.utils';

const RANGES = [{ id: '90', label: '3 tháng' }, { id: '180', label: '6 tháng' }, { id: 'all', label: 'Tất cả' }];

export function WheelTrends({ api }: { api: WheelApi }) {
  const [area, setArea] = useState<LifeArea | 'avg'>('avg');
  const [range, setRange] = useState('180');
  const data = useMemo(() => {
    const from = range === 'all' ? '' : new Date(Date.now() - Number(range) * 864e5).toISOString().slice(0, 10);
    return [...api.history].reverse().filter((h) => h.date >= from).map((h) => ({ d: h.date, v: area === 'avg' ? +avgOf(h.scores).toFixed(1) : h.scores[area] ?? null }));
  }, [api.history, area, range]);
  const vals = data.map((x) => x.v).filter((v): v is number => v !== null);
  const meta = area === 'avg' ? { name: 'Điểm trung bình', color: '#7C6CF2' } : { name: LIFE_AREAS.find((a) => a.id === area)!.name, color: `hsl(var(--area-${area}))` };
  return (
    <Surface className="p-5 min-w-0">
      <SectionTitle title="Xu hướng" action={<SegmentedTabs size="sm" items={RANGES} value={range} onChange={setRange} />} />
      <Select value={area} onValueChange={(v) => setArea(v as LifeArea | 'avg')}>
        <SelectTrigger className="h-9 w-[200px] rounded-full bg-card mb-3"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="avg">📊 Điểm trung bình</SelectItem>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
      </Select>
      {vals.length < 2 ? <Empty>Cần ít nhất 2 lần đánh giá để xem xu hướng.</Empty> : <TrendArea id={`wt-${area}`} data={data} color={meta.color} name={meta.name} height={240} domain={[0, 10]} />}
      <StatStrip items={[
        { label: 'Thay đổi', value: vals.length > 1 ? `${vals[vals.length - 1] - vals[0] >= 0 ? '+' : ''}${(vals[vals.length - 1] - vals[0]).toFixed(1)}` : '–' },
        { label: 'Cao nhất', value: vals.length ? Math.max(...vals).toFixed(1) : '–' },
        { label: 'Thấp nhất', value: vals.length ? Math.min(...vals).toFixed(1) : '–' },
        { label: 'Số lần đánh giá', value: vals.length },
      ]} />
    </Surface>
  );
}
