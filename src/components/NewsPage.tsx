import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  ArrowRight,
  SlidersHorizontal,
  X,
  Pin,
  Eye,
  EyeOff,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { NewsCategory, PortalNews } from '../types';
import { NEWS_CATEGORIES } from '../data/newsData';
import { AdminNewsManager } from './AdminNewsManager';
import { savePortalNewsRecord } from '../services/dataService';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { ToolbarSortOption } from '../utils/sortUtils';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { AcronymText } from './TypographyPrimitives';

interface NewsPageProps {
  newsItems: PortalNews[];
  onRefresh: () => void;
  onOpenAdminNewsTab?: () => void;
}

const NewsImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-full object-cover' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-100 via-amber-50 to-slate-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex flex-col items-center justify-center p-4 text-center">
        <Newspaper className="w-8 h-8 text-black dark:text-white/75 mb-2" />
        <span className="text-[0.8125rem] font-semibold text-black dark:text-white line-clamp-2 max-w-[180px]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const NewsPage: React.FC<NewsPageProps> = ({
  newsItems,
  onRefresh,
  onOpenAdminNewsTab
}) => {
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | NewsCategory>('Semua');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc'>('date_desc');
  const [adminStatusView, setAdminStatusView] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedArticle, setSelectedArticle] = useState<PortalNews | null>(null);
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);

  const getArticleTimestamp = (item: PortalNews) =>
    new Date(item.publishedAt || item.updatedAt || item.createdAt || 0).getTime() || 0;

  // Strict role-based visibility: non-admins ONLY see published news
  const roleScopedNews = useMemo(() => {
    const base = isAdmin
      ? newsItems.filter(item => adminStatusView === 'all' || item.status === adminStatusView)
      : newsItems.filter(item => item.status === 'published');

    return [...base].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return getArticleTimestamp(b) - getArticleTimestamp(a);
    });
  }, [newsItems, isAdmin, adminStatusView]);

  // Top spotlight: pinned or newest as Main News, followed by 3 latest highlights
  const featuredArticle = useMemo(() => roleScopedNews[0] || null, [roleScopedNews]);
  const highlightArticles = useMemo(() => roleScopedNews.slice(1, 4), [roleScopedNews]);

  const sortOptions: ToolbarSortOption[] = [
    { value: 'date_desc', label: 'Tarikh (Terbaru Dahulu)' },
    { value: 'date_asc', label: 'Tarikh (Terlama Dahulu)' }
  ];

  const filteredNews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = roleScopedNews.filter(item => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });

    return [...matched].sort((a, b) => {
      const diff = getArticleTimestamp(a) - getArticleTimestamp(b);
      return sortBy === 'date_asc' ? diff : -diff;
    });
  }, [roleScopedNews, selectedCategory, searchQuery, sortBy]);

  const pagination = usePagination(filteredNews, 7, [
    searchQuery,
    selectedCategory,
    adminStatusView,
    sortBy,
    filteredNews.length
  ]);

  const activeFilterCount =
    (selectedCategory !== 'Semua' ? 1 : 0) +
    (sortBy !== 'date_desc' ? 1 : 0) +
    (isAdmin && adminStatusView !== 'all' ? 1 : 0);

  const formatReadableDate = (iso?: string) => {
    if (!iso) return 'Draf Belum Disiar';
    try {
      return new Intl.DateTimeFormat('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const handleAdminQuickStatusToggle = async (e: React.MouseEvent, item: PortalNews) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await savePortalNewsRecord({ ...item, status: nextStatus });
      showToast(
        nextStatus === 'published' ? 'Berita disiarkan kepada semua pengguna.' : 'Berita dipindahkan ke Draf.',
        'success'
      );
      onRefresh();
    } catch {
      showToast('Gagal menukar status berita.', 'error');
    }
  };

  const handleAdminQuickPinToggle = async (e: React.MouseEvent, item: PortalNews) => {
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      await savePortalNewsRecord({ ...item, isPinned: !item.isPinned });
      showToast(!item.isPinned ? 'Berita dipin sebagai sorotan utama.' : 'Berita dinyahpin.', 'info');
      onRefresh();
    } catch {
      showToast('Gagal mengubah status pin.', 'error');
    }
  };

  return (
    <div className="w-full space-y-5 animate-dashboard-tab">
      {/* Page Intro */}
      <div className="bg-slate-50/80 dark:bg-zinc-950/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-700">
        <div className="space-y-1">
          <h1 className="font-display text-fluid-portal font-extrabold text-black dark:text-white tracking-tight text-balance kbelia-trim">
            Berita &amp; Pengumuman KBelia Kelantan
          </h1>
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            id="btn-news-open-admin-manager"
            type="button"
            onClick={() => setShowAdminManagerModal(true)}
            className={`px-4 py-2 text-sm inline-flex items-center gap-2 shadow-xs ${roleTheme.primaryButtonClass}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Urus Berita</span>
          </button>
          {onOpenAdminNewsTab && (
            <button
              type="button"
              onClick={onOpenAdminNewsTab}
              className={`px-3.5 py-2 text-sm inline-flex items-center gap-1.5 ${roleTheme.secondaryButtonClass}`}
            >
              <span>Panel Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 1. Berita Utama & 2. 3 Kad Sorotan Berita Terkini */}
      {featuredArticle && (
        <div className="space-y-4">
          {/* Berita Utama Besar */}
          <article
            style={{ '--stagger': 0 } as React.CSSProperties}
            onClick={() => setSelectedArticle(featuredArticle)}
            className="animate-dashboard-card group relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/80 dark:hover:border-blue-500/70 overflow-hidden shadow-xs transition-colors duration-200 cursor-pointer"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6 relative min-h-[240px] sm:min-h-[280px] lg:min-h-[310px] lg:h-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <NewsImage
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[0.8125rem] font-semibold uppercase tracking-wider text-blue-200">
                    {featuredArticle.isPinned ? 'Berita Dipin Utama' : 'Berita Utama'} · {featuredArticle.category}
                  </div>
                  <div className="text-sm font-medium text-white/90 mt-0.5 tabular-nums">
                    {formatReadableDate(featuredArticle.publishedAt || featuredArticle.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-semibold tabular-nums ${roleTheme.accentTextClass}`}>
                    <span>{featuredArticle.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatReadableDate(featuredArticle.publishedAt || featuredArticle.updatedAt)}</span>
                    {isAdmin && featuredArticle.status === 'draft' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 dark:text-amber-400">Draf (Admin)</span>
                      </>
                    )}
                  </div>

                  <h2
                    title={featuredArticle.title}
                    className="font-display text-fluid-title font-black text-black dark:text-white tracking-tight text-balance kbelia-trim"
                  >
                    <AcronymText text={featuredArticle.title} />
                  </h2>

                  <p className="text-[0.9375rem] text-black/75 dark:text-white/75 leading-relaxed line-clamp-3 kbelia-prose">
                    <AcronymText text={featuredArticle.summary} />
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-700">
                  <span className={`py-2 px-4 text-sm inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}>
                    <span>Baca Artikel</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleAdminQuickPinToggle(e, featuredArticle)}
                        className={roleTheme.compactSecondaryButtonClass}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{featuredArticle.isPinned ? 'Nyahpin' : 'Pin'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleAdminQuickStatusToggle(e, featuredArticle)}
                        className={roleTheme.compactSecondaryButtonClass}
                      >
                        {featuredArticle.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{featuredArticle.status === 'published' ? 'Siar' : 'Draf'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>

          {/* 3 Kad Sorotan Berita Terkini */}
          {highlightArticles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
                  Sorotan Berita Terkini
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                {highlightArticles.map((article, idx) => (
                  <article
                    key={article.id}
                    style={{ '--stagger': idx + 1 } as React.CSSProperties}
                    onClick={() => setSelectedArticle(article)}
                    className="animate-dashboard-card group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/80 dark:hover:border-blue-500/70 shadow-2xs overflow-hidden transition-colors duration-200 cursor-pointer"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                      <NewsImage
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70 tabular-nums">
                          <span className={roleTheme.accentTextClass}>{article.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatReadableDate(article.publishedAt || article.updatedAt)}</span>
                          {isAdmin && article.status === 'draft' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 dark:text-amber-400">Draf</span>
                            </>
                          )}
                        </div>

                        <h3
                          title={article.title}
                          className="text-base font-bold text-black dark:text-white leading-snug kbelia-clamp-2 kbelia-trim"
                        >
                          <AcronymText text={article.title} />
                        </h3>

                        <p className="text-sm text-black/75 dark:text-white/75 leading-relaxed kbelia-clamp-2 kbelia-prose">
                          <AcronymText text={article.summary} />
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap ${roleTheme.accentTextClass}`}>
                          <span>Baca</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Direktori Penuh Berita dengan Bar Carian & Butang Penapis Bersepadu */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari tajuk berita atau ringkasan..."
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setSelectedCategory('Semua');
            setSortBy('date_desc');
            setAdminStatusView('all');
          }}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={(val) => setSortBy(val === 'date_asc' ? 'date_asc' : 'date_desc')}
          sortLabel="Susun Mengikut Tarikh"
          rightSlot={
            isAdmin ? (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-700">
                {([
                  { id: 'all', label: 'Semua' },
                  { id: 'published', label: 'Siar' },
                  { id: 'draft', label: 'Draf' }
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAdminStatusView(opt.id)}
                    className={`px-2.5 py-1 rounded-xl text-[0.8125rem] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      adminStatusView === opt.id
                        ? roleTheme.segmentedActiveClass
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : undefined
          }
          filterContent={
            <div>
              <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                Kategori Berita
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'Semua' | NewsCategory)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                {NEWS_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {filteredNews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Newspaper className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto" />
            <h3 className="text-base font-bold text-black dark:text-white">
              Tiada berita yang sepadan ditemui
            </h3>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'Semua'
                ? 'Cuba tukar kata kunci carian atau pilih kategori berita yang lain.'
                : 'Belum ada berita rasmi yang disiarkan oleh pihak Pentadbir buat masa ini.'}
            </p>
            {(searchQuery || selectedCategory !== 'Semua' || adminStatusView !== 'all' || sortBy !== 'date_desc') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                  setAdminStatusView('all');
                  setSortBy('date_desc');
                }}
                className={roleTheme.compactPrimaryButtonClass}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Set Semula</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
              {pagination.paginatedItems.map(article => (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="kbelia-table-row p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 overflow-hidden shrink-0">
                      <NewsImage
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3
                          title={article.title}
                          className="text-sm sm:text-base font-bold text-black dark:text-white kbelia-clamp-1 kbelia-trim"
                        >
                          <AcronymText text={article.title} />
                        </h3>
                        {article.isPinned && (
                          <span className="text-[0.8125rem] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                            · Utama
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                        <span className={`font-semibold ${roleTheme.accentTextClass}`}>{article.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 inline" />
                          {formatReadableDate(article.publishedAt || article.updatedAt)}
                        </span>
                        {isAdmin && article.status === 'draft' && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">Draf</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleAdminQuickPinToggle(e, article)}
                          className={roleTheme.iconButtonClass}
                          title={article.isPinned ? 'Nyahpin Berita' : 'Pin Berita Utama'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleAdminQuickStatusToggle(e, article)}
                          className={roleTheme.iconButtonClass}
                          title={article.status === 'published' ? 'Tukar kepada Draf' : 'Siarkan Berita'}
                        >
                          {article.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                    <span className={roleTheme.compactPrimaryButtonClass}>
                      <span>Baca</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel="berita"
            />
          </>
        )}
      </div>

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-slate-300 dark:border-zinc-600 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-black/70 dark:text-white/75 tabular-nums min-w-0">
                <span className="font-bold text-black dark:text-white/75">{selectedArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{formatReadableDate(selectedArticle.publishedAt || selectedArticle.updatedAt)}</span>
                {selectedArticle.status === 'draft' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-black dark:text-white/75">Draf Admin</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-xl border border-slate-300 dark:border-zinc-600 text-black/70 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
                aria-label="Tutup artikel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              <div className="space-y-2.5">
                <h2 className="font-display text-fluid-title font-black text-black dark:text-white tracking-tight text-balance kbelia-trim">
                  <AcronymText text={selectedArticle.title} />
                </h2>
              </div>

              <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600">
                <NewsImage src={selectedArticle.imageUrl} alt={selectedArticle.title} />
              </div>

              <p className="text-sm sm:text-base font-semibold text-black dark:text-white leading-relaxed border-b border-slate-300 dark:border-zinc-600 pb-5 kbelia-prose">
                <AcronymText text={selectedArticle.summary} />
              </p>

              <div className="space-y-4 text-sm text-black dark:text-white leading-relaxed kbelia-prose">
                {selectedArticle.content.split(/\n\s*\n/).map((para, idx) => (
                  <p key={idx} className="whitespace-pre-line">
                    <AcronymText text={para} />
                  </p>
                ))}
              </div>
            </div>

            <div className="px-5 sm:px-8 py-4 border-t border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArticle(null);
                    setShowAdminManagerModal(true);
                  }}
                  className={`px-4 py-2 text-sm ${roleTheme.secondaryButtonClass}`}
                >
                  Urus Artikel
                </button>
              ) : (
                <span className="text-sm text-black/70 dark:text-white/75">
                  Pengumuman rasmi Portal KBelia Negeri Kelantan
                </span>
              )}

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className={`px-5 py-2 text-sm ${roleTheme.primaryButtonClass}`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Direct News Management Modal */}
      {isAdmin && showAdminManagerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAdminManagerModal(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 shadow-2xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/70 dark:text-white/75">
                Pengurusan Berita Langsung (Admin)
              </span>
              <button
                type="button"
                onClick={() => setShowAdminManagerModal(false)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Tutup pengurusan berita"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AdminNewsManager
              newsItems={newsItems}
              onRefresh={onRefresh}
              compactHeader={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
