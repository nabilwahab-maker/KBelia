import { CapsuleBooking, GrantApplication, GrantEndorsementLetter, KioskDailySale, MentoringLogEntry } from '../types';
import {
  buildBusinessQrPayload,
  buildVerificationQrPayload,
  computeIntegrityChecksum,
  generateQrSvgString
} from './qrUtils';

export interface PrintFallbackPayload {
  htmlContent: string;
  documentTitle: string;
  orientation?: 'portrait' | 'landscape';
}

type PrintFallbackHandler = (payload: PrintFallbackPayload) => void;

let registeredFallbackHandler: PrintFallbackHandler | null = null;

/**
 * Registers a global UI fallback modal handler when browser/sandbox blocks native iframe printing.
 */
export const registerPrintFallbackHandler = (handler: PrintFallbackHandler | null): void => {
  registeredFallbackHandler = handler;
};

/**
 * Formats a date string into readable formal Malay (e.g., "1 Jun 2026")
 */
export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return 'Akan Ditetapkan';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calculates the exact final operational date based on start date and lease duration
 */
export const calculateOperationEndDate = (startDateStr?: string, durationMonths: number = 6): string => {
  if (!startDateStr) {
    const d = new Date();
    d.setMonth(d.getMonth() + (durationMonths || 6));
    d.setDate(d.getDate() - 1);
    return formatDisplayDate(d.toISOString().split('T')[0]);
  }

  const parsed = new Date(startDateStr);
  if (isNaN(parsed.getTime())) {
    return `${durationMonths} bulan selepas tarikh mula`;
  }

  const end = new Date(parsed.getTime());
  end.setMonth(end.getMonth() + (durationMonths || 6));
  end.setDate(end.getDate() - 1);

  return formatDisplayDate(end.toISOString().split('T')[0]);
};

export const escapeHtml = (val?: string | number | null): string => {
  const s = val === undefined || val === null ? '' : String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Institutional Royal KBelia Vector Crest Emblem (Zero external image/CORS dependency)
 */
export const buildKbeliaCrestSvg = (size: number = 48): string => `
  <svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 4 L56 12 V30 C56 45 45.5 55.5 32 60 C18.5 55.5 8 45 8 30 V12 Z" fill="#1E3A8A" stroke="#B45309" stroke-width="2.6"/>
    <path d="M32 9 L51 15.5 V29.5 C51 41.8 42.6 50.5 32 54.5 C21.4 50.5 13 41.8 13 29.5 V15.5 Z" fill="none" stroke="#F59E0B" stroke-width="1.2" opacity="0.85"/>
    <text x="32" y="34" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="18" letter-spacing="1">KB</text>
    <path d="M22 41 H42" stroke="#FBBF24" stroke-width="1.6" stroke-linecap="round"/>
    <text x="32" y="48.5" text-anchor="middle" fill="#FDE68A" font-family="system-ui, sans-serif" font-weight="800" font-size="6.2" letter-spacing="1.1">KELANTAN</text>
  </svg>
`;

/**
 * Subtle centered background security watermark seal
 */
export const buildWatermarkSvg = (): string => `
  <div class="doc-watermark" aria-hidden="true">
    <svg width="310" height="310" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="88" fill="none" stroke="#1E3A8A" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="100" cy="100" r="76" fill="none" stroke="#B45309" stroke-width="1.4"/>
      <path d="M100 32 L144 48 V86 C144 118 124 142 100 154 C76 142 56 118 56 86 V48 Z" fill="none" stroke="#1E3A8A" stroke-width="2.2"/>
      <text x="100" y="96" text-anchor="middle" fill="#1E3A8A" font-family="Georgia, serif" font-weight="900" font-size="34" letter-spacing="2">KBELIA</text>
      <text x="100" y="116" text-anchor="middle" fill="#B45309" font-family="system-ui, sans-serif" font-weight="800" font-size="9" letter-spacing="2.2">DOKUMEN RASMI NEGERI</text>
    </svg>
  </div>
`;

/**
 * Official Royal Digital Circular Seal (Cop Mohor Digital)
 */
export const buildDigitalSealHtml = (sealLabel: string = 'DISAHKAN RASMI'): string => `
  <div class="digital-seal-stamp" aria-hidden="true">
    <div class="digital-seal-inner">
      <div class="seal-top">PORTAL KBELIA</div>
      <div class="seal-mid">${escapeHtml(sealLabel)}</div>
      <div class="seal-bot">KELANTAN DARUL NAIM</div>
    </div>
  </div>
`;

/**
 * Generates an executive, standalone official HTML document for the Youth Kiosk Offer Letter
 * (Surat Tawaran Penempatan Kiosk) with Royal Navy & Antique Gold double border, crest, watermark, and real QR.
 */
export const generateOfferLetterOfficialHtml = (
  booking: CapsuleBooking,
  refNumber: string,
  formattedDate: string,
  subsidyRate: number = 50
): string => {
  const formattedStart = formatDisplayDate(booking.startDate);
  const formattedEnd = calculateOperationEndDate(booking.startDate, booking.durationMonths);
  const subsidizedRate = Number(booking.monthlyRate || 150);
  const safeSubsidy = Math.min(99, Math.max(0, Number(subsidyRate) || 50));
  const marketRate = safeSubsidy > 0 && safeSubsidy < 100
    ? Math.round((subsidizedRate / (1 - safeSubsidy / 100)) * 100) / 100
    : subsidizedRate * 2;
  const categoryText = booking.businessCategory === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : booking.businessCategory;

  const bodyHtml = `
    <div class="exec-doc-heading">
      <div class="exec-doc-kicker">PERAKUAN PENEMPATAN RASMI</div>
      <h2 class="exec-doc-title">SURAT TAWARAN PENEMPATAN KIOSK NIAGA BERSUBSIDI</h2>
      <div class="exec-status-line">STATUS: DILULUSKAN &amp; DIPERAKUI</div>
    </div>

    <div class="exec-recipient-grid">
      <div>
        <div class="exec-field-lbl">Dikeluarkan Kepada Usahawan:</div>
        <div class="exec-recipient-name">${escapeHtml(booking.applicantName)}</div>
        <div class="exec-recipient-biz">${escapeHtml(booking.businessName)} · <span>(${escapeHtml(categoryText)})</span></div>
        <div class="exec-recipient-meta">E-mel: ${escapeHtml(booking.applicantEmail)} &nbsp;|&nbsp; Tel: ${escapeHtml(booking.applicantPhone)}</div>
      </div>
      <div class="exec-ref-mini">
        <div><span>Kod Unit:</span> <strong>${escapeHtml(booking.slotCode)}</strong></div>
        <div><span>Tempoh:</span> <strong>${escapeHtml(booking.durationMonths)} Bulan</strong></div>
      </div>
    </div>

    <p class="exec-lead-para">
      Sukacita dimaklumkan bahawa permohonan pihak tuan/puan untuk menyewa ruang kiosk niaga bagi premis 
      <strong>${escapeHtml(booking.slotName)} (${escapeHtml(booking.slotCode)})</strong> telah 
      <strong>DILULUSKAN</strong> di bawah inisiatif Skim Kapsul Niaga Usahawan Belia Negeri Kelantan selepas melalui semakan dan penilaian tapak oleh Jawatankuasa Pentadbir.
    </p>

    <div class="section-title">Jadual Terma &amp; Maklumat Penempatan Kiosk Bersubsidi</div>
    <table class="info-table">
      <tr>
        <th>Kod &amp; Nama Premis Kiosk</th>
        <td><strong>${escapeHtml(booking.slotCode)}</strong> — ${escapeHtml(booking.slotName)}</td>
      </tr>
      <tr>
        <th>Lokasi Hab Penempatan</th>
        <td>${escapeHtml(booking.hubLocation)}, Negeri Kelantan Darul Naim</td>
      </tr>
      <tr>
        <th>Kadar Sewa Bersubsidi</th>
        <td>
          <strong>RM ${subsidizedRate.toFixed(2)} / sebulan</strong>
          <span class="exec-inline-note">(Subsidi ${safeSubsidy}% Ditaja Negeri · Kadar Pasaran RM ${marketRate.toFixed(2)})</span>
        </td>
      </tr>
      <tr>
        <th>Tarikh Mula Beroperasi</th>
        <td><strong>${escapeHtml(formattedStart)}</strong></td>
      </tr>
      <tr>
        <th>Tarikh Akhir Beroperasi</th>
        <td><strong>${escapeHtml(formattedEnd)}</strong> <span class="exec-inline-note">(Tempoh Penuh ${escapeHtml(booking.durationMonths)} Bulan)</span></td>
      </tr>
      <tr>
        <th>Status Perakuan</th>
        <td><strong>AKTIF &amp; DILULUSKAN</strong> — Sedia Dimeterai Perjanjian Sewaan Digital</td>
      </tr>
    </table>

    <div class="clause-box">
      <div class="clause-title">Arahan Penyerahan Kunci &amp; Pengesahan Tapak</div>
      <div class="clause-text">
        ${escapeHtml(booking.adminNotes || 'Pihak penerima dikehendaki hadir ke Pejabat Pengurusan Hab Kapsul Niaga berkenaan dalam tempoh tujuh (7) hari bekerja daripada tarikh surat ini bersama dokumen pengenalan diri untuk urusan meterai perjanjian dan penyerahan kunci digital kiosk.')}
      </div>
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Surat Tawaran Penempatan Kiosk - ${booking.slotCode} - ${refNumber}`,
    toolbarLabel: 'Surat Tawaran Rasmi Kiosk Belia',
    badgeText: 'DOKUMEN RASMI',
    agencyKicker: 'INISIATIF PEMERKASAAN USAHAWAN BELIA KELANTAN',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Urusetia Pengurusan Hab Kapsul Niaga Modular & Keusahawanan Belia, Kota Bharu, Kelantan',
    refNumber,
    issueDate: formattedDate,
    statusText: 'DILULUSKAN',
    bodyHtml,
    auditCode: refNumber,
    signatoryTitle: 'PENTADBIRAN HAB KAPSUL NIAGA BELIA',
    signatorySub: 'Hab Pembangunan Usahawan Belia Kelantan (KBelia)',
    sealText: 'LULUS RASMI',
    legalNote: 'Surat tawaran ini dijana secara elektronik melalui Portal KBelia dan sah di bawah Akta Tandatangan Digital 1997 serta Akta Perdagangan Elektronik 2006.'
  });
};

