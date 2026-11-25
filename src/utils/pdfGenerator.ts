import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CapsuleBooking, GrantApplication } from '../types';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  escapeHtml,
  buildKbeliaCrestSvg,
  buildWatermarkSvg,
  buildDigitalSealHtml
} from './printUtils';
import {
  buildVerificationQrPayload,
  computeIntegrityChecksum,
  generateQrSvgString
} from './qrUtils';
import { maskMyKad } from './securityUtils';

/**
 * Generates an executive HTML string tailored for crisp 1-Page A4 PDF rendering (794px x 1122px).
 * Features Royal Navy (#1E3A8A) & Antique Gold (#B45309) double border, corner security brackets,
 * KBelia crest emblem, subtle watermark, cop mohor digital seal, and a real scannable ECC-H QR code.
 */
export const generateSinglePageA4OfferLetterHtml = (
  booking: CapsuleBooking,
  refNumber: string,
  formattedDate: string,
  subsidyRate: number = 50
): string => {
  const formattedStart = formatDisplayDate(booking.startDate);
  const formattedEnd = calculateOperationEndDate(booking.startDate, booking.durationMonths);
  const monthlyRate = Number(booking.monthlyRate || 150);
  const safeSubsidy = Math.min(99, Math.max(0, Number(subsidyRate) || 50));
  const marketRate =
    safeSubsidy > 0 && safeSubsidy < 100
      ? Math.round((monthlyRate / (1 - safeSubsidy / 100)) * 100) / 100
      : monthlyRate * 2;
  const categoryText =
    booking.businessCategory === 'Makanan & Minuman (F&B)'
      ? 'Makanan & Minuman'
      : booking.businessCategory;

  const qrSvg = generateQrSvgString(buildVerificationQrPayload(refNumber), {
    size: 64,
    darkColor: '#0F172A',
    lightColor: '#FFFFFF',
    includeMonogram: true,
    monogramText: 'KB'
  });
  const checksum = computeIntegrityChecksum(refNumber);

  return `
    <div style="
      width: 794px;
      min-height: 1122px;
      box-sizing: border-box;
      padding: 14px;
      background: #ffffff;
      color: #0F172A;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="
        border: 3.5px solid #1E3A8A;
        padding: 5px;
        background: #ffffff;
        min-height: 1094px;
        box-sizing: border-box;
      ">
        <div style="
          border: 1.5px solid #B45309;
          padding: 22px 26px 18px 26px;
          background: #ffffff;
          position: relative;
          min-height: 1077px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        ">
          <!-- Corner Security Brackets -->
          <div style="position:absolute;top:-1px;left:-1px;width:16px;height:16px;border-top:3.5px solid #1E3A8A;border-left:3.5px solid #1E3A8A;"></div>
          <div style="position:absolute;top:-1px;right:-1px;width:16px;height:16px;border-top:3.5px solid #1E3A8A;border-right:3.5px solid #1E3A8A;"></div>
          <div style="position:absolute;bottom:-1px;left:-1px;width:16px;height:16px;border-bottom:3.5px solid #1E3A8A;border-left:3.5px solid #1E3A8A;"></div>
          <div style="position:absolute;bottom:-1px;right:-1px;width:16px;height:16px;border-bottom:3.5px solid #1E3A8A;border-right:3.5px solid #1E3A8A;"></div>

          <!-- Watermark -->
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.045;pointer-events:none;z-index:0;">
            ${buildWatermarkSvg()}
          </div>

          <!-- Top Content -->
          <div style="position:relative;z-index:1;">
            <!-- Official Header / Letterhead -->
            <div style="
              border-bottom: 2.5px solid #1E3A8A;
              padding-bottom: 12px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 14px;
            ">
              <div style="display:flex;align-items:flex-start;gap:12px;flex:1;">
                <div style="flex-shrink:0;padding-top:2px;">
                  ${buildKbeliaCrestSvg(46)}
                </div>
                <div>
                  <div style="
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.4px;
                    text-transform: uppercase;
                    color: #B45309;
                    margin-bottom: 2px;
                  ">
                    INISIATIF PEMERKASAAN USAHAWAN BELIA KELANTAN
                  </div>
                  <div style="
                    font-size: 16.5px;
                    font-weight: 900;
                    color: #0F172A;
                    letter-spacing: -0.25px;
                    line-height: 1.2;
                  ">
                    PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)
                  </div>
                  <div style="
                    font-size: 11px;
                    color: #475569;
                    margin-top: 3px;
                    line-height: 1.35;
                  ">
                    Urusetia Pengurusan Hab Kapsul Niaga Modular &amp; Keusahawanan Belia, Kota Bharu, Kelantan
                  </div>
                </div>
              </div>

              <div style="
                background: #F8FAFC;
                border: 1px solid #CBD5E1;
                border-top: 3px solid #B45309;
                padding: 8px 12px;
                text-align: right;
                font-size: 11px;
                min-width: 215px;
                flex-shrink: 0;
              ">
                <div style="color:#64748B;font-size:9.5px;font-weight:800;letter-spacing:0.7px;">NO. RUJUKAN RASMI</div>
                <div style="font-family:monospace;font-weight:800;color:#0F172A;font-size:12px;margin-top:1px;">${escapeHtml(refNumber)}</div>
                <div style="color:#64748B;font-size:9.5px;font-weight:800;letter-spacing:0.7px;margin-top:4px;">TARIKH DIKELUARKAN</div>
                <div style="font-weight:700;color:#0F172A;font-size:11.5px;margin-top:1px;">${escapeHtml(formattedDate)}</div>
              </div>
            </div>

            <!-- Document Heading Banner -->
            <div style="
              border-left: 4px solid #1E3A8A;
              background: #F8FAFC;
              padding: 9px 14px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            ">
              <div>
                <div style="font-size:9.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#B45309;">
                  PERAKUAN PENEMPATAN RASMI
                </div>
                <div style="font-size:14.5px;font-weight:900;color:#0F172A;letter-spacing:-0.15px;margin-top:1px;">
                  SURAT TAWARAN PENEMPATAN KIOSK NIAGA BERSUBSIDI
                </div>
              </div>
              <div style="
                border: 1.5px solid #1E3A8A;
                color: #1E3A8A;
                background: #FFFFFF;
                padding: 4px 10px;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 0.7px;
                text-transform: uppercase;
                white-space: nowrap;
              ">
                STATUS: DILULUSKAN
              </div>
            </div>

            <!-- Recipient Card -->
            <div style="
              background: #FFFFFF;
              border: 1px solid #CBD5E1;
              border-left: 3.5px solid #B45309;
              padding: 10px 14px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            ">
              <div>
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: #64748B;">
                  Dikeluarkan Kepada Usahawan:
                </div>
                <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                  ${escapeHtml(booking.applicantName)}
                </div>
                <div style="font-size: 12.5px; font-weight: 700; color: #1E293B; margin-top: 1px;">
                  ${escapeHtml(booking.businessName)} <span style="font-weight:500;color:#475569;">(${escapeHtml(categoryText)})</span>
                </div>
                <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                  E-mel: ${escapeHtml(booking.applicantEmail)} &nbsp;|&nbsp; Tel: ${escapeHtml(booking.applicantPhone)}
                </div>
              </div>
              <div style="text-align:right;font-size:11px;color:#334155;line-height:1.55;">
                <div><span>Kod Unit:</span> <strong style="font-family:monospace;color:#0F172A;">${escapeHtml(booking.slotCode)}</strong></div>
                <div><span>Tempoh:</span> <strong style="color:#0F172A;">${escapeHtml(booking.durationMonths)} Bulan</strong></div>
              </div>
            </div>

            <!-- Formal Opening Paragraph -->
            <p style="font-size:12.5px;color:#1E293B;line-height:1.55;margin:0 0 12px 0;">
              Sukacita dimaklumkan bahawa permohonan pihak tuan/puan untuk menyewa ruang kiosk niaga bagi premis 
              <strong>${escapeHtml(booking.slotName)} (${escapeHtml(booking.slotCode)})</strong> telah 
              <strong>DILULUSKAN</strong> di bawah inisiatif Skim Kapsul Niaga Usahawan Belia Negeri Kelantan selepas melalui semakan dan penilaian tapak oleh Jawatankuasa Pentadbir.
            </p>

            <!-- Table of Terms -->
            <div style="
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #1E3A8A;
              border-bottom: 1px solid #CBD5E1;
              padding-bottom: 4px;
              margin-bottom: 6px;
            ">
              Jadual Terma &amp; Maklumat Penempatan Kiosk Bersubsidi
            </div>

            <table style="
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              border: 1px solid #CBD5E1;
              font-size: 12px;
            ">
              <tbody>
                <tr>
                  <th style="background:#F8FAFC;border:1px solid #CBD5E1;padding:7px 10px;text-align:left;font-weight:700;color:#1E293B;width:34%;">
                    Kod &amp; Nama Premis Kiosk
                  </th>
                  <td style="border:1px solid #CBD5E1;padding:7px 10px;color:#0F172A;font-weight:700;">
                    <span style="font-family:monospace;">${escapeHtml(booking.slotCode)}</span> — ${escapeHtml(booking.slotName)}
                  </td>
                </tr>
                <tr>
                  <th style="background:#F8FAFC;border:1px solid #CBD5E1;padding:7px 10px;text-align:left;font-weight:700;color:#1E293B;">
                    Lokasi Hab Penempatan
                  </th>
                  <td style="border:1px solid #CBD5E1;padding:7px 10px;color:#0F172A;">
                    ${escapeHtml(booking.hubLocation)}, Negeri Kelantan Darul Naim
                  </td>
                </tr>
                <tr>
                  <th style="background:#F8FAFC;border:1px solid #CBD5E1;padding:7px 10px;text-align:left;font-weight:700;color:#1E293B;">
                    Kadar Sewa Bersubsidi
                  </th>
                  <td style="border:1px solid #CBD5E1;padding:7px 10px;color:#0F172A;">
                    <strong style="font-size:13px;">RM ${monthlyRate.toFixed(2)} / sebulan</strong>
                    <span style="margin-left:8px;color:#475569;font-size:11px;">
                      (Subsidi ${safeSubsidy}% Ditaja Negeri · Kadar Pasaran RM ${marketRate.toFixed(2)})
                    </span>
                  </td>
                </tr>
                <tr>
                  <th style="background:#F8FAFC;border:1px solid #CBD5E1;padding:7px 10px;text-align:left;font-weight:700;color:#1E293B;">
                    Tarikh Mula Beroperasi
                  </th>
                  <td style="border:1px solid #CBD5E1;padding:7px 10px;color:#0F172A;font-weight:700;">
                    ${escapeHtml(formattedStart)}
                  </td>
                </tr>
                <tr>
                  <th style="background:#F8FAFC;border:1px solid #CBD5E1;padding:7px 10px;text-align:left;font-weight:700;color:#1E293B;">
                    Tarikh Akhir Beroperasi
                  </th>
                  <td style="border:1px solid #CBD5E1;padding:7px 10px;color:#0F172A;">
                    <strong>${escapeHtml(formattedEnd)}</strong>
                    <span style="margin-left:8px;color:#475569;font-size:11px;">
                      (Tempoh Penuh ${escapeHtml(booking.durationMonths)} Bulan)
                    </span>
                  </td>
                </tr>
                <tr>
                  <th style="background:#F8FAFC;border:1px solid #CBD5E1;padding:7px 10px;text-align:left;font-weight:700;color:#1E293B;">
                    Status Perakuan
                  </th>
                  <td style="border:1px solid #CBD5E1;padding:7px 10px;color:#0F172A;font-weight:800;">
                    AKTIF &amp; DILULUSKAN — Sedia Dimeterai Perjanjian Sewaan Digital
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Handover Directive Clause Box -->
            <div style="
              background: #F8FAFC;
              border: 1px solid #CBD5E1;
              border-left: 3.5px solid #1E3A8A;
              padding: 9px 13px;
              margin-bottom: 10px;
            ">
              <div style="
                font-size: 10.5px;
                font-weight: 800;
                color: #1E3A8A;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                margin-bottom: 3px;
              ">
                Arahan Penyerahan Kunci &amp; Pengesahan Tapak:
              </div>
              <p style="font-size:11.5px;color:#334155;line-height:1.45;margin:0;">
                ${escapeHtml(booking.adminNotes || 'Pihak penerima dikehendaki hadir ke Pejabat Pengurusan Hab Kapsul Niaga berkenaan dalam tempoh tujuh (7) hari bekerja daripada tarikh surat ini bersama dokumen pengenalan diri untuk urusan meterai perjanjian dan penyerahan kunci digital kiosk.')}
              </p>
            </div>
          </div>

          <!-- Bottom Authority & Real Scannable QR Security Block -->
          <div style="
            position: relative;
            z-index: 1;
            border-top: 2px solid #CBD5E1;
            padding-top: 12px;
          ">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 16px;
            ">
              <!-- Real ECC-H QR Code -->
              <div style="
                display: flex;
                align-items: center;
                gap: 11px;
                background: #F8FAFC;
                border: 1px solid #CBD5E1;
                padding: 8px 11px;
                max-width: 390px;
              ">
                <div style="padding:3px;background:#ffffff;border:1px solid #CBD5E1;flex-shrink:0;line-height:0;">
                  ${qrSvg}
                </div>
                <div>
                  <div style="font-size:10px;font-weight:800;color:#1E3A8A;letter-spacing:0.6px;text-transform:uppercase;">
                    IMBAS KOD QR PENGESAHAN KETULENAN
                  </div>
                  <div style="font-size:10.5px;color:#475569;line-height:1.35;margin-top:2px;">
                    Disahkan dalam Pangkalan Data Portal KBelia Negeri Kelantan.
                  </div>
                  <div style="font-size:10px;font-family:monospace;color:#0F172A;font-weight:700;margin-top:3px;">
                    REF: ${escapeHtml(refNumber)} · DIGEST: ${checksum}
                  </div>
                </div>
              </div>

              <!-- Digital Seal & Authority Signature -->
              <div style="display:flex;align-items:center;gap:14px;">
                <div style="
                  width: 82px;
                  height: 82px;
                  border: 2px solid #1E3A8A;
                  border-radius: 50%;
                  padding: 3px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transform: rotate(-6deg);
                  flex-shrink: 0;
                ">
                  <div style="
                    width: 100%;
                    height: 100%;
                    border: 1px dashed #B45309;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 4px;
                  ">
                    <div style="font-size:6.5px;font-weight:800;letter-spacing:0.7px;color:#1E3A8A;">PORTAL KBELIA</div>
                    <div style="font-size:9px;font-weight:900;color:#B45309;margin:2px 0;line-height:1.05;">LULUS RASMI</div>
                    <div style="font-size:6px;font-weight:700;letter-spacing:0.4px;color:#475569;">KELANTAN DARUL NAIM</div>
                  </div>
                </div>

                <div style="text-align:right;min-width:170px;">
                  <div style="font-size:9.5px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.6px;">
                    Pengesahan Digital Pentadbir
                  </div>
                  <div style="font-family:Georgia,serif;font-style:italic;font-size:14px;font-weight:700;color:#0F172A;border-bottom:1.5px solid #0F172A;padding-bottom:3px;margin:4px 0 4px auto;display:inline-block;">
                    Urusetia Portal KBelia
                  </div>
                  <div style="font-size:11px;font-weight:800;color:#0F172A;">
                    PENTADBIRAN HAB KAPSUL NIAGA BELIA
                  </div>
                  <div style="font-size:10px;color:#475569;margin-top:1px;">
                    Hab Pembangunan Usahawan Belia Kelantan
                  </div>
                </div>
              </div>
            </div>

            <!-- Statutory Legal Note -->
            <div style="
              margin-top: 9px;
              padding-top: 7px;
              border-top: 1px dashed #CBD5E1;
              text-align: center;
              font-size: 9.5px;
              color: #475569;
              line-height: 1.4;
            ">
              Surat tawaran ini dijana secara elektronik melalui Portal KBelia dan sah di bawah Akta Tandatangan Digital 1997 serta Akta Perdagangan Elektronik 2006. Sebarang pindaan tanpa kebenaran bertulis membatalkan tawaran ini secara serta-merta.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Directly downloads the Offer Letter as a crisp, single-page A4 PDF file (`.pdf`).
 */
export const downloadOfferLetterPdf = async (
  booking: CapsuleBooking,
  refNumber: string,
  formattedDate: string,
  customFileName?: string,
  subsidyRate: number = 50
): Promise<boolean> => {
  const fileName =
    (customFileName || `Surat_Tawaran_Kiosk_${booking.slotCode || 'KB'}_${refNumber}`).replace(/\.pdf$/i, '') + '.pdf';
  const monthlyRate = Number(booking.monthlyRate || 150);
  const safeSubsidy = Math.min(99, Math.max(0, Number(subsidyRate) || 50));

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.minHeight = '1122px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-99999';
  container.innerHTML = generateSinglePageA4OfferLetterHtml(booking, refNumber, formattedDate, safeSubsidy);
  document.body.appendChild(container);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready.catch(() => undefined);
    }
    const captureHeight = Math.max(1122, container.scrollHeight);
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: captureHeight,
      windowWidth: 794,
      windowHeight: captureHeight
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    pdf.setProperties({
      title: `Surat Tawaran Penempatan Kiosk - ${booking.slotCode}`,
      subject: 'Dokumen Rasmi Portal KBelia Kelantan',
      author: 'Urusetia Portal KBelia'
    });

    if (imgHeight <= pageHeight + 2) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(pageHeight, imgHeight), undefined, 'FAST');
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
    }
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('html2canvas rendering failed, attempting pure jsPDF fallback:', err);
    try {
      const fallbackPdf = new jsPDF('p', 'mm', 'a4');
      fallbackPdf.setProperties({
        title: `Surat Tawaran Penempatan Kiosk - ${booking.slotCode}`,
        subject: 'Dokumen Rasmi Portal KBelia Kelantan',
        author: 'Urusetia Portal KBelia'
      });
      // Royal Navy & Antique Gold double border
      fallbackPdf.setDrawColor(30, 58, 138);
      fallbackPdf.setLineWidth(1.1);
      fallbackPdf.rect(10, 10, 190, 277);
      fallbackPdf.setDrawColor(180, 83, 9);
      fallbackPdf.setLineWidth(0.5);
      fallbackPdf.rect(13, 13, 184, 271);

      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.setFontSize(15);
      fallbackPdf.setTextColor(15, 23, 42);
      fallbackPdf.text('SURAT TAWARAN PENEMPATAN KIOSK BELIA', 20, 27);
      fallbackPdf.setFontSize(10);
      fallbackPdf.setFont('helvetica', 'normal');
      fallbackPdf.text('Portal Pembangunan Usahawan Belia Kelantan (KBelia)', 20, 34);
      fallbackPdf.text(`Nombor Rujukan: ${refNumber}    Tarikh: ${formattedDate}`, 20, 40);
      fallbackPdf.line(20, 44, 190, 44);

      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.text('MAKLUMAT USAHAWAN & PREMIS', 20, 54);
      fallbackPdf.setFont('helvetica', 'normal');
      fallbackPdf.text(`Nama Pemohon: ${booking.applicantName}`, 24, 62);
      fallbackPdf.text(
        `Perniagaan: ${booking.businessName} (${booking.businessCategory === 'Makanan & Minuman (F&B)' ? 'Makanan & Minuman' : booking.businessCategory})`,
        24,
        69
      );
      fallbackPdf.text(`Premis Kiosk: ${booking.slotCode} - ${booking.slotName}`, 24, 76);
      fallbackPdf.text(`Hab Penempatan: ${booking.hubLocation}`, 24, 83);
      fallbackPdf.text(`Kadar Sewa: RM ${monthlyRate.toFixed(2)} / bulan (Subsidi ${safeSubsidy}%)`, 24, 90);
      fallbackPdf.text(`Tarikh Mula Beroperasi: ${formatDisplayDate(booking.startDate)}`, 24, 97);
      fallbackPdf.text(`Tarikh Akhir Beroperasi: ${calculateOperationEndDate(booking.startDate, booking.durationMonths)}`, 24, 104);
      fallbackPdf.text(`Tempoh Kontrak: ${booking.durationMonths} Bulan`, 24, 111);
      fallbackPdf.text('Status: DILULUSKAN & AKTIF', 24, 118);

      fallbackPdf.line(20, 128, 190, 128);
      fallbackPdf.setFontSize(9);
      fallbackPdf.text(`Semakan Pengesahan QR: ${buildVerificationQrPayload(refNumber)}`, 20, 136);
      fallbackPdf.text('Dokumen ini disahkan secara digital di bawah inisiatif Portal KBelia Kelantan.', 20, 143);
      fallbackPdf.save(fileName);
      return true;
    } catch {
      return false;
    }
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

export interface OfficialApprovalReportParams {
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  reportRef: string;
  reportDate: string;
}

/**
 * Generates an executive HTML string for the Official Approval Report with authentic
 * Royal Navy & Antique Gold double borders, vector crest, watermark, digital seal, and real QR code.
 */
export const generateOfficialApprovalReportHtml = (params: OfficialApprovalReportParams): string => {
  const approvedBookings = params.bookings.filter((b) => b.status === 'approved');
  const approvedGrants = params.grantApplications.filter((g) => g.status === 'approved');

  const totalKioskSubsidy = approvedBookings.reduce((sum, b) => sum + (b.monthlyRate || 150), 0);
  const totalGrantAmount = approvedGrants.reduce((sum, g) => {
    const rawVal = (g.amount || g.grantAmount)
      ? parseFloat((g.amount || g.grantAmount).replace(/[^0-9.]/g, ''))
      : 3000;
    return sum + (isNaN(rawVal) ? 3000 : rawVal);
  }, 0);

  const qrSvg = generateQrSvgString(buildVerificationQrPayload(params.reportRef), {
    size: 64,
    darkColor: '#0F172A',
    lightColor: '#FFFFFF',
    includeMonogram: true,
    monogramText: 'KB'
  });
  const checksum = computeIntegrityChecksum(params.reportRef);

  return `
    <div style="
      width: 820px;
      box-sizing: border-box;
      background: #ffffff;
      color: #0F172A;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 14px;
    ">
      <div style="
        border: 3.5px solid #1E3A8A;
        padding: 5px;
        background: #ffffff;
        position: relative;
        box-sizing: border-box;
      ">
        <div style="
          border: 1.5px solid #B45309;
          padding: 24px 26px;
          background: #ffffff;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        ">
          <!-- 4 Corner Security Brackets -->
          <div style="position:absolute;top:-1px;left:-1px;width:16px;height:16px;border-top:3.5px solid #1E3A8A;border-left:3.5px solid #1E3A8A;"></div>
          <div style="position:absolute;top:-1px;right:-1px;width:16px;height:16px;border-top:3.5px solid #1E3A8A;border-right:3.5px solid #1E3A8A;"></div>
          <div style="position:absolute;bottom:-1px;left:-1px;width:16px;height:16px;border-bottom:3.5px solid #1E3A8A;border-left:3.5px solid #1E3A8A;"></div>
          <div style="position:absolute;bottom:-1px;right:-1px;width:16px;height:16px;border-bottom:3.5px solid #1E3A8A;border-right:3.5px solid #1E3A8A;"></div>

          <!-- Watermark -->
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.045;pointer-events:none;z-index:0;">
            ${buildWatermarkSvg()}
          </div>

          <div style="position:relative;z-index:1;">
            <!-- Top Letterhead -->
            <div style="
              border-bottom: 2.5px solid #1E3A8A;
              padding-bottom: 14px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
            ">
              <div style="display:flex;align-items:flex-start;gap:12px;flex:1;">
                <div style="flex-shrink:0;padding-top:2px;">
                  ${buildKbeliaCrestSvg(46)}
                </div>
                <div>
                  <div style="
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.3px;
                    text-transform: uppercase;
                    color: #B45309;
                    margin-bottom: 3px;
                  ">
                    HAB USAHAWAN BELIA KELANTAN · PORTAL KBELIA
                  </div>
                  <div style="
                    font-size: 18px;
                    font-weight: 900;
                    color: #0F172A;
                    letter-spacing: -0.25px;
                    line-height: 1.2;
                  ">
                    RINGKASAN RASMI KELULUSAN PERMOHONAN
                  </div>
                  <div style="
                    font-size: 11.5px;
                    color: #475569;
                    margin-top: 4px;
                    line-height: 1.4;
                  ">
                    Program Inisiatif Kapsul Niaga Modular &amp; Geran Pemula Usahawan Muda Negeri Kelantan
                  </div>
                </div>
              </div>

              <div style="
                background: #F8FAFC;
                border: 1px solid #CBD5E1;
                border-top: 3px solid #B45309;
                padding: 9px 13px;
                text-align: right;
                font-size: 11px;
                min-width: 230px;
                flex-shrink: 0;
              ">
                <div><strong style="color:#64748B;font-size:9.5px;letter-spacing:0.6px;">NOMBOR RUJUKAN:</strong> <span style="font-family:monospace;color:#0F172A;font-weight:800;">${escapeHtml(params.reportRef)}</span></div>
                <div style="margin-top:3px;"><strong style="color:#64748B;font-size:9.5px;letter-spacing:0.6px;">TARIKH RASMI:</strong> <span style="color:#0F172A;font-weight:700;">${escapeHtml(params.reportDate)}</span></div>
                <div style="margin-top:5px;">
                  <span style="display:inline-block;padding:3px 9px;font-size:10px;font-weight:800;background:#FFFFFF;color:#1E3A8A;border:1.5px solid #1E3A8A;">
                    STATUS: AUDIT SAH DILULUSKAN
                  </span>
                </div>
              </div>
            </div>

            <!-- KPI Metric Summary Cards -->
            <div style="
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 18px;
            ">
              <div style="padding:10px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-top:2.5px solid #1E3A8A;">
                <span style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;display:block;">Kiosk Diluluskan</span>
                <span style="font-size:17px;font-weight:900;color:#0F172A;">${approvedBookings.length} Unit</span>
              </div>
              <div style="padding:10px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-top:2.5px solid #1E3A8A;">
                <span style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;display:block;">Nilai Sewaan Kiosk</span>
                <span style="font-size:17px;font-weight:900;color:#0F172A;">RM${totalKioskSubsidy.toLocaleString()}/bulan</span>
              </div>
              <div style="padding:10px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-top:2.5px solid #B45309;">
                <span style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;display:block;">Geran Diluluskan</span>
                <span style="font-size:17px;font-weight:900;color:#0F172A;">${approvedGrants.length} Penerima</span>
              </div>
              <div style="padding:10px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-top:2.5px solid #B45309;">
                <span style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;display:block;">Peruntukan Geran</span>
                <span style="font-size:17px;font-weight:900;color:#0F172A;">RM${totalGrantAmount.toLocaleString()}</span>
              </div>
            </div>

            <!-- Section 1: Kiosk Approvals -->
            <div style="margin-bottom: 18px;">
              <div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:#1E3A8A;border-bottom:1.5px solid #1E3A8A;padding-bottom:4px;margin-bottom:8px;">
                1. Senarai Permohonan Kiosk Kapsul Niaga Yang Diluluskan (${approvedBookings.length})
              </div>
              ${approvedBookings.length === 0 ? `
                <div style="padding:12px;background:#F8FAFC;border:1px solid #CBD5E1;font-size:12px;color:#475569;text-align:center;">
                  Tiada rekod kelulusan kiosk aktif buat masa ini.
                </div>
              ` : `
                <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #CBD5E1;">
                  <thead>
                    <tr style="background:#F1F5F9;color:#0F172A;font-weight:800;">
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:center;width:32px;">Bil</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;">Nama Pemohon &amp; Perniagaan</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;width:125px;">No. Kad Pengenalan</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;">Kod Kiosk &amp; Lokasi Hab</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:right;width:90px;">Kadar Sewa</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${approvedBookings.map((b, idx) => `
                      <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;text-align:center;font-family:monospace;color:#475569;">${idx + 1}</td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;">
                          <strong style="color:#0F172A;display:block;">${escapeHtml(b.applicantName)}</strong>
                          <span style="color:#475569;font-size:11px;font-weight:600;">${escapeHtml(b.businessName)}</span>
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;font-family:monospace;color:#0F172A;">
                          ${escapeHtml(b.applicantMyKad ? maskMyKad(b.applicantMyKad) : 'Tidak Dinyatakan')}
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;">
                          <strong style="font-family:monospace;color:#0F172A;">${escapeHtml(b.slotCode)}</strong>
                          <span style="display:block;font-size:11px;color:#475569;">${escapeHtml(b.hubLocation || 'Hab Usahawan Bachok')}</span>
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;text-align:right;font-weight:800;font-family:monospace;color:#0F172A;">
                          RM${b.monthlyRate || 150}
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;color:#334155;font-size:11px;">
                          ${escapeHtml(b.adminNotes || 'Permohonan diluluskan rasmi.')}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>

            <!-- Section 2: Grant Approvals -->
            <div style="margin-bottom: 20px;">
              <div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:#1E3A8A;border-bottom:1.5px solid #1E3A8A;padding-bottom:4px;margin-bottom:8px;">
                2. Senarai Permohonan Geran Pemula Belia Yang Diluluskan (${approvedGrants.length})
              </div>
              ${approvedGrants.length === 0 ? `
                <div style="padding:12px;background:#F8FAFC;border:1px solid #CBD5E1;font-size:12px;color:#475569;text-align:center;">
                  Tiada rekod kelulusan geran aktif buat masa ini.
                </div>
              ` : `
                <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #CBD5E1;">
                  <thead>
                    <tr style="background:#F1F5F9;color:#0F172A;font-weight:800;">
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:center;width:32px;">Bil</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;">Nama Pemohon &amp; Perniagaan</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;">Kategori</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:left;">Akaun Bank</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:right;width:100px;">Peruntukan</th>
                      <th style="padding:7px 8px;border:1px solid #CBD5E1;text-align:center;width:100px;">Status Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${approvedGrants.map((g, idx) => `
                      <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;text-align:center;font-family:monospace;color:#475569;">${idx + 1}</td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;">
                          <strong style="color:#0F172A;display:block;">${escapeHtml(g.applicantName)}</strong>
                          <span style="color:#475569;font-size:11px;font-weight:600;">${escapeHtml(g.businessName)}</span>
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;color:#0F172A;">${escapeHtml(g.businessCategory)}</td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;font-family:monospace;font-size:11px;color:#0F172A;">
                          ${escapeHtml(g.bankName)} · ${escapeHtml(g.bankAccountNumber || '••••••••')}
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;text-align:right;font-weight:800;font-family:monospace;color:#0F172A;">
                          ${escapeHtml(g.amount || g.grantAmount || 'RM3,000')}
                        </td>
                        <td style="padding:7px 8px;border:1px solid #CBD5E1;text-align:center;">
                          <span style="display:inline-block;padding:2px 8px;font-size:10px;font-weight:800;background:#FFFFFF;color:#1E3A8A;border:1px solid #1E3A8A;">
                            LULUS AUDIT
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>

            <!-- Official Stamp, QR & Signatures Box -->
            <div style="
              border-top: 2px solid #CBD5E1;
              padding-top: 14px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 16px;
            ">
              <div style="display:flex;align-items:center;gap:11px;background:#F8FAFC;border:1px solid #CBD5E1;padding:8px 11px;max-width:360px;">
                <div style="padding:3px;background:#FFFFFF;border:1px solid #CBD5E1;flex-shrink:0;line-height:0;">
                  ${qrSvg}
                </div>
                <div>
                  <div style="font-size:10px;font-weight:800;color:#1E3A8A;text-transform:uppercase;letter-spacing:0.6px;">
                    PENGESAHAN AUDIT QR
                  </div>
                  <div style="font-size:10.5px;color:#475569;line-height:1.35;margin-top:2px;">
                    Salinan audit rasmi disahkan oleh Jawatankuasa Penyelaras Portal KBelia.
                  </div>
                  <div style="font-size:9.5px;font-family:monospace;color:#0F172A;font-weight:700;margin-top:3px;">
                    DIGEST: ${checksum}
                  </div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:14px;">
                ${buildDigitalSealHtml('AUDIT SAH')}
                <div style="text-align:right;min-width:170px;">
                  <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Pengesahan Pentadbir</div>
                  <div style="font-family:Georgia,serif;font-style:italic;font-size:14.5px;font-weight:800;color:#0F172A;border-bottom:1.5px solid #0F172A;padding-bottom:3px;margin:4px 0 4px auto;display:inline-block;">
                    Pentadbir Urusetia Belia
                  </div>
                  <div style="font-size:11px;font-weight:800;color:#0F172A;">Urusetia Pentadbiran Keusahawanan</div>
                  <div style="font-size:10px;color:#475569;">Hab Pembangunan Usahawan Belia Kelantan</div>
                </div>
              </div>
            </div>

            <!-- Bottom Security Code Footer -->
            <div style="
              margin-top: 14px;
              padding-top: 8px;
              border-top: 1px dashed #CBD5E1;
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              color: #475569;
              font-family: monospace;
            ">
              <span>DOKUMEN RASMI PORTAL KBELIA KELANTAN · INTEGRITI BERAUDIT</span>
              <span>KOD KESELAMATAN: KBN-AUDIT-SEC-${new Date().getFullYear()} · ${checksum}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Directly downloads the Official Approval Report as a crisp PDF file (`.pdf`) with Royal Double Border.
 */
export const downloadOfficialApprovalReportPdf = async (
  params: OfficialApprovalReportParams,
  customFileName?: string
): Promise<boolean> => {
  const cleanRef = (params.reportRef || 'AUDIT-LULUS').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName =
    (customFileName || `Laporan_Rasmi_Kelulusan_KBelia_${cleanRef}`).replace(/\.pdf$/i, '') + '.pdf';

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '820px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-99999';
  container.innerHTML = generateOfficialApprovalReportHtml(params);
  document.body.appendChild(container);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready.catch(() => undefined);
    }
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 820,
      windowWidth: 820
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    pdf.setProperties({
      title: `Ringkasan Rasmi Kelulusan - ${params.reportRef}`,
      subject: 'Dokumen Rasmi Portal KBelia Kelantan',
      author: 'Urusetia Portal KBelia'
    });

    let position = 0;
    let heightLeft = imgHeight;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('html2canvas rendering failed, attempting pure jsPDF fallback:', err);
    try {
      const fallbackPdf = new jsPDF('p', 'mm', 'a4');
      fallbackPdf.setProperties({
        title: `Ringkasan Rasmi Kelulusan - ${params.reportRef}`,
        subject: 'Dokumen Rasmi Portal KBelia Kelantan',
        author: 'Urusetia Portal KBelia'
      });
      fallbackPdf.setDrawColor(30, 58, 138);
      fallbackPdf.setLineWidth(1.2);
      fallbackPdf.rect(10, 10, 190, 277);
      fallbackPdf.setDrawColor(180, 83, 9);
      fallbackPdf.setLineWidth(0.6);
      fallbackPdf.rect(13, 13, 184, 271);

      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.setFontSize(14);
      fallbackPdf.text('LAPORAN RASMI KELULUSAN PERMOHONAN', 20, 25);
      fallbackPdf.setFontSize(9);
      fallbackPdf.setFont('helvetica', 'normal');
      fallbackPdf.text('Hab Pembangunan Usahawan Belia Kelantan (KBelia)', 20, 31);
      fallbackPdf.text(`Nombor Rujukan: ${params.reportRef}    Tarikh: ${params.reportDate}`, 20, 36);
      fallbackPdf.line(20, 40, 190, 40);

      fallbackPdf.setFont('helvetica', 'bold');
      fallbackPdf.text(`Jumlah Kiosk Diluluskan: ${params.bookings.filter((b) => b.status === 'approved').length} Unit`, 20, 48);
      fallbackPdf.text(`Jumlah Geran Diluluskan: ${params.grantApplications.filter((g) => g.status === 'approved').length} Penerima`, 20, 55);

      fallbackPdf.save(fileName);
      return true;
    } catch {
      return false;
    }
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

/**
 * Generic PDF generator that takes any complete official letterhead HTML string
 * (from printUtils.ts), auto-detects Portrait vs Landscape (A4 Certificates), renders at crisp 3x DPI
 * with preserved Royal Double Borders, and falls back to pure-jsPDF bordered export on failure.
 */
export const downloadHtmlAsPdf = async (
  htmlContent: string,
  fileName: string
): Promise<boolean> => {
  const safeName = fileName.replace(/\.pdf$/i, '') + '.pdf';

  const isLandscape =
    /data-orientation=["']landscape["']/i.test(htmlContent) ||
    /@page\s*\{[^}]*size\s*:\s*A4\s+landscape/i.test(htmlContent);

  const captureWidth = isLandscape ? 1120 : 820;
  const pageMaxWidth = isLandscape ? 1092 : 792;
  const minCaptureHeight = isLandscape ? 780 : 1060;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${captureWidth}px`;
  container.style.padding = '12px';
  container.style.boxSizing = 'border-box';
  container.style.background = '#ffffff';
  container.style.zIndex = '-99999';

  let extractedTitle = safeName.replace(/\.pdf$/i, '').replace(/_/g, ' ');
  let extractedTextLines: string[] = [];

  try {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(htmlContent, 'text/html');
    const titleTag = parsed.querySelector('title')?.textContent?.trim();
    if (titleTag) extractedTitle = titleTag;

    parsed.querySelectorAll('.screen-toolbar, .no-print, script').forEach((el) => el.remove());

    const styles = Array.from(parsed.querySelectorAll('style'))
      .map((s) => s.textContent || '')
      .join('\n');

    const pageNode = parsed.querySelector('.document-page');
    const bodyHtml = pageNode ? pageNode.outerHTML : parsed.body.innerHTML;
    extractedTextLines = (parsed.body.textContent || '')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 32);

    container.innerHTML = `<style>${styles}\n.document-page{box-shadow:none !important;max-width:${pageMaxWidth}px !important;margin:0 auto !important;}</style>${bodyHtml}`;
    document.body.appendChild(container);

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready.catch(() => undefined);
    }

    const captureHeight = Math.max(minCaptureHeight, container.scrollHeight);
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight
    });

    const imgWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    pdf.setProperties({
      title: extractedTitle,
      subject: 'Dokumen Rasmi Portal KBelia Kelantan',
      author: 'Urusetia Portal KBelia'
    });

    if (imgHeight <= pageHeight + 3) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(pageHeight, imgHeight), undefined, 'FAST');
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
    }

    pdf.save(safeName);
    return true;
  } catch (err) {
    console.error('downloadHtmlAsPdf canvas failed, attempting bordered jsPDF fallback:', err);
    try {
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      const w = isLandscape ? 297 : 210;
      const h = isLandscape ? 210 : 297;
      pdf.setProperties({
        title: extractedTitle,
        subject: 'Dokumen Rasmi Portal KBelia Kelantan',
        author: 'Urusetia Portal KBelia'
      });
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(1.2);
      pdf.rect(10, 10, w - 20, h - 20);
      pdf.setDrawColor(180, 83, 9);
      pdf.setLineWidth(0.5);
      pdf.rect(13, 13, w - 26, h - 26);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text('PORTAL PEMBANGUNAN USAHAWAN BELIA KELANTAN (KBelia)', 20, 26);
      pdf.setFontSize(11);
      pdf.text(extractedTitle, 20, 34);
      pdf.line(20, 38, w - 20, 38);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      let y = 46;
      const maxTextWidth = w - 40;
      for (const line of extractedTextLines) {
        const wrapped = pdf.splitTextToSize(line, maxTextWidth) as string[];
        for (const wl of wrapped) {
          if (y > h - 22) break;
          pdf.text(wl, 20, y);
          y += 5.2;
        }
        if (y > h - 22) break;
      }

      pdf.save(safeName);
      return true;
    } catch {
      return false;
    }
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
