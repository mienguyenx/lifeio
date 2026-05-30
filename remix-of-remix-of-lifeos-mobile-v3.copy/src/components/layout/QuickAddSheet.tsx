import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListTodo, Target, BookOpen, StickyNote, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickActions = [
  { id: 'task', icon: ListTodo, label: 'Task', color: 'bg-blue-500', path: '/tasks', param: 'add' },
  { id: 'habit', icon: Target, label: 'Habit', color: 'bg-emerald-500', path: '/habits', param: 'add' },
  { id: 'journal', icon: BookOpen, label: 'Journal', color: 'bg-amber-500', path: '/journal', param: 'add' },
  { id: 'note', icon: StickyNote, label: 'Note', color: 'bg-purple-500', path: '/notes', param: 'add' },
  { id: 'pomodoro', icon: Timer, label: 'Focus', color: 'bg-rose-500', path: '/', param: 'pomodoro' },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const sheetVariants = {
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

const itemVariants = {
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

  const handleAction = (action: typeof quickActions[0]) => {
    onOpenChange(false);
    setTimeout(() => {
      navigate(`${action.path}?action=${action.param}`);
    }, 200);
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
              <h3 className="text-lg font-semibold">Thêm nhanh</h3>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-muted tap-transparent active:scale-95 transition-transform"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="px-5 pb-8 grid grid-cols-5 gap-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleAction(action)}
                    className="flex flex-col items-center gap-2 tap-transparent active:scale-90 transition-transform"
                  >
                    <div className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                      action.color,
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
