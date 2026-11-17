import React, { useId } from 'react';

export interface AnimatedShimmerBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  opacity?: number;
  index?: number;
  radius?: number | [number, number, number, number];
  className?: string;
  reducedMotion?: boolean;
}

function buildRoundedTopBarPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  if (w <= 0 || h <= 0) return '';
  const radius = Math.max(0, Math.min(r, w / 2, h));
  if (radius === 0) {
    return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  }
  return [
    `M ${x} ${y + h}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `H ${x + w - radius}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `V ${y + h}`,
    'Z'
  ].join(' ');
}

export const AnimatedShimmerBar: React.FC<AnimatedShimmerBarProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = '#2563EB',
  opacity = 1,
  index = 0,
  radius = 6,
  className,
  reducedMotion = false
}) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `kbelia-bar-shimmer-${uid}-${index}`;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const topRadius = Array.isArray(radius) ? radius[0] : radius;
  const barPath = buildRoundedTopBarPath(x, y, width, height, topRadius);
  const delaySec = (((index || 0) % 8) * 0.22).toFixed(2);
  const showShimmer = !reducedMotion && height > 6;

  return (
    <g className={className}>
      {showShimmer && (
        <defs>
          <linearGradient
            id={gradId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
            gradientUnits="objectBoundingBox"
            gradientTransform="translate(0 1)"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="28%" stopColor="#FFFFFF" stopOpacity={0.08} />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.34} />
            <stop offset="72%" stopColor="#FFFFFF" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 1"
              to="0 -1"
              dur="2.8s"
              begin={`${delaySec}s`}
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      )}

      <path
        d={barPath}
        fill={fill}
        fillOpacity={opacity}
        className="transition-opacity duration-200 hover:opacity-90"
      />

      {showShimmer && (
        <path
          d={barPath}
          fill={`url(#${gradId})`}
          fillOpacity={opacity}
          pointerEvents="none"
        />
      )}
    </g>
  );
};
