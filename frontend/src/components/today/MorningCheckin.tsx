import { useState } from 'react';
import { Sun, Send, Battery, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString } from '@/utils/dateUtils';
import { toast } from 'sonner';

const ENERGY_LEVELS = [
  { value: 1 as const, label: 'Mệt', emoji: '😴' },
  { value: 2 as const, label: 'Thấp', emoji: '😕' },
  { value: 3 as const, label: 'Ổn', emoji: '😐' },
  { value: 4 as const, label: 'Tốt', emoji: '😊' },
  { value: 5 as const, label: 'Tràn', emoji: '🔥' },
];

interface MorningCheckinProps {
  onComplete?: () => void;
}

export function MorningCheckin({ onComplete }: MorningCheckinProps) {
  const addMorningCheckin = useLifeOSStore((s) => s.addMorningCheckin);
  const morningCheckins = useLifeOSStore((s) => s.morningCheckins);
  const todayStr = getTodayDateString();

  const todayCheckin = morningCheckins.find((c) => c.date === todayStr);

  const [step, setStep] = useState(0);
  const [mainGoal, setMainGoal] = useState('');
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [task3, setTask3] = useState('');
  const [avoidItem, setAvoidItem] = useState('');
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [dismissed, setDismissed] = useState(false);

  if (todayCheckin || dismissed) return null;

  const handleSubmit = () => {
    const top3 = [task1, task2, task3].filter(Boolean);
    if (!mainGoal.trim()) {
      toast.error('Nhập mục tiêu chính hôm nay');
      return;
    }
    addMorningCheckin({
      date: todayStr,
      mainGoal: mainGoal.trim(),
      top3Tasks: top3,
      avoidItem: avoidItem.trim() || undefined,
      energyLevel: energy,
    });
    toast.success('Check-in sáng hoàn thành!');
    onComplete?.();
  };

  return (
    <Card className="border-amber-400/30 bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-semibold">Check-in buổi sáng</span>
              <p className="text-[10px] text-muted-foreground">3 phút để định hướng ngày mới</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDismissed(true)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {step === 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Năng lượng lúc này?</label>
            <div className="flex gap-1.5">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => { setEnergy(level.value); setStep(1); }}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all text-xs',
                    energy === level.value
                      ? 'bg-primary/15 ring-1 ring-primary scale-105'
                      : 'bg-secondary/50 hover:bg-secondary'
                  )}
                >
                  <span className="text-base">{level.emoji}</span>
                  <span className="text-[10px]">{level.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium">Mục tiêu chính hôm nay?</label>
            <div className="flex gap-2">
              <Input
                placeholder="Điều quan trọng nhất hôm nay..."
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mainGoal.trim() && setStep(2)}
                className="h-9 text-sm"
                autoFocus
              />
              <Button size="sm" className="h-9" onClick={() => mainGoal.trim() && setStep(2)} disabled={!mainGoal.trim()}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium">3 việc quan trọng (tùy chọn):</label>
            <div className="space-y-1.5">
              <Input placeholder="1. Việc quan trọng nhất" value={task1} onChange={(e) => setTask1(e.target.value)} className="h-8 text-xs" autoFocus />
              <Input placeholder="2. Việc thứ hai" value={task2} onChange={(e) => setTask2(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="3. Việc thứ ba" value={task3} onChange={(e) => setTask3(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => setStep(3)}>
                Bỏ qua
              </Button>
              <Button size="sm" className="h-8 text-xs flex-1" onClick={() => setStep(3)}>
                Tiếp
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium">Hôm nay cần tránh điều gì? (tùy chọn)</label>
            <Input
              placeholder="VD: Lướt mạng xã hội quá 30 phút..."
              value={avoidItem}
              onChange={(e) => setAvoidItem(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
            <Button size="sm" className="w-full h-9" onClick={handleSubmit}>
              <Sun className="w-3.5 h-3.5 mr-1.5" /> Bắt đầu ngày mới!
            </Button>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 pt-1">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                s <= step ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
