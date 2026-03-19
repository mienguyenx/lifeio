import { useState } from 'react';
import { MessageSquare, Edit, Copy, Plus, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIPrompts, useUpdateAIPrompt, useCreateAIPrompt, useDeleteAIPrompt, useAIModels, type AIPrompt } from '@/hooks/useAdminData';
import { toast } from 'sonner';

export default function AdminAIPrompts() {
  const { data: prompts, isLoading } = useAIPrompts();
  const { data: models } = useAIModels();
  const updatePrompt = useUpdateAIPrompt();
  const createPrompt = useCreateAIPrompt();
  const deletePrompt = useDeleteAIPrompt();
  
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    prompt_key: '',
    category: 'general',
    system_prompt: '',
    user_prompt_template: '',
    description: '',
    variables: [] as string[],
    model_id: null as string | null,
  });

  const categories = [...new Set(prompts?.map(p => p.category) || [])];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCreate = () => {
    createPrompt.mutate({
      ...newPrompt,
      is_active: true,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPrompt({ name: '', prompt_key: '', category: 'general', system_prompt: '', user_prompt_template: '', description: '', variables: [], model_id: null });
      }
    });
  };

  const handleSaveEdit = () => {
    if (editingPrompt) {
      updatePrompt.mutate({
        id: editingPrompt.id,
        system_prompt: editingPrompt.system_prompt,
        user_prompt_template: editingPrompt.user_prompt_template,
        description: editingPrompt.description,
        model_id: editingPrompt.model_id,
      }, {
        onSuccess: () => setEditingPrompt(null)
      });
    }
  };

  const handleDelete = (id: string) => {
    deletePrompt.mutate(id);
  };

  const handleToggleActive = (prompt: AIPrompt) => {
    updatePrompt.mutate({ id: prompt.id, is_active: !prompt.is_active });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  const groupedPrompts = prompts?.reduce((acc, prompt) => {
    if (!acc[prompt.category]) acc[prompt.category] = [];
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, AIPrompt[]>) || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Prompts</h1>
          <p className="text-muted-foreground">Manage system prompts for AI features</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Prompt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={newPrompt.name} onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })} placeholder="e.g., Goal Coach" />
                </div>
                <div className="space-y-2">
                  <Label>Key (unique)</Label>
                  <Input value={newPrompt.prompt_key} onChange={(e) => setNewPrompt({ ...newPrompt, prompt_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., goal_coach" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={newPrompt.category} onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })} placeholder="e.g., coach" />
                </div>
                <div className="space-y-2">
                  <Label>AI Model (optional)</Label>
                  <Select value={newPrompt.model_id || 'default'} onValueChange={(v) => setNewPrompt({ ...newPrompt, model_id: v === 'default' ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Use default model" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use default</SelectItem>
                      {models?.filter(m => m.is_active).map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newPrompt.description} onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })} placeholder="Brief description of this prompt" />
              </div>
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea value={newPrompt.system_prompt} onChange={(e) => setNewPrompt({ ...newPrompt, system_prompt: e.target.value })} placeholder="The system prompt that sets the AI's behavior..." className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>User Prompt Template (optional)</Label>
                <Textarea value={newPrompt.user_prompt_template || ''} onChange={(e) => setNewPrompt({ ...newPrompt, user_prompt_template: e.target.value })} placeholder="Template with {{variables}}..." className="min-h-[80px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newPrompt.name || !newPrompt.prompt_key || !newPrompt.system_prompt}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {category}
            <Badge variant="outline">{categoryPrompts.length}</Badge>
          </h2>
          
          <div className="space-y-4">
            {categoryPrompts.map((prompt) => (
              <Card key={prompt.id} className={!prompt.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{prompt.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">{prompt.prompt_key}</Badge>
                      {!prompt.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(prompt.system_prompt)}>
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(prompt)}>
                        {prompt.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setEditingPrompt(prompt)}>
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit: {prompt.name}</DialogTitle>
                          </DialogHeader>
                          {editingPrompt && editingPrompt.id === prompt.id && (
                            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                  value={editingPrompt.description || ''}
                                  onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>AI Model</Label>
                                <Select value={editingPrompt.model_id || 'default'} onValueChange={(v) => setEditingPrompt({ ...editingPrompt, model_id: v === 'default' ? null : v })}>
                                  <SelectTrigger><SelectValue placeholder="Use default model" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Use default</SelectItem>
                                    {models?.filter(m => m.is_active).map(m => (
                                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>System Prompt</Label>
                                <Textarea
                                  value={editingPrompt.system_prompt}
                                  onChange={(e) => setEditingPrompt({ ...editingPrompt, system_prompt: e.target.value })}
                                  className="min-h-[150px] font-mono text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>User Prompt Template</Label>
                                <Textarea
                                  value={editingPrompt.user_prompt_template || ''}
                                  onChange={(e) => setEditingPrompt({ ...editingPrompt, user_prompt_template: e.target.value })}
                                  className="min-h-[100px] font-mono text-sm"
                                />
                              </div>
                              {editingPrompt.variables && editingPrompt.variables.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Variables</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {editingPrompt.variables.map((v) => (
                                      <Badge key={v} variant="outline">{`{{${v}}}`}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingPrompt(null)}>Cancel</Button>
                            <Button onClick={handleSaveEdit}><Save className="w-4 h-4 mr-1" />Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{prompt.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(prompt.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {prompt.description && <CardDescription>{prompt.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm text-muted-foreground max-h-24 overflow-hidden">
                    {prompt.system_prompt.substring(0, 200)}
                    {prompt.system_prompt.length > 200 && '...'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {(!prompts || prompts.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AI prompts configured</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Create First Prompt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}