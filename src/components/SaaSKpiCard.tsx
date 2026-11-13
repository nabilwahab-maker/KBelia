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
    stroke: '#2563EB',
    fillStart: 'rgba(37, 99, 235, 0.24)',
    fillEnd: 'rgba(37, 99, 235, 0.0)',
    iconBg: 'bg-blue-600 dark:bg-blue-600 border-blue-500 text-white',
    hoverBorder: 'hover:border-blue-400/70 dark:hover:border-blue-400/70',
    valueText: 'text-black dark:text-white'
  },
  emerald: {
    stroke: '#059669',
    fillStart: 'rgba(5, 150, 105, 0.26)',
    fillEnd: 'rgba(5, 150, 105, 0.0)',
    iconBg: 'bg-emerald-600 dark:bg-emerald-600 border-emerald-500 text-white',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500/60',
    valueText: 'text-black dark:text-white'
  },
  amber: {
    stroke: '#F59E0B',
    fillStart: 'rgba(245, 158, 11, 0.28)',
    fillEnd: 'rgba(245, 158, 11, 0.0)',
    iconBg: 'bg-amber-400 dark:bg-amber-400 border-amber-500 text-black',
    hoverBorder: 'hover:border-amber-400/70 dark:hover:border-amber-400/70',
    valueText: 'text-black dark:text-white'
  },
  violet: {
    stroke: '#4F46E5',
    fillStart: 'rgba(79, 70, 229, 0.24)',
    fillEnd: 'rgba(79, 70, 229, 0.0)',
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
  accentColor = 'sky',
  sparkData,
  chartId,
  onClick
}) => {
  const theme = COLOR_MAP[accentColor];
  const gradientId = `spark-grad-${chartId}`;

  const trendBadgeClass =
    trendDirection === 'up'
      ? 'bg-emerald-100 dark:bg-emerald-900/70 text-black dark:text-white border-emerald-300 dark:border-emerald-700'
      : trendDirection === 'down'
      ? 'bg-rose-100 dark:bg-rose-900/70 text-black dark:text-white border-rose-300 dark:border-rose-700'
      : 'bg-amber-100 dark:bg-zinc-800 text-black dark:text-white border-amber-300 dark:border-zinc-700';

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.hoverBorder} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Header: Title & Icon Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-medium text-black/70 dark:text-white/75 block truncate">
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
        <span className="text-[11px] text-black/70 dark:text-white/75 truncate">
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
                    <div className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-mono shadow-md border border-amber-400/50 pointer-events-none">
                      <span className="text-white/75 mr-1.5">{pt.label}:</span>
                      <span className="font-bold text-white">{pt.value.toLocaleString()}</span>
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
