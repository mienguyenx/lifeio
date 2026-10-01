import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, FilterChips, HeroBanner, MascotCard, Page, PageHeader, ProgressBar, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { ChoiceGrid, Field, FormActions, areaCls } from '@/components/lio/form';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { AIMemoryEvent } from '@/types/lifeos';

const CATEGORIES = [
  { id: 'habit_pattern', label: 'Thói quen', icon: '🔁', color: '#22C55E' },
  { id: 'preference', label: 'Sở thích', icon: '💙', color: '#3B82F6' },
  { id: 'life_context', label: 'Bối cảnh sống', icon: '🏡', color: '#8B5CF6' },
  { id: 'work_style', label: 'Cách làm việc', icon: '💼', color: '#F59E0B' },
  { id: 'health', label: 'Sức khỏe', icon: '💪', color: '#EF4444' },
  { id: 'relationship', label: 'Quan hệ', icon: '❤️', color: '#EC4899' },
  { id: 'other', label: 'Khác', icon: '✨', color: '#64748B' },
] as const;
type Cat = (typeof CATEGORIES)[number]['id'];
const STATUS: Record<AIMemoryEvent['status'], { label: string; cls: string }> = {
  proposed: { label: 'Chờ duyệt', cls: 'bg-[#FFF4DB] text-[#B7791F] dark:bg-amber-500/15' },
  accepted: { label: 'Đã chấp nhận', cls: 'bg-[#E3F8EE] text-[#1F9D63] dark:bg-emerald-500/15' },
  rejected: { label: 'Đã từ chối', cls: 'bg-[#FFE4EA] text-[#E0445E] dark:bg-rose-500/15' },
  edited: { label: 'Đã chỉnh sửa', cls: 'bg-[#E6F1FF] text-[#2F7BF6] dark:bg-sky-500/15' },
};
const SOURCE: Record<string, string> = { manual: 'Thủ công', chat: 'Hội thoại', review: 'Review', system: 'Hệ thống' };
type View = 'all' | 'pending' | 'accepted' | 'rejected';

