import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, Lock, Sparkles, Star, Zap, Trophy, Target, BookOpen, Calendar, MessageSquare, PenLine, Heart, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Quest {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  path: string;
  check: (store: ReturnType<typeof useLifeOSStore.getState>) => boolean;
  xp: number;
}

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bgColor: string;
  quests: Quest[];
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: 'Hiểu bản thân',
    subtitle: 'Biết mình là ai, muốn gì',
    emoji: '🌱',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    quests: [
      {
        id: 'onboarding',
        title: 'Hoàn thành thiết lập ban đầu',
        desc: 'Trả lời các câu hỏi về phong cách sống và ưu tiên của bạn',
        icon: Sparkles,
        path: '/personalization',
        check: (s) => s.userPreferences?.onboardingCompleted === true,
        xp: 50,
      },
      {
        id: 'life-wheel',
        title: 'Đánh giá Life Wheel',
        desc: 'Xem mức độ cân bằng của 8 lĩnh vực cuộc sống bạn hiện tại',
        icon: Target,
        path: '/life-wheel',
        check: (s) => s.lifeWheelScores?.length > 0,
        xp: 80,
      },
      {
        id: 'personalization',
        title: 'Tùy chỉnh cá nhân hóa',
        desc: 'Điều chỉnh giọng AI, phong cách lập kế hoạch theo ý bạn',
        icon: Sparkles,
        path: '/personalization',
        check: (s) => !!s.userPreferences?.archetype && s.userPreferences.archetype !== 'beginner',
        xp: 30,
      },
    ],
  },
  {
    id: 2,
    title: 'Xây dựng hệ thống',
    subtitle: 'Tạo nền móng cho thay đổi',
    emoji: '🏗️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    quests: [
      {
        id: 'first-goal',
        title: 'Đặt mục tiêu đầu tiên',
        desc: 'Xác định 1 điều quan trọng bạn muốn đạt được',
        icon: Target,
        path: '/goals',
        check: (s) => s.goals?.length > 0,
        xp: 100,
      },
      {
        id: 'first-habit',
        title: 'Tạo thói quen đầu tiên',
        desc: 'Chọn 1 thói quen nhỏ để bắt đầu xây dựng momentum',
        icon: RotateCcw,
        path: '/habits',
        check: (s) => s.habits?.length > 0,
        xp: 100,
      },
      {
        id: 'first-task',
        title: 'Thêm việc cần làm',
        desc: 'Ghi lại 1 việc cụ thể cần hoàn thành hôm nay hoặc tuần này',
        icon: CheckCircle2,
        path: '/tasks',
        check: (s) => s.tasks?.length > 0,
        xp: 50,
      },
    ],
  },
  {
    id: 3,
    title: 'Sống có ý thức',
    subtitle: 'Theo dõi từng ngày một',
    emoji: '⚡',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    quests: [
      {
        id: 'daily-intention',
        title: 'Đặt ý định hàng ngày',
        desc: 'Mỗi sáng, xác định 3 việc quan trọng nhất hôm nay',
        icon: Zap,
        path: '/',
        check: (s) => s.dailyIntentions?.length > 0,
        xp: 60,
      },
      {
        id: 'first-journal',
        title: 'Viết nhật ký đầu tiên',
        desc: 'Ghi lại suy nghĩ, cảm xúc hoặc bài học trong ngày',
        icon: PenLine,
        path: '/journal',
        check: (s) => s.journalEntries?.length > 0,
        xp: 80,
      },
      {
        id: 'ai-chat',
        title: 'Trò chuyện với AI Coach',
        desc: 'Hỏi AI về kế hoạch, thói quen hoặc bất kỳ điều gì bạn đang suy nghĩ',
        icon: MessageSquare,
        path: '/ai-chat',
        check: (s) => s.chatMessages?.length > 0,
        xp: 60,
      },
    ],
  },
  {
    id: 4,
    title: 'Phản tư & Cải thiện',
    subtitle: 'Nhìn lại để tiến xa hơn',
    emoji: '🔮',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    quests: [
      {
        id: 'weekly-review',
        title: 'Hoàn thành Weekly Review',
        desc: 'Nhìn lại tuần vừa qua: đã làm được gì, học được gì',
        icon: Calendar,
        path: '/weekly-review',
        check: (s) => s.weeklyReviews?.length > 0,
        xp: 150,
      },
      {
        id: 'monthly-review',
        title: 'Hoàn thành Monthly Review',
        desc: 'Đánh giá tháng và điều chỉnh hướng đi',
        icon: BookOpen,
        path: '/monthly-review',
        check: (s) => s.monthlyReviews?.length > 0,
        xp: 200,
      },
      {
        id: 'habit-streak',
        title: 'Duy trì thói quen 7 ngày liên tiếp',
        desc: 'Hoàn thành ít nhất 1 thói quen trong 7 ngày liên tiếp',
        icon: Heart,
        path: '/habits',
        check: (s) => {
          if (!s.habits?.length) return false;
          const habit = s.habits[0];
          if (!habit?.completedDates?.length) return false;
          const sorted = [...habit.completedDates].sort().reverse();
          if (sorted.length < 7) return false;
          const today = new Date();
          let streak = 0;
          for (let i = 0; i < sorted.length; i++) {
            const d = new Date(sorted[i]);
            const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
            if (diff === i) streak++;
            else break;
          }
          return streak >= 7;
        },
        xp: 200,
      },
    ],
  },
];

