import { memo } from 'react';
import { CheckCircle2, Eye, Lock, MoreHorizontal, Pause, Play, RotateCcw, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AreaChip, AreaTile, ProgressBar } from '@/components/lio';
import type { Goal } from '@/types/lifeos';
import type { GoalsApi } from '../hooks/useGoals';
import { areaColor, areaOf, deadlineLabel, isPaused } from '../utils/goal.utils';

const TONE = { done: 'text-[#22B07D]', danger: 'text-destructive', warn: 'text-[#E8961C]', muted: 'text-muted-foreground' };

export const GoalRow = memo(function GoalRow({ goal, locked, onOpen, api, onDelete }: { goal: Goal; locked?: boolean; onOpen: () => void; api: GoalsApi; onDelete: () => void }) {
  const area = areaOf(goal.area);
  const dl = deadlineLabel(goal);
  const done = !!goal.completedAt; const paused = isPaused(goal);
  const ms = goal.milestones.length; const msDone = goal.milestones.filter((m) => m.completed).length;
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={cn('group flex items-center gap-3.5 rounded-[22px] bg-card border border-border/60 shadow-soft px-3.5 py-3 cursor-pointer transition-all hover:shadow-card hover:-translate-y-0.5', paused && 'opacity-70')}>
      <AreaTile area={goal.area} size={46} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {goal.isFocused && <Star className="h-3.5 w-3.5 shrink-0 fill-[#FFC63D] text-[#FFC63D]" />}
          {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <p className={cn('text-[14.5px] font-semibold truncate', done && 'text-muted-foreground')}>{goal.title}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {area && <AreaChip area={goal.area} label={area.name} />}
          {paused && <span className="text-[11px] font-semibold text-muted-foreground">· Tạm dừng</span>}
          {ms > 0 && <span className="text-[11.5px] text-muted-foreground truncate">· {msDone}/{ms} mốc</span>}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-3 w-[38%] max-w-[300px] shrink-0">
        <ProgressBar value={goal.progress} color={done ? '#22C38E' : areaColor(goal.area)} className="flex-1" />
        <span className="w-10 text-right text-[13px] font-bold tabular-nums">{goal.progress}%</span>
      </div>
      <span className={cn('hidden md:block w-[118px] text-right text-[12px] font-medium shrink-0', TONE[dl.tone])}>{dl.text}</span>
      <span className="sm:hidden text-[13px] font-bold tabular-nums">{goal.progress}%</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button onClick={(e) => e.stopPropagation()} className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onOpen}><Eye className="h-4 w-4 mr-2" />Xem chi tiết</DropdownMenuItem>
          {!done && <DropdownMenuItem onClick={() => api.toggleFocus(goal)}><Star className="h-4 w-4 mr-2" />{goal.isFocused ? 'Bỏ mục tiêu lớn' : 'Đặt làm mục tiêu lớn'}</DropdownMenuItem>}
          {!done && <DropdownMenuItem onClick={() => api.setPaused(goal, !paused)}>{paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}{paused ? 'Tiếp tục' : 'Tạm dừng'}</DropdownMenuItem>}
          {done
            ? <DropdownMenuItem onClick={() => api.reopen(goal)}><RotateCcw className="h-4 w-4 mr-2" />Mở lại</DropdownMenuItem>
            : <DropdownMenuItem onClick={() => api.complete(goal)} disabled={locked}><CheckCircle2 className="h-4 w-4 mr-2" />Đánh dấu hoàn thành</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
