import React, { useState, useEffect } from 'react';
import {
  Save,
  Coins,
  Trash2
} from 'lucide-react';
import { KioskDailySale } from '../types';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { saveCashflowRecord, deleteCashflowRecord } from '../services/dataService';
import { showToast } from './ToastNotification';

interface KioskCashflowTrackerProps {
  kioskName?: string;
  records?: KioskDailySale[];
}

const DEMO_SAMPLE_SALES: KioskDailySale[] = [
  { id: 'demo-cf-1', date: '2026-03-24', cashSales: 180, qrSales: 220, expenses: 90, notes: 'Restok cawan & serbuk kopi', createdAt: '2026-03-24T20:00:00Z' },
  { id: 'demo-cf-2', date: '2026-03-25', cashSales: 150, qrSales: 280, expenses: 40, notes: 'Jualan waktu petang rancak', createdAt: '2026-03-25T20:00:00Z' },
  { id: 'demo-cf-3', date: '2026-03-26', cashSales: 210, qrSales: 310, expenses: 110, notes: 'Beli bahan mentah segar', createdAt: '2026-03-26T20:00:00Z' }
];

export const KioskCashflowTracker: React.FC<KioskCashflowTrackerProps> = ({
  kioskName = 'Kiosk Kapsul KBelia',
  records: externalRecords
}) => {
  const { user, isDemoSession } = useAuth();
  const { confirmDelete } = useConfirmDelete();
  const ownerId = user?.uid || 'guest';
  const storageKey = `kbelia_cashflow_records_${ownerId}`;

  const [salesRecords, setSalesRecords] = useState<KioskDailySale[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cash, setCash] = useState('');
  const [qr, setQr] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadLocalRecords = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSalesRecords(JSON.parse(saved));
      } else if (isDemoSession) {
        localStorage.setItem(storageKey, JSON.stringify(DEMO_SAMPLE_SALES));
        setSalesRecords(DEMO_SAMPLE_SALES);
      } else {
        setSalesRecords([]);
      }
    } catch {
      setSalesRecords([]);
    }
  };

  useEffect(() => {
    if (externalRecords && !isDemoSession) {
      setSalesRecords(externalRecords);
      return;
    }
    loadLocalRecords();

    const handleSync = () => {
      if (!externalRecords || isDemoSession) {
        loadLocalRecords();
      }
    };
    window.addEventListener('kbelia_cashflow_updated', handleSync);
    return () => window.removeEventListener('kbelia_cashflow_updated', handleSync);
  }, [ownerId, isDemoSession, externalRecords]);

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
      businessName: kioskName,
      date,
      cashSales: cashVal,
      qrSales: qrVal,
      expenses: expVal,
      notes: notes.trim() || 'Rekod jualan harian',
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
      showToast({
        type: 'success',
        title: 'Rekod Jualan Disimpan',
        message: `Transaksi bertarikh ${date} berjaya direkodkan.`
      });
    } catch (err: any) {
      setValidationError(err?.message || 'Gagal menyimpan rekod aliran tunai.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteCashflowRecord(id, ownerId);
      setSalesRecords(prev => prev.filter(r => r.id !== id));
      showToast({
        type: 'info',
        title: 'Rekod Dipadam',
        message: 'Entri aliran tunai telah dikeluarkan daripada lejar anda.'
      });
    } catch (err: any) {
      setValidationError(err?.message || 'Gagal memadam rekod.');
    }
  };

  const totalRevenue = salesRecords.reduce((acc, r) => acc + r.cashSales + r.qrSales, 0);
  const totalExpenses = salesRecords.reduce((acc, r) => acc + r.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const qrPercentage = totalRevenue > 0
    ? Math.round((salesRecords.reduce((acc, r) => acc + r.qrSales, 0) / totalRevenue) * 100)
    : 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-black dark:text-white/75">
              <Coins className="w-3.5 h-3.5 text-black dark:text-white/75" />
              Buku Tunai & Jualan Harian Kiosk
            </span>
            <span className="text-black/35 dark:text-white/35">·</span>
            <span className="text-xs text-black/70 dark:text-white/75 font-medium">
              {kioskName}
            </span>
          </div>
          <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Rekod Aliran Tunai & Untung Bersih
          </h2>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-black/70 dark:text-white/75 block mb-0.5">
            Jumlah Jualan Kasar
          </span>
          <span className="text-xl sm:text-2xl font-bold text-black dark:text-white tabular-nums tracking-tight">
            RM {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-black/70 dark:text-white/75 block mb-0.5">
            Kos & Belanja Stok
          </span>
          <span className="text-xl sm:text-2xl font-bold text-black dark:text-white/75 tabular-nums tracking-tight">
            RM {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="rounded-xl p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <span className="text-[11px] font-bold text-black dark:text-white block mb-0.5">
            Untung Bersih Terkumpul
          </span>
          <span className="text-xl sm:text-2xl font-bold text-black dark:text-white/75 tabular-nums tracking-tight">
            RM {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-black/70 dark:text-white/75 block mb-0.5">
            Nisbah Bayaran DuitNow QR
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-black dark:text-white/75 tabular-nums tracking-tight">
              {qrPercentage}%
            </span>
            <span className="text-xs text-black/70 dark:text-white/75">Cashless</span>
          </div>
        </div>
      </div>

      {/* Record Input Form */}
      <form onSubmit={handleAddRecord} className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-6 space-y-3">
        {validationError && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-black dark:text-white text-xs font-semibold border border-rose-200 dark:border-rose-800">
            {validationError}
          </div>
        )}
        <span className="text-xs font-bold text-black dark:text-white block">
          + Catat Jualan & Belanja Harian
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-black/70 dark:text-white/75 block mb-1">Tarikh:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-black/70 dark:text-white/75 block mb-1">Jualan Tunai (RM):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-black/70 dark:text-white/75 block mb-1">Jualan DuitNow QR (RM):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-black/70 dark:text-white/75 block mb-1">Belanja Stok/Kos (RM):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Catatan ringkas (cth: Belian stok bahan mentah atau jualan karnival)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 dark:bg-blue-600"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Rekod'}
          </button>
        </div>
      </form>

      {/* Sales Log Table */}
      {salesRecords.length === 0 ? (
        <div className="text-center py-10 text-xs text-black/70 dark:text-white/75 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          Tiada rekod jualan lagi. Gunakan borang di atas untuk merekodkan jualan harian anda.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-black/70 dark:text-white/75 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Tarikh</th>
                <th className="py-2.5 px-3">Tunai</th>
                <th className="py-2.5 px-3">DuitNow QR</th>
                <th className="py-2.5 px-3">Kos Belanja</th>
                <th className="py-2.5 px-3">Untung Bersih</th>
                <th className="py-2.5 px-3">Catatan</th>
                <th className="py-2.5 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700 text-black dark:text-white">
              {salesRecords.map((r) => {
                const dailyNet = (r.cashSales + r.qrSales) - r.expenses;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-semibold text-black dark:text-white tabular-nums whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">RM {r.cashSales.toFixed(2)}</td>
                    <td className="py-2.5 px-3 tabular-nums text-black dark:text-white/75 font-semibold">RM {r.qrSales.toFixed(2)}</td>
                    <td className="py-2.5 px-3 tabular-nums text-black dark:text-white/75">RM {r.expenses.toFixed(2)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-bold text-black dark:text-white/75">
                      RM {dailyNet.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-black/70 dark:text-white/75 max-w-[200px] truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemName: `${r.date} — RM ${(r.cashSales + r.qrSales).toFixed(2)}`,
                            itemType: 'Rekod Aliran Tunai',
                            onConfirm: () => handleDeleteRecord(r.id)
                          })
                        }
                        className="p-1 text-black/70 dark:text-white/75 hover:text-black transition-colors cursor-pointer dark:hover:text-white"
                        title="Padam Rekod"
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
  );
};
