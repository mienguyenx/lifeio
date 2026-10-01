import { format, parseISO } from 'date-fns';
import { Cake, Mail, MessageSquarePlus, Pencil, Phone } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Empty, SectionTitle } from '@/components/lio';
import { StarRating } from '@/components/lio/form';
import type { Contact, Interaction } from '@/hooks/sync/useRelationshipsSync';
import { agoLabel } from '../utils/relationships.utils';
import { Avatar, InteractionRow, RelChip } from './parts';

export function ContactDetail({ contact, interactions, onClose, onLog, onEdit, onEditInteraction, onDeleteInteraction }: {
  contact?: Contact; interactions: Interaction[]; onClose: () => void; onLog: () => void; onEdit: () => void; onEditInteraction: (i: Interaction) => void; onDeleteInteraction: (i: Interaction) => void;
}) {
  const list = contact ? interactions.filter((i) => i.contactId === contact.id) : [];
  return (
    <AdaptiveModal open={!!contact} onOpenChange={(o) => !o && onClose()} title="Chi tiết liên hệ" className="sm:max-w-[520px] rounded-[28px] max-h-[92vh] overflow-y-auto">
      {contact && (
        <div className="space-y-4 min-w-0">
          <div className="flex flex-col items-center text-center gap-1.5">
            <Avatar c={contact} size={72} />
            <p className="text-[18px] font-extrabold">{contact.name}</p>
            <div className="flex items-center gap-2"><RelChip type={contact.relationship} /><StarRating value={contact.importance} size={13} /></div>
            <p className="text-[12px] text-muted-foreground">Liên lạc gần nhất: {agoLabel(contact.lastContact)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11 rounded-full shadow-soft" onClick={onLog}><MessageSquarePlus className="h-4 w-4 mr-1.5" />Ghi tương tác</Button>
            <Button variant="outline" className="h-11 rounded-full" onClick={onEdit}><Pencil className="h-4 w-4 mr-1.5" />Chỉnh sửa</Button>
          </div>
          <ul className="rounded-[18px] bg-secondary/50 p-3 space-y-2 text-[13px]">
            {contact.phone && <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a></li>}
            {contact.email && <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a></li>}
            {contact.birthday && <li className="flex items-center gap-2.5"><Cake className="h-4 w-4 text-muted-foreground" />{format(parseISO(contact.birthday), 'dd/MM/yyyy')}</li>}
            {contact.notes && <li className="text-muted-foreground whitespace-pre-wrap">{contact.notes}</li>}
            {!contact.phone && !contact.email && !contact.birthday && !contact.notes && <li className="text-muted-foreground">Chưa có thông tin thêm.</li>}
          </ul>
          <div>
            <SectionTitle title="Các lần tương tác" hint={`${list.length}`} />
            {list.length === 0 ? <Empty>Chưa ghi nhận tương tác nào.</Empty> : <div className="-mx-3">{list.map((i) => <InteractionRow key={i.id} i={i} hideName onEdit={() => onEditInteraction(i)} onDelete={() => onDeleteInteraction(i)} />)}</div>}
          </div>
        </div>
      )}
    </AdaptiveModal>
  );
}
