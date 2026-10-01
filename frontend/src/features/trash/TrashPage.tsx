import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Clock, RotateCcw, Settings, Trash, Trash2 } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/brand/EmptyState';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { AreaChip, HeroBanner, IconButton, MascotCard, Page, PageHeader, SectionTitle, SegmentedTabs, StatTile, Surface, TINTS, type Tint } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
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

const TYPE_META: Record<TrashItem['type'], { icon: LifeIconName; tint: Tint }> = {
  note: { icon: 'module/notes', tint: 'amber' },
  task: { icon: 'module/tasks', tint: 'violet' },
  goal: { icon: 'module/goals', tint: 'rose' },
  habit: { icon: 'module/habits', tint: 'mint' },
};

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
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error((error as Error).message || 'Không thể dọn sạch thùng rác. Vui lòng thử lại.');
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

  const getItemTypeName = (type: TrashItem['type']) => {
    switch (type) {
      case 'note': return 'Ghi chú';
      case 'task': return 'Công việc';
      case 'goal': return 'Mục tiêu';
      case 'habit': return 'Thói quen';
    }
  };

  const getItemArea = (item: TrashItem) => {
    const areaId = 'area' in item.data ? item.data.area : undefined;
    if (!areaId) return null;
    return LIFE_AREAS.find((a) => a.id === areaId);
  };

  const [emptyOpen, setEmptyOpen] = useState(false);
  const soon = trashedItems.filter((i) => { const d = getDaysRemaining(i.data.deletedAt!); return d !== null && d <= 3; }).length;
  const autoLabel = trashSettings.enabled && trashSettings.autoCleanupDays > 0 ? `Tự động xóa sau ${trashSettings.autoCleanupDays} ngày` : 'Không tự động xóa';

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tự động dọn dẹp" action={<button className="text-[12px] font-semibold text-primary" onClick={() => setSettingsOpen(true)}>Cài đặt</button>} />
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[13.5px] font-semibold">Tự động xóa vĩnh viễn</p><p className="text-[11.5px] text-muted-foreground">{autoLabel}</p></div>
          <Switch checked={trashSettings.enabled} onCheckedChange={(checked) => setTrashSettings({ enabled: checked })} />
        </div>
        {trashSettings.enabled && (
          <Select value={String(trashSettings.autoCleanupDays)} onValueChange={(value) => setTrashSettings({ autoCleanupDays: parseInt(value) })}>
            <SelectTrigger className="mt-3 h-10 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>{AUTO_CLEANUP_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </Surface>
      <MascotCard mascot="mochi" pose="rest" title="Đừng lo" quote="Mục đã xóa vẫn ở đây — bạn có thể khôi phục bất cứ lúc nào." />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Thùng rác" subtitle={`${trashedItems.length} mục đã xóa · ${autoLabel}`}
        actions={<>
          <IconButton label="Cài đặt thùng rác" onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4" /></IconButton>
          {trashedItems.length > 0 && <Button variant="destructive" className="h-10 rounded-full px-4" disabled={isEmptying} onClick={() => setEmptyOpen(true)}><Trash className="h-4 w-4 mr-1.5" />{isEmptying ? 'Đang xóa...' : 'Dọn sạch'}</Button>}
        </>} />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'note', label: 'Ghi chú', count: counts.note }, { id: 'task', label: 'Công việc', count: counts.task }, { id: 'goal', label: 'Mục tiêu', count: counts.goal }, { id: 'habit', label: 'Thói quen', count: counts.habit }]} value={filterType} onChange={setFilterType} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="mochi" pose="rest" title={trashedItems.length ? 'Dọn dẹp cho nhẹ nhàng' : 'Thùng rác đang trống ✨'} subtitle={trashedItems.length ? `Khôi phục mục cần giữ, xóa vĩnh viễn mục không cần nữa.${soon ? ` ${soon} mục sắp bị tự động xóa.` : ''}` : 'Không có mục nào trong thùng rác.'} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(['note', 'task', 'goal', 'habit'] as const).map((t) => (
              <StatTile key={t} icon={TYPE_META[t].icon} tint={TYPE_META[t].tint} value={counts[t]} label={getItemTypeName(t)} hint="đã xóa" onClick={() => setFilterType(filterType === t ? 'all' : t)} active={filterType === t} />
            ))}
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Mục đã xóa" hint={`${filteredItems.length} mục`} /></div>
            {trashedItems.length === 0 ? (
              <EmptyState mascot="mochi" pose="rest" title="Thùng rác trống" description="Không có mục nào trong thùng rác." />
            ) : filteredItems.length === 0 ? (
              <EmptyState mascot="mochi" compact title={`Không có ${getItemTypeName(filterType as TrashItem['type']).toLowerCase()} nào trong thùng rác`} />
            ) : (
              <div className="divide-y divide-border/50">
                {filteredItems.map((item) => {
                  const daysRemaining = getDaysRemaining(item.data.deletedAt!);
                  const area = getItemArea(item);
                  const m = TYPE_META[item.type];
                  return (
                    <div key={`${item.type}-${item.data.id}`} className="flex items-start gap-3 px-1 py-3">
                      <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center shrink-0', TINTS[m.tint].bg)}><LifeIcon name={m.icon} size={20} variant="duotone" /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[14px] font-semibold truncate max-w-full">{getItemTitle(item)}</p>
                          {area && <AreaChip area={area.id} label={area.name} />}
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{getItemDescription(item)}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span className="font-semibold">{getItemTypeName(item.type)}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Đã xóa {format(new Date(item.data.deletedAt!), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                          {daysRemaining !== null && <span className={cn('rounded-full px-2 py-0.5 font-semibold', daysRemaining <= 3 ? 'bg-[#FFE4EA] text-[#E0445E]' : 'bg-secondary')}>{daysRemaining === 0 ? 'Sắp xóa' : `Còn ${daysRemaining} ngày`}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" className="rounded-full h-8" onClick={() => handleRestore(item)}><RotateCcw className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline">Khôi phục</span></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" aria-label="Xóa vĩnh viễn" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Surface>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>

      <AdaptiveModal open={settingsOpen} onOpenChange={setSettingsOpen} title="Cài đặt Thùng rác" description="Quản lý tự động dọn dẹp thùng rác">
        <div className="space-y-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[14px] font-semibold">Tự động dọn dẹp</p><p className="text-[12px] text-muted-foreground">Tự động xóa vĩnh viễn các mục cũ</p></div>
            <Switch checked={trashSettings.enabled} onCheckedChange={(checked) => setTrashSettings({ enabled: checked })} />
          </div>
          {trashSettings.enabled && (
            <div>
              <p className="text-[12.5px] font-semibold text-muted-foreground mb-1.5">Xóa sau bao lâu</p>
              <Select value={String(trashSettings.autoCleanupDays)} onValueChange={(value) => setTrashSettings({ autoCleanupDays: parseInt(value) })}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{AUTO_CLEANUP_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </AdaptiveModal>

      <AlertDialog open={emptyOpen} onOpenChange={setEmptyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dọn sạch thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>Tất cả {trashedItems.length} mục sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEmptying}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyTrash} disabled={isEmptying} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isEmptying ? 'Đang xóa...' : 'Xóa tất cả'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Xóa vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>{itemToDelete && `${getItemTypeName(itemToDelete.type)} "${getItemTitle(itemToDelete)}" sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa vĩnh viễn</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
