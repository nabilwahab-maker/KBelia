import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  CollisionBehavior,
  useAdvancedMarkerRef,
  useMap,
  useApiLoadingStatus,
  APILoadingStatus
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Store,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Search,
  MessageCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { KelantanDistrict, CapsuleSlot } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface KelantanDistrictsMapProps {
  slots: CapsuleSlot[];
  selectedDistrict: KelantanDistrict;
  onSelectDistrict: (district: KelantanDistrict) => void;
  onOpenBookingForDistrict?: (district: KelantanDistrict, slot?: CapsuleSlot) => void;
  onSelectSlot?: (slot: CapsuleSlot) => void;
}

interface DistrictGeoData {
  district: Exclude<KelantanDistrict, 'Semua Jajahan'>;
  code: string;
  name: string;
  tagline: string;
  lat: number;
  lng: number;
  popularNiche: string;
  terrainType: 'urban' | 'green' | 'coastal';
  mainHubName: string;
}

const KELANTAN_DEFAULT_CENTER = { lat: 5.58, lng: 102.14 };
const KELANTAN_DEFAULT_ZOOM = 8;

// Grounded Kelantan kiosk hub coordinates for the 10 districts
const KELANTAN_DISTRICTS: DistrictGeoData[] = [
  {
    district: 'Tumpat',
    code: 'TPT',
    name: 'Tumpat',
    tagline: 'Zon Pesisir & Warisan Kraf Kelantan',
    popularNiche: 'Makanan Laut, Kraftangan & Dodol',
    lat: 6.2244,
    lng: 102.1319,
    terrainType: 'coastal',
    mainHubName: 'Hub Kraf & Budaya Tumpat (Pantai Sri Tujoh)'
  },
  {
    district: 'Kota Bharu',
    code: 'KBR',
    name: 'Kota Bharu',
    tagline: 'Pusat Pentadbiran & Perdagangan Komersial',
    popularNiche: 'F&B Moden, Butik Batik & Kafe Kiosk',
    lat: 6.1254,
    lng: 102.2386,
    terrainType: 'urban',
    mainHubName: 'Pusat Transformasi Belia Kota Bharu (KB Sentral)'
  },
  {
    district: 'Bachok',
    code: 'BCK',
    name: 'Bachok',
    tagline: 'Hab Kampus UMK Bachok & Eko-Pelancongan',
    popularNiche: 'Servis Mahasiswa, Percetakan & Kopi Pelajar',
    lat: 6.0094,
    lng: 102.4169,
    terrainType: 'coastal',
    mainHubName: 'Hub UMK Kampus Bachok (Zon Keusahawanan)'
  },
  {
    district: 'Pasir Mas',
    code: 'PMS',
    name: 'Pasir Mas',
    tagline: 'Hab Niaga Sempadan & Pasar Tradisi',
    popularNiche: 'Kain Ela, Runcit Borong & Bakeri',
    lat: 6.0425,
    lng: 102.1422,
    terrainType: 'urban',
    mainHubName: 'Hub Niaga Belia Bandar Pasir Mas'
  },
  {
    district: 'Pasir Puteh',
    code: 'PPH',
    name: 'Pasir Puteh',
    tagline: 'Hab Industri Nelayan, Agropreneur & Sempadan Terengganu',
    popularNiche: 'Keropok Lekor, Produk Sejukbeku & Baja',
    lat: 5.8935,
    lng: 102.4785,
    terrainType: 'green',
    mainHubName: 'Hab Agromart Tok Bali'
  },
  {
    district: 'Machang',
    code: 'MCH',
    name: 'Machang',
    tagline: 'Pusat Pengajian Tinggi & Komuniti Setempat',
    popularNiche: 'Peralatan Belajar, F&B & Gajet',
    lat: 5.7647,
    lng: 102.2156,
    terrainType: 'green',
    mainHubName: 'Hab Usahawan Siswa Machang'
  },
  {
    district: 'Tanah Merah',
    code: 'TMR',
    name: 'Tanah Merah',
    tagline: 'Zon Bebas Cukai & Transit Komersial',
    popularNiche: 'Pakaian Sukan, Aksesori Kereta & Logistik',
    lat: 5.8083,
    lng: 102.1497,
    terrainType: 'urban',
    mainHubName: 'Hab Niaga Transit Tanah Merah'
  },
  {
    district: 'Jeli',
    code: 'JLI',
    name: 'Jeli',
    tagline: 'Hab Kampus UMK Jeli & Eko-Teknologi Banjaran Titiwangsa',
    popularNiche: 'Produk Eko-Herba, Madu Kelulut & IT Pelajar',
    lat: 5.7445,
    lng: 101.8697,
    terrainType: 'green',
    mainHubName: 'Hub Komuniti Keusahawanan Jeli (UMK Jeli)'
  },
  {
    district: 'Kuala Krai',
    code: 'KKR',
    name: 'Kuala Krai',
    tagline: 'Hab Agrotek, Perkayuan & Pertemuan Sungai Kelantan',
    popularNiche: 'Pertanian Cendawan, Bengkel Membaiki & Runcit',
    lat: 5.5308,
    lng: 102.2019,
    terrainType: 'green',
    mainHubName: 'Hab Agrotek Kuala Krai'
  },
  {
    district: 'Gua Musang',
    code: 'GMS',
    name: 'Gua Musang',
    tagline: 'Gerbang Selatan, Agropreneur Ladang Luas & Pelancongan Gua',
    popularNiche: 'Agro Buah-buahan, Kembara Gua & Minuman Segar',
    lat: 4.8842,
    lng: 101.9647,
    terrainType: 'green',
    mainHubName: 'Hab Komersial Bandar Gua Musang'
  }
];

