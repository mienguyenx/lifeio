import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, isSameWeek, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, Sparkles, Calendar, CheckCircle2, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Link } from 'react-router-dom';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { cn } from '@/lib/utils';

export default function WeeklyReviewReminder() {
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const user = useLifeOSStore((s) => s.user);

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isFriday = dayOfWeek === 5;
  
  // Check if current week has a review
  const currentWeekReview = weeklyReviews?.find(r => 
    isSameWeek(new Date(r.weekStart), currentWeekStart, { weekStartsOn: 1 })
  );
  const hasCurrentWeekReview = !!currentWeekReview;

  // Calculate weekly stats
  const weeklyStats = {
    habitsCompleted: habits.filter(h => !h.archivedAt && !h.deletedAt)
      .reduce((sum, h) => {
        const weekCompletions = h.completedDates.filter(d => {
          const date = new Date(d);
          return date >= currentWeekStart && date <= currentWeekEnd;
        }).length;
        return sum + weekCompletions;
      }, 0),
    tasksCompleted: tasks.filter(t => !t.deletedAt && t.completedAt)
      .filter(t => {
        const completedDate = new Date(t.completedAt!);
        return completedDate >= currentWeekStart && completedDate <= currentWeekEnd;
      }).length,
    journalEntries: journalEntries.filter(j => {
      const date = new Date(j.date);
      return date >= currentWeekStart && date <= currentWeekEnd;
    }).length,
    goalsProgress: goals.filter(g => !g.deletedAt && g.progress < 100).length
  };

  // Get latest life wheel scores
  const latestScores = lifeWheelScores[0]?.scores || 
    Object.fromEntries(LIFE_AREAS.map(a => [a.id, 5])) as Record<LifeArea, number>;

  // Find areas needing attention (lowest scores)
  const sortedAreas = LIFE_AREAS
    .map(a => ({ ...a, score: latestScores[a.id] || 5 }))
    .sort((a, b) => a.score - b.score);
  const lowestAreas = sortedAreas.slice(0, 3);

  const fetchAIAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const areaNames: Record<string, string> = {
        health: 'Sức khỏe', emotional: 'Cảm xúc', career: 'Sự nghiệp',
        finance: 'Tài chính', relationships: 'Quan hệ', learning: 'Học tập',
        'personal-goals': 'Mục tiêu', habits: 'Thói quen', fun: 'Giải trí', environment: 'Môi trường'
      };

      const formattedScores: Record<string, number> = {};
      Object.entries(latestScores).forEach(([key, value]) => {
        formattedScores[areaNames[key] || key] = value;
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ 
              role: 'user', 
              content: `Phân tích tuần này và đưa ra tóm tắt ngắn gọn (3-4 câu):
- Thói quen hoàn thành: ${weeklyStats.habitsCompleted}
- Tasks hoàn thành: ${weeklyStats.tasksCompleted}
- Bài nhật ký: ${weeklyStats.journalEntries}
- Goals đang thực hiện: ${weeklyStats.goalsProgress}

Đề xuất 2-3 điều cần tập trung tuần tới dựa trên Life Wheel scores.` 
            }],
            userContext: {
              lifeWheelScores: formattedScores,
              weeklyReview: currentWeekReview,
              lifePurpose: user?.lifePurpose,
              personalValues: user?.personalValues,
              dailyStats: weeklyStats
            }
          })
        }
      );

      if (!response.ok) throw new Error('Failed to fetch analysis');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let analysis = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  analysis += content;
                  setAiAnalysis(analysis);
                }
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      setAiAnalysis('Không thể tải phân tích. Hãy thử lại sau.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Auto-fetch analysis on weekends
  useEffect(() => {
    if ((isWeekend || isFriday) && !hasCurrentWeekReview && !aiAnalysis) {
      fetchAIAnalysis();
    }
  }, [isWeekend, isFriday, hasCurrentWeekReview]);

  // Only show reminder on Friday, Saturday, Sunday or if no review this week
  if (!isWeekend && !isFriday && hasCurrentWeekReview) {
    return null;
  }

  return (
    <Card className={cn(
      "border-2",
      hasCurrentWeekReview ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasCurrentWeekReview ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Bell className="w-5 h-5 text-warning animate-pulse" />
            )}
            <CardTitle className="text-base">
              {hasCurrentWeekReview ? 'Weekly Review đã hoàn thành!' : 'Đã đến lúc Weekly Review!'}
            </CardTitle>
          </div>
          <Badge variant={hasCurrentWeekReview ? "default" : "secondary"}>
            Tuần {format(currentWeekStart, 'dd/MM', { locale: vi })} - {format(currentWeekEnd, 'dd/MM', { locale: vi })}
          </Badge>
        </div>
        {!hasCurrentWeekReview && (
          <CardDescription>
            Dành 10 phút để nhìn lại tuần qua và lên kế hoạch tuần tới
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Stats Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-background">
            <p className="text-lg font-bold">{weeklyStats.habitsCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Habits</p>
          </div>
          <div className="p-2 rounded-lg bg-background">
            <p className="text-lg font-bold">{weeklyStats.tasksCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Tasks</p>
          </div>
          <div className="p-2 rounded-lg bg-background">
            <p className="text-lg font-bold">{weeklyStats.journalEntries}</p>
            <p className="text-[10px] text-muted-foreground">Journal</p>
          </div>
          <div className="p-2 rounded-lg bg-background">
            <p className="text-lg font-bold">{weeklyStats.goalsProgress}</p>
            <p className="text-[10px] text-muted-foreground">Goals</p>
          </div>
        </div>

        {/* Areas needing attention */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Mảng cần tập trung tuần tới:</p>
          <div className="flex gap-2 flex-wrap">
            {lowestAreas.map((area) => (
              <Badge key={area.id} variant="outline" className="text-xs">
                {area.icon} {area.name}: {area.score}/10
              </Badge>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium">AI phân tích tuần này</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={fetchAIAnalysis}
                    disabled={isLoadingAnalysis}
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {isLoadingAnalysis && !aiAnalysis ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang phân tích...
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{aiAnalysis}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {!hasCurrentWeekReview && (
          <Link to="/weekly-review">
            <Button className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Bắt đầu Weekly Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
