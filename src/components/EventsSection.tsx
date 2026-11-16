import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Store, 
  Check, 
  MessageCircle, 
  XCircle, 
  AlertTriangle
} from 'lucide-react';
import { YouthEvent } from '../types';
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
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, sortRecords } from '../utils/sortUtils';

const MONTH_MAP: Record<string, number> = {
  januari: 0, january: 0, jan: 0,
  februari: 1, february: 1, feb: 1,
  mac: 2, march: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  jun: 5, june: 5,
  julai: 6, july: 6, jul: 6,
  ogos: 7, august: 7, aug: 7,
  september: 8, sept: 8, sep: 8,
  oktober: 9, october: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  disember: 11, december: 11, dis: 11, dec: 11
};

const parseEventEndDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 23, 59, 59, 999);
  }
  const slashMatch = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]), 23, 59, 59, 999);
  }
  const lower = trimmed.toLowerCase();
  const textMatch = lower.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})(?!.*\d{4})/);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const month = MONTH_MAP[textMatch[2]];
    const year = Number(textMatch[3]);
    if (month !== undefined && !Number.isNaN(day) && !Number.isNaN(year)) {
      return new Date(year, month, day, 23, 59, 59, 999);
    }
  }
  return null;
};

const isEventEnded = (dateStr?: string): boolean => {
  const endDate = parseEventEndDate(dateStr);
  if (!endDate) return false;
  return endDate.getTime() < Date.now();
};

