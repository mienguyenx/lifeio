/**
 * Google Drive API Service
 * Uses Google Identity Services (GIS) - Modern approach without deprecated gapi
 * Compatible with FedCM requirements for 2025
 * Syncs tokens to Supabase database for cross-device access
 */

import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const STORAGE_KEY = 'google_drive_access_token';
const STORAGE_EXPIRY_KEY = 'google_drive_token_expiry';

let gisLoaded = false;
let accessToken: string | null = null;
// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  try {
    await ensureValidSession();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Load token from Supabase database
async function loadTokenFromSupabase(): Promise<{ token: string; expiresAt: Date } | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    await ensureValidSession();
    
    // Try to load token, but handle errors gracefully
    const { data, error } = await supabase
      .from('google_drive_tokens')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows

    if (error) {
      // Handle different error codes
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // PGRST116: No rows returned (that's okay)
        // 42P01: Table doesn't exist (migration not run yet)
        console.warn('Google Drive tokens table not found or empty. Migration may not have been run.');
        return null;
      }
      
      // 406 Not Acceptable - usually means table doesn't exist or RLS blocking
      if (error.message?.includes('406') || error.status === 406) {
        console.warn('Google Drive tokens table not accessible. Please run migration SQL.');
        return null;
      }
      
      console.error('Error loading token from Supabase:', error);
      return null;
    }

    if (data && data.access_token) {
      const expiresAt = new Date(data.expires_at);
      // Check if token is still valid (with 5 minute buffer)
      if (Date.now() < expiresAt.getTime() - 5 * 60 * 1000) {
        return {
          token: data.access_token,
          expiresAt: expiresAt,
        };
      } else {
        // Token expired, delete it
        await deleteTokenFromSupabase();
        return null;
      }
    }
  } catch (error: any) {
    // Handle network errors or other exceptions
    if (error?.message?.includes('406') || error?.status === 406) {
      console.warn('Google Drive tokens table not accessible. Please run migration SQL.');
    } else {
      console.error('Error loading token from Supabase:', error);
    }
  }
  return null;
}

// Save token to Supabase database
async function saveTokenToSupabase(token: string, expiresIn?: number): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('No user ID, cannot save token to Supabase');
      return;
    }

    await ensureValidSession();
    const expiresAt = new Date(Date.now() + (expiresIn ? expiresIn * 1000 : 3600 * 1000));

    const { error } = await supabase
      .from('google_drive_tokens')
      .upsert({
        user_id: userId,
        access_token: token,
        expires_at: expiresAt.toISOString(),
        token_type: 'Bearer',
        scope: SCOPES,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      // Handle 406 or table not found errors gracefully
      if (error.message?.includes('406') || error.status === 406 || error.code === '42P01') {
        console.warn('Google Drive tokens table not accessible. Token saved to localStorage only. Please run migration SQL.');
      } else {
        console.error('Error saving token to Supabase:', error);
      }
    } else {
      console.log('Token saved to Supabase successfully');
    }
  } catch (error: any) {
    if (error?.message?.includes('406') || error?.status === 406) {
      console.warn('Google Drive tokens table not accessible. Token saved to localStorage only.');
    } else {
      console.error('Error saving token to Supabase:', error);
    }
  }
}

// Delete token from Supabase database
async function deleteTokenFromSupabase(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await ensureValidSession();
    const { error } = await supabase
      .from('google_drive_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      // Don't log error if table doesn't exist (migration not run)
      if (error.code !== '42P01' && !error.message?.includes('406') && error.status !== 406) {
        console.error('Error deleting token from Supabase:', error);
      }
    }
  } catch (error: any) {
    // Ignore errors if table doesn't exist
    if (error?.code !== '42P01' && !error?.message?.includes('406') && error?.status !== 406) {
      console.error('Error deleting token from Supabase:', error);
    }
  }
}

// Load token from localStorage (fallback)
function loadTokenFromStorage(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
    
    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      // Check if token is still valid (with 5 minute buffer)
      if (Date.now() < expiryTime - 5 * 60 * 1000) {
        return token;
      } else {
        // Token expired, remove it
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
      }
    }
  } catch (error) {
    console.error('Error loading token from storage:', error);
  }
  return null;
}

// Save token to localStorage (fallback)
function saveTokenToStorage(token: string, expiresIn?: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
    // Default expiry is 1 hour if not provided
    const expiry = Date.now() + (expiresIn ? expiresIn * 1000 : 3600 * 1000);
    localStorage.setItem(STORAGE_EXPIRY_KEY, expiry.toString());
  } catch (error) {
    console.error('Error saving token to storage:', error);
  }
}

// Clear token from localStorage
function clearTokenFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing token from storage:', error);
  }
}

// Load token (tries Supabase first, then localStorage)
async function loadToken(): Promise<string | null> {
  // Try Supabase first
  const supabaseToken = await loadTokenFromSupabase();
  if (supabaseToken) {
    // Sync to localStorage as backup
    const expiresIn = Math.floor((supabaseToken.expiresAt.getTime() - Date.now()) / 1000);
    saveTokenToStorage(supabaseToken.token, expiresIn);
    return supabaseToken.token;
  }

  // Fallback to localStorage
  return loadTokenFromStorage();
}

// Save token (saves to both Supabase and localStorage)
async function saveToken(token: string, expiresIn?: number): Promise<void> {
  // Save to Supabase (primary)
  await saveTokenToSupabase(token, expiresIn);
  
  // Also save to localStorage as backup
  saveTokenToStorage(token, expiresIn);
}

// Clear token (clears from both Supabase and localStorage)
async function clearToken(): Promise<void> {
  await deleteTokenFromSupabase();
  clearTokenFromStorage();
}

