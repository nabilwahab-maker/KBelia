import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Plus,
  X,
  Save,
  Loader2,
  Users,
  ArrowUpDown
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
import { ReferenceTableToolbar, RowActionMenu } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';

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

  // Search, filter & sort states for catalog and bookings
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'all' | YouthEvent['category']>('all');
  const [catalogDistrictFilter, setCatalogDistrictFilter] = useState<'all' | KelantanDistrict>('all');
  const [catalogSortPreset, setCatalogSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [catalogSortBy, setCatalogSortBy] = useState<'title' | 'category' | 'district' | 'booths'>('title');
  const [catalogSortDir, setCatalogSortDir] = useState<'asc' | 'desc'>('asc');

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'booked' | 'cancelled'>('all');
  const [bookingSortPreset, setBookingSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [bookingSortBy, setBookingSortBy] = useState<'userName' | 'eventTitle' | 'status'>('userName');
  const [bookingSortDir, setBookingSortDir] = useState<'asc' | 'desc'>('asc');

  const catalogSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'booths_desc', label: 'Kuota Kosong (Terbanyak)' },
          { value: 'district_asc', label: 'Daerah (A - Z)' },
          { value: 'category_asc', label: 'Kategori Acara (A - Z)' }
        ],
        false,
        {
          asc: 'Tajuk Acara (A - Z)',
          desc: 'Tajuk Acara (Z - A)'
        }
      ),
    []
  );

  const bookingSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          { value: 'event_asc', label: 'Tajuk Acara (A - Z)' },
          { value: 'status_booked', label: 'Status (Ditempah Dahulu)' }
        ],
        false,
        {
          asc: 'Nama Peserta (A - Z)',
          desc: 'Nama Peserta (Z - A)'
        }
      ),
    []
  );

  useEffect(() => {
    const unsubEvents = subscribeYouthEvents(setEvents);
    const unsubBookings = subscribeEventBookings(user?.uid, isAdmin, setEventBookings);
    return () => {
      unsubEvents();
      unsubBookings();
    };
  }, [user?.uid, isAdmin]);

  const filteredSortedEvents = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    const filtered = events.filter((evt) => {
      if (catalogCategoryFilter !== 'all' && evt.category !== catalogCategoryFilter) return false;
      if (catalogDistrictFilter !== 'all' && evt.district !== catalogDistrictFilter) return false;
      if (!q) return true;
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        evt.district.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q)
      );
    });

    if (catalogSortPreset === 'table_column') {
      return [...filtered].sort((a, b) => {
        let cmp = 0;
        if (catalogSortBy === 'category') cmp = a.category.localeCompare(b.category);
        else if (catalogSortBy === 'district') cmp = a.district.localeCompare(b.district);
        else if (catalogSortBy === 'booths') cmp = a.boothsAvailable - b.boothsAvailable;
        else cmp = a.title.localeCompare(b.title);
        return catalogSortDir === 'asc' ? cmp : -cmp;
      });
    }

    return sortRecords(filtered, {
      sortBy: catalogSortPreset,
      getName: (evt) => evt.title || '',
      customCompare: (a, b, mode) => {
        if (mode === 'booths_desc') return Number(b.boothsAvailable || 0) - Number(a.boothsAvailable || 0);
        if (mode === 'district_asc') return compareText(a.district, b.district);
        if (mode === 'category_asc') return compareText(a.category, b.category);
        return null;
      }
    });
  }, [events, catalogSearch, catalogCategoryFilter, catalogDistrictFilter, catalogSortPreset, catalogSortBy, catalogSortDir]);

  const filteredSortedBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    const filtered = eventBookings.filter((b) => {
      if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
      if (!q) return true;
      return (
        (b.userName || '').toLowerCase().includes(q) ||
        b.eventTitle.toLowerCase().includes(q) ||
        b.userId.toLowerCase().includes(q)
      );
    });

    if (bookingSortPreset === 'table_column') {
      return [...filtered].sort((a, b) => {
        let cmp = 0;
        if (bookingSortBy === 'eventTitle') cmp = a.eventTitle.localeCompare(b.eventTitle);
        else if (bookingSortBy === 'status') cmp = a.status.localeCompare(b.status);
        else cmp = (a.userName || '').localeCompare(b.userName || '');
        return bookingSortDir === 'asc' ? cmp : -cmp;
      });
    }

    return sortRecords(filtered, {
      sortBy: bookingSortPreset,
      getName: (b) => b.userName || b.eventTitle || '',
      customCompare: (a, b, mode) => {
        if (mode === 'event_asc') return compareText(a.eventTitle, b.eventTitle);
        if (mode === 'status_booked') return (a.status === 'booked' ? 0 : 1) - (b.status === 'booked' ? 0 : 1);
        return null;
      }
    });
  }, [eventBookings, bookingSearch, bookingStatusFilter, bookingSortPreset, bookingSortBy, bookingSortDir]);

  const catalogPagination = usePagination(filteredSortedEvents, 7, [
    catalogSearch,
    catalogCategoryFilter,
    catalogDistrictFilter,
    catalogSortPreset,
    catalogSortBy,
    catalogSortDir,
    filteredSortedEvents.length
  ]);

  const bookingsPagination = usePagination(filteredSortedBookings, 7, [
    bookingSearch,
    bookingStatusFilter,
    bookingSortPreset,
    bookingSortBy,
    bookingSortDir,
    filteredSortedBookings.length
  ]);

  const toggleCatalogSort = (col: 'title' | 'category' | 'district' | 'booths') => {
    setCatalogSortPreset('table_column');
    if (catalogSortBy === col) {
      setCatalogSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCatalogSortBy(col);
      setCatalogSortDir('asc');
    }
  };

  const toggleBookingSort = (col: 'userName' | 'eventTitle' | 'status') => {
    setBookingSortPreset('table_column');
    if (bookingSortBy === col) {
      setBookingSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setBookingSortBy(col);
      setBookingSortDir('asc');
    }
  };

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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
          <ReferenceTableToolbar
            searchValue={catalogSearch}
            onSearchChange={setCatalogSearch}
            searchPlaceholder="Cari tajuk acara, lokasi atau daerah..."
            filterCount={
              (catalogCategoryFilter !== 'all' ? 1 : 0) +
              (catalogDistrictFilter !== 'all' ? 1 : 0) +
              (catalogSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
            }
            onResetFilters={() => {
              setCatalogCategoryFilter('all');
              setCatalogDistrictFilter('all');
              setCatalogSortPreset(DEFAULT_SORT_VALUE);
            }}
            sortOptions={
              catalogSortPreset === 'table_column'
                ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...catalogSortOptions]
                : catalogSortOptions
            }
            sortValue={catalogSortPreset === 'table_column' ? '' : catalogSortPreset}
            onSortChange={(val) => {
              if (val) setCatalogSortPreset(val);
            }}
            filterContent={
              <>
                <div>
                  <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                    Kategori Acara
                  </label>
                  <select
                    value={catalogCategoryFilter}
                    onChange={(e) => setCatalogCategoryFilter(e.target.value as 'all' | YouthEvent['category'])}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="karnival">Karnival Jualan</option>
                    <option value="bengkel">Bengkel Pensijilan</option>
                    <option value="pitching">Pitching &amp; Demo Day</option>
                    <option value="expo">Ekspo &amp; Kraf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                    Daerah
                  </label>
                  <select
                    value={catalogDistrictFilter}
                    onChange={(e) => setCatalogDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                  >
                    <option value="all">Semua Daerah</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </>
            }
          />

          {filteredSortedEvents.length === 0 ? (
            <div className="p-10 text-center text-sm text-black/70 dark:text-white/75">
              Tiada acara usahawan belia direkodkan bagi carian atau tapisan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleCatalogSort('title')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Acara &amp; Lokasi</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleCatalogSort('category')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Kategori</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleCatalogSort('district')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Daerah</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleCatalogSort('booths')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Tarikh &amp; Kuota</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      Yuran
                    </th>
                    <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
                  {catalogPagination.paginatedItems.map((evt) => (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 overflow-hidden shrink-0">
                            <PortalImage
                              src={resolveEventImage(evt.category, evt.imageUrl)}
                              alt={evt.title}
                              fallbackType="event"
                              fallbackLabel={evt.category}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-black dark:text-white truncate">
                              {evt.title}
                            </div>
                            <div className="text-xs text-black/65 dark:text-white/65 truncate">
                              {evt.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                          {evt.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap">
                        {evt.district}
                      </td>
                      <td className="py-3.5 px-4 text-black/80 dark:text-white/80 whitespace-nowrap tabular-nums">
                        <div>{evt.date}</div>
                        <div className="text-xs text-black/60 dark:text-white/60">
                          {evt.boothsAvailable}/{evt.totalBooths} tapak
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-black dark:text-white whitespace-nowrap">
                        {evt.fee}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <RowActionMenu
                          ariaLabel={`Tindakan untuk ${evt.title}`}
                          items={[
                            {
                              label: 'Edit Acara',
                              onClick: () => openEditEvent(evt)
                            },
                            {
                              label: 'Padam Acara',
                              onClick: () =>
                                confirmDelete({
                                  itemName: evt.title,
                                  itemType: 'Acara Belia',
                                  onConfirm: () => handleDeleteEvent(evt)
                                }),
                              tone: 'danger',
                              dividerBefore: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredSortedEvents.length > 0 && (
            <PaginationBar
              currentPage={catalogPagination.currentPage}
              totalItems={catalogPagination.totalItems}
              itemsPerPage={7}
              onPageChange={catalogPagination.setCurrentPage}
              itemLabel="acara belia"
              accent="blue"
            />
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-visible shadow-2xs">
          <ReferenceTableToolbar
            searchValue={bookingSearch}
            onSearchChange={setBookingSearch}
            searchPlaceholder="Cari nama peserta, acara atau ID..."
            filterCount={
              (bookingStatusFilter !== 'all' ? 1 : 0) +
              (bookingSortPreset !== DEFAULT_SORT_VALUE ? 1 : 0)
            }
            onResetFilters={() => {
              setBookingStatusFilter('all');
              setBookingSortPreset(DEFAULT_SORT_VALUE);
            }}
            sortOptions={
              bookingSortPreset === 'table_column'
                ? [{ value: '', label: 'Ikut Lajur Jadual' }, ...bookingSortOptions]
                : bookingSortOptions
            }
            sortValue={bookingSortPreset === 'table_column' ? '' : bookingSortPreset}
            onSortChange={(val) => {
              if (val) setBookingSortPreset(val);
            }}
            filterContent={
              <div>
                <label className="block text-xs font-bold text-black/70 dark:text-white/75 mb-1.5">
                  Status Tempahan
                </label>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value as 'all' | 'booked' | 'cancelled')}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="booked">Ditempah (Aktif)</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
            }
          />

          {filteredSortedBookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-black/70 dark:text-white/75">
              Belum ada rekod tempahan tapak acara bagi carian atau tapisan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-700">
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleBookingSort('userName')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Peserta</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleBookingSort('eventTitle')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Acara</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-black/60 dark:text-white/65">
                      <button
                        type="button"
                        onClick={() => toggleBookingSort('status')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 w-14 text-right text-xs font-semibold text-black/60 dark:text-white/65">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 text-sm">
                  {bookingsPagination.paginatedItems.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-black dark:text-white truncate">
                              {b.userName || 'Usahawan Belia'}
                            </div>
                            <div className="text-xs text-black/60 dark:text-white/60 font-mono truncate">
                              ID: {b.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-black/80 dark:text-white/80">
                        {b.eventTitle}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            b.status === 'booked'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                          }`}
                        >
                          {b.status === 'booked' ? 'Ditempah' : 'Dibatalkan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <RowActionMenu
                          ariaLabel={`Tindakan untuk tempahan ${b.userName || b.eventTitle}`}
                          items={[
                            {
                              label: b.status === 'booked' ? 'Tandakan Dibatalkan' : 'Aktifkan Semula (Ditempah)',
                              onClick: () =>
                                handleBookingStatusChange(b, b.status === 'booked' ? 'cancelled' : 'booked'),
                              tone: 'accent'
                            },
                            {
                              label: 'Padam Tempahan',
                              onClick: () =>
                                confirmDelete({
                                  itemName: `${b.userName || 'Peserta'} — ${b.eventTitle}`,
                                  itemType: 'Tempahan Tapak Acara',
                                  onConfirm: () => handleDeleteBooking(b)
                                }),
                              tone: 'danger',
                              dividerBefore: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredSortedBookings.length > 0 && (
            <PaginationBar
              currentPage={bookingsPagination.currentPage}
              totalItems={bookingsPagination.totalItems}
              itemsPerPage={7}
              onPageChange={bookingsPagination.setCurrentPage}
              itemLabel="tempahan peserta"
              accent="blue"
            />
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
