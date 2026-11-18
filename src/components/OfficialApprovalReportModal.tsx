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
import { showToast } from './ToastNotification';

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
    const rawStr = g.amount || g.grantAmount || '3000';
    const rawVal = parseFloat(String(rawStr).replace(/[^0-9.]/g, ''));
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
      showToast({
        type: 'error',
        title: 'Ralat Cetakan',
        message: 'Gagal membuka tetingkap cetakan rasmi. Sila gunakan pilihan Muat Turun PDF.'
      });
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full border border-slate-300 dark:border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="kbelia-important-header px-5 py-4 border-b border-slate-300 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white">
                Dokumen Ringkasan Kelulusan Rasmi
              </h3>
              <p className="text-[0.8125rem] sm:text-sm text-black/70 dark:text-white/75">
                Penyata semakan audit kelulusan permohonan kiosk dan geran belia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Unified and Fixed "Cetak / Simpan PDF" Action with Royal Border */}
            <div className="relative inline-flex items-center shadow-xs rounded-xl">
              <button
                type="button"
                onClick={handleSaveAndPrint}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-l-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-75 dark:bg-indigo-600"
                title="Cetak atau simpan sebagai dokumen PDF rasmi dengan bingkai keselamatan"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menjana PDF...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>PDF Disimpan</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-white" />
                    <span>Simpan PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                disabled={isProcessing}
                className="px-2 py-2 rounded-r-xl border-l border-blue-600 bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                title="Pilihan Format Cetak & Simpan"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Sub-menu Dropdown */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-300 dark:border-slate-600 py-1.5 z-50 animate-in fade-in">
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    className="w-full text-left px-3.5 py-2.5 text-sm font-medium text-black dark:text-white hover:bg-amber-50 dark:hover:bg-indigo-600 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-black dark:text-white/75" />
                    <div>
                      <div className="font-bold">Muat Turun PDF</div>
                      <div className="text-[0.8125rem] text-black/70 dark:text-white/75">Bingkai keselamatan A4</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full text-left px-3.5 py-2.5 text-sm font-medium text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-t border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-black dark:text-white" />
                    <div>
                      <div className="font-bold">Cetak A4</div>
                      <div className="text-[0.8125rem] text-black/70 dark:text-white/75">Dialog cetakan</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Document Body with Professional Royal Border */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-900 flex justify-center">
          {/* Framed Official Document Sheet with Royal Kelantan Double Border & Gold Inset */}
          <div 
            ref={printAreaRef}
            id="official-approval-document"
            className="w-full max-w-3xl bg-white text-black shadow-xl relative"
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
                  <div className="flex items-center gap-2 text-[0.8125rem] font-extrabold uppercase tracking-widest text-black">
                    <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                    <span>HAB USAHAWAN BELIA KELANTAN · PORTAL KBELIA</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-black mt-1 tracking-tight">
                    RINGKASAN RASMI KELULUSAN PERMOHONAN
                  </h1>
                  <p className="text-[0.9375rem] sm:text-sm text-black mt-0.5">
                    Program Inisiatif Kapsul Niaga Modular & Geran Pemula Usahawan Muda Kelantan
                  </p>
                </div>
                <div className="text-left sm:text-right text-[0.8125rem] text-black font-mono bg-slate-50 p-3 rounded-lg border border-slate-300 shrink-0">
                  <div><strong className="text-black font-sans text-sm">No. Rujukan:</strong> <span className="font-bold text-black">{reportRef}</span></div>
                  <div className="mt-1"><strong className="text-black font-sans text-sm">Tarikh Jana:</strong> {reportDate}</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[0.8125rem] font-bold bg-emerald-100 text-black border border-emerald-200">
                      STATUS: AUDIT SAH DILULUSKAN
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Overview KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                  <span className="text-[0.8125rem] font-bold text-black/75 uppercase block">Kiosk Diluluskan</span>
                  <span className="text-lg sm:text-xl font-black text-black tabular-nums">{approvedBookings.length} Unit</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                  <span className="text-[0.8125rem] font-bold text-black/75 uppercase block">Jumlah Sewaan Kiosk</span>
                  <span className="text-lg sm:text-xl font-black text-black tabular-nums">RM{totalKioskSubsidy.toLocaleString()}/bln</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                  <span className="text-[0.8125rem] font-bold text-black/75 uppercase block">Geran Diluluskan</span>
                  <span className="text-lg sm:text-xl font-black text-black tabular-nums">{approvedGrants.length} Penerima</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                  <span className="text-[0.8125rem] font-bold text-black/75 uppercase block">Peruntukan Geran</span>
                  <span className="text-lg sm:text-xl font-black text-black tabular-nums">RM{totalGrantAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Section 1: Kiosk Approvals */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <Store className="w-4 h-4 text-black" />
                  <h2 className="text-[0.8125rem] font-bold uppercase tracking-wider text-black">
                    1. Senarai Permohonan Kiosk Kapsul Niaga Yang Telah Diluluskan ({approvedBookings.length})
                  </h2>
                </div>
                {approvedBookings.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 text-sm text-black/70 text-center">
                    Tiada rekod kelulusan kiosk aktif buat masa ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-[0.8125rem] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-black font-bold border-b border-slate-300 text-sm">
                          <th className="p-2.5 text-center w-8">Bil</th>
                          <th className="p-2.5">Nama Pemohon & Perniagaan</th>
                          <th className="p-2.5">No. Kad Pengenalan</th>
                          <th className="p-2.5">Kod Kiosk & Hab</th>
                          <th className="p-2.5 text-right">Kadar Sewa</th>
                          <th className="p-2.5">Catatan Pentadbiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-normal">
                        {approvedBookings.map((b, idx) => (
                          <tr key={b.id || idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-black/75 font-mono text-center">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-bold text-black">{b.applicantName}</div>
                              <div className="text-sm text-black font-semibold">{b.businessName}</div>
                            </td>
                            <td className="p-2.5 font-mono text-black text-[0.9375rem]">{b.applicantMyKad ? maskMyKad(b.applicantMyKad) : 'Tidak Dinyatakan'}</td>
                            <td className="p-2.5">
                              <span className="font-mono font-bold text-black">{b.slotCode}</span>
                              <span className="block text-sm text-black/75">{b.hubLocation || 'Hab Usahawan Bachok'}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-black">
                              RM{b.monthlyRate || 150}
                            </td>
                            <td className="p-2.5 text-black text-[0.9375rem] max-w-xs">
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
                  <Award className="w-4 h-4 text-black" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                    2. Senarai Permohonan Geran Pemula Belia Yang Telah Diluluskan ({approvedGrants.length})
                  </h2>
                </div>
                {approvedGrants.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 text-sm text-black/70 text-center">
                    Tiada rekod kelulusan geran aktif buat masa ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-[0.8125rem] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-black font-bold border-b border-slate-300 text-sm">
                          <th className="p-2.5 text-center w-8">Bil</th>
                          <th className="p-2.5">Nama Pemohon & Perniagaan</th>
                          <th className="p-2.5">Kategori</th>
                          <th className="p-2.5">Maklumat Bank Rasmi</th>
                          <th className="p-2.5 text-right">Peruntukan Geran</th>
                          <th className="p-2.5 text-center">Status Pengesahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-normal">
                        {approvedGrants.map((g, idx) => (
                          <tr key={g.id || idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-black/75 font-mono text-center">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-bold text-black">{g.applicantName}</div>
                              <div className="text-sm text-black font-semibold">{g.businessName}</div>
                            </td>
                            <td className="p-2.5 text-black text-[0.9375rem]">{g.businessCategory}</td>
                            <td className="p-2.5 font-mono text-[0.9375rem] text-black">
                              {g.bankName} - {g.bankAccountNumber || '••••••••'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-black">
                              {g.amount || g.grantAmount || 'RM3,000'}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex items-center gap-1 text-[0.8125rem] font-bold text-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-black" />
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
              <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-5 text-sm text-black">
                <div className="flex-1">
                  <div className="font-bold text-black text-[0.9375rem]">Urusetia Pentadbiran Keusahawanan Belia</div>
                  <div className="text-sm text-black/75">Hab Pembangunan Usahawan Belia Kelantan (KBelia)</div>
                  <div className="text-[0.8125rem] text-black/70 mt-1">Dokumen ini dijana secara rasmi melalui Portal Sistem Niaga Belia Kelantan.</div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Official Circular Stamp */}
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-700 flex flex-col items-center justify-center text-center p-1.5 text-black text-[0.8125rem] font-extrabold leading-tight -rotate-6 bg-emerald-50/50 shrink-0">
                    <div>KERAJAAN NEGERI</div>
                    <div className="text-sm font-black my-0.5">AUDIT SAH</div>
                    <div>KELANTAN</div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-300 pt-2 sm:pt-0">
                    <div className="text-[0.8125rem] text-black/70 uppercase tracking-wider font-semibold">Tandatangan Pegawai Audit</div>
                    <div className="font-serif italic text-base text-black font-bold my-0.5">
                      Pentadbir Urusetia Belia
                    </div>
                    <div className="text-[0.8125rem] text-black font-mono font-bold">
                      PENGESAHAN DIGITAL: SHA256-VERIFIED
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal disclaimer bottom strip */}
              <div className="mt-3 pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] text-black/70 font-mono">
                <span>DOKUMEN RASMI KERAJAAN NEGERI KELANTAN · SALINAN SAH DIPERAKUI</span>
                <span>KOD PENGESAHAN: KBN-AUDIT-LULUS-{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
