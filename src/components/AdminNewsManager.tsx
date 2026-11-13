import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Plus,
  Edit3,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  Save,
  X,
  CheckCircle2,
  Send
} from 'lucide-react';
import { NewsCategory, NewsStatus, PortalNews } from '../types';
import { NEWS_CATEGORIES, NEWS_IMAGE_PRESETS } from '../data/newsData';
import {
  savePortalNewsRecord,
  deletePortalNewsRecord,
  restoreDefaultDemoNews
} from '../services/dataService';
import { emitAdminOrMentorNotification } from '../services/notificationStore';
import { ImageDropzone } from './ImageDropzone';
import { showToast } from './ToastNotification';
import { useAuth } from '../context/AuthContext';

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

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Pengumuman');
  const [status, setStatus] = useState<NewsStatus>('published');
  const [isPinned, setIsPinned] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(NEWS_IMAGE_PRESETS[0].url);
  const [notifyAllUsers, setNotifyAllUsers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isAdmin) return null;

  const stats = useMemo(() => {
    const published = newsItems.filter(n => n.status === 'published').length;
    const draft = newsItems.filter(n => n.status === 'draft').length;
    const pinned = newsItems.filter(n => n.isPinned).length;
    return { total: newsItems.length, published, draft, pinned };
  }, [newsItems]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return newsItems
      .filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [newsItems, searchQuery, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Pengumuman');
    setStatus('published');
    setIsPinned(false);
    setSummary('');
    setContent('');
    setImageUrl(NEWS_IMAGE_PRESETS[0].url);
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
    setImageUrl(item.imageUrl || NEWS_IMAGE_PRESETS[0].url);
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
      setConfirmDeleteId(null);
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

  const handleRestoreDemo = async () => {
    try {
      await restoreDefaultDemoNews();
      showToast('Set berita demo asal berjaya dipulihkan.', 'success');
      onRefresh();
    } catch {
      showToast('Gagal memulihkan berita demo.', 'error');
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
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            <Newspaper className="w-4 h-4" />
            <span>Kawalan Berita Pentadbir</span>
          </div>
          <h3 className={`${compactHeader ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-extrabold text-slate-900 dark:text-white tracking-tight`}>
            Pengurusan Berita & Hebahan Rasmi
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Tambah, sunting, pin berita utama atau kawal status siaran. Hanya berita berstatus Siar dipaparkan kepada Usahawan Belia dan Mentor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRestoreDemo}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Pulihkan Berita Demo</span>
          </button>

          <button
            id="btn-admin-add-news"
            type="button"
            onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Tutup Borang' : 'Tambah Berita Baharu'}</span>
          </button>
        </div>
      </div>

      {/* Compact Stats Row (Single-elevation, Tabular numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Jumlah Artikel</div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Sedang Disiar</div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">{stats.published}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Draf Admin</div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">{stats.draft}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Berita Utama Dipin</div>
          <div className="text-xl font-black text-sky-700 dark:text-sky-400 tabular-nums mt-0.5">{stats.pinned}</div>
        </div>
      </div>

      {/* Create / Edit News Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden animate-in fade-in duration-150"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-950/60">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{editingId ? 'Sunting Artikel Berita' : 'Cipta Berita & Pengumuman Baharu'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
              aria-label="Tutup borang"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                  Tajuk Berita <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth. Pembukaan Permohonan Geran Pemangkin Belia Fasa 2"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NewsCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                >
                  {NEWS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                  Status Penerbitan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NewsStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                >
                  <option value="published">Siar (Semua Pengguna)</option>
                  <option value="draft">Draf (Admin Sahaja)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Ringkasan Berita <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                maxLength={500}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ringkasan pendek untuk pratonton kad dan sorotan berita..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                Isi Kandungan Penuh <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                required
                maxLength={8000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis maklumat lengkap, tarikh penting, syarat kelayakan, dan langkah tindakan pengguna..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed"
              />
            </div>

            {/* Cover Image Selection */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Pilih Gambar Muka Depan Pantas atau Muat Naik Sendiri
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Klik mana-mana gambar pratetap di bawah untuk memilih
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {NEWS_IMAGE_PRESETS.map(preset => {
                  const selected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`group rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-sky-600 ring-2 ring-sky-500/30'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-sky-400'
                      }`}
                    >
                      <div className="aspect-16/10 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 truncate bg-white dark:bg-zinc-900">
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <ImageDropzone
                label="Atau Muat Naik Gambar Tersendiri"
                value={imageUrl}
                onChange={(val) => setImageUrl(val)}
                aspectRatio="16:9"
              />
            </div>

            {/* Controls: Pin & Broadcast Notification */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Pin sebagai Berita Utama di bahagian atas halaman News</span>
              </label>

              {status === 'published' && (
                <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAllUsers}
                    onChange={(e) => setNotifyAllUsers(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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

      {/* Search & Status Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tajuk, ringkasan atau kategori berita..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/80 dark:border-zinc-800 self-start sm:self-auto">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'published', label: 'Disiar' },
            { id: 'draft', label: 'Draf' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin News List */}
      {filteredList.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
          <Newspaper className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">Tiada artikel ditemui</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Cipta berita baharu atau pulihkan set berita demo asal untuk mula mengurus kandungan.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Berita Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Newspaper className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
                    <span className="font-semibold text-sky-700 dark:text-sky-400">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className={item.status === 'published' ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-amber-700 dark:text-amber-400 font-semibold'}>
                      {item.status === 'published' ? 'Disiar' : 'Draf (Admin)'}
                    </span>
                    {item.isPinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-sky-700 dark:text-sky-300 font-semibold">Berita Utama Dipin</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(item.publishedAt || item.updatedAt)}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2">
                    {item.summary}
                  </p>
                </div>
              </div>

              {/* Admin Action Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickTogglePin(item)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    item.isPinned
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-sky-50 dark:hover:bg-zinc-800'
                  }`}
                  title={item.isPinned ? 'Nyahpin Berita Utama' : 'Pin sebagai Berita Utama'}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{item.isPinned ? 'Dipin' : 'Pin'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickToggleStatus(item)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    item.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-amber-50 hover:text-amber-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                  title={item.status === 'published' ? 'Tukar kepada Draf' : 'Siarkan Sekarang'}
                >
                  {item.status === 'published' ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Siar</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Draf</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sunting</span>
                </button>

                {confirmDeleteId === item.id ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sahkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
                    title="Padam Berita"
                    aria-label="Padam berita"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
