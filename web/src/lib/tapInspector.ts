export type TapInspectorElement = {
  tagName: string;
  id?: string;
  className?: string;
  zIndex?: string | null;
  pointerEvents?: string | null;
};

export type TapInspectorPayload = {
  x: number;
  y: number;
  ts: number;
  elementAtPoint: TapInspectorElement | null;
  elementsFromPoint: TapInspectorElement[];
  eventPath: TapInspectorElement[];
};

function safeStyle(el: Element | null) {
  if (!el || typeof window === "undefined") return { zIndex: null as string | null, pointerEvents: null as string | null };
  try {
    const s = window.getComputedStyle(el);
    return { zIndex: s.zIndex, pointerEvents: s.pointerEvents };
  } catch {
    return { zIndex: null as string | null, pointerEvents: null as string | null };
  }
}

export function describeElement(el: Element | null): TapInspectorElement | null {
  if (!el) return null;
  const { zIndex, pointerEvents } = safeStyle(el);
  return {
    tagName: el.tagName,
    id: (el as HTMLElement).id || undefined,
    className: (el as HTMLElement).className || undefined,
    zIndex,
    pointerEvents,
  };
}

export function captureTapInspectorPayload(args: {
  x: number;
  y: number;
  event?: Event;
  maxList?: number;
}): TapInspectorPayload {
  const { x, y, event, maxList = 8 } = args;

  if (typeof document === "undefined") {
    return {
      x,
      y,
      ts: Date.now(),
      elementAtPoint: null,
      elementsFromPoint: [],
      eventPath: [],
    };
  }

  const elementAtPoint = document.elementFromPoint(x, y);

  const elementsFromPoint = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : [elementAtPoint])
    .filter((v): v is Element => Boolean(v))
    .slice(0, maxList)
    .map((el) => describeElement(el)!)
    .filter(Boolean);

  const path = (event as any)?.composedPath?.() as unknown[] | undefined;
  const eventPath = (path || [])
    .filter((n): n is Element => n instanceof Element)
    .slice(0, maxList)
    .map((el) => describeElement(el)!)
    .filter(Boolean);

  return {
    x,
    y,
    ts: Date.now(),
    elementAtPoint: describeElement(elementAtPoint),
    elementsFromPoint,
    eventPath,
  };
}
