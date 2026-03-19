import { useState, useEffect } from 'react';
import { Save, Loader2, Shield, Bell, Database, Globe, Bot, Palette, Mail, Clock, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAdminSettings, useUpdateAdminSetting, useCreateAdminSetting } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import type { Json } from '@/integrations/supabase/types';

const SETTING_CATEGORIES = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data & Storage', icon: Database },
  { id: 'ai', label: 'AI Settings', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSetting = useUpdateAdminSetting();
  const createSetting = useCreateAdminSetting();
  const [localSettings, setLocalSettings] = useState<Record<string, Json>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (settings) {
      const map: Record<string, Json> = {};
      settings.forEach(s => { map[s.key] = s.value as Json; });
      setLocalSettings(map);
    }
  }, [settings]);

  const handleChange = (key: string, value: Json) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const existingKeys = settings?.map(s => s.key) || [];
      
      for (const [key, value] of Object.entries(localSettings)) {
        if (existingKeys.includes(key)) {
          await updateSetting.mutateAsync({ key, value });
        } else {
          await createSetting.mutateAsync({ key, value });
        }
      }
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch { 
      toast.error('Failed to save settings'); 
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          action: 'send',
          to: testEmail,
          subject: 'Test Email - SMTP Configuration',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #6366f1;">🎉 SMTP Test Successful!</h1>
              <p>This is a test email to verify your SMTP configuration is working correctly.</p>
              <p><strong>Provider:</strong> ${getValue('email_provider', 'smtp')}</p>
              <p><strong>Host:</strong> ${getValue('smtp_host', 'N/A')}</p>
              <p><strong>Port:</strong> ${getNumber('smtp_port', 587)}</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #666; font-size: 14px;">If you received this email, your email configuration is working properly!</p>
            </div>
          `,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Test email sent successfully! Check your inbox.');
        setShowTestEmail(false);
        setTestEmail('');
      } else {
        toast.error(data?.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Failed to send test email. Check console for details.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getValue = (key: string, def: Json = ''): string => {
    const v = localSettings[key] ?? def;
    return String(v).replace(/^"|"$/g, '');
  };

  const getNumber = (key: string, def: number = 0): number => {
    const v = localSettings[key];
    return typeof v === 'number' ? v : def;
  };

  const getBool = (key: string, def: boolean = false): boolean => {
    const v = localSettings[key];
    if (typeof v === 'boolean') return v;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return def;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || updateSetting.isPending}>
          {updateSetting.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {SETTING_CATEGORIES.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />General Settings</CardTitle>
              <CardDescription>Basic application configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>App Name</Label>
                  <Input 
                    value={getValue('app_name', 'LifeOS')} 
                    onChange={(e) => handleChange('app_name', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input 
                    type="email" 
                    value={getValue('support_email', 'support@lifeos.app')} 
                    onChange={(e) => handleChange('support_email', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select value={getValue('default_language', 'vi')} onValueChange={(v) => handleChange('default_language', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Select value={getValue('default_timezone', 'Asia/Ho_Chi_Minh')} onValueChange={(v) => handleChange('default_timezone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>App Description</Label>
                <Textarea 
                  value={getValue('app_description', 'Personal life management system')}
                  onChange={(e) => handleChange('app_description', e.target.value)}
                  placeholder="Brief description of your app..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable the app for maintenance</p>
                </div>
                <Switch 
                  checked={getBool('maintenance_mode', false)} 
                  onCheckedChange={(c) => handleChange('maintenance_mode', c)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Email Provider</CardTitle>
              <CardDescription>Configure email sending service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={getValue('email_provider', 'smtp')} onValueChange={(v) => handleChange('email_provider', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail SMTP</SelectItem>
                    <SelectItem value="smtp">Custom SMTP Server</SelectItem>
                    <SelectItem value="resend">Resend API</SelectItem>
                    <SelectItem value="none">None (Logging Only)</SelectItem>
                  </SelectContent>
                </Select>
                {getValue('email_provider') === 'gmail' && (
                  <p className="text-xs text-muted-foreground">
                    Sử dụng Gmail SMTP. Bạn cần bật "Less secure app access" hoặc tạo App Password trong tài khoản Google.
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input 
                    type="email"
                    value={getValue('smtp_from_email', '')} 
                    onChange={(e) => handleChange('smtp_from_email', e.target.value)} 
                    placeholder={getValue('email_provider') === 'gmail' ? 'your-email@gmail.com' : 'noreply@example.com'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input 
                    value={getValue('smtp_from_name', 'LifeOS')} 
                    onChange={(e) => handleChange('smtp_from_name', e.target.value)} 
                    placeholder="Your App Name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {(getValue('email_provider') === 'smtp' || getValue('email_provider') === 'gmail') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />
                  {getValue('email_provider') === 'gmail' ? 'Gmail SMTP Configuration' : 'SMTP Configuration'}
                </CardTitle>
                <CardDescription>
                  {getValue('email_provider') === 'gmail' 
                    ? 'Cấu hình Gmail SMTP để gửi email. Hãy sử dụng App Password thay vì mật khẩu thường.'
                    : 'Configure your custom SMTP server'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getValue('email_provider') === 'gmail' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Hướng dẫn cấu hình Gmail:</p>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                      <li>Vào tài khoản Google → Security → 2-Step Verification (bật nếu chưa có)</li>
                      <li>Vào Security → App passwords → Tạo mới cho "Mail"</li>
                      <li>Sao chép App Password (16 ký tự) và dán vào trường SMTP Password bên dưới</li>
                    </ol>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input 
                      value={getValue('smtp_host', getValue('email_provider') === 'gmail' ? 'smtp.gmail.com' : '')} 
                      onChange={(e) => handleChange('smtp_host', e.target.value)} 
                      placeholder={getValue('email_provider') === 'gmail' ? 'smtp.gmail.com' : 'smtp.example.com'}
                      disabled={getValue('email_provider') === 'gmail'}
                    />
                    {getValue('email_provider') === 'gmail' && (
                      <p className="text-xs text-muted-foreground">Đã cố định cho Gmail</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input 
                      type="number"
                      value={getNumber('smtp_port', getValue('email_provider') === 'gmail' ? 465 : 587)} 
                      onChange={(e) => handleChange('smtp_port', parseInt(e.target.value) || 587)} 
                      placeholder={getValue('email_provider') === 'gmail' ? '465' : '587'}
                      disabled={getValue('email_provider') === 'gmail'}
                    />
                    {getValue('email_provider') === 'gmail' && (
                      <p className="text-xs text-muted-foreground">Port 465 (SSL) cho Gmail</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Username (Email Gmail)</Label>
                    <Input 
                      value={getValue('smtp_username', '')} 
                      onChange={(e) => handleChange('smtp_username', e.target.value)} 
                      placeholder={getValue('email_provider') === 'gmail' ? 'your-email@gmail.com' : 'username@example.com'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{getValue('email_provider') === 'gmail' ? 'App Password' : 'SMTP Password'}</Label>
                    <Input 
                      type="password"
                      value={getValue('smtp_password', '')} 
                      onChange={(e) => handleChange('smtp_password', e.target.value)} 
                      placeholder={getValue('email_provider') === 'gmail' ? 'xxxx xxxx xxxx xxxx' : '••••••••'}
                    />
                    {getValue('email_provider') === 'gmail' && (
                      <p className="text-xs text-muted-foreground">App Password 16 ký tự từ Google</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Use SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">Enable secure connection</p>
                  </div>
                  <Switch 
                    checked={getBool('smtp_secure', getValue('email_provider') === 'gmail' ? true : true)} 
                    onCheckedChange={(c) => handleChange('smtp_secure', c)} 
                    disabled={getValue('email_provider') === 'gmail'}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Test Email Configuration</Label>
                    <p className="text-sm text-muted-foreground">Send a test email to verify your SMTP settings</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowTestEmail(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize email templates for different scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Welcome Email Subject</Label>
                <Input 
                  value={getValue('email_welcome_subject', 'Welcome to LifeOS!')} 
                  onChange={(e) => handleChange('email_welcome_subject', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Password Reset Subject</Label>
                <Input 
                  value={getValue('email_reset_subject', 'Reset Your Password - LifeOS')} 
                  onChange={(e) => handleChange('email_reset_subject', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Email Footer Text</Label>
                <Textarea 
                  value={getValue('email_footer', '© 2024 LifeOS. All rights reserved.')} 
                  onChange={(e) => handleChange('email_footer', e.target.value)} 
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Security Settings</CardTitle>
              <CardDescription>Authentication and security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <Switch 
                  checked={getBool('two_factor_enabled', false)} 
                  onCheckedChange={(c) => handleChange('two_factor_enabled', c)} 
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input 
                    type="number" 
                    value={getNumber('session_timeout', 30)} 
                    onChange={(e) => handleChange('session_timeout', parseInt(e.target.value) || 30)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input 
                    type="number" 
                    value={getNumber('max_login_attempts', 5)} 
                    onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value) || 5)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password Min Length</Label>
                  <Input 
                    type="number" 
                    value={getNumber('password_min_length', 8)} 
                    onChange={(e) => handleChange('password_min_length', parseInt(e.target.value) || 8)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lockout Duration (minutes)</Label>
                  <Input 
                    type="number" 
                    value={getNumber('lockout_duration', 15)} 
                    onChange={(e) => handleChange('lockout_duration', parseInt(e.target.value) || 15)} 
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">Users must verify email before accessing the app</p>
                </div>
                <Switch 
                  checked={getBool('require_email_verification', true)} 
                  onCheckedChange={(c) => handleChange('require_email_verification', c)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notification Settings</CardTitle>
              <CardDescription>Configure system notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email alerts for important events</p>
                </div>
                <Switch 
                  checked={getBool('email_notifications', true)} 
                  onCheckedChange={(c) => handleChange('email_notifications', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch 
                  checked={getBool('push_notifications', true)} 
                  onCheckedChange={(c) => handleChange('push_notifications', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send SMS for critical alerts</p>
                </div>
                <Switch 
                  checked={getBool('sms_notifications', false)} 
                  onCheckedChange={(c) => handleChange('sms_notifications', c)} 
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Digest Frequency</Label>
                  <Select value={getValue('digest_frequency', 'daily')} onValueChange={(v) => handleChange('digest_frequency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quiet Hours Start</Label>
                  <Input 
                    type="time" 
                    value={getValue('quiet_hours_start', '22:00')} 
                    onChange={(e) => handleChange('quiet_hours_start', e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Data & Storage Settings</CardTitle>
              <CardDescription>Configure data management and backup options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatic daily database backups</p>
                </div>
                <Switch 
                  checked={getBool('auto_backup', true)} 
                  onCheckedChange={(c) => handleChange('auto_backup', c)} 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input 
                    type="number" 
                    value={getNumber('data_retention_days', 365)} 
                    onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value) || 365)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select value={getValue('backup_frequency', 'daily')} onValueChange={(v) => handleChange('backup_frequency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max File Upload Size (MB)</Label>
                  <Input 
                    type="number" 
                    value={getNumber('max_upload_size', 10)} 
                    onChange={(e) => handleChange('max_upload_size', parseInt(e.target.value) || 10)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trash Auto-Cleanup (days)</Label>
                  <Input 
                    type="number" 
                    value={getNumber('trash_cleanup_days', 30)} 
                    onChange={(e) => handleChange('trash_cleanup_days', parseInt(e.target.value) || 30)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" />AI Settings</CardTitle>
              <CardDescription>Configure AI features and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Features Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable AI-powered features throughout the app</p>
                </div>
                <Switch 
                  checked={getBool('ai_enabled', true)} 
                  onCheckedChange={(c) => handleChange('ai_enabled', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">Show AI-generated suggestions for goals, habits, tasks</p>
                </div>
                <Switch 
                  checked={getBool('ai_suggestions_enabled', true)} 
                  onCheckedChange={(c) => handleChange('ai_suggestions_enabled', c)} 
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <Select value={getValue('default_ai_model', 'google/gemini-2.5-flash')} onValueChange={(v) => handleChange('default_ai_model', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                      <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI Temperature</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="2"
                    value={getNumber('ai_temperature', 0.7)} 
                    onChange={(e) => handleChange('ai_temperature', parseFloat(e.target.value) || 0.7)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens per Request</Label>
                  <Input 
                    type="number" 
                    value={getNumber('ai_max_tokens', 4096)} 
                    onChange={(e) => handleChange('ai_max_tokens', parseInt(e.target.value) || 4096)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily AI Request Limit</Label>
                  <Input 
                    type="number" 
                    value={getNumber('ai_daily_limit', 100)} 
                    onChange={(e) => handleChange('ai_daily_limit', parseInt(e.target.value) || 100)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Appearance Settings</CardTitle>
              <CardDescription>Configure visual appearance and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Theme</Label>
                  <Select value={getValue('default_theme', 'system')} onValueChange={(v) => handleChange('default_theme', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Input 
                    type="color" 
                    value={getValue('accent_color', '#6366f1')} 
                    onChange={(e) => handleChange('accent_color', e.target.value)}
                    className="h-10 w-full"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Lovable Badge</Label>
                  <p className="text-sm text-muted-foreground">Display "Powered by Lovable" badge</p>
                </div>
                <Switch 
                  checked={getBool('show_lovable_badge', true)} 
                  onCheckedChange={(c) => handleChange('show_lovable_badge', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use more compact spacing throughout the app</p>
                </div>
                <Switch 
                  checked={getBool('compact_mode', false)} 
                  onCheckedChange={(c) => handleChange('compact_mode', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable UI animations and transitions</p>
                </div>
                <Switch 
                  checked={getBool('animations_enabled', true)} 
                  onCheckedChange={(c) => handleChange('animations_enabled', c)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={showTestEmail} onOpenChange={setShowTestEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Email Address</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
              />
              <p className="text-xs text-muted-foreground">
                A test email will be sent to this address using your current SMTP configuration.
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
              <p><strong>Provider:</strong> {getValue('email_provider', 'Not set')}</p>
              <p><strong>SMTP Host:</strong> {getValue('smtp_host', 'Not set')}</p>
              <p><strong>SMTP Port:</strong> {getNumber('smtp_port', 587)}</p>
              <p><strong>Username:</strong> {getValue('smtp_username', 'Not set')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestEmail(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestEmail} disabled={isSendingTest || !testEmail}>
              {isSendingTest && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}