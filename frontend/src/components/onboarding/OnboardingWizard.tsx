import { useState } from 'react';
import { Sun, Moon, Brain, Target, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Mascot, type MascotName } from '@/components/brand/Mascot';
import { Field, fieldCls } from '@/components/lio/form';
import { ProgressBar } from '@/components/lio';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import type { AITone, PlanningStyle, UserArchetype, LifeArea } from '@/types/lifeos';
import { toast } from 'sonner';
import { usePreferencesSync } from '@/hooks/sync/usePreferencesSync';

const ARCHETYPES: { value: UserArchetype; emoji: string; label: string; desc: string }[] = [
  { value: 'beginner', emoji: '🌱', label: 'Người mới', desc: 'Mới bắt đầu tổ chức cuộc sống' },
  { value: 'busy_professional', emoji: '💼', label: 'Dân công sở', desc: 'Cần tối ưu thời gian' },
  { value: 'builder', emoji: '🏗️', label: 'Người xây dựng', desc: 'Có mục tiêu lớn' },
  { value: 'student', emoji: '📚', label: 'Sinh viên', desc: 'Học tập & phát triển' },
  { value: 'health_focused', emoji: '💪', label: 'Sức khỏe', desc: 'Ưu tiên thể chất' },
  { value: 'recovery', emoji: '🌿', label: 'Phục hồi', desc: 'Lấy lại nhịp sống' },
  { value: 'reflective', emoji: '🔮', label: 'Chiêm nghiệm', desc: 'Journal & review' },
];

const TONES: { value: AITone; label: string }[] = [
  { value: 'gentle', label: '🤗 Nhẹ nhàng' },
  { value: 'direct', label: '🎯 Thẳng thắn' },
  { value: 'strategic', label: '🧠 Chiến lược' },
  { value: 'concise', label: '⚡ Ngắn gọn' },
  { value: 'detailed', label: '📖 Chi tiết' },
];

const STYLES: { value: PlanningStyle; label: string }[] = [
  { value: 'deep_work', label: '🧘 Deep Work' },
  { value: 'sprint', label: '🏃 Sprint' },
  { value: 'checklist', label: '✅ Checklist' },
  { value: 'calendar', label: '📅 Calendar' },
  { value: 'flexible', label: '🌊 Linh hoạt' },
];

