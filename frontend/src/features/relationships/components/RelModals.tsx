import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChoiceGrid, Field, FormActions, StarRating, areaCls, fieldCls } from '@/components/lio/form';
import { cn } from '@/lib/utils';
import type { Contact } from '@/hooks/sync/useRelationshipsSync';
import { INTERACTION_TYPES, RELATIONSHIP_TYPES } from '../utils/relationships.utils';
import type { ContactDraft, InteractionDraft } from '../hooks/useRelationships';
import { Avatar } from './parts';

const MODAL = 'sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto';
export const EMPTY_CONTACT: ContactDraft = { name: '', relationship: 'friend', phone: '', email: '', birthday: '', importance: 3, notes: '' };

export function ContactModal({ open, onOpenChange, mode, initial, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial: ContactDraft; onSubmit: (d: ContactDraft) => void }) {
  const [d, setD] = useState(initial);
  useEffect(() => { if (open) setD(initial); }, [open, initial]);
  const set = (p: Partial<ContactDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa liên hệ' : 'Thêm liên hệ'} className={MODAL}>
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); if (d.name.trim()) { onSubmit(d); onOpenChange(false); } }}>
        <div className="flex items-center gap-3">
          <Avatar c={{ name: d.name || '?', relationship: d.relationship }} size={56} />
          <Field label="Họ và tên" className="flex-1"><input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="VD: Lan Anh" className={fieldCls} /></Field>
        </div>
        <Field label="Mối quan hệ"><ChoiceGrid cols={5} items={RELATIONSHIP_TYPES.map((r) => ({ id: r.id, label: r.name, icon: r.icon, color: r.color }))} value={d.relationship} onChange={(v) => set({ relationship: v })} /></Field>
        <Field label="Mức độ quan trọng"><StarRating value={d.importance} onChange={(v) => set({ importance: v as ContactDraft['importance'] })} size={24} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Số điện thoại"><input type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0123 456 789" className={fieldCls} /></Field>
          <Field label="Email"><input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="email@..." className={fieldCls} /></Field>
        </div>
        <Field label="Sinh nhật"><label className="relative block"><CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="date" value={d.birthday} onChange={(e) => set({ birthday: e.target.value })} className={cn(fieldCls, 'pl-10')} /></label></Field>
        <Field label="Ghi chú"><textarea rows={2} value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="VD: Bạn thân từ đại học..." className={areaCls} /></Field>
        <FormActions onCancel={() => onOpenChange(false)} submitLabel={mode === 'edit' ? 'Cập nhật' : 'Lưu'} disabled={!d.name.trim()} />
      </form>
    </AdaptiveModal>
  );
}

export function InteractionModal({ open, onOpenChange, mode, initial, contacts, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; initial: InteractionDraft; contacts: Contact[]; onSubmit: (d: InteractionDraft) => void }) {
  const [d, setD] = useState(initial);
  useEffect(() => { if (open) setD(initial); }, [open, initial]);
  const set = (p: Partial<InteractionDraft>) => setD((x) => ({ ...x, ...p }));
  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Chỉnh sửa tương tác' : 'Ghi nhận tương tác'} className={MODAL}>
      <form className="space-y-4 min-w-0" onSubmit={(e) => { e.preventDefault(); if (d.contactId) { onSubmit(d); onOpenChange(false); } }}>
        <Field label="Người liên hệ">
          <Select value={d.contactId} onValueChange={(v) => set({ contactId: v })} disabled={mode === 'edit'}>
            <SelectTrigger className="h-11 rounded-2xl bg-card"><SelectValue placeholder="Chọn người liên hệ" /></SelectTrigger>
            <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Loại tương tác"><ChoiceGrid cols={5} items={INTERACTION_TYPES.map((t) => ({ id: t.id, label: t.name, icon: t.icon, color: '#6C5CE7' }))} value={d.type} onChange={(v) => set({ type: v })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ngày"><label className="relative block"><CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="date" value={d.date} onChange={(e) => set({ date: e.target.value })} className={cn(fieldCls, 'pl-10')} /></label></Field>
          <Field label="Thời lượng (phút)"><input type="number" min="0" inputMode="numeric" value={d.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="VD: 30" className={fieldCls} /></Field>
        </div>
        <Field label="Ghi chú"><textarea rows={3} value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Nói chuyện về..." className={areaCls} /></Field>
        <FormActions onCancel={() => onOpenChange(false)} submitLabel={mode === 'edit' ? 'Cập nhật' : 'Lưu'} disabled={!d.contactId || !d.date} />
      </form>
    </AdaptiveModal>
  );
}
