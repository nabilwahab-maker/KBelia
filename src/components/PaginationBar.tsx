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
  variant?: 'default' | 'compact';
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
  accent = 'teal',
  variant = 'compact'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalItems === 0) {
    return null;
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

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

  if (variant === 'compact') {
    return (
      <div className="px-4 py-3.5 border-t border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-end gap-3 bg-white dark:bg-zinc-900 rounded-b-2xl">
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="Halaman sebelumnya"
            title="Halaman sebelumnya"
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1.5 text-sm text-black/60 dark:text-white/60 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={safePage === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-lg text-sm font-bold border tabular-nums inline-flex items-center justify-center transition-colors cursor-pointer ${
                  safePage === page
                    ? `${activeButtonClass} shadow-2xs`
                    : 'border-transparent bg-transparent text-black/80 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-zinc-800'
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
            aria-label="Halaman seterusnya"
            title="Halaman seterusnya"
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-end gap-3">
      <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelum</span>
        </button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-sm text-black/60 dark:text-white/60 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={safePage === page ? 'page' : undefined}
              className={`min-w-[2.125rem] px-3 py-1.5 rounded-lg text-sm font-bold border tabular-nums transition-colors cursor-pointer ${
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
          className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
        >
          <span>Seterusnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
