import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export interface SparkPoint {
  label: string;
  value: number;
}

interface SaaSKpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trendLabel: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accentColor?: 'sky' | 'emerald' | 'amber' | 'violet';
  sparkData: SparkPoint[];
  chartId: string;
  onClick?: () => void;
}

const COLOR_MAP = {
  sky: {
    stroke: '#0284C7',
    fillStart: 'rgba(14, 165, 233, 0.32)',
    fillEnd: 'rgba(14, 165, 233, 0.0)',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200/80 dark:border-sky-800/60 text-sky-600 dark:text-sky-400',
    hoverBorder: 'hover:border-sky-300/90 dark:hover:border-sky-500/40',
    valueText: 'text-slate-900 dark:text-white'
  },
  emerald: {
    stroke: '#059669',
    fillStart: 'rgba(16, 185, 129, 0.32)',
    fillEnd: 'rgba(16, 185, 129, 0.0)',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-300/90 dark:hover:border-emerald-500/40',
    valueText: 'text-slate-900 dark:text-white'
  },
  amber: {
    stroke: '#D97706',
    fillStart: 'rgba(245, 158, 11, 0.32)',
    fillEnd: 'rgba(245, 158, 11, 0.0)',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-300/90 dark:hover:border-amber-500/40',
    valueText: 'text-amber-600 dark:text-amber-400'
  },
  violet: {
    stroke: '#7C3AED',
    fillStart: 'rgba(139, 92, 246, 0.32)',
    fillEnd: 'rgba(139, 92, 246, 0.0)',
    iconBg: 'bg-violet-50 dark:bg-violet-950/60 border-violet-200/80 dark:border-violet-800/60 text-violet-600 dark:text-violet-400',
    hoverBorder: 'hover:border-violet-300/90 dark:hover:border-violet-500/40',
    valueText: 'text-slate-900 dark:text-white'
  }
};

export const SaaSKpiCard: React.FC<SaaSKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trendLabel,
  trendDirection = 'up',
  accentColor = 'sky',
  sparkData,
  chartId,
  onClick
}) => {
  const theme = COLOR_MAP[accentColor];
  const gradientId = `spark-grad-${chartId}`;

  const trendBadgeClass =
    trendDirection === 'up'
      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
      : trendDirection === 'down'
      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white/85 dark:bg-zinc-900/75 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.hoverBorder} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Header: Title & Icon Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 block truncate">
            {title}
          </span>
          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            <span className={`text-2xl sm:text-[26px] font-black font-mono tabular-nums tracking-tight leading-none ${theme.valueText}`}>
              {value}
            </span>
          </div>
        </div>

        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${theme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Trend Badge & Subtitle */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold font-mono tabular-nums shrink-0 ${trendBadgeClass}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendLabel}</span>
        </span>
        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
          {subtitle}
        </span>
      </div>

      {/* Mini Sparkline Area Chart */}
      <div className="mt-3 h-11 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.fillStart} stopOpacity={1} />
                <stop offset="100%" stopColor={theme.fillEnd} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={{ stroke: theme.stroke, strokeWidth: 1, strokeDasharray: '2 2' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as SparkPoint;
                  return (
                    <div className="px-2 py-1 rounded-md bg-zinc-900/95 text-white text-[10px] font-mono shadow-md border border-zinc-700 pointer-events-none">
                      <span className="text-zinc-400 mr-1.5">{pt.label}:</span>
                      <span className="font-bold">{pt.value.toLocaleString()}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
