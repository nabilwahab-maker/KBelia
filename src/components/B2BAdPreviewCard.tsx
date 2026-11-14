import React from 'react';
import { MapPin, MessageCircle, Eye, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { KelantanDistrict } from '../types';
import { PortalImage } from './PortalImage';
import { resolveB2BImage } from '../utils/visualAssets';

interface B2BAdPreviewCardProps {
  type: 'supply' | 'demand';
  title: string;
  authorBusiness: string;
  authorName: string;
  district: KelantanDistrict | string;
  description: string;
  imageUrl?: string;
  isEn?: boolean;
}

export const B2BAdPreviewCard: React.FC<B2BAdPreviewCardProps> = ({
  type,
  title,
  authorBusiness,
  authorName,
  district,
  description,
  imageUrl,
  isEn = false
}) => {
  const hasCustomImage = Boolean(imageUrl && imageUrl.trim().length > 0);
  const previewSrc = hasCustomImage
    ? imageUrl
    : resolveB2BImage({
        type,
        title: title || (type === 'supply' ? 'Pes Sambal Kelantan' : 'Biji Kopi Sangai'),
        authorBusiness,
        description
      });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-black dark:text-white">
          <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>{isEn ? 'Live Ad Card Preview' : 'Pratonton Langsung Kad Iklan'}</span>
        </div>
        <span className="text-[11px] font-medium text-black/60 dark:text-white/65">
          {hasCustomImage
            ? (isEn ? 'Uploaded photo' : 'Gambar muat naik')
            : (isEn ? 'Sample guide photo' : 'Gambar contoh panduan')}
        </span>
      </div>

      {/* Live Preview Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs overflow-hidden flex flex-col">
        <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-300 dark:border-slate-600">
          <PortalImage
            src={previewSrc}
            alt={title || 'Pratonton Iklan Ruang Niaga'}
            fallbackType="b2b"
            fallbackLabel={authorBusiness || 'Ruang Niaga KBelia'}
            className="w-full h-full object-cover"
          />
          {!hasCustomImage && (
            <div className="px-2.5 py-1 bg-slate-900/75 text-white text-[10px] font-semibold absolute bottom-2 left-2 rounded-md inline-flex items-center gap-1.5 backdrop-blur-xs">
              <ImageIcon className="w-3 h-3" />
              <span>{isEn ? 'Example visual — upload your photo on the left' : 'Contoh visual — muat naik gambar anda di sebelah'}</span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  type === 'supply'
                    ? 'bg-emerald-50 text-black border-emerald-200 dark:bg-emerald-950/60 dark:text-white dark:border-emerald-900/40'
                    : 'bg-amber-50 text-black border-amber-200 dark:bg-amber-950/50 dark:text-white dark:border-amber-800/40'
                }`}
              >
                {type === 'supply'
                  ? (isEn ? 'Supplying / Wholesale' : 'Membekal (Tawaran)')
                  : (isEn ? 'Seeking Supply' : 'Mencari Bekalan')}
              </span>
              <span className="text-[11px] text-black/70 dark:text-white/75 font-mono">
                {isEn ? 'Today' : 'Hari ini'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-black dark:text-white leading-snug line-clamp-2">
                {title.trim() || (isEn ? 'e.g. Wholesale Roasted Coffee & Packaging' : 'cth. Pembekal Kopi Sangai & Pek Kiosk')}
              </h4>
              <div className="text-[11px] text-black/70 dark:text-white/75 font-medium mt-0.5 truncate">
                <span className="font-semibold text-black dark:text-white">
                  {authorBusiness.trim() || (isEn ? 'Your Business Name' : 'Nama Perniagaan Anda')}
                </span>
                <span> · </span>
                <span>{authorName.trim() || (isEn ? 'Owner Name' : 'Nama Wakil')}</span>
              </div>
            </div>

            <p className="text-xs text-black/80 dark:text-white/85 leading-relaxed line-clamp-3">
              {description.trim() ||
                (isEn
                  ? 'State product quantity, wholesale price margin, MOQ, and delivery area clearly so business partners can respond fast.'
                  : 'Nyatakan kuantiti stok, harga anggaran borong, pesanan minimum (MOQ), dan kawasan penghantaran supaya rakan niaga mudah menghubungi anda.')}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-black/70 dark:text-white/75">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{district || 'Kota Bharu'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="w-full py-2 px-3 bg-teal-600/90 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 select-none">
              <MessageCircle className="w-4 h-4" />
              <span>{isEn ? 'Connect via WhatsApp' : 'Hubungi Rakan Niaga'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Concise Visual Ad Tips */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-white/85">
          {isEn ? 'Quick Guide to an Effective Ad' : 'Panduan Ringkas Iklan Berkesan'}
        </div>
        <ul className="space-y-1.5 text-[11px] text-black/75 dark:text-white/75">
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>{isEn ? 'Use a bright, clear landscape photo of your real product or stall.' : 'Gunakan foto produk sebenar yang terang dalam format melintang (4:3 / 16:9).'}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>{isEn ? 'Put specific volume or product type directly in the ad title.' : 'Nyatakan jenis produk atau kuantiti utama terus pada tajuk iklan.'}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>{isEn ? 'Verify your WhatsApp number so buyers can message immediately.' : 'Pastikan nombor WhatsApp aktif untuk respons segera daripada usahawan lain.'}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
