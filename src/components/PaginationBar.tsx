import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  accent?: 'teal' | 'blue' | 'rose' | 'amber';
  variant?: 'default' | 'compact';
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
  accent,
  variant = 'compact'
}) => {
  const { isAdmin, isMentor } = useAuth();
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalItems === 0) {
    return null;
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const resolvedAccent = accent || (isAdmin ? 'amber' : isMentor ? 'blue' : 'teal');

  const activeButtonClass =
    resolvedAccent === 'rose'
      ? 'bg-rose-600 text-white border-rose-600 dark:bg-rose-600 dark:border-rose-500'
      : resolvedAccent === 'amber'
      ? 'bg-[#9A5628] text-white border-[#9A5628] dark:bg-[#D98A4E] dark:text-[#141312] dark:border-[#D98A4E]'
      : resolvedAccent === 'blue'
      ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] dark:bg-[#0EA5E9] dark:text-[#07111A] dark:border-[#0EA5E9]'
      : 'bg-[#0B6E52] text-white border-[#0B6E52] dark:bg-[#10B981] dark:text-[#08120E] dark:border-[#10B981]';

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
      <div className="px-4 py-3.5 border-t border-slate-200/75 dark:border-white/10 flex flex-wrap items-center justify-end gap-3 rounded-b-2xl">
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="Halaman sebelumnya"
            title="Halaman sebelumnya"
            className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/12 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-[#F5F3EE] hover:bg-slate-100/80 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1.5 text-sm text-slate-500 dark:text-stone-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={safePage === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl text-sm font-semibold border tabular-nums inline-flex items-center justify-center transition-colors cursor-pointer ${
                  safePage === page
                    ? `${activeButtonClass}`
                    : 'border-transparent bg-transparent text-slate-700 dark:text-stone-300 hover:bg-slate-100/70 dark:hover:bg-white/8'
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
            className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/12 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-[#F5F3EE] hover:bg-slate-100/80 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="pt-3 mt-3 border-t border-slate-200/75 dark:border-white/10 flex flex-wrap items-center justify-end gap-3">
      <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-slate-200/80 dark:border-white/12 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-[#F5F3EE] hover:bg-slate-100/80 dark:hover:bg-white/10 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelum</span>
        </button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-sm text-slate-500 dark:text-stone-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={safePage === page ? 'page' : undefined}
              className={`min-w-[2.125rem] px-3 py-1.5 rounded-xl text-sm font-semibold border tabular-nums transition-colors cursor-pointer ${
                safePage === page
                  ? `${activeButtonClass}`
                  : 'border-slate-200/80 dark:border-white/12 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-[#F5F3EE] hover:bg-slate-100/80 dark:hover:bg-white/10'
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
          className="px-3 py-1.5 rounded-xl text-sm font-semibold border border-slate-200/80 dark:border-white/12 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-[#F5F3EE] hover:bg-slate-100/80 dark:hover:bg-white/10 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
        >
          <span>Seterusnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
