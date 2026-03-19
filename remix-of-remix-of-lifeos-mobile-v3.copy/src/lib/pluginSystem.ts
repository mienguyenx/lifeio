import { createContext, useContext } from 'react';
import type { Plugin } from '@/hooks/useAdminData';

// Plugin hook types - defines extension points in the application
export type PluginHookName = 
  | 'dashboard.widget'
  | 'dashboard.stats'
  | 'goals.suggestions'
  | 'goals.toolbar'
  | 'habits.suggestions'
  | 'habits.display'
  | 'tasks.toolbar'
  | 'journal.toolbar'
  | 'settings.section'
  | 'global.overlay'
  | 'sidebar.item'
  | 'cron.daily'
  | 'cron.weekly';

// Plugin component registration
export interface PluginComponent {
  pluginSlug: string;
  hookName: PluginHookName;
  component: React.ComponentType<PluginComponentProps>;
  priority?: number;
}

export interface PluginComponentProps {
  plugin: Plugin;
  config: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
}

// Plugin registry for runtime component registration
class PluginRegistry {
  private components: Map<string, PluginComponent[]> = new Map();
  private listeners: Set<() => void> = new Set();

  register(component: PluginComponent) {
    const existing = this.components.get(component.hookName) || [];
    existing.push(component);
    existing.sort((a, b) => (a.priority || 10) - (b.priority || 10));
    this.components.set(component.hookName, existing);
    this.notifyListeners();
  }

  unregister(pluginSlug: string, hookName?: PluginHookName) {
    if (hookName) {
      const existing = this.components.get(hookName) || [];
      this.components.set(hookName, existing.filter(c => c.pluginSlug !== pluginSlug));
    } else {
      // Remove from all hooks
      this.components.forEach((components, key) => {
        this.components.set(key, components.filter(c => c.pluginSlug !== pluginSlug));
      });
    }
    this.notifyListeners();
  }

  getComponents(hookName: PluginHookName): PluginComponent[] {
    return this.components.get(hookName) || [];
  }

  getAllComponents(): PluginComponent[] {
    const all: PluginComponent[] = [];
    this.components.forEach(components => all.push(...components));
    return all;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const pluginRegistry = new PluginRegistry();

// Plugin Context for accessing active plugins
export interface PluginContextValue {
  plugins: Plugin[];
  activePlugins: Plugin[];
  isPluginActive: (slug: string) => boolean;
  getPluginConfig: (slug: string) => Record<string, unknown>;
  getComponentsForHook: (hookName: PluginHookName) => PluginComponent[];
}

export const PluginContext = createContext<PluginContextValue | null>(null);

export function usePluginContext() {
  const context = useContext(PluginContext);
  if (!context) {
    // Return a default context if not provided
    return {
      plugins: [],
      activePlugins: [],
      isPluginActive: () => false,
      getPluginConfig: () => ({}),
      getComponentsForHook: () => [],
    };
  }
  return context;
}

// Hook descriptions for documentation
export const hookDescriptions: Record<PluginHookName, string> = {
  'dashboard.widget': 'Widget displayed on the dashboard page',
  'dashboard.stats': 'Additional statistics on the dashboard',
  'goals.suggestions': 'AI suggestions for goals',
  'goals.toolbar': 'Toolbar actions on the goals page',
  'habits.suggestions': 'AI suggestions for habits',
  'habits.display': 'Custom display elements for habits',
  'tasks.toolbar': 'Toolbar actions on the tasks page',
  'journal.toolbar': 'Toolbar actions on the journal page',
  'settings.section': 'Additional section in settings page',
  'global.overlay': 'Global overlay components (modals, notifications)',
  'sidebar.item': 'Additional sidebar navigation items',
  'cron.daily': 'Daily scheduled task execution',
  'cron.weekly': 'Weekly scheduled task execution',
};

// Category metadata
export const pluginCategories = {
  productivity: { label: 'Productivity', icon: 'clock', color: 'blue' },
  ai: { label: 'AI & Intelligence', icon: 'brain', color: 'purple' },
  utilities: { label: 'Utilities', icon: 'wrench', color: 'gray' },
  notifications: { label: 'Notifications', icon: 'bell', color: 'yellow' },
  gamification: { label: 'Gamification', icon: 'trophy', color: 'amber' },
  integration: { label: 'Integrations', icon: 'plug', color: 'green' },
  general: { label: 'General', icon: 'puzzle', color: 'slate' },
} as const;

export type PluginCategory = keyof typeof pluginCategories;