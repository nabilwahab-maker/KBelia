import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  X,
  XCircle
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
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';

interface ProgramsSectionProps {
  programs: YouthProgram[];
  grantApplications?: GrantApplication[];
  onOpenGrantModal?: (title?: string, amount?: string) => void;
  onCancelGrant?: (grant: GrantApplication) => Promise<void> | void;
  onAddProgram?: () => void;
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

const ITEMS_PER_PAGE = 6;

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
  const { user, isAdmin, isMentor } = useAuth();
  const { confirmDelete } = useConfirmDelete();
  const isEn = language === 'en';
  const isAdminView = isAdmin || isReadOnly;
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [cancellingGrantId, setCancellingGrantId] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<YouthProgram | null>(null);
  const [detailProgram, setDetailProgram] = useState<YouthProgram | null>(null);

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

  useEffect(() => {
    if (!detailProgram) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailProgram(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detailProgram]);

  const categoryOptions = useMemo(
    () => [
      { key: 'Semua', label: isEn ? 'All Categories' : 'Semua Kategori' },
      { key: 'Geran & Dana', label: isEn ? 'Grants & Funding' : 'Geran & Dana' },
      { key: 'Bengkel & Latihan', label: isEn ? 'Workshops & Training' : 'Bengkel & Latihan' },
      { key: 'Pameran & Ekspo', label: isEn ? 'Expos & Exhibitions' : 'Pameran & Ekspo' },
      { key: 'Pitching & Inkubasi', label: isEn ? 'Pitching & Incubation' : 'Pitching & Inkubasi' }
    ],
    [isEn]
  );

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

  const spotlightProgram = useMemo(() => {
    if (safePrograms.length === 0) return null;
    return safePrograms.find((p) => p?.isFeatured) || safePrograms[0];
  }, [safePrograms]);

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

  const pagination = usePagination(filteredPrograms, ITEMS_PER_PAGE, [
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
      if (detailProgram?.id === prog.id) {
        setDetailProgram(null);
      }
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

  const getProgramStatus = (prog: YouthProgram) => {
    const isGrant = prog.category === 'Geran & Dana';
    const isRegistered = !isGrant && registeredIds.includes(prog.id);
    const matchingPendingGrant = isGrant
      ? pendingGrants.find(
          (g) =>
            g.programId === prog.id ||
            g.programTitle.trim().toLowerCase() === prog.title.trim().toLowerCase()
        )
      : undefined;
    return { isGrant, isRegistered, matchingPendingGrant };
  };

  const renderProgramActionControls = (
    prog: YouthProgram,
    variant: 'card' | 'spotlight' | 'modal' = 'card'
  ) => {
    const { isGrant, isRegistered, matchingPendingGrant } = getProgramStatus(prog);

    if (isAdminView) {
      if (variant === 'modal') {
        return (
          <button
            type="button"
            onClick={() => {
              setDetailProgram(null);
              setEditingProgram(prog);
            }}
            className={`py-2 px-4 text-sm inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
          >
            <span>{isEn ? 'Edit' : 'Sunting'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        );
      }

      return (
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
      );
    }

    if (matchingPendingGrant) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="py-1.5 px-2.5 bg-amber-50 dark:bg-amber-950/50 text-black dark:text-white border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{isEn ? 'Pending' : 'Disemak'}</span>
          </span>
          {onCancelGrant && (
            <button
              type="button"
              disabled={cancellingGrantId === matchingPendingGrant.id}
              onClick={() => handleCancelGrantClick(matchingPendingGrant)}
              className={`px-2.5 py-1.5 text-xs ${roleTheme.dangerOutlineButtonClass}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>
                {cancellingGrantId === matchingPendingGrant.id
                  ? (isEn ? 'Cancelling...' : 'Batal...')
                  : (isEn ? 'Cancel' : 'Batal')}
              </span>
            </button>
          )}
        </div>
      );
    }

    if (isRegistered) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{isEn ? 'Registered' : 'Didaftarkan'}</span>
          </span>
          <button
            type="button"
            onClick={() => handleCancelProgramRegistration(prog)}
            className={`px-2.5 py-1.5 text-xs ${roleTheme.dangerOutlineButtonClass}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isEn ? 'Cancel' : 'Batal'}</span>
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          if (variant === 'modal') {
            setDetailProgram(null);
          }
          handleProgramAction(prog);
        }}
        className={
          variant === 'card'
            ? roleTheme.compactPrimaryButtonClass
            : `py-2.5 px-4 text-sm inline-flex items-center gap-1.5 ${roleTheme.primaryButtonClass}`
        }
      >
        <span>
          {isGrant
            ? (isEn ? 'Apply' : 'Mohon')
            : (isEn ? 'Join' : 'Daftar')}
        </span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* Notice Banner */}
      {activeNotice && (
        <div className="p-4 bg-white dark:bg-slate-800 text-black dark:text-white rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{activeNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveNotice(null)}
            className="text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white p-1.5 rounded-xl cursor-pointer"
            aria-label={isEn ? 'Close notice' : 'Tutup notis'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
            {isEn ? 'Youth Grants & Programs' : 'Geran & Program Belia'}
          </h1>
          <p className="text-sm text-black/65 dark:text-white/70 mt-1 max-w-2xl">
            {isEn
              ? 'Explore active business funding schemes, hands-on workshops, expos, and startup pitching tracks across Kelantan.'
              : 'Terokai skim pembiayaan perniagaan belia, bengkel kemahiran, ekspo jualan, dan program inkubasi usahawan di seluruh Kelantan.'}
          </p>
        </div>
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
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-300">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                          {grant.programTitle}
                        </span>
                        <span className="text-xs font-semibold text-black/40 dark:text-white/40">·</span>
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            grant.status === 'approved'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : grant.status === 'rejected'
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-amber-700 dark:text-amber-400'
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
                      className={`px-3 py-2 text-[0.8125rem] self-end sm:self-center ${roleTheme.dangerOutlineButtonClass}`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        {isCancelling
                          ? (isEn ? 'Cancelling...' : 'Batal...')
                          : (isEn ? 'Cancel' : 'Batal')}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Spotlight Hero Card */}
      {spotlightProgram && (
        <section
          aria-label={isEn ? 'Featured Spotlight' : 'Sorotan Pilihan Utama'}
          className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-2xs"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div
              onClick={() => setDetailProgram(spotlightProgram)}
              className="lg:col-span-5 relative min-h-[220px] sm:min-h-[260px] bg-slate-100 dark:bg-zinc-800 overflow-hidden cursor-pointer group"
            >
              <PortalImage
                src={resolveProgramImage(spotlightProgram)}
                alt={spotlightProgram.title}
                fallbackType="program"
                fallbackLabel={spotlightProgram.category}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
              />
            </div>

            <div className="lg:col-span-7 p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${roleTheme.accentTextClass}`}>
                    <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>{isEn ? 'Featured Spotlight' : 'Sorotan Pilihan Utama'}</span>
                    <span className="text-black/30 dark:text-white/30">·</span>
                    <span className="text-black/65 dark:text-white/70">
                      {spotlightProgram.category}
                    </span>
                  </div>
                </div>

                <h2
                  onClick={() => setDetailProgram(spotlightProgram)}
                  className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight leading-snug text-balance cursor-pointer hover:opacity-85 transition-opacity"
                >
                  {spotlightProgram.title}
                </h2>

                <p className="text-sm sm:text-base text-black/70 dark:text-white/75 leading-relaxed line-clamp-3">
                  {spotlightProgram.description ||
                    (isEn
                      ? 'Official youth entrepreneurship initiative open for eligible Kelantan youth founders.'
                      : 'Inisiatif rasmi keusahawanan belia yang dibuka kepada usahawan muda Kelantan yang layak.')}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-black/70 dark:text-white/75 tabular-nums">
                  {spotlightProgram.grantAmount && (
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {spotlightProgram.grantAmount}
                    </span>
                  )}
                  {spotlightProgram.grantAmount && (
                    <span className="text-black/30 dark:text-white/30">·</span>
                  )}
                  <span>{spotlightProgram.date}</span>
                  <span className="text-black/30 dark:text-white/30">·</span>
                  <span>{spotlightProgram.location}</span>
                  <span className="text-black/30 dark:text-white/30">·</span>
                  <span className="text-black/60 dark:text-white/65">{spotlightProgram.organizer}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div
                  className="flex flex-wrap items-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderProgramActionControls(spotlightProgram, 'spotlight')}
                  <button
                    type="button"
                    onClick={() => setDetailProgram(spotlightProgram)}
                    className={`py-2 px-3.5 text-sm inline-flex items-center gap-1.5 ${roleTheme.secondaryButtonClass}`}
                  >
                    <span>{isEn ? 'Details' : 'Butiran'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Catalog Container: Integrated Toolbar + Visual Card Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        {/* Preserved Integrated Toolbar (Search, Filter, Sort, Admin Add) */}
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            isEn ? 'Search program or location...' : 'Cari program atau lokasi...'
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
                className={`min-h-[38px] ${roleTheme.compactPrimaryButtonClass}`}
              >
                <Award className="w-4 h-4" />
                <span>{isEn ? 'Add' : 'Tambah'}</span>
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
                      className={`px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold border text-left transition-colors cursor-pointer ${
                        selectedCategory === cat.key
                          ? `${roleTheme.segmentedActiveClass} border-transparent`
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
                      className={`px-2.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold border transition-colors cursor-pointer ${
                        featuredFilter === opt.id
                          ? `${roleTheme.segmentedActiveClass} border-transparent`
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
                className={roleTheme.compactSecondaryButtonClass}
              >
                {isEn ? 'Reset' : 'Set Semula'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Visual 3-Column Program Card Grid */}
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {pagination.paginatedItems.map((prog) => (
                <article
                  key={prog.id}
                  id={`program-card-${prog.id}`}
                  onClick={() => setDetailProgram(prog)}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-zinc-500 transition-colors flex flex-col justify-between overflow-hidden cursor-pointer group"
                >
                  <div>
                    <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 overflow-hidden">
                      <PortalImage
                        src={resolveProgramImage(prog)}
                        alt={prog.title}
                        fallbackType="program"
                        fallbackLabel={prog.category}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>

                    <div className="p-4 sm:p-5 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                        <span className={`uppercase tracking-wider ${roleTheme.accentTextClass}`}>
                          {prog.category}
                        </span>
                        {prog.isFeatured && (
                          <>
                            <span className="text-black/30 dark:text-white/30">·</span>
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                              <Star className="w-3 h-3 fill-current shrink-0" />
                              <span>{isEn ? 'Featured' : 'Pilihan Utama'}</span>
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="font-bold text-black dark:text-white text-base sm:text-lg leading-snug line-clamp-2 mt-1.5 group-hover:opacity-85 transition-opacity">
                        {prog.title}
                      </h3>

                      <p className="text-sm text-black/65 dark:text-white/70 leading-relaxed line-clamp-2 mt-1.5">
                        {prog.description ||
                          (isEn
                            ? 'Open for eligible youth entrepreneurs across Kelantan districts.'
                            : 'Terbuka kepada usahawan belia Kelantan yang memenuhi syarat kelayakan.')}
                      </p>

                      <div className="mt-3 text-xs text-black/60 dark:text-white/65 truncate tabular-nums">
                        {prog.date} · {prog.location}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Tabular Grant Value / View Details + Direct Integrated Card Actions */}
                  <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      {prog.grantAmount ? (
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums block truncate">
                          {prog.grantAmount}
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold inline-flex items-center gap-1 group-hover:underline ${roleTheme.accentTextClass}`}>
                          <span>{isEn ? 'Details' : 'Butiran'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {prog.grantAmount && (
                        <button
                          type="button"
                          onClick={() => setDetailProgram(prog)}
                          className={`text-xs font-semibold hover:underline px-1.5 py-1 cursor-pointer whitespace-nowrap ${roleTheme.accentTextClass}`}
                        >
                          {isEn ? 'Details' : 'Butiran'}
                        </button>
                      )}
                      {renderProgramActionControls(prog, 'card')}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={pagination.setCurrentPage}
              itemLabel={isEn ? 'programs' : 'program'}
            />
          </>
        )}
      </div>

      {/* Program & Grant Full Details Modal */}
      {detailProgram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setDetailProgram(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="program-detail-modal-title"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 shrink-0 overflow-hidden">
              <PortalImage
                src={resolveProgramImage(detailProgram)}
                alt={detailProgram.title}
                fallbackType="program"
                fallbackLabel={detailProgram.category}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDetailProgram(null)}
                aria-label={isEn ? 'Close details' : 'Tutup butiran'}
                className={`absolute top-3 right-3 ${roleTheme.iconButtonClass}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <span className={roleTheme.accentTextClass}>
                    {detailProgram.category}
                  </span>
                  {detailProgram.isFeatured && (
                    <>
                      <span className="text-black/30 dark:text-white/30">·</span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>{isEn ? 'Featured' : 'Pilihan Utama'}</span>
                      </span>
                    </>
                  )}
                </div>
                <h2
                  id="program-detail-modal-title"
                  className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight mt-1.5 text-balance"
                >
                  {detailProgram.title}
                </h2>
              </div>

              {/* Structured Key Facts Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-y border-slate-200 dark:border-zinc-700 py-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Schedule / Closing' : 'Tarikh / Tempoh'}
                    </span>
                    <span className="font-semibold text-black dark:text-white tabular-nums">
                      {detailProgram.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Location' : 'Lokasi'}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      {detailProgram.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-black/55 dark:text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                      {isEn ? 'Organizer' : 'Penganjur'}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      {detailProgram.organizer}
                    </span>
                  </div>
                </div>

                {detailProgram.grantAmount && (
                  <div className="flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                        {isEn ? 'Funding Value' : 'Nilai Bantuan'}
                      </span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {detailProgram.grantAmount}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black/55 dark:text-white/60">
                  {isEn ? 'Program Details & Eligibility' : 'Huraian & Maklumat Program'}
                </h3>
                <p className="text-sm sm:text-base text-black/75 dark:text-white/80 leading-relaxed whitespace-pre-line">
                  {detailProgram.description ||
                    (isEn
                      ? 'Open to registered Kelantan youth entrepreneurs. Submit your application to receive official secretariat review.'
                      : 'Terbuka kepada usahawan belia Kelantan yang berdaftar. Hantar permohonan atau pendaftaran untuk semakan lanjut pihak urus setia.')}
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailProgram(null)}
                className={`py-2 px-4 text-sm ${roleTheme.secondaryButtonClass}`}
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
              <div>{renderProgramActionControls(detailProgram, 'modal')}</div>
            </div>
          </div>
        </div>
      )}

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
