import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { AreaTile } from '@/components/lio';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { areaColor } from '../utils/wheel.utils';

/** Trình chỉnh điểm 10 lĩnh vực: thanh trượt + nút ‹ › (1–10). Dùng cho Life Wheel và các Review. */
export function ScoreEditor({ value, onChange, prev, targets }: { value: Record<LifeArea, number>; onChange: (v: Record<LifeArea, number>) => void; prev?: Record<LifeArea, number>; targets?: Record<LifeArea, number> }) {
  const set = (id: LifeArea, n: number) => onChange({ ...value, [id]: Math.max(1, Math.min(10, n)) });
  const btn = 'h-8 w-8 grid place-items-center rounded-full bg-card border border-border/70 hover:bg-secondary disabled:opacity-40 shrink-0';
  return (
    <ul className="space-y-1">
      {LIFE_AREAS.map((a) => {
        const v = value[a.id] ?? 5, d = prev ? v - (prev[a.id] ?? v) : 0;
        return (
          <li key={a.id} className="flex items-center gap-3 rounded-[16px] px-2 py-2 hover:bg-secondary/40">
            <AreaTile area={a.id} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                <span className="font-semibold truncate">{a.name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{targets && `Mục tiêu ${targets[a.id]}`}{d !== 0 && <b className={d > 0 ? 'text-[#22B07D] ml-1.5' : 'text-[#F2557A] ml-1.5'}>{d > 0 ? '+' : ''}{d}</b>}</span>
              </div>
              <Slider value={[v]} min={1} max={10} step={1} onValueChange={([n]) => set(a.id, n)} style={{ ['--slider-color' as string]: areaColor(a.id) }} />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" className={btn} onClick={() => set(a.id, v - 1)} disabled={v <= 1} aria-label="Giảm"><ChevronLeft className="h-4 w-4" /></button>
              <span className="w-12 text-center rounded-full py-1 text-[12.5px] font-extrabold tabular-nums" style={{ background: areaColor(a.id, 0.14), color: areaColor(a.id) }}>{v}/10</span>
              <button type="button" className={btn} onClick={() => set(a.id, v + 1)} disabled={v >= 10} aria-label="Tăng"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
