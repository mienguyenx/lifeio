// Module 24 — Admin: Thư viện mẫu (Mục tiêu/Thói quen/Công việc/Nhật ký/Review) (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminTemplatesPage.tsx (bản cũ: /admin/templates/<loại>/classic)
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, CheckSquare, ClipboardList, Copy, Eye, FileJson, Layers, Loader2, Pencil, Plus, Repeat, Sparkles, Target, Trash2, TrendingUp, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls, areaCls } from '@/components/lio/form';
import { useAdminTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useGenerateTemplatesWithAI, type AdminTemplate } from '@/hooks/useAdminData';
import type { Json } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ConfirmDialog, CountBars, GridHead, GridRow, MiniStat, Pager, Pill, RowMenu, fmtDate, useIsXl } from '../shared';

export type TemplateType = 'goals' | 'habits' | 'tasks' | 'journal' | 'review';
// Giữ nguyên cấu hình trường nội dung của bản cũ
const TYPES: Record<TemplateType, { label: string; title: string; icon: typeof Target; color: string; description: string; fields: string[]; hint: string }> = {
  goals: { label: 'Mục tiêu', title: 'Mẫu mục tiêu', icon: Target, color: '#7C5CFC', description: 'Khung đặt và đạt mục tiêu', fields: ['title', 'description', 'area', 'milestones', 'suggested_duration_days', 'priority', 'tips'], hint: 'fitness, career' },
  habits: { label: 'Thói quen', title: 'Mẫu thói quen', icon: Repeat, color: '#22B07D', description: 'Khung xây dựng thói quen tốt', fields: ['name', 'description', 'area', 'frequency', 'target_per_day', 'target_unit', 'suggested_time', 'difficulty', 'benefits', 'tips'], hint: 'morning routine' },
  tasks: { label: 'Công việc', title: 'Mẫu công việc', icon: CheckSquare, color: '#2F7BF6', description: 'Khung tạo công việc nhanh', fields: ['title', 'description', 'area', 'priority', 'estimatedPomodoros', 'dueDate', 'goalId'], hint: 'deep work' },
  journal: { label: 'Nhật ký', title: 'Mẫu nhật ký', icon: BookOpen, color: '#F0587A', description: 'Khung viết nhật ký & phản tư', fields: ['title', 'description', 'prompts', 'mood_tracking', 'gratitude_section', 'suggested_areas', 'best_for'], hint: 'self-reflection' },
  review: { label: 'Review', title: 'Mẫu review', icon: ClipboardList, color: '#F5A524', description: 'Khung review & lập kế hoạch tuần', fields: ['title', 'description', 'sections', 'rating_scale', 'focus_areas', 'estimated_time_minutes'], hint: 'weekly planning' },
};
const TYPE_IDS = Object.keys(TYPES) as TemplateType[];
const COLS = 'minmax(0,1.7fr) minmax(0,1fr) 84px 96px 64px 40px';
type Draft = { id?: string; name: string; description: string; json: string };
type Generated = Record<string, unknown> & { title?: string; name?: string; description?: string; area?: string };
const contentObj = (c: Json | null | undefined) => (c && typeof c === 'object' && !Array.isArray(c) ? (c as Record<string, unknown>) : {});
const shortVal = (v: unknown) => (Array.isArray(v) ? `${v.length} mục` : typeof v === 'object' && v ? '{…}' : String(v));

