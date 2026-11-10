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

  const rawWhatsapp = business.whatsapp || business.phone || '';
  const cleanWhatsapp = typeof rawWhatsapp === 'string' ? rawWhatsapp.replace(/[^0-9]/g, '') : '';

  const createWhatsAppOrderLink = (productName?: string) => {
    const text = productName 
      ? `Assalamualaikum/Hai ${business.businessName}, saya melihat produk *${productName}* di Portal KBELIA Kelantan dan berminat untuk membuat pesanan / pertanyaan.`
      : `Assalamualaikum/Hai ${business.businessName}, saya ingin membuat pertanyaan mengenai perniagaan anda melalui Portal KBELIA Kelantan.`;
    return `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(text)}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.businessName,
        text: `${business.businessName} - ${business.tagline} di KBELIA Kelantan`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Pautan perniagaan telah disalin ke papan keratan (clipboard)!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#24303F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2E3A47] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col transition-colors">
        
        {/* Banner with close button */}
        <div className="relative h-40 sm:h-48 bg-slate-800 shrink-0 overflow-hidden">
          <img
            src={business.bannerUrl || '/src/assets/images/banner_kelantan_landmark_1793924253242.jpg'}
            alt={business.businessName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-sm transition-colors z-20 cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* District & Category pill */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
            <span className="px-3 py-1 rounded text-xs font-bold bg-amber-400 text-slate-950 shadow-xs">
              {business.category}
            </span>
            <span className="px-3 py-1 rounded text-xs font-semibold bg-slate-900/90 text-slate-100 border border-slate-700">
              Jajahan {business.district}
            </span>
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="absolute bottom-3 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white transition-colors flex items-center gap-1.5 text-xs font-medium z-20 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Kongsi</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Header info with logo - Clean non-overlapping layout */}
          <div className="relative pb-5 border-b border-slate-200 dark:border-[#2E3A47] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={business.logoUrl || '/src/assets/images/product_kelantan_delights_1793924253401.jpg'}
                  alt={business.businessName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs object-cover bg-white dark:bg-[#1A222C] shrink-0"
                />
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {business.businessName}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-[#8A99AD] leading-relaxed mt-0.5">
                    {business.tagline}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center">
                {business.ssmNumber && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    SSM Berdaftar
                  </span>
                )}
                {business.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Pilihan Utama
                  </span>
                )}
              </div>
            </div>

            {/* Title and metadata details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>{business.district}, Kelantan</span>
              </div>
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{business.rating || 5.0} ({business.reviewsCount || 1} ulasan)</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Pengasas: <span className="text-slate-800 dark:text-white font-semibold">{business.ownerName}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Tentang Perniagaan & Produk:
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8A99AD] leading-relaxed bg-slate-50 dark:bg-[#1A222C] p-4 rounded-xl border border-slate-200 dark:border-[#2E3A47]">
              {business.description}
            </p>
          </div>

          {/* Social and Contact Links */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={createWhatsAppOrderLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi / Tempah Terus via WhatsApp</span>
            </a>

            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 dark:bg-[#1C2434] hover:bg-slate-200 dark:hover:bg-[#2E3A47] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-[#2E3A47]"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>{business.instagram}</span>
              </a>
            )}

            {business.tiktok && (
              <a
                href={`https://tiktok.com/@${business.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 dark:bg-[#1C2434] hover:bg-slate-200 dark:hover:bg-[#2E3A47] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-[#2E3A47]"
              >
                <span>TikTok: {business.tiktok}</span>
              </a>
            )}
          </div>

          {/* Products & Menu Catalogue */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Katalog Produk & Servis ({businessProducts.length})</span>
              </h4>
            </div>

            {businessProducts.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-[#1A222C] rounded-xl border border-dashed border-slate-200 dark:border-[#2E3A47] text-xs text-slate-500 dark:text-[#8A99AD]">
                Usahawan belum menyenaraikan item produk berasingan. Anda boleh terus hubungi via WhatsApp di atas.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {businessProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-[#2E3A47] rounded-xl shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all flex gap-3"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-20 h-20 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{prod.name}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-[#8A99AD] line-clamp-2 mt-0.5">{prod.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                          RM{prod.price.toFixed(2)}
                        </span>
                        <a
                          href={createWhatsAppOrderLink(prod.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
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
