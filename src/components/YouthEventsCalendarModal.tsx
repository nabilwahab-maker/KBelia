import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  X, 
  MapPin, 
  Check
} from 'lucide-react';
import { showToast } from './ToastNotification';

interface YouthEventsCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EVENTS = [
  {
    id: 'cal-1',
    title: 'Karnival Keusahawanan Belia Mega Kelantan',
    date: '18 - 20 Disember 2026',
    time: '9:00 AM - 11:00 PM',
    venue: 'Dataran Stadium Sultan Muhammad IV, Kota Bharu',
    organizer: 'Kerajaan Negeri Kelantan & Universiti Malaysia Kelantan',
    highlights: '100+ Kiosk Usahawan Muda, Klinik Pembiayaan TEKUN & Pitching Geran Tunai',
    registrationStatus: 'Buka untuk Peniaga Kiosk'
  },
  {
    id: 'cal-2',
    title: 'Festival Seni Batik, Kraf & Songket Tradisi Pantai Timur',
    date: '15 - 17 Januari 2027',
    time: '10:00 AM - 10:00 PM',
    venue: 'Pusat Kraftangan Pantai Cahaya Bulan (PCB), Kota Bharu',
    organizer: 'Perbadanan Kemajuan Iktisad Negeri Kelantan (PKINK)',
    highlights: 'Pameran fesyen belia, bengkel canting batik percuma & jualan langsung',
    registrationStatus: 'Tinggal 8 Tapak'
  },
  {
    id: 'cal-3',
    title: 'Ekspo Agropreneur Belia Gua Musang & Jeli',
    date: '12 - 13 Februari 2027',
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
  const [bookedEvents, setBookedEvents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_booked_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const syncBooked = () => {
      try {
        const saved = localStorage.getItem('kbelia_booked_events');
        setBookedEvents(saved ? JSON.parse(saved) : []);
      } catch {
        // ignore
      }
    };
    syncBooked();
    window.addEventListener('kbelia_booked_events_updated', syncBooked);
    return () => window.removeEventListener('kbelia_booked_events_updated', syncBooked);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleEventBooking = (eventId: string, eventTitle: string) => {
    const isBooked = bookedEvents.includes(eventId);
    const updated = isBooked
      ? bookedEvents.filter(id => id !== eventId)
      : [...bookedEvents, eventId];
    setBookedEvents(updated);
    try {
      localStorage.setItem('kbelia_booked_events', JSON.stringify(updated));
      window.dispatchEvent(new Event('kbelia_booked_events_updated'));
    } catch {
      // ignore
    }
    showToast({
      type: isBooked ? 'info' : 'success',
      title: isBooked ? 'Permohonan Tapak Dibatalkan' : 'Permohonan Tapak Direkodkan',
      message: isBooked
        ? `Penyertaan tapak bagi ${eventTitle} telah dibatalkan.`
        : `Pendaftaran tapak bagi ${eventTitle} berjaya direkodkan.`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-600 scale-100 transition-all max-h-[92vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="kbelia-important-header px-6 sm:px-8 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/70 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Kalendar Ekspo & Karnival Usahawan Belia
              </h3>
              <span className="text-[0.8125rem] font-semibold text-black dark:text-white/75">
                Peluang Jualan Terbuka Seluruh Jajahan
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {EVENTS.map((event) => {
            const isBooked = bookedEvents.includes(event.id);
            return (
              <div
                key={event.id}
                className="p-4 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400/70 dark:hover:border-slate-500 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[0.8125rem] font-bold bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70">
                      {event.date}
                    </span>
                    <span className="text-[0.8125rem] font-semibold text-black dark:text-white/75">
                      {isBooked ? 'Berdaftar' : event.registrationStatus}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                    {event.title}
                  </h4>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75 flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75 shrink-0" />
                    {event.venue}
                  </p>

                  <p className="text-[0.9375rem] text-black dark:text-white leading-relaxed mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600">
                    <span className="font-semibold block text-black dark:text-white mb-0.5">Pengisian Utama:</span>
                    {event.highlights}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between text-sm gap-3">
                  <span className="text-[0.8125rem] text-black/70 dark:text-white/75">
                    Anjuran: {event.organizer}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleEventBooking(event.id, event.title)}
                    className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isBooked
                        ? 'bg-emerald-50 text-black border border-emerald-300 dark:bg-emerald-950/50 dark:text-white dark:border-emerald-700'
                        : 'text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600'
                    }`}
                  >
                    {isBooked && <Check className="w-3.5 h-3.5" />}
                    <span>{isBooked ? 'Ditempah (Batal)' : 'Mohon Tapak'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
