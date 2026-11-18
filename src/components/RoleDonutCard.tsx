import React from 'react';
import { LucideIcon, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { usePrefersReducedMotion } from '../hooks/useMotion';

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
  title: string;
  subtitle: string;
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
  title,
  subtitle,
  icon: Icon,
  accentBarClass,
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
  const visibleSegments = segments.filter((seg) => seg.value > 0);
  const totalValue = visibleSegments.reduce((sum, seg) => sum + seg.value, 0);
  const hasData = visibleSegments.length > 0 && totalValue > 0;

  return (
    <div
      style={{ '--stagger': staggerIndex } as React.CSSProperties}
      className={`animate-dashboard-card w-full rounded-2xl border border-slate-300 dark:border-zinc-700 hover:border-slate-400/80 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all duration-200 flex flex-col justify-between min-w-0 ${className}`}
    >
      {accentBarClass && <div className={`h-0.5 w-full shrink-0 ${accentBarClass}`} aria-hidden="true" />}

      {/* Header */}
      <div className="border-b border-slate-300 dark:border-zinc-600 py-3 px-4 flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-black dark:text-white/80 shrink-0" />
            <h4 className="text-sm sm:text-base font-bold text-black dark:text-white leading-snug truncate">
              {title}
            </h4>
          </div>
          <p className="text-[0.8125rem] sm:text-sm text-black/70 dark:text-white/75 mt-0.5 leading-snug">
            {subtitle}
          </p>
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {/* Body: Donut Chart + Centered KPI + Legend */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3 min-w-0">
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
                      innerRadius={54}
                      outerRadius={76}
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
                            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-xl border border-slate-700 z-50">
                              <div className="font-bold text-white mb-0.5">{item.name}</div>
                              <div className="text-white/90 tabular-nums">
                                {formattedValue} · {pct}%
                              </div>
                              {item.secondaryLabel && (
                                <div className="text-[0.75rem] text-white/75 mt-0.5">{item.secondaryLabel}</div>
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

              {/* Centered Percentage / Summary inside Donut Hole */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                <span className="font-mono tabular-nums text-lg sm:text-xl font-black text-black dark:text-white leading-none tracking-tight">
                  {centerValue}
                </span>
                <span className="text-[0.75rem] font-semibold text-black/65 dark:text-white/70 mt-1 leading-tight max-w-[96px]">
                  {centerLabel}
                </span>
              </div>
            </div>

            {/* Clean Legend List */}
            <div className="space-y-1.5 pt-1">
              {visibleSegments.slice(0, 5).map((seg) => {
                const pct = totalValue > 0 ? Math.round((seg.value / totalValue) * 100) : 0;
                return (
                  <div
                    key={seg.name}
                    className="flex items-center justify-between gap-2 text-[0.8125rem] leading-snug"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: seg.color }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-black dark:text-white truncate">
                        {seg.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums text-black/80 dark:text-white/85">
                      <span className="text-xs text-black/65 dark:text-white/70">
                        {seg.secondaryLabel ||
                          (valueUnit === 'RM'
                            ? `RM ${seg.value.toLocaleString('ms-MY')}`
                            : `${seg.value} ${valueUnit}`)}
                      </span>
                      <span className="font-bold text-black dark:text-white min-w-[2.25rem] text-right">
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
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-black/55 dark:text-white/60">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-black dark:text-white">{emptyState.title}</p>
              <p className="text-[0.8125rem] text-black/70 dark:text-white/75 mt-1 max-w-[240px] leading-relaxed">
                {emptyState.description}
              </p>
            </div>
            {emptyState.actionLabel && emptyState.onAction && (
              <button
                type="button"
                onClick={emptyState.onAction}
                className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                {emptyState.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Summary Strip */}
      <div className="px-4 py-2.5 border-t border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 grid grid-cols-2 gap-2 text-xs sm:text-[0.8125rem]">
        {summaryPairs.map((pair, idx) => (
          <div
            key={pair.label}
            className={`flex items-center justify-between gap-1.5 min-w-0 ${
              idx === 1 ? 'pl-2 border-l border-slate-300 dark:border-zinc-700' : 'pr-1'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 text-black/75 dark:text-white/80 font-medium truncate">
              {pair.dotColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: pair.dotColor }}
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{pair.label}</span>
            </span>
            <span className="font-mono font-bold tabular-nums text-black dark:text-white shrink-0">
              {pair.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
