import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Lock,
  Search,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import { BusinessListing, CapsuleBooking, GrantApplication, GrantEndorsement } from '../types';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  copyToClipboard,
  escapeHtml,
  buildKbeliaCrestSvg,
  buildWatermarkSvg,
  buildDigitalSealHtml
} from '../utils/printUtils';
import {
  buildVerificationQrPayload,
  computeIntegrityChecksum,
  generateQrSvgString
} from '../utils/qrUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { maskMyKad } from '../utils/securityUtils';
import { AcronymText, MiddleTruncate } from './TypographyPrimitives';
import { QrCodeGraphic } from './QrCodeGraphic';
import { showToast } from './ToastNotification';

interface PublicVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRefCode?: string;
  bookings?: CapsuleBooking[];
  businesses?: BusinessListing[];
  grantApplications?: GrantApplication[];
  grantEndorsements?: GrantEndorsement[];
}

interface VerifiedRecordState {
  refCode: string;
  status: 'valid' | 'invalid';
  recipient: string;
  kioskLocation: string;
  district: string;
  rate: string;
  issueDate: string;
  expiryDate: string;
  issuer: string;
}

const generateVerificationSlipHtml = (record: VerifiedRecordState): string => {
  const qrPayload = buildVerificationQrPayload(record.refCode);
  const qrSvg = generateQrSvgString(qrPayload, {
    size: 86,
    darkColor: '#0F172A',
    lightColor: '#FFFFFF',
    includeMonogram: true,
    monogramText: 'KB'
  });
  const checksum = computeIntegrityChecksum(record.refCode);
  const printedDate = formatDisplayDate(new Date().toISOString().split('T')[0]);

  return `<!DOCTYPE html>
  <html lang="ms">
    <head>
      <meta charset="utf-8" />
      <title>Pengesahan Ketulenan Dokumen - ${escapeHtml(record.refCode)}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #0F172A; background: #FFFFFF; margin: 0; padding: 14px; }
        .document-page { max-width: 780px; margin: 0 auto; border: 3.5px solid #1E3A8A; padding: 5px; background: #FFFFFF; }
        .doc-inner { border: 1.5px solid #B45309; padding: 24px 28px; position: relative; overflow: hidden; }
        .corner { position: absolute; width: 16px; height: 16px; }
        .c-tl { top: -1px; left: -1px; border-top: 3.5px solid #1E3A8A; border-left: 3.5px solid #1E3A8A; }
        .c-tr { top: -1px; right: -1px; border-top: 3.5px solid #1E3A8A; border-right: 3.5px solid #1E3A8A; }
        .c-bl { bottom: -1px; left: -1px; border-bottom: 3.5px solid #1E3A8A; border-left: 3.5px solid #1E3A8A; }
        .c-br { bottom: -1px; right: -1px; border-bottom: 3.5px solid #1E3A8A; border-right: 3.5px solid #1E3A8A; }
        .doc-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.045; pointer-events: none; z-index: 0; }
        .content { position: relative; z-index: 1; }
        .header { border-bottom: 2.5px solid #1E3A8A; padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 14px 0 18px; font-size: 12.5px; border: 1px solid #CBD5E1; }
        .info-table th { background: #F8FAFC; border: 1px solid #CBD5E1; padding: 8px 11px; text-align: left; width: 34%; color: #1E293B; }
        .info-table td { border: 1px solid #CBD5E1; padding: 8px 11px; color: #0F172A; }
        .digital-seal-stamp { width: 82px; height: 82px; border: 2px solid #1E3A8A; border-radius: 50%; padding: 3px; display: flex; align-items: center; justify-content: center; transform: rotate(-6deg); }
        .digital-seal-inner { width: 100%; height: 100%; border: 1px dashed #B45309; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4px; }
        .seal-top { font-size: 6.5px; font-weight: 800; color: #1E3A8A; }
        .seal-mid { font-size: 9px; font-weight: 900; color: #B45309; margin: 2px 0; }
        .seal-bot { font-size: 6px; font-weight: 700; color: #475569; }
      </style>
    </head>
    <body>
      <div class="document-page">
        <div class="doc-inner">
          <div class="corner c-tl"></div><div class="corner c-tr"></div><div class="corner c-bl"></div><div class="corner c-br"></div>
          ${buildWatermarkSvg()}
          <div class="content">
            <div class="header">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                ${buildKbeliaCrestSvg(46)}
                <div>
                  <div style="font-size:10px;font-weight:800;letter-spacing:1.3px;color:#B45309;text-transform:uppercase;">SISTEM SEMAKAN KETULENAN AWAM KBELIA</div>
                  <div style="font-size:17px;font-weight:900;color:#0F172A;margin-top:2px;">PENYATA PENGESAHAN DOKUMEN RASMI</div>
                  <div style="font-size:11.5px;color:#475569;margin-top:3px;">Hab Pembangunan Usahawan Belia Kelantan (KBelia)</div>
                </div>
              </div>
              <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-top:3px solid #B45309;padding:8px 12px;text-align:right;font-size:11px;">
                <div style="color:#64748B;font-size:9.5px;font-weight:800;">NO. RUJUKAN</div>
                <div style="font-family:monospace;font-weight:800;color:#0F172A;">${escapeHtml(record.refCode)}</div>
                <div style="color:#64748B;font-size:9.5px;font-weight:800;margin-top:4px;">TARIKH SEMAKAN</div>
                <div style="font-weight:700;color:#0F172A;">${escapeHtml(printedDate)}</div>
              </div>
            </div>

            <div style="border-left:4px solid #1E3A8A;background:#F8FAFC;padding:10px 14px;margin-bottom:14px;">
              <div style="font-size:10px;font-weight:800;color:#1E3A8A;letter-spacing:0.8px;">KEPUTUSAN PENGESAHAN DIGITAL</div>
              <div style="font-size:14px;font-weight:900;color:#0F172A;margin-top:2px;">DOKUMEN RASMI DIIKTIRAF &amp; SAH DALAM PANGKALAN DATA NEGERI</div>
            </div>

            <table class="info-table">
              <tr><th>Nombor Siri Rujukan</th><td><strong style="font-family:monospace;">${escapeHtml(record.refCode)}</strong></td></tr>
              <tr><th>Nama Penerima / Pemilik</th><td><strong>${escapeHtml(record.recipient)}</strong></td></tr>
              <tr><th>Premis / Program / Alamat</th><td>${escapeHtml(record.kioskLocation)}</td></tr>
              <tr><th>Perniagaan / Daerah</th><td>${escapeHtml(record.district)}</td></tr>
              <tr><th>Butiran / Peruntukan</th><td><strong>${escapeHtml(record.rate)}</strong></td></tr>
              <tr><th>Tempoh Sah / Tarikh</th><td>${escapeHtml(record.issueDate)} hingga ${escapeHtml(record.expiryDate)}</td></tr>
              <tr><th>Pihak Berkuasa Pengeluar</th><td>${escapeHtml(record.issuer)}</td></tr>
            </table>

            <div style="border-top:2px solid #CBD5E1;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end;gap:14px;">
              <div style="display:flex;align-items:center;gap:12px;background:#F8FAFC;border:1px solid #CBD5E1;padding:8px 12px;">
                <div style="padding:3px;background:#FFFFFF;border:1px solid #CBD5E1;line-height:0;">${qrSvg}</div>
                <div style="font-size:10.5px;color:#475569;line-height:1.4;">
                  <div style="font-weight:800;color:#1E3A8A;text-transform:uppercase;">KOD QR SEMAKAN SEGERA</div>
                  <div>Imbas untuk semakan dalam talian Portal KBelia.</div>
                  <div style="font-family:monospace;font-weight:700;color:#0F172A;margin-top:3px;">DIGEST: ${checksum}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:14px;">
                ${buildDigitalSealHtml('SAH BERAUDIT')}
                <div style="text-align:right;">
                  <div style="font-size:10px;font-weight:700;color:#64748B;">UNIT PENGESAHAN DIGITAL</div>
                  <div style="font-size:12px;font-weight:800;color:#0F172A;margin-top:4px;">PORTAL KBELIA KELANTAN</div>
                  <div style="font-size:10px;color:#475569;">Mematuhi Piawaian PDPA 2010</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  isOpen,
  onClose,
  defaultRefCode = '',
  bookings = [],
  businesses = [],
  grantApplications = [],
  grantEndorsements = []
}) => {
  const [inputRef, setInputRef] = useState(defaultRefCode);
  const [verifiedRecord, setVerifiedRecord] = useState<VerifiedRecordState | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const performLookup = (rawQuery: string): VerifiedRecordState | null => {
    const q = rawQuery.trim().toUpperCase();
    if (!q) return null;

    // 1. Match against real approved bookings (by booking id, slotCode, KBN-*, or AGR-*)
    const matchedBooking = bookings.find(b => {
      if (b.status !== 'approved') return false;
      const code = (b.slotCode || '').trim().toUpperCase();
      const shortCode = code.replace('CAP-', '');
      const year = new Date(b.createdAt || Date.now()).getFullYear();
      const candidates = [
        b.id.toUpperCase(),
        ...(code ? [
          code,
          `KBN-${code}`,
          `KBN-${code}-${year}-8819`,
          `KBN-${shortCode}-${year}-8819`,
          `AGR-${code}-${year}`
        ] : [])
      ];
      return candidates.some(c => Boolean(c) && c === q);
    });

    if (matchedBooking) {
      const rateVal = matchedBooking.monthlyRate || 150;
      return {
        refCode: q,
        status: 'valid',
        recipient: `${matchedBooking.applicantName}${matchedBooking.applicantMyKad ? ` (${maskMyKad(matchedBooking.applicantMyKad)})` : ''}`,
        kioskLocation: `${matchedBooking.hubLocation} (${matchedBooking.slotCode})`,
        district: matchedBooking.businessName,
        rate: `RM ${rateVal}/bulan (Subsidi KBelia)`,
        issueDate: formatDisplayDate(matchedBooking.startDate),
        expiryDate: calculateOperationEndDate(matchedBooking.startDate, matchedBooking.durationMonths),
        issuer: 'Hab Pembangunan Usahawan Belia Kelantan (KBelia)'
      };
    }

    // 2. Match against approved grants
    const matchedGrant = grantApplications.find(g => {
      if (g.status !== 'approved') return false;
      const gid = (g.id || '').toUpperCase();
      const candidates = [
        gid,
        `GRT-${gid.slice(0, 8)}`,
        `GRT-${gid.slice(0, 12)}`
      ];
      return candidates.some(c => Boolean(c) && c === q);
    });

    if (matchedGrant) {
      return {
        refCode: q,
        status: 'valid',
        recipient: `${matchedGrant.applicantName} (${matchedGrant.businessName})`,
        kioskLocation: matchedGrant.programTitle,
        district: matchedGrant.businessCategory,
        rate: `Peruntukan Diluluskan: ${matchedGrant.grantAmount || matchedGrant.amount || 'RM3,000'}`,
        issueDate: formatDisplayDate(matchedGrant.createdAt),
        expiryDate: 'Sah Disalurkan',
        issuer: 'Jawatankuasa Geran Usahawan Belia Kelantan (KBelia)'
      };
    }

    // 3. Match against mentor grant endorsements (state + localStorage fallback)
    let localEndorsements: any[] = [];
    try {
      const raw = localStorage.getItem('kbelia_mentor_endorsements_v1');
      if (raw) localEndorsements = JSON.parse(raw);
    } catch {
      // ignore
    }
    const allEndorsements = [...grantEndorsements, ...localEndorsements];
    const matchedEndorsement = allEndorsements.find((e: any) => {
      const code = (e.endorsementCode || '').toUpperCase();
      const eid = (e.id || '').toUpperCase();
      return (code && code === q) || (eid && eid === q);
    });

    if (matchedEndorsement) {
      return {
        refCode: q,
        status: 'valid',
        recipient: `${matchedEndorsement.menteeName} (${matchedEndorsement.businessName})`,
        kioskLocation: matchedEndorsement.grantProgramTitle || 'Surat Perakuan Mentor KBelia',
        district: matchedEndorsement.district || 'Kelantan',
        rate: `Syor Perakuan: ${matchedEndorsement.recommendedAmount || 'RM3,000'}`,
        issueDate: formatDisplayDate(matchedEndorsement.issuedAt),
        expiryDate: 'Sah Perakuan Mentor',
        issuer: `${matchedEndorsement.mentorName} (${matchedEndorsement.mentorAgency || 'Hab Usahawan KBelia'})`
      };
    }

    // 4. Match against approved registered businesses / SSM or certificate reference
    const matchedBusiness = businesses.find(b =>
      b.isApproved && (
        b.id.toUpperCase() === q ||
        (b.ssmNumber && b.ssmNumber.toUpperCase() === q)
      )
    );

    if (matchedBusiness) {
      return {
        refCode: q,
        status: 'valid',
        recipient: `${matchedBusiness.ownerName} (${matchedBusiness.businessName})`,
        kioskLocation: matchedBusiness.businessAddress || matchedBusiness.district,
        district: matchedBusiness.district,
        rate: `Kategori: ${matchedBusiness.category}`,
        issueDate: formatDisplayDate(matchedBusiness.createdAt),
        expiryDate: 'Aktif Berdaftar',
        issuer: 'Direktori Usahawan Belia Kelantan (KBelia)'
      };
    }

    // 5. Match standard membership cert code
    const currentYear = new Date().getFullYear();
    if (q === `REG-${currentYear}-BELIA` || q === 'REG-2026-BELIA') {
      const yr = q.split('-')[1] || String(currentYear);
      return {
        refCode: q,
        status: 'valid',
        recipient: 'Ahli Berdaftar Portal KBelia Kelantan',
        kioskLocation: 'Rangkaian Seluruh Negeri Kelantan',
        district: 'Negeri Kelantan',
        rate: 'Sijil Keahlian Usahawan Belia Rasmi',
        issueDate: `Januari ${yr}`,
        expiryDate: `Disember ${yr}`,
        issuer: 'Hab Pembangunan Usahawan Belia Kelantan (KBelia)'
      };
    }

    return {
      refCode: q,
      status: 'invalid',
      recipient: '-',
      kioskLocation: '-',
      district: '-',
      rate: '-',
      issueDate: '-',
      expiryDate: '-',
      issuer: '-'
    };
  };

  useEffect(() => {
    if (isOpen) {
      const code = defaultRefCode || `REG-${new Date().getFullYear()}-BELIA`;
      setInputRef(code);
      setVerifiedRecord(performLookup(code));
    }
  }, [isOpen, defaultRefCode, bookings, businesses, grantApplications, grantEndorsements]);

  if (!isOpen) return null;

  const activeQrCode = (verifiedRecord?.refCode || inputRef || `REG-${new Date().getFullYear()}-BELIA`).trim().toUpperCase();
  const verificationUrl = buildVerificationQrPayload(activeQrCode);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.trim()) return;
    setVerifiedRecord(performLookup(inputRef));
  };

  const handleCopyVerifyLink = async () => {
    const ok = await copyToClipboard(verificationUrl);
    if (ok) {
      setCopiedLink(true);
      showToast({
        type: 'success',
        title: 'Pautan Pengesahan Disalin',
        message: 'Pautan terus semakan Kod QR sedia dikongsi.'
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrintSlip = async () => {
    if (!verifiedRecord || verifiedRecord.status !== 'valid') return;
    setIsPrinting(true);
    try {
      const html = generateVerificationSlipHtml(verifiedRecord);
      await openAndPrintDocument(html, `Pengesahan_Rasmi_${verifiedRecord.refCode}`);
    } finally {
      setTimeout(() => setIsPrinting(false), 600);
    }
  };

  const handleDownloadSlipPdf = async () => {
    if (!verifiedRecord || verifiedRecord.status !== 'valid' || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const html = generateVerificationSlipHtml(verifiedRecord);
      const ok = await downloadHtmlAsPdf(html, `Pengesahan_Rasmi_${verifiedRecord.refCode}.pdf`);
      if (ok) {
        showToast({
          type: 'success',
          title: 'PDF Pengesahan Disimpan',
          message: `Penyata pengesahan ${verifiedRecord.refCode} berjaya dimuat turun.`
        });
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 dark:border-slate-600 scale-100 transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-black dark:text-white/75 flex items-center justify-center border border-amber-300/40 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Pengesahan Ketulenan &amp; Penjana Kod QR Rasmi
              </h3>
              <span className="text-[0.8125rem] font-semibold text-black dark:text-white/75">
                Sistem Semakan Surat Tawaran, Perakuan &amp; Sijil Portal KBelia
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Ref Bar */}
        <form onSubmit={handleVerify} className="mb-5">
          <label className="text-sm font-semibold text-black dark:text-white block mb-1.5">
            Nombor Rujukan Dokumen
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75" />
              <input
                type="text"
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value)}
                placeholder="Masukkan nombor rujukan dokumen"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-[0.8125rem] font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Sahkan
            </button>
          </div>
        </form>

        {/* Verification Result Card + Live Scannable QR */}
        {verifiedRecord && verifiedRecord.status === 'valid' && (
          <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-black dark:text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-[0.8125rem] font-extrabold uppercase tracking-wider">
                  Dokumen Rasmi Diiktiraf &amp; Sah
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyVerifyLink()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Pautan Disalin' : 'Salin Pautan QR'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 pt-3 border-t border-emerald-200/70 dark:border-emerald-900/60 items-center sm:items-start">
              {/* Real Scannable QR Matrix */}
              <div className="shrink-0 flex flex-col items-center">
                <QrCodeGraphic
                  value={verificationUrl}
                  size={132}
                  caption="KOD QR KETULENAN"
                  subcaption={verifiedRecord.refCode}
                  showDownloadButton
                  downloadFileName={`QR_Pengesahan_${verifiedRecord.refCode}.png`}
                  downloadLabelBottom="PENGESAHAN RASMI KBELIA"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm w-full">
                <div>
                  <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Nombor Siri Rujukan:</span>
                  <MiddleTruncate
                    text={verifiedRecord.refCode}
                    startChars={11}
                    endChars={6}
                    className="font-bold text-black dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Penerima Tawaran:</span>
                  <span className="font-bold text-black dark:text-white">{verifiedRecord.recipient}</span>
                </div>
                <div>
                  <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Lokasi / Premis:</span>
                  <span className="font-semibold text-black dark:text-white">{verifiedRecord.kioskLocation}</span>
                </div>
                <div>
                  <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Butiran Kadar / Status:</span>
                  <span className="font-semibold text-black dark:text-white">
                    <AcronymText text={verifiedRecord.rate} />
                  </span>
                </div>
                <div>
                  <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Tempoh Sah:</span>
                  <span className="text-black dark:text-white">{verifiedRecord.issueDate} hingga {verifiedRecord.expiryDate}</span>
                </div>
                <div>
                  <span className="text-black/70 dark:text-white/75 block text-[0.8125rem]">Pihak Berkuasa Pengeluar:</span>
                  <span className="text-black dark:text-white">{verifiedRecord.issuer}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-900/60">
              <div className="flex items-center gap-2 text-xs text-black/70 dark:text-white/75">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Mematuhi Akta Perlindungan Data Peribadi 2010 (<span className="kbelia-acro">PDPA</span>) · Digest {computeIntegrityChecksum(verifiedRecord.refCode)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownloadSlipPdf()}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer disabled:opacity-60"
                >
                  {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{isDownloadingPdf ? 'Menjana...' : 'PDF Pengesahan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handlePrintSlip()}
                  disabled={isPrinting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white cursor-pointer disabled:opacity-60"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isPrinting ? 'Membuka...' : 'Cetak Penyata'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {verifiedRecord && verifiedRecord.status === 'invalid' && (
          <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="shrink-0">
              <QrCodeGraphic
                value={verificationUrl}
                size={104}
                caption="KOD QR RUJUKAN"
                subcaption={verifiedRecord.refCode}
              />
            </div>
            <div className="flex items-start gap-2.5 flex-1">
              <AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[0.8125rem] space-y-1">
                <div className="font-extrabold uppercase tracking-wider text-black dark:text-white">
                  Rekod Tidak Dijumpai (<MiddleTruncate text={verifiedRecord.refCode} startChars={10} endChars={5} />)
                </div>
                <p className="text-black dark:text-white leading-relaxed kbelia-prose">
                  Nombor rujukan ini tiada dalam senarai kelulusan aktif atau belum disahkan oleh pihak Pentadbir Portal KBelia. Sila semak semula ejaan nombor rujukan anda.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
