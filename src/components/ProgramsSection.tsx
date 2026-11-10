import React, { useState } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const categoryOptions = [
    { key: 'Semua', label: language === 'en' ? 'All' : 'Semua' },
    { key: 'Geran & Dana', label: language === 'en' ? 'Grants & Funding' : 'Geran & Dana' },
    { key: 'Bengkel & Latihan', label: language === 'en' ? 'Workshops & Training' : 'Bengkel & Latihan' },
    { key: 'Pameran & Ekspo', label: language === 'en' ? 'Expos & Exhibitions' : 'Pameran & Ekspo' },
    { key: 'Pitching & Inkubasi', label: language === 'en' ? 'Pitching & Incubation' : 'Pitching & Inkubasi' }
  ];

  const safePrograms = programs || [];
  const filteredPrograms = safePrograms.filter(
    (p) => p && (selectedCategory === 'Semua' || p.category === selectedCategory)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Toast Notification Banner if clicked */}
      {activeNotice && (
        <div className="mb-6 p-4 bg-slate-900 dark:bg-[#1C2434] text-white rounded-xl border border-slate-700 dark:border-[#2E3A47] flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeNotice}</span>
          </div>
          <button 
            type="button"
            onClick={() => setActiveNotice(null)} 
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === 'en' ? 'Youth Entrepreneurship Grants & Programs' : 'Geran & Program Keusahawanan Belia'}
          </h2>
          <p className="text-slate-600 dark:text-[#8A99AD] text-sm mt-1 max-w-2xl leading-relaxed">
            {language === 'en'
              ? 'Join specialized incubation programs, digital skill workshops, TEKUN/MARA/UMK funding matching, and kiosk lease subsidy grants to accelerate your business.'
              : 'Sertai program inkubasi khas, bengkel kemahiran digital, padanan pembiayaan TEKUN/MARA/UMK, dan geran subsidi sewa kapsul niaga untuk memacu perniagaan anda.'}
          </p>
        </div>

        {isReadOnly && onAddProgram && (
          <button
            type="button"
            onClick={onAddProgram}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{language === 'en' ? 'Publish Program & Grant' : 'Terbitkan Program & Geran'}</span>
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
            className={`interactive-press px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-[#24303F] text-slate-600 dark:text-[#8A99AD] hover:bg-slate-100 dark:hover:bg-[#1A222C] dark:hover:text-white border border-slate-200 dark:border-[#2E3A47]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Programs List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((prog) => (
          <div
            key={prog.id}
            id={`program-card-${prog.id}`}
            className="interactive-card bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] hover:border-amber-400/40 dark:hover:border-amber-400/40 overflow-hidden shadow-xs flex flex-col justify-between group cursor-pointer"
          >
            <div className="p-6 space-y-4">
              
              {/* Category & Featured Badge */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-[#1A222C] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-[#2E3A47] rounded text-[11px] font-bold">
                  {prog.category}
                </span>
                {prog.isFeatured && (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded text-[10px] font-bold">
                    {language === 'en' ? 'Featured' : 'Utama'}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200">
                  {prog.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#8A99AD] mt-2 leading-relaxed">
                  {prog.description}
                </p>
              </div>

              {/* Grant amount callout if present */}
              {prog.grantAmount && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs flex items-center gap-2 group-hover:scale-[1.02] transition-transform duration-200">
                  <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-amber-800 dark:text-amber-400 font-medium block">
                      {language === 'en' ? 'Aid Value / Grant Amount:' : 'Nilai Bantuan / Hadiah:'}
                    </span>
                    <span className="font-extrabold text-amber-950 dark:text-amber-200">{prog.grantAmount}</span>
                  </div>
                </div>
              )}

              {/* Date & Location Details */}
              <div className="space-y-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#2E3A47]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prog.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prog.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">
                    {language === 'en' ? 'Organized by:' : 'Anjuran:'} {prog.organizer}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-slate-50 dark:bg-[#1C2434] border-t border-slate-100 dark:border-[#2E3A47]">
            {isReadOnly ? (
              <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-[#1C2434] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{language === 'en' ? 'Status: State Initiative (Monitored)' : 'Status: Inisiatif Negeri (Dipantau)'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenGrantModal) {
                    onOpenGrantModal(prog.title, prog.grantAmount || 'RM3,000');
                  } else {
                    setActiveNotice(
                      language === 'en'
                        ? `Registration for "${prog.title}" has been recorded. Please check your email or visit the secretariat hub.`
                        : `Pendaftaran untuk "${prog.title}" direkodkan. Sila semak emel atau kunjungi hab urusetia.`
                    );
                  }
                }}
                className="interactive-press interactive-lift w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{language === 'en' ? 'Register / Apply Program' : 'Daftar / Mohon Program'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
