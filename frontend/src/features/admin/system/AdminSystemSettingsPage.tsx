// Module 29 — Admin: Cài đặt hệ thống (LIO kit, cùng khung admin với Module 20–28)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminSettings.tsx (bản cũ: /admin/settings/classic):
// đọc/sửa/thêm bản ghi admin_settings, gửi email thử (send-email). Form chi tiết theo nhóm (Telegram, Branding…) vẫn ở bản cũ.
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Bot, Boxes, CheckCircle2, Clock, Copy, Database, ExternalLink, Globe, LayoutGrid, Loader2, Mail, MessageCircle, Palette, Pencil, Plus, RefreshCw, Send, Settings2, Shield, Smartphone, Wrench, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface, TINTS, type Tint } from '@/components/lio';
import { Field, areaCls, fieldCls } from '@/components/lio/form';
import { useAdminSettings, useCreateAdminSetting, useUpdateAdminSetting, type AdminSetting } from '@/hooks/useAdminData';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import type { Json } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { GridHead, GridRow, InfoRow, Pager, Pill, RowMenu, ToggleRow, fmtDate, useIsXl } from '../shared';
import { groupOf, isSecretKey, type SettingGroup } from './settingsMeta';

const GROUPS: { id: SettingGroup; label: string; desc: string; icon: ReactNode; tint: Tint }[] = [
  { id: 'general', label: 'Chung', desc: 'Tên ứng dụng, ngôn ngữ, múi giờ, bảo trì', icon: <Globe className="h-5 w-5" />, tint: 'mint' },
  { id: 'security', label: 'Bảo mật', desc: 'Đăng ký, đăng nhập, giới hạn truy cập', icon: <Shield className="h-5 w-5" />, tint: 'amber' },
  { id: 'ai', label: 'AI', desc: 'Model mặc định, persona, ngữ cảnh', icon: <Bot className="h-5 w-5" />, tint: 'violet' },
  { id: 'email', label: 'Email', desc: 'SMTP, người gửi, mẫu tiêu đề', icon: <Mail className="h-5 w-5" />, tint: 'rose' },
  { id: 'telegram', label: 'Telegram', desc: 'Bot thông báo & mẫu tin nhắn', icon: <MessageCircle className="h-5 w-5" />, tint: 'sky' },
  { id: 'notifications', label: 'Thông báo', desc: 'Kênh & loại sự kiện thông báo', icon: <Bell className="h-5 w-5" />, tint: 'orange' },
  { id: 'appearance', label: 'Giao diện', desc: 'Theme, màu nhấn, branding', icon: <Palette className="h-5 w-5" />, tint: 'mint' },
  { id: 'data', label: 'Lưu trữ', desc: 'Sao lưu, dung lượng, thùng rác', icon: <Database className="h-5 w-5" />, tint: 'sky' },
  { id: 'pwa', label: 'PWA & SEO', desc: 'Cài đặt ứng dụng, meta tags', icon: <Smartphone className="h-5 w-5" />, tint: 'violet' },
  { id: 'dashboard', label: 'Dashboard', desc: 'Widget & bố cục mặc định', icon: <LayoutGrid className="h-5 w-5" />, tint: 'amber' },
  { id: 'advanced', label: 'Nâng cao', desc: 'Debug, mã tùy chỉnh, bật/tắt module', icon: <Wrench className="h-5 w-5" />, tint: 'rose' },
  { id: 'other', label: 'Khác', desc: 'Khóa chưa thuộc nhóm nào', icon: <Boxes className="h-5 w-5" />, tint: 'orange' },
];
const groupMeta = (g: SettingGroup) => GROUPS.find((x) => x.id === g)!;
const COLS = 'minmax(0,1.15fr) minmax(0,1fr) minmax(0,1.3fr) 96px 92px 40px';

type VType = 'boolean' | 'number' | 'text' | 'json';
const asBool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : null);
const typeOf = (v: unknown): VType => (asBool(v) !== null ? 'boolean' : typeof v === 'number' ? 'number' : v !== null && typeof v === 'object' ? 'json' : 'text');
const textOf = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v).replace(/^"|"$/g, ''));
const TYPE_LABEL: Record<VType, string> = { boolean: 'Bật/Tắt', number: 'Số', text: 'Văn bản', json: 'JSON' };

