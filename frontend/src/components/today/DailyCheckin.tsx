import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, Pencil, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/lio';
import { fieldCls, areaCls } from '@/components/lio/form';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getCheckinSlot, type CheckinKind } from '@/lib/checkinWindow';
import { getTodayDateString } from '@/utils/dateUtils';
import { useDailyCheckins, type CheckinRecord } from '@/hooks/useDailyCheckins';

const ENERGY = [
  { v: 1, e: '😴', l: 'Mệt' }, { v: 2, e: '😕', l: 'Thấp' }, { v: 3, e: '😐', l: 'Ổn' }, { v: 4, e: '😊', l: 'Tốt' }, { v: 5, e: '🔥', l: 'Tràn đầy' },
];
const laterKey = (date: string, kind: CheckinKind) => `lio-checkin-later:${date}:${kind}`;
const prevDay = (d: string) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() - 1); return t.toISOString().slice(0, 10); };

export interface DailyCheckinProps {
  summary: { tasksDone: number; tasksTotal: number; habitsDone: number; habitsTotal: number };
  suggestions?: string[];
  className?: string;
}

/**
 * Thẻ check-in đúng lúc: chỉ hiện trong khung sáng/tối (theo giờ dậy/ngủ), 1 chạm chọn năng lượng
 * rồi vài câu tuỳ chọn. "Để sau" ẩn đến lần mở sau; "Bỏ qua hôm nay" lưu lại & không hỏi nữa.
 * Đã làm → 1 dòng tóm tắt, bấm để sửa. Đồng bộ máy chủ qua useDailyCheckins.
 */
