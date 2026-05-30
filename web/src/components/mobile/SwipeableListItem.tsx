import { ReactNode, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type SwipeAction = 'complete' | 'delete' | 'postpone' | 'custom';

interface SwipeActionConfig {
  type: SwipeAction;
  icon?: ReactNode;
  color: string;
  label: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: ReactNode;
  leftAction?: SwipeActionConfig;
  rightAction?: SwipeActionConfig;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

const defaultLeftAction: SwipeActionConfig = {
  type: 'complete',
  icon: <Check className="w-5 h-5 text-white" />,
  color: 'bg-emerald-500',
  label: 'Hoàn thành',
  onAction: () => {},
};

const defaultRightAction: SwipeActionConfig = {
  type: 'delete',
  icon: <Trash2 className="w-5 h-5 text-white" />,
  color: 'bg-red-500',
  label: 'Xóa',
  onAction: () => {},
};

export function SwipeableListItem({
  children,
  leftAction,
  rightAction,
  className,
  threshold = 80,
  disabled = false,
}: SwipeableListItemProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const left = leftAction || defaultLeftAction;
  const right = rightAction || defaultRightAction;

  // Opacity based on swipe distance
  const leftOpacity = useTransform(x, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const rightOpacity = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.5, 0]);

  // Scale for action icons
  const leftScale = useTransform(x, [0, threshold], [0.5, 1]);
  const rightScale = useTransform(x, [-threshold, 0], [1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    if (info.offset.x > threshold && leftAction) {
      // Swipe right -> left action
      leftAction.onAction();
    } else if (info.offset.x < -threshold && rightAction) {
      // Swipe left -> right action
      rightAction.onAction();
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Left action background (swipe right) */}
      {leftAction && (
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center pl-5 rounded-2xl',
            left.color,
          )}
          style={{ opacity: leftOpacity, width: '50%' }}
        >
          <motion.div style={{ scale: leftScale }} className="flex items-center gap-2">
            {left.icon}
            <span className="text-white text-sm font-medium">{left.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Right action background (swipe left) */}
      {rightAction && (
        <motion.div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end pr-5 rounded-2xl',
            right.color,
          )}
          style={{ opacity: rightOpacity, width: '50%' }}
        >
          <motion.div style={{ scale: rightScale }} className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{right.label}</span>
            {right.icon}
          </motion.div>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0.2}
        dragConstraints={{ left: rightAction ? -150 : 0, right: leftAction ? 150 : 0 }}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className="relative bg-card rounded-2xl z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pre-built action configs
export const swipeActions = {
  complete: (onAction: () => void): SwipeActionConfig => ({
    type: 'complete',
    icon: <Check className="w-5 h-5 text-white" />,
    color: 'bg-emerald-500',
    label: 'Xong',
    onAction,
  }),
  delete: (onAction: () => void): SwipeActionConfig => ({
    type: 'delete',
    icon: <Trash2 className="w-5 h-5 text-white" />,
    color: 'bg-red-500',
    label: 'Xóa',
    onAction,
  }),
  postpone: (onAction: () => void): SwipeActionConfig => ({
    type: 'postpone',
    icon: <Clock className="w-5 h-5 text-white" />,
    color: 'bg-amber-500',
    label: 'Hoãn',
    onAction,
  }),
};
