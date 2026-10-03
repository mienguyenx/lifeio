import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, Pencil, Plus, Quote, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { SegmentedTabs, Surface } from '@/components/lio';
import { Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { AreaModuleHistory } from '@/components/profile/AreaModuleHistory';
import { VisionValuesGuide } from '@/components/profile/VisionValuesGuide';
import { useProfileSync } from '@/hooks/sync/useProfileSync';
import { useVisionValuesSuggestions } from '@/hooks/useVisionValuesSuggestions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea, type LifeMilestone, type LifeRole, type LifeVision, type PersonalTrait, type PersonalValue } from '@/types/lifeos';
import { ImagePicker, Lightbox } from './ImagePicker';

type Tab = 'vision' | 'values' | 'roles' | 'traits' | 'milestones';
type Timeframe = NonNullable<LifeVision['timeframe']>;
const TF: { id: Timeframe; label: string; hint: string }[] = [
  { id: '1-year', label: '1 năm', hint: 'Điều cụ thể muốn đạt trong năm nay' },
  { id: '5-year', label: '5 năm', hint: 'Phiên bản của bạn sau 5 năm' },
  { id: '10-year', label: '10 năm', hint: 'Cuộc sống bạn hướng tới' },
  { id: 'lifetime', label: 'Cả đời', hint: 'Di sản bạn muốn để lại' },
];
const tfLabel = (t?: string) => TF.find((x) => x.id === t)?.label ?? 'Cả đời';
const EMOJI = ['⭐', '💪', '❤️', '🎯', '🔥', '💎', '🌟', '🚀', '💡', '🎨', '📚', '🏆', '🌱', '⚡', '🤝', '💼', '🧘', '🏠', '👨‍👩‍👧', '🕊️'];
const now = () => new Date().toISOString();

/** Nút hành động nhỏ trên thẻ (sửa / xoá / lịch sử). */
function CardActions({ onEdit, onDelete, history }: { onEdit: () => void; onDelete: () => void; history?: ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
      {history}
      <button type="button" onClick={onEdit} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground" aria-label="Sửa"><Pencil className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onDelete} className="h-8 w-8 grid place-items-center rounded-full hover:bg-destructive/10 text-destructive" aria-label="Xoá"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function AIButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="h-9 rounded-full gap-1.5" disabled={loading} onClick={onClick}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-primary" />}Gợi ý AI
    </Button>
  );
}

function Suggestions<T>({ items, render, onPick, onClose }: { items: T[]; render: (x: T) => ReactNode; onPick: (x: T, i: number) => void; onClose: () => void }) {
  if (!items.length) return null;
  return (
    <div className="rounded-[20px] bg-lavender/50 dark:bg-primary/10 p-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[12.5px] font-semibold text-primary">Gợi ý từ AI · nhấn để thêm</p>
        <button type="button" onClick={onClose} className="text-[12px] font-semibold text-muted-foreground">Ẩn</button>
      </div>
      {items.map((x, i) => (
        <button key={i} type="button" onClick={() => onPick(x, i)} className="w-full text-left rounded-2xl bg-card border border-border/60 p-3 text-[13px] hover:shadow-soft transition-shadow">{render(x)}</button>
      ))}
    </div>
  );
}

/** Tiêu đề khối: tiêu đề + mô tả xếp dọc, nút bên phải (không bị ép chữ trên mobile). */
function Head({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 flex-wrap">
      <div className="min-w-0"><h2 className="text-[15px] font-bold">{title}</h2>{hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}</div>
      {action}
    </div>
  );
}

const EmptyHint = ({ children }: { children: ReactNode }) => <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">{children}</p>;

