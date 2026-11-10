import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

// Global listener mechanism for zero-friction toast dispatching from anywhere in the app
type ToastListener = (toast: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();

export const showToast = (
  toast: Omit<ToastMessage, 'id'> | string, 
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) => {
  const toastObj: Omit<ToastMessage, 'id'> = typeof toast === 'string'
    ? { title: toast, type }
    : toast;

  const newToast: ToastMessage = {
    ...toastObj,
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    duration: toastObj.duration ?? 4000
  };
  listeners.forEach(fn => fn(newToast));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: ToastListener = (newToast) => {
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 4 toasts
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 4000;
    const interval = 20;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          border: 'border-emerald-200 dark:border-emerald-800/80',
          bg: 'bg-white dark:bg-[#1E293B]',
          bar: 'bg-emerald-500',
          accent: 'text-emerald-800 dark:text-emerald-300'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
          border: 'border-rose-200 dark:border-rose-800/80',
          bg: 'bg-white dark:bg-[#1E293B]',
          bar: 'bg-rose-500',
          accent: 'text-rose-800 dark:text-rose-300'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
          border: 'border-amber-200 dark:border-amber-800/80',
          bg: 'bg-white dark:bg-[#1E293B]',
          bar: 'bg-amber-500',
          accent: 'text-amber-800 dark:text-amber-300'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
          border: 'border-blue-200 dark:border-blue-800/80',
          bg: 'bg-white dark:bg-[#1E293B]',
          bar: 'bg-blue-500',
          accent: 'text-blue-800 dark:text-blue-300'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      className={`pointer-events-auto overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-lg shadow-slate-900/5 transition-all animate-in slide-in-from-bottom-3 duration-200 flex flex-col`}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div className="pt-0.5">{theme.icon}</div>
        <div className="flex-1 min-w-0 pr-1">
          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
            {toast.title}
          </h5>
          {toast.message && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Tutup pemberitahuan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full ${theme.bar} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
