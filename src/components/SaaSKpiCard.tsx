import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SaaSKpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trendLabel: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accentColor?: 'blue' | 'emerald' | 'amber' | 'violet';
  isLive?: boolean;
  floatIcon?: boolean;
  onClick?: () => void;
}

const COLOR_MAP = {
  blue: {
    iconBg: 'bg-blue-600 dark:bg-blue-600 border-blue-500 text-white',
    hoverBorder: 'hover:border-blue-400/70 dark:hover:border-blue-400/70',
    valueText: 'text-black dark:text-white'
  },
  emerald: {
    iconBg: 'bg-emerald-600 dark:bg-emerald-600 border-emerald-500 text-white',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500/60',
    valueText: 'text-black dark:text-white'
  },
  amber: {
    iconBg: 'bg-amber-400 dark:bg-amber-400 border-amber-500 text-black',
    hoverBorder: 'hover:border-amber-400/70 dark:hover:border-amber-400/70',
    valueText: 'text-black dark:text-white'
  },
  violet: {
    iconBg: 'bg-indigo-600 dark:bg-indigo-600 border-indigo-500 text-white',
    hoverBorder: 'hover:border-indigo-400/70 dark:hover:border-indigo-400/70',
    valueText: 'text-black dark:text-white'
  }
};

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
  onClick
}) => {
  const theme = COLOR_MAP[accentColor];

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
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between gap-3 ${theme.hoverBorder} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Header: Title, Metric Value & Icon Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isLive && <span className="kbelia-live-dot" aria-hidden="true" />}
            <span className="text-[0.9375rem] font-semibold text-black/85 dark:text-white/90 block leading-snug break-words">
              {title}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
            <span className={`text-2xl sm:text-[1.875rem] font-extrabold font-mono tabular-nums tracking-tight leading-tight break-words ${theme.valueText}`}>
              {value}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[0.8125rem] font-bold font-mono tabular-nums shrink-0 ${trendBadgeClass}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
            </span>
          </div>
        </div>

        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${floatIcon ? 'animate-float-gentle' : ''} ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Full-Width Wrapping Summary Subtitle */}
      <div className="pt-3 border-t border-slate-300 dark:border-zinc-600">
        <p className="text-sm text-black/80 dark:text-white/85 leading-relaxed break-words">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
