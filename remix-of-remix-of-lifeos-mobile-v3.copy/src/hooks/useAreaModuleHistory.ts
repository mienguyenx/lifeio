import { useState, useCallback } from 'react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import type {
  PersonalValueHistory,
  LifeRoleHistory,
  LifeVisionHistory,
  PersonalTraitHistory,
  LifeMilestoneHistory,
  HistoryAction,
} from '@/types/lifeos';

export function useAreaModuleHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history for Personal Values
  const loadPersonalValuesHistory = useCallback(
    async (valueId?: string): Promise<PersonalValueHistory[]> => {
      if (!user) return [];

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('personal_values_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (valueId) {
          query = query.eq('value_id', valueId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        return (data || []).map((row) => ({
          id: row.id,
          entityId: row.value_id,
          valueId: row.value_id,
          userId: row.user_id,
          action: row.action as HistoryAction,
          oldData: row.old_data,
          newData: row.new_data,
          changedFields: row.changed_fields || [],
          createdAt: row.created_at,
        }));
      } catch (err) {
        console.error('Error loading personal values history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load history for Life Roles
  const loadLifeRolesHistory = useCallback(
    async (roleId?: string): Promise<LifeRoleHistory[]> => {
      if (!user) return [];

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('life_roles_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (roleId) {
          query = query.eq('role_id', roleId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        return (data || []).map((row) => ({
          id: row.id,
          entityId: row.role_id,
          roleId: row.role_id,
          userId: row.user_id,
          action: row.action as HistoryAction,
          oldData: row.old_data,
          newData: row.new_data,
          changedFields: row.changed_fields || [],
          createdAt: row.created_at,
        }));
      } catch (err) {
        console.error('Error loading life roles history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load history for Life Visions
  const loadLifeVisionsHistory = useCallback(
    async (visionId?: string): Promise<LifeVisionHistory[]> => {
      if (!user) return [];

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('life_visions_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (visionId) {
          query = query.eq('vision_id', visionId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        return (data || []).map((row) => ({
          id: row.id,
          entityId: row.vision_id,
          visionId: row.vision_id,
          userId: row.user_id,
          action: row.action as HistoryAction,
          oldData: row.old_data,
          newData: row.new_data,
          changedFields: row.changed_fields || [],
          createdAt: row.created_at,
        }));
      } catch (err) {
        console.error('Error loading life visions history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load history for Personal Traits
  const loadPersonalTraitsHistory = useCallback(
    async (traitId?: string): Promise<PersonalTraitHistory[]> => {
      if (!user) return [];

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('personal_traits_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (traitId) {
          query = query.eq('trait_id', traitId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        return (data || []).map((row) => ({
          id: row.id,
          entityId: row.trait_id,
          traitId: row.trait_id,
          userId: row.user_id,
          action: row.action as HistoryAction,
          oldData: row.old_data,
          newData: row.new_data,
          changedFields: row.changed_fields || [],
          createdAt: row.created_at,
        }));
      } catch (err) {
        console.error('Error loading personal traits history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load history for Life Milestones
  const loadLifeMilestonesHistory = useCallback(
    async (milestoneId?: string): Promise<LifeMilestoneHistory[]> => {
      if (!user) return [];

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('life_milestones_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (milestoneId) {
          query = query.eq('milestone_id', milestoneId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        return (data || []).map((row) => ({
          id: row.id,
          entityId: row.milestone_id,
          milestoneId: row.milestone_id,
          userId: row.user_id,
          action: row.action as HistoryAction,
          oldData: row.old_data,
          newData: row.new_data,
          changedFields: row.changed_fields || [],
          createdAt: row.created_at,
        }));
      } catch (err) {
        console.error('Error loading life milestones history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    loading,
    error,
    loadPersonalValuesHistory,
    loadLifeRolesHistory,
    loadLifeVisionsHistory,
    loadPersonalTraitsHistory,
    loadLifeMilestonesHistory,
  };
}

