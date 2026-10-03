import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock, ListChecks, Repeat, Sun } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskDraft } from '../types/task.types';
import { todayKey } from '../utils/task.utils';
import { AreaSelect, FieldLabel, PriorityPicker, fieldCls } from './TaskFormFields';
import { SubtaskList, type SubItem } from './SubtaskList';

const EMPTY: TaskDraft = { title: '', description: '', priority: 'medium', dueDate: todayKey(), time: '', repeat: 'none' };

export function TaskQuickAdd({ open, onOpenChange, initial, onCreate }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<TaskDraft>;
  onCreate: (d: TaskDraft) => Promise<void> | void;
}) {
  const [d, setD] = useState<TaskDraft>(EMPTY);
  const titleRef = useRef<HTMLInputElement>(null);
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [showSubs, setShowSubs] = useState(false);

  useEffect(() => {
    if (open) {
      setD({ ...EMPTY, dueDate: todayKey(), ...initial });
      setSubs([]); setShowSubs(false);
      setTimeout(() => titleRef.current?.focus(), 120);
    }
  }, [open, initial]);

  const set = <K extends keyof TaskDraft>(k: K, v: TaskDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (!d.title.trim()) return titleRef.current?.focus();
    await onCreate({ ...d, subtasks: subs.map((x) => x.title) });
    onOpenChange(false);
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Thêm công việc" className="sm:max-w-[460px] rounded-[28px]">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
        <div>
          <FieldLabel>Tên công việc</FieldLabel>
          <input ref={titleRef} value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="Bạn cần làm gì?" className={fieldCls} />
        </div>
        <div>
          <FieldLabel>Mô tả (tuỳ chọn)</FieldLabel>
          <textarea
            value={d.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Thêm chi tiết…"
            rows={2}
            className={`${fieldCls} h-auto py-2.5 resize-none`}
          />
        </div>
        {showSubs || subs.length ? (
          <div>
            <FieldLabel><span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />Mục con</span></FieldLabel>
            <SubtaskList draft items={subs} ai={{ title: d.title, description: d.description }}
              onAdd={(titles) => setSubs((x) => [...x, ...titles.map((title) => ({ id: crypto.randomUUID(), title, completed: false }))])}
              onRename={(id, title) => setSubs((x) => x.map((i) => (i.id === id ? { ...i, title } : i)))}
              onDelete={(id) => setSubs((x) => x.filter((i) => i.id !== id))}
              onReorder={(ids) => setSubs((x) => ids.map((id) => x.find((i) => i.id === id)!))} />
          </div>
        ) : (
          <button type="button" onClick={() => setShowSubs(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-secondary/70 text-[13px] font-semibold hover:bg-secondary">
            <ListChecks className="h-4 w-4 text-primary" />Thêm mục con
          </button>
        )}
        <div>
          <FieldLabel>Mức ưu tiên</FieldLabel>
          <PriorityPicker value={d.priority} onChange={(p) => set('priority', p)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <FieldLabel><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Ngày</span></FieldLabel>
            <input type="date" value={d.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value)} className={fieldCls} />
          </label>
          <label className="block">
            <FieldLabel><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Giờ</span></FieldLabel>
            <input type="time" value={d.time ?? ''} onChange={(e) => set('time', e.target.value)} className={fieldCls} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Lĩnh vực</FieldLabel>
            <AreaSelect value={d.area} onChange={(a) => set('area', a)} />
          </div>
          <div>
            <FieldLabel><span className="inline-flex items-center gap-1"><Repeat className="h-3.5 w-3.5" />Lặp lại</span></FieldLabel>
            <Select value={d.repeat ?? 'none'} onValueChange={(v) => set('repeat', v as TaskDraft['repeat'])}>
              <SelectTrigger className="h-11 rounded-2xl bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="none">Không lặp</SelectItem>
                <SelectItem value="daily">Hằng ngày</SelectItem>
                <SelectItem value="weekly">Hằng tuần</SelectItem>
                <SelectItem value="monthly">Hằng tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <label className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3.5 py-3 cursor-pointer">
          <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold"><Sun className="h-4 w-4 text-[#FFB84D]" />Thêm vào Hôm nay</span>
          <Switch checked={d.dueDate === todayKey()} onCheckedChange={(on) => set('dueDate', on ? todayKey() : '')} />
        </label>
        <Button type="submit" className="w-full h-12 rounded-full text-[15px]" disabled={!d.title.trim()}>Tạo công việc</Button>
      </form>
    </AdaptiveModal>
  );
}
