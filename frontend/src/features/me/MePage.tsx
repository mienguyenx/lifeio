import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, ChevronRight, LogOut, Pencil, Search, User, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { VisionBoard } from '@/features/vision/VisionBoard';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { ItemRow, Page, PageHeader, ProgressBar, Surface, type Tint } from '@/components/lio';
import { Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { useProfileSync } from '@/hooks/sync/useProfileSync';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { notificationService } from '@/services/notificationService';
import { MODULES, type ModuleId } from '@/lib/modules';
import { AI_TONES, ARCHETYPES } from '@/lib/personalizationOptions';

interface Entry { id: string; label: string; meta: string; icon: LifeIconName | string; tint: Tint; to: string; value?: ReactNode; keywords?: string; module?: ModuleId; desktopOnly?: boolean }
interface Group { title: string; items: Entry[] }

/** Ảnh đại diện thu nhỏ còn 256px (JPEG) để lưu gọn lên máy chủ. */
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function MePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'vision' ? 'vision' : 'hub';
  const { user: authUser, signOut } = useAuth();
  const { theme } = useTheme();
  const { loadProfile, updateProfile } = useProfileSync();
  const { isOn, enabled } = useEnabledModules();
  const user = useLifeOSStore((s) => s.user);
  const setUser = useLifeOSStore((s) => s.setUser);
  const prefs = useLifeOSStore((s) => s.userPreferences);
  const pomodoro = useLifeOSStore((s) => s.pomodoroSettings);
  const memories = useLifeOSStore((s) => s.aiMemories);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const pushOn = useLifeOSStore((s) => s.pushNotificationsEnabled);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState({ name: '', phone: '', birthday: '', bio: '' });

  // Hồ sơ trên máy chủ là nguồn chính (tên lúc đăng ký, ảnh, giới thiệu…).
  useEffect(() => {
    if (!authUser) return;
    loadProfile().then((p) => {
      if (!p) return;
      const patch = Object.fromEntries(Object.entries(p).filter(([k, v]) => v && k !== 'email'));
      if (Object.keys(patch).length) setUser(patch);
    });
  }, [authUser, loadProfile, setUser]);
  useEffect(() => notificationService.subscribe((items) => setUnread(items.filter((n) => !n.read).length)), []);

  const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
  const bestStreak = activeHabits.reduce((m, h) => Math.max(m, h.streak || 0), 0);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const name = user.name && user.name !== 'User' ? user.name : '';
  const displayName = name || (authUser?.user_metadata?.name as string | undefined) || 'Bạn';
  const email = authUser?.email || user.email;

  const checklist = [
    { ok: !!name, label: 'tên' }, { ok: !!user.avatar, label: 'ảnh đại diện' }, { ok: !!user.bio, label: 'giới thiệu' },
    { ok: !!user.birthday, label: 'ngày sinh' }, { ok: !!(user.lifePurpose || user.visions?.length), label: 'tầm nhìn' }, { ok: !!user.personalValues?.length, label: 'giá trị sống' },
  ];
  const completion = Math.round((checklist.filter((c) => c.ok).length / checklist.length) * 100);
  const missing = checklist.filter((c) => !c.ok).map((c) => c.label);

  const themeLabel = theme === 'dark' ? 'Tối' : theme === 'light' ? 'Sáng' : 'Hệ thống';
  const archetype = ARCHETYPES.find((a) => a.value === prefs?.archetype);
  const tone = AI_TONES.find((t) => t.value === prefs?.aiTone);
  const modulesOn = enabled ? MODULES.filter((m) => isOn(m.id)).length : MODULES.length;
  const acceptedMemories = memories.filter((m) => m.status === 'accepted' || m.status === 'edited').length;
  const pendingMemories = memories.filter((m) => m.status === 'proposed').length;

  const groups: Group[] = useMemo(() => [
    { title: 'Cá nhân hoá', items: [
      { id: 'style', label: 'Phong cách & AI Coach', meta: tone ? `Giọng AI: ${tone.label} · lịch trình, ưu tiên` : 'Lối sống, giọng AI, lịch trình, ưu tiên', icon: 'module/profile', tint: 'violet', to: '/personalization', value: archetype?.label, keywords: 'ca nhan hoa personalization giong ai tone lich trinh gio thuc day ngu uu tien linh vuc' },
      { id: 'vision', label: 'Tầm nhìn & giá trị', meta: 'Mục đích sống, giá trị, vai trò', icon: 'module/goals', tint: 'rose', to: '/me?view=vision', value: user.personalValues?.length ? `${user.personalValues.length} giá trị` : undefined, keywords: 'tam nhin gia tri vai tro muc dich vision values' },
      { id: 'memory', label: 'Bộ nhớ AI', meta: 'Những gì AI ghi nhớ về bạn', icon: 'module/ai-coach', tint: 'sky', to: '/ai-memory', value: pendingMemories ? `${pendingMemories} chờ duyệt` : acceptedMemories ? `${acceptedMemories} điều` : undefined, keywords: 'ai memory bo nho tri nho' },
      { id: 'modules', label: 'Tính năng', meta: 'Bật/tắt mục theo nhu cầu', icon: 'module/settings', tint: 'mint', to: '/modules', value: `${modulesOn}/${MODULES.length}`, keywords: 'tinh nang module bat tat an hien menu' },
    ] },
    { title: 'Ứng dụng', items: [
      { id: 'notif', label: 'Thông báo', meta: pushOn ? 'Thông báo đẩy đang bật' : 'Nhắc việc, thói quen, bản tin sáng', icon: 'module/notifications', tint: 'amber', to: '/notifications', value: unread ? <span className="rounded-full bg-primary text-primary-foreground text-[11px] px-2 py-0.5">{unread}</span> : undefined, keywords: 'thong bao notification push nhac nho' },
      { id: 'theme', label: 'Giao diện', meta: 'Sáng, tối hoặc theo hệ thống', icon: theme === 'dark' ? '🌙' : '☀️', tint: 'violet', to: '/settings', value: themeLabel, keywords: 'giao dien theme dark toi sang' },
      { id: 'pomodoro', label: 'Pomodoro', meta: 'Thời gian làm & nghỉ', icon: 'module/focus', tint: 'rose', to: '/settings', value: `${pomodoro.workDuration}/${pomodoro.breakDuration}′`, keywords: 'pomodoro tap trung focus hen gio', module: 'focus' },
      { id: 'app', label: 'Cài app & thiết bị', meta: 'Thêm vào màn hình chính, thiết bị nhận thông báo', icon: '📱', tint: 'sky', to: '/settings?tab=app', keywords: 'cai app pwa thiet bi dien thoai install' },
      { id: 'ext', label: 'Tiện ích trình duyệt', meta: 'LifeOS trong tab mới & widget', icon: '🧩', tint: 'mint', to: '/settings?tab=extension', keywords: 'extension tien ich chrome trinh duyet', desktopOnly: true },
    ] },
    { title: 'Công cụ', items: [
      { id: 'journey', label: 'Hành trình của tôi', meta: 'Nhiệm vụ & XP', icon: '🏆', tint: 'amber', to: '/journey', module: 'insights', keywords: 'hanh trinh xp nhiem vu journey' },
      { id: 'decisions', label: 'Nhật ký quyết định', meta: 'Ghi lại & review quyết định', icon: '⚖️', tint: 'mint', to: '/decisions', module: 'decisions', keywords: 'quyet dinh decisions' },
      { id: 'areas', label: '10 lĩnh vực', meta: 'Tổng quan từng mảng cuộc sống', icon: 'module/life-areas', tint: 'orange', to: '/area-dashboard', module: 'life_areas', keywords: 'linh vuc banh xe life areas' },
    ] },
    { title: 'Dữ liệu & bảo mật', items: [
      { id: 'security', label: 'Email & mật khẩu', meta: email || 'Đăng nhập & bảo mật', icon: '🔐', tint: 'violet', to: '/settings?tab=account', keywords: 'tai khoan mat khau email doi password bao mat account' },
      { id: 'data', label: 'Sao lưu & xuất dữ liệu', meta: 'Xuất, nhập, đặt lại dữ liệu', icon: 'module/sync', tint: 'sky', to: '/settings?tab=data', keywords: 'du lieu xuat nhap backup export import xoa reset' },
      { id: 'activity', label: 'Lịch sử hoạt động', meta: 'Những gì bạn đã thêm, sửa, hoàn thành', icon: 'module/archive', tint: 'amber', to: '/activity', keywords: 'lich su hoat dong activity log history thay doi nhat ky thao tac' },
      { id: 'trash', label: 'Thùng rác', meta: 'Khôi phục mục đã xoá', icon: 'module/trash', tint: 'rose', to: '/trash', keywords: 'thung rac trash khoi phuc' },
    ] },
  ], [archetype, tone, user.personalValues, pendingMemories, acceptedMemories, modulesOn, pushOn, unread, theme, themeLabel, pomodoro, email]);

  const visible = groups.map((g) => ({ ...g, items: g.items.filter((i) => (!i.module || isOn(i.module)) && !(i.desktopOnly && isMobile)) })).filter((g) => g.items.length);
  const nq = norm(q.trim());
  const shown = nq ? visible.map((g) => ({ ...g, items: g.items.filter((i) => norm(`${i.label} ${i.meta} ${i.keywords || ''}`).includes(nq)) })).filter((g) => g.items.length) : visible;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 8MB)'); return; }
    try {
      const avatar = await resizeImage(file);
      setUser({ avatar });
      const ok = await updateProfile({ avatar });
      toast.success(ok ? 'Đã cập nhật ảnh đại diện' : 'Đã đổi ảnh trên thiết bị này');
    } catch { toast.error('Không đọc được ảnh'); }
  };
  const openEdit = () => { setDraft({ name, phone: user.phone || '', birthday: user.birthday || '', bio: user.bio || '' }); setEditing(true); };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next = { ...draft, name: draft.name.trim() };
    setUser(next);
    setEditing(false);
    const ok = await updateProfile({ ...next, birthday: next.birthday || undefined });
    toast[ok ? 'success' : 'warning'](ok ? 'Đã lưu hồ sơ' : 'Đã lưu trên thiết bị — chưa đồng bộ được');
  };
  const handleSignOut = async () => { await signOut(); toast.success('Đã đăng xuất'); navigate('/auth'); };

  if (view === 'vision') {
    return (
      <Page>
        <PageHeader title={<span className="inline-flex items-center gap-2"><button aria-label="Quay lại" onClick={() => setParams({})} className="h-9 w-9 -ml-1 rounded-full grid place-items-center hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></button>Tầm nhìn & giá trị</span>} subtitle="Điều bạn muốn trở thành & những gì quan trọng nhất" />
        <VisionBoard />
      </Page>
    );
  }

  const icon = (i: string) => (i.includes('/') ? <LifeIcon name={i as LifeIconName} size={20} variant="duotone" /> : i);

  const profileCard = (
    <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#EFEBFF] via-[#F6F1FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-[#F2557A]/10 border border-border/40 p-4 sm:p-5">
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="h-[68px] w-[68px] rounded-full bg-card border-[3px] border-card shadow-soft grid place-items-center overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" /> : <span className="text-[26px] font-extrabold text-primary">{name ? name[0].toUpperCase() : <User className="h-8 w-8 text-muted-foreground" />}</span>}
          </div>
          <button aria-label="Đổi ảnh đại diện" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-soft border-2 border-card"><Camera className="h-3.5 w-3.5" /></button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[19px] font-extrabold tracking-tight truncate">{displayName}</h2>
          {email && <p className="text-[12.5px] text-muted-foreground truncate">{email}</p>}
          {user.bio && <p className="text-[12.5px] mt-0.5 line-clamp-2">{user.bio}</p>}
        </div>
        <Button size="sm" variant="outline" className="rounded-full bg-card/80 shrink-0" onClick={openEdit}><Pencil className="h-3.5 w-3.5 mr-1" />Sửa</Button>
      </div>
      {completion < 100 && (
        <button onClick={missing.every((m) => m === 'tầm nhìn' || m === 'giá trị sống') ? () => setParams({ view: 'vision' }) : openEdit} className="mt-3.5 w-full text-left rounded-2xl bg-card/80 px-3 py-2.5 hover:bg-card">
          <div className="flex justify-between text-[12px] font-semibold mb-1.5"><span>Hoàn thiện hồ sơ</span><span className="text-primary">{completion}%</span></div>
          <ProgressBar value={completion} />
          <p className="text-[11.5px] text-muted-foreground mt-1.5 truncate">Còn thiếu: {missing.join(', ')} — giúp AI hiểu bạn hơn</p>
        </button>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[{ v: activeHabits.length, l: 'Thói quen', to: '/habits' }, { v: `${bestStreak}🔥`, l: 'Chuỗi tốt nhất', to: '/habits' }, { v: doneTasks, l: 'Việc đã xong', to: '/tasks' }].map((s) => (
          <button key={s.l} onClick={() => navigate(s.to)} className="rounded-2xl bg-card/60 py-2 hover:bg-card">
            <p className="text-[17px] font-extrabold tabular-nums leading-tight">{s.v}</p>
            <p className="text-[11px] text-muted-foreground">{s.l}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const list = (
    <div className="space-y-4 min-w-0">
      <label className="flex items-center gap-2 h-11 rounded-full border border-border/70 bg-card px-4 focus-within:border-primary/50">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm cài đặt… (mật khẩu, thông báo, giao diện)" className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none" />
        {q && <button aria-label="Xoá tìm kiếm" onClick={() => setQ('')}><X className="h-4 w-4 text-muted-foreground" /></button>}
      </label>
      {shown.map((g) => (
        <section key={g.title}>
          <p className="px-3 mb-1.5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{g.title}</p>
          <Surface className="p-1.5">
            {g.items.map((i) => (
              <ItemRow key={i.id} icon={icon(i.icon)} tint={i.tint} title={i.label} meta={i.meta} onClick={() => navigate(i.to)}
                trailing={<span className="flex items-center gap-1 shrink-0 max-w-[38%]">{i.value && <span className="text-[12.5px] font-semibold text-muted-foreground truncate">{i.value}</span>}<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" /></span>} />
            ))}
          </Surface>
        </section>
      ))}
      {!shown.length && <Surface className="p-6 text-center text-[13px] text-muted-foreground">Không tìm thấy “{q}”. Thử “mật khẩu”, “thông báo”, “giao diện”…</Surface>}
      {authUser && !nq && (
        <Surface className="p-1.5">
          <ItemRow icon={<LogOut className="h-4 w-4 text-destructive" />} tint="rose" title={<span className="text-destructive">Đăng xuất</span>} meta={email} onClick={handleSignOut} />
        </Surface>
      )}
      {!nq && <p className="text-center text-[11.5px] text-muted-foreground pb-2">LifeOS · dữ liệu của bạn được đồng bộ an toàn</p>}
    </div>
  );

  return (
    <Page>
      <PageHeader title="Tài khoản" subtitle="Hồ sơ, cá nhân hoá & cài đặt" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)] items-start">
        <div className="min-w-0 lg:sticky lg:top-4">{profileCard}</div>
        {list}
      </div>

      <AdaptiveModal open={editing} onOpenChange={setEditing} title="Sửa hồ sơ">
        <form onSubmit={save} className="space-y-3.5 mt-2">
          <Field label="Tên hiển thị"><input className={fieldCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="AI sẽ gọi bạn bằng tên này" autoFocus={!isMobile} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày sinh"><input type="date" className={fieldCls} value={draft.birthday} onChange={(e) => setDraft({ ...draft, birthday: e.target.value })} /></Field>
            <Field label="Số điện thoại"><input inputMode="tel" className={fieldCls} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="0123 456 789" /></Field>
          </div>
          <Field label="Giới thiệu"><textarea className={areaCls} rows={3} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Bạn đang làm gì, quan tâm điều gì…" /></Field>
          <p className="text-[11.5px] text-muted-foreground">Email đăng nhập đổi trong <button type="button" className="text-primary font-semibold" onClick={() => { setEditing(false); navigate('/settings?tab=account'); }}>Email & mật khẩu</button>.</p>
          <FormActions onCancel={() => setEditing(false)} submitLabel="Lưu hồ sơ" />
        </form>
      </AdaptiveModal>
    </Page>
  );
}
