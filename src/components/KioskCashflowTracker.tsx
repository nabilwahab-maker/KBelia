import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Coins,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
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
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

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
  const [sortConfig] = useState<{ key: SaleSortKey; dir: 'asc' | 'desc' }>({
    key: 'date',
    dir: 'desc'
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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

  const categoryCounts = useMemo(
    () => ({
      all: salesRecords.length,
      cash: salesRecords.filter((r) => r.cashSales > 0).length,
      qr: salesRecords.filter((r) => r.qrSales > 0).length,
      profit: salesRecords.filter((r) => (r.cashSales + r.qrSales) - r.expenses > 0).length
    }),
    [salesRecords]
  );

  const activeSale =
    filteredSortedSales.find((r) => r.id === selectedRecordId) ||
    salesPagination.paginatedItems[0] ||
    filteredSortedSales[0] ||
    null;

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

      {/* Google Workspace Header + Split-Pane Cashflow List & Preview */}
      <WorkspaceHeaderCard
        role="belia"
        icon={<Coins className="w-5 h-5" />}
        title="Rekod Aliran Tunai Harian"
        subtitle="Pilih mana-mana catatan harian di kiri untuk pratonton pecahan tunai, DuitNow QR, dan tindakan kemas kini."
        tabs={[
          { id: 'all', label: 'Semua', count: categoryCounts.all },
          { id: 'cash', label: 'Ada Tunai', count: categoryCounts.cash },
          { id: 'qr', label: 'Ada QR', count: categoryCounts.qr },
          { id: 'profit', label: 'Baki Positif', count: categoryCounts.profit }
        ]}
        activeTab={categoryFilter}
        onTabChange={(id) => setCategoryFilter(id as SaleCategoryFilter)}
        searchValue={salesSearch}
        onSearchChange={setSalesSearch}
        searchPlaceholder="Cari tarikh atau catatan..."
        rightActions={
          <>
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

            <button
              type="button"
              onClick={handleExportSales}
              className={`min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${beliaTheme.secondaryButtonClass}`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>
                {selectedIds.length > 0 ? `Eksport (${selectedIds.length})` : 'Eksport'}
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
          </>
        }
        extraControls={
          <div className="relative flex items-center gap-2" data-cf-filter>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Tapis mengikut bulan"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm cursor-pointer focus:outline-none ${beliaTheme.inputClass}`}
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-expanded={isFilterOpen}
              aria-label={activeFilterCount > 0 ? `Penapis & Susunan (${activeFilterCount} aktif)` : 'Susun & Penapis'}
              title={activeFilterCount > 0 ? `Penapis (${activeFilterCount} aktif)` : 'Susun & Penapis'}
              className={`min-h-[34px] w-[34px] rounded-xl border inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                activeFilterCount > 0
                  ? beliaTheme.activeMiniBtnClass
                  : beliaTheme.secondaryButtonClass
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
            </button>

            {isFilterOpen && (
              <div className="animate-popover-enter absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#141D1A] border border-slate-200 dark:border-[#24342D] shadow-xl p-4 z-30 space-y-3.5">
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
                    {cashflowSortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
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
        }
      />

      <GoogleWorkspaceSplitPane
        role="belia"
        mobileOpen={mobilePreviewOpen}
        onMobileClose={() => setMobilePreviewOpen(false)}
        mobileTitle={activeSale ? formatSaleDate(activeSale.date) : 'Aliran Tunai'}
        leftHeader={
          filteredSortedSales.length > 0 ? (
            <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-stone-400 ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAllOnPage}
                  aria-label="Pilih semua rekod jualan pada halaman ini"
                  className="w-4 h-4 rounded border-slate-300 dark:border-stone-600 cursor-pointer accent-[#0B6E52] dark:accent-[#10B981]"
                />
                <span>Pilih Semua (Halaman Ini)</span>
              </label>
              <span className="tabular-nums">{filteredSortedSales.length} rekod</span>
            </div>
          ) : undefined
        }
        leftContent={
          salesRecords.length === 0 ? (
            <div className="p-10 text-center space-y-1.5">
              <Coins className="w-9 h-9 text-slate-400 dark:text-stone-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
                Belum Ada Catatan Jualan
              </h4>
              <p className="text-xs text-slate-600 dark:text-stone-400">
                Klik butang Tambah di atas untuk merekodkan jualan harian anda.
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
                className={`text-xs font-semibold hover:underline cursor-pointer ${beliaTheme.accentTextClass}`}
              >
                Set Semula
              </button>
            </div>
          ) : (
            salesPagination.paginatedItems.map((r) => {
              const dailyTotal = r.cashSales + r.qrSales;
              const dailyNet = dailyTotal - r.expenses;
              const isChecked = selectedIds.includes(r.id);
              const isSelected = activeSale?.id === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRecordId(r.id);
                    setMobilePreviewOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRecordId(r.id);
                      setMobilePreviewOpen(true);
                    }
                  }}
                  className={`w-full text-left p-3.5 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? getWorkspaceActiveRowClass('belia')
                      : beliaTheme.rowHoverClass
                  }`}
                >
                  <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRow(r.id)}
                      aria-label={`Pilih rekod bertarikh ${r.date}`}
                      className="w-4 h-4 rounded border-slate-300 dark:border-stone-600 cursor-pointer accent-[#0B6E52] dark:accent-[#10B981]"
                    />
                  </div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${beliaTheme.activeMiniBtnClass}`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold truncate tabular-nums kbelia-trim ${isSelected ? beliaTheme.accentTextClass : 'text-slate-900 dark:text-[#F4F1EA]'}`}>
                        {formatSaleDate(r.date)}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                          dailyNet >= 0
                            ? 'text-[#0B6E52] dark:text-[#34D399]'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {dailyNet >= 0 ? '+' : ''}RM {dailyNet.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-stone-400 tabular-nums truncate">
                      Tunai RM {r.cashSales.toFixed(2)} &middot; QR RM {r.qrSales.toFixed(2)} &middot; Belanja RM {r.expenses.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-stone-400 truncate">
                      {r.notes || 'Rekod jualan harian'}
                    </p>
                  </div>
                </div>
              );
            })
          )
        }
        leftFooter={
          filteredSortedSales.length > 0 ? (
            <PaginationBar
              variant="compact"
              currentPage={salesPagination.currentPage}
              totalItems={salesPagination.totalItems}
              itemsPerPage={7}
              onPageChange={salesPagination.setCurrentPage}
              itemLabel="rekod jualan"
            />
          ) : undefined
        }
        rightContent={
          !activeSale ? (
            <SidePreviewEmptyState
              icon={<Coins className="w-10 h-10 text-slate-400 dark:text-stone-500" />}
              title="Pilih rekod daripada senarai di sebelah kiri"
              description="Pecahan jualan tunai, bayaran QR, perbelanjaan dan nota harian akan dipaparkan di sini."
            />
          ) : (() => {
            const totalSale = activeSale.cashSales + activeSale.qrSales;
            const net = totalSale - activeSale.expenses;
            return (
              <div>
                <SidePreviewHeader
                  role="belia"
                  media={
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${beliaTheme.activeMiniBtnClass}`}>
                      <Coins className="w-6 h-6" />
                    </div>
                  }
                  title={`Catatan ${formatSaleDate(activeSale.date)}`}
                  status={
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold tabular-nums ${
                        net >= 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}
                    >
                      {net >= 0 ? 'Baki Positif' : 'Baki Defisit'}
                    </span>
                  }
                  subtitle={activeSale.businessName || kioskName}
                  meta={
                    <>
                      <span className="font-mono tabular-nums">{activeSale.date}</span>
                      <span>&middot;</span>
                      <span className="tabular-nums">Jumlah Jualan: RM {totalSale.toFixed(2)}</span>
                    </>
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(activeSale)}
                        className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${beliaTheme.secondaryButtonClass}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sunting</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemName: `${activeSale.date} - RM ${totalSale.toFixed(2)}`,
                            itemType: 'Rekod Jualan Harian',
                            onConfirm: () => handleDeleteRecord(activeSale.id)
                          })
                        }
                        className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${beliaTheme.dangerOutlineButtonClass}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </>
                  }
                />

                <div className="p-4 sm:p-5 space-y-4">
                  <SidePreviewMetricsStrip
                    role="belia"
                    items={[
                      { label: 'Jualan Tunai', value: `RM ${activeSale.cashSales.toFixed(2)}`, mono: true },
                      { label: 'Bayaran DuitNow QR', value: `RM ${activeSale.qrSales.toFixed(2)}`, mono: true },
                      { label: 'Perbelanjaan Harian', value: `RM ${activeSale.expenses.toFixed(2)}`, mono: true }
                    ]}
                  />

                  <SidePreviewMetricsStrip
                    role="belia"
                    columns={2}
                    items={[
                      { label: 'Jumlah Jualan Kotor', value: `RM ${totalSale.toFixed(2)}`, mono: true },
                      {
                        label: 'Baki Bersih Harian',
                        value: `RM ${net.toFixed(2)}`,
                        mono: true,
                        accent: net >= 0
                      }
                    ]}
                  />

                  <div className="space-y-1.5">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400">
                      Catatan Harian
                    </h5>
                    <div className={`p-3.5 rounded-xl border text-sm text-slate-800 dark:text-stone-200 leading-relaxed whitespace-pre-line ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                      {activeSale.notes || 'Tiada catatan tambahan direkodkan untuk tarikh ini.'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        }
      />

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
