import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownAZ, ArrowUpAZ, Flame, History, LayoutList, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { ArchivedHabitsSection } from '@/components/habits/ArchivedHabitsSection';
import { HabitHistoryManager } from '@/components/habits/HabitHistoryManager';
import { HabitPredictionCard } from '@/components/habits/HabitPredictionCard';
import { HabitCompetitionCard } from '@/components/habits/HabitCompetitionCard';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { useHabitViewPreferences } from '@/hooks/useHabitViewPreferences';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type Habit, type LifeArea } from '@/types/lifeos';
import { useHabits } from './hooks/useHabits';
import type { HabitFormValue, HabitTab } from './types/habit.types';
import { formFromHabit, habitFromForm, isDoneOn, rateIn, weekdayOf, areaInfo } from './utils/habit.utils';
import { HabitTodayHero, HabitStatTiles } from './components/HabitStatsCard';
import { WeekStrip } from './components/WeekStrip';
import { HabitCard, HabitIcon } from './components/HabitCard';
import { HabitCreateModal } from './components/HabitCreateModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { HabitInsightsChart } from './components/HabitInsightsChart';
import { HabitChallenges } from './components/HabitChallenges';
import { HabitEmptyState } from './components/HabitEmptyState';

type Freq = 'all' | Habit['frequency'];
type SortBy = 'name' | 'streak' | 'completion' | 'created' | 'area';

const TABS: { id: HabitTab; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'insights', label: 'Thống kê' },
  { id: 'challenges', label: 'Thử thách' },
];
const FREQS: { id: Freq; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'daily', label: 'Hàng ngày' },
  { id: 'weekly', label: 'Hàng tuần' },
  { id: 'custom', label: 'Tùy chỉnh' },
];
const SORTS: { id: SortBy; label: string }[] = [
  { id: 'created', label: 'Ngày tạo' },
  { id: 'name', label: 'Tên' },
  { id: 'streak', label: 'Streak' },
  { id: 'completion', label: 'Tỷ lệ 30 ngày' },
  { id: 'area', label: 'Lĩnh vực' },
];

const chip = (on: boolean) => cn(
  'h-9 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all border',
  on ? 'bg-primary text-primary-foreground border-primary shadow-soft' : 'bg-card border-border/70 text-muted-foreground hover:text-foreground',
);

/** Habit có lịch vào ngày `date` không (weekly/custom dùng customDays, như trang cũ không lọc → chỉ dùng để làm mờ). */
const scheduledOn = (h: Habit, date: string) =>
  h.frequency === 'daily' || !h.customDays?.length || h.customDays.includes(weekdayOf(date));

