import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  PenTool, 
  Download, 
  Printer, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { CapsuleBooking, CapsuleSlot } from '../types';
import { signBookingTenancyAgreement, loadLocalPortalSettings } from '../services/dataService';
import { showToast } from './ToastNotification';
import {
  openAndPrintDocument,
  generateTenancyAgreementOfficialHtml,
  formatDisplayDate,
  calculateOperationEndDate
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { MiddleTruncate } from './TypographyPrimitives';

interface DigitalTenancyAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: CapsuleBooking;
  slots?: CapsuleSlot[];
  onAgreementSigned?: (bookingId: string) => void;
}

export const DigitalTenancyAgreementModal: React.FC<DigitalTenancyAgreementModalProps> = ({
  isOpen,
  onClose,
  booking,
  slots = [],
  onAgreementSigned
}) => {
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const agreementRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(Boolean(booking?.tenancySigned));
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { confirmDelete } = useConfirmDelete();

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSigned(Boolean(booking?.tenancySigned));
      setHasSignature(false);
    }
  }, [isOpen, booking?.id, booking?.tenancySigned]);

  if (!isOpen) return null;

  const matchedSlot = slots.find(s => s.id === booking.slotId || s.code === booking.slotCode);
  const subsidyRate = Number(loadLocalPortalSettings().portalSubsidyRate ?? 50);
  const monthlyRate = booking.monthlyRate || matchedSlot?.monthlyRate || 150;
  const bookingYear = new Date(booking.createdAt || Date.now()).getFullYear();
  const agreementRefCode = `AGR-${booking.slotCode}-${bookingYear}`;
  const signedDateDisp = new Date(booking.tenancySignedAt || Date.now()).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Drawing Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirmSignature = async () => {
    try {
      setIsSaving(true);
      await signBookingTenancyAgreement(booking.id, booking.applicantName || 'Penyewa KBelia');
      setIsSigned(true);
      showToast({
        type: 'success',
        title: 'Perjanjian Dimeterai',
        message: `Perjanjian sewaan kapsul ${booking.slotCode} telah disahkan dan disimpan.`
      });
      if (onAgreementSigned) {
        onAgreementSigned(booking.id);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Ralat Pengesahan',
        message: err?.message || 'Gagal menyimpan pengesahan tandatangan digital.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 scale-100 transition-all max-h-[92vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-[#FAF8F3] dark:bg-[#101815] px-6 sm:px-8 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-[#E2DCCB] dark:border-[#24342D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B6E52]/10 dark:bg-[#10B981]/15 text-[#0B6E52] dark:text-[#34D399] flex items-center justify-center border border-[#0B6E52]/25 dark:border-[#34D399]/35 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Perjanjian Sewa Kiosk Digital Rasmi
              </h3>
              <span className="text-[0.8125rem] font-semibold text-black dark:text-white/75">
                Hab Pembangunan Usahawan Belia Kelantan (KBelia)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={roleTheme.iconButtonClass}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-5 overflow-y-auto flex-1">

        {/* Agreement Document Content */}
        <div ref={agreementRef} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm text-black dark:text-white space-y-4 max-h-64 overflow-y-auto font-serif leading-relaxed kbelia-prose">
          <div className="text-center pb-2 border-b border-slate-300 dark:border-slate-600">
            <h4 className="font-bold text-sm text-black dark:text-white uppercase font-sans kbelia-trim">
              PERJANJIAN PENYEWAAN KIOSK KAPSUL USAHAWAN BELIA
            </h4>
            <span className="text-[0.8125rem] text-black/70 dark:text-white/75 font-sans">
              Nombor Rujukan Perjanjian: <MiddleTruncate text={agreementRefCode} startChars={9} endChars={4} className="font-mono font-semibold" />
            </span>
          </div>

          <p>
            Perjanjian ini dimeterai antara <strong>HAB PEMBANGUNAN USAHAWAN BELIA KELANTAN (<span className="kbelia-acro">KBELIA</span>)</strong> (Pemberi Sewa) dan <strong>{booking.applicantName}</strong> bagi pihak <strong>{booking.businessName}</strong> (Penyewa Kiosk).
          </p>

          <ol className="list-decimal pl-4 space-y-2 text-[0.8125rem]">
            <li><strong>Premis:</strong> Kiosk Kapsul bertanda kod <strong>{booking.slotCode}</strong> bertempat di <strong>{booking.hubLocation}</strong>.</li>
            <li><strong>Kadar Sewa Bersubsidi:</strong> Kadar sewa bulanan adalah sebanyak <strong>RM {monthlyRate.toFixed(2)} sebulan</strong> (selepas penolakan subsidi tajaan dana usahawan belia negeri).</li>
            <li><strong>Tempoh Penyewaan &amp; Operasi:</strong> Tempoh penyewaan adalah selama <strong>{booking.durationMonths} bulan</strong> bermula dari tarikh mula operasi <strong>{formatDisplayDate(booking.startDate)}</strong> sehingga tarikh akhir beroperasi pada <strong>{calculateOperationEndDate(booking.startDate, booking.durationMonths)}</strong>.</li>
            <li><strong>Kebersihan &amp; Tatatertib:</strong> Penyewa wajib menjaga kebersihan ruang kiosk, mematuhi standard pensijilan Halal dan arahan pihak berkuasa tempatan (<span className="kbelia-acro">PBT</span>).</li>
            <li><strong>Hak Eksklusif:</strong> Kiosk ini tidak boleh disewakan kepada pihak ketiga (dilarang sewa atas sewa).</li>
          </ol>
        </div>

        {/* Signature Area */}
        <div className="mt-5 pt-4 border-t border-slate-300 dark:border-slate-600">
          {!isSigned ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-black dark:text-white flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-black dark:text-white/75" />
                  Tandatangan Digital
                </label>
                <button
                  type="button"
                  onClick={() =>
                    confirmDelete({
                      itemName: 'Tandatangan Digital Semasa',
                      itemType: 'Tandatangan Digital',
                      onConfirm: clearSignature
                    })
                  }
                  disabled={!hasSignature}
                  className="text-[0.8125rem] text-black dark:text-white hover:text-black disabled:opacity-40 font-medium flex items-center gap-1 cursor-pointer dark:hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" /> Padam Semula
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-900 p-1 flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full max-w-[480px] h-[120px] touch-none"
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-[0.8125rem] text-black/70 dark:text-white/75">
                  Tandatangan di atas mengesahkan persetujuan anda terhadap semua terma.
                </span>
                <button
                  type="button"
                  disabled={!hasSignature || isSaving}
                  onClick={handleConfirmSignature}
                  className={`py-2 px-5 text-sm shadow-sm ${roleTheme.primaryButtonClass}`}
                >
                  {isSaving ? 'Menyimpan...' : 'Meterai'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-black dark:text-white/75 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-black dark:text-white">
                Perjanjian Telah Ditandatangani & Dimeterai Secara Rasmi!
              </h4>
              <p className="text-[0.9375rem] text-black dark:text-white mt-0.5">
                Salinan digital telah disahkan dan disimpan di dalam Vault Dokumen Digital anda.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 mt-4">
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    try {
                      const html = generateTenancyAgreementOfficialHtml(booking, agreementRefCode, signedDateDisp, subsidyRate);
                      const ok = await downloadHtmlAsPdf(html, `Perjanjian_Sewa_Kiosk_${booking.slotCode}_${agreementRefCode}.pdf`);
                      if (ok) {
                        setIsDownloaded(true);
                        showToast({
                          type: 'success',
                          title: 'PDF Perjanjian Disimpan',
                          message: `Perjanjian sewa rasmi ${booking.slotCode} berjaya dimuat turun.`
                        });
                        setTimeout(() => setIsDownloaded(false), 2500);
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Gagal Menjana PDF',
                          message: 'Sila cuba butang Cetak sebagai alternatif.'
                        });
                      }
                    } finally {
                      setIsDownloadingPdf(false);
                    }
                  }}
                  className={roleTheme.compactSecondaryButtonClass}
                  title="Muat turun salinan PDF rasmi ber-letterhead"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPdf ? 'Menjana...' : isDownloaded ? 'Tersimpan' : 'Muat Turun PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsPrinting(true);
                    try {
                      const html = generateTenancyAgreementOfficialHtml(booking, agreementRefCode, signedDateDisp, subsidyRate);
                      await openAndPrintDocument(
                        html,
                        `Perjanjian_Sewa_Kiosk_${booking.slotCode}`
                      );
                    } catch {
                      showToast({
                        type: 'error',
                        title: 'Ralat Cetakan',
                        message: 'Gagal membuka tetingkap cetakan rasmi. Sila guna butang Muat Turun PDF.'
                      });
                    } finally {
                      setTimeout(() => setIsPrinting(false), 700);
                    }
                  }}
                  disabled={isPrinting}
                  className={roleTheme.compactPrimaryButtonClass}
                  title="Cetak Salinan Rasmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isPrinting ? 'Mencetak...' : 'Cetak'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={roleTheme.compactSecondaryButtonClass}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
