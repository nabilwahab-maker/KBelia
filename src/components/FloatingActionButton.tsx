import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  Share2, 
  X, 
  Store, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { showToast } from './ToastNotification';

interface FloatingActionButtonProps {
  onOpenBookingModal?: () => void;
  onOpenGrantModal?: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onOpenBookingModal,
  onOpenGrantModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'Pautan Disalin!',
      message: 'Pautan portal KBELIA Kelantan telah disalin ke papan klip anda.'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent('Salam sejahtera Urusetia KBELIA Kelantan. Saya ingin bertanya mengenai bantuan geran / sewaan kiosk belia.');
    window.open(`https://wa.me/601120508890?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Menu Options */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Option 1: WhatsApp Urusetia */}
          <button
            type="button"
            onClick={handleWhatsAppHelp}
            className="interactive-press interactive-lift flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E293B] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-all cursor-pointer group text-xs font-bold"
          >
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600">
              Meja Bantuan
            </span>
            <span>WhatsApp Urusetia</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <MessageCircle className="w-4 h-4" />
            </div>
          </button>

          {/* Option 2: Quick Kiosk Booking if provided */}
          {onOpenBookingModal && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenBookingModal();
              }}
              className="interactive-press interactive-lift flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E293B] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 transition-all cursor-pointer group text-xs font-bold"
            >
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-amber-600">
                Kapsul RM150/bln
              </span>
              <span>Mohon Kiosk Segera</span>
              <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Store className="w-4 h-4" />
              </div>
            </button>
          )}

          {/* Option 3: Copy Portal Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="interactive-press interactive-lift flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E293B] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs font-bold group"
          >
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {copied ? 'Telah Disalin!' : 'Kongsi Web'}
            </span>
            <span>Salin Pautan Portal</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bantuan & Tindakan Pantas"
        className={`interactive-press w-13 h-13 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 rotate-90 shadow-slate-900/30'
            : 'bg-gradient-to-tr from-red-800 to-amber-600 hover:from-red-900 hover:to-amber-700 shadow-red-800/25 hover:shadow-red-800/40 hover:-translate-y-1'
        }`}
        title="Bantuan & Tindakan Pantas Usahawan"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
