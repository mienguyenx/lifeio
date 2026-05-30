import { useState, useMemo, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Settings, Clock, Trash, CheckCircle, FileText, Target, Flame, ListTodo } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import type { Note, Task, Goal, Habit } from '@/types/lifeos';
import { LIFE_AREAS } from '@/types/lifeos';

const AUTO_CLEANUP_OPTIONS = [
  { value: '0', label: 'Không tự động xóa' },
  { value: '7', label: 'Sau 7 ngày' },
  { value: '14', label: 'Sau 14 ngày' },
  { value: '30', label: 'Sau 30 ngày' },
  { value: '60', label: 'Sau 60 ngày' },
  { value: '90', label: 'Sau 90 ngày' },
];

type TrashItem = 
  | { type: 'note'; data: Note }
  | { type: 'task'; data: Task }
  | { type: 'goal'; data: Goal }
  | { type: 'habit'; data: Habit };

type FilterType = 'all' | 'note' | 'task' | 'goal' | 'habit';

export default function TrashPage() {
  const notes = useLifeOSStore((s) => s.notes);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const habits = useLifeOSStore((s) => s.habits);
  
  // Use synced store for operations that need to sync to Supabase
  const { 
    permanentDeleteTask,
    permanentDeleteNote,
    permanentDeleteGoal,
    permanentDeleteHabit,
    emptyTrash,
    restoreTask,
    restoreNote,
    restoreGoal,
    restoreHabit
  } = useSyncedStore();
  
  const trashSettings = useLifeOSStore((s) => s.trashSettings);
  const setTrashSettings = useLifeOSStore((s) => s.setTrashSettings);
  const isMobile = useIsMobile();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isEmptying, setIsEmptying] = useState(false);

  // Get all trashed items
  const trashedItems = useMemo(() => {
    const items: TrashItem[] = [];
    
    notes.filter((n) => n.deletedAt).forEach((n) => items.push({ type: 'note', data: n }));
    tasks.filter((t) => t.deletedAt).forEach((t) => items.push({ type: 'task', data: t }));
    goals.filter((g) => g.deletedAt).forEach((g) => items.push({ type: 'goal', data: g }));
    habits.filter((h) => h.deletedAt).forEach((h) => items.push({ type: 'habit', data: h }));
    
    // Sort by deletedAt desc
    items.sort((a, b) => {
      const dateA = a.data.deletedAt || '';
      const dateB = b.data.deletedAt || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    return items;
  }, [notes, tasks, goals, habits]);

  // Filter items by type
  const filteredItems = useMemo(() => {
    if (filterType === 'all') return trashedItems;
    return trashedItems.filter((item) => item.type === filterType);
  }, [trashedItems, filterType]);

  // Count by type
  const counts = useMemo(() => ({
    all: trashedItems.length,
    note: trashedItems.filter((i) => i.type === 'note').length,
    task: trashedItems.filter((i) => i.type === 'task').length,
    goal: trashedItems.filter((i) => i.type === 'goal').length,
    habit: trashedItems.filter((i) => i.type === 'habit').length,
  }), [trashedItems]);

  // Auto cleanup
  useEffect(() => {
    if (!trashSettings.enabled || trashSettings.autoCleanupDays === 0) return;

    const now = new Date();
    trashedItems.forEach((item) => {
      if (item.data.deletedAt) {
        const daysSinceDeleted = differenceInDays(now, parseISO(item.data.deletedAt));
        if (daysSinceDeleted >= trashSettings.autoCleanupDays) {
          switch (item.type) {
            case 'note': permanentDeleteNote(item.data.id); break;
            case 'task': permanentDeleteTask(item.data.id); break;
            case 'goal': permanentDeleteGoal(item.data.id); break;
            case 'habit': permanentDeleteHabit(item.data.id); break;
          }
        }
      }
    });
  }, [trashedItems, trashSettings, permanentDeleteNote, permanentDeleteTask, permanentDeleteGoal, permanentDeleteHabit]);

  const handleRestore = (item: TrashItem) => {
    switch (item.type) {
      case 'note': restoreNote(item.data.id); break;
      case 'task': restoreTask(item.data.id); break;
      case 'goal': restoreGoal(item.data.id); break;
      case 'habit': restoreHabit(item.data.id); break;
    }
    toast.success('Đã khôi phục!');
  };

  const handlePermanentDelete = () => {
    if (itemToDelete) {
      switch (itemToDelete.type) {
        case 'note': permanentDeleteNote(itemToDelete.data.id); break;
        case 'task': permanentDeleteTask(itemToDelete.data.id); break;
        case 'goal': permanentDeleteGoal(itemToDelete.data.id); break;
        case 'habit': permanentDeleteHabit(itemToDelete.data.id); break;
      }
      setItemToDelete(null);
      setDeleteDialogOpen(false);
      toast.success('Đã xóa vĩnh viễn!');
    }
  };

  const handleEmptyTrash = async () => {
    if (isEmptying || trashedItems.length === 0) return;
    
    try {
      setIsEmptying(true);
      const result = await emptyTrash();
      
      if (result?.success) {
        toast.success(`Đã dọn sạch thùng rác! Đã xóa ${result.deleted || trashedItems.length} mục.`);
        if (result.failed && result.failed > 0) {
          toast.warning(`${result.failed} mục không thể xóa từ database, nhưng đã xóa khỏi local.`);
        }
      } else {
        toast.error('Không thể dọn sạch thùng rác. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      toast.error(error.message || 'Không thể dọn sạch thùng rác. Vui lòng thử lại.');
    } finally {
      setIsEmptying(false);
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    if (trashSettings.autoCleanupDays === 0) return null;
    const daysSinceDeleted = differenceInDays(new Date(), parseISO(deletedAt));
    const remaining = trashSettings.autoCleanupDays - daysSinceDeleted;
    return remaining > 0 ? remaining : 0;
  };

  const getItemTitle = (item: TrashItem) => {
    switch (item.type) {
      case 'note': return (item.data as Note).title;
      case 'task': return (item.data as Task).title;
      case 'goal': return (item.data as Goal).title;
      case 'habit': return (item.data as Habit).name;
    }
  };

  const getItemDescription = (item: TrashItem) => {
    switch (item.type) {
      case 'note': return (item.data as Note).content || 'Không có nội dung';
      case 'task': return (item.data as Task).description || 'Không có mô tả';
      case 'goal': return (item.data as Goal).description || 'Không có mô tả';
      case 'habit': return (item.data as Habit).description || 'Không có mô tả';
    }
  };

  const getItemIcon = (type: TrashItem['type']) => {
    switch (type) {
      case 'note': return <FileText className="w-4 h-4" />;
      case 'task': return <ListTodo className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      case 'habit': return <Flame className="w-4 h-4" />;
    }
  };

  const getItemTypeName = (type: TrashItem['type']) => {
    switch (type) {
      case 'note': return 'Ghi chú';
      case 'task': return 'Task';
      case 'goal': return 'Goal';
      case 'habit': return 'Habit';
    }
  };

  const getItemArea = (item: TrashItem) => {
    const areaId = (item.data as any).area;
    if (!areaId) return null;
    return LIFE_AREAS.find((a) => a.id === areaId);
  };

  return (
    <div className={cn("p-4 md:p-6 space-y-6", !isMobile && "max-w-4xl mx-auto")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6" /> Thùng rác
          </h1>
          <p className="text-muted-foreground">
            {trashedItems.length} mục đã xóa
            {trashSettings.enabled && trashSettings.autoCleanupDays > 0 && (
              <span className="text-xs ml-2">• Tự động xóa sau {trashSettings.autoCleanupDays} ngày</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Settings */}
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
          </Button>
          <AdaptiveModal open={settingsOpen} onOpenChange={setSettingsOpen} title="Cài đặt Thùng rác" description="Quản lý tự động dọn dẹp thùng rác">
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tự động dọn dẹp</Label>
                    <p className="text-sm text-muted-foreground">Tự động xóa vĩnh viễn các mục cũ</p>
                  </div>
                  <Switch
                    checked={trashSettings.enabled}
                    onCheckedChange={(checked) => setTrashSettings({ enabled: checked })}
                  />
                </div>
                {trashSettings.enabled && (
                  <div>
                    <Label>Xóa sau bao lâu</Label>
                    <Select
                      value={String(trashSettings.autoCleanupDays)}
                      onValueChange={(value) => setTrashSettings({ autoCleanupDays: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTO_CLEANUP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
          </AdaptiveModal>

          {/* Empty Trash */}
          {trashedItems.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isEmptying}>
                  <Trash className="w-4 h-4 mr-2" /> 
                  {isEmptying ? 'Đang xóa...' : 'Dọn sạch'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Dọn sạch thùng rác?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tất cả {trashedItems.length} mục sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isEmptying}>Hủy</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleEmptyTrash} 
                    disabled={isEmptying}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {isEmptying ? 'Đang xóa...' : 'Xóa tất cả'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {trashedItems.length > 0 && (
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="gap-1">
              Tất cả {counts.all > 0 && <Badge variant="secondary" className="text-xs">{counts.all}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="note" className="gap-1">
              <FileText className="w-3 h-3" /> {counts.note > 0 && <Badge variant="secondary" className="text-xs">{counts.note}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="task" className="gap-1">
              <ListTodo className="w-3 h-3" /> {counts.task > 0 && <Badge variant="secondary" className="text-xs">{counts.task}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="goal" className="gap-1">
              <Target className="w-3 h-3" /> {counts.goal > 0 && <Badge variant="secondary" className="text-xs">{counts.goal}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="habit" className="gap-1">
              <Flame className="w-3 h-3" /> {counts.habit > 0 && <Badge variant="secondary" className="text-xs">{counts.habit}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Empty State */}
      {trashedItems.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-lg">Thùng rác trống</h3>
            <p className="text-muted-foreground text-sm mt-1">Không có mục nào trong thùng rác</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-lg">Không có {getItemTypeName(filterType as TrashItem['type']).toLowerCase()} nào trong thùng rác</h3>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const daysRemaining = getDaysRemaining(item.data.deletedAt!);
              const area = getItemArea(item);
              return (
                <Card key={`${item.type}-${item.data.id}`} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs gap-1">
                            {getItemIcon(item.type)}
                            {getItemTypeName(item.type)}
                          </Badge>
                          {area && (
                            <span className="text-xs">{area.icon}</span>
                          )}
                        </div>
                        <h3 className="font-medium truncate mt-1">{getItemTitle(item)}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {getItemDescription(item)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Đã xóa {format(new Date(item.data.deletedAt!), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </span>
                          {daysRemaining !== null && (
                            <Badge variant={daysRemaining <= 3 ? 'destructive' : 'secondary'} className="text-xs">
                              {daysRemaining === 0 ? 'Sắp xóa' : `Còn ${daysRemaining} ngày`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleRestore(item)}>
                          <RotateCcw className="w-4 h-4 mr-1" /> Khôi phục
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Permanent Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Xóa vĩnh viễn?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete && `${getItemTypeName(itemToDelete.type)} "${getItemTitle(itemToDelete)}" sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground">
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}