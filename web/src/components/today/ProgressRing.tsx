import { cn } from '@/lib/utils';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0–100
  color?: string;
  bgColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  size = 120,
  strokeWidth = 8,
  progress,
  color = 'hsl(var(--primary))',
  bgColor = 'hsl(var(--muted) / 0.3)',
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
