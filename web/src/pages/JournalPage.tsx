import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Trash2, LayoutList, CalendarDays, BarChart3, FileText, History, Image, X, Tag, PanelRightClose, PanelRight, BookOpen, Smile, Zap, Calendar, Lightbulb, Sparkles, MessageCircle } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type JournalEntry } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { JournalFilters } from '@/components/journal/JournalFilters';
import { JournalAnalyticsChart } from '@/components/journal/JournalAnalyticsChart';
import { JournalTemplatesModal } from '@/components/journal/JournalTemplatesModal';
import { JournalCalendarView } from '@/components/journal/JournalCalendarView';
import { JournalDetailModal } from '@/components/journal/JournalDetailModal';
import { JournalStreakCard } from '@/components/journal/JournalStreakCard';
import { JournalHistoryModal } from '@/components/journal/JournalHistoryModal';
import { JournalTagsManager } from '@/components/journal/JournalTagsManager';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';

const MOOD_OPTIONS = [
  { value: 1, icon: '😢', label: 'Rất tệ' },
  { value: 2, icon: '😕', label: 'Tệ' },
  { value: 3, icon: '😐', label: 'Bình thường' },
  { value: 4, icon: '🙂', label: 'Tốt' },
  { value: 5, icon: '😄', label: 'Rất tốt' },
];

const ENERGY_OPTIONS = [
  { value: 1, icon: '🔋', label: 'Kiệt sức' },
  { value: 2, icon: '🪫', label: 'Mệt' },
  { value: 3, icon: '⚡', label: 'Bình thường' },
  { value: 4, icon: '💪', label: 'Năng lượng' },
  { value: 5, icon: '🚀', label: 'Tràn đầy' },
];

