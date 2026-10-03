import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { AudioLines, Mic, Plus, X } from 'lucide-react';
import { openVoiceChat } from '@/features/ai-coach/components/GlobalVoiceChat';
import { toast } from 'sonner';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { TINTS } from '@/components/lio';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { usePageAction } from '@/stores/usePageAction';
import { QUICK_ACTIONS, type QuickAction } from './navigationConfig';
import { cn } from '@/lib/utils';

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const sheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 400 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  }),
};

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const navigate = useNavigate();

  const startPomodoro = usePomodoroStore((s) => s.start);
  const pageAction = usePageAction((s) => s.action);
  // Sửa lỗi: trước đây điều hướng `?action=add` nhưng các trang chỉ lắng nghe `?add` → form không mở.
  const handleAction = (action: QuickAction) => {
    onOpenChange(false);
    if (action.pomodoro) { startPomodoro(); toast.success('Đã bắt đầu phiên Pomodoro'); return; }
    setTimeout(() => { if (action.path) navigate(action.path); }, 200);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl safe-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div><h3 className="text-[18px] font-extrabold">Thêm nhanh</h3><p className="text-[12px] text-muted-foreground">Chọn loại nội dung bạn muốn tạo</p></div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-muted tap-transparent active:scale-95 transition-transform"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Hành động chính của trang đang mở (vd. "Thêm thói quen") */}
            {pageAction && (
              <div className="px-5 pb-3">
                <button onClick={() => { onOpenChange(false); setTimeout(pageAction.onClick, 150); }}
                  className="w-full flex items-center gap-3 rounded-[20px] border-2 border-primary/30 bg-lavender dark:bg-primary/15 px-4 py-3 text-left active:scale-[0.98] transition-transform">
                  <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"><Plus className="h-5 w-5" strokeWidth={2.5} /></span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-bold text-foreground">{pageAction.label}</span>
                    <span className="block text-[12px] text-muted-foreground">Trên trang này</span>
                  </span>
                </button>
              </div>
            )}

            {/* Voice: nói để tạo task, thói quen, nhật ký… */}
            <div className="px-5 pb-3 flex gap-2.5">
              <button onClick={() => { onOpenChange(false); setTimeout(openVoiceChat, 150); }}
                className="flex-1 min-w-0 flex items-center gap-3 rounded-[20px] bg-gradient-to-r from-primary to-[#9B7BFF] text-primary-foreground px-4 py-3 shadow-soft active:scale-[0.98] transition-transform text-left">
                <span className="h-10 w-10 rounded-full bg-white/20 grid place-items-center shrink-0"><AudioLines className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold">Nói với AI</span>
                  <span className="block text-[12px] opacity-90 truncate">“Nhắc tôi gọi mẹ lúc 6h tối mai”</span>
                </span>
              </button>
              <button onClick={() => { onOpenChange(false); navigate('/notes?voice'); }} aria-label="Ghi chú bằng giọng nói"
                className="w-[84px] shrink-0 flex flex-col items-center justify-center gap-1 rounded-[20px] border border-border/60 bg-card shadow-soft active:scale-[0.98] transition-transform">
                <span className={cn('h-9 w-9 rounded-full grid place-items-center', TINTS.amber.bg)} style={{ color: TINTS.amber.fg }}><Mic className="h-[18px] w-[18px]" /></span>
                <span className="text-[11.5px] font-bold leading-tight text-center">Ghi chú<br />giọng nói</span>
              </button>
            </div>

            {/* Actions Grid */}
            <div className="px-5 pb-6 grid grid-cols-3 gap-2.5">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={action.id}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => handleAction(action)}
                  className="flex flex-col items-center gap-2 rounded-[20px] border border-border/60 bg-card shadow-soft py-3.5 tap-transparent active:scale-95 transition-transform"
                >
                  <span className={cn('w-12 h-12 rounded-[16px] grid place-items-center', TINTS[action.tint].bg)}>
                    <LifeIcon name={action.icon} size={26} variant="duotone" />
                  </span>
                  <span className="text-[12.5px] font-semibold">{action.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="px-5 pb-6"><button onClick={() => onOpenChange(false)} className="w-full h-11 rounded-full bg-secondary text-[13.5px] font-semibold">Hủy</button></div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
