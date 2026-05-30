import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Bookmark, BookmarkCheck, FileText, Save, History, MoreVertical, X, Download } from 'lucide-react';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { jsPDF } from 'jspdf';

const QUICK_PROMPTS = [
  { icon: '💪', text: 'Làm sao để duy trì habit tốt hơn?' },
  { icon: '🎯', text: 'Gợi ý cách đặt mục tiêu SMART' },
  { icon: '⏰', text: 'Tips quản lý thời gian hiệu quả' },
  { icon: '😌', text: 'Cách giảm stress và cân bằng cuộc sống' },
  { icon: '🧭', text: 'Tư vấn dựa trên Vision & Values của tôi' },
];

const AI_COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

export default function AIChatPage() {
  const chatMessages = useLifeOSStore((s) => s.chatMessages);
  const addChatMessage = useLifeOSStore((s) => s.addChatMessage);
  const clearChatHistory = useLifeOSStore((s) => s.clearChatHistory);
  const toggleMessageFavorite = useLifeOSStore((s) => s.toggleMessageFavorite);
  const savedConversations = useLifeOSStore((s) => s.savedConversations);
  const saveConversation = useLifeOSStore((s) => s.saveConversation);
  const deleteSavedConversation = useLifeOSStore((s) => s.deleteSavedConversation);
  const loadSavedConversation = useLifeOSStore((s) => s.loadSavedConversation);
  const addNote = useLifeOSStore((s) => s.addNote);
  const user = useLifeOSStore((s) => s.user);
  const goals = useLifeOSStore((s) => s.goals);
  const isMobile = useIsMobile();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasContext = !!(
    user.lifePurpose ||
    (user.visions && user.visions.length > 0) ||
    (user.personalValues && user.personalValues.length > 0)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const userContext = {
        lifePurpose: user.lifePurpose,
        visions: user.visions,
        personalValues: user.personalValues,
        lifeRoles: user.lifeRoles,
        traits: user.traits,
        goals: goals.slice(0, 5).map(g => ({ title: g.title, progress: g.progress })),
      };

      const apiMessages = chatMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      apiMessages.push({ role: 'user', content: userMessage });

      const resp = await fetch(AI_COACH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, userContext }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error('Vượt quá giới hạn request. Vui lòng thử lại sau.');
        } else if (resp.status === 402) {
          toast.error('Cần nạp thêm credit cho Lovable AI workspace.');
        }
        throw new Error('Failed to get AI response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';
      let streamDone = false;

      addChatMessage({ role: 'assistant', content: '' });

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              useLifeOSStore.setState((state) => {
                const messages = [...state.chatMessages];
                if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
                  messages[messages.length - 1] = {
                    ...messages[messages.length - 1],
                    content: assistantContent,
                  };
                }
                return { chatMessages: messages };
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              useLifeOSStore.setState((state) => {
                const messages = [...state.chatMessages];
                if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
                  messages[messages.length - 1] = {
                    ...messages[messages.length - 1],
                    content: assistantContent,
                  };
                }
                return { chatMessages: messages };
              });
            }
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error('AI Coach error:', error);
      addChatMessage({
        role: 'assistant',
        content: '❌ Có lỗi xảy ra. Vui lòng thử lại sau.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  const handleSaveConversation = () => {
    if (!conversationTitle.trim()) {
      toast.error('Vui lòng nhập tên cuộc trò chuyện');
      return;
    }
    saveConversation(conversationTitle.trim());
    setConversationTitle('');
    setSaveDialogOpen(false);
    toast.success('Đã lưu cuộc trò chuyện!');
  };

  const handleCreateNoteFromMessage = (content: string) => {
    addNote({
      title: 'Ghi chú từ AI Coach',
      content: content,
      isPinned: false,
      isFavorite: false,
      tags: [],
    });
    toast.success('Đã tạo ghi chú từ tin nhắn!');
  };

  const handleLoadConversation = (id: string) => {
    loadSavedConversation(id);
    setHistoryDialogOpen(false);
    toast.success('Đã tải cuộc trò chuyện!');
  };

  const handleExportPDF = () => {
    if (chatMessages.length === 0) {
      toast.error('Không có tin nhắn để xuất');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Coach - Cuoc tro chuyen', margin, yPos);
    yPos += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Xuat ngay: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, yPos);
    yPos += 15;

    // Messages
    doc.setFontSize(11);
    
    chatMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Ban:' : 'AI Coach:';
      const content = msg.content;
      
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      // Role label
      doc.setFont('helvetica', 'bold');
      doc.text(role, margin, yPos);
      yPos += 6;

      // Message content - split into lines
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
      
      yPos += 8; // Space between messages
    });

    // Save
    const filename = `ai-coach-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    doc.save(filename);
    toast.success('Da xuat PDF thanh cong!');
  };

  return (
    <div className={cn("p-4 md:p-6 h-[calc(100vh-80px)] md:h-[calc(100vh-48px)] flex flex-col", !isMobile && "max-w-4xl mx-auto")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> AI Coach
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">Tư vấn cá nhân hóa</p>
            {hasContext && (
              <Badge variant="secondary" className="text-xs">
                Đã có Vision & Values
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* History Button */}
          <Button variant="ghost" size="icon" title="Lịch sử đã lưu" onClick={() => setHistoryDialogOpen(true)}>
            <History className="w-4 h-4" />
          </Button>
          <AdaptiveModal open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} title="Cuộc trò chuyện đã lưu">
              <ScrollArea className="max-h-[400px]">
                {savedConversations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có cuộc trò chuyện nào được lưu</p>
                ) : (
                  <div className="space-y-2">
                    {savedConversations.map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleLoadConversation(conv.id)}
                        >
                          <p className="font-medium text-sm">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conv.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })} • {conv.messages.length} tin nhắn
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            deleteSavedConversation(conv.id);
                            toast.success('Đã xóa!');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
          </AdaptiveModal>

          {/* Save Conversation Button */}
          {chatMessages.length > 0 && (
            <>
              <Button variant="ghost" size="icon" title="Lưu cuộc trò chuyện" onClick={() => setSaveDialogOpen(true)}>
                <Save className="w-4 h-4" />
              </Button>
              <AdaptiveModal open={saveDialogOpen} onOpenChange={setSaveDialogOpen} title="Lưu cuộc trò chuyện">
                <div className="space-y-4">
                  <Input
                    placeholder="Tên cuộc trò chuyện..."
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveConversation()}
                  />
                  <Button className="w-full" onClick={handleSaveConversation}>
                    <Save className="w-4 h-4 mr-2" /> Lưu
                  </Button>
                </div>
              </AdaptiveModal>
            </>
          )}

          {/* Export PDF Button */}
          {chatMessages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleExportPDF} title="Xuất PDF">
              <Download className="w-4 h-4" />
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={clearChatHistory} title="Xóa lịch sử">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">Xin chào! Tôi là AI Coach</p>
              <p className="text-sm mt-1">
                {hasContext 
                  ? 'Tôi đã hiểu Vision & Values của bạn. Hãy hỏi tôi bất cứ điều gì!'
                  : 'Hãy thiết lập Vision & Values trong trang "Me" để có tư vấn cá nhân hóa hơn'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex gap-3 group', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="relative max-w-[80%]">
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-sm whitespace-pre-wrap',
                        msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary rounded-bl-sm'
                      )}
                    >
                      {msg.content || (msg.role === 'assistant' && isLoading ? '...' : '')}
                    </div>
                    {/* Message actions */}
                    {msg.role === 'assistant' && msg.content && !isLoading && (
                      <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleMessageFavorite(msg.id)}>
                              {msg.isFavorite ? (
                                <><BookmarkCheck className="w-4 h-4 mr-2 text-primary" /> Bỏ yêu thích</>
                              ) : (
                                <><Bookmark className="w-4 h-4 mr-2" /> Yêu thích</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateNoteFromMessage(msg.content)}>
                              <FileText className="w-4 h-4 mr-2" /> Tạo ghi chú
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    {msg.isFavorite && (
                      <BookmarkCheck className="absolute -left-5 top-1 w-4 h-4 text-primary" />
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-secondary p-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Quick Prompts */}
        {chatMessages.length === 0 && (
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Gợi ý:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="text-xs px-3 py-1.5 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {prompt.icon} {prompt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button onClick={handleSend} disabled={!message.trim() || isLoading} size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
