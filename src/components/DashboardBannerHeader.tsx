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
  Home,
  Newspaper
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
  onNavigateHome
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
            breadcrumb: isMs ? 'Dashboard Admin' : 'Admin Dashboard',
            dashboardTitle: 'ADMIN DASHBOARD',
            subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
            icon: ShieldCheck,
            iconBg: 'bg-rose-600'
          };
        }
        if (role === 'mentor') {
          return {
            pageLabel: 'Mentor',
            breadcrumb: isMs ? 'Dashboard Mentor' : 'Mentor Dashboard',
            dashboardTitle: 'MENTOR DASHBOARD',
            subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
            icon: GraduationCap,
            iconBg: 'bg-teal-600'
          };
        }
        return {
          pageLabel: isMs ? 'Belia' : 'Youth',
          breadcrumb: isMs ? 'Dashboard Belia' : 'Belia Dashboard',
          dashboardTitle: 'BELIA DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Store,
          iconBg: 'bg-blue-600'
        };

      case 'merchant':
        return {
          pageLabel: isMs ? 'Belia' : 'Youth',
          breadcrumb: isMs ? 'Dashboard Belia' : 'Belia Dashboard',
          dashboardTitle: 'BELIA DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Store,
          iconBg: 'bg-teal-600'
        };

      case 'mentor':
        return {
          pageLabel: 'Mentor',
          breadcrumb: isMs ? 'Dashboard Mentor' : 'Mentor Dashboard',
          dashboardTitle: 'MENTOR DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: GraduationCap,
          iconBg: 'bg-teal-600'
        };

      case 'mentorship':
        return {
          pageLabel: isMs ? 'Bimbingan' : 'Mentoring',
          breadcrumb: isMs ? 'Temu Janji & Senarai Mentor' : 'Mentor Advisory & Appointments',
          dashboardTitle: isMs ? 'BIMBINGAN MENTOR' : 'MENTOR ADVISORY',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: GraduationCap,
          iconBg: 'bg-teal-600'
        };

      case 'admin':
        return {
          pageLabel: 'Admin',
          breadcrumb: isMs ? 'Dashboard Admin' : 'Admin Dashboard',
          dashboardTitle: 'ADMIN DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: ShieldCheck,
          iconBg: 'bg-rose-600'
        };

      case 'academic':
        return {
          pageLabel: isMs ? 'Kiosk Belia' : 'Modular Kiosks',
          breadcrumb: isMs ? 'Senarai & Tempahan Kiosk' : 'Modular Kiosks & Capsules',
          dashboardTitle: isMs ? 'KIOSK USAHAWAN BELIA' : 'MODULAR KIOSK DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Building2,
          iconBg: 'bg-indigo-600'
        };

      case 'hepa':
        return {
          pageLabel: isMs ? 'Senarai Kedai' : 'Directory',
          breadcrumb: isMs ? 'Senarai Usahawan Kelantan' : 'Entrepreneurs Directory',
          dashboardTitle: 'DIREKTORI USAHAWAN',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Users,
          iconBg: 'bg-emerald-600'
        };

      case 'ceed':
        return {
          pageLabel: isMs ? 'Geran' : 'Grants',
          breadcrumb: isMs ? 'Geran dan Bantuan Modal' : 'Youth Grants & Financing',
          dashboardTitle: 'GERAN & PEMBIAYAAN BELIA',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Award,
          iconBg: 'bg-emerald-600'
        };

      case 'events':
        return {
          pageLabel: isMs ? 'Acara' : 'Events',
          breadcrumb: isMs ? 'Program & Ekspo Belia' : 'Youth Events & Expo',
          dashboardTitle: 'ACARA & EKSPO DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Calendar,
          iconBg: 'bg-teal-600'
        };

      case 'b2b':
        return {
          pageLabel: isMs ? 'Ruang Niaga' : 'Ads',
          breadcrumb: isMs ? 'Ruang Iklan & Pembekal' : 'Youth Ads & Commercial',
          dashboardTitle: 'HAB IKLAN & NIAGA',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Briefcase,
          iconBg: 'bg-emerald-600'
        };

      case 'calculator':
        return {
          pageLabel: isMs ? 'Kira Untung' : 'Calculator',
          breadcrumb: isMs ? 'Kira Kelayakan Geran' : 'Grant Eligibility Calculator',
          dashboardTitle: 'KALKULATOR KELAYAKAN',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Coins,
          iconBg: 'bg-emerald-600'
        };

      case 'news':
        return {
          pageLabel: 'News',
          breadcrumb: isMs ? 'Berita & Pengumuman' : 'Official News & Updates',
          dashboardTitle: 'BERITA RASMI KBELIA',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Newspaper,
          iconBg: 'bg-indigo-600'
        };

      case 'settings':
        return {
          pageLabel: isMs ? 'Tetapan' : 'Settings',
          breadcrumb: isMs ? 'Tetapan Akaun' : 'Account Settings',
          dashboardTitle: 'TETAPAN AKAUN',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Settings,
          iconBg: 'bg-indigo-600'
        };

      default:
        return {
          pageLabel: isMs ? 'Dashboard' : 'Dashboard',
          breadcrumb: isMs ? 'Utama' : 'Home',
          dashboardTitle: 'BELIA DASHBOARD',
          subtitle: 'UNIVERSITI MALAYSIA KELANTAN',
          icon: Landmark,
          iconBg: 'bg-blue-600'
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

  return (
    <div className="w-full kbelia-important-header rounded-t-2xl rounded-b-none border border-b border-slate-300 dark:border-zinc-600 px-4 sm:px-6 py-3.5 sm:py-4 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-600 text-white flex items-center justify-center shrink-0 border border-amber-400/70">
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-black dark:text-white font-extrabold text-base sm:text-lg tracking-tight">
            {meta.pageLabel}
          </span>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-black/70 dark:text-white/75">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-black dark:text-white dark:hover:text-white hover:underline transition-colors cursor-pointer flex items-center gap-1 group"
            >
              <Home className="w-3.5 h-3.5 inline" />
              <span>{isMs ? 'Utama' : 'Home'}</span>
            </button>
            <span className="text-black/40 dark:text-white/40 font-bold">&bull;</span>
            <span className="text-black dark:text-white font-semibold">
              {meta.breadcrumb}
            </span>
          </nav>
        </div>

        {/* Today's Date */}
        <div className="self-start sm:self-auto flex items-center gap-2.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 rounded-lg text-xs shadow-2xs">
          <span className="text-black/70 dark:text-white/75 font-medium capitalize">
            {isMs ? 'hari ini' : 'today'}
          </span>
          <span className="text-black dark:text-white font-bold tracking-tight tabular-nums">
            {formattedTodayDate}
          </span>
        </div>
      </div>
    </div>
  );
};
