import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Lock,
  Search,
  AlertTriangle
} from 'lucide-react';
import { BusinessListing, CapsuleBooking } from '../types';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';
import { maskMyKad } from '../utils/securityUtils';

interface PublicVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRefCode?: string;
  bookings?: CapsuleBooking[];
  businesses?: BusinessListing[];
}

interface VerifiedRecordState {
  refCode: string;
  status: 'valid' | 'invalid';
  recipient: string;
  kioskLocation: string;
  district: string;
  rate: string;
  issueDate: string;
  expiryDate: string;
  issuer: string;
}

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  isOpen,
  onClose,
  defaultRefCode = '',
  bookings = [],
  businesses = []
}) => {
  const [inputRef, setInputRef] = useState(defaultRefCode);
  const [verifiedRecord, setVerifiedRecord] = useState<VerifiedRecordState | null>(null);

  const performLookup = (rawQuery: string): VerifiedRecordState | null => {
    const q = rawQuery.trim().toUpperCase();
    if (!q) return null;

    // 1. Match against real approved bookings (by booking id, slotCode, KBN-*, or AGR-*)
    const matchedBooking = bookings.find(b => {
      if (b.status !== 'approved') return false;
      const code = (b.slotCode || '').toUpperCase();
      const shortCode = code.replace('CAP-', '');
      const year = new Date(b.createdAt || Date.now()).getFullYear();
      const candidates = [
        b.id.toUpperCase(),
        code,
        `KBN-${code}`,
        `KBN-${code}-${year}-8819`,
        `KBN-${shortCode}-${year}-8819`,
        `AGR-${code}-${year}`
      ];
      return candidates.some(c => c === q || q.includes(code));
    });

    if (matchedBooking) {
      const rateVal = matchedBooking.monthlyRate || 150;
      return {
        refCode: q,
        status: 'valid',
        recipient: `${matchedBooking.applicantName}${matchedBooking.applicantMyKad ? ` (${maskMyKad(matchedBooking.applicantMyKad)})` : ''}`,
        kioskLocation: `${matchedBooking.hubLocation} (${matchedBooking.slotCode})`,
        district: matchedBooking.businessName,
        rate: `RM ${rateVal}/bulan (Subsidi KBelia)`,
        issueDate: formatDisplayDate(matchedBooking.startDate),
        expiryDate: calculateOperationEndDate(matchedBooking.startDate, matchedBooking.durationMonths),
        issuer: 'Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)'
      };
    }

    // 2. Match against approved registered businesses / SSM or certificate reference
    const matchedBusiness = businesses.find(b =>
      b.isApproved && (
        b.id.toUpperCase() === q ||
        (b.ssmNumber && b.ssmNumber.toUpperCase() === q)
      )
    );

    if (matchedBusiness) {
      return {
        refCode: q,
        status: 'valid',
        recipient: `${matchedBusiness.ownerName} (${matchedBusiness.businessName})`,
        kioskLocation: matchedBusiness.businessAddress || matchedBusiness.district,
        district: matchedBusiness.district,
        rate: `Kategori: ${matchedBusiness.category}`,
        issueDate: formatDisplayDate(matchedBusiness.createdAt),
        expiryDate: 'Aktif Berdaftar',
        issuer: 'Direktori Usahawan Belia Kelantan (KBelia)'
      };
    }

    // 3. Match standard membership cert code
    if (q === 'REG-2026-BELIA') {
      return {
        refCode: q,
        status: 'valid',
        recipient: 'Ahli Berdaftar Portal KBelia Kelantan',
        kioskLocation: 'Seluruh Jajahan Negeri Kelantan',
        district: 'Negeri Kelantan',
        rate: 'Sijil Keahlian Usahawan Belia Rasmi',
        issueDate: 'Januari 2026',
        expiryDate: 'Disember 2026',
        issuer: 'Kerajaan Negeri Kelantan & Universiti Malaysia Kelantan (UMK)'
      };
    }

    return {
      refCode: q,
      status: 'invalid',
      recipient: '-',
      kioskLocation: '-',
      district: '-',
      rate: '-',
      issueDate: '-',
      expiryDate: '-',
      issuer: '-'
    };
  };

  useEffect(() => {
    if (isOpen) {
      const code = defaultRefCode || '';
      setInputRef(code);
      setVerifiedRecord(code ? performLookup(code) : null);
    }
  }, [isOpen, defaultRefCode, bookings, businesses]);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.trim()) return;
    setVerifiedRecord(performLookup(inputRef));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 scale-100 transition-all max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-black dark:text-white/75 flex items-center justify-center border border-amber-300/40 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Pengesahan Ketulenan Dokumen Awam
              </h3>
              <span className="text-[11px] font-semibold text-black dark:text-white/75">
                Sistem Semakan Surat Tawaran & Sijil Rasmi
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Ref Bar */}
        <form onSubmit={handleVerify} className="mb-6">
          <label className="text-xs font-semibold text-black dark:text-white/75 block mb-1.5">
            Masukkan No. Rujukan Surat Tawaran / Kod Kapsul / SSM:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75" />
              <input
                type="text"
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value)}
                placeholder="Contoh: KBN-CAP-KB-01-2026-8819 atau REG-2026-BELIA"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Sahkan
            </button>
          </div>
        </form>

        {/* Verification Result Card */}
        {verifiedRecord && verifiedRecord.status === 'valid' && (
          <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-black dark:text-white/75">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Dokumen Rasmi Diiktiraf & Sah
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs">
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">No. Siri Rujukan:</span>
                <span className="font-mono font-bold text-black dark:text-white">{verifiedRecord.refCode}</span>
              </div>
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">Penerima Tawaran:</span>
                <span className="font-bold text-black dark:text-white">{verifiedRecord.recipient}</span>
              </div>
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">Lokasi / Premis:</span>
                <span className="font-semibold text-black dark:text-white">{verifiedRecord.kioskLocation}</span>
              </div>
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">Butiran Kadar / Status:</span>
                <span className="font-semibold text-black dark:text-white">{verifiedRecord.rate}</span>
              </div>
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">Tempoh Sah:</span>
                <span className="text-black dark:text-white">{verifiedRecord.issueDate} hingga {verifiedRecord.expiryDate}</span>
              </div>
              <div>
                <span className="text-black/70 dark:text-white/75 block text-[11px]">Pihak Berkuasa Pengeluar:</span>
                <span className="text-black dark:text-white">{verifiedRecord.issuer}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-black/70 dark:text-white/75 flex items-center gap-2 mt-2">
              <Lock className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
              <span>Mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA) & Piawaian Keselamatan Kerajaan.</span>
            </div>
          </div>
        )}

        {verifiedRecord && verifiedRecord.status === 'invalid' && (
          <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-black dark:text-white/75 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-extrabold uppercase tracking-wider text-black dark:text-white">
                Rekod Tidak Dijumpai ({verifiedRecord.refCode})
              </div>
              <p className="text-black dark:text-white leading-relaxed">
                Nombor rujukan ini tiada dalam senarai kelulusan aktif atau belum disahkan oleh Urusetia UMK. Sila semak semula ejaan nombor rujukan anda.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-black dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
