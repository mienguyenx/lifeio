// Module 20 — Admin: Người dùng, phân quyền & chi tiết người dùng (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminUsers.tsx (bản cũ: /admin/users/classic)
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, Clock, CreditCard, Crown, Flame, Globe, Key, Loader2, Mail, MoreHorizontal, Pencil, RotateCcw, Send, Shield, ShieldCheck, Trash2, User, UserPlus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { HeroBanner, IconButton, MascotCard, Page, PageHeader, ProgressBar, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Donut, TrendArea } from '@/components/lio/charts';
import { Field, areaCls, fieldCls } from '@/components/lio/form';
import { useAllProfiles, useUserRoles, useUpdateUserRole, useAdminStats, useSubscriptionPlans, useUserSubscriptions, useUpdateProfileName } from '@/hooks/useAdminData';
import { useUserStats, useUserSubscription, useUserAnalytics } from '@/hooks/useAdminUserData';
import { useDeleteUser, useSendEmail, useSendPasswordReset, useResetOnboarding, useUpdateSubscription } from '@/hooks/useAdminUserActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { GridHead, GridRow, InfoRow, Pager, Pill, ROLE_META, RolePill, UserAvatar, asProfiles, monthlyCounts, type AdminProfile } from '../shared';

type Role = 'admin' | 'moderator' | 'user';
type RoleFilter = 'all' | Role;
type SortField = 'name' | 'email' | 'created_at';
type Profile = AdminProfile;

const COLS = 'minmax(0,1.6fr) 110px 120px 110px 40px';
const fmtDate = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy', { locale: vi }) : '—');

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

