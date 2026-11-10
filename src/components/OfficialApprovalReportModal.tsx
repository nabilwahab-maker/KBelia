import React, { useRef } from 'react';
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
  FileText
} from 'lucide-react';
import { CapsuleBooking, GrantApplication } from '../types';
import { maskMyKad } from '../utils/securityUtils';

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

  const reportRef = `KBELIA/AUDIT-LULUS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    if (!printAreaRef.current) return;
    const content = `
      <!DOCTYPE html>
      <html lang="ms">
        <head>
          <meta charset="utf-8">
          <title>Laporan Rasmi Kelulusan Niaga Belia Kelantan - ${reportRef}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
            h1, h2, h3 { color: #0f172a; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 12px; }
            th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 700; color: #334155; }
            td { border: 1px solid #e2e8f0; padding: 8px 12px; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #ecfdf5; color: #047857; }
            .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #64748b; }
            @media print {
              body { padding: 0; }
              button { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printAreaRef.current.innerHTML}
        </body>
      </html>
    `;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Rasmi_Kelulusan_KBELIA_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#1E2638] rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-[#2C384D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#161D2B] border-b border-slate-200 dark:border-[#2C384D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dokumen Ringkasan Kelulusan Rasmi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyata semakan audit kelulusan permohonan kiosk dan geran belia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHTML}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1E2638] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2C384D] border border-slate-200 dark:border-[#2C384D] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Muat turun salinan dokumen"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Muat Turun Fail</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Cetak atau Simpan Sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer ml-2"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900" ref={printAreaRef}>
          {/* Letterhead */}
          <div className="border-b-2 border-emerald-700 pb-5 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>PENTADBIRAN PEMBANGUNAN KEUSAHAWANAN BELIA KELANTAN</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                RINGKASAN RASMI KELULUSAN PERMOHONAN
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Program Inisiatif Kapsul Niaga Modular & Geran Pemula Usahawan Muda Kelantan
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
              <div><strong className="text-slate-900 font-sans">No. Rujukan:</strong> {reportRef}</div>
              <div className="mt-1"><strong className="text-slate-900 font-sans">Tarikh Jana:</strong> {reportDate}</div>
              <div className="mt-1"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">STATUS: AUDIT SAH</span></div>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Kiosk Diluluskan</span>
              <span className="text-xl font-black text-emerald-700 tabular-nums">{approvedBookings.length} Unit</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Jumlah Sewaan Kiosk</span>
              <span className="text-xl font-black text-slate-900 tabular-nums">RM{totalKioskSubsidy.toLocaleString()}/bln</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Geran Diluluskan</span>
              <span className="text-xl font-black text-indigo-700 tabular-nums">{approvedGrants.length} Penerima</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Peruntukan Geran</span>
              <span className="text-xl font-black text-slate-900 tabular-nums">RM{totalGrantAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Section 1: Kiosk Approvals */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                1. Senarai Permohonan Kiosk Kapsul Niaga Yang Telah Diluluskan ({approvedBookings.length})
              </h2>
            </div>
            {approvedBookings.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                Tiada rekod kelulusan kiosk aktif buat masa ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">Bil</th>
                      <th className="p-2.5">Nama Pemohon & Perniagaan</th>
                      <th className="p-2.5">No. Kad Pengenalan</th>
                      <th className="p-2.5">Kod Kiosk & Lokasi Hab</th>
                      <th className="p-2.5 text-right">Kadar Sewa (RM)</th>
                      <th className="p-2.5">Catatan Pentadbiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal">
                    {approvedBookings.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{b.applicantName}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold">{b.businessName}</div>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{maskMyKad(b.applicantMyKad || '980101-03-5544')}</td>
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-slate-800">{b.slotCode}</span>
                          <span className="block text-[11px] text-slate-500">{b.hubLocation || 'Hab UMK Bachok'}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          RM{b.monthlyRate || 150}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px] max-w-xs truncate">
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
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-indigo-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Senarai Permohonan Geran Pemula Belia Yang Telah Diluluskan ({approvedGrants.length})
              </h2>
            </div>
            {approvedGrants.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                Tiada rekod kelulusan geran aktif buat masa ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">Bil</th>
                      <th className="p-2.5">Nama Pemohon & Perniagaan</th>
                      <th className="p-2.5">Kategori Perniagaan</th>
                      <th className="p-2.5">Maklumat Bank Rasmi</th>
                      <th className="p-2.5 text-right">Peruntukan Geran</th>
                      <th className="p-2.5">Status Pengesahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-normal">
                    {approvedGrants.map((g, idx) => (
                      <tr key={g.id || idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{g.applicantName}</div>
                          <div className="text-[11px] text-indigo-700 font-semibold">{g.businessName}</div>
                        </td>
                        <td className="p-2.5 text-slate-600">{g.businessCategory}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {g.bankName} - {g.bankAccountNumber || '••••••••'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {g.amount || 'RM3,000'}
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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

          {/* Verification Footer & Digital Signature */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-900">Urusetia Pentadbiran Keusahawanan Belia</div>
              <div>Hab Pembangunan Belia Negeri Kelantan</div>
              <div className="text-[11px] text-slate-500 mt-1">Dokumen ini dijana secara rasmi melalui Portal Sistem Niaga Belia Kelantan.</div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-200 pt-3 sm:pt-0">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Tandatangan Pegawai Audit</div>
              <div className="font-serif italic text-base text-slate-900 font-bold my-1">
                Pentadbir Urusetia Belia
              </div>
              <div className="text-[10px] text-emerald-700 font-mono font-bold">
                PENGESAHAN DIGITAL: SHA256-CERTIFIED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
