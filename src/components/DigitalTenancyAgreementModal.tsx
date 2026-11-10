import React, { useRef, useState } from 'react';
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
import { CapsuleBooking } from '../types';
import { maskMyKad } from '../utils/securityUtils';
import { openAndPrintDocument, printHtmlViaIframe, downloadHtmlDocument, formatDisplayDate, calculateOperationEndDate } from '../utils/printUtils';

interface DigitalTenancyAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: CapsuleBooking;
  onAgreementSigned?: (bookingId: string) => void;
}

export const DigitalTenancyAgreementModal: React.FC<DigitalTenancyAgreementModalProps> = ({
  isOpen,
  onClose,
  booking,
  onAgreementSigned
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const agreementRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen) return null;

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

  const handleConfirmSignature = () => {
    setIsSigned(true);
    if (onAgreementSigned) {
      onAgreementSigned(booking.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/60 dark:border-amber-500/30 scale-100 transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300/40 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Perjanjian Sewa Kiosk Digital Rasmi
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Pusat Keusahawanan Universiti Malaysia Kelantan (UMK) & Kerajaan Negeri Kelantan
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

        {/* Agreement Document Content */}
        <div ref={agreementRef} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-4 max-h-64 overflow-y-auto font-serif leading-relaxed">
          <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase font-sans">
              PERJANJIAN PENYEWAAN KIOSK KAPSUL USAHAWAN BELIA
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
              No. Rujukan Perjanjian: AGR-{booking.slotCode}-{new Date().getFullYear()}
            </span>
          </div>

          <p>
            Perjanjian ini dimeterai antara <strong>UNIVERSITI MALAYSIA KELANTAN & KERAJAAN NEGERI KELANTAN</strong> (Pemberi Sewa) dan <strong>{booking.applicantName}</strong> bagi pihak <strong>{booking.businessName}</strong> (Penyewa Kiosk).
          </p>

          <ol className="list-decimal pl-4 space-y-2 text-[11px]">
            <li><strong>Premis:</strong> Kiosk Kapsul bertanda kod <strong>{booking.slotCode}</strong> bertempat di <strong>{booking.hubLocation}</strong>.</li>
            <li><strong>Kadar Sewa Bersubsidi:</strong> Kadar sewa bulanan adalah sebanyak <strong>RM 150.00 sebulan</strong> (selepas penolakan subsidi 50% tajaan dana usahawan belia negeri).</li>
            <li><strong>Tempoh Penyewaan & Operasi:</strong> Tempoh penyewaan adalah selama <strong>{booking.durationMonths} bulan</strong> bermula dari tarikh mula operasi <strong>{formatDisplayDate(booking.startDate)}</strong> sehingga tarikh akhir beroperasi pada <strong>{calculateOperationEndDate(booking.startDate, booking.durationMonths)}</strong>.</li>
            <li><strong>Kebersihan & Tatatertib:</strong> Penyewa wajib menjaga kebersihan ruang kiosk, mematuhi standard pensijilan Halal dan arahan pihak berkuasa tempatan (PBT).</li>
            <li><strong>Hak Eksklusif:</strong> Kiosk ini tidak boleh disewakan kepada pihak ketiga (*strictly no Ali-Baba sub-leasing*).</li>
          </ol>
        </div>

        {/* Signature Area */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {!isSigned ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-600" />
                  Tandatangan Digital Penyewa (Gunakan Jari atau Tetikus):
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Padam Semula
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-950 p-1 flex justify-center">
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
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tandatangan di atas mengesahkan persetujuan anda terhadap semua terma.
                </span>
                <button
                  type="button"
                  disabled={!hasSignature}
                  onClick={handleConfirmSignature}
                  className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 transition-all shadow-sm"
                >
                  Sahkan & Meterai Perjanjian
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Perjanjian Telah Ditandatangani & Dimeterai Secara Rasmi!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
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
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Muat turun salinan perjanjian"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
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
                  className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Cetak Salinan Rasmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isPrinting ? 'Mencetak...' : 'Cetak Salinan Rasmi'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
