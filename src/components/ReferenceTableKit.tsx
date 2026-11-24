import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, MoreHorizontal, X, ArrowUpDown } from 'lucide-react';
import { ToolbarSortOption } from '../utils/sortUtils';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';

type ToolbarAccent = 'blue' | 'indigo' | 'teal' | 'amber' | 'emerald';

const TOOLBAR_ACCENTS: Record<
  ToolbarAccent,
  {
    inputFocus: string;
    activeFilter: string;
    sortIcon: string;
    closeBtn: string;
  }
> = {
  blue: {
    inputFocus: 'focus:ring-[#38BDF8]/25 focus:border-[#1D4ED8] dark:focus:border-[#38BDF8]',
    activeFilter: 'bg-[#EEF4FA] dark:bg-[#15212D] border-[#1D4ED8]/35 dark:border-[#38BDF8]/40 text-[#0F1E2E] dark:text-[#F1F6FA]',
    sortIcon: 'text-[#1D4ED8] dark:text-[#38BDF8]',
    closeBtn: 'bg-[#1D4ED8] hover:bg-[#1E40AF] dark:bg-[#0EA5E9] dark:text-[#07111A]'
  },
  indigo: {
    inputFocus: 'focus:ring-[#D98A4E]/25 focus:border-[#9A5628] dark:focus:border-[#D98A4E]',
    activeFilter: 'bg-[#F5EFE6] dark:bg-[#2A231C] border-[#9A5628]/40 dark:border-[#D98A4E]/45 text-[#231F1C] dark:text-[#F5F2EC]',
    sortIcon: 'text-[#9A5628] dark:text-[#D98A4E]',
    closeBtn: 'bg-[#9A5628] hover:bg-[#7D451F] dark:bg-[#D98A4E] dark:text-[#141312]'
  },
  teal: {
    inputFocus: 'focus:ring-[#10B981]/25 focus:border-[#0B6E52] dark:focus:border-[#34D399]',
    activeFilter: 'bg-[#EBF7F2] dark:bg-[#13261F] border-[#0B6E52]/35 dark:border-[#34D399]/40 text-[#0F241C] dark:text-[#F4F1EA]',
    sortIcon: 'text-[#0B6E52] dark:text-[#34D399]',
    closeBtn: 'bg-[#0B6E52] hover:bg-[#095A43] dark:bg-[#10B981] dark:text-[#08120E]'
  },
  amber: {
    inputFocus: 'focus:ring-[#D98A4E]/25 focus:border-[#9A5628] dark:focus:border-[#D98A4E]',
    activeFilter: 'bg-[#F5EFE6] dark:bg-[#2A231C] border-[#9A5628]/40 dark:border-[#D98A4E]/45 text-[#231F1C] dark:text-[#F5F2EC]',
    sortIcon: 'text-[#9A5628] dark:text-[#D98A4E]',
    closeBtn: 'bg-[#9A5628] hover:bg-[#7D451F] dark:bg-[#D98A4E] dark:text-[#141312]'
  },
  emerald: {
    inputFocus: 'focus:ring-[#10B981]/25 focus:border-[#0B6E52] dark:focus:border-[#34D399]',
    activeFilter: 'bg-[#EBF7F2] dark:bg-[#13261F] border-[#0B6E52]/35 dark:border-[#34D399]/40 text-[#0F241C] dark:text-[#F4F1EA]',
    sortIcon: 'text-[#0B6E52] dark:text-[#34D399]',
    closeBtn: 'bg-[#0B6E52] hover:bg-[#095A43] dark:bg-[#10B981] dark:text-[#08120E]'
  }
};

export const getSearchInputWidth = (placeholder: string): string => {
  const length = placeholder.trim().length;
  const px = Math.min(420, Math.max(240, Math.round(length * 7.6 + 80)));
  return `${px}px`;
};

interface ReferenceTableToolbarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filterCount?: number;
  onResetFilters?: () => void;
  filterContent?: React.ReactNode;
  sortOptions?: ToolbarSortOption[];
  sortValue?: string;
  onSortChange?: (val: string) => void;
  sortLabel?: string;
  rightSlot?: React.ReactNode;
  accent?: ToolbarAccent;
}

