import { Lightbulb, AlertTriangle, PartyPopper, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRecommendations, type Recommendation } from '@/hooks/useRecommendations';
import { Link } from 'react-router-dom';

const TYPE_STYLES: Record<string, { icon: React.ReactNode; bg: string }> = {
  action: { icon: <Zap className="w-3 h-3 text-primary" />, bg: 'bg-primary/8' },
  insight: { icon: <Lightbulb className="w-3 h-3 text-amber-500" />, bg: 'bg-amber-500/8' },
  warning: { icon: <AlertTriangle className="w-3 h-3 text-destructive" />, bg: 'bg-destructive/8' },
  celebration: { icon: <PartyPopper className="w-3 h-3 text-green-500" />, bg: 'bg-green-500/8' },
};

export function RecommendationsCard() {
  const recommendations = useRecommendations();

  if (recommendations.length === 0) return null;

  return (
    <Card className="border-accent/20">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold">Gợi ý cho bạn</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{recommendations.length} items</span>
        </div>
        <div className="space-y-1.5">
          {recommendations.slice(0, 4).map((rec) => {
            const style = TYPE_STYLES[rec.type] || TYPE_STYLES.action;
            return (
              <div key={rec.id} className={cn('flex items-start gap-2 px-2 py-1.5 rounded-md', style.bg)}>
                <div className="mt-0.5 shrink-0">{style.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{rec.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{rec.description}</p>
                </div>
                {rec.actionRoute && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                    <Link to={rec.actionRoute}><ChevronRight className="w-3 h-3" /></Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
