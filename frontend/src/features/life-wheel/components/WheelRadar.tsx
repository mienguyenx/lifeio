import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_TOOLTIP } from '@/components/lio/charts';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';

/** Radar 10 lĩnh vực (+ lớp so sánh tùy chọn) với điểm TB ở giữa. */
export function WheelRadar({ scores, compare, compareLabel = 'Lần trước', height = 340, center }: { scores: Record<LifeArea, number>; compare?: Record<LifeArea, number>; compareLabel?: string; height?: number; center?: React.ReactNode }) {
  const data = LIFE_AREAS.map((a) => ({ id: a.id, name: a.name, icon: a.icon, v: scores[a.id] ?? 0, p: compare?.[a.id] ?? null }));
  const Tick = ({ x, y, payload, cx, cy }: { x: number; y: number; cx: number; cy: number; payload: { value: string; index: number } }) => {
    const d = data[payload.index]; const dx = x - cx, dy = y - cy; const anchor = Math.abs(dx) < 8 ? 'middle' : dx > 0 ? 'start' : 'end';
    const oy = dy < -8 ? -10 : dy > 8 ? 4 : -4;
    return (
      <g transform={`translate(${x},${y + oy})`}>
        <text textAnchor={anchor} fontSize={11} className="fill-muted-foreground">{d.icon} {d.name}</text>
        <text textAnchor={anchor} y={14} fontSize={12.5} fontWeight={800} style={{ fill: `hsl(var(--area-${d.id}))` }}>{d.v}</text>
      </g>
    );
  };
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius={height < 300 ? "54%" : "68%"} margin={{ top: 18, bottom: 18, left: 30, right: 30 }}>
          <defs><linearGradient id="wheel-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7C6CF2" stopOpacity={0.45} /><stop offset="1" stopColor="#F2557A" stopOpacity={0.3} /></linearGradient></defs>
          <PolarGrid className="stroke-border" />
          <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
          <PolarAngleAxis dataKey="name" tick={Tick as never} />
          {compare && <Radar name={compareLabel} dataKey="p" stroke="#9AA3B2" strokeDasharray="4 4" fill="#9AA3B2" fillOpacity={0.08} />}
          <Radar name="Điểm" dataKey="v" stroke="#7C6CF2" strokeWidth={2.5} fill="url(#wheel-fill)" dot={{ r: 3, fill: '#7C6CF2' }} />
          <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number, n: string) => [`${v}/10`, n]} />
        </RadarChart>
      </ResponsiveContainer>
      {center && <div className="absolute inset-0 grid place-items-center pointer-events-none">{center}</div>}
    </div>
  );
}
