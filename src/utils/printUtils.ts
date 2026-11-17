import { CapsuleBooking, GrantApplication, GrantEndorsementLetter, KioskDailySale } from '../types';

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

/**
 * Generates a complete, standalone, beautifully styled official HTML document
 * for the Youth Kiosk Offer Letter (Surat Tawaran Penempatan Kiosk).
 * It includes an authentic royal Kelantan header, typography, tables, badges,
 * digital QR code, official seals, and responsive print/screen styles.
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

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Tawaran Penempatan Kiosk - ${booking.slotCode} - ${refNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Public Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background-color: #f1f5f9;
      color: #000000;
      line-height: 1.55;
      font-size: 14px;
      padding: 20px 15px;
      -webkit-font-smoothing: antialiased;
    }

    /* Screen-only Action Toolbar */
    .screen-toolbar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      background: #1E40AF;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.25);
    }

    .screen-toolbar-title {
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
    }

    .screen-toolbar-badge {
      background: #F59E0B;
      color: #000000;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-print-screen {
      background-color: #F59E0B;
      background-image: linear-gradient(135deg, #FBBF24, #F59E0B);
      color: #000000;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3);
    }

    .btn-print-screen:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    .btn-close-screen {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close-screen:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Official A4 Document Paper Sheet - Guaranteed Single Page */
    .document-page {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
      padding: 28px 36px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Royal Ribbon Top Bar */
    .royal-ribbon {
      height: 6px;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #1E40AF 0%, #2563EB 45%, #F59E0B 75%, #FBBF24 100%);
    }

    /* Letterhead */
    .letterhead {
      border-bottom: 2px solid #2563EB;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .agency-info {
      flex: 1;
    }

    .state-sub {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #000000;
      margin-bottom: 3px;
    }

    .agency-title {
      font-family: 'Public Sans', system-ui, sans-serif;
      font-size: 19px;
      font-weight: 800;
      color: #000000;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    .agency-desc {
      font-size: 12.5px;
      color: #000000;
      opacity: 0.82;
      margin-top: 4px;
      line-height: 1.4;
    }

    .ref-block {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 9px 13px;
      text-align: right;
      font-size: 12px;
      line-height: 1.45;
      font-family: monospace;
      color: #000000;
      min-width: 215px;
    }

    .ref-val {
      font-weight: 800;
      font-size: 13px;
      color: #000000;
    }

    /* Recipient Details */
    .recipient-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #F59E0B;
      border-radius: 8px;
      padding: 11px 15px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
    }

    .recipient-lbl {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #000000;
      opacity: 0.72;
      margin-bottom: 2px;
    }

    .recipient-name {
      font-size: 16px;
      font-weight: 800;
      color: #000000;
    }

    .recipient-biz {
      font-size: 13.5px;
      font-weight: 700;
      color: #000000;
      margin-top: 2px;
    }

    .recipient-contact {
      font-size: 12.5px;
      color: #000000;
      opacity: 0.78;
      margin-top: 3px;
    }

    .status-pill {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #000000;
      padding: 6px 11px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      text-align: center;
      white-space: nowrap;
    }

    /* Decision Box */
    .decision-banner {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 8px;
      padding: 11px 15px;
      margin-bottom: 12px;
    }

    .decision-heading {
      font-size: 14px;
      font-weight: 800;
      color: #000000;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .decision-text {
      font-size: 13.5px;
      color: #000000;
      line-height: 1.5;
    }

    /* Structured Table */
    .table-section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #000000;
      margin-bottom: 7px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    table.info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    table.info-table th {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 8px 11px;
      text-align: left;
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #000000;
      width: 34%;
    }

    table.info-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 11px;
      font-size: 13px;
      color: #000000;
    }

    .price-highlight {
      font-size: 14.5px;
      font-weight: 800;
      color: #000000;
    }

    .subsidy-tag {
      display: inline-block;
      margin-left: 8px;
      background: #ecfdf5;
      color: #000000;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 700;
      padding: 2px 7px;
    }

    /* Handover Guide Card */
    .handover-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 11px 15px;
      margin-bottom: 14px;
    }

    .handover-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #000000;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .handover-p {
      font-size: 12.5px;
      color: #000000;
      line-height: 1.45;
    }

    /* Authentication & Signature Block */
    .verification-footer {
      border-top: 2px solid #e2e8f0;
      padding-top: 12px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .qr-audit-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 13px;
      max-width: 390px;
    }

    .qr-code-svg {
      width: 52px;
      height: 52px;
      flex-shrink: 0;
    }

    .audit-meta-title {
      font-size: 12px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
    }

    .audit-meta-sub {
      font-size: 11.5px;
      color: #000000;
      opacity: 0.78;
      margin-top: 2px;
      line-height: 1.35;
    }

    .audit-meta-hash {
      font-size: 11.5px;
      font-family: monospace;
      color: #000000;
      opacity: 0.72;
      margin-top: 2px;
    }

    /* Digital Seal Emblem */
    .seal-sign-box {
      text-align: right;
    }

    .seal-badge {
      display: inline-block;
      border: 1.5px solid #F59E0B;
      background: #fffbeb;
      color: #000000;
      padding: 5px 11px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.4px;
      margin-bottom: 5px;
    }

    .sign-authority {
      font-size: 12.5px;
      font-weight: 800;
      color: #000000;
    }

    .sign-title {
      font-size: 11.5px;
      color: #000000;
      opacity: 0.78;
      margin-top: 2px;
    }

    .legal-disclaimer {
      margin-top: 10px;
      padding-top: 7px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 11.5px;
      color: #000000;
      opacity: 0.72;
      line-height: 1.4;
    }

    /* Print Specific Overrides */
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
      }

      .screen-toolbar, .no-print {
        display: none !important;
      }

      .document-page {
        max-width: 100% !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen-Only Actions Toolbar -->
  <div class="screen-toolbar no-print">
    <div class="screen-toolbar-title">
      <span class="screen-toolbar-badge">DOKUMEN RASMI</span>
      <span>Portal Pembangunan Usahawan Belia Kelantan (KBelia)</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print-screen" onclick="window.print()">
        🖨️ Cetak / Simpan Sebagai PDF
      </button>
      <button class="btn-close-screen" onclick="window.close()">
        ✕ Tutup
      </button>
    </div>
  </div>

  <!-- Printable A4 Document Page -->
  <div class="document-page">
    <div class="royal-ribbon"></div>

    <!-- Official Header & Letterhead -->
    <div class="letterhead">
      <div class="agency-info">
        <div class="state-sub">KERAJAAN NEGERI KELANTAN · UNIVERSITI MALAYSIA KELANTAN (UMK)</div>
        <h1 class="agency-title">PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN</h1>
        <p class="agency-desc">
          Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK) bersama Pentadbiran Hal Ehwal Belia & Keusahawanan Negeri Kelantan.
        </p>
      </div>

      <div class="ref-block">
        <div>NO. RUJUKAN:</div>
        <div class="ref-val">${refNumber}</div>
        <div style="margin-top: 5px; font-size: 11.5px; color: #000000; opacity: 0.78;">TARIKH RASMI:</div>
        <div style="font-weight: 700; color: #000000; font-size: 13px;">${formattedDate}</div>
      </div>
    </div>

    <!-- Recipient Particulars -->
    <div class="recipient-card">
      <div>
        <div class="recipient-lbl">Dikeluarkan Kepada Usahawan:</div>
        <div class="recipient-name">${booking.applicantName}</div>
        <div class="recipient-biz">${booking.businessName} · <span style="font-weight: 500; color: #000000;">(${booking.businessCategory})</span></div>
        <div class="recipient-contact">Emel: ${booking.applicantEmail} &nbsp;·&nbsp; Tel: ${booking.applicantPhone}</div>
      </div>
      <div class="status-pill">
        ✓ DILULUSKAN (PERAKUAN RASMI)
      </div>
    </div>

    <!-- Official Approval Declaration -->
    <div class="decision-banner">
      <div class="decision-heading">
        SURAT TAWARAN PENEMPATAN KIOSK NIAGA BERSUBSIDI
      </div>
      <div class="decision-text">
        Sukacita dimaklumkan bahawa permohonan anda untuk menyewa ruang kiosk niaga bagi premis 
        <strong>${booking.slotName} (${booking.slotCode})</strong> telah 
        <strong>DILULUSKAN</strong> di bawah inisiatif Skim Kapsul Niaga Usahawan Belia Kelantan selepas melalui sesi semakan dan penilaian tapak oleh jawatankuasa pentadbir.
      </div>
    </div>

    <!-- Scheduled Placement Particulars Table -->
    <div class="table-section-title">
      Jadual Terma & Maklumat Penempatan Kiosk Bersubsidi
    </div>
    <table class="info-table">
      <tr>
        <th>Kod & Nama Premis Kiosk</th>
        <td><strong>${booking.slotCode}</strong> - ${booking.slotName}</td>
      </tr>
      <tr>
        <th>Lokasi Hab Penempatan</th>
        <td>${booking.hubLocation}, Negeri Kelantan Darul Naim</td>
      </tr>
      <tr>
        <th>Kadar Sewa Bersubsidi</th>
        <td>
          <span class="price-highlight">RM ${subsidizedRate.toFixed(2)} / sebulan</span>
          <span class="subsidy-tag">Subsidi ${safeSubsidy}% Ditaja Negeri (Asal RM${marketRate.toFixed(2)})</span>
        </td>
      </tr>
      <tr>
        <th>Tarikh Mula Beroperasi</th>
        <td><strong>${formattedStart}</strong></td>
      </tr>
      <tr>
        <th>Tarikh Akhir Beroperasi (Tamat Tempoh)</th>
        <td>
          <strong style="color: #000000; font-size: 14.5px;">${formattedEnd}</strong>
          <span style="display: inline-block; margin-left: 8px; background: #fef2f2; color: #000000; border: 1px solid #fecaca; border-radius: 6px; font-size: 11.5px; font-weight: 700; padding: 2px 8px;">Tempoh Penuh ${booking.durationMonths} Bulan</span>
        </td>
      </tr>
      <tr>
        <th>Tempoh Kontrak Sewaan</th>
        <td>${booking.durationMonths} Bulan (Bermula ${formattedStart} sehingga ${formattedEnd})</td>
      </tr>
      <tr>
        <th>Status Kelulusan</th>
        <td><strong style="color: #000000;">AKTIF & DILULUSKAN</strong> (Sedia Dimeterai Perjanjian Sewa)</td>
      </tr>
    </table>

    <!-- Kiosk Handover Directives -->
    <div class="handover-card">
      <div class="handover-title">Arahan Penyerahan Kunci & Pengesahan Tapak:</div>
      <p class="handover-p">
        ${booking.adminNotes || 'Sila hadir ke Pejabat Pengurusan Hab Kapsul Niaga berkenaan dalam masa tujuh (7) hari bekerja daripada tarikh surat ini bersama salinan dokumen pengenalan diri untuk urusan pengesahan meterai perjanjian dan penyerahan kunci digital kiosk.'}
      </p>
    </div>

    <!-- QR Integrity Verification & Digital Authority Seals -->
    <div class="verification-footer">
      <div class="qr-audit-box">
        <!-- Crisp SVG QR Code Representation -->
        <svg class="qr-code-svg" viewBox="0 0 100 100" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#ffffff"/>
          <!-- Position Detection Patterns (Top-Left, Top-Right, Bottom-Left) -->
          <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4"/>
          <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
          <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1"/>

          <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4"/>
          <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
          <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1"/>

          <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4"/>
          <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2"/>
          <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1"/>

          <!-- Data Grid Pattern -->
          <rect x="38" y="8" width="8" height="8" fill="#0f172a"/>
          <rect x="50" y="8" width="8" height="8" fill="#0f172a"/>
          <rect x="38" y="20" width="8" height="8" fill="#0f172a"/>
          <rect x="50" y="20" width="8" height="8" fill="#0f172a"/>
          <rect x="8" y="38" width="8" height="8" fill="#0f172a"/>
          <rect x="20" y="38" width="8" height="8" fill="#0f172a"/>
          <rect x="38" y="38" width="10" height="10" fill="#991b1b"/>
          <rect x="52" y="38" width="8" height="8" fill="#0f172a"/>
          <rect x="66" y="38" width="12" height="8" fill="#0f172a"/>
          <rect x="82" y="38" width="8" height="8" fill="#0f172a"/>

          <rect x="38" y="52" width="8" height="8" fill="#0f172a"/>
          <rect x="50" y="52" width="12" height="8" fill="#0f172a"/>
          <rect x="66" y="52" width="8" height="8" fill="#0f172a"/>
          <rect x="78" y="52" width="12" height="8" fill="#0f172a"/>

          <rect x="38" y="67" width="8" height="12" fill="#0f172a"/>
          <rect x="50" y="67" width="8" height="8" fill="#0f172a"/>
          <rect x="62" y="67" width="12" height="12" fill="#0f172a"/>
          <rect x="78" y="67" width="8" height="8" fill="#0f172a"/>

          <rect x="38" y="82" width="12" height="8" fill="#0f172a"/>
          <rect x="54" y="82" width="8" height="8" fill="#0f172a"/>
          <rect x="66" y="82" width="14" height="8" fill="#0f172a"/>
          <rect x="84" y="82" width="8" height="8" fill="#0f172a"/>
        </svg>

        <div>
          <div class="audit-meta-title">INTEGRITI KOD QR BERSIJIL</div>
          <div class="audit-meta-sub">Dokumen ini telah disahkan secara kriptografi melalui Sistem Pangkalan Data Berpusat KBelia.</div>
          <div class="audit-meta-hash">KOD: ${refNumber}</div>
        </div>
      </div>

      <div class="seal-sign-box">
        <div class="seal-badge">★ DIMETERAI RASMI UMK KELANTAN ★</div>
        <div class="sign-authority">PENTADBIRAN HAB KAPSUL NIAGA BELIA</div>
        <div class="sign-title">Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)</div>
      </div>
    </div>

    <!-- Official Legal Footer -->
    <div class="legal-disclaimer">
      Surat tawaran ini merupakan perakuan sah di bawah Akta Tandatangan Digital 1997 dan Akta Perdagangan Elektronik 2006.<br>
      Sebarang pemalsuan dokumen adalah suatu kesalahan di bawah Seksyen 468 Kanun Keseksaan (Akta 574).
    </div>
  </div>

  <script>
    // Automatic print trigger for dedicated print window
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print triggered with exception:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;
};

