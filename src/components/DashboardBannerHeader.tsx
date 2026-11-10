import React from 'react';
import { 
  Building2, 
  Store, 
  GraduationCap, 
  ShieldCheck, 
  Landmark, 
  Award, 
  Calendar, 
  Briefcase, 
  Coins, 
  Settings, 
  Users, 
  UserCheck,
  ChevronRight,
  Home
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { useLanguage } from '../context/LanguageContext';

interface DashboardBannerHeaderProps {
  activeTab: UMKTab;
  role: 'belia' | 'mentor' | 'admin' | 'public';
  userName?: string;
  onNavigateHome?: () => void;
  onNavigateTab?: (tab: UMKTab) => void;
}

export const DashboardBannerHeader: React.FC<DashboardBannerHeaderProps> = ({
  activeTab,
  role,
  userName = 'MUHAMMAD NABIL BIN ABDUL WAHAB',
  onNavigateHome,
  onNavigateTab
}) => {
  const { language } = useLanguage();
  const isMs = language === 'ms';

  // Determine dynamic metadata based on tab and role
  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'home':
        if (role === 'admin') {
          return {
            pageLabel: 'Admin',
            breadcrumb: isMs ? 'Papan Pemuka Pentadbir' : 'Admin Dashboard',
            dashboardTitle: 'ADMIN DASHBOARD',
            subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
            icon: ShieldCheck,
            iconBg: 'bg-[#003B95]'
          };
        }
        if (role === 'mentor') {
          return {
            pageLabel: 'Mentor',
            breadcrumb: isMs ? 'Papan Pemuka Mentor' : 'Mentor Dashboard',
            dashboardTitle: 'MENTOR DASHBOARD',
            subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
            icon: GraduationCap,
            iconBg: 'bg-[#003B95]'
          };
        }
        return {
          pageLabel: isMs ? 'Belia' : 'Youth',
          breadcrumb: isMs ? 'Papan Pemuka Belia' : 'Belia Dashboard',
          dashboardTitle: 'BELIA DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Store,
          iconBg: 'bg-[#003B95]'
        };

      case 'merchant':
        return {
          pageLabel: isMs ? 'Belia' : 'Youth',
          breadcrumb: isMs ? 'Papan Pemuka Belia' : 'Belia Dashboard',
          dashboardTitle: 'BELIA DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Store,
          iconBg: 'bg-[#003B95]'
        };

      case 'mentor':
        return {
          pageLabel: 'Mentor',
          breadcrumb: isMs ? 'Papan Pemuka Mentor' : 'Mentor Dashboard',
          dashboardTitle: 'MENTOR DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: GraduationCap,
          iconBg: 'bg-[#003B95]'
        };

      case 'admin':
        return {
          pageLabel: 'Admin',
          breadcrumb: isMs ? 'Papan Pemuka Pentadbir' : 'Admin Dashboard',
          dashboardTitle: 'ADMIN DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: ShieldCheck,
          iconBg: 'bg-[#003B95]'
        };

      case 'academic':
        return {
          pageLabel: isMs ? 'Kapsul Niaga' : 'Modular Kiosks',
          breadcrumb: isMs ? 'Kapsul & Kiosk Modular' : 'Modular Kiosks & Capsules',
          dashboardTitle: isMs ? 'KIOSK & KAPSUL NIAGA' : 'MODULAR KIOSK DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Building2,
          iconBg: 'bg-[#003B95]'
        };

      case 'hepa':
        return {
          pageLabel: isMs ? 'Direktori' : 'Directory',
          breadcrumb: isMs ? 'Direktori Usahawan Kelantan' : 'Entrepreneurs Directory',
          dashboardTitle: 'DIREKTORI USAHAWAN',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Users,
          iconBg: 'bg-[#003B95]'
        };

      case 'ceed':
        return {
          pageLabel: isMs ? 'Geran' : 'Grants',
          breadcrumb: isMs ? 'Geran dan Pembiayaan Belia' : 'Youth Grants & Financing',
          dashboardTitle: 'GERAN & PEMBIAYAAN BELIA',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Award,
          iconBg: 'bg-[#003B95]'
        };

      case 'events':
        return {
          pageLabel: isMs ? 'Acara' : 'Events',
          breadcrumb: isMs ? 'Karnival & Ekspo Belia' : 'Youth Events & Expo',
          dashboardTitle: 'ACARA & EKSPO DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Calendar,
          iconBg: 'bg-[#003B95]'
        };

      case 'b2b':
        return {
          pageLabel: isMs ? 'Iklan' : 'Ads',
          breadcrumb: isMs ? 'Ruang Iklan Niaga' : 'Youth Ads & Commercial',
          dashboardTitle: 'HAB IKLAN & NIAGA',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Briefcase,
          iconBg: 'bg-[#003B95]'
        };

      case 'calculator':
        return {
          pageLabel: isMs ? 'Kalkulator' : 'Calculator',
          breadcrumb: isMs ? 'Kalkulator Kelayakan Geran' : 'Grant Eligibility Calculator',
          dashboardTitle: 'KALKULATOR KELAYAKAN',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Coins,
          iconBg: 'bg-[#003B95]'
        };

      case 'settings':
        return {
          pageLabel: isMs ? 'Tetapan' : 'Settings',
          breadcrumb: isMs ? 'Tetapan Akaun' : 'Account Settings',
          dashboardTitle: 'TETAPAN AKAUN',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Settings,
          iconBg: 'bg-[#003B95]'
        };

      default:
        return {
          pageLabel: isMs ? 'Papan Pemuka' : 'Dashboard',
          breadcrumb: isMs ? 'Utama' : 'Home',
          dashboardTitle: 'BELIA DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Landmark,
          iconBg: 'bg-[#003B95]'
        };
    }
  };

  const meta = getHeaderMeta();
  const IconComponent = meta.icon;

  // Format date supporting both Bahasa Melayu and Bahasa Inggeris
  const formattedTodayDate = (() => {
    try {
      const now = new Date();
      if (isMs) {
        const dayShort = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'][now.getDay()];
        const monthNames = [
          'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
          'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        const day = String(now.getDate()).padStart(2, '0');
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        return `${dayShort}, ${day} ${month} ${year}`;
      } else {
        return new Intl.DateTimeFormat('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(now);
      }
    } catch {
      return isMs ? 'Isn, 02 November 2026' : 'Mon, 02 November 2026';
    }
  })();

  const displayName = (userName && userName.trim().length > 0) 
    ? userName.toUpperCase() 
    : 'MUHAMMAD NABIL BIN ABDUL WAHAB';

  return (
    <div className="w-full bg-white dark:bg-[#24303F] rounded-t-2xl rounded-b-none border border-b-0 border-slate-200 dark:border-[#2E3A47] p-4 sm:p-5 lg:p-6 shadow-2xs transition-colors">
      
      {/* 1. Top Bar: Breadcrumb on Left, Today Date on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm flex-wrap">
          {/* Main bold title on left */}
          <span className="text-slate-900 dark:text-white font-extrabold text-base sm:text-lg tracking-tight">
            {meta.pageLabel}
          </span>

          {/* Breadcrumb path: Home • Dashboard */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1 interactive-press group"
            >
              <Home className="w-3.5 h-3.5 inline transition-transform duration-200 group-hover:scale-110" />
              <span>{isMs ? 'Utama' : 'Home'}</span>
            </button>
            <span className="text-slate-300 dark:text-slate-600 font-bold">&bull;</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              {meta.breadcrumb}
            </span>
          </nav>
        </div>

        {/* Date Badge: Dynamic based on language setting */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs sm:text-sm shadow-2xs interactive-lift cursor-default">
          <span className="text-slate-500 dark:text-slate-400 font-semibold capitalize">
            {isMs ? 'hari ini' : 'today'}
          </span>
          <span className="text-slate-900 dark:text-white font-black tracking-tight tabular-nums">
            {formattedTodayDate}
          </span>
        </div>
      </div>

      {/* 2. Horizontal Tricolor Gradient Divider Line (Blue -> Red -> Amber) */}
      <div className="-mx-4 sm:-mx-5 lg:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] lg:w-[calc(100%+3rem)] h-[3.5px] bg-gradient-to-r from-[#003B95] via-[#C8102E] to-[#F59E0B] my-3.5 sm:my-4 shadow-2xs" />

      {/* 3. Centered Brand Block */}
      <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-3 text-center">
        
        {/* Logo and Title inline row */}
        <div className="flex items-center justify-center gap-3.5 sm:gap-4 group">
          
          {/* University/Role Icon Badge in rounded-2xl square */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#003B95] dark:bg-blue-700 text-white flex items-center justify-center rounded-2xl shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105">
            <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>

          {/* Main Title */}
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#003B95] dark:text-blue-400 tracking-wide uppercase leading-none">
              {meta.dashboardTitle}
            </h1>
            {/* Colored Accent Line Directly Below Title */}
            <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-[#003B95] via-[#C8102E] to-[#F59E0B] mt-1.5 sm:mt-2" />
          </div>
        </div>

        {/* 4. Badges Row: Live Data + User Full Name (Semester excluded per instruction) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mt-4 sm:mt-5">
          
          {/* Live Data Badge */}
          <div className="px-3.5 py-1 rounded-full border border-blue-500 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/50 text-[#003B95] dark:text-blue-300 text-xs font-bold flex items-center gap-2 shadow-2xs interactive-lift cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400" />
            </span>
            <span>Live Data</span>
          </div>

          {/* Subtle vertical separator */}
          <span className="text-slate-300 dark:text-slate-700 font-light hidden sm:inline">|</span>

          {/* User Full Name Badge */}
          <div className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs font-black flex items-center gap-2 uppercase tracking-wide shadow-2xs interactive-lift cursor-default group">
            <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span>{displayName}</span>
          </div>
        </div>

        {/* 5. Tricolor Dash Indicator Trio (Blue, Red, Amber) */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-1" aria-hidden="true">
          <div className="w-8 sm:w-10 h-1 bg-[#003B95] rounded-full" />
          <div className="w-8 sm:w-10 h-1 bg-[#C8102E] rounded-full" />
          <div className="w-8 sm:w-10 h-1 bg-[#F59E0B] rounded-full" />
        </div>

      </div>

    </div>
  );
};
