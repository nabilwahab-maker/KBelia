import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  ArrowRight,
  CheckCircle2,
  X,
  XCircle,
  Clock,
  Star
} from 'lucide-react';
import { GrantApplication, YouthProgram } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { deleteProgram, saveProgram } from '../services/dataService';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveProgramImage } from '../utils/visualAssets';
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { EditProgramModal } from './EditProgramModal';
import {
  DEFAULT_SORT_VALUE,
  buildStandardSortOptions,
  parseNumericAmount,
  sortRecords
} from '../utils/sortUtils';

interface ProgramsSectionProps {
  programs: YouthProgram[];
  grantApplications?: GrantApplication[];
  onOpenGrantModal?: (title?: string, amount?: string) => void;
  onCancelGrant?: (grant: GrantApplication) => Promise<void> | void;
  onAddProgram?: () => void;
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
  programs = [],
  grantApplications = [],
  onOpenGrantModal,
  onCancelGrant,
  onAddProgram,
  onRefresh,
  isReadOnly = false
}) => {
  const { language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { confirmDelete } = useConfirmDelete();
  const isEn = language === 'en';
  const isAdminView = isAdmin || isReadOnly;

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [cancellingGrantId, setCancellingGrantId] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<YouthProgram | null>(null);

  const storageKey = `kbelia_program_registrations_${user?.uid || 'guest'}`;
  const [registeredIds, setRegisteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setRegisteredIds(saved ? JSON.parse(saved) : []);
    } catch {
      setRegisteredIds([]);
    }
  }, [storageKey]);

  const categoryOptions = [
    { key: 'Semua', label: isEn ? 'All Categories' : 'Semua Kategori' },
    { key: 'Geran & Dana', label: isEn ? 'Grants & Funding' : 'Geran & Dana' },
    { key: 'Bengkel & Latihan', label: isEn ? 'Workshops & Training' : 'Bengkel & Latihan' },
    { key: 'Pameran & Ekspo', label: isEn ? 'Expos & Exhibitions' : 'Pameran & Ekspo' },
    { key: 'Pitching & Inkubasi', label: isEn ? 'Pitching & Incubation' : 'Pitching & Inkubasi' }
  ];

  const sortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          {
            value: 'featured_first',
            label: isEn ? 'Featured First' : 'Pilihan Utama Dahulu'
          },
          {
            value: 'amount_desc',
            label: isEn ? 'Grant Amount (Highest)' : 'Nilai Bantuan (Tertinggi)'
          }
        ],
        isEn,
        {
          asc: isEn ? 'Title (A - Z)' : 'Tajuk (A - Z)',
          desc: isEn ? 'Title (Z - A)' : 'Tajuk (Z - A)'
        }
      ),
    [isEn]
  );

  const safePrograms = programs || [];

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = safePrograms.filter((p) => {
      if (!p) return false;
      if (selectedCategory !== 'Semua' && p.category !== selectedCategory) return false;
      if (featuredFilter === 'featured' && !p.isFeatured) return false;
      if (!q) return true;
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.organizer || '').toLowerCase().includes(q) ||
        (p.grantAmount || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });

    return sortRecords(matched, {
      sortBy,
      getName: (p) => p.title || '',
      customCompare: (a, b, mode) => {
        if (mode === 'featured_first') {
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        }
        if (mode === 'amount_desc') {
          return parseNumericAmount(b.grantAmount) - parseNumericAmount(a.grantAmount);
        }
        return null;
      }
    });
  }, [safePrograms, selectedCategory, featuredFilter, searchQuery, sortBy]);

  const pagination = usePagination(filteredPrograms, 7, [
    searchQuery,
    selectedCategory,
    featuredFilter,
    sortBy,
    filteredPrograms.length
  ]);

  const activeFilterCount =
    (selectedCategory !== 'Semua' ? 1 : 0) +
    (featuredFilter !== 'all' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setFeaturedFilter('all');
    setSortBy(DEFAULT_SORT_VALUE);
  };

  const handleToggleFeaturedProgram = async (prog: YouthProgram) => {
    const nextFeatured = !prog.isFeatured;
    try {
      await saveProgram({
        ...prog,
        isFeatured: nextFeatured
      });
      showToast({
        type: 'success',
        title: nextFeatured
          ? (isEn ? 'Marked as Featured' : 'Ditanda Pilihan Utama')
          : (isEn ? 'Removed from Featured' : 'Dinyah-tanda Pilihan Utama'),
        message: prog.title
      });
      onRefresh?.();
    } catch {
      showToast({
        type: 'error',
        title: isEn ? 'Update Failed' : 'Gagal Mengemas Kini',
        message: isEn ? 'Could not update featured status.' : 'Gagal mengemas kini status pilihan utama.'
      });
    }
  };

  const handleDeleteProgramConfirm = async (prog: YouthProgram) => {
    try {
      await deleteProgram(prog.id);
      showToast({
        type: 'info',
        title: isEn ? 'Program Deleted' : 'Program Dipadam',
        message: prog.title
      });
      onRefresh?.();
    } catch {
      showToast({
        type: 'error',
        title: isEn ? 'Delete Failed' : 'Gagal Memadam',
        message: isEn ? 'Could not delete the selected program.' : 'Gagal memadam rekod program.'
      });
    }
  };

  const handleProgramAction = (prog: YouthProgram) => {
    const isGrantScheme = prog.category === 'Geran & Dana';

    if (isGrantScheme) {
      if (onOpenGrantModal) {
        onOpenGrantModal(prog.title, prog.grantAmount || 'RM3,000');
        return;
      }
      showToast({
        type: 'info',
        title: isEn ? 'Sign In Required' : 'Log Masuk Diperlukan',
        message: isEn
          ? 'Please sign in to submit an official grant application.'
          : 'Sila log masuk untuk menghantar permohonan geran rasmi.'
      });
      return;
    }

    if (registeredIds.includes(prog.id)) {
      showToast({
        type: 'info',
        title: isEn ? 'Already Registered' : 'Telah Didaftarkan',
        message: isEn
          ? `Your registration for "${prog.title}" is already recorded.`
          : `Penyertaan anda untuk "${prog.title}" telah pun direkodkan.`
      });
      return;
    }

    const updated = [...registeredIds, prog.id];
    setRegisteredIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }

    const noticeMsg = isEn
      ? `Registration for "${prog.title}" recorded. Secretariat will send confirmation details before the event date.`
      : `Pendaftaran penyertaan "${prog.title}" berjaya direkodkan. Pihak Admin KBelia akan menghubungi anda sebelum tarikh program.`;
    setActiveNotice(noticeMsg);
    showToast({
      type: 'success',
      title: isEn ? 'Participation Recorded' : 'Penyertaan Direkodkan',
      message: prog.title
    });
  };

  const handleCancelProgramRegistration = (prog: YouthProgram) => {
    const updated = registeredIds.filter((id) => id !== prog.id);
    setRegisteredIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
    const noticeMsg = isEn
      ? `Your registration for "${prog.title}" has been cancelled.`
      : `Penyertaan anda untuk "${prog.title}" telah dibatalkan.`;
    setActiveNotice(noticeMsg);
    showToast({
      type: 'info',
      title: isEn ? 'Registration Cancelled' : 'Penyertaan Dibatalkan',
      message: prog.title
    });
  };

  const handleCancelGrantClick = async (grant: GrantApplication) => {
    if (!onCancelGrant || cancellingGrantId === grant.id) return;
    try {
      setCancellingGrantId(grant.id);
      await onCancelGrant(grant);
      setActiveNotice(
        isEn
          ? `Grant application "${grant.programTitle}" has been cancelled.`
          : `Permohonan geran "${grant.programTitle}" telah berjaya dibatalkan.`
      );
    } finally {
      setCancellingGrantId(null);
    }
  };

  const visibleGrants = (grantApplications || []).filter((g) => g && g.status !== 'cancelled');
  const pendingGrants = visibleGrants.filter((g) => g.status === 'pending');

  return (
    <div className="w-full space-y-4">
      {/* Notice Banner */}
      {activeNotice && (
        <div className="p-4 bg-white dark:bg-slate-800 text-black dark:text-white rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
            <span>{activeNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveNotice(null)}
            className="text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white p-1 cursor-pointer"
            aria-label={isEn ? 'Close notice' : 'Tutup notis'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
          {isEn ? 'Youth Grants & Programs' : 'Geran & Program Belia'}
        </h1>
      </div>

      {/* Active Grant Applications Status & Cancel Controls (Youth Only) */}
      {!isAdminView && visibleGrants.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden h-fit">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-600">
            <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isEn ? 'Your Grant Applications' : 'Permohonan Geran Anda'}</span>
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
            {visibleGrants.map((grant) => {
              const isPending = grant.status === 'pending';
              const isCancelling = cancellingGrantId === grant.id;
              return (
                <div
                  key={grant.id}
                  className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-300">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                          {grant.programTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[0.8125rem] font-bold border shrink-0 ${
                            grant.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border-emerald-300 dark:border-emerald-700'
                              : grant.status === 'rejected'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border-rose-300 dark:border-rose-700'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {grant.status === 'approved'
                            ? (isEn ? 'Approved' : 'Diluluskan')
                            : grant.status === 'rejected'
                            ? (isEn ? 'Rejected' : 'Ditolak')
                            : (isEn ? 'Pending' : 'Menunggu Semakan')}
                        </span>
                      </div>
                      <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                        {grant.businessName} · {grant.grantAmount || grant.amount}
                      </p>
                    </div>
                  </div>

                  {isPending && onCancelGrant && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCancelGrantClick(grant)}
                      className="px-3 py-2 rounded-lg text-[0.8125rem] font-bold text-black dark:text-white bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 self-end sm:self-center"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>
                        {isCancelling
                          ? (isEn ? 'Cancelling...' : 'Membatalkan...')
                          : (isEn ? 'Cancel Request' : 'Batal Permohonan')}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Programs List Card with Integrated Toolbar & Pagination */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            isEn
              ? 'Search program title, category or organizer...'
              : 'Cari tajuk program, kategori atau lokasi...'
          }
          filterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortLabel={isEn ? 'Sort By' : 'Susun Mengikut'}
          rightSlot={
            isAdminView && onAddProgram ? (
              <button
                type="button"
                onClick={onAddProgram}
                className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>{isEn ? 'Add Program' : 'Terbit Program'}</span>
              </button>
            ) : undefined
          }
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                  {isEn ? 'Program Category' : 'Kategori Program'}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold border text-left transition-colors cursor-pointer ${
                        selectedCategory === cat.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                  {isEn ? 'Highlight Status' : 'Status Pilihan'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: isEn ? 'All' : 'Semua' },
                    { id: 'featured', label: isEn ? 'Featured' : 'Pilihan Utama' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFeaturedFilter(opt.id as 'all' | 'featured')}
                      className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border transition-colors cursor-pointer ${
                        featuredFilter === opt.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
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

        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Award className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto" />
            <p className="text-sm font-bold text-black dark:text-white">
              {isEn
                ? 'No programs or grants match your current filters.'
                : 'Tiada program atau geran ditemui sepadan dengan carian atau penapis.'}
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleResetFilters();
                }}
                className="px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {isEn ? 'Reset Search & Filters' : 'Set Semula Carian & Penapis'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
              {pagination.paginatedItems.map((prog) => {
                const isGrant = prog.category === 'Geran & Dana';
                const isRegistered = !isGrant && registeredIds.includes(prog.id);
                const matchingPendingGrant = isGrant
                  ? pendingGrants.find(
                      (g) =>
                        g.programId === prog.id ||
                        g.programTitle.trim().toLowerCase() === prog.title.trim().toLowerCase()
                    )
                  : undefined;

                return (
                  <div
                    key={prog.id}
                    id={`program-card-${prog.id}`}
                    className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0">
                        <PortalImage
                          src={resolveProgramImage(prog)}
                          alt={prog.title}
                          fallbackType="program"
                          fallbackLabel={prog.category}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h3 className="font-bold text-black dark:text-white text-sm sm:text-base truncate">
                            {prog.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-slate-50 dark:bg-zinc-800 text-black dark:text-white border border-slate-200 dark:border-zinc-700 rounded-md text-[0.8125rem] font-semibold shrink-0">
                            {prog.category}
                          </span>
                          {prog.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md text-[0.8125rem] font-bold shrink-0">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{isEn ? 'Featured' : 'Pilihan Utama'}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                          {prog.grantAmount ? `${prog.grantAmount} · ` : ''}{prog.date} · {prog.location} · {prog.organizer}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      {isAdminView ? (
                        <RowActionMenu
                          ariaLabel={`Tindakan untuk ${prog.title}`}
                          items={[
                            {
                              label: isEn ? 'Edit Program' : 'Edit Program',
                              onClick: () => setEditingProgram(prog)
                            },
                            {
                              label: prog.isFeatured
                                ? (isEn ? 'Unmark Featured' : 'Nyah-tanda Utama')
                                : (isEn ? 'Mark Featured' : 'Tandakan Utama'),
                              tone: 'accent',
                              onClick: () => handleToggleFeaturedProgram(prog)
                            },
                            {
                              label: isEn ? 'Delete Program' : 'Padam Program',
                              tone: 'danger',
                              dividerBefore: true,
                              onClick: () =>
                                confirmDelete({
                                  itemName: prog.title,
                                  itemType: isEn ? 'Grant & Program' : 'Program & Geran',
                                  onConfirm: () => handleDeleteProgramConfirm(prog)
                                })
                            }
                          ]}
                        />
                      ) : matchingPendingGrant ? (
                        <div className="flex items-center gap-2">
                          <div className="py-2 px-3 bg-amber-50 dark:bg-amber-950/50 text-black dark:text-white border border-amber-300 dark:border-amber-700 rounded-lg text-[0.8125rem] font-bold inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{isEn ? 'Pending' : 'Disemak'}</span>
                          </div>
                          {onCancelGrant && (
                            <button
                              type="button"
                              disabled={cancellingGrantId === matchingPendingGrant.id}
                              onClick={() => handleCancelGrantClick(matchingPendingGrant)}
                              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-black dark:text-white border border-rose-300 dark:border-rose-700 rounded-lg text-[0.8125rem] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>
                                {cancellingGrantId === matchingPendingGrant.id
                                  ? (isEn ? 'Cancelling...' : 'Membatalkan...')
                                  : (isEn ? 'Cancel Request' : 'Batal Permohonan')}
                              </span>
                            </button>
                          )}
                        </div>
                      ) : isRegistered ? (
                        <div className="flex items-center gap-2">
                          <div className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 rounded-lg text-[0.8125rem] font-bold inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{isEn ? 'Registered' : 'Didaftarkan'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelProgramRegistration(prog)}
                            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-black dark:text-white border border-rose-300 dark:border-rose-700 rounded-lg text-[0.8125rem] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>{isEn ? 'Cancel Join' : 'Batal Penyertaan'}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleProgramAction(prog)}
                          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>
                            {isGrant
                              ? (isEn ? 'Apply Grant' : 'Mohon Geran')
                              : (isEn ? 'Join Program' : 'Daftar Program')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel={isEn ? 'programs' : 'program'}
              accent="blue"
            />
          </>
        )}
      </div>

      {/* Edit Program Modal (Admin) */}
      <EditProgramModal
        isOpen={Boolean(editingProgram)}
        program={editingProgram}
        onClose={() => setEditingProgram(null)}
        onSaved={(updated) => {
          setEditingProgram(null);
          showToast({
            type: 'success',
            title: isEn ? 'Program Updated' : 'Program Dikemas Kini',
            message: updated.title
          });
          onRefresh?.();
        }}
      />
    </div>
  );
};
