import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, Lightbulb, FileText, History, Download, Trash2, MoreVertical, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import aiRobotImage from '@/assets/ai-robot.png';
import { toast } from 'sonner';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Module configurations with context-specific prompts and suggestions
const MODULE_CONFIG: Record<string, {
  name: string;
  icon: string;
  description: string;
  quickQuestions: string[];
  contextPrompt: string;
}> = {
  '/': {
    name: 'Today',
    icon: '📅',
    description: 'Quản lý ngày hôm nay',
    quickQuestions: [
      'Hôm nay tôi nên ưu tiên làm gì?',
      'Gợi ý lịch trình hiệu quả cho ngày hôm nay',
      'Làm sao để hoàn thành hết tasks hôm nay?',
    ],
    contextPrompt: 'Người dùng đang ở trang TODAY - tập trung vào việc lập kế hoạch và ưu tiên cho ngày hôm nay.'
  },
  '/dashboard': {
    name: 'Dashboard',
    icon: '📊',
    description: 'Tổng quan cuộc sống',
    quickQuestions: [
      'Phân tích tổng quan tình hình của tôi',
      'Mảng nào cần cải thiện nhất?',
      'Đề xuất hành động cho tuần này',
    ],
    contextPrompt: 'Người dùng đang ở DASHBOARD - cung cấp cái nhìn tổng quan và phân tích Life Wheel.'
  },
  '/habits': {
    name: 'Habits',
    icon: '🎯',
    description: 'Quản lý thói quen',
    quickQuestions: [
      'Gợi ý thói quen mới phù hợp với mục tiêu của tôi',
      'Làm sao để duy trì streak thói quen?',
      'Phân tích thói quen hiện tại và đề xuất cải thiện',
    ],
    contextPrompt: 'Người dùng đang ở trang HABITS - tập trung vào việc xây dựng, duy trì và cải thiện thói quen.'
  },
  '/tasks': {
    name: 'Tasks',
    icon: '✅',
    description: 'Quản lý công việc',
    quickQuestions: [
      'Ưu tiên tasks nào trước?',
      'Chia nhỏ task lớn thành subtasks',
      'Gợi ý cách hoàn thành tasks hiệu quả hơn',
    ],
    contextPrompt: 'Người dùng đang ở trang TASKS - hỗ trợ quản lý công việc, ưu tiên và năng suất.'
  },
  '/goals': {
    name: 'Goals',
    icon: '🚀',
    description: 'Quản lý mục tiêu',
    quickQuestions: [
      'Đánh giá tiến độ goals hiện tại',
      'Gợi ý milestone tiếp theo cho goal',
      'Làm sao để đạt goal nhanh hơn?',
    ],
    contextPrompt: 'Người dùng đang ở trang GOALS - hỗ trợ đặt mục tiêu SMART, theo dõi tiến độ và tạo kế hoạch hành động.'
  },
  '/journal': {
    name: 'Journal',
    icon: '📝',
    description: 'Nhật ký cá nhân',
    quickQuestions: [
      'Gợi ý chủ đề viết journal hôm nay',
      'Phân tích xu hướng mood/energy gần đây',
      'Câu hỏi reflection cho ngày hôm nay',
    ],
    contextPrompt: 'Người dùng đang ở trang JOURNAL - hỗ trợ reflection, ghi chép và theo dõi cảm xúc.'
  },
  '/notes': {
    name: 'Notes',
    icon: '📋',
    description: 'Ghi chú',
    quickQuestions: [
      'Gợi ý cách tổ chức notes hiệu quả',
      'Tóm tắt nội dung notes',
      'Tạo template note cho học tập/công việc',
    ],
    contextPrompt: 'Người dùng đang ở trang NOTES - hỗ trợ ghi chép, tổ chức thông tin.'
  },
  '/health': {
    name: 'Sức khỏe',
    icon: '❤️',
    description: 'Quản lý sức khỏe',
    quickQuestions: [
      'Gợi ý thói quen sức khỏe mới',
      'Lập kế hoạch tập luyện tuần này',
      'Cải thiện chế độ ăn uống',
    ],
    contextPrompt: 'Người dùng đang ở trang HEALTH - tập trung vào sức khỏe thể chất, tập luyện, dinh dưỡng và giấc ngủ.'
  },
  '/finance': {
    name: 'Tài chính',
    icon: '💰',
    description: 'Quản lý tài chính',
    quickQuestions: [
      'Gợi ý cách tiết kiệm hiệu quả',
      'Lập ngân sách chi tiêu',
      'Mục tiêu tài chính nên đặt',
    ],
    contextPrompt: 'Người dùng đang ở trang FINANCE - hỗ trợ quản lý tài chính cá nhân, tiết kiệm và đầu tư.'
  },
  '/learning': {
    name: 'Học tập',
    icon: '📚',
    description: 'Quản lý học tập',
    quickQuestions: [
      'Gợi ý phương pháp học hiệu quả',
      'Lập kế hoạch học tập',
      'Kỹ năng nào nên học tiếp?',
    ],
    contextPrompt: 'Người dùng đang ở trang LEARNING - hỗ trợ học tập, phát triển kỹ năng và kiến thức.'
  },
  '/relationships': {
    name: 'Quan hệ',
    icon: '👥',
    description: 'Quản lý mối quan hệ',
    quickQuestions: [
      'Cải thiện mối quan hệ gia đình',
      'Xây dựng networking hiệu quả',
      'Kỹ năng giao tiếp cần cải thiện',
    ],
    contextPrompt: 'Người dùng đang ở trang RELATIONSHIPS - hỗ trợ xây dựng và duy trì các mối quan hệ.'
  },
  '/life-wheel': {
    name: 'Life Wheel',
    icon: '🎡',
    description: 'Bánh xe cuộc sống',
    quickQuestions: [
      'Phân tích chi tiết Life Wheel của tôi',
      'Mảng nào cần cải thiện gấp nhất?',
      'Kế hoạch cân bằng cuộc sống',
    ],
    contextPrompt: 'Người dùng đang ở trang LIFE WHEEL - phân tích sâu về cân bằng cuộc sống và đề xuất cải thiện các mảng yếu.'
  },
  '/weekly-review': {
    name: 'Weekly Review',
    icon: '📆',
    description: 'Đánh giá tuần',
    quickQuestions: [
      'Hướng dẫn làm weekly review hiệu quả',
      'Phân tích tuần vừa qua',
      'Đề xuất focus cho tuần tới',
    ],
    contextPrompt: 'Người dùng đang ở trang WEEKLY REVIEW - hỗ trợ đánh giá tuần, rút bài học và lập kế hoạch tuần mới.'
  },
  '/me': {
    name: 'Profile',
    icon: '👤',
    description: 'Hồ sơ cá nhân',
    quickQuestions: [
      'Gợi ý xác định giá trị cốt lõi',
      'Cách viết life purpose hiệu quả',
      'Xác định vai trò trong cuộc sống',
    ],
    contextPrompt: 'Người dùng đang ở trang PROFILE - hỗ trợ xác định vision, values, life purpose và self-awareness.'
  },
};

