import { useState } from 'react';
import { Plus, Edit, Trash2, Sparkles, Loader2, Copy, Eye, Target, Repeat, BookOpen, ClipboardList, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAdminTemplates, useUpdateTemplate, useDeleteTemplate, useCreateTemplate, useGenerateTemplatesWithAI, type AdminTemplate } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface AdminTemplatesPageProps {
  type: 'goals' | 'habits' | 'tasks' | 'journal' | 'review';
}

const typeConfig = {
  goals: {
    title: 'Goal Templates',
    icon: Target,
    description: 'Templates for setting and achieving goals',
    contentFields: ['title', 'description', 'area', 'milestones', 'suggested_duration_days', 'priority', 'tips'],
  },
  habits: {
    title: 'Habit Templates', 
    icon: Repeat,
    description: 'Templates for building positive habits',
    contentFields: ['name', 'description', 'area', 'frequency', 'target_per_day', 'target_unit', 'suggested_time', 'difficulty', 'benefits', 'tips'],
  },
  tasks: {
    title: 'Task Templates',
    icon: CheckSquare,
    description: 'Templates for creating tasks',
    contentFields: ['title', 'description', 'area', 'priority', 'estimatedPomodoros', 'dueDate', 'goalId'],
  },
  journal: {
    title: 'Journal Templates',
    icon: BookOpen,
    description: 'Templates for daily journaling and reflection',
    contentFields: ['title', 'description', 'prompts', 'mood_tracking', 'gratitude_section', 'suggested_areas', 'best_for'],
  },
  review: {
    title: 'Review Templates',
    icon: ClipboardList,
    description: 'Templates for weekly review and planning',
    contentFields: ['title', 'description', 'sections', 'rating_scale', 'focus_areas', 'estimated_time_minutes'],
  },
};

export default function AdminTemplatesPage({ type }: AdminTemplatesPageProps) {
  const config = typeConfig[type];
  
  const { data: templates = [], isLoading } = useAdminTemplates(type);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createTemplate = useCreateTemplate();
  const generateTemplates = useGenerateTemplatesWithAI();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<AdminTemplate | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [generatedTemplates, setGeneratedTemplates] = useState<any[]>([]);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: {} as Record<string, unknown>,
  });

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-red-500">Invalid template type: {type}</div>
      </div>
    );
  }
  
  const Icon = config.icon;

  const handleToggle = (id: string, isActive: boolean) => {
    updateTemplate.mutate({ id, is_active: !isActive });
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id);
  };

  const handleCreate = () => {
    if (!newTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    createTemplate.mutate({
      name: newTemplate.name,
      type,
      description: newTemplate.description,
      content: newTemplate.content as Json,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewTemplate({ name: '', description: '', content: {} });
      }
    });
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    updateTemplate.mutate({
      id: editingTemplate.id,
      name: editingTemplate.name,
      description: editingTemplate.description,
      content: editingTemplate.content,
    }, {
      onSuccess: () => setEditingTemplate(null)
    });
  };

  const handleGenerateAI = async () => {
    const result = await generateTemplates.mutateAsync({ 
      type, 
      prompt: aiPrompt,
      category: aiCategory 
    });
    if (result?.templates) {
      setGeneratedTemplates(result.templates);
      toast.success(`Generated ${result.templates.length} templates`);
    }
  };

  const handleAddGeneratedTemplate = (template: any) => {
    const name = template.title || template.name || 'Untitled Template';
    createTemplate.mutate({
      name,
      type,
      description: template.description || '',
      content: template as Json,
    }, {
      onSuccess: () => {
        setGeneratedTemplates(prev => prev.filter(t => t !== template));
        toast.success(`Added "${name}" template`);
      }
    });
  };

  const handleAddAllGenerated = () => {
    generatedTemplates.forEach(template => {
      const name = template.title || template.name || 'Untitled Template';
      createTemplate.mutate({
        name,
        type,
        description: template.description || '',
        content: template as Json,
      });
    });
    setGeneratedTemplates([]);
    setIsAIOpen(false);
    toast.success('Added all templates');
  };

  const formatContentPreview = (content: any) => {
    if (!content) return 'No content';
    if (typeof content === 'string') return content.slice(0, 100);
    const keys = Object.keys(content);
    return keys.slice(0, 3).map(k => `${k}: ${JSON.stringify(content[k]).slice(0, 30)}...`).join(', ');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Template Generator
                </DialogTitle>
                <DialogDescription>
                  Generate {type} templates using AI. Customize with prompts or categories.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category (optional)</Label>
                    <Input 
                      placeholder={`e.g., ${type === 'goals' ? 'fitness, career' : type === 'habits' ? 'morning routine' : 'self-reflection'}`}
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Prompt (optional)</Label>
                    <Input 
                      placeholder="Additional instructions for AI..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerateAI} 
                  disabled={generateTemplates.isPending}
                  className="w-full"
                >
                  {generateTemplates.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Templates
                    </>
                  )}
                </Button>
                
                {generatedTemplates.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Generated Templates ({generatedTemplates.length})</Label>
                      <Button variant="outline" size="sm" onClick={handleAddAllGenerated}>
                        <Plus className="w-4 h-4 mr-1" /> Add All
                      </Button>
                    </div>
                    <ScrollArea className="h-64 border rounded-lg p-3">
                      <div className="space-y-3">
                        {generatedTemplates.map((template, idx) => (
                          <Card key={idx} className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <h4 className="font-medium">{template.title || template.name}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {template.description}
                                </p>
                                {template.area && (
                                  <Badge variant="secondary" className="text-xs">{template.area}</Badge>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleAddGeneratedTemplate(template)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New {config.title.replace('s', '')}</DialogTitle>
                <DialogDescription>
                  Add a new template that users can use as a starting point.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input 
                    placeholder="Enter template name..."
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe what this template is for..."
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content (JSON)</Label>
                  <Textarea 
                    placeholder={`{\n  "title": "Example",\n  "description": "..."\n}`}
                    className="font-mono text-sm min-h-[200px]"
                    value={JSON.stringify(newTemplate.content, null, 2)}
                    onChange={(e) => {
                      try {
                        setNewTemplate({ ...newTemplate, content: JSON.parse(e.target.value) });
                      } catch {
                        // Allow invalid JSON while typing
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected fields: {config.contentFields.join(', ')}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {template.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.usage_count} uses</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={template.is_active} 
                          onCheckedChange={() => handleToggle(template.id, template.is_active)} 
                          disabled={updateTemplate.isPending} 
                        />
                        <span className="text-sm text-muted-foreground">
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setViewingTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{template.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(template.id)} 
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates found for {type}</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => setIsAIOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />Generate with AI
                </Button>
                <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />Create Manually
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Template Dialog */}
      <Dialog open={!!viewingTemplate} onOpenChange={(open) => !open && setViewingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingTemplate?.name}</DialogTitle>
            <DialogDescription>{viewingTemplate?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh]">
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(viewingTemplate?.content, null, 2)}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingTemplate(null)}>Close</Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(viewingTemplate?.content, null, 2));
              toast.success('Copied to clipboard');
            }}>
              <Copy className="w-4 h-4 mr-2" /> Copy JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template details and content.</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input 
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content (JSON)</Label>
                <Textarea 
                  className="font-mono text-sm min-h-[200px]"
                  value={JSON.stringify(editingTemplate.content, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingTemplate({ ...editingTemplate, content: JSON.parse(e.target.value) });
                    } catch {
                      // Allow invalid JSON while typing
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}