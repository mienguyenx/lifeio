import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lifeos.kanban.preferences';

interface KanbanPreferences {
  collapsedColumns: string[];
  focusMode: boolean;
  tasksPerColumn: number;
  autoCollapseCompleted: boolean;
}

const DEFAULT_PREFERENCES: KanbanPreferences = {
  collapsedColumns: [],
  focusMode: false,
  tasksPerColumn: 0, // 0 = unlimited
  autoCollapseCompleted: true,
};

export function useKanbanPreferences() {
  const [preferences, setPreferences] = useState<KanbanPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  // Auto-collapse done/deferred on first load
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (!hasInitialized && preferences.autoCollapseCompleted) {
      const storedCollapsed = preferences.collapsedColumns;
      // Only auto-collapse if user hasn't manually changed
      if (storedCollapsed.length === 0) {
        setPreferences(prev => ({
          ...prev,
          collapsedColumns: ['done', 'deferred'],
        }));
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, preferences.autoCollapseCompleted, preferences.collapsedColumns]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  const toggleColumnCollapse = (column: string) => {
    setPreferences(prev => ({
      ...prev,
      collapsedColumns: prev.collapsedColumns.includes(column)
        ? prev.collapsedColumns.filter(c => c !== column)
        : [...prev.collapsedColumns, column],
    }));
  };

  const toggleFocusMode = () => {
    setPreferences(prev => ({
      ...prev,
      focusMode: !prev.focusMode,
    }));
  };

  const setTasksPerColumn = (count: number) => {
    setPreferences(prev => ({
      ...prev,
      tasksPerColumn: count,
    }));
  };

  const setAutoCollapseCompleted = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      autoCollapseCompleted: enabled,
    }));
  };

  return {
    ...preferences,
    toggleColumnCollapse,
    toggleFocusMode,
    setTasksPerColumn,
    setAutoCollapseCompleted,
  };
}
