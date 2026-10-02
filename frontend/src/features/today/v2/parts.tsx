import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, ChevronDown, Clock, Flame, Play, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit, type Task } from '@/types/lifeos';
import { AreaTile, ProgressRing, SectionTitle, Surface } from '@/components/lio';
import { Mascot } from '@/components/brand/Mascot';
import type { TodayModel } from './useTodayModel';

export const PRI_LABEL: Record<Task['priority'], { t: string; cls: string }> = {
  high: { t: 'Cao', cls: 'bg-[#FFECEE] text-[#E5484D] dark:bg-red-500/15' },
  medium: { t: 'Vừa', cls: 'bg-[#FFF6D9] text-[#B7791F] dark:bg-amber-500/15' },
  low: { t: 'Thấp', cls: 'bg-secondary text-muted-foreground' },
};

export function Check0({ done, onClick, round, label }: { done: boolean; onClick: () => void; round?: boolean; label: string }) {
  return (
    <button aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn('h-6 w-6 shrink-0 grid place-items-center border-2 transition-all active:scale-90', round ? 'rounded-full' : 'rounded-[8px]',
        done ? 'bg-[#22B07D] border-[#22B07D] text-white' : 'border-border hover:border-primary/60')}>
      {done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
    </button>
  );
}

export function TaskLine({ task, m, overdue, compact }: { task: Task; m: TodayModel; overdue?: boolean; compact?: boolean }) {
  const done = task.status === 'done';
  return (
    <div className={cn('group flex items-center gap-3 rounded-[16px] px-2.5 py-2 transition-colors hover:bg-secondary/50', done && 'opacity-60')}>
      <Check0 round done={done} label="Hoàn thành" onClick={() => (done ? m.undoTask(task.id) : (m.doneTask(task.id), toast.success('Xong một việc 🎉')))} />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13.5px] font-semibold truncate', done && 'line-through')}>{task.title}</span>
        {!compact && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
          {overdue && <span className="font-semibold text-destructive">Quá hạn {task.dueDate && format(new Date(task.dueDate), 'dd/MM')}</span>}
          {task.reminderTime && <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{task.reminderTime}</span>}
          {task.area && <span>{LIFE_AREAS.find((a) => a.id === task.area)?.name}</span>}
        </span>}
      </span>
      {!done && <span className={cn('text-[10.5px] font-bold rounded-full px-2 py-0.5', PRI_LABEL[task.priority].cls)}>{PRI_LABEL[task.priority].t}</span>}
      {!done && <button onClick={() => m.focusTask(task.id)} aria-label="Tập trung" className="h-8 w-8 rounded-full grid place-items-center text-primary hover:bg-primary/10 sm:opacity-0 sm:group-hover:opacity-100 transition"><Play className="w-4 h-4" /></button>}
    </div>
  );
}

export function HabitLine({ habit, m }: { habit: Habit; m: TodayModel }) {
  const done = m.habitDone(habit);
  return (
    <div className={cn('flex items-center gap-3 rounded-[16px] px-2.5 py-2 transition-colors hover:bg-secondary/50', done && 'opacity-60')}>
      <Check0 done={done} label="Đánh dấu thói quen" onClick={() => m.toggleHabit(habit.id)} />
      <AreaTile area={habit.area} emoji={habit.icon} size={32} />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13.5px] font-semibold truncate', done && 'line-through')}>{habit.name}</span>
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
          {habit.reminderTime && <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{habit.reminderTime.slice(0, 5)}</span>}
          {habit.streak > 0 && <span className="inline-flex items-center gap-0.5 font-semibold text-streak"><Flame className="w-3 h-3" />{habit.streak} ngày</span>}
        </span>
      </span>
    </div>
  );
}

/** Đầu trang gọn: vòng tiến độ + lời chào + tóm tắt 1 dòng. */
export function TodayHello({ m, mascot = true, className }: { m: TodayModel; mascot?: boolean; className?: string }) {
  const left = m.openTasks.length, habitsLeft = m.todayHabits.length - m.doneHabits.length;
  return (
    <div className={cn('relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#EFEBFF] via-[#F6F1FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-[#F2557A]/10 border border-border/40 p-4 sm:p-5 flex items-center gap-4', className)}>
      <ProgressRing value={m.dayProgress} size={68} stroke={8} />
      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-[12px] font-medium text-muted-foreground first-letter:uppercase">{format(m.today, "EEEE, dd 'tháng' M", { locale: vi })}</p>
        <h2 className="text-[19px] sm:text-[22px] font-extrabold tracking-tight leading-tight">{m.greeting}{m.firstName && `, ${m.firstName}`} 👋</h2>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">
          {left + habitsLeft === 0 ? 'Bạn đã xong mọi thứ hôm nay. Tuyệt vời!' : <>Còn <b className="text-foreground">{left} việc</b> và <b className="text-foreground">{habitsLeft} thói quen</b>{m.overdueTasks.length > 0 && <> · <b className="text-destructive">{m.overdueTasks.length} quá hạn</b></>}</>}
        </p>
      </div>
      {mascot && <Mascot name="lumi" pose={m.dayProgress >= 80 ? 'happy' : 'default'} size={96} className="hidden sm:block absolute right-3 -bottom-3 opacity-95" />}
    </div>
  );
}

