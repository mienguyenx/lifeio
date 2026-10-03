import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { format, addDays, endOfWeek } from 'date-fns';
import { Check, ChevronLeft, Mic, Sparkles, Plus, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/brand/Mascot';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { TINTS } from '@/components/lio';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { usePreferencesSync } from '@/hooks/sync/usePreferencesSync';
import { useVoiceInput, voiceSupport } from '@/features/ai-coach/voice/speech';
import { MODULES, type ModuleId } from '@/lib/modules';
import type { LifeArea, UserPreferences } from '@/types/lifeos';
import { fetchOnboardingPlan, type OnboardingPlan, type PlanHabit, type PlanTask, type When } from './onboardingPlan';

/**
 * Onboarding AI — người dùng kể nhu cầu (gõ hoặc nói) → LIO gợi ý tính năng, việc, thói quen,
 * trọng tâm → người dùng chọn → tạo dữ liệu & bật đúng tính năng. Bản nháp lưu localStorage
 * để tải lại trang không mất tiến độ.
 */
interface OnboardingWizardProps { onComplete: () => void }

const DRAFT_KEY = 'lio-onboarding-draft';
const EXAMPLES = [
  'Mình hay quên việc, muốn sắp xếp công việc mỗi ngày',
  'Muốn ngủ sớm, tập thể dục và uống đủ nước',
  'Muốn quản lý chi tiêu và tiết kiệm mỗi tháng',
  'Ôn thi IELTS trong 3 tháng tới',
  'Hay căng thẳng, muốn sống chậm lại',
];
const WHEN_LABEL: Record<When, string> = { today: 'Hôm nay', tomorrow: 'Ngày mai', week: 'Tuần này', none: 'Không hạn' };
const TOD_LABEL: Record<PlanHabit['timeOfDay'], string> = { morning: 'Buổi sáng', afternoon: 'Buổi chiều', evening: 'Buổi tối', anytime: 'Bất kỳ lúc nào' };
const TOD_TIME: Record<PlanHabit['timeOfDay'], string | undefined> = { morning: '07:30', afternoon: '13:00', evening: '21:00', anytime: undefined };

type Step = 'need' | 'thinking' | 'pick' | 'creating' | 'done';
interface Draft { step: Step; text: string; plan: OnboardingPlan | null; mods: ModuleId[]; tasks: number[]; habits: number[]; focus: string }
const loadDraft = (): Draft | null => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } };

