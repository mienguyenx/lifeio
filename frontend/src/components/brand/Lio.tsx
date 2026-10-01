import { cn } from '@/lib/utils';
import lioWave from '@/assets/lio/lio-wave.webp';
import lioThink from '@/assets/lio/lio-think.webp';
import lioCelebrate from '@/assets/lio/lio-celebrate.webp';
import lioMeditate from '@/assets/lio/lio-meditate.webp';

export type LioPose = 'wave' | 'think' | 'celebrate' | 'meditate';

const POSES: Record<LioPose, { src: string; alt: string }> = {
  wave: { src: lioWave, alt: 'Lio đang vẫy tay chào' },
  think: { src: lioThink, alt: 'Lio đang suy nghĩ' },
  celebrate: { src: lioCelebrate, alt: 'Lio đang ăn mừng' },
  meditate: { src: lioMeditate, alt: 'Lio đang thiền' },
};

interface LioProps {
  pose?: LioPose;
  size?: number;
  /** Nhẹ nhàng nhún lên xuống (tắt khi người dùng bật giảm chuyển động) */
  float?: boolean;
  /** Ẩn khỏi trình đọc màn hình khi chỉ để trang trí */
  decorative?: boolean;
  className?: string;
}

/** Lio — mascot 3D của LifeOS */
export function Lio({ pose = 'wave', size = 96, float = false, decorative = true, className }: LioProps) {
  const p = POSES[pose];
  return (
    <img
      src={p.src}
      alt={decorative ? '' : p.alt}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      className={cn('select-none object-contain drop-shadow-[0_12px_18px_rgba(40,20,120,0.28)]', float && 'motion-safe:animate-lio-float', className)}
      style={{ width: size, height: size }}
    />
  );
}
