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
  X
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
  const [isDashboardAccordionOpen, setIsDashboardAccordionOpen] = useState(activeTab === 'merchant' || activeTab === 'home');
  const [isAdminDashboardAccordionOpen, setIsAdminDashboardAccordionOpen] = useState(activeTab === 'admin' || (activeTab === 'home' && isAdmin));

  // Auto-expand or auto-collapse youth dashboard accordion depending on activeTab
  useEffect(() => {
    if (activeTab === 'merchant' || activeTab === 'home') {
      setIsDashboardAccordionOpen(true);
    } else {
      setIsDashboardAccordionOpen(false);
    }
  }, [activeTab]);

  // Auto-expand or auto-collapse admin dashboard accordion depending on activeTab
  useEffect(() => {
    if (activeTab === 'admin' || (activeTab === 'home' && isAdmin)) {
      setIsAdminDashboardAccordionOpen(true);
    } else if (activeTab !== 'home') {
      setIsAdminDashboardAccordionOpen(false);
    }
  }, [activeTab, isAdmin]);

  const isMs = language === 'ms';
  // Strict Role Isolation Flags
  const isMentor = userProfile?.role === 'mentor';
  const isYouth = !isAdmin && !isMentor;

  // Search filter helper
  const matchesSearch = (text: string) => {
    if (!sidebarSearch.trim()) return true;
    return text.toLowerCase().includes(sidebarSearch.toLowerCase());
  };

  const navigateAndClose = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  // =========================================================================
  // 1. COLLAPSED SIDEBAR VIEW (Desktop only Mini Icon Bar)
  // =========================================================================
  if (isCollapsed && !isMobileOpen) {
    return (
      <aside 
        id="kbelia-left-sidebar"
        className="hidden md:flex w-18 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 py-4 flex-col items-center justify-between shrink-0 select-none overflow-y-auto z-30 transition-all sticky top-0"
      >
        <div className="flex flex-col items-center gap-2.5 w-full px-2 pt-1">

          {/* Role-Specific Navigation Icons */}
          {isAdmin && (
            <>
              {/* Category 1: Pengurusan */}
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                title={t('nav_admin_control')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                title={t('nav_kiosk_monitoring')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'academic' 
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </button>

              {/* Category 2: Dana & Bimbingan */}
              <button
                type="button"
                onClick={() => setActiveTab('ceed')}
                title={t('nav_grant_monitoring')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ceed' 
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Award className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                }}
                title={t('nav_district_analytics')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800 shadow-xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800 hover:text-sky-700'
                }`}
              >
                <Network className="w-5 h-5" />
              </button>

              {/* Category 3: Direktori & Profil */}
              <button
                type="button"
                onClick={() => setActiveTab('hepa')}
                title={t('nav_audit_ssm')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'hepa' 
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Store className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title={t('nav_settings')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {isMentor && (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('overview');
                }}
                title={isMs ? 'Ringkasan' : 'Overview'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'overview'
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                }}
                title={isMs ? 'Sesi Bimbingan' : 'Sessions'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'sessions'
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Calendar className="w-5 h-5 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                }}
                title={isMs ? 'Perakuan Geran' : 'Endorsements'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'endorsements'
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Award className="w-5 h-5 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                }}
                title={isMs ? 'Log Jurnal' : 'Logbook'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'logbook'
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <FileText className="w-5 h-5 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                }}
                title={isMs ? 'Profil & Jadual' : 'Profile & Schedule'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'profile'
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-xs' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Settings className="w-5 h-5 text-sky-600" />
              </button>
            </>
          )}

          {isYouth && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('merchant')}
                title={t('dashboard')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'merchant' || activeTab === 'home'
                    ? 'bg-sky-50 text-sky-800 font-bold shadow-xs border border-sky-200' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                title={t('nav_my_kiosk')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'academic' 
                    ? 'bg-sky-50 text-sky-800 font-bold shadow-xs border border-sky-200' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
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
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'merchant' && merchantSubTab === 'cashflow'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold shadow-xs border border-sky-200 dark:border-sky-800' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800 hover:text-sky-700'
                }`}
              >
                <Coins className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ceed')}
                title={t('nav_grant_application')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ceed' 
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold shadow-xs border border-sky-200 dark:border-sky-800' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800 hover:text-sky-700'
                }`}
              >
                <Award className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenMentorshipClinic) onOpenMentorshipClinic();
                  else setActiveTab('events');
                }}
                title={t('nav_mentor_clinic')}
                className="p-2.5 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-800 hover:text-sky-700"
              >
                <GraduationCap className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hepa')}
                title={t('directory')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'hepa' 
                    ? 'bg-sky-50 text-sky-800 font-bold shadow-xs border border-sky-200' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Store className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title={t('nav_settings')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-sky-50 text-sky-800 font-bold shadow-xs border border-sky-200' 
                    : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

        </div>
      </aside>
    );
  }

  const sidebarBody = (
    <aside 
      id="kbelia-left-sidebar"
      className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between shrink-0 transition-colors duration-200 select-none overflow-y-auto z-30"
    >
      <div className="space-y-4">
        {isMobileOpen && onCloseMobile && (
          <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Navigasi KBelia</span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
            className="w-full pl-3.5 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* ROLE A: PENTADBIR KERAJAAN */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-sky-700 dark:text-sky-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
              </div>

              {matchesSearch('pusat kawalan pentadbir giliran kelulusan permohonan kapsul direktori usahawan pengurusan kapsul geran inisiatif bimbingan mentor segerak pangkalan data tetapan operasi admin control') && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'admin') {
                        setIsAdminDashboardAccordionOpen(!isAdminDashboardAccordionOpen);
                      } else {
                        navigateAndClose(() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                        });
                        setIsAdminDashboardAccordionOpen(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                      activeTab === 'admin'
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'admin' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                      <span className="truncate">{t('nav_admin_control')}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isAdminDashboardAccordionOpen ? 'rotate-0' : '-rotate-90'} ${activeTab === 'admin' ? 'text-sky-700 dark:text-sky-400' : 'text-slate-400'}`} />
                  </button>

                  {isAdminDashboardAccordionOpen && (
                    <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-slate-700 space-y-1 pt-0.5 pb-1">
                      <button
                        type="button"
                        onClick={() => navigateAndClose(() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                        })}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'queue'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'queue' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Kelulusan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('bookings');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'bookings'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'bookings' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Kapsul</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('businesses');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'businesses'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Store className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'businesses' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Direktori</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('slots');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'slots'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'slots' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Kiosk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('programs');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'programs'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Award className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'programs' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Geran</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('mentors');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'mentors'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'mentors' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Bimbingan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('sync');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'sync'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Database className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'sync' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Penyegerakan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('settings');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'settings'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Sliders className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Tetapan</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {matchesSearch('pemantauan kiosk jajahan semakan status kekosongan monitoring') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('academic')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'academic'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'academic' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_kiosk_monitoring')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'academic' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}
            </div>

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-sky-700 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
              </div>

              {matchesSearch('pemantauan status geran peruntukan dana bantuan belia grant') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ceed')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'ceed'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'ceed' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_grant_monitoring')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'ceed' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}

              {matchesSearch('analitik taburan 10 jajahan kelantan statistik analytics') && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(() => {
                    setActiveTab('admin');
                    if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                  })}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'admin' && adminSubTab === 'queue'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Network className={`w-4 h-4 shrink-0 ${activeTab === 'admin' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_district_analytics')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              )}
            </div>

            {/* KATEGORI 3: DIREKTORI & PROFIL */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-sky-700 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DIREKTORI & PROFIL' : 'DIRECTORY & PROFILE'}
              </div>

              {matchesSearch('audit usahawan direktori semakan ssm audit') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hepa')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'hepa'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'hepa' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_audit_ssm')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'hepa' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}

              {matchesSearch('tetapan sistem pentadbir parameter admin settings') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'settings'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'settings' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_settings')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'settings' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}
            </div>

          </div>
        )}

        {/* ROLE B: MENTOR SISTEM */}
        {isMentor && (
          <div className="space-y-1.5">
            {matchesSearch('ringkasan papan pemuka overview status tindakan usahawan geran dashboard') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('overview');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'overview'
                    ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'overview' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Ringkasan' : 'Overview'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'overview' ? 'text-sky-700' : 'text-slate-300'}`} />
              </button>
            )}

            {matchesSearch('sesi bimbingan kalendar temujanji mentee maya google meet jadual') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'sessions'
                    ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'sessions' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Sesi Bimbingan' : 'Sessions'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'sessions' ? 'text-sky-700' : 'text-slate-300'}`} />
              </button>
            )}

            {matchesSearch('perakuan geran dana sokongan surat kelulusan benih pemangkin') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'endorsements'
                    ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'endorsements' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Perakuan Geran' : 'Endorsements'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'endorsements' ? 'text-sky-700' : 'text-slate-300'}`} />
              </button>
            )}

            {matchesSearch('log jurnal minit bimbingan tindakan kpi kemajuan tugasan') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'logbook'
                    ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'logbook' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Log Jurnal' : 'Logbook'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'logbook' ? 'text-sky-700' : 'text-slate-300'}`} />
              </button>
            )}

            {matchesSearch('profil jadual kelapangan mentor tetapan akaun waktu bimbingan') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'profile'
                    ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'profile' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Profil & Jadual' : 'Profile & Schedule'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'profile' ? 'text-sky-700' : 'text-slate-300'}`} />
              </button>
            )}
          </div>
        )}

        {/* ROLE C: USAHAWAN BELIA */}
        {isYouth && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-sky-700 uppercase px-2 pt-1 pb-1">
                {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
              </div>

              {matchesSearch('papan pemuka usahawan belia jualan status dashboard ringkasan eksekutif profil perniagaan katalog produk sewa kapsul buku tunai jualan dokumen sah kad digital whatsapp') && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'merchant' || activeTab === 'home') {
                        setIsDashboardAccordionOpen(!isDashboardAccordionOpen);
                      } else {
                        setActiveTab('merchant');
                        if (onSelectMerchantSubTab) {
                          onSelectMerchantSubTab('overview');
                        }
                        setIsDashboardAccordionOpen(true);
                      }
                    }}
                    className={`interactive-press w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                      activeTab === 'merchant' || activeTab === 'home'
                        ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LayoutDashboard className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'merchant' || activeTab === 'home' ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className="truncate">{t('dashboard')}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isDashboardAccordionOpen ? 'rotate-0' : '-rotate-90'} ${activeTab === 'merchant' || activeTab === 'home' ? 'text-sky-700' : 'text-slate-400'}`} />
                  </button>

                  {isDashboardAccordionOpen && (
                    <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-slate-700 space-y-1 pt-0.5 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('overview');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'overview'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'overview' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Ringkasan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('profile');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'profile'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Store className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'profile' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Profil Bisnes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('products');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'products'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <ShoppingBag className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'products' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Katalog</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('bookings');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'bookings'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'bookings' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Kapsul Niaga</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('cashflow');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'cashflow'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <Coins className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'cashflow' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Buku Tunai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('vault');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'vault'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <FileCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'vault' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Dokumen Sah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('card');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'card'
                            ? 'bg-sky-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
                        }`}
                      >
                        <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'card' ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-600'}`} />
                        <span className="truncate">Kad Digital</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {matchesSearch('kiosk kapsul modular sewa tapak premis my kiosk') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('academic')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'academic'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'academic' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_my_kiosk')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'academic' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}

              {matchesSearch('jualan aliran tunai pos rekod harian untung sales cashflow') && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(() => {
                    setActiveTab('merchant');
                    if (onSelectMerchantSubTab) onSelectMerchantSubTab('cashflow');
                  })}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'merchant' && merchantSubTab === 'cashflow'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Coins className={`w-4 h-4 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'cashflow' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_sales_pos')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              )}
            </div>

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-sky-700 dark:text-sky-400 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
              </div>

              {matchesSearch('permohonan geran benih pembiayaan modal grant') && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(() => setActiveTab('ceed'))}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'ceed'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 ${activeTab === 'ceed' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_grant_application')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              )}

              {matchesSearch('sesi bimbingan mentor konsultasi mentoring clinic') && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(() => {
                    if (onOpenMentorshipClinic) onOpenMentorshipClinic();
                    else setActiveTab('events');
                  })}
                  className="w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GraduationCap className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-sky-600" />
                    <span className="truncate">{t('nav_mentor_clinic')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              )}

              {matchesSearch('ruang iklan b2b peluang niaga pembekal market') && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(() => setActiveTab('b2b'))}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'b2b'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Network className={`w-4 h-4 shrink-0 ${activeTab === 'b2b' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{isMs ? 'Ruang Niaga B2B' : 'B2B Marketplace'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              )}

              {matchesSearch('acara karnival ekspo bengkel jadual events') && (
                <button
                  type="button"
                  onClick={() => navigateAndClose(() => setActiveTab('events'))}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'events'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'events' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{isMs ? 'Acara & Karnival' : 'Events & Expo'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                </button>
              )}
            </div>

            {/* KATEGORI 3: DIREKTORI & PROFIL */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-sky-700 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DIREKTORI & PROFIL' : 'DIRECTORY & PROFILE'}
              </div>

              {matchesSearch('direktori usahawan kelantan bisnes produk kedai servis ssm directory') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hepa')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'hepa'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'hepa' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('directory')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'hepa' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}

              {matchesSearch('tetapan akaun profil maklumat bisnes perbankan settings') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'settings'
                      ? 'bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'settings' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_settings')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'settings' ? 'text-sky-700' : 'text-slate-300'}`} />
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-full shrink-0">
        {sidebarBody}
      </div>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full shadow-2xl">
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
};

export default UMKSidebar;
