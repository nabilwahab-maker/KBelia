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
  mentorSubTab = 'sessions',
  onSelectMentorSubTab
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isDashboardAccordionOpen, setIsDashboardAccordionOpen] = useState(activeTab === 'merchant' || activeTab === 'home');
  const [isAdminDashboardAccordionOpen, setIsAdminDashboardAccordionOpen] = useState(activeTab === 'admin' || (activeTab === 'home' && isAdmin));
  const [isMentorDashboardAccordionOpen, setIsMentorDashboardAccordionOpen] = useState(activeTab === 'mentor' || (activeTab === 'home' && userProfile?.role === 'mentor'));

  // Auto-expand or auto-collapse mentor dashboard accordion depending on activeTab
  useEffect(() => {
    if (activeTab === 'mentor' || (activeTab === 'home' && userProfile?.role === 'mentor')) {
      setIsMentorDashboardAccordionOpen(true);
    } else if (activeTab !== 'mentor' && activeTab !== 'home') {
      setIsMentorDashboardAccordionOpen(false);
    }
  }, [activeTab, userProfile?.role]);

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
        <div className="flex flex-col items-center gap-2.5 w-full px-2">
          
          {/* Top Featured Button: Mini Dashboard Icon */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              title={isMs ? 'Pentadbir' : 'Admin'}
              className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer border border-amber-500/40 interactive-press"
            >
              <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          ) : isMentor ? (
            <button
              type="button"
              onClick={() => setActiveTab('mentor')}
              title={isMs ? 'Mentor' : 'Mentor'}
              className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer border border-purple-400/40 interactive-press"
            >
              <GraduationCap className="w-5 h-5 text-amber-300 transition-transform group-hover:scale-110" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('merchant')}
              title={isMs ? 'Papan Pemuka' : 'Dashboard'}
              className="w-10 h-10 rounded-xl bg-[#003B95] text-white flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer border border-blue-400/40 interactive-press"
            >
              <GraduationCap className="w-5 h-5 text-amber-300 transition-transform group-hover:scale-110" />
            </button>
          )}

          {/* Category Divider Dot */}
          <div className="w-6 h-px bg-slate-200 dark:bg-slate-700 my-1" />

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
              {/* Sub 1: Sesi & Klinik Mentee */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                }}
                title={isMs ? 'Sesi Bimbingan & Klinik' : 'Mentoring Sessions'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'sessions'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Calendar className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </button>

              {/* Sub 2: Perakuan Rasmi Geran Belia */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                }}
                title={isMs ? 'Perakuan Geran Belia' : 'Grant Endorsement'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'endorsements'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </button>

              {/* Sub 3: Log Jurnal & Pelan Tindakan */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                }}
                title={isMs ? 'Log Jurnal & Tindakan' : 'Action Logbook'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'mentor' && mentorSubTab === 'logbook'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800 shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8A99AD] dark:hover:bg-[#2A3444] dark:hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </button>

              {/* Sub 4: Profil Mentor & Jadual */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                }}
                title={isMs ? 'Profil Mentor & Jadual' : 'Mentor Profile'}
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

        {/* ================================================================= */}
        {/* 2. DASHBOARD BUTTON (Positioned below search, compact & refined)  */}
        {/* ================================================================= */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs tracking-wide transition-all cursor-pointer interactive-press interactive-lift group ${
              activeTab === 'admin' || activeTab === 'home'
                ? 'bg-slate-900 dark:bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700/60 shadow-xs'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 transition-transform group-hover:scale-110" />
            <span>{isMs ? 'Pentadbir' : 'Admin'}</span>
          </button>
        ) : isMentor ? (
          <button
            type="button"
            onClick={() => setActiveTab('mentor')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs tracking-wide transition-all cursor-pointer interactive-press interactive-lift group ${
              activeTab === 'mentor' || activeTab === 'home'
                ? 'bg-indigo-900/90 dark:bg-purple-500/20 text-purple-200 dark:text-purple-300 border border-purple-400/40 shadow-xs'
                : 'bg-indigo-950/70 hover:bg-indigo-900 text-slate-200 hover:text-white border border-indigo-700/40 shadow-xs'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-300 shrink-0 transition-transform group-hover:scale-110" />
            <span>{isMs ? 'Mentor' : 'Mentor'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('merchant')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs tracking-wide transition-all cursor-pointer interactive-press interactive-lift group ${
              activeTab === 'merchant' || activeTab === 'home'
                ? 'bg-[#003B95] dark:bg-blue-600/30 text-white border border-blue-400/40 shadow-xs'
                : 'bg-[#0A2540] hover:bg-[#003B95] text-slate-200 hover:text-white border border-blue-900/50 shadow-xs'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-300 shrink-0 transition-transform group-hover:scale-110" />
            <span>{isMs ? 'Papan Pemuka' : 'Dashboard'}</span>
          </button>
        )}

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
        {/* ROLE B: MENTOR SISTEM (EKSLUSIF HAB BIMBINGAN & PERAKUAN GERAN)     */}
        {/* 4 KATEGORI UTAMA SELARI GAYA PORTAL BELIA UMK DENGAN BUTANG LENGKAP */}
        {/* =================================================================== */}
        {isMentor && (
          <div className="space-y-4">
            
            {/* KATEGORI 1: BIMBINGAN & SESI */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-purple-700 dark:text-purple-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'BIMBINGAN & SESI' : 'COACHING & SESSIONS'}
              </div>

              {/* BUTANG UTAMA DENGAN SUB-MENU AKORDION */}
              {matchesSearch('papan pemuka mentor sesi bimbingan perakuan geran belia log jurnal minit tindakan profil waktu kelapangan') && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'mentor') {
                        setIsMentorDashboardAccordionOpen(!isMentorDashboardAccordionOpen);
                      } else {
                        setActiveTab('mentor');
                        if (onSelectMentorSubTab) {
                          onSelectMentorSubTab('sessions');
                        }
                        setIsMentorDashboardAccordionOpen(true);
                      }
                    }}
                    className={`interactive-press w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                      activeTab === 'mentor'
                        ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GraduationCap className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'mentor' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                      <span className="truncate">{isMs ? 'Papan Pemuka' : 'Dashboard'}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isMentorDashboardAccordionOpen ? 'rotate-0' : '-rotate-90'} ${activeTab === 'mentor' ? 'text-purple-700 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>

                  {/* SUB-MENU AKORDION MENTOR (4 MODUL EKSKLUSIF) */}
                  {isMentorDashboardAccordionOpen && (
                    <div className="ml-3 pl-2.5 border-l-2 border-purple-300 dark:border-purple-600/70 space-y-1 pt-0.5 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Sub 1: Sesi Bimbingan (NO KLINIK) */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('mentor');
                          if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'mentor' && mentorSubTab === 'sessions'
                            ? 'bg-purple-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Calendar className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentor' && mentorSubTab === 'sessions' ? 'text-white' : 'text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} />
                        <span className="truncate">{isMs ? 'Sesi Bimbingan' : 'Sessions'}</span>
                      </button>

                      {/* Sub 2: Perakuan Rasmi Geran Belia */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('mentor');
                          if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'mentor' && mentorSubTab === 'endorsements'
                            ? 'bg-purple-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Award className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentor' && mentorSubTab === 'endorsements' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500 dark:group-hover:text-amber-400'}`} />
                        <span className="truncate">{isMs ? 'Perakuan Geran' : 'Endorsements'}</span>
                      </button>

                      {/* Sub 3: Log Jurnal & Tindakan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('mentor');
                          if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'mentor' && mentorSubTab === 'logbook'
                            ? 'bg-purple-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentor' && mentorSubTab === 'logbook' ? 'text-white' : 'text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} />
                        <span className="truncate">{isMs ? 'Log Jurnal' : 'Logbook'}</span>
                      </button>

                      {/* Sub 4: Profil Mentor & Jadual */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('mentor');
                          if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                        }}
                        className={`interactive-press w-full flex items-center gap-2 px-2.5 py-1.75 text-xs rounded-lg transition-all text-left cursor-pointer group ${
                          activeTab === 'mentor' && mentorSubTab === 'profile'
                            ? 'bg-purple-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444]/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Settings className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentor' && mentorSubTab === 'profile' ? 'text-white' : 'text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} />
                        <span className="truncate">{isMs ? 'Profil & Jadual' : 'Profile'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* BUTANG PINTAS LANGSUNG KATEGORI 1 */}
              {matchesSearch('permohonan bimbingan mentee usahawan baru menunggu semakan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                    setTimeout(() => {
                      document.getElementById('mentor-applications-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">{isMs ? 'Permohonan' : 'Applications'}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {matchesSearch('jadual bimbingan temujanji kalendar sesi aktif') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                    setTimeout(() => {
                      document.getElementById('mentor-schedule-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{isMs ? 'Jadual' : 'Schedule'}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {matchesSearch('pelan tindakan tugasan mentee kpi usahawan nota bimbingan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                    setTimeout(() => {
                      document.getElementById('mentor-action-plans-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{isMs ? 'Pelan Tindakan' : 'Action Plan'}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* KATEGORI 2: PERAKUAN & GERAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'PERAKUAN & GERAN' : 'ENDORSEMENTS & GRANTS'}
              </div>

              {matchesSearch('surat perakuan rasmi geran sokongan dana benih umk') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'mentor' && mentorSubTab === 'endorsements'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{isMs ? 'Perakuan Rasmi' : 'Endorsements'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {matchesSearch('kriteria dana benih geran pemangkin rm3000 rm5000 tekun mara') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('endorsements');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{isMs ? 'Kriteria Geran' : 'Grant Criteria'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">RM3K-RM10K</span>
                </button>
              )}
            </div>

            {/* KATEGORI 3: LOG & MINIT TINDAKAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'LOG & MINIT TINDAKAN' : 'ACTION LOG & MINUTES'}
              </div>

              {matchesSearch('log jurnal tindakan minit bimbingan sesi usahawan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'mentor' && mentorSubTab === 'logbook'
                      ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{isMs ? 'Log Bimbingan' : 'Logbook'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {matchesSearch('semakan kpi kemajuan tugasan usahawan garis masa') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('logbook');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{isMs ? 'Semakan Tugasan' : 'Task Review'}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* KATEGORI 4: PROFIL & BANTUAN */}
            <div className="space-y-1">
              <div className="text-[11px] font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase px-2 pt-1 pb-1">
                {isMs ? 'PROFIL & BANTUAN' : 'PROFILE & SUPPORT'}
              </div>

              {matchesSearch('profil kelapangan jadual mentor umk waktu') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.25 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer group ${
                    activeTab === 'mentor' && mentorSubTab === 'profile'
                      ? 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/40 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">{isMs ? 'Profil Mentor' : 'Profile'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {matchesSearch('bilik temu duga maya google meet bilik kaunseling') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('sessions');
                    setTimeout(() => {
                      document.getElementById('mentor-schedule-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{isMs ? 'Bilik Maya' : 'Virtual Room'}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {matchesSearch('panduan bimbingan usahawan umk ceed insken etika') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mentor');
                    if (onSelectMentorSubTab) onSelectMentorSubTab('profile');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3444] hover:text-slate-900 dark:hover:text-white transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{isMs ? 'Panduan Mentor' : 'Mentor Guide'}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

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
