import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/brand/EmptyState';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { Fab, FilterChips, HeroBanner, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Book, Course } from '@/hooks/sync/useLearningSync';
import { useLearning } from './hooks/useLearning';
import type { ItemKind, ItemStatus, LearningItem } from './utils/learning.utils';
import { LearningRow } from './components/LearningRow';
import { LibraryGrid } from './components/LibraryGrid';
import { LearningStats } from './components/LearningStats';
import { LearningSidePanel } from './components/LearningSidePanel';
import { EMPTY_DRAFT, LearningItemModal, type LearningDraft } from './components/LearningItemModal';

type View = 'overview' | 'library' | 'stats' | 'linked';
type Kind = 'all' | ItemKind;
type Sort = 'progress' | 'title' | 'status';

export default function LearningPage() {
  const isMobile = useIsMobile();
  const api = useLearning();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [kind, setKind] = useState<Kind>('all');
  const [status, setStatus] = useState<ItemStatus | 'all'>('all');
  const [sort, setSort] = useState<Sort>('status');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; item?: LearningItem; initial: LearningDraft } | null>(null);
  const [toDelete, setToDelete] = useState<LearningItem | null>(null);

  const openCreate = (k: ItemKind = 'course') => setForm({ mode: 'create', initial: { ...EMPTY_DRAFT, kind: k } });
  useEffect(() => {
    if (params.has('add')) { setForm({ mode: 'create', initial: EMPTY_DRAFT }); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const { items, stats } = api;
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rank: Record<ItemStatus, number> = { active: 0, todo: 1, done: 2 };
    return items.filter((i) => (kind === 'all' || i.kind === kind) && (status === 'all' || i.status === status) && (!q || i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)))
      .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'vi') : sort === 'progress' ? b.pct - a.pct : rank[a.status] - rank[b.status] || b.pct - a.pct);
  }, [items, kind, status, sort, search]);

  const step = (i: LearningItem, n: number) => (i.kind === 'course' ? api.setCourseProgress(i.raw as Course, Math.max(0, Math.min(i.total, n))) : api.setBookProgress(i.raw as Book, Math.max(0, Math.min(i.total, n))));
  const edit = (i: LearningItem) => {
    if (i.kind === 'course') { const c = i.raw as Course; setForm({ mode: 'edit', item: i, initial: { ...EMPTY_DRAFT, kind: 'course', course: { title: c.title, description: c.description ?? '', category: c.category, totalLessons: String(c.totalLessons) } } }); }
    else { const b = i.raw as Book; setForm({ mode: 'edit', item: i, initial: { ...EMPTY_DRAFT, kind: 'book', book: { title: b.title, author: b.author, totalPages: String(b.totalPages) } } }); }
  };
  const submit = (d: LearningDraft) => {
    if (form?.mode === 'edit' && form.item) { if (d.kind === 'course') api.editCourse(form.item.id, d.course); else api.editBook(form.item.id, d.book); }
    else if (d.kind === 'course') api.addCourse(d.course); else api.addBook(d.book);
    setForm(null);
  };
  const name = api.user?.name?.split(' ').slice(-1)[0] || 'bạn';
  const kinds = [{ id: 'all', label: 'Tất cả', count: items.length }, { id: 'course', label: 'Khóa học', count: api.courses.length }, { id: 'book', label: 'Sách', count: api.books.length }] as { id: Kind; label: string; count: number }[];
  const statuses = [{ id: 'all', label: 'Mọi trạng thái' }, { id: 'active', label: 'Đang học / đọc' }, { id: 'done', label: 'Hoàn thành' }, { id: 'todo', label: 'Chưa bắt đầu' }] as { id: ItemStatus | 'all'; label: string }[];

  const empty = items.length === 0
    ? <EmptyState mascot="ori" pose="learn" title="Bắt đầu hành trình học tập" description="Thêm khóa học hoặc cuốn sách đầu tiên để theo dõi tiến độ." action={<Button className="rounded-full" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Thêm mới</Button>} />
    : <EmptyState mascot="ori" compact title="Không có mục phù hợp" description="Thử đổi bộ lọc hoặc từ khóa nhé." />;

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="ori" pose="learn" title={`Xin chào, ${name}! 👋`} subtitle="Mỗi ngày học tập là một bước gần hơn đến phiên bản tốt hơn của bạn."
          action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Thêm tài liệu</Button>} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/learning" tint="violet" value={stats.activeCourses} label="Đang học" hint="khóa học" onClick={() => { setKind('course'); setStatus('active'); }} />
          <StatTile icon={<span className="text-[22px]">📖</span>} tint="orange" value={stats.readingBooks} label="Đang đọc" hint="cuốn sách" onClick={() => { setKind('book'); setStatus('active'); }} />
          <StatTile icon="status/success" tint="mint" value={stats.completedCourses + stats.completedBooks} label="Đã hoàn thành" hint={`${stats.completedCourses} khóa · ${stats.completedBooks} sách`} onClick={() => { setKind('all'); setStatus('done'); }} />
          <StatTile icon={<span className="text-[22px]">⏱️</span>} tint="sky" value={`${stats.hours.toFixed(0)}h`} label="Giờ học" hint="Ước tính 0,5h/bài" />
        </div>
        <Surface className="p-3 sm:p-4">
          <div className="px-1"><SectionTitle title="Danh sách học tập" hint={`${list.length} mục`} /></div>
          <div className={cn('flex gap-2 px-1 mb-2', isMobile ? 'flex-col' : 'items-center')}>
            <FilterChips items={kinds} value={kind} onChange={setKind} />
            <div className={cn('flex gap-2', !isMobile && 'ml-auto')}>
              <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus | 'all')}>
                <SelectTrigger className="h-9 w-[160px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="h-9 w-[150px] rounded-full bg-card"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="status">Sắp xếp: Trạng thái</SelectItem><SelectItem value="progress">Sắp xếp: Tiến độ</SelectItem><SelectItem value="title">Sắp xếp: Tên</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {list.length === 0 ? empty : <div className="divide-y divide-border/50">{list.map((i) => <LearningRow key={`${i.kind}-${i.id}`} item={i} onStep={step} onEdit={edit} onDelete={setToDelete} />)}</div>}
        </Surface>
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4"><LearningSidePanel api={api} /></aside>}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Học tập <ModuleHelpButton module="learning" /></span>}
        subtitle="Học tập mỗi ngày, mở rộng thế giới, phát triển bản thân 📚"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm khóa học, sách..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Thêm mới</Button>}
        </>}
      />
      <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'library', label: 'Thư viện' }, { id: 'stats', label: 'Thống kê' }, { id: 'linked', label: 'Liên kết' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />
      {view === 'overview' && overview}
      {view === 'library' && (
        <div className="space-y-4">
          <FilterChips items={kinds} value={kind} onChange={setKind} />
          <LibraryGrid items={list} onOpen={edit} onAdd={() => openCreate(kind === 'book' ? 'book' : 'course')} />
        </div>
      )}
      {view === 'stats' && <LearningStats api={api} />}
      {view === 'linked' && <AreaDashboardSection area="learning" />}
      {isMobile && view === 'overview' && <div className="mt-5"><LearningSidePanel api={api} /></div>}
      {isMobile && <Fab onClick={() => openCreate()} label="Thêm mới" />}

      {form && <LearningItemModal open onOpenChange={(o) => !o && setForm(null)} mode={form.mode} initial={form.initial} onSubmit={submit} />}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {toDelete?.kind === 'book' ? 'sách' : 'khóa học'} “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Tiến độ học tập của mục này sẽ bị xóa và không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) (toDelete.kind === 'course' ? api.removeCourse : api.removeBook)(toDelete.id); setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
