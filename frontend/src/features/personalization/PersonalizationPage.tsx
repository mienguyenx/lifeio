import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaTile, HeroBanner, MascotCard, Page, PageHeader, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls } from '@/components/lio/form';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import { AI_TONES, ARCHETYPES, PLANNING_STYLES } from '@/lib/personalizationOptions';
import type { LifeArea } from '@/types/lifeos';

const txt = (s: string) => <span className="block text-[15px] leading-tight whitespace-normal line-clamp-2">{s}</span>;
type View = 'style' | 'ai' | 'schedule' | 'areas' | 'display';
const REVIEW_DAYS: Record<string, string> = { '0': 'Chủ nhật', '1': 'Thứ hai', '5': 'Thứ sáu', '6': 'Thứ bảy' };

function OptionCard({ active, onClick, title, desc, emoji }: { active: boolean; onClick: () => void; title: string; desc: string; emoji?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-start gap-2.5 rounded-[18px] border p-3 text-left transition-all', active ? 'border-primary ring-4 ring-primary/10 bg-primary/5' : 'border-border/70 hover:border-primary/40')}>
      {emoji && <span className="h-9 w-9 rounded-xl bg-secondary grid place-items-center text-[18px] shrink-0">{emoji}</span>}
      <span className="min-w-0"><span className={cn('block text-[13.5px] font-bold', active && 'text-primary')}>{title}</span><span className="block text-[11.5px] text-muted-foreground leading-snug">{desc}</span></span>
    </button>
  );
}
function ToggleRow({ title, desc, checked, onChange, extra }: { title: string; desc: string; checked?: boolean; onChange: (v: boolean) => void; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="text-[13.5px] font-semibold">{title}</p><p className="text-[11.5px] text-muted-foreground">{desc}</p></div>
      <div className="flex items-center gap-2 shrink-0">{extra}<Switch checked={checked} onCheckedChange={onChange} /></div>
    </div>
  );
}

