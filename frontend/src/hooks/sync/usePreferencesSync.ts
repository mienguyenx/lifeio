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
      const remotePrefs = (data.preferences || {}) as Partial<UserPreferences>;
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
    resetOnboardingForUser,
  };
}