export default function AdminTemplatesPage({ type }: { type: TemplateType }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const cfg = TYPES[type] ?? TYPES.goals;
  const { data: allTemplates, isLoading } = useAdminTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const generate = useGenerateTemplatesWithAI();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'on' | 'off'>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [jsonError, setJsonError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AdminTemplate | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCategory, setAiCategory] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generated, setGenerated] = useState<Generated[]>([]);

  const everything = useMemo(() => allTemplates ?? [], [allTemplates]);
  const all = useMemo(() => everything.filter((t) => t.type === type), [everything, type]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((t) => (status === 'all' || (status === 'on' ? t.is_active : !t.is_active)) && (!q || t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)));
  }, [all, status, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = all.find((t) => t.id === selectedId) ?? null;
  const uses = all.reduce((a, t) => a + (t.usage_count || 0), 0);

  const skeleton = () => JSON.stringify(Object.fromEntries(cfg.fields.map((f) => [f, ''])), null, 2);
  const openCreate = () => { setJsonError(''); setDraft({ name: '', description: '', json: '{}' }); };
  const openEdit = (t: AdminTemplate) => { setJsonError(''); setDraft({ id: t.id, name: t.name, description: t.description ?? '', json: JSON.stringify(t.content ?? {}, null, 2) }); };
  // Bản cũ parse JSON ngay khi gõ nên không thể nhập JSON dở dang — giữ chuỗi thô và chỉ kiểm tra khi lưu
  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) { toast.error('Cần nhập tên mẫu'); return; }
    let content: Json;
    try { content = JSON.parse(draft.json || '{}'); } catch { setJsonError('JSON không hợp lệ'); return; }
    if (draft.id) updateTemplate.mutate({ id: draft.id, name: draft.name, description: draft.description, content }, { onSuccess: () => setDraft(null) });
    else createTemplate.mutate({ name: draft.name, type, description: draft.description, content }, { onSuccess: () => setDraft(null) });
  };
  const copyJson = (t: AdminTemplate) => { navigator.clipboard.writeText(JSON.stringify(t.content, null, 2)); toast.success('Đã sao chép JSON'); };
  const runAI = async () => {
    const result = (await generate.mutateAsync({ type, prompt: aiPrompt, category: aiCategory })) as { templates?: Generated[] } | null;
    if (result?.templates) { setGenerated(result.templates); toast.success(`Đã tạo ${result.templates.length} mẫu`); }
  };
  const addGenerated = (g: Generated, silent = false) => {
    const name = g.title || g.name || 'Untitled Template';
    createTemplate.mutate({ name, type, description: g.description || '', content: g as Json }, { onSuccess: () => { setGenerated((prev) => prev.filter((x) => x !== g)); if (!silent) toast.success(`Đã thêm “${name}”`); } });
  };

  const typeTabs = TYPE_IDS.map((id) => ({ id, label: TYPES[id].label, count: everything.filter((t) => t.type === id).length }));
  const topUsed = [...all].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5);
  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4"><SectionTitle title="Mẫu theo loại" hint={`${everything.length} mẫu`} /><CountBars items={TYPE_IDS.map((id) => ({ label: TYPES[id].label, value: everything.filter((t) => t.type === id).length, color: TYPES[id].color }))} /></Surface>
      <Surface className="p-4">
        <SectionTitle title="Dùng nhiều nhất" hint={cfg.label} />
        {topUsed.length ? <div className="space-y-1.5">{topUsed.map((t, i) => (
          <button key={t.id} onClick={() => setSelectedId(t.id)} className="w-full flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left hover:bg-secondary/60">
            <span className="h-6 w-6 rounded-full grid place-items-center bg-secondary text-[11px] font-bold shrink-0">{i + 1}</span>
            <span className="text-[12.5px] font-semibold flex-1 truncate">{t.name}</span><span className="text-[12px] text-muted-foreground tabular-nums">{t.usage_count || 0}</span>
          </button>
        ))}</div> : <p className="text-[12.5px] text-muted-foreground">Chưa có mẫu.</p>}
      </Surface>
      <MascotCard mascot="mochi" pose="focus" title="Mẫu tốt = khởi đầu nhanh" quote="Dùng “Tạo bằng AI” để có ngay vài mẫu gợi ý, rồi tinh chỉnh JSON." />
    </div>
  );
  const detail = selected && (
    <TemplateDetail key={selected.id} t={selected} type={type} inPanel={isXl} onClose={() => setSelectedId(null)} onEdit={() => openEdit(selected)} onCopy={() => copyJson(selected)}
      onToggle={() => updateTemplate.mutate({ id: selected.id, is_active: !selected.is_active })} onDelete={() => setConfirmDelete(selected)} />
  );
  const side = isXl && detail ? detail : overviewSide;
  const Icon = cfg.icon;

  return (
    <Page>
      <PageHeader title="Thư viện mẫu" subtitle="Mẫu khởi tạo cho mục tiêu, thói quen, công việc, nhật ký và review"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm mẫu..." />
          {!isMobile && <Button variant="outline" className="h-10 rounded-full px-4 bg-card" onClick={() => setAiOpen(true)}><Sparkles className="h-4 w-4 mr-1.5" />Tạo bằng AI</Button>}
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm mẫu</Button>}
        </>} />
      <div className="mb-5 overflow-x-auto -mx-1 px-1"><SegmentedTabs items={typeTabs} value={type} onChange={(v) => { setSelectedId(null); setPage(0); navigate(`/admin/templates/${v}`); }} full={isMobile} /></div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="mochi" pose="focus" title={cfg.title} subtitle={`${cfg.description} · ${all.length} mẫu, ${uses.toLocaleString()} lượt dùng.`}
            action={<div className="flex gap-2 flex-wrap"><Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Mẫu mới</Button>{isMobile && <Button variant="outline" className="h-10 rounded-full px-4 bg-card" onClick={() => setAiOpen(true)}><Sparkles className="h-4 w-4 mr-1.5" />AI</Button>}</div>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<Icon className="h-5 w-5" />} tint="violet" value={all.length} label={cfg.title} onClick={() => setStatus('all')} active={status === 'all'} />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={all.filter((t) => t.is_active).length} label="Đang bật" hint="hiển thị" onClick={() => setStatus('on')} active={status === 'on'} />
            <StatTile icon={<TrendingUp className="h-5 w-5" />} tint="sky" value={uses.toLocaleString()} label="Lượt dùng" hint="tổng" />
            <StatTile icon={<Layers className="h-5 w-5" />} tint="amber" value={everything.length} label="Toàn thư viện" hint="5 loại" />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className={cn('flex gap-2 px-1 mb-3', isMobile ? 'flex-col' : 'items-center')}>
              <SectionTitle title="Danh sách mẫu" hint={`${filtered.length} mẫu`} className="mb-0" />
              <SegmentedTabs size="sm" className={cn(!isMobile && 'ml-auto')} full={isMobile} items={[{ id: 'all', label: 'Tất cả' }, { id: 'on', label: 'Đang bật' }, { id: 'off', label: 'Đang tắt' }]} value={status} onChange={(v) => { setStatus(v); setPage(0); }} />
            </div>
            {isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
              : filtered.length === 0 ? <EmptyState mascot="mochi" pose="focus" compact title={all.length ? 'Không tìm thấy mẫu' : `Chưa có ${cfg.title.toLowerCase()}`} description={all.length ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Thêm thủ công hoặc tạo bằng AI.'}
                  action={!all.length ? <div className="flex gap-2 justify-center"><Button variant="outline" className="rounded-full" onClick={() => setAiOpen(true)}><Sparkles className="h-4 w-4 mr-1.5" />Tạo bằng AI</Button><Button className="rounded-full" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Thêm mẫu</Button></div> : undefined} />
              : isMobile ? (
                <div className="divide-y divide-border/50">
                  {paged.map((t) => (
                    <div key={t.id} role="button" tabIndex={0} onClick={() => setSelectedId(t.id)} className={cn('flex items-center gap-3 px-1 py-3', !t.is_active && 'opacity-60')}>
                      <span className="h-10 w-10 rounded-xl grid place-items-center shrink-0 text-white" style={{ background: cfg.color }}><Icon className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold truncate">{t.name}</p><p className="text-[12px] text-muted-foreground truncate">{t.description || 'Không có mô tả'}</p><div className="flex items-center gap-1.5 mt-1"><Pill tone="blue">{t.usage_count || 0} lượt</Pill><Pill>{Object.keys(contentObj(t.content)).length} trường</Pill></div></div>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={t.is_active} onCheckedChange={() => updateTemplate.mutate({ id: t.id, is_active: !t.is_active })} aria-label={`Bật ${t.name}`} /></span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <GridHead cols={COLS}><span>Mẫu</span><span>Nội dung</span><span>Lượt dùng</span><span>Cập nhật</span><span>Bật</span><span /></GridHead>
                  {paged.map((t) => { const c = contentObj(t.content); const ks = Object.keys(c); return (
                    <GridRow key={t.id} cols={COLS} onClick={() => setSelectedId(t.id)} active={selectedId === t.id} className={cn(!t.is_active && 'opacity-70')}>
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="h-9 w-9 rounded-xl grid place-items-center shrink-0 text-white" style={{ background: cfg.color }}><Icon className="h-[18px] w-[18px]" /></span>
                        <div className="min-w-0"><p className="text-[13.5px] font-semibold truncate">{t.name}</p><p className="text-[11.5px] text-muted-foreground truncate">{t.description || 'Không có mô tả'}</p></div>
                      </div>
                      <span className="flex gap-1 min-w-0 overflow-hidden">{ks.slice(0, 2).map((k) => <Pill key={k}>{k}</Pill>)}{ks.length > 2 && <Pill tone="violet">+{ks.length - 2}</Pill>}{!ks.length && <span className="text-[12px] text-muted-foreground">Trống</span>}</span>
                      <span><Pill tone="blue">{t.usage_count || 0}</Pill></span>
                      <span className="text-[12px] text-muted-foreground">{fmtDate(t.updated_at)}</span>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={t.is_active} onCheckedChange={() => updateTemplate.mutate({ id: t.id, is_active: !t.is_active })} aria-label={`Bật ${t.name}`} /></span>
                      <RowMenu items={[
                        { label: 'Xem nội dung', icon: <Eye />, onClick: () => setSelectedId(t.id) },
                        { label: 'Chỉnh sửa', icon: <Pencil />, onClick: () => openEdit(t) },
                        { label: 'Sao chép JSON', icon: <Copy />, onClick: () => copyJson(t) },
                        { label: 'Xóa mẫu', icon: <Trash2 />, onClick: () => setConfirmDelete(t), danger: true, separator: true },
                      ]} />
                    </GridRow>
                  ); })}
                </div>
              )}
            {filtered.length > 0 && <Pager page={safePage} pages={pages} total={filtered.length} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(0); }} />}
          </Surface>
          {isMobile && overviewSide}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && <Fab onClick={openCreate} label="Thêm mẫu" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title="Chi tiết mẫu">{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? 'Chỉnh sửa mẫu' : `Thêm ${cfg.title.toLowerCase()}`} description="Mẫu là điểm khởi đầu người dùng có thể áp dụng">
        {draft && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <Field label="Tên mẫu *"><input className={fieldCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="VD: Chạy bộ 5km" autoFocus /></Field>
            <Field label="Mô tả"><textarea className={areaCls} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Mô tả ngắn..." /></Field>
            <Field label="Nội dung (JSON)" hint={<span>Trường gợi ý: {cfg.fields.join(', ')}</span>}>
              <textarea className={cn(areaCls, 'font-mono text-[12.5px]', jsonError && 'border-destructive')} rows={9} value={draft.json} onChange={(e) => { setDraft({ ...draft, json: e.target.value }); setJsonError(''); }} spellCheck={false} />
            </Field>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setDraft({ ...draft, json: skeleton() })}><Wand2 className="h-3.5 w-3.5 mr-1" />Chèn khung trường</Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => { try { setDraft({ ...draft, json: JSON.stringify(JSON.parse(draft.json), null, 2) }); } catch { setJsonError('JSON không hợp lệ'); } }}><FileJson className="h-3.5 w-3.5 mr-1" />Định dạng</Button>
              {jsonError && <span className="text-[12px] font-semibold text-destructive">{jsonError}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setDraft(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!draft.name.trim() || createTemplate.isPending || updateTemplate.isPending}>{draft.id ? 'Lưu thay đổi' : 'Tạo mẫu'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <AdaptiveModal open={aiOpen} onOpenChange={setAiOpen} title={`Tạo ${cfg.title.toLowerCase()} bằng AI`} description="Tùy chỉnh bằng danh mục hoặc hướng dẫn thêm">
        <div className="space-y-3.5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Danh mục (tùy chọn)"><input className={fieldCls} value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} placeholder={`VD: ${cfg.hint}`} /></Field>
            <Field label="Hướng dẫn (tùy chọn)"><input className={fieldCls} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Yêu cầu thêm cho AI..." /></Field>
          </div>
          <Button className="w-full h-11 rounded-full shadow-soft" onClick={runAI} disabled={generate.isPending}>{generate.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}{generate.isPending ? 'Đang tạo...' : 'Tạo mẫu'}</Button>
          {generated.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between"><p className="text-[13px] font-bold">Kết quả ({generated.length})</p><Button variant="outline" size="sm" className="rounded-full" onClick={() => { generated.forEach((g) => addGenerated(g, true)); setAiOpen(false); toast.success('Đã thêm tất cả mẫu'); }}><Plus className="h-3.5 w-3.5 mr-1" />Thêm tất cả</Button></div>
              <div className="max-h-72 overflow-auto space-y-2 pr-1">
                {generated.map((g, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-2xl border border-border/60 p-3">
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{g.title || g.name}</p>{g.description && <p className="text-[12px] text-muted-foreground line-clamp-2">{g.description}</p>}{g.area && <Pill className="mt-1">{g.area}</Pill>}</div>
                    <IconButton label="Thêm mẫu này" onClick={() => addGenerated(g)}><Plus className="h-4 w-4" /></IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdaptiveModal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)} title={`Xóa mẫu “${confirmDelete?.name ?? ''}”?`} description="Người dùng sẽ không thấy mẫu này nữa."
        onConfirm={() => { if (confirmDelete) deleteTemplate.mutate(confirmDelete.id, { onSuccess: () => setSelectedId(null) }); setConfirmDelete(null); }} />
    </Page>
  );
}

function TemplateDetail({ t, type, inPanel, onClose, onEdit, onCopy, onToggle, onDelete }: { t: AdminTemplate; type: TemplateType; inPanel: boolean; onClose: () => void; onEdit: () => void; onCopy: () => void; onToggle: () => void; onDelete: () => void }) {
  const cfg = TYPES[type];
  const Icon = cfg.icon;
  const c = contentObj(t.content);
  const [raw, setRaw] = useState(false);
  const missing = cfg.fields.filter((f) => !(f in c));
  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-[52px] w-[52px] rounded-2xl grid place-items-center shrink-0 text-white" style={{ background: cfg.color }}><Icon className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold">{t.name}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap"><Pill tone={t.is_active ? 'green' : 'gray'}>{t.is_active ? 'Đang bật' : 'Đang tắt'}</Pill><Pill tone="violet">{cfg.label}</Pill></div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      {t.description && <p className="text-[12.5px] text-muted-foreground">{t.description}</p>}
      <div className="grid grid-cols-3 gap-2"><MiniStat label="Lượt dùng" value={t.usage_count || 0} /><MiniStat label="Trường" value={Object.keys(c).length} /><MiniStat label="Cập nhật" value={<span className="text-[13px]">{fmtDate(t.updated_at, 'dd/MM')}</span>} /></div>
      <div>
        <div className="flex items-center justify-between mb-1.5"><p className="text-[12px] font-semibold text-muted-foreground">Nội dung</p><button className="text-[11.5px] font-semibold text-primary hover:underline" onClick={() => setRaw(!raw)}>{raw ? 'Xem dạng danh sách' : 'Xem JSON'}</button></div>
        {raw ? <pre className="rounded-2xl bg-secondary/50 p-3 text-[11px] font-mono overflow-auto max-h-72">{JSON.stringify(t.content, null, 2)}</pre> : (
          <div className="rounded-2xl bg-secondary/40 divide-y divide-border/40">
            {Object.entries(c).map(([k, v]) => (
              <div key={k} className="px-3 py-2"><p className="text-[11px] font-semibold text-muted-foreground">{k}</p>
                {Array.isArray(v) ? <ul className="mt-0.5 space-y-0.5">{v.slice(0, 6).map((x, i) => <li key={i} className="text-[12.5px] truncate">• {typeof x === 'object' ? JSON.stringify(x) : String(x)}</li>)}{v.length > 6 && <li className="text-[11.5px] text-muted-foreground">+{v.length - 6}</li>}</ul> : <p className="text-[12.5px] break-words">{shortVal(v)}</p>}
              </div>
            ))}
            {!Object.keys(c).length && <p className="px-3 py-3 text-[12.5px] text-muted-foreground">Nội dung trống.</p>}
          </div>
        )}
        {missing.length > 0 && <p className="text-[11.5px] text-muted-foreground mt-1.5">Thiếu trường gợi ý: {missing.join(', ')}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-10 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onCopy}><Copy className="h-4 w-4 mr-1.5" />Sao chép</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onToggle}>{t.is_active ? 'Tắt mẫu' : 'Bật mẫu'}</Button>
        <Button variant="outline" className="h-10 rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1.5" />Xóa</Button>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
