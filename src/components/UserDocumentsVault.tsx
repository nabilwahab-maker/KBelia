import React, { useMemo, useState } from 'react';
import {
  Download,
  Printer,
  QrCode,
  Eye,
  Lock,
  ExternalLink,
  Loader2,
  X,
  ShieldCheck,
  FolderCheck
} from 'lucide-react';
import { CapsuleBooking, GrantApplication, GrantEndorsement, KelantanDistrict } from '../types';
import {
  formatDisplayDate,
  calculateOperationEndDate,
  openAndPrintDocument,
  generateGrantApprovalOfficialHtml,
  generateMentorEndorsementOfficialHtml,
  generateYouthCertificateOfficialHtml
} from '../utils/printUtils';
import { downloadHtmlAsPdf } from '../utils/pdfGenerator';
import { getRoleTheme } from '../utils/roleTheme';
import { AcronymText } from './TypographyPrimitives';
import { showToast } from './ToastNotification';
import { QrCodeGraphic } from './QrCodeGraphic';
import { buildVerificationQrPayload } from '../utils/qrUtils';
import {
  GoogleWorkspaceSplitPane,
  SidePreviewEmptyState,
  SidePreviewHeader,
  SidePreviewMetricsStrip,
  WorkspaceHeaderCard,
  getWorkspaceActiveRowClass
} from './GoogleWorkspaceSplitPane';

interface UserDocumentsVaultProps {
  bookings: CapsuleBooking[];
  grantApplications: GrantApplication[];
  grantEndorsements?: GrantEndorsement[];
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
  refCode: string;
  title: string;
  description: string;
  locked?: boolean;
  primaryLabel: string;
  primaryIcon: 'printer' | 'eye' | 'external' | 'lock';
  onPrimary?: () => void;
  secondaryActions?: {
    id: string;
    label: string;
    shortLabel: string;
    icon: 'download' | 'qr';
    onClick: () => void;
  }[];
}

