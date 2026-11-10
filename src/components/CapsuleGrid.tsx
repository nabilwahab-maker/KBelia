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
  ExternalLink
} from 'lucide-react';
import { CapsuleSlot, KelantanDistrict, SlotStatus } from '../types';
import { BudgetSlider } from './BudgetSlider';
import { Accordion } from './Accordion';
import { useLanguage } from '../context/LanguageContext';

interface CapsuleGridProps {
  slots: CapsuleSlot[];
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
  const { t, language } = useLanguage();
  const [internalHub, setInternalHub] = useState<string>('Semua');
  const [internalBudget, setInternalBudget] = useState<number>(500);
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

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

  const hubs = ['Semua', 'Hub UMK Bachok', 'Hub Belia Kota Bharu', 'Hub Komuniti Jeli', 'Hub Kraf Tumpat'];

  const filteredSlots = (slots || []).filter((slot) => {
    const hubLoc = (slot.hubLocation || '').toLowerCase();
    const targetHub = (selectedHub || '').toLowerCase().replace('hub ', '');
    const matchHub = selectedHub === 'Semua' || hubLoc.includes(targetHub);
    const matchStatus = selectedStatus === 'Semua' || slot.status === selectedStatus;
    const matchBudget = !slot.monthlyRate || slot.monthlyRate <= maxBudget;
    return matchHub && matchStatus && matchBudget;
  });

