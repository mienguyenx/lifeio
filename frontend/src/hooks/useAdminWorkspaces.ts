import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  max_members: number | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
  inviter?: {
    name: string | null;
    email: string | null;
  };
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
}

export interface MemberActivity {
  date: string;
  goals: number;
  tasks: number;
  habits: number;
  journal: number;
}

export interface WorkspaceAnalytics {
  memberActivity: MemberActivity[];
  membersByRole: { role: string; count: number }[];
  memberGrowth: { date: string; count: number }[];
  topContributors: {
    userId: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    goals: number;
    tasks: number;
    habits: number;
  }[];
}

// Fetch all workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: ['admin-workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          owner:profiles!workspaces_owner_id_fkey(id, name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Workspace[];
    },
  });
}

// Fetch single workspace with details
export function useWorkspaceDetails(workspaceId: string | null) {
  return useQuery({
    queryKey: ['admin-workspace', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          owner:profiles!workspaces_owner_id_fkey(id, name, email, avatar_url)
        `)
        .eq('id', workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as Workspace | null;
    },
    enabled: !!workspaceId,
  });
}

// Fetch workspace members
export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ['admin-workspace-members', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          user:profiles!workspace_members_user_id_fkey(id, name, email, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkspaceMember[];
    },
    enabled: !!workspaceId,
  });
}

// Fetch workspace invitations
export function useWorkspaceInvitations(workspaceId: string | null) {
  return useQuery({
    queryKey: ['admin-workspace-invitations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select(`
          *,
          inviter:profiles!workspace_invitations_invited_by_fkey(name, email)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkspaceInvitation[];
    },
    enabled: !!workspaceId,
  });
}

// Fetch workspace stats
export function useWorkspaceStats(workspaceId: string | null) {
  return useQuery({
    queryKey: ['admin-workspace-stats', workspaceId],
    queryFn: async (): Promise<WorkspaceStats> => {
      if (!workspaceId) return { totalMembers: 0, activeMembers: 0, pendingInvites: 0 };

      const [membersResult, invitationsResult] = await Promise.all([
        supabase
          .from('workspace_members')
          .select('status', { count: 'exact' })
          .eq('workspace_id', workspaceId),
        supabase
          .from('workspace_invitations')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .gt('expires_at', new Date().toISOString()),
      ]);

      const members = membersResult.data || [];
      const activeMembers = members.filter(m => m.status === 'active').length;

      return {
        totalMembers: membersResult.count || 0,
        activeMembers,
        pendingInvites: invitationsResult.count || 0,
      };
    },
    enabled: !!workspaceId,
  });
}

// Fetch workspace analytics
export function useWorkspaceAnalytics(workspaceId: string | null) {
  return useQuery({
    queryKey: ['admin-workspace-analytics', workspaceId],
    queryFn: async (): Promise<WorkspaceAnalytics> => {
      if (!workspaceId) {
        return {
          memberActivity: [],
          membersByRole: [],
          memberGrowth: [],
          topContributors: [],
        };
      }

      // Get workspace members
      const { data: members } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          role,
          joined_at,
          user:profiles!workspace_members_user_id_fkey(id, name, email, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'active');

      if (!members || members.length === 0) {
        return {
          memberActivity: [],
          membersByRole: [],
          memberGrowth: [],
          topContributors: [],
        };
      }

      const userIds = members.map((m) => m.user_id);
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      // Fetch activity data for all members
      const [goalsData, tasksData, habitsData, journalData] = await Promise.all([
        supabase
          .from('goals')
          .select('user_id, created_at')
          .in('user_id', userIds)
          .gte('created_at', subDays(new Date(), 30).toISOString()),
        supabase
          .from('tasks')
          .select('user_id, created_at')
          .in('user_id', userIds)
          .gte('created_at', subDays(new Date(), 30).toISOString()),
        supabase
          .from('habit_completions')
          .select('habit_id, date')
          .gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd')),
        supabase
          .from('journal_entries')
          .select('user_id, created_at')
          .in('user_id', userIds)
          .gte('created_at', subDays(new Date(), 30).toISOString()),
      ]);

      // Get habits for these users to filter habit completions
      const { data: habitsForUsers } = await supabase
        .from('habits')
        .select('id, user_id')
        .in('user_id', userIds);

      const habitUserMap = new Map(habitsForUsers?.map((h) => [h.id, h.user_id]) || []);
      const filteredHabitCompletions = (habitsData.data || []).filter((hc) =>
        habitUserMap.has(hc.habit_id)
      );

      // Build member activity by date
      const memberActivity: MemberActivity[] = last30Days.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date: dateStr,
          goals: (goalsData.data || []).filter(
            (g) => format(new Date(g.created_at), 'yyyy-MM-dd') === dateStr
          ).length,
          tasks: (tasksData.data || []).filter(
            (t) => format(new Date(t.created_at), 'yyyy-MM-dd') === dateStr
          ).length,
          habits: filteredHabitCompletions.filter((h) => h.date === dateStr).length,
          journal: (journalData.data || []).filter(
            (j) => format(new Date(j.created_at), 'yyyy-MM-dd') === dateStr
          ).length,
        };
      });

      // Members by role
      const roleCount: Record<string, number> = {};
      members.forEach((m) => {
        roleCount[m.role] = (roleCount[m.role] || 0) + 1;
      });
      const membersByRole = Object.entries(roleCount).map(([role, count]) => ({
        role,
        count,
      }));

      // Member growth over time
      const memberGrowth = last30Days.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = members.filter(
          (m) => m.joined_at && format(new Date(m.joined_at), 'yyyy-MM-dd') <= dateStr
        ).length;
        return { date: dateStr, count };
      });

      // Top contributors
      const contributorStats = userIds.map((userId) => {
        const member = members.find((m) => m.user_id === userId);
        return {
          userId,
          name: member?.user?.name || null,
          email: member?.user?.email || null,
          avatar_url: member?.user?.avatar_url || null,
          goals: (goalsData.data || []).filter((g) => g.user_id === userId).length,
          tasks: (tasksData.data || []).filter((t) => t.user_id === userId).length,
          habits: filteredHabitCompletions.filter((h) => habitUserMap.get(h.habit_id) === userId)
            .length,
        };
      });

      const topContributors = contributorStats
        .map((c) => ({ ...c, total: c.goals + c.tasks + c.habits }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return {
        memberActivity,
        membersByRole,
        memberGrowth,
        topContributors,
      };
    },
    enabled: !!workspaceId,
  });
}