/** Ô nhập/hiển thị “điều quan trọng nhất hôm nay”. */
export function IntentionLine({ m, className }: { m: TodayModel; className?: string }) {
  const [v, setV] = useState('');
  if (m.intention) return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="h-8 w-8 rounded-[10px] grid place-items-center bg-[#FFF6D9] dark:bg-amber-500/15 shrink-0"><Star className="w-4 h-4 text-[#E8961C]" /></span>
      <span className={cn('flex-1 min-w-0 text-[13.5px] font-semibold truncate', m.intention.completed && 'line-through text-muted-foreground')}>{m.intention.intention}</span>
      {!m.intention.completed && <Button size="sm" variant="secondary" className="h-8 rounded-full" onClick={() => m.completeIntention(m.intention!.id)}>Xong</Button>}
    </div>
  );
  const save = () => { if (!v.trim()) return; m.setIntention(v.trim()); setV(''); toast.success('Đã đặt mục tiêu hôm nay'); };
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="h-8 w-8 rounded-[10px] grid place-items-center bg-[#FFF6D9] dark:bg-amber-500/15 shrink-0"><Star className="w-4 h-4 text-[#E8961C]" /></span>
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="Điều quan trọng nhất hôm nay?"
        className="h-9 flex-1 min-w-0 rounded-full border border-border bg-card px-3.5 text-[13px] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />
      <Button size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={!v.trim()} onClick={save} aria-label="Lưu"><Send className="w-4 h-4" /></Button>
    </div>
  );
}

/** Sức khỏe nhanh: 4 ô nhỏ (nước chạm +1). */
export function HealthMini({ m, cols = 4, className }: { m: TodayModel; cols?: 2 | 4; className?: string }) {
  const nav = useNavigate();
  const items: { e: string; v: ReactNode; l: string; on: () => void; hint?: string }[] = [
    { e: '💧', v: <>{m.health.water}<small className="text-muted-foreground font-semibold">/{m.health.waterTarget}</small></>, l: 'Nước', on: m.health.addWater, hint: '+1' },
    { e: '🌙', v: m.health.sleep != null ? `${+m.health.sleep.toFixed(1)}h` : '–', l: 'Giấc ngủ', on: () => nav('/health?add') },
    { e: '🏃', v: <>{m.health.exercise}<small className="text-muted-foreground font-semibold">′</small></>, l: 'Vận động', on: () => nav('/health?add') },
    { e: '⏱️', v: m.pomos.length, l: 'Phiên focus', on: () => m.focusTask() },
  ];
  return (
    <div className={cn('grid gap-2', cols === 4 ? 'grid-cols-4' : 'grid-cols-2', className)}>
      {items.map((it) => (
        <button key={it.l} onClick={it.on} className="relative rounded-[18px] bg-card border border-border/60 shadow-soft px-2 py-2.5 text-center transition hover:-translate-y-0.5 hover:shadow-card">
          {it.hint && <span className="absolute top-1.5 right-2 text-[10px] font-bold text-primary">{it.hint}</span>}
          <span className="block text-[18px] leading-none">{it.e}</span>
          <span className="block text-[15px] font-extrabold tabular-nums mt-1">{it.v}</span>
          <span className="block text-[10.5px] text-muted-foreground truncate">{it.l}</span>
        </button>
      ))}
    </div>
  );
}

export function WeekCard({ m }: { m: TodayModel }) {
  return (
    <Surface className="p-4">
      <SectionTitle title="Tuần này" action={<Link to="/weekly-review" className="text-[12px] font-semibold text-primary">Review</Link>} />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-[#FFF1E8] dark:bg-streak/10 py-2.5"><p className="text-[18px] font-extrabold text-streak tabular-nums">{m.bestStreak}</p><p className="text-[10.5px] text-muted-foreground">Chuỗi dài nhất</p></div>
        <div className="rounded-2xl bg-secondary/60 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{m.weekHabits}</p><p className="text-[10.5px] text-muted-foreground">Lượt thói quen</p></div>
        <div className="rounded-2xl bg-secondary/60 py-2.5"><p className="text-[18px] font-extrabold tabular-nums">{m.weekTasks}</p><p className="text-[10.5px] text-muted-foreground">Việc xong</p></div>
      </div>
      {!m.weekReviewed && <Button variant="outline" className="mt-3 w-full h-9 rounded-full text-[12.5px]" asChild><Link to="/weekly-review?add">Viết review tuần</Link></Button>}
    </Surface>
  );
}

/** Khối thu gọn được (dùng cho phần phụ trên mobile). */
export function Collapse({ title, children, defaultOpen }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between rounded-[18px] bg-card border border-border/60 shadow-soft px-4 py-3 text-[13.5px] font-bold">
        {title}<ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-3 mt-3">{children}</div>}
    </div>
  );
}
