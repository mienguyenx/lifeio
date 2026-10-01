import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, ArchiveRestore, Pencil, MoreVertical, Pin, Plus, PlusCircle, Star, Trash2, X } from 'lucide-react';
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
import { AreaChip, AreaTile, Fab, HeroBanner, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls } from '@/components/lio/form';
import { LIFE_AREAS, type LifeArea, type Note } from '@/types/lifeos';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
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

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    area: '' as LifeArea | '',
    color: '',
  });

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tên tag', variant: 'destructive' });
      return;
    }
    try {
      const tagId = await addNoteTag(newTagName.trim(), newTagColor);
      setNewNote({ ...newNote, tags: [...newNote.tags, tagId] });
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

  const tagBadges = (ids?: string[]) => ids?.map((tagId) => {
    const tag = noteTags.find((t) => t.id === tagId);
    return tag ? <span key={tagId} className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `hsl(${tag.color} / 0.15)`, color: `hsl(${tag.color})` }}>#{tag.name}</span> : null;
  });

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Thẻ" action={filterTag !== 'all' ? <button className="text-[12px] font-semibold text-primary" onClick={() => setFilterTag('all')}>Bỏ lọc</button> : undefined} />
        {tagCounts.length === 0 ? <p className="text-[12.5px] text-muted-foreground">Chưa có thẻ nào. Tạo thẻ khi viết ghi chú.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {tagCounts.map((t) => (
              <button key={t.id} onClick={() => setFilterTag(filterTag === t.id ? 'all' : t.id)} className={cn('rounded-full px-2.5 py-1 text-[12px] font-semibold border transition-all', filterTag === t.id ? 'ring-4 ring-primary/10 border-primary' : 'border-transparent')} style={{ background: `hsl(${t.color} / 0.15)`, color: `hsl(${t.color})` }}>
                #{t.name} <span className="opacity-70">{t.n}</span>
              </button>
            ))}
          </div>
        )}
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

  return (
    <Page>
      <PageHeader title="Ghi chú" subtitle="Ghi chép và ý tưởng của bạn 📝"
        actions={<>
          <SearchToggle value={searchQuery} onChange={setSearchQuery} placeholder="Tìm kiếm ghi chú..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Tạo ghi chú</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: stats.total }, { id: 'pinned', label: 'Đã ghim', count: stats.pinned }, { id: 'favorites', label: 'Yêu thích', count: stats.favorites }, { id: 'archived', label: 'Lưu trữ', count: stats.archived }]} value={viewMode} onChange={setViewMode} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Nơi cất giữ mọi ý tưởng" subtitle={stats.total ? `${stats.total} ghi chú · ${recent7} cập nhật trong 7 ngày qua.` : 'Viết ghi chú đầu tiên với Markdown, thẻ và lĩnh vực.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Ghi chú mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon="module/notes" tint="amber" value={stats.total} label="Ghi chú" hint="đang hoạt động" onClick={() => setViewMode('all')} active={viewMode === 'all'} />
            <StatTile icon={<span className="text-[22px]">📌</span>} tint="violet" value={stats.pinned} label="Đã ghim" hint="ưu tiên hiển thị" onClick={() => setViewMode('pinned')} active={viewMode === 'pinned'} />
            <StatTile icon={<span className="text-[22px]">⭐</span>} tint="orange" value={stats.favorites} label="Yêu thích" hint="đánh dấu sao" onClick={() => setViewMode('favorites')} active={viewMode === 'favorites'} />
            <StatTile icon="module/archive" tint="sky" value={stats.archived} label="Lưu trữ" hint={`${stats.trash} trong thùng rác`} onClick={() => setViewMode('archived')} active={viewMode === 'archived'} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
              <SectionTitle title="Danh sách ghi chú" hint={`${filteredNotes.length} mục`} className="mb-0" />
              <div className={cn('flex gap-2 flex-wrap', !isMobile && 'ml-auto')}>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="h-9 w-[130px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Mọi thẻ</SelectItem>{noteTags.map((tag) => <SelectItem key={tag.id} value={tag.id}>#{tag.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
                  <SelectTrigger className="h-9 w-[120px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Mọi lúc</SelectItem><SelectItem value="7days">7 ngày</SelectItem><SelectItem value="30days">30 ngày</SelectItem><SelectItem value="90days">90 ngày</SelectItem></SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="h-9 w-[140px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="updated-desc">Mới cập nhật</SelectItem><SelectItem value="updated-asc">Cũ nhất</SelectItem><SelectItem value="created-desc">Mới tạo</SelectItem><SelectItem value="title-asc">A → Z</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            {filteredNotes.length === 0 ? (
              hasFilter || viewMode !== 'all'
                ? <EmptyState mascot="ori" compact title="Không có ghi chú phù hợp" description="Thử đổi tab, bộ lọc hoặc từ khóa nhé." />
                : <EmptyState mascot="ori" pose="idea" title="Chưa có ghi chú nào" description="Nhấn “Tạo ghi chú” để bắt đầu!" action={<Button className="rounded-full" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Tạo ghi chú</Button>} />
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredNotes.map((note) => {
                  const area = LIFE_AREAS.find((a) => a.id === note.area);
                  return (
                    <div key={note.id} role="button" tabIndex={0} onClick={() => setSelectedNote(note)} onKeyDown={(e) => e.key === 'Enter' && setSelectedNote(note)}
                      className={cn('rounded-[20px] border border-border/60 bg-card p-4 cursor-pointer transition-all hover:shadow-soft hover:border-primary/30 flex flex-col min-h-[150px]', note.color, note.isPinned && 'ring-2 ring-primary/25')}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {note.isPinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                            {note.isFavorite && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                            <p className="text-[14.5px] font-bold truncate">{note.title}</p>
                          </div>
                          <p className="text-[12.5px] text-muted-foreground line-clamp-3 mt-1 leading-snug">{note.content || 'Không có nội dung'}</p>
                        </div>
                        {noteMenu(note)}
                      </div>
                      <div className="mt-auto pt-3 flex items-center gap-1.5 flex-wrap">
                        {tagBadges(note.tags)}
                        {area && <AreaChip area={area.id} label={area.name} />}
                        <span className="ml-auto text-[11px] text-muted-foreground">{format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
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
                  <Button className="w-full rounded-full" onClick={handleAddTag}>Tạo thẻ</Button>
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

      <AdaptiveModal open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)} title={selectedNote?.title || 'Ghi chú'}>
        {selectedNote && (
          <div className="space-y-4">
            {(selectedNote.isPinned || selectedNote.isFavorite) && (
              <div className="flex items-center gap-2 text-[12px] font-semibold">
                {selectedNote.isPinned && <span className="inline-flex items-center gap-1 text-primary"><Pin className="h-3.5 w-3.5" />Đã ghim</span>}
                {selectedNote.isFavorite && <span className="inline-flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />Yêu thích</span>}
              </div>
            )}
            <MarkdownPreview content={selectedNote.content} />
            <div className="flex flex-wrap gap-1.5">
              {tagBadges(selectedNote.tags)}
              {selectedNote.area && <AreaChip area={selectedNote.area} label={LIFE_AREAS.find((a) => a.id === selectedNote.area)?.name ?? ''} />}
            </div>
            <p className="text-[11.5px] text-muted-foreground">Tạo: {format(new Date(selectedNote.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })} • Cập nhật: {format(new Date(selectedNote.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
            <div className="flex justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => { handleEditNote(selectedNote); setSelectedNote(null); }}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
            </div>
          </div>
        )}
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
    </Page>
  );
}
