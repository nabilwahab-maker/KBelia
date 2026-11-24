import React from 'react';
import {
  Download,
  Printer,
  QrCode,
  Eye,
  Lock,
  ExternalLink
} from 'lucide-react';
import { CapsuleBooking, GrantApplication } from '../types';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  generateGrantApprovalOfficialHtml,
  generateYouthCertificateOfficialHtml
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { getRoleTheme } from '../utils/roleTheme';

interface UserDocumentsVaultProps {
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  onViewOfferLetter: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
  onOpenVerification?: (refCode?: string) => void;
  ownerName?: string;
  ownerEmail?: string;
  businessName?: string;
  district?: string;
  ssmNumber?: string;
}

type CoverCategory = 'certificate' | 'kiosk' | 'tenancy' | 'grant';

interface DocumentCardConfig {
  id: string;
  category: CoverCategory;
  coverTag: string;
  kicker: string;
  kickerColorClass: string;
  title: string;
  description: string;
  locked?: boolean;
  primaryLabel: string;
  primaryIcon: 'printer' | 'eye' | 'external' | 'lock';
  onPrimary?: () => void;
  secondaryActions?: {
    id: string;
    label: string;
    icon: 'download' | 'qr';
    onClick: () => void;
  }[];
}

const DocumentCoverArtwork: React.FC<{ category: CoverCategory; locked?: boolean }> = ({
  category,
  locked = false
}) => {
  if (category === 'certificate') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 25%, #ffffff 1.5px, transparent 1.5px), radial-gradient(circle at 80% 75%, #ffffff 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px'
          }}
        />
        <svg viewBox="0 0 180 110" className="w-36 h-24 drop-shadow-md relative z-10" aria-hidden="true">
          <rect x="24" y="14" width="120" height="82" rx="10" fill="#ffffff" />
          <rect x="30" y="20" width="108" height="70" rx="6" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
          <rect x="44" y="34" width="66" height="6" rx="3" fill="#10B981" opacity="0.35" />
          <rect x="44" y="47" width="80" height="4" rx="2" fill="#059669" opacity="0.22" />
          <rect x="44" y="56" width="60" height="4" rx="2" fill="#059669" opacity="0.22" />
          <rect x="44" y="69" width="38" height="4" rx="2" fill="#047857" opacity="0.3" />
          <path d="M120 75 L114 96 L124 90 L134 96 L128 75 Z" fill="#D97706" />
          <circle cx="124" cy="64" r="15" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="2.5" />
          <circle cx="124" cy="64" r="10.5" fill="#F59E0B" />
          <path
            d="M119.5 64.2 L122.7 67.4 L129 61"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (category === 'kiosk') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
          locked
            ? 'bg-gradient-to-br from-stone-200 via-stone-200 to-stone-300 dark:from-[#17211D] dark:via-[#141D1A] dark:to-[#101614]'
            : 'bg-gradient-to-br from-[#0F2A21] via-[#133A2D] to-[#1A4B3A] dark:from-[#0C2019] dark:via-[#123327] dark:to-[#174233]'
        }`}
      >
        <div
          className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-xl ${
            locked ? 'bg-stone-400/20' : 'bg-[#E5B85C]/25'
          }`}
        />
        <svg
          viewBox="0 0 180 110"
          className={`w-36 h-24 relative z-10 ${locked ? 'opacity-45 grayscale' : 'drop-shadow-lg'}`}
          aria-hidden="true"
        >
          <ellipse cx="90" cy="96" rx="54" ry="6" fill="#0F172A" opacity="0.25" />
          <rect x="44" y="34" width="92" height="58" rx="4" fill="#1F3B31" />
          <rect x="40" y="20" width="100" height="16" rx="4" fill="#12261F" />
          <path d="M40 34 L108 34 L104 46 L36 46 Z" fill="#F5F2EA" />
          <path d="M48 34 L58 34 L54 46 L44 46 Z" fill="#0B6E52" />
          <path d="M68 34 L78 34 L74 46 L64 46 Z" fill="#0B6E52" />
          <path d="M88 34 L98 34 L94 46 L84 46 Z" fill="#0B6E52" />
          <rect x="50" y="48" width="52" height="22" rx="2" fill="#0C1713" />
          <rect x="47" y="68" width="58" height="6" rx="2" fill="#E6E0D0" />
          <rect x="78" y="54" width="14" height="14" rx="2" fill="#FAF8F3" />
          <rect x="110" y="44" width="20" height="44" rx="2" fill="#2A4A3E" stroke="#4D7866" strokeWidth="1.5" />
          <rect x="114" y="50" width="12" height="14" rx="1.5" fill="#E5B85C" opacity="0.7" />
          <circle cx="114" cy="70" r="1.5" fill="#F5F2EA" />
        </svg>
      </div>
    );
  }

  if (category === 'tenancy') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
          locked
            ? 'bg-gradient-to-br from-stone-200 via-stone-200 to-stone-300 dark:from-[#17211D] dark:via-[#141D1A] dark:to-[#101614]'
            : 'bg-gradient-to-br from-[#2B2418] via-[#4A3B22] to-[#7D5A24] dark:from-[#1D1912] dark:via-[#362B19] dark:to-[#5A421C]'
        }`}
      >
        <svg
          viewBox="0 0 180 110"
          className={`w-36 h-24 relative z-10 ${locked ? 'opacity-45 grayscale' : 'drop-shadow-lg'}`}
          aria-hidden="true"
        >
          <path d="M48 16 H104 L118 30 V94 H48 Z" fill="#FAF8F3" stroke="#DDD5C0" strokeWidth="1.5" />
          <path d="M104 16 V30 H118 Z" fill="#DDD5C0" />
          <rect x="58" y="25" width="38" height="5" rx="2.5" fill="#B47B1E" opacity="0.85" />
          <rect x="58" y="37" width="48" height="3.5" rx="1.75" fill="#94A3B8" opacity="0.75" />
          <rect x="58" y="45" width="42" height="3.5" rx="1.75" fill="#94A3B8" opacity="0.75" />
          <rect x="58" y="53" width="46" height="3.5" rx="1.75" fill="#94A3B8" opacity="0.75" />
          <circle cx="66" cy="76" r="9" fill="#FEF3C7" stroke="#D99B26" strokeWidth="1.5" />
          <path
            d="M82 78 C86 71, 90 83, 94 75 C97 70, 101 80, 107 76"
            fill="none"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g transform="translate(108, 70) rotate(-38)">
            <path d="M-8 0 L4 -4 L38 -4 L38 4 L4 4 Z" fill="#1E293B" />
            <rect x="10" y="-4" width="4" height="8" fill="#E5B85C" />
            <path d="M-12 0 L-6 -3 L-6 3 Z" fill="#94A3B8" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
        locked
          ? 'bg-gradient-to-br from-stone-200 via-stone-200 to-stone-300 dark:from-[#17211D] dark:via-[#141D1A] dark:to-[#101614]'
          : 'bg-gradient-to-br from-[#0E4F46] via-[#0B6E52] to-[#1E3A34] dark:from-[#0B362F] dark:via-[#0B5340] dark:to-[#152B25]'
      }`}
    >
      <svg
        viewBox="0 0 180 110"
        className={`w-36 h-24 relative z-10 ${locked ? 'opacity-45 grayscale' : 'drop-shadow-lg'}`}
        aria-hidden="true"
      >
        {/* Grant Voucher Stub */}
        <rect x="26" y="28" width="128" height="58" rx="8" fill="#F8FAFC" />
        <rect x="26" y="28" width="40" height="58" rx="8" fill="#1E293B" />
        <rect x="58" y="28" width="8" height="58" fill="#1E293B" />
        {/* Perforation Dots */}
        <circle cx="66" cy="36" r="2" fill="#94A3B8" />
        <circle cx="66" cy="46" r="2" fill="#94A3B8" />
        <circle cx="66" cy="56" r="2" fill="#94A3B8" />
        <circle cx="66" cy="66" r="2" fill="#94A3B8" />
        <circle cx="66" cy="76" r="2" fill="#94A3B8" />
        {/* Left Emblem */}
        <text x="46" y="48" textAnchor="middle" fill="#93C5FD" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          RM
        </text>
        <circle cx="46" cy="66" r="10" fill="#3B82F6" opacity="0.35" />
        <path
          d="M42 66 L45 69 L51 63"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right Voucher Details */}
        <rect x="76" y="38" width="54" height="7" rx="3" fill="#1E293B" opacity="0.85" />
        <rect x="76" y="51" width="42" height="4" rx="2" fill="#64748B" opacity="0.45" />
        <path
          d="M78 72 C83 65, 88 76, 94 69 C99 65, 104 74, 111 70"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Barcode Lines */}
        <rect x="136" y="38" width="3" height="38" fill="#334155" />
        <rect x="141" y="38" width="1.5" height="38" fill="#334155" />
        <rect x="144" y="38" width="3.5" height="38" fill="#334155" />
      </svg>
    </div>
  );
};

