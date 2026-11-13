import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Store, 
  Building2,
  Calendar,
  FileText,
  Loader2,
  ChevronDown,
  FileDown
} from 'lucide-react';
import { CapsuleBooking, GrantApplication } from '../types';
import { maskMyKad } from '../utils/securityUtils';
import { 
  downloadOfficialApprovalReportPdf, 
  generateOfficialApprovalReportHtml 
} from '../utils/pdfGenerator';
import { openAndPrintDocument } from '../utils/printUtils';

interface OfficialApprovalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
}

export const OfficialApprovalReportModal: React.FC<OfficialApprovalReportModalProps> = ({
  isOpen,
  onClose,
  bookings = [],
  grantApplications = []
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!isOpen) return null;

  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const approvedGrants = grantApplications.filter(g => g.status === 'approved');

  const totalKioskSubsidy = approvedBookings.reduce((sum, b) => sum + (b.monthlyRate || 150), 0);
  const totalGrantAmount = approvedGrants.reduce((sum, g) => {
    const rawVal = g.amount ? parseFloat(g.amount.replace(/[^0-9.]/g, '')) : 3000;
    return sum + (isNaN(rawVal) ? 3000 : rawVal);
  }, 0);

  const reportDate = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const reportRef = `KBelia/AUDIT-LULUS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  // Direct High-Resolution PDF Download with Royal Frame
  const handleSavePdf = async () => {
    setIsProcessing(true);
    setShowMenu(false);
    try {
      const ok = await downloadOfficialApprovalReportPdf({
        bookings,
        grantApplications,
        reportRef,
        reportDate
      });
      if (ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 4000);
      }
    } catch (err) {
      console.error('Ralat menjana fail PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Print Window with Royal Frame
  const handlePrint = async () => {
    setIsProcessing(true);
    setShowMenu(false);
    try {
      const html = generateOfficialApprovalReportHtml({
        bookings,
        grantApplications,
        reportRef,
        reportDate
      });
      await openAndPrintDocument(html, `Laporan_Rasmi_Kelulusan_KBelia_${reportRef.replace(/[^a-zA-Z0-9]/g, '_')}`);
    } catch {
      window.print();
    } finally {
      setTimeout(() => setIsProcessing(false), 800);
    }
  };

  // Combined action: Saves official PDF file & opens print preview with royal border
  const handleSaveAndPrint = async () => {
    setIsProcessing(true);
    setShowMenu(false);
    try {
      await downloadOfficialApprovalReportPdf({
        bookings,
        grantApplications,
        reportRef,
        reportDate
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);

      const html = generateOfficialApprovalReportHtml({
        bookings,
        grantApplications,
        reportRef,
        reportDate
      });
      setTimeout(async () => {
        await openAndPrintDocument(html, `Laporan_Rasmi_Kelulusan_KBelia_${reportRef.replace(/[^a-zA-Z0-9]/g, '_')}`);
      }, 300);
    } catch (err) {
      console.error('Ralat memproses dokumen:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="kbelia-important-header px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Dokumen Ringkasan Kelulusan Rasmi
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Penyata semakan audit kelulusan permohonan kiosk dan geran belia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Unified and Fixed "Cetak / Simpan PDF" Action with Royal Border */}
            <div className="relative inline-flex items-center shadow-xs rounded-xl">
              <button
                type="button"
                onClick={handleSaveAndPrint}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-l-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                title="Cetak atau simpan sebagai dokumen PDF rasmi dengan bingkai keselamatan"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                    <span>Menjana PDF Rasmi...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>PDF Berjaya Disimpan!</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-sky-100" />
                    <span>Cetak / Simpan PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                disabled={isProcessing}
                className="px-2 py-2 rounded-r-xl border-l border-sky-500 bg-sky-700 hover:bg-sky-800 text-white transition-colors cursor-pointer"
                title="Pilihan Format Cetak & Simpan"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Sub-menu Dropdown */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in">
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <div className="font-bold">Muat Turun Fail PDF (.pdf)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Bingkai keselamatan rasmi A4</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <div>
                      <div className="font-bold">Buka Dialog Cetakan (A4)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Cetak pencetak atau cetak ke PDF</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Document Body with Professional Royal Border */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-900/60 flex justify-center">
          {/* Framed Official Document Sheet with Royal Kelantan Double Border & Gold Inset */}
          <div 
            ref={printAreaRef}
            id="official-approval-document"
            className="w-full max-w-3xl bg-white text-slate-900 shadow-xl relative"
            style={{
              padding: '6px',
              border: '3.5px solid #065f46',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Inner Gold Border & Content Container */}
            <div 
              className="relative p-5 sm:p-8"
              style={{
                border: '1.5px solid #d97706',
                backgroundColor: '#ffffff'
              }}
            >
              {/* 4 Corner Security Brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-800" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-800" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-800" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-800" />

              {/* Letterhead */}
              <div className="border-b-2 border-emerald-800 pb-4 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>KERAJAAN NEGERI KELANTAN · UNIVERSITI MALAYSIA KELANTAN (UMK)</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight">
                    RINGKASAN RASMI KELULUSAN PERMOHONAN
                  </h1>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Program Inisiatif Kapsul Niaga Modular & Geran Pemula Usahawan Muda Kelantan
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
                  <div><strong className="text-slate-900 font-sans text-[10px]">No. Rujukan:</strong> <span className="font-bold text-emerald-800">{reportRef}</span></div>
                  <div className="mt-1"><strong className="text-slate-900 font-sans text-[10px]">Tarikh Jana:</strong> {reportDate}</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      STATUS: AUDIT SAH DILULUSKAN
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Overview KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Kiosk Diluluskan</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 tabular-nums">{approvedBookings.length} Unit</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Jumlah Sewaan Kiosk</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">RM{totalKioskSubsidy.toLocaleString()}/bln</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Geran Diluluskan</span>
                  <span className="text-base sm:text-lg font-black text-sky-700 tabular-nums">{approvedGrants.length} Penerima</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Peruntukan Geran</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">RM{totalGrantAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Section 1: Kiosk Approvals */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    1. Senarai Permohonan Kiosk Kapsul Niaga Yang Telah Diluluskan ({approvedBookings.length})
                  </h2>
                </div>
                {approvedBookings.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                    Tiada rekod kelulusan kiosk aktif buat masa ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 text-center w-8">Bil</th>
                          <th className="p-2">Nama Pemohon & Perniagaan</th>
                          <th className="p-2">No. Kad Pengenalan</th>
                          <th className="p-2">Kod Kiosk & Hab</th>
                          <th className="p-2 text-right">Kadar Sewa</th>
                          <th className="p-2">Catatan Pentadbiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-normal">
                        {approvedBookings.map((b, idx) => (
                          <tr key={b.id || idx} className="hover:bg-slate-50/80">
                            <td className="p-2 text-slate-500 font-mono text-center">{idx + 1}</td>
                            <td className="p-2">
                              <div className="font-bold text-slate-900">{b.applicantName}</div>
                              <div className="text-[10.5px] text-emerald-700 font-semibold">{b.businessName}</div>
                            </td>
                            <td className="p-2 font-mono text-slate-600 text-[11px]">{maskMyKad(b.applicantMyKad || '980101-03-5544')}</td>
                            <td className="p-2">
                              <span className="font-mono font-bold text-slate-800">{b.slotCode}</span>
                              <span className="block text-[10px] text-slate-500">{b.hubLocation || 'Hab UMK Bachok'}</span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              RM{b.monthlyRate || 150}
                            </td>
                            <td className="p-2 text-slate-600 text-[10.5px] max-w-xs">
                              {b.adminNotes || 'Permohonan diluluskan rasmi.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Grant Approvals */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <Award className="w-4 h-4 text-sky-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                    2. Senarai Permohonan Geran Pemula Belia Yang Telah Diluluskan ({approvedGrants.length})
                  </h2>
                </div>
                {approvedGrants.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                    Tiada rekod kelulusan geran aktif buat masa ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 text-center w-8">Bil</th>
                          <th className="p-2">Nama Pemohon & Perniagaan</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2">Maklumat Bank Rasmi</th>
                          <th className="p-2 text-right">Peruntukan Geran</th>
                          <th className="p-2 text-center">Status Pengesahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-normal">
                        {approvedGrants.map((g, idx) => (
                          <tr key={g.id || idx} className="hover:bg-slate-50/80">
                            <td className="p-2 text-slate-500 font-mono text-center">{idx + 1}</td>
                            <td className="p-2">
                              <div className="font-bold text-slate-900">{g.applicantName}</div>
                              <div className="text-[10.5px] text-sky-700 font-semibold">{g.businessName}</div>
                            </td>
                            <td className="p-2 text-slate-600 text-[11px]">{g.businessCategory}</td>
                            <td className="p-2 font-mono text-[10.5px] text-slate-600">
                              {g.bankName} - {g.bankAccountNumber || '••••••••'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {g.amount || 'RM3,000'}
                            </td>
                            <td className="p-2 text-center">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Lulus Audit
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Verification Footer & Official Digital Seal */}
              <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-5 text-xs text-slate-600">
                <div className="flex-1">
                  <div className="font-bold text-slate-900">Urusetia Pentadbiran Keusahawanan Belia</div>
                  <div className="text-[11px] text-slate-500">Hab Pembangunan Belia Negeri Kelantan bersama UMK</div>
                  <div className="text-[10px] text-slate-400 mt-1">Dokumen ini dijana secara rasmi melalui Portal Sistem Niaga Belia Kelantan.</div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Official Circular Stamp */}
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-700 flex flex-col items-center justify-center text-center p-1 text-emerald-800 text-[7px] font-extrabold leading-tight -rotate-6 bg-emerald-50/50">
                    <div>★ KERAJAAN NEGERI ★</div>
                    <div className="text-[8px] font-black my-0.5">AUDIT SAH</div>
                    <div>NEGERI KELANTAN</div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200 pt-2 sm:pt-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tandatangan Pegawai Audit</div>
                    <div className="font-serif italic text-base text-slate-900 font-bold my-0.5">
                      Pentadbir Urusetia Belia
                    </div>
                    <div className="text-[9px] text-emerald-700 font-mono font-bold">
                      PENGESAHAN DIGITAL: SHA256-CERTIFIED
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal disclaimer bottom strip */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>DOKUMEN RASMI KERAJAAN NEGERI KELANTAN · SALINAN SAH DIPERAKUI</span>
                <span>KOD PENGESAHAN: KBN-AUDIT-LULUS-2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
