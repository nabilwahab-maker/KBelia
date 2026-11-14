import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Home, 
  Briefcase, 
  Building2, 
  Menu,
  X,
  LogOut, 
  User, 
  ShieldCheck, 
  Store, 
  LogIn, 
  ChevronDown, 
  Clock,
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  MoreVertical,
  Coins,
  Award,
  Network,
  Users,
  FileCheck,
  LayoutDashboard,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Check,
  Newspaper,
  MessagesSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationDropdown } from './NotificationDropdown';
import { CapsuleSlot, BusinessListing, YouthProgram, MerchantSubTab, MentorSubTab } from '../types';

export type UMKTab = 
  | 'home' 
  | 'academic' 
  | 'hepa' 
  | 'ceed' 
  | 'events' 
  | 'b2b' 
  | 'calculator' 
  | 'admin' 
  | 'merchant' 
  | 'mentor' 
  | 'mentorship'
  | 'login' 
  | 'register' 
  | 'landing' 
  | 'news'
  | 'community'
  | 'settings';

interface UMKHeaderProps {
  activeTab: UMKTab;
  setActiveTab: (tab: UMKTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleMobileSidebar?: () => void;
  onSelectMerchantSubTab?: (sub: MerchantSubTab) => void;
  onSelectMentorSubTab?: (sub: MentorSubTab) => void;
  onOpenBooking?: () => void;
  slots?: CapsuleSlot[];
  businesses?: BusinessListing[];
  programs?: YouthProgram[];
  onSelectSlot?: (slot: CapsuleSlot) => void;
  onSelectBusiness?: (biz: BusinessListing) => void;
  onOpenGrantModal?: (title?: string, amount?: string) => void;
}

export const UMKHeader: React.FC<UMKHeaderProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  onToggleMobileSidebar,
  onSelectMerchantSubTab,
  onSelectMentorSubTab,
  slots = [],
  businesses = [],
  programs = [],
  onSelectSlot,
  onSelectBusiness,
  onOpenGrantModal
}) => {
  const { user, userProfile, isAdmin, isMentor, isYouth, isDemoSession, logout, loginAsDemoUser } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { t, language } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [isSearchOpen]);

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;

    // Mentors are strictly isolated from Youth Kiosk/Directory/Grant-Application search results
    if (isMentor) {
      const mentorQuickLinks = [
        { id: 'overview' as MentorSubTab, label: 'Ringkasan Dashboard Mentor', desc: 'KPI, carta daerah & temujanji terdekat' },
        { id: 'sessions' as MentorSubTab, label: 'Sesi Bimbingan & Mentee', desc: 'Senarai permohonan, jadual & pelan bimbingan' },
        { id: 'endorsements' as MentorSubTab, label: 'Surat Sokongan Geran', desc: 'Keluarkan & semak sokongan geran rasmi' },
        { id: 'logbook' as MentorSubTab, label: 'Rekod Sesi Bimbingan', desc: 'Nota bimbingan & senarai semak tugasan' },
        { id: 'profile' as MentorSubTab, label: 'Profil & Jadual Masa Mentor', desc: 'Kemas kini profil & hari bimbingan' }
      ].filter(item => item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q));
      return { matchedSlots: [], matchedBiz: [], matchedProg: [], mentorQuickLinks, totalCount: mentorQuickLinks.length };
    }

    const matchedSlots = (slots || []).filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.district && s.district.toLowerCase().includes(q)) ||
      (s.hubLocation && s.hubLocation.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedBiz = (businesses || []).filter(b =>
      (b.businessName && b.businessName.toLowerCase().includes(q)) ||
      (b.ownerName && b.ownerName.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.district && b.district.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedProg = (programs || []).filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 3);

    const totalCount = matchedSlots.length + matchedBiz.length + matchedProg.length;
    return { matchedSlots, matchedBiz, matchedProg, mentorQuickLinks: [], totalCount };
  }, [globalSearch, slots, businesses, programs, isMentor]);

  const displayName = userProfile?.fullName || user?.displayName || (isAdmin ? 'Pentadbir Sistem' : 'Usahawan Belia');
  const avatarSrc = userProfile?.avatarUrl || user?.photoURL || (isAdmin 
    ? '/assets/generated/avatar_admin_kelantan_1793924251898.jpg' 
    : userProfile?.role === 'mentor' 
      ? '/assets/generated/avatar_mentor_umk_1793924250411.jpg' 
      : '/assets/generated/avatar_youth_male_1793924250192.jpg');

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-300 dark:border-slate-600 sticky top-0 z-40 transition-colors duration-200 shadow-2xs w-full shrink-0">
      {/* Top Main Navigation Row */}
      <div className="w-full flex items-stretch h-15 sm:h-16">
        
        {/* Left Column: Aligned with Sidebar below */}
        <div className={`${isSidebarCollapsed ? 'md:w-18 px-3 md:px-2 md:justify-center gap-1.5' : 'md:w-64 px-3 sm:px-4 justify-between'} shrink-0 h-full md:border-r border-slate-300 dark:border-slate-600 flex items-center transition-all duration-200 kbelia-important-header`}>
          
          {/* Mobile Drawer Hamburger */}
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl text-black dark:text-white hover:text-black dark:hover:text-white hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-1"
              title="Buka Menu"
              aria-label="Buka menu sisi"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* KBelia Brand Wordmark -> Navigate Home cleanly */}
          <button
            id="kbelia-logo-btn"
            type="button"
            onClick={() => setActiveTab(user ? 'home' : 'landing')}
            className={`flex items-center gap-2.5 hover:opacity-95 transition-opacity text-left shrink-0 cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="KBelia - Kembali ke Laman Utama"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0 dark:bg-blue-600 kbelia-ambient-sheen">
              <span className="font-extrabold text-white relative z-10">KB</span>
            </div>

            {!isSidebarCollapsed && (
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-black dark:text-white">
                    KBelia
                  </span>
                </div>
                <p className="text-[11px] text-black/70 dark:text-white/75 font-normal">
                  {isAdmin ? 'Panel Pentadbir' : userProfile?.role === 'mentor' ? 'Portal Mentor' : 'Portal Usahawan Belia'}
                </p>
              </div>
            )}
          </button>

          {/* Toggle Desktop Sidebar Collapse Button */}
          <button
            id="toggle-sidebar-collapse-btn"
            type="button"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            title={isSidebarCollapsed ? t('nav_expand_sidebar') : t('nav_collapse_sidebar')}
            className="hidden md:flex p-1.5 rounded-lg text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-amber-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Right Section */}
        <div className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 flex items-center justify-between h-full gap-3">
          {user ? (
            <nav
              aria-label="Navigasi Pantas Header"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-300/80 dark:border-zinc-700 shrink-0"
            >
              <button
                id="kbelia-header-news-btn"
                type="button"
                onClick={() => setActiveTab('news')}
                aria-current={activeTab === 'news' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'news'
                    ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                    : 'text-black/80 hover:text-black hover:bg-white/80 dark:text-white/80 dark:hover:text-white dark:hover:bg-zinc-700/80'
                }`}
                title="Berita & Pengumuman Rasmi"
              >
                <Newspaper className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'news' ? 'text-white' : 'text-black/75 dark:text-white/75'}`} />
                <span>News</span>
              </button>

              <button
                id="kbelia-header-community-btn"
                type="button"
                onClick={() => setActiveTab('community')}
                aria-current={activeTab === 'community' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'community'
                    ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                    : 'text-black/80 hover:text-black hover:bg-white/80 dark:text-white/80 dark:hover:text-white dark:hover:bg-zinc-700/80'
                }`}
                title="Komuniti — Forum & Soal Jawab Usahawan"
              >
                <MessagesSquare className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'community' ? 'text-white' : 'text-black/75 dark:text-white/75'}`} />
                <span>Komuniti</span>
              </button>
            </nav>
          ) : (
            <div />
          )}

        <div className="flex items-center gap-2 shrink-0">
          
          {/* Global Search Button & Popover */}
          <div ref={searchContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSearchOpen(prev => !prev)}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-2xs focus:outline-none ${
                isSearchOpen
                  ? 'bg-amber-50 text-black border-amber-300 dark:bg-slate-800 dark:text-white/75 dark:border-amber-400'
                  : 'bg-slate-50 hover:bg-slate-100 text-black border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-600'
              }`}
              title="Carian Sistem"
              aria-label="Buka carian"
            >
              <Search className="w-4 h-4" />
            </button>

            {isSearchOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative flex items-center mb-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={isMentor ? 'Cari modul Portal Mentor (sesi, perakuan, log)...' : (t('search_global_ph') || 'Cari kiosk, usahawan, geran...')}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-emerald-600 shadow-2xs dark:focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-black/70 dark:text-white/75 absolute left-3 pointer-events-none" />
                  {globalSearch && (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch('')}
                      className="absolute right-2.5 p-1 text-black/70 dark:text-white/75 hover:text-black cursor-pointer dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Autocomplete Results */}
                {searchResults ? (
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 pt-1">
                    {searchResults.totalCount === 0 ? (
                      <div className="py-5 px-3 text-center">
                        <Search className="w-6 h-6 text-black/35 dark:text-white/35 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-black dark:text-white">
                          {t('search_no_results')} "{globalSearch}"
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Mentor Quick Navigation Results */}
                        {searchResults.mentorQuickLinks.length > 0 && (
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-black dark:text-white/75 px-2 mb-1 flex items-center gap-1.5">
                              <GraduationCap className="w-3 h-3" />
                              <span>Modul Portal Mentor</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.mentorQuickLinks.map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('mentor');
                                    onSelectMentorSubTab?.(item.id);
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-black dark:text-white block">
                                      {item.label}
                                    </span>
                                    <span className="text-[10px] text-black/70 dark:text-white/75">
                                      {item.desc}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Kiosks results (Admin monitoring or Youth booking) */}
                        {searchResults.matchedSlots.length > 0 && (
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-black dark:text-white/75 px-2 mb-1 flex items-center gap-1.5">
                              <Building2 className="w-3 h-3" />
                              <span>{t('search_results_kiosks')}</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.matchedSlots.map(slot => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => {
                                    if (isYouth && onSelectSlot) onSelectSlot(slot);
                                    else setActiveTab('academic');
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-black dark:text-white block">
                                      {slot.name} ({slot.code})
                                    </span>
                                    <span className="text-[10px] text-black/70 dark:text-white/75 tabular-nums">
                                      {slot.district} · RM{slot.monthlyRate}/bln
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    slot.status === 'available'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-black dark:text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white/75'
                                  }`}>
                                    {slot.status === 'available' ? t('slot_status_available') : t('slot_status_occupied')}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Merchants results */}
                        {searchResults.matchedBiz.length > 0 && (
                          <div className="pt-2 border-t border-slate-300 dark:border-slate-600">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-black dark:text-white/75 px-2 mb-1 flex items-center gap-1.5">
                              <Store className="w-3 h-3" />
                              <span>{t('search_results_merchants')}</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.matchedBiz.map(biz => (
                                <button
                                  key={biz.id}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectBusiness) onSelectBusiness(biz);
                                    else setActiveTab('hepa');
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-black dark:text-white block">
                                      {biz.businessName}
                                    </span>
                                    <span className="text-[10px] text-black/70 dark:text-white/75">
                                      {biz.category} · {biz.district}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-black dark:text-white">
                                    SSM Disahkan
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Programs results (Youth can open grant modal; Admin views grant monitoring) */}
                        {searchResults.matchedProg.length > 0 && (
                          <div className="pt-2 border-t border-slate-300 dark:border-slate-600">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-black dark:text-white/75 px-2 mb-1 flex items-center gap-1.5">
                              <Award className="w-3 h-3" />
                              <span>{t('search_results_grants')}</span>
                            </div>
                            <div className="space-y-0.5">
                              {searchResults.matchedProg.map(prog => (
                                <button
                                  key={prog.id}
                                  type="button"
                                  onClick={() => {
                                    if (isYouth && onOpenGrantModal) onOpenGrantModal(prog.title, prog.grantAmount);
                                    else setActiveTab('ceed');
                                    setIsSearchOpen(false);
                                    setGlobalSearch('');
                                  }}
                                  className="w-full p-2 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-xs text-black dark:text-white block">
                                      {prog.title}
                                    </span>
                                    <span className="text-[10px] text-black/70 dark:text-white/75">
                                      {prog.category} · {prog.grantAmount}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-black dark:text-white">
                                    Bantuan
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-2.5 px-2 text-[11px] text-black/70 dark:text-white/75">
                    {isMentor
                      ? 'Taip modul Portal Mentor seperti sesi, perakuan, log atau profil.'
                      : 'Taip nama kiosk, produk usahawan, atau geran untuk carian pantas.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Mode Selector Dropdown (Mod Cerah / Mod Malam) */}
          <div ref={themeDropdownRef} className="relative">
            <button
              id="kbelia-darkmode-toggle"
              type="button"
              onClick={() => setThemeDropdownOpen(prev => !prev)}
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-2xs group focus:outline-none interactive-press hover:scale-105 active:scale-95 ${
                themeDropdownOpen
                  ? 'bg-amber-50 text-black border-amber-300 dark:bg-slate-700 dark:text-white dark:border-amber-500/50'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white/75 border-slate-300 dark:border-slate-600'
              }`}
              title="Pilih Mod Tema (Cerah / Malam)"
              aria-label="Pilih mod tema"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-black/70 dark:text-white/75 transition-transform duration-300 group-hover:rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-black/70 dark:text-white/75 transition-transform duration-300 group-hover:rotate-45" />
              )}
            </button>

            {/* Dropdown Menu below Theme Button */}
            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-extrabold text-black/70 dark:text-white/75 uppercase tracking-wider px-2.5 py-1 mb-1">
                  Pilihan Tema
                </div>

                {/* Mod Cerah Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    !isDark 
                      ? 'bg-blue-50 text-black dark:bg-blue-950/60 dark:text-white font-bold' 
                      : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-black/70 dark:text-white/75" />
                    <span>Mod Cerah</span>
                  </div>
                  {!isDark && <Check className="w-3.5 h-3.5 text-black dark:text-white/75" />}
                </button>

                {/* Mod Malam Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-blue-50 text-black dark:bg-blue-950/60 dark:text-white font-bold' 
                      : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-black/70 dark:text-white/75" />
                    <span>Mod Malam</span>
                  </div>
                  {isDark && <Check className="w-3.5 h-3.5 text-black dark:text-white/75" />}
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <NotificationDropdown onNavigateTab={(tab) => setActiveTab(tab as UMKTab)} />

            {/* Small Screen 3-Dots Overflow Menu */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  mobileMenuOpen 
                    ? 'bg-amber-50 text-black border-amber-300 dark:bg-slate-800 dark:text-white/75 dark:border-amber-400' 
                    : 'text-black dark:text-white hover:text-black hover:bg-amber-50 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600 dark:hover:text-white'
                }`}
                title="Pilihan Navigasi Lanjut"
                aria-label="Menu navigasi skrin kecil"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-extrabold text-black/70 dark:text-white/75 uppercase tracking-wider px-2.5 py-1 mb-1">
                    {t('nav_quick_nav')}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        activeTab === 'home' 
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-black dark:text-white border border-blue-200 dark:border-blue-800/70' 
                          : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Home className="w-4 h-4 text-black dark:text-white/75" />
                      <span>{t('nav_portal_main')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('news'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        activeTab === 'news' 
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-black dark:text-white border border-amber-200 dark:border-amber-800/70' 
                          : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Newspaper className="w-4 h-4 text-black dark:text-white/75" />
                      <span>News</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('community'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        activeTab === 'community' 
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-black dark:text-white border border-blue-200 dark:border-blue-800/70' 
                          : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <MessagesSquare className="w-4 h-4 text-black dark:text-white/75" />
                      <span>Komuniti</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('nav_admin_control')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('academic'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('nav_kiosk_approval')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('ceed'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('nav_grant_approval')}</span>
                        </button>
                      </>
                    )}

                    {isMentor && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('mentor'); onSelectMentorSubTab?.('overview'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-black dark:text-white/75" />
                          <span>Ringkasan Mentor</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('mentor'); onSelectMentorSubTab?.('sessions'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-black dark:text-white/75" />
                          <span>Sesi Bimbingan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('mentor'); onSelectMentorSubTab?.('endorsements'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-black dark:text-white/75" />
                          <span>Perakuan Geran</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('mentor'); onSelectMentorSubTab?.('logbook'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4 text-black dark:text-white/75" />
                          <span>Rekod Sesi</span>
                        </button>
                      </>
                    )}

                    {!isAdmin && userProfile?.role !== 'mentor' && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('merchant'); if (onSelectMerchantSubTab) onSelectMerchantSubTab('overview'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('dashboard')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('academic'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('nav_my_kiosk')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('merchant'); if (onSelectMerchantSubTab) onSelectMerchantSubTab('cashflow'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Coins className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('nav_sales_pos')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('ceed'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-black dark:text-white/75" />
                          <span>{t('grants')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            {user ? (
              <div ref={profileDropdownRef} className="relative">
              <button
                id="kbelia-user-profile-btn"
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 sm:pl-4 pr-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-600 hover:border-amber-300 cursor-pointer shadow-2xs group"
                title={`${displayName} - ${isAdmin ? 'Pentadbiran' : userProfile?.role === 'mentor' ? 'Mentor' : 'Usahawan'}`}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-black dark:text-white leading-tight whitespace-nowrap group-hover:text-black dark:group-hover:text-white transition-colors">
                    {displayName}
                  </div>
                  <div className="text-[10.5px] font-bold text-black dark:text-white/75 whitespace-nowrap">
                    {isAdmin ? 'Pentadbiran' : userProfile?.role === 'mentor' ? t('role_mentor') : t('role_youth')}
                  </div>
                </div>

                <img
                  src={avatarSrc}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-300 dark:border-slate-600 shadow-2xs shrink-0"
                />

                <ChevronDown className="w-3.5 h-3.5 text-black/70 dark:text-white/75 group-hover:text-black shrink-0 dark:group-hover:text-white" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl mb-2 border border-slate-300 dark:border-slate-600">
                    <div className="text-xs font-bold text-black dark:text-white truncate">{displayName}</div>
                    <div className="text-[11px] text-black/70 dark:text-white/75 truncate">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-black dark:text-white/75 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{isDemoSession ? 'Mod Demo Ujian' : t('active_session')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      id="kbelia-dropdown-setting-btn"
                      type="button"
                      onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                        activeTab === 'settings'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-black dark:text-white font-bold border border-indigo-200 dark:border-indigo-800/70'
                          : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-black dark:text-white/75' : 'text-black/70'}`} />
                        <span>{language === 'en' ? 'Account Settings' : 'Tetapan Akaun'}</span>
                      </div>
                    </button>

                    {/* QUICK ROLE SWITCHER STRICTLY RESTRICTED TO ISOLATED DEMO SESSIONS */}
                    {isDemoSession && (
                      <div className="pt-2 border-t border-slate-300 dark:border-slate-600 mt-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-black/70 dark:text-white/75 px-3 mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-black/70 dark:text-white/75" />
                          <span>Mod Demo Ujian</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 px-1">
                          <button
                            type="button"
                            onClick={() => {
                              loginAsDemoUser('merchant_faizul');
                              setActiveTab('merchant');
                              setProfileDropdownOpen(false);
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-colors cursor-pointer ${
                              !isAdmin && userProfile?.role !== 'mentor'
                                ? 'bg-teal-600 text-white dark:bg-teal-600'
                                : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white hover:bg-amber-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {t('role_youth')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              loginAsDemoUser('mentor_wanazhar');
                              setActiveTab('mentor');
                              setProfileDropdownOpen(false);
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-colors cursor-pointer ${
                              userProfile?.role === 'mentor'
                                ? 'bg-teal-600 text-white dark:bg-teal-600'
                                : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white hover:bg-amber-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {t('role_mentor')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              loginAsDemoUser('admin');
                              setActiveTab('admin');
                              setProfileDropdownOpen(false);
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] font-bold text-center transition-colors cursor-pointer ${
                              isAdmin
                                ? 'bg-blue-600 text-white font-black dark:bg-blue-600'
                                : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white hover:bg-amber-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {t('role_admin')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-300 dark:border-slate-600 mt-1.5 space-y-1">
                      <button
                        id="kbelia-dropdown-logout-btn"
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-bold text-black dark:text-white/75 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-black/70 dark:text-white/75" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="kbelia-header-login-btn"
              type="button"
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer dark:bg-blue-600"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>{t('login')}</span>
            </button>
          )}

        </div>

      </div>
    </div>

    {/* Confirmation Modal */}
    {showLogoutConfirm && (
      <div 
        id="kbelia-logout-confirm-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div 
          className="fixed inset-0" 
          onClick={() => setShowLogoutConfirm(false)}
        />
        <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-300 dark:border-slate-600 shadow-2xl text-center space-y-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 mx-auto flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-white">
              {t('logout_confirm_title')}
            </h3>
            <p className="text-xs text-black/70 dark:text-white/75 mt-1 leading-relaxed">
              {t('logout_confirm_desc')}
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              id="btn-logout-confirm-no"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-black dark:text-white bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              id="btn-logout-confirm-yes"
              onClick={async () => {
                await logout();
                setShowLogoutConfirm(false);
                setActiveTab('login');
              }}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer dark:bg-rose-600"
            >
              {t('confirm_logout')}
            </button>
          </div>
        </div>
      </div>
    )}
  </header>
  );
};
