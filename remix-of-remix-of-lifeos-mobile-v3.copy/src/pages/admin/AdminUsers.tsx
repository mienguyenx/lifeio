import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, MoreHorizontal, Shield, ShieldCheck, User, Users, 
  UserCheck, UserX, Eye, Mail, Calendar, Target, CheckSquare,
  Activity, Crown, Clock, TrendingUp, Filter, Flame, BarChart3,
  Trash2, Key, Send, CreditCard, Loader2, AlertTriangle
} from 'lucide-react';
import { useAllProfiles, useUserRoles, useUpdateUserRole, useAdminStats, useSubscriptionPlans, useUserSubscriptions, useUpdateProfileName } from '@/hooks/useAdminData';
import { useUserStats, useUserSubscription, useUserAnalytics } from '@/hooks/useAdminUserData';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type RoleFilter = 'all' | 'admin' | 'moderator' | 'user';

// Delete user hook
function useDeleteUser() {
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
function useSendEmail() {
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
function useSendPasswordReset() {
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
      toast.success(`Đã gửi email reset password đến ${data.email}`);
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    },
  });
}

// Update subscription hook
function useUpdateSubscription() {
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
      toast.success('Đã cập nhật gói dịch vụ');
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    },
  });
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  
  const { data: profiles, isLoading } = useAllProfiles();
  const { data: roles } = useUserRoles();
  const { data: stats } = useAdminStats();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const sendEmail = useSendEmail();
  const sendPasswordReset = useSendPasswordReset();

  const getUserRole = (userId: string) => {
    const userRole = roles?.find(r => r.user_id === userId);
    return userRole?.role || 'user';
  };

  const filteredProfiles = useMemo(() => {
    let result = profiles ?? [];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(profile =>
        profile.name?.toLowerCase().includes(query) ||
        profile.email?.toLowerCase().includes(query)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(profile => getUserRole(profile.id) === roleFilter);
    }
    
    return result;
  }, [profiles, searchQuery, roleFilter, roles]);

  const handleRoleChange = (userId: string, role: 'admin' | 'moderator' | 'user') => {
    updateRole.mutate({ userId, role });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive hover:bg-destructive/80"><ShieldCheck className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-primary hover:bg-primary/80"><Shield className="w-3 h-3 mr-1" />Moderator</Badge>;
      default:
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  const roleStats = useMemo(() => {
    const adminCount = roles?.filter(r => r.role === 'admin').length || 0;
    const modCount = roles?.filter(r => r.role === 'moderator').length || 0;
    const userCount = (stats?.totalUsers || 0) - adminCount - modCount;
    return { admin: adminCount, moderator: modCount, user: userCount };
  }, [roles, stats]);

  const selectedProfile = profiles?.find(p => p.id === selectedUserId);

  const isMobile = useIsMobile();

  return (
    <div className={cn("space-y-6", isMobile ? "p-4" : "p-6")}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>Quản lý người dùng</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Tổng người dùng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldCheck className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.admin}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.moderator}</p>
                <p className="text-xs text-muted-foreground">Moderator</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.user}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm theo tên hoặc email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Lọc theo role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Ngày tham gia</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length > 0 ? filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{profile.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {profile.email || 'N/A'}
                      </TableCell>
                      <TableCell>{getRoleBadge(getUserRole(profile.id))}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {profile.created_at ? format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedUserId(profile.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Thay đổi Role</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRoleChange(profile.id, 'admin')}>
                                <ShieldCheck className="w-4 h-4 mr-2 text-destructive" />Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(profile.id, 'moderator')}>
                                <Shield className="w-4 h-4 mr-2 text-primary" />Moderator
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(profile.id, 'user')}>
                                <User className="w-4 h-4 mr-2" />User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setEmailTarget({ id: profile.id, name: profile.name || 'User', email: profile.email || '' });
                                setEmailDialogOpen(true);
                              }}>
                                <Mail className="w-4 h-4 mr-2" />Gửi email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => sendPasswordReset.mutate(profile.id)}>
                                <Key className="w-4 h-4 mr-2" />Gửi reset password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setUserToDelete({ id: profile.id, name: profile.name || 'User' });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />Xóa người dùng
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy người dùng nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination info */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {filteredProfiles.length} / {stats?.totalUsers || 0} người dùng
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-full mx-2" : "max-w-2xl")}>
          <DialogHeader>
            <DialogTitle className={cn(isMobile && "text-lg")}>Chi tiết người dùng</DialogTitle>
            <DialogDescription className={cn(isMobile && "text-sm")}>Xem thông tin và hoạt động của người dùng</DialogDescription>
          </DialogHeader>
          {selectedProfile && (
            <UserDetailContent 
              profile={selectedProfile} 
              role={getUserRole(selectedProfile.id)}
              onRoleChange={(role) => handleRoleChange(selectedProfile.id, role)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xác nhận xóa người dùng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.name}</strong>? 
              Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (userToDelete) {
                  deleteUser.mutate(userToDelete.id);
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }
              }}
            >
              {deleteUser.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Xóa người dùng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gửi email cho {emailTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Email sẽ được gửi đến: {emailTarget?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Tiêu đề</Label>
              <Input 
                id="subject"
                placeholder="Nhập tiêu đề email..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Nội dung</Label>
              <Textarea 
                id="message"
                placeholder="Nhập nội dung email..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (emailTarget && emailSubject && emailMessage) {
                  sendEmail.mutate({ 
                    userId: emailTarget.id, 
                    subject: emailSubject, 
                    message: emailMessage 
                  });
                  setEmailDialogOpen(false);
                  setEmailSubject('');
                  setEmailMessage('');
                  setEmailTarget(null);
                }
              }}
              disabled={!emailSubject || !emailMessage || sendEmail.isPending}
            >
              {sendEmail.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gửi email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserDetailContentProps {
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    birthday: string | null;
    timezone: string | null;
    life_purpose: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  role: string;
  onRoleChange: (role: 'admin' | 'moderator' | 'user') => void;
}

function UserDetailContent({ profile, role, onRoleChange }: UserDetailContentProps) {
  const { data: userStats, isLoading: statsLoading } = useUserStats(profile.id);
  const { data: subscription } = useUserSubscription(profile.id);
  const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics(profile.id);
  const { data: plans } = useSubscriptionPlans();
  const updateSubscription = useUpdateSubscription();
  const updateProfileName = useUpdateProfileName();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(subscription?.plan_id || '');
  
  // Update selectedPlanId when subscription changes
  useEffect(() => {
    if (subscription?.plan_id) {
      setSelectedPlanId(subscription.plan_id);
    }
  }, [subscription?.plan_id]);

  const AREA_COLORS: Record<string, string> = {
    health: 'hsl(var(--area-health))',
    career: 'hsl(var(--area-career))',
    finance: 'hsl(var(--area-finance))',
    relationships: 'hsl(var(--area-relationships))',
    personal: 'hsl(var(--area-personal))',
    fun: 'hsl(var(--area-fun))',
    environment: 'hsl(var(--area-environment))',
    spirituality: 'hsl(var(--area-spirituality))',
    learning: 'hsl(var(--area-learning))',
    contribution: 'hsl(var(--area-contribution))',
  };

  const STATUS_COLORS: Record<string, string> = {
    todo: 'hsl(var(--muted-foreground))',
    in_progress: 'hsl(var(--primary))',
    done: 'hsl(var(--success))',
    deferred: 'hsl(var(--warning))',
  };

  return (
    <ScrollArea className="max-h-[70vh]">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="subscription">Gói dịch vụ</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{profile.name || 'Chưa đặt tên'}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newName = prompt('Nhập tên mới:', profile.name || '');
                    if (newName && newName.trim() && newName !== profile.name) {
                      updateProfileName.mutate({ userId: profile.id, name: newName.trim() });
                    }
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Select value={role} onValueChange={(v) => onRoleChange(v as 'admin' | 'moderator' | 'user')}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-destructive" />Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />Moderator
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profile Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />Email
              </p>
              <p className="font-medium">{profile.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />Ngày tham gia
              </p>
              <p className="font-medium">
                {profile.created_at 
                  ? format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: vi })
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />Cập nhật lần cuối
              </p>
              <p className="font-medium">
                {profile.updated_at 
                  ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true, locale: vi })
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Timezone</p>
              <p className="font-medium">{profile.timezone || 'Asia/Ho_Chi_Minh'}</p>
            </div>
          </div>

          {profile.bio && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Giới thiệu</p>
                <p>{profile.bio}</p>
              </div>
            </>
          )}

          {profile.life_purpose && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mục đích sống</p>
              <p className="italic">"{profile.life_purpose}"</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-4">
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : userStats ? (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.goalsCount}</p>
                      <p className="text-xs text-muted-foreground">Mục tiêu ({userStats.activeGoalsCount} đang hoạt động)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Activity className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.habitsCount}</p>
                      <p className="text-xs text-muted-foreground">Thói quen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckSquare className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.tasksCount}</p>
                      <p className="text-xs text-muted-foreground">Công việc ({userStats.completedTasksCount} hoàn thành)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <TrendingUp className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.journalCount}</p>
                      <p className="text-xs text-muted-foreground">Nhật ký</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không có dữ liệu hoạt động
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          {analyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Daily Activity Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Hoạt động 30 ngày gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }} 
                          interval={4}
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tasks" 
                          stackId="1"
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary)/0.3)" 
                          name="Công việc"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="habits" 
                          stackId="1"
                          stroke="hsl(var(--accent))" 
                          fill="hsl(var(--accent)/0.3)" 
                          name="Thói quen"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="journals" 
                          stackId="1"
                          stroke="hsl(var(--success))" 
                          fill="hsl(var(--success)/0.3)" 
                          name="Nhật ký"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Habit Completion Rate */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tỷ lệ hoàn thành thói quen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={analytics.habitCompletionRate} className="h-2" />
                      </div>
                      <span className="text-lg font-bold">{analytics.habitCompletionRate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">7 ngày gần đây</p>
                  </CardContent>
                </Card>

                {/* Streak Data */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flame className="h-4 w-4 text-warning" />
                      Chuỗi streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-warning">{analytics.streakData.current}</p>
                        <p className="text-xs text-muted-foreground">Hiện tại</p>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div>
                        <p className="text-2xl font-bold text-success">{analytics.streakData.best}</p>
                        <p className="text-xs text-muted-foreground">Tốt nhất</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tasks by Status */}
                {analytics.tasksByStatus.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tasks theo trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.tasksByStatus}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={45}
                              dataKey="count"
                              nameKey="status"
                            >
                              {analytics.tasksByStatus.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted))'} 
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Goals by Area */}
                {analytics.goalsByArea.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Mục tiêu theo lĩnh vực</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.goalsByArea} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis 
                              type="category" 
                              dataKey="area" 
                              tick={{ fontSize: 10 }}
                              width={80}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                              {analytics.goalsByArea.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={AREA_COLORS[entry.area] || 'hsl(var(--primary))'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không có dữ liệu analytics
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-4">
          {subscription ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-warning" />
                  <div>
                    <CardTitle>{subscription.plan_name}</CardTitle>
                    <CardDescription>
                      {subscription.status === 'active' ? 'Đang hoạt động' : 'Hết hạn'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày bắt đầu</span>
                  <span>{format(new Date(subscription.started_at), 'dd/MM/yyyy', { locale: vi })}</span>
                </div>
                {subscription.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày hết hạn</span>
                    <span>{format(new Date(subscription.expires_at), 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status === 'active' ? 'Đang hoạt động' : subscription.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Người dùng chưa có gói dịch vụ</p>
              </CardContent>
            </Card>
          )}
          
          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cập nhật gói dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn gói</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gói dịch vụ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price.toLocaleString()}đ/{plan.billing_period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full"
                disabled={!selectedPlanId || updateSubscription.isPending}
                onClick={() => updateSubscription.mutate({ 
                  userId: profile.id, 
                  planId: selectedPlanId, 
                  status: 'active' 
                })}
              >
                {updateSubscription.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Cập nhật gói
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );
}