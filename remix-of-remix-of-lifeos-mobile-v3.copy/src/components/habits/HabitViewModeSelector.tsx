import { List, LayoutGrid, LayoutList, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HabitViewMode } from '@/hooks/useHabitViewPreferences';

interface HabitViewModeSelectorProps {
  viewMode: HabitViewMode;
  onViewModeChange: (mode: HabitViewMode) => void;
  groupByArea: boolean;
  onGroupByAreaChange: (grouped: boolean) => void;
}

export function HabitViewModeSelector({
  viewMode,
  onViewModeChange,
  groupByArea,
  onGroupByAreaChange,
}: HabitViewModeSelectorProps) {
  const modes: { value: HabitViewMode; icon: typeof List; label: string }[] = [
    { value: 'compact', icon: List, label: 'Gọn' },
    { value: 'standard', icon: LayoutGrid, label: 'Chuẩn' },
    { value: 'detailed', icon: LayoutList, label: 'Chi tiết' },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* View Mode Buttons */}
        <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
          {modes.map(mode => (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-2.5 rounded-md',
                    viewMode === mode.value && 'bg-background shadow-sm'
                  )}
                  onClick={() => onViewModeChange(mode.value)}
                >
                  <mode.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{mode.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Group by Area Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={groupByArea}
              onPressedChange={onGroupByAreaChange}
              size="sm"
              className="h-8"
            >
              <Layers className="w-4 h-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Nhóm theo lĩnh vực</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
