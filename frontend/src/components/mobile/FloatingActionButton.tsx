import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import aiRobotImage from '@/assets/ai-robot.png';
import { Send, Loader2, Lightbulb, X, FileText, History, Save, Download, Trash2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAICoachState } from '@/hooks/useAICoachState';
import { useState, useRef, useEffect } from 'react';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isRunning, sessionsCompleted, timeRemaining } = usePomodoroStore();
  const pomodoroSettings = useLifeOSStore((s) => s.pomodoroSettings);
  const pomodoroActive = isRunning || sessionsCompleted > 0 || timeRemaining !== pomodoroSettings.workDuration * 60;

  const {
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
  } = useAICoachState();

  if (!isMobile) return null;

  // Shared Header Actions - same as Desktop
  const HeaderActions = () => (
    <div className="flex items-center gap-0.5">
      {/* History Button */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Lịch sử đã lưu">
            <History className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Cuộc trò chuyện đã lưu</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {savedConversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Chưa có cuộc trò chuyện nào được lưu</p>
            ) : (
              <div className="space-y-2">
                {savedConversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleLoadConversation(conv)}
                    >
                      <p className="font-medium text-sm">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })} • {conv.messages.length} tin nhắn
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => deleteSavedConversation(conv.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Save Conversation Button */}
      {messages.length > 0 && (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Lưu cuộc trò chuyện">
              <Save className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lưu cuộc trò chuyện</DialogTitle>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      )}

      {/* Export PDF Button */}
      {messages.length > 0 && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPDF} title="Xuất PDF">
          <Download className="w-4 h-4" />
        </Button>
      )}

      {/* Clear Chat Button */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClearChat} title="Xóa lịch sử">
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Close Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 shrink-0"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  // Coach Content - same structure as Desktop
  const CoachContent = () => (
    <div className="flex flex-col h-full">
      {/* Module Context Header */}
      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{moduleConfig.icon}</span>
            <div>
              <h3 className="font-medium text-sm">{moduleConfig.name}</h3>
              <p className="text-xs text-muted-foreground">{moduleConfig.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Gợi ý cho {moduleConfig.name}
          </h3>
          <div className="space-y-1">
            {moduleConfig.quickQuestions.map((q, i) => (
              <Button 
                key={i} 
                variant="ghost" 
                className="w-full justify-start text-xs h-auto py-2 px-3"
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <ScrollArea className="flex-1 mb-4 border rounded-lg p-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                <div 
                  className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'assistant' && msg.content && (
                  <div className="mt-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs text-muted-foreground"
                      onClick={() => handleSaveAsNote(msg.content)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Lưu note
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang suy nghĩ...
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <div className="mt-auto pt-3 border-t">
        <div className="flex gap-2">
          <Input 
            ref={inputRef}
            placeholder={`Hỏi về ${moduleConfig.name}...`}
            value={input}
            onChange={(e) => {
              const newValue = e.target.value;
              setInput(newValue);
              // Prevent keyboard from closing on mobile - refocus immediately
              if (isMobile && inputRef.current) {
                // Use requestAnimationFrame to ensure focus happens after state update
                requestAnimationFrame(() => {
                  if (inputRef.current && document.activeElement !== inputRef.current) {
                    inputRef.current.focus();
                    // Set cursor to end
                    const length = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(length, length);
                  }
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            onFocus={(e) => {
              // Ensure input stays focused
              if (isMobile) {
                e.target.focus();
              }
            }}
            onBlur={(e) => {
              // Prevent blur on mobile when typing - only allow blur for send button
              if (isMobile && e.target.value.length > 0) {
                const relatedTarget = e.relatedTarget as HTMLElement;
                const sendButton = e.currentTarget.parentElement?.querySelector('button[type="button"]');
                
                // Allow blur only if clicking on send button
                if (relatedTarget && sendButton && (relatedTarget === sendButton || sendButton.contains(relatedTarget))) {
                  return; // Allow blur for send button
                }
                
                // Prevent blur for all other cases (scroll, touch outside, etc.)
                e.preventDefault();
                requestAnimationFrame(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    const length = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(length, length);
                  }
                });
              }
            }}
            onPointerDown={(e) => {
              // Prevent pointer events from causing blur
              if (isMobile) {
                e.stopPropagation();
              }
            }}
            onTouchStart={(e) => {
              // Prevent touch events from causing blur
              if (isMobile) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              // Ensure input stays focused on click
              if (isMobile && inputRef.current) {
                e.stopPropagation();
                inputRef.current.focus();
              }
            }}
            disabled={isLoading}
            autoFocus={false}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="send"
            readOnly={false}
          />
          <Button size="icon" onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "fixed right-4 bottom-24 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
            "bg-primary text-primary-foreground overflow-hidden",
            "transform transition-all duration-300 active:scale-95",
            fabPosition
          )}
        >
          <img 
            src={aiRobotImage} 
            alt="AI Coach" 
            className="w-10 h-10 object-cover"
          />
        </button>
      </SheetTrigger>

      <SheetContent 
        side="right" 
        className="w-full max-w-full p-4 [&>button:first-of-type]:hidden"
        onOpenAutoFocus={(e) => {
          // Prevent auto focus from closing keyboard on mobile
          e.preventDefault();
        }}
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-2">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Coach - {moduleConfig.name}
          </SheetTitle>
          <HeaderActions />
        </SheetHeader>
        <div 
          className="mt-4 h-[calc(100vh-8rem)] overflow-auto"
          onTouchStart={(e) => {
            // Prevent scroll from closing keyboard when input is focused
            if (isMobile && inputRef.current && document.activeElement === inputRef.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchMove={(e) => {
            // Allow scrolling but prevent blur
            if (isMobile && inputRef.current && document.activeElement === inputRef.current) {
              // Don't prevent default, just ensure input stays focused
              requestAnimationFrame(() => {
                if (inputRef.current && document.activeElement !== inputRef.current) {
                  inputRef.current.focus();
                }
              });
            }
          }}
        >
          <CoachContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}