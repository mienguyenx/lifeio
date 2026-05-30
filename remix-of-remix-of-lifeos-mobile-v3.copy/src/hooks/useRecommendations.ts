import { useMemo } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import { getTodayDateString } from '@/utils/dateUtils';

export interface Recommendation {
  id: string;
  type: 'action' | 'insight' | 'warning' | 'celebration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  area?: string;
}

export function useRecommendations(): Recommendation[] {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const morningCheckins = useLifeOSStore((s) => s.morningCheckins);
  const eveningReviews = useLifeOSStore((s) => s.eveningReviews);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);
  const todayStr = getTodayDateString();

  return useMemo(() => {
    const recs: Recommendation[] = [];
    const priorities = userPreferences?.lifeAreaPriorities || [];

    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const activeTasks = tasks.filter((t) => !t.archived && !t.deletedAt && t.status !== 'done');
    const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < todayStr);

    // --- Celebrations ---
    const longStreaks = activeHabits.filter((h) => h.streak >= 7);
    if (longStreaks.length > 0) {
      const best = longStreaks.sort((a, b) => b.streak - a.streak)[0];
      recs.push({
        id: 'streak-celebrate',
        type: 'celebration',
        priority: 'low',
        title: `🎉 ${best.name}: ${best.streak} ngày streak!`,
        description: 'Tiếp tục duy trì thói quen tuyệt vời này.',
        actionRoute: '/habits',
      });
    }

    // Goal near completion
    goals.filter((g) => !g.completedAt && !g.deletedAt && g.progress >= 80).forEach((g) => {
      recs.push({
        id: `goal-near-${g.id}`,
        type: 'celebration',
        priority: 'medium',
        title: `🏁 Goal "${g.title}" gần hoàn thành (${g.progress}%)`,
        description: 'Chỉ còn một chút nữa thôi!',
        actionLabel: 'Xem goal',
        actionRoute: '/goals',
      });
    });

    // --- Warnings ---
    if (overdueTasks.length >= 5) {
      recs.push({
        id: 'overdue-cleanup',
        type: 'warning',
        priority: 'high',
        title: `⚠️ ${overdueTasks.length} tasks quá hạn`,
        description: 'Nên dọn dẹp: chia nhỏ, lên lịch lại, hoặc xóa tasks không cần thiết.',
        actionLabel: 'Xem tasks',
        actionRoute: '/tasks',
      });
    }

    // Missing habits with high streak (at risk)
    const atRiskHabits = activeHabits.filter((h) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return h.streak >= 5 && !h.completedDates.includes(yesterdayStr) && !h.completedDates.includes(todayStr);
    });
    atRiskHabits.forEach((h) => {
      recs.push({
        id: `streak-risk-${h.id}`,
        type: 'warning',
        priority: 'high',
        title: `🔥 Streak ${h.name} (${h.streak}d) sắp mất!`,
        description: h.minimumVersion ? `Thử bản min: ${h.minimumVersion}` : 'Hoàn thành hôm nay để giữ streak.',
        actionRoute: '/habits',
      });
    });

    // Low mood/energy trend
    const last7Journals = journalEntries.filter((j) => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return j.date >= d.toISOString().split('T')[0];
    });
    if (last7Journals.length >= 3) {
      const avgMood = last7Journals.reduce((s, j) => s + j.mood, 0) / last7Journals.length;
      if (avgMood < 2.5) {
        recs.push({
          id: 'low-mood',
          type: 'warning',
          priority: 'high',
          title: '💙 Mood thấp liên tục',
          description: 'Xem xét giảm tải, nghỉ ngơi, hoặc nói chuyện với ai đó.',
          actionRoute: '/journal',
        });
      }
    }

    // --- Actions ---
    // No morning check-in today
    const todayCheckin = morningCheckins.find((c) => c.date === todayStr);
    if (!todayCheckin && new Date().getHours() < 12) {
      recs.push({
        id: 'morning-checkin',
        type: 'action',
        priority: 'medium',
        title: '☀️ Check-in buổi sáng',
        description: 'Dành 2 phút để định hướng ngày hôm nay.',
        actionRoute: '/',
      });
    }

    // No weekly review this week
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
    const weekStartStr = thisWeekStart.toISOString().split('T')[0];
    const hasWeeklyReview = weeklyReviews.some((r) => r.weekStart >= weekStartStr);
    const reviewDay = userPreferences?.preferredReviewDay ?? 0;
    if (!hasWeeklyReview && new Date().getDay() === reviewDay) {
      recs.push({
        id: 'weekly-review',
        type: 'action',
        priority: 'medium',
        title: '📝 Hôm nay là ngày review tuần!',
        description: 'Thử dùng Auto-draft để bắt đầu nhanh.',
        actionLabel: 'Mở Weekly Review',
        actionRoute: '/weekly-review',
      });
    }

    // Weak life area suggestion
    const latestWheel = lifeWheelScores[lifeWheelScores.length - 1];
    if (latestWheel) {
      const weakAreas = Object.entries(latestWheel.scores)
        .filter(([area, score]) => score <= 4 && priorities.includes(area as any))
        .sort(([, a], [, b]) => a - b);

      if (weakAreas.length > 0) {
        const [weakArea, score] = weakAreas[0];
        const areaInfo = LIFE_AREAS.find((a) => a.id === weakArea);
        if (areaInfo) {
          recs.push({
            id: `weak-area-${weakArea}`,
            type: 'insight',
            priority: 'medium',
            title: `${areaInfo.icon} ${areaInfo.name} cần chú ý (${score}/10)`,
            description: 'Tạo 1 habit nhỏ hoặc goal cho mảng này.',
            actionLabel: 'Xem chi tiết',
            actionRoute: '/area-dashboard',
            area: weakArea,
          });
        }
      }
    }

    // No habits in priority area
    priorities.forEach((area) => {
      const areaHabits = activeHabits.filter((h) => h.area === area);
      if (areaHabits.length === 0) {
        const areaInfo = LIFE_AREAS.find((a) => a.id === area);
        if (areaInfo) {
          recs.push({
            id: `no-habit-${area}`,
            type: 'insight',
            priority: 'low',
            title: `${areaInfo.icon} Chưa có habit cho ${areaInfo.name}`,
            description: 'Tạo 1 tiny habit để bắt đầu.',
            actionLabel: 'Tạo habit',
            actionRoute: '/habits',
            area,
          });
        }
      }
    });

    // Sort by priority
    const pOrder = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => pOrder[a.priority] - pOrder[b.priority]).slice(0, 8);
  }, [habits, tasks, goals, journalEntries, weeklyReviews, lifeWheelScores, morningCheckins, eveningReviews, userPreferences, todayStr]);
}
