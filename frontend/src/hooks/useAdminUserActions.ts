// Mutation quản trị người dùng — tách từ pages/admin/AdminUsers.tsx để trang mới và bản cũ dùng chung
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Delete user hook
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles (cascade will handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      
      // Also delete user role
      await supabase.from('user_roles').delete().eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Đã xóa người dùng');
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    },
  });
}

// Send email hook
export function useSendEmail() {
  return useMutation({
    mutationFn: async ({ userId, subject, message }: { userId: string; subject: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          action: 'send-notification',
          userId,
          subject,
          template: 'notification',
          data: { title: subject, message },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Đã gửi email thành công');
    },
    onError: (err: Error) => {
      toast.error(`Lỗi gửi email: ${err.message}`);
    },
  });
}

// Reset password hook  
export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          action: 'send-password-reset',
          userId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Đã gửi email reset password đến ${(data as { email?: string } | null)?.email ?? ''}`);
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    },
  });
}

// Reset onboarding hook
export function useResetOnboarding() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          onboarding_completed: false,
          preferences: {},
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Đã reset onboarding — user sẽ thấy wizard lần sau đăng nhập'),
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  });
}

// Update subscription hook
export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, planId, status }: { userId: string; planId: string; status: string }) => {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ plan_id: planId, status, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: userId, plan_id: planId, status });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-subscriptions'] });
      toast.success('Đã cập nhật gói dịch vụ');
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    },
  });
}
