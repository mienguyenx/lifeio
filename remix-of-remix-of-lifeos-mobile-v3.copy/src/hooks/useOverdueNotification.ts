import { useEffect, useRef, useCallback } from 'react';
import { useNotificationBadges } from './useNotificationBadges';
import { useLifeOSStore } from '@/stores/useLifeOSStore';

// Create a simple notification beep using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Play a second beep for urgency
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.3);
    }, 150);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

// Send browser push notification
function sendPushNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'overdue-notification',
    });
  } catch (error) {
    console.warn('Could not send push notification:', error);
  }
}

export function useOverdueNotification() {
  const badges = useNotificationBadges();
  const notificationSoundEnabled = useLifeOSStore((s) => s.notificationSoundEnabled);
  const pushNotificationsEnabled = useLifeOSStore((s) => s.pushNotificationsEnabled);
  const prevOverdueRef = useRef({ tasks: 0, goals: 0 });
  const hasInitialized = useRef(false);

  const checkAndNotify = useCallback(() => {
    const currentTasksOverdue = badges.tasks.overdue;
    const currentGoalsOverdue = badges.goals.overdue;

    // Skip on first render to avoid notification on page load
    if (!hasInitialized.current) {
      prevOverdueRef.current = { tasks: currentTasksOverdue, goals: currentGoalsOverdue };
      hasInitialized.current = true;
      return;
    }

    // Check if overdue count increased
    const tasksIncreased = currentTasksOverdue > prevOverdueRef.current.tasks;
    const goalsIncreased = currentGoalsOverdue > prevOverdueRef.current.goals;

    if (tasksIncreased || goalsIncreased) {
      // Play sound notification
      if (notificationSoundEnabled) {
        playNotificationSound();
      }

      // Send push notification
      if (pushNotificationsEnabled) {
        const messages: string[] = [];
        if (tasksIncreased) {
          const newOverdue = currentTasksOverdue - prevOverdueRef.current.tasks;
          messages.push(`${newOverdue} task mới quá hạn`);
        }
        if (goalsIncreased) {
          const newOverdue = currentGoalsOverdue - prevOverdueRef.current.goals;
          messages.push(`${newOverdue} goal mới quá hạn`);
        }
        sendPushNotification('⚠️ LifeOS - Cảnh báo quá hạn', messages.join(', '));
      }
    }

    // Update previous values
    prevOverdueRef.current = { tasks: currentTasksOverdue, goals: currentGoalsOverdue };
  }, [badges.tasks.overdue, badges.goals.overdue, notificationSoundEnabled, pushNotificationsEnabled]);

  useEffect(() => {
    checkAndNotify();
  }, [checkAndNotify]);

  return {
    overdueTasksCount: badges.tasks.overdue,
    overdueGoalsCount: badges.goals.overdue,
  };
}
