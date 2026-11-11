import React, { useState } from 'react';
import { 
  X, 
  Store, 
  MapPin, 
  Building2, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Wifi, 
  Zap, 
  Share2, 
  MessageCircle, 
  ExternalLink,
  BellRing,
  Award,
  Info
} from 'lucide-react';
import { CapsuleSlot, BusinessListing, ProductItem } from '../types';
import { showToast } from './ToastNotification';

interface CapsuleTenantDetailModalProps {
  slot: CapsuleSlot | null;
  isOpen: boolean;
  onClose: () => void;
  businesses?: BusinessListing[];
  products?: ProductItem[];
  onSelectBusiness?: (biz: BusinessListing) => void;
}

export const CapsuleTenantDetailModal: React.FC<CapsuleTenantDetailModalProps> = ({
  slot,
  isOpen,
  onClose,
  businesses = [],
  products = [],
  onSelectBusiness
}) => {
  const [interestSaved, setInterestSaved] = useState(false);

  if (!isOpen || !slot) return null;

  // Find matching business profile for the current tenant
  const tenantBusiness = businesses.find(b => 
    (slot.currentTenantBusinessName && b.businessName?.toLowerCase().trim() === slot.currentTenantBusinessName.toLowerCase().trim()) ||
    (slot.currentTenantId && (b.id === slot.currentTenantId || b.ownerId === slot.currentTenantId)) ||
    (slot.district === b.district && b.businessName?.toLowerCase().includes('jeli'))
  ) || null;

  const tenantProducts = products.filter(p => tenantBusiness && p.businessId === tenantBusiness.id);

  const tenantName = tenantBusiness?.ownerName || 'Ahmad Faizul / Usahawan Belia Kelantan';
  const businessName = slot.currentTenantBusinessName || tenantBusiness?.businessName || 'Perniagaan Belia Berdaftar';
  const tenantPhone = tenantBusiness?.whatsapp || tenantBusiness?.ownerPhone || '+60123344556';
  const cleanPhone = tenantPhone.replace(/[^0-9]/g, '');

  const handleWhatsApp = () => {
    const text = `Assalamualaikum/Hai ${businessName}, saya melihat premis kiosk anda di ${slot.name} (${slot.code}) melalui Portal KBELIA Kelantan dan berminat untuk membuat pertanyaan mengenai produk / perkhidmatan anda.`;
    window.open(`https://wa.me/${cleanPhone || '60123344556'}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveInterest = () => {
    setInterestSaved(true);
    showToast({
      title: 'Minat Berjaya Direkodkan',
      message: `Pemberitahuan kekosongan bagi Kiosk ${slot.code} (${slot.name}) akan dihantar kepada anda jika terdapat pembukaan slot kelak.`,
      type: 'success'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${slot.name} - ${businessName}`,
        text: `Lihat premis kiosk beroperasi ${businessName} di ${slot.hubLocation} melalui Portal KBELIA Kelantan`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({
        title: 'Pautan Disalin',
        message: 'Pautan premis kiosk telah disalin ke papan keratan.',
        type: 'info'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E2638] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2C384D] overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2C384D] bg-slate-50/80 dark:bg-[#161D2B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {slot.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Berpenyewa & Aktif Beroperasi
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Butiran Kapsul & Profil Penyewa
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2C384D] rounded-xl transition-colors cursor-pointer"
              title="Kongsi Maklumat Premis"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2C384D] rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* 1. Kiosk Premis Banner & Overview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2C384D] bg-slate-100 dark:bg-[#161D2B]">
            <div className="h-48 sm:h-56 w-full relative">
              <img
                src={slot.imageUrl || '/public/assets/generated/kiosk_modular_kbelia_1793924253417.jpg'}
                alt={slot.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide inline-block mb-1">
                  Kapsul Niaga Modular Negeri Kelantan
                </span>
                <h3 className="text-lg sm:text-xl font-black leading-tight drop-shadow-xs">
                  {slot.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-200 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{slot.hubLocation} ({slot.district})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white dark:bg-[#1A222F] text-xs border-t border-slate-200 dark:border-[#2C384D]">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Saiz Pod:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{slot.size || '10ft x 10ft Pod'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Kadar Sewa:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">RM{slot.monthlyRate}/bln</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Jajahan:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{slot.district}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Status Premis:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Beroperasi</strong>
              </div>
            </div>
          </div>

          {/* 2. PROFIL PENYEWA SEMASA (CURRENT TENANT DOSSIER) */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-800/40 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {businessName.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Penyewa Aktif Berdaftar
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {businessName}
                  </h4>
                  {tenantBusiness?.tagline && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{tenantBusiness.tagline}"
                    </p>
                  )}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-[#1E2638] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Penyewa Sah UMK
              </span>
            </div>

            {/* Tenant Specific Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-[#161D2B] border border-emerald-100 dark:border-[#2C384D] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pengusaha / Pemilik Belia:</span>
                <div className="font-bold text-slate-900 dark:text-white">{tenantName}</div>
                <div className="text-[11px] text-slate-500">Usahawan Anak Muda Jajahan {slot.district}</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#161D2B] border border-emerald-100 dark:border-[#2C384D] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Kategori Perniagaan:</span>
                <div className="font-bold text-slate-900 dark:text-white">{tenantBusiness?.category || 'Makanan & Minuman / Agrotek'}</div>
                <div className="text-[11px] text-slate-500 font-mono">SSM: {tenantBusiness?.ssmNumber || '202403112233 (KT0099881-X)'}</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#161D2B] border border-emerald-100 dark:border-[#2C384D] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Perjanjian Sewaan:</span>
                <div className="font-bold text-slate-900 dark:text-white">Tempoh Kontrak 12 Bulan</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Menerima Subsidi Sewa 50% Negeri</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#161D2B] border border-emerald-100 dark:border-[#2C384D] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Waktu Operasi Kiosk:</span>
                <div className="font-bold text-slate-900 dark:text-white">9:00 Pagi - 10:00 Malam</div>
                <div className="text-[11px] text-slate-500">Dibuka Setiap Hari Termasuk Cuti Umum</div>
              </div>
            </div>

            {/* Tenant Business Description */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#161D2B] border border-emerald-100 dark:border-[#2C384D] text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Skop Produk & Servis di Kiosk Ini:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {tenantBusiness?.description || 
                  'Perusahaan belia tempatan yang mengusahakan produk berkualiti di premis pod pintar ini. Menawarkan produk makanan, minuman dan hasil kraf tempatan sedia beli dengan pembayaran tanpa tunai DuitNow QR.'}
              </p>
            </div>

            {/* Action to Contact Tenant */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Usahawan / WhatsApp</span>
              </button>

              {tenantBusiness && onSelectBusiness && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectBusiness(tenantBusiness);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E2638] hover:bg-slate-50 dark:hover:bg-[#2C384D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2C384D] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lihat Profil Direktori Penuh</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Fasiliti & Kemudahan Kiosk Pod */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161D2B] border border-slate-200 dark:border-[#2C384D] space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Kemudahan & Utiliti Termasuk Dalam Pod Kiosk Ini:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(slot.amenities || []).map((amenity, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-white dark:bg-[#1E2638] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2C384D] px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{amenity}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 4. Notis Ketersediaan / Status Permohonan */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <strong className="font-bold text-amber-900 dark:text-amber-200 block">
                Status Permohonan Sewaan Pod Ini
              </strong>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Unit <strong>{slot.code}</strong> sedang disewa dan beroperasi oleh usahawan berdaftar. Permohonan sewaan baharu bagi pod ini tidak dibuka buat masa ini. Untuk menyewa kiosk, anda boleh memilih unit yang berstatus <strong>Tersedia</strong> dalam direktori kiosk.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#2C384D] bg-slate-50/80 dark:bg-[#161D2B] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleSaveInterest}
            disabled={interestSaved}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              interestSaved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-[#1E2638] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2C384D] hover:bg-slate-100 dark:hover:bg-[#2C384D]'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-amber-500" />
            <span>{interestSaved ? 'Minat Direkodkan ✓' : 'Beritahu Saya Jika Kosong'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
