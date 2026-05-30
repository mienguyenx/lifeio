import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { LifeWheelScore, LIFE_AREAS, LifeArea } from '@/types/lifeos';
import { format, subMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trash2, Search, Filter, Calendar, Eye, BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LifeWheelHistoryProps {
  scores: LifeWheelScore[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

type FilterPeriod = 'all' | '1month' | '3months' | '6months' | '1year';
type SortBy = 'date-desc' | 'date-asc' | 'score-high' | 'score-low';

export function LifeWheelHistory({ scores, onDelete, onClearAll }: LifeWheelHistoryProps) {
  const [searchDate, setSearchDate] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [selectedScore, setSelectedScore] = useState<LifeWheelScore | null>(null);
  const isMobile = useIsMobile();

  const filteredScores = useMemo(() => {
    let result = [...scores];

    // Filter by date search
    if (searchDate) {
      result = result.filter((s) => s.date.includes(searchDate));
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (filterPeriod) {
        case '1month': startDate = subMonths(now, 1); break;
        case '3months': startDate = subMonths(now, 3); break;
        case '6months': startDate = subMonths(now, 6); break;
        case '1year': startDate = subMonths(now, 12); break;
        default: startDate = new Date(0);
      }
      result = result.filter((s) => isAfter(parseISO(s.date), startDate));
    }

    // Sort
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'score-high':
        result.sort((a, b) => {
          const avgA = Object.values(a.scores).reduce((sum, v) => sum + v, 0) / 10;
          const avgB = Object.values(b.scores).reduce((sum, v) => sum + v, 0) / 10;
          return avgB - avgA;
        });
        break;
      case 'score-low':
        result.sort((a, b) => {
          const avgA = Object.values(a.scores).reduce((sum, v) => sum + v, 0) / 10;
          const avgB = Object.values(b.scores).reduce((sum, v) => sum + v, 0) / 10;
          return avgA - avgB;
        });
        break;
    }

    return result;
  }, [scores, searchDate, filterPeriod, sortBy]);

  // Chart data for comparison
  const comparisonChartData = useMemo(() => {
    if (filteredScores.length < 2) return null;
    return filteredScores.slice(0, 6).reverse().map((score) => ({
      date: format(new Date(score.date), 'dd/MM', { locale: vi }),
      average: Object.values(score.scores).reduce((a, b) => a + b, 0) / 10,
      ...score.scores,
    }));
  }, [filteredScores]);

  // Radar chart data for selected score
  const radarData = useMemo(() => {
    if (!selectedScore) return null;
    return LIFE_AREAS.map((area) => ({
      area: area.name,
      score: selectedScore.scores[area.id],
      fullMark: 10,
    }));
  }, [selectedScore]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={cn("flex gap-3 flex-wrap", isMobile && "flex-col")}>
            <div className="flex-1 min-w-[150px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo ngày (dd/mm/yyyy)"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="1month">1 tháng</SelectItem>
                <SelectItem value="3months">3 tháng</SelectItem>
                <SelectItem value="6months">6 tháng</SelectItem>
                <SelectItem value="1year">1 năm</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Mới nhất</SelectItem>
                <SelectItem value="date-asc">Cũ nhất</SelectItem>
                <SelectItem value="score-high">Điểm cao → thấp</SelectItem>
                <SelectItem value="score-low">Điểm thấp → cao</SelectItem>
              </SelectContent>
            </Select>
            {scores.length > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> Xóa tất cả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Xóa toàn bộ lịch sử?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Thao tác này sẽ xóa toàn bộ lịch sử Life Wheel (giữ lại bản mới nhất). Bạn không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground">
                      Xóa tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      {comparisonChartData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              So sánh điểm trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                  <YAxis domain={[0, 10]} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="average" name="Trung bình" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Lịch sử ({filteredScores.length} bản ghi)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredScores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Không tìm thấy bản ghi nào</p>
          ) : (
            filteredScores.map((score, index) => {
              const avg = Object.values(score.scores).reduce((a, b) => a + b, 0) / 10;
              const prevScore = filteredScores[index + 1];
              const prevAvg = prevScore ? Object.values(prevScore.scores).reduce((a, b) => a + b, 0) / 10 : avg;
              const change = avg - prevAvg;

              return (
                <div
                  key={score.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    index === 0 ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", getScoreColor(avg))}>{avg.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">trung bình</p>
                    </div>
                    <div>
                      <p className="font-medium">{format(new Date(score.date), 'dd/MM/yyyy', { locale: vi })}</p>
                      {index === 0 && <Badge variant="secondary" className="text-xs">Mới nhất</Badge>}
                    </div>
                    {prevScore && (
                      <div className={cn(
                        "flex items-center text-sm",
                        change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : change < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
                        {change !== 0 ? (change > 0 ? '+' : '') + change.toFixed(1) : '0'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedScore(score)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Chi tiết - {format(new Date(score.date), 'dd/MM/yyyy', { locale: vi })}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {radarData && (
                            <div className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="area" className="text-xs" />
                                  <PolarRadiusAxis domain={[0, 10]} />
                                  <Radar name="Điểm" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {LIFE_AREAS.map((area) => (
                              <div key={area.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                                <span className="text-sm">{area.icon} {area.name}</span>
                                <Badge variant="outline" className={getScoreColor(score.scores[area.id])}>
                                  {score.scores[area.id]}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {index !== 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa bản ghi này?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn sắp xóa bản ghi ngày {format(new Date(score.date), 'dd/MM/yyyy', { locale: vi })}. Thao tác này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(score.id)} className="bg-destructive text-destructive-foreground">
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
