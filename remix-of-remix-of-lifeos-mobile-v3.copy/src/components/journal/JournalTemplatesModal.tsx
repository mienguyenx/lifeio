import { Sun, Moon, Calendar, Sparkles, Heart, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface JournalTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  prompts: string[];
  gratitudePrompt?: string;
}

const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'morning',
    name: 'Buổi sáng',
    icon: <Sun className="w-4 h-4" />,
    description: 'Bắt đầu ngày mới với mindset tích cực',
    prompts: [
      '3 điều tôi biết ơn hôm nay:',
      'Mục tiêu quan trọng nhất hôm nay:',
      'Tôi sẽ làm gì để chăm sóc bản thân hôm nay?',
    ],
    gratitudePrompt: 'Tôi biết ơn...',
  },
  {
    id: 'evening',
    name: 'Buổi tối',
    icon: <Moon className="w-4 h-4" />,
    description: 'Tổng kết và suy ngẫm về một ngày',
    prompts: [
      'Điều tốt đẹp nhất hôm nay là gì?',
      'Tôi đã học được gì hôm nay?',
      'Ngày mai tôi muốn cải thiện điều gì?',
    ],
    gratitudePrompt: 'Khoảnh khắc đáng nhớ hôm nay',
  },
  {
    id: 'weekly',
    name: 'Tổng kết tuần',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Nhìn lại tuần qua và lên kế hoạch',
    prompts: [
      'Thành tựu nổi bật tuần này:',
      'Thử thách tôi đã vượt qua:',
      'Điều tôi muốn làm khác đi tuần sau:',
      'Mục tiêu tuần tới:',
    ],
    gratitudePrompt: 'Người/điều tôi biết ơn tuần này',
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    icon: <Heart className="w-4 h-4" />,
    description: 'Tập trung vào lòng biết ơn',
    prompts: [
      '3 điều nhỏ bé nhưng tuyệt vời hôm nay:',
      'Người tôi muốn cảm ơn:',
      'Điều tôi thường bỏ qua nhưng thực ra rất may mắn:',
    ],
    gratitudePrompt: 'Tôi biết ơn vì...',
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Kết nối với cảm xúc và hiện tại',
    prompts: [
      'Cảm xúc chính của tôi lúc này:',
      'Điều gì đang khiến tôi lo lắng?',
      'Điều gì mang lại bình yên cho tôi?',
      'Tôi cần gì để cảm thấy tốt hơn?',
    ],
  },
  {
    id: 'goals',
    name: 'Mục tiêu',
    icon: <Target className="w-4 h-4" />,
    description: 'Theo dõi tiến độ mục tiêu',
    prompts: [
      'Tiến độ mục tiêu quan trọng nhất:',
      'Trở ngại tôi đang gặp phải:',
      'Hành động nhỏ tôi có thể làm ngay:',
      'Động lực của tôi là gì?',
    ],
  },
];

interface JournalTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (content: string, gratitude: string) => void;
}

export function JournalTemplatesModal({
  open,
  onOpenChange,
  onSelectTemplate,
}: JournalTemplatesModalProps) {
  const handleSelect = (template: JournalTemplate) => {
    const content = template.prompts.join('\n\n');
    const gratitude = template.gratitudePrompt || '';
    onSelectTemplate(content, gratitude);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn Template Journal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          {JOURNAL_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                "bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
