import { CapsuleBooking } from '../types';

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
  formattedDate: string
): string => {
  const formattedStart = formatDisplayDate(booking.startDate);
  const formattedEnd = calculateOperationEndDate(booking.startDate, booking.durationMonths);
  const subsidizedRate = Number(booking.monthlyRate || 150);
  const marketRate = subsidizedRate * 2;

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Tawaran Penempatan Kiosk - ${booking.slotCode} - ${refNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');

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
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      font-size: 11.5px;
      padding: 20px 15px;
      -webkit-font-smoothing: antialiased;
    }

    /* Screen-only Action Toolbar */
    .screen-toolbar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }

    .screen-toolbar-title {
      font-size: 11.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #cbd5e1;
    }

    .screen-toolbar-badge {
      background: #10b981;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-print-screen {
      background-color: #b45309;
      background-image: linear-gradient(135deg, #d97706, #b45309);
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);
    }

    .btn-print-screen:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    .btn-close-screen {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 11.5px;
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
      background: linear-gradient(90deg, #881337 0%, #991b1b 40%, #b45309 70%, #d97706 100%);
    }

    /* Letterhead */
    .letterhead {
      border-bottom: 2px solid #991b1b;
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
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #991b1b;
      margin-bottom: 2px;
    }

    .agency-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    .agency-desc {
      font-size: 10.5px;
      color: #475569;
      margin-top: 3px;
      line-height: 1.35;
    }

    .ref-block {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: right;
      font-size: 10.5px;
      line-height: 1.4;
      font-family: monospace;
      color: #334155;
      min-width: 200px;
    }

    .ref-val {
      font-weight: 800;
      color: #991b1b;
    }

    /* Recipient Details */
    .recipient-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #b45309;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
    }

    .recipient-lbl {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 2px;
    }

    .recipient-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }

    .recipient-biz {
      font-size: 11.5px;
      font-weight: 600;
      color: #b45309;
      margin-top: 1px;
    }

    .recipient-contact {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 2px;
    }

    .status-pill {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 800;
      text-align: center;
      white-space: nowrap;
    }

    /* Decision Box */
    .decision-banner {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }

    .decision-heading {
      font-size: 12px;
      font-weight: 800;
      color: #166534;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .decision-text {
      font-size: 11.5px;
      color: #14532d;
      line-height: 1.45;
    }

    /* Structured Table */
    .table-section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #991b1b;
      margin-bottom: 6px;
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
      padding: 7px 10px;
      text-align: left;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      width: 34%;
    }

    table.info-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      font-size: 11px;
      color: #0f172a;
    }

    .price-highlight {
      font-size: 12.5px;
      font-weight: 800;
      color: #b45309;
    }

    .subsidy-tag {
      display: inline-block;
      margin-left: 8px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      padding: 1px 6px;
    }

    /* Handover Guide Card */
    .handover-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }

    .handover-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #92400e;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .handover-p {
      font-size: 10.5px;
      color: #78350f;
      line-height: 1.4;
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
      padding: 8px 12px;
      max-width: 380px;
    }

    .qr-code-svg {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .audit-meta-title {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }

    .audit-meta-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 1px;
      line-height: 1.3;
    }

    .audit-meta-hash {
      font-size: 8.5px;
      font-family: monospace;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Digital Seal Emblem */
    .seal-sign-box {
      text-align: right;
    }

    .seal-badge {
      display: inline-block;
      border: 1.5px solid #b45309;
      background: #fffbeb;
      color: #92400e;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .sign-authority {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
    }

    .sign-title {
      font-size: 9px;
      color: #64748b;
      margin-top: 1px;
    }

    .legal-disclaimer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      line-height: 1.35;
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
        <div style="margin-top: 4px; font-size: 10px; color: #64748b;">TARIKH RASMI:</div>
        <div style="font-weight: 600; color: #0f172a;">${formattedDate}</div>
      </div>
    </div>

    <!-- Recipient Particulars -->
    <div class="recipient-card">
      <div>
        <div class="recipient-lbl">Dikeluarkan Kepada Usahawan:</div>
        <div class="recipient-name">${booking.applicantName}</div>
        <div class="recipient-biz">${booking.businessName} · <span style="font-weight: 500; color: #475569;">(${booking.businessCategory})</span></div>
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
        <td><strong>${booking.slotCode}</strong> — ${booking.slotName}</td>
      </tr>
      <tr>
        <th>Lokasi Hab Penempatan</th>
        <td>${booking.hubLocation}, Negeri Kelantan Darul Naim</td>
      </tr>
      <tr>
        <th>Kadar Sewa Bersubsidi</th>
        <td>
          <span class="price-highlight">RM ${subsidizedRate.toFixed(2)} / sebulan</span>
          <span class="subsidy-tag">Subsidi 50% Ditaja Negeri (Asal RM${marketRate.toFixed(2)})</span>
        </td>
      </tr>
      <tr>
        <th>Tarikh Mula Beroperasi</th>
        <td><strong>${formattedStart}</strong></td>
      </tr>
      <tr>
        <th>Tarikh Akhir Beroperasi (Tamat Tempoh)</th>
        <td>
          <strong style="color: #991b1b; font-size: 13.5px;">${formattedEnd}</strong>
          <span style="display: inline-block; margin-left: 8px; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 6px; font-size: 10.5px; font-weight: 700; padding: 2px 7px;">Tempoh Penuh ${booking.durationMonths} Bulan</span>
        </td>
      </tr>
      <tr>
        <th>Tempoh Kontrak Sewaan</th>
        <td>${booking.durationMonths} Bulan (Bermula ${formattedStart} sehingga ${formattedEnd})</td>
      </tr>
      <tr>
        <th>Status Kelulusan</th>
        <td><strong style="color: #047857;">AKTIF & DILULUSKAN</strong> (Sedia Dimeterai Perjanjian Sewa)</td>
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
                  font-size: 13px;
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
              font-size: 13px;
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
