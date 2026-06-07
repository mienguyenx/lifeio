// LifeOS Widget API Service
// Gọi Supabase API để lấy dữ liệu

// Load utils if available (will be loaded before this script)
const DateUtils = typeof getTodayDateString !== 'undefined' ? {
  getTodayDateString,
  parseDateInTimezone,
  formatDateInTimezone,
  isToday,
  isBeforeToday
} : null;

// Base URL of the LifeOS REST API (…/api/v1). Resolved from config.js, with a
// safe fallback for local dev. No anon key needed — auth is the user's JWT.
function getApiBase() {
  const cfg = (typeof self !== 'undefined' && self.LIFEOS_CONFIG) || null;
  return (cfg && cfg.apiUrl) || 'http://localhost:4000/api/v1';
}

class LifeOSAPI {
  constructor() {
    this.session = null;
    this.userId = null;
  }

  // Lấy session từ localStorage (qua postMessage từ content script)
  async getSession() {
    return new Promise((resolve) => {
      // 1. Thử lấy từ chrome.storage trước (nhanh hơn, đáng tin cậy hơn)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['lifeOSSession', 'external-supabase-auth-token'], (result) => {
          if (result.lifeOSSession && result.lifeOSSession.access_token) {
            this.session = result.lifeOSSession;
            this.userId = this.session?.user?.id;
            resolve(this.session);
            return;
          }
          
          // Try parsing from external-supabase-auth-token
          if (result['external-supabase-auth-token']) {
            try {
              const parsed = JSON.parse(result['external-supabase-auth-token']);
              if (parsed && parsed.access_token) {
                this.session = parsed;
                this.userId = this.session?.user?.id;
                resolve(this.session);
                return;
              }
            } catch (e) {
              // Continue to next method
            }
          }
          
          // 2. Fallback: Request from parent window
          this.getSessionFromParent().then(resolve);
        });
      } else {
        // Không phải extension, dùng postMessage
        this.getSessionFromParent().then(resolve);
      }
    });
  }
  
  // Helper: Get session from parent window
  async getSessionFromParent() {
    return new Promise((resolve) => {
      // Request session from parent window (content script)
      window.parent.postMessage({ action: 'getSession' }, '*');

      // Listen for response
      const messageHandler = (event) => {
        if (event.data.action === 'session') {
          window.removeEventListener('message', messageHandler);
          this.session = event.data.session;
          this.userId = this.session?.user?.id;
          resolve(this.session);
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve(null);
      }, 2000);
    });
  }

  // Lấy session từ trang web LifeOS (fallback)
  async getSessionFromPage() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: 'getSessionFromTab' }, (response) => {
          // Check for runtime errors
          if (chrome.runtime.lastError) {
            console.warn('Runtime error:', chrome.runtime.lastError.message);
            resolve(null);
            return;
          }
          
          if (response && response.session) {
            this.session = response.session;
            this.userId = this.session?.user?.id;
            resolve(response.session);
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        resolve(null);
      }
    });
  }

  // Call the LifeOS data gateway (/db/query|insert|update|delete).
  // Rows are auto-scoped to the authenticated user server-side, so callers
  // don't pass a user_id filter. Returns the `data` payload (throws on error).
  async callGateway(action, body) {
    const session = await this.getSession() || await this.getSessionFromPage();

    if (!session || !session.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${getApiBase()}/db/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Session expired');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    if (json && json.error) {
      throw new Error(json.error.message || 'Gateway error');
    }
    return json ? json.data : null;
  }

  // Lấy habits
  async getHabits() {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) return [];

    try {
      const habits = await this.callGateway('query', {
        table: 'habits',
        filters: [{ column: 'deleted_at', op: 'is', value: null }],
        order: [{ column: 'created_at', ascending: false }],
      });
      return habits || [];
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  }

  // Lấy tasks
  async getTasks() {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) return [];

    try {
      const tasks = await this.callGateway('query', {
        table: 'tasks',
        filters: [{ column: 'deleted_at', op: 'is', value: null }],
        order: [{ column: 'created_at', ascending: false }],
      });
      return tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Lấy goals
  async getGoals() {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) return [];

    try {
      const goals = await this.callGateway('query', {
        table: 'goals',
        filters: [{ column: 'deleted_at', op: 'is', value: null }],
        order: [{ column: 'created_at', ascending: false }],
      });
      return goals || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  // Lấy habit completions hôm nay
  async getTodayHabitCompletions() {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) return [];

    try {
      // Use timezone-aware date utility
      const today = DateUtils ? DateUtils.getTodayDateString() : new Date().toISOString().split('T')[0];
      const completions = await this.callGateway('query', {
        table: 'habit_completions',
        select: ['habit_id'],
        filters: [{ column: 'date', op: 'eq', value: today }],
      });
      return (completions || []).map(c => c.habit_id);
    } catch (error) {
      console.error('Error fetching habit completions:', error);
      return [];
    }
  }

  // Lấy tasks hoàn thành hôm nay
  async getTodayCompletedTasks() {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) return 0;

    try {
      // Use timezone-aware date utility
      const today = DateUtils ? DateUtils.getTodayDateString() : new Date().toISOString().split('T')[0];
      const tasks = await this.callGateway('query', {
        table: 'tasks',
        select: ['id'],
        filters: [
          { column: 'status', op: 'eq', value: 'done' },
          { column: 'completed_at', op: 'gte', value: `${today}T00:00:00` },
        ],
      });
      return (tasks || []).length;
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      return 0;
    }
  }

  // Lấy tất cả dữ liệu
  async getAllData() {
    try {
      const [habits, tasks, goals, completedHabits, completedTasks] = await Promise.all([
        this.getHabits(),
        this.getTasks(),
        this.getGoals(),
        this.getTodayHabitCompletions(),
        this.getTodayCompletedTasks(),
      ]);

      return {
        habits,
        tasks,
        goals,
        completedHabits,
        completedTasks,
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
  }

  // Complete habit
  async completeHabit(habitId, date) {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) throw new Error('Not authenticated');

    try {
      // Use timezone-aware date if date not provided
      const dateToUse = date || (DateUtils ? DateUtils.getTodayDateString() : new Date().toISOString().split('T')[0]);
      
      const result = await this.callGateway('insert', {
        table: 'habit_completions',
        rows: [{ habit_id: habitId, date: dateToUse }],
      });
      return result;
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  }

  // Uncomplete habit
  async uncompleteHabit(habitId) {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) throw new Error('Not authenticated');

    try {
      // Use timezone-aware date utility
      const today = DateUtils ? DateUtils.getTodayDateString() : new Date().toISOString().split('T')[0];
      const result = await this.callGateway('delete', {
        table: 'habit_completions',
        filters: [
          { column: 'habit_id', op: 'eq', value: habitId },
          { column: 'date', op: 'eq', value: today },
        ],
      });
      return result;
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  }

  // Complete task
  async completeTask(taskId) {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) throw new Error('Not authenticated');

    try {
      // Use current time in ISO format (timezone will be handled by server)
      const completedAt = new Date().toISOString();

      const result = await this.callGateway('update', {
        table: 'tasks',
        set: { status: 'done', completed_at: completedAt },
        filters: [{ column: 'id', op: 'eq', value: taskId }],
      });
      return result;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }
}

// Export singleton
const lifeOSAPI = new LifeOSAPI();

