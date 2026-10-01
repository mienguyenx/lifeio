import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Check, Clock, RotateCcw, Settings, ShieldCheck, Trash, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { HeroBanner, IconButton, MascotCard, Page, PageHeader, ProgressBar, SectionTitle, SegmentedTabs, StatTile, Surface, TINTS, type Tint } from '@/components/lio';
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

const TYPE_COLOR: Record<'note' | 'task' | 'goal' | 'habit', string> = { note: '#F5A524', task: '#7C5CFC', goal: '#F0587A', habit: '#22B07D' };

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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const keyOf = (i: TrashItem) => `${i.type}-${i.data.id}`;
  const soon = trashedItems.filter((i) => { const d = getDaysRemaining(i.data.deletedAt!); return d !== null && d <= 3; }).length;
  const autoOn = trashSettings.enabled && trashSettings.autoCleanupDays > 0;
  const autoLabel = autoOn ? `Tự động xóa sau ${trashSettings.autoCleanupDays} ngày` : 'Không tự động xóa';

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedKeys.has(keyOf(i)));
  const toggleKey = (k: string) => setSelectedKeys((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const toggleAll = () => setSelectedKeys(allSelected ? new Set() : new Set(filteredItems.map(keyOf)));
  const selectedItems = trashedItems.filter((i) => selectedKeys.has(keyOf(i)));
  const restoreOne = (item: TrashItem) => {
    switch (item.type) {
      case 'note': restoreNote(item.data.id); break;
      case 'task': restoreTask(item.data.id); break;
      case 'goal': restoreGoal(item.data.id); break;
      case 'habit': restoreHabit(item.data.id); break;
    }
  };
  const deleteOne = (item: TrashItem) => {
    switch (item.type) {
      case 'note': permanentDeleteNote(item.data.id); break;
      case 'task': permanentDeleteTask(item.data.id); break;
      case 'goal': permanentDeleteGoal(item.data.id); break;
      case 'habit': permanentDeleteHabit(item.data.id); break;
    }
  };
  const bulkRestore = () => { selectedItems.forEach(restoreOne); toast.success(`Đã khôi phục ${selectedItems.length} mục`); setSelectedKeys(new Set()); };
  const bulkDelete = () => { selectedItems.forEach(deleteOne); toast.success(`Đã xóa vĩnh viễn ${selectedItems.length} mục`); setSelectedKeys(new Set()); setBulkDeleteOpen(false); };

  const CLEANUP_DAYS = [7, 14, 30, 60, 90];
  const checkbox = (on: boolean, onToggle: () => void, label: string) => (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onToggle}
      className={cn('h-[18px] w-[18px] rounded-md border-2 grid place-items-center shrink-0 transition-colors', on ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/60')}>
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
  const remainingPill = (item: TrashItem) => {
    const d = getDaysRemaining(item.data.deletedAt!);
    if (d === null || !trashSettings.enabled) return <span className="text-[12px] text-muted-foreground">—</span>;
    return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', d <= 3 ? 'bg-[#FFE4EA] text-[#E0445E]' : d <= 7 ? 'bg-[#FFF4DB] text-[#B7791F]' : 'bg-secondary text-foreground/70')}>{d === 0 ? 'Sắp xóa' : `${d} ngày`}</span>;
  };

  const policies = [
    { ok: true, title: 'Khôi phục bất cứ lúc nào', desc: 'Mục đã xóa giữ nguyên dữ liệu cho đến khi bạn xóa vĩnh viễn.' },
    { ok: autoOn, title: autoOn ? `Tự dọn sau ${trashSettings.autoCleanupDays} ngày` : 'Tự động dọn đang tắt', desc: autoOn ? 'Mục quá hạn sẽ bị xóa vĩnh viễn khi mở Thùng rác.' : 'Mục ở lại thùng rác cho đến khi bạn tự xóa.' },
    { ok: true, title: 'Xóa vĩnh viễn là không thể hoàn tác', desc: 'Dữ liệu bị gỡ khỏi máy và tài khoản đồng bộ.' },
  ];

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tự động dọn dẹp" action={<button className="text-[12px] font-semibold text-primary" onClick={() => setSettingsOpen(true)}>Chi tiết</button>} />
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[13.5px] font-semibold">Tự động xóa vĩnh viễn</p><p className="text-[11.5px] text-muted-foreground">{autoLabel}</p></div>
          <Switch checked={trashSettings.enabled} onCheckedChange={(checked) => setTrashSettings({ enabled: checked, ...(checked && trashSettings.autoCleanupDays === 0 ? { autoCleanupDays: 30 } : {}) })} aria-label="Tự động xóa vĩnh viễn" />
        </div>
        {trashSettings.enabled && (
          <>
            <p className="text-[12px] font-semibold text-muted-foreground mt-3 mb-1.5">Xóa sau (ngày)</p>
            <div className="grid grid-cols-5 gap-1.5">
              {CLEANUP_DAYS.map((d) => (
                <button key={d} onClick={() => setTrashSettings({ autoCleanupDays: d })} className={cn('h-9 rounded-xl text-[12.5px] font-semibold border transition-colors', trashSettings.autoCleanupDays === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/70 hover:bg-secondary')}>{d}</button>
              ))}
            </div>
          </>
        )}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Thao tác nhanh" />
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start rounded-full" disabled={selectedItems.length === 0} onClick={bulkRestore}><RotateCcw className="h-4 w-4 mr-2" />Khôi phục mục đã chọn{selectedItems.length ? ` (${selectedItems.length})` : ''}</Button>
          <Button variant="outline" className="w-full justify-start rounded-full text-destructive hover:text-destructive" disabled={selectedItems.length === 0} onClick={() => setBulkDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Xóa vĩnh viễn mục đã chọn</Button>
          <Button variant="destructive" className="w-full justify-start rounded-full" disabled={trashedItems.length === 0 || isEmptying} onClick={() => setEmptyOpen(true)}><Trash className="h-4 w-4 mr-2" />{isEmptying ? 'Đang xóa...' : 'Dọn sạch thùng rác'}</Button>
        </div>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Tổng quan dữ liệu đã xóa" hint={`${counts.all} mục`} />
        {counts.all === 0 ? <p className="text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</p> : (
          <div className="space-y-2.5">
            {(['note', 'task', 'goal', 'habit'] as const).map((t) => {
              const pct = counts.all ? Math.round((counts[t] / counts.all) * 100) : 0;
              return (
                <div key={t}>
                  <div className="flex items-center gap-2 text-[12.5px] mb-1">
                    <LifeIcon name={TYPE_META[t].icon} size={16} variant="duotone" />
                    <span className="flex-1 font-semibold">{getItemTypeName(t)}</span>
                    <span className="text-muted-foreground font-semibold">{counts[t]} · {pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={TYPE_COLOR[t]} height={6} />
                </div>
              );
            })}
          </div>
        )}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Chính sách & quyền riêng tư" />
        <div className="space-y-2.5">
          {policies.map((p) => (
            <div key={p.title} className="flex items-start gap-2.5">
              <span className={cn('mt-0.5 h-5 w-5 rounded-full grid place-items-center shrink-0', p.ok ? 'bg-[#E3F8EE] text-[#1F9D63]' : 'bg-secondary text-muted-foreground')}>{p.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <Clock className="h-3 w-3" />}</span>
              <div><p className="text-[13px] font-semibold leading-tight">{p.title}</p><p className="text-[11.5px] text-muted-foreground">{p.desc}</p></div>
            </div>
          ))}
        </div>
        <Link to="/settings?tab=data" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" />Xuất / nhập dữ liệu trong Cài đặt</Link>
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
        <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'note', label: 'Ghi chú', count: counts.note }, { id: 'task', label: 'Công việc', count: counts.task }, { id: 'goal', label: 'Mục tiêu', count: counts.goal }, { id: 'habit', label: 'Thói quen', count: counts.habit }]} value={filterType} onChange={(v) => { setFilterType(v); setSelectedKeys(new Set()); }} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="mochi" pose="rest" title={trashedItems.length ? 'Dọn dẹp cho nhẹ nhàng' : 'Thùng rác đang trống ✨'} subtitle={trashedItems.length ? `Khôi phục mục cần giữ, xóa vĩnh viễn mục không cần nữa.${soon ? ` ${soon} mục sắp bị tự động xóa.` : ''}` : 'Không có mục nào trong thùng rác.'} />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatTile icon="module/trash" tint="rose" value={counts.all} label="Tổng mục" hint={soon ? `${soon} sắp tự xóa` : 'mọi loại'} onClick={() => setFilterType('all')} active={filterType === 'all'} />
            {(['note', 'task', 'goal', 'habit'] as const).map((t) => (
              <StatTile key={t} icon={TYPE_META[t].icon} tint={TYPE_META[t].tint} value={counts[t]} label={getItemTypeName(t)} hint="đã xóa" onClick={() => setFilterType(filterType === t ? 'all' : t)} active={filterType === t} />
            ))}
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Mục đã xóa" hint={`${filteredItems.length} mục`} /></div>
            {selectedKeys.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap rounded-2xl bg-primary/10 px-3 py-2 mb-3">
                <span className="text-[13px] font-semibold text-primary mr-auto">Đã chọn {selectedKeys.size}</span>
                <Button size="sm" variant="outline" className="h-8 rounded-full bg-card" onClick={bulkRestore}><RotateCcw className="h-3.5 w-3.5 mr-1" />Khôi phục</Button>
                <Button size="sm" variant="outline" className="h-8 rounded-full bg-card text-destructive hover:text-destructive" onClick={() => setBulkDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" />Xóa vĩnh viễn</Button>
                <IconButton label="Bỏ chọn" onClick={() => setSelectedKeys(new Set())}><X className="h-4 w-4" /></IconButton>
              </div>
            )}
            {trashedItems.length === 0 ? (
              <EmptyState mascot="mochi" pose="rest" title="Thùng rác trống" description="Không có mục nào trong thùng rác." />
            ) : filteredItems.length === 0 ? (
              <EmptyState mascot="mochi" compact title={`Không có ${getItemTypeName(filterType as TrashItem['type']).toLowerCase()} nào trong thùng rác`} />
            ) : isMobile ? (
              <div className="divide-y divide-border/50">
                {filteredItems.map((item) => {
                  const m = TYPE_META[item.type];
                  const k = keyOf(item);
                  return (
                    <div key={k} className={cn('flex items-start gap-3 px-1 py-3', selectedKeys.has(k) && 'bg-primary/5')}>
                      <div className="pt-2.5">{checkbox(selectedKeys.has(k), () => toggleKey(k), `Chọn ${getItemTitle(item)}`)}</div>
                      <span className={cn('h-10 w-10 rounded-[13px] grid place-items-center shrink-0', TINTS[m.tint].bg)}><LifeIcon name={m.icon} size={20} variant="duotone" /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate">{getItemTitle(item)}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span className="font-semibold">{getItemTypeName(item.type)}</span>
                          <span>{format(new Date(item.data.deletedAt!), 'dd/MM HH:mm', { locale: vi })}</span>
                          {remainingPill(item)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" aria-label="Khôi phục" onClick={() => handleRestore(item)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" aria-label="Xóa vĩnh viễn" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <div className="grid grid-cols-[18px_minmax(0,1fr)_110px_128px_84px_190px] items-center gap-3 px-3 h-10 bg-secondary/50 text-[11.5px] font-semibold text-muted-foreground">
                  {checkbox(allSelected, toggleAll, 'Chọn tất cả')}
                  <span>Tiêu đề</span><span>Loại</span><span>Thời gian xóa</span><span>Còn lại</span><span className="text-right">Thao tác</span>
                </div>
                {filteredItems.map((item) => {
                  const area = getItemArea(item);
                  const m = TYPE_META[item.type];
                  const k = keyOf(item);
                  return (
                    <div key={k} className={cn('grid grid-cols-[18px_minmax(0,1fr)_110px_128px_84px_190px] items-center gap-3 px-3 py-2.5 border-t border-border/50 hover:bg-secondary/40', selectedKeys.has(k) && 'bg-primary/10')}>
                      {checkbox(selectedKeys.has(k), () => toggleKey(k), `Chọn ${getItemTitle(item)}`)}
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className={cn('h-9 w-9 rounded-xl grid place-items-center shrink-0', TINTS[m.tint].bg)}><LifeIcon name={m.icon} size={18} variant="duotone" /></span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold truncate">{getItemTitle(item)}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{area ? `${area.icon} ${area.name} · ` : ''}{getItemDescription(item)}</p>
                        </div>
                      </div>
                      <span><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TINTS[m.tint].bg)} style={{ color: TINTS[m.tint].fg }}>{getItemTypeName(item.type)}</span></span>
                      <span className="text-[12px] text-muted-foreground">{format(new Date(item.data.deletedAt!), 'dd/MM/yyyy', { locale: vi })}<br /><span className="text-[11px]">{format(new Date(item.data.deletedAt!), 'HH:mm')}</span></span>
                      <span>{remainingPill(item)}</span>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="rounded-full h-8" onClick={() => handleRestore(item)}><RotateCcw className="h-3.5 w-3.5 mr-1" />Khôi phục</Button>
                        <Button variant="ghost" size="sm" className="h-8 rounded-full text-destructive hover:text-destructive px-2.5" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Xóa</Button>
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Xóa vĩnh viễn {selectedItems.length} mục?</AlertDialogTitle>
            <AlertDialogDescription>Các mục đã chọn sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa vĩnh viễn</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
