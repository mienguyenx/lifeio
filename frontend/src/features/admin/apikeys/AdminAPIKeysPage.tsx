// Module 28 — Admin: API key & bí mật (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminAPIKeys.tsx (bản cũ: /admin/api-keys/classic)
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, KeyRound, Pencil, Plus, ShieldCheck, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, ProgressBar, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls } from '@/components/lio/form';
import { useAIProviders } from '@/hooks/useAdminData';
import { useAdminApiKeys, useDeleteApiKey, useSaveApiKey, useSetPrimaryApiKey, useToggleApiKey, maskKey, type AdminApiKey } from '@/hooks/useAdminApiKeys';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ConfirmDialog, CountBars, GridHead, GridRow, InfoRow, MiniStat, Pager, Pill, RowMenu, ToggleRow, fmtDate, useIsXl } from '../shared';

// Danh sách provider của bản cũ + các provider khai báo trong Nhà cung cấp AI
const BASE_PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'perplexity', label: 'Perplexity AI' },
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'anthropic-compatible', label: 'Anthropic Compatible' },
];
const WITH_BASE_URL = ['openai-compatible', 'anthropic-compatible'];
const COLS = 'minmax(0,1.7fr) minmax(0,0.9fr) minmax(0,1.1fr) 52px 92px 56px 40px';
type Status = 'all' | 'active' | 'inactive' | 'errors';
type Form = { id?: string; provider: string; name: string; api_key: string; base_url: string; model: string; is_active: boolean; is_primary: boolean; limit_per_day: string; limit_per_month: string; originalKey?: string };
const EMPTY: Form = { provider: 'gemini', name: '', api_key: '', base_url: '', model: '', is_active: true, is_primary: false, limit_per_day: '', limit_per_month: '' };
const pct = (a: number, b?: number | null) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);

