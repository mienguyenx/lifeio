import { useState } from 'react';
import { HelpCircle, X, Lightbulb, Target, CheckCircle2, Flame, BookOpen, Wallet, Heart, Users, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type ModuleType = 'tasks' | 'habits' | 'goals' | 'journal' | 'finance' | 'health' | 'relationships' | 'learning' | 'notes' | 'lifewheel' | 'weeklyreview';

interface ModuleHelpButtonProps {
  module: ModuleType;
  className?: string;
}

const MODULE_HELP_CONTENT: Record<ModuleType, {
  title: string;
  icon: React.ElementType;
  description: string;
  tips: { icon: string; title: string; content: string }[];
  shortcuts?: { key: string; action: string }[];
}> = {
  tasks: {
    title: 'Hướng dẫn Tasks',
    icon: CheckCircle2,
    description: 'Quản lý công việc hàng ngày với Tasks. Sử dụng Kanban board để theo dõi tiến độ và Pomodoro để tăng năng suất.',
    tips: [
      { icon: '📋', title: 'Tạo task mới', content: 'Nhấn nút "+" hoặc Enter để thêm task. Đặt deadline và priority cho tasks quan trọng.' },
      { icon: '🎯', title: 'Kanban Board', content: 'Kéo thả tasks giữa các cột Todo, In Progress, Deferred và Done để cập nhật trạng thái.' },
      { icon: '🍅', title: 'Pomodoro Timer', content: 'Sử dụng timer 25 phút để tập trung. Sau 4 pomodoro, nghỉ dài 15-30 phút.' },
      { icon: '🔗', title: 'Liên kết Goal', content: 'Gán task vào Goal để theo dõi tiến độ mục tiêu dài hạn.' },
      { icon: '📊', title: 'Lọc & Sắp xếp', content: 'Lọc theo area, priority, due date. Sắp xếp theo deadline hoặc độ ưu tiên.' },
    ],
    shortcuts: [
      { key: 'N', action: 'Thêm task mới' },
      { key: 'Enter', action: 'Lưu task' },
      { key: 'Esc', action: 'Hủy chỉnh sửa' },
    ],
  },
  habits: {
    title: 'Hướng dẫn Habits',
    icon: Flame,
    description: 'Xây dựng thói quen tốt với Habits. Theo dõi streak và hoàn thành thử thách để duy trì động lực.',
    tips: [
      { icon: '✅', title: 'Check-in hàng ngày', content: 'Nhấn vào habit card để đánh dấu hoàn thành. Một số habit có thể check nhiều lần/ngày.' },
      { icon: '🔥', title: 'Streak & Best Streak', content: 'Giữ streak liên tiếp để xây dựng thói quen. Best streak được ghi nhận vĩnh viễn.' },
      { icon: '🏆', title: 'Thử thách', content: 'Tham gia thử thách 21/30/66 ngày để định hình thói quen lâu dài.' },
      { icon: '📅', title: 'Tùy chỉnh lịch', content: 'Chọn daily, weekly hoặc custom days phù hợp với mục tiêu của bạn.' },
      { icon: '📈', title: 'Prediction', content: 'AI dự đoán xác suất duy trì habit dựa trên lịch sử của bạn.' },
    ],
  },
  goals: {
    title: 'Hướng dẫn Goals',
    icon: Target,
    description: 'Đặt và theo dõi mục tiêu dài hạn với Goals. Chia nhỏ thành milestones và liên kết với tasks, habits.',
    tips: [
      { icon: '🎯', title: 'SMART Goals', content: 'Đặt mục tiêu Specific, Measurable, Achievable, Relevant, Time-bound.' },
      { icon: '📍', title: 'Milestones', content: 'Chia goal thành các mốc nhỏ để dễ theo dõi và tạo động lực.' },
      { icon: '🔗', title: 'Liên kết Tasks/Habits', content: 'Gán tasks và habits vào goal để tự động cập nhật tiến độ.' },
      { icon: '⚡', title: 'Focus Mode', content: 'Đánh dấu goal ưu tiên để tập trung và nhận nhắc nhở.' },
      { icon: '📊', title: 'Progress Tracking', content: 'Theo dõi % hoàn thành qua milestones và linked items.' },
    ],
  },
  journal: {
    title: 'Hướng dẫn Journal',
    icon: BookOpen,
    description: 'Ghi chép suy nghĩ và cảm xúc hàng ngày với Journal. Theo dõi mood và năng lượng theo thời gian.',
    tips: [
      { icon: '📝', title: 'Daily Entry', content: 'Viết journal mỗi ngày để ghi lại suy nghĩ, học hỏi và gratitude.' },
      { icon: '😊', title: 'Mood Tracking', content: 'Đánh giá mood từ 1-5 để theo dõi sức khỏe tinh thần.' },
      { icon: '⚡', title: 'Energy Level', content: 'Ghi nhận mức năng lượng để tìm ra pattern tối ưu.' },
      { icon: '🏷️', title: 'Tags & Areas', content: 'Thêm tags và life areas để phân loại và tìm kiếm dễ dàng.' },
      { icon: '🙏', title: 'Gratitude', content: 'Liệt kê 3 điều biết ơn mỗi ngày để tăng cường positive mindset.' },
    ],
  },
  finance: {
    title: 'Hướng dẫn Finance',
    icon: Wallet,
    description: 'Quản lý tài chính cá nhân với Finance. Theo dõi thu chi, đặt ngân sách và mục tiêu tiết kiệm.',
    tips: [
      { icon: '💰', title: 'Ghi chép thu chi', content: 'Ghi lại tất cả giao dịch để có cái nhìn tổng quan về tài chính.' },
      { icon: '📊', title: 'Phân loại chi tiêu', content: 'Phân chia theo danh mục để biết tiền đi đâu.' },
      { icon: '🎯', title: 'Ngân sách', content: 'Đặt ngân sách cho từng danh mục và theo dõi so với thực tế.' },
      { icon: '🏦', title: 'Mục tiêu tiết kiệm', content: 'Tạo savings goals cho mục tiêu lớn: nhà, xe, du lịch...' },
      { icon: '📈', title: 'Net Worth', content: 'Theo dõi tổng tài sản ròng theo thời gian.' },
    ],
  },
  health: {
    title: 'Hướng dẫn Health',
    icon: Heart,
    description: 'Chăm sóc sức khỏe toàn diện với Health. Theo dõi cân nặng, giấc ngủ, tập luyện và dinh dưỡng.',
    tips: [
      { icon: '⚖️', title: 'Cân nặng', content: 'Ghi nhận cân nặng định kỳ để theo dõi xu hướng.' },
      { icon: '😴', title: 'Giấc ngủ', content: 'Log thời gian và chất lượng giấc ngủ mỗi đêm.' },
      { icon: '🏃', title: 'Tập luyện', content: 'Ghi chép các buổi tập với loại bài tập và thời gian.' },
      { icon: '🥗', title: 'Dinh dưỡng', content: 'Theo dõi chế độ ăn uống và uống nước.' },
      { icon: '💊', title: 'Thuốc & Vitamin', content: 'Đặt nhắc nhở uống thuốc/vitamin định kỳ.' },
    ],
  },
  relationships: {
    title: 'Hướng dẫn Relationships',
    icon: Users,
    description: 'Xây dựng và duy trì các mối quan hệ quan trọng với Relationships.',
    tips: [
      { icon: '👥', title: 'Danh bạ', content: 'Lưu thông tin người quan trọng: gia đình, bạn bè, đồng nghiệp.' },
      { icon: '📅', title: 'Lịch liên lạc', content: 'Đặt reminder để liên lạc định kỳ với từng người.' },
      { icon: '🎁', title: 'Dịp đặc biệt', content: 'Ghi nhớ sinh nhật, kỷ niệm và các dịp quan trọng.' },
      { icon: '💬', title: 'Log tương tác', content: 'Ghi chép các cuộc gặp gỡ và nội dung đã trao đổi.' },
      { icon: '⭐', title: 'Priority Circles', content: 'Phân loại mối quan hệ theo độ thân thiết.' },
    ],
  },
  learning: {
    title: 'Hướng dẫn Learning',
    icon: GraduationCap,
    description: 'Phát triển bản thân với Learning. Theo dõi sách, khóa học và kỹ năng mới.',
    tips: [
      { icon: '📚', title: 'Reading List', content: 'Quản lý danh sách sách đang đọc, muốn đọc và đã đọc.' },
      { icon: '🎓', title: 'Khóa học', content: 'Theo dõi tiến độ các khóa học online.' },
      { icon: '🧠', title: 'Kỹ năng', content: 'Đánh giá và phát triển các kỹ năng cần thiết.' },
      { icon: '📝', title: 'Notes', content: 'Ghi chép kiến thức mới học được.' },
      { icon: '🎯', title: 'Learning Goals', content: 'Đặt mục tiêu học tập theo quarter/năm.' },
    ],
  },
  notes: {
    title: 'Hướng dẫn Notes',
    icon: BookOpen,
    description: 'Ghi chép và tổ chức ý tưởng với Notes. Hỗ trợ markdown và tags.',
    tips: [
      { icon: '📝', title: 'Quick Notes', content: 'Ghi nhanh ý tưởng bất cứ lúc nào.' },
      { icon: '📂', title: 'Tổ chức', content: 'Sử dụng tags và areas để phân loại notes.' },
      { icon: '📌', title: 'Pin Notes', content: 'Ghim notes quan trọng để truy cập nhanh.' },
      { icon: '🔍', title: 'Tìm kiếm', content: 'Tìm kiếm theo tiêu đề, nội dung hoặc tags.' },
      { icon: '✨', title: 'Markdown', content: 'Sử dụng markdown để format nội dung.' },
    ],
  },
  lifewheel: {
    title: 'Hướng dẫn Life Wheel',
    icon: Sparkles,
    description: 'Đánh giá sự cân bằng cuộc sống với Life Wheel. Xác định areas cần cải thiện.',
    tips: [
      { icon: '🎡', title: 'Đánh giá định kỳ', content: 'Chấm điểm 10 life areas mỗi tuần/tháng.' },
      { icon: '📊', title: 'So sánh xu hướng', content: 'So sánh với các lần đánh giá trước.' },
      { icon: '🎯', title: 'Focus Areas', content: 'Xác định 2-3 areas ưu tiên cải thiện.' },
      { icon: '💡', title: 'Insights', content: 'AI đưa ra gợi ý dựa trên kết quả đánh giá.' },
      { icon: '🔗', title: 'Liên kết Goals', content: 'Tạo goals cho areas cần nâng cao.' },
    ],
  },
  weeklyreview: {
    title: 'Hướng dẫn Weekly Review',
    icon: Target,
    description: 'Tổng kết và lập kế hoạch mỗi tuần với Weekly Review. Phản ánh và đặt mục tiêu.',
    tips: [
      { icon: '📅', title: 'Review cuối tuần', content: 'Dành 30 phút cuối tuần để đánh giá và lập kế hoạch.' },
      { icon: '🏆', title: 'Wins & Challenges', content: 'Ghi nhận thành tích và thử thách trong tuần.' },
      { icon: '💡', title: 'Lessons Learned', content: 'Đúc kết bài học để cải thiện tuần sau.' },
      { icon: '🎯', title: 'Next Week Focus', content: 'Xác định 3 ưu tiên cho tuần mới.' },
      { icon: '😊', title: 'Overall Rating', content: 'Đánh giá tổng thể tuần vừa qua.' },
    ],
  },
};

export function ModuleHelpButton({ module, className }: ModuleHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = MODULE_HELP_CONTENT[module];
  const Icon = content.icon;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", className)}
        onClick={() => setIsOpen(true)}
        title="Hướng dẫn sử dụng"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {content.title}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {content.description}
              </p>

              {/* Tips */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  Mẹo sử dụng
                </h4>
                {content.tips.map((tip, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-lg">{tip.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tip.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tip.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Keyboard Shortcuts */}
              {content.shortcuts && content.shortcuts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">⌨️ Phím tắt</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {content.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <kbd className="px-2 py-1 rounded bg-muted font-mono">{shortcut.key}</kbd>
                        <span className="text-muted-foreground">{shortcut.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
