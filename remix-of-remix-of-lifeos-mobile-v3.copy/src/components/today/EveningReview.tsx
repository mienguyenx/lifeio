import { useState } from 'react';
import { Moon, Send, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString } from '@/utils/dateUtils';
import { toast } from 'sonner';

const ENERGY_LEVELS = [
  { value: 1 as const, emoji: '😴' },
  { value: 2 as const, emoji: '😕' },
  { value: 3 as const, emoji: '😐' },
  { value: 4 as const, emoji: '😊' },
  { value: 5 as const, emoji: '🔥' },
];

interface EveningReviewProps {
  onComplete?: () => void;
}

export function EveningReview({ onComplete }: EveningReviewProps) {
  const addEveningReview = useLifeOSStore((s) => s.addEveningReview);
  const eveningReviews = useLifeOSStore((s) => s.eveningReviews);
  const todayStr = getTodayDateString();

  const todayReview = eveningReviews.find((r) => r.date === todayStr);
  const hour = new Date().getHours();
  const isEvening = hour >= 19 || hour < 4;

  const [step, setStep] = useState(0);
  const [completedWell, setCompletedWell] = useState('');
  const [couldImprove, setCouldImprove] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [dismissed, setDismissed] = useState(false);

  // Only show in the evening and if not already reviewed
  if (!isEvening || todayReview || dismissed) return null;

  const handleSubmit = () => {
    if (!completedWell.trim()) {
      toast.error('Ghi ít nhất 1 điều làm tốt hôm nay');
      return;
    }
    addEveningReview({
      date: todayStr,
      completedWell: completedWell.trim(),
      couldImprove: couldImprove.trim(),
      gratitude: gratitude.trim(),
      tomorrowFocus: tomorrowFocus.trim() || undefined,
      energyLevel: energy,
    });
    toast.success('Review tối hoàn thành! Ngủ ngon nhé!');
    onComplete?.();
  };

  return (
    <Card className="border-indigo-400/30 bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-400/20 flex items-center justify-center">
              <Moon className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <span className="text-sm font-semibold">Review buổi tối</span>
              <p className="text-[10px] text-muted-foreground">5 phút nhìn lại ngày hôm nay</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDismissed(true)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {step === 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Năng lượng cuối ngày?</label>
            <div className="flex gap-1.5">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => { setEnergy(level.value); setStep(1); }}
                  className={cn(
                    'flex-1 flex flex-col items-center py-2.5 rounded-lg transition-all',
                    energy === level.value
                      ? 'bg-indigo-500/15 ring-1 ring-indigo-500 scale-105'
                      : 'bg-secondary/50 hover:bg-secondary'
                  )}
                >
                  <span className="text-xl">{level.emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium">Hôm nay mình làm tốt điều gì?</label>
            <Textarea
              placeholder="VD: Hoàn thành deadline, tập thể dục, kiên nhẫn với đồng nghiệp..."
              value={completedWell}
              onChange={(e) => setCompletedWell(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              autoFocus
            />
            <Button size="sm" className="w-full h-8 text-xs" onClick={() => completedWell.trim() && setStep(2)} disabled={!completedWell.trim()}>
              Tiếp
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium">Điều gì có thể cải thiện?</label>
            <Textarea
              placeholder="VD: Quản lý thời gian tốt hơn, ít phân tâm hơn..."
              value={couldImprove}
              onChange={(e) => setCouldImprove(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => setStep(3)}>Bỏ qua</Button>
              <Button size="sm" className="h-8 text-xs flex-1" onClick={() => setStep(3)}>Tiếp</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium">1 điều biết ơn hôm nay?</label>
            <Input
              placeholder="VD: Được bạn giúp đỡ, trời đẹp, cơm ngon..."
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
            <label className="text-xs font-medium mt-2">Ngày mai tập trung vào? (tùy chọn)</label>
            <Input
              placeholder="1 điều chính cho ngày mai..."
              value={tomorrowFocus}
              onChange={(e) => setTomorrowFocus(e.target.value)}
              className="h-9 text-sm"
            />
            <Button size="sm" className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSubmit}>
              <Moon className="w-3.5 h-3.5 mr-1.5" /> Hoàn thành review tối
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
                s <= step ? 'bg-indigo-500' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
