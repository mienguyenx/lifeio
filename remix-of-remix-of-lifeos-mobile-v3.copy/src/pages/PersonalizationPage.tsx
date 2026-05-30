import { useState } from 'react';
import { Settings2, Brain, Clock, Target, Sparkles, Sun, Moon, Zap, GripVertical, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS } from '@/types/lifeos';
import type { AITone, PlanningStyle, UserArchetype, LifeArea } from '@/types/lifeos';
import { toast } from 'sonner';

const AI_TONES: { value: AITone; label: string; desc: string }[] = [
  { value: 'gentle', label: 'Nhẹ nhàng', desc: 'Động viên, khuyến khích' },
  { value: 'direct', label: 'Thẳng thắn', desc: 'Nói thẳng, không vòng vo' },
  { value: 'strategic', label: 'Chiến lược', desc: 'Phân tích logic, kế hoạch' },
  { value: 'concise', label: 'Ngắn gọn', desc: 'Ít chữ, đi vào trọng tâm' },
  { value: 'detailed', label: 'Chi tiết', desc: 'Giải thích kỹ, nhiều ví dụ' },
];

const PLANNING_STYLES: { value: PlanningStyle; label: string; desc: string }[] = [
  { value: 'deep_work', label: 'Deep Work', desc: 'Tập trung sâu, ít task' },
  { value: 'sprint', label: 'Sprint', desc: 'Pomodoro, làm nhanh nghỉ ngắn' },
  { value: 'checklist', label: 'Checklist', desc: 'Danh sách to-do rõ ràng' },
  { value: 'calendar', label: 'Calendar', desc: 'Time-blocking theo giờ' },
  { value: 'flexible', label: 'Linh hoạt', desc: 'Tùy ngày, không cứng nhắc' },
];

const ARCHETYPES: { value: UserArchetype; label: string; desc: string; emoji: string }[] = [
  { value: 'beginner', label: 'Người mới', desc: 'Mới bắt đầu tổ chức cuộc sống', emoji: '🌱' },
  { value: 'busy_professional', label: 'Dân công sở', desc: 'Nhiều việc, cần tối ưu thời gian', emoji: '💼' },
  { value: 'builder', label: 'Người xây dựng', desc: 'Có mục tiêu lớn, cần hệ thống', emoji: '🏗️' },
  { value: 'student', label: 'Sinh viên', desc: 'Học tập & phát triển bản thân', emoji: '📚' },
  { value: 'health_focused', label: 'Sức khỏe', desc: 'Ưu tiên sức khỏe & thể chất', emoji: '💪' },
  { value: 'recovery', label: 'Phục hồi', desc: 'Đang lấy lại nhịp sống', emoji: '🌿' },
  { value: 'reflective', label: 'Chiêm nghiệm', desc: 'Journal, review, tự vấn', emoji: '🔮' },
];

