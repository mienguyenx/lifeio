import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LifeWheelScore, LIFE_AREAS, LifeArea } from '@/types/lifeos';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LifeWheelTrendChartProps {
  scores: LifeWheelScore[];
}

const AREA_COLORS: Record<string, string> = {
  health: '#22c55e',
  relationships: '#ec4899',
  career: '#3b82f6',
  finance: '#f59e0b',
  personal: '#8b5cf6',
  fun: '#06b6d4',
  environment: '#10b981',
  spirituality: '#a855f7',
  learning: '#6366f1',
  contribution: '#f97316',
};

export function LifeWheelTrendChart({ scores }: LifeWheelTrendChartProps) {
  const [selectedAreas, setSelectedAreas] = useState<LifeArea[]>([]);
  const [showAll, setShowAll] = useState(false);

  const chartData = useMemo(() => {
    return [...scores].reverse().slice(-12).map((score) => ({
      date: format(new Date(score.date), 'dd/MM', { locale: vi }),
      fullDate: format(new Date(score.date), 'dd/MM/yyyy', { locale: vi }),
      ...score.scores,
      average: Number((Object.values(score.scores).reduce((a, b) => a + b, 0) / 10).toFixed(1)),
    }));
  }, [scores]);

  // Calculate trends for each area
  const areaTrends = useMemo(() => {
    if (scores.length < 2) return {};
    
    const latest = scores[0];
    const previous = scores[1];
    
    const trends: Record<string, { change: number; direction: 'up' | 'down' | 'same' }> = {};
    LIFE_AREAS.forEach((area) => {
      const change = (latest?.scores[area.id] || 0) - (previous?.scores[area.id] || 0);
      trends[area.id] = {
        change,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
      };
    });
    return trends;
  }, [scores]);

  // Calculate overall stats
  const stats = useMemo(() => {
    if (scores.length === 0) return null;
    
    const latest = scores[0];
    const avgScore = Object.values(latest.scores).reduce((a, b) => a + b, 0) / 10;
    
    // Find best and worst areas
    const sortedAreas = LIFE_AREAS.map(a => ({
      ...a,
      score: latest.scores[a.id]
    })).sort((a, b) => b.score - a.score);
    
    const bestAreas = sortedAreas.slice(0, 3);
    const worstAreas = sortedAreas.slice(-3).reverse();
    
    // Calculate improvement rate if we have history
    let improvementRate = 0;
    if (scores.length >= 4) {
      const recentAvg = scores.slice(0, 2).reduce((sum, s) => 
        sum + Object.values(s.scores).reduce((a, b) => a + b, 0) / 10, 0) / 2;
      const olderAvg = scores.slice(-2).reduce((sum, s) => 
        sum + Object.values(s.scores).reduce((a, b) => a + b, 0) / 10, 0) / 2;
      improvementRate = recentAvg - olderAvg;
    }
    
    return {
      avgScore,
      bestAreas,
      worstAreas,
      improvementRate,
      totalRecords: scores.length
    };
  }, [scores]);

  const toggleArea = (areaId: LifeArea) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(a => a !== areaId)
        : [...prev, areaId]
    );
  };

  if (scores.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Xu hướng Life Wheel</CardTitle>
          <CardDescription>Cần ít nhất 2 lần đánh giá để xem xu hướng</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Hãy cập nhật Life Wheel thường xuyên để theo dõi tiến bộ của bạn
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayAreas = showAll ? LIFE_AREAS : (selectedAreas.length > 0 
    ? LIFE_AREAS.filter(a => selectedAreas.includes(a.id))
    : []);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Điểm TB hiện tại</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
              <p className="text-xs text-muted-foreground">Lần đánh giá</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className={cn(
                "text-2xl font-bold flex items-center justify-center gap-1",
                stats.improvementRate > 0 ? "text-success" : stats.improvementRate < 0 ? "text-destructive" : ""
              )}>
                {stats.improvementRate > 0 ? <TrendingUp className="w-5 h-5" /> : stats.improvementRate < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                {Math.abs(stats.improvementRate).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Cải thiện</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 justify-center">
                <span className="text-lg">{stats.worstAreas[0]?.icon}</span>
                <span className="font-bold">{stats.worstAreas[0]?.score}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">Cần cải thiện</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">📈 Biểu đồ xu hướng</CardTitle>
              <CardDescription>Theo dõi sự thay đổi điểm số theo thời gian</CardDescription>
            </div>
            <Button 
              variant={showAll ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setShowAll(!showAll);
                if (!showAll) setSelectedAreas([]);
              }}
            >
              {showAll ? 'Ẩn chi tiết' : 'Tất cả areas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                <YAxis domain={[0, 10]} className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [value.toFixed(1), name]}
                />
                {(showAll || displayAreas.length === 0) && (
                  <Area
                    type="monotone"
                    dataKey="average"
                    name="Trung bình"
                    stroke="hsl(var(--primary))"
                    fill="url(#avgGradient)"
                    strokeWidth={3}
                  />
                )}
                {displayAreas.map((area) => (
                  <Line
                    key={area.id}
                    type="monotone"
                    dataKey={area.id}
                    name={area.name}
                    stroke={AREA_COLORS[area.id]}
                    strokeWidth={2}
                    dot={{ fill: AREA_COLORS[area.id], r: 3 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Area Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Chọn mảng để xem chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LIFE_AREAS.map((area) => {
              const trend = areaTrends[area.id];
              const isSelected = selectedAreas.includes(area.id);
              
              return (
                <Button
                  key={area.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    toggleArea(area.id);
                    setShowAll(false);
                  }}
                >
                  <span className="mr-1">{area.icon}</span>
                  <span className="hidden sm:inline">{area.name}</span>
                  {trend && (
                    <span className={cn(
                      "ml-1 flex items-center",
                      trend.direction === 'up' ? "text-success" : trend.direction === 'down' ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : trend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Best/Worst Areas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-success">✨ Mảng tốt nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.bestAreas.map((area, i) => (
                  <div key={area.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{area.icon}</span>
                      <span className="text-sm">{area.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {area.score}/10
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-destructive">⚠️ Cần cải thiện</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.worstAreas.map((area, i) => (
                  <div key={area.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{area.icon}</span>
                      <span className="text-sm">{area.name}</span>
                    </div>
                    <Badge variant="destructive" className="font-bold">
                      {area.score}/10
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
