import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  QrCode, 
  Lock, 
  Search,
  ExternalLink,
  Award
} from 'lucide-react';

interface PublicVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRefCode?: string;
}

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  isOpen,
  onClose,
  defaultRefCode = 'KBN-KB-2026-8819'
}) => {
  const [inputRef, setInputRef] = useState(defaultRefCode);
  const [verifiedRecord, setVerifiedRecord] = useState<{
    refCode: string;
    status: 'valid' | 'invalid';
    recipient: string;
    kioskLocation: string;
    district: string;
    rate: string;
    issueDate: string;
    expiryDate: string;
    issuer: string;
  } | null>({
    refCode: defaultRefCode,
    status: 'valid',
    recipient: 'Ahmad Faiz (010502-03-****)',
    kioskLocation: 'Hub Belia KB Sentral (Kiosk Kapsul #CAP-KB-01)',
    district: 'Kota Bharu',
    rate: 'RM 150/bulan (Subsidi Penuh Kerajaan Negeri)',
    issueDate: '15 Januari 2026',
    expiryDate: '14 Januari 2027',
    issuer: 'Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)'
  });

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.trim().length > 5) {
      setVerifiedRecord({
        refCode: inputRef.trim().toUpperCase(),
        status: 'valid',
        recipient: 'Pemohon Sah Berdaftar (010***-**-****)',
        kioskLocation: 'Hub Kapsul Usahawan Kelantan',
        district: 'Kelantan Darul Naim',
        rate: 'RM 150/bulan (Tajaan Subsidi Negeri)',
        issueDate: '2026',
        expiryDate: '2027',
        issuer: 'Kerajaan Negeri Kelantan & Universiti Malaysia Kelantan'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/60 dark:border-amber-500/30 scale-100 transition-all max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300/40 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengesahan Ketulenan Dokumen Awam
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Sistem Semakan Surat Tawaran & Sijil Rasmi
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Ref Bar */}
        <form onSubmit={handleVerify} className="mb-6">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Masukkan No. Rujukan Surat Tawaran / Sijil:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value)}
                placeholder="Contoh: KBN-KB-2026-8819"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              Sahkan
            </button>
          </div>
        </form>

        {/* Verification Result Card */}
        {verifiedRecord && (
          <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Dokumen Rasmi Diiktiraf & Sah
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">No. Siri Rujukan:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{verifiedRecord.refCode}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Penerima Tawaran:</span>
                <span className="font-bold text-slate-900 dark:text-white">{verifiedRecord.recipient}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Lokasi Kiosk:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{verifiedRecord.kioskLocation}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kadar Sewa:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">{verifiedRecord.rate}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tempoh Sah:</span>
                <span className="text-slate-700 dark:text-slate-300">{verifiedRecord.issueDate} hingga {verifiedRecord.expiryDate}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Pihak Berkuasa Pengeluar:</span>
                <span className="text-slate-700 dark:text-slate-300">{verifiedRecord.issuer}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA) & Piawaian Keselamatan Kerajaan.</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
