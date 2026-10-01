import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { Fab, HeroBanner, Page, PageHeader, PeriodNav, SegmentedTabs, StatTile } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import type { HealthLog } from '@/hooks/sync/useHealthSync';
import { useHealth, type HealthDraft } from './hooks/useHealth';
import { METRICS, dayKey, fmt, latest, metricOf, pctOf, streak, valueOn, type MetricDef, type MetricId } from './utils/health.utils';
import { DailyLog } from './components/DailyLog';
import { HealthTrends } from './components/HealthTrends';
import { HealthLogList } from './components/HealthLogList';
import { HealthLogModal } from './components/HealthLogModal';
import { HealthSidePanel } from './components/HealthSidePanel';

type View = 'overview' | 'log' | 'trends' | 'linked';

export default function HealthPage() {
  const isMobile = useIsMobile();
  const api = useHealth();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [day, setDay] = useState(dayKey(new Date()));
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; id?: string; initial: HealthDraft } | null>(null);
  const [toDelete, setToDelete] = useState<HealthLog | null>(null);
  const today = dayKey(new Date());

  const openCreate = (type: MetricId = 'water') => setForm({ mode: 'create', initial: { type, value: '', notes: '', date: day } });
  useEffect(() => {
    if (params.has('add')) { openCreate(); params.delete('add'); setParams(params, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, setParams]);

  const { logs } = api;
  const st = useMemo(() => streak(logs), [logs]);
  const targets = METRICS.filter((m) => m.target);
  const dayPct = Math.round(targets.reduce((a, m) => a + pctOf(m, valueOn(logs, m, day)), 0) / targets.length);
  const dayCount = logs.filter((l) => l.date === day).length;
  const weight = latest(logs, 'weight', day);
  const quick = (m: MetricDef, v: number) => api.add(m.id, v, day, undefined, `${v} ${m.unit} ${m.name.toLowerCase()}`);
  const submit = (d: HealthDraft) => {
    const v = parseFloat(d.value); if (Number.isNaN(v)) return;
    if (form?.mode === 'edit' && form.id) api.edit(form.id, d); else api.add(d.type, v, d.date, d.notes);
    setForm(null);
  };
  const edit = (l: HealthLog) => setForm({ mode: 'edit', id: l.id, initial: { type: l.type, value: String(l.value), notes: l.notes ?? '', date: l.date } });
  const dayLabel = day === today ? 'Hôm nay' : format(parseISO(day), 'EEEE, dd/MM', { locale: vi });

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="taro" pose="care" title={`Xin chào, ${api.user?.name?.split(' ').slice(-1)[0] || 'bạn'}! 🌿`}
          subtitle={st > 0 ? `Bạn đã ghi nhận sức khỏe ${st} ngày liên tiếp. Tiếp tục nhé!` : 'Ghi lại nước, giấc ngủ và vận động để theo dõi sức khỏe mỗi ngày.'}
          action={<PeriodNav label={dayLabel} onPrev={() => setDay(dayKey(subDays(parseISO(day), 1)))} onNext={() => setDay(dayKey(addDays(parseISO(day), 1)))} nextDisabled={day >= today} onReset={day !== today && !isMobile ? () => setDay(today) : undefined} />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon={<span className="text-[22px]">🎯</span>} tint="violet" value={`${dayPct}%`} label="Mục tiêu ngày" hint="4 chỉ số" />
          <StatTile icon={<span className="text-[22px]">📝</span>} tint="sky" value={dayCount} label="Lượt ghi nhận" hint={dayLabel} onClick={() => setView('log')} />
          <StatTile icon={<span className="text-[22px]">🔥</span>} tint="orange" value={st} label="Ngày liên tiếp" hint="Chuỗi ghi nhận" />
          <StatTile icon={<span className="text-[22px]">⚖️</span>} tint="amber" value={weight ? `${fmt(metricOf('weight'), weight.value)} kg` : '–'} label="Cân nặng" hint={weight ? `Ghi ngày ${format(parseISO(weight.date), 'dd/MM')}` : 'Chưa ghi nhận'} onClick={() => openCreate('weight')} />
        </div>
        <DailyLog logs={logs} day={day} onQuick={quick} onOpen={openCreate} />
        <HealthTrends logs={logs} compact />
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4"><HealthSidePanel api={api} day={day} /></aside>}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Sức khỏe <ModuleHelpButton module="health" /></span>}
        subtitle="Chăm sóc cơ thể và tâm trí mỗi ngày 🌿"
        actions={!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => openCreate()}><Plus className="h-4 w-4 mr-1.5" />Ghi nhận</Button>}
      />
      <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'log', label: 'Nhật ký' }, { id: 'trends', label: 'Xu hướng' }, { id: 'linked', label: 'Liên kết' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />
      {view === 'overview' && overview}
      {view === 'log' && <HealthLogList logs={api.sorted} onEdit={edit} onDelete={setToDelete} />}
      {view === 'trends' && <HealthTrends logs={logs} />}
      {view === 'linked' && <AreaDashboardSection area="health" />}
      {isMobile && view === 'overview' && <div className="mt-5"><HealthSidePanel api={api} day={day} /></div>}
      {isMobile && <Fab onClick={() => openCreate()} label="Ghi nhận" />}

      {form && <HealthLogModal open onOpenChange={(o) => !o && setForm(null)} mode={form.mode} initial={form.initial} onSubmit={submit} />}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ghi nhận này?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete && `${metricOf(toDelete.type).name}: ${toDelete.value} ${toDelete.unit} — ngày ${format(parseISO(toDelete.date), 'dd/MM/yyyy')}. Không thể hoàn tác.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) api.remove(toDelete.id); setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
