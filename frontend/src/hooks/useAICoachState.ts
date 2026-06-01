import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { functionUrl, getAccessToken } from '@/integrations/api/httpClient';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Module configurations with context-specific prompts and suggestions
export const MODULE_CONFIG: Record<string, {
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
      'Thói quen nào tôi nên bỏ/thêm?',
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
      'Phân tích productivity của tôi',
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
      'Đề xuất goal mới dựa trên Life Wheel',
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
      'Gợi ý gratitude practice',
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
      'Quản lý giấc ngủ tốt hơn',
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
      'Cải thiện thói quen chi tiêu',
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
      'Cách ghi nhớ lâu hơn',
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
      'Cân bằng thời gian cho các mối quan hệ',
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
      'So sánh tiến bộ với tháng trước',
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
      'Bài học rút ra từ tuần này',
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
      'Phát triển điểm mạnh, khắc phục điểm yếu',
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

// Global state to share between mobile and desktop
// Load from localStorage on initialization for persistence
const loadGlobalMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem('lifeos_ai_coach_messages');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[AICoach] Error loading messages from localStorage:', error);
  }
  return [];
};

let globalMessages: Message[] = loadGlobalMessages();
let globalListeners: Set<(messages: Message[]) => void> = new Set();

const notifyListeners = (messages: Message[]) => {
  globalMessages = messages;
  // Persist to localStorage for cross-tab/device sync
  try {
    localStorage.setItem('lifeos_ai_coach_messages', JSON.stringify(messages));
  } catch (error) {
    console.warn('[AICoach] Error saving messages to localStorage:', error);
  }
  // Notify all listeners (across tabs/components)
  globalListeners.forEach(listener => listener(messages));
};

// Listen for storage events to sync across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'lifeos_ai_coach_messages' && e.newValue) {
      try {
        const newMessages = JSON.parse(e.newValue);
        globalMessages = newMessages;
        globalListeners.forEach(listener => listener(newMessages));
      } catch (error) {
        console.warn('[AICoach] Error parsing storage event:', error);
      }
    }
  });
}

