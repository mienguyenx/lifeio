// Đồng bộ hộp thư thông báo máy chủ (user_notifications) vào Trung tâm thông báo,
// đăng ký lại push khi mở app, và chạy nhắc nhở cục bộ khi thiết bị chưa bật push.
import { useEffect } from 'react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { notificationService, type Notification } from '@/services/notificationService';
import { useTaskReminder } from '@/hooks/useTaskReminder';
import { useHabitReminder } from '@/hooks/useHabitReminder';
import { ensurePushSubscription, hasPushOnThisDevice } from '@/lib/pwa';

interface Row { id: string; type: string; title: string; body: string | null; url: string | null; read_at: string | null; created_at: string }
const TYPES: Notification['type'][] = ['task', 'goal', 'habit', 'system', 'info', 'success', 'warning', 'error'];

let syncing = false;
export async function syncServerNotifications() {
  if (syncing) return;
  syncing = true;
  try {
    const since = new Date(Date.now() - 14 * 86400_000).toISOString();
    const { data, error } = await supabase.from('user_notifications').select('id,type,title,body,url,read_at,created_at')
      .gte('created_at', since).order('created_at', { ascending: false }).limit(50);
    if (error || !data) return;
    for (const r of [...(data as Row[])].reverse()) {
      notificationService.addNotification(
        { type: TYPES.includes(r.type as Notification['type']) ? (r.type as Notification['type']) : 'info', title: r.title, message: r.body ?? '', urgent: false, actionUrl: r.url ?? undefined },
        { id: `srv-${r.id}`, createdAt: r.created_at, read: !!r.read_at, skipTelegram: true },
      );
    }
  } finally { syncing = false; }
}

export function useNotificationSync(enabled: boolean) {
  const pushHere = enabled && hasPushOnThisDevice();
  // Nhắc nhở trong app chỉ khi thiết bị này chưa nhận push từ máy chủ (tránh trùng)
  useTaskReminder(enabled && !pushHere);
  useHabitReminder(enabled && !pushHere);

  useEffect(() => {
    if (!enabled) return;
    void ensurePushSubscription();
    void syncServerNotifications();
    const onPush = () => void syncServerNotifications();
    const onVis = () => { if (document.visibilityState === 'visible') void syncServerNotifications(); };
    const onRead = (e: Event) => {
      const ids = (e as CustomEvent<string[]>).detail;
      if (ids?.length) void supabase.from('user_notifications').update({ read_at: new Date().toISOString() }).in('id', ids);
    };
    window.addEventListener('lifeos:push', onPush);
    window.addEventListener('lifeos:notif-read', onRead);
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(onPush, 5 * 60_000);
    return () => {
      window.removeEventListener('lifeos:push', onPush);
      window.removeEventListener('lifeos:notif-read', onRead);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(t);
    };
  }, [enabled]);
}
