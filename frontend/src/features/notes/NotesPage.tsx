import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, ArchiveRestore, Check, Hash, Pencil, MoreVertical, Pin, Plus, PlusCircle, Star, Trash2, X } from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmptyState } from '@/components/brand/EmptyState';
import { AreaChip, AreaTile, Fab, HeroBanner, IconButton, MascotCard, TINTS, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls } from '@/components/lio/form';
import { LIFE_AREAS, type LifeArea, type Note } from '@/types/lifeos';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { MarkdownEditor, MarkdownPreview } from '@/components/notes/MarkdownEditor';

type FilterPeriod = 'all' | '7days' | '30days' | '90days';
type SortBy = 'updated-desc' | 'updated-asc' | 'created-desc' | 'title-asc';
type ViewMode = 'all' | 'pinned' | 'favorites' | 'archived';

const NOTE_COLORS = [
  { value: 'none', label: 'Mặc định' },
  { value: 'bg-yellow-100 dark:bg-yellow-900/30', label: '🟡 Vàng' },
  { value: 'bg-blue-100 dark:bg-blue-900/30', label: '🔵 Xanh dương' },
  { value: 'bg-green-100 dark:bg-green-900/30', label: '🟢 Xanh lá' },
  { value: 'bg-pink-100 dark:bg-pink-900/30', label: '🩷 Hồng' },
  { value: 'bg-purple-100 dark:bg-purple-900/30', label: '🟣 Tím' },
  { value: 'bg-orange-100 dark:bg-orange-900/30', label: '🟠 Cam' },
];

const TAG_COLORS = [
  { value: '0 84% 60%', label: '🔴 Đỏ' },
  { value: '25 95% 53%', label: '🟠 Cam' },
  { value: '48 96% 53%', label: '🟡 Vàng' },
  { value: '142 76% 36%', label: '🟢 Xanh lá' },
  { value: '199 89% 48%', label: '🔵 Xanh dương' },
  { value: '262 83% 58%', label: '🟣 Tím' },
  { value: '330 81% 60%', label: '🩷 Hồng' },
];