// Load Google Identity Services script
export async function loadGoogleIdentityServices(): Promise<void> {
  if (gisLoaded) return;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.accounts) {
      gisLoaded = true;
      resolve();
      return;
    }

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      gisLoaded = true;
      resolve();
    };
    gisScript.onerror = () => {
      console.error('Failed to load Google Identity Services script');
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(gisScript);
  });
}

// Initialize Google Identity Services
export async function initializeGoogleIdentityServices(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured. Google Drive backup feature is disabled. Set VITE_GOOGLE_CLIENT_ID to enable.');
    return;
  }

  await loadGoogleIdentityServices();

  if (!window.google || !window.google.accounts) {
    throw new Error('Google Identity Services failed to load');
  }

  // Initialize GIS with FedCM support for 2025
  // Note: Only initialize id.initialize if needed for One Tap, not required for OAuth
  try {
    // For OAuth flow, we don't need id.initialize, but it's safe to call
    // We'll skip FedCM if it causes issues
    if (window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        // Don't use FedCM for now to avoid origins mismatch issues
        // use_fedcm_for_prompt: true,
      });
    }
  } catch (error) {
    console.warn('Failed to initialize Google Identity Services ID:', error);
    // Continue anyway - OAuth doesn't require id.initialize
  }
}

// Get access token using Google Identity Services OAuth 2.0
export async function getAccessToken(forceRefresh: boolean = false): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  // Check if we have a valid token in storage
  if (!forceRefresh && accessToken) {
    return accessToken;
  }

  const storedToken = loadTokenFromStorage();
  if (!forceRefresh && storedToken) {
    accessToken = storedToken;
    return storedToken;
  }

  await initializeGoogleIdentityServices();

  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    throw new Error(
      'Google Identity Services not loaded. Please check your Client ID configuration and ensure https://life.hoanong.com is added to Authorized JavaScript origins in Google Cloud Console.'
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response);
            clearTokenFromStorage();
            accessToken = null;
            reject(new Error(response.error || 'Failed to get access token'));
            return;
          }
          if (response.access_token) {
            accessToken = response.access_token;
            // Save token expiry if provided (usually 3600 seconds = 1 hour)
            const expiresIn = response.expires_in || 3600;
            // Save to both Supabase and localStorage
            saveToken(response.access_token, expiresIn).catch(err => {
              console.error('Error saving token:', err);
            });
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received'));
          }
        },
      });

      // Use 'select_account' for first time, 'none' for silent refresh
      const prompt = forceRefresh ? 'consent' : 'select_account';
      tokenClient.requestAccessToken({ prompt });
    } catch (error: any) {
      console.error('Error initializing token client:', error);
      reject(
        new Error(
          error.message ||
            'Failed to initialize OAuth client. Please check your Client ID and ensure https://life.hoanong.com is added to Authorized JavaScript origins in Google Cloud Console.'
        )
      );
    }
  });
}

// Check if user is signed in
export async function isSignedIn(): Promise<boolean> {
  if (accessToken) {
    return true;
  }
  
  // Try to load token from Supabase or localStorage
  const token = await loadToken();
  if (token) {
    accessToken = token;
    return true;
  }
  
  return false;
}

// Sign out
export async function signOut(): Promise<void> {
  const tokenToRevoke = accessToken || await loadToken();
  
  if (tokenToRevoke && window.google && window.google.accounts && window.google.accounts.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(tokenToRevoke, () => {
        console.log('Token revoked successfully');
      });
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }
  
  accessToken = null;
  await clearToken();
}

// Make authenticated request to Google Drive API
async function driveAPIRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  // Ensure we have a token
  if (!accessToken) {
    const storedToken = await loadToken();
    if (storedToken) {
      accessToken = storedToken;
    } else {
      throw new Error('Not authenticated with Google Drive');
    }
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error?.message || error.error || `Drive API error: ${response.statusText}`);
  }

  return response.json();
}

// Upload file to Google Drive
export async function uploadFileToDrive(
  fileName: string,
  fileContent: string,
  mimeType: string = 'application/json'
): Promise<string> {
  if (!(await isSignedIn())) {
    await getAccessToken();
  }

  // Check if file already exists
  const existingFiles = await driveAPIRequest(`/files?q=name='${encodeURIComponent(fileName)}' and trashed=false&fields=files(id,name)`);

  const fileMetadata = {
    name: fileName,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: mimeType }));

  let fileId: string;

  if (existingFiles.files && existingFiles.files.length > 0) {
    // Update existing file
    fileId = existingFiles.files[0].id;
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error?.message || error.error || `Failed to update file: ${response.statusText}`);
    }
  } else {
    // Create new file
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error?.message || error.error || `Failed to create file: ${response.statusText}`);
    }

    const result = await response.json();
    fileId = result.id;
  }

  return fileId;
}

// Download file from Google Drive
export async function downloadFileFromDrive(fileId: string): Promise<string> {
  if (!(await isSignedIn())) {
    throw new Error('Not authenticated with Google Drive');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error?.message || error.error || `Failed to download file: ${response.statusText}`);
  }

  return await response.text();
}

// List backup files
export async function listBackupFiles(): Promise<Array<{ id: string; name: string; createdTime: string; modifiedTime: string }>> {
  if (!(await isSignedIn())) {
    return [];
  }

  try {
    const response = await driveAPIRequest(
      `/files?q=name contains 'LifeOS-Backup' and trashed=false&fields=files(id,name,createdTime,modifiedTime)&orderBy=modifiedTime desc`
    );

    return (response.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
    }));
  } catch (error) {
    console.error('Error listing backup files:', error);
    return [];
  }
}

// Declare global types for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; use_fedcm_for_prompt?: boolean }) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
          revoke: (token: string, callback?: () => void) => void;
        };
      };
    };
  }
}