const DEFAULT_CONFIG = {
  name: 'AI Coach',
  icon: '🤖',
  description: 'Trợ lý AI thông minh',
  quickQuestions: [
    'Hôm nay tôi nên làm gì?',
    'Gợi ý cải thiện cuộc sống',
    'Phân tích tình hình hiện tại',
  ],
  contextPrompt: 'Hỗ trợ chung về quản lý cuộc sống và phát triển bản thân.'
};

export function AICoachButton() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use global store for chat messages and saved conversations (synced with AIChatPage)
  const chatMessages = useLifeOSStore((s) => s.chatMessages);
  const addChatMessage = useLifeOSStore((s) => s.addChatMessage);
  const clearChatHistory = useLifeOSStore((s) => s.clearChatHistory);
  const savedConversations = useLifeOSStore((s) => s.savedConversations);
  const saveConversation = useLifeOSStore((s) => s.saveConversation);
  const deleteSavedConversation = useLifeOSStore((s) => s.deleteSavedConversation);
  const loadSavedConversation = useLifeOSStore((s) => s.loadSavedConversation);

  // Convert store messages to local format
  const messages: Message[] = chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Get module config based on current route
  const moduleConfig = MODULE_CONFIG[location.pathname] || DEFAULT_CONFIG;

  // Store data
  const user = useLifeOSStore((s) => s.user);
  const habits = useLifeOSStore((s) => s.habits);
  const tasks = useLifeOSStore((s) => s.tasks);
  const goals = useLifeOSStore((s) => s.goals);
  const journalEntries = useLifeOSStore((s) => s.journalEntries);
  const lifeWheelScores = useLifeOSStore((s) => s.lifeWheelScores);
  const weeklyReviews = useLifeOSStore((s) => s.weeklyReviews);
  const addNote = useLifeOSStore((s) => s.addNote);

  const handleSaveAsNote = (content: string) => {
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    addNote({
      title: `AI Coach: ${title}`,
      content: content,
      area: 'personal',
      tags: ['ai-coach'],
    });
    toast.success('Đã lưu thành note!');
  };

  // Save conversation to history (using global store)
  const handleSaveConversation = () => {
    if (messages.length === 0) {
      toast.error('Không có cuộc hội thoại để lưu');
      return;
    }
    const title = messages[0]?.content.slice(0, 40) + (messages[0]?.content.length > 40 ? '...' : '');
    saveConversation(title);
    toast.success('Đã lưu cuộc hội thoại!');
  };

  // Load conversation from history
  const handleLoadConversation = (convId: string) => {
    loadSavedConversation(convId);
    setShowHistory(false);
    toast.success('Đã tải cuộc hội thoại');
  };

  // Delete conversation from history
  const handleDeleteConversation = (id: string) => {
    deleteSavedConversation(id);
    toast.success('Đã xóa cuộc hội thoại');
  };

  // Export conversation
  const handleExportConversation = () => {
    if (messages.length === 0) {
      toast.error('Không có cuộc hội thoại để xuất');
      return;
    }
    const exportContent = messages.map(m => `${m.role === 'user' ? 'Bạn' : 'AI Coach'}: ${m.content}`).join('\n\n');
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-coach-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất cuộc hội thoại!');
  };

  // Clear current conversation (using global store)
  const handleClearConversation = () => {
    clearChatHistory();
    toast.success('Đã xóa cuộc hội thoại hiện tại');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Note: We no longer reset messages when route changes since we're using global store
  // This allows continuity between mobile AI Coach and AIChatPage

  // Build context based on current module
  const buildModuleContext = () => {
    const areaNames: Record<string, string> = {
      health: 'Sức khỏe', emotional: 'Cảm xúc', career: 'Sự nghiệp',
      finance: 'Tài chính', relationships: 'Quan hệ', learning: 'Học tập',
      'personal-goals': 'Mục tiêu', habits: 'Thói quen', fun: 'Giải trí', environment: 'Môi trường'
    };

    const activeHabits = habits.filter((h) => !h.archivedAt && !h.deletedAt);
    const todayHabits = activeHabits.filter((h) => 
      h.frequency === 'daily' || h.customDays?.includes(new Date().getDay())
    );
    const completedHabitsToday = todayHabits.filter((h) => h.completedDates.includes(todayStr));
    
    const activeTasks = tasks.filter((t) => !t.deletedAt);
    const completedTasksToday = activeTasks.filter((t) => t.completedAt?.startsWith(todayStr));
    const pendingTasks = activeTasks.filter((t) => t.status !== 'done');
    const overdueTasks = pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());

    const activeGoals = goals.filter((g) => !g.deletedAt && g.progress < 100);
    const avgGoalProgress = activeGoals.length > 0 
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length) 
      : 0;

    const latestJournal = journalEntries.slice(-1)[0];
    const latestScores = lifeWheelScores[lifeWheelScores.length - 1]?.scores || 
      Object.fromEntries(LIFE_AREAS.map(a => [a.id, 5])) as Record<LifeArea, number>;
    const latestWeeklyReview = weeklyReviews?.slice(-1)[0];

    const formattedScores: Record<string, number> = {};
    Object.entries(latestScores).forEach(([key, value]) => {
      formattedScores[areaNames[key] || key] = value;
    });

    // Base context
    const context: any = {
      currentModule: moduleConfig.name,
      moduleContextPrompt: moduleConfig.contextPrompt,
      lifePurpose: user?.lifePurpose,
      visions: user?.visions,
      personalValues: user?.personalValues,
      lifeRoles: user?.lifeRoles,
      traits: user?.traits,
      lifeWheelScores: formattedScores,
      dailyStats: {
        habitsCompleted: completedHabitsToday.length,
        habitsTotal: todayHabits.length,
        tasksCompleted: completedTasksToday.length,
        tasksPending: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        activeGoals: activeGoals.length,
        avgGoalProgress,
        mood: latestJournal?.mood || 3,
        energy: latestJournal?.energy || 3
      }
    };

    // Add module-specific data
    switch (location.pathname) {
      case '/habits':
        context.habits = activeHabits.map(h => ({
          name: h.name,
          frequency: h.frequency,
          streak: h.streak,
          area: areaNames[h.area] || h.area,
          completedToday: h.completedDates.includes(todayStr)
        }));
        break;
      case '/tasks':
        context.tasks = activeTasks.slice(0, 20).map(t => ({
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          area: areaNames[t.area] || t.area
        }));
        break;
      case '/goals':
        context.goals = activeGoals.map(g => ({
          title: g.title,
          progress: g.progress,
          area: areaNames[g.area] || g.area,
          targetDate: g.targetDate,
          milestones: g.milestones?.slice(0, 5)
        }));
        break;
      case '/journal':
        context.recentJournals = journalEntries.slice(-5).map(j => ({
          date: j.date,
          mood: j.mood,
          energy: j.energy,
          tags: j.tags
        }));
        break;
      case '/weekly-review':
        context.weeklyReview = latestWeeklyReview;
        context.recentReviews = weeklyReviews?.slice(-3);
        break;
    }

    return context;
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    addChatMessage({ role: 'user', content: text });
    setInput('');
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        functionUrl('ai-coach'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            userContext: buildModuleContext()
          })
        }
      );

      if (!response.ok) {
        let errorMessage = 'Không thể kết nối với AI Coach';
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorText;
          } catch {
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // Better error messages
        if (response.status === 404) {
          errorMessage = 'AI Coach chưa được cấu hình. Vui lòng liên hệ quản trị viên.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Bạn cần đăng nhập để sử dụng AI Coach.';
        } else if (response.status === 429) {
          errorMessage = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
        }
        
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        addChatMessage({ role: 'assistant', content: '' });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  // Update last message in store
                  useLifeOSStore.setState((state) => {
                    const msgs = [...state.chatMessages];
                    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
                      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: assistantContent };
                    }
                    return { chatMessages: msgs };
                  });
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Coach error:', error);
      addChatMessage({ 
        role: 'assistant', 
        content: `Xin lỗi, có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 overflow-hidden rounded-full hover:ring-2 hover:ring-primary/30"
            >
              <img 
                src={aiRobotImage} 
                alt="AI Coach" 
                className="h-7 w-7 object-cover"
              />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>AI Coach - {moduleConfig.name}</TooltipContent>
      </Tooltip>
      
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] md:w-[450px] max-w-full p-0 flex flex-col"
        hideCloseButton
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={aiRobotImage} alt="AI Coach" className="w-8 h-8 rounded-full ring-2 ring-primary/20" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI Coach</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span>{moduleConfig.icon}</span>
                {moduleConfig.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
                      <History className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Lịch sử</TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-md max-h-[70vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Lịch sử hội thoại
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[50vh]">
                  {savedConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground text-sm">Chưa có cuộc hội thoại đã lưu</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedConversations.map(conv => (
                        <div 
                          key={conv.id} 
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                          onClick={() => handleLoadConversation(conv.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conv.createdAt).toLocaleDateString('vi-VN')} · {conv.messages.length} tin nhắn
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Actions Menu */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Tùy chọn</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSaveConversation} disabled={messages.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu hội thoại
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportConversation} disabled={messages.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất file (.txt)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearConversation} disabled={messages.length === 0} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa hội thoại
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">

          {/* Quick Questions */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <img src={aiRobotImage} alt="AI Coach" className="w-10 h-10" />
                </div>
                <h3 className="font-medium mb-1">Xin chào! 👋</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Tôi có thể giúp gì cho bạn về {moduleConfig.name}?
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Gợi ý nhanh
                </p>
                <div className="space-y-1.5">
                  {moduleConfig.quickQuestions.map((q, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      className="w-full justify-start text-left text-xs h-auto py-2.5 px-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                    >
                      <span className="truncate">{q}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.length > 0 && (
            <ScrollArea className="flex-1 -mx-4 px-4" ref={scrollRef}>
              <div className="space-y-4 py-2">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.role === 'assistant' && msg.content && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-background/50"
                            onClick={() => handleSaveAsNote(msg.content)}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Lưu Note
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          <div className="pt-4 border-t mt-auto">
            <div className="flex gap-2">
              <Input 
                placeholder={`Hỏi về ${moduleConfig.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={() => sendMessage()} 
                disabled={isLoading || !input.trim()}
                className="shrink-0"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
