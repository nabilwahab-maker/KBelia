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
  Eye
} from 'lucide-react';
import { YouthProgram } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from './ToastNotification';

interface ProgramsSectionProps {
  programs: YouthProgram[];
  onOpenGrantModal?: (title?: string, amount?: string) => void;
  onAddProgram?: () => void;
  isReadOnly?: boolean;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
  programs = [],
  onOpenGrantModal,
  onAddProgram,
  isReadOnly = false
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEn = language === 'en';
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

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
      : `Pendaftaran penyertaan "${prog.title}" berjaya direkodkan. Urusetia akan menghubungi anda sebelum tarikh program.`;
    setActiveNotice(noticeMsg);
    showToast({
      type: 'success',
      title: isEn ? 'Participation Recorded' : 'Penyertaan Direkodkan',
      message: prog.title
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Notice Banner */}
      {activeNotice && (
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{activeNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveNotice(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
            aria-label={isEn ? 'Close notice' : 'Tutup notis'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isEn ? 'Youth Entrepreneurship Grants & Programs' : 'Geran & Program Keusahawanan Belia'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            {isEn
              ? 'Join specialized incubation programs, digital skill workshops, TEKUN/MARA/UMK funding matching, and kiosk lease subsidy grants to accelerate your business.'
              : 'Sertai program inkubasi khas, bengkel kemahiran digital, padanan pembiayaan TEKUN/MARA/UMK, dan geran subsidi sewa kapsul niaga untuk memacu perniagaan anda.'}
          </p>
        </div>

        {isReadOnly && onAddProgram && (
          <button
            type="button"
            onClick={onAddProgram}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{isEn ? 'Publish Program & Grant' : 'Terbitkan Program & Geran'}</span>
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {categoryOptions.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-800 dark:hover:text-white border border-slate-200 dark:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'No programs found in this category' : 'Tiada program ditemui dalam kategori ini'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((prog) => {
            const isGrant = prog.category === 'Geran & Dana';
            const isRegistered = !isGrant && registeredIds.includes(prog.id);

            return (
              <div
                key={prog.id}
                id={`program-card-${prog.id}`}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500/60 overflow-hidden shadow-xs flex flex-col justify-between group transition-colors"
              >
                <div className="p-6 space-y-4">
                  {/* Category & Featured Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-semibold">
                      {prog.category}
                    </span>
                    {prog.isFeatured && (
                      <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded text-[10px] font-bold">
                        {isEn ? 'Featured' : 'Utama'}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      {prog.description}
                    </p>
                  </div>

                  {/* Grant amount callout if present */}
                  {prog.grantAmount && (
                    <div className="p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-lg text-xs flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium block">
                          {isGrant
                            ? (isEn ? 'Aid Value / Grant Amount:' : 'Nilai Bantuan / Geran:')
                            : (isEn ? 'Prize / Incentive:' : 'Hadiah / Insentif:')}
                        </span>
                        <span className="font-extrabold text-sky-900 dark:text-sky-200 tabular-nums">{prog.grantAmount}</span>
                      </div>
                    </div>
                  )}

                  {/* Date & Location Details */}
                  <div className="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-600/80 shrink-0" />
                      <span>{prog.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-600/80 shrink-0" />
                      <span>{prog.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-sky-600/80 shrink-0" />
                      <span className="truncate">
                        {isEn ? 'Organized by:' : 'Anjuran:'} {prog.organizer}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700">
                  {isReadOnly ? (
                    <div className="w-full py-2 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>{isEn ? 'Status: State Initiative (Monitored)' : 'Status: Inisiatif Negeri (Dipantau)'}</span>
                    </div>
                  ) : isRegistered ? (
                    <div className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isEn ? 'Participation Registered' : 'Penyertaan Didaftarkan'}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleProgramAction(prog)}
                      className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>
                        {isGrant
                          ? (isEn ? 'Apply for Grant' : 'Mohon Geran & Dana')
                          : (isEn ? 'Register Participation' : 'Daftar Penyertaan')}
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
