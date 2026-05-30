import { useState, useMemo } from 'react';
import { Brain, Plus, Trash2, Edit2, Search, User, Tag, AlertTriangle, RefreshCw, Loader2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/admin/AdminAnimations';
import { useAIMemories, useCreateAIMemory, useUpdateAIMemory, useDeleteAIMemory, useAllProfiles, type AIMemory } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

const MEMORY_TYPES = [
  { value: 'fact', label: 'Sự kiện', color: 'bg-blue-500/10 text-blue-600', desc: 'Thông tin về người dùng' },
  { value: 'preference', label: 'Sở thích', color: 'bg-purple-500/10 text-purple-600', desc: 'Thói quen và sở thích' },
  { value: 'goal', label: 'Mục tiêu', color: 'bg-green-500/10 text-green-600', desc: 'Mục tiêu dài hạn' },
  { value: 'insight', label: 'Nhận xét', color: 'bg-amber-500/10 text-amber-600', desc: 'Phân tích từ AI' },
  { value: 'manual', label: 'Thủ công', color: 'bg-gray-500/10 text-gray-600', desc: 'Admin nhập tay' },
];

const IMPORTANCE_LEVELS = [
  { value: 'low', label: 'Thấp', variant: 'outline' as const },
  { value: 'medium', label: 'Trung bình', variant: 'secondary' as const },
  { value: 'high', label: 'Cao', variant: 'default' as const },
];

const EMPTY_FORM = {
  user_id: '',
  type: 'fact',
  content: '',
  importance: 'medium',
  source: 'manual',
  tags: [] as string[],
};

export default function AdminAIMemory() {
  const { data: memories, isLoading, error, refetch } = useAIMemories();
  const { data: profiles } = useAllProfiles();
  const createMemory = useCreateAIMemory();
  const updateMemory = useUpdateAIMemory();
  const deleteMemory = useDeleteAIMemory();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AIMemory | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [tagInput, setTagInput] = useState('');

  const filtered = useMemo(() => {
    if (!memories) return [];
    return memories.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (userFilter !== 'all' && m.user_id !== userFilter) return false;
      if (search && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [memories, typeFilter, userFilter, search]);

  const stats = useMemo(() => {
    if (!memories) return {};
    return MEMORY_TYPES.reduce((acc, t) => {
      acc[t.value] = memories.filter(m => m.type === t.value).length;
      return acc;
    }, {} as Record<string, number>);
  }, [memories]);

  const handleOpen = (memory?: AIMemory) => {
    if (memory) {
      setEditingMemory(memory);
      setForm({
        user_id: memory.user_id || '',
        type: memory.type,
        content: memory.content,
        importance: memory.importance,
        source: memory.source,
        tags: memory.tags || [],
      });
    } else {
      setEditingMemory(null);
      setForm({ ...EMPTY_FORM });
    }
    setTagInput('');
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!form.content.trim()) { toast.error('Nội dung không được trống'); return; }
    const payload = { ...form, user_id: form.user_id || null };
    if (editingMemory) {
      updateMemory.mutate({ id: editingMemory.id, ...payload }, { onSuccess: () => setIsFormOpen(false) });
    } else {
      createMemory.mutate(payload as any, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const getTypeConfig = (type: string) => MEMORY_TYPES.find(t => t.value === type) || MEMORY_TYPES[MEMORY_TYPES.length - 1];
  const getUserName = (userId: string | null) => {
    if (!userId) return 'Global';
    const p = profiles?.find(p => p.id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8) + '...';
  };

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <p className="font-medium">Bảng ai_memories chưa tồn tại</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cần tạo bảng <code className="bg-muted px-1 rounded">ai_memories</code> trong Supabase.
          Xem hướng dẫn SQL bên dưới.
        </p>
        <Card className="max-w-xl mx-auto text-left">
          <CardContent className="p-4">
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">{SQL_MIGRATION}</pre>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Thử lại</Button>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="AI Memory"
        description="Quản lý bộ nhớ của AI Coach cho từng người dùng"
        icon={Brain}
        actions={
          <Button onClick={() => handleOpen()}>
            <Plus className="w-4 h-4 mr-2" />Thêm Memory
          </Button>
        }
      />

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {MEMORY_TYPES.map(t => (
          <StaggerItem key={t.value}>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{isLoading ? '—' : (stats[t.value] || 0)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.label}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm nội dung..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {MEMORY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px]"><User className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả users</SelectItem>
            {profiles?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id.slice(0, 8)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Memory List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {memories?.length === 0 ? 'Chưa có memory nào. Thêm memory đầu tiên!' : 'Không tìm thấy memory phù hợp.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(memory => {
            const typeConfig = getTypeConfig(memory.type);
            const importanceConfig = IMPORTANCE_LEVELS.find(l => l.value === memory.importance);
            return (
              <Card key={memory.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${typeConfig.color} border-0`}>{typeConfig.label}</Badge>
                        {importanceConfig && (
                          <Badge variant={importanceConfig.variant} className="text-xs">{importanceConfig.label}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />{getUserName(memory.user_id)}
                        </span>
                        {memory.source === 'auto' && <Badge variant="outline" className="text-[10px]">auto</Badge>}
                      </div>
                      <p className="text-sm leading-relaxed">{memory.content}</p>
                      {memory.tags?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {memory.tags.map(tag => (
                            <span key={tag} className="text-[11px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(memory.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(memory)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa memory này?</AlertDialogTitle>
                            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMemory.mutate(memory.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMemory ? 'Chỉnh sửa Memory' : 'Thêm Memory mới'}</DialogTitle>
            <DialogDescription>Bộ nhớ này sẽ được AI Coach sử dụng khi trò chuyện với người dùng.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Loại</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEMORY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mức độ quan trọng</Label>
                <Select value={form.importance} onValueChange={v => setForm(f => ({ ...f, importance: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IMPORTANCE_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>User (để trống = global)</Label>
              <Select value={form.user_id || 'global'} onValueChange={v => setForm(f => ({ ...f, user_id: v === 'global' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Global (all users)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (tất cả users)</SelectItem>
                  <Separator className="my-1" />
                  {profiles?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung *</Label>
              <Textarea
                placeholder="Người dùng thích làm việc vào buổi sáng, hay bỏ lỡ habit tập thể dục..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}><Plus className="w-3 h-3" /></Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {form.tags.map(tag => (
                    <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded-full flex items-center gap-1">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={createMemory.isPending || updateMemory.isPending}>
              {(createMemory.isPending || updateMemory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingMemory ? 'Lưu thay đổi' : 'Tạo Memory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

const SQL_MIGRATION = `-- Chạy trong Supabase SQL Editor
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'fact',
  content TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'manual',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON ai_memories(type);

ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON ai_memories
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users read own memories" ON ai_memories
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);`;
