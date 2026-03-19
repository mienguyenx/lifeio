import { useState } from 'react';
import { Plus, Save, Trash2, Mail, Eye, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'auth', label: 'Authentication' },
  { value: 'notification', label: 'Notification' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'system', label: 'System' },
];

const DEFAULT_TEMPLATES: Partial<EmailTemplate>[] = [
  {
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to {{app_name}}!',
    category: 'auth',
    variables: ['user_name', 'app_name'],
    html_content: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #6366f1;">Welcome to {{app_name}}!</h1>
  <p>Hi {{user_name}},</p>
  <p>Thank you for joining us! We're excited to have you on board.</p>
  <p>Start organizing your life today with goals, habits, tasks, and more.</p>
  <p>Best regards,<br>The {{app_name}} Team</p>
</div>`,
    text_content: 'Welcome to {{app_name}}!\n\nHi {{user_name}},\n\nThank you for joining us!',
  },
  {
    name: 'Password Reset',
    slug: 'password-reset',
    subject: 'Reset Your Password - {{app_name}}',
    category: 'auth',
    variables: ['user_name', 'reset_link', 'app_name'],
    html_content: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #6366f1;">Reset Your Password</h1>
  <p>Hi {{user_name}},</p>
  <p>We received a request to reset your password. Click the button below to set a new password:</p>
  <p style="margin: 24px 0;">
    <a href="{{reset_link}}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
  </p>
  <p>If you didn't request this, you can safely ignore this email.</p>
  <p>This link will expire in 1 hour.</p>
</div>`,
    text_content: 'Reset Your Password\n\nHi {{user_name}},\n\nClick here to reset: {{reset_link}}',
  },
  {
    name: 'Notification',
    slug: 'notification',
    subject: '{{subject}}',
    category: 'notification',
    variables: ['user_name', 'subject', 'message', 'app_name'],
    html_content: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #6366f1;">{{subject}}</h1>
  <p>Hi {{user_name}},</p>
  <p>{{message}}</p>
  <p>Best regards,<br>The {{app_name}} Team</p>
</div>`,
    text_content: '{{subject}}\n\nHi {{user_name}},\n\n{{message}}',
  },
];

export default function AdminEmailTemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  // Fetch templates from admin_settings (stored as JSON)
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'email_templates')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      const value = data?.value;
      if (Array.isArray(value)) {
        return value as unknown as EmailTemplate[];
      }
      return [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newTemplates: EmailTemplate[]) => {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'email_templates')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update({ 
            value: JSON.parse(JSON.stringify(newTemplates)),
            updated_at: new Date().toISOString()
          })
          .eq('key', 'email_templates');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert([{ 
            key: 'email_templates', 
            value: JSON.parse(JSON.stringify(newTemplates)),
            description: 'Email templates configuration'
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Templates saved successfully');
    },
    onError: () => toast.error('Failed to save templates'),
  });

  const handleCreate = () => {
    setFormData({
      name: '',
      slug: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: [],
      is_active: true,
      category: 'notification',
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData(template);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug || !formData.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: isCreating ? crypto.randomUUID() : selectedTemplate!.id,
      name: formData.name!,
      slug: formData.slug!,
      subject: formData.subject!,
      html_content: formData.html_content || '',
      text_content: formData.text_content || '',
      variables: formData.variables || [],
      is_active: formData.is_active ?? true,
      category: formData.category || 'notification',
      created_at: isCreating ? new Date().toISOString() : selectedTemplate!.created_at,
      updated_at: new Date().toISOString(),
    };

    const updatedTemplates = isCreating
      ? [...templates, newTemplate]
      : templates.map(t => t.id === newTemplate.id ? newTemplate : t);

    saveMutation.mutate(updatedTemplates);
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(null);
  };

  const handleDelete = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    saveMutation.mutate(updatedTemplates);
  };

  const handleInitDefaults = () => {
    const defaultsWithIds = DEFAULT_TEMPLATES.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as EmailTemplate[];
    
    saveMutation.mutate([...templates, ...defaultsWithIds]);
  };

  const renderPreview = (html: string) => {
    // Replace variables with sample values
    return html
      .replace(/\{\{user_name\}\}/g, 'John Doe')
      .replace(/\{\{app_name\}\}/g, 'LifeOS')
      .replace(/\{\{reset_link\}\}/g, '#')
      .replace(/\{\{subject\}\}/g, 'Sample Subject')
      .replace(/\{\{message\}\}/g, 'This is a sample message.');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage email templates for the application</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={handleInitDefaults}>
              Initialize Default Templates
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">{template.slug}</CardDescription>
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Subject:</p>
                <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                </Badge>
                {template.variables?.slice(0, 3).map(v => (
                  <Badge key={v} variant="secondary" className="text-xs font-mono">
                    {`{{${v}}}`}
                  </Badge>
                ))}
                {(template.variables?.length || 0) > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.variables.length - 3}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-12 text-center">
          <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No email templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by initializing default templates or create your own.
          </p>
          <Button onClick={handleInitDefaults}>Initialize Default Templates</Button>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => { if (!open) { setIsEditing(false); setIsCreating(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Create Email Template' : 'Edit Email Template'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (unique identifier) *</Label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="welcome-email"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category || 'notification'}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Variables (comma-separated)</Label>
                <Input
                  value={(formData.variables || []).join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                  })}
                  placeholder="user_name, app_name, reset_link"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Subject *</Label>
              <Input
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Welcome to {{app_name}}!"
              />
            </div>

            <Tabs defaultValue="html" className="w-full">
              <div className="flex items-center justify-between mb-2">
                <TabsList>
                  <TabsTrigger value="html">HTML Content</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="html" className="space-y-2">
                <Textarea
                  value={formData.html_content || ''}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  placeholder="<div>Your HTML content here...</div>"
                  className="font-mono text-sm min-h-[300px]"
                />
              </TabsContent>

              <TabsContent value="text" className="space-y-2">
                <Textarea
                  value={formData.text_content || ''}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  placeholder="Plain text version of your email..."
                  className="font-mono text-sm min-h-[300px]"
                />
              </TabsContent>

              <TabsContent value="preview">
                <div className="border rounded-lg p-4 min-h-[300px] bg-background">
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium">{renderPreview(formData.subject || '')}</p>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderPreview(formData.html_content || '') }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
              />
              <Label>Template is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditing(false); setIsCreating(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}