import { useState } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Check, CheckCircle2, Flame, Lock, Pause, Pencil, Play, Plus, RotateCcw, Star, Trash2, TrendingUp, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { AreaChip, AreaTile, ProgressBar, SegmentedTabs, Surface } from '@/components/lio';
import { GoalLinkedItems } from '@/components/goals/GoalLinkedItems';
import { GoalTasksSection } from '@/components/goals/GoalTasksSection';
import { GoalProgressChart } from '@/components/goals/GoalProgressChart';
import { VisionBoardCard } from '@/components/goals/VisionBoardCard';
import { GoalDependencies } from '@/components/goals/GoalDependencies';
import { GoalCollaborationCard } from '@/components/goals/GoalCollaborationCard';
import { GoalSharing } from '@/components/goals/GoalSharing';
import type { Goal } from '@/types/lifeos';
import type { GoalsApi } from '../hooks/useGoals';
import { areaColor, areaOf, daysLeft, isPaused } from '../utils/goal.utils';

type Tab = 'roadmap' | 'linked' | 'stats' | 'vision' | 'more';
const TABS: { id: Tab; label: string }[] = [
  { id: 'roadmap', label: 'Lộ trình' }, { id: 'linked', label: 'Liên kết' }, { id: 'stats', label: 'Thống kê' }, { id: 'vision', label: 'Tầm nhìn' }, { id: 'more', label: 'Khác' },
];
const fmt = (s?: string) => (s ? format(parseISO(s), 'dd/MM/yyyy') : '—');

