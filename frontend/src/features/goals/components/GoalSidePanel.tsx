import { CheckCircle2, Circle, PauseCircle, Target } from 'lucide-react';
import { MascotCard, ProgressRing, SectionTitle, Surface } from '@/components/lio';
import { LIFE_AREAS } from '@/types/lifeos';
import type { GoalsApi } from '../hooks/useGoals';
import type { LifeArea } from '@/types/lifeos';

export function GoalSidePanel({ api, onArea, area }: { api: GoalsApi; onArea: (a: LifeArea | 'all') => void; area: LifeArea | 'all' }) {
  const { stats, goals } = api;
  const areas = LIFE_AREAS.map((a) => ({ ...a, n: goals.filter((g) => g.area === a.id).length })).filter((a) => a.n);
  return (
    <div className="space-y-4">
      <MascotCard mascot="lumi" pose="happy" quote="Bạn đang làm rất tốt! Hãy tiếp tục từng bước để chạm tới ước mơ nhé 💜" />
      <Surface className="p-4">
        <SectionTitle title="Tiến độ tổng thể" />
        <div className="flex items-center gap-4">
          <ProgressRing value={stats.avgProgress} size={92} stroke={10} />
          <ul className="space-y-1.5 text-[12.5px]">
            <li className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{stats.total} mục tiêu tổng</li>
            <li className="flex items-center gap-2"><Circle className="h-4 w-4 text-[#3D8BFD]" />{stats.active} đang thực hiện</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#22B07D]" />{stats.completed} đã hoàn thành</li>
            <li className="flex items-center gap-2"><PauseCircle className="h-4 w-4 text-[#E8961C]" />{stats.paused} tạm dừng</li>
          </ul>
        </div>
      </Surface>
      {areas.length > 0 && (
        <Surface className="p-4">
          <SectionTitle title="Lĩnh vực cuộc sống" />
          <ul className="space-y-1">
            {areas.map((a) => (
              <li key={a.id}>
                <button onClick={() => onArea(area === a.id ? 'all' : a.id)} className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] transition-colors ${area === a.id ? 'bg-lavender dark:bg-primary/15 font-semibold' : 'hover:bg-secondary/60'}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(var(--area-${a.id}))` }} />
                  <span className="flex-1 text-left">{a.name}</span>
                  <span className="text-muted-foreground tabular-nums">{a.n}</span>
                </button>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}
