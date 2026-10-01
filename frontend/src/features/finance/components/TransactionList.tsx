import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/brand/EmptyState';
import { FilterChips, ItemRow, Surface } from '@/components/lio';
import { cn } from '@/lib/utils';
import type { FinanceTransaction } from '@/hooks/sync/useFinanceSync';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryOf, formatVND, type TxType } from '../utils/finance.utils';

type F = 'all' | TxType;

export function TxRow({ t, onEdit, onDelete }: { t: FinanceTransaction; onEdit: (t: FinanceTransaction) => void; onDelete?: (t: FinanceTransaction) => void }) {
  const c = categoryOf(t.type, t.category);
  return (
    <ItemRow icon={c.icon} iconBg={`${c.color}33`} title={t.description} meta={`${c.name} · ${format(parseISO(t.date), 'dd/MM/yyyy')}`}
      value={`${t.type === 'income' ? '+' : '-'}${formatVND(t.amount)}`} valueClassName={t.type === 'income' ? 'text-[#22B07D]' : 'text-[#F2557A]'} onClick={() => onEdit(t)}
      trailing={onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary" aria-label="Tùy chọn"><MoreHorizontal className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(t)}><Pencil className="h-4 w-4 mr-2" />Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(t)}><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )} />
  );
}

/** Danh sách giao dịch: lọc Thu/Chi + danh mục, nhóm theo ngày, tìm kiếm (từ thanh tìm kiếm trang). */
export function TransactionList({ txs, search, onEdit, onDelete, isMobile }: { txs: FinanceTransaction[]; search: string; onEdit: (t: FinanceTransaction) => void; onDelete: (t: FinanceTransaction) => void; isMobile?: boolean }) {
  const [f, setF] = useState<F>('all');
  const [cat, setCat] = useState('all');
  const cats = f === 'income' ? INCOME_CATEGORIES : f === 'expense' ? EXPENSE_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter((c) => c.id !== 'other')];
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, FinanceTransaction[]>();
    txs.filter((t) => (f === 'all' || t.type === f) && (cat === 'all' || t.category === cat) && (!q || t.description.toLowerCase().includes(q)))
      .forEach((t) => map.set(t.date, [...(map.get(t.date) ?? []), t]));
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [txs, f, cat, search]);
  const items = [{ id: 'all', label: 'Tất cả', count: txs.length }, { id: 'income', label: 'Thu nhập', count: txs.filter((t) => t.type === 'income').length }, { id: 'expense', label: 'Chi tiêu', count: txs.filter((t) => t.type === 'expense').length }] as { id: F; label: string; count: number }[];

  return (
    <div className="space-y-4">
      <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'items-center')}>
        <FilterChips items={items} value={f} onChange={(v) => { setF(v); setCat('all'); }} />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className={cn('h-9 rounded-full bg-card', isMobile ? 'w-full' : 'w-[180px] ml-auto')}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tất cả danh mục</SelectItem>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {groups.length === 0 ? <EmptyState mascot="lumi" compact title="Không có giao dịch" description={txs.length ? 'Thử đổi bộ lọc hoặc từ khóa nhé.' : 'Thêm giao dịch đầu tiên để theo dõi thu chi.'} /> : groups.map(([d, list]) => {
        const net = list.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
        return (
          <Surface key={d} className="p-2">
            <div className="flex justify-between px-3 pt-2 pb-1 text-[12px] font-bold text-muted-foreground">
              <span className="capitalize">{format(parseISO(d), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
              <span className={net >= 0 ? 'text-[#22B07D]' : 'text-[#F2557A]'}>{net >= 0 ? '+' : ''}{formatVND(net)}</span>
            </div>
            {list.map((t) => <TxRow key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} />)}
          </Surface>
        );
      })}
    </div>
  );
}
