import { useState, useEffect } from 'react';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'moderator' | 'user';

interface UseAdminRoleReturn {
  role: AppRole | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useAdminRole(): UseAdminRoleReturn {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setRole((data?.role as AppRole) || 'user');
        setError(null);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err as Error);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  return {
    role,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator' || role === 'admin',
    isLoading,
    error,
  };
}
