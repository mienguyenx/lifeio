import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus, Lightbulb, Target, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Suggestion {
  type: 'habit' | 'task' | 'insight' | 'motivation';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  area?: string;
}

interface AISuggestionsCardProps {
  compact?: boolean;
}

export function AISuggestionsCard({ compact = false }: AISuggestionsCardProps) {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const isMobile = useIsMobile();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = () => {
    setIsLoading(true);
    
    const newSuggestions: Suggestion[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Analyze habits
    const lowStreakHabits = habits.filter(h => h.streak < 3 && h.streak > 0);
    const highStreakHabits = habits.filter(h => h.streak >= 7);
    const missedYesterday = habits.filter(h => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return !h.completedDates.includes(yesterday.toISOString().split('T')[0]);
    });
    
    // Analyze tasks
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
    const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done');
    
    // Analyze mood trends
    const recentEntries = journalEntries.slice(-7);
    const avgMood = recentEntries.length > 0 
      ? recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length 
      : 3;
    const avgEnergy = recentEntries.length > 0
      ? recentEntries.reduce((sum, e) => sum + e.energy, 0) / recentEntries.length
      : 3;
    
    // Analyze life wheel
    const latestScore = lifeWheelScores[lifeWheelScores.length - 1];
    const weakAreas = latestScore 
      ? Object.entries(latestScore.scores)
          .filter(([_, score]) => score < 5)
          .map(([area]) => area)
      : [];

    // Generate suggestions based on analysis
    
    // Mood-based suggestions
    if (avgMood < 3) {
      newSuggestions.push({
        type: 'insight',
        icon: <Heart className="w-4 h-4 text-area-health" />,
        title: 'Chăm sóc sức khỏe tinh thần',
        description: 'Mood của bạn gần đây hơi thấp. Hãy dành thời gian cho những hoạt động bạn yêu thích.',
        action: 'Ghi nhật ký cảm xúc'
      });
    } else if (avgMood >= 4) {
      newSuggestions.push({
        type: 'motivation',
        icon: <Sparkles className="w-4 h-4 text-streak" />,
        title: 'Tuyệt vời! Mood rất tốt',
        description: 'Bạn đang có mood rất tích cực. Đây là thời điểm tốt để tackle những task khó!',
      });
    }
    
    // Habit suggestions
    if (highStreakHabits.length > 0) {
      const habit = highStreakHabits[0];
      const area = LIFE_AREAS.find(a => a.id === habit.area);
      newSuggestions.push({
        type: 'habit',
        icon: <TrendingUp className="w-4 h-4 text-success" />,
        title: `Streak ấn tượng: ${habit.name}`,
        description: `${habit.streak} ngày liên tiếp! Tiếp tục duy trì nhé.`,
        area: area?.name
      });
    }
    
    if (lowStreakHabits.length > 0) {
      const habit = lowStreakHabits[Math.floor(Math.random() * lowStreakHabits.length)];
      newSuggestions.push({
        type: 'habit',
        icon: <Target className="w-4 h-4 text-warning" />,
        title: `Đừng để mất streak: ${habit.name}`,
        description: `Streak hiện tại: ${habit.streak}. Hoàn thành hôm nay để tiếp tục!`,
      });
    }
    
    // Task suggestions
    if (overdueTasks.length > 0) {
      newSuggestions.push({
        type: 'task',
        icon: <TrendingDown className="w-4 h-4 text-destructive" />,
        title: `${overdueTasks.length} task quá hạn`,
        description: 'Hãy ưu tiên hoàn thành các task này trước.',
        action: 'Xem tasks'
      });
    } else if (highPriorityTasks.length > 0) {
      const task = highPriorityTasks[0];
      newSuggestions.push({
        type: 'task',
        icon: <Lightbulb className="w-4 h-4 text-area-career" />,
        title: `Task quan trọng: ${task.title}`,
        description: 'Đây là task ưu tiên cao. Bắt đầu với 1 Pomodoro?',
        action: 'Bắt đầu Pomodoro'
      });
    }
    
    // Weak area suggestions
    if (weakAreas.length > 0) {
      const weakArea = weakAreas[Math.floor(Math.random() * weakAreas.length)];
      const areaInfo = LIFE_AREAS.find(a => a.id === weakArea);
      if (areaInfo) {
        newSuggestions.push({
          type: 'insight',
          icon: <Minus className="w-4 h-4 text-muted-foreground" />,
          title: `Cải thiện: ${areaInfo.name}`,
          description: `Lĩnh vực này cần được chú ý hơn. Hãy đặt 1 mục tiêu nhỏ.`,
          area: areaInfo.name
        });
      }
    }
    
    // Energy-based suggestions
    if (avgEnergy < 3) {
      newSuggestions.push({
        type: 'insight',
        icon: <Heart className="w-4 h-4 text-area-health" />,
        title: 'Năng lượng thấp',
        description: 'Hãy ưu tiên nghỉ ngơi và các task nhẹ nhàng hôm nay.',
      });
    }
    
    // Default motivation if no other suggestions
    if (newSuggestions.length === 0) {
      newSuggestions.push({
        type: 'motivation',
        icon: <Sparkles className="w-4 h-4 text-primary" />,
        title: 'Chào ngày mới!',
        description: 'Mỗi ngày là cơ hội mới. Hãy bắt đầu với habit đầu tiên của bạn!',
      });
    }
    
    setTimeout(() => {
      setSuggestions(newSuggestions.slice(0, compact ? 2 : 3));
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    generateSuggestions();
  }, [compact]);

  // Compact mobile version
  if (compact || isMobile) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Gợi ý AI</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={generateSuggestions}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </Button>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 2).map((suggestion, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
              >
                <div className="w-6 h-6 rounded-md bg-background flex items-center justify-center shrink-0">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs leading-tight">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{suggestion.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Gợi ý AI
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={generateSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
              {suggestion.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
              {suggestion.action && (
                <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs">
                  {suggestion.action} →
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
