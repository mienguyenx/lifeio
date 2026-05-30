import { useState } from 'react';
import { HelpCircle, Lightbulb, Target, Heart, Users, Sparkles, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PURPOSE_QUESTIONS = [
  'Điều gì khiến bạn thức dậy mỗi sáng với năng lượng tràn đầy?',
  'Nếu tiền bạc không phải vấn đề, bạn sẽ làm gì mỗi ngày?',
  'Bạn muốn được nhớ đến vì điều gì?',
  'Khi nào bạn cảm thấy hạnh phúc và trọn vẹn nhất?',
  'Điều gì là không thể thương lượng trong cuộc sống của bạn?',
];

const PURPOSE_TEMPLATES = [
  'Mục đích của tôi là [động từ] [đối tượng] bằng cách [phương pháp] để [kết quả mong muốn].',
  'Tôi sống để truyền cảm hứng và giúp đỡ [đối tượng] đạt được [mục tiêu].',
  'Sứ mệnh của tôi là tạo ra [giá trị] cho [ai đó] thông qua [hoạt động].',
  'Tôi tồn tại để [hành động] và mang lại [tác động] cho [cộng đồng].',
];

const PURPOSE_EXAMPLES = [
  'Mục đích của tôi là truyền cảm hứng cho người khác sống hết mình và theo đuổi đam mê của họ.',
  'Tôi sống để tạo ra những sản phẩm giúp cuộc sống con người trở nên đơn giản và ý nghĩa hơn.',
  'Sứ mệnh của tôi là trở thành người cha/mẹ tốt nhất có thể và nuôi dạy con cái với tình yêu thương.',
  'Tôi tồn tại để học hỏi không ngừng và chia sẻ kiến thức giúp người khác phát triển.',
];

const VISION_QUESTIONS = [
  'Sau 5 năm nữa, cuộc sống lý tưởng của bạn trông như thế nào?',
  'Bạn muốn đạt được điều gì trong sự nghiệp?',
  'Mối quan hệ lý tưởng của bạn với gia đình và bạn bè?',
  'Bạn muốn sức khỏe và thể chất của mình ở mức nào?',
  'Bạn muốn đóng góp gì cho cộng đồng và xã hội?',
];

const VISION_TEMPLATES = [
  { timeframe: '1-year', template: 'Trong 1 năm tới, tôi sẽ [thành tựu cụ thể] trong lĩnh vực [lĩnh vực].' },
  { timeframe: '5-year', template: 'Trong 5 năm tới, tôi hình dung bản thân [mô tả cuộc sống/sự nghiệp lý tưởng].' },
  { timeframe: '10-year', template: 'Trong 10 năm tới, tôi sẽ trở thành [vai trò/vị trí] và đạt được [thành tựu lớn].' },
  { timeframe: 'lifetime', template: 'Di sản tôi để lại cho thế giới là [tác động/đóng góp].' },
];

const VALUES_LIST = [
  { name: 'Chính trực', description: 'Sống đúng với giá trị và nguyên tắc của mình', icon: '⚖️' },
  { name: 'Gia đình', description: 'Ưu tiên thời gian và tình yêu cho người thân', icon: '👨‍👩‍👧‍👦' },
  { name: 'Tự do', description: 'Sống cuộc sống theo cách riêng của mình', icon: '🦅' },
  { name: 'Sáng tạo', description: 'Luôn tìm kiếm những ý tưởng và giải pháp mới', icon: '💡' },
  { name: 'Học hỏi', description: 'Không ngừng phát triển và mở rộng kiến thức', icon: '📚' },
  { name: 'Sức khỏe', description: 'Chăm sóc thể chất và tinh thần', icon: '💪' },
  { name: 'Đóng góp', description: 'Tạo ra giá trị và giúp đỡ người khác', icon: '🤝' },
  { name: 'Thành công', description: 'Đạt được mục tiêu và thành tựu', icon: '🏆' },
  { name: 'Cân bằng', description: 'Hài hòa giữa công việc và cuộc sống', icon: '⚡' },
  { name: 'Kết nối', description: 'Xây dựng mối quan hệ sâu sắc với người khác', icon: '❤️' },
  { name: 'Dũng cảm', description: 'Dám đối mặt với thách thức và rủi ro', icon: '🦁' },
  { name: 'Kiên nhẫn', description: 'Bền bỉ theo đuổi mục tiêu dài hạn', icon: '🐢' },
];

const ROLES_EXAMPLES = [
  { name: 'Người cha/mẹ yêu thương', description: 'Nuôi dạy con cái với tình yêu và sự hướng dẫn', icon: '👨‍👧‍👦' },
  { name: 'Chuyên gia trong lĩnh vực', description: 'Liên tục phát triển kỹ năng và kiến thức chuyên môn', icon: '💼' },
  { name: 'Người bạn đáng tin cậy', description: 'Luôn có mặt và hỗ trợ bạn bè khi cần', icon: '🤝' },
  { name: 'Người học suốt đời', description: 'Không ngừng học hỏi và phát triển bản thân', icon: '📖' },
  { name: 'Người đóng góp cộng đồng', description: 'Tích cực tham gia hoạt động xã hội', icon: '🌍' },
  { name: 'Người lãnh đạo truyền cảm hứng', description: 'Dẫn dắt và hỗ trợ người khác phát triển', icon: '⭐' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

export function VisionValuesGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" /> Hướng dẫn
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Hướng dẫn Vision & Values
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="purpose" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="purpose" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" /> Mục đích
            </TabsTrigger>
            <TabsTrigger value="vision" className="text-xs">
              <Target className="w-3 h-3 mr-1" /> Tầm nhìn
            </TabsTrigger>
            <TabsTrigger value="values" className="text-xs">
              <Heart className="w-3 h-3 mr-1" /> Giá trị
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">
              <Users className="w-3 h-3 mr-1" /> Vai trò
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[55vh] mt-4 pr-4">
            {/* Purpose Tab */}
            <TabsContent value="purpose" className="space-y-6 mt-0">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Câu hỏi gợi mở
                </h3>
                <div className="space-y-2">
                  {PURPOSE_QUESTIONS.map((q, i) => (
                    <Card key={i} className="bg-secondary/30">
                      <CardContent className="p-3 flex items-start gap-2">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Template mẫu
                </h3>
                <div className="space-y-2">
                  {PURPOSE_TEMPLATES.map((t, i) => (
                    <Card key={i} className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3 flex items-center justify-between">
                        <p className="text-sm italic">{t}</p>
                        <CopyButton text={t} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Ví dụ tham khảo
                </h3>
                <div className="space-y-2">
                  {PURPOSE_EXAMPLES.map((e, i) => (
                    <Card key={i}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <p className="text-sm">"{e}"</p>
                        <CopyButton text={e} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Vision Tab */}
            <TabsContent value="vision" className="space-y-6 mt-0">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Câu hỏi định hướng
                </h3>
                <div className="space-y-2">
                  {VISION_QUESTIONS.map((q, i) => (
                    <Card key={i} className="bg-secondary/30">
                      <CardContent className="p-3 flex items-start gap-2">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Template theo khung thời gian
                </h3>
                <div className="space-y-2">
                  {VISION_TEMPLATES.map((t, i) => (
                    <Card key={i} className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {t.timeframe === '1-year' && '1 năm'}
                            {t.timeframe === '5-year' && '5 năm'}
                            {t.timeframe === '10-year' && '10 năm'}
                            {t.timeframe === 'lifetime' && 'Cả đời'}
                          </Badge>
                          <CopyButton text={t.template} />
                        </div>
                        <p className="text-sm italic">{t.template}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Values Tab */}
            <TabsContent value="values" className="space-y-6 mt-0">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Danh sách giá trị phổ biến
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Chọn 5-7 giá trị quan trọng nhất với bạn và sắp xếp theo thứ tự ưu tiên.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {VALUES_LIST.map((v, i) => (
                    <Card key={i} className="hover:bg-secondary/50 transition-colors cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{v.icon}</span>
                          <span className="font-medium text-sm">{v.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{v.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="bg-accent/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">💡 Mẹo xác định giá trị cốt lõi</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Nghĩ về những lúc bạn cảm thấy hạnh phúc và trọn vẹn nhất</li>
                  <li>• Điều gì khiến bạn tức giận khi bị vi phạm?</li>
                  <li>• Bạn sẵn sàng hy sinh điều gì cho điều gì?</li>
                  <li>• Hỏi người thân: họ thấy bạn đề cao điều gì nhất?</li>
                </ul>
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-6 mt-0">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" /> Ví dụ vai trò trong cuộc sống
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Xác định các vai trò quan trọng bạn đang đảm nhận và muốn phát triển.
                </p>
                <div className="space-y-2">
                  {ROLES_EXAMPLES.map((r, i) => (
                    <Card key={i}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className="text-2xl">{r.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="bg-accent/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">💡 Cách xác định vai trò</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Liệt kê tất cả các mối quan hệ quan trọng của bạn</li>
                  <li>• Xác định vai trò nghề nghiệp và sự nghiệp</li>
                  <li>• Nghĩ về vai trò trong cộng đồng và xã hội</li>
                  <li>• Đừng quên vai trò với chính bản thân mình</li>
                </ul>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
