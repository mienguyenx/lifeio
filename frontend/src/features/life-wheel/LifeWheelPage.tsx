import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/brand/EmptyState';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { Fab, HeroBanner, MascotCard, Page, PageHeader, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LifeArea, LifeWheelScore } from '@/types/lifeos';
import { useLifeWheel } from './hooks/useLifeWheel';
import { DEFAULT_SCORES, DEFAULT_TARGETS, avgOf, balanceLabel, ranked } from './utils/wheel.utils';
import { WheelRadar } from './components/WheelRadar';
import { ScoreEditor } from './components/ScoreEditor';
import { WheelTrends } from './components/WheelTrends';
import { AreaGrid } from './components/AreaGrid';
import { WheelHistory } from './components/WheelHistory';
import { WheelSidePanel } from './components/WheelSidePanel';

type View = 'overview' | 'assess' | 'trends' | 'areas' | 'history';

export default function LifeWheelPage() {
  const isMobile = useIsMobile();
  const api = useLifeWheel();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [draft, setDraft] = useState<Record<LifeArea, number>>(DEFAULT_SCORES);
  const [viewed, setViewed] = useState<LifeWheelScore | null>(null);
  const [area, setArea] = useState<LifeArea | null>(null);
  const [del, setDel] = useState<LifeWheelScore | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const { latest, prev, avg, prevAvg, history } = api;

  const startAssess = () => { setDraft({ ...DEFAULT_SCORES, ...(latest?.scores ?? {}) }); setView('assess'); };
  useEffect(() => {
    if (params.has('add')) { startAssess(); params.delete('add'); setParams(params, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, setParams]);

  const shown = viewed ?? latest;
  const shownIdx = shown ? history.findIndex((h) => h.id === shown.id) : -1;
  const compare = shownIdx >= 0 ? history[shownIdx + 1] : undefined;
  const r = useMemo(() => (shown ? ranked(shown.scores) : []), [shown]);
  const delta = avg !== null && prevAvg !== null ? avg - prevAvg : null;
  const name = api.user?.name?.split(' ').slice(-1)[0] || 'bạn';
  const changed = latest ? Object.keys(draft).some((k) => draft[k as LifeArea] !== latest.scores[k as LifeArea]) : true;

  const noData = <EmptyState mascot="taro" pose="relax" title="Bắt đầu đánh giá bánh xe cuộc sống" description="Chấm điểm 10 lĩnh vực từ 1–10 để thấy bức tranh cân bằng của bạn." action={<Button className="rounded-full" onClick={startAssess}><Plus className="h-4 w-4 mr-1.5" />Đánh giá ngay</Button>} />;

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="taro" pose={avg !== null && avg >= 6.5 ? 'go' : 'care'} title={`Xin chào, ${name}! 👋`} subtitle={avg === null ? 'Hãy đánh giá 10 lĩnh vực để bắt đầu hành trình cân bằng.' : balanceLabel(avg)}
          action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={startAssess}><Plus className="h-4 w-4 mr-1.5" />Đánh giá mới</Button>} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/life-areas" tint="violet" value={avg === null ? '–' : avg.toFixed(1)} label="Điểm trung bình" hint="Trên 10" />
          <StatTile icon={<span className="text-[22px]">{latest ? r[0]?.icon : '🏆'}</span>} tint="mint" value={latest ? `${ranked(latest.scores)[0].score}` : '–'} label="Cao nhất" hint={latest ? ranked(latest.scores)[0].name : undefined} />
          <StatTile icon={<span className="text-[22px]">🎯</span>} tint="rose" value={latest ? `${ranked(latest.scores)[9].score}` : '–'} label="Thấp nhất" hint={latest ? ranked(latest.scores)[9].name : undefined} />
          <StatTile icon={<span className="text-[22px]">{delta === null ? '📊' : delta >= 0 ? '📈' : '📉'}</span>} tint="sky" value={delta === null ? '–' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`} label="So với lần trước" onClick={() => setView('trends')} />
        </div>
        {!shown ? noData : (
          <Surface className="p-4 md:p-5">
            <SectionTitle title={viewed && viewed.id !== latest?.id ? `Đánh giá ngày ${format(new Date(viewed.date), 'dd/MM/yyyy', { locale: vi })}` : 'Bánh xe hiện tại'}
              hint={compare ? 'Nét đứt: lần đánh giá trước' : undefined}
              action={viewed && viewed.id !== latest?.id ? <button onClick={() => setViewed(null)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary"><X className="h-3.5 w-3.5" />Về mới nhất</button> : undefined} />
            <WheelRadar scores={shown.scores} compare={compare?.scores} height={isMobile ? 320 : 400}
              center={<div className="text-center"><p className="text-[22px] font-extrabold tabular-nums">{avgOf(shown.scores).toFixed(1)}</p><p className="text-[10.5px] text-muted-foreground">Trung bình</p></div>} />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              {r.map((a) => {
                const d = compare ? a.score - (compare.scores[a.id] ?? 0) : 0;
                return (
                  <button key={a.id} onClick={() => { setArea(a.id); setView('areas'); }} className="flex items-center gap-2 rounded-2xl bg-secondary/50 px-2.5 py-2 text-left min-w-0 hover:bg-secondary">
                    <span>{a.icon}</span><span className="text-[12px] font-semibold truncate flex-1">{a.name}</span>
                    <span className="text-[12px] font-bold tabular-nums">{a.score}</span>
                    {d !== 0 && <span className={d > 0 ? 'text-[10.5px] font-semibold text-emerald-600' : 'text-[10.5px] font-semibold text-rose-500'}>{d > 0 ? `+${d}` : d}</span>}
                  </button>
                );
              })}
            </div>
          </Surface>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4"><WheelSidePanel api={api} /></aside>}
    </div>
  );

  const assess = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <Surface className="p-4 md:p-5 min-w-0">
        <SectionTitle title="Chấm điểm 10 lĩnh vực" hint="1 = rất không hài lòng · 10 = hoàn toàn hài lòng" />
        <ScoreEditor value={draft} onChange={setDraft} prev={latest?.scores} targets={DEFAULT_TARGETS} />
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="text-[12.5px] text-muted-foreground">Điểm TB mới: <b className="text-foreground tabular-nums">{avgOf(draft).toFixed(1)}</b>{avg !== null && <> · hiện tại {avg.toFixed(1)}</>}</p>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setView('overview')}>Hủy</Button>
            <Button className="rounded-full px-6" disabled={!changed} onClick={() => { api.save(draft); setViewed(null); setView('overview'); }}><Save className="h-4 w-4 mr-1.5" />Lưu đánh giá</Button>
          </div>
        </div>
      </Surface>
      <div className="space-y-4">
        <Surface className="p-4">
          <SectionTitle title="Xem trước" />
          <WheelRadar scores={draft} compare={latest?.scores} compareLabel="Hiện tại" height={280} />
        </Surface>
        <MascotCard mascot="taro" pose="care" quote="Hãy chấm điểm thật lòng — không có đúng sai, chỉ có hiểu mình hơn. 🌱" />
      </div>
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Bánh xe cuộc sống <ModuleHelpButton module="lifewheel" /></span>}
        subtitle="Đánh giá sự cân bằng giữa 10 lĩnh vực trong cuộc sống ⚖️"
        actions={!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={startAssess}><Plus className="h-4 w-4 mr-1.5" />Đánh giá mới</Button>}
      />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'assess', label: 'Đánh giá' }, { id: 'trends', label: 'Xu hướng' }, { id: 'areas', label: 'Lĩnh vực' }, { id: 'history', label: 'Lịch sử' }]}
          value={view} onChange={(v) => (v === 'assess' ? startAssess() : setView(v))} />
      </div>
      {view === 'overview' && overview}
      {view === 'assess' && assess}
      {view === 'trends' && (history.length ? <WheelTrends api={api} /> : noData)}
      {view === 'areas' && (
        <div className="space-y-5">
          <AreaGrid api={api} selected={area} onSelect={(a) => setArea(area === a ? null : a)} />
          {area ? <AreaDashboardSection area={area} /> : <p className="text-center text-[12.5px] text-muted-foreground">Chọn một lĩnh vực để xem mục tiêu, thói quen và công việc liên quan.</p>}
        </div>
      )}
      {view === 'history' && <WheelHistory history={history} onView={(s) => { setViewed(s); setView('overview'); }} onDelete={setDel} onClear={() => setClearOpen(true)} onNew={startAssess} />}
      {isMobile && view === 'overview' && <div className="mt-5"><WheelSidePanel api={api} /></div>}
      {isMobile && view !== 'assess' && <Fab onClick={startAssess} label="Đánh giá mới" />}

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bản ghi đánh giá?</AlertDialogTitle>
            <AlertDialogDescription>{del && `Đánh giá ngày ${format(new Date(del.date), 'dd/MM/yyyy')} (TB ${avgOf(del.scores).toFixed(1)}) sẽ bị xóa và không thể hoàn tác.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (del) { api.remove(del.id); if (viewed?.id === del.id) setViewed(null); } setDel(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa toàn bộ lịch sử?</AlertDialogTitle>
            <AlertDialogDescription>Tất cả bản ghi sẽ bị xóa, chỉ giữ lại lần đánh giá mới nhất. Không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { api.clear(); setViewed(null); setClearOpen(false); }}>Xóa lịch sử</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
