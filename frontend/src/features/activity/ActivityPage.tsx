import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { format, isToday, isYesterday, parseISO, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { FilterChips, IconButton, Page, PageHeader, SearchToggle, Surface, TINTS, type Tint } from '@/components/lio';
import { LifeIcon, type LifeIconName } from '@/components/icons/LifeIcon';
import { EmptyState } from '@/components/brand/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActivityRow { id: string; module: string; action: string; entity_type: string | null; entity_id: string | null; title: string | null; details: { fields?: string[] } | null; created_at: string }

const MODULES: Record<string, { label: string; icon: LifeIconName; tint: Tint; to: string }> = {
  tasks: { label: 'Công việc', icon: 'module/tasks', tint: 'violet', to: '/tasks' },
  habits: { label: 'Thói quen', icon: 'module/habits', tint: 'mint', to: '/habits' },
  goals: { label: 'Mục tiêu', icon: 'module/goals', tint: 'rose', to: '/goals' },
  journal: { label: 'Nhật ký', icon: 'module/journal', tint: 'amber', to: '/journal' },
  notes: { label: 'Ghi chú', icon: 'module/notes', tint: 'sky', to: '/notes' },
  focus: { label: 'Focus', icon: 'module/focus', tint: 'rose', to: '/' },
  checkin: { label: 'Check-in', icon: 'module/today', tint: 'amber', to: '/' },
  reviews: { label: 'Review', icon: 'module/reviews', tint: 'sky', to: '/weekly-review' },
  'life-wheel': { label: 'Bánh xe', icon: 'module/life-areas', tint: 'orange', to: '/life-wheel' },
  vision: { label: 'Tầm nhìn', icon: 'module/goals', tint: 'violet', to: '/me?view=vision' },
  finance: { label: 'Tài chính', icon: 'module/finance', tint: 'mint', to: '/finance' },
  health: { label: 'Sức khỏe', icon: 'module/health', tint: 'rose', to: '/health' },
  learning: { label: 'Học tập', icon: 'module/learning', tint: 'sky', to: '/learning' },
  relationships: { label: 'Quan hệ', icon: 'module/relationships', tint: 'orange', to: '/relationships' },
  account: { label: 'Tài khoản', icon: 'module/profile', tint: 'violet', to: '/me' },
};
const NOUN: Record<string, string> = {
  task: 'công việc', habit: 'thói quen', goal: 'mục tiêu', journal: 'nhật ký', note: 'ghi chú', pomodoro: 'phiên Focus', checkin: 'check-in',
  weekly_review: 'review tuần', monthly_review: 'review tháng', yearly_review: 'review năm', life_wheel: 'bánh xe cuộc sống', vision: 'tầm nhìn',
  value: 'giá trị sống', role: 'vai trò', trait: 'đặc điểm', milestone: 'cột mốc', transaction: 'giao dịch', health_log: 'chỉ số sức khỏe',
  book: 'sách', course: 'khoá học', contact: 'liên hệ', profile: 'hồ sơ',
};
const VERB: Record<string, string> = {
  created: 'Đã thêm', updated: 'Đã chỉnh sửa', completed: 'Đã hoàn thành', uncompleted: 'Bỏ hoàn thành', trashed: 'Chuyển vào thùng rác',
  deleted: 'Đã xoá vĩnh viễn', restored: 'Đã khôi phục', archived: 'Đã lưu trữ', unarchived: 'Bỏ lưu trữ',
};
const ACTION_COLOR: Record<string, string> = { completed: '#22B07D', created: '#6C5CE7', trashed: '#F2557A', deleted: '#F2557A', restored: '#3D8BFD' };
const FIELD: Record<string, string> = {
  title: 'tiêu đề', name: 'tên', description: 'mô tả', content: 'nội dung', statement: 'nội dung', due_date: 'hạn', priority: 'ưu tiên', status: 'trạng thái',
  reminder_time: 'giờ nhắc', reminder_minutes: 'nhắc trước', area: 'lĩnh vực', areas: 'lĩnh vực', mood: 'tâm trạng', energy: 'năng lượng', images: 'ảnh',
  tags: 'thẻ', gratitude: 'điều biết ơn', progress: 'tiến độ', target_date: 'ngày đích', amount: 'số tiền', category: 'danh mục', frequency: 'tần suất',
  estimated_pomodoros: 'số pomodoro', goal_id: 'mục tiêu liên kết', timeframe: 'khung thời gian', icon: 'biểu tượng', priority_rank: 'thứ tự', date: 'ngày',
  avatar_url: 'ảnh đại diện', bio: 'giới thiệu', life_purpose: 'mục đích sống', life_purpose_images: 'ảnh mục đích', phone: 'số điện thoại', birthday: 'ngày sinh',
  recurring_frequency: 'lặp lại', notes: 'ghi chú', value: 'giá trị', data: 'nội dung',
};

const PAGE = 60;
const sentence = (r: ActivityRow) => {
  const noun = NOUN[r.entity_type || ''] || 'mục';
  if (r.module === 'focus' && r.action === 'created') return 'Hoàn thành phiên Focus';
  if (r.module === 'checkin') return r.action === 'created' || r.action === 'updated' ? 'Đã làm' : VERB[r.action] || r.action;
  if (r.entity_type === 'habit' && r.action === 'completed') return 'Đã check-in thói quen';
  if (r.entity_type === 'habit' && r.action === 'uncompleted') return 'Bỏ check-in thói quen';
  if (r.entity_type === 'profile') return 'Đã cập nhật';
  return `${VERB[r.action] || r.action} ${noun}`;
};
const dayLabel = (k: string) => {
  const d = parseISO(k);
  if (isToday(d)) return 'Hôm nay';
  if (isYesterday(d)) return 'Hôm qua';
  const s = format(d, "EEEE, d/M/yyyy", { locale: vi });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function ActivityPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [error, setError] = useState(false);
  const [mod, setMod] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback(async (offset: number, module: string) => {
    setLoading(true); setError(false);
    let query = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).range(offset, offset + PAGE - 1);
    if (module !== 'all') query = query.eq('module', module);
    const { data, error: err } = await query;
    setLoading(false);
    if (err) { setError(true); return; }
    const list = (data || []) as ActivityRow[];
    setRows((p) => (offset ? [...p, ...list] : list));
    setMore(list.length === PAGE);
  }, []);
  useEffect(() => { void load(0, mod); }, [load, mod]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? rows.filter((r) => `${r.title || ''} ${sentence(r)} ${MODULES[r.module]?.label || ''}`.toLowerCase().includes(n)) : rows;
  }, [rows, q]);
  const groups = useMemo(() => {
    const m = new Map<string, ActivityRow[]>();
    for (const r of shown) { const k = format(new Date(r.created_at), 'yyyy-MM-dd'); (m.get(k) || m.set(k, []).get(k)!).push(r); }
    return [...m.entries()];
  }, [shown]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = subDays(new Date(), 7).getTime();
  const todayCount = rows.filter((r) => r.created_at && format(new Date(r.created_at), 'yyyy-MM-dd') === todayKey).length;
  const doneWeek = rows.filter((r) => r.action === 'completed' && new Date(r.created_at).getTime() >= weekAgo).length;
  const createdWeek = rows.filter((r) => r.action === 'created' && new Date(r.created_at).getTime() >= weekAgo).length;

  const chips = [{ id: 'all', label: 'Tất cả' }, ...['tasks', 'habits', 'journal', 'goals', 'notes', 'vision', 'focus', 'checkin', 'reviews', 'finance', 'health', 'learning', 'relationships', 'account']
    .map((id) => ({ id, label: MODULES[id].label }))];

  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2"><button aria-label="Quay lại" onClick={() => navigate(-1)} className="h-9 w-9 -ml-1 rounded-full grid place-items-center hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></button>Lịch sử hoạt động</span>}
        subtitle="Mọi thay đổi bạn đã thực hiện trong LifeOS"
        actions={<>
          <SearchToggle value={q} onChange={setQ} placeholder="Tìm trong lịch sử..." />
          <IconButton label="Làm mới" onClick={() => load(0, mod)}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></IconButton>
        </>}
      />
      <div className="max-w-[860px] space-y-4">
        <Surface className="grid grid-cols-3 divide-x divide-border/60 py-3">
          {[{ v: todayCount, l: 'Hôm nay', c: '#6C5CE7' }, { v: doneWeek, l: 'Hoàn thành · 7 ngày', c: '#22B07D' }, { v: createdWeek, l: 'Đã thêm · 7 ngày', c: '#E8961C' }].map((x) => (
            <div key={x.l} className="px-3 text-center min-w-0">
              <p className="text-[20px] font-extrabold tabular-nums" style={{ color: x.c }}>{x.v}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{x.l}</p>
            </div>
          ))}
        </Surface>
        <FilterChips items={chips} value={mod} onChange={setMod} />

        {error ? (
          <Surface className="p-4 text-[13px] text-muted-foreground">Không tải được lịch sử. <button className="font-semibold text-primary" onClick={() => load(0, mod)}>Thử lại</button></Surface>
        ) : !loading && groups.length === 0 ? (
          <EmptyState mascot="ori" pose="learn" title={q || mod !== 'all' ? 'Không có hoạt động phù hợp' : 'Chưa có hoạt động nào'}
            description={q || mod !== 'all' ? 'Thử đổi bộ lọc hoặc từ khóa nhé.' : 'Khi bạn thêm, sửa hay hoàn thành việc gì, LifeOS sẽ ghi lại ở đây.'} />
        ) : (
          groups.map(([day, list]) => (
            <section key={day}>
              <h3 className="px-1 mb-2 text-[13px] font-bold text-muted-foreground">{dayLabel(day)} <span className="font-medium">· {list.length}</span></h3>
              <Surface className="p-1.5">
                {list.map((r, i) => {
                  const m = MODULES[r.module] || { label: r.module, icon: 'module/settings' as LifeIconName, tint: 'violet' as Tint, to: '/' };
                  const fields = r.action === 'updated' ? (r.details?.fields || []).map((f) => FIELD[f]).filter(Boolean) : [];
                  return (
                    <div key={r.id} role="button" tabIndex={0} onClick={() => navigate(m.to)} onKeyDown={(e) => e.key === 'Enter' && navigate(m.to)}
                      className={cn('flex items-start gap-3 rounded-[16px] px-2.5 py-2.5 cursor-pointer hover:bg-secondary/60', i > 0 && 'border-t border-border/40 rounded-t-none')}>
                      <span className={cn('relative h-10 w-10 rounded-[13px] grid place-items-center shrink-0', TINTS[m.tint].bg)}>
                        <LifeIcon name={m.icon} size={20} variant="duotone" />
                        {ACTION_COLOR[r.action] && <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card" style={{ background: ACTION_COLOR[r.action] }} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] leading-snug">
                          <span className="text-muted-foreground">{sentence(r)}</span>{r.title && <> <span className="font-semibold text-foreground break-words">“{r.title}”</span></>}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground mt-0.5">
                          {format(new Date(r.created_at), 'HH:mm')} · {m.label}{fields.length ? ` · Sửa ${[...new Set(fields)].slice(0, 4).join(', ')}` : ''}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </Surface>
            </section>
          ))
        )}
        {loading && <div className="py-6 grid place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        {!loading && more && rows.length > 0 && !q && (
          <Button variant="outline" className="w-full h-11 rounded-full" onClick={() => load(rows.length, mod)}>Xem thêm</Button>
        )}
        <p className="text-center text-[11.5px] text-muted-foreground pb-2">Lịch sử được lưu trong 12 tháng.</p>
      </div>
    </Page>
  );
}