const DocumentCoverArtwork: React.FC<{ category: CoverCategory; locked?: boolean; compact?: boolean }> = ({
  category,
  locked = false,
  compact = false
}) => {
  const svgClass = compact
    ? `w-10 h-7 relative z-10 ${locked ? 'opacity-45 grayscale' : ''}`
    : `w-44 h-28 relative z-10 ${locked ? 'opacity-45 grayscale' : 'drop-shadow-lg'}`;

  if (category === 'certificate') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 flex items-center justify-center relative overflow-hidden">
        {!compact && (
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 25%, #ffffff 1.5px, transparent 1.5px), radial-gradient(circle at 80% 75%, #ffffff 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px'
            }}
          />
        )}
        <svg viewBox="0 0 180 110" className={svgClass} aria-hidden="true">
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
        <svg viewBox="0 0 180 110" className={svgClass} aria-hidden="true">
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
        <svg viewBox="0 0 180 110" className={svgClass} aria-hidden="true">
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
      <svg viewBox="0 0 180 110" className={svgClass} aria-hidden="true">
        <rect x="26" y="28" width="128" height="58" rx="8" fill="#F8FAFC" />
        <rect x="26" y="28" width="40" height="58" rx="8" fill="#1E293B" />
        <rect x="58" y="28" width="8" height="58" fill="#1E293B" />
        <circle cx="66" cy="36" r="2" fill="#94A3B8" />
        <circle cx="66" cy="46" r="2" fill="#94A3B8" />
        <circle cx="66" cy="56" r="2" fill="#94A3B8" />
        <circle cx="66" cy="66" r="2" fill="#94A3B8" />
        <circle cx="66" cy="76" r="2" fill="#94A3B8" />
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
        <rect x="76" y="38" width="54" height="7" rx="3" fill="#1E293B" opacity="0.85" />
        <rect x="76" y="51" width="42" height="4" rx="2" fill="#64748B" opacity="0.45" />
        <path
          d="M78 72 C83 65, 88 76, 94 69 C99 65, 104 74, 111 70"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
        />
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
  grantEndorsements = [],
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification,
  ownerName,
  ownerEmail,
  businessName,
  district,
  ssmNumber
}) => {
  const beliaTheme = getRoleTheme('belia');
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const approvedGrants = grantApplications.filter(g => g.status === 'approved');
  const endorsedGrants = grantApplications.filter(g => Boolean(g.mentorEndorsed));
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

  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrPreviewCode, setQrPreviewCode] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const runPrintAction = async (actionId: string, html: string, title: string) => {
    if (busyId) return;
    setBusyId(actionId);
    try {
      await openAndPrintDocument(html, title);
    } catch {
      showToast({
        type: 'error',
        title: 'Ralat Cetakan',
        message: 'Gagal membuka pratonton cetakan. Sila gunakan butang Muat Turun PDF.'
      });
    } finally {
      setTimeout(() => setBusyId(null), 500);
    }
  };

  const runPdfAction = async (actionId: string, html: string, fileName: string, docLabel: string) => {
    if (busyId) return;
    setBusyId(actionId);
    try {
      const ok = await downloadHtmlAsPdf(html, fileName);
      if (ok) {
        showToast({
          type: 'success',
          title: 'PDF Rasmi Dimuat Turun',
          message: `${docLabel} berjaya disimpan sebagai fail PDF A4 berbingkai rasmi.`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Gagal Menjana PDF',
          message: 'Tidak dapat mengeksport fail PDF buat masa ini.'
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleTriggerQr = (refCode: string) => {
    if (onOpenVerification) {
      onOpenVerification(refCode);
    } else {
      setQrPreviewCode(refCode);
    }
  };

  const cards: DocumentCardConfig[] = [];

  // 1. Sijil Pendaftaran Usahawan Belia Kelantan (Sentiasa Tersedia)
  cards.push({
    id: `cert-${certCode}`,
    category: 'certificate',
    coverTag: 'Sijil',
    kicker: 'Keahlian Rasmi',
    kickerColorClass: 'text-emerald-700 dark:text-emerald-400',
    refCode: certCode,
    title: 'Sijil Pendaftaran Usahawan Belia',
    description: `${resolvedName}${resolvedBusiness ? ` · ${resolvedBusiness}` : ''} · Rekod rasmi penyertaan keusahawanan belia Kelantan.`,
    primaryLabel: 'Cetak Sijil',
    primaryIcon: 'printer',
    onPrimary: () =>
      void runPrintAction(
        `cert-${certCode}`,
        generateYouthCertificateOfficialHtml(certificateHtmlParams),
        `Sijil_Usahawan_Belia_${certCode}`
      ),
    secondaryActions: [
      {
        id: 'cert-pdf',
        label: 'Muat Turun PDF Sijil',
        shortLabel: 'PDF',
        icon: 'download',
        onClick: () =>
          void runPdfAction(
            'cert-pdf',
            generateYouthCertificateOfficialHtml(certificateHtmlParams),
            `Sijil_Usahawan_Belia_${certCode}.pdf`,
            'Sijil Pendaftaran Usahawan Belia'
          )
      },
      {
        id: 'cert-qr',
        label: 'Semak & Jana Kod QR Integriti',
        shortLabel: 'Kod QR',
        icon: 'qr',
        onClick: () => handleTriggerQr(certCode)
      }
    ]
  });

  // 2. Surat Tawaran Kiosk Bersubsidi
  if (approvedBookings.length > 0) {
    approvedBookings.forEach((b) => {
      cards.push({
        id: `offer-${b.id}`,
        category: 'kiosk',
        coverTag: 'Tawaran',
        kicker: 'Sewa Kiosk',
        kickerColorClass: 'text-[#0B6E52] dark:text-[#34D399]',
        refCode: `KBN-${b.slotCode}`,
        title: `Surat Tawaran Kiosk · ${b.slotCode}`,
        description: `${b.hubLocation || b.businessName} · RM${b.monthlyRate || 150}/bulan · ${formatDisplayDate(b.startDate)} hingga ${calculateOperationEndDate(b.startDate, b.durationMonths)}`,
        primaryLabel: 'Buka & Cetak',
        primaryIcon: 'eye',
        onPrimary: () => onViewOfferLetter(b),
        secondaryActions: [
          {
            id: `offer-qr-${b.id}`,
            label: 'Semak & Jana Kod QR',
            shortLabel: 'Kod QR',
            icon: 'qr',
            onClick: () => handleTriggerQr(`KBN-${b.slotCode}`)
          }
        ]
      });
    });
  } else {
    cards.push({
      id: 'offer-locked',
      category: 'kiosk',
      coverTag: 'Tawaran',
      kicker: 'Sewa Kiosk',
      kickerColorClass: 'text-slate-500 dark:text-stone-400',
      refCode: 'BELUM-SAH',
      title: 'Surat Tawaran Kiosk',
      description: 'Tersedia selepas permohonan sewa kiosk anda diluluskan.',
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
        kicker: 'Perjanjian Kiosk',
        kickerColorClass: 'text-[#B47B1E] dark:text-[#E5B85C]',
        refCode: `PRJ-${b.slotCode}`,
        title: `Perjanjian Sewa Kiosk · ${b.slotCode}`,
        description: `${b.businessName} · Tempoh sewaan ${b.durationMonths} bulan.`,
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
      kicker: 'Perjanjian Kiosk',
      kickerColorClass: 'text-slate-500 dark:text-stone-400',
      refCode: 'BELUM-SAH',
      title: 'Perjanjian Sewa Kiosk',
      description: 'Tersedia bersama surat tawaran selepas permohonan diluluskan.',
      locked: true,
      primaryLabel: 'Belum Tersedia',
      primaryIcon: 'lock'
    });
  }

  // 4. Surat Sokongan Geran Mentor (Langkah 1 sebelum Kelulusan Admin)
  const resolvedMentorEndorsements: GrantEndorsement[] = [
    ...grantEndorsements.filter(e => e.status === 'active'),
    ...endorsedGrants
      .filter(
        (g) =>
          !grantEndorsements.some(
            (e) =>
              (g.endorsementId && e.id === g.endorsementId) ||
              (g.endorsementCode && e.endorsementCode === g.endorsementCode) ||
              (e.grantApplicationId && e.grantApplicationId === g.id)
          )
      )
      .map((g) => ({
        id: g.endorsementId || `end-${g.id}`,
        endorsementCode: g.endorsementCode || `PERAKUAN-${g.id.slice(0, 8).toUpperCase()}`,
        grantApplicationId: g.id,
        mentorId: g.endorsedByMentorId || 'mentor-1',
        mentorName: g.endorsedByMentorName || 'Panel Mentor KBelia',
        mentorAgency: 'Hab Usahawan KBelia',
        mentorDesignation: 'Panel Penilai & Pembimbing Mentor',
        menteeId: g.applicantId,
        menteeName: g.applicantName,
        menteePhone: g.applicantPhone,
        businessName: g.businessName,
        businessCategory: g.businessCategory,
        district: (g.district as KelantanDistrict) || 'Kota Bharu',
        recommendedAmount: g.grantAmount || g.amount || 'RM3,000',
        grantProgramTitle: g.programTitle,
        justification: g.mentorSupportNotes || g.fundPurpose || 'Permohonan geran disokong oleh panel mentor KBelia.',
        businessReadinessRemark: 'Disahkan layak untuk pertimbangan kelulusan Pentadbir KBelia.',
        issuedAt: (g.mentorEndorsedAt || g.updatedAt || new Date().toISOString()).split('T')[0],
        status: 'active' as const
      }))
  ];

  if (resolvedMentorEndorsements.length > 0) {
    resolvedMentorEndorsements.forEach((end) => {
      cards.push({
        id: `endorsement-${end.id}`,
        category: 'grant',
        coverTag: 'Sokongan',
        kicker: 'Sokongan Mentor',
        kickerColorClass: 'text-[#1D4ED8] dark:text-[#60A5FA]',
        refCode: end.endorsementCode,
        title: `Surat Sokongan Geran Mentor · ${end.endorsementCode}`,
        description: `${end.grantProgramTitle} (${end.recommendedAmount}) · Disokong oleh ${end.mentorName}`,
        primaryLabel: 'Cetak Surat',
        primaryIcon: 'printer',
        onPrimary: () =>
          void runPrintAction(
            `endorsement-${end.id}`,
            generateMentorEndorsementOfficialHtml(end),
            `Surat_Sokongan_Mentor_${end.endorsementCode}`
          ),
        secondaryActions: [
          {
            id: `endorsement-pdf-${end.id}`,
            label: 'Muat Turun PDF Surat Sokongan',
            shortLabel: 'PDF',
            icon: 'download',
            onClick: () =>
              void runPdfAction(
                `endorsement-pdf-${end.id}`,
                generateMentorEndorsementOfficialHtml(end),
                `Surat_Sokongan_Mentor_${end.endorsementCode}.pdf`,
                `Surat Sokongan Geran Mentor (${end.endorsementCode})`
              )
          },
          {
            id: `endorsement-qr-${end.id}`,
            label: 'Semak & Jana Kod QR Sokongan',
            shortLabel: 'Kod QR',
            icon: 'qr',
            onClick: () => handleTriggerQr(end.endorsementCode)
          }
        ]
      });
    });
  } else {
    cards.push({
      id: 'endorsement-locked',
      category: 'grant',
      coverTag: 'Sokongan',
      kicker: 'Sokongan Mentor',
      kickerColorClass: 'text-slate-500 dark:text-slate-400',
      refCode: 'MENUNGGU-MENTOR',
      title: 'Surat Sokongan Geran Mentor',
      description: 'Tersedia selepas Mentor menyemak dan mengesahkan sokongan bagi permohonan geran anda.',
      locked: true,
      primaryLabel: 'Menunggu Sokongan Mentor',
      primaryIcon: 'lock'
    });
  }

  // 5. Surat Kelulusan Geran (Langkah 2 oleh Pentadbir)
  if (approvedGrants.length > 0) {
    approvedGrants.forEach((g) => {
      const refCode = g.id.slice(0, 8).toUpperCase();
      cards.push({
        id: `grant-${g.id}`,
        category: 'grant',
        coverTag: 'Kelulusan',
        kicker: 'Geran Belia',
        kickerColorClass: 'text-[#0B6E52] dark:text-[#34D399]',
        refCode: `GRT-${refCode}`,
        title: `${g.programTitle} · ${refCode}`,
        description: `${g.grantAmount} · ${g.businessName}`,
        primaryLabel: 'Cetak Surat',
        primaryIcon: 'printer',
        onPrimary: () =>
          void runPrintAction(
            `grant-${g.id}`,
            generateGrantApprovalOfficialHtml(g),
            `Surat_Kelulusan_Geran_${refCode}`
          ),
        secondaryActions: [
          {
            id: `grant-pdf-${g.id}`,
            label: 'Muat Turun PDF Surat Geran',
            shortLabel: 'PDF',
            icon: 'download',
            onClick: () =>
              void runPdfAction(
                `grant-pdf-${g.id}`,
                generateGrantApprovalOfficialHtml(g),
                `Surat_Kelulusan_Geran_${refCode}.pdf`,
                `Surat Kelulusan Geran (${refCode})`
              )
          },
          {
            id: `grant-qr-${g.id}`,
            label: 'Semak & Jana Kod QR Geran',
            shortLabel: 'Kod QR',
            icon: 'qr',
            onClick: () => handleTriggerQr(`GRT-${refCode}`)
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
      refCode: 'BELUM-SAH',
      title: 'Surat Kelulusan Geran Perniagaan',
      description: 'Tersedia selepas permohonan geran disokong Mentor dan diluluskan oleh Pentadbir.',
      locked: true,
      primaryLabel: 'Belum Tersedia',
      primaryIcon: 'lock'
    });
  }

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter((c) => {
      if (statusTab === 'unlocked' && c.locked) return false;
      if (statusTab === 'locked' && !c.locked) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.coverTag.toLowerCase().includes(q) ||
        c.refCode.toLowerCase().includes(q)
      );
    });
  }, [cards, statusTab, searchQuery]);

  const activeDoc =
    filteredCards.find((c) => c.id === selectedDocId) ||
    filteredCards[0] ||
    null;

  const renderPrimaryIcon = (icon: DocumentCardConfig['primaryIcon']) => {
    switch (icon) {
      case 'printer':
        return <Printer className="w-3.5 h-3.5 shrink-0" />;
      case 'eye':
        return <Eye className="w-3.5 h-3.5 shrink-0" />;
      case 'external':
        return <ExternalLink className="w-3.5 h-3.5 shrink-0" />;
      case 'lock':
        return <Lock className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <section className="animate-dashboard-tab space-y-4">
      <WorkspaceHeaderCard
        role="belia"
        icon={<FolderCheck className="w-5 h-5" />}
        title="Simpanan Dokumen"
        subtitle="Simpan dan semak dokumen rasmi serta surat perakuan anda."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari sijil, surat atau rujukan..."
        filterCount={statusTab !== 'all' ? 1 : 0}
        onResetFilters={() => setStatusTab('all')}
        filterContent={
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1.5">
              Status Dokumen
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'unlocked', label: 'Tersedia' },
                  { id: 'locked', label: 'Terkunci' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusTab(opt.id)}
                  className={`px-2 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                    statusTab === opt.id
                      ? beliaTheme.activeMiniBtnClass
                      : beliaTheme.secondaryButtonClass
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <GoogleWorkspaceSplitPane
        role="belia"
        mobileOpen={mobilePreviewOpen}
        onMobileClose={() => setMobilePreviewOpen(false)}
        mobileTitle={activeDoc?.title}
        leftContent={
          filteredCards.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <FolderCheck className="w-8 h-8 text-slate-400 dark:text-stone-500 mx-auto opacity-60" />
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F1EA]">
                Tiada dokumen ditemui.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusTab('all');
                }}
                className={`text-xs font-semibold hover:underline cursor-pointer ${beliaTheme.accentTextClass}`}
              >
                Set Semula Penapis
              </button>
            </div>
          ) : (
            filteredCards.map((card) => {
              const isSelected = activeDoc?.id === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocId(card.id);
                    setMobilePreviewOpen(true);
                  }}
                  className={`w-full text-left p-3.5 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? getWorkspaceActiveRowClass('belia')
                      : beliaTheme.rowHoverClass
                  } ${card.locked ? 'opacity-75' : ''}`}
                >
                  <div className={`w-16 h-16 rounded-xl overflow-hidden border shrink-0 ${beliaTheme.dividerClass}`}>
                    <DocumentCoverArtwork category={card.category} locked={card.locked} compact />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold truncate kbelia-trim ${isSelected ? beliaTheme.accentTextClass : 'text-slate-900 dark:text-[#F4F1EA]'}`}>
                        <AcronymText text={card.title} />
                      </span>
                      <span
                        className={`text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-lg ${
                          card.locked
                            ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}
                      >
                        {card.locked ? 'Terkunci' : 'Tersedia'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-stone-400 truncate">
                      {card.coverTag} &middot; {card.kicker} &middot; <span className="font-mono">{card.refCode}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-stone-400 truncate">
                      <AcronymText text={card.description} />
                    </p>
                  </div>
                </button>
              );
            })
          )
        }
        rightContent={
          !activeDoc ? (
            <SidePreviewEmptyState
              icon={<FolderCheck className="w-10 h-10 text-slate-400 dark:text-stone-500" />}
              title="Tiada Dokumen Dipilih"
              description="Butiran sijil, surat tawaran, perjanjian dan tindakan cetakan akan dipaparkan di sini."
            />
          ) : (
            <div>
              <SidePreviewHeader
                role="belia"
                media={
                  <div className={`w-20 h-20 rounded-2xl overflow-hidden border ${beliaTheme.dividerClass}`}>
                    <DocumentCoverArtwork category={activeDoc.category} locked={activeDoc.locked} compact />
                  </div>
                }
                title={<AcronymText text={activeDoc.title} />}
                status={
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                      activeDoc.locked
                        ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    }`}
                  >
                    {activeDoc.locked ? 'Belum Tersedia' : 'Sah & Tersedia'}
                  </span>
                }
                subtitle={`${activeDoc.coverTag} · ${activeDoc.kicker}`}
                meta={
                  <>
                    <span className="font-mono tabular-nums">Rujukan: {activeDoc.refCode}</span>
                    {resolvedBusiness && (
                      <>
                        <span>&middot;</span>
                        <span>{resolvedBusiness}</span>
                      </>
                    )}
                  </>
                }
                actions={
                  activeDoc.locked ? (
                    <button
                      type="button"
                      disabled
                      className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 opacity-60 cursor-not-allowed ${beliaTheme.secondaryButtonClass}`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{activeDoc.primaryLabel}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={activeDoc.onPrimary}
                        disabled={busyId === activeDoc.id}
                        className={`px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${beliaTheme.primaryButtonClass}`}
                      >
                        {busyId === activeDoc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : (
                          renderPrimaryIcon(activeDoc.primaryIcon)
                        )}
                        <span>{busyId === activeDoc.id ? 'Membuka...' : activeDoc.primaryLabel}</span>
                      </button>

                      {activeDoc.secondaryActions?.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={action.onClick}
                          disabled={busyId === action.id}
                          title={action.label}
                          className={`px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 ${beliaTheme.secondaryButtonClass}`}
                        >
                          {busyId === action.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : action.icon === 'download' ? (
                            <Download className="w-3.5 h-3.5" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5" />
                          )}
                          <span>{action.shortLabel}</span>
                        </button>
                      ))}
                    </>
                  )
                }
              />

              <div className="p-4 sm:p-5 space-y-4">
                {/* Visual Artwork Banner */}
                <div className={`h-40 sm:h-44 rounded-xl overflow-hidden border ${beliaTheme.dividerClass}`}>
                  <DocumentCoverArtwork category={activeDoc.category} locked={activeDoc.locked} />
                </div>

                {/* 3-Column Spec Grid */}
                <SidePreviewMetricsStrip
                  role="belia"
                  items={[
                    { label: 'Kategori Dokumen', value: `${activeDoc.coverTag} · ${activeDoc.kicker}` },
                    { label: 'No. Rujukan Rasmi', value: activeDoc.refCode, mono: true },
                    {
                      label: 'Status Kelayakan',
                      value: activeDoc.locked ? 'Menunggu Pengesahan' : 'Aktif & Sah',
                      accent: !activeDoc.locked
                    }
                  ]}
                />

                {/* Full Description */}
                <div className="space-y-1.5">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400">
                    Keterangan Dokumen
                  </h5>
                  <div className={`p-3.5 rounded-xl border text-sm text-slate-800 dark:text-stone-200 leading-relaxed ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                    <AcronymText text={activeDoc.description} />
                  </div>
                </div>

                {/* Inline Real QR Preview Card when document supports QR or when triggered */}
                {!activeDoc.locked && activeDoc.secondaryActions?.some((a) => a.icon === 'qr') && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${beliaTheme.surfaceMutedClass} ${beliaTheme.dividerClass}`}>
                    <div className="shrink-0">
                      <QrCodeGraphic
                        value={buildVerificationQrPayload(activeDoc.refCode)}
                        size={120}
                        caption="KOD QR KETULENAN"
                        subcaption={activeDoc.refCode}
                        showDownloadButton
                        downloadFileName={`QR_${activeDoc.refCode}.png`}
                      />
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className={`inline-flex items-center gap-1.5 text-xs font-bold ${beliaTheme.accentTextClass}`}>
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Kod QR Pengesahan Ketulenan Rasmi</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-400 leading-relaxed">
                        Imbas kod QR ini atau muat turun sebagai imej PNG beresolusi tinggi untuk mengesahkan ketulenan dokumen rujukan <strong className="font-mono text-slate-900 dark:text-[#F4F1EA]">{activeDoc.refCode}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }
      />

      {qrPreviewCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-[#0B6E52]" />
                Kod QR Pengesahan
              </span>
              <button
                type="button"
                onClick={() => setQrPreviewCode(null)}
                aria-label="Tutup"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <QrCodeGraphic
              value={buildVerificationQrPayload(qrPreviewCode)}
              size={168}
              caption="KOD QR KETULENAN KBELIA"
              subcaption={qrPreviewCode}
              showDownloadButton
              downloadFileName={`QR_${qrPreviewCode}.png`}
            />
          </div>
        </div>
      )}
    </section>
  );
};