export const EventsSection: React.FC = () => {
  const { language } = useLanguage();
  const { user, userProfile, isAdmin, openLoginModal } = useAuth();
  const isEn = language === 'en';

  const [events, setEvents] = useState<YouthEvent[]>(INITIAL_YOUTH_EVENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'full' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
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

  const handleBookBooth = async (evt: YouthEvent) => {
    const ended = isEventEnded(evt.date);
    const alreadyBooked = bookedEvents.includes(evt.id);
    const remaining = Math.max(0, evt.boothsAvailable - (alreadyBooked ? 1 : 0));

    if (ended) {
      showToast(
        isEn ? 'This event has already ended and bookings are closed.' : 'Acara ini telah selesai dan tempahan slot telah ditutup.',
        'warning'
      );
      return;
    }
    if (remaining <= 0 && !alreadyBooked) {
      showToast(
        isEn ? 'All stall slots for this event are currently full.' : 'Semua slot gerai bagi acara ini telah penuh.',
        'warning'
      );
      return;
    }
    if (!user?.uid) {
      openLoginModal();
      return;
    }
    if (alreadyBooked) {
      showToast(isEn ? 'You have already registered for this event!' : 'Anda telah pun berdaftar untuk acara ini!');
      return;
    }
    setBookedEvents(prev => [...prev, evt.id]);
    try {
      await saveEventBookingRecord(
        evt.id,
        evt.title,
        user.uid,
        userProfile?.fullName || user.displayName || 'Usahawan Belia',
        'booked'
      );
      showToast(isEn ? `Successfully registered for: ${evt.title}` : `Pendaftaran slot gerai bagi: ${evt.title} berjaya!`);
    } catch {
      setBookedEvents(prev => prev.filter(id => id !== evt.id));
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

  const sortOptions = buildStandardSortOptions(
    [
      { value: 'event_date_asc', label: isEn ? 'Event Date (Nearest)' : 'Tarikh Acara (Terdekat)' },
      { value: 'booths_desc', label: isEn ? 'Open Booths (Most)' : 'Tapak Kosong (Terbanyak)' }
    ],
    isEn,
    {
      asc: isEn ? 'Event Title (A - Z)' : 'Tajuk Acara (A - Z)',
      desc: isEn ? 'Event Title (Z - A)' : 'Tajuk Acara (Z - A)'
    }
  );

  const filteredEvents = sortRecords(
    events.filter((evt) => {
      const isBooked = bookedEvents.includes(evt.id);
      const remaining = Math.max(0, evt.boothsAvailable - (isBooked ? 1 : 0));
      const ended = isEventEnded(evt.date);
      const full = !ended && remaining <= 0;

      const matchCat = selectedCategory === 'all' || evt.category === selectedCategory;
      const matchDist = selectedDistrict === 'all' || evt.district === selectedDistrict;
      const matchAvailability =
        availabilityFilter === 'all'
          ? true
          : availabilityFilter === 'ended'
          ? ended
          : availabilityFilter === 'full'
          ? full
          : !ended && remaining > 0;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        evt.organizer.toLowerCase().includes(q) ||
        evt.district.toLowerCase().includes(q);
      return matchCat && matchDist && matchAvailability && matchSearch;
    }),
    {
      sortBy,
      getName: (evt) => evt.title || '',
      customCompare: (a, b, mode) => {
        if (mode === 'event_date_asc') {
          const da = parseEventEndDate(a.date)?.getTime() || Number.MAX_SAFE_INTEGER;
          const db = parseEventEndDate(b.date)?.getTime() || Number.MAX_SAFE_INTEGER;
          return da - db;
        }
        if (mode === 'booths_desc') {
          const remA = isEventEnded(a.date) ? -1 : Math.max(0, a.boothsAvailable - (bookedEvents.includes(a.id) ? 1 : 0));
          const remB = isEventEnded(b.date) ? -1 : Math.max(0, b.boothsAvailable - (bookedEvents.includes(b.id) ? 1 : 0));
          return remB - remA;
        }
        return null;
      }
    }
  );

  const pagination = usePagination(filteredEvents, 7, [
    searchQuery,
    selectedCategory,
    selectedDistrict,
    availabilityFilter,
    sortBy,
    filteredEvents.length
  ]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedDistrict !== 'all' ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

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
          <span className="text-lg font-black text-black dark:text-white tabular-nums">
            {events.reduce((sum, e) => sum + (isEventEnded(e.date) ? 0 : Math.max(0, e.boothsAvailable - (bookedEvents.includes(e.id) ? 1 : 0))), 0)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">{isEn ? 'Matching Results' : 'Dipaparkan'}</span>
          <span className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{filteredEvents.length}</span>
        </div>
      </div>

      {/* Acara & Karnival: Carian, Penapis Bersepadu, Senarai Baris & Halaman Bernombor */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={isEn ? 'Search event title, location or organizer...' : 'Cari tajuk acara, lokasi atau penganjur...'}
          filterCount={activeFilterCount}
          onResetFilters={() => {
            setSelectedCategory('all');
            setSelectedDistrict('all');
            setAvailabilityFilter('all');
            setSortBy(DEFAULT_SORT_VALUE);
          }}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortLabel={isEn ? 'Sort By' : 'Susun Mengikut'}
          filterContent={
            <>
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'Category' : 'Kategori Acara'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">{isEn ? 'All Event Types' : 'Semua Kategori'}</option>
                  <option value="karnival">{isEn ? 'Carnivals & Expos' : 'Karnival Jualan'}</option>
                  <option value="bengkel">{isEn ? 'Workshops & Training' : 'Bengkel Pensijilan'}</option>
                  <option value="pitching">{isEn ? 'Pitching & Demo Day' : 'Pitching Pelabur'}</option>
                  <option value="expo">{isEn ? 'Pop-up Flea Market' : 'Pasar Lambak & Kraf'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'District' : 'Daerah'}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
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

              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'Availability Status' : 'Status Ketersediaan'}
                </label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'available' | 'full' | 'ended')}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">{isEn ? 'All Statuses' : 'Semua Status'}</option>
                  <option value="available">{isEn ? 'Available to Book' : 'Tersedia Ditempah'}</option>
                  <option value="full">{isEn ? 'Slots Full' : 'Slot Penuh'}</option>
                  <option value="ended">{isEn ? 'Ended' : 'Telah Selesai'}</option>
                </select>
              </div>
            </>
          }
        />

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Calendar className="w-10 h-10 text-black/35 dark:text-white/35 mx-auto mb-3" />
            <p className="text-sm font-bold text-black dark:text-white">
              {isEn ? 'No events match your filter' : 'Tiada acara sepadan ditemui'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
              {pagination.paginatedItems.map((evt) => {
                const isBooked = bookedEvents.includes(evt.id);
                const remainingBooths = Math.max(0, evt.boothsAvailable - (isBooked ? 1 : 0));
                const ended = isEventEnded(evt.date);
                const full = !ended && !isBooked && remainingBooths <= 0;
                const bookingBlocked = isBooked || ended || full;

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0">
                        <PortalImage
                          src={resolveEventImage(evt.category, evt.imageUrl)}
                          alt={evt.title}
                          fallbackType="event"
                          fallbackLabel={evt.category}
                          className={`w-full h-full object-cover ${ended ? 'grayscale opacity-75' : ''}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                            {evt.title}
                          </h3>
                          {ended ? (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 bg-slate-100 text-black/75 border-slate-300 dark:bg-zinc-800 dark:text-white/80 dark:border-zinc-600">
                              {isEn ? 'Ended' : 'Telah Selesai'}
                            </span>
                          ) : full ? (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800">
                              {isEn ? 'Slots Full' : 'Slot Penuh'}
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 ${
                                isBooked
                                  ? 'bg-emerald-50 text-black border-emerald-300 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-700'
                                  : 'bg-amber-50 text-black border-amber-200 dark:bg-amber-950/60 dark:text-white dark:border-amber-800/70'
                              }`}
                            >
                              {isBooked ? (isEn ? 'Booked' : 'Berdaftar') : evt.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                          {evt.date} · {evt.location} ({evt.district}) · {remainingBooths}/{evt.totalBooths} tapak · {evt.fee}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => !bookingBlocked && handleBookBooth(evt)}
                        disabled={bookingBlocked}
                        className={`py-2 px-3.5 text-sm font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 ${
                          isBooked
                            ? 'bg-emerald-50 text-black border border-emerald-300 dark:bg-emerald-950/40 dark:text-white dark:border-emerald-800 cursor-default'
                            : ended
                            ? 'bg-slate-100 text-black/60 border border-slate-200 dark:bg-zinc-800 dark:text-white/60 dark:border-zinc-700 cursor-not-allowed'
                            : full
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                        }`}
                      >
                        {isBooked ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Booked' : 'Ditempah'}</span>
                          </>
                        ) : ended ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Event Ended' : 'Telah Selesai'}</span>
                          </>
                        ) : full ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Slots Full' : 'Slot Penuh'}</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Book Stall' : 'Tempah Slot Gerai'}</span>
                          </>
                        )}
                      </button>

                      {isBooked && !ended && (
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
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-black dark:text-white border border-slate-200 dark:border-zinc-700 transition-colors shrink-0"
                        title="WhatsApp Penganjur"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationBar
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel={isEn ? 'events' : 'acara'}
              accent="blue"
            />
          </>
        )}
      </div>

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
