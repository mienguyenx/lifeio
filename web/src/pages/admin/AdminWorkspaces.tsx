import { useState } from 'react';
import {
  Building2,
  Plus,
  Users,
  Crown,
  Search,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Mail,
  Eye,
  Edit,
  Check,
  X,
  TrendingUp,
  Target,
  Activity,
  ArrowRightLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAllProfiles } from '@/hooks/useAdminData';
import {
  useWorkspaces,
  useWorkspaceMembers,
  useWorkspaceInvitations,
  useWorkspaceStats,
  useWorkspaceAnalytics,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useAddWorkspaceMember,
  useUpdateMemberRole,
  useRemoveWorkspaceMember,
  useCreateInvitation,
  useDeleteInvitation,
  useTransferOwnership,
  type Workspace,
  type WorkspaceMember,
} from '@/hooks/useAdminWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export default function AdminWorkspaces() {
  const { user } = useAuth();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { data: profiles } = useAllProfiles();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const filteredWorkspaces = workspaces?.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && ws.is_active) ||
      (statusFilter === 'inactive' && !ws.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workspaces?.length || 0,
    active: workspaces?.filter((w) => w.is_active).length || 0,
    inactive: workspaces?.filter((w) => !w.is_active).length || 0,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">Quản lý không gian làm việc và nhóm</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo Workspace
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Tổng workspaces</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <X className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-sm text-muted-foreground">Không hoạt động</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm workspace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workspaces Grid */}
      {filteredWorkspaces && filteredWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkspaces.map((ws) => (
            <Card
              key={ws.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedWorkspace(ws)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {ws.logo_url ? (
                      <img
                        src={ws.logo_url}
                        alt={ws.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{ws.name}</h3>
                      <Badge variant={ws.is_active ? 'default' : 'secondary'}>
                        {ws.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">/{ws.slug}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Crown className="w-3 h-3" />
                      <span className="truncate">{ws.owner?.name || ws.owner?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {ws.max_members || 5} max
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkspace(ws);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateWorkspace.mutate({ id: ws.id, is_active: !ws.is_active });
                        }}
                      >
                        {ws.is_active ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Vô hiệu hóa
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Kích hoạt
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToDelete(ws);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Không tìm thấy workspace nào</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo Workspace đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        profiles={profiles || []}
        onCreate={(data) => createWorkspace.mutate(data)}
        isLoading={createWorkspace.isPending}
      />

      {/* Workspace Detail Dialog */}
      {selectedWorkspace && (
        <WorkspaceDetailDialog
          workspace={selectedWorkspace}
          open={!!selectedWorkspace}
          onOpenChange={(open) => !open && setSelectedWorkspace(null)}
          currentUserId={user?.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa workspace "{workspaceToDelete?.name}"? Hành động này không
              thể hoàn tác và sẽ xóa tất cả thành viên và dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (workspaceToDelete) {
                  deleteWorkspace.mutate(workspaceToDelete.id);
                  setShowDeleteDialog(false);
                  setWorkspaceToDelete(null);
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Create Workspace Dialog Component
function CreateWorkspaceDialog({
  open,
  onOpenChange,
  profiles,
  onCreate,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Array<{ id: string; name: string | null; email: string | null }>;
  onCreate: (data: {
    name: string;
    slug: string;
    description?: string;
    owner_id: string;
    max_members?: number;
  }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [maxMembers, setMaxMembers] = useState('5');

  const handleSubmit = () => {
    if (!name || !slug || !ownerId) return;
    onCreate({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: description || undefined,
      owner_id: ownerId,
      max_members: parseInt(maxMembers) || 5,
    });
    onOpenChange(false);
    setName('');
    setSlug('');
    setDescription('');
    setOwnerId('');
    setMaxMembers('5');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo Workspace mới</DialogTitle>
          <DialogDescription>Tạo không gian làm việc mới cho người dùng</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tên workspace *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              placeholder="VD: Dự án Marketing"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="du-an-marketing"
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về workspace"
            />
          </div>
          <div className="space-y-2">
            <Label>Chủ sở hữu *</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn người sở hữu" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Số thành viên tối đa</Label>
            <Input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !slug || !ownerId || isLoading}>
            {isLoading ? 'Đang tạo...' : 'Tạo Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Workspace Detail Dialog Component
function WorkspaceDetailDialog({
  workspace,
  open,
  onOpenChange,
  currentUserId,
}: {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}) {
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspace.id);
  const { data: invitations } = useWorkspaceInvitations(workspace.id);
  const { data: stats } = useWorkspaceStats(workspace.id);
  const { data: analytics, isLoading: analyticsLoading } = useWorkspaceAnalytics(workspace.id);
  const { data: profiles } = useAllProfiles();

  const updateWorkspace = useUpdateWorkspace();
  const addMember = useAddWorkspaceMember();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveWorkspaceMember();
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const transferOwnership = useTransferOwnership();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workspace.name);
  const [editDescription, setEditDescription] = useState(workspace.description || '');
  const [editMaxMembers, setEditMaxMembers] = useState(workspace.max_members?.toString() || '5');

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  const [showTransfer, setShowTransfer] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const handleSaveEdit = () => {
    updateWorkspace.mutate({
      id: workspace.id,
      name: editName,
      description: editDescription || null,
      max_members: parseInt(editMaxMembers) || 5,
    });
    setIsEditing(false);
  };

  const handleAddMember = () => {
    if (!newMemberId) return;
    addMember.mutate({
      workspace_id: workspace.id,
      user_id: newMemberId,
      role: newMemberRole,
    });
    setShowAddMember(false);
    setNewMemberId('');
    setNewMemberRole('member');
  };

  const handleInvite = () => {
    if (!inviteEmail || !currentUserId) return;
    createInvitation.mutate({
      workspace_id: workspace.id,
      email: inviteEmail,
      role: inviteRole,
      invited_by: currentUserId,
    });
    setShowInvite(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const handleTransferOwnership = () => {
    if (!newOwnerId) return;
    transferOwnership.mutate({
      workspaceId: workspace.id,
      newOwnerId,
      currentOwnerId: workspace.owner_id,
    });
    setShowTransfer(false);
    setNewOwnerId('');
  };

  const existingMemberIds = members?.map((m) => m.user_id) || [];
  const availableProfiles = profiles?.filter((p) => !existingMemberIds.includes(p.id)) || [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{workspace.name}</DialogTitle>
              <DialogDescription>/{workspace.slug}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="members">Thành viên ({stats?.totalMembers || 0})</TabsTrigger>
            <TabsTrigger value="invitations">Lời mời ({stats?.pendingInvites || 0})</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
                  <p className="text-sm text-muted-foreground">Tổng thành viên</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{stats?.activeMembers || 0}</p>
                  <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Mail className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                  <p className="text-2xl font-bold">{stats?.pendingInvites || 0}</p>
                  <p className="text-sm text-muted-foreground">Lời mời chờ</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chủ sở hữu</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={workspace.owner?.avatar_url || undefined} />
                      <AvatarFallback>
                        {workspace.owner?.name?.[0] || workspace.owner?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{workspace.owner?.name || workspace.owner?.email}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <Badge variant={workspace.is_active ? 'default' : 'secondary'}>
                    {workspace.is_active ? 'Hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số thành viên tối đa</span>
                  <span>{workspace.max_members || 5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày tạo</span>
                  <span>{format(new Date(workspace.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                </div>
                {workspace.description && (
                  <div>
                    <span className="text-muted-foreground">Mô tả</span>
                    <p className="mt-1">{workspace.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            {analyticsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-64" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </div>
              </div>
            ) : analytics ? (
              <>
                {/* Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Hoạt động 30 ngày qua
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.memberActivity}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                            className="text-xs"
                          />
                          <YAxis className="text-xs" />
                          <Tooltip
                            labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="goals"
                            name="Goals"
                            stackId="1"
                            stroke={CHART_COLORS[0]}
                            fill={CHART_COLORS[0]}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="tasks"
                            name="Tasks"
                            stackId="1"
                            stroke={CHART_COLORS[1]}
                            fill={CHART_COLORS[1]}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="habits"
                            name="Habits"
                            stackId="1"
                            stroke={CHART_COLORS[2]}
                            fill={CHART_COLORS[2]}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="journal"
                            name="Journal"
                            stackId="1"
                            stroke={CHART_COLORS[3]}
                            fill={CHART_COLORS[3]}
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Members by Role */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Thành viên theo vai trò</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.membersByRole}
                              dataKey="count"
                              nameKey="role"
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              label={({ role, count }) => `${role}: ${count}`}
                            >
                              {analytics.membersByRole.map((_, index) => (
                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Member Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Tăng trưởng thành viên
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.memberGrowth}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                              className="text-xs"
                            />
                            <YAxis className="text-xs" />
                            <Tooltip
                              labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="Thành viên"
                              stroke={CHART_COLORS[0]}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Contributors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Top người đóng góp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.topContributors.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Thành viên</TableHead>
                            <TableHead className="text-center">Goals</TableHead>
                            <TableHead className="text-center">Tasks</TableHead>
                            <TableHead className="text-center">Habits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.topContributors.map((contributor, index) => (
                            <TableRow key={contributor.userId}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </span>
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={contributor.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {contributor.name?.[0] || contributor.email?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {contributor.name || contributor.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{contributor.goals}</TableCell>
                              <TableCell className="text-center">{contributor.tasks}</TableCell>
                              <TableCell className="text-center">{contributor.habits}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Chưa có dữ liệu hoạt động
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Không có dữ liệu analytics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Thành viên</h3>
              <Button size="sm" onClick={() => setShowAddMember(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm thành viên
              </Button>
            </div>

            {membersLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : members && members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thành viên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tham gia</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.user?.name?.[0] || member.user?.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user?.name || 'Chưa đặt tên'}</p>
                            <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.role === 'owner' ? (
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value: 'admin' | 'member' | 'viewer') =>
                              updateMemberRole.mutate({
                                memberId: member.id,
                                workspaceId: workspace.id,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.status === 'active' ? 'default' : 'secondary'}
                        >
                          {member.status === 'active' ? 'Hoạt động' : 'Chờ xác nhận'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.joined_at
                          ? format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: vi })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() =>
                              removeMember.mutate({
                                memberId: member.id,
                                workspaceId: workspace.id,
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có thành viên nào</p>
                </CardContent>
              </Card>
            )}

            {/* Add Member Dialog */}
            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm thành viên</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chọn người dùng</Label>
                    <Select value={newMemberId} onValueChange={setNewMemberId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người dùng" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProfiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name || p.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Select
                      value={newMemberRole}
                      onValueChange={(v: 'admin' | 'member' | 'viewer') => setNewMemberRole(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddMember(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleAddMember} disabled={!newMemberId}>
                    Thêm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Lời mời đang chờ</h3>
              <Button size="sm" onClick={() => setShowInvite(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Gửi lời mời
              </Button>
            </div>

            {invitations && invitations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Người mời</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.role}</Badge>
                      </TableCell>
                      <TableCell>{inv.inviter?.name || inv.inviter?.email}</TableCell>
                      <TableCell>
                        {format(new Date(inv.expires_at), 'dd/MM/yyyy', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() =>
                            deleteInvitation.mutate({
                              invitationId: inv.id,
                              workspaceId: workspace.id,
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Không có lời mời đang chờ</p>
                </CardContent>
              </Card>
            )}

            {/* Invite Dialog */}
            <Dialog open={showInvite} onOpenChange={setShowInvite}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gửi lời mời</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v: 'admin' | 'member' | 'viewer') => setInviteRole(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInvite(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleInvite} disabled={!inviteEmail}>
                    Gửi lời mời
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cài đặt Workspace</CardTitle>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Tên workspace</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mô tả</Label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số thành viên tối đa</Label>
                      <Input
                        type="number"
                        value={editMaxMembers}
                        onChange={(e) => setEditMaxMembers(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Hủy
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Tên</span>
                      <span>{workspace.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Slug</span>
                      <span>/{workspace.slug}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Mô tả</span>
                      <span>{workspace.description || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Số thành viên tối đa</span>
                      <span>{workspace.max_members || 5}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Transfer Ownership */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Chuyển quyền sở hữu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Chuyển quyền sở hữu workspace cho người dùng khác. Bạn sẽ trở thành Admin sau khi chuyển.
                </p>
                <Button variant="outline" onClick={() => setShowTransfer(true)}>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Chuyển quyền sở hữu
                </Button>
              </CardContent>
            </Card>

            {/* Transfer Ownership Dialog */}
            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Chuyển quyền sở hữu</DialogTitle>
                  <DialogDescription>
                    Chọn người dùng sẽ trở thành chủ sở hữu mới của workspace này.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chủ sở hữu mới</Label>
                    <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người dùng" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles
                          ?.filter((p) => p.id !== workspace.owner_id)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={p.avatar_url || undefined} />
                                  <AvatarFallback>{p.name?.[0] || p.email?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                {p.name || p.email}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg text-sm">
                    <p className="font-medium text-destructive">Lưu ý:</p>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>Chủ sở hữu hiện tại sẽ trở thành Admin</li>
                      <li>Người được chọn sẽ có toàn quyền với workspace</li>
                      <li>Hành động này không thể hoàn tác</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTransfer(false)}>
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleTransferOwnership}
                    disabled={!newOwnerId || transferOwnership.isPending}
                  >
                    {transferOwnership.isPending ? 'Đang chuyển...' : 'Xác nhận chuyển'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
