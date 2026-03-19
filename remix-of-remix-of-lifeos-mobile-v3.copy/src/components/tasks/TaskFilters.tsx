import { Filter, SortAsc, Search, X, Focus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LIFE_AREAS, type LifeArea, type Goal } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type FilterStatus = 'all' | 'todo' | 'in_progress' | 'deferred' | 'done';
export type FilterPriority = 'all' | 'high' | 'medium' | 'low';
export type FilterDueDate = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_date';
export type SortBy = 'priority' | 'dueDate' | 'createdAt' | 'title' | 'position';

interface TaskFiltersProps {
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
  // Focus mode props
  focusMode?: boolean;
  onFocusModeChange?: (enabled: boolean) => void;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  filterArea,
  onFilterAreaChange,
  filterGoal,
  onFilterGoalChange,
  filterDueDate,
  onFilterDueDateChange,
  sortBy,
  onSortByChange,
  sortAsc,
  onSortAscChange,
  activeFiltersCount,
  onClearFilters,
  goals,
  focusMode,
  onFocusModeChange,
}: TaskFiltersProps) {
  const isMobile = useIsMobile();
  const [showSearch, setShowSearch] = useState(false);

  // Mobile: search is togglable
  if (isMobile && showSearch) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm task..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-8 h-9 w-full"
            autoFocus
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            setShowSearch(false);
            onSearchChange('');
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Focus Mode Toggle */}
      {onFocusModeChange && (
        <Button
          variant={focusMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFocusModeChange(!focusMode)}
          className={cn(
            'h-9 gap-1.5 text-xs font-medium transition-all',
            focusMode && 'bg-primary text-primary-foreground shadow-md'
          )}
        >
          {focusMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {!isMobile && (focusMode ? 'Focus' : 'Focus')}
        </Button>
      )}

      {/* Search */}
      {isMobile ? (
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowSearch(true)}
          className="relative h-9 w-9"
        >
          <Search className="w-4 h-4" />
          {searchQuery && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      ) : (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm task..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-8 h-9 w-[140px] lg:w-[180px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative h-9 w-9">
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Trạng thái</Label>
              <Select value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as FilterStatus)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="todo">📋 Todo</SelectItem>
                  <SelectItem value="in_progress">⏳ Đang làm</SelectItem>
                  <SelectItem value="deferred">⏸️ Tạm hoãn</SelectItem>
                  <SelectItem value="done">✅ Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Ưu tiên</Label>
              <Select value={filterPriority} onValueChange={(v) => onFilterPriorityChange(v as FilterPriority)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="high">🔴 Cao</SelectItem>
                  <SelectItem value="medium">🟡 Trung bình</SelectItem>
                  <SelectItem value="low">🟢 Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Lĩnh vực</Label>
              <Select value={filterArea} onValueChange={onFilterAreaChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  {LIFE_AREAS.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.icon} {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Goal</Label>
              <Select value={filterGoal} onValueChange={onFilterGoalChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả goals</SelectItem>
                  <SelectItem value="no_goal">❌ Chưa liên kết</SelectItem>
                  {goals.filter(g => !g.deletedAt && g.progress < 100).map((goal) => {
                    const goalArea = LIFE_AREAS.find((a) => a.id === goal.area);
                    return (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goalArea?.icon} {goal.title.slice(0, 20)}{goal.title.length > 20 ? '...' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Deadline</Label>
              <Select value={filterDueDate} onValueChange={(v) => onFilterDueDateChange(v as FilterDueDate)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="overdue">⚠️ Quá hạn</SelectItem>
                  <SelectItem value="today">📅 Hôm nay</SelectItem>
                  <SelectItem value="upcoming">🔜 Sắp tới</SelectItem>
                  <SelectItem value="no_date">❌ Chưa có</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full" 
                onClick={onClearFilters}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <SortAsc className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Sắp xếp theo</Label>
              <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Ưu tiên</SelectItem>
                  <SelectItem value="dueDate">Deadline</SelectItem>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="title">Tiêu đề</SelectItem>
                  <SelectItem value="position">🎯 Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Thứ tự</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={!sortAsc ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onSortAscChange(false)}
                >
                  Giảm dần
                </Button>
                <Button
                  variant={sortAsc ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onSortAscChange(true)}
                >
                  Tăng dần
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
