import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Pin, Star, Trash2, Archive, ArchiveRestore, Edit2, Tag, MoreVertical, Calendar, X, PlusCircle } from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    isSyncEnabled 
  } = useSyncedStore();
  
  const isMobile = useIsMobile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const NoteCard = ({ note }: { note: Note }) => (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        note.color,
        note.isPinned && "ring-2 ring-primary/30"
      )}
      onClick={() => {
        setSelectedNote(note);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {note.isPinned && <Pin className="w-3 h-3 text-primary" />}
              {note.isFavorite && <Star className="w-3 h-3 text-warning fill-warning" />}
              <h3 className="font-medium truncate">{note.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{note.content || 'Không có nội dung'}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}>
                <Edit2 className="w-4 h-4 mr-2" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleNotePin(note.id); }}>
                <Pin className="w-4 h-4 mr-2" /> {note.isPinned ? 'Bỏ ghim' : 'Ghim'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleNoteFavorite(note.id); }}>
                <Star className="w-4 h-4 mr-2" /> {note.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {note.archivedAt ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUnarchiveNote(note.id); }}>
                  <ArchiveRestore className="w-4 h-4 mr-2" /> Khôi phục
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveNote(note.id); }}>
                  <Archive className="w-4 h-4 mr-2" /> Lưu trữ
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setNoteToDelete(note);
                  setDeleteDialogOpen(true);
                }} 
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {note.tags?.map((tagId) => {
            const tag = noteTags.find((t) => t.id === tagId);
            return tag ? (
              <Badge key={tagId} variant="secondary" className="text-xs" style={{ backgroundColor: `hsl(${tag.color} / 0.2)` }}>
                {tag.name}
              </Badge>
            ) : null;
          })}
          {note.area && (
            <Badge variant="outline" className="text-xs">
              {LIFE_AREAS.find((a) => a.id === note.area)?.icon}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("p-4 md:p-6 space-y-6", !isMobile && "max-w-6xl mx-auto")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Ghi chép và ý tưởng</p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Tạo note</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">Tạo Note mới</p>
              <p className="text-xs text-muted-foreground">Ghi chép ý tưởng với Markdown và tags</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AdaptiveModal open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingNote(null); setNewNote({ title: '', content: '', tags: [], area: '', color: '' }); } }} title={editingNote ? 'Chỉnh sửa Note' : 'Tạo Note mới'}>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Tiêu đề *</Label>
                <Input
                  placeholder="Nhập tiêu đề..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nội dung</Label>
                <MarkdownEditor
                  value={newNote.content}
                  onChange={(content) => setNewNote({ ...newNote, content })}
                  placeholder="Nhập nội dung markdown..."
                  minRows={8}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tags</Label>
                  <Popover open={isAddingTag} onOpenChange={setIsAddingTag}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <PlusCircle className="w-3 h-3 mr-1" /> Tạo tag
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 min-w-[320px] p-4" 
                      side="top" 
                      align="start"
                      avoidCollisions={true}
                      collisionPadding={20}
                      sideOffset={8}
                    >
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Tên tag</Label>
                          <Input
                            placeholder="Nhập tên tag..."
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="h-9 mt-1.5"
                            autoFocus
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Màu sắc</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {TAG_COLORS.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                className={cn(
                                  "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                                  newTagColor === color.value ? "border-foreground scale-110 ring-2 ring-offset-2" : "border-transparent"
                                )}
                                style={{ backgroundColor: `hsl(${color.value})` }}
                                onClick={() => setNewTagColor(color.value)}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>
                        <Button size="sm" className="w-full mt-2" onClick={handleAddTag}>
                          Tạo tag
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-2">
                  {noteTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={newNote.tags.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer group relative pr-6"
                      style={newNote.tags.includes(tag.id) ? { backgroundColor: `hsl(${tag.color})` } : {}}
                      onClick={() => {
                        setNewNote({
                          ...newNote,
                          tags: newNote.tags.includes(tag.id)
                            ? newNote.tags.filter((t) => t !== tag.id)
                            : [...newNote.tags, tag.id],
                        });
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTag(tag.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {noteTags.length === 0 && (
                    <p className="text-xs text-muted-foreground">Chưa có tag nào. Nhấn "Tạo tag" để thêm.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lĩnh vực</Label>
                  <Select value={newNote.area || 'none'} onValueChange={(v) => setNewNote({ ...newNote, area: v === 'none' ? '' : v as LifeArea })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn lĩnh vực" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {LIFE_AREAS.map((area) => (
                        <SelectItem key={area.id} value={area.id}>{area.icon} {area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Màu sắc</Label>
                  <Select value={newNote.color || 'none'} onValueChange={(v) => setNewNote({ ...newNote, color: v === 'none' ? '' : v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn màu" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleSaveNote}>
                {editingNote ? 'Cập nhật' : 'Tạo note'}
              </Button>
            </div>
        </AdaptiveModal>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className={cn("cursor-pointer transition-colors", viewMode === 'all' && "ring-2 ring-primary")} onClick={() => setViewMode('all')}>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Tất cả</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-colors", viewMode === 'pinned' && "ring-2 ring-primary")} onClick={() => setViewMode('pinned')}>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-primary">{stats.pinned}</p>
            <p className="text-xs text-muted-foreground">📌 Ghim</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-colors", viewMode === 'favorites' && "ring-2 ring-primary")} onClick={() => setViewMode('favorites')}>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-warning">{stats.favorites}</p>
            <p className="text-xs text-muted-foreground">⭐ Yêu thích</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-colors", viewMode === 'archived' && "ring-2 ring-primary")} onClick={() => setViewMode('archived')}>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-muted-foreground">{stats.archived}</p>
            <p className="text-xs text-muted-foreground">📦 Lưu trữ</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={cn("flex gap-3 flex-wrap", isMobile && "flex-col")}>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[130px]">
                <Tag className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tags</SelectItem>
                {noteTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="7days">7 ngày</SelectItem>
                <SelectItem value="30days">30 ngày</SelectItem>
                <SelectItem value="90days">90 ngày</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated-desc">Mới cập nhật</SelectItem>
                <SelectItem value="updated-asc">Cũ nhất</SelectItem>
                <SelectItem value="created-desc">Mới tạo</SelectItem>
                <SelectItem value="title-asc">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <p className="text-4xl mb-4">📝</p>
            <p className="font-medium">Chưa có note nào</p>
            <p className="text-sm mt-1">Nhấn "Tạo note" để bắt đầu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3")}>
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Note Detail Dialog */}
      <AdaptiveModal open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)} title={selectedNote?.title || 'Note'}>
          {selectedNote && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedNote.isPinned && <Pin className="w-4 h-4 text-primary" />}
                {selectedNote.isFavorite && <Star className="w-4 h-4 text-warning fill-warning" />}
              </div>
              <MarkdownPreview content={selectedNote.content} />
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tagId) => {
                    const tag = noteTags.find((t) => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="secondary" style={{ backgroundColor: `hsl(${tag.color} / 0.2)` }}>
                        {tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              {selectedNote.area && (
                <Badge variant="outline">
                  {LIFE_AREAS.find((a) => a.id === selectedNote.area)?.icon} {LIFE_AREAS.find((a) => a.id === selectedNote.area)?.name}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Tạo: {format(new Date(selectedNote.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })} • Cập nhật: {format(new Date(selectedNote.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => { handleEditNote(selectedNote); setSelectedNote(null); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Chỉnh sửa
                </Button>
              </div>
            </div>
          )}
      </AdaptiveModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa note này?</AlertDialogTitle>
            <AlertDialogDescription>
              Note "{noteToDelete?.title}" sẽ được chuyển vào Thùng rác. Bạn có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (noteToDelete) {
                  handleDeleteNote(noteToDelete.id);
                  setNoteToDelete(null);
                  setDeleteDialogOpen(false);
                }
              }} 
              className="bg-destructive text-destructive-foreground"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