const escapeHtml = (val?: string | number | null): string => {
  const s = val === undefined || val === null ? '' : String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
}): string => {
  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap');
    @page { size: A4 portrait; margin: 8mm 10mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Public Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.55;
      font-size: 13.5px;
      padding: 20px 15px;
      -webkit-font-smoothing: antialiased;
    }
    .screen-toolbar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      background: #1E40AF;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.25);
    }
    .screen-toolbar-title { font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .screen-toolbar-badge { background: #F59E0B; color: #000000; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .toolbar-actions { display: flex; align-items: center; gap: 10px; }
    .btn-print-screen {
      background: linear-gradient(135deg, #FBBF24, #F59E0B);
      color: #000000;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-close-screen {
      background: rgba(255,255,255,0.14);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.28);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .document-page {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 30px 38px;
      border-radius: 4px;
      box-shadow: 0 12px 35px -10px rgba(15, 23, 42, 0.14);
      position: relative;
      border-top: 8px solid #1E40AF;
    }
    .royal-ribbon {
      height: 5px;
      background: linear-gradient(90deg, #1E40AF 0%, #2563EB 45%, #F59E0B 75%, #FBBF24 100%);
      margin: -30px -38px 22px -38px;
    }
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 14px;
      margin-bottom: 18px;
      border-bottom: 2px solid #1E40AF;
    }
    .lh-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
    .lh-crest {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #1E40AF;
      color: #ffffff;
      border: 2px solid #F59E0B;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      flex-shrink: 0;
    }
    .lh-kicker { font-size: 10.5px; font-weight: 800; letter-spacing: 0.9px; text-transform: uppercase; color: #1E40AF; margin-bottom: 2px; }
    .lh-title { font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1.25; }
    .lh-sub { font-size: 11.5px; color: #334155; margin-top: 3px; }
    .lh-meta {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: right;
      font-size: 11.5px;
      min-width: 215px;
      font-family: monospace;
      flex-shrink: 0;
    }
    .lh-meta-label { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .lh-meta-val { font-weight: 800; color: #0f172a; margin-bottom: 4px; word-break: break-all; }
    .doc-banner {
      text-align: center;
      margin-bottom: 18px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #1E40AF;
      border-radius: 6px;
    }
    .doc-banner-title { font-size: 14.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
    .doc-banner-status { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 999px; background: #ecfdf5; border: 1px solid #6ee7b7; font-size: 11px; font-weight: 800; color: #065f46; }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #1E40AF;
      margin: 16px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12.5px; border: 1px solid #cbd5e1; }
    .info-table th, .info-table td { padding: 7px 10px; border: 1px solid #cbd5e1; text-align: left; vertical-align: top; }
    .info-table th { background: #f8fafc; font-weight: 700; width: 34%; color: #0f172a; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; border: 1px solid #cbd5e1; }
    .data-table th { background: #1E40AF; color: #ffffff; padding: 7px 8px; border: 1px solid #1E40AF; font-weight: 700; text-align: left; }
    .data-table td { padding: 7px 8px; border: 1px solid #cbd5e1; color: #0f172a; }
    .data-table tr:nth-child(even) td { background: #f8fafc; }
    .clause-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
    .clause-title { font-size: 12.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
    .clause-text { font-size: 12px; color: #1e293b; line-height: 1.5; }
    .highlight-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin: 12px 0; font-size: 12.5px; }
    .verification-footer {
      margin-top: 22px;
      padding-top: 14px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .qr-audit-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      max-width: 380px;
    }
    .qr-code-svg { width: 52px; height: 52px; flex-shrink: 0; }
    .seal-sign-box { text-align: right; }
    .seal-badge {
      display: inline-block;
      border: 1.5px solid #F59E0B;
      background: #fffbeb;
      color: #0f172a;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .sign-authority { font-size: 12px; font-weight: 800; color: #0f172a; }
    .sign-title { font-size: 11px; color: #475569; }
    .legal-disclaimer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 11px;
      color: #475569;
    }
    @media print {
      body { background: #ffffff; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .screen-toolbar, .no-print { display: none !important; }
      .document-page { box-shadow: none; max-width: 100%; padding: 14px 18px; }
      .royal-ribbon { margin: -14px -18px 16px -18px; }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar no-print">
    <div class="screen-toolbar-title">
      <span>${escapeHtml(options.toolbarLabel)}</span>
      <span class="screen-toolbar-badge">${escapeHtml(options.badgeText)}</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn-print-screen" onclick="window.print()">Cetak / Simpan PDF</button>
      <button class="btn-close-screen" onclick="window.close()">Tutup</button>
    </div>
  </div>
  <div class="document-page">
    <div class="royal-ribbon"></div>
    <div class="letterhead">
      <div class="lh-left">
        <div class="lh-crest">KB</div>
        <div>
          <div class="lh-kicker">${escapeHtml(options.agencyKicker)}</div>
          <div class="lh-title">${escapeHtml(options.agencyHeading)}</div>
          <div class="lh-sub">${escapeHtml(options.agencySubheading)}</div>
        </div>
      </div>
      <div class="lh-meta">
        <div class="lh-meta-label">No. Rujukan Rasmi</div>
        <div class="lh-meta-val">${escapeHtml(options.refNumber)}</div>
        <div class="lh-meta-label">Tarikh Dokumen</div>
        <div class="lh-meta-val">${escapeHtml(options.issueDate)}</div>
        <div class="lh-meta-label">Status</div>
        <div class="lh-meta-val" style="margin-bottom:0;">${escapeHtml(options.statusText)}</div>
      </div>
    </div>

    ${options.bodyHtml}

    <div class="verification-footer">
      <div class="qr-audit-box">
        <svg class="qr-code-svg" viewBox="0 0 100 100" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#ffffff"/>
          <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4"/><rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2"/><rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1"/>
          <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4"/><rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2"/><rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1"/>
          <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4"/><rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2"/><rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1"/>
          <rect x="38" y="8" width="8" height="8" fill="#0f172a"/><rect x="50" y="8" width="8" height="8" fill="#0f172a"/>
          <rect x="38" y="38" width="10" height="10" fill="#991b1b"/><rect x="52" y="38" width="8" height="8" fill="#0f172a"/>
          <rect x="38" y="52" width="12" height="8" fill="#0f172a"/><rect x="66" y="52" width="12" height="8" fill="#0f172a"/>
          <rect x="38" y="67" width="8" height="12" fill="#0f172a"/><rect x="62" y="67" width="12" height="12" fill="#0f172a"/>
          <rect x="38" y="82" width="12" height="8" fill="#0f172a"/><rect x="66" y="82" width="14" height="8" fill="#0f172a"/>
        </svg>
        <div>
          <div style="font-size:11px;font-weight:800;color:#0f172a;">INTEGRITI KOD QR BERAUDIT</div>
          <div style="font-size:10.5px;color:#475569;">Disahkan melalui Portal Pengesahan Berpusat KBelia &amp; UMK.</div>
          <div style="font-size:11px;font-family:monospace;font-weight:700;color:#1E40AF;">KOD: ${escapeHtml(options.auditCode)}</div>
        </div>
      </div>
      <div class="seal-sign-box">
        <div class="seal-badge">${escapeHtml(options.sealText || '★ DIMETERAI RASMI KBelia KELANTAN ★')}</div>
        <div class="sign-authority">${escapeHtml(options.signatoryTitle)}</div>
        <div class="sign-title">${escapeHtml(options.signatorySub)}</div>
      </div>
    </div>
    <div class="legal-disclaimer">
      ${escapeHtml(options.legalNote || 'Dokumen rasmi ini dijana secara digital di bawah Akta Tandatangan Digital 1997 dan Akta Perdagangan Elektronik 2006.')}
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.focus(); window.print(); } catch (e) {}
      }, 350);
    });
  </script>
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
      <div class="doc-banner-title">PERJANJIAN PENYEWAAN DIGITAL KIOSK KAPSUL NIAGA BELIA KELANTAN</div>
      <div class="doc-banner-status">${escapeHtml(signedStatus)}</div>
    </div>
    <p style="margin-bottom:12px;">
      Perjanjian ini dimeterai pada <strong>${escapeHtml(formattedDate)}</strong> antara <strong>Pentadbiran Pembangunan Keusahawanan Belia Negeri Kelantan (KBelia) &amp; Universiti Malaysia Kelantan (UMK)</strong> ("Pemberi Sewa") dan pihak Penyewa seperti butiran di bawah:
    </p>
    <div class="section-title">Jadual A: Butiran Penyewa &amp; Premis Kiosk</div>
    <table class="info-table">
      <tr><th>Nama Penuh Penyewa</th><td><strong>${escapeHtml(booking.applicantName)}</strong></td></tr>
      <tr><th>Nama Perniagaan / Jenama</th><td>${escapeHtml(booking.businessName)} (${escapeHtml(booking.businessCategory)})</td></tr>
      <tr><th>No. Telefon &amp; E-mel</th><td>${escapeHtml(booking.applicantPhone)} · ${escapeHtml(booking.applicantEmail)}</td></tr>
      <tr><th>Kod &amp; Nama Unit Kiosk</th><td><strong>${escapeHtml(booking.slotCode)}</strong> - ${escapeHtml(booking.slotName)}</td></tr>
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
      Nama Penandatangan: <strong>${escapeHtml(booking.tenancySignatureName || booking.applicantName)}</strong> ·
      Status Meterai: <strong>${booking.tenancySigned ? 'SAH DIMETERAI' : 'BELUM DIMETERAI'}</strong>
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Perjanjian Sewa Kiosk - ${booking.slotCode} - ${refNumber}`,
    toolbarLabel: 'Perjanjian Penyewaan Digital Kiosk KBelia',
    badgeText: booking.tenancySigned ? 'Dimeterai Sah' : 'Draf Perjanjian',
    agencyKicker: 'KERAJAAN NEGERI KELANTAN · UNIVERSITI MALAYSIA KELANTAN (UMK)',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Urus Setia Penempatan Kiosk Modular & Keusahawanan Belia, Kampus Kota, Pengkalan Chepa, 16100 Kota Bharu, Kelantan',
    refNumber,
    issueDate: formattedDate,
    statusText: booking.tenancySigned ? 'SAH & DIMETERAI' : 'DRAF RASMI',
    bodyHtml,
    auditCode: refNumber,
    signatoryTitle: 'PENTADBIRAN HAB KAPSUL NIAGA BELIA',
    signatorySub: 'Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)'
  });
};

export const generateGrantApprovalOfficialHtml = (grant: GrantApplication): string => {
  const refCode = `GRT-${grant.id.slice(0, 10).toUpperCase()}`;
  const issueDate = formatDisplayDate(grant.createdAt);
  const amountText = grant.amount || grant.grantAmount || 'RM 3,000';
  const statusLabel = grant.status === 'approved' ? 'DILULUSKAN' : grant.status.toUpperCase();

  const bodyHtml = `
    <div class="doc-banner">
      <div class="doc-banner-title">SURAT PENGESAHAN KELULUSAN PERUNTUKAN GERAN USAHAWAN BELIA</div>
      <div class="doc-banner-status">STATUS: ${escapeHtml(statusLabel)}</div>
    </div>
    <p style="margin-bottom:12px;">
      Sukacita dimaklumkan bahawa Jawatankuasa Penilaian Dana Usahawan Belia Negeri Kelantan (KBelia) telah meneliti dan mengesahkan permohonan geran di bawah ini:
    </p>
    <table class="info-table">
      <tr><th>Nama Pemohon</th><td><strong>${escapeHtml(grant.applicantName)}</strong></td></tr>
      <tr><th>Nama Perniagaan &amp; Kategori</th><td>${escapeHtml(grant.businessName)} (${escapeHtml(grant.businessCategory)})</td></tr>
      <tr><th>Jajahan Operasi</th><td>${escapeHtml(grant.district || 'Kelantan')} ${grant.ssmNumber ? `· SSM: ${escapeHtml(grant.ssmNumber)}` : ''}</td></tr>
      <tr><th>Skim / Program Geran</th><td><strong>${escapeHtml(grant.programTitle)}</strong></td></tr>
      <tr><th>Jumlah Peruntukan Diluluskan</th><td><strong style="font-size:15px;">${escapeHtml(amountText)}</strong></td></tr>
      <tr><th>Akaun Bank Penerima</th><td>${escapeHtml(grant.bankName)} · No. Akaun: ${escapeHtml(grant.bankAccountNumber)}</td></tr>
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
    agencySubheading: 'Jawatankuasa Pembiayaan & Geran Pemula Belia Kelantan dengan Kerjasama UMK CEED',
    refNumber: refCode,
    issueDate,
    statusText: statusLabel,
    bodyHtml,
    auditCode: refCode,
    signatoryTitle: 'JAWATANKUASA KELULUSAN GERAN BELIA',
    signatorySub: 'Portal Pembangunan Usahawan Belia Negeri Kelantan'
  });
};

export const generateMentorEndorsementOfficialHtml = (endorsement: GrantEndorsementLetter): string => {
  const issueDate = formatDisplayDate(endorsement.issuedAt);
  const bodyHtml = `
    <div class="doc-banner">
      <div class="doc-banner-title">SURAT PERAKUAN &amp; SOKONGAN RASMI MENTOR BAGI PERMOHONAN GERAN BELIA</div>
      <div class="doc-banner-status">SYOR PERUNTUKAN: ${escapeHtml(endorsement.recommendedAmount)} · ${endorsement.status === 'active' ? 'SAH & AKTIF' : 'DITARIK BALIK'}</div>
    </div>
    <p style="margin-bottom:12px;">
      Kepada Jawatankuasa Pemilihan Geran Usahawan Belia Negeri Kelantan / UMK CEED,<br/>
      Saya selaku Mentor yang menyelia perkembangan perniagaan usahawan berikut memperakukan permohonan geran ini berdasarkan prestasi bimbingan semasa:
    </p>
    <table class="info-table">
      <tr><th>Nama Mentee / Usahawan</th><td><strong>${escapeHtml(endorsement.menteeName)}</strong></td></tr>
      <tr><th>Nama Perniagaan &amp; Niche</th><td>${escapeHtml(endorsement.businessName)} (${escapeHtml(endorsement.businessCategory)})</td></tr>
      <tr><th>Jajahan Operasi</th><td>${escapeHtml(endorsement.district)}, Kelantan</td></tr>
      <tr><th>Skim Geran Disyorkan</th><td><strong>${escapeHtml(endorsement.grantProgramTitle)}</strong></td></tr>
      <tr><th>Cadangan Nilai Peruntukan</th><td><strong>${escapeHtml(endorsement.recommendedAmount)}</strong></td></tr>
      <tr><th>Justifikasi Perakuan Mentor</th><td>${escapeHtml(endorsement.justification)}</td></tr>
      <tr><th>Status Kesiapsiagaan Bisnes</th><td>${escapeHtml(endorsement.businessReadinessRemark)}</td></tr>
    </table>
    <div class="highlight-card">
      <strong>Diperakui Oleh Mentor:</strong><br/>
      <strong>${escapeHtml(endorsement.mentorName)}</strong> · ${escapeHtml(endorsement.mentorDesignation || 'Mentor Keusahawanan')}<br/>
      Agensi: ${escapeHtml(endorsement.mentorAgency)}
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Surat Perakuan Geran - ${endorsement.endorsementCode}`,
    toolbarLabel: 'Surat Perakuan Rasmi Mentor UMK CEED',
    badgeText: endorsement.recommendedAmount,
    agencyKicker: 'UNIVERSITI MALAYSIA KELANTAN (UMK CEED) · HAB NIAGA BELIA KELANTAN',
    agencyHeading: 'INSTITUT KEUSAHAWANAN UMK & MENTOR KBELIA',
    agencySubheading: 'Kampus Kota, Pengkalan Chepa, 16100 Kota Bharu, Kelantan · Tel: +609-771 7000',
    refNumber: endorsement.endorsementCode,
    issueDate,
    statusText: endorsement.status === 'active' ? 'DISYORKAN RASMI' : 'DIBATALKAN',
    bodyHtml,
    auditCode: endorsement.endorsementCode,
    signatoryTitle: endorsement.mentorName.toUpperCase(),
    signatorySub: `${endorsement.mentorDesignation || 'Mentor'} · ${endorsement.mentorAgency}`,
    sealText: '★ DIPERAKUI MENTOR UMK CEED ★'
  });
};

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
  const bodyHtml = `
    <div style="border: 3px double #1E40AF; border-radius: 10px; padding: 24px 22px; text-align: center; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); margin-bottom: 14px;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #1E40AF; text-transform: uppercase;">SIJIL PENGIKTIRAFAN KEAHLIAN RASMI</div>
      <div style="font-size: 21px; font-weight: 900; color: #0f172a; margin: 6px 0 14px 0;">SIJIL PENDAFTARAN USAHAWAN BELIA KELANTAN</div>
      <div style="font-size: 13px; color: #334155;">Dengan ini diperakui bahawa:</div>
      <div style="font-size: 20px; font-weight: 900; color: #1E40AF; margin: 8px 0 4px 0;">${escapeHtml(params.fullName)}</div>
      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 14px;">
        ${escapeHtml(params.businessName || 'Perusahaan Belia Berdaftar Kelantan')}
      </div>
      <p style="font-size: 13px; color: #1e293b; max-width: 620px; margin: 0 auto 14px auto; line-height: 1.6;">
        Telah didaftarkan secara sah di bawah Ekosistem Pemerkasaan Usahawan Belia Negeri Kelantan (KBelia) bersama Pusat Pembangunan Keusahawanan Universiti Malaysia Kelantan (UMK CEED) dan layak mengakses fasiliti kiosk bersubsidi, klinik mentor, serta skim geran negeri.
      </p>
      <table class="info-table" style="text-align:left; margin-top:12px;">
        <tr><th>No. Pendaftaran Keahlian</th><td><strong>${escapeHtml(params.refCode)}</strong></td></tr>
        <tr><th>Jajahan Operasi</th><td>${escapeHtml(params.district || 'Negeri Kelantan')}</td></tr>
        <tr><th>No. Pendaftaran SSM</th><td>${escapeHtml(params.ssmNumber || 'Dalam Rekod Portal KBelia')}</td></tr>
        <tr><th>Tarikh Pengesahan</th><td>${escapeHtml(issued)}</td></tr>
      </table>
    </div>
  `;

  return buildOfficialLetterheadShell({
    title: `Sijil Pendaftaran Usahawan Belia - ${params.refCode}`,
    toolbarLabel: 'Sijil Pendaftaran Usahawan Belia Kelantan',
    badgeText: 'Sijil Sah',
    agencyKicker: 'KERAJAAN NEGERI KELANTAN · UNIVERSITI MALAYSIA KELANTAN (UMK)',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Sijil Pendaftaran Rasmi Rangkaian Keusahawanan Anak Muda Kelantan',
    refNumber: params.refCode,
    issueDate: issued,
    statusText: 'KEAHLIAN AKTIF',
    bodyHtml,
    auditCode: params.refCode,
    signatoryTitle: 'URUSETIA INDUK KBelia KELANTAN',
    signatorySub: 'Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)'
  });
};

export const generateOfficialReceiptHtml = (
  booking: CapsuleBooking,
  refNumber: string,
  subsidyRate: number = 50
): string => {
  const rate = Number(booking.monthlyRate || 150);
  const safeSubsidy = Math.min(99, Math.max(0, Number(subsidyRate) || 50));
  const marketRate = safeSubsidy > 0 && safeSubsidy < 100
    ? Math.round((rate / (1 - safeSubsidy / 100)) * 100) / 100
    : rate * 2;
  const issueDate = formatDisplayDate(booking.createdAt);

  const bodyHtml = `
    <div class="doc-banner">
      <div class="doc-banner-title">RESIT RASMI PEMBAYARAN KOMITMEN &amp; SEWAAN KIOSK KBelia</div>
      <div class="doc-banner-status">TRANSAKSI BERJAYA &amp; DIPERAKUI</div>
    </div>
    <table class="info-table">
      <tr><th>Diterima Daripada</th><td><strong>${escapeHtml(booking.applicantName)}</strong> - ${escapeHtml(booking.businessName)}</td></tr>
      <tr><th>Unit Kiosk &amp; Lokasi</th><td>${escapeHtml(booking.slotCode)} · ${escapeHtml(booking.slotName)} (${escapeHtml(booking.hubLocation)})</td></tr>
      <tr><th>Tempoh Sewaan</th><td>${escapeHtml(booking.durationMonths)} Bulan (Mula: ${escapeHtml(formatDisplayDate(booking.startDate))})</td></tr>
    </table>
    <div class="section-title">Butiran Caj &amp; Subsidi Kerajaan Negeri</div>
    <table class="data-table">
      <thead>
        <tr><th>Keterangan Urusniaga</th><th style="text-align:right;width:150px;">Jumlah (RM)</th></tr>
      </thead>
      <tbody>
        <tr><td>Kadar Komitmen Sewaan Bulanan Kiosk Modular (Kadar Asal Pasaran RM ${marketRate.toFixed(2)})</td><td style="text-align:right;font-family:monospace;">${marketRate.toFixed(2)}</td></tr>
        <tr><td>Subsidi Pemerkasaan Belia Kerajaan Negeri Kelantan (${safeSubsidy}%)</td><td style="text-align:right;font-family:monospace;color:#065f46;">- ${(marketRate - rate).toFixed(2)}</td></tr>
        <tr><td>Deposit Kebersihan &amp; Utiliti Elektrik 13A</td><td style="text-align:right;font-family:monospace;">50.00</td></tr>
        <tr><td>Rebat Deposit Kemasukan Usahawan Belia</td><td style="text-align:right;font-family:monospace;color:#065f46;">- 50.00</td></tr>
        <tr style="background:#eff6ff;font-weight:900;"><td><strong>JUMLAH BERSIH DIBAYAR (SEBULAN)</strong></td><td style="text-align:right;font-family:monospace;"><strong>RM ${rate.toFixed(2)}</strong></td></tr>
      </tbody>
    </table>
  `;

  return buildOfficialLetterheadShell({
    title: `Resit Rasmi KBelia - ${refNumber}`,
    toolbarLabel: 'Resit Rasmi Bayaran Sewaan Kiosk',
    badgeText: 'Lunas',
    agencyKicker: 'SISTEM PERAKAUNAN BERSEPADU KBelia · KERAJAAN NEGERI KELANTAN',
    agencyHeading: 'PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)',
    agencySubheading: 'Pejabat Bendahari & Urus Setia Hab Kapsul Niaga Belia Kelantan',
    refNumber,
    issueDate,
    statusText: 'LUNAS & SAH',
    bodyHtml,
    auditCode: refNumber,
    signatoryTitle: 'UNIT KEWANGAN & PEROLEHAN KBelia',
    signatorySub: 'Resit dijana secara automatik oleh sistem dan sah tanpa tandatangan basah.'
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
    const bodyHtml = `
      <div class="doc-banner">
        <div class="doc-banner-title">PAPARAN QR DUITNOW &amp; PENGESAHAN PERNIAGAAN BERDAFTAR KIOSK</div>
        <div class="doc-banner-status">SEDIA UNTUK PAPARAN KAUNTER KIOSK</div>
      </div>
      <div style="border:2px solid #1E40AF;border-radius:14px;padding:26px;text-align:center;background:#f8fafc;margin-bottom:14px;">
        <div style="font-size:12px;font-weight:800;color:#1E40AF;letter-spacing:1px;text-transform:uppercase;">IMBAS &amp; BAYAR TANPA TUNAI</div>
        <div style="font-size:20px;font-weight:900;color:#0f172a;margin:4px 0;">${escapeHtml(params.businessName)}</div>
        <div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:16px;">${escapeHtml(params.kioskName)} · Rangkaian Usahawan Belia Kelantan</div>
        <div style="display:inline-block;padding:16px;background:#ffffff;border:2px solid #cbd5e1;border-radius:14px;">
          <svg width="160" height="160" viewBox="0 0 100 100" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#ffffff"/>
            <rect x="6" y="6" width="26" height="26" fill="#0f172a" rx="3"/><rect x="10" y="10" width="18" height="18" fill="#ffffff" rx="2"/><rect x="14" y="14" width="10" height="10" fill="#0f172a"/>
            <rect x="68" y="6" width="26" height="26" fill="#0f172a" rx="3"/><rect x="72" y="10" width="18" height="18" fill="#ffffff" rx="2"/><rect x="76" y="14" width="10" height="10" fill="#0f172a"/>
            <rect x="6" y="68" width="26" height="26" fill="#0f172a" rx="3"/><rect x="10" y="72" width="18" height="18" fill="#ffffff" rx="2"/><rect x="14" y="76" width="10" height="10" fill="#0f172a"/>
            <rect x="40" y="10" width="8" height="8" fill="#0f172a"/><rect x="52" y="10" width="8" height="8" fill="#0f172a"/>
            <rect x="40" y="24" width="8" height="8" fill="#0f172a"/><rect x="52" y="24" width="10" height="8" fill="#0f172a"/>
            <rect x="10" y="40" width="10" height="8" fill="#0f172a"/><rect x="24" y="40" width="8" height="8" fill="#0f172a"/>
            <rect x="40" y="40" width="16" height="16" fill="#be123c" rx="2"/><rect x="64" y="40" width="12" height="8" fill="#0f172a"/><rect x="82" y="40" width="10" height="8" fill="#0f172a"/>
            <rect x="40" y="64" width="10" height="8" fill="#0f172a"/><rect x="56" y="64" width="12" height="12" fill="#0f172a"/><rect x="76" y="64" width="16" height="8" fill="#0f172a"/>
            <rect x="40" y="80" width="12" height="10" fill="#0f172a"/><rect x="60" y="80" width="14" height="10" fill="#0f172a"/><rect x="80" y="80" width="12" height="10" fill="#0f172a"/>
          </svg>
        </div>
        <div style="margin-top:12px;font-size:12px;font-weight:700;color:#0f172a;">Sokongan Pembayaran DuitNow QR &amp; e-Dompet Malaysia</div>
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
      signatorySub: 'Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)'
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
      <div class="doc-banner-title">PENYATA ALIRAN TUNAI &amp; LEJAR JUALAN HARIAN KIOSK</div>
      <div class="doc-banner-status">${escapeHtml(params.businessName)} · ${escapeHtml(params.kioskName)}</div>
    </div>
    <table class="info-table">
      <tr><th>Jumlah Jualan Kasar</th><td><strong>RM ${params.totals.totalRevenue.toFixed(2)}</strong> (Tunai: RM ${params.totals.totalCash.toFixed(2)} · QR: RM ${params.totals.totalQr.toFixed(2)})</td></tr>
      <tr><th>Jumlah Perbelanjaan Operasi</th><td>RM ${params.totals.totalExpenses.toFixed(2)}</td></tr>
      <tr><th>Untung Bersih Terkumpul</th><td><strong style="font-size:15px;">RM ${params.totals.netProfit.toFixed(2)}</strong></td></tr>
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
    signatorySub: 'Dijana menerusi Modul Buku Tunai Bersepadu Portal KBelia'
  });
};

/**
 * Opens a dedicated printable document via hidden iframe without blocked popups.
 */
export const openAndPrintDocument = (
  contentHtml: string,
  documentTitle: string = 'Salinan Dokumen Rasmi KBelia'
): Promise<boolean> => {
  return printHtmlViaIframe(contentHtml, documentTitle);
};

/**
 * Printable Iframe Helper
 */
export const printHtmlViaIframe = (
  contentHtml: string,
  documentTitle: string = 'Salinan Dokumen Rasmi KBelia'
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        resolve(true);
        return;
      }

      iframeDoc.open();
      // If the content is already a full HTML document, write it directly
      if (contentHtml.trim().toLowerCase().startsWith('<!doctype html>') || contentHtml.trim().toLowerCase().startsWith('<html')) {
        iframeDoc.write(contentHtml);
      } else {
        iframeDoc.write(`
          <!DOCTYPE html>
          <html lang="ms">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${documentTitle}</title>
              <style>
                @page { size: A4 portrait; margin: 15mm 18mm; }
                *, *::before, *::after { box-sizing: border-box; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #0f172a;
                  background: #ffffff;
                  font-size: 14px;
                  line-height: 1.6;
                  margin: 0;
                  padding: 10px;
                }
                .no-print, button { display: none !important; }
                @media print {
                  body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${contentHtml}
            </body>
          </html>
        `);
      }
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch {
          window.print();
          resolve(true);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 2500);
        }
      }, 400);
    } catch {
      window.print();
      resolve(true);
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
          <title>${documentTitle}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 18mm; }
            *, *::before, *::after { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: 14px;
              line-height: 1.6;
              margin: 0 auto;
              max-width: 800px;
              padding: 30px;
            }
            .no-print { display: none !important; }
            @media print {
              body { padding: 0; max-width: 100%; }
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