  const getStatusBadge = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-[#1C2434]/95 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tersedia
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-[#1C2434]/95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2E3A47] shadow-xs backdrop-blur-xs">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Sedang Beroperasi
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-[#1C2434]/95 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-xs backdrop-blur-xs">
            <Clock className="w-3 h-3 text-amber-500" />
            Dalam Tempahan
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 dark:bg-[#1C2434]/95 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2E3A47] shadow-xs backdrop-blur-xs">
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ruang Kapsul Niaga Belia Kelantan
          </h2>
          <p className="text-slate-600 dark:text-[#8A99AD] text-sm mt-1 max-w-2xl leading-relaxed">
            Pilih dan sewa pod niaga modular serba lengkap di lokasi strategik universiti dan pusat bandar Kelantan untuk memulakan perniagaan anda dengan kos modal rendah.
          </p>
        </div>

        {/* Quick Booking CTA or Admin Add Kiosk CTA */}
        {isReadOnly ? (
          onAddSlot && (
            <button
              onClick={onAddSlot}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Daftar Kapsul Niaga Baharu</span>
            </button>
          )
        ) : (
          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Hantar Permohonan Kapsul</span>
          </button>
        )}
      </div>

      {/* Info Callout: UMK Capsule Model */}
      <div className="mb-8 p-4 bg-slate-100 dark:bg-[#1C2434] border border-slate-200 dark:border-[#2E3A47] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-900 dark:bg-[#2E3A47] text-white rounded-xl shrink-0">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Spesifikasi Kapsul Niaga Modular</div>
            <p className="text-xs text-slate-600 dark:text-[#8A99AD] leading-relaxed mt-0.5">
              Setiap unit kapsul dilengkapi palam elektrik 13A, sambungan Wi-Fi jalur lebar, sistem pengurusan inventori tanpa tunai DuitNow QR, serta sokongan pameran rasmi.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#24303F] p-4 rounded-2xl border border-slate-200 dark:border-[#2E3A47] shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-[#8A99AD] flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Hab Lokasi:
          </span>
          {hubs.map((hub) => (
            <button
              key={hub}
              onClick={() => setSelectedHub(hub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedHub === hub
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-[#1A222C] text-slate-600 dark:text-[#8A99AD] hover:bg-slate-200 dark:hover:bg-[#2E3A47] dark:hover:text-white'
              }`}
            >
              {hub}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Interactive Modern Budget Slider with Floating Bubble */}
          <div className="bg-slate-50 dark:bg-[#1A222C] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-[#2E3A47]">
            <BudgetSlider
              value={maxBudget}
              onChange={setMaxBudget}
              min={100}
              max={500}
              step={20}
              label="Tapis Bajet Sewa:"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-[#8A99AD]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#1A222C] border border-slate-300 dark:border-[#2E3A47] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-700 dark:text-white"
            >
              <option value="Semua">Semua Status</option>
              <option value="available">Tersedia (Kosong)</option>
              <option value="occupied">Sedang Beroperasi</option>
              <option value="reserved">Dalam Tempahan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Slots */}
      {filteredSlots.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47]">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Tiada Kapsul Dijumpai</h3>
          <p className="text-xs text-slate-500 dark:text-[#8A99AD] mt-1">Cuba tukar pilihan tapak atau status kapsul.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => {
            const isAvailable = slot.status === 'available';

            return (
              <div
                key={slot.id}
                id={`capsule-card-${(slot.code || slot.id || 'slot').toLowerCase()}`}
                onClick={() => {
                  if (!isAvailable) {
                    if (onViewTenantDetail) onViewTenantDetail(slot);
                    else onSelectSlot(slot);
                  } else if (!isReadOnly) {
                    onSelectSlot(slot);
                  }
                }}
                className="interactive-card bg-white dark:bg-[#24303F] rounded-2xl border border-slate-200 dark:border-[#2E3A47] hover:border-amber-400/40 dark:hover:border-amber-400/40 overflow-hidden shadow-xs flex flex-col group cursor-pointer"
              >
                {/* 1. Gambar Kad Berkadar Tetap (H-48) di Atas - Bersih Tanpa Teks Bertindih */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img
                    src={slot.imageUrl || '/src/assets/images/kiosk_modular_kbelia_1793924253417.jpg'}
                    alt={slot.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  
                  {/* Top Left: Code Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-mono font-bold rounded-lg border border-slate-700 shadow-xs">
                      {slot.code}
                    </span>
                  </div>

                  {/* Top Right: Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(slot.status)}
                  </div>
                </div>

                {/* 2. Info Teratur di Bawah - Berhierarki & Bebas Pertindihan */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3.5">
                    {/* UX RULE: Give prominence to most important elements - Price & Subsidy right at the top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200 leading-snug">
                          {slot.name}
                        </h3>
                        <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-[#8A99AD] mt-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate font-medium">{slot.hubLocation} ({slot.district})</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${slot.hubLocation}, ${slot.district}, Kelantan`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-red-700 dark:text-amber-400 hover:bg-red-50 dark:hover:bg-[#1A222C] transition-colors shrink-0"
                            title={language === 'en' ? 'Open in Google Maps' : 'Buka lokasi di Google Maps'}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>GPS</span>
                          </a>
                        </div>
                      </div>

                      {/* Prominent Pricing Block */}
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900 mb-1">
                          Subsidi 50%
                        </span>
                        <div>
                          <span className="text-base font-black text-red-700 dark:text-amber-400 tabular-nums">RM{slot.monthlyRate}</span>
                          <span className="text-[11px] text-slate-500 dark:text-[#8A99AD]">/bln</span>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Bar (Size & Jajahan) */}
                    <div className="py-2 px-3 bg-slate-50 dark:bg-[#1A222C] rounded-xl border border-slate-200/80 dark:border-[#2E3A47] flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-[#8A99AD]">
                        Saiz: <strong className="text-slate-800 dark:text-white font-semibold">{slot.size}</strong>
                      </span>
                      <span className="text-slate-500 dark:text-[#8A99AD]">
                        Jajahan: <strong className="text-slate-800 dark:text-white font-semibold">{slot.district}</strong>
                      </span>
                    </div>

                    {/* Current Tenant Info if Occupied */}
                    {slot.currentTenantBusinessName && (
                      <div className="p-2.5 bg-slate-50 dark:bg-[#1A222C] border border-slate-200 dark:border-[#2E3A47] rounded-xl flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Dioperasi oleh:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white truncate block">{slot.currentTenantBusinessName}</span>
                        </div>
                      </div>
                    )}

                    {/* Amenities list */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-[#8A99AD]">Kemudahan Termasuk:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(slot.amenities || []).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-slate-100 dark:bg-[#1A222C] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2E3A47] px-2 py-0.5 rounded-md"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* UX RULE: Clear CTAs & Primary CTA stands out */}
                  <div className="pt-3 border-t border-slate-100 dark:border-[#2E3A47]">
                    {!isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewTenantDetail) {
                            onViewTenantDetail(slot);
                          } else {
                            onSelectSlot(slot);
                          }
                        }}
                        className="interactive-press w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-2xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 group/btn"
                      >
                        <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Lihat Butiran Kapsul & Penyewa</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-200 text-emerald-600 dark:text-emerald-400" />
                      </button>
                    ) : isReadOnly ? (
                      <div className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center bg-slate-100 dark:bg-[#1A222C] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2E3A47] flex items-center justify-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Status: Kekosongan Tersedia (Dipantau)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className="interactive-press interactive-lift w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xs bg-red-700 hover:bg-red-800 active:bg-red-900 text-white shadow-red-700/20 group/btn"
                      >
                        <span>Mohon Kapsul Ini (RM{slot.monthlyRate}/bln)</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-200" />
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
      <div className="mt-12 bg-white dark:bg-[#24303F] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#2E3A47] shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
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