export function GoalDetailModal({ goal, open, onOpenChange, api, locked, onEdit, onDelete }: {
  goal: Goal | null; open: boolean; onOpenChange: (o: boolean) => void; api: GoalsApi; locked?: boolean; onEdit: (g: Goal) => void; onDelete: (g: Goal) => void;
}) {
  const [tab, setTab] = useState<Tab>('roadmap');
  const [ms, setMs] = useState('');
  if (!goal) return null;
  const area = areaOf(goal.area);
  const done = !!goal.completedAt; const paused = isPaused(goal);
  const msDone = goal.milestones.filter((m) => m.completed).length;
  const left = daysLeft(goal);
  const since = Math.max(0, differenceInDays(new Date(), parseISO(goal.createdAt)));
  const add = () => { api.addMilestone(goal, ms); setMs(''); };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Chi tiết mục tiêu" className="sm:max-w-[600px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <div className="space-y-4 min-w-0">
        <div className="flex items-start gap-3.5">
          <AreaTile area={goal.area} size={56} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[19px] font-bold leading-snug break-words">{goal.title}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {area && <AreaChip area={goal.area} label={area.name} />}
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', done ? 'bg-[#E6F8F1] text-[#22B07D]' : paused ? 'bg-secondary text-muted-foreground' : 'bg-lavender text-primary dark:bg-primary/15')}>
                {done ? 'Đã hoàn thành' : paused ? 'Tạm dừng' : '• Đang thực hiện'}
              </span>
              {goal.isFocused && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[#FFF6D9] text-[#E8961C]"><Star className="h-3 w-3 fill-current" />Mục tiêu lớn</span>}
              {locked && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-secondary text-muted-foreground"><Lock className="h-3 w-3" />Chờ mục tiêu tiên quyết</span>}
            </div>
          </div>
        </div>
        {goal.description && <p className="text-[13.5px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{goal.description}</p>}
        <div className="rounded-2xl bg-gradient-to-r from-lavender to-[#FFEFF4] dark:from-primary/15 dark:to-[#F2557A]/10 px-4 py-3 text-center text-[13px] italic font-medium text-primary">“Hôm nay tốt hơn hôm qua!”</div>

        <Surface className="p-4">
          <div className="flex items-end justify-between mb-2">
            <div><p className="text-[12px] font-semibold text-muted-foreground">Tiến độ</p><p className="text-[26px] font-extrabold leading-none mt-1 tabular-nums">{goal.progress}%</p></div>
            <p className="text-[12px] text-muted-foreground">{msDone}/{goal.milestones.length} mốc hoàn thành</p>
          </div>
          <ProgressBar value={goal.progress} color={done ? '#22C38E' : areaColor(goal.area)} height={8} />
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[{ l: 'Ngày bắt đầu', v: fmt(goal.createdAt) }, { l: 'Ngày mục tiêu', v: fmt(goal.targetDate) }, { l: done ? 'Hoàn thành' : 'Còn lại', v: done ? fmt(goal.completedAt) : left === null ? '—' : left < 0 ? `Quá ${-left} ngày` : `${left} ngày` }].map((x) => (
              <div key={x.l} className="rounded-2xl bg-secondary/50 py-2.5"><p className="text-[11px] text-muted-foreground">{x.l}</p><p className={cn('text-[13px] font-bold mt-0.5', x.v.startsWith('Quá') && 'text-destructive')}>{x.v}</p></div>
            ))}
          </div>
        </Surface>

        <div className="overflow-x-auto no-scrollbar"><SegmentedTabs items={TABS} value={tab} onChange={setTab} size="sm" /></div>

        {tab === 'roadmap' && (
          <div>
            <p className="text-[13.5px] font-bold mb-2">Các mốc quan trọng</p>
            <ol className="relative space-y-1">
              {goal.milestones.map((m, i) => (
                <li key={m.id} className="group relative flex items-start gap-3 rounded-2xl px-2 py-2 hover:bg-secondary/40">
                  {i < goal.milestones.length - 1 && <span className="absolute left-[19px] top-9 bottom-[-6px] w-[2px] bg-border" />}
                  <button disabled={done} onClick={() => api.toggleMilestone(goal, m.id)} className={cn('relative z-10 h-6 w-6 rounded-lg border-2 grid place-items-center shrink-0 transition-colors', m.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card hover:border-primary')} aria-label="Đánh dấu mốc">
                    {m.completed && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[13.5px] font-medium', m.completed && 'line-through text-muted-foreground')}>{m.title}</p>
                    <p className="text-[11.5px] text-muted-foreground">{m.completedAt ? `Hoàn thành ${fmt(m.completedAt)}` : `Mốc ${i + 1}`}</p>
                  </div>
                  {!done && <button onClick={() => api.deleteMilestone(goal, m.id)} className="opacity-0 group-hover:opacity-100 h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-destructive" aria-label="Xóa mốc"><Trash2 className="h-3.5 w-3.5" /></button>}
                </li>
              ))}
              {goal.milestones.length === 0 && <p className="text-[13px] text-muted-foreground py-3 text-center">Chưa có mốc nào. Thêm mốc để theo dõi tiến độ!</p>}
            </ol>
            {!done && (
              <div className="flex gap-2 mt-2">
                <input value={ms} onChange={(e) => setMs(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Thêm mốc mới…" className="h-10 flex-1 min-w-0 rounded-full bg-secondary/60 border border-transparent px-4 text-[13px] focus:outline-none focus:bg-card focus:border-primary/40" />
                <Button variant="outline" className="h-10 rounded-full" onClick={add}><Plus className="h-4 w-4 mr-1" />Thêm mốc</Button>
              </div>
            )}
          </div>
        )}
        {tab === 'linked' && <div className="space-y-4"><GoalLinkedItems goalId={goal.id} /><GoalTasksSection goal={goal} /></div>}
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { i: <TrendingUp className="h-4 w-4 text-primary" />, v: `${since ? (goal.progress / since).toFixed(1) : '0'}%`, l: 'Tiến độ/ngày' },
                { i: <CalendarClock className="h-4 w-4 text-[#3D8BFD]" />, v: since, l: 'Ngày đã qua' },
                { i: <Flame className="h-4 w-4 text-[#FF7A45]" />, v: goal.currentStreak || 0, l: 'Streak hiện tại' },
                { i: <Star className="h-4 w-4 text-[#E8961C]" />, v: goal.bestStreak || 0, l: 'Streak tốt nhất' },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl bg-secondary/50 p-3 text-center"><span className="inline-flex">{x.i}</span><p className="text-[18px] font-bold mt-1 tabular-nums">{x.v}</p><p className="text-[11px] text-muted-foreground">{x.l}</p></div>
              ))}
            </div>
            <GoalProgressChart goal={goal} />
          </div>
        )}
        {tab === 'vision' && <VisionBoardCard goal={goal} />}
        {tab === 'more' && (
          <div className="space-y-4">
            <GoalDependencies goal={goal} />
            <GoalCollaborationCard goal={goal} onUpdate={(u) => api.update(goal.id, u)} />
            <GoalSharing goal={goal} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-full text-destructive" onClick={() => onDelete(goal)} aria-label="Xóa"><Trash2 className="h-4 w-4" /></Button>
          <Button variant="outline" className="h-11 rounded-full" onClick={() => onEdit(goal)}><Pencil className="h-4 w-4 mr-1.5" />Sửa</Button>
          {!done && <Button variant="outline" className="h-11 rounded-full" onClick={() => api.setPaused(goal, !paused)}>{paused ? <Play className="h-4 w-4 mr-1.5" /> : <Pause className="h-4 w-4 mr-1.5" />}{paused ? 'Tiếp tục' : 'Tạm dừng'}</Button>}
          {done
            ? <Button className="h-11 rounded-full flex-1" variant="secondary" onClick={() => api.reopen(goal)}><RotateCcw className="h-4 w-4 mr-1.5" />Mở lại</Button>
            : <Button className="h-11 rounded-full flex-1 shadow-soft" disabled={locked} onClick={() => { api.complete(goal); onOpenChange(false); }}><CheckCircle2 className="h-4 w-4 mr-1.5" />Hoàn thành</Button>}
        </div>
      </div>
    </AdaptiveModal>
  );
}
