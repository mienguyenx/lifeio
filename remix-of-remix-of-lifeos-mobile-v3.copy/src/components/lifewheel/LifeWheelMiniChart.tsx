import { LIFE_AREAS, type LifeArea } from '@/types/lifeos';
import { cn } from '@/lib/utils';

interface LifeWheelMiniChartProps {
  scores: Record<LifeArea, number>;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { maxWidth: 'max-w-[180px]', dotRadius: 3, textClass: 'text-[7px]', strokeWidth: 1.5 },
  md: { maxWidth: 'max-w-[240px]', dotRadius: 4, textClass: 'text-[8px]', strokeWidth: 2 },
  lg: { maxWidth: 'max-w-[360px]', dotRadius: 5, textClass: 'text-[10px]', strokeWidth: 2 },
};

const CENTER_X = 150;
const CENTER_Y = 150;
const MAX_RADIUS = 120;
const TOTAL_AREAS = 10;

function getPointOnCircle(index: number, value: number) {
  const angle = (index * 2 * Math.PI) / TOTAL_AREAS - Math.PI / 2;
  const radius = (value / 10) * MAX_RADIUS;
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y + radius * Math.sin(angle),
  };
}

export function LifeWheelMiniChart({
  scores,
  size = 'md',
  showLabels = true,
  className,
}: LifeWheelMiniChartProps) {
  const config = SIZE_CONFIG[size];

  const polygonPoints = LIFE_AREAS.map((area, i) => {
    const point = getPointOnCircle(i, scores[area.id] || 5);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <div className={cn('flex justify-center', className)}>
      <svg
        width="100%"
        height="auto"
        viewBox="0 0 300 300"
        className={config.maxWidth}
      >
        {/* Background circles */}
        {[2, 4, 6, 8, 10].map((level) => (
          <circle
            key={level}
            cx={CENTER_X}
            cy={CENTER_Y}
            r={(level / 10) * MAX_RADIUS}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.3}
          />
        ))}

        {/* Axis lines */}
        {LIFE_AREAS.map((_, i) => {
          const point = getPointOnCircle(i, 10);
          return (
            <line
              key={i}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={point.x}
              y2={point.y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="hsl(var(--primary) / 0.3)"
          stroke="hsl(var(--primary))"
          strokeWidth={config.strokeWidth}
        />

        {/* Score dots */}
        {LIFE_AREAS.map((area, i) => {
          const point = getPointOnCircle(i, scores[area.id] || 5);
          return (
            <circle
              key={area.id}
              cx={point.x}
              cy={point.y}
              r={config.dotRadius}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Area labels */}
        {showLabels && LIFE_AREAS.map((area, i) => {
          const labelPoint = getPointOnCircle(i, 11.5);
          return (
            <text
              key={area.id}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn('fill-muted-foreground', config.textClass)}
            >
              {area.icon}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
