import { useCallback } from 'react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { UserPreferences } from '@/types/lifeos';

/**
 * Syncs user onboarding/preferences state with Supabase user_settings table.
 * Solves: onboarding showing again when user logs in from a new browser profile.
 *
 * Requires migration: add-onboarding-preferences.sql
 */
export function usePreferencesSync() {
  const { user } = useAuth();
  const setUserPreferences = useLifeOSStore((s) => s.setUserPreferences);
  const userPreferences = useLifeOSStore((s) => s.userPreferences);

  /** Called on app load — pull onboarding state from Supabase */
  const loadOnboardingState = useCallback(async (): Promise<boolean | null> => {
    if (!user) return null;
    // Tên hiển thị: lấy từ hồ sơ (đã nhập lúc đăng ký) nếu store chưa có — không hỏi lại trong onboarding.
    const cur = (useLifeOSStore.getState().user?.name || '').trim();
    if (!cur || cur === 'User') {
      supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()
        .then(({ data: p }) => {
          const n = ((p as { name?: string } | null)?.name || '').trim();
          if (n) useLifeOSStore.getState().setUser({ name: n });
        }, () => {});
    }
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('onboarding_completed, preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const completed = data.onboarding_completed ?? false;

      // Merge remote preferences into local store (remote wins)
      const raw = (data.preferences || {}) as Record<string, unknown>;
      const remotePrefs = { ...raw } as Partial<UserPreferences>;
      if (raw.ai_tone) remotePrefs.aiTone = raw.ai_tone as UserPreferences['aiTone'];
      if (raw.planning_style) remotePrefs.planningStyle = raw.planning_style as UserPreferences['planningStyle'];
      if (raw.wake_up_time) remotePrefs.wakeUpTime = raw.wake_up_time as string;
      if (raw.sleep_time) remotePrefs.sleepTime = raw.sleep_time as string;
      if (Array.isArray(raw.life_area_priorities)) remotePrefs.lifeAreaPriorities = raw.life_area_priorities as UserPreferences['lifeAreaPriorities'];
      remotePrefs.enabledModules = Array.isArray(raw.enabled_modules) ? (raw.enabled_modules as string[]) : undefined;
      if (raw.onboarding_need) remotePrefs.onboardingNeed = raw.onboarding_need as string;
      if (raw.onboarding_focus) remotePrefs.onboardingFocus = raw.onboarding_focus as string;
      setUserPreferences({ ...remotePrefs, onboardingCompleted: completed });

      return completed;
    } catch (err) {
      console.error('[PreferencesSync] loadOnboardingState error:', err);
      return null;
    }
  }, [user, setUserPreferences]);

  /** Called when user completes onboarding — saves to Supabase */
  const saveOnboardingCompleted = useCallback(async (prefs: Partial<UserPreferences>) => {
    if (!user) return;
    try {
      const payload: Record<string, unknown> = {};
      // Store non-sensitive prefs as JSON blob
      if (prefs.archetype) payload.archetype = prefs.archetype;
      if (prefs.aiTone) payload.ai_tone = prefs.aiTone;
      if (prefs.planningStyle) payload.planning_style = prefs.planningStyle;
      if (prefs.wakeUpTime) payload.wake_up_time = prefs.wakeUpTime;
      if (prefs.sleepTime) payload.sleep_time = prefs.sleepTime;
      if (prefs.lifeAreaPriorities) payload.life_area_priorities = prefs.lifeAreaPriorities;
      if (prefs.enabledModules) payload.enabled_modules = prefs.enabledModules;
      if (prefs.onboardingNeed) payload.onboarding_need = prefs.onboardingNeed;
      if (prefs.onboardingFocus) payload.onboarding_focus = prefs.onboardingFocus;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          preferences: payload,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      console.log('[PreferencesSync] Onboarding saved to Supabase');
    } catch (err) {
      console.error('[PreferencesSync] saveOnboardingCompleted error:', err);
    }
  }, [user]);

  /** Bật/tắt tính năng — gộp vào preferences hiện có trên server. */
  const saveEnabledModules = useCallback(async (modules: string[]) => {
    setUserPreferences({ enabledModules: modules });
    if (!user) return;
    try {
      const { data } = await supabase.from('user_settings').select('preferences, onboarding_completed').eq('user_id', user.id).maybeSingle();
      const preferences = { ...((data?.preferences as Record<string, unknown>) || {}), enabled_modules: modules };
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        onboarding_completed: data?.onboarding_completed ?? true,
        preferences,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (err) {
      console.error('[PreferencesSync] saveEnabledModules error:', err);
    }
  }, [user, setUserPreferences]);

  /** Admin: reset onboarding for a specific user ID */
  const resetOnboardingForUser = useCallback(async (targetUserId: string) => {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: targetUserId,
        onboarding_completed: false,
        preferences: {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
  }, []);

  return {
    loadOnboardingState,
    saveOnboardingCompleted,
    saveEnabledModules,
    resetOnboardingForUser,
  };
}
