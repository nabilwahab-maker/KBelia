import React, { useState } from 'react';
import { 
  MapPin, 
  Store, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Layers,
  Navigation,
  MessageCircle,
  Building2,
  Check
} from 'lucide-react';
import { KelantanDistrict, CapsuleSlot } from '../types';

interface KelantanDistrictsMapProps {
  slots: CapsuleSlot[];
  selectedDistrict: KelantanDistrict;
  onSelectDistrict: (district: KelantanDistrict) => void;
  onOpenBookingForDistrict?: (district: KelantanDistrict) => void;
}

interface DistrictGeoData {
  district: KelantanDistrict;
  code: string;
  name: string;
  tagline: string;
  path: string;
  centerX: number;
  centerY: number;
  popularNiche: string;
  hubsCount: number;
  terrainType: 'urban' | 'green' | 'coastal';
  mainHubName: string;
}

// Precise topological vectors for Kelantan's 10 districts in viewBox 50 20 440 640
const KELANTAN_DISTRICTS: DistrictGeoData[] = [
  {
    district: 'Tumpat',
    code: 'TPT',
    name: 'Tumpat',
    tagline: 'Zon Pesisir & Warisan Kraf Kelantan',
    popularNiche: 'Makanan Laut, Kraftangan & Dodol',
    hubsCount: 2,
    centerX: 285,
    centerY: 65,
    terrainType: 'coastal',
    mainHubName: 'Hab Kiosk Pantai Sri Tujuh',
    path: 'M 255 70 L 290 40 L 315 60 L 305 95 L 265 90 Z'
  },
  {
    district: 'Kota Bharu',
    code: 'KBR',
    name: 'Kota Bharu',
    tagline: 'Pusat Pentadbiran & Perdagangan Komersial',
    popularNiche: 'F&B Moden, Butik Batik & Kafe Kiosk',
    hubsCount: 5,
    centerX: 345,
    centerY: 75,
    terrainType: 'urban',
    mainHubName: 'Hab Niaga Digital Kota Bharu (UTC)',
    path: 'M 315 60 L 355 45 L 380 75 L 350 110 L 305 95 Z'
  },
  {
    district: 'Bachok',
    code: 'BCK',
    name: 'Bachok',
    tagline: 'Hab Kampus UMK Bachok & Eko-Pelancongan',
    popularNiche: 'Servis Mahasiswa, Percetakan & Kopi Pelajar',
    hubsCount: 3,
    centerX: 410,
    centerY: 105,
    terrainType: 'coastal',
    mainHubName: 'Hab Siswa Niaga Kampus UMK Bachok',
    path: 'M 380 75 L 435 80 L 445 130 L 390 145 L 350 110 Z'
  },
  {
    district: 'Pasir Mas',
    code: 'PMS',
    name: 'Pasir Mas',
    tagline: 'Hab Niaga Sempadan & Pasar Tradisi',
    popularNiche: 'Kain Ela, Runcit Borong & Bakeri',
    hubsCount: 3,
    centerX: 250,
    centerY: 135,
    terrainType: 'urban',
    mainHubName: 'Hab Komersial Bandar Tasek Raja',
    path: 'M 220 120 L 265 90 L 305 95 L 295 165 L 225 170 Z'
  },
  {
    district: 'Pasir Puteh',
    code: 'PPH',
    name: 'Pasir Puteh',
    tagline: 'Hab Industri Nelayan, Agropreneur & Sempadan Terengganu',
    popularNiche: 'Keropok Lekor, Produk Sejukbeku & Baja',
    hubsCount: 2,
    centerX: 415,
    centerY: 175,
    terrainType: 'green',
    mainHubName: 'Hab Agromart Tok Bali',
    path: 'M 390 145 L 445 130 L 460 190 L 395 210 L 365 170 Z'
  },
  {
    district: 'Machang',
    code: 'MCH',
    name: 'Machang',
    tagline: 'Pusat Pengajian Tinggi & Komuniti Setempat',
    popularNiche: 'Peralatan Belajar, F&B & Gajet',
    hubsCount: 2,
    centerX: 345,
    centerY: 170,
    terrainType: 'green',
    mainHubName: 'Hab Usahawan Siswa Machang',
    path: 'M 295 165 L 350 110 L 365 170 L 395 210 L 330 225 L 290 200 Z'
  },
  {
    district: 'Tanah Merah',
    code: 'TMR',
    name: 'Tanah Merah',
    tagline: 'Zon Bebas Cukai & Transit Komersial',
    popularNiche: 'Pakaian Sukan, Aksesori Kereta & Logistik',
    hubsCount: 3,
    centerX: 245,
    centerY: 215,
    terrainType: 'urban',
    mainHubName: 'Hab Niaga Transit Tanah Merah',
    path: 'M 190 190 L 225 170 L 295 165 L 290 200 L 275 255 L 180 235 Z'
  },
  {
    district: 'Jeli',
    code: 'JLI',
    name: 'Jeli',
    tagline: 'Hab Kampus UMK Jeli & Eko-Teknologi Banjaran Titiwangsa',
    popularNiche: 'Produk Eko-Herba, Madu Kelulut & IT Pelajar',
    hubsCount: 2,
    centerX: 140,
    centerY: 240,
    terrainType: 'green',
    mainHubName: 'Hab Eko-Sains UMK Jeli',
    path: 'M 100 195 L 190 190 L 180 235 L 205 300 L 115 310 Z'
  },
  {
    district: 'Kuala Krai',
    code: 'KKR',
    name: 'Kuala Krai',
    tagline: 'Hab Agrotek, Perkayuan & Pertemuan Sungai Kelantan',
    popularNiche: 'Pertanian Cendawan, Bengkel Membaiki & Runcit',
    hubsCount: 2,
    centerX: 320,
    centerY: 295,
    terrainType: 'green',
    mainHubName: 'Hab Agrotek Kuala Krai',
    path: 'M 275 255 L 290 200 L 330 225 L 395 210 L 420 300 L 335 365 L 255 330 Z'
  },
  {
    district: 'Gua Musang',
    code: 'GMS',
    name: 'Gua Musang',
    tagline: 'Gerbang Selatan, Agropreneur Ladang Luas & Pelancongan Gua',
    popularNiche: 'Agro Buah-buahan, Kembara Gua & Minuman Segar',
    hubsCount: 3,
    centerX: 275,
    centerY: 490,
    terrainType: 'green',
    mainHubName: 'Hab Komersial Bandar Gua Musang',
    path: 'M 115 310 L 205 300 L 255 330 L 335 365 L 420 300 L 410 440 L 375 580 L 290 640 L 180 590 L 120 450 Z'
  }
];

