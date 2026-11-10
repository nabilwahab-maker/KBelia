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
    <div className="rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Pusat Simpanan Dokumen Sah (Digital Vault)
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Beraudit & Dilindungi Akta PDPA 2010
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
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
              className="rounded-2xl p-5 border border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    <ShieldCheck className="w-3 h-3" /> Surat Tawaran Rasmi
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                    {b.slotCode}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Surat Tawaran Kiosk Kapsul Bersubsidi
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  {b.businessName} · {b.hubLocation} (Sewa RM150/bulan disubsidi negeri).
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 bg-white/70 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span>Mula: <strong className="text-slate-800 dark:text-slate-200">{formatDisplayDate(b.startDate)}</strong></span>
                  <span>Akhir: <strong className="text-red-700 dark:text-amber-400">{calculateOperationEndDate(b.startDate, b.durationMonths)}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onViewOfferLetter(b)}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Buka & Cetak
                </button>

                {onOpenTenancyAgreement && (
                  <button
                    type="button"
                    onClick={() => onOpenTenancyAgreement(b)}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" /> Perjanjian Sewa
                  </button>
                )}

                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={() => onOpenVerification(`KBN-${b.slotCode}`)}
                    className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    title="Semak Kod QR Integriti"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tiada Surat Tawaran Kiosk Lagi
            </h5>
            <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
              Sebaik sahaja permohonan kiosk anda disahkan oleh Urusetia UMK, surat tawaran digital rasmi akan tersimpan di sini secara automatik.
            </p>
          </div>
        )}

        {/* Document 2: Certificate of Youth Entrepreneurship */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                <Award className="w-3 h-3" /> Sijil Keahlian
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">
                REG-2026-BELIA
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Sijil Pendaftaran Usahawan Belia Kelantan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pengesahan penyertaan rasmi dalam program pemerkasaan keusahawanan universiti dan kerajaan negeri.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Sijil
            </button>
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => onOpenVerification('REG-2026-BELIA')}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 transition-colors flex items-center gap-1"
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
