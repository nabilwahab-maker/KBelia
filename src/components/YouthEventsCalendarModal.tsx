import React from 'react';
import { 
  Calendar, 
  X, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Sparkles,
  Users
} from 'lucide-react';
import { showToast } from './ToastNotification';

interface YouthEventsCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EVENTS = [
  {
    id: '1',
    title: 'Karnival Keusahawanan Belia Mega Kelantan 2026',
    date: '10 - 12 April 2026',
    time: '9:00 AM - 11:00 PM',
    venue: 'Dataran Stadium Sultan Muhammad IV, Kota Bharu',
    organizer: 'Kerajaan Negeri Kelantan & Universiti Malaysia Kelantan',
    highlights: '100+ Kiosk Usahawan Muda, Klinik Pembiayaan TEKUN & Pitching Geran Tunai',
    registrationStatus: 'Buka untuk Peniaga Kiosk'
  },
  {
    id: '2',
    title: 'Festival Seni Batik, Kraf & Songket Tradisi Pantai Timur',
    date: '24 - 26 April 2026',
    time: '10:00 AM - 10:00 PM',
    venue: 'Pusat Kraftangan Pantai Cahaya Bulan (PCB), Kota Bharu',
    organizer: 'Perbadanan Kemajuan Iktisad Negeri Kelantan (PKINK)',
    highlights: 'Pameran fesyen belia, bengkel canting batik percuma & jualan langsung',
    registrationStatus: 'Tinggal 8 Tapak'
  },
  {
    id: '3',
    title: 'Ekspo Agropreneur Belia Gua Musang & Jeli',
    date: '8 - 9 Mei 2026',
    time: '8:30 AM - 6:00 PM',
    venue: 'Dewan Sivik Gua Musang',
    organizer: 'Fakulti Agro Sains UMK Jeli & KESEDAR',
    highlights: 'Pameran dron pertanian, jualan anak benih madu kelulut & teknologi baja moden',
    registrationStatus: 'Kemasukan Percuma'
  }
];

export const YouthEventsCalendarModal: React.FC<YouthEventsCalendarModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 scale-100 transition-all max-h-[92vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="kbelia-important-header px-6 sm:px-8 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/70 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Kalendar Ekspo & Karnival Usahawan Belia
              </h3>
              <span className="text-[11px] font-semibold text-black dark:text-white/75">
                Peluang Jualan Terbuka Seluruh Jajahan
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {EVENTS.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-blue-400/70 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70">
                    {event.date}
                  </span>
                  <span className="text-[10px] font-semibold text-black dark:text-white/75">
                    {event.registrationStatus}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                  {event.title}
                </h4>
                <p className="text-[11px] text-black/70 dark:text-white/75 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                  {event.venue}
                </p>

                <p className="text-xs text-black dark:text-white leading-relaxed mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold block text-black dark:text-white mb-0.5">Pengisian Utama:</span>
                  {event.highlights}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs gap-3">
                <span className="text-[11px] text-black/70 dark:text-white/75">
                  Anjuran: {event.organizer}
                </span>

                <button
                  type="button"
                  onClick={() => showToast({
                    type: 'info',
                    title: 'Permohonan Tapak Ekspo',
                    message: `Pendaftaran tapak bagi ${event.title} dibuka melalui urus setia UMK.`
                  })}
                  className="py-1.5 px-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shrink-0 dark:bg-blue-600"
                >
                  Mohon Tapak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