export function useAICoachState() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>(globalMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
  const savedConversations = useLifeOSStore((s) => s.savedConversations);
  const saveConversationToStore = useLifeOSStore((s) => s.saveConversation);
  const deleteSavedConversation = useLifeOSStore((s) => s.deleteSavedConversation);

  const todayStr = new Date().toISOString().split('T')[0];

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (newMessages: Message[]) => setMessages(newMessages);
    globalListeners.add(listener);
    return () => { globalListeners.delete(listener); };
  }, []);

  // Build context based on current module
  const buildModuleContext = useCallback(() => {
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
        context.weeklyReview = weeklyReviews?.slice(-1)[0];
        context.recentReviews = weeklyReviews?.slice(-3);
        break;
    }

    return context;
  }, [habits, tasks, goals, journalEntries, lifeWheelScores, weeklyReviews, user, moduleConfig, location.pathname, todayStr]);

  // Fallback AI response when Edge Function is not available
  const useFallbackAIResponse = useCallback(async (messages: Message[], context: any) => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const moduleName = moduleConfig.name;
    
    // Simple rule-based responses based on module and user message
    let response = '';
    
    if (lastUserMessage.toLowerCase().includes('hướng dẫn') || lastUserMessage.toLowerCase().includes('làm sao')) {
      response = `Để sử dụng ${moduleName} hiệu quả:\n\n1. Đặt mục tiêu rõ ràng và cụ thể\n2. Chia nhỏ thành các bước hành động\n3. Theo dõi tiến độ thường xuyên\n4. Điều chỉnh kế hoạch khi cần thiết\n\n💡 Mẹo: Hãy bắt đầu với những thay đổi nhỏ và tăng dần theo thời gian.`;
    } else if (lastUserMessage.toLowerCase().includes('phân tích') || lastUserMessage.toLowerCase().includes('đánh giá')) {
      response = `Dựa trên dữ liệu của bạn:\n\n📊 Tổng quan:\n- Bạn đang có ${habits.length} thói quen\n- ${tasks.filter(t => t.status === 'completed').length}/${tasks.length} tasks đã hoàn thành\n- ${goals.length} mục tiêu đang theo dõi\n\n🎯 Khuyến nghị:\n- Tập trung vào việc hoàn thành các tasks quan trọng\n- Duy trì các thói quen đã có\n- Đánh giá lại mục tiêu định kỳ`;
    } else if (lastUserMessage.toLowerCase().includes('gợi ý') || lastUserMessage.toLowerCase().includes('đề xuất')) {
      response = `Dựa trên ${moduleName}, tôi đề xuất:\n\n1. Xem xét các mục tiêu hiện tại và ưu tiên\n2. Tạo kế hoạch hành động cụ thể\n3. Đặt deadline rõ ràng\n4. Theo dõi và đánh giá tiến độ\n\n💪 Hãy bắt đầu với một hành động nhỏ ngay hôm nay!`;
    } else {
      response = `Cảm ơn bạn đã hỏi về ${moduleName}!\n\nHiện tại AI Coach Edge Function chưa được deploy. Để sử dụng đầy đủ tính năng AI, vui lòng:\n\n1. Deploy Edge Function "ai-coach" lên Supabase\n2. Cấu hình API key (GEMINI_API_KEY, PERPLEXITY_API_KEY, hoặc LOVABLE_API_KEY)\n\n📖 Xem hướng dẫn trong file: DEPLOY_AI_COACH_EDGE_FUNCTION.md\n\nTrong lúc chờ, bạn có thể:\n- Sử dụng các quick questions bên trên\n- Xem các gợi ý có sẵn\n- Quản lý dữ liệu trực tiếp trong ứng dụng`;
    }
    
    // Simulate streaming response
    notifyListeners([...messages, { role: 'assistant', content: '' }]);
    
    // Stream the response character by character for better UX
    let currentContent = '';
    for (let i = 0; i < response.length; i++) {
      currentContent += response[i];
      notifyListeners([...messages, { role: 'assistant', content: currentContent }]);
      await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for streaming effect
    }
    
    setIsLoading(false);
  }, [habits, tasks, goals, moduleConfig]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...globalMessages, userMessage];
    notifyListeners(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Get the user's access token from the LifeOS REST API auth state.
      const accessToken = await getAccessToken();

      // Use fetch for streaming response
      let response: Response;
      try {
        const url = functionUrl('ai-coach');
        response = await fetch(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              messages: newMessages.map(m => ({ role: m.role, content: m.content })),
              userContext: buildModuleContext()
            })
          }
        );
      } catch (fetchError) {
        // Network error - use fallback
        console.warn('AI Coach Edge Function not available, using fallback:', fetchError);
        await useFallbackAIResponse(newMessages, buildModuleContext());
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Không thể kết nối với AI Coach';
        let errorDetails = '';
        
        try {
          const errorText = await response.text();
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorDetails = errorData.error || errorData.message || errorText;
          } catch {
            // If not JSON, use the text directly
            errorDetails = errorText || `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (e) {
          errorDetails = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // Better error messages based on status code
        if (response.status === 404) {
          // Edge Function not deployed - use fallback
          console.warn('AI Coach Edge Function not deployed, using fallback');
          await useFallbackAIResponse(newMessages, buildModuleContext());
          return;
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Bạn cần đăng nhập để sử dụng AI Coach.';
        } else if (response.status === 429) {
          errorMessage = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
        } else if (response.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (errorDetails.includes('Function not found') || errorDetails.includes('not found')) {
          // Edge Function not found - use fallback
          console.warn('AI Coach Edge Function not found, using fallback');
          await useFallbackAIResponse(newMessages, buildModuleContext());
          return;
        } else if (errorDetails) {
          errorMessage = errorDetails;
        }
        
        // Use fallback for 404 or Function not found
        if (response.status === 404 || errorDetails.includes('Function not found') || errorDetails.includes('not found')) {
          console.warn('AI Coach Edge Function not available, using fallback');
          await useFallbackAIResponse(newMessages, buildModuleContext());
          return;
        }
        
        // Only throw error for other status codes
        console.error('AI Coach error:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          url: functionUrl('ai-coach')
        });
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        notifyListeners([...newMessages, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;
                
                // Skip non-JSON lines (like error messages)
                if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
                  console.warn('Skipping non-JSON line:', jsonStr);
                  continue;
                }
                
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  const updatedMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
                  notifyListeners(updatedMessages);
                }
              } catch (parseError) {
                // Log but don't break the stream
                console.warn('Error parsing AI Coach stream line:', line, parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Coach error:', error);
      notifyListeners([...newMessages, { 
        role: 'assistant', 
        content: `Xin lỗi, có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, buildModuleContext]);

  const handleSaveAsNote = useCallback((content: string) => {
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    addNote({
      title: `AI Coach: ${title}`,
      content: content,
      area: 'personal',
      tags: ['ai-coach'],
    });
    toast.success('Đã lưu thành note!');
  }, [addNote]);

  const handleSaveConversation = useCallback(() => {
    if (!conversationTitle.trim()) {
      toast.error('Vui lòng nhập tên cuộc trò chuyện');
      return;
    }
    saveConversationToStore(conversationTitle.trim());
    setConversationTitle('');
    setSaveDialogOpen(false);
    toast.success('Đã lưu cuộc trò chuyện!');
  }, [conversationTitle, saveConversationToStore]);

  const handleLoadConversation = useCallback((conv: typeof savedConversations[0]) => {
    const loadedMessages = conv.messages.map(m => ({ 
      role: m.role as 'user' | 'assistant', 
      content: m.content 
    }));
    notifyListeners(loadedMessages);
    setHistoryDialogOpen(false);
    toast.success('Đã tải cuộc trò chuyện!');
  }, []);

  const handleClearChat = useCallback(() => {
    notifyListeners([]);
    toast.success('Đã xóa lịch sử!');
  }, []);

  const handleExportPDF = useCallback(() => {
    if (globalMessages.length === 0) {
      toast.error('Không có tin nhắn để xuất');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Coach - Cuoc tro chuyen', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Xuat ngay: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, yPos);
    yPos += 15;

    doc.setFontSize(11);
    
    globalMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Ban:' : 'AI Coach:';
      const content = msg.content;
      
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(role, margin, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 5;
      });
      
      yPos += 8;
    });

    const filename = `ai-coach-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    doc.save(filename);
    toast.success('Đã xuất PDF!');
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    moduleConfig,
    scrollRef,
    historyDialogOpen,
    setHistoryDialogOpen,
    saveDialogOpen,
    setSaveDialogOpen,
    conversationTitle,
    setConversationTitle,
    savedConversations,
    deleteSavedConversation,
    sendMessage,
    handleSaveAsNote,
    handleSaveConversation,
    handleLoadConversation,
    handleClearChat,
    handleExportPDF,
  };
}
