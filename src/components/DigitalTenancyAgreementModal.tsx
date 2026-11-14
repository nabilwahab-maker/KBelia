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
import { signBookingTenancyAgreement } from '../services/dataService';
import { showToast } from './ToastNotification';
import { openAndPrintDocument, downloadHtmlDocument, formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const agreementRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(Boolean(booking?.tenancySigned));
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { confirmDelete } = useConfirmDelete();

  useEffect(() => {
    if (isOpen) {
      setIsSigned(Boolean(booking?.tenancySigned));
      setHasSignature(false);
    }
  }, [isOpen, booking?.id, booking?.tenancySigned]);

  if (!isOpen) return null;

  const matchedSlot = slots.find(s => s.id === booking.slotId || s.code === booking.slotCode);
  const monthlyRate = booking.monthlyRate || matchedSlot?.monthlyRate || 150;

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
        <div className="kbelia-important-header px-6 sm:px-8 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/70 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Perjanjian Sewa Kiosk Digital Rasmi
              </h3>
              <span className="text-[11px] font-semibold text-black dark:text-white/75">
                Pusat Keusahawanan Universiti Malaysia Kelantan (UMK) & Kerajaan Negeri Kelantan
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-5 overflow-y-auto flex-1">

        {/* Agreement Document Content */}
        <div ref={agreementRef} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-black dark:text-white space-y-4 max-h-64 overflow-y-auto font-serif leading-relaxed">
          <div className="text-center pb-2 border-b border-slate-300 dark:border-slate-600">
            <h4 className="font-bold text-sm text-black dark:text-white uppercase font-sans">
              PERJANJIAN PENYEWAAN KIOSK KAPSUL USAHAWAN BELIA
            </h4>
            <span className="text-[10px] text-black/70 dark:text-white/75 font-sans">
              No. Rujukan Perjanjian: AGR-{booking.slotCode}-{new Date().getFullYear()}
            </span>
          </div>

          <p>
            Perjanjian ini dimeterai antara <strong>UNIVERSITI MALAYSIA KELANTAN & KERAJAAN NEGERI KELANTAN</strong> (Pemberi Sewa) dan <strong>{booking.applicantName}</strong> bagi pihak <strong>{booking.businessName}</strong> (Penyewa Kiosk).
          </p>

          <ol className="list-decimal pl-4 space-y-2 text-[11px]">
            <li><strong>Premis:</strong> Kiosk Kapsul bertanda kod <strong>{booking.slotCode}</strong> bertempat di <strong>{booking.hubLocation}</strong>.</li>
            <li><strong>Kadar Sewa Bersubsidi:</strong> Kadar sewa bulanan adalah sebanyak <strong>RM {monthlyRate.toFixed(2)} sebulan</strong> (selepas penolakan subsidi tajaan dana usahawan belia negeri).</li>
            <li><strong>Tempoh Penyewaan & Operasi:</strong> Tempoh penyewaan adalah selama <strong>{booking.durationMonths} bulan</strong> bermula dari tarikh mula operasi <strong>{formatDisplayDate(booking.startDate)}</strong> sehingga tarikh akhir beroperasi pada <strong>{calculateOperationEndDate(booking.startDate, booking.durationMonths)}</strong>.</li>
            <li><strong>Kebersihan & Tatatertib:</strong> Penyewa wajib menjaga kebersihan ruang kiosk, mematuhi standard pensijilan Halal dan arahan pihak berkuasa tempatan (PBT).</li>
            <li><strong>Hak Eksklusif:</strong> Kiosk ini tidak boleh disewakan kepada pihak ketiga (dilarang sewa atas sewa).</li>
          </ol>
        </div>

        {/* Signature Area */}
        <div className="mt-5 pt-4 border-t border-slate-300 dark:border-slate-600">
          {!isSigned ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-black dark:text-white/75" />
                  Tandatangan Digital Penyewa (Gunakan Jari atau Tetikus):
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
                  className="text-[11px] text-black dark:text-white hover:text-black disabled:opacity-40 font-medium flex items-center gap-1 cursor-pointer dark:hover:text-white"
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
                <span className="text-[11px] text-black/70 dark:text-white/75">
                  Tandatangan di atas mengesahkan persetujuan anda terhadap semua terma.
                </span>
                <button
                  type="button"
                  disabled={!hasSignature || isSaving}
                  onClick={handleConfirmSignature}
                  className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm cursor-pointer dark:bg-blue-600"
                >
                  {isSaving ? 'Menyimpan...' : 'Sahkan & Meterai Perjanjian'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-black dark:text-white/75 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-black dark:text-white">
                Perjanjian Telah Ditandatangani & Dimeterai Secara Rasmi!
              </h4>
              <p className="text-xs text-black dark:text-white mt-0.5">
                Salinan digital telah disahkan dan disimpan di dalam Vault Dokumen Digital anda.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (agreementRef.current) {
                      downloadHtmlDocument(
                        agreementRef.current.innerHTML,
                        `Perjanjian_Sewa_Kiosk_${booking.slotCode}`,
                        `Perjanjian Penyewaan Kiosk Kapsul - ${booking.slotCode}`
                      );
                      setIsDownloaded(true);
                      setTimeout(() => setIsDownloaded(false), 2500);
                    }
                  }}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Muat turun salinan perjanjian"
                >
                  <Download className="w-3.5 h-3.5 text-black dark:text-white/75" />
                  <span>{isDownloaded ? 'Tersimpan!' : 'Muat Turun Fail'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsPrinting(true);
                    if (agreementRef.current) {
                      await openAndPrintDocument(
                        agreementRef.current.innerHTML,
                        `Perjanjian_Sewa_Kiosk_${booking.slotCode}`
                      );
                    } else {
                      window.print();
                    }
                    setTimeout(() => setIsPrinting(false), 700);
                  }}
                  disabled={isPrinting}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm dark:bg-rose-600"
                  title="Cetak Salinan Rasmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isPrinting ? 'Mencetak...' : 'Cetak Salinan Rasmi'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Selesai
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
