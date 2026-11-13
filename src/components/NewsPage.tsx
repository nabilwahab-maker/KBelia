import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Search,
  ArrowRight,
  SlidersHorizontal,
  X,
  Pin,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { NewsCategory, PortalNews } from '../types';
import { NEWS_CATEGORIES } from '../data/newsData';
import { AdminNewsManager } from './AdminNewsManager';
import { savePortalNewsRecord } from '../services/dataService';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';

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
        <span className="text-[11px] font-semibold text-black dark:text-white line-clamp-2 max-w-[180px]">
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
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | NewsCategory>('Semua');
  const [adminStatusView, setAdminStatusView] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedArticle, setSelectedArticle] = useState<PortalNews | null>(null);
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);

  // Strict role-based visibility: non-admins ONLY see published news
  const roleScopedNews = useMemo(() => {
    const base = isAdmin
      ? newsItems.filter(item => adminStatusView === 'all' || item.status === adminStatusView)
      : newsItems.filter(item => item.status === 'published');

    return [...base].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const dateA = new Date(a.publishedAt || a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [newsItems, isAdmin, adminStatusView]);

  const filteredNews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return roleScopedNews.filter(item => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q)
      );
    });
  }, [roleScopedNews, selectedCategory, searchQuery]);

  // Spotlight the top pinned article when viewing unfiltered or matching current filter
  const featuredArticle = useMemo(() => {
    return filteredNews.find(item => item.isPinned) || null;
  }, [filteredNews]);

  const gridArticles = useMemo(() => {
    if (!featuredArticle) return filteredNews;
    return filteredNews.filter(item => item.id !== featuredArticle.id);
  }, [filteredNews, featuredArticle]);

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
    <div className="space-y-6">
      {/* Page Intro & Admin Controls */}
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
            <Newspaper className="w-4 h-4" />
            <span>Warta & Pengumuman Rasmi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight text-balance">
            Berita Terkini Ekosistem KBelia Kelantan
          </h1>
          <p className="text-xs sm:text-sm text-black dark:text-white max-w-2xl leading-relaxed">
            Ikuti hebahan rasmi geran perniagaan, pembukaan kapsul niaga, jadual karnival dan perkembangan terkini yang diterbitkan oleh pihak Pentadbir.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-news-open-admin-manager"
              type="button"
              onClick={() => setShowAdminManagerModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 dark:bg-blue-600"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Urus & Tambah Berita</span>
            </button>
            {onOpenAdminNewsTab && (
              <button
                type="button"
                onClick={onOpenAdminNewsTab}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Buka di Panel Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tajuk berita, geran, kapsul atau nama penulis..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 transition-all dark:focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Kosongkan carian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Admin-only Status View Filter */}
            {isAdmin && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/80 dark:border-zinc-800">
                {([
                  { id: 'all', label: 'Semua' },
                  { id: 'published', label: 'Siar' },
                  { id: 'draft', label: 'Draf' }
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAdminStatusView(opt.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      adminStatusView === opt.id
                        ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-2xs'
                        : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <span className="text-xs font-medium text-black/70 dark:text-white/75 tabular-nums whitespace-nowrap">
              {filteredNews.length} berita dipaparkan
            </span>
          </div>
        </div>

        {/* Category Filter Segmented Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(['Semua', ...NEWS_CATEGORIES] as const).map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs dark:bg-blue-600'
                    : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredNews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-3">
          <Newspaper className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto" />
          <h3 className="text-base font-bold text-black dark:text-white">
            Tiada berita yang sepadan ditemui
          </h3>
          <p className="text-xs text-black/70 dark:text-white/75 max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedCategory !== 'Semua'
              ? 'Cuba tukar kata kunci carian atau pilih kategori berita yang lain.'
              : 'Belum ada berita rasmi yang disiarkan oleh pihak Pentadbir buat masa ini.'}
          </p>
          {(searchQuery || selectedCategory !== 'Semua' || adminStatusView !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
                setAdminStatusView('all');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer dark:bg-blue-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set Semula Tapisan</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Featured / Pinned Spotlight Card */}
          {featuredArticle && (
            <article
              onClick={() => setSelectedArticle(featuredArticle)}
              className="group rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 overflow-hidden shadow-xs hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-colors cursor-pointer grid grid-cols-1 lg:grid-cols-12 items-stretch"
            >
              <div className="lg:col-span-6 relative aspect-16/10 lg:aspect-auto lg:min-h-[300px] bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <NewsImage
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs font-semibold text-white/95">
                  <span>Berita Utama</span>
                  <span className="tabular-nums">{formatReadableDate(featuredArticle.publishedAt || featuredArticle.updatedAt)}</span>
                </div>
              </div>

              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  {/* Unboxed inline metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-black/70 dark:text-white/75 tabular-nums">
                    <span className="font-bold text-black dark:text-white/75">{featuredArticle.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatReadableDate(featuredArticle.publishedAt || featuredArticle.updatedAt)}</span>
                    {isAdmin && featuredArticle.status === 'draft' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-black dark:text-white/75">Draf (Admin)</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight text-balance group-hover:text-black dark:group-hover:text-white transition-colors">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-sm text-black dark:text-white leading-relaxed line-clamp-4">
                    {featuredArticle.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-zinc-800">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-black dark:text-white/75 group-hover:translate-x-0.5 transition-transform">
                    <span>Baca Artikel Penuh</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleAdminQuickPinToggle(e, featuredArticle)}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pin className="w-3 h-3" />
                        <span>Nyahpin</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleAdminQuickStatusToggle(e, featuredArticle)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-black dark:text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {featuredArticle.status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{featuredArticle.status === 'published' ? 'Siar' : 'Draf'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )}

          {/* Grid of Regular Articles */}
          {gridArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {gridArticles.map(article => (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col justify-between hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="aspect-16/9 bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                      <NewsImage
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {isAdmin && article.status === 'draft' && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-950/85 text-white text-[11px] font-bold">
                          Draf Admin
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2.5">
                      {/* Unboxed inline metadata (Zero-pill discipline) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-black/70 dark:text-white/75 tabular-nums">
                        <span className="font-semibold text-black dark:text-white/75">{article.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatReadableDate(article.publishedAt || article.updatedAt)}</span>
                      </div>

                      <h3 className="text-base font-bold text-black dark:text-white leading-snug line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {article.title}
                      </h3>

                      <p className="text-xs text-black dark:text-white/75 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                    <span className="text-black/70 dark:text-white/75 truncate">
                      {article.authorName}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleAdminQuickPinToggle(e, article)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                            title={article.isPinned ? 'Nyahpin Berita' : 'Pin Berita Utama'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleAdminQuickStatusToggle(e, article)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
                            title={article.status === 'published' ? 'Tukar kepada Draf' : 'Siarkan Berita'}
                          >
                            {article.status === 'published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                      <span className="inline-flex items-center gap-1 font-bold text-black dark:text-white/75 whitespace-nowrap">
                        <span>Baca</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-black/70 dark:text-white/75 tabular-nums min-w-0">
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
                className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-black/70 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
                aria-label="Tutup artikel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              <div className="space-y-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight text-balance leading-snug">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-black/70 dark:text-white/75">
                  Diterbitkan oleh <span className="font-semibold text-black dark:text-white">{selectedArticle.authorName}</span>
                </p>
              </div>

              <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800">
                <NewsImage src={selectedArticle.imageUrl} alt={selectedArticle.title} />
              </div>

              <p className="text-sm sm:text-base font-semibold text-black dark:text-white leading-relaxed border-b border-slate-200 dark:border-zinc-800 pb-5">
                {selectedArticle.summary}
              </p>

              <div className="space-y-4 text-sm text-black dark:text-white leading-relaxed">
                {selectedArticle.content.split(/\n\s*\n/).map((para, idx) => (
                  <p key={idx} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            <div className="px-5 sm:px-8 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 flex flex-wrap items-center justify-between gap-3">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArticle(null);
                    setShowAdminManagerModal(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white text-xs font-bold cursor-pointer"
                >
                  Urus Artikel di Panel Admin
                </button>
              ) : (
                <span className="text-xs text-black/70 dark:text-white/75">
                  Hebahan rasmi Portal KBelia Negeri Kelantan
                </span>
              )}

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer dark:bg-blue-600"
              >
                Tutup Bacaan
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
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/75">
                Pengurusan Berita Langsung (Admin)
              </span>
              <button
                type="button"
                onClick={() => setShowAdminManagerModal(false)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
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
