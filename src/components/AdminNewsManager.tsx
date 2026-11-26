import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Plus,
  Save,
  X,
  Send,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  Eye,
  FileEdit
} from 'lucide-react';
import { NewsCategory, NewsStatus, PortalNews } from '../types';
import { NEWS_CATEGORIES } from '../data/newsData';
import {
  savePortalNewsRecord,
  deletePortalNewsRecord
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { ImageDropzone } from './ImageDropzone';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';
import { getRoleTheme } from '../utils/roleTheme';
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

const adminTheme = getRoleTheme('admin');

interface AdminNewsManagerProps {
  newsItems: PortalNews[];
  onRefresh: () => void;
  compactHeader?: boolean;
}

export const AdminNewsManager: React.FC<AdminNewsManagerProps> = ({
  newsItems,
  onRefresh,
  compactHeader = false
}) => {
  const { user, userProfile, isAdmin } = useAuth();
  const { confirmDelete } = useConfirmDelete();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Pengumuman');
  const [status, setStatus] = useState<NewsStatus>('published');
  const [isPinned, setIsPinned] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notifyAllUsers, setNotifyAllUsers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | NewsCategory>('all');
  const [pinnedFilter, setPinnedFilter] = useState<'all' | 'pinned' | 'normal'>('all');
  const [sortPreset, setSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const newsSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'pinned_first', label: 'Sorotan Dipin Dahulu' },
          { value: 'status_published', label: 'Status (Disiar Dahulu)' },
          { value: 'category_asc', label: 'Kategori (A - Z)' }
        ],
        false,
        {
          asc: 'Tajuk Berita (A - Z)',
          desc: 'Tajuk Berita (Z - A)'
        }
      ),
    []
  );

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = newsItems.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (pinnedFilter === 'pinned' && !item.isPinned) return false;
      if (pinnedFilter === 'normal' && item.isPinned) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

    return sortRecords(filtered, {
      sortBy: sortPreset,
      getName: (item) => item.title || '',
      customCompare: (a, b, mode) => {
        if (mode === 'pinned_first') return (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1);
        if (mode === 'status_published') return (a.status === 'published' ? 0 : 1) - (b.status === 'published' ? 0 : 1);
        if (mode === 'category_asc') return compareText(a.category, b.category);
        return null;
      }
    });
  }, [newsItems, searchQuery, statusFilter, categoryFilter, pinnedFilter, sortPreset]);

  const newsPagination = usePagination(filteredList, 7, [
    searchQuery,
    statusFilter,
    categoryFilter,
    pinnedFilter,
    sortPreset,
    filteredList.length
  ]);

  const selectedNews = useMemo(
    () =>
      filteredList.find((item) => item.id === selectedNewsId) ||
      newsPagination.paginatedItems[0] ||
      filteredList[0] ||
      null,
    [filteredList, selectedNewsId, newsPagination.paginatedItems]
  );

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (pinnedFilter !== 'all' ? 1 : 0) +
    (sortPreset !== DEFAULT_SORT_VALUE ? 1 : 0);

  if (!isAdmin) return null;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Pengumuman');
    setStatus('published');
    setIsPinned(false);
    setSummary('');
    setContent('');
    setImageUrl('');
    setNotifyAllUsers(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (item: PortalNews) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setStatus(item.status);
    setIsPinned(item.isPinned);
    setSummary(item.summary);
    setContent(item.content);
    setImageUrl(item.imageUrl || '');
    setNotifyAllUsers(false);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      showToast('Sila lengkapkan tajuk, ringkasan, dan kandungan berita.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const existing = editingId ? newsItems.find(n => n.id === editingId) : undefined;
      const saved = await savePortalNewsRecord({
        id: editingId || undefined,
        title,
        summary,
        content,
        category,
        status,
        isPinned,
        imageUrl,
        authorId: user?.uid || 'admin',
        authorName: userProfile?.fullName || user?.displayName || 'Pentadbir KBelia',
        publishedAt: existing?.publishedAt,
        createdAt: existing?.createdAt
      });

      if (saved.status === 'published' && notifyAllUsers) {
        emitAdminOrMentorNotification({
          title: `Berita Baharu: ${saved.title}`,
          message: saved.summary,
          sender: saved.authorName,
          senderRole: 'admin',
          targetRole: 'all',
          actionTab: 'news'
        });
      }

      showToast(
        editingId
          ? 'Berita berjaya dikemaskini.'
          : saved.status === 'published'
          ? 'Berita baharu telah disiarkan kepada semua pengguna.'
          : 'Berita disimpan sebagai draf pentadbir.',
        'success'
      );
      setShowForm(false);
      resetForm();
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan berita. Sila cuba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleStatus = async (item: PortalNews) => {
    const nextStatus: NewsStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await savePortalNewsRecord({
        ...item,
        status: nextStatus
      });
      showToast(
        nextStatus === 'published'
          ? 'Berita kini disiarkan kepada semua pengguna.'
          : 'Berita ditukar kepada Draf (Admin sahaja).',
        'success'
      );
      onRefresh();
    } catch {
      showToast('Gagal mengemaskini status berita.', 'error');
    }
  };

  const handleQuickTogglePin = async (item: PortalNews) => {
    try {
      await savePortalNewsRecord({
        ...item,
        isPinned: !item.isPinned
      });
      showToast(
        !item.isPinned ? 'Berita dipin sebagai Berita Utama.' : 'Berita dinyahpin dari sorotan utama.',
        'info'
      );
      onRefresh();
    } catch {
      showToast('Gagal mengubah status pin berita.', 'error');
    }
  };

  const handleDelete = async (newsId: string) => {
    try {
      await deletePortalNewsRecord(newsId);
      if (editingId === newsId) {
        setShowForm(false);
        resetForm();
      }
      showToast('Berita telah dipadam.', 'success');
      onRefresh();
    } catch {
      showToast('Gagal memadam berita.', 'error');
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'Belum disiar';
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

  const hasActiveFilters = Boolean(searchQuery.trim() || activeFilterCount > 0);

  return (
    <div className="space-y-4 animate-dashboard-tab">
      <WorkspaceHeaderCard
        role="admin"
        icon={<Newspaper className="w-5 h-5" />}
        title={<span className={compactHeader ? 'text-base sm:text-lg' : ''}>Urus Berita &amp; Pengumuman</span>}
        subtitle="Terbitkan berita, hebahan rasmi, dan sorotan utama portal belia."
        rightActions={
          <button
            id="btn-admin-add-news"
            type="button"
            onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${adminTheme.primaryButtonClass}`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Tutup Borang' : 'Tambah Berita Baharu'}</span>
          </button>
        }
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari tajuk atau kategori..."
        filterCount={activeFilterCount}
        onResetFilters={() => {
          setStatusFilter('all');
          setCategoryFilter('all');
          setPinnedFilter('all');
          setSortPreset(DEFAULT_SORT_VALUE);
        }}
        sortOptions={newsSortOptions}
        sortValue={sortPreset}
        onSortChange={setSortPreset}
        filterContent={
          <>
            <div>
              <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Status Siaran
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'published', label: 'Disiar' },
                    { id: 'draft', label: 'Draf' }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt.id);
                      setMobilePreviewOpen(false);
                    }}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                      statusFilter === opt.id
                        ? adminTheme.activeMiniBtnClass
                        : adminTheme.secondaryButtonClass
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Kategori Berita
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | NewsCategory)}
                className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
              >
                <option value="all">Semua Kategori</option>
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Sorotan
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'pinned', label: 'Dipin' },
                    { id: 'normal', label: 'Biasa' }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPinnedFilter(opt.id)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                      pinnedFilter === opt.id
                        ? adminTheme.activeMiniBtnClass
                        : adminTheme.secondaryButtonClass
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        }
      />

      {/* Create / Edit News Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl border backdrop-blur-xs overflow-hidden animate-dashboard-tab ${adminTheme.surfaceClass}`}
        >
          <div className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
            <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2">
              <Newspaper className={`w-4 h-4 ${adminTheme.accentTextClass}`} />
              <span>{editingId ? 'Edit Artikel Berita' : 'Tambah Berita & Pengumuman'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
              aria-label="Tutup borang"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Tajuk Berita <span className="text-black dark:text-white">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan tajuk berita"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-semibold focus:outline-none ${adminTheme.inputClass}`}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NewsCategory)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                >
                  {NEWS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Status Penerbitan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NewsStatus)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                >
                  <option value="published">Siar (Semua Pengguna)</option>
                  <option value="draft">Draf (Admin Sahaja)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                Ringkasan Berita <span className="text-black dark:text-white">*</span>
              </label>
              <textarea
                rows={2}
                required
                maxLength={500}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Masukkan ringkasan berita"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] focus:outline-none ${adminTheme.inputClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                Kandungan Berita <span className="text-black dark:text-white">*</span>
              </label>
              <textarea
                rows={6}
                required
                maxLength={8000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Masukkan kandungan berita"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] leading-relaxed focus:outline-none ${adminTheme.inputClass}`}
              />
            </div>

            <ImageDropzone
              label="Gambar Berita"
              value={imageUrl}
              onChange={(val) => setImageUrl(val)}
              aspectRatio="16:9"
            />

            {/* Controls: Pin & Broadcast Notification */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t ${adminTheme.dividerClass}`}>
              <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-[#9A5628] focus:ring-[#D98A4E]/30"
                />
                <span>Pin sebagai Berita Utama di bahagian atas halaman Berita</span>
              </label>

              {status === 'published' && (
                <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAllUsers}
                    onChange={(e) => setNotifyAllUsers(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-[#9A5628] focus:ring-[#D98A4E]/30"
                  />
                  <span>Hantar notifikasi hebahan kepada Belia &amp; Mentor</span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer ${adminTheme.primaryButtonClass}`}
              >
                {status === 'published' ? <Send className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>
                  {saving
                    ? 'Menyimpan...'
                    : editingId
                    ? 'Simpan Perubahan'
                    : status === 'published'
                    ? 'Siarkan Berita'
                    : 'Simpan Draf'}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {filteredList.length === 0 ? (
        <div className={`rounded-2xl border backdrop-blur-xs p-10 text-center space-y-3 ${adminTheme.surfaceClass}`}>
          <Newspaper className="w-8 h-8 text-black/35 dark:text-white/35 mx-auto" />
          <p className="text-sm font-bold text-black dark:text-white kbelia-trim">Tiada artikel ditemui</p>
          <p className="text-xs sm:text-sm text-black/70 dark:text-white/75">
            Cipta berita baharu atau ubah tapisan carian di atas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPinnedFilter('all');
                  setSortPreset(DEFAULT_SORT_VALUE);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                Set Semula Penapis
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreate}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer inline-flex items-center gap-1.5 ${adminTheme.primaryButtonClass}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Berita Pertama</span>
            </button>
          </div>
        </div>
      ) : (
        <GoogleWorkspaceSplitPane
          role="admin"
          mobileOpen={mobilePreviewOpen && Boolean(selectedNews)}
          onMobileClose={() => setMobilePreviewOpen(false)}
          mobileTitle={selectedNews?.title}
          leftHeader={
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-black/65 dark:text-white/70 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <span>{filteredList.length} artikel dipaparkan</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setPinnedFilter('all');
                    setSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                >
                  Set Semula
                </button>
              )}
            </div>
          }
          leftContent={newsPagination.paginatedItems.map((item) => {
            const isSelected = selectedNews?.id === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedNewsId(item.id);
                  setMobilePreviewOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNewsId(item.id);
                    setMobilePreviewOpen(true);
                  }
                }}
                className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                }`}
              >
                <div className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/55 dark:text-white/60">
                      <Newspaper className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-black dark:text-white leading-snug line-clamp-2 kbelia-trim">
                      {item.title}
                    </p>
                    <span
                      className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-lg ${
                        item.status === 'published'
                          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.status === 'published' ? 'Disiar' : 'Draf'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-black/65 dark:text-white/65">
                    <span>{item.category}</span>
                    {item.isPinned && (
                      <span className={`font-bold inline-flex items-center gap-1 ${adminTheme.accentTextClass}`}>
                        · <Pin className="w-3 h-3" /> Utama
                      </span>
                    )}
                    <span className="tabular-nums">· {formatDate(item.publishedAt || item.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          leftFooter={
            <PaginationBar
              currentPage={newsPagination.currentPage}
              totalItems={newsPagination.totalItems}
              itemsPerPage={7}
              onPageChange={newsPagination.setCurrentPage}
              itemLabel="artikel"
              accent="amber"
            />
          }
          rightContent={
            selectedNews ? (
              <div>
                <SidePreviewHeader
                  role="admin"
                  title={selectedNews.title}
                  status={
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        selectedNews.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {selectedNews.status === 'published' ? 'Disiar' : 'Draf'}
                    </span>
                  }
                  subtitle={selectedNews.category}
                  meta={
                    <>
                      <span>Oleh {selectedNews.authorName || 'Pentadbir KBelia'}</span>
                      <span>·</span>
                      <span className="tabular-nums">{formatDate(selectedNews.publishedAt || selectedNews.updatedAt)}</span>
                      {selectedNews.isPinned && (
                        <>
                          <span>·</span>
                          <span className={`font-bold ${adminTheme.accentTextClass}`}>Berita Utama Dipin</span>
                        </>
                      )}
                    </>
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickTogglePin(selectedNews)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                      >
                        {selectedNews.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        <span>{selectedNews.isPinned ? 'Nyahpin' : 'Pin Utama'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickToggleStatus(selectedNews)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                      >
                        {selectedNews.status === 'published' ? <FileEdit className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{selectedNews.status === 'published' ? 'Jadikan Draf' : 'Siarkan'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(selectedNews)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemName: selectedNews.title,
                            itemType: 'Berita Portal',
                            onConfirm: () => handleDelete(selectedNews.id)
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </>
                  }
                />

                <div className="p-4 sm:p-5 space-y-4">
                  {selectedNews.imageUrl && (
                    <div className={`w-full h-48 sm:h-56 rounded-xl overflow-hidden border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <img
                        src={selectedNews.imageUrl}
                        alt={selectedNews.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <SidePreviewMetricsStrip
                    role="admin"
                    columns={3}
                    items={[
                      { label: 'Kategori', value: selectedNews.category },
                      { label: 'Sorotan Utama', value: selectedNews.isPinned ? 'Dipin di Atas' : 'Artikel Biasa', accent: selectedNews.isPinned },
                      { label: 'Tarikh Kemas Kini', value: formatDate(selectedNews.publishedAt || selectedNews.updatedAt) }
                    ]}
                  />

                  <div className={`p-3.5 rounded-xl border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1">
                      Ringkasan Berita
                    </span>
                    <p className="text-sm font-medium text-black/85 dark:text-white/90 leading-relaxed kbelia-prose">
                      {selectedNews.summary}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${adminTheme.surfaceClass} ${adminTheme.dividerClass}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-2">
                      Kandungan Penuh
                    </span>
                    <div className="text-sm text-black/85 dark:text-white/90 leading-relaxed whitespace-pre-line kbelia-prose">
                      {selectedNews.content}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <SidePreviewEmptyState
                icon={<Newspaper className="w-10 h-10" />}
                title="Tiada Artikel Dipilih"
                description="Kandungan berita dan tetapan siaran akan dipaparkan di sini."
              />
            )
          }
        />
      )}
    </div>
  );
};
