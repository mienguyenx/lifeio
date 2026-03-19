// LifeOS Notification Service
// Quản lý thông báo và danh sách thông báo

import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { getTodayDateString, isToday, isBeforeToday, parseDateInTimezone } from '@/utils/dateUtils';
import { Task, Goal, Habit } from '@/types/lifeos';

export interface Notification {
  id: string;
  type: 'task' | 'goal' | 'habit' | 'system' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  urgent: boolean;
  read: boolean;
  createdAt: string; // ISO string
  relatedId?: string; // ID of related task/goal/habit
  actionUrl?: string; // URL to navigate when clicked
  metadata?: Record<string, any>;
}

class NotificationService {
  private notifications: Notification[] = [];
  private maxNotifications = 100;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  constructor() {
    this.loadNotifications();
  }

  /**
   * Load notifications from store
   */
  private loadNotifications() {
    try {
      const stored = localStorage.getItem('lifeos_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[NotificationService] Error loading notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Save notifications to store
   */
  private saveNotifications() {
    try {
      // Limit notifications count
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(-this.maxNotifications);
      }
      localStorage.setItem('lifeos_notifications', JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.warn('[NotificationService] Error saving notifications:', error);
    }
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current notifications
    callback([...this.notifications]);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback([...this.notifications]);
      } catch (error) {
        console.warn('[NotificationService] Error in listener:', error);
      }
    });
  }

  /**
   * Add a notification
   */
  addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const notif: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    };

    this.notifications.unshift(notif); // Add to beginning
    this.saveNotifications();

    return notif;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      this.saveNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(notif => {
      notif.read = true;
    });
    this.saveNotifications();
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  /**
   * Delete all notifications
   */
  deleteAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get notifications (optionally filter by read status)
   */
  getNotifications(options: { unreadOnly?: boolean; limit?: number } = {}): Notification[] {
    let filtered = [...this.notifications];

    if (options.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Check for new notifications based on current data
   */
  checkNotifications(): Notification[] {
    try {
      const store = useLifeOSStore.getState();
      const tasks = store.tasks || [];
      const goals = store.goals || [];
      const habits = store.habits || [];
      const today = getTodayDateString();

    const newNotifications: Notification[] = [];

    // Check tasks due today or overdue
    tasks.forEach(task => {
      if (task.status === 'done' || task.deletedAt) return;
      if (task.dueDate) {
        const isDueToday = isToday(task.dueDate);
        const isOverdue = isBeforeToday(task.dueDate);

        // Check if notification already exists (same message in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const exists = this.notifications.some(n =>
          n.relatedId === task.id &&
          n.type === 'task' &&
          n.createdAt > oneHourAgo &&
          !n.read
        );

        if (!exists) {
          if (isDueToday) {
            newNotifications.push({
              type: 'task',
              title: 'Công việc đến hạn',
              message: `${task.title} đến hạn hôm nay`,
              urgent: task.priority === 'high',
              relatedId: task.id,
              actionUrl: `/tasks`,
            });
          } else if (isOverdue) {
            newNotifications.push({
              type: 'task',
              title: 'Công việc quá hạn',
              message: `${task.title} đã quá hạn`,
              urgent: true,
              relatedId: task.id,
              actionUrl: `/tasks`,
            });
          }
        }
      }
    });

    // Check goals approaching deadline or overdue
    goals.forEach(goal => {
      if (goal.completedAt || goal.deletedAt) return;
      if (goal.targetDate) {
        const targetDate = parseDateInTimezone(goal.targetDate);
        if (!targetDate) return;

        const todayDate = parseDateInTimezone(today);
        if (!todayDate) return;

        const daysUntilDeadline = Math.floor((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDeadline < 0;
        const isApproaching = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;

        // Check if notification already exists
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const exists = this.notifications.some(n =>
          n.relatedId === goal.id &&
          n.type === 'goal' &&
          n.createdAt > oneHourAgo &&
          !n.read
        );

        if (!exists) {
          if (isOverdue) {
            newNotifications.push({
              type: 'goal',
              title: 'Goal quá hạn',
              message: `${goal.title} đã quá hạn`,
              urgent: true,
              relatedId: goal.id,
              actionUrl: `/goals`,
            });
          } else if (isApproaching) {
            newNotifications.push({
              type: 'goal',
              title: 'Goal sắp đến hạn',
              message: `${goal.title} còn ${daysUntilDeadline} ngày nữa`,
              urgent: daysUntilDeadline <= 3,
              relatedId: goal.id,
              actionUrl: `/goals`,
            });
          }
        }
      }
    });

    // Check habits that need to be completed today
    habits.forEach(habit => {
      if (habit.archivedAt || habit.deletedAt) return;

      const target = habit.targetPerDay || 1;
      const todayCompletion = habit.completions?.find(c => c.date === today);
      const todayCount = todayCompletion?.count || (habit.completedDates.includes(today) ? 1 : 0);

      // Check if habit is not completed today and it's evening (after 18:00)
      if (todayCount < target) {
        const now = new Date();
        const hours = now.getHours();
        
        // Only notify in the evening (after 18:00) to avoid too many notifications
        if (hours >= 18) {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const exists = this.notifications.some(n =>
            n.relatedId === habit.id &&
            n.type === 'habit' &&
            n.createdAt > oneHourAgo &&
            !n.read
          );

          if (!exists) {
            newNotifications.push({
              type: 'habit',
              title: 'Thói quen chưa hoàn thành',
              message: `${habit.name} chưa được hoàn thành hôm nay (${todayCount}/${target})`,
              urgent: false,
              relatedId: habit.id,
              actionUrl: `/habits`,
            });
          }
        }
      }
    });

    // Add new notifications
    newNotifications.forEach(notif => {
      this.addNotification(notif);
    });

    return newNotifications;
    } catch (error) {
      console.warn('[NotificationService] Error checking notifications:', error);
      return [];
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

