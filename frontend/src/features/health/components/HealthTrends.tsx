import { useMemo, useState } from 'react';
import { SectionTitle, SegmentedTabs, Surface } from '@/components/lio';
import { StatStrip, TrendArea } from '@/components/lio/charts';
import type { HealthLog } from '@/hooks/sync/useHealthSync';
import { METRICS, fmt, metricOf, series, type MetricId } from '../utils/health.utils';

const PERIODS = [{ id: '7', label: '7 ngày' }, { id: '30', label: '30 ngày' }, { id: '90', label: '3 tháng' }];

export function HealthTrends({ logs, initial = 'weight', compact }: { logs: HealthLog[]; initial?: MetricId; compact?: boolean }) {
  const [metric, setMetric] = useState<MetricId>(initial);
  const [p, setP] = useState('30');
  const m = metricOf(metric);
  const data = useMemo(() => series(logs, m, Number(p)), [logs, m, p]);
  const vals = data.map((x) => x.v).filter((v): v is number => v !== null);
  const cur = [...data].reverse().find((x) => x.v !== null)?.v ?? null;
  const first = data.find((x) => x.v !== null)?.v ?? null;
  const delta = cur !== null && first !== null ? cur - first : null;
  return (
    <Surface className="p-5 min-w-0">
      <SectionTitle title="Xu hướng" action={<SegmentedTabs size="sm" items={PERIODS} value={p} onChange={setP} />} />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-3">
        <SegmentedTabs size="sm" items={METRICS.map((x) => ({ id: x.id, label: x.name }))} value={metric} onChange={setMetric} />
      </div>
      {vals.length === 0 ? <p className="text-[13px] text-muted-foreground py-14 text-center">Chưa có dữ liệu {m.name.toLowerCase()} trong {PERIODS.find((x) => x.id === p)?.label}.</p> : (
        <TrendArea id={`ht-${metric}`} data={data} color={m.color} name={m.name} unit={m.unit} height={compact ? 190 : 240} domain={m.id === 'mood' ? [1, 5] : m.id === 'weight' ? ['dataMin - 2', 'dataMax + 2'] : [0, 'auto']} />
      )}
      <StatStrip items={[
        { label: 'Hiện tại', value: `${fmt(m, cur)}` },
        { label: 'Cao nhất', value: vals.length ? fmt(m, Math.max(...vals)) : '–' },
        { label: 'Thấp nhất', value: vals.length ? fmt(m, Math.min(...vals)) : '–' },
        m.agg === 'sum' ? { label: 'TB / ngày ghi', value: vals.length ? fmt(m, vals.reduce((a, b) => a + b, 0) / vals.length) : '–' }
          : { label: 'Thay đổi', value: delta === null ? '–' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` },
      ]} />
    </Surface>
  );
}
