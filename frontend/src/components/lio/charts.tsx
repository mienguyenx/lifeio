/** Biểu đồ dùng chung của LIO UI Kit (recharts) — cùng lưới, trục, tooltip cho mọi module. */
import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

export const CHART_TOOLTIP = { borderRadius: 14, fontSize: 12, border: '1px solid hsl(var(--border))' };

const niceTick = (v: number) => String(Number.isInteger(v) ? v : +v.toFixed(1));

/** Đường xu hướng theo ngày (d = yyyy-MM-dd). */
export function TrendArea({ data, color = '#6C5CE7', name, unit = '', height = 220, domain, tickFormat, valueFormat, id }: {
  data: { d: string; v: number | null }[]; color?: string; name: string; unit?: string; height?: number; domain?: [number | string, number | string];
  tickFormat?: (v: number) => string; valueFormat?: (v: number) => string; id: string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -14, right: 8, top: 8 }}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity={0.28} /><stop offset="1" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="d" tickFormatter={(d) => (d.length === 7 ? `T${Number(d.slice(5))}` : format(parseISO(d), 'd/M'))} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis domain={domain ?? ['auto', 'auto']} tickFormatter={tickFormat ?? niceTick} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={54} />
          <Tooltip contentStyle={CHART_TOOLTIP} labelFormatter={(d: string) => (d.length === 7 ? `Tháng ${Number(d.slice(5))}/${d.slice(0, 4)}` : format(parseISO(d), 'dd/MM/yyyy'))}
            formatter={(v: number) => [`${valueFormat ? valueFormat(v) : niceTick(v)}${unit ? ` ${unit}` : ''}`, name]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} connectNulls dot={data.length <= 31 ? { r: 2.5, fill: color } : false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Cột theo nhóm (vd. thu/chi theo tuần, nước theo ngày). */
export function GroupedBars({ data, series, height = 200, tickFormat, valueFormat }: {
  data: Record<string, number | string>[]; series: { key: string; name: string; color: string }[]; height?: number; tickFormat?: (v: number) => string; valueFormat?: (v: number) => string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -14, right: 4, top: 6 }} barGap={3} barCategoryGap="28%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={tickFormat} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={54} allowDecimals={false} />
          <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: 'hsl(var(--secondary))', radius: 8 }} formatter={(v: number, n: string) => [valueFormat ? valueFormat(v) : v, series.find((s) => s.key === n)?.name ?? n]} />
          {series.map((s) => <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[6, 6, 2, 2]} maxBarSize={series.length > 1 ? 14 : 22} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut + chú giải. */
export function Donut({ data, center, size = 160 }: { data: { id: string; name: ReactNode; value: number; color: string; hint?: ReactNode }[]; center?: ReactNode; size?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex items-center gap-4 min-w-0">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer><PieChart><Pie data={data} dataKey="value" innerRadius={size * 0.32} outerRadius={size * 0.47} paddingAngle={2} stroke="none">{data.map((d) => <Cell key={d.id} fill={d.color} />)}</Pie></PieChart></ResponsiveContainer>
        {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
      </div>
      <ul className="flex-1 space-y-1.5 min-w-0">
        {data.map((d) => (
          <li key={d.id} className="flex items-center gap-2 text-[12.5px] min-w-0">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="truncate flex-1">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dải số liệu dưới biểu đồ (Hiện tại · Cao nhất · Thấp nhất · Trung bình…). */
export function StatStrip({ items, className }: { items: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: 'up' | 'down' }[]; className?: string }) {
  return (
    <div className={cn('grid gap-2 mt-3 pt-3 border-t border-border/60', className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <p className={cn('text-[17px] font-extrabold leading-tight tabular-nums truncate', it.tone === 'up' && 'text-[#22B07D]', it.tone === 'down' && 'text-destructive')}>{it.value}</p>
          <p className="text-[11.5px] text-muted-foreground truncate">{it.label}</p>
          {it.hint && <p className="text-[11px] text-muted-foreground truncate">{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}
