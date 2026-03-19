import { useDataSync } from '@/hooks/sync/useDataSync';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const { syncState, pendingCount, forceRefresh } = useDataSync();
  const { status, lastSyncTime, error, usingExternalSupabase } = syncState;

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: RefreshCw,
          label: 'Đang tải...',
          className: 'animate-spin text-primary',
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          label: 'Đang đồng bộ...',
          className: 'animate-spin text-primary',
        };
      case 'success':
        return {
          icon: Check,
          label: 'Đã đồng bộ',
          className: 'text-green-500',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: error || 'Lỗi đồng bộ',
          className: 'text-destructive',
        };
      default:
        return {
          icon: Cloud,
          label: 'Sẵn sàng',
          className: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Chưa đồng bộ';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return lastSyncTime.toLocaleDateString('vi-VN');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 relative"
          onClick={() => status !== 'loading' && status !== 'syncing' && forceRefresh()}
          disabled={status === 'loading' || status === 'syncing'}
        >
          <Icon className={cn("h-4 w-4", config.className)} />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            {usingExternalSupabase ? (
              <Cloud className="h-3 w-3" />
            ) : (
              <CloudOff className="h-3 w-3" />
            )}
            <span>{usingExternalSupabase ? 'External DB' : 'Local'}</span>
          </div>
          <div className="font-medium">{config.label}</div>
          <div className="text-muted-foreground">{formatLastSync()}</div>
          {pendingCount > 0 && (
            <div className="text-primary">{pendingCount} thay đổi chờ đồng bộ</div>
          )}
          {status === 'error' && error && (
            <div className="text-destructive text-[10px]">{error}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
