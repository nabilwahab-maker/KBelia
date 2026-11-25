import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Download,
  FileCode2,
  X,
  Loader2,
  Check,
  ShieldCheck
} from 'lucide-react';
import {
  PrintFallbackPayload,
  downloadHtmlDocument,
  escapeHtml,
  registerPrintFallbackHandler
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { showToast } from './ToastNotification';

const preparePreviewHtml = (rawHtml: string, title: string, orientation: 'portrait' | 'landscape' = 'portrait'): string => {
  const withoutScripts = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/body>/i, '<style>.screen-toolbar,.no-print{display:none !important;}body{background:#E2E8F0 !important;padding:16px !important;}</style></body>');

  if (
    withoutScripts.trim().toLowerCase().startsWith('<!doctype html>') ||
    withoutScripts.trim().toLowerCase().startsWith('<html')
  ) {
    return withoutScripts;
  }

  return `<!DOCTYPE html>
  <html lang="ms">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        @page { size: A4 ${orientation}; margin: 10mm 12mm; }
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 16px; background: #E2E8F0; color: #0F172A; }
        .screen-toolbar, .no-print { display: none !important; }
      </style>
    </head>
    <body>${withoutScripts}</body>
  </html>`;
};

export const PrintFallbackModal: React.FC = () => {
  const [payload, setPayload] = useState<PrintFallbackPayload | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    registerPrintFallbackHandler((incoming) => {
      setPdfSaved(false);
      setPayload(incoming);
    });
    return () => {
      registerPrintFallbackHandler(null);
    };
  }, []);

  const previewDoc = useMemo(() => {
    if (!payload) return '';
    return preparePreviewHtml(payload.htmlContent, payload.documentTitle, payload.orientation);
  }, [payload]);

  if (!payload) return null;

  const safeSlug = payload.documentTitle
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Dokumen_Rasmi_KBelia';

  const handleRetryPrint = () => {
    const iframeWin = iframeRef.current?.contentWindow;
    if (iframeWin) {
      try {
        iframeWin.focus();
        iframeWin.print();
        return;
      } catch {
        // Fallback below
      }
    }
    try {
      window.print();
    } catch {
      showToast({
        type: 'info',
        title: 'Gunakan Muat Turun PDF',
        message: 'Pelayar menyekat dialog cetakan terus. Klik Muat Turun PDF Rasmi untuk mencetak fail PDF dengan kemas.'
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const ok = await downloadHtmlAsPdf(payload.htmlContent, `${safeSlug}.pdf`);
      if (ok) {
        setPdfSaved(true);
        showToast({
          type: 'success',
          title: 'PDF Rasmi Dimuat Turun',
          message: `Dokumen "${payload.documentTitle}" berjaya disimpan sebagai fail PDF A4.`
        });
        setTimeout(() => setPdfSaved(false), 3000);
      } else {
        showToast({
          type: 'error',
          title: 'Gagal Menjana PDF',
          message: 'Sila cuba pilihan Simpan HTML sebagai alternatif.'
        });
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadHtmlDocument(payload.htmlContent, safeSlug, payload.documentTitle);
    showToast({
      type: 'success',
      title: 'Fail HTML Disimpan',
      message: 'Buka fail HTML tersebut di mana-mana pelayar untuk cetakan terus.'
    });
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Pratonton Cetakan: ${payload.documentTitle}`}
    >
      <div className="w-full max-w-4xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Action Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0F172A] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Pratonton Cetakan &amp; Dokumen Rasmi A4
              </h3>
              <p className="text-xs text-slate-300 truncate">
                {payload.documentTitle} · Format Sedia Cetak &amp; PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRetryPrint}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Terus</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloadingPdf}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-70"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menjana PDF...</span>
                </>
              ) : pdfSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>PDF Disimpan</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Muat Turun PDF Rasmi</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 hidden sm:inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Simpan fail HTML berdiri sendiri untuk cetakan"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setPayload(null)}
              aria-label="Tutup Pratonton"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive A4 Document Preview Frame */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-hidden">
          <iframe
            ref={iframeRef}
            title={payload.documentTitle}
            srcDoc={previewDoc}
            className="w-full h-full border-0 bg-slate-200"
          />
        </div>
      </div>
    </div>
  );
};
