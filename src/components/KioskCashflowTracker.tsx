import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Save, 
  TrendingUp, 
  QrCode, 
  Coins, 
  Trash2, 
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { KioskDailySale } from '../types';

interface KioskCashflowTrackerProps {
  kioskName?: string;
}

const INITIAL_SALES: KioskDailySale[] = [
  { id: '1', date: '2026-03-24', cashSales: 180, qrSales: 220, expenses: 90, notes: 'Restok cawan & serbuk kopi', createdAt: '2026-03-24T20:00:00Z' },
  { id: '2', date: '2026-03-25', cashSales: 150, qrSales: 280, expenses: 40, notes: 'Jualan waktu petang rancak', createdAt: '2026-03-25T20:00:00Z' },
  { id: '3', date: '2026-03-26', cashSales: 210, qrSales: 310, expenses: 110, notes: 'Beli bahan mentah segar', createdAt: '2026-03-26T20:00:00Z' }
];

export const KioskCashflowTracker: React.FC<KioskCashflowTrackerProps> = ({
  kioskName = 'Kiosk Kapsul #CAP-KB-01'
}) => {
  const [salesRecords, setSalesRecords] = useState<KioskDailySale[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_cashflow_records');
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cash, setCash] = useState('');
  const [qr, setQr] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('kbelia_cashflow_records', JSON.stringify(salesRecords));
    } catch (e) {
      console.warn(e);
    }
  }, [salesRecords]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const cashVal = parseFloat(cash) || 0;
    const qrVal = parseFloat(qr) || 0;
    const expVal = parseFloat(expenses) || 0;

    if (cashVal === 0 && qrVal === 0) {
      setValidationError('Sila masukkan sekurang-kurangnya jumlah jualan tunai atau DuitNow QR.');
      return;
    }

    const newRecord: KioskDailySale = {
      id: Date.now().toString(),
      date,
      cashSales: cashVal,
      qrSales: qrVal,
      expenses: expVal,
      notes,
      createdAt: new Date().toISOString()
    };

    setSalesRecords([newRecord, ...salesRecords]);
    setCash('');
    setQr('');
    setExpenses('');
    setNotes('');
  };

  const handleDeleteRecord = (id: string) => {
    setSalesRecords(salesRecords.filter(r => r.id !== id));
  };

  // Calculations
  const totalRevenue = salesRecords.reduce((acc, r) => acc + r.cashSales + r.qrSales, 0);
  const totalExpenses = salesRecords.reduce((acc, r) => acc + r.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const qrPercentage = totalRevenue > 0 
    ? Math.round((salesRecords.reduce((acc, r) => acc + r.qrSales, 0) / totalRevenue) * 100) 
    : 0;

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              Buku Tunai & Jualan Harian Kiosk
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {kioskName}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Rekod Aliran Tunai & Untung Bersih
          </h2>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Jumlah Jualan Kasar
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            RM {totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Kos & Belanja Stok
          </span>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            RM {totalExpenses.toLocaleString()}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
            Untung Bersih Terkumpul
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            RM {netProfit.toLocaleString()}
          </span>
        </div>

        <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
            Nisbah Bayaran DuitNow QR
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
              {qrPercentage}%
            </span>
            <span className="text-xs text-slate-400">Cashless</span>
          </div>
        </div>
      </div>

      {/* Record Input Form */}
      <form onSubmit={handleAddRecord} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 mb-6">
        {validationError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {validationError}
          </div>
        )}
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-3">
          + Catat Jualan & Belanja Hari Ini:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Tarikh:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Jualan Tunai (RM):</label>
            <input
              type="number"
              placeholder="0.00"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Jualan DuitNow QR (RM):</label>
            <input
              type="number"
              placeholder="0.00"
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Belanja Stok/Kos (RM):</label>
            <input
              type="number"
              placeholder="0.00"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Rekod
            </button>
          </div>
        </div>
      </form>

      {/* Sales Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {salesRecords.map((r) => {
              const dailyNet = (r.cashSales + r.qrSales) - r.expenses;
              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white tabular-nums">
                    {r.date}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">RM {r.cashSales.toFixed(2)}</td>
                  <td className="py-2.5 px-3 tabular-nums text-blue-600 dark:text-blue-400">RM {r.qrSales.toFixed(2)}</td>
                  <td className="py-2.5 px-3 tabular-nums text-rose-600 dark:text-rose-400">RM {r.expenses.toFixed(2)}</td>
                  <td className="py-2.5 px-3 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    RM {dailyNet.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 line-clamp-1">
                    {r.notes || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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
    </div>
  );
};
