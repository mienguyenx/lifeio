import { CheckSquare, Flame, NotebookPen, Target } from 'lucide-react';
import { AreaTile, Surface } from '@/components/lio';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import type { WheelApi } from '../hooks/useLifeWheel';
import { DEFAULT_TARGETS, areaColor } from '../utils/wheel.utils';

/** Bảng 10 lĩnh vực: điểm hiện tại · mục tiêu · số mục tiêu/thói quen/công việc/nhật ký liên kết. */
export function AreaGrid({ api, selected, onSelect }: { api: WheelApi; selected: LifeArea | null; onSelect: (a: LifeArea) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {LIFE_AREAS.map((a) => {
        const s = api.latest?.scores[a.id]; const l = api.linked[a.id];
        return (
          <Surface key={a.id} as="div" onClick={() => onSelect(a.id)} className={cn('p-3.5 cursor-pointer text-center transition-all hover:-translate-y-0.5 hover:shadow-card min-w-0', selected === a.id && 'ring-2 ring-primary/40')}>
            <div className="flex justify-center"><AreaTile area={a.id} size={46} /></div>
            <p className="text-[13px] font-semibold mt-2 truncate">{a.name}</p>
            <p className="text-[18px] font-extrabold tabular-nums" style={{ color: areaColor(a.id) }}>{s ?? '–'}<span className="text-[12px] text-muted-foreground font-semibold">/10</span></p>
            <p className="text-[10.5px] text-muted-foreground">Mục tiêu {DEFAULT_TARGETS[a.id]}</p>
            <div className="grid grid-cols-2 gap-1 mt-2.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center justify-center gap-1" title="Mục tiêu"><Target className="h-3.5 w-3.5" />{l.goals}</span>
              <span className="inline-flex items-center justify-center gap-1" title="Thói quen"><Flame className="h-3.5 w-3.5" />{l.habits}</span>
              <span className={cn('inline-flex items-center justify-center gap-1', l.overdue && 'text-[#F2557A]')} title="Công việc"><CheckSquare className="h-3.5 w-3.5" />{l.tasks}</span>
              <span className="inline-flex items-center justify-center gap-1" title="Nhật ký"><NotebookPen className="h-3.5 w-3.5" />{l.journal}</span>
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