type Form = { mode: 'create' | 'edit'; key: string; type: VType; text: string; bool: boolean; description: string };

export default function AdminSystemSettingsPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isFetching } = useAdminSettings();
  const update = useUpdateAdminSetting();
  const create = useCreateAdminSetting();

  const [group, setGroup] = useState<'all' | SettingGroup>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  const settings = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const m = new Map<SettingGroup, number>();
    settings.forEach((s) => m.set(groupOf(s.key), (m.get(groupOf(s.key)) ?? 0) + 1));
    return m;
  }, [settings]);
  const usedGroups = GROUPS.filter((g) => counts.get(g.id));
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return settings.filter((s) => (group === 'all' || groupOf(s.key) === group)
      && (!q || s.key.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q) || (!isSecretKey(s.key) && textOf(s.value).toLowerCase().includes(q))));
  }, [settings, group, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = settings.find((s) => s.key === selectedKey) ?? null;

  const weekAgo = Date.now() - 7 * 864e5;
  const recent = settings.filter((s) => new Date(s.updated_at).getTime() >= weekAgo);
  const maintenance = asBool(settings.find((s) => s.key === 'maintenance_mode')?.value) === true;

  const setGroupTab = (g: 'all' | SettingGroup) => { setGroup(g); setPage(0); };
  const toggleBool = (s: AdminSetting, v: boolean) => update.mutate({ key: s.key, value: v });
  const openCreate = () => setForm({ mode: 'create', key: '', type: 'text', text: '', bool: false, description: '' });
  const openEdit = (s: AdminSetting) => { const t = typeOf(s.value); setForm({ mode: 'edit', key: s.key, type: t, text: t === 'json' ? JSON.stringify(s.value, null, 2) : textOf(s.value), bool: asBool(s.value) ?? false, description: s.description ?? '' }); };
  const parsed = (f: Form): { ok: true; value: Json } | { ok: false; error: string } => {
    if (f.type === 'boolean') return { ok: true, value: f.bool };
    if (f.type === 'number') { const n = Number(f.text); return f.text.trim() !== '' && Number.isFinite(n) ? { ok: true, value: n } : { ok: false, error: 'Giá trị phải là số' }; }
    if (f.type === 'json') { try { return { ok: true, value: JSON.parse(f.text || 'null') as Json }; } catch { return { ok: false, error: 'JSON không hợp lệ' }; } }
    return { ok: true, value: f.text };
  };
  const submit = () => {
    if (!form) return;
    const key = form.key.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(key)) { toast.error('Khóa chỉ gồm chữ thường, số và dấu gạch dưới'); return; }
    if (form.mode === 'create' && settings.some((s) => s.key === key)) { toast.error('Khóa này đã tồn tại'); return; }
    const p = parsed(form);
    if (p.ok === false) { toast.error(p.error); return; }
    if (form.mode === 'edit') update.mutate({ key, value: p.value }, { onSuccess: () => setForm(null) });
    else create.mutate({ key, value: p.value, description: form.description || undefined }, { onSuccess: () => { setForm(null); setSelectedKey(key); } });
  };
  const copyKey = (k: string) => { navigator.clipboard.writeText(k); toast.success('Đã sao chép khóa'); };
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }).then(() => toast.success('Đã làm mới cài đặt'));
  const val = (k: string, d = '') => textOf(settings.find((s) => s.key === k)?.value) || d;
  // Giữ nguyên nội dung email thử của bản cũ
  const sendTest = async () => {
    if (!testEmail) { toast.error('Nhập địa chỉ email nhận thử'); return; }
    setSending(true);
    try {
      const { data: res, error } = await supabase.functions.invoke<{ success?: boolean; message?: string }>('send-email', {
        body: {
          action: 'send', to: testEmail, subject: 'Test Email - SMTP Configuration',
          html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#6366f1;">🎉 SMTP Test Successful!</h1><p>This is a test email to verify your SMTP configuration is working correctly.</p><p><strong>Provider:</strong> ${val('email_provider', 'smtp')}</p><p><strong>Host:</strong> ${val('smtp_host', 'N/A')}</p><p><strong>Port:</strong> ${val('smtp_port', '587')}</p><p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p></div>`,
        },
      });
      if (error) throw error;
      if (res?.success) { toast.success('Đã gửi email thử — kiểm tra hộp thư'); setTestOpen(false); setTestEmail(''); }
      else toast.error(res?.message || 'Gửi email thử thất bại');
    } catch (e) { console.error('Test email error:', e); toast.error('Gửi email thử thất bại'); }
    finally { setSending(false); }
  };

  const valueCell = (s: AdminSetting, compact = false) => {
    const b = asBool(s.value);
    if (isSecretKey(s.key)) return <span className="font-mono text-[12px] text-muted-foreground">••••••••</span>;
    if (b !== null) return <Pill tone={b ? 'green' : 'gray'}>{b ? 'Bật' : 'Tắt'}</Pill>;
    const t = textOf(s.value);
    return t ? <span className={cn('font-mono text-[12px] truncate block', compact && 'max-w-[180px]')} title={t}>{t}</span> : <span className="text-[12px] text-muted-foreground">(trống)</span>;
  };

  const tools = (
    <Surface className="p-4">
      <SectionTitle title="Công cụ hệ thống" />
      <div className="space-y-2">
        {[
          { icon: <Send className="h-4 w-4" />, tint: 'rose' as Tint, title: 'Gửi email thử', hint: 'Kiểm tra cấu hình SMTP', label: 'Gửi thử', onClick: () => setTestOpen(true) },
          { icon: <Settings2 className="h-4 w-4" />, tint: 'violet' as Tint, title: 'Cấu hình chi tiết', hint: 'Form đầy đủ theo nhóm (Telegram, Branding…)', label: 'Mở', onClick: () => navigate(`/admin/settings/classic${group !== 'all' && group !== 'other' ? `#${group}` : ''}`) },
          { icon: <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />, tint: 'mint' as Tint, title: 'Làm mới dữ liệu', hint: 'Tải lại cài đặt từ máy chủ', label: 'Làm mới', onClick: refresh },
        ].map((t) => (
          <div key={t.title} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5">
            <span className={cn('h-9 w-9 rounded-xl grid place-items-center shrink-0', TINTS[t.tint].bg)} style={{ color: TINTS[t.tint].fg }}>{t.icon}</span>
            <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold truncate">{t.title}</p><p className="text-[11.5px] text-muted-foreground truncate">{t.hint}</p></div>
            <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-[12px] shrink-0" onClick={t.onClick}>{t.label}</Button>
          </div>
        ))}
      </div>
    </Surface>
  );
  const overviewSide = (
    <div className="space-y-4">
      {tools}
      <Surface className="p-4">
        <SectionTitle title="Cập nhật gần đây" hint="7 ngày" />
        {recent.length ? <div className="space-y-1">{[...recent].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5).map((s) => (
          <button key={s.id} onClick={() => setSelectedKey(s.key)} className="w-full flex items-center gap-2 py-1.5 text-left text-[12.5px] hover:underline">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="font-mono truncate flex-1">{s.key}</span><span className="text-muted-foreground shrink-0">{fmtDate(s.updated_at, 'dd/MM HH:mm')}</span>
          </button>
        ))}</div> : <p className="text-[12.5px] text-muted-foreground">Chưa có thay đổi trong 7 ngày.</p>}
      </Surface>
      <MascotCard mascot="ori" pose="idea" title="Thay đổi nhỏ, tác động lớn" quote="Cài đặt áp dụng cho toàn bộ người dùng — kiểm tra kỹ nhóm Bảo mật trước khi lưu." />
    </div>
  );
  const detail = selected && (
    <SettingDetail key={selected.key} s={selected} inPanel={isXl} valueNode={valueCell(selected)} onClose={() => setSelectedKey(null)} onEdit={() => openEdit(selected)} onCopy={() => copyKey(selected.key)}
      onToggle={asBool(selected.value) !== null ? (v) => toggleBool(selected, v) : undefined} />
  );
  const f = form;

  return (
    <Page>
      <PageHeader title="Cài đặt hệ thống" subtitle="Cấu hình nền tảng và kiểm soát các chức năng của LifeOS"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm khóa, mô tả..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm cài đặt</Button>}
        </>} />
      <div className="mb-5 overflow-x-auto -mx-1 px-1">
        <SegmentedTabs items={[{ id: 'all' as const, label: 'Tất cả', count: settings.length }, ...usedGroups.map((g) => ({ id: g.id, label: g.label, count: counts.get(g.id) }))]} value={group} onChange={setGroupTab} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Bảng điều khiển hệ thống"
            subtitle={settings.length ? `${settings.length} cài đặt trong ${usedGroups.length} nhóm${maintenance ? ' · đang bật chế độ bảo trì' : ''}.` : 'Chưa có cài đặt nào được lưu — thêm mới hoặc mở cấu hình chi tiết.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Cài đặt mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Settings2 className="h-5 w-5" />} tint="violet" value={settings.length} label="Tổng cài đặt" hint="đã lưu" onClick={() => setGroupTab('all')} active={group === 'all'} />
            <StatTile icon={<Boxes className="h-5 w-5" />} tint="mint" value={usedGroups.length} label="Nhóm cài đặt" hint={`/${GROUPS.length - 1} nhóm`} />
            <StatTile icon={<Clock className="h-5 w-5" />} tint="amber" value={recent.length} label="Mới cập nhật" hint="7 ngày qua" />
            <StatTile icon={<Shield className="h-5 w-5" />} tint="rose" value={counts.get('security') ?? 0} label="Cài đặt bảo mật" hint="cần lưu ý" onClick={() => setGroupTab('security')} active={group === 'security'} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="flex items-center gap-2 px-1 mb-3"><SectionTitle title={group === 'all' ? 'Tất cả cài đặt' : groupMeta(group).label} hint={`${filtered.length} khóa`} className="mb-0" /></div>
            {isLoading ? <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}</div>
              : filtered.length === 0 ? <EmptyState mascot="ori" pose="idea" compact title={settings.length ? 'Không có cài đặt phù hợp' : 'Chưa có cài đặt'} description={settings.length ? 'Thử đổi nhóm hoặc từ khóa.' : 'Nhấn “Thêm cài đặt” hoặc mở cấu hình chi tiết để tạo các khóa mặc định.'} />
              : isMobile ? (
                <div className="divide-y divide-border/50">
                  {paged.map((s) => {
                    const g = groupMeta(groupOf(s.key)); const b = asBool(s.value);
                    return (
                      <div key={s.id} role="button" tabIndex={0} onClick={() => setSelectedKey(s.key)} className="flex items-center gap-3 px-1 py-3">
                        <span className={cn('h-10 w-10 rounded-xl grid place-items-center shrink-0', TINTS[g.tint].bg)} style={{ color: TINTS[g.tint].fg }}>{g.icon}</span>
                        <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold font-mono truncate">{s.key}</p><div className="text-[12px] text-muted-foreground truncate">{b !== null ? (b ? 'Bật' : 'Tắt') : isSecretKey(s.key) ? '••••••••' : textOf(s.value) || '(trống)'}</div></div>
                        {b !== null && !isSecretKey(s.key) && <span onClick={(e) => e.stopPropagation()}><Switch checked={b} onCheckedChange={(v) => toggleBool(s, v)} aria-label={s.key} /></span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <GridHead cols={COLS}><span>Khóa</span><span>Giá trị</span><span>Mô tả</span><span>Nhóm</span><span>Cập nhật</span><span /></GridHead>
                  {paged.map((s) => {
                    const g = groupMeta(groupOf(s.key)); const b = asBool(s.value);
                    return (
                      <GridRow key={s.id} cols={COLS} onClick={() => setSelectedKey(s.key)} active={selectedKey === s.key}>
                        <span className="text-[12.5px] font-semibold font-mono truncate" title={s.key}>{s.key}</span>
                        <span className="min-w-0 flex items-center gap-2">{b !== null && !isSecretKey(s.key) ? <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-2"><Switch checked={b} onCheckedChange={(v) => toggleBool(s, v)} aria-label={s.key} /><span className="text-[12px] text-muted-foreground">{b ? 'Bật' : 'Tắt'}</span></span> : valueCell(s)}</span>
                        <span className="text-[12px] text-muted-foreground truncate" title={s.description ?? ''}>{s.description || '—'}</span>
                        <span><Pill tone="gray">{g.label}</Pill></span>
                        <span className="text-[12px] text-muted-foreground">{fmtDate(s.updated_at, 'dd/MM/yyyy')}</span>
                        <RowMenu items={[
                          { label: 'Chỉnh sửa', icon: <Pencil />, onClick: () => openEdit(s) },
                          { label: 'Sao chép khóa', icon: <Copy />, onClick: () => copyKey(s.key) },
                          { label: 'Mở cấu hình nhóm', icon: <ExternalLink />, onClick: () => navigate(`/admin/settings/classic#${groupOf(s.key) === 'other' ? 'general' : groupOf(s.key)}`), separator: true },
                        ]} />
                      </GridRow>
                    );
                  })}
                </div>
              )}
            {filtered.length > 0 && <Pager page={safePage} pages={pages} total={filtered.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
          </Surface>

          <div>
            <SectionTitle title="Nhóm cài đặt" hint="Chọn để lọc bảng" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {GROUPS.filter((g) => g.id !== 'other' || counts.get('other')).map((g) => (
                <button key={g.id} onClick={() => setGroupTab(g.id)} className={cn('text-left rounded-[22px] border bg-card p-4 shadow-soft transition hover:-translate-y-0.5', group === g.id ? 'border-primary ring-4 ring-primary/10' : 'border-border/60')}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={cn('h-9 w-9 rounded-xl grid place-items-center shrink-0', TINTS[g.tint].bg)} style={{ color: TINTS[g.tint].fg }}>{g.icon}</span>
                    <span className="min-w-0"><span className="block text-[13.5px] font-bold truncate">{g.label}</span><span className="block text-[11.5px] text-muted-foreground">{counts.get(g.id) ?? 0} cài đặt</span></span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-snug line-clamp-2">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{isXl && detail ? detail : overviewSide}</aside>}
      </div>
      {isMobile && <Fab onClick={openCreate} label="Thêm cài đặt" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedKey(null)} title="Chi tiết cài đặt">{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={!!f} onOpenChange={(o) => !o && setForm(null)} title={f?.mode === 'edit' ? 'Chỉnh sửa cài đặt' : 'Thêm cài đặt'} description={f?.mode === 'edit' ? 'Giá trị mới áp dụng cho toàn hệ thống' : 'Tạo khóa cấu hình mới trong admin_settings'}>
        {f && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Khóa cài đặt *"><input className={cn(fieldCls, 'font-mono text-[13px]')} value={f.key} disabled={f.mode === 'edit'} onChange={(e) => setForm({ ...f, key: e.target.value.toLowerCase() })} placeholder="vd: app_name" autoFocus={f.mode === 'create'} /></Field>
              <Field label="Kiểu giá trị">
                <Select value={f.type} onValueChange={(v) => setForm({ ...f, type: v as VType })}>
                  <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(TYPE_LABEL) as VType[]).map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            {f.type === 'boolean' ? <ToggleRow title="Giá trị" hint={f.bool ? 'Bật' : 'Tắt'}><Switch checked={f.bool} onCheckedChange={(v) => setForm({ ...f, bool: v })} aria-label="Giá trị" /></ToggleRow>
              : f.type === 'json' ? <Field label="Giá trị (JSON) *"><textarea rows={7} className={cn(areaCls, 'font-mono text-[12.5px]')} value={f.text} onChange={(e) => setForm({ ...f, text: e.target.value })} spellCheck={false} /></Field>
              : <Field label="Giá trị *"><input type={f.type === 'number' ? 'number' : isSecretKey(f.key) ? 'password' : 'text'} autoComplete="off" className={fieldCls} value={f.text} onChange={(e) => setForm({ ...f, text: e.target.value })} /></Field>}
            <Field label="Mô tả" hint={f.mode === 'edit' ? <span className="text-[11px] text-muted-foreground">chỉ đặt khi tạo</span> : undefined}><textarea rows={2} className={areaCls} value={f.description} disabled={f.mode === 'edit'} onChange={(e) => setForm({ ...f, description: e.target.value })} placeholder="Cài đặt này dùng để làm gì?" /></Field>
            <p className="text-[11.5px] text-muted-foreground">Nhóm: <b>{groupMeta(groupOf(f.key.trim())).label}</b> (tự xác định theo khóa)</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setForm(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!f.key.trim() || update.isPending || create.isPending}>{f.mode === 'edit' ? 'Lưu thay đổi' : 'Thêm cài đặt'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <AdaptiveModal open={testOpen} onOpenChange={setTestOpen} title="Gửi email thử" description="Gửi một email kiểm tra bằng cấu hình SMTP hiện tại">
        <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); sendTest(); }}>
          <Field label="Email nhận *"><input type="email" className={fieldCls} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="ban@vidu.com" autoFocus /></Field>
          <div className="rounded-2xl bg-secondary/40 px-3 py-1.5">
            <InfoRow label="Nhà cung cấp" value={val('email_provider', 'Chưa đặt')} />
            <InfoRow label="SMTP host" value={val('smtp_host', 'Chưa đặt')} />
            <InfoRow label="Cổng" value={val('smtp_port', '587')} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setTestOpen(false)}>Hủy</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={sending || !testEmail}>{sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}Gửi thử</Button>
          </div>
        </form>
      </AdaptiveModal>
    </Page>
  );
}

function SettingDetail({ s, inPanel, valueNode, onClose, onEdit, onCopy, onToggle }: { s: AdminSetting; inPanel: boolean; valueNode: ReactNode; onClose: () => void; onEdit: () => void; onCopy: () => void; onToggle?: (v: boolean) => void }) {
  const g = groupMeta(groupOf(s.key));
  const t = typeOf(s.value);
  const b = asBool(s.value);
  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className={cn('h-[52px] w-[52px] rounded-2xl grid place-items-center shrink-0', TINTS[g.tint].bg)} style={{ color: TINTS[g.tint].fg }}>{g.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold font-mono truncate">{s.key}</p>
          <p className="text-[12.5px] text-muted-foreground line-clamp-2">{s.description || 'Chưa có mô tả'}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap"><Pill tone="violet">{g.label}</Pill><Pill>{TYPE_LABEL[t]}</Pill>{isSecretKey(s.key) && <Pill tone="amber">Nhạy cảm</Pill>}</div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      <div>
        <p className="text-[12px] font-semibold text-muted-foreground mb-1.5">Giá trị hiện tại</p>
        {b !== null && onToggle && !isSecretKey(s.key) ? <ToggleRow title={b ? 'Đang bật' : 'Đang tắt'} hint="Áp dụng ngay khi chuyển"><Switch checked={b} onCheckedChange={onToggle} aria-label={s.key} /></ToggleRow>
          : t === 'json' && !isSecretKey(s.key) ? <pre className="rounded-2xl bg-secondary/50 p-3 text-[11.5px] font-mono overflow-auto max-h-[240px] whitespace-pre-wrap break-all">{JSON.stringify(s.value, null, 2)}</pre>
          : <div className="rounded-2xl bg-secondary/50 px-3 py-2.5 min-w-0">{valueNode}</div>}
      </div>
      <div className="rounded-2xl bg-secondary/40 px-3 py-1.5">
        <InfoRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Nhóm" value={g.label} />
        <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Cập nhật lần cuối" value={fmtDate(s.updated_at, 'dd/MM/yyyy HH:mm')} />
        <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Tạo lúc" value={fmtDate(s.created_at, 'dd/MM/yyyy HH:mm')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-10 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onCopy}><Copy className="h-4 w-4 mr-1.5" />Sao chép khóa</Button>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
