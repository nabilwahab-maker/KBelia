import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Send, 
  ShieldCheck, 
  Store, 
  Building2, 
  Award, 
  Search, 
  GraduationCap, 
  Calendar, 
  Network, 
  Coins, 
  Users, 
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
  Video
} from 'lucide-react';
import { UMKTab } from './UMKHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MerchantSubTab, AdminSubTab, MentorSubTab } from '../types';

interface UMKSidebarProps {
  activeTab: UMKTab;
  setActiveTab: (tab: UMKTab) => void;
  isCollapsed: boolean;
  onOpenBooking: () => void;
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
  onOpenBooking,
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
    } else if (activeTab !== 'admin' && activeTab !== 'home') {
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

  // =========================================================================
  // 1. COLLAPSED SIDEBAR VIEW (Mini Icon Bar without Profile Card)
  // =========================================================================
  if (isCollapsed) {
    return (
      <aside 
        id="kbelia-left-sidebar"
        className="w-18 h-full bg-white dark:bg-[#1E2530] text-slate-700 dark:text-[#DEE4EE] border-r border-slate-200 dark:border-[#3E4C5F] py-4 flex flex-col items-center justify-between shrink-0 select-none overflow-y-auto z-30 transition-all sticky top-0"
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
                    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-500/40 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                title={t('nav_kiosk_monitoring')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'academic' 
                    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-500/40 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
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
                    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-500/40 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Award className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('b2b')}
                title={t('nav_district_analytics')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'b2b' 
                    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-500/40 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
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
                    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-500/40 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
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
                    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-500/40 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {isMentor && (
            <>
              {/* Sub 0: Ringkasan Eksekutif */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('overview');
                }}
                title={isMs ? 'Ringkasan' : 'Overview'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'overview'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </button>

              {/* Sub 1: Sesi Bimbingan */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                }}
                title={isMs ? 'Sesi Bimbingan' : 'Sessions'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'sessions'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Calendar className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </button>

              {/* Sub 2: Perakuan Geran */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                }}
                title={isMs ? 'Perakuan Geran' : 'Endorsements'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'endorsements'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </button>

              {/* Sub 3: Log Jurnal */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                }}
                title={isMs ? 'Log Jurnal' : 'Logbook'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'logbook'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </button>

              {/* Sub 4: Profil & Jadual */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                }}
                title={isMs ? 'Profil & Jadual' : 'Profile & Schedule'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'profile'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </button>
            </>
          )}

          {isYouth && (
            <>
              {/* Category 1: Pengurusan */}
              <button
                type="button"
                onClick={() => setActiveTab('merchant')}
                title={t('dashboard')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'merchant' || activeTab === 'home'
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
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
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('b2b')}
                title={t('nav_sales_pos')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'b2b' 
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Coins className="w-5 h-5" />
              </button>

              {/* Category 2: Dana & Bimbingan */}
              <button
                type="button"
                onClick={() => setActiveTab('ceed')}
                title={t('nav_grant_application')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ceed' 
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Award className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('events')}
                title={t('nav_mentor_clinic')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'events' 
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </button>

              {/* Category 3: Direktori & Profil */}
              <button
                type="button"
                onClick={() => setActiveTab('hepa')}
                title={t('directory')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'hepa' 
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
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
                    ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white font-bold shadow-xs border border-red-200 dark:border-transparent' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
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

  // =========================================================================
  // 2. EXPANDED SIDEBAR VIEW (Grouped by 3 Categories matching UMK reference)
  // =========================================================================
  return (
    <aside 
      id="kbelia-left-sidebar"
      className="w-64 h-full bg-white dark:bg-[#1E2530] text-slate-800 dark:text-[#DEE4EE] border-r border-slate-200 dark:border-[#3E4C5F] p-4 flex flex-col justify-between shrink-0 transition-colors duration-200 select-none overflow-y-auto z-30 sticky top-0"
    >
      <div className="space-y-4">
        
        {/* ================================================================= */}
        {/* 1. SEARCH SIDEBAR INPUT (Positioned at the top above the button)  */}
        {/* ================================================================= */}
        <div className="relative group">
          <input
            type="text"
            placeholder={t('search_sidebar')}
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full pl-3.5 pr-8 py-2 text-xs bg-slate-50 dark:bg-[#242D3B] border border-slate-200 dark:border-[#3E4C5F] rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-amber-500" />
        </div>

        {/* =================================================================== */}
        {/* ROLE A: PENTADBIR KERAJAAN (ADMIN PORTAL ONLY) - 3 KATEGORI         */}
        {/* =================================================================== */}
        {isAdmin && (
          <div className="space-y-4">
            
            {/* KATEGORI 1: PENGURUSAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-700 dark:text-amber-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
              </div>

              {/* PUSAT KAWALAN PENTADBIR DENGAN SUB-MENU AKORDION */}
              {matchesSearch('pusat kawalan pentadbir giliran kelulusan permohonan kapsul direktori usahawan pengurusan kapsul geran inisiatif bimbingan mentor segerak pangkalan data tetapan operasi admin control') && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'admin') {
                        setIsAdminDashboardAccordionOpen(!isAdminDashboardAccordionOpen);
                      } else {
                        setActiveTab('admin');
                        if (onSelectAdminSubTab) {
                          onSelectAdminSubTab('queue');
                        }
                        setIsAdminDashboardAccordionOpen(true);
                      }
                    }}
                    className={`interactive-press w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                      activeTab === 'admin'
                        ? 'bg-amber-500/15 text-amber-950 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldCheck className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'admin' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                      <span className="truncate">{t('nav_admin_control')}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isAdminDashboardAccordionOpen ? 'rotate-0' : '-rotate-90'} ${activeTab === 'admin' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>

                  {/* SUB-MENU AKORDION PENTADBIR (8 MODUL PENUH) */}
                  {isAdminDashboardAccordionOpen && (
                    <div className="ml-3 pl-2.5 border-l-2 border-amber-300 dark:border-amber-600/70 space-y-1 pt-0.5 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Sub 1: Giliran Kelulusan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('queue');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'queue'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'queue' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Kelulusan</span>
                      </button>

                      {/* Sub 2: Permohonan Kapsul */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('bookings');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'bookings'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'bookings' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Kapsul</span>
                      </button>

                      {/* Sub 3: Direktori Usahawan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('businesses');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'businesses'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Store className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'businesses' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Direktori</span>
                      </button>

                      {/* Sub 4: Pengurusan Kapsul */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('slots');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'slots'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'slots' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Kiosk</span>
                      </button>

                      {/* Sub 5: Geran & Inisiatif */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('programs');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'programs'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Award className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'programs' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Geran</span>
                      </button>

                      {/* Sub 6: Bimbingan Mentor */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('mentors');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'mentors'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'mentors' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Bimbingan</span>
                      </button>

                      {/* Sub 7: Segerak Pangkalan Data */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('sync');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'sync'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Database className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'sync' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Penyegerakan</span>
                      </button>

                      {/* Sub 8: Tetapan Operasi */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          if (onSelectAdminSubTab) onSelectAdminSubTab('settings');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'admin' && adminSubTab === 'settings'
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Sliders className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && adminSubTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`} />
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
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'academic' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_kiosk_monitoring')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'academic' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}
            </div>

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-700 dark:text-amber-400 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
              </div>

              {matchesSearch('pemantauan status geran peruntukan dana bantuan belia grant') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ceed')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'ceed'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'ceed' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_grant_monitoring')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'ceed' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}

              {matchesSearch('analitik taburan 10 jajahan kelantan statistik analytics') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('b2b')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'b2b'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Network className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'b2b' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_district_analytics')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'b2b' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}
            </div>

            {/* KATEGORI 3: DIREKTORI & PROFIL */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-700 dark:text-amber-400 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DIREKTORI & PROFIL' : 'DIRECTORY & PROFILE'}
              </div>

              {matchesSearch('audit usahawan direktori semakan ssm audit') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hepa')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'hepa'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'hepa' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_audit_ssm')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'hepa' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}

              {matchesSearch('tetapan sistem pentadbir parameter admin settings') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'settings'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'settings' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_settings')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'settings' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* ROLE B: MENTOR SISTEM (5 MODUL UTAMA DENGAN RINGKASAN EKSEKUTIF)    */}
        {/* =================================================================== */}
        {isMentor && (
          <div className="space-y-1.5">
            {/* Butang 0: Ringkasan Eksekutif */}
            {matchesSearch('ringkasan papan pemuka overview status tindakan usahawan geran dashboard') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('overview');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'overview'
                    ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'overview' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Ringkasan' : 'Overview'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'overview' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
            )}

            {/* Butang 1: Sesi Bimbingan */}
            {matchesSearch('sesi bimbingan kalendar temujanji mentee maya google meet jadual') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'sessions'
                    ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'sessions' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Sesi Bimbingan' : 'Sessions'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'sessions' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
            )}

            {/* Butang 2: Perakuan Geran */}
            {matchesSearch('perakuan geran dana sokongan surat kelulusan benih pemangkin') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'endorsements'
                    ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'endorsements' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Perakuan Geran' : 'Endorsements'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'endorsements' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
            )}

            {/* Butang 3: Log Jurnal */}
            {matchesSearch('log jurnal minit bimbingan tindakan kpi kemajuan tugasan') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'logbook'
                    ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'logbook' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Log Jurnal' : 'Logbook'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'logbook' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
            )}

            {/* Butang 4: Profil & Jadual */}
            {matchesSearch('profil jadual kelapangan mentor tetapan akaun waktu bimbingan') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                }}
                className={`interactive-press w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                  activeTab === 'mentor' && mentorSubTab === 'profile'
                    ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' && mentorSubTab === 'profile' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span className="truncate">{isMs ? 'Profil & Jadual' : 'Profile & Schedule'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'mentor' && mentorSubTab === 'profile' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* ROLE C: USAHAWAN BELIA (YOUTH ENTREPRENEUR PORTAL ONLY) - 3 KATEGORI*/}
        {/* =================================================================== */}
        {isYouth && (
          <div className="space-y-4">
            
            {/* KATEGORI 1: PENGURUSAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'PENGURUSAN' : 'MANAGEMENT'}
              </div>

              {/* DASHBOARD UTAMA DENGAN SUB-MENU AKORDION */}
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
                        ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LayoutDashboard className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'merchant' || activeTab === 'home' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                      <span className="truncate">{t('dashboard')}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isDashboardAccordionOpen ? 'rotate-0' : '-rotate-90'} ${activeTab === 'merchant' || activeTab === 'home' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>

                  {/* SUB-MENU AKORDION PENDAPATAN/PENGURUSAN PENIAGA */}
                  {isDashboardAccordionOpen && (
                    <div className="ml-3 pl-2.5 border-l-2 border-red-200 dark:border-slate-700/80 space-y-1 pt-0.5 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Sub 1: Ringkasan Eksekutif */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('overview');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'overview'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'overview' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Ringkasan</span>
                      </button>

                      {/* Sub 2: Profil Perniagaan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('profile');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'profile'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Store className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'profile' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Profil Bisnes</span>
                      </button>

                      {/* Sub 3: Katalog Produk */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('products');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'products'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ShoppingBag className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'products' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Katalog</span>
                      </button>

                      {/* Sub 4: Permohonan Kapsul */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('bookings');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'bookings'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'bookings' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Kapsul Niaga</span>
                      </button>

                      {/* Sub 5: Buku Tunai Jualan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('cashflow');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'cashflow'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Coins className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'cashflow' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Buku Tunai</span>
                      </button>

                      {/* Sub 6: Buat Dokumen Sah */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('vault');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'vault'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <FileCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'vault' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">Dokumen Sah</span>
                      </button>

                      {/* Sub 7: Kad Digital WhatsApp Link */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('merchant');
                          if (onSelectMerchantSubTab) onSelectMerchantSubTab('card');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'merchant' && merchantSubTab === 'card'
                            ? 'bg-red-700 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'merchant' && merchantSubTab === 'card' ? 'text-amber-300' : 'text-slate-400 group-hover:text-red-600 dark:group-hover:text-amber-400'}`} />
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
                      ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'academic' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_my_kiosk')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'academic' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}

              {matchesSearch('jualan aliran tunai pos rekod harian untung sales cashflow') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('b2b')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'b2b'
                      ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Coins className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'b2b' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_sales_pos')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'b2b' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}
            </div>

            {/* KATEGORI 2: DANA DAN BIMBINGAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DANA DAN BIMBINGAN' : 'GRANTS & COACHING'}
              </div>

              {matchesSearch('permohonan geran benih pembiayaan modal grant') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ceed')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'ceed'
                      ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'ceed' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_grant_application')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'ceed' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}

              {matchesSearch('sesi bimbingan mentor konsultasi bengkel mentoring') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('events')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'events'
                      ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GraduationCap className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'events' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_mentor_clinic')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'events' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}
            </div>

            {/* KATEGORI 3: DIREKTORI & PROFIL */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase px-2 pt-2 pb-1">
                {isMs ? 'DIREKTORI & PROFIL' : 'DIRECTORY & PROFILE'}
              </div>

              {matchesSearch('direktori usahawan kelantan bisnes produk kedai servis ssm directory') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hepa')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'hepa'
                      ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'hepa' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('directory')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'hepa' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}

              {matchesSearch('tetapan akaun profil maklumat bisnes perbankan settings') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'settings'
                      ? 'bg-red-50 text-red-700 dark:bg-[#2A3444] dark:text-white border border-red-200 dark:border-transparent shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Settings className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'settings' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{t('nav_settings')}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTab === 'settings' ? 'text-red-700 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </aside>
  );
};

export default UMKSidebar;
