import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Coins,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X
} from 'lucide-react';
import { RowActionMenu, getSearchInputWidth } from './ReferenceTableKit';
import { KioskDailySale } from '../types';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import {
  getDeletedIds,
  saveCashflowRecord,
  deleteCashflowRecord,
  getSeededDemoCashflowRecords
} from '../services/dataService';
import { mergeUniqueById, subscribeCrossTabSync, subscribeDemoSyncCollection } from '../services/realtimeSync';
import { showToast } from './ToastNotification';
import { EditCashflowModal } from './EditCashflowModal';
import { PaginationBar, usePagination } from './PaginationBar';
import { exportSalesToExcel } from '../utils/excelExport';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, sortRecords } from '../utils/sortUtils';
import { ModernDatePicker, addDaysIso, toLocalIsoDate } from './ModernDateTimePicker';
import { useAnimatedMetric } from '../hooks/useMotion';

interface KioskCashflowTrackerProps {
  kioskName?: string;
  records?: KioskDailySale[];
}

type SaleSortKey = 'date' | 'cashSales' | 'qrSales' | 'expenses' | 'net';
type SaleCategoryFilter = 'all' | 'cash' | 'qr' | 'profit';

const formatSaleDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatMonthLabel = (ym: string): string => {
  if (ym === 'Semua') return 'Semua Bulan';
  const parsed = new Date(`${ym}-01T00:00:00`);
  if (isNaN(parsed.getTime())) return ym;
  return parsed.toLocaleDateString('ms-MY', {
    month: 'long',
    year: 'numeric'
  });
};

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
  const [editingRecord, setEditingRecord] = useState<KioskDailySale | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Reference Table UI states: Search, Filter Popover, Sort, Selection, Row Action Menu
  const [salesSearch, setSalesSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<SaleCategoryFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [sortConfig, setSortConfig] = useState<{ key: SaleSortKey; dir: 'asc' | 'desc' }>({
    key: 'date',
    dir: 'desc'
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let demoSyncItems: KioskDailySale[] = [];
    let demoDeletedIds: string[] = [];

    const loadAndMergeLocal = () => {
      try {
        const localItems = getSeededDemoCashflowRecords(ownerId, isDemoSession);
        const deleted = [...getDeletedIds(), ...demoDeletedIds];
        const scopedExternal = (externalRecords || []).filter(r => !r.ownerId || r.ownerId === ownerId);
        const scopedDemoSync = demoSyncItems.filter(r => !r.ownerId || r.ownerId === ownerId);
        const scopedLocal = localItems.filter(r => !r.ownerId || r.ownerId === ownerId);
        setSalesRecords(mergeUniqueById<KioskDailySale>([scopedExternal, scopedDemoSync, scopedLocal], deleted));
      } catch {
        setSalesRecords([]);
      }
    };

    loadAndMergeLocal();

    const handleSync = () => loadAndMergeLocal();
    window.addEventListener('kbelia_cashflow_updated', handleSync);
    const unsubCrossTab = subscribeCrossTabSync((entity) => {
      if (entity === 'all' || entity === 'cashflow' || entity === 'deleted') {
        loadAndMergeLocal();
      }
    });
    const unsubDemoSync = subscribeDemoSyncCollection<KioskDailySale>('cashflow', (items, delIds) => {
      demoSyncItems = items;
      demoDeletedIds = delIds;
      loadAndMergeLocal();
    });

    return () => {
      window.removeEventListener('kbelia_cashflow_updated', handleSync);
      unsubCrossTab();
      unsubDemoSync();
    };
  }, [ownerId, isDemoSession, externalRecords, storageKey]);

  // Dismiss filter popover on outside click / Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (isFilterOpen && !target?.closest('[data-cf-filter]')) {
        setIsFilterOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

  // Keep selectedIds synced with existing records
  useEffect(() => {
    const validIds = new Set(salesRecords.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [salesRecords]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    salesRecords.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        months.add(r.date.slice(0, 7));
      }
    });
    return ['Semua', ...Array.from(months).sort((a, b) => b.localeCompare(a))];
  }, [salesRecords]);

  const cashflowSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'date_desc', label: 'Tarikh Rekod (Terbaru)' },
          { value: 'date_asc', label: 'Tarikh Rekod (Terlama)' },
          { value: 'net_desc', label: 'Untung Bersih (Tertinggi)' },
          { value: 'total_desc', label: 'Jumlah Jualan (Tertinggi)' }
        ],
        false,
        {
          asc: 'Catatan / Tajuk (A - Z)',
          desc: 'Catatan / Tajuk (Z - A)'
        }
      ),
    []
  );

  const filteredSortedSales = useMemo(() => {
    const q = salesSearch.trim().toLowerCase();
    const filtered = salesRecords.filter((r) => {
      const net = (r.cashSales + r.qrSales) - r.expenses;
      const matchesSearch =
        !q ||
        (r.date || '').toLowerCase().includes(q) ||
        formatSaleDate(r.date).toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q);
      const matchesMonth =
        monthFilter === 'Semua' || (r.date || '').startsWith(monthFilter);
      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'cash' && r.cashSales > 0) ||
        (categoryFilter === 'qr' && r.qrSales > 0) ||
        (categoryFilter === 'profit' && net > 0);
      return matchesSearch && matchesMonth && matchesCategory;
    });

    if (sortBy === 'table_column') {
      const dirMult = sortConfig.dir === 'asc' ? 1 : -1;
      return [...filtered].sort((a, b) => {
        switch (sortConfig.key) {
          case 'cashSales':
            return (a.cashSales - b.cashSales) * dirMult;
          case 'qrSales':
            return (a.qrSales - b.qrSales) * dirMult;
          case 'expenses':
            return (a.expenses - b.expenses) * dirMult;
          case 'net': {
            const netA = (a.cashSales + a.qrSales) - a.expenses;
            const netB = (b.cashSales + b.qrSales) - b.expenses;
            return (netA - netB) * dirMult;
          }
          case 'date':
          default:
            return (a.date || '').localeCompare(b.date || '') * dirMult;
        }
      });
    }

    return sortRecords(filtered, {
      sortBy,
      getName: (r) => r.notes || formatSaleDate(r.date) || r.date || '',
      customCompare: (a, b, mode) => {
        if (mode === 'date_desc') return (b.date || '').localeCompare(a.date || '');
        if (mode === 'date_asc') return (a.date || '').localeCompare(b.date || '');
        if (mode === 'net_desc') {
          const netA = (a.cashSales + a.qrSales) - a.expenses;
          const netB = (b.cashSales + b.qrSales) - b.expenses;
          return netB - netA;
        }
        if (mode === 'total_desc') {
          return (b.cashSales + b.qrSales) - (a.cashSales + a.qrSales);
        }
        return null;
      }
    });
  }, [salesRecords, salesSearch, monthFilter, categoryFilter, sortBy, sortConfig]);

  const salesPagination = usePagination(filteredSortedSales, 7, [
    salesRecords.length,
    salesSearch,
    monthFilter,
    categoryFilter,
    sortBy,
    sortConfig.key,
    sortConfig.dir
  ]);

  const activeFilterCount =
    (monthFilter !== 'Semua' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  const pageIds = salesPagination.paginatedItems.map((r) => r.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllOnPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSort = (key: SaleSortKey) => {
    setSortBy('table_column');
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'date' ? 'desc' : 'asc' }
    );
  };

  const handleExportSales = () => {
    const targetList =
      selectedIds.length > 0
        ? filteredSortedSales.filter((r) => selectedIds.includes(r.id))
        : filteredSortedSales;

    if (targetList.length === 0) {
      showToast({
        type: 'info',
        title: 'Tiada Rekod Untuk Dieksport',
        message: 'Rekod jualan yang dipilih atau ditapis kosong.'
      });
      return;
    }

    exportSalesToExcel(targetList, kioskName);
    showToast({
      type: 'success',
      title: 'Eksport Excel Berjaya',
      message: `${targetList.length} rekod jualan telah dimuat turun sebagai fail .xlsx.`
    });
  };

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
      setShowAddForm(false);
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
      setSelectedIds(prev => prev.filter(item => item !== id));
      showToast({
        type: 'info',
        title: 'Rekod Dipadam',
        message: 'Rekod jualan harian telah dipadam daripada senarai.'
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

  const formattedRevenue = `RM ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedExpenses = `RM ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedNetProfit = `RM ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const animatedRevenue = useAnimatedMetric(formattedRevenue);
  const animatedExpenses = useAnimatedMetric(formattedExpenses);
  const animatedNetProfit = useAnimatedMetric(formattedNetProfit);
  const animatedQrPct = useAnimatedMetric(`${qrPercentage}%`);

  return (
    <div className="animate-dashboard-tab space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight">
          Rekod Aliran Tunai &amp; Untung Bersih
        </h2>
      </div>

      {/* Ringkasan Kewangan Mendatar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-700 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
        <div className="p-3.5 sm:p-4">
          <span className="text-sm sm:text-base font-extrabold text-black dark:text-white block mb-1 tracking-tight">
            Jumlah Jualan Kasar
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white tabular-nums tracking-tight">
            {animatedRevenue}
          </span>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-sm sm:text-base font-extrabold text-black dark:text-white block mb-1 tracking-tight">
            Kos &amp; Belanja Stok
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white/90 tabular-nums tracking-tight">
            {animatedExpenses}
          </span>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-sm sm:text-base font-extrabold text-black dark:text-white block mb-1 tracking-tight">
            Untung Bersih Terkumpul
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums tracking-tight">
            {animatedNetProfit}
          </span>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-sm sm:text-base font-extrabold text-black dark:text-white block mb-1 tracking-tight">
            Bayaran DuitNow QR
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white tabular-nums tracking-tight">
            {animatedQrPct}
          </span>
        </div>
      </div>

      {/* Collapsible Record Input Form */}
      {showAddForm && (
        <div className="animate-dashboard-tab bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xs overflow-hidden transition-colors">
          <div className="kbelia-important-header border-b border-slate-200 dark:border-slate-700 py-3 px-4 flex items-center justify-between">
            <span className="text-sm sm:text-[0.9375rem] font-bold text-black dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Borang Catatan Jualan &amp; Belanja Harian</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              aria-label="Tutup borang catatan jualan"
              className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddRecord} className="p-4 space-y-3.5">
            {validationError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-black dark:text-white text-sm font-semibold border border-rose-200 dark:border-rose-800">
                {validationError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="text-sm font-medium text-black dark:text-white block mb-1.5">Tarikh</label>
                <ModernDatePicker
                  value={date}
                  onChange={setDate}
                  valueFormat="iso"
                  quickDates={[
                    { label: 'Hari Ini', value: toLocalIsoDate(new Date()) },
                    { label: 'Semalam', value: addDaysIso(toLocalIsoDate(new Date()), -1) },
                    { label: '2 Hari Lepas', value: addDaysIso(toLocalIsoDate(new Date()), -2) }
                  ]}
                  placeholder="Pilih tarikh jualan"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white block mb-1.5">Jualan Tunai (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white block mb-1.5">Jualan DuitNow QR (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={qr}
                  onChange={(e) => setQr(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white block mb-1.5">Belanja Kos (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Masukkan catatan jualan harian (cth: Jualan hujung minggu & stok kopi)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="min-h-[38px] px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[38px] px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Rekod'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Reference-Style Sales Log Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        {/* Search & Filter Toolbar */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-700">
          <div
            style={{ ['--search-fit-w' as string]: getSearchInputWidth('Cari tarikh atau catatan...') }}
            className="relative w-full sm:w-[var(--search-fit-w)] sm:max-w-full min-w-0"
          >
            <Search className="w-4 h-4 text-black/45 dark:text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              placeholder="Cari tarikh atau catatan..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
            />
            {salesSearch && (
              <button
                type="button"
                onClick={() => setSalesSearch('')}
                aria-label="Kosongkan carian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedIds.length > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 text-[0.8125rem] font-semibold text-black dark:text-white">
                <span className="tabular-nums">{selectedIds.length} dipilih</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-blue-700 dark:text-blue-300 hover:underline cursor-pointer font-bold"
                >
                  Kosongkan
                </button>
              </div>
            )}

            <div className="relative flex flex-wrap items-center gap-2" data-cf-filter>
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                aria-expanded={isFilterOpen}
                aria-label={activeFilterCount > 0 ? `Penapis (${activeFilterCount} aktif)` : 'Penapis'}
                title={activeFilterCount > 0 ? `Penapis (${activeFilterCount} aktif)` : 'Penapis'}
                className={`min-h-[38px] w-[38px] rounded-xl border inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-black dark:text-white'
                    : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleExportSales}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-black dark:text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>
                  {selectedIds.length > 0
                    ? `Eksport (${selectedIds.length})`
                    : 'Eksport'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{showAddForm ? 'Tutup Borang' : 'Catat Jualan'}</span>
              </button>

              {isFilterOpen && (
                <div className="animate-popover-enter absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl p-4 z-30 space-y-3.5">
                  <div className="pb-3 border-b border-slate-200 dark:border-zinc-700">
                    <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5 flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>Susun Mengikut</span>
                    </label>
                    <select
                      value={sortBy === 'table_column' ? '' : sortBy}
                      onChange={(e) => {
                        if (e.target.value) setSortBy(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer"
                    >
                      {sortBy === 'table_column' && (
                        <option value="">Ikut Lajur Jadual</option>
                      )}
                      {cashflowSortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                      Bulan / Tempoh
                    </label>
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white font-medium cursor-pointer"
                    >
                      {availableMonths.map((ym) => (
                        <option key={ym} value={ym}>
                          {formatMonthLabel(ym)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[0.8125rem] font-bold uppercase tracking-wider text-black/65 dark:text-white/70 mb-1.5">
                      Kategori Rekod
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'all', label: 'Semua' },
                          { id: 'cash', label: 'Ada Tunai' },
                          { id: 'qr', label: 'Ada DuitNow QR' },
                          { id: 'profit', label: 'Untung Positif' }
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCategoryFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            categoryFilter === opt.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-zinc-950 text-black dark:text-white border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setMonthFilter('Semua');
                        setCategoryFilter('all');
                        setSortBy(DEFAULT_SORT_VALUE);
                      }}
                      className="text-[0.8125rem] font-semibold text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Set Semula
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[0.8125rem] font-bold cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty States or Table */}
        {salesRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Coins className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto" />
            <h4 className="text-sm font-bold text-black dark:text-white">
              Tiada Rekod Jualan Lagi
            </h4>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75">
              Tekan butang Catat Jualan di atas untuk merekodkan jualan harian anda.
            </p>
          </div>
        ) : filteredSortedSales.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Search className="w-9 h-9 text-black/30 dark:text-white/30 mx-auto" />
            <h4 className="text-sm font-bold text-black dark:text-white">
              Tiada Rekod Padan Dengan Carian / Penapis
            </h4>
            <button
              type="button"
              onClick={() => {
                setSalesSearch('');
                setMonthFilter('Semua');
                setCategoryFilter('all');
              }}
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Set Semula Carian &amp; Penapis
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-zinc-950/90 border-b border-slate-200 dark:border-zinc-700 text-[0.8125rem] font-semibold text-black/65 dark:text-white/70">
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Pilih semua rekod jualan pada halaman ini"
                        className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('date')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Tarikh</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('cashSales')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Tunai</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('qrSales')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>DuitNow QR</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('expenses')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Kos Belanja</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('net')}
                        className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Untung Bersih</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-65" />
                      </button>
                    </th>
                    <th className="py-3 px-3">Catatan</th>
                    <th className="py-3 pl-2 pr-4 w-12 text-right">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-black dark:text-white">
                  {salesPagination.paginatedItems.map((r) => {
                    const dailyNet = (r.cashSales + r.qrSales) - r.expenses;
                    const isChecked = selectedIds.includes(r.id);

                    return (
                      <tr
                        key={r.id}
                        className={`kbelia-table-row ${
                          isChecked
                            ? 'bg-blue-50/40 dark:bg-blue-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(r.id)}
                            aria-label={`Pilih rekod bertarikh ${r.date}`}
                            className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-black dark:text-white tabular-nums whitespace-nowrap">
                          {formatSaleDate(r.date)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                          RM {r.cashSales.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums font-medium whitespace-nowrap">
                          RM {r.qrSales.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums text-black/80 dark:text-white/80 whitespace-nowrap">
                          RM {r.expenses.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              dailyNet >= 0
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            RM {dailyNet.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-black/75 dark:text-white/80 max-w-[240px] truncate">
                          {r.notes || '-'}
                        </td>
                        <td className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap">
                          <RowActionMenu
                            ariaLabel={`Tindakan untuk rekod ${r.date}`}
                            items={[
                              {
                                label: 'Edit',
                                onClick: () => setEditingRecord(r)
                              },
                              {
                                label: 'Padam',
                                tone: 'danger',
                                dividerBefore: true,
                                onClick: () =>
                                  confirmDelete({
                                    itemName: `${r.date} - RM ${(r.cashSales + r.qrSales).toFixed(2)}`,
                                    itemType: 'Rekod Jualan Harian',
                                    onConfirm: () => handleDeleteRecord(r.id)
                                  })
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              variant="compact"
              currentPage={salesPagination.currentPage}
              totalItems={salesPagination.totalItems}
              itemsPerPage={7}
              onPageChange={salesPagination.setCurrentPage}
              itemLabel="rekod jualan"
              accent="blue"
            />
          </>
        )}
      </div>

      <EditCashflowModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        ownerId={ownerId}
        businessName={kioskName}
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
