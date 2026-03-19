import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';

const REFLECTION_PROMPTS = {
  wins: [
    'Điều gì khiến bạn tự hào nhất tuần này?',
    'Bạn đã vượt qua thử thách nào trong tuần?',
    'Thói quen nào bạn đã duy trì tốt?',
    'Bạn đã học được kỹ năng mới nào?',
    'Ai đã giúp đỡ bạn tuần này và bạn cảm thấy thế nào?',
  ],
  challenges: [
    'Điều gì khó khăn nhất bạn gặp phải?',
    'Có khoảnh khắc nào bạn muốn làm khác đi không?',
    'Bạn đã procrastinate việc gì và tại sao?',
    'Thói quen nào bạn struggle để duy trì?',
    'Điều gì khiến bạn stress nhất tuần này?',
  ],
  lessons: [
    'Nếu có thể quay lại, bạn sẽ làm gì khác?',
    'Bạn đã học được gì về bản thân tuần này?',
    'Insight nào bạn muốn nhớ mãi?',
    'Kinh nghiệm này dạy bạn điều gì cho tương lai?',
    'Bạn đã thay đổi suy nghĩ về điều gì?',
  ],
  focus: [
    'Điều quan trọng nhất cần hoàn thành tuần tới là gì?',
    'Bạn muốn cải thiện thói quen nào tuần tới?',
    'Mục tiêu nào bạn muốn tiến gần hơn?',
    'Bạn sẽ làm gì để có năng lượng tốt hơn?',
    'Ai bạn muốn dành thời gian cùng tuần tới?',
  ],
};

interface ReflectionPromptsProps {
  onSelectPrompt: (category: string, prompt: string) => void;
}

export function ReflectionPrompts({ onSelectPrompt }: ReflectionPromptsProps) {
  const [currentPrompts, setCurrentPrompts] = useState<Record<string, number>>({
    wins: 0,
    challenges: 0,
    lessons: 0,
    focus: 0,
  });

  const prompts = useMemo(() => ({
    wins: REFLECTION_PROMPTS.wins[currentPrompts.wins],
    challenges: REFLECTION_PROMPTS.challenges[currentPrompts.challenges],
    lessons: REFLECTION_PROMPTS.lessons[currentPrompts.lessons],
    focus: REFLECTION_PROMPTS.focus[currentPrompts.focus],
  }), [currentPrompts]);

  const shufflePrompt = (category: keyof typeof REFLECTION_PROMPTS) => {
    setCurrentPrompts((prev) => ({
      ...prev,
      [category]: (prev[category] + 1) % REFLECTION_PROMPTS[category].length,
    }));
  };

  const categories = [
    { key: 'wins', label: '🏆 Chiến thắng', color: 'bg-warning/10 border-warning/20' },
    { key: 'challenges', label: '⚡ Thách thức', color: 'bg-destructive/10 border-destructive/20' },
    { key: 'lessons', label: '💡 Bài học', color: 'bg-info/10 border-info/20' },
    { key: 'focus', label: '🎯 Focus tuần tới', color: 'bg-primary/10 border-primary/20' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-warning" />
          Gợi ý suy ngẫm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map(({ key, label, color }) => (
          <div
            key={key}
            className={`p-3 rounded-lg border ${color} cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => onSelectPrompt(key, prompts[key as keyof typeof prompts])}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  shufflePrompt(key as keyof typeof REFLECTION_PROMPTS);
                }}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "{prompts[key as keyof typeof prompts]}"
            </p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Nhấn vào câu hỏi để thêm vào review
        </p>
      </CardContent>
    </Card>
  );
}
