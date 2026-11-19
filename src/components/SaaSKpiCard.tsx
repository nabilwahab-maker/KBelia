import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAnimatedMetric } from '../hooks/useMotion';

interface SaaSKpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accentColor?: 'blue' | 'emerald' | 'amber' | 'violet';
  isLive?: boolean;
  floatIcon?: boolean;
  staggerIndex?: number;
  onClick?: () => void;
}

const COLOR_MAP = {
  blue: {
    topBar: 'bg-blue-600/80 dark:bg-blue-500/80',
    iconBg: 'bg-blue-600 dark:bg-blue-600 border-blue-500 text-white',
    hoverBorder: 'hover:border-blue-400/70 dark:hover:border-blue-400/70',
    valueText: 'text-black dark:text-white',
    ropeStroke: 'stroke-blue-600/80 dark:stroke-blue-400/85',
    ropeGlow: 'stroke-blue-500/20 dark:stroke-blue-400/20'
  },
  emerald: {
    topBar: 'bg-emerald-600/80 dark:bg-emerald-500/80',
    iconBg: 'bg-emerald-600 dark:bg-emerald-600 border-emerald-500 text-white',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500/60',
    valueText: 'text-black dark:text-white',
    ropeStroke: 'stroke-emerald-600/80 dark:stroke-emerald-400/85',
    ropeGlow: 'stroke-emerald-500/20 dark:stroke-emerald-400/20'
  },
  amber: {
    topBar: 'bg-amber-500/85 dark:bg-amber-400/85',
    iconBg: 'bg-amber-400 dark:bg-amber-400 border-amber-500 text-black',
    hoverBorder: 'hover:border-amber-400/70 dark:hover:border-amber-400/70',
    valueText: 'text-black dark:text-white',
    ropeStroke: 'stroke-amber-500/85 dark:stroke-amber-400/85',
    ropeGlow: 'stroke-amber-400/25 dark:stroke-amber-400/20'
  },
  violet: {
    topBar: 'bg-indigo-600/80 dark:bg-indigo-500/80',
    iconBg: 'bg-indigo-600 dark:bg-indigo-600 border-indigo-500 text-white',
    hoverBorder: 'hover:border-indigo-400/70 dark:hover:border-indigo-400/70',
    valueText: 'text-black dark:text-white',
    ropeStroke: 'stroke-indigo-600/80 dark:stroke-indigo-400/85',
    ropeGlow: 'stroke-indigo-500/20 dark:stroke-indigo-400/20'
  }
};

const ROPE_WAVE_PATH =
  'M 0 7 Q 25 2.5 50 7 T 100 7 T 150 7 T 200 7 T 250 7 T 300 7 T 350 7 T 400 7';

export const SaaSKpiCard: React.FC<SaaSKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trendLabel,
  trendDirection = 'up',
  accentColor = 'blue',
  isLive = false,
  floatIcon = true,
  staggerIndex = 0,
  onClick
}) => {
  const theme = COLOR_MAP[accentColor];
  const animatedValue = useAnimatedMetric(value);

  const trendBadgeClass =
    trendDirection === 'up'
      ? 'bg-emerald-100 dark:bg-emerald-900/70 text-black dark:text-white border-emerald-300 dark:border-emerald-700'
      : trendDirection === 'down'
      ? 'bg-rose-100 dark:bg-rose-900/70 text-black dark:text-white border-rose-300 dark:border-rose-700'
      : 'bg-amber-100 dark:bg-zinc-800 text-black dark:text-white border-amber-300 dark:border-zinc-600';

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      style={{ '--stagger': staggerIndex } as React.CSSProperties}
      className={`animate-dashboard-card group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 p-3.5 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between gap-2 ${theme.hoverBorder} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Subtle Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200 ${theme.topBar}`} aria-hidden="true" />

      {/* Top Header: Title, Metric Value & Icon Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isLive && <span className="kbelia-live-dot" aria-hidden="true" />}
            <span className="text-[0.875rem] font-semibold text-black/85 dark:text-white/90 block leading-snug break-words">
              {title}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-xl sm:text-[1.625rem] font-extrabold font-mono tabular-nums tracking-tight leading-tight break-words ${theme.valueText}`}>
              {animatedValue}
            </span>
            {trendLabel && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[0.75rem] font-bold font-mono tabular-nums shrink-0 ${trendBadgeClass}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{trendLabel}</span>
              </span>
            )}
          </div>
        </div>

        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${floatIcon ? 'animate-float-gentle' : ''} ${theme.iconBg}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Animated Smooth Flowing Rope Line Divider */}
      <div
        className="kbelia-rope-mask relative w-full h-3.5 overflow-hidden select-none opacity-85 group-hover:opacity-100 transition-opacity duration-200"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 400 14"
          preserveAspectRatio="none"
          className="animate-rope-flow block w-[200%] h-3.5"
        >
          <path
            d={ROPE_WAVE_PATH}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className={theme.ropeGlow}
          />
          <path
            d={ROPE_WAVE_PATH}
            fill="none"
            strokeWidth="1.65"
            strokeLinecap="round"
            className={theme.ropeStroke}
          />
        </svg>
      </div>

      {/* Full-Width Wrapping Summary Subtitle */}
      <div>
        <p className="text-[0.8125rem] text-black/80 dark:text-white/85 leading-snug break-words">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
