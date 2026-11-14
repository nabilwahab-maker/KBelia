import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { KioskDailySale } from '../types';
import { saveCashflowRecord } from '../services/dataService';

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
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kbelia-important-header border-b border-slate-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="edit-cashflow-modal-title" className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Edit Rekod Jualan Harian
              </h3>
              <p className="text-[11px] text-slate-600 truncate">
                Kemaskini tarikh, jualan tunai, DuitNow QR, belanja dan catatan.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Tutup tetingkap edit"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Tarikh</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Jualan Tunai (RM)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashSales}
                onChange={(e) => setCashSales(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">DuitNow QR (RM)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={qrSales}
                onChange={(e) => setQrSales(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Belanja / Kos (RM)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">Catatan</label>
            <input
              type="text"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="cth. Restok bahan mentah atau jualan petang"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Untung Bersih Dikira:</span>
            <span className="font-bold font-mono tabular-nums text-slate-900">
              RM {previewNet.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-3 border-t border-slate-300">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[42px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
