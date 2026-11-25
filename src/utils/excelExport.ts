import * as XLSX from 'xlsx';
import { KioskDailySale, ProductItem } from '../types';

const formatSheetDate = (iso?: string): string => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const todaySlug = () => new Date().toISOString().slice(0, 10);

export const exportProductsToExcel = (
  products: ProductItem[],
  businessName?: string
): void => {
  const rows = products.map((p, index) => ({
    Bil: index + 1,
    'Nama Produk': p.name || '-',
    Kategori: p.category || 'Umum',
    'Harga (RM)': Number((Number(p.price) || 0).toFixed(2)),
    'Status Stok': p.inStock !== false ? 'Stok Tersedia' : 'Habis Stok',
    Penerangan: p.description?.trim() || '-',
    'Tarikh Kemaskini': formatSheetDate(p.updatedAt || p.createdAt)
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 42 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  const sheetTitle = businessName
    ? `Produk ${businessName}`.slice(0, 28)
    : 'Katalog Produk';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);
  XLSX.writeFile(workbook, `katalog-produk-kbelia-${todaySlug()}.xlsx`);
};

export const exportSalesToExcel = (
  records: KioskDailySale[],
  kioskName?: string
): void => {
  const rows = records.map((r, index) => {
    const cash = Number(r.cashSales) || 0;
    const qr = Number(r.qrSales) || 0;
    const expenses = Number(r.expenses) || 0;
    const gross = cash + qr;
    const net = gross - expenses;

    return {
      Bil: index + 1,
      Tarikh: r.date || '-',
      'Kiosk / Perniagaan': r.businessName || kioskName || 'Kiosk KBelia',
      'Jualan Tunai (RM)': Number(cash.toFixed(2)),
      'Jualan DuitNow QR (RM)': Number(qr.toFixed(2)),
      'Jumlah Jualan Kasar (RM)': Number(gross.toFixed(2)),
      'Kos & Belanja (RM)': Number(expenses.toFixed(2)),
      'Untung Bersih (RM)': Number(net.toFixed(2)),
      Catatan: r.notes?.trim() || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 34 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekod Jualan');
  XLSX.writeFile(workbook, `rekod-jualan-kbelia-${todaySlug()}.xlsx`);
};

export const exportMentorReportToExcel = (params: {
  mentorName: string;
  mentorAgency: string;
  totalMentees: number;
  completedSessions: number;
  totalLogs: number;
  totalEndorsements: number;
  districtRows: { district: string; mentees: number; sessions: number; endorsements: number }[];
  sectorRows: { sector: string; count: number }[];
}): void => {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Perkara: 'Nama Mentor', Nilai: params.mentorName },
    { Perkara: 'Agensi / Institusi', Nilai: params.mentorAgency },
    { Perkara: 'Tarikh Laporan', Nilai: formatSheetDate(new Date().toISOString()) },
    { Perkara: 'Jumlah Belia Diselia', Nilai: params.totalMentees },
    { Perkara: 'Sesi Bimbingan Selesai', Nilai: params.completedSessions },
    { Perkara: 'Rekod Nota Sesi', Nilai: params.totalLogs },
    { Perkara: 'Surat Sokongan Geran Aktif', Nilai: params.totalEndorsements }
  ]);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  const districtSheet = XLSX.utils.json_to_sheet(
    params.districtRows.map((row, idx) => ({
      Bil: idx + 1,
      Daerah: row.district,
      'Bilangan Belia': row.mentees,
      'Sesi Selesai': row.sessions,
      'Surat Sokongan': row.endorsements
    }))
  );
  districtSheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, districtSheet, 'Pecahan Daerah');

  const sectorSheet = XLSX.utils.json_to_sheet(
    params.sectorRows.map((row, idx) => ({
      Bil: idx + 1,
      'Sektor Perniagaan': row.sector,
      'Bilangan Belia': row.count
    }))
  );
  sectorSheet['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, sectorSheet, 'Pecahan Sektor');

  const safeSlug = params.mentorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'mentor';
  XLSX.writeFile(workbook, `laporan-mentor-${safeSlug}-${todaySlug()}.xlsx`);
};

