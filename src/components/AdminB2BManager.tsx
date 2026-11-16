import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone,
  Plus,
  Sparkles,
  X,
  Save,
  ArrowUpDown
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { B2BListing, KelantanDistrict } from '../types';
import { INITIAL_B2B_LISTINGS } from '../data/b2bData';
import { db } from '../lib/firebase';
import {
  deleteB2BListingRecord,
  getDeletedIds,
  isProductionAuthenticated,
  saveB2BListingRecord
} from '../services/dataService';
import {
  mergeUniqueById,
  subscribeCrossTabSync,
  subscribeDemoSyncCollection
} from '../services/realtimeSync';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { ImageDropzone } from './ImageDropzone';
import { PortalImage } from './PortalImage';
import { B2BAdPreviewCard } from './B2BAdPreviewCard';
import { b2bKopiSangaiImg, resolveB2BImage } from '../utils/visualAssets';
import { showToast } from './ToastNotification';
import { PaginationBar, usePagination } from './PaginationBar';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';

const DISTRICTS: KelantanDistrict[] = [
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

export const AdminB2BManager: React.FC = () => {
  const { user, userProfile, isAdmin, isDemoSession } = useAuth();
  const { confirmDelete } = useConfirmDelete();

  const [listings, setListings] = useState<B2BListing[]>(INITIAL_B2B_LISTINGS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'supply' | 'demand'>('supply');
  const [authorBusiness, setAuthorBusiness] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [district, setDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'supply' | 'demand'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('Semua');
  const [sortConfig, setSortConfig] = useState<{
    key: 'title' | 'type' | 'district' | 'date';
    dir: 'asc' | 'desc';
  }>({ key: 'date', dir: 'desc' });

  useEffect(() => {
    const loadLocalB2B = (): B2BListing[] => {
      try {
        const saved = localStorage.getItem('kbelia_b2b_listings');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    };

    let firestoreItems: B2BListing[] = [];
    let demoSyncItems: B2BListing[] = [];
    let demoDeletedIds: string[] = [];

    const recompute = () => {
      const deleted = [...getDeletedIds(), ...demoDeletedIds];
      const localItems = loadLocalB2B();
      const prodAuth = isProductionAuthenticated();
      const lists = prodAuth
        ? [firestoreItems, demoSyncItems, localItems, INITIAL_B2B_LISTINGS]
        : [demoSyncItems, localItems, firestoreItems, INITIAL_B2B_LISTINGS];
      const merged = mergeUniqueById<B2BListing>(lists, deleted);
      setListings(merged);
    };

    recompute();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'b2b' || entity === 'deleted') {
        recompute();
      }
    });

    const unsubFirestore = onSnapshot(
      collection(db, 'b2b_listings'),
      (snap) => {
        const remote: B2BListing[] = [];
        snap.forEach((docSnap) => remote.push({ id: docSnap.id, ...docSnap.data() } as B2BListing));
        firestoreItems = remote;
        recompute();
      },
      () => {
        recompute();
      }
    );

    const unsubDemo = subscribeDemoSyncCollection<B2BListing>('b2b', (items, delIds) => {
      demoSyncItems = items;
      demoDeletedIds = delIds;
      recompute();
    });

    return () => {
      unsubCrossTab();
      unsubFirestore();
      unsubDemo();
    };
  }, [user?.uid, isDemoSession]);

  const toggleSort = (key: 'title' | 'type' | 'district' | 'date') => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = listings.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (districtFilter !== 'Semua' && item.district !== districtFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.authorBusiness.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

    const dirMult = sortConfig.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortConfig.key === 'title') {
        return a.title.localeCompare(b.title) * dirMult;
      }
      if (sortConfig.key === 'type') {
        return a.type.localeCompare(b.type) * dirMult;
      }
      if (sortConfig.key === 'district') {
        return (a.district || '').localeCompare(b.district || '') * dirMult;
      }
      return (a.date || '').localeCompare(b.date || '') * dirMult;
    });
  }, [listings, searchQuery, filterType, districtFilter, sortConfig]);

  const b2bPagination = usePagination(filteredListings, 7, [
    searchQuery,
    filterType,
    districtFilter,
    sortConfig.key,
    sortConfig.dir,
    filteredListings.length
  ]);

  const activeFilterCount = (filterType !== 'all' ? 1 : 0) + (districtFilter !== 'Semua' ? 1 : 0);

  if (!isAdmin) return null;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setType('supply');
    setAuthorBusiness('');
    setAuthorName(userProfile?.fullName || 'Urusetia KBelia');
    setDistrict('Kota Bharu');
    setWhatsapp('01123456789');
    setDescription('');
    setImageUrl('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (item: B2BListing) => {
    setEditingId(item.id);
    setTitle(item.title);
    setType(item.type);
    setAuthorBusiness(item.authorBusiness);
    setAuthorName(item.authorName);
    setDistrict(item.district || 'Kota Bharu');
    setWhatsapp(item.whatsapp || '');
    setDescription(item.description || '');
    setImageUrl(item.imageUrl || '');
    setShowForm(true);
  };

  const handleApplySampleTemplate = () => {
    setType('supply');
    setTitle('Pembekal Biji Kopi Sangai Segar & Pek Kiosk Belia');
    setAuthorBusiness('Koperasi Kopi Pantai Timur');
    setAuthorName(userProfile?.fullName || 'Urusetia Ruang Niaga');
    setDistrict('Kota Bharu');
    setWhatsapp('0123456789');
    setDescription(
      'Menyediakan bekalan borong biji kopi sangai tempatan (1kg–20kg/minggu) dengan harga istimewa usahawan kiosk belia serta penghantaran sekitar Kelantan.'
    );
    setImageUrl(b2bKopiSangaiImg);
    showToast('Contoh iklan bergambar diisikan pada borang & pratonton.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authorBusiness.trim() || !whatsapp.trim()) {
      showToast('Sila lengkapkan tajuk iklan, nama perniagaan, dan nombor WhatsApp.', 'warning');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      showToast('Sila masukkan nombor WhatsApp yang sah.', 'error');
      return;
    }

    setSaving(true);
    const formattedWhatsapp = cleanPhone.startsWith('60')
      ? cleanPhone
      : `60${cleanPhone.replace(/^0/, '')}`;

    const existing = editingId ? listings.find((l) => l.id === editingId) : undefined;
    const item: B2BListing = {
      id: editingId || `b2b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ownerId: existing?.ownerId || user?.uid || 'admin',
      authorName: authorName.trim() || userProfile?.fullName || 'Urusetia KBelia',
      authorBusiness: authorBusiness.trim(),
      district,
      type,
      title: title.trim(),
      description: description.trim(),
      whatsapp: formattedWhatsapp,
      imageUrl: imageUrl.trim(),
      date: existing?.date || 'Hari ini'
    };

    try {
      const saved = await saveB2BListingRecord(item);
      setListings((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
      showToast(
        editingId
          ? 'Iklan Ruang Niaga berjaya dikemas kini.'
          : 'Iklan bergambar baharu berjaya diterbitkan ke Ruang Niaga.',
        'success'
      );
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan iklan Ruang Niaga.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: B2BListing) => {
    confirmDelete({
      itemName: item.title,
      itemType: 'Iklan Ruang Niaga',
      onConfirm: async () => {
        try {
          await deleteB2BListingRecord(item.id);
          setListings((prev) => prev.filter((x) => x.id !== item.id));
          if (editingId === item.id) {
            setShowForm(false);
            resetForm();
          }
          showToast('Iklan Ruang Niaga berjaya dipadam.', 'success');
        } catch {
          showToast('Gagal memadam iklan Ruang Niaga.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-300 dark:border-zinc-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wider text-black dark:text-white/75">
            <Megaphone className="w-4 h-4" />
            <span>Kawalan Iklan Bergambar Pentadbir</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
            Pengurusan Ruang Niaga &amp; Iklan Bekalan
          </h3>
          <p className="text-[0.9375rem] text-black dark:text-white/75 max-w-2xl leading-relaxed">
            Tambah iklan baharu beserta gambar produk, semak pratonton langsung kad iklan, atau kemas kini paparan Ruang Niaga usahawan belia.
          </p>
        </div>

        <button
          id="btn-admin-add-b2b"
          type="button"
          onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-auto"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Tutup Borang' : 'Tambah Iklan Bergambar'}</span>
        </button>
      </div>

      {/* Create / Edit Form with Live Card Preview */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 shadow-xs overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-300 dark:border-zinc-600 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-950">
            <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{editingId ? 'Edit Iklan Ruang Niaga' : 'Cipta Iklan Ruang Niaga Bergambar'}</span>
            </h4>

            <div className="flex items-center gap-2">
              {!editingId && (
                <button
                  type="button"
                  onClick={handleApplySampleTemplate}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-black dark:text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Isi Contoh Iklan</span>
                </button>
              )}
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
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Fields + Image Dropzone */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Jenis Iklan
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setType('supply')}
                    className={`py-2 px-3 text-sm font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                      type === 'supply'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-black border-slate-300 dark:bg-zinc-950 dark:text-white/75 dark:border-zinc-600'
                    }`}
                  >
                    Membekal (Tawaran)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('demand')}
                    className={`py-2 px-3 text-sm font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                      type === 'demand'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-black border-slate-300 dark:bg-zinc-950 dark:text-white/75 dark:border-zinc-600'
                    }`}
                  >
                    Mencari Bekalan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Tajuk Iklan <span className="text-black dark:text-white">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan tajuk iklan"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Nama Perniagaan <span className="text-black dark:text-white">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={authorBusiness}
                    onChange={(e) => setAuthorBusiness(e.target.value)}
                    placeholder="Masukkan nama perniagaan"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Daerah
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Nama Wakil
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Masukkan nama wakil"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Nombor Telefon <span className="text-black dark:text-white">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Masukkan nombor telefon"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Keterangan Iklan
                </label>
                <textarea
                  rows={3}
                  maxLength={1500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan keterangan iklan"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                />
              </div>

              <ImageDropzone
                label="Gambar Iklan"
                value={imageUrl}
                onChange={setImageUrl}
                aspectRatio="landscape"
              />

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
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving
                      ? 'Menyimpan...'
                      : editingId
                        ? 'Simpan Perubahan'
                        : 'Siar Iklan'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Preview & Visual Composition Guide */}
            <div className="lg:col-span-5 lg:sticky lg:top-4">
              <B2BAdPreviewCard
                type={type}
                title={title}
                authorBusiness={authorBusiness}
                authorName={authorName}
                district={district}
                description={description}
                imageUrl={imageUrl}
              />
            </div>
          </div>
        </form>
      )}

      {/* Unified Reference Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari iklan, perniagaan atau daerah..."
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setFilterType('all');
            setDistrictFilter('Semua');
          }}
          filterContent={
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                  Jenis Iklan
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'all', label: 'Semua' },
                    { id: 'supply', label: 'Membekal' },
                    { id: 'demand', label: 'Mencari' }
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilterType(opt.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        filterType === opt.id
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65 mb-1.5">
                  Daerah
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="Semua">Semua Daerah</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        {filteredListings.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <Megaphone className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
            <p className="text-sm font-bold text-black dark:text-white">
              Tiada iklan Ruang Niaga sepadan dengan carian anda
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setDistrictFilter('Semua');
                }}
                className="mt-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Set Semula Carian &amp; Penapis
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                    <th className="py-3 pl-5 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('title')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Iklan</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('type')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Jenis</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('district')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Perniagaan &amp; Daerah</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('date')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Hubungi &amp; Tarikh</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 pl-2 pr-5 w-12 text-right">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                  {b2bPagination.paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-3 min-w-[210px]">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-950 overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700">
                            <PortalImage
                              src={resolveB2BImage(item)}
                              alt={item.title}
                              fallbackType="b2b"
                              fallbackLabel={item.authorBusiness}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-black dark:text-white truncate max-w-[250px]">
                              {item.title}
                            </p>
                            <p className="text-xs text-black/60 dark:text-white/65 truncate max-w-[250px]">
                              {item.authorName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            item.type === 'supply'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                          }`}
                        >
                          {item.type === 'supply' ? 'Membekal' : 'Mencari'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-black dark:text-white whitespace-nowrap">
                          {item.authorBusiness}
                        </p>
                        <p className="text-xs text-black/60 dark:text-white/65 whitespace-nowrap">
                          {item.district}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                        <p className="font-mono text-xs text-black dark:text-white">+{item.whatsapp}</p>
                        <p className="text-xs text-black/60 dark:text-white/65">{item.date}</p>
                      </td>
                      <td className="py-3.5 pl-2 pr-5 text-right">
                        <RowActionMenu
                          ariaLabel={`Tindakan untuk ${item.title}`}
                          items={[
                            {
                              label: 'Edit Iklan',
                              onClick: () => handleOpenEdit(item)
                            },
                            {
                              label: 'Padam Iklan',
                              tone: 'danger',
                              dividerBefore: true,
                              onClick: () => handleDelete(item)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={b2bPagination.currentPage}
              totalItems={b2bPagination.totalItems}
              itemsPerPage={7}
              onPageChange={b2bPagination.setCurrentPage}
              itemLabel="iklan"
              accent="blue"
            />
          </>
        )}
      </div>
    </div>
  );
};