export default function AdminUsersPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Profile | null>(null);
  const [emailTarget, setEmailTarget] = useState<Profile | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const { data: profiles, isLoading } = useAllProfiles();
  const { data: roles } = useUserRoles();
  const { data: stats } = useAdminStats();
  const { data: plans } = useSubscriptionPlans();
  const { data: subs } = useUserSubscriptions();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const sendEmail = useSendEmail();
  const sendPasswordReset = useSendPasswordReset();
  const resetOnboarding = useResetOnboarding();

  const roleOf = (id: string): Role => (roles?.find((r) => r.user_id === id)?.role as Role) || 'user';
  const planOf = (id: string) => {
    const s = subs?.find((x) => x.user_id === id);
    if (!s) return null;
    return { name: plans?.find((p) => p.id === s.plan_id)?.name ?? 'Gói', status: s.status };
  };

  const all = useMemo(() => asProfiles(profiles), [profiles]);
  const counts = useMemo(() => {
    const c = { all: all.length, admin: 0, moderator: 0, user: 0 } as Record<RoleFilter, number>;
    all.forEach((p) => { c[roleOf(p.id)] += 1; });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, roles]);
  const new30 = all.filter((p) => p.created_at && isAfter(new Date(p.created_at), subDays(new Date(), 30))).length;
  const withPlan = new Set((subs ?? []).filter((s) => s.status === 'active').map((s) => s.user_id)).size;

  const filtered = useMemo(() => {
    let r = all;
    if (search) { const q = search.toLowerCase(); r = r.filter((p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)); }
    if (roleFilter !== 'all') r = r.filter((p) => roleOf(p.id) === roleFilter);
    r = [...r].sort((a, b) => {
      const va = String(a[sortField] ?? ''); const vb = String(b[sortField] ?? '');
      const cmp = va.localeCompare(vb);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, search, roleFilter, roles, sortField, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  useEffect(() => { setPage(0); }, [search, roleFilter]);

  const selected = all.find((p) => p.id === selectedId) ?? null;
  const toggleSort = (f: SortField) => { if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortField(f); setSortDir('asc'); } };
  const sortIcon = (f: SortField) => sortField !== f ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  const sortBtn = (f: SortField, label: string) => <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(f)}>{label}{sortIcon(f)}</button>;
  const changeRole = (id: string, role: Role) => updateRole.mutate({ userId: id, role });

  const userMenu = (p: Profile) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[11.5px] text-muted-foreground">Đổi vai trò</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => changeRole(p.id, 'admin')}><ShieldCheck className="h-4 w-4 mr-2 text-[#E0445E]" />Admin</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeRole(p.id, 'moderator')}><Shield className="h-4 w-4 mr-2 text-primary" />Moderator</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeRole(p.id, 'user')}><User className="h-4 w-4 mr-2" />User</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setSelectedId(p.id)}><Users className="h-4 w-4 mr-2" />Xem chi tiết</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEmailTarget(p)}><Mail className="h-4 w-4 mr-2" />Gửi email</DropdownMenuItem>
        <DropdownMenuItem onClick={() => sendPasswordReset.mutate(p.id)}><Key className="h-4 w-4 mr-2" />Gửi reset mật khẩu</DropdownMenuItem>
        <DropdownMenuItem onClick={() => resetOnboarding.mutate(p.id)}><RotateCcw className="h-4 w-4 mr-2" />Reset onboarding</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4 mr-2" />Xóa người dùng</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const growth = monthlyCounts(all.map((p) => p.created_at));
  const roleDonut = (['admin', 'moderator', 'user'] as const).map((r) => ({ id: r, name: ROLE_META[r].label, value: counts[r], color: ROLE_META[r].color }));
  const recent = [...all].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 5);

  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Phân bổ vai trò" hint={`${counts.all} người`} />
        {counts.all ? <Donut data={roleDonut} size={130} center={<span><span className="block text-[11px] text-muted-foreground">người dùng</span><span className="block text-[18px] font-extrabold">{counts.all}</span></span>} /> : <p className="text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</p>}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Mới tham gia" />
        {recent.length === 0 ? <p className="text-[12.5px] text-muted-foreground">Chưa có người dùng.</p> : (
          <div className="space-y-1 -mx-2">
            {recent.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)} className="w-full flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left hover:bg-secondary/60">
                <UserAvatar name={p.name} email={p.email} src={p.avatar_url} size={32} />
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold truncate">{p.name || 'Chưa đặt tên'}</p><p className="text-[11px] text-muted-foreground truncate">{p.created_at ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: vi }) : '—'}</p></div>
                <RolePill role={roleOf(p.id)} />
              </button>
            ))}
          </div>
        )}
      </Surface>
      <MascotCard mascot="lumi" pose="happy" title="Mẹo quản trị" quote="Chỉ cấp quyền Admin cho người thật sự cần — Moderator thường là đủ." />
    </div>
  );

  const detail = selected && (
    <UserDetail key={selected.id} profile={selected} role={roleOf(selected.id)} inPanel={isXl}
      onClose={() => setSelectedId(null)} onRole={(r) => changeRole(selected.id, r)}
      onEmail={() => setEmailTarget(selected)} onReset={() => sendPasswordReset.mutate(selected.id)}
      onOnboarding={() => resetOnboarding.mutate(selected.id)} onDelete={() => setToDelete(selected)} />
  );
  const side = isXl && detail ? <div className="space-y-4">{detail}</div> : overviewSide;

  return (
    <Page>
      <PageHeader title="Người dùng" subtitle="Quản lý tài khoản, vai trò và gói dịch vụ"
        actions={<SearchToggle value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc email..." />} />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: counts.all }, { id: 'admin', label: 'Admin', count: counts.admin }, { id: 'moderator', label: 'Moderator', count: counts.moderator }, { id: 'user', label: 'User', count: counts.user }]} value={roleFilter} onChange={setRoleFilter} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="lumi" pose="happy" title="Cộng đồng LifeOS" subtitle={counts.all ? `${counts.all} người dùng · ${new30} người mới trong 30 ngày qua.` : 'Chưa có người dùng nào.'} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Users className="h-5 w-5" />} tint="violet" value={stats?.totalUsers ?? counts.all} label="Người dùng" hint={`+${new30} / 30 ngày`} onClick={() => setRoleFilter('all')} active={roleFilter === 'all'} />
            <StatTile icon={<ShieldCheck className="h-5 w-5" />} tint="rose" value={counts.admin} label="Admin" hint="toàn quyền" onClick={() => setRoleFilter('admin')} active={roleFilter === 'admin'} />
            <StatTile icon={<Shield className="h-5 w-5" />} tint="sky" value={counts.moderator} label="Moderator" hint="kiểm duyệt" onClick={() => setRoleFilter('moderator')} active={roleFilter === 'moderator'} />
            <StatTile icon={<Crown className="h-5 w-5" />} tint="amber" value={withPlan} label="Có gói dịch vụ" hint="đang hoạt động" />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Danh sách người dùng" hint={`${filtered.length} người`} /></div>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState mascot="lumi" compact title={all.length ? 'Không tìm thấy người dùng' : 'Chưa có người dùng'} description={all.length ? 'Thử đổi tab hoặc từ khóa.' : 'Người dùng sẽ xuất hiện khi đăng ký tài khoản.'} />
            ) : isMobile ? (
              <div className="divide-y divide-border/50">
                {paged.map((p) => {
                  const plan = planOf(p.id);
                  return (
                    <div key={p.id} role="button" tabIndex={0} onClick={() => setSelectedId(p.id)} className="flex items-center gap-3 px-1 py-3">
                      <UserAvatar name={p.name} email={p.email} src={p.avatar_url} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold truncate">{p.name || 'Chưa đặt tên'}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{p.email}</p>
                        <div className="flex items-center gap-1.5 mt-1"><RolePill role={roleOf(p.id)} />{plan && <Pill tone="amber">{plan.name}</Pill>}<span className="text-[11px] text-muted-foreground">{fmtDate(p.created_at)}</span></div>
                      </div>
                      {userMenu(p)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <GridHead cols={COLS}>{sortBtn('name', 'Người dùng')}<span>Vai trò</span><span>Gói</span>{sortBtn('created_at', 'Tham gia')}<span /></GridHead>
                {paged.map((p) => {
                  const plan = planOf(p.id);
                  return (
                    <GridRow key={p.id} cols={COLS} onClick={() => setSelectedId(p.id)} active={selectedId === p.id}>
                      <div className="min-w-0 flex items-center gap-2.5">
                        <UserAvatar name={p.name} email={p.email} src={p.avatar_url} size={36} />
                        <div className="min-w-0"><p className="text-[13.5px] font-semibold truncate">{p.name || 'Chưa đặt tên'}</p><p className="text-[12px] text-muted-foreground truncate">{p.email || '—'}</p></div>
                      </div>
                      <span><RolePill role={roleOf(p.id)} /></span>
                      <span className="min-w-0">{plan ? <Pill tone={plan.status === 'active' ? 'amber' : 'gray'} icon={<Crown className="h-3 w-3" />} className="max-w-full truncate">{plan.name}</Pill> : <span className="text-[12px] text-muted-foreground">Miễn phí</span>}</span>
                      <span className="text-[12px] text-muted-foreground">{fmtDate(p.created_at)}</span>
                      {userMenu(p)}
                    </GridRow>
                  );
                })}
              </div>
            )}
            {filtered.length > 0 && <Pager page={safePage} pages={pages} total={filtered.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
          </Surface>

          <Surface className="p-4">
            <SectionTitle title="Người dùng mới theo tháng" hint="6 tháng gần nhất" />
            <TrendArea id="admin-user-growth" data={growth} name="Người dùng mới" height={200} color="#7C5CFC" />
          </Surface>
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title="Chi tiết người dùng">
        {!isXl && detail}
      </AdaptiveModal>

      <AdaptiveModal open={!!emailTarget} onOpenChange={(o) => { if (!o) { setEmailTarget(null); } }} title={`Gửi email cho ${emailTarget?.name || 'người dùng'}`} description={emailTarget?.email ? `Gửi đến: ${emailTarget.email}` : undefined}>
        <form className="space-y-3.5 mt-2" onSubmit={(e) => {
          e.preventDefault();
          if (!emailTarget || !emailSubject || !emailMessage) return;
          sendEmail.mutate({ userId: emailTarget.id, subject: emailSubject, message: emailMessage });
          setEmailTarget(null); setEmailSubject(''); setEmailMessage('');
        }}>
          <Field label="Tiêu đề"><input className={fieldCls} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Nhập tiêu đề email..." autoFocus /></Field>
          <Field label="Nội dung"><textarea className={areaCls} rows={5} value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Nhập nội dung email..." /></Field>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setEmailTarget(null)}>Hủy</Button>
            <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!emailSubject || !emailMessage || sendEmail.isPending}>{sendEmail.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}Gửi email</Button>
          </div>
        </form>
      </AdaptiveModal>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng “{toDelete?.name || toDelete?.email}”?</AlertDialogTitle>
            <AlertDialogDescription>Hồ sơ và vai trò của người dùng sẽ bị xóa. Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) { deleteUser.mutate(toDelete.id); if (selectedId === toDelete.id) setSelectedId(null); } setToDelete(null); }}>Xóa người dùng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}

type DetailTab = 'profile' | 'activity' | 'analytics' | 'plan';

function UserDetail({ profile, role, inPanel, onClose, onRole, onEmail, onReset, onOnboarding, onDelete }: {
  profile: Profile; role: Role; inPanel: boolean; onClose: () => void; onRole: (r: Role) => void;
  onEmail: () => void; onReset: () => void; onOnboarding: () => void; onDelete: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>('profile');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile.name ?? '');
  const { data: userStats, isLoading: statsLoading } = useUserStats(profile.id);
  const { data: subscription } = useUserSubscription(profile.id);
  const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics(profile.id);
  const { data: plans } = useSubscriptionPlans();
  const updateSubscription = useUpdateSubscription();
  const updateName = useUpdateProfileName();
  const [planId, setPlanId] = useState('');
  useEffect(() => { if (subscription?.plan_id) setPlanId(subscription.plan_id); }, [subscription?.plan_id]);

  const saveName = () => {
    const n = name.trim();
    if (n && n !== profile.name) updateName.mutate({ userId: profile.id, name: n });
    setEditingName(false);
  };
  // dailyActivity.date là 'dd/MM' (liên tục tới hôm nay) → dựng lại ngày ISO cho trục TrendArea
  const daily = analytics?.dailyActivity ?? [];
  const activity = daily.map((d, i) => ({ d: format(subDays(new Date(), daily.length - 1 - i), 'yyyy-MM-dd'), v: d.tasks + d.habits + d.journals }));
  const statBox = (label: string, value: ReactNode, hint?: string) => (
    <div className="rounded-2xl bg-secondary/50 p-3"><p className="text-[20px] font-bold leading-none">{value}</p><p className="text-[11.5px] font-semibold mt-1">{label}</p>{hint && <p className="text-[10.5px] text-muted-foreground">{hint}</p>}</div>
  );

  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <UserAvatar name={profile.name} email={profile.email} src={profile.avatar_url} size={56} />
        <div className="min-w-0 flex-1">
          {editingName ? (
            <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
              <input className={cn(fieldCls, 'h-9 text-[13px]')} value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="Tên người dùng" />
              <Button type="submit" size="sm" className="h-9 rounded-full">Lưu</Button>
            </form>
          ) : (
            <div className="flex items-center gap-1">
              <p className="text-[16px] font-bold truncate">{profile.name || 'Chưa đặt tên'}</p>
              <IconButton label="Sửa tên" onClick={() => { setName(profile.name ?? ''); setEditingName(true); }}><Pencil className="h-3.5 w-3.5" /></IconButton>
            </div>
          )}
          <p className="text-[12.5px] text-muted-foreground truncate">{profile.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap"><RolePill role={role} />{subscription ? <Pill tone={subscription.status === 'active' ? 'amber' : 'gray'} icon={<Crown className="h-3 w-3" />}>{subscription.plan_name}</Pill> : <Pill>Miễn phí</Pill>}</div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>

      <SegmentedTabs size="sm" full items={[{ id: 'profile', label: 'Hồ sơ' }, { id: 'activity', label: 'Hoạt động' }, { id: 'analytics', label: 'Phân tích' }, { id: 'plan', label: 'Gói' }]} value={tab} onChange={setTab} />

      {tab === 'profile' && (
        <div className="space-y-3">
          <Field label="Vai trò">
            <Select value={role} onValueChange={(v) => onRole(v as Role)}>
              <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#E0445E]" />Admin</span></SelectItem>
                <SelectItem value="moderator"><span className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Moderator</span></SelectItem>
                <SelectItem value="user"><span className="inline-flex items-center gap-2"><User className="h-4 w-4" />User</span></SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="divide-y divide-border/50">
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={profile.email || '—'} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Ngày tham gia" value={fmtDate(profile.created_at)} />
            <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Cập nhật" value={profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true, locale: vi }) : '—'} />
            <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Múi giờ" value={profile.timezone || 'Asia/Ho_Chi_Minh'} />
          </div>
          {profile.bio && <div><p className="text-[11.5px] font-semibold text-muted-foreground mb-0.5">Giới thiệu</p><p className="text-[13px]">{profile.bio}</p></div>}
          {profile.life_purpose && <div><p className="text-[11.5px] font-semibold text-muted-foreground mb-0.5">Mục đích sống</p><p className="text-[13px] italic">“{profile.life_purpose}”</p></div>}
        </div>
      )}

      {tab === 'activity' && (statsLoading ? <Skeleton className="h-40 w-full rounded-2xl" /> : userStats ? (
        <div className="grid grid-cols-2 gap-2">
          {statBox('Mục tiêu', userStats.goalsCount, `${userStats.activeGoalsCount} đang hoạt động`)}
          {statBox('Thói quen', userStats.habitsCount)}
          {statBox('Công việc', userStats.tasksCount, `${userStats.completedTasksCount} hoàn thành`)}
          {statBox('Nhật ký', userStats.journalCount)}
        </div>
      ) : <p className="text-[12.5px] text-muted-foreground text-center py-6">Không có dữ liệu hoạt động</p>)}

      {tab === 'analytics' && (analyticsLoading ? <Skeleton className="h-48 w-full rounded-2xl" /> : analytics ? (
        <div className="space-y-3">
          <div><p className="text-[12px] font-semibold text-muted-foreground mb-1">Hoạt động 30 ngày</p><TrendArea id={`u-act-${profile.id}`} data={activity} name="Hoạt động" height={150} color="#7C5CFC" /></div>
          <div>
            <div className="flex items-center justify-between text-[12.5px] mb-1"><span className="font-semibold">Hoàn thành thói quen (7 ngày)</span><span className="font-bold">{analytics.habitCompletionRate}%</span></div>
            <ProgressBar value={analytics.habitCompletionRate} color="#22B07D" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {statBox('Streak hiện tại', <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4 text-[#F5A524]" />{analytics.streakData.current}</span>)}
            {statBox('Streak tốt nhất', analytics.streakData.best)}
          </div>
          {analytics.goalsByArea.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold text-muted-foreground">Mục tiêu theo lĩnh vực</p>
              {analytics.goalsByArea.map((g) => {
                const max = Math.max(...analytics.goalsByArea.map((x) => x.count), 1);
                return <div key={g.area} className="flex items-center gap-2 text-[12px]"><span className="w-24 truncate">{g.area}</span><ProgressBar className="flex-1" value={(g.count / max) * 100} color={`hsl(var(--area-${g.area}, var(--primary)))`} /><span className="w-6 text-right font-semibold">{g.count}</span></div>;
              })}
            </div>
          )}
        </div>
      ) : <p className="text-[12.5px] text-muted-foreground text-center py-6">Không có dữ liệu phân tích</p>)}

      {tab === 'plan' && (
        <div className="space-y-3">
          {subscription ? (
            <div className="rounded-2xl bg-[#FFF4DB]/60 dark:bg-amber-500/10 p-3">
              <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-[#B7791F]" /><p className="text-[14px] font-bold flex-1">{subscription.plan_name}</p><Pill tone={subscription.status === 'active' ? 'green' : 'gray'}>{subscription.status === 'active' ? 'Đang hoạt động' : subscription.status}</Pill></div>
              <div className="mt-2 divide-y divide-border/40">
                <InfoRow label="Bắt đầu" value={fmtDate(subscription.started_at)} />
                {subscription.expires_at && <InfoRow label="Hết hạn" value={fmtDate(subscription.expires_at)} />}
              </div>
            </div>
          ) : <p className="text-[12.5px] text-muted-foreground">Người dùng chưa có gói dịch vụ.</p>}
          <Field label="Cập nhật gói">
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Chọn gói dịch vụ..." /></SelectTrigger>
              <SelectContent>{plans?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} {p.currency}/{p.billing_period}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Button className="w-full rounded-full" disabled={!planId || updateSubscription.isPending} onClick={() => updateSubscription.mutate({ userId: profile.id, planId, status: 'active' })}>
            {updateSubscription.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CreditCard className="h-4 w-4 mr-1.5" />}Cập nhật gói
          </Button>
        </div>
      )}

      <div className="pt-1 border-t border-border/50">
        <p className="text-[11.5px] font-semibold text-muted-foreground my-2">Thao tác nhanh</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={onEmail}><Mail className="h-3.5 w-3.5 mr-1" />Gửi email</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={onReset}><Key className="h-3.5 w-3.5 mr-1" />Reset mật khẩu</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={onOnboarding}><UserPlus className="h-3.5 w-3.5 mr-1" />Reset onboarding</Button>
          <Button variant="outline" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 mr-1" />Xóa</Button>
        </div>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
