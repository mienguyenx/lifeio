import { useState } from 'react';
import { Lightbulb, Target, TrendingUp, Calendar, Rocket, GraduationCap, Heart, DollarSign, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { toast } from 'sonner';
import { addDays, addMonths, format } from 'date-fns';

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  area: LifeArea;
  milestones: string[];
  durationDays: number;
  tips?: string;
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  // SMART Goals
  {
    id: 'smart-fitness',
    name: 'Giảm cân SMART',
    description: 'Giảm X kg trong Y tháng với chế độ tập luyện và ăn uống khoa học',
    icon: <Heart className="w-5 h-5 text-red-500" />,
    category: 'SMART Goals',
    area: 'health',
    milestones: [
      'Lập kế hoạch ăn uống chi tiết',
      'Tập luyện đều đặn 3 lần/tuần',
      'Theo dõi cân nặng hàng tuần',
      'Đạt 50% mục tiêu giảm cân',
      'Duy trì thói quen 1 tháng',
      'Đạt mục tiêu cuối cùng',
    ],
    durationDays: 90,
    tips: 'Đặt mục tiêu cụ thể: "Giảm 5kg" thay vì "Giảm cân"',
  },
  {
    id: 'smart-savings',
    name: 'Tiết kiệm SMART',
    description: 'Tiết kiệm X triệu trong Y tháng với kế hoạch chi tiêu hợp lý',
    icon: <DollarSign className="w-5 h-5 text-green-500" />,
    category: 'SMART Goals',
    area: 'finance',
    milestones: [
      'Phân tích chi tiêu hiện tại',
      'Lập ngân sách hàng tháng',
      'Cắt giảm chi tiêu không cần thiết',
      'Đạt 25% mục tiêu tiết kiệm',
      'Đạt 50% mục tiêu tiết kiệm',
      'Đạt 75% mục tiêu tiết kiệm',
      'Hoàn thành mục tiêu tiết kiệm',
    ],
    durationDays: 180,
  },
  {
    id: 'smart-learning',
    name: 'Học kỹ năng mới SMART',
    description: 'Thành thạo kỹ năng X trong Y tháng với lộ trình học tập rõ ràng',
    icon: <GraduationCap className="w-5 h-5 text-blue-500" />,
    category: 'SMART Goals',
    area: 'learning',
    milestones: [
      'Nghiên cứu và chọn tài liệu học',
      'Hoàn thành kiến thức cơ bản',
      'Thực hành dự án nhỏ đầu tiên',
      'Hoàn thành 50% lộ trình',
      'Xây dựng portfolio/dự án thực tế',
      'Đánh giá và cải thiện',
    ],
    durationDays: 90,
  },

  // OKR Templates
  {
    id: 'okr-career',
    name: 'OKR Phát triển sự nghiệp',
    description: 'Objective: Thăng tiến trong công việc với Key Results cụ thể',
    icon: <Rocket className="w-5 h-5 text-purple-500" />,
    category: 'OKR',
    area: 'career',
    milestones: [
      'KR1: Hoàn thành 3 dự án quan trọng',
      'KR2: Học 2 kỹ năng mới liên quan',
      'KR3: Nhận feedback tích cực từ 5 đồng nghiệp',
      'KR4: Được giao thêm trách nhiệm mới',
      'Review và điều chỉnh OKR',
    ],
    durationDays: 90,
    tips: 'OKR nên được review hàng tuần và điều chỉnh nếu cần',
  },
  {
    id: 'okr-health',
    name: 'OKR Sức khỏe tổng thể',
    description: 'Objective: Cải thiện sức khỏe toàn diện với các Key Results đo lường được',
    icon: <Heart className="w-5 h-5 text-red-500" />,
    category: 'OKR',
    area: 'health',
    milestones: [
      'KR1: Tập gym/chạy bộ 12 buổi/tháng',
      'KR2: Ngủ đủ 7-8 tiếng 25 ngày/tháng',
      'KR3: Uống đủ 2L nước mỗi ngày',
      'KR4: Khám sức khỏe định kỳ',
      'Review và đánh giá tiến độ',
    ],
    durationDays: 90,
  },

  // 12-Week Year
  {
    id: '12week-project',
    name: '12-Week Year: Dự án cá nhân',
    description: 'Hoàn thành dự án cá nhân quan trọng trong 12 tuần với focus cao độ',
    icon: <Calendar className="w-5 h-5 text-orange-500" />,
    category: '12-Week Year',
    area: 'personal',
    milestones: [
      'Tuần 1-2: Lập kế hoạch chi tiết',
      'Tuần 3-4: Hoàn thành 25% dự án',
      'Tuần 5-6: Đánh giá và điều chỉnh',
      'Tuần 7-8: Hoàn thành 50% dự án',
      'Tuần 9-10: Hoàn thành 75% dự án',
      'Tuần 11: Hoàn thiện và kiểm tra',
      'Tuần 12: Launch và đánh giá kết quả',
    ],
    durationDays: 84,
    tips: 'Review tiến độ mỗi tuần và có accountability partner',
  },

  // 90-Day Goals
  {
    id: '90day-habit',
    name: '90 ngày xây dựng thói quen',
    description: 'Xây dựng thói quen mới bền vững trong 90 ngày',
    icon: <Target className="w-5 h-5 text-primary" />,
    category: '90-Day Goals',
    area: 'personal',
    milestones: [
      'Ngày 1-7: Bắt đầu với cam kết nhỏ',
      'Ngày 8-21: Duy trì đều đặn (giai đoạn khó)',
      'Ngày 22-40: Tăng cường độ/thời gian',
      'Ngày 41-60: Thói quen trở nên tự động',
      'Ngày 61-80: Tối ưu và cải thiện',
      'Ngày 81-90: Củng cố và đánh giá',
    ],
    durationDays: 90,
  },
  {
    id: '90day-relationship',
    name: '90 ngày cải thiện mối quan hệ',
    description: 'Xây dựng và củng cố các mối quan hệ quan trọng',
    icon: <Heart className="w-5 h-5 text-pink-500" />,
    category: '90-Day Goals',
    area: 'relationships',
    milestones: [
      'Liệt kê 5 mối quan hệ quan trọng nhất',
      'Lên kế hoạch kết nối định kỳ',
      'Thực hiện 10 cuộc gọi/gặp mặt có ý nghĩa',
      'Giải quyết 1 mâu thuẫn đang tồn tại',
      'Tạo 2 kỷ niệm đáng nhớ',
      'Đánh giá và lên kế hoạch duy trì',
    ],
    durationDays: 90,
  },
];

