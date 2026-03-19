import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Calendar, Settings, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Goal } from '@/types/lifeos';
import { differenceInDays, parseISO, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface GoalNotificationsCardProps {
  goals: Goal[];
}

export function GoalNotificationsCard({ goals }: GoalNotificationsCardProps) {
  const updateGoal = useLifeOSStore((s) => s.updateGoal);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeGoals = goals.filter(g => !g.completedAt && g.status !== 'archived');
  const goalsWithDeadline = activeGoals.filter(g => g.targetDate);
  const enabledCount = activeGoals.filter(g => g.pushEnabled).length;

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Trình duyệt không hỗ trợ thông báo');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Đã bật thông báo');
        // Send test notification
        new Notification('LifeOS Goals', {
          body: 'Thông báo đã được kích hoạt!',
          icon: '/favicon.ico',
        });
        return true;
      } else {
        toast.error('Không được cấp quyền thông báo');
        return false;
      }
    } catch (error) {
      toast.error('Lỗi khi yêu cầu quyền thông báo');
      return false;
    }
  };

  const toggleGoalNotification = async (goalId: string, enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    updateGoal(goalId, { pushEnabled: enabled });
    toast.success(enabled ? 'Đã bật thông báo' : 'Đã tắt thông báo');
  };

  const toggleDeadlineNotification = (goalId: string, enabled: boolean) => {
    updateGoal(goalId, { pushDeadline: enabled });
  };

  const toggleWeeklyNotification = (goalId: string, enabled: boolean) => {
    updateGoal(goalId, { pushWeekly: enabled });
  };

  const enableAllNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    activeGoals.forEach(goal => {
      updateGoal(goal.id, { pushEnabled: true, pushDeadline: true, pushWeekly: true });
    });
    toast.success('Đã bật thông báo cho tất cả goals');
  };

  // Upcoming deadlines
  const upcomingDeadlines = goalsWithDeadline
    .map(g => ({
      goal: g,
      daysLeft: differenceInDays(parseISO(g.targetDate!), new Date()),
    }))
    .filter(d => d.daysLeft >= 0 && d.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Thông báo Goals
          </CardTitle>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cài đặt thông báo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Permission Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Quyền thông báo</p>
                    <p className="text-xs text-muted-foreground">
                      {permission === 'granted' ? 'Đã cấp phép' : 
                       permission === 'denied' ? 'Đã từ chối' : 'Chưa cấp phép'}
                    </p>
                  </div>
                  {permission !== 'granted' && (
                    <Button size="sm" onClick={requestPermission}>
                      Cấp quyền
                    </Button>
                  )}
                  {permission === 'granted' && (
                    <Badge variant="secondary" className="bg-success/20 text-success">
                      <Check className="w-3 h-3 mr-1" /> OK
                    </Badge>
                  )}
                </div>

                {/* Enable All */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={enableAllNotifications}
                  disabled={permission === 'denied'}
                >
                  <BellRing className="w-4 h-4 mr-2" />
                  Bật tất cả thông báo
                </Button>

                {/* Per-goal settings */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Cài đặt theo goal</p>
                  {activeGoals.map(goal => (
                    <div key={goal.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{goal.title}</p>
                        <Switch
                          checked={goal.pushEnabled || false}
                          onCheckedChange={(checked) => toggleGoalNotification(goal.id, checked)}
                        />
                      </div>
                      {goal.pushEnabled && (
                        <div className="pl-2 space-y-2 border-l-2 border-muted ml-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Nhắc deadline</Label>
                            <Switch
                              checked={goal.pushDeadline ?? true}
                              onCheckedChange={(checked) => toggleDeadlineNotification(goal.id, checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Nhắc hàng tuần</Label>
                            <Switch
                              checked={goal.pushWeekly ?? false}
                              onCheckedChange={(checked) => toggleWeeklyNotification(goal.id, checked)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {permission === 'granted' ? (
              <BellRing className="w-4 h-4 text-success" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs">
              {enabledCount}/{activeGoals.length} goals được thông báo
            </span>
          </div>
          {permission !== 'granted' && (
            <Button size="sm" variant="outline" onClick={requestPermission}>
              Bật
            </Button>
          )}
        </div>

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Deadline sắp tới
            </p>
            <div className="space-y-1">
              {upcomingDeadlines.slice(0, 3).map(({ goal, daysLeft }) => (
                <div key={goal.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                  <span className="truncate flex-1">{goal.title}</span>
                  <Badge 
                    variant="secondary" 
                    className={
                      daysLeft === 0 ? "bg-destructive/20 text-destructive" :
                      daysLeft <= 3 ? "bg-warning/20 text-warning" :
                      "bg-muted"
                    }
                  >
                    {daysLeft === 0 ? 'Hôm nay' : `${daysLeft} ngày`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingDeadlines.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Không có deadline trong 2 tuần tới
          </p>
        )}
      </CardContent>
    </Card>
  );
}
