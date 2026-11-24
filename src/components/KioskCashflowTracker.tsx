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
import { getRoleTheme } from '../utils/roleTheme';

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

  const beliaTheme = getRoleTheme('belia');

  return (
    <div className="animate-dashboard-tab space-y-4">
      <div className="px-1">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
          Catatan Aliran Tunai
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-400 mt-0.5">
          Rekod harian hasil jualan dan perbelanjaan perniagaan anda.
        </p>
      </div>

      {/* Ringkasan Kewangan Mendatar */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x rounded-2xl border transition-colors ${beliaTheme.surfaceClass} ${beliaTheme.dividerClass}`}>
        <div className="p-4">
          <span className="text-xs font-medium text-slate-600 dark:text-stone-400 block mb-1">
            Jumlah Jualan
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-[#F4F1EA] tabular-nums tracking-tight">
            {animatedRevenue}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs font-medium text-slate-600 dark:text-stone-400 block mb-1">
            Perbelanjaan
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-[#F4F1EA] tabular-nums tracking-tight">
            {animatedExpenses}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs font-medium text-slate-600 dark:text-stone-400 block mb-1">
            Baki Positif
          </span>
          <span className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${beliaTheme.accentTextClass}`}>
            {animatedNetProfit}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs font-medium text-slate-600 dark:text-stone-400 block mb-1">
            Bayaran QR
          </span>
          <span className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${beliaTheme.accentStrongTextClass}`}>
            {animatedQrPct}
          </span>
        </div>
      </div>

      {/* Collapsible Record Input Form */}
      {showAddForm && (
        <div className={`animate-dashboard-tab rounded-2xl border overflow-hidden transition-colors ${beliaTheme.surfaceClass}`}>
          <div className={`border-b py-3.5 px-5 flex items-center justify-between ${beliaTheme.dividerClass}`}>
            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-[#F4F1EA] flex items-center gap-2">
              <Coins className={`w-4 h-4 ${beliaTheme.accentTextClass}`} />
              <span>Tambah Catatan Harian</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              aria-label="Tutup borang catatan jualan"
              className="p-1.5 rounded-xl text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddRecord} className="p-4 sm:p-5 space-y-4">
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 text-sm font-medium border border-rose-200 dark:border-rose-800">
                {validationError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-[#F4F1EA] block mb-1.5">Tarikh</label>
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
                <label className="text-sm font-medium text-slate-800 dark:text-[#F4F1EA] block mb-1.5">Jualan Tunai (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-[#F4F1EA] block mb-1.5">Bayaran QR (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={qr}
                  onChange={(e) => setQr(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-[#F4F1EA] block mb-1.5">Perbelanjaan (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Catatan ringkas harian (contoh: Jualan hujung minggu)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`min-h-[38px] px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${beliaTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`min-h-[38px] px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${beliaTheme.primaryButtonClass}`}
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Single-Elevation Hairline Sales Table */}
      <div className={`rounded-2xl border overflow-visible transition-colors ${beliaTheme.surfaceClass}`}>
        <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${beliaTheme.dividerClass}`}>
          <div
            style={{ ['--search-fit-w' as string]: getSearchInputWidth('Cari tarikh atau catatan...') }}
            className="relative w-full sm:w-[var(--search-fit-w)] sm:max-w-full min-w-0"
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              placeholder="Cari tarikh atau catatan..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm focus:outline-none transition-all ${beliaTheme.inputClass}`}
            />
            {salesSearch && (
              <button
                type="button"
                onClick={() => setSalesSearch('')}
                aria-label="Kosongkan carian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedIds.length > 0 && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[0.8125rem] font-semibold ${beliaTheme.activeMiniBtnClass}`}>
                <span className="tabular-nums">{selectedIds.length} dipilih</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="underline cursor-pointer font-semibold"
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
                    ? beliaTheme.activeMiniBtnClass
                    : beliaTheme.secondaryButtonClass
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleExportSales}
                className={`min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${beliaTheme.secondaryButtonClass}`}
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
                className={`min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all ${beliaTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{showAddForm ? 'Tutup' : 'Tambah'}</span>
              </button>

              {isFilterOpen && (
                <div className="animate-popover-enter absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#141D1A] border border-slate-200 dark:border-[#24342D] shadow-xl p-4 z-30 space-y-3.5">
                  <div className={`pb-3 border-b ${beliaTheme.dividerClass}`}>
                    <label className="block text-[0.8125rem] font-semibold text-slate-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                      <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${beliaTheme.accentTextClass}`} />
                      <span>Susun Mengikut</span>
                    </label>
                    <select
                      value={sortBy === 'table_column' ? '' : sortBy}
                      onChange={(e) => {
                        if (e.target.value) setSortBy(e.target.value);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${beliaTheme.inputClass}`}
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
                    <label className="block text-xs font-semibold text-slate-600 dark:text-stone-400 mb-1.5">
                      Bulan / Tempoh
                    </label>
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${beliaTheme.inputClass}`}
                    >
                      {availableMonths.map((ym) => (
                        <option key={ym} value={ym}>
                          {formatMonthLabel(ym)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-stone-400 mb-1.5">
                      Kategori Rekod
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'all', label: 'Semua' },
                          { id: 'cash', label: 'Ada Tunai' },
                          { id: 'qr', label: 'Ada QR' },
                          { id: 'profit', label: 'Baki Positif' }
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCategoryFilter(opt.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[0.8125rem] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            categoryFilter === opt.id
                              ? beliaTheme.segmentedActiveClass
                              : beliaTheme.secondaryButtonClass
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`pt-2 border-t flex items-center justify-between ${beliaTheme.dividerClass}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setMonthFilter('Semua');
                        setCategoryFilter('all');
                        setSortBy(DEFAULT_SORT_VALUE);
                      }}
                      className="text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-300 hover:underline cursor-pointer"
                    >
                      Set Semula
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className={`px-3 py-1.5 rounded-xl text-[0.8125rem] font-semibold cursor-pointer ${beliaTheme.primaryButtonClass}`}
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
          <div className="p-10 text-center space-y-1.5">
            <Coins className="w-9 h-9 text-slate-400 dark:text-stone-500 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
              Belum Ada Catatan Jualan
            </h4>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Klik Tambah Catatan di atas untuk merekodkan jualan harian anda.
            </p>
          </div>
        ) : filteredSortedSales.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-400 dark:text-stone-500 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
              Tiada Rekod Padan Dengan Carian
            </h4>
            <button
              type="button"
              onClick={() => {
                setSalesSearch('');
                setMonthFilter('Semua');
                setCategoryFilter('all');
              }}
              className={`text-sm font-semibold hover:underline cursor-pointer ${beliaTheme.accentTextClass}`}
            >
              Set Semula
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[0.8125rem] font-semibold text-slate-600 dark:text-stone-400 ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                    <th className="py-3 pl-5 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Pilih semua rekod jualan pada halaman ini"
                        className="w-4 h-4 rounded border-slate-300 dark:border-stone-600 cursor-pointer accent-[#0B6E52] dark:accent-[#10B981]"
                      />
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('date')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Tarikh</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('cashSales')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Tunai</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('qrSales')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Bayaran QR</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('expenses')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Perbelanjaan</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort('net')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <span>Baki</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </th>
                    <th className="py-3 px-3">Catatan</th>
                    <th className="py-3 pl-2 pr-5 w-12 text-right">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-slate-900 dark:text-[#F4F1EA] ${beliaTheme.dividerClass}`}>
                  {salesPagination.paginatedItems.map((r) => {
                    const dailyNet = (r.cashSales + r.qrSales) - r.expenses;
                    const isChecked = selectedIds.includes(r.id);

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isChecked
                            ? 'bg-[#0B6E52]/6 dark:bg-[#10B981]/10'
                            : beliaTheme.rowHoverClass
                        }`}
                      >
                        <td className="py-3.5 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(r.id)}
                            aria-label={`Pilih rekod bertarikh ${r.date}`}
                            className="w-4 h-4 rounded border-slate-300 dark:border-stone-600 cursor-pointer accent-[#0B6E52] dark:accent-[#10B981]"
                          />
                        </td>
                        <td className="py-3.5 px-3 font-semibold tabular-nums whitespace-nowrap">
                          {formatSaleDate(r.date)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                          RM {r.cashSales.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums font-medium whitespace-nowrap">
                          RM {r.qrSales.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums text-slate-600 dark:text-stone-400 whitespace-nowrap">
                          RM {r.expenses.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 tabular-nums whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              dailyNet >= 0
                                ? beliaTheme.accentTextClass
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            RM {dailyNet.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-stone-400 max-w-[240px] truncate">
                          {r.notes || '-'}
                        </td>
                        <td className="py-3.5 pl-2 pr-5 text-right whitespace-nowrap">
                          <RowActionMenu
                            ariaLabel={`Tindakan untuk rekod ${r.date}`}
                            items={[
                              {
                                label: 'Sunting',
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
