// Module 23a — Admin: Nhà cung cấp AI (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminAIProviders.tsx (bản cũ: /admin/ai/providers/classic)
import { useCallback, useMemo, useState } from 'react';
import { Bot, CheckCircle2, Download, ExternalLink, Eye, EyeOff, Globe, Key, Loader2, Play, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut } from '@/components/lio/charts';
import { Field, fieldCls, areaCls } from '@/components/lio/form';
import { useAIProviders, useUpdateAIProvider, useCreateAIProvider, useDeleteAIProvider, useAIModels, useCreateAIModel, useDeleteAIModel, type AIModel } from '@/hooks/useAdminData';
import { useAdminApiKeys, useDeleteApiKey, useSaveApiKey, useSetPrimaryApiKey, useToggleApiKey, maskKey, type AdminApiKey } from '@/hooks/useAdminApiKeys';
import { fetchModelsFromProvider, testProviderConnection } from '@/services/providerService';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { AdminAIProvider, FetchedModel, ProviderType, AuthType } from '@/types/admin';
import { ConfirmDialog, CountBars, GridHead, GridRow, InfoRow, MiniStat, PALETTE, Pager, Pill, RowMenu, useIsXl } from '../shared';

// Giữ nguyên danh sách của bản cũ
export const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: 'Custom' },
];
const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key-header', label: 'Custom Header' },
  { value: 'query-param', label: 'Query Parameter' },
  { value: 'none', label: 'Không cần xác thực' },
];
const typeLabel = (t: string) => PROVIDER_TYPES.find((x) => x.value === t)?.label ?? t;
const COLS = 'minmax(0,1.6fr) minmax(0,1fr) 84px 76px 92px 40px';
type View = 'all' | 'active' | 'inactive' | 'custom';
const EMPTY_PROVIDER = { name: '', slug: '', type: 'openai-compatible' as ProviderType, base_url: '', models_endpoint: '/models', description: '', auth_type: 'bearer' as AuthType, auth_header: 'Authorization', auth_prefix: 'Bearer' };

export function ProviderMark({ p, size = 36 }: { p: Pick<AdminAIProvider, 'name' | 'color'>; size?: number }) {
  return <span className="rounded-xl grid place-items-center shrink-0 text-white font-bold" style={{ width: size, height: size, background: p.color || '#7C5CFC', fontSize: Math.round(size * 0.42) }}>{p.name.charAt(0).toUpperCase()}</span>;
}

