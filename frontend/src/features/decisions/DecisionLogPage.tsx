import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { EmptyState } from '@/components/brand/EmptyState';
import { AreaChip, AreaTile, Fab, HeroBanner, MascotCard, Page, PageHeader, ProgressBar, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { Field, FormActions, areaCls, fieldCls } from '@/components/lio/form';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type DecisionLog, type LifeArea } from '@/types/lifeos';

const EMPTY_FORM = { title: '', context: '', options: ['', ''], decision: '', expectedOutcome: '', reviewDate: '', area: '' as LifeArea | '' };
type View = 'all' | 'review' | 'pending' | 'done';
const todayIso = () => new Date().toISOString().split('T')[0];

export default function DecisionLogPage() {
  const isMobile = useIsMobile();
  const decisionLogs = useLifeOSStore((s) => s.decisionLogs);
  const addDecisionLog = useLifeOSStore((s) => s.addDecisionLog);
  const updateDecisionLog = useLifeOSStore((s) => s.updateDecisionLog);
  const deleteDecisionLog = useLifeOSStore((s) => s.deleteDecisionLog);
  const [params, setParams] = useSearchParams();

  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [showOutcomeId, setShowOutcomeId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DecisionLog | null>(null);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  useEffect(() => {
    if (params.has('add')) { openCreate(); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const today = todayIso();
  const isDue = (d: DecisionLog) => !!d.reviewDate && d.reviewDate <= today && !d.actualOutcome;
  const active = useMemo(() => decisionLogs.filter((d) => !d.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [decisionLogs]);
  const needsReview = active.filter(isDue);
  const reviewed = active.filter((d) => d.actualOutcome);
  const pending = active.filter((d) => !d.actualOutcome && !isDue(d));

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = view === 'review' ? needsReview : view === 'done' ? reviewed : view === 'pending' ? pending : active;
    return q ? base.filter((d) => [d.title, d.decision, d.context].some((t) => t?.toLowerCase().includes(q))) : base;
  }, [view, search, active, needsReview, reviewed, pending]);

  const byArea = useMemo(() => LIFE_AREAS.map((a) => ({ ...a, n: active.filter((d) => d.area === a.id).length })).filter((a) => a.n > 0).sort((a, b) => b.n - a.n), [active]);
  const upcoming = active.filter((d) => d.reviewDate && d.reviewDate > today && !d.actualOutcome).sort((a, b) => (a.reviewDate! < b.reviewDate! ? -1 : 1)).slice(0, 4);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.decision.trim()) { toast.error('Cần nhập tiêu đề và quyết định'); return; }
    const data = {
      title: form.title.trim(), context: form.context.trim(), options: form.options.filter(Boolean), decision: form.decision.trim(),
      expectedOutcome: form.expectedOutcome.trim() || undefined, reviewDate: form.reviewDate || undefined, area: (form.area || undefined) as LifeArea | undefined,
    };
    if (editingId) { updateDecisionLog(editingId, data); toast.success('Đã cập nhật'); }
    else { addDecisionLog(data); toast.success('Đã lưu quyết định'); }
    setForm(EMPTY_FORM); setEditingId(null); setShowForm(false);
  };
  const handleEdit = (log: DecisionLog) => {
    setForm({ title: log.title, context: log.context, options: log.options.length >= 2 ? log.options : [...log.options, ''], decision: log.decision, expectedOutcome: log.expectedOutcome || '', reviewDate: log.reviewDate || '', area: (log.area || '') as LifeArea | '' });
    setEditingId(log.id); setShowForm(true);
  };
  const handleAddOutcome = (id: string) => {
    if (!outcomeInput.trim()) return;
    updateDecisionLog(id, { actualOutcome: outcomeInput.trim() });
    setOutcomeInput(''); setShowOutcomeId(null); toast.success('Đã ghi nhận kết quả');
  };
  const updateOption = (idx: number, val: string) => { const opts = [...form.options]; opts[idx] = val; setForm({ ...form, options: opts }); };

  const side = (
    <div className="space-y-4">
      <Surface className="p-4">
        <SectionTitle title="Sắp đến hạn review" />
        {upcoming.length === 0 ? <p className="text-[12.5px] text-muted-foreground">Không có lịch review sắp tới.</p> : (
          <div className="space-y-2">
            {upcoming.map((d) => (
              <button key={d.id} onClick={() => { setView('all'); setExpandedId(d.id); }} className="w-full text-left rounded-2xl bg-secondary/50 px-3 py-2 hover:bg-secondary">
                <p className="text-[13px] font-semibold truncate">{d.title}</p>
                <p className="text-[11.5px] text-muted-foreground">Review {new Date(d.reviewDate!).toLocaleDateString('vi')}</p>
              </button>
            ))}
          </div>
        )}
      </Surface>
      <Surface className="p-4">
        <SectionTitle title="Theo lĩnh vực" />
        {byArea.length === 0 ? <p className="text-[12.5px] text-muted-foreground">Gắn lĩnh vực khi ghi quyết định để xem phân bổ.</p> : (
          <div className="space-y-3">
            {byArea.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <AreaTile area={a.id} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[12.5px] font-semibold"><span>{a.name}</span><span className="text-muted-foreground">{a.n}</span></div>
                  <ProgressBar value={(a.n / active.length) * 100} color={`hsl(var(--area-${a.id}))`} className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>
      <MascotCard mascot="ori" pose="idea" title="Mẹo nhỏ" quote="Ghi lại lý do của quyết định hôm nay — tương lai bạn sẽ cảm ơn bạn." />
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Nhật ký quyết định"
        subtitle="Ghi lại quyết định quan trọng & review kết quả ⚖️"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm quyết định..." />
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Ghi nhận</Button>}
        </>}
      />
      <SegmentedTabs items={[{ id: 'all', label: 'Tất cả', count: active.length }, { id: 'review', label: 'Cần review', count: needsReview.length }, { id: 'pending', label: 'Đang chờ', count: pending.length }, { id: 'done', label: 'Đã review', count: reviewed.length }]} value={view} onChange={setView} full={isMobile} className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          <HeroBanner mascot="ori" pose="idea" title="Quyết định tốt bắt đầu từ suy nghĩ rõ ràng" subtitle={needsReview.length ? `Có ${needsReview.length} quyết định đã đến hạn review kết quả.` : 'Ghi bối cảnh, lựa chọn và kỳ vọng — rồi đối chiếu với kết quả thực tế.'}
            action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={needsReview.length ? () => setView('review') : openCreate}>{needsReview.length ? 'Review ngay' : <><Plus className="h-4 w-4 mr-1.5" />Ghi quyết định</>}</Button>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={<span className="text-[22px]">⚖️</span>} tint="violet" value={active.length} label="Quyết định" hint="đã ghi lại" onClick={() => setView('all')} active={view === 'all'} />
            <StatTile icon="status/warning" tint="amber" value={needsReview.length} label="Cần review" hint="đã đến hạn" onClick={() => setView('review')} active={view === 'review'} />
            <StatTile icon={<span className="text-[22px]">⏳</span>} tint="sky" value={pending.length} label="Đang chờ" hint="chưa có kết quả" onClick={() => setView('pending')} active={view === 'pending'} />
            <StatTile icon="status/success" tint="mint" value={reviewed.length} label="Đã review" hint={active.length ? `${Math.round((reviewed.length / active.length) * 100)}% tổng số` : '—'} onClick={() => setView('done')} active={view === 'done'} />
          </div>

          <Surface className="p-3 sm:p-4">
            <div className="px-1"><SectionTitle title="Danh sách quyết định" hint={`${list.length} mục`} /></div>
            {list.length === 0 ? (
              active.length === 0
                ? <EmptyState mascot="ori" pose="idea" title="Chưa có quyết định nào" description="Ghi lại những quyết định quan trọng để review sau." action={<Button className="rounded-full" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Ghi nhận</Button>} />
                : <EmptyState mascot="ori" compact title="Không có mục phù hợp" description="Thử đổi tab hoặc từ khóa nhé." />
            ) : (
              <div className="divide-y divide-border/50">
                {list.map((log) => {
                  const open = expandedId === log.id;
                  const area = LIFE_AREAS.find((a) => a.id === log.area);
                  const due = isDue(log);
                  return (
                    <div key={log.id} className="px-1 py-3">
                      <div className="flex items-start gap-3">
                        <AreaTile area={log.area} emoji={log.area ? undefined : '⚖️'} size={40} />
                        <button className="flex-1 min-w-0 text-left" onClick={() => setExpandedId(open ? null : log.id)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-semibold">{log.title}</p>
                            {area && <AreaChip area={area.id} label={area.name} />}
                            {log.actualOutcome && <span className="rounded-full bg-[#E3F8EE] text-[#1F9D63] dark:bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold">Đã review</span>}
                            {due && <span className="rounded-full bg-[#FFF4DB] text-[#B7791F] dark:bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold">Cần review</span>}
                          </div>
                          <p className="text-[12.5px] text-primary mt-0.5 truncate">→ {log.decision}</p>
                          <p className="text-[11.5px] text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleDateString('vi')}{log.reviewDate && ` · Review ${new Date(log.reviewDate).toLocaleDateString('vi')}`}</p>
                        </button>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Mở rộng" onClick={() => setExpandedId(open ? null : log.id)}>{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Sửa" onClick={() => handleEdit(log)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" aria-label="Xóa" onClick={() => setToDelete(log)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {open && (
                        <div className="mt-3 ml-[52px] space-y-3 animate-fade-in">
                          {log.context && <div><p className="text-[11.5px] font-semibold text-muted-foreground">Bối cảnh</p><p className="text-[13px]">{log.context}</p></div>}
                          {log.options.length > 0 && (
                            <div>
                              <p className="text-[11.5px] font-semibold text-muted-foreground mb-1">Các lựa chọn</p>
                              <div className="flex flex-wrap gap-1.5">
                                {log.options.map((opt, i) => <span key={i} className={cn('rounded-full border px-2.5 py-1 text-[12px]', opt === log.decision ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground')}>{opt === log.decision ? '✓ ' : ''}{opt}</span>)}
                              </div>
                            </div>
                          )}
                          {log.expectedOutcome && <div><p className="text-[11.5px] font-semibold text-muted-foreground">Kết quả kỳ vọng</p><p className="text-[13px]">{log.expectedOutcome}</p></div>}
                          {log.actualOutcome ? (
                            <div className="rounded-2xl bg-[#E3F8EE] dark:bg-emerald-500/10 px-3 py-2"><p className="text-[11.5px] font-semibold text-[#1F9D63]">Kết quả thực tế</p><p className="text-[13px]">{log.actualOutcome}</p></div>
                          ) : showOutcomeId === log.id ? (
                            <div className="flex gap-2">
                              <input className={cn(fieldCls, 'h-10')} placeholder="Kết quả thực tế..." value={outcomeInput} onChange={(e) => setOutcomeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddOutcome(log.id)} autoFocus />
                              <Button className="h-10 rounded-full px-4" onClick={() => handleAddOutcome(log.id)}>Lưu</Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setShowOutcomeId(log.id); setOutcomeInput(''); }}><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Ghi nhận kết quả</Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Surface>
          {isMobile && side}
        </div>
        {!isMobile && <aside className="hidden xl:block sticky top-4">{side}</aside>}
      </div>
      {isMobile && <Fab onClick={openCreate} label="Ghi nhận" />}

      <AdaptiveModal open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditingId(null); }} title={editingId ? 'Sửa quyết định' : 'Ghi nhận quyết định'}>
        <form onSubmit={handleSave} className="space-y-3.5 mt-2">
          <Field label="Tiêu đề *"><input className={fieldCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Chuyển công ty" autoFocus /></Field>
          <Field label="Bối cảnh"><textarea className={areaCls} rows={3} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Tình huống dẫn đến quyết định..." /></Field>
          <Field label="Các lựa chọn" hint={<button type="button" className="text-[12px] font-semibold text-primary" onClick={() => setForm({ ...form, options: [...form.options, ''] })}>+ Thêm lựa chọn</button>}>
            <div className="space-y-2">{form.options.map((opt, i) => <input key={i} className={fieldCls} value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Lựa chọn ${i + 1}`} />)}</div>
          </Field>
          <Field label="Quyết định cuối cùng *"><input className={fieldCls} value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} placeholder="Bạn đã chọn gì?" /></Field>
          <Field label="Kết quả kỳ vọng"><input className={fieldCls} value={form.expectedOutcome} onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })} placeholder="Bạn mong đợi gì?" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày review"><input type="date" className={fieldCls} value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} /></Field>
            <Field label="Lĩnh vực">
              <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v as LifeArea })}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                <SelectContent>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <FormActions onCancel={() => { setShowForm(false); setEditingId(null); }} submitLabel={editingId ? 'Cập nhật' : 'Lưu quyết định'} />
        </form>
      </AdaptiveModal>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa quyết định “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Quyết định sẽ được chuyển vào Thùng rác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) { deleteDecisionLog(toDelete.id); toast('Đã xóa'); } setToDelete(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
