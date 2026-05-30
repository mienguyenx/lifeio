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

const LIFEOOS_URL = 'https://life.hoanong.com';
const SUPABASE_URL = 'https://supabase.hoanong.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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

  // Gọi Supabase REST API
  async callSupabaseAPI(endpoint, options = {}) {
    const session = await this.getSession() || await this.getSessionFromPage();
    
    if (!session || !session.access_token) {
      throw new Error('Not authenticated');
    }

    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Session expired');
      }
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  // Lấy habits
  async getHabits() {
    if (!this.userId) {
      await this.getSession() || await this.getSessionFromPage();
    }
    if (!this.userId) return [];

    try {
      const habits = await this.callSupabaseAPI(
        `habits?user_id=eq.${this.userId}&deleted_at=is.null&select=*&order=created_at.desc`
      );
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
      const tasks = await this.callSupabaseAPI(
        `tasks?user_id=eq.${this.userId}&deleted_at=is.null&select=*&order=created_at.desc`
      );
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
      const goals = await this.callSupabaseAPI(
        `goals?user_id=eq.${this.userId}&deleted_at=is.null&select=*&order=created_at.desc`
      );
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
      const completions = await this.callSupabaseAPI(
        `habit_completions?date=eq.${today}&select=habit_id`
      );
      return completions.map(c => c.habit_id) || [];
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
      const tasks = await this.callSupabaseAPI(
        `tasks?user_id=eq.${this.userId}&status=eq.done&completed_at=gte.${today}T00:00:00&select=id`
      );
      return tasks.length || 0;
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
      
      const result = await this.callSupabaseAPI('habit_completions', {
        method: 'POST',
        headers: {
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          habit_id: habitId,
          date: dateToUse,
          user_id: this.userId,
        }),
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
      const result = await this.callSupabaseAPI(
        `habit_completions?habit_id=eq.${habitId}&date=eq.${today}`,
        {
          method: 'DELETE',
        }
      );
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
      
      const result = await this.callSupabaseAPI(`tasks?id=eq.${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'done',
          completed_at: completedAt,
        }),
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

