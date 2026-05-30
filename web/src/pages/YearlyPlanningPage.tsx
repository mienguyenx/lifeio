import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Compass, Target, Plus, Edit2, Trash2,
  CheckCircle2, Circle, Star, Sparkles, MapPin, BookOpen, X,
} from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { LIFE_AREAS, type LifeArea, type YearlyGoalItem, type BucketListItem, type QuarterlyFocus } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const BUCKET_CATEGORIES = [
  { value: 'travel', label: '✈️ Du lịch' },
  { value: 'experience', label: '🎭 Trải nghiệm' },
  { value: 'skill', label: '📚 Kỹ năng' },
  { value: 'health', label: '💪 Sức khỏe' },
  { value: 'relationship', label: '❤️ Mối quan hệ' },
  { value: 'career', label: '💼 Sự nghiệp' },
  { value: 'creative', label: '🎨 Sáng tạo' },
  { value: 'other', label: '✨ Khác' },
];

export default function YearlyPlanningPage() {
  const yearlyPlannings = useLifeOSStore((s) => s.yearlyPlannings);
  const addYearlyPlanning = useLifeOSStore((s) => s.addYearlyPlanning);
  const updateYearlyPlanning = useLifeOSStore((s) => s.updateYearlyPlanning);
  const deleteYearlyPlanning = useLifeOSStore((s) => s.deleteYearlyPlanning);
  const goals = useLifeOSStore((s) => s.goals);

  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const currentPlanning = yearlyPlannings.find((p) => p.year === selectedYear);

  // Form states
  const [theme, setTheme] = useState('');
  const [mantra, setMantra] = useState('');
  const [reflections, setReflections] = useState('');
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoalItem[]>([]);
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);
  const [quarterlyFocus, setQuarterlyFocus] = useState<QuarterlyFocus[]>([
    { quarter: 1, focus: [] }, { quarter: 2, focus: [] }, { quarter: 3, focus: [] }, { quarter: 4, focus: [] },
  ]);

  // New goal form
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalArea, setNewGoalArea] = useState<LifeArea>('career');
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketCategory, setNewBucketCategory] = useState('other');
  const [qFocusInputs, setQFocusInputs] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' });

  const handleOpenForm = () => {
    if (currentPlanning) {
      setTheme(currentPlanning.theme);
      setMantra(currentPlanning.mantra || '');
      setReflections(currentPlanning.reflections || '');
      setYearlyGoals([...currentPlanning.yearlyGoals]);
      setBucketList([...currentPlanning.bucketList]);
      setQuarterlyFocus(currentPlanning.quarterlyFocus.length > 0 ? [...currentPlanning.quarterlyFocus] : [
        { quarter: 1, focus: [] }, { quarter: 2, focus: [] }, { quarter: 3, focus: [] }, { quarter: 4, focus: [] },
      ]);
    } else {
      setTheme(''); setMantra(''); setReflections('');
      setYearlyGoals([]); setBucketList([]);
      setQuarterlyFocus([{ quarter: 1, focus: [] }, { quarter: 2, focus: [] }, { quarter: 3, focus: [] }, { quarter: 4, focus: [] }]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!theme.trim()) { toast.error('Vui lòng nhập chủ đề năm'); return; }
    const data = { year: selectedYear, theme, mantra, yearlyGoals, bucketList, quarterlyFocus, reflections };
    if (currentPlanning) { updateYearlyPlanning(currentPlanning.id, data); toast.success('Đã cập nhật kế hoạch năm!'); }
    else { addYearlyPlanning(data); toast.success('Đã tạo kế hoạch năm!'); }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (currentPlanning) { deleteYearlyPlanning(currentPlanning.id); toast.success('Đã xóa kế hoạch năm'); setDeleteDialogOpen(false); }
  };

  const addYearlyGoal = () => {
    if (!newGoalTitle.trim()) return;
    setYearlyGoals([...yearlyGoals, { id: crypto.randomUUID(), title: newGoalTitle, area: newGoalArea, status: 'planned', progress: 0 }]);
    setNewGoalTitle('');
  };

  const removeYearlyGoal = (id: string) => setYearlyGoals(yearlyGoals.filter((g) => g.id !== id));

  const updateYearlyGoalStatus = (id: string, status: YearlyGoalItem['status']) => {
    if (currentPlanning) {
      const updated = currentPlanning.yearlyGoals.map((g) => g.id === id ? { ...g, status, progress: status === 'completed' ? 100 : g.progress } : g);
      updateYearlyPlanning(currentPlanning.id, { yearlyGoals: updated });
    }
  };

  const addBucketItem = () => {
    if (!newBucketTitle.trim()) return;
    setBucketList([...bucketList, { id: crypto.randomUUID(), title: newBucketTitle, category: newBucketCategory, completed: false }]);
    setNewBucketTitle('');
  };

  const removeBucketItem = (id: string) => setBucketList(bucketList.filter((b) => b.id !== id));

  const toggleBucketItem = (id: string) => {
    if (currentPlanning) {
      const updated = currentPlanning.bucketList.map((b) => b.id === id ? { ...b, completed: !b.completed, completedAt: !b.completed ? new Date().toISOString() : undefined } : b);
      updateYearlyPlanning(currentPlanning.id, { bucketList: updated });
    }
  };

  const addQuarterFocus = (quarter: number) => {
    const text = qFocusInputs[quarter]?.trim();
    if (!text) return;
    setQuarterlyFocus(quarterlyFocus.map((q) => q.quarter === quarter ? { ...q, focus: [...q.focus, text] } : q));
    setQFocusInputs({ ...qFocusInputs, [quarter]: '' });
  };

  const removeQuarterFocus = (quarter: number, index: number) => {
    setQuarterlyFocus(quarterlyFocus.map((q) => q.quarter === quarter ? { ...q, focus: q.focus.filter((_, i) => i !== index) } : q));
  };

  // Stats
  const goalStats = useMemo(() => {
    if (!currentPlanning) return { total: 0, completed: 0, inProgress: 0, planned: 0 };
    const yg = currentPlanning.yearlyGoals;
    return {
      total: yg.length,
      completed: yg.filter((g) => g.status === 'completed').length,
      inProgress: yg.filter((g) => g.status === 'in_progress').length,
      planned: yg.filter((g) => g.status === 'planned').length,
    };
  }, [currentPlanning]);

  const bucketStats = useMemo(() => {
    if (!currentPlanning) return { total: 0, completed: 0 };
    return { total: currentPlanning.bucketList.length, completed: currentPlanning.bucketList.filter((b) => b.completed).length };
  }, [currentPlanning]);

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            Yearly Planning
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Lập kế hoạch và định hướng cho cả năm</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedYear((v) => v - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="text-center min-w-[80px]"><p className="text-xl font-bold">{selectedYear}</p></div>
          <Button variant="outline" size="icon" onClick={() => setSelectedYear((v) => v + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {currentPlanning ? (
        <>
          {/* Theme & Mantra */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" /> Chủ đề năm</Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleOpenForm}><Edit2 className="w-3 h-3 mr-1" /> Sửa</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="w-3 h-3 mr-1" /> Xóa</Button>
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentPlanning.theme}</h2>
              {currentPlanning.mantra && <p className="text-muted-foreground italic">"{currentPlanning.mantra}"</p>}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{goalStats.total}</p><p className="text-xs text-muted-foreground">Goals năm</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{goalStats.completed}</p><p className="text-xs text-muted-foreground">Hoàn thành</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{bucketStats.total}</p><p className="text-xs text-muted-foreground">Bucket List</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{bucketStats.completed}</p><p className="text-xs text-muted-foreground">BL hoàn thành</p>
            </CardContent></Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={cn("w-full", isMobile ? "grid grid-cols-3" : "grid grid-cols-4")}>
              <TabsTrigger value="overview" className="text-xs">Tổng quan</TabsTrigger>
              <TabsTrigger value="goals" className="text-xs">Goals ({goalStats.total})</TabsTrigger>
              <TabsTrigger value="bucket" className="text-xs">Bucket ({bucketStats.total})</TabsTrigger>
              {!isMobile && <TabsTrigger value="quarters" className="text-xs">Quý</TabsTrigger>}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Goal progress by area */}
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tiến độ Goals theo lĩnh vực</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {LIFE_AREAS.map((area) => {
                      const areaGoals = currentPlanning.yearlyGoals.filter((g) => g.area === area.id);
                      if (areaGoals.length === 0) return null;
                      const completed = areaGoals.filter((g) => g.status === 'completed').length;
                      const pct = Math.round((completed / areaGoals.length) * 100);
                      return (
                        <div key={area.id} className="flex items-center gap-3">
                          <span className="w-6 text-center">{area.icon}</span>
                          <span className="text-sm w-20 truncate">{area.name}</span>
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-16 text-right">{completed}/{areaGoals.length}</span>
                        </div>
                      );
                    }).filter(Boolean)}
                    {currentPlanning.yearlyGoals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có goals nào</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Quarterly Focus Overview */}
              <div className="grid md:grid-cols-2 gap-3">
                {currentPlanning.quarterlyFocus.map((q) => (
                  <Card key={q.quarter} className={cn(q.quarter === currentQuarter && "border-primary/50 bg-primary/5")}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
                      Q{q.quarter} {q.quarter === currentQuarter && <Badge variant="default" className="text-xs">Hiện tại</Badge>}
                    </CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      {q.focus.length > 0 ? (
                        <ul className="space-y-1">{q.focus.map((f, i) => <li key={i} className="text-sm flex items-start gap-2"><Target className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />{f}</li>)}</ul>
                      ) : <p className="text-xs text-muted-foreground">Chưa có focus</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {currentPlanning.reflections && (
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> Suy ngẫm</CardTitle></CardHeader>
                  <CardContent className="pt-0"><p className="text-sm whitespace-pre-wrap">{currentPlanning.reflections}</p></CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-3 mt-4">
              {currentPlanning.yearlyGoals.map((goal) => {
                const area = LIFE_AREAS.find((a) => a.id === goal.area);
                const statusColors: Record<string, string> = { planned: 'bg-secondary', in_progress: 'bg-blue-500/20 text-blue-600', completed: 'bg-green-500/20 text-green-600', cancelled: 'bg-red-500/20 text-red-600' };
                const statusLabels: Record<string, string> = { planned: 'Kế hoạch', in_progress: 'Đang làm', completed: 'Xong', cancelled: 'Hủy' };
                return (
                  <Card key={goal.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-lg">{area?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm", goal.status === 'completed' && "line-through text-muted-foreground")}>{goal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-xs", statusColors[goal.status])}>{statusLabels[goal.status]}</Badge>
                          {goal.linkedGoalId && <Badge variant="outline" className="text-xs">Liên kết</Badge>}
                        </div>
                      </div>
                      <Select value={goal.status} onValueChange={(v) => updateYearlyGoalStatus(goal.id, v as YearlyGoalItem['status'])}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Kế hoạch</SelectItem>
                          <SelectItem value="in_progress">Đang làm</SelectItem>
                          <SelectItem value="completed">Xong</SelectItem>
                          <SelectItem value="cancelled">Hủy</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                );
              })}
              {currentPlanning.yearlyGoals.length === 0 && (
                <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Chưa có goals. Nhấn "Sửa" để thêm.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* Bucket List Tab */}
            <TabsContent value="bucket" className="space-y-3 mt-4">
              {BUCKET_CATEGORIES.map((cat) => {
                const items = currentPlanning.bucketList.filter((b) => (b.category || 'other') === cat.value);
                if (items.length === 0) return null;
                return (
                  <div key={cat.value}>
                    <h3 className="text-sm font-medium mb-2">{cat.label}</h3>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer" onClick={() => toggleBucketItem(item.id)}>
                          {item.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                          <span className={cn("text-sm flex-1", item.completed && "line-through text-muted-foreground")}>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
              {currentPlanning.bucketList.length === 0 && (
                <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Chưa có bucket list. Nhấn "Sửa" để thêm.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* Quarters Tab - Desktop */}
            {!isMobile && (
              <TabsContent value="quarters" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {currentPlanning.quarterlyFocus.map((q) => (
                    <Card key={q.quarter} className={cn(q.quarter === currentQuarter && "border-primary/50")}>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Quý {q.quarter} {q.quarter === currentQuarter && <Badge className="ml-2 text-xs">Hiện tại</Badge>}</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {q.focus.map((f, i) => <div key={i} className="text-sm flex items-start gap-2"><Target className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />{f}</div>)}
                        {q.focus.length === 0 && <p className="text-xs text-muted-foreground">Chưa có focus</p>}
                        {q.review && <><Separator /><p className="text-xs text-muted-foreground italic">{q.review}</p></>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </>
      ) : (
        <Card className="border-dashed"><CardContent className="p-12 text-center">
          <Compass className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Chưa có kế hoạch cho năm {selectedYear}</h3>
          <p className="text-sm text-muted-foreground mb-4">Lập kế hoạch năm giúp bạn định hướng rõ ràng và theo dõi tiến độ qua từng quý</p>
          <Button onClick={handleOpenForm}><Plus className="w-4 h-4 mr-2" /> Tạo Yearly Planning</Button>
        </CardContent></Card>
      )}

      {/* History */}
      {yearlyPlannings.length > 1 && (
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Các năm khác</CardTitle></CardHeader><CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {yearlyPlannings.sort((a, b) => b.year - a.year).map((p) => (
              <Button key={p.id} variant={p.year === selectedYear ? 'default' : 'outline'} size="sm" onClick={() => setSelectedYear(p.year)}>
                {p.year} - {p.theme}
              </Button>
            ))}
          </div>
        </CardContent></Card>
      )}

      {/* Form Dialog */}
      <AdaptiveModal open={isDialogOpen} onOpenChange={setIsDialogOpen} title={currentPlanning ? 'Chỉnh sửa Yearly Planning' : 'Tạo Yearly Planning'}>
        <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1"><Label className="font-medium">✨ Chủ đề năm *</Label><Input placeholder="VD: Năm của sự tập trung" value={theme} onChange={(e) => setTheme(e.target.value)} /></div>
          <div className="space-y-1"><Label>Mantra / Khẩu hiệu</Label><Input placeholder="VD: Hành động nhỏ, kết quả lớn" value={mantra} onChange={(e) => setMantra(e.target.value)} /></div>

          <Separator />
          <div className="space-y-2">
            <Label className="font-medium">🎯 Goals năm</Label>
            {yearlyGoals.map((g) => {
              const area = LIFE_AREAS.find((a) => a.id === g.area);
              return (
                <div key={g.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                  <span>{area?.icon}</span><span className="flex-1 text-sm">{g.title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeYearlyGoal(g.id)}><X className="w-3 h-3" /></Button>
                </div>
              );
            })}
            <div className="flex gap-2">
              <Select value={newGoalArea} onValueChange={(v) => setNewGoalArea(v as LifeArea)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{LIFE_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Tên goal..." value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && addYearlyGoal()} />
              <Button size="sm" onClick={addYearlyGoal}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          <Separator />
          <div className="space-y-2">
            <Label className="font-medium">📍 Bucket List</Label>
            {bucketList.map((b) => (
              <div key={b.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                <span className="text-sm">{BUCKET_CATEGORIES.find((c) => c.value === b.category)?.label.split(' ')[0]}</span>
                <span className="flex-1 text-sm">{b.title}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBucketItem(b.id)}><X className="w-3 h-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Select value={newBucketCategory} onValueChange={setNewBucketCategory}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{BUCKET_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Mục tiêu..." value={newBucketTitle} onChange={(e) => setNewBucketTitle(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && addBucketItem()} />
              <Button size="sm" onClick={addBucketItem}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          <Separator />
          <div className="space-y-3">
            <Label className="font-medium">📅 Focus theo quý</Label>
            {quarterlyFocus.map((q) => (
              <div key={q.quarter} className="space-y-1">
                <p className="text-sm font-medium">Q{q.quarter}</p>
                {q.focus.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 pl-4">
                    <span className="text-xs text-muted-foreground flex-1">{f}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeQuarterFocus(q.quarter, i)}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 pl-4">
                  <Input placeholder={`Focus Q${q.quarter}...`} value={qFocusInputs[q.quarter] || ''} onChange={(e) => setQFocusInputs({ ...qFocusInputs, [q.quarter]: e.target.value })} className="flex-1 h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && addQuarterFocus(q.quarter)} />
                  <Button size="sm" className="h-8" onClick={() => addQuarterFocus(q.quarter)}><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div className="space-y-1"><Label>Suy ngẫm</Label><Textarea placeholder="Những suy nghĩ và định hướng..." value={reflections} onChange={(e) => setReflections(e.target.value)} rows={3} /></div>

          <Button className="w-full" onClick={handleSave}>{currentPlanning ? 'Cập nhật' : 'Tạo Yearly Planning'}</Button>
        </div>
      </AdaptiveModal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa kế hoạch năm {selectedYear}?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
