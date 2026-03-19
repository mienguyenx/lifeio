import { useState } from 'react';
import { Check, X, Plus, Edit, CreditCard, Users, Eye, EyeOff, UserPlus, Shield, Settings2, Gauge, Sparkles, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useSubscriptionPlans, useUpdateSubscriptionPlan, useCreateSubscriptionPlan, useUserSubscriptions, useAllProfiles, type SubscriptionPlan } from '@/hooks/useAdminData';

// Predefined limit keys with labels
const LIMIT_DEFINITIONS = [
  { key: 'max_goals', label: 'Max Goals', description: 'Maximum number of goals user can create' },
  { key: 'max_tasks', label: 'Max Tasks', description: 'Maximum number of tasks user can create' },
  { key: 'max_habits', label: 'Max Habits', description: 'Maximum number of habits user can track' },
  { key: 'max_notes', label: 'Max Notes', description: 'Maximum number of notes user can create' },
  { key: 'ai_requests_per_month', label: 'AI Requests/Month', description: 'Monthly AI assistant requests limit' },
  { key: 'storage_mb', label: 'Storage (MB)', description: 'Storage space for attachments' },
  { key: 'max_workspaces', label: 'Max Workspaces', description: 'Number of workspaces user can own' },
  { key: 'max_workspace_members', label: 'Max Workspace Members', description: 'Members per workspace' },
];

// Predefined feature flags
const FEATURE_DEFINITIONS = [
  { key: 'has_ai_coach', label: 'AI Coach', description: 'Access to AI coaching assistant' },
  { key: 'has_analytics', label: 'Analytics', description: 'Access to advanced analytics & reports' },
  { key: 'has_export', label: 'Data Export', description: 'Export data to PDF/CSV' },
  { key: 'has_integrations', label: 'Integrations', description: 'Third-party integrations' },
  { key: 'has_priority_support', label: 'Priority Support', description: 'Priority customer support' },
  { key: 'has_custom_themes', label: 'Custom Themes', description: 'Access to custom themes' },
  { key: 'has_collaboration', label: 'Collaboration', description: 'Goal collaboration features' },
  { key: 'has_api_access', label: 'API Access', description: 'Access to developer API' },
];

