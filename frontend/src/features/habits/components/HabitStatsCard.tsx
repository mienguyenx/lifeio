import { Flame, Crown, BarChart3 } from 'lucide-react';
import { Mascot } from '@/components/brand/Mascot';
import { cn } from '@/lib/utils';
import type { HabitsApi } from '../hooks/useHabits';

function Ring({ pct, size }: { pct: number; size: number }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeOpacity={0.3} strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} className="transition-all duration-700" />
      </svg>
      <span className={cn('absolute font-bold', size < 76 ? 'text-[16px]' : 'text-[20px]')}>{pct}%</span>
    </div>
  );
}

/** Hero "Hôm nay của bạn" (gradient tím → mint). Bản compact (mobile) gộp luôn streak + tỷ lệ 30 ngày để khỏi cần 3 ô số riêng. */
export function HabitTodayHero({ stats, compact }: { stats: HabitsApi['stats']; compact?: boolean }) {
  const msg = stats.total === 0 ? 'Bắt đầu với một thói quen thật nhỏ 🌱'
    : stats.pctToday >= 100 ? 'Hoàn hảo! Bạn đã xong tất cả 🎉'
    : stats.pctToday >= 50 ? 'Tuyệt vời! Cứ duy trì nhé 💚' : 'Từng bước nhỏ, mỗi ngày một chút ✨';
  if (compact) {
    const left = stats.total - stats.completedToday;
    return (
      <div className="relative overflow-hidden rounded-[26px] p-4 pr-24 text-white bg-gradient-to-br from-[#7B6CF6] via-[#8E86F7] to-[#62D6AE] shadow-hero">
        <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3.5">
          <Ring pct={stats.pctToday} size={68} />
          <div className="min-w-0">
            <p className="text-[16px] font-bold leading-snug">{stats.completedToday}/{stats.total} thói quen</p>
            <p className="text-[12.5px] opacity-90 truncate">{stats.total === 0 ? msg : left > 0 ? `Còn ${left} thói quen nữa` : msg}</p>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-1.5 text-[12px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur"><Flame className="h-3.5 w-3.5" />{stats.currentStreak > 0 ? `Chuỗi ${stats.currentStreak} ngày` : 'Bắt đầu chuỗi hôm nay'}</span>
          {stats.bestStreak > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur"><Crown className="h-3.5 w-3.5" />Kỷ lục {stats.bestStreak}</span>}
          {stats.rate30 > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur"><BarChart3 className="h-3.5 w-3.5" />{stats.rate30}% / 30 ngày</span>}
        </div>
        <Mascot name="taro" pose={stats.pctToday >= 100 ? 'go' : 'care'} size={92} className="absolute -right-1 -bottom-1 pointer-events-none" />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-[28px] p-5 pr-28 text-white bg-gradient-to-br from-[#7B6CF6] via-[#8E86F7] to-[#62D6AE] shadow-hero">
      <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-4">
        <Ring pct={stats.pctToday} size={88} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold opacity-90">Hôm nay của bạn</p>
          <p className="text-[17px] font-bold leading-snug mt-0.5">{stats.completedToday}/{stats.total} thói quen hoàn thành</p>
          <p className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-medium backdrop-blur">{msg}</p>
        </div>
      </div>
      <Mascot name="taro" pose={stats.pctToday >= 100 ? 'go' : 'care'} size={124} className="absolute -right-1 -bottom-2 pointer-events-none" />
    </div>
  );
}

export function HabitStatTiles({ stats, className }: { stats: HabitsApi['stats']; className?: string }) {
  const items = [
    { icon: <Flame className="h-5 w-5 text-[#FF7A45]" />, tint: 'bg-[#FFF0E8] dark:bg-[#FF7A45]/15', value: stats.currentStreak, label: 'Streak hiện tại' },
    { icon: <Crown className="h-5 w-5 text-[#F5A524]" />, tint: 'bg-[#FFF6DD] dark:bg-[#F5A524]/15', value: stats.bestStreak, label: 'Streak dài nhất' },
    { icon: <BarChart3 className="h-5 w-5 text-primary" />, tint: 'bg-lavender dark:bg-primary/15', value: `${stats.rate30}%`, label: 'Tỷ lệ 30 ngày' },
  ];
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {items.map((it) => (
        <div key={it.label} className="rounded-[22px] bg-card border border-border/60 shadow-soft py-3.5 px-2 flex flex-col items-center justify-center text-center">
          <span className={cn('h-10 w-10 rounded-[14px] grid place-items-center', it.tint)}>{it.icon}</span>
          <span className="text-[22px] font-bold leading-none mt-2 tabular-nums">{it.value}</span>
          <span className="text-[11.5px] text-muted-foreground mt-1">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
