import { useMemo, useState } from 'react';
import { Heart, ChevronDown, ChevronUp, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { getTodayDateString } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { LIFE_AREAS } from '@/types/lifeos';

export function HabitRescueCard() {
  const habits = useLifeOSStore((s) => s.habits);
  const { toggleHabitCompletion } = useSyncedStore();
  const todayStr = getTodayDateString();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const rescueHabits = useMemo(() => {
    const today = new Date();
    return habits
      .filter((h) => !h.archivedAt && !h.deletedAt && h.frequency === 'daily')
      .filter((h) => {
        // Check if missed 2-3+ consecutive days
        let missedDays = 0;
        for (let i = 1; i <= 4; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          if (!h.completedDates.includes(dateStr)) {
            missedDays++;
          } else {
            break;
          }
        }
        return missedDays >= 2 && !h.completedDates.includes(todayStr);
      })
      .filter((h) => !dismissed.includes(h.id))
      .map((h) => {
        // Count consecutive missed days
        let missedDays = 0;
        for (let i = 1; i <= 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          if (!h.completedDates.includes(dateStr)) {
            missedDays++;
          } else {
            break;
          }
        }
        return { ...h, missedDays };
      })
      .sort((a, b) => b.missedDays - a.missedDays);
  }, [habits, todayStr, dismissed]);

  if (rescueHabits.length === 0) return null;

  const visibleHabits = expanded ? rescueHabits : rescueHabits.slice(0, 2);

  return (
    <Card className="border-rose-400/25 bg-gradient-to-br from-rose-50/40 via-background to-pink-50/20 dark:from-rose-950/15 dark:to-pink-950/10">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-400/20 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold">Habit cần cứu</span>
            <p className="text-[10px] text-muted-foreground">Thử phiên bản nhỏ nhất hôm nay?</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {visibleHabits.map((habit) => {
            const area = LIFE_AREAS.find((a) => a.id === habit.area);
            return (
              <div key={habit.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/80 border border-border/50">
                <span className="text-sm">{area?.icon || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{habit.name}</p>
                  <p className="text-[10px] text-destructive">
                    Miss {habit.missedDays} ngày
                    {habit.minimumVersion && (
                      <span className="text-muted-foreground"> · Min: {habit.minimumVersion}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => setDismissed((prev) => [...prev, habit.id])}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 text-[10px] px-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-300"
                    onClick={() => {
                      toggleHabitCompletion(habit.id, todayStr);
                      toast.success(habit.minimumVersion
                        ? `${habit.minimumVersion} - hoàn thành!`
                        : `${habit.name} - quay lại rồi!`
                      );
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    {habit.minimumVersion ? 'Min' : 'Done'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {rescueHabits.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-6 text-[10px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {expanded ? 'Thu gọn' : `+${rescueHabits.length - 2} habit khác`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
