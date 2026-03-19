import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { LIFE_AREAS, type LifeArea, type LifeWheelScore } from '@/types/lifeos';
import { Target, Check, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LifeWheelGoalsProps {
  latestScore: LifeWheelScore | undefined;
  targets: Record<LifeArea, number>;
  onTargetsChange: (targets: Record<LifeArea, number>) => void;
}

export function LifeWheelGoals({ latestScore, targets, onTargetsChange }: LifeWheelGoalsProps) {
  const [editMode, setEditMode] = useState(false);
  const [localTargets, setLocalTargets] = useState(targets);

  const handleSave = () => {
    onTargetsChange(localTargets);
    setEditMode(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Mục tiêu cân bằng
          </CardTitle>
          {!editMode ? (
            <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
              <Edit2 className="w-4 h-4 mr-1" /> Sửa
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" /> Lưu
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {LIFE_AREAS.map((area) => {
          const current = latestScore?.scores[area.id] || 0;
          const target = editMode ? localTargets[area.id] : targets[area.id];
          const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const achieved = current >= target;

          return (
            <div key={area.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {area.icon} {area.name}
                </span>
                <span className={cn(
                  "font-medium",
                  achieved ? "text-success" : "text-muted-foreground"
                )}>
                  {current}/{target}
                  {achieved && " ✓"}
                </span>
              </div>
              {editMode ? (
                <Slider
                  value={[localTargets[area.id]]}
                  onValueChange={([value]) => setLocalTargets({ ...localTargets, [area.id]: value })}
                  min={1}
                  max={10}
                  step={1}
                  className="cursor-pointer"
                />
              ) : (
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    achieved && "[&>div]:bg-success"
                  )} 
                />
              )}
            </div>
          );
        })}

        {/* Summary */}
        {latestScore && !editMode && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Đạt mục tiêu</span>
              <span className="font-medium">
                {LIFE_AREAS.filter((a) => (latestScore.scores[a.id] || 0) >= targets[a.id]).length}/10
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
