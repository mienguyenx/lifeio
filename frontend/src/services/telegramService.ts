// LifeOS Telegram Bot Notification Service
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  bot_name: string;
  enabled: boolean;
  notify_tasks: boolean;
  notify_goals: boolean;
  notify_habits: boolean;
  notify_system: boolean;
  notify_daily_briefing: boolean;
  daily_briefing_time: string; // HH:mm
  quiet_hours_start?: string; // HH:mm
  quiet_hours_end?: string;   // HH:mm
  // Message templates (supports {title}, {message}, {emoji} placeholders)
  template_task: string;
  template_goal: string;
  template_habit: string;
  template_system: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
  bot_token: '',
  chat_id: '',
  bot_name: 'LifeOS Bot',
  enabled: false,
  notify_tasks: true,
  notify_goals: true,
  notify_habits: true,
  notify_system: true,
  notify_daily_briefing: true,
  daily_briefing_time: '07:00',
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  template_task: '{emoji} <b>{title}</b>\n{message}',
  template_goal: '{emoji} <b>{title}</b>\n{message}',
  template_habit: '{emoji} <b>{title}</b>\n{message}',
  template_system: '{emoji} <b>{title}</b>\n{message}',
};

class TelegramService {
  private config: TelegramConfig = DEFAULT_CONFIG;
  private configLoaded = false;

  /**
   * Load Telegram config from admin settings
   */
  async loadConfig(): Promise<TelegramConfig> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'telegram_config')
        .single();

      if (!error && data?.value) {
        this.config = { ...DEFAULT_CONFIG, ...(data.value as any) };
      }
      this.configLoaded = true;
    } catch (error) {
      console.warn('[TelegramService] Error loading config:', error);
    }
    return this.config;
  }

  /**
   * Save Telegram config to admin settings
   */
  async saveConfig(config: Partial<TelegramConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...config };

      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'telegram_config',
          value: this.config as any,
          category: 'notifications',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) {
        console.error('[TelegramService] Error saving config:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[TelegramService] Error saving config:', error);
      return false;
    }
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.config.quiet_hours_start || !this.config.quiet_hours_end) return false;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startH, startM] = this.config.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = this.config.quiet_hours_end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Send a message via Telegram Bot API
   */
  async sendMessage(text: string, options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_notification?: boolean;
  }): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfig();
    }

    if (!this.config.enabled || !this.config.bot_token || !this.config.chat_id) {
      return false;
    }

    if (this.isQuietHours()) {
      console.log('[TelegramService] In quiet hours, skipping notification');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.bot_token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chat_id,
          text,
          parse_mode: options?.parse_mode || 'HTML',
          disable_notification: options?.disable_notification || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[TelegramService] Send error:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TelegramService] Send error:', error);
      return false;
    }
  }

  /**
   * Send notification based on type
   */
  async sendNotification(options: {
    type: 'task' | 'goal' | 'habit' | 'system';
    title: string;
    message: string;
    urgent?: boolean;
  }): Promise<boolean> {
    if (!this.configLoaded) {
      await this.loadConfig();
    }

    if (!this.config.enabled) return false;

    // Check notification type is enabled
    switch (options.type) {
      case 'task':
        if (!this.config.notify_tasks) return false;
        break;
      case 'goal':
        if (!this.config.notify_goals) return false;
        break;
      case 'habit':
        if (!this.config.notify_habits) return false;
        break;
      case 'system':
        if (!this.config.notify_system) return false;
        break;
    }

    const emoji = this.getEmoji(options.type, options.urgent);
    const templateKey = `template_${options.type}` as keyof TelegramConfig;
    const template = (this.config[templateKey] as string) || '{emoji} <b>{title}</b>\n{message}';
    const text = template
      .replace(/\{emoji\}/g, emoji)
      .replace(/\{title\}/g, options.title)
      .replace(/\{message\}/g, options.message)
      .replace(/\{bot_name\}/g, this.config.bot_name || 'LifeOS Bot')
      .replace(/\{time\}/g, new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));

    return this.sendMessage(text, {
      disable_notification: !options.urgent,
    });
  }

  /**
   * Get emoji for notification type
   */
  private getEmoji(type: string, urgent?: boolean): string {
    if (urgent) return '🚨';
    switch (type) {
      case 'task': return '📋';
      case 'goal': return '🎯';
      case 'habit': return '🔄';
      case 'system': return 'ℹ️';
      default: return '📌';
    }
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(data: {
    tasksCompleted: number;
    tasksPending: number;
    tasksOverdue: number;
    habitsCompleted: number;
    habitsTotal: number;
    goalsProgress: Array<{ title: string; progress: number }>;
  }): Promise<boolean> {
    if (!this.config.enabled) return false;

    const lines: string[] = [
      `📊 <b>LifeOS Daily Summary</b>`,
      ``,
      `📋 <b>Tasks:</b> ${data.tasksCompleted} done | ${data.tasksPending} pending | ${data.tasksOverdue} overdue`,
      `🔄 <b>Habits:</b> ${data.habitsCompleted}/${data.habitsTotal} completed`,
    ];

    if (data.goalsProgress.length > 0) {
      lines.push(``, `🎯 <b>Goals:</b>`);
      data.goalsProgress.slice(0, 5).forEach(g => {
        const bar = '█'.repeat(Math.round(g.progress / 10)) + '░'.repeat(10 - Math.round(g.progress / 10));
        lines.push(`  ${bar} ${g.progress}% - ${g.title}`);
      });
    }

    return this.sendMessage(lines.join('\n'));
  }

  /**
   * Test the connection
   */
  async testConnection(botToken?: string, chatId?: string): Promise<{ success: boolean; message: string }> {
    const token = botToken || this.config.bot_token;
    const chat = chatId || this.config.chat_id;

    if (!token || !chat) {
      return { success: false, message: 'Bot Token và Chat ID không được để trống' };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: '✅ <b>LifeOS Connected!</b>\nTelegram notification đã được kết nối thành công.',
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.description || `HTTP ${response.status}`,
        };
      }

      return { success: true, message: 'Kết nối thành công! Kiểm tra tin nhắn trên Telegram.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Lỗi kết nối' };
    }
  }

  getConfig(): TelegramConfig {
    return { ...this.config };
  }
}

export const telegramService = new TelegramService();
