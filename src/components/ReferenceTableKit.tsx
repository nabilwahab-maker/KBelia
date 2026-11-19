import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, MoreHorizontal, X, ArrowUpDown } from 'lucide-react';
import { ToolbarSortOption } from '../utils/sortUtils';

type ToolbarAccent = 'blue' | 'indigo' | 'teal';

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
    inputFocus: 'focus:ring-blue-500/30 focus:border-blue-600',
    activeFilter: 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-black dark:text-white',
    sortIcon: 'text-blue-600 dark:text-blue-400',
    closeBtn: 'bg-blue-600 hover:bg-blue-700'
  },
  indigo: {
    inputFocus: 'focus:ring-indigo-500/30 focus:border-indigo-600',
    activeFilter: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-black dark:text-white',
    sortIcon: 'text-indigo-600 dark:text-indigo-400',
    closeBtn: 'bg-indigo-600 hover:bg-indigo-700'
  },
  teal: {
    inputFocus: 'focus:ring-teal-500/30 focus:border-teal-600',
    activeFilter: 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-black dark:text-white',
    sortIcon: 'text-teal-600 dark:text-teal-400',
    closeBtn: 'bg-teal-600 hover:bg-teal-700'
  }
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
  accent = 'blue'
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const hasSortControl = Boolean(sortOptions && sortOptions.length > 0 && sortValue !== undefined && onSortChange);
  const hasPopoverBody = Boolean(filterContent || hasSortControl);
  const theme = TOOLBAR_ACCENTS[accent];

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

  return (
    <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-zinc-700">
      <div className="relative w-full sm:w-72 min-w-0">
        <Search className="w-4 h-4 text-black/45 dark:text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 transition-all ${theme.inputFocus}`}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Kosongkan carian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white cursor-pointer"
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
                  : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
            </button>

            {isFilterOpen && (
              <div className="animate-popover-enter absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl p-4 z-40 space-y-3.5 text-left">
                {hasSortControl && sortOptions && onSortChange && (
                  <div className={filterContent ? 'pb-3 border-b border-slate-200 dark:border-zinc-700' : ''}>
                    <label className="block text-[0.8125rem] font-bold text-black/75 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                      <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${theme.sortIcon}`} />
                      <span>{sortLabel}</span>
                    </label>
                    <select
                      value={sortValue}
                      onChange={(e) => onSortChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer focus:outline-none focus:ring-2 ${theme.inputFocus}`}
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

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2">
                  {onResetFilters ? (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="text-[0.8125rem] font-semibold text-black/75 dark:text-white/80 hover:text-black dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Set Semula
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className={`px-3 py-1.5 rounded-lg text-white text-[0.8125rem] font-bold cursor-pointer transition-colors ${theme.closeBtn}`}
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
                      ? 'font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
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
        className="w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 text-black/60 dark:text-white/65 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {portalContent}
    </div>
  );
};

