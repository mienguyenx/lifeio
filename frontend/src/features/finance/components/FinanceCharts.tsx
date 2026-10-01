import { useMemo, useState } from 'react';
import { ProgressBar, SectionTitle, SegmentedTabs, Surface, Empty } from '@/components/lio';
import { Donut, GroupedBars, StatStrip, TrendArea } from '@/components/lio/charts';
import type { FinanceTransaction } from '@/hooks/sync/useFinanceSync';
import { categoryBreakdown, compactVND, formatVND, monthlyTrend, weeklyCashflow, type TxType } from '../utils/finance.utils';

/** Dòng tiền theo tuần của tháng đang xem. */
export function CashflowChart({ txs, month }: { txs: FinanceTransaction[]; month: string }) {
  const data = useMemo(() => weeklyCashflow(txs, month), [txs, month]);
  return (
    <Surface className="p-5 min-w-0">
      <SectionTitle title="Dòng tiền" hint="Theo tuần trong tháng" />
      <GroupedBars data={data} height={210} tickFormat={compactVND} valueFormat={formatVND}
        series={[{ key: 'income', name: 'Thu nhập', color: '#22B07D' }, { key: 'expense', name: 'Chi tiêu', color: '#F2557A' }]} />
      <div className="flex justify-center gap-4 mt-2 text-[11.5px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#22B07D]" />Thu nhập</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#F2557A]" />Chi tiêu</span>
      </div>
    </Surface>
  );
}

/** Cơ cấu chi tiêu / thu nhập theo danh mục (donut + thanh %). */
export function CategoryBreakdown({ txs, month, bars }: { txs: FinanceTransaction[]; month: string; bars?: boolean }) {
  const [type, setType] = useState<TxType>('expense');
  const data = useMemo(() => categoryBreakdown(txs, month, type), [txs, month, type]);
  const total = data.reduce((a, c) => a + c.value, 0);
  return (
    <Surface className="p-5 min-w-0">
      <SectionTitle title="Theo danh mục" action={<SegmentedTabs size="sm" items={[{ id: 'expense', label: 'Chi tiêu' }, { id: 'income', label: 'Thu nhập' }]} value={type} onChange={setType} />} />
      {data.length === 0 ? <Empty>Chưa có {type === 'expense' ? 'chi tiêu' : 'thu nhập'} trong tháng này.</Empty> : (
        <>
          <Donut size={150} data={data.map((c) => ({ id: c.id, name: `${c.icon} ${c.name}`, value: c.value, color: c.color, hint: `${c.pct}%` }))}
            center={<span><span className="block text-[11px] text-muted-foreground">Tổng</span><span className="block text-[14px] font-extrabold">{compactVND(total)}</span></span>} />
          {bars && (
            <ul className="mt-4 space-y-3">
              {data.map((c) => (
                <li key={c.id}>
                  <div className="flex justify-between text-[12.5px] mb-1"><span className="font-semibold">{c.icon} {c.name}</span><span className="tabular-nums text-muted-foreground">{formatVND(c.value)} · {c.pct}%</span></div>
                  <ProgressBar value={c.pct} color={c.color} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Surface>
  );
}

const KEYS = [{ id: 'expense', label: 'Chi tiêu', color: '#F2557A' }, { id: 'income', label: 'Thu nhập', color: '#22B07D' }, { id: 'balance', label: 'Số dư', color: '#6C5CE7' }] as const;
type K = typeof KEYS[number]['id'];

/** Xu hướng 6 / 12 tháng. */
export function FinanceTrends({ txs, month }: { txs: FinanceTransaction[]; month: string }) {
  const [k, setK] = useState<K>('expense');
  const [n, setN] = useState('6');
  const rows = useMemo(() => monthlyTrend(txs, Number(n), month), [txs, n, month]);
  const key = KEYS.find((x) => x.id === k)!;
  const vals = rows.map((r) => r[k]);
  const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const saves = rows.map((r) => r.saving).filter((v): v is number => v !== null);
  return (
    <Surface className="p-5 min-w-0">
      <SectionTitle title="Xu hướng tài chính" action={<SegmentedTabs size="sm" items={[{ id: '6', label: '6 tháng' }, { id: '12', label: '12 tháng' }]} value={n} onChange={setN} />} />
      <SegmentedTabs size="sm" className="mb-3" items={KEYS.map((x) => ({ id: x.id, label: x.label }))} value={k} onChange={setK} />
      <TrendArea id={`ft-${k}`} data={rows.map((r) => ({ d: r.d, v: r[k] }))} color={key.color} name={key.label} height={240} tickFormat={compactVND} valueFormat={formatVND} />
      <StatStrip items={[
        { label: 'Trung bình / tháng', value: compactVND(avg) },
        { label: 'Cao nhất', value: compactVND(Math.max(...vals)) },
        { label: 'Thấp nhất', value: compactVND(Math.min(...vals)) },
        { label: 'TB tiết kiệm', value: saves.length ? `${Math.round(saves.reduce((a, b) => a + b, 0) / saves.length)}%` : '–' },
      ]} />
    </Surface>
  );
}
