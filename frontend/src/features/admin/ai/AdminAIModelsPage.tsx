// Module 23b — Admin: Model AI (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminAIModels.tsx (bản cũ: /admin/ai/models/classic)
import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Cpu, Download, Loader2, Pencil, Play, Plus, RefreshCw, Sparkles, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut } from '@/components/lio/charts';
import { Field, fieldCls, areaCls } from '@/components/lio/form';
import { useAIModels, useUpdateAIModel, useCreateAIModel, useDeleteAIModel, useAIProviders, type AIModel } from '@/hooks/useAdminData';
import { fetchModelsFromProvider } from '@/services/providerService';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { FetchedModel } from '@/types/admin';
import { ConfirmDialog, CountBars, GridHead, GridRow, InfoRow, MiniStat, PALETTE, Pager, Pill, RowMenu, useIsXl } from '../shared';

// Giữ nguyên danh sách năng lực của bản cũ
const CAPABILITIES = ['chat', 'completion', 'embedding', 'image-understanding', 'code-generation', 'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis', 'web-search'];
const COLS = 'minmax(0,1.6fr) minmax(0,0.9fr) 84px 64px minmax(0,1.1fr) 64px 40px';
type View = 'all' | 'active' | 'inactive' | 'test';
type Draft = Omit<AIModel, 'id' | 'created_at' | 'updated_at'> & { id?: string };
const EMPTY: Draft = { name: '', model_id: '', provider: 'lovable', description: '', max_tokens: 4096, temperature: 0.7, capabilities: [], is_active: true, is_default: false };
const fmtTokens = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));

