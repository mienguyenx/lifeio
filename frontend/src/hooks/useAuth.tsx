import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { activeSupabase as supabase, isExternalSupabaseConfigured, clearSessionCache } from '@/integrations/supabase/externalClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  usingExternalSupabase: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Auth using: Supabase Local');
    
    // Sync session từ chrome.storage khi khởi động (cho extension)
    const syncSessionFromStorage = async () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          chrome.storage.local.get(['lifeOSSession', 'external-supabase-auth-token'], async (result) => {
            // Nếu có session trong chrome.storage, restore vào localStorage
            if (result['external-supabase-auth-token']) {
              try {
                const sessionData = JSON.parse(result['external-supabase-auth-token']);
                if (sessionData && sessionData.access_token) {
                  localStorage.setItem('external-supabase-auth-token', result['external-supabase-auth-token']);
                  console.log('[Auth] Restored session from chrome.storage');
                }
              } catch (e) {
                console.warn('[Auth] Could not parse session from chrome.storage:', e);
              }
            }
          });
        } catch (e) {
          console.warn('[Auth] Could not sync from chrome.storage:', e);
        }
      }
    };

    syncSessionFromStorage();
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Clear session cache when auth state changes (especially on login/logout)
        if (event === 'SIGNED_IN' || event === 'SIGNED_UP' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          clearSessionCache();
          console.log('[Auth] Cleared session cache due to auth state change:', event);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Import onboarding data khi user mới đăng ký
        if (event === 'SIGNED_UP' && session?.user) {
          try {
            // Kiểm tra xem user có phải admin không (admin không cần onboarding data)
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();

            // Chỉ import onboarding data cho user thường, không phải admin
            if (roleData?.role !== 'admin') {
              const { importOnboardingData } = await import('@/data/onboardingData');
              await importOnboardingData(session.user.id, supabase);
              console.log('[Auth] Onboarding data imported for new user');
            }
          } catch (error) {
            console.error('[Auth] Error importing onboarding data:', error);
            // Không throw error để không ảnh hưởng đến quá trình đăng ký
          }
        }
        
        // Sync session lên chrome.storage khi có thay đổi
        if (session && typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const sessionKey = 'external-supabase-auth-token';
            const sessionStr = JSON.stringify(session);
            chrome.storage.local.set({ 
              [sessionKey]: sessionStr,
              lifeOSSession: session 
            }, () => {
              if (!chrome.runtime.lastError) {
                console.log('[Auth] Synced session to chrome.storage');
              }
            });
          } catch (e) {
            console.warn('[Auth] Could not sync session to chrome.storage:', e);
          }
        } else if (!session && typeof chrome !== 'undefined' && chrome.storage) {
          // Xóa session khỏi chrome.storage khi logout
          try {
            chrome.storage.local.remove(['external-supabase-auth-token', 'lifeOSSession'], () => {
              if (!chrome.runtime.lastError) {
                console.log('[Auth] Removed session from chrome.storage');
              }
            });
          } catch (e) {
            console.warn('[Auth] Could not remove session from chrome.storage:', e);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      console.log('Attempting sign up with:', { 
        email, 
        hasPassword: !!password, 
        name,
        supabaseUrl: (supabase as any).supabaseUrl || 'unknown'
      });
      
      // Try signup without metadata first to avoid trigger issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // Only include metadata if name is provided
          ...(name ? {
            data: {
              name: name,
              full_name: name,
            }
          } : {}),
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          cause: (error as any).cause,
        });
        
        // If 500 error, try without metadata
        if (error.status === 500 && name) {
          console.log('Retrying signup without metadata...');
          const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });
          
          if (retryError) {
            console.error('Retry sign up error:', retryError);
            return { error: retryError as Error };
          }
          
          if (retryData?.user) {
            console.log('Retry sign up successful');
            return { error: null };
          }
        }
        
        return { error: error as Error };
      }
      
      if (data?.user) {
        console.log('Sign up successful:', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at ? 'Yes' : 'No',
          session: data.session ? 'Yes' : 'No',
        });
      }
      
      return { error: null };
    } catch (err) {
      console.error('Unexpected sign up error:', err);
      return { 
        error: err instanceof Error ? err : new Error('Đăng ký thất bại. Vui lòng thử lại.') 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Attempting sign in for:', email);
      console.log('[Auth] Using Supabase Local');
      
      if (!supabase) {
        const error = new Error('Supabase client not initialized');
        console.error('[Auth] Sign in error:', error);
        return { error };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Sign in failed:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { error: error as Error };
      }
      
      if (data?.user) {
        console.log('[Auth] Sign in successful:', {
          userId: data.user.id,
          email: data.user.email,
          session: data.session ? 'Yes' : 'No',
        });
      } else {
        console.warn('[Auth] Sign in returned no user data');
      }
      
      return { error: null };
    } catch (err) {
      console.error('[Auth] Unexpected sign in error:', err);
      return { 
        error: err instanceof Error ? err : new Error('Đăng nhập thất bại. Vui lòng thử lại.') 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      usingExternalSupabase: isExternalSupabaseConfigured,
      signUp, 
      signIn, 
      signOut, 
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