export default function AIMemoryPage() {
  const isMobile = useIsMobile();
  const aiMemories = useLifeOSStore((s) => s.aiMemories);
  const addAIMemory = useLifeOSStore((s) => s.addAIMemory);
  const updateAIMemory = useLifeOSStore((s) => s.updateAIMemory);
  const deleteAIMemory = useLifeOSStore((s) => s.deleteAIMemory);
  const [params, setParams] = useSearchParams();

  const [view, setView] = useState<View>('all');
  const [cat, setCat] = useState<'all' | Cat>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newMemory, setNewMemory] = useState<{ memoryText: string; category: Cat }>({ memoryText: '', category: 'other' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [toDelete, setToDelete] = useState<AIMemoryEvent | null>(null);

  useEffect(() => {
    if (params.has('add')) { setShowAdd(true); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const pending = aiMemories.filter((m) => m.status === 'proposed');
  const accepted = aiMemories.filter((m) => m.status === 'accepted' || m.status === 'edited');
  const rejected = aiMemories.filter((m) => m.status === 'rejected');

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = view === 'pending' ? pending : view === 'accepted' ? accepted : view === 'rejected' ? rejected : aiMemories;
    return base.filter((m) => (cat === 'all' || m.category === cat) && (!q || m.memoryText.toLowerCase().includes(q)))
      .sort((a, b) => (a.status === 'proposed' ? -1 : 0) - (b.status === 'proposed' ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  }, [aiMemories, pending, accepted, rejected, view, cat, search]);

  const byCat = CATEGORIES.map((c) => ({ ...c, n: aiMemories.filter((m) => m.category === c.id).length }));
  const catChips = [{ id: 'all', label: 'Mọi danh mục', count: aiMemories.length }, ...byCat.filter((c) => c.n > 0).map((c) => ({ id: c.id, label: `${c.icon} ${c.label}`, count: c.n }))] as { id: 'all' | Cat; label: string; count: number }[];

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newMemory.memoryText.trim()) return;
    addAIMemory({ memoryText: newMemory.memoryText.trim(), category: newMemory.category, source: 'manual', status: 'accepted' });
    setNewMemory({ memoryText: '', category: 'other' }); setShowAdd(false); toast.success('Đã thêm memory mới');
  };
  const accept = (id: string) => { updateAIMemory(id, { status: 'accepted' }); toast.success('Đã chấp nhận'); };
  const reject = (id: string) => { updateAIMemory(id, { status: 'rejected' }); toast('Đã từ chối'); };
  const saveEdit = (id: string) => { if (!editText.trim()) return; updateAIMemory(id, { memoryText: editText.trim(), status: 'edited' }); setEditingId(null); toast.success('Đã cập nhật'); };

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Theo danh mục" />
        <div className="space-y-3">
          {byCat.map((c) => (
            <button key={c.id} className="w-full flex items-center gap-3 text-left" onClick={() => setCat(cat === c.id ? 'all' : c.id)}>
              <span className="h-9 w-9 rounded-xl grid place-items-center text-[16px] shrink-0" style={{ background: `${c.color}1f` }}>{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[12.5px] font-semibold"><span className={cn(cat === c.id && 'text-primary')}>{c.label}</span><span className="text-muted-foreground">{c.n}</span></div>
                <ProgressBar value={aiMemories.length ? (c.n / aiMemories.length) * 100 : 0} color={c.color} className="mt-1" />
              </div>
            </button>
          ))}
        </div>
      </Surface>
      <MascotCard mascot="lumi" pose="happy" title="AI hiểu bạn hơn" quote="Memory đã chấp nhận giúp AI Coach đưa ra gợi ý sát với bạn hơn." />
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="AI Memory"
        subtitle="Quản lý những gì AI ghi nhớ về bạn 🧠"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm memory..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" />Thêm memory</Button>}
        </>}
      />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: aiMemories.length }, { id: 'pending', label: 'Chờ duyệt', count: pending.length }, { id: 'accepted', label: 'Đã nhớ', count: accepted.length }, { id: 'rejected', label: 'Đã từ chối', count: rejected.length }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="lumi" pose="happy" title="Bạn kiểm soát trí nhớ của AI" subtitle={pending.length ? `Có ${pending.length} memory AI đề xuất đang chờ bạn duyệt.` : 'Thêm điều AI nên biết, chấp nhận hoặc từ chối đề xuất bất cứ lúc nào.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={pending.length ? () => setView('pending') : () => setShowAdd(true)}>{pending.length ? 'Duyệt ngay' : <><Plus className="h-4 w-4 mr-1.5" />Thêm memory</>}</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon="module/ai-coach" tint="violet" value={aiMemories.length} label="Tổng memory" hint="AI đang lưu" onClick={() => setView('all')} active={view === 'all'} />
            <StatTile icon="status/warning" tint="amber" value={pending.length} label="Chờ duyệt" hint="đề xuất từ AI" onClick={() => setView('pending')} active={view === 'pending'} />
            <StatTile icon="status/success" tint="mint" value={accepted.length} label="Đã nhớ" hint="chấp nhận / đã sửa" onClick={() => setView('accepted')} active={view === 'accepted'} />
            <StatTile icon={<span className="text-[22px]">🚫</span>} tint="rose" value={rejected.length} label="Đã từ chối" hint="AI sẽ bỏ qua" onClick={() => setView('rejected')} active={view === 'rejected'} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Danh sách memory" hint={`${list.length} mục`} /></div>
            <div className="overflow-x-auto no-scrollbar -mx-1 px-2 mb-2"><FilterChips items={catChips} value={cat} onChange={setCat} /></div>
            {list.length === 0 ? (
              aiMemories.length === 0
                ? <EmptyState mascot="lumi" title="Chưa có memory nào" description="AI sẽ đề xuất memory từ các cuộc hội thoại, hoặc bạn có thể thêm thủ công." action={<Button className="rounded-full" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" />Thêm memory</Button>} />
                : <EmptyState mascot="lumi" compact title="Không có mục phù hợp" description="Thử đổi bộ lọc hoặc từ khóa nhé." />
            ) : (
              <div className="divide-y divide-border/50">
                {list.map((m) => {
                  const c = CATEGORIES.find((x) => x.id === m.category) ?? CATEGORIES[6];
                  const st = STATUS[m.status] ?? STATUS.accepted;
                  const editing = editingId === m.id;
                  return (
                    <div key={m.id} className={cn('flex items-start gap-3 px-1 py-3', m.status === 'proposed' && 'bg-[#FFF9EC] dark:bg-amber-500/5 -mx-1 px-2 rounded-2xl')}>
                      <span className="h-10 w-10 rounded-[14px] grid place-items-center text-[18px] shrink-0" style={{ background: `${c.color}1f` }}>{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        {editing ? (
                          <div className="space-y-2">
                            <textarea className={areaCls} rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                            <div className="flex gap-2"><Button size="sm" className="rounded-full" onClick={() => saveEdit(m.id)}>Lưu</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditingId(null)}>Hủy</Button></div>
                          </div>
                        ) : <p className={cn('text-[13.5px] leading-snug', m.status === 'rejected' && 'line-through text-muted-foreground')}>{m.memoryText}</p>}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[11px]">
                          <span className={cn('rounded-full px-2 py-0.5 font-semibold', st.cls)}>{st.label}</span>
                          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: `${c.color}1a`, color: c.color }}>{c.label}</span>
                          <span className="text-muted-foreground">{SOURCE[m.source] ?? m.source} · {new Date(m.createdAt).toLocaleDateString('vi')}</span>
                        </div>
                      </div>
                      {!editing && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {m.status === 'proposed' && <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-[#1F9D63]" aria-label="Chấp nhận" onClick={() => accept(m.id)}><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" aria-label="Từ chối" onClick={() => reject(m.id)}><X className="h-4 w-4" /></Button>
                          </>}
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Sửa" onClick={() => { setEditingId(m.id); setEditText(m.memoryText); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" aria-label="Xóa" onClick={() => setToDelete(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      )}
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
      {isMobile && <Fab onClick={() => setShowAdd(true)} label="Thêm memory" />}

      <AdaptiveModal open={showAdd} onOpenChange={setShowAdd} title="Thêm AI Memory">
        <form onSubmit={handleAdd} className="space-y-3.5 mt-2">
          <Field label="AI nên biết gì về bạn?"><textarea className={areaCls} rows={4} placeholder="VD: Tôi làm việc hiệu quả nhất từ 9-11 sáng..." value={newMemory.memoryText} onChange={(e) => setNewMemory({ ...newMemory, memoryText: e.target.value })} autoFocus /></Field>
          <Field label="Danh mục"><ChoiceGrid cols={4} items={CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color }))} value={newMemory.category} onChange={(v) => setNewMemory({ ...newMemory, category: v })} /></Field>
          <FormActions onCancel={() => setShowAdd(false)} submitLabel="Thêm memory" disabled={!newMemory.memoryText.trim()} />
        </form>
      </AdaptiveModal>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa memory này?</AlertDialogTitle>
            <AlertDialogDescription>AI sẽ không còn ghi nhớ nội dung này nữa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) { deleteAIMemory(toDelete.id); toast('Đã xóa memory'); } setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
