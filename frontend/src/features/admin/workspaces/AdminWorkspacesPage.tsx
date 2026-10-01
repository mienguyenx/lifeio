// Module 21 — Admin: Workspace & thành viên (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminWorkspaces.tsx (bản cũ: /admin/workspaces/classic)
import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowRightLeft, Building2, Check, Crown, Mail, MoreHorizontal, Pencil, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut, GroupedBars, TrendArea } from '@/components/lio/charts';
import { Field, areaCls, fieldCls } from '@/components/lio/form';
import { useAllProfiles } from '@/hooks/useAdminData';
import {
  useWorkspaces, useWorkspaceMembers, useWorkspaceInvitations, useWorkspaceStats, useWorkspaceAnalytics,
  useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace, useAddWorkspaceMember, useUpdateMemberRole,
  useRemoveWorkspaceMember, useCreateInvitation, useDeleteInvitation, useTransferOwnership, type Workspace,
} from '@/hooks/useAdminWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { GridHead, GridRow, InfoRow, Pager, Pill, ROLE_META, RolePill, UserAvatar, asProfiles, monthlyCounts } from '../shared';

type StatusFilter = 'all' | 'active' | 'inactive';
type MemberRole = 'admin' | 'member' | 'viewer';
const COLS = 'minmax(0,1.5fr) minmax(0,1fr) 90px 104px 100px 40px';
const fmtDate = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy', { locale: vi }) : '—');
const slugify = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9-]/g, '-');