export default function AdminAIProvidersPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const { data: providers, isLoading } = useAIProviders();
  const { data: models } = useAIModels();
  const { data: apiKeys } = useAdminApiKeys();
  const updateProvider = useUpdateAIProvider();
  const createProvider = useCreateAIProvider();
  const deleteProvider = useDeleteAIProvider();

  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PROVIDER);
  const [confirmDelete, setConfirmDelete] = useState<AdminAIProvider | null>(null);

  const all = useMemo(() => providers ?? [], [providers]);
  const keys = apiKeys ?? [];
  const modelsOf = (slug: string) => (models ?? []).filter((m) => m.provider === slug);
  const keysOf = (slug: string) => keys.filter((k) => k.provider === slug);
  const counts = { all: all.length, active: all.filter((p) => p.is_active).length, inactive: all.filter((p) => !p.is_active).length, custom: all.filter((p) => !p.is_builtin).length };
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((p) => (view === 'all' || (view === 'active' ? p.is_active : view === 'inactive' ? !p.is_active : !p.is_builtin)) && (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)));
  }, [all, view, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = all.find((p) => p.id === selectedId) ?? null;

  const toggle = (p: AdminAIProvider) => {
    if (p.id.startsWith('builtin-')) { toast.error('Cần tạo table admin_ai_providers trước'); return; }
    updateProvider.mutate({ id: p.id, is_active: !p.is_active });
  };
  const create = () => {
    if (!draft.name || !draft.slug) { toast.error('Cần nhập tên và slug'); return; }
    createProvider.mutate({
      ...draft, icon_url: null, color: null, extra_headers: {}, fetch_type: 'api', model_transform: null,
      is_active: true, is_builtin: false, supports_streaming: true, supports_tools: false, docs_url: null, pricing_url: null, sort_order: all.length + 1,
    }, { onSuccess: () => { setShowAdd(false); setDraft(EMPTY_PROVIDER); } });
  };
  const openAdd = () => { setDraft(EMPTY_PROVIDER); setShowAdd(true); };

  const donut = all.map((p, i) => ({ id: p.id, name: p.name, value: modelsOf(p.slug).length, color: p.color || PALETTE[i % PALETTE.length] })).filter((d) => d.value > 0);
  const byType = PROVIDER_TYPES.map((t, i) => ({ label: t.label, value: all.filter((p) => p.type === t.value).length, color: PALETTE[i] })).filter((x) => x.value > 0);
  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Model theo provider" hint={`${models?.length ?? 0} model`} />
        {donut.length ? <Donut size={130} data={donut} center={<span><span className="block text-[11px] text-muted-foreground">model</span><span className="block text-[18px] font-extrabold">{models?.length ?? 0}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa import model nào.</p>}
      </Surface>
      <Surface className="p-4"><SectionTitle title="Loại kết nối" /><CountBars items={byType} /></Surface>
      <MascotCard mascot="ori" pose="idea" title="Mẹo kết nối" quote="Thêm API key rồi bấm “Lấy model” để tự động thu thập danh sách model." />
    </div>
  );
  const detail = selected && (
    <ProviderDetail key={selected.id} provider={selected} inPanel={isXl} models={modelsOf(selected.slug)} keys={keysOf(selected.slug)} allModels={models ?? []}
      onClose={() => setSelectedId(null)} onToggle={() => toggle(selected)} onDelete={() => setConfirmDelete(selected)} />
  );
  const side = isXl && detail ? detail : overviewSide;

  return (
    <Page>
      <PageHeader title="Nhà cung cấp AI" subtitle="Kết nối provider, thu thập model và quản lý API key"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm provider..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />Thêm provider</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'active', label: 'Đang bật', count: counts.active }, { id: 'inactive', label: 'Đang tắt', count: counts.inactive }, { id: 'custom', label: 'Tùy chỉnh', count: counts.custom }]} value={view} onChange={(v) => { setView(v); setPage(0); }} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Trung tâm AI" subtitle={all.length ? `${counts.active}/${all.length} provider đang bật · ${models?.length ?? 0} model · ${keys.length} API key.` : 'Thêm provider đầu tiên để dùng AI.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />Provider mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Globe className="h-5 w-5" />} tint="violet" value={all.length} label="Provider" hint={`${counts.custom} tùy chỉnh`} onClick={() => setView('all')} active={view === 'all'} />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={counts.active} label="Đang bật" hint="sẵn sàng gọi" onClick={() => setView('active')} active={view === 'active'} />
            <StatTile icon={<Key className="h-5 w-5" />} tint="sky" value={keys.length} label="API key" hint={`${keys.filter((k) => k.is_active).length} đang bật`} />
            <StatTile icon={<Bot className="h-5 w-5" />} tint="amber" value={models?.length ?? 0} label="Model" hint={`${(models ?? []).filter((m) => m.is_active).length} đang bật`} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Danh sách provider" hint={`${filtered.length} provider`} /></div>
            {isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
              : filtered.length === 0 ? <EmptyState mascot="ori" compact title={all.length ? 'Không tìm thấy provider' : 'Chưa có provider'} description={all.length ? 'Thử đổi tab hoặc từ khóa.' : 'Nhấn “Thêm provider” để kết nối.'} />
              : isMobile ? (
                <div className="divide-y divide-border/50">
                  {paged.map((p) => (
                    <div key={p.id} role="button" tabIndex={0} onClick={() => setSelectedId(p.id)} className={cn('flex items-center gap-3 px-1 py-3', !p.is_active && 'opacity-60')}>
                      <ProviderMark p={p} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold truncate">{p.name}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{typeLabel(p.type)}</p>
                        <div className="flex items-center gap-1.5 mt-1"><Pill tone="violet" icon={<Bot className="h-3 w-3" />}>{modelsOf(p.slug).length}</Pill><Pill tone="blue" icon={<Key className="h-3 w-3" />}>{keysOf(p.slug).length}</Pill>{p.is_builtin && <Pill>Có sẵn</Pill>}</div>
                      </div>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={p.is_active} onCheckedChange={() => toggle(p)} aria-label={`Bật ${p.name}`} /></span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <GridHead cols={COLS}><span>Provider</span><span>Loại</span><span>Model</span><span>Key</span><span>Trạng thái</span><span /></GridHead>
                  {paged.map((p) => (
                    <GridRow key={p.id} cols={COLS} onClick={() => setSelectedId(p.id)} active={selectedId === p.id} className={cn(!p.is_active && 'opacity-70')}>
                      <div className="min-w-0 flex items-center gap-2.5">
                        <ProviderMark p={p} />
                        <div className="min-w-0"><p className="text-[13.5px] font-semibold truncate flex items-center gap-1.5">{p.name}{p.is_builtin && <Pill className="shrink-0">Có sẵn</Pill>}</p><p className="text-[11.5px] text-muted-foreground truncate">{p.description || p.base_url || p.slug}</p></div>
                      </div>
                      <span className="text-[12.5px] truncate">{typeLabel(p.type)}</span>
                      <span><Pill tone="violet" icon={<Bot className="h-3 w-3" />}>{modelsOf(p.slug).length}</Pill></span>
                      <span><Pill tone="blue" icon={<Key className="h-3 w-3" />}>{keysOf(p.slug).length}</Pill></span>
                      <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-2"><Switch checked={p.is_active} onCheckedChange={() => toggle(p)} aria-label={`Bật ${p.name}`} /></span>
                      <RowMenu items={[
                        { label: 'Xem chi tiết', icon: <Eye />, onClick: () => setSelectedId(p.id) },
                        { label: p.is_active ? 'Tắt provider' : 'Bật provider', icon: <CheckCircle2 />, onClick: () => toggle(p) },
                        { label: 'Tài liệu', icon: <ExternalLink />, onClick: () => window.open(p.docs_url!, '_blank', 'noopener'), hidden: !p.docs_url },
                        { label: 'Xóa provider', icon: <Trash2 />, onClick: () => setConfirmDelete(p), danger: true, separator: true, hidden: p.is_builtin },
                      ]} />
                    </GridRow>
                  ))}
                </div>
              )}
            {filtered.length > 0 && <Pager page={safePage} pages={pages} total={filtered.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
          </Surface>
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && <Fab onClick={openAdd} label="Thêm provider" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title={selected?.name ?? 'Provider'}>{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={showAdd} onOpenChange={setShowAdd} title="Thêm provider tùy chỉnh" description="OpenAI-compatible hoặc kết nối riêng">
        <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên hiển thị *"><input className={fieldCls} value={draft.name} autoFocus placeholder="VD: Groq" onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} /></Field>
            <Field label="Slug *"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={draft.slug} placeholder="groq" onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại"><Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as ProviderType })}><SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger><SelectContent>{PROVIDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Xác thực"><Select value={draft.auth_type} onValueChange={(v) => setDraft({ ...draft, auth_type: v as AuthType })}><SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger><SelectContent>{AUTH_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <Field label="Base URL"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={draft.base_url} placeholder="https://api.example.com/v1" onChange={(e) => setDraft({ ...draft, base_url: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Models endpoint"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={draft.models_endpoint} onChange={(e) => setDraft({ ...draft, models_endpoint: e.target.value })} /></Field>
            <Field label="Auth header"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={draft.auth_header} disabled={draft.auth_type === 'none'} onChange={(e) => setDraft({ ...draft, auth_header: e.target.value })} /></Field>
            <Field label="Tiền tố"><input className={fieldCls} value={draft.auth_prefix} disabled={draft.auth_type !== 'bearer'} onChange={(e) => setDraft({ ...draft, auth_prefix: e.target.value })} /></Field>
          </div>
          <Field label="Mô tả"><textarea className={areaCls} rows={2} value={draft.description} placeholder="Mô tả ngắn..." onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setShowAdd(false)}>Hủy</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!draft.name || !draft.slug || createProvider.isPending}>Thêm provider</Button>
          </div>
        </form>
      </AdaptiveModal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)} title={`Xóa provider ${confirmDelete?.name ?? ''}?`} description="Model và API key đã gắn với provider sẽ không bị xóa theo."
        onConfirm={() => { if (confirmDelete) deleteProvider.mutate(confirmDelete.id, { onSuccess: () => setSelectedId(null) }); setConfirmDelete(null); }} />
    </Page>
  );
}

type DetailTab = 'models' | 'keys' | 'config';
function ProviderDetail({ provider, inPanel, models, keys, allModels, onClose, onToggle, onDelete }: {
  provider: AdminAIProvider; inPanel: boolean; models: AIModel[]; keys: AdminApiKey[]; allModels: AIModel[]; onClose: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>('models');
  const [fetched, setFetched] = useState<FetchedModel[]>([]);
  const [fetching, setFetching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [addKey, setAddKey] = useState<{ name: string; api_key: string; base_url: string } | null>(null);
  const [confirmModel, setConfirmModel] = useState<AIModel | null>(null);
  const createModel = useCreateAIModel();
  const deleteModel = useDeleteAIModel();
  const saveKey = useSaveApiKey();
  const toggleKey = useToggleApiKey();
  const setPrimary = useSetPrimaryApiKey();
  const deleteKey = useDeleteApiKey();

  const doFetch = useCallback(async () => {
    setFetching(true); setFetched([]);
    try {
      const result = await fetchModelsFromProvider(provider);
      const existing = new Set(allModels.map((m) => m.model_id));
      const fresh = result.filter((m) => !existing.has(m.id));
      setFetched(fresh);
      toast.success(`Tìm thấy ${result.length} model (${fresh.length} chưa import)`);
    } catch (err) { toast.error(`Lỗi lấy model: ${(err as Error).message}`); } finally { setFetching(false); }
  }, [provider, allModels]);
  const importModel = useCallback((m: FetchedModel) => {
    createModel.mutate({ name: m.name, model_id: m.id, provider: m.provider_slug, description: m.description || `Auto-imported from ${m.provider_slug}`, max_tokens: m.context_length ? Math.min(m.context_length, 32768) : 4096, temperature: 0.7, capabilities: m.capabilities || ['chat'], is_active: true, is_default: false },
      { onSuccess: () => setFetched((prev) => prev.filter((x) => x.id !== m.id)) });
  }, [createModel]);
  const test = async () => {
    setTesting(true);
    try {
      const r = await testProviderConnection(provider);
      if (r.success) toast.success(`Kết nối thành công — ${r.modelCount} model`); else toast.error(`Lỗi: ${r.error}`);
    } finally { setTesting(false); }
  };
  const submitKey = () => {
    if (!addKey?.name || !addKey.api_key) { toast.error('Điền đủ thông tin'); return; }
    saveKey.mutate({ provider: provider.slug, name: addKey.name, api_key: addKey.api_key, is_active: true, is_primary: keys.length === 0, metadata: addKey.base_url ? { base_url: addKey.base_url } : {} }, { onSuccess: () => setAddKey(null) });
  };
  const allowBaseUrl = provider.type === 'openai-compatible' || provider.type === 'custom';

  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <ProviderMark p={provider} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold truncate">{provider.name}</p>
          <p className="text-[12px] text-muted-foreground font-mono truncate">{provider.slug}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Pill tone={provider.is_active ? 'green' : 'gray'}>{provider.is_active ? 'Đang bật' : 'Đang tắt'}</Pill>
            <Pill tone="violet">{typeLabel(provider.type)}</Pill>
            {provider.is_builtin && <Pill>Có sẵn</Pill>}
          </div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      {provider.description && <p className="text-[12.5px] text-muted-foreground">{provider.description}</p>}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Model" value={models.length} hint={`${models.filter((m) => m.is_active).length} bật`} />
        <MiniStat label="API key" value={keys.length} hint={`${keys.filter((k) => k.is_active).length} bật`} />
        <MiniStat label="Lượt dùng" value={keys.reduce((a, k) => a + (k.usage_count || 0), 0).toLocaleString()} hint="tổng các key" />
      </div>
      <SegmentedTabs size="sm" full items={[{ id: 'models', label: 'Model' }, { id: 'keys', label: 'API key' }, { id: 'config', label: 'Cấu hình' }]} value={tab} onChange={setTab} />

      {tab === 'models' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button className="flex-1 h-10 rounded-full" onClick={doFetch} disabled={fetching}>{fetching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}Lấy model</Button>
            <Button variant="outline" className="h-10 rounded-full px-3" onClick={test} disabled={testing} aria-label="Kiểm tra kết nối">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}</Button>
            {fetched.length > 0 && <Button variant="outline" className="h-10 rounded-full px-3" onClick={() => fetched.forEach(importModel)}><Download className="h-4 w-4 mr-1" />Tất cả ({fetched.length})</Button>}
          </div>
          {fetched.length > 0 && (
            <div className="rounded-2xl border border-dashed border-primary/30 divide-y divide-border/50 max-h-60 overflow-auto">
              {fetched.slice(0, 50).map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold truncate">{m.name}</p><p className="text-[10.5px] text-muted-foreground font-mono truncate">{m.id}{m.context_length ? ` · ${Math.round(m.context_length / 1000)}K` : ''}</p></div>
                  <Button size="sm" variant="outline" className="h-7 rounded-full text-[11.5px]" onClick={() => importModel(m)}><Plus className="h-3 w-3 mr-0.5" />Import</Button>
                </div>
              ))}
              {fetched.length > 50 && <p className="px-3 py-2 text-center text-[11.5px] text-muted-foreground">+{fetched.length - 50} model khác</p>}
            </div>
          )}
          {models.length ? (
            <div className="rounded-2xl border border-border/60 divide-y divide-border/50 max-h-72 overflow-auto">
              {models.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><p className="text-[12.5px] font-semibold truncate">{m.name}</p>{m.is_default && <Pill tone="violet">Mặc định</Pill>}<Pill tone={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'Bật' : 'Tắt'}</Pill></div>
                    <p className="text-[10.5px] text-muted-foreground font-mono truncate">{m.model_id}</p>
                  </div>
                  <IconButton label="Xóa model" onClick={() => setConfirmModel(m)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconButton>
                </div>
              ))}
            </div>
          ) : <EmptyState mascot="ori" compact title="Chưa có model" description="Bấm “Lấy model” để thu thập từ provider." />}
        </div>
      )}

      {tab === 'keys' && (
        <div className="space-y-2.5">
          {addKey ? (
            <form className="space-y-2.5 rounded-2xl bg-secondary/50 p-3" onSubmit={(e) => { e.preventDefault(); submitKey(); }}>
              <input className={cn(fieldCls, 'h-10 text-[13px]')} placeholder="Tên key, VD: Production 1" value={addKey.name} onChange={(e) => setAddKey({ ...addKey, name: e.target.value })} autoFocus aria-label="Tên key" />
              <input type="password" className={cn(fieldCls, 'h-10 text-[13px] font-mono')} placeholder="sk-..." value={addKey.api_key} onChange={(e) => setAddKey({ ...addKey, api_key: e.target.value })} aria-label="API key" />
              {allowBaseUrl && <input className={cn(fieldCls, 'h-10 text-[13px] font-mono')} placeholder={provider.base_url || 'Base URL (ghi đè)'} value={addKey.base_url} onChange={(e) => setAddKey({ ...addKey, base_url: e.target.value })} aria-label="Base URL" />}
              <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-9 rounded-full" onClick={() => setAddKey(null)}>Hủy</Button><Button type="submit" className="h-9 rounded-full" disabled={!addKey.name || !addKey.api_key || saveKey.isPending}>Thêm key</Button></div>
            </form>
          ) : <Button variant="outline" className="w-full h-10 rounded-full" onClick={() => setAddKey({ name: '', api_key: '', base_url: '' })}><Plus className="h-4 w-4 mr-1.5" />Thêm API key</Button>}
          {keys.length ? keys.map((k) => (
            <div key={k.id} className={cn('rounded-2xl border border-border/60 p-3', !k.is_active && 'opacity-60')}>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold truncate flex-1">{k.name}</p>
                {k.is_primary ? <Pill tone="violet" icon={<Star className="h-3 w-3 fill-current" />}>Chính</Pill> : <button className="text-[11.5px] font-semibold text-primary hover:underline" onClick={() => setPrimary.mutate({ id: k.id, provider: k.provider })}>Đặt làm chính</button>}
                <Switch checked={k.is_active} onCheckedChange={(v) => toggleKey.mutate({ id: k.id, is_active: v })} aria-label={`Bật key ${k.name}`} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <code className="text-[11px] bg-secondary rounded-lg px-2 py-0.5 font-mono truncate">{showKeys[k.id] ? k.api_key : maskKey(k.api_key)}</code>
                <IconButton label={showKeys[k.id] ? 'Ẩn key' : 'Hiện key'} onClick={() => setShowKeys((p) => ({ ...p, [k.id]: !p[k.id] }))}>{showKeys[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</IconButton>
                <span className="ml-auto" /><IconButton label="Xóa key" onClick={() => deleteKey.mutate(k.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconButton>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Đã dùng {k.usage_count || 0}{k.error_count > 0 && <span className="text-destructive"> · {k.error_count} lỗi</span>}</p>
            </div>
          )) : !addKey && <EmptyState mascot="taro" pose="care" compact title="Chưa có API key" description="Thêm key để gọi model của provider này." />}
        </div>
      )}

      {tab === 'config' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-secondary/40 px-3 py-1.5">
            <InfoRow label="Loại" value={typeLabel(provider.type)} />
            <InfoRow label="Base URL" value={<span className="font-mono text-[11.5px]">{provider.base_url || '—'}</span>} />
            <InfoRow label="Models endpoint" value={<span className="font-mono text-[11.5px]">{provider.models_endpoint || '—'}</span>} />
            <InfoRow label="Cách lấy model" value={provider.fetch_type} />
            <InfoRow label="Xác thực" value={AUTH_TYPES.find((a) => a.value === provider.auth_type)?.label ?? provider.auth_type} />
            <InfoRow label="Auth header" value={<span className="font-mono text-[11.5px]">{provider.auth_header || '—'}</span>} />
            <InfoRow label="Tiền tố" value={provider.auth_prefix || '—'} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Pill tone={provider.supports_streaming ? 'green' : 'gray'}>Streaming: {provider.supports_streaming ? 'Có' : 'Không'}</Pill>
            <Pill tone={provider.supports_tools ? 'green' : 'gray'}>Tools: {provider.supports_tools ? 'Có' : 'Không'}</Pill>
          </div>
          {Object.keys(provider.extra_headers || {}).length > 0 && <pre className="rounded-2xl bg-secondary/50 p-3 text-[11px] font-mono overflow-auto">{JSON.stringify(provider.extra_headers, null, 2)}</pre>}
          <div className="flex gap-2 flex-wrap">
            {provider.docs_url && <Button asChild variant="outline" size="sm" className="rounded-full"><a href={provider.docs_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Tài liệu</a></Button>}
            {provider.pricing_url && <Button asChild variant="outline" size="sm" className="rounded-full"><a href={provider.pricing_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Bảng giá</a></Button>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
        <Button variant="outline" className="h-10 rounded-full mt-3" onClick={onToggle}>{provider.is_active ? 'Tắt provider' : 'Bật provider'}</Button>
        {!provider.is_builtin ? <Button variant="outline" className="h-10 rounded-full mt-3 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1.5" />Xóa</Button> : <span />}
      </div>
      <ConfirmDialog open={!!confirmModel} onOpenChange={(o) => !o && setConfirmModel(null)} title={`Xóa model ${confirmModel?.name ?? ''}?`} onConfirm={() => { if (confirmModel) deleteModel.mutate(confirmModel.id); setConfirmModel(null); }} />
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
