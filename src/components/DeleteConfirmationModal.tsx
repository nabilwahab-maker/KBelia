import React, { useEffect } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  itemType?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  description,
  confirmLabel,
  cancelLabel,
  isDeleting = false,
  onConfirm,
  onCancel
}) => {
  const { language } = useLanguage();
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const isEn = language === 'en';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const resolvedTitle = title || (isEn ? 'Confirm Deletion?' : 'Adakah Anda Ingin Padam?');
  const resolvedDesc =
    description ||
    (isEn
      ? 'This item will be permanently removed and cannot be undone.'
      : 'Item ini akan dipadam secara kekal dan tindakan ini tidak boleh dibatalkan.');
  const resolvedConfirm = confirmLabel || (isEn ? 'Yes, Delete' : 'Ya, Padam');
  const resolvedCancel = cancelLabel || (isEn ? 'No' : 'Tidak');

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-amber-400/50 dark:border-zinc-600 shadow-2xl p-6 sm:p-7 text-center transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top-Right */}
        <button
          type="button"
          disabled={isDeleting}
          onClick={onCancel}
          aria-label={isEn ? 'Close' : 'Tutup'}
          className={`absolute top-3.5 right-3.5 disabled:opacity-40 ${roleTheme.iconButtonClass}`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Circular Red Alert Icon */}
        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3
          id="delete-confirm-title"
          className="mt-4 text-xl font-bold text-black dark:text-white tracking-tight"
        >
          {resolvedTitle}
        </h3>

        {/* Highlighted Item Name */}
        <div className="mt-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 px-4 py-3">
          {itemType && (
            <div className="text-[0.8125rem] font-semibold uppercase tracking-wider text-black/70 dark:text-white/75 mb-0.5">
              {itemType}
            </div>
          )}
          <div className="text-sm font-bold text-black dark:text-white break-words">
            {itemName}
          </div>
        </div>

        {/* Warning Description */}
        <p className="mt-3 text-[0.9375rem] text-black/80 dark:text-white/80 leading-relaxed">
          {resolvedDesc}
        </p>

        {/* Action Buttons: Tidak / Ya, Padam */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className={`w-full sm:w-1/2 min-h-[42px] px-5 py-2.5 text-sm disabled:opacity-50 ${roleTheme.secondaryButtonClass}`}
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className={`w-full sm:w-1/2 min-h-[42px] px-5 py-2.5 text-sm shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 ${roleTheme.dangerButtonClass}`}
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? (isEn ? 'Deleting...' : 'Memadam...') : resolvedConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
