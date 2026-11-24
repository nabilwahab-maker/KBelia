import React from 'react';
import { LucideIcon, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { usePrefersReducedMotion } from '../hooks/useMotion';
import { DashboardRole, getRoleTheme } from '../utils/roleTheme';

export interface RoleDonutSegment {
  name: string;
  value: number;
  color: string;
  secondaryLabel?: string;
}

export interface RoleDonutSummaryPair {
  label: string;
  value: string;
  dotColor?: string;
}

export interface RoleDonutEmptyState {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface RoleDonutCardProps {
  role?: DashboardRole;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accentBarClass?: string;
  headerRight?: React.ReactNode;
  segments: RoleDonutSegment[];
  centerValue: string | number;
  centerLabel: string;
  summaryPairs: [RoleDonutSummaryPair, RoleDonutSummaryPair];
  valueUnit?: string;
  emptyState: RoleDonutEmptyState;
  staggerIndex?: number;
  className?: string;
}

export const RoleDonutCard: React.FC<RoleDonutCardProps> = ({
  role = 'belia',
  title,
  subtitle,
  icon: Icon,
  headerRight,
  segments,
  centerValue,
  centerLabel,
  summaryPairs,
  valueUnit = 'rekod',
  emptyState,
  staggerIndex = 5,
  className = ''
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const theme = getRoleTheme(role);
  const visibleSegments = segments.filter((seg) => seg.value > 0);
  const totalValue = visibleSegments.reduce((sum, seg) => sum + seg.value, 0);
  const hasData = visibleSegments.length > 0 && totalValue > 0;

  return (
    <div
      style={{ '--stagger': staggerIndex } as React.CSSProperties}
      className={`animate-dashboard-card w-full rounded-2xl border backdrop-blur-xs overflow-hidden transition-all duration-200 flex flex-col justify-between min-w-0 ${theme.surfaceClass} ${className}`}
    >
      {/* Header */}
      <div className={`border-b py-3.5 px-5 flex items-center justify-between gap-2.5 ${theme.dividerClass}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`w-4.5 h-4.5 shrink-0 ${theme.accentTextClass}`} />
            <h4 className="font-display text-base sm:text-[1.0625rem] font-bold text-slate-900 dark:text-[#F5F3EE] leading-snug tracking-tight truncate">
              {title}
            </h4>
          </div>
          {subtitle && (
            <p className="text-[0.8125rem] text-slate-500 dark:text-stone-400 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {/* Body: Donut Chart + Centered KPI + Legend */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5 min-w-0">
        {hasData ? (
          <>
            <div className="relative h-[184px] w-full min-w-0 flex items-center justify-center">
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height={184} minWidth={0} initialDimension={{ width: 280, height: 184 }}>
                  <PieChart>
                    <Pie
                      data={visibleSegments}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={78}
                      paddingAngle={visibleSegments.length > 1 ? 3 : 0}
                      cornerRadius={4}
                      stroke="none"
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={620}
                      animationEasing="ease-out"
                    >
                      {visibleSegments.map((seg) => (
                        <Cell key={seg.name} fill={seg.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as RoleDonutSegment;
                          const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
                          const formattedValue =
                            valueUnit === 'RM'
                              ? `RM ${item.value.toLocaleString('ms-MY')}`
                              : `${item.value.toLocaleString('ms-MY')} ${valueUnit}`;
                          return (
                            <div className={`px-3.5 py-2.5 rounded-xl text-sm font-mono shadow-xl border z-50 ${theme.tooltipBgClass}`}>
                              <div className="font-bold mb-0.5">{item.name}</div>
                              <div className="opacity-90 tabular-nums">
                                {formattedValue} · {pct}%
                              </div>
                              {item.secondaryLabel && (
                                <div className="text-[0.8125rem] opacity-75 mt-0.5">{item.secondaryLabel}</div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Centered Summary inside Donut Hole */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                <span className="font-mono tabular-nums text-lg sm:text-xl font-extrabold text-slate-900 dark:text-[#F5F3EE] leading-none tracking-tight">
                  {centerValue}
                </span>
                <span className="text-[0.78rem] font-medium text-slate-500 dark:text-stone-400 mt-1 leading-tight max-w-[104px]">
                  {centerLabel}
                </span>
              </div>
            </div>

            {/* Clean Legend List */}
            <div className="space-y-2 pt-1">
              {visibleSegments.slice(0, 5).map((seg) => {
                const pct = totalValue > 0 ? Math.round((seg.value / totalValue) * 100) : 0;
                return (
                  <div
                    key={seg.name}
                    className="flex items-center justify-between gap-2 text-[0.8125rem] leading-snug"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-slate-800 dark:text-stone-200 truncate">
                        {seg.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums text-slate-600 dark:text-stone-300">
                      <span className="text-[0.8125rem] text-slate-500 dark:text-stone-400">
                        {seg.secondaryLabel ||
                          (valueUnit === 'RM'
                            ? `RM ${seg.value.toLocaleString('ms-MY')}`
                            : `${seg.value} ${valueUnit}`)}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-[#F5F3EE] min-w-[2.25rem] text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-3 gap-2.5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-slate-500 dark:text-stone-400 ${theme.surfaceMutedClass} ${theme.dividerClass}`}>
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-[#F5F3EE]">{emptyState.title}</p>
              <p className="text-[0.8125rem] text-slate-600 dark:text-stone-400 mt-1 max-w-[240px] leading-relaxed">
                {emptyState.description}
              </p>
            </div>
            {emptyState.actionLabel && emptyState.onAction && (
              <button
                type="button"
                onClick={emptyState.onAction}
                className={`mt-1 px-3.5 py-2 rounded-xl text-[0.8125rem] font-semibold transition-colors cursor-pointer ${theme.primaryButtonClass}`}
              >
                {emptyState.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Summary Strip */}
      <div className={`px-5 py-3 border-t grid grid-cols-2 gap-2 text-[0.8125rem] ${theme.surfaceMutedClass} ${theme.dividerClass}`}>
        {summaryPairs.map((pair, idx) => (
          <div
            key={pair.label}
            className={`flex items-center justify-between gap-1.5 min-w-0 ${
              idx === 1 ? `pl-3 border-l ${theme.dividerClass}` : 'pr-1'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-stone-300 font-medium truncate">
              {pair.dotColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: pair.dotColor }}
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{pair.label}</span>
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-[#F5F3EE] shrink-0">
              {pair.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
