import { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LIFE_AREAS, type LifeArea, type JournalTag } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';

interface JournalFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  moodFilter: string;
  setMoodFilter: (mood: string) => void;
  energyFilter: string;
  setEnergyFilter: (energy: string) => void;
  areaFilter: LifeArea | 'all';
  setAreaFilter: (area: LifeArea | 'all') => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  journalTags: JournalTag[];
}

const MOOD_OPTIONS = [
  { value: '1', icon: '😢', label: 'Rất tệ' },
  { value: '2', icon: '😕', label: 'Tệ' },
  { value: '3', icon: '😐', label: 'Bình thường' },
  { value: '4', icon: '🙂', label: 'Tốt' },
  { value: '5', icon: '😄', label: 'Rất tốt' },
];

const ENERGY_OPTIONS = [
  { value: '1', icon: '🔋', label: 'Kiệt sức' },
  { value: '2', icon: '🪫', label: 'Mệt' },
  { value: '3', icon: '⚡', label: 'Bình thường' },
  { value: '4', icon: '💪', label: 'Năng lượng' },
  { value: '5', icon: '🚀', label: 'Tràn đầy' },
];

export function JournalFilters({
  searchQuery,
  setSearchQuery,
  moodFilter,
  setMoodFilter,
  energyFilter,
  setEnergyFilter,
  areaFilter,
  setAreaFilter,
  tagFilter,
  setTagFilter,
  journalTags,
}: JournalFiltersProps) {
  const isMobile = useIsMobile();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const hasFilters = searchQuery || moodFilter !== 'all' || energyFilter !== 'all' || areaFilter !== 'all' || tagFilter !== 'all';
  const activeFilterCount = [
    moodFilter !== 'all',
    energyFilter !== 'all', 
    areaFilter !== 'all',
    tagFilter !== 'all'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setMoodFilter('all');
    setEnergyFilter('all');
    setAreaFilter('all');
    setTagFilter('all');
  };

  const FilterSelects = () => (
    <>
      <Select value={moodFilter} onValueChange={setMoodFilter}>
        <SelectTrigger className={isMobile ? "flex-1" : "w-[120px]"}>
          <SelectValue placeholder="Mood" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả mood</SelectItem>
          {MOOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.icon} {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={energyFilter} onValueChange={setEnergyFilter}>
        <SelectTrigger className={isMobile ? "flex-1" : "w-[120px]"}>
          <SelectValue placeholder="Energy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả energy</SelectItem>
          {ENERGY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.icon} {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as LifeArea | 'all')}>
        <SelectTrigger className={isMobile ? "flex-1" : "w-[130px]"}>
          <SelectValue placeholder="Lĩnh vực" />
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

      <Select value={tagFilter} onValueChange={setTagFilter}>
        <SelectTrigger className={isMobile ? "flex-1" : "w-[120px]"}>
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả tags</SelectItem>
          {journalTags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                {tag.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                {isFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          {hasFilters && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <FilterSelects />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {hasFilters && !isFiltersOpen && (
          <div className="flex flex-wrap gap-1">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 text-xs">
                "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {moodFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {MOOD_OPTIONS.find(m => m.value === moodFilter)?.icon}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setMoodFilter('all')} />
              </Badge>
            )}
            {energyFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {ENERGY_OPTIONS.find(e => e.value === energyFilter)?.icon}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setEnergyFilter('all')} />
              </Badge>
            )}
            {areaFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {LIFE_AREAS.find(a => a.id === areaFilter)?.icon}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setAreaFilter('all')} />
              </Badge>
            )}
            {tagFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {journalTags.find(t => t.id === tagFilter)?.name}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setTagFilter('all')} />
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <FilterSelects />

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Tìm: "{searchQuery}"
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          {moodFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Mood: {MOOD_OPTIONS.find(m => m.value === moodFilter)?.icon}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setMoodFilter('all')} />
            </Badge>
          )}
          {energyFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Energy: {ENERGY_OPTIONS.find(e => e.value === energyFilter)?.icon}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setEnergyFilter('all')} />
            </Badge>
          )}
          {areaFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {LIFE_AREAS.find(a => a.id === areaFilter)?.icon} {LIFE_AREAS.find(a => a.id === areaFilter)?.name}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setAreaFilter('all')} />
            </Badge>
          )}
          {tagFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Tag: {journalTags.find(t => t.id === tagFilter)?.name}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setTagFilter('all')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
