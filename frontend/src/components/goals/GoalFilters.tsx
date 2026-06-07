import { Filter, SortAsc, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

export type GoalSortBy = 'progress' | 'deadline' | 'created' | 'title' | 'area';
export type GoalSortOrder = 'asc' | 'desc';
export type GoalStatusFilter = 'all' | 'active' | 'completed' | 'overdue' | 'approaching';

interface GoalFiltersProps {
  filterArea: LifeArea | 'all';
  onFilterAreaChange: (area: LifeArea | 'all') => void;
  filterStatus: GoalStatusFilter;
  onFilterStatusChange: (status: GoalStatusFilter) => void;
  sortBy: GoalSortBy;
  onSortByChange: (sort: GoalSortBy) => void;
  sortOrder: GoalSortOrder;
  onSortOrderChange: (order: GoalSortOrder) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function GoalFilters({
  filterArea,
  onFilterAreaChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  activeFiltersCount,
  onClearFilters,
  searchQuery,
  onSearchChange,
}: GoalFiltersProps) {
  const isMobile = useIsMobile();
  const [showSearch, setShowSearch] = useState(false);

  // Mobile: search is togglable
  if (isMobile && showSearch) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm goal..."
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
      {/* Search */}
      {isMobile ? (
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowSearch(true)}
          className="relative"
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
            placeholder="Tìm goal..."
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
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Trạng thái</Label>
              <Select value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as GoalStatusFilter)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang thực hiện</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                  <SelectItem value="approaching">Sắp đến hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Lĩnh vực</Label>
              <Select value={filterArea} onValueChange={(v) => onFilterAreaChange(v as LifeArea | 'all')}>
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
              <Select value={sortBy} onValueChange={(v) => onSortByChange(v as GoalSortBy)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Tiến độ</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="created">Ngày tạo</SelectItem>
                  <SelectItem value="title">Tên</SelectItem>
                  <SelectItem value="area">Lĩnh vực</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Thứ tự</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onSortOrderChange('desc')}
                >
                  Giảm dần
                </Button>
                <Button
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onSortOrderChange('asc')}
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
