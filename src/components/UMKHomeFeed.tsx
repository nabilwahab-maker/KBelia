import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Award, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  FileText, 
  Check, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  Eye,
  MessageCircle,
  Calculator,
  Percent,
  Coins,
  Send,
  ExternalLink,
  GraduationCap,
  PenTool,
  Wrench,
  Network,
  QrCode,
  Compass,
  Users
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { CapsuleSlot, BusinessListing, YouthProgram, CapsuleBooking, GrantApplication, KelantanDistrict } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { KelantanDistrictsMap } from './KelantanDistrictsMap';
import { CommunityAnalyticsWidget } from './CommunityAnalyticsWidget';
import { BusinessSubsidyCalculator } from './BusinessSubsidyCalculator';
import { PortalImage } from './PortalImage';
import { resolveSlotImage } from '../utils/visualAssets';

interface UMKHomeFeedProps {
  setActiveTab: (tab: UMKTab) => void;
  onOpenBooking: () => void;
  onOpenGrantModal?: (title?: string, amount?: string) => void;
  onViewOfferLetter?: (booking: CapsuleBooking) => void;
  onOpenTenancyAgreement?: (booking: CapsuleBooking) => void;
  onOpenVerification?: (refCode?: string) => void;
  onOpenStatusDocuments?: () => void;
  onOpenAcademy?: () => void;
  onOpenMentorship?: () => void;
  onOpenMaintenance?: () => void;
  onOpenB2B?: () => void;
  onOpenEvents?: () => void;
  onOpenCashflow?: () => void;
  slots: CapsuleSlot[];
  businesses: BusinessListing[];
  programs: YouthProgram[];
  bookings?: CapsuleBooking[];
  grantApplications?: GrantApplication[];
  onSelectSlot: (slot: CapsuleSlot) => void;
  onSelectBusiness: (biz: BusinessListing) => void;
}

const DISTRICT_TABS: KelantanDistrict[] = [
  'Semua Jajahan',
  'Kota Bharu',
  'Bachok',
  'Pasir Mas',
  'Tumpat',
  'Tanah Merah',
  'Machang',
  'Pasir Puteh',
  'Kuala Krai',
  'Gua Musang',
  'Jeli'
];

