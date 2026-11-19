import React from 'react';
import { Home } from 'lucide-react';
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

  const getBreadcrumbLabel = (): string => {
    switch (activeTab) {
      case 'home':
        if (role === 'admin') return isMs ? 'Dashboard Admin' : 'Admin Dashboard';
        if (role === 'mentor') return isMs ? 'Dashboard Mentor' : 'Mentor Dashboard';
        return isMs ? 'Dashboard Belia' : 'Belia Dashboard';
      case 'merchant':
        return isMs ? 'Dashboard Belia' : 'Belia Dashboard';
      case 'mentor':
        return isMs ? 'Dashboard Mentor' : 'Mentor Dashboard';
      case 'mentorship':
        return isMs ? 'Temu Janji & Senarai Mentor' : 'Mentor Advisory & Appointments';
      case 'admin':
        return isMs ? 'Dashboard Admin' : 'Admin Dashboard';
      case 'academic':
        return isMs ? 'Senarai & Tempahan Kiosk' : 'Modular Kiosks & Capsules';
      case 'hepa':
        return isMs ? 'Senarai Usahawan Kelantan' : 'Entrepreneurs Directory';
      case 'ceed':
        return isMs ? 'Geran dan Bantuan Modal' : 'Youth Grants & Financing';
      case 'events':
        return isMs ? 'Program & Ekspo Belia' : 'Youth Events & Expo';
      case 'b2b':
        return isMs ? 'Ruang Iklan & Pembekal' : 'Youth Ads & Commercial';
      case 'calculator':
        return isMs ? 'Kira Kelayakan Geran' : 'Grant Eligibility Calculator';
      case 'news':
        return isMs ? 'Berita & Pengumuman' : 'Official News & Updates';
      case 'community':
        return isMs ? 'Forum & Soal Jawab Usahawan' : 'Entrepreneur Forum & Q&A';
      case 'settings':
        return isMs ? 'Tetapan Akaun' : 'Account Settings';
      default:
        return isMs ? 'Utama' : 'Home';
    }
  };

  const breadcrumbLabel = getBreadcrumbLabel();

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-t-2xl rounded-b-none border border-b border-slate-300 dark:border-zinc-700 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm sm:text-[0.9375rem] font-medium text-black/75 dark:text-white/80 min-w-0 flex-wrap">
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-black dark:hover:text-white hover:underline transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Home className="w-4 h-4 inline" />
          <span>{isMs ? 'Utama' : 'Home'}</span>
        </button>
        <span className="text-black/35 dark:text-white/35" aria-hidden="true">/</span>
        <span className="text-black dark:text-white font-extrabold tracking-tight truncate">
          {breadcrumbLabel}
        </span>
      </nav>
    </div>
  );
};
