// Bảng api_keys — gom logic truy vấn/mutation đang nằm rải rác trong AdminAPIKeys & AdminAIProviders (bản cũ)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';

export interface AdminApiKey {
  id: string;
  provider: string;
  name: string;
  api_key: string;
  is_active: boolean;
  is_primary: boolean;
  usage_count: number;
  limit_per_day?: number | null;
  limit_per_month?: number | null;
  current_usage_today: number;
  current_usage_month: number;
  last_used_at?: string | null;
  last_error?: string | null;
  error_count: number;
  metadata: Record<string, string | undefined> | null;
  created_at: string;
  updated_at: string;
}

const KEY = ['admin-api-keys'];

export function useAdminApiKeys() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('api_keys').select('*').order('provider', { ascending: true }).order('is_primary', { ascending: false }).order('created_at', { ascending: false });
      if (error) return [] as AdminApiKey[];
      return (Array.isArray(data) ? data : []) as AdminApiKey[];
    },
  });
}

/** Bỏ cờ key chính của các key khác cùng provider (bản cũ chỉ làm khi bấm “Đặt làm chính”, tạo/sửa key chính thì bị trùng) */
async function unsetPrimary(provider: string, exceptId?: string) {
  let q = supabase.from('api_keys').update({ is_primary: false }).eq('provider', provider).eq('is_primary', true);
  if (exceptId) q = q.neq('id', exceptId);
  await q;
}

export type ApiKeyInput = Partial<Omit<AdminApiKey, 'id' | 'created_at' | 'updated_at'>> & { provider: string; name: string };

export function useSaveApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: ApiKeyInput & { id?: string }) => {
      if (data.is_primary) await unsetPrimary(data.provider, id);
      if (id) {
        const { error } = await supabase.from('api_keys').update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_keys').insert(data);
        if (error) throw error;
      }
      return !!id;
    },
    onSuccess: (edited) => { qc.invalidateQueries({ queryKey: KEY }); toast.success(edited ? 'Đã cập nhật API key' : 'Đã thêm API key'); },
    onError: (e: Error) => toast.error(e.message || 'Có lỗi xảy ra'),
  });
}

export function useToggleApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('api_keys').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Đã cập nhật trạng thái'); },
    onError: (e: Error) => toast.error(e.message || 'Có lỗi xảy ra'),
  });
}

export function useSetPrimaryApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, provider }: { id: string; provider: string }) => {
      await unsetPrimary(provider);
      const { error } = await supabase.from('api_keys').update({ is_primary: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Đã đặt làm key chính'); },
    onError: (e: Error) => toast.error(e.message || 'Có lỗi xảy ra'),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Đã xóa API key'); },
    onError: (e: Error) => toast.error(e.message || 'Có lỗi xảy ra'),
  });
}

/** Hiển thị key dạng rút gọn */
export const maskKey = (k?: string | null) => (!k ? '—' : k.length <= 12 ? '••••••' : `${k.slice(0, 8)}…${k.slice(-4)}`);
