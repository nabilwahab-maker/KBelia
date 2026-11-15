import React, { useEffect, useState } from 'react';
import {
  Award,
  Calendar,
  MapPin,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Users,
  X,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { GrantApplication, YouthProgram } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveProgramImage } from '../utils/visualAssets';

interface ProgramsSectionProps {
  programs: YouthProgram[];
  grantApplications?: GrantApplication[];
  onOpenGrantModal?: (title?: string, amount?: string) => void;
  onCancelGrant?: (grant: GrantApplication) => Promise<void> | void;
  onAddProgram?: () => void;
  isReadOnly?: boolean;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
  programs = [],
  grantApplications = [],
  onOpenGrantModal,
  onCancelGrant,
  onAddProgram,
  isReadOnly = false
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEn = language === 'en';
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [cancellingGrantId, setCancellingGrantId] = useState<string | null>(null);

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
    { key: 'Semua', label: isEn ? 'All' : 'Semua' },
    { key: 'Geran & Dana', label: isEn ? 'Grants & Funding' : 'Geran & Dana' },
    { key: 'Bengkel & Latihan', label: isEn ? 'Workshops & Training' : 'Bengkel & Latihan' },
    { key: 'Pameran & Ekspo', label: isEn ? 'Expos & Exhibitions' : 'Pameran & Ekspo' },
    { key: 'Pitching & Inkubasi', label: isEn ? 'Pitching & Incubation' : 'Pitching & Inkubasi' }
  ];

  const safePrograms = programs || [];
  const filteredPrograms = safePrograms.filter(
    (p) => p && (selectedCategory === 'Semua' || p.category === selectedCategory)
  );

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            {isEn ? 'Youth Grants & Programs' : 'Geran & Program Belia'}
          </h1>
          <p className="text-black/75 dark:text-white/75 text-[0.9375rem] mt-1 max-w-2xl leading-relaxed">
            {isEn
              ? 'Join incubation tracks, digital workshops, TEKUN/MARA/UMK matching, and kiosk rental subsidies.'
              : 'Sertai inisiatif inkubasi, bengkel digital, padanan TEKUN/MARA/UMK, dan subsidi sewa kapsul niaga.'}
          </p>
        </div>

        {isReadOnly && onAddProgram && (
          <button
            type="button"
            onClick={onAddProgram}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer dark:bg-emerald-600"
          >
            <Award className="w-4 h-4" />
            <span>{isEn ? 'Add Program' : 'Terbit Program'}</span>
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white border border-slate-300 dark:border-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Active Grant Applications Status & Cancel Controls */}
      {!isReadOnly && visibleGrants.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-600 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-black dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isEn ? 'Your Grant Applications' : 'Permohonan Geran Anda'}</span>
            </h2>
            <span className="text-xs font-bold text-black/70 dark:text-white/75 tabular-nums">
              {pendingGrants.length} {isEn ? 'Pending' : 'Dalam Semakan'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleGrants.map((grant) => {
              const isPending = grant.status === 'pending';
              const isCancelling = cancellingGrantId === grant.id;
              return (
                <div
                  key={grant.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-black dark:text-white truncate">
                        {grant.programTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
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
                    <p className="text-xs text-black/70 dark:text-white/75 mt-1 truncate">
                      {grant.businessName} · <strong className="text-black dark:text-white">{grant.grantAmount || grant.amount}</strong>
                    </p>
                  </div>

                  {isPending && onCancelGrant && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCancelGrantClick(grant)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-black dark:text-white bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
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

      {/* Empty State */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600">
          <Award className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-3" />
          <p className="text-sm font-bold text-black dark:text-white">
            {isEn ? 'No programs found in this category' : 'Tiada program ditemui dalam kategori ini'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPrograms.map((prog) => {
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
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 hover:border-blue-400/70 dark:hover:border-blue-400/70 overflow-hidden shadow-xs flex flex-col justify-between group transition-colors"
              >
                <div>
                  <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-600">
                    <PortalImage
                      src={resolveProgramImage(prog)}
                      alt={prog.title}
                      fallbackType="program"
                      fallbackLabel={prog.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                  {/* Category & Featured Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 rounded text-[0.8125rem] font-semibold">
                      {prog.category}
                    </span>
                    {prog.isFeatured && (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70 rounded text-[0.8125rem] font-bold">
                        {isEn ? 'Featured' : 'Utama'}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-black dark:text-white text-base leading-snug group-hover:text-black dark:group-hover:text-white transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-[0.9375rem] text-black dark:text-white/75 mt-2 leading-relaxed">
                      {prog.description}
                    </p>
                  </div>

                  {/* Grant amount callout if present */}
                  {prog.grantAmount && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 rounded-lg text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-black dark:text-white/75 shrink-0" />
                      <div>
                        <span className="text-[0.8125rem] text-black dark:text-white font-medium block">
                          {isGrant
                            ? (isEn ? 'Aid Value / Grant Amount:' : 'Nilai Bantuan / Geran:')
                            : (isEn ? 'Prize / Incentive:' : 'Hadiah / Insentif:')}
                        </span>
                        <span className="font-extrabold text-black dark:text-white tabular-nums">{prog.grantAmount}</span>
                      </div>
                    </div>
                  )}

                  {/* Date & Location Details */}
                  <div className="space-y-1.5 pt-2 text-sm text-black/70 dark:text-white/75 border-t border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                      <span>{prog.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                      <span>{prog.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                      <span className="truncate">
                        {isEn ? 'Organized by:' : 'Anjuran:'} {prog.organizer}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-600">
                  {isReadOnly ? (
                    <div className="w-full py-2 px-4 bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-black dark:text-white/75" />
                      <span>{isEn ? 'Status: State Initiative (Monitored)' : 'Status: Inisiatif Negeri (Dipantau)'}</span>
                    </div>
                  ) : matchingPendingGrant ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-2 px-3 bg-amber-50 dark:bg-amber-950/50 text-black dark:text-white border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{isEn ? 'Pending' : 'Disemak'}</span>
                      </div>
                      {onCancelGrant && (
                        <button
                          type="button"
                          disabled={cancellingGrantId === matchingPendingGrant.id}
                          onClick={() => handleCancelGrantClick(matchingPendingGrant)}
                          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-black dark:text-white border border-rose-300 dark:border-rose-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
                      <div className="flex-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{isEn ? 'Registered' : 'Didaftarkan'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelProgramRegistration(prog)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-black dark:text-white border border-rose-300 dark:border-rose-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>{isEn ? 'Cancel Join' : 'Batal Penyertaan'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleProgramAction(prog)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer dark:bg-emerald-600"
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
      )}
    </div>
  );
};
