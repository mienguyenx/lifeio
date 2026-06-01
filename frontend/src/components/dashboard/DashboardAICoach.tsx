import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, HelpCircle, X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DashboardAICoachProps {
  onClose?: () => void;
}

export default function DashboardAICoach({ onClose }: DashboardAICoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailySuggestion, setDailySuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const user = useLifeOSStore((s) => s.user);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const yearlyPlannings = useLifeOSStore((s) => s.yearlyPlannings);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate daily stats
  const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
  const todayHabits = activeHabits.filter((h) => 
    h.frequency === 'daily' || h.customDays?.includes(new Date().getDay())
  );
  const completedHabitsToday = todayHabits.filter((h) => h.completedDates.includes(todayStr));
  
  const activeTasks = tasks.filter((t) => !t.deletedAt);
  const completedTasksToday = activeTasks.filter((t) => t.completedAt?.startsWith(todayStr));
  const pendingTasks = activeTasks.filter((t) => t.status !== 'done');
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());

  const activeGoals = goals.filter((g) => !g.deletedAt && g.progress < 100);
  const avgGoalProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length) 
    : 0;

  const latestJournal = journalEntries.slice(-1)[0];
  const mood = latestJournal?.mood || 3;
  const energy = latestJournal?.energy || 3;

  // Get latest life wheel scores
  const latestScores = lifeWheelScores[lifeWheelScores.length - 1]?.scores || 
    Object.fromEntries(LIFE_AREAS.map(a => [a.id, 5])) as Record<LifeArea, number>;

  // Get latest weekly review
  const latestWeeklyReview = weeklyReviews?.slice(-1)[0];
  const latestMonthlyReview = monthlyReviews?.slice(-1)[0];
  const currentYearPlanning = yearlyPlannings?.find(p => p.year === new Date().getFullYear());

  // Build user context for AI
  const buildUserContext = () => {
    const areaNames: Record<string, string> = {
      health: 'Sức khỏe',
      emotional: 'Cảm xúc',
      career: 'Sự nghiệp',
      finance: 'Tài chính',
      relationships: 'Quan hệ',
      learning: 'Học tập',
      'personal-goals': 'Mục tiêu',
      habits: 'Thói quen',
      fun: 'Giải trí',
      environment: 'Môi trường'
    };

    const formattedScores: Record<string, number> = {};
    Object.entries(latestScores).forEach(([key, value]) => {
      formattedScores[areaNames[key] || key] = value;
    });

    return {
      lifePurpose: user?.lifePurpose,
      visions: user?.visions,
      personalValues: user?.personalValues,
      lifeRoles: user?.lifeRoles,
      traits: user?.traits,
      goals: activeGoals.map(g => ({ 
        title: g.title, 
        progress: g.progress,
        area: areaNames[g.area] || g.area
      })),
      lifeWheelScores: formattedScores,
      weeklyReview: latestWeeklyReview,
      monthlyReview: latestMonthlyReview ? {
        month: latestMonthlyReview.month,
        rating: latestMonthlyReview.overallRating,
        wins: latestMonthlyReview.wins?.slice(0, 3),
        challenges: latestMonthlyReview.challenges?.slice(0, 3),
        nextFocus: latestMonthlyReview.nextMonthFocus?.slice(0, 3),
      } : undefined,
      yearlyPlan: currentYearPlanning ? {
        theme: currentYearPlanning.theme,
        goals: currentYearPlanning.yearlyGoals?.slice(0, 5),
      } : undefined,
      dailyStats: {
        habitsCompleted: completedHabitsToday.length,
        habitsTotal: todayHabits.length,
        tasksCompleted: completedTasksToday.length,
        tasksPending: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        activeGoals: activeGoals.length,
        avgGoalProgress,
        mood,
        energy
      }
    };
  };

  // Quick questions
  const quickQuestions = [
    'Hôm nay tôi nên tập trung vào mảng nào?',
    'Gợi ý 3 hành động cải thiện điểm thấp nhất',
    'Làm sao để cân bằng cuộc sống tốt hơn?',
    'Phân tích Weekly Review và đề xuất tuần tới',
    'So sánh tiến độ tháng này với kế hoạch năm'
  ];

  // Fetch daily suggestion on mount
  useEffect(() => {
    fetchDailySuggestion();
  }, []);

  const fetchDailySuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        functionUrl('ai-coach'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            messages: [{ 
              role: 'user', 
              content: 'Dựa trên dữ liệu Life Wheel và Weekly Review, hãy đưa ra 2-3 gợi ý ngắn gọn và cụ thể cho hôm nay. Tập trung vào mảng có điểm thấp nhất.' 
            }],
            userContext: buildUserContext()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestion');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let suggestion = '';

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
                  suggestion += content;
                  setDailySuggestion(suggestion);
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      setDailySuggestion('Không thể tải gợi ý. Hãy thử lại sau.');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        functionUrl('ai-coach'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            userContext: buildUserContext()
          })
        }
      );

      if (!response.ok) {
        let errorMessage = 'Không thể kết nối với AI Coach';
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorText;
          } catch {
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // Better error messages
        if (response.status === 404) {
          errorMessage = 'AI Coach chưa được cấu hình. Vui lòng liên hệ quản trị viên.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Bạn cần đăng nhập để sử dụng AI Coach.';
        } else if (response.status === 429) {
          errorMessage = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
        }
        
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
                  assistantContent += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                    return newMessages;
                  });
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Coach error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Xin lỗi, có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Find lowest scored areas
  const sortedAreas = LIFE_AREAS
    .map(a => ({ ...a, score: latestScores[a.id] || 5 }))
    .sort((a, b) => a.score - b.score);
  const lowestAreas = sortedAreas.slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* Daily Suggestion */}
      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium">Gợi ý hôm nay</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={fetchDailySuggestion}
                  disabled={isLoadingSuggestion}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSuggestion ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {isLoadingSuggestion && !dailySuggestion ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang phân tích dữ liệu...
                </div>
              ) : (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{dailySuggestion}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Areas needing attention */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          Mảng cần cải thiện
        </h3>
        <div className="flex gap-2 flex-wrap">
          {lowestAreas.map((area) => (
            <Button
              key={area.id}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => sendMessage(`Hãy đưa ra 3 hành động cụ thể để cải thiện mảng ${area.name} (hiện đang ${area.score}/10)`)}
            >
              {area.icon} {area.name}: {area.score.toFixed(0)}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick questions */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Câu hỏi nhanh</h3>
        <div className="space-y-1">
          {quickQuestions.map((q, i) => (
            <Button 
              key={i} 
              variant="ghost" 
              className="w-full justify-start text-xs h-auto py-1.5 px-2"
              onClick={() => sendMessage(q)}
              disabled={isLoading}
            >
              {q}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      {messages.length > 0 && (
        <ScrollArea className="flex-1 mb-4 border rounded-lg p-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                <div 
                  className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang suy nghĩ...
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <div className="mt-auto pt-3 border-t">
        <div className="flex gap-2">
          <Input 
            placeholder="Hỏi AI Coach..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button size="icon" onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          AI Coach phân tích Life Wheel & Weekly Review
        </p>
      </div>
    </div>
  );
}