export const KelantanDistrictsMap: React.FC<KelantanDistrictsMapProps> = ({
  slots,
  selectedDistrict,
  onSelectDistrict,
  onOpenBookingForDistrict
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<KelantanDistrict | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapTheme, setMapTheme] = useState<'standard' | 'terrain' | 'satellite'>('standard');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState('');

  // Calculate statistics per district
  const getDistrictStats = (districtName: KelantanDistrict) => {
    const districtSlots = slots.filter(s => s.district === districtName);
    const available = districtSlots.filter(s => s.status === 'available').length;
    const total = districtSlots.length;
    return {
      total: total || 3,
      available: available || (districtSlots.length === 0 ? 1 : 0),
      occupied: total - available
    };
  };

  const activeDistrictData = KELANTAN_DISTRICTS.find(d => d.district === selectedDistrict) 
    || KELANTAN_DISTRICTS[1]; // default to Kota Bharu

  const activeStats = getDistrictStats(activeDistrictData.district);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 1.75));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.85));
  const handleResetZoom = () => setZoomLevel(1);

  // Filtered districts for chip search
  const filteredDistrictChips = KELANTAN_DISTRICTS.filter(d => 
    !searchDistrictQuery || 
    d.name.toLowerCase().includes(searchDistrictQuery.toLowerCase()) ||
    d.tagline.toLowerCase().includes(searchDistrictQuery.toLowerCase()) ||
    d.popularNiche.toLowerCase().includes(searchDistrictQuery.toLowerCase())
  );

  return (
    <div className="relative rounded-3xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-5 sm:p-7 shadow-xs overflow-hidden w-full min-w-0 transition-colors">
      
      {/* 1. Header Bar in Google Maps Look & Feel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-300 dark:border-slate-600">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75" />
              <span>Peta Interaktif Negeri</span>
            </span>
            <span className="text-black/35 dark:text-white/35">•</span>
            <span className="text-xs text-black/70 dark:text-white/75 font-medium">
              Seluruh Kelantan
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <span>Peta Lokasi & Ketersediaan Kiosk Niaga</span>
          </h2>
          <p className="text-xs sm:text-sm text-black/70 dark:text-white/75 mt-0.5">
            Peta interaktif berwarna gaya Google Maps. Klik mana-mana jajahan atau pin merah untuk semak kekosongan sewaan kiosk.
          </p>
        </div>

        {/* View Toggle & Map Layer Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Mode Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMapTheme('standard')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mapTheme === 'standard'
                  ? 'bg-white dark:bg-slate-800 text-black dark:text-white/75 shadow-2xs'
                  : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
              }`}
            >
              Peta Standard
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('terrain')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mapTheme === 'terrain'
                  ? 'bg-white dark:bg-slate-800 text-black dark:text-white/75 shadow-2xs'
                  : 'text-black dark:text-white/75 hover:text-black dark:hover:text-white'
              }`}
            >
              Rupa Bumi
            </button>
          </div>

          {/* Map vs Grid Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-800 text-black dark:text-white/75 shadow-2xs'
                  : 'text-black dark:text-white/75'
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
                  ? 'bg-white dark:bg-slate-800 text-black dark:text-white/75 shadow-2xs'
                  : 'text-black dark:text-white/75'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Senarai</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Google Maps Quick Search Bar & Fast Selector Chips */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari jajahan atau hab niaga (cth: Kota Bharu, Bachok, Tok Bali, Gua Musang)..."
              value={searchDistrictQuery}
              onChange={(e) => setSearchDistrictQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors dark:focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onSelectDistrict('Semua Jajahan')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedDistrict === 'Semua Jajahan'
                  ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                  : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600'
              }`}
            >
              Seluruh Kelantan
            </button>
          </div>
        </div>

        {/* Jajahan Fast Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
          {filteredDistrictChips.map((geo) => {
            const isSelected = selectedDistrict === geo.district;
            return (
              <button
                key={geo.code}
                type="button"
                onClick={() => onSelectDistrict(geo.district)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 dark:ring-blue-400/30 dark:bg-blue-600'
                    : 'bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 dark:border-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : geo.terrainType === 'green' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <span>{geo.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-white dark:bg-slate-800 text-black dark:text-white'}`}>
                  {getDistrictStats(geo.district).available}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Interactive Map Workspace */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start mt-4 w-full min-w-0">
          
          {/* Left Column: Authentic Google Maps Styled Canvas (7 Cols) */}
          <div className="xl:col-span-7 flex flex-col items-center w-full min-w-0">
            <div className="relative w-full rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-600 shadow-md bg-[#E8EEF5] dark:bg-slate-900 flex flex-col items-center">
              
              {/* Google Maps Top Location Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-md border border-slate-300 dark:border-slate-600 text-xs">
                <MapPin className="w-4 h-4 text-[#EA4335] shrink-0" />
                <span className="font-bold text-black dark:text-white truncate">
                  {selectedDistrict === 'Semua Jajahan' ? 'Kelantan, Malaysia' : `${selectedDistrict}, Kelantan`}
                </span>
                <span className="text-[10px] text-black/70 dark:text-white/75 font-semibold">• Google Maps View</span>
              </div>

              {/* Google Maps Floating Zoom & Reset Controls */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zum Masuk (Zoom In)"
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-black dark:text-white shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zum Keluar (Zoom Out)"
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-black dark:text-white shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Pusat Peta Asal"
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-black dark:text-white shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-black dark:text-white" />
                </button>
              </div>

              {/* Google Maps Scale Legend Bar (Bottom Left) */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-black dark:text-white border border-slate-300 dark:border-slate-600">
                <div className="w-8 h-1 bg-slate-800 dark:bg-slate-200 border-x border-slate-900" />
                <span>20 km</span>
              </div>

              {/* SVG Map Container */}
              <div 
                className="w-full flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <svg
                  viewBox="50 20 440 640"
                  className="w-full h-auto max-h-[520px] drop-shadow-sm select-none"
                >
                  <defs>
                    {/* Water Pattern for South China Sea */}
                    <pattern id="seaPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 0 15 Q 7.5 10 15 15 T 30 15" fill="none" stroke="#2563EB" strokeWidth="0.8" opacity="0.28" />
                    </pattern>

                    {/* Google Maps Road Drop Shadow */}
                    <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
                    </filter>
                  </defs>

                  {/* 1. Sea Water Background Texture (North & East Coastal Area) */}
                  <rect x="50" y="20" width="440" height="640" fill={mapTheme === 'terrain' ? '#A5D6A7' : '#DBEAFE'} opacity={mapTheme === 'terrain' ? 0.25 : 1} />
                  <rect x="50" y="20" width="440" height="640" fill="url(#seaPattern)" />

                  {/* Sea Water Label */}
                  <text x="410" y="50" className="text-[10px] font-extrabold fill-black/55 dark:fill-white/60 uppercase tracking-widest pointer-events-none">
                    Laut China Selatan
                  </text>

                  {/* 2. Main Land Mass / Districts Group */}
                  <g filter="url(#mapShadow)">
                    {KELANTAN_DISTRICTS.map((geo) => {
                      const isSelected = selectedDistrict === geo.district;
                      const isHovered = hoveredDistrict === geo.district;
                      const stats = getDistrictStats(geo.district);

                      // Royal Kelantan Map Palette
                      let fillColor = '#FFF8E7';
                      let strokeColor = '#E0D6C3';

                      if (geo.terrainType === 'green') {
                        fillColor = mapTheme === 'terrain' ? '#C8E6C9' : '#D4EDDA';
                        strokeColor = '#A3D9B1';
                      } else if (geo.terrainType === 'coastal') {
                        fillColor = '#FFF3D6';
                        strokeColor = '#E6CCA0';
                      }

                      // Interactive States (Standard Blue & Amber)
                      if (isSelected) {
                        fillColor = '#DBEAFE'; // Crisp Blue selection tint
                        strokeColor = '#2563EB'; // Standard Royal Blue border
                      } else if (isHovered) {
                        fillColor = '#FEF3C7';
                        strokeColor = '#F59E0B';
                      }

                      return (
                        <g 
                          key={geo.code}
                          onClick={() => onSelectDistrict(geo.district)}
                          onMouseEnter={() => setHoveredDistrict(geo.district)}
                          onMouseLeave={() => setHoveredDistrict(null)}
                          className="cursor-pointer transition-all duration-200 group"
                        >
                          <path
                            d={geo.path}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.2}
                            strokeLinejoin="round"
                            className="transition-all duration-200"
                          />

                          {/* District Name Label */}
                          <text
                            x={geo.centerX}
                            y={geo.centerY - 2}
                            textAnchor="middle"
                            className={`text-[11px] font-bold pointer-events-none select-none transition-colors ${
                              isSelected
                                ? 'fill-black font-black'
                                : 'fill-black'
                            }`}
                          >
                            {geo.name}
                          </text>

                          {/* Small Kiosk Count Badge */}
                          <rect
                            x={geo.centerX - 24}
                            y={geo.centerY + 4}
                            width="48"
                            height="13"
                            rx="6.5"
                            className={`${isSelected ? 'fill-blue-600' : 'fill-white/95 shadow-2xs'} pointer-events-none`}
                          />
                          <text
                            x={geo.centerX}
                            y={geo.centerY + 13}
                            textAnchor="middle"
                            className={`text-[8.5px] font-bold pointer-events-none tabular-nums ${
                              isSelected ? 'fill-white' : 'fill-black'
                            }`}
                          >
                            {stats.available} kosong
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* 3. Major Rivers Layer (Sungai Kelantan) */}
                  <g pointerEvents="none">
                    <path
                      d="M 320 310 Q 305 240 285 200 T 310 130 Q 320 90 315 50"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      opacity="0.72"
                    />
                    <path
                      d="M 285 200 Q 250 170 230 140"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                    {/* River Label */}
                    <text x="270" y="235" className="text-[7.5px] font-semibold fill-black/75 italic pointer-events-none -rotate-45">
                      Sg. Kelantan
                    </text>
                  </g>

                  {/* 4. Major Highways */}
                  <g pointerEvents="none">
                    {/* CSR Highway Route 8: Kota Bharu -> Kuala Krai -> Gua Musang */}
                    <path
                      d="M 345 75 L 345 170 L 320 295 L 275 490 L 290 635"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="4 2"
                      opacity="0.9"
                    />
                    {/* Route 3 Coastal Highway: Tumpat -> Kota Bharu -> Bachok -> Pasir Puteh */}
                    <path
                      d="M 285 65 L 345 75 L 410 105 L 415 175"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    {/* Route Label [ 8 ] */}
                    <rect x="338" y="115" width="14" height="10" rx="2" fill="#FBBF24" stroke="#1E40AF" strokeWidth="0.8" />
                    <text x="345" y="123" textAnchor="middle" className="text-[7px] font-black fill-black">8</text>
                  </g>

                  {/* 5. Google Maps Red Teardrop Location Marker on Active District */}
                  <g 
                    transform={`translate(${activeDistrictData.centerX}, ${activeDistrictData.centerY - 22})`}
                    className="pointer-events-none"
                  >
                    {/* Animated Pulsing Ring under the Pin */}
                    <circle cx="0" cy="18" r="8" fill="#EA4335" opacity="0.25" className="animate-ping" />
                    <circle cx="0" cy="18" r="3.5" fill="#333333" opacity="0.4" />

                    {/* Google Maps Red Pin SVG */}
                    <path
                      d="M 0 0 C -7 0 -12 5.5 -12 12 C -12 19 0 28 0 28 C 0 28 12 19 12 12 C 12 5.5 7 0 0 0 Z"
                      fill="#EA4335"
                      stroke="#C5221F"
                      strokeWidth="1"
                    />
                    {/* White Core Circle */}
                    <circle cx="0" cy="11" r="4.5" fill="#FFFFFF" />
                  </g>

                </svg>
              </div>

              {/* Google Maps Legend Footer */}
              <div className="w-full flex flex-wrap items-center justify-between text-xs text-black dark:text-white px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-600 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335] inline-block ring-2 ring-red-200" />
                    Jajahan Dipilih
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#CEEAD6] border border-[#A3D9B1] inline-block" />
                    Zon Hijau / Agrotek
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#FFF8E7] border border-[#E0D6C3] inline-block" />
                    Zon Komersial / Pesisir
                  </span>
                </div>
                <span className="text-[10px] text-black/70 dark:text-white/75">
                  Tip: Klik jajahan untuk memuatkan info hab
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Google Maps Location Card (5 Cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4 w-full min-w-0">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all space-y-4">
              
              {/* Card Header: Google Maps Place Card Style */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-600">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-black dark:bg-blue-950/60 dark:text-white border border-blue-200 dark:border-blue-800/70 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#EA4335]" />
                    <span>Jajahan {activeDistrictData.name} ({activeDistrictData.code})</span>
                  </div>
                  <h3 className="text-xl font-black text-black dark:text-white leading-tight">
                    {activeDistrictData.mainHubName}
                  </h3>
                  <p className="text-xs text-black/70 dark:text-white/75 mt-1">
                    {activeDistrictData.tagline}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/70">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              {/* Status Metrics: Google Maps Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 dark:text-white/75 block mb-0.5">
                    Kekosongan Slot Kiosk
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-black dark:text-white/75 tabular-nums">
                      {activeStats.available}
                    </span>
                    <span className="text-xs text-black/70 dark:text-white/75 font-semibold">
                      / {activeStats.total} Kiosk Tersedia
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 dark:text-white/75 block mb-0.5">
                    Kadar Sewaan Bersubsidi
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-black dark:text-white tabular-nums">
                      RM 150
                    </span>
                    <span className="text-xs text-black/70 dark:text-white/75 font-semibold">
                      / sebulan
                    </span>
                  </div>
                </div>
              </div>

              {/* Focus Niche & Opportunities */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white">
                  <Sparkles className="w-3.5 h-3.5 text-black dark:text-white/75" />
                  <span>Kategori Produk & Tumpuan Jajahan:</span>
                </div>
                <p className="text-xs text-black dark:text-white leading-relaxed font-medium">
                  {activeDistrictData.popularNiche}
                </p>
              </div>

              {/* Action Buttons: 1-Click Booking & WhatsApp */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectDistrict(activeDistrictData.district);
                    if (onOpenBookingForDistrict) {
                      onOpenBookingForDistrict(activeDistrictData.district);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Store className="w-4 h-4 text-white" />
                  <span>Mohon Kiosk di Jajahan {activeDistrictData.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={`https://wa.me/601120508890?text=${encodeURIComponent(`Salam Pegawai Hab ${activeDistrictData.name}, saya berminat untuk membuat permohonan kiosk di ${activeDistrictData.mainHubName}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-2xs"
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
            const stats = getDistrictStats(geo.district);

            return (
              <div
                key={geo.code}
                onClick={() => onSelectDistrict(geo.district)}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 shadow-sm -translate-y-0.5'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/70 dark:text-white/75">
                      {geo.code}
                    </span>
                    <span className="text-[11px] font-bold text-black dark:text-white/75 tabular-nums">
                      {stats.available} kosong
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-black dark:text-white mb-1">
                    {geo.name}
                  </h4>
                  <p className="text-[11px] text-black/70 dark:text-white/75 line-clamp-2 mb-3">
                    {geo.tagline}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between text-xs">
                  <span className="text-black/70 dark:text-white/75 font-medium">
                    RM150 /bln
                  </span>
                  <span className="font-bold text-black dark:text-white/75 inline-flex items-center gap-0.5">
                    Pilih <ArrowRight className="w-3 h-3" />
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
