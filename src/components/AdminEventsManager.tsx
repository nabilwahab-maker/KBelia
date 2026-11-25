import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Plus,
  X,
  Save,
  Loader2,
  Users,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock
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
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, compareText, sortRecords } from '../utils/sortUtils';
import { ModernDatePicker, ModernTimePicker } from './ModernDateTimePicker';
import { getRoleTheme } from '../utils/roleTheme';
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

const adminTheme = getRoleTheme('admin');

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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'booked' | 'cancelled'>('all');
  const [bookingSortPreset, setBookingSortPreset] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);

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
  }, [events, catalogSearch, catalogCategoryFilter, catalogDistrictFilter, catalogSortPreset]);

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

    return sortRecords(filtered, {
      sortBy: bookingSortPreset,
      getName: (b) => b.userName || b.eventTitle || '',
      customCompare: (a, b, mode) => {
        if (mode === 'event_asc') return compareText(a.eventTitle, b.eventTitle);
        if (mode === 'status_booked') return (a.status === 'booked' ? 0 : 1) - (b.status === 'booked' ? 0 : 1);
        return null;
      }
    });
  }, [eventBookings, bookingSearch, bookingStatusFilter, bookingSortPreset]);

  const catalogPagination = usePagination(filteredSortedEvents, 7, [
    catalogSearch,
    catalogCategoryFilter,
    catalogDistrictFilter,
    catalogSortPreset,
    filteredSortedEvents.length
  ]);

  const bookingsPagination = usePagination(filteredSortedBookings, 7, [
    bookingSearch,
    bookingStatusFilter,
    bookingSortPreset,
    filteredSortedBookings.length
  ]);

  const categoryCounts = useMemo(
    () => ({
      all: events.length,
      karnival: events.filter((e) => e.category === 'karnival').length,
      bengkel: events.filter((e) => e.category === 'bengkel').length,
      pitching: events.filter((e) => e.category === 'pitching').length,
      expo: events.filter((e) => e.category === 'expo').length
    }),
    [events]
  );

  const bookingCounts = useMemo(
    () => ({
      all: eventBookings.length,
      booked: eventBookings.filter((b) => b.status === 'booked').length,
      cancelled: eventBookings.filter((b) => b.status === 'cancelled').length
    }),
    [eventBookings]
  );

  const selectedEvent = useMemo(
    () =>
      filteredSortedEvents.find((e) => e.id === selectedEventId) ||
      catalogPagination.paginatedItems[0] ||
      filteredSortedEvents[0] ||
      null,
    [filteredSortedEvents, selectedEventId, catalogPagination.paginatedItems]
  );

  const selectedBooking = useMemo(
    () =>
      filteredSortedBookings.find((b) => b.id === selectedBookingId) ||
      bookingsPagination.paginatedItems[0] ||
      filteredSortedBookings[0] ||
      null,
    [filteredSortedBookings, selectedBookingId, bookingsPagination.paginatedItems]
  );

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

  const hasCatalogFilters = Boolean(
    catalogSearch.trim() ||
      catalogCategoryFilter !== 'all' ||
      catalogDistrictFilter !== 'all' ||
      catalogSortPreset !== DEFAULT_SORT_VALUE
  );

  const hasBookingFilters = Boolean(
    bookingSearch.trim() || bookingStatusFilter !== 'all' || bookingSortPreset !== DEFAULT_SORT_VALUE
  );

  return (
    <div className="space-y-4 animate-dashboard-tab">
      {subView === 'catalog' ? (
        <WorkspaceHeaderCard
          role="admin"
          icon={<Calendar className="w-5 h-5" />}
          title="Acara Usahawan Belia & Tempahan Tapak"
          subtitle="Urus senarai acara, karnival, bengkel, serta kuota tapak jualan."
          rightActions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubView('catalog');
                  setMobileCatalogOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.segmentedActiveClass}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Senarai Acara</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubView('bookings');
                  setMobileBookingOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tempahan Peserta</span>
              </button>
              <button
                type="button"
                onClick={openCreateEvent}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${adminTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          }
          tabs={[
            { id: 'all', label: 'Semua', count: categoryCounts.all },
            { id: 'karnival', label: 'Karnival', count: categoryCounts.karnival },
            { id: 'bengkel', label: 'Bengkel', count: categoryCounts.bengkel },
            { id: 'pitching', label: 'Pitching', count: categoryCounts.pitching },
            { id: 'expo', label: 'Ekspo', count: categoryCounts.expo }
          ]}
          activeTab={catalogCategoryFilter}
          onTabChange={(id) => {
            setCatalogCategoryFilter(id as 'all' | YouthEvent['category']);
            setMobileCatalogOpen(false);
          }}
          searchValue={catalogSearch}
          onSearchChange={setCatalogSearch}
          searchPlaceholder="Cari tajuk acara atau daerah..."
          extraControls={
            <>
              <select
                value={catalogDistrictFilter}
                onChange={(e) => setCatalogDistrictFilter(e.target.value as 'all' | KelantanDistrict)}
                aria-label="Tapis daerah acara"
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
              >
                <option value="all">Semua Daerah</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={catalogSortPreset}
                onChange={(e) => setCatalogSortPreset(e.target.value)}
                aria-label="Susun acara belia"
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
              >
                {catalogSortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </>
          }
        />
      ) : (
        <WorkspaceHeaderCard
          role="admin"
          icon={<Users className="w-5 h-5" />}
          title="Tempahan Tapak & Peserta Acara"
          subtitle="Semak penyertaan peserta serta status tempahan tapak acara belia."
          rightActions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubView('catalog');
                  setMobileCatalogOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Senarai Acara</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubView('bookings');
                  setMobileBookingOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.segmentedActiveClass}`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tempahan Peserta</span>
              </button>
              <button
                type="button"
                onClick={openCreateEvent}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${adminTheme.primaryButtonClass}`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          }
          tabs={[
            { id: 'all', label: 'Semua', count: bookingCounts.all },
            { id: 'booked', label: 'Ditempah', count: bookingCounts.booked },
            { id: 'cancelled', label: 'Dibatalkan', count: bookingCounts.cancelled }
          ]}
          activeTab={bookingStatusFilter}
          onTabChange={(id) => {
            setBookingStatusFilter(id as 'all' | 'booked' | 'cancelled');
            setMobileBookingOpen(false);
          }}
          searchValue={bookingSearch}
          onSearchChange={setBookingSearch}
          searchPlaceholder="Cari peserta, acara atau ID..."
          extraControls={
            <select
              value={bookingSortPreset}
              onChange={(e) => setBookingSortPreset(e.target.value)}
              aria-label="Susun tempahan peserta"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
            >
              {bookingSortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          }
        />
      )}

      {subView === 'catalog' ? (
        filteredSortedEvents.length === 0 ? (
          <div className={`rounded-2xl border backdrop-blur-xs p-10 text-center space-y-2 ${adminTheme.surfaceClass}`}>
            <Calendar className="w-8 h-8 text-black/35 dark:text-white/35 mx-auto" />
            <p className="text-sm font-bold text-black dark:text-white kbelia-trim">
              Tiada acara usahawan belia direkodkan bagi carian atau tapisan ini.
            </p>
            {hasCatalogFilters && (
              <button
                type="button"
                onClick={() => {
                  setCatalogSearch('');
                  setCatalogCategoryFilter('all');
                  setCatalogDistrictFilter('all');
                  setCatalogSortPreset(DEFAULT_SORT_VALUE);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
              >
                Set Semula Penapis
              </button>
            )}
          </div>
        ) : (
          <GoogleWorkspaceSplitPane
            role="admin"
            mobileOpen={mobileCatalogOpen && Boolean(selectedEvent)}
            onMobileClose={() => setMobileCatalogOpen(false)}
            mobileTitle={selectedEvent?.title}
            leftHeader={
              <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-black/65 dark:text-white/70 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                <span>{filteredSortedEvents.length} acara dipaparkan</span>
                {hasCatalogFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogCategoryFilter('all');
                      setCatalogDistrictFilter('all');
                      setCatalogSortPreset(DEFAULT_SORT_VALUE);
                    }}
                    className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                  >
                    Set Semula
                  </button>
                )}
              </div>
            }
            leftContent={catalogPagination.paginatedItems.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setMobileCatalogOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEventId(evt.id);
                      setMobileCatalogOpen(true);
                    }
                  }}
                  className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl border overflow-hidden shrink-0 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <PortalImage
                      src={resolveEventImage(evt.category, evt.imageUrl)}
                      alt={evt.title}
                      fallbackType="event"
                      fallbackLabel={evt.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-black dark:text-white leading-snug line-clamp-2 kbelia-trim">
                        {evt.title}
                      </p>
                      <span className={`text-[11px] font-bold uppercase shrink-0 ${adminTheme.accentTextClass}`}>
                        {evt.category}
                      </span>
                    </div>
                    <div className="text-xs text-black/65 dark:text-white/65 truncate tabular-nums">
                      {evt.district} · {evt.date} · Baki {evt.boothsAvailable} tapak
                    </div>
                  </div>
                </div>
              );
            })}
            leftFooter={
              <PaginationBar
                currentPage={catalogPagination.currentPage}
                totalItems={catalogPagination.totalItems}
                itemsPerPage={7}
                onPageChange={catalogPagination.setCurrentPage}
                itemLabel="acara belia"
                accent="amber"
              />
            }
            rightContent={
              selectedEvent ? (
                <div>
                  <SidePreviewHeader
                    role="admin"
                    title={selectedEvent.title}
                    status={
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase ${adminTheme.activeNavClass}`}>
                        {selectedEvent.category}
                      </span>
                    }
                    subtitle={selectedEvent.organizer}
                    meta={
                      <>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedEvent.location} ({selectedEvent.district})
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3.5 h-3.5" />
                          {selectedEvent.date}
                        </span>
                      </>
                    }
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => openEditEvent(selectedEvent)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.primaryButtonClass}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sunting</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            confirmDelete({
                              itemName: selectedEvent.title,
                              itemType: 'Acara Belia',
                              onConfirm: () => handleDeleteEvent(selectedEvent)
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Padam</span>
                        </button>
                      </>
                    }
                  />

                  <div className="p-4 sm:p-5 space-y-4">
                    <div className={`w-full h-48 sm:h-56 rounded-xl overflow-hidden border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <PortalImage
                        src={resolveEventImage(selectedEvent.category, selectedEvent.imageUrl)}
                        alt={selectedEvent.title}
                        fallbackType="event"
                        fallbackLabel={selectedEvent.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <SidePreviewMetricsStrip
                      role="admin"
                      columns={3}
                      items={[
                        { label: 'Waktu Program', value: selectedEvent.time || '-' },
                        {
                          label: 'Kuota Tapak',
                          value: `${selectedEvent.boothsAvailable} / ${selectedEvent.totalBooths} kosong`,
                          accent: true
                        },
                        { label: 'Yuran / Tajaan', value: selectedEvent.fee || 'Percuma' }
                      ]}
                    />

                    <div className={`p-4 rounded-xl border space-y-2 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block">
                        Keterangan Acara
                      </span>
                      <p className="text-sm text-black/85 dark:text-white/90 leading-relaxed whitespace-pre-line kbelia-prose">
                        {selectedEvent.description || 'Tiada keterangan acara direkodkan.'}
                      </p>
                      {selectedEvent.whatsappContact && (
                        <p className="text-xs font-mono text-black/70 dark:text-white/75 pt-1">
                          WhatsApp Urusetia: +{selectedEvent.whatsappContact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <SidePreviewEmptyState
                  icon={<Calendar className="w-10 h-10" />}
                  title="Pilih acara belia"
                  description="Klik mana-mana acara di senarai kiri untuk melihat poster, kuota tapak, dan pilihan suntingan."
                />
              )
            }
          />
        )
      ) : filteredSortedBookings.length === 0 ? (
        <div className={`rounded-2xl border backdrop-blur-xs p-10 text-center space-y-2 ${adminTheme.surfaceClass}`}>
          <Users className="w-8 h-8 text-black/35 dark:text-white/35 mx-auto" />
          <p className="text-sm font-bold text-black dark:text-white kbelia-trim">
            Belum ada rekod tempahan tapak acara bagi carian atau tapisan ini.
          </p>
          {hasBookingFilters && (
            <button
              type="button"
              onClick={() => {
                setBookingSearch('');
                setBookingStatusFilter('all');
                setBookingSortPreset(DEFAULT_SORT_VALUE);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
            >
              Set Semula Penapis
            </button>
          )}
        </div>
      ) : (
        <GoogleWorkspaceSplitPane
          role="admin"
          mobileOpen={mobileBookingOpen && Boolean(selectedBooking)}
          onMobileClose={() => setMobileBookingOpen(false)}
          mobileTitle={selectedBooking?.userName || selectedBooking?.eventTitle}
          leftHeader={
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold text-black/65 dark:text-white/70 ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <span>{filteredSortedBookings.length} tempahan dipaparkan</span>
              {hasBookingFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingSearch('');
                    setBookingStatusFilter('all');
                    setBookingSortPreset(DEFAULT_SORT_VALUE);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${adminTheme.accentTextClass}`}
                >
                  Set Semula
                </button>
              )}
            </div>
          }
          leftContent={bookingsPagination.paginatedItems.map((b) => {
            const isSelected = selectedBooking?.id === b.id;
            return (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedBookingId(b.id);
                  setMobileBookingOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBookingId(b.id);
                    setMobileBookingOpen(true);
                  }
                }}
                className={`px-4 py-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected ? getWorkspaceActiveRowClass('admin') : adminTheme.rowHoverClass
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-black dark:text-white leading-snug truncate kbelia-trim">
                      {b.userName || 'Usahawan Belia'}
                    </p>
                    <span
                      className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-lg ${
                        b.status === 'booked'
                          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/12 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {b.status === 'booked' ? 'Ditempah' : 'Dibatalkan'}
                    </span>
                  </div>
                  <p className="text-xs text-black/65 dark:text-white/65 truncate">
                    {b.eventTitle} · <span className="font-mono">{b.userId}</span>
                  </p>
                </div>
              </div>
            );
          })}
          leftFooter={
            <PaginationBar
              currentPage={bookingsPagination.currentPage}
              totalItems={bookingsPagination.totalItems}
              itemsPerPage={7}
              onPageChange={bookingsPagination.setCurrentPage}
              itemLabel="tempahan peserta"
              accent="amber"
            />
          }
          rightContent={
            selectedBooking ? (
              <div>
                <SidePreviewHeader
                  role="admin"
                  media={
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${adminTheme.activeMiniBtnClass}`}>
                      <Users className="w-5 h-5" />
                    </div>
                  }
                  title={selectedBooking.userName || 'Usahawan Belia'}
                  status={
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        selectedBooking.status === 'booked'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {selectedBooking.status === 'booked' ? 'Ditempah' : 'Dibatalkan'}
                    </span>
                  }
                  subtitle={selectedBooking.eventTitle}
                  meta={<span className="font-mono">ID Peserta: {selectedBooking.userId}</span>}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleBookingStatusChange(
                            selectedBooking,
                            selectedBooking.status === 'booked' ? 'cancelled' : 'booked'
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          selectedBooking.status === 'booked'
                            ? adminTheme.secondaryButtonClass
                            : adminTheme.primaryButtonClass
                        }`}
                      >
                        {selectedBooking.status === 'booked' ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Batal</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktifkan</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete({
                            itemName: `${selectedBooking.userName || 'Peserta'} - ${selectedBooking.eventTitle}`,
                            itemType: 'Tempahan Tapak Acara',
                            onConfirm: () => handleDeleteBooking(selectedBooking)
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${adminTheme.dangerOutlineButtonClass}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </>
                  }
                />

                <div className="p-4 sm:p-5 space-y-4">
                  <SidePreviewMetricsStrip
                    role="admin"
                    columns={3}
                    items={[
                      { label: 'Nama Peserta', value: selectedBooking.userName || 'Usahawan Belia' },
                      { label: 'ID Akaun', value: selectedBooking.userId, mono: true },
                      {
                        label: 'Status Tempahan',
                        value: selectedBooking.status === 'booked' ? 'Ditempah (Aktif)' : 'Dibatalkan',
                        accent: selectedBooking.status === 'booked'
                      }
                    ]}
                  />

                  <div className={`p-4 rounded-xl border ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400 block mb-1">
                      Acara Ditempah
                    </span>
                    <p className="text-sm font-semibold text-black dark:text-white kbelia-trim">
                      {selectedBooking.eventTitle}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <SidePreviewEmptyState
                icon={<Users className="w-10 h-10" />}
                title="Pilih tempahan peserta"
                description="Klik mana-mana rekod tempahan di senarai kiri untuk mengurus pengaktifan atau pembatalan."
              />
            )
          }
        />
      )}

      {/* Add / Edit Youth Event Modal */}
      {showEventModal && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => !isSaving && setShowEventModal(false)}
        >
          <div
            className={`animate-popover-enter relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${adminTheme.surfaceClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`sticky top-0 z-10 border-b px-5 py-3.5 flex items-center justify-between ${adminTheme.surfaceMutedClass} ${adminTheme.dividerClass}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${adminTheme.activeMiniBtnClass}`}>
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
                aria-label="Tutup"
                className={adminTheme.iconButtonClass}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-4 sm:p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tajuk Acara *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Karnival Usahawan Belia Kelantan"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as YouthEvent['category'])}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
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
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm cursor-pointer focus:outline-none ${adminTheme.inputClass}`}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tarikh</label>
                  <ModernDatePicker
                    value={date}
                    onChange={setDate}
                    valueFormat="malay-date"
                    allowRange
                    placeholder="Pilih tarikh atau julat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Masa</label>
                  <ModernTimePicker
                    value={time}
                    onChange={setTime}
                    mode="range"
                    allowRangeToggle
                    formatStyle="12h-pg"
                    defaultDurationMinutes={480}
                    placeholder="Pilih waktu acara"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Penganjur</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Yuran / Tajaan</label>
                  <input
                    type="text"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Tapak Kosong</label>
                  <input
                    type="number"
                    min="0"
                    value={boothsAvailable}
                    onChange={(e) => setBoothsAvailable(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Jumlah Tapak</label>
                  <input
                    type="number"
                    min="1"
                    value={totalBooths}
                    onChange={(e) => setTotalBooths(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Nombor WhatsApp Penganjur</label>
                  <input
                    type="text"
                    value={whatsappContact}
                    onChange={(e) => setWhatsappContact(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono focus:outline-none ${adminTheme.inputClass}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-1.5">Keterangan Acara</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none ${adminTheme.inputClass}`}
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

              <div className={`flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t ${adminTheme.dividerClass}`}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowEventModal(false)}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${adminTheme.secondaryButtonClass}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${adminTheme.primaryButtonClass}`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : editingEvent ? 'Simpan' : 'Terbit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
