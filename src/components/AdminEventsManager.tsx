import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  Users
} from 'lucide-react';
import { EventBooking, KelantanDistrict, YouthEvent } from '../types';
import {
  subscribeYouthEvents,
  saveYouthEventRecord,
  deleteYouthEventRecord,
  subscribeEventBookings,
  saveEventBookingRecord,
  deleteEventBookingRecord
} from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { showToast } from './ToastNotification';
import { PortalImage } from './PortalImage';
import { resolveEventImage } from '../utils/visualAssets';
import { ImageDropzone } from './ImageDropzone';

const DISTRICTS: KelantanDistrict[] = [
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

interface AdminEventsManagerProps {
  onRefresh?: () => void;
}

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({ onRefresh }) => {
  const { user, isAdmin } = useAuth();
  const { confirmDelete } = useConfirmDelete();

  const [subView, setSubView] = useState<'catalog' | 'bookings'>('catalog');
  const [events, setEvents] = useState<YouthEvent[]>([]);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<YouthEvent | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<YouthEvent['category']>('karnival');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('9.00 PG - 5.00 PTG');
  const [district, setDistrict] = useState<KelantanDistrict>('Kota Bharu');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('Unit Keusahawanan Belia Kelantan');
  const [fee, setFee] = useState('Percuma');
  const [boothsAvailable, setBoothsAvailable] = useState('20');
  const [totalBooths, setTotalBooths] = useState('40');
  const [whatsappContact, setWhatsappContact] = useState('601120508890');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubEvents = subscribeYouthEvents(setEvents);
    const unsubBookings = subscribeEventBookings(user?.uid, isAdmin, setEventBookings);
    return () => {
      unsubEvents();
      unsubBookings();
    };
  }, [user?.uid, isAdmin]);

  const openCreateEvent = () => {
    setEditingEvent(null);
    setTitle('');
    setCategory('karnival');
    setDate('25 Disember 2026');
    setTime('9.00 PG - 6.00 PTG');
    setDistrict('Kota Bharu');
    setLocation('Dataran Muhammadi, Kota Bharu');
    setOrganizer('Unit Belia & Keusahawanan Kelantan');
    setFee('Percuma');
    setBoothsAvailable('25');
    setTotalBooths('40');
    setWhatsappContact('601120508890');
    setDescription('');
    setImageUrl('');
    setShowEventModal(true);
  };

  const openEditEvent = (evt: YouthEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setCategory(evt.category);
    setDate(evt.date);
    setTime(evt.time);
    setDistrict(evt.district);
    setLocation(evt.location);
    setOrganizer(evt.organizer);
    setFee(evt.fee);
    setBoothsAvailable(String(evt.boothsAvailable));
    setTotalBooths(String(evt.totalBooths));
    setWhatsappContact(evt.whatsappContact || '601120508890');
    setDescription(evt.description);
    setImageUrl(evt.imageUrl || '');
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await saveYouthEventRecord({
        ...(editingEvent || {}),
        id: editingEvent?.id,
        title: title.trim(),
        category,
        date: date.trim(),
        time: time.trim(),
        district,
        location: location.trim(),
        organizer: organizer.trim(),
        fee: fee.trim(),
        boothsAvailable: Math.max(0, Number(boothsAvailable) || 0),
        totalBooths: Math.max(1, Number(totalBooths) || 20),
        whatsappContact: whatsappContact.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined
      });
      showToast(editingEvent ? 'Acara berjaya dikemas kini!' : 'Acara belia baharu diterbitkan!', 'success');
      setShowEventModal(false);
      setEditingEvent(null);
      onRefresh?.();
    } catch {
      showToast('Gagal menyimpan rekod acara.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (evt: YouthEvent) => {
    try {
      await deleteYouthEventRecord(evt.id);
      showToast(`Acara "${evt.title}" berjaya dipadam.`, 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam acara.', 'error');
    }
  };

  const handleBookingStatusChange = async (booking: EventBooking, nextStatus: 'booked' | 'cancelled') => {
    try {
      await saveEventBookingRecord(
        booking.eventId,
        booking.eventTitle,
        booking.userId,
        booking.userName || 'Usahawan Belia',
        nextStatus
      );
      showToast(`Status tempahan ${booking.eventTitle} dikemas kini.`, 'success');
      onRefresh?.();
    } catch {
      showToast('Gagal mengemaskini status tempahan acara.', 'error');
    }
  };

  const handleDeleteBooking = async (booking: EventBooking) => {
    try {
      await deleteEventBookingRecord(booking.id);
      showToast('Rekod tempahan acara telah dipadam.', 'info');
      onRefresh?.();
    } catch {
      showToast('Gagal memadam rekod tempahan.', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="kbelia-important-header p-5 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70 text-[0.8125rem] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Pengurusan Acara &amp; Karnival</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">
            Acara Usahawan Belia &amp; Tempahan Tapak
          </h3>
          <p className="text-[0.9375rem] text-black/75 dark:text-white/80 max-w-2xl">
            Terbitkan karnival, sunting lokasi atau kuota tapak, serta semak pendaftaran penyertaan peserta.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateEvent}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Acara Baharu</span>
        </button>
      </div>

      {/* Sub-navigation switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubView('catalog')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer inline-flex items-center gap-2 ${
            subView === 'catalog'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Senarai Acara ({events.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubView('bookings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer inline-flex items-center gap-2 ${
            subView === 'bookings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tempahan Peserta ({eventBookings.length})</span>
        </button>
      </div>

      {subView === 'catalog' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs flex flex-col divide-y divide-slate-200 dark:divide-slate-700 h-fit">
          {events.length === 0 ? (
            <div className="p-10 text-center text-sm text-black/70 dark:text-white/75">
              Tiada acara usahawan belia direkodkan.
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0">
                    <PortalImage
                      src={resolveEventImage(evt.category, evt.imageUrl)}
                      alt={evt.title}
                      fallbackType="event"
                      fallbackLabel={evt.category}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                        {evt.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[0.75rem] font-bold uppercase shrink-0 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-black dark:text-white">
                        {evt.category}
                      </span>
                    </div>
                    <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5 tabular-nums">
                      {evt.date} · {evt.location} ({evt.district}) · {evt.boothsAvailable}/{evt.totalBooths} tapak · {evt.fee}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditEvent(evt)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirmDelete({
                        itemName: evt.title,
                        itemType: 'Acara Belia',
                        onConfirm: () => handleDeleteEvent(evt)
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Padam</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs flex flex-col divide-y divide-slate-200 dark:divide-slate-700 h-fit">
          {eventBookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-black/70 dark:text-white/75">
              Belum ada rekod tempahan tapak acara diterima.
            </div>
          ) : (
            eventBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-black dark:text-white truncate">
                        {b.userName || 'Usahawan Belia'}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[0.75rem] font-bold shrink-0 border ${
                          b.status === 'booked'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-black dark:text-white'
                            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-black dark:text-white'
                        }`}
                      >
                        {b.status === 'booked' ? 'Ditempah' : 'Dibatalkan'}
                      </span>
                    </div>
                    <p className="text-sm text-black/70 dark:text-white/75 truncate mt-0.5">
                      {b.eventTitle} · ID: {b.userId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <select
                    aria-label={`Tukar status tempahan ${b.eventTitle}`}
                    value={b.status}
                    onChange={(e) => handleBookingStatusChange(b, e.target.value as 'booked' | 'cancelled')}
                    className="px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer"
                  >
                    <option value="booked">Ditempah (Aktif)</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      confirmDelete({
                        itemName: `${b.userName || 'Peserta'} — ${b.eventTitle}`,
                        itemType: 'Tempahan Tapak Acara',
                        onConfirm: () => handleDeleteBooking(b)
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-black dark:text-white text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Padam</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit Youth Event Modal */}
      {showEventModal && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => !isSaving && setShowEventModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">
                    {editingEvent ? 'Edit Maklumat Acara Belia' : 'Tambah Acara Belia Baharu'}
                  </h3>
                  <p className="text-[0.875rem] text-black/70 dark:text-white/75">
                    Perubahan disegerakkan secara langsung kepada semua usahawan belia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setShowEventModal(false)}
                className="p-2 rounded-xl text-black/70 dark:text-white/75 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tajuk Acara *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Karnival Usahawan Belia Kelantan"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as YouthEvent['category'])}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer"
                  >
                    <option value="karnival">Karnival Jualan</option>
                    <option value="bengkel">Bengkel Pensijilan</option>
                    <option value="pitching">Pitching &amp; Demo Day</option>
                    <option value="expo">Ekspo &amp; Kraf</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Daerah</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as KelantanDistrict)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white cursor-pointer"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tarikh</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Masa</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Penganjur</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Yuran / Tajaan</label>
                  <input
                    type="text"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tapak Kosong</label>
                  <input
                    type="number"
                    min="0"
                    value={boothsAvailable}
                    onChange={(e) => setBoothsAvailable(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Jumlah Tapak</label>
                  <input
                    type="number"
                    min="1"
                    value={totalBooths}
                    onChange={(e) => setTotalBooths(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">No. WhatsApp Penganjur</label>
                  <input
                    type="text"
                    value={whatsappContact}
                    onChange={(e) => setWhatsappContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Keterangan Acara</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-black dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageDropzone
                    label="Poster Acara"
                    value={imageUrl}
                    onChange={(val) => setImageUrl(val)}
                    aspectRatio="16:9"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-300 dark:border-slate-600">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowEventModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-black dark:text-white bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : editingEvent ? 'Simpan Perubahan' : 'Terbitkan Acara'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
