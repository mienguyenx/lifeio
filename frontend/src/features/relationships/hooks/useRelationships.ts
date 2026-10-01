import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useRelationshipsSync, type Contact, type Interaction } from '@/hooks/sync/useRelationshipsSync';
import { latestWheel } from '@/lib/lifeWheel';
import { needsAttention, nextBirthday } from '../utils/relationships.utils';

export interface ContactDraft { name: string; relationship: Contact['relationship']; phone: string; email: string; birthday: string; importance: Contact['importance']; notes: string }
export interface InteractionDraft { contactId: string; type: Interaction['type']; date: string; duration: string; notes: string }

export function useRelationships() {
  const contacts = useLifeOSStore((s) => s.relationshipsContacts);
  const interactions = useLifeOSStore((s) => s.relationshipsInteractions);
  const goals = useLifeOSStore((s) => s.goals);
  const wheel = useLifeOSStore((s) => s.lifeWheelScores);
  const user = useLifeOSStore((s) => s.user);
  const st = useLifeOSStore.getState();
  const sync = useRelationshipsSync();

  const sortedInteractions = useMemo(() => [...interactions].sort((a, b) => b.date.localeCompare(a.date)), [interactions]);
  const attention = useMemo(() => contacts.filter(needsAttention).sort((a, b) => b.importance - a.importance), [contacts]);
  const birthdays = useMemo(() => contacts.map((c) => ({ c, b: nextBirthday(c.birthday) })).filter((x) => x.b && x.b.days <= 30).sort((a, b) => a.b!.days - b.b!.days), [contacts]);
  const relGoals = useMemo(() => goals.filter((g) => g.area === 'relationships' && !g.deletedAt), [goals]);
  const score = useMemo(() => { const w = latestWheel(wheel); return w ? w.scores.relationships ?? null : null; }, [wheel]);
  const monthKey = format(new Date(), 'yyyy-MM');
  const thisMonth = interactions.filter((i) => i.date.startsWith(monthKey)).length;
  const byId = useCallback((id?: string | null) => contacts.find((c) => c.id === id), [contacts]);

  const done = (ok: boolean, msg: string, err = 'Không thể lưu vào database') => (ok ? toast.success(msg) : toast.error(err));
  const fromDraft = (d: ContactDraft): Partial<Contact> => ({ name: d.name.trim(), relationship: d.relationship, phone: d.phone || undefined, email: d.email || undefined, birthday: d.birthday || undefined, importance: d.importance, notes: d.notes || undefined });

  const addContact = useCallback(async (d: ContactDraft) => {
    const c = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...fromDraft(d) } as Contact;
    st.addRelationshipContact(c); done(await sync.saveContact(c), 'Đã thêm liên hệ!');
  }, [st, sync]);
  const editContact = useCallback(async (id: string, d: ContactDraft) => {
    const u = fromDraft(d); st.updateRelationshipContact(id, u); done(await sync.updateContact(id, u), 'Đã cập nhật liên hệ!', 'Không thể cập nhật vào database');
  }, [st, sync]);
  const removeContact = useCallback(async (id: string) => { st.deleteRelationshipContact(id); done(await sync.deleteContact(id), 'Đã xóa liên hệ!', 'Không thể xóa khỏi database'); }, [st, sync]);

  /** Như trang cũ: ghi tương tác + cập nhật “liên hệ gần nhất”. Bổ sung: chọn ngày, và lưu lastContact lên database. */
  const addInteraction = useCallback(async (d: InteractionDraft) => {
    const i: Interaction = { id: crypto.randomUUID(), contactId: d.contactId, type: d.type, date: d.date, notes: d.notes || undefined, duration: d.duration ? parseInt(d.duration) : undefined };
    st.addRelationshipInteraction(i);
    const c = useLifeOSStore.getState().relationshipsContacts.find((x) => x.id === d.contactId);
    if (c && (!c.lastContact || c.lastContact < d.date)) { st.updateRelationshipContact(c.id, { lastContact: d.date }); sync.updateContact(c.id, { lastContact: d.date }); }
    done(await sync.saveInteraction(i), 'Đã ghi nhận tương tác!');
  }, [st, sync]);
  const editInteraction = useCallback(async (id: string, d: InteractionDraft) => {
    const u: Partial<Interaction> = { type: d.type, date: d.date, notes: d.notes || undefined, duration: d.duration ? parseInt(d.duration) : undefined };
    st.updateRelationshipInteraction(id, u); done(await sync.updateInteraction(id, u), 'Đã cập nhật tương tác!', 'Không thể cập nhật vào database');
  }, [st, sync]);
  const removeInteraction = useCallback(async (id: string) => { st.deleteRelationshipInteraction(id); done(await sync.deleteInteraction(id), 'Đã xóa tương tác!', 'Không thể xóa khỏi database'); }, [st, sync]);

  return { contacts, interactions: sortedInteractions, attention, birthdays, relGoals, score, thisMonth, user, byId, addContact, editContact, removeContact, addInteraction, editInteraction, removeInteraction, today: format(new Date(), 'yyyy-MM-dd') };
}
export type RelApi = ReturnType<typeof useRelationships>;
