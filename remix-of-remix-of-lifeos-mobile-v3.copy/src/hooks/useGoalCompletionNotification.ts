import { useEffect, useRef } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { toast } from 'sonner';

export function useGoalCompletionNotification() {
  const goals = useLifeOSStore((s) => s.goals);
  const prevGoalsRef = useRef<typeof goals>([]);

  useEffect(() => {
    // Check for newly completed goals
    goals.forEach(goal => {
      const prevGoal = prevGoalsRef.current.find(g => g.id === goal.id);
      
      // If goal just reached 100% and wasn't completed before
      if (
        goal.progress >= 100 &&
        goal.completedAt &&
        prevGoal &&
        prevGoal.progress < 100 &&
        !prevGoal.completedAt
      ) {
        toast.success(`🎉 Goal "${goal.title}" đã hoàn thành!`, {
          description: 'Chúc mừng bạn đã đạt được mục tiêu!',
          duration: 5000,
        });
      }
    });

    prevGoalsRef.current = goals;
  }, [goals]);
}
