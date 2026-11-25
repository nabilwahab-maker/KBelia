import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  ExternalLink,
  SlidersHorizontal,
  Lock
} from 'lucide-react';
import { CapsuleBooking, CapsuleSlot, KelantanDistrict, PortalSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PortalImage } from './PortalImage';
import { resolveSlotImage } from '../utils/visualAssets';
import { KelantanDistrictsMap } from './KelantanDistrictsMap';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import { PaginationBar, usePagination } from './PaginationBar';
import { DEFAULT_SORT_VALUE, buildStandardSortOptions, sortRecords } from '../utils/sortUtils';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';

interface CapsuleGridProps {
  slots: CapsuleSlot[];
  bookings?: CapsuleBooking[];
  portalSettings?: PortalSettings;
  onSelectSlot: (slot: CapsuleSlot) => void;
  onViewTenantDetail?: (slot: CapsuleSlot) => void;
  onOpenNewBooking: () => void;
  onAddSlot?: () => void;
  selectedHub?: string;
  onSelectHub?: (hub: string) => void;
  maxBudget?: number;
  onBudgetChange?: (val: number) => void;
  isReadOnly?: boolean;
  hasActiveBooking?: boolean;
  onGoToManageBooking?: () => void;
}

const DISTRICT_TO_HUB: Record<string, string> = {
  'Semua Jajahan': 'Semua',
  Bachok: 'Hab Usahawan Bachok',
  'Kota Bharu': 'Hub Belia Kota Bharu',
  Tumpat: 'Hub Kraf Tumpat',
  'Pasir Mas': 'Hub Pasir Mas',
  Jeli: 'Hub Komuniti Jeli'
};

const HUB_TO_DISTRICT: Record<string, KelantanDistrict> = {
  Semua: 'Semua Jajahan',
  'Hab Usahawan Bachok': 'Bachok',
  'Hub Belia Kota Bharu': 'Kota Bharu',
  'Hub Kraf Tumpat': 'Tumpat',
  'Hub Pasir Mas': 'Pasir Mas',
  'Hub Komuniti Jeli': 'Jeli'
};