export const UserDocumentsVault: React.FC<UserDocumentsVaultProps> = ({
  bookings,
  grantApplications,
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification,
  ownerName,
  ownerEmail,
  businessName,
  district,
  ssmNumber
}) => {
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const approvedGrants = grantApplications.filter(g => g.status === 'approved');
  const certYear = new Date().getFullYear();
  const certCode = `REG-${certYear}-BELIA`;
  const resolvedName =
    ownerName ||
    approvedBookings[0]?.applicantName ||
    approvedGrants[0]?.applicantName ||
    'Usahawan Belia Kelantan';
  const resolvedEmail =
    ownerEmail || approvedBookings[0]?.applicantEmail || approvedGrants[0]?.applicantEmail;
  const resolvedBusiness =
    businessName || approvedBookings[0]?.businessName || approvedGrants[0]?.businessName;
  const resolvedDistrict = district || approvedBookings[0]?.hubLocation || 'Negeri Kelantan';

  const certificateHtmlParams = {
    fullName: resolvedName,
    email: resolvedEmail,
    businessName: resolvedBusiness,
    district: resolvedDistrict,
    ssmNumber,
    refCode: certCode
  };

  const cards: DocumentCardConfig[] = [];

  // 1. Sijil Pendaftaran Usahawan Belia Kelantan (Sentiasa Tersedia)
  cards.push({
    id: `cert-${certCode}`,
    category: 'certificate',
    coverTag: 'Sijil',
    kicker: 'Keahlian Rasmi',
    kickerColorClass: 'text-emerald-700 dark:text-emerald-400',
    title: 'Sijil Pendaftaran Usahawan Belia',
    description: `${resolvedName}${resolvedBusiness ? ` · ${resolvedBusiness}` : ''} · Rekod rasmi penyertaan keusahawanan belia Kelantan.`,
    primaryLabel: 'Cetak Sijil',
    primaryIcon: 'printer',
    onPrimary: () =>
      openAndPrintDocument(
        generateYouthCertificateOfficialHtml(certificateHtmlParams),
        `Sijil_Usahawan_Belia_${certCode}`
      ),
    secondaryActions: [
      {
        id: 'cert-pdf',
        label: 'Muat Turun PDF Sijil',
        icon: 'download',
        onClick: () =>
          downloadHtmlAsPdf(
            generateYouthCertificateOfficialHtml(certificateHtmlParams),
            `Sijil_Usahawan_Belia_${certCode}.pdf`
          )
      },
      ...(onOpenVerification
        ? [
            {
              id: 'cert-qr',
              label: 'Semak Kod QR Integriti',
              icon: 'qr' as const,
              onClick: () => onOpenVerification(certCode)
            }
          ]
        : [])
    ]
  });

  // 2. Surat Tawaran Kiosk Bersubsidi
  if (approvedBookings.length > 0) {
    approvedBookings.forEach((b) => {
      cards.push({
        id: `offer-${b.id}`,
        category: 'kiosk',
        coverTag: 'Tawaran',
        kicker: 'Kiosk Bersubsidi',
        kickerColorClass: 'text-[#0B6E52] dark:text-[#34D399]',
        title: `Surat Tawaran Ruang Niaga · ${b.slotCode}`,
        description: `${b.hubLocation || b.businessName} · RM${b.monthlyRate || 150}/bulan · ${formatDisplayDate(b.startDate)} hingga ${calculateOperationEndDate(b.startDate, b.durationMonths)}`,
        primaryLabel: 'Buka & Cetak',
        primaryIcon: 'eye',
        onPrimary: () => onViewOfferLetter(b),
        secondaryActions: onOpenVerification
          ? [
              {
                id: `offer-qr-${b.id}`,
                label: 'Semak Kod QR',
                icon: 'qr',
                onClick: () => onOpenVerification(`KBN-${b.slotCode}`)
              }
            ]
          : undefined
      });
    });
  } else {
    cards.push({
      id: 'offer-locked',
      category: 'kiosk',
      coverTag: 'Tawaran',
      kicker: 'Ruang Niaga',
      kickerColorClass: 'text-slate-500 dark:text-stone-400',
      title: 'Surat Tawaran Ruang Niaga',
      description: 'Tersedia selepas permohonan ruang niaga anda disahkan.',
      locked: true,
      primaryLabel: 'Belum Tersedia',
      primaryIcon: 'lock'
    });
  }

  // 3. Perjanjian Sewa Digital
  if (approvedBookings.length > 0 && onOpenTenancyAgreement) {
    approvedBookings.forEach((b) => {
      cards.push({
        id: `tenancy-${b.id}`,
        category: 'tenancy',
        coverTag: 'Perjanjian',
        kicker: 'Kontrak Penyertaan',
        kickerColorClass: 'text-[#B47B1E] dark:text-[#E5B85C]',
        title: `Perjanjian Ruang Niaga · ${b.slotCode}`,
        description: `${b.businessName} · Tempoh penyertaan ${b.durationMonths} bulan.`,
        primaryLabel: 'Buka Perjanjian',
        primaryIcon: 'external',
        onPrimary: () => onOpenTenancyAgreement(b)
      });
    });
  } else {
    cards.push({
      id: 'tenancy-locked',
      category: 'tenancy',
      coverTag: 'Perjanjian',
      kicker: 'Kontrak Penyertaan',
      kickerColorClass: 'text-slate-500 dark:text-stone-400',
      title: 'Perjanjian Penyertaan Ruang Niaga',
      description: 'Tersedia bersama surat tawaran selepas permohonan disahkan.',
      locked: true,
      primaryLabel: 'Belum Tersedia',
      primaryIcon: 'lock'
    });
  }

  // 4. Surat Sokongan / Bantuan
  if (approvedGrants.length > 0) {
    approvedGrants.forEach((g) => {
      const refCode = g.id.slice(0, 8).toUpperCase();
      cards.push({
        id: `grant-${g.id}`,
        category: 'grant',
        coverTag: 'Sokongan',
        kicker: 'Sokongan Modal',
        kickerColorClass: 'text-[#0B6E52] dark:text-[#34D399]',
        title: `${g.programTitle} · ${refCode}`,
        description: `${g.grantAmount} · ${g.businessName}`,
        primaryLabel: 'Cetak Surat',
        primaryIcon: 'printer',
        onPrimary: () =>
          openAndPrintDocument(
            generateGrantApprovalOfficialHtml(g),
            `Surat_Kelulusan_Geran_${refCode}`
          ),
        secondaryActions: [
          {
            id: `grant-pdf-${g.id}`,
            label: 'Muat Turun PDF Surat Geran',
            icon: 'download',
            onClick: () =>
              downloadHtmlAsPdf(
                generateGrantApprovalOfficialHtml(g),
                `Surat_Kelulusan_Geran_${refCode}.pdf`
              )
          }
        ]
      });
    });
  } else {
    cards.push({
      id: 'grant-locked',
      category: 'grant',
      coverTag: 'Geran',
      kicker: 'Dana & Geran',
      kickerColorClass: 'text-slate-500 dark:text-slate-400',
      title: 'Surat Kelulusan Geran Perniagaan',
      description: 'Tersedia selepas permohonan geran perniagaan anda diluluskan oleh pentadbir.',
      locked: true,
      primaryLabel: 'Belum Tersedia',
      primaryIcon: 'lock'
    });
  }

  const renderPrimaryIcon = (icon: DocumentCardConfig['primaryIcon']) => {
    switch (icon) {
      case 'printer':
        return <Printer className="w-4 h-4 shrink-0" />;
      case 'eye':
        return <Eye className="w-4 h-4 shrink-0" />;
      case 'external':
        return <ExternalLink className="w-4 h-4 shrink-0" />;
      case 'lock':
        return <Lock className="w-4 h-4 shrink-0" />;
    }
  };

  const beliaTheme = getRoleTheme('belia');

  return (
    <section className="animate-dashboard-tab space-y-5">
      <div className="px-1 space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-[#F4F1EA] tracking-tight">
          Simpanan Dokumen
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-400">
          Koleksi sijil, surat tawaran, dan rekod penyertaan usaha niaga anda.
        </p>
      </div>

      {/* Grid Kad Dokumen Rasmi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        {cards.map((card, index) => (
          <article
            key={card.id}
            style={{ '--stagger': index } as React.CSSProperties}
            className={`animate-dashboard-card rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 ${beliaTheme.surfaceClass} ${
              card.locked ? 'opacity-80' : ''
            }`}
          >
            <div className="space-y-3.5">
              {/* Kulit Visual Atas */}
              <div className={`relative h-36 sm:h-40 rounded-xl overflow-hidden border ${beliaTheme.dividerClass}`}>
                <DocumentCoverArtwork category={card.category} locked={card.locked} />
              </div>

              {/* Kategori, Tajuk & Ringkasan tanpa pil kotak */}
              <div className="px-0.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={`font-semibold ${card.kickerColorClass}`}>
                    {card.coverTag} · {card.kicker}
                  </span>
                  {card.locked && (
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-stone-400 font-medium">
                      <Lock className="w-3 h-3" />
                      <span>Terkunci</span>
                    </span>
                  )}
                </div>

                <h3
                  className={`text-base font-semibold leading-snug tracking-tight line-clamp-2 ${
                    card.locked
                      ? 'text-slate-700 dark:text-stone-300'
                      : 'text-slate-900 dark:text-[#F4F1EA]'
                  }`}
                >
                  {card.title}
                </h3>

                <p className="text-[0.8125rem] text-slate-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>
            </div>

            {/* Baris Butang Tindakan Bawah Kad */}
            <div className="pt-4 mt-2 flex items-center gap-2 print:hidden">
              {card.locked ? (
                <button
                  type="button"
                  disabled
                  className={`w-full h-10 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed whitespace-nowrap opacity-60 ${beliaTheme.secondaryButtonClass}`}
                >
                  {renderPrimaryIcon(card.primaryIcon)}
                  <span>{card.primaryLabel}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={card.onPrimary}
                    className={`flex-1 min-w-0 h-10 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${beliaTheme.secondaryButtonClass}`}
                  >
                    {renderPrimaryIcon(card.primaryIcon)}
                    <span className="truncate">{card.primaryLabel}</span>
                  </button>

                  {card.secondaryActions?.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onClick}
                      title={action.label}
                      aria-label={action.label}
                      className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${beliaTheme.secondaryButtonClass}`}
                    >
                      {action.icon === 'download' ? (
                        <Download className="w-4 h-4" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
