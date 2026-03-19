import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Key, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface APIKey {
  id: string;
  provider: string;
  name: string;
  api_key: string;
  is_active: boolean;
  is_primary: boolean;
  usage_count: number;
  limit_per_day?: number;
  limit_per_month?: number;
  current_usage_today: number;
  current_usage_month: number;
  last_used_at?: string;
  last_error?: string;
  error_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'perplexity', label: 'Perplexity AI' },
];

export default function AdminAPIKeys() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [deleteKey, setDeleteKey] = useState<APIKey | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    provider: 'gemini',
    name: '',
    api_key: '',
    is_active: true,
    is_primary: false,
    limit_per_day: '',
    limit_per_month: '',
  });

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('provider', { ascending: true })
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as APIKey[];
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: Partial<APIKey>) => {
      if (editingKey) {
        const { data: updated, error } = await supabase
          .from('api_keys')
          .update(data)
          .eq('id', editingKey.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('api_keys')
          .insert({
            ...data,
            limit_per_day: data.limit_per_day ? parseInt(data.limit_per_day as any) : null,
            limit_per_month: data.limit_per_month ? parseInt(data.limit_per_month as any) : null,
          })
          .select()
          .single();

        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      setIsDialogOpen(false);
      setEditingKey(null);
      resetForm();
      toast.success(editingKey ? 'Đã cập nhật API key' : 'Đã thêm API key');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      setDeleteKey(null);
      toast.success('Đã xóa API key');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async ({ id, provider }: { id: string; provider: string }) => {
      // First, unset all primary keys for this provider
      await supabase
        .from('api_keys')
        .update({ is_primary: false })
        .eq('provider', provider)
        .eq('is_primary', true);

      // Then set this one as primary
      const { error } = await supabase
        .from('api_keys')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      toast.success('Đã đặt làm API key chính');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });

  const resetForm = () => {
    setFormData({
      provider: 'gemini',
      name: '',
      api_key: '',
      is_active: true,
      is_primary: false,
      limit_per_day: '',
      limit_per_month: '',
    });
    setEditingKey(null);
  };

  const handleEdit = (key: APIKey) => {
    setEditingKey(key);
    setFormData({
      provider: key.provider,
      name: key.name,
      api_key: key.api_key, // Show existing key
      is_active: key.is_active,
      is_primary: key.is_primary,
      limit_per_day: key.limit_per_day?.toString() || '',
      limit_per_month: key.limit_per_month?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.api_key) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const submitData: any = {
      provider: formData.provider,
      name: formData.name,
      is_active: formData.is_active,
      is_primary: formData.is_primary,
    };

    // Only update API key if it's new or changed
    if (!editingKey || formData.api_key !== editingKey.api_key) {
      submitData.api_key = formData.api_key;
    }

    if (formData.limit_per_day) {
      submitData.limit_per_day = parseInt(formData.limit_per_day);
    }
    if (formData.limit_per_month) {
      submitData.limit_per_month = parseInt(formData.limit_per_month);
    }

    mutation.mutate(submitData);
  };

  const groupedKeys = apiKeys?.reduce((acc, key) => {
    if (!acc[key.provider]) {
      acc[key.provider] = [];
    }
    acc[key.provider].push(key);
    return acc;
  }, {} as Record<string, APIKey[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý API keys cho Gemini, Perplexity và các dịch vụ AI khác
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingKey ? 'Sửa API Key' : 'Thêm API Key'}</DialogTitle>
              <DialogDescription>
                {editingKey ? 'Cập nhật thông tin API key' : 'Thêm API key mới cho dịch vụ AI'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Nhà cung cấp</Label>
                <select
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!!editingKey}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Tên (để phân biệt)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Gemini Key 1, Perplexity Production"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Nhập API key"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Kích hoạt
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
                />
                <Label htmlFor="is_primary" className="cursor-pointer">
                  Đặt làm mặc định (sẽ tự động bỏ mặc định của key khác cùng provider)
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limit_per_day">Giới hạn/ngày (tùy chọn)</Label>
                  <Input
                    id="limit_per_day"
                    type="number"
                    value={formData.limit_per_day}
                    onChange={(e) => setFormData({ ...formData, limit_per_day: e.target.value })}
                    placeholder="VD: 1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit_per_month">Giới hạn/tháng (tùy chọn)</Label>
                  <Input
                    id="limit_per_month"
                    type="number"
                    value={formData.limit_per_month}
                    onChange={(e) => setFormData({ ...formData, limit_per_month: e.target.value })}
                    placeholder="VD: 30000"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? 'Đang lưu...' : editingKey ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedKeys).map(([provider, keys]) => (
            <Card key={provider}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {PROVIDERS.find((p) => p.value === provider)?.label || provider}
                </CardTitle>
                <CardDescription>
                  {keys.length} API key{keys.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Sử dụng</TableHead>
                      <TableHead>Lỗi</TableHead>
                      <TableHead>Lần cuối</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {key.name}
                            {key.is_primary && (
                              <Badge variant="default" className="text-xs">
                                Mặc định
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {showKey[key.id]
                                ? key.api_key
                                : `${key.api_key.substring(0, 8)}...${key.api_key.substring(key.api_key.length - 4)}`}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                            >
                              {showKey[key.id] ? 'Ẩn' : 'Hiện'}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {key.is_active ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Hoạt động
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Tắt
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Tổng: {key.usage_count}</div>
                            {key.limit_per_day && (
                              <div className="text-muted-foreground">
                                Hôm nay: {key.current_usage_today}/{key.limit_per_day}
                              </div>
                            )}
                            {key.limit_per_month && (
                              <div className="text-muted-foreground">
                                Tháng này: {key.current_usage_month}/{key.limit_per_month}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {key.error_count > 0 ? (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span>{key.error_count}</span>
                              {key.last_error && (
                                <span className="text-xs text-muted-foreground ml-1" title={key.last_error}>
                                  (có lỗi)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {key.last_used_at ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(key.last_used_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Chưa dùng</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={key.is_active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: key.id, is_active: checked })
                              }
                            />
                            {!key.is_primary && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPrimaryMutation.mutate({ id: key.id, provider: key.provider })}
                              >
                                Đặt mặc định
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(key)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteKey(key)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {apiKeys && apiKeys.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có API key nào</p>
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm API Key đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa API key "{deleteKey?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKey && deleteMutation.mutate(deleteKey.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

