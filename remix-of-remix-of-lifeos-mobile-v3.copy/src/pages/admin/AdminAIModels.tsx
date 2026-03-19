import { useState } from 'react';
import { Bot, Plus, Settings2, Sparkles, Trash2, Play, Loader2, Cpu, Zap, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIModels, useUpdateAIModel, useCreateAIModel, useDeleteAIModel, type AIModel } from '@/hooks/useAdminData';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';

const COMMON_CAPABILITIES = [
  'chat', 'completion', 'embedding', 'image-understanding', 'code-generation',
  'translation', 'summarization', 'reasoning', 'creative-writing', 'analysis'
];

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  lovable: Sparkles,
  openai: Brain,
  google: Zap,
  default: Cpu,
};

export default function AdminAIModels() {
  const { data: models, isLoading } = useAIModels();
  const updateModel = useUpdateAIModel();
  const createModel = useCreateAIModel();
  const deleteModel = useDeleteAIModel();
  
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('Hello, can you briefly introduce yourself?');
  const [testResponse, setTestResponse] = useState('');
  const [newModel, setNewModel] = useState({
    name: '',
    model_id: '',
    provider: 'lovable',
    description: '',
    max_tokens: 4096,
    temperature: 0.7,
    capabilities: [] as string[],
  });

  const handleToggleActive = (model: AIModel) => {
    updateModel.mutate({ id: model.id, is_active: !model.is_active });
  };

  const handleSetDefault = (model: AIModel) => {
    updateModel.mutate({ id: model.id, is_default: true });
  };

  const handleCreate = () => {
    createModel.mutate({
      ...newModel,
      is_active: true,
      is_default: false,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewModel({ name: '', model_id: '', provider: 'lovable', description: '', max_tokens: 4096, temperature: 0.7, capabilities: [] });
      }
    });
  };

  const handleSaveEdit = () => {
    if (editingModel) {
      updateModel.mutate({
        id: editingModel.id,
        max_tokens: editingModel.max_tokens,
        temperature: editingModel.temperature,
        description: editingModel.description,
        capabilities: editingModel.capabilities,
      }, {
        onSuccess: () => setEditingModel(null)
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteModel.mutate(id);
  };

  const toggleCapability = (cap: string, isEdit: boolean = false) => {
    if (isEdit && editingModel) {
      const caps = editingModel.capabilities || [];
      const newCaps = caps.includes(cap) ? caps.filter(c => c !== cap) : [...caps, cap];
      setEditingModel({ ...editingModel, capabilities: newCaps });
    } else {
      const caps = newModel.capabilities;
      const newCaps = caps.includes(cap) ? caps.filter(c => c !== cap) : [...caps, cap];
      setNewModel({ ...newModel, capabilities: newCaps });
    }
  };

  const handleTestModel = async (model: AIModel) => {
    setTestingModelId(model.id);
    setTestResponse('');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          messages: [{ role: 'user', content: testPrompt }],
          model: model.model_id,
        }
      });

      if (error) throw error;
      setTestResponse(data?.response || data?.message || 'No response received');
      toast.success('Model test successful');
    } catch (err: any) {
      setTestResponse(`Error: ${err.message || 'Failed to test model'}`);
      toast.error('Model test failed');
    } finally {
      setTestingModelId(null);
    }
  };

  const activeModels = models?.filter(m => m.is_active) || [];
  const inactiveModels = models?.filter(m => !m.is_active) || [];
  const defaultModel = models?.find(m => m.is_default);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Models</h1>
          <p className="text-muted-foreground">Configure available AI models for the app</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Model</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New AI Model</DialogTitle>
              <DialogDescription>Configure a new AI model for the application</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input value={newModel.name} onChange={(e) => setNewModel({ ...newModel, name: e.target.value })} placeholder="e.g., GPT-5 Mini" />
                </div>
                <div className="space-y-2">
                  <Label>Model ID</Label>
                  <Input value={newModel.model_id} onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })} placeholder="e.g., openai/gpt-5-mini" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input value={newModel.provider} onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })} placeholder="e.g., lovable" />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens: {newModel.max_tokens}</Label>
                  <Slider
                    value={[newModel.max_tokens]}
                    onValueChange={([v]) => setNewModel({ ...newModel, max_tokens: v })}
                    min={256}
                    max={32768}
                    step={256}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Temperature: {newModel.temperature}</Label>
                <Slider
                  value={[newModel.temperature * 100]}
                  onValueChange={([v]) => setNewModel({ ...newModel, temperature: v / 100 })}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newModel.description} onChange={(e) => setNewModel({ ...newModel, description: e.target.value })} placeholder="Model description..." />
              </div>
              <div className="space-y-2">
                <Label>Capabilities</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CAPABILITIES.map(cap => (
                    <Badge
                      key={cap}
                      variant={newModel.capabilities.includes(cap) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleCapability(cap)}
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newModel.name || !newModel.model_id}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{models?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Models</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeModels.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold truncate text-sm">{defaultModel?.name || 'None'}</p>
              <p className="text-xs text-muted-foreground">Default</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{[...new Set(models?.map(m => m.provider))].length}</p>
              <p className="text-xs text-muted-foreground">Providers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeModels.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveModels.length})</TabsTrigger>
          <TabsTrigger value="test">Test Model</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onToggle={handleToggleActive}
                onSetDefault={handleSetDefault}
                onEdit={setEditingModel}
                onDelete={handleDelete}
              />
            ))}
            {activeModels.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-8">No active models</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onToggle={handleToggleActive}
                onSetDefault={handleSetDefault}
                onEdit={setEditingModel}
                onDelete={handleDelete}
              />
            ))}
            {inactiveModels.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-8">No inactive models</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test AI Model</CardTitle>
              <CardDescription>Send a test prompt to verify model connectivity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Prompt</Label>
                <Textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter a test prompt..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {activeModels.map(model => (
                  <Button
                    key={model.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestModel(model)}
                    disabled={testingModelId === model.id}
                  >
                    {testingModelId === model.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Test {model.name}
                  </Button>
                ))}
              </div>
              {testResponse && (
                <div className="space-y-2">
                  <Label>Response</Label>
                  <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                    {testResponse}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {editingModel?.name}</DialogTitle>
          </DialogHeader>
          {editingModel && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Tokens: {editingModel.max_tokens}</Label>
                  <Slider
                    value={[editingModel.max_tokens]}
                    onValueChange={([v]) => setEditingModel({ ...editingModel, max_tokens: v })}
                    min={256}
                    max={32768}
                    step={256}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperature: {editingModel.temperature}</Label>
                  <Slider
                    value={[editingModel.temperature * 100]}
                    onValueChange={([v]) => setEditingModel({ ...editingModel, temperature: v / 100 })}
                    min={0}
                    max={200}
                    step={5}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingModel.description || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capabilities</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CAPABILITIES.map(cap => (
                    <Badge
                      key={cap}
                      variant={(editingModel.capabilities || []).includes(cap) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleCapability(cap, true)}
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModel(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(!models || models.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AI models configured</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Add First Model
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ModelCard({ 
  model, 
  onToggle, 
  onSetDefault, 
  onEdit,
  onDelete 
}: { 
  model: AIModel; 
  onToggle: (model: AIModel) => void;
  onSetDefault: (model: AIModel) => void;
  onEdit: (model: AIModel) => void;
  onDelete: (id: string) => void;
}) {
  const ProviderIcon = PROVIDER_ICONS[model.provider] || PROVIDER_ICONS.default;

  return (
    <Card className={model.is_default ? 'border-primary' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ProviderIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{model.name}</h3>
                {model.is_default && <Badge variant="default"><Sparkles className="w-3 h-3 mr-1" />Default</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{model.provider}</p>
              <p className="text-xs text-muted-foreground font-mono">{model.model_id}</p>
              {model.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{model.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={model.is_active ? 'default' : 'secondary'}>
                  {model.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {model.capabilities?.slice(0, 3).map((cap) => (
                  <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                ))}
                {(model.capabilities?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">+{model.capabilities.length - 3}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Switch checked={model.is_active} onCheckedChange={() => onToggle(model)} />
            <div className="flex gap-1">
              {!model.is_default && model.is_active && (
                <Button variant="ghost" size="sm" onClick={() => onSetDefault(model)}>Set Default</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onEdit(model)}>
                <Settings2 className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Model?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{model.name}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(model.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}