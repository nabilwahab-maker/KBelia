import React from 'react';
import { 
  X, 
  Store, 
  MapPin, 
  Phone, 
  Instagram, 
  Share2, 
  ShieldCheck, 
  Building2, 
  ExternalLink,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  Star
} from 'lucide-react';
import { BusinessListing, ProductItem } from '../types';
import { showToast } from './ToastNotification';

interface BusinessDetailModalProps {
  business: BusinessListing | null;
  products: ProductItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  products = [],
  isOpen,
  onClose
}) => {
  if (!isOpen || !business) return null;

  const safeProducts = products || [];
  const businessProducts = safeProducts.filter(p => p && p.businessId === business.id);

  const rawWhatsapp = business.whatsapp || business.ownerPhone || '';
  const cleanWhatsapp = typeof rawWhatsapp === 'string' ? rawWhatsapp.replace(/[^0-9]/g, '') : '';

  const createWhatsAppOrderLink = (productName?: string) => {
    const text = productName 
      ? `Assalamualaikum/Hai ${business.businessName}, saya melihat produk *${productName}* di Portal KBelia Kelantan dan berminat untuk membuat pesanan / pertanyaan.`
      : `Assalamualaikum/Hai ${business.businessName}, saya ingin membuat pertanyaan mengenai perniagaan anda melalui Portal KBelia Kelantan.`;
    return `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(text)}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.businessName,
        text: `${business.businessName} - ${business.tagline} di KBelia Kelantan`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Pautan perniagaan telah disalin ke papan keratan!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-600 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col transition-colors">
        
        {/* Banner with close button */}
        <div className="relative h-40 sm:h-48 bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
          <img
            src={business.bannerUrl || '/assets/generated/banner_kelantan_landmark_1793924253242.jpg'}
            alt={business.businessName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-sm transition-colors z-20 cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* District & Category pill */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
            <span className="px-3 py-1 rounded text-xs font-bold bg-amber-100 text-black border border-amber-200 shadow-xs">
              {business.category}
            </span>
            <span className="px-3 py-1 rounded text-xs font-semibold bg-white text-black border border-slate-300 shadow-xs">
              Jajahan {business.district}
            </span>
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="absolute bottom-3 right-4 p-2 rounded-xl bg-white hover:bg-white text-black border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold z-20 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-black dark:text-white" />
            <span>Kongsi</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Header info with logo - Clean non-overlapping layout */}
          <div className="relative pb-5 border-b border-slate-300 dark:border-slate-600 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={business.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                  alt={business.businessName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-slate-300 dark:border-slate-600 shadow-xs object-cover bg-white dark:bg-slate-900 shrink-0"
                />
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight leading-tight">
                    {business.businessName}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-black dark:text-white leading-relaxed mt-0.5">
                    {business.tagline}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center">
                {business.ssmNumber && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white/75" />
                    SSM Berdaftar
                  </span>
                )}
                {business.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/80 text-black dark:text-white border border-amber-200 dark:border-amber-800">
                    Pilihan Utama
                  </span>
                )}
              </div>
            </div>

            {/* Title and metadata details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-black/70 dark:text-white/75 pt-1">
              <div className="flex items-center gap-1 text-black dark:text-white font-medium">
                <MapPin className="w-3.5 h-3.5 text-black dark:text-white/75" />
                <span>{business.district}, Kelantan</span>
              </div>
              <div className="flex items-center gap-1 text-black dark:text-white/75 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-black/70 dark:text-white/75" />
                <span>{business.rating || 5.0} ({business.reviewsCount || 1} ulasan)</span>
              </div>
              <div className="text-black/70 dark:text-white/75">
                Pengasas: <span className="text-black dark:text-white font-semibold">{business.ownerName}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">
              Tentang Perniagaan & Produk:
            </h4>
            <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-600">
              {business.description}
            </p>
          </div>

          {/* Social and Contact Links */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={createWhatsAppOrderLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi / Tempah Terus via WhatsApp</span>
            </a>

            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-700 text-black dark:text-white text-xs font-semibold transition-colors border border-slate-300 dark:border-slate-600"
              >
                <Instagram className="w-4 h-4 text-black dark:text-white/75" />
                <span>{business.instagram}</span>
              </a>
            )}

            {business.tiktok && (
              <a
                href={`https://tiktok.com/@${business.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-700 text-black dark:text-white text-xs font-semibold transition-colors border border-slate-300 dark:border-slate-600"
              >
                <span>TikTok: {business.tiktok}</span>
              </a>
            )}
          </div>

          {/* Products & Menu Catalogue */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-black dark:text-white/75" />
                <span>Katalog Produk & Servis ({businessProducts.length})</span>
              </h4>
            </div>

            {businessProducts.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs text-black/70 dark:text-white/75">
                Usahawan belum menyenaraikan item produk berasingan. Anda boleh terus hubungi via WhatsApp di atas.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {businessProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-all flex gap-3"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-20 h-20 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-black dark:text-white line-clamp-1">{prod.name}</h5>
                        <p className="text-[11px] text-black/70 dark:text-white/75 line-clamp-2 mt-0.5">{prod.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-extrabold text-black dark:text-white/75">
                          RM{prod.price.toFixed(2)}
                        </span>
                        <a
                          href={createWhatsAppOrderLink(prod.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-black dark:text-white border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-black dark:text-white/75" />
                          <span>Order</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
