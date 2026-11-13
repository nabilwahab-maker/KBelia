import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Award,
  Eye,
  ExternalLink
} from 'lucide-react';
import { CapsuleBooking, GrantApplication } from '../types';
import { formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';

interface UserDocumentsVaultProps {
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  onViewOfferLetter: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
  onOpenVerification?: (refCode?: string) => void;
}

export const UserDocumentsVault: React.FC<UserDocumentsVaultProps> = ({
  bookings,
  grantApplications,
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification
}) => {
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const approvedGrants = grantApplications.filter(g => g.status === 'approved');

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-black dark:text-white/75">
              <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
              Pusat Simpanan Dokumen Sah (Digital Vault)
            </span>
            <span className="text-black/35 dark:text-white/35">·</span>
            <span className="text-xs text-black/70 dark:text-white/75 font-medium">
              Beraudit & Dilindungi Akta PDPA 2010
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
            Vault Dokumen & Sijil Usahawan Anda
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Document 1: Kiosk Offer Letter */}
        {approvedBookings.length > 0 ? (
          approvedBookings.map((b) => (
            <div 
              key={b.id}
              className="rounded-2xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" /> Surat Tawaran Rasmi
                  </span>
                  <span className="font-mono text-xs font-bold text-black/70 dark:text-white/75">
                    {b.slotCode}
                  </span>
                </div>

                <h4 className="text-base font-bold text-black dark:text-white mb-1">
                  Surat Tawaran Kiosk Kapsul Bersubsidi
                </h4>
                <p className="text-xs text-black dark:text-white/75 mb-2">
                  {b.businessName} · {b.hubLocation} (Sewa RM{b.monthlyRate || 150}/bulan disubsidi negeri).
                </p>
                <div className="text-[11px] text-black/70 dark:text-white/75 mb-4 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>Mula: <strong className="text-black dark:text-white">{formatDisplayDate(b.startDate)}</strong></span>
                  <span>Akhir: <strong className="text-black dark:text-white/75">{calculateOperationEndDate(b.startDate, b.durationMonths)}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => onViewOfferLetter(b)}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer dark:bg-indigo-600"
                >
                  <Eye className="w-3.5 h-3.5" /> Buka & Cetak
                </button>

                {onOpenTenancyAgreement && (
                  <button
                    type="button"
                    onClick={() => onOpenTenancyAgreement(b)}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-black dark:text-white" /> Perjanjian Sewa
                  </button>
                )}

                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={() => onOpenVerification(`KBN-${b.slotCode}`)}
                    className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Semak Kod QR Integriti"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-black/70 dark:text-white mb-2" />
            <h5 className="text-xs font-bold text-black dark:text-white">
              Tiada Surat Tawaran Kiosk Lagi
            </h5>
            <p className="text-[11px] text-black/70 dark:text-white/75 max-w-xs mt-0.5">
              Sebaik sahaja permohonan kiosk anda disahkan oleh Urusetia UMK, surat tawaran digital rasmi akan tersimpan di sini secara automatik.
            </p>
          </div>
        )}

        {/* Approved Grants */}
        {approvedGrants.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Kelulusan Geran ({g.grantAmount})
                </span>
                <span className="font-mono text-xs font-bold text-black/70 dark:text-white/75">
                  {g.id.slice(0, 12).toUpperCase()}
                </span>
              </div>

              <h4 className="text-base font-bold text-black dark:text-white mb-1">
                {g.programTitle}
              </h4>
              <p className="text-xs text-black/70 dark:text-white/75 mb-4">
                {g.businessName} · Bank Penerima: {g.bankName} ({g.bankAccountNumber})
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 print:hidden">
              <span className="text-[11px] text-black dark:text-white/75 font-semibold">
                {g.adminNotes || 'Diluluskan untuk pengagihan dana'}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>
            </div>
          </div>
        ))}

        {/* Document 2: Certificate of Youth Entrepreneurship */}
        <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70">
                <Award className="w-3 h-3" /> Sijil Keahlian
              </span>
              <span className="font-mono text-xs font-bold text-black/70 dark:text-white/75">
                REG-2026-BELIA
              </span>
            </div>

            <h4 className="text-base font-bold text-black dark:text-white mb-1">
              Sijil Pendaftaran Usahawan Belia Kelantan
            </h4>
            <p className="text-xs text-black/70 dark:text-white/75 mb-4">
              Pengesahan penyertaan rasmi dalam program pemerkasaan keusahawanan universiti dan kerajaan negeri.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-black dark:text-white bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Sijil
            </button>
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => onOpenVerification('REG-2026-BELIA')}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-black dark:text-white/75 bg-rose-50 dark:bg-rose-950/60 hover:bg-amber-100 border border-rose-200 dark:border-rose-800/70 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Pengesahan QR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
