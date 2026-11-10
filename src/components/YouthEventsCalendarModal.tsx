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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-300/60 dark:border-amber-500/30 scale-100 transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300/40 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kalendar Ekspo & Karnival Usahawan Belia
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Peluang Jualan Terbuka Seluruh Jajahan
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {EVENTS.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    {event.date}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {event.registrationStatus}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {event.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {event.venue}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold block text-slate-800 dark:text-slate-200 mb-0.5">Pengisian Utama:</span>
                  {event.highlights}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Anjuran: {event.organizer}
                </span>

                <button
                  type="button"
                  onClick={() => alert(`Pendaftaran tapak bagi ${event.title} dibuka melalui urus setia UMK.`)}
                  className="py-1 px-3 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
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
