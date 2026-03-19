import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Plugins
export interface Plugin {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string | null;
  author: string | null;
  icon: string;
  category: string;
  config: Record<string, unknown>;
  default_config: Record<string, unknown>;
  hooks: string[];
  permissions: string[];
  entry_point: string | null;
  admin_page: boolean;
  sidebar_item: boolean;
  dashboard_widget: boolean;
  is_active: boolean;
  is_system: boolean;
  installed_at: string;
  updated_at: string;
  repository_url: string | null;
  documentation_url: string | null;
  changelog: unknown[];
}

export function usePlugins() {
  return useQuery({
    queryKey: ['admin', 'plugins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_plugins')
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data as Plugin[];
    },
  });
}

export function useUpdatePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active, config }: { id: string; is_active?: boolean; config?: Json }) => {
      const updates: Record<string, unknown> = {};
      if (is_active !== undefined) updates.is_active = is_active;
      if (config !== undefined) updates.config = config;
      const { error } = await supabase.from('admin_plugins').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plugins'] });
      toast.success('Plugin updated');
    },
    onError: () => toast.error('Failed to update plugin'),
  });
}

export function useCreatePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plugin: { name: string; slug: string; description?: string; author?: string; category?: string; hooks?: string[]; default_config?: Json }) => {
      const { error } = await supabase.from('admin_plugins').insert({
        name: plugin.name,
        slug: plugin.slug,
        description: plugin.description || null,
        author: plugin.author || null,
        category: plugin.category || 'general',
        hooks: plugin.hooks || [],
        default_config: plugin.default_config || {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plugins'] });
      toast.success('Plugin created');
    },
    onError: () => toast.error('Failed to create plugin'),
  });
}

export function useDeletePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_plugins').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plugins'] });
      toast.success('Plugin deleted');
    },
    onError: () => toast.error('Failed to delete plugin'),
  });
}

// Types
export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  metadata: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  environment: 'all' | 'development' | 'production';
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  updated_at: string;
}

// Hooks
export function useSystemLogs() {
  return useQuery({
    queryKey: ['admin', 'system-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SystemLog[];
    },
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Feature flag updated');
    },
    onError: (error) => {
      toast.error('Failed to update feature flag');
      console.error(error);
    },
  });
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (flag: { name: string; description?: string; enabled?: boolean; environment?: string }) => {
      const { error } = await supabase.from('feature_flags').insert({
        name: flag.name,
        description: flag.description || null,
        enabled: flag.enabled ?? false,
        environment: flag.environment || 'all',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Feature flag created');
    },
    onError: () => toast.error('Failed to create feature flag'),
  });
}

export function useDeleteFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feature_flags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Feature flag deleted');
    },
    onError: () => toast.error('Failed to delete feature flag'),
  });
}

export function useCreateSystemLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: { level: string; message: string; metadata?: Json }) => {
      const { error } = await supabase.from('system_logs').insert([log]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-logs'] });
    },
    onError: () => toast.error('Failed to create log'),
  });
}

export function useClearSystemLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (beforeDate?: string) => {
      let query = supabase.from('system_logs').delete();
      if (beforeDate) {
        query = query.lt('created_at', beforeDate);
      } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-logs'] });
      toast.success('Logs cleared');
    },
    onError: () => toast.error('Failed to clear logs'),
  });
}

export function useCreateAdminSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: { key: string; value: Json; description?: string }) => {
      const { error } = await supabase.from('admin_settings').insert(setting);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Setting created');
    },
    onError: () => toast.error('Failed to create setting'),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data as AdminSetting[];
    },
  });
}

export function useUpdateAdminSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Setting updated');
    },
    onError: (error) => {
      toast.error('Failed to update setting');
      console.error(error);
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ['admin', 'user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserRole[];
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      // Get counts from various tables
      const [
        profilesResult,
        goalsResult,
        habitsResult,
        tasksResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('goals').select('id', { count: 'exact', head: true }),
        supabase.from('habits').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: profilesResult.count || 0,
        totalGoals: goalsResult.count || 0,
        totalHabits: habitsResult.count || 0,
        totalTasks: tasksResult.count || 0,
      };
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-roles'] });
      toast.success('User role updated');
    },
    onError: (error) => {
      toast.error('Failed to update user role');
      console.error(error);
    },
  });
}

