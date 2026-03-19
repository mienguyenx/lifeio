import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, Search, Filter, Trash2, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSystemLogs, useClearSystemLogs } from '@/hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

const LOG_LEVELS = [
  { value: 'all', label: 'All Levels', icon: Info, color: 'text-muted-foreground' },
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-green-500' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'error', label: 'Error', icon: XCircle, color: 'text-destructive' },
];

const getLevelIcon = (level: string) => {
  const config = LOG_LEVELS.find(l => l.value === level);
  if (!config) return <Info className="h-4 w-4 text-blue-500" />;
  const Icon = config.icon;
  return <Icon className={`h-4 w-4 ${config.color}`} />;
};

const getLevelBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'error': return 'destructive';
    case 'warning': return 'secondary';
    case 'success': return 'default';
    default: return 'outline';
  }
};

export default function AdminLogs() {
  const { data: logs, isLoading, refetch } = useSystemLogs();
  const clearLogs = useClearSystemLogs();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const handleRefresh = () => {
    refetch();
    toast.success('Logs refreshed');
  };

  const handleClearLogs = (days?: number) => {
    const beforeDate = days ? subDays(new Date(), days).toISOString() : undefined;
    clearLogs.mutate(beforeDate);
  };

  const handleExport = () => {
    if (!filteredLogs.length) {
      toast.error('No logs to export');
      return;
    }

    const csvContent = [
      ['Timestamp', 'Level', 'Message', 'User ID'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.user_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  const filteredLogs = useMemo(() => {
    return logs?.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
      
      let matchesDate = true;
      if (filterDate !== 'all') {
        const logDate = new Date(log.created_at);
        const now = new Date();
        switch (filterDate) {
          case 'today':
            matchesDate = logDate.toDateString() === now.toDateString();
            break;
          case 'week':
            matchesDate = logDate >= subDays(now, 7);
            break;
          case 'month':
            matchesDate = logDate >= subDays(now, 30);
            break;
        }
      }
      
      return matchesSearch && matchesLevel && matchesDate;
    }) || [];
  }, [logs, searchQuery, filterLevel, filterDate]);

  const logStats = useMemo(() => {
    const stats = { info: 0, success: 0, warning: 0, error: 0, total: logs?.length || 0 };
    logs?.forEach(log => {
      if (log.level in stats) {
        stats[log.level as keyof typeof stats]++;
      }
    });
    return stats;
  }, [logs]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">View system activity and error logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />Clear Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear System Logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  Choose how to clear logs. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <Button variant="outline" onClick={() => handleClearLogs(30)}>
                  Clear logs older than 30 days
                </Button>
                <Button variant="outline" onClick={() => handleClearLogs(7)}>
                  Clear logs older than 7 days
                </Button>
                <Button variant="destructive" onClick={() => handleClearLogs()}>
                  Clear ALL logs
                </Button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.info}</p>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.success}</p>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.warning}</p>
              <p className="text-xs text-muted-foreground">Warning</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.error}</p>
              <p className="text-xs text-muted-foreground">Error</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search logs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map(level => (
              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Logs</CardTitle>
          <CardDescription>Showing {filteredLogs.length} of {logs?.length || 0} entries</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium break-words">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </p>
                      {log.user_id && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.user_id.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={getLevelBadgeVariant(log.level)}>
                    {log.level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No logs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || filterLevel !== 'all' || filterDate !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Logs will appear here when system events occur'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}