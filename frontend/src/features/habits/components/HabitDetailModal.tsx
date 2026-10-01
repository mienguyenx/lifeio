import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Bell, Check, ChevronLeft, ChevronRight, Crown, Flame, Minus, Pencil, Plus, Target, Trash2, BarChart3, MessageSquareText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types/lifeos';
import type { HabitsApi } from '../hooks/useHabits';
import {
  CHALLENGES, FREQUENCY_LABEL, WEEKDAY_SHORT, addDaysKey, areaInfo, challengeProgress, countOn, dayNum, habitColor, habitTint, lastNDays, rateIn, targetOf, weekdayOf,
} from '../utils/habit.utils';
import { HabitIcon } from './HabitCard';

function MonthGrid({ habit, today }: { habit: Habit; today: string }) {
  const [offset, setOffset] = useState(0);
  const [y, m] = today.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 10);
  const daysInMonth = new Date(Date.UTC(y, m + offset, 0)).getUTCDate();
  const lead = (weekdayOf(first) + 6) % 7;
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDaysKey(first, i))];
  const t = targetOf(habit);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[14px] font-bold capitalize">{format(parseISO(first), 'MMMM yyyy', { locale: vi })}</p>
        <div className="flex gap-1">
          <button onClick={() => setOffset((o) => o - 1)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary disabled:opacity-30" aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => <span key={d} className="text-[11px] font-semibold text-muted-foreground">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const n = countOn(habit, d), full = n >= t, part = n > 0 && !full, future = d > today;
          return (
            <span key={d} title={`${d}: ${n}/${t}`}
              className={cn('h-9 w-9 mx-auto rounded-full grid place-items-center text-[12px] font-semibold', future && 'opacity-30', d === today && 'ring-2 ring-primary ring-offset-1 ring-offset-card', !full && !part && 'bg-secondary/70 text-muted-foreground')}
              style={full ? { background: habitColor(habit), color: 'white' } : part ? { background: habitTint(habit, 0.35) } : undefined}
            >{full ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : dayNum(d)}</span>
          );
        })}
      </div>
    </div>
  );
}

