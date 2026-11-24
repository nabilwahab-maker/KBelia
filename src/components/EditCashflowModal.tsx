import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { KioskDailySale } from '../types';
import { saveCashflowRecord } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { ModernDatePicker, addDaysIso, toLocalIsoDate } from './ModernDateTimePicker';

interface EditCashflowModalProps {
  isOpen: boolean;
  record: KioskDailySale | null;
  ownerId: string;
  businessName?: string;
  onClose: () => void;
  onSaved: (updated: KioskDailySale) => void;
}

export const EditCashflowModal: React.FC<EditCashflowModalProps> = ({
  isOpen,
  record,
  ownerId,
  businessName,
  onClose,
  onSaved
}) => {
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));

  const [date, setDate] = useState('');
  const [cashSales, setCashSales] = useState('');
  const [qrSales, setQrSales] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && record) {
      setDate(record.date || new Date().toISOString().slice(0, 10));
      setCashSales(String(record.cashSales ?? 0));
      setQrSales(String(record.qrSales ?? 0));
      setExpenses(String(record.expenses ?? 0));
      setNotes(record.notes || '');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, record]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !record) return null;

  const cashVal = parseFloat(cashSales) || 0;
  const qrVal = parseFloat(qrSales) || 0;
  const expVal = parseFloat(expenses) || 0;
  const previewNet = cashVal + qrVal - expVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date.trim()) {
      setError('Sila pilih tarikh rekod.');
      return;
    }
    if (cashVal < 0 || qrVal < 0 || expVal < 0) {
      setError('Nilai jualan dan belanja tidak boleh kurang daripada RM0.');
      return;
    }
    if (cashVal === 0 && qrVal === 0 && expVal === 0) {
      setError('Sila masukkan sekurang-kurangnya satu jumlah jualan atau belanja.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await saveCashflowRecord({
        id: record.id,
        ownerId: record.ownerId || ownerId,
        businessName: record.businessName || businessName || 'Perniagaan Anda',
        date: date.trim(),
        cashSales: cashVal,
        qrSales: qrVal,
        expenses: expVal,
        notes: notes.trim() || 'Rekod jualan harian',
        createdAt: record.createdAt
      });
      onSaved(updated);
    } catch (err) {
      console.error('Gagal mengemas kini rekod jualan:', err);
      setError('Gagal menyimpan perubahan. Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-cashflow-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${roleTheme.surfaceMutedClass} border-b ${roleTheme.dividerClass} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${roleTheme.activeMiniBtnClass} border flex items-center justify-center shrink-0`}>
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="edit-cashflow-modal-title" className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                Edit Rekod Jualan Harian
              </h3>
              <p className="text-[0.875rem] text-black/70 dark:text-white/75 truncate">
                Kemaskini rekod jualan, perbelanjaan dan catatan harian.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Tutup tetingkap edit"
            className={`${roleTheme.iconButtonClass} disabled:opacity-40`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm font-medium text-black dark:text-white flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tarikh</label>
              <ModernDatePicker
                value={date}
                onChange={setDate}
                valueFormat="iso"
                quickDates={[
                  { label: 'Hari Ini', value: toLocalIsoDate(new Date()) },
                  { label: 'Semalam', value: addDaysIso(toLocalIsoDate(new Date()), -1) }
                ]}
                placeholder="Pilih tarikh"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Jualan Tunai</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashSales}
                onChange={(e) => setCashSales(e.target.value)}
                placeholder="Masukkan jumlah"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono tabular-nums focus:outline-none ${roleTheme.inputClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Jualan QR</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={qrSales}
                onChange={(e) => setQrSales(e.target.value)}
                placeholder="Masukkan jumlah"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono tabular-nums focus:outline-none ${roleTheme.inputClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Perbelanjaan</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="Masukkan jumlah"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] font-mono tabular-nums focus:outline-none ${roleTheme.inputClass}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Catatan</label>
            <input
              type="text"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masukkan catatan"
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm sm:text-[0.9375rem] focus:outline-none ${roleTheme.inputClass}`}
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center justify-between text-sm">
            <span className="font-medium text-black/70 dark:text-white/75">Untung Bersih Dikira:</span>
            <span className="font-bold font-mono tabular-nums text-black dark:text-white">
              RM {previewNet.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-3 border-t border-slate-300 dark:border-slate-600">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className={`w-full sm:w-auto min-h-[42px] px-5 py-2.5 text-sm sm:text-[0.9375rem] disabled:opacity-50 ${roleTheme.secondaryButtonClass}`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full sm:w-auto min-h-[42px] px-6 py-2.5 text-sm sm:text-[0.9375rem] shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 ${roleTheme.primaryButtonClass}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
