import { useMemo, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Mascot } from '@/components/brand/Mascot';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types/lifeos';
import type { ChallengeType } from '../types/habit.types';
import { CHALLENGES, challengeProgress } from '../utils/habit.utils';
import { HabitIcon } from './HabitCard';

const TABS = [{ id: 'active', l: 'Đang diễn ra' }, { id: 'explore', l: 'Khám phá' }, { id: 'done', l: 'Hoàn thành' }] as const;
const TINT: Record<ChallengeType, string> = { '21-day': 'from-[#E8F4FF] to-[#F1EEFF]', '30-day': 'from-[#FFF1E6] to-[#FFF7DD]', '66-day': 'from-[#E9FBF3] to-[#F1EEFF]' };

/** Thử thách 21/30/66 ngày — cùng model `habit.challenge` như HabitChallengesCard. */
export function HabitChallenges({ habits, onStart, onOpen }: { habits: Habit[]; onStart: (habitId: string, t: ChallengeType) => void; onOpen: (h: Habit) => void }) {
  const active = useMemo(() => habits.filter((h) => !h.deletedAt && h.challenge?.status === 'active'), [habits]);
  const done = useMemo(() => habits.filter((h) => !h.deletedAt && h.challenge?.status === 'completed'), [habits]);
  const free = useMemo(() => habits.filter((h) => !h.archivedAt && !h.deletedAt && (!h.challenge || h.challenge.status === 'failed')), [habits]);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>(active.length ? 'active' : 'explore');
  const [pick, setPick] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#FFF3E2] via-[#FFEFF4] to-[#F1EEFF] dark:from-[#FF9B63]/10 dark:to-primary/10 p-5 pl-32 min-h-[120px] flex items-center">
        <Mascot name="taro" pose="go" size={112} className="absolute left-2 -bottom-2" />
        <div>
          <p className="text-[16px] font-bold">Thách thức bản thân</p>
          <p className="text-[13px] text-muted-foreground">Kiên trì hôm nay, phiên bản tốt hơn ngày mai!</p>
        </div>
      </div>

      <div className="grid grid-cols-3 p-1 rounded-full bg-secondary/80">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('h-9 rounded-full text-[13px] font-semibold transition-all', tab === t.id ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground')}>
            {t.l}{t.id === 'active' && active.length ? ` (${active.length})` : t.id === 'done' && done.length ? ` (${done.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'explore' && (
        <div className="grid md:grid-cols-3 gap-3">
          {(Object.keys(CHALLENGES) as ChallengeType[]).map((type) => {
            const c = CHALLENGES[type];
            return (
              <div key={type} className={cn('rounded-[24px] bg-gradient-to-br p-4 border border-border/50 dark:from-white/5 dark:to-white/0', TINT[type])}>
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 rounded-[16px] bg-card grid place-items-center text-[24px] shadow-soft">{c.emoji}</span>
                  <div><p className="text-[14.5px] font-bold">{c.name}</p><p className="text-[12px] text-muted-foreground">{c.desc}</p></div>
                </div>
                {free.length ? (
                  <div className="flex gap-2 mt-4">
                    <Select value={pick[type] ?? ''} onValueChange={(v) => setPick((p) => ({ ...p, [type]: v }))}>
                      <SelectTrigger className="h-10 rounded-full bg-card flex-1 text-[13px]"><SelectValue placeholder="Chọn thói quen" /></SelectTrigger>
                      <SelectContent className="rounded-2xl">{free.map((h) => <SelectItem key={h.id} value={h.id}>{h.icon} {h.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <button disabled={!pick[type]} onClick={() => { onStart(pick[type], type); setTab('active'); }} className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-40">Tham gia</button>
                  </div>
                ) : <p className="text-[12px] text-muted-foreground mt-4">Mọi thói quen đều đang có thử thách.</p>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'active' && (
        <div className="grid md:grid-cols-2 gap-3">
          {active.length === 0 && <p className="text-[13px] text-muted-foreground py-6 text-center md:col-span-2">Chưa có thử thách nào — vào “Khám phá” để bắt đầu.</p>}
          {active.map((h) => {
            const c = CHALLENGES[h.challenge!.type], p = challengeProgress(h);
            return (
              <button key={h.id} onClick={() => onOpen(h)} className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4 text-left hover:shadow-card transition-shadow">
                <div className="flex items-center gap-3">
                  <HabitIcon habit={h} size={44} />
                  <div className="flex-1 min-w-0"><p className="text-[14px] font-bold truncate">{c.days} ngày {h.name.toLowerCase()}</p><p className="text-[12px] text-muted-foreground">{c.desc}</p></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-2 rounded-full bg-[#EEF0F5] dark:bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#FF9B63] to-[#FFC63D]" style={{ width: `${p.pct}%` }} /></div>
                  <span className="text-[12px] font-semibold tabular-nums">{p.days}/{p.total}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'done' && (
        <div className="grid md:grid-cols-2 gap-3">
          {done.length === 0 && <p className="text-[13px] text-muted-foreground py-6 text-center md:col-span-2">Hoàn thành thử thách đầu tiên để nhận huy hiệu 🏅</p>}
          {done.map((h) => (
            <div key={h.id} className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-[14px] bg-[#FFF6DD] grid place-items-center"><Trophy className="h-5 w-5 text-[#F5A524]" /></span>
              <div><p className="text-[14px] font-bold">{CHALLENGES[h.challenge!.type].name}</p><p className="text-[12px] text-muted-foreground">{h.name}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#FFF4E6] to-[#FFEFF6] dark:from-[#FF9B63]/10 dark:to-[#F472B6]/10 p-5 pr-28">
        <p className="text-[14px] italic font-medium">“Kỷ luật hôm nay là tự do ngày mai.”</p>
        <Mascot name="taro" pose="relax" size={96} className="absolute right-0 -bottom-2" />
      </div>
    </div>
  );
}
