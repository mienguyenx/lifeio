import { useState } from 'react';
import { Scale, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import type { LifeArea, DecisionLog } from '@/types/lifeos';
import { toast } from 'sonner';

const EMPTY_FORM = {
  title: '',
  context: '',
  options: ['', ''],
  decision: '',
  expectedOutcome: '',
  reviewDate: '',
  area: '' as LifeArea | '',
};

export default function DecisionLogPage() {
  const decisionLogs = useLifeOSStore((s) => s.decisionLogs);
  const addDecisionLog = useLifeOSStore((s) => s.addDecisionLog);
  const updateDecisionLog = useLifeOSStore((s) => s.updateDecisionLog);
  const deleteDecisionLog = useLifeOSStore((s) => s.deleteDecisionLog);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [showOutcomeId, setShowOutcomeId] = useState<string | null>(null);

  const active = decisionLogs.filter((d) => !d.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const needsReview = active.filter((d) => d.reviewDate && d.reviewDate <= new Date().toISOString().split('T')[0] && !d.actualOutcome);

  const handleSave = () => {
    if (!form.title.trim() || !form.decision.trim()) {
      toast.error('Cần nhập tiêu đề và quyết định');
      return;
    }
    const data = {
      title: form.title.trim(),
      context: form.context.trim(),
      options: form.options.filter(Boolean),
      decision: form.decision.trim(),
      expectedOutcome: form.expectedOutcome.trim() || undefined,
      reviewDate: form.reviewDate || undefined,
      area: (form.area || undefined) as LifeArea | undefined,
    };

    if (editingId) {
      updateDecisionLog(editingId, data);
      toast.success('Đã cập nhật');
    } else {
      addDecisionLog(data);
      toast.success('Đã lưu quyết định');
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (log: DecisionLog) => {
    setForm({
      title: log.title,
      context: log.context,
      options: log.options.length >= 2 ? log.options : [...log.options, ''],
      decision: log.decision,
      expectedOutcome: log.expectedOutcome || '',
      reviewDate: log.reviewDate || '',
      area: (log.area || '') as LifeArea | '',
    });
    setEditingId(log.id);
    setShowForm(true);
  };

  const handleAddOutcome = (id: string) => {
    if (!outcomeInput.trim()) return;
    updateDecisionLog(id, { actualOutcome: outcomeInput.trim() });
    setOutcomeInput('');
    setShowOutcomeId(null);
    toast.success('Đã ghi nhận kết quả');
  };

  const addOption = () => setForm({ ...form, options: [...form.options, ''] });
  const updateOption = (idx: number, val: string) => {
    const opts = [...form.options];
    opts[idx] = val;
    setForm({ ...form, options: opts });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Decision Log
          </h1>
          <p className="text-sm text-muted-foreground">Ghi lại quyết định quan trọng & review kết quả</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Ghi nhận
        </Button>
      </div>

      {/* Needs Review Alert */}
      {needsReview.length > 0 && (
        <Card className="border-amber-400/30 bg-amber-50/30 dark:bg-amber-950/10">
          <CardContent className="p-3">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {needsReview.length} quyết định cần review kết quả
            </p>
          </CardContent>
        </Card>
      )}

      {/* Decision List */}
      <div className="space-y-2">
        {active.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Scale className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có quyết định nào</p>
              <p className="text-xs">Ghi lại những quyết định quan trọng để review sau</p>
            </CardContent>
          </Card>
        )}
        {active.map((log) => {
          const isExpanded = expandedId === log.id;
          const area = LIFE_AREAS.find((a) => a.id === log.area);
          const needReview = log.reviewDate && log.reviewDate <= new Date().toISOString().split('T')[0] && !log.actualOutcome;

          return (
            <Card key={log.id} className={cn(needReview && 'border-amber-400/30')}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="mt-0.5 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{log.title}</p>
                      {area && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{area.icon} {area.name}</Badge>}
                      {log.actualOutcome && <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Reviewed</Badge>}
                      {needReview && <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Cần review</Badge>}
                    </div>
                    <p className="text-xs text-primary mt-0.5">→ {log.decision}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString('vi')}</span>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        {log.context && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground">Bối cảnh:</p>
                            <p className="text-xs">{log.context}</p>
                          </div>
                        )}
                        {log.options.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground">Lựa chọn:</p>
                            <ul className="text-xs space-y-0.5">
                              {log.options.map((opt, i) => (
                                <li key={i} className={cn('pl-2', opt === log.decision && 'font-medium text-primary')}>
                                  {opt === log.decision ? '✓ ' : '· '}{opt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {log.expectedOutcome && (
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground">Kết quả kỳ vọng:</p>
                            <p className="text-xs">{log.expectedOutcome}</p>
                          </div>
                        )}
                        {log.actualOutcome && (
                          <div className="px-2 py-1.5 rounded bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                            <p className="text-[10px] font-medium text-green-700 dark:text-green-300">Kết quả thực tế:</p>
                            <p className="text-xs">{log.actualOutcome}</p>
                          </div>
                        )}
                        {!log.actualOutcome && (
                          showOutcomeId === log.id ? (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Kết quả thực tế..."
                                value={outcomeInput}
                                onChange={(e) => setOutcomeInput(e.target.value)}
                                className="h-8 text-xs flex-1"
                                autoFocus
                              />
                              <Button size="sm" className="h-8 text-xs" onClick={() => handleAddOutcome(log.id)}>Lưu</Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => { setShowOutcomeId(log.id); setOutcomeInput(''); }}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Ghi nhận kết quả
                            </Button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(log)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteDecisionLog(log.id); toast('Đã xóa'); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <AdaptiveModal open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditingId(null); }} title={editingId ? 'Sửa quyết định' : 'Ghi nhận quyết định'}>
        <div className="space-y-3 mt-4">
          <div>
            <Label className="text-xs">Tiêu đề *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Chuyển công ty" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Bối cảnh</Label>
            <Textarea value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Tình huống dẫn đến quyết định..." className="text-sm min-h-[60px] resize-none" />
          </div>
          <div>
            <Label className="text-xs">Các lựa chọn</Label>
            <div className="space-y-1.5">
              {form.options.map((opt, i) => (
                <Input key={i} value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Lựa chọn ${i + 1}`} className="h-8 text-xs" />
              ))}
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addOption}>+ Thêm lựa chọn</Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Quyết định cuối cùng *</Label>
            <Input value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} placeholder="Bạn đã chọn gì?" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Kết quả kỳ vọng</Label>
            <Input value={form.expectedOutcome} onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })} placeholder="Bạn mong đợi gì?" className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ngày review</Label>
              <Input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Life Area</Label>
              <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v as LifeArea })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave}>{editingId ? 'Cập nhật' : 'Lưu quyết định'}</Button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
