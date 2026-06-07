import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { 
  UserProfile, PersonalValue, LifeRole, LifeVision, 
  PersonalTrait, LifeMilestone 
} from '@/types/lifeos';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PersonalValueRow = Database['public']['Tables']['personal_values']['Row'];
type LifeRoleRow = Database['public']['Tables']['life_roles']['Row'];
type LifeVisionRow = Database['public']['Tables']['life_visions']['Row'];
type PersonalTraitRow = Database['public']['Tables']['personal_traits']['Row'];
type LifeMilestoneRow = Database['public']['Tables']['life_milestones']['Row'];

// Transform functions
function transformProfileFromDB(row: ProfileRow): Partial<UserProfile> {
  return {
    name: row.name || '',
    email: row.email || undefined,
    phone: row.phone || undefined,
    birthday: row.birthday || undefined,
    timezone: row.timezone || undefined,
    bio: row.bio || undefined,
    lifePurpose: row.life_purpose || undefined,
    avatar: row.avatar_url || undefined,
  };
}

function transformPersonalValueFromDB(row: PersonalValueRow): PersonalValue {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    priority: (row.priority || 3) as 1 | 2 | 3 | 4 | 5,
    icon: row.icon || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function transformLifeRoleFromDB(row: LifeRoleRow): LifeRole {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    icon: row.icon || undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function transformLifeVisionFromDB(row: LifeVisionRow): LifeVision {
  return {
    id: row.id,
    statement: row.statement,
    timeframe: row.timeframe || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function transformPersonalTraitFromDB(row: PersonalTraitRow): PersonalTrait {
  return {
    id: row.id,
    name: row.name,
    type: row.trait_type,
    description: row.description || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function transformLifeMilestoneFromDB(row: LifeMilestoneRow): LifeMilestone {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    date: row.date || new Date().toISOString().split('T')[0],
    area: row.area || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function useProfileSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  // ==================== PROFILE ====================
  const loadProfile = useCallback(async (): Promise<Partial<UserProfile> | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data ? transformProfileFromDB(data) : null;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    const data: Record<string, unknown> = {};
    if ('name' in updates) data.name = updates.name;
    if ('email' in updates) data.email = updates.email;
    if ('phone' in updates) data.phone = updates.phone;
    if ('birthday' in updates) data.birthday = updates.birthday;
    if ('timezone' in updates) data.timezone = updates.timezone;
    if ('bio' in updates) data.bio = updates.bio;
    if ('lifePurpose' in updates) data.life_purpose = updates.lifePurpose;
    if ('avatar' in updates) data.avatar_url = updates.avatar;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }, [user]);

  // ==================== PERSONAL VALUES ====================
  const loadPersonalValues = useCallback(async (): Promise<PersonalValue[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('personal_values')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []).map(transformPersonalValueFromDB);
    } catch (error) {
      console.error('Error loading personal values:', error);
      return [];
    }
  }, [user]);

  const savePersonalValue = useCallback(async (value: PersonalValue): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('personal_values')
        .upsert({
          id: value.id,
          user_id: user.id,
          name: value.name,
          description: value.description || null,
          priority: value.priority || 3,
          icon: value.icon || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving personal value:', error);
      return false;
    }
  }, [user]);

  const deletePersonalValue = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('personal_values')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting personal value:', error);
      return false;
    }
  }, [user]);

  // ==================== LIFE ROLES ====================
  const loadLifeRoles = useCallback(async (): Promise<LifeRole[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('life_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(transformLifeRoleFromDB);
    } catch (error) {
      console.error('Error loading life roles:', error);
      return [];
    }
  }, [user]);

  const saveLifeRole = useCallback(async (role: LifeRole): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_roles')
        .upsert({
          id: role.id,
          user_id: user.id,
          name: role.name,
          description: role.description || null,
          icon: role.icon || null,
          is_active: role.isActive ?? true,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving life role:', error);
      return false;
    }
  }, [user]);

  const deleteLifeRole = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_roles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting life role:', error);
      return false;
    }
  }, [user]);

  // ==================== LIFE VISIONS ====================
  const loadLifeVisions = useCallback(async (): Promise<LifeVision[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('life_visions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformLifeVisionFromDB);
    } catch (error) {
      console.error('Error loading life visions:', error);
      return [];
    }
  }, [user]);

  const saveLifeVision = useCallback(async (vision: LifeVision): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_visions')
        .upsert({
          id: vision.id,
          user_id: user.id,
          statement: vision.statement,
          timeframe: vision.timeframe || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving life vision:', error);
      return false;
    }
  }, [user]);

  const deleteLifeVision = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_visions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting life vision:', error);
      return false;
    }
  }, [user]);

  // ==================== PERSONAL TRAITS ====================
  const loadPersonalTraits = useCallback(async (): Promise<PersonalTrait[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('personal_traits')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(transformPersonalTraitFromDB);
    } catch (error) {
      console.error('Error loading personal traits:', error);
      return [];
    }
  }, [user]);

  const savePersonalTrait = useCallback(async (trait: PersonalTrait): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('personal_traits')
        .upsert({
          id: trait.id,
          user_id: user.id,
          name: trait.name,
          trait_type: trait.type,
          description: trait.description || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving personal trait:', error);
      return false;
    }
  }, [user]);

  const deletePersonalTrait = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('personal_traits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting personal trait:', error);
      return false;
    }
  }, [user]);

  // ==================== LIFE MILESTONES ====================
  const loadLifeMilestones = useCallback(async (): Promise<LifeMilestone[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('life_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformLifeMilestoneFromDB);
    } catch (error) {
      console.error('Error loading life milestones:', error);
      return [];
    }
  }, [user]);

  const saveLifeMilestone = useCallback(async (milestone: LifeMilestone): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_milestones')
        .upsert({
          id: milestone.id,
          user_id: user.id,
          title: milestone.title,
          description: milestone.description || null,
          date: milestone.date,
          area: milestone.area || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving life milestone:', error);
      return false;
    }
  }, [user]);

  const deleteLifeMilestone = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_milestones')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting life milestone:', error);
      return false;
    }
  }, [user]);

  // Clear all area module data for current user
  const clearAllAreaModuleData = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('[ClearAreaData] Starting to clear area module data for user:', user.id);

      // Get role IDs before deleting (for life_role_goals cleanup)
      const { data: userRoles } = await supabase
        .from('life_roles')
        .select('id')
        .eq('user_id', user.id);

      console.log('[ClearAreaData] Found roles to delete:', userRoles?.length || 0);

      // Delete life_role_goals first (foreign key constraint)
      if (userRoles && userRoles.length > 0) {
        const roleIds = userRoles.map(r => r.id);
        const { error: linksError } = await supabase
          .from('life_role_goals')
          .delete()
          .in('role_id', roleIds);
        if (linksError) console.error('[ClearAreaData] Error deleting life_role_goals:', linksError);
      }

      // Delete all personal values
      const { error: valuesError, count: valuesCount } = await supabase
        .from('personal_values')
        .delete({ count: 'exact' })
        .eq('user_id', user.id);
      console.log('[ClearAreaData] Deleted personal values:', valuesCount, valuesError ? `Error: ${valuesError.message}` : 'OK');

      // Delete all life roles
      const { error: rolesError, count: rolesCount } = await supabase
        .from('life_roles')
        .delete({ count: 'exact' })
        .eq('user_id', user.id);
      console.log('[ClearAreaData] Deleted life roles:', rolesCount, rolesError ? `Error: ${rolesError.message}` : 'OK');

      // Delete all life visions
      const { error: visionsError, count: visionsCount } = await supabase
        .from('life_visions')
        .delete({ count: 'exact' })
        .eq('user_id', user.id);
      console.log('[ClearAreaData] Deleted life visions:', visionsCount, visionsError ? `Error: ${visionsError.message}` : 'OK');

      // Delete all personal traits
      const { error: traitsError, count: traitsCount } = await supabase
        .from('personal_traits')
        .delete({ count: 'exact' })
        .eq('user_id', user.id);
      console.log('[ClearAreaData] Deleted personal traits:', traitsCount, traitsError ? `Error: ${traitsError.message}` : 'OK');

      // Delete all life milestones
      const { error: milestonesError, count: milestonesCount } = await supabase
        .from('life_milestones')
        .delete({ count: 'exact' })
        .eq('user_id', user.id);
      console.log('[ClearAreaData] Deleted life milestones:', milestonesCount, milestonesError ? `Error: ${milestonesError.message}` : 'OK');

      // Verify deletion - check if any data still exists
      const [valuesCheck, rolesCheck, visionsCheck, traitsCheck, milestonesCheck] = await Promise.all([
        supabase.from('personal_values').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('life_roles').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('life_visions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('personal_traits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('life_milestones').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const remainingCounts = {
        values: valuesCheck.count || 0,
        roles: rolesCheck.count || 0,
        visions: visionsCheck.count || 0,
        traits: traitsCheck.count || 0,
        milestones: milestonesCheck.count || 0,
      };

      console.log('[ClearAreaData] Remaining data after deletion:', remainingCounts);

      if (remainingCounts.values > 0 || remainingCounts.roles > 0 || remainingCounts.visions > 0 || remainingCounts.traits > 0 || remainingCounts.milestones > 0) {
        console.warn('[ClearAreaData] WARNING: Some data still exists in database!', remainingCounts);
      }

      // Clear from local store
      useLifeOSStore.setState(state => ({
        user: {
          ...state.user,
          personalValues: undefined,
          lifeRoles: undefined,
          visions: undefined,
          traits: undefined,
          milestones: undefined,
        }
      }));

      // Force clear from Zustand persist storage (localStorage) - COMPLETE CLEAR
      try {
        const storageKey = 'lifeos-storage';
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.state?.user) {
            // Remove area module data from persisted user object
            delete parsed.state.user.personalValues;
            delete parsed.state.user.lifeRoles;
            delete parsed.state.user.visions;
            delete parsed.state.user.traits;
            delete parsed.state.user.milestones;
            // Also clear legacy fields if they exist
            delete parsed.state.user.values;
            delete parsed.state.user.roles;
            delete parsed.state.user.vision;
            localStorage.setItem(storageKey, JSON.stringify(parsed));
            console.log('[ClearAreaData] Cleared from localStorage');
          }
        }
      } catch (error) {
        console.error('[ClearAreaData] Error clearing localStorage:', error);
      }

      // Also clear from sessionStorage if exists
      try {
        const sessionStorageKey = 'lifeos-storage';
        const sessionData = sessionStorage.getItem(sessionStorageKey);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.state?.user) {
            delete parsed.state.user.personalValues;
            delete parsed.state.user.lifeRoles;
            delete parsed.state.user.visions;
            delete parsed.state.user.traits;
            delete parsed.state.user.milestones;
            sessionStorage.setItem(sessionStorageKey, JSON.stringify(parsed));
          }
        }
      } catch (error) {
        console.error('[ClearAreaData] Error clearing sessionStorage:', error);
      }

      // Clear from IndexedDB cache
      const { saveToIndexedDB } = await import('@/lib/indexedDB');
      await Promise.all([
        saveToIndexedDB('personalValues', []),
        saveToIndexedDB('lifeRoles', []),
        saveToIndexedDB('lifeVisions', []),
        saveToIndexedDB('personalTraits', []),
        saveToIndexedDB('lifeMilestones', []),
      ]);

      console.log('[ClearAreaData] Successfully cleared all area module data');
      
      // Set a flag in sessionStorage to prevent auto-reload after deletion
      try {
        sessionStorage.setItem('lifeos-area-data-cleared', Date.now().toString());
        console.log('[ClearAreaData] Set flag to prevent auto-reload');
      } catch (error) {
        console.error('[ClearAreaData] Error setting flag:', error);
      }
      
      return true;
    } catch (error) {
      console.error('[ClearAreaData] Error clearing area module data:', error);
      return false;
    }
  }, [user]);

  return {
    // Profile
    loadProfile,
    updateProfile,
    // Personal Values
    loadPersonalValues,
    savePersonalValue,
    deletePersonalValue,
    // Life Roles
    loadLifeRoles,
    saveLifeRole,
    deleteLifeRole,
    // Life Visions
    loadLifeVisions,
    saveLifeVision,
    deleteLifeVision,
    // Personal Traits
    loadPersonalTraits,
    savePersonalTrait,
    deletePersonalTrait,
    // Life Milestones
    loadLifeMilestones,
    saveLifeMilestone,
    deleteLifeMilestone,
    // Clear all area module data
    clearAllAreaModuleData,
  };
}
