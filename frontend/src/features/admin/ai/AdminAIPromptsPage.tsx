// Module 27 — Admin: Thư viện prompt AI (LIO kit)
// Dữ liệu/hành động giữ nguyên từ pages/admin/AdminAIPrompts.tsx (bản cũ: /admin/ai/prompts/classic)
import { useMemo, useState } from 'react';
import { Bot, Braces, CheckCircle2, Copy, FolderOpen, MessageSquare, Pencil, Plus, Power, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { Fab, HeroBanner, IconButton, MascotCard, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, fieldCls, areaCls } from '@/components/lio/form';
import { useAIPrompts, useCreateAIPrompt, useUpdateAIPrompt, useDeleteAIPrompt, useAIModels, type AIPrompt } from '@/hooks/useAdminData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ConfirmDialog, CountBars, GridHead, GridRow, InfoRow, Pager, Pill, RowMenu, fmtDate, useIsXl } from '../shared';

const COLS = 'minmax(0,1.6fr) minmax(0,0.8fr) minmax(0,1fr) 72px 64px 40px';
type Draft = Omit<AIPrompt, 'id' | 'created_at' | 'updated_at'> & { id?: string };
const EMPTY: Draft = { name: '', prompt_key: '', category: 'general', system_prompt: '', user_prompt_template: '', description: '', variables: [], model_id: null, is_active: true };
/** Lấy biến dạng {{ten_bien}} trong prompt — lưu vào trường variables có sẵn (bản cũ luôn để trống) */
const extractVars = (...texts: (string | null | undefined)[]) => [...new Set(texts.flatMap((t) => [...(t ?? '').matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1])))];

