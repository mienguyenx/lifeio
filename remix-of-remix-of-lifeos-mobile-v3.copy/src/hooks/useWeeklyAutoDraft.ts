import { useMemo } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import type { LifeArea } from '@/types/lifeos';

interface WeeklyDraft {
  wins: string;
  challenges: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  highlight: string;
  lowlight: string;
  gratitude: string;
  areaRatings: Record<LifeArea, number>;
}

export function useWeeklyAutoDraft(weekDates: string[]): WeeklyDraft {
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const morningCheckins = useLifeOSStore((s) => s.morningCheckins);
  const eveningReviews = useLifeOSStore((s) => s.eveningReviews);

  return useMemo(() => {
    // --- Data collection ---
    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const activeTasks = tasks.filter((t) => !t.archived && !t.deletedAt);

    // Tasks completed this week
    const completedTasks = activeTasks.filter(
      (t) => t.completedAt && weekDates.some((d) => t.completedAt?.startsWith(d))
    );
    const highPriorityCompleted = completedTasks.filter((t) => t.priority === 'high');
    const overdueTasks = activeTasks.filter(
      (t) => t.status !== 'done' && t.dueDate && weekDates.includes(t.dueDate)
    );

    // Habits this week
    const habitStats = activeHabits.map((h) => {
      const completedCount = h.completedDates.filter((d) => weekDates.includes(d)).length;
      const expectedDays = h.frequency === 'daily'
        ? weekDates.length
        : h.customDays?.filter((day) => {
            return weekDates.some((d) => new Date(d).getDay() === day);
          }).length || 0;
      return {
        name: h.name,
        area: h.area,
        completedCount,
        expectedDays,
        rate: expectedDays > 0 ? Math.round((completedCount / expectedDays) * 100) : 0,
        streak: h.streak,
      };
    });

    const bestHabits = habitStats.filter((h) => h.rate >= 80).sort((a, b) => b.rate - a.rate);
    const strugglingHabits = habitStats.filter((h) => h.rate < 50 && h.expectedDays > 0);

    // Pomodoros
    const weekPomodoros = pomodoroSessions.filter(
      (s) => s.phase === 'work' && weekDates.some((d) => s.completedAt.startsWith(d))
    );
    const totalFocusMinutes = weekPomodoros.length * 25;

    // Journal moods
    const weekJournals = journalEntries.filter((j) => weekDates.includes(j.date));
    const avgMood = weekJournals.length > 0
      ? (weekJournals.reduce((sum, j) => sum + j.mood, 0) / weekJournals.length).toFixed(1)
      : null;
    const avgEnergy = weekJournals.length > 0
      ? (weekJournals.reduce((sum, j) => sum + j.energy, 0) / weekJournals.length).toFixed(1)
      : null;

    // Evening reviews gratitude
    const weekEveningReviews = eveningReviews.filter((r) => weekDates.includes(r.date));
    const gratitudeItems = weekEveningReviews.map((r) => r.gratitude).filter(Boolean);

    // Goals progress
    const activeGoals = goals.filter((g) => !g.completedAt && !g.deletedAt);
    const focusedGoals = activeGoals.filter((g) => g.isFocused);

    // --- Generate draft text ---
    const wins: string[] = [];
    if (completedTasks.length > 0) {
      wins.push(`Hoàn thành ${completedTasks.length} tasks${highPriorityCompleted.length > 0 ? ` (${highPriorityCompleted.length} quan trọng)` : ''}`);
    }
    if (bestHabits.length > 0) {
      const topNames = bestHabits.slice(0, 3).map((h) => h.name).join(', ');
      wins.push(`Duy trì tốt habits: ${topNames}`);
    }
    if (weekPomodoros.length > 0) {
      wins.push(`${weekPomodoros.length} phiên focus (${totalFocusMinutes} phút)`);
    }
    if (weekJournals.length >= 3) {
      wins.push(`Viết journal ${weekJournals.length}/7 ngày`);
    }
    highPriorityCompleted.slice(0, 2).forEach((t) => {
      wins.push(`✓ ${t.title}`);
    });

    const challenges: string[] = [];
    if (strugglingHabits.length > 0) {
      const names = strugglingHabits.slice(0, 3).map((h) => `${h.name} (${h.rate}%)`).join(', ');
      challenges.push(`Habits cần cải thiện: ${names}`);
    }
    if (overdueTasks.length > 0) {
      challenges.push(`${overdueTasks.length} tasks chưa hoàn thành trong tuần`);
    }
    if (avgMood && parseFloat(avgMood) < 3) {
      challenges.push(`Tâm trạng trung bình thấp (${avgMood}/5)`);
    }
    if (avgEnergy && parseFloat(avgEnergy) < 3) {
      challenges.push(`Năng lượng trung bình thấp (${avgEnergy}/5)`);
    }

    const lessons: string[] = [];
    if (bestHabits.length > 0 && strugglingHabits.length > 0) {
      lessons.push(`Habits nhỏ (${bestHabits[0]?.name}) dễ duy trì hơn — áp dụng cho habits khó`);
    }
    if (totalFocusMinutes > 150) {
      lessons.push(`Focus time tốt — tiếp tục giữ nhịp Pomodoro`);
    } else if (weekPomodoros.length > 0) {
      lessons.push(`Cần tăng thời gian focus — thử block thêm 1 phiên/ngày`);
    }

    const nextFocus: string[] = [];
    if (strugglingHabits.length > 0) {
      nextFocus.push(`Cải thiện: ${strugglingHabits[0]?.name}`);
    }
    if (focusedGoals.length > 0) {
      nextFocus.push(`Tiếp tục goal: ${focusedGoals[0]?.title}`);
    }
    if (overdueTasks.length > 0) {
      nextFocus.push(`Dọn ${overdueTasks.length} tasks tồn đọng`);
    }

    // Highlight = best achievement
    const highlight = highPriorityCompleted.length > 0
      ? `Hoàn thành: ${highPriorityCompleted[0].title}`
      : bestHabits.length > 0
        ? `Duy trì ${bestHabits[0].name} (${bestHabits[0].rate}%)`
        : completedTasks.length > 0
          ? `Hoàn thành ${completedTasks.length} tasks`
          : '';

    // Lowlight
    const lowlight = strugglingHabits.length > 0
      ? `${strugglingHabits[0].name} chỉ đạt ${strugglingHabits[0].rate}%`
      : overdueTasks.length > 0
        ? `${overdueTasks.length} tasks chưa xong`
        : '';

    // Gratitude from evening reviews or journal
    const gratitude = gratitudeItems.length > 0
      ? gratitudeItems.slice(0, 3).join('\n')
      : weekJournals.filter((j) => j.gratitude?.length).flatMap((j) => j.gratitude || []).slice(0, 3).join('\n');

    // Area ratings auto-estimate
    const areaRatings: Record<LifeArea, number> = {} as Record<LifeArea, number>;
    LIFE_AREAS.forEach((area) => {
      const areaHabits = habitStats.filter((h) => h.area === area.id);
      const areaTasks = completedTasks.filter((t) => t.area === area.id);

      let score = 5; // default neutral
      if (areaHabits.length > 0) {
        const avgRate = areaHabits.reduce((s, h) => s + h.rate, 0) / areaHabits.length;
        score = Math.round(avgRate / 10); // 0-100 -> 0-10
        score = Math.max(1, Math.min(10, score));
      }
      if (areaTasks.length > 0) {
        score = Math.min(10, score + 1); // bonus for completing tasks in this area
      }
      areaRatings[area.id] = score;
    });

    return {
      wins: wins.join('\n'),
      challenges: challenges.join('\n'),
      lessonsLearned: lessons.join('\n'),
      nextWeekFocus: nextFocus.join('\n'),
      highlight,
      lowlight,
      gratitude,
      areaRatings,
    };
  }, [habits, tasks, goals, journalEntries, pomodoroSessions, morningCheckins, eveningReviews, weekDates]);
}
