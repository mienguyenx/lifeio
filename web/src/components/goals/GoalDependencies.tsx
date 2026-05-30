import { useState } from 'react';
import { Link2, Plus, X, ChevronRight, CheckCircle2, Circle, AlertTriangle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Goal, LIFE_AREAS } from '@/types/lifeos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GoalDependenciesProps {
  goal: Goal;
}

export function GoalDependencies({ goal }: GoalDependenciesProps) {
  const goals = useLifeOSStore(s => s.goals);
  const updateGoal = useLifeOSStore(s => s.updateGoal);
  const [selectedPrereq, setSelectedPrereq] = useState<string>('');

  const dependencies = goal.dependencies || [];
  const dependents = goal.dependents || [];

  // Get prerequisite goals (goals that must be completed before this goal)
  const prerequisiteGoals = goals.filter(g => dependencies.includes(g.id));
  
  // Get dependent goals (goals that depend on this goal)
  const dependentGoals = goals.filter(g => dependents.includes(g.id));

  // Available goals to add as prerequisite (not already a dependency, not self, not completed)
  const availablePrereqs = goals.filter(g => 
    g.id !== goal.id && 
    !dependencies.includes(g.id) &&
    !dependents.includes(g.id) && // Prevent circular dependencies
    !g.completedAt
  );

  // Check if all prerequisites are met
  const allPrereqsMet = prerequisiteGoals.every(g => g.completedAt);
  const canStart = dependencies.length === 0 || allPrereqsMet;

  const handleAddPrerequisite = () => {
    if (!selectedPrereq) return;

    // Check for circular dependency
    const targetGoal = goals.find(g => g.id === selectedPrereq);
    if (targetGoal?.dependencies?.includes(goal.id)) {
      toast.error('Không thể tạo dependency vòng');
      return;
    }

    // Update current goal's dependencies
    updateGoal(goal.id, {
      dependencies: [...dependencies, selectedPrereq]
    });

    // Update target goal's dependents
    const targetDependents = targetGoal?.dependents || [];
    updateGoal(selectedPrereq, {
      dependents: [...targetDependents, goal.id]
    });

    setSelectedPrereq('');
    toast.success('Đã thêm prerequisite');
  };

  const handleRemovePrerequisite = (prereqId: string) => {
    // Update current goal's dependencies
    updateGoal(goal.id, {
      dependencies: dependencies.filter(id => id !== prereqId)
    });

    // Update target goal's dependents
    const prereqGoal = goals.find(g => g.id === prereqId);
    if (prereqGoal) {
      updateGoal(prereqId, {
        dependents: (prereqGoal.dependents || []).filter(id => id !== goal.id)
      });
    }

    toast.success('Đã xóa prerequisite');
  };

  const GoalMiniCard = ({ g, type }: { g: Goal; type: 'prereq' | 'dependent' }) => {
    const area = LIFE_AREAS.find(a => a.id === g.area);
    const isCompleted = !!g.completedAt;

    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        isCompleted ? "bg-success/10 border-success/30" : "bg-muted/50"
      )}>
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle cx="20" cy="20" r="16" stroke="hsl(var(--secondary))" strokeWidth="3" fill="none" />
            <circle
              cx="20" cy="20" r="16"
              stroke={isCompleted ? "hsl(var(--success))" : `hsl(var(--${area?.color}))`}
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${(g.progress / 100) * 100.5} 100.5`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {g.progress}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{g.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: `hsl(var(--${area?.color}))` }}>
              {area?.icon}
            </span>
            {isCompleted ? (
              <Badge variant="default" className="bg-success text-[10px] h-4">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Xong
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {g.milestones.filter(m => m.completed).length}/{g.milestones.length} milestones
              </span>
            )}
          </div>
        </div>
        {type === 'prereq' && !goal.completedAt && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => handleRemovePrerequisite(g.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {!canStart && !goal.completedAt && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium text-sm">Goal đang bị khóa</p>
              <p className="text-xs text-muted-foreground">
                Hoàn thành các prerequisite goals bên dưới để mở khóa
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites (goals that must be completed first) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Prerequisites ({prerequisiteGoals.length})
            {!canStart && <AlertTriangle className="w-4 h-4 text-warning" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prerequisiteGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Không có prerequisite - goal này có thể bắt đầu ngay
            </p>
          ) : (
            <div className="space-y-2">
              {prerequisiteGoals.map(g => (
                <GoalMiniCard key={g.id} g={g} type="prereq" />
              ))}
            </div>
          )}

          {/* Add prerequisite */}
          {!goal.completedAt && availablePrereqs.length > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              <Select value={selectedPrereq} onValueChange={setSelectedPrereq}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Chọn prerequisite goal..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePrereqs.map(g => {
                    const area = LIFE_AREAS.find(a => a.id === g.area);
                    return (
                      <SelectItem key={g.id} value={g.id}>
                        {area?.icon} {g.title} ({g.progress}%)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button size="icon" onClick={handleAddPrerequisite} disabled={!selectedPrereq}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependents (goals that depend on this goal) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Goals phụ thuộc ({dependentGoals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dependentGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Không có goal nào phụ thuộc vào goal này
            </p>
          ) : (
            <div className="space-y-2">
              {dependentGoals.map(g => (
                <GoalMiniCard key={g.id} g={g} type="dependent" />
              ))}
              {goal.completedAt && (
                <p className="text-xs text-success text-center pt-2">
                  ✓ Goal này đã hoàn thành, các goal phụ thuộc đã được mở khóa
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependency Chain Visualization */}
      {(prerequisiteGoals.length > 0 || dependentGoals.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chuỗi mục tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
              {prerequisiteGoals.length > 0 && (
                <>
                  <div className="flex flex-col gap-1">
                    {prerequisiteGoals.slice(0, 3).map(g => (
                      <Badge 
                        key={g.id} 
                        variant={g.completedAt ? "default" : "secondary"}
                        className={cn("text-xs", g.completedAt && "bg-success")}
                      >
                        {g.completedAt ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                        {g.title.slice(0, 15)}...
                      </Badge>
                    ))}
                    {prerequisiteGoals.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{prerequisiteGoals.length - 3} more</Badge>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </>
              )}
              
              <Badge variant="default" className="text-sm px-3 py-1 shrink-0">
                {goal.title.slice(0, 20)}{goal.title.length > 20 ? '...' : ''}
              </Badge>
              
              {dependentGoals.length > 0 && (
                <>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex flex-col gap-1">
                    {dependentGoals.slice(0, 3).map(g => (
                      <Badge key={g.id} variant="outline" className="text-xs">
                        <Circle className="w-3 h-3 mr-1" />
                        {g.title.slice(0, 15)}...
                      </Badge>
                    ))}
                    {dependentGoals.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{dependentGoals.length - 3} more</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
