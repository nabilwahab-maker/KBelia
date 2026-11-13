import React, { useRef, useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Download, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Key, 
  Printer, 
  X,
  Sparkles,
  QrCode,
  Lock,
  Copy,
  Check,
  FileCheck2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { CapsuleBooking, CapsuleSlot } from '../types';
import { 
  openAndPrintDocument,
  printHtmlViaIframe, 
  downloadHtmlDocument, 
  copyToClipboard,
  generateOfferLetterOfficialHtml,
  formatDisplayDate,
  calculateOperationEndDate
} from '../utils/printUtils';
import { downloadOfferLetterPdf } from '../utils/pdfGenerator';

interface OfferLetterModalProps {
  booking: CapsuleBooking | null;
  slots?: CapsuleSlot[];
  isOpen: boolean;
  onClose: () => void;
  onOpenVerification?: (refCode?: string) => void;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({
  booking,
  slots = [],
  isOpen,
  onClose,
  onOpenVerification
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const letterRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !booking) return null;

  const matchedSlot = slots.find(s => s.id === booking.slotId || s.code === booking.slotCode);
  const monthlyRate = booking.monthlyRate || matchedSlot?.monthlyRate || 150;
  const marketRate = monthlyRate * 2;

  const refNumber = `KBN-${booking.slotCode || 'KB01'}-${new Date(booking.createdAt || Date.now()).getFullYear()}-8819`;
  const formattedDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('ms-MY', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const styledDocument = generateOfferLetterOfficialHtml(booking, refNumber, formattedDate);
      await openAndPrintDocument(
        styledDocument,
        `Surat_Tawaran_Kiosk_${booking.slotCode || 'KB'}_${refNumber}`
      );
    } catch {
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 700);
    }
  };

  const handleDownload = async () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = `Surat_Tawaran_Kiosk_${booking.slotCode || 'KB'}_${refNumber}.pdf`;
      const ok = await downloadOfferLetterPdf(booking, refNumber, formattedDate, fileName);
      if (ok) {
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 3500);
      }
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyRef = async () => {
    const ok = await copyToClipboard(refNumber);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="kbelia-important-header text-slate-800 dark:text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center border border-sky-200 dark:border-sky-800 shrink-0">
              <ShieldCheck className="w-6 h-6 text-sky-700 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-sky-700 dark:text-sky-400 font-bold">Dokumen Sah Bertauliah</div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white leading-tight">Surat Tawaran Penempatan Kiosk Belia</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Tutup tetingkap"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Status Toast Notification */}
        {(isCopied || isDownloaded || isDownloadingPdf || isPrinting) && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>
              {isCopied && `Nombor rujukan rasmi ${refNumber} berjaya disalin ke papan keratan!`}
              {isDownloadingPdf && `Menjana fail PDF rasmi bersaiz 1 muka surat A4 tanpa terpotong...`}
              {isDownloaded && `Surat tawaran berjaya dimuat turun terus dalam format PDF (.pdf) bersaiz A4!`}
              {isPrinting && `Membuka halaman cetakan rasmi A4 untuk cetakan serta-merta...`}
            </span>
          </div>
        )}

        {/* Letter Body - Scrollable content area and printable container */}
        <div className="p-5 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100 overflow-y-auto flex-1">
          <div ref={letterRef} className="space-y-6 bg-white dark:bg-slate-900 p-2 rounded-xl">
            {/* Official Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-emerald-700/30 dark:border-slate-700 gap-3">
              <div>
                <div className="font-black text-base sm:text-lg tracking-tight text-slate-800 dark:text-white">
                  PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inisiatif Bersama Universiti Malaysia Kelantan (UMK) & Kerajaan Negeri Kelantan
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <div className="flex items-center sm:justify-end gap-1.5">
                  <span>No. Ruj:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{refNumber}</span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    title="Salin No. Rujukan"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div>Tarikh: {formattedDate}</div>
              </div>
            </div>

            {/* Applicant Intro */}
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Kepada Usahawan:</div>
              <div className="font-bold text-slate-900 dark:text-white text-base">{booking.applicantName}</div>
              <div className="text-slate-700 dark:text-slate-200 font-medium">
                {booking.businessName} <span className="text-slate-500 dark:text-slate-400">({booking.businessCategory})</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs">
                {booking.applicantEmail} · {booking.applicantPhone}
              </div>
            </div>

            {/* Decision Statement */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed">
                Sukacita dimaklumkan bahawa permohonan anda untuk menyewa ruang kiosk niaga bagi premis <strong>{booking.slotName} ({booking.slotCode})</strong> telah <strong>DILULUSKAN</strong> di bawah Skim Kapsul Niaga Usahawan Belia Kelantan.
              </div>
            </div>

            {/* Placement Terms Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>Butiran Penempatan Kiosk Bersubsidi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Kod & Nama Premis:</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm font-mono">{booking.slotCode}</span>
                  <div className="text-slate-600 dark:text-slate-300 font-medium">{booking.slotName}</div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Lokasi Hab:</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{booking.hubLocation}</span>
                  <div className="text-slate-600 dark:text-slate-300 font-medium">Negeri Kelantan Darul Naim</div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Kadar Sewa Bersubsidi:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm tabular-nums">RM {monthlyRate.toFixed(2)} / bulan</span>
                  <div className="text-emerald-700 dark:text-emerald-400 font-medium">Subsidi 50% Ditaja Negeri (Kadar Asal RM{marketRate})</div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Tarikh Mula Operasi:</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{formatDisplayDate(booking.startDate)}</span>
                  <div className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Penyerahan Kunci Kiosk</div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/50">
                  <span className="text-rose-600 dark:text-rose-400 block text-[11px] font-semibold">Tarikh Akhir Beroperasi:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">{calculateOperationEndDate(booking.startDate, booking.durationMonths)}</span>
                  <div className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Tamat Tempoh {booking.durationMonths} Bulan</div>
                </div>
              </div>
            </div>

            {/* Key Pickup & Official QR Verification Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-800 dark:text-white">Arahan Penyerahan Kunci:</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {booking.adminNotes || 'Sila hadir ke Pejabat Pengurusan Hab Kapsul Niaga berkenaan dalam masa 7 hari bekerja bersama dokumen pengenalan diri untuk penerimaan kunci digital kiosk.'}
                  </p>
                </div>
              </div>

              {/* Verifiable QR Block */}
              <div className="flex flex-col items-center shrink-0 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <QrCode className="w-12 h-12 text-slate-800 dark:text-white" />
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-1 font-bold">SAH & BERAUDIT</span>
              </div>
            </div>

            {/* Official Certification Footer Note */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Dokumen rasmi dikeluarkan di bawah Akta Pembangunan Keusahawanan Belia Kelantan.</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">ID: {booking.id || 'BK-KBelia-2026'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRef}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Salin Nombor Rujukan Rasmi"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isCopied ? 'Disalin!' : 'Salin No. Ruj'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloadingPdf}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-70"
              title="Muat turun dokumen PDF rasmi (.pdf) 1 muka surat A4"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  <span>Menjana PDF...</span>
                </>
              ) : isDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PDF Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Muat Turun Fail</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => onOpenVerification(refNumber)}
                className="py-2 px-3.5 rounded-xl text-xs font-bold text-sky-800 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950/60 dark:border-sky-800 dark:hover:bg-sky-900/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buka tetingkap semakan ketulenan dokumen secara terus"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
                <span>Sahkan QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Buka halaman cetakan dan cetak salinan rasmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Membuka...' : 'Cetak'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
