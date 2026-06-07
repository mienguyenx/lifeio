import { useEffect, useCallback } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { toast } from 'sonner';
import { getTodayDateString, getCurrentTimeString } from '@/utils/dateUtils';

export function useHabitReminder() {
  const habits = useLifeOSStore((s) => s.habits);
  const pushNotificationsEnabled = useLifeOSStore((s) => s.pushNotificationsEnabled);

  const checkReminders = useCallback(() => {
    if (!pushNotificationsEnabled) return;
    
    // Use timezone-aware date utilities (GMT+7, format 24h)
    const currentTime = getCurrentTimeString().substring(0, 5); // HH:MM
    const todayStr = getTodayDateString();

    habits.forEach((habit) => {
      // Skip archived habits
      if (habit.archivedAt) return;
      
      // Skip if no reminder set or not enabled
      if (!habit.reminderTime || !habit.reminderEnabled) return;
      
      // Check if it's time for reminder (within 1 minute window)
      const [reminderHour, reminderMinute] = habit.reminderTime.split(':').map(Number);
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      
      const reminderMinutes = reminderHour * 60 + reminderMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      
      // Check if we're within the reminder window (exact minute)
      if (currentMinutes !== reminderMinutes) return;
      
      // Check if habit is already completed today
      const target = habit.targetPerDay || 1;
      const todayCompletion = habit.completions?.find(c => c.date === todayStr);
      const todayCount = todayCompletion?.count || (habit.completedDates.includes(todayStr) ? 1 : 0);
      
      if (todayCount >= target) return; // Already completed
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Nhắc nhở: ${habit.name}`, {
          body: target > 1 
            ? `Còn ${target - todayCount}/${target} ${habit.targetUnit || 'lần'} để hoàn thành hôm nay!`
            : 'Đừng quên hoàn thành habit này hôm nay!',
          icon: '/favicon.svg',
          tag: `habit-reminder-${habit.id}`,
        });
      } else {
        // Fallback to toast
        toast.info(`Nhắc nhở: ${habit.name}`, {
          description: target > 1 
            ? `Còn ${target - todayCount}/${target} ${habit.targetUnit || 'lần'} để hoàn thành`
            : 'Đừng quên hoàn thành habit này!',
          duration: 10000,
        });
      }
    });
  }, [habits, pushNotificationsEnabled]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  useEffect(() => {
    // Check reminders every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Initial check
    checkReminders();
    
    return () => clearInterval(interval);
  }, [checkReminders]);

  return { requestPermission };
}
