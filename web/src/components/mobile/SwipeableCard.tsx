import { useState, useRef, ReactNode } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: 'complete' | 'delete' | 'custom';
  rightAction?: 'complete' | 'delete' | 'custom';
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = 'delete',
  rightAction = 'complete',
  leftLabel = 'Xóa',
  rightLabel = 'Hoàn thành',
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;
  const BUTTON_SHOW_THRESHOLD = 30; // Show action button when swiped this much
  const MAX_SWIPE = 120;
  const START_SWIPE_THRESHOLD = 8;

  const shouldIgnoreSwipe = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return Boolean(
      el.closest('button, a, input, textarea, select, [role="button"], [data-swipe-ignore="true"]')
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    if (shouldIgnoreSwipe(e.target)) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = startX.current;
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return;

    currentX.current = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const dx = currentX.current - startX.current;
    const dy = currentY - startY.current;

    // If user is mostly scrolling vertically, don't treat as swipe
    if (!isSwiping) {
      if (Math.abs(dx) < START_SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      setIsSwiping(true);
    }

    // Once swiping, prevent vertical scroll jitter from cancelling taps
    e.preventDefault();

    const limitedDiff = Math.sign(dx) * Math.min(Math.abs(dx), MAX_SWIPE);
    setOffsetX(limitedDiff);
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    if (!isSwiping) {
      setOffsetX(0);
      return;
    }

    setIsSwiping(false);

    // Auto-execute if swiped past threshold
    if (offsetX > SWIPE_THRESHOLD && onSwipeRight) {
      setOffsetX(MAX_SWIPE * 1.5);
      setTimeout(() => {
        onSwipeRight();
        setOffsetX(0);
      }, 200);
    } else if (offsetX < -SWIPE_THRESHOLD && onSwipeLeft) {
      setOffsetX(-MAX_SWIPE * 1.5);
      setTimeout(() => {
        onSwipeLeft();
        setOffsetX(0);
      }, 200);
    } else {
      // If swiped but not enough, keep position to show button
      // Only reset if swiped very little
      if (Math.abs(offsetX) < BUTTON_SHOW_THRESHOLD) {
        setOffsetX(0);
      }
    }
  };

  const handleActionButtonClick = (action: 'left' | 'right') => {
    const handler = action === 'right' ? onSwipeRight : onSwipeLeft;
    if (handler) {
      setOffsetX(action === 'right' ? MAX_SWIPE * 1.5 : -MAX_SWIPE * 1.5);
      setTimeout(() => {
        handler();
        setOffsetX(0);
      }, 200);
    }
  };

  const getLeftIcon = () => {
    switch (leftAction) {
      case 'delete': return <Trash2 className="w-5 h-5" />;
      case 'complete': return <Check className="w-5 h-5" />;
      default: return <X className="w-5 h-5" />;
    }
  };

  const getRightIcon = () => {
    switch (rightAction) {
      case 'complete': return <Check className="w-5 h-5" />;
      case 'delete': return <Trash2 className="w-5 h-5" />;
      default: return <Check className="w-5 h-5" />;
    }
  };

  // Check if we should show action button (swiped but not enough to auto-execute)
  const showRightButton = onSwipeRight && offsetX > BUTTON_SHOW_THRESHOLD && offsetX < SWIPE_THRESHOLD;
  const showLeftButton = onSwipeLeft && offsetX < -BUTTON_SHOW_THRESHOLD && offsetX > -SWIPE_THRESHOLD;

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Left action background (shows when swiping right) */}
      {onSwipeRight && (
        <div 
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-colors",
            rightAction === 'complete' ? 'bg-success' : 'bg-destructive',
            offsetX > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-70'
          )}
          style={{ width: Math.max(0, offsetX) }}
        >
          <div className="flex items-center gap-2 text-white font-medium">
            {getRightIcon()}
            <span className={cn("text-sm", offsetX < 50 && "hidden")}>{rightLabel}</span>
          </div>
        </div>
      )}

      {/* Right action background (shows when swiping left) */}
      {onSwipeLeft && (
        <div 
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-colors",
            leftAction === 'delete' ? 'bg-destructive' : 'bg-success',
            offsetX < -SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-70'
          )}
          style={{ width: Math.max(0, -offsetX) }}
        >
          <div className="flex items-center gap-2 text-white font-medium">
            <span className={cn("text-sm", offsetX > -50 && "hidden")}>{leftLabel}</span>
            {getLeftIcon()}
          </div>
        </div>
      )}

      {/* Action button overlay (shows when swiped but not enough) */}
      {showRightButton && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleActionButtonClick('right');
          }}
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-center z-10 transition-opacity",
            rightAction === 'complete' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90',
            "text-white font-medium shadow-lg"
          )}
          style={{ width: Math.max(BUTTON_SHOW_THRESHOLD, offsetX) }}
        >
          <div className="flex items-center gap-2">
            {getRightIcon()}
            <span className="text-sm">{rightLabel}</span>
          </div>
        </button>
      )}

      {showLeftButton && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleActionButtonClick('left');
          }}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-center z-10 transition-opacity",
            leftAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90',
            "text-white font-medium shadow-lg"
          )}
          style={{ width: Math.max(BUTTON_SHOW_THRESHOLD, -offsetX) }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{leftLabel}</span>
            {getLeftIcon()}
          </div>
        </button>
      )}

      {/* Main content */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-card touch-pan-y",
          offsetX !== 0 ? "transition-transform" : "",
          !isSwiping && offsetX !== 0 && "duration-200"
        )}
        style={offsetX !== 0 ? { transform: `translateX(${offsetX}px)` } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