export function DailyCheckin({ summary, suggestions = [], className }: DailyCheckinProps) {
  const prefs = useLifeOSStore((s) => s.userPreferences);
  const intentions = useLifeOSStore((s) => s.dailyIntentions);
  const addDailyIntention = useLifeOSStore((s) => s.addDailyIntention);
  const updateDailyIntention = useLifeOSStore((s) => s.updateDailyIntention);
  const { get, save } = useDailyCheckins();
  const [params, setParams] = useSearchParams();
  const forced = params.get('checkin') as CheckinKind | null;

  // Tính lại mỗi phút để thẻ tự hiện/ẩn khi sang khung giờ
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  const slot = useMemo(() => getCheckinSlot({ wakeUpTime: prefs?.wakeUpTime, sleepTime: prefs?.sleepTime, morningEnabled: prefs?.morningCheckinEnabled, eveningEnabled: prefs?.eveningReviewEnabled }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs?.wakeUpTime, prefs?.sleepTime, prefs?.morningCheckinEnabled, prefs?.eveningReviewEnabled, tick]);

  const kind: CheckinKind | null = slot?.kind ?? (forced === 'morning' || forced === 'evening' ? forced : null);
  const date = slot?.date ?? getTodayDateString();
  const rec = kind ? get(date, kind) : undefined;
  const intention = intentions.find((i) => i.date === date);
  const yEvening = kind === 'morning' ? get(prevDay(date), 'evening') : undefined;

  const [open, setOpen] = useState(false); // đang sửa bản đã lưu
  const [later, setLater] = useState(false);
  const [energy, setEnergy] = useState<number | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!kind) return;
    setLater(sessionStorage.getItem(laterKey(date, kind)) === '1' && forced !== kind);
    setEnergy(rec?.energy ?? null);
    setF(kind === 'morning'
      ? { mainGoal: rec?.data.mainGoal || intention?.intention || yEvening?.data.tomorrowFocus || '', avoidItem: rec?.data.avoidItem || '' }
      : { completedWell: rec?.data.completedWell || '', gratitude: rec?.data.gratitude || '', tomorrowFocus: rec?.data.tomorrowFocus || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, date, rec?.updatedAt, yEvening?.updatedAt]);

  if (!kind) return null;
  if (rec?.status === 'skipped' && forced !== kind) return null;
  if (later && !rec) return null;

  const isMorning = kind === 'morning';
  const Icon = isMorning ? Sun : Moon;
  const clearForced = () => { if (forced) { params.delete('checkin'); setParams(params, { replace: true }); } };

  // Đã check-in → 1 dòng tóm tắt
  if (rec?.status === 'done' && !open) {
    const e = ENERGY.find((x) => x.v === rec.energy);
    const text = isMorning ? rec.data.mainGoal : rec.data.gratitude || rec.data.completedWell || rec.data.tomorrowFocus;
    return (
      <button onClick={() => setOpen(true)} className={cn('w-full flex items-center gap-3 rounded-[20px] border border-border/60 bg-card px-3.5 py-2.5 text-left hover:bg-secondary/40', className)}>
        <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', isMorning ? 'bg-[#FFF3D6] dark:bg-amber-500/15' : 'bg-lavender dark:bg-primary/15')}><Icon className={cn('h-4 w-4', isMorning ? 'text-[#E8961C]' : 'text-primary')} /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] text-muted-foreground">{isMorning ? 'Đã check-in sáng' : 'Đã review tối'}{e && ` · ${e.e} ${e.l}`}</span>
          {text && <span className="block text-[13.5px] font-semibold truncate">{isMorning ? `🎯 ${text}` : text}</span>}
        </span>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
    );
  }

  const submit = async (status: 'done' | 'skipped') => {
    const data = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    if (status === 'done' && !isMorning) Object.assign(data, { tasksDone: summary.tasksDone, habitsDone: summary.habitsDone });
    const r: CheckinRecord = { date, kind, status, energy: status === 'done' ? energy ?? 3 : null, data };
    const ok = await save(r);
    if (status === 'done' && isMorning && data.mainGoal) {
      if (!intention) addDailyIntention(data.mainGoal);
      else if (intention.intention !== data.mainGoal && !intention.completed) updateDailyIntention(intention.id, { intention: data.mainGoal });
    }
    setOpen(false); clearForced();
    if (status === 'skipped') toast('Đã bỏ qua hôm nay', { description: isMorning ? 'Hẹn bạn sáng mai nhé' : 'Ngủ ngon nhé 🌙' });
    else toast.success(isMorning ? 'Đã check-in — chúc ngày mới hiệu quả!' : 'Đã review — ngủ ngon nhé 🌙', ok ? undefined : { description: 'Đã lưu trên máy, sẽ đồng bộ sau' });
  };
  const doLater = () => { sessionStorage.setItem(laterKey(date, kind), '1'); setLater(true); setOpen(false); clearForced(); };
  const input = (k: string, label: string, ph: string, area = false) => (
    <label className="block">
      <span className="block text-[12px] font-semibold mb-1">{label}</span>
      {area
        ? <textarea rows={2} className={cn(areaCls, 'min-h-0')} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} />
        : <input className={fieldCls} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} />}
    </label>
  );

  return (
    <Surface className={cn('p-4 overflow-hidden', isMorning ? 'bg-gradient-to-br from-[#FFF8E6] to-card dark:from-amber-500/10' : 'bg-gradient-to-br from-[#EFEBFF] to-card dark:from-primary/15', className)}>
      <div className="flex items-start gap-3">
        <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center shrink-0', isMorning ? 'bg-[#FFE9B8] dark:bg-amber-500/20' : 'bg-[#E3DCFF] dark:bg-primary/20')}><Icon className={cn('h-5 w-5', isMorning ? 'text-[#E8961C]' : 'text-primary')} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold leading-tight">{isMorning ? 'Năng lượng sáng nay thế nào?' : 'Hôm nay của bạn thế nào?'}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{isMorning ? 'Check-in 1 phút để định hướng ngày' : `Xong ${summary.tasksDone}/${summary.tasksTotal} việc · ${summary.habitsDone}/${summary.habitsTotal} thói quen`}{slot && ` · mở đến ${slot.until}`}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 mt-3">
        {ENERGY.map((x) => (
          <button key={x.v} type="button" onClick={() => setEnergy(x.v)} aria-pressed={energy === x.v}
            className={cn('rounded-2xl py-2 flex flex-col items-center gap-0.5 transition-all', energy === x.v ? 'bg-card ring-2 ring-primary shadow-soft scale-[1.03]' : 'bg-card/70 hover:bg-card')}>
            <span className="text-[22px] leading-none">{x.e}</span><span className="text-[10.5px] font-semibold text-muted-foreground">{x.l}</span>
          </button>
        ))}
      </div>

      {energy !== null && (
        <div className="mt-3 space-y-2.5 animate-fade-in">
          {isMorning ? (
            <>
              {input('mainGoal', 'Điều quan trọng nhất hôm nay', 'Làm xong điều này là ngày đã ổn…')}
              {!f.mainGoal && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">{suggestions.slice(0, 3).map((s) => <button key={s} type="button" onClick={() => setF({ ...f, mainGoal: s })} className="max-w-full truncate rounded-full bg-card border border-border/60 px-2.5 py-1 text-[12px]">{s}</button>)}</div>
              )}
              {yEvening?.data.tomorrowFocus && f.mainGoal === yEvening.data.tomorrowFocus && <p className="text-[11.5px] text-muted-foreground">Gợi ý từ review tối qua của bạn</p>}
              {input('avoidItem', 'Cần tránh (tuỳ chọn)', 'VD: lướt mạng quá 30 phút')}
            </>
          ) : (
            <>
              {input('completedWell', 'Hôm nay làm tốt điều gì?', 'Một điều nhỏ cũng được…', true)}
              {input('gratitude', 'Biết ơn điều gì?', 'Bữa cơm ngon, một lời hỏi thăm…')}
              {input('tomorrowFocus', 'Mai tập trung vào…', 'Sáng mai LIO sẽ gợi ý lại điều này')}
            </>
          )}
          <Button className="w-full h-11 rounded-full" onClick={() => submit('done')}>{isMorning ? 'Bắt đầu ngày mới' : 'Lưu & nghỉ ngơi'}</Button>
        </div>
      )}

      <div className="flex justify-center gap-1 mt-2 text-[12.5px] font-semibold text-muted-foreground">
        {rec ? <button className="px-3 py-1.5 rounded-full hover:bg-card" onClick={() => setOpen(false)}>Đóng</button> : <>
          <button className="px-3 py-1.5 rounded-full hover:bg-card" onClick={doLater}>Để sau</button>
          <span className="py-1.5">·</span>
          <button className="px-3 py-1.5 rounded-full hover:bg-card" onClick={() => submit('skipped')}>Bỏ qua hôm nay</button>
        </>}
      </div>
    </Surface>
  );
}
