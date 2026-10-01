import { CSSProperties, Fragment } from 'react';
import { cn } from '@/lib/utils';
import ICON_DATA from './icon-data.json';

/**
 * LifeOS Icon System v1.0 (docs/design/ICON_SPEC.md)
 * DNA: Soft Rounded Duotone · grid 24 · safe area 2.5 · stroke 2 round · front-facing.
 * - outline : 1 màu, nền trong suốt (mặc định cho action, trạng thái không hoạt động)
 * - duotone : màu chính 100% + nền 25% (mặc định cho icon module trong UI)
 * - filled  : khối đặc + chi tiết knockout (trạng thái active, status badge)
 * Action icon thông thường (add, edit, filter, sort, share...) dùng lucide-react 2px — cùng DNA.
 */
type Role = 'base' | 'line' | 'inner' | 'dot' | 'innerDot' | 'over';
interface El { role: Role; d?: string; circle?: number[]; rect?: number[]; fillDot?: boolean }
interface IconDef { color: string; label: string; els: El[]; default?: IconVariant; outlineOnly?: boolean }

const ICONS = ICON_DATA as unknown as Record<string, IconDef>;
export type LifeIconName = keyof typeof ICON_DATA;
export type IconVariant = 'outline' | 'duotone' | 'filled';
export type IconState = 'default' | 'active' | 'disabled';

export const LIFE_ICON_NAMES = Object.keys(ICONS) as LifeIconName[];

/** Map module của router → icon */
export const ROUTE_ICON: Record<string, LifeIconName> = {
  '/': 'module/today', '/calendar': 'module/calendar', '/dashboard': 'module/insights',
  '/tasks': 'module/tasks', '/habits': 'module/habits', '/goals': 'module/goals', '/journey': 'module/reviews',
  '/journal': 'module/journal', '/weekly-review': 'module/reviews', '/notes': 'module/notes',
  '/life-wheel': 'module/life-areas', '/area-dashboard': 'module/life-areas', '/ai-chat': 'module/ai-coach',
  '/settings': 'module/settings', '/health': 'module/health', '/finance': 'module/finance',
  '/learning': 'module/learning', '/relationships': 'module/relationships', '/me': 'module/profile',
  '/trash': 'module/trash',
};

/** Mood 1–5 → icon */
export const MOOD_ICON: Record<1 | 2 | 3 | 4 | 5, LifeIconName> = {
  1: 'mood/very-sad', 2: 'mood/sad', 3: 'mood/neutral', 4: 'mood/happy', 5: 'mood/very-happy',
};

export const PRIORITY_ICON = { low: 'priority/low', medium: 'priority/medium', high: 'priority/high' } as const;

interface LifeIconProps {
  name: LifeIconName;
  variant?: IconVariant;
  /** 24 (UI) · 32 (UI lớn) · 48/64 (illustration) */
  size?: number;
  /** Ghi đè màu module, vd. 'currentColor' để icon theo màu chữ */
  color?: string;
  state?: IconState;
  /** Nhãn cho trình đọc màn hình; bỏ trống = icon trang trí */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

const KNOCK = 'var(--icon-knockout, #fff)';

export function LifeIcon({ name, variant, size = 24, color, state = 'default', title, className, style }: LifeIconProps) {
  const def = ICONS[name];
  if (!def) return null;
  let v: IconVariant = variant ?? def.default ?? 'duotone';
  if (state === 'active' && !variant) v = 'filled';
  if (def.outlineOnly) v = 'outline';
  const c = color ?? def.color;

  const shape = (el: El, props: Record<string, unknown>, key: string | number) => {
    if (el.circle) return <circle key={key} cx={el.circle[0]} cy={el.circle[1]} r={el.circle[2]} {...props} />;
    if (el.rect) return <rect key={key} x={el.rect[0]} y={el.rect[1]} width={el.rect[2]} height={el.rect[3]} rx={el.rect[4]} {...props} />;
    return <path key={key} d={el.d} {...props} />;
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-state={state}
      className={cn('lifeos-icon shrink-0', className)}
      style={style}
    >
      {title && <title>{title}</title>}
      {def.els.map((el, i) => {
        switch (el.role) {
          case 'base':
            return shape(el, v === 'outline' ? { stroke: c } : v === 'duotone' ? { stroke: c, fill: c, fillOpacity: 0.25 } : { stroke: c, fill: c }, i);
          case 'line':
            return shape(el, { stroke: c }, i);
          case 'inner':
            return shape(el, { stroke: v === 'filled' ? KNOCK : c }, i);
          case 'dot':
            return shape(el, { fill: c }, i);
          case 'innerDot':
            return shape(el, { fill: v === 'filled' ? KNOCK : c }, i);
          case 'over':
            if (el.fillDot) return shape(el, { fill: c, stroke: KNOCK, strokeWidth: 1.6 }, i);
            return (
              <Fragment key={i}>
                {v !== 'outline' && shape(el, { stroke: KNOCK, strokeWidth: 4.6 }, `h${i}`)}
                {shape(el, { stroke: c }, `s${i}`)}
              </Fragment>
            );
          default:
            return null;
        }
      })}
    </svg>
  );
}

export function MoodIcon({ value, ...p }: { value: 1 | 2 | 3 | 4 | 5 } & Omit<LifeIconProps, 'name'>) {
  return <LifeIcon name={MOOD_ICON[value]} {...p} />;
}

export function PriorityIcon({ priority, ...p }: { priority: keyof typeof PRIORITY_ICON } & Omit<LifeIconProps, 'name'>) {
  return <LifeIcon name={PRIORITY_ICON[priority]} {...p} />;
}
