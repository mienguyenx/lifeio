import { useState } from 'react';
import { Flame, Bell, BarChart3, GripVertical, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GoalFocusMode } from './GoalFocusMode';
import { GoalStreaksCard } from './GoalStreaksCard';
import { GoalNotificationsCard } from './GoalNotificationsCard';
import { GoalAnalyticsCard } from './GoalAnalyticsCard';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import type { Goal } from '@/types/lifeos';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';

interface GoalSidebarProps {
  goals: Goal[];
  onViewGoal: (goal: Goal) => void;
}

const TAB_CONFIG = {
  stats: { icon: BarChart3, label: 'Thống kê' },
  streak: { icon: Flame, label: 'Streak hoạt động' },
  notify: { icon: Bell, label: 'Thông báo' },
} as const;

export function GoalSidebar({ goals, onViewGoal }: GoalSidebarProps) {
  const tabOrder = useLifeOSStore((s) => s.goalSidebarTabOrder);
  const setTabOrder = useLifeOSStore((s) => s.setGoalSidebarTabOrder);
  const [activeTab, setActiveTab] = useState(tabOrder[0] || 'stats');
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  
  const activeGoals = goals.filter(g => !g.completedAt && g.status !== 'archived');
  const totalStreak = activeGoals.reduce((sum, g) => sum + (g.currentStreak || 0), 0);

  const handleDragStart = (tab: string) => {
    setDraggedTab(tab);
  };

  const handleDragOver = (e: React.DragEvent, targetTab: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetTab) return;
    
    const newOrder = [...tabOrder];
    const draggedIndex = newOrder.indexOf(draggedTab);
    const targetIndex = newOrder.indexOf(targetTab);
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTab);
    setTabOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
  };

  const moveTab = (tab: string, direction: 'up' | 'down') => {
    const newOrder = [...tabOrder];
    const index = newOrder.indexOf(tab);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setTabOrder(newOrder);
  };

  return (
    <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      {/* Focus Mode - Always visible at top */}
      <GoalFocusMode onViewGoal={onViewGoal} />

      {/* Tabbed Navigation */}
      <Card>
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-3 h-9">
                {tabOrder.map((tabId) => {
                  const config = TAB_CONFIG[tabId as keyof typeof TAB_CONFIG];
                  if (!config) return null;
                  const Icon = config.icon;
                  
                  return (
                    <TabsTrigger 
                      key={tabId}
                      value={tabId} 
                      className={cn(
                        "text-xs px-1",
                        tabId === 'streak' && "data-[state=active]:bg-warning/20 data-[state=active]:text-warning",
                        tabId !== 'streak' && "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      )}
                      draggable
                      onDragStart={() => handleDragStart(tabId)}
                      onDragOver={(e) => handleDragOver(e, tabId)}
                      onDragEnd={handleDragEnd}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tabId === 'streak' && totalStreak > 0 && (
                        <span className="absolute -top-1 -right-1 text-[9px] bg-warning text-warning-foreground rounded-full w-4 h-4 flex items-center justify-center">
                          {totalStreak > 9 ? '9+' : totalStreak}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            
            {/* Help & Settings */}
            <ModuleHelpButton module="goals" className="h-7 w-7 ml-0.5" />
            
            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <p className="text-xs font-medium mb-2">Sắp xếp tabs</p>
                <div className="space-y-1">
                  {tabOrder.map((tabId, index) => {
                    const config = TAB_CONFIG[tabId as keyof typeof TAB_CONFIG];
                    if (!config) return null;
                    const Icon = config.icon;
                    
                    return (
                      <div 
                        key={tabId}
                        className="flex items-center gap-2 p-1.5 rounded bg-muted/50 text-xs"
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
                        <Icon className="w-3.5 h-3.5" />
                        <span className="flex-1 truncate">{config.label}</span>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => moveTab(tabId, 'up')}
                            disabled={index === 0}
                          >
                            <span className="text-[10px]">↑</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => moveTab(tabId, 'down')}
                            disabled={index === tabOrder.length - 1}
                          >
                            <span className="text-[10px]">↓</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            {TAB_CONFIG[activeTab as keyof typeof TAB_CONFIG]?.label}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <GoalAnalyticsCard goals={goals} />
      )}

      {activeTab === 'streak' && (
        <GoalStreaksCard goals={goals} />
      )}

      {activeTab === 'notify' && (
        <GoalNotificationsCard goals={goals} />
      )}
    </div>
  );
}
