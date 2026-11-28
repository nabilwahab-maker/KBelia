import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Store,
  Building2,
  Award,
  Search,
  GraduationCap,
  Calendar,
  CalendarDays,
  Network,
  Coins,
  FileCheck,
  ShoppingBag,
  MessageCircle,
  BarChart3,
  Clock,
  Sliders,
  FileText,
  Users,
  X,
  Newspaper,
  Megaphone,
  ClipboardCheck,
  MapPin,
  Compass,
  Settings
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardRole, getRoleTheme } from '../utils/roleTheme';
import { MerchantSubTab, AdminSubTab, MentorSubTab } from '../types';
import { subscribeCrossTabSync } from '../services/realtimeSync';
import {
  SidebarNotificationContextData,
  computeSidebarActionableIds,
  getSidebarUserKey,
  getUnseenMenuCount,
  loadSeenSidebarIds,
  markSidebarMenusSeen
} from '../utils/sidebarNotifications';

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
  notificationData?: Omit<SidebarNotificationContextData, 'isAdmin' | 'isMentor' | 'isYouth'>;
}

interface SidebarNavItem {
  key: string;
  label: string;
  hint?: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

interface SidebarCategoryGroup {
  title: string;
  items: SidebarNavItem[];
}

export const UMKSidebar: React.FC<UMKSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  merchantSubTab = 'overview',
  onSelectMerchantSubTab,
  adminSubTab = 'queue',
  onSelectAdminSubTab,
  mentorSubTab = 'overview',
  onSelectMentorSubTab,
  notificationData
}) => {
  const { user, userProfile, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [localSyncTick, setLocalSyncTick] = useState(0);

  const isMs = language === 'ms';
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;
  const currentRole: DashboardRole = isAdmin ? 'admin' : isMentor ? 'mentor' : 'belia';
  const roleTheme = getRoleTheme(currentRole);

  const sidebarUserKey = getSidebarUserKey(
    notificationData?.userId || user?.uid || userProfile?.userId,
    notificationData?.userEmail || user?.email || userProfile?.email
  );
  const [seenByMenu, setSeenByMenu] = useState<Record<string, string[]>>(() =>
    loadSeenSidebarIds(sidebarUserKey)
  );

  useEffect(() => {
    setSeenByMenu(loadSeenSidebarIds(sidebarUserKey));
  }, [sidebarUserKey]);

  useEffect(() => {
    const bump = () => setLocalSyncTick((n) => n + 1);
    window.addEventListener('kbelia_notifications_updated', bump);
    window.addEventListener('storage', bump);
    const unsubCross = subscribeCrossTabSync(() => bump());
    return () => {
      window.removeEventListener('kbelia_notifications_updated', bump);
      window.removeEventListener('storage', bump);
      unsubCross();
    };
  }, []);

  const itemIdsByMenu = useMemo(
    () =>
      computeSidebarActionableIds({
        ...notificationData,
        userId: notificationData?.userId || user?.uid || undefined,
        userEmail: notificationData?.userEmail || user?.email || undefined,
        isAdmin,
        isMentor,
        isYouth
      }),
    [notificationData, user?.uid, user?.email, isAdmin, isMentor, isYouth, localSyncTick]
  );

  const getCount = (menuKey: string): number =>
    getUnseenMenuCount(menuKey, itemIdsByMenu, seenByMenu);

  const markSeen = (menuKeys: string[]) => {
    setSeenByMenu((prev) => markSidebarMenusSeen(sidebarUserKey, menuKeys, itemIdsByMenu, prev));
  };

  const renderCountBadge = (count: number) => {
    if (count <= 0) return null;
    return (
      <span
        aria-label={`${count} ${isMs ? 'perkara baharu' : 'pending items'}`}
        className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums inline-flex items-center justify-center shrink-0 leading-none ${roleTheme.badgeClass}`}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const renderMiniBadge = (count: number) => {
    if (count <= 0) return null;
    return (
      <span
        aria-label={`${count} ${isMs ? 'perkara baharu' : 'pending items'}`}
        className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold tabular-nums inline-flex items-center justify-center leading-none ring-2 ring-white dark:ring-[#101412] ${roleTheme.badgeClass}`}
      >
        {count > 9 ? '9+' : count}
      </span>
    );
  };

  const query = sidebarSearch.trim().toLowerCase();
  const matchesSearch = (keywords: string) => {
    if (!query) return true;
    return keywords.toLowerCase().includes(query);
  };

  const navigateAndClose = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  const navBtnBase =
    'w-full flex items-center justify-between gap-2 px-3 py-2.25 text-[0.9375rem] font-medium rounded-xl border transition-all duration-150 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30';
  const navBtnActive = roleTheme.activeNavClass;
  const navBtnIdle =
    'border-transparent text-slate-700 dark:text-stone-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-slate-950 dark:hover:text-white';

  const categoryHeaderClass =
    'text-[0.78rem] font-semibold tracking-tight text-slate-500 dark:text-stone-400 px-2 pb-1 whitespace-nowrap truncate';
  const categoryDividerClass = `pt-3 border-t space-y-1 ${roleTheme.dividerClass}`;

  const miniBtnBase =
    'relative p-2.5 rounded-xl border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30';
  const miniBtnActive = roleTheme.activeMiniBtnClass;
  const miniBtnIdle =
    'border-transparent text-slate-600 dark:text-stone-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white';
  const miniDivider = <div className={`w-8 h-px my-0.5 border-t ${roleTheme.dividerClass}`} />;

  // =========================================================================
  // FLAT 3-CATEGORY NAVIGATION CONFIGS PER ROLE (ZERO SUB-BUTTONS)
  // =========================================================================
  const goAdmin = (sub: AdminSubTab, menuKey: string) => {
    markSeen([menuKey]);
    navigateAndClose(() => {
      setActiveTab('admin');
      if (onSelectAdminSubTab) onSelectAdminSubTab(sub);
    });
  };

  const goMentor = (sub: MentorSubTab, menuKey: string) => {
    markSeen([menuKey]);
    navigateAndClose(() => {
      setActiveTab('mentor');
      if (onSelectMentorSubTab) onSelectMentorSubTab(sub);
    });
  };

  const goMerchant = (sub: MerchantSubTab, menuKey: string) => {
    markSeen([menuKey]);
    navigateAndClose(() => {
      setActiveTab('merchant');
      if (onSelectMerchantSubTab) onSelectMerchantSubTab(sub);
    });
  };

  const goTab = (tab: UMKTab, menuKey: string) => {
    markSeen([menuKey]);
    navigateAndClose(() => setActiveTab(tab));
  };

  const roleCategories: SidebarCategoryGroup[] = isAdmin
    ? [
        {
          title: isMs ? 'Pengurusan Utama' : 'Main Management',
          items: [
            {
              key: 'admin:queue',
              label: 'Dashboard',
              keywords: 'dashboard ringkasan utama kelulusan giliran semakan permohonan overview queue',
              icon: LayoutDashboard,
              isActive:
                (activeTab === 'home' && isAdmin) ||
                (activeTab === 'admin' && adminSubTab === 'queue'),
              onClick: () => goAdmin('queue', 'admin:queue')
            },
            {
              key: 'admin:bookings',
              label: isMs ? 'Tempahan Kiosk' : 'Kiosk Bookings',
              keywords: 'tempahan kiosk kapsul sewa bookings',
              icon: Clock,
              isActive: activeTab === 'admin' && adminSubTab === 'bookings',
              onClick: () => goAdmin('bookings', 'admin:bookings')
            },
            {
              key: 'admin:slots',
              label: isMs ? 'Slot Kiosk' : 'Kiosk Slots',
              keywords: 'slot kiosk tapak lokasi kapsul slots',
              icon: Building2,
              isActive: activeTab === 'admin' && adminSubTab === 'slots',
              onClick: () => goAdmin('slots', 'admin:slots')
            },
            {
              key: 'admin:academic',
              label: isMs ? 'Senarai Kiosk' : 'Kiosk List',
              keywords: 'senarai kiosk pemantauan jajahan semakan status kekosongan monitoring',
              icon: MapPin,
              isActive: activeTab === 'academic',
              onClick: () => goTab('academic', 'admin:academic')
            }
          ]
        },
        {
          title: isMs ? 'Geran & Acara' : 'Grants & Events',
          items: [
            {
              key: 'admin:ceed',
              label: isMs ? 'Geran Belia' : 'Youth Grants',
              keywords: 'geran belia pemantauan status peruntukan dana bantuan grant',
              icon: Award,
              isActive: activeTab === 'ceed',
              onClick: () => goTab('ceed', 'admin:ceed')
            },
            {
              key: 'admin:programs',
              label: isMs ? 'Program Geran' : 'Grant Programs',
              keywords: 'program geran inisiatif dana kelantan programs',
              icon: Network,
              isActive: activeTab === 'admin' && adminSubTab === 'programs',
              onClick: () => goAdmin('programs', 'admin:programs')
            },
            {
              key: 'admin:mentors',
              label: isMs ? 'Panel Mentor' : 'Mentor Panel',
              keywords: 'panel mentor bimbingan dalaman rakan industri kbelia mentors',
              icon: GraduationCap,
              isActive: activeTab === 'admin' && adminSubTab === 'mentors',
              onClick: () => goAdmin('mentors', 'admin:mentors')
            },
            {
              key: 'admin:events',
              label: isMs ? 'Acara & Karnival' : 'Events & Expo',
              keywords: 'acara karnival ekspo bengkel tempahan peserta events',
              icon: Calendar,
              isActive: activeTab === 'admin' && adminSubTab === 'events',
              onClick: () => goAdmin('events', 'admin:events')
            }
          ]
        },
        {
          title: isMs ? 'Direktori & Sistem' : 'Directory & System',
          items: [
            {
              key: 'admin:businesses',
              label: isMs ? 'Senarai Usahawan' : 'Entrepreneurs',
              keywords: 'senarai usahawan direktori perniagaan ssm businesses',
              icon: Store,
              isActive: activeTab === 'admin' && adminSubTab === 'businesses',
              onClick: () => goAdmin('businesses', 'admin:businesses')
            },
            {
              key: 'admin:hepa',
              label: isMs ? 'Semak Usahawan' : 'SSM Audit',
              keywords: 'semak usahawan audit direktori semakan ssm audit',
              icon: ClipboardCheck,
              isActive: activeTab === 'hepa',
              onClick: () => goTab('hepa', 'admin:hepa')
            },
            {
              key: 'admin:b2b',
              label: isMs ? 'Pembekal & B2B' : 'B2B & Suppliers',
              keywords: 'pembekal b2b iklan gambar ruang niaga ads admin',
              icon: Megaphone,
              isActive: activeTab === 'admin' && adminSubTab === 'b2b',
              onClick: () => goAdmin('b2b', 'admin:b2b')
            },
            {
              key: 'admin:news',
              label: isMs ? 'Berita Portal' : 'Portal News',
              keywords: 'berita portal pengumuman warta news manager admin',
              icon: Newspaper,
              isActive: activeTab === 'admin' && adminSubTab === 'news',
              onClick: () => goAdmin('news', 'admin:news')
            },
            {
              key: 'admin:users',
              label: isMs ? 'Urus Pengguna' : 'Users',
              keywords: 'urus pengguna akaun profil ahli peranan user management users',
              icon: Users,
              isActive: activeTab === 'admin' && adminSubTab === 'users',
              onClick: () => goAdmin('users', 'admin:users')
            },
            {
              key: 'admin:settings',
              label: isMs ? 'Tetapan' : 'Settings',
              keywords: 'tetapan operasi kawalan parameter system settings operations',
              icon: Sliders,
              isActive: activeTab === 'admin' && adminSubTab === 'settings',
              onClick: () => goAdmin('settings', 'admin:settings')
            }
          ]
        }
      ]
    : isMentor
    ? [
        {
          title: isMs ? 'Bimbingan' : 'Coaching',
          items: [
            {
              key: 'mentor:overview',
              label: 'Dashboard',
              keywords: 'dashboard ringkasan papan pemuka mentor overview',
              icon: LayoutDashboard,
              isActive:
                (activeTab === 'home' && isMentor) ||
                (activeTab === 'mentor' && mentorSubTab === 'overview'),
              onClick: () => goMentor('overview', 'mentor:overview')
            },
            {
              key: 'mentor:sessions',
              label: isMs ? 'Sesi Bimbingan' : 'Sessions',
              keywords: 'sesi bimbingan kalendar temujanji belia google meet sessions',
              icon: Calendar,
              isActive: activeTab === 'mentor' && mentorSubTab === 'sessions',
              onClick: () => goMentor('sessions', 'mentor:sessions')
            },
            {
              key: 'mentor:mentees',
              label: isMs ? 'Senarai Belia' : 'Youth List',
              keywords: 'senarai belia usahawan bimbingan kedai ssm youth',
              icon: Users,
              isActive: activeTab === 'mentor' && mentorSubTab === 'mentees',
              onClick: () => goMentor('mentees', 'mentor:mentees')
            },
            {
              key: 'mentor:logbook',
              label: isMs ? 'Rekod Sesi' : 'Session Log',
              keywords: 'rekod sesi log jurnal nota bimbingan kpi kemajuan tugasan logbook',
              icon: FileText,
              isActive: activeTab === 'mentor' && mentorSubTab === 'logbook',
              onClick: () => goMentor('logbook', 'mentor:logbook')
            },
            {
              key: 'mentor:schedule',
              label: isMs ? 'Jadual' : 'Schedule',
              keywords: 'jadual kalendar temu janji slot bimbingan schedule calendar',
              icon: CalendarDays,
              isActive: activeTab === 'mentor' && mentorSubTab === 'schedule',
              onClick: () => goMentor('schedule', 'mentor:schedule')
            }
          ]
        },
        {
          title: isMs ? 'Semakan Geran' : 'Grant Reviews',
          items: [
            {
              key: 'mentor:readiness',
              label: isMs ? 'Semak Geran' : 'Grant Check',
              keywords: 'semak geran kelayakan ssm jualan readiness',
              icon: ClipboardCheck,
              isActive: activeTab === 'mentor' && mentorSubTab === 'readiness',
              onClick: () => goMentor('readiness', 'mentor:readiness')
            },
            {
              key: 'mentor:endorsements',
              label: isMs ? 'Sokongan Geran' : 'Endorsements',
              keywords: 'sokongan geran perakuan dana surat kelulusan benih pemangkin endorsements',
              icon: Award,
              isActive: activeTab === 'mentor' && mentorSubTab === 'endorsements',
              onClick: () => goMentor('endorsements', 'mentor:endorsements')
            }
          ]
        },
        {
          title: isMs ? 'Laporan & Profil' : 'Reports & Profile',
          items: [
            {
              key: 'mentor:impact',
              label: isMs ? 'Laporan Ringkas' : 'Summary Report',
              keywords: 'laporan ringkas statistik daerah sektor cetak impact report',
              icon: BarChart3,
              isActive: activeTab === 'mentor' && mentorSubTab === 'impact',
              onClick: () => goMentor('impact', 'mentor:impact')
            },
            {
              key: 'mentor:profile',
              label: isMs ? 'Profil Mentor' : 'Mentor Profile',
              keywords: 'profil mentor kepakaran maklumat mentor profile',
              icon: Sliders,
              isActive: activeTab === 'mentor' && mentorSubTab === 'profile',
              onClick: () => goMentor('profile', 'mentor:profile')
            }
          ]
        }
      ]
    : [
        {
          title: isMs ? 'Bisnes Saya' : 'My Business',
          items: [
            {
              key: 'youth:overview',
              label: 'Dashboard',
              keywords: 'dashboard ringkasan papan pemuka usahawan belia overview',
              icon: LayoutDashboard,
              isActive:
                (activeTab === 'home' && isYouth) ||
                (activeTab === 'merchant' && merchantSubTab === 'overview'),
              onClick: () => goMerchant('overview', 'youth:overview')
            },
            {
              key: 'youth:academic',
              label: isMs ? 'Kiosk Saya' : 'My Kiosk',
              keywords: 'kiosk saya tempahan kapsul modular sewa tapak premis booking my kiosk',
              icon: Building2,
              isActive: activeTab === 'academic',
              onClick: () => goTab('academic', 'youth:academic')
            },
            {
              key: 'youth:cashflow',
              label: isMs ? 'Rekod Jualan' : 'Sales Log',
              keywords: 'rekod jualan aliran tunai pos harian untung sales cashflow',
              icon: Coins,
              isActive: activeTab === 'merchant' && merchantSubTab === 'cashflow',
              onClick: () => goMerchant('cashflow', 'youth:cashflow')
            },
            {
              key: 'youth:profile',
              label: isMs ? 'Profil Kedai' : 'Shop Profile',
              keywords: 'profil kedai perniagaan bisnes ssm business profile',
              icon: Store,
              isActive: activeTab === 'merchant' && merchantSubTab === 'profile',
              onClick: () => goMerchant('profile', 'youth:profile')
            },
            {
              key: 'youth:products',
              label: isMs ? 'Produk Saya' : 'My Products',
              keywords: 'produk saya katalog barangan servis my products catalog',
              icon: ShoppingBag,
              isActive: activeTab === 'merchant' && merchantSubTab === 'products',
              onClick: () => goMerchant('products', 'youth:products')
            },
            {
              key: 'youth:vault',
              label: isMs ? 'Dokumen Saya' : 'My Documents',
              keywords: 'dokumen saya surat tawaran perjanjian vault documents',
              icon: FileCheck,
              isActive: activeTab === 'merchant' && merchantSubTab === 'vault',
              onClick: () => goMerchant('vault', 'youth:vault')
            },
            {
              key: 'youth:card',
              label: isMs ? 'Kad Digital' : 'Digital Card',
              keywords: 'kad digital whatsapp pautan qr card',
              icon: MessageCircle,
              isActive: activeTab === 'merchant' && merchantSubTab === 'card',
              onClick: () => goMerchant('card', 'youth:card')
            }
          ]
        },
        {
          title: isMs ? 'Geran & Latihan' : 'Grants & Growth',
          items: [
            {
              key: 'youth:ceed',
              label: isMs ? 'Geran Belia' : 'Youth Grants',
              keywords: 'geran belia permohonan benih pembiayaan modal grant',
              icon: Award,
              isActive: activeTab === 'ceed',
              onClick: () => goTab('ceed', 'youth:ceed')
            },
            {
              key: 'youth:mentorship',
              label: isMs ? 'Bimbingan' : 'Mentoring',
              keywords: 'bimbingan sesi mentor konsultasi mentoring clinic',
              icon: GraduationCap,
              isActive: activeTab === 'mentorship',
              onClick: () => goTab('mentorship', 'youth:mentorship')
            },
            {
              key: 'youth:b2b',
              label: isMs ? 'Pembekal & B2B' : 'B2B & Suppliers',
              keywords: 'pembekal b2b iklan peluang borong ruang niaga market trade',
              icon: Network,
              isActive: activeTab === 'b2b',
              onClick: () => goTab('b2b', 'youth:b2b')
            },
            {
              key: 'youth:events',
              label: isMs ? 'Acara & Karnival' : 'Events & Expo',
              keywords: 'acara karnival ekspo bengkel jadual events',
              icon: Calendar,
              isActive: activeTab === 'events',
              onClick: () => goTab('events', 'youth:events')
            }
          ]
        },
        {
          title: isMs ? 'Direktori' : 'Directory',
          items: [
            {
              key: 'youth:hepa',
              label: isMs ? 'Direktori Kedai' : 'Shop Directory',
              keywords: 'direktori kedai usahawan kelantan bisnes produk servis ssm directory',
              icon: Compass,
              isActive: activeTab === 'hepa',
              onClick: () => goTab('hepa', 'youth:hepa')
            }
          ]
        }
      ];

  // =========================================================================
  // 1. COLLAPSED SIDEBAR VIEW (Desktop Mini Icon Rail - Aligned 3 Categories)
  // =========================================================================
  if (isCollapsed && !isMobileOpen) {
    return (
      <>
        <aside
          id="kbelia-left-sidebar"
          className={`hidden md:flex w-18 h-full border-r py-4 flex-col justify-between shrink-0 select-none overflow-y-auto z-30 transition-all sticky top-0 ${roleTheme.sidebarBgClass}`}
        >
          <div className="flex flex-col items-center gap-2 w-full px-2 pt-1">
            {roleCategories.map((cat, idx) => (
              <React.Fragment key={cat.title}>
                {idx > 0 && miniDivider}
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      title={item.hint ? `${item.label} — ${item.hint}` : item.label}
                      aria-label={item.label}
                      className={`${miniBtnBase} ${item.isActive ? miniBtnActive : miniBtnIdle}`}
                    >
                      <Icon className="w-5 h-5" />
                      {renderMiniBadge(getCount(item.key))}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className={`flex flex-col items-center w-full px-2 pt-3 border-t ${roleTheme.dividerClass}`}>
            <button
              id="kbelia-sidebar-settings-mini-btn"
              type="button"
              onClick={() => navigateAndClose(() => setActiveTab('settings'))}
              title={isMs ? 'Tetapan Akaun' : 'Account Settings'}
              aria-label={isMs ? 'Tetapan Akaun' : 'Account Settings'}
              className={`${miniBtnBase} ${activeTab === 'settings' ? miniBtnActive : miniBtnIdle}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </aside>
      </>
    );
  }

  // =========================================================================
  // 2. EXPANDED SIDEBAR VIEW (Desktop Full + Mobile Drawer - Zero Sub-Buttons)
  // =========================================================================
  const filteredCategories = roleCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => matchesSearch(`${item.label} ${item.keywords}`))
    }))
    .filter((cat) => cat.items.length > 0);

  const hasAnySearchMatch = filteredCategories.length > 0;

  const sidebarBody = (
    <aside
      id="kbelia-left-sidebar"
      className={`w-64 h-full border-r p-4 flex flex-col justify-between gap-4 shrink-0 transition-colors duration-200 select-none overflow-y-auto z-30 ${roleTheme.sidebarBgClass}`}
    >
      <div className="space-y-4">
        {isMobileOpen && onCloseMobile && (
          <div className={`md:hidden flex items-center justify-between pb-2 border-b ${roleTheme.dividerClass}`}>
            <span className="text-[0.875rem] font-bold text-slate-900 dark:text-[#F5F3EE]">
              {isMs ? 'Navigasi KBelia' : 'KBelia Navigation'}
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={isMs ? 'Tutup menu' : 'Close menu'}
              className="p-1.5 rounded-lg text-slate-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. SEARCH SIDEBAR INPUT */}
        <div className="relative group">
          <Search
            className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/70 dark:text-white/75"
          />
          <input
            type="text"
            placeholder={isMentor ? (isMs ? 'Cari menu bimbingan...' : 'Search workspace...') : t('search_sidebar')}
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full pl-3.5 pr-8 py-2 text-[0.875rem] bg-black/[0.03] dark:bg-white/[0.04] border border-slate-300/80 dark:border-white/10 rounded-xl text-slate-900 dark:text-[#F5F3EE] placeholder:text-slate-500 dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-current/25 transition-all duration-150"
          />
          {sidebarSearch && (
            <button
              type="button"
              onClick={() => setSidebarSearch('')}
              aria-label={isMs ? 'Kosongkan carian' : 'Clear search'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!hasAnySearchMatch && (
          <div className="py-6 px-3 text-center space-y-2 border border-slate-300 dark:border-zinc-600 rounded-xl bg-slate-50 dark:bg-zinc-900">
            <p className="text-sm text-black/75 dark:text-white/80">
              {isMs ? 'Tiada menu yang sepadan.' : 'No matching menu items.'}
            </p>
            <button
              type="button"
              onClick={() => setSidebarSearch('')}
              className="text-sm font-semibold text-black hover:text-emerald-700 dark:text-white/80 dark:hover:text-white transition-colors kbelia-link cursor-pointer"
            >
              {isMs ? 'Set Semula' : 'Reset'}
            </button>
          </div>
        )}

        {hasAnySearchMatch && (
          <div className="space-y-4">
            {filteredCategories.map((cat, idx) => (
              <div key={cat.title} className={idx > 0 ? categoryDividerClass : 'space-y-1'}>
                <div className={idx === 0 ? `${categoryHeaderClass} pt-1` : categoryHeaderClass}>
                  {cat.title}
                </div>
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      title={item.hint ? `${item.label} — ${item.hint}` : item.label}
                      className={`${navBtnBase} ${item.isActive ? navBtnActive : navBtnIdle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            item.isActive
                              ? 'text-black dark:text-white/75'
                              : 'text-black/70 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                          }`}
                        />
                        <span
                          data-reserved-text={item.label}
                          className="kbelia-reserved-bold kbelia-reserved-bold-start kbelia-trim min-w-0 max-w-full truncate whitespace-nowrap"
                        >
                          {item.label}
                        </span>
                      </div>
                      {renderCountBadge(getCount(item.key))}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`mt-auto pt-3 border-t ${roleTheme.dividerClass}`}>
        <button
          id="kbelia-sidebar-settings-btn"
          type="button"
          onClick={() => navigateAndClose(() => setActiveTab('settings'))}
          title={isMs ? 'Tetapan Akaun' : 'Account Settings'}
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
            <span
              data-reserved-text={isMs ? 'Tetapan Akaun' : 'Account Settings'}
              className="kbelia-reserved-bold kbelia-reserved-bold-start kbelia-trim min-w-0 max-w-full truncate whitespace-nowrap"
            >
              {isMs ? 'Tetapan Akaun' : 'Account Settings'}
            </span>
          </div>
        </button>
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