const dueOf = (w: When) => {
  const d = new Date();
  if (w === 'today') return format(d, 'yyyy-MM-dd');
  if (w === 'tomorrow') return format(addDays(d, 1), 'yyyy-MM-dd');
  if (w === 'week') return format(endOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return undefined;
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const setUserPreferences = useLifeOSStore((s) => s.setUserPreferences);
  const prefs = useLifeOSStore((s) => s.userPreferences);
  const synced = useSyncedStore();
  const { saveOnboardingCompleted } = usePreferencesSync();

  const draft = useMemo(loadDraft, []);
  const [step, setStep] = useState<Step>(draft?.step === 'pick' && draft.plan ? 'pick' : 'need');
  const [text, setText] = useState(draft?.text ?? '');
  const [plan, setPlan] = useState<OnboardingPlan | null>(draft?.plan ?? null);
  const [mods, setMods] = useState<ModuleId[]>(draft?.mods ?? []);
  const [taskSel, setTaskSel] = useState<number[]>(draft?.tasks ?? []);
  const [habitSel, setHabitSel] = useState<number[]>(draft?.habits ?? []);
  const [focus, setFocus] = useState(draft?.focus ?? '');
  const [showAll, setShowAll] = useState(false);
  const [created, setCreated] = useState({ tasks: 0, habits: 0 });
  const [saved, setSaved] = useState<Partial<UserPreferences> | null>(null);

  useEffect(() => {
    if (step === 'creating' || step === 'done') return localStorage.removeItem(DRAFT_KEY);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, text, plan, mods, tasks: taskSel, habits: habitSel, focus } satisfies Draft));
  }, [step, text, plan, mods, taskSel, habitSel, focus]);

  const [base, setBase] = useState('');
  const voice = useVoiceInput({ keepAlive: true, silenceMs: 6000, maxMs: 180000, onFinal: (t) => setText(`${base} ${t}`.trim()), onError: (m) => toast.error(m) });
  const canVoice = voiceSupport().native || voiceSupport().recorder;
  const shownText = voice.listening ? `${base} ${voice.interim}`.trim() : text;
  const toggleMic = () => { if (voice.listening) return voice.stop(); setBase(text.trim()); void voice.start(); };

  const suggest = async () => {
    if (!text.trim()) return;
    setStep('thinking');
    const p = await fetchOnboardingPlan(text.trim());
    setPlan(p);
    setMods(p.modules.map((m) => m.id));
    setTaskSel(p.tasks.map((_, i) => i));
    setHabitSel(p.habits.map((_, i) => i));
    setFocus(p.focus);
    setStep('pick');
  };

  const toggle = <X,>(arr: X[], x: X) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

  const finish = async (skip = false) => {
    setStep('creating');
    const tasks: PlanTask[] = skip || !plan ? [] : plan.tasks.filter((_, i) => taskSel.includes(i));
    const habits: PlanHabit[] = skip || !plan ? [] : plan.habits.filter((_, i) => habitSel.includes(i));
    try {
      for (const t of tasks) await synced.addTask({ title: t.title, priority: t.priority, status: 'todo', area: t.area, dueDate: dueOf(t.when) });
      for (const h of habits) await synced.addHabit({ name: h.name, icon: h.icon || undefined, area: h.area, frequency: 'daily', targetPerDay: h.target > 1 ? h.target : undefined, targetUnit: h.target > 1 ? h.unit : undefined, reminderTime: TOD_TIME[h.timeOfDay], reminderEnabled: false });
    } catch (e) {
      console.error('[onboarding] create failed', e);
      toast.error('Một vài mục chưa tạo được, bạn có thể thêm lại sau.');
    }
    const areas = [...new Set([...tasks.map((t) => t.area), ...habits.map((h) => h.area)])] as LifeArea[];
    const next: Partial<UserPreferences> = {
      archetype: prefs.archetype ?? 'beginner',
      aiTone: prefs.aiTone ?? 'gentle',
      planningStyle: prefs.planningStyle ?? 'checklist',
      lifeAreaPriorities: areas.length ? areas : ['health', 'career', 'learning'],
      enabledModules: skip ? ['calendar', 'notes', 'goals', 'journal'] : mods,
      onboardingNeed: text.trim() || undefined,
      onboardingFocus: skip ? undefined : focus.trim() || undefined,
      onboardingCompleted: true,
    };
    await saveOnboardingCompleted(next);
    setCreated({ tasks: tasks.length, habits: habits.length });
    setSaved(next);
    if (skip) return enter(next);
    setStep('done');
  };

  const enter = (p?: Partial<UserPreferences>) => {
    localStorage.removeItem(DRAFT_KEY);
    setUserPreferences(p ?? saved ?? { onboardingCompleted: true });
    toast.success('Chào mừng bạn đến với LifeOS!');
    onComplete();
  };

  const card = 'w-full max-w-[560px] rounded-[28px] bg-card border border-border/60 shadow-card p-5 sm:p-7 animate-fade-in';
  const check = (on: boolean) => (
    <span className={cn('h-6 w-6 rounded-full grid place-items-center shrink-0 transition-colors', on ? 'bg-primary text-primary-foreground' : 'border-2 border-border')}>{on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
  );
  const others = MODULES.filter((m) => !plan?.modules.some((x) => x.id === m.id));

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        {step === 'need' && (
          <div className={card}>
            <div className="text-center">
              <Mascot name="taro" pose="go" size={110} float className="mx-auto" />
              <h2 className="mt-3 text-[21px] font-extrabold leading-tight">Bạn đang cần LifeOS giúp gì?</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">Kể tự nhiên như nói với bạn bè. LIO sẽ gợi ý việc cần làm, thói quen và các tính năng vừa đủ cho bạn.</p>
            </div>
            <div className="mt-5 relative">
              <textarea
                value={shownText}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="VD: Mình mới đi làm, hay quên việc và muốn tiết kiệm được tiền mỗi tháng…"
                className="w-full rounded-[20px] border border-border/70 bg-secondary/40 px-4 py-3.5 pr-14 text-[15px] leading-relaxed outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                autoFocus
              />
              {canVoice && (
                <button onClick={toggleMic} aria-label={voice.listening ? 'Dừng nói' : 'Nói'} className={cn('absolute right-2.5 bottom-3.5 h-10 w-10 rounded-full grid place-items-center transition-all', voice.listening ? 'bg-destructive text-white animate-pulse' : 'bg-primary/10 text-primary')}>
                  {voice.state === 'transcribing' ? <Loader2 className="h-4 w-4 animate-spin" /> : voice.listening ? <Square className="h-4 w-4" /> : <Mic className="h-[18px] w-[18px]" />}
                </button>
              )}
            </div>
            {voice.listening && <p className="mt-2 text-[12px] text-primary font-medium flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />Đang nghe… cứ nói thoải mái, bấm ■ khi xong</p>}
            <p className="mt-4 mb-2 text-[12px] font-semibold text-muted-foreground">Hoặc chọn nhanh</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => setText((t) => (t.includes(e) ? t : `${t.trim()}${t.trim() ? '. ' : ''}${e}`))} className="px-3 py-2 rounded-2xl bg-lavender dark:bg-primary/15 text-primary text-[12.5px] font-medium text-left leading-snug">{e}</button>
              ))}
            </div>
            <Button onClick={suggest} disabled={!text.trim() || voice.listening} className="mt-6 w-full h-12 rounded-full shadow-soft text-[14.5px] gap-1.5"><Sparkles className="w-4 h-4" />Gợi ý cho tôi</Button>
            <button onClick={() => void finish(true)} className="mt-3 w-full text-[13px] text-muted-foreground font-medium py-2">Bỏ qua, tôi tự khám phá</button>
          </div>
        )}

        {(step === 'thinking' || step === 'creating') && (
          <div className={cn(card, 'text-center py-10')}>
            <Mascot name="ori" pose={step === 'thinking' ? 'idea' : 'explore'} size={130} float className="mx-auto" />
            <h2 className="mt-4 text-[19px] font-extrabold">{step === 'thinking' ? 'LIO đang thiết kế không gian cho bạn…' : 'Đang tạo không gian của bạn…'}</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{step === 'thinking' ? 'Chọn việc, thói quen và tính năng phù hợp' : 'Thêm việc, thói quen và bật tính năng'}</p>
            <div className="mt-5 flex justify-center gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
          </div>
        )}

        {step === 'pick' && plan && (
          <div className={card}>
            <div className="flex items-start gap-3">
              <button onClick={() => setStep('need')} aria-label="Quay lại" className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><ChevronLeft className="h-4 w-4" /></button>
              <div className="min-w-0">
                <h2 className="text-[19px] font-extrabold leading-tight">Gợi ý dành cho bạn</h2>
                <p className="mt-1 text-[12.5px] text-muted-foreground leading-snug">{plan.summary || 'Bỏ chọn những gì bạn chưa cần — có thể thêm lại bất cứ lúc nào.'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] bg-gradient-to-br from-primary/10 to-primary/[0.03] border border-primary/15 p-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-primary">🎯 Trọng tâm của bạn</p>
              <textarea value={focus} onChange={(e) => setFocus(e.target.value.replace(/\n/g, ''))} maxLength={80} rows={1} style={{ fieldSizing: 'content' } as CSSProperties} className="mt-1 w-full bg-transparent text-[16px] font-bold leading-snug outline-none resize-none" placeholder="VD: Không bỏ sót việc quan trọng" />
            </div>

            {plan.tasks.length > 0 && (
              <section className="mt-5">
                <p className="text-[13px] font-bold mb-2">Việc để bắt đầu <span className="text-muted-foreground font-medium">· {taskSel.length}/{plan.tasks.length}</span></p>
                <div className="space-y-1.5">
                  {plan.tasks.map((t, i) => (
                    <button key={i} onClick={() => setTaskSel((s) => toggle(s, i))} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all', taskSel.includes(i) ? 'border-primary/40 bg-primary/[0.04]' : 'border-border/60 opacity-60')}>
                      {check(taskSel.includes(i))}
                      <span className="flex-1 min-w-0 text-[13.5px] font-medium leading-snug">{t.title}</span>
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0', t.when === 'today' ? 'bg-[#FFF1E8] text-[#FF7A45]' : 'bg-secondary text-muted-foreground')}>{WHEN_LABEL[t.when]}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {plan.habits.length > 0 && (
              <section className="mt-5">
                <p className="text-[13px] font-bold mb-2">Thói quen nhỏ <span className="text-muted-foreground font-medium">· {habitSel.length}/{plan.habits.length}</span></p>
                <div className="space-y-1.5">
                  {plan.habits.map((h, i) => (
                    <button key={i} onClick={() => setHabitSel((s) => toggle(s, i))} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all', habitSel.includes(i) ? 'border-primary/40 bg-primary/[0.04]' : 'border-border/60 opacity-60')}>
                      {check(habitSel.includes(i))}
                      <span className="h-9 w-9 rounded-[12px] bg-[#E6F8F1] dark:bg-[#57D3AE]/15 grid place-items-center text-[18px] shrink-0">{h.icon || '✨'}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-medium leading-snug">{h.name}</span>
                        <span className="block text-[11.5px] text-muted-foreground">{TOD_LABEL[h.timeOfDay]}{h.target > 1 ? ` · ${h.target} ${h.unit}/ngày` : ' · mỗi ngày'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-5">
              <p className="text-[13px] font-bold">Tính năng cho bạn</p>
              <p className="text-[11.5px] text-muted-foreground mb-2">Hôm nay, Công việc, Thói quen và AI Coach luôn có sẵn.</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[...plan.modules.map((m) => ({ def: MODULES.find((x) => x.id === m.id)!, reason: m.reason })).filter((x) => x.def), ...(showAll ? others.map((def) => ({ def, reason: def.desc })) : [])].map(({ def, reason }) => {
                  const on = mods.includes(def.id);
                  return (
                    <button key={def.id} onClick={() => setMods((s) => toggle(s, def.id))} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all', on ? 'border-primary/40 bg-primary/[0.04]' : 'border-border/60')}>
                      <span className={cn('h-9 w-9 rounded-[12px] grid place-items-center shrink-0', TINTS[def.tint].bg)}><LifeIcon name={def.icon} size={20} color={TINTS[def.tint].fg} /></span>
                      <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-semibold">{def.label}</span><span className="block text-[11.5px] text-muted-foreground leading-snug">{reason}</span></span>
                      <span className={cn('h-6 w-11 rounded-full p-0.5 transition-colors shrink-0', on ? 'bg-primary' : 'bg-border')}><span className={cn('block h-5 w-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} /></span>
                    </button>
                  );
                })}
              </div>
              {!showAll && others.length > 0 && (
                <button onClick={() => setShowAll(true)} className="mt-2 w-full h-10 rounded-2xl border border-dashed border-border text-[12.5px] font-semibold text-muted-foreground flex items-center justify-center gap-1.5"><Plus className="h-4 w-4" />Xem thêm {others.length} tính năng</button>
              )}
            </section>

            <div className="sticky bottom-0 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 mt-5 px-5 sm:px-7 pb-5 sm:pb-7 pt-3 bg-gradient-to-t from-card via-card to-card/0 rounded-b-[28px]">
              <Button onClick={() => void finish()} className="w-full h-12 rounded-full shadow-soft text-[14.5px] gap-1.5"><Check className="w-4 h-4" />Tạo không gian của tôi</Button>
              <p className="mt-2 text-center text-[11.5px] text-muted-foreground">{taskSel.length} việc · {habitSel.length} thói quen · {mods.length + 4} tính năng</p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className={cn(card, 'text-center py-6')}>
            <Mascot name="mochi" pose="celebrate" size={140} float className="mx-auto" />
            <h2 className="mt-3 text-[23px] font-extrabold">Không gian đã sẵn sàng! 🎉</h2>
            {focus.trim() && <p className="mt-1 text-[13.5px] text-muted-foreground">Trọng tâm: <b className="text-foreground">{focus.trim()}</b></p>}
            <ul className="mt-5 space-y-2 text-left max-w-[300px] mx-auto text-[13px]">
              {[`${created.tasks} việc đã thêm vào danh sách`, `${created.habits} thói quen đã tạo`, `${mods.length} tính năng đã bật thêm`].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#E8FBF4] text-[#22B07D] grid place-items-center"><Check className="h-3 w-3" /></span>{t}</li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] text-muted-foreground">Muốn thêm tính năng khác? Vào <b>Menu → Tính năng</b> bất cứ lúc nào.</p>
            <Button onClick={() => enter()} className="mt-5 w-full h-12 rounded-full shadow-soft text-[14.5px]">Bắt đầu ngày đầu tiên</Button>
          </div>
        )}
      </div>
    </div>
  );
}
