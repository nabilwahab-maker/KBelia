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
        if (role === 'admin') return isMs ? 'Pusat Penyelarasan' : 'Ecosystem Hub';
        if (role === 'mentor') return isMs ? 'Ruang Bimbingan' : 'Mentorship Space';
        return isMs ? 'Ruang Usaha Anda' : 'Your Business Space';
      case 'merchant':
        return isMs ? 'Ruang Usaha Anda' : 'Your Business Space';
      case 'mentor':
        return isMs ? 'Ruang Bimbingan' : 'Mentorship Space';
      case 'mentorship':
        return isMs ? 'Sesi & Senarai Mentor' : 'Mentor Advisory & Sessions';
      case 'admin':
        return isMs ? 'Pusat Penyelarasan' : 'Ecosystem Hub';
      case 'academic':
        return isMs ? 'Teroka Ruang Niaga' : 'Explore Business Spaces';
      case 'hepa':
        return isMs ? 'Komuniti Usahawan Kelantan' : 'Kelantan Entrepreneurs';
      case 'ceed':
        return isMs ? 'Sokongan Modal & Inisiatif' : 'Capital Support & Initiatives';
      case 'events':
        return isMs ? 'Acara & Ekspo Komuniti' : 'Community Events & Expo';
      case 'b2b':
        return isMs ? 'Jaringan Pembekal & Niaga' : 'Trade & Supplier Network';
      case 'calculator':
        return isMs ? 'Anggaran Kelayakan Sokongan' : 'Support Eligibility Estimator';
      case 'news':
        return isMs ? 'Berita & Perkongsian' : 'News & Updates';
      case 'community':
        return isMs ? 'Forum & Perbincangan' : 'Community Forum';
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
          className="hover:text-slate-900 dark:hover:text-[#F5F3EE] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Home className="w-3.5 h-3.5 inline" />
          <span>{isMs ? 'Utama' : 'Home'}</span>
        </button>
        <span className="opacity-40" aria-hidden="true">/</span>
        <span className={`font-semibold tracking-tight truncate ${theme.accentTextClass}`}>
          {breadcrumbLabel}
        </span>
      </nav>
    </div>
  );
};
