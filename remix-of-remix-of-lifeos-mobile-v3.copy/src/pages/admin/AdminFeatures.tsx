import { useState } from 'react';
import { Puzzle, Plus, Settings2, Power, Trash2, ExternalLink, Code, Layers, Clock, Brain, Wrench, Bell, Trophy, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePlugins, useUpdatePlugin, useCreatePlugin, useDeletePlugin, type Plugin } from '@/hooks/useAdminData';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition } from '@/components/admin/AdminAnimations';
import { pluginCategories, hookDescriptions, type PluginCategory } from '@/lib/pluginSystem';

const categoryIcons: Record<string, React.ElementType> = {
  productivity: Clock,
  ai: Brain,
  utilities: Wrench,
  notifications: Bell,
  gamification: Trophy,
  integration: Plug,
  general: Puzzle,
};

export default function AdminFeatures() {
  const { data: plugins, isLoading } = usePlugins();
  const updatePlugin = useUpdatePlugin();
  const createPlugin = useCreatePlugin();
  const deletePlugin = useDeletePlugin();

  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlugin, setNewPlugin] = useState({
    name: '',
    slug: '',
    description: '',
    author: '',
    category: 'general',
    hooks: [] as string[],
  });

  const handleToggle = (plugin: Plugin) => {
    updatePlugin.mutate({ id: plugin.id, is_active: !plugin.is_active });
  };

  const handleCreate = () => {
    createPlugin.mutate(newPlugin, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPlugin({ name: '', slug: '', description: '', author: '', category: 'general', hooks: [] });
      }
    });
  };

  const handleDelete = (id: string) => {
    deletePlugin.mutate(id);
  };

  const categories = [...new Set(plugins?.map(p => p.category) || [])];
  const activeCount = plugins?.filter(p => p.is_active).length || 0;
  const systemCount = plugins?.filter(p => p.is_system).length || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="Plugins & Features"
        description={`Manage extensible features and plugins (${activeCount} active, ${systemCount} system)`}
        icon={Puzzle}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Plugin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Plugin</DialogTitle>
                <DialogDescription>Add a new plugin to extend app functionality</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plugin Name</Label>
                    <Input value={newPlugin.name} onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })} placeholder="e.g., My Plugin" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (unique)</Label>
                    <Input value={newPlugin.slug} onChange={(e) => setNewPlugin({ ...newPlugin, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="e.g., my-plugin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newPlugin.description} onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })} placeholder="What does this plugin do?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input value={newPlugin.author} onChange={(e) => setNewPlugin({ ...newPlugin, author: e.target.value })} placeholder="e.g., Your Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={newPlugin.category}
                      onChange={(e) => setNewPlugin({ ...newPlugin, category: e.target.value })}
                    >
                      {Object.entries(pluginCategories).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newPlugin.name || !newPlugin.slug}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{plugins?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Plugins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Power className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{systemCount}</p>
              <p className="text-xs text-muted-foreground">System</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">{cat}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins?.map((plugin) => (
              <PluginCard 
                key={plugin.id} 
                plugin={plugin} 
                onToggle={handleToggle} 
                onSelect={setSelectedPlugin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </TabsContent>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins?.filter(p => p.category === cat).map((plugin) => (
                <PluginCard 
                  key={plugin.id} 
                  plugin={plugin} 
                  onToggle={handleToggle}
                  onSelect={setSelectedPlugin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Plugin Detail Dialog */}
      <Dialog open={!!selectedPlugin} onOpenChange={(open) => !open && setSelectedPlugin(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPlugin && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Puzzle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedPlugin.name}
                      {selectedPlugin.is_system && <Badge variant="secondary">System</Badge>}
                    </DialogTitle>
                    <DialogDescription>v{selectedPlugin.version} by {selectedPlugin.author || 'Unknown'}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPlugin.description || 'No description available'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Hooks</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.hooks?.map(hook => (
                      <Badge key={hook} variant="outline" className="font-mono text-xs">
                        {hook}
                      </Badge>
                    ))}
                    {(!selectedPlugin.hooks || selectedPlugin.hooks.length === 0) && (
                      <span className="text-sm text-muted-foreground">No hooks registered</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Entry Points</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.admin_page && <Badge>Admin Page</Badge>}
                    {selectedPlugin.sidebar_item && <Badge>Sidebar Item</Badge>}
                    {selectedPlugin.dashboard_widget && <Badge>Dashboard Widget</Badge>}
                    {!selectedPlugin.admin_page && !selectedPlugin.sidebar_item && !selectedPlugin.dashboard_widget && (
                      <span className="text-sm text-muted-foreground">No UI entry points</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedPlugin.default_config || {}, null, 2)}
                  </pre>
                </div>
              </div>
              <DialogFooter>
                {selectedPlugin.documentation_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedPlugin.documentation_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />Documentation
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedPlugin(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hook Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Hooks</CardTitle>
          <CardDescription>Extension points for plugin development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(hookDescriptions).map(([hook, description]) => (
              <div key={hook} className="p-3 border rounded-lg">
                <code className="text-xs font-mono text-primary">{hook}</code>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

function PluginCard({ 
  plugin, 
  onToggle, 
  onSelect,
  onDelete 
}: { 
  plugin: Plugin; 
  onToggle: (plugin: Plugin) => void;
  onSelect: (plugin: Plugin) => void;
  onDelete: (id: string) => void;
}) {
  const CategoryIcon = categoryIcons[plugin.category] || Puzzle;

  return (
    <Card className={`relative transition-all ${plugin.is_active ? 'border-primary/50' : 'opacity-75'}`}>
      {plugin.is_system && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">System</Badge>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CategoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{plugin.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {plugin.description || 'No description'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs capitalize">{plugin.category}</Badge>
              <span className="text-xs text-muted-foreground">v{plugin.version}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch 
              checked={plugin.is_active} 
              onCheckedChange={() => onToggle(plugin)}
              disabled={plugin.is_system}
            />
            <span className="text-sm text-muted-foreground">
              {plugin.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onSelect(plugin)}>
              <Settings2 className="w-4 h-4" />
            </Button>
            {!plugin.is_system && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Plugin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{plugin.name}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(plugin.id)} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}