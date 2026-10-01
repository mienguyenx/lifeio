import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { LifeIcon } from '@/components/icons/LifeIcon';
import { TINTS } from '@/components/lio';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
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
