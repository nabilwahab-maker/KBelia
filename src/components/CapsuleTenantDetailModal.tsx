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

  const whatsappHref = `https://wa.me/${cleanPhone || '60123344556'}?text=${encodeURIComponent(
    `Assalamualaikum/Hai ${businessName}, saya melihat premis kiosk anda di ${slot.name} (${slot.code}) melalui Portal KBelia Kelantan dan berminat untuk membuat pertanyaan mengenai produk / perkhidmatan anda.`
  )}`;

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
        text: `Lihat premis kiosk beroperasi ${businessName} di ${slot.hubLocation} melalui Portal KBelia Kelantan`,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 kbelia-important-header dark:bg-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-blue-600 text-black dark:text-white/75 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-black dark:text-white bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/70">
                  {slot.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black dark:text-white bg-emerald-100/80 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Berpenyewa & Aktif Beroperasi
                </span>
              </div>
              <h2 className="text-base font-bold text-black dark:text-white mt-0.5">
                Butiran Kapsul & Profil Penyewa
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Kongsi Maklumat Premis"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-black dark:text-white">
          
          {/* 1. Kiosk Premis Banner & Overview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="h-48 sm:h-56 w-full relative">
              <img
                src={slot.imageUrl || '/assets/generated/kiosk_modular_kbelia.jpg'}
                alt={slot.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-300 text-black uppercase tracking-wide inline-block mb-1">
                  Kapsul Niaga Modular Negeri Kelantan
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-xs">
                  {slot.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white mt-1">
                  <MapPin className="w-3.5 h-3.5 text-white/90 shrink-0" />
                  <span>{slot.hubLocation} ({slot.district})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white dark:bg-slate-800 text-xs border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-black/70 dark:text-white/75 block uppercase font-semibold">Saiz Pod:</span>
                <strong className="text-black dark:text-white font-bold">{slot.size || '10ft x 10ft Pod'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-black/70 dark:text-white/75 block uppercase font-semibold">Kadar Sewa:</span>
                <strong className="text-black dark:text-white/75 font-bold tabular-nums">RM{slot.monthlyRate}/bln</strong>
              </div>
              <div>
                <span className="text-[10px] text-black/70 dark:text-white/75 block uppercase font-semibold">Jajahan:</span>
                <strong className="text-black dark:text-white font-bold">{slot.district}</strong>
              </div>
              <div>
                <span className="text-[10px] text-black/70 dark:text-white/75 block uppercase font-semibold">Status Premis:</span>
                <strong className="text-black dark:text-white/75 font-bold">Beroperasi</strong>
              </div>
            </div>
          </div>

          {/* 2. PROFIL PENYEWA SEMASA (CURRENT TENANT DOSSIER) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm dark:bg-blue-600">
                  {businessName.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white/75">
                    Penyewa Aktif Berdaftar
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-black dark:text-white leading-tight">
                    {businessName}
                  </h4>
                  {tenantBusiness?.tagline && (
                    <p className="text-xs text-black dark:text-white italic">
                      "{tenantBusiness.tagline}"
                    </p>
                  )}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
                Penyewa Sah UMK
              </span>
            </div>

            {/* Tenant Specific Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-black/70 dark:text-white/75 uppercase font-semibold">Pengusaha / Pemilik Belia:</span>
                <div className="font-bold text-black dark:text-white">{tenantName}</div>
                <div className="text-[11px] text-black/70 dark:text-white/75">Usahawan Anak Muda Jajahan {slot.district}</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-black/70 dark:text-white/75 uppercase font-semibold">Kategori Perniagaan:</span>
                <div className="font-bold text-black dark:text-white">{tenantBusiness?.category || 'Makanan & Minuman / Agrotek'}</div>
                <div className="text-[11px] text-black/70 dark:text-white/75 font-mono">SSM: {tenantBusiness?.ssmNumber || '202403112233 (KT0099881-X)'}</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-black/70 dark:text-white/75 uppercase font-semibold">Perjanjian Sewaan:</span>
                <div className="font-bold text-black dark:text-white">Tempoh Kontrak 12 Bulan</div>
                <div className="text-[11px] text-black dark:text-white/75 font-semibold">Menerima Subsidi Sewa 50% Negeri</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-black/70 dark:text-white/75 uppercase font-semibold">Waktu Operasi Kiosk:</span>
                <div className="font-bold text-black dark:text-white">9:00 Pagi - 10:00 Malam</div>
                <div className="text-[11px] text-black/70 dark:text-white/75">Dibuka Setiap Hari Termasuk Cuti Umum</div>
              </div>
            </div>

            {/* Tenant Business Description */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[10px] text-black/70 dark:text-white/75 uppercase font-semibold block mb-1">
                Skop Produk & Servis di Kiosk Ini:
              </span>
              <p className="text-black dark:text-white leading-relaxed">
                {tenantBusiness?.description || 
                  'Perusahaan belia tempatan yang mengusahakan produk berkualiti di premis pod pintar ini. Menawarkan produk makanan, minuman dan hasil kraf tempatan sedia beli dengan pembayaran tanpa tunai DuitNow QR.'}
              </p>
            </div>

            {/* Action to Contact Tenant */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Usahawan / WhatsApp</span>
              </a>

              {tenantBusiness && onSelectBusiness && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectBusiness(tenantBusiness);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span>Lihat Profil Direktori Penuh</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Fasiliti & Kemudahan Kiosk Pod */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-black dark:text-white block">
              Kemudahan & Utiliti Termasuk Dalam Pod Kiosk Ini:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(slot.amenities || []).map((amenity, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white/75" />
                  <span>{amenity}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 4. Notis Ketersediaan / Status Permohonan */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-black dark:text-white shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <strong className="font-bold text-black dark:text-white block">
                Status Permohonan Sewaan Pod Ini
              </strong>
              <p className="text-black dark:text-white leading-relaxed">
                Unit <strong>{slot.code}</strong> sedang disewa dan beroperasi oleh usahawan berdaftar. Permohonan sewaan baharu bagi pod ini tidak dibuka buat masa ini. Untuk menyewa kiosk, anda boleh memilih unit yang berstatus <strong>Tersedia</strong> dalam direktori kiosk.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleSaveInterest}
            disabled={interestSaved}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              interestSaved
                ? 'bg-emerald-100 text-black border border-emerald-300 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-black/70 dark:text-white/75" />
            <span>{interestSaved ? 'Minat Direkodkan ✓' : 'Beritahu Saya Jika Kosong'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs dark:bg-blue-600"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
