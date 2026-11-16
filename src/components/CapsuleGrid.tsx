import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Wifi, 
  Zap, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Filter, 
  Send, 
  Info, 
  Store,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Eye,
  ExternalLink,
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Lock
} from 'lucide-react';
import { CapsuleBooking, CapsuleSlot, KelantanDistrict, PortalSettings, SlotStatus } from '../types';
import { BudgetSlider } from './BudgetSlider';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PortalImage } from './PortalImage';
import { resolveSlotImage } from '../utils/visualAssets';
import { KelantanDistrictsMap } from './KelantanDistrictsMap';

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
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [internalHub, setInternalHub] = useState<string>('Semua');
  const [internalBudget, setInternalBudget] = useState<number>(500);
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const hubs = ['Semua', 'Hub UMK Bachok', 'Hub Belia Kota Bharu', 'Hub Kraf Tumpat', 'Hub Pasir Mas', 'Hub Komuniti Jeli'];

  const isFiltered = selectedHub !== 'Semua' || selectedStatus !== 'Semua' || maxBudget < 500 || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedHub('Semua');
    setSelectedStatus('Semua');
    setMaxBudget(500);
    setSearchQuery('');
  };

  const filteredSlots = (slots || []).filter((slot) => {
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
  });

  const getStatusBadge = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.8125rem] font-bold bg-white dark:bg-slate-800 text-black dark:text-white/75 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tersedia
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.8125rem] font-bold bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-black/70 dark:text-white/75" />
            Sedang Beroperasi
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.8125rem] font-bold bg-white dark:bg-slate-800 text-black dark:text-white/75 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <Clock className="w-3 h-3 text-black/70 dark:text-white/75" />
            Dalam Tempahan
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.8125rem] font-bold bg-white dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300 dark:border-slate-600 shadow-xs">
            Penyelenggaraan
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            Senarai Kiosk Belia Kelantan
          </h1>
          <p className="text-black/75 dark:text-white/75 text-[0.9375rem] mt-1 max-w-2xl leading-relaxed">
            Pilih dan sewa ruang niaga serba lengkap di lokasi strategik universiti dan pusat bandar untuk memulakan perniagaan anda dengan modal rendah.
          </p>
        </div>

        {/* Quick Booking CTA or Admin Add Kiosk CTA */}
        {isReadOnly ? (
          onAddSlot && (
            <button
              onClick={onAddSlot}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer dark:bg-blue-600"
            >
              <Building2 className="w-4 h-4" />
              <span>Daftar Kiosk</span>
            </button>
          )
        ) : hasActiveBooking ? (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-black/60 dark:text-white/60 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold cursor-not-allowed shrink-0"
              title="Hanya 1 tempahan kiosk aktif dibenarkan pada satu masa"
            >
              <Lock className="w-4 h-4" />
              <span>Sudah Ditempah</span>
            </button>
            {onGoToManageBooking && (
              <button
                type="button"
                onClick={onGoToManageBooking}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors shrink-0 cursor-pointer dark:bg-blue-600"
              >
                <FileText className="w-4 h-4" />
                <span>Urus Tempahan</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors shrink-0 cursor-pointer dark:bg-blue-600"
          >
            <Send className="w-4 h-4" />
            <span>Mohon Kiosk</span>
          </button>
        )}
      </div>

      {/* Ringkasan Statistik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-fit items-start">
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Jumlah Kiosk</span>
          <span className="text-lg font-black text-black dark:text-white tabular-nums">{(slots || []).length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Tersedia</span>
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{(slots || []).filter(s => s.status === 'available').length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Disewa / Tempah</span>
          <span className="text-lg font-black text-black dark:text-white tabular-nums">{(slots || []).filter(s => s.status !== 'available').length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 h-fit">
          <span className="text-xs font-semibold text-black/65 dark:text-white/70 block">Subsidi Negeri</span>
          <span className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{subsidyRate}%</span>
        </div>
      </div>

      {/* Live Google Maps Kiosk Hub Explorer */}
      <KelantanDistrictsMap
        slots={slots}
        selectedDistrict={selectedMapDistrict}
        onSelectDistrict={(district) => {
          setSelectedMapDistrict(district);
          const hubMap: Record<string, string> = {
            'Semua Jajahan': 'Semua',
            Bachok: 'Hub UMK Bachok',
            'Kota Bharu': 'Hub Belia Kota Bharu',
            Tumpat: 'Hub Kraf Tumpat',
            'Pasir Mas': 'Hub Pasir Mas',
            Jeli: 'Hub Komuniti Jeli'
          };
          setSelectedHub(hubMap[district] || 'Semua');
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

      {/* Modern Minimalist Filter Section */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs transition-all">
        {/* Top Control Bar: Search & Quick Metas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-300 dark:border-slate-600">
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan kata kunci carian"
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all font-medium dark:focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white rounded-lg cursor-pointer"
                title="Kosongkan carian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Reset */}
          {isFiltered && (
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-black dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Tetapkan semula tapisan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Row: Hubs, Status & Budget Slider */}
        <div className="pt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Hab Location Segmented Tabs */}
          <div className="lg:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between text-[0.8125rem] font-bold text-black/70 dark:text-white/75 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75" />
                Pilihan Hab Lokasi
              </span>
            </div>
            <div className="p-1 bg-slate-50 dark:bg-slate-900 rounded-xl flex flex-wrap gap-1 border border-slate-300 dark:border-slate-600">
              {hubs.map((hub) => {
                const isActive = selectedHub === hub;
                const shortLabel = hub.replace('Hub ', '');
                return (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => setSelectedHub(hub)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs dark:bg-blue-600'
                        : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {hub === 'Semua' ? 'Semua Hab' : shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Segmented Buttons */}
          <div className="lg:col-span-3 space-y-1.5">
            <div className="text-[0.8125rem] font-bold text-black/70 dark:text-white/75 uppercase tracking-wider">
              Status Pod
            </div>
            <div className="p-1 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-1 border border-slate-300 dark:border-slate-600">
              {[
                { id: 'Semua', label: 'Semua', dot: null },
                { id: 'available', label: 'Tersedia', dot: 'bg-emerald-500' },
                { id: 'occupied', label: 'Disewa', dot: 'bg-slate-400' },
                { id: 'reserved', label: 'Tempah', dot: 'bg-amber-500' }
              ].map((st) => {
                const isActive = selectedStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatus(st.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[0.8125rem] font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-black dark:text-white font-bold shadow-xs border border-slate-300 dark:border-slate-600'
                        : 'text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {st.dot && <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />}
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integrated Modern Budget Slider */}
          <div className="lg:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between text-[0.8125rem] font-bold text-black/70 dark:text-white/75 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-black dark:text-white/75" />
                Had Bajet Sewa
              </span>
              <span className="font-extrabold text-black dark:text-white/75 font-mono text-[0.8125rem]">
                RM {maxBudget}/bln
              </span>
            </div>
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600">
              <div className="relative flex items-center h-4 w-full">
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={20}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="flex justify-between text-[0.8125rem] text-black/70 dark:text-white/75 font-mono mt-0.5">
                <span>RM 100</span>
                <span>RM 500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Senarai Menegak Kiosk */}
      {filteredSlots.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 h-fit">
          <Building2 className="w-12 h-12 text-black/35 dark:text-white/35 mx-auto mb-3" />
          <h3 className="text-base font-bold text-black dark:text-white">Tiada Kiosk Dijumpai</h3>
          <p className="text-[0.9375rem] text-black/70 dark:text-white/75 mt-1">Cuba tukar pilihan lokasi atau status kiosk.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 overflow-hidden shadow-xs flex flex-col divide-y divide-slate-200 dark:divide-slate-700 h-fit">
          {filteredSlots.map((slot) => {
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
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold text-white shrink-0 ${
                myBooking.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                {myBooking.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>{myBooking.status === 'approved' ? 'Diluluskan' : 'Disemak'}</span>
              </span>
            ) : isOccupiedOrTenant ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600 shrink-0">
                <Lock className="w-3 h-3" />
                <span>Telah Berdaftar</span>
              </span>
            ) : isReserved ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-300 dark:border-amber-700 shrink-0">
                <Clock className="w-3 h-3" />
                <span>Dalam Tempahan</span>
              </span>
            ) : isMaintenance ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-black dark:text-white border border-rose-300 dark:border-rose-700 shrink-0">
                Penyelenggaraan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-300 dark:border-emerald-700 shrink-0">
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
                className={`p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/40 ${
                  myBooking ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 shrink-0">
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
                      <h3 className="font-bold text-black dark:text-white text-sm sm:text-base truncate">
                        {slot.code} · {slot.name}
                      </h3>
                      {statusTag}
                    </div>
                    <p className="text-sm text-black/70 dark:text-white/75 truncate tabular-nums">
                      {slot.hubLocation} ({slot.district}) · Saiz {slot.size} · RM{slot.monthlyRate}/bln (Subsidi {subsidyRate}%)
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
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-black dark:text-white hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                    title={language === 'en' ? 'Open in Google Maps' : 'Buka lokasi di Google Maps'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>GPS</span>
                  </a>

                  {myBooking ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewTenantDetail) onViewTenantDetail(slot);
                      }}
                      className="py-2 px-3.5 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Permohonan Anda</span>
                    </button>
                  ) : isRegistered ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewTenantDetail) onViewTenantDetail(slot);
                      }}
                      className="py-2 px-3.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 text-black dark:bg-slate-900 dark:hover:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Penyewa</span>
                    </button>
                  ) : isReadOnly ? (
                    <span className="py-2 px-3.5 rounded-lg text-sm font-semibold bg-slate-50 dark:bg-slate-900 text-black dark:text-white border border-slate-300 dark:border-slate-600 inline-flex items-center gap-1.5 shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Status Tersedia</span>
                    </span>
                  ) : hasActiveBooking ? (
                    <button
                      type="button"
                      disabled
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 px-3.5 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 text-black/55 dark:text-white/55 border border-slate-300 dark:border-slate-600 cursor-not-allowed shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Sudah Ditempah</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSlot(slot);
                      }}
                      className="py-2 px-3.5 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
                    >
                      <span>Mohon Kiosk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
