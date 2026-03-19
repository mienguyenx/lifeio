import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { TaskFilters, type FilterStatus, type FilterPriority, type FilterDueDate, type SortBy } from '@/components/tasks/TaskFilters';
import { type Goal } from '@/types/lifeos';

interface TaskFilterSheetProps {
  // TaskFilters props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
  filterPriority: FilterPriority;
  onFilterPriorityChange: (priority: FilterPriority) => void;
  filterArea: string;
  onFilterAreaChange: (area: string) => void;
  filterGoal: string;
  onFilterGoalChange: (goal: string) => void;
  filterDueDate: FilterDueDate;
  onFilterDueDateChange: (dueDate: FilterDueDate) => void;
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
  sortAsc: boolean;
  onSortAscChange: (asc: boolean) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  goals: Goal[];
  focusMode?: boolean;
  onFocusModeChange?: (enabled: boolean) => void;
}

export function TaskFilterSheet(props: TaskFilterSheetProps) {
  const isMobile = useIsMobile();
  const {
    activeFiltersCount,
    filterStatus,
    filterPriority,
    filterArea,
    filterGoal,
    filterDueDate,
    onClearFilters,
    ...filterProps
  } = props;

  const hasActiveFilters =
    filterStatus !== 'all' ||
    filterPriority !== 'all' ||
    filterArea !== 'all' ||
    filterGoal !== 'all' ||
    filterDueDate !== 'all';

  // Desktop: render TaskFilters inline
  if (!isMobile) {
    return <TaskFilters {...props} />;
  }

  // Mobile: render filter in bottom sheet
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 shrink-0", hasActiveFilters && "border-primary text-primary")}
        >
          <Filter className="w-4 h-4" />
          Bộ lọc
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-5 px-1.5">
              {[filterStatus !== 'all', filterPriority !== 'all', filterArea !== 'all', filterGoal !== 'all', filterDueDate !== 'all'].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Bộ lọc & Sắp xếp
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <TaskFilters
            searchQuery={props.searchQuery}
            onSearchChange={props.onSearchChange}
            filterStatus={props.filterStatus}
            onFilterStatusChange={props.onFilterStatusChange}
            filterPriority={props.filterPriority}
            onFilterPriorityChange={props.onFilterPriorityChange}
            filterArea={props.filterArea}
            onFilterAreaChange={props.onFilterAreaChange}
            filterGoal={props.filterGoal}
            onFilterGoalChange={props.onFilterGoalChange}
            filterDueDate={props.filterDueDate}
            onFilterDueDateChange={props.onFilterDueDateChange}
            sortBy={props.sortBy}
            onSortByChange={props.onSortByChange}
            sortAsc={props.sortAsc}
            onSortAscChange={props.onSortAscChange}
            activeFiltersCount={props.activeFiltersCount}
            onClearFilters={props.onClearFilters}
            goals={props.goals}
            focusMode={props.focusMode}
            onFocusModeChange={props.onFocusModeChange}
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-destructive"
            onClick={onClearFilters}
          >
            Xóa tất cả bộ lọc
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
