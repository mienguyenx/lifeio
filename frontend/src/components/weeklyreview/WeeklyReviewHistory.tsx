import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { WeeklyReview } from '@/types/lifeos';
import { format, subMonths, isAfter, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trash2, Search, Filter, Calendar, Eye, BarChart3, TrendingUp, TrendingDown, Trophy, AlertCircle, Lightbulb, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeeklyReviewHistoryProps {
  reviews: WeeklyReview[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const RATING_OPTIONS = [
  { value: 1, label: '😢 Tệ', emoji: '😢' },
  { value: 2, label: '😕 Chưa tốt', emoji: '😕' },
  { value: 3, label: '😐 Bình thường', emoji: '😐' },
  { value: 4, label: '🙂 Tốt', emoji: '🙂' },
  { value: 5, label: '🌟 Tuyệt vời', emoji: '🌟' },
];

type FilterPeriod = 'all' | '1month' | '3months' | '6months' | '1year';
type SortBy = 'date-desc' | 'date-asc' | 'rating-high' | 'rating-low';
type FilterRating = 'all' | '1' | '2' | '3' | '4' | '5';

export function WeeklyReviewHistory({ reviews, onDelete, onClearAll }: WeeklyReviewHistoryProps) {
  const [searchText, setSearchText] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [selectedReview, setSelectedReview] = useState<WeeklyReview | null>(null);
  const isMobile = useIsMobile();

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter((r) =>
        r.wins.some((w) => w.toLowerCase().includes(search)) ||
        r.challenges.some((c) => c.toLowerCase().includes(search)) ||
        r.lessonsLearned.some((l) => l.toLowerCase().includes(search)) ||
        r.nextWeekFocus.some((f) => f.toLowerCase().includes(search)) ||
        r.weekStart.includes(searchText)
      );
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
      result = result.filter((r) => isAfter(parseISO(r.weekStart), startDate));
    }

    // Filter by rating
    if (filterRating !== 'all') {
      result = result.filter((r) => r.overallRating === parseInt(filterRating));
    }

    // Sort
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());
        break;
      case 'rating-high':
        result.sort((a, b) => b.overallRating - a.overallRating);
        break;
      case 'rating-low':
        result.sort((a, b) => a.overallRating - b.overallRating);
        break;
    }

    return result;
  }, [reviews, searchText, filterPeriod, filterRating, sortBy]);

  // Rating trend chart
  const ratingChartData = useMemo(() => {
    if (filteredReviews.length < 2) return null;
    return filteredReviews.slice(0, 12).reverse().map((review) => ({
      week: format(new Date(review.weekStart), 'dd/MM', { locale: vi }),
      rating: review.overallRating,
      wins: review.wins.length,
      challenges: review.challenges.length,
    }));
  }, [filteredReviews]);

  // Stats
  const stats = useMemo(() => {
    if (filteredReviews.length === 0) return null;
    const avgRating = filteredReviews.reduce((sum, r) => sum + r.overallRating, 0) / filteredReviews.length;
    const totalWins = filteredReviews.reduce((sum, r) => sum + r.wins.length, 0);
    const totalLessons = filteredReviews.reduce((sum, r) => sum + r.lessonsLearned.length, 0);
    const bestWeek = filteredReviews.reduce((best, r) => r.overallRating > best.overallRating ? r : best);
    return { avgRating, totalWins, totalLessons, bestWeek };
  }, [filteredReviews]);

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
                  placeholder="Tìm kiếm nội dung..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
              <SelectTrigger className="w-[130px]">
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
            <Select value={filterRating} onValueChange={(v) => setFilterRating(v as FilterRating)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ⭐</SelectItem>
                {RATING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>{opt.emoji} {opt.value}/5</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Mới nhất</SelectItem>
                <SelectItem value="date-asc">Cũ nhất</SelectItem>
                <SelectItem value="rating-high">Rating cao</SelectItem>
                <SelectItem value="rating-low">Rating thấp</SelectItem>
              </SelectContent>
            </Select>
            {reviews.length > 0 && (
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
                      Thao tác này sẽ xóa toàn bộ Weekly Reviews. Bạn không thể hoàn tác.
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

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Rating TB</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-success">{stats.totalWins}</p>
              <p className="text-xs text-muted-foreground">Tổng wins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-info">{stats.totalLessons}</p>
              <p className="text-xs text-muted-foreground">Bài học</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{filteredReviews.length}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Trend Chart */}
      {ratingChartData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Xu hướng đánh giá
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs fill-muted-foreground" />
                  <YAxis domain={[0, 5]} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="rating" name="Rating" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="wins" name="Wins" stroke="hsl(var(--success))" strokeWidth={2} />
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
            Lịch sử ({filteredReviews.length} reviews)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredReviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Không tìm thấy review nào</p>
          ) : (
            filteredReviews.map((review, index) => (
              <div
                key={review.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  index === 0 ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-secondary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {RATING_OPTIONS.find((r) => r.value === review.overallRating)?.emoji}
                  </span>
                  <div>
                    <p className="font-medium">Tuần {format(new Date(review.weekStart), 'dd/MM/yyyy', { locale: vi })}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.wins.length} wins • {review.lessonsLearned.length} lessons
                    </p>
                  </div>
                  {index === 0 && <Badge variant="secondary" className="text-xs">Mới nhất</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedReview(review)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {RATING_OPTIONS.find((r) => r.value === review.overallRating)?.emoji}
                          Tuần {format(new Date(review.weekStart), 'dd/MM/yyyy', { locale: vi })}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {review.wins.length > 0 && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <Trophy className="w-4 h-4 text-warning" /> Chiến thắng
                            </h4>
                            <ul className="space-y-1">
                              {review.wins.map((win, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-success">✓</span> {win}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {review.challenges.length > 0 && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-destructive" /> Thách thức
                            </h4>
                            <ul className="space-y-1">
                              {review.challenges.map((c, i) => (
                                <li key={i} className="text-sm text-muted-foreground">• {c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {review.lessonsLearned.length > 0 && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-info" /> Bài học
                            </h4>
                            <ul className="space-y-1">
                              {review.lessonsLearned.map((l, i) => (
                                <li key={i} className="text-sm text-muted-foreground">💡 {l}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {review.nextWeekFocus.length > 0 && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-primary" /> Focus tuần sau
                            </h4>
                            <ul className="space-y-1">
                              {review.nextWeekFocus.map((f, i) => (
                                <li key={i} className="text-sm">🎯 {f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa review này?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn sắp xóa review tuần {format(new Date(review.weekStart), 'dd/MM/yyyy', { locale: vi })}. Thao tác này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(review.id)} className="bg-destructive text-destructive-foreground">
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