// Create workspace
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      description?: string;
      owner_id: string;
      max_members?: number;
    }) => {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Add owner as a member
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: data.owner_id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

      return workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      toast.success('Workspace đã được tạo thành công');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Update workspace
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      slug?: string;
      description?: string | null;
      is_active?: boolean;
      max_members?: number;
      logo_url?: string | null;
    }) => {
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace', variables.id] });
      toast.success('Workspace đã được cập nhật');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Delete workspace
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      toast.success('Workspace đã được xóa');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Transfer workspace ownership
export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      newOwnerId,
      currentOwnerId,
    }: {
      workspaceId: string;
      newOwnerId: string;
      currentOwnerId: string;
    }) => {
      // Update workspace owner
      const { error: wsError } = await supabase
        .from('workspaces')
        .update({ owner_id: newOwnerId })
        .eq('id', workspaceId);

      if (wsError) throw wsError;

      // Update current owner to admin
      const { error: oldOwnerError } = await supabase
        .from('workspace_members')
        .update({ role: 'admin' })
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentOwnerId);

      if (oldOwnerError) throw oldOwnerError;

      // Check if new owner is already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', newOwnerId)
        .maybeSingle();

      if (existingMember) {
        // Update existing member to owner
        const { error: newOwnerError } = await supabase
          .from('workspace_members')
          .update({ role: 'owner' })
          .eq('id', existingMember.id);

        if (newOwnerError) throw newOwnerError;
      } else {
        // Add new owner as member
        const { error: insertError } = await supabase.from('workspace_members').insert({
          workspace_id: workspaceId,
          user_id: newOwnerId,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        });

        if (insertError) throw insertError;
      }

      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace', data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-members', data.workspaceId] });
      toast.success('Đã chuyển quyền sở hữu workspace thành công');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Add member to workspace
export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workspace_id: string;
      user_id: string;
      role: 'admin' | 'member' | 'viewer';
    }) => {
      const { error } = await supabase.from('workspace_members').insert({
        ...data,
        status: 'active',
        joined_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-members', variables.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-stats', variables.workspace_id] });
      toast.success('Thành viên đã được thêm');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      workspaceId,
      role,
    }: {
      memberId: string;
      workspaceId: string;
      role: 'admin' | 'member' | 'viewer';
    }) => {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-members', data.workspaceId] });
      toast.success('Vai trò đã được cập nhật');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Remove member from workspace
export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      workspaceId,
    }: {
      memberId: string;
      workspaceId: string;
    }) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-members', data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-stats', data.workspaceId] });
      toast.success('Thành viên đã được xóa');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Create invitation
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workspace_id: string;
      email: string;
      role: 'admin' | 'member' | 'viewer';
      invited_by: string;
    }) => {
      const { error } = await supabase.from('workspace_invitations').insert(data);
      if (error) throw error;
      return { workspaceId: data.workspace_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-invitations', data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-stats', data.workspaceId] });
      toast.success('Lời mời đã được gửi');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

// Delete invitation
export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      workspaceId,
    }: {
      invitationId: string;
      workspaceId: string;
    }) => {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-invitations', data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['admin-workspace-stats', data.workspaceId] });
      toast.success('Lời mời đã được xóa');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}