export default function AdminAIPromptsPage() {
  const isMobile = useIsMobile();
  const isXl = useIsXl();
  const { data: prompts, isLoading } = useAIPrompts();
  const { data: models } = useAIModels();
  const createPrompt = useCreateAIPrompt();
  const updatePrompt = useUpdateAIPrompt();
  const deletePrompt = useDeleteAIPrompt();

  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AIPrompt | null>(null);

  const all = useMemo(() => prompts ?? [], [prompts]);
  const categories = useMemo(() => [...new Set(all.map((p) => p.category))], [all]);
  const activeModels = (models ?? []).filter((m) => m.is_active);
  const modelName = (id: string | null) => (id ? (models ?? []).find((m) => m.id === id)?.name ?? 'Model đã xóa' : 'Mặc định');
  const varsOf = (p: Pick<AIPrompt, 'variables' | 'system_prompt' | 'user_prompt_template'>) => (p.variables?.length ? p.variables : extractVars(p.system_prompt, p.user_prompt_template));
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((p) => (cat === 'all' || p.category === cat) && (!q || p.name.toLowerCase().includes(q) || p.prompt_key.toLowerCase().includes(q) || p.system_prompt.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)));
  }, [all, cat, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = all.find((p) => p.id === selectedId) ?? null;

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success('Đã sao chép'); };
  const toggle = (p: AIPrompt) => updatePrompt.mutate({ id: p.id, is_active: !p.is_active });
  const save = () => {
    if (!draft) return;
    const variables = extractVars(draft.system_prompt, draft.user_prompt_template);
    if (draft.id) updatePrompt.mutate({ id: draft.id, name: draft.name, category: draft.category, system_prompt: draft.system_prompt, user_prompt_template: draft.user_prompt_template, description: draft.description, model_id: draft.model_id, variables }, { onSuccess: () => setDraft(null) });
    else { const { id: _o, ...rest } = draft; void _o; createPrompt.mutate({ ...rest, variables, is_active: true }, { onSuccess: () => setDraft(null) }); }
  };
  const openEdit = (p: AIPrompt) => setDraft({ ...p, variables: [...(p.variables ?? [])] });

  const overviewSide = (
    <div className="space-y-4">
      <Surface className="p-4"><SectionTitle title="Prompt theo danh mục" hint={`${categories.length} danh mục`} /><CountBars items={categories.map((c) => ({ label: <span className="capitalize">{c}</span>, value: all.filter((p) => p.category === c).length }))} /></Surface>
      <Surface className="p-4"><SectionTitle title="Model được gán" /><CountBars items={[...new Set(all.map((p) => p.model_id))].map((id) => ({ label: modelName(id), value: all.filter((p) => p.model_id === id).length }))} /></Surface>
      <MascotCard mascot="lumi" pose="love" title="Viết prompt hay" quote="Dùng {{ten_bien}} trong mẫu — biến sẽ được nhận diện và lưu tự động." />
    </div>
  );
  const detail = selected && (
    <PromptDetail key={selected.id} p={selected} vars={varsOf(selected)} modelName={modelName(selected.model_id)} inPanel={isXl} onClose={() => setSelectedId(null)} onCopy={copy}
      onEdit={() => openEdit(selected)} onToggle={() => toggle(selected)} onDelete={() => setConfirmDelete(selected)} />
  );
  const side = isXl && detail ? detail : overviewSide;
  const d = draft;
  const draftVars = d ? extractVars(d.system_prompt, d.user_prompt_template) : [];

  return (
    <Page>
      <PageHeader title="Thư viện prompt" subtitle="System prompt và mẫu prompt cho các tính năng AI"
        actions={<>
          <SearchToggle value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Tìm prompt..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setDraft({ ...EMPTY })}><Plus className="h-4 w-4 mr-1.5" />Thêm prompt</Button>}
        </>} />
      <div className="mb-5 overflow-x-auto -mx-1 px-1"><SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: all.length }, ...categories.map((c) => ({ id: c, label: <span className="capitalize">{c}</span>, count: all.filter((p) => p.category === c).length }))]} value={cat} onChange={(v) => { setCat(v); setPage(0); }} /></div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="lumi" pose="love" title="Giọng nói của AI Coach" subtitle={all.length ? `${all.filter((p) => p.is_active).length}/${all.length} prompt đang bật trong ${categories.length} danh mục.` : 'Tạo prompt đầu tiên cho tính năng AI.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => setDraft({ ...EMPTY })}><Plus className="h-4 w-4 mr-1.5" />Prompt mới</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<MessageSquare className="h-5 w-5" />} tint="violet" value={all.length} label="Prompt" onClick={() => setCat('all')} active={cat === 'all'} />
            <StatTile icon={<CheckCircle2 className="h-5 w-5" />} tint="mint" value={all.filter((p) => p.is_active).length} label="Đang bật" hint={`${all.filter((p) => !p.is_active).length} đang tắt`} />
            <StatTile icon={<FolderOpen className="h-5 w-5" />} tint="amber" value={categories.length} label="Danh mục" />
            <StatTile icon={<Bot className="h-5 w-5" />} tint="sky" value={all.filter((p) => p.model_id).length} label="Model riêng" hint="khác: mặc định" />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Danh sách prompt" hint={`${filtered.length} prompt`} /></div>
            {isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
              : filtered.length === 0 ? <EmptyState mascot="lumi" compact title={all.length ? 'Không tìm thấy prompt' : 'Chưa có prompt'} description={all.length ? 'Thử đổi danh mục hoặc từ khóa.' : 'Nhấn “Thêm prompt” để bắt đầu.'} />
              : isMobile ? (
                <div className="divide-y divide-border/50">
                  {paged.map((p) => (
                    <div key={p.id} role="button" tabIndex={0} onClick={() => setSelectedId(p.id)} className={cn('flex items-center gap-3 px-1 py-3', !p.is_active && 'opacity-60')}>
                      <span className="h-10 w-10 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0"><MessageSquare className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold truncate">{p.name}</p><p className="text-[11.5px] text-muted-foreground font-mono truncate">{p.prompt_key}</p><div className="flex items-center gap-1.5 mt-1"><Pill className="capitalize">{p.category}</Pill><Pill tone="blue">{modelName(p.model_id)}</Pill></div></div>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={p.is_active} onCheckedChange={() => toggle(p)} aria-label={`Bật ${p.name}`} /></span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <GridHead cols={COLS}><span>Prompt</span><span>Danh mục</span><span>Model</span><span>Biến</span><span>Bật</span><span /></GridHead>
                  {paged.map((p) => (
                    <GridRow key={p.id} cols={COLS} onClick={() => setSelectedId(p.id)} active={selectedId === p.id} className={cn(!p.is_active && 'opacity-70')}>
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="h-9 w-9 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0"><MessageSquare className="h-[18px] w-[18px]" /></span>
                        <div className="min-w-0"><p className="text-[13.5px] font-semibold truncate">{p.name}</p><p className="text-[11px] text-muted-foreground font-mono truncate">{p.prompt_key}</p></div>
                      </div>
                      <span><Pill className="capitalize">{p.category}</Pill></span>
                      <span className="text-[12.5px] truncate">{modelName(p.model_id)}</span>
                      <span><Pill tone="violet" icon={<Braces className="h-3 w-3" />}>{varsOf(p).length}</Pill></span>
                      <span onClick={(e) => e.stopPropagation()}><Switch checked={p.is_active} onCheckedChange={() => toggle(p)} aria-label={`Bật ${p.name}`} /></span>
                      <RowMenu items={[
                        { label: 'Chỉnh sửa', icon: <Pencil />, onClick: () => openEdit(p) },
                        { label: 'Sao chép system prompt', icon: <Copy />, onClick: () => copy(p.system_prompt) },
                        { label: p.is_active ? 'Tắt prompt' : 'Bật prompt', icon: <Power />, onClick: () => toggle(p) },
                        { label: 'Xóa prompt', icon: <Trash2 />, onClick: () => setConfirmDelete(p), danger: true, separator: true },
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
      {isMobile && <Fab onClick={() => setDraft({ ...EMPTY })} label="Thêm prompt" />}

      <AdaptiveModal open={!!selected && !isXl} onOpenChange={(o) => !o && setSelectedId(null)} title="Chi tiết prompt">{!isXl && detail}</AdaptiveModal>

      <AdaptiveModal open={!!d} onOpenChange={(o) => !o && setDraft(null)} title={d?.id ? `Chỉnh sửa: ${d.name}` : 'Thêm prompt'}>
        {d && (
          <form className="space-y-3.5 mt-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên *"><input className={fieldCls} value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} placeholder="VD: Goal Coach" autoFocus /></Field>
              <Field label="Key (duy nhất) *"><input className={cn(fieldCls, 'font-mono text-[13px]', d.id && 'opacity-60')} disabled={!!d.id} value={d.prompt_key} onChange={(e) => setDraft({ ...d, prompt_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="goal_coach" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Danh mục"><input className={fieldCls} list="admin-prompt-cats" value={d.category} onChange={(e) => setDraft({ ...d, category: e.target.value })} placeholder="coach" /><datalist id="admin-prompt-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
              <Field label="Model AI">
                <Select value={d.model_id || 'default'} onValueChange={(v) => setDraft({ ...d, model_id: v === 'default' ? null : v })}>
                  <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="default">Dùng model mặc định</SelectItem>{activeModels.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Mô tả"><input className={fieldCls} value={d.description ?? ''} onChange={(e) => setDraft({ ...d, description: e.target.value })} placeholder="Mô tả ngắn công dụng" /></Field>
            <Field label="System prompt *"><textarea className={cn(areaCls, 'font-mono text-[12.5px]')} rows={7} value={d.system_prompt} onChange={(e) => setDraft({ ...d, system_prompt: e.target.value })} placeholder="Bạn là trợ lý..." /></Field>
            <Field label="Mẫu prompt người dùng (tùy chọn)"><textarea className={cn(areaCls, 'font-mono text-[12.5px]')} rows={4} value={d.user_prompt_template ?? ''} onChange={(e) => setDraft({ ...d, user_prompt_template: e.target.value })} placeholder="VD: Mục tiêu của tôi là {{goal}}" /></Field>
            <div className="flex items-center gap-1.5 flex-wrap text-[12px]"><span className="font-semibold text-muted-foreground">Biến nhận diện:</span>{draftVars.length ? draftVars.map((v) => <Pill key={v} tone="violet">{`{{${v}}}`}</Pill>) : <span className="text-muted-foreground">chưa có</span>}<span className="ml-auto text-muted-foreground tabular-nums">{d.system_prompt.length.toLocaleString()} ký tự</span></div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => setDraft(null)}>Hủy</Button>
              <Button type="submit" className="h-11 rounded-full shadow-soft" disabled={!d.name || !d.prompt_key || !d.system_prompt || createPrompt.isPending || updatePrompt.isPending}>{d.id ? 'Lưu thay đổi' : 'Tạo prompt'}</Button>
            </div>
          </form>
        )}
      </AdaptiveModal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)} title={`Xóa prompt “${confirmDelete?.name ?? ''}”?`} description="Tính năng dùng key này sẽ quay về prompt mặc định trong mã."
        onConfirm={() => { if (confirmDelete) deletePrompt.mutate(confirmDelete.id, { onSuccess: () => setSelectedId(null) }); setConfirmDelete(null); }} />
    </Page>
  );
}

function PromptDetail({ p, vars, modelName, inPanel, onClose, onCopy, onEdit, onToggle, onDelete }: { p: AIPrompt; vars: string[]; modelName: string; inPanel: boolean; onClose: () => void; onCopy: (t: string) => void; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const block = (title: string, text: string) => (
    <div>
      <div className="flex items-center justify-between mb-1.5"><p className="text-[12px] font-semibold text-muted-foreground">{title}</p><IconButton label={`Sao chép ${title.toLowerCase()}`} onClick={() => onCopy(text)}><Copy className="h-3.5 w-3.5" /></IconButton></div>
      <pre className="rounded-2xl bg-secondary/50 p-3 text-[11.5px] font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">{text}</pre>
    </div>
  );
  const body = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-[52px] w-[52px] rounded-2xl grid place-items-center bg-primary/10 text-primary shrink-0"><MessageSquare className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold">{p.name}</p>
          <p className="text-[11.5px] text-muted-foreground font-mono truncate">{p.prompt_key}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap"><Pill tone={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'Đang bật' : 'Đang tắt'}</Pill><Pill className="capitalize">{p.category}</Pill></div>
        </div>
        {inPanel && <IconButton label="Đóng" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
      </div>
      {p.description && <p className="text-[12.5px] text-muted-foreground">{p.description}</p>}
      <div className="rounded-2xl bg-secondary/40 px-3 py-1.5"><InfoRow label="Model" value={modelName} /><InfoRow label="Độ dài" value={`${p.system_prompt.length.toLocaleString()} ký tự`} /><InfoRow label="Cập nhật" value={fmtDate(p.updated_at)} /></div>
      {vars.length > 0 && <div className="flex flex-wrap gap-1.5">{vars.map((v) => <Pill key={v} tone="violet">{`{{${v}}}`}</Pill>)}</div>}
      {block('System prompt', p.system_prompt)}
      {p.user_prompt_template && block('Mẫu prompt người dùng', p.user_prompt_template)}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="h-10 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1" />Sửa</Button>
        <Button variant="outline" className="h-10 rounded-full" onClick={onToggle}>{p.is_active ? 'Tắt' : 'Bật'}</Button>
        <Button variant="outline" className="h-10 rounded-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1" />Xóa</Button>
      </div>
    </div>
  );
  return inPanel ? <Surface className="p-4">{body}</Surface> : body;
}