export function useUpdateProfileName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      // Cập nhật cả full_name và name nếu có
      const { error } = await supabase
        .from('profiles')
        .update({ name, full_name: name })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-stats'] });
      toast.success('Đã cập nhật tên người dùng');
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    },
  });
}

// Templates
export interface AdminTemplate {
  id: string;
  type: 'goals' | 'habits' | 'journal' | 'review' | 'tasks';
  name: string;
  description: string | null;
  content: Json;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export function useAdminTemplates(type?: string) {
  return useQuery({
    queryKey: ['admin', 'templates', type],
    queryFn: async () => {
      let query = supabase.from('admin_templates').select('*').order('name');
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return data as AdminTemplate[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: { name: string; type: string; description?: string; content: Json; is_active?: boolean }) => {
      const { error } = await supabase.from('admin_templates').insert({
        name: template.name,
        type: template.type,
        description: template.description || null,
        content: template.content,
        is_active: template.is_active ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
      toast.success('Template created');
    },
    onError: () => toast.error('Failed to create template'),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean; name?: string; description?: string; content?: Json; usage_count?: number }) => {
      const { error } = await supabase.from('admin_templates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
      // Only show toast if not just updating usage_count
      if (!variables.usage_count || Object.keys(variables).length > 2) {
        toast.success('Template updated');
      }
    },
    onError: () => toast.error('Failed to update template'),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });
}

export function useGenerateTemplatesWithAI() {
  return useMutation({
    mutationFn: async ({ type, prompt, category }: { type: string; prompt?: string; category?: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-template-generate', {
        body: { type, prompt, category }
      });
      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      if (error?.message?.includes('429')) {
        toast.error('Rate limit exceeded, please try again later');
      } else if (error?.message?.includes('402')) {
        toast.error('AI credits required, please add funds');
      } else {
        toast.error('Failed to generate templates');
      }
    },
  });
}

// Themes
export interface AdminTheme {
  id: string;
  name: string;
  description: string | null;
  colors: Json;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useAdminThemes() {
  return useQuery({
    queryKey: ['admin', 'themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_themes').select('*').order('name');
      if (error) throw error;
      return data as AdminTheme[];
    },
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean; is_default?: boolean; name?: string; description?: string; colors?: Json }) => {
      const { error } = await supabase.from('admin_themes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
      toast.success('Theme updated');
    },
    onError: () => toast.error('Failed to update theme'),
  });
}

export function useCreateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (theme: { name: string; description?: string; colors: Json }) => {
      const { error } = await supabase.from('admin_themes').insert({
        name: theme.name,
        description: theme.description || null,
        colors: theme.colors,
        is_active: false,
        is_default: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
      toast.success('Theme created');
    },
    onError: () => toast.error('Failed to create theme'),
  });
}

export function useDeleteTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_themes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'themes'] });
      toast.success('Theme deleted');
    },
    onError: () => toast.error('Failed to delete theme'),
  });
}

// Languages
export interface AdminLanguage {
  id: string;
  code: string;
  name: string;
  native_name: string;
  flag: string | null;
  is_active: boolean;
  translation_progress: number;
  created_at: string;
  updated_at: string;
}

export function useAdminLanguages() {
  return useQuery({
    queryKey: ['admin', 'languages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_languages').select('*').order('name');
      if (error) throw error;
      return data as AdminLanguage[];
    },
  });
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; is_active?: boolean; name?: string; native_name?: string; code?: string; flag?: string; translation_progress?: number }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from('admin_languages').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'languages'] });
      toast.success('Language updated');
    },
    onError: () => toast.error('Failed to update language'),
  });
}

