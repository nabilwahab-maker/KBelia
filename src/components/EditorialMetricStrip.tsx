import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAnimatedMetric } from '../hooks/useMotion';
import { DashboardRole, getRoleTheme } from '../utils/roleTheme';

export interface EditorialMetricItem {
  id: string;
  label: string;
  value: string | number;
  summary: string;
  highlightTone?: 'primary' | 'secondary' | 'neutral';
  onClick?: () => void;
}

interface EditorialMetricStripProps {
  role: DashboardRole;
  items: EditorialMetricItem[];
}

const MetricCell: React.FC<{
  item: EditorialMetricItem;
  role: DashboardRole;
  index: number;
}> = ({ item, role, index }) => {
  const theme = getRoleTheme(role);
  const animatedValue = useAnimatedMetric(item.value);

  const valueColorClass =
    item.highlightTone === 'primary'
      ? theme.accentTextClass
      : item.highlightTone === 'secondary'
      ? theme.accentStrongTextClass
      : 'text-slate-900 dark:text-[#F5F3EE]';

  const Tag = item.onClick ? 'button' : 'div';

  return (
    <Tag
      type={item.onClick ? 'button' : undefined}
      onClick={item.onClick}
      style={{ '--stagger': index } as React.CSSProperties}
      className={`animate-dashboard-card group relative px-4 sm:px-5 py-4 text-left transition-colors duration-200 flex flex-col justify-between gap-2 min-w-0 ${
        item.onClick
          ? 'cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current'
          : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-300/90 leading-snug truncate">
          {item.label}
        </span>
        {item.onClick && (
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </div>

      <div
        className={`font-display text-2xl sm:text-[1.75rem] font-bold tracking-tight tabular-nums leading-none break-words ${valueColorClass}`}
      >
        {animatedValue}
      </div>

      <p className="text-[0.8125rem] text-slate-500 dark:text-stone-400 leading-snug line-clamp-2">
        {item.summary}
      </p>
    </Tag>
  );
};

export const EditorialMetricStrip: React.FC<EditorialMetricStripProps> = ({ role, items }) => {
  const theme = getRoleTheme(role);

  return (
    <section
      aria-label="Ringkasan Utama"
      className={`rounded-2xl border backdrop-blur-xs overflow-hidden transition-colors ${theme.surfaceClass}`}
    >
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x ${theme.dividerClass}`}
      >
        {items.map((item, idx) => (
          <MetricCell key={item.id} item={item} role={role} index={idx} />
        ))}
      </div>
    </section>
  );
};
