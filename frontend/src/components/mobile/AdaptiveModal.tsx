import { ReactNode, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

interface AdaptiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Theo dõi bàn phím ảo (iOS/Android) qua visualViewport: trả về chiều cao bàn phím đang che
 * và chiều cao vùng nhìn thấy, để bottom sheet nằm ngay trên bàn phím và tự co lại + cuộn được.
 */
function useKeyboardViewport(active: boolean) {
  const [state, setState] = useState({ inset: 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 });
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!active || !vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setState({ inset: inset > 80 ? inset : 0, height: vv.height });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [active]);
  return state;
}

// Lớp chỉ dành cho Dialog desktop (chiều cao/cuộn) — bỏ đi trên sheet mobile vì sheet tự quản lý
const stripSizing = (cls?: string) => cls?.split(/\s+/).filter((c) => !/^(max-h-|h-|overflow-)/.test(c)).join(' ');

/**
 * Renders a bottom sheet (Drawer) on mobile and a centered Dialog on desktop.
 * Use this for all forms, confirmations, and detail views.
 */
export function AdaptiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: AdaptiveModalProps) {
  const isMobile = useIsMobile();
  const { inset, height } = useKeyboardViewport(isMobile && open);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Khi bàn phím mở/đổi kích thước: đưa ô đang nhập vào giữa vùng nhìn thấy
  useEffect(() => {
    if (!isMobile || !open || !inset) return;
    const el = document.activeElement as HTMLElement | null;
    if (el && bodyRef.current?.contains(el)) {
      const t = setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
  }, [isMobile, open, inset, height]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
        <DrawerContent
          className={cn('rounded-t-[28px] flex flex-col', stripSizing(className))}
          style={{
            bottom: inset,
            maxHeight: inset ? `${Math.max(240, height - 12)}px` : 'calc(100dvh - 24px)',
            transition: 'bottom 160ms ease-out, max-height 160ms ease-out',
          }}
        >
          <DrawerHeader className="text-left px-5 pt-3 pb-2 shrink-0">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div
            ref={bodyRef}
            onFocusCapture={(e) => {
              const el = e.target as HTMLElement;
              if (el.matches('input, textarea, select, [contenteditable="true"]')) {
                setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
              }
            }}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