export default function HabitsPage() {
  const isMobile = useIsMobile();
  const api = useHabits();
  const { active, archived, goals, stats, today, last30 } = api;
  const [params, setParams] = useSearchParams();
  const { groupByArea, setGroupByArea } = useHabitViewPreferences();

  const [tab, setTab] = useState<HabitTab>('today');
  const [date, setDate] = useState(today);
  const [freq, setFreq] = useState<Freq>('all');
  const [area, setArea] = useState<LifeArea | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Habit | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const detail = useMemo(() => api.habits.find((h) => h.id === detailId) ?? null, [api.habits, detailId]);
  const goalTitle = useCallback((h: Habit) => goals.find((g) => g.id === h.goalId)?.title, [goals]);

  useEffect(() => {
    if (params.has('add')) {
      setEditing(null); setFormOpen(true);
      params.delete('add'); setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const r = active.filter((h) =>
      (freq === 'all' || h.frequency === freq) && (area === 'all' || h.area === area) &&
      (!q || h.name.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q)));
    r.sort((a, b) => {
      let c = 0;
      if (sortBy === 'name') c = a.name.localeCompare(b.name);
      else if (sortBy === 'streak') c = a.streak - b.streak;
      else if (sortBy === 'completion') c = rateIn(a, last30) - rateIn(b, last30);
      else if (sortBy === 'area') c = a.area.localeCompare(b.area);
      else c = (new Date(a.createdAt).getTime() || 0) - (new Date(b.createdAt).getTime() || 0);
      return order === 'desc' ? -c : c;
    });
    return r;
  }, [active, freq, area, search, sortBy, order, last30]);

  const groups = useMemo(() => {
    if (!groupByArea) return null;
    return LIFE_AREAS.map((a) => ({ area: a, items: list.filter((h) => h.area === a.id) })).filter((g) => g.items.length);
  }, [list, groupByArea]);

  const doneRatio = useCallback((d: string) => {
    const s = active.filter((h) => scheduledOn(h, d));
    return s.length ? s.filter((h) => isDoneOn(h, d)).length / s.length : 0;
  }, [active]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (h: Habit) => { setDetailId(null); setEditing(h); setFormOpen(true); };
  const submit = (f: HabitFormValue) => {
    if (editing) { api.updateHabit(editing.id, habitFromForm(f)); toast.success('Đã cập nhật thói quen'); }
    else { api.addHabit(habitFromForm(f)); toast.success('Đã thêm thói quen mới 🌱'); }
    setFormOpen(false); setEditing(null);
  };
  const confirmDelete = () => {
    if (!toDelete) return;
    api.deleteHabit(toDelete.id);
    toast.success('Đã chuyển vào thùng rác');
    if (detailId === toDelete.id) setDetailId(null);
    setToDelete(null);
  };

  const row = (h: Habit) => {
    const card = (
      <HabitCard habit={h} date={date} goalTitle={goalTitle(h)} onOpen={() => setDetailId(h.id)} onCheck={() => api.check(h, date)} />
    );
    return (
      <div key={h.id} className={cn(!scheduledOn(h, date) && 'opacity-60')}>
        {isMobile ? (
          <SwipeableCard
            onSwipeRight={() => api.increment(h, date)}
            onSwipeLeft={() => setToDelete(h)}
            rightAction="complete" leftAction="delete" rightLabel="+1" leftLabel="Xóa"
            disabled={isDoneOn(h, date)}
          >{card}</SwipeableCard>
        ) : card}
      </div>
    );
  };

  const filtered = freq !== 'all' || area !== 'all' || !!search.trim();
  const dateLabel = date === today ? 'Hôm nay' : new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

  const listBlock = (
    <section className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
        {FREQS.map((f) => <button key={f.id} className={chip(freq === f.id)} onClick={() => setFreq(f.id)}>{f.label}</button>)}
        {!isMobile && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Select value={area} onValueChange={(v) => setArea(v as LifeArea | 'all')}>
              <SelectTrigger className="h-9 w-[150px] rounded-full bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi lĩnh vực</SelectItem>
                {LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="h-9 w-[180px] rounded-full bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{SORTS.map((s) => <SelectItem key={s.id} value={s.id}>Sắp xếp: {s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" title={order === 'asc' ? 'Tăng dần' : 'Giảm dần'} onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
              {order === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
            </Button>
            <Button variant={groupByArea ? 'default' : 'outline'} size="icon" className="h-9 w-9 rounded-full" title="Nhóm theo lĩnh vực" onClick={() => setGroupByArea(!groupByArea)}>
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[15px] font-bold">Thói quen · {dateLabel}</h2>
        <span className="text-[12.5px] text-muted-foreground">{list.filter((h) => isDoneOn(h, date)).length}/{list.length} hoàn thành</span>
      </div>

      {list.length === 0 ? (
        <HabitEmptyState filtered={filtered && active.length > 0} onAdd={openCreate} />
      ) : groups ? (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.area.id} className="space-y-2.5">
              <p className="px-1 text-[12.5px] font-bold uppercase tracking-wide text-muted-foreground">{g.area.icon} {g.area.name} · {g.items.length}</p>
              {g.items.map(row)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">{list.map(row)}</div>
      )}
    </section>
  );

  const topStreaks = useMemo(() => [...active].sort((a, b) => b.streak - a.streak).slice(0, 4).filter((h) => h.streak > 0), [active]);

  const todayTab = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5 min-w-0">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <HabitTodayHero stats={stats} compact={isMobile} />
          <HabitStatTiles stats={stats} />
        </div>
        <div className="rounded-[22px] bg-card border border-border/60 shadow-soft p-3">
          <WeekStrip selected={date} today={today} onSelect={setDate} doneRatio={doneRatio} />
        </div>
        {listBlock}
      </div>
      {!isMobile && (
        <aside className="space-y-4 hidden xl:block">
          <div className="rounded-[22px] bg-card border border-border/60 shadow-soft p-4">
            <p className="text-[14px] font-bold mb-3 flex items-center gap-1.5"><Flame className="h-4 w-4 text-[#FF7A45]" />Streak nổi bật</p>
            {topStreaks.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">Hoàn thành thói quen để bắt đầu chuỗi ngày đầu tiên.</p>
            ) : topStreaks.map((h) => (
              <button key={h.id} onClick={() => setDetailId(h.id)} className="w-full flex items-center gap-3 py-2 text-left hover:opacity-80">
                <HabitIcon habit={h} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">{h.name}</p>
                  <p className="text-[11.5px] text-muted-foreground">{areaInfo(h)?.name}</p>
                </div>
                <span className="text-[13px] font-bold text-[#FF7A45]">{h.streak} ngày</span>
              </button>
            ))}
          </div>
          <HabitPredictionCard habits={active} compact />
          <ArchivedHabitsSection archivedHabits={archived} onViewDetail={(h) => setDetailId(h.id)} />
        </aside>
      )}
      {isMobile && archived.length > 0 && <ArchivedHabitsSection archivedHabits={archived} onViewDetail={(h) => setDetailId(h.id)} />}
    </div>
  );

  const insightsTab = (
    <div className="space-y-5">
      <HabitInsightsChart habits={active} today={today} onOpen={(h) => setDetailId(h.id)} />
      <div className="grid gap-4 lg:grid-cols-2">
        <HabitPredictionCard habits={active} />
        <HabitCompetitionCard habits={active} />
      </div>
    </div>
  );

  return (
    <div className={cn('mx-auto w-full max-w-[1280px]', isMobile ? 'px-4 pt-3 pb-28' : 'px-6 py-6')}>
      {/* Header */}
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className={cn('font-extrabold tracking-tight', isMobile ? 'text-[24px]' : 'text-[28px]')}>Thói quen</h1>
            <ModuleHelpButton module="habits" />
          </div>
          <p className="text-[13.5px] text-muted-foreground">Thói quen nhỏ, thay đổi lớn ✨</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showSearch || (!isMobile && search) ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thói quen..." className="h-10 w-[180px] sm:w-[240px] rounded-full pl-9 pr-8" />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { setSearch(''); setShowSearch(false); }}><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => setShowSearch(true)} title="Tìm kiếm"><Search className="h-4 w-4" /></Button>
          )}
          <Button variant="outline" size={isMobile ? 'icon' : 'default'} className={cn('h-10 rounded-full', isMobile && 'w-10')} onClick={() => setHistoryOpen(true)} title="Lịch sử">
            <History className="h-4 w-4" />{!isMobile && <span className="ml-1.5">Lịch sử</span>}
          </Button>
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm thói quen</Button>}
        </div>
      </header>

      {/* Tabs */}
      <div className={cn('inline-flex p-1 rounded-full bg-secondary/70 mb-5', isMobile && 'w-full')}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            'h-9 px-5 rounded-full text-[13.5px] font-semibold transition-all',
            isMobile && 'flex-1 px-2',
            tab === t.id ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
          )}>{t.label}</button>
        ))}
      </div>

      {tab === 'today' && todayTab}
      {tab === 'insights' && insightsTab}
      {tab === 'challenges' && <HabitChallenges habits={active} onStart={api.startChallenge} onOpen={(h) => setDetailId(h.id)} />}

      {isMobile && (
        <button onClick={openCreate} aria-label="Thêm thói quen" className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform">
          <Plus className="h-6 w-6" />
        </button>
      )}

      <HabitCreateModal
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        mode={editing ? 'edit' : 'create'}
        initial={editing ? formFromHabit(editing) : undefined}
        goals={goals}
        onSubmit={submit}
      />
      <HabitDetailModal
        habit={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetailId(null)}
        date={date}
        api={api}
        onEdit={openEdit}
        onDelete={(h) => setToDelete(h)}
      />
      <HabitHistoryManager open={historyOpen} onOpenChange={setHistoryOpen} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thói quen “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Thói quen sẽ được chuyển vào thùng rác, bạn có thể khôi phục sau.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
