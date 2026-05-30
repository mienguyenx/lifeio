import { useState } from 'react';
import { Brain, Plus, Check, X, Edit2, Trash2, Filter, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { AIMemoryEvent } from '@/types/lifeos';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'habit_pattern', label: 'Habit Pattern', color: 'bg-green-500' },
  { value: 'preference', label: 'Preference', color: 'bg-blue-500' },
  { value: 'life_context', label: 'Life Context', color: 'bg-purple-500' },
  { value: 'work_style', label: 'Work Style', color: 'bg-amber-500' },
  { value: 'health', label: 'Health', color: 'bg-red-500' },
  { value: 'relationship', label: 'Relationship', color: 'bg-pink-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  edited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function AIMemoryPage() {
  const aiMemories = useLifeOSStore((s) => s.aiMemories);
  const addAIMemory = useLifeOSStore((s) => s.addAIMemory);
  const updateAIMemory = useLifeOSStore((s) => s.updateAIMemory);
  const deleteAIMemory = useLifeOSStore((s) => s.deleteAIMemory);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [newMemory, setNewMemory] = useState({ memoryText: '', category: 'other', source: 'manual' as const });
  const [editText, setEditText] = useState('');

  const filtered = aiMemories.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return m.status === 'proposed';
    return m.category === filter;
  });

  const pendingCount = aiMemories.filter((m) => m.status === 'proposed').length;

  const handleAdd = () => {
    if (!newMemory.memoryText.trim()) return;
    addAIMemory({ memoryText: newMemory.memoryText.trim(), category: newMemory.category, source: 'manual', status: 'accepted' });
    setNewMemory({ memoryText: '', category: 'other', source: 'manual' });
    setShowAdd(false);
    toast.success('Đã thêm memory mới');
  };

  const handleAccept = (id: string) => {
    updateAIMemory(id, { status: 'accepted' });
    toast.success('Đã chấp nhận');
  };

  const handleReject = (id: string) => {
    updateAIMemory(id, { status: 'rejected' });
    toast('Đã từ chối');
  };

  const handleSaveEdit = (id: string) => {
    updateAIMemory(id, { memoryText: editText, status: 'edited' });
    setEditingId(null);
    toast.success('Đã cập nhật');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> AI Memory
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý những gì AI ghi nhớ về bạn
            {pendingCount > 0 && <Badge variant="destructive" className="ml-2 text-[10px]">{pendingCount} chờ duyệt</Badge>}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Thêm
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'pending', label: `Chờ duyệt (${pendingCount})` },
          ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs border transition-all',
              filter === f.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Memory List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có memory nào</p>
              <p className="text-xs">AI sẽ đề xuất memories từ các cuộc hội thoại, hoặc bạn có thể thêm thủ công</p>
            </CardContent>
          </Card>
        )}
        {filtered.map((memory) => {
          const cat = CATEGORIES.find((c) => c.value === memory.category);
          const isEditing = editingId === memory.id;

          return (
            <Card key={memory.id} className={cn(memory.status === 'proposed' && 'border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10')}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {cat && <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', cat.color)} />}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-sm min-h-[60px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveEdit(memory.id)}>Lưu</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>Hủy</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{memory.memoryText}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', STATUS_COLORS[memory.status])}>
                        {memory.status}
                      </Badge>
                      {cat && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cat.label}</Badge>}
                      <span className="text-[10px] text-muted-foreground">{memory.source}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(memory.createdAt).toLocaleDateString('vi')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {memory.status === 'proposed' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleAccept(memory.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleReject(memory.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(memory.id); setEditText(memory.memoryText); }}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteAIMemory(memory.id); toast('Đã xóa memory'); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Memory Modal */}
      <AdaptiveModal open={showAdd} onOpenChange={setShowAdd} title="Thêm AI Memory">
        <div className="space-y-3 mt-4">
          <Textarea
            placeholder="AI nên biết gì về bạn? VD: Tôi làm việc hiệu quả nhất từ 9-11 sáng..."
            value={newMemory.memoryText}
            onChange={(e) => setNewMemory({ ...newMemory, memoryText: e.target.value })}
            className="min-h-[80px] resize-none"
            autoFocus
          />
          <Select value={newMemory.category} onValueChange={(v) => setNewMemory({ ...newMemory, category: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full" onClick={handleAdd} disabled={!newMemory.memoryText.trim()}>
            <Plus className="w-4 h-4 mr-1.5" /> Thêm Memory
          </Button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
