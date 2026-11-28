import React, { useMemo, useState } from 'react';
import {
  Landmark,
  QrCode,
  CreditCard,
  ShieldCheck,
  Check,
  Lock,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { CapsuleBooking, KioskPaymentMethod } from '../types';
import { QrCodeGraphic } from './QrCodeGraphic';

export interface OnlinePaymentResult {
  paymentMethod: KioskPaymentMethod;
  paymentChannel: string;
  paymentReference: string;
  paidAmount: number;
  paidAt: string;
}

const FPX_BANKS = [
  { id: 'Maybank2u', code: 'MBB', name: 'Maybank2u' },
  { id: 'CIMB Clicks', code: 'CIMB', name: 'CIMB Clicks' },
  { id: 'Bank Islam', code: 'BIMB', name: 'Bank Islam' },
  { id: 'RHB Now', code: 'RHB', name: 'RHB Now' },
  { id: 'Public Bank', code: 'PBB', name: 'Public Bank' },
  { id: 'Bank Rakyat', code: 'BKRM', name: 'Bank Rakyat' }
] as const;

export const isBookingPaid = (booking?: CapsuleBooking | null): boolean =>
  Boolean(booking && booking.paymentStatus === 'paid' && booking.paymentReference);

export const formatPaymentMethodLabel = (
  method?: KioskPaymentMethod,
  channel?: string
): string => {
  if (method === 'fpx') {
    return channel ? `FPX (${channel})` : 'FPX Perbankan Internet';
  }
  if (method === 'duitnow_qr') {
    return 'DuitNow QR';
  }
  if (method === 'card') {
    return channel ? `Kad (${channel})` : 'Kad Kredit / Debit';
  }
  return 'Belum Dibayar';
};

export const generateTransactionReference = (
  method: KioskPaymentMethod,
  slotCode: string
): string => {
  const prefix = method === 'fpx' ? 'FPX' : method === 'duitnow_qr' ? 'DN' : 'KAD';
  const cleanCode = (slotCode || 'KB').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'KB';
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${cleanCode}-${datePart}-${randPart}`;
};

interface KioskOnlinePaymentPanelProps {
  amount: number;
  slotCode: string;
  slotName: string;
  businessName: string;
  primaryButtonClass: string;
  secondaryButtonClass?: string;
  submitLabel?: string;
  submitting?: boolean;
  showInlineSummary?: boolean;
  onBack?: () => void;
  onConfirmPayment: (result: OnlinePaymentResult) => Promise<void> | void;
}

export const KioskOnlinePaymentPanel: React.FC<KioskOnlinePaymentPanelProps> = ({
  amount,
  slotCode,
  slotName,
  businessName,
  primaryButtonClass,
  secondaryButtonClass = '',
  submitLabel,
  submitting = false,
  showInlineSummary = false,
  onBack,
  onConfirmPayment
}) => {
  const [method, setMethod] = useState<KioskPaymentMethod>('fpx');
  const [selectedBank, setSelectedBank] = useState<string>(FPX_BANKS[0].name);
  const [qrConfirmed, setQrConfirmed] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [isProcessingGateway, setIsProcessingGateway] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const qrDraftRef = useMemo(() => {
    const cleanCode = (slotCode || 'KB').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'KB';
    return `DNQR-${cleanCode}-${new Date().getFullYear()}`;
  }, [slotCode]);

  const qrPayload = useMemo(
    () =>
      `DUITNOW|KBELIA-KELANTAN|${slotCode}|RM${Number(amount || 150).toFixed(2)}|${qrDraftRef}`,
    [slotCode, amount, qrDraftRef]
  );

  const formattedCardBrand = useMemo(() => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
    return 'Kad';
  }, [cardNumber]);

  const handleCardNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(grouped);
    if (validationError) setValidationError(null);
  };

  const handleExpiryChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
    if (validationError) setValidationError(null);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    let channel = '';

    if (method === 'fpx') {
      if (!selectedBank) {
        setValidationError('Sila pilih bank FPX anda untuk meneruskan.');
        return;
      }
      channel = selectedBank;
    } else if (method === 'duitnow_qr') {
      if (!qrConfirmed) {
        setValidationError('Sila tandakan pengesahan pemindahan DuitNow QR terlebih dahulu.');
        return;
      }
      channel = 'DuitNow QR';
    } else if (method === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 15 || digits.length > 16) {
        setValidationError('Sila masukkan nombor kad 16 digit yang sah.');
        return;
      }
      if (!cardHolder.trim() || cardHolder.trim().length < 3) {
        setValidationError('Sila masukkan nama pemegang kad seperti tertera pada kad.');
        return;
      }
      const expMatch = cardExpiry.match(/^(\d{2})\/(\d{2})$/);
      if (!expMatch) {
        setValidationError('Sila masukkan tarikh luput kad dalam format MM/YY.');
        return;
      }
      const expMonth = Number(expMatch[1]);
      const expYear = 2000 + Number(expMatch[2]);
      const now = new Date();
      if (
        expMonth < 1 ||
        expMonth > 12 ||
        expYear < now.getFullYear() ||
        (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)
      ) {
        setValidationError('Tarikh luput kad tidak sah atau telah tamat tempoh.');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv)) {
        setValidationError('Sila masukkan kod keselamatan CVV 3 atau 4 digit.');
        return;
      }
      channel = `${formattedCardBrand} ·••• ${digits.slice(-4)}`;
    }

    try {
      setIsProcessingGateway(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const paidAt = new Date().toISOString();
      const paymentReference = generateTransactionReference(method, slotCode);
      await onConfirmPayment({
        paymentMethod: method,
        paymentChannel: channel,
        paymentReference,
        paidAmount: Number(amount) || 150,
        paidAt
      });
    } catch (err: any) {
      setValidationError(err?.message || 'Transaksi pembayaran gagal disahkan. Sila cuba lagi.');
    } finally {
      setIsProcessingGateway(false);
    }
  };

  const isBusy = submitting || isProcessingGateway;
  const formattedAmount = Number(amount || 150).toLocaleString('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <form onSubmit={handlePaySubmit} className="space-y-4">
      {showInlineSummary && (
        <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 p-4 space-y-2 text-sm tabular-nums">
          <div className="flex items-center justify-between gap-3">
            <span className="text-black/65 dark:text-white/70">Unit &amp; Perniagaan</span>
            <span className="font-bold text-black dark:text-white text-right truncate max-w-[65%]">
              {slotCode} · {businessName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-black/65 dark:text-white/70">Sewa Bulan Pertama (Subsidi)</span>
            <span className="font-semibold text-black dark:text-white">RM {formattedAmount}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-black/65 dark:text-white/70">Deposit Utiliti (Subsidi Negeri)</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Dikecualikan</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3">
            <span className="font-extrabold text-black dark:text-white">Jumlah Perlu Dibayar</span>
            <span className="text-lg font-black text-blue-700 dark:text-blue-400">
              RM {formattedAmount}
            </span>
          </div>
        </div>
      )}

      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-sm text-black dark:text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Segmented Method Tabs */}
      <div
        role="tablist"
        aria-label="Kaedah Pembayaran Atas Talian"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        {[
          {
            id: 'fpx' as const,
            label: 'FPX Perbankan Internet',
            shortLabel: 'FPX Perbankan',
            icon: Landmark
          },
          {
            id: 'duitnow_qr' as const,
            label: 'DuitNow QR',
            shortLabel: 'DuitNow QR',
            icon: QrCode
          },
          {
            id: 'card' as const,
            label: 'Kad Kredit / Debit',
            shortLabel: 'Kad Kredit / Debit',
            icon: CreditCard
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = method === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMethod(tab.id);
                setValidationError(null);
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                active
                  ? `${primaryButtonClass} border-transparent shadow-xs`
                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-black/80 dark:text-white/80 hover:border-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel 1: FPX */}
      {method === 'fpx' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-black/65 dark:text-white/70">
            <span className="font-semibold">Pilih bank perbankan internet anda</span>
            <span className="font-mono font-bold text-black/80 dark:text-white/80">FPX B2C</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FPX_BANKS.map((bank) => {
              const selected = selectedBank === bank.name;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    setSelectedBank(bank.name);
                    setValidationError(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-600/20'
                      : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:border-slate-400'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono font-bold text-black/55 dark:text-white/60">
                      {bank.code}
                    </div>
                    <div className="text-sm font-bold text-black dark:text-white truncate">
                      {bank.name}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 dark:border-zinc-600'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel 2: DuitNow QR */}
      {method === 'duitnow_qr' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-950/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="shrink-0">
              <QrCodeGraphic
                value={qrPayload}
                size={140}
                darkColor="#0F172A"
                includeMonogram={true}
                monogramText="DN"
              />
            </div>

            <div className="flex-1 min-w-0 w-full space-y-2.5 text-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-black/55 dark:text-white/60 block">
                  Penerima Rasmi
                </span>
                <span className="font-extrabold text-black dark:text-white">
                  Bendahari Portal Usahawan Belia Kelantan
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-700 tabular-nums">
                <div>
                  <span className="text-xs text-black/60 dark:text-white/65 block">Jumlah Bayaran</span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-400">
                    RM {formattedAmount}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-black/60 dark:text-white/65 block">Rujukan QR</span>
                  <span className="font-mono text-xs font-bold text-black dark:text-white">
                    {qrDraftRef}
                  </span>
                </div>
              </div>
              <p className="text-xs text-black/65 dark:text-white/70 leading-relaxed">
                Imbas kod menggunakan mana-mana aplikasi perbankan Malaysia atau e-dompet yang menyokong DuitNow QR ({slotName}).
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={qrConfirmed}
              onChange={(e) => {
                setQrConfirmed(e.target.checked);
                if (validationError) setValidationError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-sm font-medium text-black dark:text-white leading-snug">
              Saya mengesahkan bayaran komitmen sebanyak <strong className="tabular-nums">RM {formattedAmount}</strong> telah dipindahkan melalui DuitNow QR.
            </span>
          </label>
        </div>
      )}

      {/* Panel 3: Kad Kredit / Debit */}
      {method === 'card' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-950/60 p-4 space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70">
                Nombor Kad *
              </label>
              <span className="text-xs font-mono font-semibold text-black/65 dark:text-white/70">
                {formattedCardBrand}
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4532 XXXX XXXX XXXX"
              value={cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tabular-nums bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70 block mb-1.5">
              Nama Pemegang Kad *
            </label>
            <input
              type="text"
              autoComplete="cc-name"
              placeholder="NAMA SEPERTI PADA KAD"
              value={cardHolder}
              onChange={(e) => {
                setCardHolder(e.target.value);
                if (validationError) setValidationError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm uppercase bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70 block mb-1.5">
                Tarikh Luput (MM/YY) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                maxLength={5}
                value={cardExpiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tabular-nums bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-black/65 dark:text-white/70 block mb-1.5">
                Kod CVV *
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => {
                  setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (validationError) setValidationError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tabular-nums bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Security Verification Note */}
      <div className="flex items-center gap-2 text-xs text-black/65 dark:text-white/70 pt-0.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          Transaksi dilindungi penyulitan SSL. Hanya komitmen bulan pertama (RM {formattedAmount}) dicaj sekarang.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
        {onBack && (
          <button
            type="button"
            disabled={isBusy}
            onClick={onBack}
            className={`px-4 py-2.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              secondaryButtonClass ||
              'rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        )}
        <button
          type="submit"
          disabled={isBusy}
          className={`px-5 py-3 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1 ${primaryButtonClass}`}
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengesahkan Transaksi...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>{submitLabel || `Bayar RM ${formattedAmount} & Sahkan`}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
