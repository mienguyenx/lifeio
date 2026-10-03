import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, LogOut, Mail, Pencil, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { VisionValuesManager } from '@/components/profile/VisionValuesManager';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { ItemRow, MascotCard, Page, PageHeader, ProgressBar, SectionTitle, SegmentedTabs, StatTile, Surface, type Tint } from '@/components/lio';
import { Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';

type View = 'overview' | 'vision';
const MENU: { path: string; label: string; meta: string; icon: LifeIconName | string; tint: Tint }[] = [
  { path: '/modules', label: 'Tính năng', meta: 'Bật/tắt tính năng theo nhu cầu', icon: 'module/settings', tint: 'mint' },
  { path: '/personalization', label: 'Cá nhân hóa', meta: 'Phong cách sống, giọng AI, ưu tiên', icon: 'module/profile', tint: 'violet' },
  { path: '/ai-memory', label: 'AI Memory', meta: 'Những gì AI ghi nhớ về bạn', icon: 'module/ai-coach', tint: 'sky' },
  { path: '/journey', label: 'Hành trình của tôi', meta: 'Nhiệm vụ & XP', icon: '🏆', tint: 'amber' },
  { path: '/decisions', label: 'Nhật ký quyết định', meta: 'Ghi lại & review quyết định', icon: '⚖️', tint: 'mint' },
  { path: '/area-dashboard', label: '10 lĩnh vực', meta: 'Tổng quan từng mảng cuộc sống', icon: 'module/life-areas', tint: 'orange' },
  { path: '/settings', label: 'Cài đặt', meta: 'Tài khoản, thông báo, dữ liệu', icon: 'module/settings', tint: 'violet' },
  { path: '/trash', label: 'Thùng rác', meta: 'Khôi phục mục đã xóa', icon: 'module/trash', tint: 'rose' },
];

export default function MePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const user = useLifeOSStore((s) => s.user);
  const setUser = useLifeOSStore((s) => s.setUser);
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  const pomodoroSessions = useLifeOSStore((s) => s.pomodoroSessions);
  const habits = useLifeOSStore((s) => s.habits);
  const goals = useLifeOSStore((s) => s.goals);
  const tasks = useLifeOSStore((s) => s.tasks);
  const startPomodoro = usePomodoroStore((s) => s.start);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('overview');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', birthday: '', bio: '' });

  const totalPomodoros = pomodoroSessions.filter((s) => s.phase === 'work').length;
  const totalMinutes = totalPomodoros * pomodoroSettings.workDuration;
  const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
  const bestStreak = activeHabits.reduce((m, h) => Math.max(m, h.streak || 0), 0);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const openTasks = tasks.filter((t) => t.status !== 'done' && !t.archived).length;
  const activeGoals = goals.filter((g) => g.status !== 'archived').length;

  const profileFields = [user.name, user.email, user.avatar, user.bio, user.vision, user.values?.length, user.roles?.length];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const missing = useMemo(() => [!user.email && 'email', !user.avatar && 'ảnh đại diện', !user.bio && 'giới thiệu', !user.vision && 'tầm nhìn'].filter(Boolean).join(', '), [user]);
  const displayName = user.name || authUser?.user_metadata?.name || 'LifeOS User';
  const displayEmail = user.email || authUser?.email;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 2MB)'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setUser({ avatar: reader.result as string }); toast.success('Đã cập nhật ảnh đại diện'); };
    reader.readAsDataURL(file);
  };
  const openEdit = () => { setDraft({ name: user.name || '', email: user.email || '', phone: user.phone || '', birthday: user.birthday || '', bio: user.bio || '' }); setEditing(true); };
  const save = (e: FormEvent) => { e.preventDefault(); setUser(draft); setEditing(false); toast.success('Đã lưu thông tin cá nhân!'); };

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Pomodoro" />
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-secondary/50 p-3 text-center"><p className="text-[20px] font-extrabold">🍅 {totalPomodoros}</p><p className="text-[11.5px] text-muted-foreground">Tổng phiên</p></div>
          <div className="rounded-2xl bg-secondary/50 p-3 text-center"><p className="text-[20px] font-extrabold text-primary">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p><p className="text-[11.5px] text-muted-foreground">Thời gian tập trung</p></div>
        </div>
        <Button variant="outline" className="w-full mt-3 rounded-full" onClick={() => startPomodoro()}>Bắt đầu tập trung</Button>
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Đang theo dõi" />
        <div className="space-y-1 -mx-2">
          <ItemRow icon={<LifeIcon name="module/tasks" size={20} variant="duotone" />} tint="sky" title="Việc đang mở" value={openTasks} onClick={() => navigate('/tasks')} />
          <ItemRow icon={<LifeIcon name="module/goals" size={20} variant="duotone" />} tint="rose" title="Mục tiêu" value={activeGoals} onClick={() => navigate('/goals')} />
        </div>
      </Surface>
      <MascotCard mascot="lumi" pose="happy" title="Là chính bạn" quote="Hiểu rõ bản thân là bước đầu tiên để sống cuộc đời bạn muốn." />
    </div>
  );

  return (
    <Page>
      <PageHeader title="Hồ sơ" subtitle="Thông tin cá nhân, tầm nhìn & giá trị của bạn 🌱"
        actions={!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openEdit}><Pencil className="h-4 w-4 mr-1.5" />Sửa hồ sơ</Button>} />
      <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'vision', label: 'Tầm nhìn & giá trị' }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#EFEBFF] via-[#F6F1FF] to-[#FFEFF6] dark:from-primary/20 dark:via-primary/10 dark:to-[#F2557A]/10 border border-border/40 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-full bg-card border-4 border-card shadow-soft grid place-items-center overflow-hidden">
                  {user.avatar ? <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" /> : <User className="h-11 w-11 text-muted-foreground" />}
                </div>
                <button aria-label="Đổi ảnh đại diện" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-soft hover:bg-primary/90"><Camera className="h-4 w-4" /></button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight">{displayName}</h2>
                {user.bio && <p className="text-[13px] text-muted-foreground mt-1">{user.bio}</p>}
                {displayEmail && <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-card/80 px-2.5 py-1 text-[11.5px] font-semibold"><Mail className="h-3 w-3" />{displayEmail}</span>}
                <div className="mt-3 max-w-sm mx-auto sm:mx-0">
                  <div className="flex justify-between text-[12px] font-semibold mb-1"><span className="text-muted-foreground">Hoàn thành hồ sơ</span><span>{profileCompletion}%</span></div>
                  <ProgressBar value={profileCompletion} />
                  {profileCompletion < 100 && missing && <p className="text-[11.5px] text-muted-foreground mt-1">Thêm {missing} để hoàn thiện hồ sơ</p>}
                </div>
              </div>
              {isMobile && <Button className="rounded-full" onClick={openEdit}><Pencil className="h-4 w-4 mr-1.5" />Sửa hồ sơ</Button>}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon="module/habits" tint="mint" value={activeHabits.length} label="Thói quen" hint="đang theo dõi" onClick={() => navigate('/habits')} />
            <StatTile icon={<span className="text-[22px]">🔥</span>} tint="orange" value={bestStreak} label="Chuỗi dài nhất" hint="ngày liên tiếp" onClick={() => navigate('/habits')} />
            <StatTile icon="module/focus" tint="violet" value={`${Math.round(totalMinutes / 60)}h`} label="Tập trung" hint={`${totalPomodoros} phiên`} />
            <StatTile icon="status/success" tint="sky" value={doneTasks} label="Việc hoàn thành" hint="tất cả thời gian" onClick={() => navigate('/tasks')} />
          </div>

          {view === 'overview' ? (
            <Surface className="p-2 sm:p-3">
              <div className="px-2 pt-1"><SectionTitle title="Tài khoản & tiện ích" /></div>
              <div className="space-y-0.5">
                {MENU.map((m) => (
                  <ItemRow key={m.path} icon={m.icon.includes('/') ? <LifeIcon name={m.icon as LifeIconName} size={20} variant="duotone" /> : m.icon} tint={m.tint} title={m.label} meta={m.meta}
                    trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} onClick={() => navigate(m.path)} />
                ))}
                {authUser && <ItemRow icon={<LogOut className="h-4 w-4 text-destructive" />} tint="rose" title={<span className="text-destructive">Đăng xuất</span>} onClick={async () => { await signOut(); toast.success('Đã đăng xuất'); navigate('/auth'); }} />}
              </div>
            </Surface>
          ) : (
            <VisionValuesManager />
          )}
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>

      <AdaptiveModal open={editing} onOpenChange={setEditing} title="Sửa hồ sơ">
        <form onSubmit={save} className="space-y-3.5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Họ tên"><input className={fieldCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Tên của bạn" /></Field>
            <Field label="Email"><input type="email" className={fieldCls} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="email@example.com" /></Field>
            <Field label="Số điện thoại"><input className={fieldCls} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="0123 456 789" /></Field>
            <Field label="Ngày sinh"><input type="date" className={fieldCls} value={draft.birthday} onChange={(e) => setDraft({ ...draft, birthday: e.target.value })} /></Field>
          </div>
          <Field label="Giới thiệu"><textarea className={areaCls} rows={3} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Giới thiệu ngắn về bản thân..." /></Field>
          <FormActions onCancel={() => setEditing(false)} submitLabel="Lưu thông tin" />
        </form>
      </AdaptiveModal>
    </Page>
  );
}
