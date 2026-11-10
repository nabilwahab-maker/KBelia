import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const resolvedConfirmLabel = confirmLabel || (isDestructive ? 'Ya, Teruskan Padam' : 'Ya, Sahkan Tindakan');
  const resolvedCancelLabel = cancelLabel || (isDestructive ? 'Tidak, Kekalkan' : 'Tidak, Batal & Kembali');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 scale-100 transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive 
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
            }`}>
              {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <span className="text-[11px] font-medium text-slate-400">
                Pengesahan Keselamatan 2-Peringkat
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup tetingkap"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {message}
        </p>

        {/* Clear Action-Oriented Buttons (Image 07 & Image 05) */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-500/20'
                : 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20'
            }`}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
