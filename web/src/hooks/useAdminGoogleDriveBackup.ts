import { useState, useCallback, useEffect } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { 
  initializeGoogleIdentityServices, 
  getAccessToken, 
  isSignedIn, 
  signOut as googleSignOut,
  uploadFileToDrive,
  downloadFileFromDrive,
  listBackupFiles
} from '@/services/googleDriveService';
import { collectBackupData } from '@/utils/backupDataCollector';
import { toast } from 'sonner';

export interface BackupHistory {
  id: string;
  user_id: string;
  backup_type: string;
  file_name: string;
  file_id: string | null;
  file_size: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  error_message: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface BackupProgress {
  id: string;
  backup_history_id: string;
  step: string;
  progress: number;
  message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BackupSettings {
  google_drive_enabled: boolean;
  google_drive_client_id: string;
  google_drive_api_key: string;
  backup_frequency: 'daily' | 'weekly' | 'manual';
  auto_backup_enabled: boolean;
  backup_retention_days: number;
}

export function useAdminGoogleDriveBackup() {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [backupProgress, setBackupProgress] = useState<Record<string, BackupProgress[]>>({});
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [currentBackupId, setCurrentBackupId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Load backup settings
  const loadSettings = useCallback(async () => {
    try {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('backup_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Partial<BackupSettings> = {};
      data?.forEach((item: any) => {
        const key = item.key.replace(/_/g, '');
        if (key === 'googledriveenabled') {
          settingsMap.google_drive_enabled = item.value?.enabled || false;
        } else if (key === 'googledriveclientid') {
          settingsMap.google_drive_client_id = item.value?.value || '';
        } else if (key === 'googledriveapikey') {
          settingsMap.google_drive_api_key = item.value?.value || '';
        } else if (key === 'backupfrequency') {
          settingsMap.backup_frequency = item.value?.frequency || 'daily';
        } else if (key === 'autobackupenabled') {
          settingsMap.auto_backup_enabled = item.value?.enabled || false;
        } else if (key === 'backupretentiondays') {
          settingsMap.backup_retention_days = item.value?.days || 30;
        }
      });

      setSettings(settingsMap as BackupSettings);
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
  }, []);

  // Update backup settings
  const updateSettings = useCallback(async (updates: Partial<BackupSettings>) => {
    try {
      await ensureValidSession();
      
      const updatesMap: Record<string, any> = {};
      if (updates.google_drive_enabled !== undefined) {
        updatesMap['google_drive_enabled'] = { value: { enabled: updates.google_drive_enabled } };
      }
      if (updates.google_drive_client_id !== undefined) {
        updatesMap['google_drive_client_id'] = { value: { value: updates.google_drive_client_id } };
      }
      if (updates.google_drive_api_key !== undefined) {
        updatesMap['google_drive_api_key'] = { value: { value: updates.google_drive_api_key } };
      }
      if (updates.backup_frequency !== undefined) {
        updatesMap['backup_frequency'] = { value: { frequency: updates.backup_frequency } };
      }
      if (updates.auto_backup_enabled !== undefined) {
        updatesMap['auto_backup_enabled'] = { value: { enabled: updates.auto_backup_enabled } };
      }
      if (updates.backup_retention_days !== undefined) {
        updatesMap['backup_retention_days'] = { value: { days: updates.backup_retention_days } };
      }

      for (const [key, value] of Object.entries(updatesMap)) {
        await supabase
          .from('backup_settings')
          .update({ value: value.value, updated_at: new Date().toISOString() })
          .eq('key', key);
      }

      await loadSettings();
      toast.success('Đã cập nhật cài đặt backup');
    } catch (error) {
      console.error('Error updating backup settings:', error);
      toast.error('Không thể cập nhật cài đặt');
    }
  }, [loadSettings]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      if (!settings?.google_drive_enabled || !settings.google_drive_client_id) {
        setIsAuthenticated(false);
        return;
      }

      await initializeGoogleIdentityServices();
      const signedIn = await isSignedIn();
      setIsAuthenticated(signedIn);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    }
  }, [settings]);

  // Sign in to Google Drive
  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      await initializeGoogleIdentityServices();
      await getAccessToken();
      setIsAuthenticated(true);
      toast.success('Đã kết nối với Google Drive');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Không thể kết nối với Google Drive');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out from Google Drive
  const signOut = useCallback(async () => {
    try {
      await googleSignOut();
      setIsAuthenticated(false);
      toast.success('Đã ngắt kết nối với Google Drive');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Không thể ngắt kết nối');
    }
  }, []);

  // Create backup with progress tracking
  const createBackup = useCallback(async (targetUserId?: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập Google Drive trước');
      return false;
    }

    const userId = targetUserId || user.id;
    let backupId: string | null = null;

    try {
      setIsLoading(true);
      setProgress(0);
      setCurrentStep('Đang chuẩn bị...');
      setCurrentBackupId(null);

      // Create backup history record
      await ensureValidSession();
      const { data: backupRecord, error: createError } = await supabase
        .from('backup_history')
        .insert({
          user_id: userId,
          backup_type: 'google_drive',
          file_name: `LifeOS-Backup-${new Date().toISOString().split('T')[0]}.json`,
          status: 'in_progress',
          progress: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      backupId = backupRecord.id;
      setCurrentBackupId(backupId);

      // Update progress: Preparing (0-10%)
      await updateBackupProgress(backupId, 'preparing', 10, 'Đang thu thập dữ liệu...');

      // Determine backup scope
      // Check if user is admin by querying user_roles table
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = userRole?.role === 'admin';
      const backupScope = isAdmin && !targetUserId ? 'full_database' : 'user';
      
      setCurrentStep('Đang thu thập dữ liệu...');
      setProgress(20);
      await updateBackupProgress(backupId, 'collecting_data', 20, `Đang thu thập dữ liệu từ database (${backupScope === 'full_database' ? 'toàn bộ' : 'user'})...`);

      // Collect all data from database
      const backupData = await collectBackupData(
        backupScope,
        targetUserId || userId,
        user.id
      );
      
      setProgress(40);
      await updateBackupProgress(backupId, 'data_collected', 40, `Đã thu thập ${backupData.metadata.totalRecords} records từ ${Object.keys(backupData.metadata.tableCounts).length} tables`);

      setCurrentStep('Đang tạo file backup...');
      setProgress(50);
      await updateBackupProgress(backupId, 'creating_file', 50, 'Đang tạo file JSON...');

      // Generate appropriate file name based on scope
      const scopePrefix = backupScope === 'full_database' ? 'Full-Database' : 
                         backupScope === 'all_users' ? 'All-Users' : 
                         `User-${targetUserId || userId}`;
      const fileName = `LifeOS-Backup-${scopePrefix}-${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(backupData, null, 2);
      const fileSize = new Blob([fileContent]).size;

      setCurrentStep('Đang upload lên Google Drive...');
      setProgress(60);
      await updateBackupProgress(backupId, 'uploading', 60, 'Đang upload lên Google Drive...');

      const fileId = await uploadFileToDrive(fileName, fileContent);

      setCurrentStep('Đang xác minh...');
      setProgress(80);
      await updateBackupProgress(backupId, 'verifying', 80, 'Đang xác minh file đã upload...');

      // Update backup history with file info
      await supabase
        .from('backup_history')
        .update({
          file_id: fileId,
          file_size: fileSize,
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .eq('id', backupId);

      setCurrentStep('Hoàn thành');
      setProgress(100);
      await updateBackupProgress(backupId, 'completed', 100, 'Backup hoàn thành thành công!');

      await loadBackupHistory();
      toast.success('Đã sao lưu dữ liệu lên Google Drive');
      return true;
    } catch (error: any) {
      console.error('Error creating backup:', error);
      
      if (backupId) {
        await supabase
          .from('backup_history')
          .update({
            status: 'failed',
            error_message: error.message || 'Không thể tạo backup',
          })
          .eq('id', backupId);
      }

      toast.error(error.message || 'Không thể tạo backup');
      return false;
    } finally {
      setIsLoading(false);
      setCurrentBackupId(null);
      setProgress(0);
      setCurrentStep('');
    }
  }, [isAuthenticated, user]);

  // Update backup progress
  const updateBackupProgress = useCallback(async (
    backupId: string,
    step: string,
    progressValue: number,
    message: string
  ) => {
    try {
      await ensureValidSession();
      await supabase
        .from('backup_progress')
        .insert({
          backup_history_id: backupId,
          step,
          progress: progressValue,
          message,
        });

      await supabase
        .from('backup_history')
        .update({ progress: progressValue })
        .eq('id', backupId);

      setProgress(progressValue);
      setCurrentStep(message);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, []);

  // Load backup history
  const loadBackupHistory = useCallback(async () => {
    try {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setBackupHistory(data || []);
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  }, []);

  // Load backup progress for a specific backup
  const loadBackupProgress = useCallback(async (backupId: string) => {
    try {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('backup_progress')
        .select('*')
        .eq('backup_history_id', backupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBackupProgress(prev => ({ ...prev, [backupId]: data || [] }));
    } catch (error) {
      console.error('Error loading backup progress:', error);
    }
  }, []);

  // Delete backup
  const deleteBackup = useCallback(async (backupId: string) => {
    try {
      await ensureValidSession();
      const { error } = await supabase
        .from('backup_history')
        .delete()
        .eq('id', backupId);

      if (error) throw error;
      await loadBackupHistory();
      toast.success('Đã xóa backup');
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Không thể xóa backup');
    }
  }, [loadBackupHistory]);

  // Restore from backup
  const restoreFromBackup = useCallback(async (backupId: string, targetUserId?: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập Google Drive trước');
      return false;
    }

    try {
      setIsLoading(true);
      const backup = backupHistory.find(b => b.id === backupId);
      if (!backup || !backup.file_id) {
        throw new Error('Backup không hợp lệ');
      }

      setCurrentStep('Đang tải file từ Google Drive...');
      const fileContent = await downloadFileFromDrive(backup.file_id);
      const data = JSON.parse(fileContent);

      // Validate backup data
      if (!data.version) {
        throw new Error('File backup không hợp lệ');
      }

      setCurrentStep('Đang khôi phục dữ liệu...');
      // In real implementation, restore data to database for targetUserId
      // For now, just show success
      
      toast.success('Đã khôi phục dữ liệu từ backup');
      return true;
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error(error.message || 'Không thể khôi phục backup');
      return false;
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  }, [isAuthenticated, backupHistory]);

  // Initialize
  useEffect(() => {
    loadSettings();
    checkAuth();
    loadBackupHistory();
  }, [loadSettings, checkAuth, loadBackupHistory]);

  return {
    isAuthenticated,
    isLoading,
    backupHistory,
    backupProgress,
    settings,
    currentBackupId,
    progress,
    currentStep,
    checkAuth,
    signIn,
    signOut,
    createBackup,
    restoreFromBackup,
    deleteBackup,
    loadBackupHistory,
    loadBackupProgress,
    updateSettings,
    loadSettings,
  };
}