export const CapsuleGrid: React.FC<CapsuleGridProps> = ({
  slots,
  bookings = [],
  portalSettings,
  onSelectSlot,
  onViewTenantDetail,
  onOpenNewBooking,
  onAddSlot,
  selectedHub: externalHub,
  onSelectHub: externalSetHub,
  maxBudget: externalBudget,
  onBudgetChange: externalSetBudget,
  isReadOnly = false,
  hasActiveBooking = false,
  onGoToManageBooking
}) => {
  const subsidyRate = portalSettings?.portalSubsidyRate ?? 50;
  const { user, isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [internalHub, setInternalHub] = useState<string>('Semua');
  const [internalBudget, setInternalBudget] = useState<number>(500);
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [selectedMapDistrict, setSelectedMapDistrict] = useState<KelantanDistrict>('Semua Jajahan');

  const selectedHub = externalHub !== undefined ? externalHub : internalHub;
  const setSelectedHub = (hub: string) => {
    if (externalSetHub) externalSetHub(hub);
    setInternalHub(hub);
  };

  const maxBudget = externalBudget !== undefined ? externalBudget : internalBudget;
  const setMaxBudget = (val: number) => {
    if (externalSetBudget) externalSetBudget(val);
    setInternalBudget(val);
  };

  const hubs = ['Semua', 'Hab Usahawan Bachok', 'Hub Belia Kota Bharu', 'Hub Kraf Tumpat', 'Hub Pasir Mas', 'Hub Komuniti Jeli'];

  const sortOptions = buildStandardSortOptions(
    [
      { value: 'rate_asc', label: isEn ? 'Monthly Rent (Lowest)' : 'Sewa Bulanan (Terendah)' },
      { value: 'rate_desc', label: isEn ? 'Monthly Rent (Highest)' : 'Sewa Bulanan (Tertinggi)' },
      { value: 'status_available', label: isEn ? 'Status (Available First)' : 'Status (Tersedia Dahulu)' }
    ],
    isEn
  );

  const activeFilterCount =
    (selectedHub !== 'Semua' ? 1 : 0) +
    (selectedStatus !== 'Semua' ? 1 : 0) +
    (maxBudget < 500 ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  const handleSelectHubWithMapSync = (hub: string) => {
    setSelectedHub(hub);
    setSelectedMapDistrict(HUB_TO_DISTRICT[hub] || 'Semua Jajahan');
  };

  const handleResetFiltersOnly = () => {
    setSelectedHub('Semua');
    setSelectedMapDistrict('Semua Jajahan');
    setSelectedStatus('Semua');
    setMaxBudget(500);
    setSortBy(DEFAULT_SORT_VALUE);
  };

  const handleResetAll = () => {
    handleResetFiltersOnly();
    setSearchQuery('');
  };

  const filteredSlots = sortRecords(
    (slots || []).filter((slot) => {
      const hubLoc = (slot.hubLocation || '').toLowerCase();
      const dist = (slot.district || '').toLowerCase();
      const matchHub = selectedHub === 'Semua' || (() => {
        const h = selectedHub.toLowerCase();
        if (h.includes('bachok')) return hubLoc.includes('bachok') || hubLoc.includes('umk') || dist === 'bachok';
        if (h.includes('kota bharu')) return hubLoc.includes('kota bharu') || hubLoc.includes('kb sentral') || dist === 'kota bharu';
        if (h.includes('tumpat')) return hubLoc.includes('tumpat') || dist === 'tumpat';
        if (h.includes('pasir mas')) return hubLoc.includes('pasir mas') || dist === 'pasir mas';
        if (h.includes('jeli')) return hubLoc.includes('jeli') || dist === 'jeli';
        return hubLoc.includes(h.replace('hub ', ''));
      })();
      const matchStatus = selectedStatus === 'Semua' || slot.status === selectedStatus;
      const matchBudget = !slot.monthlyRate || slot.monthlyRate <= maxBudget;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = !query ||
        (slot.name && slot.name.toLowerCase().includes(query)) ||
        (slot.code && slot.code.toLowerCase().includes(query)) ||
        (slot.hubLocation && slot.hubLocation.toLowerCase().includes(query)) ||
        (slot.district && slot.district.toLowerCase().includes(query));
      return matchHub && matchStatus && matchBudget && matchQuery;
    }),
    {
      sortBy,
      getName: (s) => s.name || s.code || '',
      customCompare: (a, b, mode) => {
        if (mode === 'rate_asc') return Number(a.monthlyRate || 0) - Number(b.monthlyRate || 0);
        if (mode === 'rate_desc') return Number(b.monthlyRate || 0) - Number(a.monthlyRate || 0);
        if (mode === 'status_available') {
          return (a.status === 'available' ? 0 : 1) - (b.status === 'available' ? 0 : 1);
        }
        return null;
      }
    }
  );

  const pagination = usePagination(filteredSlots, 7, [
    searchQuery,
    selectedHub,
    selectedStatus,
    maxBudget,
    sortBy
  ]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-fluid-portal font-extrabold text-black dark:text-white tracking-tight kbelia-trim">
          Senarai Kiosk Belia Kelantan
        </h1>
        {!isReadOnly && onGoToManageBooking && (
          <button
            type="button"
            onClick={onGoToManageBooking}
            className={`px-4 py-2.5 text-sm inline-flex items-center gap-2 ${roleTheme.primaryButtonClass}`}
          >
            <Building2 className="w-4 h-4" />
            <span>{hasActiveBooking ? 'Urus Kiosk' : 'Kiosk Saya'}</span>
          </button>
        )}
      </div>

      {/* Live Google Maps Kiosk Hub Explorer */}
      <KelantanDistrictsMap
        slots={slots}
        selectedDistrict={selectedMapDistrict}
        onSelectDistrict={(district) => {
          setSelectedMapDistrict(district);
          setSelectedHub(DISTRICT_TO_HUB[district] || 'Semua');
        }}
        onSelectSlot={onSelectSlot}
        onOpenBookingForDistrict={(_district, slot) => {
          if (hasActiveBooking) {
            if (onGoToManageBooking) onGoToManageBooking();
            return;
          }
          if (slot) onSelectSlot(slot);
          else onOpenNewBooking();
        }}
      />

      {/* Senarai Kiosk: Carian, Penapis Bersepadu, Senarai Baris & Halaman Bernombor */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xs overflow-visible">
        <ReferenceTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            isEn
              ? 'Search kiosk, hub or district...'
              : 'Cari kod kiosk, hab atau jajahan...'
          }
          filterCount={activeFilterCount}
          onResetFilters={handleResetFiltersOnly}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortLabel={isEn ? 'Sort By' : 'Susun Mengikut'}
          rightSlot={
            isReadOnly && onAddSlot ? (
              <button
                type="button"
                onClick={onAddSlot}
                className={`min-h-[38px] ${roleTheme.compactPrimaryButtonClass}`}
              >
                <Building2 className="w-4 h-4" />
                <span>Tambah Kiosk</span>
              </button>
            ) : undefined
          }
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Hub Location' : 'Hab Lokasi'}</span>
                </label>
                <select
                  value={selectedHub}
                  onChange={(e) => handleSelectHubWithMapSync(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-medium cursor-pointer focus:outline-none ${roleTheme.inputClass}`}
                >
                  {hubs.map((hub) => (
                    <option key={hub} value={hub}>
                      {hub === 'Semua'
                        ? isEn
                          ? 'All Hubs'
                          : 'Semua Hab'
                        : hub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  {isEn ? 'Kiosk Status' : 'Status Kiosk'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Semua', label: isEn ? 'All' : 'Semua' },
                    { id: 'available', label: isEn ? 'Available' : 'Tersedia' },
                    { id: 'occupied', label: isEn ? 'Occupied' : 'Disewa' },
                    { id: 'reserved', label: isEn ? 'Reserved' : 'Tempah' }
                  ].map((st) => {
                    const isActive = selectedStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStatus(st.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold border cursor-pointer transition-colors ${
                          isActive
                            ? roleTheme.segmentedActiveClass + ' border-transparent'
                            : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? 'Max Monthly Rent' : 'Had Bajet Sewa'}</span>
                  </span>
                  <span className="font-mono font-extrabold text-black dark:text-white tabular-nums">
                    RM {maxBudget}/bulan
                  </span>
                </div>
                <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-700">
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={20}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    aria-label={isEn ? 'Max Monthly Rent' : 'Had Bajet Sewa'}
                    className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[0.8125rem] text-black/65 dark:text-white/70 font-mono mt-1 tabular-nums">
                    <span>RM 100</span>
                    <span>RM 500</span>
                  </div>
                </div>
              </div>
            </>
          }
        />

        {filteredSlots.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Building2 className="w-12 h-12 text-black/35 dark:text-white/35 mx-auto mb-3" />
            <h3 className="text-base font-bold text-black dark:text-white">
              {isEn ? 'No Kiosks Found' : 'Tiada Kiosk Dijumpai'}
            </h3>
            <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-1">
              {isEn
                ? 'Try changing the location hub, status, or rent budget filter.'
                : 'Cuba tukar pilihan lokasi, status atau had bajet sewa kiosk.'}
            </p>
            {(searchQuery.trim() !== '' || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={handleResetAll}
                className={`mt-3 ${roleTheme.compactSecondaryButtonClass}`}
              >
                {isEn ? 'Reset' : 'Set Semula'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-700">
              {pagination.paginatedItems.map((slot) => {
                const slotBookings = (bookings || []).filter(b =>
                  (b.slotId === slot.id || (slot.code && b.slotCode === slot.code)) &&
                  b.status !== 'rejected' && b.status !== 'cancelled'
                );

                const myBooking = user ? (bookings || []).find(b =>
                  (b.applicantId === user.uid || (user.email && b.applicantEmail?.toLowerCase() === user.email.toLowerCase())) &&
                  (b.slotId === slot.id || (slot.code && b.slotCode === slot.code)) &&
                  b.status !== 'rejected' && b.status !== 'cancelled'
                ) : null;

                const isOccupiedOrTenant = slot.status === 'occupied' || Boolean(slot.currentTenantBusinessName);
                const isReserved = slot.status === 'reserved' || (slotBookings.some(b => b.status === 'pending') && slot.status === 'available');
                const isMaintenance = slot.status === 'maintenance';
                const isRegistered = isOccupiedOrTenant || isReserved || isMaintenance || slotBookings.length > 0;
                const isAvailable = slot.status === 'available' && !isRegistered;

                const statusTag = myBooking ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold text-white shrink-0 ${
                    myBooking.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {myBooking.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{myBooking.status === 'approved' ? 'Diluluskan' : 'Disemak'}</span>
                  </span>
                ) : isOccupiedOrTenant ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-slate-100 dark:bg-zinc-800 text-black dark:text-white border border-slate-300 dark:border-zinc-600 shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>Telah Berdaftar</span>
                  </span>
                ) : isReserved ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-300 dark:border-amber-700 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>Dalam Tempahan</span>
                  </span>
                ) : isMaintenance ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border border-rose-300 dark:border-rose-700 shrink-0">
                    Penyelenggaraan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.8125rem] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-300 dark:border-emerald-700 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Tersedia</span>
                  </span>
                );

                return (
                  <div
                    key={slot.id}
                    id={`capsule-card-${(slot.code || slot.id || 'slot').toLowerCase()}`}
                    onClick={() => {
                      if (myBooking || isRegistered) {
                        if (onViewTenantDetail) onViewTenantDetail(slot);
                        return;
                      }
                      if (isAvailable && !isReadOnly && !hasActiveBooking) {
                        onSelectSlot(slot);
                      }
                    }}
                    className={`p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 ${
                      myBooking ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0">
                        <PortalImage
                          src={resolveSlotImage(slot)}
                          alt={slot.name}
                          fallbackType="kiosk"
                          fallbackLabel={slot.code}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3
                            title={`${slot.code} · ${slot.name}`}
                            className="font-bold text-black dark:text-white text-sm sm:text-base kbelia-clamp-1 kbelia-trim"
                          >
                            {slot.code} · {slot.name}
                          </h3>
                          {statusTag}
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums kbelia-prose">
                          {slot.hubLocation} ({slot.district}) · Saiz {slot.size} · RM{slot.monthlyRate}/bulan (Subsidi {subsidyRate}%)
                          {slot.currentTenantBusinessName ? ` · Penyewa: ${slot.currentTenantBusinessName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${slot.hubLocation}, ${slot.district}, Kelantan`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={roleTheme.compactSecondaryButtonClass}
                        title={isEn ? 'Open in Google Maps' : 'Buka lokasi di Google Maps'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="kbelia-acro">GPS</span>
                      </a>

                      {myBooking ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewTenantDetail) onViewTenantDetail(slot);
                          }}
                          className={roleTheme.compactPrimaryButtonClass}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Permohonan</span>
                        </button>
                      ) : isRegistered ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewTenantDetail) onViewTenantDetail(slot);
                          }}
                          className={roleTheme.compactSecondaryButtonClass}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat</span>
                        </button>
                      ) : isReadOnly ? (
                        <span className="py-2 px-3.5 rounded-xl text-[0.8125rem] font-semibold bg-slate-50 dark:bg-zinc-800 text-black dark:text-white border border-slate-300 dark:border-zinc-600 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tersedia</span>
                        </span>
                      ) : hasActiveBooking ? (
                        <button
                          type="button"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className={roleTheme.compactSecondaryButtonClass}
                        >
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>Ditempah</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSlot(slot);
                          }}
                          className={roleTheme.compactPrimaryButtonClass}
                        >
                          <span>Mohon</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationBar
              variant="compact"
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={7}
              onPageChange={pagination.setCurrentPage}
              itemLabel={isEn ? 'kiosks' : 'kiosk'}
            />
          </>
        )}
      </div>

    </div>
  );
};
