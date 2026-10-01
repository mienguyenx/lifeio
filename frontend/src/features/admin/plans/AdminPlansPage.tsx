// Module 22 — Admin: Gói dịch vụ, đăng ký & bảng giá (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminPlans.tsx (bản cũ: /admin/plans/classic)
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, CreditCard, Crown, EyeOff, Gauge, Pencil, Plus, Search, Shield, Star, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut } from '@/components/lio/charts';
import { ChoiceGrid, Field, areaCls, fieldCls } from '@/components/lio/form';
import { useSubscriptionPlans, useUpdateSubscriptionPlan, useCreateSubscriptionPlan, useUserSubscriptions, useAllProfiles, type SubscriptionPlan } from '@/hooks/useAdminData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { GridHead, GridRow, Pager, Pill, UserAvatar, asProfiles, type Tone } from '../shared';

// Giữ nguyên danh sách giới hạn có sẵn của bản cũ
const LIMIT_DEFINITIONS = [
  { key: 'max_goals', label: 'Số mục tiêu tối đa' },
  { key: 'max_tasks', label: 'Số công việc tối đa' },
  { key: 'max_habits', label: 'Số thói quen tối đa' },
  { key: 'max_notes', label: 'Số ghi chú tối đa' },
  { key: 'ai_requests_per_month', label: 'Lượt AI / tháng' },
  { key: 'storage_mb', label: 'Dung lượng (MB)' },
  { key: 'max_workspaces', label: 'Số workspace' },
  { key: 'max_workspace_members', label: 'Thành viên / workspace' },
];
const PERIOD_LABEL: Record<string, string> = { monthly: 'tháng', yearly: 'năm', lifetime: 'trọn đời' };
const PLAN_COLORS = ['#7C5CFC', '#F5A524', '#22B07D', '#2F7BF6', '#F0587A', '#9AA3B2'];
const SUB_TONE: Record<string, Tone> = { active: 'green', trialing: 'blue', cancelled: 'red', canceled: 'red', expired: 'gray', past_due: 'amber' };
const SUB_LABEL: Record<string, string> = { active: 'Hoạt động', trialing: 'Dùng thử', cancelled: 'Đã hủy', canceled: 'Đã hủy', expired: 'Hết hạn', past_due: 'Quá hạn' };
const SUB_COLS = 'minmax(0,1.5fr) minmax(0,1fr) 104px 100px 100px';
const fmtDate = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy', { locale: vi }) : '—');
const money = (p: SubscriptionPlan) => (p.price === 0 ? 'Miễn phí' : `${p.price.toLocaleString()} ${p.currency || ''}`.trim());

type View = 'all' | 'public' | 'hidden';
type EditorTab = 'general' | 'features' | 'limits' | 'visibility';
type Draft = Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'> & { id?: string };
const EMPTY: Draft = { name: '', slug: '', description: '', price: 0, currency: 'USD', billing_period: 'monthly', features: [], limits: {}, is_active: true, is_default: false, is_hidden: false, allowed_user_ids: [], sort_order: 0 };

