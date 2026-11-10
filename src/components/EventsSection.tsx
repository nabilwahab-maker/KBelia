import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Store, 
  Share2, 
  Check, 
  Sparkles, 
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  MessageCircle,
  Tag,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { KelantanDistrict } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from './ToastNotification';

interface YouthEvent {
  id: string;
  title: string;
  category: 'karnival' | 'bengkel' | 'pitching' | 'expo';
  date: string;
  time: string;
  district: KelantanDistrict;
  location: string;
  organizer: string;
  boothsAvailable: number;
  totalBooths: number;
  fee: string;
  description: string;
  whatsappContact: string;
}

const SAMPLE_EVENTS: YouthEvent[] = [
  {
    id: 'evt-1',
    title: 'Karnival Niaga Belia Kelantan 2026 (Zon Timur)',
    category: 'karnival',
    date: '15 - 17 Mei 2026',
    time: '10.00 PG - 11.00 MLM',
    district: 'Kota Bharu',
    location: 'Dataran Muhammadi & Perkarangan Stadium Sultan Muhammad IV',
    organizer: 'Urusetia Belia & Sukan Negeri Kelantan',
    boothsAvailable: 8,
    totalBooths: 40,
    fee: 'Percuma (Tajaan Penuh Urusetia)',
    description: 'Peluang jualan mega terbuka untuk 40 usahawan makanan tradisi, batik kontemporari, dan kraf belia dengan sasaran 20,000 pengunjung.',
    whatsappContact: '601120508890'
  },
  {
    id: 'evt-2',
    title: 'Bengkel Pensijilan Halal & Digital Taweez Makanan',
    category: 'bengkel',
    date: '28 Mei 2026',
    time: '9.00 PG - 4.30 PTG',
    district: 'Bachok',
    location: 'Dewan Keusahawanan Kampus UMK Bachok',
    organizer: 'Institut Penyelidikan & Pengurusan Halal (IHRAM) UMK',
    boothsAvailable: 15,
    totalBooths: 60,
    fee: 'RM30 (Sijil & Modul)',
    description: 'Panduan langkah demi langkah memohon sijil Halal JAKIM untuk premis makanan, kiosk kapsul, dan produk bungkusan sejuk beku.',
    whatsappContact: '60199887766'
  },
  {
    id: 'evt-3',
    title: 'Hari Terbuka Pemadanan Pelabur & Demo Day Belia',
    category: 'pitching',
    date: '10 Jun 2026',
    time: '9.30 PG - 1.00 PTG',
    district: 'Kota Bharu',
    location: 'Auditorium Hab Digital KB Cyber, Kota Bharu',
    organizer: 'Pusat Keusahawanan Universiti Malaysia Kelantan (UMK)',
    boothsAvailable: 4,
    totalBooths: 12,
    fee: 'Percuma (Atas Jemputan)',
    description: 'Sesi perbentangan 5-minit pitch di hadapan panel dana benih MARA, TEKUN, dan angel investor untuk pembiayaan sehingga RM50,000.',
    whatsappContact: '60133445566'
  },
  {
    id: 'evt-4',
    title: 'Pasar Lambak Kraftangan & Batik Mahasiswa',
    category: 'expo',
    date: '20 - 21 Jun 2026',
    time: '4.00 PTG - 11.00 MLM',
    district: 'Tumpat',
    location: 'Perkarangan Pantai Sri Tujuh, Tumpat',
    organizer: 'Kelab Usahawan Muda Tumpat',
    boothsAvailable: 12,
    totalBooths: 25,
    fee: 'RM20 / Hari',
    description: 'Pameran santai jualan produk tekstil batik, aksesori buatan tangan, dan kopi hipster sempena cuti persekolahan.',
    whatsappContact: '60178899001'
  }
];

