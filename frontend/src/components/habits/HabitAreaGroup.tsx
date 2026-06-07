import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type Habit } from '@/types/lifeos';
import { useState } from 'react';

interface HabitAreaGroupProps {
  area: LifeArea;
  habits: Habit[];
  todayStr: string;
  children: React.ReactNode;
}

export function HabitAreaGroup({ area, habits, todayStr, children }: HabitAreaGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const areaInfo = LIFE_AREAS.find(a => a.id === area);
  
  const completedToday = habits.filter(h => {
    const target = h.targetPerDay || 1;
    const todayCompletion = h.completions?.find(c => c.date === todayStr);
    const todayCount = todayCompletion?.count || (h.completedDates.includes(todayStr) ? 1 : 0);
    return todayCount >= target;
  }).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">{areaInfo?.icon}</span>
            <span className="font-semibold">{areaInfo?.name}</span>
            <Badge variant="secondary" className="ml-1">
              {completedToday}/{habits.length}
            </Badge>
          </div>
          <ChevronDown className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-2 pt-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
