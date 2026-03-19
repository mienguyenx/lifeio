import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Mail, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Trash2,
  Download
} from "lucide-react";

interface EmailLog {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  template_type: string | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
  sent_by: string | null;
  created_at: string;
  sent_at: string | null;
}

const useEmailLogs = () => {
  return useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data as EmailLog[];
    },
  });
};

const useClearEmailLogs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (days?: number) => {
      let query = supabase.from("email_logs").delete();
      
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        query = query.lt("created_at", cutoffDate.toISOString());
      } else {
        query = query.neq("id", "00000000-0000-0000-0000-000000000000");
      }
      
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      toast.success("Đã xóa lịch sử email");
    },
    onError: (error) => {
      toast.error("Lỗi khi xóa: " + (error as Error).message);
    },
  });
};

export default function AdminEmailLogs() {
  const { data: logs, isLoading, refetch } = useEmailLogs();
  const clearLogs = useClearEmailLogs();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter((log) => {
      const matchesSearch = 
        log.to_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.to_name?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || log.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    if (!logs) return { total: 0, success: 0, failed: 0, pending: 0 };
    
    return {
      total: logs.length,
      success: logs.filter(l => l.status === "success").length,
      failed: logs.filter(l => l.status === "failed").length,
      pending: logs.filter(l => l.status === "pending").length,
    };
  }, [logs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Thành công</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Thất bại</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Đang gửi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExport = () => {
    if (!filteredLogs.length) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const csvContent = [
      ["ID", "Email", "Tên", "Tiêu đề", "Trạng thái", "Lỗi", "Thời gian tạo", "Thời gian gửi"].join(","),
      ...filteredLogs.map(log => [
        log.id,
        log.to_email,
        log.to_name || "",
        `"${log.subject.replace(/"/g, '""')}"`,
        log.status,
        log.error_message || "",
        log.created_at,
        log.sent_at || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `email-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Đã xuất file CSV");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch sử Email</h1>
          <p className="text-muted-foreground">Theo dõi tất cả email đã gửi từ hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => clearLogs.mutate(30)}
            disabled={clearLogs.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa cũ hơn 30 ngày
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Tổng email</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.success}</p>
                <p className="text-sm text-muted-foreground">Thành công</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Thất bại</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Đang gửi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo email, tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="pending">Đang gửi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Email ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có email nào được gửi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.to_email}</p>
                        {log.to_name && (
                          <p className="text-sm text-muted-foreground">{log.to_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.template_type || "custom"}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Email</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email nhận</p>
                  <p className="font-medium">{selectedLog.to_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tên người nhận</p>
                  <p className="font-medium">{selectedLog.to_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tiêu đề</p>
                  <p className="font-medium">{selectedLog.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại template</p>
                  <p className="font-medium">{selectedLog.template_type || "custom"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian tạo</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                  </p>
                </div>
                {selectedLog.sent_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian gửi</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.sent_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedLog.error_message && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Lỗi:</p>
                  <p className="text-sm">{selectedLog.error_message}</p>
                </div>
              )}
              
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata:</p>
                  <pre className="p-4 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
