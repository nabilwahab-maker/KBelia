import React from 'react';
import { Home } from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { useLanguage } from '../context/LanguageContext';
import { DashboardRole, getRoleTheme } from '../utils/roleTheme';

interface DashboardBannerHeaderProps {
  activeTab: UMKTab;
  role: DashboardRole;
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
  const theme = getRoleTheme(role);

  const getBreadcrumbLabel = (): string => {
    switch (activeTab) {
      case 'home':
        if (role === 'admin') return isMs ? 'Panel Admin' : 'Admin Panel';
        if (role === 'mentor') return isMs ? 'Portal Mentor' : 'Mentor Portal';
        return isMs ? 'Dashboard Usahawan' : 'Merchant Dashboard';
      case 'merchant':
        return isMs ? 'Bisnes Saya' : 'My Business';
      case 'mentor':
        return isMs ? 'Portal Mentor' : 'Mentor Portal';
      case 'mentorship':
        return isMs ? 'Tempah Sesi Mentor' : 'Book Mentor Session';
      case 'admin':
        return isMs ? 'Panel Admin' : 'Admin Panel';
      case 'academic':
        return isMs ? 'Lokasi & Sewa Kiosk' : 'Kiosk Locations';
      case 'hepa':
        return isMs ? 'Direktori Kedai Belia' : 'Youth Business Directory';
      case 'ceed':
        return isMs ? 'Geran & Bantuan Modal' : 'Grants & Funding';
      case 'events':
        return isMs ? 'Acara & Karnival' : 'Events & Expos';
      case 'b2b':
        return isMs ? 'Pembekal & B2B' : 'B2B & Suppliers';
      case 'calculator':
        return isMs ? 'Kalkulator Untung & Geran' : 'Profit & Grant Calculator';
      case 'news':
        return isMs ? 'Berita & Info Terkini' : 'News & Updates';
      case 'community':
        return isMs ? 'Forum Usahawan' : 'Entrepreneur Forum';
      case 'settings':
        return isMs ? 'Tetapan Akaun' : 'Account Settings';
      default:
        return isMs ? 'Utama' : 'Home';
    }
  };

  const breadcrumbLabel = getBreadcrumbLabel();

  return (
    <div className="w-full px-1 sm:px-2 pb-2.5 pt-0.5">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs sm:text-[0.875rem] font-medium text-slate-600 dark:text-stone-400 min-w-0 flex-wrap"
      >
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-slate-900 dark:hover:text-[#F5F3EE] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 kbelia-link kbelia-trim"
        >
          <Home className="w-3.5 h-3.5 inline" />
          <span>{isMs ? 'Utama' : 'Home'}</span>
        </button>
        <span className="opacity-40" aria-hidden="true">/</span>
        <span className={`font-semibold tracking-tight truncate kbelia-trim ${theme.accentTextClass}`}>
          {breadcrumbLabel}
        </span>
      </nav>
    </div>
  );
};
