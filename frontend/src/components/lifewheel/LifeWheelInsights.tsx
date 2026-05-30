import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LIFE_AREAS, type LifeArea, type LifeWheelScore } from '@/types/lifeos';
import { TrendingUp, TrendingDown, Target, Lightbulb } from 'lucide-react';

interface LifeWheelInsightsProps {
  scores: LifeWheelScore[];
}

const IMPROVEMENT_TIPS: Record<LifeArea, string[]> = {
  health: ['Tập thể dục 30 phút mỗi ngày', 'Ngủ đủ 7-8 tiếng', 'Uống đủ 2L nước/ngày'],
  relationships: ['Dành thời gian cho người thân', 'Gọi điện/nhắn tin bạn bè', 'Tham gia hoạt động nhóm'],
  career: ['Học kỹ năng mới', 'Networking với đồng nghiệp', 'Đặt mục tiêu nghề nghiệp rõ ràng'],
  finance: ['Theo dõi chi tiêu hàng ngày', 'Tiết kiệm 20% thu nhập', 'Học về đầu tư cơ bản'],
  personal: ['Thiền 10 phút mỗi ngày', 'Viết nhật ký', 'Đọc sách phát triển bản thân'],
  fun: ['Dành 1 ngày/tuần cho sở thích', 'Thử điều mới mỗi tháng', 'Xem phim/nghe nhạc thư giãn'],
  environment: ['Dọn dẹp không gian sống', 'Trang trí phòng làm việc', 'Giữ môi trường xanh sạch'],
  spirituality: ['Thiền định hoặc cầu nguyện', 'Tham gia hoạt động từ thiện', 'Kết nối với thiên nhiên'],
  learning: ['Đọc 15 phút/ngày', 'Học online course', 'Viết blog chia sẻ kiến thức'],
  contribution: ['Tình nguyện 1 lần/tháng', 'Mentoring người khác', 'Đóng góp cho cộng đồng'],
};

export function LifeWheelInsights({ scores }: LifeWheelInsightsProps) {
  const insights = useMemo(() => {
    if (scores.length === 0) return null;

    const latestScore = scores[0];
    const previousScore = scores[1];

    // Find lowest and highest areas
    const sortedAreas = LIFE_AREAS.map((area) => ({
      ...area,
      score: latestScore.scores[area.id],
      change: previousScore ? latestScore.scores[area.id] - previousScore.scores[area.id] : 0,
    })).sort((a, b) => a.score - b.score);

    const lowestAreas = sortedAreas.slice(0, 3);
    const highestAreas = sortedAreas.slice(-3).reverse();
    const improvedAreas = sortedAreas.filter((a) => a.change > 0).sort((a, b) => b.change - a.change);
    const declinedAreas = sortedAreas.filter((a) => a.change < 0).sort((a, b) => a.change - b.change);

    return {
      lowestAreas,
      highestAreas,
      improvedAreas: improvedAreas.slice(0, 2),
      declinedAreas: declinedAreas.slice(0, 2),
    };
  }, [scores]);

  if (!insights) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          Insights & Gợi ý
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lowest Areas - Need Improvement */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Cần cải thiện
          </h4>
          <div className="space-y-3">
            {insights.lowestAreas.map((area) => (
              <div key={area.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    {area.icon} {area.name}
                  </span>
                  <Badge variant="outline" className="text-destructive">
                    {area.score}/10
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 {IMPROVEMENT_TIPS[area.id][Math.floor(Math.random() * 3)]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Strongest Areas */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
            ⭐ Điểm mạnh
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.highestAreas.map((area) => (
              <Badge key={area.id} variant="secondary" className="bg-success/10 text-success">
                {area.icon} {area.name}: {area.score}
              </Badge>
            ))}
          </div>
        </div>

        {/* Trends */}
        {(insights.improvedAreas.length > 0 || insights.declinedAreas.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {insights.improvedAreas.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-success" /> Cải thiện
                </h4>
                {insights.improvedAreas.map((area) => (
                  <p key={area.id} className="text-xs text-success">
                    {area.icon} {area.name} +{area.change}
                  </p>
                ))}
              </div>
            )}
            {insights.declinedAreas.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-destructive" /> Giảm
                </h4>
                {insights.declinedAreas.map((area) => (
                  <p key={area.id} className="text-xs text-destructive">
                    {area.icon} {area.name} {area.change}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