export function useCreateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (language: { code: string; name: string; native_name: string; flag?: string }) => {
      const { error } = await supabase.from('admin_languages').insert(language);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'languages'] });
      toast.success('Language created');
    },
    onError: () => toast.error('Failed to create language'),
  });
}

export function useDeleteLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_languages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'languages'] });
      toast.success('Language deleted');
    },
    onError: () => toast.error('Failed to delete language'),
  });
}

export function useAITranslate() {
  return useMutation({
    mutationFn: async (params: {
      type: 'translate' | 'batch-translate' | 'detect-language' | 'suggest-translations' | 'improve-translation';
      content: string | Record<string, string> | { original: string; translation: string };
      sourceLanguage?: string;
      targetLanguage?: string;
      context?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-translate', { body: params });
      if (error) throw error;
      return data.result;
    },
    onError: () => toast.error('Translation failed'),
  });
}

// Translations from database
export interface Translation {
  language_code: string;
  namespace: string;
  key: string;
  value: string;
}

const PRIMARY_TRANSLATIONS_TABLE = 'admin_translations';
const FALLBACK_TRANSLATIONS_TABLE = 'translations';

function isMissingTableError(error: any) {
  const code = error?.code as string | undefined;
  const message = (error?.message as string | undefined) ?? '';
  // PostgREST may surface Postgres error codes, but sometimes only message is present.
  return code === '42P01' || /does not exist|unknown relation|relation .* does not exist/i.test(message);
}

// Helper to fetch all rows by paginating (Supabase caps at 1000 per request)
async function fetchAllRows<T>(
  table: string,
  filters?: { languageCode?: string; namespace?: string },
): Promise<{ data: T[]; error: any }> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let q = (supabase as any).from(table).select('*');
    if (filters?.languageCode) q = q.eq('language_code', filters.languageCode);
    if (filters?.namespace) q = q.eq('namespace', filters.namespace);
    q = q.order('namespace').order('key').range(from, from + PAGE_SIZE - 1);

    const { data, error } = await q;
    if (error) return { data: [], error };
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data as T[]);
      from += PAGE_SIZE;
      if (data.length < PAGE_SIZE) hasMore = false;
    }
  }
  return { data: allData, error: null };
}

export function useTranslations(languageCode?: string, namespace?: string) {
  return useQuery({
    queryKey: ['admin', 'translations', languageCode, namespace],
    queryFn: async () => {
      // Try primary table first
      const primary = await fetchAllRows<Translation>(PRIMARY_TRANSLATIONS_TABLE, { languageCode, namespace });
      if (primary.error) {
        if (!isMissingTableError(primary.error)) throw primary.error;
      } else if (primary.data.length > 0) {
        return primary.data;
      }

      // Fallback
      const fallback = await fetchAllRows<Translation>(FALLBACK_TRANSLATIONS_TABLE, { languageCode, namespace });
      if (fallback.error) throw fallback.error;
      return fallback.data;
    },
  });
}

export function useTranslationNamespaces() {
  return useQuery({
    queryKey: ['admin', 'translation-namespaces'],
    queryFn: async () => {
      const fetchNamespaces = async (table: string): Promise<{ data: { namespace: string }[]; error: any }> => {
        const PAGE_SIZE = 1000;
        let all: { namespace: string }[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await (supabase as any)
            .from(table)
            .select('namespace')
            .range(from, from + PAGE_SIZE - 1);
          if (error) return { data: [], error };
          if (!data || data.length === 0) {
            hasMore = false;
          } else {
            all = all.concat(data);
            from += PAGE_SIZE;
            if (data.length < PAGE_SIZE) hasMore = false;
          }
        }
        return { data: all, error: null };
      };

      const primary = await fetchNamespaces(PRIMARY_TRANSLATIONS_TABLE);
      if (primary.error) {
        if (!isMissingTableError(primary.error)) throw primary.error;
      } else if (primary.data.length > 0) {
        return [...new Set(primary.data.map((t) => t.namespace))];
      }

      const fallback = await fetchNamespaces(FALLBACK_TRANSLATIONS_TABLE);
      if (fallback.error) throw fallback.error;
      return [...new Set(fallback.data.map((t) => t.namespace))];
    },
  });
}

