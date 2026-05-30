import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JournalEntry } from '@/types/lifeos';

interface JournalAnalyticsChartProps {
  entries: JournalEntry[];
}

const MOOD_LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt'];
const ENERGY_LABELS = ['', 'Kiệt sức', 'Mệt', 'Bình thường', 'Năng lượng', 'Tràn đầy'];

export function JournalAnalyticsChart({ entries }: JournalAnalyticsChartProps) {
  const last30DaysData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      data.push({
        date: format(date, 'dd/MM'),
        fullDate: dateStr,
        mood: entry?.mood || null,
        energy: entry?.energy || null,
        hasEntry: !!entry,
      });
    }
    return data;
  }, [entries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data.hasEntry) {
        return (
          <div className="bg-popover border rounded-lg p-2 shadow-lg">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">Không có entry</p>
          </div>
        );
      }
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {data.mood && <p className="text-xs">Mood: {MOOD_LABELS[data.mood]}</p>}
          {data.energy && <p className="text-xs">Energy: {ENERGY_LABELS[data.energy]}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Xu hướng 30 ngày</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mood">
          <TabsList className="mb-4">
            <TabsTrigger value="mood">Tâm trạng</TabsTrigger>
            <TabsTrigger value="energy">Năng lượng</TabsTrigger>
            <TabsTrigger value="both">Cả hai</TabsTrigger>
          </TabsList>

          <TabsContent value="mood">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last30DaysData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="energy">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last30DaysData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2) / 0.2)"
                    strokeWidth={2}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="both">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last30DaysData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                    connectNulls
                    name="Mood"
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2) / 0.2)"
                    strokeWidth={2}
                    connectNulls
                    name="Energy"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