export function VisionBoard() {
  const user = useLifeOSStore((s) => s.user);
  const setUser = useLifeOSStore((s) => s.setUser);
  const goals = useLifeOSStore((s) => s.goals);
  const sync = useProfileSync();
  const ai = useVisionValuesSuggestions();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('vision');
  const [zoom, setZoom] = useState<string | null>(null);

  const visions = useMemo(() => user.visions ?? [], [user.visions]);
  const values = useMemo(() => [...(user.personalValues ?? [])].sort((a, b) => a.priority - b.priority), [user.personalValues]);
  const roles = user.lifeRoles ?? [];
  const traits = user.traits ?? [];
  const milestones = useMemo(() => [...(user.milestones ?? [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [user.milestones]);
  const purposeImages = user.lifePurposeImages ?? [];

  // ── Mục đích sống ────────────────────────────────────────────
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [pText, setPText] = useState('');
  const [pImages, setPImages] = useState<string[]>([]);
  const [pSugg, setPSugg] = useState<string[]>([]);
  const openPurpose = () => { setPText(user.lifePurpose || ''); setPImages(purposeImages); setPurposeOpen(true); };
  const savePurpose = async (e: FormEvent) => {
    e.preventDefault();
    const next = { lifePurpose: pText.trim() || undefined, lifePurposeImages: pImages };
    setUser(next); setPurposeOpen(false);
    const ok = await sync.updateProfile(next);
    toast[ok ? 'success' : 'warning'](ok ? 'Đã lưu mục đích sống' : 'Đã lưu trên thiết bị — chưa đồng bộ được');
  };
  const suggestPurpose = async () => { const r = await ai.getPurposeSuggestions({ bio: user.bio }); if (r?.suggestions) setPSugg(r.suggestions); };

  // ── Tầm nhìn ────────────────────────────────────────────────
  const [vEdit, setVEdit] = useState<LifeVision | null | 'new'>(null);
  const [vForm, setVForm] = useState<{ statement: string; timeframe: Timeframe; images: string[] }>({ statement: '', timeframe: '5-year', images: [] });
  const [vSugg, setVSugg] = useState<{ statement: string; timeframe: string }[]>([]);
  const openVision = (v?: LifeVision, timeframe: Timeframe = '5-year') => {
    setVForm(v ? { statement: v.statement, timeframe: v.timeframe || '5-year', images: v.images || [] } : { statement: '', timeframe, images: [] });
    setVEdit(v ?? 'new');
  };
  const saveVision = async (draft: { statement: string; timeframe: Timeframe; images?: string[] }, prev?: LifeVision) => {
    const v: LifeVision = { id: prev?.id || crypto.randomUUID(), statement: draft.statement.trim(), timeframe: draft.timeframe, images: draft.images?.length ? draft.images : undefined, createdAt: prev?.createdAt || now(), updatedAt: now() };
    if (!(await sync.saveLifeVision(v))) { toast.error('Không thể lưu tầm nhìn. Vui lòng thử lại.'); return false; }
    setUser({ visions: prev ? visions.map((x) => (x.id === prev.id ? v : x)) : [...visions, v] });
    return true;
  };
  const submitVision = async (e: FormEvent) => {
    e.preventDefault();
    const prev = vEdit && vEdit !== 'new' ? vEdit : undefined;
    if (await saveVision(vForm, prev)) { setVEdit(null); toast.success(prev ? 'Đã cập nhật tầm nhìn' : 'Đã thêm tầm nhìn'); }
  };
  const delVision = async (v: LifeVision) => {
    if (!window.confirm('Xoá tầm nhìn này?')) return;
    if (await sync.deleteLifeVision(v.id)) { setUser({ visions: visions.filter((x) => x.id !== v.id) }); toast.success('Đã xoá tầm nhìn'); } else toast.error('Không thể xoá. Vui lòng thử lại.');
  };

  // ── Giá trị sống ────────────────────────────────────────────
  const [valEdit, setValEdit] = useState<PersonalValue | null | 'new'>(null);
  const [valForm, setValForm] = useState<{ name: string; description: string; priority: 1 | 2 | 3 | 4 | 5; icon: string }>({ name: '', description: '', priority: 3, icon: '⭐' });
  const [valSugg, setValSugg] = useState<{ name: string; description: string; icon: string }[]>([]);
  const openValue = (v?: PersonalValue) => { setValForm(v ? { name: v.name, description: v.description || '', priority: v.priority, icon: v.icon || '⭐' } : { name: '', description: '', priority: Math.min(5, values.length + 1) as 1, icon: '⭐' }); setValEdit(v ?? 'new'); };
  const saveValue = async (d: typeof valForm, prev?: PersonalValue) => {
    const v: PersonalValue = { id: prev?.id || crypto.randomUUID(), name: d.name.trim(), description: d.description.trim() || undefined, priority: d.priority, icon: d.icon, createdAt: prev?.createdAt || now() };
    if (!(await sync.savePersonalValue(v))) { toast.error('Không thể lưu giá trị. Vui lòng thử lại.'); return false; }
    setUser({ personalValues: (prev ? values.map((x) => (x.id === prev.id ? v : x)) : [...values, v]).sort((a, b) => a.priority - b.priority) });
    return true;
  };
  const submitValue = async (e: FormEvent) => { e.preventDefault(); const prev = valEdit && valEdit !== 'new' ? valEdit : undefined; if (await saveValue(valForm, prev)) { setValEdit(null); toast.success(prev ? 'Đã cập nhật giá trị' : 'Đã thêm giá trị'); } };
  const delValue = async (v: PersonalValue) => {
    if (!window.confirm(`Xoá giá trị “${v.name}”?`)) return;
    if (await sync.deletePersonalValue(v.id)) { setUser({ personalValues: values.filter((x) => x.id !== v.id) }); toast.success('Đã xoá giá trị'); } else toast.error('Không thể xoá. Vui lòng thử lại.');
  };

  // ── Vai trò ─────────────────────────────────────────────────
  const [rEdit, setREdit] = useState<LifeRole | null | 'new'>(null);
  const [rForm, setRForm] = useState({ name: '', description: '', icon: '👤', linkedGoalIds: [] as string[] });
  const [rSugg, setRSugg] = useState<{ name: string; description: string; icon: string }[]>([]);
  const openRole = (r?: LifeRole) => { setRForm(r ? { name: r.name, description: r.description || '', icon: r.icon || '👤', linkedGoalIds: r.linkedGoalIds || [] } : { name: '', description: '', icon: '👤', linkedGoalIds: [] }); setREdit(r ?? 'new'); };
  const saveRole = async (d: typeof rForm, prev?: LifeRole) => {
    const r: LifeRole = { id: prev?.id || crypto.randomUUID(), name: d.name.trim(), description: d.description.trim() || undefined, icon: d.icon, linkedGoalIds: d.linkedGoalIds, isActive: prev?.isActive ?? true, createdAt: prev?.createdAt || now() };
    if (!(await sync.saveLifeRole(r))) { toast.error('Không thể lưu vai trò. Vui lòng thử lại.'); return false; }
    setUser({ lifeRoles: prev ? roles.map((x) => (x.id === prev.id ? r : x)) : [...roles, r] });
    return true;
  };
  const submitRole = async (e: FormEvent) => { e.preventDefault(); const prev = rEdit && rEdit !== 'new' ? rEdit : undefined; if (await saveRole(rForm, prev)) { setREdit(null); toast.success(prev ? 'Đã cập nhật vai trò' : 'Đã thêm vai trò'); } };
  const delRole = async (r: LifeRole) => {
    if (!window.confirm(`Xoá vai trò “${r.name}”?`)) return;
    if (await sync.deleteLifeRole(r.id)) { setUser({ lifeRoles: roles.filter((x) => x.id !== r.id) }); toast.success('Đã xoá vai trò'); } else toast.error('Không thể xoá. Vui lòng thử lại.');
  };

  // ── Điểm mạnh / cần cải thiện ───────────────────────────────
  const [tEdit, setTEdit] = useState<PersonalTrait | null | 'new'>(null);
  const [tForm, setTForm] = useState<{ name: string; description: string; type: 'strength' | 'weakness' }>({ name: '', description: '', type: 'strength' });
  const [tSugg, setTSugg] = useState<{ name: string; description: string; type: 'strength' | 'weakness' }[]>([]);
  const openTrait = (t?: PersonalTrait, type: 'strength' | 'weakness' = 'strength') => { setTForm(t ? { name: t.name, description: t.description || '', type: t.type } : { name: '', description: '', type }); setTEdit(t ?? 'new'); };
  const saveTrait = async (d: typeof tForm, prev?: PersonalTrait) => {
    const t: PersonalTrait = { id: prev?.id || crypto.randomUUID(), name: d.name.trim(), description: d.description.trim() || undefined, type: d.type, createdAt: prev?.createdAt || now() };
    if (!(await sync.savePersonalTrait(t))) { toast.error('Không thể lưu. Vui lòng thử lại.'); return false; }
    setUser({ traits: prev ? traits.map((x) => (x.id === prev.id ? t : x)) : [...traits, t] });
    return true;
  };
  const submitTrait = async (e: FormEvent) => { e.preventDefault(); const prev = tEdit && tEdit !== 'new' ? tEdit : undefined; if (await saveTrait(tForm, prev)) { setTEdit(null); toast.success('Đã lưu'); } };
  const delTrait = async (t: PersonalTrait) => {
    if (!window.confirm(`Xoá “${t.name}”?`)) return;
    if (await sync.deletePersonalTrait(t.id)) { setUser({ traits: traits.filter((x) => x.id !== t.id) }); toast.success('Đã xoá'); } else toast.error('Không thể xoá. Vui lòng thử lại.');
  };

  // ── Cột mốc cuộc đời ────────────────────────────────────────
  const [mEdit, setMEdit] = useState<LifeMilestone | null | 'new'>(null);
  const [mForm, setMForm] = useState<{ title: string; description: string; date: string; area?: LifeArea }>({ title: '', description: '', date: '' });
  const [mSugg, setMSugg] = useState<{ title: string; description: string; area: string }[]>([]);
  const openMilestone = (m?: LifeMilestone) => { setMForm(m ? { title: m.title, description: m.description || '', date: m.date, area: m.area } : { title: '', description: '', date: new Date().toISOString().slice(0, 10) }); setMEdit(m ?? 'new'); };
  const saveMilestone = async (d: typeof mForm, prev?: LifeMilestone) => {
    const m: LifeMilestone = { id: prev?.id || crypto.randomUUID(), title: d.title.trim(), description: d.description.trim() || undefined, date: d.date, area: d.area, createdAt: prev?.createdAt || now() };
    if (!(await sync.saveLifeMilestone(m))) { toast.error('Không thể lưu cột mốc. Vui lòng thử lại.'); return false; }
    setUser({ milestones: prev ? milestones.map((x) => (x.id === prev.id ? m : x)) : [...milestones, m] });
    return true;
  };
  const submitMilestone = async (e: FormEvent) => { e.preventDefault(); const prev = mEdit && mEdit !== 'new' ? mEdit : undefined; if (await saveMilestone(mForm, prev)) { setMEdit(null); toast.success(prev ? 'Đã cập nhật cột mốc' : 'Đã thêm cột mốc'); } };
  const delMilestone = async (m: LifeMilestone) => {
    if (!window.confirm(`Xoá cột mốc “${m.title}”?`)) return;
    if (await sync.deleteLifeMilestone(m.id)) { setUser({ milestones: milestones.filter((x) => x.id !== m.id) }); toast.success('Đã xoá cột mốc'); } else toast.error('Không thể xoá. Vui lòng thử lại.');
  };

  const filled = [!!user.lifePurpose, visions.length > 0, values.length > 0, roles.length > 0, traits.length > 0, milestones.length > 0].filter(Boolean).length;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'vision', label: `Tầm nhìn${visions.length ? ` ${visions.length}` : ''}` },
    { id: 'values', label: `Giá trị${values.length ? ` ${values.length}` : ''}` },
    { id: 'roles', label: `Vai trò${roles.length ? ` ${roles.length}` : ''}` },
    { id: 'traits', label: isMobile ? 'Bản thân' : `Điểm mạnh${traits.length ? ` ${traits.length}` : ''}` },
    { id: 'milestones', label: isMobile ? 'Cột mốc' : `Cột mốc${milestones.length ? ` ${milestones.length}` : ''}` },
  ];
  const cover = purposeImages[0];

  return (
    <div className="space-y-4 max-w-[1080px]">
      {/* Mục đích sống — hero có ảnh bìa */}
      <div className={cn('relative overflow-hidden rounded-[26px] border border-border/40 min-h-[190px] flex flex-col justify-end', cover ? 'text-white' : 'bg-gradient-to-br from-[#EFEBFF] via-[#F6F1FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-[#F2557A]/10')}>
        {cover && <>
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        </>}
        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold', cover ? 'bg-white/20 backdrop-blur' : 'bg-card/80 text-primary')}>✨ Mục đích sống · {filled}/6 phần</span>
            <div className={cn('flex items-center gap-1', !cover && '[&_button]:bg-card/80')}><VisionValuesGuide /></div>
          </div>
          <Quote className={cn('h-6 w-6 mb-1', cover ? 'text-white/70' : 'text-primary/50')} />
          <p className={cn('text-[19px] sm:text-[22px] font-bold leading-snug max-w-[760px]', !user.lifePurpose && (cover ? 'text-white/80' : 'text-muted-foreground'))}>
            {user.lifePurpose || 'Bạn sống vì điều gì? Viết một câu ngắn về mục đích sống của bạn.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-9 rounded-full gap-1.5 shadow-soft" onClick={openPurpose}><Pencil className="h-3.5 w-3.5" />{user.lifePurpose ? 'Chỉnh sửa' : 'Viết mục đích'}</Button>
            {purposeImages.length > 1 && (
              <div className="flex -space-x-2">
                {purposeImages.slice(1, 4).map((src, i) => <button key={i} onClick={() => setZoom(src)} className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow"><img src={src} alt="" className="h-full w-full object-cover" /></button>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <SegmentedTabs items={tabs} value={tab} onChange={setTab} full={isMobile} size={isMobile ? 'sm' : 'md'} />

      {tab === 'vision' && (
        <Surface className="p-4 sm:p-5 space-y-4">
          <Head title="Bảng tầm nhìn" hint="Hình dung tương lai bằng lời & hình ảnh"
            action={<div className="flex gap-2"><AIButton loading={ai.loading === 'vision'} onClick={async () => { const r = await ai.getVisionSuggestions({ purpose: user.lifePurpose }); if (r?.suggestions) setVSugg(r.suggestions); }} /><Button size="sm" className="h-9 rounded-full gap-1" onClick={() => openVision()}><Plus className="h-4 w-4" />Thêm</Button></div>} />
          <Suggestions items={vSugg} onClose={() => setVSugg([])} render={(s) => <><span className="text-[11px] font-bold text-primary">{tfLabel(s.timeframe)}</span><span className="block">{s.statement}</span></>}
            onPick={async (s, i) => { if (await saveVision({ statement: s.statement, timeframe: (TF.some((t) => t.id === s.timeframe) ? s.timeframe : '5-year') as Timeframe })) { setVSugg((p) => p.filter((_, j) => j !== i)); toast.success('Đã thêm tầm nhìn'); } }} />
          <div className="space-y-5">
            {TF.map((t) => {
              const list = visions.filter((v) => (v.timeframe || 'lifetime') === t.id);
              return (
                <section key={t.id}>
                  <div className="flex items-baseline justify-between mb-2 px-0.5">
                    <h3 className="text-[13.5px] font-bold">{t.label} <span className="font-medium text-muted-foreground text-[12px]">· {t.hint}</span></h3>
                    {list.length > 0 && <button onClick={() => openVision(undefined, t.id)} className="text-[12px] font-semibold text-primary">+ Thêm</button>}
                  </div>
                  {list.length === 0 ? (
                    <button onClick={() => openVision(undefined, t.id)} className="w-full rounded-2xl border border-dashed border-border px-4 py-4 text-left text-[13px] text-muted-foreground hover:border-primary/40 hover:text-foreground">+ Viết tầm nhìn {t.label.toLowerCase()} (có thể thêm ảnh minh hoạ)</button>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((v) => (
                        <article key={v.id} className="group rounded-[20px] border border-border/60 bg-card overflow-hidden shadow-soft">
                          {v.images?.[0] && (
                            <button type="button" onClick={() => setZoom(v.images![0])} className="block w-full relative">
                              <img src={v.images[0]} alt="" className="w-full aspect-[16/9] object-cover" />
                              {v.images.length > 1 && <span className="absolute right-2 bottom-2 rounded-full bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5">+{v.images.length - 1} ảnh</span>}
                            </button>
                          )}
                          <div className="p-3.5 flex items-start gap-2">
                            <p className="flex-1 min-w-0 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{v.statement}</p>
                            <CardActions onEdit={() => openVision(v)} onDelete={() => delVision(v)} history={<AreaModuleHistory triggerVariant="icon" moduleType="visions" entityId={v.id} entityName={v.statement.slice(0, 30)} />} />
                          </div>
                          {(v.images?.length ?? 0) > 1 && (
                            <div className="px-3.5 pb-3.5 flex gap-1.5">{v.images!.slice(1, 5).map((src, i) => <button key={i} onClick={() => setZoom(src)} className="h-12 w-12 rounded-lg overflow-hidden"><img src={src} alt="" className="h-full w-full object-cover" /></button>)}</div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </Surface>
      )}

      {tab === 'values' && (
        <Surface className="p-4 sm:p-5 space-y-3">
          <Head title="Giá trị cốt lõi" hint="Xếp theo mức ưu tiên — nên giữ 3–5 giá trị"
            action={<div className="flex gap-2"><AIButton loading={ai.loading === 'values'} onClick={async () => { const r = await ai.getValueSuggestions({ purpose: user.lifePurpose }); if (r?.suggestions) setValSugg(r.suggestions); }} /><Button size="sm" className="h-9 rounded-full gap-1" onClick={() => openValue()}><Plus className="h-4 w-4" />Thêm</Button></div>} />
          <Suggestions items={valSugg} onClose={() => setValSugg([])} render={(s) => <><span className="font-semibold">{s.icon} {s.name}</span><span className="block text-muted-foreground text-[12.5px]">{s.description}</span></>}
            onPick={async (s, i) => { if (await saveValue({ name: s.name, description: s.description, icon: s.icon || '⭐', priority: Math.min(5, values.length + 1) as 1 })) { setValSugg((p) => p.filter((_, j) => j !== i)); toast.success('Đã thêm giá trị'); } }} />
          {values.length === 0 ? <EmptyHint>Giá trị sống là la bàn cho mọi quyết định. Thêm 3–5 điều quan trọng nhất với bạn.</EmptyHint> : (
            <div className="space-y-2">
              {values.map((v, i) => (
                <div key={v.id} className="group flex items-center gap-3 rounded-[18px] border border-border/60 bg-card p-3">
                  <span className="w-5 text-center text-[12px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="h-11 w-11 rounded-[14px] bg-lavender dark:bg-primary/15 grid place-items-center text-[20px] shrink-0">{v.icon || '⭐'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate">{v.name}</p>
                    {v.description && <p className="text-[12px] text-muted-foreground line-clamp-2">{v.description}</p>}
                  </div>
                  <CardActions onEdit={() => openValue(v)} onDelete={() => delValue(v)} history={<AreaModuleHistory triggerVariant="icon" moduleType="personalValues" entityId={v.id} entityName={v.name} />} />
                </div>
              ))}
            </div>
          )}
        </Surface>
      )}

      {tab === 'roles' && (
        <Surface className="p-4 sm:p-5 space-y-3">
          <Head title="Vai trò trong cuộc sống" hint="Con, bạn đời, người lãnh đạo…"
            action={<div className="flex gap-2"><AIButton loading={ai.loading === 'roles'} onClick={async () => { const r = await ai.getRoleSuggestions({ bio: user.bio }); if (r?.suggestions) setRSugg(r.suggestions); }} /><Button size="sm" className="h-9 rounded-full gap-1" onClick={() => openRole()}><Plus className="h-4 w-4" />Thêm</Button></div>} />
          <Suggestions items={rSugg} onClose={() => setRSugg([])} render={(s) => <><span className="font-semibold">{s.icon} {s.name}</span><span className="block text-muted-foreground text-[12.5px]">{s.description}</span></>}
            onPick={async (s, i) => { if (await saveRole({ name: s.name, description: s.description, icon: s.icon || '👤', linkedGoalIds: [] })) { setRSugg((p) => p.filter((_, j) => j !== i)); toast.success('Đã thêm vai trò'); } }} />
          {roles.length === 0 ? <EmptyHint>Liệt kê các vai trò quan trọng để cân bằng thời gian & mục tiêu cho từng vai.</EmptyHint> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((r) => {
                const linked = goals.filter((g) => r.linkedGoalIds?.includes(g.id) && !g.deletedAt);
                return (
                  <div key={r.id} className="group rounded-[18px] border border-border/60 bg-card p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="h-11 w-11 rounded-[14px] bg-[#FFF1E8] dark:bg-[#FF9B63]/15 grid place-items-center text-[20px] shrink-0">{r.icon || '👤'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate">{r.name}</p>
                        {r.description && <p className="text-[12px] text-muted-foreground line-clamp-2">{r.description}</p>}
                      </div>
                      <CardActions onEdit={() => openRole(r)} onDelete={() => delRole(r)} history={<AreaModuleHistory triggerVariant="icon" moduleType="lifeRoles" entityId={r.id} entityName={r.name} />} />
                    </div>
                    {linked.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{linked.map((g) => <span key={g.id} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11.5px] font-medium">🎯 {g.title}</span>)}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </Surface>
      )}

      {tab === 'traits' && (
        <Surface className="p-4 sm:p-5 space-y-3">
          <Head title="Hiểu bản thân" hint="Điểm mạnh để phát huy, điểm cần cải thiện"
            action={<AIButton loading={ai.loading === 'traits'} onClick={async () => { const r = await ai.getTraitSuggestions(); if (r) setTSugg([...(r.strengths || []).map((x) => ({ ...x, type: 'strength' as const })), ...(r.weaknesses || []).map((x) => ({ ...x, type: 'weakness' as const }))]); }} />} />
          <Suggestions items={tSugg} onClose={() => setTSugg([])} render={(s) => <><span className="text-[11px] font-bold" style={{ color: s.type === 'strength' ? '#22B07D' : '#E8961C' }}>{s.type === 'strength' ? 'Điểm mạnh' : 'Cần cải thiện'}</span><span className="block font-semibold">{s.name}</span><span className="block text-muted-foreground text-[12.5px]">{s.description}</span></>}
            onPick={async (s, i) => { if (await saveTrait(s)) { setTSugg((p) => p.filter((_, j) => j !== i)); toast.success('Đã thêm'); } }} />
          <div className="grid gap-4 sm:grid-cols-2">
            {(['strength', 'weakness'] as const).map((type) => {
              const list = traits.filter((t) => t.type === type);
              return (
                <section key={type} className={cn('rounded-[20px] p-3', type === 'strength' ? 'bg-[#E6F8F1]/60 dark:bg-[#57D3AE]/10' : 'bg-[#FFF6D9]/60 dark:bg-[#FFC63D]/10')}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-[13.5px] font-bold">{type === 'strength' ? '💪 Điểm mạnh' : '🌱 Cần cải thiện'} <span className="text-muted-foreground font-medium">{list.length}</span></h3>
                    <button onClick={() => openTrait(undefined, type)} className="text-[12px] font-semibold text-primary">+ Thêm</button>
                  </div>
                  {list.length === 0 ? <p className="px-1 py-2 text-[12.5px] text-muted-foreground">Chưa có.</p> : (
                    <div className="space-y-1.5">
                      {list.map((t) => (
                        <div key={t.id} className="group flex items-start gap-2 rounded-2xl bg-card p-2.5 pl-3">
                          <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold">{t.name}</p>{t.description && <p className="text-[12px] text-muted-foreground">{t.description}</p>}</div>
                          <CardActions onEdit={() => openTrait(t)} onDelete={() => delTrait(t)} history={<AreaModuleHistory triggerVariant="icon" moduleType="traits" entityId={t.id} entityName={t.name} />} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </Surface>
      )}

      {tab === 'milestones' && (
        <Surface className="p-4 sm:p-5 space-y-3">
          <Head title="Cột mốc cuộc đời" hint="Những dấu mốc đã qua & sắp tới"
            action={<div className="flex gap-2"><AIButton loading={ai.loading === 'milestone'} onClick={async () => { const r = await ai.getMilestoneSuggestions(); if (r?.suggestions) setMSugg(r.suggestions); }} /><Button size="sm" className="h-9 rounded-full gap-1" onClick={() => openMilestone()}><Plus className="h-4 w-4" />Thêm</Button></div>} />
          <Suggestions items={mSugg} onClose={() => setMSugg([])} render={(s) => <><span className="font-semibold">{s.title}</span><span className="block text-muted-foreground text-[12.5px]">{s.description}</span></>}
            onPick={(s, i) => { setMSugg((p) => p.filter((_, j) => j !== i)); setMForm({ title: s.title, description: s.description, date: '', area: LIFE_AREAS.some((a) => a.id === s.area) ? (s.area as LifeArea) : undefined }); setMEdit('new'); }} />
          {milestones.length === 0 ? <EmptyHint>Ghi lại tốt nghiệp, công việc đầu tiên, kết hôn… hoặc cột mốc bạn muốn đạt.</EmptyHint> : (
            <ol className="relative ml-2 border-l-2 border-border/70 space-y-3">
              {milestones.map((m) => {
                const area = LIFE_AREAS.find((a) => a.id === m.area); const future = m.date > new Date().toISOString().slice(0, 10);
                return (
                  <li key={m.id} className="group relative pl-5">
                    <span className={cn('absolute -left-[9px] top-3 h-4 w-4 rounded-full border-[3px] border-card', future ? 'bg-[#FFC63D]' : 'bg-primary')} />
                    <div className="flex items-start gap-2 rounded-[18px] border border-border/60 bg-card p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-semibold text-muted-foreground">{m.date ? new Date(m.date).toLocaleDateString('vi-VN') : 'Chưa đặt ngày'}{future ? ' · sắp tới' : ''}{area ? ` · ${area.icon} ${area.name}` : ''}</p>
                        <p className="text-[14px] font-semibold">{m.title}</p>
                        {m.description && <p className="text-[12.5px] text-muted-foreground">{m.description}</p>}
                      </div>
                      <CardActions onEdit={() => openMilestone(m)} onDelete={() => delMilestone(m)} history={<AreaModuleHistory triggerVariant="icon" moduleType="milestones" entityId={m.id} entityName={m.title} />} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Surface>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      <AdaptiveModal open={purposeOpen} onOpenChange={setPurposeOpen} title="Mục đích sống" className="sm:max-w-[560px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={savePurpose} className="space-y-4 min-w-0">
          <Field label="Một câu về lý do bạn sống & cống hiến" hint={<AIButton loading={ai.loading === 'purpose'} onClick={suggestPurpose} />}>
            <textarea rows={4} value={pText} onChange={(e) => setPText(e.target.value)} placeholder="VD: Sống khoẻ mạnh, yêu thương gia đình và giúp 1.000 người học tập tốt hơn." className={cn(areaCls, 'text-[16px] sm:text-[14px]')} />
          </Field>
          {pSugg.length > 0 && (
            <div className="space-y-1.5">
              {pSugg.map((s, i) => <button key={i} type="button" onClick={() => setPText(s)} className="w-full text-left rounded-2xl bg-lavender/50 dark:bg-primary/10 p-3 text-[13px]">“{s}”</button>)}
            </div>
          )}
          <Field label="Ảnh truyền cảm hứng" hint={<span className="text-[11.5px] text-muted-foreground">Ảnh đầu tiên làm ảnh bìa</span>}>
            <ImagePicker value={pImages} onChange={setPImages} max={4} />
          </Field>
          <FormActions onCancel={() => setPurposeOpen(false)} />
        </form>
      </AdaptiveModal>

      <AdaptiveModal open={!!vEdit} onOpenChange={(o) => !o && setVEdit(null)} title={vEdit && vEdit !== 'new' ? 'Sửa tầm nhìn' : 'Thêm tầm nhìn'} className="sm:max-w-[560px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={submitVision} className="space-y-4 min-w-0">
          <Field label="Khung thời gian"><SegmentedTabs size="sm" full items={TF.map((t) => ({ id: t.id, label: t.label }))} value={vForm.timeframe} onChange={(v) => setVForm((f) => ({ ...f, timeframe: v }))} /></Field>
          <Field label="Tầm nhìn" hint={<span className="text-[11.5px] text-muted-foreground">Viết ở thì hiện tại, cụ thể</span>}>
            <textarea rows={4} autoFocus={!isMobile} value={vForm.statement} onChange={(e) => setVForm((f) => ({ ...f, statement: e.target.value }))} placeholder="VD: Tôi sống trong căn nhà nhỏ có vườn, làm việc từ xa và chạy marathon mỗi năm." className={cn(areaCls, 'text-[16px] sm:text-[14px]')} />
          </Field>
          <Field label="Ảnh minh hoạ (vision board)" hint={<span className="text-[11.5px] text-muted-foreground">Tối đa 4 ảnh</span>}>
            <ImagePicker value={vForm.images} onChange={(images) => setVForm((f) => ({ ...f, images }))} max={4} />
          </Field>
          <FormActions onCancel={() => setVEdit(null)} disabled={!vForm.statement.trim()} />
        </form>
      </AdaptiveModal>

      <AdaptiveModal open={!!valEdit} onOpenChange={(o) => !o && setValEdit(null)} title={valEdit && valEdit !== 'new' ? 'Sửa giá trị' : 'Thêm giá trị'} className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={submitValue} className="space-y-4 min-w-0">
          <Field label="Tên giá trị"><input autoFocus={!isMobile} value={valForm.name} onChange={(e) => setValForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Gia đình, Tự do, Chính trực" className={cn(fieldCls, 'text-[16px] sm:text-[14px]')} /></Field>
          <Field label="Ý nghĩa với bạn"><textarea rows={2} value={valForm.description} onChange={(e) => setValForm((f) => ({ ...f, description: e.target.value }))} placeholder="Vì sao giá trị này quan trọng?" className={cn(areaCls, 'text-[16px] sm:text-[14px]')} /></Field>
          <Field label="Biểu tượng">
            <div className="flex flex-wrap gap-1.5">{EMOJI.map((e) => <button key={e} type="button" onClick={() => setValForm((f) => ({ ...f, icon: e }))} className={cn('h-10 w-10 rounded-xl text-[18px] grid place-items-center border', valForm.icon === e ? 'border-primary ring-4 ring-primary/10' : 'border-transparent bg-secondary/60')}>{e}</button>)}</div>
          </Field>
          <Field label="Mức ưu tiên (1 = quan trọng nhất)"><SegmentedTabs size="sm" full items={[1, 2, 3, 4, 5].map((n) => ({ id: String(n), label: String(n) }))} value={String(valForm.priority)} onChange={(v) => setValForm((f) => ({ ...f, priority: Number(v) as 1 }))} /></Field>
          <FormActions onCancel={() => setValEdit(null)} disabled={!valForm.name.trim()} />
        </form>
      </AdaptiveModal>

      <AdaptiveModal open={!!rEdit} onOpenChange={(o) => !o && setREdit(null)} title={rEdit && rEdit !== 'new' ? 'Sửa vai trò' : 'Thêm vai trò'} className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={submitRole} className="space-y-4 min-w-0">
          <div className="grid grid-cols-[64px_1fr] gap-2">
            <Field label="Icon"><input value={rForm.icon} onChange={(e) => setRForm((f) => ({ ...f, icon: e.target.value.slice(0, 4) }))} className={cn(fieldCls, 'text-center text-[20px]')} /></Field>
            <Field label="Tên vai trò"><input autoFocus={!isMobile} value={rForm.name} onChange={(e) => setRForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Người cha, Trưởng nhóm" className={cn(fieldCls, 'text-[16px] sm:text-[14px]')} /></Field>
          </div>
          <Field label="Mô tả"><textarea rows={2} value={rForm.description} onChange={(e) => setRForm((f) => ({ ...f, description: e.target.value }))} placeholder="Bạn muốn thể hiện vai trò này thế nào?" className={cn(areaCls, 'text-[16px] sm:text-[14px]')} /></Field>
          {goals.filter((g) => !g.deletedAt).length > 0 && (
            <Field label="Mục tiêu liên quan">
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">{goals.filter((g) => !g.deletedAt).map((g) => {
                const on = rForm.linkedGoalIds.includes(g.id);
                return <button key={g.id} type="button" onClick={() => setRForm((f) => ({ ...f, linkedGoalIds: on ? f.linkedGoalIds.filter((x) => x !== g.id) : [...f.linkedGoalIds, g.id] }))} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold border', on ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border/70 text-muted-foreground')}>{g.title}</button>;
              })}</div>
            </Field>
          )}
          <FormActions onCancel={() => setREdit(null)} disabled={!rForm.name.trim()} />
        </form>
      </AdaptiveModal>

      <AdaptiveModal open={!!tEdit} onOpenChange={(o) => !o && setTEdit(null)} title={tEdit && tEdit !== 'new' ? 'Sửa đặc điểm' : 'Thêm đặc điểm'} className="sm:max-w-[480px] rounded-[28px]">
        <form onSubmit={submitTrait} className="space-y-4 min-w-0">
          <Field label="Loại"><SegmentedTabs size="sm" full items={[{ id: 'strength', label: '💪 Điểm mạnh' }, { id: 'weakness', label: '🌱 Cần cải thiện' }]} value={tForm.type} onChange={(v) => setTForm((f) => ({ ...f, type: v as 'strength' }))} /></Field>
          <Field label="Tên"><input autoFocus={!isMobile} value={tForm.name} onChange={(e) => setTForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Kiên nhẫn" className={cn(fieldCls, 'text-[16px] sm:text-[14px]')} /></Field>
          <Field label="Ghi chú"><textarea rows={2} value={tForm.description} onChange={(e) => setTForm((f) => ({ ...f, description: e.target.value }))} className={cn(areaCls, 'text-[16px] sm:text-[14px]')} /></Field>
          <FormActions onCancel={() => setTEdit(null)} disabled={!tForm.name.trim()} />
        </form>
      </AdaptiveModal>

      <AdaptiveModal open={!!mEdit} onOpenChange={(o) => !o && setMEdit(null)} title={mEdit && mEdit !== 'new' ? 'Sửa cột mốc' : 'Thêm cột mốc'} className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={submitMilestone} className="space-y-4 min-w-0">
          <Field label="Cột mốc"><input autoFocus={!isMobile} value={mForm.title} onChange={(e) => setMForm((f) => ({ ...f, title: e.target.value }))} placeholder="VD: Tốt nghiệp đại học" className={cn(fieldCls, 'text-[16px] sm:text-[14px]')} /></Field>
          <Field label="Ngày"><input type="date" value={mForm.date} onChange={(e) => setMForm((f) => ({ ...f, date: e.target.value }))} className={fieldCls} /></Field>
          <Field label="Lĩnh vực">
            <div className="flex flex-wrap gap-1.5">{LIFE_AREAS.map((a) => <button key={a.id} type="button" onClick={() => setMForm((f) => ({ ...f, area: f.area === a.id ? undefined : (a.id as LifeArea) }))} className={cn('h-8 px-3 rounded-full text-[12.5px] font-semibold border inline-flex items-center gap-1', mForm.area === a.id ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border/70 text-muted-foreground')}>{a.icon} {a.name}</button>)}</div>
          </Field>
          <Field label="Mô tả"><textarea rows={2} value={mForm.description} onChange={(e) => setMForm((f) => ({ ...f, description: e.target.value }))} className={cn(areaCls, 'text-[16px] sm:text-[14px]')} /></Field>
          <FormActions onCancel={() => setMEdit(null)} disabled={!mForm.title.trim() || !mForm.date} />
        </form>
      </AdaptiveModal>

      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
