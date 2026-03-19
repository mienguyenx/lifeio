import { useEffect, useRef } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

export function useGoalReminder() {
  const goals = useLifeOSStore((s) => s.goals);
  const updateGoal = useLifeOSStore((s) => s.updateGoal);
  const lastCheckRef = useRef<string>('');

  useEffect(() => {
    const checkGoalReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Only check once per day
      if (lastCheckRef.current === todayStr) return;
      lastCheckRef.current = todayStr;

      const activeGoals = goals.filter(g => !g.completedAt && g.targetDate);

      activeGoals.forEach(goal => {
        // Skip if reminder not enabled or already reminded today
        if (!goal.reminderEnabled) return;
        if (goal.lastReminded === todayStr) return;

        const targetDate = parseISO(goal.targetDate!);
        const daysRemaining = differenceInDays(targetDate, now);
        const reminderDays = goal.reminderDays || 7;

        // Check if we should remind
        if (daysRemaining <= reminderDays && daysRemaining >= 0) {
          const completedMilestones = goal.milestones.filter(m => m.completed).length;
          const totalMilestones = goal.milestones.length;
          
          let message = '';
          let type: 'warning' | 'error' | 'info' = 'warning';

          if (daysRemaining === 0) {
            message = `⚠️ Goal "${goal.title}" đến hạn HÔM NAY! (${goal.progress}% hoàn thành)`;
            type = 'error';
          } else if (daysRemaining <= 3) {
            message = `🔥 Goal "${goal.title}" còn ${daysRemaining} ngày! ${completedMilestones}/${totalMilestones} milestones`;
            type = 'error';
          } else {
            message = `📅 Goal "${goal.title}" còn ${daysRemaining} ngày. Tiến độ: ${goal.progress}%`;
            type = 'warning';
          }

          toast[type](message, {
            duration: 8000,
            action: {
              label: 'Xem',
              onClick: () => {
                window.location.href = '/goals';
              },
            },
          });

          // Update last reminded
          updateGoal(goal.id, { lastReminded: todayStr });
        }

        // Also remind if overdue
        if (daysRemaining < 0 && goal.progress < 100) {
          if (goal.lastReminded === todayStr) return;
          
          toast.error(`🚨 Goal "${goal.title}" đã QUÁ HẠN ${Math.abs(daysRemaining)} ngày!`, {
            duration: 10000,
            action: {
              label: 'Xem ngay',
              onClick: () => {
                window.location.href = '/goals';
              },
            },
          });

          updateGoal(goal.id, { lastReminded: todayStr });
        }
      });
    };

    // Check immediately
    checkGoalReminders();

    // Check every 30 minutes
    const interval = setInterval(checkGoalReminders, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [goals, updateGoal]);
}
