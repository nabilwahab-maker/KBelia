import React, { useState, useEffect } from 'react';
import {
  Coins,
  X,
  QrCode,
  Trash2,
  Edit3,
  Printer,
  CheckCircle2,
  Store
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { KioskDailySale } from '../types';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { isProductionAuthenticated, saveCashflowRecord, deleteCashflowRecord } from '../services/dataService';
import { mergeUniqueById, subscribeCrossTabSync, subscribeDemoSyncCollection } from '../services/realtimeSync';
import { EditCashflowModal } from './EditCashflowModal';
import { showToast } from './ToastNotification';

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
  const { confirmDelete } = useConfirmDelete();
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
  const [editingRecord, setEditingRecord] = useState<KioskDailySale | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prodAuth = isProductionAuthenticated();
    let prodItems: KioskDailySale[] = [];
    let demoSyncItems: KioskDailySale[] = [];
    let demoDeletedIds: string[] = [];

    const recompute = () => {
      if (prodAuth) {
        setSalesRecords(prodItems);
        return;
      }
      try {
        const saved = localStorage.getItem(storageKey);
        let localItems: KioskDailySale[] = [];
        if (saved) {
          localItems = JSON.parse(saved);
        } else if (isDemoSession) {
          localStorage.setItem(storageKey, JSON.stringify(DEMO_DEFAULT_SALES));
          localItems = DEMO_DEFAULT_SALES;
        }
        const scopedDemoSync = demoSyncItems.filter(r => !r.ownerId || r.ownerId === ownerId);
        setSalesRecords(mergeUniqueById<KioskDailySale>([scopedDemoSync, localItems], demoDeletedIds));
      } catch {
        setSalesRecords([]);
      }
    };

    recompute();

    const handleSync = () => recompute();
    window.addEventListener('kbelia_cashflow_updated', handleSync);
    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'cashflow') recompute();
    });

    let unsubProd = () => {};
    let unsubDemoSync = () => {};
    if (prodAuth && auth.currentUser) {
      unsubProd = onSnapshot(
        query(collection(db, 'cashflow_records'), where('ownerId', '==', auth.currentUser.uid)),
        (snap) => {
          prodItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as KioskDailySale));
          recompute();
        },
        (err) => console.debug('Cashflow modal listener notice:', err?.message || err)
      );
    } else {
      unsubDemoSync = subscribeDemoSyncCollection<KioskDailySale>('cashflow', (items, delIds) => {
        demoSyncItems = items;
        demoDeletedIds = delIds;
        recompute();
      });
    }

    return () => {
      window.removeEventListener('kbelia_cashflow_updated', handleSync);
      unsubCrossTab();
      unsubProd();
      unsubDemoSync();
    };
  }, [isOpen, ownerId, isDemoSession, storageKey]);

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
        className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        role="dialog"
        aria-modal="true"
      >

        {/* Header */}
        <div className="kbelia-important-header text-black dark:text-white px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-300 dark:border-slate-600 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/70">
              <Coins className="w-6 h-6 text-black dark:text-white" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-black dark:text-white/75">
                Sistem Pengurusan Kewangan Kiosk
              </div>
              <h3 className="font-black text-base sm:text-lg text-black dark:text-white">
                Buku Tunai & Jualan Kiosk Pintar
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-7 pt-4 border-b border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-emerald-600 text-black dark:border-amber-400 dark:text-white/75'
                : 'border-transparent text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Rekod Jualan Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-blue-600 text-black dark:border-amber-400 dark:text-white/75'
                : 'border-transparent text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Paparan QR DuitNow Kiosk</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {activeTab === 'sales' ? (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Financial KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                  <span className="text-[11px] font-semibold text-black/70 dark:text-white/75">Jumlah Kasar</span>
                  <div className="text-lg sm:text-xl font-black text-black dark:text-white tabular-nums mt-0.5">
                    RM {totalRevenue.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-black dark:text-white/75">DuitNow QR</span>
                  <div className="text-lg sm:text-xl font-black text-black dark:text-white tabular-nums mt-0.5">
                    RM {totalQr.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-semibold text-black dark:text-white/75">Perbelanjaan</span>
                  <div className="text-lg sm:text-xl font-black text-black dark:text-white tabular-nums mt-0.5">
                    RM {totalExpenses.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <span className="text-[11px] font-semibold text-white">Untung Bersih</span>
                  <div className="text-lg sm:text-xl font-black tabular-nums mt-0.5">
                    RM {netProfit.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Form Tambah Rekod */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-600 print:hidden">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-black dark:text-white/75" />
                    Tambah Rekod Jualan Hari Ini
                  </span>
                  <span className="text-[11px] font-normal text-black/70 dark:text-white/75">{kioskName}</span>
                </h4>

                {validationError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-black dark:text-white text-xs font-semibold border border-rose-200 dark:border-rose-800">
                    {validationError}
                  </div>
                )}

                {showSuccess && (
                  <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-black dark:text-white text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                    Rekod jualan berjaya disimpan!
                  </div>
                )}

                <form onSubmit={handleAddRecord} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-black dark:text-white mb-1">Tarikh</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-black dark:text-white mb-1">Jualan Tunai (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={cash}
                        onChange={(e) => setCash(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-black dark:text-white mb-1">DuitNow QR (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={qr}
                        onChange={(e) => setQr(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-black dark:text-white mb-1">Belanja / Kos (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Catatan jualan (cth: Habis 60 cawan kopi waktu pagi)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors cursor-pointer shrink-0 dark:bg-emerald-600"
                    >
                      {saving ? 'Menyimpan...' : '+ Simpan Jualan'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Senarai Lejar Jualan */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-black dark:text-white">
                    Sejarah Transaksi Jualan ({salesRecords.length} Hari Direkod)
                  </h4>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-[11px] text-black dark:text-white/75 font-bold hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Rekod
                  </button>
                </div>

                {salesRecords.length === 0 ? (
                  <div className="text-center py-8 text-xs text-black/70 dark:text-white/75 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">
                    Tiada rekod jualan lagi. Rekodkan transaksi pertama anda di atas.
                  </div>
                ) : (
                  <div className="border border-slate-300 dark:border-slate-600 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-black/70 dark:text-white/75 border-b border-slate-300 dark:border-slate-600 text-[11px]">
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
                      <tbody className="divide-y divide-slate-300 dark:divide-slate-600 text-black dark:text-white">
                        {salesRecords.map((r) => {
                          const dailyNet = (r.cashSales + r.qrSales) - r.expenses;
                          return (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-semibold text-black dark:text-white whitespace-nowrap tabular-nums">{r.date}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono">RM {r.cashSales.toFixed(2)}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono text-black dark:text-white/75 font-bold">RM {r.qrSales.toFixed(2)}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono text-black dark:text-white/75">RM {r.expenses.toFixed(2)}</td>
                              <td className="py-2.5 px-3 tabular-nums font-mono font-bold text-black dark:text-white">RM {dailyNet.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-[11px] text-black/70 dark:text-white/75 max-w-[160px] truncate">{r.notes}</td>
                              <td className="py-2.5 px-3 text-right print:hidden">
                                <div className="inline-flex items-center justify-end gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingRecord(r)}
                                    className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                                    title="Edit rekod"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      confirmDelete({
                                        itemName: `${r.date} — RM ${(r.cashSales + r.qrSales).toFixed(2)}`,
                                        itemType: 'Rekod Jualan Harian',
                                        onConfirm: () => handleDelete(r.id)
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                                    title="Padam rekod"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Padam</span>
                                  </button>
                                </div>
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
              <div className="max-w-sm mx-auto bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-xl text-black space-y-4">
                <div className="bg-rose-700 text-white p-3 rounded-2xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2">
                  <span>DuitNow QR</span>
                </div>

                <div className="w-48 h-48 mx-auto bg-white border-2 border-slate-900 p-3 rounded-2xl flex items-center justify-center relative">
                  <QrCode className="w-40 h-40 text-black" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-400 shadow-xs">
                      <Store className="w-6 h-6 text-black" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-extrabold text-sm text-black uppercase">{businessName}</div>
                  <div className="text-xs font-mono text-black font-semibold">{kioskName}</div>
                  <div className="text-[10px] text-black/70 mt-1">Imbas menggunakan mana-mana aplikasi perbankan atau e-dompet (Touch &apos;n Go, GrabPay, MAE, CIMB).</div> </div> </div> <div className="flex items-center justify-center gap-3 print:hidden"> <button type="button" onClick={handlePrint} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer dark:bg-blue-600" > <Printer className="w-4 h-4" /> <span>Cetak Stand QR Kiosk</span> </button> </div> </div> )} </div> {/* Footer */} <div className="p-4 sm:px-7 border-t border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0 print:hidden"> <div className="text-[11px] text-black/70 dark:text-white/75"> {isDemoSession ? 'Mod Demo: Rekod diasingkan daripada pangkalan data pengeluaran.'
              : 'Rekod disegerakkan dengan akaun usahawan anda.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-black dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      <EditCashflowModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        ownerId={ownerId}
        businessName={businessName}
        onClose={() => setEditingRecord(null)}
        onSaved={(updated) => {
          setSalesRecords(prev => prev.map(item => (item.id === updated.id ? updated : item)));
          setEditingRecord(null);
          showToast({
            type: 'success',
            title: 'Rekod Dikemas Kini',
            message: `Rekod jualan bertarikh ${updated.date} berjaya disimpan.`
          });
        }}
      />
    </div>
  );
};