const CATEGORIES = ['Tất cả', 'SMART Goals', 'OKR', '12-Week Year', '90-Day Goals'];

interface GoalTemplatesCardProps {
  onGoalCreated?: () => void;
}

export function GoalTemplatesCard({ onGoalCreated }: GoalTemplatesCardProps) {
  const addGoal = useLifeOSStore((s) => s.addGoal);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [customization, setCustomization] = useState({
    title: '',
    description: '',
    area: '' as LifeArea | '',
    targetDate: '',
    customMilestones: '',
  });

  const filteredTemplates = selectedCategory === 'Tất cả' 
    ? GOAL_TEMPLATES 
    : GOAL_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: GoalTemplate) => {
    const targetDate = format(addDays(new Date(), template.durationDays), 'yyyy-MM-dd');
    setSelectedTemplate(template);
    setCustomization({
      title: template.name,
      description: template.description,
      area: template.area,
      targetDate,
      customMilestones: template.milestones.join('\n'),
    });
  };

  const handleCreateGoal = () => {
    if (!customization.title.trim() || !customization.area) return;
    
    addGoal({
      title: customization.title,
      description: customization.description || undefined,
      area: customization.area as LifeArea,
      targetDate: customization.targetDate || undefined,
      milestones: customization.customMilestones.split('\n').filter(Boolean),
      reminderEnabled: true,
      reminderDays: 7,
    });

    toast.success('Đã tạo goal từ template!');
    setSelectedTemplate(null);
    onGoalCreated?.();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Goal Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Bắt đầu nhanh với các mẫu goal đã được thiết kế sẵn
        </p>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Chọn Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Chọn Goal Template</DialogTitle>
            </DialogHeader>

            {!selectedTemplate ? (
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <Badge 
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>

                {/* Templates Grid */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTemplates.map(template => (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-secondary shrink-0">
                              {template.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {template.category}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {template.durationDays} ngày
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              /* Customization Form */
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedTemplate(null)}
                  className="mb-2"
                >
                  ← Quay lại chọn template
                </Button>

                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  {selectedTemplate.icon}
                  <div>
                    <p className="font-medium">{selectedTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.category}</p>
                  </div>
                </div>

                {selectedTemplate.tips && (
                  <div className="p-3 bg-primary/10 rounded-lg text-sm">
                    💡 <span className="font-medium">Tip:</span> {selectedTemplate.tips}
                  </div>
                )}

                <div>
                  <Label>Tiêu đề Goal *</Label>
                  <Input 
                    value={customization.title}
                    onChange={(e) => setCustomization({ ...customization, title: e.target.value })}
                    placeholder="Tên goal của bạn"
                  />
                </div>

                <div>
                  <Label>Mô tả</Label>
                  <Textarea 
                    value={customization.description}
                    onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lĩnh vực</Label>
                    <Select 
                      value={customization.area} 
                      onValueChange={(v) => setCustomization({ ...customization, area: v as LifeArea })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LIFE_AREAS.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.icon} {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ngày mục tiêu</Label>
                    <Input 
                      type="date"
                      value={customization.targetDate}
                      onChange={(e) => setCustomization({ ...customization, targetDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Milestones (mỗi dòng 1 milestone)</Label>
                  <Textarea 
                    value={customization.customMilestones}
                    onChange={(e) => setCustomization({ ...customization, customMilestones: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <Button className="w-full" onClick={handleCreateGoal}>
                  <Target className="w-4 h-4 mr-2" />
                  Tạo Goal từ Template
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-lg font-bold">{GOAL_TEMPLATES.length}</p>
            <p className="text-[10px] text-muted-foreground">Templates</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-lg font-bold">{CATEGORIES.length - 1}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
