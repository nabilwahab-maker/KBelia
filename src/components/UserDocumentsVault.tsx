import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  Eye
} from 'lucide-react';
import { CapsuleBooking, GrantApplication } from '../types';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  generateGrantApprovalOfficialHtml,
  generateYouthCertificateOfficialHtml
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';

interface UserDocumentsVaultProps {
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  onViewOfferLetter: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
  onOpenVerification?: (refCode?: string) => void;
  ownerName?: string;
  ownerEmail?: string;
  businessName?: string;
  district?: string;
  ssmNumber?: string;
}

export const UserDocumentsVault: React.FC<UserDocumentsVaultProps> = ({
  bookings,
  grantApplications,
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification,
  ownerName,
  ownerEmail,
  businessName,
  district,
  ssmNumber
}) => {
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const approvedGrants = grantApplications.filter(g => g.status === 'approved');
  const certYear = new Date().getFullYear();
  const certCode = `REG-${certYear}-BELIA`;
  const resolvedName = ownerName || approvedBookings[0]?.applicantName || approvedGrants[0]?.applicantName || 'Usahawan Belia Kelantan';
  const resolvedEmail = ownerEmail || approvedBookings[0]?.applicantEmail || approvedGrants[0]?.applicantEmail;
  const resolvedBusiness = businessName || approvedBookings[0]?.businessName || approvedGrants[0]?.businessName;
  const resolvedDistrict = district || approvedBookings[0]?.hubLocation || 'Negeri Kelantan';

  return (
    <div className="animate-dashboard-tab relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-4 sm:p-5 shadow-sm space-y-4 h-fit">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600/80 dark:bg-blue-500/80" aria-hidden="true" />
      {/* (a) Tajuk Utama */}
      <div className="pb-3.5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
          Dokumen &amp; Sijil Saya
        </h2>
      </div>

      {/* (d) Senarai Menegak Dokumen Rasmi */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden h-fit">
        {/* Document 1: Kiosk Offer Letter */}
        {approvedBookings.length > 0 ? (
          approvedBookings.map((b) => (
            <div
              key={b.id}
              className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-base font-extrabold text-black dark:text-white truncate tracking-tight">
                      Surat Tawaran Kiosk Bersubsidi · {b.slotCode}
                    </h4>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200 dark:border-emerald-800">
                      Surat Tawaran Rasmi
                    </span>
                  </div>
                  <p className="text-sm text-black/70 dark:text-white/75 truncate">
                    {b.businessName} · {b.hubLocation} · RM{b.monthlyRate || 150}/bulan · {formatDisplayDate(b.startDate)} – {calculateOperationEndDate(b.startDate, b.durationMonths)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 print:hidden">
                <button
                  type="button"
                  onClick={() => onViewOfferLetter(b)}
                  className="py-1.5 px-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer dark:bg-indigo-600 whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka & Cetak</span>
                </button>

                {onOpenTenancyAgreement && (
                  <button
                    type="button"
                    onClick={() => onOpenTenancyAgreement(b)}
                    className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Perjanjian Sewa</span>
                  </button>
                )}

                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={() => onOpenVerification(`KBN-${b.slotCode}`)}
                    className="p-2 rounded-xl text-black/70 dark:text-white/75 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                    title="Semak Kod QR Integriti"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black/60 dark:text-white/65 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h5 className="text-base font-extrabold text-black dark:text-white truncate tracking-tight">
                    Surat Tawaran Kiosk Bersubsidi
                  </h5>
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-slate-100 dark:bg-slate-800 text-black/75 dark:text-white/80 border border-slate-300 dark:border-slate-600">
                    Belum Tersedia
                  </span>
                </div>
                <p className="text-sm text-black/70 dark:text-white/75 truncate">
                  Akan disimpan automatik selepas permohonan kiosk anda diluluskan oleh Pentadbir KBelia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approved Grants */}
        {approvedGrants.map((g) => (
          <div
            key={g.id}
            className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="text-base font-extrabold text-black dark:text-white truncate tracking-tight">
                    {g.programTitle} · {g.id.slice(0, 12).toUpperCase()}
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200 dark:border-emerald-800">
                    Kelulusan ({g.grantAmount})
                  </span>
                </div>
                <p className="text-sm text-black/70 dark:text-white/75 truncate">
                  {g.businessName} · {g.bankName} ({g.bankAccountNumber}) · {g.adminNotes || 'Diluluskan untuk bayaran geran'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => downloadHtmlAsPdf(generateGrantApprovalOfficialHtml(g), `Surat_Kelulusan_Geran_${g.id.slice(0, 8).toUpperCase()}.pdf`)}
                className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-50 hover:bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => openAndPrintDocument(generateGrantApprovalOfficialHtml(g), `Surat_Kelulusan_Geran_${g.id.slice(0, 8).toUpperCase()}`)}
                className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-50 hover:bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>
        ))}

        {/* Document 2: Certificate of Youth Entrepreneurship */}
        <div className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="text-base font-extrabold text-black dark:text-white truncate tracking-tight">
                  Sijil Pendaftaran Usahawan Belia Kelantan · {certCode}
                </h4>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70">
                  Sijil Keahlian
                </span>
              </div>
              <p className="text-sm text-black/70 dark:text-white/75 truncate">
                {resolvedName}{resolvedBusiness ? ` · ${resolvedBusiness}` : ''} · Pengesahan penyertaan rasmi program keusahawanan belia KBelia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={() =>
                openAndPrintDocument(
                  generateYouthCertificateOfficialHtml({
                    fullName: resolvedName,
                    email: resolvedEmail,
                    businessName: resolvedBusiness,
                    district: resolvedDistrict,
                    ssmNumber,
                    refCode: certCode
                  }),
                  `Sijil_Usahawan_Belia_${certCode}`
                )
              }
              className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-50 hover:bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sijil</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadHtmlAsPdf(
                  generateYouthCertificateOfficialHtml({
                    fullName: resolvedName,
                    email: resolvedEmail,
                    businessName: resolvedBusiness,
                    district: resolvedDistrict,
                    ssmNumber,
                    refCode: certCode
                  }),
                  `Sijil_Usahawan_Belia_${certCode}.pdf`
                )
              }
              className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-50 hover:bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => onOpenVerification(certCode)}
                className="py-1.5 px-3 rounded-xl text-sm font-bold text-black dark:text-white/75 bg-rose-50 dark:bg-rose-950/60 hover:bg-amber-100 border border-rose-200 dark:border-rose-800/70 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pengesahan QR</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
