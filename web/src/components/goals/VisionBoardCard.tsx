import { useState } from 'react';
import { Plus, Quote, Image, Trash2, Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { Goal, VisionItem } from '@/types/lifeos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VisionBoardCardProps {
  goal: Goal;
}

const INSPIRATIONAL_QUOTES = [
  { content: "Hành trình vạn dặm bắt đầu từ một bước chân.", author: "Lão Tử" },
  { content: "Thành công không phải đích đến, mà là cả hành trình.", author: "Zig Ziglar" },
  { content: "Điều duy nhất không thể là điều bạn không dám thử.", author: "Anonymous" },
  { content: "Mỗi ngày là một cơ hội mới để thay đổi cuộc sống.", author: "Anonymous" },
  { content: "Đừng đợi cơ hội, hãy tạo ra nó.", author: "George Bernard Shaw" },
  { content: "Giới hạn duy nhất của bạn chính là tâm trí bạn.", author: "Anonymous" },
  { content: "Tin vào bản thân và bạn đã đi được nửa đường.", author: "Theodore Roosevelt" },
  { content: "Thất bại là mẹ thành công.", author: "Tục ngữ" },
];

export function VisionBoardCard({ goal }: VisionBoardCardProps) {
  const updateGoal = useLifeOSStore(s => s.updateGoal);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ type: 'quote' as 'quote' | 'image', content: '', author: '' });
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);

  const visionBoard = goal.visionBoard || [];

  const handleAddItem = () => {
    if (!newItem.content.trim()) {
      toast.error('Vui lòng nhập nội dung');
      return;
    }

    const item: VisionItem = {
      id: crypto.randomUUID(),
      type: newItem.type,
      content: newItem.content,
      author: newItem.type === 'quote' ? newItem.author : undefined,
      createdAt: new Date().toISOString(),
    };

    updateGoal(goal.id, {
      visionBoard: [...visionBoard, item]
    });

    setNewItem({ type: 'quote', content: '', author: '' });
    setIsDialogOpen(false);
    toast.success('Đã thêm vào Vision Board');
  };

  const handleAddPresetQuote = (quote: typeof INSPIRATIONAL_QUOTES[0]) => {
    const item: VisionItem = {
      id: crypto.randomUUID(),
      type: 'quote',
      content: quote.content,
      author: quote.author,
      createdAt: new Date().toISOString(),
    };

    updateGoal(goal.id, {
      visionBoard: [...visionBoard, item]
    });

    setSelectedQuote(null);
    setIsDialogOpen(false);
    toast.success('Đã thêm quote');
  };

  const handleRemoveItem = (itemId: string) => {
    updateGoal(goal.id, {
      visionBoard: visionBoard.filter(item => item.id !== itemId)
    });
    toast.success('Đã xóa');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warning" />
            Vision Board
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm vào Vision Board</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="quote" onValueChange={(v) => setNewItem({ ...newItem, type: v as 'quote' | 'image' })}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="quote">
                    <Quote className="w-4 h-4 mr-2" /> Quote
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <Image className="w-4 h-4 mr-2" /> Hình ảnh
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="quote" className="space-y-4 mt-4">
                  {/* Preset quotes */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Quotes gợi ý</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {INSPIRATIONAL_QUOTES.map((quote, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedQuote(idx);
                            setNewItem({ ...newItem, content: quote.content, author: quote.author });
                          }}
                          className={cn(
                            "p-2 rounded-lg border cursor-pointer transition-all text-xs",
                            selectedQuote === idx 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <p className="italic">"{quote.content}"</p>
                          <p className="text-muted-foreground mt-1">— {quote.author}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label>Hoặc tự nhập quote</Label>
                    <Textarea
                      placeholder="Nhập câu quote truyền cảm hứng..."
                      value={newItem.content}
                      onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Tác giả (tùy chọn)</Label>
                    <Input
                      placeholder="VD: Steve Jobs"
                      value={newItem.author}
                      onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="image" className="space-y-4 mt-4">
                  <div>
                    <Label>URL hình ảnh</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={newItem.content}
                      onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dán link hình ảnh truyền cảm hứng (Unsplash, Pinterest, etc.)
                    </p>
                  </div>
                  {newItem.type === 'image' && newItem.content && (
                    <div className="rounded-lg overflow-hidden border">
                      <img 
                        src={newItem.content} 
                        alt="Preview" 
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Invalid+URL';
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <Button onClick={handleAddItem} className="w-full mt-4">
                Thêm vào Vision Board
              </Button>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visionBoard.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có nội dung truyền cảm hứng</p>
            <p className="text-xs mt-1">Thêm quotes hoặc hình ảnh để giữ động lực!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visionBoard.map(item => (
              <div 
                key={item.id} 
                className={cn(
                  "relative group rounded-lg overflow-hidden",
                  item.type === 'quote' ? "bg-gradient-to-br from-primary/10 to-primary/5 p-4" : ""
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
                
                {item.type === 'quote' ? (
                  <div>
                    <Quote className="w-4 h-4 text-primary/50 mb-2" />
                    <p className="text-sm italic leading-relaxed">"{item.content}"</p>
                    {item.author && (
                      <p className="text-xs text-muted-foreground mt-2">— {item.author}</p>
                    )}
                  </div>
                ) : (
                  <img 
                    src={item.content} 
                    alt="Vision" 
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Image+Error';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