function QuestItem({ quest, done, locked }: { quest: Quest; done: boolean; locked: boolean }) {
  const Icon = quest.icon;
  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg transition-all',
      done ? 'bg-primary/5' : locked ? 'opacity-50' : 'hover:bg-secondary/50',
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
        done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
      )}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : locked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
            {quest.title}
          </p>
          <Badge variant="outline" className="text-xs shrink-0">+{quest.xp} XP</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{quest.desc}</p>
      </div>
      {!done && !locked && (
        <Link to={quest.path}>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs shrink-0">
            Bắt đầu <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function GettingStartedPage() {
  const storeState = useLifeOSStore.getState();
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const monthlyReviews = useLifeOSStore((s) => s.monthlyReviews);
  const dailyIntentions = useLifeOSStore((s) => s.dailyIntentions);
  const chatMessages = useLifeOSStore((s) => s.chatMessages);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);

  const liveState = {
    ...storeState,
    habits, tasks, goals, journalEntries, weeklyReviews, monthlyReviews,
    dailyIntentions, chatMessages, lifeWheelScores, userPreferences,
  };

  const stageResults = useMemo(() => {
    return STAGES.map((stage) => {
      const questResults = stage.quests.map((q) => ({ ...q, done: q.check(liveState as any) }));
      const doneCount = questResults.filter((q) => q.done).length;
      const totalXP = questResults.reduce((a, q) => a + q.xp, 0);
      const earnedXP = questResults.filter((q) => q.done).reduce((a, q) => a + q.xp, 0);
      return { ...stage, questResults, doneCount, totalXP, earnedXP, complete: doneCount === stage.quests.length };
    });
  }, [habits, tasks, goals, journalEntries, weeklyReviews, monthlyReviews, dailyIntentions, chatMessages, lifeWheelScores, userPreferences]);

  const totalXP = stageResults.reduce((a, s) => a + s.totalXP, 0);
  const earnedXP = stageResults.reduce((a, s) => a + s.earnedXP, 0);
  const totalQuests = stageResults.reduce((a, s) => a + s.quests.length, 0);
  const doneQuests = stageResults.reduce((a, s) => a + s.doneCount, 0);
  const overallPct = Math.round((doneQuests / totalQuests) * 100);

  // A stage is unlocked if the previous stage has at least 1 quest done
  const isStageUnlocked = (i: number) => i === 0 || stageResults[i - 1].doneCount > 0;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> Hành trình của tôi
        </h1>
        <p className="text-sm text-muted-foreground">Hoàn thành từng bước để xây dựng cuộc sống bạn muốn</p>
      </div>

      {/* Overall progress */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tiến độ tổng thể</p>
              <p className="text-xs text-muted-foreground">{doneQuests}/{totalQuests} nhiệm vụ · {earnedXP}/{totalXP} XP</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-amber-500">{overallPct}%</span>
            </div>
          </div>
          <Progress value={overallPct} className="h-3" />
          <div className="flex gap-2 flex-wrap">
            {stageResults.map((s) => (
              <div key={s.id} className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                s.complete ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground'
              )}>
                <span>{s.emoji}</span>
                <span>Chặng {s.id}</span>
                {s.complete && <CheckCircle2 className="w-3 h-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      {stageResults.map((stage, i) => {
        const unlocked = isStageUnlocked(i);
        const pct = Math.round((stage.doneCount / stage.quests.length) * 100);
        return (
          <div key={stage.id} className={cn('rounded-xl border p-4 space-y-3 transition-all', stage.bgColor, !unlocked && 'opacity-60')}>
            {/* Stage header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{stage.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={cn('font-bold text-base', stage.color)}>Chặng {stage.id}: {stage.title}</h2>
                    {stage.complete && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-1.5">Hoàn thành ✓</Badge>
                    )}
                    {!unlocked && (
                      <Badge variant="outline" className="text-xs px-1.5"><Lock className="w-3 h-3 mr-1" />Khóa</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                </div>
              </div>
              <span className={cn('text-sm font-semibold shrink-0', stage.color)}>{stage.doneCount}/{stage.quests.length}</span>
            </div>

            <Progress value={pct} className="h-1.5" />

            {/* Quests */}
            <div className="space-y-1">
              {stage.questResults.map((quest) => (
                <QuestItem key={quest.id} quest={quest} done={quest.done} locked={!unlocked} />
              ))}
            </div>

            {stage.complete && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <p className="text-xs font-medium text-primary">Xuất sắc! Bạn đã hoàn thành chặng này và nhận được {stage.earnedXP} XP.</p>
              </div>
            )}
          </div>
        );
      })}

      {/* All done */}
      {doneQuests === totalQuests && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-4 text-center space-y-2">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="font-bold text-lg">Chúc mừng! 🎉</p>
            <p className="text-sm text-muted-foreground">Bạn đã hoàn thành toàn bộ hành trình thiết lập. Giờ là lúc sống với hệ thống bạn đã xây dựng!</p>
            <Link to="/">
              <Button className="mt-2">Về Today Dashboard <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
