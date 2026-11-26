import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { DashboardRole, getRoleTheme } from '../utils/roleTheme';
import { ToolbarSortOption } from '../utils/sortUtils';

export interface WorkspaceSplitPaneProps {
  role: Extract<DashboardRole, 'admin' | 'belia'>;
  leftHeader?: React.ReactNode;
  leftContent: React.ReactNode;
  leftFooter?: React.ReactNode;
  rightContent: React.ReactNode;
  mobileOpen: boolean;
  onMobileClose: () => void;
  mobileBackLabel?: string;
  mobileTitle?: string;
  leftSelectionScope?: string;
}

export function getWorkspaceActiveRowClass(role: Extract<DashboardRole, 'admin' | 'belia'>): string {
  if (role === 'admin') {
    return 'bg-[#9A5628]/10 dark:bg-[#D98A4E]/18';
  }
  return 'bg-[#0B6E52]/10 dark:bg-[#10B981]/18';
}

export const GoogleWorkspaceSplitPane: React.FC<WorkspaceSplitPaneProps> = ({
  role,
  leftHeader,
  leftContent,
  leftFooter,
  rightContent,
  mobileOpen,
  onMobileClose,
  mobileBackLabel = 'Kembali ke Senarai',
  mobileTitle,
  leftSelectionScope
}) => {
  const theme = getRoleTheme(role);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen, onMobileClose]);

  const mobileBgClass =
    role === 'admin'
      ? 'bg-[#FAF8F5] dark:bg-[#141210]'
      : 'bg-[#FAF9F6] dark:bg-[#101614]';

  return (
    <div className="relative z-0 grid grid-cols-1 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] gap-4 items-stretch">
      {/* Left Pane: 45% List Queue */}
      <div
        data-selection-scope={leftSelectionScope}
        className={`rounded-2xl border backdrop-blur-xs overflow-hidden flex flex-col justify-between ${theme.surfaceClass}`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {leftHeader}
          <div className={`divide-y ${theme.dividerClass} flex-1`}>
            {leftContent}
          </div>
        </div>
        {leftFooter}
      </div>

      {/* Right Pane: 55% Live Preview (Desktop) / Full-Screen Slide-Over (Mobile < lg) */}
      <div
        className={
          mobileOpen
            ? `fixed inset-0 z-50 flex flex-col overflow-y-auto ${mobileBgClass} lg:static lg:z-auto lg:block lg:overflow-hidden lg:rounded-2xl lg:border lg:backdrop-blur-xs ${theme.surfaceClass} animate-dashboard-tab`
            : `hidden lg:block rounded-2xl border backdrop-blur-xs overflow-hidden ${theme.surfaceClass}`
        }
      >
        {/* Mobile Slide-Over Top Bar */}
        {mobileOpen && (
          <div className={`lg:hidden sticky top-0 z-20 px-4 py-3 border-b flex items-center justify-between gap-3 backdrop-blur-md ${theme.topbarBgClass} ${theme.dividerClass}`}>
            <button
              type="button"
              onClick={onMobileClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${theme.secondaryButtonClass}`}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>{mobileBackLabel}</span>
            </button>
            {mobileTitle && (
              <span className="text-xs font-semibold text-slate-600 dark:text-stone-300 truncate max-w-[55%]">
                {mobileTitle}
              </span>
            )}
          </div>
        )}

        <div className="flex-1">
          {rightContent}
        </div>
      </div>
    </div>
  );
};

interface SidePreviewHeaderProps {
  role: Extract<DashboardRole, 'admin' | 'belia'>;
  media?: React.ReactNode;
  title: React.ReactNode;
  status?: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

export const SidePreviewHeader: React.FC<SidePreviewHeaderProps> = ({
  role,
  media,
  title,
  status,
  subtitle,
  meta,
  actions
}) => {
  const theme = getRoleTheme(role);

  return (
    <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${theme.surfaceMutedClass} ${theme.dividerClass}`}>
      <div className="flex items-start gap-3.5 min-w-0">
        {media && <div className="shrink-0">{media}</div>}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F2EC] leading-snug kbelia-trim">
              {title}
            </h4>
            {status}
          </div>
          {subtitle && (
            <p className={`text-sm font-semibold leading-snug kbelia-trim ${theme.accentTextClass}`}>
              {subtitle}
            </p>
          )}
          {meta && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-stone-400 leading-normal">
              {meta}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

interface SidePreviewMetricItem {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  mono?: boolean;
}

export const SidePreviewMetricsStrip: React.FC<{
  role: Extract<DashboardRole, 'admin' | 'belia'>;
  items: SidePreviewMetricItem[];
  columns?: 2 | 3;
}> = ({ role, items, columns = 3 }) => {
  const theme = getRoleTheme(role);
  const gridCols = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-3 p-3.5 rounded-xl border ${theme.surfaceMutedClass} ${theme.dividerClass}`}>
      {items.map((item, idx) => (
        <div key={idx} className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block">
            {item.label}
          </span>
          <span
            className={`text-sm font-semibold mt-0.5 block leading-snug kbelia-trim ${
              item.mono ? 'font-mono tabular-nums' : 'tabular-nums'
            } ${
              item.accent
                ? theme.accentTextClass
                : 'text-slate-900 dark:text-[#F5F2EC]'
            }`}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SidePreviewEmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="py-16 px-6 text-center space-y-2">
    <div className="mx-auto flex justify-center opacity-55">{icon}</div>
    <p className="text-sm font-semibold text-slate-900 dark:text-[#F5F2EC] kbelia-trim">{title}</p>
    <p className="text-xs text-slate-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
      {description}
    </p>
  </div>
);

export interface WorkspaceHeaderTab {
  id: string;
  label: string;
  count?: number;
}

interface WorkspaceHeaderCardProps {
  role: DashboardRole;
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  rightActions?: React.ReactNode;
  tabs?: WorkspaceHeaderTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  extraControls?: React.ReactNode;
  filterCount?: number;
  onResetFilters?: () => void;
  filterContent?: React.ReactNode;
  sortOptions?: ToolbarSortOption[];
  sortValue?: string;
  onSortChange?: (val: string) => void;
  sortLabel?: string;
}

export const WorkspaceHeaderCard: React.FC<WorkspaceHeaderCardProps> = ({
  role,
  icon,
  title,
  subtitle,
  rightActions,
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  extraControls,
  filterCount = 0,
  onResetFilters,
  filterContent,
  sortOptions,
  sortValue,
  onSortChange,
  sortLabel = 'Susun Mengikut'
}) => {
  const theme = getRoleTheme(role);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const hasSortControl = Boolean(sortOptions && sortOptions.length > 0 && sortValue !== undefined && onSortChange);
  const hasPopoverBody = Boolean(filterContent || hasSortControl);
  const hasTabs = Boolean(tabs && tabs.length > 0);
  const hasBottomStrip = Boolean(hasTabs || onSearchChange || extraControls || hasPopoverBody);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

  const popoverSurfaceClass =
    role === 'admin'
      ? 'bg-white dark:bg-[#1A1816] border-[#E3DDD2] dark:border-[#37322D]'
      : role === 'mentor'
      ? 'bg-white dark:bg-[#141B24] border-[#DCE2EC] dark:border-[#243244]'
      : 'bg-white dark:bg-[#141D1A] border-[#E2DCCB] dark:border-[#24342D]';

  return (
    <div className={`relative z-20 rounded-2xl border backdrop-blur-xs overflow-visible transition-colors ${theme.surfaceClass}`}>
      <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          {icon && <div className={`shrink-0 mt-0.5 sm:mt-0 ${theme.accentTextClass}`}>{icon}</div>}
          <div className="min-w-0">
            <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5F2EC] tracking-tight leading-snug kbelia-trim">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-400 leading-relaxed kbelia-prose">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightActions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {rightActions}
          </div>
        )}
      </div>

      {hasBottomStrip && (
        <div className={`px-4 sm:px-5 border-t flex items-center justify-between flex-wrap gap-2.5 ${theme.dividerClass}`}>
          {hasTabs && tabs ? (
            <div className="flex items-center gap-5 overflow-x-auto">
              {tabs.map((tab) => {
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer ${
                      isTabActive ? theme.tabActiveUnderlineClass : theme.tabIdleUnderlineClass
                    }`}
                  >
                    <span className="kbelia-trim">{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tabular-nums ${
                          isTabActive
                            ? theme.activeNavClass
                            : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : onSearchChange ? (
            <div className="py-2.5 flex-1 min-w-[200px] sm:max-w-xs md:max-w-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`pl-9 pr-7 py-2 rounded-xl text-xs sm:text-sm w-full focus:outline-none ${theme.inputClass}`}
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Kosongkan carian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {(extraControls || hasPopoverBody || (hasTabs && onSearchChange)) && (
            <div className="flex flex-wrap items-center gap-2 py-2 ml-auto shrink-0">
              {hasTabs && onSearchChange && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchValue ?? ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className={`pl-9 pr-7 py-1.5 rounded-xl text-xs sm:text-sm w-44 sm:w-56 focus:outline-none ${theme.inputClass}`}
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      aria-label="Kosongkan carian"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {extraControls}

              {hasPopoverBody && (
                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    aria-expanded={isFilterOpen}
                    aria-label={filterCount > 0 ? `Penapis (${filterCount} aktif)` : 'Penapis'}
                    title={filterCount > 0 ? `Penapis (${filterCount} aktif)` : 'Penapis'}
                    className={`min-h-[38px] px-2.5 rounded-xl border inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                      filterCount > 0
                        ? theme.activeMiniBtnClass
                        : theme.secondaryButtonClass
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 shrink-0" />
                    {filterCount > 0 && (
                      <span className="text-xs font-bold tabular-nums">{filterCount}</span>
                    )}
                  </button>

                  {isFilterOpen && (
                    <div
                      className={`animate-popover-enter absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl p-4 z-40 space-y-3.5 text-left ${popoverSurfaceClass}`}
                    >
                      {filterContent}

                      {hasSortControl && sortOptions && onSortChange && (
                        <div className={filterContent ? `pt-3 border-t pb-3 border-b ${theme.dividerClass}` : `pb-3 border-b ${theme.dividerClass}`}>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                            <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${theme.accentTextClass}`} />
                            <span>{sortLabel}</span>
                          </label>
                          <select
                            value={sortValue}
                            onChange={(e) => onSortChange(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${theme.inputClass}`}
                          >
                            {sortOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-0.5">
                        {onResetFilters ? (
                          <button
                            type="button"
                            onClick={onResetFilters}
                            className="text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-300 hover:underline cursor-pointer"
                          >
                            Set Semula
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => setIsFilterOpen(false)}
                          className={`px-3.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold cursor-pointer ${theme.primaryButtonClass}`}
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

