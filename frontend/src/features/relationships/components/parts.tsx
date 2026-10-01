import { format, parseISO } from 'date-fns';
import { MessageSquarePlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ItemRow } from '@/components/lio';
import { StarRating } from '@/components/lio/form';
import type { Contact, Interaction } from '@/hooks/sync/useRelationshipsSync';
import { agoLabel, initials, interOf, relOf } from '../utils/relationships.utils';

export function Avatar({ c, size = 40 }: { c: Pick<Contact, 'name' | 'relationship'>; size?: number }) {
  const r = relOf(c.relationship);
  return <span className="rounded-full grid place-items-center font-bold shrink-0" style={{ width: size, height: size, background: `${r.color}22`, color: r.color, fontSize: size * 0.36 }}>{initials(c.name) || '?'}</span>;
}
export function RelChip({ type }: { type: string }) {
  const r = relOf(type);
  return <span className="rounded-full px-2 py-px text-[11px] font-semibold shrink-0" style={{ background: `${r.color}1f`, color: r.color }}>{r.name}</span>;
}

const Menu = ({ items }: { items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><button className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary shrink-0" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
      {items.map((i) => <DropdownMenuItem key={i.label} className={i.danger ? 'text-destructive' : undefined} onClick={i.onClick}>{i.icon}{i.label}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>
);

export function ContactRow({ c, onOpen, onLog, onEdit, onDelete, extra }: { c: Contact; onOpen: () => void; onLog: () => void; onEdit: () => void; onDelete: () => void; extra?: React.ReactNode }) {
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()} className="flex items-center gap-3 rounded-[18px] px-3 py-2.5 cursor-pointer hover:bg-secondary/50 transition-colors">
      <Avatar c={c} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0"><span className="text-[13.5px] font-semibold truncate">{c.name}</span><RelChip type={c.relationship} /></span>
        <span className="flex items-center gap-2 text-[11.5px] text-muted-foreground"><StarRating value={c.importance} size={11} /><span className="truncate">{agoLabel(c.lastContact)}</span></span>
      </span>
      {extra}
      <Menu items={[
        { label: 'Ghi tương tác', icon: <MessageSquarePlus className="h-4 w-4 mr-2" />, onClick: onLog },
        { label: 'Chỉnh sửa', icon: <Pencil className="h-4 w-4 mr-2" />, onClick: onEdit },
        { label: 'Xóa', icon: <Trash2 className="h-4 w-4 mr-2" />, onClick: onDelete, danger: true },
      ]} />
    </div>
  );
}

export function InteractionRow({ i, contact, onEdit, onDelete, hideName }: { i: Interaction; contact?: Contact; onEdit: () => void; onDelete: () => void; hideName?: boolean }) {
  const t = interOf(i.type);
  return (
    <ItemRow icon={t.icon} tint="violet" onClick={onEdit}
      title={hideName ? t.name : <>{t.name}{contact && <span className="text-muted-foreground font-normal"> · {contact.name}</span>}</>}
      meta={[format(parseISO(i.date), 'dd/MM/yyyy'), i.duration ? `${i.duration} phút` : null, i.notes].filter(Boolean).join(' · ')}
      trailing={<Menu items={[
        { label: 'Chỉnh sửa', icon: <Pencil className="h-4 w-4 mr-2" />, onClick: onEdit },
        { label: 'Xóa', icon: <Trash2 className="h-4 w-4 mr-2" />, onClick: onDelete, danger: true },
      ]} />} />
  );
}
