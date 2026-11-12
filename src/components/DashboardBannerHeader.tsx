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
    <div className="w-full bg-white dark:bg-[#24303F] rounded-t-2xl rounded-b-none border border-b border-slate-200 dark:border-[#2E3A47] px-4 sm:px-6 py-3.5 sm:py-4 shadow-2xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <IconComponent className="w-4 h-4" />
          </div>
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
    </div>
  );
};
