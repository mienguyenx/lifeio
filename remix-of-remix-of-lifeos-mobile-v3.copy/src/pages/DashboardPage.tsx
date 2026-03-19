import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardStatsGrid from '@/components/dashboard/DashboardStatsGrid';
import DashboardRecentActivity from '@/components/dashboard/DashboardRecentActivity';
import DashboardGoalsProgress from '@/components/dashboard/DashboardGoalsProgress';
import DashboardUpcoming from '@/components/dashboard/DashboardUpcoming';
import DashboardAreaSummary from '@/components/dashboard/DashboardAreaSummary';
import DashboardAICoach from '@/components/dashboard/DashboardAICoach';
import WeeklyReviewReminder from '@/components/weeklyreview/WeeklyReviewReminder';
import { AIImprovementSuggestions } from '@/components/ai/AIImprovementSuggestions';
import { LifeWheelMiniChart } from '@/components/lifewheel/LifeWheelMiniChart';

export default function DashboardPage() {
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  
  const [showAiCoach, setShowAiCoach] = useState(false);
  const isMobile = useIsMobile();

  // Get latest life wheel scores or default to 5
  const latestScores = lifeWheelScores[lifeWheelScores.length - 1]?.scores ||
    Object.fromEntries(LIFE_AREAS.map(a => [a.id, 5])) as Record<LifeArea, number>;

  // Mobile optimized layout
  if (isMobile) {
    return (
      <div className="p-3 space-y-4 pb-20 scroll-smooth-mobile">
        {/* Stats Grid - Compact 4 columns */}
        <DashboardStatsGrid />

        {/* Life Wheel - Compact */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium">Life Wheel</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <LifeWheelMiniChart scores={latestScores} size="sm" />
          </CardContent>
        </Card>

        {/* Goals & Recent Activity - Stack on mobile */}
        <DashboardGoalsProgress />
        <DashboardRecentActivity />

        {/* Area Summary */}
        <DashboardAreaSummary />

        {/* Upcoming */}
        <DashboardUpcoming />

        {/* Weekly Review & AI */}
        <WeeklyReviewReminder />
        <AIImprovementSuggestions />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto">
        {/* Stats Grid - Compact overview */}
        <DashboardStatsGrid />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Life Wheel */}
          <Card className="bg-card lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Life Wheel</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <LifeWheelMiniChart scores={latestScores} size="md" />
              {/* Mini scores list */}
              <div className="grid grid-cols-5 gap-1 mt-3 text-center">
                {LIFE_AREAS.slice(0, 5).map((area) => (
                  <div key={area.id} className="text-[10px]">
                    <span>{area.icon}</span>
                    <p className="font-semibold">{(latestScores[area.id] || 5).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Goals */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardRecentActivity />
            <DashboardGoalsProgress />
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <DashboardAreaSummary />
          </div>
          <DashboardUpcoming />
        </div>

        {/* Weekly Review Reminder + AI Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <WeeklyReviewReminder />
          <AIImprovementSuggestions />
        </div>
      </div>

      {/* AI Coach Sidebar - Desktop */}
      {showAiCoach && (
        <div className="w-80 lg:w-96 border-l bg-card p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Coach
              </h2>
              <p className="text-xs text-muted-foreground">Phân tích Life Wheel & Weekly Review</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowAiCoach(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <DashboardAICoach />
          </div>
        </div>
      )}
    </div>
  );
}
