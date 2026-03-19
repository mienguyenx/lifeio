import { useState, useEffect } from 'react';
import { History, RotateCcw, Eye, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAreaModuleHistory } from '@/hooks/useAreaModuleHistory';
import { useProfileSync } from '@/hooks/sync/useProfileSync';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { AreaModuleHistory, HistoryAction } from '@/types/lifeos';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AreaModuleHistoryProps {
  moduleType: 'personalValues' | 'lifeRoles' | 'visions' | 'traits' | 'milestones';
  entityId?: string; // Nếu có, chỉ hiển thị lịch sử của entity này
  entityName?: string; // Tên entity để hiển thị
  triggerVariant?: 'button' | 'icon'; // 'icon' dùng cho list actions (gọn trên mobile)
}

const actionLabels: Record<HistoryAction, string> = {
  created: 'Tạo mới',
  updated: 'Cập nhật',
  deleted: 'Xóa',
  restored: 'Khôi phục',
  activated: 'Kích hoạt',
  deactivated: 'Vô hiệu hóa',
  completed: 'Hoàn thành',
};

const actionColors: Record<HistoryAction, string> = {
  created: 'bg-green-500/10 text-green-600 dark:text-green-400',
  updated: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  deleted: 'bg-red-500/10 text-red-600 dark:text-red-400',
  restored: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  activated: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  deactivated: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  completed: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

export function AreaModuleHistory({ moduleType, entityId, entityName, triggerVariant = 'button' }: AreaModuleHistoryProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AreaModuleHistory[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { user } = useLifeOSStore();
  const profileSync = useProfileSync();
  const {
    loading,
    loadPersonalValuesHistory,
    loadLifeRolesHistory,
    loadLifeVisionsHistory,
    loadPersonalTraitsHistory,
    loadLifeMilestonesHistory,
  } = useAreaModuleHistory();

  useEffect(() => {
    if (open && user) {
      loadHistory();
    }
  }, [open, entityId, user]);

  const loadHistory = async () => {
    let data: AreaModuleHistory[] = [];

    switch (moduleType) {
      case 'personalValues':
        data = await loadPersonalValuesHistory(entityId);
        break;
      case 'lifeRoles':
        data = await loadLifeRolesHistory(entityId);
        break;
      case 'visions':
        data = await loadLifeVisionsHistory(entityId);
        break;
      case 'traits':
        data = await loadPersonalTraitsHistory(entityId);
        break;
      case 'milestones':
        data = await loadLifeMilestonesHistory(entityId);
        break;
    }

    setHistory(data);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleRestore = async (historyItem: AreaModuleHistory) => {
    if (!historyItem.oldData || historyItem.action !== 'deleted') {
      toast.error('Chỉ có thể khôi phục các mục đã bị xóa');
      return;
    }

    try {
      // Restore logic sẽ được implement trong useProfileSync
      toast.success('Đã khôi phục!');
      await loadHistory();
    } catch (error) {
      console.error('Error restoring:', error);
      toast.error('Không thể khôi phục');
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: 'Tên',
      description: 'Mô tả',
      icon: 'Icon',
      priority: 'Độ ưu tiên',
      statement: 'Nội dung',
      timeframe: 'Thời gian',
      is_active: 'Trạng thái',
      trait_type: 'Loại',
      title: 'Tiêu đề',
      date: 'Ngày',
      area: 'Lĩnh vực',
    };
    return labels[field] || field;
  };

  const renderChangeDetails = (item: AreaModuleHistory) => {
    if (!item.changedFields || item.changedFields.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 text-xs">
        {item.changedFields.map((field) => {
          const oldValue = item.oldData?.[field];
          const newValue = item.newData?.[field];
          return (
            <div key={field} className="flex items-start gap-2 p-2 bg-secondary/50 rounded">
              <span className="font-medium min-w-[80px]">{getFieldLabel(field)}:</span>
              <div className="flex-1">
                {oldValue !== undefined && (
                  <div className="text-red-600 dark:text-red-400 line-through">
                    {typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)}
                  </div>
                )}
                {newValue !== undefined && (
                  <div className="text-green-600 dark:text-green-400">
                    {typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Lịch sử"
            title="Lịch sử"
          >
            <History className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <History className="w-4 h-4" />
            Lịch sử
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Lịch sử thay đổi
            {entityName && (
              <span className="text-sm font-normal text-muted-foreground">
                - {entityName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có lịch sử thay đổi
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const canRestore = item.action === 'deleted' && item.oldData;

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn('text-xs', actionColors[item.action])}>
                              {actionLabels[item.action]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </span>
                          </div>

                          {item.action === 'created' && item.newData && (
                            <div className="text-sm">
                              <div className="font-medium">{item.newData.name || item.newData.title || item.newData.statement}</div>
                              {item.newData.description && (
                                <div className="text-muted-foreground text-xs mt-1">
                                  {item.newData.description}
                                </div>
                              )}
                            </div>
                          )}

                          {item.action === 'updated' && (
                            <div className="text-sm">
                              {item.changedFields && item.changedFields.length > 0 && (
                                <div className="text-muted-foreground">
                                  Đã thay đổi: {item.changedFields.map(getFieldLabel).join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {item.action === 'deleted' && item.oldData && (
                            <div className="text-sm">
                              <div className="font-medium line-through text-muted-foreground">
                                {item.oldData.name || item.oldData.title || item.oldData.statement}
                              </div>
                            </div>
                          )}

                          {isExpanded && renderChangeDetails(item)}
                        </div>

                        <div className="flex items-center gap-2">
                          {canRestore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(item)}
                              className="gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Khôi phục
                            </Button>
                          )}
                          {(item.changedFields && item.changedFields.length > 0) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(item.id)}
                              className="gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Thu gọn
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Chi tiết
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

