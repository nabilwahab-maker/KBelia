import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ArrowRight,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { KelantanDistrict, CapsuleSlot } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getDashboardRole, getRoleTheme } from '../utils/roleTheme';
import { ReferenceTableToolbar } from './ReferenceTableKit';
import {
  DEFAULT_SORT_VALUE,
  buildStandardSortOptions,
  getModifiedTimestamp,
  sortRecords
} from '../utils/sortUtils';

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
    popularNiche: 'Makanan & Minuman Moden, Butik Batik & Kafe Kiosk',
    lat: 6.1254,
    lng: 102.2386,
    terrainType: 'urban',
    mainHubName: 'Pusat Transformasi Belia Kota Bharu (Kota Bharu Sentral)'
  },
  {
    district: 'Bachok',
    code: 'BCK',
    name: 'Bachok',
    tagline: 'Hab Usahawan Bachok & Eko-Pelancongan',
    popularNiche: 'Servis Komuniti, Percetakan & Kopi Artisan',
    lat: 6.0094,
    lng: 102.4169,
    terrainType: 'coastal',
    mainHubName: 'Hab Usahawan Bachok (Zon Keusahawanan)'
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
    popularNiche: 'Peralatan Belajar, Makanan, Minuman & Gajet',
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
    tagline: 'Hab Usahawan Jeli & Eko-Teknologi Banjaran Titiwangsa',
    popularNiche: 'Produk Eko-Herba, Madu Kelulut & Servis Digital',
    lat: 5.7445,
    lng: 101.8697,
    terrainType: 'green',
    mainHubName: 'Hab Usahawan Jeli (Zon Komuniti)'
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
  latestModifiedMs: number;
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
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
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
              <div className="text-[0.8125rem] font-bold uppercase tracking-wider text-blue-700">
                Jajahan {geo.name}
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">
                {geo.mainHubName}
              </h4>
            </div>

            <div className="flex items-center justify-between gap-2 text-[0.8125rem] bg-slate-100 rounded-lg px-2.5 py-1.5">
              <span>
                <strong className="text-emerald-700">{stats.available}</strong> unit tersedia
              </span>
              <span className="font-bold text-slate-800">
                RM{stats.minMonthlyRate}/bulan
              </span>
            </div>

            <button
              type="button"
              onClick={() => onBookHub(geo.district, firstAvailable)}
              className={`w-full py-2 px-3 text-[0.8125rem] ${roleTheme.primaryButtonClass}`}
            >
              {stats.available > 0 ? 'Mohon Kiosk' : 'Lihat Hab'}
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
  visibleDistricts: DistrictGeoData[];
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
  visibleDistricts,
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
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const apiStatus = useApiLoadingStatus();

  const sortedDistricts = useMemo(
    () => [...visibleDistricts].sort((a, b) => b.lat - a.lat),
    [visibleDistricts]
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
            Anda masih boleh memilih mana-mana jajahan melalui menu Penapis di atas untuk menyemak unit kiosk pada panel sisi atau bertukar ke mod senarai.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToGrid}
          className={`px-4 py-2 text-sm ${roleTheme.primaryButtonClass}`}
        >
          Mod Senarai
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
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm max-w-[calc(100%-5rem)]">
        <MapPin className="w-3.5 h-3.5 text-[#EA4335] shrink-0" />
        <span className="font-semibold text-black dark:text-white truncate">
          {selectedDistrict === 'Semua Jajahan'
            ? `Kelantan (${visibleDistricts.length} Hab Kiosk)`
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
          className="w-9 h-9 rounded-xl bg-white/95 dark:bg-zinc-900/95 hover:bg-slate-50 dark:hover:bg-zinc-800 text-black dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zum Keluar"
          aria-label="Zum Keluar"
          className="w-9 h-9 rounded-xl bg-white/95 dark:bg-zinc-900/95 hover:bg-slate-50 dark:hover:bg-zinc-800 text-black dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onResetView}
          title="Pusat Peta Seluruh Kelantan"
          aria-label="Pusat Peta Seluruh Kelantan"
          className="w-9 h-9 rounded-xl bg-white/95 dark:bg-zinc-900/95 hover:bg-slate-50 dark:hover:bg-zinc-800 text-black dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
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
  const { isAdmin, isMentor } = useAuth();
  const roleTheme = getRoleTheme(getDashboardRole(isAdmin, isMentor));
  const isEn = language === 'en';
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'terrain' | 'hybrid'>('roadmap');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'full' | 'expansion'>('all');
  const [selectedTerrain, setSelectedTerrain] = useState<'all' | 'urban' | 'coastal' | 'green'>('all');
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
  const [infoWindowDistrict, setInfoWindowDistrict] = useState<KelantanDistrict | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoomStepSignal, setZoomStepSignal] = useState<{ delta: number; seq: number } | null>(null);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isViewMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewMenuOpen]);

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
      const latestModifiedMs = districtSlots.reduce(
        (maxMs, slot) => Math.max(maxMs, getModifiedTimestamp(slot)),
        0
      );

      record[geo.district] = {
        total: districtSlots.length,
        available,
        occupied,
        reservedOrMaintenance,
        minMonthlyRate,
        latestModifiedMs,
        districtSlots
      };
    });
    return record;
  }, [slots]);

  const mapSortOptions = useMemo(
    () =>
      buildStandardSortOptions(
        [
          {
            value: 'available_desc',
            label: isEn ? 'Available Units (Most)' : 'Kekosongan Unit (Terbanyak)'
          },
          {
            value: 'rate_asc',
            label: isEn ? 'Starting Rent (Lowest)' : 'Kadar Sewa (Terendah)'
          }
        ],
        isEn
      ),
    [isEn]
  );

  // Districts matching search query, availability status, and area zone (for map markers)
  const visibleMapDistricts = useMemo(() => {
    const q = searchDistrictQuery.trim().toLowerCase();
    const filtered = KELANTAN_DISTRICTS.filter((d) => {
      const stats = districtStatsMap[d.district];
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.mainHubName.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.popularNiche.toLowerCase().includes(q);

      const matchesAvailability =
        selectedAvailability === 'all' ||
        (selectedAvailability === 'available' && stats.available > 0) ||
        (selectedAvailability === 'full' && stats.total > 0 && stats.available === 0) ||
        (selectedAvailability === 'expansion' && stats.total === 0);

      const matchesTerrain =
        selectedTerrain === 'all' || d.terrainType === selectedTerrain;

      return matchesSearch && matchesAvailability && matchesTerrain;
    });

    return sortRecords(filtered, {
      sortBy,
      getName: (d) => d.name,
      getModified: (d) => districtStatsMap[d.district]?.latestModifiedMs || 0,
      customCompare: (a, b, mode) => {
        const statsA = districtStatsMap[a.district];
        const statsB = districtStatsMap[b.district];
        if (mode === 'available_desc') return statsB.available - statsA.available;
        if (mode === 'rate_asc') return statsA.minMonthlyRate - statsB.minMonthlyRate;
        return null;
      }
    });
  }, [searchDistrictQuery, selectedAvailability, selectedTerrain, districtStatsMap, sortBy]);

  // Districts displayed in Grid/List view (also respects explicit district filter, showing up to 10 simultaneously)
  const visibleGridDistricts = useMemo(() => {
    if (selectedDistrict === 'Semua Jajahan') return visibleMapDistricts;
    return visibleMapDistricts.filter((d) => d.district === selectedDistrict);
  }, [visibleMapDistricts, selectedDistrict]);

  const activeDistrictData = useMemo(() => {
    if (selectedDistrict !== 'Semua Jajahan') {
      return KELANTAN_DISTRICTS.find((d) => d.district === selectedDistrict) || KELANTAN_DISTRICTS[1];
    }
    if (visibleMapDistricts.length > 0) {
      return (
        visibleMapDistricts.find((d) => d.district === 'Kota Bharu') || visibleMapDistricts[0]
      );
    }
    return KELANTAN_DISTRICTS[1]; // Kota Bharu as default detail focus when viewing all Kelantan
  }, [selectedDistrict, visibleMapDistricts]);

  const activeStats = districtStatsMap[activeDistrictData.district];
  const availableDistrictSlots = useMemo(
    () => activeStats.districtSlots.filter((slot) => slot.status === 'available'),
    [activeStats.districtSlots]
  );

  const activeSelectedSlot = useMemo(() => {
    if (availableDistrictSlots.length === 0) return undefined;
    return (
      availableDistrictSlots.find((slot) => slot.id === selectedSlotId) ||
      availableDistrictSlots[0]
    );
  }, [availableDistrictSlots, selectedSlotId]);

  const activeMapFilterCount =
    (selectedDistrict !== 'Semua Jajahan' ? 1 : 0) +
    (selectedAvailability !== 'all' ? 1 : 0) +
    (selectedTerrain !== 'all' ? 1 : 0) +
    (sortBy !== DEFAULT_SORT_VALUE ? 1 : 0);

  const handleSelectDistrictWithInfo = (district: KelantanDistrict) => {
    onSelectDistrict(district);
    setInfoWindowDistrict(district === 'Semua Jajahan' ? null : district);
  };

  const handleResetMapFilters = () => {
    setSearchDistrictQuery('');
    setSelectedAvailability('all');
    setSelectedTerrain('all');
    setSortBy(DEFAULT_SORT_VALUE);
    onSelectDistrict('Semua Jajahan');
    setInfoWindowDistrict(null);
    setResetSignal((s) => s + 1);
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

  const mapLayerOptions: Array<{ value: 'roadmap' | 'terrain' | 'hybrid'; label: string }> = [
    { value: 'roadmap', label: isEn ? 'Road' : 'Jalan' },
    { value: 'terrain', label: isEn ? 'Terrain' : 'Rupa Bumi' },
    { value: 'hybrid', label: isEn ? 'Satellite' : 'Satelit' }
  ];
  const currentLayerLabel =
    mapLayerOptions.find((opt) => opt.value === mapTypeId)?.label || (isEn ? 'Road' : 'Jalan');
  const unifiedControlLabel =
    viewMode === 'map'
      ? isEn
        ? `View: Map · ${currentLayerLabel}`
        : `Paparan: Peta · ${currentLayerLabel}`
      : isEn
        ? 'View: List'
        : 'Paparan: Senarai';

  return (
    <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-5 sm:p-6 shadow-2xs overflow-visible w-full min-w-0 transition-colors">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-700">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/65">
            <MapPin className="w-3.5 h-3.5 text-[#EA4335] shrink-0" />
            <span>Google Maps</span>
          </span>

          <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tracking-tight mt-0.5">
            Peta Hab Kios
          </h2>
        </div>

        {/* Single Unified View & Map Layer Control */}
        <div className="relative shrink-0" ref={viewMenuRef}>
          <button
            type="button"
            onClick={() => setIsViewMenuOpen((prev) => !prev)}
            aria-expanded={isViewMenuOpen}
            aria-haspopup="menu"
            className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold text-black dark:text-white inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{unifiedControlLabel}</span>
            <ChevronDown
              className={`w-4 h-4 text-black/50 dark:text-white/55 transition-transform ${
                isViewMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isViewMenuOpen && (
            <div
              role="menu"
              className="animate-popover-enter absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl p-2 z-40 text-left space-y-2"
            >
              <div>
                <div className="px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-black/45 dark:text-white/50">
                  {isEn ? 'Display Mode' : 'Mod Paparan'}
                </div>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={viewMode === 'map'}
                  onClick={() => {
                    setViewMode('map');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    viewMode === 'map'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
                  }`}
                >
                  <span>{isEn ? 'Interactive Map' : 'Peta Interaktif'}</span>
                  {viewMode === 'map' && <Check className="w-4 h-4 shrink-0" />}
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={viewMode === 'grid'}
                  onClick={() => {
                    setViewMode('grid');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-colors mt-0.5 ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
                  }`}
                >
                  <span>{isEn ? 'District List' : 'Senarai Jajahan'}</span>
                  {viewMode === 'grid' && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700">
                <div className="px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-black/45 dark:text-white/50">
                  {isEn ? 'Map Layer' : 'Lapisan Peta'}
                </div>
                {mapLayerOptions.map((layer) => {
                  const isActiveLayer = viewMode === 'map' && mapTypeId === layer.value;
                  return (
                    <button
                      key={layer.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActiveLayer}
                      onClick={() => {
                        setMapTypeId(layer.value);
                        setViewMode('map');
                        setIsViewMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-colors mt-0.5 ${
                        isActiveLayer
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium'
                      }`}
                    >
                      <span>{layer.label}</span>
                      {isActiveLayer && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Integrated Search Bar & Single Filter Icon */}
      <div className="-mx-5 sm:-mx-6 px-1.5 sm:px-2">
        <ReferenceTableToolbar
          searchValue={searchDistrictQuery}
          onSearchChange={setSearchDistrictQuery}
          searchPlaceholder={
            isEn ? 'Search district or kiosk hub...' : 'Cari jajahan atau hab kiosk...'
          }
          filterCount={activeMapFilterCount}
          onResetFilters={handleResetMapFilters}
          sortOptions={mapSortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortLabel={isEn ? 'Sort By' : 'Susun Mengikut'}
          filterContent={
            <>
              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'District' : 'Jajahan'}</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    const nextDistrict = e.target.value as KelantanDistrict;
                    handleSelectDistrictWithInfo(nextDistrict);
                    if (nextDistrict === 'Semua Jajahan') {
                      setResetSignal((s) => s + 1);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="Semua Jajahan">
                    {isEn ? 'All Kelantan Districts' : 'Semua Jajahan Kelantan'}
                  </option>
                  {KELANTAN_DISTRICTS.map((geo) => (
                    <option key={geo.code} value={geo.district}>
                      {geo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Availability Status' : 'Status Kekosongan'}</span>
                </label>
                <select
                  value={selectedAvailability}
                  onChange={(e) =>
                    setSelectedAvailability(
                      e.target.value as 'all' | 'available' | 'full' | 'expansion'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="all">{isEn ? 'All Statuses' : 'Semua Status'}</option>
                  <option value="available">
                    {isEn ? 'Has Available Units' : 'Ada Kekosongan Unit'}
                  </option>
                  <option value="full">
                    {isEn ? 'Fully Occupied' : 'Beroperasi Penuh'}
                  </option>
                  <option value="expansion">
                    {isEn ? 'Expansion Zone' : 'Zon Pengembangan'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-black/70 dark:text-white/75 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Area Zone' : 'Zon Kawasan'}</span>
                </label>
                <select
                  value={selectedTerrain}
                  onChange={(e) =>
                    setSelectedTerrain(
                      e.target.value as 'all' | 'urban' | 'coastal' | 'green'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-black dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="all">{isEn ? 'All Zones' : 'Semua Zon'}</option>
                  <option value="urban">
                    {isEn ? 'Urban & Commercial' : 'Bandar & Komersial'}
                  </option>
                  <option value="coastal">
                    {isEn ? 'Coastal & Youth Hub' : 'Pesisir & Hab Belia'}
                  </option>
                  <option value="green">
                    {isEn ? 'Agro & Eco-Tourism' : 'Agro & Eko-Pelancongan'}
                  </option>
                </select>
              </div>
            </>
          }
        />
      </div>

      {/* 3. Main Embedded Google Maps + Side Detail Panel */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch mt-5 w-full min-w-0">
          {/* Left Column: Live Google Map (7 Cols) */}
          <div className="xl:col-span-7 flex flex-col w-full min-w-0">
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 flex flex-col">
              {mapsApiKey ? (
                <APIProvider
                  apiKey={mapsApiKey}
                  libraries={['marker']}
                  language={language === 'en' ? 'en' : 'ms'}
                  region="MY"
                >
                  <LiveMapCanvas
                    mapTypeId={mapTypeId}
                    visibleDistricts={visibleMapDistricts}
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
                <div className="w-full h-[460px] sm:h-[520px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-zinc-950 gap-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${roleTheme.activeMiniBtnClass}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-base font-bold text-black dark:text-white">
                      Peta Google Maps Belum Dikonfigurasi
                    </h4>
                    <p className="text-sm text-black/70 dark:text-white/75">
                      Kunci API peta belum tersedia dalam persekitaran ini. Anda masih boleh meneroka semua hab dan unit kiosk melalui panel butiran di sisi atau mod senarai.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm ${roleTheme.primaryButtonClass}`}
                  >
                    Senarai Jajahan
                  </button>
                </div>
              )}

              {/* Map Legend Footer */}
              <div className="w-full flex flex-wrap items-center justify-between text-xs text-black/75 dark:text-white/80 px-4 py-2.5 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#EA4335] inline-block" />
                    Hab Dipilih
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    Ada Kekosongan
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    Beroperasi Penuh
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                    Zon Pengembangan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Side Location & Slot Availability Panel (5 Cols) */}
          <div className="xl:col-span-5 flex flex-col w-full min-w-0">
            <div className="h-full rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                {/* 1. Hub Header */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Jajahan {activeDistrictData.name}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white leading-snug tracking-tight mt-1">
                    {activeDistrictData.mainHubName}
                  </h3>
                  <p className="text-sm text-black/65 dark:text-white/70 mt-1">
                    {activeDistrictData.tagline}
                  </p>
                </div>

                {/* 2. Focus Niche (Modern unboxed accent text right beneath hub title) */}
                <div className="border-l-2 border-blue-600/75 dark:border-blue-400/75 pl-3 py-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                    Tumpuan Produk Jajahan
                  </span>
                  <p className="text-sm font-medium text-black dark:text-white leading-relaxed mt-0.5">
                    {activeDistrictData.popularNiche}
                  </p>
                </div>

                {/* 3. Hairline Availability & Rate Metrics */}
                <div className="grid grid-cols-2 border-y border-slate-200 dark:border-zinc-700 divide-x divide-slate-200 dark:divide-zinc-700 py-3">
                  <div className="pr-3">
                    <span className="text-xs font-semibold text-black/55 dark:text-white/60 block">
                      Kekosongan Unit
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {activeStats.available}
                      </span>
                      <span className="text-xs sm:text-sm text-black/65 dark:text-white/70 font-medium">
                        unit tersedia
                      </span>
                    </div>
                  </div>

                  <div className="pl-4">
                    <span className="text-xs font-semibold text-black/55 dark:text-white/60 block">
                      Kadar Bermula
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-black dark:text-white tabular-nums">
                        RM {activeStats.minMonthlyRate}
                      </span>
                      <span className="text-xs sm:text-sm text-black/65 dark:text-white/70 font-medium">
                        / bulan
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Selectable Available Units inside Selected Hub */}
                <div className="space-y-2">
                  <div className="flex items-center justify-end">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeDistrictData.lat},${activeDistrictData.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {availableDistrictSlots.length > 0 ? (
                    <div
                      role="radiogroup"
                      aria-label={isEn ? 'Select kiosk unit' : 'Pilih unit kiosk'}
                      className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[196px] overflow-y-auto pr-1"
                    >
                      {availableDistrictSlots.map((slot) => {
                        const isSlotSelected = activeSelectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            role="radio"
                            aria-checked={isSlotSelected}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`w-full text-left py-2.5 px-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              isSlotSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/35'
                                : 'hover:bg-slate-50/90 dark:hover:bg-zinc-800/50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span
                                  className={`font-mono font-bold ${
                                    isSlotSelected
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-black dark:text-white'
                                  }`}
                                >
                                  {slot.code}
                                </span>
                                <span className="text-black/35 dark:text-white/35">·</span>
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                  Tersedia
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-black dark:text-white truncate mt-0.5">
                                {slot.name}
                              </div>
                              <div className="text-xs text-black/60 dark:text-white/65 truncate tabular-nums">
                                {slot.size} · RM {slot.monthlyRate}/bln
                              </div>
                            </div>

                            <span
                              aria-hidden="true"
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSlotSelected
                                  ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-500'
                                  : 'border-slate-300 dark:border-zinc-600 bg-transparent'
                              }`}
                            >
                              {isSlotSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-2 text-sm text-black/65 dark:text-white/70">
                      Tiada unit kiosk tersedia di hab ini buat masa ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Single Primary Action CTA */}
              <button
                type="button"
                disabled={!activeSelectedSlot}
                onClick={() =>
                  activeSelectedSlot &&
                  handleBookHub(activeDistrictData.district, activeSelectedSlot)
                }
                className={`w-full py-2.5 px-4 text-sm shadow-2xs flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeSelectedSlot
                    ? roleTheme.primaryButtonClass
                    : 'rounded-xl font-semibold text-black/45 dark:text-white/45 bg-slate-200 dark:bg-zinc-800 cursor-not-allowed'
                }`}
              >
                <span>
                  {activeSelectedSlot
                    ? `Mohon ${activeSelectedSlot.code}`
                    : 'Tiada Unit'}
                </span>
                {activeSelectedSlot && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View Mode: Filtered Jajahan Cards */
        visibleGridDistricts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3.5 mt-5 w-full min-w-0">
            {visibleGridDistricts.map((geo) => {
              const isSelected = selectedDistrict === geo.district;
              const stats = districtStatsMap[geo.district];

              return (
                <div
                  key={geo.code}
                  onClick={() => {
                    handleSelectDistrictWithInfo(geo.district);
                    setViewMode('map');
                  }}
                  className={`cursor-pointer rounded-2xl p-4 transition-colors border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                      <span className="font-semibold text-black/60 dark:text-white/65">
                        {geo.terrainType === 'urban'
                          ? 'Bandar'
                          : geo.terrainType === 'coastal'
                            ? 'Pesisir'
                            : 'Agro'}
                      </span>
                      <span
                        className={`font-bold tabular-nums ${
                          stats.available > 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-black/50 dark:text-white/55'
                        }`}
                      >
                        {stats.available} kosong
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-black dark:text-white mb-1 tracking-tight">
                      {geo.name}
                    </h4>
                    <p className="text-sm text-black/65 dark:text-white/70 line-clamp-2 mb-3">
                      {geo.mainHubName}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-black/70 dark:text-white/75 font-medium tabular-nums">
                      RM {stats.minMonthlyRate}/bln
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
                      Lihat <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 p-8 text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center mx-auto text-slate-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-black dark:text-white">
                Tiada Jajahan Sepadan Ditemui
              </h4>
              <p className="text-sm text-black/65 dark:text-white/70 max-w-md mx-auto">
                Tiada hab jajahan memenuhi kata kunci carian atau penapis yang dipilih.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetMapFilters}
              className={`px-4 py-2 text-sm ${roleTheme.primaryButtonClass}`}
            >
              Set Semula
            </button>
          </div>
        )
      )}
    </div>
  );
};