function useIsXl() {
  const [xl, setXl] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const on = () => setXl(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return xl;
}

function WsLogo({ ws, size = 36 }: { ws: Workspace; size?: number }) {
  return (
    <span className="rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 overflow-hidden" style={{ width: size, height: size }}>
      {ws.logo_url ? <img src={ws.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="h-[45%] w-[45%]" />}
    </span>
  );
}

export default function AdminWorkspacesPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const { user } = useAuth();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { data: profilesRaw } = useAllProfiles();
  const profiles = asProfiles(profilesRaw);
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Workspace | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', ownerId: '', maxMembers: '5' });

  const all = useMemo(() => workspaces ?? [], [workspaces]);
  const counts = { all: all.length, active: all.filter((w) => w.is_active).length, inactive: all.filter((w) => !w.is_active).length };
  const capacity = all.reduce((a, w) => a + (w.max_members || 5), 0);
  const filtered = useMemo(() => all.filter((w) => {
    const q = search.toLowerCase();
    const okQ = !q || w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q) || (w.owner?.email ?? '').toLowerCase().includes(q);
    const okS = status === 'all' || (status === 'active' ? w.is_active : !w.is_active);
    return okQ && okS;
  }), [all, search, status]);
  useEffect(() => { setPage(0); }, [search, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = all.find((w) => w.id === selectedId) ?? null;

  const submitCreate = () => {
    if (!form.name || !form.slug || !form.ownerId) return;
    createWorkspace.mutate({ name: form.name, slug: slugify(form.slug), description: form.description || undefined, owner_id: form.ownerId, max_members: parseInt(form.maxMembers) || 5 });
    setCreateOpen(false);
    setForm({ name: '', slug: '', description: '', ownerId: '', maxMembers: '5' });
  };

  const wsMenu = (w: Workspace) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => setSelectedId(w.id)}><Users className="h-4 w-4 mr-2" />Xem chi tiết</DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateWorkspace.mutate({ id: w.id, is_active: !w.is_active })}>{w.is_active ? <><X className="h-4 w-4 mr-2" />Vô hiệu hóa</> : <><Check className="h-4 w-4 mr-2" />Kích hoạt</>}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(w)}><Trash2 className="h-4 w-4 mr-2" />Xóa workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const growth = monthlyCounts(all.map((w) => w.created_at));
  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Trạng thái" hint={`${counts.all} workspace`} />
        {counts.all ? <Donut size={130} data={[{ id: 'a', name: 'Hoạt động', value: counts.active, color: '#22B07D' }, { id: 'i', name: 'Tạm dừng', value: counts.inactive, color: '#C4CAD4' }]} center={<span><span className="block text-[11px] text-muted-foreground">hoạt động</span><span className="block text-[18px] font-extrabold">{counts.active}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</p>}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Workspace mới theo tháng" />
        <TrendArea id="admin-ws-growth" data={growth} name="Workspace mới" height={150} color="#2F7BF6" />
      </Surface>
      <MascotCard mascot="taro" pose="care" title="Làm việc cùng nhau" quote="Mỗi workspace nên có ít nhất một Admin ngoài chủ sở hữu để không bị gián đoạn." />
    </div>
  );
  const detail = selected && <WorkspaceDetail key={selected.id} ws={selected} inPanel={isXl} currentUserId={user?.id} onClose={() => setSelectedId(null)} onDelete={() => setToDelete(selected)} />;

  return (
    <Page>
      <PageHeader title="Workspace" subtitle="Không gian làm việc, thành viên và lời mời"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm workspace, slug, chủ sở hữu..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Tạo workspace</Button>}
        </>} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'active', label: 'Hoạt động', count: counts.active }, { id: 'inactive', label: 'Tạm dừng', count: counts.inactive }]} value={status} onChange={setStatus} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="taro" pose="care" title="Không gian làm việc chung" subtitle={counts.all ? `${counts.all} workspace · ${counts.active} đang hoạt động.` : 'Tạo workspace đầu tiên cho một nhóm người dùng.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Workspace mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Building2 className="h-5 w-5" />} tint="violet" value={counts.all} label="Workspace" hint="tất cả" onClick={() => setStatus('all')} active={status === 'all'} />
            <StatTile icon={<Check className="h-5 w-5" />} tint="mint" value={counts.active} label="Hoạt động" hint="đang dùng" onClick={() => setStatus('active')} active={status === 'active'} />
            <StatTile icon={<X className="h-5 w-5" />} tint="rose" value={counts.inactive} label="Tạm dừng" hint="đã vô hiệu" onClick={() => setStatus('inactive')} active={status === 'inactive'} />
            <StatTile icon={<Users className="h-5 w-5" />} tint="sky" value={capacity} label="Sức chứa" hint="chỗ thành viên" />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Danh sách workspace" hint={`${filtered.length} mục`} /></div>
            {isLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState mascot="taro" compact title={all.length ? 'Không tìm thấy workspace' : 'Chưa có workspace'} description={all.length ? 'Thử đổi tab hoặc từ khóa.' : 'Nhấn “Tạo workspace” để bắt đầu.'} action={!all.length ? <Button className="rounded-full" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Tạo workspace</Button> : undefined} />
            ) : isMobile ? (
              <div className="divide-y divide-border/50">
                {paged.map((w) => (
                  <div key={w.id} role="button" tabIndex={0} onClick={() => setSelectedId(w.id)} className="flex items-center gap-3 px-1 py-3">
                    <WsLogo ws={w} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold truncate">{w.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">/{w.slug} · {w.owner?.name || w.owner?.email || '—'}</p>
                      <div className="flex items-center gap-1.5 mt-1"><Pill tone={w.is_active ? 'green' : 'gray'}>{w.is_active ? 'Hoạt động' : 'Tạm dừng'}</Pill><Pill tone="blue" icon={<Users className="h-3 w-3" />}>{w.max_members || 5}</Pill></div>
                    </div>
                    {wsMenu(w)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <GridHead cols={COLS}><span>Workspace</span><span>Chủ sở hữu</span><span>Tối đa</span><span>Trạng thái</span><span>Ngày tạo</span><span /></GridHead>
                {paged.map((w) => (
                  <GridRow key={w.id} cols={COLS} onClick={() => setSelectedId(w.id)} active={selectedId === w.id}>
                    <div className="min-w-0 flex items-center gap-2.5"><WsLogo ws={w} /><div className="min-w-0"><p className="text-[13.5px] font-semibold truncate">{w.name}</p><p className="text-[12px] text-muted-foreground truncate">/{w.slug}</p></div></div>
                    <div className="min-w-0 flex items-center gap-2"><UserAvatar name={w.owner?.name} email={w.owner?.email} src={w.owner?.avatar_url} size={26} /><span className="text-[12.5px] truncate">{w.owner?.name || w.owner?.email || '—'}</span></div>
                    <span className="text-[12.5px] font-semibold">{w.max_members || 5} người</span>
                    <span><Pill tone={w.is_active ? 'green' : 'gray'}>{w.is_active ? 'Hoạt động' : 'Tạm dừng'}</Pill></span>
                    <span className="text-[12px] text-muted-foreground">{fmtDate(w.created_at)}</span>
                    {wsMenu(w)}
                  </GridRow>
                ))}
              </div>
            )}
            {filtered.length > 0 && <Pager page={safePage} pages={pages} total={filtered.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
          </Surface>
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{isXl && detail ? detail : overviewSide}</aside>}
      </div>
      {isMobile && <Fab onClick={() => setCreateOpen(true)} label="Tạo workspace" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title={selected?.name || 'Workspace'}>{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={createOpen} onOpenChange={setCreateOpen} title="Tạo workspace mới" description="Tạo không gian làm việc cho một nhóm người dùng">
        <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); submitCreate(); }}>
          <Field label="Tên workspace *"><input className={fieldCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} placeholder="VD: Dự án Marketing" autoFocus /></Field>
          <Field label="Slug *" hint="chỉ chữ thường, số và dấu -"><input className={fieldCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="du-an-marketing" /></Field>
          <Field label="Mô tả"><textarea className={areaCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn về workspace" /></Field>
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
            <Field label="Chủ sở hữu *">
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Chọn người sở hữu" /></SelectTrigger>
                <SelectContent>{profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Tối đa"><input type="number" min={1} className={fieldCls} value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!form.name || !form.slug || !form.ownerId || createWorkspace.isPending}>Tạo workspace</Button>
          </div>
        </form>
      </AdaptiveModal>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa workspace “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Toàn bộ thành viên và dữ liệu liên quan sẽ bị xóa. Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) { deleteWorkspace.mutate(toDelete.id); if (selectedId === toDelete.id) setSelectedId(null); } setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}

type WsTab = 'overview' | 'members' | 'invites' | 'analytics';

function WorkspaceDetail({ ws, inPanel, currentUserId, onClose, onDelete }: { ws: Workspace; inPanel: boolean; currentUserId?: string; onClose: () => void; onDelete: () => void }) {
  const [tab, setTab] = useState<WsTab>('overview');
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(ws.id);
  const { data: invitations } = useWorkspaceInvitations(ws.id);
  const { data: stats } = useWorkspaceStats(ws.id);
  const { data: analytics } = useWorkspaceAnalytics(ws.id);
  const { data: profilesRaw } = useAllProfiles();
  const profiles = asProfiles(profilesRaw);
  const updateWorkspace = useUpdateWorkspace();
  const addMember = useAddWorkspaceMember();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveWorkspaceMember();
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const transferOwnership = useTransferOwnership();

  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name: ws.name, description: ws.description || '', max: String(ws.max_members || 5) });
  const [newMember, setNewMember] = useState({ id: '', role: 'member' as MemberRole });
  const [invite, setInvite] = useState({ email: '', role: 'member' as MemberRole });
  const [newOwner, setNewOwner] = useState('');
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const memberIds = members?.map((m) => m.user_id) ?? [];
  const available = profiles?.filter((p) => !memberIds.includes(p.id)) ?? [];
  const total = stats?.totalMembers ?? members?.length ?? 0;
  const max = ws.max_members || 5;
  const roleSelect = (value: MemberRole, onChange: (v: MemberRole) => void, cls = 'h-9 w-[118px] rounded-full bg-card text-[12px]') => (
    <Select value={value} onValueChange={(v) => onChange(v as MemberRole)}>
      <SelectTrigger className={cls}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Thành viên</SelectItem><SelectItem value="viewer">Người xem</SelectItem></SelectContent>
    </Select>
  );

  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <WsLogo ws={ws} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold truncate">{ws.name}</p>
          <p className="text-[12.5px] text-muted-foreground truncate">/{ws.slug}</p>
          <div className="flex items-center gap-1.5 mt-1.5"><Pill tone={ws.is_active ? 'green' : 'gray'}>{ws.is_active ? 'Hoạt động' : 'Tạm dừng'}</Pill><Pill tone="blue" icon={<Users className="h-3 w-3" />}>{total}/{max}</Pill></div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>

      <SegmentedTabs size="sm" full items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'members', label: 'Thành viên' }, { id: 'invites', label: 'Lời mời' }, { id: 'analytics', label: 'Phân tích' }]} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-3">
          {editing ? (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateWorkspace.mutate({ id: ws.id, name: edit.name, description: edit.description || null, max_members: parseInt(edit.max) || 5 }); setEditing(false); }}>
              <Field label="Tên"><input className={fieldCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Mô tả"><textarea className={areaCls} rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Field label="Thành viên tối đa"><input type="number" min={1} className={fieldCls} value={edit.max} onChange={(e) => setEdit({ ...edit, max: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="rounded-full" onClick={() => setEditing(false)}>Hủy</Button><Button type="submit" className="rounded-full">Lưu</Button></div>
            </form>
          ) : (
            <>
              {ws.description && <p className="text-[13px] text-foreground/80">{ws.description}</p>}
              <div className="divide-y divide-border/50">
                <InfoRow icon={<Crown className="h-3.5 w-3.5" />} label="Chủ sở hữu" value={ws.owner?.name || ws.owner?.email || '—'} />
                <InfoRow icon={<Users className="h-3.5 w-3.5" />} label="Thành viên" value={`${stats?.activeMembers ?? 0} hoạt động / ${total}`} />
                <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Lời mời chờ" value={stats?.pendingInvites ?? 0} />
                <InfoRow label="Ngày tạo" value={fmtDate(ws.created_at)} />
                <InfoRow label="Cập nhật" value={ws.updated_at ? formatDistanceToNow(new Date(ws.updated_at), { addSuffix: true, locale: vi }) : '—'} />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2.5">
                <div><p className="text-[13px] font-semibold">Kích hoạt workspace</p><p className="text-[11.5px] text-muted-foreground">Tắt để tạm dừng truy cập</p></div>
                <Switch checked={ws.is_active} onCheckedChange={(v) => updateWorkspace.mutate({ id: ws.id, is_active: v })} aria-label="Kích hoạt workspace" />
              </div>
              <div>
                <p className="text-[11.5px] font-semibold text-muted-foreground mb-1.5">Chuyển quyền sở hữu</p>
                <div className="flex gap-2">
                  <Select value={newOwner} onValueChange={setNewOwner}>
                    <SelectTrigger className="h-9 rounded-full bg-card text-[12.5px] flex-1"><SelectValue placeholder="Chọn thành viên" /></SelectTrigger>
                    <SelectContent>{members?.filter((m) => m.user_id !== ws.owner_id).map((m) => <SelectItem key={m.id} value={m.user_id}>{m.user?.name || m.user?.email}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-9 rounded-full" disabled={!newOwner} onClick={() => setConfirmTransfer(true)}><ArrowRightLeft className="h-3.5 w-3.5 mr-1" />Chuyển</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setEdit({ name: ws.name, description: ws.description || '', max: String(ws.max_members || 5) }); setEditing(true); }}><Pencil className="h-3.5 w-3.5 mr-1" />Chỉnh sửa</Button>
                <Button variant="outline" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 mr-1" />Xóa</Button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-3">
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!newMember.id) return; addMember.mutate({ workspace_id: ws.id, user_id: newMember.id, role: newMember.role }); setNewMember({ id: '', role: 'member' }); }}>
            <Select value={newMember.id} onValueChange={(v) => setNewMember({ ...newMember, id: v })}>
              <SelectTrigger className="h-9 rounded-full bg-card text-[12.5px] w-full"><SelectValue placeholder="Chọn người dùng để thêm..." /></SelectTrigger>
              <SelectContent>{available.map((p) => <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
              {roleSelect(newMember.role, (r) => setNewMember({ ...newMember, role: r }), 'h-9 flex-1 rounded-full bg-card text-[12.5px]')}
              <Button type="submit" size="sm" className="h-9 rounded-full px-4" disabled={!newMember.id || total >= max}><UserPlus className="h-4 w-4 mr-1.5" />Thêm</Button>
            </div>
          </form>
          {total >= max && <p className="text-[11.5px] text-[#B7791F]">Đã đạt giới hạn {max} thành viên.</p>}
          {membersLoading ? <Skeleton className="h-32 w-full rounded-2xl" /> : !members?.length ? <p className="text-[12.5px] text-muted-foreground text-center py-4">Chưa có thành viên.</p> : (
            <div className="space-y-1 -mx-1">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-2xl px-1 py-1.5">
                  <UserAvatar name={m.user?.name} email={m.user?.email} src={m.user?.avatar_url} size={32} />
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold truncate">{m.user?.name || m.user?.email || '—'}</p><p className="text-[11px] text-muted-foreground truncate">{m.status === 'active' ? 'Hoạt động' : m.status === 'pending' ? 'Chờ' : 'Không hoạt động'}{m.joined_at ? ` · ${fmtDate(m.joined_at)}` : ''}</p></div>
                  {m.role === 'owner' ? <RolePill role="owner" /> : (
                    <>
                      {roleSelect(m.role as MemberRole, (r) => updateMemberRole.mutate({ memberId: m.id, workspaceId: ws.id, role: r }), 'h-8 w-[104px] rounded-full bg-card text-[11.5px]')}
                      <button aria-label="Gỡ thành viên" onClick={() => removeMember.mutate({ memberId: m.id, workspaceId: ws.id })} className="h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary shrink-0"><X className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'invites' && (
        <div className="space-y-3">
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!invite.email || !currentUserId) return; createInvitation.mutate({ workspace_id: ws.id, email: invite.email, role: invite.role, invited_by: currentUserId }); setInvite({ email: '', role: 'member' }); }}>
            <input type="email" className={cn(fieldCls, 'h-9 text-[12.5px]')} placeholder="email@vidu.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} aria-label="Email mời" />
            <div className="flex gap-2">
              {roleSelect(invite.role, (r) => setInvite({ ...invite, role: r }), 'h-9 flex-1 rounded-full bg-card text-[12.5px]')}
              <Button type="submit" size="sm" className="h-9 rounded-full px-4" disabled={!invite.email || !currentUserId}><Mail className="h-4 w-4 mr-1.5" />Gửi lời mời</Button>
            </div>
          </form>
          {!invitations?.length ? <p className="text-[12.5px] text-muted-foreground text-center py-4">Không có lời mời đang chờ.</p> : (
            <div className="space-y-1 -mx-1">
              {invitations.map((inv) => {
                const expired = new Date(inv.expires_at) < new Date();
                return (
                  <div key={inv.id} className="flex items-center gap-2.5 rounded-2xl px-1 py-1.5">
                    <span className="h-8 w-8 rounded-full bg-[#E6F1FF] text-[#2F7BF6] grid place-items-center shrink-0"><Mail className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold truncate">{inv.email}</p><p className="text-[11px] text-muted-foreground truncate">{ROLE_META[inv.role]?.label ?? inv.role} · {expired ? 'Đã hết hạn' : `Hết hạn ${fmtDate(inv.expires_at)}`}</p></div>
                    {expired && <Pill tone="red">Hết hạn</Pill>}
                    <button aria-label="Thu hồi lời mời" onClick={() => deleteInvitation.mutate({ invitationId: inv.id, workspaceId: ws.id })} className="h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-4">
          {analytics?.memberActivity?.length ? (
            <div><p className="text-[12px] font-semibold text-muted-foreground mb-1">Hoạt động thành viên</p>
              <GroupedBars height={160} data={analytics.memberActivity.slice(-7).map((d) => ({ label: d.date, goals: d.goals, tasks: d.tasks, habits: d.habits }))} series={[{ key: 'tasks', name: 'Công việc', color: '#7C5CFC' }, { key: 'habits', name: 'Thói quen', color: '#22B07D' }, { key: 'goals', name: 'Mục tiêu', color: '#F0587A' }]} />
            </div>
          ) : <p className="text-[12.5px] text-muted-foreground">Chưa có dữ liệu hoạt động.</p>}
          {!!analytics?.membersByRole?.length && <Donut size={110} data={analytics.membersByRole.map((r) => ({ id: r.role, name: ROLE_META[r.role]?.label ?? r.role, value: r.count, color: ROLE_META[r.role]?.color ?? '#9AA3B2' }))} />}
          {!!analytics?.topContributors?.length && (
            <div><p className="text-[12px] font-semibold text-muted-foreground mb-1">Đóng góp nhiều nhất</p>
              {analytics.topContributors.slice(0, 5).map((c) => (
                <div key={c.userId} className="flex items-center gap-2.5 py-1.5"><UserAvatar name={c.name} email={c.email} src={c.avatar_url} size={28} /><span className="text-[12.5px] font-semibold flex-1 truncate">{c.name || c.email}</span><span className="text-[11.5px] text-muted-foreground">{c.tasks + c.goals + c.habits} mục</span></div>
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmTransfer} onOpenChange={setConfirmTransfer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chuyển quyền sở hữu?</AlertDialogTitle>
            <AlertDialogDescription>Người được chọn sẽ trở thành chủ sở hữu “{ws.name}”. Chủ sở hữu hiện tại sẽ trở thành Admin.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => { transferOwnership.mutate({ workspaceId: ws.id, newOwnerId: newOwner, currentOwnerId: ws.owner_id }); setNewOwner(''); setConfirmTransfer(false); }}>Chuyển quyền</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