export default function AdminPlans() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: subscriptions } = useUserSubscriptions();
  const { data: profiles } = useAllProfiles();
  const updatePlan = useUpdateSubscriptionPlan();
  const createPlan = useCreateSubscriptionPlan();
  
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'hidden'>('public');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newLimitKey, setNewLimitKey] = useState('');
  const [newLimitValue, setNewLimitValue] = useState(0);
  
  const [newPlan, setNewPlan] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing_period: 'monthly',
    features: [] as string[],
    limits: {} as Record<string, number>,
    sort_order: 0,
    is_hidden: false,
  });
  const [newFeature, setNewFeature] = useState('');
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editingFeatureText, setEditingFeatureText] = useState('');

  const publicPlans = plans?.filter(p => !p.is_hidden) || [];
  const hiddenPlans = plans?.filter(p => p.is_hidden) || [];

  const getSubscriberCount = (planId: string) => {
    return subscriptions?.filter(s => s.plan_id === planId && s.status === 'active').length || 0;
  };

  const getUserById = (userId: string) => {
    return profiles?.find(p => p.id === userId);
  };

  const getAllowedUsers = (plan: SubscriptionPlan) => {
    return (plan.allowed_user_ids || []).map(id => getUserById(id)).filter(Boolean);
  };

  const filteredProfiles = profiles?.filter(p => 
    !userSearchQuery || 
    p.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  ) || [];

  const handleToggleActive = (plan: SubscriptionPlan) => {
    updatePlan.mutate({ id: plan.id, is_active: !plan.is_active });
  };

  const handleSetDefault = (plan: SubscriptionPlan) => {
    updatePlan.mutate({ id: plan.id, is_default: true });
  };

  const handleAddUserToPlan = (plan: SubscriptionPlan, userId: string) => {
    const currentAllowed = plan.allowed_user_ids || [];
    if (!currentAllowed.includes(userId)) {
      updatePlan.mutate({ 
        id: plan.id, 
        allowed_user_ids: [...currentAllowed, userId] 
      });
    }
  };

  const handleRemoveUserFromPlan = (plan: SubscriptionPlan, userId: string) => {
    const currentAllowed = plan.allowed_user_ids || [];
    updatePlan.mutate({ 
      id: plan.id, 
      allowed_user_ids: currentAllowed.filter(id => id !== userId) 
    });
  };

  // Feature management for new plan
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setNewPlan({ ...newPlan, features: [...newPlan.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setNewPlan({ ...newPlan, features: newPlan.features.filter((_, i) => i !== index) });
  };

  // Limit management for editing plan
  const handleUpdateLimit = (key: string, value: number) => {
    if (editingPlan) {
      const newLimits = { ...editingPlan.limits, [key]: value };
      setEditingPlan({ ...editingPlan, limits: newLimits });
    }
  };

  const handleRemoveLimit = (key: string) => {
    if (editingPlan) {
      const newLimits = { ...editingPlan.limits };
      delete newLimits[key];
      setEditingPlan({ ...editingPlan, limits: newLimits });
    }
  };

  const handleAddLimit = () => {
    if (editingPlan && newLimitKey) {
      const newLimits = { ...editingPlan.limits, [newLimitKey]: newLimitValue };
      setEditingPlan({ ...editingPlan, limits: newLimits });
      setNewLimitKey('');
      setNewLimitValue(0);
    }
  };

  // Feature text management for editing plan
  const handleAddEditingFeature = (feature: string) => {
    if (editingPlan && feature.trim()) {
      setEditingPlan({ 
        ...editingPlan, 
        features: [...(editingPlan.features as string[]), feature.trim()] 
      });
    }
  };

  const handleRemoveEditingFeature = (index: number) => {
    if (editingPlan) {
      setEditingPlan({ 
        ...editingPlan, 
        features: (editingPlan.features as string[]).filter((_, i) => i !== index) 
      });
    }
  };

  const handleUpdateEditingFeature = (index: number, text: string) => {
    if (editingPlan) {
      const newFeatures = [...(editingPlan.features as string[])];
      newFeatures[index] = text;
      setEditingPlan({ ...editingPlan, features: newFeatures });
    }
  };

  // Limit management for new plan
  const handleNewPlanUpdateLimit = (key: string, value: number) => {
    setNewPlan({ ...newPlan, limits: { ...newPlan.limits, [key]: value } });
  };

  const handleNewPlanRemoveLimit = (key: string) => {
    const newLimits = { ...newPlan.limits };
    delete newLimits[key];
    setNewPlan({ ...newPlan, limits: newLimits });
  };

  const handleCreate = () => {
    createPlan.mutate({
      ...newPlan,
      is_active: true,
      is_default: false,
      allowed_user_ids: [],
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPlan({ name: '', slug: '', description: '', price: 0, currency: 'USD', billing_period: 'monthly', features: [], limits: {}, sort_order: 0, is_hidden: false });
      }
    });
  };

  const handleSaveEdit = () => {
    if (editingPlan) {
      updatePlan.mutate({
        id: editingPlan.id,
        name: editingPlan.name,
        description: editingPlan.description,
        price: editingPlan.price,
        features: editingPlan.features,
        limits: editingPlan.limits,
        is_hidden: editingPlan.is_hidden,
        is_active: editingPlan.is_active,
      }, {
        onSuccess: () => setEditingPlan(null)
      });
    }
  };

  const getLimitLabel = (key: string) => {
    return LIMIT_DEFINITIONS.find(l => l.key === key)?.label || key;
  };

  const getLimitCount = (plan: SubscriptionPlan) => {
    return Object.keys(plan.limits || {}).length;
  };

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <Card key={plan.id} className={`relative ${plan.is_default ? 'border-primary border-2' : ''} ${!plan.is_active ? 'opacity-60' : ''}`}>
      {plan.is_default && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>Popular</Badge>
        </div>
      )}
      {plan.is_hidden && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="gap-1">
            <EyeOff className="w-3 h-3" /> Hidden
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {plan.is_hidden ? <Shield className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            {plan.name}
          </CardTitle>
          <Switch checked={plan.is_active} onCheckedChange={() => handleToggleActive(plan)} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${plan.price}</span>
          <span className="text-sm text-muted-foreground">/{plan.billing_period}</span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {getSubscriberCount(plan.id)} subscribers
          </div>
          {getLimitCount(plan) > 0 && (
            <div className="flex items-center gap-1">
              <Gauge className="w-4 h-4" />
              {getLimitCount(plan)} limits
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {(plan.features as string[]).slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span className="truncate">{feature}</span>
            </div>
          ))}
          {(plan.features as string[]).length > 3 && (
            <div className="text-sm text-muted-foreground">
              +{(plan.features as string[]).length - 3} more features
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          {!plan.is_default && plan.is_active && !plan.is_hidden && (
            <Button variant="outline" size="sm" onClick={() => handleSetDefault(plan)} className="flex-1">
              Set Default
            </Button>
          )}
          <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setEditingPlan({...plan})} className="flex-1">
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh]" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {plan.is_hidden && <Shield className="w-5 h-5" />}
                  Edit: {plan.name}
                </DialogTitle>
              </DialogHeader>
              {editingPlan && editingPlan.id === plan.id && (
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="limits">Limits</TabsTrigger>
                    <TabsTrigger value="visibility">Visibility</TabsTrigger>
                    <TabsTrigger value="users" disabled={!editingPlan.is_hidden}>Users</TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className="h-[50vh] mt-4">
                    <TabsContent value="general" className="space-y-4 py-4 px-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input type="number" step="0.01" value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={editingPlan.description || ''} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Billing Period</Label>
                          <Select value={editingPlan.billing_period} onValueChange={(v) => setEditingPlan({ ...editingPlan, billing_period: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="lifetime">Lifetime</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Sort Order</Label>
                          <Input type="number" value={editingPlan.sort_order} onChange={(e) => setEditingPlan({ ...editingPlan, sort_order: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="features" className="space-y-4 py-4 px-1">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Feature Descriptions
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            These are displayed to users on the pricing page
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add feature description..." 
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddEditingFeature(newFeature);
                                setNewFeature('');
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              handleAddEditingFeature(newFeature);
                              setNewFeature('');
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {(editingPlan.features as string[]).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                              <Check className="w-4 h-4 text-green-500 shrink-0" />
                              {editingFeatureIndex === i ? (
                                <Input 
                                  value={editingFeatureText}
                                  onChange={(e) => setEditingFeatureText(e.target.value)}
                                  onBlur={() => {
                                    handleUpdateEditingFeature(i, editingFeatureText);
                                    setEditingFeatureIndex(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateEditingFeature(i, editingFeatureText);
                                      setEditingFeatureIndex(null);
                                    }
                                  }}
                                  autoFocus
                                  className="flex-1"
                                />
                              ) : (
                                <span 
                                  className="flex-1 cursor-pointer hover:text-primary"
                                  onClick={() => {
                                    setEditingFeatureIndex(i);
                                    setEditingFeatureText(feature);
                                  }}
                                >
                                  {feature}
                                </span>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveEditingFeature(i)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          {(editingPlan.features as string[]).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              No features added yet
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="limits" className="space-y-4 py-4 px-1">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-semibold flex items-center gap-2">
                            <Gauge className="w-4 h-4" />
                            Usage Limits
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Set limits for various features. Use -1 for unlimited.
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          {LIMIT_DEFINITIONS.map(limitDef => {
                            const currentValue = editingPlan.limits?.[limitDef.key];
                            const isSet = currentValue !== undefined;
                            
                            return (
                              <div key={limitDef.key} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{limitDef.label}</div>
                                  <div className="text-xs text-muted-foreground">{limitDef.description}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSet ? (
                                    <>
                                      <Input 
                                        type="number"
                                        className="w-24"
                                        value={currentValue}
                                        onChange={(e) => handleUpdateLimit(limitDef.key, parseInt(e.target.value) || 0)}
                                      />
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleRemoveLimit(limitDef.key)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUpdateLimit(limitDef.key, 0)}
                                    >
                                      <Plus className="w-4 h-4 mr-1" /> Set Limit
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Custom Limit</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="limit_key"
                              value={newLimitKey}
                              onChange={(e) => setNewLimitKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                              className="flex-1"
                            />
                            <Input 
                              type="number"
                              placeholder="Value"
                              value={newLimitValue}
                              onChange={(e) => setNewLimitValue(parseInt(e.target.value) || 0)}
                              className="w-24"
                            />
                            <Button variant="outline" onClick={handleAddLimit} disabled={!newLimitKey}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Show custom limits (not in predefined list) */}
                        {Object.entries(editingPlan.limits || {})
                          .filter(([key]) => !LIMIT_DEFINITIONS.find(l => l.key === key))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{key}</div>
                                <div className="text-xs text-muted-foreground">Custom limit</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number"
                                  className="w-24"
                                  value={value}
                                  onChange={(e) => handleUpdateLimit(key, parseInt(e.target.value) || 0)}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveLimit(key)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="visibility" className="space-y-4 py-4 px-1">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4" />
                            <span className="font-medium">Hidden Plan</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Hidden plans are not visible to regular users and can only be assigned to specific allowed users
                          </p>
                        </div>
                        <Switch 
                          checked={editingPlan.is_hidden} 
                          onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_hidden: checked })} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">Active</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Inactive plans cannot be subscribed to
                          </p>
                        </div>
                        <Switch 
                          checked={editingPlan.is_active} 
                          onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })} 
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="users" className="space-y-4 py-4 px-1">
                      {editingPlan.is_hidden ? (
                        <>
                          <div className="space-y-2">
                            <Label>Add User to Plan</Label>
                            <Input 
                              placeholder="Search users..." 
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                            />
                            {userSearchQuery && (
                              <ScrollArea className="h-32 border rounded-md p-2">
                                {filteredProfiles.slice(0, 10).map(profile => (
                                  <div 
                                    key={profile.id} 
                                    className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                                    onClick={() => {
                                      handleAddUserToPlan(plan, profile.id);
                                      setUserSearchQuery('');
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {profile.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{profile.name || 'Unknown'}</span>
                                      <span className="text-xs text-muted-foreground">{profile.email}</span>
                                    </div>
                                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                ))}
                              </ScrollArea>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Allowed Users ({plan.allowed_user_ids?.length || 0})</Label>
                            <ScrollArea className="h-48 border rounded-md">
                              {getAllowedUsers(plan).length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  No users added to this plan yet
                                </div>
                              ) : (
                                <div className="p-2 space-y-1">
                                  {getAllowedUsers(plan).map(user => user && (
                                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="text-sm font-medium">{user.name || 'Unknown'}</div>
                                          <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleRemoveUserFromPlan(plan, user.id)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Enable "Hidden Plan" in Visibility tab to manage allowed users</p>
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage pricing, features and limits</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'public' | 'hidden')}>
            <TabsList>
              <TabsTrigger value="public" className="gap-2">
                <Eye className="w-4 h-4" /> Public ({publicPlans.length})
              </TabsTrigger>
              <TabsTrigger value="hidden" className="gap-2">
                <EyeOff className="w-4 h-4" /> Hidden ({hiddenPlans.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="limits">Limits</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[50vh] mt-4">
                  <TabsContent value="basic" className="space-y-4 py-4 px-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="e.g., Pro" />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug (unique)</Label>
                        <Input value={newPlan.slug} onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="e.g., pro" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input type="number" step="0.01" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Billing Period</Label>
                        <Select value={newPlan.billing_period} onValueChange={(v) => setNewPlan({ ...newPlan, billing_period: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="lifetime">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        <div>
                          <span className="font-medium text-sm">Hidden/Special Plan</span>
                          <p className="text-xs text-muted-foreground">Only visible to selected users</p>
                        </div>
                      </div>
                      <Switch 
                        checked={newPlan.is_hidden} 
                        onCheckedChange={(checked) => setNewPlan({ ...newPlan, is_hidden: checked })} 
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="space-y-4 py-4 px-1">
                    <div>
                      <Label className="text-base font-semibold">Feature Descriptions</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add features that will be displayed on the pricing page
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        value={newFeature} 
                        onChange={(e) => setNewFeature(e.target.value)} 
                        placeholder="Add a feature..." 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())} 
                      />
                      <Button type="button" variant="outline" onClick={handleAddFeature}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {newPlan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="flex-1">{f}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveFeature(i)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="limits" className="space-y-4 py-4 px-1">
                    <div>
                      <Label className="text-base font-semibold">Usage Limits</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Set limits for this plan. Use -1 for unlimited.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {LIMIT_DEFINITIONS.map(limitDef => {
                        const currentValue = newPlan.limits[limitDef.key];
                        const isSet = currentValue !== undefined;
                        
                        return (
                          <div key={limitDef.key} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{limitDef.label}</div>
                              <div className="text-xs text-muted-foreground">{limitDef.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSet ? (
                                <>
                                  <Input 
                                    type="number"
                                    className="w-24"
                                    value={currentValue}
                                    onChange={(e) => handleNewPlanUpdateLimit(limitDef.key, parseInt(e.target.value) || 0)}
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleNewPlanRemoveLimit(limitDef.key)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleNewPlanUpdateLimit(limitDef.key, 0)}
                                >
                                  <Plus className="w-4 h-4 mr-1" /> Set
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newPlan.name || !newPlan.slug}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'public' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publicPlans.map(renderPlanCard)}
        </div>
      )}

      {viewMode === 'hidden' && (
        <>
          {hiddenPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hiddenPlans.map(renderPlanCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hidden/special plans configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a hidden plan to offer special pricing to specific users
                </p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setNewPlan({ ...newPlan, is_hidden: true });
                  setIsCreateOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />Create Hidden Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {viewMode === 'public' && publicPlans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No public subscription plans configured</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Create First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}