export const UMKHomeFeed: React.FC<UMKHomeFeedProps> = ({
  setActiveTab,
  onOpenBooking,
  onOpenGrantModal,
  onViewOfferLetter,
  onOpenTenancyAgreement,
  onOpenVerification,
  onOpenStatusDocuments,
  onOpenAcademy,
  onOpenMentorship,
  onOpenMaintenance,
  onOpenB2B,
  onOpenEvents,
  onOpenCashflow,
  slots = [],
  businesses = [],
  programs = [],
  bookings = [],
  grantApplications = [],
  onSelectSlot,
  onSelectBusiness
}) => {
  const { user, userProfile, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState<KelantanDistrict>('Semua Jajahan');
  const [dailySalesEstimate, setDailySalesEstimate] = useState<number>(150);

  const safeSlots = slots || [];
  const safeBusinesses = businesses || [];
  const safePrograms = programs || [];
  const availableSlots = safeSlots.filter(s => s && s.status === 'available');

  // Filter slots & businesses by selected district
  const filteredSlots = selectedDistrict === 'Semua Jajahan'
    ? safeSlots
    : safeSlots.filter(s => 
        (s.district && s.district.toLowerCase().includes(selectedDistrict.toLowerCase())) ||
        (s.hubLocation && s.hubLocation.toLowerCase().includes(selectedDistrict.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(selectedDistrict.toLowerCase()))
      );

  const filteredBusinesses = selectedDistrict === 'Semua Jajahan'
    ? safeBusinesses
    : safeBusinesses.filter(b => 
        (b.district && b.district.toLowerCase().includes(selectedDistrict.toLowerCase())) ||
        (b.businessAddress && b.businessAddress.toLowerCase().includes(selectedDistrict.toLowerCase()))
      );

  // Identify active application for the current user
  const userBooking = bookings.find(b => {
    if (!user) return false;
    const isOwnerUid = b.applicantId && b.applicantId === user.uid;
    const isOwnerEmail = b.applicantEmail && user.email && b.applicantEmail.toLowerCase() === user.email.toLowerCase();
    const isOwnerName = userProfile?.fullName && b.applicantName && b.applicantName.toLowerCase() === userProfile.fullName.toLowerCase();
    return isOwnerUid || isOwnerEmail || isOwnerName;
  }) || (bookings.length > 0 && user ? bookings[0] : null);

  // Identify user's grant application if any
  const userGrant = grantApplications.find(g => {
    if (!user) return false;
    return g.applicantId === user.uid || (user.email && g.applicantEmail.toLowerCase() === user.email.toLowerCase());
  }) || (grantApplications.length > 0 && user ? grantApplications[0] : null);

  const displayName = userProfile?.fullName || user?.displayName || (language === 'en' ? 'Kelantan Youth Entrepreneur' : 'Usahawan Belia Kelantan');

  // ROI Calculator Math
  const estimatedMonthlyRevenue = dailySalesEstimate * 30;
  const standardKioskRent = 150;
  const rentRatio = ((standardKioskRent / estimatedMonthlyRevenue) * 100).toFixed(1);
  const estimatedGrossMargin = estimatedMonthlyRevenue - standardKioskRent;

  return (
    <div className="space-y-6 w-full min-w-0">
      
      {/* 1. WELCOME HEADER (TOP-LEFT SOFT SKY BLUE GRADIENT FOR IMPORTANT HEADER ONLY) */}
      <div className="kbelia-important-header rounded-3xl p-6 sm:p-7 border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white flex items-center gap-1.5 border border-amber-200 dark:border-amber-800/70">
                <Sparkles className="w-3.5 h-3.5 text-black dark:text-white/75" />
                <span>{t('portal_brand_title')}</span>
              </span>
              <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 text-black dark:text-white flex items-center gap-1.5 border border-slate-300 dark:border-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{user ? (isAdmin ? t('badge_admin') : t('badge_merchant')) : t('badge_session')}</span>
              </span>
            </div>

            <div className="text-xs text-black dark:text-white font-medium">
              {t('fiscal_year')}
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-black dark:text-white leading-snug">
              {t('welcome_greeting')} <span className="text-black dark:text-white/75">{displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-black dark:text-white mt-1 max-w-2xl leading-relaxed">
              {t('home_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. KAUNTER PERKHIDMATAN PANTAS 1-KLIK */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-600"></span>
            <span>{t('quick_desk_title')}</span>
          </div>
          <span className="text-[11px] text-black/70 dark:text-white/75">{t('quick_desk_subtitle')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 w-full min-w-0">
          
          {/* Card 1: Mohon Kiosk */}
          <div
            onClick={onOpenBooking}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/70 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200">
                {availableSlots.length} {t('vacant_badge')}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_kiosk_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_kiosk_sub')}
              </p>
            </div>
          </div>

          {/* Card 2: Mohon Geran */}
          <div
            onClick={() => {
              if (onOpenGrantModal) onOpenGrantModal();
              else setActiveTab('ceed');
            }}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200/80">
                RM3K - RM5K
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_grant_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_grant_sub')}
              </p>
            </div>
          </div>

          {/* Card 3: Akademi Mikro & Sijil */}
          <div
            onClick={() => onOpenAcademy && onOpenAcademy()}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-black dark:text-white border border-blue-200">
                {language === 'en' ? '4 Modules' : '4 Modul'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_academy_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_academy_sub')}
              </p>
            </div>
          </div>

          {/* Card 4: Hab Temujanji Mentor */}
          <div
            onClick={() => onOpenMentorship && onOpenMentorship()}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200/80">
                {language === 'en' ? 'Free 1-on-1' : '1-ke-1 Percuma'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_mentor_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_mentor_sub')}
              </p>
            </div>
          </div>

          {/* Card 5: Semakan Status Permohonan & Dokumen Tawaran */}
          <div
            onClick={() => onOpenStatusDocuments && onOpenStatusDocuments()}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300">
                {language === 'en' ? 'Offer Letter' : 'Surat Tawaran'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_status_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_status_sub')}
              </p>
            </div>
          </div>

          {/* Card 6: Buku Tunai & Jualan */}
          <div
            onClick={() => onOpenCashflow && onOpenCashflow()}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200">
                DuitNow QR
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_pos_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_pos_sub')}
              </p>
            </div>
          </div>

          {/* Card 7: Papan Padanan Ruang Niaga */}
          <div
            onClick={() => onOpenB2B && onOpenB2B()}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-black dark:text-white border border-teal-200">
                {language === 'en' ? 'Ruang Niaga Stock' : 'Stok Ruang Niaga'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {language === 'en' ? 'Ruang Niaga Supplier Matching' : 'Padanan Pembekal Ruang Niaga'}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {language === 'en' ? 'Find & supply business raw materials.' : 'Cari & bekal bahan mentah.'}
              </p>
            </div>
          </div>

          {/* Card 8: Aduan Kerosakan Kiosk */}
          <div
            onClick={() => onOpenMaintenance && onOpenMaintenance()}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-300 dark:border-slate-600 shadow-xs hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-md active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white flex items-center justify-center border border-slate-300 dark:border-slate-600 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300">
                {language === 'en' ? 'Facilities' : 'Fasiliti'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white group-hover:text-black dark:group-hover:text-white">
                {t('card_maintenance_title')}
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 line-clamp-1">
                {t('card_maintenance_sub')}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. KAD PENJEJAK STATUS PERMOHONAN KIOSK */}
      {userBooking ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-600 p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-300 dark:border-slate-600">
            {/* Left: Compact Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-black dark:text-white bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/70">
                    {userBooking.slotCode}
                  </span>
                  <span className="text-xs font-bold text-black dark:text-white truncate max-w-[200px] sm:max-w-[280px]">
                    {userBooking.slotName}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    userBooking.status === 'approved'
                      ? 'bg-emerald-100 text-black dark:bg-emerald-950/80 dark:text-white'
                      : userBooking.status === 'rejected'
                      ? 'bg-rose-100 text-black dark:bg-rose-950/80 dark:text-white'
                      : 'bg-amber-100 text-black dark:bg-amber-950/80 dark:text-white'
                  }`}>
                    {userBooking.status === 'approved' ? (language === 'en' ? '✓ Approved' : '✓ Diluluskan') : userBooking.status === 'rejected' ? (language === 'en' ? 'Rejected' : 'Ditolak') : (language === 'en' ? '⏳ Under Review' : '⏳ Dalam Semakan')}
                  </span>
                </div>
                <div className="text-[11px] text-black dark:text-white/75 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-black dark:text-white shrink-0" />
                  <span>{userBooking.hubLocation}</span>
                  <span>•</span>
                  <span>{userBooking.durationMonths} {language === 'en' ? 'Months' : 'Bulan'}</span>
                </div>
              </div>
            </div>

            {/* Right: Clean, Compact Buttons */}
            <div className="flex items-center gap-1.5 self-start md:self-auto shrink-0 flex-wrap">
              {userBooking.status === 'approved' && (
                <>
                  <button
                    type="button"
                    onClick={() => onViewOfferLetter && onViewOfferLetter(userBooking)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs dark:bg-indigo-600"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Offer Letter' : 'Surat Tawaran'}</span>
                  </button>

                  {onOpenTenancyAgreement && (
                    <button
                      type="button"
                      onClick={() => onOpenTenancyAgreement(userBooking)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-black dark:text-white border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>{language === 'en' ? 'Agreement' : 'Perjanjian'}</span>
                    </button>
                  )}

                  {onOpenVerification && (
                    <button
                      type="button"
                      onClick={() => onOpenVerification(`KBN-${userBooking.slotCode}`)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800 text-black dark:text-white border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                      title={language === 'en' ? 'Verify QR License' : 'Sahkan Lesen QR'}
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              <a
                href={`https://wa.me/601120508890?text=${encodeURIComponent(language === 'en' ? `Hello KBelia Admin, I would like to inquire about kiosk status ${userBooking.slotCode}.` : `Salam Admin KBelia Kelantan, saya ingin bertanya tentang status kiosk ${userBooking.slotCode}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-black dark:text-white border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>{language === 'en' ? 'Hub WhatsApp' : 'WhatsApp Hab'}</span>
              </a>

              <button
                type="button"
                onClick={() => onOpenMaintenance && onOpenMaintenance()}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800 text-black dark:text-white border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                title={language === 'en' ? 'Facility Maintenance Report' : 'Aduan Kerosakan Fasiliti'}
              >
                <Wrench className="w-4 h-4 text-black dark:text-white" />
              </button>
            </div>
          </div>

          {/* Minimalist Stepper Timeline (Zero Clutter) */}
          <div className="pt-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-black/70 dark:text-white/75">
              <div className="flex items-center gap-1.5 text-black dark:text-white/75">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">1</span>
                <span>{language === 'en' ? 'Submitted' : 'Dihantar'}</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-emerald-500 rounded" />
              
              <div className={`flex items-center gap-1.5 ${
                userBooking.status === 'approved' ? 'text-black dark:text-white/75' : 'text-black dark:text-white/75'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white ${
                  userBooking.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-500'
                }`}>2</span>
                <span>{language === 'en' ? 'Under Review' : 'Semakan'}</span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 rounded ${
                userBooking.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />

              <div className={`flex items-center gap-1.5 ${
                userBooking.status === 'approved' ? 'text-black dark:text-white/75' : 'text-black/70'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white ${
                  userBooking.status === 'approved' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>3</span>
                <span>{language === 'en' ? 'Approval' : 'Kelulusan'}</span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 rounded ${
                userBooking.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />

              <div className={`flex items-center gap-1.5 ${
                userBooking.status === 'approved' ? 'text-black dark:text-white/75' : 'text-black/70'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white ${
                  userBooking.status === 'approved' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}>4</span>
                <span>{language === 'en' ? 'Key Handover' : 'Serah Kunci'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 3B. KAD PENJEJAK STATUS GERAN BELIA (JIKA ADA PERMOHONAN) */}
      {userGrant ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-300 dark:border-slate-600 p-6 shadow-xs transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs dark:bg-blue-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-black dark:text-white">
                    {t('tracker_grant_title')} <span className="text-black dark:text-white/75">{userGrant.programTitle}</span>
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    userGrant.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-black dark:text-white border-emerald-300'
                      : userGrant.status === 'rejected'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-black dark:text-white border-rose-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-black dark:text-white border-amber-300'
                  }`}>
                    {userGrant.status === 'approved' 
                      ? (language === 'en' ? '✓ Grant Approved' : '✓ Geran Diluluskan') 
                      : userGrant.status === 'rejected' 
                      ? (language === 'en' ? 'Application Rejected' : 'Permohonan Ditolak') 
                      : (language === 'en' ? '⏳ Panel Reviewing' : '⏳ Sedang Disemak Panel')}
                  </span>
                </div>
                <p className="text-xs text-black dark:text-white mt-1">
                  {t('grant_value_label')} <strong className="text-black dark:text-white/75 font-bold">{userGrant.grantAmount}</strong> · {t('bank_label')} {userGrant.bankName} ({userGrant.bankAccountNumber})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600">
                {t('purpose_label')} {userGrant.fundPurpose?.slice(0, 30) || (language === 'en' ? 'Entrepreneur Operations' : 'Operasi Usahawan')}...
              </span>
            </div>
          </div>

          {/* 4-Stage Workflow Progress Indicator for Grant */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 space-y-1">
              <div className="h-1.5 w-full bg-emerald-500 rounded-full" />
              <div className="font-bold text-black dark:text-white/75 flex items-center gap-1 text-[11px]">
                <Check className="w-3 h-3" />
                <span>{t('step_received')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 space-y-1">
              <div className={`h-1.5 w-full rounded-full ${
                userGrant.status === 'approved' || userGrant.status === 'rejected'
                  ? 'bg-emerald-500'
                  : 'bg-amber-400'
              }`} />
              <div className="font-bold text-black dark:text-white flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-black/70 dark:text-white/75" />
                <span>{t('step_audit')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 space-y-1">
              <div className={`h-1.5 w-full rounded-full ${
                userGrant.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
              <div className="font-bold text-black dark:text-white flex items-center gap-1 text-[11px]">
                <Award className="w-3 h-3 text-black dark:text-white" />
                <span>{t('step_committee')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 space-y-1">
              <div className={`h-1.5 w-full rounded-full ${
                userGrant.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
              <div className="font-bold text-black dark:text-white flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3 h-3 text-black dark:text-white" />
                <span>{t('step_disburse')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Empty State when no active booking or grant */}
      {!userBooking && !userGrant && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-300 dark:border-slate-600 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-black dark:text-white">
                {language === 'en' ? 'No active applications at the moment' : 'Tiada permohonan aktif buat masa ini'}
              </div>
              <p className="text-xs text-black dark:text-white mt-0.5">
                {language === 'en' ? 'Rent modular business spaces from RM150/month or apply for RM3,000 Youth Seed Grant.' : 'Sewa ruang niaga modular serendah RM150/bulan atau mohon Geran Permulaan Belia RM3,000.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer dark:bg-blue-600"
            >
              <span>{language === 'en' ? 'Apply Kiosk' : 'Mohon Kiosk'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenGrantModal) onOpenGrantModal();
                else setActiveTab('ceed');
              }}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-black border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>{language === 'en' ? 'Apply Grant' : 'Mohon Geran'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PETA INTERAKTIF 10 JAJAHAN KELANTAN */}
      <KelantanDistrictsMap
        slots={safeSlots}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(dist) => setSelectedDistrict(dist)}
        onOpenBookingForDistrict={() => onOpenBooking()}
      />

      {/* 5. WIDGET STATISTIK LANGSUNG & ANALITIK KOMUNITI */}
      <CommunityAnalyticsWidget />

      {/* 6. KALKULATOR SUBSIDI SEWAAN & PULANGAN MODAL (ROI) */}
      <BusinessSubsidyCalculator
        onOpenBooking={onOpenBooking}
        onOpenGrantModal={onOpenGrantModal}
      />

      {/* 6. JADUAL KAPSUL NIAGA TERSEDIA */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-300 dark:border-slate-600 shadow-xs overflow-hidden transition-colors">
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 flex items-center justify-between border-b border-slate-300 dark:border-slate-600">
          <div>
            <h2 className="text-base font-extrabold text-black dark:text-white flex items-center gap-2">
              <span>{t('slots_list_heading')}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200">
                {filteredSlots.filter(s => s.status === 'available').length} {t('vacant_badge')}
              </span>
            </h2>
            <p className="text-xs text-black dark:text-white mt-0.5">
              {language === 'en' ? 'Youth modular kiosk availability schedule by hub' : 'Jadual ketersediaan kiosk modular belia mengikut hab tumpuan'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className="text-xs font-bold text-black dark:text-white/75 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'en' ? 'Open Full Kiosk Module' : 'Lihat Semua Kiosk'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto w-full min-w-0 scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-black dark:text-white uppercase tracking-wider border-b border-slate-300 dark:border-slate-600">
                <th className="py-3 px-4">{language === 'en' ? 'KIOSK CODE' : 'KOD KIOSK'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'LOCATION & DISTRICT' : 'LOKASI & JAJAHAN'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'MONTHLY RATE' : 'KADAR BULANAN'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'STATUS' : 'STATUS'}</th>
                <th className="py-3 px-4 text-right">{language === 'en' ? 'ACTION' : 'TINDAKAN'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-600 text-xs">
              {filteredSlots.slice(0, 5).map((slot) => {
                const isAvail = slot.status === 'available';
                return (
                  <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 shrink-0">
                          <PortalImage
                            src={resolveSlotImage(slot)}
                            alt={slot.name}
                            fallbackType="kiosk"
                            fallbackLabel={slot.code}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-black dark:text-white">{slot.code}</div>
                          <span className="block text-[11px] font-sans font-normal text-black/70 dark:text-white/75 truncate max-w-[180px]">
                            {slot.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black dark:text-white">{slot.hubLocation}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${slot.hubLocation}, ${slot.district}, Kelantan`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-black dark:text-white/75 hover:underline"
                          title={language === 'en' ? 'Open in Google Maps' : 'Buka lokasi di Google Maps'}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>GPS</span>
                        </a>
                      </div>
                      <div className="text-[11px] text-black/70 dark:text-white/75">{slot.district} · {slot.size}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black dark:text-white/75">
                      RM{slot.monthlyRate}<span className="text-[10px] text-black/70 dark:text-white/75 font-normal">{t('per_month')}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        isAvail 
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-black dark:text-white border border-emerald-200' 
                          : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white/75 border border-slate-300'
                      }`}>
                        {isAvail ? t('available') : t('occupied')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isAvail
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs dark:bg-blue-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300'
                        }`}
                      >
                        {isAvail ? (language === 'en' ? 'Apply Kiosk' : 'Mohon Kiosk') : (language === 'en' ? 'View Details' : 'Lihat Maklumat')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. DIREKTORI USAHAWAN BELIA PILIHAN */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-300 dark:border-slate-600 p-5 sm:p-6 shadow-xs transition-colors w-full min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-black dark:text-white flex items-center gap-2">
              <span>{language === 'en' ? 'Local Youth Entrepreneurs' : 'Usahawan Belia Tempatan'}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-black dark:text-white border border-slate-300 dark:border-slate-600">
                {filteredBusinesses.length} {language === 'en' ? 'Active' : 'Aktif'}
              </span>
            </h2>
            <p className="text-xs text-black dark:text-white mt-0.5">
              {language === 'en' ? 'Support products & services produced by Kelantan youth community' : 'Sokong produk & perkhidmatan keluaran komuniti belia Kelantan'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('hepa')}
            className="text-xs font-bold text-black dark:text-white/75 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'en' ? 'Full Directory' : 'Direktori Penuh'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 w-full min-w-0">
          {filteredBusinesses.slice(0, 6).map((biz) => {
            const cleanPhone = (biz.whatsapp || biz.ownerPhone || '601155552026').replace(/[^0-9]/g, '');
            const waMsg = language === 'en'
              ? `Hello entrepreneur ${encodeURIComponent(biz.businessName)}, I saw your business on the KBelia Kelantan Directory and I'm interested in your products.`
              : `Salam usahawan ${encodeURIComponent(biz.businessName)}, saya melihat profil anda di Direktori KBelia Kelantan dan berminat dengan produk anda.`;
            const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

            return (
              <div
                key={biz.id}
                className="p-4 rounded-2xl border border-slate-300 dark:border-slate-600 hover:border-blue-400/70 dark:hover:border-blue-400/70 transition-all bg-white dark:bg-slate-800 flex flex-col justify-between group shadow-2xs hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={biz.logoUrl || '/assets/generated/product_kelantan_delights_1793924253401.jpg'}
                    alt={biz.businessName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-black dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                        {biz.businessName}
                      </span>
                      <span
                        className="shrink-0 flex items-center"
                        title={language === 'en' ? 'SSM Verified Entrepreneur' : 'Usahawan Disahkan SSM'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
                      </span>
                    </div>
                    <div className="text-[10px] text-black dark:text-white font-semibold truncate mt-0.5">
                      {biz.category}
                    </div>
                    <div className="text-[10px] text-black/70 dark:text-white/75 truncate flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-black dark:text-white/75 shrink-0" />
                      <span>{biz.district || 'Kelantan'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectBusiness(biz)}
                    className="text-xs font-bold text-black dark:text-white hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    {language === 'en' ? 'View Profile' : 'Lihat Profil'}
                  </button>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
