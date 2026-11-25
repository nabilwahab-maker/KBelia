import React, { useMemo, useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { downloadQrPng, generateQrSvgString } from '../utils/qrUtils';
import { showToast } from './ToastNotification';

interface QrCodeGraphicProps {
  value: string;
  size?: number;
  darkColor?: string;
  includeMonogram?: boolean;
  monogramText?: string;
  caption?: string;
  subcaption?: string;
  showDownloadButton?: boolean;
  downloadFileName?: string;
  downloadLabelBottom?: string;
  className?: string;
}

export const QrCodeGraphic: React.FC<QrCodeGraphicProps> = ({
  value,
  size = 136,
  darkColor = '#0F172A',
  includeMonogram = true,
  monogramText = 'KB',
  caption,
  subcaption,
  showDownloadButton = false,
  downloadFileName = 'Kod_QR_KBelia.png',
  downloadLabelBottom,
  className = ''
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const svgMarkup = useMemo(() => {
    try {
      return generateQrSvgString(value, {
        size,
        darkColor,
        includeMonogram,
        monogramText
      });
    } catch {
      return '';
    }
  }, [value, size, darkColor, includeMonogram, monogramText]);

  const handleDownloadPng = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const ok = await downloadQrPng(value, downloadFileName, {
        darkColor,
        includeMonogram,
        monogramText,
        labelBottom: downloadLabelBottom || caption || 'PENGESAHAN RASMI PORTAL KBELIA',
        sublabelBottom: subcaption
      });
      if (ok) {
        setDownloaded(true);
        showToast({
          type: 'success',
          title: 'Kod QR Dimuat Turun',
          message: 'Imej Kod QR resolusi tinggi (PNG 1024px) berjaya disimpan.'
        });
        setTimeout(() => setDownloaded(false), 2400);
      } else {
        showToast({
          type: 'error',
          title: 'Gagal Muat Turun QR',
          message: 'Tidak dapat mengeksport fail PNG Kod QR.'
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div
        className="bg-white p-2 rounded-xl border border-slate-300 shadow-xs inline-flex items-center justify-center shrink-0"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      {(caption || subcaption) && (
        <div className="text-center leading-snug">
          {caption && (
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {caption}
            </div>
          )}
          {subcaption && (
            <div className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {subcaption}
            </div>
          )}
        </div>
      )}
      {showDownloadButton && (
        <button
          type="button"
          onClick={() => void handleDownloadPng()}
          disabled={isDownloading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-60"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : downloaded ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{downloaded ? 'PNG Disimpan' : 'Muat Turun PNG QR'}</span>
        </button>
      )}
    </div>
  );
};
