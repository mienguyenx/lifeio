import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, Plus, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, FilterChips, HeroBanner, IconButton, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile } from '@/components/lio';
import { JournalHistoryModal } from '@/components/journal/JournalHistoryModal';
import { JournalTagsManager } from '@/components/journal/JournalTagsManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type JournalEntry, type LifeArea } from '@/types/lifeos';
import { useJournal } from './hooks/useJournal';
import { draftFromEntry, EMPTY_DRAFT, ENERGIES, longDate, MOODS, todayKey, titleOf, type JournalDraft } from './utils/journal.utils';
import { JournalCard } from './components/JournalCard';
import { JournalEditor } from './components/JournalEditor';
import { JournalReader } from './components/JournalReader';
import { JournalCalendar } from './components/JournalCalendar';
import { JournalInsights } from './components/JournalInsights';

type View = 'list' | 'calendar' | 'insights';
const selCls = 'h-10 rounded-full bg-card border-border shadow-soft text-[13px] w-auto min-w-[130px]';

export default function JournalPage() {
  const isMobile = useIsMobile();
  const api = useJournal();
  const { entries, tags, stats, tagOf } = api;
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [mood, setMood] = useState<string>('all');
  const [energy, setEnergy] = useState<string>('all');
  const [area, setArea] = useState<LifeArea | 'all'>('all');
  const [tag, setTag] = useState<string>('all');
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; initial: JournalDraft; entry?: JournalEntry } | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<JournalEntry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  const openCreate = (date?: string) => setEditor({ mode: 'create', initial: { ...EMPTY_DRAFT(), date: date || todayKey() } });
  const openEdit = (e: JournalEntry) => { setReadingId(null); setEditor({ mode: 'edit', initial: draftFromEntry(e), entry: e }); };
  useEffect(() => {
    if (params.has('add')) { openCreate(); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => (mood === 'all' || e.mood === Number(mood)) && (energy === 'all' || e.energy === Number(energy))
      && (area === 'all' || e.areas?.includes(area)) && (tag === 'all' || e.tags?.includes(tag))
      && (!q || e.content.toLowerCase().includes(q) || e.gratitude?.some((g) => g.toLowerCase().includes(q))));
  }, [entries, search, mood, energy, area, tag]);
  const reading = entries.find((e) => e.id === readingId) || null;
  const filtered = mood !== 'all' || energy !== 'all' || area !== 'all' || tag !== 'all' || !!search;
  const avgMoodEmoji = MOODS[Math.max(0, Math.round(stats.avgMood) - 1)]?.emoji;

  const moodChips = [{ id: 'all', label: 'Tất cả', count: entries.length }, ...MOODS.map((m) => ({ id: String(m.value), label: `${m.emoji} ${m.label}` }))];

  const listView = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 ">
        <StatTile icon="module/journal" tint="violet" value={stats.total} label="Tổng bài viết" hint={stats.last7 ? <span className="text-primary">+{stats.last7} tuần này</span> : undefined} />
        <StatTile icon={<span className="text-[22px]">🔥</span>} tint="orange" value={stats.streak} label="Ngày liên tiếp" />
        <StatTile icon={<span className="text-[22px]">{avgMoodEmoji ?? '🙂'}</span>} tint="amber" value={stats.avgMood ? stats.avgMood.toFixed(1) : '–'} label="Tâm trạng TB" />
        <StatTile icon="module/insights" tint="mint" value={`${stats.pct30}%`} label="Ghi chép 30 ngày" />
      </div>
      <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'items-center flex-wrap')}>
        <FilterChips items={moodChips} value={mood} onChange={setMood} />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Select value={energy} onValueChange={setEnergy}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Mọi năng lượng</SelectItem>{ENERGIES.map((e) => <SelectItem key={e.value} value={String(e.value)}>{e.emoji} {e.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={area} onValueChange={(v) => setArea(v as LifeArea | 'all')}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Mọi lĩnh vực</SelectItem>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Mọi thẻ</SelectItem>{tags.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <SectionTitle title={filtered ? 'Kết quả' : 'Nhật ký gần đây'} hint={`${list.length} bài`} />
      {list.length === 0 ? (
        entries.length === 0
          ? <EmptyState mascot="ori" pose="learn" title="Bắt đầu trang nhật ký đầu tiên" description="Mỗi trang nhật ký là một bước tiến đến phiên bản tốt hơn của bạn." action={<Button className="rounded-full" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Viết nhật ký</Button>} />
          : <EmptyState mascot="ori" compact title="Không có bài viết phù hợp" description="Thử đổi bộ lọc hoặc từ khóa nhé." />
      ) : isMobile ? (
        <div className="space-y-2.5">{list.map((e) => <JournalCard key={e.id} layout="row" entry={e} tagOf={tagOf} onOpen={() => setReadingId(e.id)} onEdit={() => openEdit(e)} onDelete={() => setToDelete(e)} />)}</div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{list.map((e) => <JournalCard key={e.id} entry={e} tagOf={tagOf} onOpen={() => setReadingId(e.id)} onEdit={() => openEdit(e)} onDelete={() => setToDelete(e)} />)}</div>
      )}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Nhật ký"
        subtitle="Ghi lại hôm nay, hiểu rõ bản thân, kiến tạo ngày mai tốt hơn"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); if (v) setView('list'); }} placeholder="Tìm kiếm nhật ký..." />
          <IconButton label="Lịch sử nhật ký" onClick={() => setHistoryOpen(true)}><History className="h-4 w-4" /></IconButton>
          <IconButton label="Quản lý thẻ" onClick={() => setTagsOpen(true)}><Tags className="h-4 w-4" /></IconButton>
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Viết nhật ký</Button>}
        </>}
      />
      <HeroBanner mascot="ori" pose="learn" className="mb-4"
        title={<>Chào bạn{api.userName ? `, ${api.userName}` : ''}! 👋</>}
        subtitle={stats.writtenToday ? 'Bạn đã ghi chép hôm nay — tuyệt vời! Viết thêm nếu còn điều muốn lưu giữ.' : 'Mỗi trang nhật ký là một bước tiến đến phiên bản tốt hơn của chính bạn.'}
        action={<div className="flex flex-wrap items-center gap-2">
          <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Viết nhật ký</Button>
          {!isMobile && <span className="text-[12.5px] font-medium text-muted-foreground">{longDate(todayKey())}</span>}
        </div>} />
      <SegmentedTabs items={[{ id: 'list', label: 'Nhật ký' }, { id: 'calendar', label: 'Lịch' }, { id: 'insights', label: 'Thống kê' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />
      {view === 'list' && listView}
      {view === 'calendar' && <JournalCalendar entries={entries} onOpen={(e) => setReadingId(e.id)} onWrite={(d) => openCreate(d)} />}
      {view === 'insights' && <JournalInsights entries={entries} tags={tags} />}
      {isMobile && <Fab onClick={() => openCreate()} label="Viết nhật ký" />}

      <JournalEditor open={!!editor} onOpenChange={(o) => !o && setEditor(null)} mode={editor?.mode ?? 'create'} initial={editor?.initial} tags={tags} onManageTags={() => setTagsOpen(true)}
        onSubmit={(d) => { if (editor?.entry) api.edit(editor.entry, d); else api.create(d); }} />
      <JournalReader entry={reading} onOpenChange={(o) => !o && setReadingId(null)} tagOf={tagOf} onEdit={() => reading && openEdit(reading)} onDelete={() => reading && setToDelete(reading)} />
      <JournalHistoryModal entries={entries} journalTags={tags} open={historyOpen} onOpenChange={setHistoryOpen} onSelectEntry={(e) => { setHistoryOpen(false); setReadingId(e.id); }} />
      <JournalTagsManager open={tagsOpen} onOpenChange={setTagsOpen} tags={tags} onAddTag={api.addTag} onUpdateTag={api.updateTag} onDeleteTag={api.deleteTag} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhật ký “{toDelete ? titleOf(toDelete) : ''}”?</AlertDialogTitle>
            <AlertDialogDescription>Bài viết sẽ bị xóa khỏi nhật ký của bạn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) { api.remove(toDelete); if (readingId === toDelete.id) setReadingId(null); } setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