export default function JournalPage() {
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const journalTags = useLifeOSStore((s) => s.journalTags);
  const addJournalTag = useLifeOSStore((s) => s.addJournalTag);
  const updateJournalTag = useLifeOSStore((s) => s.updateJournalTag);
  const deleteJournalTag = useLifeOSStore((s) => s.deleteJournalTag);
  
  // Use synced store for CRUD operations that need to sync to Supabase
  const { addJournalEntry, updateJournalEntry, deleteJournalEntry, isSyncEnabled } = useSyncedStore();
  
  const isMobile = useIsMobile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('list');

  // Sidebar collapse state with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('lifeos.journal.sidebarOpen');
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('lifeos.journal.sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Calculate journal stats
  const journalStats = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'));
    const entriesLast7Days = journalEntries.filter(e => last7Days.includes(e.date)).length;
    
    // Calculate current streak
    let streak = 0;
    let checkDate = today;
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const hasEntry = journalEntries.some(e => e.date === dateStr);
      if (hasEntry) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Average mood
    const entriesWithMood = journalEntries.filter(e => e.mood);
    const avgMood = entriesWithMood.length > 0 
      ? entriesWithMood.reduce((sum, e) => sum + (e.mood || 0), 0) / entriesWithMood.length 
      : 0;

    // Average energy
    const entriesWithEnergy = journalEntries.filter(e => e.energy);
    const avgEnergy = entriesWithEnergy.length > 0
      ? entriesWithEnergy.reduce((sum, e) => sum + (e.energy || 0), 0) / entriesWithEnergy.length
      : 0;

    return {
      total: journalEntries.length,
      entriesLast7Days,
      streak,
      avgMood,
      avgEnergy,
    };
  }, [journalEntries]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [energyFilter, setEnergyFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('all');

  // New entry form
  const [newEntry, setNewEntry] = useState({
    content: '',
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    energy: 3 as 1 | 2 | 3 | 4 | 5,
    areas: [] as LifeArea[],
    gratitude: '',
    tags: [] as string[],
    images: [] as string[],
  });
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      if (searchQuery && !entry.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (moodFilter !== 'all' && entry.mood !== parseInt(moodFilter)) {
        return false;
      }
      if (energyFilter !== 'all' && entry.energy !== parseInt(energyFilter)) {
        return false;
      }
      if (areaFilter !== 'all' && (!entry.areas || !entry.areas.includes(areaFilter))) {
        return false;
      }
      if (tagFilter !== 'all' && (!entry.tags || !entry.tags.includes(tagFilter))) {
        return false;
      }
      return true;
    });
  }, [journalEntries, searchQuery, moodFilter, energyFilter, areaFilter, tagFilter]);

  const handleAddEntry = () => {
    if (!newEntry.content.trim()) return;
    addJournalEntry({
      date: todayStr,
      content: newEntry.content,
      mood: newEntry.mood,
      energy: newEntry.energy,
      areas: newEntry.areas.length > 0 ? newEntry.areas : undefined,
      gratitude: newEntry.gratitude ? newEntry.gratitude.split('\n').filter(Boolean) : undefined,
      tags: newEntry.tags.length > 0 ? newEntry.tags : undefined,
      images: newEntry.images.length > 0 ? newEntry.images : undefined,
    });
    setNewEntry({ content: '', mood: 3, energy: 3, areas: [], gratitude: '', tags: [], images: [] });
    setImageUrl('');
    setIsDialogOpen(false);
  };

  const toggleArea = (area: LifeArea) => {
    setNewEntry((prev) => ({
      ...prev,
      areas: prev.areas.includes(area) ? prev.areas.filter((a) => a !== area) : [...prev.areas, area],
    }));
  };

  const toggleTag = (tagId: string) => {
    setNewEntry((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((t) => t !== tagId) : [...prev.tags, tagId],
    }));
  };

  const addImageUrl = () => {
    if (imageUrl.trim() && !newEntry.images.includes(imageUrl.trim())) {
      setNewEntry((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    setNewEntry((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== url),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl && !newEntry.images.includes(dataUrl)) {
          setNewEntry((prev) => ({
            ...prev,
            images: [...prev.images, dataUrl],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectTemplate = (content: string, gratitude: string) => {
    setNewEntry((prev) => ({
      ...prev,
      content: content,
      gratitude: gratitude,
    }));
  };

  const handleSelectDate = (date: string) => {
    const entry = journalEntries.find(e => e.date === date);
    if (entry) {
      setSelectedEntry(entry);
      setIsDetailModalOpen(true);
    }
  };

  const handleSelectEntryFromHistory = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const EntryCard = ({ entry }: { entry: JournalEntry }) => {
    const moodOption = MOOD_OPTIONS.find((m) => m.value === entry.mood);
    const energyOption = ENERGY_OPTIONS.find((e) => e.value === entry.energy);

    return (
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => {
          setSelectedEntry(entry);
          setIsDetailModalOpen(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">
                  {format(new Date(entry.date), 'EEEE, dd/MM', { locale: vi })}
                </span>
                <span className="text-lg">{moodOption?.icon}</span>
                <span className="text-lg">{energyOption?.icon}</span>
              </div>
              
              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {entry.tags.map((tagId) => {
                    const tag = journalTags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge key={tagId} variant="secondary" className="gap-1 text-xs py-0">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap line-clamp-3">{entry.content}</p>

              {/* Images preview */}
              {entry.images && entry.images.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {entry.images.slice(0, 3).map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-12 h-12 object-cover rounded" />
                  ))}
                  {entry.images.length > 3 && (
                    <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                      +{entry.images.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              {entry.areas && entry.areas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {entry.areas.map((areaId) => {
                    const area = LIFE_AREAS.find((a) => a.id === areaId);
                    return (
                      <span key={areaId} className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                        {area?.icon}
                      </span>
                    );
                  })}
                </div>
              )}

              {entry.gratitude && entry.gratitude.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">🙏 Gratitude</p>
                  <ul className="text-sm space-y-1">
                    {entry.gratitude.slice(0, 2).map((item, i) => (
                      <li key={i} className="text-muted-foreground">• {item}</li>
                    ))}
                    {entry.gratitude.length > 2 && (
                      <li className="text-xs text-muted-foreground">+{entry.gratitude.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={(e) => {
                  e.stopPropagation();
                  deleteJournalEntry(entry.id);
                }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold">Journal</h1>
          {!isMobile && <p className="text-muted-foreground">Ghi chép và suy ngẫm</p>}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={() => setIsTagsManagerOpen(true)}>
                  <Tag className="w-4 h-4" />
                  {!isMobile && <span className="ml-1">Tags</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Quản lý Tags</p>
                <p className="text-xs text-muted-foreground">Tạo và chỉnh sửa tags để phân loại journal</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={() => setIsHistoryModalOpen(true)}>
                  <History className="w-4 h-4" />
                  {!isMobile && <span className="ml-1">Lịch sử</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Lịch sử Journal</p>
                <p className="text-xs text-muted-foreground">Xem lại các bài viết theo thời gian</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size={isMobile ? "sm" : "default"} onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  <span className="ml-1">{isMobile ? "Viết" : "Viết hôm nay"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Viết Journal</p>
                <p className="text-xs text-muted-foreground">Ghi lại cảm xúc và suy nghĩ trong ngày</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AdaptiveModal open={isDialogOpen} onOpenChange={setIsDialogOpen} title={`Journal - ${format(new Date(), 'dd/MM/yyyy')}`}>
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={() => setIsTemplateModalOpen(true)}>
                <FileText className="w-4 h-4 mr-1" /> Templates
              </Button>
            </div>
              <div className="space-y-4 mt-4">
                {/* Mood */}
                <div>
                  <Label>Tâm trạng hôm nay</Label>
                  <div className="flex gap-2 mt-2">
                    {MOOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNewEntry({ ...newEntry, mood: option.value as any })}
                        className={cn(
                          "flex-1 p-2 rounded-lg text-center transition-all",
                          newEntry.mood === option.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        <span className="text-xl">{option.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <Label>Năng lượng</Label>
                  <div className="flex gap-2 mt-2">
                    {ENERGY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNewEntry({ ...newEntry, energy: option.value as any })}
                        className={cn(
                          "flex-1 p-2 rounded-lg text-center transition-all",
                          newEntry.energy === option.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        <span className="text-xl">{option.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <Label>Hôm nay thế nào?</Label>
                  <Textarea
                    placeholder="Viết về ngày của bạn..."
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {journalTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm transition-all flex items-center gap-1.5",
                          newEntry.tags.includes(tag.id) ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Areas */}
                <div>
                  <Label>Lĩnh vực liên quan</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {LIFE_AREAS.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => toggleArea(area.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm transition-all",
                          newEntry.areas.includes(area.id) ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {area.icon} {area.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div>
                  <Label>Hình ảnh</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập URL hình ảnh..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      />
                      <Button type="button" variant="secondary" size="icon" onClick={addImageUrl}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button type="button" variant="secondary" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <Image className="w-4 h-4" />
                      </Button>
                    </div>
                    {newEntry.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {newEntry.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt="" className="w-full h-16 object-cover rounded-lg" />
                            <button
                              onClick={() => removeImage(img)}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gratitude */}
                <div>
                  <Label>Gratitude (mỗi dòng 1 điều)</Label>
                  <Textarea
                    placeholder="Hôm nay bạn biết ơn điều gì?"
                    value={newEntry.gratitude}
                    onChange={(e) => setNewEntry({ ...newEntry, gratitude: e.target.value })}
                    rows={2}
                    className="mt-2"
                  />
                </div>

                <Button className="w-full" onClick={handleAddEntry}>Lưu Journal</Button>
              </div>
          </AdaptiveModal>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="h-8 px-2 gap-1 hidden xl:flex"
                >
                  {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{isSidebarOpen ? 'Ẩn Sidebar' : 'Hiện Sidebar'}</p>
                <p className="text-xs text-muted-foreground">Bật/tắt thanh bên với thống kê journal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journalStats.total}</p>
                <p className="text-xs text-muted-foreground">Tổng entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journalStats.streak}</p>
                <p className="text-xs text-muted-foreground">Ngày streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Smile className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journalStats.avgMood.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Mood TB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journalStats.avgEnergy.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Energy TB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Main Content */}
        <div className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          !isMobile && isSidebarOpen && "lg:mr-0"
        )}>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list" className="gap-1">
                <LayoutList className="w-4 h-4" /> Danh sách
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1">
                <CalendarDays className="w-4 h-4" /> Lịch
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1">
                <BarChart3 className="w-4 h-4" /> Phân tích
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4 space-y-4">
              <JournalFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                moodFilter={moodFilter}
                setMoodFilter={setMoodFilter}
                energyFilter={energyFilter}
                setEnergyFilter={setEnergyFilter}
                areaFilter={areaFilter}
                setAreaFilter={setAreaFilter}
                tagFilter={tagFilter}
                setTagFilter={setTagFilter}
                journalTags={journalTags}
              />

              {filteredEntries.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-lg">
                      {journalEntries.length === 0 ? 'Chưa có journal nào' : 'Không tìm thấy kết quả'}
                    </p>
                    <p className="text-sm mt-1">
                      {journalEntries.length === 0 
                        ? 'Bắt đầu viết nhật ký để theo dõi tâm trạng!'
                        : 'Thử thay đổi bộ lọc để tìm entries khác'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className={cn(
                  "grid gap-4",
                  !isMobile && !isSidebarOpen && "lg:grid-cols-2 xl:grid-cols-3",
                  !isMobile && isSidebarOpen && "lg:grid-cols-1 xl:grid-cols-2"
                )}>
                  {filteredEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <JournalCalendarView
                entries={journalEntries}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onSelectDate={handleSelectDate}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <JournalAnalyticsChart entries={journalEntries} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (Desktop/Tablet) */}
        {!isMobile && (
          <div className={cn(
            "hidden lg:block transition-all duration-300 shrink-0",
            isSidebarOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden"
          )}>
            {isSidebarOpen && (
              <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {/* Help Button */}
                <div className="flex justify-end">
                  <ModuleHelpButton module="journal" />
                </div>

                {/* Streak Card - Compact Mode */}
                <JournalStreakCard entries={journalEntries} compact />
                
                {/* Journal Prompts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Gợi ý viết hôm nay
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {[
                      { icon: '🌟', text: 'Điều gì khiến bạn vui nhất hôm nay?' },
                      { icon: '🎯', text: 'Bạn đã hoàn thành mục tiêu nào?' },
                      { icon: '💭', text: 'Bạn học được gì mới hôm nay?' },
                      { icon: '🙏', text: 'Bạn biết ơn điều gì?' },
                      { icon: '🔮', text: 'Ngày mai bạn muốn làm gì?' },
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewEntry(prev => ({
                            ...prev,
                            content: prev.content ? `${prev.content}\n\n${prompt.text}` : prompt.text
                          }));
                          setIsDialogOpen(true);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm flex items-start gap-2"
                      >
                        <span>{prompt.icon}</span>
                        <span className="text-muted-foreground">{prompt.text}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
                
                {/* Reflection Questions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      Câu hỏi suy ngẫm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {[
                      'Năng lượng của bạn hôm nay ở mức nào? Tại sao?',
                      'Có điều gì khiến bạn lo lắng không?',
                      'Bạn đã chăm sóc bản thân như thế nào?',
                    ].map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewEntry(prev => ({
                            ...prev,
                            content: prev.content ? `${prev.content}\n\n${question}` : question
                          }));
                          setIsDialogOpen(true);
                        }}
                        className="w-full text-left p-2 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors text-xs text-muted-foreground"
                      >
                        {question}
                      </button>
                    ))}
                  </CardContent>
                </Card>
                
                {/* Tags */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags thường dùng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {journalTags.slice(0, 8).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="secondary" 
                          className="gap-1.5 cursor-pointer hover:bg-secondary/80"
                          onClick={() => setTagFilter(tag.id)}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
                          {tag.name}
                        </Badge>
                      ))}
                      {journalTags.length === 0 && (
                        <p className="text-sm text-muted-foreground">Chưa có tags nào</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      7 ngày qua
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entries viết</span>
                        <span className="font-medium">{journalStats.entriesLast7Days}/7</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mood trung bình</span>
                        <span className="font-medium">{MOOD_OPTIONS.find(m => m.value === Math.round(journalStats.avgMood))?.icon || '😐'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energy trung bình</span>
                        <span className="font-medium">{ENERGY_OPTIONS.find(e => e.value === Math.round(journalStats.avgEnergy))?.icon || '⚡'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Template Modal */}
      <JournalTemplatesModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* History Modal */}
      <JournalHistoryModal
        entries={journalEntries}
        journalTags={journalTags}
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        onSelectEntry={handleSelectEntryFromHistory}
      />

      {/* Tags Manager Modal */}
      <JournalTagsManager
        open={isTagsManagerOpen}
        onOpenChange={setIsTagsManagerOpen}
        tags={journalTags}
        onAddTag={addJournalTag}
        onUpdateTag={updateJournalTag}
        onDeleteTag={deleteJournalTag}
      />

      {/* Detail/Edit Modal */}
      <JournalDetailModal
        entry={selectedEntry}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onUpdate={updateJournalEntry}
        onDelete={deleteJournalEntry}
        journalTags={journalTags}
      />
    </div>
  );
}
