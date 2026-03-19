// Sync Storage Utility
// Đồng bộ session giữa localStorage và chrome.storage (cho extension)
// Supabase expect synchronous storage interface

// Custom storage adapter cho Supabase để đồng bộ với extension
export class SupabaseSyncStorage {
  private localStorage: Storage;
  private isExtension: boolean;
  private pendingSyncs: Map<string, string> = new Map();

  constructor() {
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
    this.isExtension = typeof chrome !== 'undefined' && chrome.storage !== undefined;
    
    // Restore từ chrome.storage khi khởi động (async, không block)
    if (this.isExtension) {
      this.restoreFromChrome();
    }
  }

  // Synchronous getItem (Supabase requirement)
  getItem(key: string): string | null {
    // Lấy từ localStorage (synchronous)
    const value = this.localStorage.getItem(key);
    
    // Sync lên chrome.storage trong background (async, không block)
    if (value && this.isExtension) {
      this.syncToChromeAsync(key, value);
    }
    
    return value;
  }

  // Synchronous setItem (Supabase requirement)
  setItem(key: string, value: string): void {
    // Lưu vào localStorage (synchronous)
    this.localStorage.setItem(key, value);
    
    // Sync lên chrome.storage trong background (async, không block)
    if (this.isExtension) {
      this.syncToChromeAsync(key, value);
    }
  }

  // Synchronous removeItem (Supabase requirement)
  removeItem(key: string): void {
    // Xóa khỏi localStorage (synchronous)
    this.localStorage.removeItem(key);
    
    // Xóa khỏi chrome.storage trong background (async, không block)
    if (this.isExtension) {
      this.removeFromChromeAsync(key);
    }
  }

  // Async methods for chrome.storage (background sync)
  private syncToChromeAsync(key: string, value: string): void {
    // Debounce: chỉ sync lần cuối cùng
    this.pendingSyncs.set(key, value);
    
    setTimeout(() => {
      const valueToSync = this.pendingSyncs.get(key);
      if (valueToSync) {
        this.pendingSyncs.delete(key);
        chrome.storage.local.set({ [key]: valueToSync }, () => {
          if (!chrome.runtime.lastError) {
            console.log('[StorageSync] Synced to chrome.storage:', key);
          }
        });
      }
    }, 100);
  }

  private removeFromChromeAsync(key: string): void {
    chrome.storage.local.remove([key], () => {
      if (!chrome.runtime.lastError) {
        console.log('[StorageSync] Removed from chrome.storage:', key);
      }
    });
  }

  // Restore từ chrome.storage khi khởi động
  private async restoreFromChrome(): Promise<void> {
    try {
      chrome.storage.local.get(['external-supabase-auth-token'], (result) => {
        if (chrome.runtime.lastError) return;
        
        const chromeValue = result['external-supabase-auth-token'];
        if (chromeValue) {
          const localValue = this.localStorage.getItem('external-supabase-auth-token');
          // Chỉ restore nếu localStorage không có hoặc khác
          if (!localValue || localValue !== chromeValue) {
            this.localStorage.setItem('external-supabase-auth-token', chromeValue);
            console.log('[StorageSync] Restored from chrome.storage to localStorage');
          }
        }
      });
    } catch (e) {
      console.warn('[StorageSync] Could not restore from chrome.storage:', e);
    }
  }
}

// Lắng nghe thay đổi từ chrome.storage và sync vào localStorage
export function setupStorageSync() {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return;
  }

  // Lắng nghe thay đổi từ chrome.storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    // Sync các thay đổi vào localStorage
    for (const key in changes) {
      if (key.startsWith('external-supabase-auth') || key.startsWith('sb-')) {
        const newValue = changes[key].newValue;
        if (newValue !== undefined) {
          localStorage.setItem(key, newValue);
          console.log('[StorageSync] Synced from chrome.storage to localStorage:', key);
        } else {
          localStorage.removeItem(key);
          console.log('[StorageSync] Removed from localStorage:', key);
        }
      }
    }
  });

  // Lắng nghe thay đổi từ localStorage (từ tab khác - storage event chỉ fire ở tab khác, không fire ở tab hiện tại)
  window.addEventListener('storage', (e) => {
    if (e.key && (e.key.startsWith('external-supabase-auth') || e.key.startsWith('sb-'))) {
      // Sync lên chrome.storage
      if (e.newValue) {
        try {
          const sessionData = JSON.parse(e.newValue);
          chrome.storage.local.set({ 
            [e.key]: e.newValue,
            lifeOSSession: sessionData // Also sync as lifeOSSession
          }, () => {
            if (!chrome.runtime.lastError) {
              console.log('[StorageSync] Synced from localStorage to chrome.storage:', e.key);
            }
          });
        } catch (e) {
          // Not JSON, sync as string
          chrome.storage.local.set({ [e.key]: e.newValue }, () => {
            if (!chrome.runtime.lastError) {
              console.log('[StorageSync] Synced from localStorage to chrome.storage:', e.key);
            }
          });
        }
      } else {
        chrome.storage.local.remove([e.key, 'lifeOSSession'], () => {
          if (!chrome.runtime.lastError) {
            console.log('[StorageSync] Removed from chrome.storage:', e.key);
          }
        });
      }
    }
  });
}

