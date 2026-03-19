import { useState, useCallback } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { 
  initializeGoogleIdentityServices, 
  getAccessToken, 
  isSignedIn, 
  signOut as googleSignOut,
  uploadFileToDrive,
  downloadFileFromDrive,
  listBackupFiles
} from '@/services/googleDriveService';
import { toast } from 'sonner';

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'manual';
  lastBackup?: string;
  nextBackup?: string;
}

export function useGoogleDriveBackup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<Array<{ id: string; name: string; createdTime: string; modifiedTime: string }>>([]);

  // Get all data from store
  const getAllData = useCallback(() => {
    const store = useLifeOSStore.getState();
    return {
      tasks: store.tasks,
      habits: store.habits,
      goals: store.goals,
      journalEntries: store.journalEntries,
      notes: store.notes,
      taskTags: store.taskTags,
      journalTags: store.journalTags,
      noteTags: store.noteTags,
      lifeWheelScores: store.lifeWheelScores,
      weeklyReviews: store.weeklyReviews,
      dailyIntentions: store.dailyIntentions,
      pomodoroSessions: store.pomodoroSessions,
      chatMessages: store.chatMessages,
      profile: store.profile,
      personalValues: store.personalValues,
      lifeRoles: store.lifeRoles,
      lifeVisions: store.lifeVisions,
      personalTraits: store.personalTraits,
      lifeMilestones: store.lifeMilestones,
      pomodoroSettings: store.pomodoroSettings,
      backupMetadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userId: store.user?.id,
      },
    };
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      // Check if Google Client ID is configured
      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!GOOGLE_CLIENT_ID) {
        // Google Drive is optional, don't show error
        setIsAuthenticated(false);
        return;
      }
      
      await initializeGoogleIdentityServices();
      const signedIn = await isSignedIn();
      setIsAuthenticated(signedIn);
      if (signedIn) {
        await loadBackupHistory();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    }
  }, []);

  // Sign in to Google Drive
  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      await initializeGoogleIdentityServices();
      await getAccessToken();
      setIsAuthenticated(true);
      await loadBackupHistory();
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
      setBackupHistory([]);
      toast.success('Đã ngắt kết nối với Google Drive');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Không thể ngắt kết nối');
    }
  }, []);

  // Create backup
  const createBackup = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập Google Drive trước');
      return false;
    }

    try {
      setIsLoading(true);
      const data = getAllData();
      const fileName = `LifeOS-Backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(data, null, 2);

      await uploadFileToDrive(fileName, fileContent);
      await loadBackupHistory();
      
      toast.success('Đã sao lưu dữ liệu lên Google Drive');
      return true;
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast.error(error.message || 'Không thể tạo backup');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAllData]);

  // Restore from backup
  const restoreFromBackup = useCallback(async (fileId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập Google Drive trước');
      return false;
    }

    try {
      setIsLoading(true);
      const fileContent = await downloadFileFromDrive(fileId);
      const data = JSON.parse(fileContent);

      // Validate backup data
      if (!data.backupMetadata || !data.backupMetadata.version) {
        throw new Error('File backup không hợp lệ');
      }

      // Restore data to store
      useLifeOSStore.setState({
        tasks: data.tasks || [],
        habits: data.habits || [],
        goals: data.goals || [],
        journalEntries: data.journalEntries || [],
        notes: data.notes || [],
        taskTags: data.taskTags || [],
        journalTags: data.journalTags || [],
        noteTags: data.noteTags || [],
        lifeWheelScores: data.lifeWheelScores || [],
        weeklyReviews: data.weeklyReviews || [],
        dailyIntentions: data.dailyIntentions || [],
        pomodoroSessions: data.pomodoroSessions || [],
        chatMessages: data.chatMessages || [],
        personalValues: data.personalValues || [],
        lifeRoles: data.lifeRoles || [],
        lifeVisions: data.lifeVisions || [],
        personalTraits: data.personalTraits || [],
        lifeMilestones: data.lifeMilestones || [],
        pomodoroSettings: data.pomodoroSettings || useLifeOSStore.getState().pomodoroSettings,
      });

      toast.success('Đã khôi phục dữ liệu từ backup');
      return true;
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error(error.message || 'Không thể khôi phục backup');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load backup history
  const loadBackupHistory = useCallback(async () => {
    try {
      const files = await listBackupFiles();
      setBackupHistory(files);
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    backupHistory,
    checkAuth,
    signIn,
    signOut,
    createBackup,
    restoreFromBackup,
    loadBackupHistory,
  };
}

