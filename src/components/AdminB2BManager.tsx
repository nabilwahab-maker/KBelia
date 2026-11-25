import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone,
  Plus,
  Sparkles,
  X,
  Save,
  Edit3,
  Trash2,
  Phone
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
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedB2BId, setSelectedB2BId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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

  const b2bSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'supply_first', label: 'Jenis Iklan (Membekal Dahulu)' },
          { value: 'demand_first', label: 'Jenis Iklan (Mencari Dahulu)' },
          { value: 'district_asc', label: 'Daerah (A - Z)' }
        ],
        false,
        {
          asc: 'Tajuk Iklan (A - Z)',
          desc: 'Tajuk Iklan (Z - A)'
        }
      ),
    []
  );

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

    return sortRecords(filtered, {
      sortBy,
      getName: (item) => item.title || item.authorBusiness || '',
      customCompare: (a, b, mode) => {
        if (mode === 'supply_first') return (a.type === 'supply' ? 0 : 1) - (b.type === 'supply' ? 0 : 1);
        if (mode === 'demand_first') return (a.type === 'demand' ? 0 : 1) - (b.type === 'demand' ? 0 : 1);
        if (mode === 'district_asc') return compareText(a.district, b.district);
        return null;
      }
    });
  }, [listings, searchQuery, filterType, districtFilter, sortBy]);

  const b2bPagination = usePagination(filteredListings, 7, [
    searchQuery,
    filterType,
    districtFilter,
    sortBy,
    filteredListings.length
  ]);

  const typeCounts = useMemo(
    () => ({
      all: listings.length,
      supply: listings.filter((l) => l.type === 'supply').length,
      demand: listings.filter((l) => l.type === 'demand').length
    }),
    [listings]
  );

  const selectedListing = useMemo(
    () =>
      filteredListings.find((item) => item.id === selectedB2BId) ||
      b2bPagination.paginatedItems[0] ||
      filteredListings[0] ||
      null,
    [filteredListings, selectedB2BId, b2bPagination.paginatedItems]
  );

  const activeFilterCount =
    (filterType !== 'all' ? 1 : 0) +
    (districtFilter !== 'Semua' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

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

  const hasActiveFilters = Boolean(searchQuery.trim() || activeFilterCount > 0);

  return (
    <div className="space-y-4 animate-dashboard-tab">
      <WorkspaceHeaderCard
        role="admin"
        icon={<Megaphone className="w-5 h-5" />}
        title="Pengurusan Ruang Niaga & Iklan Bekalan"
        subtitle="Pantau tawaran bekalan bahan mentah serta permintaan niaga usahawan belia."
        rightActions={
          <button
            id="btn-admin-add-b2b"
            type="button"
            onClick={showForm ? () => setShowForm(false) : handleOpenCreate}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${adminTheme.primaryButtonClass}`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Tutup' : 'Tambah'}</span>
          </button>
        }
        tabs={[
          { id: 'all', label: 'Semua', count: typeCounts.all },
          { id: 'supply', label: 'Membekal', count: typeCounts.supply },
          { id: 'demand', label: 'Mencari', count: typeCounts.demand }
        ]}
        activeTab={filterType}
        onTabChange={(id) => {
          setFilterType(id as 'all' | 'supply' | 'demand');
          setMobilePreviewOpen(false);
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari iklan, syarikat atau daerah..."
        extraControls={
          <>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              aria-label="Tapis daerah iklan"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
            >
              <option value="Semua">Semua Daerah</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Susun iklan ruang niaga"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
            >
              {b2bSortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </>
        }
      />

      {/* Create / Edit Form with Live Card Preview */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl border backdrop-blur-xs overflow-hidden animate-dashboard-tab ${adminTheme.surfaceClass}`}
        >
          <div className={`px-4 sm:px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
            <h4 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2">
              <Megaphone className={`w-4 h-4 ${adminTheme.accentTextClass}`} />
              <span>{editingId ? 'Edit Iklan Ruang Niaga' : 'Cipta Iklan Ruang Niaga Bergambar'}</span>
            </h4>

            <div className="flex items-center gap-2">
              {!editingId && (
                <button
                  type="button"
                  onClick={handleApplySampleTemplate}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${adminTheme.accentTextClass}`} />
                  <span>Contoh</span>
                </button>
              )}
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
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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
                        ? `${adminTheme.segmentedActiveClass} border-transparent`
                        : adminTheme.secondaryButtonClass
                    }`}
                  >
                    Membekal (Tawaran)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('demand')}
                    className={`py-2 px-3 text-sm font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                      type === 'demand'
                        ? `${adminTheme.segmentedActiveClass} border-transparent`
                        : adminTheme.secondaryButtonClass
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
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold focus:outline-none ${adminTheme.inputClass}`}
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
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                    Daerah
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold focus:outline-none ${adminTheme.inputClass}`}
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
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
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
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
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
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm resize-none focus:outline-none ${adminTheme.inputClass}`}
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
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer ${adminTheme.primaryButtonClass}`}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saving
                      ? 'Menyimpan...'
                      : editingId
                        ? 'Simpan'
                        : 'Siar'}
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

      {filteredListings.length === 0 ? (
        <div className={`rounded-2xl border backdrop-blur-xs py-14 px-6 text-center space-y-2 ${adminTheme.surfaceClass}`}>
          <Megaphone className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
          <p className="text-sm font-bold text-black dark:text-white kbelia-trim">
            Tiada iklan Ruang Niaga sepadan dengan carian anda
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setDistrictFilter('Semua');
                setSortBy(DEFAULT_SORT_VALUE);
              }}
              className={`mt-1 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
            >
              Set Semula
            </button>
          )}
        </div>
      ) : (
        <GoogleWorkspaceSplitPane
          role="admin"
          mobileOpen={mobilePreviewOpen && Boolean(selectedListing)}
          onMobileClose={() => setMobilePreviewOpen(false)}
          mobileTitle={selectedListing?.title}
          leftHeader={
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-black/65 dark:text-white/70 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <span>{filteredListings.length} iklan dipaparkan</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setDistrictFilter('Semua');
                    setSortBy(DEFAULT_SORT_VALUE);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                >
                  Set Semula
                </button>
              )}
            </div>
          }
          leftContent={b2bPagination.paginatedItems.map((item) => {
            const isSelected = selectedListing?.id === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedB2BId(item.id);
                  setMobilePreviewOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedB2BId(item.id);
                    setMobilePreviewOpen(true);
                  }
                }}
                className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                }`}
              >
                <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                  <PortalImage
                    src={resolveB2BImage(item)}
                    alt={item.title}
                    fallbackType="b2b"
                    fallbackLabel={item.authorBusiness}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-black dark:text-white leading-snug line-clamp-2 kbelia-trim">
                      {item.title}
                    </p>
                    <span
                      className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-lg ${
                        item.type === 'supply'
                          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[#9A5628]/12 text-[#9A5628] dark:bg-[#D98A4E]/15 dark:text-[#D98A4E]'
                      }`}
                    >
                      {item.type === 'supply' ? 'Membekal' : 'Mencari'}
                    </span>
                  </div>
                  <div className="text-xs text-black/65 dark:text-white/65 truncate">
                    {item.authorBusiness} · {item.district} · {item.date}
                  </div>
                </div>
              </div>
            );
          })}
          leftFooter={
            <PaginationBar
              currentPage={b2bPagination.currentPage}
              totalItems={b2bPagination.totalItems}
              itemsPerPage={7}
              onPageChange={b2bPagination.setCurrentPage}
              itemLabel="iklan"
              accent="amber"
            />
          }
          rightContent={
            selectedListing ? (
              <div>
                <SidePreviewHeader
                  role="admin"
                  title={selectedListing.title}
                  status={
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        selectedListing.type === 'supply'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[#9A5628]/15 text-[#9A5628] dark:bg-[#D98A4E]/20 dark:text-[#D98A4E]'
                      }`}
                    >
                      {selectedListing.type === 'supply' ? 'Membekal' : 'Mencari'}
                    </span>
                  }
                  subtitle={selectedListing.authorBusiness}
                  meta={
                    <>
                      <span>{selectedListing.authorName}</span>
                      <span>·</span>
                      <span>{selectedListing.district}</span>
                      <span>·</span>
                      <span>{selectedListing.date}</span>
                    </>
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(selectedListing)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Iklan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedListing)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam Iklan</span>
                      </button>
                    </>
                  }
                />

                <div className="p-4 sm:p-5 space-y-4">
                  <div className={`w-full h-48 sm:h-56 rounded-xl overflow-hidden border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <PortalImage
                      src={resolveB2BImage(selectedListing)}
                      alt={selectedListing.title}
                      fallbackType="b2b"
                      fallbackLabel={selectedListing.authorBusiness}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <SidePreviewMetricsStrip
                    role="admin"
                    columns={3}
                    items={[
                      { label: 'Wakil Perniagaan', value: selectedListing.authorName || '-' },
                      { label: 'Daerah', value: selectedListing.district },
                      {
                        label: 'WhatsApp Hubungan',
                        value: (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5" />+{selectedListing.whatsapp}
                          </span>
                        ),
                        accent: true
                      }
                    ]}
                  />

                  <div className={`p-4 rounded-xl border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1.5">
                      Keterangan Iklan
                    </span>
                    <p className="text-sm text-black/85 dark:text-white/90 leading-relaxed whitespace-pre-line kbelia-prose">
                      {selectedListing.description || 'Tiada keterangan tambahan disertakan.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <SidePreviewEmptyState
                icon={<Megaphone className="w-10 h-10" />}
                title="Pilih iklan Ruang Niaga"
                description="Klik mana-mana iklan di sebelah kiri untuk melihat butiran penuh serta tindakan suntingan."
              />
            )
          }
        />
      )}
    </div>
  );
};
