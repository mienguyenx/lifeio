import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  CloudOff, 
  Cloud,
  HardDrive,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  Zap,
  Activity,
  Timer,
  Bell,
  BellOff,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { activeSupabase, isExternalSupabaseConfigured } from '@/integrations/supabase/externalClient';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SyncLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'sync';
  entity: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

interface TableCount {
  name: string;
  count: number;
}

interface PingResult {
  table: string;
  responseTime: number;
  status: 'success' | 'error';
  error?: string;
}

// Threshold settings
const THRESHOLDS = {
  excellent: 100,   // < 100ms = excellent
  good: 300,        // < 300ms = good
  warning: 500,     // < 500ms = warning
  critical: 1000    // >= 1000ms = critical
};

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'error';
  message: string;
  table?: string;
  timestamp: Date;
}

export function DatabaseStatusCard() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResults, setPingResults] = useState<PingResult[]>([]);
  const [pingStats, setPingStats] = useState<{
    avgTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
  } | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const checkConnection = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await activeSupabase.from('profiles').select('id', { count: 'exact', head: true });
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
      if (error) {
        setIsConnected(false);
        addSyncLog('sync', 'connection', 'error', `Kết nối thất bại: ${error.message}`);
      } else {
        setIsConnected(true);
        addSyncLog('sync', 'connection', 'success', `Kết nối thành công (${endTime - startTime}ms)`);
      }
    } catch (err) {
      setIsConnected(false);
      addSyncLog('sync', 'connection', 'error', 'Không thể kết nối database');
    }
    
    setLastChecked(new Date());
    setIsChecking(false);
  };

  const fetchTableCounts = async () => {
    const tables = [
      'profiles',
      'goals',
      'habits',
      'tasks',
      'journal_entries',
      'notes',
      'pomodoro_sessions',
      'habit_completions',
      'goal_milestones',
      'subtasks'
    ] as const;

    const counts: TableCount[] = [];
    let total = 0;

    for (const table of tables) {
      try {
        const { count } = await activeSupabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        const recordCount = count || 0;
        counts.push({ name: table, count: recordCount });
        total += recordCount;
      } catch {
        counts.push({ name: table, count: 0 });
      }
    }

    setTableCounts(counts);
    setTotalRecords(total);
  };

  const runPingTest = async () => {
    setIsPinging(true);
    setPingResults([]);
    
    const tables = [
      'profiles',
      'goals',
      'habits',
      'tasks',
      'journal_entries',
      'notes'
    ] as const;

    const results: PingResult[] = [];

    for (const table of tables) {
      const startTime = performance.now();
      try {
        const { error } = await activeSupabase
          .from(table)
          .select('id', { count: 'exact', head: true });
        
        const endTime = performance.now();
        const time = Math.round(endTime - startTime);
        
        if (error) {
          results.push({
            table,
            responseTime: time,
            status: 'error',
            error: error.message
          });
          addSyncLog('sync', table, 'error', `Ping ${table}: ${error.message}`);
        } else {
          results.push({
            table,
            responseTime: time,
            status: 'success'
          });
          addSyncLog('sync', table, 'success', `Ping ${table}: ${time}ms`);
        }
      } catch (err) {
        const endTime = performance.now();
        results.push({
          table,
          responseTime: Math.round(endTime - startTime),
          status: 'error',
          error: 'Connection failed'
        });
      }
      
      setPingResults([...results]);
    }

    // Calculate stats
    const successResults = results.filter(r => r.status === 'success');
    if (successResults.length > 0) {
      const times = successResults.map(r => r.responseTime);
      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const maxTime = Math.max(...times);
      
      setPingStats({
        avgTime,
        minTime: Math.min(...times),
        maxTime,
        successRate: Math.round((successResults.length / results.length) * 100)
      });

      // Check for alerts
      if (alertsEnabled) {
        checkAndCreateAlerts(results, avgTime, maxTime);
      }
    }

    // Check for errors
    const errorResults = results.filter(r => r.status === 'error');
    if (errorResults.length > 0 && alertsEnabled) {
      errorResults.forEach(r => {
        addAlert('error', `Không thể kết nối đến bảng "${r.table}"`, r.table);
      });
    }

    setIsPinging(false);
  };

  const checkAndCreateAlerts = (results: PingResult[], avgTime: number, maxTime: number) => {
    // Clear old alerts
    setAlerts([]);

    // Check average response time
    if (avgTime >= THRESHOLDS.critical) {
      addAlert('critical', `Thời gian phản hồi trung bình quá cao: ${avgTime}ms (ngưỡng: ${THRESHOLDS.critical}ms)`);
      toast.error('Cảnh báo hiệu suất', {
        description: `Response time trung bình ${avgTime}ms vượt ngưỡng critical!`
      });
    } else if (avgTime >= THRESHOLDS.warning) {
      addAlert('warning', `Thời gian phản hồi trung bình cao: ${avgTime}ms (ngưỡng: ${THRESHOLDS.warning}ms)`);
      toast.warning('Cảnh báo hiệu suất', {
        description: `Response time trung bình ${avgTime}ms vượt ngưỡng warning`
      });
    }

    // Check individual slow tables
    results.forEach(r => {
      if (r.status === 'success') {
        if (r.responseTime >= THRESHOLDS.critical) {
          addAlert('critical', `Bảng "${r.table}" phản hồi rất chậm: ${r.responseTime}ms`, r.table);
        } else if (r.responseTime >= THRESHOLDS.warning) {
          addAlert('warning', `Bảng "${r.table}" phản hồi chậm: ${r.responseTime}ms`, r.table);
        }
      }
    });

    // Check max response time
    if (maxTime >= THRESHOLDS.critical) {
      addAlert('critical', `Response time cao nhất: ${maxTime}ms - Cần kiểm tra database`);
    }
  };

  const addAlert = (type: PerformanceAlert['type'], message: string, table?: string) => {
    const newAlert: PerformanceAlert = {
      id: crypto.randomUUID(),
      type,
      message,
      table,
      timestamp: new Date()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 10));
  };

  const addSyncLog = (action: SyncLog['action'], entity: string, status: SyncLog['status'], message: string) => {
    const newLog: SyncLog = {
      id: crypto.randomUUID(),
      action,
      entity,
      status,
      message,
      timestamp: new Date()
    };
    setSyncLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  useEffect(() => {
    checkConnection();
    fetchTableCounts();

    // Listen for sync events from localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sync-log') {
        try {
          const logData = JSON.parse(e.newValue || '{}');
          addSyncLog(logData.action, logData.entity, logData.status, logData.message);
        } catch { /* ignore parse errors */ }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchTableCounts();
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: SyncLog['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-destructive';
      case 'pending': return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: SyncLog['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3" />;
      case 'error': return <XCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
    }
  };

  const estimatedStorageKB = totalRecords * 0.5; // Rough estimate: 0.5KB per record
  const maxStorageKB = 500000; // 500MB limit estimate
  const storagePercent = Math.min((estimatedStorageKB / maxStorageKB) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert 
              key={alert.id} 
              variant={alert.type === 'critical' || alert.type === 'error' ? 'destructive' : 'default'}
              className={alert.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' : ''}
            >
              {alert.type === 'critical' ? (
                <TrendingDown className="h-4 w-4" />
              ) : alert.type === 'error' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <AlertTitle className="flex items-center gap-2">
                {alert.type === 'critical' ? 'Critical' : alert.type === 'error' ? 'Error' : 'Warning'}
                {alert.table && (
                  <Badge variant="outline" className="text-xs">{alert.table}</Badge>
                )}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Trạng thái Database
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkConnection}
              disabled={isChecking}
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              {isExternalSupabaseConfigured ? (
                <Cloud className="w-5 h-5 text-blue-500" />
              ) : (
                <CloudOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  Supabase Local
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastChecked && `Kiểm tra: ${formatDistanceToNow(lastChecked, { addSuffix: true, locale: vi })}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected === null ? (
                <Badge variant="secondary">Đang kiểm tra...</Badge>
              ) : isConnected ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Đã kết nối
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Mất kết nối
                </Badge>
              )}
            </div>
          </div>

          {/* Response Time */}
          {responseTime !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Thời gian phản hồi</span>
              <Badge variant={responseTime < 500 ? 'default' : responseTime < 1000 ? 'secondary' : 'destructive'}>
                {responseTime}ms
              </Badge>
            </div>
          )}

          {/* Storage Estimate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Dung lượng ước tính
              </span>
              <span className="text-muted-foreground">
                {estimatedStorageKB < 1000 
                  ? `${estimatedStorageKB.toFixed(1)} KB`
                  : `${(estimatedStorageKB / 1000).toFixed(2)} MB`
                }
              </span>
            </div>
            <Progress value={storagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {totalRecords.toLocaleString()} bản ghi trên {tableCounts.length} bảng
            </p>
          </div>

          {/* Alert Toggle & Ping Test Button */}
          <div className="flex gap-2">
            <Button 
              onClick={runPingTest} 
              disabled={isPinging}
              className="flex-1"
              variant="outline"
            >
              {isPinging ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang ping...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test Ping
                </>
              )}
            </Button>
            <Button
              variant={alertsEnabled ? 'default' : 'outline'}
              size="icon"
              onClick={() => {
                setAlertsEnabled(!alertsEnabled);
                toast.info(alertsEnabled ? 'Đã tắt cảnh báo' : 'Đã bật cảnh báo');
              }}
              title={alertsEnabled ? 'Tắt cảnh báo' : 'Bật cảnh báo'}
            >
              {alertsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Threshold Info */}
          <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
            <div className="p-1 rounded bg-green-500/10 text-green-500">
              &lt;{THRESHOLDS.excellent}ms
              <br />Excellent
            </div>
            <div className="p-1 rounded bg-blue-500/10 text-blue-500">
              &lt;{THRESHOLDS.good}ms
              <br />Good
            </div>
            <div className="p-1 rounded bg-yellow-500/10 text-yellow-500">
              &lt;{THRESHOLDS.warning}ms
              <br />Warning
            </div>
            <div className="p-1 rounded bg-destructive/10 text-destructive">
              ≥{THRESHOLDS.critical}ms
              <br />Critical
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ping Results Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Ping Results
            </CardTitle>
            {pingStats && (
              <Badge variant={pingStats.successRate === 100 ? 'default' : 'destructive'}>
                {pingStats.successRate}% success
              </Badge>
            )}
          </div>
          <CardDescription>Chi tiết response time theo bảng</CardDescription>
        </CardHeader>
        <CardContent>
          {pingResults.length > 0 ? (
            <div className="space-y-3">
              {/* Stats Summary */}
              {pingStats && (
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border bg-muted/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-500">{pingStats.minTime}ms</p>
                    <p className="text-xs text-muted-foreground">Min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pingStats.avgTime}ms</p>
                    <p className="text-xs text-muted-foreground">Trung bình</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-500">{pingStats.maxTime}ms</p>
                    <p className="text-xs text-muted-foreground">Max</p>
                  </div>
                </div>
              )}

              {/* Individual Results */}
              <div className="space-y-2">
                {pingResults.map((result) => (
                  <div 
                    key={result.table}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm">{result.table.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.status === 'success' ? (
                        <>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                result.responseTime < 100 ? 'bg-green-500' :
                                result.responseTime < 300 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${Math.min((result.responseTime / 500) * 100, 100)}%` }}
                            />
                          </div>
                          <Badge variant={
                            result.responseTime < 100 ? 'default' :
                            result.responseTime < 300 ? 'secondary' : 'destructive'
                          }>
                            {result.responseTime}ms
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="destructive">Error</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Timer className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nhấn "Test Ping" để kiểm tra</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Logs Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Sync Logs
            </CardTitle>
            <Badge variant="outline">{syncLogs.length} logs</Badge>
          </div>
          <CardDescription>Lịch sử đồng bộ Local ↔ Database</CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 rounded-lg border bg-card text-xs"
                  >
                    <span className={getStatusColor(log.status)}>
                      {getStatusIcon(log.status)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{log.message}</p>
                      <p className="text-muted-foreground">
                        {format(log.timestamp, 'HH:mm:ss', { locale: vi })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {log.entity}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Chưa có sync logs</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Records Card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Phân bố dữ liệu theo bảng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {tableCounts.map((table) => (
              <div 
                key={table.name} 
                className="p-3 rounded-lg border bg-card text-center"
              >
                <p className="text-lg font-bold">{table.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {table.name.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
