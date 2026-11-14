import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const usePagination = <T,>(
  items: T[],
  itemsPerPage = 5,
  resetDeps: unknown[] = []
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  return {
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    totalItems: items.length,
    paginatedItems
  };
};

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  accent?: 'teal' | 'blue' | 'rose';
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
  itemLabel = 'rekod',
  accent = 'teal'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalItems <= itemsPerPage || totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  const activeButtonClass =
    accent === 'rose'
      ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-600 dark:border-rose-500'
      : accent === 'blue'
      ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500'
      : 'bg-teal-600 text-white border-teal-600 dark:bg-teal-600 dark:border-teal-500';

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs text-black/70 dark:text-white/75 tabular-nums">
        Menunjukkan <span className="font-bold text-black dark:text-white">{startItem}–{endItem}</span> daripada{' '}
        <span className="font-bold text-black dark:text-white">{totalItems}</span> {itemLabel}
      </div>

      <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Sebelum</span>
        </button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-xs text-black/60 dark:text-white/60 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={safePage === page ? 'page' : undefined}
              className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs font-bold border tabular-nums transition-colors cursor-pointer ${
                safePage === page
                  ? `${activeButtonClass} shadow-2xs`
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
        >
          <span>Seterusnya</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </nav>
    </div>
  );
};
