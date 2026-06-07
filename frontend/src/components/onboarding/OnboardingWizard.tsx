import { useState } from 'react';
import { Rocket, Sun, Moon, Zap, Brain, Target, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    };
    setUserPreferences(prefs);
    saveOnboardingCompleted(prefs);
    toast.success('Chào mừng bạn đến với LifeOS!');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="flex gap-1.5 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn(
              'h-1 rounded-full transition-all duration-300',
              i <= step ? 'w-10 bg-primary' : 'w-6 bg-muted'
            )} />
          ))}
        </div>

        {/* Step 0: Welcome + Name */}
        {step === 0 && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Chào mừng đến LifeOS</h2>
            <p className="text-muted-foreground text-sm">Hệ điều hành cuộc sống cá nhân của bạn. Trả lời vài câu hỏi để thiết lập.</p>
            <Input
              placeholder="Tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-center text-lg max-w-xs mx-auto"
              autoFocus
            />
            <Button onClick={() => setStep(1)} className="w-48 h-11 gap-2" disabled={!name.trim()}>
              Bắt đầu <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Archetype */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold">Bạn thuộc nhóm nào?</h2>
              <p className="text-sm text-muted-foreground">Giúp AI đưa gợi ý phù hợp</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ARCHETYPES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setArchetype(a.value)}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left',
                    archetype === a.value ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className="text-xl">{a.emoji}</span>
                  <div>
                    <p className="text-xs font-medium">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>Quay lại</Button>
              <Button onClick={() => setStep(2)} className="gap-1">Tiếp <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 2: AI Tone + Planning */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold">Phong cách coaching</h2>
            </div>
            <div>
              <p className="text-xs font-medium mb-2 flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> AI nói chuyện kiểu gì?</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAiTone(t.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs transition-all',
                      aiTone === t.value ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/40'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Cách bạn lập kế hoạch?</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setPlanningStyle(s.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs transition-all',
                      planningStyle === s.value ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/40'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
              <Button onClick={() => setStep(3)} className="gap-1">Tiếp <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold">Lịch trình của bạn</h2>
            </div>
            <div className="flex gap-4 justify-center">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-amber-400/15 flex items-center justify-center mx-auto">
                  <Sun className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-xs font-medium">Thức dậy</p>
                <Input type="time" value={wakeUp} onChange={(e) => setWakeUp(e.target.value)} className="h-9 text-sm w-32" />
              </div>
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-400/15 flex items-center justify-center mx-auto">
                  <Moon className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-xs font-medium">Đi ngủ</p>
                <Input type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} className="h-9 text-sm w-32" />
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setStep(2)}>Quay lại</Button>
              <Button onClick={() => setStep(4)} className="gap-1">Tiếp <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Life Area Priorities */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold">Ưu tiên cuộc sống</h2>
              <p className="text-sm text-muted-foreground">Chọn 3-5 mảng quan trọng nhất</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {LIFE_AREAS.map((area) => {
                const idx = areas.indexOf(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all text-sm',
                      idx >= 0 ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/40 opacity-60'
                    )}
                  >
                    <span>{area.icon}</span>
                    <span className="font-medium text-xs">{area.name}</span>
                    {idx >= 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">{idx + 1}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setStep(3)}>Quay lại</Button>
              <Button onClick={handleFinish} className="gap-1.5" disabled={areas.length === 0}>
                <Check className="w-4 h-4" /> Hoàn thành
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
