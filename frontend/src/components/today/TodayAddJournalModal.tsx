import { useState } from 'react';
import { Smile, Frown, Meh } from 'lucide-react';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MoodIcon } from '@/components/icons/LifeIcon';

interface TodayAddJournalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todayStr: string;
  onAdd: (entry: {
    date: string;
    content: string;
    mood: number;
    energy: number;
    tags: string[];
  }) => void;
}

const JOURNAL_PROMPTS = [
  '🌅 Điều tôi biết ơn hôm nay...',
  '💪 Thành tựu nhỏ hôm nay...',
  '🤔 Điều tôi học được...',
  '😊 Khoảnh khắc vui vẻ...',
  '🎯 Mục tiêu cho ngày mai...',
  '💭 Suy nghĩ trong đầu...',
];

// Mood icon LifeOS (không dùng emoji hệ thống) — docs/design/ICON_SPEC.md §Mood
const MOOD_OPTIONS = [
  { value: 1, label: 'Rất buồn' },
  { value: 2, label: 'Buồn' },
  { value: 3, label: 'Bình thường' },
  { value: 4, label: 'Vui' },
  { value: 5, label: 'Rất vui' },
] as const;

export function TodayAddJournalModal({ open, onOpenChange, todayStr, onAdd }: TodayAddJournalModalProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(5);

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd({
      date: todayStr,
      content: content.trim(),
      mood,
      energy: 5,
      tags: [],
    });
    setContent('');
    setMood(5);
    onOpenChange(false);
  };

  return (
    <AdaptiveModal open={open} onOpenChange={onOpenChange} title="Ghi Journal">
        <div className="space-y-4">
          {/* Journal Prompts */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gợi ý viết</label>
            <div className="flex flex-wrap gap-1.5">
              {JOURNAL_PROMPTS.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setContent(content ? content + '\n\n' + prompt : prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tâm trạng hôm nay</label>
            <div className="flex justify-center gap-1.5 sm:gap-3">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value as 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 min-w-[60px] rounded-lg border-2 transition-all",
                    mood === m.value
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-muted"
                  )}
                >
                  <MoodIcon value={m.value} size={32} variant={mood === m.value ? 'filled' : 'duotone'} />
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ghi chú *</label>
            <Textarea
              placeholder="Hôm nay bạn thế nào? Có gì đáng nhớ không?..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleAdd} disabled={!content.trim()} className="w-full">
            📝 Lưu Journal
          </Button>
        </div>
    </AdaptiveModal>
  );
}