export const EventsSection: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookedEvents, setBookedEvents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kbelia_booked_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return ['evt-1'];
  });
  const [eventToCancel, setEventToCancel] = useState<YouthEvent | null>(null);

  const handleBookBooth = (eventId: string, eventTitle: string) => {
    if (bookedEvents.includes(eventId)) {
      showToast(isEn ? 'You have already registered for this event!' : 'Anda telah pun berdaftar untuk acara ini!');
      return;
    }
    const updated = [...bookedEvents, eventId];
    setBookedEvents(updated);
    try {
      localStorage.setItem('kbelia_booked_events', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    showToast(isEn ? `Successfully registered for: ${eventTitle}` : `Pendaftaran slot gerai bagi: ${eventTitle} berjaya!`);
  };

  const handleCancelBooking = (eventId: string, eventTitle: string) => {
    const updated = bookedEvents.filter(id => id !== eventId);
    setBookedEvents(updated);
    try {
      localStorage.setItem('kbelia_booked_events', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    showToast(isEn ? `Registration cancelled for: ${eventTitle}` : `Pendaftaran untuk ${eventTitle} telah dibatalkan.`);
    setEventToCancel(null);
  };

  const filteredEvents = SAMPLE_EVENTS.filter((evt) => {
    const matchCat = selectedCategory === 'all' || evt.category === selectedCategory;
    const matchDist = selectedDistrict === 'all' || evt.district === selectedDistrict;
    const matchSearch = !searchQuery || 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchDist && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-800 via-red-900 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold mb-3 border border-white/10">
            <Calendar className="w-3.5 h-3.5" />
            <span>{isEn ? 'Official Events & Expos' : 'Kalendar Karnival & Acara Rasmi'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isEn ? 'Youth Business Events & Carnivals' : 'Jadual Acara & Karnival Belia Kelantan'}
          </h1>
          <p className="text-xs sm:text-sm text-red-100/90 mt-2 leading-relaxed">
            {isEn
              ? 'Book popup stalls, attend halal certification workshops, and meet investors across 10 Kelantan districts.'
              : 'Tempah tapak jualan gerai karnival, sertai bengkel pensijilan halal, dan temui rakan niaga di seluruh 10 jajahan.'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#24303F] rounded-2xl p-4 border border-slate-200 dark:border-[#2E3A47] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={isEn ? 'Search event, venue, organizer...' : 'Cari acara, lokasi, penganjur...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">{isEn ? 'All Event Types' : 'Semua Kategori'}</option>
            <option value="karnival">{isEn ? 'Carnivals & Expos' : 'Karnival Jualan'}</option>
            <option value="bengkel">{isEn ? 'Workshops & Training' : 'Bengkel Pensijilan'}</option>
            <option value="pitching">{isEn ? 'Pitching & Demo Day' : 'Pitching Pelabur'}</option>
            <option value="expo">{isEn ? 'Pop-up Flea Market' : 'Pasar Lambak & Kraf'}</option>
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">{isEn ? 'All 10 Districts' : 'Semua Jajahan'}</option>
            <option value="Kota Bharu">Kota Bharu</option>
            <option value="Bachok">Bachok</option>
            <option value="Pasir Mas">Pasir Mas</option>
            <option value="Tumpat">Tumpat</option>
            <option value="Tanah Merah">Tanah Merah</option>
            <option value="Machang">Machang</option>
            <option value="Pasir Puteh">Pasir Puteh</option>
            <option value="Kuala Krai">Kuala Krai</option>
            <option value="Gua Musang">Gua Musang</option>
            <option value="Jeli">Jeli</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((evt) => {
          const isBooked = bookedEvents.includes(evt.id);

          return (
            <div
              key={evt.id}
              className="bg-white dark:bg-[#24303F] rounded-3xl p-5 border border-slate-200 dark:border-[#2E3A47] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                    {evt.category}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {evt.fee}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {evt.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {isEn ? 'Organized by:' : 'Anjuran:'} {evt.organizer}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {evt.description}
                </p>

                <div className="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-red-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{evt.date}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>{evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{evt.location} ({evt.district})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-red-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {evt.boothsAvailable} {isEn ? 'stalls available left' : 'tapak niaga masih kosong'} ({isEn ? 'out of' : 'daripada'} {evt.totalBooths})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#2E3A47] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => !isBooked && handleBookBooth(evt.id, evt.title)}
                  disabled={isBooked}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                    isBooked
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs cursor-default'
                      : 'bg-red-700 hover:bg-red-800 text-white shadow-xs cursor-pointer'
                  }`}
                >
                  {isBooked ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEn ? 'Booked & Registered' : 'Slot Ditempah (Berdaftar)'}</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Book Stall / RSVP' : 'Tempah Slot Gerai'}</span>
                    </>
                  )}
                </button>

                {/* Butang Batal di sebelah Booked and Register */}
                {isBooked && (
                  <button
                    type="button"
                    onClick={() => setEventToCancel(evt)}
                    className="py-2 px-3 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    title={isEn ? "Cancel event registration" : "Batal pendaftaran acara ini"}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{isEn ? 'Cancel' : 'Batal'}</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/${evt.whatsappContact}?text=Salam%20Urusetia,%20saya%20berminat%20dengan%20${encodeURIComponent(evt.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A222C] dark:hover:bg-[#2E3A47] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2E3A47] transition-colors"
                  title="WhatsApp Urusetia"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Cancelling Event Registration */}
      {eventToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEn ? 'Cancel Registration Confirmation' : 'Pengesahan Batal Pendaftaran'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isEn
                    ? `Are you sure you want to cancel your registration for "${eventToCancel.title}"? Your booth reservation will be released to other youth entrepreneurs.`
                    : `Adakah anda pasti mahu membatalkan pendaftaran acara bagi "${eventToCancel.title}"? Slot ini akan dilepaskan semula untuk usahawan belia lain.`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Event:' : 'Acara:'}</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{eventToCancel.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Date:' : 'Tarikh:'}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{eventToCancel.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Location:' : 'Lokasi:'}</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{eventToCancel.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToCancel(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {isEn ? 'Keep Registration' : 'Kekalkan Pendaftaran'}
              </button>
              <button
                type="button"
                onClick={() => handleCancelBooking(eventToCancel.id, eventToCancel.title)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isEn ? 'Yes, Cancel Registration' : 'Ya, Batalkan Pendaftaran'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
