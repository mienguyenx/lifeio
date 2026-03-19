import { useState } from 'react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Save, TrendingUp, TrendingDown, Minus, Lightbulb, Target, BarChart3, Calendar, PanelRightClose, PanelRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LifeWheelTrendChart } from '@/components/lifewheel/LifeWheelTrendChart';
import { LifeWheelInsights } from '@/components/lifewheel/LifeWheelInsights';
import { LifeWheelGoals } from '@/components/lifewheel/LifeWheelGoals';
import { LifeWheelHistory } from '@/components/lifewheel/LifeWheelHistory';
import { toast } from 'sonner';

// Default targets for each area
const DEFAULT_TARGETS: Record<LifeArea, number> = {
  health: 8,
  relationships: 8,
  career: 7,
  finance: 7,
  personal: 8,
  fun: 7,
  environment: 7,
  spirituality: 6,
  learning: 7,
  contribution: 6,
};

const LIFE_WHEEL_TIPS = [
  { icon: '🎯', text: 'Đánh giá định kỳ mỗi tuần để theo dõi tiến trình' },
  { icon: '⚖️', text: 'Cân bằng là mục tiêu - không cần tất cả đạt 10' },
  { icon: '🔍', text: 'Tập trung cải thiện 2-3 lĩnh vực yếu nhất' },
  { icon: '📈', text: 'Theo dõi xu hướng quan trọng hơn điểm tuyệt đối' },
  { icon: '🎉', text: 'Ghi nhận những tiến bộ nhỏ mỗi ngày' },
];