/** Module 17 — Onboarding 5 bước (LIO kit). Dữ liệu & cách lưu giữ nguyên: setUser, setUserPreferences, saveOnboardingCompleted. */
interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const setUserPreferences = useLifeOSStore((s) => s.setUserPreferences);
  const setUser = useLifeOSStore((s) => s.setUser);
  const { saveOnboardingCompleted } = usePreferencesSync();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState<UserArchetype>('beginner');
  const [aiTone, setAiTone] = useState<AITone>('gentle');
  const [planningStyle, setPlanningStyle] = useState<PlanningStyle>('checklist');
  const [wakeUp, setWakeUp] = useState('07:00');
  const [sleep, setSleep] = useState('23:00');
  const [areas, setAreas] = useState<LifeArea[]>([]);

  const totalSteps = 5;

  const toggleArea = (area: LifeArea) => {
    setAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  };

  const [savedPrefs, setSavedPrefs] = useState<Parameters<typeof setUserPreferences>[0] | null>(null);
  const handleFinish = () => {
    if (name.trim()) setUser({ name: name.trim() });
    const prefs = {
      archetype,
      aiTone,
      planningStyle,
      wakeUpTime: wakeUp,
      sleepTime: sleep,
      lifeAreaPriorities: areas.length > 0 ? areas : ['health', 'career', 'learning'],
      onboardingCompleted: true,
    } as Parameters<typeof setUserPreferences>[0];
    saveOnboardingCompleted(prefs);
    setSavedPrefs(prefs);
    setStep(totalSteps); // màn hình “Hoàn thành!”; store được cập nhật khi bấm “Vào ứng dụng” (TodayPage ẩn wizard theo store)
  };
  const enterApp = () => {
    if (savedPrefs) setUserPreferences(savedPrefs);
    toast.success('Chào mừng bạn đến với LifeOS!');
    onComplete();
  };

  const STEPS: { title: string; subtitle: string; mascot: MascotName; pose: string }[] = [
    { title: 'Chào mừng đến LifeOS! 👋', subtitle: 'Hệ điều hành cuộc sống cá nhân của bạn. Trả lời vài câu hỏi để thiết lập.', mascot: 'taro', pose: 'go' },
    { title: 'Bạn thuộc nhóm nào?', subtitle: 'Giúp AI đưa gợi ý phù hợp', mascot: 'ori', pose: 'explore' },
    { title: 'Phong cách coaching', subtitle: 'AI Coach sẽ trò chuyện và lập kế hoạch theo cách bạn thích', mascot: 'ori', pose: 'idea' },
    { title: 'Lịch trình của bạn', subtitle: 'Giờ thức dậy và đi ngủ để gợi ý đúng thời điểm', mascot: 'mochi', pose: 'rest' },
    { title: 'Ưu tiên cuộc sống', subtitle: 'Chọn 3–5 mảng quan trọng nhất', mascot: 'lumi', pose: 'happy' },
  ];
  const pill = (active: boolean) => cn('px-3.5 h-10 rounded-full border text-[13px] font-medium transition-all', active ? 'border-primary bg-primary/10 text-primary ring-4 ring-primary/10' : 'border-border/70 hover:border-primary/40');
  const canNext = step === 0 ? !!name.trim() : step === 4 ? areas.length > 0 : true;
  const next = () => (step === 4 ? handleFinish() : setStep(step + 1));
  const cur = STEPS[Math.min(step, 4)];

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-[560px] rounded-[28px] bg-card border border-border/60 shadow-card p-5 sm:p-7 animate-fade-in">
          {step < totalSteps ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                {step > 0 ? <button onClick={() => setStep(step - 1)} aria-label="Quay lại" className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><ChevronLeft className="h-4 w-4" /></button> : <span className="h-9 w-9" />}
                <ProgressBar value={((step + 1) / totalSteps) * 100} className="flex-1" height={6} />
                <span className="text-[12px] font-semibold text-muted-foreground tabular-nums w-9 text-right">{step + 1}/{totalSteps}</span>
              </div>
              <div className="text-center">
                <Mascot name={cur.mascot} pose={cur.pose} size={step === 0 ? 132 : 96} float className="mx-auto" />
                <h2 className="mt-3 text-[21px] font-extrabold leading-tight">{cur.title}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">{cur.subtitle}</p>
              </div>

              <div className="mt-5 min-h-[120px]">
                {step === 0 && (
                  <Field label="Tên của bạn" className="max-w-[340px] mx-auto">
                    <input placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()} className={cn(fieldCls, 'h-12 text-center text-[16px]')} autoFocus />
                  </Field>
                )}
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    {ARCHETYPES.map((a) => (
                      <button key={a.value} onClick={() => setArchetype(a.value)} className={cn('flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all', archetype === a.value ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border/70 hover:border-primary/40')}>
                        <span className="h-10 w-10 rounded-[13px] bg-secondary grid place-items-center text-[20px] shrink-0">{a.emoji}</span>
                        <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{a.label}</span><span className="block text-[11.5px] text-muted-foreground leading-snug">{a.desc}</span></span>
                        {archetype === a.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[12.5px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Brain className="w-4 h-4" /> AI nói chuyện kiểu gì?</p>
                      <div className="flex flex-wrap gap-2">{TONES.map((t) => <button key={t.value} onClick={() => setAiTone(t.value)} className={pill(aiTone === t.value)}>{t.label}</button>)}</div>
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Target className="w-4 h-4" /> Cách bạn lập kế hoạch?</p>
                      <div className="flex flex-wrap gap-2">{STYLES.map((s) => <button key={s.value} onClick={() => setPlanningStyle(s.value)} className={pill(planningStyle === s.value)}>{s.label}</button>)}</div>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="grid grid-cols-2 gap-3">
                    {[{ l: 'Thức dậy', v: wakeUp, set: setWakeUp, I: Sun, c: 'bg-[#FFF4D6] text-[#E5A100] dark:bg-amber-400/15' }, { l: 'Đi ngủ', v: sleep, set: setSleep, I: Moon, c: 'bg-lavender text-primary dark:bg-primary/15' }].map((x) => (
                      <div key={x.l} className="rounded-[22px] border border-border/70 p-4 text-center">
                        <span className={cn('h-11 w-11 rounded-[14px] grid place-items-center mx-auto', x.c)}><x.I className="h-5 w-5" /></span>
                        <p className="mt-2 text-[13px] font-semibold">{x.l}</p>
                        <input type="time" value={x.v} onChange={(e) => x.set(e.target.value)} className={cn(fieldCls, 'mt-2 text-center')} />
                      </div>
                    ))}
                  </div>
                )}
                {step === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LIFE_AREAS.map((area) => {
                      const idx = areas.indexOf(area.id);
                      return (
                        <button key={area.id} onClick={() => toggleArea(area.id)} className={cn('flex items-center gap-2.5 px-3 h-12 rounded-2xl border text-left transition-all', idx >= 0 ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border/70 hover:border-primary/40')}>
                          <span className="text-[18px]">{area.icon}</span>
                          <span className="flex-1 text-[13px] font-semibold truncate">{area.name}</span>
                          {idx >= 0 ? <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10.5px] font-bold grid place-items-center">{idx + 1}</span> : <span className="w-5 h-5 rounded-full border border-border" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button onClick={next} disabled={!canNext} className="mt-6 w-full h-12 rounded-full shadow-soft text-[14.5px] gap-1.5">
                {step === 4 ? <><Check className="w-4 h-4" />Hoàn thành</> : <>{step === 0 ? 'Bắt đầu' : 'Tiếp tục'} ({step + 1}/{totalSteps}) <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <Mascot name="mochi" pose="celebrate" size={150} float className="mx-auto" />
              <h2 className="mt-3 text-[24px] font-extrabold">Hoàn thành! 🎉</h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">Bạn đã sẵn sàng bắt đầu hành trình LifeOS{name.trim() ? `, ${name.trim()}` : ''}!</p>
              <ul className="mt-5 space-y-2 text-left max-w-[300px] mx-auto text-[13px]">
                {['Hồ sơ đã được thiết lập', 'Phong cách AI Coach đã chọn', `${areas.length} lĩnh vực ưu tiên đã lưu`].map((t) => (
                  <li key={t} className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#E8FBF4] text-[#22B07D] grid place-items-center"><Check className="h-3 w-3" /></span>{t}</li>
                ))}
              </ul>
              <Button onClick={enterApp} className="mt-6 w-full h-12 rounded-full shadow-soft text-[14.5px]">Vào ứng dụng</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
