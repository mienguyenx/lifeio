import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useFinanceSync, type FinanceTransaction } from '@/hooks/sync/useFinanceSync';

export interface TxDraft { type: FinanceTransaction['type']; category: string; amount: string; description: string; date: string }

/** CRUD như trang cũ: cập nhật store (optimistic) rồi đồng bộ qua useFinanceSync. */
export function useFinance() {
  const txs = useLifeOSStore((s) => s.financeTransactions);
  const goals = useLifeOSStore((s) => s.goals);
  const user = useLifeOSStore((s) => s.user);
  const { addFinanceTransaction, updateFinanceTransaction, deleteFinanceTransaction } = useLifeOSStore.getState();
  const sync = useFinanceSync();
  const sorted = useMemo(() => [...txs].sort((a, b) => b.date.localeCompare(a.date)), [txs]);
  const financeGoals = useMemo(() => goals.filter((g) => g.area === 'finance' && !g.deletedAt), [goals]);

  const add = useCallback(async (d: Omit<FinanceTransaction, 'id'>, label?: string) => {
    const t: FinanceTransaction = { id: crypto.randomUUID(), ...d };
    addFinanceTransaction(t);
    const ok = await sync.saveTransaction(t);
    if (!ok) toast.error('Không thể lưu vào database');
    else toast.success(label ? `Đã ghi nhận: ${label}` : t.type === 'income' ? 'Đã ghi nhận thu nhập!' : 'Đã ghi nhận chi tiêu!');
  }, [addFinanceTransaction, sync]);
  const edit = useCallback(async (id: string, d: TxDraft) => {
    const updates: Partial<FinanceTransaction> = { type: d.type, category: d.category, amount: parseFloat(d.amount), description: d.description, date: d.date };
    updateFinanceTransaction(id, updates);
    const ok = await sync.updateTransaction(id, updates);
    if (!ok) toast.error('Không thể cập nhật vào database'); else toast.success('Đã cập nhật giao dịch!');
  }, [updateFinanceTransaction, sync]);
  const remove = useCallback(async (id: string) => {
    deleteFinanceTransaction(id);
    const ok = await sync.deleteTransaction(id);
    if (!ok) toast.error('Không thể xóa khỏi database'); else toast.success('Đã xóa giao dịch!');
  }, [deleteFinanceTransaction, sync]);

  return { txs, sorted, financeGoals, user, add, edit, remove };
}
export type FinanceApi = ReturnType<typeof useFinance>;