export default function PersonalizationPage() {
  const isMobile = useIsMobile();
  const prefs = useLifeOSStore((s) => s.userPreferences);
  const setUserPreferences = useLifeOSStore((s) => s.setUserPreferences);
  const [localPrefs, setLocalPrefs] = useState(prefs);
  const [touched, setTouched] = useState(false);
  // Đồng bộ khi preferences tải về muộn (sync Supabase) mà người dùng chưa chỉnh gì
  useEffect(() => { if (!touched) setLocalPrefs(prefs); }, [prefs, touched]);
  const [view, setView] = useState<View>('style');
  const dirty = JSON.stringify(localPrefs) !== JSON.stringify(prefs);

  const update = (partial: Partial<typeof localPrefs>) => { setTouched(true); setLocalPrefs((prev) => ({ ...prev, ...partial })); };
  const handleSave = () => { setUserPreferences(localPrefs); setTouched(false); toast.success('Đã lưu cài đặt cá nhân hóa!'); };
  const toggleAreaPriority = (area: LifeArea) => {
    const current = localPrefs.lifeAreaPriorities || [];
    update({ lifeAreaPriorities: current.includes(area) ? current.filter((a) => a !== area) : [...current, area] });
  };

  const arch = ARCHETYPES.find((a) => a.value === localPrefs.archetype);
  const tone = AI_TONES.find((t) => t.value === localPrefs.aiTone);
  const plan = PLANNING_STYLES.find((p) => p.value === localPrefs.planningStyle);
  const prio = localPrefs.lifeAreaPriorities || [];
  const saveBtn = <Button className="h-10 rounded-full px-5 shadow-soft" onClick={handleSave} disabled={!dirty}><Save className="h-4 w-4 mr-1.5" />{dirty ? 'Lưu thay đổi' : 'Đã lưu'}</Button>;

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Tóm tắt" />
        <div className="space-y-2 text-[12.5px]">
          {[['Phong cách', arch ? `${arch.emoji} ${arch.label}` : '—'], ['Giọng AI', tone?.label ?? '—'], ['Lập kế hoạch', plan?.label ?? '—'], ['Thức dậy · Ngủ', `${localPrefs.wakeUpTime || '07:00'} · ${localPrefs.sleepTime || '23:00'}`], ['Giờ vàng', `${localPrefs.energyPeakStart || '09:00'}–${localPrefs.energyPeakEnd || '12:00'}`], ['Review tuần', REVIEW_DAYS[String(localPrefs.preferredReviewDay ?? 0)] ?? '—']].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-right">{v}</span></div>
          ))}
        </div>
        {dirty && <Button className="w-full mt-3 rounded-full" onClick={handleSave}><Save className="h-4 w-4 mr-1.5" />Lưu thay đổi</Button>}
      </Surface>
      <MascotCard mascot="lumi" pose="happy" title="LifeOS của riêng bạn" quote="Tùy chỉnh để AI Coach và trang Hôm nay hợp với nhịp sống của bạn." />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Cá nhân hóa" subtitle="Tùy chỉnh LifeOS theo phong cách của bạn ✨" actions={!isMobile && saveBtn} />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs items={[{ id: 'style', label: 'Phong cách' }, { id: 'ai', label: 'AI Coach' }, { id: 'schedule', label: 'Lịch trình' }, { id: 'areas', label: 'Ưu tiên', count: prio.length }, { id: 'display', label: 'Hiển thị' }]} value={view} onChange={setView} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="lumi" pose="happy" title={arch ? `${arch.emoji} ${arch.label}` : 'Bạn là kiểu người nào?'} subtitle={arch?.desc ?? 'Chọn phong cách để LifeOS gợi ý phù hợp hơn.'} action={isMobile ? saveBtn : undefined} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<span className="text-[22px]">{arch?.emoji ?? '🌱'}</span>} tint="mint" value={txt(arch?.label ?? '—')} label="Phong cách" onClick={() => setView('style')} active={view === 'style'} />
            <StatTile icon="module/ai-coach" tint="violet" value={txt(tone?.label ?? '—')} label="Giọng AI" onClick={() => setView('ai')} active={view === 'ai'} />
            <StatTile icon="module/calendar" tint="sky" value={txt(plan?.label ?? '—')} label="Lập kế hoạch" onClick={() => setView('schedule')} active={view === 'schedule'} />
            <StatTile icon="module/life-areas" tint="orange" value={prio.length} label="Ưu tiên" hint="lĩnh vực" onClick={() => setView('areas')} active={view === 'areas'} />
          </div>

          {view === 'style' && (
            <Surface className="p-4 sm:p-5">
              <SectionTitle title="Phong cách sử dụng" hint="Giúp LifeOS gợi ý phù hợp" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ARCHETYPES.map((a) => <OptionCard key={a.value} active={localPrefs.archetype === a.value} onClick={() => update({ archetype: a.value })} title={a.label} desc={a.desc} emoji={a.emoji} />)}
              </div>
            </Surface>
          )}
          {view === 'ai' && (
            <Surface className="p-4 sm:p-5 space-y-4">
              <div>
                <SectionTitle title="Giọng điệu AI" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AI_TONES.map((t) => <OptionCard key={t.value} active={localPrefs.aiTone === t.value} onClick={() => update({ aiTone: t.value })} title={t.label} desc={t.desc} />)}
                </div>
              </div>
              <Field label="Trọng tâm coaching"><input className={fieldCls} placeholder="VD: productivity, health, balance..." value={localPrefs.coachingFocus || ''} onChange={(e) => update({ coachingFocus: e.target.value })} /></Field>
            </Surface>
          )}
          {view === 'schedule' && (
            <>
              <Surface className="p-4 sm:p-5">
                <SectionTitle title="Năng lượng & lịch trình" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="☀️ Giờ thức dậy"><input type="time" className={fieldCls} value={localPrefs.wakeUpTime || '07:00'} onChange={(e) => update({ wakeUpTime: e.target.value })} /></Field>
                  <Field label="🌙 Giờ đi ngủ"><input type="time" className={fieldCls} value={localPrefs.sleepTime || '23:00'} onChange={(e) => update({ sleepTime: e.target.value })} /></Field>
                  <Field label="⚡ Giờ vàng bắt đầu"><input type="time" className={fieldCls} value={localPrefs.energyPeakStart || '09:00'} onChange={(e) => update({ energyPeakStart: e.target.value })} /></Field>
                  <Field label="⚡ Giờ vàng kết thúc"><input type="time" className={fieldCls} value={localPrefs.energyPeakEnd || '12:00'} onChange={(e) => update({ energyPeakEnd: e.target.value })} /></Field>
                </div>
              </Surface>
              <Surface className="p-4 sm:p-5">
                <SectionTitle title="Phong cách lập kế hoạch" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PLANNING_STYLES.map((p) => <OptionCard key={p.value} active={localPrefs.planningStyle === p.value} onClick={() => update({ planningStyle: p.value })} title={p.label} desc={p.desc} />)}
                </div>
              </Surface>
            </>
          )}
          {view === 'areas' && (
            <Surface className="p-4 sm:p-5">
              <SectionTitle title="Ưu tiên lĩnh vực" hint="Chọn trước = quan trọng hơn" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LIFE_AREAS.map((area) => {
                  const idx = prio.indexOf(area.id);
                  return (
                    <button key={area.id} type="button" onClick={() => toggleAreaPriority(area.id)} className={cn('flex items-center gap-3 rounded-[18px] border p-2.5 text-left transition-all', idx >= 0 ? 'border-primary ring-4 ring-primary/10' : 'border-border/70 hover:border-primary/40')}>
                      <AreaTile area={area.id} size={38} />
                      <span className="flex-1 text-[13.5px] font-semibold">{area.name}</span>
                      {idx >= 0 ? <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold">{idx + 1}</span> : <span className="h-6 w-6 rounded-full border border-border" />}
                    </button>
                  );
                })}
              </div>
            </Surface>
          )}
          {view === 'display' && (
            <Surface className="p-4 sm:p-5">
              <SectionTitle title="Thông báo & hiển thị" />
              <div className="divide-y divide-border/50">
                <ToggleRow title="Check-in buổi sáng" desc="Hiện từ giờ dậy đến 11:00, nếu chưa làm" checked={localPrefs.morningCheckinEnabled} onChange={(v) => update({ morningCheckinEnabled: v })}
                  extra={<input type="time" className={cn(fieldCls, 'h-9 w-[104px] text-[13px]')} value={localPrefs.morningCheckinTime || '07:00'} onChange={(e) => update({ morningCheckinTime: e.target.value })} />} />
                <ToggleRow title="Review buổi tối" desc="Hiện từ 3 giờ trước giờ ngủ, nếu chưa làm" checked={localPrefs.eveningReviewEnabled} onChange={(v) => update({ eveningReviewEnabled: v })}
                  extra={<input type="time" className={cn(fieldCls, 'h-9 w-[104px] text-[13px]')} value={localPrefs.eveningReviewTime || '21:00'} onChange={(e) => update({ eveningReviewTime: e.target.value })} />} />
                <ToggleRow title="Thẻ trọng tâm hôm nay" desc="Hiện phần tóm tắt trọng tâm" checked={localPrefs.showTodayFocus} onChange={(v) => update({ showTodayFocus: v })} />
                <ToggleRow title="Gợi ý AI" desc="Hiện gợi ý AI trên trang Hôm nay" checked={localPrefs.showAISuggestions} onChange={(v) => update({ showAISuggestions: v })} />
                <ToggleRow title="Huy hiệu chuỗi" desc="Hiện huy hiệu chuỗi trên thói quen" checked={localPrefs.showStreaks} onChange={(v) => update({ showStreaks: v })} />
                <div className="flex items-center justify-between gap-3 py-3">
                  <div><p className="text-[13.5px] font-semibold">Ngày review tuần</p><p className="text-[11.5px] text-muted-foreground">Nhắc bạn review vào ngày này</p></div>
                  <Select value={String(localPrefs.preferredReviewDay ?? 0)} onValueChange={(v) => update({ preferredReviewDay: parseInt(v) })}>
                    <SelectTrigger className="h-9 w-[130px] rounded-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(REVIEW_DAYS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </Surface>
          )}
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
    </Page>
  );
}