async function mutateTranslationsWithFallback<T>(
  mutationFn: (table: string) => Promise<T>,
) {
  try {
    return await mutationFn(PRIMARY_TRANSLATIONS_TABLE);
  } catch (e: any) {
    if (!isMissingTableError(e)) throw e;
    return await mutationFn(FALLBACK_TRANSLATIONS_TABLE);
  }
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ language_code, namespace, key, value }: Translation) => {
      await mutateTranslationsWithFallback(async (table) => {
        const { error } = await (supabase as any)
          .from(table)
          .upsert({ language_code, namespace, key, value }, { onConflict: 'language_code,namespace,key' });
        if (error) throw error;
        return true;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'translations'] });
      toast.success('Translation updated');
    },
    onError: () => toast.error('Failed to update translation'),
  });
}

export function useCreateTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (translation: Translation) => {
      await mutateTranslationsWithFallback(async (table) => {
        const { error } = await (supabase as any).from(table).insert(translation);
        if (error) throw error;
        return true;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'translations'] });
      toast.success('Translation created');
    },
    onError: () => toast.error('Failed to create translation'),
  });
}

export function useDeleteTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      language_code,
      namespace,
      key,
    }: {
      language_code: string;
      namespace: string;
      key: string;
    }) => {
      await mutateTranslationsWithFallback(async (table) => {
        const { error } = await (supabase as any)
          .from(table)
          .delete()
          .eq('language_code', language_code)
          .eq('namespace', namespace)
          .eq('key', key);
        if (error) throw error;
        return true;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'translations'] });
      toast.success('Translation deleted');
    },
    onError: () => toast.error('Failed to delete translation'),
  });
}

// AI Models
export interface AIModel {
  id: string;
  name: string;
  model_id: string;
  provider: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  max_tokens: number;
  temperature: number;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

export function useAIModels() {
  return useQuery({
    queryKey: ['admin', 'ai-models'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_ai_models').select('*').order('name');
      if (error) throw error;
      return data as AIModel[];
    },
  });
}

export function useUpdateAIModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIModel> & { id: string }) => {
      const { error } = await supabase.from('admin_ai_models').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] });
      toast.success('AI Model updated');
    },
    onError: () => toast.error('Failed to update AI model'),
  });
}

export function useCreateAIModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Omit<AIModel, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('admin_ai_models').insert(model);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] });
      toast.success('AI Model created');
    },
    onError: () => toast.error('Failed to create AI model'),
  });
}

export function useDeleteAIModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_ai_models').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] });
      toast.success('AI Model deleted');
    },
    onError: () => toast.error('Failed to delete AI model'),
  });
}

// AI Prompts
export interface AIPrompt {
  id: string;
  name: string;
  prompt_key: string;
  category: string;
  system_prompt: string;
  user_prompt_template: string | null;
  description: string | null;
  is_active: boolean;
  variables: string[];
  model_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useAIPrompts() {
  return useQuery({
    queryKey: ['admin', 'ai-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_ai_prompts').select('*').order('category', { ascending: true });
      if (error) throw error;
      return data as AIPrompt[];
    },
  });
}

export function useUpdateAIPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIPrompt> & { id: string }) => {
      const { error } = await supabase.from('admin_ai_prompts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-prompts'] });
      toast.success('AI Prompt updated');
    },
    onError: () => toast.error('Failed to update AI prompt'),
  });
}

export function useCreateAIPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prompt: Omit<AIPrompt, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('admin_ai_prompts').insert(prompt);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-prompts'] });
      toast.success('AI Prompt created');
    },
    onError: () => toast.error('Failed to create AI prompt'),
  });
}

