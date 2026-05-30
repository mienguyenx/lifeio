import { useState, useEffect } from 'react';
import { Save, Loader2, Shield, Bell, Database, Globe, Bot, Palette, Mail, Clock, Send, MessageCircle, Smartphone, LayoutGrid, Wrench, Settings, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageTransition } from '@/components/admin/AdminAnimations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAdminSettings, useUpdateAdminSetting, useCreateAdminSetting, useAIModels } from '@/hooks/useAdminData';
import { ModelSelector } from '@/components/admin/ModelSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { activeSupabase as supabase } from '@/integrations/supabase/externalClient';
import type { Json } from '@/integrations/supabase/types';
import { telegramService, type TelegramConfig } from '@/services/telegramService';
import { loadBrandingConfig, saveBrandingConfig, type BrandingConfig, DEFAULT_BRANDING } from '@/hooks/useBranding';

const SETTING_CATEGORIES = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'telegram', label: 'Telegram', icon: MessageCircle },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data & Storage', icon: Database },
  { id: 'ai', label: 'AI Settings', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'pwa', label: 'PWA & SEO', icon: Smartphone },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
];

export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const { data: aiModels } = useAIModels();
  const updateSetting = useUpdateAdminSetting();
  const createSetting = useCreateAdminSetting();
  const [localSettings, setLocalSettings] = useState<Record<string, Json>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    bot_token: '', chat_id: '', bot_name: 'LifeOS Bot', enabled: false,
    notify_tasks: true, notify_goals: true, notify_habits: true, notify_system: true,
    notify_daily_briefing: true, daily_briefing_time: '07:00',
    quiet_hours_start: '22:00', quiet_hours_end: '07:00',
    template_task: '{emoji} <b>{title}</b>\n{message}',
    template_goal: '{emoji} <b>{title}</b>\n{message}',
    template_habit: '{emoji} <b>{title}</b>\n{message}',
    template_system: '{emoji} <b>{title}</b>\n{message}',
  });
  const [isTelegramTesting, setIsTelegramTesting] = useState(false);
  const [isTelegramSaving, setIsTelegramSaving] = useState(false);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [isBrandingSaving, setIsBrandingSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const map: Record<string, Json> = {};
      settings.forEach(s => { map[s.key] = s.value as Json; });
      setLocalSettings(map);
    }
  }, [settings]);

  useEffect(() => {
    telegramService.loadConfig().then(cfg => setTelegramConfig(cfg));
    loadBrandingConfig().then(cfg => setBrandingConfig(cfg));
  }, []);

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
    <PageTransition className="p-6 space-y-6">
      <AdminPageHeader
        title="System Settings"
        description="Configure system-wide settings and preferences"
        icon={Settings}
        actions={
          <Button onClick={handleSave} disabled={!hasChanges || updateSetting.isPending}>
            {updateSetting.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        }
      />

      <Tabs defaultValue={typeof window !== 'undefined' ? (window.location.hash.replace('#', '') || 'general') : 'general'} className="space-y-0" onValueChange={(v) => { window.location.hash = v; }}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Sidebar Nav */}
          <div className="md:w-56 shrink-0">
            <ScrollArea className="md:h-[calc(100vh-200px)]">
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                {SETTING_CATEGORIES.map(cat => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className={cn(
                      'flex items-center gap-2.5 justify-start px-3 py-2 rounded-lg text-sm whitespace-nowrap',
                      'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm',
                      'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted'
                    )}
                  >
                    <cat.icon className="w-4 h-4 shrink-0" />
                    {cat.label}
                  </TabsTrigger>
                ))}
              </nav>
            </ScrollArea>
          </div>

          {/* Settings Content */}
          <div className="flex-1 min-w-0">

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
          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Xác thực & Bảo mật</CardTitle>
              <CardDescription>Cấu hình đăng nhập và bảo mật tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Yêu cầu 2FA cho tài khoản admin</p>
                </div>
                <Switch checked={getBool('two_factor_enabled', false)} onCheckedChange={(c) => handleChange('two_factor_enabled', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">User phải xác thực email trước khi sử dụng app</p>
                </div>
                <Switch checked={getBool('require_email_verification', true)} onCheckedChange={(c) => handleChange('require_email_verification', c)} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Session Timeout (phút)</Label>
                  <Input type="number" value={getNumber('session_timeout', 30)} onChange={(e) => handleChange('session_timeout', parseInt(e.target.value) || 30)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input type="number" value={getNumber('max_login_attempts', 5)} onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value) || 5)} />
                </div>
                <div className="space-y-2">
                  <Label>Password Min Length</Label>
                  <Input type="number" value={getNumber('password_min_length', 8)} onChange={(e) => handleChange('password_min_length', parseInt(e.target.value) || 8)} />
                </div>
                <div className="space-y-2">
                  <Label>Lockout Duration (phút)</Label>
                  <Input type="number" value={getNumber('lockout_duration', 15)} onChange={(e) => handleChange('lockout_duration', parseInt(e.target.value) || 15)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kiểm soát đăng ký</CardTitle>
              <CardDescription>Quản lý ai được phép tạo tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Chế độ đăng ký</Label>
                <Select value={getValue('registration_mode', 'open')} onValueChange={(v) => handleChange('registration_mode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Mở (ai cũng đăng ký được)</SelectItem>
                    <SelectItem value="invite_only">Chỉ qua lời mời (invite code)</SelectItem>
                    <SelectItem value="approved">Cần admin phê duyệt</SelectItem>
                    <SelectItem value="closed">Đóng (không cho đăng ký mới)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Allowed Email Domains</Label>
                <Input
                  value={getValue('allowed_email_domains', '')}
                  onChange={(e) => handleChange('allowed_email_domains', e.target.value)}
                  placeholder="gmail.com, company.com (để trống = tất cả)"
                />
                <p className="text-xs text-muted-foreground">Phân cách bằng dấu phẩy. Để trống cho phép mọi domain.</p>
              </div>
              <div className="space-y-2">
                <Label>Max Users</Label>
                <Input type="number" value={getNumber('max_users', 0)} onChange={(e) => handleChange('max_users', parseInt(e.target.value) || 0)} />
                <p className="text-xs text-muted-foreground">0 = không giới hạn</p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rate Limiting & IP</CardTitle>
              <CardDescription>Giới hạn request và kiểm soát truy cập IP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>API Rate Limit (requests/phút)</Label>
                  <Input type="number" value={getNumber('api_rate_limit', 60)} onChange={(e) => handleChange('api_rate_limit', parseInt(e.target.value) || 60)} />
                </div>
                <div className="space-y-2">
                  <Label>Login Rate Limit (attempts/15 phút)</Label>
                  <Input type="number" value={getNumber('login_rate_limit', 10)} onChange={(e) => handleChange('login_rate_limit', parseInt(e.target.value) || 10)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>IP Whitelist (Admin Panel)</Label>
                <Textarea
                  value={getValue('ip_whitelist', '')}
                  onChange={(e) => handleChange('ip_whitelist', e.target.value)}
                  placeholder="192.168.1.0/24&#10;10.0.0.1&#10;(để trống = cho phép tất cả)"
                  rows={3}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Mỗi dòng 1 IP hoặc CIDR. Để trống = không giới hạn.</p>
              </div>
              <div className="space-y-2">
                <Label>IP Blacklist</Label>
                <Textarea
                  value={getValue('ip_blacklist', '')}
                  onChange={(e) => handleChange('ip_blacklist', e.target.value)}
                  placeholder="Mỗi dòng 1 IP cần chặn"
                  rows={2}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Bot Settings */}
        <TabsContent value="telegram" className="space-y-6">
          {/* Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" />Telegram Bot</CardTitle>
              <CardDescription>Cấu hình Telegram Bot để nhận thông báo realtime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bật Telegram Notification</Label>
                  <p className="text-sm text-muted-foreground">Gửi thông báo qua Telegram Bot</p>
                </div>
                <Switch
                  checked={telegramConfig.enabled}
                  onCheckedChange={(c) => setTelegramConfig(prev => ({ ...prev, enabled: c }))}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Bot Name</Label>
                  <Input
                    value={telegramConfig.bot_name}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, bot_name: e.target.value }))}
                    placeholder="LifeOS Bot"
                  />
                  <p className="text-xs text-muted-foreground">Tên hiển thị trong template</p>
                </div>
                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <Input
                    type="password"
                    value={telegramConfig.bot_token}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, bot_token: e.target.value }))}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                  <p className="text-xs text-muted-foreground">Lấy từ @BotFather trên Telegram</p>
                </div>
                <div className="space-y-2">
                  <Label>Chat ID</Label>
                  <Input
                    value={telegramConfig.chat_id}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, chat_id: e.target.value }))}
                    placeholder="123456789 hoặc -100123456789"
                  />
                  <p className="text-xs text-muted-foreground">Dùng @userinfobot để lấy</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Loại thông báo</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="tg_tasks" checked={telegramConfig.notify_tasks} onCheckedChange={(c) => setTelegramConfig(prev => ({ ...prev, notify_tasks: c }))} />
                    <Label htmlFor="tg_tasks" className="cursor-pointer text-sm">📋 Tasks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="tg_goals" checked={telegramConfig.notify_goals} onCheckedChange={(c) => setTelegramConfig(prev => ({ ...prev, notify_goals: c }))} />
                    <Label htmlFor="tg_goals" className="cursor-pointer text-sm">🎯 Goals</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="tg_habits" checked={telegramConfig.notify_habits} onCheckedChange={(c) => setTelegramConfig(prev => ({ ...prev, notify_habits: c }))} />
                    <Label htmlFor="tg_habits" className="cursor-pointer text-sm">🔄 Habits</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="tg_system" checked={telegramConfig.notify_system} onCheckedChange={(c) => setTelegramConfig(prev => ({ ...prev, notify_system: c }))} />
                    <Label htmlFor="tg_system" className="cursor-pointer text-sm">ℹ️ System</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="tg_briefing" checked={telegramConfig.notify_daily_briefing} onCheckedChange={(c) => setTelegramConfig(prev => ({ ...prev, notify_daily_briefing: c }))} />
                    <Label htmlFor="tg_briefing" className="cursor-pointer text-sm">📊 Daily Briefing</Label>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Daily Briefing Time</Label>
                  <Input
                    type="time"
                    value={telegramConfig.daily_briefing_time || '07:00'}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, daily_briefing_time: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Giờ gửi báo cáo ngày</p>
                </div>
                <div className="space-y-2">
                  <Label>Quiet Hours Start</Label>
                  <Input
                    type="time"
                    value={telegramConfig.quiet_hours_start || '22:00'}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quiet Hours End</Label>
                  <Input
                    type="time"
                    value={telegramConfig.quiet_hours_end || '07:00'}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message Templates</CardTitle>
              <CardDescription>
                Tùy chỉnh nội dung tin nhắn. Biến hỗ trợ: <code className="text-xs bg-muted px-1 rounded">{'{emoji}'}</code> <code className="text-xs bg-muted px-1 rounded">{'{title}'}</code> <code className="text-xs bg-muted px-1 rounded">{'{message}'}</code> <code className="text-xs bg-muted px-1 rounded">{'{bot_name}'}</code> <code className="text-xs bg-muted px-1 rounded">{'{time}'}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>📋 Task Template</Label>
                  <Textarea
                    value={telegramConfig.template_task}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, template_task: e.target.value }))}
                    rows={2}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>🎯 Goal Template</Label>
                  <Textarea
                    value={telegramConfig.template_goal}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, template_goal: e.target.value }))}
                    rows={2}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>🔄 Habit Template</Label>
                  <Textarea
                    value={telegramConfig.template_habit}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, template_habit: e.target.value }))}
                    rows={2}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ℹ️ System Template</Label>
                  <Textarea
                    value={telegramConfig.template_system}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, template_system: e.target.value }))}
                    rows={2}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                setIsTelegramTesting(true);
                const result = await telegramService.testConnection(telegramConfig.bot_token, telegramConfig.chat_id);
                if (result.success) {
                  toast.success(result.message);
                } else {
                  toast.error(result.message);
                }
                setIsTelegramTesting(false);
              }}
              disabled={isTelegramTesting || !telegramConfig.bot_token || !telegramConfig.chat_id}
            >
              {isTelegramTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Test Connection
            </Button>
            <Button
              onClick={async () => {
                setIsTelegramSaving(true);
                const success = await telegramService.saveConfig(telegramConfig);
                if (success) {
                  toast.success('Đã lưu cấu hình Telegram');
                } else {
                  toast.error('Lỗi lưu cấu hình');
                }
                setIsTelegramSaving(false);
              }}
              disabled={isTelegramSaving}
            >
              {isTelegramSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu Telegram
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Kênh thông báo</CardTitle>
              <CardDescription>Bật/tắt các kênh gửi thông báo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">Thông báo hiển thị trong ứng dụng (bell icon)</p>
                </div>
                <Switch checked={getBool('inapp_notifications', true)} onCheckedChange={(c) => handleChange('inapp_notifications', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Push notification qua trình duyệt (cần user cho phép)</p>
                </div>
                <Switch checked={getBool('push_notifications', true)} onCheckedChange={(c) => handleChange('push_notifications', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Gửi email cho sự kiện quan trọng</p>
                </div>
                <Switch checked={getBool('email_notifications', true)} onCheckedChange={(c) => handleChange('email_notifications', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Telegram (xem tab Telegram)</Label>
                  <p className="text-sm text-muted-foreground">Đã cấu hình riêng trong tab Telegram</p>
                </div>
                <Switch checked={getBool('sms_notifications', false)} onCheckedChange={(c) => handleChange('sms_notifications', c)} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Notification Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loại sự kiện thông báo</CardTitle>
              <CardDescription>Chọn những sự kiện nào sẽ tạo thông báo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'notify_task_due', label: 'Task sắp hết hạn', desc: 'Nhắc trước khi task đến deadline' },
                  { key: 'notify_task_overdue', label: 'Task quá hạn', desc: 'Cảnh báo task đã qua deadline' },
                  { key: 'notify_habit_reminder', label: 'Nhắc nhở Habit', desc: 'Nhắc hoàn thành habit hàng ngày' },
                  { key: 'notify_habit_streak', label: 'Habit streak milestone', desc: 'Chúc mừng khi đạt streak 7, 30, 100 ngày' },
                  { key: 'notify_goal_progress', label: 'Goal progress update', desc: 'Thông báo khi goal đạt mốc tiến độ' },
                  { key: 'notify_goal_deadline', label: 'Goal sắp hết hạn', desc: 'Nhắc goal gần deadline' },
                  { key: 'notify_weekly_review', label: 'Weekly Review', desc: 'Nhắc viết weekly review cuối tuần' },
                  { key: 'notify_journal_reminder', label: 'Journal reminder', desc: 'Nhắc viết nhật ký hàng ngày' },
                  { key: 'notify_login_new_device', label: 'Đăng nhập thiết bị mới', desc: 'Cảnh báo bảo mật' },
                  { key: 'notify_system_update', label: 'Cập nhật hệ thống', desc: 'Thông báo version mới, maintenance' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="text-sm">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={getBool(item.key, true)} onCheckedChange={(c) => handleChange(item.key, c)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Display & Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiển thị & Hành vi</CardTitle>
              <CardDescription>Tùy chỉnh cách thông báo xuất hiện</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Notification Sound</Label>
                  <Select value={getValue('notification_sound', 'default')} onValueChange={(v) => handleChange('notification_sound', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="none">Tắt âm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Auto-dismiss sau (giây)</Label>
                  <Input type="number" value={getNumber('notification_auto_dismiss', 5)} onChange={(e) => handleChange('notification_auto_dismiss', parseInt(e.target.value) || 5)} />
                  <p className="text-xs text-muted-foreground">0 = không tự ẩn</p>
                </div>
                <div className="space-y-2">
                  <Label>Số thông báo tối đa lưu trữ</Label>
                  <Input type="number" value={getNumber('max_notifications', 100)} onChange={(e) => handleChange('max_notifications', parseInt(e.target.value) || 100)} />
                </div>
                <div className="space-y-2">
                  <Label>Digest Frequency</Label>
                  <Select value={getValue('digest_frequency', 'daily')} onValueChange={(v) => handleChange('digest_frequency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Ngay lập tức</SelectItem>
                      <SelectItem value="hourly">Mỗi giờ</SelectItem>
                      <SelectItem value="daily">Hàng ngày</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Quiet Hours Start</Label>
                  <Input type="time" value={getValue('quiet_hours_start', '22:00')} onChange={(e) => handleChange('quiet_hours_start', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Quiet Hours End</Label>
                  <Input type="time" value={getValue('quiet_hours_end', '07:00')} onChange={(e) => handleChange('quiet_hours_end', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Hiển thị badge count trên tab trình duyệt</Label>
                  <p className="text-sm text-muted-foreground">Số thông báo chưa đọc hiện trên favicon/tab title</p>
                </div>
                <Switch checked={getBool('show_tab_badge', true)} onCheckedChange={(c) => handleChange('show_tab_badge', c)} />
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
          {/* Core AI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" />AI Core</CardTitle>
              <CardDescription>Bật/tắt và cấu hình model AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Features Enabled</Label>
                  <p className="text-sm text-muted-foreground">Bật tính năng AI trong toàn bộ app</p>
                </div>
                <Switch checked={getBool('ai_enabled', true)} onCheckedChange={(c) => handleChange('ai_enabled', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">Gợi ý AI cho goals, habits, tasks</p>
                </div>
                <Switch checked={getBool('ai_suggestions_enabled', true)} onCheckedChange={(c) => handleChange('ai_suggestions_enabled', c)} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <ModelSelector
                    value={getValue('default_ai_model', aiModels?.find(m => m.is_default)?.model_id || '')}
                    onChange={(v) => handleChange('default_ai_model', v)}
                    showOnlyActive={true}
                    filterCapabilities={['chat']}
                    description={`Models grouped by provider. `}
                  />
                  <p className="text-xs text-muted-foreground"><a href="/admin/ai/providers" className="text-primary hover:underline">Quản lý providers & models →</a></p>
                </div>
                <div className="space-y-2">
                  <Label>AI Temperature</Label>
                  <Input type="number" step="0.1" min="0" max="2" value={getNumber('ai_temperature', 0.7)} onChange={(e) => handleChange('ai_temperature', parseFloat(e.target.value) || 0.7)} />
                  <p className="text-xs text-muted-foreground">0 = chính xác, 1 = sáng tạo, 2 = rất ngẫu nhiên</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens per Request</Label>
                  <Input type="number" value={getNumber('ai_max_tokens', 4096)} onChange={(e) => handleChange('ai_max_tokens', parseInt(e.target.value) || 4096)} />
                </div>
                <div className="space-y-2">
                  <Label>Daily AI Request Limit</Label>
                  <Input type="number" value={getNumber('ai_daily_limit', 100)} onChange={(e) => handleChange('ai_daily_limit', parseInt(e.target.value) || 100)} />
                  <p className="text-xs text-muted-foreground">0 = không giới hạn</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Persona */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Persona & Tính cách</CardTitle>
              <CardDescription>Tùy chỉnh tính cách và phong cách giao tiếp của AI Coach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tên AI Coach</Label>
                  <Input value={getValue('ai_coach_name', 'LifeOS Coach')} onChange={(e) => handleChange('ai_coach_name', e.target.value)} placeholder="LifeOS Coach" />
                </div>
                <div className="space-y-2">
                  <Label>Tính cách</Label>
                  <Select value={getValue('ai_personality', 'encouraging')} onValueChange={(v) => handleChange('ai_personality', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encouraging">Động viên & Tích cực</SelectItem>
                      <SelectItem value="direct">Thẳng thắn & Trực tiếp</SelectItem>
                      <SelectItem value="analytical">Phân tích & Logic</SelectItem>
                      <SelectItem value="empathetic">Đồng cảm & Thấu hiểu</SelectItem>
                      <SelectItem value="challenging">Thử thách & Đòi hỏi cao</SelectItem>
                      <SelectItem value="zen">Bình tĩnh & Thiền định</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phong cách giao tiếp</Label>
                  <Select value={getValue('ai_communication_style', 'casual')} onValueChange={(v) => handleChange('ai_communication_style', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Trang trọng</SelectItem>
                      <SelectItem value="casual">Thân thiện</SelectItem>
                      <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                      <SelectItem value="humorous">Hài hước</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ngôn ngữ ưu tiên</Label>
                  <Select value={getValue('ai_language', 'vi')} onValueChange={(v) => handleChange('ai_language', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="auto">Tự động (theo user)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Custom System Prompt</Label>
                <Textarea
                  value={getValue('ai_system_prompt', '')}
                  onChange={(e) => handleChange('ai_system_prompt', e.target.value)}
                  placeholder="Thêm hướng dẫn bổ sung cho AI Coach. Ví dụ: 'Luôn trả lời bằng tiếng Việt. Sử dụng emoji. Gọi user là bạn.'"
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Prompt này sẽ được thêm vào system message của AI Coach. Để trống = dùng default.</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Context & Memory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Context & Memory</CardTitle>
              <CardDescription>Cấu hình dữ liệu AI được phép truy cập</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'ai_ctx_tasks', label: 'Tasks & Deadlines', desc: 'AI thấy task hiện tại' },
                  { key: 'ai_ctx_habits', label: 'Habits & Streaks', desc: 'AI thấy habit và streak' },
                  { key: 'ai_ctx_goals', label: 'Goals & Progress', desc: 'AI thấy mục tiêu và tiến độ' },
                  { key: 'ai_ctx_journal', label: 'Journal Entries', desc: 'AI đọc nhật ký gần đây' },
                  { key: 'ai_ctx_lifewheel', label: 'Life Wheel Scores', desc: 'AI thấy điểm đánh giá cuộc sống' },
                  { key: 'ai_ctx_health', label: 'Health Data', desc: 'AI thấy dữ liệu sức khỏe' },
                  { key: 'ai_ctx_finance', label: 'Finance Data', desc: 'AI thấy dữ liệu tài chính' },
                  { key: 'ai_ctx_values', label: 'Values & Vision', desc: 'AI thấy giá trị cốt lõi và tầm nhìn' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="text-sm">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={getBool(item.key, true)} onCheckedChange={(c) => handleChange(item.key, c)} />
                  </div>
                ))}
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Context Window (số tin nhắn cũ gửi cho AI)</Label>
                  <Input type="number" value={getNumber('ai_context_window', 20)} onChange={(e) => handleChange('ai_context_window', parseInt(e.target.value) || 20)} />
                  <p className="text-xs text-muted-foreground">Số lượng tin nhắn gần nhất gửi kèm mỗi request</p>
                </div>
                <div className="space-y-2">
                  <Label>Journal Context (số entry gần nhất)</Label>
                  <Input type="number" value={getNumber('ai_journal_context', 5)} onChange={(e) => handleChange('ai_journal_context', parseInt(e.target.value) || 5)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Proactive Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tính năng chủ động</CardTitle>
              <CardDescription>AI tự chủ động gợi ý, không cần user hỏi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily AI Briefing</Label>
                  <p className="text-sm text-muted-foreground">AI tạo tóm tắt ngày mỗi sáng trên Dashboard</p>
                </div>
                <Switch checked={getBool('ai_daily_briefing', true)} onCheckedChange={(c) => handleChange('ai_daily_briefing', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Smart Nudges</Label>
                  <p className="text-sm text-muted-foreground">AI nhắc nhở khi phát hiện habit bị bỏ, goal trễ tiến độ</p>
                </div>
                <Switch checked={getBool('ai_smart_nudges', true)} onCheckedChange={(c) => handleChange('ai_smart_nudges', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly AI Insight</Label>
                  <p className="text-sm text-muted-foreground">AI tự tổng hợp phân tích tuần</p>
                </div>
                <Switch checked={getBool('ai_weekly_insight', true)} onCheckedChange={(c) => handleChange('ai_weekly_insight', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Celebration Messages</Label>
                  <p className="text-sm text-muted-foreground">AI chúc mừng khi đạt milestone (streak, goal complete)</p>
                </div>
                <Switch checked={getBool('ai_celebrations', true)} onCheckedChange={(c) => handleChange('ai_celebrations', c)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Fallback Response</Label>
                <Textarea
                  value={getValue('ai_fallback_message', 'Xin lỗi, tôi đang không thể xử lý yêu cầu này. Vui lòng thử lại sau.')}
                  onChange={(e) => handleChange('ai_fallback_message', e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Tin nhắn hiển thị khi AI gặp lỗi hoặc không phản hồi</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Branding & Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Branding & Logo</CardTitle>
              <CardDescription>Tùy chỉnh logo, tên ứng dụng và thương hiệu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tên ứng dụng</Label>
                  <Input
                    value={brandingConfig.app_name}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, app_name: e.target.value }))}
                    placeholder="LifeOS"
                  />
                  <p className="text-xs text-muted-foreground">Hiển thị trên sidebar, tiêu đề trang</p>
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={brandingConfig.app_tagline}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, app_tagline: e.target.value }))}
                    placeholder="Quản lý cuộc sống thông minh"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo URL (Light mode)</Label>
                  <Input
                    value={brandingConfig.logo_url}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                  {brandingConfig.logo_url && (
                    <div className="mt-2 p-3 bg-white rounded-lg border inline-block">
                      <img src={brandingConfig.logo_url} alt="Logo preview" className="h-8 object-contain" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Logo URL (Dark mode)</Label>
                  <Input
                    value={brandingConfig.logo_dark_url}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, logo_dark_url: e.target.value }))}
                    placeholder="https://example.com/logo-dark.png"
                  />
                  {brandingConfig.logo_dark_url && (
                    <div className="mt-2 p-3 bg-gray-900 rounded-lg border inline-block">
                      <img src={brandingConfig.logo_dark_url} alt="Logo dark preview" className="h-8 object-contain" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input
                    value={brandingConfig.favicon_url}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, favicon_url: e.target.value }))}
                    placeholder="https://example.com/favicon.svg"
                  />
                  <p className="text-xs text-muted-foreground">Icon hiển thị trên tab trình duyệt</p>
                </div>
                <div className="space-y-2">
                  <Label>Sidebar Logo Style</Label>
                  <Select
                    value={brandingConfig.sidebar_logo_style}
                    onValueChange={(v: 'icon' | 'full' | 'text-only') => setBrandingConfig(prev => ({ ...prev, sidebar_logo_style: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Logo + Tên</SelectItem>
                      <SelectItem value="icon">Chỉ Logo/Icon</SelectItem>
                      <SelectItem value="text-only">Chỉ Tên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Hiện số thông báo trên logo</Label>
                  <p className="text-sm text-muted-foreground">Badge đỏ hiển thị tổng số notification chưa đọc trên logo sidebar</p>
                </div>
                <Switch
                  checked={brandingConfig.show_notification_badge_on_logo}
                  onCheckedChange={(c) => setBrandingConfig(prev => ({ ...prev, show_notification_badge_on_logo: c }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  value={brandingConfig.welcome_message}
                  onChange={(e) => setBrandingConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Chào mừng bạn đến với LifeOS!"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Hiển thị khi user đăng nhập lần đầu hoặc trên Dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={async () => {
                    setIsBrandingSaving(true);
                    const success = await saveBrandingConfig(brandingConfig);
                    if (success) {
                      toast.success('Đã lưu cấu hình branding');
                    } else {
                      toast.error('Lỗi lưu cấu hình');
                    }
                    setIsBrandingSaving(false);
                  }}
                  disabled={isBrandingSaving}
                >
                  {isBrandingSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu Branding
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme & Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme & Display</CardTitle>
              <CardDescription>Cài đặt giao diện chung</CardDescription>
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

        {/* PWA & SEO */}
        <TabsContent value="pwa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5" />PWA Configuration</CardTitle>
              <CardDescription>Cấu hình Progressive Web App (cài app trên điện thoại)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>PWA App Name</Label>
                  <Input value={getValue('pwa_app_name', 'LifeOS')} onChange={(e) => handleChange('pwa_app_name', e.target.value)} />
                  <p className="text-xs text-muted-foreground">Tên hiển thị khi cài app trên home screen</p>
                </div>
                <div className="space-y-2">
                  <Label>PWA Short Name</Label>
                  <Input value={getValue('pwa_short_name', 'LifeOS')} onChange={(e) => handleChange('pwa_short_name', e.target.value)} />
                  <p className="text-xs text-muted-foreground">Tên ngắn dưới icon (tối đa 12 ký tự)</p>
                </div>
                <div className="space-y-2">
                  <Label>Theme Color</Label>
                  <Input type="color" value={getValue('pwa_theme_color', '#8b5cf6')} onChange={(e) => handleChange('pwa_theme_color', e.target.value)} className="h-10 w-full" />
                  <p className="text-xs text-muted-foreground">Màu thanh trạng thái trên mobile</p>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input type="color" value={getValue('pwa_background_color', '#ffffff')} onChange={(e) => handleChange('pwa_background_color', e.target.value)} className="h-10 w-full" />
                  <p className="text-xs text-muted-foreground">Màu nền splash screen</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Display Mode</Label>
                <Select value={getValue('pwa_display', 'standalone')} onValueChange={(v) => handleChange('pwa_display', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standalone">Standalone (như app native)</SelectItem>
                    <SelectItem value="fullscreen">Fullscreen</SelectItem>
                    <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                    <SelectItem value="browser">Browser</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bật Service Worker</Label>
                  <p className="text-sm text-muted-foreground">Cho phép offline caching và background sync</p>
                </div>
                <Switch checked={getBool('pwa_service_worker', false)} onCheckedChange={(c) => handleChange('pwa_service_worker', c)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO & Meta Tags</CardTitle>
              <CardDescription>Cấu hình meta tags cho SEO và chia sẻ mạng xã hội</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input value={getValue('seo_title', 'LifeOS - Quản lý cuộc sống thông minh')} onChange={(e) => handleChange('seo_title', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Keywords</Label>
                  <Input value={getValue('seo_keywords', 'life os, quản lý cuộc sống, habits, tasks, goals')} onChange={(e) => handleChange('seo_keywords', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={getValue('seo_description', 'Ứng dụng quản lý cuộc sống toàn diện với Habits, Tasks, Goals, Journal và AI Coach')} onChange={(e) => handleChange('seo_description', e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>OG Image URL</Label>
                  <Input value={getValue('seo_og_image', '/og-image.png')} onChange={(e) => handleChange('seo_og_image', e.target.value)} placeholder="https://example.com/og-image.png" />
                </div>
                <div className="space-y-2">
                  <Label>Canonical URL</Label>
                  <Input value={getValue('seo_canonical_url', '')} onChange={(e) => handleChange('seo_canonical_url', e.target.value)} placeholder="https://app.lifeos.vn" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>robots.txt nội dung</Label>
                <Textarea value={getValue('seo_robots', 'User-agent: *\nDisallow: /admin\nDisallow: /api')} onChange={(e) => handleChange('seo_robots', e.target.value)} rows={3} className="font-mono text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Widgets */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LayoutGrid className="w-5 h-5" />Dashboard Widgets</CardTitle>
              <CardDescription>Chọn widget hiển thị mặc định trên Dashboard cho user mới</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'widget_daily_summary', label: 'Daily Summary', desc: 'Tóm tắt ngày: tasks, habits, mood' },
                  { key: 'widget_habit_tracker', label: 'Habit Tracker', desc: 'Grid theo dõi habit hàng ngày' },
                  { key: 'widget_task_list', label: 'Task List', desc: 'Danh sách task cần làm hôm nay' },
                  { key: 'widget_goal_progress', label: 'Goal Progress', desc: 'Tiến độ các mục tiêu hiện tại' },
                  { key: 'widget_life_wheel', label: 'Life Wheel', desc: 'Biểu đồ radar đánh giá cuộc sống' },
                  { key: 'widget_ai_coach', label: 'AI Coach Card', desc: 'Gợi ý AI hàng ngày' },
                  { key: 'widget_streak_calendar', label: 'Streak Calendar', desc: 'Lịch contribution style GitHub' },
                  { key: 'widget_weekly_chart', label: 'Weekly Chart', desc: 'Biểu đồ thống kê tuần' },
                  { key: 'widget_mood_tracker', label: 'Mood Tracker', desc: 'Biểu đồ cảm xúc/năng lượng' },
                  { key: 'widget_finance_summary', label: 'Finance Summary', desc: 'Tóm tắt thu chi' },
                  { key: 'widget_health_stats', label: 'Health Stats', desc: 'Thống kê sức khỏe' },
                  { key: 'widget_pomodoro', label: 'Pomodoro Timer', desc: 'Bộ đếm Pomodoro nhanh' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="text-sm">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={getBool(item.key, true)} onCheckedChange={(c) => handleChange(item.key, c)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dashboard Layout</CardTitle>
              <CardDescription>Bố cục mặc định</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <Select value={getValue('dashboard_layout', 'grid')} onValueChange={(v) => handleChange('dashboard_layout', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid (2-3 cột)</SelectItem>
                      <SelectItem value="list">List (1 cột)</SelectItem>
                      <SelectItem value="magazine">Magazine (mixed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Số cột (desktop)</Label>
                  <Select value={getValue('dashboard_columns', '2')} onValueChange={(v) => handleChange('dashboard_columns', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 cột</SelectItem>
                      <SelectItem value="2">2 cột</SelectItem>
                      <SelectItem value="3">3 cột</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cho phép user tùy chỉnh dashboard</Label>
                  <p className="text-sm text-muted-foreground">User có thể kéo thả, ẩn/hiện widget</p>
                </div>
                <Switch checked={getBool('dashboard_user_customizable', true)} onCheckedChange={(c) => handleChange('dashboard_user_customizable', c)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />Advanced Settings</CardTitle>
              <CardDescription>Cài đặt nâng cao — cẩn thận khi thay đổi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">Hiện log debug trong console, hiện thông tin kỹ thuật</p>
                </div>
                <Switch checked={getBool('debug_mode', false)} onCheckedChange={(c) => handleChange('debug_mode', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Performance Logging</Label>
                  <p className="text-sm text-muted-foreground">Ghi log hiệu suất API, sync, render time</p>
                </div>
                <Switch checked={getBool('performance_logging', false)} onCheckedChange={(c) => handleChange('performance_logging', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Error Reporting</Label>
                  <p className="text-sm text-muted-foreground">Gửi error reports tự động (Sentry/Bugsnag)</p>
                </div>
                <Switch checked={getBool('error_reporting', true)} onCheckedChange={(c) => handleChange('error_reporting', c)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea
                  value={getValue('maintenance_message', 'Hệ thống đang bảo trì. Vui lòng quay lại sau.')}
                  onChange={(e) => handleChange('maintenance_message', e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Hiển thị khi bật Maintenance Mode (tab General)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Code Injection</CardTitle>
              <CardDescription>Inject CSS/JS tùy chỉnh — chỉ dùng nếu bạn hiểu rõ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea
                  value={getValue('custom_css', '')}
                  onChange={(e) => handleChange('custom_css', e.target.value)}
                  placeholder={"/* Custom CSS */\n.my-class {\n  color: red;\n}"}
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">CSS sẽ được inject vào {"<head>"} của trang</p>
              </div>
              <div className="space-y-2">
                <Label>Custom Header Script</Label>
                <Textarea
                  value={getValue('custom_head_script', '')}
                  onChange={(e) => handleChange('custom_head_script', e.target.value)}
                  placeholder={"<!-- Analytics, tracking, etc -->\n<script>...</script>"}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Script inject vào {"<head>"}: analytics, tracking, chatbot, v.v.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Flags (Quick)</CardTitle>
              <CardDescription>Bật/tắt nhanh các module trong app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'feature_health', label: 'Health Module', desc: 'Theo dõi sức khỏe' },
                  { key: 'feature_finance', label: 'Finance Module', desc: 'Quản lý tài chính' },
                  { key: 'feature_learning', label: 'Learning Module', desc: 'Theo dõi học tập' },
                  { key: 'feature_relationships', label: 'Relationships Module', desc: 'Quản lý mối quan hệ' },
                  { key: 'feature_ai_chat', label: 'AI Chat', desc: 'Chat với AI Coach' },
                  { key: 'feature_notes', label: 'Notes', desc: 'Ghi chú nhanh' },
                  { key: 'feature_pomodoro', label: 'Pomodoro Timer', desc: 'Bộ đếm Pomodoro' },
                  { key: 'feature_weekly_review', label: 'Weekly Review', desc: 'Đánh giá tuần' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="text-sm">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={getBool(item.key, true)} onCheckedChange={(c) => handleChange(item.key, c)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </div>
        </div>
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
    </PageTransition>
  );
}