interface DistrictStats {
  total: number;
  available: number;
  occupied: number;
  reservedOrMaintenance: number;
  minMonthlyRate: number;
  districtSlots: CapsuleSlot[];
}

interface HubMarkerProps {
  geo: DistrictGeoData;
  stats: DistrictStats;
  isSelected: boolean;
  isInfoOpen: boolean;
  zIndex: number;
  onSelect: (district: KelantanDistrict) => void;
  onCloseInfo: () => void;
  onBookHub: (district: KelantanDistrict, firstAvailable?: CapsuleSlot) => void;
}

const HubAdvancedMarker: React.FC<HubMarkerProps> = ({
  geo,
  stats,
  isSelected,
  isInfoOpen,
  zIndex,
  onSelect,
  onCloseInfo,
  onBookHub
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const firstAvailable = stats.districtSlots.find((s) => s.status === 'available');

  const pinColors = isSelected
    ? { background: '#EA4335', borderColor: '#B31412', glyphColor: '#FFFFFF', scale: 1.25 }
    : stats.available > 0
      ? { background: '#059669', borderColor: '#047857', glyphColor: '#FFFFFF', scale: 1.08 }
      : stats.total > 0
        ? { background: '#2563EB', borderColor: '#1D4ED8', glyphColor: '#FFFFFF', scale: 1.0 }
        : { background: '#64748B', borderColor: '#475569', glyphColor: '#FFFFFF', scale: 0.95 };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: geo.lat, lng: geo.lng }}
        zIndex={zIndex}
        title={`${geo.mainHubName} (${stats.available} tersedia)`}
        collisionBehavior={
          isSelected
            ? CollisionBehavior.REQUIRED
            : CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        }
        onClick={() => onSelect(geo.district)}
      >
        <Pin
          background={pinColors.background}
          borderColor={pinColors.borderColor}
          glyphColor={pinColors.glyphColor}
          glyphText={String(stats.available)}
          scale={pinColors.scale}
        />
      </AdvancedMarker>

      {isInfoOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={290} onCloseClick={onCloseInfo}>
          <div className="p-1 text-slate-900 space-y-2 min-w-[220px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Jajahan {geo.name} ({geo.code})
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">
                {geo.mainHubName}
              </h4>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs bg-slate-100 rounded-lg px-2.5 py-1.5">
              <span>
                <strong className="text-emerald-700">{stats.available}</strong> tersedia /{' '}
                <strong>{stats.total}</strong> unit
              </span>
              <span className="font-bold text-slate-800">
                RM{stats.minMonthlyRate}/bln
              </span>
            </div>

            <button
              type="button"
              onClick={() => onBookHub(geo.district, firstAvailable)}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {stats.available > 0 ? `Mohon Kiosk (${geo.name})` : `Lihat Hab ${geo.name}`}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapCameraController: React.FC<{
  selectedDistrict: KelantanDistrict;
  resetSignal: number;
  zoomStepSignal: { delta: number; seq: number } | null;
}> = ({ selectedDistrict, resetSignal, zoomStepSignal }) => {
  const map = useMap();

  const fitAllKelantan = useCallback(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.LatLngBounds) return;
    const bounds = new google.maps.LatLngBounds();
    KELANTAN_DISTRICTS.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
    map.fitBounds(bounds, { top: 48, right: 36, bottom: 48, left: 36 });
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (selectedDistrict === 'Semua Jajahan') {
      fitAllKelantan();
      return;
    }
    const target = KELANTAN_DISTRICTS.find((d) => d.district === selectedDistrict);
    if (target) {
      map.panTo({ lat: target.lat, lng: target.lng });
      const currentZoom = map.getZoom() ?? KELANTAN_DEFAULT_ZOOM;
      if (currentZoom < 11) {
        map.setZoom(12);
      }
    }
  }, [map, selectedDistrict, fitAllKelantan]);

  useEffect(() => {
    if (!map || resetSignal === 0) return;
    fitAllKelantan();
  }, [map, resetSignal, fitAllKelantan]);

  useEffect(() => {
    if (!map || !zoomStepSignal) return;
    const current = map.getZoom() ?? KELANTAN_DEFAULT_ZOOM;
    const next = Math.min(18, Math.max(7, current + zoomStepSignal.delta));
    map.setZoom(next);
  }, [map, zoomStepSignal]);

  return null;
};