function Row({ icon, label, right, onClick, danger }: { icon: React.ReactNode; label: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn('w-full flex items-center gap-3 px-1 py-3 text-left text-[14px] font-medium', danger && 'text-destructive')}>
      <span className="h-8 w-8 rounded-[12px] bg-secondary/80 grid place-items-center shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {right ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

export function HabitDetailModal({ habit, open, onOpenChange, date, api, onEdit, onDelete }: {
  habit: Habit | null; open: boolean; onOpenChange: (o: boolean) => void; date: string; api: HabitsApi;
  onEdit: (h: Habit) => void; onDelete: (h: Habit) => void;
}) {
  const [note, setNote] = useState('');
  const last30 = useMemo(() => lastNDays(30, api.today), [api.today]);
  if (!habit) return null;
  const t = targetOf(habit), n = countOn(habit, date), done = n >= t;
  const area = areaInfo(habit);
  const goal = habit.goalId ? api.goals.find((g) => g.id === habit.goalId) : undefined;
  const ch = habit.challenge && habit.challenge.status === 'active' ? { info: CHALLENGES[habit.challenge.type], p: challengeProgress(habit) } : null;
  const notes = (habit.completions || []).filter((c) => c.notes).sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);
  const isToday = date === api.today;

  const plus = () => { api.increment(habit, date, note || undefined); setNote(''); };
  const cta = () => (t > 1 ? plus() : done ? api.decrement(habit, date) : plus());

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={habit.name} className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-col items-center text-center -mt-2">
          <HabitIcon habit={habit} size={76} className="rounded-[24px] shadow-soft" />
          <p className="text-[13px] text-muted-foreground mt-2.5">{area?.icon} {area?.name} · {FREQUENCY_LABEL[habit.frequency]}{habit.archivedAt ? ' · Đã lưu trữ' : ''}</p>
        </div>

        {(habit.minimumVersion || habit.description) && (
          <div className="rounded-[20px] bg-lavender/70 dark:bg-primary/10 px-4 py-3 text-center text-[13.5px] italic text-primary">
            “{habit.description || habit.minimumVersion}”
            {habit.description && habit.minimumVersion && <p className="not-italic text-[12px] text-muted-foreground mt-1">Tối thiểu: {habit.minimumVersion}</p>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { i: <Flame className="h-5 w-5 text-[#FF7A45]" />, v: habit.streak, l: 'Streak hiện tại' },
            { i: <Crown className="h-5 w-5 text-[#F5A524]" />, v: habit.bestStreak || habit.streak, l: 'Streak dài nhất' },
            { i: <BarChart3 className="h-5 w-5 text-primary" />, v: `${rateIn(habit, last30)}%`, l: 'Tỷ lệ 30 ngày' },
          ].map((s) => (
            <div key={s.l} className="rounded-[20px] border border-border/70 bg-card py-3 flex flex-col items-center">
              {s.i}<span className="text-[20px] font-bold mt-1 tabular-nums">{s.v}</span><span className="text-[11px] text-muted-foreground">{s.l}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[22px] border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-muted-foreground">{isToday ? 'Tiến độ hôm nay' : `Tiến độ ${WEEKDAY_SHORT[weekdayOf(date)]} ${dayNum(date)}/${date.slice(5, 7)}`}</p>
              <p className="text-[22px] font-bold mt-0.5">{n} <span className="text-[15px] text-muted-foreground font-semibold">/ {t} {habit.targetUnit || 'lần'}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => api.decrement(habit, date)} disabled={n === 0} className="h-10 w-10 rounded-full border border-border grid place-items-center hover:bg-secondary disabled:opacity-40" aria-label="Giảm"><Minus className="h-4 w-4" /></button>
              <button onClick={plus} className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-fab" aria-label="Tăng"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#EEF0F5] dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (n / t) * 100)}%`, background: done ? '#22C38E' : habitColor(habit) }} />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cho lần hoàn thành (tùy chọn)…" className="mt-3 h-10 w-full rounded-full bg-secondary/60 px-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {ch && (
          <div className="rounded-[22px] bg-gradient-to-r from-[#FFF4E6] to-[#FFEFF6] dark:from-[#FF9B63]/10 dark:to-[#F472B6]/10 p-4">
            <p className="text-[13.5px] font-bold">{ch.info.emoji} {ch.info.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-white/70 dark:bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-[#FF9B63]" style={{ width: `${ch.p.pct}%` }} /></div>
              <span className="text-[12px] font-semibold">{ch.p.days}/{ch.p.total} ngày</span>
            </div>
          </div>
        )}

        <div className="rounded-[22px] border border-border/70 bg-card p-4"><MonthGrid habit={habit} today={api.today} /></div>

        {notes.length > 0 && (
          <div className="rounded-[22px] border border-border/70 bg-card p-4 space-y-2">
            <p className="text-[14px] font-bold">Ghi chú gần đây</p>
            {notes.map((c) => (
              <div key={c.date + c.notes} className="text-[13px]"><span className="text-muted-foreground mr-2">{c.date.slice(8, 10)}/{c.date.slice(5, 7)}</span>{c.notes}</div>
            ))}
          </div>
        )}

        <div className="rounded-[22px] border border-border/70 bg-card px-3 divide-y divide-border/60">
          <Row icon={<Bell className="h-4 w-4" />} label={habit.reminderTime ? `Nhắc nhở · ${habit.reminderTime}` : 'Nhắc nhở (chưa đặt giờ)'}
            onClick={() => !habit.reminderTime && onEdit(habit)}
            right={habit.reminderTime ? <Switch checked={!!habit.reminderEnabled} onCheckedChange={(v) => api.updateHabit(habit.id, { reminderEnabled: v })} onClick={(e) => e.stopPropagation()} /> : undefined} />
          <Row icon={<Target className="h-4 w-4" />} label={goal ? `Mục tiêu: ${goal.title}` : 'Liên kết mục tiêu'} onClick={() => onEdit(habit)} />
          <Row icon={<MessageSquareText className="h-4 w-4" />} label="Chỉnh sửa thói quen" onClick={() => onEdit(habit)} right={<Pencil className="h-4 w-4 text-muted-foreground" />} />
          <Row icon={habit.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />} label={habit.archivedAt ? 'Khôi phục' : 'Lưu trữ'}
            onClick={() => { if (habit.archivedAt) api.unarchiveHabit(habit.id); else { api.archiveHabit(habit.id); onOpenChange(false); } }} />
          <Row icon={<Trash2 className="h-4 w-4" />} label="Xóa thói quen" danger onClick={() => onDelete(habit)} right={<span />} />
        </div>

        {!habit.archivedAt && (
          <Button onClick={cta} disabled={t > 1 && done} className={cn('w-full h-12 rounded-full text-[15px]', done && 'bg-[#22C38E] hover:bg-[#22C38E]/90')}>
            <Check className="h-4 w-4 mr-1.5" />{done ? (t > 1 ? 'Đã hoàn thành' : 'Đã hoàn thành · bấm để bỏ') : t > 1 ? `Ghi nhận +1 (${n}/${t})` : 'Đánh dấu hoàn thành'}
          </Button>
        )}
      </div>
    </AdaptiveModal>
  );
}
