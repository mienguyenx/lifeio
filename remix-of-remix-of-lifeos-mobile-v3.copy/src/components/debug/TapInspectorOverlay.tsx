import { useCallback } from "react";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TapInspectorPayload } from "@/lib/tapInspector";

type Props = {
  payload: TapInspectorPayload | null;
  onClear: () => void;
  className?: string;
};

export function TapInspectorOverlay({ payload, onClear, className }: Props) {
  const handleCopy = useCallback(async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Đã copy debug payload");
    } catch {
      toast.error("Không copy được (clipboard bị chặn)");
    }
  }, [payload]);

  if (!payload) return null;

  return (
    <aside
      className={cn(
        "fixed inset-x-3 bottom-20 z-50",
        "pointer-events-none",
        className
      )}
      aria-label="Tap inspector overlay"
    >
      <Card className={cn("pointer-events-auto shadow-lg")}> 
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Tap Inspector (Pomodoro)</p>
              <p className="text-[11px] text-muted-foreground truncate">
                x: {Math.round(payload.x)}, y: {Math.round(payload.y)} • {new Date(payload.ts).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                aria-label="Copy debug payload"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClear}
                aria-label="Đóng overlay"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <div>
              <p className="text-[11px] font-medium">elementFromPoint</p>
              <pre className="mt-1 max-h-20 overflow-auto rounded-md bg-muted p-2 text-[10px] leading-snug">
{JSON.stringify(payload.elementAtPoint, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-[11px] font-medium">elementsFromPoint (top → bottom)</p>
              <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted p-2 text-[10px] leading-snug">
{JSON.stringify(payload.elementsFromPoint, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
