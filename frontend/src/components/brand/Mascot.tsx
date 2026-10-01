import { cn } from '@/lib/utils';
import lumi from '@/assets/mascots/lumi.webp';
import lumiHappy from '@/assets/mascots/lumi-love.webp';
import mochi from '@/assets/mascots/mochi.webp';
import mochiFocus from '@/assets/mascots/mochi-focus.webp';
import mochiRest from '@/assets/mascots/mochi-rest.webp';
import mochiCelebrate from '@/assets/mascots/mochi-celebrate.webp';
import taro from '@/assets/mascots/taro.webp';
import taroRelax from '@/assets/mascots/taro-relax.webp';
import taroCare from '@/assets/mascots/taro-care.webp';
import taroGo from '@/assets/mascots/taro-go.webp';
import ori from '@/assets/mascots/ori.webp';
import oriLearn from '@/assets/mascots/ori-learn.webp';
import oriIdea from '@/assets/mascots/ori-idea.webp';
import oriExplore from '@/assets/mascots/ori-explore.webp';

/**
 * LifeOS Mascot System (docs/design/VISUAL_SPEC.md §2, §14)
 * - Lumi (thỏ)  : Home, Onboarding, Success, khích lệ
 * - Mochi (mèo) : Tasks, Focus, Pomodoro, Quick Add
 * - Taro (rùa)  : Habits, Health, Rest
 * - Ori (cú)    : AI Coach, Insights, Journal, Review
 * Quy tắc: tối đa 1 mascot / màn hình; mascot là companion, không thay icon chức năng.
 */
const MASCOTS = {
  lumi: { label: 'Lumi', poses: { default: lumi, happy: lumiHappy } },
  mochi: { label: 'Mochi', poses: { default: mochi, focus: mochiFocus, rest: mochiRest, celebrate: mochiCelebrate } },
  taro: { label: 'Taro', poses: { default: taro, relax: taroRelax, care: taroCare, go: taroGo } },
  ori: { label: 'Ori', poses: { default: ori, learn: oriLearn, idea: oriIdea, explore: oriExplore } },
} as const;

export type MascotName = keyof typeof MASCOTS;

/** Mascot mặc định theo module */
export const MODULE_MASCOT = {
  home: 'lumi', onboarding: 'lumi', goals: 'lumi',
  tasks: 'mochi', focus: 'mochi', calendar: 'mochi',
  habits: 'taro', health: 'taro',
  ai: 'ori', insights: 'ori', journal: 'ori', review: 'ori', learning: 'ori',
} as const satisfies Record<string, MascotName>;

interface MascotProps {
  name: MascotName;
  /** lumi: default|happy · mochi: default|focus|rest|celebrate · taro: default|relax|care|go · ori: default|learn|idea|explore */
  pose?: string;
  size?: number;
  float?: boolean;
  /** true (mặc định): chỉ trang trí, ẩn với trình đọc màn hình */
  decorative?: boolean;
  className?: string;
}

export function Mascot({ name, pose = 'default', size = 96, float = false, decorative = true, className }: MascotProps) {
  const m = MASCOTS[name];
  const poses = m.poses as Record<string, string>;
  const src = poses[pose] ?? poses.default;
  return (
    <img
      src={src}
      alt={decorative ? '' : m.label}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      className={cn('select-none object-contain drop-shadow-[0_10px_16px_rgba(91,77,185,0.16)]', float && 'motion-safe:animate-mascot-float', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Ảnh mascot thô (dùng khi cần src, vd. avatar AI Coach) */
export const mascotSrc = { lumi, mochi, taro, ori, oriIdea, mochiFocus };
