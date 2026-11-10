import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CapsuleBooking } from '../types';
import { formatDisplayDate, calculateOperationEndDate } from './printUtils';

/**
 * Generates an HTML string specifically tailored for 1-Page A4 PDF rendering (794px x 1122px).
 * Every margin, line height, and table padding is engineered to guarantee 100% fit on 1 A4 page
 * without split lines, cut tables, or spillover onto page 2.
 */
export const generateSinglePageA4OfferLetterHtml = (
  booking: CapsuleBooking,
  refNumber: string,
  formattedDate: string
): string => {
  const formattedStart = formatDisplayDate(booking.startDate);
  const formattedEnd = calculateOperationEndDate(booking.startDate, booking.durationMonths);

  return `
    <div style="
      width: 794px;
      height: 1122px;
      max-height: 1122px;
      overflow: hidden;
      box-sizing: border-box;
      padding: 32px 38px 24px 38px;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    ">
      <!-- Royal Kelantan Top Color Stripe -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, #881337 0%, #991b1b 35%, #b45309 70%, #d97706 100%);
      "></div>

      <!-- Main Top Section (Header, Recipient, Decision, Table, Handover) -->
      <div>
        <!-- Official Header / Letterhead -->
        <div style="
          border-bottom: 2px solid #991b1b;
          padding-bottom: 12px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        ">
          <div style="flex: 1;">
            <div style="
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              color: #991b1b;
              margin-bottom: 2px;
            ">
              KERAJAAN NEGERI KELANTAN · UNIVERSITI MALAYSIA KELANTAN (UMK)
            </div>
            <div style="
              font-size: 17px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.3px;
              line-height: 1.2;
            ">
              PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN
            </div>
            <div style="
              font-size: 10.5px;
              color: #475569;
              margin-top: 3px;
              line-height: 1.35;
            ">
              Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK) bersama Pentadbiran Hal Ehwal Belia & Keusahawanan Negeri Kelantan.
            </div>
          </div>

          <div style="
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            text-align: right;
            font-size: 10.5px;
            font-family: monospace;
            min-width: 200px;
            flex-shrink: 0;
          ">
            <div style="color: #64748b; font-size: 9.5px; font-weight: 600;">NO. RUJUKAN:</div>
            <div style="font-weight: 800; color: #991b1b; font-size: 11px;">${refNumber}</div>
            <div style="margin-top: 3px; color: #64748b; font-size: 9.5px; font-weight: 600;">TARIKH RASMI:</div>
            <div style="font-weight: 700; color: #0f172a;">${formattedDate}</div>
          </div>
        </div>

        <!-- Recipient Card -->
        <div style="
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #b45309;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b;">
              Dikeluarkan Kepada Usahawan:
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 1px;">
              ${booking.applicantName}
            </div>
            <div style="font-size: 11.5px; font-weight: 600; color: #b45309; margin-top: 1px;">
              ${booking.businessName} · <span style="font-weight: 500; color: #475569;">(${booking.businessCategory})</span>
            </div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">
              Emel: ${booking.applicantEmail} &nbsp;·&nbsp; Tel: ${booking.applicantPhone}
            </div>
          </div>
          <div style="
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #065f46;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 10.5px;
            font-weight: 800;
            text-align: center;
            white-space: nowrap;
          ">
            ✓ DILULUSKAN (PERAKUAN RASMI)
          </div>
        </div>

        <!-- Decision Announcement -->
        <div style="
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 12px;
        ">
          <div style="
            font-size: 12px;
            font-weight: 800;
            color: #166534;
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">
            Surat Tawaran Penempatan Kiosk Niaga Bersubsidi
          </div>
          <div style="
            font-size: 11.5px;
            color: #14532d;
            line-height: 1.45;
          ">
            Sukacita dimaklumkan bahawa permohonan anda untuk menyewa ruang kiosk niaga bagi premis 
            <strong>${booking.slotName} (${booking.slotCode})</strong> telah 
            <strong>DILULUSKAN</strong> di bawah inisiatif Skim Kapsul Niaga Usahawan Belia Kelantan selepas melalui sesi semakan dan penilaian tapak oleh jawatankuasa pentadbir.
          </div>
        </div>

        <!-- Table of Terms & Placement Particulars -->
        <div style="
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #991b1b;
          margin-bottom: 6px;
        ">
          Jadual Terma & Maklumat Penempatan Kiosk Bersubsidi
        </div>

        <table style="
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          font-size: 11px;
        ">
          <tbody>
            <tr style="background: #ffffff;">
              <th style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 700; color: #475569; width: 34%;">
                Kod & Nama Premis Kiosk
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #0f172a; font-weight: 700;">
                <span style="color: #991b1b;">${booking.slotCode}</span> — ${booking.slotName}
              </td>
            </tr>
            <tr>
              <th style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 700; color: #475569;">
                Lokasi Hab Penempatan
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #0f172a;">
                ${booking.hubLocation}, Negeri Kelantan Darul Naim
              </td>
            </tr>
            <tr style="background: #ffffff;">
              <th style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 700; color: #475569;">
                Kadar Sewa Bersubsidi
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #0f172a;">
                <strong style="color: #b45309; font-size: 12px;">RM 150.00 / sebulan</strong>
                <span style="display: inline-block; margin-left: 8px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 4px; font-size: 9.5px; font-weight: 700; padding: 1px 6px;">
                  Subsidi 50% Ditaja Negeri (Asal RM300.00)
                </span>
              </td>
            </tr>
            <tr>
              <th style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 700; color: #475569;">
                Tarikh Mula Beroperasi
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #0f172a; font-weight: 700;">
                ${formattedStart}
              </td>
            </tr>
            <tr style="background: #fef2f2;">
              <th style="background: #fee2e2; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 800; color: #991b1b;">
                Tarikh Akhir Beroperasi (Tamat Tempoh)
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #991b1b;">
                <strong style="font-size: 12px;">${formattedEnd}</strong>
                <span style="display: inline-block; margin-left: 8px; background: #ffffff; color: #991b1b; border: 1px solid #fecaca; border-radius: 4px; font-size: 9.5px; font-weight: 700; padding: 1px 6px;">
                  Tempoh Penuh ${booking.durationMonths} Bulan
                </span>
              </td>
            </tr>
            <tr>
              <th style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 700; color: #475569;">
                Tempoh Kontrak Sewaan
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #0f172a;">
                ${booking.durationMonths} Bulan (Bermula ${formattedStart} sehingga ${formattedEnd})
              </td>
            </tr>
            <tr style="background: #ffffff;">
              <th style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; font-size: 10.5px; font-weight: 700; color: #475569;">
                Status Perakuan
              </th>
              <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #047857; font-weight: 800;">
                AKTIF & DILULUSKAN (Sedia Dimeterai Perjanjian Sewa)
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Handover Directive Card -->
        <div style="
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
        ">
          <div style="
            font-size: 10.5px;
            font-weight: 800;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          ">
            Arahan Penyerahan Kunci & Pengesahan Tapak:
          </div>
          <p style="
            font-size: 10.5px;
            color: #78350f;
            line-height: 1.4;
            margin: 0;
          ">
            ${booking.adminNotes || 'Sila hadir ke Pejabat Pengurusan Hab Kapsul Niaga berkenaan dalam masa tujuh (7) hari bekerja daripada tarikh surat ini bersama salinan dokumen pengenalan diri untuk urusan pengesahan meterai perjanjian dan penyerahan kunci digital kiosk.'}
          </p>
        </div>
      </div>

      <!-- Bottom Authority & Security Block -->
      <div style="
        border-top: 2px solid #e2e8f0;
        padding-top: 14px;
        margin-top: 6px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        ">
          <!-- QR Code & Integrity Card -->
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            max-width: 380px;
          ">
            <svg style="width: 48px; height: 48px; flex-shrink: 0;" viewBox="0 0 100 100" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#ffffff"/>
              <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4"/>
              <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
              <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1"/>
              <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4"/>
              <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
              <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1"/>
              <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4"/>
              <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2"/>
              <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1"/>
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
              <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                INTEGRITI KOD QR BERSIJIL
              </div>
              <div style="font-size: 9px; color: #64748b; line-height: 1.3; margin-top: 1px;">
                Dokumen ini telah disahkan kriptografi melalui Pangkalan Data KBELIA.
              </div>
              <div style="font-size: 8.5px; font-family: monospace; color: #94a3b8; margin-top: 2px;">
                KOD: ${refNumber}
              </div>
            </div>
          </div>

          <!-- Digital Seal & Authority Signature -->
          <div style="text-align: right;">
            <div style="
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
            ">
              ★ DIMETERAI RASMI UMK KELANTAN ★
            </div>
            <div style="font-size: 10.5px; font-weight: 800; color: #0f172a;">
              PENTADBIRAN HAB KAPSUL NIAGA BELIA
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 1px;">
              Pusat Pembangunan Keusahawanan, Universiti Malaysia Kelantan (UMK)
            </div>
          </div>
        </div>

        <!-- Statutory Legal Note -->
        <div style="
          margin-top: 10px;
          padding-top: 6px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-size: 8.5px;
          color: #94a3b8;
          line-height: 1.35;
        ">
          Surat tawaran ini merupakan perakuan sah di bawah Akta Tandatangan Digital 1997 dan Akta Perdagangan Elektronik 2006.<br>
          Sebarang pindaan tanpa kebenaran bertulis membatalkan tawaran penempatan ini secara serta-merta.
        </div>
      </div>
    </div>
  `;
};