export default function PersonalizationPage() {
  const prefs = useLifeOSStore((s) => s.userPreferences);
  const setUserPreferences = useLifeOSStore((s) => s.setUserPreferences);

  const [localPrefs, setLocalPrefs] = useState(prefs);

  const update = (partial: Partial<typeof localPrefs>) => {
    setLocalPrefs((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    setUserPreferences(localPrefs);
    toast.success('Đã lưu cài đặt cá nhân hóa!');
  };

  const toggleAreaPriority = (area: LifeArea) => {
    const current = localPrefs.lifeAreaPriorities || [];
    if (current.includes(area)) {
      update({ lifeAreaPriorities: current.filter((a) => a !== area) });
    } else {
      update({ lifeAreaPriorities: [...current, area] });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Cá nhân hóa
          </h1>
          <p className="text-sm text-muted-foreground">Tùy chỉnh LifeOS theo phong cách của bạn</p>
        </div>
        <Button onClick={handleSave} className="gap-1.5">
          <Save className="w-4 h-4" /> Lưu
        </Button>
      </div>

      {/* Archetype */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Phong cách sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.value}
                onClick={() => update({ archetype: arch.value })}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center',
                  localPrefs.archetype === arch.value
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                )}
              >
                <span className="text-xl">{arch.emoji}</span>
                <span className="text-xs font-medium">{arch.label}</span>
                <span className="text-[10px] text-muted-foreground line-clamp-2">{arch.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Tone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-medium mb-2 block">Giọng điệu AI</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AI_TONES.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => update({ aiTone: tone.value })}
                  className={cn(
                    'flex flex-col p-2.5 rounded-lg border transition-all text-left',
                    localPrefs.aiTone === tone.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className="text-xs font-medium">{tone.label}</span>
                  <span className="text-[10px] text-muted-foreground">{tone.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Trọng tâm coaching</Label>
            <Input
              placeholder="VD: productivity, health, balance..."
              value={localPrefs.coachingFocus || ''}
              onChange={(e) => update({ coachingFocus: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Energy & Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Năng lượng & Lịch trình
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                <Sun className="w-3 h-3 inline mr-1" /> Giờ thức dậy
              </Label>
              <Input
                type="time"
                value={localPrefs.wakeUpTime || '07:00'}
                onChange={(e) => update({ wakeUpTime: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                <Moon className="w-3 h-3 inline mr-1" /> Giờ đi ngủ
              </Label>
              <Input
                type="time"
                value={localPrefs.sleepTime || '23:00'}
                onChange={(e) => update({ sleepTime: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                <Zap className="w-3 h-3 inline mr-1" /> Peak bắt đầu
              </Label>
              <Input
                type="time"
                value={localPrefs.energyPeakStart || '09:00'}
                onChange={(e) => update({ energyPeakStart: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                <Zap className="w-3 h-3 inline mr-1" /> Peak kết thúc
              </Label>
              <Input
                type="time"
                value={localPrefs.energyPeakEnd || '12:00'}
                onChange={(e) => update({ energyPeakEnd: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Phong cách lập kế hoạch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLANNING_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => update({ planningStyle: style.value })}
                className={cn(
                  'flex flex-col p-2.5 rounded-lg border transition-all text-left',
                  localPrefs.planningStyle === style.value
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <span className="text-xs font-medium">{style.label}</span>
                <span className="text-[10px] text-muted-foreground">{style.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Life Area Priorities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ưu tiên Life Areas</CardTitle>
          <p className="text-xs text-muted-foreground">Chọn theo thứ tự ưu tiên, area chọn trước = quan trọng hơn</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LIFE_AREAS.map((area) => {
              const idx = localPrefs.lifeAreaPriorities?.indexOf(area.id) ?? -1;
              const isSelected = idx >= 0;
              return (
                <button
                  key={area.id}
                  onClick={() => toggleAreaPriority(area.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 opacity-60'
                  )}
                >
                  <span>{area.icon}</span>
                  <span className="font-medium">{area.name}</span>
                  {isSelected && (
                    <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[9px] ml-0.5">
                      {idx + 1}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông báo & Hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Check-in buổi sáng</Label>
              <p className="text-[10px] text-muted-foreground">Hiện form check-in mỗi sáng</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={localPrefs.morningCheckinTime || '07:00'}
                onChange={(e) => update({ morningCheckinTime: e.target.value })}
                className="h-8 w-24 text-xs"
              />
              <Switch
                checked={localPrefs.morningCheckinEnabled}
                onCheckedChange={(v) => update({ morningCheckinEnabled: v })}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Review buổi tối</Label>
              <p className="text-[10px] text-muted-foreground">Hiện form review mỗi tối</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={localPrefs.eveningReviewTime || '21:00'}
                onChange={(e) => update({ eveningReviewTime: e.target.value })}
                className="h-8 w-24 text-xs"
              />
              <Switch
                checked={localPrefs.eveningReviewEnabled}
                onCheckedChange={(v) => update({ eveningReviewEnabled: v })}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Today Focus Card</Label>
              <p className="text-[10px] text-muted-foreground">Hiện phần tóm tắt trọng tâm</p>
            </div>
            <Switch
              checked={localPrefs.showTodayFocus}
              onCheckedChange={(v) => update({ showTodayFocus: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">AI Suggestions</Label>
              <p className="text-[10px] text-muted-foreground">Hiện gợi ý AI trên trang Today</p>
            </div>
            <Switch
              checked={localPrefs.showAISuggestions}
              onCheckedChange={(v) => update({ showAISuggestions: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Streak Badges</Label>
              <p className="text-[10px] text-muted-foreground">Hiện badge streak trên habits</p>
            </div>
            <Switch
              checked={localPrefs.showStreaks}
              onCheckedChange={(v) => update({ showStreaks: v })}
            />
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">Ngày review tuần</Label>
            <Select
              value={String(localPrefs.preferredReviewDay ?? 0)}
              onValueChange={(v) => update({ preferredReviewDay: parseInt(v) })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Chủ nhật</SelectItem>
                <SelectItem value="1">Thứ hai</SelectItem>
                <SelectItem value="5">Thứ sáu</SelectItem>
                <SelectItem value="6">Thứ bảy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} size="lg" className="gap-2">
          <Save className="w-4 h-4" /> Lưu tất cả
        </Button>
      </div>
    </div>
  );
}
