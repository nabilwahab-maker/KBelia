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
  HelpCircle,
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
import { CapsuleBooking, CapsuleSlot, PortalSettings, SlotStatus } from '../types';
import { BudgetSlider } from './BudgetSlider';
import { Accordion } from './Accordion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

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
  isReadOnly = false
}) => {
  const subsidyRate = portalSettings?.portalSubsidyRate ?? 50;
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [internalHub, setInternalHub] = useState<string>('Semua');
  const [internalBudget, setInternalBudget] = useState<number>(500);
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800/95 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tersedia
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Sedang Beroperasi
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800/95 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-xs backdrop-blur-xs">
            <Clock className="w-3 h-3 text-amber-500" />
            Dalam Tempahan
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-xs backdrop-blur-xs">
            Penyelenggaraan
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Ruang Kapsul Niaga Belia Kelantan
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Pilih dan sewa pod niaga modular serba lengkap di lokasi strategik universiti dan pusat bandar Kelantan untuk memulakan perniagaan anda dengan kos modal rendah.
          </p>
        </div>

        {/* Quick Booking CTA or Admin Add Kiosk CTA */}
        {isReadOnly ? (
          onAddSlot && (
            <button
              onClick={onAddSlot}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Daftar Kapsul Niaga Baharu</span>
            </button>
          )
        ) : (
          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Hantar Permohonan Kapsul</span>
          </button>
        )}
      </div>

      {/* Info Callout: UMK Capsule Model */}
      <div className="mb-8 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-sky-600 text-white rounded-xl shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">Spesifikasi Kapsul Niaga Modular</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
              Setiap unit kapsul dilengkapi palam elektrik 13A, sambungan Wi-Fi jalur lebar, sistem pengurusan inventori tanpa tunai DuitNow QR, serta sokongan pameran rasmi.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Minimalist Filter Section */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs mb-8 transition-all">
        {/* Top Control Bar: Search & Quick Metas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-700">
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kod pod, nama kiosk, atau lokasi hab..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Kosongkan carian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Filter Count & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50">
              <strong className="font-bold tabular-nums">{filteredSlots.length}</strong> pod sepadan
            </span>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Tetapkan semula tapisan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Hubs, Status & Budget Slider */}
        <div className="pt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Hab Location Segmented Tabs */}
          <div className="lg:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Pilihan Hab Lokasi
              </span>
            </div>
            <div className="p-1 bg-slate-50 dark:bg-slate-900 rounded-xl flex flex-wrap gap-1 border border-slate-200 dark:border-slate-700">
              {hubs.map((hub) => {
                const isActive = selectedHub === hub;
                const shortLabel = hub.replace('Hub ', '');
                return (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => setSelectedHub(hub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
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
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Pod
            </div>
            <div className="p-1 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
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
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
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
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                Had Bajet Sewa
              </span>
              <span className="font-extrabold text-sky-700 dark:text-sky-400 font-mono text-xs">
                RM {maxBudget}/bln
              </span>
            </div>
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="relative flex items-center h-4 w-full">
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={20}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                <span>RM 100</span>
                <span>RM 500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Slots */}
      {filteredSlots.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Tiada Kapsul Dijumpai</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cuba tukar pilihan tapak atau status kapsul.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => {
            // Check active bookings associated with this slot
            const slotBookings = (bookings || []).filter(b => 
              (b.slotId === slot.id || (slot.code && b.slotCode === slot.code)) &&
              b.status !== 'rejected' && b.status !== 'cancelled'
            );

            // Check if current user has an application/registration for this slot
            const myBooking = user ? (bookings || []).find(b => 
              (b.applicantId === user.uid || (user.email && b.applicantEmail?.toLowerCase() === user.email.toLowerCase())) &&
              (b.slotId === slot.id || (slot.code && b.slotCode === slot.code)) &&
              b.status !== 'rejected' && b.status !== 'cancelled'
            ) : null;

            // Slot is registered if it has an assigned tenant, is occupied/reserved/maintenance, or has active bookings
            const isOccupiedOrTenant = slot.status === 'occupied' || Boolean(slot.currentTenantBusinessName);
            const isReserved = slot.status === 'reserved' || (slotBookings.some(b => b.status === 'pending') && slot.status === 'available');
            const isMaintenance = slot.status === 'maintenance';
            const isRegistered = isOccupiedOrTenant || isReserved || isMaintenance || slotBookings.length > 0;
            const isAvailable = slot.status === 'available' && !isRegistered;

            return (
              <div
                key={slot.id}
                id={`capsule-card-${(slot.code || slot.id || 'slot').toLowerCase()}`}
                onClick={() => {
                  if (myBooking || isRegistered) {
                    if (onViewTenantDetail) onViewTenantDetail(slot);
                    return;
                  }
                  if (isAvailable && !isReadOnly) {
                    onSelectSlot(slot);
                  }
                }}
                className={`interactive-card bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-xs flex flex-col group cursor-pointer transition-all ${
                  myBooking 
                    ? 'border-emerald-500/70 ring-1 ring-emerald-500/20' 
                    : isRegistered 
                      ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-sky-400'
                }`}
              >
                {/* 1. Gambar Kad Berkadar Tetap (H-48) di Atas - Bersih Tanpa Teks Bertindih */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img
                    src={slot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg'}
                    alt={slot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  
                  {/* Top Left: Code Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold rounded-lg border border-white/15 shadow-xs">
                      {slot.code}
                    </span>
                  </div>

                  {/* Top Right: Status Badge (Dynamic & Accurate) */}
                  <div className="absolute top-3 right-3">
                    {myBooking ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-xs backdrop-blur-xs ${
                        myBooking.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}>
                        {myBooking.status === 'approved' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>Pendaftaran Anda ({myBooking.status === 'approved' ? 'Diluluskan' : 'Disemak'})</span>
                      </span>
                    ) : isOccupiedOrTenant ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/85 text-slate-100 border border-white/15 shadow-xs backdrop-blur-xs">
                        <Lock className="w-3 h-3 text-amber-300" />
                        <span>Telah Berdaftar</span>
                      </span>
                    ) : isReserved ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600/95 text-white border border-amber-500/50 shadow-xs backdrop-blur-xs">
                        <Clock className="w-3 h-3" />
                        <span>Dalam Tempahan</span>
                      </span>
                    ) : isMaintenance ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-700 text-white shadow-xs">
                        Penyelenggaraan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-slate-800/95 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Tersedia untuk Belia</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Info Teratur di Bawah - Berhierarki & Bebas Pertindihan */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3.5">
                    {/* Price & Subsidy Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors duration-200 leading-snug">
                          {slot.name}
                        </h3>
                        <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span className="truncate font-medium">{slot.hubLocation} ({slot.district})</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${slot.hubLocation}, ${slot.district}, Kelantan`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                            title={language === 'en' ? 'Open in Google Maps' : 'Buka lokasi di Google Maps'}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>GPS</span>
                          </a>
                        </div>
                      </div>

                      {/* Pricing Block */}
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 block mb-0.5">
                          Subsidi {subsidyRate}%
                        </span>
                        <div>
                          <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">RM{slot.monthlyRate}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">/bln</span>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Bar (Size & Jajahan) */}
                    <div className="py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Saiz: <strong className="text-slate-800 dark:text-white font-semibold">{slot.size}</strong>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Jajahan: <strong className="text-slate-800 dark:text-white font-semibold">{slot.district}</strong>
                      </span>
                    </div>

                    {/* Registration / Occupancy Status Card */}
                    {myBooking ? (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Permohonan Anda: {myBooking.businessName || 'Didaftarkan'}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 shrink-0">
                          {myBooking.status === 'approved' ? 'Aktif' : 'Semakan'}
                        </span>
                      </div>
                    ) : isRegistered ? (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Store className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal">Status Pengisian:</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              {slot.currentTenantBusinessName ? `Dioperasi oleh: ${slot.currentTenantBusinessName}` : 'Pendaftaran Penuh / Beroperasi'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                          Telah Berdaftar
                        </span>
                      </div>
                    ) : null}

                    {/* Amenities list */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Kemudahan Termasuk:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(slot.amenities || []).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Button: Registered Slots Strictly CANNOT Be Applied For */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    {myBooking ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewTenantDetail) onViewTenantDetail(slot);
                        }}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pendaftaran Anda ({myBooking.status === 'approved' ? 'Telah Diluluskan' : 'Sedang Disemak'})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isRegistered ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewTenantDetail) onViewTenantDetail(slot);
                        }}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer bg-slate-50 hover:bg-sky-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>Telah Berdaftar (Lihat Butiran Penyewa)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ) : isReadOnly ? (
                      <div className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                        <span>Status: Kekosongan Tersedia (Dipantau)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSlot(slot);
                        }}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white shadow-sm"
                      >
                        <span>Mohon Kapsul Ini (RM{slot.monthlyRate}/bln)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* FAQ & Panduan Accordion: Clean collapsible sections to prevent cognitive overload */}
      <div className="mt-12 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Panduan & Soalan Lazim Kapsul Niaga (FAQ)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ketahui syarat kelayakan, subsidi sewaan, dan kemudahan utiliti yang disediakan bagi setiap pod perniagaan.
            </p>
          </div>
        </div>

        <Accordion
          items={[
            {
              id: 'eligibility',
              title: 'Siapakah yang layak memohon Kapsul Niaga Belia?',
              badge: 'Syarat Utama',
              content: (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>Inisiatif ini terbuka kepada:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Belia warganegara Malaysia berumur antara 18 hingga 40 tahun.</li>
                    <li>Keutamaan diberikan kepada anak jati Kelantan, graduan TVET, atau mahasiswa/alumni universiti tempatan (UMK, UiTM, Politeknik).</li>
                    <li>Mempunyai perniagaan aktif atau perancangan produk fizikal/servis yang berdaya maju.</li>
                    <li>Pendaftaran SSM aktif atau bersedia mendaftar di bawah bimbingan Universiti Malaysia Kelantan (UMK) semasa memulakan perniagaan.</li>
                  </ul>
                </div>
              )
            },
            {
              id: 'subsidy',
              title: 'Bagaimanakah penstrukturan subsidi sewaan 50% dilaksanakan?',
              badge: 'RM150 / Bulan',
              content: (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Kadar pasaran komersial bagi pod niaga modular ini adalah <strong>RM 300 sebulan</strong>. Kerajaan Negeri Kelantan melalui Universiti Malaysia Kelantan (UMK) menyerap subsidi 50% sebanyak <strong>RM 150 sebulan</strong> untuk setiap usahawan belia terpilih.
                  </p>
                  <p>
                    Ini menjadikan kadar sewaan bersih yang perlu dibayar hanyalah <strong>RM 150 sebulan</strong> bagi meringankan kos modal operasi awal perniagaan.
                  </p>
                </div>
              )
            },
            {
              id: 'facilities',
              title: 'Apakah kemudahan yang disertakan dalam setiap unit pod kiosk?',
              badge: 'Serba Lengkap',
              content: (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>Setiap unit kapsul telah sedia dilengkapi dengan:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Palam kuasa elektrik individu 13A dengan meter pemantauan selamat.</li>
                    <li>Akses jalur lebar Wi-Fi tanpa wayar percuma di seluruh kawasan hab.</li>
                    <li>Sistem paparan papan tanda rasmi serta terminal penerimaan DuitNow QR digital.</li>
                    <li>Akses kepada fasiliti tandas, surau, tempat parkir pelanggan, dan kawalan keselamatan hab 24 jam.</li>
                  </ul>
                </div>
              )
            },
            {
              id: 'process',
              title: 'Berapa lamakah tempoh semakan dan bagaimana tawaran disahkan?',
              badge: '48 Jam',
              content: (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Permohonan disemak oleh jawatankuasa urusetia UMK dalam masa <strong>48 jam waktu bekerja</strong>.
                  </p>
                  <p>
                    Sebaik diluluskan, status penjejak permohonan dalam papan pemuka akan bertukar kepada <em>'Diluluskan'</em> dan Surat Tawaran Digital rasmi bersekuriti kod QR boleh dijana serta ditandatangani secara digital terus di dalam sistem.
                  </p>
                </div>
              )
            }
          ]}
        />
      </div>

    </div>
  );
};