export const ReferenceTableToolbar: React.FC<ReferenceTableToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari rekod...',
  filterCount = 0,
  onResetFilters,
  filterContent,
  sortOptions,
  sortValue,
  onSortChange,
  sortLabel = 'Susun Mengikut',
  rightSlot,
  accent
}) => {
  const { isAdmin, isMentor } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const hasSortControl = Boolean(sortOptions && sortOptions.length > 0 && sortValue !== undefined && onSortChange);
  const hasPopoverBody = Boolean(filterContent || hasSortControl);
  const resolvedAccent: ToolbarAccent =
    accent || (isAdmin ? 'amber' : isMentor ? 'blue' : 'emerald');
  const theme = TOOLBAR_ACCENTS[resolvedAccent];

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

  const fitWidth = getSearchInputWidth(searchPlaceholder);

  return (
    <div className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/75 dark:border-white/10">
      <div
        style={{ ['--search-fit-w' as string]: fitWidth }}
        className="relative w-full sm:w-[var(--search-fit-w)] sm:max-w-full min-w-0"
      >
        <Search className="w-4 h-4 text-slate-400 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-white/70 dark:bg-black/25 border border-slate-200/80 dark:border-white/12 text-slate-900 dark:text-[#F5F3EE] placeholder:text-slate-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-black/40 focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Kosongkan carian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {rightSlot}

        {hasPopoverBody && (
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-expanded={isFilterOpen}
              aria-label={filterCount > 0 ? `Penapis (${filterCount} aktif)` : 'Penapis'}
              title={filterCount > 0 ? `Penapis (${filterCount} aktif)` : 'Penapis'}
              className={`min-h-[38px] w-[38px] rounded-xl border inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                filterCount > 0
                  ? theme.activeFilter
                  : 'bg-white/75 dark:bg-white/5 border-slate-200/80 dark:border-white/12 text-slate-700 dark:text-stone-200 hover:bg-slate-100/80 dark:hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
            </button>

            {isFilterOpen && (
              <div className="animate-popover-enter absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#171817] border border-slate-200 dark:border-white/12 shadow-xl p-4 z-40 space-y-3.5 text-left">
                {hasSortControl && sortOptions && onSortChange && (
                  <div className={filterContent ? 'pb-3 border-b border-slate-200/75 dark:border-white/10' : ''}>
                    <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
                      <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${theme.sortIcon}`} />
                      <span>{sortLabel}</span>
                    </label>
                    <select
                      value={sortValue}
                      onChange={(e) => onSortChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/12 text-slate-900 dark:text-[#F5F3EE] font-medium cursor-pointer focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterContent}

                <div className="pt-2 border-t border-slate-200/75 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                  {onResetFilters ? (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Set Semula
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className={`px-3.5 py-1.5 rounded-xl text-white text-[0.8125rem] font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${theme.closeBtn}`}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export interface RowActionItem {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'accent';
  disabled?: boolean;
  dividerBefore?: boolean;
}

interface RowActionMenuProps {
  items: RowActionItem[];
  ariaLabel?: string;
}

export const RowActionMenu: React.FC<RowActionMenuProps> = ({
  items,
  ariaLabel = 'Tindakan baris'
}) => {
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; maxHeight: number; ready: boolean }>({
    top: 0,
    left: 0,
    maxHeight: 320,
    ready: false
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter(Boolean);

  const updateMenuPosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const padding = 12;
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth || 208;
    const estimatedHeight = menuEl?.offsetHeight || Math.min(320, visibleItems.length * 40 + 18);
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const spaceBelow = viewportH - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const maxHeight = Math.max(140, openUp ? spaceAbove : spaceBelow);
    const effectiveHeight = Math.min(estimatedHeight, maxHeight);

    const rawTop = openUp ? rect.top - effectiveHeight - 4 : rect.bottom + 4;
    const top = Math.max(padding, Math.min(rawTop, viewportH - effectiveHeight - padding));
    const left = Math.max(padding, Math.min(rect.right - menuWidth, viewportW - menuWidth - padding));

    setMenuPos({ top, left, maxHeight, ready: true });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
  }, [isOpen, visibleItems.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  if (visibleItems.length === 0) return null;

  const portalContent =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              maxHeight: `${menuPos.maxHeight}px`,
              visibility: menuPos.ready ? 'visible' : 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-popover-enter w-52 max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl py-1.5 z-[80] text-left"
          >
            {visibleItems.map((item, idx) => (
              <React.Fragment key={`${item.label}-${idx}`}>
                {item.dividerBefore && (
                  <div className="my-1 border-t border-slate-200 dark:border-zinc-700" />
                )}
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={`w-full px-3.5 py-2 text-sm text-left cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    item.tone === 'danger'
                      ? 'font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                      : item.tone === 'accent'
                      ? `font-semibold ${roleTheme.accentTextClass} ${roleTheme.rowHoverClass}`
                      : 'font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-flex items-center justify-end max-w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => {
            if (!prev) {
              setMenuPos((m) => ({ ...m, ready: false }));
            }
            return !prev;
          });
        }}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="w-8 h-8 rounded-xl inline-flex items-center justify-center shrink-0 text-black/60 dark:text-white/65 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {portalContent}
    </div>
  );
};

