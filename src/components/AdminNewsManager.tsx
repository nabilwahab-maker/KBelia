import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Plus,
  Save,
  X,
  Send,
  ArrowUpDown
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
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';
import { getRoleTheme } from '../utils/roleTheme';

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
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

    if (sortPreset === 'table_column') {
      return [...filtered].sort((a, b) => {
        if (sortBy === 'title') {
          const cmp = a.title.localeCompare(b.title);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        if (sortBy === 'category') {
          const cmp = a.category.localeCompare(b.category);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const diff = new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        return sortDir === 'asc' ? -diff : diff;
      });
    }

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
  }, [newsItems, searchQuery, statusFilter, categoryFilter, pinnedFilter, sortPreset, sortBy, sortDir]);

  const newsPagination = usePagination(filteredList, 7, [
    searchQuery,
    statusFilter,
    categoryFilter,
    pinnedFilter,
    sortPreset,
    sortBy,
    sortDir,
    filteredList.length
  ]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (pinnedFilter !== 'all' ? 1 : 0) +
    (sortPreset !== DEFAULT_SORT_VALUE ? 1 : 0);

  const toggleSort = (col: 'date' | 'title' | 'category') => {
    setSortPreset('table_column');
    if (sortBy === col) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'date' ? 'desc' : 'asc');
    }
  };

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

  return (
    <div className="space-y-4 animate-dashboard-tab">
      {/* Header Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xs transition-colors ${adminTheme.surfaceClass}`}>
        <div className="space-y-1">
          <h3 className={`${compactHeader ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-extrabold text-black dark:text-white tracking-tight`}>
            Urus Berita &amp; Pengumuman
          </h3>
        </div>
      </div>

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

      {/* Admin News Table Card */}
      <div className={`rounded-2xl border backdrop-blur-xs overflow-visible transition-colors ${adminTheme.surfaceClass}`}>
        <ReferenceTableToolbar
          accent="amber"
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
          sortOptions={
            sortPreset === 'table_column'
              ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...newsSortOptions]
              : newsSortOptions
          }
          sortValue={sortPreset === 'table_column' ? '' : sortPreset}
          onSortChange={(val) => {
            if (val) setSortPreset(val);
          }}
          rightSlot={
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
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Status Penerbitan
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                  className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                >
                  <option value="all">Semua Status</option>
                  <option value="published">Disiar (Awam)</option>
                  <option value="draft">Draf (Admin Sahaja)</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Kategori
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as 'all' | NewsCategory)}
                  className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                >
                  <option value="all">Semua Kategori</option>
                  {NEWS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Sorotan Utama
                </label>
                <select
                  value={pinnedFilter}
                  onChange={(e) => setPinnedFilter(e.target.value as 'all' | 'pinned' | 'normal')}
                  className={`w-full px-3 py-2 rounded-xl text-sm cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                >
                  <option value="all">Semua Artikel</option>
                  <option value="pinned">Berita Utama Dipin</option>
                  <option value="normal">Artikel Biasa</option>
                </select>
              </div>
            </>
          }
        />

        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Newspaper className="w-8 h-8 text-black/35 dark:text-white/35 mx-auto" />
            <p className="text-sm font-bold text-black dark:text-white">Tiada artikel ditemui</p>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75">
              Cipta berita baharu atau ubah tapisan carian di atas.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer inline-flex items-center gap-1.5 ${adminTheme.primaryButtonClass}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Berita Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${adminTheme.surfaceMutedClass} border-b ${adminTheme.dividerClass}`}>
                  <th className="py-3 px-4 text-[0.8125rem] font-semibold text-black/60 dark:text-white/65">
                    <button
                      type="button"
                      onClick={() => toggleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      <span>Artikel Berita</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-[0.8125rem] font-semibold text-black/60 dark:text-white/65">
                    <button
                      type="button"
                      onClick={() => toggleSort('category')}
                      className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      <span>Kategori</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-[0.8125rem] font-semibold text-black/60 dark:text-white/65">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[0.8125rem] font-semibold text-black/60 dark:text-white/65">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      <span>Tarikh</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 w-14 text-right text-[0.8125rem] font-semibold text-black/60 dark:text-white/65">
                    <span className="sr-only">Tindakan</span>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${adminTheme.dividerClass} text-sm`}>
                {newsPagination.paginatedItems.map(item => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${adminTheme.rowHoverClass}`}
                  >
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
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
                        <div className="min-w-0">
                          <div className="font-bold text-black dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[0.8125rem] text-black/65 dark:text-white/65 truncate">
                            {item.summary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{item.category}</span>
                        {item.isPinned && (
                          <span className={`text-[0.8125rem] font-bold ${adminTheme.accentTextClass}`}>
                            · Utama
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[0.8125rem] font-bold ${
                          item.status === 'published'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'published' ? 'Disiar' : 'Draf'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-black/75 dark:text-white/75 whitespace-nowrap tabular-nums">
                      {formatDate(item.publishedAt || item.updatedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <RowActionMenu
                        ariaLabel={`Tindakan untuk ${item.title}`}
                        items={[
                          {
                            label: item.isPinned ? 'Nyahpin Berita Utama' : 'Pin Berita Utama',
                            onClick: () => handleQuickTogglePin(item)
                          },
                          {
                            label: item.status === 'published' ? 'Tukar kepada Draf' : 'Siarkan Sekarang',
                            onClick: () => handleQuickToggleStatus(item),
                            tone: 'accent'
                          },
                          {
                            label: 'Edit Artikel',
                            onClick: () => handleOpenEdit(item)
                          },
                          {
                            label: 'Padam Berita',
                            onClick: () =>
                              confirmDelete({
                                itemName: item.title,
                                itemType: 'Berita Portal',
                                onConfirm: () => handleDelete(item.id)
                              }),
                            tone: 'danger',
                            dividerBefore: true
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredList.length > 0 && (
          <PaginationBar
            currentPage={newsPagination.currentPage}
            totalItems={newsPagination.totalItems}
            itemsPerPage={7}
            onPageChange={newsPagination.setCurrentPage}
            itemLabel="artikel berita"
            accent="amber"
          />
        )}
      </div>
    </div>
  );
};
