import { useState, useCallback } from 'react';
import { Bot, Plus, Settings2, Globe, Loader2, RefreshCw, Download, Trash2, Key, Eye, EyeOff, CheckCircle2, XCircle, Play, ChevronRight, Link2, Shield, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition, StaggerContainer } from '@/components/admin/AdminAnimations';
import { ProviderCard } from '@/components/admin/ProviderCard';
import { useAIProviders, useUpdateAIProvider, useCreateAIProvider, useDeleteAIProvider, useAIModels, useCreateAIModel, useDeleteAIModel } from '@/hooks/useAdminData';
import { fetchModelsFromProvider, testProviderConnection } from '@/services/providerService';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAIProvider, FetchedModel } from '@/types/admin';

const PROVIDER_TYPES = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: 'Custom' },
];

const AUTH_TYPES = [
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key-header', label: 'Custom Header' },
  { value: 'query-param', label: 'Query Parameter' },
  { value: 'none', label: 'No Auth' },
];

export default function AdminAIProviders() {
  const { data: providers, isLoading } = useAIProviders();
  const { data: models } = useAIModels();
  const updateProvider = useUpdateAIProvider();
  const createProvider = useCreateAIProvider();
  const deleteProviderMutation = useDeleteAIProvider();
  const createModel = useCreateAIModel();
  const deleteModel = useDeleteAIModel();
  const queryClient = useQueryClient();

  // API keys
  const { data: apiKeys } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_keys').select('*').order('provider');
      if (error) return [];
      return data || [];
    },
  });

  const [selectedProvider, setSelectedProvider] = useState<AdminAIProvider | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Add provider form
  const [newProvider, setNewProvider] = useState({
    name: '', slug: '', type: 'openai-compatible' as any,
    base_url: '', models_endpoint: '/models', description: '',
    auth_type: 'bearer' as any, auth_header: 'Authorization', auth_prefix: 'Bearer',
  });

  // Add key form
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', api_key: '', base_url: '' });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const getKeyCount = (slug: string) => apiKeys?.filter((k: any) => k.provider === slug).length || 0;
  const getModelCount = (slug: string) => models?.filter((m) => m.provider === slug).length || 0;
  const getProviderKeys = (slug: string) => apiKeys?.filter((k: any) => k.provider === slug) || [];
  const getProviderModels = (slug: string) => models?.filter((m) => m.provider === slug) || [];

  const handleToggle = (provider: AdminAIProvider) => {
    if (provider.id.startsWith('builtin-')) {
      toast.error('Cần tạo table admin_ai_providers trước');
      return;
    }
    updateProvider.mutate({ id: provider.id, is_active: !provider.is_active });
  };

  const handleCreateProvider = () => {
    if (!newProvider.name || !newProvider.slug) {
      toast.error('Cần nhập tên và slug');
      return;
    }
    createProvider.mutate({
      ...newProvider,
      icon_url: null, color: null,
      extra_headers: {},
      fetch_type: 'api',
      model_transform: null,
      is_active: true,
      is_builtin: false,
      supports_streaming: true,
      supports_tools: false,
      docs_url: null,
      pricing_url: null,
      sort_order: (providers?.length || 0) + 1,
    }, {
      onSuccess: () => {
        setShowAddProvider(false);
        setNewProvider({ name: '', slug: '', type: 'openai-compatible', base_url: '', models_endpoint: '/models', description: '', auth_type: 'bearer', auth_header: 'Authorization', auth_prefix: 'Bearer' });
      },
    });
  };

  const handleFetchModels = useCallback(async () => {
    if (!selectedProvider) return;
    setIsFetching(true);
    setFetchedModels([]);
    try {
      const result = await fetchModelsFromProvider(selectedProvider);
      const existingIds = new Set(models?.map((m) => m.model_id) || []);
      const newModels = result.filter((m) => !existingIds.has(m.id));
      setFetchedModels(newModels);
      toast.success(`Tìm thấy ${result.length} models (${newModels.length} chưa import)`);
    } catch (err: any) {
      toast.error(`Lỗi fetch: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  }, [selectedProvider, models]);

  const handleImportModel = useCallback((model: FetchedModel) => {
    createModel.mutate({
      name: model.name,
      model_id: model.id,
      provider: model.provider_slug,
      description: model.description || `Auto-imported from ${model.provider_slug}`,
      max_tokens: model.context_length ? Math.min(model.context_length, 32768) : 4096,
      temperature: 0.7,
      capabilities: model.capabilities || ['chat'],
      is_active: true,
      is_default: false,
    }, {
      onSuccess: () => {
        setFetchedModels((prev) => prev.filter((m) => m.id !== model.id));
        toast.success(`Imported ${model.name}`);
      },
    });
  }, [createModel]);

  const handleImportAll = useCallback(() => {
    fetchedModels.forEach((m) => handleImportModel(m));
  }, [fetchedModels, handleImportModel]);

  const handleTestConnection = useCallback(async () => {
    if (!selectedProvider) return;
    setIsTesting(true);
    try {
      const result = await testProviderConnection(selectedProvider);
      if (result.success) {
        toast.success(`✅ Kết nối thành công — ${result.modelCount} models`);
      } else {
        toast.error(`❌ Lỗi: ${result.error}`);
      }
    } finally {
      setIsTesting(false);
    }
  }, [selectedProvider]);

  const handleAddKey = async () => {
    if (!selectedProvider || !newKey.name || !newKey.api_key) {
      toast.error('Điền đủ thông tin');
      return;
    }
    const { error } = await supabase.from('api_keys').insert({
      provider: selectedProvider.slug,
      name: newKey.name,
      api_key: newKey.api_key,
      is_active: true,
      is_primary: getKeyCount(selectedProvider.slug) === 0,
      metadata: newKey.base_url ? { base_url: newKey.base_url } : {},
    });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
    setShowAddKey(false);
    setNewKey({ name: '', api_key: '', base_url: '' });
    toast.success('Đã thêm API key');
  };

  const handleToggleKeyActive = async (id: string, active: boolean) => {
    await supabase.from('api_keys').update({ is_active: active }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
  };

  const handleSetPrimary = async (id: string, provider: string) => {
    await supabase.from('api_keys').update({ is_primary: false }).eq('provider', provider).eq('is_primary', true);
    await supabase.from('api_keys').update({ is_primary: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
    toast.success('Đã đặt làm key chính');
  };

  const handleDeleteKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
    toast.success('Đã xóa key');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="AI Providers"
        description="Quản lý nhà cung cấp AI — models tự động thu thập từ provider"
        icon={Globe}
        actions={
          <Button onClick={() => setShowAddProvider(true)}>
            <Plus className="w-4 h-4 mr-2" /> Custom Provider
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{providers?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Providers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{providers?.filter((p) => p.is_active).length || 0}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiKeys?.length || 0}</p>
              <p className="text-xs text-muted-foreground">API Keys</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{models?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Models</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {providers?.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            keyCount={getKeyCount(provider.slug)}
            modelCount={getModelCount(provider.slug)}
            onSelect={setSelectedProvider}
            onToggle={handleToggle}
          />
        ))}

        {/* Add custom card */}
        <Card
          className="cursor-pointer border-dashed hover:border-primary/40 transition-colors flex items-center justify-center min-h-[160px]"
          onClick={() => setShowAddProvider(true)}
        >
          <CardContent className="p-4 text-center">
            <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">Custom Provider</p>
            <p className="text-[10px] text-muted-foreground">LM Studio, Deepinfra, etc.</p>
          </CardContent>
        </Card>
      </StaggerContainer>

      {/* Provider Detail Sheet */}
      <Sheet open={!!selectedProvider} onOpenChange={(open) => { if (!open) { setSelectedProvider(null); setFetchedModels([]); } }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedProvider && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: selectedProvider.color ? `${selectedProvider.color}15` : 'hsl(var(--primary) / 0.1)' }}
                  >
                    <Globe className="w-4 h-4" style={{ color: selectedProvider.color || undefined }} />
                  </div>
                  {selectedProvider.name}
                  {selectedProvider.is_active && <Badge variant="default" className="text-[10px]">Active</Badge>}
                </SheetTitle>
                <SheetDescription>{selectedProvider.description || selectedProvider.type}</SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="models" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="models">🤖 Models ({getModelCount(selectedProvider.slug)})</TabsTrigger>
                  <TabsTrigger value="keys">🔑 Keys ({getKeyCount(selectedProvider.slug)})</TabsTrigger>
                  <TabsTrigger value="config">⚙️ Config</TabsTrigger>
                </TabsList>

                {/* Models Tab */}
                <TabsContent value="models" className="space-y-4">
                  {/* Fetch Controls */}
                  <div className="flex gap-2">
                    <Button onClick={handleFetchModels} disabled={isFetching} className="flex-1">
                      {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Fetch Models
                    </Button>
                    <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                      {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </Button>
                    {fetchedModels.length > 0 && (
                      <Button variant="outline" onClick={handleImportAll}>
                        <Download className="w-4 h-4 mr-1" /> All ({fetchedModels.length})
                      </Button>
                    )}
                  </div>

                  {/* Fetched (new) models */}
                  {fetchedModels.length > 0 && (
                    <div className="rounded-lg border divide-y max-h-60 overflow-auto">
                      {fetchedModels.slice(0, 50).map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-2.5 hover:bg-muted/50 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{model.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{model.id}</p>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {model.context_length && <Badge variant="outline" className="text-[9px] py-0 px-1">{model.context_length >= 1000 ? `${Math.round(model.context_length / 1000)}K` : model.context_length} ctx</Badge>}
                              {model.capabilities?.slice(0, 2).map((c) => <Badge key={c} variant="secondary" className="text-[9px] py-0 px-1">{c}</Badge>)}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => handleImportModel(model)}>
                            <Plus className="w-3 h-3 mr-1" /> Import
                          </Button>
                        </div>
                      ))}
                      {fetchedModels.length > 50 && (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                          +{fetchedModels.length - 50} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing models */}
                  {getProviderModels(selectedProvider.slug).length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Imported Models ({getProviderModels(selectedProvider.slug).length})</p>
                      <div className="rounded-lg border divide-y max-h-64 overflow-auto">
                        {getProviderModels(selectedProvider.slug).map((model) => (
                          <div key={model.id} className="flex items-center justify-between p-2.5 gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium truncate">{model.name}</p>
                                {model.is_default && <Badge className="text-[9px] py-0 px-1">Default</Badge>}
                                <Badge variant={model.is_active ? 'secondary' : 'outline'} className="text-[9px] py-0 px-1">
                                  {model.is_active ? 'Active' : 'Off'}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono truncate">{model.model_id}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteModel.mutate(model.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Chưa có model nào. Click "Fetch Models" để lấy từ provider.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Keys Tab */}
                <TabsContent value="keys" className="space-y-4">
                  <Button onClick={() => { setShowAddKey(true); setNewKey({ name: '', api_key: '', base_url: '' }); }} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Thêm Key
                  </Button>

                  {getProviderKeys(selectedProvider.slug).length > 0 ? (
                    <div className="space-y-2">
                      {getProviderKeys(selectedProvider.slug).map((key: any) => (
                        <Card key={key.id} className={cn(!key.is_active && 'opacity-50')}>
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium">{key.name}</p>
                                {key.is_primary && <Badge className="text-[10px] py-0">Primary</Badge>}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                                  {showKeys[key.id] ? key.api_key : `${key.api_key.substring(0, 8)}...${key.api_key.slice(-4)}`}
                                </code>
                                <button onClick={() => setShowKeys((p) => ({ ...p, [key.id]: !p[key.id] }))} className="text-muted-foreground hover:text-foreground">
                                  {showKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                              <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span>Used: {key.usage_count || 0}</span>
                                {key.error_count > 0 && <span className="text-destructive">Errors: {key.error_count}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Switch checked={key.is_active} onCheckedChange={(c) => handleToggleKeyActive(key.id, c)} />
                              {!key.is_primary && (
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => handleSetPrimary(key.id, key.provider)}>
                                  Primary
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteKey(key.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Chưa có API key cho provider này</p>
                    </div>
                  )}

                  {/* Add Key Dialog */}
                  <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm API Key — {selectedProvider.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <div>
                          <Label className="text-xs">Tên</Label>
                          <Input value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} placeholder="VD: Key Production 1" className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">API Key</Label>
                          <Input type="password" value={newKey.api_key} onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })} placeholder="sk-..." className="h-9 text-sm font-mono" />
                        </div>
                        {(selectedProvider.type === 'openai-compatible' || selectedProvider.type === 'custom') && (
                          <div>
                            <Label className="text-xs">Base URL (override)</Label>
                            <Input value={newKey.base_url} onChange={(e) => setNewKey({ ...newKey, base_url: e.target.value })} placeholder={selectedProvider.base_url || ''} className="h-9 text-sm font-mono" />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddKey(false)}>Hủy</Button>
                        <Button onClick={handleAddKey} disabled={!newKey.name || !newKey.api_key}>Thêm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                {/* Config Tab */}
                <TabsContent value="config" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Input value={selectedProvider.type} readOnly className="h-9 text-sm bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-xs">Slug</Label>
                      <Input value={selectedProvider.slug} readOnly className="h-9 text-sm bg-muted/50 font-mono" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Base URL</Label>
                    <Input value={selectedProvider.base_url || ''} readOnly className="h-9 text-sm font-mono bg-muted/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Models Endpoint</Label>
                      <Input value={selectedProvider.models_endpoint || 'N/A'} readOnly className="h-9 text-sm font-mono bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-xs">Fetch Type</Label>
                      <Input value={selectedProvider.fetch_type} readOnly className="h-9 text-sm bg-muted/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Auth Type</Label>
                      <Input value={selectedProvider.auth_type} readOnly className="h-9 text-sm bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-xs">Auth Header</Label>
                      <Input value={selectedProvider.auth_header || ''} readOnly className="h-9 text-sm font-mono bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-xs">Auth Prefix</Label>
                      <Input value={selectedProvider.auth_prefix || ''} readOnly className="h-9 text-sm bg-muted/50" />
                    </div>
                  </div>
                  {Object.keys(selectedProvider.extra_headers || {}).length > 0 && (
                    <div>
                      <Label className="text-xs">Extra Headers</Label>
                      <pre className="bg-muted/50 rounded p-2 text-[10px] font-mono overflow-auto">
                        {JSON.stringify(selectedProvider.extra_headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="flex gap-3 flex-wrap text-xs">
                    <Badge variant={selectedProvider.supports_streaming ? 'default' : 'outline'}>
                      Streaming: {selectedProvider.supports_streaming ? 'Yes' : 'No'}
                    </Badge>
                    <Badge variant={selectedProvider.supports_tools ? 'default' : 'outline'}>
                      Tools: {selectedProvider.supports_tools ? 'Yes' : 'No'}
                    </Badge>
                    <Badge variant={selectedProvider.is_builtin ? 'default' : 'outline'}>
                      {selectedProvider.is_builtin ? 'Built-in' : 'Custom'}
                    </Badge>
                  </div>
                  {selectedProvider.docs_url && (
                    <a href={selectedProvider.docs_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Documentation
                    </a>
                  )}

                  {/* Delete button for custom providers */}
                  {!selectedProvider.is_builtin && (
                    <div className="pt-4 border-t">
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(selectedProvider.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa Provider
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Provider Dialog */}
      <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm Custom Provider</DialogTitle>
            <DialogDescription>Thêm nhà cung cấp AI mới (OpenAI-compatible hoặc custom)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tên hiển thị *</Label>
                <Input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })} placeholder="VD: LM Studio" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Slug *</Label>
                <Input value={newProvider.slug} onChange={(e) => setNewProvider({ ...newProvider, slug: e.target.value })} placeholder="lm-studio" className="h-9 text-sm font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newProvider.type} onValueChange={(v) => setNewProvider({ ...newProvider, type: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Auth Type</Label>
                <Select value={newProvider.auth_type} onValueChange={(v) => setNewProvider({ ...newProvider, auth_type: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUTH_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Base URL</Label>
              <Input value={newProvider.base_url} onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })} placeholder="https://api.example.com/v1" className="h-9 text-sm font-mono" />
            </div>
            <div>
              <Label className="text-xs">Models Endpoint</Label>
              <Input value={newProvider.models_endpoint} onChange={(e) => setNewProvider({ ...newProvider, models_endpoint: e.target.value })} placeholder="/models" className="h-9 text-sm font-mono" />
            </div>
            <div>
              <Label className="text-xs">Mô tả</Label>
              <Textarea value={newProvider.description} onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })} placeholder="Mô tả ngắn..." className="text-sm min-h-[60px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProvider(false)}>Hủy</Button>
            <Button onClick={handleCreateProvider} disabled={!newProvider.name || !newProvider.slug}>Tạo Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Provider?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này sẽ xóa provider và tất cả cài đặt liên quan. Không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (showDeleteConfirm) deleteProviderMutation.mutate(showDeleteConfirm);
                setShowDeleteConfirm(null);
                setSelectedProvider(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
