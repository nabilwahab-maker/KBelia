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

  const stats = useMemo(() => {
    const published = newsItems.filter(n => n.status === 'published').length;
    const draft = newsItems.filter(n => n.status === 'draft').length;
    const pinned = newsItems.filter(n => n.isPinned).length;
    return { total: newsItems.length, published, draft, pinned };
  }, [newsItems]);

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
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-300 dark:border-zinc-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wider text-black dark:text-white/75">
            <Newspaper className="w-4 h-4" />
            <span>Kawalan Berita Pentadbir</span>
          </div>
          <h3 className={`${compactHeader ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-extrabold text-black dark:text-white tracking-tight`}>
            Urus Berita &amp; Pengumuman
          </h3>
          <p className="text-[0.9375rem] text-black dark:text-white/75 max-w-2xl leading-relaxed">
            Tambah, edit, pin berita utama atau kawal status siaran. Hanya berita berstatus Siar dipaparkan kepada Usahawan Belia dan Mentor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="btn-admin-add-news"
            type="button"
            onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 dark:bg-blue-600"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Tutup Borang' : 'Tambah Berita Baharu'}</span>
          </button>
        </div>
      </div>

      {/* Compact Stats Row (Single-elevation, Tabular numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 h-fit">
          <div className="text-sm text-black/70 dark:text-white/75 font-medium">Jumlah Artikel</div>
          <div className="text-xl font-black text-black dark:text-white tabular-nums mt-0.5">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 h-fit">
          <div className="text-sm text-black/70 dark:text-white/75 font-medium">Sedang Disiar</div>
          <div className="text-xl font-black text-black dark:text-white/75 tabular-nums mt-0.5">{stats.published}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 h-fit">
          <div className="text-sm text-black/70 dark:text-white/75 font-medium">Draf Admin</div>
          <div className="text-xl font-black text-black dark:text-white/75 tabular-nums mt-0.5">{stats.draft}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 h-fit">
          <div className="text-sm text-black/70 dark:text-white/75 font-medium">Berita Utama Dipin</div>
          <div className="text-xl font-black text-black dark:text-white/75 tabular-nums mt-0.5">{stats.pinned}</div>
        </div>
      </div>

      {/* Create / Edit News Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 shadow-xs overflow-hidden animate-in fade-in duration-150"
        >
          <div className="px-5 py-4 border-b border-slate-300 dark:border-zinc-600 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
            <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-black dark:text-white/75" />
              <span>{editingId ? 'Edit Artikel Berita' : 'Tambah Berita & Pengumuman'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
              aria-label="Tutup borang"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 font-semibold dark:focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NewsCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer dark:focus:border-blue-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer dark:focus:border-blue-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 leading-relaxed dark:focus:border-blue-500"
              />
            </div>

            <ImageDropzone
              label="Gambar Berita"
              value={imageUrl}
              onChange={(val) => setImageUrl(val)}
              aspectRatio="16:9"
            />

            {/* Controls: Pin & Broadcast Notification */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-slate-300 dark:border-zinc-600">
              <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30"
                />
                <span>Pin sebagai Berita Utama di bahagian atas halaman News</span>
              </label>

              {status === 'published' && (
                <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAllUsers}
                    onChange={(e) => setNotifyAllUsers(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-black dark:text-white focus:ring-blue-500/30"
                  />
                  <span>Hantar notifikasi hebahan kepada Belia & Mentor</span>
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
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 text-sm font-semibold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer dark:bg-blue-600"
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari tajuk, ringkasan atau kategori..."
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
          filterContent={
            <>
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Status Penerbitan
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="published">Disiar (Awam)</option>
                  <option value="draft">Draf (Admin Sahaja)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Kategori
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as 'all' | NewsCategory)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">Semua Kategori</option>
                  {NEWS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Sorotan Utama
                </label>
                <select
                  value={pinnedFilter}
                  onChange={(e) => setPinnedFilter(e.target.value as 'all' | 'pinned' | 'normal')}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer inline-flex items-center gap-1.5 dark:bg-blue-600"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Berita Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                  <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                    <button
                      type="button"
                      onClick={() => toggleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      <span>Artikel Berita</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                    <button
                      type="button"
                      onClick={() => toggleSort('category')}
                      className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      <span>Kategori</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                    Status
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      <span>Tarikh</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                    <span className="sr-only">Tindakan</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
                {newsPagination.paginatedItems.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700">
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
                          <div className="text-xs text-black/65 dark:text-white/65 truncate">
                            {item.summary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{item.category}</span>
                        {item.isPinned && (
                          <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                            Utama
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          item.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
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
            accent="blue"
          />
        )}
      </div>
    </div>
  );
};
