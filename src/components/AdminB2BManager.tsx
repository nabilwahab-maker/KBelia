import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Search,
  MapPin,
  MessageCircle,
  Sparkles,
  X,
  Save
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

    const recompute = () => {
      const deletedSet = new Set(getDeletedIds());
      const localItems = loadLocalB2B();
      const prodAuth = isProductionAuthenticated();
      const lists = prodAuth
        ? [firestoreItems, demoSyncItems, localItems, INITIAL_B2B_LISTINGS]
        : [demoSyncItems, localItems, firestoreItems, INITIAL_B2B_LISTINGS];
      const merged = mergeUniqueById<B2BListing>(lists).filter((x) => !deletedSet.has(x.id));
      setListings(merged);
    };

    recompute();

    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'b2b') {
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

    const unsubDemo = subscribeDemoSyncCollection<B2BListing>('b2b', (items) => {
      demoSyncItems = items;
      recompute();
    });

    return () => {
      unsubCrossTab();
      unsubFirestore();
      unsubDemo();
    };
  }, [user?.uid, isDemoSession]);

  const stats = useMemo(() => {
    const supply = listings.filter((l) => l.type === 'supply').length;
    const demand = listings.filter((l) => l.type === 'demand').length;
    const withImage = listings.filter((l) => Boolean(resolveB2BImage(l))).length;
    return { total: listings.length, supply, demand, withImage };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.authorBusiness.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [listings, searchQuery, filterType]);

  const b2bPagination = usePagination(filteredListings, 5, [
    searchQuery,
    filterType,
    filteredListings.length
  ]);

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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white/75">
            <Megaphone className="w-4 h-4" />
            <span>Kawalan Iklan Bergambar Pentadbir</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
            Pengurusan Ruang Niaga &amp; Iklan Bekalan
          </h3>
          <p className="text-xs text-black dark:text-white/75 max-w-2xl leading-relaxed">
            Tambah iklan baharu beserta gambar produk, semak pratonton langsung kad iklan, atau kemas kini paparan Ruang Niaga usahawan belia.
          </p>
        </div>

        <button
          id="btn-admin-add-b2b"
          type="button"
          onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-auto"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Tutup Borang' : 'Tambah Iklan Bergambar'}</span>
        </button>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
          <div className="text-xs text-black/70 dark:text-white/75 font-medium">Jumlah Iklan</div>
          <div className="text-xl font-black text-black dark:text-white tabular-nums mt-0.5">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
          <div className="text-xs text-black/70 dark:text-white/75 font-medium">Tawaran Bekalan</div>
          <div className="text-xl font-black text-black dark:text-white tabular-nums mt-0.5">{stats.supply}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
          <div className="text-xs text-black/70 dark:text-white/75 font-medium">Permintaan Belia</div>
          <div className="text-xl font-black text-black dark:text-white tabular-nums mt-0.5">{stats.demand}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600">
          <div className="text-xs text-black/70 dark:text-white/75 font-medium">Iklan Bergambar</div>
          <div className="text-xl font-black text-black dark:text-white tabular-nums mt-0.5">{stats.withImage}</div>
        </div>
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
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-black dark:text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
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
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  Jenis Iklan
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setType('supply')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
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
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
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
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  Tajuk Iklan <span className="text-black/70 dark:text-white/75">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth. Pembekal Pes Sambal & Kopi Sangai Kiosk Belia"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                    Nama Perniagaan / Pembekal <span className="text-black/70 dark:text-white/75">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={authorBusiness}
                    onChange={(e) => setAuthorBusiness(e.target.value)}
                    placeholder="cth. Aroma Dapur Pantai"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                    Jajahan Operasi
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                    Nama Wakil / Pegawai
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Nama penyiar"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                    Nombor WhatsApp <span className="text-black/70 dark:text-white/75">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                  Penerangan Terperinci
                </label>
                <textarea
                  rows={3}
                  maxLength={1500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nyatakan kuantiti bekalan, harga anggaran borong, atau syarat penghantaran..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
                />
              </div>

              <ImageDropzone
                label="Muat Naik Gambar Iklan / Produk"
                sublabel="Heret & lepas gambar atau klik untuk pilih dari peranti anda (JPG, PNG, WebP). Gambar dimampatkan secara automatik."
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
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 text-xs font-semibold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving
                      ? 'Menyimpan...'
                      : editingId
                        ? 'Simpan Perubahan'
                        : 'Siarkan ke Ruang Niaga'}
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

      {/* Search & Type Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-300 dark:border-zinc-600">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tajuk iklan, perniagaan, atau jajahan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-600 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-600 self-start sm:self-auto">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'supply', label: 'Membekal' },
            { id: 'demand', label: 'Mencari' }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-2xs'
                  : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Existing Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-300 dark:border-zinc-600 py-14 text-center">
          <Megaphone className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-3" />
          <p className="text-sm font-bold text-black dark:text-white">
            Tiada iklan Ruang Niaga sepadan dengan carian anda
          </p>
        </div>
      ) : (
        <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {b2bPagination.paginatedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-300 dark:border-zinc-600 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-4/3 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden border-b border-slate-300 dark:border-zinc-700">
                  <PortalImage
                    src={resolveB2BImage(item)}
                    alt={item.title}
                    fallbackType="b2b"
                    fallbackLabel={item.authorBusiness}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        item.type === 'supply'
                          ? 'bg-emerald-50 text-black border-emerald-200 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-900/40'
                          : 'bg-amber-50 text-black border-amber-200 dark:bg-amber-950/50 dark:text-white dark:border-amber-800/40'
                      }`}
                    >
                      {item.type === 'supply' ? 'Membekal (Tawaran)' : 'Mencari Bekalan'}
                    </span>
                    <span className="text-[11px] text-black/70 dark:text-white/75 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-black dark:text-white leading-snug">
                      {item.title}
                    </h4>
                    <div className="text-[11px] text-black/70 dark:text-white/75 font-medium mt-0.5">
                      <span className="font-semibold text-black dark:text-white">{item.authorBusiness}</span>
                      <span> · </span>
                      <span>{item.authorName}</span>
                    </div>
                  </div>

                  <p className="text-xs text-black/80 dark:text-white/80 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-black/70 dark:text-white/75 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {item.district}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      +{item.whatsapp}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800 text-black dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <PaginationBar
          currentPage={b2bPagination.currentPage}
          totalItems={b2bPagination.totalItems}
          itemsPerPage={5}
          onPageChange={b2bPagination.setCurrentPage}
          itemLabel="iklan"
          accent="teal"
        />
        </div>
      )}
    </div>
  );
};
