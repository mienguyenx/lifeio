import { useState } from 'react';
import { Flag, Plus, Trash2, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeatureFlags, useUpdateFeatureFlag, useCreateFeatureFlag, useDeleteFeatureFlag } from '@/hooks/useAdminData';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PageTransition } from '@/components/admin/AdminAnimations';

const ENVIRONMENTS = [
  { value: 'all', label: 'All Environments', color: 'bg-blue-500' },
  { value: 'development', label: 'Development', color: 'bg-yellow-500' },
  { value: 'production', label: 'Production', color: 'bg-green-500' },
];

export default function AdminFlags() {
  const { data: flags, isLoading } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();
  const createFlag = useCreateFeatureFlag();
  const deleteFlag = useDeleteFeatureFlag();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    enabled: false,
    environment: 'all',
  });

  const handleToggle = (id: string, currentEnabled: boolean) => {
    updateFlag.mutate({ id, enabled: !currentEnabled });
  };

  const handleCreate = () => {
    createFlag.mutate(newFlag, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewFlag({ name: '', description: '', enabled: false, environment: 'all' });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteFlag.mutate(id);
  };

  const filteredFlags = flags?.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnv === 'all' || flag.environment === filterEnv || flag.environment === 'all';
    return matchesSearch && matchesEnv;
  }) || [];

  const enabledCount = flags?.filter(f => f.enabled).length || 0;
  const disabledCount = flags?.filter(f => !f.enabled).length || 0;

  const getEnvColor = (env: string) => {
    return ENVIRONMENTS.find(e => e.value === env)?.color || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="Feature Flags"
        description="Toggle features on or off in real-time"
        icon={Flag}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Flag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>Add a new feature flag to control app behavior</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Flag Name</Label>
                  <Input 
                    value={newFlag.name} 
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                    placeholder="e.g., enable_new_dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newFlag.description} 
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                    placeholder="What does this flag control?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select value={newFlag.environment} onValueChange={(v) => setNewFlag({ ...newFlag, environment: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENVIRONMENTS.map(env => (
                          <SelectItem key={env.value} value={env.value}>{env.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial State</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={newFlag.enabled} onCheckedChange={(c) => setNewFlag({ ...newFlag, enabled: c })} />
                      <span className="text-sm">{newFlag.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newFlag.name}>Create</Button>
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
              <Flag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{flags?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Flags</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Flag className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enabledCount}</p>
              <p className="text-xs text-muted-foreground">Enabled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{disabledCount}</p>
              <p className="text-xs text-muted-foreground">Disabled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{[...new Set(flags?.map(f => f.environment))].length}</p>
              <p className="text-xs text-muted-foreground">Environments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search flags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterEnv} onValueChange={setFilterEnv}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            {ENVIRONMENTS.map(env => (
              <SelectItem key={env.value} value={env.value}>{env.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Flags Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredFlags.length})</TabsTrigger>
          <TabsTrigger value="enabled">Enabled ({filteredFlags.filter(f => f.enabled).length})</TabsTrigger>
          <TabsTrigger value="disabled">Disabled ({filteredFlags.filter(f => !f.enabled).length})</TabsTrigger>
        </TabsList>

        {['all', 'enabled', 'disabled'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {filteredFlags
                  .filter(f => tab === 'all' || (tab === 'enabled' ? f.enabled : !f.enabled))
                  .length > 0 ? (
                  <div className="divide-y">
                    {filteredFlags
                      .filter(f => tab === 'all' || (tab === 'enabled' ? f.enabled : !f.enabled))
                      .map((flag) => (
                        <div 
                          key={flag.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${flag.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Label className="font-medium font-mono">{flag.name}</Label>
                                <Badge variant="outline" className="text-xs">
                                  <span className={`w-2 h-2 rounded-full ${getEnvColor(flag.environment)} mr-1`} />
                                  {flag.environment}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {flag.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={() => handleToggle(flag.id, flag.enabled)}
                              disabled={updateFlag.isPending}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Flag?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{flag.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(flag.id)} className="bg-destructive text-destructive-foreground">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No flags found</p>
                    {tab === 'all' && (
                      <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />Create First Flag
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </PageTransition>
  );
}