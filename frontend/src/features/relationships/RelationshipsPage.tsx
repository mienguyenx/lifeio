import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquarePlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/brand/EmptyState';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { Empty, Fab, FilterChips, HeroBanner, Page, PageHeader, SearchToggle, SectionTitle, SegmentedTabs, StatTile, Surface } from '@/components/lio';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Contact, Interaction } from '@/hooks/sync/useRelationshipsSync';
import { useRelationships, type ContactDraft, type InteractionDraft } from './hooks/useRelationships';
import { INTERACTION_TYPES, RELATIONSHIP_TYPES, agoLabel, type InterType, type RelType } from './utils/relationships.utils';
import { ContactRow, InteractionRow } from './components/parts';
import { ContactModal, EMPTY_CONTACT, InteractionModal } from './components/RelModals';
import { ContactDetail } from './components/ContactDetail';
import { RelAnalytics } from './components/RelAnalytics';
import { RelSidePanel } from './components/RelSidePanel';

type View = 'overview' | 'contacts' | 'interactions' | 'analytics' | 'linked';

export default function RelationshipsPage() {
  const isMobile = useIsMobile();
  const api = useRelationships();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [rel, setRel] = useState<RelType | 'all'>('all');
  const [itype, setItype] = useState<InterType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [cForm, setCForm] = useState<{ mode: 'create' | 'edit'; id?: string; initial: ContactDraft } | null>(null);
  const [iForm, setIForm] = useState<{ mode: 'create' | 'edit'; id?: string; initial: InteractionDraft } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [del, setDel] = useState<{ kind: 'contact'; c: Contact } | { kind: 'interaction'; i: Interaction } | null>(null);

  useEffect(() => {
    if (params.has('add')) { setCForm({ mode: 'create', initial: EMPTY_CONTACT }); params.delete('add'); setParams(params, { replace: true }); }
  }, [params, setParams]);
  useEffect(() => { if (search) setView('contacts'); }, [search]);

  const { contacts, interactions, attention, birthdays, byId } = api;
  const newContact = () => setCForm({ mode: 'create', initial: EMPTY_CONTACT });
  const editContact = (c: Contact) => setCForm({ mode: 'edit', id: c.id, initial: { name: c.name, relationship: c.relationship, phone: c.phone ?? '', email: c.email ?? '', birthday: c.birthday ?? '', importance: c.importance, notes: c.notes ?? '' } });
  const logFor = (contactId = '') => setIForm({ mode: 'create', initial: { contactId, type: 'call', date: api.today, duration: '', notes: '' } });
  const editInter = (i: Interaction) => setIForm({ mode: 'edit', id: i.id, initial: { contactId: i.contactId, type: i.type, date: i.date, duration: i.duration ? String(i.duration) : '', notes: i.notes ?? '' } });
  const open = (c: Contact) => setDetailId(c.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => (rel === 'all' || c.relationship === rel) && (!q || c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)))
      .sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name, 'vi'));
  }, [contacts, rel, search]);
  const filteredInter = interactions.filter((i) => itype === 'all' || i.type === itype);
  const relChips = [{ id: 'all', label: 'Tất cả', count: contacts.length }, ...RELATIONSHIP_TYPES.map((r) => ({ id: r.id, label: r.name, count: contacts.filter((c) => c.relationship === r.id).length }))] as { id: RelType | 'all'; label: string; count: number }[];
  const interChips = [{ id: 'all', label: 'Tất cả', count: interactions.length }, ...INTERACTION_TYPES.map((t) => ({ id: t.id, label: `${t.icon} ${t.name}`, count: interactions.filter((i) => i.type === t.id).length }))] as { id: InterType | 'all'; label: string; count: number }[];
  const rowProps = (c: Contact) => ({ c, onOpen: () => open(c), onLog: () => logFor(c.id), onEdit: () => editContact(c), onDelete: () => setDel({ kind: 'contact', c }) });
  const name = api.user?.name?.split(' ').slice(-1)[0] || 'bạn';
  const noContacts = <EmptyState mascot="lumi" pose="happy" title="Thêm người quan trọng đầu tiên" description="Ghi lại những người thân yêu để không quên giữ liên lạc." action={<Button className="rounded-full" onClick={newContact}><Plus className="h-4 w-4 mr-1.5" />Thêm liên hệ</Button>} />;

  const overview = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="space-y-4 min-w-0">
        <HeroBanner mascot="lumi" pose="happy" title={`Xin chào, ${name}! 👋`} subtitle="“Những mối quan hệ tốt đẹp là một phần quan trọng của cuộc sống hạnh phúc.”"
          action={<Button className="h-10 rounded-full px-5 shadow-soft" onClick={() => logFor()} disabled={!contacts.length}><MessageSquarePlus className="h-4 w-4 mr-1.5" />Ghi tương tác</Button>} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon="module/relationships" tint="rose" value={contacts.length} label="Tổng liên hệ" onClick={() => setView('contacts')} />
          <StatTile icon="status/warning" tint="amber" value={attention.length} label="Cần chú ý" hint="Lâu chưa liên lạc" />
          <StatTile icon={<span className="text-[22px]">💬</span>} tint="sky" value={api.thisMonth} label="Tương tác" hint="Tháng này" onClick={() => setView('interactions')} />
          <StatTile icon={<span className="text-[22px]">🎂</span>} tint="mint" value={birthdays.length} label="Sinh nhật sắp tới" hint="30 ngày tới" />
        </div>
        {contacts.length === 0 ? noContacts : (
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            <Surface className="p-3">
              <div className="px-2 pt-1"><SectionTitle title="Cần liên lạc" hint={`${attention.length} người`} /></div>
              {attention.length === 0 ? <div className="px-2"><Empty>Tuyệt vời! Bạn đang giữ liên lạc tốt với mọi người 💜</Empty></div>
                : attention.slice(0, 6).map((c) => <ContactRow key={c.id} {...rowProps(c)} extra={<button onClick={(e) => { e.stopPropagation(); logFor(c.id); }} className="h-8 px-3 rounded-full bg-lavender dark:bg-primary/15 text-primary text-[12px] font-semibold shrink-0">Nhắc nhớ</button>} />)}
            </Surface>
            <Surface className="p-3">
              <div className="px-2 pt-1"><SectionTitle title="Tương tác gần đây" action={<button onClick={() => setView('interactions')} className="text-[12px] font-semibold text-primary">Xem tất cả</button>} /></div>
              {interactions.length === 0 ? <div className="px-2"><Empty>Chưa ghi nhận tương tác nào.</Empty></div>
                : interactions.slice(0, 6).map((i) => <InteractionRow key={i.id} i={i} contact={byId(i.contactId)} onEdit={() => editInter(i)} onDelete={() => setDel({ kind: 'interaction', i })} />)}
            </Surface>
          </div>
        )}
      </div>
      {!isMobile && <aside className="hidden xl:block sticky top-4"><RelSidePanel api={api} onOpen={open} /></aside>}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Quan hệ <ModuleHelpButton module="relationships" /></span>}
        subtitle="Nuôi dưỡng các mối quan hệ, xây dựng cuộc sống ý nghĩa hơn 💜"
        actions={<>
          <SearchToggle value={search} onChange={setSearch} placeholder="Tìm tên, số điện thoại, email..." />
          {!isMobile && <Button variant="outline" className="h-10 rounded-full px-4 bg-card shadow-soft" onClick={() => logFor()} disabled={!contacts.length}><MessageSquarePlus className="h-4 w-4 mr-1.5" />Ghi tương tác</Button>}
          {!isMobile && <Button className="h-10 rounded-full px-5 shadow-soft" onClick={newContact}><Plus className="h-4 w-4 mr-1.5" />Thêm liên hệ</Button>}
        </>}
      />
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
        <SegmentedTabs items={[{ id: 'overview', label: 'Tổng quan' }, { id: 'contacts', label: 'Liên hệ' }, { id: 'interactions', label: 'Tương tác' }, { id: 'analytics', label: 'Phân tích' }, { id: 'linked', label: 'Liên kết' }]} value={view} onChange={setView} />
      </div>
      {view === 'overview' && overview}
      {view === 'contacts' && (
        <div className="space-y-4">
          <FilterChips items={relChips} value={rel} onChange={setRel} />
          {contacts.length === 0 ? noContacts : filtered.length === 0 ? <EmptyState mascot="lumi" compact title="Không tìm thấy liên hệ" description="Thử đổi bộ lọc hoặc từ khóa nhé." /> : (
            <Surface className="p-2">
              {filtered.map((c) => <ContactRow key={c.id} {...rowProps(c)} extra={!isMobile && <span className="text-[11.5px] text-muted-foreground w-[110px] text-right truncate hidden md:inline">{c.phone || c.email || ''}</span>} />)}
            </Surface>
          )}
        </div>
      )}
      {view === 'interactions' && (
        <div className="space-y-4">
          <FilterChips items={interChips} value={itype} onChange={setItype} />
          {filteredInter.length === 0 ? <EmptyState mascot="lumi" compact title="Chưa có tương tác" description="Ghi lại cuộc gọi, tin nhắn hay buổi gặp gần nhất nhé." /> : (
            <Surface className="p-2">{filteredInter.map((i) => <InteractionRow key={i.id} i={i} contact={byId(i.contactId)} onEdit={() => editInter(i)} onDelete={() => setDel({ kind: 'interaction', i })} />)}</Surface>
          )}
        </div>
      )}
      {view === 'analytics' && <RelAnalytics api={api} />}
      {view === 'linked' && <AreaDashboardSection area="relationships" />}
      {isMobile && view === 'overview' && <div className="mt-5"><RelSidePanel api={api} onOpen={open} /></div>}
      {isMobile && <Fab onClick={newContact} label="Thêm liên hệ" />}

      {cForm && <ContactModal open onOpenChange={(o) => !o && setCForm(null)} mode={cForm.mode} initial={cForm.initial} onSubmit={(d) => { if (cForm.mode === 'edit' && cForm.id) api.editContact(cForm.id, d); else api.addContact(d); setCForm(null); }} />}
      {iForm && <InteractionModal open onOpenChange={(o) => !o && setIForm(null)} mode={iForm.mode} initial={iForm.initial} contacts={contacts} onSubmit={(d) => { if (iForm.mode === 'edit' && iForm.id) api.editInteraction(iForm.id, d); else api.addInteraction(d); setIForm(null); }} />}
      <ContactDetail contact={byId(detailId)} interactions={interactions} onClose={() => setDetailId(null)}
        onLog={() => { const id = detailId!; setDetailId(null); logFor(id); }} onEdit={() => { const c = byId(detailId)!; setDetailId(null); editContact(c); }}
        onEditInteraction={(i) => { setDetailId(null); editInter(i); }} onDeleteInteraction={(i) => setDel({ kind: 'interaction', i })} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{del?.kind === 'contact' ? `Xóa liên hệ “${del.c.name}”?` : 'Xóa tương tác này?'}</AlertDialogTitle>
            <AlertDialogDescription>{del?.kind === 'contact' ? `Liên lạc gần nhất: ${agoLabel(del.c.lastContact)}. Không thể hoàn tác.` : 'Bản ghi tương tác sẽ bị xóa và không thể hoàn tác.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (del?.kind === 'contact') { api.removeContact(del.c.id); if (detailId === del.c.id) setDetailId(null); } else if (del) api.removeInteraction(del.i.id); setDel(null); }}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
