import { useState, useEffect } from 'react';

export type HabitViewMode = 'compact' | 'standard' | 'detailed';

interface HabitViewPreferences {
  viewMode: HabitViewMode;
  groupByArea: boolean;
}

const STORAGE_KEY = 'lifeos.habits.viewPreferences';

const DEFAULT_PREFERENCES: HabitViewPreferences = {
  viewMode: 'standard',
  groupByArea: false,
};

export function useHabitViewPreferences() {
  const [preferences, setPreferences] = useState<HabitViewPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setViewMode = (viewMode: HabitViewMode) => {
    setPreferences(prev => ({ ...prev, viewMode }));
  };

  const setGroupByArea = (groupByArea: boolean) => {
    setPreferences(prev => ({ ...prev, groupByArea }));
  };

  const toggleGroupByArea = () => {
    setPreferences(prev => ({ ...prev, groupByArea: !prev.groupByArea }));
  };

  return {
    ...preferences,
    setViewMode,
    setGroupByArea,
    toggleGroupByArea,
  };
}