export default function AdminAPIKeysPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const { data: keysData, isLoading } = useAdminApiKeys();
  const { data: providers } = useAIProviders();
  const saveKey = useSaveApiKey();
  const toggleKey = useToggleApiKey();
  const setPrimary = useSetPrimaryApiKey();
  const deleteKey = useDeleteApiKey();

  const [provider, setProvider] = useState('all');
  const [status, setStatus] = useState<Status>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminApiKey | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const keys = useMemo(() => keysData ?? [], [keysData]);
  const providerOptions = useMemo(() => {
    const m = new Map(BASE_PROVIDERS.map((p) => [p.value, p.label]));
    (providers ?? []).forEach((p) => { if (!m.has(p.slug)) m.set(p.slug, p.name); });
    keys.forEach((k) => { if (!m.has(k.provider)) m.set(k.provider, k.provider); });
    return [...m.entries()].map(([value, label]) => ({ value, label }));
  }, [providers, keys]);
  const provLabel = (v: string) => providerOptions.find((p) => p.value === v)?.label ?? v;
  const usedProviders = [...new Set(keys.map((k) => k.provider))];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return keys.filter((k) => (provider === 'all' || k.provider === provider)
      && (status === 'all' || (status === 'active' ? k.is_active : status === 'inactive' ? !k.is_active : k.error_count > 0))
      && (!q || k.name.toLowerCase().includes(q) || k.provider.toLowerCase().includes(q)));
  }, [keys, provider, status, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = keys.find((k) => k.id === selectedId) ?? null;

  const openCreate = () => setForm({ ...EMPTY, provider: provider !== 'all' ? provider : 'gemini' });
  const openEdit = (k: AdminApiKey) => setForm({ id: k.id, provider: k.provider, name: k.name, api_key: k.api_key, originalKey: k.api_key, base_url: k.metadata?.base_url || '', model: k.metadata?.model || '', is_active: k.is_active, is_primary: k.is_primary, limit_per_day: k.limit_per_day?.toString() || '', limit_per_month: k.limit_per_month?.toString() || '' });
  const submit = () => {
    if (!form) return;
    if (!form.name || !form.api_key) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    // Bản cũ không xóa được giới hạn khi để trống lúc sửa — gửi null để bỏ giới hạn
    saveKey.mutate({
      id: form.id, provider: form.provider, name: form.name, is_active: form.is_active, is_primary: form.is_primary,
      metadata: { ...(form.base_url && { base_url: form.base_url }), ...(form.model && { model: form.model }) },
      ...(!form.id || form.api_key !== form.originalKey ? { api_key: form.api_key } : {}),
      limit_per_day: form.limit_per_day ? parseInt(form.limit_per_day) : null,
      limit_per_month: form.limit_per_month ? parseInt(form.limit_per_month) : null,
    }, { onSuccess: () => setForm(null) });
  };
  const copyKey = (k: AdminApiKey) => { navigator.clipboard.writeText(k.api_key); toast.success('Đã sao chép key'); };

  const totalUsage = keys.reduce((a, k) => a + (k.usage_count || 0), 0);
  const withErrors = keys.filter((k) => k.error_count > 0);
  const nearLimit = keys.filter((k) => (k.limit_per_day && pct(k.current_usage_today, k.limit_per_day) >= 80) || (k.limit_per_month && pct(k.current_usage_month, k.limit_per_month) >= 80));
  const missingPrimary = usedProviders.filter((p) => !keys.some((k) => k.provider === p && k.is_primary && k.is_active));
  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4"><SectionTitle title="Key theo provider" hint={`${usedProviders.length} provider`} /><CountBars items={usedProviders.map((p) => ({ label: provLabel(p), value: keys.filter((k) => k.provider === p).length }))} empty="Chưa có API key." /></Surface>
      <Surface className="p-4">
        <SectionTitle title="Cần chú ý" />
        <div className="space-y-2">
          {missingPrimary.map((p) => <div key={p} className="flex items-center gap-2 text-[12.5px]"><AlertTriangle className="h-4 w-4 text-[#B7791F] shrink-0" /><span className="flex-1 truncate">{provLabel(p)} chưa có key chính đang bật</span></div>)}
          {nearLimit.map((k) => <button key={k.id} onClick={() => setSelectedId(k.id)} className="w-full flex items-center gap-2 text-[12.5px] text-left hover:underline"><AlertTriangle className="h-4 w-4 text-[#B7791F] shrink-0" /><span className="flex-1 truncate">{k.name} sắp chạm giới hạn</span></button>)}
          {withErrors.slice(0, 4).map((k) => <button key={k.id} onClick={() => setSelectedId(k.id)} className="w-full flex items-center gap-2 text-[12.5px] text-left hover:underline"><AlertTriangle className="h-4 w-4 text-destructive shrink-0" /><span className="flex-1 truncate">{k.name}: {k.error_count} lỗi</span></button>)}
          {!missingPrimary.length && !nearLimit.length && !withErrors.length && <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground"><ShieldCheck className="h-4 w-4 text-[#1F9D63]" />Mọi key đều ổn.</p>}
        </div>
      </Surface>
      <MascotCard mascot="taro" pose="care" title="Giữ bí mật an toàn" quote="Mỗi provider nên có một key chính; thêm key phụ để tự xoay vòng khi lỗi hoặc hết hạn mức." />
    </div>
  );
  const detail = selected && (
    <KeyDetail key={selected.id} k={selected} providerLabel={provLabel(selected.provider)} inPanel={isXl} revealed={!!reveal[selected.id]} onReveal={() => setReveal((r) => ({ ...r, [selected.id]: !r[selected.id] }))}
      onClose={() => setSelectedId(null)} onCopy={() => copyKey(selected)} onEdit={() => openEdit(selected)} onToggle={() => toggleKey.mutate({ id: selected.id, is_active: !selected.is_active })}
      onPrimary={() => setPrimary.mutate({ id: selected.id, provider: selected.provider })} onDelete={() => setConfirmDelete(selected)} />
  );
  const side = isXl && detail ? detail : overviewSide;
  const f = form;

  return (
    <Page>
      <PageHeader title="API key & bí mật" subtitle="Khóa truy cập cho Gemini, Perplexity và các dịch vụ AI khác"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm key..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm API key</Button>}
        </>} />
      <div className="mb-5 overflow-x-auto -mx-1 px-1"><SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: keys.length }, ...usedProviders.map((p) => ({ id: p, label: provLabel(p), count: keys.filter((k) => k.provider === p).length }))]} value={provider} onChange={(v) => { setProvider(v); setPage(0); }} /></div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="taro" pose="care" title="Kho khóa bí mật" subtitle={keys.length ? `${keys.filter((k) => k.is_active).length}/${keys.length} key đang bật · ${totalUsage.toLocaleString()} lượt gọi.` : 'Thêm API key để kích hoạt các tính năng AI.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Key mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<KeyRound className="h-5 w-5" />} tint="violet" value={keys.length} label="Tổng key" hint={`${usedProviders.length} provider`} onClick={() => setStatus('all')} active={status === 'all'} />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={keys.filter((k) => k.is_active).length} label="Đang bật" onClick={() => setStatus('active')} active={status === 'active'} />
            <StatTile icon={<Star className="h-5 w-5" />} tint="amber" value={keys.filter((k) => k.is_primary).length} label="Key chính" hint="ưu tiên gọi" />
            <StatTile icon={<AlertTriangle className="h-5 w-5" />} tint="rose" value={withErrors.length} label="Có lỗi" hint={`${keys.reduce((a, k) => a + (k.error_count || 0), 0)} lỗi`} onClick={() => setStatus('errors')} active={status === 'errors'} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
              <SectionTitle title="Danh sách API key" hint={`${filtered.length} key`} className="mb-0" />
              <SegmentedTabs size="sm" className={cn(!isMobile && 'ml-auto')} full={isMobile} items={[{ id: 'all', label: 'Tất cả' }, { id: 'active', label: 'Bật' }, { id: 'inactive', label: 'Tắt' }, { id: 'errors', label: 'Lỗi' }]} value={status} onChange={(v) => { setStatus(v); setPage(0); }} />
            </div>
            {isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
              : filtered.length === 0 ? <EmptyState mascot="taro" pose="care" compact title={keys.length ? 'Không có key phù hợp' : 'Chưa có API key'} description={keys.length ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Nhấn “Thêm API key” để bắt đầu.'} />
              : isMobile ? (
                <div className="divide-y divide-border/50">
                  {paged.map((k) => (
                    <div key={k.id} role="button" tabIndex={0} onClick={() => setSelectedId(k.id)} className={cn('flex items-center gap-3 px-1 py-3', !k.is_active && 'opacity-60')}>
                      <span className="h-10 w-10 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0"><KeyRound className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold truncate flex items-center gap-1.5">{k.name}{k.is_primary && <Star className="h-3.5 w-3.5 text-[#F5A524] fill-current shrink-0" />}</p>
                        <p className="text-[11.5px] text-muted-foreground font-mono truncate">{maskKey(k.api_key)}</p>
                        <div className="flex items-center gap-1.5 mt-1"><Pill>{provLabel(k.provider)}</Pill><Pill tone="blue">{k.usage_count || 0} lượt</Pill>{k.error_count > 0 && <Pill tone="red">{k.error_count} lỗi</Pill>}</div>
                      </div>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={k.is_active} onCheckedChange={(v) => toggleKey.mutate({ id: k.id, is_active: v })} aria-label={`Bật ${k.name}`} /></span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <GridHead cols={COLS}><span>Key</span><span>Provider</span><span>Sử dụng</span><span>Lỗi</span><span>Dùng gần nhất</span><span>Bật</span><span /></GridHead>
                  {paged.map((k) => (
                    <GridRow key={k.id} cols={COLS} onClick={() => setSelectedId(k.id)} active={selectedId === k.id} className={cn(!k.is_active && 'opacity-70')}>
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="h-9 w-9 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0"><KeyRound className="h-[18px] w-[18px]" /></span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold flex items-center gap-1 min-w-0"><span className="truncate">{k.name}</span>{k.is_primary && <Star className="h-3.5 w-3.5 text-[#F5A524] fill-current shrink-0" aria-label="Key chính" />}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{reveal[k.id] ? k.api_key : maskKey(k.api_key)}</p>
                        </div>
                      </div>
                      <span className="text-[12.5px] truncate">{provLabel(k.provider)}</span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold tabular-nums">{(k.usage_count || 0).toLocaleString()} lượt</span>
                        {k.limit_per_day ? <span className="flex items-center gap-1.5"><ProgressBar value={pct(k.current_usage_today, k.limit_per_day)} className="flex-1" height={4} color={pct(k.current_usage_today, k.limit_per_day) >= 80 ? '#F5A524' : undefined} /><span className="text-[10.5px] text-muted-foreground tabular-nums">{k.current_usage_today}/{k.limit_per_day}</span></span> : <span className="block text-[10.5px] text-muted-foreground">Không giới hạn/ngày</span>}
                      </span>
                      <span>{k.error_count > 0 ? <Pill tone="red">{k.error_count}</Pill> : <span className="text-[12px] text-muted-foreground">0</span>}</span>
                      <span className="text-[12px] text-muted-foreground">{k.last_used_at ? fmtDate(k.last_used_at, 'dd/MM HH:mm') : 'Chưa dùng'}</span>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={k.is_active} onCheckedChange={(v) => toggleKey.mutate({ id: k.id, is_active: v })} aria-label={`Bật ${k.name}`} /></span>
                      <RowMenu items={[
                        { label: reveal[k.id] ? 'Ẩn key' : 'Hiện key', icon: reveal[k.id] ? <EyeOff /> : <Eye />, onClick: () => setReveal((r) => ({ ...r, [k.id]: !r[k.id] })) },
                        { label: 'Sao chép key', icon: <Copy />, onClick: () => copyKey(k) },
                        { label: 'Đặt làm key chính', icon: <Star />, onClick: () => setPrimary.mutate({ id: k.id, provider: k.provider }), hidden: k.is_primary },
                        { label: 'Chỉnh sửa', icon: <Pencil />, onClick: () => openEdit(k) },
                        { label: 'Xóa key', icon: <Trash2 />, onClick: () => setConfirmDelete(k), danger: true, separator: true },
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
      {isMobile && <Fab onClick={openCreate} label="Thêm API key" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title="Chi tiết API key">{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={!!f} onOpenChange={(o) => !o && setForm(null)} title={f?.id ? 'Sửa API key' : 'Thêm API key'} description={f?.id ? 'Cập nhật thông tin API key' : 'Thêm API key mới cho dịch vụ AI'}>
        {f && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nhà cung cấp">
                <Select value={f.provider} onValueChange={(v) => setForm({ ...f, provider: v })} disabled={!!f.id}>
                  <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{providerOptions.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Tên (để phân biệt) *"><input className={fieldCls} value={f.name} onChange={(e) => setForm({ ...f, name: e.target.value })} placeholder="VD: Production 1" autoFocus /></Field>
            </div>
            <Field label="API key *"><input type="password" autoComplete="off" className={cn(fieldCls, 'font-mono text-[13px]')} value={f.api_key} onChange={(e) => setForm({ ...f, api_key: e.target.value })} placeholder="Nhập API key" /></Field>
            {WITH_BASE_URL.includes(f.provider) && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Base URL"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={f.base_url} onChange={(e) => setForm({ ...f, base_url: e.target.value })} placeholder="https://api.openai.com/v1" /></Field>
                <Field label="Model mặc định"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={f.model} onChange={(e) => setForm({ ...f, model: e.target.value })} placeholder="gpt-4o-mini" /></Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giới hạn / ngày"><input type="number" min={0} className={fieldCls} value={f.limit_per_day} onChange={(e) => setForm({ ...f, limit_per_day: e.target.value })} placeholder="Không giới hạn" /></Field>
              <Field label="Giới hạn / tháng"><input type="number" min={0} className={fieldCls} value={f.limit_per_month} onChange={(e) => setForm({ ...f, limit_per_month: e.target.value })} placeholder="Không giới hạn" /></Field>
            </div>
            <ToggleRow title="Đang bật" hint="Cho phép hệ thống dùng key này"><Switch checked={f.is_active} onCheckedChange={(v) => setForm({ ...f, is_active: v })} aria-label="Đang bật" /></ToggleRow>
            <ToggleRow title="Key chính" hint="Ưu tiên dùng trước; bỏ cờ key chính khác cùng provider"><Switch checked={f.is_primary} onCheckedChange={(v) => setForm({ ...f, is_primary: v })} aria-label="Key chính" /></ToggleRow>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setForm(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!f.name || !f.api_key || saveKey.isPending}>{f.id ? 'Cập nhật' : 'Thêm key'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)} title={`Xóa API key “${confirmDelete?.name ?? ''}”?`} description="Hành động này không thể hoàn tác. Tính năng đang dùng key sẽ chuyển sang key khác (nếu có)."
        onConfirm={() => { if (confirmDelete) deleteKey.mutate(confirmDelete.id, { onSuccess: () => setSelectedId(null) }); setConfirmDelete(null); }} />
    </Page>
  );
}

function KeyDetail({ k, providerLabel, inPanel, revealed, onReveal, onClose, onCopy, onEdit, onToggle, onPrimary, onDelete }: {
  k: AdminApiKey; providerLabel: string; inPanel: boolean; revealed: boolean; onReveal: () => void; onClose: () => void; onCopy: () => void; onEdit: () => void; onToggle: () => void; onPrimary: () => void; onDelete: () => void;
}) {
  const limitBar = (label: string, used: number, limit?: number | null) => (
    <div><div className="flex items-center justify-between text-[12.5px] mb-1"><span className="font-semibold">{label}</span><span className="tabular-nums">{limit ? `${used.toLocaleString()} / ${limit.toLocaleString()}` : `${used.toLocaleString()} · không giới hạn`}</span></div><ProgressBar value={limit ? pct(used, limit) : 0} height={8} color={limit && pct(used, limit) >= 80 ? '#F5A524' : undefined} /></div>
  );
  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-[52px] w-[52px] rounded-2xl grid place-items-center bg-primary/10 text-primary shrink-0"><KeyRound className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold truncate">{k.name}</p>
          <p className="text-[12.5px] text-muted-foreground truncate">{providerLabel}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap"><Pill tone={k.is_active ? 'green' : 'gray'}>{k.is_active ? 'Đang bật' : 'Đang tắt'}</Pill>{k.is_primary && <Pill tone="violet" icon={<Star className="h-3 w-3 fill-current" />}>Key chính</Pill>}</div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-secondary/50 px-3 py-2">
        <code className="text-[11.5px] font-mono truncate flex-1">{revealed ? k.api_key : maskKey(k.api_key)}</code>
        <IconButton label={revealed ? 'Ẩn key' : 'Hiện key'} onClick={onReveal}>{revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</IconButton>
        <IconButton label="Sao chép key" onClick={onCopy}><Copy className="h-3.5 w-3.5" /></IconButton>
      </div>
      <div className="grid grid-cols-2 gap-2"><MiniStat label="Tổng lượt gọi" value={(k.usage_count || 0).toLocaleString()} /><MiniStat label="Lỗi" value={k.error_count || 0} hint={k.last_error ? 'xem lỗi gần nhất' : undefined} /></div>
      <div className="space-y-3">{limitBar('Hôm nay', k.current_usage_today || 0, k.limit_per_day)}{limitBar('Tháng này', k.current_usage_month || 0, k.limit_per_month)}</div>
      {k.last_error && <div className="rounded-2xl bg-[#FFE4EA] dark:bg-rose-500/15 p-3"><p className="text-[11.5px] font-semibold text-[#E0445E] mb-0.5">Lỗi gần nhất</p><p className="text-[12px] break-words">{k.last_error}</p></div>}
      <div className="rounded-2xl bg-secondary/40 px-3 py-1.5">
        {k.metadata?.base_url && <InfoRow label="Base URL" value={<span className="font-mono text-[11.5px]">{k.metadata.base_url}</span>} />}
        {k.metadata?.model && <InfoRow label="Model mặc định" value={<span className="font-mono text-[11.5px]">{k.metadata.model}</span>} />}
        <InfoRow label="Dùng gần nhất" value={k.last_used_at ? fmtDate(k.last_used_at, 'dd/MM/yyyy HH:mm') : 'Chưa dùng'} />
        <InfoRow label="Tạo lúc" value={fmtDate(k.created_at)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-10 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
        {!k.is_primary ? <Button variant="outline" className="h-10 rounded-full" onClick={onPrimary}><Star className="h-4 w-4 mr-1.5" />Đặt chính</Button> : <Button variant="outline" className="h-10 rounded-full" onClick={onToggle}>{k.is_active ? 'Tắt key' : 'Bật key'}</Button>}
        {!k.is_primary && <Button variant="outline" className="h-10 rounded-full" onClick={onToggle}>{k.is_active ? 'Tắt key' : 'Bật key'}</Button>}
        <Button variant="outline" className="h-10 rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1.5" />Xóa</Button>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
