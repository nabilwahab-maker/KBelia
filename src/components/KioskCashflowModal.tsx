import React, { useState, useEffect } from 'react';
import {
  Coins,
  X,
  QrCode,
  Trash2,
  Printer,
  CheckCircle2,
  Store
} from 'lucide-react';
import { KioskDailySale } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveCashflowRecord, deleteCashflowRecord } from '../services/dataService';

interface KioskCashflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  kioskName?: string;
  businessName?: string;
}

const DEMO_DEFAULT_SALES: KioskDailySale[] = [
  { id: 'demo-cf-1', date: '2026-03-24', cashSales: 180, qrSales: 220, expenses: 90, notes: 'Restok cawan biodegradasi & serbuk kopi', createdAt: '2026-03-24T20:00:00Z' },
  { id: 'demo-cf-2', date: '2026-03-25', cashSales: 150, qrSales: 280, expenses: 40, notes: 'Jualan waktu petang rancak', createdAt: '2026-03-25T20:00:00Z' },
  { id: 'demo-cf-3', date: '2026-03-26', cashSales: 210, qrSales: 310, expenses: 110, notes: 'Beli bahan mentah segar & ais', createdAt: '2026-03-26T20:00:00Z' }
];

export const KioskCashflowModal: React.FC<KioskCashflowModalProps> = ({
  isOpen,
  onClose,
  kioskName = 'Kiosk Modular KBelia',
  businessName = 'Perniagaan Anda'
}) => {
  const { user, isDemoSession } = useAuth();
  const ownerId = user?.uid || 'guest';
  const storageKey = `kbelia_cashflow_records_${ownerId}`;

  const [activeTab, setActiveTab] = useState<'sales' | 'qr'>('sales');
  const [salesRecords, setSalesRecords] = useState<KioskDailySale[]>([]);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cash, setCash] = useState('');
  const [qr, setQr] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadLocalRecords = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSalesRecords(JSON.parse(saved));
      } else if (isDemoSession) {
        localStorage.setItem(storageKey, JSON.stringify(DEMO_DEFAULT_SALES));
        setSalesRecords(DEMO_DEFAULT_SALES);
      } else {
        setSalesRecords([]);
      }
    } catch {
      setSalesRecords([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadLocalRecords();

    const handleSync = () => loadLocalRecords();
    window.addEventListener('kbelia_cashflow_updated', handleSync);
    return () => window.removeEventListener('kbelia_cashflow_updated', handleSync);
  }, [isOpen, ownerId, isDemoSession]);

  if (!isOpen) return null;

  const totalCash = salesRecords.reduce((acc, r) => acc + r.cashSales, 0);
  const totalQr = salesRecords.reduce((acc, r) => acc + r.qrSales, 0);
  const totalRevenue = totalCash + totalQr;
  const totalExpenses = salesRecords.reduce((acc, r) => acc + r.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const cashVal = parseFloat(cash) || 0;
    const qrVal = parseFloat(qr) || 0;
    const expVal = parseFloat(expenses) || 0;

    if (cashVal < 0 || qrVal < 0 || expVal < 0) {
      setValidationError('Nilai jualan dan perbelanjaan tidak boleh negatif.');
      return;
    }

    if (cashVal === 0 && qrVal === 0 && expVal === 0) {
      setValidationError('Sila masukkan sekurang-kurangnya jumlah jualan tunai, DuitNow QR atau perbelanjaan.');
      return;
    }

    const newRecord: KioskDailySale & { ownerId: string } = {
      id: `cf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ownerId,
      businessName,
      date,
      cashSales: cashVal,
      qrSales: qrVal,
      expenses: expVal,
      notes: notes.trim() || 'Jualan harian',
      createdAt: new Date().toISOString()
    };

    try {
      setSaving(true);
      await saveCashflowRecord(newRecord);
      setSalesRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);
      setCash('');
      setQr('');
      setExpenses('');
      setNotes('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setValidationError(err?.message || 'Gagal menyimpan rekod jualan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCashflowRecord(id, ownerId);
      setSalesRecords(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setValidationError(err?.message || 'Gagal memadam rekod.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        role="dialog"
        aria-modal="true"
      >

        {/* Header */}
        <div className="kbelia-important-header text-slate-800 dark:text-white px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center border border-sky-200 dark:border-sky-800/60">
              <Coins className="w-6 h-6 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-sky-700 dark:text-sky-400">
                Sistem Pengurusan Kewangan Kiosk
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-800 dark:text-white">
                Buku Tunai & Jualan Kiosk Pintar
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-7 pt-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>1. Rekod & Lejar Jualan Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. Paparan QR DuitNow Kiosk</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {activeTab === 'sales' ? (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Financial KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jumlah Kasar</span>
                  <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tabular-nums mt-0.5">
                    RM {totalRevenue.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">DuitNow QR</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                    RM {totalQr.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Perbelanjaan</span>
                  <div className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 tabular-nums mt-0.5">
                    RM {totalExpenses.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <span className="text-[11px] font-semibold text-emerald-100">Untung Bersih</span>
                  <div className="text-lg sm:text-xl font-black tabular-nums mt-0.5">
                    RM {netProfit.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Form Tambah Rekod */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 print:hidden">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Tambah Rekod Jualan Hari Ini
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">{kioskName}</span>
                </h4>

                {validationError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800">
                    {validationError}
                  </div>
                )}

                {showSuccess && (
                  <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Rekod jualan berjaya disimpan ke lejar kiosk!
                  </div>
                )}

                <form onSubmit={handleAddRecord} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tarikh</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Jualan Tunai (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={cash}
                        onChange={(e) => setCash(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">DuitNow QR (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={qr}
                        onChange={(e) => setQr(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Belanja / Kos (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Catatan jualan (cth: Habis 60 cawan kopi waktu pagi)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 shadow-sm transition-colors cursor-pointer shrink-0"
                    >
                      {saving ? 'Menyimpan...' : '+ Simpan Jualan'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Senarai Lejar Jualan */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    Sejarah Transaksi Jualan ({salesRecords.length} Hari Direkodkan)
                  </h4>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-[11px] text-sky-700 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Lejar
                  </button>
                </div>

                {salesRecords.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    Tiada rekod jualan lagi. Rekodkan transaksi pertama anda di atas.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Tarikh</th>
                          <th className="py-2.5 px-3">Tunai</th>
                          <th className="py-2.5 px-3">QR DuitNow</th>
                          <th className="py-2.5 px-3">Belanja</th>
                          <th className="py-2.5 px-3">Untung Bersih</th>
                          <th className="py-2.5 px-3">Catatan</th>
                          <th className="py-2.5 px-3 text-right print:hidden">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {salesRecords.map((r) => {
                          const dailyNet = (r.cashSales + r.qrSales) - r.expenses;
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">{r.date}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono">RM {r.cashSales.toFixed(2)}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono text-emerald-600 dark:text-emerald-400 font-bold">RM {r.qrSales.toFixed(2)}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono text-rose-600 dark:text-rose-400">RM {r.expenses.toFixed(2)}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono font-bold text-slate-900 dark:text-white">RM {dailyNet.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 max-w-[160px] truncate">{r.notes}</td>
                              <td className="py-2.5 px-3 text-right print:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(r.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Padam rekod"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-200">
              <div className="max-w-sm mx-auto bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-xl text-slate-900 space-y-4">
                <div className="bg-rose-700 text-white p-3 rounded-2xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2">
                  <span>DuitNow QR</span>
                </div>

                <div className="w-48 h-48 mx-auto bg-white border-2 border-slate-900 p-3 rounded-2xl flex items-center justify-center relative">
                  <QrCode className="w-40 h-40 text-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-400 shadow-xs">
                      <Store className="w-6 h-6 text-rose-700" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-extrabold text-sm text-slate-900 uppercase">{businessName}</div>
                  <div className="text-xs font-mono text-slate-600 font-semibold">{kioskName}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Imbas menggunakan mana-mana aplikasi perbankan atau e-dompet (Touch 'n Go, GrabPay, MAE, CIMB).</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Stand QR Kiosk</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:px-7 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between shrink-0 print:hidden">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isDemoSession
              ? 'Mod Demo: Rekod diasingkan daripada pangkalan data pengeluaran.'
              : 'Rekod disegerakkan dengan akaun usahawan anda.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