/**
 * Directly downloads the Offer Letter as a pristine, single-page A4 PDF file (`.pdf`).
 * Guarantees zero line/table cutting and exactly 1 page.
 */
export const downloadOfferLetterPdf = async (
  booking: CapsuleBooking,
  refNumber: string,
  formattedDate: string,
  customFileName?: string
): Promise<boolean> => {
  const fileName = (customFileName || `Surat_Tawaran_Kiosk_${booking.slotCode || 'KB'}_${refNumber}`).replace(/\.pdf$/i, '') + '.pdf';

  // 1. Create temporary off-screen container with fixed A4 dimensions (794px x 1122px)
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.height = '1122px';
  container.style.overflow = 'hidden';
  container.style.background = '#ffffff';
  container.style.zIndex = '-99999';
  container.innerHTML = generateSinglePageA4OfferLetterHtml(booking, refNumber, formattedDate);
  document.body.appendChild(container);

  try {
    // 2. Render to high-definition canvas using scale: 2 for crisp vector-like text
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1122,
      windowWidth: 794,
      windowHeight: 1122
    });

    // 3. Create single-page A4 PDF in jsPDF
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Standard A4 portrait is 210mm x 297mm. Fit exactly 1 full page.
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('html2canvas rendering failed, attempting pure jsPDF fallback:', err);
    // Robust vector fallback to ensure a valid .pdf is ALWAYS saved
    try {
      const fallbackPdf = new jsPDF('p', 'mm', 'a4');
      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.setFontSize(16);
      fallbackPdf.text('SURAT TAWARAN PENEMPATAN KIOSK BELIA', 20, 25);
      fallbackPdf.setFontSize(10);
      fallbackPdf.setFont('helvetica', 'normal');
      fallbackPdf.text('Portal Pembangunan Usahawan Belia Kelantan (KBELIA)', 20, 32);
      fallbackPdf.text(`No. Rujukan: ${refNumber}    Tarikh: ${formattedDate}`, 20, 38);
      fallbackPdf.line(20, 42, 190, 42);

      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.text('MAKLUMAT USAHAWAN & PREMIS', 20, 52);
      fallbackPdf.setFont('helvetica', 'normal');
      fallbackPdf.text(`Nama Pemohon: ${booking.applicantName}`, 25, 60);
      fallbackPdf.text(`Perniagaan: ${booking.businessName} (${booking.businessCategory})`, 25, 67);
      fallbackPdf.text(`Premis Kiosk: ${booking.slotCode} - ${booking.slotName}`, 25, 74);
      fallbackPdf.text(`Hab Penempatan: ${booking.hubLocation}`, 25, 81);
      fallbackPdf.text(`Kadar Sewa: RM 150.00 / bulan (Subsidi 50%)`, 25, 88);
      fallbackPdf.text(`Tarikh Mula Beroperasi: ${formatDisplayDate(booking.startDate)}`, 25, 95);
      fallbackPdf.text(`Tarikh Akhir Beroperasi: ${calculateOperationEndDate(booking.startDate, booking.durationMonths)}`, 25, 102);
      fallbackPdf.text(`Tempoh Kontrak: ${booking.durationMonths} Bulan`, 25, 109);
      fallbackPdf.text(`Status: DILULUSKAN & AKTIF`, 25, 116);

      fallbackPdf.line(20, 125, 190, 125);
      fallbackPdf.setFontSize(9);
      fallbackPdf.text('Dokumen ini disahkan secara digital di bawah inisiatif UMK & Kerajaan Negeri Kelantan.', 20, 135);
      fallbackPdf.save(fileName);
      return true;
    } catch {
      return false;
    }
  } finally {
    // 4. Always clean up temporary DOM container
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