export default function LifeWheelPage() {
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const clearLifeWheelHistory = useLifeOSStore((s) => s.clearLifeWheelHistory);
  
  // Use synced store for operations that need to sync to Supabase
  const { addLifeWheelScore, deleteLifeWheelScore } = useSyncedStore();
  const isMobile = useIsMobile();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('lifewheel-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    const newValue = !isSidebarOpen;
    setIsSidebarOpen(newValue);
    localStorage.setItem('lifewheel-sidebar-open', JSON.stringify(newValue));
  };

  const latestScore = lifeWheelScores[0];
  const previousScore = lifeWheelScores[1];

  const [editMode, setEditMode] = useState(!latestScore);
  const [scores, setScores] = useState<Record<LifeArea, number>>(
    latestScore?.scores || LIFE_AREAS.reduce((acc, area) => ({ ...acc, [area.id]: 5 }), {} as Record<LifeArea, number>)
  );
  const [targets, setTargets] = useState<Record<LifeArea, number>>(DEFAULT_TARGETS);

  const handleSave = () => {
    addLifeWheelScore(scores);
    setEditMode(false);
    toast.success('Đã lưu!', { description: 'Điểm Life Wheel đã được cập nhật.' });
  };

  const handleDelete = (id: string) => {
    deleteLifeWheelScore(id);
    toast.success('Đã xóa!', { description: 'Bản ghi đã được xóa.' });
  };

  const handleClearHistory = () => {
    clearLifeWheelHistory();
    toast.success('Đã xóa lịch sử!', { description: 'Chỉ giữ lại bản ghi mới nhất.' });
  };

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / 10;

  const getScoreChange = (area: LifeArea) => {
    if (!previousScore) return 0;
    return (latestScore?.scores[area] || 0) - (previousScore.scores[area] || 0);
  };

  // Get lowest and highest areas
  const sortedAreas = [...LIFE_AREAS].sort((a, b) => scores[a.id] - scores[b.id]);
  const lowestAreas = sortedAreas.slice(0, 3);
  const highestAreas = sortedAreas.slice(-3).reverse();

  // SVG Wheel with responsive viewBox
  const WheelChart = () => {
    const size = 360; // Fixed viewBox size
    const center = size / 2;
    const maxRadius = (size / 2) - 40;

    return (
      <div className="w-full max-w-[360px] mx-auto aspect-square">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {/* Background circles */}
          {[2, 4, 6, 8, 10].map((level) => (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={(level / 10) * maxRadius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray={level === 10 ? "0" : "4 4"}
            />
          ))}

          {/* Area segments */}
          {LIFE_AREAS.map((area, index) => {
            const angle = (index * 36 - 90) * (Math.PI / 180);
            const nextAngle = ((index + 1) * 36 - 90) * (Math.PI / 180);
            const score = scores[area.id];
            const radius = (score / 10) * maxRadius;

            const x1 = center + radius * Math.cos(angle);
            const y1 = center + radius * Math.sin(angle);
            const x2 = center + radius * Math.cos(nextAngle);
            const y2 = center + radius * Math.sin(nextAngle);

            const labelRadius = maxRadius + 22;
            const labelAngle = ((index * 36 + 18) - 90) * (Math.PI / 180);
            const labelX = center + labelRadius * Math.cos(labelAngle);
            const labelY = center + labelRadius * Math.sin(labelAngle);

            return (
              <g key={area.id}>
                <path
                  d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                  fill={`hsl(var(--${area.color}) / 0.6)`}
                  stroke={`hsl(var(--${area.color}))`}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <line
                  x1={center}
                  y1={center}
                  x2={center + maxRadius * Math.cos(angle)}
                  y2={center + maxRadius * Math.sin(angle)}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-base fill-muted-foreground"
                  style={{ fontSize: '16px' }}
                >
                  {area.icon}
                </text>
              </g>
            );
          })}

          <circle cx={center} cy={center} r="30" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
          <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-foreground" style={{ fontSize: '18px' }}>
            {averageScore.toFixed(1)}
          </text>
        </svg>
      </div>
    );
  };

  const [activeTab, setActiveTab] = useState('wheel');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Life Wheel</h1>
          <p className="text-muted-foreground">Đánh giá cân bằng cuộc sống</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'wheel' && (
            !editMode ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setEditMode(true)}>Cập nhật</Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-0 shadow-lg">
                    <p className="font-medium">Chỉnh sửa điểm số</p>
                    <p className="text-xs opacity-90">Cập nhật đánh giá cho các lĩnh vực cuộc sống</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Lưu</Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-0 shadow-lg">
                    <p className="font-medium">Lưu thay đổi</p>
                    <p className="text-xs opacity-90">Lưu điểm số và cập nhật biểu đồ Life Wheel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden xl:flex h-8 px-2 gap-1"
                  onClick={toggleSidebar}
                >
                  {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSidebarOpen ? 'Ẩn sidebar' : 'Hiện sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="wheel" className="text-xs md:text-sm px-2 py-1.5">🎡 <span className="hidden sm:inline">Bánh xe</span></TabsTrigger>
              <TabsTrigger value="trends" className="text-xs md:text-sm px-2 py-1.5">📈 <span className="hidden sm:inline">Xu hướng</span></TabsTrigger>
              <TabsTrigger value="goals" className="text-xs md:text-sm px-2 py-1.5">🎯 <span className="hidden sm:inline">Mục tiêu</span></TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm px-2 py-1.5">📋 <span className="hidden sm:inline">Lịch sử</span></TabsTrigger>
            </TabsList>

            <TabsContent value="wheel" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Wheel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bánh xe cuộc sống</CardTitle>
                    {latestScore && (
                      <p className="text-sm text-muted-foreground">
                        Cập nhật: {format(new Date(latestScore.date), 'dd/MM/yyyy', { locale: vi })}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <WheelChart />
                  </CardContent>
                </Card>

                {/* Scores List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{editMode ? 'Chỉnh sửa điểm số' : 'Chi tiết điểm số'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {LIFE_AREAS.map((area) => {
                      const change = getScoreChange(area.id);
                      return (
                        <div key={area.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{area.icon}</span>
                              <span className="font-medium text-sm">{area.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold" style={{ color: `hsl(var(--${area.color}))` }}>
                                {scores[area.id]}
                              </span>
                              {previousScore && !editMode && (
                                <span className={cn(
                                  "flex items-center text-xs",
                                  change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {change !== 0 && Math.abs(change)}
                                </span>
                              )}
                            </div>
                          </div>
                          {editMode && (
                            <Slider
                              value={[scores[area.id]]}
                              onValueChange={([value]) => setScores({ ...scores, [area.id]: value })}
                              min={1}
                              max={10}
                              step={1}
                              className="cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              {lifeWheelScores.length > 0 && (
                <LifeWheelInsights scores={lifeWheelScores} />
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <LifeWheelTrendChart scores={lifeWheelScores} />
              
              {/* History */}
              {lifeWheelScores.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lịch sử đánh giá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {lifeWheelScores.slice(0, 8).map((score, index) => {
                        const avg = Object.values(score.scores).reduce((a, b) => a + b, 0) / 10;
                        return (
                          <div key={score.id} className={cn(
                            "shrink-0 text-center p-3 rounded-lg min-w-[80px]",
                            index === 0 ? "bg-primary/10 ring-2 ring-primary/20" : "bg-secondary"
                          )}>
                            <p className="text-2xl font-bold">{avg.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(score.date), 'dd/MM', { locale: vi })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <LifeWheelGoals
                latestScore={latestScore}
                targets={targets}
                onTargetsChange={setTargets}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <LifeWheelHistory
                scores={lifeWheelScores}
                onDelete={handleDelete}
                onClearAll={handleClearHistory}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "hidden xl:block transition-all duration-300",
          isSidebarOpen ? "w-80" : "w-0"
        )}>
          {isSidebarOpen && (
            <div className="space-y-4 sticky top-4">
              {/* Current Score Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Điểm hiện tại
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold">{averageScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Điểm trung bình</p>
                  </div>
                  <Progress value={averageScore * 10} className="h-2" />
                </CardContent>
              </Card>

              {/* Lowest Areas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    Cần cải thiện
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {lowestAreas.map(area => (
                    <div key={area.id} className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 text-sm">
                      <span className="flex items-center gap-2">
                        <span>{area.icon}</span>
                        {area.name}
                      </span>
                      <Badge variant="outline" className="text-rose-500">{scores[area.id]}/10</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Highest Areas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Điểm mạnh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {highestAreas.map(area => (
                    <div key={area.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-sm">
                      <span className="flex items-center gap-2">
                        <span>{area.icon}</span>
                        {area.name}
                      </span>
                      <Badge variant="outline" className="text-emerald-500">{scores[area.id]}/10</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Mẹo Life Wheel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {LIFE_WHEEL_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <span>{tip.icon}</span>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* History Count */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Thống kê
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tổng đánh giá</span>
                    <span className="font-medium">{lifeWheelScores.length}</span>
                  </div>
                  {latestScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cập nhật gần nhất</span>
                      <span className="font-medium">
                        {format(new Date(latestScore.date), 'dd/MM', { locale: vi })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
