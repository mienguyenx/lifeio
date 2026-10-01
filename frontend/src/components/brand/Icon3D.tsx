import { cn } from '@/lib/utils';
import tasks from '@/assets/icons3d/tasks.webp';
import goal from '@/assets/icons3d/goal.webp';
import flame from '@/assets/icons3d/flame.webp';
import journal from '@/assets/icons3d/journal.webp';
import pomodoro from '@/assets/icons3d/pomodoro.webp';
import health from '@/assets/icons3d/health.webp';

const ICONS = { tasks, goal, flame, journal, pomodoro, health } as const;
export type Icon3DName = keyof typeof ICONS;

interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  className?: string;
}

/** Icon 3D trang trí — luôn đi kèm nhãn chữ bên cạnh nên ẩn khỏi trình đọc màn hình */
export function Icon3D({ name, size = 28, className }: Icon3DProps) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      className={cn('select-none object-contain drop-shadow-[0_4px_6px_rgba(16,24,40,0.18)]', className)}
      style={{ width: size, height: size }}
    />
  );
}
