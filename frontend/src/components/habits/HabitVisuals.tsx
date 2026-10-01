import type { CSSProperties, ReactNode } from 'react';
import { Check, Flame, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mascot } from '@/components/brand/Mascot';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { LIFE_AREAS, type Habit } from '@/types/lifeos';

/* Visual layer cho module Habits (UI v3). Chỉ trình bày — logic giữ nguyên ở HabitsPage/store. */

export const getHabitCount = (habit: Habit, date: string) => {
  const c = habit.completions?.find((x) => x.date === date);
  return c?.count || (habit.completedDates.includes(date) ? 1 : 0);
};

export const areaTint = (area: string, alpha = 0.14): CSSProperties => ({ backgroundColor: `hsl(var(--area-${area}) / ${alpha})` });
export const areaColor = (area: string) => `hsl(var(--area-${area}))`;

export function HabitIconTile({ habit, done, size = 48, className }: { habit: Habit; done?: boolean; size?: number; className?: string }) {
  const area = LIFE_AREAS.find((a) => a.id === habit.area);
  return (
    <div
      className={cn('shrink-0 grid place-items-center rounded-[16px] transition-all', done && 'ring-2 ring-[#22B07D]/30', className)}
      style={{ width: size, height: size, fontSize: size * 0.46, ...areaTint(habit.area, done ? 0.2 : 0.14) }}
      aria-hidden
    >
      {habit.icon || area?.icon}
    </div>
  );
}

/** Nút check tròn: đơn → toggle; nhiều lần/ngày → vòng tiến độ + dấu cộng. */
export function HabitCheckButton({ done, count, target, onClick, label }: {
  done: boolean; count: number; target: number; onClick: (e: React.MouseEvent) => void; label?: string;
}) {
  const multi = target > 1;
  const pct = Math.min(1, count / target);
  const r = 16, c = 2 * Math.PI * r;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      aria-label={label ?? (done ? 'Bỏ hoàn thành' : multi ? 'Thêm 1 lần' : 'Hoàn thành')}
      aria-pressed={done}
      className={cn(
        'relative shrink-0 h-10 w-10 rounded-full grid place-items-center transition-all active:scale-90 touch-manipulation',
        done ? 'bg-[#22B07D] text-white shadow-[0_6px_14px_-6px_rgba(34,176,125,0.8)]' : 'text-primary hover:bg-lavender/70',
      )}
    >
      {!done && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth="2.5" className="text-muted-foreground" />
          {multi && pct > 0 && (
            <circle cx="20" cy="20" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
          )}
        </svg>
      )}
      {done ? <Check className="h-5 w-5" strokeWidth={3} /> : multi ? <Plus className="h-4 w-4 relative" strokeWidth={2.5} /> : null}
    </button>
  );
}

export function HabitProgressBar({ habit, count, target, className }: { habit: Habit; count: number; target: number; className?: string }) {
  const done = count >= target;
  return (
    <div className={cn('h-1.5 rounded-full bg-[#ECEEF3] dark:bg-white/10 overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, (count / target) * 100)}%`, background: done ? '#22B07D' : areaColor(habit.area) }}
      />
    </div>
  );
}

export function StreakPill({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFF1E8] dark:bg-[#FF9B63]/15 text-[#F2752B] px-1.5 py-0.5 text-[11px] font-bold">
      <Flame className="h-3 w-3" />{streak}
    </span>
  );
}

/** Dải chấm N ngày (7/14/30). */
export function HabitDots({ habit, dates, todayStr, size = 'md' }: { habit: Habit; dates: string[]; todayStr: string; size?: 'sm' | 'md' }) {
  const target = habit.targetPerDay || 1;
  return (
    <div className="flex gap-1 flex-wrap">
      {dates.map((d) => {
        const n = getHabitCount(habit, d);
        const full = n >= target, part = n > 0 && !full;
        return (
          <span
            key={d}
            title={`${d}: ${n}/${target}`}
            className={cn(
              'rounded-[4px] transition-colors',
              size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5',
              !full && !part && 'bg-[#E9EBF1] dark:bg-white/10',
              d === todayStr && 'ring-1 ring-primary ring-offset-1 ring-offset-card',
            )}
            style={full ? { background: areaColor(habit.area) } : part ? { background: `hsl(var(--area-${habit.area}) / 0.4)` } : undefined}
          />
        );
      })}
    </div>
  );
}

function Ring({ pct, size = 92 }: { pct: number; size?: number }) {
  const r = size / 2 - 8, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeOpacity={0.35} strokeWidth="9" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} className="transition-all duration-700" />
    </svg>
  );
}

function Tile({ icon, value, label, tint }: { icon: ReactNode; value: ReactNode; label: string; tint: string }) {
  return (
    <div className="rounded-[20px] bg-card border border-border/70 shadow-soft p-3 flex flex-col items-center justify-center text-center gap-1.5 min-w-0">
      <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', tint)}>{icon}</span>
      <span className="text-[20px] font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[11.5px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

/** Hero "Hôm nay của bạn" + 3 ô số liệu — dùng đúng các chỉ số HabitsPage đã tính. */
export function HabitsOverview({ completedToday, totalHabits, totalStreak, avgCompletion, compact }: {
  completedToday: number; totalHabits: number; totalStreak: number; avgCompletion: number; compact?: boolean;
}) {
  const pct = totalHabits ? Math.round((completedToday / totalHabits) * 100) : 0;
  const msg = totalHabits === 0 ? 'Bắt đầu với một thói quen thật nhỏ.'
    : pct >= 100 ? 'Tuyệt vời! Hoàn thành hết rồi 🎉'
    : pct >= 50 ? 'Tuyệt vời! Cứ duy trì nhé 💚' : 'Từng bước nhỏ mỗi ngày.';
  return (
    <div className={cn('grid gap-3', !compact && 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]')}>
      <div className="relative overflow-hidden rounded-[28px] p-5 text-white bg-gradient-to-br from-[#7C6CF6] via-[#8A80F5] to-[#5FD3A8] shadow-hero">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative grid place-items-center">
            <Ring pct={pct} size={compact ? 84 : 96} />
            <span className="absolute text-[22px] font-bold">{pct}%</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold opacity-90">Hôm nay của bạn</p>
            <p className="text-[19px] font-bold leading-tight mt-0.5">{completedToday}/{totalHabits} thói quen hoàn thành</p>
            <p className="text-[12.5px] opacity-90 mt-1.5">{msg}</p>
          </div>
        </div>
        <Mascot name="taro" pose={pct >= 100 ? 'go' : 'default'} size={compact ? 92 : 118} className="absolute -right-2 -bottom-3 opacity-95 pointer-events-none" />
      </div>
      <div className="grid gap-3 grid-cols-3">
        <Tile icon={<Flame className="h-5 w-5 text-[#F2752B]" />} value={totalStreak} label="Tổng streak" tint="bg-[#FFF1E8] dark:bg-[#FF9B63]/15" />
        <Tile icon={<LifeIcon name="module/habits" size={22} variant="duotone" />} value={totalHabits} label="Đang theo dõi" tint="bg-[#E6F8F1] dark:bg-[#57D3AE]/15" />
        <Tile icon={<LifeIcon name="module/insights" size={22} variant="duotone" />} value={`${avgCompletion}%`} label="Tỷ lệ 30 ngày" tint="bg-[#FFF6D9] dark:bg-[#FFC63D]/15" />
      </div>
    </div>
  );
}
