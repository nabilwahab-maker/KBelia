import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';

interface BusinessMediaProfileHeaderProps {
  logoUrl: string;
  onLogoChange: (value: string) => void;
  bannerUrl: string;
  onBannerChange: (value: string) => void;
  dividerClass?: string;
}

const MAX_DATA_URL_LENGTH = 780000;
const MAX_RAW_FILE_BYTES = 5 * 1024 * 1024;

export const BusinessMediaProfileHeader: React.FC<BusinessMediaProfileHeaderProps> = ({
  logoUrl,
  onLogoChange,
  bannerUrl,
  onBannerChange,
  dividerClass = 'border-slate-200 dark:border-zinc-800'
}) => {
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { confirmDelete } = useConfirmDelete();

  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [bannerImgError, setBannerImgError] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setBannerImgError(false);
  }, [bannerUrl]);

  useEffect(() => {
    setLogoImgError(false);
  }, [logoUrl]);

  const compressDataUrlIfNeeded = (dataUrl: string, onDone: (compressed: string) => void) => {
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
      onDone(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxDim = 1200;
      let width = img.naturalWidth || 1200;
      let height = img.naturalHeight || 900;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onDone(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.82;
      let output = canvas.toDataURL('image/jpeg', quality);
      while (output.length > MAX_DATA_URL_LENGTH && quality > 0.45) {
        quality -= 0.1;
        output = canvas.toDataURL('image/jpeg', quality);
      }

      if (output.length > MAX_DATA_URL_LENGTH) {
        setUploadError('Imej terlalu kompleks. Sila pilih fail imej bersaiz lebih kecil.');
        return;
      }
      onDone(output);
    };
    img.onerror = () => {
      setUploadError('Gagal memproses fail imej.');
    };
    img.src = dataUrl;
  };

  const handleImageFile = (file: File, target: 'banner' | 'logo') => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Sila pilih fail imej yang sah (JPG, PNG, WebP).');
      return;
    }
    if (file.size > MAX_RAW_FILE_BYTES) {
      setUploadError('Saiz imej terlalu besar. Maksimum 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        compressDataUrlIfNeeded(result, (processed) => {
          if (target === 'banner') {
            onBannerChange(processed);
          } else {
            onLogoChange(processed);
          }
        });
      }
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca fail imej.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmDelete({
      itemName: 'Banner Premis',
      itemType: 'Imej',
      onConfirm: () => {
        onBannerChange('');
        if (bannerInputRef.current) {
          bannerInputRef.current.value = '';
        }
      }
    });
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmDelete({
      itemName: 'Logo Perniagaan',
      itemType: 'Imej',
      onConfirm: () => {
        onLogoChange('');
        if (logoInputRef.current) {
          logoInputRef.current.value = '';
        }
      }
    });
  };

  const hasValidBanner = Boolean(bannerUrl) && !bannerImgError;
  const hasValidLogo = Boolean(logoUrl) && !logoImgError;

  return (
    <div className={`pb-5 border-b ${dividerClass}`}>
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0], 'banner');
          }
        }}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0], 'logo');
          }
        }}
        className="hidden"
      />

      {/* Banner Premis — Full Width Top Cover */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Muat naik atau tukar banner premis"
        onClick={() => bannerInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            bannerInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsBannerDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsBannerDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsBannerDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0], 'banner');
          }
        }}
        className={`relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
          hasValidBanner
            ? 'border border-slate-200 dark:border-zinc-700 bg-slate-900 group'
            : isBannerDragging
              ? 'border-2 border-dashed border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 flex flex-col items-center justify-center text-center px-4'
              : 'border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-900/60 hover:border-emerald-600/60 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70 flex flex-col items-center justify-center text-center px-4'
        }`}
      >
        {hasValidBanner ? (
          <>
            <img
              src={bannerUrl}
              alt="Banner Premis"
              referrerPolicy="no-referrer"
              onError={() => setBannerImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/15" />

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  bannerInputRef.current?.click();
                }}
                className="min-h-9 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-slate-900 dark:text-[#F4F1EA] border border-slate-200/90 dark:border-zinc-700 text-xs font-semibold shadow-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Tukar Banner</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveBanner}
                title="Padam Banner Premis"
                aria-label="Padam Banner Premis"
                className="w-9 h-9 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/70 shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/70 transition-colors inline-flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 pb-4 sm:pb-0">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-stone-200 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
              Banner Premis (16:9)
            </span>
            <span className="text-xs text-slate-500 dark:text-stone-400">
              Klik atau seret gambar premis ke sini
            </span>
          </div>
        )}
      </div>

      {/* Overlapping Logo Perniagaan (Bottom-Left) + Identity Label */}
      <div className="relative px-3 sm:px-6 flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-5">
        <div className="relative -mt-12 sm:-mt-14 w-24 h-24 sm:w-28 sm:h-28 shrink-0 z-20">
          <div
            role="button"
            tabIndex={0}
            aria-label="Muat naik atau tukar logo perniagaan"
            onClick={() => logoInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                logoInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsLogoDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsLogoDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsLogoDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageFile(e.dataTransfer.files[0], 'logo');
              }
            }}
            className={`w-full h-full rounded-2xl overflow-hidden ring-4 ring-white dark:ring-[#141D1A] shadow-md transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-emerald-600 ${
              hasValidLogo
                ? 'border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#101815]'
                : isLogoDragging
                  ? 'border-2 border-dashed border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 flex flex-col items-center justify-center text-center p-2'
                  : 'border-2 border-dashed border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 flex flex-col items-center justify-center text-center p-2'
            }`}
          >
            {hasValidLogo ? (
              <img
                src={logoUrl}
                alt="Logo Perniagaan"
                referrerPolicy="no-referrer"
                onError={() => setLogoImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-slate-600 dark:text-stone-300">
                <Upload className="w-4 h-4" />
                <span className="text-[11px] font-semibold leading-tight">
                  Logo (1:1)
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              logoInputRef.current?.click();
            }}
            title="Tukar Logo Perniagaan"
            aria-label="Tukar Logo Perniagaan"
            className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 text-slate-800 dark:text-[#F4F1EA] border border-slate-200 dark:border-zinc-600 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-0 sm:pt-3 pb-0.5 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA] kbelia-trim">
              Identiti Visual Perniagaan
            </h4>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
              Logo (1:1) &amp; Banner Premis (16:9) · Format JPG, PNG atau WebP (maks. 5MB)
            </p>
          </div>

          {hasValidLogo && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline kbelia-link inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Padam Logo</span>
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-2.5 px-1">
          {uploadError}
        </p>
      )}
    </div>
  );
};
