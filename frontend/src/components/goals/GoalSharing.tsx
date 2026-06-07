import { useState } from 'react';
import { Share2, Copy, Download, CheckCircle2, Target, Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Goal, LIFE_AREAS } from '@/types/lifeos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GoalSharingProps {
  goal: Goal;
}

export function GoalSharing({ goal }: GoalSharingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const area = LIFE_AREAS.find(a => a.id === goal.area);
  const completedMilestones = goal.milestones.filter(m => m.completed).length;

  const generateShareText = () => {
    const lines = [
      `🎯 ${goal.title}`,
      ``,
      `📊 Tiến độ: ${goal.progress}%`,
      `✅ Milestones: ${completedMilestones}/${goal.milestones.length}`,
      goal.targetDate ? `📅 Deadline: ${format(parseISO(goal.targetDate), 'dd/MM/yyyy', { locale: vi })}` : '',
      ``,
      `Milestones đã hoàn thành:`,
      ...goal.milestones.filter(m => m.completed).map(m => `✓ ${m.title}`),
      ``,
      `Milestones còn lại:`,
      ...goal.milestones.filter(m => !m.completed).map(m => `○ ${m.title}`),
      ``,
      `#Goals #Productivity #LifeOS`
    ].filter(Boolean);
    
    return lines.join('\n');
  };

  const generateShareImage = () => {
    // Create a canvas-based share image
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText(`🎯 ${goal.title.slice(0, 30)}${goal.title.length > 30 ? '...' : ''}`, 30, 60);

    // Area badge
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.roundRect(30, 80, 120, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px system-ui';
    ctx.fillText(`${area?.icon} ${area?.name}`, 45, 100);

    // Progress circle
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(500, 180, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(500, 180, 60, -Math.PI / 2, -Math.PI / 2 + (goal.progress / 100) * Math.PI * 2);
    ctx.stroke();

    // Progress text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${goal.progress}%`, 500, 190);
    ctx.font = '14px system-ui';
    ctx.fillText('Progress', 500, 215);
    ctx.textAlign = 'left';

    // Milestones
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui';
    ctx.fillText(`Milestones: ${completedMilestones}/${goal.milestones.length}`, 30, 160);

    // Milestone list (first 4)
    goal.milestones.slice(0, 4).forEach((milestone, index) => {
      const y = 200 + index * 35;
      ctx.fillStyle = milestone.completed ? '#22c55e' : '#64748b';
      ctx.font = '14px system-ui';
      ctx.fillText(milestone.completed ? '✓' : '○', 30, y);
      ctx.fillStyle = milestone.completed ? '#94a3b8' : '#ffffff';
      ctx.fillText(milestone.title.slice(0, 35), 55, y);
    });

    if (goal.milestones.length > 4) {
      ctx.fillStyle = '#64748b';
      ctx.fillText(`+${goal.milestones.length - 4} more...`, 55, 340);
    }

    // Footer
    ctx.fillStyle = '#4f46e5';
    ctx.font = '12px system-ui';
    ctx.fillText('Created with LifeOS', 30, 380);

    return canvas.toDataURL('image/png');
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    await navigator.clipboard.writeText(text);
    toast.success('Đã copy vào clipboard');
  };

  const handleDownloadImage = () => {
    const imageData = generateShareImage();
    if (!imageData) {
      toast.error('Không thể tạo hình ảnh');
      return;
    }

    const link = document.createElement('a');
    link.download = `goal-${goal.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = imageData;
    link.click();
    toast.success('Đã tải xuống hình ảnh');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: goal.title,
          text: generateShareText(),
        });
        toast.success('Đã chia sẻ');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Không thể chia sẻ');
        }
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Chia sẻ tiến độ
          </DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="hsl(var(--secondary))" strokeWidth="5" fill="none" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="hsl(var(--primary))"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${(goal.progress / 100) * 175.9} 175.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {goal.progress}%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{goal.title}</h3>
                <Badge 
                  variant="secondary" 
                  className="mt-1"
                  style={{ backgroundColor: `hsl(var(--${area?.color}) / 0.2)`, color: `hsl(var(--${area?.color}))` }}
                >
                  {area?.icon} {area?.name}
                </Badge>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {completedMilestones}/{goal.milestones.length}
                  </span>
                  {goal.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(goal.targetDate), 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Milestones Preview */}
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="space-y-1">
                {goal.milestones.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    {m.completed ? (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                    )}
                    <span className={cn(m.completed && "line-through text-muted-foreground")}>
                      {m.title}
                    </span>
                  </div>
                ))}
                {goal.milestones.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{goal.milestones.length - 3} more</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleCopyText}>
            <Copy className="w-4 h-4 mr-2" /> Copy Text
          </Button>
          <Button variant="outline" onClick={handleDownloadImage}>
            <Download className="w-4 h-4 mr-2" /> Tải ảnh
          </Button>
        </div>
        
        <Button className="w-full" onClick={handleShareNative}>
          <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
        </Button>
      </DialogContent>
    </Dialog>
  );
}
