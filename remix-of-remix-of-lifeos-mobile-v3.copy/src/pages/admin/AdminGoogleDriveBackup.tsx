import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Cloud, CloudOff, Upload, Download, Trash2, RefreshCw, 
  Settings, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, HelpCircle, ExternalLink, Copy, Check
} from 'lucide-react';
import { useAdminGoogleDriveBackup } from '@/hooks/useAdminGoogleDriveBackup';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AdminGoogleDriveBackup() {
  const isMobile = useIsMobile();
  const {
    isAuthenticated,
    isLoading,
    backupHistory,
    backupProgress,
    settings,
    currentBackupId,
    progress,
    currentStep,
    signIn,
    signOut,
    createBackup,
    restoreFromBackup,
    deleteBackup,
    loadBackupHistory,
    loadBackupProgress,
    updateSettings,
  } = useAdminGoogleDriveBackup();

  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState({
    google_drive_client_id: '',
    google_drive_api_key: '',
    backup_frequency: 'daily' as 'daily' | 'weekly' | 'manual',
    auto_backup_enabled: false,
    backup_retention_days: 30,
  });

  useEffect(() => {
    if (settings) {
      setTempSettings({
        google_drive_client_id: settings.google_drive_client_id,
        google_drive_api_key: settings.google_drive_api_key,
        backup_frequency: settings.backup_frequency,
        auto_backup_enabled: settings.auto_backup_enabled,
        backup_retention_days: settings.backup_retention_days,
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    await updateSettings({
      ...settings!,
      ...tempSettings,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Đã sao chép!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Hoàn thành</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Đang xử lý</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Thất bại</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Chờ xử lý</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn("p-4 md:p-6 space-y-6", !isMobile && "max-w-7xl mx-auto")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Cloud className="w-6 h-6" /> Sao lưu Google Drive
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý sao lưu dữ liệu lên Google Drive cho tất cả users
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSetupGuide(!showSetupGuide)}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Hướng dẫn cài đặt
        </Button>
      </div>

      {/* Setup Guide */}
      {showSetupGuide && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Hướng dẫn cài đặt Google Drive API
            </CardTitle>
            <CardDescription>
              Làm theo các bước sau để cấu hình Google Drive backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                <div className="flex-1">
                  <p className="font-medium">Tạo Google Cloud Project</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Truy cập{' '}
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>
                    {' '}và tạo project mới hoặc chọn project hiện có
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                <div className="flex-1">
                  <p className="font-medium">Bật Google Drive API</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Trong project, vào <strong>APIs & Services → Library</strong>, tìm và bật <strong>Google Drive API</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                <div className="flex-1">
                  <p className="font-medium">Tạo OAuth 2.0 Credentials</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vào <strong>APIs & Services → Credentials</strong>, tạo <strong>OAuth 2.0 Client ID</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc space-y-1">
                    <li>Application type: <strong>Web application</strong></li>
                    <li>Authorized JavaScript origins: <code className="bg-muted px-1 rounded">https://life.hoanong.com</code></li>
                    <li>Authorized redirect URIs: <code className="bg-muted px-1 rounded">https://life.hoanong.com</code></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                <div className="flex-1">
                  <p className="font-medium">Lấy Client ID và API Key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sau khi tạo OAuth Client, copy <strong>Client ID</strong> và tạo <strong>API Key</strong> (nếu chưa có)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">5</div>
                <div className="flex-1">
                  <p className="font-medium">Cấu hình trong Admin Panel</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dán Client ID và API Key vào form bên dưới, sau đó bật tính năng backup
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">6</div>
                <div className="flex-1">
                  <p className="font-medium">Cập nhật Environment Variables</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thêm vào file <code className="bg-muted px-1 rounded">.env</code> hoặc Docker build args:
                  </p>
                  <div className="mt-2 p-3 bg-muted rounded-md font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span>VITE_GOOGLE_CLIENT_ID=your_client_id</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard('VITE_GOOGLE_CLIENT_ID=your_client_id', 'env1')}
                      >
                        {copiedField === 'env1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>VITE_GOOGLE_API_KEY=your_api_key</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard('VITE_GOOGLE_API_KEY=your_api_key', 'env2')}
                      >
                        {copiedField === 'env2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">7</div>
                <div className="flex-1">
                  <p className="font-medium">Rebuild và Test</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rebuild Docker container và test kết nối Google Drive
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          <TabsTrigger value="backup">Tạo Backup</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Google Drive</CardTitle>
              <CardDescription>
                Cấu hình thông tin kết nối Google Drive API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Google Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="client_id"
                    type="password"
                    value={tempSettings.google_drive_client_id}
                    onChange={(e) => setTempSettings({ ...tempSettings, google_drive_client_id: e.target.value })}
                    placeholder="Nhập Google Client ID"
                  />
                  {tempSettings.google_drive_client_id && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(tempSettings.google_drive_client_id, 'client_id')}
                    >
                      {copiedField === 'client_id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Client ID từ Google Cloud Console
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">Google API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api_key"
                    type="password"
                    value={tempSettings.google_drive_api_key}
                    onChange={(e) => setTempSettings({ ...tempSettings, google_drive_api_key: e.target.value })}
                    placeholder="Nhập Google API Key"
                  />
                  {tempSettings.google_drive_api_key && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(tempSettings.google_drive_api_key, 'api_key')}
                    >
                      {copiedField === 'api_key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  API Key từ Google Cloud Console (optional, nhưng khuyến nghị)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tần suất backup tự động</Label>
                    <p className="text-sm text-muted-foreground">Tần suất backup tự động cho users</p>
                  </div>
                  <Select
                    value={tempSettings.backup_frequency}
                    onValueChange={(v) => setTempSettings({ ...tempSettings, backup_frequency: v as any })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Hàng ngày</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                      <SelectItem value="manual">Thủ công</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bật backup tự động</Label>
                    <p className="text-sm text-muted-foreground">Tự động backup dữ liệu theo lịch</p>
                  </div>
                  <Switch
                    checked={tempSettings.auto_backup_enabled}
                    onCheckedChange={(checked) => setTempSettings({ ...tempSettings, auto_backup_enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention_days">Số ngày giữ backup</Label>
                  <Input
                    id="retention_days"
                    type="number"
                    min="1"
                    max="365"
                    value={tempSettings.backup_retention_days}
                    onChange={(e) => setTempSettings({ ...tempSettings, backup_retention_days: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Backup cũ hơn số ngày này sẽ tự động xóa
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Lưu cài đặt
              </Button>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái kết nối</CardTitle>
            </CardHeader>
            <CardContent>
              {!settings?.google_drive_enabled || !settings?.google_drive_client_id ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium">Chưa cấu hình</p>
                    <p className="text-sm text-muted-foreground">
                      Vui lòng cấu hình Google Client ID và bật tính năng backup
                    </p>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <CloudOff className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Chưa kết nối</p>
                      <p className="text-sm text-muted-foreground">
                        Kết nối với Google Drive để bắt đầu backup
                      </p>
                    </div>
                  </div>
                  <Button onClick={signIn} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Đang kết nối...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 mr-2" />
                        Kết nối Google Drive
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                    <Cloud className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Đã kết nối</p>
                      <p className="text-sm text-muted-foreground">
                        Google Drive đã sẵn sàng để backup
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={signOut} disabled={isLoading} className="w-full">
                    <CloudOff className="w-4 h-4 mr-2" />
                    Ngắt kết nối
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tạo Backup</CardTitle>
              <CardDescription>
                Tạo backup dữ liệu lên Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentBackupId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{currentStep || 'Đang xử lý...'}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Button
                onClick={() => createBackup()}
                disabled={!isAuthenticated || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo backup...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Tạo Backup Ngay
                  </>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground text-center">
                  Vui lòng kết nối Google Drive trong tab Cài đặt trước
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lịch sử Backup</CardTitle>
                  <CardDescription>
                    {backupHistory.length} backup đã tạo
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadBackupHistory}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {backupHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có backup nào</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {backupHistory.map((backup) => (
                      <Card key={backup.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{backup.file_name}</span>
                              {getStatusBadge(backup.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                              </span>
                              {backup.file_size && (
                                <span>{formatFileSize(backup.file_size)}</span>
                              )}
                              {backup.progress < 100 && backup.status === 'in_progress' && (
                                <div className="flex items-center gap-2">
                                  <Progress value={backup.progress} className="w-24 h-1.5" />
                                  <span className="text-xs">{backup.progress}%</span>
                                </div>
                              )}
                            </div>
                            {backup.error_message && (
                              <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                                <AlertCircle className="w-4 h-4 mt-0.5" />
                                <span>{backup.error_message}</span>
                              </div>
                            )}
                            {backup.status === 'in_progress' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadBackupProgress(backup.id)}
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Xem tiến trình
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {backup.status === 'completed' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Khôi phục từ backup?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Dữ liệu hiện tại sẽ bị thay thế bằng dữ liệu từ backup này.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => restoreFromBackup(backup.id)}>
                                      Khôi phục
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa backup?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Backup này sẽ bị xóa vĩnh viễn và không thể khôi phục.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteBackup(backup.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