export default function AdminPlansPage() {
  const isMobile = useIsMobile();
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: subscriptions } = useUserSubscriptions();
  const { data: profilesRaw } = useAllProfiles();
  const profiles = useMemo(() => asProfiles(profilesRaw), [profilesRaw]);
  const updatePlan = useUpdateSubscriptionPlan();
  const createPlan = useCreateSubscriptionPlan();

  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<EditorTab>('general');
  const [newFeature, setNewFeature] = useState('');
  const [customLimit, setCustomLimit] = useState({ key: '', value: 0 });
  const [userQuery, setUserQuery] = useState('');

  const all = plans ?? [];
  const subs = useMemo(() => subscriptions ?? [], [subscriptions]);
  const activeSubs = subs.filter((s) => s.status === 'active');
  const subsOf = (id: string) => activeSubs.filter((s) => s.plan_id === id).length;
  const shown = all.filter((p) => view === 'all' || (view === 'hidden' ? p.is_hidden : !p.is_hidden));
  const defaultPlan = all.find((p) => p.is_default);
  const planName = (id: string) => all.find((p) => p.id === id)?.name ?? '—';
  const profileOf = (id: string) => profiles?.find((p) => p.id === id);

  const subRows = useMemo(() => {
    const q = search.toLowerCase();
    return subs.filter((s) => {
      if (subFilter !== 'all' && s.plan_id !== subFilter) return false;
      if (!q) return true;
      const u = profiles?.find((p) => p.id === s.user_id);
      return (u?.name ?? '').toLowerCase().includes(q) || (u?.email ?? '').toLowerCase().includes(q);
    });
  }, [subs, subFilter, search, profiles]);
  const pages = Math.max(1, Math.ceil(subRows.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const pagedSubs = subRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Đặt mặc định: bỏ cờ ở gói mặc định cũ để chỉ còn một gói mặc định
  const setDefault = (p: SubscriptionPlan) => {
    all.filter((x) => x.is_default && x.id !== p.id).forEach((x) => updatePlan.mutate({ id: x.id, is_default: false }));
    updatePlan.mutate({ id: p.id, is_default: true });
  };
  const openEdit = (p: SubscriptionPlan) => { setDraft({ ...p, features: [...(p.features ?? [])], limits: { ...(p.limits ?? {}) }, allowed_user_ids: [...(p.allowed_user_ids ?? [])] }); setTab('general'); };
  const openCreate = () => { setDraft({ ...EMPTY, sort_order: all.length }); setTab('general'); };
  const save = () => {
    if (!draft) return;
    if (draft.id) {
      // Bản cũ quên lưu billing_period/sort_order khi sửa — lưu đủ các trường chỉnh được
      updatePlan.mutate({ id: draft.id, name: draft.name, description: draft.description, price: draft.price, billing_period: draft.billing_period, sort_order: draft.sort_order, features: draft.features, limits: draft.limits, is_hidden: draft.is_hidden, is_active: draft.is_active, allowed_user_ids: draft.allowed_user_ids }, { onSuccess: () => setDraft(null) });
    } else {
      const { id: _omit, ...rest } = draft;
      void _omit;
      createPlan.mutate({ ...rest, slug: rest.slug || rest.name.toLowerCase().replace(/\s+/g, '-') }, { onSuccess: () => setDraft(null) });
    }
  };

  const donut = all.map((p, i) => ({ id: p.id, name: p.name, value: subsOf(p.id), color: PLAN_COLORS[i % PLAN_COLORS.length] })).filter((d) => d.value > 0);
  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Người đăng ký theo gói" hint={`${activeSubs.length} đang hoạt động`} />
        {donut.length ? <Donut size={130} data={donut} center={<span><span className="block text-[11px] text-muted-foreground">đăng ký</span><span className="block text-[18px] font-extrabold">{activeSubs.length}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa có người đăng ký.</p>}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Trạng thái đăng ký" />
        <div className="space-y-1.5">
          {Object.entries(subs.reduce<Record<string, number>>((a, s) => { a[s.status] = (a[s.status] ?? 0) + 1; return a; }, {})).map(([st, n]) => (
            <div key={st} className="flex items-center justify-between text-[12.5px]"><Pill tone={SUB_TONE[st] ?? 'gray'}>{SUB_LABEL[st] ?? st}</Pill><span className="font-semibold">{n}</span></div>
          ))}
          {!subs.length && <p className="text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</p>}
        </div>
      </Surface>
      <MascotCard mascot="mochi" pose="celebrate" title="Bảng giá rõ ràng" quote="Gói mặc định được gán cho người dùng mới — hãy giữ nó luôn bật." />
    </div>
  );

  const planCard = (p: SubscriptionPlan, i: number) => {
    const feats = (p.features ?? []) as string[];
    const limits = Object.keys(p.limits ?? {}).length;
    return (
      <div key={p.id} className={cn('relative rounded-[22px] border bg-card p-4 flex flex-col transition-all', p.is_default ? 'border-primary ring-4 ring-primary/10' : 'border-border/60', !p.is_active && 'opacity-60')}>
        <div className="flex items-start gap-2.5">
          <span className="h-10 w-10 rounded-xl grid place-items-center shrink-0 text-white" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }}>{p.is_hidden ? <Shield className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap"><p className="text-[15px] font-bold truncate">{p.name}</p>{p.is_default && <Pill tone="violet" icon={<Star className="h-3 w-3 fill-current" />}>Mặc định</Pill>}{p.is_hidden && <Pill icon={<EyeOff className="h-3 w-3" />}>Ẩn</Pill>}</div>
            <p className="text-[11.5px] text-muted-foreground truncate">/{p.slug}</p>
          </div>
          <Switch checked={p.is_active} onCheckedChange={() => updatePlan.mutate({ id: p.id, is_active: !p.is_active })} aria-label={`Bật gói ${p.name}`} />
        </div>
        <p className="mt-3"><span className="text-[26px] font-extrabold tracking-tight">{money(p)}</span>{p.price > 0 && <span className="text-[12.5px] text-muted-foreground"> / {PERIOD_LABEL[p.billing_period] ?? p.billing_period}</span>}</p>
        {p.description && <p className="text-[12.5px] text-muted-foreground line-clamp-2">{p.description}</p>}
        <div className="flex items-center gap-1.5 mt-2.5"><Pill tone="blue" icon={<Users className="h-3 w-3" />}>{subsOf(p.id)} người dùng</Pill>{limits > 0 && <Pill icon={<Gauge className="h-3 w-3" />}>{limits} giới hạn</Pill>}</div>
        <ul className="mt-3 space-y-1.5 flex-1">
          {feats.slice(0, 4).map((f, k) => <li key={k} className="flex items-start gap-2 text-[12.5px]"><Check className="h-3.5 w-3.5 text-[#1F9D63] mt-0.5 shrink-0" /><span className="line-clamp-1">{f}</span></li>)}
          {feats.length > 4 && <li className="text-[12px] text-muted-foreground pl-5">+{feats.length - 4} tính năng khác</li>}
          {feats.length === 0 && <li className="text-[12px] text-muted-foreground">Chưa có mô tả tính năng</li>}
        </ul>
        <div className="flex gap-2 pt-3">
          {!p.is_default && p.is_active && !p.is_hidden && <Button variant="outline" size="sm" className="rounded-full flex-1" onClick={() => setDefault(p)}><Star className="h-3.5 w-3.5 mr-1" />Đặt mặc định</Button>}
          <Button variant="outline" size="sm" className="rounded-full flex-1" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5 mr-1" />Chỉnh sửa</Button>
        </div>
      </div>
    );
  };

  const d = draft;
  const upd = (patch: Partial<Draft>) => setDraft((x) => (x ? { ...x, ...patch } : x));
  const allowedUsers = (d?.allowed_user_ids ?? []).map((id) => profileOf(id)).filter(Boolean) as NonNullable<ReturnType<typeof profileOf>>[];
  const candidates = (profiles ?? []).filter((p) => !(d?.allowed_user_ids ?? []).includes(p.id) && (!userQuery || p.name?.toLowerCase().includes(userQuery.toLowerCase()) || p.email?.toLowerCase().includes(userQuery.toLowerCase()))).slice(0, 6);

  return (
    <Page>
      <PageHeader title="Gói dịch vụ" subtitle="Bảng giá, tính năng, giới hạn và người đăng ký"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm người đăng ký..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Tạo gói</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'public', label: 'Công khai', count: all.filter((p) => !p.is_hidden).length }, { id: 'hidden', label: 'Ẩn', count: all.filter((p) => p.is_hidden).length }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="mochi" pose="celebrate" title="Bảng giá LifeOS" subtitle={all.length ? `${all.length} gói · ${activeSubs.length} người đăng ký đang hoạt động.` : 'Tạo gói dịch vụ đầu tiên.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Gói mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<CreditCard className="h-5 w-5" />} tint="violet" value={all.length} label="Tổng gói" hint={`${all.filter((p) => p.is_hidden).length} gói ẩn`} />
            <StatTile icon={<Check className="h-5 w-5" />} tint="mint" value={all.filter((p) => p.is_active).length} label="Đang bật" hint="có thể đăng ký" />
            <StatTile icon={<Users className="h-5 w-5" />} tint="sky" value={activeSubs.length} label="Người đăng ký" hint={`${subs.length} bản ghi`} />
            <StatTile icon={<Crown className="h-5 w-5" />} tint="amber" value={<span className="block text-[15px] leading-tight whitespace-normal line-clamp-2">{defaultPlan?.name ?? '—'}</span>} label="Gói mặc định" hint="người dùng mới" />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Bảng giá" hint={`${shown.length} gói`} /></div>
            {isLoading ? <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[22px]" />)}</div>
              : shown.length === 0 ? <EmptyState mascot="mochi" compact title="Chưa có gói nào" description="Nhấn “Tạo gói” để thêm gói dịch vụ." action={<Button className="rounded-full" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Tạo gói</Button>} />
              : <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{shown.map((p) => planCard(p, all.indexOf(p)))}</div>}
          </Surface>

          <Surface className="p-3 sm:p-4">
            <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
              <SectionTitle title="Đăng ký của người dùng" hint={`${subRows.length} mục`} className="mb-0" />
              <Select value={subFilter} onValueChange={(v) => { setSubFilter(v); setPage(0); }}>
                <SelectTrigger className={cn('h-9 rounded-full bg-card', isMobile ? 'w-full' : 'ml-auto w-[170px]')}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Mọi gói</SelectItem>{all.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {subRows.length === 0 ? <EmptyState mascot="mochi" compact title="Chưa có đăng ký" description="Gán gói cho người dùng ở trang Người dùng." /> : isMobile ? (
              <div className="divide-y divide-border/50">
                {pagedSubs.map((s) => { const u = profileOf(s.user_id); return (
                  <div key={s.id} className="flex items-center gap-3 px-1 py-3">
                    <UserAvatar name={u?.name} email={u?.email} src={u?.avatar_url} size={36} />
                    <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold truncate">{u?.name || u?.email || s.user_id.slice(0, 8)}</p><p className="text-[11.5px] text-muted-foreground">{planName(s.plan_id)} · từ {fmtDate(s.started_at)}</p></div>
                    <Pill tone={SUB_TONE[s.status] ?? 'gray'}>{SUB_LABEL[s.status] ?? s.status}</Pill>
                  </div>
                ); })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <GridHead cols={SUB_COLS}><span>Người dùng</span><span>Gói</span><span>Trạng thái</span><span>Bắt đầu</span><span>Hết hạn</span></GridHead>
                {pagedSubs.map((s) => { const u = profileOf(s.user_id); return (
                  <GridRow key={s.id} cols={SUB_COLS}>
                    <div className="min-w-0 flex items-center gap-2.5"><UserAvatar name={u?.name} email={u?.email} src={u?.avatar_url} size={32} /><div className="min-w-0"><p className="text-[13px] font-semibold truncate">{u?.name || '—'}</p><p className="text-[11.5px] text-muted-foreground truncate">{u?.email || s.user_id}</p></div></div>
                    <span className="text-[12.5px] font-semibold truncate">{planName(s.plan_id)}</span>
                    <span><Pill tone={SUB_TONE[s.status] ?? 'gray'}>{SUB_LABEL[s.status] ?? s.status}</Pill></span>
                    <span className="text-[12px] text-muted-foreground">{fmtDate(s.started_at)}</span>
                    <span className="text-[12px] text-muted-foreground">{s.expires_at ? fmtDate(s.expires_at) : 'Không hạn'}</span>
                  </GridRow>
                ); })}
              </div>
            )}
            {subRows.length > 0 && <Pager page={safePage} pages={pages} total={subRows.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
          </Surface>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && <Fab onClick={openCreate} label="Tạo gói" />}

      <AdaptiveModal open={!!d} onOpenChange={(o) => !o && setDraft(null)} title={d?.id ? `Chỉnh sửa gói ${d.name}` : 'Tạo gói mới'}>
        {d && (
          <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <SegmentedTabs size="sm" full items={[{ id: 'general', label: 'Chung' }, { id: 'features', label: 'Tính năng', count: d.features.length }, { id: 'limits', label: 'Giới hạn', count: Object.keys(d.limits).length }, { id: 'visibility', label: 'Hiển thị' }]} value={tab} onChange={setTab} />
            {tab === 'general' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên gói *"><input className={fieldCls} value={d.name} onChange={(e) => upd({ name: e.target.value })} placeholder="VD: Pro" autoFocus /></Field>
                  {d.id ? <Field label="Slug"><input className={cn(fieldCls, 'opacity-60')} value={d.slug} disabled /></Field>
                    : <Field label="Slug (duy nhất) *"><input className={fieldCls} value={d.slug} onChange={(e) => upd({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="pro" /></Field>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Giá (${d.currency || 'USD'})`}><input type="number" step="0.01" min={0} className={fieldCls} value={d.price} onChange={(e) => upd({ price: parseFloat(e.target.value) || 0 })} /></Field>
                  <Field label="Thứ tự"><input type="number" className={fieldCls} value={d.sort_order} onChange={(e) => upd({ sort_order: parseInt(e.target.value) || 0 })} /></Field>
                </div>
                <Field label="Chu kỳ thanh toán"><ChoiceGrid cols={3} value={d.billing_period as 'monthly' | 'yearly' | 'lifetime'} onChange={(v) => upd({ billing_period: v })} items={[{ id: 'monthly', label: 'Hàng tháng' }, { id: 'yearly', label: 'Hàng năm' }, { id: 'lifetime', label: 'Trọn đời' }]} /></Field>
                <Field label="Mô tả"><textarea className={areaCls} rows={3} value={d.description ?? ''} onChange={(e) => upd({ description: e.target.value })} placeholder="Mô tả ngắn..." /></Field>
              </div>
            )}
            {tab === 'features' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input className={fieldCls} value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="VD: Không giới hạn mục tiêu" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newFeature.trim()) { upd({ features: [...d.features, newFeature.trim()] }); setNewFeature(''); } } }} />
                  <Button type="button" className="h-11 rounded-full px-4" disabled={!newFeature.trim()} onClick={() => { upd({ features: [...d.features, newFeature.trim()] }); setNewFeature(''); }}><Plus className="h-4 w-4" /></Button>
                </div>
                {d.features.length === 0 ? <p className="text-[12.5px] text-muted-foreground text-center py-3">Chưa có tính năng nào.</p> : (
                  <div className="space-y-1.5">
                    {d.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#1F9D63] shrink-0" />
                        <input className={cn(fieldCls, 'h-9 text-[13px]')} value={f} onChange={(e) => upd({ features: d.features.map((x, k) => (k === i ? e.target.value : x)) })} aria-label={`Tính năng ${i + 1}`} />
                        <IconButton label="Xóa tính năng" onClick={() => upd({ features: d.features.filter((_, k) => k !== i) })}><X className="h-3.5 w-3.5" /></IconButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'limits' && (
              <div className="space-y-2.5">
                <p className="text-[11.5px] text-muted-foreground">Bật giới hạn và nhập giá trị; -1 = không giới hạn.</p>
                {LIMIT_DEFINITIONS.map((l) => {
                  const on = l.key in d.limits;
                  return (
                    <div key={l.key} className="flex items-center gap-2.5">
                      <Switch checked={on} onCheckedChange={(v) => { const n = { ...d.limits }; if (v) n[l.key] = 0; else delete n[l.key]; upd({ limits: n }); }} aria-label={l.label} />
                      <span className="text-[13px] font-semibold flex-1">{l.label}</span>
                      <input type="number" disabled={!on} className={cn(fieldCls, 'h-9 w-[96px] text-[13px]', !on && 'opacity-40')} value={on ? d.limits[l.key] : ''} onChange={(e) => upd({ limits: { ...d.limits, [l.key]: parseInt(e.target.value) || 0 } })} aria-label={`Giá trị ${l.label}`} />
                    </div>
                  );
                })}
                {Object.entries(d.limits).filter(([k]) => !LIMIT_DEFINITIONS.some((l) => l.key === k)).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2.5">
                    <Pill tone="violet">{k}</Pill><span className="flex-1" />
                    <input type="number" className={cn(fieldCls, 'h-9 w-[96px] text-[13px]')} value={v} onChange={(e) => upd({ limits: { ...d.limits, [k]: parseInt(e.target.value) || 0 } })} aria-label={`Giá trị ${k}`} />
                    <IconButton label="Xóa giới hạn" onClick={() => { const n = { ...d.limits }; delete n[k]; upd({ limits: n }); }}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                  </div>
                ))}
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <input className={cn(fieldCls, 'h-9 text-[13px]')} placeholder="Giới hạn tùy chỉnh (key)" value={customLimit.key} onChange={(e) => setCustomLimit({ ...customLimit, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
                  <input type="number" className={cn(fieldCls, 'h-9 w-[90px] text-[13px]')} value={customLimit.value} onChange={(e) => setCustomLimit({ ...customLimit, value: parseInt(e.target.value) || 0 })} aria-label="Giá trị" />
                  <Button type="button" size="sm" variant="outline" className="h-9 rounded-full" disabled={!customLimit.key} onClick={() => { upd({ limits: { ...d.limits, [customLimit.key]: customLimit.value } }); setCustomLimit({ key: '', value: 0 }); }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
            {tab === 'visibility' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2.5"><div><p className="text-[13px] font-semibold">Gói ẩn</p><p className="text-[11.5px] text-muted-foreground">Chỉ người được chỉ định mới thấy</p></div><Switch checked={d.is_hidden} onCheckedChange={(v) => upd({ is_hidden: v })} aria-label="Gói ẩn" /></div>
                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2.5"><div><p className="text-[13px] font-semibold">Đang bật</p><p className="text-[11.5px] text-muted-foreground">Cho phép đăng ký gói này</p></div><Switch checked={d.is_active} onCheckedChange={(v) => upd({ is_active: v })} aria-label="Đang bật" /></div>
                {d.is_hidden && (
                  <div className="space-y-2">
                    <p className="text-[12.5px] font-semibold text-muted-foreground">Người dùng được phép ({d.allowed_user_ids.length})</p>
                    <div className="relative"><Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input className={cn(fieldCls, 'pl-10 h-10 text-[13px]')} placeholder="Tìm người dùng để thêm..." value={userQuery} onChange={(e) => setUserQuery(e.target.value)} /></div>
                    {userQuery && candidates.map((p) => (
                      <button type="button" key={p.id} onClick={() => { upd({ allowed_user_ids: [...d.allowed_user_ids, p.id] }); setUserQuery(''); }} className="w-full flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left hover:bg-secondary/60">
                        <UserAvatar name={p.name} email={p.email} src={p.avatar_url} size={28} /><span className="text-[12.5px] font-semibold flex-1 truncate">{p.name || p.email}</span><Plus className="h-3.5 w-3.5 text-primary" />
                      </button>
                    ))}
                    {allowedUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-2.5 px-2 py-1"><UserAvatar name={u.name} email={u.email} src={u.avatar_url} size={28} /><span className="text-[12.5px] font-semibold flex-1 truncate">{u.name || u.email}</span><IconButton label="Gỡ người dùng" onClick={() => upd({ allowed_user_ids: d.allowed_user_ids.filter((x) => x !== u.id) })}><X className="h-3.5 w-3.5" /></IconButton></div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setDraft(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!d.name || (!d.id && !d.slug) || updatePlan.isPending || createPlan.isPending}>{d.id ? 'Lưu thay đổi' : 'Tạo gói'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>
    </Page>
  );
}
