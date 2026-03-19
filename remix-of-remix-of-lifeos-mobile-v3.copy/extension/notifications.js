// LifeOS Notifications Module
// Quản lý thông báo và danh sách thông báo

(function() {
  'use strict';

  // Notification Manager
  const NotificationManager = {
    notifications: [],
    maxNotifications: 50, // Giới hạn số lượng thông báo lưu trữ
    
    /**
     * Initialize notifications module
     */
    init() {
      // Load notifications from storage
      this.loadNotifications();
      
      // Listen for storage changes
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName === 'local' && changes.lifeOSNotifications) {
            this.notifications = changes.lifeOSNotifications.newValue || [];
          }
        });
      }
    },
    
    /**
     * Load notifications from storage
     */
    loadNotifications() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['lifeOSNotifications'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('[Notifications] Storage error:', chrome.runtime.lastError.message);
            this.notifications = [];
            return;
          }
          
          this.notifications = result.lifeOSNotifications || [];
        });
      }
    },
    
    /**
     * Save notifications to storage
     */
    saveNotifications() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Limit notifications count
        if (this.notifications.length > this.maxNotifications) {
          this.notifications = this.notifications.slice(-this.maxNotifications);
        }
        
        chrome.storage.local.set({ lifeOSNotifications: this.notifications }, () => {
          if (chrome.runtime.lastError) {
            console.warn('[Notifications] Error saving notifications:', chrome.runtime.lastError.message);
          }
        });
      }
    },
    
    /**
     * Add a notification
     */
    addNotification(notification) {
      const notif = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: notification.type || 'info', // 'info', 'success', 'error', 'warning'
        title: notification.title || '',
        message: notification.message || '',
        urgent: notification.urgent || false,
        read: false,
        createdAt: new Date().toISOString(),
        ...notification
      };
      
      this.notifications.unshift(notif); // Add to beginning
      this.saveNotifications();
      
      return notif;
    },
    
    /**
     * Mark notification as read
     */
    markAsRead(notificationId) {
      const notif = this.notifications.find(n => n.id === notificationId);
      if (notif) {
        notif.read = true;
        this.saveNotifications();
      }
    },
    
    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
      this.notifications.forEach(notif => {
        notif.read = true;
      });
      this.saveNotifications();
    },
    
    /**
     * Delete notification
     */
    deleteNotification(notificationId) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.saveNotifications();
    },
    
    /**
     * Delete all notifications
     */
    deleteAllNotifications() {
      this.notifications = [];
      this.saveNotifications();
    },
    
    /**
     * Get unread count
     */
    getUnreadCount() {
      return this.notifications.filter(n => !n.read).length;
    },
    
    /**
     * Get notifications (optionally filter by read status)
     */
    getNotifications(options = {}) {
      let filtered = [...this.notifications];
      
      if (options.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      
      return filtered;
    },
    
    /**
     * Check for new notifications based on data
     */
    checkNotifications(data, settings) {
      if (!data || !settings || !settings.enableNotifications) return;
      
      const notifications = [];
      
      // Use timezone-aware date utilities if available
      const isTodayCheck = typeof isToday !== 'undefined' ? isToday : null;
      const isBeforeTodayCheck = typeof isBeforeToday !== 'undefined' ? isBeforeToday : null;
      const getTodayDateString = typeof getTodayDateString !== 'undefined' ? getTodayDateString : null;
      
      // Check tasks due today or overdue
      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach(task => {
          if (task.status === 'done' || task.deleted_at) return;
          if (task.due_date) {
            let isDueToday = false;
            let isOverdue = false;
            
            if (isTodayCheck && isBeforeTodayCheck) {
              isDueToday = isTodayCheck(task.due_date);
              isOverdue = isBeforeTodayCheck(task.due_date);
            } else {
              // Fallback
              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              isDueToday = dueDate.getTime() === today.getTime();
              isOverdue = dueDate < today;
            }
            
            if (isDueToday) {
              notifications.push({
                type: 'task',
                title: 'Công việc đến hạn',
                message: `"${task.title}" đến hạn hôm nay`,
                urgent: task.priority === 'high',
                taskId: task.id
              });
            } else if (isOverdue) {
              notifications.push({
                type: 'task',
                title: 'Công việc quá hạn',
                message: `"${task.title}" đã quá hạn`,
                urgent: true,
                taskId: task.id
              });
            }
          }
        });
      }
      
      // Check habits that need to be completed today
      if (data.habits && Array.isArray(data.habits)) {
        const today = getTodayDateString ? getTodayDateString() : new Date().toISOString().split('T')[0];
        const completedHabits = data.completedHabits || [];
        
        data.habits.forEach(habit => {
          if (habit.deleted_at) return;
          
          // Check if habit is not completed today
          if (!completedHabits.includes(habit.id)) {
            notifications.push({
              type: 'habit',
              title: 'Thói quen chưa hoàn thành',
              message: `"${habit.name || habit.title}" chưa được hoàn thành hôm nay`,
              urgent: false,
              habitId: habit.id
            });
          }
        });
      }
      
      // Add new notifications (avoid duplicates)
      notifications.forEach(notif => {
        // Check if notification already exists (same message in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const exists = this.notifications.some(n => 
          n.message === notif.message && 
          n.createdAt > oneHourAgo &&
          !n.read
        );
        
        if (!exists) {
          this.addNotification(notif);
        }
      });
      
      return notifications;
    }
  };
  
  // Initialize on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
    } else {
      NotificationManager.init();
    }
  } else {
    NotificationManager.init();
  }
  
  // Export for use in other files
  if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
  }
  
  // For widget.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
  }
})();