interface LiveMapCanvasProps {
  mapTypeId: 'roadmap' | 'terrain' | 'hybrid';
  selectedDistrict: KelantanDistrict;
  infoWindowDistrict: KelantanDistrict | null;
  districtStatsMap: Record<string, DistrictStats>;
  resetSignal: number;
  zoomStepSignal: { delta: number; seq: number } | null;
  onMarkerSelect: (district: KelantanDistrict) => void;
  onCloseInfo: () => void;
  onBookHub: (district: KelantanDistrict, firstAvailable?: CapsuleSlot) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSwitchToGrid: () => void;
}

const LiveMapCanvas: React.FC<LiveMapCanvasProps> = ({
  mapTypeId,
  selectedDistrict,
  infoWindowDistrict,
  districtStatsMap,
  resetSignal,
  zoomStepSignal,
  onMarkerSelect,
  onCloseInfo,
  onBookHub,
  onZoomIn,
  onZoomOut,
  onResetView,
  onSwitchToGrid
}) => {
  const apiStatus = useApiLoadingStatus();

  const sortedDistricts = useMemo(
    () => [...KELANTAN_DISTRICTS].sort((a, b) => b.lat - a.lat),
    []
  );

  if (apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="w-full h-[460px] sm:h-[520px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="max-w-md space-y-1">
          <h4 className="text-base font-bold text-black dark:text-white">
            Paparan Peta Langsung Tidak Dapat Dimuatkan
          </h4>
          <p className="text-sm text-black/75 dark:text-white/80">
            Anda masih boleh memilih mana-mana jajahan melalui cip di atas untuk menyemak unit kiosk pada panel sisi atau bertukar ke mod senarai.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToGrid}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          Buka Mod Senarai Jajahan
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[520px]">
      {apiStatus !== APILoadingStatus.LOADED && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xs pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-bold text-black dark:text-white">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Memuatkan Google Maps Kelantan...</span>
          </div>
        </div>
      )}

      {/* Top Location Indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl shadow-md border border-slate-300 dark:border-slate-600 text-sm max-w-[calc(100%-5rem)]">
        <MapPin className="w-4 h-4 text-[#EA4335] shrink-0" />
        <span className="font-bold text-black dark:text-white truncate">
          {selectedDistrict === 'Semua Jajahan'
            ? 'Kelantan, Malaysia (10 Hab Kiosk)'
            : `${selectedDistrict}, Kelantan`}
        </span>
      </div>

      {/* Floating Zoom & Reset Controls */}
      <div className="absolute bottom-24 right-3 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zum Masuk"
          aria-label="Zum Masuk"
          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-black dark:text-white shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zum Keluar"
          aria-label="Zum Keluar"
          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-black dark:text-white shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onResetView}
          title="Pusat Peta Seluruh Kelantan"
          aria-label="Pusat Peta Seluruh Kelantan"
          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-black dark:text-white shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={KELANTAN_DEFAULT_CENTER}
        defaultZoom={KELANTAN_DEFAULT_ZOOM}
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapCameraController
          selectedDistrict={selectedDistrict}
          resetSignal={resetSignal}
          zoomStepSignal={zoomStepSignal}
        />

        {sortedDistricts.map((geo, idx) => {
          const isSelected = selectedDistrict === geo.district;
          const stats = districtStatsMap[geo.district];
          return (
            <HubAdvancedMarker
              key={geo.code}
              geo={geo}
              stats={stats}
              isSelected={isSelected}
              isInfoOpen={infoWindowDistrict === geo.district}
              zIndex={isSelected ? 1000 : idx + 1}
              onSelect={onMarkerSelect}
              onCloseInfo={onCloseInfo}
              onBookHub={onBookHub}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
};

export const KelantanDistrictsMap: React.FC<KelantanDistrictsMapProps> = ({
  slots,
  selectedDistrict,
  onSelectDistrict,
  onOpenBookingForDistrict,
  onSelectSlot
}) => {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'terrain' | 'hybrid'>('roadmap');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('');
  const [infoWindowDistrict, setInfoWindowDistrict] = useState<KelantanDistrict | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoomStepSignal, setZoomStepSignal] = useState<{ delta: number; seq: number } | null>(null);

  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

  // Compute live statistics per district from real slots array
  const districtStatsMap = useMemo(() => {
    const record: Record<string, DistrictStats> = {};
    KELANTAN_DISTRICTS.forEach((geo) => {
      const districtSlots = (slots || []).filter((s) => s.district === geo.district);
      const available = districtSlots.filter((s) => s.status === 'available').length;
      const occupied = districtSlots.filter((s) => s.status === 'occupied').length;
      const reservedOrMaintenance = districtSlots.filter(
        (s) => s.status === 'reserved' || s.status === 'maintenance'
      ).length;
      const rates = districtSlots
        .map((s) => Number(s.monthlyRate))
        .filter((r) => Number.isFinite(r) && r > 0);
      const minMonthlyRate = rates.length > 0 ? Math.min(...rates) : 150;

      record[geo.district] = {
        total: districtSlots.length,
        available,
        occupied,
        reservedOrMaintenance,
        minMonthlyRate,
        districtSlots
      };
    });
    return record;
  }, [slots]);

  const activeDistrictData = useMemo(() => {
    if (selectedDistrict !== 'Semua Jajahan') {
      return KELANTAN_DISTRICTS.find((d) => d.district === selectedDistrict) || KELANTAN_DISTRICTS[1];
    }
    return KELANTAN_DISTRICTS[1]; // Kota Bharu as default detail focus when viewing all Kelantan
  }, [selectedDistrict]);

  const activeStats = districtStatsMap[activeDistrictData.district];

  const filteredDistrictChips = useMemo(() => {
    const q = searchDistrictQuery.trim().toLowerCase();
    if (!q) return KELANTAN_DISTRICTS;
    return KELANTAN_DISTRICTS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.mainHubName.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.popularNiche.toLowerCase().includes(q)
    );
  }, [searchDistrictQuery]);

  const handleSelectDistrictWithInfo = (district: KelantanDistrict) => {
    onSelectDistrict(district);
    setInfoWindowDistrict(district === 'Semua Jajahan' ? null : district);
  };

  const handleBookHub = (district: KelantanDistrict, specificSlot?: CapsuleSlot) => {
    onSelectDistrict(district);
    if (specificSlot && onSelectSlot) {
      onSelectSlot(specificSlot);
      return;
    }
    if (onOpenBookingForDistrict) {
      onOpenBookingForDistrict(district, specificSlot);
    }
  };

  const totalAvailableAll = useMemo(
    () => (slots || []).filter((s) => s.status === 'available').length,
    [slots]
  );

  return (
    <div className="relative rounded-3xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-5 sm:p-7 shadow-xs overflow-hidden w-full min-w-0 transition-colors">
      {/* 1. Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-300 dark:border-slate-600">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-bold uppercase tracking-wider text-black dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>Google Maps Langsung</span>
            </span>
            <span className="text-black/35 dark:text-white/35">•</span>
            <span className="text-sm text-black/75 dark:text-white/80 font-medium">
              {totalAvailableAll} Unit Tersedia di Seluruh Kelantan
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            Peta Hab Kiosk &amp; Kekosongan Unit Kelantan
          </h2>
          <p className="text-sm sm:text-[0.9375rem] text-black/75 dark:text-white/80 mt-0.5">
            Klik pin lokasi hab pada peta Google Maps atau pilih jajahan untuk melihat butiran unit dan memohon tapak kiosk.
          </p>
        </div>

        {/* Layer & View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'map' && (
            <div className="inline-flex items-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold">
              <button
                type="button"
                onClick={() => setMapTypeId('roadmap')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapTypeId === 'roadmap'
                    ? 'bg-white dark:bg-slate-800 text-black dark:text-white/90 shadow-2xs'
                    : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                }`}
              >
                Peta Jalan
              </button>
              <button
                type="button"
                onClick={() => setMapTypeId('terrain')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapTypeId === 'terrain'
                    ? 'bg-white dark:bg-slate-800 text-black dark:text-white/90 shadow-2xs'
                    : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                }`}
              >
                Rupa Bumi
              </button>
              <button
                type="button"
                onClick={() => setMapTypeId('hybrid')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapTypeId === 'hybrid'
                    ? 'bg-white dark:bg-slate-800 text-black dark:text-white/90 shadow-2xs'
                    : 'text-black/75 dark:text-white/75 hover:text-black dark:hover:text-white'
                }`}
              >
                Satelit
              </button>
            </div>
          )}

          {/* Map vs Grid Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-800 text-black dark:text-white/90 shadow-2xs'
                  : 'text-black/75 dark:text-white/75'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-black dark:text-white/90 shadow-2xs'
                  : 'text-black/75 dark:text-white/75'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Senarai</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Fast Jajahan Chips */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama jajahan, hab kiosk atau kategori produk..."
              value={searchDistrictQuery}
              onChange={(e) => setSearchDistrictQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[0.9375rem] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors dark:focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                onSelectDistrict('Semua Jajahan');
                setInfoWindowDistrict(null);
                setResetSignal((s) => s + 1);
              }}
              className={`px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                selectedDistrict === 'Semua Jajahan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600'
              }`}
            >
              Seluruh Kelantan
            </button>
          </div>
        </div>

        {/* Jajahan Fast Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-sm">
          {filteredDistrictChips.map((geo) => {
            const isSelected = selectedDistrict === geo.district;
            const stats = districtStatsMap[geo.district];
            return (
              <button
                key={geo.code}
                type="button"
                onClick={() => handleSelectDistrictWithInfo(geo.district)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 dark:ring-blue-400/30'
                    : 'bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected
                      ? 'bg-white'
                      : stats.available > 0
                        ? 'bg-emerald-500'
                        : stats.total > 0
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                  }`}
                />
                <span>{geo.name}</span>
                <span
                  className={`text-[0.8125rem] px-2 py-0.5 rounded-full tabular-nums ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-white dark:bg-slate-800 text-black dark:text-white'
                  }`}
                >
                  {stats.available}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Embedded Google Maps + Side Detail Panel */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch mt-4 w-full min-w-0">
          {/* Left Column: Live Google Map (7 Cols) */}
          <div className="xl:col-span-7 flex flex-col w-full min-w-0">
            <div className="relative w-full rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-600 shadow-md bg-slate-100 dark:bg-slate-900 flex flex-col">
              {mapsApiKey ? (
                <APIProvider
                  apiKey={mapsApiKey}
                  libraries={['marker']}
                  language={language === 'en' ? 'en' : 'ms'}
                  region="MY"
                >
                  <LiveMapCanvas
                    mapTypeId={mapTypeId}
                    selectedDistrict={selectedDistrict}
                    infoWindowDistrict={infoWindowDistrict}
                    districtStatsMap={districtStatsMap}
                    resetSignal={resetSignal}
                    zoomStepSignal={zoomStepSignal}
                    onMarkerSelect={handleSelectDistrictWithInfo}
                    onCloseInfo={() => setInfoWindowDistrict(null)}
                    onBookHub={handleBookHub}
                    onZoomIn={() =>
                      setZoomStepSignal((prev) => ({ delta: 1, seq: (prev?.seq ?? 0) + 1 }))
                    }
                    onZoomOut={() =>
                      setZoomStepSignal((prev) => ({ delta: -1, seq: (prev?.seq ?? 0) + 1 }))
                    }
                    onResetView={() => {
                      onSelectDistrict('Semua Jajahan');
                      setInfoWindowDistrict(null);
                      setResetSignal((s) => s + 1);
                    }}
                    onSwitchToGrid={() => setViewMode('grid')}
                  />
                </APIProvider>
              ) : (
                <div className="w-full h-[460px] sm:h-[520px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-base font-bold text-black dark:text-white">
                      Peta Google Maps Belum Dikonfigurasi
                    </h4>
                    <p className="text-sm text-black/75 dark:text-white/80">
                      Kunci API peta belum tersedia dalam persekitaran ini. Anda masih boleh meneroka semua hab dan unit kiosk melalui panel butiran di sisi atau mod senarai.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer"
                  >
                    Tukar ke Mod Senarai
                  </button>
                </div>
              )}

              {/* Map Legend Footer */}
              <div className="w-full flex flex-wrap items-center justify-between text-[0.8125rem] text-black dark:text-white px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-600 gap-2">
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335] inline-block ring-2 ring-red-200 dark:ring-red-900" />
                    Hab Dipilih
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    Ada Kekosongan Unit
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    Beroperasi Penuh
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                    Zon Pengembangan
                  </span>
                </div>
                <span className="text-[0.8125rem] text-black/75 dark:text-white/80">
                  Klik pin untuk info &amp; permohonan pantas
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Side Location & Slot Availability Panel (5 Cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4 w-full min-w-0">
            <div className="h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-4">
                {/* Hub Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-600">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.8125rem] font-bold bg-blue-50 text-black dark:bg-blue-950/60 dark:text-white border border-blue-200 dark:border-blue-800/70 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#EA4335]" />
                      <span>
                        Jajahan {activeDistrictData.name} ({activeDistrictData.code})
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-black dark:text-white leading-tight">
                      {activeDistrictData.mainHubName}
                    </h3>
                    <p className="text-sm sm:text-[0.9375rem] text-black/75 dark:text-white/80 mt-1">
                      {activeDistrictData.tagline}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/70">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Live Availability Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                    <span className="text-[0.8125rem] font-extrabold uppercase tracking-wider text-black/75 dark:text-white/80 block mb-0.5">
                      Kekosongan Unit
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-[1.75rem] font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {activeStats.available}
                      </span>
                      <span className="text-sm text-black/75 dark:text-white/80 font-semibold">
                        / {activeStats.total} unit
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                    <span className="text-[0.8125rem] font-extrabold uppercase tracking-wider text-black/75 dark:text-white/80 block mb-0.5">
                      Kadar Bermula
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-[1.75rem] font-black text-black dark:text-white tabular-nums">
                        RM {activeStats.minMonthlyRate}
                      </span>
                      <span className="text-sm text-black/75 dark:text-white/80 font-semibold">
                        / bln
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Unit List inside Selected Hub */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-black dark:text-white">
                    <span>Senarai Unit Kiosk di Hab Ini</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeDistrictData.lat},${activeDistrictData.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {activeStats.districtSlots.length > 0 ? (
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {activeStats.districtSlots.map((slot) => {
                        const isAvail = slot.status === 'available';
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                                  {slot.code}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    isAvail
                                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {isAvail ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  <span>
                                    {isAvail
                                      ? 'Tersedia'
                                      : slot.status === 'occupied'
                                        ? 'Beroperasi'
                                        : 'Dalam Proses'}
                                  </span>
                                </span>
                              </div>
                              <div className="text-sm font-bold text-black dark:text-white truncate mt-0.5">
                                {slot.name}
                              </div>
                              <div className="text-xs text-black/70 dark:text-white/75 truncate">
                                {slot.size} · RM{slot.monthlyRate}/bln
                              </div>
                            </div>

                            {isAvail && (
                              <button
                                type="button"
                                onClick={() => handleBookHub(activeDistrictData.district, slot)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
                              >
                                Mohon
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-black/75 dark:text-white/80">
                      Tiada unit kiosk didaftarkan secara aktif di jajahan ini buat masa ini. Anda masih boleh menghantar permohonan minat bagi pembukaan batch seterusnya.
                    </div>
                  )}
                </div>

                {/* Focus Niche */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-black dark:text-white">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Tumpuan Produk Jajahan:</span>
                  </div>
                  <p className="text-sm text-black dark:text-white leading-relaxed font-medium">
                    {activeDistrictData.popularNiche}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleBookHub(
                      activeDistrictData.district,
                      activeStats.districtSlots.find((s) => s.status === 'available')
                    )
                  }
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-white" />
                  <span>Mohon Kiosk di Jajahan {activeDistrictData.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/601120508890?text=${encodeURIComponent(
                    `Salam Pegawai Hab ${activeDistrictData.name}, saya berminat untuk membuat permohonan kiosk di ${activeDistrictData.mainHubName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>WhatsApp Pegawai Hab Bertugas</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View Mode: 10 Jajahan Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3.5 mt-5 w-full min-w-0">
          {KELANTAN_DISTRICTS.map((geo) => {
            const isSelected = selectedDistrict === geo.district;
            const stats = districtStatsMap[geo.district];

            return (
              <div
                key={geo.code}
                onClick={() => {
                  handleSelectDistrictWithInfo(geo.district);
                  setViewMode('map');
                }}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 shadow-sm -translate-y-0.5'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.8125rem] font-bold uppercase tracking-wider text-black/75 dark:text-white/80">
                      {geo.code}
                    </span>
                    <span
                      className={`text-[0.8125rem] font-bold tabular-nums px-2 py-0.5 rounded-full ${
                        stats.available > 0
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {stats.available} kosong
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-black dark:text-white mb-1">
                    {geo.name}
                  </h4>
                  <p className="text-sm text-black/75 dark:text-white/80 line-clamp-2 mb-3">
                    {geo.mainHubName}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between text-sm">
                  <span className="text-black/75 dark:text-white/80 font-medium">
                    RM{stats.minMonthlyRate} /bln
                  </span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 inline-flex items-center gap-0.5">
                    Lihat di Peta <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
