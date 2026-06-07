import { Send, Sparkles, Loader2, X, Lightbulb, History, Save, Download, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAICoachState } from '@/hooks/useAICoachState';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState, useRef, useEffect } from 'react';

export function ContextAwareAICoach() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Use local input state instead of from hook to prevent focus loss
  const [localInput, setLocalInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  // Monitor focus and refocus if lost while typing
  useEffect(() => {
    if (isTypingRef.current && inputRef.current && document.activeElement !== inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current && localInput.length > 0) {
          inputRef.current.focus();
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [localInput]);

  const {
    messages,
    input: _, // Don't use hook's input
    setInput: __, // Don't use hook's setInput
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

  const HeaderActions = ({ showCloseButton, onClose }: { showCloseButton?: boolean; onClose?: () => void }) => (
    <div className="flex items-center gap-0.5">
      {/* History Button */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Lịch sử đã lưu">
            <History className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh]">
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
          <DialogContent className="max-w-md">
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

      {/* Close Button - Mobile only */}
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

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
                  className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${msg.role === 'user'
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
            value={localInput}
            onChange={(e) => {
              const newValue = e.target.value;
              isTypingRef.current = true;
              setLocalInput(newValue);
              // Always refocus immediately after state update to prevent focus loss
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    // Set cursor to end
                    const length = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(length, length);
                  }
                });
              });
            }}
            onBlur={(e) => {
              // Prevent blur when typing - only allow blur for send button
              if (e.target.value.length > 0) {
                const relatedTarget = e.relatedTarget as HTMLElement;
                const sendButton = e.currentTarget.parentElement?.querySelector('button[type="button"]');
                
                // Allow blur only if clicking on send button
                if (relatedTarget && sendButton && (relatedTarget === sendButton || sendButton.contains(relatedTarget))) {
                  return; // Allow blur for send button
                }
                
                // Prevent blur for all other cases (scroll, re-render, etc.)
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    const length = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(length, length);
                  }
                }, 10);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage(localInput);
                setLocalInput(''); // Clear after send
              }
            }}
            onPointerDown={(e) => {
              // Prevent pointer events from causing blur
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              // Prevent touch events from causing blur
              e.stopPropagation();
            }}
            onClick={(e) => {
              // Ensure input stays focused on click
              e.stopPropagation();
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            onFocus={(e) => {
              // Ensure input stays focused
              e.target.focus();
            }}
            disabled={isLoading}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="send"
          />
          <Button size="icon" onClick={() => { 
            isTypingRef.current = false;
            sendMessage(localInput); 
            setLocalInput(''); 
          }} disabled={isLoading || !localInput.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  // Desktop/Tablet: Render as header button with Sheet
  if (!isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="AI Coach">
                <Sparkles className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[450px]">
              <SheetHeader className="flex flex-row items-center justify-between gap-2">
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Coach - {moduleConfig.name}
                </SheetTitle>
                <HeaderActions />
              </SheetHeader>
              <div className="mt-4 h-[calc(100vh-8rem)] overflow-auto">
                <CoachContent />
              </div>
            </SheetContent>
          </Sheet>
        </TooltipTrigger>
        <TooltipContent>AI Coach</TooltipContent>
      </Tooltip>
    );
  }

  // Mobile: Don't render here, use FloatingActionButton
  return null;
}
