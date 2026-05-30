import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAutoSync } from '@/hooks/useAutoSync';
import { getSyncQueueCount } from '@/lib/indexedDB';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function OfflineIndicator() {
  const { isOnline, wasOffline, pendingSyncCount, refreshPendingCount, lastOnlineAt } = useOnlineStatus();
  const { forceSync } = useAutoSync({ showNotifications: false });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isVisible, setIsVisible] = useState(false);

  // Show indicator when offline or has pending items
  useEffect(() => {
    setIsVisible(!isOnline || pendingSyncCount > 0);
  }, [isOnline, pendingSyncCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      toast.success('Đã kết nối lại mạng!', {
        description: pendingSyncCount > 0 
          ? `Đang đồng bộ ${pendingSyncCount} thay đổi...` 
          : 'Tất cả dữ liệu đã được đồng bộ',
        icon: <Wifi className="h-4 w-4" />,
      });
      
      if (pendingSyncCount > 0) {
        handleSync();
      }
    }
  }, [isOnline, wasOffline]);

  const handleSync = async () => {
    // Prevent multiple simultaneous syncs
    if (syncStatus === 'syncing' || !isOnline) {
      console.log('[OfflineIndicator] Sync skipped - already syncing or offline');
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      console.log('[OfflineIndicator] Starting manual sync...');
      const initialCount = await getSyncQueueCount();
      const success = await forceSync();
      
      // Refresh count after sync and get final count
      await refreshPendingCount();
      const finalCount = await getSyncQueueCount();
      const syncedCount = initialCount - finalCount;
      
      // Consider sync successful if:
      // 1. forceSync returned true, OR
      // 2. Some items were synced (count decreased), OR
      // 3. All items are now synced (finalCount === 0)
      if (success || syncedCount > 0 || finalCount === 0) {
        setSyncStatus('success');
        
        if (finalCount === 0) {
          // All items synced
          toast.success('Đồng bộ thành công!', {
            icon: <CheckCircle2 className="h-4 w-4" />,
          });
        } else if (syncedCount > 0) {
          // Partial success - some items synced
          toast.success(`Đã đồng bộ ${syncedCount} thay đổi`, {
            description: `Còn ${finalCount} thay đổi chờ đồng bộ`,
            icon: <CheckCircle2 className="h-4 w-4" />,
          });
        }
        
        // Hide success indicator after delay
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } else {
        // Only show error if nothing was synced AND there are still pending items
        if (finalCount > 0 && syncedCount === 0) {
          console.warn('[OfflineIndicator] Sync failed - no items synced');
          setSyncStatus('error');
          toast.error('Không thể đồng bộ dữ liệu', {
            description: 'Vui lòng kiểm tra kết nối mạng và thử lại',
            icon: <AlertCircle className="h-4 w-4" />,
          });
          
          setTimeout(() => {
            setSyncStatus('idle');
          }, 3000);
        } else {
          // No pending items or already synced - treat as success
          setSyncStatus('success');
          setTimeout(() => {
            setSyncStatus('idle');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('[OfflineIndicator] Sync error:', error);
      
      // Check if any items were synced before the error
      await refreshPendingCount();
      const currentCount = await getSyncQueueCount();
      const syncedCount = pendingSyncCount - currentCount;
      
      if (syncedCount > 0) {
        // Partial success - some items synced before error
        setSyncStatus('success');
        toast.success(`Đã đồng bộ ${syncedCount} thay đổi`, {
          description: currentCount > 0 ? `Còn ${currentCount} thay đổi chờ đồng bộ` : 'Đồng bộ hoàn tất',
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } else {
        // Complete failure
        setSyncStatus('error');
        toast.error('Lỗi đồng bộ dữ liệu', {
          description: error instanceof Error ? error.message : 'Sẽ thử lại sau',
          icon: <AlertCircle className="h-4 w-4" />,
        });
        
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    }
  };

  // Format time since last online
  const getTimeSinceOnline = () => {
    if (!lastOnlineAt) return null;
    const diff = Date.now() - lastOnlineAt.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa mới';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  if (!isVisible) return null;

  return (
    <TooltipProvider>
      <div
        className={cn(
          // Position above bottom nav (bottom nav is ~64px height, so bottom-20 = 80px is safe)
          'fixed bottom-20 left-4 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all duration-300',
          'backdrop-blur-sm border',
          // Ensure it doesn't block touches on mobile
          'touch-action-manipulation',
          // Mobile-specific: ensure it doesn't overlap with bottom nav
          'md:bottom-20 md:left-4 md:right-auto',
          !isOnline 
            ? 'bg-destructive/90 text-destructive-foreground border-destructive/50' 
            : syncStatus === 'error'
              ? 'bg-destructive/90 text-destructive-foreground border-destructive/50'
              : syncStatus === 'success'
                ? 'bg-green-500/90 text-white border-green-500/50'
                : 'bg-warning/90 text-warning-foreground border-warning/50'
        )}
        style={{
          // Ensure it doesn't interfere with bottom nav
          maxWidth: 'calc(100vw - 2rem)',
          // Only allow pointer events on the indicator itself
          pointerEvents: 'auto',
          // Ensure it's below bottom nav (z-50)
          zIndex: 30,
        }}
        onTouchStart={(e) => {
          // Stop propagation to prevent triggering clicks on elements below
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          // Stop propagation
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Stop propagation to prevent triggering clicks on elements below
          e.stopPropagation();
        }}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Offline</span>
              {lastOnlineAt && (
                <span className="text-xs opacity-75">
                  Online {getTimeSinceOnline()}
                </span>
              )}
            </div>
            {pendingSyncCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                    {pendingSyncCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{pendingSyncCount} thay đổi chờ đồng bộ</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        ) : syncStatus === 'success' ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Đã đồng bộ!</span>
          </>
        ) : syncStatus === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Lỗi đồng bộ</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-white/20"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSync();
              }}
              type="button"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4" />
            <span className="text-sm font-medium">{pendingSyncCount} chưa đồng bộ</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-foreground/10 touch-action-manipulation"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSync();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
              disabled={syncStatus === 'syncing'}
              type="button"
            >
              <RefreshCw className={cn('h-3 w-3', syncStatus === 'syncing' && 'animate-spin')} />
            </Button>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// Full-width banner for top of page (optional usage)
export function OfflineBanner() {
  const { isOnline, pendingSyncCount } = useOnlineStatus();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      className={cn(
        'w-full px-4 py-2 text-center text-sm font-medium transition-all',
        !isOnline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-warning text-foreground'
      )}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <CloudOff className="h-4 w-4" />
          <span>Bạn đang offline - Dữ liệu sẽ được lưu local</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Cloud className="h-4 w-4" />
          <span>{pendingSyncCount} thay đổi đang chờ đồng bộ</span>
        </div>
      )}
    </div>
  );
}
