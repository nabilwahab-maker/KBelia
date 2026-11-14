import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Store,
  Building2,
  Award,
  Search,
  GraduationCap,
  Calendar,
  Network,
  Coins,
  Settings,
  ChevronRight,
  ChevronDown,
  FileCheck,
  ShoppingBag,
  MessageCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Sliders,
  FileText,
  Users,
  X,
  Newspaper,
  Megaphone
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MerchantSubTab, AdminSubTab, MentorSubTab } from '../types';

interface UMKSidebarProps {
  activeTab: UMKTab;
  setActiveTab: (tab: UMKTab) => void;
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenBooking: () => void;
  onOpenMentorshipClinic?: () => void;
  merchantSubTab?: MerchantSubTab;
  onSelectMerchantSubTab?: (subTab: MerchantSubTab) => void;
  adminSubTab?: AdminSubTab;
  onSelectAdminSubTab?: (subTab: AdminSubTab) => void;
  mentorSubTab?: MentorSubTab;
  onSelectMentorSubTab?: (subTab: MentorSubTab) => void;
}

export const UMKSidebar: React.FC<UMKSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  onOpenMentorshipClinic,
  merchantSubTab = 'overview',
  onSelectMerchantSubTab,
  adminSubTab = 'queue',
  onSelectAdminSubTab,
  mentorSubTab = 'overview',
  onSelectMentorSubTab
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [sidebarSearch, setSidebarSearch] = useState('');

  const isMs = language === 'ms';
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;

  // Determine whether the active route belongs inside Category 1's accordion for each role
  const isYouthAccordionRoute =
    (activeTab === 'home' && isYouth) ||
    (activeTab === 'merchant' && merchantSubTab !== 'cashflow');

  const isAdminAccordionRoute =
    (activeTab === 'home' && isAdmin) ||
    (activeTab === 'admin' && adminSubTab !== 'programs' && adminSubTab !== 'mentors');

  const isMentorAccordionRoute =
    (activeTab === 'home' && isMentor) ||
    (activeTab === 'mentor' &&
      (mentorSubTab === 'overview' || mentorSubTab === 'sessions' || mentorSubTab === 'logbook'));

  const [isDashboardAccordionOpen, setIsDashboardAccordionOpen] = useState(isYouthAccordionRoute);
  const [isAdminDashboardAccordionOpen, setIsAdminDashboardAccordionOpen] = useState(isAdminAccordionRoute);
  const [isMentorDashboardAccordionOpen, setIsMentorDashboardAccordionOpen] = useState(isMentorAccordionRoute);

  // Sync accordions cleanly when activeTab / subTab changes externally
  useEffect(() => {
    if (isYouth) {
      setIsDashboardAccordionOpen(isYouthAccordionRoute);
    }
  }, [isYouth, isYouthAccordionRoute]);

  useEffect(() => {
    if (isAdmin) {
      setIsAdminDashboardAccordionOpen(isAdminAccordionRoute);
    }
  }, [isAdmin, isAdminAccordionRoute]);

  useEffect(() => {
    if (isMentor) {
      setIsMentorDashboardAccordionOpen(isMentorAccordionRoute);
    }
  }, [isMentor, isMentorAccordionRoute]);

  const query = sidebarSearch.trim().toLowerCase();
  const matchesSearch = (keywords: string) => {
    if (!query) return true;
    return keywords.toLowerCase().includes(query);
  };

  const navigateAndClose = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  // Shared design tokens for uniform 3-category navigation across all 3 roles
  const navBtnBase =
    'w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl border transition-all duration-150 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';
  const navBtnActive =
    'bg-amber-50/90 dark:bg-[#1E4B85]/15 text-black dark:text-white border-blue-200 dark:border-blue-800/70 shadow-xs ring-1 ring-blue-500/30 font-bold';
  const navBtnIdle =
    'border-transparent text-black dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white';

  const subNavBtnBase =
    'w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all duration-150 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';
  const subNavBtnActive = 'bg-blue-600 text-white font-bold shadow-xs dark:bg-blue-600';
  const subNavBtnIdle =
    'text-black dark:text-white/75 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white';

  const categoryHeaderClass =
    'text-[11px] font-black tracking-wider text-black dark:text-white/75 uppercase px-2 pb-1 whitespace-nowrap truncate';
  const categoryDividerClass = 'pt-3 border-t border-slate-300 dark:border-zinc-600 space-y-1';

  const miniBtnBase =
    'p-2.5 rounded-xl border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';
  const miniBtnActive =
    'bg-amber-50 dark:bg-[#1E4B85]/15 text-black dark:text-white border-blue-200 dark:border-blue-800/70 shadow-xs ring-1 ring-blue-500/30 font-bold';
  const miniBtnIdle =
    'border-transparent text-black/70 dark:text-white/75 hover:bg-amber-50/70 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white';
  const miniDivider = <div className="w-8 h-px bg-slate-300 dark:bg-zinc-600 my-0.5" />;

  // =========================================================================
  // 1. COLLAPSED SIDEBAR VIEW (Desktop Mini Icon Rail - 3 Aligned Groups)
  // =========================================================================
  if (isCollapsed && !isMobileOpen) {
    return (
      <aside
        id="kbelia-left-sidebar"
        className="hidden md:flex w-18 h-full bg-white dark:bg-zinc-950 border-r border-slate-300 dark:border-zinc-600 py-4 flex-col shrink-0 select-none overflow-y-auto z-30 transition-all sticky top-0"
      >
        <div className="flex flex-col items-center gap-2 w-full px-2 pt-1">
          {/* ROLE A MINI: PENTADBIR URUSETIA */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                }}
                title={t('nav_admin_control')}
                className={`${miniBtnBase} ${isAdminAccordionRoute ? miniBtnActive : miniBtnIdle}`}
              >
                <ShieldCheck className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                title={t('nav_kiosk_monitoring')}
                className={`${miniBtnBase} ${activeTab === 'academic' ? miniBtnActive : miniBtnIdle}`}
              >
                <Building2 className="w-5 h-5" />
              </button>

              {miniDivider}

              <button
                type="button"
                onClick={() => setActiveTab('ceed')}
                title={t('nav_grant_monitoring')}
                className={`${miniBtnBase} ${activeTab === 'ceed' ? miniBtnActive : miniBtnIdle}`}
              >
                <Award className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  if (onSelectAdminSubTab) onSelectAdminSubTab('programs');
                }}
                title={isMs ? 'Inisiatif Geran' : 'Grant Initiatives'}
                className={`${miniBtnBase} ${
                  activeTab === 'admin' && adminSubTab === 'programs' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Network className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  if (onSelectAdminSubTab) onSelectAdminSubTab('mentors');
                }}
                title={isMs ? 'Panel Mentor' : 'Mentor Panel'}
                className={`${miniBtnBase} ${
                  activeTab === 'admin' && adminSubTab === 'mentors' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </button>

              {miniDivider}

              <button
                type="button"
                onClick={() => setActiveTab('hepa')}
                title={t('nav_audit_ssm')}
                className={`${miniBtnBase} ${activeTab === 'hepa' ? miniBtnActive : miniBtnIdle}`}
              >
                <Store className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  if (onSelectAdminSubTab) onSelectAdminSubTab('news');
                }}
                title={isMs ? 'Pengurusan Berita' : 'News Manager'}
                className={`${miniBtnBase} ${
                  activeTab === 'admin' && adminSubTab === 'news' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Newspaper className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  if (onSelectAdminSubTab) onSelectAdminSubTab('b2b');
                }}
                title={isMs ? 'Ruang Niaga' : 'Ruang Niaga Ads'}
                className={`${miniBtnBase} ${
                  activeTab === 'admin' && adminSubTab === 'b2b' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Megaphone className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title={t('nav_settings')}
                className={`${miniBtnBase} ${activeTab === 'settings' ? miniBtnActive : miniBtnIdle}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {/* ROLE B MINI: MENTOR BERTAULIAH */}
          {isMentor && (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('overview');
                }}
                title={t('nav_mentorship_hub')}
                className={`${miniBtnBase} ${
                  (activeTab === 'home' && isMentor) ||
                  (activeTab === 'mentor' && mentorSubTab === 'overview')
                    ? miniBtnActive
                    : miniBtnIdle
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                }}
                title={isMs ? 'Sesi Bimbingan' : 'Sessions'}
                className={`${miniBtnBase} ${
                  activeTab === 'mentor' && mentorSubTab === 'sessions' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Calendar className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                }}
                title={isMs ? 'Rekod Sesi' : 'Logbook'}
                className={`${miniBtnBase} ${
                  activeTab === 'mentor' && mentorSubTab === 'logbook' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <FileText className="w-5 h-5" />
              </button>

              {miniDivider}

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                }}
                title={isMs ? 'Perakuan Geran' : 'Grant Endorsements'}
                className={`${miniBtnBase} ${
                  activeTab === 'mentor' && mentorSubTab === 'endorsements' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Award className="w-5 h-5" />
              </button>

              {miniDivider}

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                }}
                title={isMs ? 'Profil & Jadual' : 'Profile & Schedule'}
                className={`${miniBtnBase} ${
                  activeTab === 'mentor' && mentorSubTab === 'profile' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Sliders className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title={t('nav_settings')}
                className={`${miniBtnBase} ${activeTab === 'settings' ? miniBtnActive : miniBtnIdle}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {/* ROLE C MINI: USAHAWAN BELIA */}
          {isYouth && (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('merchant');
                  if (onSelectMerchantSubTab) onSelectMerchantSubTab('overview');
                }}
                title={t('dashboard')}
                className={`${miniBtnBase} ${isYouthAccordionRoute ? miniBtnActive : miniBtnIdle}`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                title={t('nav_my_kiosk')}
                className={`${miniBtnBase} ${activeTab === 'academic' ? miniBtnActive : miniBtnIdle}`}
              >
                <Building2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('merchant');
                  if (onSelectMerchantSubTab) onSelectMerchantSubTab('cashflow');
                }}
                title={t('nav_sales_pos')}
                className={`${miniBtnBase} ${
                  activeTab === 'merchant' && merchantSubTab === 'cashflow' ? miniBtnActive : miniBtnIdle
                }`}
              >
                <Coins className="w-5 h-5" />
              </button>

              {miniDivider}

              <button
                type="button"
                onClick={() => setActiveTab('ceed')}
                title={t('nav_grant_application')}
                className={`${miniBtnBase} ${activeTab === 'ceed' ? miniBtnActive : miniBtnIdle}`}
              >
                <Award className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mentorship')}
                title={t('nav_mentor_clinic')}
                className={`${miniBtnBase} ${activeTab === 'mentorship' ? miniBtnActive : miniBtnIdle}`}
              >
                <GraduationCap className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('b2b')}
                title={isMs ? 'Ruang Niaga' : 'Ruang Niaga Marketplace'}
                className={`${miniBtnBase} ${activeTab === 'b2b' ? miniBtnActive : miniBtnIdle}`}
              >
                <Network className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('events')}
                title={isMs ? 'Acara & Karnival' : 'Events & Expo'}
                className={`${miniBtnBase} ${activeTab === 'events' ? miniBtnActive : miniBtnIdle}`}
              >
                <Calendar className="w-5 h-5" />
              </button>

              {miniDivider}

              <button
                type="button"
                onClick={() => setActiveTab('hepa')}
                title={t('directory')}
                className={`${miniBtnBase} ${activeTab === 'hepa' ? miniBtnActive : miniBtnIdle}`}
              >
                <Store className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title={t('nav_settings')}
                className={`${miniBtnBase} ${activeTab === 'settings' ? miniBtnActive : miniBtnIdle}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 2. EXPANDED SIDEBAR VIEW (Uniform 3-Category + Zero-Duplicate Layout)
  // =========================================================================

  // Role A sub-tab items inside Category 1 accordion (unique only)
  const adminAccordionItems: {
    id: AdminSubTab;
    label: string;
    keywords: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'queue',
      label: isMs ? 'Kelulusan' : 'Approvals',
      keywords: 'kelulusan giliran semakan permohonan approvals queue',
      icon: CheckCircle2
    },
    {
      id: 'bookings',
      label: isMs ? 'Tempahan Kiosk' : 'Bookings',
      keywords: 'kapsul kiosk tempahan sewa bookings',
      icon: Clock
    },
    {
      id: 'businesses',
      label: isMs ? 'Senarai Usahawan' : 'Businesses',
      keywords: 'direktori usahawan perniagaan ssm businesses',
      icon: Store
    },
    {
      id: 'slots',
      label: isMs ? 'Slot Kiosk' : 'Kiosk Slots',
      keywords: 'kiosk slot tapak lokasi slots',
      icon: Building2
    },
    {
      id: 'news',
      label: isMs ? 'Pengurusan Berita' : 'News Manager',
      keywords: 'berita pengumuman warta news manager admin',
      icon: Newspaper
    },
    {
      id: 'b2b',
      label: isMs ? 'Ruang Niaga' : 'Ruang Niaga',
      keywords: 'ruang niaga iklan pembekal gambar b2b ads admin',
      icon: Megaphone
    },
    {
      id: 'sync',
      label: isMs ? 'Muat Semula Data' : 'Data Sync',
      keywords: 'penyegerakan muat semula pangkalan data sync database',
      icon: Database
    },
    {
      id: 'settings',
      label: isMs ? 'Tetapan Operasi' : 'Operations',
      keywords: 'tetapan operasi kawalan parameter system operations',
      icon: Sliders
    }
  ];

  // Role B sub-tab items inside Category 1 accordion (unique only)
  const mentorAccordionItems: {
    id: MentorSubTab;
    label: string;
    keywords: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'overview',
      label: isMs ? 'Ringkasan' : 'Overview',
      keywords: 'ringkasan papan pemuka mentor overview dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'sessions',
      label: isMs ? 'Sesi Bimbingan' : 'Sessions',
      keywords: 'sesi bimbingan kalendar temujanji mentee maya google meet sessions',
      icon: Calendar
    },
    {
      id: 'logbook',
      label: isMs ? 'Rekod Sesi' : 'Logbook',
      keywords: 'rekod sesi log jurnal nota bimbingan kpi kemajuan tugasan logbook',
      icon: FileText
    }
  ];

  // Role C sub-tab items inside Category 1 accordion (unique only - cashflow excluded since it is a Category 1 direct link)
  const youthAccordionItems: {
    id: MerchantSubTab;
    label: string;
    keywords: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'overview',
      label: isMs ? 'Ringkasan' : 'Overview',
      keywords: 'ringkasan dashboard overview',
      icon: BarChart3
    },
    {
      id: 'profile',
      label: isMs ? 'Profil Kedai' : 'Business Profile',
      keywords: 'profil perniagaan bisnes kedai ssm business profile',
      icon: Store
    },
    {
      id: 'products',
      label: isMs ? 'Katalog' : 'Catalog',
      keywords: 'katalog produk barangan servis catalog products',
      icon: ShoppingBag
    },
    {
      id: 'bookings',
      label: isMs ? 'Kiosk Saya' : 'My Capsules',
      keywords: 'kiosk kapsul niaga tempahan sewa bookings',
      icon: Building2
    },
    {
      id: 'vault',
      label: isMs ? 'Dokumen Saya' : 'Legal Docs',
      keywords: 'dokumen saya surat tawaran perjanjian vault documents',
      icon: FileCheck
    },
    {
      id: 'card',
      label: isMs ? 'Kad Digital' : 'Digital Card',
      keywords: 'kad digital whatsapp pautan qr card',
      icon: MessageCircle
    }
  ];

  // Filtered accordion subsets during search
  const filteredAdminAccordion = adminAccordionItems.filter((item) => matchesSearch(item.keywords));
  const filteredMentorAccordion = mentorAccordionItems.filter((item) => matchesSearch(item.keywords));
  const filteredYouthAccordion = youthAccordionItems.filter((item) => matchesSearch(item.keywords));

  // Visibility checks per category so empty search sections hide cleanly
  const adminCat1HasMatches =
    matchesSearch('pusat kawalan pentadbir admin control') ||
    filteredAdminAccordion.length > 0 ||
    matchesSearch('pemantauan kiosk jajahan semakan status kekosongan monitoring');
  const adminCat2HasMatches =
    matchesSearch('pemantauan status geran peruntukan dana bantuan belia grant') ||
    matchesSearch('inisiatif geran program dana kelantan programs') ||
    matchesSearch('panel mentor bimbingan agensi ukm insken mentors');
  const adminCat3HasMatches =
    matchesSearch('audit usahawan direktori semakan ssm audit') ||
    matchesSearch('tetapan akaun profil pentadbir keselamatan settings');

  const mentorCat1HasMatches =
    matchesSearch('portal mentor hab bimbingan mentor hub') || filteredMentorAccordion.length > 0;
  const mentorCat2HasMatches =
    matchesSearch('perakuan geran dana sokongan surat kelulusan benih pemangkin endorsements');
  const mentorCat3HasMatches =
    matchesSearch('profil jadual kelapangan mentor waktu bimbingan profile schedule') ||
    matchesSearch('tetapan akaun kata laluan paparan settings');

  const youthCat1HasMatches =
    matchesSearch('papan pemuka usahawan belia dashboard') ||
    filteredYouthAccordion.length > 0 ||
    matchesSearch('kiosk kapsul modular sewa tapak premis my kiosk') ||
    matchesSearch('jualan aliran tunai pos rekod harian untung sales cashflow');
  const youthCat2HasMatches =
    matchesSearch('permohonan geran benih pembiayaan modal grant') ||
    matchesSearch('sesi bimbingan mentor konsultasi mentoring clinic') ||
    matchesSearch('ruang niaga iklan peluang pembekal market trade') ||
    matchesSearch('acara karnival ekspo bengkel jadual events');
  const youthCat3HasMatches =
    matchesSearch('direktori usahawan kelantan bisnes produk kedai servis ssm directory') ||
    matchesSearch('tetapan akaun profil maklumat bisnes perbankan settings');

  const hasAnySearchMatch = isAdmin
    ? adminCat1HasMatches || adminCat2HasMatches || adminCat3HasMatches
    : isMentor
    ? mentorCat1HasMatches || mentorCat2HasMatches || mentorCat3HasMatches
    : youthCat1HasMatches || youthCat2HasMatches || youthCat3HasMatches;

  const sidebarBody = (
    <aside
      id="kbelia-left-sidebar"
      className="w-64 h-full bg-white dark:bg-zinc-950 border-r border-slate-300 dark:border-zinc-600 p-4 flex flex-col shrink-0 transition-colors duration-200 select-none overflow-y-auto z-30"
    >
      <div className="space-y-4">
        {isMobileOpen && onCloseMobile && (
          <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-300 dark:border-zinc-600">
            <span className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">
              {isMs ? 'Navigasi KBelia' : 'KBelia Navigation'}
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={isMs ? 'Tutup menu' : 'Close menu'}
              className="p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. SEARCH SIDEBAR INPUT */}
        <div className="relative group">
          <input
            type="text"
            placeholder={t('search_sidebar')}
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full pl-3.5 pr-8 py-2 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-indigo-600 transition-all duration-150 dark:focus:border-blue-500"
          />
          {sidebarSearch ? (
            <button
              type="button"
              onClick={() => setSidebarSearch('')}
              aria-label={isMs ? 'Kosongkan carian' : 'Clear search'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 text-black/70 dark:text-white/75 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
        </div>

        {!hasAnySearchMatch && (
          <div className="py-6 px-3 text-center space-y-2 border border-slate-300 dark:border-zinc-600 rounded-xl bg-slate-50 dark:bg-zinc-900">
            <p className="text-xs text-black/70 dark:text-white/75">
              {isMs ? 'Tiada menu yang sepadan.' : 'No matching menu items.'}
            </p>
            <button
              type="button"
              onClick={() => setSidebarSearch('')}
              className="text-xs font-semibold text-black dark:text-white/75 hover:underline cursor-pointer"
            >
              {isMs ? 'Set Semula' : 'Reset'}
            </button>
          </div>
        )}

        {/* =============================================================== */}
        {/* ROLE A: PENTADBIR URUSETIA                                      */}
        {/* =============================================================== */}
        {isAdmin && hasAnySearchMatch && (
          <div className="space-y-4">
            {/* KATEGORI 1: PENGURUSAN */}
            {adminCat1HasMatches && (
              <div className="space-y-1">
                <div className={`${categoryHeaderClass} pt-1`}>
                  {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
                </div>

                {(matchesSearch('pusat kawalan pentadbir admin control') ||
                  filteredAdminAccordion.length > 0) && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdminAccordionRoute) {
                          setIsAdminDashboardAccordionOpen(!isAdminDashboardAccordionOpen);
                        } else {
                          navigateAndClose(() => {
                            setActiveTab('admin');
                            if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                          });
                          setIsAdminDashboardAccordionOpen(true);
                        }
                      }}
                      className={`${navBtnBase} ${isAdminAccordionRoute ? navBtnActive : navBtnIdle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShieldCheck
                          className={`w-4 h-4 shrink-0 ${
                            isAdminAccordionRoute
                              ? 'text-black dark:text-white/75'
                              : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                          }`}
                        />
                        <span className="truncate whitespace-nowrap">{t('nav_admin_control')}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                          isAdminDashboardAccordionOpen || Boolean(query) ? 'rotate-0' : '-rotate-90'
                        } ${
                          isAdminAccordionRoute
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75'
                        }`}
                      />
                    </button>

                    {(isAdminDashboardAccordionOpen || (Boolean(query) && filteredAdminAccordion.length > 0)) && (
                      <div className="ml-3 pl-2.5 border-l border-slate-300 dark:border-zinc-600 space-y-1 pt-0.5 pb-1">
                        {(query ? filteredAdminAccordion : adminAccordionItems).map((item) => {
                          const Icon = item.icon;
                          const isSubActive = activeTab === 'admin' && adminSubTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                navigateAndClose(() => {
                                  setActiveTab('admin');
                                  if (onSelectAdminSubTab) onSelectAdminSubTab(item.id);
                                })
                              }
                              className={`${subNavBtnBase} ${isSubActive ? subNavBtnActive : subNavBtnIdle}`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive
                                    ? 'text-white'
                                    : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                                }`}
                              />
                              <span className="truncate whitespace-nowrap">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {matchesSearch('pemantauan kiosk jajahan semakan status kekosongan monitoring') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('academic'))}
                    className={`${navBtnBase} ${activeTab === 'academic' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'academic'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_kiosk_monitoring')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'academic'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            {adminCat2HasMatches && (
              <div className={adminCat1HasMatches ? categoryDividerClass : 'space-y-1'}>
                <div className={categoryHeaderClass}>
                  {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
                </div>

                {matchesSearch('pemantauan status geran peruntukan dana bantuan belia grant') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('ceed'))}
                    className={`${navBtnBase} ${activeTab === 'ceed' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'ceed'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_grant_monitoring')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'ceed'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('inisiatif geran program dana kelantan programs') && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateAndClose(() => {
                        setActiveTab('admin');
                        if (onSelectAdminSubTab) onSelectAdminSubTab('programs');
                      })
                    }
                    className={`${navBtnBase} ${
                      activeTab === 'admin' && adminSubTab === 'programs' ? navBtnActive : navBtnIdle
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Network
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'admin' && adminSubTab === 'programs'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Inisiatif Geran' : 'Grant Initiatives'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'admin' && adminSubTab === 'programs'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('panel mentor bimbingan agensi ukm insken mentors') && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateAndClose(() => {
                        setActiveTab('admin');
                        if (onSelectAdminSubTab) onSelectAdminSubTab('mentors');
                      })
                    }
                    className={`${navBtnBase} ${
                      activeTab === 'admin' && adminSubTab === 'mentors' ? navBtnActive : navBtnIdle
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GraduationCap
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'admin' && adminSubTab === 'mentors'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Panel Mentor' : 'Mentor Panel'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'admin' && adminSubTab === 'mentors'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* KATEGORI 3: DIREKTORI & PROFIL */}
            {adminCat3HasMatches && (
              <div className={adminCat1HasMatches || adminCat2HasMatches ? categoryDividerClass : 'space-y-1'}>
                <div className={categoryHeaderClass}>
                  {isMs ? 'DIREKTORI & PROFIL' : 'DIRECTORY & PROFILE'}
                </div>

                {matchesSearch('audit usahawan direktori semakan ssm audit') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('hepa'))}
                    className={`${navBtnBase} ${activeTab === 'hepa' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'hepa'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_audit_ssm')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'hepa'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('tetapan akaun profil pentadbir keselamatan settings') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('settings'))}
                    className={`${navBtnBase} ${activeTab === 'settings' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Settings
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'settings'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Tetapan Akaun' : 'Account Settings'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'settings'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* ROLE B: MENTOR BERTAULIAH                                       */}
        {/* =============================================================== */}
        {isMentor && hasAnySearchMatch && (
          <div className="space-y-4">
            {/* KATEGORI 1: PENGURUSAN */}
            {mentorCat1HasMatches && (
              <div className="space-y-1">
                <div className={`${categoryHeaderClass} pt-1`}>
                  {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
                </div>

                {(matchesSearch('portal mentor hab bimbingan mentor hub') ||
                  filteredMentorAccordion.length > 0) && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isMentorAccordionRoute) {
                          setIsMentorDashboardAccordionOpen(!isMentorDashboardAccordionOpen);
                        } else {
                          navigateAndClose(() => {
                            setActiveTab('mentor');
                            if (onSelectMentorSubTab) onSelectMentorSubTab('overview');
                          });
                          setIsMentorDashboardAccordionOpen(true);
                        }
                      }}
                      className={`${navBtnBase} ${isMentorAccordionRoute ? navBtnActive : navBtnIdle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GraduationCap
                          className={`w-4 h-4 shrink-0 ${
                            isMentorAccordionRoute
                              ? 'text-black dark:text-white/75'
                              : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                          }`}
                        />
                        <span className="truncate whitespace-nowrap">{t('nav_mentorship_hub')}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                          isMentorDashboardAccordionOpen || Boolean(query) ? 'rotate-0' : '-rotate-90'
                        } ${
                          isMentorAccordionRoute
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75'
                        }`}
                      />
                    </button>

                    {(isMentorDashboardAccordionOpen || (Boolean(query) && filteredMentorAccordion.length > 0)) && (
                      <div className="ml-3 pl-2.5 border-l border-slate-300 dark:border-zinc-600 space-y-1 pt-0.5 pb-1">
                        {(query ? filteredMentorAccordion : mentorAccordionItems).map((item) => {
                          const Icon = item.icon;
                          const isSubActive =
                            ((activeTab === 'home' && isMentor && item.id === 'overview') ||
                              (activeTab === 'mentor' && mentorSubTab === item.id));
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                navigateAndClose(() => {
                                  setActiveTab('mentor');
                                  if (onSelectMentorSubTab) onSelectMentorSubTab(item.id);
                                })
                              }
                              className={`${subNavBtnBase} ${isSubActive ? subNavBtnActive : subNavBtnIdle}`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive
                                    ? 'text-white'
                                    : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                                }`}
                              />
                              <span className="truncate whitespace-nowrap">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            {mentorCat2HasMatches && (
              <div className={mentorCat1HasMatches ? categoryDividerClass : 'space-y-1'}>
                <div className={categoryHeaderClass}>
                  {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
                </div>

                {matchesSearch('perakuan geran dana sokongan surat kelulusan benih pemangkin endorsements') && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateAndClose(() => {
                        setActiveTab('mentor');
                        if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                      })
                    }
                    className={`${navBtnBase} ${
                      activeTab === 'mentor' && mentorSubTab === 'endorsements'
                        ? navBtnActive
                        : navBtnIdle
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'mentor' && mentorSubTab === 'endorsements'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Sokongan Geran' : 'Grant Endorsements'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'mentor' && mentorSubTab === 'endorsements'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

              </div>
            )}

            {/* KATEGORI 3: PROFIL & TETAPAN */}
            {mentorCat3HasMatches && (
              <div className={mentorCat1HasMatches || mentorCat2HasMatches ? categoryDividerClass : 'space-y-1'}>
                <div className={categoryHeaderClass}>
                  {isMs ? 'PROFIL & TETAPAN' : 'PROFILE & SETTINGS'}
                </div>

                {matchesSearch('profil jadual kelapangan mentor waktu bimbingan profile schedule') && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateAndClose(() => {
                        setActiveTab('mentor');
                        if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                      })
                    }
                    className={`${navBtnBase} ${
                      activeTab === 'mentor' && mentorSubTab === 'profile' ? navBtnActive : navBtnIdle
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sliders
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'mentor' && mentorSubTab === 'profile'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Profil & Jadual' : 'Profile & Schedule'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'mentor' && mentorSubTab === 'profile'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('tetapan akaun kata laluan paparan settings') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('settings'))}
                    className={`${navBtnBase} ${activeTab === 'settings' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Settings
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'settings'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Tetapan Akaun' : 'Account Settings'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'settings'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* ROLE C: USAHAWAN BELIA                                          */}
        {/* =============================================================== */}
        {isYouth && hasAnySearchMatch && (
          <div className="space-y-4">
            {/* KATEGORI 1: PENGURUSAN */}
            {youthCat1HasMatches && (
              <div className="space-y-1">
                <div className={`${categoryHeaderClass} pt-1`}>
                  {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
                </div>

                {(matchesSearch('papan pemuka usahawan belia dashboard') ||
                  filteredYouthAccordion.length > 0) && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isYouthAccordionRoute) {
                          setIsDashboardAccordionOpen(!isDashboardAccordionOpen);
                        } else {
                          navigateAndClose(() => {
                            setActiveTab('merchant');
                            if (onSelectMerchantSubTab) onSelectMerchantSubTab('overview');
                          });
                          setIsDashboardAccordionOpen(true);
                        }
                      }}
                      className={`${navBtnBase} ${isYouthAccordionRoute ? navBtnActive : navBtnIdle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <LayoutDashboard
                          className={`w-4 h-4 shrink-0 ${
                            isYouthAccordionRoute
                              ? 'text-black dark:text-white/75'
                              : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                          }`}
                        />
                        <span className="truncate whitespace-nowrap">{t('dashboard')}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                          isDashboardAccordionOpen || Boolean(query) ? 'rotate-0' : '-rotate-90'
                        } ${
                          isYouthAccordionRoute
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75'
                        }`}
                      />
                    </button>

                    {(isDashboardAccordionOpen || (Boolean(query) && filteredYouthAccordion.length > 0)) && (
                      <div className="ml-3 pl-2.5 border-l border-slate-300 dark:border-zinc-600 space-y-1 pt-0.5 pb-1">
                        {(query ? filteredYouthAccordion : youthAccordionItems).map((item) => {
                          const Icon = item.icon;
                          const isSubActive =
                            (activeTab === 'home' && isYouth && item.id === 'overview') ||
                            (activeTab === 'merchant' && merchantSubTab === item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                navigateAndClose(() => {
                                  setActiveTab('merchant');
                                  if (onSelectMerchantSubTab) onSelectMerchantSubTab(item.id);
                                })
                              }
                              className={`${subNavBtnBase} ${isSubActive ? subNavBtnActive : subNavBtnIdle}`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive
                                    ? 'text-white'
                                    : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                                }`}
                              />
                              <span className="truncate whitespace-nowrap">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {matchesSearch('kiosk kapsul modular sewa tapak premis my kiosk') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('academic'))}
                    className={`${navBtnBase} ${activeTab === 'academic' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'academic'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_my_kiosk')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'academic'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('jualan aliran tunai pos rekod harian untung sales cashflow') && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateAndClose(() => {
                        setActiveTab('merchant');
                        if (onSelectMerchantSubTab) onSelectMerchantSubTab('cashflow');
                      })
                    }
                    className={`${navBtnBase} ${
                      activeTab === 'merchant' && merchantSubTab === 'cashflow'
                        ? navBtnActive
                        : navBtnIdle
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Coins
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'merchant' && merchantSubTab === 'cashflow'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_sales_pos')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'merchant' && merchantSubTab === 'cashflow'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            {youthCat2HasMatches && (
              <div className={youthCat1HasMatches ? categoryDividerClass : 'space-y-1'}>
                <div className={categoryHeaderClass}>
                  {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
                </div>

                {matchesSearch('permohonan geran benih pembiayaan modal grant') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('ceed'))}
                    className={`${navBtnBase} ${activeTab === 'ceed' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'ceed'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_grant_application')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'ceed'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('sesi bimbingan mentor konsultasi mentoring clinic') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('mentorship'))}
                    className={`${navBtnBase} ${activeTab === 'mentorship' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GraduationCap
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'mentorship'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('nav_mentor_clinic')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'mentorship'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('ruang niaga iklan peluang pembekal market trade') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('b2b'))}
                    className={`${navBtnBase} ${activeTab === 'b2b' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Network
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'b2b'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Ruang Niaga' : 'Ruang Niaga Marketplace'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'b2b'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('acara karnival ekspo bengkel jadual events') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('events'))}
                    className={`${navBtnBase} ${activeTab === 'events' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'events'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Acara & Karnival' : 'Events & Expo'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'events'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* KATEGORI 3: DIREKTORI & PROFIL */}
            {youthCat3HasMatches && (
              <div className={youthCat1HasMatches || youthCat2HasMatches ? categoryDividerClass : 'space-y-1'}>
                <div className={categoryHeaderClass}>
                  {isMs ? 'DIREKTORI & PROFIL' : 'DIRECTORY & PROFILE'}
                </div>

                {matchesSearch('direktori usahawan kelantan bisnes produk kedai servis ssm directory') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('hepa'))}
                    className={`${navBtnBase} ${activeTab === 'hepa' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Store
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'hepa'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">{t('directory')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'hepa'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}

                {matchesSearch('tetapan akaun profil maklumat bisnes perbankan settings') && (
                  <button
                    type="button"
                    onClick={() => navigateAndClose(() => setActiveTab('settings'))}
                    className={`${navBtnBase} ${activeTab === 'settings' ? navBtnActive : navBtnIdle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Settings
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'settings'
                            ? 'text-black dark:text-white/75'
                            : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate whitespace-nowrap">
                        {isMs ? 'Tetapan Akaun' : 'Account Settings'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        activeTab === 'settings'
                          ? 'text-black dark:text-white/75'
                          : 'text-black/35 dark:text-white/35'
                      }`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-full shrink-0">{sidebarBody}</div>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 h-full shadow-2xl">{sidebarBody}</div>
        </div>
      )}
    </>
  );
};

export default UMKSidebar;
