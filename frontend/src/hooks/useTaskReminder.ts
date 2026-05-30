import { useEffect, useRef } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString, parseDateInTimezone, isToday } from '@/utils/dateUtils';

export function useTaskReminder() {
  const tasks = useLifeOSStore((s) => s.tasks);
  const updateTask = useLifeOSStore((s) => s.updateTask);
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      const todayStr = getTodayDateString();
      
      tasks.forEach((task) => {
        if (
          task.status === 'done' ||
          !task.dueDate ||
          !task.reminderMinutes ||
          notifiedTasksRef.current.has(task.id)
        ) {
          return;
        }

        // Check if already reminded today (timezone-aware)
        if (task.lastReminded) {
          const lastRemindedDate = parseDateInTimezone(task.lastReminded);
          if (lastRemindedDate && isToday(task.lastReminded)) {
            return;
          }
        }

        // Use timezone-aware date parsing
        const dueDate = parseDateInTimezone(`${task.dueDate}T23:59:59`) || new Date(`${task.dueDate}T23:59:59`);
        const reminderTime = new Date(dueDate.getTime() - task.reminderMinutes * 60 * 1000);

        if (now >= reminderTime && now <= dueDate) {
          notifiedTasksRef.current.add(task.id);
          
          // Update last reminded
          updateTask(task.id, { lastReminded: now.toISOString() });

          // Send notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const timeLeft = Math.round((dueDate.getTime() - now.getTime()) / (60 * 1000));
            const timeText = timeLeft >= 60 
              ? `${Math.round(timeLeft / 60)} giờ` 
              : `${timeLeft} phút`;

            new Notification(`⏰ Nhắc nhở: ${task.title}`, {
              body: `Còn ${timeText} đến deadline!`,
              icon: '/favicon.svg',
              tag: task.id,
            });
          }
        }
      });
    };

    // Check immediately and then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [tasks, updateTask]);
}
