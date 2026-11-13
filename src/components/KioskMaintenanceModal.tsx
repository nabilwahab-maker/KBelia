import React, { useState } from 'react';
import { 
  Wrench, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Zap,
  Droplets,
  Key,
  Home
} from 'lucide-react';
import { MaintenanceTicket } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface KioskMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSlotCode?: string;
  defaultKioskName?: string;
}

export const KioskMaintenanceModal: React.FC<KioskMaintenanceModalProps> = ({
  isOpen,
  onClose,
  defaultSlotCode = 'CAP-KB-01',
  defaultKioskName = 'Hub Belia KB Sentral'
}) => {
  const { t, language } = useLanguage();
  const [category, setCategory] = useState<MaintenanceTicket['issueCategory']>('Elektrik & Suis');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('TK-KB-' + Math.floor(1000 + Math.random() * 9000));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!description.trim()) {
      setErrorMsg(language === 'en' 
        ? 'Please describe the maintenance or repair issue encountered.' 
        : 'Sila nyatakan butiran kerosakan yang dihadapi pada kiosk anda.');
      return;
    }
    setTicketId('TK-KB-' + Math.floor(1000 + Math.random() * 9000));
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 scale-100 transition-all max-h-[90vh] overflow-hidden flex flex-col my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="kbelia-important-header border-b border-slate-200 dark:border-slate-700 py-4.5 px-6 sm:px-7 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                {language === 'en' ? 'Kiosk Maintenance & Issue Ticket' : 'Tiket Aduan & Penyelenggaraan Kiosk'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Technical & Facilities Unit UMK / Kelantan PBT' : 'Unit Teknikal & Fasiliti UMK / PBT Kelantan'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium border border-rose-200 dark:border-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
                    {language === 'en' ? 'Kiosk Location:' : 'Lokasi Kiosk:'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{defaultKioskName}</span>
                </div>
                <span className="font-mono font-bold text-xs sm:text-sm text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                  {defaultSlotCode}
                </span>
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                  {language === 'en' ? 'Issue Category:' : 'Kategori Kerosakan:'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { cat: 'Elektrik & Suis', labelEn: 'Electrical & Power', icon: Zap },
                    { cat: 'Paip & Air', labelEn: 'Plumbing & Water', icon: Droplets },
                    { cat: 'Pintu & Kunci', labelEn: 'Door & Lock', icon: Key },
                    { cat: 'Struktur & Bumbung', labelEn: 'Structure & Roof', icon: Home }
                  ].map(({ cat, labelEn, icon: Icon }) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat as any)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-600 ring-1 ring-sky-600/30 text-sky-900 dark:text-sky-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-semibold">{language === 'en' ? labelEn : cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                  {language === 'en' ? 'Issue Details / Description:' : 'Keterangan Isu / Kerosakan:'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Left electrical socket is not functional since this morning...' : 'Contoh: Soket elektrik sebelah kiri tidak berfungsi sejak pagi ini...'}
                  className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              {/* 2-Column Paired Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                    {language === 'en' ? 'Reporter Name:' : 'Nama Pengadu:'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'Your full name' : 'Nama anda'}
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block mb-2">
                    {language === 'en' ? 'Phone No. (WhatsApp):' : 'No. Telefon (WhatsApp):'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01120508890"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full px-4.5 py-3 rounded-lg text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{language === 'en' ? 'Submit Issue Ticket' : 'Hantar Tiket Aduan'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                {language === 'en' ? `Maintenance Ticket #${ticketId} Submitted` : `Tiket Aduan #${ticketId} Berjaya Dihantar`}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">
                {language === 'en' 
                  ? 'The facilities technical team has been notified. An on-duty technician will contact you within 2-4 working hours.' 
                  : 'Pasukan teknikal fasiliti UMK telah dimaklumkan. Juruteknik bertugas akan menghubungi anda dalam tempoh 2-4 jam waktu bekerja.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-lg text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Return to Dashboard' : 'Kembali ke Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