const buildOfficialLetterheadShell = (options: {
  title: string;
  toolbarLabel: string;
  badgeText: string;
  agencyKicker: string;
  agencyHeading: string;
  agencySubheading: string;
  refNumber: string;
  issueDate: string;
  statusText: string;
  bodyHtml: string;
  auditCode: string;
  signatoryTitle: string;
  signatorySub: string;
  sealText?: string;
  legalNote?: string;
  orientation?: 'portrait' | 'landscape';
}): string => {
  const orientation = options.orientation || 'portrait';
  const qrPayload = buildVerificationQrPayload(options.auditCode);
  const qrSvg = generateQrSvgString(qrPayload, {
    size: 74,
    darkColor: '#0F172A',
    lightColor: '#FFFFFF',
    includeMonogram: true,
    monogramText: 'KB'
  });
  const checksum = computeIntegrityChecksum(options.auditCode);

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>
    @page { size: A4 ${orientation}; margin: 7mm 8mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #E2E8F0;
      color: #0F172A;
      line-height: 1.52;
      font-size: 13px;
      padding: 18px 14px;
      -webkit-font-smoothing: antialiased;
    }
    .screen-toolbar {
      max-width: ${orientation === 'landscape' ? '1080px' : '820px'};
      margin: 0 auto 14px auto;
      background: #1E3A8A;
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(30, 58, 138, 0.28);
    }
    .screen-toolbar-title { font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .screen-toolbar-badge { background: #B45309; color: #FFFFFF; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
    .toolbar-actions { display: flex; align-items: center; gap: 10px; }
    .btn-print-screen {
      background: #F59E0B;
      color: #0F172A;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
    .btn-close-screen {
      background: rgba(255,255,255,0.14);
      color: #FFFFFF;
      border: 1px solid rgba(255,255,255,0.28);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Executive A4 Sheet + Royal Double Frame (Always Intact on Screen, PDF, & Print) */
    .document-page {
      max-width: ${orientation === 'landscape' ? '1080px' : '820px'};
      margin: 0 auto;
      background: #FFFFFF;
      padding: 10px;
      box-shadow: 0 14px 38px -10px rgba(15, 23, 42, 0.18);
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .royal-frame-outer {
      border: 3.5px solid #1E3A8A;
      padding: 5px;
      background: #FFFFFF;
      position: relative;
    }
    .royal-frame-inner {
      border: 1.5px solid #B45309;
      padding: ${orientation === 'landscape' ? '26px 36px' : '24px 30px'};
      background: ${orientation === 'landscape' ? '#FFFDF8' : '#FFFFFF'};
      position: relative;
      overflow: hidden;
    }
    .corner-bracket {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: none;
      z-index: 3;
    }
    .corner-tl { top: -1px; left: -1px; border-top: 3.5px solid #1E3A8A; border-left: 3.5px solid #1E3A8A; }
    .corner-tr { top: -1px; right: -1px; border-top: 3.5px solid #1E3A8A; border-right: 3.5px solid #1E3A8A; }
    .corner-bl { bottom: -1px; left: -1px; border-bottom: 3.5px solid #1E3A8A; border-left: 3.5px solid #1E3A8A; }
    .corner-br { bottom: -1px; right: -1px; border-bottom: 3.5px solid #1E3A8A; border-right: 3.5px solid #1E3A8A; }

    .doc-watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.048;
      pointer-events: none;
      z-index: 0;
    }
    .doc-content-layer {
      position: relative;
      z-index: 2;
    }

    /* Executive Letterhead */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 2px solid #1E3A8A;
    }
    .lh-left { display: flex; align-items: center; gap: 13px; flex: 1; }
    .lh-crest-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .lh-kicker { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #B45309; margin-bottom: 2px; }
    .lh-title { font-family: Georgia, 'Times New Roman', serif; font-size: 16.5px; font-weight: 700; color: #0F172A; line-height: 1.24; letter-spacing: -0.01em; }
    .lh-sub { font-size: 11px; color: #475569; margin-top: 2px; }
    .lh-meta {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-top: 2.5px solid #1E3A8A;
      padding: 8px 12px;
      text-align: right;
      font-size: 11px;
      min-width: 215px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      flex-shrink: 0;
    }
    .lh-meta-label { font-family: system-ui, sans-serif; font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .lh-meta-val { font-weight: 800; color: #0F172A; margin-bottom: 4px; word-break: break-all; }

    /* Restrained Institutional Banner & Typography */
    .exec-doc-heading, .doc-banner {
      text-align: center;
      margin-bottom: 14px;
      padding: 10px 14px;
      background: #F8FAFC;
      border-top: 1.5px solid #1E3A8A;
      border-bottom: 1.5px solid #CBD5E1;
    }
    .exec-doc-kicker { font-size: 10px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: #B45309; margin-bottom: 2px; }
    .exec-doc-title, .doc-banner-title { font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #0F172A; }
    .exec-status-line, .doc-banner-status {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 10px;
      border: 1px solid #1E3A8A;
      background: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #1E3A8A;
      text-transform: uppercase;
    }

    .exec-recipient-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border: 1px solid #CBD5E1;
      border-left: 3.5px solid #B45309;
      background: #FFFFFF;
      margin-bottom: 12px;
    }
    .exec-field-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: #64748B; margin-bottom: 2px; }
    .exec-recipient-name { font-size: 15px; font-weight: 800; color: #0F172A; }
    .exec-recipient-biz { font-size: 12.5px; font-weight: 700; color: #1E3A8A; margin-top: 1px; }
    .exec-recipient-biz span { font-weight: 500; color: #475569; }
    .exec-recipient-meta { font-size: 11.5px; color: #475569; margin-top: 2px; }
    .exec-ref-mini { text-align: right; font-size: 11.5px; color: #334155; border-left: 1px solid #E2E8F0; padding-left: 14px; white-space: nowrap; }
    .exec-ref-mini span { color: #64748B; }
    .exec-lead-para { font-size: 12.8px; color: #1E293B; line-height: 1.6; margin-bottom: 12px; text-align: justify; }
    .exec-inline-note { font-size: 11px; color: #475569; margin-left: 6px; }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #1E3A8A;
      margin: 14px 0 7px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #CBD5E1;
    }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12.2px; border: 1px solid #CBD5E1; }
    .info-table th, .info-table td { padding: 6.5px 10px; border: 1px solid #CBD5E1; text-align: left; vertical-align: top; }
    .info-table th { background: #F8FAFC; font-weight: 700; width: 34%; color: #0F172A; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11.8px; border: 1px solid #CBD5E1; }
    .data-table th { background: #1E3A8A; color: #FFFFFF; padding: 7px 8px; border: 1px solid #1E3A8A; font-weight: 700; text-align: left; }
    .data-table td { padding: 6.5px 8px; border: 1px solid #CBD5E1; color: #0F172A; }
    .data-table tr:nth-child(even) td { background: #F8FAFC; }
    .clause-box { background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 3px solid #1E3A8A; padding: 9px 13px; margin-bottom: 9px; }
    .clause-title { font-size: 12px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
    .clause-text { font-size: 11.8px; color: #1E293B; line-height: 1.52; }
    .highlight-card { background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 3px solid #B45309; padding: 10px 13px; margin: 10px 0; font-size: 12px; color: #0F172A; }

    /* Footer: Real Scannable QR + Cop Mohor + Signatory */
    .verification-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1.5px solid #CBD5E1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .qr-audit-box {
      display: flex;
      align-items: center;
      gap: 11px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      padding: 7px 11px;
      max-width: 410px;
    }
    .qr-svg-wrap {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      padding: 3px;
      line-height: 0;
      flex-shrink: 0;
    }
    .seal-and-sign {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .digital-seal-stamp {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      border: 2px solid #1E3A8A;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-6deg);
      background: rgba(255, 255, 255, 0.92);
      flex-shrink: 0;
    }
    .digital-seal-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px dashed #B45309;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4px;
    }
    .seal-top { font-size: 6.5px; font-weight: 800; color: #1E3A8A; letter-spacing: 0.6px; }
    .seal-mid { font-size: 8px; font-weight: 900; color: #B45309; margin: 2px 0; line-height: 1.1; }
    .seal-bot { font-size: 5.5px; font-weight: 700; color: #334155; letter-spacing: 0.4px; }
    .seal-sign-box { text-align: right; }
    .sign-line {
      font-family: Georgia, 'Times New Roman', serif;
      font-style: italic;
      font-size: 13.5px;
      font-weight: 700;
      color: #1E3A8A;
      border-bottom: 1.5px solid #0F172A;
      padding-bottom: 2px;
      margin-bottom: 4px;
      display: inline-block;
      min-width: 155px;
    }
    .sign-authority { font-size: 11.5px; font-weight: 800; color: #0F172A; }
    .sign-title { font-size: 10.5px; color: #475569; }
    .legal-disclaimer {
      margin-top: 10px;
      padding-top: 7px;
      border-top: 1px dashed #CBD5E1;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 10px;
      color: #475569;
    }

    /* Print Overrides: ALWAYS Preserve Royal Double Borders & Ink Colors */
    @media print {
      body { background: #FFFFFF !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .screen-toolbar, .no-print { display: none !important; }
      .document-page { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; padding: 4px !important; }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar no-print">
    <div class="screen-toolbar-title">
      <span class="screen-toolbar-badge">${escapeHtml(options.badgeText)}</span>
      <span>${escapeHtml(options.toolbarLabel)}</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print-screen" onclick="window.print()">Cetak / Simpan PDF</button>
      <button class="btn-close-screen" onclick="window.close()">Tutup</button>
    </div>
  </div>
  <div class="document-page" data-orientation="${orientation}">
    <div class="royal-frame-outer">
      <div class="royal-frame-inner">
        <div class="corner-bracket corner-tl"></div>
        <div class="corner-bracket corner-tr"></div>
        <div class="corner-bracket corner-bl"></div>
        <div class="corner-bracket corner-br"></div>
        ${buildWatermarkSvg()}
        <div class="doc-content-layer">
          <div class="letterhead">
            <div class="lh-left">
              <div class="lh-crest-wrap">${buildKbeliaCrestSvg(50)}</div>
              <div>
                <div class="lh-kicker">${escapeHtml(options.agencyKicker)}</div>
                <div class="lh-title">${escapeHtml(options.agencyHeading)}</div>
                <div class="lh-sub">${escapeHtml(options.agencySubheading)}</div>
              </div>
            </div>
            <div class="lh-meta">
              <div class="lh-meta-label">Nombor Rujukan Rasmi</div>
              <div class="lh-meta-val">${escapeHtml(options.refNumber)}</div>
              <div class="lh-meta-label">Tarikh Dokumen</div>
              <div class="lh-meta-val">${escapeHtml(options.issueDate)}</div>
              <div class="lh-meta-label">Status Pengesahan</div>
              <div class="lh-meta-val" style="margin-bottom:0;color:#1E3A8A;">${escapeHtml(options.statusText)}</div>
            </div>
          </div>

          ${options.bodyHtml}

          <div class="verification-footer">
            <div class="qr-audit-box">
              <div class="qr-svg-wrap">${qrSvg}</div>
              <div>
                <div style="font-size:10.5px;font-weight:800;color:#1E3A8A;letter-spacing:0.4px;">IMBAS KOD QR PENGESAHAN</div>
                <div style="font-size:10px;color:#475569;line-height:1.35;">Sahih melalui Sistem Semakan Awam Portal KBelia Kelantan.</div>
                <div style="font-size:10px;font-family:monospace;font-weight:700;color:#0F172A;margin-top:2px;">RUJ: ${escapeHtml(options.auditCode)}</div>
              </div>
            </div>
            <div class="seal-and-sign">
              ${buildDigitalSealHtml(options.sealText || 'DISAHKAN RASMI')}
              <div class="seal-sign-box">
                <div class="sign-line">Disahkan Secara Digital</div>
                <div class="sign-authority">${escapeHtml(options.signatoryTitle)}</div>
                <div class="sign-title">${escapeHtml(options.signatorySub)}</div>
              </div>
            </div>
          </div>
          <div class="legal-disclaimer">
            <span>${escapeHtml(options.legalNote || 'Dokumen rasmi ini dijana secara elektronik melalui Portal KBelia Kelantan dan sah tanpa tandatangan basah.')}</span>
            <span style="font-family:monospace;">DIGEST: ${checksum} · Halaman 1/1</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const generateTenancyAgreementOfficialHtml = (
  booking: CapsuleBooking,
  refNumber: string,
  formattedDate: string,
  subsidyRate: number = 50
): string => {
  const rate = Number(booking.monthlyRate || 150);
  const safeSubsidy = Math.min(99, Math.max(0, Number(subsidyRate) || 50));
  const marketRate = safeSubsidy > 0 && safeSubsidy < 100
    ? Math.round((rate / (1 - safeSubsidy / 100)) * 100) / 100
    : rate * 2;
  const startDisp = formatDisplayDate(booking.startDate);
  const endDisp = calculateOperationEndDate(booking.startDate, booking.durationMonths);
  const signedStatus = booking.tenancySigned
    ? `DIMETERAI DIGITAL (${formatDisplayDate(booking.tenancySignedAt)})`
    : 'MENUNGGU TANDATANGAN PENYEWA';

  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">KONTRAK PENYEWAAN RASMI</div>
      <div class="doc-banner-title">PERJANJIAN PENYEWAAN DIGITAL KIOSK KAPSUL NIAGA BELIA KELANTAN</div>
      <div class="doc-banner-status">${escapeHtml(signedStatus)}</div>
    </div>
    <p class="exec-lead-para">
      Perjanjian ini dimeterai pada <strong>${escapeHtml(formattedDate)}</strong> antara <strong>Pentadbiran Hab Pembangunan Usahawan Belia Kelantan (KBelia)</strong> ("Pemberi Sewa") dan pihak Penyewa mengikut butiran berikut:
    </p>
    <div class="section-title">Jadual A: Butiran Penyewa &amp; Premis Kiosk</div>
    <table class="info-table">
      <tr><th>Nama Penuh Penyewa</th><td><strong>${escapeHtml(booking.applicantName)}</strong></td></tr>
      <tr><th>Nama Perniagaan / Jenama</th><td>${escapeHtml(booking.businessName)} (${escapeHtml(booking.businessCategory === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : booking.businessCategory)})</td></tr>
      <tr><th>Nombor Telefon &amp; E-mel</th><td>${escapeHtml(booking.applicantPhone)} · ${escapeHtml(booking.applicantEmail)}</td></tr>
      <tr><th>Kod &amp; Nama Unit Kiosk</th><td><strong>${escapeHtml(booking.slotCode)}</strong> — ${escapeHtml(booking.slotName)}</td></tr>
      <tr><th>Lokasi Hab Penempatan</th><td>${escapeHtml(booking.hubLocation)}, Kelantan</td></tr>
      <tr><th>Tempoh Sewaan Sah</th><td>${escapeHtml(booking.durationMonths)} Bulan (${escapeHtml(startDisp)} hingga ${escapeHtml(endDisp)})</td></tr>
      <tr><th>Kadar Sewaan Bersubsidi</th><td><strong>RM ${rate.toFixed(2)} / sebulan</strong> (Subsidi ${safeSubsidy}% Kerajaan Negeri · Kadar Asal RM ${marketRate.toFixed(2)})</td></tr>
    </table>
    <div class="section-title">Jadual B: Terma &amp; Syarat Perjanjian Penyewaan</div>
    <div class="clause-box">
      <div class="clause-title">Fasal 1: Kadar Sewaan &amp; Pembayaran Komitmen</div>
      <div class="clause-text">Penyewa bersetuju membayar kadar sewaan bersubsidi RM ${rate.toFixed(2)} sebulan selewat-lewatnya pada 7hb setiap bulan bagi tempoh ${escapeHtml(booking.durationMonths)} bulan yang dipersetujui.</div>
    </div>
    <div class="clause-box">
      <div class="clause-title">Fasal 2: Pengendalian Premis &amp; Peraturan Kebersihan</div>
      <div class="clause-text">Penyewa wajib membuka operasi kiosk sekurang-kurangnya lima (5) hari seminggu, menjaga kebersihan dalam radius 2 meter, serta mematuhi piawaian PBT dan keselamatan elektrik maksimum 2000W.</div>
    </div>
    <div class="clause-box">
      <div class="clause-title">Fasal 3: Larangan Pindah Milik &amp; Penyertaan Klinik Mentor</div>
      <div class="clause-text">Kiosk tidak boleh disewa semula (sub-let) kepada pihak ketiga. Penyewa dikehendaki menghadiri sesi bimbingan mentor berkala bagi mengekalkan kelayakan subsidi sewaan.</div>
    </div>
    <div class="highlight-card">
      <strong>Perakuan Tandatangan Digital Penyewa:</strong><br/>
      Nama Penandatangan: <strong>${escapeHtml(booking.tenancySignatureName || booking.applicantName)}</strong> &nbsp;|&nbsp;
      Status Meterai: <strong>${booking.tenancySigned ? 'SAH DIMETERAI' : 'BELUM DIMETERAI'}</strong>
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Perjanjian Sewa Kiosk - ${booking.slotCode} - ${refNumber}`,
    toolbarLabel: 'Perjanjian Penyewaan Digital Kiosk KBelia',
    badgeText: booking.tenancySigned ? 'Dimeterai Sah' : 'Draf Perjanjian',
    agencyKicker: 'HAB USAHAWAN BELIA KELANTAN · PORTAL KBELIA',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Urus Setia Penempatan Kiosk Modular & Keusahawanan Belia, 15000 Kota Bharu, Kelantan',
    refNumber,
    issueDate: formattedDate,
    statusText: booking.tenancySigned ? 'SAH & DIMETERAI' : 'DRAF RASMI',
    bodyHtml,
    auditCode: refNumber,
    signatoryTitle: 'PENTADBIRAN HAB KAPSUL NIAGA BELIA',
    signatorySub: 'Hab Pembangunan Usahawan Belia Kelantan (KBelia)',
    sealText: booking.tenancySigned ? 'METERAI SAH' : 'DRAF RASMI'
  });
};

export const generateGrantApprovalOfficialHtml = (grant: GrantApplication): string => {
  const refCode = `GRT-${grant.id.slice(0, 10).toUpperCase()}`;
  const issueDate = formatDisplayDate(grant.createdAt);
  const amountText = grant.amount || grant.grantAmount || 'RM 3,000';
  const statusLabel = grant.status === 'approved' ? 'DILULUSKAN' : grant.status.toUpperCase();

  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">PERAKUAN KELULUSAN PERUNTUKAN</div>
      <div class="doc-banner-title">SURAT PENGESAHAN KELULUSAN PERUNTUKAN GERAN USAHAWAN BELIA</div>
      <div class="doc-banner-status">STATUS: ${escapeHtml(statusLabel)}</div>
    </div>
    <p class="exec-lead-para">
      Sukacita dimaklumkan bahawa Jawatankuasa Penilaian Dana Usahawan Belia Negeri Kelantan (KBelia) telah meneliti dan mengesahkan permohonan geran mengikut butiran berikut:
    </p>
    <table class="info-table">
      <tr><th>Nama Pemohon</th><td><strong>${escapeHtml(grant.applicantName)}</strong></td></tr>
      <tr><th>Nama Perniagaan &amp; Kategori</th><td>${escapeHtml(grant.businessName)} (${escapeHtml(grant.businessCategory === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : grant.businessCategory)})</td></tr>
      <tr><th>Jajahan Operasi</th><td>${escapeHtml(grant.district || 'Kelantan')} ${grant.ssmNumber ? `· SSM: ${escapeHtml(grant.ssmNumber)}` : ''}</td></tr>
      <tr><th>Skim / Program Geran</th><td><strong>${escapeHtml(grant.programTitle)}</strong></td></tr>
      <tr><th>Jumlah Peruntukan Diluluskan</th><td><strong style="font-size:14.5px;color:#1E3A8A;">${escapeHtml(amountText)}</strong></td></tr>
      <tr><th>Akaun Bank Penerima</th><td>${escapeHtml(grant.bankName)} · Nombor Akaun: ${escapeHtml(grant.bankAccountNumber)}</td></tr>
      <tr><th>Tujuan Penggunaan Dana</th><td>${escapeHtml(grant.fundPurpose || 'Pembangunan perniagaan, pembelian peralatan & modal pusingan')}</td></tr>
      <tr><th>Catatan Kelulusan Pegawai</th><td>${escapeHtml(grant.adminNotes || 'Permohonan diluluskan untuk penyaluran peruntukan geran mengikut tatacara kewangan semasa.')}</td></tr>
    </table>
    <div class="highlight-card">
      <strong>Peringatan Pemantauan &amp; Audit:</strong> Penerima geran dikehendaki menyimpan resit perolehan peralatan/stok dan mengemas kini laporan jualan bulanan di Portal Usahawan Belia KBelia bagi tujuan audit berkala.
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Kelulusan Geran - ${grant.businessName} - ${refCode}`,
    toolbarLabel: 'Surat Kelulusan Geran Belia Kelantan',
    badgeText: statusLabel,
    agencyKicker: 'KERAJAAN NEGERI KELANTAN · UNIT DANA & GERAN BELIA',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Jawatankuasa Pembiayaan Mikro & Geran Digital Belia Kelantan',
    refNumber: refCode,
    issueDate,
    statusText: statusLabel,
    bodyHtml,
    auditCode: refCode,
    signatoryTitle: 'JAWATANKUASA KELULUSAN GERAN BELIA',
    signatorySub: 'Portal Pembangunan Usahawan Belia Negeri Kelantan',
    sealText: 'GERAN LULUS'
  });
};

export const generateMentorEndorsementOfficialHtml = (endorsement: GrantEndorsementLetter): string => {
  const issueDate = formatDisplayDate(endorsement.issuedAt);
  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">PERAKUAN PANEL MENTOR</div>
      <div class="doc-banner-title">SURAT PERAKUAN &amp; SOKONGAN RASMI MENTOR BAGI PERMOHONAN GERAN BELIA</div>
      <div class="doc-banner-status">SYOR PERUNTUKAN: ${escapeHtml(endorsement.recommendedAmount)} · ${endorsement.status === 'active' ? 'SAH & AKTIF' : 'DITARIK BALIK'}</div>
    </div>
    <p class="exec-lead-para">
      Kepada Jawatankuasa Pemilihan Geran Usahawan Belia Kelantan (KBelia), saya selaku Mentor yang menyelia perkembangan perniagaan usahawan berikut memperakukan permohonan geran ini berdasarkan rekod prestasi bimbingan semasa:
    </p>
    <table class="info-table">
      <tr><th>Nama Belia / Usahawan</th><td><strong>${escapeHtml(endorsement.menteeName)}</strong></td></tr>
      <tr><th>Nama Perniagaan &amp; Niche</th><td>${escapeHtml(endorsement.businessName)} (${escapeHtml(endorsement.businessCategory)})</td></tr>
      <tr><th>Jajahan Operasi</th><td>${escapeHtml(endorsement.district)}, Kelantan</td></tr>
      <tr><th>Skim Geran Disyorkan</th><td><strong>${escapeHtml(endorsement.grantProgramTitle)}</strong></td></tr>
      <tr><th>Cadangan Nilai Peruntukan</th><td><strong style="color:#1E3A8A;">${escapeHtml(endorsement.recommendedAmount)}</strong></td></tr>
      <tr><th>Justifikasi Perakuan Mentor</th><td>${escapeHtml(endorsement.justification)}</td></tr>
      <tr><th>Status Kesiapsiagaan Bisnes</th><td>${escapeHtml(endorsement.businessReadinessRemark)}</td></tr>
    </table>
    <div class="highlight-card">
      <strong>Diperakui Oleh Mentor:</strong>
      <strong>${escapeHtml(endorsement.mentorName)}</strong> · ${escapeHtml(endorsement.mentorDesignation || 'Mentor Keusahawanan')} (${escapeHtml(endorsement.mentorAgency)})
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Surat Perakuan Geran - ${endorsement.endorsementCode}`,
    toolbarLabel: 'Surat Perakuan Rasmi Mentor KBelia',
    badgeText: endorsement.recommendedAmount,
    agencyKicker: 'HAB USAHAWAN BELIA KELANTAN · PANEL BIMBINGAN MENTOR',
    agencyHeading: 'HAB PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Pusat Operasi Hab Usahawan Belia Kelantan, 15000 Kota Bharu, Kelantan · Tel: +609-771 7000',
    refNumber: endorsement.endorsementCode,
    issueDate,
    statusText: endorsement.status === 'active' ? 'DISYORKAN RASMI' : 'DIBATALKAN',
    bodyHtml,
    auditCode: endorsement.endorsementCode,
    signatoryTitle: endorsement.mentorName.toUpperCase(),
    signatorySub: `${endorsement.mentorDesignation || 'Mentor'} · ${endorsement.mentorAgency}`,
    sealText: 'PERAKUAN MENTOR'
  });
};

export const generateMentorSummaryReportHtml = (params: {
  mentorName: string;
  mentorAgency: string;
  mentorDesignation?: string;
  totalMentees: number;
  completedSessions: number;
  totalLogs: number;
  totalEndorsements: number;
  districtRows: { district: string; mentees: number; sessions: number; endorsements: number }[];
  sectorRows: { sector: string; count: number }[];
  generatedDate: string;
  refCode: string;
}): string => {
  const districtTableRows = params.districtRows.length > 0
    ? params.districtRows
        .map(
          (r) => `
            <tr>
              <td><strong>${escapeHtml(r.district)}</strong></td>
              <td style="text-align:right;">${r.mentees}</td>
              <td style="text-align:right;">${r.sessions}</td>
              <td style="text-align:right;">${r.endorsements}</td>
            </tr>
          `
        )
        .join('')
    : `<tr><td colspan="4" style="text-align:center;color:#64748b;">Tiada rekod daerah lagi.</td></tr>`;

  const sectorTableRows = params.sectorRows.length > 0
    ? params.sectorRows
        .map(
          (r) => `
            <tr>
              <td>${escapeHtml(r.sector)}</td>
              <td style="text-align:right;"><strong>${r.count}</strong></td>
            </tr>
          `
        )
        .join('')
    : `<tr><td colspan="2" style="text-align:center;color:#64748b;">Tiada rekod sektor lagi.</td></tr>`;

  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">LAPORAN PRESTASI BIMBINGAN</div>
      <div class="doc-banner-title">LAPORAN RINGKAS BIMBINGAN MENTOR USAHAWAN BELIA</div>
      <div class="doc-banner-status">TARIKH JANAAN: ${escapeHtml(params.generatedDate)}</div>
    </div>
    <p class="exec-lead-para">
      Ringkasan aktiviti bimbingan bagi <strong>${escapeHtml(params.mentorName)}</strong> (${escapeHtml(params.mentorAgency)}) di bawah Portal Pembangunan Usahawan Belia Kelantan (KBelia).
    </p>
    <div class="section-title">1. Ringkasan Angka Utama</div>
    <table class="info-table">
      <tr><th>Jumlah Belia Diselia</th><td><strong>${params.totalMentees} Usahawan</strong></td></tr>
      <tr><th>Sesi Bimbingan Selesai</th><td><strong>${params.completedSessions} Sesi</strong></td></tr>
      <tr><th>Rekod Nota Sesi</th><td><strong>${params.totalLogs} Catatan</strong></td></tr>
      <tr><th>Surat Sokongan Geran</th><td><strong>${params.totalEndorsements} Perakuan</strong></td></tr>
    </table>
    <div class="section-title">2. Pecahan Mengikut Daerah</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Daerah</th>
          <th style="text-align:right;">Belia</th>
          <th style="text-align:right;">Sesi</th>
          <th style="text-align:right;">Sokongan</th>
        </tr>
      </thead>
      <tbody>
        ${districtTableRows}
      </tbody>
    </table>
    <div class="section-title">3. Pecahan Mengikut Sektor Perniagaan</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Sektor</th>
          <th style="text-align:right;">Bilangan Belia</th>
        </tr>
      </thead>
      <tbody>
        ${sectorTableRows}
      </tbody>
    </table>
  `;

  return buildOfficialLetterheadShell({
    title: `Laporan Ringkas Mentor - ${params.mentorName} - ${params.refCode}`,
    toolbarLabel: 'Laporan Ringkas Bimbingan Mentor KBelia',
    badgeText: 'Laporan Rasmi',
    agencyKicker: 'HAB USAHAWAN BELIA KELANTAN · PANEL MENTOR',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Laporan Kemajuan & Rekod Bimbingan Usahawan Belia Kelantan',
    refNumber: params.refCode,
    issueDate: params.generatedDate,
    statusText: 'DISAHKAN',
    bodyHtml,
    auditCode: params.refCode,
    signatoryTitle: params.mentorName.toUpperCase(),
    signatorySub: `${params.mentorDesignation || 'Mentor Keusahawanan'} · ${params.mentorAgency}`,
    sealText: 'LAPORAN MENTOR'
  });
};

export const generateMentorLogbookOfficialHtml = (params: {
  log: MentoringLogEntry;
  mentorName: string;
  mentorAgency: string;
  mentorDesignation?: string;
}): string => {
  const { log } = params;
  const sessionDateFormatted = formatDisplayDate(log.sessionDate);
  const items = log.actionItems || [];
  const doneCount = items.filter((i) => i.completed).length;

  const taskRows = items.length > 0
    ? items
        .map(
          (item, idx) => `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td>${escapeHtml(item.task)}</td>
              <td style="font-family:monospace;white-space:nowrap;">${escapeHtml(item.dueDate || '-')}</td>
              <td style="font-weight:700;color:${item.completed ? '#1E3A8A' : '#B45309'};white-space:nowrap;">
                ${item.completed ? 'Selesai' : 'Dalam Tindakan'}
              </td>
            </tr>
          `
        )
        .join('')
    : `<tr><td colspan="4" style="text-align:center;color:#64748b;">Tiada tugasan susulan direkodkan.</td></tr>`;

  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">DOKUMEN REKOD BIMBINGAN</div>
      <div class="doc-banner-title">MINIT &amp; REKOD SESI BIMBINGAN USAHAWAN BELIA</div>
      <div class="doc-banner-status">TARIKH SESI: ${escapeHtml(sessionDateFormatted)} · ${doneCount} TUGASAN SELESAI</div>
    </div>
    <table class="info-table">
      <tr><th>Usahawan / Belia</th><td><strong>${escapeHtml(log.menteeName)}</strong></td></tr>
      <tr><th>Nama Perniagaan</th><td>${escapeHtml(log.businessName)}</td></tr>
      <tr><th>Topik Bimbingan</th><td><strong>${escapeHtml(log.topic)}</strong></td></tr>
      <tr><th>Mentor Pembimbing</th><td>${escapeHtml(params.mentorName)} (${escapeHtml(params.mentorAgency)})</td></tr>
    </table>
    <div class="section-title">1. Ringkasan Perbincangan &amp; Nasihat Mentor</div>
    <div class="highlight-card" style="line-height:1.62;">
      ${escapeHtml(log.minutes).replace(/\n/g, '<br/>')}
    </div>
    <div class="section-title">2. Pelan Tindakan &amp; Tugasan Susulan (${items.length})</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:42px;text-align:center;">Bil</th>
          <th>Tugasan Usahawan</th>
          <th style="width:115px;">Tarikh Sasaran</th>
          <th style="width:120px;">Status</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>
  `;

  return buildOfficialLetterheadShell({
    title: `Rekod Sesi Bimbingan - ${log.businessName}`,
    toolbarLabel: 'Rekod Sesi Bimbingan Mentor KBelia',
    badgeText: 'Rekod Sesi',
    agencyKicker: 'HAB USAHAWAN BELIA KELANTAN · PANEL BIMBINGAN MENTOR',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Dokumen Minit Sesi & Pelan Tindakan Susulan Usahawan Belia',
    refNumber: log.id.toUpperCase(),
    issueDate: sessionDateFormatted,
    statusText: 'DISIMPAN RASMI',
    bodyHtml,
    auditCode: log.id.toUpperCase(),
    signatoryTitle: params.mentorName.toUpperCase(),
    signatorySub: `${params.mentorDesignation || 'Mentor Keusahawanan'} · ${params.mentorAgency}`,
    sealText: 'REKOD SESI'
  });
};

/**
 * Executive A4 LANDSCAPE Official Youth Entrepreneur Certificate
 * Features classic serif title typography, royal navy & antique gold double border, crest, watermark, digital seal, and real scannable QR.
 */
export const generateYouthCertificateOfficialHtml = (params: {
  fullName: string;
  email?: string;
  businessName?: string;
  district?: string;
  ssmNumber?: string;
  refCode: string;
  issueDate?: string;
}): string => {
  const issued = formatDisplayDate(params.issueDate || new Date().toISOString().split('T')[0]);
  const qrPayload = buildVerificationQrPayload(params.refCode);
  const qrSvg = generateQrSvgString(qrPayload, {
    size: 86,
    darkColor: '#0F172A',
    lightColor: '#FFFFFF',
    includeMonogram: true,
    monogramText: 'KB'
  });
  const checksum = computeIntegrityChecksum(params.refCode);

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sijil Pendaftaran Usahawan Belia - ${escapeHtml(params.refCode)}</title>
  <style>
    @page { size: A4 landscape; margin: 7mm 8mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #E2E8F0;
      color: #0F172A;
      padding: 18px 14px;
      -webkit-font-smoothing: antialiased;
    }
    .screen-toolbar {
      max-width: 1080px;
      margin: 0 auto 14px auto;
      background: #1E3A8A;
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(30, 58, 138, 0.28);
    }
    .screen-toolbar-title { font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .screen-toolbar-badge { background: #B45309; color: #FFFFFF; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .toolbar-actions { display: flex; align-items: center; gap: 10px; }
    .btn-print-screen { background: #F59E0B; color: #0F172A; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; }
    .btn-close-screen { background: rgba(255,255,255,0.14); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.28); padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }

    .document-page {
      max-width: 1080px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 10px;
      box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.2);
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .royal-frame-outer {
      border: 4px solid #1E3A8A;
      padding: 6px;
      background: #FFFFFF;
    }
    .royal-frame-inner {
      border: 1.8px solid #B45309;
      background: linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 48%, #FFFDF7 100%);
      padding: 26px 44px 22px 44px;
      position: relative;
      overflow: hidden;
    }
    .corner-ornament {
      position: absolute;
      width: 34px;
      height: 34px;
      pointer-events: none;
      z-index: 3;
    }
    .c-tl { top: 6px; left: 6px; border-top: 3.5px solid #1E3A8A; border-left: 3.5px solid #1E3A8A; }
    .c-tr { top: 6px; right: 6px; border-top: 3.5px solid #1E3A8A; border-right: 3.5px solid #1E3A8A; }
    .c-bl { bottom: 6px; left: 6px; border-bottom: 3.5px solid #1E3A8A; border-left: 3.5px solid #1E3A8A; }
    .c-br { bottom: 6px; right: 6px; border-bottom: 3.5px solid #1E3A8A; border-right: 3.5px solid #1E3A8A; }
    .doc-watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }
    .cert-layer {
      position: relative;
      z-index: 2;
      text-align: center;
    }
    .cert-top-kicker {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2.2px;
      text-transform: uppercase;
      color: #B45309;
      margin-top: 8px;
    }
    .cert-main-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 29px;
      font-weight: 700;
      color: #1E3A8A;
      letter-spacing: 0.8px;
      margin-top: 4px;
    }
    .cert-subtitle {
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #475569;
      margin-top: 3px;
    }
    .cert-divider {
      width: 240px;
      height: 2px;
      margin: 12px auto 14px auto;
      background: linear-gradient(90deg, transparent 0%, #B45309 25%, #1E3A8A 50%, #B45309 75%, transparent 100%);
    }
    .cert-intro {
      font-size: 13.5px;
      color: #334155;
      font-style: italic;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .cert-recipient-name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: #0F172A;
      margin: 6px 0 3px 0;
      letter-spacing: 0.3px;
    }
    .cert-business-name {
      font-size: 15px;
      font-weight: 800;
      color: #1E3A8A;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 12px;
    }
    .cert-citation {
      font-size: 13px;
      color: #1E293B;
      max-width: 740px;
      margin: 0 auto 16px auto;
      line-height: 1.6;
    }
    .cert-meta-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      max-width: 840px;
      margin: 0 auto 18px auto;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      padding: 9px 14px;
      text-align: left;
    }
    .cert-meta-item label {
      display: block;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748B;
    }
    .cert-meta-item span {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 10px;
      border-top: 1px solid #E2E8F0;
      text-align: left;
    }
    .cert-qr-block {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      padding: 7px 11px;
    }
    .cert-seal-sign {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .digital-seal-stamp {
      width: 86px;
      height: 86px;
      border-radius: 50%;
      border: 2px solid #1E3A8A;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-6deg);
      background: #FFFFFF;
    }
    .digital-seal-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px dashed #B45309;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4px;
    }
    .seal-top { font-size: 6.5px; font-weight: 800; color: #1E3A8A; letter-spacing: 0.6px; }
    .seal-mid { font-size: 8.5px; font-weight: 900; color: #B45309; margin: 2px 0; line-height: 1.1; }
    .seal-bot { font-size: 5.5px; font-weight: 700; color: #334155; }
    .cert-signatory { text-align: right; min-width: 220px; }
    .cert-sign-script {
      font-family: Georgia, 'Times New Roman', serif;
      font-style: italic;
      font-size: 16px;
      font-weight: 700;
      color: #1E3A8A;
      border-bottom: 1.5px solid #0F172A;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .cert-legal {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748B;
      font-family: monospace;
    }
    @media print {
      body { background: #FFFFFF !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .screen-toolbar, .no-print { display: none !important; }
      .document-page { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; padding: 4px !important; }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar no-print">
    <div class="screen-toolbar-title">
      <span class="screen-toolbar-badge">SIJIL RASMI A4 LANDSKAP</span>
      <span>Sijil Pengiktirafan Usahawan Belia Kelantan</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print-screen" onclick="window.print()">Cetak / Simpan PDF</button>
      <button class="btn-close-screen" onclick="window.close()">Tutup</button>
    </div>
  </div>
  <div class="document-page" data-orientation="landscape">
    <div class="royal-frame-outer">
      <div class="royal-frame-inner">
        <div class="corner-ornament c-tl"></div>
        <div class="corner-ornament c-tr"></div>
        <div class="corner-ornament c-bl"></div>
        <div class="corner-ornament c-br"></div>
        ${buildWatermarkSvg()}
        <div class="cert-layer">
          <div>${buildKbeliaCrestSvg(58)}</div>
          <div class="cert-top-kicker">HAB PEMBANGUNAN USAHAWAN BELIA NEGERI KELANTAN</div>
          <h1 class="cert-main-title">SIJIL PENGIKTIRAFAN KEUSAHAWANAN BELIA</h1>
          <div class="cert-subtitle">Pendaftaran Rasmi Ekosistem Niaga &amp; Inkubasi Portal KBelia</div>
          <div class="cert-divider"></div>

          <div class="cert-intro">Dengan ini diperakui dan disahkan bahawa</div>
          <div class="cert-recipient-name">${escapeHtml(params.fullName)}</div>
          <div class="cert-business-name">${escapeHtml(params.businessName || 'Perusahaan Belia Berdaftar Negeri Kelantan')}</div>

          <p class="cert-citation">
            telah didaftarkan secara sah di bawah <strong>Ekosistem Pemerkasaan Usahawan Belia Kelantan (KBelia)</strong>
            dan layak mengakses kemudahan Kiosk Modular Bersubsidi, Klinik Bimbingan Mentor, Direktori Perniagaan Rasmi, serta Skim Bantuan Geran Usahawan Muda.
          </p>

          <div class="cert-meta-strip">
            <div class="cert-meta-item">
              <label>No. Pendaftaran Rasmi</label>
              <span style="font-family:monospace;">${escapeHtml(params.refCode)}</span>
            </div>
            <div class="cert-meta-item">
              <label>Jajahan Operasi</label>
              <span>${escapeHtml(params.district || 'Negeri Kelantan')}</span>
            </div>
            <div class="cert-meta-item">
              <label>No. Pendaftaran SSM</label>
              <span style="font-family:monospace;">${escapeHtml(params.ssmNumber || 'Dalam Rekod Portal')}</span>
            </div>
            <div class="cert-meta-item">
              <label>Tarikh Pengesahan</label>
              <span>${escapeHtml(issued)}</span>
            </div>
          </div>

          <div class="cert-footer">
            <div class="cert-qr-block">
              <div style="line-height:0;">${qrSvg}</div>
              <div>
                <div style="font-size:10px;font-weight:800;color:#1E3A8A;letter-spacing:0.5px;">IMBAS UNTUK PENGESAHAN SAHIH</div>
                <div style="font-size:9.5px;color:#475569;margin-top:2px;">Pangkalan Data Rasmi Portal KBelia</div>
                <div style="font-size:10px;font-family:monospace;font-weight:700;color:#0F172A;margin-top:2px;">RUJ: ${escapeHtml(params.refCode)}</div>
              </div>
            </div>

            <div class="cert-seal-sign">
              ${buildDigitalSealHtml('KEAHLIAN SAH')}
              <div class="cert-signatory">
                <div class="cert-sign-script">Urusetia Induk KBelia</div>
                <div style="font-size:12px;font-weight:800;color:#0F172A;">URUSETIA INDUK PORTAL KBELIA</div>
                <div style="font-size:10.5px;color:#475569;">Hab Pembangunan Usahawan Belia Negeri Kelantan</div>
              </div>
            </div>
          </div>

          <div class="cert-legal">
            <span>SIJIL DIJANA SECARA ELEKTRONIK &amp; SAH TANPA TANDATANGAN BASAH</span>
            <span>DIGEST: ${checksum}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const generateOfficialReceiptHtml = (
  booking: CapsuleBooking,
  refNumber: string,
  subsidyRate: number = 50
): string => {
  const rate = Number(booking.paidAmount || booking.monthlyRate || 150);
  const safeSubsidy = Math.min(99, Math.max(0, Number(subsidyRate) || 50));
  const marketRate = safeSubsidy > 0 && safeSubsidy < 100
    ? Math.round((rate / (1 - safeSubsidy / 100)) * 100) / 100
    : rate * 2;
  const isPaid = booking.paymentStatus === 'paid' && Boolean(booking.paymentReference);
  const issueDate = formatDisplayDate(booking.paidAt || booking.createdAt);
  const methodLabel =
    booking.paymentMethod === 'fpx'
      ? `FPX Perbankan Internet${booking.paymentChannel ? ` (${booking.paymentChannel})` : ''}`
      : booking.paymentMethod === 'duitnow_qr'
      ? 'DuitNow QR'
      : booking.paymentMethod === 'card'
      ? `Kad Kredit / Debit${booking.paymentChannel ? ` (${booking.paymentChannel})` : ''}`
      : 'Belum Dijelaskan';
  const txRef = booking.paymentReference || 'Menunggu Pembayaran';

  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">PERAKAUNAN RASMI KIOSK</div>
      <div class="doc-banner-title">RESIT RASMI PEMBAYARAN KOMITMEN &amp; SEWAAN KIOSK KBelia</div>
      <div class="doc-banner-status">${isPaid ? 'TRANSAKSI BERJAYA &amp; DIPERAKUI' : 'MENUNGGU PEMBAYARAN ATAS TALIAN'}</div>
    </div>
    <table class="info-table">
      <tr><th>Diterima Daripada</th><td><strong>${escapeHtml(booking.applicantName)}</strong> — ${escapeHtml(booking.businessName)}</td></tr>
      <tr><th>Unit Kiosk &amp; Lokasi</th><td>${escapeHtml(booking.slotCode)} · ${escapeHtml(booking.slotName)} (${escapeHtml(booking.hubLocation)})</td></tr>
      <tr><th>Tempoh Sewaan</th><td>${escapeHtml(booking.durationMonths)} Bulan (Mula: ${escapeHtml(formatDisplayDate(booking.startDate))})</td></tr>
      <tr><th>Saluran Pembayaran</th><td><strong>${escapeHtml(methodLabel)}</strong></td></tr>
      <tr><th>Rujukan Transaksi</th><td style="font-family:monospace;"><strong>${escapeHtml(txRef)}</strong></td></tr>
      <tr><th>Status Pembayaran</th><td><strong>${isPaid ? 'LUNAS (KOMITMEN BULAN PERTAMA)' : 'BELUM BAYAR (TERTUNGGAK)'}</strong></td></tr>
    </table>
    <div class="section-title">Butiran Caj &amp; Subsidi Kerajaan Negeri</div>
    <table class="data-table">
      <thead>
        <tr><th>Keterangan Urusniaga</th><th style="text-align:right;width:150px;">Jumlah (RM)</th></tr>
      </thead>
      <tbody>
        <tr><td>Kadar Komitmen Sewaan Bulan Pertama Kiosk Modular (Kadar Pasaran RM ${marketRate.toFixed(2)})</td><td style="text-align:right;font-family:monospace;">${marketRate.toFixed(2)}</td></tr>
        <tr><td>Subsidi Pemerkasaan Belia Kerajaan Negeri Kelantan (${safeSubsidy}%)</td><td style="text-align:right;font-family:monospace;color:#1E3A8A;">- ${(marketRate - rate).toFixed(2)}</td></tr>
        <tr><td>Deposit Kebersihan &amp; Utiliti Elektrik 13A</td><td style="text-align:right;font-family:monospace;">50.00</td></tr>
        <tr><td>Rebat Deposit Kemasukan Usahawan Belia</td><td style="text-align:right;font-family:monospace;color:#1E3A8A;">- 50.00</td></tr>
        <tr style="background:#F8FAFC;font-weight:900;"><td><strong>${isPaid ? 'JUMLAH BERSIH DIBAYAR (BULAN PERTAMA)' : 'JUMLAH KOMITMEN PERLU DIBAYAR'}</strong></td><td style="text-align:right;font-family:monospace;color:#1E3A8A;"><strong>RM ${rate.toFixed(2)}</strong></td></tr>
      </tbody>
    </table>
  `;

  return buildOfficialLetterheadShell({
    title: `Resit Rasmi KBelia - ${refNumber}`,
    toolbarLabel: 'Resit Rasmi Bayaran Sewaan Kiosk',
    badgeText: isPaid ? 'Lunas' : 'Belum Bayar',
    agencyKicker: 'SISTEM PERAKAUNAN BERSEPADU KBelia · KERAJAAN NEGERI KELANTAN',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Pejabat Bendahari & Urus Setia Hab Kapsul Niaga Belia Kelantan',
    refNumber,
    issueDate,
    statusText: isPaid ? 'LUNAS & SAH' : 'BELUM BAYAR',
    bodyHtml,
    auditCode: booking.paymentReference || refNumber,
    signatoryTitle: 'UNIT KEWANGAN & PEROLEHAN KBelia',
    signatorySub: 'Resit dijana secara automatik oleh sistem dan sah tanpa tandatangan basah.',
    sealText: isPaid ? 'RESIT SAH' : 'INVOIS KOMITMEN'
  });
};

export const generateCashflowStatementOfficialHtml = (params: {
  kioskName: string;
  businessName: string;
  salesRecords: KioskDailySale[];
  totals: { totalRevenue: number; totalCash: number; totalQr: number; totalExpenses: number; netProfit: number };
  mode: 'sales' | 'qr';
}): string => {
  const refCode = `POS-${params.mode === 'qr' ? 'QR' : 'CF'}-${new Date().getFullYear()}`;
  const todayStr = formatDisplayDate(new Date().toISOString().split('T')[0]);

  if (params.mode === 'qr') {
    const standeeQrSvg = generateQrSvgString(
      buildBusinessQrPayload(refCode, params.businessName),
      {
        size: 184,
        darkColor: '#0F172A',
        lightColor: '#FFFFFF',
        includeMonogram: true,
        monogramText: 'KB'
      }
    );

    const bodyHtml = `
      <div class="doc-banner">
        <div class="exec-doc-kicker">STANDEE KAUNTER DIGITAL</div>
        <div class="doc-banner-title">PAPARAN QR DUITNOW &amp; PENGESAHAN PERNIAGAAN BERDAFTAR KIOSK</div>
        <div class="doc-banner-status">SEDIA UNTUK PAPARAN KAUNTER KIOSK</div>
      </div>
      <div style="border:2px solid #1E3A8A;padding:24px;text-align:center;background:#F8FAFC;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:800;color:#B45309;letter-spacing:1.4px;text-transform:uppercase;">IMBAS UNTUK SEMAKAN &amp; PEMBAYARAN</div>
        <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;color:#0F172A;margin:4px 0;">${escapeHtml(params.businessName)}</div>
        <div style="font-size:12.5px;font-weight:600;color:#475569;margin-bottom:16px;">${escapeHtml(params.kioskName)} · Rangkaian Usahawan Belia Kelantan</div>
        <div style="display:inline-block;padding:14px;background:#FFFFFF;border:2px solid #1E3A8A;">
          ${standeeQrSvg}
        </div>
        <div style="margin-top:12px;font-size:12px;font-weight:700;color:#1E3A8A;">Sokongan Pembayaran DuitNow QR &amp; Pengesahan Usahawan KBelia</div>
      </div>
    `;

    return buildOfficialLetterheadShell({
      title: `Standee QR Kaunter - ${params.businessName}`,
      toolbarLabel: 'Standee QR Pembayaran Tanpa Tunai Kiosk',
      badgeText: 'DuitNow QR',
      agencyKicker: 'EKOSISTEM TANPA TUNAI KBelia · KERAJAAN NEGERI KELANTAN',
      agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
      agencySubheading: 'Papan Paparan Kaunter Rasmi Usahawan Kiosk Modular',
      refNumber: refCode,
      issueDate: todayStr,
      statusText: 'AKTIF BERDAFTAR',
      bodyHtml,
      auditCode: refCode,
      signatoryTitle: 'PENGESAHAN DAGANG DIGITAL KBelia',
      signatorySub: 'Hab Pembangunan Usahawan Belia Kelantan (KBelia)',
      sealText: 'QR BERDAFTAR'
    });
  }

  const rowsHtml = params.salesRecords.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:#64748b;">Tiada rekod jualan dicatatkan lagi.</td></tr>'
    : params.salesRecords.map((r, i) => {
        const gross = Number(r.cashSales || 0) + Number(r.qrSales || 0);
        const net = gross - Number(r.expenses || 0);
        return `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td>${escapeHtml(r.date)}</td>
            <td style="text-align:right;font-family:monospace;">RM ${Number(r.cashSales || 0).toFixed(2)}</td>
            <td style="text-align:right;font-family:monospace;">RM ${Number(r.qrSales || 0).toFixed(2)}</td>
            <td style="text-align:right;font-family:monospace;">RM ${Number(r.expenses || 0).toFixed(2)}</td>
            <td style="text-align:right;font-family:monospace;font-weight:800;">RM ${net.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

  const bodyHtml = `
    <div class="doc-banner">
      <div class="exec-doc-kicker">REKOD KEWANGAN HARIAN</div>
      <div class="doc-banner-title">PENYATA ALIRAN TUNAI &amp; LEJAR JUALAN HARIAN KIOSK</div>
      <div class="doc-banner-status">${escapeHtml(params.businessName)} · ${escapeHtml(params.kioskName)}</div>
    </div>
    <table class="info-table">
      <tr><th>Jumlah Jualan Kasar</th><td><strong>RM ${params.totals.totalRevenue.toFixed(2)}</strong> (Tunai: RM ${params.totals.totalCash.toFixed(2)} · QR: RM ${params.totals.totalQr.toFixed(2)})</td></tr>
      <tr><th>Jumlah Perbelanjaan Operasi</th><td>RM ${params.totals.totalExpenses.toFixed(2)}</td></tr>
      <tr><th>Untung Bersih Terkumpul</th><td><strong style="font-size:14.5px;color:#1E3A8A;">RM ${params.totals.netProfit.toFixed(2)}</strong></td></tr>
    </table>
    <div class="section-title">Rekod Transaksi Harian (${params.salesRecords.length} Entri)</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:40px;text-align:center;">Bil</th>
          <th>Tarikh</th>
          <th style="text-align:right;">Tunai (RM)</th>
          <th style="text-align:right;">QR / Bank (RM)</th>
          <th style="text-align:right;">Kos / Belanja (RM)</th>
          <th style="text-align:right;">Untung Bersih (RM)</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  return buildOfficialLetterheadShell({
    title: `Penyata Aliran Tunai - ${params.businessName}`,
    toolbarLabel: 'Penyata Buku Tunai & Jualan Kiosk KBelia',
    badgeText: 'Rekod POS',
    agencyKicker: 'SISTEM BUKU TUNAI USAHAWAN KBelia · NEGERI KELANTAN',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Penyata Rekod Kewangan Harian Untuk Kegunaan Audit Mentor & Permohonan Geran',
    refNumber: refCode,
    issueDate: todayStr,
    statusText: 'PENYATA SAH',
    bodyHtml,
    auditCode: refCode,
    signatoryTitle: 'REKOD KEWANGAN USAHAWAN BELIA',
    signatorySub: 'Dijana menerusi Modul Buku Tunai Bersepadu Portal KBelia',
    sealText: 'PENYATA SAH'
  });
};

const stripAutoPrintScripts = (html: string): string =>
  html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

const detectOrientationFromHtml = (html: string): 'portrait' | 'landscape' =>
  /data-orientation\s*=\s*["']landscape["']/i.test(html) || /size:\s*A4\s+landscape/i.test(html)
    ? 'landscape'
    : 'portrait';

/**
 * Opens a dedicated printable document via full-A4 off-screen iframe with automatic fallback preview modal
 * whenever sandbox/browser constraints block the native print dialog.
 */
export const openAndPrintDocument = (
  contentHtml: string,
  documentTitle: string = 'Salinan Dokumen Rasmi KBelia'
): Promise<boolean> => {
  return printHtmlViaIframe(contentHtml, documentTitle);
};

/**
 * Printable A4 Iframe Helper (Sized to A4 off-screen, single print trigger, silent-block detection + fallback modal)
 */
export const printHtmlViaIframe = (
  contentHtml: string,
  documentTitle: string = 'Salinan Dokumen Rasmi KBelia'
): Promise<boolean> => {
  const orientation = detectOrientationFromHtml(contentHtml);
  const triggerFallback = () => {
    if (registeredFallbackHandler) {
      registeredFallbackHandler({
        htmlContent: contentHtml,
        documentTitle,
        orientation
      });
      return true;
    }
    return false;
  };

  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = orientation === 'landscape' ? '1123px' : '794px';
      iframe.style.height = orientation === 'landscape' ? '794px' : '1123px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const iframeWin = iframe.contentWindow;
      const iframeDoc = iframeWin?.document;
      if (!iframeDoc || !iframeWin) {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        const handled = triggerFallback();
        resolve(handled);
        return;
      }

      const isFullHtml =
        contentHtml.trim().toLowerCase().startsWith('<!doctype html>') ||
        contentHtml.trim().toLowerCase().startsWith('<html');

      const sanitizedFullHtml = stripAutoPrintScripts(contentHtml);

      iframeDoc.open();
      if (isFullHtml) {
        iframeDoc.write(sanitizedFullHtml);
      } else {
        iframeDoc.write(`
          <!DOCTYPE html>
          <html lang="ms">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${escapeHtml(documentTitle)}</title>
              <style>
                @page { size: A4 ${orientation}; margin: 10mm 12mm; }
                *, *::before, *::after { box-sizing: border-box; }
                body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  color: #0F172A;
                  background: #FFFFFF;
                  font-size: 13.5px;
                  line-height: 1.55;
                  margin: 0;
                  padding: 8px;
                }
                .no-print, .screen-toolbar { display: none !important; }
                @media print {
                  body { padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
              </style>
            </head>
            <body>
              ${sanitizedFullHtml}
            </body>
          </html>
        `);
      }
      iframeDoc.close();

      let beforePrintFired = false;
      const onBeforePrint = () => {
        beforePrintFired = true;
      };
      try {
        iframeWin.addEventListener('beforeprint', onBeforePrint, { once: true });
      } catch {
        // ignore listener errors
      }

      setTimeout(() => {
        const startedAt = Date.now();
        try {
          iframeWin.focus();
          iframeWin.print();
          const elapsed = Date.now() - startedAt;

          // If print() returned almost instantaneously without firing beforeprint inside an embedded iframe,
          // the browser sandbox likely suppressed the print dialog; surface our interactive preview/PDF fallback.
          setTimeout(() => {
            const isEmbedded = (() => {
              try {
                return window.self !== window.top;
              } catch {
                return true;
              }
            })();

            if (!beforePrintFired && elapsed < 35 && isEmbedded) {
              triggerFallback();
            }
            resolve(true);
          }, 120);
        } catch {
          const handled = triggerFallback();
          if (!handled) {
            try {
              window.print();
            } catch {
              // ignore
            }
          }
          resolve(handled);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }
      }, 280);
    } catch {
      const handled = triggerFallback();
      resolve(handled);
    }
  });
};

/**
 * Downloads a complete standalone HTML document with proper formatting and styles.
 */
export const downloadHtmlDocument = (
  contentHtml: string,
  fileName: string,
  documentTitle: string = 'Dokumen Rasmi KBelia'
): void => {
  const completeHtml = (contentHtml.trim().toLowerCase().startsWith('<!doctype html>') || contentHtml.trim().toLowerCase().startsWith('<html'))
    ? contentHtml
    : `
      <!DOCTYPE html>
      <html lang="ms">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(documentTitle)}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 14mm; }
            *, *::before, *::after { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0F172A;
              background: #FFFFFF;
              font-size: 13.5px;
              line-height: 1.55;
              margin: 0 auto;
              max-width: 820px;
              padding: 24px;
            }
            .no-print, .screen-toolbar { display: none !important; }
            @media print {
              body { padding: 0; max-width: 100%; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `;

  const blob = new Blob([completeHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Copy to clipboard utility with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
};
