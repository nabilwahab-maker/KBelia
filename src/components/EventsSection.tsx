import React, { useState, useEffect } from 'react';
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
import { KelantanDistrict, YouthEvent } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  INITIAL_YOUTH_EVENTS,
  loadLocalEventBookings,
  saveEventBookingRecord,
  subscribeEventBookings,
  subscribeYouthEvents
} from '../services/dataService';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveEventImage } from '../utils/visualAssets';

export const EventsSection: React.FC = () => {
  const { language } = useLanguage();
  const { user, userProfile, isAdmin, openLoginModal } = useAuth();
  const isEn = language === 'en';

  const [events, setEvents] = useState<YouthEvent[]>(INITIAL_YOUTH_EVENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookedEvents, setBookedEvents] = useState<string[]>(() => {
    if (!user?.uid) return [];
    return loadLocalEventBookings(user.uid)
      .filter(b => b.status === 'booked')
      .map(b => b.eventId);
  });
  const [eventToCancel, setEventToCancel] = useState<YouthEvent | null>(null);

  useEffect(() => {
    const unsubEvents = subscribeYouthEvents(setEvents);
    return () => unsubEvents();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setBookedEvents([]);
      return;
    }
    const unsub = subscribeEventBookings(user.uid, isAdmin, (records) => {
      const ids = records
        .filter(b => b.userId === user.uid && b.status === 'booked')
        .map(b => b.eventId);
      setBookedEvents(ids);
    });
    return () => unsub();
  }, [user?.uid, isAdmin]);

  const handleBookBooth = async (eventId: string, eventTitle: string) => {
    if (!user?.uid) {
      openLoginModal();
      return;
    }
    if (bookedEvents.includes(eventId)) {
      showToast(isEn ? 'You have already registered for this event!' : 'Anda telah pun berdaftar untuk acara ini!');
      return;
    }
    setBookedEvents(prev => [...prev, eventId]);
    try {
      await saveEventBookingRecord(
        eventId,
        eventTitle,
        user.uid,
        userProfile?.fullName || user.displayName || 'Usahawan Belia',
        'booked'
      );
      showToast(isEn ? `Successfully registered for: ${eventTitle}` : `Pendaftaran slot gerai bagi: ${eventTitle} berjaya!`);
    } catch {
      showToast(isEn ? 'Failed to register booth. Please try again.' : 'Gagal mendaftar slot gerai. Sila cuba lagi.');
    }
  };

  const handleCancelBooking = async (eventId: string, eventTitle: string) => {
    if (!user?.uid) return;
    setBookedEvents(prev => prev.filter(id => id !== eventId));
    try {
      await saveEventBookingRecord(
        eventId,
        eventTitle,
        user.uid,
        userProfile?.fullName || user.displayName || 'Usahawan Belia',
        'cancelled'
      );
      showToast(isEn ? `Registration cancelled for: ${eventTitle}` : `Pendaftaran untuk ${eventTitle} telah dibatalkan.`);
    } catch {
      showToast(isEn ? 'Failed to cancel registration.' : 'Gagal membatalkan pendaftaran acara.');
    } finally {
      setEventToCancel(null);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchCat = selectedCategory === 'all' || evt.category === selectedCategory;
    const matchDist = selectedDistrict === 'all' || evt.district === selectedDistrict;
    const matchSearch = !searchQuery || 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchDist && matchSearch;
  });

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 p-4 sm:p-5 border border-slate-200 dark:border-zinc-700">
        <div className="max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white">
            {isEn ? 'Youth Events & Carnivals' : 'Acara & Karnival Belia Kelantan'}
          </h1>
          <p className="text-[0.9375rem] text-black/75 dark:text-white/75 mt-1 leading-relaxed">
            {isEn
              ? 'Book popup stalls, join halal workshops, and network with partners across the state.'
              : 'Tempah tapak gerai, sertai bengkel pensijilan halal, dan temui rakan niaga seluruh negeri.'}
          </p>
        </div>
      </div>

      {/* Ringkasan Statistik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-fit items-start">
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">{isEn ? 'Total Events' : 'Jumlah Acara'}</span>
          <span className="text-lg font-black text-black dark:text-white tabular-nums">{events.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">{isEn ? 'Your Bookings' : 'Slot Ditempah'}</span>
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{bookedEvents.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">{isEn ? 'Stalls Open' : 'Tapak Kosong'}</span>
          <span className="text-lg font-black text-black dark:text-white tabular-nums">{events.reduce((sum, e) => sum + Math.max(0, e.boothsAvailable - (bookedEvents.includes(e.id) ? 1 : 0)), 0)}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">{isEn ? 'Matching Results' : 'Dipaparkan'}</span>
          <span className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{filteredEvents.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={isEn ? 'Enter search keyword' : 'Masukkan kata kunci carian'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 dark:focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 dark:focus:border-blue-500"
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
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
          >
            <option value="all">{isEn ? 'Across Kelantan' : 'Seluruh Kelantan'}</option>
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

      {/* Senarai Menegak Acara */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 h-fit">
          <Calendar className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-3" />
          <p className="text-sm font-bold text-black dark:text-white">
            {isEn ? 'No events match your filter' : 'Tiada acara sepadan ditemui'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs flex flex-col divide-y divide-slate-200 dark:divide-slate-700 h-fit">
          {filteredEvents.map((evt) => {
            const isBooked = bookedEvents.includes(evt.id);

            return (
              <div
                key={evt.id}
                className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 shrink-0">
                    <PortalImage
                      src={resolveEventImage(evt.category, evt.imageUrl)}
                      alt={evt.title}
                      fallbackType="event"
                      fallbackLabel={evt.category}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                        {evt.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 ${
                          isBooked
                            ? 'bg-emerald-50 text-black border-emerald-300 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-700'
                            : 'bg-amber-50 text-black border-amber-200 dark:bg-amber-950/60 dark:text-white dark:border-amber-800/70'
                        }`}
                      >
                        {isBooked ? (isEn ? 'Booked' : 'Berdaftar') : evt.category}
                      </span>
                    </div>
                    <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                      {evt.date} · {evt.location} ({evt.district}) · {Math.max(0, evt.boothsAvailable - (isBooked ? 1 : 0))}/{evt.totalBooths} tapak · {evt.fee}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => !isBooked && handleBookBooth(evt.id, evt.title)}
                    disabled={isBooked}
                    className={`py-2 px-3.5 text-sm font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 ${
                      isBooked
                        ? 'bg-emerald-50 text-black border border-emerald-300 dark:bg-emerald-950/40 dark:text-white dark:border-emerald-800 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                    }`}
                  >
                    {isBooked ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Booked' : 'Ditempah'}</span>
                      </>
                    ) : (
                      <>
                        <Store className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Book Stall' : 'Tempah Slot Gerai'}</span>
                      </>
                    )}
                  </button>

                  {isBooked && (
                    <button
                      type="button"
                      onClick={() => setEventToCancel(evt)}
                      className="py-2 px-3 text-sm font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-black border border-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-white dark:border-rose-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      title={isEn ? 'Cancel event registration' : 'Batal pendaftaran acara ini'}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Cancel' : 'Batal'}</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${evt.whatsappContact}?text=Salam%20Penganjur,%20saya%20berminat%20dengan%20${encodeURIComponent(evt.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 transition-colors shrink-0"
                    title="WhatsApp Penganjur"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Cancelling Event Registration */}
      {eventToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-300 dark:border-slate-600 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-black dark:text-white/75 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-black dark:text-white">
                  {isEn ? 'Cancel Registration Confirmation' : 'Pengesahan Batal Pendaftaran'}
                </h3>
                <p className="text-[0.9375rem] text-black dark:text-white mt-1 leading-relaxed">
                  {isEn
                    ? `Are you sure you want to cancel your registration for "${eventToCancel.title}"? Your booth reservation will be released to other youth entrepreneurs.`
                    : `Adakah anda pasti mahu membatalkan pendaftaran acara bagi "${eventToCancel.title}"? Slot ini akan dilepaskan semula untuk usahawan belia lain.`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-black/70 dark:text-white/75">{isEn ? 'Event:' : 'Acara:'}</span>
                <span className="font-bold text-black dark:text-white truncate max-w-[200px]">{eventToCancel.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70 dark:text-white/75">{isEn ? 'Date:' : 'Tarikh:'}</span>
                <span className="font-semibold text-black dark:text-white">{eventToCancel.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70 dark:text-white/75">{isEn ? 'Location:' : 'Lokasi:'}</span>
                <span className="text-black dark:text-white truncate max-w-[200px]">{eventToCancel.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToCancel(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-black dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
              >
                {isEn ? 'Keep Registration' : 'Kekalkan Pendaftaran'}
              </button>
              <button
                type="button"
                onClick={() => handleCancelBooking(eventToCancel.id, eventToCancel.title)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
