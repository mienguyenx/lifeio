import { ReactNode, useRef, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: "complete" | "delete" | "custom";
  rightAction?: "complete" | "delete" | "custom";
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = "delete",
  rightAction = "complete",
  leftLabel = "Xóa",
  rightLabel = "Hoàn thành",
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const hasCapture = useRef(false);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;
  const START_SWIPE_THRESHOLD = 10;

  const shouldIgnoreSwipe = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return Boolean(
      el.closest(
        'button, a, input, textarea, select, [role="button"], [data-swipe-ignore="true"]'
      )
    );
  };

  const getLeftIcon = () => {
    switch (leftAction) {
      case "delete":
        return <Trash2 className="h-5 w-5" />;
      case "complete":
        return <Check className="h-5 w-5" />;
      default:
        return <X className="h-5 w-5" />;
    }
  };

  const getRightIcon = () => {
    switch (rightAction) {
      case "complete":
        return <Check className="h-5 w-5" />;
      case "delete":
        return <Trash2 className="h-5 w-5" />;
      default:
        return <Check className="h-5 w-5" />;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    if (e.pointerType === "mouse") return;
    if (shouldIgnoreSwipe(e.target)) return;

    activePointerId.current = e.pointerId;
    hasCapture.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setIsSwiping(false);

    // keep previous offset at 0 when starting a new gesture
    setOffsetX(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    if (activePointerId.current !== e.pointerId) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isSwiping) {
      if (Math.abs(dx) < START_SWIPE_THRESHOLD) return;

      // User is scrolling vertically -> stop tracking so taps elsewhere still work
      if (Math.abs(dy) > Math.abs(dx)) {
        activePointerId.current = null;
        setOffsetX(0);
        return;
      }

      setIsSwiping(true);

      // Capture ONLY after we确定是 swipe (tránh chặn tap)
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        hasCapture.current = true;
      } catch {
        // ignore
      }
    }

    const limited = Math.sign(dx) * Math.min(Math.abs(dx), MAX_SWIPE);
    setOffsetX(limited);
  };

  const finishSwipe = (action: "left" | "right") => {
    const go = action === "right" ? onSwipeRight : onSwipeLeft;
    if (!go) {
      setOffsetX(0);
      return;
    }

    const out = action === "right" ? MAX_SWIPE * 1.5 : -MAX_SWIPE * 1.5;
    setOffsetX(out);
    window.setTimeout(() => {
      go();
      setOffsetX(0);
    }, 200);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    if (disabled) return;
    if (activePointerId.current !== e.pointerId) return;

    activePointerId.current = null;

    if (hasCapture.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      hasCapture.current = false;
    }

    if (!isSwiping) {
      setOffsetX(0);
      return;
    }

    setIsSwiping(false);

    if (offsetX > SWIPE_THRESHOLD) {
      finishSwipe("right");
    } else if (offsetX < -SWIPE_THRESHOLD) {
      finishSwipe("left");
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Left action background (shows when swiping right) */}
      {onSwipeRight && (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-opacity",
            rightAction === "complete" ? "bg-success" : "bg-destructive",
            offsetX > SWIPE_THRESHOLD ? "opacity-100" : "opacity-70"
          )}
          style={{ width: Math.max(0, offsetX) }}
          aria-hidden
        >
          <div
            className={cn(
              "flex items-center gap-2 font-medium",
              rightAction === "complete"
                ? "text-success-foreground"
                : "text-destructive-foreground"
            )}
          >
            {getRightIcon()}
            <span className={cn("text-sm", offsetX < 50 && "hidden")}>{rightLabel}</span>
          </div>
        </div>
      )}

      {/* Right action background (shows when swiping left) */}
      {onSwipeLeft && (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-opacity",
            leftAction === "delete" ? "bg-destructive" : "bg-success",
            offsetX < -SWIPE_THRESHOLD ? "opacity-100" : "opacity-70"
          )}
          style={{ width: Math.max(0, -offsetX) }}
          aria-hidden
        >
          <div
            className={cn(
              "flex items-center gap-2 font-medium",
              leftAction === "delete"
                ? "text-destructive-foreground"
                : "text-success-foreground"
            )}
          >
            <span className={cn("text-sm", offsetX > -50 && "hidden")}>{leftLabel}</span>
            {getLeftIcon()}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "relative bg-card touch-pan-y",
          !isSwiping && offsetX !== 0 && "transition-transform duration-200"
        )}
        style={offsetX !== 0 ? { transform: `translateX(${offsetX}px)`, touchAction: "pan-y" } : { touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
      >
        {children}
      </div>
    </div>
  );
}