export default function NotesPage() {
  const notes = useLifeOSStore((s) => s.notes);
  const noteTags = useLifeOSStore((s) => s.noteTags);
  
  // Use synced store for CRUD operations that need to sync to Supabase
  const { 
    addNote, 
    updateNote, 
    deleteNote, 
    toggleNotePin, 
    toggleNoteFavorite, 
    archiveNote, 
    unarchiveNote,
    addNoteTag,
    deleteNoteTag,
  } = useSyncedStore();
  
  const isMobile = useIsMobile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Thêm nhanh (QuickAdd / command palette): /notes?add mở hộp tạo ghi chú
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.has('add')) { setIsDialogOpen(true); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('updated-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  // Desktop rộng (xl): xem trước ghi chú ở cột phải thay cho hộp thoại
  const [isXl, setIsXl] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const on = () => setIsXl(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    area: '' as LifeArea | '',
    color: '',
  });

  const handleAddTag = async (attachToNote = true) => {
    if (!newTagName.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên tag', variant: 'destructive' });
      return;
    }
    try {
      const tagId = await addNoteTag(newTagName.trim(), newTagColor);
      if (attachToNote) setNewNote({ ...newNote, tags: [...newNote.tags, tagId] });
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0].value);
      setIsAddingTag(false);
      toast({ title: 'Đã tạo tag!', description: `Tag "${newTagName}" đã được tạo.` });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({ title: 'Lỗi', description: 'Không thể tạo tag. Vui lòng thử lại.', variant: 'destructive' });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteNoteTag(tagId);
      setNewNote({ ...newNote, tags: newNote.tags.filter((t) => t !== tagId) });
      toast({ title: 'Đã xóa tag!' });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({ title: 'Lỗi', description: 'Không thể xóa tag. Vui lòng thử lại.', variant: 'destructive' });
    }
  };

  const filteredNotes = useMemo(() => {
    // First, exclude deleted notes (in trash)
    let result = notes.filter((n) => !n.deletedAt);

    // Filter by view mode
    switch (viewMode) {
      case 'pinned':
        result = result.filter((n) => n.isPinned && !n.archivedAt);
        break;
      case 'favorites':
        result = result.filter((n) => n.isFavorite && !n.archivedAt);
        break;
      case 'archived':
        result = result.filter((n) => n.archivedAt);
        break;
      default:
        result = result.filter((n) => !n.archivedAt);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)
      );
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const days = filterPeriod === '7days' ? 7 : filterPeriod === '30days' ? 30 : 90;
      const startDate = subDays(new Date(), days);
      result = result.filter((n) => isAfter(parseISO(n.updatedAt), startDate));
    }

    // Filter by tag
    if (filterTag !== 'all') {
      result = result.filter((n) => n.tags?.includes(filterTag));
    }

    // Filter by area
    if (filterArea !== 'all') {
      result = result.filter((n) => n.area === filterArea);
    }

    // Sort
    switch (sortBy) {
      case 'updated-desc':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'updated-asc':
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case 'created-desc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    // Pinned notes first (except in archived view)
    if (viewMode !== 'archived') {
      result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }

    return result;
  }, [notes, searchQuery, filterPeriod, filterTag, filterArea, sortBy, viewMode]);

  const handleSaveNote = async () => {
    if (!newNote.title.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tiêu đề note', variant: 'destructive' });
      return;
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags,
          area: newNote.area || undefined,
          color: newNote.color || undefined,
        });
        toast({ title: 'Đã cập nhật!', description: 'Note đã được cập nhật.' });
      } else {
        await addNote({
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags,
          area: newNote.area || undefined,
          color: newNote.color || undefined,
        });
        toast({ title: 'Đã tạo!', description: 'Note mới đã được tạo.' });
      }

      setNewNote({ title: '', content: '', tags: [], area: '', color: '' });
      setEditingNote(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Lỗi', description: 'Không thể lưu note. Vui lòng thử lại.', variant: 'destructive' });
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      area: note.area || '',
      color: note.color || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (selectedNote?.id === id) setSelectedNote(null);
    toast({ title: 'Đã chuyển vào thùng rác!', description: 'Bạn có thể khôi phục trong Thùng rác.' });
  };

  const handleArchiveNote = (id: string) => {
    archiveNote(id);
    toast({ title: 'Đã lưu trữ!', description: 'Note đã được chuyển vào archive.' });
  };

  const handleUnarchiveNote = (id: string) => {
    unarchiveNote(id);
    toast({ title: 'Đã khôi phục!', description: 'Note đã được khôi phục.' });
  };

  const stats = useMemo(() => ({
    total: notes.filter((n) => !n.archivedAt && !n.deletedAt).length,
    pinned: notes.filter((n) => n.isPinned && !n.archivedAt && !n.deletedAt).length,
    favorites: notes.filter((n) => n.isFavorite && !n.archivedAt && !n.deletedAt).length,
    archived: notes.filter((n) => n.archivedAt && !n.deletedAt).length,
    trash: notes.filter((n) => n.deletedAt).length,
  }), [notes]);

  const resetForm = () => { setEditingNote(null); setNewNote({ title: '', content: '', tags: [], area: '', color: '' }); };
  const openCreate = () => { resetForm(); setIsDialogOpen(true); };
  const tagCounts = useMemo(() => noteTags.map((t) => ({ ...t, n: notes.filter((n) => !n.deletedAt && !n.archivedAt && n.tags?.includes(t.id)).length })), [noteTags, notes]);
  const areaCounts = useMemo(() => LIFE_AREAS.map((a) => ({ ...a, n: notes.filter((n) => !n.deletedAt && !n.archivedAt && n.area === a.id).length })).filter((a) => a.n > 0), [notes]);
  const recent7 = notes.filter((n) => !n.deletedAt && isAfter(parseISO(n.updatedAt), subDays(new Date(), 7))).length;
  const hasFilter = filterTag !== 'all' || filterArea !== 'all' || filterPeriod !== 'all' || !!searchQuery;

  const noteMenu = (note: Note) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" aria-label="Tùy chọn"><MoreVertical className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}><Pencil className="h-4 w-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleNotePin(note.id); }}><Pin className="h-4 w-4 mr-2" />{note.isPinned ? 'Bỏ ghim' : 'Ghim'}</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleNoteFavorite(note.id); }}><Star className="h-4 w-4 mr-2" />{note.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}</DropdownMenuItem>
        <DropdownMenuSeparator />
        {note.archivedAt
          ? <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUnarchiveNote(note.id); }}><ArchiveRestore className="h-4 w-4 mr-2" />Khôi phục</DropdownMenuItem>
          : <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveNote(note.id); }}><Archive className="h-4 w-4 mr-2" />Lưu trữ</DropdownMenuItem>}
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setNoteToDelete(note); setDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const tagBadges = (ids?: string[], max?: number) => {
    const list = (ids ?? []).map((id) => noteTags.find((t) => t.id === id)).filter(Boolean) as typeof noteTags;
    const shown = max ? list.slice(0, max) : list;
    return (
      <>
        {shown.map((tag) => <span key={tag.id} className="rounded-full px-2 py-0.5 text-[11px] font-semibold truncate max-w-[120px]" style={{ background: `hsl(${tag.color} / 0.15)`, color: `hsl(${tag.color})` }}>#{tag.name}</span>)}
        {max && list.length > max && <span className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold bg-secondary text-muted-foreground">+{list.length - max}</span>}
      </>
    );
  };

  // Chọn nhiều + thao tác hàng loạt (ghép từ các hành động đơn lẻ có sẵn)
  const allSelected = filteredNotes.length > 0 && filteredNotes.every((n) => selectedIds.has(n.id));
  const toggleSelect = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(filteredNotes.map((n) => n.id)));
  const selectedNotes = filteredNotes.filter((n) => selectedIds.has(n.id));
  const bulkPin = () => { selectedNotes.filter((n) => !n.isPinned).forEach((n) => toggleNotePin(n.id)); toast({ title: `Đã ghim ${selectedNotes.length} ghi chú` }); setSelectedIds(new Set()); };
  const bulkArchive = () => {
    if (viewMode === 'archived') selectedNotes.forEach((n) => unarchiveNote(n.id)); else selectedNotes.forEach((n) => archiveNote(n.id));
    toast({ title: viewMode === 'archived' ? `Đã khôi phục ${selectedNotes.length} ghi chú` : `Đã lưu trữ ${selectedNotes.length} ghi chú` });
    setSelectedIds(new Set());
  };
  const bulkDelete = () => { selectedNotes.forEach((n) => deleteNote(n.id)); if (selectedNote && selectedIds.has(selectedNote.id)) setSelectedNote(null); toast({ title: `Đã chuyển ${selectedNotes.length} ghi chú vào thùng rác` }); setSelectedIds(new Set()); setBulkDeleteOpen(false); };

  const openNote = (note: Note) => setSelectedNote(note);
  const liveSelected = selectedNote ? notes.find((n) => n.id === selectedNote.id && !n.deletedAt) ?? null : null;
  const fmt = (d: string) => format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: vi });

  const notePreview = (note: Note, inPanel: boolean) => (
    <div className="space-y-4">
      {inPanel && (
        <div className="flex items-start gap-2">
          <p className="flex-1 min-w-0 text-[16px] font-bold leading-snug">{note.title}</p>
          <IconButton label="Đóng xem trước" onClick={() => setSelectedNote(null)}><X className="h-4 w-4" /></IconButton>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {note.isPinned && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary"><Pin className="h-3 w-3" />Đã ghim</span>}
        {note.isFavorite && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[#FFF4DB] text-[#B7791F]"><Star className="h-3 w-3 fill-current" />Yêu thích</span>}
        {note.archivedAt && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[#E6F1FF] text-[#2F7BF6]"><Archive className="h-3 w-3" />Lưu trữ</span>}
        {tagBadges(note.tags)}
        {note.area && <AreaChip area={note.area} label={LIFE_AREAS.find((a) => a.id === note.area)?.name ?? ''} />}
      </div>
      <div className={cn('rounded-2xl bg-secondary/40 p-3', inPanel && 'max-h-[320px] overflow-y-auto')}>
        {note.content ? <MarkdownPreview content={note.content} /> : <p className="text-[12.5px] text-muted-foreground">Không có nội dung</p>}
      </div>
      <p className="text-[11.5px] text-muted-foreground">Tạo: {fmt(note.createdAt)} • Cập nhật: {fmt(note.updatedAt)}</p>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => toggleNotePin(note.id)}><Pin className="h-3.5 w-3.5 mr-1" />{note.isPinned ? 'Bỏ ghim' : 'Ghim'}</Button>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => toggleNoteFavorite(note.id)}><Star className="h-3.5 w-3.5 mr-1" />{note.isFavorite ? 'Bỏ sao' : 'Yêu thích'}</Button>
        {note.archivedAt
          ? <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleUnarchiveNote(note.id)}><ArchiveRestore className="h-3.5 w-3.5 mr-1" />Khôi phục</Button>
          : <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleArchiveNote(note.id)}><Archive className="h-3.5 w-3.5 mr-1" />Lưu trữ</Button>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button className="rounded-full" onClick={() => { handleEditNote(note); setSelectedNote(null); }}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
        <Button variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => { setNoteToDelete(note); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 mr-1.5" />Xóa</Button>
      </div>
    </div>
  );

  const statusRows = [
    { id: 'pinned' as const, label: 'Đã ghim', n: stats.pinned, icon: <Pin className="h-4 w-4" />, tint: 'violet' as const },
    { id: 'favorites' as const, label: 'Yêu thích', n: stats.favorites, icon: <Star className="h-4 w-4" />, tint: 'amber' as const },
    { id: 'archived' as const, label: 'Lưu trữ', n: stats.archived, icon: <Archive className="h-4 w-4" />, tint: 'sky' as const },
  ];

  const side = (
    <div className="space-y-4">
      {isXl && liveSelected && <Surface className="p-4">{notePreview(liveSelected, true)}</Surface>}
      <Surface className="p-4">
        <SectionTitle title="Quản lý thẻ" hint={`${noteTags.length} thẻ`} action={filterTag !== 'all' ? <button className="text-[12px] font-semibold text-primary" onClick={() => setFilterTag('all')}>Bỏ lọc</button> : undefined} />
        {tagCounts.length === 0 ? <p className="text-[12.5px] text-muted-foreground mb-3">Chưa có thẻ nào.</p> : (
          <div className="space-y-0.5 -mx-2 mb-3">
            {tagCounts.map((t) => (
              <div key={t.id} className={cn('group flex items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-secondary/60', filterTag === t.id && 'bg-secondary')}>
                <button className="flex-1 min-w-0 flex items-center gap-2 text-left" onClick={() => setFilterTag(filterTag === t.id ? 'all' : t.id)}>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: `hsl(${t.color})` }} />
                  <span className="flex-1 truncate text-[13px] font-semibold">#{t.name}</span>
                  <span className="text-[12px] text-muted-foreground font-semibold">{t.n}</span>
                </button>
                <button aria-label={`Xóa thẻ ${t.name}`} onClick={() => setTagToDelete(t.id)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void handleAddTag(false); }}>
          <div className="flex gap-2">
            <input className={cn(fieldCls, 'h-9 text-[13px]')} placeholder="Tên thẻ mới..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
            <Button type="submit" size="sm" className="h-9 rounded-full px-3" disabled={!newTagName.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-1.5">
            {TAG_COLORS.map((c) => <button key={c.value} type="button" title={c.label} aria-label={c.label} onClick={() => setNewTagColor(c.value)} className={cn('h-5 w-5 rounded-full border-2 transition-all', newTagColor === c.value ? 'border-foreground scale-110' : 'border-transparent')} style={{ backgroundColor: `hsl(${c.value})` }} />)}
          </div>
        </form>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Trạng thái ghi chú" />
        <div className="space-y-1 -mx-2">
          {statusRows.map((r) => (
            <button key={r.id} onClick={() => setViewMode(r.id)} className={cn('w-full flex items-center gap-3 rounded-2xl px-2 py-1.5 text-left hover:bg-secondary/60', viewMode === r.id && 'bg-secondary')}>
              <span className={cn('h-8 w-8 rounded-xl grid place-items-center', TINTS[r.tint].bg)} style={{ color: TINTS[r.tint].fg }}>{r.icon}</span>
              <span className="flex-1 text-[13px] font-semibold">{r.label}</span><span className="text-[12px] text-muted-foreground font-semibold">{r.n}</span>
            </button>
          ))}
          <Link to="/trash" className="w-full flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-secondary/60">
            <span className={cn('h-8 w-8 rounded-xl grid place-items-center', TINTS.rose.bg)} style={{ color: TINTS.rose.fg }}><Trash2 className="h-4 w-4" /></span>
            <span className="flex-1 text-[13px] font-semibold">Thùng rác</span><span className="text-[12px] text-muted-foreground font-semibold">{stats.trash}</span>
          </Link>
        </div>
      </Surface>
      {areaCounts.length > 0 && (
        <Surface className="p-4">
          <SectionTitle title="Theo lĩnh vực" action={filterArea !== 'all' ? <button className="text-[12px] font-semibold text-primary" onClick={() => setFilterArea('all')}>Bỏ lọc</button> : undefined} />
          <div className="space-y-1 -mx-2">
            {areaCounts.map((a) => (
              <button key={a.id} onClick={() => setFilterArea(filterArea === a.id ? 'all' : a.id)} className={cn('w-full flex items-center gap-3 rounded-2xl px-2 py-1.5 text-left hover:bg-secondary/60', filterArea === a.id && 'bg-secondary')}>
                <AreaTile area={a.id} size={32} /><span className="flex-1 text-[13px] font-semibold">{a.name}</span><span className="text-[12px] text-muted-foreground font-semibold">{a.n}</span>
              </button>
            ))}
          </div>
        </Surface>
      )}
      <MascotCard mascot="ori" pose="idea" title="Ý tưởng nhỏ" quote="Ghi lại ngay khi ý tưởng xuất hiện — trí nhớ là thứ dễ quên nhất." />
    </div>
  );

  const PERIODS: { id: FilterPeriod; label: string }[] = [{ id: '7days', label: '7 ngày' }, { id: '30days', label: '30 ngày' }, { id: '90days', label: '90 ngày' }, { id: 'all', label: 'Tất cả' }];
  const checkbox = (on: boolean, onToggle: () => void, label: string) => (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn('h-[18px] w-[18px] rounded-md border-2 grid place-items-center shrink-0 transition-colors', on ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/60')}>
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );

  return (
    <Page>
      <PageHeader title="Ghi chú" subtitle="Ghi chép và ý tưởng của bạn 📝"
        actions={<>
          <SearchToggle value={searchQuery} onChange={setSearchQuery} placeholder="Tìm kiếm ghi chú..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Tạo ghi chú</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: stats.total }, { id: 'pinned', label: 'Đã ghim', count: stats.pinned }, { id: 'favorites', label: 'Yêu thích', count: stats.favorites }, { id: 'archived', label: 'Lưu trữ', count: stats.archived }]} value={viewMode} onChange={(v) => { setViewMode(v); setSelectedIds(new Set()); }} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Nơi cất giữ mọi ý tưởng" subtitle={stats.total ? `${stats.total} ghi chú · ${recent7} cập nhật trong 7 ngày qua.` : 'Viết ghi chú đầu tiên với Markdown, thẻ và lĩnh vực.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Ghi chú mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatTile icon="module/notes" tint="amber" value={stats.total} label="Ghi chú" hint="hoạt động" onClick={() => setViewMode('all')} active={viewMode === 'all'} />
            <StatTile icon={<Pin className="h-5 w-5" />} tint="violet" value={stats.pinned} label="Đã ghim" hint="ưu tiên" onClick={() => setViewMode('pinned')} active={viewMode === 'pinned'} />
            <StatTile icon={<Star className="h-5 w-5" />} tint="orange" value={stats.favorites} label="Yêu thích" hint="gắn sao" onClick={() => setViewMode('favorites')} active={viewMode === 'favorites'} />
            <StatTile icon={<Hash className="h-5 w-5" />} tint="mint" value={noteTags.length} label="Thẻ" hint={`${tagCounts.filter((t) => t.n > 0).length} đang dùng`} />
            <StatTile icon="module/archive" tint="sky" value={stats.archived} label="Lưu trữ" hint={`${stats.trash} đã xóa`} onClick={() => setViewMode('archived')} active={viewMode === 'archived'} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center flex-wrap')}>
              <SectionTitle title="Thư viện ghi chú" hint={`${filteredNotes.length} mục`} className="mb-0" />
              <div className={cn('flex gap-2 flex-wrap', !isMobile && 'ml-auto')}>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="h-9 w-[124px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Mọi thẻ</SelectItem>{noteTags.map((tag) => <SelectItem key={tag.id} value={tag.id}>#{tag.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterArea} onValueChange={(v) => setFilterArea(v as LifeArea | 'all')}>
                  <SelectTrigger className="h-9 w-[140px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Mọi lĩnh vực</SelectItem>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="h-9 w-[136px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="updated-desc">Mới cập nhật</SelectItem><SelectItem value="updated-asc">Cũ nhất</SelectItem><SelectItem value="created-desc">Mới tạo</SelectItem><SelectItem value="title-asc">A → Z</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-1 mb-3 overflow-x-auto no-scrollbar">
              <span className="text-[12px] font-semibold text-muted-foreground mr-1 shrink-0">Thời gian:</span>
              {PERIODS.map((p) => (
                <button key={p.id} onClick={() => setFilterPeriod(p.id)} className={cn('h-8 px-3 rounded-full text-[12px] font-semibold border shrink-0 transition-colors', filterPeriod === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/70 text-foreground/75 hover:bg-secondary')}>{p.label}</button>
              ))}
              {hasFilter && <button className="ml-auto text-[12px] font-semibold text-primary shrink-0" onClick={() => { setFilterTag('all'); setFilterArea('all'); setFilterPeriod('all'); setSearchQuery(''); }}>Xóa bộ lọc</button>}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap rounded-2xl bg-primary/10 px-3 py-2 mb-3">
                <span className="text-[13px] font-semibold text-primary mr-auto">Đã chọn {selectedIds.size}</span>
                {viewMode !== 'archived' && <Button size="sm" variant="outline" className="h-8 rounded-full bg-card" onClick={bulkPin}><Pin className="h-3.5 w-3.5 mr-1" />Ghim</Button>}
                <Button size="sm" variant="outline" className="h-8 rounded-full bg-card" onClick={bulkArchive}>{viewMode === 'archived' ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1" />Khôi phục</> : <><Archive className="h-3.5 w-3.5 mr-1" />Lưu trữ</>}</Button>
                <Button size="sm" variant="outline" className="h-8 rounded-full bg-card text-destructive hover:text-destructive" onClick={() => setBulkDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" />Xóa</Button>
                <IconButton label="Bỏ chọn" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></IconButton>
              </div>
            )}

            {filteredNotes.length === 0 ? (
              hasFilter || viewMode !== 'all'
                ? <EmptyState mascot="ori" compact title="Không có ghi chú phù hợp" description="Thử đổi tab, bộ lọc hoặc từ khóa nhé." />
                : <EmptyState mascot="ori" pose="idea" title="Chưa có ghi chú nào" description="Nhấn “Tạo ghi chú” để bắt đầu!" action={<Button className="rounded-full" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Tạo ghi chú</Button>} />
            ) : isMobile ? (
              <div className="grid gap-3 grid-cols-1">
                {filteredNotes.map((note) => {
                  const area = LIFE_AREAS.find((a) => a.id === note.area);
                  return (
                    <div key={note.id} role="button" tabIndex={0} onClick={() => openNote(note)} onKeyDown={(e) => e.key === 'Enter' && openNote(note)}
                      className={cn('rounded-[20px] border border-border/60 bg-card p-4 cursor-pointer transition-all hover:shadow-soft flex flex-col', note.color, selectedIds.has(note.id) && 'ring-2 ring-primary/40')}>
                      <div className="flex items-start gap-2.5">
                        <div className="pt-0.5">{checkbox(selectedIds.has(note.id), () => toggleSelect(note.id), `Chọn ${note.title}`)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {note.isPinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                            {note.isFavorite && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                            <p className="text-[14.5px] font-bold truncate">{note.title}</p>
                          </div>
                          <p className="text-[12.5px] text-muted-foreground line-clamp-2 mt-1 leading-snug">{note.content || 'Không có nội dung'}</p>
                        </div>
                        {noteMenu(note)}
                      </div>
                      <div className="pt-3 flex items-center gap-1.5 flex-wrap pl-7">
                        {tagBadges(note.tags, 2)}
                        {area && <AreaChip area={area.id} label={area.name} />}
                        <span className="ml-auto text-[11px] text-muted-foreground">{format(new Date(note.updatedAt), 'dd/MM HH:mm', { locale: vi })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <div className="grid grid-cols-[18px_minmax(0,1fr)_150px_112px_56px_32px] items-center gap-3 px-3 h-10 bg-secondary/50 text-[11.5px] font-semibold text-muted-foreground">
                  {checkbox(allSelected, toggleSelectAll, 'Chọn tất cả')}
                  <span>Tiêu đề</span><span>Thẻ · Lĩnh vực</span><span>Cập nhật</span><span className="text-center">Đánh dấu</span><span />
                </div>
                {filteredNotes.map((note) => {
                  const area = LIFE_AREAS.find((a) => a.id === note.area);
                  const active = liveSelected?.id === note.id;
                  return (
                    <div key={note.id} role="button" tabIndex={0} onClick={() => openNote(note)} onKeyDown={(e) => e.key === 'Enter' && openNote(note)}
                      className={cn('grid grid-cols-[18px_minmax(0,1fr)_150px_112px_56px_32px] items-center gap-3 px-3 py-2.5 border-t border-border/50 cursor-pointer transition-colors hover:bg-secondary/40', active && 'bg-primary/5', selectedIds.has(note.id) && 'bg-primary/10')}>
                      {checkbox(selectedIds.has(note.id), () => toggleSelect(note.id), `Chọn ${note.title}`)}
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className={cn('h-9 w-9 rounded-xl grid place-items-center shrink-0 border border-border/50', note.color || TINTS.amber.bg)}><LifeIcon name="module/notes" size={18} /></span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold truncate">{note.title}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{note.content?.replace(/[#*_>`-]/g, '').slice(0, 120) || 'Không có nội dung'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {tagBadges(note.tags, 1)}
                        {area && <span title={area.name} className="text-[13px] shrink-0">{area.icon}</span>}
                        {!note.tags?.length && !area && <span className="text-[12px] text-muted-foreground">—</span>}
                      </div>
                      <span className="text-[12px] text-muted-foreground">{format(new Date(note.updatedAt), 'dd/MM/yyyy', { locale: vi })}<br /><span className="text-[11px]">{format(new Date(note.updatedAt), 'HH:mm')}</span></span>
                      <div className="flex items-center justify-center gap-0.5">
                        <button aria-label={note.isPinned ? 'Bỏ ghim' : 'Ghim'} onClick={(e) => { e.stopPropagation(); toggleNotePin(note.id); }} className={cn('h-7 w-7 grid place-items-center rounded-full hover:bg-secondary', note.isPinned ? 'text-primary' : 'text-muted-foreground/40')}><Pin className={cn('h-3.5 w-3.5', note.isPinned && 'fill-current')} /></button>
                        <button aria-label={note.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'} onClick={(e) => { e.stopPropagation(); toggleNoteFavorite(note.id); }} className={cn('h-7 w-7 grid place-items-center rounded-full hover:bg-secondary', note.isFavorite ? 'text-amber-500' : 'text-muted-foreground/40')}><Star className={cn('h-3.5 w-3.5', note.isFavorite && 'fill-current')} /></button>
                      </div>
                      {noteMenu(note)}
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
      {isMobile && <Fab onClick={openCreate} label="Tạo ghi chú" />}

      <AdaptiveModal open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }} title={editingNote ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới'}>
        <div className="space-y-3.5 mt-2">
          <Field label="Tiêu đề *"><input className={fieldCls} placeholder="Nhập tiêu đề..." value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} autoFocus /></Field>
          <Field label="Nội dung"><MarkdownEditor value={newNote.content} onChange={(content) => setNewNote({ ...newNote, content })} placeholder="Nhập nội dung markdown..." minRows={8} /></Field>
          <Field label="Thẻ" hint={
            <Popover open={isAddingTag} onOpenChange={setIsAddingTag}>
              <PopoverTrigger asChild><button type="button" className="text-[12px] font-semibold text-primary inline-flex items-center gap-1"><PlusCircle className="h-3.5 w-3.5" />Tạo thẻ</button></PopoverTrigger>
              <PopoverContent className="w-80 min-w-[300px] p-4 rounded-2xl" side="top" align="end" collisionPadding={20} sideOffset={8}>
                <div className="space-y-3">
                  <Field label="Tên thẻ"><input className={fieldCls} placeholder="Nhập tên thẻ..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} autoFocus /></Field>
                  <Field label="Màu sắc">
                    <div className="flex flex-wrap gap-2">
                      {TAG_COLORS.map((color) => <button key={color.value} type="button" title={color.label} onClick={() => setNewTagColor(color.value)} className={cn('h-7 w-7 rounded-full border-2 transition-all hover:scale-110', newTagColor === color.value ? 'border-foreground scale-110' : 'border-transparent')} style={{ backgroundColor: `hsl(${color.value})` }} />)}
                    </div>
                  </Field>
                  <Button className="w-full rounded-full" onClick={() => handleAddTag()}>Tạo thẻ</Button>
                </div>
              </PopoverContent>
            </Popover>
          }>
            <div className="flex flex-wrap gap-1.5">
              {noteTags.map((tag) => {
                const on = newNote.tags.includes(tag.id);
                return (
                  <span key={tag.id} className="group relative">
                    <button type="button" onClick={() => setNewNote({ ...newNote, tags: on ? newNote.tags.filter((t) => t !== tag.id) : [...newNote.tags, tag.id] })}
                      className={cn('rounded-full pl-2.5 pr-6 py-1 text-[12px] font-semibold border transition-all', on ? 'text-white border-transparent' : 'border-border text-muted-foreground')} style={on ? { backgroundColor: `hsl(${tag.color})` } : undefined}>#{tag.name}</button>
                    <button type="button" aria-label={`Xóa thẻ ${tag.name}`} onClick={() => handleDeleteTag(tag.id)} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"><X className="h-3 w-3" /></button>
                  </span>
                );
              })}
              {noteTags.length === 0 && <p className="text-[12px] text-muted-foreground">Chưa có thẻ nào. Nhấn “Tạo thẻ” để thêm.</p>}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lĩnh vực">
              <Select value={newNote.area || 'none'} onValueChange={(v) => setNewNote({ ...newNote, area: v === 'none' ? '' : v as LifeArea })}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Chọn lĩnh vực" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Không có</SelectItem>{LIFE_AREAS.map((area) => <SelectItem key={area.id} value={area.id}>{area.icon} {area.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Màu sắc">
              <Select value={newNote.color || 'none'} onValueChange={(v) => setNewNote({ ...newNote, color: v === 'none' ? '' : v })}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Chọn màu" /></SelectTrigger>
                <SelectContent>{NOTE_COLORS.map((color) => <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Hủy</Button>
            <Button type="button" className="h-11 rounded-full shadow-soft" onClick={handleSaveNote}>{editingNote ? 'Cập nhật' : 'Tạo ghi chú'}</Button>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal open={!!liveSelected && !isXl} onOpenChange={(open) => !open && setSelectedNote(null)} title={liveSelected?.title || 'Ghi chú'}>
        {liveSelected && notePreview(liveSelected, false)}
      </AdaptiveModal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ghi chú này?</AlertDialogTitle>
            <AlertDialogDescription>Ghi chú “{noteToDelete?.title}” sẽ được chuyển vào Thùng rác. Bạn có thể khôi phục sau.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (noteToDelete) { handleDeleteNote(noteToDelete.id); setNoteToDelete(null); setDeleteDialogOpen(false); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedIds.size} ghi chú đã chọn?</AlertDialogTitle>
            <AlertDialogDescription>Các ghi chú sẽ được chuyển vào Thùng rác. Bạn có thể khôi phục sau.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!tagToDelete} onOpenChange={(o) => !o && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thẻ “{noteTags.find((t) => t.id === tagToDelete)?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Thẻ sẽ bị gỡ khỏi mọi ghi chú. Nội dung ghi chú không bị ảnh hưởng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (tagToDelete) { if (filterTag === tagToDelete) setFilterTag('all'); void handleDeleteTag(tagToDelete); } setTagToDelete(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa thẻ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