export default function AdminAIModelsPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const { data: models, isLoading } = useAIModels();
  const { data: providers } = useAIProviders();
  const updateModel = useUpdateAIModel();
  const createModel = useCreateAIModel();
  const deleteModel = useDeleteAIModel();

  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AIModel | null>(null);
  // Lấy model từ provider
  const [fetchSlug, setFetchSlug] = useState('openrouter');
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState<FetchedModel[]>([]);
  // Thử model
  const [testModelId, setTestModelId] = useState<string>('');
  const [testPrompt, setTestPrompt] = useState('Hello, can you briefly introduce yourself?');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  const all = useMemo(() => models ?? [], [models]);
  const provs = providers ?? [];
  const provName = (slug: string) => provs.find((p) => p.slug === slug)?.name ?? slug;
  const active = all.filter((m) => m.is_active);
  const defaultModel = all.find((m) => m.is_default);
  const providerSlugs = [...new Set(all.map((m) => m.provider))];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((m) => (view === 'all' || view === 'test' || (view === 'active' ? m.is_active : !m.is_active)) && (providerFilter === 'all' || m.provider === providerFilter)
      && (!q || m.name.toLowerCase().includes(q) || m.model_id.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)));
  }, [all, view, search, providerFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = all.find((m) => m.id === selectedId) ?? null;

  // Bản cũ đặt mặc định nhưng không bỏ cờ model mặc định cũ → có thể có nhiều model mặc định
  const setDefault = (m: AIModel) => {
    all.filter((x) => x.is_default && x.id !== m.id).forEach((x) => updateModel.mutate({ id: x.id, is_default: false }));
    updateModel.mutate({ id: m.id, is_default: true });
  };
  const save = () => {
    if (!draft) return;
    if (draft.id) updateModel.mutate({ id: draft.id, name: draft.name, max_tokens: draft.max_tokens, temperature: draft.temperature, description: draft.description, capabilities: draft.capabilities }, { onSuccess: () => setDraft(null) });
    else { const { id: _o, ...rest } = draft; void _o; createModel.mutate({ ...rest, is_active: true, is_default: false }, { onSuccess: () => setDraft(null) }); }
  };
  const toggleCap = (c: string) => setDraft((d) => (d ? { ...d, capabilities: d.capabilities.includes(c) ? d.capabilities.filter((x) => x !== c) : [...d.capabilities, c] } : d));

  const doFetch = async () => {
    const p = provs.find((x) => x.slug === fetchSlug);
    if (!p) { toast.error('Chọn provider'); return; }
    setFetching(true); setFetched([]);
    try {
      const result = await fetchModelsFromProvider(p, fetchUrl || undefined);
      const existing = new Set(all.map((m) => m.model_id));
      const fresh = result.filter((m) => !existing.has(m.id));
      setFetched(fresh);
      toast.success(`Tìm thấy ${result.length} model (${fresh.length} chưa import)`);
    } catch (err) { toast.error(`Lỗi khi lấy model: ${(err as Error).message}`); } finally { setFetching(false); }
  };
  const importModel = (m: FetchedModel) => createModel.mutate({ name: m.name, model_id: m.id, provider: m.provider_slug, description: m.description || `Auto-imported from ${m.provider_slug}`, max_tokens: m.context_length ? Math.min(m.context_length, 32768) : 4096, temperature: 0.7, capabilities: m.capabilities || ['chat'], is_active: true, is_default: false },
    { onSuccess: () => setFetched((prev) => prev.filter((x) => x.id !== m.id)) });

  const runTest = async () => {
    const m = all.find((x) => x.id === testModelId);
    if (!m) return;
    setTesting(true); setTestResponse('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', { body: { messages: [{ role: 'user', content: testPrompt }], model: m.model_id } });
      if (error) throw error;
      const d = data as { response?: string; message?: string } | null;
      setTestResponse(d?.response || d?.message || 'Không nhận được phản hồi');
    } catch (err) { setTestResponse(`Lỗi: ${(err as Error).message || 'Không thử được model'}`); } finally { setTesting(false); }
  };

  const donut = providerSlugs.map((s, i) => ({ id: s, name: provName(s), value: all.filter((m) => m.provider === s).length, color: provs.find((p) => p.slug === s)?.color || PALETTE[i % PALETTE.length] }));
  const capCounts = CAPABILITIES.map((c) => ({ label: c, value: all.filter((m) => (m.capabilities ?? []).includes(c)).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Theo provider" hint={`${providerSlugs.length} provider`} />
        {donut.length ? <Donut size={130} data={donut} center={<span><span className="block text-[11px] text-muted-foreground">model</span><span className="block text-[18px] font-extrabold">{all.length}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa có model.</p>}
      </Surface>
      <Surface className="p-4"><SectionTitle title="Năng lực phổ biến" /><CountBars items={capCounts} /></Surface>
      <MascotCard mascot="ori" pose="learn" title="Model mặc định" quote={defaultModel ? `${defaultModel.name} đang được dùng khi tính năng không chỉ định model.` : 'Hãy đặt một model mặc định cho các tính năng AI.'} />
    </div>
  );
  const detail = selected && (
    <ModelDetail key={selected.id} model={selected} providerName={provName(selected.provider)} inPanel={isXl} onClose={() => setSelectedId(null)}
      onToggle={() => updateModel.mutate({ id: selected.id, is_active: !selected.is_active })} onDefault={() => setDefault(selected)}
      onEdit={() => setDraft({ ...selected, capabilities: [...(selected.capabilities ?? [])] })} onDelete={() => setConfirmDelete(selected)}
      onTest={() => { setTestModelId(selected.id); setView('test'); }} />
  );
  const side = isXl && detail ? detail : overviewSide;

  const fetchCard = (
    <Surface className="p-3 sm:p-4">
      <div className="px-1"><SectionTitle title="Lấy model từ provider" hint="tự động thu thập" /></div>
      <div className={cn('flex gap-2', isMobile && 'flex-col')}>
        <Select value={fetchSlug} onValueChange={(v) => { setFetchSlug(v); setFetchUrl(''); setFetched([]); }}>
          <SelectTrigger className={cn('h-10 rounded-full bg-card', !isMobile && 'w-[200px]')}><SelectValue placeholder="Chọn provider" /></SelectTrigger>
          <SelectContent>{provs.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <input className={cn(fieldCls, 'h-10 rounded-full font-mono text-[12.5px]', !isMobile && 'flex-1')} value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} placeholder={provs.find((p) => p.slug === fetchSlug)?.base_url || 'Base URL (tùy chọn)'} aria-label="Base URL" />
        <div className="flex gap-2">
          <Button className="h-10 rounded-full px-4 flex-1" onClick={doFetch} disabled={fetching}>{fetching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}Lấy model</Button>
          {fetched.length > 0 && <Button variant="outline" className="h-10 rounded-full px-3" onClick={() => fetched.forEach(importModel)}><Download className="h-4 w-4 mr-1" />{fetched.length}</Button>}
        </div>
      </div>
      {fetched.length > 0 && (
        <div className="mt-3 rounded-2xl border border-dashed border-primary/30 divide-y divide-border/50 max-h-64 overflow-auto">
          {fetched.slice(0, 50).map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold truncate">{m.name}</p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap"><span className="text-[10.5px] text-muted-foreground font-mono truncate max-w-[220px]">{m.id}</span>{m.context_length ? <Pill>{fmtTokens(m.context_length)}</Pill> : null}{(m.capabilities ?? []).slice(0, 2).map((c) => <Pill key={c} tone="violet">{c}</Pill>)}</div>
              </div>
              <Button size="sm" variant="outline" className="h-7 rounded-full text-[11.5px]" onClick={() => importModel(m)}><Plus className="h-3 w-3 mr-0.5" />Import</Button>
            </div>
          ))}
          {fetched.length > 50 && <p className="px-3 py-2 text-center text-[11.5px] text-muted-foreground">+{fetched.length - 50} model khác</p>}
        </div>
      )}
    </Surface>
  );

  const testCard = (
    <Surface className="p-3 sm:p-4">
      <div className="px-1"><SectionTitle title="Thử model" hint="gọi qua chức năng ai-coach" /></div>
      <div className="space-y-3">
        <Field label="Model">
          <Select value={testModelId} onValueChange={setTestModelId}>
            <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue placeholder="Chọn model đang bật" /></SelectTrigger>
            <SelectContent>{active.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} · {provName(m.provider)}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Prompt thử"><textarea className={areaCls} rows={3} value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} placeholder="Nhập prompt..." /></Field>
        <Button className="h-10 rounded-full px-5" onClick={runTest} disabled={!testModelId || !testPrompt.trim() || testing}>{testing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}Chạy thử</Button>
        {(testResponse || testing) && (
          <div className="rounded-2xl bg-secondary/50 p-3">
            <p className="text-[11.5px] font-semibold text-muted-foreground mb-1">Phản hồi</p>
            {testing ? <Skeleton className="h-16 w-full rounded-xl" /> : <p className={cn('text-[13px] whitespace-pre-wrap', testResponse.startsWith('Lỗi') && 'text-destructive')}>{testResponse}</p>}
          </div>
        )}
      </div>
    </Surface>
  );

  const d = draft;
  return (
    <Page>
      <PageHeader title="Model AI" subtitle="Cấu hình model, năng lực, model mặc định và thử nhanh"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm model..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setDraft({ ...EMPTY })}><Plus className="h-4 w-4 mr-1.5" />Thêm model</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: all.length }, { id: 'active', label: 'Đang bật', count: active.length }, { id: 'inactive', label: 'Đang tắt', count: all.length - active.length }, { id: 'test', label: 'Thử model' }]} value={view} onChange={(v) => { setView(v); setPage(0); }} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="learn" title="Thư viện model" subtitle={all.length ? `${active.length}/${all.length} model đang bật · mặc định: ${defaultModel?.name ?? 'chưa đặt'}.` : 'Thêm hoặc lấy model từ provider.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setDraft({ ...EMPTY })}><Plus className="h-4 w-4 mr-1.5" />Model mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Bot className="h-5 w-5" />} tint="violet" value={all.length} label="Tổng model" hint={`${providerSlugs.length} provider`} onClick={() => setView('all')} active={view === 'all'} />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={active.length} label="Đang bật" hint="dùng được" onClick={() => setView('active')} active={view === 'active'} />
            <StatTile icon={<Star className="h-5 w-5" />} tint="amber" value={<span className="block text-[15px] leading-tight whitespace-normal line-clamp-2">{defaultModel?.name ?? '—'}</span>} label="Mặc định" />
            <StatTile icon={<Sparkles className="h-5 w-5" />} tint="sky" value={all.filter((m) => (m.capabilities ?? []).includes('reasoning')).length} label="Suy luận" hint="reasoning" />
          </div>

          {view === 'test' ? testCard : (<>
            {fetchCard}
            <Surface className="p-3 sm:p-4">
              <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
                <SectionTitle title="Danh sách model" hint={`${filtered.length} model`} className="mb-0" />
                <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setPage(0); }}>
                  <SelectTrigger className={cn('h-9 rounded-full bg-card', isMobile ? 'w-full' : 'ml-auto w-[170px]')}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Mọi provider</SelectItem>{providerSlugs.map((s) => <SelectItem key={s} value={s}>{provName(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
                : filtered.length === 0 ? <EmptyState mascot="ori" pose="learn" compact title={all.length ? 'Không tìm thấy model' : 'Chưa có model'} description={all.length ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Thêm thủ công hoặc lấy từ provider.'} />
                : isMobile ? (
                  <div className="divide-y divide-border/50">
                    {paged.map((m) => (
                      <div key={m.id} role="button" tabIndex={0} onClick={() => setSelectedId(m.id)} className={cn('flex items-center gap-3 px-1 py-3', !m.is_active && 'opacity-60')}>
                        <span className="h-10 w-10 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0"><Cpu className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold truncate flex items-center gap-1.5">{m.name}{m.is_default && <Star className="h-3.5 w-3.5 text-[#F5A524] fill-current shrink-0" />}</p>
                          <p className="text-[11.5px] text-muted-foreground font-mono truncate">{m.model_id}</p>
                          <div className="flex items-center gap-1.5 mt-1"><Pill>{provName(m.provider)}</Pill><Pill tone="blue">{fmtTokens(m.max_tokens)}</Pill></div>
                        </div>
                        <span onClick={(e) => e.stopPropagation()}><Switch checked={m.is_active} onCheckedChange={() => updateModel.mutate({ id: m.id, is_active: !m.is_active })} aria-label={`Bật ${m.name}`} /></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <GridHead cols={COLS}><span>Model</span><span>Provider</span><span>Max tokens</span><span>Temp</span><span>Năng lực</span><span>Bật</span><span /></GridHead>
                    {paged.map((m) => (
                      <GridRow key={m.id} cols={COLS} onClick={() => setSelectedId(m.id)} active={selectedId === m.id} className={cn(!m.is_active && 'opacity-70')}>
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="h-9 w-9 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0"><Cpu className="h-[18px] w-[18px]" /></span>
                          <div className="min-w-0"><p className="text-[13.5px] font-semibold truncate flex items-center gap-1.5">{m.name}{m.is_default && <Pill tone="violet" className="shrink-0" icon={<Star className="h-3 w-3 fill-current" />}>Mặc định</Pill>}</p><p className="text-[11px] text-muted-foreground font-mono truncate">{m.model_id}</p></div>
                        </div>
                        <span className="text-[12.5px] truncate">{provName(m.provider)}</span>
                        <span className="text-[12.5px] tabular-nums">{m.max_tokens.toLocaleString()}</span>
                        <span className="text-[12.5px] tabular-nums">{m.temperature}</span>
                        <span className="flex gap-1 min-w-0 overflow-hidden">{(m.capabilities ?? []).slice(0, 2).map((c) => <Pill key={c} tone="violet">{c}</Pill>)}{(m.capabilities ?? []).length > 2 && <Pill>+{m.capabilities.length - 2}</Pill>}</span>
                        <span onClick={(e) => e.stopPropagation()}><Switch checked={m.is_active} onCheckedChange={() => updateModel.mutate({ id: m.id, is_active: !m.is_active })} aria-label={`Bật ${m.name}`} /></span>
                        <RowMenu items={[
                          { label: 'Đặt làm mặc định', icon: <Star />, onClick: () => setDefault(m), hidden: m.is_default },
                          { label: 'Cấu hình', icon: <Pencil />, onClick: () => setDraft({ ...m, capabilities: [...(m.capabilities ?? [])] }) },
                          { label: 'Thử model', icon: <Play />, onClick: () => { setTestModelId(m.id); setView('test'); }, hidden: !m.is_active },
                          { label: 'Xóa model', icon: <Trash2 />, onClick: () => setConfirmDelete(m), danger: true, separator: true },
                        ]} />
                      </GridRow>
                    ))}
                  </div>
                )}
              {filtered.length > 0 && <Pager page={safePage} pages={pages} total={filtered.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
            </Surface>
          </>)}
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && <Fab onClick={() => setDraft({ ...EMPTY })} label="Thêm model" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title="Chi tiết model">{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={!!d} onOpenChange={(o) => !o && setDraft(null)} title={d?.id ? `Cấu hình ${d.name}` : 'Thêm model'}>
        {d && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên model *"><input className={fieldCls} value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} placeholder="VD: GPT-5 Mini" autoFocus /></Field>
              <Field label="Model ID *"><input className={cn(fieldCls, 'font-mono text-[13px]', d.id && 'opacity-60')} value={d.model_id} disabled={!!d.id} onChange={(e) => setDraft({ ...d, model_id: e.target.value })} placeholder="openai/gpt-5-mini" /></Field>
            </div>
            <Field label="Provider">
              <input className={cn(fieldCls, d.id && 'opacity-60')} list="admin-model-providers" value={d.provider} disabled={!!d.id} onChange={(e) => setDraft({ ...d, provider: e.target.value })} placeholder="VD: lovable" />
              <datalist id="admin-model-providers">{provs.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</datalist>
            </Field>
            <Field label={`Max tokens: ${d.max_tokens.toLocaleString()}`}><Slider value={[d.max_tokens]} min={256} max={32768} step={256} onValueChange={([v]) => setDraft({ ...d, max_tokens: v })} /></Field>
            <Field label={`Temperature: ${d.temperature}`}><Slider value={[d.temperature]} min={0} max={2} step={0.1} onValueChange={([v]) => setDraft({ ...d, temperature: Math.round(v * 10) / 10 })} /></Field>
            <Field label="Mô tả"><textarea className={areaCls} rows={2} value={d.description ?? ''} onChange={(e) => setDraft({ ...d, description: e.target.value })} placeholder="Mô tả model..." /></Field>
            <Field label="Năng lực">
              <div className="flex flex-wrap gap-1.5">{CAPABILITIES.map((c) => { const on = d.capabilities.includes(c); return <button type="button" key={c} onClick={() => toggleCap(c)} className={cn('rounded-full px-2.5 py-1 text-[12px] font-semibold border transition-colors', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/40')}>{c}</button>; })}</div>
            </Field>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setDraft(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!d.name || !d.model_id || updateModel.isPending || createModel.isPending}>{d.id ? 'Lưu thay đổi' : 'Thêm model'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)} title={`Xóa model ${confirmDelete?.name ?? ''}?`} description="Các prompt đang gắn model này sẽ quay về model mặc định."
        onConfirm={() => { if (confirmDelete) deleteModel.mutate(confirmDelete.id, { onSuccess: () => setSelectedId(null) }); setConfirmDelete(null); }} />
    </Page>
  );
}

function ModelDetail({ model, providerName, inPanel, onClose, onToggle, onDefault, onEdit, onDelete, onTest }: {
  model: AIModel; providerName: string; inPanel: boolean; onClose: () => void; onToggle: () => void; onDefault: () => void; onEdit: () => void; onDelete: () => void; onTest: () => void;
}) {
  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-[52px] w-[52px] rounded-2xl grid place-items-center bg-primary/10 text-primary shrink-0"><Cpu className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold truncate">{model.name}</p>
          <p className="text-[11.5px] text-muted-foreground font-mono truncate">{model.model_id}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap"><Pill tone={model.is_active ? 'green' : 'gray'}>{model.is_active ? 'Đang bật' : 'Đang tắt'}</Pill>{model.is_default && <Pill tone="violet" icon={<Star className="h-3 w-3 fill-current" />}>Mặc định</Pill>}</div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      {model.description && <p className="text-[12.5px] text-muted-foreground">{model.description}</p>}
      <div className="grid grid-cols-2 gap-2"><MiniStat label="Max tokens" value={model.max_tokens.toLocaleString()} /><MiniStat label="Temperature" value={model.temperature} /></div>
      <div className="rounded-2xl bg-secondary/40 px-3 py-1.5"><InfoRow label="Provider" value={providerName} /><InfoRow label="Slug provider" value={<span className="font-mono text-[11.5px]">{model.provider}</span>} /></div>
      <div><p className="text-[12px] font-semibold text-muted-foreground mb-1.5">Năng lực</p><div className="flex flex-wrap gap-1.5">{(model.capabilities ?? []).length ? model.capabilities.map((c) => <Pill key={c} tone="violet">{c}</Pill>) : <span className="text-[12px] text-muted-foreground">Chưa khai báo</span>}</div></div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-10 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1.5" />Cấu hình</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onTest} disabled={!model.is_active}><Play className="h-4 w-4 mr-1.5" />Thử</Button>
        {!model.is_default && <Button variant="outline" className="h-10 rounded-full" onClick={onDefault}><Star className="h-4 w-4 mr-1.5" />Mặc định</Button>}
        <Button variant="outline" className="h-10 rounded-full" onClick={onToggle}>{model.is_active ? 'Tắt model' : 'Bật model'}</Button>
        <Button variant="outline" className="h-10 rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1.5" />Xóa</Button>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
