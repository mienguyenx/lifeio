import { useCallback } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Database } from '@/integrations/supabase/types';

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

type FinanceTransactionRow = Database['public']['Tables']['finance_transactions']['Row'];

// Transform Supabase row to local FinanceTransaction type
function transformTransactionFromDB(row: FinanceTransactionRow): FinanceTransaction {
  return {
    id: row.id,
    date: row.date,
    type: row.type as FinanceTransaction['type'],
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
  };
}

// Transform local FinanceTransaction to Supabase insert/update format
function transformTransactionToDB(transaction: Partial<FinanceTransaction>, userId: string) {
  return {
    id: transaction.id,
    user_id: userId,
    date: transaction.date,
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description,
  };
}

// Transform partial updates only
function transformTransactionUpdatesToDB(updates: Partial<FinanceTransaction>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('date' in updates) data.date = updates.date;
  if ('type' in updates) data.type = updates.type;
  if ('category' in updates) data.category = updates.category;
  if ('amount' in updates) data.amount = updates.amount;
  if ('description' in updates) data.description = updates.description;
  
  return data;
}

export function useFinanceSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();

  // Load transactions from Supabase
  const loadTransactions = useCallback(async (): Promise<FinanceTransaction[]> => {
    if (!user) {
      console.log('[FinanceSync] No user, skipping load');
      return [];
    }

    try {
      console.log('[FinanceSync] Loading transactions for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FinanceSync] Error loading transactions:', error);
        throw error;
      }

      console.log('[FinanceSync] Loaded', data?.length || 0, 'transactions');
      return (data || []).map(transformTransactionFromDB);
    } catch (error) {
      console.error('[FinanceSync] Error loading transactions:', error);
      return [];
    }
  }, [user]);

  // Save transaction to Supabase
  const saveTransaction = useCallback(async (transaction: FinanceTransaction): Promise<boolean> => {
    if (!user) return false;

    const data = transformTransactionToDB(transaction, user.id);

    if (!isOnline) {
      await queueChange('create', 'finance_transactions', transaction.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[FinanceSync] Saving transaction to Supabase:', transaction.type, transaction.amount, data);
      const { error } = await supabase
        .from('finance_transactions')
        .upsert(data);

      if (error) {
        console.error('[FinanceSync] Error saving transaction:', error);
        throw error;
      }
      
      console.log('[FinanceSync] Successfully saved transaction to Supabase:', transaction.description);
      return true;
    } catch (error) {
      console.error('[FinanceSync] Error saving transaction:', error);
      await queueChange('create', 'finance_transactions', transaction.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update transaction in Supabase
  const updateTransaction = useCallback(async (id: string, updates: Partial<FinanceTransaction>): Promise<boolean> => {
    if (!user) return false;

    const data = transformTransactionUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'finance_transactions', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('finance_transactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      await queueChange('update', 'finance_transactions', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete transaction from Supabase (soft delete)
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('update', 'finance_transactions', id, { deleted_at: new Date().toISOString() });
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('finance_transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      await queueChange('update', 'finance_transactions', id, { deleted_at: new Date().toISOString() });
      return false;
    }
  }, [user, isOnline, queueChange]);

  return {
    loadTransactions,
    saveTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