export function useDeleteAIPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_ai_prompts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-prompts'] });
      toast.success('AI Prompt deleted');
    },
    onError: () => toast.error('Failed to delete AI prompt'),
  });
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  is_default: boolean;
  is_hidden: boolean;
  allowed_user_ids: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').order('sort_order');
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionPlan> & { id: string }) => {
      const { error } = await supabase.from('subscription_plans').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      toast.success('Plan updated');
    },
    onError: () => toast.error('Failed to update plan'),
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('subscription_plans').insert(plan);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      toast.success('Plan created');
    },
    onError: () => toast.error('Failed to create plan'),
  });
}

// User Subscriptions
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserSubscriptions() {
  return useQuery({
    queryKey: ['admin', 'user-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_subscriptions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserSubscription[];
    },
  });
}

export function useUpdateUserSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, planId, status, notes }: { userId: string; planId: string; status?: string; notes?: string }) => {
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ plan_id: planId, status: status || 'active', notes })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: userId, plan_id: planId, status: status || 'active', notes });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-subscriptions'] });
      toast.success('User subscription updated');
    },
    onError: () => toast.error('Failed to update user subscription'),
  });
}

// Extended Stats
export function useExtendedAdminStats() {
  return useQuery({
    queryKey: ['admin', 'extended-stats'],
    queryFn: async () => {
      const [
        profilesResult,
        goalsResult,
        habitsResult,
        tasksResult,
        journalResult,
        notesResult,
        weeklyReviewsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('goals').select('id', { count: 'exact', head: true }),
        supabase.from('habits').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('weekly_reviews').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: profilesResult.count || 0,
        totalGoals: goalsResult.count || 0,
        totalHabits: habitsResult.count || 0,
        totalTasks: tasksResult.count || 0,
        totalJournalEntries: journalResult.count || 0,
        totalNotes: notesResult.count || 0,
        totalWeeklyReviews: weeklyReviewsResult.count || 0,
      };
    },
  });
}

// Dashboard specific hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        totalUsers,
        newUsersWeek,
        newUsersMonth,
        totalGoals,
        completedGoals,
        totalHabits,
        totalTasks,
        completedTasks,
        totalJournalEntries,
        totalNotes,
        totalPomodoroSessions,
        activePlugins,
        activeFeatureFlags,
        activeLanguages,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
        supabase.from('goals').select('id', { count: 'exact', head: true }),
        supabase.from('goals').select('id', { count: 'exact', head: true }).not('completed_at', 'is', null),
        supabase.from('habits').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('pomodoro_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('admin_plugins').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('feature_flags').select('id', { count: 'exact', head: true }).eq('enabled', true),
        supabase.from('admin_languages').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      return {
        users: {
          total: totalUsers.count || 0,
          newThisWeek: newUsersWeek.count || 0,
          newThisMonth: newUsersMonth.count || 0,
        },
        goals: {
          total: totalGoals.count || 0,
          completed: completedGoals.count || 0,
          completionRate: totalGoals.count ? Math.round((completedGoals.count || 0) / totalGoals.count * 100) : 0,
        },
        habits: {
          total: totalHabits.count || 0,
        },
        tasks: {
          total: totalTasks.count || 0,
          completed: completedTasks.count || 0,
          completionRate: totalTasks.count ? Math.round((completedTasks.count || 0) / totalTasks.count * 100) : 0,
        },
        content: {
          journalEntries: totalJournalEntries.count || 0,
          notes: totalNotes.count || 0,
          pomodoroSessions: totalPomodoroSessions.count || 0,
        },
        system: {
          activePlugins: activePlugins.count || 0,
          activeFeatureFlags: activeFeatureFlags.count || 0,
          activeLanguages: activeLanguages.count || 0,
        },
      };
    },
  });
}

export function useRecentUsers() {
  return useQuery({
    queryKey: ['admin', 'recent-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}

export function useRecentGoals() {
  return useQuery({
    queryKey: ['admin', 'recent-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, area, status, progress, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}
